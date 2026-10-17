/* Catalogue checks: every use case traces to a Workiva source, and match() picks the right ones.
   node tests/catalogue.test.js   (exits 1 on any failure; prints coverage of the held-out tasks) */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const cat = JSON.parse(fs.readFileSync(path.join(root, 'data/catalogue.json'), 'utf8'));
const { rate, match, lead, patternPrompt, AI_OPS, normalize } = require('../engine/fit.js');
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
  ['Every quarter I check that the narrative in the 10-Q agrees with the reported figures.', 'fr-narrative-tables'],
  // Workiva names this job on its sustainability page (S16, updated 2026-10-01)
  ['Every quarter I check our emissions data against last year for outliers and unusual variances, and explain each one.', 'sus-anomalies'],
  ['Every quarter I check our carbon numbers for outliers.', 'sus-anomalies']
];
for (const [t, want] of cases) check('match: ' + t.slice(0, 40), () => assert.strictEqual(top(t), want));

// the Sustainability disclosure agent needs sustainability work, not just the word "draft"
for (const t of [
  'Every quarter I draft the goodwill impairment footnote for the 10-Q.',
  'Every close I draft a memo to the regional finance leads about intercompany mismatches.',
  'Every month I draft an executive summary of the variances for the CFO.'
]) check('not sustainability: ' + t.slice(0, 40), () => assert.notStrictEqual(top(t), 'sus-disclosure'));
// ...and the sustainability anomaly check needs sustainability data, not just the word "outliers"
check('not sustainability: outliers in the trial balance', () => assert.notStrictEqual(
  top('Every quarter I flag outliers and unusual variances in the trial balance against last year.'), 'sus-anomalies'));
// review of 9f0aa0c: unusual wording, carbon credit invoices and another clause's ESG are not sustainability data checks
for (const t of ['Every quarter I check the sustainability report for typos and unusual wording.',
  'Every month I check carbon credits invoices for unusual amounts.',
  'Each quarter I flag outliers in the revenue by region report; ESG is another team'])
  check('not sustainability anomalies: ' + t.slice(0, 40), () => assert.notStrictEqual(top(t), 'sus-anomalies'));
check('left out: anomaly review is now a use case', () =>
  assert(!cat.leftOut.some((l) => /anomal/i.test(l.pattern)), 'still listed as left out'));
check('left out: Agent Studio, and Suggestions re-checked 2026-10-16', () => {
  assert(cat.leftOut.some((l) => /Agent Studio/.test(l.pattern)), 'Agent Studio not listed as left out');
  const s = cat.leftOut.find((l) => /^Suggestions/.test(l.pattern));
  assert(s && /2026-10-16/.test(s.why), 'Suggestions reason lacks the 2026-10-16 re-check');
});

// Community sustainability prompts (S1, S2, S3, S10 of 2026-10-15) got wrong or no pointers; Ian chose
// to fix them 2026-10-16. A bare "year-over-year", a "Wdata table" or "duplicate records" is not a
// financial narrative, a financial table or a duplicate control.
const matched = (t) => match(t, cat).map((u) => u.id);
check('S1: emissions year-over-year drivers get no financial card', () => {
  const m = matched('Analyze our emissions data and find the top three drivers of the year-over-year change in Scope 1 and 2, then summarize it for executives.');
  assert(!m.some((id) => id.startsWith('fr-')), m.join(','));
  assert(/^sus-/.test(m[0] || ''), 'first: ' + m[0]);
});
check('S2: duplicate records and year-over-year variances are not a narrative or duplicate controls', () => {
  const m = matched('Review this dataset for outliers, unusual year-over-year variances, missing values and duplicate records, and explain why each needs a look.');
  assert(!m.includes('fr-yoy-narrative') && !m.includes('grc-rationalize'), m.join(','));
});
check('S3: explanations for energy variances against the prior period reach the anomaly check', () =>
  assert.strictEqual(top('Review this energy consumption data and give possible explanations for any site with a variance over 10% from the prior reporting period.'), 'sus-anomalies'));
