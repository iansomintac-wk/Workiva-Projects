# Fake-book v13 merge numbers (Task 2)

Merge cc39480 on branch runway-fake-book-v13, measured 2026-10-22 on this checkout. Every row is a run done in this task (not read). Full logs: sim-runs/fake-book-v13/<name>.log (git-ignored). Node v26.5.0.

| # | Command | Printed result | Exit |
|---|---|---|---|
| 1 | `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 999` | `Expected 999 checks, the suite defines 561.` | exit 1 (deliberate) |
| 2 | same with `--expect 561` | `runSelfChecks: 561/561 passed, 0 failed`; `console errors: 0` (README.txt already says 561, no count fix needed) | exit 0 |
| 3 | step 0 probe: `... --seed demo-seed.js,tools/step0-probe.js --fn step0Probe --expect 34` | `step0Probe: 33/34 passed, 1 failed` (T8, round1=0 round2=0) | exit 1 |
| 4 | step 1 probe: `... --seed demo-seed.js,tools/step1-fixture.js,tools/step1-probe.js --fn step1Probe --expect 72` | `step1Probe: 72/72 passed, 0 failed` | exit 0 |
| 5 | FX1 probe: `... --seed demo-seed.js,tools/b2-fx1-probe.js --fn b2Fx1Probe --expect 2` | `b2Fx1Probe: 2/2 passed, 0 failed` | exit 0 |
| 6 | `node tools/step1-coldstart.mjs` | `C8 PASS: median under 500 ms` (loadMs 276.9 / 336 / 246.4, median 276.9, `SPREAD_FLAG: yes` spread 32%) | exit 0 |
| 7 | 1.0 selfcheck: `... osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475` | `runSelfChecks: 475/475 passed, 0 failed` | exit 0 |
| 8 | guide: `... osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18` | `runGuideSelfChecks: 18/18 passed, 0 failed` | exit 0 |
| 9 | `node --test --test-reporter=spec "test/*.test.mjs" "connector/test/*.test.mjs"` | tests 652, pass 650, fail 0, skipped 2 | exit 0 |
| 10 | `node tools/sim/osm-day/run.mjs --version 1.1` | `summary 1.1 \| steps 22 breaks 22 \| exit 0` | exit 0 |
| 11 | `node tools/sim/osm-day/run.mjs --version 1.0` | `summary 1.0 \| steps 22 breaks 22 \| exit 1`; 7 FAIL: D2, D3, D8, L7, L8, L11, L12 (the known 7) | exit 1 |
| 12 | `node tools/connector-e2e.mjs` | `connector-e2e: 8/8 passed, 0 failed` | exit 0 |
| 13 | `node tools/d2-prep-panel.mjs --check` | `D2PREP-CHECK ... "ok":true` | exit 0 |
| 14 | `node tools/d3-prep-panel.mjs --check` | `D3PREP-CHECK ... rows 5` (exit 0) | exit 0 |
| 15 | `node tools/l11-csat-panel.mjs --check` | `L11-CHECK {"passed":true ...}` | exit 0 |
| 16 | `node tools/l12-persist-check.mjs` | `L12-PERSIST {"legacy":true,"saved":true,"pinned":true,"ok":true}` | exit 0 |
| 17 | `node tools/team-demo.mjs --headless --exit-after-ready` | `team-demo: ready http://127.0.0.1:8801/ ...`; its own temp folder was gone afterwards, port 8801 free | exit 0 |

## Failures

- FAIL: `T8 each round of tab clicks found and clicked all 5 tabs (so the 0-writes check below is not vacuous)` (row 3, step0Probe 33/34). Defect in v13 merge: no. Pre-existing on f086a14: yes (Task 1 measured the same 33/34 on an untouched f086a14 checkout). Owner: Task 6.
- Row 11, 1.0 sim, 7 known FAIL (`1.0 | D2`, `D3`, `D8`, `L7`, `L8`, `L11`, `L12`, all `break NOT-TESTED`): expected on locked 1.0 (those features are 1.1 only). Defect in v13 merge: no. Pre-existing on f086a14: not measured (count of 7 equals the plan's known 7). Owner: none (do not fix).
- Row 6 is a PASS, but the tool prints `SPREAD_FLAG: yes` (spread 32%); its text says to report the numbers to Ian. Not a failure. Owner: Task 9 report.
