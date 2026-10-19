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
