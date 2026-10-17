# OSM Day and Customer Lifecycle Simulation Implementation Plan (revision 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: node --test "test/*.test.mjs"
Data: (none)
Tasks: 12
helperToolCallCap: 60

**Goal:** One command (`node tools/sim/osm-day/run.mjs`) walks Ian's workday (Part A, D1-D10) and one customer's life (Part B, L1-L12) on tracker 1.0 and 1.1, with a break per checked step, plus fixes F1 and F2.

**Architecture:** Pure, unit-tested modules (`lib/results.mjs`, `lib/fakes.mjs`, `lib/report.mjs`, `lib/breaks.mjs`) plus a CDP browser layer (`lib/browser.mjs`: one headless Chrome per part, throwaway profile, fake clock, fake AI and fake connector through CDP `Fetch`). Steps are `{id, run(ctx)}`; the break for each checked step lives only in `lib/breaks.mjs`. Reuses `.ledger/2026-10-16-runway-day-sim/spikes/{clock-spike,ai-spike,ft-run}.mjs` and `tools/sim/steps/01..06`.

**Tech Stack:** Node 26 (global WebSocket, fetch, `node:test`), headless Chrome, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-16-osm-day-lifecycle-sim-design.md`. Run prompt: `docs/RUNWAY_DAY_SIM_RUN_PROMPT.txt`. Revised after the Opus and Codex plan reviews (rounds 1 and 2) plus the lead's rulings (list at the end).

## Global Constraints

- Never edit `osm-book-of-business-tracker-1.0.html` or `-1.1.html`. Full sha256 (measured by the lead 22:29 PDT, file `.ledger/2026-10-16-runway-day-sim/tracker-sha256.txt` read by me; I did not run sha256):
  - 1.0 (1,256,628 bytes) `a21ca8c34c9c0859bf6b26e77f53a748e34daa026c21d2dba8f95f980d2fbddb`
  - 1.1 (1,281,558 bytes) `b247a93cd504416518077088e5092bad234ec5eb5a51491bc24f87e08edd22d2`
- Baseline (from the packet, not re-run by me): suite 44 tests / 42 pass / 0 fail / 2 skipped; selfcheck 475/475 both. `tools/selfcheck.mjs` is an existing tool the run prompt names as a check; it is out of scope here: not changed, and this plan makes no claim about its launch.
- The spec's PASS conditions are kept as written. Where the tracker lacks the thing (D2 transcript, D3 open deliverables, D8/L8 leaving the open list, L11 CSAT refusal), the step reports FAIL as a finding. Never reinterpret to make it pass; never fix the tracker.
- Headless Chrome with `--user-data-dir` throwaway profile only; never chrome.exe without it; never port 8790; no screenshots, screencasts or recordings; no write under `~/.claude/` by any task.
- AI guard (behavioural, not spelling): every browser the sim, the probe and the field test launches adds `--host-resolver-rules="MAP api.anthropic.com ~NOTFOUND, MAP api.openai.com ~NOTFOUND, MAP generativelanguage.googleapis.com ~NOTFOUND"` (hostnames in resolver arguments are allowed and required). The sim answers the three hosts through the fake and counts them: `ctx.aiStats() -> {fake, escaped}`, where `escaped` counts provider-host requests that reach the network (`Network.loadingFailed` with a name-not-resolved error for those hosts). `run.mjs` and `probe.mjs` exit 2 if any browser ends with `escaped > 0`. The static ban is on outbound-call code only: no `callAiAPI(` and no URL with a scheme (`https?://` plus a provider host) in `tools/sim/run-field-test.mjs`, `tools/sim/steps/*.js`, `tools/sim/osm-day/**` other than `lib/fakes.mjs` and `lib/browser.mjs` (which hold the Fetch patterns).
- Fake connector: `http://127.0.0.1:<port>` (the only form `normalizeConnectorUrl` accepts, 1.0:1750-1752 and 1.1:1765-1767, measured by Opus), port chosen from 9900-9999 and never the CDP port or 8790; answered by CDP `Fetch` (incl. the CORS preflight), so nothing listens.
- Synthetic data only; emails on example.com or `.invalid`. Never read `book-of-business-RESTORE-POINT-*.json`, exports or zips. Carve-out: D10 and L10 read ONLY files this run's own browser downloaded into its own `sim-runs/<stamp>/downloads-<part>/` folder (`Browser.setDownloadBehavior` set at launch for every browser, so nothing lands in Ian's Downloads).
- Cleanup (`cleanupProfile`, used by `stop()` and by `run-field-test.mjs`): (1) kill by PID, (2) wait until that PID has exited (poll `tasklist /FI "PID eq <n>"`, up to 20 s), (3) only then `rmSync` the profile with retries, (4) throw (exit 2) if the process is alive or the folder remains. It never deletes while the process is alive.
- Logs and probe output go to files under `sim-runs/` (git-ignored, Task 11). Check commands print only counts and one line per step.
- Exit codes: 0 all steps PASS or listed GAP and every break FLIPPED; 1 any FAIL or VACUOUS; 2 harness failure, including any inventory error (below).
- Fixed GAP list: D3 agenda; D7 CTA close / success plan task / Renewal Forecast Scorecard; L10 CSM request form; L12 CSAT tracking.
- Inventory. FULL run (no `--part`, `--only`, `--no-breaks`): per version 22 steps (D1-D10, L1-L12) and 21 break results (every step except L12); any shortfall, a break on L12, a checked step reported GAP, or an unknown id is a harness failure (exit 2). PARTIAL run (any of those flags): `validateRun` takes `scope = {ids, breaks}` and enforces exactly the selected ids (and exactly their breaks when breaks are on; none when `--no-breaks`); the report header and the JSON carry `partial:true`, and `verify.mjs` ignores partial results for C1-C5 (it errors if only partial results exist).
- Break result rule: FLIPPED only when the unbroken run PASSed and the broken run FAILed; VACUOUS when the unbroken run PASSed and the broken run still PASSed; NOT-TESTED (baseline FAIL) when the unbroken run FAILed. NOT-TESTED always sits beside a FAIL, so exit is 1.
- Part A fake date Wed 2026-10-21; Part B calendar below. Part A and Part B have separate setup, separate profiles.
- Tests: `node --test` on explicit files; each new unit test seen RED before its code exists.

## Evidence labels

measured = run by someone (the lead's fingerprints; Opus's greps; my grep that all 24 override targets exist as `function` in 1.1); read = tracker source read (1.0 line numbers, 1.1 about +233); assumed = reasoning only, with the probe in Task 5 that settles it. I ran no browser.

## Breaks (all in `lib/breaks.mjs`; 21 entries; the table is the spec of that file)

Mechanism. Each break is a JS string evaluated with `Runtime.evaluate` and ending `window.__simBreak='<id>'`. A navigation reruns the classic script, whose `function` declarations rebind the originals, so `browser.openOn(iso)` re-evaluates the active break after every load, after the `typeof DATA` wait, and then calls `render()` so handlers bound by reference (exportData, D10) take the override. `addScriptToEvaluateOnNewDocument` cannot do this (it runs before the declarations, which then overwrite it); it is used only for the clock. After every re-install `openOn` calls `assertMarker(await ev('window.__simBreak'), expectedId)`, which throws a harness error (exit 2) when the marker is absent or different; each step records `breakActive:true` in its evidence for every date it checks. Top-level function declarations are window properties, so `name = ...` replaces the binding; `ACTIVITY_TYPES` is a const object, so its property is mutated.