check('S10: a query over a Wdata emissions table reaches the Wdata card, not a financial one', () => {
  const m = matched('I have a Wdata table of facility, year, emissions source and CO2e. Create a query that returns year-over-year emissions changes by facility.');
  assert.strictEqual(m[0], 'gen-wdata', m.join(','));
  assert(!m.some((id) => id.startsWith('fr-')), m.join(','));
});
check('ops: explanations is explaining', () => assert(rate('Give explanations for the variances.').ops.includes('EXPLAIN')));
// ...but not explanations other people owe you, or deciding whether one is needed (labelled tasks 3 and 117)
for (const t of ['I chase the business unit controllers for their flux explanations.',
  'Approving cost data, mostly deciding whether odd-looking items need an explanation.'])
  check('ops: not explaining - ' + t.slice(0, 40), () => assert(!rate(t).ops.includes('EXPLAIN')));
check('ops: the prior reporting period is a comparison', () =>
  assert(rate('List each variance from the prior reporting period.').ops.includes('COMPARE')));
check('ops: creating a query is drafting', () => assert(rate('Create a query that lists each facility.').ops.includes('DRAFT')));
// ...while the financial narrative and duplicate controls still match (review of the first fix:
// it needed "narrative" beside year-over-year and dropped these)
for (const t of ['Every quarter I write the year-over-year commentary on revenue and margins.',
  'Write the year-over-year bridge for revenue and compare to last year in the 10-K.',
  "Compare this year's 10-K to last year's and write up what changed year-over-year.",
  'Draft year-over-year variance analysis for the quarterly filing.',
  'Explain the yoy movement in opex to the CFO. Include narrative.'])
  check('match: financial year-over-year - ' + t.slice(0, 40), () => assert(matched(t).includes('fr-yoy-narrative'), matched(t).join(',')));
for (const t of ['Each year we compare our controls to find the duplicates.',
  'Find duplicate control entries in our SOX control matrix and group them.'])
  check('match: duplicate controls - ' + t.slice(0, 40), () => assert.strictEqual(top(t), 'grc-rationalize'));
check('ops: listing explanations people owe you is not explaining', () =>
  assert(!rate('Chase owners and list their explanations of variances.').ops.includes('EXPLAIN')));
// a decimal point does not end the sentence the year-over-year guard looks in (re-review of 2deb044;
// Ian chose to fix it 2026-10-16), on either side of the year-over-year
for (const t of ['Explain the year-over-year change of 3.5% in Scope 2 emissions.',
  'Our Scope 2 emissions rose 3.5% year-over-year; explain the change.'])
  check('match: decimal keeps the sustainability guard - ' + t.slice(0, 40), () => assert(!matched(t).includes('fr-yoy-narrative'), matched(t).join(',')));
for (const t of ['Explain the year-over-year change of 3.5% in revenue.',
  'Revenue rose 3.5% year-over-year; explain the change.'])
  check('match: decimal in a financial year-over-year - ' + t.slice(0, 40), () => assert(matched(t).includes('fr-yoy-narrative'), matched(t).join(',')));
// ...while a full stop, also one right after a number, still ends it
for (const t of ['Write the year-over-year commentary on revenue. Emissions are covered in a separate report.',
  'Write the year-over-year commentary on revenue for 2025. Scope 2 emissions are in a separate report.'])
  check('match: a full stop still ends the sentence - ' + t.slice(-40), () => assert(matched(t).includes('fr-yoy-narrative'), matched(t).join(',')));
