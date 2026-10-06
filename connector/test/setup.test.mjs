// connect-ready T-11: --setup with scripted answers and a stubbed fetch. Secrets never reach stdout. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import net from 'node:net';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createConnector } from '../server.mjs';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { runSetup, defaultCallbackServer } from '../lib/setup.mjs';
import { makeAsk } from '../lib/cli.mjs';

installNetGuard();
const EXAMPLE = { port: 8787, gong: { adapter: 'fake' }, gainsight: { adapter: 'fake', dryRun: true }, ai: { adapter: 'fake' } };
const SECRETS = ['FAKE-SECRET-456', 'FAKE-CLIENT-SECRET-zz'];
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function scripted(answers) {
  const prompts = [];
  const ask = async (q) => { prompts.push(q); if (!answers.length) throw new Error(`no scripted answer for: ${q}`); return answers.shift(); };
  return { ask, prompts };
}
const tmp = () => mkdtempSync(join(tmpdir(), 'setup-'));

test('setup Gong only: re-asks a bad URL, writes config.json with gong-rest, leaves Gainsight fake, then runs --check', async () => {
  const dir = tmp(); const configPath = join(dir, 'config.json');
  const { ask, prompts } = scripted(['y', 'http://not-https.invalid', 'https://fake-tenant.gong.invalid', 'FAKE-KEY-123', 'FAKE-SECRET-456', 'ian.fake@fake-osm.invalid', 'n']);
  let checked = null; const out = [];
  const code = await runSetup({ configPath, config: EXAMPLE, ask, out: (l) => out.push(l), stateDir: dir, runCheckFn: async (a) => { checked = a.config; return 0; } });
  assert.equal(code, 0);
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.deepEqual(cfg.gong, { adapter: 'gong-rest', baseUrl: 'https://fake-tenant.gong.invalid', accessKey: 'FAKE-KEY-123', accessKeySecret: 'FAKE-SECRET-456', myEmail: 'ian.fake@fake-osm.invalid' });
  assert.equal(cfg.gainsight.adapter, 'fake');
  assert.equal(prompts.filter((p) => /Gong API base URL/.test(p)).length, 2);
  assert.deepEqual(checked, cfg);
});

test('setup Gainsight: prints the authorize URL (no secret), and with callbackCodeParam unset prints the query names and stops', async () => {
  const dir = tmp(); const configPath = join(dir, 'config.json'); const out = [];
  const { ask } = scripted(['n', 'y', 'https://fake-sbx.gainsightcloud.invalid', '', 'FAKE-SBX-1', 'sandbox', 'FAKE-CLIENT-ID', 'FAKE-CLIENT-SECRET-zz', 'FAKE_SCOPE']);
  const startCallbackServer = async ({ handlerFor }) => new Promise((resolve) => { handlerFor(resolve)(new URLSearchParams('code=FAKE-CODE-1&state=s')); });
  const code = await runSetup({ configPath, config: EXAMPLE, ask, out: (l) => out.push(l), stateDir: dir, startCallbackServer, runCheckFn: async () => { throw new Error('must not run'); } });
  assert.equal(code, 1);
  const text = out.join('\n');
  assert.match(text, /https:\/\/fake-sbx\.gainsightcloud\.invalid\/v1\/authorize\?clientId=FAKE-CLIENT-ID/);
  assert.match(text, /callbackCodeParam.*code, state|code, state.*callbackCodeParam/s);
  assert.ok(!text.includes('FAKE-CODE-1'));
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.equal(cfg.gainsight.adapter, 'gainsight-rest');
  assert.equal(cfg.gainsight.apiBaseUrl, 'https://fake-sbx.gainsightcloud.invalid');
  assert.equal(cfg.gainsight.dryRun, true);
  assert.equal(cfg.gainsight.oauth.callbackCodeParam, '');
});

