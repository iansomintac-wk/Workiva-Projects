// Connector server tests (B2). Node built-ins only; fake adapters; ephemeral ports on 127.0.0.1.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validate } from '../lib/validate.mjs';
import { createConnector } from '../server.mjs';
import { loadAdapters } from '../adapters/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const schema = (n) => JSON.parse(readFileSync(join(root, 'schemas', `${n}.json`), 'utf8'));
const TOKEN = 'test-token-0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
const tmp = mkdtempSync(join(tmpdir(), 'connector-test-'));
let seq = 0;

async function start(extra = {}) {
  const logPath = join(tmp, `log-${seq++}.jsonl`);
  const server = createConnector({ config: {}, adapters: loadAdapters({}), token: TOKEN, logPath, ...extra });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const close = () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); });
  return { server, base, logPath, close };
}
const auth = { Authorization: `Bearer ${TOKEN}` };
const json = { ...auth, 'Content-Type': 'application/json' };
const ROUTES = [['GET', '/v1/health'], ['GET', '/v1/calls'], ['GET', '/v1/accounts'], ['POST', '/v1/push'], ['POST', '/v1/ai']];

test('t1 health with token validates, adapters all fake', async () => {
  const s = await start();
  try {
    const r = await fetch(`${s.base}/v1/health`, { headers: auth });
    assert.equal(r.status, 200);
    const b = await r.json();
    assert.deepEqual(validate(schema('health'), b), []);
    assert.deepEqual(b.adapters, { gong: 'fake', gainsight: 'fake', ai: 'fake' });
  } finally { await s.close(); }
});

test('t2 every route: no token -> 401, wrong token -> 401', async () => {
  const s = await start();
  try {
    for (const [method, path] of ROUTES) {
      const body = method === 'POST' ? { body: '{}' } : {};
      const none = await fetch(s.base + path, { method, ...body });
      assert.equal(none.status, 401, `${method} ${path} tokenless`);
      assert.deepEqual(await none.json(), { error: 'unauthorized' });
      const wrong = await fetch(s.base + path, { method, ...body, headers: { Authorization: 'Bearer nope' } });
      assert.equal(wrong.status, 401, `${method} ${path} wrong token`);
      const longer = await fetch(s.base + path, { method, ...body, headers: { Authorization: `Bearer ${TOKEN}x` } });
      assert.equal(longer.status, 401, `${method} ${path} longer token`);
      const basic = await fetch(s.base + path, { method, ...body, headers: { Authorization: `Basic ${TOKEN}` } });
      assert.equal(basic.status, 401, `${method} ${path} wrong scheme`);
    }
  } finally { await s.close(); }
});

test('t3 OPTIONS preflight: no auth, 204, ACAO null, allow-headers has authorization', async () => {
  const s = await start();
  try {
    const r = await fetch(`${s.base}/v1/health`, { method: 'OPTIONS', headers: { Origin: 'null', 'Access-Control-Request-Method': 'GET' } });
    assert.equal(r.status, 204);
    assert.equal(r.headers.get('access-control-allow-origin'), 'null');
    assert.match(r.headers.get('access-control-allow-headers'), /authorization/i);
    assert.match(r.headers.get('access-control-allow-methods'), /POST/);
    assert.equal(r.headers.get('access-control-allow-private-network'), 'true');
    assert.match(r.headers.get('vary'), /Origin/i);
  } finally { await s.close(); }
});

