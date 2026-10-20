// Synthetic CSAT fixtures. Every ID and name is invented; nothing here comes from a real export.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const htmlPath = () => process.env.CSAT_HTML_PATH || fileURLToPath(new URL('../../osm-book-of-business-tracker-1.1.html', import.meta.url));
export const htmlLF = () => readFileSync(htmlPath(), 'utf8').replace(/\r\n/g, '\n');
export const J = v => JSON.parse(JSON.stringify(v));
export function fnSource(t, name) {
  const i = t.indexOf(`function ${name}(`);
  if (i < 0) throw new Error(`function ${name}( is absent from 1.1`);
  const start = t.slice(i - 6, i) === 'async ' ? i - 6 : i;
  const first = t.slice(i, t.indexOf('\n', i));
  const o = (first.match(/\{/g) || []).length, c = (first.match(/\}/g) || []).length;
  if (o > 0 && o === c && /\}\s*$/.test(first)) return t.slice(start, i + first.length);
  const j = t.indexOf('\n}\n', i);
  if (j < 0) throw new Error(`closing brace of ${name} not found`);
  return t.slice(start, j + 2);
}
export const grab = name => fnSource(htmlLF(), name);
export function grabConst(name) {
  const m = htmlLF().match(new RegExp(`^const ${name} = .*;$`, 'm'));
  if (!m) throw new Error(`const ${name} = ...; (one line, no trailing comment) is absent from 1.1`);
  return m[0];
}
export function loadCsat(fnNames, constNames = [], extra = {}) {
  const ctx = vm.createContext({ ...extra });
  vm.runInContext([...constNames.map(grabConst), ...fnNames.map(grab)].join('\n'), ctx);
  return ctx;
}
export const PLAN_FNS = ['parseCsv', 'localDateISO', 'isRealISODate', 'csatDateChangeOk', 'csatSentOk', 'buildCsatImportPlan', 'csatIdsMatch', 'csatDecide', 'csatChangesFor', 'normalizeCustomerNameKey', 'applyCsatImportPlan'];
export const PLAN_CONSTS = ['ISO_DATE_RE', 'CSAT_SKIP_IDS', 'CSAT_COLS'];
export const SKIP_ID = '0014000000YgdVaAAJ';
export const HEADER = ['SALESFORCE_ACCOUNT_ID', 'GAINSIGHT_COMPANY_ID', 'COMPANY_NAME', 'CSAT_SENT_DATE', 'CSAT_ANSWERED_DATE'];
export const sf = n => '001FAKE' + String(n).padStart(8, '0') + 'AAA';   // 18 chars
export const gs = n => '1I00FAKE' + String(n).padStart(28, '0');         // 36 chars
const cust = (id, name, extra = {}) => ({ id, name, salesforceId: '', gainsightId: '', compliance: { associatedPeopleCSAT: { done: false, date: null, contactName: '', surveySentOn: null, surveyAnsweredOn: null } }, ...extra });
/* 211 data rows: n = 0..209 ordinary + the test-account row = 211. Rows n < 54 have an answered date (54 rows).
   Customers (145 in all): c0, c3, c4, c5, c8..c139 = 136 matched (c3 stores a 15-char ID; c4 stores sf(4) in gainsightId;
   c5 stores gs(5)); c6a + c6b share sf(6) (2, ambiguous); cAcmeInc + cAcmeLlc have empty IDs (2, suggestions for rows n=1 and n=2);
   5 "Runway Only" accounts are not in the file (5). Row n=7, rows n=140..209 (70) and rows n=1, n=2 have no ID match = 73 unmatched.
   Dates that would change: 136 sent + 50 answered (matched rows with n < 54: 0,3,4,5,8..53 = 50) = 186. */
export function makeFixture() {
  const rows = [];
  for (let n = 0; n < 210; n++) {
    const name = n === 1 ? 'Acme Holdings, Inc.' : n === 2 ? 'Acme Holdings, LLC' : `Fake Co ${n}`;
    rows.push([sf(n), gs(n), name, '2026-09-01', n < 54 ? '2026-09-10' : '']);
  }
  rows.push([SKIP_ID, gs(999), 'WF Test', '2026-09-01', '']);
  const customers = [];
  for (const n of [0, 3, 4, 5, ...Array.from({ length: 132 }, (_, k) => k + 8)]) {
    const e = n === 3 ? { salesforceId: sf(3).slice(0, 15) } : n === 4 ? { gainsightId: sf(4) } : n === 5 ? { gainsightId: gs(5) } : { salesforceId: sf(n) };
    customers.push(cust('c' + n, `Runway ${n}`, e));
  }
  customers.push(cust('c6a', 'Runway 6a', { salesforceId: sf(6) }), cust('c6b', 'Runway 6b', { salesforceId: sf(6) }));
  customers.push(cust('cAcmeInc', 'Acme Holdings, Inc.'), cust('cAcmeLlc', 'Acme Holdings, LLC'));
  for (let k = 0; k < 5; k++) customers.push(cust('cOnly' + k, `Runway Only ${k}`, { salesforceId: '001ONLY' + String(k).padStart(8, '0') + 'AAA' }));
  return { table: [HEADER, ...rows], customers };
}

export const NET_RE = /\b(fetch|XMLHttpRequest|sendBeacon|WebSocket)\b/;
export function csatFnNames(src) {
  return [...new Set([...src.matchAll(/^(?:async )?function ((?:csat|buildCsat|applyCsat|commitCsat|openCsat|handleCsat|renderCsat|bindCsat)\w*)\(/gm)].map(m => m[1]))];
}
export function networkHits(src, names = csatFnNames(src)) {
  return names.filter(n => NET_RE.test(fnSource(src, n)));
}
