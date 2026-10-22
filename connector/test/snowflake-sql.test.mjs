// M1: snowflake-sql on documented-shape fixtures and a stubbed fetch. Unproven until a real run. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { generateKeyPairSync } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard, blocked } from '../lib/test-net-guard.mjs';
import { create } from '../adapters/snowflake-sql.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = (f) => JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', f), 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'sf-sql-'));
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });
const KEYFILE = join(dir, 'key.p8'); writeFileSync(KEYFILE, PEM);
const SQLFILE = join(dir, 'csat.sql'); writeFileSync(SQLFILE, 'SELECT * FROM CSAT;\n');
const CFG = { adapter: 'snowflake-sql', account: 'fake-acct', user: 'FAKE_USER', privateKeyFile: KEYFILE, warehouse: 'WH', role: 'ROLE1', database: 'DB', schema: 'SC', sqlFile: SQLFILE, timeoutSec: 30, pollCapMs: 5000 };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const FIELDS = ['SALESFORCE_ACCOUNT_ID', 'GAINSIGHT_COMPANY_ID', 'COMPANY_NAME', 'CSAT_SENT_DATE', 'CSAT_ANSWERED_DATE'];

// replies: array of {status, body} consumed in order
function stub(replies) {
  const seen = []; const logs = [];
  const fn = async (url, init) => { seen.push({ url, init }); const r = replies[Math.min(seen.length - 1, replies.length - 1)]; return json(r.status, r.body); };
  const orig = { log: console.log, warn: console.warn, error: console.error };
  return { fn, seen, logs, orig };
}
const adapter = (fetchImpl, extra = {}) => create({ ...CFG, ...extra }, { fetchImpl, sleep: async () => {}, now: () => new Date('2026-10-02T12:00:00Z') });
const steps = (f) => fx(f).steps;

test('s1 200 maps rows by column name to the five CSAT fields', async () => {
  const s = stub(steps('snowflake-200.json'));
  const a = adapter(s.fn);
  assert.equal(a.name, 'snowflake-sql (unproven)');
  const rows = await a.listCsat();
  assert.ok(rows.length >= 2);
  assert.deepEqual(Object.keys(rows[0]), FIELDS);
  assert.equal(rows[0].COMPANY_NAME, 'Fixture Co One');
  assert.equal(s.seen.length, 1);
  assert.match(s.seen[0].url, /^https:\/\/fake-acct\.snowflakecomputing\.com\/api\/v2\/statements\?requestId=/);
  assert.equal(s.seen[0].init.method, 'POST');
  const body = JSON.parse(s.seen[0].init.body);
  assert.equal(body.statement, 'SELECT * FROM CSAT');
  assert.deepEqual([body.warehouse, body.role, body.database, body.schema, body.timeout], ['WH', 'ROLE1', 'DB', 'SC', 30]);
  assert.deepEqual(body.parameters, { MULTI_STATEMENT_COUNT: '1' });
  assert.deepEqual(blocked, []);
});

test('s2 a 202 is polled until the 200 and returns the rows', async () => {
  const s = stub(steps('snowflake-202-then-200.json'));
  const rows = await adapter(s.fn).listCsat();
  assert.ok(rows.length >= 1);
  assert.equal(s.seen.length, 2);
  assert.equal(s.seen[1].init.method, 'GET');
  assert.match(s.seen[1].url, /\/api\/v2\/statements\/01FAKE-HANDLE/);
});

test('s3 multi-partition fetches every partition in order', async () => {
  const s = stub(steps('snowflake-multi-partition.json'));
  const rows = await adapter(s.fn).listCsat();
  assert.deepEqual(rows.map((r) => r.COMPANY_NAME), ['Fixture Co One', 'Fixture Co Two', 'Fixture Co Three']);
  assert.equal(s.seen.length, 3);
  assert.match(s.seen[1].url, /partition=1$/);
  assert.match(s.seen[2].url, /partition=2$/);
});

test('s4 a 429 retries with the SAME requestId and retry=true', async () => {
  const s = stub([...steps('snowflake-429.json'), ...steps('snowflake-200.json')]);
  const rows = await adapter(s.fn).listCsat();
  assert.ok(rows.length >= 2);
  assert.equal(s.seen.length, 2);
  const q = (u) => new URL(u).searchParams;
  assert.equal(q(s.seen[0].url).get('retry'), null);
  assert.equal(q(s.seen[1].url).get('retry'), 'true');
  assert.ok(q(s.seen[0].url).get('requestId'));
  assert.equal(q(s.seen[1].url).get('requestId'), q(s.seen[0].url).get('requestId'));
});

test('s5 a 422 throws an error carrying the status and no credential text', async () => {
  const s = stub(steps('snowflake-422.json'));
  await assert.rejects(adapter(s.fn).listCsat(), (e) => {
    assert.equal(e.status, 422);
    assert.match(e.message, /422/);
    assert.ok(!e.message.includes('PRIVATE KEY') && !e.message.includes(PEM.split('\n')[1]));
    assert.ok(!/Bearer|eyJ/.test(e.message));
    return true;
  });
});

test('s6 a result missing a column throws an error naming that column', async () => {
  const body = structuredClone(steps('snowflake-200.json')[0].body);
  const i = body.resultSetMetaData.rowType.findIndex((c) => c.name === 'COMPANY_NAME');
  body.resultSetMetaData.rowType.splice(i, 1);
  body.data = body.data.map((r) => r.filter((_, j) => j !== i));
  await assert.rejects(adapter(stub([{ status: 200, body }]).fn).listCsat(), /COMPANY_NAME/);
});

test('s7 Authorization is Bearer <jwt> with KEYPAIR_JWT, and the key text never reaches a log line or error', async () => {
  const lines = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  for (const k of Object.keys(orig)) console[k] = (...a) => lines.push(a.join(' '));
  const keyBody = PEM.split('\n').filter((l) => l && !l.startsWith('-----')).join('');
  let seenHeaders; let err;
  try {
    const ok = stub(steps('snowflake-200.json'));
    await adapter(async (u, i) => { seenHeaders = i.headers; return ok.fn(u, i); }).listCsat();
    await adapter(stub(steps('snowflake-422.json')).fn).listCsat().catch((e) => { err = e; });
  } finally { Object.assign(console, orig); }
  assert.match(seenHeaders.Authorization, /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
  assert.equal(seenHeaders['X-Snowflake-Authorization-Token-Type'], 'KEYPAIR_JWT');
  const all = lines.join('\n') + String(err && err.message) + String(err && err.stack);
  assert.ok(!all.includes(keyBody.slice(0, 40)) && !all.includes('PRIVATE KEY'));
  assert.deepEqual(blocked, []);
});
