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

test('99-measure.js no longer reads the retired time-saved log (F2)', () => {
  const t = readFileSync(new URL('../tools/sim/steps/99-measure.js', import.meta.url), 'utf8');
  assert.doesNotMatch(t, /getImpactLog/);
  assert.doesNotMatch(t, /impactMinutesFor/);
});

test('PART_A holds D1..D10 in order, each async and CHECKED (Task 8)', async () => {
  const { PART_A } = await import('../tools/sim/osm-day/steps-a.mjs');
  const { CHECKED } = await import('../tools/sim/osm-day/lib/results.mjs');
  assert.deepEqual(PART_A.map(s => s.id), ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10']);
  for (const s of PART_A) assert.ok(CHECKED.includes(s.id), s.id);
  for (const s of PART_A) assert.equal(s.run.constructor.name, 'AsyncFunction', s.id);
});
test('PART_A_DEPS says D5 needs D4 and nothing else depends', async () => {
  const { PART_A_DEPS } = await import('../tools/sim/osm-day/steps-a.mjs');
  assert.deepEqual(PART_A_DEPS, { D5: ['D4'] });
});
test('setupA and setupB are exported; setupB never mentions Fernhollow', async () => {
  const { setupA, setupB } = await import('../tools/sim/osm-day/lib/setup.mjs');
  assert.equal(typeof setupA, 'function');
  assert.equal(typeof setupB, 'function');
  assert.doesNotMatch(setupB.toString(), /Fernhollow/);
  assert.match(setupA.toString(), /Fernhollow Renewables/);
});

test('daysBetween counts whole days between ISO dates (Task 9)', async () => {
  const { daysBetween } = await import('../tools/sim/osm-day/steps-b.mjs');
  assert.equal(daysBetween('2026-10-05', '2026-10-12'), 7);
  assert.equal(daysBetween('2026-10-12', '2026-10-05'), -7);
  assert.equal(daysBetween('2026-08-31', '2026-09-01'), 1);
});
test('CAL holds the Part B calendar for L1..L6', async () => {
  const { CAL } = await import('../tools/sim/osm-day/steps-b.mjs');
  assert.equal(CAL.L1, '2026-08-03');
  assert.equal(CAL.L2, '2026-08-05');
  assert.equal(CAL.L3, '2026-08-12');
  assert.deepEqual([CAL.L4.build, CAL.L4.uat], ['2026-08-24', '2026-09-21']);
  assert.equal(CAL.L5, '2026-10-05');
  assert.deepEqual([CAL.L6.from, CAL.L6.to], ['2026-10-06', '2026-10-26']);
});
test('PART_B holds L1..L6 in order, each async and CHECKED', async () => {
  const { PART_B } = await import('../tools/sim/osm-day/steps-b.mjs');
  const { CHECKED } = await import('../tools/sim/osm-day/lib/results.mjs');
  assert.deepEqual(PART_B.map(s => s.id), ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']);
  for (const s of PART_B) { assert.ok(CHECKED.includes(s.id), s.id); assert.equal(s.run.constructor.name, 'AsyncFunction', s.id); }
});
