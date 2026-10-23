# Runway fake-book on v13: good-to-go evidence (Task 9)

Branch runway-fake-book-v13, measured 2026-10-22. Ian's scope that day: everything works on the fake book except the live Gainsight and Snowflake connection, which is parked until his internal team supplies access.

"Re-run" means run again in Task 9 at 2128b04 (after the last html commit 512f1c0). "Task 2/6" means taken from `docs/evidence/2026-10-22-fake-book-v13-merge-numbers.md` (its "after Tasks 3-6" column, measured at 4f7f9c3, which is also after 512f1c0, so not stale). Logs for the re-runs: job tmp folder `t9/`.

## What was checked, one row per feature area

| Feature area | Check command | Measured result | Commit |
|---|---|---|---|
| v13 look screens (Today, Co-pilot, Accounts, Risk, System, Settings) | `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 564`; step 0 probe `... --seed demo-seed.js,tools/step0-probe.js --fn step0Probe --expect 34`; step 1 probe `... --fn step1Probe --expect 72` (with step1-fixture.js) | 564/564, console errors 0 (re-run); step 0 34/34 (re-run); step 1 72/72 (re-run). Side-by-side design vs build PNGs: `docs/evidence/v13-vs-design/` | cc39480 (merge), 4f7f9c3 (step 0 fix), 93b2fc3 |
| Check for calls | `node tools/connector-e2e.mjs`; `node tools/d3-prep-panel.mjs --check` | connector-e2e 8/8 (re-run) but its e1-e7 drive tracker 1.0 (e8 CSAT drives 1.1), so it is not v13 proof. v13 proof is the capture run (real CDP clicks on v13, via the walkthrough's /practice entry): capture 01 shows 5 matched, 1 no account. D3 prep rows 5 (Task 2/6) | cc39480, 0865c0d |
| Refresh from Gainsight | `node tools/connector-e2e.mjs`; capture 02 | connector-e2e 8/8 (re-run, e4 on tracker 1.0); v13 proof is the capture run (real CDP clicks on v13): 17 accounts in the differences list, no clipped table (Task 7: scrollWidth = clientWidth 933) | 0865c0d |
| Send to Gainsight | `node tools/connector-e2e.mjs`; capture 04 | connector-e2e 8/8 (re-run, e5 on tracker 1.0); v13 proof is the capture run (real CDP clicks on v13): capture 04 shows 2 sent, 1 failed on the v13 Risk screen's Gainsight queue | 0865c0d |
| Check CSAT (T4) | in the 564 self-check: T4v13 (browser click on `#btn-check-survey-connector` goes to /v1/csat); `node --test test/connector-survey-pull.test.mjs` | T4v13 passes inside 564/564 (re-run). Mutant (renamed button) gave 561/562 FAIL T4v13, real 562/562 (Task 3) | dd4d4f6 |
| Desk card (T14), re-scoped to the v13 Risk screen | in the 564 self-check: T14v13 (confirm a risk on `[data-v13-risk]`, real clicks) | The old Desk card does not exist in v13 (0 `.dk-risk`); the guard was moved to the v13 Risk screen. Mutants 561/563 and 562/563 FAIL, green 563/563 (Task 4b) | 2790677 |
| Desk reason (T16), re-scoped to the v13 Risk screen; found and fixed a real defect | in the 564 self-check: T16v13 | The v13 "Add a reason" button also confirmed the unreviewed signal. One-line fix (passes `addingReason`). Parent html with the new test: 563/564 FAIL T16v13; fixed: 564/564 | 512f1c0 |
| Snowflake adapter | `node --test test/parked-live.test.mjs connector/test/*.test.mjs` | Fake adapter is the default and reaches no non-127.0.0.1 host (parked-live, with a negative control). Re-run with csat-no-network and the connector tests: 217 tests, 217 pass, 0 fail | 2128b04 |
| Launcher and walkthrough | `node tools/team-demo.mjs --headless --exit-after-ready`; `node --test test/team-demo.test.mjs` | ready on 127.0.0.1:8801, temp folder and port released afterwards (Task 2/6); team-demo tests pass (re-run) | 0865c0d |
| Captures | `node tools/team-demo-capture.mjs <dir>` | Six PNGs on the v13 look, fingerprint `#app [data-osm]` on 01-05, shot 06 now the whole page with the Evidence counts table (564 / 72 / 475 / 18 / 450 at 2128b04). Hashes in `docs/evidence/team-demo-captures/looks-10-v13.md` | 0865c0d, Task 9 commit |
| Sim | `node tools/sim/osm-day/run.mjs --version 1.1`; `--version 1.0` | 1.1: `steps 22 breaks 22`, exit 0 (re-run). 1.0: exit 1 with the same 7 known FAIL (D2, D3, D8, L7, L8, L11, L12), see Known residuals | 4f7f9c3 |
| Counts on the /built page | `node --test test/team-demo.test.mjs` (new guard: counts equal README.txt --expect) | json said 503 at 2f6ff23; guard red ("json count 503 != README --expect 564"); re-measured: 1.1 564, step 1 72, 1.0 475, guide 18, suite 450 | Task 9 commit |
| Prose counts | `node --test test/readme-counts.test.mjs` | README and HOSTING say 564, guarded | 4f7f9c3 |
| Parked-live audit | `node --test test/parked-live.test.mjs`; locked `test/csat-no-network.test.mjs` | docs say live connection waits on Ian's internal team; no default path reaches a Gainsight or Snowflake host | 2128b04 |

Other measured numbers (Task 2/6): 1.0 self-check 475/475 and guide 18/18 (re-run); FX1 probe 2/2; D2/L11/L12 checks ok; step 1 cold start C8 PASS, median 409.3 ms, spread 9%.

## Parked

Live Gainsight and Snowflake are parked until Ian's internal team supplies access. Nothing in this branch reaches either host by default: `connector/config.example.json` uses the fake adapters, dry run on. Proof: `test/parked-live.test.mjs` (docs say so; no default path reaches a host, with a control that does) and the locked `test/csat-no-network.test.mjs` (CSAT on the tracker side makes no network call). The tracker works fully offline and by file import in the meantime.

## Deferred by Ian 2026-10-22

The v13 features 1.1 has no data for: signal ids (EV-27); co-pilot minutes saved and applied / edited / dismissed counts; "Applied for you"; "After your calls"; implementation %; check-ins due; sentiment and renewal pickers; Gainsight dry-run, JSON preview, field mapping and per-row company-ID boxes; renewal window; TTFV target; curriculum versions. (Source: the "Left out" line of `docs/evidence/2026-10-22-runway-v13-fixes.md`.)

## Not on any list

Nothing left here. The design's floating "Ask or jump" bar (absent from the build, 0 hits in the html) was put on the deferred list by Ian 2026-10-23: "Later list (Recommended)".

## Ian's end-of-run batch, 2026-10-23

- Team-demo captures 01-06 on v13: "Keep all six (Recommended)".
- Look call 6, the reason line once per signal: "Show once (Recommended)". Not built in this run; it is the next look item.
- "Ask or jump" bar: "Later list (Recommended)".
- runway-v13-look into master: "Right after this run (Recommended)".

## Known residuals

- connector-e2e not yet ported to v13: `tools/connector-e2e.mjs` drives tracker 1.0 for e1-e7 (only e8 Check CSAT drives 1.1); the capture run (`tools/team-demo-capture.mjs`, real CDP clicks on v13) is the v13 proof for calls, refresh and send. Also, tracker 1.1 loads the xlsx library from cdnjs for Import Excel only, so "offline" holds for everything except that button.
- T4 response-to-modal path is covered in two halves: T4v13 (browser: click goes to /v1/csat) and the connector-survey-pull node test ("a good response opens the modal with the plan"). No single browser test covers the whole path.
- `tools/step1-coldstart.mjs` printed `SPREAD_FLAG: yes` (32% spread) in Task 2. That was timing noise: C8 PASS (median under 500 ms) both times, and after Task 6 the spread was 9%.
- The 1.0 sim keeps its 7 known FAIL (D2, D3, D8, L7, L8, L11, L12, all "break NOT-TESTED"): those features exist only in 1.1 and 1.0 is locked. Unchanged from Task 2.
- Look status: the six Task 7 captures await Ian's look. PM first pass: keep 01-05, 06 reshot (done in Task 9). Not self-approved. One taste note left open: in 02 the stacked tables' headings do not line up (no clipping).
