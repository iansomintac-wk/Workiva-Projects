/* Rows where a card keyword hits but the task's step is missing from the card.
   Tune set and half A only (both tuned on). Selection copied from
   docs/evidence/2026-10-20-fit-finder-no-card-probe.js ("keyword but no shared step").
   node tools/ops-rows.js */
const fs = require('fs'), path = require('path');
const ff = path.resolve(__dirname, '..');
const cat = JSON.parse(fs.readFileSync(path.join(ff, 'data/catalogue.json'), 'utf8'));
const { rate, match, normalize, AI_OPS } = require(path.join(ff, 'engine/fit.js'));
const jl = (f) => fs.readFileSync(path.join(ff, f), 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));

const tune = jl('data/synth/2026-10-18-tune.jsonl'), tg = new Map(jl('data/card-gold-synth-tune.jsonl').map((g) => [g.id, g]));
const tasks = new Map(jl('data/tasks.jsonl').map((t) => [t.id, t]));
const rows = tune.map((r) => ({ id: r.id, task: r.task, fit: tg.get(r.id).fit, cards: tg.get(r.id).cards }))
  .concat(jl('data/card-gold-a.jsonl').map((g) => ({ id: g.id, task: tasks.get(g.id).task, fit: 'good', cards: g.cards })));

let n = 0;
for (const r of rows) {
  if (r.fit === 'not' || !r.cards.length || match(r.task, cat).length) continue;
  const rt = rate(r.task);
  if (rt.fit === 'not') continue;
  const ai = rt.ops.filter((o) => AI_OPS.includes(o) && o !== 'READ');
  if (!ai.length) continue;
  const t = normalize(r.task);
  if (/e-?mail/.test(t) && rt.ops.length === 1 && rt.ops[0] === 'DRAFT') continue;
  const hit = cat.useCases.filter((u) => new RegExp('\\b(?:' + u.match + ')').test(t));
  if (!hit.length) continue;
  const have = new Set([].concat(...hit.map((u) => u.ops)));
  console.log(JSON.stringify({ id: r.id, task: r.task, hitCards: hit.map((u) => u.id), missing: ai.filter((o) => !have.has(o)) }));
  n++;
}
console.log('qualifying rows ' + n);
process.exit(n ? 0 : 1);
