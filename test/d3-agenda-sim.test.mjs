import { test } from 'node:test';
import assert from 'node:assert/strict';
import { d3AgendaJudge, PART_A } from '../tools/sim/osm-day/steps-a.mjs';
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
test('d3AgendaJudge: fails when the displayed list items differ from the copied numbered lines', () => {
  const items = ['Open question: SIM-QUESTION which sandbox region do we use?', 'Next step: SIM-OWE checklist: confirm sandbox access'];
  assert.equal(ok({ items }).passed, true);
  const bad = ok({ items: [items[0], 'Next step: SIM-OWE checklist: something else'] });
  assert.equal(bad.passed, false);
  assert.match(bad.evidence, /differ|match/);
  assert.equal(ok({ items: [items[0]] }).passed, false);
  assert.equal(ok({ items: [items[1], items[0]] }).passed, false);
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
test('D3: render and the agenda read share one evaluate, so no frame can swap the pane out', async () => {
  const d3 = PART_A.find(s => s.id === 'D3');
  const srcs = [];
  const ctx = {
    openOn: async () => {},
    ev: async (src) => {
      srcs.push(src);
      return src.includes('[data-beat-agenda]')
        ? JSON.stringify({ found: true, text: T, copy: true, clip: T })
        : 'SIM-OWE checklist SIM-OWE you owe SIM-OWE they owe SIM-QUESTION';
    },
  };
  await d3.run(ctx);
  const read = srcs.find(s => s.includes('[data-beat-agenda]'));
  assert.ok(read, 'an evaluate reads the agenda');
  const focus = read.indexOf('ui.v13DeskId = c.id');
  const render = read.indexOf('render()');
  const query = read.indexOf("querySelector('[data-beat-agenda]')");
  assert.ok(focus >= 0, 'focuses Orion in the same evaluate');
  assert.ok(render >= 0, 'renders in the same evaluate');
  assert.ok(query >= 0 && focus < query && render < query, 'render comes before the agenda query');
});
