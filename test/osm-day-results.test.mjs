import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STEP_IDS, CHECKED, GAPS, classify, breakVerdict, validateRun, exitCode,
} from '../tools/sim/osm-day/lib/results.mjs';

const steps = (ids = STEP_IDS, status = 'PASS') => ids.map((id) => ({ id, status }));
const brks = (ids = CHECKED, verdict = 'FLIPPED') => ids.map((id) => ({ id, verdict }));

test('ids: 22 steps in order, 21 checked (all but L12)', () => {
  assert.equal(STEP_IDS.length, 22);
  assert.deepEqual(STEP_IDS.slice(0, 3), ['D1', 'D2', 'D3']);
  assert.equal(STEP_IDS[21], 'L12');
  assert.equal(CHECKED.length, 21);
  assert.ok(!CHECKED.includes('L12'));
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

test('classify: L12 is GAP', () => {
  assert.equal(classify({ id: 'L12' }).status, 'GAP');
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

test('validateRun FULL: break on L12 errors', () => {
  assert.ok(validateRun({ steps: steps(), breaks: brks([...CHECKED, 'L12']) }).length > 0);
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

test('exitCode: 0 when all PASS/GAP and all FLIPPED', () => {
  const s = steps(); s[21] = { id: 'L12', status: 'GAP' };
  assert.equal(exitCode({ steps: s, breaks: brks() }), 0);
});
