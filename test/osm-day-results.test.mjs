import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STEP_IDS, CHECKED, GAPS, classify, breakVerdict, validateRun, exitCode,
} from '../tools/sim/osm-day/lib/results.mjs';

const steps = (ids = STEP_IDS, status = 'PASS') => ids.map((id) => ({ id, status }));
const brks = (ids = CHECKED, verdict = 'FLIPPED') => ids.map((id) => ({ id, verdict }));

test('ids: 22 steps in order, all 22 checked', () => {
  assert.equal(STEP_IDS.length, 22);
  assert.deepEqual(STEP_IDS.slice(0, 3), ['D1', 'D2', 'D3']);
  assert.equal(STEP_IDS[21], 'L12');
  assert.equal(CHECKED.length, 22);
  assert.ok(CHECKED.includes('L12'));
});

test('classify: plain pass and fail', () => {
  assert.equal(classify({ id: 'D1', passed: true }).status, 'PASS');
  assert.equal(classify({ id: 'D1', passed: false }).status, 'FAIL');
});

test('classify: gap step that passes keeps PASS and carries gap text', () => {
  const r = classify({ id: 'D3', passed: true });
  assert.equal(r.status, 'PASS');
  assert.equal(r.gap, GAPS.D3);
  assert.match(String(GAPS.D3), /meeting agenda/);
});

test('classify: checked step without a boolean throws; unknown id throws', () => {
  assert.throws(() => classify({ id: 'D3' }));
  assert.throws(() => classify({ id: 'D1' }));
  assert.throws(() => classify({ id: 'X9', passed: true }));
});

test('breakVerdict table', () => {
  assert.equal(breakVerdict('PASS', 'FAIL'), 'FLIPPED');
  assert.equal(breakVerdict('PASS', 'PASS'), 'VACUOUS');
  assert.equal(breakVerdict('FAIL', 'FAIL'), 'NOT-TESTED');
  assert.equal(breakVerdict('FAIL', 'PASS'), 'NOT-TESTED');
});

test('validateRun FULL: valid run has no errors', () => {
  assert.deepEqual(validateRun({ steps: steps(), breaks: brks() }), []);
});

test('validateRun FULL: 21 steps errors', () => {
  assert.ok(validateRun({ steps: steps(STEP_IDS.slice(0, 21)), breaks: brks() }).length > 0);
});

test('validateRun FULL: missing break errors', () => {
  assert.ok(validateRun({ steps: steps(), breaks: brks(CHECKED.slice(1)) }).length > 0);
});

test('validateRun FULL: checked step reported GAP errors', () => {
  const s = steps(); s[0] = { id: 'D1', status: 'GAP' };
  assert.ok(validateRun({ steps: s, breaks: brks() }).length > 0);
});

test('validateRun FULL: unknown id errors', () => {
  const s = steps(); s[0] = { id: 'Z1', status: 'PASS' };
  assert.ok(validateRun({ steps: s, breaks: brks() }).length > 0);
});

test('validateRun FULL: NOT-TESTED without a FAIL step errors', () => {
  const b = brks(); b[0] = { id: 'D1', verdict: 'NOT-TESTED' };
  assert.ok(validateRun({ steps: steps(), breaks: b }).length > 0);
  const s = steps(); s[0] = { id: 'D1', status: 'FAIL' };
  assert.deepEqual(validateRun({ steps: s, breaks: b }), []);
});

test('validateRun PARTIAL: exactly the selected steps and breaks', () => {
  const scope = { ids: ['L7', 'L8'], breaks: true };
  assert.deepEqual(validateRun({ steps: steps(['L7', 'L8']), breaks: brks(['L7', 'L8']), scope }), []);
  assert.ok(validateRun({ steps: steps(['L7', 'L8', 'L9']), breaks: brks(['L7', 'L8']), scope }).length > 0);
  assert.ok(validateRun({ steps: steps(['L7', 'L8']), breaks: brks(['L7']), scope }).length > 0);
  assert.ok(validateRun({ steps: steps(['L7', 'L8']), breaks: brks(['L7', 'L8', 'L9']), scope }).length > 0);
});

test('validateRun PARTIAL breaks:false errors if any break present', () => {
  const scope = { ids: ['L7', 'L8'], breaks: false };
  assert.deepEqual(validateRun({ steps: steps(['L7', 'L8']), breaks: [], scope }), []);
  assert.ok(validateRun({ steps: steps(['L7', 'L8']), breaks: brks(['L7']), scope }).length > 0);
});

test('exitCode: 2 on harnessError or validate error', () => {
  assert.equal(exitCode({ steps: steps(), breaks: brks(), harnessError: true }), 2);
  assert.equal(exitCode({ steps: steps(STEP_IDS.slice(0, 21)), breaks: brks() }), 2);
});

test('exitCode: 1 on FAIL or VACUOUS', () => {
  const s = steps(); s[3] = { id: 'D4', status: 'FAIL' };
  assert.equal(exitCode({ steps: s, breaks: brks() }), 1);
  const b = brks(); b[0] = { id: 'D1', verdict: 'VACUOUS' };
  assert.equal(exitCode({ steps: steps(), breaks: b }), 1);
});

