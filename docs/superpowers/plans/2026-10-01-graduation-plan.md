# Graduation Plan: goals → gates → One Document, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking. **One plan task per fresh build subagent, never in parallel. A fresh checker follows each task, and the lead re-runs the check command itself.** Results go to the ledger `docs/superpowers/2026-10-01-graduation-plan-LEDGER.md`. Logs go to `.artifacts/grad-plan/` (git-ignored), never into context.

**Goal:** Each account carries a primary hand-off goal (plus optional secondaries) with readiness gates copied from per-book defaults. Graduation records an OSM verdict and, for an early exit, a reason. The CSM packet leads with the goal verdicts.

**Architecture:** There is a new `c.goals[]` record and a `c.exit` record on each customer, and a `config.goalGates` map on the book (schema 13 → 14, through the `migrateData` chain). The pure domain functions (create, change, gate ticks, verdict, graduation draft validation) sit next to the data section and are what the self-checks drive. The UI (goal panel, goal form modal, graduation confirm modal, Settings block) only calls them. Two new `SIGNAL_DEFS` entries (`goal_changed`, `ready_to_graduate`) are state-based and have no thresholds.

**Tech Stack:** a single-file HTML/JS app (`osm-book-of-business-tracker-1.0.html`, about 26.5k lines) with in-page self-checks (`window.runSelfChecks()`). Headless-Chrome runners: `tools/selfcheck.mjs` and `tools/migration-dryrun.mjs`.

**Spec:** `docs/superpowers/specs/2026-10-01-graduation-plan-design.md` (§3 data, §4 flows, §5 One Document, §7 split, acceptance A1–A8). Rulings R1–R12 are final.

## Global Constraints

- **Docs change in the same commit as the code they describe.** `README.txt:74`, `VALIDATION.txt:47` and `CHANGELOG.txt:36` quote the suite count. Every task that adds checks updates all three in its own commit. Task 7 also adds the README and CHANGELOG prose.
- **Never commit `docs/research/internal/`** (it is git-ignored; never `git add -f` it). Stage files by explicit path, never `git add -A` or `git add .`.
- **Send nothing to any service.** There are no new network calls, AI calls or Gainsight transport. Gainsight items only go into the existing local queue (`queueGainsightItem`, which stays transport-free; G07 stays open).
- **Financial Reporting and GRC default gates stay EMPTY** (`[]` for all four types). That changes only when Ian supplies the content (R10). A self-check (Task 1, c1d) pins this.
- **Follow the existing patterns:** the `migrateData` chain (`if(v === 13){ … v = 14; }`), normalisers in the style of `normalizeGradReview` (`osm…html:3321`), `SIGNAL_DEFS` for signals (header rule 3: never hand-wire a signal into a consumer), the `HANDOFF_IN_FIELDS` registry (`:3441`), the Gainsight to-do queue (`queueGainsightItem`, `:17915`), and the settings draft pair `parseSettingsDraft` / `applySettingsDraft` (`:24095`, `:24138`).
- **The new signals have no numeric or day thresholds.** Neither `detect` reads `daysSince`, `DATA.config.*Days` or a count constant. Source-scan checks assert this for both signals (Task 3 c3d, Task 4 c4g).
- Header rules (lines 1–35 of the tracker) apply: targeted edits only, never rewrite the file; font sizes and colours come only from `:root` tokens; new shape means a schema bump plus a `migrateData` step; do **not** extend `backfillCustomerRecord` to *create* new-shape fields. It may only *normalise* them when they are present, exactly as it does for `gradReview` at `:25233`.
- **Line numbers drift.** Every `:NNNN` below was measured at `e780666`. Grep for the symbol before editing.
- **Suite purity.** The suite's last checks (v61, v74.4, v74.5 at `:15445-15495`) fail if a check leaves `DATA` changed, or if the book's key set differs at any `check()` call. Every new check swaps `DATA.customers` (and `DATA.gainsightQueue` / `DATA.config.goalGates` when touched) inside `try`, restores them in `finally`, and only then calls `check()`. If `DATA.gainsightQueue` did not exist at entry, the check deletes it again.
- **TDD house rule.** Each new check is written first. It is wrapped in `try/catch` so that a missing function shows up as a FAIL with `detail = err.message` rather than a crash of the suite, and it is seen red before any production code is written. Each task also records one mutation proof in `VALIDATION.txt` (mutate production code, show the named check go red, restore). New checks are inserted as one block, "Graduation Plan", directly above the comment `// Last two checks on purpose` (`:15445`).
- Suite command: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect <N> > .artifacts/grad-plan/sc.log 2>&1; tail -2 .artifacts/grad-plan/sc.log`
- Guide suite (must stay 18/18): `node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18 > .artifacts/grad-plan/g.log 2>&1; tail -1 .artifacts/grad-plan/g.log`
- Out of scope (spec §6, "left for later"): G01, G06–G12, G17, G19–G24, and FR/GRC gate content.

## Suite count per task (estimates; the builder sets the exact number and updates this table in its commit)

| After task | New checks (ids) | Suite `--expect` (ESTIMATE) |
|---|---|---|
| baseline (measured 2026-10-01 by the run lead) | — | 389 |
| 1 | c1a–c1g | 396 (measured) |
| 2 | c2a–c2g (c2f, c2g added by the Task 2 fix) | 403 (measured) |
| 3 | c3a–c3d | 407 (measured) |
| 4 | c4a–c4h (c4i, c4j added by the Task 4 fix) | 417 (measured) |
| 5 | c5a–c5e | 422 (measured) |
| 6 | c6a–c6c | 427 (measured; 425 + c6d, c6e from the task 6 fix) |
| 7 | none in-page; the scenario run is a separate 6-check run (A3–A8) | 427 |

## Plan-level choices (made here, because the spec is silent; Ian may overrule them before build 1)

- **P1: the graduation confirm sits at the three UI paths, not inside `changeStage`.** `changeStage` (`:7697`) is synchronous and is called by self-checks (`:14414`, `:14429-14430`) and by the Excel import (`:26377`). A modal cannot open inside it. A new `requestStageChange(c, key)` wraps the kanban drop (`:22269`), the table select (`:22298`) and the panel `#stage-select` (`:23047`). The import keeps calling `changeStage` directly, so an imported graduation records no verdict, and the packet then shows "Primary goal: none recorded".
- **P2: `goal_changed` has severity 2 and sits immediately before `late_gate`** in `SIGNAL_DEFS`. It has an `action`, because Today only shows a signal that can headline (`todayAccountCandidates`, `:18866-18877`). The spec gives no severity.
- **P3: the change reason is stored on the OLD goal** (`changeReason`, next to `verdict:'replaced'`). The spec says the old goal "closes as replaced with a reason". "Created by a change" is derived: some goal has `supersededBy === primary.id`. Nothing extra is stored.
- **P4: "health" needs no change.** `healthScore` (`:6809-6816`) reads domain scores and compliance only, never sessions. The `sessionsNotNeeded` rule therefore touches the tally sites and pace (`projectedGraduationDate`) only.
- **P5: goal events reach the Gainsight queue at the UI layer** through one helper, `commitGoalEvent`, rather than inside the domain functions. That keeps the domain functions free of side effects, so the suite's purity guards hold for every goal check.
- **P6: CSRD keys.** `config.goalGates` carries the five `DEFAULT_MODULES` keys plus the two CSRD keys that `DEFAULT_SESSION_TEMPLATES` ships (`'Sustainability (CSRD)'`, `'Sustainability + Carbon (CSRD)'`, `:3627`, `:3665`). `goalGateKeyFor(c)` uses `"<module> (CSRD)"` when `c.reportsCSRD` is set and that key exists. Otherwise it uses `c.module`.

---

## Task 1: Schema 14 and data

