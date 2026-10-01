# Graduation Plan: goals → gates → One Document (design), 2026-10-01

Step 3 of 4 of the OSM lifecycle thread. Approved by Ian section by section in the design talk on 2026-10-01
(session prompt `docs/superpowers/sessions/graduation-plan-design-talk.md`). Input: the gap list
`docs/superpowers/evidence/2026-09-30-lifecycle-walk.md` (gap ids G01-G24 below refer to it).

## 0. Inputs and what they settled

- **Ian's internal documents** (`docs/research/internal/`) were **still missing** on 2026-10-01. No gap marked
  "Settled by Ian's docs? yes" was settled by a document. Every such question was put to Ian directly in the talk,
  and his answers are recorded below as rulings.
- **Correction to the gap list (G04).** The gap list cites "3 default outcome labels" for program readiness at
  L4822-4826. A read on 2026-10-01 (tracker at `828e354`) found that region holds `OLD_GUESSED_OUTCOME_NAMES`, a
  legacy list used by a backfill, not live readiness labels. G04 stands, and is stronger for it: readiness exists
  only as curriculum deliverable text.
- **CSRD timing.** Ian confirmed that all four goal kinds occur at hand-off (§2). He did not say how often
  "publish this year's CSRD report" occurs. The Omnibus timing in the gap list (first EU reports FY2027, published
  2028) remains **one fetched law-firm summary at agreement stage plus snippets, NOT CONFIRMED as final law**. The
  design does not depend on it: the report year is a free-text attribute of a goal, not a rule.

## 1. Rulings from the talk (Ian, 2026-10-01)

| # | Question | Ruling |
|---|---|---|
| R1 | Spine: hand-off goal or report year? | **Goal spine.** The goal is the top object; the report cycle is an attribute of it. |
| R2 | Goal kinds at hand-off | All four occur: publish this cycle's report, set up for next cycle, data collection/program only, framework disclosure (CDP etc.). |
| R3 | Goals per account | **One primary + optional secondary.** Only the primary decides graduation. |
| R4 | Graduation evidence | A **fusion**: OSM verdict + note decides, informed by readiness gates per goal type (artefact as the final gate where there is one) and customer-demonstrated deliverables (existing outcome criteria). Ian's words: "we don't have any sophisticated documented SOPs for this, we rely mostly on OSM judgement and note right now." "Set up for next year" is a full pass when judged met. |
| R5 | Early exit | Record **exit reason + primary goal verdict**; unheld sessions become "not needed". |
| R6 | Goal change | **Supersede, keep history**; the old goal closes as "replaced" with a reason; Today flags it once. |
| R7 | What the partner hands over | **A hand-off meeting, nothing formal.** |
| R8 | Gainsight records the OSM keeps current | Success Plan/Objectives, CTAs, Timeline entries, plus risks, estimated graduation date, CSAT contacts, sentiment check. |
| R9 | What the One Document leads with | **Goal verdicts first.** |
| R10 | Shared curriculum | **Per book now, share later** (G17 deferred). The tracker must serve Financial Reporting and GRC OSMs with their own curricula; Ian is finalising FR content with FR OSMs and has not yet worked out GRC. |
| R11 | Approach | **A: a new `c.goals` record** (not stretching existing structures, not a goal-driven curriculum). |
| R12 | Sustainability default gates | **Adopted as shown** in §3.3. |

Not designed here, left to Ian and step 4: the AI/data policy (G01). Nothing in this design sends data anywhere.
Ian also floated using the Claude browser extension to gather Workiva documentation for FR/GRC curriculum
content. That is a content task outside this build, and it touches the same policy question.

## 2. The spine (R1) and why

