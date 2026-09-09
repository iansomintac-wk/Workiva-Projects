# Today Tab — Phases 1 & 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the Today tab so today's calls lead it and Gainsight admin sits at the bottom, and restructure each beat's left column into Account state → Why → What do I do → Outstanding.

**Architecture:** `buildDayTimeline()` stops ordering beats by the clock and orders them by priority — all calls first (in clock order among themselves), then ranked work by severity. The five chronological movements collapse to two. The minutes maths that spaced work between calls survives as a one-line annotation on each work beat instead of as page structure. `renderToday()` moves `renderAdminGaps()` from third-from-top to below the day. The `.day-step` left column, currently four short lines centred in 72vh of height, gains a four-part structure that fills the height it already owns.

**Tech Stack:** Single-file vanilla HTML/CSS/JS (`osm-book-of-business-tracker-1.0.html`, 22,403 lines). No build step, no dependencies, no framework. Tests are an in-page `check()` suite run via `window.runSelfChecks()`.

**Spec:** `docs/superpowers/specs/2026-09-09-today-tab-account-read-design.md` (§1, §2, §3, §4)

## Global Constraints

- **Target file:** `osm-book-of-business-tracker-1.0.html`. Single file. No new files except `tools/selfcheck.mjs` (Task 1).
- **Baseline:** the suite passes **318/318** against a book seeded with `demo-seed.js`. On an unseeded profile it reports 314/318 — always seed.
- **No task may finish with the suite below its starting count.** Checks added by a task raise the expected count; state the new number in that task's verify step.
- **`DATA` shape is unchanged in these two phases.** No new persisted keys, no `CURRENT_SCHEMA_VERSION` bump, no migration.
- **`setTodayFocus()` (line 11731) reads `step.querySelector('h4')` and `step.querySelector('.ds-eyebrow')`** to build the screen-reader announcement. Both elements must survive every change to `.day-step`.
- **`.day-step` must keep `data-day-step`, `data-day-index`, `data-day-movement`.** They are read by `dayBeatIds()`, `syncDayPool()`, and the click binding at line 18753.
- **`min-height:72vh` on `.day-step` stays.** It is the scroll mechanic that drives which account the right panel shows, not decoration.
- **Every beat's `movementKey` base must exist in `DAY_MOVEMENT_MAP`** — asserted by the check at line 8189.
- **Motion budget and token discipline:** the file's HTML header carries editing rules. Read them before changing CSS. Use existing custom properties (`--text-sm`, `--space-2`, `--accent-info`, …); do not introduce raw colour or size literals.
- **Commit after each task.** Attribution lines are in this session's system context.
- **Known pre-existing defect, out of scope:** the impact check at line 7665 creates a `DATA.impact` key on books that lack one, which `v74.4` flags. Only visible on an unseeded profile. Do not fix here.

---

### Task 1: The headless self-check runner

Without this, every later task's verification step is "open Chrome and read the console." This makes the gate a command.

**Files:**
- Create: `tools/selfcheck.mjs`
- Modify: `.gitignore` (only if `tools/` is currently ignored — check first)

**Interfaces:**
- Consumes: nothing.
- Produces: `node tools/selfcheck.mjs <file.html> --seed demo-seed.js --expect <n>` → exits 0 when all checks pass and the count matches; exits 1 on any failure, count mismatch, or console error on load; exits 2 on harness failure (no Chrome, file missing, suite never appeared).

- [ ] **Step 1: Confirm Chrome and node's WebSocket are available**

```bash
ls "/c/Program Files/Google/Chrome/Application/chrome.exe"
node -e "console.log(typeof WebSocket)"
```

Expected: the path prints, and `function`. If Chrome is elsewhere, add its path to `CHROME_CANDIDATES` in Step 2.

- [ ] **Step 2: Create `tools/selfcheck.mjs`**

Drives Chrome over the DevTools Protocol. No npm install — node ≥ 22 has a global `WebSocket`.

