Status: APPROVED by Ian 2026-10-25: "Approve as written (Recommended)" (his own answer; answered-for-ian.jsonl row left it to him, left: ian-kind)
Product: OSM Runway (this folder; branch master after the runway-v13-look merge). A Book of Business Tracker and Onboarding Guide: single-file HTML apps that run from a local folder with no build step, no account and no server.

## Ian's words (verbatim)
- 2026-10-16, why the tracker exists: "a team moving off scattered spreadsheets, a delayed dashboard within Quicksight, having to click through Gainsight and find the right fields to update into one shared tool".
- 2026-10-22, scope of the v13 port: everything works on the fake book except the live Gainsight and Snowflake connection, which is parked until his internal team supplies access (docs/evidence/2026-10-22-runway-fake-book-v13.md, opening line).
- 2026-10-23: "Right after this run (Recommended)" (runway-v13-look into master); "Later list (Recommended)" (the Ask-or-jump bar).
- 2026-10-25: "So runway is done?", then "Do it" (draft this file, then the master merge).

## Objective
An OSM keeps their whole book in one place and turns it into a day's work: Today, Accounts, Risk, Co-pilot, System and Settings on the v13 look (tracker 1.1), with call checks, refresh from Gainsight and send to Gainsight working against the fake connector, and the onboarding guide beside it. Tracker 1.0 stays as it is (locked).

## Done =
Tracker 1.1 on the v13 look is on master, its full test suite and its 565 self-checks pass with no console errors, and the day-and-lifecycle sim passes every step and proves every break on the fake book. Live Gainsight and Snowflake are not part of done (parked, below).

## Done check
`node --test --test-reporter=spec "test/*.test.mjs" "connector/test/*.test.mjs" && node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 565 && node tools/sim/osm-day/run.mjs --version 1.1`

Expected (measured 2026-10-25 at 04df7e8, Node v26.5.0, about 6 minutes):
- suite: `ℹ tests 670`, `ℹ pass 668`, `ℹ fail 0`, `ℹ skipped 2`
- self-check: `runSelfChecks: 565/565 passed, 0 failed` and `console errors: 0`
- sim: `summary 1.1 | steps 22 breaks 22 | exit 0`
The command exits 0 only if all three pass. The sim writes to sim-runs/ (git-ignored).

## Screenshots
docs/evidence/team-demo-captures/ (six v13 captures, hashes in looks-10-v13.md; Ian 2026-10-23: "Keep all six"). Look call 6 before/after: docs/evidence/look-call-6/.

## Not done, later list
- The design's floating "Ask or jump" bar: not built (0 hits in the html); deferred by Ian 2026-10-23.
- Live Gainsight and Snowflake connection: parked until Ian's internal team supplies credentials and access. The fake adapters are the default and reach no outside host (test/parked-live.test.mjs).
- The old screens behind the browser-storage switch obm-next-screens-v1 = '0' are still in tracker 1.1, and the old-UI self-checks run on them (tools/selfchecks-1.1.js turns the switch off for the suite). Removing them, and porting those checks to v13, is later work.
- The v13 features 1.1 has no data for (deferred by Ian 2026-10-22; list in the evidence doc's "Deferred" section).
- connector-e2e drives tracker 1.0 for e1-e7; the v13 proof for calls, refresh and send is the capture run (tools/team-demo-capture.mjs).
- Team rollout: today it is single-user and local; the aim is one shared tool, hosted after internal approval (docs/HOSTING.md).
