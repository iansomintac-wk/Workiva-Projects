import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, makeFixture, J, PLAN_FNS, PLAN_CONSTS, HEADER, sf, gs } from '../tools/lib/csat-fixture.mjs';

const FNS = [...new Set([...PLAN_FNS, 'normalizeCustomerNameKey', 'applyCsatImportPlan'])];
const ctx = () => loadCsat(FNS, PLAN_CONSTS);
const plan = (c, table, customers) => J(c.buildCsatImportPlan(table, customers, {}));
const bare = (id, name, extra = {}) => ({ id, name, salesforceId: '', gainsightId: '', compliance: {}, ...extra });
const ONE = [HEADER, [sf(1), gs(1), 'Same Co', '2026-09-01', '']];

test('CSAT suggest: Acme Inc and Acme LLC each pair only with their own account and are unticked suggestions', () => {
  const { table, customers } = makeFixture();
  const p = plan(ctx(), table, customers);
  assert.deepEqual(p.suggestions.map(s => [s.csvName, s.customerId]).sort(), [['Acme Holdings, Inc.', 'cAcmeInc'], ['Acme Holdings, LLC', 'cAcmeLlc']]);
  assert.equal(p.matched.some(m => m.customerId.startsWith('cAcme')), false);
});
test('CSAT suggest: nothing about a name-only pair changes unless it is ticked', () => {
  const c = ctx(); const { table, customers } = makeFixture();
  const before = JSON.stringify(customers.filter(x => x.id.startsWith('cAcme')));
  const p = plan(c, table, customers);
  c.applyCsatImportPlan(p, customers, []);
  assert.equal(JSON.stringify(customers.filter(x => x.id.startsWith('cAcme'))), before);
});
test('CSAT suggest: ticking a suggestion writes the Salesforce ID and, only when empty, the Gainsight ID, then sets the dates', () => {
  const c = ctx(); const { table, customers } = makeFixture();
  const p = plan(c, table, customers);
  const row = p.suggestions.find(s => s.customerId === 'cAcmeInc').row;
  const out = c.applyCsatImportPlan(p, customers, [row]);
  const a = customers.find(x => x.id === 'cAcmeInc');
  assert.equal(a.salesforceId, sf(1)); assert.equal(a.gainsightId, gs(1));
  assert.equal(a.compliance.associatedPeopleCSAT.surveySentOn, '2026-09-01');
  assert.equal(a.compliance.associatedPeopleCSAT.surveyAnsweredOn, '2026-09-10');
  assert.equal(customers.find(x => x.id === 'cAcmeLlc').salesforceId, '');
  assert.ok(out.idsWritten >= 1);
});
test('CSAT suggest: a ticked suggestion keeps a Gainsight ID that is already there', () => {
  const c = ctx(); const cust = [bare('a', 'Same Co')];
  const p = plan(c, ONE, cust);
  assert.equal(p.suggestions.length, 1);
  cust[0].gainsightId = 'typed-by-hand';   // typed after the dry run: not overwritten
  c.applyCsatImportPlan(p, cust, [2]);
  assert.equal(cust[0].gainsightId, 'typed-by-hand'); assert.equal(cust[0].salesforceId, sf(1));
});
test('CSAT suggest exclusion: two CSV rows with the same name key give no suggestion', () => {
  const p = plan(ctx(), [HEADER, [sf(1), gs(1), 'Dup Co', '2026-09-01', ''], [sf(2), gs(2), 'dup  co', '2026-09-01', '']], [bare('a', 'Dup Co')]);
  assert.equal(p.suggestions.length, 0);
});
test('CSAT suggest exclusion: two accounts with the same name key give no suggestion', () => {
  const p = plan(ctx(), [HEADER, [sf(1), gs(1), 'Dup Co', '2026-09-01', '']], [bare('a', 'Dup Co'), bare('b', 'dup co')]);
  assert.equal(p.suggestions.length, 0);
});
test('CSAT suggest exclusion: an account that already has a salesforceId is never offered a name suggestion', () => {
  assert.equal(plan(ctx(), ONE, [bare('a', 'Same Co', { salesforceId: '001OTHER00000000AA' })]).suggestions.length, 0);
});
test('CSAT suggest exclusion: an account whose ONLY populated ID is gainsightId is never offered a name suggestion', () => {
  assert.equal(plan(ctx(), ONE, [bare('a', 'Same Co', { gainsightId: 'some-other-id' })]).suggestions.length, 0);
});
test('CSAT apply: applying the fixture twice changes 0 dates the second time and the books stay the same size (145 accounts)', () => {
  const c = ctx(); const { table, customers } = makeFixture();
  const out1 = c.applyCsatImportPlan(plan(c, table, customers), customers, []);
  const snap = JSON.stringify(customers);
  const p2 = plan(c, table, customers);
  const out2 = c.applyCsatImportPlan(p2, customers, []);
  assert.equal(out1.fields, 186);
  assert.equal(p2.changes.length, 0); assert.equal(out2.fields, 0);
  assert.equal(JSON.stringify(customers), snap); assert.equal(customers.length, 145);
});
test('CSAT apply: a newer file updates the same records and creates none', () => {
  const c = ctx(); const { table, customers } = makeFixture();
  c.applyCsatImportPlan(plan(c, table, customers), customers, []);
  const newer = table.map((r, i) => (i === 1 ? [r[0], r[1], r[2], '2026-10-01', ''] : r));
  const p = plan(c, newer, customers);
  assert.deepEqual(p.changes.map(x => [x.customerId, x.field, x.to]), [['c0', 'surveySentOn', '2026-10-01'], ['c0', 'surveyAnsweredOn', '']]);
  c.applyCsatImportPlan(p, customers, []);
  assert.equal(customers.length, 145);
  assert.equal(customers.find(x => x.id === 'c0').compliance.associatedPeopleCSAT.surveyAnsweredOn, null);
});
