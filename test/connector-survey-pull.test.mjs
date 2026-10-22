import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadCsat, J, PLAN_FNS, PLAN_CONSTS, HEADER, htmlLF } from '../tools/lib/csat-fixture.mjs';

const rows = JSON.parse(readFileSync(new URL('../connector/fixtures/snowflake-csat-demo.json', import.meta.url), 'utf8')).rows;
const cust = (id, name, sfId, gsId, sent, ans) => ({ id, name, salesforceId: sfId, gainsightId: gsId, compliance: { associatedPeopleCSAT: { done: false, date: null, contactName: '', surveySentOn: sent, surveyAnsweredOn: ans } } });
// Same ids and states as demo-seed.js customers 1..3 (new, filled, unchanged), which cannot load in Node.
const customers = () => [
  cust('d1', 'Aldridge Energy', '001DEMO0000000001AAA', 'GS-DEMO-001', null, null),
  cust('d2', 'Brightwater Foods', '001DEMO0000000002AAA', 'GS-DEMO-002', '2026-09-21', null),
  cust('d3', 'Corvus Logistics', '001DEMO0000000003AAA', 'GS-DEMO-003', '2026-09-11', '2026-09-16'),
];
const FNS = [...PLAN_FNS, 'surveyRowsToTable'];
const ctx = (extra = {}) => loadCsat([...FNS, 'checkSurveyDatesViaConnector'], PLAN_CONSTS, extra);
const csvOf = rs => [HEADER.join(','), ...rs.map(r => HEADER.map(k => r[k] ?? '').join(','))].join('\n');

test('survey pull: the plan from connector rows deep-equals the plan from the CSV of the same rows', () => {
  const c = ctx();
  const viaCsv = J(c.buildCsatImportPlan(c.parseCsv(csvOf(rows)), customers(), {}));
  const viaConn = J(c.buildCsatImportPlan(c.surveyRowsToTable(rows), customers(), {}));
  assert.deepEqual(viaConn, viaCsv);
});
test('survey pull: surveyRowsToTable has the 5 column names first and blank cells are empty strings', () => {
  const t = J(ctx().surveyRowsToTable([{ COMPANY_NAME: 'X' }, ...rows]));
  assert.deepEqual(t[0], HEADER);
  assert.deepEqual(t[1], ['', '', 'X', '', '']);
  assert.equal(t.length, rows.length + 2);
  assert.ok(t.flat().every(v => typeof v === 'string'));
});
test('survey pull: the demo rows give a new date, a filled answer, an unchanged and an unmatched row', () => {
  const c = ctx();
  const p = J(c.buildCsatImportPlan(c.surveyRowsToTable(rows), customers(), {}));
  assert.ok(p.changes.some(x => x.customerId === 'd1' && x.field === 'surveySentOn'), 'new');
  assert.ok(p.changes.some(x => x.customerId === 'd2' && x.field === 'surveyAnsweredOn'), 'filled');
  assert.ok(p.unchanged.length >= 1, 'unchanged');
  assert.ok(p.unmatchedRows.length >= 1, 'unmatched');
});
test('survey pull: the button sits inside a connectorConfigured() conditional and no csat* function uses connectorRequest', () => {
  const t = htmlLF();
  const i = t.indexOf('id="btn-check-survey-connector"');
  assert.ok(i > 0);
  assert.ok(/connectorConfigured\(\) \?/.test(t.slice(Math.max(0, i - 400), i)));
  const re = /function (csat\w*)\(/g; let m;
  while ((m = re.exec(t))) {
    const j = t.indexOf('\n}\n', m.index);
    assert.ok(!/connectorRequest/.test(t.slice(m.index, j)), m[1] + ' uses connectorRequest');
  }
});
test('survey pull: offline leaves DATA untouched and opens no modal', async () => {
  const DATA = { customers: customers() };
  const before = JSON.stringify(DATA);
  let modal = 0; const toasts = [];
  const c = ctx({ DATA, connectorRequest: async () => { throw Object.assign(new Error('off'), { code: 'OFFLINE' }); }, openCsatImportModal: () => { modal++; }, showToast: m => toasts.push(m) });
  await c.checkSurveyDatesViaConnector();
  assert.equal(modal, 0);
  assert.equal(JSON.stringify(DATA), before);
  assert.equal(toasts.length, 1);
});
test('survey pull: a good response opens the modal with the plan', async () => {
  let got;
  const c = ctx({ DATA: { customers: customers() }, connectorRequest: async p => { assert.equal(p, '/v1/csat'); return { rows }; }, openCsatImportModal: (plan, meta) => { got = { plan, meta }; }, showToast() {} });
  await c.checkSurveyDatesViaConnector();
  assert.equal(got.plan.error, null);
  assert.ok(got.meta.fileName);
});
