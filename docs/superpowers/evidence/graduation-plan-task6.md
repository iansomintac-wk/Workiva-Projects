# Graduation plan task 6: Gainsight items and Settings gates (evidence)

Commands (output in `C:\Users\teasp\.claude\jobs\c810ab0e\tmp\t6-*.txt`):
- RED: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 425` -> 422/425, FAIL c6a (commitGoalEvent not defined), c6b, c6c.
- GREEN: same -> `runSelfChecks: 425/425 passed, 0 failed`.
- Guide: `node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18` -> `18/18` (the guide is in the onboarding file, not the tracker).
- Mutation: second `queueGainsightItem` call inside `commitGoalEvent` -> c6a FAIL `"createdAdded":2,"total":6`; restored, `425/425`.

Call sites (each queues once; none queues inside the domain functions):
- `openGoalFormModal` save: `'created'` or `'changed'`. The Go-Live goal form is this same modal (`openGoalFormModal(c,'create')` from the implementation panel).
- `[data-goal-verdict]` select handler: `'verdict'` (clearing a verdict queues nothing).
- `openGraduationConfirmModal` OK: `'created'` only when the goal was created inline, then `'verdict'` (2 calls in source, at most 2 items).
- `openAddCustomerModal`: `'created'` after `commitDataCandidate` succeeds.

Settings: new `<details>` "Graduation gates" via `renderGoalGatesSettings()`, placed between the Advanced taxonomy block and "Risk thresholds". Textareas read on Save only (no render on blur/change).
**For Ian to capture later:** Settings (gear) modal -> scroll to the "Graduation gates (default checklist per goal type)" block, opened, showing the Financial Reporting and GRC rows empty and a populated module row.

Deviations: c6b counts `commitGoalEvent(` per function (form 1, confirm 2, verdict select inside `attachEvents` 1, new-account 1) rather than only "contains". Counts updated 422 -> 425 in README.txt:74, VALIDATION.txt:47, CHANGELOG.txt:36 and the plan table (row 6 marked measured).