test('exitCode: 0 when all PASS and all FLIPPED', () => {
  assert.equal(exitCode({ steps: steps(), breaks: brks() }), 0);
});

// ---- C3 (gone quiet): Fernhollow's row is in the day's 15, in a day step, by day 7 after hand-off ----
const dayRowsEv = rows => `firstToday=2026-10-06 (day 1) firstWatch=2026-10-15 (day 10) firstOffTrack=2026-10-26 (day 21) rank=3 firstRanked=2026-10-06 where=gate deck beyondBeatCapDays=0/21 reasonIsCoverage=true reason="x" capHiddenDays=0/21 remainingThroughDay7=[] dayRows=[${rows.join(';')}]`;
const c3res = (rows11, rows10 = rows11) => [{ res: { '1.0': { partial: false, steps: [{ id: 'L6', status: 'PASS', evidence: dayRowsEv(rows10) }] }, '1.1': { partial: false, steps: [{ id: 'L6', status: 'PASS', evidence: dayRowsEv(rows11) }] } } }];
const DECK_ONLY = ['2026-10-06@none@gate deck', '2026-10-07@none@gate deck', '2026-10-12@28@gate deck'];
test('C3 FAIL on 1.1 when Fernhollow shows only as a gate-deck card or Below the day through day 7', async () => {
  const { c3 } = await import('../tools/sim/osm-day/verify.mjs');
  assert.match(c3(c3res(DECK_ONLY)), /^C3 FAIL .*1\.1 no on-screen row in the day's 15/);
  assert.match(c3(c3res(['2026-10-12@1@Below the day'])), /^C3 FAIL .*1\.1 no on-screen row in the day's 15/);
});
test('C3 PASS when 1.1 has a ranked day-step row on 2026-10-12, and 1.0 failing does not gate it', async () => {
  const { c3 } = await import('../tools/sim/osm-day/verify.mjs');
  const line = c3(c3res(['2026-10-12@1@day step+gate deck'], DECK_ONLY));
  assert.match(line, /^C3 PASS /);
  assert.match(line, /1\.0 no on-screen row .*\(reported, expected to fail\)/);
  assert.match(line, /1\.1 in the day's 15 on screen on 2026-10-12 \(rank 1, day step\+gate deck\)/);
});
test('C3 does not count a day-step row after day 7 or one ranked past 15', async () => {
  const { c3 } = await import('../tools/sim/osm-day/verify.mjs');
  assert.match(c3(c3res(['2026-10-13@1@day step'])), /^C3 FAIL .*1\.1 no on-screen row/);
  assert.match(c3(c3res(['2026-10-12@16@day step'])), /^C3 FAIL .*1\.1 no on-screen row/);
});
test('C3 FAIL when the L6 evidence carries no dayRows (unreadable)', async () => {
  const { c3 } = await import('../tools/sim/osm-day/verify.mjs');
  const runs = [{ res: Object.fromEntries(['1.0', '1.1'].map(v => [v, { partial: false, steps: [{ id: 'L6', status: 'PASS', evidence: 'firstToday=2026-10-06' }] }])) }];
  assert.match(c3(runs), /^C3 FAIL .*dayRows unreadable/);
});
test('L6 evidence ends with a dayRows field (evidence only; the pass rule line is untouched)', () => {
  const t = readFileSync(new URL('../tools/sim/osm-day/steps-b.mjs', import.meta.url), 'utf8');
  assert.match(t, /dayRows=\[\$\{log\.map\(/);
  assert.match(t, /const passed = firstToday !== 'never' && firstToday <= CAL\.L6\.day7;/);
});
test('X9 run.mjs does not cut L6 evidence at 600 characters', () => {
  const t = readFileSync(new URL('../tools/sim/osm-day/run.mjs', import.meta.url), 'utf8');
  assert.match(t, /cut[(]r[.]evidence, id === 'L6'/);
});

const verifySrc = () => readFileSync(new URL('../tools/sim/osm-day/verify.mjs', import.meta.url), 'utf8');
const pinned = v => new RegExp(`'${v.replace('.', '\.')}': '([0-9a-f]{64})'`).exec(verifySrc())[1];
const shaOf = v => createHash('sha256').update(readFileSync(new URL(`../osm-book-of-business-tracker-${v}.html`, import.meta.url))).digest('hex');
test('C8 pins the 1.1 tracker at its current sha256', () => { assert.equal(pinned('1.1'), shaOf('1.1')); });
test('C8 pins the 1.0 tracker at its current sha256 (unchanged by this run)', () => { assert.equal(pinned('1.0'), shaOf('1.0')); });
test('C8 git diff against master covers the 1.0 file only', () => {
  assert.match(verifySrc(), /'diff', '--quiet', base, '--', 'osm-book-of-business-tracker-1\.0\.html'\]/);
});
