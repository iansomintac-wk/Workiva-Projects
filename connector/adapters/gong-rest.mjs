// Real Gong adapter (connect-ready §3.3). Tested on recorded-shape fixtures only; unproven until `--check` passes
// against the configured tenant. Node built-ins only; fetch is injected (deps.fetchImpl) or the global one.
import { requestJson, pacer } from '../lib/vendor-http.mjs';
import { loadProofSafe, isProven, tenantOf, healthName } from '../lib/state.mjs';

// CONFIRMED https://help.gong.io/apidocs/retrieve-detailed-call-data-by-various-filters-v2callsextensive-2.md (research Q2)
export const EXTENSIVE_PATH = '/v2/calls/extensive';
// CONFIRMED https://help.gong.io/apidocs/retrieve-transcripts-of-calls-by-date-or-callids-v2callstranscript-2.md (research Q3)
export const TRANSCRIPT_PATH = '/v2/calls/transcript';
// CONFIRMED (Q2): parties come back only with exposedFields.parties; Gong's AI brief is content.brief.
export const CONTENT_SELECTOR = { context: 'None', exposedFields: { parties: true, content: { brief: true } } };
// CONFIRMED (Q2): affiliation is Internal | External | Unknown; the contract says internal | customer | unknown.
const AFFILIATION = { Internal: 'internal', External: 'customer', Unknown: 'unknown' };
// CONFIRMED https://help.gong.io/apidocs/introduction-2.md (research Q4): 3 calls a second.
const MIN_INTERVAL_MS = 334;
const DEFAULT_SINCE_DAYS = 30; // spec §3.3
const DAY_MS = 86400000;
const REQUIRED = ['baseUrl', 'accessKey', 'accessKeySecret', 'myEmail'];

// CONFIRMED 2026-10-03 on https://help.gong.io/apidocs/retrieve-detailed-call-data-by-various-filters-v2callsextensive-2.md
// (research Q2b): 404 "No calls found for the specified period", body {requestId, errors: [string]}. An empty window is
// this 404, so it means "no calls". Recognised narrowly: status 404, JSON object, errors an array with that text.
// Any other 404 (wrong base URL, HTML, other message) is still an error.
export function isNoCalls404(e) {
  const errs = e && e.status === 404 && e.body && typeof e.body === 'object' ? e.body.errors : null;
  return Array.isArray(errs) && errs.some((m) => /no calls found/i.test(String(m)));
}

export function mapCall(c, me) {
  const parties = Array.isArray(c && c.parties) ? c.parties : [];
  if (!parties.some((p) => String(p.emailAddress || '').trim().toLowerCase() === me)) return null; // not Ian's call
  // UNCONFIRMED: metaData field names come from the GET /v2/calls page (Q1); the extensive summary did not list them.
  const md = (c && c.metaData) || {};
  if (!md.id || !md.url || !md.started || Number.isNaN(Date.parse(md.started))) return false;
  const brief = c.content && c.content.brief; // key CONFIRMED (Q2); type UNCONFIRMED, so only a string is used
  return {
    callId: String(md.id), kind: 'call', url: String(md.url),
    startedAt: new Date(md.started).toISOString(),
    durationSec: Math.max(0, Math.round(Number(md.duration) || 0)),
    title: String(md.title || ''),
    participants: parties.map((p) => ({
      name: String(p.name || p.emailAddress || 'Unknown'),
      email: p.emailAddress ? String(p.emailAddress).toLowerCase() : null,
      affiliation: AFFILIATION[p.affiliation] || 'unknown',
    })),
    // The shape of Gong's CRM context is not in the research (UNCONFIRMED): the tracker matches by name and participant email.
    accountRef: { gainsightId: null, name: null },
    summary: typeof brief === 'string' ? brief : '',
    transcript: '', // CR4: transcripts stay off until Ian's I-2 choice
  };
}

