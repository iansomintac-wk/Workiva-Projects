// connect-ready T-9: the §3.4 write gate and --unlock-production. Stubbed fetch only. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { PassThrough } from 'node:stream';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { create } from '../adapters/gainsight-rest.mjs';
import { gateFor, FIRST_SEND_ERROR } from '../lib/write-gate.mjs';
import { runUnlock } from '../lib/unlock.mjs';
import { makeAsk, runCli, COMMANDS } from '../lib/cli.mjs';
import { loadProof, saveProof, recordProof, tenantOf } from '../lib/state.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TIMELINE_OK = JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', 'gainsight-timeline-create.json'), 'utf8'));
const PROD = 'https://fake-prod.gainsightcloud.invalid';
const SBX = 'https://fake-sbx.gainsightcloud.invalid';
const base = { adapter: 'gainsight-rest', dryRun: false, authorEmail: 'ian.fake@fake-osm.invalid', timeline: { typeName: 'FAKE_Meeting' }, oauth: {} };
const PROD_CFG = { ...base, environment: 'production', appUrl: PROD, apiBaseUrl: PROD, tenantId: 'FAKE-PROD-1' };
const SBX_CFG = { ...base, environment: 'sandbox', appUrl: SBX, apiBaseUrl: SBX, tenantId: 'FAKE-SBX-1' };
const NOW = new Date('2026-10-02T12:00:00Z');
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const item = (n) => ({ id: `q-${n}`, kind: 'Pending items batch', customerRef: { gainsightId: '1P02FAKE0001', name: 'Aldridge Energy' }, fields: { gates: [] } });
const tmp = () => mkdtempSync(join(tmpdir(), 'gate-'));
// The recorded-shape Timeline reply, keyed by the ExternalId sent: since T-8's fix a 200 whose data.success lacks
// the item's id answers failed, so the fixture's own key (q-timeline-1) is swapped for the item id.
const okFor = (id) => json(200, { ...TIMELINE_OK, data: { ...TIMELINE_OK.data, success: { [id]: Object.values(TIMELINE_OK.data.success)[0] } } });
function adapter(cfg, stateDir, reply = okFor) {
  const seen = [];
  const a = create(cfg, { stateDir, now: () => NOW, sleep: async () => {}, tokenSource: { accessToken: async () => 'FAKE-ACCESS-yy' },
    fetchImpl: async (url, init) => { const id = JSON.parse(init.body).records[0].ExternalId; seen.push(id); return reply(id); } });
  return { a, seen };
}
const unlock = (dir, cfg = PROD_CFG, basis = 'no-sandbox') => { const p = loadProof(dir); p.gainsight = { ...(p.gainsight || {}), unlock: { tenant: tenantOf('gainsight', cfg), at: NOW.toISOString(), basis, sandboxProofAt: null, firstSendDone: false } }; saveProof(dir, p); };

test('gate: a sandbox tenant may write, with no first-send limit', () => {
  assert.deepEqual(gateFor({ cfg: SBX_CFG, proof: {} }), { allow: true, firstSendOnly: false });
});

test('gate: no environment set blocks every item with an error naming --setup, and nothing is sent', async () => {
  const { a, seen } = adapter({ ...PROD_CFG, environment: '' }, tmp());
  const res = await a.push([item(1), item(2)]);
  assert.ok(res.every((r) => r.status === 'failed' && /--setup/.test(r.error)));
  assert.equal(seen.length, 0);
});

test('gate: production without an unlock names both ways forward', async () => {
  const { a, seen } = adapter(PROD_CFG, tmp());
  const [r] = await a.push([item(1)]);
  assert.match(r.error, /--check --write/);
  assert.match(r.error, /--unlock-production/);
  assert.equal(seen.length, 0);
});

test('gate: an unlock recorded for another tenant is void (CR3)', async () => {
  const dir = tmp();
  unlock(dir, { ...PROD_CFG, appUrl: 'https://other.gainsightcloud.invalid' });
  const { a, seen } = adapter(PROD_CFG, dir);
  const [r] = await a.push([item(1)]);
  assert.equal(r.status, 'failed');
  assert.equal(seen.length, 0);
});

test('gate: after unlock the first production push sends only its first item; the limit lifts once it is sent', async () => {
  const dir = tmp();
  unlock(dir);
  const { a, seen } = adapter(PROD_CFG, dir);
  const res = await a.push([item(1), item(2), item(3)]);
  assert.deepEqual(res.map((r) => r.status), ['sent', 'failed', 'failed']);
  assert.equal(res[1].error, FIRST_SEND_ERROR);
  assert.equal(FIRST_SEND_ERROR, 'first live send is 1 item; check it in Gainsight, then Send again');
  assert.deepEqual(seen, ['q-1']);
  assert.equal(loadProof(dir).gainsight.unlock.firstSendDone, true);
  const res2 = await a.push([item(2), item(3)]);
  assert.deepEqual(res2.map((r) => r.status), ['sent', 'sent']);
});

test('gate: if the first live item fails, the 1-item limit stays', async () => {
  const dir = tmp();
  unlock(dir);
  const { a, seen } = adapter(PROD_CFG, dir, () => json(500, { errorDesc: 'boom' }));
  const res = await a.push([item(1), item(2)]);
  assert.deepEqual(res.map((r) => r.status), ['failed', 'failed']);
  assert.equal(res[1].error, FIRST_SEND_ERROR);
  assert.equal(loadProof(dir).gainsight.unlock.firstSendDone, false);
  await a.push([item(1), item(2)]);
  assert.deepEqual(seen, ['q-1', 'q-1']);
});

