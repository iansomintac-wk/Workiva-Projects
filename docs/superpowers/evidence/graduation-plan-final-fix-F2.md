# Final-review fix F2 (Minor 1, 2, 3, 4, 5, 11, 13 + carried aria-label note)

Base `aad7c8b`, suite 431. Outputs in `C:\Users\teasp\.claude\jobs\c810ab0e\tmp\` (f2-red.txt, f2-green.txt, f2-scen.txt).

## Measured just now
- RED (5 new checks added, no code change): 5 FAIL, f2a-f2e, each for the expected reason (`..` in the packet; absent fields stay undefined; total 8 not 5; reason printed twice; `valid:true`, label `graduate`).
- GREEN: `runSelfChecks: 436/436 passed, 0 failed`. Guide `runGuideSelfChecks: 18/18`. Scenario run `runGraduationScenarios: 6/6 passed, 0 failed` (A3-A8).
- Live count pairs: README 117/133, VALIDATION 47/153/158/398, CHANGELOG 36/112, plan table row F2 all 436. Historic records (VALIDATION 369/427 narrative lines) left as dated history.

## Changes
- M1: strip `[.!?\s]+$` from changeReason before the closing full stop.
- M2: `validateGraduationDraft` adds `goalType` when a new goal has text but an unknown type. `confirmGraduation` clears the undo label on refusal. Panel handlers that call `markUndoable` and can no-op (ack, gate done/note/remove/add/rename, verdict) now clear it in the no-op branch.
- M3: `repairAuxiliaryCollections` sets goals `[]`, exit `null`, graduation `null` only when `=== undefined`. Existing values, including historic graduation null and noGoal markers, untouched. Nothing invented.
- M4: displayed `total` in `late_gate`, `no_value_evidence`, `ready_to_set_date` is `plannedSessionTotal(c)`. Thresholds (`0.6`, `0.5`, `completed >= c.totalSessions`) unchanged, as the review did not ask otherwise. Effect is visible only on graduated early-exit accounts (getExit is stage-gated), i.e. in the panel; ready_to_set_date excludes graduated so it is a consistency change only.
- M5: comment `// c4i` -> `// c4f` at the c4f check.
- M11: SESSION HISTORY line is now `(curriculum not started — account was still in implementation; see the early exit under GOALS)` when an exit exists, so the reason prints once. Decision on `plannedSessionTotal` = 0: right. Every planned session is unheld and marked not needed, so nothing is left to deliver; callers guard 0 (`sessionProgressPct` returns 0, the implementation status line prints no total). Left unchanged.
- M13: Settings gate labels carry `for`, textareas carry `id="gp-gates-<moduleIndex>-<type>"` (index-based so module names with spaces cannot break ids).
- Carried: the rename handler updates the sibling checkbox's `aria-label` after a successful rename.

## Not covered by a check
M13 and the aria-label update are DOM-handler changes; no headless DOM here, so verified by reading, not by a new check.
