// Counts only, no prompt text. Reads r1, test, sim from the repo; never the fresh set.
// usage: node tierprobe.js <prompt-coach dir>
const R = process.argv[2]; const fs = require('fs'), path = require('path');
const M = require(path.join(R, 'engine/model.js')), W = require(path.join(R, 'engine/rewrite.js')), C = require(path.join(R, 'engine/classify.js'));
const w = JSON.parse(fs.readFileSync(path.join(R, 'engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(R, 'engine/cls-weights.json'))));
const rd = (f) => { if (/done_when_strong\.jsonl$/.test(f)) throw new Error('fresh set'); return fs.readFileSync(path.join(R, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l)); };
const K = ['S', 'C', 'O', 'P', 'E'];
const detect = (p) => { const r = M.predict(p, w, { mode: w.mode }); return { on: r.on, prob: r.prob, sure: r.sure, d: r.rules }; };
const sets = [['r1', 'data/done_when_strong_r1.jsonl', true], ['test', 'data/test.jsonl', false], ['sim', 'data/sim_customers.jsonl', false]];
for (const [name, rel, allStrong] of sets) {
  const t = { rows: 0, strong: 0, non: 0, czS: 0, czN: 0, czS_nc: 0, czN_nc: 0, nc: 0, ncN: 0,
    T1: [0, 0], T2: [0, 0], T3: [0, 0], T3c: [0, 0], blk: {} };
  for (const row of rd(rel)) {
    const strong = allStrong || (K.every(k => row[k] === 1) && row.stacked !== 1);
    const o = W.coach(row.prompt, { files: [], detect, ...C.pick(row.prompt, CLS) });
    const r = M.predict(row.prompt, w, { mode: w.mode });
    const cz = r.rules.el.C.hits.length === 0;
    const below = K.filter(k => r.prob[k] < w.sure[k]);
    const plain = !o.stacked && !o.offtopic;
    t.rows++; strong ? t.strong++ : t.non++;
    if (cz) strong ? t.czS++ : t.czN++;
    if (cz && o.noChanges) strong ? t.czS_nc++ : t.czN_nc++;
    if (o.noChanges) { t.nc++; if (!strong) t.ncN++; continue; }
    const i = strong ? 0 : 1;
    // T1: graded strong, not sure on some letter (any number)
    if (plain && o.grade === 'strong') t.T1[i]++;
    // T2: exactly one letter below its sure cut-off, any grade
    if (plain && below.length === 1) { t.T2[i]++; const k = below[0]; t.blk[k] = (t.blk[k] || 0) + (strong ? 1 : 0); }
    // T3: exactly one letter below sure and it is Context
    if (plain && below.length === 1 && below[0] === 'C') { t.T3[i]++; if (cz) t.T3c[i]++; }
  }
  console.log(`${name}: rows=${t.rows} strong=${t.strong} non=${t.non} | zeroC strong=${t.czS} (noChanges ${t.czS_nc}) non=${t.czN} (noChanges ${t.czN_nc}) | noChanges all=${t.nc} non=${t.ncN}`);
  console.log(`${name}: tier landings among rows NOT noChanges [strong, non]: T1 grade-strong-not-sure=${t.T1} T2 one-letter-below=${t.T2} T3 only-C-below=${t.T3} (of which zeroC ${t.T3c}) | T2 strong by letter ${JSON.stringify(t.blk)}`);
}