test('unlock: the tenant URL must be typed back; basis records whether a sandbox write proof existed', async () => {
  const out = [];
  const dir = tmp();
  assert.equal(await runUnlock({ cfg: PROD_CFG, stateDir: dir, ask: async () => 'https://wrong.invalid', out: (l) => out.push(l), now: () => NOW }), 1);
  assert.equal(loadProof(dir).gainsight, undefined);
  assert.equal(await runUnlock({ cfg: PROD_CFG, stateDir: dir, ask: async () => `${PROD}/`, out: (l) => out.push(l), now: () => NOW }), 0);
  assert.equal(loadProof(dir).gainsight.unlock.basis, 'no-sandbox');
  assert.ok(out.some((l) => l.includes(PROD)) && out.some((l) => /1 item/.test(l)));
  const dir2 = tmp();
  recordProof(dir2, 'gainsight', 'write', { tenant: tenantOf('gainsight', SBX_CFG), environment: 'sandbox', now: NOW });
  assert.equal(await runUnlock({ cfg: PROD_CFG, stateDir: dir2, ask: async () => PROD, out: () => {}, now: () => NOW }), 0);
  assert.equal(loadProof(dir2).gainsight.unlock.basis, 'sandbox-proof');
  assert.equal(loadProof(dir2).gainsight.unlock.sandboxProofAt, NOW.toISOString());
});

test('unlock refuses a sandbox tenant or a non-gainsight-rest config; dry-run still sends nothing after unlock', async () => {
  const out = [];
  assert.equal(await runUnlock({ cfg: SBX_CFG, stateDir: tmp(), ask: async () => SBX, out: (l) => out.push(l) }), 1);
  assert.equal(await runUnlock({ cfg: { adapter: 'fake' }, stateDir: tmp(), ask: async () => '', out: (l) => out.push(l) }), 1);
  assert.ok(out.every((l) => l.startsWith('FAIL unlock:')));
  const dir = tmp();
  unlock(dir);
  const { a, seen } = adapter({ ...PROD_CFG, dryRun: true }, dir);
  const [r] = await a.push([item(1)]);
  assert.equal(r.status, 'failed');
  assert.equal(seen.length, 0);
});

// Fail-closed cases beyond the plan's list (T-9 brief): a proof file that cannot be read never lets a send through.
test('gate: a corrupt or non-object proof.json blocks every production item and push does not throw', async () => {
  for (const text of ['{not json', 'null', '"x"', '[]']) {
    const dir = tmp();
    writeFileSync(join(dir, 'proof.json'), text);
    const { a, seen } = adapter(PROD_CFG, dir);
    const res = await a.push([item(1), item(2)]);
    assert.ok(res.every((r) => r.status === 'failed' && /writes blocked/.test(r.error)), text);
    assert.equal(seen.length, 0, text);
  }
});

test('gate: an unlock with dryRun left unset still sends nothing (dry-run is the default)', async () => {
  const dir = tmp();
  unlock(dir);
  const { dryRun, ...noDry } = PROD_CFG;
  const { a, seen } = adapter(noDry, dir);
  const [r] = await a.push([item(1)]);
  assert.equal(r.status, 'failed');
  assert.equal(seen.length, 0);
});

test('gate: two pushes racing during the first live send still send only 1 item', async () => {
  const dir = tmp();
  unlock(dir);
  let release;
  const held = new Promise((r) => { release = r; });
  const { a, seen } = adapter(PROD_CFG, dir, (id) => held.then(() => okFor(id)));
  const p1 = a.push([item(1)]);
  const p2 = a.push([item(2)]);
  await new Promise((r) => setImmediate(r));
  release();
  const [[r1], [r2]] = await Promise.all([p1, p2]);
  assert.deepEqual(seen, ['q-1']);
  assert.equal(r1.status, 'sent');
  assert.equal(r2.error, FIRST_SEND_ERROR);
});

test('unlock refuses an empty tenant URL and a corrupt proof.json, changing nothing', async () => {
  const out = [];
  const dir = tmp();
  assert.equal(await runUnlock({ cfg: { ...PROD_CFG, appUrl: '' }, stateDir: dir, ask: async () => '', out: (l) => out.push(l), now: () => NOW }), 1);
  assert.equal(existsSync(join(dir, 'proof.json')), false);
  const dir2 = tmp();
  writeFileSync(join(dir2, 'proof.json'), '{not json');
  assert.equal(await runUnlock({ cfg: PROD_CFG, stateDir: dir2, ask: async () => PROD, out: (l) => out.push(l), now: () => NOW }), 1);
  assert.equal(readFileSync(join(dir2, 'proof.json'), 'utf8'), '{not json');
  assert.ok(out.every((l) => l.startsWith('FAIL unlock:')), out.join('\n'));
});

test('cli: --unlock-production reads the typed URL from scripted stdin through makeAsk', async () => {
  const dir = tmp();
  const input = new PassThrough();
  const output = new PassThrough();
  let shown = '';
  output.on('data', (c) => { shown += c; });
  const ask = makeAsk(input, output);
  const lines = [];
  const done = runCli(['--unlock-production'], { config: { gainsight: PROD_CFG }, stateDir: dir, ask, out: (l) => lines.push(l) });
  input.write(`${PROD}\n`);
  assert.equal(await done, 0);
  ask.close();
  assert.ok(COMMANDS.includes('--unlock-production'));
  assert.match(shown, /Type the production tenant URL/);
  assert.equal(loadProof(dir).gainsight.unlock.tenant.appUrl, PROD);
  assert.ok(lines.some((l) => l.startsWith('PASS unlock')));
});
