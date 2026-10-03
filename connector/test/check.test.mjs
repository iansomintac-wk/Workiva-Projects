// connect-ready T-10: --check and --check --write against stubbed tenants. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { runCheck } from '../lib/check.mjs';
import { loadProof } from '../lib/state.mjs';
import { loadAdapters } from '../adapters/index.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = (f) => JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', f), 'utf8'));
const EXAMPLE = JSON.parse(readFileSync(join(root, 'config.example.json'), 'utf8'));
const NOW = new Date('2026-10-02T12:00:00Z');
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const GONG = { adapter: 'gong-rest', baseUrl: 'https://fake-tenant.gong.invalid', accessKey: 'FAKE-KEY-123', accessKeySecret: 'FAKE-SECRET-456', myEmail: 'ian.fake@fake-osm.invalid' };
const API = 'https://fake-sbx.gainsightcloud.invalid';
const GS = { adapter: 'gainsight-rest', environment: 'sandbox', appUrl: API, apiBaseUrl: API, tenantId: 'FAKE-SBX-1', dryRun: true, oauth: { clientId: 'FAKE-CLIENT-ID' },
  authorEmail: 'ian.fake@fake-osm.invalid', timeline: { typeName: 'FAKE_Meeting' }, cta: { type: 'FAKE_Risk', companyIdField: 'FAKE_CompanyId', idPath: '' },
  fieldMap: { tier: 'FAKE_Tier__gc' }, gateFieldMap: {} };
const tmp = () => mkdtempSync(join(tmpdir(), 'check-'));
const run = async (config, fetchImpl, { write = false, stateDir = tmp() } = {}) => {
  const lines = [];
  const code = await runCheck({ config, stateDir, write, now: () => NOW, out: (l) => lines.push(l),
    deps: { fetchImpl, sleep: async () => {}, now: () => NOW, tokenSource: { accessToken: async () => 'FAKE-ACCESS-yy' } } });
  return { code, lines, stateDir };
};
const gsTenant = (seen, { badField = null } = {}) => async (url, init) => {
  const body = JSON.parse(init.body); seen.push({ url, body });
  if (url.endsWith('/v1/data/objects/query/Company')) {
    if (badField && body.select.includes(badField)) return json(400, { result: false, errorCode: 'FAKE_BAD_FIELD', errorDesc: `unknown field ${badField}` });
    return json(200, { ...fx('gainsight-company-query-data.json'), data: fx('gainsight-company-query-data.json').data.slice(0, 1) });
  }
  if (url.endsWith('/v1/ant/es/activity')) { const id = body.records[0].ExternalId; return json(200, { data: { failures: {}, success: { [id]: [{ activityId: `ACT-${id}` }] } }, result: true }); }
  if (url.endsWith('/v2/cockpit/cta')) return json(200, { result: true });
  return json(404, {});
};

test('check A-8: with config.example.json every line is SKIP, exit 0, nothing recorded', async () => {
  const r = await run(EXAMPLE, async () => { throw new Error('no fetch expected'); });
  assert.equal(r.code, 0);
  assert.ok(r.lines.length >= 2 && r.lines.every((l) => l.startsWith('SKIP ')), r.lines.join('\n'));
  assert.equal(existsSync(join(r.stateDir, 'proof.json')), false);
});

test('check A-8 through the CLI: node connector/server.mjs --check prints only SKIP lines and exits 0', () => {
  const r = spawnSync(process.execPath, [join(root, 'server.mjs'), '--check'], { encoding: 'utf8',
    env: { ...process.env, CONNECTOR_CONFIG: join(root, 'config.example.json'), CONNECTOR_STATE_DIR: tmp() } });
  assert.equal(r.status, 0, r.stderr);
  const lines = r.stdout.trim().split(/\r?\n/);
  assert.ok(lines.length >= 2 && lines.every((l) => l.startsWith('SKIP ')), r.stdout);
});

