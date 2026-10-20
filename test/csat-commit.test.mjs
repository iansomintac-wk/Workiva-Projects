import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, makeFixture, J, PLAN_FNS, PLAN_CONSTS } from '../tools/lib/csat-fixture.mjs';

const FNS = [...PLAN_FNS, 'escapeHtml', 'serializeBook', 'commitCsatImport', 'openCsatReportModal'];
function env() {
  const calls = []; const { table, customers } = makeFixture();
  let backdrop;
  const doc = { createElement: () => (backdrop = { className: '', innerHTML: '', querySelector: () => ({ addEventListener() {}, remove() {} }), addEventListener() {}, remove() {} }), body: { appendChild() {} } };
  const DATA = { customers };
  const c = loadCsat(FNS, PLAN_CONSTS, { DATA, document: doc, exportData: () => calls.push('exportData'), markUndoable: l => calls.push('markUndoable:' + l), saveData: () => { calls.push('saveData'); return true; }, render: () => calls.push('render'), showToast() {} });
  return { c, calls, DATA, table, customers, html: () => backdrop && backdrop.innerHTML };
}
test('CSAT commit: backup first, then undo label, then the writes, then save (stubbed exportData; in the real page exportData saves once itself)', () => {
  const e = env(); const plan = e.c.buildCsatImportPlan(e.table, e.customers, {});
  const orig = e.c.applyCsatImportPlan; e.c.applyCsatImportPlan = (...a) => { e.calls.push('apply'); return orig(...a); };
  e.c.commitCsatImport(plan, [], { fileName: 'f.csv', fileModified: 5 });
  assert.deepEqual(e.calls.filter(x => x !== 'render'), ['exportData', 'markUndoable:CSAT import', 'apply', 'saveData']);
});
test('CSAT commit: the result names the backup file, the account count and the skip reasons', () => {
  const e = env(); const plan = e.c.buildCsatImportPlan(e.table, e.customers, {});
  const r = J(e.c.commitCsatImport(plan, [], { fileName: 'f.csv', fileModified: 5 }));
  assert.equal(r.backupFile, 'book-of-business-export.json');
  assert.equal(r.accounts, 136);
  assert.deepEqual(r.skippedByReason, { 'Skipped: test account': 1 });
  assert.equal(r.ambiguous, 1);
});
test('CSAT commit: DATA.csatImport records the file, its modified time, when it was applied and the counts', () => {
  const e = env(); const plan = e.c.buildCsatImportPlan(e.table, e.customers, {});
  e.c.commitCsatImport(plan, [], { fileName: 'f.csv', fileModified: 5 });
  const r = J(e.DATA.csatImport);
  assert.equal(r.fileName, 'f.csv'); assert.equal(r.fileModified, 5);
  assert.match(r.appliedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(r.counts, { matched: 136, dateChanges: 186, notInRunway: 73, skipped: 1 });
});
test('CSAT commit: the import record and the new Salesforce IDs survive the real serializer (what saveData writes)', () => {
  const e = env(); const plan = e.c.buildCsatImportPlan(e.table, e.customers, {});
  const row = plan.suggestions[0].row;
  e.c.commitCsatImport(plan, [row], { fileName: 'f.csv', fileModified: 5 });
  const back = JSON.parse(e.c.serializeBook(e.DATA));
  assert.equal(back.csatImport.fileName, 'f.csv');
  assert.equal(back.customers.find(x => x.id === plan.suggestions[0].customerId).salesforceId, plan.suggestions[0].sf);
  assert.equal(back.customers.find(x => x.id === 'c0').compliance.associatedPeopleCSAT.surveySentOn, '2026-09-01');
});
test('CSAT commit: applying the same file twice changes 0 dates the second time', () => {
  const e = env(); const t = { fileName: 'f.csv', fileModified: 5 };
  e.c.commitCsatImport(e.c.buildCsatImportPlan(e.table, e.customers, {}), [], t);
  const r2 = J(e.c.commitCsatImport(e.c.buildCsatImportPlan(e.table, e.customers, {}), [], t));
  assert.equal(r2.fields, 0);
});
test('CSAT report: the report modal says "Updated 3 accounts", names the skip reasons and the backup file', () => {
  const e = env();
  e.c.openCsatReportModal({ accounts: 3, fields: 5, idsWritten: 0, backupFile: 'book-of-business-export.json', skippedByReason: { 'Skipped: test account': 1 }, ambiguous: 0, conflicts: 0 });
  const h = e.html();
  assert.ok(h.includes('Updated 3 accounts') && h.includes('Skipped: test account') && h.includes('book-of-business-export.json'), h);
});
test('CSAT apply click: reads the ticked suggestion rows, closes the dry run, commits, and opens the report with the commit result', () => {
  const calls = []; let applyFn; let removed = 0;
  const backdrop = { className: '', innerHTML: '',
    querySelector: sel => ({ addEventListener: (ev, fn) => { if (sel === '#csat-apply' && ev === 'click') applyFn = fn; }, remove() {} }),
    querySelectorAll: () => [{ checked: true, dataset: { csatSug: '2' } }, { checked: false, dataset: { csatSug: '3' } }],
    addEventListener() {}, remove() { removed++; } };
  const doc = { createElement: () => backdrop, body: { appendChild() {} } };
  const c = loadCsat([...PLAN_FNS, 'escapeHtml', 'escapeAttr', 'csatPlanSummary', 'csatSectionHtml', 'openCsatImportModal'], PLAN_CONSTS,
    { document: doc, commitCsatImport: (...a) => { calls.push(['commit', J(a)]); return { accounts: 1 }; }, openCsatReportModal: r => calls.push(['report', J(r)]), csatWatchRefresh() {}, showToast() {} });
  const { table, customers } = makeFixture();
  c.openCsatImportModal(c.buildCsatImportPlan(table, customers, {}), { fileName: 'f.csv', fileModified: 7 });
  applyFn();
  assert.deepEqual(calls[0][1][1], [2]); assert.deepEqual(calls[0][1][2], { fileName: 'f.csv', fileModified: 7 });
  assert.equal(removed, 1); assert.deepEqual(calls[1], ['report', { accounts: 1 }]);
});
