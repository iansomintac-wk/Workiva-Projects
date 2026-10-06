// Shared HTTP for the vendor adapters (connect-ready). Callers inject fetch; errors never carry a secret. Node built-ins only.
import { scrub } from '../adapters/ai-shared.mjs';

const TIMEOUT_MS = 30000;

export class VendorError extends Error {
  constructor(message, { status = null, bodyKeys = [], body = null } = {}) {
    super(message); this.status = status; this.bodyKeys = bodyKeys;
    // T-14 F9: the vendor body is kept only for the duplicate and no-calls checks. requestJson scrubs it, and it is not
    // enumerable, so Node's print of an uncaught error (which lists own enumerable fields) never shows it.
    Object.defineProperty(this, 'body', { value: body, enumerable: false, writable: true, configurable: true });
  }
}

// T-14 F8: a secret holding ", \ or a control character appears escaped inside JSON text, so that form is scrubbed too.
const forms = (k) => { const raw = String(k); const esc = JSON.stringify(raw).slice(1, -1); return esc === raw ? [raw] : [raw, esc]; };
export function scrubAll(text, secrets = []) {
  return secrets.filter(Boolean).flatMap(forms).reduce((s, k) => scrub(s, k), String(text == null ? '' : text));
}
const scrubBody = (json, secrets) => { try { return JSON.parse(scrubAll(JSON.stringify(json), secrets)); } catch { return null; } };

export async function requestJson({ fetchImpl, method = 'GET', url, headers = {}, body, secrets = [], host }) {
  if (typeof fetchImpl !== 'function') throw new VendorError('no fetch available');
  let resp;
  try {
    resp = await fetchImpl(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    if (e && (e.name === 'TimeoutError' || e.name === 'AbortError')) throw new VendorError(`The request to ${host} timed out after 30 seconds.`);
    throw new VendorError(`Network error reaching ${host}.`);
  }
  const text = await resp.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  if (!resp.ok) {
    const detail = json ? JSON.stringify(json).slice(0, 500) : (resp.statusText || '');
    throw new VendorError(scrubAll(`${host} HTTP ${resp.status}: ${detail}`, secrets), {
      status: resp.status, bodyKeys: json && typeof json === 'object' ? Object.keys(json) : [], body: json == null ? null : scrubBody(json, secrets),
    });
  }
  return json;
}

// One caller at a time keeps at least minIntervalMs between requests (vendor rate limits).
export function pacer(minIntervalMs, sleep = (ms) => new Promise((r) => setTimeout(r, ms))) {
  let last = 0;
  return async () => {
    const wait = last + minIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
  };
}

export function pick(obj, path) {
  return String(path || '').split('.').filter(Boolean).reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
