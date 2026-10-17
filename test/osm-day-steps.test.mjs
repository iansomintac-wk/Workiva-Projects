import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BREAKS, OVERRIDE_NAMES } from '../tools/sim/osm-day/lib/breaks.mjs';

const IDS = ['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11'];
const FILES = ['1.0', '1.1'].map(v => [v, readFileSync(new URL(`../osm-book-of-business-tracker-${v}.html`, import.meta.url), 'utf8')]);

test('BREAKS holds exactly the 21 checked ids and none for L12', () => {
  assert.deepEqual(Object.keys(BREAKS).sort(), [...IDS].sort());
  assert.equal(BREAKS.L12, undefined);
});
test('every js ends with its own marker, and D5 is the AI break', () => {
  for (const id of IDS) {
    if (id === 'D5') { assert.deepEqual(BREAKS.D5, { ai: 'noEmail' }); continue; }
    assert.ok(BREAKS[id].js.trim().endsWith(`window.__simBreak='${id}'`), id);
  }
});
test('every js parses', () => {
  for (const id of IDS) if (BREAKS[id].js) assert.doesNotThrow(() => new Function(BREAKS[id].js), id);
});
test('each override name is a function in both trackers', () => {
  assert.ok(OVERRIDE_NAMES.length >= 18);
  for (const [v, html] of FILES) for (const n of OVERRIDE_NAMES) assert.ok(html.includes(`function ${n}(`), `${v} ${n}`);
});
test('isGraduatingSoon uses days <= 30 in both trackers', () => {
  for (const [v, html] of FILES) {
    const i = html.indexOf('function isGraduatingSoon(');
    assert.ok(i >= 0, v);
    assert.match(html.slice(i, i + 600), /days <= 30/, v);
  }
});
