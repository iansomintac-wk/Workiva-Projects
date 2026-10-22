// Counts only. For non-strong rows landing in a one-letter tier: is the flagged letter the only label missing?
const R = process.argv[2]; const fs = require('fs'), path = require('path');
const M = require(path.join(R, 'engine/model.js')), W = require(path.join(R, 'engine/rewrite.js')), C = require(path.join(R, 'engine/classify.js'));
const w = JSON.parse(fs.readFileSync(path.join(R, 'engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(R, 'engine/cls-weights.json'))));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const K = ['S', 'C', 'O', 'P', 'E'];
const detect = (p) => { const r = M.predict(p, w, { mode: w.mode }); return { on: r.on, prob: r.prob, sure: r.sure, d: r.rules }; };
for (const [name, rel] of [['test', 'data/test.jsonl'], ['sim', 'data/sim_customers.jsonl']]) {
  const out = { T2: { exact: 0, stackedOnly: 0, other: 0 }, T3: { exact: 0, stackedOnly: 0, other: 0 } };
  for (const row of rd(rel)) {
    if (K.every(k => row[k] === 1) && row.stacked !== 1) continue;
    const o = W.coach(row.prompt, { files: [], detect, ...C.pick(row.prompt, CLS) });
    if (o.noChanges || o.stacked || o.offtopic) continue;
    const r = M.predict(row.prompt, w, { mode: w.mode });
    const below = K.filter(k => r.prob[k] < w.sure[k]); if (below.length !== 1) continue;
    const miss = K.filter(k => row[k] !== 1);
    const cls = miss.length === 1 && miss[0] === below[0] && row.stacked !== 1 ? 'exact' : miss.length === 0 ? 'stackedOnly' : 'other';
    out.T2[cls]++; if (below[0] === 'C') out.T3[cls]++;
  }
  console.log(name, JSON.stringify(out));
}
