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
