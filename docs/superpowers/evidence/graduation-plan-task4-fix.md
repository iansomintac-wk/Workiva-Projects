# Graduation Plan, Task 4 fix evidence (checker findings on de1eebc)

## Finding 1: not-needed sessions count as resolved everywhere a tally or bar shows
New helper `sessionProgressPct(c)` = completed / plannedSessionTotal(c), capped at 100 (0 when the total is 0).
`nextOpenSessionNumber` also skips sessions in `exit.sessionsNotNeeded`, so a graduated early-exit account
reads "All 5 sessions logged" instead of "Next - Session 6" (this is what made the list-card label reachable).

Site-by-site (line numbers are from the pre-fix file, approximate):
| Site | Decision |
|---|---|
| 17792 list card "All N sessions logged" | adjusted (plannedSessionTotal) |
| 17890 kanban bar width | adjusted (sessionProgressPct) |
| 18623 risk summary prompt STATUS | adjusted |
| 18673 risk CTA text | adjusted |
| 19064 cardGhostFigure | adjusted |
| 20070 accountStanding.total (beat standing "Sessions") | adjusted |
| 2025 aiCustomerSnapshot.totalSessions (progress sent to AI) | adjusted |
| 21659 account snapshot "Sessions" cell | adjusted |
| 22082 details bar width | adjusted (sessionProgressPct) |
| 25976, 25979 report category "All N sessions complete" and its >= test | adjusted |
| 6161 nextOpenSessionNumber | skips not-needed sessions (above) |
| 2408, 2439, 2774 AI context "N planned sessions / N-session plan" | raw: describes the curriculum, not progress |
| 2736-2748, 6164, 6533, 7028, 22350, 22655, 22684 curriculum/template set, session form "(of N planned)" | raw: planning editor |
| 5732 (0.8 threshold), 6477 (0.6 ttfv split), 7383/7389/7555 signal thresholds and `total` | raw: live-account logic; sessionsNotNeeded exists only after graduation |
| 20923 import backfill cap, 21082 backfill table | raw: input validation on live accounts |
| 22078 total-sessions input, 4655 floor, 8297-8299, 26086-26160, 26519-26566 validation | raw: curriculum editor, 6-12 floor, data validation |
| 22287-22288 plannedTotal/matchesPlanned | raw: curriculum consistency check |
| 24800, 24828 account creation | raw |

## Finding 2: spec 4.4 for every account
`unheldPlannedSessions` no longer returns [] for accounts in implementation, so graduating one with unheld
planned sessions requires `exit.reason` and records the sessions as not needed. The packet's "(curriculum not
started - account was still in implementation)" line stays and now appends "; planned sessions recorded as not
needed: <reason label>" when an exit was recorded.

## Checks (new)
- c4i: account with 8 planned, sessions 1-5 held, graduated with an exit reason. Asserts kanban and details bar
  width === 100, `5/5` and no `/8` in kanban, details, list card ("All 5 sessions logged"), snapshot; accountStanding.total,
  cardGhostFigure, aiCustomerSnapshot.totalSessions all 5; report category reads 5/5.
- c4j: account with `implementation` set, 8 planned, none held: draft lists `exitReason` missing; graduating records the exit.

## Measured (this session)
- Red: `--expect 417` -> `415/417 passed`, both new checks FAIL (kb 62.5, db 62.5, st 8, ghost "5/8"; unheld 0).
- Green: `runSelfChecks: 417/417 passed, 0 failed`; guide `18/18`.
- Counts changed as whole pairs: README.txt:74, VALIDATION.txt:47, CHANGELOG.txt:36, plan table and downstream
  rows (+2 each). Grep of the plan for N/N pairs shows only 407/417, 417/417, 417/422, 422/422, 422/425, 425/425.
- Not done: the Excel import path untouched (P1). The check ids c4i/c4j were used because the plan's c4f/c4g are taken.