**Model:** Sonnet. **Supports:** A1, A2 (A7 in part: c1d pins the empty FR/GRC gates).

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`:
  - a new "GRADUATION PLAN (data)" section directly after `DEFAULT_OUTCOME_NAMES` (`:4332-4339`), before the `/* ---- Schema versioning ----` comment;
  - `CURRENT_SCHEMA_VERSION` (`:4346`);
  - `migrateData`: a new `if(v === 13){…}` step after the `if(v === 12){…}` block (which ends `v = 13; }` at `:4749-4750`);
  - `defaultData()` config (`:4772-4788`): add `goalGates: defaultGoalGatesConfig()`;
  - `backfillCustomerRecord` at the `gradReview` normalise site (`:25233-25236`): normalise `goals` and `exit` when present;
  - the self-check block.
- Create: `tools/legacy-seed-v13.js`.
- Modify: `tools/migration-dryrun.mjs` (`--from 13`).
- Modify: `README.txt:74`, `VALIDATION.txt:47`, `CHANGELOG.txt:36` (counts) and `VALIDATION.txt` (mutation proof).

**Interfaces (produced, and used by Tasks 2–7):**
- `GOAL_TYPES` = `[{key, label}]` for `publish`, `setup_next`, `program`, `disclosure` (labels from spec §3.1).
- `GOAL_VERDICTS` = `[{key, label}]` for `met`, `partly`, `not_met`, `replaced`.
- `EXIT_REASONS` = `[{key, label}]` for `goal_met_early`, `no_more_enablement`, `paused_or_risk`, `other`.
- `SUSTAINABILITY_GOAL_GATES` = `{publish:[5], setup_next:[5], program:[3], disclosure:[3]}`.
- `defaultGoalGatesConfig() → {<key>: {publish:[], setup_next:[], program:[], disclosure:[]}}`.
- `cleanGoalText(v, max) → string`.
- `normalizeGoalGate(g) → gate|null`, `normalizeGoal(g) → goal|null`, `normalizeGoals(arr) → goal[]`, `normalizeExit(x) → exit|null`, `normalizeGraduation(x) → {on, noGoal}|null` (ruling M1), `normalizeGoalGatesConfig(cfg, modules) → map`.
- `getGoals(c) → goal[]` (never creates), `primaryGoal(c) → goal|null` (`primary && verdict !== 'replaced'`), `secondaryGoals(c) → goal[]`, `getExit(c) → exit|null`.
- `goalGateKeyFor(c) → string`, `defaultGateTextsFor(c, type) → string[]` (a copy).

- [ ] **Step 1: Write the seven failing checks** in the new "Graduation Plan" block. They follow the shape of `identity A5` (`:10190-10210`): save, then `try`, then restore in `finally`, then `check`.

```js
  /* ---- Graduation Plan (spec 2026-10-01) ---- */
  (function(){                                   // c1a
    let ok = false, detail = '';
    try{
      const g = normalizeGoal({id:'gl_0000000a', type:'bogus', text:'  x '.repeat(200), targetCycle:'FY2026',
        primary:true, source:'nope', createdOn:'2026-13-40', gates:[{text:''},{id:'gt_1', text:'Gate', done:'yes'}],
        verdict:'great', verdictNote:'n'.repeat(900), supersededBy:5, changeReason:7, ackOn:'x'});
      ok = g && g.type === null && g.text.length === 300 && g.source === null && g.createdOn === null
        && g.gates.length === 1 && g.gates[0].done === false && g.verdict === null && g.verdictNote.length === 500
        && g.supersededBy === null && g.changeReason === '' && g.ackOn === null && normalizeGoal({text:''}) === null;
      detail = JSON.stringify(g).slice(0, 280);
    }catch(err){ detail = err.message; }
    check('grad-plan c1a: normalizeGoal clamps text and drops unknown enums to null', ok, detail);
  })();
```

  The other six checks, by name and assertion:
  - **c1b** `normalizeGoals` given two live primaries (`createdOn` `2026-03-01` and `2026-02-01`) keeps only the earlier one as `primary:true`, and forces `primary:false` on any `verdict:'replaced'` goal.
  - **c1c** `normalizeExit`: a bad `on` returns `null`; an unknown reason becomes `reason:null`; `note` is clamped to 500; `sessionsNotNeeded` keeps only `/^(ss_[a-z0-9_]+|\d+)$/` strings, de-duplicated.
  - **c1d** `defaultGoalGatesConfig()`:
    - its keys include all five `DEFAULT_MODULES` plus the two CSRD keys;
    - every Sustainability-family key has lengths 5/5/3/3;
    - `'Financial Reporting'` and `'GRC'` have `[]` for all four types.
  - **c1e** a v13 book from `cloneData(DATA)` with `schemaVersion = 13`, `delete config.goalGates`, every customer's `goals`/`exit` deleted, and one extra module `'Custom Module'` in `config.modules`. After `prepareBookData(…, 'SelfCheck')`:
    - `schemaVersion === 14`;
    - every customer has `Array.isArray(goals) && goals.length === 0 && exit === null && graduation === null` (ruling M1: historic graduations stay `null`, no record is invented);
    - `goalGates` has the 7 keys plus `'Custom Module'` (all 4 types empty);
    - a second `prepareBookData` pass leaves `goals`, `exit` and `goalGates` JSON-identical.

    Liveness: `customers.length > 0`. Restore `DATA.customers`/`DATA.config` in `finally`.
  - **c1f** `CURRENT_SCHEMA_VERSION === 14` and `isRecordObject(defaultData().config.goalGates)`.

  - **c1g** (ruling M1) `normalizeGraduation`: `{on:'2026-09-30', noGoal:1}` gives `{on:'2026-09-30', noGoal:true}`; `{on:'2026-09-30'}` gives `noGoal:false`; a bad `on` (`'2026-13-40'`, `''`, a number), a non-object, `null` and `undefined` all give `null`; extra keys are dropped.

- [ ] **Step 2: Run the suite and see red.** Run the suite command with `--expect 396`. Expected: `runSelfChecks: 389/396 passed, 7 failed`, and every `grad-plan c1*` line reads FAIL (`normalizeGoal is not defined` and similar).

- [ ] **Step 3: Write the data section and the normalisers** after `DEFAULT_OUTCOME_NAMES`:

```js
/* ============ GRADUATION PLAN (spec 2026-10-01): data ============
   c.goals[] (one live primary + optional secondaries) and c.exit; config.goalGates
   per module key. Gates are COPIED into a goal at creation — editing the defaults
   later never rewrites an existing goal. FR and GRC ship EMPTY (R10). */
const GOAL_TYPES = [
  {key:'publish',    label:"Publish this cycle's report/filing"},
  {key:'setup_next', label:'Set up for next cycle'},
  {key:'program',    label:'Program / data only'},
  {key:'disclosure', label:'Disclosure submission'}];
const GOAL_VERDICTS = [{key:'met',label:'Met'},{key:'partly',label:'Partly met'},{key:'not_met',label:'Not met'},{key:'replaced',label:'Replaced'}];
const EXIT_REASONS = [{key:'goal_met_early',label:'Goal met early'},{key:'no_more_enablement',label:'No more enablement needed'},
  {key:'paused_or_risk',label:'Paused or at risk'},{key:'other',label:'Other'}];
const SUSTAINABILITY_GOAL_GATES = {
  publish: ['Metrics mapped to target frameworks','Data collection tasks sent and returned','Factbook connected to the report via a live link','Report reviewed by the customer','Report published or filed'],
  setup_next: ['Metrics mapped to target frameworks','Data collection tasks sent','Factbook connected to at least one reporting output','Next reporting cycle plan established','Roll-forward walked through with the customer'],
  program: ['Topics and metrics configured','Data collection tasks sent and returned','Factbook connected'],
  disclosure: ['Metrics mapped to the disclosure framework','Responses drafted in Workiva','Submission made']};
const GOAL_GATE_SHARED_KEYS = ['Sustainability','Carbon','Sustainability + Carbon','Sustainability (CSRD)','Sustainability + Carbon (CSRD)'];
const MAX_GOALS = 20, MAX_GOAL_GATES = 20;
const GOAL_ID_RE = /^gl_[0-9a-f]{8}$/, GATE_ID_RE = /^gt_[0-9a-f]{8}$/;
function emptyGoalGateSet(){ return {publish:[], setup_next:[], program:[], disclosure:[]}; }
function defaultGoalGatesConfig(){
  const out = {};
  DEFAULT_MODULES.forEach(m => { out[m] = emptyGoalGateSet(); });
  GOAL_GATE_SHARED_KEYS.forEach(k => { out[k] = JSON.parse(JSON.stringify(SUSTAINABILITY_GOAL_GATES)); });
  return out;
}
function cleanGoalText(v, max){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max); }
function normalizeGoalGate(g){
  if(!isRecordObject(g)) return null;
  const text = cleanGoalText(g.text, 200);
  if(!text) return null;
  return {id: GATE_ID_RE.test(g.id) ? g.id : hexId('gt_'), text, done: g.done === true,
    on: isRealISODate(g.on) ? g.on : null, note: cleanGoalText(g.note, 300)};
}
function normalizeGoal(g){
  if(!isRecordObject(g)) return null;
  const text = cleanGoalText(g.text, 300);
  if(!text) return null;
  const verdict = GOAL_VERDICTS.some(v => v.key === g.verdict) ? g.verdict : null;
  return {id: GOAL_ID_RE.test(g.id) ? g.id : hexId('gl_'),
    type: GOAL_TYPES.some(t => t.key === g.type) ? g.type : null,
    text, targetCycle: cleanGoalText(g.targetCycle, 40),
    primary: g.primary === true && verdict !== 'replaced',
    source: (g.source === 'handoff' || g.source === 'osm') ? g.source : null,
    createdOn: isRealISODate(g.createdOn) ? g.createdOn : null,
    gates: (Array.isArray(g.gates) ? g.gates : []).map(normalizeGoalGate).filter(Boolean).slice(0, MAX_GOAL_GATES),
    verdict, verdictOn: isRealISODate(g.verdictOn) ? g.verdictOn : null,
    verdictNote: cleanGoalText(g.verdictNote, 500),
    supersededBy: GOAL_ID_RE.test(g.supersededBy) ? g.supersededBy : null,
    changeReason: cleanGoalText(typeof g.changeReason === 'string' ? g.changeReason : '', 300),
    ackOn: isRealISODate(g.ackOn) ? g.ackOn : null};
}
function normalizeGoals(arr){
  const seen = new Set();
  const list = (Array.isArray(arr) ? arr : []).map(normalizeGoal).filter(g => g && !seen.has(g.id) && seen.add(g.id)).slice(0, MAX_GOALS);
  const live = list.filter(g => g.primary).sort((a, b) => String(a.createdOn || '9999') < String(b.createdOn || '9999') ? -1 : 1);
  live.slice(1).forEach(g => { g.primary = false; });   // keep the earliest live primary
  return list;
}
function normalizeExit(x){
  if(!isRecordObject(x) || !isRealISODate(x.on)) return null;
  const ids = (Array.isArray(x.sessionsNotNeeded) ? x.sessionsNotNeeded : []).filter(s => typeof s === 'string' && /^(ss_[a-z0-9_]+|\d+)$/.test(s));
  return {on: x.on, reason: EXIT_REASONS.some(r => r.key === x.reason) ? x.reason : null,
    note: cleanGoalText(x.note, 500), sessionsNotNeeded: Array.from(new Set(ids)).slice(0, 12)};
}
function normalizeGraduation(x){   // ruling M1: marker written by the graduation confirm
  if(!isRecordObject(x) || !isRealISODate(x.on)) return null;
  return {on: x.on, noGoal: !!x.noGoal};
}
function normalizeGoalGatesConfig(cfg, modules){
  const src = isRecordObject(cfg) ? cfg : {};
  const defaults = defaultGoalGatesConfig();
  const out = {};
  const keys = new Set([...Object.keys(defaults), ...(Array.isArray(modules) ? modules : []), ...Object.keys(src)]);
  keys.forEach(k => {
    const set = isRecordObject(src[k]) ? src[k] : (defaults[k] || emptyGoalGateSet());
    out[k] = emptyGoalGateSet();
    Object.keys(out[k]).forEach(t => { out[k][t] = (Array.isArray(set[t]) ? set[t] : [])
      .map(s => cleanGoalText(s, 200)).filter(Boolean).slice(0, MAX_GOAL_GATES); });
  });
  return out;
}
function getGoals(c){ return Array.isArray(c && c.goals) ? c.goals : []; }
function primaryGoal(c){ return getGoals(c).find(g => g.primary && g.verdict !== 'replaced') || null; }
function secondaryGoals(c){ return getGoals(c).filter(g => !g.primary && g.verdict !== 'replaced'); }
function getExit(c){ return isRecordObject(c && c.exit) ? c.exit : null; }
function goalGateKeyFor(c){
  const gg = (DATA && DATA.config && DATA.config.goalGates) || {};
  const csrd = c && c.reportsCSRD ? c.module + ' (CSRD)' : null;
  return (csrd && isRecordObject(gg[csrd])) ? csrd : (c && c.module);
}
function defaultGateTextsFor(c, type){
  const set = ((DATA && DATA.config && DATA.config.goalGates) || {})[goalGateKeyFor(c)];
  return isRecordObject(set) && Array.isArray(set[type]) ? set[type].slice() : [];
}
```

- [ ] **Step 4: Add the migration step, the schema bump, the `defaultData` entry and the backfill normalise:**

```js
const CURRENT_SCHEMA_VERSION = 14; // graduation plan: + c.goals, c.exit, c.graduation, config.goalGates
…
  if(v === 13){
    /* v13 -> v14 (graduation plan). Additive. INFERS NOTHING: no goal is guessed
       from free text, and historic graduations get no exit record — the packet
       says "graduated before goal tracking" instead of inventing one. */
    (data.customers || []).forEach(c => {
      if(!isRecordObject(c)) return;
      c.goals = c.goals === undefined ? [] : normalizeGoals(c.goals);
      c.exit = c.exit === undefined ? null : normalizeExit(c.exit);
      c.graduation = c.graduation === undefined ? null : normalizeGraduation(c.graduation);   // M1: historic graduations stay null
    });
    if(isRecordObject(data.config)) data.config.goalGates = normalizeGoalGatesConfig(data.config.goalGates, data.config.modules);
    v = 14;
  }