// the same for the two sustainability cards that look for two words in one sentence (Ian chose to fix
// them too, 2026-10-16), in both word orders
for (const [t, want] of [['Review the Scope 2 emissions data of 3.5 million tonnes and flag any anomalies.', 'sus-anomalies'],
  ['Flag any outliers above 2.5 times the average in our Scope 1 emissions data.', 'sus-anomalies'],
  ['Draft a short summary of our 4.2% cut for the sustainability pages.', 'sus-disclosure'],
  ['Use our sustainability data on the 4.2% cut to draft the disclosure.', 'sus-disclosure']])
  check('match: decimal inside a ' + want + ' sentence - ' + t.slice(0, 40), () => assert(matched(t).includes(want), matched(t).join(',')));
for (const [t, not] of [['Every quarter I flag outliers in the trial balance for 2025. Emissions are another team.', 'sus-anomalies'],
  ['Every month I draft the variance memo for 2025. Sustainability is another team.', 'sus-disclosure']])
  check('match: a full stop still ends a ' + not + ' sentence', () => assert(!matched(t).includes(not), matched(t).join(',')));
// their look is capped at 300 characters for speed (below); a long sentence with the two words ~200 apart
// still gets the card (a cap of 100 would lose it)
for (const [t, want] of [['Review the Scope 1 and 2 emissions that each of our forty manufacturing sites entered through the quarterly collection template, covering the fleet, natural gas and purchased electricity lines for every site, and flag any anomalies.', 'sus-anomalies'],
  ['Draft a first version of the section that explains how our forty sites collected their fuel, fleet and purchased electricity figures this year, which estimates we used and why, for the sustainability pages.', 'sus-disclosure']])
  check('match: a long ' + want + ' sentence', () => assert(matched(t).includes(want), matched(t).join(',')));
// the same sentence with "submitted", as first written: it got no card while "submitted" read as acting
check('match: figures the sites submitted reach sus-anomalies', () => {
  const t = 'Review the Scope 1 and 2 emissions that each of our forty manufacturing sites submitted through the quarterly collection template, covering the fleet, natural gas and purchased electricity lines for every site, and flag any anomalies.';
  assert(matched(t).includes('sus-anomalies'), matched(t).join(','));
});
// ...and the cap is exactly 300: the two words 300 characters apart still get the card, 301 apart do not,
// in both word orders (the checks above let any cap from about 200 to 500 pass)
const gap = (n) => { let g = (' ' + 'the forty sites '.repeat(30)).slice(0, n - 1); if (g.endsWith(' ')) g = g.slice(0, -1) + 's'; return g + ' '; };
for (const [a, b, want] of [['Check our emissions', 'anomalies.', 'sus-anomalies'], ['Check the anomalies', 'emissions.', 'sus-anomalies'],
  ['Write the sustainability', 'disclosure.', 'sus-disclosure'], ['Write the disclosure', 'sustainability pages.', 'sus-disclosure']])
  for (const n of [300, 301]) check(`match: ${want}, ${a.split(' ').pop()} first, words ${n} apart`, () => {
    const t = a + gap(n) + b, nt = normalize(t), w1 = a.split(' ').pop().toLowerCase(), w2 = b.split(/[ .]/)[0];
    assert.strictEqual(nt.indexOf(w2) - nt.indexOf(w1) - w1.length, n, 'gap');
    assert.strictEqual(matched(t).includes(want), n === 300, matched(t).join(','));
  });

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

// Ian 2026-10-15: "s4, s5, s6 should be partial" (Workiva sustainability prompts the engine rated "not");
// the AI can do a first pass of a ranking, an estimate against a target or a roadmap; you check and decide
check('fit: ranking sources from your data is partial', () =>
  assert.strictEqual(rate('Rank our emission sources by total impact and pick the five biggest reduction opportunities.').fit, 'partial'));
check('fit: estimating progress to a target is partial', () =>
  assert.strictEqual(rate('From our history, calculate the reduction trajectory, say whether we are on track for the 2030 goal and estimate the yearly cut needed.').fit, 'partial'));
check('fit: drafting a roadmap from data is partial', () =>
  assert.strictEqual(rate('From this data, create a facility emissions reduction roadmap with a prioritized timeline.').fit, 'partial'));
