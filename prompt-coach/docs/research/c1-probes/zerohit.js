// Training rows with Context=1 and zero Context cue hits. Reads only data/train_*.jsonl; throws on any other file name.
// usage: node zerohit.js <prompt-coach dir>
const fs = require('fs'), path = require('path');
const TRAIN = /^train_[A-Za-z0-9_]+\.jsonl$/;
function readTrainRows(R, name) {
  if (!TRAIN.test(name)) throw new Error('zerohit: refusing to read non-training file ' + name);
  return fs.readFileSync(path.join(R, 'data', name), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
}
function main(R) {
  const M = require(path.join(R, 'engine/model.js'));
  const w = JSON.parse(fs.readFileSync(path.join(R, 'engine/weights.json')));
  const hits = (p) => M.predict(p, w, { mode: w.mode }).rules.el.C.hits.length;
  const files = fs.readdirSync(path.join(R, 'data')).filter(f => TRAIN.test(f));
  const pos = files.flatMap(f => readTrainRows(R, f)).filter(r => r.C === 1);
  const zero = pos.filter(r => hits(r.prompt) === 0);
  zero.forEach((r, i) => console.log(`#${i + 1} ${r.prompt}`));
  // cue precision watch: context-0 rows that nevertheless hit a C cue
  const neg = files.flatMap(f => readTrainRows(R, f)).filter(r => r.C === 0);
  const negHit = neg.filter(r => hits(r.prompt) > 0).length;
  console.log(`context-0 rows with any C hit: ${negHit}/${neg.length}`);
  console.log(`zero-hit C rows: ${zero.length}/${pos.length}`);
}
module.exports = { readTrainRows };
if (require.main === module) main(process.argv[2]);