```

  In `backfillCustomerRecord`, next to the `gradReview` lines (`:25233`), normalise without creating:

```js
    if(c.goals !== undefined) c.goals = normalizeGoals(c.goals);
    if(c.exit !== undefined) c.exit = normalizeExit(c.exit);
    if(c.graduation !== undefined) c.graduation = normalizeGraduation(c.graduation);
```

- [ ] **Step 5: Re-run the suite and see it pass.** With `--expect 396` the expected result is `396/396 passed, 0 failed`, exit 0. Then run the guide suite and expect `18/18`.

- [ ] **Step 6: Write `tools/legacy-seed-v13.js`** in the style of `tools/legacy-seed-v12.js`. It is an IIFE that clones `DATA.config`, deletes `cfg.goalGates`, pushes `'Custom Module'` into `cfg.modules` (with `cfg.sessionTemplates['Custom Module'] = cfg.sessionTemplates['Carbon'].slice(0, 6)`), and builds seven accounts with no `goals`/`exit` keys:
  - Verdant Sustainability (live, Sustainability);
  - Emberline Carbon (live, Carbon);
  - Northbank CSRD (Sustainability + Carbon, `reportsCSRD:true`);
  - Ledgerwise Financial (Financial Reporting);
  - Controlpoint GRC (GRC);
  - Oldfield Graduated (Sustainability, `stage:'graduated'`, `stageHistory` with a graduated entry 120 days ago);
  - Partnerbuild Carbon (Carbon, `implementation:{phase:'build', …}`).

  It stores `book = {schemaVersion: 13, config: cfg, customers, activities, …}` on `window.__LEGACY_BOOK__` and returns `{customers: 7, schemaVersion: 13}`.

- [ ] **Step 7: Add `--from 13` to `tools/migration-dryrun.mjs`.**
  - Accept `13` in the `FROM` guard.
  - Make the defaults `tools/legacy-seed-v13.js` and `.artifacts/migration-dryrun-v13.md`.
  - Update the usage comment.
  - Add an `if (FROM === '13') {…}` branch modelled on the `FROM === '12'` branch. In-page it runs `prepareBookData(clone(raw), 'DryRun13')` and reports, per account, `goalsIsEmptyArray`, `exitIsNull`, `graduationIsNull` and `stage`. It also reports `goalGates` keys and per-key gate lengths, `defaultModulesPresent = DEFAULT_MODULES.filter(m => goalGates[m]).length`, `historicGraduatedWithExit`, and idempotence (a second `prepareBookData` pass gives identical goals, exit and goalGates).

  Console summary (the A2 evidence):

```
Schema 13 -> 14  Accounts: 7  goals:[] 7/7  exit:null 7/7  graduation:null 7/7
goalGates: default modules 5/5 (+2 CSRD, +1 other)  Sustainability 5/5/3/3  Financial Reporting 0/0/0/0  GRC 0/0/0/0  Custom Module 0/0/0/0
Historic graduated with an invented exit (must be 0): 0  Second-pass idempotent: true  Console errors: 0
```

  Exit 0 only when every line holds. Exit 2 is reserved for harness failure.

  Run: `node tools/migration-dryrun.mjs osm-book-of-business-tracker-1.0.html --from 13 > .artifacts/grad-plan/dry13.log 2>&1; tail -4 .artifacts/grad-plan/dry13.log; echo exit=$?`. Expected: the three lines above, then `exit=0`. Also re-run `--from 12`; it must still exit 0 (the chain now ends at 14).

- [ ] **Step 8: Record the mutation proof and commit.** Mutation: in the `v === 13` step, change `c.exit = c.exit === undefined ? null : …` to leave `exit` absent. c1e must go red (`exit === null` fails on 7 of 7; the same mutation on the `graduation` line must also turn c1e red), then restore. Write the proof to `VALIDATION.txt`, and update the counts in `README.txt:74`, `VALIDATION.txt:47` and `CHANGELOG.txt:36` to 396.

```bash
git add osm-book-of-business-tracker-1.0.html tools/legacy-seed-v13.js tools/migration-dryrun.mjs README.txt VALIDATION.txt CHANGELOG.txt
git commit -m "Graduation plan task 1: schema 14 (goals, exit, goalGates), normalisers, v13 dry run"
```

---

## Task 2: Goal panel

**Model:** Sonnet. Invoke `frontend-design` **for layout only**: the panel follows the existing `section-card` / `renderGradReviewBlock` look, and `:root` tokens only. **Supports:** A7 (goal created on an FR account with 0 gates), and the panel parts of A4–A6.

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`:
  - a "GRADUATION PLAN (actions)" section directly after Task 1's data section;
  - `HANDOFF_IN_FIELDS` (`:3441-3449`) and `renderHandoffTab` (`:20393`, field markup at `:20400-20405`);
  - `renderOverviewTab` (`:20975`): insert `${renderGoalPanel(c)}` after `${renderGradReviewBlock(c)}` at `:20990`;
  - the panel event wiring next to `[data-gr-answer]` (`:22734`);
  - `openAddCustomerModal` (`:23632`; customer literal at `:23741-23756`);
  - the Go-Live confirm handler `#btn-impl-golive` (`:23346-23355`);
  - a new modal `openGoalFormModal` next to `showConfirmModal` (`:23600`);
  - the self-check block.
- Modify `README.txt:74`, `VALIDATION.txt:47`, `CHANGELOG.txt:36`.

**Interfaces:**
- Consumes (Task 1): `GOAL_TYPES`, `GOAL_VERDICTS`, `cleanGoalText`, `getGoals`, `primaryGoal`, `secondaryGoals`, `defaultGateTextsFor`, `hexId`.
- Produces:
  - `createGoal(c, {type, text, targetCycle, source, primary}) → goal|null`. It is primary only when no live primary exists and `primary !== false`. Gates are copied from `defaultGateTextsFor(c, type)`. It fills `c.compliance.outcomePlan.planText` only when that is empty and the new goal is primary.
  - `setGoalGateDone(c, goalId, gateId, done) → bool`: ticking stamps `on = todayISO()`, unticking clears `on`.
  - `setGoalGateNote(c, goalId, gateId, note) → bool`.
  - `addGoalGate(c, goalId, text) → gate|null`, `renameGoalGate(c, goalId, gateId, text) → bool`, `removeGoalGate(c, goalId, gateId) → bool`.
  - `setGoalVerdict(c, goalId, verdict, note) → bool`: only `met`/`partly`/`not_met`; it stamps `verdictOn`.
  - `goalCriteriaTally(c) → {evidenced, total}`, from `outcomeCriteriaFor(c)`.
  - `goalHintText(c) → {from, text}|null`: the first non-empty of `getHandoff(c,'in').values.promisedOutcomes`, `getFirstValue(c).definition` and `c.compliance.outcomePlan.planText`.
  - `renderGoalPanel(c) → html`.
  - `openGoalFormModal(c, mode, onDone)` with `mode` `'create'` (Task 3 adds `'change'`).
  - The registry entry `{key:'handoffMeetingOn', label:'Hand-off meeting date', hint:'…', type:'date'}`.

