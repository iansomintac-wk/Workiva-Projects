// Contract v1 tests: schemas, validator, fixtures. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validate } from '../lib/validate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const load = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const schema = (n) => load(`schemas/${n}.json`);
const calls = () => load('fixtures/calls.json');
const accounts = () => load('fixtures/accounts.json');
const seedText = readFileSync(join(root, '..', 'demo-seed.js'), 'utf8');
const STAKEHOLDER_EMAIL = 'sam.demo@fake-customer.invalid';
const DEMO_NAMES = ['Aldridge Energy', 'Brightwater Foods', 'Corvus Logistics', 'Delta Fields Mining', 'Eastmark Pharma',
  'Fernbrook Retail', 'Granite Peak Utilities', 'Harborline Shipping', 'Ironvale Manufacturing', 'Juniper Health',
  'Kestrel Aviation', 'Lumen Financial', 'Summit Grain Co', 'Meridian Chemicals', 'Northgate Insurance',
  'Orchard Grove Agri', 'Pinecrest Media'];

test('validate: type, required, enum, nested paths', () => {
  const s = { type: 'object', required: ['a'], additionalProperties: false,
    properties: { a: { type: ['string', 'null'] }, b: { type: 'integer', minimum: 1 }, c: { enum: ['x', 'y'] },
      d: { type: 'array', items: { type: 'string', minLength: 1 } }, e: { type: 'string', format: 'date-time' } } };
  assert.deepEqual(validate(s, { a: null, b: 1, c: 'x', d: ['q'], e: '2026-09-01T10:00:00Z' }), []);
  assert.ok(validate(s, {}).some((m) => m.includes('$.a')), 'missing required');
  assert.ok(validate(s, { a: 1 }).length > 0, 'wrong type');
  assert.ok(validate(s, { a: 'x', b: 0 }).length > 0, 'minimum');
  assert.ok(validate(s, { a: 'x', c: 'z' }).length > 0, 'enum');
  assert.ok(validate(s, { a: 'x', d: [''] }).some((m) => m.includes('$.d[0]')), 'items path');
  assert.ok(validate(s, { a: 'x', zz: 1 }).length > 0, 'additionalProperties false');
  assert.ok(validate(s, { a: 'x', e: 'yesterday' }).length > 0, 'date-time');
  assert.ok(validate(s, { a: 'x', b: 1.5 }).length > 0, 'integer rejects 1.5');
});

const SCHEMAS = ['health', 'calls', 'accounts', 'push-request', 'push-response', 'ai-request', 'ai-response', 'error'];

test('every schema file loads and declares a 2020-12 $schema', () => {
  for (const n of SCHEMAS) assert.match(schema(n).$schema, /2020-12/, n);
});

test('calls fixture validates against calls schema', () => {
  assert.deepEqual(validate(schema('calls'), calls()), []);
});
test('accounts fixture validates against accounts schema', () => {
  assert.deepEqual(validate(schema('accounts'), accounts()), []);
});

test('health: valid and invalid', () => {
  const ok = { version: '1', adapters: { gong: 'fake', gainsight: 'fake', ai: 'fake' } };
  assert.deepEqual(validate(schema('health'), ok), []);
  assert.ok(validate(schema('health'), { version: '1' }).length > 0, 'missing adapters');
  assert.ok(validate(schema('health'), { ...ok, version: 1 }).length > 0, 'wrong type');
});

test('calls schema rejects bad values', () => {
  const c = calls();
  assert.ok(validate(schema('calls'), { calls: [{ ...c.calls[0], callId: undefined }] }).length > 0, 'missing callId');
  assert.ok(validate(schema('calls'), { calls: [{ ...c.calls[0], durationSec: 'long' }] }).length > 0, 'wrong type');
  assert.ok(validate(schema('calls'), { calls: [{ ...c.calls[0], kind: 'sms' }] }).length > 0, 'bad kind enum');
  assert.ok(validate(schema('calls'), { calls: [{ ...c.calls[0], startedAt: 'last week' }] }).length > 0, 'bad date');
});

test('accounts schema rejects bad values', () => {
  const a = accounts();
  assert.ok(validate(schema('accounts'), { accounts: [{ ...a.accounts[0], gainsightId: undefined }] }).length > 0);
  assert.ok(validate(schema('accounts'), { accounts: [{ ...a.accounts[0], arr: 'big' }] }).length > 0);
  assert.ok(validate(schema('accounts'), { accounts: [{ ...a.accounts[0], gates: { readinessAssessment: 'yes' } }] }).length > 0);
});

