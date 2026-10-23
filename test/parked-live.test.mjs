// Task 8 (parked-live audit). Ian, 2026-10-22: the live Gainsight and Snowflake connection waits on his internal team;
// everything else must be good to go. These tests prove the docs say so and that no default code path reaches those hosts.
// CSAT on the tracker side is proven network-free by the LOCKED test/csat-no-network.test.mjs (cited, not edited).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadAdapters } from '../connector/adapters/index.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const DOCS = ['README.txt', 'connector/CONNECT-GAINSIGHT.md', 'connector/CONNECT-SNOWFLAKE.md', 'connector/CONNECTORS.md', 'docs/HOSTING.md'];
const WALK = 'tools/team-demo/walkthrough.html';

test("parked live: README and the three CONNECT/CONNECTORS docs say live Gainsight and Snowflake wait on Ian's internal team", () => {
  for (const f of [...DOCS, WALK]) {
    assert.match(read(f), /waits on Ian's internal team/i, f + ' does not say the live connection waits on Ian\'s internal team');
  }
});

test('parked live: the tracker works offline and by file import without them (docs say so)', () => {
  for (const f of DOCS) {
    const t = read(f);
    assert.match(t, /fully offline/i, f + ' lacks "fully offline"');
    assert.match(t, /file import/i, f + ' lacks "file import"');
  }
  assert.match(read('README.txt'), /fake connector sends nothing/i);
  for (const f of ['connector/CONNECT-GAINSIGHT.md', 'connector/CONNECT-SNOWFLAKE.md', 'connector/CONNECTORS.md']) {
    assert.match(read(f), /fake connector sends nothing/i, f);
  }
});

// Runs every slot method of the loaded adapters with fetch replaced by a recorder; returns the non-127.0.0.1 URLs reached.
async function hostsReached(config, opts = {}) {
  const real = globalThis.fetch;
  const hits = [];
  globalThis.fetch = async (url) => { const u = String(url && url.url ? url.url : url); if (!/^http:\/\/127\.0\.0\.1(:|\/|$)/.test(u)) hits.push(u); throw new Error('recorded ' + u); };
  try {
    const ad = loadAdapters(config, opts);
    const calls = [() => ad.gong.listCalls({}), () => ad.gainsight.listAccounts({}), () => ad.ai.complete({ prompt: 'x' }), () => ad.snowflake.listCsat({})];
    for (const c of calls) { try { await c(); } catch { /* a failed call is fine; only the URLs reached matter */ } }
  } finally { globalThis.fetch = real; }
  return hits;
}

test('parked live: no default code path reaches a Gainsight or Snowflake host (connector config.example.json holds no host, fake adapters are the default)', async () => {
  const cfg = JSON.parse(read('connector/config.example.json'));
  for (const slot of ['gong', 'gainsight', 'ai', 'snowflake']) assert.equal(cfg[slot].adapter, 'fake', slot);
  assert.equal(cfg.gainsight.dryRun, true);
  assert.doesNotMatch(JSON.stringify(cfg), /https?:\/\/|\.snowflakecomputing\.|\.gainsightapp\./i);
  assert.deepEqual(await hostsReached({}), [], 'empty config reached a host');
  assert.deepEqual(await hostsReached(cfg), [], 'config.example.json reached a host');
});

test('parked live, negative control: a config that points the Gainsight and Snowflake adapters at a non-loopback host is caught', async () => {
  const cfg = { gainsight: { adapter: 'gainsight-rest', apiBaseUrl: 'https://example.invalid.gainsightapp.com', dryRun: true },
    snowflake: { adapter: 'snowflake-sql', account: 'xy12345' } };
  const tokenSource = { async accessToken() { return 'x'; } };
  const hits = await hostsReached(cfg, { tokenSource, stateDir: join(process.env.TEMP || '/tmp', 'parked-live-control') });
  assert.ok(hits.length > 0, 'the control reached no host, so the guard proves nothing');
});

test('parked live: the walkthrough says the live connection is parked', () => {
  const t = read(WALK);
  assert.match(t, /waits on Ian's internal team/i);
  assert.match(t, /sends nothing/i);
});

// Task 9: the good-to-go evidence doc names every feature area, the parked item, the deferred list and the open decisions.
test('evidence doc 2026-10-22-runway-fake-book-v13.md names every feature area, Parked, Deferred, Not on any list and Known residuals', () => {
  const d = read('docs/evidence/2026-10-22-runway-fake-book-v13.md');
  for (const area of ['v13 look screens', 'Check for calls', 'Refresh from Gainsight', 'Send to Gainsight', 'Check CSAT', 'desk card', 'desk reason', 'Snowflake adapter', 'launcher and walkthrough', 'captures', 'sim', 'parked-live audit']) {
    assert.ok(d.toLowerCase().includes(area.toLowerCase()), 'no feature area: ' + area);
  }
  for (const h of ['## Parked', '## Deferred by Ian 2026-10-22', '## Not on any list', '## Known residuals']) assert.ok(d.includes(h), 'no section ' + h);
  assert.match(d, /test\/parked-live\.test\.mjs/);
  assert.match(d, /test\/csat-no-network\.test\.mjs/);
  assert.match(d, /512f1c0/);
  assert.match(d, /Ask or jump/);
  assert.ok((d.match(/^\| /gm) || []).length >= 12, 'fewer than 12 table rows');
});
