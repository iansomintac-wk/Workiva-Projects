# Connect-ready (real adapters built ahead of the admin, gated) — ledger

Spec: `specs/2026-10-02-connect-ready-design.md` (rulings CR1-CR6 in §1, defaults D1-D4 in §3.6).
Plan: `plans/2026-10-02-connect-ready.md` (blockers B1-B2, spec gaps 1-8). Run prompt: `sessions/connect-ready-run.md`.
Branch: `worktree-connect-ready` (worktree `.claude/worktrees/connect-ready`, from `master` at `51d1490`).
Paid runs approved: none ($0). No external calls; every vendor call in tests goes to a stubbed fetch.

Wording rule: adapters are "tested on recorded-shape fixtures" and "unproven until `--check`". Nothing here says an
adapter works with Gong or Gainsight.

## Baseline (measured 2026-10-02 by the run lead at `51d1490`, this worktree)

- `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 473`: **473/473**, exit 0.
- `node --test connector/test/*.test.mjs`: **43/43** pass, 0 fail, exit 0.
- `node tools/connector-demo.mjs`: exit 0.
- `node tools/connector-e2e.mjs`, two runs: scenarios **7/7** both times; exit **0**, then exit **1** (uncaught
  `EPERM` from `rmSync` on `%LOCALAPPDATA%\Temp\connector-e2e-chrome-*`). 3 leftover profile dirs afterwards.
  The spec recorded "exit 1 in 2 of 2 runs"; measured here it is intermittent. T-1 still applies.

## Stops

| When | Stop | State |
|---|---|---|
| 2026-10-02 | Plan approval (plan `3682d02`), with B1 and B2 for Ian | Ian, 2026-10-03: "approved, B1 a, B2 a — go" |

## Tasks

| # | Task | Model | State | Commit | Check command | Measured result (lead re-run) | Deviation from spec (reason) |
|---|---|---|---|---|---|---|---|
| T-1 | e2e cleanup reported, not thrown | Sonnet | done | 29fa2ad | `node tools/connector-e2e.mjs` exit 0, two runs in a row | connector 46/46 (+3 e2e-cleanup); e2e 4 runs in a row: exit 0 ×4, 7/7 ×4, no cleanup warnings, no new leftover profiles (lead, 2026-10-03). Checker PASS | rmSync import dropped (unused). Low: harness wiring (removeDir → exit code) proven only by the e2e exit, no unit test |
| T-2 | Proof store, health suffixes, registry, config.example, .gitignore | Sonnet | done | 667c6e2 | `node --test connector/test/*.test.mjs`; demo | connector 52/52 (+6 proof.test); demo exit 0; no forbidden files tracked (lead, 2026-10-03). Checker PASS | server.test t14 unknown-adapter name gong-rest → gong-live (gong-rest now registered; assertion unchanged) |
| T-3 | Tracker status line D2 (UNPROVEN / DRY RUN) | Sonnet | pending | — | selfcheck `--expect 475` (plan estimate: +c2j, c2k) | — | Plan gap 1: parses trailing flags, not the `(unproven)` substring |
| T-4 | Recorded-shape vendor fixtures | Haiku | pending | — | per plan | — | — |
| T-5 | `gong-rest` listCalls | Sonnet | pending | — | per plan | — | Plan gaps 4, 7: accountRef always null; CONTRACT.md Gong section moves here from T-13 |
| T-6 | Gainsight OAuth, callback, rotation persisted before use | top | pending | — | per plan | — | Plan gap 6: token reply field names are config |
| T-7 | `gainsight-rest` reads | Sonnet | pending | — | per plan | — | Plan gaps 2, 3: gates from gateFieldMap (false unless exactly true); openCtas [] |
| T-8 | `gainsight-rest` push, send record, dry-run | Sonnet | pending | — | per plan | — | B1 (a) ruled by Ian: objective items answer failed, stay queued |
| T-9 | Write gate and `--unlock-production` | top | pending | — | per plan | — | Plan gap 5: unlock record tied to tenant; tenant typed back in both paths |
| T-10 | `--check`, `--check --write` | Sonnet | pending | — | per plan | — | B2 (a) ruled by Ian: read-back prints SKIP, proof from create replies |
| T-11 | `--setup` | Sonnet | pending | — | per plan | — | — |
| T-12 | `--measure-transcripts` | Sonnet | pending | — | per plan | — | — |
| T-13 | Runbooks, CONTRACT.md, admin ask | Sonnet | pending | — | per plan | — | — |
| T-14 | Final whole-branch review | top | pending | — | — | — | — |

Plan estimate for connector tests after T-13: 110 (from 43). This is an estimate; each task row records the measured count.

## Acceptance checks

| # | Measured value | Measured by / when |
|---|---|---|
| A-1 | — | — |
| A-2 | — | — |
| A-3 | — | — |
| A-4 | — | — |
| A-5 | — | — |
| A-6 | — | — |
| A-7 | — | — |
| A-8 | — | — |
| A-9 | — | — |

## Log

- 2026-10-02: baseline re-measured (above). Plan written by a top-model subagent, committed `3682d02`, 3,254 lines,
  14 tasks. Lead checked the commit, the task headings and the blockers section. Stopped for plan approval.
