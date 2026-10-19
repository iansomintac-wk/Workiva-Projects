import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lf = readFileSync(new URL('../osm-book-of-business-tracker-1.1.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
export function grab(name) {
  const i = lf.indexOf(`function ${name}(`);
  assert.ok(i >= 0, `function ${name}( is absent from 1.1`);
  const first = lf.slice(i, lf.indexOf('\n', i));
  const opens = (first.match(/\{/g) || []).length, closes = (first.match(/\}/g) || []).length;
  if (opens > 0 && opens === closes && /\}\s*$/.test(first)) return first;
  const j = lf.indexOf('\n}\n', i);
  assert.ok(j >= 0, `closing "\n}\n" of ${name} not found`);
  return lf.slice(i, j + 2);
}
const WORDS = 'No CSAT contact is marked added, so nobody will receive the survey. You can still graduate.';
const acct = (csat) => ({ id: 'a1', name: 'Test Co', compliance: { associatedPeopleCSAT: csat } });
const warn = () => { const ctx = vm.createContext({}); vm.runInContext(grab('graduationCsatWarning'), ctx); return ctx.graduationCsatWarning; };

test('L11 graduationCsatWarning: done:false with no name gives the words', () => {
  assert.equal(warn()(acct({ done: false, date: null, contactName: '' })), WORDS);
});
test('L11 graduationCsatWarning: done:false with a typed name still warns (a name not marked added is missing)', () => {
  assert.equal(warn()(acct({ done: false, date: null, contactName: 'Dana Reyes' })), WORDS);
});
test('L11 graduationCsatWarning: done:true gives an empty string, with or without a name', () => {
  assert.equal(warn()(acct({ done: true, date: '2026-10-01', contactName: 'Dana Reyes' })), '');
  assert.equal(warn()(acct({ done: true, date: '2026-10-01', contactName: '' })), '');
});

// Fake DOM: document.createElement returns a backdrop whose innerHTML we keep; any querySelector gives an inert stub.
function modalHtml({ csat, goal, warningOverride }) {
  let backdrop;
  const stub = () => ({ value: '', checked: false, disabled: false, style: {}, textContent: '', addEventListener() {}, remove() {} });
  const doc = { createElement: () => (backdrop = { className: '', innerHTML: '', querySelector: stub, querySelectorAll: () => [], addEventListener() {}, remove() {} }),
    body: { appendChild() {} } };
  const ctx = vm.createContext({ document: doc,
    primaryGoal: () => goal ? { text: 'Run the first report', gates: [{ done: true }] } : null,
    unheldPlannedSessions: () => [], getSessionTemplateSet: () => [],
    GOAL_TYPES: [{ key: 't', label: 'T' }], GOAL_VERDICTS: [{ key: 'met', label: 'Met' }], EXIT_REASONS: [],
    cleanGoalText: s => String(s || '').trim(), escapeAttr: s => String(s),
    validateGraduationDraft: () => ({ ok: false, missing: [], notePrompt: '' }),
    confirmGraduation: () => true, showToast() {}, render() {} });
  vm.runInContext([grab('escapeHtml'), grab('graduationCsatWarning'), grab('openGraduationConfirmModal')].join('\n'), ctx);
  if (warningOverride) ctx.graduationCsatWarning = warningOverride;
  ctx.openGraduationConfirmModal(acct(csat));
  return backdrop.innerHTML;
}
test('L11 modal: no contact shows #gc-csat right under the title, before the goal line, outside #gc-verdict-wrap, with a goal and without one', () => {
  for (const goal of [true, false]) {
    const h = modalHtml({ csat: { done: false, date: null, contactName: '' }, goal });
    const iTitle = h.indexOf('</h3>'), iLine = h.indexOf('id="gc-csat"'), iGoal = h.search(/Primary goal:|No hand-off goal is set/), iWrap = h.indexOf('id="gc-verdict-wrap"');
    assert.ok(iTitle >= 0 && iLine > iTitle && iLine < iGoal && iGoal < iWrap, `order, goal=${goal}`);
    assert.match(h, /<p id="gc-csat" class="gp-meta" style="margin:0 0 10px; color:var\(--warn, var\(--text-dim\)\);">No CSAT contact is marked added, so nobody will receive the survey\. You can still graduate\.<\/p>/);
  }
});
test('L11 modal: contact marked added renders no #gc-csat at all', () => {
  assert.ok(!modalHtml({ csat: { done: true, date: '2026-10-01', contactName: 'Dana Reyes' }, goal: true }).includes('gc-csat'));
});
test('L11 modal: the warning text is HTML-escaped where it is printed', () => {
  const h = modalHtml({ csat: { done: false }, goal: true, warningOverride: () => '<i>x</i> & "y"' });
  assert.ok(h.includes('&lt;i&gt;x&lt;/i&gt; &amp; '), h.slice(h.indexOf('gc-csat') - 20, h.indexOf('gc-csat') + 200));
  assert.ok(!h.includes('<i>x</i>'));
});
test('L11 validateGraduationDraft: result is identical with and without a CSAT contact, and both outcomes are real (the warning never blocks)', () => {
  const run = (csat, d) => {
    const ctx = vm.createContext({ primaryGoal: () => null, cleanGoalText: s => String(s || '').trim(),
      GOAL_TYPES: [{ key: 't' }], unheldPlannedSessions: () => [], EXIT_REASONS: [] });
    vm.runInContext(grab('validateGraduationDraft'), ctx);
    const r = JSON.parse(JSON.stringify(ctx.validateGraduationDraft(acct(csat), d)));
    assert.equal(typeof r.ok, 'boolean', 'validator must return a real result');
    assert.ok(Array.isArray(r.missing), 'validator must return a missing list');
    return r;
  };
  const none = { done: false, date: null, contactName: '' }, added = { done: true, date: '2026-10-01', contactName: 'Dana Reyes' };
  const cases = [[{ noGoal: true, note: '' }, true], [{ note: '' }, false]];
  for (const [d, ok] of cases) {
    const a = run(none, d), b = run(added, d);
    assert.equal(a.ok, ok, JSON.stringify(a));
    assert.equal(b.ok, ok, JSON.stringify(b));
    assert.deepEqual(a, b);
  }
});
