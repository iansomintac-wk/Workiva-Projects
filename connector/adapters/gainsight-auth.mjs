// Gainsight OAuth authorization code (connect-ready §3.3). Tested on a stubbed fetch only; unproven until `--check`.
// Refresh tokens are single-use and rotate on every refresh, so the new one is written to disk BEFORE the new
// access token is used, and only one refresh runs at a time: in one process through `inflight`, across processes (the
// running connector plus a --check in another terminal) through an exclusive lock file. Node built-ins only.
import { writeFileSync, openSync, closeSync, statSync, unlinkSync } from 'node:fs';
import { requestJson, pick } from '../lib/vendor-http.mjs';
import { readJson, writeJsonAtomic } from '../lib/state.mjs';

// CONFIRMED https://support.gainsight.com/gainsight_nxt/01Onboarding_and_Implementation/Onboarding_for_Gainsight_NXT/Login_and_Permissions/OAuth_for_Gainsight_APIs (research Q7)
export const AUTHORIZE_PATH = '/v1/authorize';                 // query clientId, redirectUri, scopes: CONFIRMED (Q7)
export const TOKEN_PATH = '/v1/users/oauth/access/token';      // body {clientId, clientSecret, grantType, redirectUri, code}: CONFIRMED (Q7)
const ACCESS_TTL_MS = 3600 * 1000;                             // access token life 3600 s: CONFIRMED (Q7)
const REFRESH_EARLY_MS = 120 * 1000;
// Cross-process refresh lock (T-14 F4): `<tokensPath>.lock`, created with 'wx' so only one process holds it.
// A holder keeps it for one token call, which vendor-http aborts after 30 s, plus one small atomic write. A lock
// older than 60 s (twice that timeout) can only be left by a holder that died, so it is taken over (guarded by
// `<tokensPath>.takeover.lock`, see breakStale). A waiter waits
// 65 s (the stale age plus 5 s), so it outlasts any live holder and also reaches a crashed one's lock going stale.
export const LOCK_STALE_MS = 60 * 1000;
export const LOCK_WAIT_MS = 65 * 1000;
const LOCK_POLL_MS = 200;
const LOCK_FS = { openSync, closeSync, statSync, unlinkSync };
// The token reply's field names and the callback's code parameter are NOT in the research: they are config
// (gainsight.oauth.accessTokenField / refreshTokenField / callbackCodeParam), never guessed.

const trimUrl = (u) => String(u || '').replace(/\/+$/, '');
export const redirectUriFor = (port) => `http://127.0.0.1:${port}/oauth/callback`;

