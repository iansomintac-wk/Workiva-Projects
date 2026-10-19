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