test('setup Gainsight with code param and token fields set: exchanges the code, saves tokens, runs --check; no secret on stdout', async () => {
  const dir = tmp(); const configPath = join(dir, 'config.json'); const out = [];
  const pre = { ...EXAMPLE, gainsight: { adapter: 'fake', dryRun: true, oauth: { callbackCodeParam: 'code', accessTokenField: 'FAKE_at', refreshTokenField: 'FAKE_rt' } } };
  const { ask, prompts } = scripted(['n', 'y', 'https://fake-sbx.gainsightcloud.invalid', 'https://fake-sbx-api.gainsightcloud.invalid', 'FAKE-SBX-1', 'sandbox', 'FAKE-CLIENT-ID', 'FAKE-CLIENT-SECRET-zz', 'FAKE_SCOPE']);
  const fetchImpl = async (url) => { assert.equal(url, 'https://fake-sbx.gainsightcloud.invalid/v1/users/oauth/access/token'); return json(200, { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }); };
  const startCallbackServer = async ({ handlerFor }) => new Promise((resolve) => { handlerFor(resolve)(new URLSearchParams('code=FAKE-CODE-1')); });
  let ran = false;
  const code = await runSetup({ configPath, config: pre, ask, out: (l) => out.push(l), stateDir: dir, deps: { fetchImpl }, startCallbackServer, runCheckFn: async () => { ran = true; return 0; } });
  assert.equal(code, 0);
  assert.ok(ran);
  assert.ok(existsSync(join(dir, 'gainsight-tokens.json')));
  const everything = [...out, ...prompts].join('\n');
  for (const s of [...SECRETS, 'FAKE-ACCESS-1', 'FAKE-REFRESH-1', 'FAKE-CODE-1']) assert.ok(!everything.includes(s), s);
});

