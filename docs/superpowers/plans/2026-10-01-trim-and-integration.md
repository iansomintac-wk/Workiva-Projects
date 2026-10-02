# Trim + Gong/Gainsight connector: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking. **One plan task per fresh build subagent, never in parallel. A fresh checker (Sonnet) follows each task, and the lead re-runs the check command itself.** Results go to the ledger `docs/superpowers/2026-10-01-trim-and-integration-LEDGER.md`. Logs go to `.artifacts/trim/` (git-ignored), never into context. Each build subagent writes its evidence note to `docs/superpowers/evidence/trim-and-integration/<task-id>.md` and replies in at most 10 lines: status, commit, check-output summary, evidence path.

**Goal:** Trim the tracker (suite out of the shipped file, dead code, key scaffolds, one gate list, time-saved retired, pre-1.0 migrations if Ian clears them), then add a zero-dependency local connector with contract v1 and fake Gong/Gainsight/AI adapters, then put the tracker on that contract (pull calls, pull accounts, push items, AI through the connector, per-account decision support).

**Architecture:** Stage A is subtraction inside `osm-book-of-business-tracker-1.0.html` plus moving `_runSelfChecksInner` into `tools/selfchecks.js`, which `tools/selfcheck.mjs` injects as an inline `<script>` over CDP. Stage B adds `connector/` (Node, zero dependencies, binds 127.0.0.1, bearer token, CORS for origin `null`), a documented contract (`connector/CONTRACT.md` + JSON Schemas) and fake adapters with fixtures written against `demo-seed.js`. Stage C adds a connector client to the tracker that depends only on the contract, a schema 15→16 step for the new optional fields, three preview-first flows, and AI decision support; with no connector the tracker behaves as today plus one "connector offline" line.

