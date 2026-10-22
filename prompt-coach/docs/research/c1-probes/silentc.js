// In a state-C probe copy: rows that get "No changes needed" with ZERO Context hits. Can a training-only signal
// (word count, total rule hits) split strong from non-strong among them? No prompt text printed.
const R = process.argv[2]; const fs = require('fs'), path = require('path');
const M = require(path.join(R, 'engine/model.js')), W = require(path.join(R, 'engine/rewrite.js')), C = require(path.join(R, 'engine/classify.js'));
const w = JSON.parse(fs.readFileSync(path.join(R, 'engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(R, 'engine/cls-weights.json'))));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const K = ['S','C','O','P','E'];
const isStrong = (r) => K.every(k => r[k] === 1) && !r.stacked;
const pred = (p) => M.predict(p, w, { mode: w.mode });
const detect = (p) => { const r = pred(p); return { on: r.on, prob: r.prob, sure: r.sure, d: r.rules }; };
const train = fs.readdirSync(path.join(R, 'data')).filter(f => /^train_.*\.jsonl$/.test(f)).flatMap(f => rd('data/' + f));
const sets = { train, r1: rd('data/done_when_strong.jsonl'), test: rd('data/test.jsonl'), sim: rd('data/sim_customers.jsonl') };
const q = (a) => { const s = [...a].sort((x, y) => x - y); return a.length ? `n=${a.length} min ${s[0]} med ${s[s.length >> 1]} max ${s[s.length - 1]}` : 'n=0'; };
for (const [name, rows] of Object.entries(sets)) {
  const g = { strong: { wc: [], hits: [] }, non: { wc: [], hits: [] } };
  for (const row of rows) {
    const r = pred(row.prompt);
    if (r.rules.el.C.hits.length) continue;
    const o = W.coach(row.prompt, { files: [], detect, ...C.pick(row.prompt, CLS) });
    if (!o.noChanges) continue;
    const b = name === 'r1' || isStrong(row) ? g.strong : g.non;
    b.wc.push(row.prompt.split(/\s+/).filter(Boolean).length);
    b.hits.push(K.reduce((a, k) => a + r.rules.el[k].hits.length, 0));
  }
  console.log(`${name}: zero-C noChanges | strong words ${q(g.strong.wc)} hits ${q(g.strong.hits)} | non-strong words ${q(g.non.wc)} hits ${q(g.non.hits)}`);
}