Markers: setup and steps write texts starting `SIM-<id>` so scoped breaks touch only the target record.

| Step | Override (JS body) | Status |
|---|---|---|
| D1 | `callsScheduledToday = () => []` | PINNED (1.0:11848) |
| D2 | `renderBeatPrep = () => ''` | PINNED (1.0:12274-12281) |
| D3 | `{const o=renderBeatPanel; renderBeatPanel=(b,d)=>o(b,d).replace(/SIM-OWE[^<]*/g,'')}` (removes only the seeded open-deliverable texts). Break-pass guard (round 4): BEFORE the break the panel must render a non-empty set of seeded `SIM-OWE` entries (count >= 1, listed in evidence); AFTER the break every one of those entries must be gone, the `SIM-QUESTION` text must still be present, and the rest of the panel content must still be present (the "Call prep" and "Open questions" headings AND the non-`SIM-OWE` body text captured before the break: the panel text with the `SIM-OWE` entries removed must equal the broken panel text). A heading alone does not count. Any failure is a harness error (break too wide or not effective) | ASSUMED `renderBeatPanel` global (read 1.0:12174) |
| D4 | `{const o=commitDataCandidate; commitDataCandidate=d=>{Object.values(d.activities).flat().filter(a=>/SIM-D4/.test(a.summary\|\|'')).forEach(a=>{delete a.transcript}); return o(d)}}` | ASSUMED global function (call at 1.0:16409) |
| D5 | none in the page: the fake AI router answers the call-review prompt with `callReviewReply({email:false})` | PINNED (render only with `cr.email`, 1.0:14539; `validateCallReview` nulls email, 1.0:3036-3041) |
| D6 | `{const o=saveData; saveData=()=>{DATA.customers.filter(c=>c.name==='Orion Semiconductor').forEach(c=>(c.commitments\|\|[]).filter(x=>/^SIM-D6 /.test(x.text)).forEach(x=>{x.doneOn=null})); return o()}}` | PINNED (handler 1.0:15697-15706) |
| D7 | `queueGainsightItem = () => true` | PINNED (1.0:10567, call :15848) |
| D8 | `markRiskActioned = () => {}` | PINNED (1.0:10315, call :15222) |
| D9 | `inImplementation = () => false` | PINNED (1.0:5918) |
| D10 | `exportData = () => {}` (render() after install rebinds :15208) | PINNED |
| L1 | `{const o=saveData; saveData=()=>{DATA.customers=DATA.customers.filter(c=>c.name!=='Fernhollow Renewables'); return o()}}` (add-customer save unnamed) | ASSUMED; probe greps the modal save for a named function |
| L2 | `setHandoffField = () => false` | PINNED (1.0:3742, :15715) |
| L3 | `ACTIVITY_TYPES['Partner Sync']=['Log call summary in Gainsight timeline']` | PINNED (checklist from ACTIVITY_TYPES, 1.0:16388) |
| L4 | `inImplementation = () => false` | PINNED |
| L5 | `markImplementationGoLive = () => false` | PINNED (1.0:5953, :16230) |
| L6 | `{computeCoverage = () => null; const o=todayActionList; todayActionList=(...a)=>o(...a).filter(r=>!/Fernhollow/.test(JSON.stringify(r)))}` (round 4: removes EVERY Today appearance of Fernhollow, whatever the reason (coverage, risk, silence, anything), not only coverage ones; `computeCoverage` null is kept so no other path reintroduces a coverage reason). Break-pass guard: on every day 10-06..10-12 (through day 7) the rendered Today must contain no Fernhollow row; if any remains, the L6 break result is reported VACUOUS (not FLIPPED, not hidden) with the day and reason text in the evidence | `computeCoverage` PINNED (1.0:6630); `todayActionList` as the Today source ASSUMED (probe `--control l6`) |
| L7 | `isPaused = () => false` | PINNED (1.0:5839) |
| L8 | `classifyRiskText = () => []` | PINNED (only the Category-signal path uses it, per Opus) |
| L9 | `toggleComplianceGate = () => false` | PINNED (1.0:7572, :14753) |
| L10 | `isGraduatingSoon = () => false` | PINNED (1.0:8213) |
| L11 | `confirmGraduation = () => false` (the modal OK runs it, 1.0:4889-4894) | ASSUMED called by name at click time; probe |

D3 plainly: the seeded open deliverable and last-meeting question are texts the panel will show only if it can. The checklist item and the question are expected on the panel; the commitment is expected NOT to be (1.0:12276-12288 shows checklist labels, not commitments). If any seeded text is absent, D3 FAILs (a finding) and its break is NOT-TESTED by the rule; the plan does not pass D3 on absent text. So the break mechanism is still proven independent of D3's verdict: Task 5's probe `--control d3` renders the seeded panel and requires, BEFORE the break, a non-empty set of seeded `SIM-OWE` entries on it (zero entries, or a heading with no entries, exits 1); applies the D3 override; then requires, AFTER, every one of those entries gone, the `SIM-QUESTION` text still present, and the rest of the panel content still present (exit 1 otherwise). A heading alone does not count.

Not pinned: L1 (unnamed save), D3/D4/L11 (assumed globals), L6's `todayActionList` filter. Any ASSUMED entry the probe contradicts is replaced in `lib/breaks.mjs` only.

## Facts the steps depend on (read, 1.0 line numbers)

