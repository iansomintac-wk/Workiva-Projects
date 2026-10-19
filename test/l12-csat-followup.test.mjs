import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const lf = readFileSync(new URL('../osm-book-of-business-tracker-1.1.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
export function grab(name) {
  const i = lf.indexOf(`function ${name}(`);
  assert.ok(i >= 0, `function ${name}( is absent from 1.1`);
  const first = lf.slice(i, lf.indexOf('\n', i));
  const o = (first.match(/\{/g) || []).length, c = (first.match(/\}/g) || []).length;
  if (o > 0 && o === c && /\}\s*$/.test(first)) return first;
  const j = lf.indexOf('\n}\n', i); assert.ok(j >= 0);
  return lf.slice(i, j + 2);
}
const BASE = ['calendarDayOrdinal', 'calendarDayDiff', 'daysSince'];
function ctxFor(today = '2026-10-21', fns = []) {
  const k = lf.match(/^const CSAT_FOLLOWUP_DAYS = 7;.*$/m);
  assert.ok(k, 'const CSAT_FOLLOWUP_DAYS = 7; must be one named constant');
  const ctx = vm.createContext({});
  vm.runInContext(`${k[0]}
    function todayISO(){ return '${today}'; }
    function isRealISODate(d){ return /^\\d{4}-\\d{2}-\\d{2}$/.test(d || '') && !isNaN(new Date(d + 'T00:00:00')); }
    function fmtDate(d){ return 'D:' + d; }
    var TODAY_SOURCE_MAP = {csat_unanswered: {severity: 2, why: 'w'}};`, ctx);
  vm.runInContext([...BASE, ...fns].map(grab).join('\n'), ctx);
  return ctx;
}
const acct = (ap, stage = 'graduated') => ({ id: 'a1', name: 'Test Co', stage, compliance: { associatedPeopleCSAT: ap } });
const J = x => JSON.parse(JSON.stringify(x));

test('L12 csatSurveyOverdue: due at exactly 7 days, not at 6, not once answered, not without a real sent date', () => {
  const { csatSurveyOverdue: f } = ctxFor('2026-10-21', ['csatSurveyOverdue']);
  assert.deepEqual(J(f(acct({ surveySentOn: '2026-10-14', surveyAnsweredOn: null }))), { sentOn: '2026-10-14', days: 7 });
  assert.equal(f(acct({ surveySentOn: '2026-10-15', surveyAnsweredOn: null })), null);
  assert.equal(f(acct({ surveySentOn: '2026-10-01', surveyAnsweredOn: '2026-10-03' })), null);
  for (const v of [null, undefined, 'soon']) assert.equal(f(acct({ surveySentOn: v })), null);
  assert.equal(f({ id: 'x' }), null);
});
test('L12 normalizeCsatBlock: old block gains two null dates, keeps its own fields, bad dates clear to null', () => {
  const { normalizeCsatBlock: n } = ctxFor('2026-10-21', ['normalizeCsatBlock']);
  assert.deepEqual(J(n({ done: true, date: '2026-10-01', contactName: 'Dana' })), { done: true, date: '2026-10-01', contactName: 'Dana', surveySentOn: null, surveyAnsweredOn: null });
  const b = J(n({ done: false, date: null, contactName: '', surveySentOn: '2026-10-14', surveyAnsweredOn: 'nope' }));
  assert.equal(b.surveySentOn, '2026-10-14'); assert.equal(b.surveyAnsweredOn, null);
});
test('L12 defaultCompliance, migration and import validation all carry the two dates (shape only; Task 2 check proves an old book really loads)', () => {
  assert.match(grab('defaultCompliance'), /surveySentOn:null, surveyAnsweredOn:null/);
  assert.ok(lf.includes('c.compliance.associatedPeopleCSAT = normalizeCsatBlock(c.compliance.associatedPeopleCSAT)'));
  assert.ok(/complianceDates = \[[^\]]*associatedPeopleCSAT\.surveySentOn[^\]]*associatedPeopleCSAT\.surveyAnsweredOn/.test(lf));
});
test('L12 pushCsatFollowUp: one csat_unanswered row, severity from the map, and it runs BEFORE the graduated early return', () => {
  const { pushCsatFollowUp: p } = ctxFor('2026-10-21', ['csatSurveyOverdue', 'pushCsatFollowUp']);
  const out = []; p(acct({ surveySentOn: '2026-10-14' }), out);
  assert.equal(out.length, 1); assert.equal(out[0].source, 'csat_unanswered'); assert.equal(out[0].severity, 2);
  assert.match(out[0].headline, /CSAT survey sent D:2026-10-14 and not answered/); assert.match(out[0].reasons[0], /7 days/);
  const none = []; p(acct({ surveySentOn: '2026-10-20' }), none); assert.equal(none.length, 0);
  assert.match(lf, /\{source:'csat_unanswered', severity:2,/);
  const t = grab('todayAccountCandidates');
  assert.ok(t.indexOf('pushCsatFollowUp(c, out)') >= 0 && t.indexOf('pushCsatFollowUp(c, out)') < t.indexOf("if(c.stage === 'graduated') return out;"));
});
test('L12 invariant: nothing new in the Gainsight export or queue (passes on the parent already; guards against drift)', () => {
  for (const n of ['gainsightItemText', 'getGainsightQueue', 'queueGainsightItem']) assert.ok(!/survey(Sent|Answered)/.test(grab(n)), n);
});

test('L12 csatDatesHtml: two labelled date inputs, values and ids escaped', () => {
  const ctx = ctxFor('2026-10-21', ['escapeHtml', 'escapeAttr', 'csatDatesHtml']);
  const h = ctx.csatDatesHtml({ surveySentOn: '2026-10-14', surveyAnsweredOn: null }, 'a"b');
  assert.ok(h.includes('Survey sent') && h.includes('Answered'));
  assert.ok(h.includes('type="date"') && h.includes('data-fp-csat-sent="a&quot;b"') && h.includes('data-fp-csat-answered="a&quot;b"'));
  assert.ok(h.includes('value="2026-10-14"'));
  assert.equal((h.match(/value=""/g) || []).length, 1);
  assert.ok(lf.includes('${csatDatesHtml(ap, c.id)}'), 'the CSAT block must print it');
});

test('L12 surveysToChase: every overdue account (graduated too), oldest first, none when nothing is overdue', () => {
  const { surveysToChase: s } = ctxFor('2026-10-21', ['csatSurveyOverdue', 'surveysToChase']);
  const mk = (id, name, sent, ans = null, stage = 'graduated') => ({ id, name, stage, compliance: { associatedPeopleCSAT: { surveySentOn: sent, surveyAnsweredOn: ans } } });
  const out = J(s([mk('a', 'Alpha', '2026-10-14'), mk('b', 'Beta', '2026-10-10', null, 'live'), mk('c', 'Gamma', '2026-10-20'), mk('d', 'Delta', '2026-10-01', '2026-10-03')]));
  assert.deepEqual(out, [{ id: 'b', name: 'Beta', days: 11 }, { id: 'a', name: 'Alpha', days: 7 }]);
  assert.deepEqual(J(s([])), []);
});
test('L12 renderSurveysToChase: one line, escaped names, each opens its account, cap 5 then +N more, empty string when none, placed in renderToday outside the ranking', () => {
  const ctx = ctxFor('2026-10-21', ['csatSurveyOverdue', 'surveysToChase', 'renderSurveysToChase']);
  vm.runInContext(`function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); } function escapeAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }`, ctx);
  const mk = (n, name) => ({ id: 'i' + n, name, stage: 'graduated', compliance: { associatedPeopleCSAT: { surveySentOn: '2026-10-12', surveyAnsweredOn: null } } });
  const html = (list) => { ctx.L = list; return vm.runInContext('renderSurveysToChase(L)', ctx); };
  assert.equal(html([]), '');
  const one = html([mk(1, 'A<b>')]);
  assert.match(one, /Surveys to chase:/); assert.match(one, /data-open-cust="i1"/); assert.match(one, /A&lt;b>/); assert.doesNotMatch(one, /A<b>/);
  assert.match(one, /sent 9 days ago, no answer/); assert.match(one, /id="surveys-to-chase"/);
  const many = html([1, 2, 3, 4, 5, 6, 7].map(n => mk(n, 'N' + n)));
  assert.equal((many.match(/data-open-cust=/g) || []).length, 5); assert.match(many, /\+2 more/);
  const t = grab('renderToday');
  assert.ok(t.includes('renderSurveysToChase(DATA.customers)'));
  const first = t.indexOf('${renderSurveysToChase');
  assert.ok(first > 0 && first < t.indexOf('${renderDayStanding(day)}'), 'pinned line is before the day standing');
  assert.ok(t.slice(t.lastIndexOf('return `'), first).replace(/\s+/g, '') === 'return`<div>', 'pinned line is the first thing in the returned markup');
});

test('L12 F1: pinned line and CSAT row open the Details tab, which carries both date inputs and a wired handler', () => {
  assert.match(grab('renderSurveysToChase'), /data-open-tab="details"/);
  assert.match(grab('pushCsatFollowUp'), /panelTab:\s*'details'/);
  const d = grab('renderComplianceSection');
  assert.ok(d.includes('csatDatesHtml(ap, c.id)'), 'Details CSAT block prints csatDatesHtml');
  assert.ok(grab('bindCsatDateInputs').includes("['fpCsatSent', 'surveySentOn']"));
  assert.ok(lf.includes("bindCsatDateInputs(root);") && lf.includes("closest('.compliance-item'))"), 'both the pane and the Details tab bind it');
});

test('L12 S3: a typed year before 2000 is neither stored nor rendered', () => {
  const g = grab('csatDateChangeOk');
  const ctx = vm.createContext({});
  vm.runInContext(`function isRealISODate(d){ return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d || '') && !isNaN(new Date(d + 'T00:00:00')); }
${g}`, ctx);
  const ok = v => vm.runInContext(`csatDateChangeOk(${JSON.stringify(v)})`, ctx);
  assert.equal(ok('0002-10-14'), false); assert.equal(ok('1999-12-31'), false);
  assert.equal(ok('2026-10-14'), true); assert.equal(ok(''), true, 'clearing is allowed');
  assert.ok(lf.includes('csatDateChangeOk(inp.value)'));
});