test('setup Gainsight with token field names unset: prints the key names received, never the values, and stops', async () => {
  const dir = tmp(); const configPath = join(dir, 'config.json'); const out = [];
  const pre = { ...EXAMPLE, gainsight: { adapter: 'fake', dryRun: true, oauth: { callbackCodeParam: 'code' } } };
  const { ask } = scripted(['n', 'y', 'https://fake-sbx.gainsightcloud.invalid', '', 'FAKE-SBX-1', 'sandbox', 'FAKE-CLIENT-ID', 'FAKE-CLIENT-SECRET-zz', 'FAKE_SCOPE']);
  const fetchImpl = async () => json(200, { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' });
  const startCallbackServer = async ({ handlerFor }) => new Promise((resolve) => { handlerFor(resolve)(new URLSearchParams('code=FAKE-CODE-1')); });
  const code = await runSetup({ configPath, config: pre, ask, out: (l) => out.push(l), stateDir: dir, deps: { fetchImpl }, startCallbackServer, runCheckFn: async () => { throw new Error('must not run'); } });
  assert.equal(code, 1);
  const text = out.join('\n');
  assert.match(text, /FAKE_at, FAKE_rt/);
  for (const s of [...SECRETS, 'FAKE-ACCESS-1', 'FAKE-REFRESH-1', 'FAKE-CODE-1']) assert.ok(!text.includes(s), s);
});

test('makeAsk: a secret answer is not echoed to the output stream', async () => {
  const input = new PassThrough(); const output = new PassThrough(); let written = '';
  output.on('data', (d) => { written += d; });
  const ask = makeAsk(input, output);
  const p = ask('Secret: ', { secret: true });
  input.write('FAKE-SECRET-456\n');
  assert.equal(await p, 'FAKE-SECRET-456');
  ask.close();
  assert.ok(written.includes('Secret: '));
  assert.ok(!written.includes('FAKE-SECRET-456'));
});

test('makeAsk: answers piped in one burst are each delivered to the question that follows', async () => {
  const input = new PassThrough(); const output = new PassThrough();
  const ask = makeAsk(input, output);
  input.end('one\ntwo\nthree\n');
  const got = [await ask('a '), await ask('b '), await ask('c ')];
  ask.close();
  assert.deepEqual(got, ['one', 'two', 'three']);
});

test('setup.mjs does not import server.mjs (import deadlock)', () => {
  const src = readFileSync(new URL('../lib/setup.mjs', import.meta.url), 'utf8');
  assert.ok(!/from\s+['"][^'"]*server\.mjs['"]|import\(\s*['"][^'"]*server\.mjs['"]/.test(src));
});

const SERVER = fileURLToPath(new URL('../server.mjs', import.meta.url));

test('CONNECTOR_CONFIG pointing at a new file: --setup starts from config.example.json and creates it (exit 0)', () => {
  const dir = tmp(); const configPath = join(dir, 'new.json');
  const example = fileURLToPath(new URL('../config.example.json', import.meta.url)); const before = readFileSync(example, 'utf8');
  const r = spawnSync(process.execPath, [SERVER, '--setup'], { input: 'n\nn\n', encoding: 'utf8', timeout: 20000,
    env: { ...process.env, CONNECTOR_CONFIG: configPath, CONNECTOR_STATE_DIR: dir } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(existsSync(configPath));
  assert.ok(!/ENOENT/.test(r.stderr));
  assert.equal(readFileSync(example, 'utf8'), before); // F16: the example is a template, never written
});

test('plain server with a missing CONNECTOR_CONFIG: one error line, exit 1, no stack trace', () => {
  const dir = tmp();
  const r = spawnSync(process.execPath, [SERVER], { encoding: 'utf8', timeout: 20000,
    env: { ...process.env, CONNECTOR_CONFIG: join(dir, 'missing.json'), CONNECTOR_STATE_DIR: dir, CONNECTOR_TOKEN_FILE: join(dir, 't.txt') } });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.trim().split('\n').length, 1, r.stderr);
  assert.match(r.stderr, /config file not found/);
  assert.ok(!/\n\s+at /.test(r.stderr));
});

test('setup sign-in port already in use: one FAIL line, non-zero, no secrets', async () => {
  const blocker = net.createServer();
  await new Promise((res) => blocker.listen(0, '127.0.0.1', res));
  const port = blocker.address().port;
  try {
    const dir = tmp(); const out = [];
    const { ask } = scripted(['n', 'y', 'https://fake-sbx.gainsightcloud.invalid', '', 'FAKE-SBX-1', 'sandbox', 'FAKE-CLIENT-ID', 'FAKE-CLIENT-SECRET-zz', 'FAKE_SCOPE']);
    const code = await runSetup({ configPath: join(dir, 'config.json'), config: { ...EXAMPLE, port }, ask, out: (l) => out.push(l), stateDir: dir, createConnector,
      startCallbackServer: defaultCallbackServer, runCheckFn: async () => { throw new Error('must not run'); } });
    assert.notEqual(code, 0);
    const fails = out.filter((l) => l.startsWith('FAIL'));
    assert.equal(fails.length, 1);
    assert.match(fails[0], new RegExp(`^FAIL gainsight oauth: callback port ${port} in use`));
    assert.ok(!out.join('\n').includes('FAKE-CLIENT-SECRET-zz'));
  } finally { await new Promise((res) => blocker.close(res)); }
});

// Follow-ups F-6 (T-14 F16)
test('setup F16: an empty Gong key or secret, or Gainsight client id or secret, is asked again; nothing empty is written', async () => {
  const dir = tmp(); const configPath = join(dir, 'config.json'); const out = [];
  const g = scripted(['y', 'https://fake-tenant.gong.invalid', '', 'FAKE-KEY-123', '', 'FAKE-SECRET-456', 'ian.fake@fake-osm.invalid', 'n']);
  assert.equal(await runSetup({ configPath, config: EXAMPLE, ask: g.ask, out: (l) => out.push(l), stateDir: dir, runCheckFn: async () => 0 }), 0);
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.equal(cfg.gong.accessKey, 'FAKE-KEY-123');
  assert.equal(cfg.gong.accessKeySecret, 'FAKE-SECRET-456');
  assert.equal(g.prompts.filter((p) => /^Gong access key: /.test(p)).length, 2);
  assert.equal(g.prompts.filter((p) => /^Gong access key secret/.test(p)).length, 2);
  const s = scripted(['n', 'y', 'https://fake-sbx.gainsightcloud.invalid', '', 'FAKE-SBX-1', 'sandbox', '', 'FAKE-CLIENT-ID', '', 'FAKE-CLIENT-SECRET-zz', 'FAKE_SCOPE']);
  const code = await runSetup({ configPath, config: EXAMPLE, ask: s.ask, out: (l) => out.push(l), stateDir: dir,
    startCallbackServer: async () => ({ ok: false, reason: 'codeParamUnset', names: [] }), runCheckFn: async () => { throw new Error('must not run'); } });
  assert.equal(code, 1);
  const gs = JSON.parse(readFileSync(configPath, 'utf8')).gainsight;
  assert.equal(gs.oauth.clientId, 'FAKE-CLIENT-ID');
  assert.equal(gs.oauth.clientSecret, 'FAKE-CLIENT-SECRET-zz');
  assert.ok(!out.join('\n').match(/FAKE-SECRET-456|FAKE-CLIENT-SECRET-zz/));
});
