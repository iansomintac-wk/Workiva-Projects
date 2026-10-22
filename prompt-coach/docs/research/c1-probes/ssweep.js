// Source "sure" cut-off sensitivity in a probe copy (in-sample on training; test/sim/r1 only read, never used to pick).
const R = process.argv[2]; const fs = require('fs'), path = require('path');
const M = require(path.join(R, 'engine/model.js')), W = require(path.join(R, 'engine/rewrite.js')), C = require(path.join(R, 'engine/classify.js'));
const w = JSON.parse(fs.readFileSync(path.join(R, 'engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(R, 'engine/cls-weights.json'))));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const K = ['S','C','O','P','E'];
const isStrong = (r) => K.every(k => r[k] === 1) && !r.stacked;
const train = fs.readdirSync(path.join(R, 'data')).filter(f => /^train_.*\.jsonl$/.test(f)).flatMap(f => rd('data/' + f));
const sets = { r1: rd('data/done_when_strong.jsonl'), test: rd('data/test.jsonl').filter(r => !isStrong(r)), sim: rd('data/sim_customers.jsonl').filter(r => !isStrong(r)) };
const base = w.sure.S;
for (const s of [base, 0.97, 0.95, 0.9, 0.8]) {
  const ww = { ...w, sure: { ...w.sure, S: s } };
  const detect = (p) => { const r = M.predict(p, ww, { mode: ww.mode }); return { on: r.on, prob: r.prob, sure: r.sure, d: r.rules }; };
  const nc = (rows) => rows.filter(r => W.coach(r.prompt, { files: [], detect, ...C.pick(r.prompt, CLS) }).noChanges).length;
  const non = train.filter(r => !isStrong(r));
  const fsure = non.filter(r => { const p = M.predict(r.prompt, ww, { mode: ww.mode }).prob; return K.every(k => p[k] >= ww.sure[k]); }).length;
  console.log(`S=${s}: train false sure (in-sample) ${fsure}/${non.length} = ${(100 * fsure / non.length).toFixed(1)}% | r1 ${nc(sets.r1)}/30 | test ${nc(sets.test)}/247 | sim ${nc(sets.sim)}/111`);
}
