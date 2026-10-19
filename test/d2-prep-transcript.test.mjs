import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lf = readFileSync(new URL('../osm-book-of-business-tracker-1.1.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
// Source of one function declaration. Single-line functions (e.g. escapeAttr) are returned as that one line.
export function grab(name) {
  const i = lf.indexOf(`function ${name}(`);
  assert.ok(i >= 0, `function ${name}( is absent from 1.1`);
  const first = lf.slice(i, lf.indexOf('\n', i));
  const opens = (first.match(/\{/g) || []).length, closes = (first.match(/\}/g) || []).length;
  if (opens > 0 && opens === closes && /\}\s*$/.test(first)) return first;
  const j = lf.indexOf('\n}\n', i);
  assert.ok(j >= 0, `closing "\n}\n" of ${name} not found`);
  return lf.slice(i, j + 2);
}
const fx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../tools/step1-fixture.js', import.meta.url), 'utf8'), fx);
const CALLS = fx.window.STEP1_CALLS;
const load = () => { const ctx = vm.createContext({}); vm.runInContext(grab('closingStretch'), ctx); return ctx.closingStretch; };

const HEADER = /^\S.*\s{2,}\d{1,2}:\d{2}(:\d{2})?$/;
const isSpeech = l => l && !HEADER.test(l) && !l.includes('-->') && !/^\d{1,2}:\d{2}(:\d{2})?([.,]\d+)?$/.test(l) && l !== 'WEBVTT';
const speech = t => t.split(/\r?\n/).map(s => s.trim()).filter(isSpeech);
// Pinned per fixture: the wrap-up line's opening words and its distance from the end (last speech line = 1). Measured in Step 1.
const PIN = [
  { start: "No problem. Okay, so. From me, I've got,", fromEnd: 28 },
  { start: 'Okay. So, very quickly before you go, from my side', fromEnd: 5 },
  { start: "From my side, if this works, we'd want t", fromEnd: 27 },
  { start: 'Thanks, Marcus. And thanks Dana, Tomasz.', fromEnd: 7 },
];

test('fixtures: pinned wrap-up line is present, at its pinned distance, and inside the 30-line stretch on 4 of 4; sizes match the probe', () => {
  assert.equal(CALLS.length, 4);
  const closingStretch = load(), chars = [], withSpeakers = [];
  CALLS.forEach((t, i) => {
    const s = closingStretch(t, 30), sp = speech(s), all = speech(t);
    assert.equal(sp.length, 30, `fixture ${i}`);
    assert.equal(s.split('\n').length, 59, `fixture ${i} raw lines`);
    chars.push(sp.join('\n').length);                    // join('\n') is the probe's measure (join('') is 29 short)
    withSpeakers.push(s.length);
    const line = all[all.length - PIN[i].fromEnd];
    assert.ok(PIN[i].start && line.startsWith(PIN[i].start), `fixture ${i}: wrap-up line at ${PIN[i].fromEnd} from the end starts with the pinned text`);
    assert.ok(s.includes(line), `fixture ${i}: wrap-up line inside the stretch`);
    assert.ok(PIN[i].fromEnd <= 30);
  });
  assert.deepEqual(chars, [4032, 4442, 3114, 2841]);
  assert.deepEqual(withSpeakers, [4725, 5149, 3832, 3526]);
});

test('a 1-line transcript returns that line; blank and non-string return empty', () => {
  const c = load();
  assert.equal(c('Only line here'), 'Only line here');
  assert.equal(c('   '), '');
  assert.equal(c(null), '');
});

test('cues, bare timestamps, WEBVTT and speaker headers are not speech lines; 31 speech lines cut to the last 30', () => {
  const c = load();
  const small = 'WEBVTT\n\n00:00:01\nAnn Lee  00:00:01\nhello\n\n00:00:02 --> 00:00:04\nBob  00:00:05\nworld';
  assert.equal(c(small), small.trim());                  // 2 speech lines: whole
  const vtt = ['WEBVTT', ...Array.from({ length: 31 }, (_, i) => `00:00:${String(i).padStart(2, '0')}.000 --> 00:00:${String(i + 1).padStart(2, '0')}.000\ncue line ${i}`)].join('\n\n');
  const out = c(vtt, 30);
  assert.equal(speech(out).length, 30);
  assert.ok(out.startsWith('cue line 1'));               // cue line 0 is the 31st from the end and is dropped
  assert.ok(!out.includes('WEBVTT') && !out.includes('cue line 0'));
  const many = Array.from({ length: 35 }, (_, i) => `Ann Lee  00:00:${String(i).padStart(2, '0')}\nline ${i}`).join('\n\n');
  const o2 = c(many, 30);
  // A header sits BEFORE its speech line, so the first kept raw line is the speech line "line 5" itself; the header after it is kept.
  assert.ok(o2.startsWith('line 5\nAnn Lee  00:00:06'));
  assert.equal(speech(o2).length, 30);
});