```javascript
#!/usr/bin/env node
// Headless runner for the tracker's in-page self-check suite.
//   node tools/selfcheck.mjs [file.html] [--seed demo-seed.js] [--fn runSelfChecks] [--expect 318]
// Exit 0 when every check passes and the count matches --expect.
// NOT part of the distributable bundle — dev tooling, like docs/.

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const positional = args.filter((a, i) =>
  !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));

const target = resolve(positional[0] || 'osm-book-of-business-tracker-1.0.html');
const fnName = flag('fn', 'runSelfChecks');
const expect = flag('expect', null);
const PORT = Number(flag('port', 9333));

if (!existsSync(target)) { console.error(`No such file: ${target}`); process.exit(2); }
const chrome = CHROME_CANDIDATES.find(p => existsSync(p));
if (!chrome) { console.error('Could not find Chrome or Edge.'); process.exit(2); }

const profile = mkdtempSync(join(tmpdir(), 'selfcheck-'));
const child = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--allow-file-access-from-files',
  pathToFileURL(target).href,
], { stdio: ['ignore', 'ignore', 'pipe'] });

let chromeStderr = '';
child.stderr.on('data', d => { chromeStderr += String(d); });
const cleanup = () => {
  try { child.kill('SIGKILL'); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
};
process.on('exit', cleanup);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function findPage(deadline) {
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* not up yet */ }
    await sleep(120);
  }
  throw new Error('Chrome exposed no debuggable page.\n' + chromeStderr.slice(-800));
}

function rpc(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', ev => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve: res, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : res(msg.result);
    }
  });
  return (method, params = {}) => new Promise((res, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve: res, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

const page = await findPage(Date.now() + 20000);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', () => rej(new Error('CDP socket failed')), { once: true });
});
const send = rpc(ws);

const pageErrors = [];
await send('Runtime.enable');
ws.addEventListener('message', ev => {
  let m; try { m = JSON.parse(ev.data); } catch { return; }
  if (m.method === 'Runtime.exceptionThrown') {
    pageErrors.push(m.params.exceptionDetails?.exception?.description
      || m.params.exceptionDetails?.text || 'unknown exception');
  }
});

const readyDeadline = Date.now() + 30000;
let ready = false;
while (Date.now() < readyDeadline) {
  const r = await send('Runtime.evaluate', {
    expression: `document.readyState === 'complete' && typeof window[${JSON.stringify(fnName)}] === 'function'`,
    returnByValue: true,
  });
  if (r.result?.value === true) { ready = true; break; }
  await sleep(150);
}
if (!ready) {
  console.error(`window.${fnName}() never became available.`);
  if (pageErrors.length) console.error('Page errors:\n  ' + pageErrors.join('\n  '));
  process.exit(2);
}

const seedPath = flag('seed', null);
if (seedPath) {
  const seedSrc = readFileSync(resolve(seedPath), 'utf8');
  const seeded = await send('Runtime.evaluate', {
    expression: `(() => { try { ${seedSrc}
      ; if (typeof saveData === 'function') saveData();
      return 'ok:' + (DATA.customers ? DATA.customers.length : 0);
    } catch (e) { return 'err:' + String(e && e.message || e); } })()`,
    returnByValue: true, awaitPromise: true,
  });
  const v = String(seeded.result?.value || '');
  if (v.startsWith('err:')) { console.error('Seed failed: ' + v.slice(4)); process.exit(2); }
  console.log(`seeded ${v.slice(3)} accounts from ${seedPath}`);
}

const run = await send('Runtime.evaluate', {
  expression: `(() => {
    try {
      const r = window[${JSON.stringify(fnName)}]();
      const list = Array.isArray(r) ? r : (r && r.results) || [];
      return JSON.stringify({ ok: true, total: list.length,
        failed: list.filter(x => !x.ok).map(x => ({ name: x.name, detail: String(x.detail || '').slice(0, 300) })) });
    } catch (e) { return JSON.stringify({ ok: false, error: String(e && e.stack || e) }); }
  })()`,
  returnByValue: true, awaitPromise: true,
});

let out;
try { out = JSON.parse(run.result.value); }
catch { console.error('Suite returned an unreadable result:', run.result); process.exit(2); }
if (!out.ok) { console.error(`${fnName}() threw:\n${out.error}`); process.exit(1); }

const passed = out.total - out.failed.length;
console.log(`${fnName}: ${passed}/${out.total} passed, ${out.failed.length} failed`);
for (const f of out.failed) console.log(`  FAIL  ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
if (pageErrors.length) {
  console.log(`\n${pageErrors.length} console error(s) on load:`);
  for (const e of pageErrors) console.log('  ' + e.split('\n')[0]);
}

let code = out.failed.length ? 1 : 0;
if (expect !== null && out.total !== Number(expect)) {
  console.log(`\nExpected ${expect} checks, the suite defines ${out.total}.`);
  code = 1;
}
if (pageErrors.length) code = 1;
process.exit(code);
```

- [ ] **Step 3: Establish the baseline**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 318
```

Expected, exactly:
```
seeded 17 accounts from demo-seed.js
runSelfChecks: 318/318 passed, 0 failed
```
Exit code 0. **If this does not print 318/318, stop and report — do not begin Task 2.** Every later gate is measured against this number.

- [ ] **Step 4: Confirm the runner actually fails when it should**

A gate that cannot fail is not a gate. Run it against a deliberately wrong expectation:

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 999; echo "exit=$?"
```

Expected: reports `318/318 passed`, then `Expected 999 checks, the suite defines 318.`, `exit=1`.

- [ ] **Step 5: Commit**

```bash
git add tools/selfcheck.mjs
git commit -m "test: headless CDP runner for the self-check suite

Drives Chrome over the DevTools Protocol with no npm dependencies.
Seeds a demo book first: three checks (v81 band, two v94 Copilot) need
a populated book, so a fresh profile reports 314/318 rather than 318.

Baseline: 318/318 with --seed demo-seed.js."
```

---

### Task 2: Calls lead the day

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html:15174-15182` (`DAY_MOVEMENT_DEFS`)
- Modify: `osm-book-of-business-tracker-1.0.html:15281-15307` (movement assembly in `buildDayTimeline()`)
- Modify: `osm-book-of-business-tracker-1.0.html:15212-15230` (delete `fitBeatsToSlots()`)
- Test: same file, new checks near line 8195 (after the `v72 one account gets exactly one beat` check)

**Interfaces:**
- Consumes: `callsScheduledToday()`, `todayActionList()`, `DAY_BEAT_MAX`, `DAY_CALL_LENGTH_MIN`, `dayTimeToMinutes()`, `fmtDayTime()`, `fmtGapMinutes()`.
- Produces: `buildDayTimeline()` returns the same object shape as before — `{beats, movements, calls, list, workBeats, heldIds, spilled, sev4, totalMin, timed, untimed}` — with two changes: `movements` now contains at most two entries with keys `calls` and `work`, and each work beat carries a new string field `gapNote` (empty when no measurable gap applies). `annotateGapFit(workBeats, callBeats)` is new and sets `gapNote` in place.

- [ ] **Step 1: Write the failing checks**

Insert immediately after the `check('v72 one account gets exactly one beat, …')` block closes (after line 8195, `})();`):

