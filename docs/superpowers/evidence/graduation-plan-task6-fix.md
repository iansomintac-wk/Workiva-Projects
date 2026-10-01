# Graduation plan task 6 fix (checker findings on d4c9bac)

Findings verified against the code first; all three were real.

1. Graduation with an inline goal called `commitGoalEvent` twice, each saving, so the second `saveData` overwrote `_undoSnapshot` with the post-graduation book.
   Fix: `queueGainsightItem` / `commitGoalEvent` take `opts.defer` (queue, no save). New `confirmGraduation(c, d)` is what the confirm's OK runs: markUndoable, applyGraduation, deferred events, one `saveData`.
   Other call sites checked: goal form (one event, one save), verdict select (one event, one save). Both were already one action = one save.
2. Add account: `commitDataCandidate` saved, then `commitGoalEvent` saved again. On master (e780666) Add account has no markUndoable and saves once, so Undo restores the pre-add book. Now the queue item is deferred-queued inside the candidate's persist function, then one `saveData`. Same behaviour as master.
3. `config.goalGates` is now also normalised in `repairAuxiliaryCollections` (called from `prepareBookData`), with the same `normalizeGoalGatesConfig` as the v13->v14 step.

Checks (written first, failed first): c6d (real `confirmGraduation`, `saveData` stubbed with an in-memory store that models the undo snapshot: saves === 1, snapshot has stage not graduated, no goals, no graduation, 2 queue items) and c6e (`prepareBookData` cleans a non-array list, non-string and over-long entries, an over-cap list). c6b adjusted: the 2 `commitGoalEvent` calls now live in `confirmGraduation`, which the modal must call.

Red run: c6d "confirmGraduation is not defined", c6e "Cannot read properties of null", c6b red.
Green: `runSelfChecks: 427/427 passed, 0 failed`; guide `18/18`.
Mutation: restoring the non-deferred `commitGoalEvent(c,'created',gp)` turned c6d red (`saves 2, snapStage graduated`); restored afterwards.
Counts 425 -> 427 updated in CHANGELOG.txt and the plan (table rows 6-7, later task steps). Task 6's own step lines keep 425 (history).

Not measured: the Add account path has no in-page check (it sits in a modal closure); its one-save change is by reading, matching master's single save.