- Graduating-soon window: `isGraduatingSoon(c)` = not graduated, not in implementation, and `0 <= daysUntil(projectedGraduationDate(c)) <= 30` (1.0:8213-8218). The constant 30 is read from code by the probe (regex over `function isGraduatingSoon` in BOTH files; the probe exits non-zero if it is not 30 in both). Dates are NOT taken from `isGraduatingSoon`: they come from the committed graduation date; `isGraduatingSoon` is the thing under test.
- Part B committed date and chronology (ruling P2): N = `c.totalSessions` at L9; sessions on 2026-12-07 + 7k, k = 0..N-1; T = date of session N = 2026-12-07 + 7(N-1), set on 12-07 through the graduation-date control; L10 day = T-7 (the day session N-1 is logged); L11 day = T. Milestones run in date order, so L10 sees no later activity: (1) L9 phase 1: sessions k = 0..N-2 (the last one on T-7), goal, committed date, outcome plan, Readiness Assessment, CSAT contact; (2) L10 on T-7; (3) L9 phase 2: session N on T; L9's verdict is computed after phase 2 (all N sessions plus the four recordings); (4) L11 on T. Report order stays L9, L10, L11. Secondary evidence only: on T-31 the account is not graduating soon.
- Drift (L6): `computeCoverage` `due_soon` at `daysUntilDue <= dueSoonDays`, `neglected` >= `neglectDays` since touch; anchor = last activity (hand-off 10-05); pace default `defaultPaceDays` (1.0:6630-6649). Today shows the row as headline "Schedule Session N: <title>" and reason "Due in N days with nothing scheduled" (1.0:11623-11632). Today keeps the top `DAY_BEAT_MAX = 15` ranked rows (1.0:11796, slice :11912; 1.1:12108).
- Pause (L7): `#pause-until` (max today+90) and `#pause-reason`, account Details tab (1.0:14010-14014).
- Implementation hides gates: the Today beat panel shows "Gainsight gates start at Go-Live" (1.0:12219-12223) only for a beat on Today, so Part A books a call for an implementation account (D9). `pendingGainsightItems` skips implementation accounts (1.0:8344).
- Sentiment ask: beat block "Sentiment", `data-fp-toggle="sentiment|<id>"` "Mark logged" (1.0:12246-12253).
- Prep screen = Today beat panel: `renderBeatStanding` (Sessions n/total, last-note extract, "Read the full note" link), `renderBeatQuestions`, `renderBeatPrep` ("Call prep . Session N", "Pending deliverables" = unchecked checklist labels, not commitments) (1.0:12058, 12088, 12274). Commitments (1.0:13371) and transcripts are NOT on the panel; D2 and D3 are therefore expected to FAIL (findings).
- D4: `#act-type`, `#act-date`, `#act-session`, `#act-summary`, `#act-transcript`, `#btn-save-activity` (1.0:14641-14713, :16376); stored at `activity.transcript.text`.
- D5: `generateSessionDebrief` fires three AI calls at once: prose, extraction, call review (1.0:3085-3087). The fake router (Task 2) decides by prompt content (markers read from `buildSessionDebriefPrompt` 1.0:2740 and `buildCallReviewPrompt` 1.0:2945-2990) and returns review JSON for the review prompt, a JSON array for extraction, prose otherwise. "Draft email recap" textarea `data-debrief-email-text`, button `data-copy-debrief-email` (1.0:14539-14546); clipboard read back with `navigator.clipboard.readText()` after `Browser.grantPermissions` (assumed headless-capable; probe).
- D7: Account Gainsight tab `data-gainsight-batch="<id>"` queues kind "Pending items batch" whose text contains "Log call summary in Gainsight timeline" (1.0:15842-15850, :3154). The step finds ITS OWN row (that kind, that account, that text). Send: `#btn-send-gainsight` on the Risk tab only when `connectorConfigured()`; `POST <url>/v1/push`, reply `{results:[{id,status:'sent',externalId}]}` (1.0:10609-10631); settings in `localStorage['obm-connector-settings-v1']`.
- D8/L8 risk actioning: `markRiskActioned` fires only from Risk tab `data-risk-confirm` "Yes - it's real" (1.0:15218-15225). PASS (spec text kept): after actioning, the account's case is no longer in the Risk tab's open list. Confirmed cases stay rendered (1.0:9546, 9573), so this is expected FAIL (finding). Evidence also records `lastActioned` and the card state.
- D10: `[data-wrap-day]` -> `closeTheDay` (1.0:10203, :15261); `[data-backup-now]` -> `exportData`; the downloaded JSON must hold 35 customers.
- L5: `data-impl-phase`, `#btn-impl-golive`, modal "Mark Go-Live" (1.0:16223-16239).
- L11: modal from `openGraduationConfirmModal` (1.0:16572); queue item kind "Success Plan objective" only when the primary goal has a verdict (1.0:4895-4897); `customerReadyToGraduateSignal` needs `targetGraduationDate` and a primary goal (1.0:4816); `validateGraduationDraft` has no CSAT rule (1.0:4845-4864; confirmed by Opus on both versions): the refusal half is expected FAIL.
- L8 text (pinned): `The product doesn't behave as scoped for the reporting workflow.` (straight apostrophe; Product phrase "product doesn't", 1.0:10128; none of risk, concern, blocked). L7 email text: `Customer paused their CSRD rollout until the ruling is clear; will return after 30 November.` (no word "omnibus", which would raise a Regulatory case, 1.0:10133; the spec does not mandate the word).

## Setup (separate for the parts)

- `setupA` (fake date 2026-10-21): steps 01-06 of `tools/sim/steps` (NOT 07, which logs Orion's call; Task 7 Step 1 reads 07 first), then Fernhollow Renewables via "Add customer" (35 accounts), connector + AI settings, then writes (labelled setup). For **Orion Semiconductor**, seeded for D2/D3: an activity dated 2026-10-14 with summary containing `SIM-LASTNOTE`, a transcript containing `SIM-TRANSCRIPT-LINE`, a last-meeting question thread `SIM-QUESTION ...` (built with the tracker's own `parseOutstandingQuestions`, 1.0:2917), an unchecked checklist item labelled `SIM-OWE checklist: confirm sandbox access` (the open deliverable the panel shows if it can), and commitments `SIM-OWE you owe the sandbox walkthrough` (i_owe, due 2026-10-23) and `SIM-OWE they owe the data file` (they_owe); the D6 pair `SIM-D6 you owe the recap deck` / `SIM-D6 they owe the access list` on Orion; a back-dated risk log entry (firstSeen 2026-10-10) on Coastal Water Authority for D8. Calls booked for 2026-10-21: **Orion Semiconductor 10:00, Aurora Renewables 13:30, and one implementation account** (the alphabetically first account with `inImplementation(c)`, name recorded by setup into the evidence). D1 expects exactly these three call beats.
- `setupB` (fake date 2026-08-03): steps 01-06 only, 34 accounts, NO Fernhollow; L1 creates it through "Add customer".

## File structure

- Create `tools/sim/osm-day/lib/{results,fakes,report,breaks,browser,setup}.mjs`, `tools/sim/osm-day/{steps-a,steps-b,probe,run,verify}.mjs`.
- Create tests `test/osm-day-{results,fakes,report,safety,steps}.test.mjs`.
- Modify `tools/sim/run-field-test.mjs`, `tools/sim/steps/99-measure.js`, `.gitignore`, `README.txt`.
- Locked (no task edits): both tracker HTML files, `tools/selfcheck.mjs`, `tools/sim/steps/01-07*.js`, `demo-seed.js`, `tools/step1-fixture.js`.

Groups and tuning: none; tasks run strictly in order, one helper each; no TUNE BRIEF tasks. Paid calls: none ($0); fake AI every run.

Helper-token estimates: T1 22k, T2 30k, T3 20k, T4 55k, T5 55k, T6 25k, T7 70k, T8 50k, T9 75k, T10 85k, T11 60k, T12 60k. **Run total about 607k.** Whole-sim wall time per part is measured in Task 11 (nothing assumed).

---

### Task 1: Result rules, inventory (full and partial), break verdict, exit code

**Files:**
- Create: `tools/sim/osm-day/lib/results.mjs`
- Test: `test/osm-day-results.test.mjs`

**Interfaces:**
- Produces: `STEP_IDS` (22 ids in order), `CHECKED` (21 ids = all but L12), `GAPS`, `classify({id, passed}) -> {id,status,gap}`, `breakVerdict(base, broken) -> 'FLIPPED'|'VACUOUS'|'NOT-TESTED'`, `validateRun({steps, breaks, scope}) -> string[]` (scope absent = FULL; else `{ids:string[], breaks:boolean}`), `exitCode({steps, breaks, scope, harnessError}) -> 0|1|2`.