test('push request/response: valid and invalid', () => {
  const req = { items: [
    { id: 'q1', kind: 'Pending items batch', customerRef: { gainsightId: 'GS-DEMO-001', name: 'Aldridge Energy' },
      fields: { gates: [{ gateKey: 'sentiment', contractKey: 'readinessAssessment', gainsightAction: 'Complete it' }] } },
    { id: 'q2', kind: 'Success Plan objective', customerRef: { gainsightId: null, name: 'Aldridge Energy' },
      fields: { event: 'created', objective: 'x', goalType: 'adoption', targetCycle: 'Q1', verdict: null, changeReason: '', anything: 1 } },
    { id: 'q3', kind: 'At-Risk CTA', customerRef: { gainsightId: 'GS-DEMO-002', name: 'Brightwater Foods' },
      fields: { ctaName: 'x', reason: 'y', severity: 'high' } },
    { id: 'q4', kind: 'Success Outcome Plan', customerRef: { gainsightId: 'GS-DEMO-003', name: 'Corvus Logistics' },
      fields: { outcomes: ['a', 'b'] } } ] };
  assert.deepEqual(validate(schema('push-request'), req), []);
  assert.ok(validate(schema('push-request'), { items: [{ id: 'q', kind: 'Nope', customerRef: { name: 'x' }, fields: {} }] }).length > 0, 'unknown kind');
  assert.ok(validate(schema('push-request'), { items: [{ id: 'q', kind: 'At-Risk CTA' }] }).length > 0, 'missing fields');
  assert.ok(validate(schema('push-request'), {}).length > 0, 'missing items');
  const res = { results: [{ id: 'q1', status: 'sent', externalId: 'FAKE-q1', error: null },
    { id: 'q2', status: 'failed', externalId: null, error: 'boom' }] };
  assert.deepEqual(validate(schema('push-response'), res), []);
  assert.ok(validate(schema('push-response'), { results: [{ id: 'q1', status: 'maybe', externalId: null, error: null }] }).length > 0, 'bad status');
});

test('ai request/response and error: valid and invalid', () => {
  assert.deepEqual(validate(schema('ai-request'), { task: 'brief_my_day', prompt: 'hi', maxTokens: 100 }), []);
  assert.ok(validate(schema('ai-request'), { task: 'brief_my_day', prompt: '' }).length > 0, 'empty prompt / missing maxTokens');
  assert.ok(validate(schema('ai-request'), { task: 'poetry', prompt: 'x', maxTokens: 10 }).length > 0, 'bad task');
  assert.ok(validate(schema('ai-request'), { task: 'debrief', prompt: 'x', maxTokens: 0 }).length > 0, 'maxTokens minimum');
  assert.deepEqual(validate(schema('ai-response'), { text: 'ok' }), []);
  assert.ok(validate(schema('ai-response'), { text: 5 }).length > 0);
  assert.deepEqual(validate(schema('error'), { error: 'unauthorized' }), []);
  assert.ok(validate(schema('error'), {}).length > 0);
});

test('calls fixture: the five matching cases are present', () => {
  const cs = calls().calls;
  const ref = (c) => c.accountRef || {};
  const byId = cs.filter((c) => ref(c).gainsightId && c.kind !== 'email');
  assert.ok(byId.length >= 2, 'at least 2 calls matched by gainsightId');
  const nameOnly = cs.filter((c) => !ref(c).gainsightId && ref(c).name);
  assert.equal(nameOnly.length, 1, 'one name-only call');
  assert.ok(DEMO_NAMES.includes(ref(nameOnly[0]).name), 'exact demo name');
  const noRef = cs.filter((c) => !ref(c).gainsightId && !ref(c).name);
  const emailOnly = noRef.filter((c) => c.participants.some((p) => p.email === STAKEHOLDER_EMAIL));
  assert.equal(emailOnly.length, 1, 'one call matchable only by the seeded stakeholder email');
  assert.equal(noRef.length - emailOnly.length, 1, 'one unmatchable call');
  const emails = cs.filter((c) => c.kind === 'email' && ref(c).gainsightId);
  assert.equal(emails.length, 1, 'one email-kind touch matched by gainsightId');
});

test('calls fixture: every call has the required fields and fake urls', () => {
  for (const c of calls().calls) {
    for (const k of ['callId', 'url', 'startedAt', 'durationSec', 'title', 'participants', 'summary', 'transcript'])
      assert.ok(k in c, `${c.callId} has ${k}`);
    assert.equal(c.url, `https://fake.gong.invalid/call/${c.callId}`);
  }
});

test('accounts fixture: 17 accounts, demo names and ids, openCtas present', () => {
  const as = accounts().accounts;
  assert.equal(as.length, 17);
  assert.deepEqual(as.map((a) => a.gainsightId), DEMO_NAMES.map((_, i) => `GS-DEMO-${String(i + 1).padStart(3, '0')}`));
  assert.deepEqual(as.map((a) => a.name), DEMO_NAMES);
  assert.ok(as.every((a) => Array.isArray(a.openCtas)));
  assert.ok(as.filter((a) => Object.values(a.gates).some((g) => g === true)).length >= 2, 'at least 2 accounts with a true gate');
});

test('accounts fixture: every gainsightId appears in demo-seed.js', () => {
  const seedIds = new Set(seedText.match(/GS-DEMO-\d{3}/g) || []);
  for (const a of accounts().accounts) assert.ok(seedIds.has(a.gainsightId), `${a.gainsightId} in seed`);
  assert.equal(seedIds.size, 17);
});

test('demo-seed.js carries the seeded stakeholder email', () => {
  assert.ok(seedText.includes(STAKEHOLDER_EMAIL));
});

test('fixtures contain only .invalid email addresses', () => {
  const all = readFileSync(join(root, 'fixtures/calls.json'), 'utf8') + readFileSync(join(root, 'fixtures/accounts.json'), 'utf8');
  for (const m of all.match(/[\w.+-]+@[\w.-]+/g) || []) assert.match(m, /\.invalid$/, m);
});
