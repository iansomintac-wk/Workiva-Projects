# Over-engineering audit: OSM Book of Business Tracker (read-only), 2026-10-01

Repo: `C:\Users\teasp\Documents\Runway Tracker\.claude\worktrees\trim-audit` (branch trim-audit = master `57f263b`).
File: `osm-book-of-business-tracker-1.0.html`; line numbers below refer to it unless another file is named.
Nothing in the repo was edited or committed.

## Verdict

**Yes, it is over-engineered. The bloat is not in the core loop.** The core loop is: Today → account panel → log
→ graduation → CSM packet. Its data layer (load, migrate, repair, backup, undo) is careful and earns its place.

The excess sits in three places:

1. **The same idea modelled several times over.**
   - "What the customer wants and whether they got it" is stored in 5 places.
   - The compliance-gate list is written out 3 times.
   - Risk is derived by 2 registries and classified by 3 keyword systems.
   - "Dismissed / actioned" is remembered in 4 stores.
2. **Layers that exist to describe the tool rather than to do the OSM's work.**
   - Time-saved accounting.
   - Signal calibration.
   - Telemetry, HUD and motion.
   - The Copilot portfolio chapters.
3. **Scaffolds for integrations that cannot work from a browser.**
   - Gainsight API key and sync.
   - Workiva knowledge search.
   - The Gainsight to-do queue, the Copy for Gainsight text, three import paths and manual coordination entry. The
     end-state integration replaces all of these.

Most of the size, though, is not features:
- The shipped file carries its own 547 KB test suite (31% of the bytes).
- About 322 KB of the script is comments (19% of script characters).

## How the figures were obtained

Every figure below was **RAN** (measured in this session) unless it is marked READ.

