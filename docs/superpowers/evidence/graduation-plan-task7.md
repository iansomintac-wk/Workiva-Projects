# Graduation plan task 7: scenario seed, acceptance run, docs

Measured 2026-10-01 in a throwaway headless Chrome profile. Full scenario output:
`graduation-plan-task7-scenarios.log` (same directory).

## Commands and results (all run just now)

- `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 427` -> `runSelfChecks: 427/427 passed, 0 failed`, exit 0 (default invocation unchanged).
- `node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18` -> `18/18`, exit 0.
- `node tools/migration-dryrun.mjs osm-book-of-business-tracker-1.0.html --from 13` -> exit 0; `Schema 13 -> 14  Accounts: 7  goals:[] 7/7  exit:null 7/7  graduation:null 7/7`; invented exits 0; idempotent true; console errors 0.
- `--from 12` -> exit 0; notes lost/changed 0; idempotent true.
- `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js,tools/graduation-scenarios-seed.js --fn runGraduationScenarios --verbose --expect 6` -> `runGraduationScenarios: 6/6 passed, 0 failed`, exit 0.

## Liveness (the harness can fail)

- `--seed demo-seed.js,tools/nope.js` -> exit 2, "No such file".
- `--seed demo-seed.js --fn runGraduationScenarios` -> exit 2, "window.runGraduationScenarios() was not defined by the seed."
- A3 expectation broken to `rows === 1` in a scratch copy -> `5/6 passed, 1 failed`, exit 1. Production code not mutated; the scratch copy is not committed.

## Measured A3-A8

- A3: rows=0 detect=0 accounts=17 (15 Today rows in all); goals:[] 17/17, exit:null 17/17, schema 14.
- A4: ready_to_graduate fired=true (gates 5/5, sessions 8/8). **Headline is `late_gate`, not `ready_to_graduate`, while the account's three Gainsight compliance gates are open** (late_gate is severity 2 and sits before it in SIGNAL_DEFS; ready_to_graduate is severity 1). With those gates closed, the headline is `ready_to_graduate` ("Record the goal verdict and graduate") and it is a Today row. Both states are printed by the seed.
- A5: confirmGraduation=true, exit.reason=goal_met_early, week=7, tally `5/5`, packet line `Early exit: Goal met early (Oct 1, 2026). Sessions marked not needed: Session 6 — First Draft Report Review`.
- A6: packet line `Changed Oct 1, 2026: Publish FY2026 report → Ready for next year's reporting cycle, because Report moved to consultants; customer owns next cycle.` goal_changed firedBeforeAck=true, firedAfterAck=false; headline before = `goal_changed` ("Check the target graduation date against the new goal") with a Today row; after ack = `next_session`, no row. This closes task 3's open item (the headline is now proven).
- A7: gates=0, confirmGraduation=true, stage graduated, verdict partly, exit null, packet line `Gates: 0 gates`.
- A8: asked=true blocked=false promptLen=111; no-note validation `{"ok":false,"missing":["note"],"notePrompt":"Met with 2 open gates (...). Say why that is acceptable."}`; with note ok:true, confirmGraduation=true.

## Deviations from the plan

- `--verbose` detail cap is 1000 chars for passes (plan: 300), because A4/A6 details were cut mid-value at 300. Failures keep the 300 cap.
- A4 prints two headlines (Gainsight gates open / closed) instead of one, because the plan's bare account headlines `late_gate`. `ok` requires `ready_to_graduate` to headline in the closed state.
- A5/A7/A8 use `confirmGraduation` (the real UI path), per the lead's instruction, not `applyGraduation`. A6 changes the goal with a reason via `changePrimaryGoal`.
- `confirmGraduation` calls `saveData`; each scenario restores `DATA.customers`/`DATA.activities` in a `finally`, and the seed wrapper re-saves the real book afterwards. Throwaway profile only.

## Docs (same commit)

- README.txt: new "Graduation plan" section (goals, gates, change goal, graduation confirm, early exit, One Document GOALS, Gainsight items, Settings gates, FR/GRC empty by default, run commands); count 425 -> 427.
- CHANGELOG.txt: new "Graduation plan" entry before "Development history".
- VALIDATION.txt: line 47 -> 427/427; the stale `--expect 369` repro command (line ~157) -> 427; Task 5 packet-length note now names the seed; added Task 6 fix entry (`c975f90`, 427) and Task 7 entry with A1-A8.

## Count sweep: every `\d{3}/\d{3}` pair and bare count

README.txt (1 pair): `:133` `427/427` current (was 425/425 at old `:74`; the new section moved it).

CHANGELOG.txt (0 pairs). Bare counts: `:36` "427 console-callable self-checks" current (already 427); `:76` "389 self-checks (was 369)" historical (Curriculum piece 1 entry, correct to leave); `:112` "427 self-checks (was 389)" current (new).

VALIDATION.txt (96 pairs after this commit):
- Current: `:47` 427/427 (fixed); the new Task 6 fix and Task 7 entries (427/427, 6/6).
- Command that must work today: `:157` `--expect 427` (fixed; was 369).
- Historical, left as written: `:54, :70, :135-136, :148-149, :161, :180, :290, :314, :398` (September 10 record and its predecessors: 318, 364, 365, 368, 369); `:583-:1098` (curriculum piece 1 task logs: 369 through 383); `:1125-:1298` (M-series fixes: 383 through 389); `:1302-:1363` (graduation tasks 1-6: 389 through 425, each the count at that task).
