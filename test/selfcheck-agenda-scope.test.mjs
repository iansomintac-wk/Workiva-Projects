import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync('tools/selfchecks-1.1.js', 'utf8').replace(/\r\n/g, '\n');
const m = src.match(/\/\*VERDICT-BEGIN\*\/([\s\S]*?)\/\*VERDICT-END\*\//);
const NOTE = 'We reviewed the mapping.', Q = 'Can numeric columns use a US format?', S = '3/8';
const agenda = `<div class="bp-sec" data-beat-agenda><div class="lbl">Agenda</div><ol><li>Open question: ${Q}</li></ol><p>Copy agenda</p></div>`;
const card = `<div class="bq-q">${Q}</div><p>${NOTE}</p><span>${S}</span>`;

test('selfcheck item 6: the real predicate counts the question once with the Agenda kept, and FAILS when a second copy sits outside the Agenda (control)', () => {
  assert.ok(m, 'the check must carry /*VERDICT-BEGIN*/ ... /*VERDICT-END*/ around its predicate');
  const verdict = new Function('return ' + m[1])();
  const real = verdict(agenda + card, NOTE, Q, S);
  assert.deepEqual([real.questionTimes, real.ok], [1, true]);
  const planted = verdict(agenda + card + `<p>${Q}</p>`, NOTE, Q, S);
  assert.deepEqual([planted.questionTimes, planted.ok], [2, false]);
});
test('preserved (passes on the parent): the 1.0 suite has no Agenda handling and is untouched', () => {
  assert.equal(readFileSync('tools/selfchecks.js', 'utf8').includes('data-beat-agenda'), false);
});
