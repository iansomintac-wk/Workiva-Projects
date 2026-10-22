// Probe 3: "left untouched" rate (Better and Strong equal the input) on non-strong rows. Never reads done_when_strong.jsonl.
const R = process.argv[2]; const fs = require('fs'), path = require('path');
const M = require(path.join(R, 'engine/model.js')), W = require(path.join(R, 'engine/rewrite.js')), C = require(path.join(R, 'engine/classify.js'));
const w = JSON.parse(fs.readFileSync(path.join(R, 'engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(R, 'engine/cls-weights.json'))));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const detect = (p) => { const r = M.predict(p, w, { mode: w.mode }); return { on: r.on, prob: r.prob, sure: r.sure, d: r.rules }; };
const K = ['S','C','O','P','E'];
const isStrong = (row) => K.every(k => row[k] === 1) && !row.stacked;
for (const f of ['data/test.jsonl', 'data/sim_customers.jsonl', 'data/done_when_strong_r1.jsonl']) {
  const rows = rd(f).filter(r => f.includes('r1') || !isStrong(r));
  let nc = 0, untouched = 0, gradeStrong = 0, strongUntouchedNotNC = 0;
  for (const r of rows) {
    const o = W.coach(r.prompt, { files: [], detect, ...C.pick(r.prompt, CLS) });
    const u = o.stages.better.prompt.trim() === r.prompt.trim() && o.stages.strong.prompt.trim() === r.prompt.trim();
    if (o.noChanges) nc++; if (u) untouched++; if (o.grade === 'strong') gradeStrong++;
    if (o.grade === 'strong' && u && !o.noChanges) strongUntouchedNotNC++;
  }
  console.log(`${f} rows=${rows.length}${f.includes('r1') ? ' (all strong)' : ' (non-strong only)'}: noChanges ${nc} | grade strong ${gradeStrong} | both stages untouched ${untouched} | strong+untouched but no label ${strongUntouchedNotNC}`);
}