- [ ] **Step 1: Write five failing checks.** Each uses a synthetic customer `{id:'__gp2__', module:'Sustainability', stage:'ttfv1', totalSessions:8, compliance: defaultCompliance(), …}` with `DATA.customers = [c]` swapped in and restored in `finally`.
  - **c2a** `createGoal(c,{type:'publish', text:'Publish FY2026 report', targetCycle:'FY2026', source:'handoff'})`:
    - returns a primary goal with 5 gates whose texts equal `SUSTAINABILITY_GOAL_GATES.publish`;
    - then `DATA.config.goalGates.Sustainability.publish[0] = 'Changed'` (on a cloned config, restored afterwards) leaves the goal's gate 0 unchanged;
    - a second `createGoal` returns `primary:false`.
  - **c2b** `planText` is filled from the primary goal's text when empty. When `planText` is already `'Existing plan'`, it is unchanged.
  - **c2c** `setGoalGateDone` stamps `on === todayISO()`; un-ticking sets `on === null`; `addGoalGate` / `renameGoalGate` / `removeGoalGate` change the count 5 → 6 → 6 → 5.
  - **c2d** `goalCriteriaTally(c)` equals `{evidenced: outcomeCriteriaFor(c).filter(x=>x.evidence).length, total: outcomeCriteriaFor(c).length}`. Liveness: `total > 0`. On a `'Financial Reporting'` customer, `createGoal` returns a goal with `gates.length === 0`, no throw, and `renderGoalPanel(c)` contains `0 gates`.
  - **c2e** `HANDOFF_IN_FIELDS` has `handoffMeetingOn` with `type:'date'`; `renderHandoffTab(c)` renders `type="date"` for it. `goalHintText` returns the `promisedOutcomes` text first and falls back to `firstValue.definition`.

- [ ] **Step 2: Run the suite and see red.** With `--expect 401`, expect `396/401 passed, 5 failed` (the `grad-plan c2*` lines).