- **Tooling.** The scripts are in `C:\Users\teasp\.claude\jobs\c810ab0e\tmp\a\`:
  - `scan.mjs` is a tokenizer and brace-matcher. It finds every function's start and end line and its nesting.
  - `strip.mjs` blanks out comments, so a mention inside a comment cannot pass for a caller.
  - `refs.py`, `trans.py` and `callers.py` build the call graph from code and markup handler strings, with the
    self-check suite excluded and then counted separately.
  - `sections.mjs` and `famchecks.py` size each section and count the self-checks that touch it.
  - `probe-seed.js` measures the live book shape in headless Chrome through `tools/selfcheck.mjs`.
- **Self-check count per feature.** This counts how many of the 438 `check(` sites have setup code (the text between
  the previous check and this one) that references one of the feature's functions. It is a proxy for coverage, not
  an exact count.
- **Size per feature.** This is the sum of the line spans of the feature's top-level functions. It leaves out its
  constants, CSS and the event handlers inside `attachEvents` (see below), so it understates the true size.
- **Known scanner limit.** A function with an object default parameter mis-measures. Only one exists
  (`searchWorkivaKnowledge`, L1904), and it was measured by hand at 29 lines.
- **Baseline re-run.** `node tools/selfcheck.mjs ... --seed demo-seed.js --expect 437` gave **437/437, exit 0**.
  The suite takes 1,370 ms, and `render()` averages 24.6 ms on the 17-account demo book.

## Headline numbers

| Measure | Value |
|---|---|
| File | 1,787,753 bytes, 28,283 lines (CRLF) |
| Script | 1,667,784 chars (L1695-28281) |
| CSS | 112,295 bytes (L55-1684) |
| **Self-check suite** | `_runSelfChecksInner` L8274-16814: **8,541 lines, 546,499 bytes = 30.6% of the file**. 438 `check(` sites, 437 run. 107 helper functions inside it |
| Comments in script | 321,687 chars = 19.3% (115 K of it inside the suite). 1,001 `vNN` provenance markers |
| Functions | **852 total**: 745 outside the suite (635 top-level) and 107 inside it. Top-level product functions span 14,035 lines |
| Largest function | **`attachEvents` L23463-25044 = 1,582 lines**: one function holding the event binding for every feature, with 325 `addEventListener` sites in the file |
| SIGNAL_DEFS | **18** (L7541-7700). On the demo book 10 of them fire on at least one account |
| Schema | **15**, with **15 migration steps** (`migrateData` L4732-5100, 369 lines). 1.0 shipped at **schema 11** (git `accc76e`) |
| Normalisers | **17** `normalize*` functions |
| Load / migrate / repair / validate pipeline | 20 functions, **1,178 lines** |
| Settings | **18 section blocks** in `openSettingsModal` (L26057-26331, 275 lines), plus Graduation gates, Motion and a separate 257-line Curriculum modal. **17 `DATA.config` keys** on the demo book (RAN), and 19 config keys referenced in code (READ) |
| UI surface | **4 top tabs** (Today, Accounts, Risk, Copilot), **10 account-panel tabs** (overview, details, implementation, sessions, activity, log, gainsight, handoff, plays, coordination), **16 modals** (1,499 lines), and 4 Accounts lenses |
| localStorage keys | 8: the book, plus AI settings, Gainsight settings, Workiva KB settings, day prefs, panel width, motion and onboard dismissals |
| Growth since 1.0 (2026-08-06) | 22,403 → 28,283 lines (**+26%**). 1.39 → 1.79 MB. 319 → 438 check sites. Schema 11 → 15 |
| Demo book (17 accounts, RAN) | 87,546 bytes. **`config` is 47,126 bytes (54%)**, because each book carries its own copy of the curriculum. Customers 21 KB, activities 17 KB. 28 distinct customer keys in use |

## 1. Inventory

Column notes:
- **Fns / lines** is top-level functions and the lines they span.
- **Checks** is the self-check proxy described above.
- **DATA fields** counts stored fields the feature adds: `c.` is a customer field, `DATA.` a top-level book field,
  `cfg.` a config field and `LS` a localStorage key.

| Feature area | Fns / lines | Checks | DATA fields it adds | UI entry point | Section (line) |
|---|---|---|---|---|---|
| Today (day timeline, beats, close, standing, effort, admin gaps) | about 50 / about 1,800 (sections v72 Day 206, Track 354, Effort 338, Account stands 292, Close 90, beat-pane binding 432, standing admin 55, landing 44) | 48 | DATA.dayClose, DATA.todayLastSeenIds, c.nextSessionTime, LS day-prefs (4) | Tab 01 | L19958-21325, L23308 |
| Accounts lenses (list, table, kanban, gantt) + dashboard + runway strip + heatmap | 7 / 212 for the lenses; dashboard 241; runway model 230 | about 9 | none | Tab 02 | L18099-18523, L7058 |
| Account slide-over (10 tabs) | 14 / 791 for the panel section, plus 539 for session plan, activity and log | 17 + 12 | none (it displays the rest) | Account click | L21977-23306 |
| Risk tab (hub, triage, cases, exec summary, spine, deck) | 35 / 748 | 19 | DATA.riskLog (firstSeen, lastActioned, sevLog[12], summary, summarySource, verdict) (1, with 6 subfields) | Tab 03 | L17552-17789, L18763-19271 |
| Copilot tab (portfolio chapters, next-action routing, AI read, card deck, band, telemetry, instruments) | 11 / 426 for logic, plus card deck section 686, band 179, telemetry 95, instruments 35 | 15 (deco) + 23 (AI shared) | DATA.weeklySnapshot, DATA.healthHistory, DATA.pauseReturns (3) | Tab 04 | L5716, L17790-18098, L19272-19957 |
| Signal registry + local advisor | 23 / about 380 (registry section 377, advisor 185) | 20+ | c.signalSuppressions, c.lastShownRecommendation, cfg.advisorRiskKeywords, cfg.advisorPositiveKeywords, cfg.keywordSignalMaxAgeDays + 5 thresholds (10) | Today, Overview, Risk | L7341-7902 |
| Signal calibration | 4 / 92 | 3 | c.recommendationLog (capped at 20 per account) | **none: the renderer has no caller** | L7903-8014 |
| AI layer (8 `callAiAPI` sites: call prep, debrief ×3, copilot read, risk summary, thread answer, portfolio brief [dead]) | about 45 / about 1,000 | 23 | LS obm-ai-settings-v1 | Settings, Copilot, panel, Risk, Today | L1699-2531, L2532-2982, L19072, L20590 |
| Session debrief + transcript + score proposals + call review | 21 / 453 | in the AI count | activity.transcript, activity.openThreads | Panel → Activity | L2532-2982, L23031-23140 |
| Graduation plan (goals, gates, verdict, change, exit, graduation confirm) | 48 / 518 | 34 | c.goals, c.exit, c.graduation, cfg.goalGates (4) | Panel Overview, stage change, Settings | L4348-4660, L25131-25282 |
| Outcome criteria + evidence | 11 / 292 | 44 | c.outcomeCriteria, c.outcomeEvidence, cfg.outcomeNames (3) | Panel Overview | L6611-7057 |
| Compliance gates (Readiness, Success Outcome Plan, CSAT, grad-date SLA) | 14 / 163 | 5 | c.compliance (3 gates, 10 subfields) | Panel Details, Today admin gaps | L5838, L7282-7340, L22085 |
| First value / TTFV | 9 / 56 | 11 | c.firstValue {definition, evidence[], achievedOn} | Panel Overview and Log | L6241-6510 |
| Graduation check-back (gradReview) | 8 / 62 | 6 | c.gradReview, cfg.gradReviewDays (2) | Panel Overview, Today | L3308-3371 |
| Curriculum identity + runbooks + curriculum fit + session backfill | 21/181 + 14/379 + 5/97 + 6/198 | 17 + 7 + 7 | cfg.sessionTemplates (ids), c.sessionNotes, c.components, c.cadence, cfg.componentWeights, cfg.standardWindowWeeks | Curriculum modal, Sessions tab, Settings | L3788-4347, L21401-21554, L22768 |
| Curriculum content (data, not logic) | `DEFAULT_SESSION_TEMPLATES` 35 KB (L3519-3787) + `RUNBOOK_LIBRARY` 33 KB (L4158-4347) | none | none | none | none |
| Coordination (stakeholders, blockers, commitments) | 14 / 147 | 3 | c.stakeholders, c.blockers, c.commitments (3). **Demo book: 0/0/0** | Panel → Coordination | L2983-3067 |
| Plays (5 playbooks) | 13 / 171 | 8 | c.playbooks | Panel → Plays | L3145-3307, L21795 |
| Handoff in/out + CSM packet (One Document) | 8 / 182 | 6 | c.handoffIn, c.handoffOut (2) | Panel → Handoff | L3427-3518, L21207-21325 |
| Partner-led implementation hub | 20 / 206 | about 6 | c.implementation, cfg.implQuietDays | Panel → Implementation, Copilot | L5448-5698, L5923-6120 |
| Open threads / questions | 6 / 55 + v93 parts | 6 | activity.openThreads | Today beat, prep | L3372-3426, L5923 |
| Gainsight to-do + queue + copy text + settings | 16 / 274 | 11 | DATA.gainsightQueue, activity.checklist[], c.gainsightId, LS gainsight-settings (with API key) | Panel → Gainsight, Today close, Risk | L1747-1773, L7710, L8167-8205, L19221-19245 |
| Time saved / impact | 14 / 216 (+ `IMPACT_EVENTS`, 17 `trackImpact` call sites) | 8 | DATA.impact, DATA.impactLog (≤4000), cfg.impactMinutes (3) | Settings, Day close, Progress report | L18527-18821, L25884-26056 |
| Manager progress report | 4 / 118 | about 3 | none | Settings / export | L26572-26714 |
| Value / renewal + imports (Excel, partner notes, value CSV) | 7/77 + 20/666 | 2 + 9 | c.tier, c.arr, c.renewalDate (3) | Settings import modals | L3068, L27361-28143 |
| Backup / export / import JSON | 15 / 139 (+ the pipeline below) | in the migration count | lastExportedAt; file handle in IndexedDB | Header, Settings | L26381-26571 |
| Load / migrate / repair / validate | 20 / 1,178 | about 108 (many checks seed through it) | schemaVersion | none (invisible) | L4732-5270, L26715-27221 |
| Undo (single level) | 3 / 28 + plumbing | 26 | none | Toast, Ctrl-Z | L5271-5447 |
| Motion / scroll drivers / magnet / band / telemetry / glideslope / card deck | 24 / 516 + CSS | 15 | LS motion, LS panel-width | Everywhere | L1809-1860, L17027-17300, L17790-18098, L19272 |
| ICS calendar export | 5 / 77 | 2 | none | Panel button | L6400-6480 |
| Workiva knowledge search scaffold | 4 / about 75 (L1866-1981, 5.8 KB with the settings) | 1 | LS workiva-kb-settings (with token) | Settings "future use" | L1866-1981 |
| Book readiness / dismissed gaps | 8 / 90 | 6 | LS obm-onboard-v1 | Today strip | L21555-21631 |
| Self-check suite | 1 + 107 nested / 8,541 | 438 sites | none | Console | L8265-16816 |

## 2. Overlap and duplication

### O1. "What the customer is trying to achieve, and did they get there": 5 stored models plus 1 derived

1. `handoffIn.promisedOutcomes`: free text (L3449).
2. `c.firstValue.definition` and `evidence[]` (`getFirstValue` L6278).
3. `c.compliance.outcomePlan` {done, outcomeNumber (1-18 Gainsight outcome name), planText} (L5104).
4. Outcome criteria and evidence: per-deliverable, judged by `outcomeVerdict` (L6862), which also reads
   `outcomePlan.outcomeNumber`.
5. `c.goals[]` with gates and a verdict (schema 14, L4348-4590).

**Evidence of the overlap:**
- `goalHintText` (L4521-4529) literally falls through models 1 → 2 → 3 to suggest text for model 5.
- The Overview tab renders `renderGoalPanel` and `renderOutcomeCriteria` side by side, with first value and
  `missingGatesText` (L22401-22494).
- The CSM packet prints "Criteria: x of y evidenced" inside the goal section (`buildGoalsSectionLines`), so model 4
  is already subordinate to model 5.

### O2. Graduation judgement: 6 stored verdict or readiness concepts

- Goal verdict (met, partly, not_met, replaced) at L4514.
- Goal gates.
- `outcomeVerdict` (derived) at L6862.
- Compliance gates `GATE_DEFS` at L7282.
- `gradReview` verdict (held, partial, lapsed) 30 days after graduation, at L3308-3360.
- Two separate "ready" signals:
  - `ready_to_set_date` (`customerGradReadySignal`, L7457) is session-count based.
  - `ready_to_graduate` (`customerReadyToGraduateSignal`, L4564) is goal-gate based.
- Plus `isGraduatingSoon` (L8041), `late_gate` (L7637) and `exit`.

gradReview and the goal verdict ask different questions at different times, so they are not strict duplicates. But
the only roll-up of gradReview (`graduationDurability`) is dead code (§3), so its answers are never aggregated.

### O3. The compliance gate list is written 3 times

- `ADMIN_GAP_DEFS` (L5838-5850): gradDate means "no committed date".
- `GATE_DEFS` (L7282-7287): gradDate means "SLA tolerance".
- `pendingGainsightItems` (L8167-8205) hardcodes the same three compliance gates again, with its own labels.

Same four concepts, three wordings, two different gradDate tests.

### O4. Risk is derived twice and classified three ways

- **Registry A.** `SIGNAL_DEFS` (18 entries) feeds `getRecommendedAction`, `getCustomerNextSteps` and Today.
- **Registry B.** `buildRiskHubList` (L19003-19071) re-derives risk items on its own: Off Track, risk language,
  behind target, Watch and implementation risk, plus `RISK_TAXONOMY` category hits. The header's rule 3 says signals
  belong in SIGNAL_DEFS; the hub is a second registry.
- **State.** `computeRisk` (L6070) is wrapped by `accountState` (L6188) because computeRisk "cannot see a flagged
  note". `healthScore` (L7157) and `complianceScore` give a third reading.
- **Three keyword classifiers over the same note text:**
  - `DEFAULT_ADVISOR_RISK_KEYWORDS` and `DEFAULT_ADVISOR_POSITIVE_KEYWORDS` (L7352-7353, 35 phrases, configurable).
  - `RISK_TAXONOMY` (L18763, 17 categories, hardcoded).
  - `ESCALATION_MATCHERS` regexes (L5732), alongside `OSM_ESCALATION_PATHS` (L2374).
- The lifecycle walk already found classifier 1 wrong: "champion has left" scores *positive* (G11, RAN 2026-09-30).

### O5. "Dismissed / actioned / seen" memory: 4 stores with 4 dismiss flows

| Store | Where | Dismiss flow |
|---|---|---|
| `c.signalSuppressions` + `c.lastShownRecommendation` + `c.recommendationLog` | L7777-7850 | `showDismissModal` L25056 |
| `DATA.riskLog` verdicts | L18873-18915 | `showRiskDismissModal` L25993 |
| `obm-onboard-v1` dismissed gaps | L21577 | |
| `DATA.todayLastSeenIds` and `weeklySnapshot` diffing | L19857-19899 | |

### O6. "Next step" recommenders: 6 that answer overlapping questions

| Recommender | Where | What it does |
|---|---|---|
| `getRecommendedAction` | L7823 | headline |
| `getCustomerNextSteps` | L7890 | top 3; shares SIGNAL_DEFS, so these first two are already consolidated |
| `accountNextAction` | L5759 | v95 Copilot "why and what", with routing |
| `todayAccountCandidates` / `todayActionList` | L20133, 109 lines | Today ranking |
| `suggestedPlaybooks` | L3278 | |
| `adminGapList` / `bookReadiness` / `coverageGapList` | L5852, L21601, L6350 | |

`needsAttentionList` (L19826) is rendered by **both** `renderToday` and `renderCopilot`.

### O7. Tally, progress and pace helpers

- **Sessions:** `sessionsCompletedCount` L6213 (31 uses), `plannedSessionTotal` L4587 (30 uses),
  `sessionProgressPct` L4583, `unheldPlannedSessions` L4571, `minimumPlannedSessions`,
  `highestLoggedSessionNumber`, `nextOpenSessionNumber`. The graduation plan already consolidated these behind
  `plannedSessionTotal`; this is fine.
- **Pace and projection:** `sessionPaceDays` L6979, `projectedGraduationDate` L6984, `isBehindTarget`,
  `customerPaceSignal` L7439, `runwayModel` L7075 (69 lines), `glideDeviation` L17806.
- **Readiness and fit:** `domainProgressFraction` L5546, `computeCoverage` L6330, `computeCurriculumFit` L22832.

Of these, only `runwayModel` against `glideDeviation` and `computeCurriculumFit` are second readings of the same
pace. Low priority.

### O8. Notes, prep and recap: 9 features

- Session prep notes (`c.sessionNotes`, `readSessionNote`).
- Runbooks: authored (33 KB) or generated, plus `buildSessionScriptText`.
- `renderBeatPrep` (L20851).
- `buildCallPrepContext` (AI only; walk G08).
- Session Debrief (AI recap).
- Open threads.
- Wrap-up modal.
- Quick log, Log tab and the backfill modal: 3 ways to log a session (L21338, L23228, L21650).

### O9. Follow-up items: 7 structures

Commitments, blockers, open threads, playbook steps, activity Gainsight checklists, `DATA.gainsightQueue` and
implementation risks. Gainsight CTAs and tasks cover most of this natively.

### O10. Two Gainsight models

- A **derived** to-do list: `pendingGainsightItems`, built from `ACTIVITY_TYPES` checklists (3 items per Call,
  L2970) plus compliance plus grad-date.
- A **persisted** queue: `DATA.gainsightQueue` (CTA drafts and goal events, L19226).
- Plus three text builders: `buildGainsightCopyText` L7710, `buildGainsightBatchText` L21207 and
  `buildRiskCtaText` L19201.

### O11. Time saved stored twice

`DATA.impact` (lifetime counters) and `DATA.impactLog` (dated, ≤4000). The v98 comment at L18587 keeps the counter
"so every existing surface is untouched". Every figure is count × an assumed number of minutes (`IMPACT_EVENTS`
L18544; `EFFORT_MIN` L20019).

## 3. Dead and near-dead code

### Unreachable functions

The scan stripped comments and counted callers outside the suite and in markup handler strings, then ran
transitively. It found **12 unreachable functions, 195 lines**. None has a dynamic `window[...]` dispatch path
(grep: none outside the suite).

| Function | Line | Lines | Note |
|---|---|---|---|
| `generatePortfolioAiBrief` | 2175 | 40 | **One of the walk's 8 AI call sites is dead.** The comment at L23578 claims it "is still what fills the summary block under the band". That claim is false: there are 0 callers. |
| `renderRiskRow` → `renderRiskOwnership`, `renderRiskNextSteps`, `riskTrend` | 17559, 17606, 17632, 17598 | 29 + 18 + 13 + 8 | Superseded by the case and deck render |
| `renderSignalCalibration`, `getSignalCalibration` | 7956, 7919 | 28 + 30 | The comment calls it "PARKED, NOT DELETED". The comment above it says calibration data is read "on every verdict". It is not: only the dead renderer and the suite read it. |
| `partitionRisks` | 18965 | 10 | Suite only; it duplicates the state logic in `buildRiskCases` |
| `removeOutcomeCriterion` | 6849 | 9 | Suite only |
| `graduationDurability` | 3363 | 8 | Suite only: the only roll-up of gradReview |
| `icsUnfold` | 6456 | 1 | A test helper living in product code |
| `openThreadsToText` | 3409 | 1 | 0 references |

10 suite checks touch these. Most of them test something else and only use a dead function as a helper.

### Write-only data

`c.recommendationLog` is written by `logRecommendationEntry` (L7802-7805, capped at 20 per account). Its only
reader is `getSignalCalibration`, which is dead. The data accrues with no surface.

### Features with no product entry

- **Gainsight sync.** `syncGainsightQueue` (L19237) always returns `transport_not_built`. The Settings block
  "Gainsight integration (future use)" (L26153) **stores a Gainsight API key in plain localStorage**
  (`obm-gainsight-settings-v1`, L1752) that nothing uses.
- **Workiva knowledge search.** The Settings block "Workiva Knowledge search (future use)" (L26161) and
  `searchWorkivaKnowledge` (L1904) are reached only from a test button in Settings. Its endpoint token sits in
  localStorage the same way.

### Pre-1.0 legacy

1.0 shipped at schema 11 with the real outcome names and module keys (checked in `git show accc76e`).

| Item | Size | Serves |
|---|---|---|
| Migration steps v0→v11 (L4734-4941) | 208 lines, 11,079 bytes | Only books saved by pre-1.0 dev builds. The repo's own legacy seeds start at schema 11 (`tools/legacy-seed.js`) |
| `OLD_GUESSED_OUTCOME_NAMES` swap (L5159-5175) | about 1.5 KB | Pre-1.0 only: 1.0 already shipped `DEFAULT_OUTCOME_NAMES` as the real list |
| `LEGACY_TEMPLATE_KEYS` 'Both' → 'Sustainability + Carbon' (L3850, L5184-5190) | | Pre-1.0 only: 1.0's `DEFAULT_MODULES` already used the new key. One identity check (M7r) references it |
| `applyDataBackfills` lines for "pre-v38 exports", "v39/v40 additive" (L5143-5157) | | Pre-1.0 only |

**Data-safety care.**
- No real user can still hold a pre-1.0 book unless Ian kept a pre-1.0 export file. Ian is the only user of the
  prototype (memory: awaiting approval).
- The safe form is not deletion alone. It is to **refuse import below schema 11 with a clear message**, after Ian
  confirms he holds no pre-1.0 exports. Refusing is safer than misreading.
- The v11 → v15 steps must stay: 12 → 13 is the identity migration, and 13 → 15 is the graduation plan.

### Coverage gap in the demo

The demo book exercises 0 stakeholders, blockers, commitments, goals or handoffs (RAN). So the "it renders" proof
for Coordination, Handoff and Goals rests on suite fixtures, not on the demo.

## 4. What the end-state integration makes redundant

The end state: pull Gong transcripts and summaries aligned to call sessions; push the tracker's admin items into
Gainsight; pull account info from Gainsight.

| Today's feature | Size | Integration replacement | Verdict |
|---|---|---|---|
| Gainsight to-do (activity checklists, 3 per Call) + queue + Copy for Gainsight + batch text + CTA text + "Mark done" | 274 lines, 11 checks, DATA.gainsightQueue, activity.checklist | The push itself. The walk estimated 90 min/week of keying (ESTIMATE, app constant) and measured 3.8 min/week of mark-done (MEASURED, walk) | Replace. Keep **one** outbound-item model as the push payload (merge O10) |
| Gainsight API key settings + `syncGainsightQueue` seam | about 40 lines | Server-side auth. A browser cannot call Gainsight (the comment at L1749 says so) | Remove now: it stores a secret for nothing |
| Excel import, value CSV import, partner-notes import | 666 lines, 9 checks | Pulling account info (tier, ARR, renewal, contacts) from Gainsight | Keep until the pull exists, then retire 2 of the 3. Partner notes may have no Gainsight source |
| Manual tier, ARR, renewal, gainsightId, primaryContact; Add-customer modal (176 lines) | | Gainsight pull | Shrink to a picker after the pull exists |
| Coordination: manual stakeholder entry | 147 lines, 3 checks, unused in the demo | Gainsight People and relationships | Stakeholders become read-only pulled data. Blockers and commitments overlap Gainsight CTAs and tasks and open threads |
| Plays (5 playbooks with due-day steps) | 171 lines, 8 checks | Gainsight CTA playbooks are the native home for this | Strong candidate to retire once CTAs are pushed |
| Risk triage verdict memory + At-Risk CTA drafts | part of 748 lines | A Gainsight At-Risk CTA's own status | Keep detection; drop the second verdict store when CTA status comes back |
| Manual activity logging: Quick log, Log tab, backfill, wrap-up | about 360 lines | Gong calls arrive as sessions | Keep a thin manual path for email and non-Gong touches. The walk's G06 trap (an email becoming a "held" session) is the integration's matching problem |
| Session Debrief / transcript paste / readTranscriptFile / score extraction / call review | 453 lines, part of 23 AI checks | Gong transcripts and summaries | Transcript intake becomes redundant. Whether the tracker's own extraction (open threads, score proposals) survives depends on what Gong's summary already gives |
| Browser-side AI (7 live call sites, keys in localStorage, raw transcripts sent unredacted; walk G01) | about 1,000 lines | Any sanctioned AI would run server-side beside the integration | Freeze; do not extend. Its fate is a policy decision (G01) |
| Time-saved accounting | 216 lines + 17 call sites, 8 checks, 3 fields | The integration removes the very tasks it counts (e.g. `gainsight_copy` at 3 min) | Retire. It measures assumptions, not time (see §5) |
| Workiva knowledge search scaffold | about 75 lines | Unrelated to the end state | Remove |

## 5. Ranked candidates

### Trim now (safe)

These need no design talk. Each one is reversible from git, and none of them touches stored-data shape.

| # | What | Evidence | Why | Risk | Effort |
|---|---|---|---|---|---|
| T1 | Delete the 12 unreachable functions (195 lines). Fix the false comment at L23578. Delete or adjust the suite checks that use them only as helpers. Move `icsUnfold` into the suite | §3 table; RAN transitive call graph | Dead code with a comment that says otherwise is how false claims travel (the walk counted the dead AI site) | None for data. About 4 checks need editing | S |
| T2 | Remove the Gainsight "future use" settings block and API-key storage, and the Workiva KB scaffold plus its token | L1747-1773, L1866-1981, L26153-26170, L19237 | Stores secrets for features that cannot work from a browser. The integration will define its own auth | Leave the LS keys orphaned, or clear them once. Book untouched | S |
| T3 | Signal calibration: drop the dead renderer and getter, and stop writing `recommendationLog` (or keep the writes if Ian wants the data later) | L7903-8014, L7802-7805 | Write-only data and a parked UI. 92 lines | The field already in books is harmless: prepareBookData does not whitelist keys | S |
| T4 | Pre-1.0 legacy: `OLD_GUESSED_OUTCOME_NAMES` swap, `LEGACY_TEMPLATE_KEYS`, pre-v38 backfills, migration steps v0→v11 → replace with "schema < 11: refuse with a message" | L4734-4941 (208 lines, 11 KB), L5143-5190 | Serves only books from dev builds older than 1.0 | **Needs Ian's yes that no pre-1.0 export matters.** Rewrite the 1 M7r check | S-M |
| T5 | Fold `ADMIN_GAP_DEFS` and the hardcoded compliance block in `pendingGainsightItems` onto `GATE_DEFS` (one list, with the two gradDate tests kept as named predicates) | L5838, L7282, L8167-8205 | 3 lists, 1 concept. Labels already drift | No data change; render text may shift. 5 checks | S |

### Consolidate (needs a design talk; most should wait for the integration design)

| # | What | Evidence | Why | Risk | Effort | Wait for integration? |
|---|---|---|---|---|---|---|
| C1 | **Move the self-check suite out of the shipped file** into a dev-only script that `tools/selfcheck.mjs` injects | L8274-16814, 547 KB = 30.6% | Users download and parse 547 KB of tests. Top-level `function` and `const` names are global, so a second classic script can reach them | Changes header rule 5 ("run window.runSelfChecks() in the console"), the README and VALIDATION, and the guide's habit. Zero data risk | M | No: do it first, it makes every later trim reviewable |
| C2 | **One outcome model.** Make goals plus gates the single "what and did we get there". Subordinate outcome criteria as the goal's evidence (already printed that way in the packet). Demote `outcomePlan.planText`, `firstValue.definition` and `promisedOutcomes` to read-only hints (goalHintText already treats them so). Keep `outcomeNumber` only as the Gainsight outcome tag | O1, O2; 518 + 292 + 56 + 163 lines; 34 + 44 + 11 + 5 checks | Five places to type one idea. The Overview shows two verdict models | **High data care:** evidence and outcomeEvidence ids, the v12/v13 migrations. Needs a schema step | L | Partly: outcomeNumber and outcomePlan map to Gainsight success-plan fields (walk G15) |
| C3 | **One risk registry.** Have `buildRiskHubList` consume SIGNAL_DEFS plus implementation risks instead of re-deriving. Merge the 3 keyword classifiers into one configurable list with categories. Fix "champion left" while there | O4; L19003-19071, L7352, L18763, L5732 | Rule 3 is violated by the hub. Three classifiers drift independently, and one is already wrong (G11) | Risk tab behaviour and riskLog keys change. 19 + 20 checks | M | Partly: the At-Risk CTA push defines what a risk item must carry |
| C4 | **One dismissal memory**: signalSuppressions, riskLog verdicts and onboard gaps → one per-account "snooze or dismiss" record | O5 | 4 stores and 2 dismiss modals for one idea | Migration of the riskLog verdict | M | Yes: Gainsight CTA status may become the record |
| C5 | **Copilot tab vs Today.** Fold the per-account parts of Copilot (needsAttention, `accountNextAction` routing) into Today and the panel. Keep portfolio patterns only if a manager view is wanted. Decide on the deco layer (card deck, band, telemetry, glideslope, scramble) | about 1,400 lines across L17790-18098, L19272-19957, L5716; 15 deco checks | An OSM with 25-40 accounts gets the same "needs you" list on two tabs. The decoration is about 516 lines of functions plus CSS | Look call, so **Ian's call** (taste, not mine) | M-L | No |
| C6 | **Retire time-saved accounting** (DATA.impact, impactLog, impactMinutes, 17 `trackImpact` sites, the report and CSV) or replace it with the timed pilot the field test recommended | O11; 216 lines, 8 checks | Count × assumed minutes presented as a report. The integration deletes the tasks it counts | Remove 3 fields (a schema step, or leave them inert). The progress report references it | S-M | No |
| C7 | **Gainsight-bound features**: plays, coordination (blockers and commitments), the risk verdict store, the 3 import paths and the Gainsight to-do list collapse into "push items / pull account" | §4 | Gainsight already models CTAs, playbooks, people and timeline | Each carries stored data (c.playbooks, c.stakeholders, c.blockers, c.commitments) | L | **Yes** |
| C8 | **AI layer**: freeze; do not extend. After the policy ruling (G01) and Gong, either delete browser-side calls or move them behind the integration's server | about 1,000 lines, 7 live sites | Keys and raw transcripts leave from the browser. Gong supplies summaries | None for data (settings live outside the book) | M | **Yes** |
| C9 | Split `attachEvents` (1,582 lines) per feature, so that trimming a feature removes its handlers in the same commit | L23463-25044 | Today every trim has to dig through one 1,582-line function. Without the split, trims leave orphaned handlers behind | Behaviour-neutral refactor | M | No, but only alongside C2-C7, not on its own |
| C10 | Graduation check-back (gradReview): keep only if the OSM, not the CSM, owns the account 30 days after hand-over. Otherwise drop it | L3308-3371, 62 lines, 6 checks; its only roll-up is dead | Ownership question | c.gradReview stays inert | S | No (a team-process question) |

### Keep (load-bearing)

- **Today** as the day's single surface. It is the OSM's week: 8-12 calls and 25-40 accounts.
- **SIGNAL_DEFS** as the single registry (18 entries; 10 fire on the demo).
- **The graduation plan** (goals, gates, exit, confirm) and **the CSM packet** (One Document). These are the newest
  work and the walk's top gaps G02-G05.
- **Curriculum identity** (stable session and deliverable ids, schema 13). It is what Gong-to-session alignment will
  key on.
- **The load, migrate, repair and validate pipeline** (1,178 lines) for v11 and later.
- **Backup and export** (139 lines; round trip SHA-identical per walk, RAN 2026-09-30).
- **Undo** (28 lines).
- **The curriculum and runbook content** (68 KB of data, not logic).
- **Open threads**: one model, consumed widely, and the natural landing place for Gong-extracted questions.
- **ICS export** (77 lines, cheap).
- **The Accounts lenses** (212 lines; cheap enough not to fight over).
- **Comments and `vNN` provenance** (19%). The README treats them as the record. They are not a trim target, only a
  candidate for stripping in a build step if one is ever added.

## Calibration notes

- **Feature size.** This is the line span of top-level functions plus the named section. It excludes CSS and the
  handlers in `attachEvents`, so real per-feature cost is higher than stated.
- **Self-check attribution.** This is a proxy: setup text that references a feature's functions. A check can count
  toward more than one feature.
- **Usage.** No real usage data exists. "Unused" here means the demo book does not exercise it, which is not the
  same as OSMs not using it. That is why C5-C7 ask for a design talk rather than asserting.
- **The demo book.** Its 17 accounts are not the 25-40 an OSM carries. The render time (24.6 ms) and book bytes
  (87.5 KB) scale with it, and were not measured at 40.
- **Correction to the 2026-09-30 lifecycle walk (READ there, RAN here).** It lists 8 AI call sites, including the
  "portfolio brief" sending pseudonyms. That builder (`generatePortfolioAiBrief`) has no caller, so **7** sites are
  live.