**Tech Stack:** single-file HTML/JS app (~28.3k lines, ~1.79 MB, grep it, never read it whole), Node 26 (`node:http`, `node:test`, `node:crypto`; no npm packages), headless Chrome via CDP (`tools/selfcheck.mjs`, `tools/migration-dryrun.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-01-trim-and-integration-design.md` (rulings R1-R10 §1, baseline §2, architecture §3, Stage A §4, Stages B/C §5, acceptance K1-K10 §6, out of scope §7). Run prompt: `docs/superpowers/sessions/trim-and-integration-run.md`. Probe recipes: `docs/superpowers/evidence/2026-10-01-talk-probes/`. Rulings are final; if code makes one impossible, stop and ask Ian.

## Global Constraints

- **Grep the tracker; never read it whole.** Its header comment (first ~45 lines) holds the editing rules 0-6. Cite symbols, not line numbers; every "about L…" in the spec has drifted the moment Stage A starts.
- **Header rule 1:** targeted edits only, never rewrite the file. **Rule 2:** font sizes and colours only via `:root` tokens. **Rule 3:** advisor signals only in `SIGNAL_DEFS`. **Rule 4:** a data-shape change gets a new `CURRENT_SCHEMA_VERSION` and a `migrateData` step; **only C-1 does this (15→16)**. **Rule 6:** `computeRisk`, `healthScore`, gate scoring unchanged unless objectively wrong.
- **Docs change in the same commit as the code they describe:** tracker header rules and release notes, `README.txt` (suite counts at the `--expect` lines and the "tracker: … must be N/N" line), `VALIDATION.txt` (count lines, the SHA-256 block, a per-task entry), `CHANGELOG.txt` (the "N console-callable self-checks" line and a per-task entry), `guide-manifest.json` when its claim changes, the guide `osm-runway-onboarding-1.0.html` when a feature it teaches is removed. Any count in prose that the commit makes wrong is fixed in that commit.
- **SHA-256 block.** Every commit that changes the tracker re-measures `VALIDATION.txt`'s tracker SHA-256 from the staged blob: `git add osm-book-of-business-tracker-1.0.html && git cat-file -p :osm-book-of-business-tracker-1.0.html | sha256sum && git cat-file -s :osm-book-of-business-tracker-1.0.html`. The working tree in this worktree is CRLF (measured: 28,283 CR bytes, 1,787,753 bytes) while the blob is LF (1,759,470 bytes); VALIDATION must stop saying "0 CR bytes" for the working tree (ledger doc nit, fix in A1).
- **Stage files by explicit path.** Never `git add -A` / `git add .`. Never commit `docs/research/internal/`, `connector/config.json`, `connector/token.txt`, `connector/fake-gainsight-log.jsonl`, or any key. B2 adds these to `.gitignore` before the files can exist.
- **Send nothing to any external service.** The connector runs fake adapters only. Real AI adapters are tested with an injected stub `fetch`. The single exception is C-9's one AI call with Ian's key, at Ian's stop. **Paid spend: $0.**
- **Suite purity (existing house rule).** The suite's last checks fail if a check leaves `DATA` changed or the book's key set differs. Every new check saves the fields it touches, works inside `try`, restores in `finally`, then calls `check()`. A missing function shows as FAIL with `detail = err.message`, never a crash.
- **TDD house rule.** New checks are written first and seen red (record the red line in the evidence note). One mutation proof per task that adds checks goes in `VALIDATION.txt` (mutate production code, see the named check go red, restore).
- **Removed checks are named** in the commit message with the new total, e.g. `Removed checks (3): 'recommendation log capped at 20', …; suite 437 -> 435`.
- **Tracker check command** (the suite lives in the HTML until A1, in `tools/selfchecks.js` after; the command does not change):
  `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect <N> > .artifacts/trim/sc.log 2>&1; tail -2 .artifacts/trim/sc.log`
  Expected on pass: the last lines contain `runSelfChecks: N/N passed, 0 failed` and no "Expected … checks" line; exit 0. A run that reports 0 checks is a harness failure (exit 2), never a pass.
- **Guide suite** (must stay 18/18 after any guide edit): `node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18 > .artifacts/trim/g.log 2>&1; tail -1 .artifacts/trim/g.log` → `runGuideSelfChecks: 18/18 passed, 0 failed`.
- **Graduation scenarios** (must stay 6/6 after any tracker edit in Stage A and C): `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js,tools/graduation-scenarios-seed.js --fn runGraduationScenarios --expect 6 > .artifacts/trim/gs.log 2>&1; tail -1 .artifacts/trim/gs.log` → `runGraduationScenarios: 6/6 passed, 0 failed`.
- **Connector contract tests** (Stage B on): `node --test --test-reporter=tap "connector/test/*.test.mjs" > .artifacts/trim/ct.log 2>&1; grep -E "^# (pass|fail)" .artifacts/trim/ct.log` → `# pass <M>` and `# fail 0`.
- **Model per task:** Sonnet by default; tasks marked **top model** need design judgement.

## Suite count per task (ESTIMATES except the baseline; the builder measures the exact number, names every added/removed check, and the lead records the measured total in the ledger)

Baseline: **437/437, measured 2026-10-01 at `b1a8452` by the lead.**

| After | Removed checks (named) | Added checks | Suite `--expect` |
|---|---|---|---|
| A1 | none | none | **437** (unchanged; K1) |
| A2 | `recommendation log capped at 20`; `v66 calibration rates only well-sampled real signals`; `v67 risk trend needs two real observations, never a guess` | a2a | 435 |
| A3 | `workiva knowledge renderer safe when unconfigured` | a3a | 435 |
| A4 | none (edits: `GATE_DEFS keys unique`, the v94 check asserting `ADMIN_GAP_DEFS.length === 4`, the v91 check reading `GATE_EDITOR_KEY`) | a4a, a4b, a4c | 438 |
| A5 | 6 of the 7 (±1) impact checks: `v58 impact: counts × default minutes…`, the phaseB rows check that reads `IMPACT_EVENTS`, the v97 digest block check, `v98 time saved can be asked for by day, week and month…`, `v98 … Copilot counted`, `v98 … versioned`; edit `v67 quick log builds the same checklist scaffolding as the full form` (drop its `trackImpact` half) | a5a | 433 |
| A6 (gated) | `v67 schema 2→3 migrates without bloat and cleans hostile v3 input`; the `LEGACY_TEMPLATE_KEYS` shared-use check; edit `v67 migration always lands on the current schema version` to start at v11 | a6a | 432 if built; **433 if pending** |
| B0-B4 | none (B1 changes `demo-seed.js`; the suite must not move) | none | 433 |
| C-1 | none (edit the M3 check asserting `CURRENT_SCHEMA_VERSION === 15`) | c1a-c1e | 438 |
| C-2 | none | c2a-c2d | 442 |
| C-3 | none | c3a-c3e | 447 |
| C-4 | none | c4a-c4c | 450 |
| C-5 | none | c5a-c5c | 453 |
| C-6 | none | c6a-c6c | 456 |
| C-7 | none (separate scenario run, 7 checks) | none | 456 |
| C-8 (gated) | only checks that test decoration Ian rules out, named | none | 456 − removals |
| C-9 (gated) | checks that assert the browser provider path, named | c9a | measured |

**Projected final: 456/456** with A6 pending, no C-8 removals, C-9 pending. Subtract 1 if A6 lands. Every later total is "previous measured total + delta", never the estimate in this table.

## Plan-level choices (the spec is silent or ambiguous here; Ian may overrule any of them at plan approval)

- **P1 (A1): how the harness finds the suite.** `tools/selfcheck.mjs` gains `--suite <path>`. Default: `tools/selfchecks.js` when the target's basename is `osm-book-of-business-tracker-1.0.html`, otherwise none (the guide keeps its own in-page `runGuideSelfChecks`). `--suite none` disables injection. The readiness poll waits for `document.readyState === 'complete' && typeof saveData === 'function'` for the tracker instead of `runSelfChecks`.
- **P2 (A4): one label per gate.** The `GATE_DEFS` labels win: `Readiness Assessment`, `Success Outcome Plan`, `Graduation date SLA`, `CSAT contact`. Today's admin gaps render that label followed by a predicate-specific reason (`why`); the Gainsight section renders the label as the row heading and `gainsightAction` as the instruction. Keys stay `sentiment`, `outcomePlan`, `gradDate`, `csat`; each gate also carries `complianceKey` (`sentiment`, `outcomePlan`, `null`, `associatedPeopleCSAT`), `adminKey` (old `ADMIN_GAP_DEFS` key: `readiness`, `outcome`, `gradDate`, `csat`) and `contractKey` (`readinessAssessment`, `successPlan`, `null`, `csatContact`). `GATE_DEFS` moves above `ADMIN_GAP_DEFS` (both are `const`; deriving one from the other at top level otherwise hits the temporal dead zone).
- **P3 (B1): call `kind`.** The spec wants "one Email-type touch that must not become a session", but contract v1 calls carry no type. Contract v1 adds one **optional** field to a call: `kind: "call" | "email"` (default `"call"`). An `"email"` item becomes an Email-type activity and is never offered a session. This is additive; if Ian prefers no contract change, the Email case is instead an Email activity in `demo-seed.js` on the same day as a fixture call, and C-3 must refuse to put a session on it.
- **P4 (B2): the token persists.** The spec says the user pastes the token "once". The connector generates a 32-byte hex token on first start, writes it to `connector/token.txt` (git-ignored), and prints it on every start. Delete the file to rotate.
- **P5 (B1): push `fields` per kind.** `kind` is the existing queue kind string, verbatim. Fields: `Pending items batch` → `{gates:[{gateKey, contractKey, gainsightAction}]}`; `Success Plan objective` → `{event:"created"|"changed"|"verdict", objective, goalType, targetCycle, verdict, changeReason}`; `At-Risk CTA` → `{ctaName, reason, severity}`; `Success Outcome Plan` → `{outcomes:[string]}`. Unknown keys are allowed (`additionalProperties: true`) so the tracker can add fields without a contract bump.
- **P6 (B3, C-2): AI `task` names.** `copilot_read`, `call_prep`, `debrief`, `debrief_scores`, `call_review`, `risk_summary`, `thread_answer`, `brief_my_day`. `callAiAPI(promptText, opts)` gains `opts.task`; each of the 7 call sites passes one.
- **P7 (C-3): session types.** The tracker has no "session type" list (demo sessions are logged as `Other`). C-3 adds `NON_SESSION_ACTIVITY_TYPES = ['Email', 'Partner Sync', 'Implementation Note']`; every other type may carry a session. This satisfies K7 without changing how existing sessions are logged.
- **P8 (C-2): connector settings key.** `obm-connector-settings-v1` = `{url, token}`. The token is the connector's own bearer token, not a third-party key, so K10 counts third-party keys only: before C-9 the only third-party key in tracker localStorage is the AI key in `obm-ai-settings-v1`.
- **P9 (B0): headed recipe.** `b0-run.mjs` uses `--dump-dom`, which only works headless. B0 adds `b0-run-headed.mjs` and `b0-page-headed.html`: the page reports its result back to the stub with an image beacon (`new Image().src = 'http://127.0.0.1:<port>/report?r=…'`), which reaches the stub whether or not CORS allows the fetch, and the runner reads the stub's log.

---

# Stage A: trim

Stage A ends with a report to Ian: the measured check total and the shipped-file bytes (K1-K4). Then the lead asks about A6 if Ian has not answered.

## Task A1: Move the suite out of the shipped file (C1, R7)

**Model:** Sonnet. **Supports:** K1.

**Files:**
- Create: `tools/selfchecks.js` (the banner comment, `function runSelfChecks(){…}`, `function _runSelfChecksInner(){…}` and `window.runSelfChecks = runSelfChecks;`, moved verbatim).
- Modify: `osm-book-of-business-tracker-1.0.html`: delete that span (from the `/* ============ SELF CHECKS ============` banner through `window.runSelfChecks = runSelfChecks;`), leave a 3-line comment in its place pointing to `tools/selfchecks.js`; header rule 5. `_suiteRunning`, `_dayTimelineCache`, `_dayDispatchChips`, `SELF_CHECK_BLOCK_TOKEN` stay.
- Modify: `tools/selfcheck.mjs` (P1).
- Modify: `README.txt`, `VALIDATION.txt`, `CHANGELOG.txt`, `guide-manifest.json` (`trackerSelfChecks`, which already says "369 checks").

**Interfaces:**
- Produces: `tools/selfchecks.js`, a classic script that defines global `runSelfChecks()` → `{passed, failed, results:[{name, ok, detail}]}`; it must keep the literal text `_suiteRunning = false` inside `runSelfChecks` (the check reading `String(runSelfChecks)` depends on it). `selfcheck.mjs --suite <path|none>`.
- Consumes: product globals (`DATA`, `saveData`, `_suiteRunning`, every function the suite calls) through the shared global scope of classic scripts.

- [ ] **Step 1: Record the before-state.** Run the tracker check command with `--expect 437` (must be 437/437). Record `git cat-file -s HEAD:osm-book-of-business-tracker-1.0.html` (expected 1,759,470) and `wc -c` (expected 1,787,753, CRLF working tree) in the evidence note.
- [ ] **Step 2: Make the harness inject first (it is the test).** In `tools/selfcheck.mjs`, after the readiness poll and before seeding:

```js
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const SUITE_FOR = { 'osm-book-of-business-tracker-1.0.html': join(HERE, 'selfchecks.js') };
const suiteFlag = flag('suite', null);
const suitePath = suiteFlag === 'none' ? null : (suiteFlag ? resolve(suiteFlag) : (SUITE_FOR[basename(target)] || null));
// readiness: for a page with an external suite, wait for the app, not for runSelfChecks
const readyExpr = suitePath
  ? `document.readyState === 'complete' && typeof saveData === 'function'`
  : `document.readyState === 'complete' && typeof window[${JSON.stringify(seedPaths.length ? 'runSelfChecks' : fnName)}] === 'function'`;
// …after ready:
if (suitePath) {
  if (!existsSync(suitePath)) { console.error(`No such suite: ${suitePath}`); process.exit(2); }
  const src = readFileSync(suitePath, 'utf8');
  // INLINE, not src=: a check reads document.scripts' non-src textContent.
  const inj = await send('Runtime.evaluate', { returnByValue: true, expression:
    `(() => { const s = document.createElement('script'); s.textContent = ${JSON.stringify(src)};
      document.body.appendChild(s); return typeof window.runSelfChecks === 'function'; })()` });
  if (inj.result?.value !== true) { console.error('Suite injection did not define window.runSelfChecks.'); process.exit(2); }
}
```

  Update the usage comment at the top (`--suite`). Run the check command with `--expect 437` **before** moving anything: the in-page suite plus an absent `tools/selfchecks.js` must give exit 2 `No such suite` (that is the red). Record it.
- [ ] **Step 3: Move the suite.** Cut the span named in Files from the HTML into `tools/selfchecks.js`, byte for byte, with a top comment: "Injected by tools/selfcheck.mjs as an inline script. Not shipped. Run: node tools/selfcheck.mjs …". Leave in the HTML: `/* Self-checks live in tools/selfchecks.js (not shipped). Run: node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect N */`.
- [ ] **Step 4: Run the suite.** Check command with `--expect 437`. Expected `runSelfChecks: 437/437 passed, 0 failed`. If a check fails, use superpowers:systematic-debugging; the known self-referential checks are the `document.scripts` scan (`setSessionDeliverables` source scan), the two `documentElement.innerHTML.slice` checks (v92 `cp-split`, v99 backup nag) and the `String(runSelfChecks)` / `String(fn).indexOf` introspection checks. Do not weaken a check to make it pass; stop and report if one cannot hold.
- [ ] **Step 5: Run the other two harnesses.** Guide suite (18/18; it must get no injection) and graduation scenarios (6/6). Also confirm `node tools/migration-dryrun.mjs osm-book-of-business-tracker-1.0.html --from 14` still exits 0 (it does not use the suite).
- [ ] **Step 6: Measure K1.** `git add` the HTML; `git cat-file -s :osm-book-of-business-tracker-1.0.html` and `wc -c` the working tree. Expected blob shrink ≥ 530,000 bytes from 1,759,470 (the moved span is ~538,500 LF bytes, measured at planning); working-tree shrink ≥ 530,000 from 1,787,753. Record both in the evidence note and the ledger's K1 row.
- [ ] **Step 7: Docs, same commit.** Header rule 5 becomes: "After any edit, run `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect N` — all checks must pass. The suite lives in tools/selfchecks.js and is not shipped." README: the `--expect` line and "tracker: … must be 437/437" now name the command, not `window.runSelfChecks()`. VALIDATION: count lines name the command; SHA-256 block re-measured; "0 CR bytes" corrected to "depends on the checkout (CRLF here: 28,283 CR bytes)"; an A1 entry with before/after bytes. CHANGELOG line "437 console-callable self-checks: window.runSelfChecks()" → "437 self-checks, run by tools/selfcheck.mjs (suite in tools/selfchecks.js)". `guide-manifest.json` `trackerSelfChecks` likewise (and its stale 369 → 437).
- [ ] **Step 8: Commit.** `git add osm-book-of-business-tracker-1.0.html tools/selfchecks.js tools/selfcheck.mjs README.txt VALIDATION.txt CHANGELOG.txt guide-manifest.json docs/superpowers/evidence/trim-and-integration/A1.md` then commit `A1: move the self-check suite to tools/selfchecks.js (437/437; blob -N bytes)`.

**Check:** tracker check command `--expect 437` → `runSelfChecks: 437/437 passed, 0 failed`, exit 0. Plus guide 18/18, scenarios 6/6. **K1** measured.

## Task A2: Dead code, T1 and T3

**Model:** Sonnet. **Supports:** K2.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: delete `generatePortfolioAiBrief`, `renderRiskRow`, `renderRiskOwnership`, `renderRiskNextSteps`, `riskTrend`, `renderSignalCalibration`, `getSignalCalibration`, `partitionRisks`, `removeOutcomeCriterion`, `graduationDurability`, `openThreadsToText`, `icsUnfold`; fix the v94 comment that says the old `generatePortfolioAiBrief()` "is still what fills the summary block" (grep `still what fills`); delete `ui.aiPortfolioBrief` if it becomes write-only-and-unread; stop writing `c.recommendationLog` (`logRecommendationEntry` and its callers in `resolveRecommendation` / `trackRecommendationPersistence`; keep whatever else those functions do).
- Modify: `tools/selfchecks.js`: move `icsUnfold` in as a local helper; remove/edit the checks below.
- Create: `tools/refcount.mjs` (K2 measurement tool).
- Modify: `VALIDATION.txt`, `CHANGELOG.txt`, `README.txt` (counts).

**Interfaces:**
- Produces: `node tools/refcount.mjs <file> <sym>[,<sym>…]` prints `<sym>: <n>` per symbol, counting occurrences after stripping `<!-- -->`, `/* */` and `//`-to-end-of-line comments (string-aware enough for this file: skip `//` inside quotes and template literals; skip `://`). Exit 0 always. Used again by A3, A5, A6 and C-9.
- `c.recommendationLog` stays on existing records, inert (no migration).

- [ ] **Step 1: Write `tools/refcount.mjs`** and run it on the unmodified HTML for the 12 symbols plus `logRecommendationEntry`. Record counts (all > 0) in the evidence note.
- [ ] **Step 2: Write the failing check a2a** in `tools/selfchecks.js`, beside the old `recommendation log capped at 20` check:

```js
  (function(){                                                  // a2a
    let ok = false, detail = '';
    const prevC = DATA.customers;
    try{
      const c = cloneData(DATA.customers.find(x => x.stage !== 'graduated') || DATA.customers[0]);
      delete c.recommendationLog;
      DATA.customers = [c];
      getRecommendedAction(c);                // the old live writer path
      ok = c.recommendationLog === undefined && typeof logRecommendationEntry === 'undefined';
      detail = JSON.stringify({log: c.recommendationLog, writer: typeof logRecommendationEntry});
    }catch(err){ detail = err.message; }
    finally{ DATA.customers = prevC; }
    check('trim a2a: recommendations no longer write c.recommendationLog', ok, detail);
  })();
```

  Run the check command with `--expect 438` (437 old + a2a). Expected red: `runSelfChecks: 437/438 passed, 1 failed` with `FAIL  trim a2a…`. Record it.
- [ ] **Step 3: Delete the 12 functions and the writer.** Grep each symbol before deleting. `icsUnfold` moves into `tools/selfchecks.js` as `function icsUnfold(...)` (same body) inside the suite file, so the v74 ICS checks keep working.
- [ ] **Step 4: Remove or edit checks.** Remove: `recommendation log capped at 20`, `v66 calibration rates only well-sampled real signals`, `v67 risk trend needs two real observations, never a guess` (each exists only to exercise a deleted function). Edit (keep the assertion about live code, drop the dead-function half): the checks that call `partitionRisks` (v73 dismissed risk returns), `removeOutcomeCriterion` (phaseA un-ticking), `graduationDurability` (v88 graduation check-back), and the introspection of `renderSignalCalibration` / `getSignalCalibration` / `renderRiskNextSteps` (grep each in `tools/selfchecks.js`). If a check cannot be edited without losing its live-code assertion, keep the live half and say so in the evidence note.
- [ ] **Step 5: Run.** Check command `--expect 435`. Expected `runSelfChecks: 435/435 passed, 0 failed`. If the measured total differs, the builder names every removed check and uses the measured total. Guide 18/18, scenarios 6/6.
- [ ] **Step 6: Measure K2 (part).** `node tools/refcount.mjs osm-book-of-business-tracker-1.0.html generatePortfolioAiBrief,renderRiskRow,renderRiskOwnership,renderRiskNextSteps,riskTrend,renderSignalCalibration,getSignalCalibration,partitionRisks,removeOutcomeCriterion,graduationDurability,openThreadsToText,icsUnfold,logRecommendationEntry` → every line `: 0`. Also `grep -c "recommendationLog"` on the HTML: only comments / the inert-field note remain (record the count and what each is).
- [ ] **Step 7: Docs and commit.** README/VALIDATION/CHANGELOG counts 437 → 435, SHA-256 re-measured, VALIDATION entry with the mutation proof (re-add one `c.recommendationLog = []` write, see a2a FAIL, restore). Commit message names the removed checks and `suite 437 -> 435`.

**Check:** `--expect 435` → `runSelfChecks: 435/435 passed, 0 failed`; refcount all 0.

## Task A3: Key scaffolds, T2

**Model:** Sonnet. **Supports:** K3, K10 (pre-C-9 half).

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: delete `GAINSIGHT_SETTINGS_KEY`, `getGainsightSettings`, its saver, the Settings block "Gainsight integration (future use)" and its save handlers, `syncGainsightQueue` and button `#btn-attempt-gainsight-sync`; `renderGainsightQueueBlock(queue, gs)` loses the `gs` parameter (pick the note wording for "not configured", which is the only state that ever existed for a user); delete the Workiva KB scaffold: `obm-workiva-kb-settings-v1` key constant, its get/save, `searchWorkivaKnowledge`, `renderKnowledgeResults`, the Settings block and "Test search" handlers. Add a one-time cleanup in init.
- Modify: `tools/selfchecks.js`, README/VALIDATION/CHANGELOG.

**Interfaces:**
- Produces: `cleanupRetiredSettingsKeys()` → `{removed:[key…]}`; removes `obm-gainsight-settings-v1` and `obm-workiva-kb-settings-v1` from localStorage (try/catch, never throws) and is called once from the init IIFE. Constant `RETIRED_SETTINGS_KEYS = ['obm-gainsight-settings-v1','obm-workiva-kb-settings-v1']` is the only place those strings remain.
- The Gainsight **queue** (`DATA.gainsightQueue`, `queueGainsightItem`, export) is untouched.

- [ ] **Step 1: Failing check a3a.** Save the two keys' current values, set both to `'{"apiKey":"x"}'`, call `cleanupRetiredSettingsKeys()`, assert both are `null` afterwards and `removed.length === 2`, and that `typeof searchWorkivaKnowledge === 'undefined' && typeof syncGainsightQueue === 'undefined'`; restore the saved values in `finally` (they are `null` on a test profile). Name: `trim a3a: retired Gainsight/Workiva settings keys are removed once and their code is gone`. Run `--expect 436`. Expected red: `runSelfChecks: 435/436 passed, 1 failed` (a3a).
- [ ] **Step 2: Delete the Gainsight settings scaffold** and `syncGainsightQueue` + button; update `renderGainsightQueueBlock`'s callers.
- [ ] **Step 3: Delete the Workiva KB scaffold.** Remove the check `workiva knowledge renderer safe when unconfigured`.
- [ ] **Step 4: Add `RETIRED_SETTINGS_KEYS` and `cleanupRetiredSettingsKeys()`** near the other settings keys; call it once in the init IIFE before the first render.
- [ ] **Step 5: Run.** `--expect 435` → `runSelfChecks: 435/435 passed, 0 failed`. Guide 18/18 (if the guide teaches the Gainsight/Workiva settings, edit it; grep `Workiva` there; partner Workiva *sheets* are a different feature and stay), scenarios 6/6.
- [ ] **Step 6: Measure K3.** `grep -c "obm-gainsight-settings-v1\|obm-workiva-kb-settings-v1" osm-book-of-business-tracker-1.0.html` → `1` (the `RETIRED_SETTINGS_KEYS` line; if the two strings sit on two lines, 2, both inside that constant). `node tools/refcount.mjs osm-book-of-business-tracker-1.0.html getGainsightSettings,syncGainsightQueue,searchWorkivaKnowledge,renderKnowledgeResults,GAINSIGHT_SETTINGS_KEY` → all 0.
- [ ] **Step 7: Docs and commit.** README/VALIDATION/CHANGELOG (the CHANGELOG/README lines describing these settings, plus the count: 435 → 435, net 0, with the removed check named), SHA-256, mutation proof (make `cleanupRetiredSettingsKeys` skip the Workiva key, see a3a go red, restore; a3a calls the function directly, so removing the init call would not turn it red). Commit names `workiva knowledge renderer safe when unconfigured` removed, a3a added, `suite 435 -> 435`.

**Check:** `--expect 435` → `runSelfChecks: 435/435 passed, 0 failed`; K3 grep as above.

## Task A4: One gate list, T5

**Model:** Sonnet (the label choice is made in P2). **Supports:** K4.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: `GATE_DEFS` (moved above `ADMIN_GAP_DEFS`), `ADMIN_GAP_DEFS` (derived), `GATE_EDITOR_KEY` (derived from `GATE_DEFS`, or replaced by a field `editor` on each gate; keep the name `GATE_EDITOR_KEY` as a derived map so its callers do not change), the compliance block of `pendingGainsightItems`, `renderAdminGaps`.
- Modify: `tools/selfchecks.js`, README/VALIDATION/CHANGELOG.

**Interfaces:**
- Produces (used by C-4, C-5):

```js
function gradDateMissing(c){ return !c.targetGraduationDate; }
function gradDateDrifted(c){ return isGradDateWithinTolerance(c) === false; }
const GATE_DEFS = [
  {key:'sentiment',   label:'Readiness Assessment', isPaceOutcome:false, complianceKey:'sentiment',
   adminKey:'readiness', editor:'readiness', contractKey:'readinessAssessment',
   gainsightAction:'Log Sentiment via Readiness Assessment timeline activity', gainsightActivityType:'Onboarding Success Plan',
   adminWhy:'Two sentences, and it is the only qualitative read the tracker keeps.',
   isMissing:c=>!c.compliance.sentiment.done},
  {key:'outcomePlan', label:'Success Outcome Plan', isPaceOutcome:false, complianceKey:'outcomePlan',
   adminKey:'outcome', editor:'outcome', contractKey:'successPlan',
   gainsightAction:'Create Success Outcome Plan (numbered outcomes 1–18)', gainsightActivityType:'Success Outcome Plan',
   adminWhy:'The numbered outcome is what graduation is judged against.',
   isMissing:c=>!c.compliance.outcomePlan.done},
  {key:'gradDate',    label:'Graduation date SLA', isPaceOutcome:true, complianceKey:null,
   adminKey:'gradDate', editor:'gradDate', contractKey:null,
   gainsightAction:null /* built per account: "Estimated graduation date is N days later/earlier than target — update in Gainsight" */,
   gainsightActivityType:'Graduation Date Accuracy',
   adminWhy:'No committed graduation date: the runway is measured against a projection instead of a promise.',
   isMissing:gradDateDrifted, adminMissing:gradDateMissing},
  {key:'csat',        label:'CSAT contact', isPaceOutcome:false, complianceKey:'associatedPeopleCSAT',
   adminKey:'csat', editor:'csat', contractKey:'csatContact',
   gainsightAction:'Add Associated People for CSAT survey (Graduation Handoff call)', gainsightActivityType:'Graduation Success Plan',
   adminWhy:'Nobody is named to receive the survey, so the account cannot be measured at all.',
   isMissing:c=>!c.compliance.associatedPeopleCSAT.done}
];
const ADMIN_GAP_DEFS = GATE_DEFS.map(g => ({key:g.adminKey, label:g.label, editor:g.editor, why:g.adminWhy,
  missing: g.adminMissing || (c => !(c.compliance && c.compliance[g.complianceKey] && c.compliance[g.complianceKey].done))}));
```

  (Copy the existing `editor` values and `missing` semantics exactly; the snippet shows the shape. The ADMIN `missing` for non-date gates must stay null-safe on `c.compliance`, as today.) Order of `ADMIN_GAP_DEFS` changes to `GATE_DEFS` order; check whether any caller depends on the old order (grep `ADMIN_GAP_DEFS`, `renderAdminGaps`).
- Compliance items in `pendingGainsightItems` keep their item shape (`kind`, `complianceKey`, `label`, `date`, `activityType`) but take `label: g.label` and add `instruction: g.gainsightAction` (the grad-review item builds its instruction text per account as today); `renderGainsightItemRow` shows `label` and, when present, `instruction`.
- `complianceScore()` is **not** touched (its comment says it has a third grad-date semantics on purpose; rule 6).

- [ ] **Step 1: Failing checks.**
  - **a4a** `gradDateMissing`: true for `{targetGraduationDate:''}` and for a missing field, false for a set date; and `ADMIN_GAP_DEFS.find(d=>d.key==='gradDate').missing === gradDateMissing`.
  - **a4b** `gradDateDrifted`: on a clone with a target date and an estimate far outside tolerance, true; within tolerance, false; with no target date, false (matches `isGradDateWithinTolerance` returning `null`); and the `gradDate` gate's `isMissing === gradDateDrifted`.
  - **a4c** one label per gate: for a clone with all four gates open (compliance undone, date drifted, date present for the admin list only where relevant) collect labels from `missingGates(c)`, from `ADMIN_GAP_DEFS` rows that fire, and from `pendingGainsightItems()` compliance/grad-review items for that clone; every label is in `new Set(GATE_DEFS.map(g=>g.label))`; and every non-date gate has a non-empty `gainsightAction`.
  Run `--expect 438`: a4a-a4c red.
- [ ] **Step 2: Add the predicates and rebuild `GATE_DEFS`** above `ADMIN_GAP_DEFS`; derive `ADMIN_GAP_DEFS` and `GATE_EDITOR_KEY`.
- [ ] **Step 3: Rewrite the compliance block of `pendingGainsightItems`** as a loop over `GATE_DEFS` (`complianceKey !== null` gates use `!c.compliance[g.complianceKey].done`; the date gate uses `gradDateDrifted` and builds the per-account instruction).
- [ ] **Step 4: Update the row renderers** (`renderAdminGaps`, `renderGainsightItemRow`) to show the one label plus `why` / `instruction`. Edit the checks `GATE_DEFS keys unique` (unchanged assertion, still passes), the v94 `ADMIN_GAP_DEFS.length === 4` check (still 4) and the v91 `GATE_EDITOR_KEY` check if it asserts old label strings.
- [ ] **Step 5: Run.** `--expect 438` → `runSelfChecks: 438/438 passed, 0 failed`. Scenarios 6/6 (they assert Gainsight compliance gates; if a scenario asserts an old label string, update it in `tools/graduation-scenarios-seed.js` in this commit and say so).
- [ ] **Step 6: Measure K4.** In the evidence note, list each gate's label as rendered on Today (admin gaps), the account card (`missingGatesText`) and the Gainsight section, from one `--verbose` run of a4c's detail. All identical.
- [ ] **Step 7: Docs and commit.** Counts 435 → 438, SHA-256, mutation proof (change one admin label back to `No CSAT contact`, a4c red, restore). Commit `A4: one gate list; gradDateMissing/gradDateDrifted; suite 435 -> 438`.

**Check:** `--expect 438` → `runSelfChecks: 438/438 passed, 0 failed`; scenarios 6/6.

## Task A5: Retire time-saved, C6 (R6)

**Model:** Sonnet. **Supports:** K2.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: delete `IMPACT_EVENTS`, `trackImpact` and its 16 live call lines (grep `trackImpact(`; keep the surrounding behaviour of each caller), `renderImpactSettings` and the Settings "Time saved" block and its live-refresh hooks, `downloadImpactCsv` and its button, `buildImpactReport`, `downloadImpactReport` and its button/handler, the day-close "N actions, about X saved" and "wrapped up" lines in `renderDayClose`, the wrap-up modal figure, the manager progress-report section, the `impactMinutes` editors; header RELEASE NOTES ("a dated record of time saved" removed).
- Leave inert: `DATA.impact`, `DATA.impactLog`, `DATA.config.impactMinutes` (no migration; nothing reads them). Their normalise/repair lines in `repairAuxiliaryCollections` / backfill may stay so old books round-trip unchanged; nothing else may read them.
- Modify: `demo-seed.js` (drop `impact.events.gainsight_batch`, keep `impact` otherwise or drop the whole `impact` object; it is inert either way: drop it and say so).
- Modify: `osm-runway-onboarding-1.0.html` (the "Time saved, by the day" rhythm card), README/VALIDATION/CHANGELOG (CHANGELOG lines "A dated record of time saved…" and "Impact minutes are an editable assumption…" become history notes in a new entry; the 1.0 description is not rewritten).
- Modify: `tools/selfchecks.js`.

**Interfaces:** none produced. `DATA.impact`, `DATA.impactLog`, `config.impactMinutes` documented as inert in a comment at their repair site.

- [ ] **Step 1: Failing check a5a.** `typeof trackImpact === 'undefined' && typeof IMPACT_EVENTS === 'undefined' && typeof buildImpactReport === 'undefined'`, and rendering the day close (`renderDayClose` on the current day, as the existing day-close checks call it) returns HTML without `/saved/i`. Name `trim a5a: time-saved is retired; day close carries no saved-minutes line`. Run `--expect 439`: a5a red.
- [ ] **Step 2: Remove the 16 `trackImpact` call lines** (one per caller; leave each caller's other work) and `IMPACT_EVENTS`.
- [ ] **Step 3: Remove the report and CSV surfaces** (`buildImpactReport`, `downloadImpactReport`, `downloadImpactCsv`, `renderImpactSettings`, their buttons and handlers, the Settings block and live-refresh hooks, the `impactMinutes` editors).
- [ ] **Step 4: Remove the day-close lines, the wrap-up modal figure and the progress-report section.** Remove the impact checks (named in the count table) and edit `v67 quick log builds the same checklist scaffolding as the full form` to drop its `String(openQuickLogModal).indexOf('trackImpact')` half. Measure: grep `tools/selfchecks.js` for `trackImpact|IMPACT_EVENTS|impactLog|impactMinutes|buildImpactReport|downloadImpact` and resolve every hit; the probe counted 7 (±1) checks.
- [ ] **Step 5: Seed and guide.** Edit `demo-seed.js` and the guide card (replace it with nothing or with a card about the day close as it now is; no new claims). Guide 18/18.
- [ ] **Step 6: Run.** `--expect 433` → `runSelfChecks: 433/433 passed, 0 failed` (or the measured total with every removed check named). Scenarios 6/6. K2: `node tools/refcount.mjs osm-book-of-business-tracker-1.0.html trackImpact,IMPACT_EVENTS,buildImpactReport,downloadImpactReport,downloadImpactCsv,renderImpactSettings` → all 0.
- [ ] **Step 7: Docs and commit.** Counts 438 → 433, SHA-256, mutation proof (re-add a "saved" line to `renderDayClose`, a5a red, restore). Commit names every removed check and `suite 438 -> 433`.

**Check:** `--expect 433` → `runSelfChecks: 433/433 passed, 0 failed`; guide 18/18; scenarios 6/6; refcount all 0.

## Task A6: Pre-1.0 migrations, T4 — GATED (R3)

**Gate:** build only after Ian has (a) opened and re-saved, in today's tracker at schema 15, `Documents\Johnny Silverhand\book-of-business-export.json` (schema 8), `Documents\Runway Tracker\book-of-business-RESTORE-POINT-2026-08-03.json` (schema 2) and `Downloads\book-of-business-export (5).json` (schema 2), or (b) said they don't matter. The lead asks at the start of Stage A (push notification, then in session) and again at the end of A5. **If there is no answer when A5 is done, A6 is skipped and the ledger row says `pending: awaiting Ian's re-save of the 3 pre-1.0 exports`.** Verify (a) by reading only `schemaVersion` from each re-saved file (`node -e` printing that one field), never the contents (customer data).

**Model:** Sonnet. **Supports:** K2.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: delete the v0→v11 steps of `migrateData` (the `if(v < N)` steps and `if(v === 8/9/10)` steps; keep from `if(v === 11)` on), `OLD_GUESSED_OUTCOME_NAMES` and its use, the ungated `LEGACY_TEMPLATE_KEYS` uses in the load backfill (keep `LEGACY_TEMPLATE_KEYS` only if a v11+ step or a live path still needs it; grep), the pre-v38 backfills (`pauseReturns`, `todayLastSeenIds`, `weeklySnapshot` defaults) **only if** `defaultData()` or a v11+ path guarantees those fields; otherwise keep them and say so. Add the refusal: `prepareImportedData` (and the archive path `prepareArchiveData`) reject `schemaVersion < 11` with the message `This file was saved by a tracker older than 1.0 (schema N). Open it in the 1.0 release first, or ask for help converting it.`
- Modify: `tools/selfchecks.js`, README/VALIDATION/CHANGELOG.

**Interfaces:** `MIN_IMPORT_SCHEMA_VERSION = 11`.

- [ ] **Step 1: Confirm the gate** (above) and record Ian's words or the three measured `schemaVersion` values (all 15) in the evidence note.
- [ ] **Step 2: Failing check a6a.** `prepareImportedData` (or whichever entry the import button calls; grep `prepareImportedData`) given `JSON.stringify({schemaVersion:8, customers:[], activities:{}})` refuses with a message containing `older than 1.0`, and given a schema-11 book (built by `tools/legacy-seed.js`'s approach or a clone with `schemaVersion = 11`) succeeds. Run `--expect 434`: red.
- [ ] **Step 3: Delete the v0→v11 steps** and the ungated legacy passes listed in Files.
- [ ] **Step 4: Add the refusal** and `MIN_IMPORT_SCHEMA_VERSION`. Remove `v67 schema 2→3 migrates without bloat and cleans hostile v3 input` and the `LEGACY_TEMPLATE_KEYS` shared-use check; edit `v67 migration always lands on the current schema version` to start from `{schemaVersion:11, …}`.
- [ ] **Step 5: Run.** `--expect 432` → `runSelfChecks: 432/432 passed, 0 failed`; `node tools/migration-dryrun.mjs osm-book-of-business-tracker-1.0.html --from 11` and `--from 14` exit 0; scenarios 6/6. `node tools/refcount.mjs osm-book-of-business-tracker-1.0.html OLD_GUESSED_OUTCOME_NAMES` → 0.
- [ ] **Step 6: Docs and commit.** Counts 433 → 432, the README "import" paragraph gains the schema-11 floor, SHA-256, mutation proof. Commit names removed checks and `suite 433 -> 432`.

**Check:** `--expect 432` → `runSelfChecks: 432/432 passed, 0 failed`; both dry-runs exit 0.

**Stage A report (lead):** measured total, blob bytes and working-tree bytes vs 1,759,470 / 1,787,753, K1-K4 values, A6 state.

---

# Stage B: contract and connector

## Task B0: Reachability spike, headed — GATED STOP if blocked

**Model:** Sonnet. **Must run before B1.**

**Files:**
- Create: `docs/superpowers/evidence/2026-10-01-talk-probes/b0-page-headed.html`, `docs/superpowers/evidence/2026-10-01-talk-probes/b0-run-headed.mjs` (P9). The existing `b0-run.mjs`, `b0-stub.mjs`, `b0-page.html` are not changed.
- Create: `docs/superpowers/evidence/trim-and-integration/B0.md`.

**Interfaces:** none (throwaway recipe).

- [ ] **Step 1: Re-run the headless recipe** `node docs/superpowers/evidence/2026-10-01-talk-probes/b0-run.mjs > .artifacts/trim/b0.log 2>&1` and read only its final JSON. Expected: `cors` → `RESULT ok {"ok":true}`, stub saw `OPTIONS` then `GET` with `origin= null`; `nocors` → `RESULT fail TypeError: Failed to fetch`.
- [ ] **Step 2: Write the headed page.** Same fetch as `b0-page.html`, then on settle: `new Image().src = 'http://127.0.0.1:' + port + '/report?r=' + encodeURIComponent(result)`. The stub (unchanged) logs every request line, so `/report?r=…` shows in its stdout for both modes.
- [ ] **Step 3: Write the headed runner.** For each browser in [Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`, Edge `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`] that exists, and each mode [`cors` port 47821, `nocors` port 47822]: start `b0-stub.mjs`, spawn the browser **headed** with a fresh `--user-data-dir` under `%TEMP%`, `--no-first-run`, the `file:///…/b0-page-headed.html#<port>` URL; wait up to 8 s for a `/report` line; kill the browser and stub; print `{browser, mode, report, stubSaw}` as JSON. Then the **normal profile** case: Chrome with no `--user-data-dir` (opens a tab in Ian's running Chrome), `cors` mode only; this one is not killed (it is Ian's browser); the runner just reads the stub log.
- [ ] **Step 4: Run it** `node …/b0-run-headed.mjs > .artifacts/trim/b0h.log 2>&1` and read the JSON lines only.
- [ ] **Step 5: Decide.** Pass = every browser's `cors` run reports `RESULT ok` and every `nocors` run reports `RESULT fail` (the control proves the probe can fail). Any `cors` run that fails, or a console CORS/PNA error noted in the report string = **blocked**.
- [ ] **Step 6: Record and commit.** Evidence note with the JSON lines and the browser versions, read from the registry: `reg query "HKCU\Software\Google\Chrome\BLBeacon" /v version` and `reg query "HKCU\Software\Microsoft\Edge\BLBeacon" /v version`. Commit the two new recipe files and the note: `B0: headed reachability spike (Chrome/Edge, fresh + normal profile): <pass|blocked>`.

**STOP if blocked:** push notification, then ask Ian. The fallback (connector serves the tracker from `http://127.0.0.1`) moves where the book's localStorage lives; it is his call. B1 does not start until B0 passes or Ian rules.

**Check:** the runner's JSON: `cors` ok ×N, `nocors` fail ×N. No tracker change (suite not re-run).

## Task B1: Contract, schemas, fixtures; demo seed gains gainsightIds

**Model:** top model (contract field design, fixture design). **Supports:** K5 (fixtures), K7 and K9 later.

**Files:**
- Create: `connector/CONTRACT.md`, `connector/schemas/health.json`, `calls.json`, `accounts.json`, `push-request.json`, `push-response.json`, `ai-request.json`, `ai-response.json`, `error.json`.
- Create: `connector/fixtures/calls.json`, `connector/fixtures/accounts.json`.
- Create: `connector/lib/validate.mjs` (zero-dependency JSON Schema subset validator).
- Create: `connector/test/fixtures.test.mjs`.
- Modify: `demo-seed.js` (each of the 17 accounts gets `gainsightId: 'GS-DEMO-001'` … `'GS-DEMO-017'`; one account gains one stakeholder with an email for the email-only match), README/VALIDATION/CHANGELOG (a "Connector contract v1" entry).

**Interfaces:**
- Produces `connector/lib/validate.mjs`: `export function validate(schema, value, path = '$') → string[]` (empty array = valid). Supports `type` (incl. arrays of types and `"null"`), `required`, `properties`, `additionalProperties` (boolean), `items`, `enum`, `minLength`, `minimum`, `format: "date-time"` (ISO 8601 check by `Date.parse` + regex `^\d{4}-\d{2}-\d{2}T`). Nothing else; unknown keywords are ignored and listed in CONTRACT.md.
- Contract v1, exactly spec §3 plus P3 (`kind` on a call, optional) and P5 (push `fields` per kind). `GET /v1/health` → `{version:"1", adapters:{gong, gainsight, ai}}`. Errors are `{error: string}` with 400/401/404/413/502.
- `connector/fixtures/accounts.json`: 17 accounts with the demo names and `GS-DEMO-0NN` ids; at least 3 differ from the demo seed on tier/arr/renewalDate/csmOwner/contacts (for C-4); at least 2 have a gate `true` that the demo seed has open (for C-4's tick offer); `openCtas` present (may be empty).
- `connector/fixtures/calls.json` (dates relative to a fixed `"2026-09-…"` base are fine; C-3 filters by `since`): ≥ 2 calls with `accountRef.gainsightId` set; 1 with only `accountRef.name` (exact demo name, no id); 1 with neither but a participant email equal to the seeded stakeholder email; 1 unmatchable (unknown name, unknown emails); 1 `kind:"email"` touch matched by gainsightId. Every call has `callId`, `url` (`https://fake.gong.invalid/call/<id>`), `startedAt`, `durationSec`, `title`, `participants`, `summary`, `transcript` (short, fake).

- [ ] **Step 1: Write `connector/test/fixtures.test.mjs` first** (node:test): every fixture validates against its schema; a hand-built invalid value fails each schema (missing required, wrong type, bad enum); the five call cases above are each present (count by predicate); every `gainsightId` in the accounts fixture appears in `demo-seed.js` (read the seed as text and regex `GS-DEMO-\d{3}`). Run the contract command: red (modules missing).
- [ ] **Step 2: Write `validate.mjs`.**
- [ ] **Step 3: Write the eight schemas** (draft 2020-12 `$schema` header for humans; only the subset keywords).
- [ ] **Step 4: Write `CONTRACT.md`:** purpose (the tracker depends on this, never on an adapter; IT may re-implement it, e.g. in Workato), auth (`Authorization: Bearer <token>`; 401 otherwise), CORS (origin `null` and `http://localhost:*` / `http://127.0.0.1:*`), bind (127.0.0.1 only), each call with request/response and an example, push kinds and fields (P5), AI tasks (P6), the offline rule, versioning (`version:"1"`; additive fields only within v1), what is fake.
- [ ] **Step 5: Write the fixtures and edit `demo-seed.js`.** Read `getStakeholders` and the stakeholder normaliser in the tracker (grep) for the stakeholder shape before adding one.
- [ ] **Step 6: Run.** Contract command → `# pass <M>` (the builder reports M), `# fail 0`. Tracker check `--expect 433` (or the measured Stage A total) → unchanged pass (the seed change must not move the suite). Scenarios 6/6.
- [ ] **Step 7: Docs and commit.** README "Connector (Stage B)" paragraph: where the contract is, that only fakes exist. Commit by explicit path.

**Check:** contract tests `# fail 0`; tracker `--expect 433` → `runSelfChecks: 433/433 passed, 0 failed`.

## Task B2: Server, token, CORS, bind, fake Gong and Gainsight adapters

**Model:** Sonnet. **Supports:** K5.

**Files:**
- Create: `connector/server.mjs`, `connector/adapters/index.mjs`, `connector/adapters/gong-fake.mjs`, `connector/adapters/gainsight-fake.mjs`, `connector/config.example.json`, `connector/test/server.test.mjs`.
- Modify: `.gitignore` (add `connector/config.json`, `connector/token.txt`, `connector/fake-gainsight-log.jsonl`) — **first step of the task**.
- Modify: `connector/CONTRACT.md` ("Running it" section), README, CHANGELOG.

**Interfaces:**
- `connector/server.mjs` exports `createConnector({config, adapters, token, logPath}) → http.Server` (not listening) and, when run as main, loads `connector/config.json` (else `config.example.json`), loads or creates `connector/token.txt` (P4), listens on `127.0.0.1:<config.port || 8787>`, prints `connector listening http://127.0.0.1:<port>` and `token <hex>`.
- Bind: `server.listen(port, '127.0.0.1')` always; `config.host` is ignored with a printed warning if set to anything else.
- Adapter interface (`adapters/index.mjs` `loadAdapters(config) → {gong, gainsight, ai}`): `gong.name`, `gong.listCalls({since}) → Promise<call[]>`; `gainsight.name`, `gainsight.listAccounts() → Promise<account[]>`, `gainsight.push(items) → Promise<result[]>`; `ai.name`, `ai.complete({task, prompt, maxTokens}) → Promise<string>` (B3 fills `ai`; B2 ships `ai-fake` returning `FAKE AI (<task>)` only so health can report it).
- `gainsight-fake.push` appends one JSON line per item to `logPath` (`connector/fake-gainsight-log.jsonl`) and returns `{id, status:'sent', externalId:'FAKE-<id>', error:null}`; an item whose `fields.forceFail === true` returns `{status:'failed', externalId:null, error:'fake failure (forceFail)'}` (for C-5's failed path and C-7).
- CORS: echo `Access-Control-Allow-Origin` only for origin `null`, `http://localhost:<any>`, `http://127.0.0.1:<any>`; `Access-Control-Allow-Headers: authorization, content-type`; `Access-Control-Allow-Methods: GET, POST, OPTIONS`; `Access-Control-Allow-Private-Network: true`; `Vary: Origin`. `OPTIONS` → 204 with no auth.
- Auth: every non-OPTIONS request needs `Authorization: Bearer <token>`, compared with `crypto.timingSafeEqual` on equal-length buffers; else 401 `{error:'unauthorized'}`. Body limit 1 MB → 413. Invalid JSON or schema-invalid request → 400 with the validator's messages. Every response is validated against its schema **before** sending (a server bug becomes a 500, never a silently bad response).

- [ ] **Step 1: `.gitignore` lines**, then write `connector/test/server.test.mjs` (server on port 0, `fetch` to it): t1 `/v1/health` with token → 200, validates, adapters all `"fake"`; t2 each of the five routes without a token → 401, and with a wrong token → 401; t3 `OPTIONS /v1/health` with `Origin: null` → 204, ACAO `null`, allow-headers includes `authorization`; t4 `Origin: https://evil.example` → no ACAO header; t5 `/v1/calls?since=<iso>` validates and filters by `startedAt >= since`; `since` missing → all; bad `since` → 400; t6 `/v1/accounts` validates, 17 accounts; t7 `POST /v1/push` valid body → results validate, one `sent` per item, the log file gains N lines (temp `logPath`); a `forceFail` item → `failed` with an error; t8 invalid push body → 400; t9 `server.address().address === '127.0.0.1'` when started via the main path with `host:'0.0.0.0'` in config (spawn `node connector/server.mjs` with an env var pointing to a temp config; parse its stdout); t10 unknown route → 404 `{error}`. Run: red.
- [ ] **Step 2: Write the fake adapters and `loadAdapters`** (fixture-backed; unknown adapter name throws `adapter not built: <name>`).
- [ ] **Step 3: Write `server.mjs`** per Interfaces.
- [ ] **Step 4: Run the contract command** → `# fail 0`, record `# pass`.
- [ ] **Step 5: Manual smoke (no browser):** start the server in the background with output to `.artifacts/trim/conn.log`, `curl -s -H "Authorization: Bearer <token>" http://127.0.0.1:8787/v1/health` → `{"version":"1","adapters":{"gong":"fake","gainsight":"fake","ai":"fake"}}`; stop it. Confirm `git status --short` shows neither `connector/token.txt` nor `connector/fake-gainsight-log.jsonl`.
- [ ] **Step 6: Docs and commit** (`CONTRACT.md` "Running it": `node connector/server.mjs`, paste the token once; README pointer; CHANGELOG entry).

**Check:** contract tests `# fail 0` (K5: every fixture response validates; tokenless → 401).

## Task B3: AI adapters (fake, claude, openai, gemini)

**Model:** Sonnet. **Supports:** R1, K5.

**Files:**
- Create: `connector/adapters/ai-fake.mjs` (replaces B2's stub), `ai-claude.mjs`, `ai-openai.mjs`, `ai-gemini.mjs`, `connector/test/ai.test.mjs`.
- Modify: `connector/adapters/index.mjs`, `connector/server.mjs` (`POST /v1/ai`), `connector/config.example.json` (`ai: {adapter:"fake", model:"", apiKey:""}` with a comment line in CONTRACT.md that the key lives only in the git-ignored `config.json`), `connector/CONTRACT.md`.

**Interfaces:**
- Each real adapter: `export function create({model, apiKey}, fetchImpl = globalThis.fetch) → {name, complete({task, prompt, maxTokens}) → Promise<string>}`. Ported from the tracker's `callClaudeAPI`, `callOpenAIAPI`, `callGeminiAPI` (grep them; copy endpoint, headers, body shape, response parsing, error mapping; the tracker's browser-only header `anthropic-dangerous-direct-browser-access` is dropped server-side). Default models: whatever the tracker's `getAiSettings` / `aiProviderFor` defaults are (grep). Only these three providers exist (R1); `loadAdapters` throws for any other `ai.adapter`.
- `ai-fake.complete`: for `task === 'brief_my_day'`, find every `[id:<id>]` in the prompt and return `JSON.stringify({accounts: ids.map(id => ({id, nextAction:'FAKE next action', flags:[{kind:'drift', text:'FAKE drift flag', reason:'FAKE reason'}], reason:'FAKE reason'}))})`; otherwise `FAKE AI (<task>): <first 80 chars of prompt>`.
- `POST /v1/ai` → `{text}`; adapter error → 502 `{error}` with the provider's message, never the key.

- [ ] **Step 1: Write `ai.test.mjs`:** t11 `/v1/ai` through the server with the fake → `{text}` validates; `brief_my_day` with two `[id:x]` lines returns parseable JSON with 2 accounts; t12 each real adapter with a stub `fetchImpl` that records `(url, init)` and returns a canned provider response: assert URL host (`api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com`), the key is in the header/query where that provider wants it, `maxTokens` is passed, and the text is parsed; t13 a stub returning HTTP 401 → the adapter throws a message without the key; through the server that is a 502 whose body does not contain the key; t14 `loadAdapters({ai:{adapter:'mistral'}})` throws. Red.
- [ ] **Step 2: Port the three adapters.**
- [ ] **Step 3: Write the fake and wire `/v1/ai`.**
- [ ] **Step 4: Run the contract command** → `# fail 0`. Assert in the evidence note that `grep -rn "fetch(" connector/adapters/` shows calls only inside the three real adapters via `fetchImpl`, and that no test passes a real `fetch`.
- [ ] **Step 5: Docs and commit.**

**Check:** contract tests `# fail 0`. **This build makes no real AI call.**

## Task B4: Admin-ask one-pager and fake-data demo — STOP FOR IAN (R9)

**Model:** top model (writing for admins; must keep the research report's confirmed/unconfirmed marks).

**Files:**
- Create: `docs/superpowers/drafts/connector-admin-ask.md`.
- Create: `tools/connector-demo.mjs` (a scripted fake-data demo, Node only).

**Interfaces:**
- `node tools/connector-demo.mjs` starts the connector with fake adapters on a free port (temp config, temp token, temp log), prints each contract call and a one-line summary of its response (`health: fake/fake/fake`, `calls: 6 (2 by id, 1 name-only, 1 email-only, 1 unmatchable, 1 email touch)`, `accounts: 17`, `push: 2 sent, 1 failed (forceFail)`, `ai: FAKE AI (copilot_read)…`), stops it, exits 0. No browser.

- [ ] **Step 1: Read** `docs/superpowers/evidence/2026-10-01-trim-audit-gong-gainsight-research.md` (only the parts on scopes, auth and data handling) and `connector/CONTRACT.md`.
- [ ] **Step 2: Write the ask doc**, three sections, one page: **Gong Tech admin** (API key + secret or an OAuth app; scope `api:calls:read:transcript`; the extensive-call scope for briefs marked **UNCONFIRMED**); **Gainsight Super Admin** (OAuth app with Read/Write; Timeline, CTA and Success Plan writes; Company and Person reads; a sandbox tenant first); **IT** (where the connector runs — the user's machine, 127.0.0.1 only; a company-issued key for a sanctioned AI, Claude, Gemini or ChatGPT per R1; sign-off for sending Gong transcripts to that AI, marked as an **inference** in the research report). Then "What the tracker never does" (holds no third-party key once C-9 runs; sends nothing without a preview and a click) and "What exists today" (fake adapters only; real adapters are built only once credentials exist).
- [ ] **Step 3: Write `tools/connector-demo.mjs`** and run it to `.artifacts/trim/demo.log`; paste only its summary lines into the ask doc's "Demo" section, with the command.
- [ ] **Step 4: Check** the doc says nothing the research marks unconfirmed as fact (grep the research report for each scope string you used).
- [ ] **Step 5: Commit** the doc and the demo script.

**Check:** `node tools/connector-demo.mjs > .artifacts/trim/demo.log 2>&1; tail -6 .artifacts/trim/demo.log` → the six summary lines above and exit 0; contract tests `# fail 0`.

**STOP (R9):** push notification, then ask Ian to review `docs/superpowers/drafts/connector-admin-ask.md` and run `node tools/connector-demo.mjs`. Stage C starts on his word. Nothing is sent to any admin by the run.

---

# Stage C: the tracker on the contract

From here every task touches the tracker: the tracker check, the guide suite (if the guide is edited) and the scenarios run after each task.

## Task C-1: Schema 15 → 16

**Model:** Sonnet. **Supports:** K6.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: `CURRENT_SCHEMA_VERSION = 16` (and its comment), a `migrateData` step `if(v === 15){ … v = 16; }`, normalisers, the `gainsightQueue` normaliser in `repairAuxiliaryCollections`, `queueGainsightItem` (accepts `opts.fields`).
- Create: `tools/legacy-seed-v15.js` (a v15 book with queue items in the old prose-only shape, one activity with a transcript, no `gong`/`gainsight` fields).
- Modify: `tools/migration-dryrun.mjs` (`--from 15`: every queue item gains `status:'queued'`, `fields:{}`, `externalId:null`, `sentAt:null`, `error:null`; no activity gains `gong`; no customer gains `gainsight`; a second pass is JSON-identical), `tools/selfchecks.js`, README/VALIDATION/CHANGELOG.

**Interfaces (used by C-3, C-4, C-5):**
- `normalizeGongLink(x) → {callId, url, startedAt, durationSec, participants:[{name,email,affiliation}], summary, matchedBy}|null`; `matchedBy ∈ {'gainsightId','name','email','manual'}`; `callId` non-empty string or the whole thing is `null`; `summary` clamped to 4,000; `url` only `http(s):`.
- `normalizeGainsightPull(x) → {pulledAt, values:{}}|null` (`values` is a shallow record of the pulled fields: `tier, arr, renewalDate, csmOwner, contacts, healthScore, gates`).
- `normalizeQueueItem(q) → item|null`: today's rules (string `payload` and `customerName`, real `date`), plus `fields` (record, default `{}`), `status ∈ {'queued','sent','failed'}` (default `'queued'`; **no longer forced**), `externalId` (string|null), `sentAt` (ISO|null), `error` (string ≤ 500|null). An old prose-only item stays valid.
- The 15→16 step adds nothing to activities or customers (both fields are optional and absent by default); it rewrites each queue item through `normalizeQueueItem`.
- `activity.transcript` stays capped by `DEBRIEF_TRANSCRIPT_CHAR_CAP` (120,000); `gong.summary` never writes `activity.summary` (enforced in C-3).

- [ ] **Step 1: Failing checks.**
  - **c1a** `normalizeGongLink`: a hostile input (`url:'javascript:x'`, `summary` 10k chars, `matchedBy:'magic'`, participants with non-string emails) clamps as specified; `{}` → `null`.
  - **c1b** (K6) a book clone whose queue has `{…, status:'sent', externalId:'E1', sentAt:<iso>, error:null, fields:{gates:[]}}` survives `serializeBook` → `prepareImportedData` (the real import path) with all five fields intact.
  - **c1c** an old prose-only queue item `{id,date,customerId,customerName,kind,payload}` imports with `status:'queued', fields:{}`; an item with `status:'bogus'` imports as `'queued'`.
  - **c1d** `customer.gainsight` and `activity.gong` survive import/export and are normalised (`normalizeGainsightPull` drops non-record `values`).
  - **c1e** `CURRENT_SCHEMA_VERSION === 16`; a v15 clone through `prepareBookData` lands on 16, and a second pass is JSON-identical.
  Edit the M3 check that asserts `CURRENT_SCHEMA_VERSION === 15` to `>= 15` (it is about the 14→15 step, which still holds). Run `--expect 438`: c1a-c1e red.
- [ ] **Step 2: Normalisers** next to `normalizeGradReview`-style helpers.
- [ ] **Step 3: Queue normaliser** in `repairAuxiliaryCollections` uses `normalizeQueueItem`; `queueGainsightItem(kind, customer, payloadText, opts)` stores `opts.fields` when given.
- [ ] **Step 4: Schema bump and the 15→16 step;** activity/customer normalise of `gong`/`gainsight` only when present (do not create them; rule 4).
- [ ] **Step 5: Dry-run.** Write `tools/legacy-seed-v15.js` and the `--from 15` branch; run `node tools/migration-dryrun.mjs osm-book-of-business-tracker-1.0.html --from 15 --seed tools/legacy-seed-v15.js > .artifacts/trim/dry15.log 2>&1; echo exit=$?` → `exit=0`. Also `--from 14` and `--from 11` still exit 0.
- [ ] **Step 6: Run.** `--expect 438` → `runSelfChecks: 438/438 passed, 0 failed`; scenarios 6/6.
- [ ] **Step 7: Docs and commit.** Header release notes unaffected; VALIDATION gets the schema 16 entry and dry-run result; README's schema mention 15 → 16; CHANGELOG; SHA-256; mutation proof (force `status:'queued'` again, c1b red, restore). Commit `C-1: schema 15 -> 16 (gong link, gainsight pull, queue status); suite 433 -> 438`.

**Check:** `--expect 438` → `runSelfChecks: 438/438 passed, 0 failed`; `--from 15` dry-run exit 0 (K6).

## Task C-2: Connector client (Settings block, health, offline rule, AI routing)

**Model:** Sonnet. **Supports:** K8, K9 (health line), K10.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: connector settings get/save, `connectorRequest`, `checkConnectorHealth`, a Settings "Connector" block in `openSettingsModal`, a status line (header area beside the backup status, or Settings only plus Today's footer; pick the spot that already carries `renderBackupStatus`), `callAiAPI` routing; the 7 call sites pass `opts.task` (P6).
- Modify: `tools/selfchecks.js`, README (Connector section: how to connect), CHANGELOG, VALIDATION.

**Interfaces (used by C-3..C-7):**
- `CONNECTOR_SETTINGS_KEY = 'obm-connector-settings-v1'`; `getConnectorSettings() → {url, token}`; `saveConnectorSettings(s)`; `normalizeConnectorUrl(u) → string|''` (only `http://127.0.0.1:<port>` or `http://localhost:<port>`, trailing slash removed; anything else `''`).
- `connectorConfigured() → boolean` (`url && token`).
- `async connectorRequest(path, {method='GET', body, timeoutMs=15000}={}) → any` — `fetch(url+path)` with `Authorization: Bearer`, JSON body; throws `Error` with `.code ∈ {'NOT_CONFIGURED','OFFLINE','UNAUTHORIZED','HTTP'}`. Pass `fetchImpl` via a module-level `let _connectorFetch = (...a) => fetch(...a);` so checks can stub it.
- `ui.connector = {state:'unset'|'checking'|'online'|'offline'|'unauthorized', fake:boolean, adapters:{}, checkedAt}`; `async checkConnectorHealth()` sets it; `renderConnectorStatus() → html`: empty string when unset, `Connector offline` (quiet, `--text-faint`) when offline, `Connector: FAKE DATA` (status token, not raw colour) when any adapter is `"fake"`, else `Connector: connected`.
- `callAiAPI(promptText, opts)`: if `connectorConfigured()`, try `connectorRequest('/v1/ai', {method:'POST', body:{task: opts.task || 'general', prompt: promptText, maxTokens}})` and return `.text`; on `OFFLINE`, fall back to the browser path **if** a browser key exists, else throw the offline error; otherwise behave exactly as today (the `NO_KEY` check moves after the connector branch).

- [ ] **Step 1: Failing checks.**
  - **c2a** `normalizeConnectorUrl`: accepts `http://127.0.0.1:8787/` → `http://127.0.0.1:8787`, `http://localhost:1` ok; rejects `https://evil.example`, `http://10.0.0.1:8787`, `file:///x`, `''`.
  - **c2b** with a stubbed `_connectorFetch` recording calls and returning `{text:'ok'}`, and connector settings set (saved and restored in `finally`, localStorage included), `await callAiAPI('p', {task:'copilot_read', maxTokens:5})` resolves `'ok'` and the stub saw `POST …/v1/ai` with body `{task:'copilot_read', prompt:'p', maxTokens:5}` and the bearer header. (The suite is synchronous: run the async part in a pre-pass before the `check()` calls, the way existing async-dependent checks do; grep the suite for an existing `await`/promise pattern and follow it. If there is none, the check asserts on a synchronous `buildConnectorAiRequest(prompt, opts)` helper that `callAiAPI` uses, plus a `String(callAiAPI).indexOf('connectorConfigured()')` guard; record which in the evidence note.)
  - **c2c** offline: a stub that rejects with `TypeError('Failed to fetch')` makes `checkConnectorHealth` set `ui.connector.state === 'offline'` and `renderConnectorStatus()` contain `Connector offline`; nothing throws.
  - **c2d** a health response with `adapters.gong === 'fake'` makes `renderConnectorStatus()` contain `FAKE DATA`.
  Run `--expect 442`: red.
- [ ] **Step 2: Settings get/save/normalise and `connectorRequest`.**
- [ ] **Step 3: Health + status line**; health is checked once on load if configured and on Settings save; never on a timer.
- [ ] **Step 4: Settings "Connector" block:** address, token (password input), "Check" button, status; copy says "Run `node connector/server.mjs` and paste the token it prints".
- [ ] **Step 5: `callAiAPI` routing** and `opts.task` at all 7 call sites (`generateCopilotRead`, `generateCustomerAiBrief`, `generateSessionDebrief` ×3, `generateRiskSummaryAi`, `generateThreadAnswer`).
- [ ] **Step 6: Run.** `--expect 442` → `runSelfChecks: 442/442 passed, 0 failed`; scenarios 6/6. K10 (pre-C-9): in the evidence note, list the localStorage keys the tracker writes that can hold a third-party key: only `obm-ai-settings-v1` (grep `localStorage.setItem` and the `*_KEY` constants).
- [ ] **Step 7: Docs and commit.** SHA-256, mutation proof (make the status ignore `fake`, c2d red, restore).

**Check:** `--expect 442` → `runSelfChecks: 442/442 passed, 0 failed`.

## Task C-3: Gong pull, "Check for calls" (and the G06 fix)

**Model:** top model (matcher and preview design). **Supports:** K7.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: matcher, preview modal, apply; the log form's type change handler (G06) in `renderLogActivityTab`'s binding; `NON_SESSION_ACTIVITY_TYPES` (P7).
- Modify: `tools/selfchecks.js`, README/CHANGELOG/VALIDATION.

**Interfaces:**
- `NON_SESSION_ACTIVITY_TYPES = ['Email','Partner Sync','Implementation Note']`; `isSessionCapableType(type) → boolean`.
- `matchCallToAccount(call, customers) → {customerId, matchedBy}|{customerId:null, matchedBy:null}` — order: `call.accountRef.gainsightId === c.gainsightId`; then exact name (`trim`, case-insensitive) `call.accountRef.name === c.name`; then any participant email (lower-cased) equal to a `getStakeholders(c)` email. First rule that yields exactly one account wins; a rule that yields two or more accounts is skipped (ambiguous), never guessed.
- `buildCallPreview(calls, customers, activities) → {matched:[row], unmatched:[call], linked:[row]}`; `row = {call, customerId, matchedBy, type: call.kind === 'email' ? 'Email' : 'Call', sessionOptions:number[] /* [] when !isSessionCapableType(type) */}`; `linked` = calls whose `callId` is already on some `activity.gong.callId`.
- `applyCallImport(confirmedRows) → {created:n}` where a confirmed row is `{call, customerId, type, sessionNumber|null}`: creates one activity per row `{id, date: startedAt.slice(0,10), type, summary: call.title || 'Gong call', checklist: ACTIVITY_TYPES[type] scaffold, sessionNumber: isSessionCapableType(type) ? sessionNumber : null, flagged:false, transcript: clamp(call.transcript, DEBRIEF_TRANSCRIPT_CHAR_CAP), gong: normalizeGongLink({...call, matchedBy})}`; never writes `activity.summary` from `gong.summary`; one undo snapshot, one save. Future dates are refused like the log form does.
- UI: a "Check for calls" button (Today header or the Accounts toolbar; where "Import" actions already live), visible only when `connectorConfigured()`; the preview modal has three groups; each matched row has a confirm checkbox (default **unchecked**), a type select, and a session select that is empty and disabled for non-session types; "Add N confirmed" writes. Unmatched rows offer a manual account pick (`matchedBy:'manual'`).
- G06: in the log form, a `change` listener on `#act-type` sets `#act-session` to `''` and disables it when `!isSessionCapableType(type)`; re-enables (still `''`, no preselect) when switching back. The save handler also forces `sessionNumber = null` for non-session types (belt and braces).

- [ ] **Step 1: Failing checks.**
  - **c3a** matcher order on synthetic customers: an id match beats a name match on another account; name-only; email-only (stakeholder email); ambiguous name (two accounts same name) falls through to email; unmatchable → null.
  - **c3b** `buildCallPreview` on the fixture-shaped calls (inline copies of 6 calls in the check, not a file read) gives 4 matched (2 id, 1 name, 1 email) + the email touch = 5 matched, 1 unmatched, 0 linked; after adding an activity with one `gong.callId`, that call moves to `linked`.
  - **c3c** (K7, Gong path) the email-touch row has `type:'Email'` and `sessionOptions.length === 0`; `applyCallImport([{…emailRow, sessionNumber:3}])` on a cloned book creates an activity with `sessionNumber === null` and `gong.callId` set; the transcript is clamped at 120,000; `summary` is the title, not `gong.summary`.
  - **c3d** (K7, form path, G06) render the log form for a live account into a detached container (the way existing form checks do; grep `renderLogActivityTab(` in the suite), set `#act-type` to `Email`, dispatch `change`, assert `#act-session.value === ''` and `disabled`; switch to `Call`, assert enabled and still `''`.
  - **c3e** `applyCallImport([])` writes nothing (no save, no undo snapshot; spy on `saveData` by wrapping and restoring).
  Run `--expect 447`: red.
- [ ] **Step 2: `NON_SESSION_ACTIVITY_TYPES`, `isSessionCapableType`, and the G06 fix.**
- [ ] **Step 3: `matchCallToAccount` and `buildCallPreview`.**
- [ ] **Step 4: `applyCallImport`.**
- [ ] **Step 5: The button and the preview modal** (`connectorRequest('/v1/calls?since=' + <last pull or 30 days ago>)`; remember `DATA.config.lastCallPullAt` only if that field already exists — otherwise keep it in `ui` for the session; **no new persisted field outside C-1's schema**).
- [ ] **Step 6: Run.** `--expect 447` → `runSelfChecks: 447/447 passed, 0 failed`; scenarios 6/6.
- [ ] **Step 7: Docs and commit.** README "Check for calls" paragraph; CHANGELOG notes G06 fixed; SHA-256; mutation proof (drop the `change` listener, c3d red, restore).

**Check:** `--expect 447` → `runSelfChecks: 447/447 passed, 0 failed`.

## Task C-4: Gainsight pull, "Refresh from Gainsight"

**Model:** Sonnet. **Supports:** spec C-4.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: diff builder, preview modal, apply; `tools/selfchecks.js`; README/CHANGELOG/VALIDATION.

**Interfaces:**
- `GAINSIGHT_PULL_FIELDS = ['tier','arr','renewalDate','csmOwner','contacts']` mapped to the tracker's own field names (grep the customer record for tier/ARR/renewal/owner/contacts; record the mapping in a const `GAINSIGHT_FIELD_MAP = {tier:'<trackerField>', …}`; if a field has no tracker counterpart, it is shown read-only and never written).
- `buildGainsightDiff(accounts, customers) → [{customerId, name, rows:[{field, gainsight, tracker, differs}], gateOffers:[{gateKey, label}]}]` — matched by `gainsightId` only (accounts without an id match nothing; the preview lists them as "not linked"). `gateOffers` = gates where the account's `gates[g.contractKey] === true` and `g.isMissing(c)` in the tracker (from `GATE_DEFS`, A4).
- `applyGainsightPull(confirmed) → {updated:n}`: writes only ticked field rows and ticked gate offers (gate ticks go through the existing v90 "one definition per gate write" functions; grep the comment `ONE DEFINITION PER GATE WRITE`), stores `c.gainsight = {pulledAt, values}`; **never** writes `stage`, `goals`, verdicts, notes, `domainScores`/scores, `healthScore`. One undo snapshot, one save.
- The value-CSV import (`buildValueImportRows`, `applyValueImport`, `openValueImportModal`) is untouched.

- [ ] **Step 1: Failing checks.** **c4a** diff rows: a synthetic account differing on tier and arr gives `differs:true` on exactly those; an account without `gainsightId` is reported not linked. **c4b** `applyGainsightPull` with every row ticked leaves `stage`, `goals`, `domainScores`, notes and any verdict JSON-identical (snapshot before/after) and sets `c.gainsight.pulledAt`. **c4c** a `gates.csatContact:true` account whose tracker CSAT gate is open yields one offer `{gateKey:'csat', label:'CSAT contact'}`; one already done yields none. Run `--expect 450`: red.
- [ ] **Step 2: Field map and `buildGainsightDiff`.**
- [ ] **Step 3: `applyGainsightPull`.**
- [ ] **Step 4: The button** ("Refresh from Gainsight", shown only when configured) **and the preview modal** ("Gainsight says X, tracker has Y" per row, tick boxes default unchecked).
- [ ] **Step 5: Run.** `--expect 450` → `runSelfChecks: 450/450 passed, 0 failed`; scenarios 6/6.
- [ ] **Step 6: Docs and commit.** SHA-256; mutation proof (let apply write `stage`, c4b red, restore).

**Check:** `--expect 450` → `runSelfChecks: 450/450 passed, 0 failed`.

## Task C-5: Push, "Send to Gainsight"

**Model:** Sonnet. **Supports:** K6 (round trip with status), K9 (sent ✓).

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: fields builders at the four `queueGainsightItem` call sites, send/retry, item rendering in `renderGainsightQueueBlock` / `renderGainsightItemRow`, the day-close count; `tools/selfchecks.js`; README/CHANGELOG/VALIDATION.

**Interfaces:**
- `gainsightFieldsFor(kind, customer, ctx) → object` per P5; the `Pending items batch` gates come from `GATE_DEFS` (`gateKey`, `contractKey`, `gainsightAction`).
- `buildPushRequest(items) → {items:[{id, kind, customerRef:{gainsightId, name}, fields}]}` (only `status !== 'sent'` items).
- `applyPushResults(results) → {sent, failed}`: for each result by `id`, set `status`, `externalId`, `sentAt: nowISO()` on sent, `error` on failed; unknown ids ignored. One save.
- `async sendGainsightQueue(ids?)` → POST `/v1/push`, then `applyPushResults`; offline → toast, nothing changes. "Retry" calls it with one id.
- Rendering: sent → `✓ sent · <externalId>`; failed → the error text and a "Retry" button; queued → as today. The clipboard copy buttons stay (offline fallback).
- Day close counts "sent to Gainsight today" from items with `status === 'sent' && sentAt` today, not from impact counters.

- [ ] **Step 1: Failing checks.** **c5a** `gainsightFieldsFor('Pending items batch', c)` for a clone with CSAT and readiness open lists exactly those gates with their `contractKey` and `gainsightAction`; `buildPushRequest` skips a sent item. **c5b** `applyPushResults([{id:A,status:'sent',externalId:'X'},{id:B,status:'failed',error:'boom'}])` on a cloned queue sets both, and `renderGainsightItemRow` for B contains `Retry` and `boom`, for A contains `X`. **c5c** the day-close count for a queue with 2 sent today, 1 sent yesterday, 1 failed is 2. Run `--expect 453`: red.
- [ ] **Step 2: `gainsightFieldsFor`** and pass `{fields}` at the four `queueGainsightItem` call sites (kinds: `Success Outcome Plan`, `At-Risk CTA` ×2 sites, `Pending items batch`, `Success Plan objective`).
- [ ] **Step 3: `buildPushRequest`, `applyPushResults`, `sendGainsightQueue`.**
- [ ] **Step 4: Rendering** (sent/failed/Retry), the "Send to Gainsight" button (configured only), the day-close count.
- [ ] **Step 5: Run.** `--expect 453` → `runSelfChecks: 453/453 passed, 0 failed`; scenarios 6/6 (they read Gainsight items; if one asserts the old item shape, update it and say so).
- [ ] **Step 6: Docs and commit.** SHA-256; mutation proof (drop `externalId` in apply, c5b red, restore).

**Check:** `--expect 453` → `runSelfChecks: 453/453 passed, 0 failed`.

## Task C-6: AI decision support (R4)

**Model:** top model (prompt design; what counts as a reason; Copilot's new scope).

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: a "Brief my day" action, its prompt builder and parser, per-account rendering on Today and in the account panel (`renderOverviewTab`), `renderCopilot` / `generateCopilotRead` (book read only); `tools/selfchecks.js`; README/CHANGELOG/VALIDATION; the guide if it teaches Copilot's attention list (grep `Copilot` in the guide; edit only claims that become false).

**Interfaces:**
- `buildDayBriefPrompt(customers) → string`: one line per open account `[id:<id>] <name> — <deterministic signals from SIGNAL_DEFS with their own reasons>`; instructs the model to return JSON `{accounts:[{id, nextAction, reason, flags:[{kind:'drift'|'risk', text, reason}]}]}` and to give a reason for every action and flag.
- `parseDayBrief(text, customers) → {byId:{[id]:{nextAction, reason, flags}}, dropped:n}`: JSON only (strip a code fence if present); drops an account id not in the book, an action with an empty `reason`, and a flag with an empty `reason`; never throws (bad JSON → `{byId:{}, dropped:0, error:'unreadable'}`).
- `ui.dayBrief = {at, byId}` (session only, not persisted; no schema change).
- `async briefMyDay()` → `callAiAPI(prompt, {task:'brief_my_day', maxTokens: 3200})` → `parseDayBrief`. Today's account rows and the panel's Overview show `nextAction` + "why: <reason>" and each flag with its reason when `ui.dayBrief.byId[c.id]` exists; otherwise nothing changes (deterministic `SIGNAL_DEFS` rows stay as they are, no connector needed).
- Copilot: `renderCopilot` stops calling `needsAttentionList()` for its own attention list (remove that copy); its read becomes cross-account patterns and weekly movement (the prompt in `generateCopilotRead` drops per-account to-dos and asks for patterns across accounts and what moved this week). `needsAttentionList` itself stays (Today, diff, telemetry use it).

- [ ] **Step 1: Failing checks.** **c6a** `parseDayBrief` on a fake text with one good account, one with an empty reason, one unknown id and one flag without a reason keeps exactly the good account and its reasoned flags, `dropped === 3`; a non-JSON text gives `error:'unreadable'`. **c6b** `String(renderCopilot).indexOf('needsAttentionList(') === -1` and rendering Copilot on the demo book still produces its book read container (grep its id). **c6c** with no connector and no `ui.dayBrief`, Today renders the same `SIGNAL_DEFS`-driven rows as before (compare `todayActionList()` ids before/after setting and clearing an empty `ui.dayBrief`), and `buildDayBriefPrompt` includes an `[id:` line per open account. Run `--expect 456`: red.
- [ ] **Step 2: `buildDayBriefPrompt` and `parseDayBrief`.**
- [ ] **Step 3: `briefMyDay`, the button on Today, and per-account rendering** on Today and in `renderOverviewTab` (tokens only; rule 2).
- [ ] **Step 4: Copilot as the book read:** remove its attention-list copy; rewrite the `generateCopilotRead` prompt section accordingly.
- [ ] **Step 5: Run.** `--expect 456` → `runSelfChecks: 456/456 passed, 0 failed`; scenarios 6/6; guide 18/18 if edited.
- [ ] **Step 6: Fake-connector smoke:** start `node connector/server.mjs` (fake AI), in a headless page set connector settings and call `briefMyDay()`; the fake returns one entry per `[id:]` line; record `Object.keys(ui.dayBrief.byId).length` equal to the open-account count in the evidence note. (C-7 makes this permanent.)
- [ ] **Step 7: Docs and commit.** SHA-256; mutation proof (let `parseDayBrief` keep reasonless actions, c6a red, restore).

**Check:** `--expect 456` → `runSelfChecks: 456/456 passed, 0 failed`.

## Task C-7: End-to-end scenario against the fake connector

**Model:** Sonnet. **Supports:** K7, K8, K9.

**Files:**
- Create: `tools/connector-e2e.mjs`.
- Modify: README (the command), VALIDATION (result), CHANGELOG.

**Interfaces:**
- `node tools/connector-e2e.mjs [--keep-logs]`: starts `connector/server.mjs` as a child with a temp config (all fake), temp token file, temp push log, free port (parse `connector listening http://127.0.0.1:<port>` and `token <hex>` from stdout); launches headless Chrome on the tracker **without** `--allow-file-access-from-files` (fresh temp profile, CDP, same pattern as `tools/selfcheck.mjs`); seeds `demo-seed.js`; saves connector settings in the page; then runs 7 named checks and prints `connector-e2e: N/7 passed, M failed`, each FAIL with detail, and console errors; exit 0 only if 7/7 and no console errors.
- The 7 checks: **e1** health line shows `FAKE DATA` (K9); **e2** "Check for calls" (call the same function the button calls) yields the preview groups 5/1/0; **e3** confirm one matched Call row with a session → one new activity with `gong.matchedBy` and that `sessionNumber`; **e4** the Email-touch row, even if confirmed with a session number forced in the row, lands with `sessionNumber === null` (K7); **e5** queue one `Pending items batch` item and "Send to Gainsight" → item `status:'sent'` with `externalId` starting `FAKE-`, and the connector's push log has 1 line; **e6** the rendered Gainsight block for that account shows `✓ sent`; **e7** kill the connector, call `checkConnectorHealth()` → `Connector offline`, re-render Today and run `window.runSelfChecks` (inject `tools/selfchecks.js` as A1 does) → all pass, and no console errors since the kill (K8).

- [ ] **Step 1: Write the runner with all 7 checks**, run it before any fix, and record the output (expected: 7/7 if C-2..C-6 are right; any failure is a C-task defect, handled through the build → checker loop, not by editing the scenario).
- [ ] **Step 2: Run** `node tools/connector-e2e.mjs > .artifacts/trim/e2e.log 2>&1; tail -3 .artifacts/trim/e2e.log`.
- [ ] **Step 3: Confirm cleanup:** no Chrome or node child left (`tasklist | findstr /i "chrome node"` count before vs after in the evidence note), temp files removed, `git status --short` clean apart from the task's files.
- [ ] **Step 4: Docs and commit.**

**Check:** `node tools/connector-e2e.mjs > .artifacts/trim/e2e.log 2>&1; tail -3 .artifacts/trim/e2e.log` → `connector-e2e: 7/7 passed, 0 failed`, exit 0. Tracker `--expect 456` unchanged; contract tests `# fail 0`.

## Task C-8: Decoration look call (R5) — GATED on Ian's batched look calls

**Model:** Sonnet (captures only; no taste calls by the builder or the lead).

**Files:**
- Create: `tools/decoration-captures.mjs` (or reuse `tools/inspect.mjs` if it can toggle a class/flag; read its usage header first).
- Create: `docs/superpowers/evidence/trim-and-integration/C-8.md` (capture list with sha256 fingerprints and DOM checks; **no images in git**: `*.png` is git-ignored; captures go to `.artifacts/trim/c8/`).

**Interfaces:** a capture runner that renders Copilot and Risk in four states each: baseline; without the card deck; without glideslope + telemetry; without the scroll drivers. "Without" is done by a capture-time switch (a CSS class on `<html>` or a stubbed renderer injected over CDP), **never by editing the tracker**.

- [ ] **Step 1: Find the switches.** Grep the tracker for the card deck, glideslope, telemetry (`copilotTelemetry`) and the scroll drivers (header rule 0 names them); write down, per decoration, the smallest capture-time override that hides it.
- [ ] **Step 2: Write the runner** (1440×900, demo seed, fixed date if the page supports one); per capture: a DOM check that the decoration is present/absent, the PNG, its sha256.
- [ ] **Step 3: Run it**; verify every DOM check and fingerprint (8 captures). Do not open the images.
- [ ] **Step 4: Critic.** Dispatch the `studio-harness:look-critic` agent on the capture set; it returns `reject` (fix the capture, not the design) or `pass-to-ian`.
- [ ] **Step 5: File for Ian.** Publish the captures (Artifact) in pairs (with/without) for each decoration, with one question per decoration: keep or remove. The lead batches this with any other look calls at the end of Stage C. Commit the runner and the evidence note.
- [ ] **Step 6 (after Ian rules):** remove only what Ian rules out, one commit per decoration, each naming removed checks and the new total; header rule 0 updated if a scroll device goes.

**Check (before the ruling):** the runner prints `8 captures, 8 DOM checks passed, 8 fingerprints` and exits 0; tracker `--expect 456` unchanged. **Stop:** Ian's look calls (batched). If none by the end of the run, C-8 removals are recorded pending.

## Task C-9: Retire browser AI — GATED on Ian's sanctioned key (R1)

**Gate:** Ian supplies a key for Claude, Gemini or ChatGPT (R1). It goes only into `connector/config.json` (git-ignored), never into chat logs, evidence, commits or the tracker. Without it, C-9 is skipped and recorded `pending: no sanctioned key`; the browser AI stays as the fallback.

**Model:** Sonnet.

**Files:**
- Modify: `connector/config.json` (local, never committed) — by Ian or by the lead at Ian's instruction.
- Modify: `osm-book-of-business-tracker-1.0.html`: delete `callClaudeAPI`, `callOpenAIAPI`, `callGeminiAPI`, the browser branch of `callAiAPI`, `AI_SETTINGS_KEY` / `getAiSettings` / its saver and the Settings AI block (model choice, if still wanted, moves to the connector config); add `obm-ai-settings-v1` to `RETIRED_SETTINGS_KEYS` (A3) so the one-time cleanup removes the stored key. `callAiAPI` with no connector throws `NOT_CONFIGURED` with "Connect the connector in Settings to use AI".
- Modify: `tools/selfchecks.js`, README/CHANGELOG/VALIDATION, guide if it teaches the API-key field.

**Interfaces:** `callAiAPI(promptText, opts)` → connector only.

- [ ] **Step 1: The one real call** (Ian's stop, push notification first): start the connector with Ian's config; run `curl -s -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"task\":\"general\",\"prompt\":\"Reply with the single word OK.\",\"maxTokens\":5}" http://127.0.0.1:8787/v1/ai`; record only whether `text` is non-empty and the provider name from `/v1/health`. This is the only external call of the run.
- [ ] **Step 2: Failing check c9a:** `typeof callClaudeAPI === 'undefined' && typeof getAiSettings === 'undefined'`, `RETIRED_SETTINGS_KEYS` includes `obm-ai-settings-v1`, and `callAiAPI` with no connector rejects with code `NOT_CONFIGURED`. Red.
- [ ] **Step 3: Delete the browser path and the AI settings block;** remove checks that assert the browser provider path (name each).
- [ ] **Step 4: Run** the suite with the measured total, scenarios 6/6, `node tools/connector-e2e.mjs` 7/7 (the fake AI path is unaffected).
- [ ] **Step 5: Measure K10:** `grep -n "localStorage.setItem" osm-book-of-business-tracker-1.0.html` and every `*_KEY` constant: no key that holds a third-party credential remains (the connector token is not one; P8). `node tools/refcount.mjs osm-book-of-business-tracker-1.0.html callClaudeAPI,callOpenAIAPI,callGeminiAPI,getAiSettings` → all 0.
- [ ] **Step 6: Docs and commit** (README AI section: AI needs the connector; CHANGELOG; SHA-256). Confirm `git status --short` does not list `connector/config.json`.

**Check:** suite `--expect <measured>` → `N/N passed, 0 failed`; e2e 7/7; K10 as above.

---

## Acceptance checks → tasks

| K | Measured in | How |
|---|---|---|
| K1 | A1 step 6 | blob and working-tree bytes before/after; 437/437 |
| K2 | A2 step 6, A3 step 6, A5 step 6, A6 step 5 | removed checks named in each commit; `tools/refcount.mjs` 0 per removed symbol |
| K3 | A3 step 6 | `grep -c` on the two key strings = only the cleanup constant |
| K4 | A4 step 6 | labels from the three surfaces identical; a4a/a4b are the two predicates' own checks |
| K5 | B1-B3 | contract tests `# fail 0`; every fixture validates; tokenless → 401 |
| K6 | C-1 | `--from 15` dry-run exit 0; c1b (sent + externalId round trip) |
| K7 | C-3 (c3c, c3d), C-7 (e4) | Email never gets a sessionNumber, form or Gong path |
| K8 | C-7 (e7) | connector killed: suite passes, Today renders, 0 console errors |
| K9 | C-7 | `connector-e2e: 7/7`, e1 shows FAKE DATA |
| K10 | C-2 step 6 (before), C-9 step 5 (after) | third-party-key localStorage inventory |

## Review (after the last buildable task)

Final whole-branch review on the top model (`superpowers:requesting-code-review`), base `b1a8452`. Findings go through the same build → checker loop. Then stop for Ian's merge call.

## Self-review notes (the plan against the spec)

- **Coverage.** §4 A1-A6 → tasks A1-A6; §5 B0-B4 → B0-B4; C-1..C-9 → C-1..C-9; K1-K10 → table above; §3 offline rule → C-2 (c2c) and C-7 (e7); §3 contract rule → CONTRACT.md (B1) and C-2's client using only `connectorRequest`; §3 bind/CORS/token → B2 t2-t4, t9; §7 out of scope respected (no real Gong/Gainsight adapters, no hosting, no Stage D).
- **Spec points the plan had to decide** are P1-P9 above. Other gaps the spec does not mention, found at planning:
  `tools/selfcheck.mjs` polls for `window.runSelfChecks` before seeding, so A1 cannot keep "the same command" without
  changing the harness (P1). The guide's rhythm card "Time saved, by the day" teaches what A5 removes, so A5 edits the
  guide. `guide-manifest.json` already claims 369 checks and schema 12 (stale before this run; A1 fixes the count
  claim). `demo-seed.js` has no stakeholder emails, so B1 adds one for the email-only match. The contract's
  `gates:{readinessAssessment, csatContact, successPlan}` has no graduation-date gate and uses different keys from
  `GATE_DEFS`, hence `contractKey` (P2). `callAiAPI` throws `NO_KEY` before choosing a route, so C-2 must reorder it. The estimates in the count table are the plan's; only the baseline is measured.
- **Measured at planning (2026-10-01, `b1a8452`, this worktree):** working tree 1,787,753 bytes with 28,283 CR bytes (CRLF; `core.autocrlf=true`); blob 1,759,470 bytes; the moved span (banner + wrapper + inner + `window.runSelfChecks`) is 538,504 LF bytes / 547,055 CRLF bytes, `_runSelfChecksInner` alone 537,958 LF bytes (matches spec §2, which therefore mixes a CRLF file size with an LF suite size).
