# Fake-book v13 merge numbers (Task 2)

Merge cc39480 on branch runway-fake-book-v13, measured 2026-10-22 on this checkout. Every row is a run done in this task (not read). Full logs: sim-runs/fake-book-v13/<name>.log (git-ignored). Node v26.5.0.

| # | Command | Printed result | Exit | After Tasks 3-6 |
|---|---|---|---|---|
| 1 | `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 999` | `Expected 999 checks, the suite defines 561.` | exit 1 (deliberate) | `Expected 999 checks, the suite defines 564.` exit 1 (deliberate) |
| 2 | same with `--expect 561` | `runSelfChecks: 561/561 passed, 0 failed`; `console errors: 0` (README.txt already says 561, no count fix needed) | exit 0 | `564/564 passed, 0 failed`; `console errors: 0`; exit 0 |
| 3 | step 0 probe: `... --seed demo-seed.js,tools/step0-probe.js --fn step0Probe --expect 34` | `step0Probe: 33/34 passed, 1 failed` (T8, round1=0 round2=0) | exit 1 | `34/34 passed, 0 failed`; exit 0 (was 33/34; probe now clicks `[data-v13-nav]` as well as `.tab[data-view]`) |
| 4 | step 1 probe: `... --seed demo-seed.js,tools/step1-fixture.js,tools/step1-probe.js --fn step1Probe --expect 72` | `step1Probe: 72/72 passed, 0 failed` | exit 0 | `72/72`; exit 0 |
| 5 | FX1 probe: `... --seed demo-seed.js,tools/b2-fx1-probe.js --fn b2Fx1Probe --expect 2` | `b2Fx1Probe: 2/2 passed, 0 failed` | exit 0 | `2/2`; exit 0 |
| 6 | `node tools/step1-coldstart.mjs` | `C8 PASS: median under 500 ms` (loadMs 276.9 / 336 / 246.4, median 276.9, `SPREAD_FLAG: yes` spread 32%) | exit 0 | `C8` median 409.3 ms (389.5 / 425.8 / 409.3), spread 9%; exit 0 |
| 7 | 1.0 selfcheck: `... osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475` | `runSelfChecks: 475/475 passed, 0 failed` | exit 0 | `475/475`; exit 0 |
| 8 | guide: `... osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18` | `runGuideSelfChecks: 18/18 passed, 0 failed` | exit 0 | `18/18`; exit 0 |
| 9 | `node --test --test-reporter=spec "test/*.test.mjs" "connector/test/*.test.mjs"` | tests 652, pass 650, fail 0, skipped 2 | exit 0 | tests 653, pass 651, fail 0, skipped 2; exit 0 (+1 test: prose-count guard) |
| 10 | `node tools/sim/osm-day/run.mjs --version 1.1` | `summary 1.1 \| steps 22 breaks 22 \| exit 0` | exit 0 | `summary 1.1 | steps 22 breaks 22 | exit 0` |
| 11 | `node tools/sim/osm-day/run.mjs --version 1.0` | `summary 1.0 \| steps 22 breaks 22 \| exit 1`; 7 FAIL: D2, D3, D8, L7, L8, L11, L12 (the known 7) | exit 1 | `summary 1.0 | steps 22 breaks 22 | exit 1`; the same 7 FAIL (D2, D3, D8, L7, L8, L11, L12) |
| 12 | `node tools/connector-e2e.mjs` | `connector-e2e: 8/8 passed, 0 failed` | exit 0 | `8/8`; exit 0 |
| 13 | `node tools/d2-prep-panel.mjs --check` | `D2PREP-CHECK ... "ok":true` | exit 0 | `"ok":true`; exit 0 |
| 14 | `node tools/d3-prep-panel.mjs --check` | `D3PREP-CHECK ... rows 5` (exit 0) | exit 0 | `rows 5`; exit 0 |
| 15 | `node tools/l11-csat-panel.mjs --check` | `L11-CHECK {"passed":true ...}` | exit 0 | `"passed":true`; exit 0 |
| 16 | `node tools/l12-persist-check.mjs` | `L12-PERSIST {"legacy":true,"saved":true,"pinned":true,"ok":true}` | exit 0 | `"ok":true`; exit 0 |
| 17 | `node tools/team-demo.mjs --headless --exit-after-ready` | `team-demo: ready http://127.0.0.1:8801/ ...`; its own temp folder was gone afterwards, port 8801 free | exit 0 | `team-demo: ready http://127.0.0.1:8801/ ...`; exit 0 |

## Failures

- FAIL: `T8 each round of tab clicks found and clicked all 5 tabs (so the 0-writes check below is not vacuous)` (row 3, step0Probe 33/34). Defect in v13 merge: no. Pre-existing on f086a14: yes (Task 1 measured the same 33/34 on an untouched f086a14 checkout). Owner: Task 6.
- Row 11, 1.0 sim, 7 known FAIL (`1.0 | D2`, `D3`, `D8`, `L7`, `L8`, `L11`, `L12`, all `break NOT-TESTED`): expected on locked 1.0 (those features are 1.1 only). Defect in v13 merge: no. Pre-existing on f086a14: not measured (count of 7 equals the plan's known 7). Owner: none (do not fix).
- Row 6 is a PASS, but the tool prints `SPREAD_FLAG: yes` (spread 32%); its text says to report the numbers to Ian. Not a failure. Owner: Task 9 report.

## After Tasks 3-6 (Task 6)

Re-run on the Task 6 HEAD (rows above, last column; logs in the job tmp folder). Failures closed:

- Row 3 T8: cause = the probe clicked only `.tab[data-view]` (old shell); v13 is on by default and its nav is `[data-v13-nav]`. Shown by running the probe with switch `obm-next-screens-v1`='0': 34/34. Fix in `tools/step0-probe.js` (selector now covers both; the check still needs 5 real clicks per round). Now 34/34.
- `tools/sim/osm-day/verify.mjs` C7 (was `FAIL exit NOT 0 x2 (0 2)`): cause = `tools/sim/run-field-test.mjs` steps 01 and 04 looked for buttons by `innerText` (empty inside the closed v13 More menu) and for Backfill on Today (v13 puts it on System). Pre-existing: the same step 01 error ("reading 'click'") on an untouched f086a14 export. Fix in `tools/sim/steps/01-open-settings.js` and `04-open-backfill.js`. Now `C7 PASS exit 0 x2, metrics keys 14/14, 0 new folders`; whole verify exit 0 (C5 to C8 PASS; C1/C2/C4 FAIL lines are the known 1.0-only gaps, reported not gated).
- Stale prose counts: `docs/HOSTING.md` said 562, `README.txt` said 560 in all (twice); now 564. Guard: `test/readme-counts.test.mjs` "prose counts ... equal the --expect number".
- Row 11 still shows the 7 known 1.0 FAIL, unchanged. Row 6 spread flag no longer raised (9%).