```javascript
  (function(){
    /* Phase 1: the day is ordered by PRIORITY, not by the clock. A booked call
       is the only item on this tab with another person attached to it, so every
       call leads regardless of what time it starts. The 15:30 call used to sit
       below three hours of ranked work; it does not any more. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevFocus = ui.todayFocusId;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = (id, extra) => { const c = Object.assign({id, name:'Ord'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}, extra || {});
        backfillCustomerRecord(c); return c; };
      // A late call and an early one, plus three accounts that only rank as work.
      const cs = [mk('__o1__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'15:30'}),
                  mk('__o2__'), mk('__o3__'),
                  mk('__o4__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'09:30'}),
                  mk('__o5__')];
      DATA.customers = cs;
      DATA.activities = cs.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      const kinds = day.beats.map(b => b.kind);
      const lastCall = kinds.lastIndexOf('call');
      const firstWork = kinds.indexOf('work');
      // (a) No work beat may precede any call beat.
      const callsLead = lastCall === -1 || firstWork === -1 || lastCall < firstWork;
      // (b) Calls keep clock order among themselves.
      const callOrder = day.beats.filter(b => b.kind === 'call').map(b => b.customerId);
      const clockOrder = JSON.stringify(callOrder) === JSON.stringify(['__o4__','__o1__']);
      // (c) At most two movements, both known to the registry.
      const keys = day.movements.map(m => m.mkey);
      const twoMovements = keys.length <= 2 && keys.every(k => DAY_MOVEMENT_MAP[k]);
      ok = callsLead && clockOrder && twoMovements;
      detail = JSON.stringify({kinds, callOrder, keys, callsLead, clockOrder, twoMovements});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.todayFocusId = prevFocus;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase1 every call leads the day, in clock order, in at most two movements', ok, detail);
  })();
  (function(){
    /* The minutes maths survives as an ANNOTATION, never as a guess. A day with
       fewer than two timed calls has no measurable gap, and must say nothing
       rather than invent one. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = (id, extra) => { const c = Object.assign({id, name:'Gap'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}, extra || {});
        backfillCustomerRecord(c); return c; };
      // Two timed calls three hours apart -> a real 120-minute gap after the call length.
      const two = [mk('__g1__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'09:00'}),
                   mk('__g2__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'12:00'}),
                   mk('__g3__'), mk('__g4__')];
      DATA.customers = two;
      DATA.activities = two.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const withGap = buildDayTimeline();
      const annotated = withGap.beats.filter(b => b.kind === 'work' && b.gapNote);
      const mentionsBothTimes = annotated.length > 0
        && annotated.every(b => b.gapNote.indexOf('9:00') !== -1 || b.gapNote.indexOf('09:00') !== -1);
      // One timed call -> nothing to measure between, so no note at all.
      const one = [mk('__h1__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'09:00'}),
                   mk('__h2__'), mk('__h3__')];
      DATA.customers = one;
      DATA.activities = one.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const noGap = buildDayTimeline();
      const silent = noGap.beats.filter(b => b.kind === 'work').every(b => !b.gapNote);
      ok = mentionsBothTimes && silent;
      detail = JSON.stringify({annotated: annotated.map(b=>b.gapNote), mentionsBothTimes, silent});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase1 a gap note appears only where two timed calls actually bound one', ok, detail);
  })();
```

- [ ] **Step 2: Run the suite to verify the new checks fail**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 319
```

Expected: `317/319 passed, 2 failed`, naming both `phase1` checks. Exit 1.

The first fails because work currently interleaves with calls and there are five movement keys. The second fails because `gapNote` does not exist yet — every beat's is `undefined`, so `annotated.length` is 0 and `mentionsBothTimes` is false.

- [ ] **Step 3: Replace `DAY_MOVEMENT_DEFS`**

Replace lines 15174–15181 (the array literal, keeping the comment above it) with:

```javascript
const DAY_MOVEMENT_DEFS = [
  {key:'calls', label:'Your calls today',
    note:'The fixed points of your day. What happened last time, what you still owe, and what this session is meant to produce.'},
  {key:'work',  label:'Everything else needing you',
    note:'Ranked by severity. Nothing here is waiting on a clock, but the book says it needs you.'},
  {key:'close', label:'The close',
    note:'Everything you queued today, pushed in one go.'}
];
```

**Then amend the one check that asserts a deleted label.** At line **8228**, inside `v72 an untimed day renders no clock time and states that it has none`:

```javascript
      const ordinal = html.indexOf('Before your first call') !== -1;
```
becomes:
```javascript
      const ordinal = html.indexOf('Your calls today') !== -1;
```

Do **not** delete that check — its other two assertions (`noClock`, `saysSo`) guard the rule that an untimed day never renders an invented clock time, which this task does not change.

Also update the comment directly above `DAY_MOVEMENT_DEFS` — it currently claims "a no-call day and a five-call day produce different timelines from the same registry," which stays true, but the chronological framing does not. Replace that comment with:

```javascript
/* The movements of the day. Two, plus the close: calls lead because a booked
   call is the only item on this tab with another person attached to it, then
   everything the book ranked. A movement with no beats is omitted entirely
   rather than shown empty. This replaced a five-movement chronological set
   (preface / call / gap / after / run) at phase 1 — the clock stopped driving
   page order, and the gap maths moved onto the beats as annotation. */
```

- [ ] **Step 4: Add `annotateGapFit()` and retire `fitBeatsToSlots()` and its checks**

`fitBeatsToSlots()` is called by two live self-checks at lines **8242** and **8250**. Deleting the function without them throws a ReferenceError inside the suite. Do all three edits in this step.

**(a)** Delete the whole `(function(){ … })();` block containing both `fitBeatsToSlots` calls — the one whose comment begins *"Gap fitting is pure, so it is tested directly rather than through a render."* It defines two checks:
- `v72 gap fitting places every beat and marks the slots that filled`
- `v72 an untimed day places all work in its one movement`

Both assert the contract of the mechanism this task replaces. The second is superseded by the new `phase1 a gap note appears only where two timed calls actually bound one` check.

**(b)** In its place, put a direct unit test of the replacement — same intent, pure, no render:

```javascript
  (function(){
    /* Gap annotation is pure, so it is tested directly rather than through a
       render. The contract that matters: work fills a slot, then moves to the
       next one — and a beat that fits in no measurable slot is left SILENT
       rather than given an invented gap. This replaced the fitBeatsToSlots
       tests at phase 1, when the minutes maths stopped structuring the day. */
    const calls = [{at:'09:00'}, {at:'12:00'}, {at:'13:30'}];
    // 09:00->12:00 leaves 120 free after a 60-minute call; 12:00->13:30 leaves 30.
    const beats = [1,2,3,4].map(n => ({customerId:'g'+n, effortMin:60}));
    annotateGapFit(beats, calls);
    const noted = beats.filter(b => b.gapNote);
    const firstSlotTook = beats.filter(b => b.gapNote.indexOf('12:00pm') !== -1).length;
    check('phase1 gap annotation fills a slot, advances, and never invents a gap',
      noted.length === 2 && firstSlotTook === 2 && !beats[2].gapNote && !beats[3].gapNote,
      JSON.stringify(beats.map(b => b.gapNote)));
  })();
