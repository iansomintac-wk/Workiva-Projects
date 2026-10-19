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
