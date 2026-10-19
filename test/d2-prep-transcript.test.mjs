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

// ---- Task 2: the section in renderBeatPrep ----
function secCtx(acts, today = '2026-10-21') {
  const ctx = vm.createContext({});
  vm.runInContext(['escapeHtml', 'escapeAttr', 'closingStretch', 'beatTranscriptSection', 'getCommitments', 'openCommitments', 'rankedPromises', 'beatPromisesSection', 'getOpenThreads', 'unresolvedThreads', 'collectOpenQuestions', 'commitmentIsOverdue', 'beatAgendaItems', 'beatAgendaText', 'beatAgendaSection', 'renderBeatPrep'].map(grab).join('\n'), ctx);
  vm.runInContext(`var DATA = {activities: {c1: ${JSON.stringify(acts)}}};
    function isRealISODate(d){ return String(d || "").length === 10; } function fmtDate(d){ return d; } function fmtDayTime(){ return ''; } function getNextSessionTime(){ return ''; }
    function isLoggedPastDate(d){ return /^\\d{4}-\\d{2}-\\d{2}$/.test(d || '') && d <= '${today}'; }
    function activityTranscript(a){ return a.transcript && a.transcript.text ? a.transcript : null; }`, ctx);
  return ctx;
}
const beat = { call: { c: { id: 'c1' }, at: null, next: null, prepped: false } };
const T = (date, text, extra = {}) => ({ date, type: 'Call', summary: 's', transcript: { text }, ...extra });

test('section: hidden entirely when the account has no transcript', () => {
  for (const acts of [[{ date: '2026-10-10', type: 'Call', summary: 's' }], []]) {
    const ctx = secCtx(acts);
    assert.equal(ctx.beatTranscriptSection({ id: 'c1' }), '');
    const html = ctx.renderBeatPrep(beat);
    assert.ok(html.includes('Call prep'));
    assert.ok(!html.includes('data-beat-transcript'));
  }
});

test('section: newest logged transcript wins, ties keep array order, label falls back to type', () => {
  const ctx = secCtx([T('2026-10-05', 'OLD-3', { sessionNumber: 3 }), T('2026-10-12', 'MID-5', { sessionNumber: 5 }),
    { date: '2026-10-18', type: 'Note', summary: 'n' }, T('2026-10-09', 'MID-4', { sessionNumber: 4 })]);
  const out = ctx.beatTranscriptSection({ id: 'c1' });
  for (const s of ['MID-5', 'Session 5', '2026-10-12', 'Read the full transcript', 'data-open-tab="activity"', 'data-open-cust="c1"']) assert.ok(out.includes(s), s);
  for (const s of ['OLD-3', 'MID-4']) assert.ok(!out.includes(s), s);
  const tie = secCtx([T('2026-10-12', 'FIRST-TIE'), T('2026-10-12', 'SECOND-TIE')]).beatTranscriptSection({ id: 'c1' });
  assert.ok(tie.includes('FIRST-TIE') && !tie.includes('SECOND-TIE'));
  assert.ok(tie.includes('Call') && !tie.includes('Session'));
});

test('section: a future-dated transcript is never chosen', () => {
  const both = secCtx([T('2026-10-25', 'FUTURE-T'), T('2026-10-10', 'PAST-T')]).beatTranscriptSection({ id: 'c1' });
  assert.ok(both.includes('PAST-T') && !both.includes('FUTURE-T'));
  assert.equal(secCtx([T('2026-10-25', 'FUTURE-T')]).beatTranscriptSection({ id: 'c1' }), '');
});

test('section: transcript text is escaped', () => {
  const out = secCtx([T('2026-10-10', '<img src=x onerror=alert(1)> hi')]).beatTranscriptSection({ id: 'c1' });
  assert.ok(out.includes('&lt;img') && !out.includes('<img'));
});

test('section: shows the closing window and sits between Call prep and Pending deliverables', () => {
  const text = Array.from({ length: 40 }, (_, n) => `Speaker  00:00:${String(n).padStart(2, '0')}\nline ${n}`).join('\n');
  const ctx = secCtx([T('2026-10-10', text)]);
  const out = ctx.beatTranscriptSection({ id: 'c1' });
  assert.ok(out.includes('line 39') && !out.includes('line 0\n') && !/line 0</.test(out));
  const html = ctx.renderBeatPrep(beat);
  const a = html.indexOf('Call prep'), b = html.indexOf('data-beat-transcript'), c = html.indexOf('Pending deliverables');
  assert.ok(a >= 0 && a < b && b < c, `${a} ${b} ${c}`);
});

test('section: label (type, session number) and the data-open-cust value are escaped', () => {
  const evil = `"x" & <b>y</b>`;
  const ctx = secCtx([T('2026-10-10', 'body', { type: evil })]);
  const o1 = ctx.beatTranscriptSection({ id: 'c1' });
  assert.ok(o1.includes('&quot;x&quot; &amp; &lt;b&gt;y&lt;/b&gt;'), 'type escaped in label');
  assert.ok(!o1.includes('<b>'));
  const o2 = secCtx([T('2026-10-10', 'body', { sessionNumber: evil })]).beatTranscriptSection({ id: 'c1' });
  assert.ok(o2.includes('Session &quot;x&quot; &amp; &lt;b&gt;y&lt;/b&gt;') && !o2.includes('<b>'), 'sessionNumber escaped');
  const id = `a"b&c<i>`;
  const ctx3 = vm.createContext({});
  vm.runInContext(['escapeHtml', 'escapeAttr', 'closingStretch', 'beatTranscriptSection'].map(grab).join('\n'), ctx3);
  vm.runInContext(`var DATA = {activities: {${JSON.stringify(id)}: [{date:'2026-10-10', type:'Call', transcript:{text:'t'}}]}};
    function isRealISODate(d){ return String(d || "").length === 10; } function fmtDate(d){ return d; } function isLoggedPastDate(){ return true; } function activityTranscript(a){ return a.transcript; }`, ctx3);
  const o3 = ctx3.beatTranscriptSection({ id });
  assert.ok(o3.includes('data-open-cust="a&quot;b&amp;c&lt;i&gt;"'), 'attribute value escaped');
  assert.ok(!o3.includes('<i>'));
});

test('closingStretch: headers, cues, bare timestamps and WEBVTT around the 30 cut are not counted; exact stretch returned', () => {
  const c = load();
  const junk = ['Name  00:12:34', '00:01:02 --> 00:01:04', '00:00:09', 'WEBVTT'];
  const lines = [];
  for (let i = 0; i < 35; i++) { lines.push(`sp ${i}`); if (i === 4 || i === 5 || i === 20) lines.push(...junk); }
  const start = lines.indexOf('sp 5');
  const expected = lines.slice(start).join('\n');
  const out = c(lines.join('\n'), 30);
  assert.equal(out, expected);
  assert.equal(speech(out).length, 30);
});
