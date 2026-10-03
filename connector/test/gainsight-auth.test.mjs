// connect-ready T-6: Gainsight OAuth on a stubbed fetch. Single-use refresh tokens are persisted before use. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, utimesSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { createConnector } from '../server.mjs';
import { loadAdapters } from '../adapters/index.mjs';
import { authorizeUrl, redirectUriFor, createTokenSource, makeCallbackHandler } from '../adapters/gainsight-auth.mjs';

installNetGuard();
const APP = 'https://fake-tenant.gainsightcloud.invalid';
const CFG = { appUrl: APP, oauth: { clientId: 'FAKE-CLIENT-ID', clientSecret: 'FAKE-CLIENT-SECRET-zz', scopes: 'FAKE_SCOPE', callbackCodeParam: 'code', accessTokenField: 'FAKE_at', refreshTokenField: 'FAKE_rt' } };
const T0 = new Date('2026-10-02T12:00:00Z');
const TOKEN = 'test-token-0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const tokensFile = (stored) => { const p = join(mkdtempSync(join(tmpdir(), 'gs-auth-')), 'gainsight-tokens.json'); if (stored) writeFileSync(p, JSON.stringify(stored)); return p; };
const old = (ms) => new Date(T0.getTime() - ms).toISOString();

test('oauth: authorize URL is <app>/v1/authorize with clientId, redirectUri and scopes, never the secret', () => {
  const u = new URL(authorizeUrl(CFG, redirectUriFor(8787)));
  assert.equal(u.origin + u.pathname, `${APP}/v1/authorize`);
  assert.equal(u.searchParams.get('clientId'), 'FAKE-CLIENT-ID');
  assert.equal(u.searchParams.get('redirectUri'), 'http://127.0.0.1:8787/oauth/callback');
  assert.equal(u.searchParams.get('scopes'), 'FAKE_SCOPE');
  assert.ok(!u.href.includes('FAKE-CLIENT-SECRET-zz'));
});

test('oauth: the callback route takes the code without our token, exchanges it once, saves the raw reply, then answers 410', async () => {
  const seen = [];
  const fetchImpl = async (url, init) => { seen.push({ url, body: JSON.parse(init.body) }); return json(200, { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }); };
  const path = tokensFile();
  let done = null;
  const handler = makeCallbackHandler({ cfg: CFG, redirectUri: redirectUriFor(8787), fetchImpl, tokensPath: path, now: () => T0, onDone: (r) => { done = r; } });
  const server = createConnector({ config: {}, adapters: loadAdapters({}), token: TOKEN, oauthCallback: handler });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const r1 = await fetch(`${base}/oauth/callback?code=FAKE-CODE-1`);
    assert.equal(r1.status, 200);
    assert.match(await r1.text(), /Return to the terminal/);
    assert.deepEqual(seen, [{ url: `${APP}/v1/users/oauth/access/token`, body: { clientId: 'FAKE-CLIENT-ID', clientSecret: 'FAKE-CLIENT-SECRET-zz', grantType: 'authorization_code', redirectUri: 'http://127.0.0.1:8787/oauth/callback', code: 'FAKE-CODE-1' } }]);
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), { raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: T0.toISOString() });
    assert.deepEqual(done, { ok: true, keys: ['FAKE_at', 'FAKE_rt'] });
    assert.equal((await fetch(`${base}/oauth/callback?code=FAKE-CODE-2`)).status, 410);
    assert.equal(seen.length, 1);
  } finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});

