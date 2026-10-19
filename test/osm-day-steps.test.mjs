import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BREAKS, OVERRIDE_NAMES } from '../tools/sim/osm-day/lib/breaks.mjs';

const IDS = ['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11'];
const FILES = ['1.0', '1.1'].map(v => [v, readFileSync(new URL(`../osm-book-of-business-tracker-${v}.html`, import.meta.url), 'utf8')]);

test('BREAKS holds exactly the 21 checked ids and none for L12', () => {
  assert.deepEqual(Object.keys(BREAKS).sort(), [...IDS].sort());
  assert.equal(BREAKS.L12, undefined);
});
test('every js ends with its own marker, and D5 is the AI break', () => {
  for (const id of IDS) {
    if (id === 'D5') { assert.deepEqual(BREAKS.D5, { ai: 'noEmail' }); continue; }
    assert.ok(BREAKS[id].js.trim().endsWith(`window.__simBreak='${id}'`), id);
  }
});
test('every js parses', () => {
  for (const id of IDS) if (BREAKS[id].js) assert.doesNotThrow(() => new Function(BREAKS[id].js), id);
});
test('each override name is a function in both trackers', () => {
  assert.ok(OVERRIDE_NAMES.length >= 18);
  for (const [v, html] of FILES) for (const n of OVERRIDE_NAMES) assert.ok(html.includes(`function ${n}(`), `${v} ${n}`);
});
test('isGraduatingSoon uses days <= 30 in both trackers', () => {
  for (const [v, html] of FILES) {
    const i = html.indexOf('function isGraduatingSoon(');
    assert.ok(i >= 0, v);
    assert.match(html.slice(i, i + 600), /days <= 30/, v);
  }
});

test('99-measure.js no longer reads the retired time-saved log (F2)', () => {
  const t = readFileSync(new URL('../tools/sim/steps/99-measure.js', import.meta.url), 'utf8');
  assert.doesNotMatch(t, /getImpactLog/);
  assert.doesNotMatch(t, /impactMinutesFor/);
});

