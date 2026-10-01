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
| 4 | Graduation confirm | planned | | | | |
| 5 | One Document | planned | | | | |
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
