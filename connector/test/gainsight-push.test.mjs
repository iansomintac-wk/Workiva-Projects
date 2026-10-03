// connect-ready T-8: gainsight-rest push, saved send record, dry-run. Stubbed fetch only. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { validate } from '../lib/validate.mjs';
import { create, DRY_RUN_ERROR, SUCCESS_PLAN_BLOCKED } from '../adapters/gainsight-rest.mjs';

installNetGuard(); // its after() restores fetch and asserts nothing was blocked
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pushSchema = JSON.parse(readFileSync(join(root, 'schemas', 'push-response.json'), 'utf8'));
const TIMELINE_OK = JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', 'gainsight-timeline-create.json'), 'utf8'));
const API = 'https://fake-tenant.gainsightcloud.invalid';
const CFG = { adapter: 'gainsight-rest', environment: 'sandbox', appUrl: API, apiBaseUrl: API, tenantId: 'FAKE-TENANT-1', dryRun: false,
  oauth: { clientSecret: 'FAKE-CLIENT-SECRET-zz' }, authorEmail: 'ian.fake@fake-osm.invalid',
  timeline: { typeName: 'FAKE_Meeting' }, cta: { type: 'FAKE_Risk', companyIdField: 'FAKE_CompanyId', idPath: '' } };
const NOW = new Date('2026-10-02T12:00:00Z');
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const TL = { id: 'q-timeline-1', kind: 'Pending items batch', customerRef: { gainsightId: '1P02FAKE0001', name: 'Aldridge Energy' }, fields: { gates: [{ gateKey: 'readiness', contractKey: 'readinessAssessment', gainsightAction: 'Mark readiness assessment done' }] } };
const CTA = { id: 'q-cta-1', kind: 'At-Risk CTA', customerRef: { gainsightId: '1P02FAKE0001', name: 'Aldridge Energy' }, fields: { ctaName: 'Usage dropped', reason: 'Usage', severity: 'High' } };
const SP = { id: 'q-sp-1', kind: 'Success Plan objective', customerRef: { gainsightId: '1P02FAKE0001', name: 'Aldridge Energy' }, fields: { event: 'created', objective: 'Go live' } };

function stub(reply = () => json(200, TIMELINE_OK)) {
  const seen = []; let tokenCalls = 0;
  const fn = async (url, init) => { seen.push({ url, init, body: JSON.parse(init.body) }); return reply(url); };
  const tokenSource = { accessToken: async () => { tokenCalls++; return 'FAKE-ACCESS-yy'; } };
  return { fn, seen, tokenSource, tokenCalls: () => tokenCalls };
}
const adapter = (s, cfg = CFG, stateDir = mkdtempSync(join(tmpdir(), 'gs-push-'))) =>
  ({ stateDir, a: create(cfg, { fetchImpl: s.fn, tokenSource: s.tokenSource, sleep: async () => {}, now: () => NOW, stateDir }) });

