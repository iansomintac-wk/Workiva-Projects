// Real Gainsight CS adapter (connect-ready §3.3). Tested on recorded-shape fixtures only; unproven until `--check`
// passes against the configured tenant. Node built-ins only; fetch is injected (deps.fetchImpl) or the global one.
import { join } from 'node:path';
import { appendFileSync } from 'node:fs';
import { requestJson, pacer, pick, VendorError } from '../lib/vendor-http.mjs';
import { loadProof, isProven, tenantOf, sameTenant, healthName, resolveStateDir, readJson, writeJsonAtomic, FILES } from '../lib/state.mjs';
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

// CONFIRMED https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs/Timeline_API/Timeline_APIs (research Q10)
export const TIMELINE_PATH = '/v1/ant/es/activity';
// CONFIRMED https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Cockpit_API/Call_To_Action_(CTA)_API_Documentation (research Q12)
export const CTA_PATH = '/v2/cockpit/cta';
// CONFIRMED (research-write-safety.md, Timeline page): a repeated ExternalId is rejected with GS_TL_10_0107.
// Where the code sits in the reply is UNCONFIRMED, so the whole reply body is searched.
const DUPLICATE_EXTERNAL_ID = 'GS_TL_10_0107';
export const DRY_RUN_ERROR = 'dry run: not sent; see connector/dry-run.jsonl';
export const SUCCESS_PLAN_BLOCKED = 'not sent: Success Plan objectives are not built yet (adding an objective to an existing Success Plan is unconfirmed in Gainsight\'s docs); update it by hand in Gainsight';
export const TIMELINE_KINDS = new Set(['Pending items batch', 'Success Outcome Plan']); // D1

function need(cfg, paths) {
  for (const p of paths) {
    const v = p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), cfg);
    if (!String(v || '').trim()) throw new Error(`config gainsight.${p} is empty; see connector/CONNECT-GAINSIGHT.md`);
  }
}
// CONFIRMED pattern "yyyy-MM-dd'T'HH:mm:ss.SSSZ" (Q10). Rendering Java's Z as +0000 is UNCONFIRMED.
const gsDate = (d) => d.toISOString().replace('Z', '+0000');
function notesFor(it) {
  const f = it.fields || {};
  if (it.kind === 'Pending items batch') return ['Pending items from the OSM tracker:', ...(f.gates || []).map((g) => `- ${g.gainsightAction || g.gateKey}`)].join('\n');
  if (it.kind === 'Success Outcome Plan') return ['Success outcomes from the OSM tracker:', ...(f.outcomes || []).map((o) => `- ${o}`)].join('\n');
  return '';
}