// ...but not a plan kept in another system, a plan to chase people, or an exact accounting estimate
for (const t of ['Create the roadmap in Jira.', 'Build the plan in SAP and upload it.',
  'Build a plan to chase the sites for data.', 'Estimate the tax provision and book the journal.'])
  check('fit: stays not - ' + t, () => assert.strictEqual(rate(t).fit, 'not'));
// review of 61cce43: only another system or chasing people blocks a plan; a table, a slide or "on how to" does not
for (const t of ['Build a plan on how to reduce emissions.', 'Create a roadmap on emissions reduction from this data.',
  'Build a plan to get our emissions down from this data.', 'Create a plan in a table from this data.', 'Build the roadmap into a slide.',
  'Build a plan in the Workiva platform from this data.', 'Create a roadmap in a slide tool from these notes.'])
  check('fit: a drafted plan is partial - ' + t, () => assert.strictEqual(rate(t).fit, 'partial'));
check('fit: an exact tax estimate stays not', () =>
  assert.strictEqual(rate('Estimate the tax provision required for the quarter.').fit, 'not'));
// Ian 2026-10-16 picked "Past-tense fix": a past tense that describes the data (someone else uploaded,
// submitted or exported it) is not you acting in another system; task 57 (gold good) was rated "not"
for (const t of ["Checking that the evidence uploaded actually covers the right period and the right system. A lot of it doesn't.",
  'Every quarter I flag anomalies in the emissions figures the sites submitted.',
  'Each month I review the exported trial balance for unusual balances.'])
  check('ops: data someone else acted on is not acting - ' + t.slice(0, 40), () => assert(!rate(t).ops.includes('ACT'), String(rate(t).hits.ACT)));
check('fit: task 57, evidence uploaded, is not "not"', () =>
  assert.notStrictEqual(rate("Checking that the evidence uploaded actually covers the right period and the right system. A lot of it doesn't.").fit, 'not'));
// ...but you uploading, submitting or exporting, in any tense, still is
for (const t of ['I uploaded the evidence to the portal.', 'We submitted the 10-K last week.', "I've exported the trial balance.",
  'We have already scheduled the review meetings.', 'I upload the evidence every quarter.', 'Submitting the 10-K is the last step.'])
  check('ops: you acting stays acting - ' + t, () => assert(rate(t).ops.includes('ACT')));
// Ian 2026-10-16 picked "C: three rules + role": two texts read as reading only. Task 42 notes exceptions
// (pull out) and asks whether controls cover them (check); S7 generates questions (draft). "Assurance
// provider" names who asks, not a recurring job, so S7 stays partial (Ian's label) and task 75 one-off
const T42 = 'I read vendor SOC 2 reports and note exceptions plus whether our complementary user entity controls cover them.';
const S7 = 'Act as an external sustainability assurance provider. Review this disclosure and generate ten questions related to data quality, controls, methodology, assumptions, and supporting evidence.';
check('ops: task 42 pulls out exceptions and checks coverage', () => {
  const r = rate(T42); assert(r.ops.includes('EXTRACT') && r.ops.includes('CHECK'), r.ops.join('+'));
});
check('match: task 42 reaches grc-framework', () => assert(match(T42, cat).some((u) => u.id === 'grc-framework')));
for (const t of [S7, 'Generate a list of questions for the site leads about their fuel data.'])
  check('ops: generating questions is drafting - ' + t.slice(0, 40), () => assert(rate(t).ops.includes('DRAFT'), rate(t).ops.join('+')));
check('fit: S7 stays partial', () => assert.strictEqual(rate(S7).fit, 'partial'));
for (const t of [S7, "Answering the assurance provider's follow-up questions about how we got the waste data. Usually means digging through old emails."])
  check('repeats: an assurance provider is a role, not a recurrence - ' + t.slice(0, 40), () => assert.strictEqual(rate(t).repeats, 0));
