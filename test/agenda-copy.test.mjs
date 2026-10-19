import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lf = readFileSync(new URL('../osm-book-of-business-tracker-1.1.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
function grab(name) {
  const i = lf.indexOf(`function ${name}(`);
  assert.ok(i >= 0, `function ${name}( is absent from 1.1`);
  const first = lf.slice(i, lf.indexOf('\n', i));
  const opens = (first.match(/\{/g) || []).length, closes = (first.match(/\}/g) || []).length;
  if (opens > 0 && opens === closes && /\}\s*$/.test(first)) return first;
  const j = lf.indexOf('\n}\n', i);
  assert.ok(j >= 0, `closing of ${name} not found`);
  return lf.slice(i, j + 2);
}
const FNS = ['localDateISO', 'getCommitments', 'openCommitments', 'commitmentIsOverdue', 'commitmentDueSoon', 'calendarDayOrdinal', 'calendarDayDiff', 'daysSince', 'rankedPromises', 'isRealISODate', 'escapeHtml', 'escapeAttr', 'getOpenThreads', 'unresolvedThreads', 'collectOpenQuestions', 'beatAgendaItems', 'beatAgendaText', 'beatAgendaSection'];
// Real stored thread shape (normalizeOpenThread): the question is .q, collectOpenQuestions returns {thread: <that>}.
const T = (q, resolvedOn) => ({ id: 't' + q, q, a: null, answeredOn: null, resolvedOn: resolvedOn || null });
function ctxFor(acts) {
  const ctx = vm.createContext({});
  const iso = lf.match(/^const ISO_DATE_RE = .*$/m);
  assert.ok(iso, 'ISO_DATE_RE line not found');
  vm.runInContext(`var COMMITMENT_SOON_DAYS = 3; function todayISO(){ return '2026-10-21'; }\n${iso[0]}\n` + FNS.map(grab).join('\n'), ctx);
  vm.runInContext(`var DATA = {activities: {c1: ${JSON.stringify(acts)}}};`, ctx);
  return ctx;
}
const ACTS = [
  { id: 'a1', date: '2026-10-01', openThreads: [T('old q')] },
  { id: 'a2', date: '2026-10-14', openThreads: [T('Q new'), T('Q done', '2026-10-15')] }];
const c = { id: 'c1', name: 'Orion', commitments: [
  { id: 'p1', text: 'Send mapping doc', direction: 'i_owe', due: '2026-10-20', doneOn: null },
  { id: 'p2', text: 'Priya confirms owners', direction: 'they_owe', due: '2026-10-30', doneOn: null },
  { id: 'p3', text: 'Late file', direction: 'they_owe', due: '2026-10-10', doneOn: null }] };
const P = [{ label: 'Data file', date: '2026-10-14' }];

test('setup does not throw', () => { assert.doesNotThrow(() => ctxFor(ACTS)); });
test('agenda items: overdue promises (oldest first), open questions of the newest call only, then the next checklist step', () => {
  assert.deepEqual(Array.from(ctxFor(ACTS).beatAgendaItems(c, P)),
    ['They owe: Late file', 'You owe: Send mapping doc', 'Open question: Q new', 'Next step: Data file']);
});
test('agenda items empty with nothing overdue, open or pending; the section is then the empty string', () => {
  const x = ctxFor([]), e = { id: 'c1', name: 'Orion', commitments: [] };
  assert.deepEqual(Array.from(x.beatAgendaItems(e, [])), []);
  assert.equal(x.beatAgendaSection(e, []), '');
});
test('agenda text is plain: starts "Agenda - Orion\n1. ", no HTML, raw characters not escaped', () => {
  const x = ctxFor(ACTS), cc = { ...c, name: 'A & B <x>' };
  const t = x.beatAgendaText(cc, ['They owe: R&D <file>', 'Next step: y']);
  assert.equal(t, 'Agenda - A & B <x>\n1. They owe: R&D <file>\n2. Next step: y');
});
test('agenda section: escaped, has data-beat-agenda, an <ol>, and one copy button with the escaped id', () => {
  const x = ctxFor(ACTS), cc = { ...c, id: 'c"1' };
  const h = x.beatAgendaSection(cc, [{ label: '<b>Z</b>', date: '2026-10-14' }]);
  assert.ok(h.includes('data-beat-agenda') && h.includes('<ol'));
  assert.ok(!h.includes('<b>Z</b>') && h.includes('&lt;b&gt;Z'));
  assert.equal((h.match(/data-beat-agenda-copy=/g) || []).length, 1);
  assert.ok(h.includes('data-beat-agenda-copy="c&quot;1"') || h.includes('data-beat-agenda-copy="c&#34;1"') || !h.includes('data-beat-agenda-copy="c"1"'));
  assert.ok(h.includes('aria-label="Copy agenda'));
});
test('renderBeatPrep puts the agenda right under the Call prep heading, before Last transcript and Pending deliverables', () => {
  const x = ctxFor(ACTS);
  vm.runInContext(['fmtDate', 'closingStretch', 'beatTranscriptSection', 'promiseCue', 'beatPromisesSection', 'renderBeatPrep'].map(grab).join('\n') +
    `\nfunction fmtDayTime(){return ''} function getNextSessionTime(){return ''} function isLoggedPastDate(){return false} function activityTranscript(){return null}`, x);
  const h = x.renderBeatPrep({ call: { c, at: null, next: null, prepped: false } });
  const a = h.indexOf('data-beat-agenda'), p = h.indexOf('Pending deliverables'), hd = h.indexOf('Call prep');
  assert.ok(hd >= 0 && a > hd && a < p, `order ${hd} ${a} ${p}`);
});
test('shape only: the Copy click is wired', () => {
  assert.ok(lf.includes('copyToClipboard(beatAgendaText(') && lf.includes('data-beat-agenda-copy'));
});