- [ ] **Step 1:** Write tests: `classify({id:'D1',passed:true}).status==='PASS'`, `passed:false` -> FAIL; `classify({id:'D3',passed:true}).gap` is the D3 GAP text and status PASS; `classify({id:'D3'})` throws; `classify({id:'L12'}).status==='GAP'`; unknown id throws; `breakVerdict('PASS','FAIL')==='FLIPPED'`, `('PASS','PASS')==='VACUOUS'`, `('FAIL','FAIL')==='NOT-TESTED'`, `('FAIL','PASS')==='NOT-TESTED'`; FULL `validateRun` errors for 21 steps, a missing break, a break on L12, NOT-TESTED without a FAIL step; PARTIAL `scope={ids:['L7','L8'],breaks:true}` is valid with exactly those two steps and two breaks, errors on an extra step, a missing break, or a break outside the scope, and `breaks:false` errors if any break is present; `exitCode` 2 on harnessError or any validate error, 1 on any FAIL or VACUOUS, 0 when 22 steps all PASS/GAP and 21 FLIPPED.
- [ ] **Step 2:** `node --test test/osm-day-results.test.mjs`; expect FAIL (module not found).
- [ ] **Step 3:** Implement `results.mjs` (GAP texts: D3 'meeting agenda'; D7 'close a CTA after an ordinary call','success plan task update','Renewal Forecast Scorecard'; L10 'CSM request (Google form)'; L12 'CSAT survey sent/answered tracking and follow-up').
- [ ] **Step 4:** Re-run; expect all pass.
- [ ] **Step 5:** Commit `feat(sim): result rules, inventory, break verdict, exit code`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-results.test.mjs; echo exit=$?`
**Expected:** `# fail 0` and `exit=0`; before Step 3 the same command shows ERR_MODULE_NOT_FOUND and `exit=1`.

---

### Task 2: Fake clock, prompt-routed fake AI, fake connector

**Files:**
- Create: `tools/sim/osm-day/lib/fakes.mjs`
- Test: `test/osm-day-fakes.test.mjs`

