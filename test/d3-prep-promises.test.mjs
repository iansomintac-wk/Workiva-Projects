import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lf = readFileSync(new URL('../osm-book-of-business-tracker-1.1.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
// Source of one function declaration. Single-line functions are returned as that one line.
export function grab(name) {
  const i = lf.indexOf(`function ${name}(`);
  assert.ok(i >= 0, `function ${name}( is absent from 1.1`);
  const first = lf.slice(i, lf.indexOf('\n', i));
  const opens = (first.match(/\{/g) || []).length, closes = (first.match(/\}/g) || []).length;
  if (opens > 0 && opens === closes && /\}\s*$/.test(first)) return first;
  const j = lf.indexOf('\n}\n', i);
  assert.ok(j >= 0, `closing "\\n}\\n" of ${name} not found`);
  return lf.slice(i, j + 2);
}
const BASE = ['getCommitments', 'openCommitments', 'commitmentIsOverdue', 'commitmentDueSoon', 'calendarDayOrdinal', 'calendarDayDiff', 'daysSince'];
export function ctxFor(today = '2026-10-21', fns = ['rankedPromises']) {
  const ctx = vm.createContext({});
  vm.runInContext(`var COMMITMENT_SOON_DAYS = 3; function todayISO(){ return '${today}'; }
    function isRealISODate(d){ return /^\\d{4}-\\d{2}-\\d{2}$/.test(d || '') && !isNaN(new Date(d + 'T00:00:00')); }`, ctx);
  vm.runInContext([...BASE, ...fns].map(grab).join('\n'), ctx);
  return ctx;
}
export const K = (text, direction, due = null, doneOn = null) => ({ id: text, text, direction, due, doneOn });
// vm arrays have the vm realm's prototype; copy into this realm before a strict deepEqual.
const texts = r => Array.from(r.kept, x => x.text);

test('rankedPromises: overdue first (oldest due first), then dated by due date, then undated in stored order; done ones out; both directions', () => {
  const { rankedPromises } = ctxFor();
  const c = { commitments: [
    K('undated-1', 'they_owe'), K('dated-late', 'i_owe', '2026-11-02'), K('done-one', 'i_owe', '2026-10-01', '2026-10-05'),
    K('overdue-new', 'they_owe', '2026-10-20'), K('undated-2', 'i_owe'), K('dated-soon', 'they_owe', '2026-10-22'),
    K('overdue-old', 'i_owe', '2026-10-10'), K('weird-date', 'i_owe', 'soon-ish'), K('other-dir', 'someone', '2026-10-01')] };
  assert.deepEqual(texts(rankedPromises(c)), ['overdue-old', 'overdue-new', 'dated-soon', 'dated-late', 'undated-1']);
  assert.equal(rankedPromises(c).more, 2);          // undated-2 and weird-date (undated); done-one and other-dir are not open promises
});

test('rankedPromises: 7 open gives 5 kept and 2 more; cap argument respected; equal keys keep stored order', () => {
  const { rankedPromises } = ctxFor();
  const c = { commitments: Array.from({ length: 7 }, (_, i) => K('u' + i, i % 2 ? 'they_owe' : 'i_owe')) };
  const r = rankedPromises(c);
  assert.deepEqual(texts(r), ['u0', 'u1', 'u2', 'u3', 'u4']);
  assert.equal(r.more, 2);
  assert.deepEqual(texts(rankedPromises(c, 2)), ['u0', 'u1']);
  assert.equal(rankedPromises(c, 2).more, 5);
  assert.equal(rankedPromises(c, 0).kept.length, 5);
});

test("rankedPromises: the sim's Orion on 2026-10-21 (6 open) keeps both SIM-OWE rows and 1 more", () => {
  const { rankedPromises } = ctxFor('2026-10-21');
  const c = { commitments: [
    K('Send deficiency-field mapping doc', 'i_owe', '2026-10-20'), K('Priya to confirm Q3 walkthrough owners', 'they_owe', '2026-10-23'),
    K('SIM-OWE you owe the sandbox walkthrough', 'i_owe', '2026-10-23'), K('SIM-OWE they owe the data file', 'they_owe'),
    K('SIM-D6 you owe the recap deck', 'i_owe'), K('SIM-D6 they owe the access list', 'they_owe')] };
  const r = rankedPromises(c);
  assert.deepEqual(texts(r), ['Send deficiency-field mapping doc', 'Priya to confirm Q3 walkthrough owners', 'SIM-OWE you owe the sandbox walkthrough', 'SIM-OWE they owe the data file', 'SIM-D6 you owe the recap deck']);
  assert.equal(r.more, 1);
  assert.ok(texts(r).includes('SIM-OWE you owe the sandbox walkthrough') && texts(r).includes('SIM-OWE they owe the data file'));
});

test('rankedPromises: no commitments, null, and all-done give nothing', () => {
  const { rankedPromises } = ctxFor();
  for (const c of [null, {}, { commitments: [] }, { commitments: [K('d', 'i_owe', null, '2026-10-01')] }]) {
    assert.deepEqual(JSON.parse(JSON.stringify(rankedPromises(c))), { kept: [], more: 0 });
  }
});

// ---- Task 2: the Promises section ----
const SEC = ['escapeHtml', 'escapeAttr', 'fmtDate', 'rankedPromises', 'promiseCue', 'beatPromisesSection'];
const sec = (commitments, today = '2026-10-21') => { const ctx = ctxFor(today, SEC); return { ctx, html: ctx.beatPromisesSection({ id: 'c1', commitments }) }; };
const rows = html => (html.match(/<li data-beat-promise>/g) || []).length;

test('beatPromisesSection: empty string with no open commitment; renderBeatPrep prints no Promises then', () => {
  for (const cm of [[], undefined, [K('d', 'i_owe', null, '2026-10-01')]]) assert.equal(sec(cm).html, '');
  const ctx = ctxFor('2026-10-21', ['escapeHtml', 'escapeAttr', 'fmtDate', 'closingStretch', 'beatTranscriptSection', 'rankedPromises', 'promiseCue', 'beatPromisesSection', 'renderBeatPrep']);
  vm.runInContext(`var DATA = {activities: {c1: []}}; function fmtDayTime(){ return ''; } function getNextSessionTime(){ return ''; }
    function isLoggedPastDate(){ return false; } function activityTranscript(){ return null; }`, ctx);
  const html = ctx.renderBeatPrep({ call: { c: { id: 'c1' }, at: null, next: null, prepped: false } });
  assert.ok(html.includes('Call prep') && !html.includes('data-beat-promises-sec') && !html.includes('Promises'));
});

test('beatPromisesSection: You owe before They owe you, rank order inside, cap across directions, empty group not printed', () => {
  const { html } = sec([K('they-undated', 'they_owe'), K('you-overdue', 'i_owe', '2026-10-10'), K('they-overdue', 'they_owe', '2026-10-12'), K('you-dated', 'i_owe', '2026-10-30')]);
  const at = s => html.indexOf(s);
  assert.ok(at('>You owe<') >= 0 && at('>You owe<') < at('>They owe you<'));
  assert.ok(at('you-overdue') < at('you-dated') && at('you-dated') < at('>They owe you<'));
  assert.ok(at('they-overdue') < at('they-undated'));
  const cap = sec([...[0, 1, 2, 3, 4].map(i => K('y' + i, 'i_owe')), K('t-over', 'they_owe', '2026-10-01')]).html;
  assert.ok(cap.includes('t-over') && !cap.includes('y4') && cap.includes('1 more'));
  assert.ok(!sec([K('t1', 'they_owe')]).html.includes('>You owe<'));
});

test('beatPromisesSection: text is escaped, starts the text node, and the SIM-OWE strip removes it', () => {
  const evil = '<img src=x onerror=alert(1)> & "q"';
  const h = sec([K(evil, 'i_owe')]).html;
  assert.ok(h.includes('&lt;img') && h.includes('&amp;') && !h.includes('<img'));
  const ctx = ctxFor('2026-10-21', SEC);
  const six = ctx.beatPromisesSection({ id: 'a"b&c<i>', commitments: Array.from({ length: 6 }, (_, i) => K('u' + i, 'i_owe')) });
  assert.ok(six.includes('data-open-cust="a&quot;b&amp;c&lt;i&gt;"'));
  const s = sec([K('SIM-OWE you owe x', 'i_owe', '2026-10-23')]).html;
  assert.ok(/<li data-beat-promise>SIM-OWE you owe/.test(s));
  assert.ok(!s.replace(/SIM-OWE[^<]*/g, '').includes('SIM-OWE'));
});

test('beatPromisesSection: cues are overdue, due soon, due <date>, and none when undated', () => {
  const ctx = ctxFor('2026-10-21', SEC.filter(n => n !== 'fmtDate'));
  vm.runInContext("function fmtDate(d){ return 'D:' + d; }", ctx);
  const one = (due) => ctx.beatPromisesSection({ id: 'c1', commitments: [K('x', 'i_owe', due)] });
  const a = one('2026-10-19'); assert.ok(a.includes('2d overdue') && a.includes('var(--status-risk-text)'));
  const b = one('2026-10-23'); assert.ok(b.includes('due soon') && b.includes('var(--status-watch-text)'));
  assert.ok(one('2026-12-01').includes('due D:2026-12-01'));
  const u = one(null); const li = u.slice(u.indexOf('<li'), u.indexOf('</li>'));
  assert.ok(!li.includes('overdue') && !li.includes('due soon') && !li.includes('due '));
});

test('beatPromisesSection: 7 open show 5 rows and a more line to the Coordination tab; 5 open show none', () => {
  const mk = n => Array.from({ length: n }, (_, i) => K('u' + i, 'i_owe'));
  const h = sec(mk(7)).html;
  assert.equal(rows(h), 5);
  for (const s of ['2 more', 'data-open-tab="coordination"', 'data-open-cust="c1"', 'see them all']) assert.ok(h.includes(s), s);
  assert.ok(!sec(mk(5)).html.includes('data-beat-promises-more'));
});

test('renderBeatPrep: Promises sits after Pending deliverables and before Time on your calendar', () => {
  const ctx = ctxFor('2026-10-21', ['escapeHtml', 'escapeAttr', 'fmtDate', 'closingStretch', 'beatTranscriptSection', 'rankedPromises', 'promiseCue', 'beatPromisesSection', 'renderBeatPrep']);
  vm.runInContext(`var DATA = {activities: {c1: []}}; function fmtDayTime(){ return ''; } function getNextSessionTime(){ return ''; }
    function isLoggedPastDate(){ return false; } function activityTranscript(){ return null; }`, ctx);
  const html = ctx.renderBeatPrep({ call: { c: { id: 'c1', commitments: [K('p1', 'i_owe')] }, at: null, next: null, prepped: false } });
  const p = html.indexOf('Pending deliverables'), s = html.indexOf('data-beat-promises-sec'), t = html.indexOf('Time on your calendar');
  assert.ok(p >= 0 && p < s && s < t);
});
