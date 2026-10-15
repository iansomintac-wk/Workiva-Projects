/* Catalogue checks: every use case traces to a Workiva source, and match() picks the right ones.
   node tests/catalogue.test.js   (exits 1 on any failure; prints coverage of the held-out tasks) */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const cat = JSON.parse(fs.readFileSync(path.join(root, 'data/catalogue.json'), 'utf8'));
const { rate, match, AI_OPS } = require('../engine/fit.js');
let fails = 0;
const check = (name, fn) => { try { fn(); } catch (e) { fails++; console.log('FAIL', name, '-', e.message); } };

// every claim has a source
for (const [id, s] of Object.entries(cat.surfaces)) check('surface ' + id, () => {
  assert(cat.availability[s.availability], 'unknown availability ' + s.availability);
  assert(s.sources.length && s.sources.every((r) => cat.sources[r]), 'missing source');
});
const ids = new Set();
for (const u of cat.useCases) check('use case ' + u.id, () => {
  assert(!ids.has(u.id), 'duplicate id'); ids.add(u.id);
  assert(['FR', 'GRC', 'SUS', 'GEN'].includes(u.area), 'area');
  assert(u.surfaces.length && u.surfaces.every((s) => cat.surfaces[s]), 'unknown surface');
  assert(u.refs.length && u.refs.every((r) => cat.sources[r]), 'unknown ref');
  assert(cat.fitBasis[u.fitBasis], 'fitBasis');
  assert(u.evidence.length && u.evidence.every((e) => cat.evidence[e]), 'evidence');
  assert(u.ops.every((o) => AI_OPS.includes(o)), 'ops');
  new RegExp(u.match);
  assert(u.task && u.stays, 'task and stays');
  // the engine must agree the task itself is something Workiva AI can help with
  assert.notStrictEqual(rate(u.task, { repeats: true }).fit, 'not', 'engine rates its own task "not"');
  if (u.prompt) assert(!/\b(?:TBD|TODO|lorem)\b/i.test(u.prompt), 'placeholder text');
});

// match() picks the expected use case first, and nothing for tasks that are not a fit
const top = (t) => (match(t, cat)[0] || {}).id;
const cases = [
  ["Every quarter I compare the MD&A to last year's and flag what changed.", 'fr-yoy-narrative'],
  ['We need to rationalize our controls, there are too many overlapping ones.', 'grc-rationalize'],
  ['Each year we map our controls to NIST and look for gaps.', 'grc-framework'],
  ['I read through what ESRS E1 requires and explain it to the data owners.', 'sus-requirements'],
  ['I review the evidence screenshots every control owner uploads each quarter.', 'grc-evidence'],
  ['I rewrite the sustainability section to be shorter for the board.', 'sus-exec-narrative'],
  ['I approve the journal entries and post them in SAP.', undefined]
];
for (const [t, want] of cases) check('match: ' + t.slice(0, 40), () => assert.strictEqual(top(t), want));

// coverage of the held-out half (option 4 check): how many fitting tasks reach a sourced use case
const rows = fs.readFileSync(path.join(root, 'data/tasks.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
// the same seeded split as tests/eval.js --ids B
let s = 20261015; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
const sh = rows.map((r) => r.id); for (let i = sh.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [sh[i], sh[j]] = [sh[j], sh[i]]; }
const half = new Set(sh.slice(Math.floor(sh.length / 2))), B = rows.filter((r) => half.has(r.id));
const fitting = B.filter((r) => r.fit !== 'not');
const covered = fitting.filter((r) => match(r.task, cat).length);
console.log(`held-out tasks that fit (gold good/partial): ${fitting.length}; reach a sourced use case: ${covered.length} (${(100 * covered.length / fitting.length).toFixed(0)}%)`);
console.log(fails ? fails + ' failed' : 'all catalogue checks pass');
process.exit(fails ? 1 : 0);
