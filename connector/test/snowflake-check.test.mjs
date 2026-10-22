// M1: snowflake-sql in /v1/health and --check, on documented-shape fixtures and a stubbed fetch. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { generateKeyPairSync } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { runCheck } from '../lib/check.mjs';
import { loadAdapters } from '../adapters/index.mjs';
import { createConnector } from '../server.mjs';
import { validate } from '../lib/validate.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = (f) => JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', f), 'utf8'));
const EXAMPLE = JSON.parse(readFileSync(join(root, 'config.example.json'), 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'sf-check-'));
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const KEYFILE = join(dir, 'key.p8'); writeFileSync(KEYFILE, privateKey.export({ type: 'pkcs8', format: 'pem' }));
const SQLFILE = join(dir, 'csat.sql'); writeFileSync(SQLFILE, 'SELECT * FROM CSAT;\n');
const SF = { adapter: 'snowflake-sql', account: 'fake-acct', user: 'FAKE_USER', privateKeyFile: KEYFILE, warehouse: 'WH', role: 'ROLE1', database: 'DB', schema: 'SC', sqlFile: SQLFILE };
const NOW = new Date('2026-10-02T12:00:00Z');
const reply = async () => new Response(JSON.stringify(fx('snowflake-200.json').steps[0].body), { status: 200, headers: { 'Content-Type': 'application/json' } });
const run = async (config, fetchImpl) => {
  const lines = [];
  const stateDir = mkdtempSync(join(tmpdir(), 'sf-state-'));
  const code = await runCheck({ config, stateDir, now: () => NOW, out: (l) => lines.push(l),
    deps: { fetchImpl, sleep: async () => {}, now: () => NOW } });
  return { code, lines, stateDir };
};

test('c1 health names snowflake-sql (unproven) and validates the health schema', async () => {
  const token = 't'.repeat(64);
  const server = createConnector({ config: {}, adapters: loadAdapters({ snowflake: SF }, { stateDir: mkdtempSync(join(tmpdir(), 'sf-state-')) }), token, logPath: join(dir, 'log.jsonl') });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/v1/health`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    assert.equal(body.adapters.snowflake, 'snowflake-sql (unproven)');
    assert.deepEqual(validate(JSON.parse(readFileSync(join(root, 'schemas', 'health.json'), 'utf8')), body), []);
  } finally { server.close(); }
});
test('c2 --check on config.example.json prints only PASS or SKIP for Snowflake and no FAIL', async () => {
  const { code, lines } = await run(EXAMPLE, async () => { throw new Error('no network'); });
  const sf = lines.filter((l) => /snowflake/i.test(l));
  assert.ok(sf.length >= 1 && sf.every((l) => l.startsWith('SKIP ')), sf.join('\n'));
  assert.ok(!lines.some((l) => l.startsWith('FAIL')));
  assert.equal(code, 0);
});
test('c3 a configured --check prints the row count only, never a row value, and records proof', async () => {
  const { code, lines, stateDir } = await run({ snowflake: SF }, reply);
  const text = lines.join('\n');
  assert.equal(code, 0, text);
  for (const step of ['snowflake config', 'snowflake key file', 'snowflake jwt', 'snowflake read']) assert.ok(lines.some((l) => l.startsWith(`PASS ${step}`)), step);
  assert.match(text, /PASS snowflake read: 2 row\(s\)/);
  for (const r of fx('snowflake-200.json').steps[0].body.data) for (const v of r) if (v) assert.ok(!text.includes(String(v)), `leaked ${v}`);
  assert.ok(!/FAKE_USER|BEGIN|Bearer/.test(text));
  assert.equal(loadAdapters({ snowflake: SF }, { stateDir }).snowflake.name, 'snowflake-sql');
  assert.equal(loadAdapters({ snowflake: { ...SF, account: 'other-acct' } }, { stateDir }).snowflake.name, 'snowflake-sql (unproven)');
});
test('c4 CONNECT-SNOWFLAKE.md has the admin request, the UNCONFIRMED network-policy sentence and the old headings', () => {
  const sf = readFileSync(join(root, 'CONNECT-SNOWFLAKE.md'), 'utf8');
  for (const h of ['## What stage 2 fills in', '## Column mapping', '## Token handling', 'stage 2 (parked)', '## Request for the Snowflake admin']) assert.ok(sf.includes(h), h);
  assert.match(sf, /public key/i);
  assert.match(sf, /read-only role/i);
  assert.match(sf, /USAGE/); assert.match(sf, /SELECT/);
  assert.match(sf, /network.policy[^.]*UNCONFIRMED for this account/i);
});
