import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { judgeKeys } from '../tools/csat-keys-check.mjs';
const g = { initialSaved: null, badValueTyped: '0002-10-19', savedAfterBad: null, focusKept: true, goodSaved: '2026-10-19', keyEvents: 24 };
test('NL-5 judge: the live input held 0002-10-19, it was not saved, focus kept, then 2026-10-19 saved passes', () => { assert.equal(judgeKeys(g).passed, true); });
test('NL-5 judge: a bad value never typed, a saved bad year, lost focus, a good date not saved, or too few key events each fail', () => {
  for (const bad of [{ badValueTyped: '' }, { badValueTyped: '2026-10-19' }, { savedAfterBad: '0002-10-19' }, { focusKept: false }, { goodSaved: null }, { keyEvents: 3 }]) assert.equal(judgeKeys({ ...g, ...bad }).passed, false, JSON.stringify(bad));
});
test('NL-5 judge: the result carries the initial saved value, and a saved value that differs from it fails even when it is not the bad year', () => {
  assert.equal(judgeKeys({ ...g, initialSaved: '2026-09-01', savedAfterBad: '2026-09-01' }).passed, true);
  assert.equal(judgeKeys({ ...g, initialSaved: '2026-09-01', savedAfterBad: null }).passed, false);
});
test('NL-5 tool: types with CDP key events, never sets the value directly, and has a sabotage mode', () => {
  const s = readFileSync('tools/csat-keys-check.mjs', 'utf8');
  assert.match(s, /Input\.dispatchKeyEvent/); assert.match(s, /--sabotage/);
  assert.doesNotMatch(s, /\.value\s*=\s*['"`]\d{4}/);
});
