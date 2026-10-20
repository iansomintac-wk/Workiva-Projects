import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, htmlLF } from '../tools/lib/csat-fixture.mjs';

const src = htmlLF();
function gradHtml(gates) {
  let backdrop;
  const stub = () => ({ value: '', checked: false, disabled: false, style: {}, textContent: '', addEventListener() {}, remove() {} });
  const doc = { createElement: () => (backdrop = { className: '', innerHTML: '', querySelector: stub, querySelectorAll: () => [], addEventListener() {}, remove() {} }), body: { appendChild() {} } };
  const c = loadCsat(['escapeHtml', 'graduationCsatWarning', 'openGraduationConfirmModal'], [], { document: doc,
    primaryGoal: () => ({ text: 'Run the first report', gates }), unheldPlannedSessions: () => [], getSessionTemplateSet: () => [],
    GOAL_TYPES: [{ key: 't', label: 'T' }], GOAL_VERDICTS: [{ key: 'met', label: 'Met' }], EXIT_REASONS: [], cleanGoalText: s => String(s || '').trim(), escapeAttr: s => String(s),
    validateGraduationDraft: () => ({ ok: false, missing: [], notePrompt: '' }), confirmGraduation: () => true, showToast() {}, render() {} });
  c.openGraduationConfirmModal({ id: 'a1', name: 'Test Co', compliance: { associatedPeopleCSAT: { done: true } } });
  return backdrop.innerHTML;
}
test('NL-3 graduate modal: a goal with 0 gates prints no "(0 of 0 gates done)"', () => {
  const h = gradHtml([]);
  assert.ok(h.includes('Primary goal: Run the first report') && !h.includes('0 of 0') && !h.includes('gates done'), h.slice(0, 600));
});
test('preserved: a goal with gates still prints "(1 of 2 gates done)" (nonzero-gate rendering; passes on the parent)', () => {
  assert.ok(gradHtml([{ done: true }, { done: false }]).includes('(1 of 2 gates done)'));
});
test('NL-3 CSAT block: csatDatesHtml hides the Answered label with no sent date and shows it with one', () => {
  const c = loadCsat(['escapeHtml', 'escapeAttr', 'csatDatesHtml']);
  const none = c.csatDatesHtml({ surveySentOn: null, surveyAnsweredOn: null }, 'a1');
  const some = c.csatDatesHtml({ surveySentOn: '2026-10-14', surveyAnsweredOn: null }, 'a1');
  assert.match(none, /data-fp-csat-ans-wrap="a1"[^>]*style="display:none"/);
  assert.match(some, /data-fp-csat-ans-wrap="a1"/); assert.doesNotMatch(some, /display:none/);
});
test('preserved: the CSAT block is printed from the one csatDatesHtml call in both places (passes on the parent)', () => {
  assert.equal((src.match(/\$\{csatDatesHtml\(ap, c\.id\)\}/g) || []).length, 2);
});

// Behavioural check of bindCsatDateInputs in both render locations (the beat pane and the Details tab each call it with their own root).
function bindEnv() {
  const calls = [];
  const DATA = { customers: [{ id: 'a1', compliance: { associatedPeopleCSAT: { surveySentOn: null, surveyAnsweredOn: null } } }] };
  const c = loadCsat(['bindCsatDateInputs', 'localDateISO', 'isRealISODate', 'csatDateChangeOk', 'cssEscape'], ['ISO_DATE_RE'], { DATA, window: {}, document: { getElementById: () => null },
    markUndoable: l => calls.push('undo:' + l), saveData: () => calls.push('save'), render: () => calls.push('render') });
  const mkRoot = () => {
    const wrap = { style: { display: 'none' } }; const inputs = {};
    const mkInput = (ds, id) => { const el = { id: 'fp-csat-' + ds + '-' + id, value: '', dataset: { [ds]: id }, addEventListener: (ev, fn) => { el.fire = fn; } }; return el; };
    inputs.fpCsatSent = mkInput('fpCsatSent', 'a1'); inputs.fpCsatAnswered = mkInput('fpCsatAnswered', 'a1');
    const root = { wrap, inputs, querySelectorAll: sel => (sel === '[data-fp-csat-sent]' ? [inputs.fpCsatSent] : sel === '[data-fp-csat-answered]' ? [inputs.fpCsatAnswered] : []),
      querySelector: sel => (sel === '[data-fp-csat-ans-wrap="a1"]' ? wrap : null) };
    c.bindCsatDateInputs(root); return root;
  };
  return { c, calls, DATA, mkRoot };
}
for (const place of ['beat pane', 'Details tab']) {
  test(`NL-3 CSAT block (${place}): a valid sent date shows the Answered box, clearing it hides it again, a year before 2000 changes nothing`, () => {
    const { calls, DATA, mkRoot } = bindEnv(); const root = mkRoot(); const sent = root.inputs.fpCsatSent;
    sent.value = '0002-10-14'; sent.fire();
    assert.equal(root.wrap.style.display, 'none'); assert.equal(DATA.customers[0].compliance.associatedPeopleCSAT.surveySentOn, null); assert.deepEqual(calls, []);
    sent.value = '2026-10-14'; sent.fire();
    assert.equal(root.wrap.style.display, ''); assert.equal(DATA.customers[0].compliance.associatedPeopleCSAT.surveySentOn, '2026-10-14');
    sent.value = ''; sent.fire();
    assert.equal(root.wrap.style.display, 'none'); assert.equal(DATA.customers[0].compliance.associatedPeopleCSAT.surveySentOn, null);
  });
}