test('t4 CORS: localhost and 127.0.0.1 echoed; other origins get no ACAO', async () => {
  const s = await start();
  try {
    for (const o of ['http://localhost:5173', 'http://127.0.0.1:9', 'null']) {
      const r = await fetch(`${s.base}/v1/health`, { method: 'OPTIONS', headers: { Origin: o } });
      assert.equal(r.headers.get('access-control-allow-origin'), o, o);
    }
    for (const o of ['https://evil.example', 'http://localhost.evil.example', 'https://localhost:3000', 'http://127.0.0.1.evil.example:80']) {
      const pre = await fetch(`${s.base}/v1/health`, { method: 'OPTIONS', headers: { Origin: o } });
      assert.equal(pre.headers.get('access-control-allow-origin'), null, `preflight ${o}`);
      const get = await fetch(`${s.base}/v1/health`, { headers: { ...auth, Origin: o } });
      assert.equal(get.headers.get('access-control-allow-origin'), null, `GET ${o}`);
    }
    const ok = await fetch(`${s.base}/v1/health`, { headers: { ...auth, Origin: 'null' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'null');
    const unauth = await fetch(`${s.base}/v1/health`, { headers: { Origin: 'null' } });
    assert.equal(unauth.status, 401);
    assert.equal(unauth.headers.get('access-control-allow-origin'), 'null', '401 still readable by the page');
  } finally { await s.close(); }
});

test('t5 calls: validates, filters by since, missing since = all, bad since = 400', async () => {
  const s = await start();
  try {
    const all = await (await fetch(`${s.base}/v1/calls`, { headers: auth })).json();
    assert.deepEqual(validate(schema('calls'), all), []);
    assert.ok(all.calls.length >= 2);
    const times = all.calls.map((c) => Date.parse(c.startedAt)).sort((a, b) => a - b);
    const since = new Date(times[Math.floor(times.length / 2)]).toISOString();
    const r = await fetch(`${s.base}/v1/calls?since=${encodeURIComponent(since)}`, { headers: auth });
    const part = await r.json();
    assert.deepEqual(validate(schema('calls'), part), []);
    assert.ok(part.calls.length > 0 && part.calls.length < all.calls.length);
    assert.ok(part.calls.every((c) => Date.parse(c.startedAt) >= Date.parse(since)));
    assert.equal(part.calls.length, all.calls.filter((c) => Date.parse(c.startedAt) >= Date.parse(since)).length);
    const bad = await fetch(`${s.base}/v1/calls?since=yesterday`, { headers: auth });
    assert.equal(bad.status, 400);
    assert.deepEqual(validate(schema('error'), await bad.json()), []);
  } finally { await s.close(); }
});

test('t6 accounts validates, 17 accounts', async () => {
  const s = await start();
  try {
    const b = await (await fetch(`${s.base}/v1/accounts`, { headers: auth })).json();
    assert.deepEqual(validate(schema('accounts'), b), []);
    assert.equal(b.accounts.length, 17);
  } finally { await s.close(); }
});

const item = (id, fields = {}) => ({ id, kind: 'At-Risk CTA', customerRef: { gainsightId: 'GS-DEMO-001', name: 'Aldridge Energy' }, fields: { ctaName: 'x', reason: 'y', severity: 'high', ...fields } });

test('t7 push: one sent per item, log gains N lines; forceFail -> failed', async () => {
  const s = await start();
  try {
    const r = await fetch(`${s.base}/v1/push`, { method: 'POST', headers: json, body: JSON.stringify({ items: [item('q1'), item('q2')] }) });
    assert.equal(r.status, 200);
    const b = await r.json();
    assert.deepEqual(validate(schema('push-response'), b), []);
    assert.deepEqual(b.results, [
      { id: 'q1', status: 'sent', externalId: 'FAKE-q1', error: null },
      { id: 'q2', status: 'sent', externalId: 'FAKE-q2', error: null }]);
    assert.equal(readFileSync(s.logPath, 'utf8').trim().split('\n').length, 2);
    const f = await (await fetch(`${s.base}/v1/push`, { method: 'POST', headers: json, body: JSON.stringify({ items: [item('q3', { forceFail: true })] }) })).json();
    assert.deepEqual(validate(schema('push-response'), f), []);
    assert.equal(f.results[0].status, 'failed');
    assert.equal(f.results[0].externalId, null);
    assert.equal(f.results[0].error, 'fake failure (forceFail)');
  } finally { await s.close(); }
});

test('t8 push: schema-invalid and non-JSON bodies -> 400 with messages', async () => {
  const s = await start();
  try {
    const bad = await fetch(`${s.base}/v1/push`, { method: 'POST', headers: json, body: JSON.stringify({ items: [{ id: 'a' }] }) });
    assert.equal(bad.status, 400);
    const b = await bad.json();
    assert.deepEqual(validate(schema('error'), b), []);
    assert.match(b.error, /required/);
    const nj = await fetch(`${s.base}/v1/push`, { method: 'POST', headers: json, body: '{not json' });
    assert.equal(nj.status, 400);
    assert.deepEqual(validate(schema('error'), await nj.json()), []);
    assert.equal(existsSync(s.logPath), false, 'nothing logged for invalid push');
  } finally { await s.close(); }
});

test('t9 main path binds 127.0.0.1 even when config.host is 0.0.0.0; token file created; warning printed', async () => {
  const cfg = join(tmp, 'main-config.json');
  const tokenFile = join(tmp, 'main-token.txt');
  writeFileSync(cfg, JSON.stringify({ port: 0, host: '0.0.0.0' }));
  const child = spawn(process.execPath, [join(root, 'server.mjs')], {
    env: { ...process.env, CONNECTOR_CONFIG: cfg, CONNECTOR_TOKEN_FILE: tokenFile, CONNECTOR_LOG: join(tmp, 'main-log.jsonl') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = ''; let err = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { err += d; });
  try {
    await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error(`no listen line: ${out}${err}`)), 8000);
      child.stdout.on('data', () => { if (/token [0-9a-f]+/.test(out)) { clearTimeout(t); res(); } });
      child.on('exit', (c) => { clearTimeout(t); rej(new Error(`exited ${c}: ${out}${err}`)); });
    });
    const m = out.match(/connector listening http:\/\/127\.0\.0\.1:(\d+)/);
    assert.ok(m, `stdout: ${out}`);
    const tok = out.match(/token ([0-9a-f]+)/)[1];
    assert.equal(tok.length, 64);
    assert.equal(readFileSync(tokenFile, 'utf8').trim(), tok);
    assert.match(out + err, /host.*ignored/i);
    const r = await fetch(`http://127.0.0.1:${m[1]}/v1/health`, { headers: { Authorization: `Bearer ${tok}` } });
    assert.equal(r.status, 200);
  } finally {
    child.removeAllListeners('exit');
    child.kill();
    await new Promise((r) => (child.exitCode !== null || child.signalCode ? r() : child.on('exit', r)));
  }
});

