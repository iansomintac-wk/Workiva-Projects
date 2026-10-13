/* Train intent + domain heads. node tests/train_cls.js [--eval test.jsonl] train*.jsonl  -> engine/cls-weights.json */
const fs = require('fs');
const path = require('path');
const C = require('../engine/classify.js');
const args = process.argv.slice(2);
const PRUNE = +(process.env.PRUNE || 0.15);
const ei = args.indexOf('--eval'); const evalFile = ei >= 0 ? args.splice(ei, 2)[1] : null;
const read = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const rows = args.flatMap(read);
let seed = 42; const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

function trainHead(X, y, labels, { epochs = 40, lr = 0.8, l2 = 5e-5 } = {}) {
  const K = labels.length, idx = y.map((l) => labels.indexOf(l));
  const w = new Map(), b = new Float64Array(K);
  const get = (i) => { let r = w.get(i); if (!r) { r = new Float64Array(K); w.set(i, r); } return r; };
  const order = X.map((_, i) => i);
  for (let ep = 0; ep < epochs; ep++) {
    for (let i = order.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
    const rate = lr / (1 + ep * 0.1);
    for (const n of order) {
      const x = X[n]; const z = new Float64Array(K);
      for (let c = 0; c < K; c++) { let s = b[c]; for (const [i, v] of x) { const r = w.get(i); if (r) s += r[c] * v; } z[c] = s; }
      const m = Math.max(...z); let sum = 0; for (let c = 0; c < K; c++) { z[c] = Math.exp(z[c] - m); sum += z[c]; }
      for (let c = 0; c < K; c++) {
        const g = z[c] / sum - (c === idx[n] ? 1 : 0);
        b[c] -= rate * g;
        for (const [i, v] of x) { const r = get(i); r[c] -= rate * (g * v + l2 * r[c]); }
      }
    }
  }
  const out = {};
  // compact: feature index -> flat [class, weight*100, class, weight*100, ...] (integers)
  for (const [i, r] of w) { const row = []; r.forEach((v, c) => { if (Math.abs(v) > PRUNE) row.push(c, Math.round(v * 100)); }); if (row.length) out[i] = row; }
  return { labels, b: [...b].map((v) => Math.round(v * 100)), w: out, scale: 100 };
}

const X = rows.map((r) => C.featurize(r.prompt));
const intentLabels = [...new Set(rows.map((r) => r.intent))].sort();
const domainLabels = ['FR', 'GRC', 'SUS', 'GEN'];
const raw = { intent: trainHead(X, rows.map((r) => r.intent), intentLabels), domain: trainHead(X, rows.map((r) => r.domain), domainLabels) };
const out = path.join(__dirname, '../engine/cls-weights.json');
fs.writeFileSync(out, JSON.stringify(raw));
const weights = C.unpack(raw);
console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');

if (evalFile) {
  const te = read(evalFile);
  let ok = { intent: 0, domain: 0 }, n = 0; const conf = [];
  const byConf = { hi: [0, 0], lo: [0, 0] };
  for (const r of te) {
    const c = C.classify(r.prompt, weights);
    if (c.domain.label === r.domain) ok.domain++;
    const W = require('../engine/rewrite.js'), R = require('../engine/rules.js');
    let lab = c.intent.label;
    if (lab === 'other' || c.intent.p < 0.35) { const g = W.intentOf(R.normalize(r.prompt), false, true); if (g) lab = g; }
    c.intent.label = lab;
    if (r.intent !== 'other') { n++; const hit = c.intent.label === r.intent; if (hit) ok.intent++; else conf.push(r.intent + '>' + c.intent.label); const b = c.intent.p >= 0.5 ? 'hi' : 'lo'; byConf[b][0]++; if (hit) byConf[b][1]++; }
  }
  console.log(`TEST intent ${(ok.intent / n).toFixed(3)} (n=${n})  domain ${(ok.domain / te.length).toFixed(3)}`);
  console.log(`intent when confident (p>=0.5): ${(byConf.hi[1] / byConf.hi[0]).toFixed(3)} on ${byConf.hi[0]}; unsure: ${(byConf.lo[1] / byConf.lo[0]).toFixed(3)} on ${byConf.lo[0]}`);
  const counts = {}; conf.forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
  console.log('top confusions', Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6));
}
