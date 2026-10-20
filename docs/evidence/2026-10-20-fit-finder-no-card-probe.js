/* Read-only probe: why does a fitting task get no card? Tune set + half A only (both tuned on).
   node docs/evidence/2026-10-20-fit-finder-no-card-probe.js fit-finder [--rows] */
const fs = require('fs'), path = require('path');
const ff = path.resolve(process.argv[2] || 'fit-finder');
const cat = JSON.parse(fs.readFileSync(path.join(ff, 'data/catalogue.json'), 'utf8'));
const { rate, match, normalize, AI_OPS, lead } = require(path.join(ff, 'engine/fit.js'));
const jl = (f) => fs.readFileSync(path.join(ff, f), 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const byId = new Map(cat.useCases.map((u) => [u.id, u]));

// sets: tune (gold has fit) and half A (tasks.jsonl ids in card-gold-a; fit taken as not-'not' since gold lists only fits)
const tune = jl('data/synth/2026-10-18-tune.jsonl'), tg = new Map(jl('data/card-gold-synth-tune.jsonl').map((g) => [g.id, g]));
const tasks = new Map(jl('data/tasks.jsonl').map((t) => [t.id, t]));
const ga = jl('data/card-gold-a.jsonl');
const sets = {
  tune: tune.map((r) => ({ id: r.id, task: r.task, fit: tg.get(r.id).fit, cards: tg.get(r.id).cards })),
  halfA: ga.map((g) => ({ id: g.id, task: tasks.get(g.id).task, fit: 'good', cards: g.cards })),
};

const AREA_WORDS = {
  SUS: /\b(?:sustainab\w*|esg|emissions?|scope [123]|ghg|carbon|climate|csrd|esrs|issb|tcfd|energy)\b/,
  GRC: /\b(?:controls?|risks?|audit\w*|sox|compliance|polic(?:y|ies)|framework|evidence|deficienc\w*|findings?)\b/,
  FR: /\b(?:10-?[kq]|md&a|mda|footnotes?|financial statements?|gaap|ifrs|sec|filing|earnings|xbrl|annual report|disclosures?)\b/,
};
const areaGuess = (t) => Object.keys(AREA_WORDS).find((a) => AREA_WORDS[a].test(t)) || 'GEN';

function why(text) {
  const r = rate(text);
  if (r.fit === 'not') return 'engine says not a fit';
  const t = normalize(text), ai = r.ops.filter((o) => AI_OPS.includes(o) && o !== 'READ');
  if (!ai.length) return 'no AI step found (READ only or none)';
  if (/e-?mail/.test(t) && r.ops.length === 1 && r.ops[0] === 'DRAFT') return 'email-draft rule';
  const kwCards = cat.useCases.filter((u) => new RegExp('\\b(?:' + u.match + ')').test(t));
  if (!kwCards.length) return 'no card keyword';
  return 'keyword but no shared step (' + kwCards.map((u) => u.id).join(',') + ')';
}
// what-ifs, fire only when match() is empty and the engine does not say not-a-fit
function wiKeyword(text) { // drop the shared-step requirement
  const t = normalize(text);
  return cat.useCases.map((u) => ({ u, n: (t.match(new RegExp('\\b(?:' + u.match + ')', 'g')) || []).length })).filter((x) => x.n).sort((a, b) => b.n - a.n).map((x) => x.u.id).slice(0, 3);
}
function wiArea(text) { // nearest cards in the guessed area: share an AI step, rank by steps shared
  const r = rate(text), ai = r.ops.filter((o) => AI_OPS.includes(o));
  const a = areaGuess(normalize(text));
  return cat.useCases.filter((u) => u.area === a).map((u) => ({ u, s: u.ops.filter((o) => ai.includes(o)).length + (u.ops[0] === lead(text) ? 0.5 : 0) }))
    .filter((x) => x.s).sort((p, q) => q.s - p.s).map((x) => x.u.id).slice(0, 3);
}

const out = [];
for (const [name, rows] of Object.entries(sets)) {
  const fitRows = rows.filter((r) => r.fit !== 'not');
  const miss = fitRows.filter((r) => r.cards.length && !match(r.task, cat).length);
  const tally = {}, areas = {};
  const wi = { keyword: { first: 0, in3: 0, wrongShown: 0 }, area: { first: 0, in3: 0, wrongShown: 0 } };
  for (const r of miss) {
    const w = why(r.task).replace(/ \(.*/, '');
    tally[w] = (tally[w] || 0) + 1;
    const ga = byId.get(r.cards[0]).area; areas[ga] = (areas[ga] || 0) + 1;
    out.push([name, r.id, ga, r.cards.join('+'), why(r.task), 'kw:' + wiKeyword(r.task).join(','), 'area(' + areaGuess(normalize(r.task)) + '):' + wiArea(r.task).join(','), r.task.slice(0, 140)].join(' | '));
    if (rate(r.task).fit === 'not') continue;
    for (const [k, f] of [['keyword', wiKeyword], ['area', wiArea]]) {
      const s = f(r.task);
      if (s.length && r.cards.includes(s[0])) wi[k].first++;
      if (s.some((c) => r.cards.includes(c))) wi[k].in3++;
      if (s.some((c) => !r.cards.includes(c))) wi[k].wrongShown++;
    }
  }
  // cost side: rows that would newly get a card where gold says none (not-a-fit, or fit with no matching feature)
  const cost = { keyword: 0, area: 0 };
  for (const r of rows.filter((r) => !r.cards.length && !match(r.task, cat).length && rate(r.task).fit !== 'not')) {
    if (wiKeyword(r.task).length) cost.keyword++;
    if (wiArea(r.task).length) cost.area++;
  }
  console.log(`${name}: ${rows.length} rows, ${fitRows.length} fit, no card where one fits ${miss.length}; why ${JSON.stringify(tally)}; gold area ${JSON.stringify(areas)}`);
  console.log(`  what-if keyword-only: right first ${wi.keyword.first}, right in 3 ${wi.keyword.in3}, a wrong card shown ${wi.keyword.wrongShown}; new cards where gold says none ${cost.keyword}`);
  console.log(`  what-if area fallback: right first ${wi.area.first}, right in 3 ${wi.area.in3}, a wrong card shown ${wi.area.wrongShown}; new cards where gold says none ${cost.area}`);
}
if (process.argv.includes('--rows')) console.log(out.join('\n'));
