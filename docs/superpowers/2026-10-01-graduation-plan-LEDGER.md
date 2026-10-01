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
| 1 | Schema 14 and data | planned | | | | |
| 2 | Goal panel | planned | | | | |
| 3 | Goal change | planned | | | | |
| 4 | Graduation confirm | planned | | | | |
| 5 | One Document | planned | | | | |
| 6 | Gainsight items and Settings | planned | | | | |
| 7 | Scenario seed and docs | planned | | | | |

## Acceptance checks (measured values, not "passes")

| Id | Expected | Measured | Where |
|---|---|---|---|
| A1 | 389 + new checks, 0 failed | | |
| A2 | all accounts `goals:[]`, `exit:null`; 5 default modules in `config.goalGates` | | |
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
