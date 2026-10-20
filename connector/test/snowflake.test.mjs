import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { loadAdapters } from '../adapters/index.mjs';

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
