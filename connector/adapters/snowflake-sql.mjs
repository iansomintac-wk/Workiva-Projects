// Real Snowflake adapter (M1): SQL API v2 with key-pair JWT, read-only statement from cfg.sqlFile. Tested on
// documented-shape fixtures only; unproven until run against the configured account. Node built-ins only.
import { readFileSync } from 'node:fs';
import { randomUUID, randomInt } from 'node:crypto';
import { VendorError, scrubAll } from '../lib/vendor-http.mjs';
import { buildSnowflakeJwt } from '../lib/snowflake-jwt.mjs';
import { loadProofSafe, isProven, tenantOf, healthName } from '../lib/state.mjs';
import { assertReadOnlySql } from '../lib/snowflake-guard.mjs';

const FIELDS = ['SALESFORCE_ACCOUNT_ID', 'GAINSIGHT_COMPANY_ID', 'COMPANY_NAME', 'CSAT_SENT_DATE', 'CSAT_ANSWERED_DATE'];
const REQUIRED = ['account', 'user', 'privateKeyFile', 'sqlFile'];
const MAX_429 = 5;
const REQUEST_TIMEOUT_MS = 30000;

export function create(cfg = {}, deps = {}) {
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const sleep = deps.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const now = deps.now || (() => new Date());
  const pollCapMs = Number(cfg.pollCapMs) > 0 ? Number(cfg.pollCapMs) : 60000;
  const base = `https://${cfg.account}.snowflakecomputing.com`;

  async function send(method, path, { query = {}, body, secrets, headers }) {
    const qs = new URLSearchParams(query).toString();
    let resp;
    try {
      resp = await fetchImpl(base + path + (qs ? `?${qs}` : ''), { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch { throw new VendorError('Network error reaching Snowflake.'); }
    const text = await resp.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { status: resp.status, json, text, secrets };
  }
  function fail(r) {
    const detail = scrubAll(r.json ? JSON.stringify(r.json) : r.text, r.secrets).slice(0, 500);
    return new VendorError(scrubAll(`Snowflake HTTP ${r.status}: ${detail}`, r.secrets), { status: r.status, body: null });
  }

  async function listCsat({ since } = {}) {
    const missing = REQUIRED.filter((k) => !String(cfg[k] || '').trim());
    if (missing.length) throw new Error(`snowflake-sql is not configured (missing snowflake.${missing.join(', snowflake.')})`);
    const pem = readFileSync(cfg.privateKeyFile, 'utf8');
    const statement = assertReadOnlySql(readFileSync(cfg.sqlFile, 'utf8'));
    const jwt = buildSnowflakeJwt({ account: cfg.account, user: cfg.user, privateKeyPem: pem, now: Math.floor(now().getTime() / 1000) });
    const keyBody = pem.split(/\r?\n/).filter((l) => l && !l.startsWith('-----')).join('');
    const secrets = [pem, keyBody, jwt, `Bearer ${jwt}`];
    const headers = { Authorization: `Bearer ${jwt}`, 'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT', 'Content-Type': 'application/json', Accept: 'application/json' };
    const call = (method, path, o = {}) => send(method, path, { ...o, secrets, headers });

    const requestId = randomUUID();
    const body = {
      statement, timeout: Number(cfg.timeoutSec) || 60, warehouse: cfg.warehouse, role: cfg.role, database: cfg.database, schema: cfg.schema,
      parameters: { MULTI_STATEMENT_COUNT: '1' },
    };
    let r;
    for (let attempt = 0; ; attempt++) {
      r = await call('POST', '/api/v2/statements', { query: attempt ? { requestId, retry: 'true' } : { requestId }, body });
      if (r.status !== 429) break;
      if (attempt >= MAX_429) throw fail(r);
      await sleep(Math.min(30000, 500 * 2 ** attempt) + randomInt(0, 250)); // jittered backoff, same requestId
    }
    let waited = 0;
    for (let delay = 250; r.status === 202; delay = Math.min(delay * 2, 5000)) {
      const handle = r.json && r.json.statementHandle;
      if (!handle) throw new VendorError('Snowflake HTTP 202 without a statement handle');
      if (waited >= pollCapMs) throw new VendorError(`Snowflake statement still running after ${pollCapMs} ms`);
      await sleep(delay); waited += delay;
      r = await call('GET', `/api/v2/statements/${handle}`);
    }
    if (r.status !== 200) throw fail(r);

    const first = r.json || {};
    const meta = first.resultSetMetaData || {};
    const names = (meta.rowType || []).map((c) => String(c.name).toUpperCase());
    const idx = FIELDS.map((f) => {
      const i = names.indexOf(f);
      if (i < 0) throw new Error(`Snowflake result is missing column ${f}`);
      return i;
    });
    let data = first.data || [];
    const parts = (meta.partitionInfo || []).length;
    for (let p = 1; p < parts; p++) {
      const pr = await call('GET', `/api/v2/statements/${first.statementHandle}`, { query: { partition: String(p) } });
      if (pr.status !== 200) throw fail(pr);
      data = data.concat((pr.json && pr.json.data) || []);
    }
    // UNVERIFIED against a live account: a reviewer read in the Snowflake SQL API docs that DATE values come back as
    // epoch-day integer strings (e.g. "19723"). Convert those by rowType type 'date'; ISO strings pass through unchanged.
    const isDate = FIELDS.map((f, k) => String(((meta.rowType || [])[idx[k]] || {}).type || '').toLowerCase() === 'date');
    const cell = (v, k) => {
      if (v == null) return '';
      const s = String(v);
      if (isDate[k] && /^-?\d+$/.test(s)) return new Date(Number(s) * 86400000).toISOString().slice(0, 10);
      return s;
    };
    let rows = data.map((row) => Object.fromEntries(FIELDS.map((f, k) => [f, cell(row[idx[k]], k)])));
    if (since) {
      const t = String(since).slice(0, 10);
      rows = rows.filter((x) => (x.CSAT_ANSWERED_DATE || x.CSAT_SENT_DATE) >= t);
    }
    return rows;
  }

  return { get name() { return healthName('snowflake-sql', { proven: isProven(loadProofSafe(deps.stateDir), 'snowflake', 'read', tenantOf('snowflake', cfg)) }); }, listCsat };
}