export function create(cfg = {}, deps = {}) {
  const now = deps.now || (() => new Date());
  const pace = pacer(MIN_INTERVAL_MS, deps.sleep);
  const base = String(cfg.baseUrl || '').replace(/\/+$/, '');
  const basic = cfg.accessKey && cfg.accessKeySecret ? Buffer.from(`${cfg.accessKey}:${cfg.accessKeySecret}`).toString('base64') : '';
  const secrets = [cfg.accessKey, cfg.accessKeySecret, basic];
  const me = String(cfg.myEmail || '').trim().toLowerCase();

  async function post(path, body) {
    const missing = REQUIRED.filter((k) => !String(cfg[k] || '').trim());
    if (missing.length) throw new Error(`gong-rest is not configured (missing gong.${missing.join(', gong.')}); run node connector/server.mjs --setup`);
    await pace();
    // CONFIRMED (Q4): Authorization: Basic base64(accessKey:accessKeySecret).
    try {
      return await requestJson({ fetchImpl: deps.fetchImpl || globalThis.fetch, method: 'POST', url: base + path,
        headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' }, body, secrets, host: 'Gong' });
    } catch (e) {
      // An empty window is not an error (F1), but only the documented reply counts: extensive path, 404, JSON body.
      if (path === EXTENSIVE_PATH && isNoCalls404(e)) return { calls: [], noCalls: true };
      throw e;
    }
  }
  async function eachPage(path, filter, extra, onPage) {
    let cursor;
    do {
      const page = (await post(path, { ...(cursor ? { cursor } : {}), filter, ...extra })) || {};
      onPage(page);
      cursor = page.records && page.records.cursor; // CONFIRMED (Q1-Q3): records.cursor; absent on the last page
    } while (cursor);
  }
  function windowFor(since) {
    const to = now();
    const from = since ? new Date(since) : new Date(to.getTime() - DEFAULT_SINCE_DAYS * DAY_MS);
    return { fromDateTime: from.toISOString(), toDateTime: to.toISOString() }; // CONFIRMED (Q1): both dates required
  }
  async function listCalls({ since } = {}) {
    const out = [];
    let skipped = 0;
    await eachPage(EXTENSIVE_PATH, windowFor(since), { contentSelector: CONTENT_SELECTOR }, (page) => {
      for (const c of page.calls || []) {
        const r = mapCall(c, me);
        if (r === false) skipped++; else if (r) out.push(r);
      }
    });
    if (skipped) console.warn(`gong-rest: ${skipped} call(s) skipped: no id, url or start time in Gong's reply`);
    return out;
  }

  return {
    get name() { return healthName('gong-rest', { proven: isProven(loadProofSafe(deps.stateDir), 'gong', 'read', tenantOf('gong', cfg)) }); },
    listCalls,
    // --measure-transcripts: characters per call for my calls in the window. Stores nothing, returns no text.
    // CONFIRMED (Q3): no length field; length = sum of sentences[].text lengths over every monologue.
    async transcriptLengths({ since } = {}) {
      const ids = (await listCalls({ since })).map((c) => c.callId);
      if (!ids.length) return { calls: 0, lengths: [], noTranscript: 0 };
      const wanted = new Set(ids);
      // T-14 F18: only calls Gong returned a transcript for are measured. An id Gong did not return (not transcribed,
      // or left out) is counted apart, never as 0 characters, so it does not pull the median down.
      const lengths = new Map();
      await eachPage(TRANSCRIPT_PATH, { ...windowFor(since), callIds: ids }, {}, (page) => {
        for (const t of page.callTranscripts || []) {
          const id = String(t.callId);
          if (!wanted.has(id)) continue;
          let n = lengths.get(id) || 0;
          for (const mono of t.transcript || []) for (const s of mono.sentences || []) n += String(s.text || '').length;
          lengths.set(id, n);
        }
      });
      return { calls: ids.length, lengths: [...lengths.values()], noTranscript: ids.length - lengths.size };
    },
    // --check: the smallest read, one page of the last 24 hours, returned as Gong sent it.
    async probe() { return (await post(EXTENSIVE_PATH, { filter: windowFor(new Date(now().getTime() - DAY_MS).toISOString()), contentSelector: CONTENT_SELECTOR })); },
  };
}
