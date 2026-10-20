import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, makeFixture, J, PLAN_FNS, PLAN_CONSTS, HEADER, sf, gs } from '../tools/lib/csat-fixture.mjs';

const FNS = [...new Set([...PLAN_FNS, 'csatDecide', 'csatChangesFor'])];
const ctx = () => loadCsat(FNS, PLAN_CONSTS);
const cu = (sent, ans) => ({ id: 'a', name: 'N a', salesforceId: sf(1), gainsightId: '', compliance: { associatedPeopleCSAT: { surveySentOn: sent, surveyAnsweredOn: ans } } });
const run = (c, sent, ans) => J(ctx().buildCsatImportPlan([HEADER, [sf(1), gs(1), 'X', sent, ans]], [c], {}));
const to = p => Object.fromEntries(p.changes.map(c => [c.field, [c.from, c.to]]));

test('CSAT update: Runway sent empty sets the sent date and sets answered when the CSV has one', () => {
  assert.deepEqual(to(run(cu(null, null), '2026-09-01', '2026-09-05')), { surveySentOn: ['', '2026-09-01'], surveyAnsweredOn: ['', '2026-09-05'] });
});
test('CSAT update: Runway sent empty and CSV answered empty sets only the sent date', () => {
  assert.deepEqual(to(run(cu(null, null), '2026-09-01', '')), { surveySentOn: ['', '2026-09-01'] });
});
test('CSAT update: Runway sent empty never clears an answered date Runway already has', () => {
  assert.deepEqual(to(run(cu(null, '2026-08-01'), '2026-09-01', '')), { surveySentOn: ['', '2026-09-01'] });
});
test('CSAT update: a newer CSV sent date takes both dates, and answered becomes empty for a new unanswered survey', () => {
  assert.deepEqual(to(run(cu('2026-08-01', '2026-08-05'), '2026-09-01', '')), { surveySentOn: ['2026-08-01', '2026-09-01'], surveyAnsweredOn: ['2026-08-05', ''] });
});
test('CSAT update: the same sent date fills a missing answered date and changes nothing else', () => {
  assert.deepEqual(to(run(cu('2026-09-01', null), '2026-09-01', '2026-09-05')), { surveyAnsweredOn: ['', '2026-09-05'] });
});
test('CSAT update: the same sent date never clears or overwrites an answered date Runway has', () => {
  const a = run(cu('2026-09-01', '2026-09-03'), '2026-09-01', '');
  const b = run(cu('2026-09-01', '2026-09-03'), '2026-09-01', '2026-09-09');
  assert.equal(a.changes.length + b.changes.length, 0);
  assert.deepEqual([a.unchanged, b.unchanged], [['a'], ['a']]);
});
test('CSAT update: a Runway sent date newer than the CSV leaves the account alone and lists it', () => {
  const p = run(cu('2026-10-01', null), '2026-09-01', '2026-09-05');
  assert.equal(p.changes.length, 0);
  assert.deepEqual(p.runwayNewer, [{ customerId: 'a', name: 'N a', runwaySent: '2026-10-01', csvSent: '2026-09-01' }]);
  assert.equal(p.unchanged.length, 0);
});
test('CSAT update: accounts no row matched are listed as not in the file, except those named by an ambiguous row', () => {
  const { table, customers } = makeFixture();
  const p = J(ctx().buildCsatImportPlan(table, customers, {}));
  assert.deepEqual(p.notInFile.map(x => x.customerId).sort(), ['cAcmeInc', 'cAcmeLlc', 'cOnly0', 'cOnly1', 'cOnly2', 'cOnly3', 'cOnly4']);
});
test('CSAT update: on the fixture (every Runway date empty) 136 sent dates and 50 answered dates would be set, 186 changes', () => {
  const { table, customers } = makeFixture();
  const p = J(ctx().buildCsatImportPlan(table, customers, {}));
  assert.equal(p.changes.length, 186);
  assert.equal(p.changes.filter(c => c.field === 'surveyAnsweredOn').length, 50);
  assert.equal(p.unchanged.length + p.runwayNewer.length + p.changes.map(c => c.customerId).filter((x, i, a) => a.indexOf(x) === i).length, 136);
});
