const BASE_K = 0;
const MAX_TUNE_WRONG = 4;
/* node tools/diag-nocard.js [--engine <path>]   run from fit-finder/
   One line: diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K. INVALID + exit 1 if the tune
   wrong or not-a-fit count rose, or half A has a wrong card. Bad input: exit 2, nothing on stdout. */
const fs = require('fs'), path = require('path');
const die = (m) => { console.error('diag-nocard: ' + m); process.exit(2); };

function judge({ W, K, wrongA }) {
  const why = [];
  if (W > MAX_TUNE_WRONG) why.push(`tune wrong ${W} > ${MAX_TUNE_WRONG}`);
  if (K > BASE_K) why.push(`tune not-a-fit ${K} > ${BASE_K}`);
  if (wrongA > 0) why.push(`half A wrong ${wrongA} > 0`);
  return why;
}

function main() {
  const args = process.argv.slice(2);
  let enginePath = '../engine/fit.js';
  if (args.length === 2 && args[0] === '--engine') enginePath = path.resolve(process.cwd(), args[1]);
  else if (args.length) die('usage: node tools/diag-nocard.js [--engine <path>]');
  const data = (f) => path.join(__dirname, '../data', f);
  const rows = (f) => {
    let t;
    try { t = fs.readFileSync(data(f), 'utf8'); } catch (e) { die('cannot read ' + f); }
    return t.split('\n').filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch (e) { return die('bad json in ' + f); } });
  };
  let eng, cat;
  try { eng = require(enginePath); cat = JSON.parse(fs.readFileSync(data('catalogue.json'), 'utf8')); } catch (e) { die('cannot load engine or catalogue'); }
  const first = (task) => ((eng.match(task, cat) || [])[0] || {}).id;

  const tune = rows('synth/2026-10-18-tune.jsonl'), tgold = new Map(rows('card-gold-synth-tune.jsonl').map((g) => [g.id, g]));
  let T = 0, W = 0, K = 0;
  for (const r of tune) {
    const g = tgold.get(r.id);
    if (!g) die('no gold for tune id ' + r.id);
    const f = first(r.task);
    if (g.fit === 'not') { if (f) K++; continue; }
    if (f && !g.cards.includes(f)) W++;
    else if (!f && g.cards.length) T++;
  }
  const tasks = new Map(rows('tasks.jsonl').map((t) => [t.id, t]));
  let A = 0, wrongA = 0;
  for (const g of rows('card-gold-a.jsonl')) {
    const t = tasks.get(g.id);
    if (!t || t.fit === 'not') die('half A id ' + g.id + ' missing from tasks or not-a-fit');
    const f = first(t.task);
    if (f && !g.cards.includes(f)) wrongA++;
    else if (!f && g.cards.length) A++;
  }
  console.log(`diag no-card ${T + A} (tune ${T}, halfA ${A}); tune wrong ${W}; tune not-a-fit ${K}`);
  const why = judge({ T, A, W, K, wrongA });
  if (why.length) { console.log('INVALID: ' + why.join('; ')); process.exit(1); }
}
if (require.main === module) main();
module.exports = { judge };
