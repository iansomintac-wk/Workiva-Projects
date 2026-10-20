import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard, blocked } from '../lib/test-net-guard.mjs';
import { loadAdapters } from '../adapters/index.mjs';
import { createConnector } from '../server.mjs';
import { validate } from '../lib/validate.mjs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COLS = ['SALESFORCE_ACCOUNT_ID', 'GAINSIGHT_COMPANY_ID', 'COMPANY_NAME', 'CSAT_SENT_DATE', 'CSAT_ANSWERED_DATE'];

test('snowflake: default slot is the fake and listCsat rows carry exactly the tracker CSAT import columns', async () => {
  const ad = loadAdapters({});
  assert.equal(ad.snowflake.name, 'fake');
  const rows = await ad.snowflake.listCsat();
  assert.ok(rows.length >= 3);
  for (const r of rows) {
    assert.deepEqual(Object.keys(r), COLS);
    assert.equal(r.SALESFORCE_ACCOUNT_ID.length, 18);
    assert.equal(r.GAINSIGHT_COMPANY_ID.length, 36);
    assert.ok(/FAKE/.test(r.SALESFORCE_ACCOUNT_ID) && /FAKE/.test(r.GAINSIGHT_COMPANY_ID));
  }
});
test('snowflake: since keeps only rows whose newest CSAT date is on or after it', async () => {
  const ad = loadAdapters({});
  const all = await ad.snowflake.listCsat();
  const some = await ad.snowflake.listCsat({ since: '2026-09-10T00:00:00Z' });
  assert.ok(some.length > 0 && some.length < all.length);
  for (const r of some) assert.ok((r.CSAT_ANSWERED_DATE || r.CSAT_SENT_DATE) >= '2026-09-10');
});
test('snowflake: any adapter name other than fake throws the parked-stage-2 message', () => {
  assert.throws(() => loadAdapters({ snowflake: { adapter: 'snowflake-rest' } }),
    /snowflake: only 'fake' is built; the real adapter is stage 2 \(parked\)/);
});
test('snowflake: config.example.json has a snowflake block with adapter fake and empty placeholders only', () => {
  const cfg = JSON.parse(readFileSync(join(root, 'config.example.json'), 'utf8'));
  assert.equal(cfg.snowflake.adapter, 'fake');
  for (const k of ['account', 'warehouse', 'database', 'schema', 'table', 'tokenFile']) assert.equal(cfg.snowflake[k], '', k);
});

const TOKEN = 'test-token-0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
const tmp = mkdtempSync(join(tmpdir(), 'sf-csat-'));
let seq = 0;
async function start() {
  const logPath = join(tmp, `log-${seq++}.jsonl`);
  const server = createConnector({ config: {}, adapters: loadAdapters({}), token: TOKEN, logPath });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((r) => server.close(r)) };
}
const auth = { Authorization: `Bearer ${TOKEN}` };
const csatSchema = () => JSON.parse(readFileSync(join(root, 'schemas', 'csat.json'), 'utf8'));

test('csat route: 200 validates csat.json and equals the fixture; no token 401; bad since 400', async () => {
  const s = await start();
  try {
    const r = await fetch(s.base + '/v1/csat', { headers: auth });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.deepEqual(validate(csatSchema(), body), []);
    assert.deepEqual(body.rows, JSON.parse(readFileSync(join(root, 'fixtures', 'snowflake-csat.json'), 'utf8')).rows);
    assert.equal((await fetch(s.base + '/v1/csat')).status, 401);
    const bad = await fetch(s.base + '/v1/csat?since=not-a-date', { headers: auth });
    assert.equal(bad.status, 400);
    assert.equal((await bad.json()).error, 'since must be an ISO 8601 date-time');
  } finally { await s.close(); }
});
test('csat route: since returns the same subset as the adapter', async () => {
  const s = await start();
  try {
    const since = '2026-09-10T00:00:00Z';
    const r = await fetch(s.base + '/v1/csat?since=' + encodeURIComponent(since), { headers: auth });
    assert.equal(r.status, 200);
    const want = await loadAdapters({}).snowflake.listCsat({ since });
    assert.deepEqual((await r.json()).rows, want);
  } finally { await s.close(); }
});
test('csat schema rejects a row missing COMPANY_NAME and a row with an empty SALESFORCE_ACCOUNT_ID', async () => {
  const good = (await loadAdapters({}).snowflake.listCsat())[0];
  const { COMPANY_NAME, ...noName } = good;
  assert.ok(validate(csatSchema(), { rows: [noName] }).length > 0);
  assert.ok(validate(csatSchema(), { rows: [{ ...good, SALESFORCE_ACCOUNT_ID: '' }] }).length > 0);
});
test('health lists snowflake fake and validates health.json', async () => {
  const s = await start();
  try {
    const body = await (await fetch(s.base + '/v1/health', { headers: auth })).json();
    assert.equal(body.adapters.snowflake, 'fake');
    assert.deepEqual(validate(JSON.parse(readFileSync(join(root, 'schemas', 'health.json'), 'utf8')), body), []);
  } finally { await s.close(); }
});

test('snowflake: the fake and /v1/csat answer with the network blocked, with zero non-loopback attempts', async () => {
  blocked.length = 0;
  const ad = loadAdapters({});
  const rows = await ad.snowflake.listCsat();
  assert.ok(rows.length >= 3);
  const s = await start();
  try {
    const r = await fetch(`${s.base}/v1/csat`, { headers: auth });
    assert.equal(r.status, 200);
  } finally { await s.close(); }
  assert.equal(blocked.length, 0, 'non-loopback attempts');
  await assert.rejects(fetch('https://example.invalid/x'));
  assert.equal(blocked.length, 1, 'the guard is live');
  blocked.length = 0;
});
test('docs: CONNECT-SNOWFLAKE.md and CONNECTORS.md exist with the required sections', () => {
  const sf = readFileSync(join(root, 'CONNECT-SNOWFLAKE.md'), 'utf8');
  for (const h of ['## What stage 2 fills in', '## Column mapping', '## Token handling', 'stage 2 (parked)']) assert.ok(sf.includes(h), h);
  const cs = readFileSync(join(root, 'CONNECTORS.md'), 'utf8');
  for (const h of ['## Plugging in a real adapter', 'BUILT', 'config.example.json', 'connector/fixtures/vendor', 'test-net-guard', 'CONNECT-GAINSIGHT.md', 'dry-run']) assert.ok(cs.includes(h), h);
});
test('gainsight default is dry-run', () => {
  const cfg = JSON.parse(readFileSync(join(root, 'config.example.json'), 'utf8'));
  assert.equal(cfg.gainsight.dryRun, true,
    "pinned at adapter level by gainsight-push.test.mjs: 'push dry-run (the default): nothing is sent, each item fails with the dry-run error, the request is logged'");
});