test('t10 unknown route -> 404 {error}; wrong method on known route -> 404', async () => {
  const s = await start();
  try {
    const r = await fetch(`${s.base}/v1/nope`, { headers: auth });
    assert.equal(r.status, 404);
    assert.deepEqual(validate(schema('error'), await r.json()), []);
    const m = await fetch(`${s.base}/v1/health`, { method: 'POST', headers: json, body: '{}' });
    assert.equal(m.status, 404);
  } finally { await s.close(); }
});

test('t11 body over 1 MB -> 413 {error}', async () => {
  const s = await start();
  try {
    const big = JSON.stringify({ items: [], pad: 'x'.repeat(1024 * 1024 + 10) });
    const r = await fetch(`${s.base}/v1/push`, { method: 'POST', headers: json, body: big });
    assert.equal(r.status, 413);
    assert.deepEqual(validate(schema('error'), await r.json()), []);
  } finally { await s.close(); }
});

test('t12 a server bug becomes 500, never a bad response', async () => {
  const ad = loadAdapters({});
  ad.gainsight = { ...ad.gainsight, listAccounts: async () => [{ nope: true }] };
  const s = await start({ adapters: ad });
  try {
    const r = await fetch(`${s.base}/v1/accounts`, { headers: auth });
    assert.equal(r.status, 500);
    assert.deepEqual(validate(schema('error'), await r.json()), []);
  } finally { await s.close(); }
});

test('t13 adapter failure -> 502 {error}', async () => {
  const ad = loadAdapters({});
  ad.gong = { ...ad.gong, listCalls: async () => { throw new Error('upstream down'); } };
  const s = await start({ adapters: ad });
  try {
    const r = await fetch(`${s.base}/v1/calls`, { headers: auth });
    assert.equal(r.status, 502);
    assert.match((await r.json()).error, /upstream down/);
  } finally { await s.close(); }
});

test('t14 loadAdapters: unknown adapter name throws', () => {
  assert.throws(() => loadAdapters({ gong: { adapter: 'gong-rest' } }), /adapter not built: gong-rest/);
  assert.throws(() => loadAdapters({ gainsight: { adapter: 'x' } }), /adapter not built: x/);
});

test.after(() => { rmSync(tmp, { recursive: true, force: true }); });
