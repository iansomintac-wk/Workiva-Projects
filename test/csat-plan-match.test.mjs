import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, makeFixture, J, PLAN_FNS, PLAN_CONSTS, HEADER, sf, gs } from '../tools/lib/csat-fixture.mjs';

const FNS = [...new Set([...PLAN_FNS, 'csatIdsMatch'])];
const ctx = () => loadCsat(FNS, PLAN_CONSTS);
const C = (id, extra = {}) => ({ id, name: 'N ' + id, salesforceId: '', gainsightId: '', compliance: { associatedPeopleCSAT: { surveySentOn: null, surveyAnsweredOn: null } }, ...extra });
const R = (n, o = {}) => [o.sf ?? sf(n), o.gs ?? gs(n), o.name ?? 'Fake ' + n, '2026-09-01', ''];
const build = (rows, customers) => J(ctx().buildCsatImportPlan([HEADER, ...rows], customers, {}));

test('CSAT match: step 1, salesforceId equals the 18-char ID', () => {
  assert.deepEqual(build([R(1)], [C('a', { salesforceId: sf(1) })]).matched.map(m => m.customerId), ['a']);
});
test('CSAT match: a stored 15-char salesforceId matches on the first 15 characters', () => {
  assert.deepEqual(build([R(1)], [C('a', { salesforceId: sf(1).slice(0, 15) })]).matched.map(m => m.customerId), ['a']);
});
test('CSAT match: csatIdsMatch compares 15 vs 18 both ways, is case-sensitive, refuses short or empty IDs, and refuses two different 18-char IDs that share their first 15', () => {
  const f = ctx().csatIdsMatch;
  assert.equal(f(sf(1), sf(1).slice(0, 15)), true);
  assert.equal(f(sf(1).slice(0, 15), sf(1)), true);
  assert.equal(f(sf(1), sf(1).toLowerCase()), false);
  assert.equal(f(sf(1).slice(0, 14), sf(1)), false);
  assert.equal(f('', ''), false);
  assert.equal(f(sf(1), sf(2)), false);
  assert.equal(f(sf(1), sf(1).slice(0, 15) + 'ZZZ'), false);
});
test('CSAT match: step 2, an ID typed into gainsightId (18 chars) matches the Salesforce ID', () => {
  assert.deepEqual(build([R(1)], [C('a', { gainsightId: sf(1) })]).matched.map(m => m.customerId), ['a']);
});
test('CSAT match: step 2, a 15-char Salesforce ID typed into gainsightId matches on the first 15 characters', () => {
  assert.deepEqual(build([R(1)], [C('a', { gainsightId: sf(1).slice(0, 15) })]).matched.map(m => m.customerId), ['a']);
});
test('CSAT match: step 3, gainsightId equals GAINSIGHT_COMPANY_ID', () => {
  assert.deepEqual(build([R(1)], [C('a', { gainsightId: gs(1) })]).matched.map(m => m.customerId), ['a']);
});
test('CSAT match: an earlier step that hits exactly one customer wins over a later step that hits another', () => {
  assert.deepEqual(build([R(1)], [C('a', { salesforceId: sf(1) }), C('b', { gainsightId: gs(1) })]).matched.map(m => m.customerId), ['a']);
});
test('CSAT match: two customers with the same salesforceId make the row Ambiguous (step 1) and skip it', () => {
  const p = build([R(1)], [C('a', { salesforceId: sf(1) }), C('b', { salesforceId: sf(1) })]);
  assert.equal(p.matched.length, 0);
  assert.deepEqual(p.ambiguous, [{ row: 2, name: 'Fake 1', customerIds: ['a', 'b'] }]);
});
test('CSAT match: two customers with the Salesforce ID typed into gainsightId make the row Ambiguous (step 2), not matched to either', () => {
  const p = build([R(1)], [C('a', { gainsightId: sf(1) }), C('b', { gainsightId: sf(1) })]);
  assert.equal(p.matched.length, 0);
  assert.deepEqual(p.ambiguous, [{ row: 2, name: 'Fake 1', customerIds: ['a', 'b'] }]);
});
test('CSAT match: two customers with the same Gainsight ID make the row Ambiguous (step 3), not matched to either', () => {
  const p = build([R(1)], [C('a', { gainsightId: gs(1) }), C('b', { gainsightId: gs(1) })]);
  assert.equal(p.matched.length, 0);
  assert.deepEqual(p.ambiguous, [{ row: 2, name: 'Fake 1', customerIds: ['a', 'b'] }]);
});
test('CSAT match: one customer hit by two rows puts both rows in Conflict and applies neither', () => {
  const p = build([R(1), R(2, { gs: gs(1), sf: sf(2) })], [C('a', { gainsightId: gs(1) })]);
  assert.equal(p.matched.length, 0);
  assert.deepEqual(p.conflicts.map(c => c.row).sort(), [2, 3]);
});
test('CSAT match: names never match, even an exact name with no IDs', () => {
  const p = build([R(1, { name: 'Same Name' })], [C('a', { name: 'Same Name' })]);
  assert.equal(p.matched.length, 0);
  assert.equal(p.unmatchedRows.length, 1);
});
test('CSAT match: a row with no matching account is listed in unmatchedRows and no account is created', () => {
  const customers = [C('a', { salesforceId: sf(9) })];
  const p = build([R(1)], customers);
  assert.deepEqual(p.unmatchedRows.map(r => r.row), [2]);
  assert.equal(customers.length, 1);
});
test('CSAT match: on the 211-row fixture 136 match, 1 is ambiguous, 73 are unmatched, 1 is skipped, 0 conflict, and they add up to 211', () => {
  const { table, customers } = makeFixture();
  const p = build(table.slice(1).map(r => r.slice()), customers);
  assert.deepEqual([p.matched.length, p.ambiguous.length, p.unmatchedRows.length, p.skipped.length, p.conflicts.length], [136, 1, 73, 1, 0]);
  assert.equal(136 + 1 + 73 + 1 + 0, p.rowCount);
});
