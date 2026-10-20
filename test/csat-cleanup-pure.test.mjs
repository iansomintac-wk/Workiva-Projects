import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, J, PLAN_FNS, PLAN_CONSTS, HEADER, sf, gs } from '../tools/lib/csat-fixture.mjs';

for (const nm of ['constructor', '__proto__']) {
  test(`CSAT plan 1f: an unmatched CSV company named "${nm}" is a plain unmatched row and does not throw`, () => {
    const c = loadCsat(PLAN_FNS, PLAN_CONSTS);
    const plan = J(c.buildCsatImportPlan([HEADER, [sf(1), gs(1), nm, '2026-09-01', '']], [], {}));
    assert.equal(plan.unmatchedRows.length, 1);
    assert.equal(plan.suggestions.length, 0);
  });
}
test('CSAT plan 1f: a Runway account named "constructor" still pairs with a CSV row of the same name as a suggestion', () => {
  const c = loadCsat(PLAN_FNS, PLAN_CONSTS);
  const cust = [{ id: 'k1', name: 'constructor', salesforceId: '', gainsightId: '', compliance: { associatedPeopleCSAT: { surveySentOn: null, surveyAnsweredOn: null } } }];
  const plan = J(c.buildCsatImportPlan([HEADER, [sf(1), gs(1), 'constructor', '2026-09-01', '']], cust, {}));
  assert.equal(plan.suggestions.length, 1); assert.equal(plan.suggestions[0].customerId, 'k1');
});
test('Excel partner import 1f: a row named "constructor" with no such account matches nobody (byName is not a plain object)', () => {
  const c = loadCsat(['buildPartnerImportRows', 'excelRowValue', 'normalizeCustomerNameKey'], [], { parseExcelDateCell: () => null, normalizeQuoteWs: s => s });
  const rows = c.buildPartnerImportRows(['Name', 'Note'], [['constructor', 'hello'], ['Fake Co', 'hi']], { name: 'Name', note: 'Note' }, [{ id: 'c1', name: 'Fake Co' }], {});
  assert.equal(rows[0].matchedCustomerId, null);
  assert.equal(rows[1].matchedCustomerId, 'c1');
});
test('fsIdb item 3: a throw inside fn() closes the db and rejects (no uncaught throw, no pending promise)', async () => {
  let closed = 0; const uncaught = [];
  const db = { transaction: () => ({ objectStore: () => ({}) }), close: () => { closed++; } };
  // On the parent the callback throws inside onsuccess; catch that here so the run reports a normal failure instead of an uncaught microtask error.
  const indexedDB = { open: () => { const req = { result: db }; queueMicrotask(() => { try { req.onsuccess(); } catch (e) { uncaught.push(e); } }); return req; } };
  const c = loadCsat(['fsIdb'], [], { indexedDB, FS_DB: 'd', FS_STORE: 's' });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('fsIdb promise stayed pending')), 300));
  await assert.rejects(Promise.race([c.fsIdb('readwrite', () => { throw new Error('boom'); }), timeout]), /boom/);
  assert.deepEqual(uncaught.map(e => e.message), []);
  assert.equal(closed, 1);
});
test('fsIdb O-N8: a transaction abort closes the db and rejects (no pending promise)', async () => {
  let closed = 0; let tx;
  const db = { transaction: () => (tx = { objectStore: () => ({}), abort() {} }), close: () => { closed++; } };
  const indexedDB = { open: () => { const req = { result: db }; queueMicrotask(() => { req.onsuccess(); queueMicrotask(() => { if (typeof tx.onabort === 'function') tx.onabort(); }); }); return req; } };
  const c = loadCsat(['fsIdb'], [], { indexedDB, FS_DB: 'd', FS_STORE: 's' });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('fsIdb promise stayed pending')), 300));
  await assert.rejects(Promise.race([c.fsIdb('readwrite', () => ({})), timeout]), /abort/i);
  assert.equal(closed, 1);
});
test('fsIdb O-N8: an error event followed by its abort event closes the db once and rejects with the first error', async () => {
  let closed = 0; let tx;
  const db = { transaction: () => (tx = { objectStore: () => ({}), abort() {}, error: new Error('write failed') }), close: () => { closed++; } };
  const indexedDB = { open: () => { const req = { result: db }; queueMicrotask(() => { req.onsuccess(); queueMicrotask(() => { tx.onerror(); tx.onabort(); }); }); return req; } };
  const c = loadCsat(['fsIdb'], [], { indexedDB, FS_DB: 'd', FS_STORE: 's' });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('fsIdb promise stayed pending')), 300));
  await assert.rejects(Promise.race([c.fsIdb('readwrite', () => ({})), timeout]), /write failed/);
  await new Promise(r => setTimeout(r, 20));
  assert.equal(closed, 1);
});
