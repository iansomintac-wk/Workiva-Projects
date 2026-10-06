// connect-ready T-2: proof store, health suffixes, registry, config.example, .gitignore. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { validate } from '../lib/validate.mjs';
import { createConnector } from '../server.mjs';
import { loadAdapters } from '../adapters/index.mjs';
import { healthName, recordProof, loadProof, isProven, tenantOf } from '../lib/state.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = () => mkdtempSync(join(tmpdir(), 'proof-test-'));
const GONG = { adapter: 'gong-rest', baseUrl: 'https://fake-tenant.gong.invalid', myEmail: 'ian.fake@fake-osm.invalid' };
const GS = { adapter: 'gainsight-rest', environment: 'sandbox', appUrl: 'https://fake-tenant.gainsightcloud.invalid', apiBaseUrl: 'https://fake-tenant.gainsightcloud.invalid', tenantId: 'FAKE-TENANT-1' };

test('proof: healthName gives exactly the spec suffixes', () => {
  assert.equal(healthName('gong-rest', { proven: false }), 'gong-rest (unproven)');
  assert.equal(healthName('gong-rest', { proven: true }), 'gong-rest');
  assert.equal(healthName('gainsight-rest', { proven: false, dryRun: true }), 'gainsight-rest (unproven, dry-run)');
  assert.equal(healthName('gainsight-rest', { proven: true, dryRun: true }), 'gainsight-rest (dry-run)');
  assert.equal(healthName('gainsight-rest', { proven: true, dryRun: false }), 'gainsight-rest');
  assert.equal(healthName('gainsight-rest', { proven: false, dryRun: false }), 'gainsight-rest (unproven)');
});

test('proof: recorded per slot and kind, void when the tenant differs (CR3)', () => {
  const dir = tmp();
  assert.equal(isProven(loadProof(dir), 'gong', 'read', tenantOf('gong', GONG)), false);
  recordProof(dir, 'gong', 'read', { tenant: tenantOf('gong', GONG), shapes: { pageKeys: ['calls'] }, now: new Date('2026-10-02T12:00:00Z') });
  const p = loadProof(dir);
  assert.equal(p.gong.read.state, 'proven');
  assert.equal(p.gong.read.provenAt, '2026-10-02T12:00:00.000Z');
  assert.equal(isProven(p, 'gong', 'read', tenantOf('gong', GONG)), true);
  assert.equal(isProven(p, 'gong', 'read', tenantOf('gong', { ...GONG, baseUrl: 'https://other.gong.invalid' })), false);
  assert.equal(isProven(p, 'gainsight', 'read', tenantOf('gainsight', GS)), false);
});

test('registry: gong-rest and gainsight-rest load and report their state; unknown names still throw', () => {
  const dir = tmp();
  const a = loadAdapters({ gong: GONG, gainsight: GS }, { stateDir: dir });
  assert.equal(a.gong.name, 'gong-rest (unproven)');
  assert.equal(a.gainsight.name, 'gainsight-rest (unproven, dry-run)'); // dryRun absent = true
  recordProof(dir, 'gong', 'read', { tenant: tenantOf('gong', GONG) });
  recordProof(dir, 'gainsight', 'read', { tenant: tenantOf('gainsight', GS) });
  assert.equal(a.gong.name, 'gong-rest');               // getter re-reads proof.json
  assert.equal(a.gainsight.name, 'gainsight-rest (dry-run)');
  const live = loadAdapters({ gainsight: { ...GS, dryRun: false } }, { stateDir: dir });
  assert.equal(live.gainsight.name, 'gainsight-rest');
  assert.throws(() => loadAdapters({ gong: { adapter: 'gong-live' } }), /adapter not built: gong-live/);
});

test('health: /v1/health carries the suffix strings and still validates health.json', async () => {
  const dir = tmp();
  const token = 'test-token-0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
  const server = createConnector({ config: {}, adapters: loadAdapters({ gong: GONG, gainsight: GS }, { stateDir: dir }), token });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/v1/health`, { headers: { Authorization: `Bearer ${token}` } });
    const b = await r.json();
    assert.deepEqual(b.adapters, { gong: 'gong-rest (unproven)', gainsight: 'gainsight-rest (unproven, dry-run)', ai: 'fake' });
    assert.deepEqual(validate(JSON.parse(readFileSync(join(root, 'schemas', 'health.json'), 'utf8')), b), []);
  } finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});

test('config.example.json: every adapter fake, dryRun true, every other string empty', () => {
  const cfg = JSON.parse(readFileSync(join(root, 'config.example.json'), 'utf8'));
  for (const slot of ['gong', 'gainsight', 'ai']) assert.equal(cfg[slot].adapter, 'fake', slot);
  assert.equal(cfg.gainsight.dryRun, true);
  const bad = [];
  (function walk(o, path) {
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object') walk(v, `${path}${k}.`);
      else if (typeof v === 'string' && k !== 'adapter' && v !== '') bad.push(`${path}${k}`);
    }
  })(cfg, '');
  assert.deepEqual(bad, []);
});

test('.gitignore keeps every local state file out of git', () => {
  const lines = readFileSync(join(root, '..', '.gitignore'), 'utf8').split(/\r?\n/).map((l) => l.trim());
  for (const f of ['connector/config.json', 'connector/token.txt', 'connector/proof.json', 'connector/gainsight-tokens.json', 'connector/sent-record.json', 'connector/dry-run.jsonl']) {
    assert.ok(lines.includes(f), `${f} missing from .gitignore`);
  }
});

// Follow-ups F-3 (T-14 F7): a corrupt proof.json must show "unproven", not take /v1/health down.
test('health F7: a corrupt proof.json gives 200 with both real adapters unproven, not an error', async () => {
  const dir = tmp();
  writeFileSync(join(dir, 'proof.json'), '{not json');
  const token = 'test-token-0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
  const server = createConnector({ config: {}, adapters: loadAdapters({ gong: GONG, gainsight: GS }, { stateDir: dir }), token });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/v1/health`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(r.status, 200);
    const b = await r.json();
    assert.deepEqual(b.adapters, { gong: 'gong-rest (unproven)', gainsight: 'gainsight-rest (unproven, dry-run)', ai: 'fake' });
  } finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});
