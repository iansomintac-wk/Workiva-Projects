/* Train per-element logistic regression. node tests/train.js <mode: model|hybrid> [--cv 5] train1.jsonl ...
   Writes engine/weights.json (sparse, rounded) unless --cv is given. */
const fs = require('fs');
const path = require('path');
const M = require('../engine/model.js');
const K = ['S', 'C', 'O', 'P', 'E'];

const args = process.argv.slice(2);
const mode = args.shift();
const cvIdx = args.indexOf('--cv');
const cv = cvIdx >= 0 ? +args.splice(cvIdx, 2)[1] : 0;
if (args.includes('--tune')) args.splice(args.indexOf('--tune'), 1);
const out = args.indexOf('--out') >= 0 ? args.splice(args.indexOf('--out'), 2)[1] : path.join(__dirname, '../engine/weights.json');
const rows = args.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)));

let seed = 12345;
function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const R = require('../engine/rules.js');
function train(data, opts = {}) {
  // average of several seeded runs: same answer every build, less variance
  const runs = opts.runs || 5, acc = {};
  for (let r = 0; r < runs; r++) {
    seed = 1000 + r * 7919;
    const W = trainOnce(data, opts);
    for (const k of K) { acc[k] = acc[k] || { b: 0, v: {} }; acc[k].b += W.w[k].b / runs; for (const [i, x] of Object.entries(W.w[k].v)) acc[k].v[i] = (acc[k].v[i] || 0) + x / runs; }
  }
  for (const k of K) { for (const i of Object.keys(acc[k].v)) { const x = +acc[k].v[i].toFixed(3); if (Math.abs(x) < 0.002) delete acc[k].v[i]; else acc[k].v[i] = x; } acc[k].b = +acc[k].b.toFixed(4); }
  return { mode, w: acc, thr: Object.fromEntries(K.map((k) => [k, 0.5])) };
}
function trainOnce(data, { epochs = 30, lr = 0.5, l2 = 1e-4 } = {}) {
  const F = data.map((r) => M.featurize(r.prompt, { mode }));
  const w = {};
  for (const k of K) {
    const v = new Float64Array(M.DIM); let b = 0;
    const pos = data.filter((r) => r[k]).length, neg = data.length - pos;
    const wPos = data.length / (2 * Math.max(pos, 1)), wNeg = data.length / (2 * Math.max(neg, 1)); // class balance
    const X = F.map((f) => (f.per ? f.per[k] : f.x));
    const order = data.map((_, i) => i);
    for (let ep = 0; ep < epochs; ep++) {
      for (let i = order.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
      const rate = lr / (1 + ep * 0.15);
      for (const i of order) {
        const x = X[i]; let z = b; for (const [h, val] of x) z += v[h] * val;
        const p = 1 / (1 + Math.exp(-z)), y = data[i][k] ? 1 : 0;
        const g = (p - y) * (y ? wPos : wNeg);
        b -= rate * g;
        for (const [h, val] of x) v[h] -= rate * (g * val + l2 * v[h]);
      }
    }
    const sparse = {}; for (let i = 0; i < v.length; i++) if (Math.abs(v[i]) > 0.002) sparse[i] = +v[i].toFixed(3);
    w[k] = { b: +b.toFixed(4), v: sparse };
  }
  return { mode, w, thr: Object.fromEntries(K.map((k) => [k, 0.5])) };
}

if (cv) {
  seed = 99; const idx = rows.map((_, i) => i).sort(() => rand() - 0.5);
  const agg = Object.fromEntries(K.map((k) => [k, { tp: 0, fp: 0, fn: 0 }])); let gOk = 0;
  const R = require('../engine/rules.js');
  for (let f = 0; f < cv; f++) {
    const testI = new Set(idx.filter((_, j) => j % cv === f));
    const tr = rows.filter((_, i) => !testI.has(i)), te = rows.filter((_, i) => testI.has(i));
    const W = train(tr);
    for (const r of te) {
      const p = M.predict(r.prompt, W, { mode });
      for (const k of K) { const y = !!r[k], yh = p.on[k]; if (y && yh) agg[k].tp++; else if (yh) agg[k].fp++; else if (y) agg[k].fn++; }
      if (R.grade(p.on) === R.grade(Object.fromEntries(K.map((k) => [k, !!r[k]])))) gOk++;
    }
  }
  for (const k of K) { const s = agg[k], p = s.tp / (s.tp + s.fp), r = s.tp / (s.tp + s.fn); console.log(`${k} P=${p.toFixed(3)} R=${r.toFixed(3)} F1=${(2 * p * r / (p + r)).toFixed(3)}`); }
  console.log(`CV(${cv}) mode=${mode} grade acc=${(gOk / rows.length).toFixed(3)}`);
} else {
  const W = train(rows);
  if (process.argv.includes('--tune')) {
    // out-of-fold probabilities -> per-letter thresholds that maximize grade accuracy on training data
    seed = 7; const idx = rows.map((_, i) => i).sort(() => rand() - 0.5); const folds = 5; const oof = new Array(rows.length);
    for (let f = 0; f < folds; f++) {
      const teI = new Set(idx.filter((_, j) => j % folds === f));
      const Wf = train(rows.filter((_, i) => !teI.has(i)), { runs: 3 });
      for (const i of teI) oof[i] = M.predict(rows[i].prompt, Wf, { mode }).prob;
    }
    const gold = rows.map((r) => R.grade(Object.fromEntries(K.map((k) => [k, !!r[k]]))));
    const thr = Object.fromEntries(K.map((k) => [k, 0.5]));
    const score = () => oof.reduce((a, p, i) => a + (R.grade(Object.fromEntries(K.map((k) => [k, p[k] >= thr[k]]))) === gold[i] ? 1 : 0), 0);
    for (let pass = 0; pass < 3; pass++) for (const k of K) {
      let best = thr[k], bs = -1;
      for (let t = 0.3; t <= 0.701; t += 0.025) { thr[k] = t; const sc = score(); if (sc > bs) { bs = sc; best = +t.toFixed(3); } }
      thr[k] = best;
    }
    W.thr = thr; console.log('tuned thresholds', JSON.stringify(thr), 'oof grade acc', (score() / rows.length).toFixed(3));
  }
  fs.writeFileSync(out, JSON.stringify(W));
  console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB', K.map((k) => k + ':' + Object.keys(W.w[k].v).length).join(' '));
}
