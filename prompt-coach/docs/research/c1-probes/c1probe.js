// Read-only diagnostic probe for the C1 miss. Never reads data/done_when_strong.jsonl (held-out).
const R = process.argv[2]; const fs = require('fs'), path = require('path');
const M = require(path.join(R, 'engine/model.js'));
const w = JSON.parse(fs.readFileSync(path.join(R, 'engine/weights.json')));
const K = ['S','C','O','P','E'];
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const P = (p) => M.predict(p, w, { mode: w.mode });
// 1. r1 strong-30 (dev, already seen): which letters block "sure", C prob and C rule tags
const r1 = rd('data/done_when_strong_r1.jsonl');
const tagCount = {}; const probC = {};
r1.forEach((row, i) => {
  const r = P(row.prompt); const fail = K.filter(k => r.prob[k] < w.sure[k]);
  const pc = r.prob.C.toFixed(3); probC[pc] = (probC[pc] || 0) + 1;
  if (fail.includes('C')) for (const h of r.el.C.hits) tagCount[h.tag] = (tagCount[h.tag] || 0) + 1;
  console.log(`r1#${i} ${row.domain} fail=${fail.join('') || '-'} stacked=${r.stacked ? 1 : 0} C=${pc} Ctags=${r.el.C.hits.map(h => h.tag).join(',') || 'none'}`);
});
console.log('r1 C prob histogram', JSON.stringify(probC));
console.log('C tags on r1 rows failing C', JSON.stringify(tagCount));
// 2. Context weights: bias and per-tag weight
console.log('C bias', w.w.C.b, 'C weights', JSON.stringify(w.w.C.v).slice(0, 600));
// 3. Diagnostic sweep (sure-gate only, not the full coach): rows with all letters >= cut-offs, C cut-off varied
const sets = { test: rd('data/test.jsonl'), sim: rd('data/sim_customers.jsonl') };
const isStrong = (row) => K.every(k => row[k] === 1) && !row.stacked;
for (const c of [0.70, 0.66, 0.65, 0.62, 0.60, 0.55]) {
  const cut = { ...w.sure, C: c };
  const pass = (p) => { const r = P(p); return !r.stacked && K.every(k => r.prob[k] >= cut[k]); };
  const line = [`C>=${c}`, `r1 sure ${r1.filter(x => pass(x.prompt)).length}/30`];
  for (const [n, rows] of Object.entries(sets)) { const non = rows.filter(x => !isStrong(x)); line.push(`${n} non-strong sure ${non.filter(x => pass(x.prompt)).length}/${non.length}`); }
  console.log(line.join(' | '));
}
