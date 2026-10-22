/* Score the first card on a prompt file against a gold file, in the suite's fresh-line format plus a score.
   node tests/synth-score.js prompts.jsonl gold.jsonl      score S = 2*wrong + no card + 2*card on a not-a-fit prompt (lower is better)
   Fails closed: exit 2, nothing on stdout, on any bad input. */
const fs = require('fs'), path = require('path');
const die = (m) => { console.error('synth-score: ' + m); process.exit(2); };
const [pf, gf] = process.argv.slice(2);
if (!pf || !gf) die('usage: node tests/synth-score.js prompts.jsonl gold.jsonl');
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/catalogue.json'), 'utf8'));
const { rate, match } = require('../engine/fit.js');
const cardIds = new Set(cat.useCases.map((u) => u.id));
const load = (f, what) => {
  let t;
  try { t = fs.readFileSync(f, 'utf8'); } catch (e) { return die('cannot read ' + what + ' file'); }
  return t.split('\n').filter((l) => l.trim()).map((l, i) => {
    try { const r = JSON.parse(l); if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id) throw new Error('x'); return r; }
    catch (e) { return die('malformed ' + what + ' row ' + (i + 1)); }
  });
};
const rows = load(pf, 'prompt'), goldRows = load(gf, 'gold');
rows.forEach((r, i) => { if (typeof r.task !== 'string' || !r.task.trim()) die('malformed prompt row ' + (i + 1)); });
goldRows.forEach((g, i) => {
  if (!['good', 'partial', 'not'].includes(g.fit) || !Array.isArray(g.cards) || g.cards.some((c) => typeof c !== 'string')) die('malformed gold row ' + (i + 1));
  const bad = g.cards.find((c) => !cardIds.has(c));
  if (bad) die('unknown card ' + bad + ' in gold row ' + g.id);
  if (g.fit === 'not' && g.cards.length) die('cards on a not-a-fit gold row ' + g.id);
});
const uniq = (a, what) => { const s = new Set(); for (const r of a) { if (s.has(r.id)) die('duplicate ' + what + ' id ' + r.id); s.add(r.id); } return s; };
const pi = uniq(rows, 'prompt'), gi = uniq(goldRows, 'gold');
if (pi.size !== gi.size || [...pi].some((x) => !gi.has(x))) die('prompt and gold ids differ');
if (!rows.length) die('no rows');
const gold = new Map(goldRows.map((g) => [g.id, g]));
const first = (r) => (match(r.task, cat)[0] || {}).id, want = (r) => gold.get(r.id).cards;
const fit = rows.filter((r) => gold.get(r.id).fit !== 'not');
const wrong = fit.filter((r) => first(r) && !want(r).includes(first(r)));
const missed = fit.filter((r) => !first(r) && want(r).length);
const notShown = rows.filter((r) => gold.get(r.id).fit === 'not' && first(r));
const agree = rows.filter((r) => rate(r.task).fit === gold.get(r.id).fit).length;
const ids = (a) => a.map((r) => r.id).join(',');
const S = 2 * wrong.length + missed.length + 2 * notShown.length;
const withGold = fit.filter((r) => want(r).length), rightNone = fit.filter((r) => !want(r).length && !first(r)), R = withGold.filter((r) => first(r) && want(r).includes(first(r))).length;
console.log(`first card right: ${fit.length - wrong.length - missed.length} of ${fit.length} that fit; wrong card ${wrong.length} (${ids(wrong)}); no card where one fits ${missed.length} (${ids(missed)}); card on a not-a-fit prompt ${notShown.length} (${ids(notShown)}); fit agreement ${agree} of ${rows.length}; score ${S}; split: right feature first ${R} of ${withGold.length}, rightly none ${rightNone.length} (${ids(rightNone)})`);
if (process.argv.includes('--top3')) {
  const shownIds = (r) => match(r.task, cat).map((u) => u.id);
  const inThree = fit.filter((r) => { const s = shownIds(r); return s.length ? s.some((c) => want(r).includes(c)) : !want(r).length; });
  const anyWrong = rows.filter((r) => shownIds(r).some((c) => !want(r).includes(c)));
  const R = fit.length - wrong.length - missed.length, B = wrong.length + notShown.length;
  console.log(`top 3: right card anywhere in the 3 shown ${inThree.length} of ${fit.length} that fit (first card right ${R}, gain ${inThree.length - R}); any wrong card shown ${anyWrong.length} of ${rows.length} (${ids(anyWrong)}); first card wrong or on a not-a-fit prompt ${B}; rise in wrong lists ${anyWrong.length - B}`);
}
