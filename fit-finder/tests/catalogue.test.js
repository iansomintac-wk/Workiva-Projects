/* Catalogue checks: every use case traces to a Workiva source, and match() picks the right ones.
   node tests/catalogue.test.js   (exits 1 on any failure; prints coverage of the held-out tasks) */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const cat = JSON.parse(fs.readFileSync(path.join(root, 'data/catalogue.json'), 'utf8'));
const { rate, match, lead, patternPrompt, AI_OPS } = require('../engine/fit.js');
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
  ['I approve the journal entries and post them in SAP.', undefined],
  // named since the 2026-10-15 source check (Workiva AI workflows, AI Error Validation, knowledge bases)
  ['Every quarter I tie out the figures throughout the 10-Q draft.', 'fr-tie-out'],
  // the Tie-out assistant works inside one 10-K or 10-Q; across two documents it is chat with files
  ['Every close I tie out the numbers in the earnings release to the financial statements.', 'fr-narrative-tables'],
  ['Every quarter I fix the XBRL validation errors before we file.', 'fr-xbrl-errors'],
  ['Every week I answer questions from colleagues about how to do things in Workiva.', 'gen-support'],
  // "testing workpapers" is not writing test steps
  ['I draft audit findings from the testing workpapers for each failed control.', 'grc-issues'],
  // a 10-Q or 10-K named in passing is not a tie-out (2026-10-15 community prompts and comments)
  ["Each year I benchmark our 10-Q and 10-K disclosures against our peers' filings.", 'fr-peers'],
  ['Every quarter I check that the narrative in the 10-Q agrees with the reported figures.', 'fr-narrative-tables']
];
for (const [t, want] of cases) check('match: ' + t.slice(0, 40), () => assert.strictEqual(top(t), want));

// the Sustainability disclosure agent needs sustainability work, not just the word "draft"
for (const t of [
  'Every quarter I draft the goodwill impairment footnote for the 10-Q.',
  'Every close I draft a memo to the regional finance leads about intercompany mismatches.',
  'Every month I draft an executive summary of the variances for the CFO.'
]) check('not sustainability: ' + t.slice(0, 40), () => assert.notStrictEqual(top(t), 'sus-disclosure'));

// sources say how they were read and, when read from the public API, when Workiva last updated them
for (const [k, s] of Object.entries(cat.sources)) check('source ' + k, () => {
  assert(['api', 'saved'].includes(s.read), 'read must be api or saved');
  if (s.read === 'api') assert(/^\d{4}-\d{2}-\d{2}$/.test(s.updated || ''), 'updated date');
});
// a preview feature says so
check('preview availability', () => assert(cat.availability.preview && cat.surfaces['tie-out'].availability === 'preview'));

// the role picker: every use case has a first-person example that the engine rates and routes back to it
for (const u of cat.useCases) check('try routes home: ' + u.id, () => {
  assert(u.try, 'no try example');
  assert.notStrictEqual(rate(u.try).fit, 'not', 'engine rates its example "not"');
  assert.strictEqual(top(u.try), u.id);
});
// each role offers at least three wins, and the first three name a Workiva feature
check('roles', () => assert(Object.keys(cat.roles || {}).length >= 4, 'at least four roles'));
for (const [id, r] of Object.entries(cat.roles || {})) check('role ' + id, () => {
  assert(r.name && r.wins.length >= 3, 'name and three wins');
  const us = r.wins.map((w) => cat.useCases.find((u) => u.id === w));
  assert(us.every(Boolean), 'unknown use case');
  assert(us.slice(0, 3).every((u) => u.fitBasis === 'named'), 'first three are named features');
});

// the lead step is the first AI step by position; reading counts only when nothing else is there
check('lead: first by position, not by list order', () =>
  assert.strictEqual(lead('I draft the commentary and then check it against the tables.'), 'DRAFT'));
check('lead: reading gives way to a real job', () =>
  assert.strictEqual(lead('I read the policy and summarize it for the board.'), 'SUMMARIZE'));
check('lead: reading alone', () => assert.strictEqual(lead('I read the board minutes.'), 'READ'));
check('lead: nothing for the AI', () => assert.strictEqual(lead('I approve the journal entries and post them in SAP.'), null));

// the fuller prompt is offered only when its lead step is the person's lead step
const byId = Object.fromEntries(cat.useCases.map((u) => [u.id, u]));
check('pattern prompt hidden when lead step differs', () =>
  assert.strictEqual(patternPrompt("Every quarter I compare the MD&A to last year's and flag what changed.", byId['fr-yoy-narrative']), null));
check('pattern prompt shown when lead step matches', () =>
  assert.strictEqual(patternPrompt('Every quarter I draft the year-over-year change narrative for the MD&A.', byId['fr-yoy-narrative']), byId['fr-yoy-narrative'].prompt));
// a use case's first op is its prompt's lead step, so its own example gets the fuller prompt
for (const u of cat.useCases.filter((x) => x.prompt)) check('pattern prompt for own example: ' + u.id, () =>
  assert.strictEqual(patternPrompt(u.try, u), u.prompt, 'example leads with ' + lead(u.try) + ', use case with ' + u.ops[0]));
check('no pattern prompt when the use case has none', () =>
  assert.strictEqual(patternPrompt('I write test steps for each control every quarter.', byId['grc-test-steps']), null));

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