test('push dry-run (the default): nothing is sent, each item fails with the dry-run error, the request is logged', async () => {
  const s = stub();
  const { a, stateDir } = adapter(s, { ...CFG, dryRun: undefined });
  const res = await a.push([TL, CTA]);
  assert.deepEqual(res.map((r) => [r.status, r.error]), [['failed', DRY_RUN_ERROR], ['failed', DRY_RUN_ERROR]]);
  assert.equal(DRY_RUN_ERROR, 'dry run: not sent; see connector/dry-run.jsonl');
  assert.equal(s.seen.length, 0);
  assert.equal(s.tokenCalls(), 0);
  const lines = readFileSync(join(stateDir, 'dry-run.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines.length, 2);
  assert.equal(lines[0].url, `${API}/v1/ant/es/activity`);
  assert.equal(lines[0].body.records[0].ExternalId, 'q-timeline-1');
  assert.equal(lines[1].url, `${API}/v2/cockpit/cta`);
});

test('push dry-run file holds no credential', async () => {
  const s = stub();
  const { a, stateDir } = adapter(s, { ...CFG, dryRun: true });
  await a.push([TL, CTA]);
  const text = readFileSync(join(stateDir, 'dry-run.jsonl'), 'utf8');
  for (const secret of ['FAKE-CLIENT-SECRET-zz', 'FAKE-ACCESS-yy']) assert.ok(!text.includes(secret), secret);
  assert.ok(text.includes('Bearer [redacted]'));
});

test('push live (sandbox): a Timeline item is POSTed with ExternalId = item id and answers sent with the activityId', async () => {
  const s = stub();
  const { a } = adapter(s);
  const [r] = await a.push([TL]);
  assert.deepEqual(r, { id: 'q-timeline-1', status: 'sent', externalId: '1I00FAKEACT0001', error: null });
  assert.equal(s.seen[0].url, `${API}/v1/ant/es/activity`);
  assert.equal(s.seen[0].init.headers.Authorization, 'Bearer FAKE-ACCESS-yy');
  const rec = s.seen[0].body.records[0];
  assert.deepEqual([rec.ContextName, rec.TypeName, rec.ExternalId, rec.Author, rec.companyName], ['Company', 'FAKE_Meeting', 'q-timeline-1', 'ian.fake@fake-osm.invalid', 'Aldridge Energy']);
  assert.equal(rec.ActivityDate, '2026-10-02T12:00:00.000+0000');
  assert.match(rec.Notes, /Mark readiness assessment done/);
});

test('push: a repeated id after a restart answers sent with the stored id and makes no call (saved send record)', async () => {
  const s = stub();
  const { a, stateDir } = adapter(s);
  await a.push([TL]);
  const rec = JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'));
  assert.deepEqual(Object.keys(rec['q-timeline-1']).sort(), ['at', 'externalId', 'kind', 'tenant']);
  const again = adapter(s, CFG, stateDir).a;  // a new instance = a restart
  const [r] = await again.push([TL]);
  assert.deepEqual(r, { id: 'q-timeline-1', status: 'sent', externalId: '1I00FAKEACT0001', error: null });
  assert.equal(s.seen.length, 1);
});

test('push: a failed item is not stored, so a retry is a real attempt; the error is scrubbed', async () => {
  const s = stub(() => json(500, { errorDesc: 'boom FAKE-ACCESS-yy' }));
  const { a, stateDir } = adapter(s);
  const [r] = await a.push([TL]);
  assert.equal(r.status, 'failed');
  assert.ok(!r.error.includes('FAKE-ACCESS-yy'));
  assert.equal(existsSync(join(stateDir, 'sent-record.json')), false);
  await a.push([TL]);
  assert.equal(s.seen.length, 2);
});

test('push: a duplicate-ExternalId rejection (GS_TL_10_0107) means already in Gainsight: sent, recorded', async () => {
  const s = stub(() => json(400, { result: false, errorCode: 'GS_TL_10_0107', errorDesc: 'duplicate' }));
  const { a, stateDir } = adapter(s);
  const [r] = await a.push([TL]);
  assert.deepEqual(r, { id: 'q-timeline-1', status: 'sent', externalId: 'q-timeline-1', error: null });
  assert.ok(JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'))['q-timeline-1']);
});

test('push: At-Risk CTA is POST /v2/cockpit/cta with referenceId, Name, type, OwnerEmail and the configured company field', async () => {
  const s = stub(() => json(200, { result: true }));
  const { a } = adapter(s);
  const [r] = await a.push([CTA]);
  assert.equal(r.status, 'sent');
  assert.equal(r.externalId, null); // cta.idPath unset: the Gsid's place in the reply is UNCONFIRMED
  assert.equal(s.seen[0].url, `${API}/v2/cockpit/cta`);
  assert.deepEqual(s.seen[0].body.requests[0].record, { referenceId: 'q-cta-1', Name: 'Usage dropped', type: 'FAKE_Risk', OwnerEmail: 'ian.fake@fake-osm.invalid', FAKE_CompanyId: '1P02FAKE0001' });
  const s2 = stub();
  const [m] = await adapter(s2, { ...CFG, cta: { type: 'FAKE_Risk', companyIdField: '' } }).a.push([{ ...CTA, id: 'q-cta-2' }]);
  assert.match(m.error, /gainsight\.cta\.companyIdField is empty/);
  const [n] = await adapter(s2).a.push([{ ...CTA, id: 'q-cta-3', customerRef: { gainsightId: null, name: 'Aldridge Energy' } }]);
  assert.match(n.error, /no Gainsight id/);
  assert.equal(s2.seen.length, 0);
});

test('push: Success Plan objective is not sent (blocker B1); the whole response validates push-response.json', async () => {
  const s = stub();
  const res = await adapter(s).a.push([SP, TL]);
  assert.deepEqual(res[0], { id: 'q-sp-1', status: 'failed', externalId: null, error: SUCCESS_PLAN_BLOCKED });
  assert.equal(s.seen.length, 1); // only the Timeline item
  assert.deepEqual(validate(pushSchema, { results: res }), []);
});