```

**(c)** Then delete `fitBeatsToSlots()` itself (lines 15212–15230, including its comment) and put this in its place:

```javascript
/* Where a work beat would fit between two of today's calls. The minutes maths
   that used to STRUCTURE the day now annotates it: same arithmetic, no longer
   deciding page order. Sets b.gapNote in place; empty string when the book
   cannot measure a gap, because a guessed gap is worse than no gap. */
function annotateGapFit(workBeats, callBeats){
  workBeats.forEach(b => { b.gapNote = ''; });
  const timed = callBeats.filter(b => b.at)
    .slice()
    .sort((x,y) => dayTimeToMinutes(x.at) - dayTimeToMinutes(y.at));
  if(timed.length < 2) return;
  const slots = [];
  for(let i = 0; i < timed.length - 1; i++){
    const a = dayTimeToMinutes(timed[i].at), z = dayTimeToMinutes(timed[i+1].at);
    if(a === null || z === null) continue;
    const cap = Math.max(0, z - a - DAY_CALL_LENGTH_MIN);
    if(cap > 0) slots.push({from: timed[i].at, to: timed[i+1].at, cap, used: 0});
  }
  if(!slots.length) return;
  let i = 0;
  workBeats.forEach(b => {
    while(i < slots.length && slots[i].used + b.effortMin > slots[i].cap) i++;
    if(i >= slots.length) return;
    slots[i].used += b.effortMin;
    b.gapNote = `fits your ${fmtDayTime(slots[i].from)}–${fmtDayTime(slots[i].to)} gap · ~${fmtGapMinutes(b.effortMin)}`;
  });
}
```

- [ ] **Step 5: Rewrite the movement assembly in `buildDayTimeline()`**

Replace the whole block from `// 4. Build the movements, then fit the unmerged work into the gaps.` down to and including the `fitBeatsToSlots(keptWork, movements.filter(m => !m.isCall));` line (lines 15281–15300) with:

```javascript
  // 4. Two movements, in priority order. Calls first — every one of them, in
  //    clock order — then the ranked work. The clock no longer decides page
  //    order; it survives only as the gap note on each work beat.
  const movements = [];
  const mk = (key, extra) => Object.assign({}, DAY_MOVEMENT_MAP[key], {mkey: key}, extra || {});
  annotateGapFit(keptWork, callBeats);
  if(callBeats.length) movements.push(mk('calls', {isCall:true, capacity:null, beats: callBeats}));
  if(keptWork.length)  movements.push(mk('work',  {capacity:null, beats: keptWork}));
```

The `beats` array is built by the existing loop directly below this, which walks `movements` in order — so it now emits calls first, then work, with no further change.

- [ ] **Step 6: Simplify the movement heading in `renderDay()`**

`capacity` is now always `null` and `full` is never set, so the `cap` and `m.full` branches are dead. In `renderDay()` (line 15777), replace the `const cap = …` line and the `head` template with:

```javascript
    const load = m.beats.length ? `${m.beats.length} ${m.beats.length===1?'item':'items'} · roughly ${m.beats.reduce((n,b)=>n+b.effortMin,0)} min` : '';
    const head = `
      <div class="day-move" data-movement="${escapeAttr(m.mkey)}" data-movement-label="${escapeAttr(m.label)}">
        <h3 class="dm-eyebrow">${escapeHtml(m.label)}</h3>
        <div class="dm-load">${escapeHtml(load)}</div>
        <p class="dm-note">${escapeHtml(m.note)}${m.mkey === 'work' && day.spilled ? ` ${day.spilled} more ranked below the day.` : ''}</p>
      </div>`;
```

Delete the now-unused `const cap = …` declaration above it.

- [ ] **Step 7: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 319
```

Expected: `319/319 passed, 0 failed`. Exit 0.

If `v72 no account appears both in the day and below it` or `v72 a call-heavy day shows every call` regress, the cause is almost certainly Step 5 dropping `keptWork` or `callBeats` — both must reach `movements`, and `spilledWork` must still be deleted from `byCust` above.

- [ ] **Step 8: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -m "feat(today): calls lead the day, in two movements

The day was ordered by the clock, so a 15:30 call sat below three hours
of ranked work. A booked call is the only item on the tab with another
person attached to it. Calls now lead in clock order, then ranked work
by severity, in two movements instead of five.

fitBeatsToSlots() is replaced by annotateGapFit(): the same minutes
arithmetic, moved from page structure onto the beat as a note, and
silent where the book cannot measure a gap.

319/319."
```

---

### Task 3: Gainsight admin moves to the bottom

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html:15925-15940` (the `return` template of `renderToday()`)
- Test: same file, new check near line 8105 (after the `v69 Today no longer renders the removed surfaces` check)

**Interfaces:**
- Consumes: `renderAdminGaps()`, `renderDay()`, `renderToday()` — all unchanged in signature.
- Produces: nothing new. `renderToday()` returns the same sections in a different order.

- [ ] **Step 1: Write the failing check**

Insert after the `check('v69 Today no longer renders the removed surfaces', …)` block closes:

```javascript
  (function(){
    /* Phase 1: the day comes before the paperwork. "Records to bring up to date"
       is the least time-critical block on the tab and it occupied the third
       screen position; it now sits below the day. Asserted on RENDERED ORDER,
       not on source order, because the source order of a template literal is
       not what the user sees. */
    const prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = JSON.parse(JSON.stringify(prevLog || {}));
      const html = renderToday();
      const dayAt   = html.indexOf('class="day"');
      const adminAt = html.indexOf('Records to bring up to date');
      // A book with no admin gaps renders no admin block at all — that is not a
      // failure, it is the hide-when-empty rule, so only assert when both exist.
      ok = dayAt !== -1 && (adminAt === -1 || adminAt > dayAt);
      detail = JSON.stringify({dayAt, adminAt});
    }catch(err){ detail = err.message; }
    DATA.riskLog = prevLog;
    check('phase1 Records to bring up to date renders below the day', ok, detail);
  })();