export function buildRequest(it, cfg, now) {
  const ref = it.customerRef || {};
  const f = it.fields || {};
  const prefix = f.subjectPrefix ? `${f.subjectPrefix} ` : '';
  if (TIMELINE_KINDS.has(it.kind)) {
    need(cfg, ['timeline.typeName', 'authorEmail']);
    return {
      kind: 'timeline', method: 'POST', path: TIMELINE_PATH,
      body: {
        // Required: ExternalId, Author, ContextName, TypeName, Subject (max 255), Notes (~131,000), ActivityDate, context id via lookup. CONFIRMED (Q10).
        records: [{ ContextName: 'Company', TypeName: cfg.timeline.typeName, ExternalId: it.id,
          Subject: `${prefix}${it.kind}: ${ref.name}`.slice(0, 255), Notes: notesFor(it).slice(0, 131000),
          ActivityDate: gsDate(now), Author: cfg.authorEmail, companyName: ref.name }],
        lookups: {
          AuthorId: { objectName: 'GsUser', fields: { Author: 'Email' }, lookupField: 'Gsid', multiMatchOption: 'FIRSTMATCH', onNoMatch: 'ERROR' }, // CONFIRMED (Q10)
          // objectName/fields/lookupField CONFIRMED (Q10); the two match options are UNCONFIRMED here (copied from AuthorId).
          GsCompanyId: { objectName: 'Company', fields: { companyName: 'Name' }, lookupField: 'Gsid', multiMatchOption: 'FIRSTMATCH', onNoMatch: 'ERROR' },
        },
      },
      // CONFIRMED (Q10): {"data":{"success":{"<externalId>":[{"activityId":"<GSID>"}]}}}
      idFrom: (resp) => { const s = resp && resp.data && resp.data.success && resp.data.success[it.id]; return s && s[0] && s[0].activityId ? String(s[0].activityId) : it.id; },
    };
  }
  if (it.kind === 'At-Risk CTA') {
    need(cfg, ['cta.type', 'cta.companyIdField', 'authorEmail']);
    if (!ref.gainsightId) throw new Error('this customer has no Gainsight id in the tracker; link it before sending a CTA');
    return {
      kind: 'cta', method: 'POST', path: CTA_PATH,
      // Mandatory: referenceId, Name, type (name), owner, company. CONFIRMED (Q12). The company field's name is
      // config (cta.companyIdField). reason and severity need picklist ids (UNCONFIRMED), so they are not sent.
      body: { requests: [{ record: { referenceId: it.id, Name: `${prefix}${f.ctaName || `At-risk: ${ref.name}`}`.slice(0, 255), type: cfg.cta.type,
        OwnerEmail: cfg.authorEmail, [cfg.cta.companyIdField]: ref.gainsightId } }] },
      // UNCONFIRMED (gap 2): where the Gsid sits in the reply; cta.idPath names it once --check --write has seen one.
      idFrom: (resp) => { const v = cfg.cta.idPath ? pick(resp, cfg.cta.idPath) : null; return v == null ? null : String(v); },
    };
  }
  if (it.kind === 'Success Plan objective') throw new Error(SUCCESS_PLAN_BLOCKED); // blocker B1 (Ian ruled (a))
  throw new Error(`unknown queue kind: ${it.kind}`);
}

export function create(cfg = {}, deps = {}) {
  const now = deps.now || (() => new Date());
  const tenant = tenantOf('gainsight', cfg);
  const fail = (it, error) => ({ id: it.id, status: 'failed', externalId: null, error });
  const sentOk = (it, externalId) => ({ id: it.id, status: 'sent', externalId, error: null });
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

  function appendDryRun(it, req) {
    const line = { at: now().toISOString(), itemId: it.id, kind: it.kind, method: req.method, url: apiBase + req.path,
      headers: { Authorization: 'Bearer [redacted]', 'Content-Type': 'application/json' }, body: req.body };
    appendFileSync(join(dir, FILES.dryRun), `${JSON.stringify(line)}\n`);
  }
  async function sendOne(it, req, record) {
    let externalId;
    try { externalId = req.idFrom(await api(req.method, req.path, req.body)); }
    catch (e) {
      if (req.kind === 'timeline' && JSON.stringify((e && e.body) || '').includes(DUPLICATE_EXTERNAL_ID)) externalId = it.id;
      else return fail(it, e.message);
    }
    record[it.id] = { externalId, kind: it.kind, tenant, at: now().toISOString() };
    try { writeJsonAtomic(join(dir, FILES.sent), record); }
    catch (e) { console.error(`gainsight-rest: item ${it.id} was sent but ${join(dir, FILES.sent)} could not be written (${e.code || e.message}); a repeat Send could duplicate it`); }
    return sentOk(it, externalId);
  }
  async function push(items) {
    const record = readJson(join(dir, FILES.sent), {});
    const dry = cfg.dryRun !== false; // CR2: dry-run is the default
    const results = [];
    for (const it of items) {
      const prior = record[it.id];
      if (prior && sameTenant(prior.tenant, tenant)) { results.push(sentOk(it, prior.externalId)); continue; } // CR3
      let req;
      try { req = buildRequest(it, cfg, now()); } catch (e) { results.push(fail(it, e.message)); continue; }
      if (dry) { appendDryRun(it, req); results.push(fail(it, DRY_RUN_ERROR)); continue; }
      // T-9: write gate
      results.push(await sendOne(it, req, record));
    }
    return results;
  }

  return {
    get name() { return healthName('gainsight-rest', { proven: isProven(loadProof(dir), 'gainsight', 'read', tenantOf('gainsight', cfg)), dryRun: cfg.dryRun !== false }); },
    listAccounts,
    push,
  };
}
