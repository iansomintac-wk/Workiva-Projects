// connect-ready T-7: gainsight-rest reads on recorded-shape fixtures and a stubbed fetch. Unproven until --check. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { validate } from '../lib/validate.mjs';
import { create } from '../adapters/gainsight-rest.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = (f) => JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', f), 'utf8'));
const accountsSchema = JSON.parse(readFileSync(join(root, 'schemas', 'accounts.json'), 'utf8'));
const API = 'https://fake-tenant.gainsightcloud.invalid';
const FIELD_MAP = { tier: 'FAKE_Tier__gc', arr: 'FAKE_Arr__gc', renewalDate: 'FAKE_Renewal__gc', csmOwner: 'FAKE_CsmOwner__gc', healthScore: 'FAKE_Health__gc' };
const GATE_MAP = { readinessAssessment: 'FAKE_Readiness__gc', csatContact: 'FAKE_Csat__gc', successPlan: 'FAKE_SuccessPlan__gc' };
const CFG = { adapter: 'gainsight-rest', environment: 'sandbox', appUrl: API, apiBaseUrl: API, tenantId: 'FAKE-TENANT-1', oauth: { clientSecret: 'FAKE-CLIENT-SECRET-zz' }, fieldMap: FIELD_MAP, gateFieldMap: GATE_MAP };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const tokenSource = { accessToken: async () => 'FAKE-ACCESS-yy' };

// Serves a fixture's rows by offset/limit, in the fixture's own envelope form.
function companyStub(fixture, extra = {}) {
  const f = fx(fixture); const rows = Array.isArray(f.data) ? f.data : f.data.records;
  const seen = [];
  const fn = async (url, init) => {
    const body = JSON.parse(init.body); seen.push({ url, init, body });
    if (extra[url]) return extra[url](body);
    const page = rows.slice(body.offset, body.offset + body.limit);
    return json(200, Array.isArray(f.data) ? { ...f, data: page } : { ...f, data: { records: page } });
  };
  return { fn, seen };
}
const adapter = (fetchImpl, cfg = CFG, pageLimit = 5000) => create(cfg, { fetchImpl, tokenSource, pageLimit, sleep: async () => {}, stateDir: mkdtempSync(join(tmpdir(), 'gs-read-')) });

test('gainsight reads: rows in data[] map through fieldMap and validate accounts.json', async () => {
  const accounts = await adapter(companyStub('gainsight-company-query-data.json').fn).listAccounts();
  assert.deepEqual(accounts[0], { gainsightId: '1P02FAKE0001', name: 'Aldridge Energy', tier: 'Gold', arr: 120000, renewalDate: '2027-03-31', csmOwner: 'Ian Fake', healthScore: 72,
    contacts: [], gates: { readinessAssessment: true, csatContact: false, successPlan: false }, openCtas: [] });
  assert.equal(accounts[1].arr, null);          // negative ARR is not a valid amount
  assert.equal(accounts[1].renewalDate, null);  // empty string
  assert.equal(accounts[1].healthScore, null);  // "n/a"
  assert.equal(accounts[2].arr, 45000);         // numeric string
  assert.deepEqual(validate(accountsSchema, { accounts }), []);
});

test('gainsight reads: rows in data.records[] give the same accounts', async () => {
  const a = await adapter(companyStub('gainsight-company-query-data.json').fn).listAccounts();
  const b = await adapter(companyStub('gainsight-company-query-records.json').fn).listAccounts();
  assert.deepEqual(b, a);
});

test('gainsight reads: missing fieldMap gives null fields and selects only Gsid and Name', async () => {
  const s = companyStub('gainsight-company-query-data.json');
  const accounts = await adapter(s.fn, { ...CFG, fieldMap: {}, gateFieldMap: {} }).listAccounts();
  assert.deepEqual(s.seen[0].body.select, ['Gsid', 'Name']);
  for (const a of accounts) for (const k of ['tier', 'arr', 'renewalDate', 'csmOwner', 'healthScore']) assert.equal(a[k], null, k);
  for (const a of accounts) assert.deepEqual(a.gates, { readinessAssessment: false, csatContact: false, successPlan: false });
});

test('gainsight reads: a gate is true only when its mapped field is exactly true', async () => {
  const accounts = await adapter(companyStub('gainsight-company-query-data.json').fn).listAccounts();
  assert.deepEqual(accounts.map((a) => a.gates), [
    { readinessAssessment: true, csatContact: false, successPlan: false },  // "yes" is not true
    { readinessAssessment: false, csatContact: true, successPlan: true },
    { readinessAssessment: false, csatContact: false, successPlan: false },
  ]);
});

test('gainsight reads: pages by offset until a short page (POST /v1/data/objects/query/Company)', async () => {
  const s = companyStub('gainsight-company-query-data.json');
  const accounts = await adapter(s.fn, CFG, 2).listAccounts();
  assert.equal(accounts.length, 3);
  assert.deepEqual(s.seen.map((r) => [r.url, r.body.offset, r.body.limit]), [[`${API}/v1/data/objects/query/Company`, 0, 2], [`${API}/v1/data/objects/query/Company`, 2, 2]]);
});

test('gainsight reads: contacts come from the configured Company Person query, grouped by company; none when unset', async () => {
  const personUrl = `${API}/v1/data/objects/query/FAKE_CompanyPerson`;
  const s = companyStub('gainsight-company-query-data.json', { [personUrl]: () => json(200, { result: true, data: [
    { FAKE_Company: '1P02FAKE0001', FAKE_Name: 'Pat Fake', FAKE_Email: 'pat.fake@fake-customer.invalid', FAKE_Role: 'Sponsor' },
    { FAKE_Company: '1P02FAKE0001', FAKE_Name: 'Lee Fake', FAKE_Email: null, FAKE_Role: null }] }) });
  const cq = { object: 'FAKE_CompanyPerson', companyField: 'FAKE_Company', nameField: 'FAKE_Name', emailField: 'FAKE_Email', roleField: 'FAKE_Role' };
  const accounts = await adapter(s.fn, { ...CFG, contactQuery: cq }).listAccounts();
  assert.deepEqual(accounts[0].contacts, [{ name: 'Pat Fake', email: 'pat.fake@fake-customer.invalid', role: 'Sponsor' }, { name: 'Lee Fake', email: null, role: null }]);
  assert.deepEqual(accounts[1].contacts, []);
  const s2 = companyStub('gainsight-company-query-data.json');
  await adapter(s2.fn).listAccounts();
  assert.equal(s2.seen.length, 1);
});

test('gainsight reads: Bearer from the token source; a reply with neither form names its keys; errors are scrubbed', async () => {
  const s = companyStub('gainsight-company-query-data.json');
  await adapter(s.fn).listAccounts();
  assert.equal(s.seen[0].init.headers.Authorization, 'Bearer FAKE-ACCESS-yy');
  await assert.rejects(adapter(async () => json(200, { result: true, rows: [] })).listAccounts(), /neither data\[\] nor data\.records\[\].*result, rows/);
  await assert.rejects(adapter(async () => json(401, { message: 'FAKE-ACCESS-yy rejected' })).listAccounts(), (e) => e.status === 401 && !e.message.includes('FAKE-ACCESS-yy'));
});
