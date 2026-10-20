import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, makeFixture, J, PLAN_FNS, PLAN_CONSTS, HEADER, SKIP_ID, sf, gs } from '../tools/lib/csat-fixture.mjs';

const ctx = () => loadCsat(PLAN_FNS, PLAN_CONSTS);
const build = (table, customers = []) => J(ctx().buildCsatImportPlan(table, customers, {}));
const row = (o = {}) => [o.sf ?? sf(1), o.gs ?? gs(1), o.name ?? 'Fake Co', o.sent ?? '2026-09-01', o.ans ?? ''];

test('CSAT plan: parseCsv returns the header row first as an array of string arrays (the shape the builder takes)', () => {
  const t = J(ctx().parseCsv(HEADER.join(',') + '\n' + `${sf(1)},${gs(1)},Fake Co,2026-09-01,\n`));
  assert.deepEqual(t[0], HEADER);
  assert.equal(t[1][2], 'Fake Co');
});
test('CSAT plan: missing columns give one error naming them and nothing else is built', () => {
  const p = build([['SALESFORCE_ACCOUNT_ID', 'COMPANY_NAME'], ['x', 'y']]);
  assert.equal(p.error, "This isn't a CSAT export (missing GAINSIGHT_COMPANY_ID, CSAT_SENT_DATE, CSAT_ANSWERED_DATE)");
  assert.equal(p.rowCount, 0);
});
test('CSAT plan: headers are case-insensitive and in any order', () => {
  const t = [['csat_answered_date', 'Company_Name', 'csat_sent_date', 'gainsight_company_id', 'salesforce_account_id'], ['', 'Fake Co', '2026-09-01', gs(1), sf(1)]];
  const p = build(t);
  assert.equal(p.error, null);
  assert.equal(p.rowCount, 1);
  assert.equal(p.unmatchedRows[0].name, 'Fake Co');
});
test('CSAT plan: the test account row is skipped with the reason "Skipped: test account"', () => {
  const p = build([HEADER, row({ sf: SKIP_ID, name: 'WF Test' })]);
  assert.deepEqual(p.skipped, [{ row: 2, name: 'WF Test', reason: 'Skipped: test account' }]);
});
test('CSAT plan: a sent date before 2000, a non-date sent date, or a bad answered date is skipped as "Skipped: bad date"; an empty answered date is fine', () => {
  const p = build([HEADER, row({ sent: '1999-12-31' }), row({ sent: 'nope' }), row({ ans: '2026-13-40' }), row({ ans: '' })]);
  assert.deepEqual(p.skipped.map(s => [s.row, s.reason]), [[2, 'Skipped: bad date'], [3, 'Skipped: bad date'], [4, 'Skipped: bad date']]);
  assert.equal(p.unmatchedRows.length, 1);
});
test('CSAT plan: the plan always has every list key', () => {
  const p = build([HEADER]);
  for (const k of ['matched', 'changes', 'unchanged', 'runwayNewer', 'unmatchedRows', 'notInFile', 'ambiguous', 'conflicts', 'suggestions', 'skipped']) assert.ok(Array.isArray(p[k]), k);
});
test('CSAT plan: on the 211-row fixture every row lands in exactly one list, so the lists add up to 211', () => {
  const { table, customers } = makeFixture();
  const p = build(table, customers);
  assert.equal(p.rowCount, 211);
  assert.equal(p.matched.length + p.unmatchedRows.length + p.ambiguous.length + p.conflicts.length + p.skipped.length, 211);
  assert.equal(p.skipped.length, 1);
});