```

- [ ] **Step 2: Run the suite to verify it fails**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 320
```

Expected: `319/320 passed, 1 failed` — `phase1 Records to bring up to date renders below the day`, with a detail showing `adminAt` smaller than `dayAt`. Exit 1.

- [ ] **Step 3: Reorder the return template**

In `renderToday()`, replace the returned template with:

```javascript
  return `
    <div>
      ${renderDayStanding(day)}
      ${readiness}
      ${renderDay(day, dispatchChips)}
      ${restBlock}
      ${resolvedBanner}
      ${pausedStrip}
      ${riskStrip}
      ${renderAdminGaps()}
      ${day.beats.length ? renderDayClose(day) : ''}
      ${emptyState}
      ${allClear}
    </div>
  `;
```

Nothing else in the function changes — `renderAdminGaps()` is still called exactly once, so the v94 check asserting `String(renderToday).indexOf('renderAdminGaps') !== -1` stays green.

- [ ] **Step 4: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 320
```

Expected: `320/320 passed, 0 failed`. Exit 0.

- [ ] **Step 5: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -m "feat(today): move Gainsight admin below the day

'Records to bring up to date' is 49 records of the least time-critical
work on the tab, and it held the third screen position above the day.
It now renders after the day and its strips, before the close.

320/320."
```

---

### Task 4: `accountStateLabel()`

Small and standalone, so Task 5 can consume it without also debugging it.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html:5366` (beside `riskLabel()`)
- Test: same file, new check beside the existing risk-label checks

**Interfaces:**
- Consumes: `computeRisk(customer)` → `'risk' | 'watch' | anything else`.
- Produces: `accountStateLabel(customer)` → `'Off Track' | 'Needs Attention' | 'On Track'`. Display only. Does **not** replace `riskLabel()`.

- [ ] **Step 1: Write the failing check**

Insert immediately after the `check('v70 calls-today lists only sessions scheduled for today', …)` block closes:

```javascript
  (function(){
    /* Phase 2: the beat states the account in the OSM's words. This is a DISPLAY
       wrapper and nothing more — riskLabel() keeps its 19 call sites, and the
       string 'Watch' stays intact because the risk taxonomy COMPARES against it
       (item.kind === 'Watch'), so renaming it globally would be a silent
       string-matching break for a cosmetic gain. */
    const map = {risk:'Off Track', watch:'Needs Attention', ok:'On Track'};
    const bad = [];
    Object.keys(map).forEach(r => {
      const got = accountStateLabel({__forceRisk: r});
      if(got !== map[r]) bad.push(`${r} -> ${got}, wanted ${map[r]}`);
    });
    // riskLabel must be untouched by this addition.
    const riskLabelIntact = riskLabel('risk') === 'Off Track'
      && riskLabel('watch') === 'Watch' && riskLabel('ok') === 'On Track';
    check('phase2 accountStateLabel names the three states and leaves riskLabel alone',
      bad.length === 0 && riskLabelIntact,
      bad.join(' | ') + (riskLabelIntact ? '' : ' | riskLabel changed'));
  })();
```

- [ ] **Step 2: Run the suite to verify it fails**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 321
```

Expected: `320/321 passed, 1 failed` — `accountStateLabel is not defined`. Exit 1.

- [ ] **Step 3: Add the function**

Insert directly below `riskLabel()` at line 5366:

```javascript
/* The three words the OSM actually uses for an account, for the Today beat.
   riskLabel() stays exactly as it is: 'Watch' is a COMPARISON VALUE in the risk
   taxonomy (item.kind === 'Watch'), so renaming it there would break matching
   silently. This is display only. __forceRisk is a test seam — a plain object
   with that key resolves without a full customer record. */
function accountStateLabel(customer){
  const r = (customer && customer.__forceRisk) || computeRisk(customer);
  return r === 'risk' ? 'Off Track' : r === 'watch' ? 'Needs Attention' : 'On Track';
}
```

- [ ] **Step 4: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 321
```

Expected: `321/321 passed, 0 failed`. Exit 0.

- [ ] **Step 5: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -m "feat: accountStateLabel() for the Today beat

On Track / Needs Attention / Off Track. A display wrapper over
computeRisk(); riskLabel() and its 19 call sites are untouched, because
'Watch' is also a comparison value in the risk taxonomy.

321/321."
```

---

