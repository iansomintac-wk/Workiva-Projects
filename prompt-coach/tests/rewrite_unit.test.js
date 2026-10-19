/* node --test --test-reporter=tap tests/rewrite_unit.test.js : one focused test per rewrite rule (spec 2026-10-16).
   The tap reporter is needed: since Node 23 the default reporter prints "ℹ pass N", which "^# pass" greps miss. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const M = require('../engine/model.js'), W = require('../engine/rewrite.js'), C = require('../engine/classify.js');
const weights = JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/cls-weights.json'))));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
const K = ['S', 'C', 'O', 'P', 'E'];
const IAN = fs.readFileSync(path.join(__dirname, 'fixtures/rewrites/ian_case.txt'), 'utf8').replace(/\r/g, '').trim();
const PDF = { name: 'Utility invoices Sep 2018.pdf', kind: 'PDF', sheets: [], periods: [], text: 'Invoice Account Service address Usage kWh Amount due USD' };
const run = (prompt, files = [], extra = {}) => W.coach(prompt, { files, detect, ...C.pick(prompt, CLS), ...extra });
const missing = (o) => K.filter((k) => !o.detected[k]).join('');
const bal = (s, a, b) => s.split(a).length === s.split(b).length;

test('splitting: a semicolon inside parentheses never ends a sentence (Ian case)', () => {
  const o = run(IAN);
  assert.notEqual(o.grade, 'strong');
  const s = o.stages.strong.prompt;
  assert.ok(!/;\s*[.!?]/.test(s), s);
  assert.ok(s.includes('for each entry; for example'), s);
  assert.ok(bal(s, '(', ')') && bal(s, '[', ']'), s);
});

test('splitting: square brackets and a trailing semicolon stay whole', () => {
  const o = run('Summarize the attached report [see the Q3 tab; skip Q2]. Keep it to five bullets;\nDo not guess.');
  assert.notEqual(o.grade, 'strong');
  const s = o.stages.strong.prompt;
  assert.ok(s.includes('[see the Q3 tab; skip Q2]'), s);
  assert.ok(!/;\s*[.!?]/.test(s), s);
});

test('splitting: sentenceSpans keeps decimals and an unclosed bracket inside its paragraph', () => {
  const t = 'Margin rose 14.2% (see A.8.x; note). Next (unclosed bracket here.\nSecond paragraph.';
  const sp = W.sentenceSpans(t).map((x) => t.slice(x.start, x.end));
  assert.deepEqual(sp, ['Margin rose 14.2% (see A.8.x; note).', ' Next (unclosed bracket here.', 'Second paragraph.']);
});

test('order: kept sentences keep the user order (Ian case)', () => {
  const s = run(IAN).stages.strong.prompt;
  const at = (x) => { const i = s.indexOf(x); assert.ok(i >= 0, x + ' missing in: ' + s); return i; };
  assert.ok(at('I have attached') < at('break those out') && at('break those out') < at('column headers') && at('column headers') < at('Before finalizing') && at('Before finalizing') < at('For every row'), s);
});

test('order: letters do not regroup the user sentences', () => {
  const o = run('Keep it under five bullets. Summarize the attached report. This is for the audit committee.');
  assert.notEqual(o.grade, 'strong');
  const s = o.stages.strong.prompt;
  assert.ok(s.indexOf('five bullets') < s.indexOf('Summarize the attached') && s.indexOf('Summarize the attached') < s.indexOf('audit committee'), s);
  const us = o.segments.filter((g) => !g.generated);
  assert.ok(us.every((g) => typeof g.src === 'number') && us.every((g, i) => !i || g.src >= us[i - 1].src));
});

test('order: generated Context sits right after the opening Source sentence, before the next user sentence', () => {
  const o = run(IAN, [PDF]);
  const segs = o.segments, gi = segs.findIndex((g) => g.generated && g.letter === 'C');
  assert.ok(gi > 0, 'no generated Context segment');
  assert.ok(segs.slice(0, gi).every((g) => g.src === 0 || /^\s*$/.test(g.text)), JSON.stringify(segs.slice(0, gi).map((g) => [g.letter, g.src, g.text])));
  const next = segs.slice(gi + 1).find((g) => !/^\s*$/.test(g.text));
  assert.ok(next && !next.generated && next.src === 1, 'the segment after Context must start sentence 1 ("Input the applicable dates"), got ' + JSON.stringify(next));
});

test('order: a generated Objective takes the place of the vague sentence it replaced', () => {
  const o = run('Analyze the revenue changes. I attached the Q3 flux file.');
  const segs = o.segments, oi = segs.findIndex((g) => g.generated && g.letter === 'O');
  assert.ok(oi >= 0, 'this prompt did not take the replace-the-vague-sentence path: ' + o.stages.strong.prompt);
  const si = segs.findIndex((g) => !g.generated && /attached/.test(g.text));
  assert.ok(si > oi, 'user Source sentence must come after the Objective that replaced the vague sentence before it');
});

test('direct voice: sentence-initial politeness becomes an imperative; other questions stay', () => {
  const cases = [
    ['Please input the dates.', 'Input the dates.'],
    ['Kindly send the list.', 'Send the list.'],
    ['Can you please summarize the attached report?', 'Summarize the attached report.'],
    ['Could you list every control?', 'List every control.'],
    ['Would you mind reviewing the memo?', 'Review the memo.'],
    ['Would you mind reconciling the accounts?', 'Would you mind reconciling the accounts?'],
    ['I was wondering if you could check the totals.', 'Check the totals.'],
    ["I'd like you to extract the dates.", 'Extract the dates.'],
    ['I need you to flag gaps.', 'Flag gaps.'],
    ['Additionally, ensure that if a row is blank, flag it.', 'If a row is blank, flag it.'],
    ['Also, please make sure if there are two addresses, split them.', 'If there are two addresses, split them.'],
    ['Use it (please use column B) for the list.', 'Use it (use column B) for the list.'],
    ['Send the table pls.', 'Send the table.'],
    ['Summarize it, thanks.', 'Summarize it.'],
    ['Do it, if possible.', 'Do it.'],
    ["If you can't tell why a row moved, say so.", "If you can't tell why a row moved, say so."],
    ['Q3 is due Friday can you draft the memo?', 'Q3 is due Friday. Draft the memo.'],
    ['Pull the data, and can you rewrite the bio?', 'Pull the data, and rewrite the bio.'],
    ['What can you tell me about SG&A?', 'What can you tell me about SG&A?'],
    ['List the invoice(s) and word(s).', 'List the invoices and words.'],
    ['What drove the change in SG&A?', 'What drove the change in SG&A?']
  ];
  for (const [i, want] of cases) assert.equal(W.directVoice(i), want, i);
});

test('direct voice: no filler in Better or Strong (Ian case, with and without the file)', () => {
  const FILL = /\bplease\b|\bpls\b|\bkindly\b|\bcan you\b|\bcould you\b|\bwould you\b|\bi was wondering\b|\bif possible\b/i;
  for (const files of [[], [PDF]]) {
    const o = run(IAN, files);
    assert.ok(!FILL.test(o.stages.better.prompt), o.stages.better.prompt);
    assert.ok(!FILL.test(o.stages.strong.prompt), o.stages.strong.prompt);
    assert.ok(o.stages.better.prompt.startsWith('I have attached the following utility bill invoices. Input the applicable dates'), o.stages.better.prompt);
  }
});

test('direct voice: lead-ins, kept commas, mixed questions', () => {
  const cases = [
    ['What units should I use, and can you convert them to kWh?', 'What units should I use? Convert them to kWh.'],
    ['Which rows can you match, and can you list the rest?', 'Which rows can you match? List the rest.'],
    ["What's the difference between a 10-K and a 20-F, and can you rewrite my LinkedIn bio", "What's the difference between a 10-K and a 20-F? Rewrite my LinkedIn bio"],
    ['Also can you write the summary?', 'Also write the summary.'],
    ['Plus, can you come up with a title?', 'Plus, come up with a title.'],
    ['Short please, no jargon.', 'Short, no jargon.'],
    ['Table please, top 20.', 'Table, top 20.'],
    ['Using only the selected data - and I mean only - please, for the CSRD report.', 'Using only the selected data - and I mean only - for the CSRD report.'],
    ['why is my sumif broken and also can you summarize the board minutes', 'Why is my sumif broken? Also summarize the board minutes'],
    ['list all the commitments please, plus can you tell me how to do a pivot table', 'List all the commitments, plus tell me how to do a pivot table']
  ];
  for (const [i, want] of cases) assert.equal(W.directVoice(i), want, i);
});

test('typos: common misspellings are fixed as whole words, case kept', () => {
  assert.equal(W.fixTypos('Seperately, recieve it; occured untill tomorrow. Teh adress is definately wierd.'), 'Separately, receive it; occurred until tomorrow. The address is definitely weird.');
  assert.equal(W.fixTypos('The seperatelyx and Reciever words stay.'), 'The seperatelyx and Reciever words stay.');
  assert.ok(!/seperat/.test(run(IAN).stages.strong.prompt));
});

test('context: wording fits the task and registers as Context', () => {
  const base = 'Extract every date from the attached file into a table. Do not guess.';
  const want = [
    ['extract', 'SUS', 'This table feeds [what it is for, such as our Scope 2 inventory].'],
    ['extract', 'GEN', 'This table feeds [what it is for].'],
    ['variance', 'FR', 'This is for [what it feeds, such as the quarterly flux review].'],
    ['anomaly', 'GRC', 'This is for [what it feeds, such as our SOX control testing].'],
    ['compare', 'GEN', 'This is for [what it feeds].']
  ];
  for (const [intent, domain, text] of want) {
    const o = run(base, [], { intent, domain, taskSure: true, areaSure: true });
    assert.equal(missing(o), 'C', 'base must be missing only Context; probe another base: ' + JSON.stringify(o.detected));
    assert.ok(o.stages.strong.prompt.includes(text), intent + '/' + domain + ': ' + o.stages.strong.prompt);
    assert.equal((o.stages.strong.prompt.match(/\[[^\]]*\]/g) || []).length, 1, o.stages.strong.prompt);
  }
  const o = run(base, [], { intent: 'summarize', domain: 'FR', taskSure: true, areaSure: true });
  assert.ok(/10-Q MD&A|intended for \[who will read it/.test(o.stages.strong.prompt), 'other intents keep the destination wording or its one-blank fallback: ' + o.stages.strong.prompt);
});

test('context: only Context missing means exactly one blank, even when a kept sentence has a Context cue', () => {
  const rows = fs.readFileSync(path.join(__dirname, '../data/test.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const row = rows.find((r) => /user-control assessment/.test(r.prompt));
  assert.ok(row, 'the "We need this for our user-control assessment" prompt is in data/test.jsonl');
  const o = run(row.prompt);
  assert.equal(missing(o), 'C', JSON.stringify(o.detected));
  assert.equal((o.stages.strong.prompt.match(/\[[^\]]*\]/g) || []).length, 1, o.stages.strong.prompt);
  assert.notEqual(o.stages.strong.prompt.trim(), row.prompt.trim());
});

test('context: Ian case gets the approved Strong and Better text, with and without the file', () => {
  const flat = (x) => x.replace(/\s+/g, ' ').trim();
  const rd = (f) => flat(fs.readFileSync(path.join(__dirname, 'fixtures/rewrites', f), 'utf8'));
  for (const files of [[], [PDF]]) {
    const o = run(IAN, files);
    assert.equal(flat(o.stages.strong.prompt), rd('ian_strong.txt'));
    assert.equal(flat(o.stages.better.prompt), rd('ian_better.txt'));
  }
});

test('objective: the blank-free "one per line" objective is only for list tasks', () => {
  for (const p of ['make this sound less harsh', 'what is ITGC']) {
    const o = run(p);
    assert.ok(!/one per line/.test(o.stages.strong.prompt), p + ': ' + o.stages.strong.prompt);
  }
});

test('objective: a request to fix the text keeps the fill-in objective, not the list one, with and without a file', () => {
  const RCM = { name: 'RCM_FY26.xlsx', kind: 'Excel', sheets: [{ name: 'Controls', headers: ['Control ID', 'Description', 'Owner', 'Frequency'] }], periods: [], text: 'Control ID Description Owner Frequency' };
  for (const files of [[], [RCM]]) {
    const s = run('these risk descriptions are inconsistent can u fix them', files).stages.strong.prompt;
    assert.ok(!s.includes('one per line'), 'list objective beside "Fix them": ' + s);
    assert.ok(s.includes('Identify and list ['), 'fill-in objective kept: ' + s);
    assert.ok(s.includes('Fix them.'), 'user ask kept: ' + s);
  }
  // a list task is unchanged: still the blank-free list objective
  assert.ok(run('walkthrough questions for AP payment approval pls').stages.strong.prompt.includes('List the specific items that answer this, one per line.'));
});

test('tip: "attached" plus "knowledge base" gets a use-one tip; either alone does not', () => {
  const has = (o) => o.tips.some((t) => /both "attached" and "knowledge base"/.test(t) && /type @ and pick each file/.test(t));
  assert.ok(has(run(IAN)));
  assert.ok(has(run(IAN, [PDF])));
  assert.ok(!has(run('Summarize the attached report in five bullets.')));
  assert.ok(!has(run('Summarize what the knowledge base says about Scope 2 in five bullets.')));
  assert.ok(has(run('Check the uploaded file against the Knowledge Base and list differences.')));
});

test('scope: every letter has a non-empty fragment and toggling it changes the text, even when only Context is missing', () => {
  const o = run("Using the attached Q3_Earnings_Release_draft.docx, give a 100-word summary of segment results. If a number isn't in the file, leave it out.");
  const all = W.assemble(o.segments, new Set(K));
  for (const k of K) {
    assert.ok(o.scope[k].frag.trim(), 'empty fragment for ' + k);
    assert.notEqual(W.assemble(o.segments, new Set(K.filter((x) => x !== k))), all, 'toggling ' + k + ' off changes nothing');
  }
});

test('evaluate: a scope limit is not an Evaluate rule, so Strong still adds the Evaluate sentence (assurance reviewer case)', () => {
  const p = "As an assurance reviewer, read the selected Scope 3 Category 1 methodology and list the questions you'd ask before giving limited assurance. Max ten. Don't comment on anything outside Category 1.";
  const o = run(p);
  const s = o.stages.strong.prompt;
  assert.ok(s.includes("Don't comment on anything outside Category 1."), s);
  assert.ok(o.segments.some((x) => x.generated && x.letter === 'E'), s);
  assert.equal(detect(s).on.E && K.every((k) => detect(s).on[k]), true, s);
  // a real checking rule from the user is kept as theirs, with no extra Evaluate sentence
  const q = run("As an assurance reviewer, read the selected Scope 3 Category 1 methodology and list the questions you'd ask. Max ten. Flag anything you are unsure of.");
  assert.ok(!q.segments.some((x) => x.generated && x.letter === 'E'), q.stages.strong.prompt);
});

test('workiva tips match the live Support Center (re-check 2026-10-19): no unsupported claims or press-release names', () => {
  const src = fs.readFileSync(path.join(__dirname, '../engine/rewrite.js'), 'utf8');
  for (const bad of ['Rephrase', 'Tie-Out Agent', 'Benchmarking Agent', 'current sheet', 'does not read your open file']) {
    assert.ok(!src.includes(bad), 'rewrite.js still contains "' + bad + '"');
  }
});

// ---- Coach notes (T4): additive warnings; grades unchanged ----
const kinds = (o) => o.notes.map((n) => n.kind);
const PLAIN = 'Use only @RCM_FY26.xlsx. Summarize the failed controls for the audit committee in five bullets. Flag anything you cannot verify.';

test('note personal: fires on SSN, salary, DOB and account numbers; not on a plain work prompt', () => {
  for (const p of ['Summarize the file for employee 123-45-6789 in the HR report.', 'Name: John Smith, SSN 123-45-6789, salary 85000 in the HR report.', "Jane Doe's salary is $92,000 in the payroll report.", 'Add the date of birth to the employee table in the report.', 'Check the bank account 123456789012 in the vendor report.'])
    assert.ok(kinds(run(p)).includes('personal'), p);
  assert.ok(!kinds(run(PLAIN)).includes('personal'));
});

test('note calc: fires when asked to calculate a figure; not on a plain work prompt', () => {
  assert.ok(kinds(run('Calculate the total revenue from the attached report.')).includes('calc'));
  assert.ok(kinds(run('Recalculate the variance in the Q3 table and sum each column.')).includes('calc'));
  assert.ok(!kinds(run(PLAIN)).includes('calc'));
});

test('note stacked: a comma list of 3+ task verbs counts as stacked and the display rule downgrades', () => {
  const p = 'Summarize the report, list the risks, draft an email, and compare to last year';
  const o = run(p);
  assert.ok(kinds(o).includes('stacked'));
  assert.equal(o.stacked, true);
  assert.ok(!kinds(run(PLAIN)).includes('stacked'));
  assert.equal(run(PLAIN).stacked, false);
  assert.ok(!kinds(run('Summarize the report, the risks and the controls for the audit committee.')).includes('stacked'));
});

test('note offtopic: no work words fires and the display grade is not strong; a work prompt does not fire', () => {
  for (const p of ["What's the weather today?", 'Write a poem about cats']) {
    const o = run(p);
    assert.ok(kinds(o).includes('offtopic'), p);
    assert.equal(o.offtopic, true);
  }
  assert.ok(!kinds(run(PLAIN)).includes('offtopic'));
  assert.ok(!kinds(run('Summarize the attached policy for the board.')).includes('offtopic'));
});

test('note offtopic: work prompts that name a document, letter, release or calc are never off-topic', () => {
  for (const p of ['rewrite the CEO letter in this doc to be 30% shorter', 'Write the earnings release headline', 'Can you look over the EPS calc', 'Tighten the second paragraph of the memo', 'make this slide say less'])
    assert.ok(!kinds(run(p)).includes('offtopic'), p);
});

test('note personal: salary alone (aggregate payroll accounting) does not fire', () => {
  for (const p of ['Accrue the salaries expense for October in the trial balance', 'Review the salary accrual variance', 'List salaries from the payroll report by department.'])
    assert.ok(!kinds(run(p)).includes('personal'), p);
});

// ---- fix C: personal-note false positives and the shared display rule ----
test('note personal: ordinary accounting prompts with long numbers, IBAN, salary expense or routing do not fire', () => {
  for (const p of ['Reconcile GL account 40100200 to the bank statement for October', 'Record the bank loan of 25000000', 'Summarize salary expense by department for the Audit Committee', 'Salary expense of $4,200,000 rose 3%', 'Explain the IBAN format for our vendor master data', 'Set up the approval routing for invoices'])
    assert.ok(!kinds(run(p)).includes('personal'), p);
});

test('note personal: SSN without dashes, spaced account number and a birth date fire', () => {
  for (const p of ['SSN 123456789', 'account number 1234 5678 9012', 'born on 4 May 1980'])
    assert.ok(kinds(run(p)).includes('personal'), p);
});

test('displayGrade: off-topic is weak, strong with stacked is better, else the grade; one rule shared with the page', () => {
  const hk = 'Use only the observations below. Write a haiku for my niece, as three lines. Flag anything you cannot verify';
  assert.equal(W.displayGrade(run(hk), hk), 'weak');
  const st = run('Summarize the report, list the risks, draft an email, and compare to last year');
  assert.equal(W.displayGrade(st, ''), st.grade === 'strong' && st.hits ? 'better' : st.grade);
  assert.equal(W.displayGrade({ grade: 'strong', hits: {}, stacked: true, offtopic: false }, ''), 'better');
  assert.equal(W.displayGrade({ grade: 'strong', hits: {}, stacked: false, offtopic: false }, ''), 'strong');
});

// ---- T5: missing-data version of the anomaly template (spec 2026-10-19) ----
test('missing-data: T5 typed with @sus_supplier_data.csv gets the missing-data table and rule', () => {
  const o = run('Which suppliers are missing emissions data?', [{ name: 'sus_supplier_data.csv' }]);
  const s = o.stages.strong.prompt;
  assert.equal(o.intent, 'anomaly');
  assert.ok(s.includes('what is missing'), s);
  assert.ok(s.includes('Do not fill in or estimate missing values'), s);
  assert.ok(!s.includes('why it looks wrong'), s);
  assert.ok(!s.includes('Do not correct any values'), s);
});

test('missing-data: missingAsk fires on train ask rows 25 27 30 33 36 37 38 and on no mixed or mention row (ids 16-38)', () => {
  const rows = fs.readFileSync(path.join(__dirname, '../research/2026-10-19-missing-ask-labels.tsv'), 'utf8').replace(/\r/g, '').trim().split('\n').slice(1).map((l) => l.split('\t'));
  const train = rows.filter((r) => Number(r[0]) >= 16);
  assert.equal(train.length, 23);
  for (const r of train) {
    const fired = W.missingAsk(r[3]);
    if (r[2] === 'mixed' || r[2] === 'mention') assert.equal(fired, false, r[0] + ' ' + r[2] + ': ' + r[3]);
    if (['25', '27', '30', '33', '36', '37', '38'].includes(r[0])) assert.equal(fired, true, r[0] + ': ' + r[3]);
  }
});

test('missing-data: a truly mixed request does not take the missing-only template', () => {
  assert.equal(W.missingAsk('List missing values and, if a zero is found, report it too.'), false);
  assert.equal(W.missingAsk('Which suppliers have duplicate or missing emissions data?'), false);
  assert.equal(W.missingAsk('List any outliers. If a value is missing, say so.'), false);
  assert.equal(W.missingAsk('Which suppliers are missing emissions data?'), true);
});

test('missing-data: a request that a condition introduces still counts as a missing-data ask', () => {
  assert.equal(W.missingAsk('If possible, list missing emissions data.'), true);
  assert.equal(W.missingAsk('List the suppliers. If the file has a blank tab, ignore it.'), false);
});

test('missing-data: a mixed ask keeps its anomaly lines, and another intent never gets the missing-data rule', () => {
  const mixed = run('Which suppliers have duplicate or missing emissions data?', [{ name: 'sus_supplier_data.csv' }], { intent: 'anomaly', taskSure: true }).stages.strong.prompt;
  assert.ok(mixed.includes('why it looks wrong'), mixed);
  assert.ok(mixed.includes('Do not correct any values'), mixed);
  assert.ok(!mixed.includes('Do not fill in or estimate missing values'), mixed);
  const q = 'Which suppliers are missing emissions data?';
  assert.equal(W.missingAsk(q), true);
  const gaps = run(q, [], { intent: 'gaps', taskSure: true }).stages.strong.prompt;
  assert.ok(gaps.includes('Only flag gaps you can point to in the source'), gaps);
  assert.ok(!gaps.includes('Do not fill in or estimate missing values'), gaps);
});

test('missing-data: detected sheet headers lead the missing-data table', () => {
  const f = { name: 'sus_supplier_data.csv', kind: 'CSV', periods: [], text: '', sheets: [{ name: 'Suppliers', headers: ['Supplier', 'Country', 'Emissions tCO2e'] }] };
  const s = run('Which suppliers are missing emissions data?', [f]).stages.strong.prompt;
  assert.ok(s.includes('Return a table: Supplier, Country, Emissions tCO2e, what is missing, where it should be.'), s);
});

test('missing-data: an indirect question after check/tell me/see/find out is a missing-data ask, a conditional clause is not', () => {
  assert.equal(W.missingAsk('Check if any suppliers are missing emissions data'), true);
  assert.equal(W.missingAsk('Tell me if any suppliers are missing emissions data'), true);
  assert.equal(W.missingAsk('See whether any suppliers are missing emissions data'), true);
  assert.equal(W.missingAsk('If a value is missing, say so.'), false);
  assert.equal(W.missingAsk('If possible, list missing emissions data.'), true);
});

test('missing-data: invalid, negative and error words make the ask mixed', () => {
  assert.equal(W.missingAsk('Find missing or invalid emissions values'), false);
  assert.equal(W.missingAsk('Flag negative emissions and missing values'), false);
  assert.equal(W.missingAsk('Find errors and missing values in the supplier file'), false);
});

// ---- T3/T6: the file cannot support the ask (spec 2026-10-19) ----
const RULES = require('../engine/rules.js');
const { SPECS } = require('../research/live-tests/make_live_fixtures.js');
require('../engine/files.js');
const FX_HEADER = (rows) => { for (const r of rows.slice(0, 12)) { const cells = (r || []).map((c) => (c == null ? '' : String(c).trim())).filter(Boolean); if (cells.filter((c) => /[A-Za-z]/.test(c) && c.length < 40).length >= 2) return cells.slice(0, 10); } return []; };
// Built the way engine/files.js reads a file and the way the ledger file_probe.js builds it: xlsx = "## sheet" + rows as text.
function fx(name) {
  const { periodsOf } = globalThis.ScopeFiles;
  const s = SPECS.find((x) => x.name === name); assert.ok(s, 'no fixture ' + name);
  if (s.kind === 'xlsx') { const rows = s.rows.filter((r) => r.length); const headers = FX_HEADER(rows), text = '## ' + s.sheet + '\n' + rows.map((r) => r.join(', ')).join('\n'); return { name, kind: 'Excel', text, sheets: [{ name: s.sheet, headers }], periods: periodsOf(headers.join(' ') + ' ' + text) }; }
  if (s.kind === 'docx') { const text = [s.title, ...s.paras].join(' '); return { name, kind: 'Word', text, headings: [s.title], periods: periodsOf(text) }; }
  if (s.kind === 'pdf') { const text = s.pages.map((p) => p.join(' ')).join('\n'); return { name, kind: 'PDF', text, periods: periodsOf(text) }; }
  return { name, kind: 'Text', text: s.text || '', periods: periodsOf(s.text || '') };
}
const mk = (name, sheet, body, headers = []) => ({ name, kind: 'Excel', sheets: [{ name: sheet, headers }], periods: [], text: '## ' + sheet + '\n' + body });
const DECLINE = 'If the file does not contain what this needs, say so instead of estimating.';
const T3 = 'what will our stock price do next quarter based on this';
const T6 = 'As a sustainability analyst, using only @sus_ghg_inventory.xlsx, calculate our Scope 3 category 11 (use of sold products) emissions for FY25. Show the method and every input with its source row in a short table (item, value, source row), then give the total in tCO2e. Keep it to one page, in a formal tone.';
const unsupported = (o) => o.notes.filter((n) => n.kind === 'unsupported');
const askCat = (n, scope3 = true) => 'Using only @s3.xlsx, calculate our ' + (scope3 ? 'Scope 3 ' : '') + 'category ' + n + ' emissions in a table with item, value and source row. Do not guess.';

test('unsupported: T3 forecast ask on the flux file gets the note and a Strong with the decline line that still grades strong', () => {
  const o = run(T3, [fx('fr_flux_q3.xlsx')]);
  assert.equal(unsupported(o).length, 1, JSON.stringify(o.notes));
  assert.match(unsupported(o)[0].text, /forecast/i);
  const s = o.stages.strong.prompt;
  assert.ok(s.endsWith(DECLINE), s);
  assert.equal(RULES.grade(detect(s).on), 'strong', s);
});

test('unsupported: T6 asks for Scope 3 category 11 the file does not list: note names it, Strong is the typed prompt', () => {
  const o = run(T6, [fx('sus_ghg_inventory.xlsx')]);
  assert.equal(unsupported(o).length, 1, JSON.stringify(o.notes));
  assert.match(unsupported(o)[0].text, /category 11/);
  assert.equal(o.stages.strong.prompt, T6);
});

test('unsupported: no file text means no note and no decline line (T3 with a bare file name)', () => {
  const o = run(T3, [{ name: 'fr_flux_q3.xlsx' }]);
  assert.equal(unsupported(o).length, 0);
  assert.ok(!o.stages.strong.prompt.includes(DECLINE));
});

test('unsupported: forecast basis is looked for in the file text only, not in a sheet named Forecast (C3)', () => {
  const hist = mk('hist.xlsx', 'Forecast', 'Account, Q1, Q2\nRevenue, 100, 120', ['Account', 'Q1']); // same shape engine/files.js builds: text starts '## Forecast'
  assert.equal(unsupported(run(T3, [hist])).length, 1);
  assert.equal(unsupported(run(T3, [mk('fc.xlsx', 'Plan', 'Account, FY26 forecast\nRevenue, 130')])).length, 0);
});

test('unsupported: a category ask needs Scope 3 in the ask and in the file (C1)', () => {
  const sales = mk('s3.xlsx', 'Sales', 'Category 1 Domestic, 500\nCategory 2 Export, 300');
  assert.equal(unsupported(run(askCat(11, false), [sales])).length, 0, 'not a Scope 3 ask');
  assert.equal(unsupported(run(askCat(11, true), [sales])).length, 0, 'file has no Scope 3 list');
  assert.equal(unsupported(run(askCat(11, false), [fx('sus_ghg_inventory.xlsx')])).length, 0, 'ask does not say Scope 3');
});

test('unsupported: leased assets fits both category 8 and 13, so it counts once and is not a fire (C2)', () => {
  const one = mk('s3.xlsx', 'Scope 3', 'Leased assets, 60');
  assert.equal(unsupported(run(askCat(13), [one])).length, 0, 'one recognised name is below the minimum of 2');
  const two = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nLeased assets, 60');
  assert.equal(unsupported(run(askCat(13), [two])).length, 0, 'generic leased assets may be 13');
  assert.equal(unsupported(run(askCat(11), [two])).length, 1, 'category 11 is absent');
  const up = mk('s3.xlsx', 'Scope 3', 'Waste, 90\nUpstream leased assets, 60');
  assert.equal(unsupported(run(askCat(13), [up])).length, 1, 'only the upstream kind is listed, so 13 is absent');
});

test('unsupported: no train-labelled row fires against any of the three area fixtures (tuning guard, train rows only)', () => {
  const rows = fs.readFileSync(path.join(__dirname, '../research/2026-10-19-cannot-support-labels.tsv'), 'utf8').split('\n').slice(1).filter(Boolean).map((l) => l.split('\t'));
  const train = rows.filter((r) => r[1] === 'train');
  assert.ok(train.length >= 40, 'train rows: ' + train.length);
  const files = ['fr_flux_q3.xlsx', 'sus_ghg_inventory.xlsx', 'grc_rcm.xlsx'].map(fx);
  const fired = [];
  for (const r of train) for (const f of files) if (unsupported(run(r[6], [f])).length) fired.push(r[2] + ' x ' + f.name);
  assert.deepEqual(fired, []);
});

test('unsupported: the page template renders the unsupported kind', () => {
  const html = fs.readFileSync(path.join(__dirname, '../web/template.html'), 'utf8');
  assert.ok(html.includes("'grounding', 'unsupported'"), 'template.html list of warning kinds');
});

test('grounding: FY25 counts as present when the file has FY2025; FY26 against the same file is still flagged', () => {
  const sus = fx('sus_ghg_inventory.xlsx');
  const g = (o) => o.notes.filter((n) => n.kind === 'grounding').map((n) => n.text).join(' ');
  assert.ok(!/FY25/.test(g(run(T6, [sus]))), g(run(T6, [sus])));
  assert.match(g(run('Using only @sus_ghg_inventory.xlsx, list the Scope 3 totals for FY26 in a table with each source row. Do not guess.', [sus])), /FY26/);
});

// ---- final-review fixes (C1-C4, S1, S3, S4, S5) ----
const sheetOf = (sheet, body) => mk('f.xlsx', sheet, body);
test('unsupported: a historical stock price summary is not a forecast ask (C1)', () => {
  const px = sheetOf('Prices', 'Date, Stock price\n2025-01-02, 10\n2025-01-03, 11');
  assert.equal(unsupported(run('Summarize the stock price movements in this file', [px])).length, 0);
  assert.equal(unsupported(run(T3, [px])).length, 1, 'T3 still fires');
});
test('unsupported: "what will the documents ..." is not a forecast ask: do/be need a word boundary (S1)', () => {
  const f = sheetOf('Controls', 'Control ID, Owner\nC1, Ann');
  assert.equal(unsupported(run('What will the documents need to show for SOX, using @f.xlsx', [f])).length, 0);
  assert.equal(unsupported(run('What will the beginning of the report need, using @f.xlsx', [f])).length, 0);
});
test('unsupported: "Forecast Q4 revenue using this file" against historical-only text fires (C2)', () => {
  const h = sheetOf('Actuals', 'Account, Q1, Q2\nRevenue, 100, 120');
  assert.equal(unsupported(run('Forecast Q4 revenue using this file', [h])).length, 1);
  assert.equal(unsupported(run('Forecast revenue using this file', [h])).length, 1);
});
test('unsupported: forecast-basis words are bounded: "Plant output" is no basis (C3)', () => {
  const f = sheetOf('Actuals', 'Plant output and historical revenue');
  assert.equal(unsupported(run('Predict revenue next quarter', [f])).length, 1);
});
test('unsupported: Fcst, Bgt and FY26E headers count as a forecast basis (S3)', () => {
  for (const body of ['Account, FY25A, FY26E\nRevenue, 100, 130', 'Account, Fcst\nRevenue, 130', 'Account, Bgt\nRevenue, 130'])
    assert.equal(unsupported(run('Predict next quarter revenue from this', [sheetOf('Model', body)])).length, 0, body);
});
test('unsupported: incidental words do not make a Scope 3 category list (C4)', () => {
  const f = sheetOf('Notes', 'Scope 3 inventory preparation notes\nFuel for Scope 1 boilers\nWaste water discharged');
  assert.equal(unsupported(run(askCat(11), [f])).length, 0);
});
test('grounding: FY2020 is not satisfied by a file that only has FY2024 and FY2025 (S4)', () => {
  const f = sheetOf('Inv', 'Item, FY2024, FY2025\nElectricity, 1, 2');
  const g = (o) => o.notes.filter((n) => n.kind === 'grounding').map((n) => n.text).join(' ');
  assert.match(g(run('Using only @f.xlsx, compare our FY2020 baseline to FY2025 in a table with each source row. Do not guess.', [f])), /FY2020/);
});

// ---- known-limits sweep (2026-10-19) ----
test('unsupported: "Forecast product revenue using this file" against historical-only text fires (C2b)', () => {
  const h = sheetOf('Actuals', 'Account, Q1, Q2\nRevenue, 100, 120');
  assert.equal(unsupported(run('Forecast product revenue using this file', [h])).length, 1);
  assert.equal(unsupported(run('Forecast Q4 EMEA product revenue from this file', [h])).length, 1);
});
test('unsupported: a forecast noun phrase about the file stays quiet (C2b near misses)', () => {
  const h = sheetOf('Actuals', 'Account, Q1, Q2\nRevenue, 100, 120');
  for (const p of ['Summarize the forecast table revenue on this slide', 'Explain the forecast variance revenue in this file', 'Compare product revenue between Q1 and Q2 in this file', 'Compare forecast against actual revenue in this file'])
    assert.equal(unsupported(run(p, [h])).length, 0, p);
  const plan = sheetOf('Plan', 'Account, FY26 forecast\nRevenue, 130');
  assert.equal(unsupported(run('Forecast product revenue using this file', [plan])).length, 0, 'file has a forecast');
  assert.equal(unsupported(run('Forecast revenue using this file', [h])).length, 1, 'the old case still fires');
});
