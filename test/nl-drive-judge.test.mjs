import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { judgeNl } from '../tools/nl-drive.mjs';
const good = { order: ['Agenda', 'Promises', 'Last transcript', 'Pending deliverables'], promptTitle: 'Back up your book first?', promptButtonClass: 'btn btn-primary', promptButtonText: 'Download backup', otherConfirmTitle: 'Are you sure?', otherConfirmButtonClass: 'btn btn-danger', gradModal: { opened: true, has: false }, answeredHiddenNoSent: true, answeredShownAfterTyping: true };
test('NL drive judge: the right order, prompt, an unchanged other confirm, graduate text and Answered box pass', () => { assert.equal(judgeNl(good).passed, true); });
test('NL drive judge: each wrong value fails', () => {
  for (const bad of [{ order: ['Agenda', 'Last transcript', 'Pending deliverables', 'Promises'] }, { promptTitle: 'Are you sure?' }, { promptButtonClass: 'btn btn-danger' }, { promptButtonText: 'Delete' }, { otherConfirmTitle: 'Back up your book first?' }, { otherConfirmButtonClass: 'btn btn-primary' }, { gradModal: { opened: true, has: true } }, { gradModal: { opened: false, has: false } }, { gradModal: undefined }, { answeredHiddenNoSent: false }, { answeredShownAfterTyping: false }]) assert.equal(judgeNl({ ...good, ...bad }).passed, false, JSON.stringify(bad));
});
test('NL drive 1g: the Graduate probe reports whether the modal opened (source check; the sabotage run proves it end to end)', () => {
  const s = readFileSync('tools/nl-drive.mjs', 'utf8');
  assert.match(s, /opened: !!m/); assert.match(s, /r\.gradModal = /); assert.doesNotMatch(s, /gradHasZeroOfZero/);
});