**Interfaces:**
- Produces: `clockShim(iso) -> string`; `CORS` header array; `aiBody(url, promptText, opts) -> object` (provider wire format chosen from the URL host; content by prompt: review JSON when the prompt contains the call-review marker, JSON array for the extraction marker, else prose; `opts.email=false` omits the review's `email`); `callReviewReply({email}) -> string`; `connectorReply(requestBodyText)`; `connectorUrl(port)`.

- [ ] **Step 1:** Read `buildSessionDebriefPrompt` (1.0:2740), `buildCallReviewPrompt` (1.0:2945-2990) and `validateCallReview` (1.0:~3000-3041) to fix the distinguishing prompt substrings and JSON keys (assumed `{answers:[...], email:{subject,body}}`).
- [ ] **Step 2:** Write tests: `clockShim('2026-08-03')` run in `node:vm` gives a `new Date()` whose local y-m-d equals `2026-08-03` exactly (far from the real 2026-10-16, so it fails without the shim) and `Date.now()` advances; per-host body has the right top-level key (anthropic `content`, openai `choices`, gemini `candidates`); a review prompt yields parseable JSON with `email.subject`, with `{email:false}` no `email` key; an extraction prompt yields an array; `connectorReply` returns one `sent` result per id in `{items:[{id}]}`; `connectorUrl(9901)` matches `^http://127\.0\.0\.1:\d+$` and `connectorUrl(8790)` throws.
- [ ] **Step 3:** Run; expect FAIL.
- [ ] **Step 4:** Implement `fakes.mjs`.
- [ ] **Step 5:** Re-run; expect pass.
- [ ] **Step 6:** Commit `feat(sim): fake clock, routed fake AI, fake connector`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-fakes.test.mjs; echo exit=$?`
**Expected:** `# fail 0`, `exit=0`; red before Step 4.

---

### Task 3: Report, version diff, summary line

**Files:**
- Create: `tools/sim/osm-day/lib/report.mjs`
- Test: `test/osm-day-report.test.mjs`

**Interfaces:**
- Consumes: record `{id,status,gap,evidence,day,breakResult}`.
- Produces: `summaryLine(rec)`, `renderReport({version,steps,startedAt,partial})` (header says PARTIAL when `partial`), `diffVersions(a,b)`, `stripTimings(results)`.

- [ ] **Step 1:** Write tests: identical lists diff to `[]`; differing evidence gives one entry with the id; `summaryLine` for GAP and for NOT-TESTED contain those words; `renderReport` contains each id and status, and contains `PARTIAL` iff `partial:true`; `stripTimings` of two results differing only in `startedAt`/`ms` deep-equal; a pair with a differing status does NOT deep-equal.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Re-run; expect pass.
- [ ] **Step 5:** Commit `feat(sim): report, diff, summary line`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-report.test.mjs; echo exit=$?`
**Expected:** `# fail 0`, `exit=0`; red before Step 3.

---

### Task 4: Browser layer (launch, clock, fakes, guards, downloads, break re-install, safe cleanup)

**Files:**
- Create: `tools/sim/osm-day/lib/browser.mjs`
- Test: `test/osm-day-safety.test.mjs`

**Interfaces:**
- Consumes: Task 2 exports.
- Produces: `launch({version, startDay, runDir, part, seed}) -> ctx` with `ctx.ev(src)`, `ctx.click(selectorOrText)`, `ctx.type(selector, text)`, `ctx.openOn(iso)` (set clock, navigate, wait for `typeof DATA`, re-evaluate the active break, `render()`, `assertMarker`), `ctx.setBreak(id|null)`, `ctx.snapshot() -> {ls: string, state: object}` (`ctx.state` is a plain object steps write to, e.g. `{N, T}`), `ctx.aiStats() -> {fake, escaped}`, `ctx.stop()`, `ctx.pid`; `seed` = a snapshot object (localStorage restored before the page script runs, `ctx.state` restored). Exported pure helpers: `assertMarker(read, expected)` (throws on `undefined`/mismatch), `cleanupProfile({pid, profile, isAlive, kill, remove, exists, timeoutMs})` (kill, wait for exit, only then remove with retries; throws `process still alive` without calling `remove`, or `profile remains`), `countLeftovers(prefixes, dir)`. Chrome flags: `--headless=new --remote-debugging-port=<random 9400-9899> --user-data-dir=<mkdtemp, prefix osmsim-> --no-first-run --no-default-browser-check --disable-gpu --window-size=1440,900` plus the host-resolver rules. `Fetch.enable` patterns: the three AI hosts and `http://127.0.0.1:<connectorPort>/*`; `Network.enable` to count escapes; `Browser.setDownloadBehavior` to `<runDir>/downloads-<part>`; `Browser.grantPermissions` clipboard.

- [ ] **Step 1:** Write tests (behavioural negative controls): (a) `cleanupProfile` with `isAlive` always true and `timeoutMs` 200 throws `process still alive` and `remove` was never called (cleanup-order control); (b) with `isAlive` false but `exists` always true after `remove` throws `profile remains` (leftover control); (c) `countLeftovers(['osmsim-'], tmpdir)` increases by exactly 1 after the test creates `osmsim-test-<rand>` in the temp dir and drops back after removing it (a leftover profile makes the check see it); (d) `assertMarker(undefined,'D1')` and `assertMarker('D2','D1')` throw, `assertMarker('D1','D1')` does not (override-effectiveness control); (e) text greps over `tools/sim/osm-day/**`: no `captureScreenshot`, `startScreencast`, `screencast`, `8790`; `browser.mjs` contains `--user-data-dir` and `setDownloadBehavior`.
- [ ] **Step 2:** Run; expect FAIL (file missing).
- [ ] **Step 3:** Implement `browser.mjs` from the clock and AI spikes (spike copies stay in the ledger).
- [ ] **Step 4:** Re-run; expect pass.
- [ ] **Step 5:** Commit `feat(sim): browser layer`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-safety.test.mjs; echo exit=$?`
**Expected:** `# fail 0`, `exit=0` (controls a, b, c, d all executed and green); red before Step 3.

---

### Task 5: Break table module and probe with negative controls

**Files:**
- Create: `tools/sim/osm-day/lib/breaks.mjs`, `tools/sim/osm-day/probe.mjs`
- Test: `test/osm-day-steps.test.mjs` (starts here)

**Interfaces:**
- Produces: `BREAKS = {D1:{js}, ..., L11:{js}}` (exactly 21 keys, none for L12; D5 is `{ai:'noEmail'}`), each `js` ends `window.__simBreak='<id>'`; `OVERRIDE_NAMES`; probe `probe.mjs --version <v> [--control cleanup|ai|ai-negative|override|d3|l6]`.

- [ ] **Step 1:** Write tests: `Object.keys(BREAKS)` equals the 21 checked ids; every `js` ends with its own marker; every `js` parses (`new Function(js)` does not throw); each name in `OVERRIDE_NAMES` appears as `function <name>(` in BOTH tracker files; the body of `isGraduatingSoon` contains `days <= 30` in both files.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement `breaks.mjs` from the table.
- [ ] **Step 4:** Implement `probe.mjs --version <v>`: opens the page at 2026-10-21, writes `sim-runs/probe-<v>.txt` (one line per fact) and prints `probe <v>: <N> lines, <M> mismatches`; exits 1 on ANY mismatch of: `typeof` of each override name (incl. `renderBeatPanel`, `commitDataCandidate`, `saveData`, `confirmGraduation`, `todayActionList`, `parseOutstandingQuestions`) not `function`; re-install after reload leaving `window.__simBreak` unset (and the un-reinstalled reload must show it unset, else the premise is wrong); clipboard write/read mismatch; `GRAD_SOON_DAYS` not 30; config values different from the assumed `riskWatchDays 10, riskAlertDays 21, dueSoonDays 7, neglectDays 21, defaultPaceDays 14`; escaped AI requests > 0.
- [ ] **Step 5:** Controls, each exiting 1 when the guard is blind: `--control cleanup` launches a browser, calls `stop()`, then asserts `countLeftovers` and the PID are both clear, and also creates one `osmsim-control-*` folder and asserts the counter sees it; `--control ai` makes a page `fetch` to `https://api.anthropic.com/v1/messages` and requires `fake===1, escaped===0`; `--control ai-negative` calls `Fetch.disable` first then the same fetch, and requires `escaped===1` (a counter that stays 0 is blind); `--control override` sets break D1, navigates with re-install disabled (internal flag) and requires `openOn` to throw the marker error; `--control d3` (round 4) renders the seeded panel and requires, BEFORE the break, a non-empty set of seeded `SIM-OWE` entries on it (count >= 1; a heading alone, or zero entries, exits 1), then applies the D3 override and requires, AFTER, every one of those entries gone, the `SIM-QUESTION` text still present, and the rest of the panel content still present (the "Call prep" and "Open questions" headings plus the pre-break panel text minus the `SIM-OWE` entries equal to the post-break text), else exit 1; `--control l6` (round 4) runs the L6 days 10-06..10-12 with the L6 override and requires NO Fernhollow row on Today on every one of those days, for any reason (coverage, risk, silence or other; the control also reads the unbroken run first and requires at least one Fernhollow appearance on or before 10-12, so a control with nothing to remove cannot pass), else exit 1; if a row remains the control prints `L6 break VACUOUS: <day> <reason>` and exits 1.
- [ ] **Step 6:** Run tests, probe on 1.0 and 1.1, and each control on 1.0; if an ASSUMED row differs change only `lib/breaks.mjs` and note it in the ledger.
- [ ] **Step 7:** Commit `feat(sim): break table, probe, negative controls`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-steps.test.mjs; echo exit=$? && node tools/sim/osm-day/probe.mjs --version 1.0; echo exit=$? && node tools/sim/osm-day/probe.mjs --version 1.1; echo exit=$? && node tools/sim/osm-day/probe.mjs --version 1.0 --control ai-negative; echo exit=$?`
**Expected (assumed until run):** tests `# fail 0`; both probes print `mismatches 0` and `exit=0`; `ai-negative` prints `escaped=1 (guard sees escapes)` and `exit=0`; the other controls each print `control <name>: ok` with exit 0. Any contradicted ASSUMED row appears in `sim-runs/probe-<v>.txt` and as exit 1, not hidden.

---

### Task 6: Fixes F1 and F2, and the field-test launch guard

**Files:**
- Modify: `tools/sim/run-field-test.mjs` (TARGET line 23, launch args lines 32-34, `cleanup` lines 35-38), `tools/sim/steps/99-measure.js` (the FIX 5 block, lines 37-41)
- Test: `test/osm-day-safety.test.mjs` (add), `test/osm-day-steps.test.mjs` (add)

- [ ] **Step 1:** Add tests: `99-measure.js` text has neither `getImpactLog` nor `impactMinutesFor`; `run-field-test.mjs` contains a `--target` flag, the three `MAP <host> ~NOTFOUND` resolver rules (hostnames in resolver arguments are REQUIRED), a call to `cleanupProfile`-equivalent logic (wait for exit via `tasklist` before `rmSync`, and an `exit(2)` leftover branch); and the outbound-call ban, scoped to calls: no `callAiAPI(` and no `https?://` URL naming a provider host in `run-field-test.mjs` or `tools/sim/steps/*.js` (a hostname inside `MAP ... ~NOTFOUND` has no scheme, so both assertions pass together). `tools/selfcheck.mjs` is not read by any test.
- [ ] **Step 2:** Run both files; expect the new tests FAIL.
- [ ] **Step 3:** Edit `99-measure.js` (delete the FIX 5 block) and `run-field-test.mjs` (`--target` flag defaulting to 1.0; resolver args; cleanup waits for exit, retries deletion, fails loudly).
- [ ] **Step 4:** Re-run the tests; expect pass.
- [ ] **Step 5:** Run the field test on 1.0 and on 1.1, printing the `fieldtest-*` folder count in Temp before and after.
- [ ] **Step 6:** Commit `fix(sim): field test cleans up after exit, drops retired time-saved, blocks real AI hosts`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-safety.test.mjs test/osm-day-steps.test.mjs; echo exit=$? && node tools/sim/run-field-test.mjs --target osm-book-of-business-tracker-1.1.html --out sim-runs/ft-1.1.json; echo exit=$?`
**Expected:** tests `# fail 0`; field test exit 0 on both versions and the JSON has `ctx_status` (earlier measured on both: Off Track 2 / Watch 14 / On Track 18); `fieldtest-*` folder count after equals count before (one older folder from before this talk remains; not ours).

---

### Task 7: Setup A and Part A steps D1-D5

**Files:**
- Create: `tools/sim/osm-day/lib/setup.mjs`, `tools/sim/osm-day/steps-a.mjs`
- Test: `test/osm-day-steps.test.mjs` (add)

**Interfaces:**
- Produces: `setupA(ctx)`, `setupB(ctx)` (per "Setup"), `PART_A = [{id, run(ctx)->{passed,evidence}}]`, `PART_A_DEPS = {D5:['D4']}` (the only Part A step that depends on an earlier one; round 4), `main` when run directly (`--version`, `--only`; a dependency listed in `PART_A_DEPS` runs first, unchecked, labelled setup).

- [ ] **Step 1:** Read `tools/sim/steps/07-log-orion.js` and `06-history.js`; setup stays at 01-06 either way.
- [ ] **Step 2:** Add tests: `PART_A` ids are D1..D5 (D1..D10 after Task 8); each has an async `run`; `setupA` and `setupB` are exported and `setupB.toString()` does not contain `Fernhollow`; `PART_A_DEPS` deep-equals `{D5:['D4']}`.
- [ ] **Step 3:** Run; expect FAIL.
- [ ] **Step 4:** Implement `setup.mjs` (seeds exactly as in "Setup").
- [ ] **Step 5:** Implement D1-D5. D1: rendered Today call beats (selector read from 1.0:11896-11915, `kind:'call'`) equal exactly {Orion Semiconductor 10:00, Aurora Renewables 13:30, the implementation account}. D2: beat panel text contains "Call prep", "Session", "Sessions n/total", `SIM-LASTNOTE`, `SIM-TRANSCRIPT-LINE`, `SIM-QUESTION`, no click-through. D3: panel contains `SIM-OWE checklist`, `SIM-OWE you owe`, `SIM-OWE they owe` and `SIM-QUESTION` (GAP agenda noted); any absent text is listed in the evidence and the step FAILs. D4: Log tab, type Call, link next session, summary `SIM-D4 ...`, paste `SIM-D4-TRANSCRIPT ...`, save; activity appears in history with `transcript.text`. D5 (depends on D4: it recaps the D4 call): generate the debrief on the call D4 logged, "Draft email recap" appears, "Copy email", clipboard equals the recap text.
- [ ] **Step 6:** Re-run tests; expect pass.
- [ ] **Step 7:** Run `node tools/sim/osm-day/steps-a.mjs --version 1.0 --only D1,D2,D3,D4,D5`; commit `feat(sim): setup and Part A D1-D5`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-steps.test.mjs; echo exit=$? && node tools/sim/osm-day/steps-a.mjs --version 1.0 --only D1,D2,D3,D4,D5; echo exit=$?`
**Expected (assumed):** tests `# fail 0`; five summary lines marked PARTIAL: D1 PASS, D4 PASS, D5 PASS; D2 and D3 FAIL (transcript and commitments absent from the panel, findings); no `exit=2`.

---

### Task 8: Part A steps D6-D10

**Files:**
- Modify: `tools/sim/osm-day/steps-a.mjs`
- Test: `test/osm-day-steps.test.mjs` (add)

- [ ] **Step 1:** Add tests: `PART_A` ids are exactly D1..D10 in order, all in `CHECKED`; `PART_A_DEPS` still deep-equals `{D5:['D4']}` (D6-D10 each read only `setupA` seeds, so none is added).
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement D6 (Done on `SIM-D6 you owe` closes it; `SIM-D6 they owe` stays open), D7 (own row only: queue the batch, Risk tab, "Send to Gainsight" through the fake connector, own row shows sent; GAP notes listed), D8 (Coastal's back-dated case: confirm, then PASS only if the case is absent from the open list; evidence `lastActioned` and card state).
- [ ] **Step 4:** Implement D9 (implementation account's beat shows "Gainsight gates start at Go-Live", no Sentiment block; a post-Go-Live account's beat shows Sentiment, "Mark logged" flips it to logged) and D10 (wrap-up closes the day; Back up download read from `downloads-A/` only; 35 customers).
- [ ] **Step 5:** Re-run tests; expect pass.
- [ ] **Step 6:** Run the whole Part A unbroken on both versions; commit `feat(sim): Part A D6-D10`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-steps.test.mjs; echo exit=$? && node tools/sim/osm-day/steps-a.mjs --version 1.1; echo exit=$?`
**Expected (assumed):** tests `# fail 0`; ten lines D1..D10; D6, D7, D9, D10 PASS; D8 FAIL (confirmed case stays listed); exit 1 (findings), never 2.

---

### Task 9: Part B steps L1-L6

**Files:**
- Create: `tools/sim/osm-day/steps-b.mjs`
- Test: `test/osm-day-steps.test.mjs` (add)

**Interfaces:** Produces `CAL`, `PART_B`, `daysBetween(a,b)`, `main` (`--version`, `--only`; prerequisite rule in Task 11).

- [ ] **Step 1:** Add tests: `daysBetween('2026-10-05','2026-10-12')===7`; `CAL` has L1 2026-08-03, L2 08-05, L3 08-12, L4 08-24 and 09-21, L5 10-05, L6 10-06..10-26; `PART_B` (so far) ids L1..L6; `setupB` leaves no Fernhollow.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement L1 (Add customer "Fernhollow Renewables" with example.com contacts; in implementation, phase Align), L2 (Handoff tab fields saved, shown after reload), L3 (phase Kick-Off; Partner Sync activity logged with no checklist), L4 (Build 08-24, UAT 09-21; on each day On Track and no Readiness Assessment asked; break read-back each date).
- [ ] **Step 4:** Implement L5 (hand-off call logged as Call 10-05, not linked; Go-Live recorded; session plan appears; counts as onboarding).
- [ ] **Step 5:** Implement L6: each day 10-06..10-26 call `openOn`; record Fernhollow's rank in `todayActionList()`, the reason text, whether it is rendered on Today, whether the top-15 cap hid it, `computeRisk` and `computeCoverage(c).status`. PASS = Fernhollow on Today for any reason on or before 2026-10-12 (day 7). Evidence records first Today day, first Watch day, first Off Track day (C3 compares to day 7 / day 10 / day 21; not PASS conditions). Control for the "any reason" breadth: evidence also records `reasonIsCoverage` (reason text contains "nothing scheduled" on the first Today day). Round 4: the L6 break (table row L6) removes every qualifying Today appearance through day 7 for any reason, so a non-coverage first appearance does not by itself make the break vacuous; in a break run the step records every remaining Fernhollow Today row on 10-06..10-12 (day and reason), and if any remains the result is reported VACUOUS with those rows in the evidence. Task 5's `--control l6` proves the override removes the appearance before the run.
- [ ] **Step 6:** Re-run tests; expect pass.
- [ ] **Step 7:** Run `steps-b.mjs --version 1.0 --only L1,L2,L3,L4,L5,L6`; commit `feat(sim): Part B L1-L6`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-steps.test.mjs; echo exit=$? && node tools/sim/osm-day/steps-b.mjs --version 1.0 --only L1,L2,L3,L4,L5,L6; echo exit=$?`
**Expected (assumed):** tests `# fail 0`; L1-L5 PASS; L6 PASS or FAIL with evidence lines `firstToday=`, `firstWatch=`, `firstOffTrack=`, `rank=`, `reasonIsCoverage=`; PARTIAL marker; no `exit=2`.

---

### Task 10: Part B steps L7-L12 (chronological)

**Files:**
- Modify: `tools/sim/osm-day/steps-b.mjs`
- Test: `test/osm-day-steps.test.mjs` (add)

- [ ] **Step 1:** Add tests: `PART_B` ids exactly L1..L12 with L12 the only id outside `CHECKED`; `committedDate('2026-12-07', 6)` equals `'2027-01-11'`, `l10Day(T)` is `T` minus 7 days; the exported `PART_B_ORDER` runs in date order: `['L9.phase1','L10','L9.phase2','L11']` after `L8`, and the report order stays L9, L10, L11.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement L7 (10-26 Email with the pinned text; pause until 2026-11-30 via `#pause-until`; each day 10-27..12-01 not listed for silence while paused; 12-01 listed as a silence row, not a Regulatory case) and L8 (12-02 note with the pinned text creates a Risk tab case; confirm it; PASS only if absent from the open list afterwards, evidence as D8).
- [ ] **Step 4:** Implement `L9.phase1` on 12-07..T-7: read N from `c.totalSessions`, compute T, write `ctx.state={N,T}`, create the primary goal, set the committed date T, log sessions k = 0..N-2 weekly (the last on T-7), outcome plan, Readiness Assessment and CSAT contact done (read back as done).
- [ ] **Step 5:** Implement L10 on T-7 (no session N exists yet): the account is listed graduating soon; "Copy packet" and "Download .txt" both produce a packet (file in `downloads-B/`); GAP: CSM request noted; secondary evidence: not graduating soon on T-31.
- [ ] **Step 6:** Implement `L9.phase2` on T (log session N; then the L9 verdict: all N sessions logged, outcome plan, Readiness, CSAT contact and committed date recorded) and L11 on T: set the exact no-CSAT state (every other prerequisite met: goal with verdict and note drafted, all N sessions logged, outcome plan done, Readiness done, committed date set; CSAT gate Undone and the contact field cleared, read back `done:false, contactName:''`); open the graduation confirm modal without clicking OK: if OK is enabled the refusal is absent (FAIL finding), cancel; add the CSAT contact, reopen, confirm; PASS needs the refusal, stage `graduated`, and a "Success Plan objective" queue item. L12: GAP only.
- [ ] **Step 7:** Re-run tests; expect pass; run the chronological Part B; commit `feat(sim): Part B L7-L12`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-steps.test.mjs; echo exit=$? && node tools/sim/osm-day/steps-b.mjs --version 1.0; echo exit=$?`
**Expected (assumed):** tests `# fail 0`; 12 lines L1..L12 in the report order; L7, L9, L10 PASS (L10 with its GAP note); L8 FAIL (open list); L11 FAIL on the refusal half (OK enabled without a CSAT contact); L12 GAP; no `exit=2`.

---

### Task 11: Orchestrator, snapshots, prerequisites, break pass, run folder, README

**Files:**
- Create: `tools/sim/osm-day/run.mjs`
- Modify: `.gitignore` (add `sim-runs/`), `README.txt` (a paragraph: command, flags, run folder, exit codes, PARTIAL meaning, "dev tooling, not part of the bundle"; update any tool list or count nearby)
- Test: `test/osm-day-steps.test.mjs` (add)

**Interfaces:**
- Produces: `parseArgs(argv)`; `node tools/sim/osm-day/run.mjs [--version 1.0|1.1] [--part A|B] [--only <ids>] [--no-breaks] [--out <dir>]` writing `sim-runs/<stamp>/{report-<v>.md,results-<v>.json,diff.md,run.log,times.txt}`; `prerequisites(onlyIds) -> ids`.
- Snapshot object: `{ls, state}` from `ctx.snapshot()`; `state` holds `{N, T}` and any other context steps write; a break run restores BOTH (`launch({seed})`), so L10 and L11 break runs have N and T. As a second guard `steps-b.mjs` recomputes `N` from `c.totalSessions` and `T` from `targetGraduationDate` when `ctx.state` is empty and asserts they equal the restored values.
- Prerequisite rule for `--only` (picked: run the earlier steps first): `--only` of any Part B id runs every earlier Part B step first in a fresh profile, unchecked, labelled `setup` in the log and absent from the results; `--only L7` therefore runs L1-L6 and the clock days first. (The break pass does not use this; it restores snapshots.) `--only` of a Part A id runs `setupA`, then (round 4) every step that id depends on, per `PART_A_DEPS` from `steps-a.mjs`: the dependency runs first, UNCHECKED and labelled `setup` in the log, absent from the results and from the break pass. Part A steps that are NOT independent, the complete list: **D5 depends on D4** (D5 recaps the call D4 logs), so `--only D5` runs D4 first as setup. Every other Part A step (D1, D2, D3, D4, D6, D7, D8, D9, D10) reads only `setupA` seeds and is independent. If `--only` already names the dependency (e.g. `--only D4,D5`), it runs once, as a checked step, not twice. In the break pass the D5 break run restores the snapshot taken after D4, so it needs no extra setup run.

- [ ] **Step 1:** Add tests: `parseArgs(['--version','1.1','--part','A','--no-breaks'])` equals `{versions:['1.1'],parts:['A'],breaks:false,partial:true,only:null}`; defaults both/both/true/`partial:false`; unknown flag throws; `prerequisites(['L7'])` equals `['L1','L2','L3','L4','L5','L6']` and `prerequisites(['L10'])` includes `L9.phase1` and not `L9.phase2`; `prerequisites(['D4'])` is `[]`; `prerequisites(['D5'])` equals `['D4']` (round 4); `prerequisites(['D4','D5'])` is `[]` (D4 is already selected); every other Part A id (`D1`,`D2`,`D3`,`D6`..`D10`) gives `[]`; a FULL results object missing one step or break makes `exitCode` 2; the same results with `--only` scope are valid; a `--only D5` results object holds the D5 result only (D4 absent) and is valid under `scope={ids:['D5'],breaks:true}`.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement `run.mjs`: per version and part, fresh browser; setup; steps in chronological order taking `ctx.snapshot()` before each step (L10's snapshot is taken after `L9.phase1`, L11's after `L9.phase2`); unbroken results first; then for each checked step relaunch a fresh browser seeded from that step's snapshot, `setBreak(id)`, run only that step (L9 runs both phases from its pre-phase-1 snapshot), compute `breakVerdict`; D5 uses the router flag; D3/D4/D6 run their break guard (D3: the round 4 before/after check in the Breaks table; D4/D6: surrounding content intact, else exit 2); L6 runs its round 4 guard (any remaining Fernhollow Today row through day 7 gives VACUOUS); every browser ends with `aiStats().escaped===0` (else exit 2). Mark results `partial` per the inventory rule. Record wall time per part in `times.txt`.
- [ ] **Step 4:** Run tests; expect pass.
- [ ] **Step 5:** `git status --short` shows nothing under `sim-runs/`.
- [ ] **Step 6:** Run `run.mjs --version 1.0`; also run `run.mjs --version 1.0 --part A --only D5 --no-breaks` and confirm the log shows `D4 (setup)` before `D5` and the results hold only D5; commit `feat(sim): runner, snapshots, break pass, README`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node --test test/osm-day-steps.test.mjs; echo exit=$? && node tools/sim/osm-day/run.mjs --version 1.0; echo exit=$?`
**Expected (assumed):** tests `# fail 0`; 22 step lines, 21 with a break result, summary `steps 22 breaks 21`, no PARTIAL marker; exit 1 because of the findings (D2, D3, D8, L8, L11 and possibly L6), never 2; `times.txt` printed with seconds per part.

---

### Task 12: Verify C1-C8 and the evidence doc

**Files:**
- Create: `tools/sim/osm-day/verify.mjs`, `docs/evidence/2026-10-16-osm-day-lifecycle-sim.md`

**Interfaces:** `verify.mjs` prints exactly one line per check C1..C8 and exits 0 only if C5-C8 hold and no run exited 2; C1, C2, C4 report counts (findings do not make verify fail, they are reported). It uses only non-partial results for C1-C5.

- [ ] **Step 1:** Implement `verify.mjs`: C1/C2 PASS/FAIL/GAP counts per version listing each FAIL id; C3 the L6 first Today/Watch/Off Track days against day 7 / day 10 / day 21 as booleans; C4 FLIPPED / VACUOUS / NOT-TESTED counts out of 21 per version; C5 two full runs, `stripTimings` equal; C6 `countLeftovers` (prefixes `fieldtest-`, `osmsim-`, `clockspike-`, `aispike-`) and run-owned PIDs alive, before and after; C7 field-test exit 0 and metrics on both versions plus the folder count; C8 sha256 of both trackers equal the two full hashes in Global Constraints, and `git diff --quiet master -- <both files>` exit 0.
- [ ] **Step 2:** Run it (writes `sim-runs/verify.txt`, prints the eight lines).
- [ ] **Step 3:** Run the suite (C9): `node --test "test/*.test.mjs"`. (Selfcheck stays the lead's own check, per its out-of-scope note.)
- [ ] **Step 4:** Write the evidence doc: C1-C9 each marked measured or not run with the numbers; each FAIL as a finding for Ian (step, version, screen text, day); GAP list; 1.0-vs-1.1 differences from `diff.md`; L6 first days against "Within a week of the hand-off call"; NOT-TESTED breaks listed with their baseline FAIL; the negative-control results from Task 5.
- [ ] **Step 5:** Commit `docs: day and lifecycle sim evidence`.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim" && node tools/sim/osm-day/verify.mjs; echo exit=$? && node --test "test/*.test.mjs"; echo exit=$?`
**Expected:** eight lines `C1 ...` to `C8 ...`; `C5 PASS identical`, `C6 PASS 0 new folders, 0 pids alive`, `C7 PASS exit 0 x2, 0 new folders`, `C8 PASS 1.0 a21ca8c3... 1.1 b247a931... diff clean`; verify `exit=0`; suite `# fail 0`, `exit=0`, tests = 44 baseline plus the new osm-day tests, 2 skipped.

---

## Expected breaks

No existing test is changed (new files, plus two sim-tooling files no existing test reads). `test/hosting-docs.test.mjs` may check README text: if the Task 11 README edit fails it, fix the README wording in the same task.

(none) | no test in the current suite is expected to break

## Rulings applied

Round 1 (12 rulings): spec PASS conditions kept (missing features FAIL); `breakVerdict(base, broken)` and `validateRun`; L9-L11 dates from the committed date plus the constant read from code; breaks re-applied after every navigation with a read-back marker (via `Runtime.evaluate` plus `render()`; `addScriptToEvaluateOnNewDocument` rejected because declarations would overwrite it); D4/D6 scoped by marker; separate setups; fake connector at 127.0.0.1; L6 "on Today by day 7"; cleanup waits for PID exit; behavioural checks with `echo exit=$?`; full hashes; Opus should-fix applied (S1-S13, N1-N4, N6).

Round 2 (this revision), by item:
1. P2: milestones run in date order (`L9.phase1`, L10 at T-7, `L9.phase2`, L11); L10 sees no later activity.
2. P6: Part A setup seeds Orion with an open checklist deliverable, two commitments and a last-meeting question; D3 FAILs plainly if any is absent from the panel and its break is NOT-TESTED; the break mechanism is proven separately by `probe --control d3`.
3. P9: FULL run enforces 22 steps / 21 breaks; PARTIAL (`--part`, `--only`, `--no-breaks`) enforces exactly the selected set, is marked PARTIAL, and never counts toward C1-C5.
4. P10: executable negative controls: cleanup order and leftovers (Task 4 tests a, b, c; probe `--control cleanup`), AI guard (`aiStats`, probe `--control ai` and `ai-negative`, exit 2 on `escaped > 0`), override effectiveness (`assertMarker`, `--control override`); the probe exits nonzero on every mismatch it promises to detect. Plus an L6 control (`--control l6`).
5. P12: selfcheck out of scope; no claim, no change.
6. Task 6 contradiction fixed: hostnames in resolver arguments required; the static ban covers outbound-call code only.
7. `--only` for Part B runs the earlier steps first (unchecked, labelled setup); break runs restore snapshots instead.
8. Snapshots carry `{ls, state:{N,T}}`, with recomputation from saved data as a guard.

Round 4 (Codex plan review r3, three narrow fixes):
- D3 control (Breaks table row D3, "D3 plainly", Task 5 `--control d3`, Task 11 Step 3): before the break a non-empty set of seeded `SIM-OWE` entries must be rendered on the panel; after it those entries are gone, `SIM-QUESTION` is still present and the rest of the panel is still present; a heading alone does not count.
- `--only` for Part A (Task 7 `PART_A_DEPS`, Task 8 Step 1, Task 11 prerequisite rule and tests): `--only D5` runs D4 first, unchecked and labelled setup, because D5 recaps D4's call; D5 is the only dependent Part A step (list stated in Task 11), the rest are independent.
- L6 control (Breaks table row L6, Task 5 `--control l6`, Task 9 Step 5, Task 11 Step 3): the break removes every qualifying Today appearance of Fernhollow through day 7 for any reason, not only coverage reasons; if one remains the result is reported VACUOUS.

Declined: Opus N5 (the lead checks the token estimate against budget.json; my figure is about 607k); Opus M6 option (a), splitting L11 (the lead ruled to keep the spec's step list); Opus M2's "match by headline" (replaced by "on Today for any reason").

Not pinned: L1 break (unnamed save function); D3, D4, L11 break globals (assumed, settled by the Task 5 probe); the L6 `todayActionList` filter (assumed Today source, Task 5 `--control l6`); the call-review and extraction prompt markers (Task 2 Step 1); the Today call-beat selector (Task 7); clipboard read-back in headless Chrome and the assumed config values (Task 5 probe, exit 1 if wrong); the L6 first-day figures (measured in Task 9).
