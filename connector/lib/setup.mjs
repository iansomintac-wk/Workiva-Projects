// --setup (connect-ready §3.5, CR5): one question at a time per vendor, either one skippable. It writes the
// git-ignored config.json, runs the Gainsight sign-in through the setup-only /oauth/callback, then runs --check.
// Secrets are asked with echo off and never printed. Node built-ins only.
import crypto from 'node:crypto';
import { join } from 'node:path';
import { writeJsonAtomic, resolveStateDir, FILES } from './state.mjs';
import { authorizeUrl, redirectUriFor, makeCallbackHandler } from '../adapters/gainsight-auth.mjs';
import { loadAdapters } from '../adapters/index.mjs';
import { runCheck } from './check.mjs';
// Do NOT import ../server.mjs here: when run as `node connector/server.mjs --setup`, server.mjs is still evaluating
// (it awaits this import), so a static or dynamic import of it would deadlock. server.mjs passes createConnector in.

const isHttpsBase = (v) => /^https:\/\/[a-z0-9.-]+(:\d+)?\/?$/i.test(v);
const isEmail = (v) => /^[^@\s]+@[^@\s]+$/.test(v);
const yes = (v) => /^y(es)?$/i.test(String(v).trim());
const trimUrl = (u) => String(u).trim().replace(/\/+$/, '');

async function askValid(ask, out, q, ok, hint, opts = {}) {
  for (let i = 0; i < 3; i++) {
    const v = String(await ask(q, opts)).trim();
    if (ok(v)) return v;
    out(`  Not valid: ${hint}`);
  }
  throw new Error(`setup stopped: no valid answer to "${q.trim()}" after 3 tries`);
}
const filled = (v) => v.length > 0; // T-14 F16: an empty key or secret would only fail one step later, in --check

// One-shot sign-in listener on 127.0.0.1 only. The callback handler is one-shot; this closes the server after it answers.
export function defaultCallbackServer({ port, handlerFor, createConnector, timeoutMs = 10 * 60 * 1000 }) {
  return new Promise((resolve) => {
    let server = null;
    const finish = (r) => { clearTimeout(timer); setTimeout(() => server && server.close(), 200); resolve(r); };
    const timer = setTimeout(() => finish({ ok: false, reason: 'timeout' }), timeoutMs);
    server = createConnector({ config: {}, adapters: loadAdapters({}), token: crypto.randomBytes(32).toString('hex'), oauthCallback: handlerFor(finish) });
    server.on('error', (e) => finish({ ok: false, reason: 'listen', code: e.code, error: e.code === 'EADDRINUSE' ? `callback port ${port} in use` : `callback server could not start (${e.code || 'error'})` }));
    server.listen(port, '127.0.0.1');
  });
}

export async function runSetup({ configPath, config = {}, ask, out = console.log, deps = {}, stateDir, createConnector, startCallbackServer = defaultCallbackServer, runCheckFn = runCheck }) {
  const next = JSON.parse(JSON.stringify(config));
  if (yes(await ask('Set up Gong now? (y/n) '))) {
    out('Gong: the values come from the Gong Tech admin (see connector/CONNECT-GONG.md).');
    const g = (next.gong = { ...(next.gong || {}), adapter: 'gong-rest' });
    g.baseUrl = trimUrl(await askValid(ask, out, 'Gong API base URL (starts https://): ', isHttpsBase, 'an https:// address with no path'));
    g.accessKey = await askValid(ask, out, 'Gong access key: ', filled, 'the access key cannot be empty');
    g.accessKeySecret = await askValid(ask, out, 'Gong access key secret (not shown): ', filled, 'the secret cannot be empty', { secret: true });
    g.myEmail = await askValid(ask, out, 'Your Gong email: ', isEmail, 'an email address');
  }
  let gainsight = false;
  if (yes(await ask('Set up Gainsight now? (y/n) '))) {
    gainsight = true;
    out('Gainsight: the values come from the Gainsight Super Admin (see connector/CONNECT-GAINSIGHT.md).');
    const g = (next.gainsight = { dryRun: true, ...(next.gainsight || {}), adapter: 'gainsight-rest' });
    g.appUrl = trimUrl(await askValid(ask, out, 'Gainsight tenant URL (starts https://): ', isHttpsBase, 'an https:// address with no path'));
    const api = String(await ask('Gainsight API base URL (Enter = same as the tenant URL): ')).trim();
    if (api && !isHttpsBase(api)) throw new Error('setup stopped: the API base URL must be an https:// address with no path');
    g.apiBaseUrl = api ? trimUrl(api) : g.appUrl;
    g.tenantId = String(await ask('Gainsight tenant id (from the admin): ')).trim();
    g.environment = await askValid(ask, out, 'Is this tenant a sandbox or production? (sandbox/production): ', (v) => v === 'sandbox' || v === 'production', 'type sandbox or production');
    g.oauth = { callbackCodeParam: '', accessTokenField: '', refreshTokenField: '', ...(g.oauth || {}) };
    g.oauth.clientId = await askValid(ask, out, 'OAuth client id: ', filled, 'the client id cannot be empty');
    g.oauth.clientSecret = await askValid(ask, out, 'OAuth client secret (not shown): ', filled, 'the client secret cannot be empty', { secret: true });
    g.oauth.scopes = String(await ask('OAuth scopes, exactly as the admin gave them: ')).trim();
  }
  writeJsonAtomic(configPath, next);
  out(`Wrote ${configPath} (git-ignored).`);
  if (gainsight) {
    const g = next.gainsight;
    const port = next.port ?? 8787;
    const redirectUri = redirectUriFor(port);
    out(`Open this address in your browser and sign in to Gainsight (redirect URI registered by the admin: ${redirectUri}):`);
    out(authorizeUrl(g, redirectUri));
    out('Waiting for the sign-in (10 minutes)...');
    const r = await startCallbackServer({ port, createConnector, handlerFor: (onDone) => makeCallbackHandler({ cfg: g, redirectUri, fetchImpl: deps.fetchImpl,
      tokensPath: join(resolveStateDir(stateDir), FILES.tokens), onDone }) });
    if (r.reason === 'codeParamUnset') {
      out(`Gainsight redirected back with these query names: ${r.names.join(', ') || '(none)'}. Set gainsight.oauth.callbackCodeParam in ${configPath} to the one that carries the code (CONNECT-GAINSIGHT.md), then run --setup again and skip Gong.`);
      return 1;
    }
    if (r.reason === 'listen') { out(`FAIL gainsight oauth: ${r.error}; who fixes it: Ian (free the port or set "port" in ${configPath}, then run --setup again)`); return 1; }
    if (!r.ok) { out(`FAIL gainsight sign-in: ${r.reason === 'timeout' ? 'no redirect arrived in 10 minutes' : r.error}; who fixes it: Ian (run --setup again)`); return 1; }
    if (!g.oauth.accessTokenField || !g.oauth.refreshTokenField) {
      out(`Gainsight answered with these field names: ${r.keys.join(', ')}. Set gainsight.oauth.accessTokenField and refreshTokenField in ${configPath} to the two that hold the access and refresh tokens, then run node connector/server.mjs --check.`);
      return 1;
    }
    out('Gainsight sign-in saved.');
  }
  out('Running --check:');
  return runCheckFn({ config: next, stateDir, deps, out });
}
