# Graduation Plan Task 4: evidence

Commands (logs under C:\Users\teasp\.claude\jobs\c810ab0e\tmp\):
- RED: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 415` before production code: c4a-c4h FAIL (not defined / source scan).
- GREEN: same command: `runSelfChecks: 415/415 passed, 0 failed`. Guide: `runGuideSelfChecks: 18/18 passed, 0 failed`.
- Mutation: removed `p.gates.length >= 1 &&` from `customerReadyToGraduateSignal`: c4a FAIL (`"frZero":false`); restored, 415/415.
- Counts: README.txt:74 and VALIDATION.txt:47 read "407/403" (Task 3 find-replace slip); now "415/415". CHANGELOG.txt:36 now 415.

Deviations from the plan:
1. `applyGraduation` validates before creating `newGoal` (plan created first), so a failed draft leaves no stray goal.
2. `unheldPlannedSessions` returns `[]` for accounts still in implementation (curriculum not started), so graduating one does not demand an early-exit reason.
3. c4e looks for `dataset.dropzone` (the drop handler reads it; the literal `data-dropzone` is not in `attachEvents`). All three handlers live in `attachEvents`; the check counts exactly 3 `requestStageChange(` and no direct `changeStage(`.
4. c4f swaps `DATA.riskLog` (the packet builds the risk hub, which prunes riskLog; otherwise v61/v74.4 fail).
5. Tally swap done at 10 sites (5744 why-text, projectedGraduationDate, 3 kanban/list/bar labels, 18579, packet status line, panel bar label, 2 CSM-handoff sites). The `sessionsFigure` self-check fixture and the "(of N planned)" session form label were left alone.
6. Modal inputs only re-validate; none calls render().
