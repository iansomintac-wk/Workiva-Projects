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

test('push: HTTP 200 with the item in data.failures is failed (vendor text, scrubbed) and NOT recorded', async () => {
  const s = stub(() => json(200, { result: true, data: { success: {}, failures: { 'q-timeline-1': [{ errorDesc: 'bad type FAKE-ACCESS-yy' }] } } }));
  const { a, stateDir } = adapter(s);
  const [r] = await a.push([TL]);
  assert.equal(r.status, 'failed');
  assert.equal(r.externalId, null);
  assert.match(r.error, /bad type/);
  assert.ok(!r.error.includes('FAKE-ACCESS-yy'));
  assert.equal(existsSync(join(stateDir, 'sent-record.json')), false);
  await a.push([TL]);
  assert.equal(s.seen.length, 2); // retried for real
});

test('push: HTTP 200 with the item in data.failures carrying exactly GS_TL_10_0107 is sent, recorded, and a repeat makes no call (T-14 F3)', async () => {
  const s = stub(() => json(200, { result: true, data: { success: {}, failures: { 'q-timeline-1': [{ errorCode: 'GS_TL_10_0107', errorDesc: 'duplicate' }] } } }));
  const { a, stateDir } = adapter(s);
  const [r] = await a.push([TL]);
  assert.deepEqual(r, { id: 'q-timeline-1', status: 'sent', externalId: 'q-timeline-1', error: null });
  assert.equal(JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'))['q-timeline-1'].externalId, 'q-timeline-1');
  await a.push([TL]);
  assert.equal(s.seen.length, 1);
});

test('push: HTTP 200 data.failures with a code that only contains GS_TL_10_0107, or names it in text, stays failed and NOT recorded (T-14 F3)', async () => {
  for (const entry of [{ errorCode: 'GS_TL_10_01070' }, { errorCode: 'GS_TL_10_0001', errorDesc: 'see GS_TL_10_0107' }]) {
    const s = stub(() => json(200, { result: true, data: { success: {}, failures: { 'q-timeline-1': [entry] } } }));
    const { a, stateDir } = adapter(s);
    const [r] = await a.push([TL]);
    assert.equal(r.status, 'failed', JSON.stringify(entry));
    assert.equal(existsSync(join(stateDir, 'sent-record.json')), false);
  }
});

test('push: HTTP 200 whose data.success lacks the item id is failed and NOT recorded', async () => {
  const s = stub(() => json(200, { result: true, data: { success: { 'some-other-id': [{ activityId: 'X' }] }, failures: {} } }));
  const { a, stateDir } = adapter(s);
  const [r] = await a.push([TL]);
  assert.equal(r.status, 'failed');
  assert.match(r.error, /no activityId/);
  assert.equal(existsSync(join(stateDir, 'sent-record.json')), false);
});

test('push: a CTA reply with no readable id (cta.idPath unset) is sent with externalId null, recorded, and a repeat makes no call (plan: sent without id is OK)', async () => {
  const s = stub(() => json(200, { result: true }));
  const { a, stateDir } = adapter(s);
  const [r] = await a.push([CTA]);
  assert.deepEqual(r, { id: 'q-cta-1', status: 'sent', externalId: null, error: null });
  assert.equal(JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'))['q-cta-1'].externalId, null);
  const [again] = await adapter(s, CFG, stateDir).a.push([CTA]);
  assert.deepEqual(again, { id: 'q-cta-1', status: 'sent', externalId: null, error: null });
  assert.equal(s.seen.length, 1);
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

// Follow-ups F-4 (T-14 F14 and the mixed-code checker low)
test('push F14: one item failing in the middle of three: the other two are sent and recorded, the failed one is not', async () => {
  const items = ['q-tl-a', 'q-tl-b', 'q-tl-c'].map((id) => ({ ...TL, id }));
  const seen = [];
  const fn = async (url, init) => {
    const id = JSON.parse(init.body).records[0].ExternalId; seen.push(id);
    if (id === 'q-tl-b') return json(500, { errorDesc: 'FAKE boom' });
    return json(200, { result: true, data: { failures: {}, success: { [id]: [{ activityId: `ACT-${id}` }] } } });
  };
  const stateDir = mkdtempSync(join(tmpdir(), 'gs-push-'));
  const a = create(CFG, { fetchImpl: fn, tokenSource: { accessToken: async () => 'FAKE-ACCESS-yy' }, sleep: async () => {}, now: () => NOW, stateDir });
  const res = await a.push(items);
  assert.deepEqual(res.map((r) => [r.id, r.status, r.externalId]), [['q-tl-a', 'sent', 'ACT-q-tl-a'], ['q-tl-b', 'failed', null], ['q-tl-c', 'sent', 'ACT-q-tl-c']]);
  assert.deepEqual(seen, ['q-tl-a', 'q-tl-b', 'q-tl-c']);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'))).sort(), ['q-tl-a', 'q-tl-c']);
});

test('push: a data.failures entry with GS_TL_10_0107 alongside other codes counts as sent with our item id (documented in CONTRACT.md)', async () => {
  const s = stub(() => json(200, { result: true, data: { success: {}, failures: { 'q-timeline-1': [{ errorCode: 'GS_TL_10_0107' }, { errorCode: 'GS_TL_10_0001', errorDesc: 'other' }] } } }));
  const { a, stateDir } = adapter(s);
  const [r] = await a.push([TL]);
  assert.deepEqual(r, { id: 'q-timeline-1', status: 'sent', externalId: 'q-timeline-1', error: null });
  assert.ok(JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'))['q-timeline-1']);
});
test('push B3b: two pushes started together keep both send-record entries', async () => {
  // Deterministic interleave: the fake fetch holds every reply until BOTH requests are in flight, then releases them together.
  let release; const gate = new Promise((r) => { release = r; });
  let inFlight = 0;
  const s = stub(() => { inFlight++; if (inFlight === 2) release(); return gate.then(() => json(200, TIMELINE_OK)); });
  const { a, stateDir } = adapter(s);
  const [r1, r2] = await Promise.all([a.push([TL]), a.push([CTA])]);
  assert.equal(inFlight, 2);
  assert.equal(r1[0].status, 'sent'); assert.equal(r2[0].status, 'sent');
  const rec = JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'));
  assert.deepEqual(Object.keys(rec).sort(), ['q-cta-1', 'q-timeline-1']);
});
