// Gainsight OAuth authorization code (connect-ready §3.3). Tested on a stubbed fetch only; unproven until `--check`.
// Refresh tokens are single-use and rotate on every refresh, so the new one is written to disk BEFORE the new
// access token is used, and only one refresh runs at a time. Node built-ins only.
import { writeFileSync } from 'node:fs';
import { requestJson, pick } from '../lib/vendor-http.mjs';
import { readJson, writeJsonAtomic } from '../lib/state.mjs';

// CONFIRMED https://support.gainsight.com/gainsight_nxt/01Onboarding_and_Implementation/Onboarding_for_Gainsight_NXT/Login_and_Permissions/OAuth_for_Gainsight_APIs (research Q7)
export const AUTHORIZE_PATH = '/v1/authorize';                 // query clientId, redirectUri, scopes: CONFIRMED (Q7)
export const TOKEN_PATH = '/v1/users/oauth/access/token';      // body {clientId, clientSecret, grantType, redirectUri, code}: CONFIRMED (Q7)
const ACCESS_TTL_MS = 3600 * 1000;                             // access token life 3600 s: CONFIRMED (Q7)
const REFRESH_EARLY_MS = 120 * 1000;
// The token reply's field names and the callback's code parameter are NOT in the research: they are config
// (gainsight.oauth.accessTokenField / refreshTokenField / callbackCodeParam), never guessed.

const trimUrl = (u) => String(u || '').replace(/\/+$/, '');
export const redirectUriFor = (port) => `http://127.0.0.1:${port}/oauth/callback`;

export function authorizeUrl(cfg, redirectUri) {
  const o = cfg.oauth || {};
  const u = new URL(trimUrl(cfg.appUrl) + AUTHORIZE_PATH);
  u.searchParams.set('clientId', o.clientId || '');
  u.searchParams.set('redirectUri', redirectUri);
  u.searchParams.set('scopes', o.scopes || '');
  return u.href;
}

function persist(tokensPath, value, writeFile) {
  try { writeJsonAtomic(tokensPath, value, { writeFile }); }
  catch (e) {
    throw new Error(`Gainsight answered, but ${tokensPath} could not be written (${e.code || e.message}). The old refresh token is now spent: fix the file, then run node connector/server.mjs --setup again.`);
  }
}

async function tokenCall({ cfg, fetchImpl, body, secrets }) {
  return requestJson({ fetchImpl: fetchImpl || globalThis.fetch, method: 'POST', url: trimUrl(cfg.appUrl) + TOKEN_PATH,
    headers: { 'Content-Type': 'application/json' }, body, secrets: [cfg.oauth && cfg.oauth.clientSecret, ...secrets], host: 'Gainsight' });
}

export async function exchangeCode({ cfg, code, redirectUri, fetchImpl, tokensPath, writeFile = writeFileSync, now = () => new Date() }) {
  const o = cfg.oauth || {};
  const raw = await tokenCall({ cfg, fetchImpl, secrets: [code], body: { clientId: o.clientId, clientSecret: o.clientSecret, grantType: 'authorization_code', redirectUri, code } });
  persist(tokensPath, { raw, obtainedAt: now().toISOString() }, writeFile);
  return raw;
}

export function createTokenSource({ cfg, fetchImpl, tokensPath, writeFile = writeFileSync, now = () => new Date() }) {
  let inflight = null;
  async function refresh(stored) {
    const o = cfg.oauth || {};
    const rt = pick(stored.raw, o.refreshTokenField);
    if (!rt) throw new Error(`The saved Gainsight token reply has no "${o.refreshTokenField}"; run node connector/server.mjs --setup again`);
    // UNCONFIRMED (search snippet, research Q7): refresh body {grantType:"refresh_token", refreshToken}.
    const raw = await tokenCall({ cfg, fetchImpl, secrets: [String(rt)], body: { clientId: o.clientId, clientSecret: o.clientSecret, grantType: 'refresh_token', refreshToken: rt } });
    const next = { raw, obtainedAt: now().toISOString() };
    persist(tokensPath, next, writeFile); // before the new access token is used (CONFIRMED rotation, Q7)
    return next;
  }
  return {
    async accessToken() {
      const o = cfg.oauth || {};
      const stored = readJson(tokensPath, null);
      if (!stored || !stored.raw) throw new Error(`No Gainsight tokens in ${tokensPath}: run node connector/server.mjs --setup`);
      if (!o.accessTokenField || !o.refreshTokenField) {
        throw new Error(`Set gainsight.oauth.accessTokenField and refreshTokenField in config.json. The saved Gainsight token reply has these field names: ${Object.keys(stored.raw).join(', ')}`);
      }
      let cur = stored;
      if (now().getTime() - Date.parse(stored.obtainedAt) > ACCESS_TTL_MS - REFRESH_EARLY_MS) {
        // No await before this line, so concurrent callers share one refresh.
        inflight = inflight || refresh(stored).finally(() => { inflight = null; });
        cur = await inflight;
      }
      const t = pick(cur.raw, o.accessTokenField);
      if (!t) throw new Error(`The Gainsight token reply has no "${o.accessTokenField}"; check gainsight.oauth.accessTokenField`);
      return String(t);
    },
  };
}

export function makeCallbackHandler({ cfg, redirectUri, fetchImpl, tokensPath, now = () => new Date(), onDone = () => {} }) {
  let used = false;
  return async (params) => {
    if (used) return { status: 410, text: 'This sign-in was already received. Return to the terminal.' };
    const name = cfg.oauth && cfg.oauth.callbackCodeParam;
    if (!name) {
      used = true;
      const names = [...new Set(params.keys())];
      onDone({ ok: false, reason: 'codeParamUnset', names });
      return { status: 200, text: `Gainsight redirected here with query names: ${names.join(', ') || '(none)'}. Return to the terminal.` };
    }
    const code = params.get(name);
    if (!code) return { status: 400, text: `No "${name}" in the redirect. Return to the terminal.` };
    used = true;
    try {
      const raw = await exchangeCode({ cfg, code, redirectUri, fetchImpl, tokensPath, now });
      onDone({ ok: true, keys: Object.keys(raw || {}) });
      return { status: 200, text: 'Gainsight sign-in received. Return to the terminal.' };
    } catch (e) {
      onDone({ ok: false, reason: 'exchange', error: e.message });
      return { status: 502, text: 'The token exchange failed. Return to the terminal for the reason.' };
    }
  };
}