- [ ] **Step 3: Write the domain functions** (after Task 1's section):

```js
function findGoal(c, goalId){ return getGoals(c).find(g => g.id === goalId) || null; }
function createGoal(c, d){
  const type = GOAL_TYPES.some(t => t.key === d.type) ? d.type : null;
  const text = cleanGoalText(d.text, 300);
  if(!c || !type || !text) return null;
  if(!Array.isArray(c.goals)) c.goals = [];
  if(c.goals.length >= MAX_GOALS) return null;
  const primary = !primaryGoal(c) && d.primary !== false;
  const g = {id: hexId('gl_'), type, text, targetCycle: cleanGoalText(d.targetCycle, 40), primary,
    source: d.source === 'handoff' ? 'handoff' : 'osm', createdOn: todayISO(),
    gates: defaultGateTextsFor(c, type).map(t => ({id: hexId('gt_'), text: t, done: false, on: null, note: ''})),
    verdict: null, verdictOn: null, verdictNote: '', supersededBy: null, changeReason: '', ackOn: null};
  c.goals.push(g);
  const op = c.compliance && c.compliance.outcomePlan;
  if(primary && op && !String(op.planText || '').trim()) op.planText = text;   // fill-when-empty only
  return g;
}
function setGoalGateDone(c, goalId, gateId, done){
  const gt = (findGoal(c, goalId) || {gates: []}).gates.find(x => x.id === gateId);
  if(!gt) return false;
  gt.done = !!done; gt.on = done ? todayISO() : null; return true;
}
function setGoalVerdict(c, goalId, verdict, note){
  const g = findGoal(c, goalId);
  if(!g || !['met','partly','not_met'].includes(verdict)) return false;
  g.verdict = verdict; g.verdictOn = todayISO(); g.verdictNote = cleanGoalText(note, 500); return true;
}
function goalCriteriaTally(c){ const l = outcomeCriteriaFor(c); return {evidenced: l.filter(x => x.evidence).length, total: l.length}; }
```

  Write `setGoalGateNote`, `addGoalGate`, `renameGoalGate`, `removeGoalGate` and `goalHintText` the same way: guard, clean the text, then mutate.

- [ ] **Step 4: Add the registry field and its date input.** Append `{key:'handoffMeetingOn', label:'Hand-off meeting date', hint:'When the partner hand-off meeting took place. There is no formal partner document to record (R7).', type:'date'}` to `HANDOFF_IN_FIELDS`. In `renderHandoffTab`'s field map, render `<input type="date" id="ho-${dir}-${f.key}" data-handoff="${dir}|${escapeAttr(f.key)}" value="${escapeAttr(rec.values[f.key] || '')}">` when `f.type === 'date'`, and keep the `<textarea>` otherwise. The existing `[data-handoff]` `change` listener (`:22830`) already reads `.value`.

- [ ] **Step 5: Build the panel and the form.**
  - `renderGoalPanel(c)` returns:
    - for a non-graduated account with no live primary: a `section-card` "No goal yet" banner with a "Set the hand-off goal" button (`data-goal-new="${c.id}"`) and, when `goalHintText(c)` exists, "From earlier notes: …" (copyable text, never auto-filled);
    - otherwise: the primary goal card. It shows the type label, text, cycle and source; a gate checklist (`data-goal-gate="${c.id}|${g.id}|${gt.id}"` checkboxes, an optional note input, and add, rename and remove controls); "N of M evidenced" from `goalCriteriaTally`; and the secondary goals inside a collapsed `<details>`, each with its gates and a verdict select (`data-goal-verdict`).
  - `openGoalFormModal(c, 'create', onDone)` has fields for type (`GOAL_TYPES`), goal text, target cycle, source (hand-off/OSM) and an optional hand-off meeting date. It shows the hint. On submit, the date goes through `setHandoffField(c,'in','handoffMeetingOn', iso)`; then `markUndoable('goal')`, `createGoal`, `saveData()`, `render()`.
  - The wiring follows the `data-gr-answer` pattern: `markUndoable(label)`, mutate, `saveData()`, `render()`.

- [ ] **Step 6: Connect the other two entry points.**
  - In `openAddCustomerModal`, add an optional "Hand-off goal" type and text pair. The customer literal gains `goals: [], exit: null`. When text is typed, call `createGoal(customer, {...})` before `candidate.customers.push(customer)`.
  - In the `#btn-impl-golive` confirm callback, after `markImplementationGoLive(c)` and `saveData()`, add `if(!primaryGoal(c)) openGoalFormModal(c, 'create');`.

- [ ] **Step 7: Re-run the suite (`--expect 401`, expected `401/401`) and the guide (`18/18`).** Record the mutation proof: in `createGoal`, drop the `!String(op.planText…).trim()` guard. c2b must go red. Then restore.

- [ ] **Step 8: Update the counts to 401 and commit.**

```bash
git add osm-book-of-business-tracker-1.0.html README.txt VALIDATION.txt CHANGELOG.txt
git commit -m "Graduation plan task 2: goal panel, create form, gate checklist, criteria tally, hand-off meeting date"
```

---

## Task 3: Goal change

**Model:** Sonnet. **Supports:** A6, A3 (the signal is silent without a change).

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`:
  - the "GRADUATION PLAN (actions)" section;
  - `SIGNAL_DEFS` (`:7193`): insert before the `late_gate` entry (`:7282`);
  - `SIGNAL_PANEL_TAB` (`:18744`) and `EFFORT_MIN` (`:18705`);
  - `renderGoalPanel` and `openGoalFormModal` (from Task 2);
  - the self-check block.
- Modify `README.txt:74`, `VALIDATION.txt:47`, `CHANGELOG.txt:36`.

**Interfaces:**
- Consumes (Tasks 1–2): `primaryGoal`, `getGoals`, `findGoal`, `defaultGateTextsFor`, `cleanGoalText`, `openGoalFormModal`.
- Produces:
  - `changePrimaryGoal(c, {type, text, targetCycle, source, changeReason}) → newGoal|null`. It returns `null` without a reason or without a live primary.
  - `goalCreatedByChange(c, goal) → oldGoal|null`.
  - `customerGoalChangedSignal(c) → {goalId, from, to, reason}|null`.
  - `ackGoalChange(c) → bool`.
  - The `SIGNAL_DEFS` key `goal_changed`.
  - `openGoalFormModal(c, 'change', onDone)`.

- [ ] **Step 1: Write four failing checks.**
  - **c3a** On a Sustainability customer with a primary `publish` goal "Publish FY2026 report": `changePrimaryGoal(c, {type:'setup_next', text:'Ready for next cycle', changeReason:''})` returns `null`. With the reason `'Data owner left'`:
    - the old goal has `verdict:'replaced'`, `verdictOn === todayISO()`, `primary:false`, `supersededBy === new.id` and `changeReason === 'Data owner left'`;
    - `primaryGoal(c).id === new.id`;
    - `getGoals(c).length === 2`.
  - **c3b** carry-over: before the change, tick the old gates "Metrics mapped to target frameworks" and "Report published or filed". After the change, the new `setup_next` goal has "Metrics mapped to target frameworks" `done:true` with the same `on`; every other gate is `done:false`, including "Data collection tasks sent", which only nearly matches.
  - **c3c** `goal_changed`:
    - `SIGNAL_DEFS.find(d=>d.key==='goal_changed').detect(c)` is non-null after the change;
    - it is `null` on an account whose goal was never changed;
    - after `ackGoalChange(c)` it is `null`;
    - `ackGoalChange(c)` a second time returns `false`.
  - **c3d** No-threshold source scan for `goal_changed`: `String(customerGoalChangedSignal)` and `String(SIGNAL_DEFS.find(d=>d.key==='goal_changed').detect)` must not match `/daysSince|DATA\.config|Days\b|\d{2,}/`. Task 4's c4g makes the same scan of `ready_to_graduate`.

- [ ] **Step 2: Run the suite and see red.** With `--expect 407`, expect `403/407 passed, 4 failed`.

- [ ] **Step 3: Write `changePrimaryGoal` and its helpers:**

```js
function changePrimaryGoal(c, d){
  const old = primaryGoal(c);
  const reason = cleanGoalText(d.changeReason, 300);
  const type = GOAL_TYPES.some(t => t.key === d.type) ? d.type : null;
  const text = cleanGoalText(d.text, 300);
  if(!old || !reason || !type || !text || getGoals(c).length >= MAX_GOALS) return null;
  const fresh = {id: hexId('gl_'), type, text, targetCycle: cleanGoalText(d.targetCycle, 40), primary: true,
    source: d.source === 'handoff' ? 'handoff' : 'osm', createdOn: todayISO(),
    gates: defaultGateTextsFor(c, type).map(t => ({id: hexId('gt_'), text: t, done: false, on: null, note: ''})),
    verdict: null, verdictOn: null, verdictNote: '', supersededBy: null, changeReason: '', ackOn: null};
  fresh.gates.forEach(g => {             // exact-text carry-over of DONE gates only
    const prev = old.gates.find(o => o.done && o.text === g.text);
    if(prev){ g.done = true; g.on = prev.on; g.note = prev.note; }
  });
  old.verdict = 'replaced'; old.verdictOn = todayISO(); old.supersededBy = fresh.id;
  old.primary = false; old.changeReason = reason;
  c.goals.push(fresh);
  return fresh;
}
function goalCreatedByChange(c, goal){ return goal ? (getGoals(c).find(g => g.supersededBy === goal.id) || null) : null; }
function customerGoalChangedSignal(c){
  const p = primaryGoal(c), old = goalCreatedByChange(c, p);
  if(!p || !old || p.ackOn) return null;           // state-based: no day or count threshold
  return {goalId: p.id, from: old.text, to: p.text, reason: old.changeReason};
}
function ackGoalChange(c){ const p = primaryGoal(c); if(!p || p.ackOn || !goalCreatedByChange(c, p)) return false; p.ackOn = todayISO(); return true; }
```

- [ ] **Step 4: Register the signal** before `late_gate`:

```js
  {key:'goal_changed', severity:()=>2,
    // Graduation plan (R6): the hand-off goal was superseded; the target date was
    // set against the OLD goal. State-based — clears when the OSM confirms the date.
    detect:c=>customerGoalChangedSignal(c),
    action:(c,sig)=>({action:'Check the target graduation date against the new goal', reasons:[`Goal changed from "${trimToLength(sig.from, 80)}" to "${trimToLength(sig.to, 80)}" — ${trimToLength(sig.reason, 120)}`]}),
    step:(c,sig)=>`The hand-off goal changed ("${trimToLength(sig.to, 80)}"). Confirm the target graduation date still holds, then mark it checked on the Overview tab.`,
    portfolio:null},
```

  Also add `goal_changed:'overview'` to `SIGNAL_PANEL_TAB` and `'signal:goal_changed': 5` to `EFFORT_MIN`.

- [ ] **Step 5: Add the UI.**
  - `renderGoalPanel` shows a "Change goal" button on the primary card (`data-goal-change`).
  - While `customerGoalChangedSignal(c)` is non-null, it shows a status line ("Goal changed — target date X still right?") with a "Target date checked" button (`data-goal-ack`). The handler does `markUndoable('goal')`, `ackGoalChange`, `saveData()`, `render()`.
  - `openGoalFormModal(c, 'change')` reuses the create form and adds a required "Why did the goal change?" textarea. Submit is refused with a toast when it is empty.

- [ ] **Step 6: Re-run the suite** (`--expect 407`): expected `407/407`. Run the guide (`18/18`). Mutation proof: remove the `o.done &&` from the carry-over find. c3b must go red, then restore.

- [ ] **Step 7: Update the counts to 407, then commit.**

```bash
git add osm-book-of-business-tracker-1.0.html README.txt VALIDATION.txt CHANGELOG.txt
git commit -m "Graduation plan task 3: goal change with history, gate carry-over, goal_changed signal"
```

---

## Task 4: Graduation confirm, early exit, ready_to_graduate

**Model:** Sonnet. **Supports:** A4, A5, A8, A7 (graduating an FR account), A3.

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`:
  - the "GRADUATION PLAN (actions)" section;
  - `SIGNAL_DEFS`: insert directly after `ready_to_set_date` (`:7305-7309`);
  - `PLAYBOOK_DEFS` `grad_ready.signals` (`:3206`);
  - `SIGNAL_PANEL_TAB`, `EFFORT_MIN`;
  - the stage UI call sites `:22269`, `:22298`, `:23047`;
  - the tally and pace sites: `projectedGraduationDate` `:6641`, `:5467`, `:17020`, `:17067`, `:17127`, `:17806`, `:19917`, `:21232`, `:24910`, `:24922`;
  - `buildKnowledgeTransferText` SESSION HISTORY line `:19936`;
  - a new modal `openGraduationConfirmModal`;
  - the self-check block.
- Modify `README.txt:74`, `VALIDATION.txt:47`, `CHANGELOG.txt:36`.

**Interfaces:**
- Consumes: `primaryGoal`, `getExit`, `normalizeExit`, `todayISO`, `EXIT_REASONS`, `createGoal`, `setGoalVerdict`, `cleanGoalText`, `changeStage`, `getSessionActivity`, `getSessionTemplateSet`, `inImplementation`.
- Produces:
  - `customerReadyToGraduateSignal(c) → {goalId, gates, verdictMet}|null` and the `SIGNAL_DEFS` key `ready_to_graduate`.
  - `unheldPlannedSessions(c) → string[]`: a session id, or `String(n)` when the template has no id.
  - `plannedSessionTotal(c) → number`.
  - `validateGraduationDraft(c, draft) → {ok, missing:string[], notePrompt:string|null, openGates:string[], unheld:string[]}`.
  - `applyGraduation(c, draft) → bool` (also writes `c.graduation = {on: today, noGoal}`; `p` is read after any `newGoal` is created, so `noGoal` is true only when no live primary goal exists), with `draft = {verdict, note, exitReason, exitNote, noGoal, newGoal:{type,text,targetCycle,source}|undefined}`.
  - `requestStageChange(c, stageKey)` and `openGraduationConfirmModal(c)`.

- [ ] **Step 1: Write eight failing checks.** Each uses a synthetic customer plus `DATA.activities[c.id]` holding session activities, swapped and restored.
  - **c4a** (A4 unit) `ready_to_graduate`:
    - fires on a live account with `targetGraduationDate` set and every primary gate done;
    - stays `null` without a target date, in implementation (`implementation:{phase:'build'}`), when graduated, or with no primary goal;
    - fires on an FR primary goal with 0 gates **only** when `verdict === 'met'` (0 gates is not "all done");
    - `PLAYBOOK_DEFS.find(d=>d.key==='grad_ready').signals` includes `'ready_to_graduate'`.
  - **c4b** (A8 unit) a primary goal with 2 of 5 gates open:
    - `validateGraduationDraft(c,{verdict:'met', note:''})` gives `ok:false`, `missing` containing `'note'`, and a non-null `notePrompt` naming the open gates;
    - with `note:'Customer will file next week'` it gives `ok:true` (it does not block);
    - `applyGraduation` then returns `true`, and the stage is `'graduated'` with `verdict === 'met'`.
  - **c4c** (A5 unit) `totalSessions:6` with sessions 1–5 held:
    - `validateGraduationDraft` without `exitReason` lists `'exitReason'`;
    - `exitReason:'other'` with no `exitNote` lists `'exitNote'`;
    - with `exitReason:'goal_met_early'`, `applyGraduation` stores `exit.reason === 'goal_met_early'` and `exit.sessionsNotNeeded.length === 1` (session 6's id), and `plannedSessionTotal(c) === 5 === sessionsCompletedCount(c)`.
  - **c4d** with no primary goal, `validateGraduationDraft(c,{})` lists `'goal'`; `{noGoal:true}` gives `ok:true`; `{newGoal:{type:'program', text:'Data program live'}, verdict:'partly', note:'n'}` creates the goal and graduates.
  - **c4e** source scan: the bodies of the three UI handlers contain `requestStageChange(` and no `changeStage(` call. They are found by their selectors `data-dropzone`, `data-table-stage` and `#stage-select` in `String(bindEvents)`, or in whichever function holds `:22269` (grep for it). And `String(changeStage)` still contains `scheduleGradReview`.
  - **c4f** the tally reads `plannedSessionTotal`: `buildKnowledgeTransferText(c)` for the c4c account contains `5/5 sessions logged` and `Session 6 — … : not needed (early exit)`.
  - **c4g** No-threshold source scan for `ready_to_graduate`: `String(customerReadyToGraduateSignal)` and its `SIGNAL_DEFS` `detect` must not match `/daysSince|DATA\.config|Days\b|\d{2,}/`.
  - **c4h** (ruling M1) the graduation marker. `applyGraduation` on an account with a primary goal gives `c.graduation` deep-equal to `{on: todayISO(), noGoal: false}`. With no goal and `{noGoal:true}` it gives `{on: todayISO(), noGoal: true}`. With no goal and `newGoal` it gives `noGoal:false`. A draft that fails validation leaves `c.graduation` null.

- [ ] **Step 2: Run the suite and see red.** With `--expect 417`, expect `407/417 passed, 10 failed` (c4a–c4j).

- [ ] **Step 3: Write the domain functions:**

```js
function customerReadyToGraduateSignal(c){
  if(!c || c.stage === 'graduated' || inImplementation(c) || !c.targetGraduationDate) return null;
  const p = primaryGoal(c);
  if(!p) return null;
  const allGates = p.gates.length >= 1 && p.gates.every(g => g.done);
  return (allGates || p.verdict === 'met') ? {goalId: p.id, gates: p.gates.length, verdictMet: p.verdict === 'met'} : null;
}
function unheldPlannedSessions(c){
  const set = getSessionTemplateSet(c), out = [];
  for(let n = 1; n <= c.totalSessions; n++){
    if(getSessionActivity(c, n)) continue;
    const t = set[n - 1]; out.push(t && t.id ? t.id : String(n));
  }
  return out;
}
function plannedSessionTotal(c){
  const ex = getExit(c);
  if(!ex || !ex.sessionsNotNeeded.length) return c.totalSessions;
  const unheld = new Set(unheldPlannedSessions(c));
  return c.totalSessions - ex.sessionsNotNeeded.filter(id => unheld.has(id)).length;
}
function validateGraduationDraft(c, d){
  d = d || {};
  const missing = [], p = primaryGoal(c), note = cleanGoalText(d.note, 500);
  const willHaveGoal = !!p || !!(d.newGoal && cleanGoalText(d.newGoal.text, 300));
  if(willHaveGoal){
    if(!['met','partly','not_met'].includes(d.verdict)) missing.push('verdict');
    if(!note) missing.push('note');
  } else if(!d.noGoal) missing.push('goal');
  const openGates = p ? p.gates.filter(g => !g.done).map(g => g.text) : [];
  const notePrompt = (p && d.verdict === 'met' && openGates.length)
    ? `Met with ${openGates.length} open gate${openGates.length === 1 ? '' : 's'} (${openGates.join('; ')}). Say why that is acceptable.` : null;
  const unheld = unheldPlannedSessions(c);
  if(unheld.length){
    if(!EXIT_REASONS.some(r => r.key === d.exitReason)) missing.push('exitReason');
    else if(d.exitReason === 'other' && !cleanGoalText(d.exitNote, 500)) missing.push('exitNote');
  }
  return {ok: !missing.length, missing, notePrompt, openGates, unheld};   // a prompt, never a block (R4)
}
function applyGraduation(c, d){
  if(d && d.newGoal && !primaryGoal(c) && !createGoal(c, d.newGoal)) return false;
  const v = validateGraduationDraft(c, d);
  if(!v.ok) return false;
  const p = primaryGoal(c);
  if(p) setGoalVerdict(c, p.id, d.verdict, d.note);
  if(v.unheld.length) c.exit = normalizeExit({on: todayISO(), reason: d.exitReason, note: d.exitNote, sessionsNotNeeded: v.unheld});
  c.graduation = {on: todayISO(), noGoal: !p};   // ruling M1: marks "graduated with no goal recorded" apart from a historic graduation (null)
  changeStage(c, 'graduated');
  return true;
}
```

- [ ] **Step 4: Register the signal and add it to the play.** Insert directly after `ready_to_set_date`:

```js
  {key:'ready_to_graduate', severity:()=>1,
    // Graduation plan: target date set and the primary goal's gates all done, or the
    // OSM already judged it met. State-based — no numeric threshold.
    detect:c=>customerReadyToGraduateSignal(c),
    action:()=>({action:'Record the goal verdict and graduate', reasons:['The primary goal reads ready and a target graduation date is set']}),
    step:()=>`The primary hand-off goal reads ready (all gates done, or judged met) — record the verdict and graduate.`,
    portfolio:n=>`${n} account${n===1?'':'s'} read ready to graduate against their hand-off goal.`},
```

  Then:
  - `PLAYBOOK_DEFS` `grad_ready.signals` becomes `['ready_to_set_date','ready_to_graduate','no_value_evidence']`;
  - add `ready_to_graduate:'overview'` to `SIGNAL_PANEL_TAB` and `'signal:ready_to_graduate': 10` to `EFFORT_MIN`.

- [ ] **Step 5: Add the confirm modal and route the UI paths through it.**

```js
function requestStageChange(c, stageKey){
  if(stageKey === 'graduated' && c.stage !== 'graduated'){ openGraduationConfirmModal(c); render(); return; }
  changeStage(c, stageKey); saveData(); render();
}
```

  Replace `changeStage(…); saveData(); render();` at `:22269`, `:22298` and `:23047` with `requestStageChange(cust|c, value)`.

  `openGraduationConfirmModal(c)` is built in the `showDismissModal` style (`:23549`):
  - it has a verdict radio (`met`/`partly`/`not_met`) and a note textarea;
  - when there is no primary goal, inline goal fields and a "Graduate with no goal recorded" checkbox;
  - when `unheldPlannedSessions(c).length`, an exit reason select (`EXIT_REASONS`) plus a note, listing the unheld session titles.

  On every input it re-runs `validateGraduationDraft`. It shows `notePrompt` above the note, and enables the Graduate button only when `ok`. On confirm: `markUndoable('graduate')`, `applyGraduation`, `saveData()`, `render()`, and a toast.

- [ ] **Step 6: Swap the tally and pace sites to `plannedSessionTotal(c)`.**
  - Replace `c.totalSessions` / `customer.totalSessions` with `plannedSessionTotal(c)` at the sites listed under Files (each one is a `N/${c.totalSessions}` tally or `remaining` in `projectedGraduationDate`).
  - Leave `nextOpenSessionNumber`, the runway loop (`:6751`), migrations and self-check fixtures alone.
  - In the SESSION HISTORY loop (`:19934-19937`), print `not needed (early exit)` when the template id or `String(i+1)` is in `getExit(c).sessionsNotNeeded`.

- [ ] **Step 7: Re-run the suite and the guide.** The suite with `--expect 417` should give `417/417`; the guide `18/18`. Mutation proof: in `customerReadyToGraduateSignal`, change `p.gates.length >= 1 &&` to nothing. c4a must go red (the FR 0-gate case fires), then restore.

- [ ] **Step 8: Update the counts to 417 and commit.**

```bash
git add osm-book-of-business-tracker-1.0.html README.txt VALIDATION.txt CHANGELOG.txt
git commit -m "Graduation plan task 4: graduation confirm (verdict, note, early exit), sessionsNotNeeded tally, ready_to_graduate"
```

---

## Task 5: One Document, the GOALS section

**Model:** Sonnet. **Supports:** A5 (the packet shows the exit reason), A6 (the change line), A7 (the packet shows "0 gates").

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`: `buildKnowledgeTransferText` (`:19906`; insert after the draft notice at `:19911-19912`, before `— ACCOUNT —`), a new `buildGoalsSectionLines` directly above it, and the self-check block.
- Modify `README.txt:74`, `VALIDATION.txt:47`, `CHANGELOG.txt:36`.

**Interfaces:**
- Consumes: `GOAL_TYPES`, `GOAL_VERDICTS`, `EXIT_REASONS`, `primaryGoal`, `secondaryGoals`, `getGoals`, `getExit`, `goalCriteriaTally`, `getGradReview`, `GRAD_REVIEW_VERDICTS`, `getSessionTemplateSet`, `fmtDate`.
- Produces: `buildGoalsSectionLines(c) → string[]`, which starts with `'— GOALS —'` and has no trailing blank line.

- [ ] **Step 1: Write five failing checks.**
  - **c5a** For an account with a primary goal, `buildKnowledgeTransferText(c).split('\n')`:
    - has `'— GOALS —'` at index 4 (after the three header lines and one blank);
    - has `'— ACCOUNT —'` after it;
    - keeps the remaining section titles in their old order (`PEOPLE`, `SESSION HISTORY`, `OPEN AT TRANSFER`, `FROM THE OSM`);
    - has a GOALS section containing `Gates: 2 of 5 done. Open:` followed by the three open gate texts, and `Criteria: N of M evidenced` with the values from `goalCriteriaTally`.
  - **c5b** (A6 unit) after `changePrimaryGoal` from "Publish FY2026 report" to "Ready for next cycle" with reason "Data owner left", the text contains exactly ``Changed ${fmtDate(todayISO())}: Publish FY2026 report → Ready for next cycle, because Data owner left.``.
  - **c5c** (A5 and A7 units):
    - the c4c-style early-exit account's packet contains `Early exit: Goal met early` and `Sessions marked not needed: Session 6`;
    - an FR account with a goal contains `Gates: 0 gates` and the build does not throw;
    - an account with an answered `gradReview` contains `Graduation check-back: Still using it`.
  - **c5d** (ruling M1) a graduated account with `graduation:{on:'2026-09-30', noGoal:true}`, no goals and no exit: the GOALS section contains `No goal recorded.` and does not contain `Graduated before goal tracking.`.
  - **c5e** (ruling M1) a graduated account with `graduation:null`, no goals and no exit: the GOALS section contains `Graduated before goal tracking.` and does not contain `No goal recorded.`.

- [ ] **Step 2: Run the suite and see red.** With `--expect 422`, expect `417/422 passed, 5 failed` (c5a–c5e).

- [ ] **Step 3: Write `buildGoalsSectionLines`:**

```js
function buildGoalsSectionLines(c){
  const L = ['— GOALS —'];
  const typeLabel = k => (GOAL_TYPES.find(t => t.key === k) || {}).label || 'Goal';
  const verdictLabel = k => (GOAL_VERDICTS.find(v => v.key === k) || {}).label || k;
  const p = primaryGoal(c);
  if(p){
    L.push(`Primary goal [${typeLabel(p.type)}]: ${p.text}${p.targetCycle ? ` (cycle ${p.targetCycle})` : ''}`);
    L.push(p.verdict ? `Verdict: ${verdictLabel(p.verdict)} on ${fmtDate(p.verdictOn)}${p.verdictNote ? ` — ${p.verdictNote}` : ''}` : 'Verdict: not recorded yet');
    const open = p.gates.filter(g => !g.done);
    L.push(p.gates.length ? `Gates: ${p.gates.length - open.length} of ${p.gates.length} done.${open.length ? ' Open: ' + open.map(g => g.text).join('; ') : ''}` : 'Gates: 0 gates');
    const t = goalCriteriaTally(c);
    L.push(`Criteria: ${t.evidenced} of ${t.total} evidenced`);
  } else L.push('Primary goal: none recorded');
  getGoals(c).filter(g => g.verdict === 'replaced' && g.supersededBy).forEach(g => {
    const to = getGoals(c).find(x => x.id === g.supersededBy);
    L.push(`Changed ${fmtDate(g.verdictOn)}: ${g.text} → ${to ? to.text : '(removed)'}, because ${g.changeReason}.`);
  });
  const ex = getExit(c);
  if(ex){ /* "Early exit: <label>[ — note]. Sessions marked not needed: Session N — <title>; …" */ }
  else if(c.stage === 'graduated' && !getGoals(c).length) L.push(c.graduation && c.graduation.noGoal ? 'No goal recorded.' : 'Graduated before goal tracking.');   // M1: marker splits the two cases
  secondaryGoals(c).forEach(g => L.push(`Secondary goal [${typeLabel(g.type)}]: ${g.text} — ${g.verdict ? verdictLabel(g.verdict) : 'no verdict'}`));
  const gr = getGradReview(c);
  if(gr && gr.verdict) L.push(`Graduation check-back: ${(GRAD_REVIEW_VERDICTS.find(v => v.key === gr.verdict) || {}).label} on ${fmtDate(gr.doneOn)}${gr.note ? ` — ${gr.note}` : ''}`);
  return L;
}
```

  The graduated-with-no-goals line (ruling M1) reads `c.graduation`: `noGoal:true` gives "No goal recorded."; `graduation` null gives "Graduated before goal tracking.". Fill in the exit branch for real: map each `sessionsNotNeeded` id to `Session N — title` through `getSessionTemplateSet(c)` (an id match, or a numeric string to an index).

- [ ] **Step 4: Insert the section in `buildKnowledgeTransferText`:** after `L.push('');` (`:19912`) add `buildGoalsSectionLines(c).forEach(x => L.push(x)); L.push('');`. Nothing else changes order. `promisedOutcomes` stays under WHAT WAS SOLD.

- [ ] **Step 5: Re-run the suite and the guide.** The suite with `--expect 422` should give `422/422`; the guide `18/18`. Measure the packet lengths on the demo book (seed, then `DATA.customers.map(c => buildKnowledgeTransferText(c).length)` via a throwaway probe tail, logged to `.artifacts/grad-plan/packet-len.log`). Record min, median and max in `VALIDATION.txt` next to the spec's 691–1,714 (median 1,281). No cap is added.

- [ ] **Step 6: Record the mutation proof** (move the GOALS insert to after SESSION HISTORY; c5a goes red; restore). **Update the counts to 422, then commit.**

```bash
git add osm-book-of-business-tracker-1.0.html README.txt VALIDATION.txt CHANGELOG.txt
git commit -m "Graduation plan task 5: GOALS section leads the knowledge-transfer packet"
```

---

## Task 6: Gainsight items and Settings

**Model:** Sonnet. Invoke `frontend-design` for the Settings block layout only (it copies the `advisor-risk-keywords` textarea style, `:24376-24387`). **Supports:** A1. It completes §4.5 and §4.6.

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`:
  - the "GRADUATION PLAN (actions)" section (`commitGoalEvent`);
  - the goal-form submit handlers (create and change, Task 2/3), the secondary verdict handler (Task 2) and the graduation confirm handler (Task 4);
  - `openSettingsModal` (`:24344`): a new `<details>` "Graduation gates" block after the Local Advisor keywords `</details>` (`:24394`);
  - the `#modal-save` handler (`:24577-24593`), `parseSettingsDraft` (`:24095`) and `applySettingsDraft` (`:24138`);
  - the self-check block.
- Modify `README.txt:74`, `VALIDATION.txt:47`, `CHANGELOG.txt:36`.

**Interfaces:**
- Consumes: `queueGainsightItem(kind, customer, payloadText)` (`:17915`, which saves), `getGainsightQueue`, `normalizeGoalGatesConfig`, `GOAL_TYPES`.
- Produces:
  - `GOAL_GAINSIGHT_KIND = 'Success Plan objective'`;
  - `goalGainsightPayload(event, goal) → string`, with event `'created' | 'changed' | 'verdict'`;
  - `commitGoalEvent(c, event, goal) → bool`, which queues exactly one item;
  - `renderGoalGatesSettings() → html`;
  - `parseSettingsDraft(raw)` accepts an optional `raw.goalGates = {<key>: {<type>: string}}` and returns `draft.goalGates` (or `undefined` when absent); `applySettingsDraft` writes `candidate.config.goalGates` only when `draft.goalGates` is defined.

- [ ] **Step 1: Write three failing checks.**
  - **c6a** Save `DATA.gainsightQueue` (and whether the key existed), and restore both in `finally`:
    - `commitGoalEvent(c,'created',g)` adds exactly 1 item, `kind === 'Success Plan objective'` and `payload === 'Update Success Plan objective: ' + g.text`;
    - `'changed'` then `'verdict'` each add exactly 1 more (3 total);
    - the verdict payload ends with ` — verdict: Met`.
  - **c6b** source scan. These handler bodies each contain `commitGoalEvent(`: the goal-form submit (create and change), the graduation confirm, and the secondary verdict handler. Find them by their `data-` selectors or modal function names in the function source (the same method as c4e). Also, `createGoal`, `changePrimaryGoal`, `setGoalVerdict` and `applyGraduation` do **not** contain `queueGainsightItem` (P5).
  - **c6c**
    - `parseSettingsDraft({...validRaw, goalGates: {'Financial Reporting': {publish: ' Filing submitted \n\n'}, GRC: {}}})` returns `goalGates['Financial Reporting'].publish` equal to `['Filing submitted']`, and `GRC` with all 4 types `[]`;
    - `applySettingsDraft(cloneData(DATA), draft)` writes it;
    - a draft without `goalGates` leaves `config.goalGates` untouched;
    - `defaultGoalGatesConfig()['Financial Reporting']` is still all empty.

    `validRaw` is built from the current `DATA.config` exactly as the existing settings checks build theirs (grep `parseSettingsDraft(` in the suite and copy that fixture).

- [ ] **Step 2: Run the suite and see red.** With `--expect 425`, expect `422/425 passed, 3 failed`.

- [ ] **Step 3: Write the queue helper:**

```js
const GOAL_GAINSIGHT_KIND = 'Success Plan objective';
function goalGainsightPayload(event, goal){
  const base = 'Update Success Plan objective: ' + goal.text;
  return event === 'verdict' ? `${base} — verdict: ${(GOAL_VERDICTS.find(v => v.key === goal.verdict) || {}).label || goal.verdict}` : base;
}
// One item per goal event (spec §4.5). Local queue only — nothing is sent (G07 open).
function commitGoalEvent(c, event, goal){
  if(!c || !goal || !['created','changed','verdict'].includes(event)) return false;
  return queueGainsightItem(GOAL_GAINSIGHT_KIND, c, goalGainsightPayload(event, goal));
}
```

  In each handler, after the domain call succeeds, call `commitGoalEvent(c, '<event>', goal)` in place of the separate `saveData()` (`queueGainsightItem` already saves), then `render()`. The graduation confirm calls it with `'verdict'` (and with `'created'` first when it created the goal inline).

- [ ] **Step 4: Build the Settings block.** `renderGoalGatesSettings()` loops over `Object.keys(DATA.config.goalGates || {})` together with `DATA.config.modules`, de-duplicated, and outputs one row per key. Each row has four textareas `data-goal-gates="${escapeAttr(key)}|${type}"` (one gate per line, `font-family:var(--font-mono); font-size:var(--text-xs)`). A note above them: "Editing these defaults changes new goals only. Existing goals keep the gates they were created with. Financial Reporting and GRC start empty until their content is agreed."
  - In `#modal-save`, add `goalGates` to the raw object, built from the `[data-goal-gates]` textareas.
  - In `parseSettingsDraft`, turn it into lists: split on `\n`, `cleanGoalText(…, 200)`, filter empties, cap at 20, then `normalizeGoalGatesConfig(parsed, DATA.config.modules)`.
  - In `applySettingsDraft`, add `if(draft.goalGates) candidate.config.goalGates = draft.goalGates;`.

- [ ] **Step 5: Re-run the suite and the guide.** The suite with `--expect 425` should give `425/425`; the guide `18/18`. Mutation proof: in `commitGoalEvent`, call `queueGainsightItem` twice. c6a must go red (`items added 2`), then restore.

- [ ] **Step 6: Update the counts to 425 and commit.**

```bash
git add osm-book-of-business-tracker-1.0.html README.txt VALIDATION.txt CHANGELOG.txt
git commit -m "Graduation plan task 6: Success Plan items in the Gainsight queue, Graduation gates settings"
```

---

## Task 7: Scenario seed, headless acceptance run, docs

**Model:** Sonnet. **Supports:** A1–A8 end to end (A3–A8 measured by the scenario run, A1 by the suite, A2 by Task 1's dry run re-run here).

**Files:**
- Create: `tools/graduation-scenarios-seed.js`.
- Modify: `tools/selfcheck.mjs` (comma-separated `--seed`, readiness waits for `runSelfChecks` when a seed is given and checks `--fn` after seeding, and a new `--verbose` flag).
- Modify: `README.txt` (Graduation Plan section and the run commands), `CHANGELOG.txt` (1.0 entry bullets), `VALIDATION.txt` (the measured A1–A8 table).

**Interfaces:**
- Consumes everything above: `createGoal`, `setGoalGateDone`, `changePrimaryGoal`, `ackGoalChange`, `customerGoalChangedSignal`, `customerReadyToGraduateSignal`, `validateGraduationDraft`, `applyGraduation`, `plannedSessionTotal`, `buildKnowledgeTransferText`, `todayAccountCandidates`, `prepareBookData`, `SIGNAL_DEFS`, `sessionsCompletedCount`.
- Produces: `window.runGraduationScenarios() → {passed, failed, results:[{name, ok, detail}]}`, where **every** result's `detail` is the measured value.

- [ ] **Step 1: Extend `tools/selfcheck.mjs`** (about 15 lines changed):
  - `const seedPaths = (flag('seed', '') || '').split(',').filter(Boolean)`. Evaluate each seed in order with the existing wrapper.
  - Readiness: wait for `typeof window[seedPaths.length ? 'runSelfChecks' : fnName] === 'function'`. After seeding, if `typeof window[fnName] !== 'function'`, print `window.${fnName}() was not defined by the seed.` and exit 2.
  - `--verbose`: also return passing results `{name, detail}` (detail capped at 300) and print `  PASS  ${name} — ${detail}` before the summary line.

  Verify that nothing else moved: re-run the suite (`--expect 427` → `427/427`) and the guide (`18/18`).

- [ ] **Step 2: Write `tools/graduation-scenarios-seed.js`**, which runs after `demo-seed.js`. It defines `window.runGraduationScenarios`, which returns six results:
  - **A3**
    - Take `const raw = cloneData(DATA)`; set `raw.schemaVersion = 13`; delete `raw.config.goalGates` and every customer's `goals`/`exit`.
    - Run `const migrated = prepareBookData(raw, 'Scenario-A3')`.
    - Swap `DATA = migrated` and reset with `_renderMemoResets.forEach(r => r())`.
    - Count `detect` hits for `goal_changed` and `ready_to_graduate`. Separately, count `todayAccountCandidates(c, {gainsightByCustomer:{}})` rows whose `source` is `signal:goal_changed` or `signal:ready_to_graduate`.
    - Restore `DATA`. `ok` = both counts are 0 and the account count is greater than 0. The detail is `measured rows=0 detect=0 accounts=17`.
  - **A4 Scenario A (on plan)**
    - A Sustainability account with `totalSessions:8`, 8 held session activities (`sessionNumber` 1..8) and `targetGraduationDate = isoAddDays(todayISO(), 14)`.
    - Create the `publish` goal and tick every gate.
    - `ok` = `customerReadyToGraduateSignal(c) !== null`. The detail is `ready_to_graduate fired=true gates=5/5 sessions=8/8`.
  - **A5 Scenario B (early exit, week 7)**
    - `implementationDate = isoAddDays(todayISO(), -49)`, `totalSessions:6`, sessions 1–5 held.
    - A `program` goal with all gates done.
    - `applyGraduation(c, {verdict:'met', note:'Customer runs data collection on their own', exitReason:'goal_met_early'})`.
    - `ok` = `exit.reason === 'goal_met_early'`, the tally `${sessionsCompletedCount(c)}/${plannedSessionTotal(c)}` reads `5/5`, and the packet contains `Early exit: Goal met early`. The detail is `exit.reason=goal_met_early tally=5/5 packetLine="…"`.
  - **A6 Scenario C (goal change)**
    - A `publish` goal "Publish FY2026 report".
    - `changePrimaryGoal` to `setup_next` "Ready for next year's reporting cycle", because "Report moved to consultants; customer owns next cycle".
    - `ok` = the packet contains `` `Changed ${fmtDate(todayISO())}: Publish FY2026 report → Ready for next year's reporting cycle, because Report moved to consultants; customer owns next cycle.` ``, `goal_changed` fires before `ackGoalChange`, and it does not fire after. The detail is the measured line plus `firedBeforeAck=true firedAfterAck=false`.
  - **A7 FR account**
    - Module `'Financial Reporting'`, a `publish` goal (0 gates), `applyGraduation({verdict:'partly', note:'Filing done, review cycle still manual'})` with all sessions held.
    - `ok` = the goal has 0 gates, the stage is `graduated`, the verdict is `partly`, the packet contains `Gates: 0 gates`, and nothing threw. The detail states each value.
  - **A8**
    - A primary goal with 2 open gates.
    - `validateGraduationDraft({verdict:'met', note:''})` gives `missing` containing `note` and a non-null `notePrompt`.
    - With a note, `ok:true` and `applyGraduation` returns true.
    - The detail is `asked=true blocked=false promptLen=N`.

  Each scenario builds its account inside a cloned `DATA.customers` and activities (throwaway browser profile), uses `Date`-free fixed text, and catches its own errors into `detail`.

- [ ] **Step 3: Run the scenario harness and see red, then green.** Before Step 2's file exists, the command must exit 2 ("No such file"). With the file in place:

  `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js,tools/graduation-scenarios-seed.js --fn runGraduationScenarios --verbose --expect 6 > .artifacts/grad-plan/scenarios.log 2>&1; tail -8 .artifacts/grad-plan/scenarios.log`

  Expected: six `PASS  A3…` to `PASS  A8…` lines, each with its measured value, then `runGraduationScenarios: 6/6 passed, 0 failed`, exit 0. To prove the run can fail, temporarily break the seed's A3 expectation to `rows === 1`, see `5/6`, then restore. This is the seed's own liveness check; production code is not mutated here.

- [ ] **Step 4: Re-run the A1 and A2 evidence.** Run the suite (`--expect 427` → `427/427`), the guide (`18/18`), `node tools/migration-dryrun.mjs osm-book-of-business-tracker-1.0.html --from 13` (exit 0, the three summary lines) and `--from 12` (exit 0).

- [ ] **Step 5: Write the docs.**
  - README.txt gets a "Graduation plan" section: the goal on the Overview tab, gates, Change goal, the graduation confirm and early exit, the GOALS block in the packet, the Settings → Graduation gates block (FR/GRC empty by design), and the run commands from Steps 3–4.
  - CHANGELOG.txt gets the 1.0 bullets: schema 14, goals and gates, the two signals, the packet GOALS section, Success Plan queue items, and the suite count `427`.
  - VALIDATION.txt gets the A1–A8 table with the **measured** values from the logs (copy the detail strings) and the command for each.

- [ ] **Step 6: Commit the code and the docs together.**

```bash
git add tools/graduation-scenarios-seed.js tools/selfcheck.mjs README.txt CHANGELOG.txt VALIDATION.txt
git commit -m "Graduation plan task 7: scenario seed A/B/C/FR, headless A3-A8 run, README and CHANGELOG"
```

---

## Review (after Task 7)

**Model:** the top model, for the whole-branch review (`superpowers:requesting-code-review`, then `/code-review`). It checks:
- spec coverage §3–§5;
- that FR/GRC gates are empty in every default path;
- that nothing is sent to any service;
- the suite purity guards;
- that `docs/research/internal/` is absent from `git log --stat master..graduation-plan`.

The run then stops for merge.

## Self-review notes (the plan against the spec)

- §3.1 fields → Task 1. §3.2/§3.3 → Task 1 (`defaultGoalGatesConfig`) and Task 6 (Settings). §3.4 → Task 1. §3.1 reuse: `planText` → Task 2; `gradReview` untouched → Task 5 prints it; `handoffMeetingOn` → Task 2.
- §4.1 → Task 2. §4.2 → Task 2. §4.3 → Task 3. §4.4 → Task 4. §4.5 → Task 6. §4.6 → Task 6. §5 → Task 5. A1–A8 → Task 7 (plus the unit checks in Tasks 1–6).
- Open ambiguities are carried as P1–P6 above. One more was ruled by Ian as **M1**: a graduation through the confirm's "no goal recorded" path with every session held would leave no goals and no exit, the same data as a historic graduation. The confirm now stores `c.graduation = {on, noGoal}` (Task 4), the migration leaves historic graduations `null` (Task 1), and the packet tells the two apart: "No goal recorded." against "Graduated before goal tracking." (Task 5). This is not open any more.
