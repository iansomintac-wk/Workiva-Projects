// Fix A / M2: the committed demo CSAT fixture passes the connector's own schema (no padded temp copy needed).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createConnector } from '../server.mjs';
import { loadAdapters } from '../adapters/index.mjs';
import { installNetGuard } from '../lib/test-net-guard.mjs';

installNetGuard();
const TOKEN = 'test-token-0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';

test('GET /v1/csat with fixture demo answers 200 and the rows keep their Salesforce ids', async () => {
  const cfg = { snowflake: { adapter: 'fake', fixture: 'demo' } };
  const server = createConnector({ config: cfg, adapters: loadAdapters(cfg), token: TOKEN, logPath: join(mkdtempSync(join(tmpdir(), 'demo-csat-')), 'log.jsonl') });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/v1/csat`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    assert.equal(r.status, 200);
    const b = await r.json();
    assert.ok(b.rows.length >= 4);
    assert.ok(b.rows.some((x) => x.SALESFORCE_ACCOUNT_ID === '001DEMO0000000001AAA'));
  } finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});