export function authorizeUrl(cfg, redirectUri, { state } = {}) {
  const o = cfg.oauth || {};
  const u = new URL(trimUrl(cfg.appUrl) + AUTHORIZE_PATH);
  u.searchParams.set('clientId', o.clientId || '');
  u.searchParams.set('redirectUri', redirectUri);
  u.searchParams.set('scopes', o.scopes || '');
  // T-14 F10: UNCONFIRMED that Gainsight echoes a state parameter (research Q7 lists clientId, redirectUri, scopes),
  // so its name is config and empty by default; empty means none is sent or checked.
  if (o.stateParam && state) u.searchParams.set(o.stateParam, state);
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

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const ageOf = (fs, p) => { try { return Date.now() - fs.statSync(p).mtimeMs; } catch { return null; } };
function tryCreate(fs, p) {
  try { fs.closeSync(fs.openSync(p, 'wx')); return true; }
  catch (e) { if (e.code === 'EEXIST') return false; throw new Error(`Could not create the Gainsight refresh lock ${p} (${e.code || e.message})`); }
}
// Judging a lock stale and removing it are two steps. Two waiters could both judge a dead holder's lock stale; the first
// removes it and takes a fresh lock, then the second removes that FRESH lock, and both spend one single-use refresh
// token. So only the holder of `<name>.takeover.lock` may remove a stale lock, and it checks the age again after taking
// it. The takeover file is held for two sync calls; one older than staleMs was left by a process that died inside
// them, and is removed. That removal is the one remaining check-then-remove, reachable only after a crash inside a
// takeover while two other waiters are waiting.
function breakStale(fs, lockPath, staleMs) {
  const tk = lockPath.replace(/\.lock$/, '.takeover.lock');
  if (!tryCreate(fs, tk)) {
    const a = ageOf(fs, tk);
    if (a !== null && a > staleMs) { try { fs.unlinkSync(tk); } catch { /* already gone */ } }
    return;
  }
  try {
    const age = ageOf(fs, lockPath);
    if (age !== null && age > staleMs) { try { fs.unlinkSync(lockPath); } catch { /* already gone */ } }
  } finally { try { fs.unlinkSync(tk); } catch { /* already gone */ } }
}

// Takes `<tokensPath>.lock` or throws after waitMs. Returns the release function.
export async function takeLock(lockPath, { waitMs, staleMs, pollMs, fs = LOCK_FS }) {
  const until = Date.now() + waitMs;
  const release = () => { try { fs.unlinkSync(lockPath); } catch { /* already gone */ } };
  for (;;) {
    if (tryCreate(fs, lockPath)) return release;
    const age = ageOf(fs, lockPath);
    if (age === null) continue; // released between the two calls: retry now
    if (age > staleMs) { breakStale(fs, lockPath, staleMs); if (tryCreate(fs, lockPath)) return release; }
    if (Date.now() >= until) {
      throw new Error(`Another connector process is refreshing the Gainsight token: ${lockPath} was held for more than ${Math.round(waitMs / 1000)} s. Retry in a minute; if no other connector or --check is running, delete ${lockPath}.`);
    }
    await delay(pollMs);
  }
}

export function createTokenSource({ cfg, fetchImpl, tokensPath, writeFile = writeFileSync, now = () => new Date(),
  lockWaitMs = LOCK_WAIT_MS, lockStaleMs = LOCK_STALE_MS, lockPollMs = LOCK_POLL_MS, lockFs = LOCK_FS }) {
  let inflight = null;
  // T-14 F23: an obtainedAt that is not a date (hand-edited or truncated file) counts as expired, never as fresh forever.
  const expired = (s) => { const t = Date.parse(s.obtainedAt); return Number.isNaN(t) || now().getTime() - t > ACCESS_TTL_MS - REFRESH_EARLY_MS; };
  async function refresh(stored) {
    const release = await takeLock(`${tokensPath}.lock`, { waitMs: lockWaitMs, staleMs: lockStaleMs, pollMs: lockPollMs, fs: lockFs });
    try {
      // Another process may have rotated the token while this one waited: its refresh token is the one on disk now.
      const onDisk = readJson(tokensPath, null);
      if (onDisk && onDisk.raw && (onDisk.obtainedAt !== stored.obtainedAt || !expired(onDisk))) return onDisk;
      const o = cfg.oauth || {};
      const rt = pick((onDisk && onDisk.raw ? onDisk : stored).raw, o.refreshTokenField);
      if (!rt) throw new Error(`The saved Gainsight token reply has no "${o.refreshTokenField}"; run node connector/server.mjs --setup again`);
      // UNCONFIRMED (search snippet, research Q7): refresh body {grantType:"refresh_token", refreshToken}.
      const raw = await tokenCall({ cfg, fetchImpl, secrets: [String(rt)], body: { clientId: o.clientId, clientSecret: o.clientSecret, grantType: 'refresh_token', refreshToken: rt } });
      const next = { raw, obtainedAt: now().toISOString() };
      persist(tokensPath, next, writeFile); // before the new access token is used (CONFIRMED rotation, Q7)
      return next;
    } finally { release(); }
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
      if (expired(stored)) {
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

export function makeCallbackHandler({ cfg, redirectUri, fetchImpl, tokensPath, now = () => new Date(), onDone = () => {}, expectedState = null }) {
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
    const sp = cfg.oauth && cfg.oauth.stateParam;
    // Checked before `used = true`, so a forged redirect does not spend the one-shot callback.
    if (sp && expectedState && params.get(sp) !== expectedState) return { status: 400, text: 'The sign-in state did not match this setup. Return to the terminal.' };
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
