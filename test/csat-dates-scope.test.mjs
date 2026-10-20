import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, htmlLF } from '../tools/lib/csat-fixture.mjs';

const ap = { surveySentOn: '2026-10-14', surveyAnsweredOn: null };
const ids = h => [...h.matchAll(/ id="(fp-csat-[^"]+)"/g)].map(m => m[1]);
const fors = h => [...h.matchAll(/for="(fp-csat-[^"]+)"/g)].map(m => m[1]);
const ctx = () => loadCsat(['escapeHtml', 'escapeAttr', 'csatDatesHtml']);

test('item 4: the pane copy and the Details copy of the CSAT date boxes share no id, and each label points inside its own copy', () => {
  const c = ctx(); const pane = c.csatDatesHtml(ap, 'a1', 'pane'), det = c.csatDatesHtml(ap, 'a1', 'details');
  const all = [...ids(pane), ...ids(det)];
  assert.equal(new Set(all).size, all.length, 'duplicate ids: ' + all.join(', '));
  assert.deepEqual(fors(pane).sort(), ids(pane).sort()); assert.deepEqual(fors(det).sort(), ids(det).sort());
});
test('item 4: both call sites pass their scope', () => {
  const src = htmlLF();
  assert.equal((src.match(/\$\{csatDatesHtml\(ap, c\.id, 'pane'\)\}/g) || []).length, 1);
  assert.equal((src.match(/\$\{csatDatesHtml\(ap, c\.id, 'details'\)\}/g) || []).length, 1);
});
test('item 4: editing the Details sent box keeps focus on the Details box, not the pane copy (ids come from the real markup)', () => {
  const c0 = ctx();
  const paneId = ids(c0.csatDatesHtml(ap, 'a1', 'pane'))[0], detId = ids(c0.csatDatesHtml(ap, 'a1', 'details'))[0];
  const mk = id => ({ id, value: '', dataset: { fpCsatSent: 'a1' }, focus() { focused.push(this); }, addEventListener(ev, fn) { this.fire = fn; } });
  const focused = [];
  const pane = mk(paneId), det = mk(detId);
  const byId = {}; byId[detId] = det; byId[paneId] = pane;   // the pane is first in the page, so on a shared id it wins: assigned last
  const DATA = { customers: [{ id: 'a1', compliance: { associatedPeopleCSAT: { surveySentOn: null, surveyAnsweredOn: null } } }] };
  const c = loadCsat(['bindCsatDateInputs', 'localDateISO', 'isRealISODate', 'csatDateChangeOk', 'cssEscape'], ['ISO_DATE_RE'], { DATA, window: {}, document: { getElementById: i => byId[i] || null },
    markUndoable() {}, saveData() {}, render() {} });
  c.bindCsatDateInputs({ querySelectorAll: sel => (sel === '[data-fp-csat-sent]' ? [det] : []), querySelector: () => null });
  det.value = '2026-10-14'; det.fire();
  assert.equal(focused.length, 1); assert.equal(focused[0], det);
});