Goal → readiness gates (+ the account's outcome criteria) → OSM verdict → One Document.

Why the goal and not the report year:
- Two of the four goal kinds (program/data only, disclosure) have no report at all.
- C's case (goal moved from "Publish FY2026" to "ready for next year") is a goal change with history under a goal
  spine; under a report-year spine it would change the plan's identity.
- FR and GRC goals (a filing, a SOX/controls program) fit the same four kinds without a sustainability report
  cycle.

## 3. Data model (schema 13 → 14)

### 3.1 Per account

```
c.goals = [{
  id: 'gl_xxxxxxxx',
  type: 'publish' | 'setup_next' | 'program' | 'disclosure',
  text: string (≤300),
  targetCycle: string (free text, e.g. 'FY2026', may be ''),
  primary: boolean,               // exactly one goal with primary:true and verdict !== 'replaced'
  source: 'handoff' | 'osm',
  createdOn: ISO date,
  gates: [{ id: 'gt_xxxxxxxx', text: string (≤200), done: boolean, on: ISO|null, note: string (≤300) }],
  verdict: null | 'met' | 'partly' | 'not_met' | 'replaced',
  verdictOn: ISO|null,
  verdictNote: string (≤500),
  supersededBy: 'gl_…' | null,
  changeReason: string (≤300),
  ackOn: ISO|null                 // set when the OSM confirms the target date after a goal change
}]

c.exit = null | {
  on: ISO, reason: 'goal_met_early' | 'no_more_enablement' | 'paused_or_risk' | 'other',
  note: string (≤500), sessionsNotNeeded: [session ids]
}
```

UI labels for `type`, worded to fit Sustainability, FR and GRC: "Publish this cycle's report/filing", "Set up for
next cycle", "Program / data only", "Disclosure submission".

**Criteria link (kept simple).** The primary goal covers **all** of the account's outcome criteria, shown as
"N of M evidenced" from the existing `outcomeCriteriaFor(c)` and `c.outcomeEvidence`. No list of criterion ids is
stored, because criteria are derived until their first evidence write, and stored links would fight that.
Secondary goals carry gates and a verdict only.

**Reuse.**
- `compliance.outcomePlan.planText` is filled from the primary goal's text **only when it is empty**. The gate
  and its `outcomeNumber` keep their current meaning.
- `gradReview` keeps its meaning (the check 30 days after graduation). It is not the goal verdict.
- `handoffIn` gains one optional field, `handoffMeetingOn` (date), added to `HANDOFF_IN_FIELDS` using the
  existing registry pattern. There is no new partner form (R7).

### 3.2 Per book

```
config.goalGates = { <module key>: { publish: [text], setup_next: [text], program: [text], disclosure: [text] } }
```

Keyed by the same module keys as `config.sessionTemplates` (`DEFAULT_MODULES`: Sustainability, Carbon,
Sustainability + Carbon, Financial Reporting, GRC; plus any CSRD-variant keys present). Gates are **copied** into
a goal when it is created. Editing the defaults later never rewrites existing goals.

### 3.3 Default gates (R12, adopted as shown)

Sustainability, Carbon, Sustainability + Carbon and their CSRD variants share one set. The wording reuses terms
the tracker's curriculum already uses ("Factbook", "data collection tasks", "reporting output"), so no new
external term is adopted.

| Type | Default gates |
|---|---|
| publish | Metrics mapped to target frameworks · Data collection tasks sent and returned · Factbook connected to the report via a live link · Report reviewed by the customer · Report published or filed |
| setup_next | Metrics mapped to target frameworks · Data collection tasks sent · Factbook connected to at least one reporting output · Next reporting cycle plan established · Roll-forward walked through with the customer |
| program | Topics and metrics configured · Data collection tasks sent and returned · Factbook connected |
| disclosure | Metrics mapped to the disclosure framework · Responses drafted in Workiva · Submission made |

**Financial Reporting and GRC: empty lists** until Ian supplies content (R10). Goals on those accounts still
work, because the verdict rests on OSM judgement plus criteria evidence (R4).

### 3.4 Migration v13 → v14

Follows the existing chain in `migrateData` (`if(v === 13){…; v = 14}`) and bumps `CURRENT_SCHEMA_VERSION` to 14.
- Every customer gets `goals: []` and `exit: null` if absent.
- `config.goalGates` is filled with the §3.3 defaults where absent, and a missing module key gets an empty object
  for each type.
- **No goal is guessed from free text.** Existing accounts show "No goal yet" with a starting-point hint (§4.1).
- Historic graduations get no `exit` record. The packet says "graduated before goal tracking" rather than
  inventing one.
- Normalisers (in the same style as `normalizeGradReview`) clamp text lengths, drop unknown enum values to
  `null`, and repair "more than one live primary" by keeping the earliest.

## 4. Flows

### 4.1 Capture (G02, G14 in part)

- **Entry points:** a "No goal yet" banner in the account panel for any non-graduated account without a live
  primary goal; the new-account form; and the moment partner mode (`c.implementation`) reaches Go-Live.
- **Form fields:** type, goal text, target cycle, source (hand-off/OSM), and optionally the hand-off meeting date
  (stored in `handoffIn.values.handoffMeetingOn`).
- **Hint:** the form shows the first non-empty of `handoffIn.promisedOutcomes`, `firstValue.definition` and
  `compliance.outcomePlan.planText` as a "from earlier notes" hint the OSM can copy. It is never auto-filled.
- **Gates:** copied from `config.goalGates[c.module][type]` when the goal is created. Per account, a gate can be
  added, renamed or removed.

### 4.2 Working the plan (G03, G04)

The panel shows the primary goal with:
- its gate checklist (ticking a gate stamps `on` with today's date; the note is optional);
- the criteria tally ("N of M evidenced");
- secondary goals collapsed beneath.

Gate and goal edits follow the tracker's existing save/undo conventions.

### 4.3 Goal change (G16)

- **"Change goal":** requires a `changeReason`. The old primary gets `verdict:'replaced'`, `verdictOn` and
  `supersededBy`, and `primary` becomes false. The new goal becomes primary, with gates seeded fresh from defaults.
  Gates that were done and whose text exactly matches a new gate carry their `done/on/note` across.
- **New signal `goal_changed`:** fires while the live primary was created by a change and `ackOn` is null. It
  clears when the OSM clicks "Target date checked", which sets `ackOn`. **No time threshold.**

### 4.4 Graduation and early exit (G13, G18)

- **New signal `ready_to_graduate`:** fires when all of these hold:
  - the stage is not graduated and the account is not in implementation;
  - a target graduation date is set;
  - the primary goal has (≥1 gate and all gates done) **or** `verdict === 'met'`.

  Severity sits beside `ready_to_set_date` (1), in the same `grad_ready` group. **No numeric threshold.**
- **Graduation confirm:** moving the stage to "graduated" (`changeStage(c,'graduated')`, every path that calls
  it) opens a confirm. It requires the primary goal's verdict (`met | partly | not_met`) and a note.
  - If the verdict is `met` while gates are open, the note prompt asks why the open gates are acceptable. This is
    a prompt, never a block (R4).
  - With no live primary goal, the confirm offers to create one inline, or to graduate with "no goal recorded",
    which the packet shows plainly.
- **Early exit:** if any planned session is unheld at the confirm, the confirm also requires `exit.reason` (and a
  note for `other`) and stores the unheld session ids in `exit.sessionsNotNeeded`. Pace, health and the session
  tally count those sessions as resolved, so B reads 5 of 5, not 5 of 6. The 6-to-12 planned-session floor is
  unchanged.

### 4.5 Gainsight (G15 in part)

Creating a goal, changing a goal, and recording a verdict each queue **one** item in the existing Gainsight to-do
queue ("Update Success Plan objective: <goal text>"). There is no transport; G07 stays open.

### 4.6 Settings

A "Graduation gates" block in Settings shows one textarea per module and type (one gate per line). This is how FR
and GRC content will be entered. It edits `config.goalGates` only.

## 5. The One Document (G05)

`buildKnowledgeTransferText(c)` gains a **GOALS** section, placed **first**, directly after the header and draft
notice (R9). It contains:

1. **Primary goal:** type label, text, target cycle, verdict + date + note; gates "D of T done", with the open
   gates named; criteria "N of M evidenced".
2. **Goal changes,** one line each: "Changed <date>: <old> → <new>, because <reason>."
3. **Early exit,** if any: reason, note, and the sessions marked not needed. For a historic graduation with no
   exit record: "Graduated before goal tracking."
4. **Secondary goals,** one line each with their verdicts.
5. **The `gradReview` verdict,** if one exists.

All existing sections keep their order after GOALS. `promisedOutcomes` stays under WHAT WAS SOLD, so the sold
promise and the verdict can be read side by side. No length cap is added. The current packets measure 691-1,714
characters (§8).

## 6. Gaps closed and left

| Gap | Closed by | State |
|---|---|---|
| G02 no goal field | §3.1, §4.1 | closed |
| G03 no plan object | §3, §4.2 (goal → gates + criteria; the publish gate supplies the missing publish step) | closed |
| G04 no program-readiness status | §3.3 gates per type | closed for Sustainability; FR/GRC wait for content |
| G05 CSM packet has no goal verdicts | §5 | closed |
| G13 no ready-to-graduate prompt | §4.4 `ready_to_graduate` | closed |
| G14 no partner acceptance record | §3.1 `handoffMeetingOn` + goal `source:'handoff'` | partly; R7 says no formal partner artefact exists to record |
| G15 no success-plan object | §4.5 Gainsight items per goal event | partly; no Success Plan mirror, no transport |
| G16 goal change overwrites | §4.3 | closed |
| G18 early exit unrecorded; 5/6 forever | §4.4 | closed |

**Left for later:**
- G01: AI/data policy, step 4 (Ian).
- G06: log form auto-links to a session.
- G07: Gainsight transport.
- G08: offline call-prep view.
- G09: offline recap template.
- G10: grad-date Gainsight item cannot be cleared.
- G11: champion-loss keywords.
- G12: day-0 `behind_target`.
- G17: shared curriculum / multi-OSM (R10).
- G19: goal-change wording keywords. §4.3's signal covers changes made through the UI, not changes only written
  in notes.
- G20: import overwrites.
- G21: stage auto-advance.
- G22: stakeholder role default.
- G23: reschedule history.
- G24: settings not in backup.
- FR/GRC gate content.

## 7. Build split (each task ≤ 8 steps; each followed by a checker)

1. **Schema 14 and data:**
   - `c.goals`, `c.exit`, `config.goalGates`, normalisers, the v13→v14 migration and the §3.3 defaults;
   - self-checks for migration and normalisers;
   - `node tools/migration-dryrun.mjs` extended to cover `--from 13` (with a v13 seed in the style of
     `tools/legacy-seed-v12.js`).
2. **Goal panel:** "No goal yet" banner and hint, create form (incl. `handoffMeetingOn`), gate checklist, criteria
   tally, secondary goals; `planText` fill-when-empty.
3. **Goal change:** supersede, gate carry-over, the `goal_changed` signal and "Target date checked".
4. **Graduation confirm:** verdict + note, early-exit reason, `sessionsNotNeeded` in pace/health/tally, the
   `ready_to_graduate` signal.
5. **One Document:** the GOALS section in `buildKnowledgeTransferText`.
6. **Gainsight items and Settings:** queue items per goal event; the "Graduation gates" Settings block.
7. **Scenario seed and docs:**
   - a scenario seed under `tools/` for A (on plan), B (early exit, week 7) and C (goal change);
   - a headless re-run asserting the acceptance checks below;
   - README and CHANGELOG updated in the same commit.

### Acceptance checks

| Id | Check | Expected |
|---|---|---|
| A1 | Suite on `demo-seed.js` | 389 baseline + new checks, 0 failed |
| A2 | Migration dry-run from 13 | every account has `goals:[]`, `exit:null`; `config.goalGates` has all 5 default modules |
| A3 | Migrated demo book: Today rows from `goal_changed` + `ready_to_graduate` | **0** (no account has a goal after migration) |
| A4 | Scenario A at 8/8 with gates done and target date set | `ready_to_graduate` fires |
| A5 | Scenario B graduated in week 7 | `exit.reason` recorded; tally reads held of held; packet GOALS shows the reason |
| A6 | Scenario C | packet shows "Changed <date>: Publish FY2026 report → …, because …"; `goal_changed` fires until acknowledged |
| A7 | An FR account (empty gates) | a goal can be created, verdict recorded and graduated; packet shows "0 gates" without error |
| A8 | Graduation with the "met" verdict and open gates | confirm asks for the note and does not block |

## 8. Numbers and their evidence

Probe on 2026-10-01, run read-only by the design session against `osm-book-of-business-tracker-1.0.html` at
`828e354`. It used `tools/selfcheck.mjs` with `demo-seed.js` + a probe tail that replaces `runSelfChecks` (see
the appendix). Scripts and output: `$CLAUDE_JOB_DIR/tmp/` (not committed). `demo-seed-today.js` gave the same
counts.

| Figure | Value | Label |
|---|---|---|
| Self-check baseline | 389/389 | MEASURED (re-run 2026-10-01) |
| Demo accounts | 17: 11 Sustainability, 6 Carbon, 0 FR, 0 GRC | MEASURED |
| Stages | 4 in partner build, 12 live, 1 graduated | MEASURED |
| Accounts with hint text for §4.1 | 12 of 17 have `firstValue.definition` and `outcomePlan.planText`; 0 have `promisedOutcomes` | MEASURED |
| Outcome criteria per account / evidenced | 11 / 0 on every account | MEASURED |
| `ready_to_set_date` firing on live accounts | 0 of 12 | MEASURED |
| Graduated account sessions held | 1 of 8 (the "N of planned forever" symptom of G18) | MEASURED |
| Current CSM packet length | 691-1,714 characters, median 1,281 | MEASURED |
| New Today rows after migration | 0 expected (no goals exist after migration) | ESTIMATE, to be measured as A3 |
| Default gates per type | 5 / 5 / 3 / 3 | content choice (R12), not a threshold |
| New signal thresholds | none: both new signals are state-based, with no day or count threshold | design |
| Sessions per goal, readiness thresholds, minutes saved | not specified; the design needs none | n/a |
| Probe coverage gap | the demo book has no FR/GRC account and no goals; A7 and the scenario seed cover those paths | noted |

### Appendix: probe tail

The probe tail is appended to a copy of `demo-seed.js`. Per customer it records: module; stage; whether the
account is in implementation; planned sessions; sessions held (via `getSessionActivity`); presence of
`promisedOutcomes`, `firstValue.definition` and `outcomePlan.planText`; `outcomeCriteriaFor(c)` length and the
evidenced count; `buildKnowledgeTransferText(c).length`; and which `SIGNAL_DEFS` detect. It returns each row as a
failed check so `selfcheck.mjs` prints it, and ends with `window.runSelfChecks = window.__probe`, because the
harness waits for its function before seeding. Keep each row under the harness's 300-character detail cap.
