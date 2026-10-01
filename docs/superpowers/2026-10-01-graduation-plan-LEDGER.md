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
| 6 | Gainsight items and Settings | planned | | | | |
| 7 | Scenario seed and docs | planned | | | | |

## Acceptance checks (measured values, not "passes")

| Id | Expected | Measured | Where |
|---|---|---|---|
| A1 | 389 + new checks, 0 failed | | |
| A2 | all accounts `goals:[]`, `exit:null`; 5 default modules in `config.goalGates` | v13 seed, 7 accounts: `goals:[]` 7/7, `exit:null` 7/7, `graduation:null` 7/7; default modules 5/5 (+2 CSRD, +1 other); Sustainability gates 5/5/3/3; FR 0/0/0/0; GRC 0/0/0/0; invented exits 0; second pass idempotent; 0 console errors | lead re-run at `f99a948` |
| A3 | 0 Today rows from `goal_changed` + `ready_to_graduate` after migration | | |
| A4 | Scenario A: `ready_to_graduate` fires | | |
| A5 | Scenario B: exit reason, held of held, packet shows reason | | |
| A6 | Scenario C: change line in packet; `goal_changed` until acknowledged | | |
| A7 | FR account: goal, verdict, graduate; packet "0 gates" | | |
| A8 | met + open gates: confirm asks note, does not block | | |

## Look calls for Ian (batched)

None filed yet.

## Log

- 2026-10-01: baseline measured; worktree created; plan written (`8e19294`, top model; 7 tasks, steps 8/8/7/8/6/6/7, estimated suite 389→417). Plan-level choices P1-P6 plus one open question (no-goal graduation vs historic graduation marker). Stopped for Ian's plan approval.
- 2026-10-01: **Ian approved the plan** ("Approve as written", P1-P6 included). **Ruling M1 (no-goal marker):** Ian chose "Store a marker": the confirm writes a small graduation record (e.g. `c.graduation = {on, noGoal:true}`), so the packet says "No goal recorded" plainly, as §4.4 wants. This adds one field to schema 14. Plan amended for it before build 1.
