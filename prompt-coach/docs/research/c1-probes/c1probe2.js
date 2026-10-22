// Read-only probe 2. Never reads data/done_when_strong.jsonl.
const R = process.argv[2]; const fs = require('fs'), path = require('path');
const M = require(path.join(R, 'engine/model.js')), W = require(path.join(R, 'engine/rewrite.js')), C = require(path.join(R, 'engine/classify.js'));
const w = JSON.parse(fs.readFileSync(path.join(R, 'engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(R, 'engine/cls-weights.json'))));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const detect = (p) => { const r = M.predict(p, w, { mode: w.mode }); return { on: r.on, prob: r.prob, sure: r.sure, d: r.rules }; };
// 1. zero Context hits, by label, per set
const sets = { train: ['train_fr','train_grc','train_sus','train_hard'].flatMap(f => rd(`data/${f}.jsonl`)), test: rd('data/test.jsonl'), sim: rd('data/sim_customers.jsonl') };
for (const [n, rows] of Object.entries(sets)) {
  const z = { 1: [0, 0], 0: [0, 0] };
  for (const r of rows) { const p = M.predict(r.prompt, w, { mode: w.mode }); const lab = r.C ? 1 : 0; z[lab][1]++; if (!p.el.C.hits.length) z[lab][0]++; }
  console.log(`${n}: C=1 rows with zero C hits ${z[1][0]}/${z[1][1]} | C=0 rows with zero C hits ${z[0][0]}/${z[0][1]}`);
}
// 2. what the coach shows for the r1 rows that fail
const r1 = rd('data/done_when_strong_r1.jsonl');
const FILESsrc = fs.readFileSync(path.join(R, 'tests/customer_check.js'), 'utf8');
let same = 0, n = 0;
r1.forEach((row, i) => {
  const o = W.coach(row.prompt, { files: [], detect, ...C.pick(row.prompt, CLS) });
  if (o.noChanges) return; n++;
  const b = o.stages.better.prompt.trim() === row.prompt.trim(), s = o.stages.strong.prompt.trim() === row.prompt.trim();
  if (b) same++;
  const added = o.stages.strong.prompt.replace(row.prompt.trim(), '').trim().slice(0, 160);
  console.log(`r1#${i} grade=${o.grade} betterUntouched=${b} strongUntouched=${s} headline="${String(o.headline).slice(0,90)}" strongAdds="${added}"`);
});
console.log(`not-noChanges ${n}, Better untouched ${same}`);
