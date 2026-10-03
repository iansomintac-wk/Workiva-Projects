// connect-ready T-5: gong-rest on recorded-shape fixtures and a stubbed fetch. Unproven until --check. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { validate } from '../lib/validate.mjs';
import { create } from '../adapters/gong-rest.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = (f) => JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', f), 'utf8'));
const callsSchema = JSON.parse(readFileSync(join(root, 'schemas', 'calls.json'), 'utf8'));
const CFG = { adapter: 'gong-rest', baseUrl: 'https://fake-tenant.gong.invalid/', accessKey: 'FAKE-KEY-123', accessKeySecret: 'FAKE-SECRET-456', myEmail: 'Ian.Fake@fake-osm.invalid' };
const BASIC = Buffer.from('FAKE-KEY-123:FAKE-SECRET-456').toString('base64');
const NOW = new Date('2026-10-02T12:00:00Z');
const PAGES = { first: fx('gong-calls-extensive-page1.json'), 'CURSOR-FAKE-2': fx('gong-calls-extensive-page2.json') };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function stub(reply = (body) => json(200, body.cursor ? PAGES[body.cursor] : PAGES.first)) {
  const seen = [];
  const fn = async (url, init) => { const body = JSON.parse(init.body); seen.push({ url, init, body }); return reply(body); };
  return { fn, seen };
}
const adapter = (fetchImpl, extra = {}) => create({ ...CFG, ...extra }, { fetchImpl, now: () => NOW, sleep: async () => {}, stateDir: mkdtempSync(join(tmpdir(), 'gong-rest-')) });

test('gong-rest: pages through every cursor with POST /v2/calls/extensive and Basic auth', async () => {
  const s = stub();
  await adapter(s.fn).listCalls();
  assert.equal(s.seen.length, 2);
  for (const r of s.seen) {
    assert.equal(r.url, 'https://fake-tenant.gong.invalid/v2/calls/extensive');
    assert.equal(r.init.method, 'POST');
    assert.equal(r.init.headers.Authorization, `Basic ${BASIC}`);
    assert.equal(r.body.contentSelector.exposedFields.parties, true);
    assert.equal(r.body.contentSelector.exposedFields.content.brief, true);
  }
  assert.equal(s.seen[0].body.cursor, undefined);
  assert.equal(s.seen[1].body.cursor, 'CURSOR-FAKE-2');
});

test('gong-rest: date window is since..now, or 30 days back..now when since is absent (both dates required, Q1)', async () => {
  const s = stub();
  await adapter(s.fn).listCalls({ since: '2026-09-15T00:00:00Z' });
  assert.deepEqual(s.seen[0].body.filter, { fromDateTime: '2026-09-15T00:00:00.000Z', toDateTime: '2026-10-02T12:00:00.000Z' });
  const s2 = stub();
  await adapter(s2.fn).listCalls();
  assert.deepEqual(s2.seen[0].body.filter, { fromDateTime: '2026-09-02T12:00:00.000Z', toDateTime: '2026-10-02T12:00:00.000Z' });
});

test('gong-rest: keeps only calls where gong.myEmail is a participant, case-insensitive', async () => {
  const calls = await adapter(stub().fn).listCalls();
  assert.deepEqual(calls.map((c) => c.callId), ['7001', '7003']);
});

test('gong-rest: maps affiliation Internal/External/Unknown to internal/customer/unknown', async () => {
  const [c] = await adapter(stub().fn).listCalls();
  assert.deepEqual(c.participants, [
    { name: 'Ian Fake', email: 'ian.fake@fake-osm.invalid', affiliation: 'internal' },
    { name: 'Pat Fake', email: 'pat.fake@fake-customer.invalid', affiliation: 'customer' },
    { name: 'Dial-in caller', email: null, affiliation: 'unknown' },
  ]);
});

test('gong-rest: transcript is always "" (CR4), summary is the brief or "", and the result validates calls.json', async () => {
  const calls = await adapter(stub().fn).listCalls();
  assert.ok(calls.every((c) => c.transcript === ''));
  assert.equal(calls[0].summary, 'FAKE brief: reviewed rollout status and agreed next steps.');
  assert.equal(calls[1].summary, '');
  assert.deepEqual(calls[0].accountRef, { gainsightId: null, name: null });
  assert.deepEqual(validate(callsSchema, { calls }), []);
});

test('gong-rest: errors never carry the key, the secret or the Basic string', async () => {
  const s = stub(() => json(401, { errors: [`bad key FAKE-KEY-123 / FAKE-SECRET-456 / ${BASIC}`] }));
  await assert.rejects(adapter(s.fn).listCalls(), (e) => {
    assert.equal(e.status, 401);
    for (const secret of ['FAKE-KEY-123', 'FAKE-SECRET-456', BASIC]) assert.ok(!e.message.includes(secret), e.message);
    return true;
  });
  await assert.rejects(adapter(async () => { throw new TypeError('fetch failed FAKE-SECRET-456'); }).listCalls(), (e) => e.message === 'Network error reaching Gong.');
});

test('gong-rest: not configured refuses without calling fetch and names the missing keys', async () => {
  const s = stub();
  await assert.rejects(adapter(s.fn, { accessKeySecret: '', myEmail: '' }).listCalls(), /missing gong\.accessKeySecret, gong\.myEmail.*--setup/);
  assert.equal(s.seen.length, 0);
});
