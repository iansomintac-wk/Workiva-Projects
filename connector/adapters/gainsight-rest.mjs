// Real Gainsight CS adapter (connect-ready §3.3). Tested on recorded-shape fixtures only; unproven until `--check`
// passes against the configured tenant. Node built-ins only; fetch is injected (deps.fetchImpl) or the global one.
import { join } from 'node:path';
import { requestJson, pacer, VendorError } from '../lib/vendor-http.mjs';
import { loadProof, isProven, tenantOf, healthName, resolveStateDir, FILES } from '../lib/state.mjs';
import { createTokenSource } from './gainsight-auth.mjs';

// CONFIRMED https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Company_and_Relationship_API/Company_API_Documentation (research Q8)
export const QUERY_PATH = '/v1/data/objects/query/';
export const PAGE_LIMIT = 5000;   // CONFIRMED (Q8): at most 5000 records per call; page by offset
// CONFIRMED (Q8; https://support.gainsight.com/Gainsight_NXT/Administration_and_Permissions/General_Administration/Gainsight_System_Limits):
// 100 calls/min is the lower of the two published limits; plan to it.
const MIN_INTERVAL_MS = 600;
// CONFIRMED (Q10 lookups): Company records carry Gsid and Name.
const ID_FIELD = 'Gsid';
const NAME_FIELD = 'Name';
export const FIELD_KEYS = ['tier', 'arr', 'renewalDate', 'csmOwner', 'healthScore'];
export const GATE_KEYS = ['readinessAssessment', 'csatContact', 'successPlan'];

// UNCONFIRMED (Q8): rows come back in data[] or in data.records[]; both are read, and --check records which.
export function rowsOf(resp) {
  if (resp && Array.isArray(resp.data)) return resp.data;
  if (resp && resp.data && Array.isArray(resp.data.records)) return resp.data.records;
  throw new VendorError(`Gainsight query reply has neither data[] nor data.records[] (top-level keys: ${resp && typeof resp === 'object' ? Object.keys(resp).join(', ') : typeof resp})`);
}
export const rowsShape = (resp) => (resp && Array.isArray(resp.data) ? 'data' : 'data.records');

const str = (v) => (v === undefined || v === null || v === '' ? null : String(v));
const num = (v) => { if (v === undefined || v === null || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };

export function toAccount(r, fm = {}, gm = {}, contacts = new Map()) {
  const val = (k) => (fm[k] ? r[fm[k]] : undefined);
  const arr = num(val('arr'));
  const gsid = String(r[ID_FIELD]);
  return {
    gainsightId: gsid, name: String(r[NAME_FIELD]),
    tier: str(val('tier')), arr: arr !== null && arr >= 0 ? arr : null, renewalDate: str(val('renewalDate')),
    csmOwner: str(val('csmOwner')), healthScore: num(val('healthScore')),
    contacts: contacts.get(gsid) || [],
    // accounts.json requires booleans. A gate is true only when a mapped tenant field is exactly true; the tracker offers a gate only on true.
    gates: Object.fromEntries(GATE_KEYS.map((k) => [k, !!gm[k] && r[gm[k]] === true])),
    openCtas: [], // no CTA list query is in the research (UNCONFIRMED); the tracker does not read openCtas today
  };
}

export function create(cfg = {}, deps = {}) {
  const dir = resolveStateDir(deps.stateDir);
  const pace = pacer(MIN_INTERVAL_MS, deps.sleep);
  const pageLimit = deps.pageLimit || PAGE_LIMIT;
  const apiBase = String(cfg.apiBaseUrl || cfg.appUrl || '').replace(/\/+$/, '');
  const tokens = deps.tokenSource || createTokenSource({ cfg, fetchImpl: deps.fetchImpl, tokensPath: join(dir, FILES.tokens), now: deps.now });

  async function api(method, path, body) {
    if (!apiBase) throw new Error('gainsight-rest is not configured (missing gainsight.apiBaseUrl); run node connector/server.mjs --setup');
    const access = await tokens.accessToken(); // a rotated refresh token is already on disk here (T-6)
    await pace();
    // CONFIRMED header form (Q7). Whether every endpoint accepts a bearer token is UNCONFIRMED (Q7 note); --check finds out.
    return requestJson({ fetchImpl: deps.fetchImpl || globalThis.fetch, method, url: apiBase + path,
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body,
      secrets: [access, cfg.oauth && cfg.oauth.clientSecret], host: 'Gainsight' });
  }
  async function queryAll(object, select) {
    const out = [];
    for (let offset = 0; ; offset += pageLimit) {
      // UNCONFIRMED: whether `where` may be left out (Q8 shows it in the example); --check finds out.
      const rows = rowsOf(await api('POST', QUERY_PATH + encodeURIComponent(object), { select, limit: pageLimit, offset }));
      out.push(...rows);
      if (rows.length < pageLimit) return out;
    }
  }
  async function listContacts() {
    const q = cfg.contactQuery || {};
    const byCompany = new Map();
    if (!q.object || !q.companyField || !q.nameField) return byCompany; // UNCONFIRMED object (Q9): off until configured
    const select = [...new Set([q.companyField, q.nameField, q.emailField, q.roleField].filter(Boolean))];
    for (const r of await queryAll(q.object, select)) {
      const k = r[q.companyField];
      if (!k) continue;
      const list = byCompany.get(String(k)) || [];
      list.push({ name: String(r[q.nameField] ?? ''), email: q.emailField && r[q.emailField] ? String(r[q.emailField]) : null, role: q.roleField && r[q.roleField] ? String(r[q.roleField]) : null });
      byCompany.set(String(k), list);
    }
    return byCompany;
  }
  async function listAccounts() {
    const fm = cfg.fieldMap || {};
    const gm = cfg.gateFieldMap || {};
    const mapped = (m, keys) => keys.map((k) => String(m[k] || '').trim()).filter(Boolean);
    const select = [...new Set([ID_FIELD, NAME_FIELD, ...mapped(fm, FIELD_KEYS), ...mapped(gm, GATE_KEYS)])];
    const rows = await queryAll('Company', select);
    const contacts = await listContacts();
    return rows.filter((r) => r && r[ID_FIELD] && r[NAME_FIELD]).map((r) => toAccount(r, fm, gm, contacts));
  }

  return {
    get name() { return healthName('gainsight-rest', { proven: isProven(loadProof(dir), 'gainsight', 'read', tenantOf('gainsight', cfg)), dryRun: cfg.dryRun !== false }); },
    listAccounts,
    async push() { throw new Error('gainsight-rest: push is not built yet (connect-ready T-8)'); },
  };
}