test('oauth: outside setup, /oauth/callback without our token is 401 as before', async () => {
  const server = createConnector({ config: {}, adapters: loadAdapters({}), token: TOKEN });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try { assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/oauth/callback?code=x`)).status, 401); }
  finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});

test('oauth: with callbackCodeParam unset the handler reports the query NAMES only and calls no endpoint', async () => {
  let done = null; let calls = 0;
  const h = makeCallbackHandler({ cfg: { ...CFG, oauth: { ...CFG.oauth, callbackCodeParam: '' } }, redirectUri: 'x', fetchImpl: async () => { calls++; }, tokensPath: tokensFile(), onDone: (r) => { done = r; } });
  const r = await h(new URLSearchParams('code=FAKE-CODE-9&state=s'));
  assert.equal(r.status, 200);
  assert.ok(!r.text.includes('FAKE-CODE-9'));
  assert.deepEqual(done, { ok: false, reason: 'codeParamUnset', names: ['code', 'state'] });
  assert.equal(calls, 0);
});

test('oauth: an expired access token is refreshed and the NEW refresh token is on disk before the token is handed out', async () => {
  const path = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: old(2 * 3600e3) });
  const events = [];
  const fetchImpl = async (url, init) => { events.push(['token', JSON.parse(init.body)]); return json(200, { FAKE_at: 'FAKE-ACCESS-2', FAKE_rt: 'FAKE-REFRESH-2' }); };
  const writeFile = (p, data, o) => { events.push(['write', JSON.parse(data).raw.FAKE_rt]); writeFileSync(p, data, o); };
  const src = createTokenSource({ cfg: CFG, fetchImpl, tokensPath: path, writeFile, now: () => T0 });
  const t = await src.accessToken();
  events.push(['used', t]);
  assert.deepEqual(events, [
    ['token', { clientId: 'FAKE-CLIENT-ID', clientSecret: 'FAKE-CLIENT-SECRET-zz', grantType: 'refresh_token', refreshToken: 'FAKE-REFRESH-1' }],
    ['write', 'FAKE-REFRESH-2'],
    ['used', 'FAKE-ACCESS-2'],
  ]);
  assert.equal(JSON.parse(readFileSync(path, 'utf8')).raw.FAKE_rt, 'FAKE-REFRESH-2');
  const fresh = createTokenSource({ cfg: CFG, fetchImpl: async () => { throw new Error('must not refresh'); }, tokensPath: path, now: () => T0 });
  assert.equal(await fresh.accessToken(), 'FAKE-ACCESS-2');
});

test('oauth: a failed token-file write stops the request with an error naming the file', async () => {
  const path = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: old(2 * 3600e3) });
  let dataCalls = 0;
  const src = createTokenSource({ cfg: CFG, fetchImpl: async () => json(200, { FAKE_at: 'FAKE-ACCESS-2', FAKE_rt: 'FAKE-REFRESH-2' }), tokensPath: path,
    writeFile: () => { throw Object.assign(new Error('denied'), { code: 'EACCES' }); }, now: () => T0 });
  await assert.rejects(src.accessToken().then(() => { dataCalls++; }), (e) => e.message.includes(path) && /EACCES/.test(e.message) && /spent/.test(e.message));
  assert.equal(dataCalls, 0);
});

test('oauth: two requests at once share ONE refresh (the refresh token is single-use)', async () => {
  const path = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: old(2 * 3600e3) });
  let refreshes = 0;
  const src = createTokenSource({ cfg: CFG, fetchImpl: async () => { refreshes++; return json(200, { FAKE_at: 'FAKE-ACCESS-2', FAKE_rt: 'FAKE-REFRESH-2' }); }, tokensPath: path, now: () => T0 });
  assert.deepEqual(await Promise.all([src.accessToken(), src.accessToken()]), ['FAKE-ACCESS-2', 'FAKE-ACCESS-2']);
  assert.equal(refreshes, 1);
});

// T-14 F4: the refresh lock spans processes. Two token sources on one tokensPath stand in for two processes.
const EXPIRED = () => tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: old(2 * 3600e3) });
const slowRefresh = (count) => async () => { count.n++; await new Promise((r) => setTimeout(r, 50)); return json(200, { FAKE_at: 'FAKE-ACCESS-2', FAKE_rt: 'FAKE-REFRESH-2' }); };

test('oauth lock: two token sources (two processes) on one tokens file make exactly ONE refresh call; no lock is left', async () => {
  const path = EXPIRED();
  const count = { n: 0 };
  const a = createTokenSource({ cfg: CFG, fetchImpl: slowRefresh(count), tokensPath: path, now: () => T0, lockPollMs: 10 });
  const b = createTokenSource({ cfg: CFG, fetchImpl: slowRefresh(count), tokensPath: path, now: () => T0, lockPollMs: 10 });
  assert.deepEqual(await Promise.all([a.accessToken(), b.accessToken()]), ['FAKE-ACCESS-2', 'FAKE-ACCESS-2']);
  assert.equal(count.n, 1);
  assert.equal(existsSync(`${path}.lock`), false);
});

test('oauth lock: a lock held past the wait fails with a clear message, makes no token call and leaves the other holder\'s lock', async () => {
  const path = EXPIRED();
  writeFileSync(`${path}.lock`, 'other');
  const count = { n: 0 };
  const src = createTokenSource({ cfg: CFG, fetchImpl: slowRefresh(count), tokensPath: path, now: () => T0, lockWaitMs: 150, lockPollMs: 10 });
  await assert.rejects(src.accessToken(), (e) => e.message.includes(`${path}.lock`) && /another connector process/i.test(e.message));
  assert.equal(count.n, 0);
  assert.equal(existsSync(`${path}.lock`), true);
  unlinkSync(`${path}.lock`); // the test's own fixture, not left in the temp dir
});

test('oauth lock: a stale lock (older than 60 s, a crashed holder) is taken over: one refresh, lock removed', async () => {
  const path = EXPIRED();
  writeFileSync(`${path}.lock`, 'crashed');
  const past = new Date(Date.now() - 61e3);
  utimesSync(`${path}.lock`, past, past);
  const count = { n: 0 };
  const src = createTokenSource({ cfg: CFG, fetchImpl: slowRefresh(count), tokensPath: path, now: () => T0, lockWaitMs: 150, lockPollMs: 10 });
  assert.equal(await src.accessToken(), 'FAKE-ACCESS-2');
  assert.equal(count.n, 1);
  assert.equal(existsSync(`${path}.lock`), false);
});

test('oauth lock: a failed refresh still releases the lock', async () => {
  const path = EXPIRED();
  const src = createTokenSource({ cfg: CFG, fetchImpl: async () => json(400, { error: 'no' }), tokensPath: path, now: () => T0 });
  await assert.rejects(src.accessToken());
  assert.equal(existsSync(`${path}.lock`), false);
});

test('oauth: unset token field names list the saved reply KEYS, never values; token errors are scrubbed', async () => {
  const path = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: T0.toISOString() });
  const unset = createTokenSource({ cfg: { ...CFG, oauth: { ...CFG.oauth, accessTokenField: '', refreshTokenField: '' } }, fetchImpl: async () => {}, tokensPath: path, now: () => T0 });
  await assert.rejects(unset.accessToken(), (e) => /FAKE_at, FAKE_rt/.test(e.message) && !e.message.includes('FAKE-ACCESS-1'));
  const p2 = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: old(2 * 3600e3) });
  const bad = createTokenSource({ cfg: CFG, fetchImpl: async () => json(400, { error: 'bad FAKE-CLIENT-SECRET-zz FAKE-REFRESH-1' }), tokensPath: p2, now: () => T0 });
  await assert.rejects(bad.accessToken(), (e) => !e.message.includes('FAKE-CLIENT-SECRET-zz') && !e.message.includes('FAKE-REFRESH-1'));
});
