import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const src = readFileSync('tools/selfchecks-1.1.js', 'utf8').replace(/\r\n/g, '\n');
const m = src.match(/\/\*VERDICT-BEGIN\*\/([\s\S]*?)\/\*VERDICT-END\*\//);
const r = src.match(/\/\*AGENDA-RE-BEGIN\*\/([\s\S]*?)\/\*AGENDA-RE-END\*\//);
const NOTE = 'We reviewed the mapping.', Q = 'Can numeric columns use a US format?', S = '3/8';
const agenda = `<div class="bp-sec" data-beat-agenda><div class="lbl">Agenda</div><ol><li>Open question: ${Q}</li></ol><p>Copy agenda</p></div>`;
const card = `<div class="bq-q">${Q}</div><p>${NOTE}</p><span>${S}</span>`;
const agendaOpen = `<div class="bp-sec" data-beat-agenda><div class="lbl">Agenda</div><ul><li>Open question: ${Q}</li></ul>`;
const run = (html) => {
  assert.ok(m && r, 'the check must carry VERDICT and AGENDA-RE markers');
  const re = new Function('return ' + r[1])();
  const verdict = new Function('return ' + m[1])();
  return verdict(html, NOTE, Q, S, re);
};

test('real shape: question once outside the Agenda (Agenda copy exempt), note once, figure once -> ok', () => {
  const v = run(agenda + card);
  assert.deepEqual([v.questionTimes, v.noteTimes, v.sessionsTimes, v.ok], [1, 1, 1, true]);
});
test('control: a second QUESTION outside the Agenda fails', () => {
  const v = run(agenda + card + `<p>${Q}</p>`);
  assert.deepEqual([v.questionTimes, v.ok], [2, false]);
});
test('control: a duplicate NOTE outside the Agenda fails', () => {
  assert.equal(run(agenda + card + `<p>${NOTE}</p>`).ok, false);
});
test('control: a duplicate NOTE inside the Agenda fails (NOTE counted over the whole panel)', () => {
  const a = agenda.replace('Copy agenda', NOTE);
  const v = run(a + card);
  assert.deepEqual([v.noteTimes, v.ok], [2, false]);
});
test('control: a duplicate sessions figure inside the Agenda fails', () => {
  const v = run(agenda.replace('Copy agenda', S) + card);
  assert.deepEqual([v.sessionsTimes, v.ok], [2, false]);
});
test('control: a duplicate sessions figure outside the Agenda fails', () => {
  assert.equal(run(agenda + card + `<i>${S}</i>`).ok, false);
});
test('control: an Agenda with no </ol> cannot swallow the next section; an outside duplicate QUESTION there still fails', () => {
  const v = run(agendaOpen + `<div class="bp-sec"><p>${Q}</p></div>` + card);
  assert.deepEqual([v.questionTimes, v.ok], [2, false]);
});
test('tools/selfchecks.js (the 1.0 suite) is byte-identical to 55f7469', () => {
  const was = execSync('git show 55f7469:tools/selfchecks.js', { maxBuffer: 1 << 28 });
  const n = (b) => b.toString('utf8').replace(/\r\n/g, '\n');
  assert.equal(n(readFileSync('tools/selfchecks.js')), n(was));
});