// ...but assurance itself still recurs, exceptions alone are not a list to pull out, and a cover letter is not a coverage check
check('ops: deciding which exceptions to approve is not pulling items out', () => assert(!rate('Decide which exceptions to approve.').ops.includes('EXTRACT')));
check('repeats: preparing for assurance still recurs', () => assert.strictEqual(rate('Preparing for assurance on the emissions data.').repeats, 1));
check('ops: whether to send a cover letter is not a check', () => assert(!rate('Decide whether to send a cover letter.').ops.includes('CHECK')));
// review of the fix: only controls, policies, procedures, evidence or tests "cover" in the checking sense
for (const t of ['Ask whether the vendor can cover the cost of the rollout for all sites.', 'I need to decide whether the team will cover each shift.'])
  check('ops: paying for or staffing is not a coverage check - ' + t.slice(0, 40), () => assert(!rate(t).ops.includes('CHECK'), String(rate(t).hits.CHECK)));
check('ops: whether our controls cover the user entity controls is a check', () =>
  assert(rate('Read the SOC 1 report and see whether our controls cover the complementary user entity controls.').ops.includes('CHECK')));
// speed: the sentence look-arounds in fr-yoy-narrative stay bounded on a long paste with no full stops
check('speed: fr-yoy-narrative on 300k words with no full stops runs under 2 s', () => {
  const u = cat.useCases.find((x) => x.id === 'fr-yoy-narrative');
  const words = []; for (let i = 0; i < 300000; i++) words.push(i % 50 === 0 ? 'year-over-year' : i % 97 === 0 ? 'carbon' : 'figures');
  const re = new RegExp('\\b(?:' + u.match + ')', 'g'), t0 = Date.now();
  words.join(' ').match(re);
  const ms = Date.now() - t0;
  assert(ms < 2000, ms + ' ms');
});
// ...and so do the two sustainability cards' (capped too, Ian 2026-10-16): a pasted 5,000-row emissions
// table has decimals and no full stops; uncapped, the page took 9-15 s to rate it at every typing pause
check('speed: a pasted 5,000-row emissions table rates under 2 s', () => {
  const out = ['Check this table for anomalies.', 'Site,Year,Scope,Datapoint,Value (tCO2e)'];
  for (let i = 0; i < 5000; i++) out.push(`Plant ${i % 40},${2020 + (i % 6)},Scope ${1 + (i % 3)},ESRS E1-6,${(i * 7.3 % 997).toFixed(1)}`);
  const text = out.join('\n'), t0 = Date.now();
  rate(text); match(text, cat);
  const ms = Date.now() - t0;
  assert(ms < 2000, ms + ' ms');
});
check('ops: estimating the yearly cut to reach a target is an estimate', () =>
  assert(rate('Estimate how much we need to cut each year to reach the target.').ops.includes('ESTIMATE')));