test('PART_A holds D1..D10 in order, each async and CHECKED (Task 8)', async () => {
  const { PART_A } = await import('../tools/sim/osm-day/steps-a.mjs');
  const { CHECKED } = await import('../tools/sim/osm-day/lib/results.mjs');
  assert.deepEqual(PART_A.map(s => s.id), ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10']);
  for (const s of PART_A) assert.ok(CHECKED.includes(s.id), s.id);
  for (const s of PART_A) assert.equal(s.run.constructor.name, 'AsyncFunction', s.id);
});
test('PART_A_DEPS says D5 needs D4 and nothing else depends', async () => {
  const { PART_A_DEPS } = await import('../tools/sim/osm-day/steps-a.mjs');
  assert.deepEqual(PART_A_DEPS, { D5: ['D4'] });
});
test('setupA and setupB are exported; setupB never mentions Fernhollow', async () => {
  const { setupA, setupB } = await import('../tools/sim/osm-day/lib/setup.mjs');
  assert.equal(typeof setupA, 'function');
  assert.equal(typeof setupB, 'function');
  assert.doesNotMatch(setupB.toString(), /Fernhollow/);
  assert.match(setupA.toString(), /Fernhollow Renewables/);
});

test('daysBetween counts whole days between ISO dates (Task 9)', async () => {
  const { daysBetween } = await import('../tools/sim/osm-day/steps-b.mjs');
  assert.equal(daysBetween('2026-10-05', '2026-10-12'), 7);
  assert.equal(daysBetween('2026-10-12', '2026-10-05'), -7);
  assert.equal(daysBetween('2026-08-31', '2026-09-01'), 1);
});
test('CAL holds the Part B calendar for L1..L6', async () => {
  const { CAL } = await import('../tools/sim/osm-day/steps-b.mjs');
  assert.equal(CAL.L1, '2026-08-03');
  assert.equal(CAL.L2, '2026-08-05');
  assert.equal(CAL.L3, '2026-08-12');
  assert.deepEqual([CAL.L4.build, CAL.L4.uat], ['2026-08-24', '2026-09-21']);
  assert.equal(CAL.L5, '2026-10-05');
  assert.deepEqual([CAL.L6.from, CAL.L6.to], ['2026-10-06', '2026-10-26']);
});
test('PART_B holds L1..L12 in order, each async, CHECKED except L12 (Task 10)', async () => {
  const { PART_B } = await import('../tools/sim/osm-day/steps-b.mjs');
  const { CHECKED } = await import('../tools/sim/osm-day/lib/results.mjs');
  assert.deepEqual(PART_B.map(s => s.id), ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12']);
  for (const s of PART_B) { assert.equal(CHECKED.includes(s.id), s.id !== 'L12', s.id); assert.equal(s.run.constructor.name, 'AsyncFunction', s.id); }
});
test('committedDate and l10Day follow the Part B chronology (Task 10)', async () => {
  const { committedDate, l10Day } = await import('../tools/sim/osm-day/steps-b.mjs');
  assert.equal(committedDate('2026-12-07', 6), '2027-01-11');
  assert.equal(committedDate('2026-12-07', 1), '2026-12-07');
  assert.equal(l10Day('2027-01-11'), '2027-01-04');
});
test('PART_B_ORDER runs L9 phase 1, L10, L9 phase 2, L11 in date order after L8', async () => {
  const { PART_B_ORDER, PART_B } = await import('../tools/sim/osm-day/steps-b.mjs');
  const i = PART_B_ORDER.indexOf('L8');
  assert.deepEqual(PART_B_ORDER.slice(i + 1, i + 5), ['L9.phase1', 'L10', 'L9.phase2', 'L11']);
  assert.deepEqual(PART_B.map(s => s.id).filter(id => ['L9', 'L10', 'L11'].includes(id)), ['L9', 'L10', 'L11']);
});

// ---- Task 11: runner (run.mjs) ----
test('parseArgs reads flags, marks partial, and defaults to a full run (Task 11)', async () => {
  const { parseArgs } = await import('../tools/sim/osm-day/run.mjs');
  assert.deepEqual(parseArgs(['--version', '1.1', '--part', 'A', '--no-breaks']),
    { versions: ['1.1'], parts: ['A'], breaks: false, partial: true, only: null });
  assert.deepEqual(parseArgs([]), { versions: ['1.0', '1.1'], parts: ['A', 'B'], breaks: true, partial: false, only: null });
  assert.equal(parseArgs(['--version', '1.0']).partial, false);
  assert.deepEqual(parseArgs(['--only', 'D4,D5']).only, ['D4', 'D5']);
  assert.equal(parseArgs(['--only', 'D4']).partial, true);
  assert.equal(parseArgs(['--out', 'x']).out, 'x');
  assert.throws(() => parseArgs(['--bogus']), /unknown/i);
  assert.throws(() => parseArgs(['--version', '2.0']), /version/i);
  assert.throws(() => parseArgs(['--only', 'D99']), /D99/);
});
test('prerequisites runs the earlier steps first, and D4 before D5 (Task 11)', async () => {
  const { prerequisites } = await import('../tools/sim/osm-day/run.mjs');
  assert.deepEqual(prerequisites(['L7']), ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']);
  const p10 = prerequisites(['L10']);
  assert.ok(p10.includes('L9.phase1')); assert.ok(!p10.includes('L9.phase2')); assert.ok(!p10.includes('L10'));
  assert.deepEqual(prerequisites(['L1']), []);
  assert.deepEqual(prerequisites(['D4']), []);
  assert.deepEqual(prerequisites(['D5']), ['D4']);
  assert.deepEqual(prerequisites(['D4', 'D5']), []);
  for (const id of ['D1', 'D2', 'D3', 'D6', 'D7', 'D8', 'D9', 'D10']) assert.deepEqual(prerequisites([id]), [], id);
});
test('exit code: a full run missing a step or break is 2, scoped runs are valid (Task 11)', async () => {
  const { exitCode, STEP_IDS, CHECKED } = await import('../tools/sim/osm-day/lib/results.mjs');
  const steps = STEP_IDS.map(id => ({ id, status: id === 'L12' ? 'GAP' : 'PASS' }));
  const breaks = CHECKED.map(id => ({ id, verdict: 'FLIPPED' }));
  assert.equal(exitCode({ steps, breaks }), 0);
  assert.equal(exitCode({ steps: steps.slice(1), breaks }), 2);
  assert.equal(exitCode({ steps, breaks: breaks.slice(1) }), 2);
  assert.equal(exitCode({ steps: [{ id: 'D5', status: 'PASS' }], breaks: [], scope: { ids: ['D5'], breaks: false } }), 0);
  assert.equal(exitCode({ steps: [{ id: 'D5', status: 'PASS' }], breaks: [{ id: 'D5', verdict: 'FLIPPED' }], scope: { ids: ['D5'], breaks: true } }), 0);
});
test('checkEscaped throws when any AI request escaped the fake, which is exit 2 (FR4)', async () => {
  const { checkEscaped } = await import('../tools/sim/osm-day/run.mjs');
  const { exitCode } = await import('../tools/sim/osm-day/lib/results.mjs');
  assert.doesNotThrow(() => checkEscaped({ fake: 3, escaped: 0 }, 'x'));
  assert.throws(() => checkEscaped({ fake: 3, escaped: 1 }, 'x'), /escaped/);
  assert.equal(exitCode({ steps: [], breaks: [], scope: { ids: [], breaks: false }, harnessError: 'AI requests escaped' }), 2);
});
test('D3 guard needs seeded SIM-OWE entries, all gone after, the rest unchanged (round 4)', async () => {
  const { d3Guard } = await import('../tools/sim/osm-day/run.mjs');
  const before = '<h4>Call prep</h4><li>SIM-OWE a</li><li>SIM-OWE b</li><p>SIM-QUESTION q</p><h4>Open questions</h4>';
  const good = before.replace(/SIM-OWE[^<]*/g, '');
  assert.deepEqual(d3Guard(before, good), []);
  assert.ok(d3Guard('<h4>Call prep</h4><p>SIM-QUESTION q</p><h4>Open questions</h4>', good).length, 'no seeded entries');
  assert.ok(d3Guard(before, before).length, 'entries still present');
  assert.ok(d3Guard(before, '<h4>Call prep</h4>').length, 'panel emptied');
  assert.ok(d3Guard(before, good.replace('SIM-QUESTION q', '')).length, 'question lost');
});
test('D4 and D6 guards flag lost surrounding content (round 4)', async () => {
  const { d4Guard, d6Guard } = await import('../tools/sim/osm-day/run.mjs');
  const b4 = { found: true, count: 4, summary: 'SIM-D4 call', hasTranscript: true };
  assert.deepEqual(d4Guard(b4, { found: true, count: 4, summary: 'SIM-D4 call', hasTranscript: false }), []);
  assert.ok(d4Guard(b4, { found: false, count: 3, summary: null, hasTranscript: false }).length);
  assert.ok(d4Guard(b4, { found: true, count: 4, summary: 'changed', hasTranscript: false }).length);
  const base = [{ text: 'SIM-OWE x', doneOn: null }, { text: 'SIM-D6 y', doneOn: '2026-10-21' }];
  assert.deepEqual(d6Guard(base, [{ text: 'SIM-OWE x', doneOn: null }, { text: 'SIM-D6 y', doneOn: null }]), []);
  assert.ok(d6Guard(base, [{ text: 'SIM-D6 y', doneOn: null }]).length, 'other commitment lost');
  assert.ok(d6Guard(base, [{ text: 'SIM-OWE x', doneOn: '2026-10-21' }, { text: 'SIM-D6 y', doneOn: null }]).length, 'other commitment changed');
});
test('L6 break is VACUOUS when a Fernhollow Today row remains through day 7 (round 4)', async () => {
  const { l6Remaining } = await import('../tools/sim/osm-day/run.mjs');
  assert.deepEqual(l6Remaining('x remainingThroughDay7=[]'), []);
  assert.deepEqual(l6Remaining('x remainingThroughDay7=[2026-10-09: Fernhollow | silence ;; 2026-10-10: F | r] y'), ['2026-10-09: Fernhollow | silence', '2026-10-10: F | r']);
  assert.deepEqual(l6Remaining('no marker'), []);
});
test('N and T recompute guard compares restored state with saved data (Task 11)', async () => {
  const { ntFromCustomer, ntMismatch } = await import('../tools/sim/osm-day/steps-b.mjs');
  assert.deepEqual(ntFromCustomer({ totalSessions: 6, targetGraduationDate: '2027-01-11' }), { N: 6, T: '2027-01-11' });
  assert.equal(ntMismatch({ N: 6, T: '2027-01-11' }, { N: 6, T: '2027-01-11' }), null);
  assert.match(ntMismatch({ N: 6, T: '2027-01-11' }, { N: 5, T: '2027-01-11' }), /N/);
  assert.match(ntMismatch({ N: 6, T: '2027-01-11' }, { N: 6, T: '2027-01-12' }), /T/);
});

import { mkdtempSync, writeFileSync, utimesSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as pjoin } from 'node:path';
import { resolveUnderSimRuns, filesSince } from '../tools/sim/osm-day/lib/outdir.mjs';

test('resolveUnderSimRuns accepts a folder under sim-runs and rejects outside, sibling and sim-runs itself', () => {
  const root = pjoin(tmpdir(), 'rootx');
  assert.ok(resolveUnderSimRuns(pjoin(root, 'sim-runs', 'a', 'b'), root).includes('sim-runs'));
  assert.throws(() => resolveUnderSimRuns(pjoin(tmpdir(), 'elsewhere'), root));
  assert.throws(() => resolveUnderSimRuns(pjoin(root, 'sim-runs-evil', 'x'), root));
  assert.throws(() => resolveUnderSimRuns(pjoin(root, 'sim-runs'), root));
  assert.throws(() => resolveUnderSimRuns(pjoin(root, 'sim-runs', '..', 'x'), root));
});
test('filesSince finds a pre-seeded same-name file only when its mtime is after the click', () => {
  const d = mkdtempSync(pjoin(tmpdir(), 'dl-'));
  try {
    const f = pjoin(d, 'backup.json');
    writeFileSync(f, '{}');
    const old = new Date(Date.now() - 60000);
    utimesSync(f, old, old);
    const t0 = Date.now() - 1000;
    assert.deepEqual(filesSince(d, t0, '.json'), []);
    writeFileSync(f, '{"x":1}'); // same name rewritten by the new download
    assert.deepEqual(filesSince(d, t0, '.json'), ['backup.json']);
    assert.deepEqual(filesSince(d, t0, '.txt'), []);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// ---- X3: clipboard sentinel, setup errors are harness errors ----------------------------------
function fakeClipCtx({ stale, copyWrites, armFails }) {
  let clip = stale;
  const recap = 'SIM recap line one\nline two';
  return {
    state: { d4: { customerId: 'c1', activityId: 'a1' } },
    aiStats: () => ({ fake: 1, escaped: 0 }),
    openOn: async () => {},
    click: async sel => { if (copyWrites && /copy-debrief-email/.test(sel)) clip = recap; },
    armClipboard: async () => { if (armFails) throw new Error('clipboard setup failed: denied'); clip = 'SIM-CLIP-SENTINEL-x'; },
    readClipboard: async () => clip,
    ev: async src => {
      if (/clipboard\.readText/.test(src)) return clip;
      if (/data-debrief-email-text.*\.value/.test(src)) return recap;
      if (/querySelector\('\[data-debrief-email-text/.test(src)) return true;
      return true;
    },
  };
}
test('X3 D5 negative control: stale clipboard equal to the recap plus a no-op click is FAIL', async () => {
  const { PART_A } = await import('../tools/sim/osm-day/steps-a.mjs');
  const d5 = PART_A.find(s => s.id === 'D5');
  const r = await d5.run(fakeClipCtx({ stale: 'SIM recap line one\nline two', copyWrites: false }));
  assert.equal(r.passed, false, r.evidence);
});
test('X3 D5 passes when the click really writes the recap, and a clipboard setup error throws', async () => {
  const { PART_A } = await import('../tools/sim/osm-day/steps-a.mjs');
  const d5 = PART_A.find(s => s.id === 'D5');
  assert.equal((await d5.run(fakeClipCtx({ stale: 'old', copyWrites: true }))).passed, true);
  await assert.rejects(d5.run(fakeClipCtx({ stale: 'old', copyWrites: true, armFails: true })), /clipboard setup failed/);
});
test('B1 launch source: no OS clipboard permission is requested', () => {
  const t = readFileSync(new URL('../tools/sim/osm-day/lib/browser.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(t, /grantPermissions/);
});

// ---- B1 redo: the sim never touches the OS clipboard; a page hook records what the tracker copies ----
test('B1 no sim source reads or writes the OS clipboard', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const dir = new URL('../tools/sim/osm-day/', import.meta.url);
  const walk = u => readdirSync(u).flatMap(f => { const c = new URL(f, u); return statSync(c).isDirectory() ? walk(new URL(f + '/', u)) : [c]; });
  const bad = walk(dir).filter(u => /readText|clipboardReadWrite/.test(readFileSync(u, 'utf8')));
  assert.deepEqual(bad.map(String), []);
});
test('B1 clipboardShim records writeText, write and execCommand copy into a page variable seeded with the sentinel', async () => {
  const { clipboardShim } = await import('../tools/sim/osm-day/lib/browser.mjs');
  const { runInNewContext } = await import('node:vm');
  const sel = { value: 'abcdef', selectionStart: 1, selectionEnd: 4 };
  const win = { navigator: {}, document: { activeElement: sel, execCommand: () => false, getSelection: () => ({ toString: () => '' }) } };
  win.window = win;
  runInNewContext(clipboardShim('SIM-SENTINEL-t'), win);
  assert.equal(win.__simClip, 'SIM-SENTINEL-t');
  await win.navigator.clipboard.writeText('hello');
  assert.equal(win.__simClip, 'hello');
  win.__simClip = 'SIM-SENTINEL-t';
  assert.equal(win.document.execCommand('copy'), true);
  assert.equal(win.__simClip, 'bcd');
  const blob = { text: async () => 'from-item' };
  await win.navigator.clipboard.write([{ types: ['text/plain'], getType: async () => blob }]);
  assert.equal(win.__simClip, 'from-item');
});
test('B1 D5 no-op Copy click leaves the sentinel, so D5 FAILs and the evidence shows it', async () => {
  const { PART_A } = await import('../tools/sim/osm-day/steps-a.mjs');
  const d5 = PART_A.find(s => s.id === 'D5');
  let clip = null;
  const ctx = fakeClipCtx({ stale: 'x', copyWrites: false });
  ctx.armClipboard = async () => { clip = 'SIM-SENTINEL-z'; };
  ctx.readClipboard = async () => clip;
  const r = await d5.run(ctx);
  assert.equal(r.passed, false);
  assert.match(r.evidence, /SIM-SENTINEL-z/);
});

// ---- X4: D4 resolves the stored transcript per version; the snapshot carries the 1.1 transcripts store ----
test('X4 transcript resolver reads inline .text (1.0) and the IndexedDB record by ref (1.1)', async () => {
  const { TRANSCRIPT_TEXT_JS } = await import('../tools/sim/osm-day/steps-a.mjs');
  const { runInNewContext } = await import('node:vm');
  const fn = runInNewContext(TRANSCRIPT_TEXT_JS, { tsGet: async ref => (ref === 'a1:abc' ? { ref, text: 'SIM-D4-TRANSCRIPT stored' } : undefined) });
  assert.match(await fn({ transcript: { text: 'SIM-D4-TRANSCRIPT inline' } }), /inline/);
  assert.match(await fn({ transcript: { ref: 'a1:abc', chars: 9 } }), /stored/);
  assert.equal(await fn({ transcript: { ref: 'nope' } }), '');
  assert.equal(await fn({}), '');
});
test('X4 snapshot and seed restore carry the transcripts store', async () => {
  const { TRANSCRIPTS_DUMP_JS, transcriptsRestoreJs } = await import('../tools/sim/osm-day/lib/browser.mjs');
  const { runInNewContext } = await import('node:vm');
  const store = [{ ref: 'a1:abc', text: 'T1' }, { ref: 'a2:def', text: 'T2' }];
  const win = { tsOpen: async () => ({}), tsTx: async (name, mode, f) => {
    if (mode === 'readonly') return store.slice();
    f({ clear: () => { store.length = 0; return {}; }, put: r => { store.push(r); return {}; } }); } };
  // the dump reads through the page's own tsTx getAll; the restore clears and puts each record
  const dump = JSON.parse(await runInNewContext(TRANSCRIPTS_DUMP_JS, { ...win, JSON, tsTx: async () => store.slice() }));
  assert.deepEqual(dump, store.slice());
  const saved = JSON.stringify(dump); store.length = 0;
  await runInNewContext(transcriptsRestoreJs(saved), { ...win, JSON });
  assert.deepEqual(store.map(r => r.ref).sort(), ['a1:abc', 'a2:def']);
});

// ---- X5: D7 reports the relation, not the tracker's random id ----
function fakeD7Ctx(rowId, externalId) {
  const queued = { id: rowId, status: 'queued', kind: 'Pending items batch' };
  const sent = { ...queued, status: 'sent', externalId };
  return {
    openOn: async () => {}, click: async () => {},
    ev: async src => {
      if (/connectorConfigured/.test(src)) return true;
      if (/^!!/.test(src)) return false;
      if (/customers\.find.*\.id$/.test(src)) return 'c1';
      if (/JSON\.stringify\(getGainsightQueue/.test(src)) return JSON.stringify(sent);
      if (/JSON\.stringify\(\(\(\) =>/.test(src)) return JSON.stringify(queued);
      return true;
    },
  };
}
test('X5 D7 evidence states the relation and carries no random id, whatever the id is', async () => {
  const { PART_A } = await import('../tools/sim/osm-day/steps-a.mjs');
  const d7 = PART_A.find(s => s.id === 'D7');
  const a = await d7.run(fakeD7Ctx('q7k2m9x4pz', 'SIM-EXT-q7k2m9x4pz'));
  const b = await d7.run(fakeD7Ctx('w1e8r5t3yu', 'SIM-EXT-w1e8r5t3yu'));
  assert.equal(a.passed, true, a.evidence);
  assert.equal(a.evidence, b.evidence);
  assert.doesNotMatch(a.evidence, /SIM-EXT-[a-z0-9]{6,}/);
  assert.match(a.evidence, /matches own row id/);
  const bad = await d7.run(fakeD7Ctx('q7k2m9x4pz', 'SIM-EXT-other'));
  assert.equal(bad.passed, false);
  assert.match(bad.evidence, /does not match own row id/);
});
test('X5 verify C5 compares unmasked: no SIM-EXT mask remains', () => {
  const t = readFileSync(new URL('../tools/sim/osm-day/verify.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(t, /SIM-EXT/);
});

// ---- X6/X7/X8: L11 clicks OK with no contact; L7 judged on the rendered Today; L5 plan on Fernhollow's Sessions panel ----
test('X6 L11 judge: OK enabled with no contact is clicked and the state after the click decides; no refusal FAILs', async () => {
  const { l11Judge } = await import('../tools/sim/osm-day/steps-b.mjs');
  const line = 'No CSAT contact is marked added, so nobody will receive the survey. You can still graduate.';
  const nc = { g0: { csatDone: false, contact: '' }, hasLine: true, text: line, okDisabled: false, clicked: true, stage: 'graduated', queued: 2 };
  const wc = { g1: { csatDone: true, contact: 'Dana Reyes' }, hasLine: false, text: '' };
  const ok = l11Judge({ withContact: wc, noContact: nc });
  assert.equal(ok.passed, true, ok.evidence);
  assert.match(ok.evidence, /with contact/i); assert.match(ok.evidence, /no contact/i); assert.match(ok.evidence, /#gc-csat/);
  assert.match(ok.evidence, /stage graduated/); assert.match(ok.evidence, /queue items 2/);
  // the judge reads the line by id and non-empty text, never the exact words
  assert.equal(l11Judge({ withContact: wc, noContact: { ...nc, text: 'x' } }).passed, true);
  // one property changed per case; every other value stays at the passing value
  const fails = (label, w, n) => assert.equal(l11Judge({ withContact: w, noContact: n }).passed, false, label);
  fails('no line (hasLine only)', wc, { ...nc, hasLine: false });
  fails('blank text only', wc, { ...nc, text: '   ' });
  fails('okDisabled only', wc, { ...nc, okDisabled: true });
  fails('clicked only', wc, { ...nc, clicked: false });
  fails('stage only', wc, { ...nc, stage: 'active' });
  fails('queued only', wc, { ...nc, queued: 0 });
  fails('no-contact readback says done:true', wc, { ...nc, g0: { csatDone: true, contact: '' } });
  fails('no-contact readback has a name', wc, { ...nc, g0: { csatDone: false, contact: 'Dana Reyes' } });
  fails('line shown with a contact (w.hasLine only)', { ...wc, hasLine: true }, nc);
  fails('with-contact leg not really with a contact (w.g1.csatDone only)', { ...wc, g1: { csatDone: false, contact: 'Dana Reyes' } }, nc);
  fails('leg 1 missing', null, nc);
  fails('both legs done:true (the setup write never happened)', wc, { ...nc, g0: { csatDone: true, contact: 'Dana Reyes' } });
});
test('X6 L11 break targets the CSAT check, not confirmGraduation', () => {
  assert.doesNotMatch(BREAKS.L11.js, /confirmGraduation/);
  assert.match(BREAKS.L11.js, /openGraduationConfirmModal/);
  assert.match(BREAKS.L11.js, /gc-csat/);
  assert.doesNotMatch(BREAKS.L11.js, /validateGraduationDraft/);
  assert.ok(OVERRIDE_NAMES.includes('openGraduationConfirmModal'));
});
test('X7 L7 judge: leaks are silence sources only; rank and rendered are reported for the last day', async () => {
  const { l7Judge } = await import('../tools/sim/osm-day/steps-b.mjs');
  const day = (d, o) => ({ d, silence: [], paused: true, regulatory: 0, rank: null, rendered: false, capHidden: false, ...o });
  const quiet = [day('2026-11-30', { paused: false }), day('2026-12-01', { paused: false, silence: ['coverage_x'], rank: 4, rendered: true })];
  const a = l7Judge(quiet, { until: '2026-11-30', to: '2026-12-01' });
  assert.equal(a.passed, true, a.evidence);
  assert.match(a.evidence, /rank 4/);
  assert.match(a.evidence, /rendered true/);
  assert.doesNotMatch(a.evidence, /paused=false/);
  const leak = l7Judge([day('2026-11-30', { silence: ['session_due'] }), quiet[1]], { until: '2026-11-30', to: '2026-12-01' });
  assert.equal(leak.passed, false);
  assert.match(leak.evidence, /session_due/);
  const notPausedOnly = l7Judge([day('2026-11-30', { paused: false }), quiet[1]], { until: '2026-11-30', to: '2026-12-01' });
  assert.equal(notPausedOnly.passed, true);
});
test('X8 L5 planShown reads Fernhollow Sessions panel and ignores the implementation preview', async () => {
  const { sessionsPlanShown } = await import('../tools/sim/osm-day/steps-b.mjs');
  const live = { panelTitle: 'Fernhollow Renewables', cardTitles: ['Session 1: Kickoff', 'Session 2: Data'], text: 'Curriculum for CSRD' };
  assert.equal(sessionsPlanShown(live), true);
  assert.equal(sessionsPlanShown({ ...live, text: 'the curriculum below is a PREVIEW and starts at Go-Live' }), false);
  assert.equal(sessionsPlanShown({ ...live, panelTitle: 'Other Co' }), false);
  assert.equal(sessionsPlanShown({ ...live, cardTitles: [] }), false);
  assert.equal(sessionsPlanShown(null), false);
});
test('X7 L7 judge: the silence row must be on screen on the first day after the pause, not just named in body text', async () => {
  const { l7Judge } = await import('../tools/sim/osm-day/steps-b.mjs');
  const day = (d, o) => ({ d, silence: [], paused: true, regulatory: 0, rank: null, rendered: false, capHidden: false, onScreen: false, ...o });
  const cal = { until: '2026-11-30', to: '2026-12-01' };
  const mk = onScreen => [day('2026-11-30'), day('2026-12-01', { paused: false, silence: ['coverage_x'], rank: 28, rendered: true, capHidden: !onScreen, onScreen })];
  const hidden = l7Judge(mk(false), cal);
  assert.equal(hidden.passed, false, hidden.evidence);
  assert.match(hidden.evidence, /on screen false/);
  const shown = l7Judge(mk(true), cal);
  assert.equal(shown.passed, true, shown.evidence);
});
