import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeNl } from '../tools/nl-drive.mjs';
const good = { order: ['Agenda', 'Promises', 'Last transcript', 'Pending deliverables'], promptTitle: 'Back up your book first?', promptButtonClass: 'btn btn-primary', promptButtonText: 'Download backup', otherConfirmTitle: 'Are you sure?', otherConfirmButtonClass: 'btn btn-danger', gradHasZeroOfZero: false, answeredHiddenNoSent: true, answeredShownAfterTyping: true };
test('NL drive judge: the right order, prompt, an unchanged other confirm, graduate text and Answered box pass', () => { assert.equal(judgeNl(good).passed, true); });
test('NL drive judge: each wrong value fails', () => {
  for (const bad of [{ order: ['Agenda', 'Last transcript', 'Pending deliverables', 'Promises'] }, { promptTitle: 'Are you sure?' }, { promptButtonClass: 'btn btn-danger' }, { promptButtonText: 'Delete' }, { otherConfirmTitle: 'Back up your book first?' }, { otherConfirmButtonClass: 'btn btn-primary' }, { gradHasZeroOfZero: true }, { answeredHiddenNoSent: false }, { answeredShownAfterTyping: false }]) assert.equal(judgeNl({ ...good, ...bad }).passed, false, JSON.stringify(bad));
});