### Task 5: The beat's left column

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html:15795-15810` (the `.day-step` template in `renderDay()`)
- Modify: `osm-book-of-business-tracker-1.0.html:869-886` (`.day-step` and `.ds-*` CSS)
- Test: same file, new check after the Task 2 checks

**Interfaces:**
- Consumes: `accountStateLabel(c)` (Task 4), `healthScore(c)`, `collectOpenQuestions(c)`, `beat.reasons`, `beat.headline`, `beat.gapNote` (Task 2), `storyChapterFor()`.
- Produces: `beatOutstanding(c)` → `{questions: n, deliverables: n, text: string}`. `text` is `''` when both counts are zero.

- [ ] **Step 1: Write the failing check**

Insert after the two `phase1` checks from Task 2:

```javascript
  (function(){
    /* Phase 2: every beat answers four questions — what state is this account in,
       why is it here, what do I do, and what is outstanding. A beat that renders
       a name and nothing else is the whitespace problem this replaced. Also
       guards the two DOM hooks setTodayFocus() reads for its screen-reader
       announcement: an <h4> and a .ds-eyebrow inside every .day-step. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevFocus = ui.todayFocusId;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = (id, extra) => { const c = Object.assign({id, name:'Beat'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}, extra || {});
        backfillCustomerRecord(c); return c; };
      const cs = [mk('__b1__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'09:30'}),
                  mk('__b2__'), mk('__b3__')];
      DATA.customers = cs;
      DATA.activities = cs.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      const html = renderDay(day, () => '');
      const steps = html.split('class="day-step').slice(1);
      const states = ['On Track','Needs Attention','Off Track'];
      const everyStepComplete = steps.length === day.beats.length && steps.every(s =>
        states.some(st => s.indexOf(st) !== -1)   // state
        && s.indexOf('ds-why-list') !== -1        // why
        && s.indexOf('ds-do') !== -1              // what do I do
        && s.indexOf('<h4') !== -1                // setTodayFocus reads this
        && s.indexOf('ds-eyebrow') !== -1);       // and this
      // The drivers list is capped at four; a fifth must be counted, not printed.
      const overCap = steps.some(s => (s.match(/<li/g) || []).length > 4);
      ok = everyStepComplete && !overCap;
      detail = JSON.stringify({steps: steps.length, beats: day.beats.length, everyStepComplete, overCap});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.todayFocusId = prevFocus;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase2 every beat states account state, why, and what to do', ok, detail);
  })();
```

- [ ] **Step 2: Run the suite to verify it fails**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 322
```

Expected: `321/322 passed, 1 failed` — `everyStepComplete:false`, because no beat renders a state or a `ds-why-list`. Exit 1.

- [ ] **Step 3: Add `beatOutstanding()`**

Insert directly above `renderDay()` (before line 15763):

```javascript
/* What this account is still waiting on you for, counted from the record. Both
   numbers are COUNTED, never estimated — the tab's standing rule. Empty text
   when there is nothing outstanding, so the row hides rather than printing a
   zero. */
function beatOutstanding(c){
  if(!c) return {questions:0, deliverables:0, text:''};
  const questions = collectOpenQuestions(c).length;
  let deliverables = 0;
  (DATA.activities[c.id] || []).forEach(a => (a.checklist || []).forEach(i => { if(!i.done) deliverables++; }));
  const bits = [];
  if(questions) bits.push(`${questions} open question${questions===1?'':'s'}`);
  if(deliverables) bits.push(`${deliverables} deliverable${deliverables===1?'':'s'}`);
  return {questions, deliverables, text: bits.join(' · ')};
}
```

- [ ] **Step 4: Rewrite the `.day-step` template**

In `renderDay()`, replace the `return \`<div class="day-step …\`` template inside the `m.beats.map(...)` callback with:

```javascript
      const c = DATA.customers.find(x => x.id === b.customerId);
      const out = beatOutstanding(c);
      const drivers = b.reasons.slice(0, 4);
      const moreDrivers = b.reasons.length - drivers.length;
      return `
        <div class="day-step ${b.customerId === ui.todayFocusId ? 'active' : ''}"
             data-day-step="${escapeAttr(b.customerId)}" data-day-index="${idx}"
             data-day-movement="${escapeAttr(m.label)}">
          <div class="ds-eyebrow">${idx+1} of ${day.beats.length} · ${b.kind === 'call' ? (b.at ? escapeHtml(fmtDayTime(b.at)) + ' call' : 'call · time not set') : escapeHtml(ch.label)}</div>
          <h4>${escapeHtml(b.customerName)}</h4>
          <dl class="ds-facts">
            <dt>State</dt>
            <dd>${c ? escapeHtml(accountStateLabel(c)) : 'Unknown'}${c && !inImplementation(c) ? ` <span class="ds-faint">· ${healthScore(c)}% health</span>` : ''}</dd>
            ${drivers.length ? `
              <dt>Why</dt>
              <dd><ul class="ds-why-list">${drivers.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
                ${moreDrivers > 0 ? `<span class="ds-faint">+ ${moreDrivers} more reason${moreDrivers===1?'':'s'} in the panel</span>` : ''}</dd>` : ''}
            <dt>What do I do</dt>
            <dd class="ds-do">${escapeHtml(b.headline || (b.call && b.call.next ? b.call.next.template.title : 'Prep this call'))}</dd>
            ${out.text ? `<dt>Outstanding</dt><dd>${escapeHtml(out.text)}</dd>` : ''}
          </dl>
          <div class="ds-why ds-faint">${b.severity === 4 ? '<span class="ds-flag">top severity</span> · ' : ''}about ${b.effortMin} minutes${b.kind === 'call' && b.call && !b.call.prepped ? ' · no prep notes yet' : ''}${b.gapNote ? ` · ${escapeHtml(b.gapNote)}` : ''}</div>
          ${first ? `<div class="day-note">${escapeHtml(ch.note)}</div>` : ''}
        </div>`;
```

Note `${b.gapNote ? …}` — this is where Task 2's annotation surfaces.

- [ ] **Step 5: Add the `.ds-facts` CSS and stop centring the beat**

Replace the `.day-step{…}` rule at line 869 and add the new rules after `.ds-flag` (line 886):

```css
  /* A beat. Owns real height — that is the whole reason the mechanic works.
     flex-start, not center: with four rows of content the beat's height now
     varies, and centring made every beat shift vertically as you walked the
     day. The height stays; what fills it changed. */
  .day-step{min-height:72vh; display:flex; flex-direction:column; justify-content:flex-start;
    padding:20px 0; opacity:.62; transition:opacity var(--transition); cursor:pointer;}
```

**Do not add top padding here.** `flex-start` alone is the change. Any `vh`-based
top padding is multiplied across every beat and pushes the first call down the
page — which is exactly what Task 7 then has to claw back.

```css
  /* The four questions a beat answers. A definition list because that is what
     this is — term and value — and it gives screen readers the pairing free. */
  .ds-facts{display:grid; grid-template-columns:minmax(0,10ch) minmax(0,1fr);
    gap:6px var(--space-2); margin:14px 0 0; max-width:52ch;}
  .ds-facts dt{font-family:var(--font-mono); font-size:var(--text-xs); letter-spacing:.06em;
    text-transform:uppercase; color:var(--text-faint); padding-top:2px;}
  .ds-facts dd{margin:0; font-size:var(--text-sm); color:var(--text); min-width:0; overflow-wrap:anywhere;}
  .ds-facts dd.ds-do{font-weight:700;}
  .ds-why-list{margin:0; padding-left:16px; color:var(--text-dim);}
  .ds-why-list li{margin-bottom:3px;}
  @media (max-width: 900px){
    .ds-facts{grid-template-columns:1fr; gap:2px;}
    .ds-facts dt{margin-top:8px;}
  }
```

The compact-density override at line 834 sets `.day[data-density="compact"] .day-step{min-height:0; padding:var(--space-2) 0;}`, so compact mode is unaffected. Verify by eye in Step 7.

- [ ] **Step 6: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 322
```

Expected: `322/322 passed, 0 failed`. Exit 0.

- [ ] **Step 7: Look at it in a real browser**

The suite cannot see layout. Open the file in Chrome, run `demo-seed.js` in the console, and confirm by eye:

1. Story density: a beat shows State / Why / What do I do / Outstanding, and the four rows fill most of the beat's height rather than floating in the middle.
2. Compact density: rows are still compact — the `12vh` padding must not appear.
3. `J` / `K` still walk the day and the right panel follows.
4. Narrow the window below 900px: the `dl` stacks to one column and nothing overflows horizontally.

- [ ] **Step 8: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -m "feat(today): the beat answers four questions

The left column owned 72vh and spent it on a name, a headline and one
reason, centred — most of the height was empty. It now states account
state, up to four drivers, the one recommended action, and what is
outstanding, as a definition list.

justify-content goes center -> flex-start: with variable content height,
centring made every beat shift vertically as you walked the day.

322/322."
```

---

### Task 6: De-duplicate the beat panel

The left column now carries the headline, the drivers and the state. The right panel still prints all three.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html:15547-15560` (the `Why this one` block in `renderBeatPanel()`)
- Test: same file, new check after the Task 5 check

**Interfaces:**
- Consumes: `beat.row`, `dispatchChips(row)`, `SIGNAL_KEY_SET` — unchanged.
- Produces: nothing new. `renderBeatPanel()` keeps its signature.

- [ ] **Step 1: Write the failing check**

```javascript
  (function(){
    /* Phase 2: the headline and the drivers moved LEFT. The panel printing them
       again put the same two sentences on screen twice, a few hundred pixels
       apart. The panel keeps the evidence — severity basis, signal key, the
       dispatch chips — and drops the restatement. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const c = {id:'__dup__', name:'Dupe Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__dup__: []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      const beat = day.beats[0];
      if(!beat) throw new Error('no beat built for the duplication check');
      const panel = renderBeatPanel(beat, () => '');
      // The headline is the left column's line. It must appear at most once in
      // the panel, and not as a restated heading.
      const headline = beat.headline || '';
      // An empty headline would make the duplication test pass trivially, so the
      // check fails loudly instead of quietly asserting nothing.
      if(!headline) throw new Error('beat has no headline — this check cannot test duplication');
      const times = panel.split(headline).length - 1;
      const keepsEvidence = panel.indexOf('Severity') !== -1 || panel.indexOf('signal') !== -1;
      ok = times === 0 && keepsEvidence;
      detail = JSON.stringify({headline, timesInPanel: times, keepsEvidence});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase2 the panel carries evidence, not a restatement of the beat', ok, detail);
  })();
```

- [ ] **Step 2: Run the suite to verify it fails**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 324
```

Expected: `323/324 passed, 1 failed` — `timesInPanel` is 1 or more. Exit 1.

- [ ] **Step 3: Replace the `Why this one` block with an evidence block**

In `renderBeatPanel()`, replace the `${row ? \`<div class="focus-act">…\`` block with:

```javascript
    ${row ? `
      <div class="focus-act">
        <h5>The evidence ${row.severity ? `<span class="badge ${row.severity>=3?'badge-risk':row.severity===2?'badge-watch':''}" title="${escapeAttr(row.why || '')}">Sev ${row.severity}/4</span>` : ''}</h5>
        <p class="bp-basis" style="margin:0 0 8px;">Severity ${row.severity} of 4 · ${row.signalKey ? `signal <span style="font-family:var(--font-mono);">${escapeHtml(row.signalKey)}</span>` : escapeHtml(row.source)}. The reason this account is on your day is stated beside it; this is what the tracker read to get there.</p>
        ${dispatchChips(row)}
        ${row.signalKey && SIGNAL_KEY_SET.has(row.signalKey) ? `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button class="btn btn-sm" data-rec-done="${c.id}|${row.signalKey}">Done</button>
            <button class="btn btn-sm" data-rec-dismiss="${c.id}|${row.signalKey}">Not this</button>
          </div>
          <p class="bp-basis">“Done” suppresses this signal for up to 7 days or until it clears. “Not this” asks for a reason and Today picks again.</p>` : ''}
      </div>` : ''}
```

The removed parts are the `<div style="font-size:var(--text-base)…">${escapeHtml(beat.headline)}</div>` line and the `<ul>` of `beat.reasons` — both now live in the left column.

- [ ] **Step 4: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 324
```

Expected: `324/324 passed, 0 failed`. Exit 0.

- [ ] **Step 5: Verify the buttons still work in a browser**

`data-rec-done` and `data-rec-dismiss` write to the account. Open in Chrome, seed, click **Done** on a beat that has a signal, and confirm the signal is suppressed and the day reorders. This is the one interaction in this task that the suite does not exercise end to end.

- [ ] **Step 6: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -m "refactor(today): the panel keeps evidence, not a restatement

The headline and drivers moved to the left column in the previous task,
and the panel was still printing both a few hundred pixels away. 'Why
this one' becomes 'The evidence': severity basis, signal key, dispatch
chips, Done / Not this.

323/323."
```

---

### Task 7: Compress the top band

Last, because it is the only task whose success criterion is measured in pixels, and it should be judged against the finished beat.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html:15328-15370` (`renderDayStanding()`)
- Modify: `osm-book-of-business-tracker-1.0.html:16364-16379` (`renderReadinessStrip()`)
- Modify: `osm-book-of-business-tracker-1.0.html` — the `.onb` CSS rules

**Interfaces:**
- Consumes: `bookReadiness()`, `day` — unchanged.
- Produces: both functions keep their signatures and return values; only their markup shrinks.

- [ ] **Step 1: Measure the current position**

Open the file in Chrome at a 900px-tall viewport, seed with `demo-seed.js`, and run in the console:

```javascript
const el = document.querySelector('#day .day-step');
console.log('first beat top:', Math.round(el.getBoundingClientRect().top));
```

Record the number. **The goal is to get this below 900.** The two `NNN` slots in this task's commit message are the before and after values you measured — fill them in, so the change is measured rather than asserted.

- [ ] **Step 2: Make the readiness strip one line**

In `renderReadinessStrip()`, replace the returned template with:

```javascript
  return `
    <div class="onb onb-compact" data-onb="${escapeAttr(g.key)}">
      <div class="onb-body">
        <p class="onb-h">${escapeHtml(g.headline)} <button class="link-btn" data-onb-expand="${escapeAttr(g.key)}">why this matters</button></p>
        ${ui.onbExpanded === g.key ? `<p class="onb-p">${g.detail}</p>` : ''}
      </div>
      <div class="onb-actions">
        <button class="btn btn-sm" data-onb-dismiss="${escapeAttr(g.key)}">Not now</button>
        <button class="btn btn-sm btn-primary" data-onb-act="${escapeAttr(g.action)}">${escapeHtml(g.actionLabel)}</button>
      </div>
    </div>`;
```

The detail sentence is not deleted — it is one click away, and the v87 ruling that the caveat comes first is preserved because the headline and both actions still render above the day.

- [ ] **Step 3: Add the expand state and its handler**

Add to the `ui` object (near `todayCollapsed` at line 6991):

```javascript
  onbExpanded: null,   // transient, never persisted — which readiness detail is open
```

Add to `attachEvents()`, beside the existing `data-onb-dismiss` binding:

```javascript
  $$('[data-onb-expand]').forEach(b => b.addEventListener('click', () => {
    ui.onbExpanded = ui.onbExpanded === b.dataset.onbExpand ? null : b.dataset.onbExpand;
    render();
  }));
```

- [ ] **Step 4: Reclaim the padding, not the type**

**Do not change `--text-3xl` or `.day-standing h2`'s font size.** Line 121 marks it "the ONE place big type is spent," and check 8414 asserts the scale descends `--text-3xl (standing) > --text-2xl (beat) > --text-xl (close)`. Shrinking it fights a deliberate ruling and can break that check. The space is in the padding.

Line 383:
```css
  .day-standing{padding:26px 0 18px;}
```
becomes:
```css
  .day-standing{padding:14px 0 12px;}
```

Line 862:
```css
  .day-move{padding:34px 0 4px; max-width:48ch; min-width:0;}
```
becomes:
```css
  .day-move{padding:18px 0 4px; max-width:48ch; min-width:0;}
```

Together with Step 2 that is roughly 74px, against a readiness strip that was
costing about 40 on its own. Do not guess at the total — measure it in Step 5.

- [ ] **Step 5: Re-measure**

Re-run the measurement from Step 1.

Expected: **the first beat's top is below 900.** If it is not, report the number reached rather than claiming success — the remaining options are the standing's margin and `.day-move`'s `padding:34px 0 4px`, and which to spend is a judgement call worth surfacing.

- [ ] **Step 6: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 324
```

Expected: `324/324 passed, 0 failed`. Exit 0.

The v87 readiness checks assert the strip renders and its actions are reachable, not its height, so they stay green. If one fails, it is asserting on markup this step changed — read it before changing it.

- [ ] **Step 7: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -m "feat(today): compress the top band so the first call is on screen

The standing and the readiness strip together pushed the first beat to
NNNpx at a 900px viewport. The readiness detail sentence moves behind
'why this matters', and the standing and movement headings give back
padding; first beat top is now NNNpx.

The v87 ruling holds: the readiness caveat still renders above anything
the tracker claims to know, headline and both actions intact.

323/323."
```

---

## Deliberately deferred

Spec §4 specifies the finished panel order: header → the account read → payload
by beat kind → Gainsight gates → risk. **Only the de-duplication (Task 6) lands
here.** The account read is Phase 3 and the session plan is Phase 4, so there is
nothing yet to reorder the gates *below* — moving them now would demote them
under a block that does not exist. The panel keeps its current order minus the
restatement, and the reorder happens in the phase that supplies the content.

Also not in these two phases, and not gaps: `ACCOUNT_READ_DEFS`, the AI
narrative, the outcome recommender, CSAT autopopulation, the CSV extension, the
editable session plan, and the early-transition signal.

## Verification of the whole plan

After Task 7, from a clean checkout of the branch:

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 324
node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18
```

Expected: `324/324` and `18/18`, both exit 0. The guide is unchanged by this work; running it confirms nothing leaked across the bundle.

Then, by eye in Chrome with `demo-seed.js` and with `demo-seed-today.js` (which seeds calls scheduled for today — the seed that actually exercises Phase 1):

1. Today's calls lead the tab, in clock order.
2. Ranked work follows under one heading.
3. "Records to bring up to date" is below the day.
4. Each beat states State / Why / What do I do / Outstanding.
5. A work beat placed in a real gap between two timed calls carries its gap note.
6. The right panel shows evidence, and does not restate the beat's headline.
7. `J` / `K` walk the day; the panel follows; the screen-reader line still announces.

`VALIDATION.txt` records 318/318 at 1.0 and is now stale. Updating it is part of shipping, not of this plan — leave it, and say so when handing back.

## Notes for the executor

- **The file is 22,403 lines and its header carries editing rules.** Read them before the first edit. Each rule exists because something broke.
- **Line numbers in this plan are from the pre-Task-1 file** and drift as you edit. Anchor on the function name or a unique string, never the number alone.
- **`renderToday()` stamps `DATA.riskLog`** via the risk-hygiene strip. Any check that calls it must snapshot and restore, or hand it a throwaway — `v74.4` will catch you if you forget, and it is watching the whole book, not one collection.
- **Do not "fix" the impact-key leak** noted in Global Constraints. It is real, it is pre-existing, and it is out of scope.
- **If a task's check passes on the first run, stop.** It means the check is not testing what you think it is. Make it fail before you make it pass.
