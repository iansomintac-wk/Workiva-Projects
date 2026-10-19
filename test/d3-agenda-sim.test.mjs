import { test } from 'node:test';
import assert from 'node:assert/strict';
import { d3AgendaJudge } from '../tools/sim/osm-day/steps-a.mjs';
import { GAPS, classify } from '../tools/sim/osm-day/lib/results.mjs';
import { BREAKS, AGENDA_OFF } from '../tools/sim/osm-day/lib/breaks.mjs';

const T = 'Agenda - Orion Semiconductor\n1. Open question: SIM-QUESTION which sandbox region do we use?\n2. Next step: SIM-OWE checklist: confirm sandbox access';
const ok = (o = {}) => d3AgendaJudge({ found: true, text: T, copy: true, clip: T, ...o });

test('d3AgendaJudge: passes when the agenda is there and Copy puts the same list on the clipboard', () => {
  assert.equal(ok().passed, true);
});
test('d3AgendaJudge: fails when the agenda, the button, or the clipboard text is missing or wrong', () => {
  assert.equal(ok({ copy: false }).passed, false);
  assert.equal(ok({ found: false }).passed, false);
  assert.equal(ok({ clip: '' }).passed, false);
  assert.equal(ok({ clip: 'Agenda - Orion Semiconductor' }).passed, false);
  assert.equal(ok({ text: 'Agenda - Orion Semiconductor\n1. Open question: SIM-QUESTION x' }).passed, false);
  assert.match(ok({ clip: '' }).evidence, /clipboard/);
});
test('GAPS.D3 is gone and classify carries no gap for D3', () => {
  assert.equal(GAPS.D3, undefined);
  assert.equal('gap' in classify({ id: 'D3', passed: true }), false);
});
test('AGENDA_OFF is an independent break string, not in BREAKS', () => {
  assert.equal(typeof AGENDA_OFF, 'string');
  assert.ok(AGENDA_OFF.includes('beatAgendaSection'));
  assert.doesNotThrow(() => new Function(AGENDA_OFF));
  assert.ok(Object.values(BREAKS).every(b => b.js !== AGENDA_OFF));
});
