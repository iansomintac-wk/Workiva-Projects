import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlLF, csatFnNames, networkHits } from '../tools/lib/csat-fixture.mjs';

const REQUIRED = ['csatSentOk', 'csatIdsMatch', 'csatDecide', 'csatChangesFor', 'buildCsatImportPlan', 'applyCsatImportPlan'];

test('CSAT no network, negative control: a fetch( injected into csatSentOk (in memory) is reported', () => {
  const src = htmlLF().replace('function csatSentOk(v){', "function csatSentOk(v){ fetch('/x');");
  assert.deepEqual(networkHits(src, REQUIRED), ['csatSentOk']);
});
test('CSAT no network, negative control: an XMLHttpRequest injected into applyCsatImportPlan (in memory) is reported', () => {
  const src = htmlLF().replace('function applyCsatImportPlan(plan, customers, tickedRows){', 'function applyCsatImportPlan(plan, customers, tickedRows){ new XMLHttpRequest();');
  assert.deepEqual(networkHits(src, REQUIRED), ['applyCsatImportPlan']);
});
test('CSAT no network: every required import function is found by the scan and none of the csat functions in 1.1 touches the network', () => {
  const src = htmlLF();
  const names = csatFnNames(src);
  for (const n of REQUIRED) assert.ok(names.includes(n), n + ' not found by the scan');
  assert.deepEqual(networkHits(src, names), []);
});
