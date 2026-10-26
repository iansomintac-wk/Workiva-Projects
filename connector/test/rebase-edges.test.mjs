import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNow, shiftISO } from '../lib/rebase.mjs';

const FROZEN = 1789000000000;
const SEP8 = Date.parse('2026-09-08T00:00:00Z');

test('rebase edges: resolveNow returns a number unchanged', () => {
  assert.equal(resolveNow(1789000000000, {}), 1789000000000);
});

test('rebase edges: resolveNow converts a Date to its time value', () => {
  assert.equal(resolveNow(new Date('2026-09-08T00:00:00Z'), {}), SEP8);
});

test('rebase edges: resolveNow calls a function and uses its number', () => {
  assert.equal(resolveNow(() => 5, {}), 5);
});

test('rebase edges: resolveNow reads CONNECTOR_FAKE_NOW when now is undefined', () => {
  assert.equal(resolveNow(undefined, { CONNECTOR_FAKE_NOW: '2026-09-08T00:00:00Z' }), SEP8);
});

test('rebase edges: resolveNow falls back to Date.now() for undefined with an empty env', (t) => {
  t.mock.method(Date, 'now', () => FROZEN);
  assert.equal(resolveNow(undefined, {}), FROZEN);
});

test('rebase edges: resolveNow falls back to Date.now() for null with an empty env', (t) => {
  t.mock.method(Date, 'now', () => FROZEN);
  assert.equal(resolveNow(null, {}), FROZEN);
});

test('rebase edges: shiftISO leaves an empty string empty', () => {
  assert.equal(shiftISO('', 5), '');
});

test('rebase edges: shiftISO crosses a year boundary', () => {
  assert.equal(shiftISO('2026-12-31', 1), '2027-01-01');
});

test('rebase edges: shiftISO lands on a leap day', () => {
  assert.equal(shiftISO('2028-02-28', 1), '2028-02-29');
});

test('rebase edges: shiftISO negative shift crosses a month', () => {
  assert.equal(shiftISO('2026-03-02', -3), '2026-02-27');
});

test('rebase edges: shiftISO keeps the time suffix with a negative shift', () => {
  assert.equal(shiftISO('2026-09-08T14:00:00Z', -8), '2026-08-31T14:00:00Z');
});
