# Graduation Plan, Task 2 evidence (goal panel)

## Commands and measured output (this session)

- Red: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 401`
  -> 5 FAIL lines, c2a-c2e (`createGoal is not defined`, `goalCriteriaTally is not defined`, `goalHintText is not defined`); 396 others passed.
- Green, same command -> `runSelfChecks: 401/401 passed, 0 failed`.
- Guide: `--fn runGuideSelfChecks --expect 18` -> `18/18 passed, 0 failed`.
- Mutation: createGoal's planText guard removed -> c2b FAIL (`["Publish FY2026 report","Publish FY2026 report"]`). Restored (cmp identical), `401/401` again.
- Counts updated to 401 in README.txt:74, VALIDATION.txt:47, CHANGELOG.txt:36 and the plan's suite table; mutation note appended to VALIDATION.txt.

## What was built

Domain functions (after `defaultGateTextsFor`): findGoal, findGoalGate, createGoal, setGoalGateDone/Note, addGoalGate, renameGoalGate, removeGoalGate, setGoalVerdict, goalCriteriaTally, goalHintText.
UI: renderGoalPanel (+ renderGoalGateRows) after renderGradReviewBlock in the Overview tab; wiring before the v87 readiness strip; openGoalFormModal('create') before renderNewCsrdField; optional goal pair in Add customer (literal gains `goals: [], exit: null`); Go-Live confirm opens the goal form when no primary exists; `handoffMeetingOn` date field in the Handoff tab. CSS: `.gp-*` classes using :root tokens only.

## Look call for Ian (not captured, per brief)

Capture later: (1) Overview tab of an account with a goal (primary card, gate checklist, collapsed secondary goals); (2) Overview of an account with no goal ("Hand-off goal" banner with hint); (3) the goal form modal; (4) Handoff tab date field.

## Deviations

- `handoffMeetingOn` sits before `intakeNotes` ("Anything else") rather than appended after it, so the catch-all stays last. Behaviour is identical.
- Not exercised: the click wiring and modal submit (the suite drives the pure functions and the two renderers only). Wiring follows the data-gr-answer pattern; a headless click-through is Task 7's acceptance run.
- Rename/remove gate controls are an inline text input and a Remove button per gate rather than prompts.
