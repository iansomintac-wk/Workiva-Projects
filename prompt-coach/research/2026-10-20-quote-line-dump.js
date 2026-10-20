/* node research/2026-10-20-quote-line-dump.js <engineDir> > rows.jsonl
   Every train row: grade, headline and the three stage prompts and verdicts, shipped detector (with prob), engine from <engineDir>. Reads data/train_*.jsonl only. */
const fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2]), ROOT = path.join(__dirname, '..');
const M = require(dir + '/model.js'), W = require(dir + '/rewrite.js'), C = require(dir + '/classify.js');
const weights = JSON.parse(fs.readFileSync(dir + '/weights.json')), CLS = C.unpack(JSON.parse(fs.readFileSync(dir + '/cls-weights.json')));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, prob: r.prob, d: r.rules }; };
for (const d of ['fr', 'grc', 'sus', 'hard']) fs.readFileSync(path.join(ROOT, 'data/train_' + d + '.jsonl'), 'utf8').split('\n').filter((l) => l.trim()).forEach((l, i) => {
  const r = JSON.parse(l), o = W.coach(r.prompt, { files: [], detect, ...C.pick(r.prompt, CLS) });
  console.log(JSON.stringify({ src: 'train_' + d + ':' + (i + 1), grade: o.grade, headline: o.headline, stages: o.stages }));
});
