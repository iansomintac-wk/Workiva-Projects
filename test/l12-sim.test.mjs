import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { l12Judge } from '../tools/sim/osm-day/steps-b.mjs';
import { BREAKS, OVERRIDE_NAMES_1_1_ONLY } from '../tools/sim/osm-day/lib/breaks.mjs';
import { STEP_IDS, CHECKED, GAPS, classify } from '../tools/sim/osm-day/lib/results.mjs';
const S = 'csat_unanswered';
test('L12 judge: absent at 6 days, present at 7, gone once answered => pass', () => {
  assert.equal(l12Judge({ atDay6: ['session_due'], atDay7: [S], afterAnswer: [] }).passed, true);
});
test('L12 judge: each wrong leg fails (early row, no row, row after answer)', () => {
  assert.equal(l12Judge({ atDay6: [S], atDay7: [S], afterAnswer: [] }).passed, false);
  assert.equal(l12Judge({ atDay6: [], atDay7: [], afterAnswer: [] }).passed, false);
  assert.equal(l12Judge({ atDay6: [], atDay7: [S], afterAnswer: [S] }).passed, false);
});
test('L12 is a checked step with a break; no GAP left for it', () => {
  assert.equal(CHECKED.length, 22); assert.ok(CHECKED.includes('L12')); assert.equal(GAPS.L12, undefined);
  assert.equal(classify({ id: 'L12', passed: true }).status, 'PASS');
  assert.equal(classify({ id: 'L12', passed: false }).status, 'FAIL');
  assert.ok(BREAKS.L12.js.trim().endsWith("window.__simBreak='L12'"));
  assert.doesNotThrow(() => new Function(BREAKS.L12.js));
  assert.deepEqual(OVERRIDE_NAMES_1_1_ONLY, ['csatSurveyOverdue']);
});
test('verify.mjs C4 derives its count from CHECKED, not a literal 21', () => {
  const v = readFileSync(new URL('../tools/sim/osm-day/verify.mjs', import.meta.url), 'utf8');
  assert.ok(/CHECKED/.test(v) && !/br\.length !== 21/.test(v) && !/'FLIPPED'\) !== 21/.test(v));
});
