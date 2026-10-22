// Which letter blocks "sure" per r1 row (no prompt text printed), plus training gaps per letter. Run in a probe copy.
const R = process.argv[2]; const fs = require('fs'), path = require('path');
const M = require(path.join(R, 'engine/model.js')), W = require(path.join(R, 'engine/rewrite.js')), C = require(path.join(R, 'engine/classify.js'));
const w = JSON.parse(fs.readFileSync(path.join(R, 'engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(R, 'engine/cls-weights.json'))));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const K = ['S','C','O','P','E'];
const pred = (p) => M.predict(p, w, { mode: w.mode });
const detect = (p) => { const r = pred(p); return { on: r.on, prob: r.prob, sure: r.sure, d: r.rules }; };
const hits = (r, k) => r.rules.el[k].hits.length;
const tally = {};
rd('data/done_when_strong.jsonl').forEach((row, i) => {
  const o = W.coach(row.prompt, { files: [], detect, ...C.pick(row.prompt, CLS) });
  if (o.noChanges) return;
  const r = pred(row.prompt);
  const block = K.filter(k => r.prob[k] < w.sure[k]).map(k => `${k}${r.prob[k].toFixed(2)}/h${hits(r, k)}`);
  const why = `grade=${o.grade} block=[${block.join(' ')}]`;
  console.log(`r1#${i + 1} ${why}`);
  K.filter(k => r.prob[k] < w.sure[k]).forEach(k => { tally[k] = (tally[k] || 0) + 1; });
});
console.log('r1 blocking letter counts', JSON.stringify(tally));
const train = fs.readdirSync(path.join(R, 'data')).filter(f => /^train_.*\.jsonl$/.test(f)).flatMap(f => rd('data/' + f));
for (const k of K) {
  const pos = train.filter(r => r[k] === 1); const zero = pos.filter(r => hits(pred(r.prompt), k) === 0).length;
  const strong = train.filter(r => K.every(x => r[x] === 1) && !r.stacked);
  const below = strong.filter(r => pred(r.prompt).prob[k] < w.sure[k]).length;
  console.log(`train ${k}: label=1 with zero hits ${zero}/${pos.length}; strong rows below ${k} sure ${below}/${strong.length}`);
}
