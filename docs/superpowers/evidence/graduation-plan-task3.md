# Graduation plan task 3: goal change

Commands (logs under C:\Users\teasp\.claude\jobs\c810ab0e\tmp\):
- Red: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 407` -> 4 FAIL (c3a-c3d, "changePrimaryGoal is not defined").
- Green: same command -> `runSelfChecks: 407/407 passed, 0 failed`. Guide: `runGuideSelfChecks: 18/18 passed, 0 failed`.
- Mutation: removed `o.done &&` in changePrimaryGoal -> FAIL c3b (`undoneStays:false`); file restored (cmp identical).

Built: changePrimaryGoal, goalCreatedByChange, customerGoalChangedSignal, ackGoalChange; SIGNAL_DEFS goal_changed (before late_gate),
SIGNAL_PANEL_TAB, EFFORT_MIN (5); "Change goal" button, "Target date checked" ack line, openGoalFormModal 'change' (required reason textarea).
The reason textarea and modal fields do not call render(); the only render() calls are on button clicks (ack, submit).

Deviation: c3b has an extra case (an account with nothing ticked) because the plan's c3b did not go red under the plan's mutation
(only "Metrics mapped" is a shared text and it was ticked). Docs: counts 403 -> 407 in README:74, VALIDATION:47, CHANGELOG:36, plan table row 3.
