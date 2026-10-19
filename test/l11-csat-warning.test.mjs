import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lf = readFileSync(new URL('../osm-book-of-business-tracker-1.1.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
export function grab(name) {
  const i = lf.indexOf(`function ${name}(`);
  assert.ok(i >= 0, `function ${name}( is absent from 1.1`);
  const first = lf.slice(i, lf.indexOf('\n', i));
  const opens = (first.match(/\{/g) || []).length, closes = (first.match(/\}/g) || []).length;
  if (opens > 0 && opens === closes && /\}\s*$/.test(first)) return first;
  const j = lf.indexOf('\n}\n', i);
  assert.ok(j >= 0, `closing "\n}\n" of ${name} not found`);
  return lf.slice(i, j + 2);
}
const WORDS = 'No CSAT contact is marked added, so nobody will receive the survey. You can still graduate.';
const acct = (csat) => ({ id: 'a1', name: 'Test Co', compliance: { associatedPeopleCSAT: csat } });
const warn = () => { const ctx = vm.createContext({}); vm.runInContext(grab('graduationCsatWarning'), ctx); return ctx.graduationCsatWarning; };

test('L11 graduationCsatWarning: done:false with no name gives the words', () => {
  assert.equal(warn()(acct({ done: false, date: null, contactName: '' })), WORDS);
});
test('L11 graduationCsatWarning: done:false with a typed name still warns (a name not marked added is missing)', () => {
  assert.equal(warn()(acct({ done: false, date: null, contactName: 'Dana Reyes' })), WORDS);
});
test('L11 graduationCsatWarning: done:true gives an empty string, with or without a name', () => {
  assert.equal(warn()(acct({ done: true, date: '2026-10-01', contactName: 'Dana Reyes' })), '');
  assert.equal(warn()(acct({ done: true, date: '2026-10-01', contactName: '' })), '');
});
