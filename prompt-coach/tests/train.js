/* Train per-element logistic regression. node tests/train.js <mode: model|hybrid> [--cv 5] train1.jsonl ...
   Writes engine/weights.json (sparse, rounded) unless --cv is given. */
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const M = require('../engine/model.js');
const K = ['S', 'C', 'O', 'P', 'E'];

const args = process.argv.slice(2);
const mode = args.shift();
const cvIdx = args.indexOf('--cv');
const cv = cvIdx >= 0 ? +args.splice(cvIdx, 2)[1] : 0;
if (args.includes('--tune')) args.splice(args.indexOf('--tune'), 1);
const tuneSure = args.includes('--tune-sure');
if (tuneSure) args.splice(args.indexOf('--tune-sure'), 1);
const out = args.indexOf('--out') >= 0 ? args.splice(args.indexOf('--out'), 2)[1] : path.join(__dirname, '../engine/weights.json');
if (tuneSure) for (const f of args) assert.ok(/(^|[\/])train_[^\/]*.jsonl$/.test(f), 'tune-sure reads data/train_*.jsonl only, refusing ' + f); // never test.jsonl, sim_customers.jsonl or done_when_strong.jsonl
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

if (tuneSure) {
  // Does not retrain. Out-of-fold probabilities (seed 7) with the trained weights' hyper-parameters, then the "sure" cut-offs by this rule:
  // for each Context cut-off C on the 0.01 grid from 0.50 up, search S in {0.95..0.99} and O, P, E on the 0.05 grid 0.10..0.95 (loop order C, S, O, P, E, each ascending);
  // keep the set with the most strong rows sure whose false sure (non-strong row with every letter at or above its cut-off) is <= 3% of non-strong rows (first found wins ties);
  // pick the LOWEST C whose best set keeps at least as many strong training rows sure as the cut-offs already in weights.json.
  // Context is the letter strong prompts miss on. Training data only; no strong set, test.jsonl or sim_customers.jsonl.
  const base = JSON.parse(fs.readFileSync(out, 'utf8')); const today = base.sure; delete base.sure;
  assert.ok(today, 'weights.json needs sure cut-offs to compare against');
  seed = 7; const idx = rows.map((_, i) => i).sort(() => rand() - 0.5); const folds = 5; const oof = new Array(rows.length);
  for (let f = 0; f < folds; f++) {
    const teI = new Set(idx.filter((_, j) => j % folds === f));
    const Wf = train(rows.filter((_, i) => !teI.has(i)), { runs: 3 });
    for (const i of teI) oof[i] = M.predict(rows[i].prompt, Wf, { mode }).prob;
  }
  const strong = rows.map((r) => K.every((k) => r[k]) && !r.stacked);
  const nStrong = strong.filter(Boolean).length, nNon = rows.length - nStrong;
  const count = (cut) => { let f = 0, t = 0; rows.forEach((_, i) => { if (K.every((k) => oof[i][k] >= cut[k])) { if (strong[i]) t++; else f++; } }); return { fs: f, ts: t }; };
  const show = (name, cut, c) => console.log(name, JSON.stringify(cut), `false sure ${c.fs}/${nNon} (${(100 * c.fs / nNon).toFixed(2)}%), strong sure ${c.ts}/${nStrong}`);
  const t0 = count(today); show('today', today, t0);
  const g5 = []; for (let v = 10; v <= 95; v += 5) g5.push(v / 100);
  const maxFalse = Math.floor(0.03 * nNon + 1e-9);
  let cut = null, c = null;
  for (let ci = 50; ci <= 99 && !cut; ci++) {
    const C = ci / 100; let best = null;
    for (const S of [0.95, 0.96, 0.97, 0.98, 0.99]) {
      const pool = rows.map((_, i) => i).filter((i) => oof[i].S >= S && oof[i].C >= C);
      for (const O of g5) { const p1 = pool.filter((i) => oof[i].O >= O);
        for (const P of g5) { const p2 = p1.filter((i) => oof[i].P >= P);
          for (const E of g5) { let f = 0, t = 0; for (const i of p2) if (oof[i].E >= E) { if (strong[i]) t++; else f++; }
            if (f <= maxFalse && (!best || t > best.ts)) best = { ts: t, fs: f, cut: { S, C, O, P, E } }; } } }
    }
    if (best && best.ts >= t0.ts) { cut = best.cut; c = { fs: best.fs, ts: best.ts }; }
  }
  if (!cut) throw new Error('no Context cut-off keeps the current strong rows sure');
  show('picked', cut, c);
  const txt = fs.readFileSync(out, 'utf8').replace(/,"sure":{[^}]*}/, '');
  fs.writeFileSync(out, txt.replace(/}(s*)$/, ',"sure":' + JSON.stringify(cut) + '}$1'));
  console.log('wrote sure to', out);
} else if (cv) {
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
