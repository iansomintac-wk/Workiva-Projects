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
test('PART_B holds L1..L12 in order, each async, CHECKED except L12 (Task 10)', async () => {
  const { PART_B } = await import('../tools/sim/osm-day/steps-b.mjs');
  const { CHECKED } = await import('../tools/sim/osm-day/lib/results.mjs');
  assert.deepEqual(PART_B.map(s => s.id), ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12']);
  for (const s of PART_B) { assert.equal(CHECKED.includes(s.id), s.id !== 'L12', s.id); assert.equal(s.run.constructor.name, 'AsyncFunction', s.id); }
});
test('committedDate and l10Day follow the Part B chronology (Task 10)', async () => {
  const { committedDate, l10Day } = await import('../tools/sim/osm-day/steps-b.mjs');
  assert.equal(committedDate('2026-12-07', 6), '2027-01-11');
  assert.equal(committedDate('2026-12-07', 1), '2026-12-07');
  assert.equal(l10Day('2027-01-11'), '2027-01-04');
});
test('PART_B_ORDER runs L9 phase 1, L10, L9 phase 2, L11 in date order after L8', async () => {
  const { PART_B_ORDER, PART_B } = await import('../tools/sim/osm-day/steps-b.mjs');
  const i = PART_B_ORDER.indexOf('L8');
  assert.deepEqual(PART_B_ORDER.slice(i + 1, i + 5), ['L9.phase1', 'L10', 'L9.phase2', 'L11']);
  assert.deepEqual(PART_B.map(s => s.id).filter(id => ['L9', 'L10', 'L11'].includes(id)), ['L9', 'L10', 'L11']);
});

// ---- Task 11: runner (run.mjs) ----
test('parseArgs reads flags, marks partial, and defaults to a full run (Task 11)', async () => {
  const { parseArgs } = await import('../tools/sim/osm-day/run.mjs');
  assert.deepEqual(parseArgs(['--version', '1.1', '--part', 'A', '--no-breaks']),
    { versions: ['1.1'], parts: ['A'], breaks: false, partial: true, only: null });
  assert.deepEqual(parseArgs([]), { versions: ['1.0', '1.1'], parts: ['A', 'B'], breaks: true, partial: false, only: null });
  assert.equal(parseArgs(['--version', '1.0']).partial, false);
  assert.deepEqual(parseArgs(['--only', 'D4,D5']).only, ['D4', 'D5']);
  assert.equal(parseArgs(['--only', 'D4']).partial, true);
  assert.equal(parseArgs(['--out', 'x']).out, 'x');
  assert.throws(() => parseArgs(['--bogus']), /unknown/i);
  assert.throws(() => parseArgs(['--version', '2.0']), /version/i);
  assert.throws(() => parseArgs(['--only', 'D99']), /D99/);
});
test('prerequisites runs the earlier steps first, and D4 before D5 (Task 11)', async () => {
  const { prerequisites } = await import('../tools/sim/osm-day/run.mjs');
  assert.deepEqual(prerequisites(['L7']), ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']);
  const p10 = prerequisites(['L10']);
  assert.ok(p10.includes('L9.phase1')); assert.ok(!p10.includes('L9.phase2')); assert.ok(!p10.includes('L10'));
  assert.deepEqual(prerequisites(['L1']), []);
  assert.deepEqual(prerequisites(['D4']), []);
  assert.deepEqual(prerequisites(['D5']), ['D4']);
  assert.deepEqual(prerequisites(['D4', 'D5']), []);
  for (const id of ['D1', 'D2', 'D3', 'D6', 'D7', 'D8', 'D9', 'D10']) assert.deepEqual(prerequisites([id]), [], id);
});
test('exit code: a full run missing a step or break is 2, scoped runs are valid (Task 11)', async () => {
  const { exitCode, STEP_IDS, CHECKED } = await import('../tools/sim/osm-day/lib/results.mjs');
  const steps = STEP_IDS.map(id => ({ id, status: id === 'L12' ? 'GAP' : 'PASS' }));
  const breaks = CHECKED.map(id => ({ id, verdict: 'FLIPPED' }));
  assert.equal(exitCode({ steps, breaks }), 0);
  assert.equal(exitCode({ steps: steps.slice(1), breaks }), 2);
  assert.equal(exitCode({ steps, breaks: breaks.slice(1) }), 2);
  assert.equal(exitCode({ steps: [{ id: 'D5', status: 'PASS' }], breaks: [], scope: { ids: ['D5'], breaks: false } }), 0);
  assert.equal(exitCode({ steps: [{ id: 'D5', status: 'PASS' }], breaks: [{ id: 'D5', verdict: 'FLIPPED' }], scope: { ids: ['D5'], breaks: true } }), 0);
});
test('checkEscaped throws when any AI request escaped the fake, which is exit 2 (FR4)', async () => {
  const { checkEscaped } = await import('../tools/sim/osm-day/run.mjs');
  const { exitCode } = await import('../tools/sim/osm-day/lib/results.mjs');
  assert.doesNotThrow(() => checkEscaped({ fake: 3, escaped: 0 }, 'x'));
  assert.throws(() => checkEscaped({ fake: 3, escaped: 1 }, 'x'), /escaped/);
  assert.equal(exitCode({ steps: [], breaks: [], scope: { ids: [], breaks: false }, harnessError: 'AI requests escaped' }), 2);
});
test('D3 guard needs seeded SIM-OWE entries, all gone after, the rest unchanged (round 4)', async () => {
  const { d3Guard } = await import('../tools/sim/osm-day/run.mjs');
  const before = '<h4>Call prep</h4><li>SIM-OWE a</li><li>SIM-OWE b</li><p>SIM-QUESTION q</p><h4>Open questions</h4>';
  const good = before.replace(/SIM-OWE[^<]*/g, '');
  assert.deepEqual(d3Guard(before, good), []);
  assert.ok(d3Guard('<h4>Call prep</h4><p>SIM-QUESTION q</p><h4>Open questions</h4>', good).length, 'no seeded entries');
  assert.ok(d3Guard(before, before).length, 'entries still present');
  assert.ok(d3Guard(before, '<h4>Call prep</h4>').length, 'panel emptied');
  assert.ok(d3Guard(before, good.replace('SIM-QUESTION q', '')).length, 'question lost');
});
test('D4 and D6 guards flag lost surrounding content (round 4)', async () => {
  const { d4Guard, d6Guard } = await import('../tools/sim/osm-day/run.mjs');
  const b4 = { found: true, count: 4, summary: 'SIM-D4 call', hasTranscript: true };
  assert.deepEqual(d4Guard(b4, { found: true, count: 4, summary: 'SIM-D4 call', hasTranscript: false }), []);
  assert.ok(d4Guard(b4, { found: false, count: 3, summary: null, hasTranscript: false }).length);
  assert.ok(d4Guard(b4, { found: true, count: 4, summary: 'changed', hasTranscript: false }).length);
  const base = [{ text: 'SIM-OWE x', doneOn: null }, { text: 'SIM-D6 y', doneOn: '2026-10-21' }];
  assert.deepEqual(d6Guard(base, [{ text: 'SIM-OWE x', doneOn: null }, { text: 'SIM-D6 y', doneOn: null }]), []);
  assert.ok(d6Guard(base, [{ text: 'SIM-D6 y', doneOn: null }]).length, 'other commitment lost');
  assert.ok(d6Guard(base, [{ text: 'SIM-OWE x', doneOn: '2026-10-21' }, { text: 'SIM-D6 y', doneOn: null }]).length, 'other commitment changed');
});
test('L6 break is VACUOUS when a Fernhollow Today row remains through day 7 (round 4)', async () => {
  const { l6Remaining } = await import('../tools/sim/osm-day/run.mjs');
  assert.deepEqual(l6Remaining('x remainingThroughDay7=[]'), []);
  assert.deepEqual(l6Remaining('x remainingThroughDay7=[2026-10-09: Fernhollow | silence ;; 2026-10-10: F | r] y'), ['2026-10-09: Fernhollow | silence', '2026-10-10: F | r']);
  assert.deepEqual(l6Remaining('no marker'), []);
});
test('N and T recompute guard compares restored state with saved data (Task 11)', async () => {
  const { ntFromCustomer, ntMismatch } = await import('../tools/sim/osm-day/steps-b.mjs');
  assert.deepEqual(ntFromCustomer({ totalSessions: 6, targetGraduationDate: '2027-01-11' }), { N: 6, T: '2027-01-11' });
  assert.equal(ntMismatch({ N: 6, T: '2027-01-11' }, { N: 6, T: '2027-01-11' }), null);
  assert.match(ntMismatch({ N: 6, T: '2027-01-11' }, { N: 5, T: '2027-01-11' }), /N/);
  assert.match(ntMismatch({ N: 6, T: '2027-01-11' }, { N: 6, T: '2027-01-12' }), /T/);
});
