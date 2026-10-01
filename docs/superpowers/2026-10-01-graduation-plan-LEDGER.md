# Graduation Plan (goals → gates → One Document) — ledger

Spec: `specs/2026-10-01-graduation-plan-design.md` (approved by Ian 2026-10-01; rulings R1-R12 in §1).
Plan: `plans/2026-10-01-graduation-plan.md`. Run prompt: `sessions/graduation-plan-run.md`.
Branch: `graduation-plan` (worktree `.claude/worktrees/graduation-plan`, from `master` at `e780666`).
Paid runs approved: none ($0).

## Baseline (measured 2026-10-01 by the run lead at `e780666`)

- Suite `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 389`:
  **389/389** passed, 0 failed, exit 0.

## Tasks

| # | Task | State | Commit | Check command | Measured result (lead re-run) | Deviation from spec (reason) |
|---|---|---|---|---|---|---|
| 1 | Schema 14 and data | **done, checked** (checker: pass with notes, no blockers) | `f99a948` | suite `--expect 396`; `node tools/migration-dryrun.mjs osm-book-of-business-tracker-1.0.html --from 13` | **396/396**, exit 0; dry-run exit 0 (A2 below). Evidence `evidence/graduation-plan-task1.md` | M1 `c.graduation` added (Ian's ruling). Backfill normalise sits in `repairAuxiliaryCollections` at the `gradReview` site, the same location the plan meant. Historic CHANGELOG "389" line left as history. |
| 2 | Goal panel | **done, checked** (checker on `bd153b0`: pass with notes, 1 should-fix: blur re-render swallowed the next click. Fixed in `c2d80a4`; checker on the fix: pass with notes) | `bd153b0` + fix `c2d80a4` | suite `--expect 403` | **401/401** at `bd153b0`; **403/403** at `c2d80a4`, exit 0. Evidence `evidence/graduation-plan-task2.md`, `-task2-fix.md` | `handoffMeetingOn` placed before `intakeNotes` so "Anything else" stays last. Gate rename/remove inline, not prompts. Click wiring, Go-Live hook and `toggle` listener verified by reading only; no click harness, so task 7 covers it. Open note for the final review: checkbox `aria-label` stale after a rename until the next render. |
| 3 | Goal change | **done, checked** (checker: pass with notes; 1 should-fix: README:74 and VALIDATION:47 read "407/403" from a bad find-replace, confirmed by lead grep, fixed in task 4's commit) | `18732ef` | suite `--expect 407` | **407/407**, exit 0. Evidence `evidence/graduation-plan-task3.md` | c3b gained an undone-account case, because the plan's own mutation left it green. `goal_changed`: severity 2, before `late_gate`, `EFFORT_MIN` 5, panel tab overview. Open for task 7: no check asserts that `goal_changed` headlines on Today (`getRecommendedAction`); `accountStateSignalBasis` has no entry for it (falls back, harmless). |
| 4 | Graduation confirm | **done, checked** (checker on `de1eebc`: pass with notes, 1 should-fix: tally labels and bars still used the raw planned total, so early exit read 5/6; fixed in `93e60a6`; checker on the fix: pass with notes) | `de1eebc` + fix `93e60a6` | suite `--expect 417` | **415/415** at `de1eebc`; **417/417** at `93e60a6`, exit 0. Evidence `evidence/graduation-plan-task4.md`, `-task4-fix.md` | M1 marker in `applyGraduation`. `applyGraduation` validates before it creates an inline goal. The plan-time implementation exemption was removed to match spec §4.4's literal "any planned session unheld" (lead's call: the spec is unambiguous). `nextOpenSessionNumber` skips not-needed sessions, identical for accounts with no exit. The Excel import bypasses the confirm (P1, approved), so an imported graduation has no `c.graduation` marker. The packet build pruning `DATA.riskLog` is pre-existing on master. **Open for the final fix round:** `late_gate`/`no_value_evidence` display raw "N/8 sessions" for graduated early-exit accounts if rendered; duplicate `// c4i` comment on the c4f check (~16220); "(of N planned)" log-form label raw (note). |
| 5 | One Document | **done, checked** (checker: pass with notes, no blockers) | `1cdf7f1` | suite `--expect 422` | **422/422**, exit 0. Packet length on `demo-seed.js`: before 691 / median 1,281 / max 1,529, after 730 / 1,320 / 1,568 (+39 each, builder-measured). On `demo-seed-today.js` after: 730 / 1,320 / **1,751** (checker-measured). Evidence `evidence/graduation-plan-task5.md` | The early-exit line also prints the exit date (an addition). **Correction to spec §8:** the 691-1,714 range mixes seeds. 1,714 matches `demo-seed-today.js` (1,751 - 39 = 1,712, derived, not measured on pre-change HTML); `demo-seed.js` max is 1,529. VALIDATION.txt should name the seed (final fix round). Note: "because ." is possible only if the change reason can be empty (`changePrimaryGoal` requires it, per task 3). |
| 6 | Gainsight items and Settings | **done, checked** (checker on `d4c9bac`: FAIL, 1 should-fix: graduation with an inline goal saved twice and overwrote the undo snapshot; fixed in `c975f90`. Checker on the fix: code sound, FAIL on docs only: README:74 and VALIDATION:47 still 425/425, VALIDATION has no fix entry; handed to task 7's count sweep) | `d4c9bac` + fix `c975f90` | suite `--expect 427` | **425/425** at `d4c9bac`; **427/427** at `c975f90`, exit 0. Evidence `evidence/graduation-plan-task6.md`, `-task6-fix.md` | Verdict items add " — verdict: <label>" (per plan). New `confirmGraduation` (one undo step, one save); `commitGoalEvent`/`queueGainsightItem` take `opts.defer`. Add account queues inside the `commitDataCandidate` persist (one save, matches master's undo). `goalGates` is now also normalised in `repairAuxiliaryCollections`. Notes: the Add-account path has no in-page check; c6b is a source-text count; `confirmGraduation` ignores the `saveData` return, as the old code did. |
| 7 | Scenario seed and docs | **done, checked** (checker: pass with notes, no blockers) | `35352b1` | suite `--expect 427`; `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js,tools/graduation-scenarios-seed.js --fn runGraduationScenarios --verbose --expect 6` | **427/427**, exit 0; scenarios **6/6**, exit 0 (lead re-run). Evidence `evidence/graduation-plan-task7.md`, `-task7-scenarios.log` | `selfcheck.mjs`: comma-separated `--seed`, `--fn` checked after seeding, `--verbose` (passing details capped at 1,000 chars, not 300, so A4/A6 values aren't cut). Count sweep done: current counts 427 in README, VALIDATION and CHANGELOG; VALIDATION's repro `--expect 369` fixed. Notes: A3's signal half holds mostly because migrated accounts have no goals (as the spec intends); A6's expected string uses the code's date formatter. |

## Acceptance checks (measured values, not "passes")

| Id | Expected | Measured | Where |
|---|---|---|---|
| A1 | 389 + new checks, 0 failed | **427/427**, 0 failed (389 + 38 new) at `35352b1`; **436/436**, 0 failed after the review fixes (389 + 47 new) | lead re-run at `35352b1` and `2b816fd` |
| A2 | all accounts `goals:[]`, `exit:null`; 5 default modules in `config.goalGates` | v13 seed, 7 accounts: `goals:[]` 7/7, `exit:null` 7/7, `graduation:null` 7/7; default modules 5/5 (+2 CSRD, +1 other); Sustainability gates 5/5/3/3; FR 0/0/0/0; GRC 0/0/0/0; invented exits 0; second pass idempotent; 0 console errors | lead re-run at `f99a948` |
| A3 | 0 Today rows from `goal_changed` + `ready_to_graduate` after migration | rows=0, detect=0, out of 15 Today rows on 17 accounts; `goals:[]` 17/17, `exit:null` 17/17, schema 14 | scenario run, lead re-run at `35352b1` |
| A4 | Scenario A: `ready_to_graduate` fires | fired=true (gates 5/5, sessions 8/8). **Headline:** `late_gate` while the account's 3 Gainsight compliance gates are open; `ready_to_graduate` ("Record the goal verdict and graduate") once they are closed, with a Today row | same |
| A5 | Scenario B: exit reason, held of held, packet shows reason | via `confirmGraduation`: exit.reason=goal_met_early, week 7, 1 unheld, tally `5/5`; packet "Early exit: Goal met early (Oct 1, 2026). Sessions marked not needed: Session 6 — First Draft Report Review" | same |
| A6 | Scenario C: change line in packet; `goal_changed` until acknowledged | packet "Changed Oct 1, 2026: Publish FY2026 report → Ready for next year's reporting cycle, because Report moved to consultants; customer owns next cycle."; fires before ack (true), not after (false); headline before = `goal_changed` with a Today row, after = `next_session` | same |
| A7 | FR account: goal, verdict, graduate; packet "0 gates" | gates=0 (the shipped FR default), `confirmGraduation`=true, stage graduated, verdict partly; packet "Gates: 0 gates" | same |
| A8 | met + open gates: confirm asks note, does not block | asked=true, blocked=false; with no note `{ok:false, missing:[note], notePrompt:"Met with 2 open gates (…). Say why that is acceptable."}` (a note is always required, §4.4); with a note ok=true and the confirm succeeds | same |

## Final review (top model, `e780666..cb6cf8d`)

Report: `evidence/graduation-plan-final-review.md`. Verdict: **ready to merge with fixes**, with 2 Important issues and 13 Minor.

| Round | Findings | Commit | Checker | Lead re-run |
|---|---|---|---|---|
| F1 | I1: an exit record survived re-opening and was never rewritten on re-graduation. I2: "Change goal" was offered on graduated accounts | `aad7c8b` | pass with notes | 431/431, scenarios 6/6 |
| F2 | Minor 1-5, 11, 13 + stale gate `aria-label` | `6bb0a54` | pass with notes | 436/436, scenarios 6/6 |
| F3 | Minor 6-10 (docs, SHA-256 re-measure, spec §5/§8 correction notes) | `2b816fd` | pass with notes | 436/436, scenarios 6/6; tracker SHA-256 `3dab70bb…c713`, 1,751,637 bytes |

**Listed, not fixed:** Minor 12. c4e and c6b count source text; behavioural coverage comes from c6d and the A5/A7 scenarios.
**Lead decision for Ian to confirm or overrule (I1):** when an account leaves Graduated, its stored `c.exit` and `c.graduation`
are **kept, not deleted**. They take effect only while the stage is graduated (`getExit`/`getGraduation`), and every graduation
rewrites both. The alternative is to clear both when an account is re-opened.
**Other notes carried:**
- The Excel import bypasses the confirm (P1).
- The click guard on "Change goal" and the Settings DOM have no headless check.
- `confirmGraduation` ignores the `saveData` return, as the old code did.
- The F3 evidence note says the "same counts" phrase doesn't exist. It does, at spec lines 281-282, split across a line break. The correction notes cover it.

## Look calls for Ian (batched)

Not captured by the run: no screenshots were loaded into context, and none were posted. Views to capture for Ian, from the
evidence notes:
1. Account Overview with a primary goal: gate checklist, "N of M evidenced" tally, secondary goals collapsed (task 2).
2. Account Overview with no goal: the "No goal yet" banner and the "from earlier notes" hint (task 2).
3. The goal form modal, in create mode and in change mode with "Why did the goal change?" (tasks 2-3).
4. The Handoff tab's hand-off meeting date field (task 2).
5. The graduation confirm: verdict + note, the "met with open gates" note prompt, the early-exit reason, and the no-goal
   options (task 4).
6. Settings (gear) → "Graduation gates (default checklist per goal type)", open, showing FR and GRC empty beside a populated
   module (task 6).

## Log

- 2026-10-01: baseline measured; worktree created; plan written (`8e19294`, top model; 7 tasks, steps 8/8/7/8/6/6/7, estimated suite 389→417). Plan-level choices P1-P6 plus one open question (no-goal graduation vs historic graduation marker). Stopped for Ian's plan approval.
- 2026-10-01: **Ian approved the plan** ("Approve as written", P1-P6 included). **Ruling M1 (no-goal marker):** Ian chose "Store a marker": the confirm writes a small graduation record (e.g. `c.graduation = {on, noGoal:true}`), so the packet says "No goal recorded" plainly, as §4.4 wants. This adds one field to schema 14. Plan amended for it before build 1.
- 2026-10-01: tasks 1-7 built and checked; A1-A8 measured (table above). Next: final whole-branch review on the top model.
- 2026-10-01: final review fixes F1-F3 built and checked; final verification at `2b816fd`: suite 436/436, scenarios 6/6, A2 dry-run exit 0. **Stopped for Ian's merge call** (branch `graduation-plan`).
- 2026-10-01: **Merged to `master`** on Ian's instruction ("1 merge"), fast-forward to `d5b9526`. The lead re-ran the suite on master: 436/436, exit 0.
- 2026-10-01: **Ruling M2 (exit record on re-opening), Ian:** "keep the default", then "do as you recommend for the exit-record default". When an account leaves Graduated, its stored `c.exit` and `c.graduation` are kept, not deleted. They take effect only while the account is graduated (`getExit`/`getGraduation`), and every graduation rewrites both. This is the F1 behaviour, now ruled.
- 2026-10-01: **Look calls filed** for Ian: https://claude.ai/artifact/Es5AXtihiTpPdg5r7YwCjG. It holds 8 headless captures of the 6 views, taken from `master` at `d5b9526`. Each has a DOM check and a sha256 fingerprint (all matched); none was viewed by the lead. Awaiting Ian's calls.
- 2026-10-01: **FR/GRC gate draft** requested by Ian. See `drafts/2026-10-01-fr-grc-gates-DRAFT.md`. The shipped FR and GRC defaults stay empty until he approves (R10).
- 2026-10-01: **FR/GRC gates approved for now** by Ian ("approved for now. I want this to still be editable after I meet with them"). They are entered per book in Settings → Graduation gates (`config.goalGates`, carried in backups). Shipped defaults stay empty (R10) until the content is final after the FR OSM meeting. Page: https://claude.ai/artifact/KKUi5AVkEnJ96KYxkpgERy