test('check: a stubbed Gong tenant passes config, auth and read, records the proof, and health drops "unproven"', async () => {
  const r = await run({ gong: GONG }, async () => json(200, fx('gong-calls-extensive-page2.json')));
  assert.equal(r.code, 0);
  for (const step of ['PASS gong config', 'PASS gong auth', 'PASS gong read']) assert.ok(r.lines.some((l) => l.startsWith(step)), step);
  const p = loadProof(r.stateDir).gong.read;
  assert.equal(p.state, 'proven');
  assert.deepEqual(p.tenant, { baseUrl: 'https://fake-tenant.gong.invalid' });
  assert.ok(p.shapes.metaDataKeys.includes('started'));
  assert.equal(loadAdapters({ gong: GONG }, { stateDir: r.stateDir }).gong.name, 'gong-rest');
});

test('check: Gong 401 is FAIL gong auth naming the admin; exit 1; no proof; no key or secret printed', async () => {
  const r = await run({ gong: GONG }, async () => json(401, { errors: ['FAKE-KEY-123 FAKE-SECRET-456'] }));
  assert.equal(r.code, 1);
  assert.ok(r.lines.some((l) => /^FAIL gong auth: .*who fixes it: Gong admin/.test(l)), r.lines.join('\n'));
  assert.equal(existsSync(join(r.stateDir, 'proof.json')), false);
  assert.ok(!r.lines.join('\n').match(/FAKE-KEY-123|FAKE-SECRET-456/));
});

test('check: the fieldMap probe names a rejected field; unmapped fields are SKIP; no read proof; exit 1', async () => {
  const seen = [];
  const r = await run({ gainsight: { ...GS, fieldMap: { tier: 'FAKE_Bad__gc' } } }, gsTenant(seen, { badField: 'FAKE_Bad__gc' }));
  assert.equal(r.code, 1);
  assert.ok(r.lines.includes('PASS gainsight auth'));
  assert.ok(r.lines.some((l) => l.startsWith('FAIL gainsight fieldMap.tier: the tenant rejected field "FAKE_Bad__gc"')), r.lines.join('\n'));
  assert.ok(r.lines.some((l) => l.startsWith('SKIP gainsight fieldMap.arr:')));
  assert.equal((loadProof(r.stateDir).gainsight || {}).read, undefined);
});

test('check --write refuses on a production tenant and writes nothing', async () => {
  const seen = [];
  const r = await run({ gainsight: { ...GS, environment: 'production' } }, gsTenant(seen), { write: true });
  assert.equal(r.code, 1);
  assert.ok(r.lines.some((l) => l.startsWith('FAIL gainsight write: --check --write runs only against a sandbox')));
  assert.ok(seen.every((s) => s.url.endsWith('/query/Company')));
});

test('check --write on a sandbox creates one [SBX] TEST record per buildable kind, SKIPs B1/B2, and records the write proof', async () => {
  const seen = [];
  const r = await run({ gainsight: GS }, gsTenant(seen), { write: true });
  assert.equal(r.code, 0, r.lines.join('\n'));
  for (const kind of ['Pending items batch', 'Success Outcome Plan', 'At-Risk CTA']) assert.ok(r.lines.some((l) => l.startsWith(`PASS gainsight write ${kind}`)), kind);
  assert.ok(r.lines.some((l) => l.startsWith('SKIP gainsight write Success Plan objective:')));
  assert.ok(r.lines.some((l) => l.startsWith('SKIP gainsight write read-back:')));
  const writes = seen.filter((s) => !s.url.endsWith('/query/Company'));
  assert.equal(writes.length, 3);
  assert.ok(writes.every((s) => JSON.stringify(s.body).includes('[SBX] TEST-2026-10-02')));
  const w = loadProof(r.stateDir).gainsight.write;
  assert.equal(w.environment, 'sandbox');
  assert.equal(w.tenant.appUrl, API);
});
