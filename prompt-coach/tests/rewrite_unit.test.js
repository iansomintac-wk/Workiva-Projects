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