// coverage of the held-out half (option 4 check): how many fitting tasks reach a sourced use case
const rows = fs.readFileSync(path.join(root, 'data/tasks.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
// the same seeded split as tests/eval.js --ids B
let s = 20261015; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
const sh = rows.map((r) => r.id); for (let i = sh.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [sh[i], sh[j]] = [sh[j], sh[i]]; }
const half = new Set(sh.slice(Math.floor(sh.length / 2))), B = rows.filter((r) => half.has(r.id));
const fitting = B.filter((r) => r.fit !== 'not');
const covered = fitting.filter((r) => match(r.task, cat).length);
console.log(`held-out tasks that fit (gold good/partial): ${fitting.length}; reach a sourced use case: ${covered.length} (${(100 * covered.length / fitting.length).toFixed(0)}%)`);
// is the first card (the one the page shows) right? data/card-gold.jsonl: acceptable first cards per task, [] = chat with your file
const goldFile = path.join(root, 'data/card-gold.jsonl');
const goldRows = fs.existsSync(goldFile) ? fs.readFileSync(goldFile, 'utf8').trim().split('\n').map(JSON.parse) : [];
const gold = new Map(goldRows.map((g) => [g.id, g.cards]));
check('card gold: one row per held-out task that fits, catalogue cards only', () => {
  const missing = fitting.filter((r) => !gold.has(r.id)).map((r) => r.id);
  assert(!missing.length, 'no gold row for ' + missing.join(','));
  assert.strictEqual(gold.size, fitting.length, 'rows for tasks outside the held-out fitting set');
  assert.strictEqual(goldRows.length, gold.size, 'a task has more than one row');
  const unknown = [...gold.values()].flat().filter((id) => !ids.has(id));
  assert(!unknown.length, 'unknown card ' + unknown.join(','));
});
const first = (r) => (match(r.task, cat)[0] || {}).id, want = (r) => gold.get(r.id) || [];
const wrong = fitting.filter((r) => first(r) && !want(r).includes(first(r)));
const missed = fitting.filter((r) => !first(r) && want(r).length);
console.log(`first card right: ${fitting.length - wrong.length - missed.length} of ${fitting.length}; wrong card ${wrong.length} (${wrong.map((r) => r.id).join(',')}); no card where one fits ${missed.length} (${missed.map((r) => r.id).join(',')})`);
// half A: the fitting tasks outside the held-out half; data/card-gold-a.jsonl, each row says who labelled it
const fittingA = rows.filter((r) => !half.has(r.id) && r.fit !== 'not');
const goldAFile = path.join(root, 'data/card-gold-a.jsonl');
const goldARows = fs.existsSync(goldAFile) ? fs.readFileSync(goldAFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
const goldA = new Map(goldARows.map((g) => [g.id, g]));
check('card gold A: one row per half-A task that fits, catalogue cards only, labelled by ian or model', () => {
  const missing = fittingA.filter((r) => !goldA.has(r.id)).map((r) => r.id);
  assert(!missing.length, 'no gold row for ' + missing.join(','));
  const extra = [...goldA.keys()].filter((id) => !fittingA.some((r) => r.id === id));
  assert(!extra.length, 'rows for tasks outside half A fitting set ' + extra.join(','));
  assert.strictEqual(goldARows.length, goldA.size, 'a task has more than one row');
  const unknown = goldARows.flatMap((g) => g.cards).filter((id) => !ids.has(id));
  assert(!unknown.length, 'unknown card ' + unknown.join(','));
  const badBy = goldARows.filter((g) => !['ian', 'model'].includes(g.by)).map((g) => g.id);
  assert(!badBy.length, 'by must be ian or model for ' + badBy.join(','));
});
const wantA = (r) => (goldA.get(r.id) || {}).cards || [];
const wrongA = fittingA.filter((r) => first(r) && !wantA(r).includes(first(r)));
const missedA = fittingA.filter((r) => !first(r) && wantA(r).length);
const byA = (b) => goldARows.filter((g) => g.by === b).length;
console.log(`half A first card right: ${fittingA.length - wrongA.length - missedA.length} of ${fittingA.length}; wrong card ${wrongA.length} (${wrongA.map((r) => r.id).join(',')}); no card where one fits ${missedA.length} (${missedA.map((r) => r.id).join(',')}); labelled by Ian ${byA('ian')}, by the model ${byA('model')}`);
check('the bare word "commentary" reaches the year-over-year narrative (tasks 8 and 112)', () => {
  for (const id of [8, 112]) {
    const r = rows.find((x) => x.id === id);
    assert.strictEqual((match(r.task, cat)[0] || {}).id, 'fr-yoy-narrative', 'task ' + id);
  }
});
// rewrite reach (rule V1, 2026-10-17): wording changes that name no "rewrite" verb still read as REWRITE
const reads = (t) => rate(t).ops.includes('REWRITE');
check('rewrite reach: "revise" plus a piece of writing reads as REWRITE', () => {
  for (const t of ['Each week I revise the status email before it goes to the team.',
    'Revising my cover letter takes an hour.', 'I revise the long draft twice a month.',
    'Revise the opening paragraph of every memo.'])
    assert(reads(t), 'no REWRITE in: ' + t);
});
check('rewrite reach: "worded better" reads as REWRITE', () => {
  for (const t of ['Get the note worded better before it goes out.',
    'I spend time wording these replies better.'])
    assert(reads(t), 'no REWRITE in: ' + t);
});
check('rewrite reach: "more or less" plus a tone word reads as REWRITE', () => {
  for (const t of ['Make the reply more professional.', 'Make my emails less formal.',
    'Make the answer more polite.', 'Make the pushback more diplomatic.',
    'Make the summary more concise.', 'Make the notice less friendly.'])
    assert(reads(t), 'no REWRITE in: ' + t);
});
check('rewrite reach: guards, numbers and plain nouns do not read as REWRITE', () => {
  for (const t of ['Revise the forecast every month.', 'Revise the budget numbers after close.',
    'Revising the headcount plan is slow.', 'She is a professional accountant.',
    'Review the formal approval steps.', 'The clause is worded by legal counsel.',
    'We want a more accurate close calendar.'])
    assert(!reads(t), 'REWRITE wrongly read in: ' + t);
});
// the card's new match words: each sentence has the REWRITE step and no other card word, so only the new word can pick gen-rewrite
const newWords = {
  'revis': 'Revise the email to my colleague before it goes out.',
  're-?word': 'Reword the reply to my colleague before it goes out.',
  'rephras': 'Rephrase the reply to my colleague before it goes out.',
  'worded': 'Get the reply to my colleague worded better before it goes out.',
  'wording': 'I keep wording the reply better before it goes out.',
  'professional': 'Make the reply to my colleague more professional.',
  'formal': 'Make the reply to my colleague less formal.',
  'polite': 'Make the reply to my colleague more polite.',
  'diplomatic': 'Make the reply to my colleague more diplomatic.',
};
for (const [word, t] of Object.entries(newWords)) check('rewrite reach: card match word ' + word, () => {
  assert(reads(t), 'engine does not read REWRITE in: ' + t);
  assert.strictEqual((match(t, cat)[0] || {}).id, 'gen-rewrite', 'first card for: ' + t);
});
check('rewrite reach: the card lists every new match word', () => {
  const m = cat.useCases.find((u) => u.id === 'gen-rewrite').match;
  for (const w of Object.keys(newWords)) assert(m.split('|').some((p) => p.startsWith(w)), 'missing ' + w);
});
// real prompts: data/real/2026-10-15-community.jsonl, right cards in data/card-gold-real.jsonl, each row says who labelled it
const realRows = fs.readFileSync(path.join(root, 'data/real/2026-10-15-community.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
const goldRFile = path.join(root, 'data/card-gold-real.jsonl');
const goldRRows = fs.existsSync(goldRFile) ? fs.readFileSync(goldRFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
const goldR = new Map(goldRRows.map((g) => [g.id, g]));
check('card gold real: one row per real prompt, catalogue cards only, labelled by ian or model', () => {
  const missing = realRows.filter((r) => !goldR.has(r.id)).map((r) => r.id);
  assert(!missing.length, 'no gold row for ' + missing.join(','));
  assert.strictEqual(goldR.size, realRows.length, 'rows for ids that are not real prompts');
  assert.strictEqual(goldRRows.length, goldR.size, 'a prompt has more than one row');
  const unknown = goldRRows.flatMap((g) => g.cards).filter((id) => !ids.has(id));
  assert(!unknown.length, 'unknown card ' + unknown.join(','));
  const badBy = goldRRows.filter((g) => !['ian', 'model'].includes(g.by)).map((g) => g.id);
  assert(!badBy.length, 'by must be ian or model for ' + badBy.join(','));
});
const wantR = (r) => (goldR.get(r.id) || {}).cards || [];
const wrongR = realRows.filter((r) => first(r) && !wantR(r).includes(first(r)));
const missedR = realRows.filter((r) => !first(r) && wantR(r).length);
const byR = (b) => goldRRows.filter((g) => g.by === b).length;
console.log(`real prompts first card right: ${realRows.length - wrongR.length - missedR.length} of ${realRows.length}; wrong card ${wrongR.length} (${wrongR.map((r) => r.id).join(',')}); no card where one fits ${missedR.length} (${missedR.map((r) => r.id).join(',')}); labelled by Ian ${byR('ian')}, by the model ${byR('model')}`);
// fresh real prompts (held out until scored once, 2026-10-17): data/real/2026-10-17-fresh.jsonl, fit and right cards in data/card-gold-fresh.jsonl
const freshRows = fs.readFileSync(path.join(root, 'data/real/2026-10-17-fresh.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
const goldFFile = path.join(root, 'data/card-gold-fresh.jsonl');
const goldFRows = fs.existsSync(goldFFile) ? fs.readFileSync(goldFFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
const goldF = new Map(goldFRows.map((g) => [g.id, g]));
check('card gold fresh: one row per fresh prompt, fit good/partial/not, catalogue cards only, no cards on a not-a-fit row, labelled by ian or model', () => {
  const missing = freshRows.filter((r) => !goldF.has(r.id)).map((r) => r.id);
  assert(!missing.length, 'no gold row for ' + missing.join(','));
  assert.strictEqual(goldF.size, freshRows.length, 'rows for ids that are not fresh prompts');
  assert.strictEqual(goldFRows.length, goldF.size, 'a prompt has more than one row');
  const badFit = goldFRows.filter((g) => !['good', 'partial', 'not'].includes(g.fit)).map((g) => g.id);
  assert(!badFit.length, 'fit must be good, partial or not for ' + badFit.join(','));
  const unknown = goldFRows.flatMap((g) => g.cards).filter((id) => !ids.has(id));
  assert(!unknown.length, 'unknown card ' + unknown.join(','));
  const cardOnNot = goldFRows.filter((g) => g.fit === 'not' && g.cards.length).map((g) => g.id);
  assert(!cardOnNot.length, 'cards on a not-a-fit row ' + cardOnNot.join(','));
  const badBy = goldFRows.filter((g) => !['ian', 'model'].includes(g.by)).map((g) => g.id);
  assert(!badBy.length, 'by must be ian or model for ' + badBy.join(','));
});
const fitF = freshRows.filter((r) => goldF.has(r.id) && goldF.get(r.id).fit !== 'not');
const wantF = (r) => (goldF.get(r.id) || {}).cards || [];
const wrongF = fitF.filter((r) => first(r) && !wantF(r).includes(first(r)));
const missedF = fitF.filter((r) => !first(r) && wantF(r).length);
const notShownF = freshRows.filter((r) => goldF.has(r.id) && goldF.get(r.id).fit === 'not' && first(r));
const agreeF = freshRows.filter((r) => goldF.has(r.id) && rate(r.task).fit === goldF.get(r.id).fit).length;
const byF = (b) => goldFRows.filter((g) => g.by === b).length;
console.log(`fresh prompts first card right: ${fitF.length - wrongF.length - missedF.length} of ${fitF.length} that fit; wrong card ${wrongF.length} (${wrongF.map((r) => r.id).join(',')}); no card where one fits ${missedF.length} (${missedF.map((r) => r.id).join(',')}); card on a not-a-fit prompt ${notShownF.length} (${notShownF.map((r) => r.id).join(',')}); fit agreement ${agreeF} of ${freshRows.length}; labelled by Ian ${byF('ian')}, by the model ${byF('model')}`);
console.log(fails ? fails + ' failed' : 'all catalogue checks pass');
process.exit(fails ? 1 : 0);
