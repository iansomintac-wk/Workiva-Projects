# Runway fake-book end to end, connector seam, team demo - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every connector seam on the fake book (Check CSAT through the connector, a Snowflake adapter shaped from docs, true numbers in the docs) and ship a launcher the internal team can be shown.

**Architecture:** Fake Gong and Snowflake adapters learn a `rebaseToToday` option so demo data is always inside the 30-day look-back; tracker 1.1 gets one new Settings button that feeds the EXISTING CSAT plan builder; `tools/team-demo.mjs` starts the fake connector plus a static server on 127.0.0.1:8801 and serves two pages; `snowflake-sql` is a zero-dependency adapter tested only against recorded-shape fixtures with `fetchImpl` injected.

**Tech Stack:** Node (zero dependencies, `node:test`, `node:crypto`), single-file HTML tracker, headless Chrome over CDP (already used by `tools/connector-e2e.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-22-runway-fake-book-connector-design.md`. Run prompt: `docs/RUNWAY_FAKE_BOOK_RUN_PROMPT.txt`.

Suite: node --test --test-reporter=spec test/*.test.mjs
Data: (none)

## Global Constraints

Workers do NOT load CLAUDE.md. These rules apply to every task.

- Test first. Every new or changed test must FAIL on the parent commit and PASS after the task. Run it red before writing the code, and say so in the commit body.
- `osm-book-of-business-tracker-1.0.html` is never edited. Tracker work is in `osm-book-of-business-tracker-1.1.html` only.
- LOCKED (no change without Ian's ruling): `test/csat-no-network.test.mjs`; the existing connector contract tests' fixed fixture dates (`connector/fixtures/calls.json`, `connector/fixtures/accounts.json`, `connector/fixtures/snowflake-csat.json` stay byte-identical); `osm-book-of-business-tracker-1.0.html`; `tools/step*-probe.js` expected counts other than README text.
- Any function the tracker adds that calls the connector must NOT have a name starting with `csat` (the locked `test/csat-no-network.test.mjs` scans every `csat*` function for network use).
- SAFETY: $0 spend. No installs (no snowflake-sdk, no npm packages). No network from code or tests: 127.0.0.1 only, no real Gainsight, Snowflake or Gong credentials or calls. Network-using tests run under `connector/lib/test-net-guard.mjs`.
- Workiva data stays in this repo; only names go to the brain or studio-harness.
- Never read `*RESTORE-POINT*` files, exports, or Ian's real CSAT file. Never touch the 6 untracked files in Ian's main checkout. Do not ask Ian to switch his real book. No writes under `~/.claude/`.
- Chrome: only with `--user-data-dir` pointing at a fresh temp folder; never Ian's normal profile.
- Stop processes by PID only (a process you started); never by image name; never touch ports 8790 or 8800. The demo origin is 127.0.0.1:8801.
- `node --test <folder>` runs nothing on Node 26: always pass explicit files or a quoted glob such as `"connector/test/*.test.mjs"`.
- A CSS token copied from a neighbour may be undefined: check each `var(--x)` exists in `:root`.
- Do not let two things edit the worktree at once: do not edit while a suite or selfcheck you started is still running.
- Editing the 1.1 html may break a sha256 pin test. If one fails, read the header of `tools/repin.mjs` and re-pin exactly as it says, in the same commit.
- Change the document in the same commit as the thing it describes (any count or name nearby prose now gets wrong).
- Stay inside the files named in your task. Commit message: `task N: <title>`. Never push or merge.

## Baselines (which numbers were measured, which only read)

- Measured by the spec author 2026-10-22 on fd3a09c (read here, NOT re-run by the plan writer, whose shell cannot run the suites): connector suite 180/180; tracker 1.1 selfcheck 503/503 (README says 502); step 1 probe 72/72 (README says 65); `node tools/connector-e2e.mjs` 5/7 (e2 and e3 fail because the fixture calls are dated 2026-09-08..18 and the look-back is 30 days).
- Measured by the plan writer just now by grep: README.txt has `--expect 502` on lines 210 and 308, `--expect 65` on lines 212 and 310, "no real adapter is built" on line 228, "7/7" on line 289; `docs/HOSTING.md` lines 30 and 36 say 502; `test/hosting-docs.test.mjs:43` asserts `/502/`; `test/selfcheck-exit.test.mjs:7` passes `--expect 502`; `tools/connector-e2e.mjs` opens the 1.0 html and prints `N/7`; `connector/test/demo.test.mjs` takes the last 6 stdout lines.
- Rule for every count in this plan: a task that changes a count first measures it (runs the selfcheck or test) and writes the measured number plus the command in the commit body. The README is the single source of truth for the 1.1 count; `test/readme-counts.test.mjs` (Task 1) makes README, HOSTING.md and the tests agree.

## Order and groups

M0a = Task 1. M2 = Tasks 2-6. M3 = Tasks 7-10. M1 = Tasks 11-13. M0b = Tasks 14-16. Cut from the end: M0b first, then M1. The request-log panel in M3 is optional and is NOT planned (cut first). No task is a tune task. Paid calls: none ($0).

| Task | Group | Helper-token estimate |
|---|---|---|
| 1 | M0a | 60k |
| 2 | M2 | 90k |
| 3 | M2 | 90k |
| 4 | M2 | 150k |
| 5 | M2 | 150k |
| 6 | M2 | 70k |
| 7 | M3 | 120k |
| 8 | M3 | 120k |
| 9 | M3 | 150k |
| 10 | M3 | 90k |
| 11 | M1 | 100k |
| 12 | M1 | 140k |
| 13 | M1 | 100k |
| 14 | M0b | 110k |
| 15 | M0b | 90k |
| 16 | M0b | 110k |

Run total: about 1,740k helper tokens (16 tasks), before review rounds.

## Expected breaks

- HOSTING.md covers checking a copy from an address and publishing a new version; CHANGELOG names --serve | fixed by Task 1
- FX1 selfcheck* | fixed by Task 1
- connector-e2e step count line "7/7 passed" (README.txt line 289 and tools/connector-e2e.mjs) | fixed by Task 5
- t15 connector demo: six summary lines, exit 0, connector stopped, temp files removed | fixed by Task 6
- snowflake: any adapter name other than fake throws the parked-stage-2 message | fixed by Task 12
- docs: CONNECT-SNOWFLAKE.md and CONNECTORS.md exist with the required sections | fixed by Task 13
- README count lines (--expect 502 and 65 in README.txt and docs/HOSTING.md) | fixed by Task 1; if Task 3 changes the 1.1 count, fixed by Task 3

---

### Task 1: M0a true numbers in the docs

Depends: none
Timeout: 40m
Check: `node --test test/readme-counts.test.mjs test/hosting-docs.test.mjs test/selfcheck-exit.test.mjs 2>&1 | tail -15 && node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 503 | tail -3 && node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step1-fixture.js,tools/step1-probe.js --fn step1Probe --expect 72 | tail -3`
Expect: 72/72

**Files:**
- Create: `test/readme-counts.test.mjs`
- Modify: `README.txt` (lines 210, 212, 228, 308, 310), `docs/HOSTING.md` (lines 30, 36), `test/hosting-docs.test.mjs:43`, `test/selfcheck-exit.test.mjs:7`

- [ ] Step 1: Write `test/readme-counts.test.mjs` with 4 tests: (a) README.txt contains no `--expect 502` and no `--expect 65`; (b) every README line with `osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect N` has the same N, and `docs/HOSTING.md` contains `N/N` for that same N and `--expect N`; (c) every README step-1 probe line has `--expect 72`; (d) README does not contain "no real adapter is built" and does contain "gong-rest", "gainsight-rest" and "unproven" in the Connector section.
- [ ] Step 2: Run it. It must fail (the README still says 502 and 65). Run `git stash`-free: just read the failure.
- [ ] Step 3: Measure first, read-only: run the two selfcheck commands from the Check line with `--expect 503` and `--expect 72`. Prediction: 503/503 and 72/72. If either differs, use the measured number everywhere below and say so in the commit body.
- [ ] Step 4: Edit README.txt: 502 to 503, 65 to 72 (both copies). Replace the "no real adapter is built" sentence (README:227-228) with: gong-rest and gainsight-rest are built and unproven until `--check`; Snowflake is the fake only (snowflake-sql is added later in this run, Task 13 updates this line). Leave the connector-e2e `7/7` line as it is (Task 5 fixes it).
- [ ] Step 5: Edit `docs/HOSTING.md` lines 30 and 36 to the same 1.1 count; edit the `/502/` regex in `test/hosting-docs.test.mjs` to the same number; edit `--expect 502` in `test/selfcheck-exit.test.mjs` to the same number.
- [ ] Step 6: Run the Check line. All green. Commit.

### Task 2: M2 time-proof fake data (fixes connector-e2e 5/7)

Depends: 1
Timeout: 40m
Check: `node --test connector/test/rebase.test.mjs connector/test/snowflake.test.mjs connector/test/server.test.mjs connector/test/fixtures.test.mjs 2>&1 | tail -15`
Expect: fail 0

**Files:**
- Create: `connector/lib/rebase.mjs`, `connector/test/rebase.test.mjs`
- Modify: `connector/adapters/gong-fake.mjs`, `connector/adapters/snowflake-fake.mjs`, `connector/adapters/index.mjs`, `connector/CONTRACT.md` (one short paragraph on the option)

**Interfaces:**
- Produces: `rebaseDays(anchorISODate, now) -> integer` (whole days from anchor to the UTC day of `now`, minus the lag); `shiftISO(iso, days) -> string` (works for `YYYY-MM-DD` and full date-time, keeps the time part). Fake adapters accept config `rebaseToToday: true` (default false) and an injected `now` (function returning a Date or ms; default `Date.now`); the connector process also reads env `CONNECTOR_FAKE_NOW` (ISO string) when `rebaseToToday` is on, so e2e can set the clock ahead. Rule: shift every date in the fixture by one whole number of days so the NEWEST fixture date lands 1 day before today; relative spacing never changes.

- [ ] Step 1: Write `connector/test/rebase.test.mjs` (all must fail on the parent): (a) default config, no flag: `listCalls()` still returns calls whose `startedAt` are the fixed 2026-09-08..2026-09-18 dates; (b) `rebaseToToday: true` with `now` = real now + 90 days: `listCalls({since: now-30d})` returns all 6 calls, and the spacing between calls equals the fixture spacing; (c) same for `listCsat({since: now-30d})` returns every row, and for each row `CSAT_SENT_DATE <= CSAT_ANSWERED_DATE` where answered is non-empty, and the empty answered date stays empty; (d) `shiftISO('2026-09-08T14:00:00Z', 10)` is `2026-09-18T14:00:00Z`; (e) loadAdapters passes `rebaseToToday` and `now` through to the fake adapters (use `loadAdapters({gong:{adapter:'fake', rebaseToToday:true}}, {now})`).
- [ ] Step 2: Run the new test; confirm red.
- [ ] Step 3: Implement `connector/lib/rebase.mjs`; make `gong-fake.mjs` and `snowflake-fake.mjs` rebase `startedAt` and the CSAT date fields only when asked. `index.mjs` currently destructures `now` out of the options and does not hand it to fakes: pass `now` to the fake factories (`factory({ ...cfg, ...rest, now })`).
- [ ] Step 4: Run the Check line; the existing connector tests (fixed dates) must stay green with zero edits to them.
- [ ] Step 5: Probe read-only and put the numbers in the commit body: `node --test "connector/test/*.test.mjs" 2>&1 | grep -E "^. (tests|pass|fail)"` (prediction: 180 plus the new tests, 0 failures). Commit.

### Task 3: M2 demo ids of 15 or more characters and the demo CSAT rows

Depends: 2
Timeout: 40m
Check: `node --test test/demo-csat-ids.test.mjs connector/test/fixtures.test.mjs connector/test/snowflake.test.mjs 2>&1 | tail -15 && N=$(grep -o -m1 '1.1.html --seed demo-seed.js --expect [0-9]*' README.txt | grep -o '[0-9]*$') && node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect $N | tail -4`
Expect: console errors: 0

**Files:**
- Create: `test/demo-csat-ids.test.mjs`, `connector/fixtures/snowflake-csat-demo.json`
- Modify: `demo-seed.js`, `connector/adapters/snowflake-fake.mjs` (config `fixture: 'demo'` serves the demo file), `README.txt`, `docs/HOSTING.md`, `test/hosting-docs.test.mjs`, `test/selfcheck-exit.test.mjs` (only if the count moves)

**Interfaces:**
- Consumes: Task 2 `rebaseToToday` for `snowflake-fake`.
- Produces: seed customers carry `salesforceId` values `001DEMO00000000NNAAA` (NN = 01..17, 20 characters, matching the order of the existing `GS_IDS`); `connector/fixtures/snowflake-csat-demo.json` with `{rows:[...]}` in the same 5-column shape as the existing CSAT fixture. The GS-DEMO ids stay (they are in locked fixtures); only `salesforceId` is added. The tracker's `csatIdsMatch` needs ids of 15 or more characters.

- [ ] Step 1: Read `demo-seed.js` (customers built around lines 40-50, 131, 151) and `buildCsatImportPlan` (html:19894-19940). Write `test/demo-csat-ids.test.mjs`: every `salesforceId` in `demo-seed.js` matches `/^001DEMO\d{11}AAA$/`-style (15+ characters, unique); the demo CSAT fixture has at least 4 rows; every matched-row `SALESFORCE_ACCOUNT_ID` appears in `demo-seed.js`; at least one row id is NOT in the seed (the unmatched case); the existing `connector/fixtures/snowflake-csat.json` is unchanged (`git diff --quiet` equivalent: compare its sha256 to the value read at the top of the test from `git show HEAD:connector/fixtures/snowflake-csat.json` is not allowed, so hard-code the sha256 you measure now with `node -e`).
- [ ] Step 2: Run it; confirm red.
- [ ] Step 3: Add `salesforceId` to the seed customers. Set survey dates on four seed customers relative to `todayISO()` using `isoAddDays` so the dry run shows: one NEW sent date (customer has none), one FILLED answered date (same sent date, answered empty in the seed), one UNCHANGED (same sent and answered), and a fourth row with an id in no customer (unmatched). Write `snowflake-csat-demo.json` whose dates are `today - k` for the same k (the adapter rebases it, so the file holds the dates as of a fixed reference day; keep the newest date at the reference day so the rebase rule from Task 2 lines it up with the seed).
- [ ] Step 4: `snowflake-fake.mjs`: when config `fixture` is `demo`, serve that file. Existing default stays `snowflake-csat.json`.
- [ ] Step 5: Probe the effect on the 1.1 count: run the README selfcheck line. Prediction: still 503. If it differs, write the measured number plus the command in the commit body and update README.txt (both lines), docs/HOSTING.md, the regex in `test/hosting-docs.test.mjs` and the number in `test/selfcheck-exit.test.mjs`. `test/readme-counts.test.mjs` must pass.
- [ ] Step 6: Run the Check line, then `node --test test/readme-counts.test.mjs`. Commit.

### Task 4: M2 Check CSAT button in tracker 1.1 plus the equivalence test

Depends: 3
Timeout: 40m
Tokens: 600000
Check: `node --test test/connector-survey-pull.test.mjs test/csat-no-network.test.mjs test/csat-plan-match.test.mjs test/csat-modal.test.mjs 2>&1 | tail -15 && git diff --quiet HEAD~1 -- test/csat-no-network.test.mjs osm-book-of-business-tracker-1.0.html && echo locked-files-untouched`
Expect: locked-files-untouched

**Files:**
- Create: `test/connector-survey-pull.test.mjs`
- Modify: `osm-book-of-business-tracker-1.1.html` (Settings block at line ~18098; new handler near the Check for calls code at line ~20264), plus the 1.1 sha256 pin if a test needs it (see constraints)

**Interfaces:**
- Consumes: `connectorConfigured()` (html:1795), `connectorRequest(path, opts)` (html:1818), `buildCsatImportPlan(table, customers, opts)` (html:19894), `openCsatImportModal(plan, meta)` (html:19990), `CSAT_COLS` (html:19868). Look at how the CSV button (`#btn-import-csat`, handler at html:20048) builds `meta` and call the modal the same way.
- Produces: a Settings button `id="btn-check-survey-connector"`, label "Check CSAT (connector)", rendered only when `connectorConfigured()` is true (same rule as `#btn-check-calls` at html:9442); function `surveyRowsToTable(rows) -> string[][]` (header row = the 5 `CSAT_COLS` names, then one row per `{rows}` entry, missing keys as empty string); function `checkSurveyDatesViaConnector()` (async; `GET /v1/csat`; on any error shows a toast, changes nothing; otherwise `openCsatImportModal(buildCsatImportPlan(surveyRowsToTable(resp.rows), DATA.customers), meta)`). Neither name starts with `csat`.

- [ ] Step 1: Read `test/csat-plan-match.test.mjs` and `test/csat-modal.test.mjs` to learn how existing tests load tracker functions from the html in Node. Reuse that pattern.
- [ ] Step 2: Write `test/connector-survey-pull.test.mjs`: (a) EQUIVALENCE: for the demo CSAT rows (`connector/fixtures/snowflake-csat-demo.json`) and the seed customers from `demo-seed.js` (or a small inline customer list with the same ids if the seed cannot load in Node), the plan built from the CSV-parsed table of those rows deep-equals the plan built from `surveyRowsToTable(rows)`; (b) `surveyRowsToTable` header equals the 5 column names in order and blank cells are `''`; (c) the plan has at least one each of a changed (new) date, a filled answered date, an unchanged and an unmatched row; (d) the html source has `btn-check-survey-connector` inside a `connectorConfigured()` conditional and no function whose name starts with `csat` was added that mentions `connectorRequest`; (e) offline: a stub `connectorRequest` that throws `{code:'OFFLINE'}` leaves `DATA` untouched and opens no modal.
- [ ] Step 3: Run it; confirm red (functions do not exist).
- [ ] Step 4: Implement in the 1.1 html. Also add a one-line CHANGELOG.txt entry under the current 1.1 section only if a changelog test allows it (run `node --test test/changelog-12.test.mjs test/hosting-docs.test.mjs`).
- [ ] Step 5: Run the Check line, then the 1.1 selfcheck from the README (count must be unchanged: no selfcheck was added), then `node --test test/selfcheck-exit.test.mjs`. Fix any sha256 pin per the constraints.
- [ ] Step 6: Commit.

### Task 5: M2 e2e Check CSAT step, clock-ahead run, README e2e line

Depends: 4
Timeout: 40m
Tokens: 600000
Check: `a=$(node tools/connector-e2e.mjs | tail -3) && b=$(node tools/connector-e2e.mjs --days-ahead 90 | tail -3) && [ "$(printf '%s\n%s\n' "$a" "$b" | grep -c '8/8 passed, 0 failed')" = 2 ] && node --test connector/test/e2e-cleanup.test.mjs 2>&1 | tail -6 && echo both-runs-8of8`
Expect: both-runs-8of8

**Files:**
- Modify: `tools/connector-e2e.mjs`, `README.txt` (line ~285-289), `connector/test/e2e-cleanup.test.mjs` (only if it pins the step count)
- Create: `connector/test/e2e-steps.test.mjs`

**Interfaces:**
- Consumes: Task 2 (`rebaseToToday`, env `CONNECTOR_FAKE_NOW`), Task 3 (`fixture: 'demo'`, seed ids), Task 4 (`#btn-check-survey-connector`, `checkSurveyDatesViaConnector`).
- Produces: `node tools/connector-e2e.mjs [--days-ahead N] [--keep-logs]`; output line `connector-e2e: N/8 passed, M failed`; exit 0 only for 8/8 with no console errors.

- [ ] Step 1: Write `connector/test/e2e-steps.test.mjs` (reads `tools/connector-e2e.mjs` as text): it declares `/8 passed`, accepts `--days-ahead`, writes `rebaseToToday: true` and `fixture: 'demo'` into the temp connector config, sets `CONNECTOR_FAKE_NOW` when `--days-ahead` is given, and has a check titled starting `e8 Check CSAT`. Run it red.
- [ ] Step 2: Config: the e2e temp config gets `gong: {adapter:'fake', rebaseToToday:true}` and `snowflake: {adapter:'fake', rebaseToToday:true, fixture:'demo'}`.
- [ ] Step 3: Clock: with `--days-ahead N`, spawn the connector with `CONNECTOR_FAKE_NOW` set to now + N days, and install a Date shim in the page (after load, before the seed is evaluated) that shifts `new Date()` and `Date.now()` by the same N days, so both sides agree on "today".
- [ ] Step 4: The e2e opens the 1.0 html, which has no Check CSAT button. Add the `e8 Check CSAT` step as a second Chrome page on `osm-book-of-business-tracker-1.1.html` (same temp profile, new CDP target), seeded with `demo-seed.js`, connector settings saved, then: click `#btn-check-survey-connector`, wait for the CSAT modal, assert the dry run shows at least one changed row and one unmatched row (nonempty preview, on both the plain run and the `--days-ahead 90` run), click Apply, assert a backup was written first and the dates changed. This step must run BEFORE e7 stops the connector; keep e7 last in the printed list or renumber so the labels stay in the order run. Totals become 8.
- [ ] Step 5: Update the `7` constants (`N/7`, `passed === 7`, `results.length === 7`, the header comment) to 8; update README.txt lines ~285-289 to say 8/8 and name the Check CSAT step and `--days-ahead`.
- [ ] Step 6: Measure before fixing the number: run `node tools/connector-e2e.mjs` and `node tools/connector-e2e.mjs --days-ahead 90`. Prediction: 8/8 both. Disproved by any failure, or by an empty preview on either date. Put both measured outputs in the commit body.
- [ ] Step 7: Run the Check line. Commit.

### Task 6: M2 demo csat line and the full M2 gate

Depends: 5
Timeout: 40m
Check: `node --test connector/test/demo.test.mjs 2>&1 | tail -8 && node --test "connector/test/*.test.mjs" 2>&1 | tail -12 && node --test --test-reporter=spec test/*.test.mjs 2>&1 | tail -12`
Expect: fail 0

**Files:**
- Modify: `tools/connector-demo.mjs`, `connector/test/demo.test.mjs`, `README.txt` (the demo line, if any), `connector/CONNECTORS.md` (only if it lists the demo lines)

**Interfaces:**
- Produces: a new demo summary line `csat: <n> rows` printed between the `accounts:` and `push:` lines (the demo adds `GET /v1/csat?since=2026-09-01T00:00:00Z`, using the default fixture, so the fixed-date row count is stable; measure it with `node tools/connector-demo.mjs | tail -8` before writing the test and write that number in).

- [ ] Step 1: Run `node tools/connector-demo.mjs | tail -8` and note the current six summary lines and the CSAT row count the route returns (measure, do not guess).
- [ ] Step 2: Edit `connector/test/demo.test.mjs` `t15`: tail becomes the last 7 lines; `tail[3]` is `csat: <measured n> rows`; push, ai, demo lines move up one index. Rename the title to `seven summary lines`. Run it; confirm red.
- [ ] Step 3: Add the csat call and `say(...)` line to `tools/connector-demo.mjs` (guard `expect(csat.status === 200, 'csat')`).
- [ ] Step 4: Run the Check line (this is the M2 gate: connector suite, full suite, csat tests, and the locked `csat-no-network` test unchanged).
- [ ] Step 5: Confirm `git diff --stat main..HEAD -- test/csat-no-network.test.mjs osm-book-of-business-tracker-1.0.html` is empty. Commit.

### Task 7: M3 launcher core (connector, 8801 server, headless ready, cleanup)

Depends: 6
Timeout: 40m
Tokens: 600000
Check: `node --test test/team-demo.test.mjs 2>&1 | tail -15`
Expect: fail 0

**Files:**
- Create: `tools/team-demo.mjs`, `test/team-demo.test.mjs`, `docs/evidence/team-demo-seed.js` is NOT needed: write the connector-address seed to the temp folder at launch.

**Interfaces:**
- Produces: `node tools/team-demo.mjs [--headless] [--no-open] [--exit-after-ready]`. Prints `team-demo: ready http://127.0.0.1:8801/ walkthrough=<url> built=<url> connector-pid=<pid> pids=<comma list>` on one line when all children are up. With `--exit-after-ready` it then shuts down cleanly (exit 0). If 8801 is taken it prints `team-demo: port 8801 is in use, stopping` and exits 2 without starting a connector.
- Behaviour: starts `connector/server.mjs` on port 0 with a temp config (gong fake with `rebaseToToday:true`, gainsight fake, snowflake fake with `rebaseToToday:true, fixture:'demo'`, ai fake), temp token file, temp log, temp state folder under `os.tmpdir()/team-demo-XXXX`; serves `osm-book-of-business-tracker-1.1.html` and `demo-seed.js` and a generated `demo-connector-seed.js` (sets the connector address and token on that origin only, so the tracker file does not change) on 127.0.0.1:8801 with a zero-dependency `node:http` server (bind 127.0.0.1 only); Ctrl+C, SIGTERM, an uncaught crash and Chrome exiting each stop every child it started by PID (use `taskkill /PID <pid> /T /F` on Windows, `process.kill(pid)` elsewhere) and delete the temp folder. Never targets :8790 or :8800.

- [ ] Step 1: Write `test/team-demo.test.mjs` test 1: run `node tools/team-demo.mjs --headless --no-open --exit-after-ready` twice in a row (spawnSync, 60 s timeout each). Each run: exit 0; stdout contains the `ready` line; the temp folder named in the output no longer exists; the connector pid is gone (`process.kill(pid, 0)` throws); a `net` connect to 127.0.0.1:8801 and to the connector port is refused after exit. Test 2: occupy 127.0.0.1:8801 with a `net` server in the test, run the launcher, expect exit 2 and the "in use" message and that no connector pid was printed; close the server in `finally`. If 8801 is already taken on the machine when the test starts, the test must skip with a stated reason, not fail or kill anything.
- [ ] Step 2: Run; confirm red (file does not exist).
- [ ] Step 3: Implement the launcher core: free-port discovery for the connector by reading its `listening http://127.0.0.1:PORT` and `token` lines as `tools/connector-e2e.mjs` does (reuse `tools/e2e-cleanup.mjs` helpers `removeDir`, `waitForExit`).
- [ ] Step 4: Implement the shutdown paths and the `--exit-after-ready` flag.
- [ ] Step 5: Add test 3 to the test file: with the launcher kept alive (no `--exit-after-ready`), fetch `http://127.0.0.1:8801/osm-book-of-business-tracker-1.1.html` and the seed file (both 200), then send the launcher a termination signal by its PID and assert the same cleanup. (On Windows a signal may not run handlers; if so, expose a `/__stop` path on the 8801 server that is only honoured from 127.0.0.1 and the test uses that.)
- [ ] Step 6: Run the Check line twice. Confirm the temp folder is gone and `netstat`-free by the test's own asserts. Commit.

### Task 8: M3 walkthrough page and Chrome opener

Depends: 7
Timeout: 40m
Tokens: 600000
Check: `node --test test/team-demo.test.mjs 2>&1 | tail -15`
Expect: fail 0

**Files:**
- Modify: `tools/team-demo.mjs`, `test/team-demo.test.mjs`
- Create: `tools/team-demo/walkthrough.html` (static page, no external requests, tokens defined in its own `:root`)

**Interfaces:**
- Consumes: Task 7 launcher. Produces: `GET /walkthrough` on 127.0.0.1:8801. Chrome open: without `--no-open`/`--headless`, spawn Chrome (find it as `tools/connector-e2e.mjs` does) with `--user-data-dir=<temp>/chrome-profile --no-first-run --no-default-browser-check` on the walkthrough URL; `--headless` runs the same with `--headless=new` and a debugging port for captures (Task 10).

- [ ] Step 1: Add tests: `GET /walkthrough` returns 200 HTML containing five numbered steps whose headings contain exactly: `Check for calls`, `Read Gainsight accounts`, `Check CSAT`, `Send to Gainsight`, `Health`; each step has a line starting `What the real connector does:`; the page text names the adapters as fake and unproven (from the live `/v1/health`, fetched by the page itself with the bearer token from the demo seed); the page contains no `http://` or `https://` URL other than 127.0.0.1 and `localhost`.
- [ ] Step 2: Run; confirm red.
- [ ] Step 3: Write the walkthrough page. Each step has a button or link that opens the tracker (`/osm-book-of-business-tracker-1.1.html`) and a one-line instruction (Check for calls: shows 5 matched, 1 no-account; Read Gainsight accounts; Check CSAT then dry run then Apply; Send to Gainsight shows 2 sent and 1 failed; Health line names each adapter as fake or unproven).
- [ ] Step 4: Chrome opener with the temp `--user-data-dir`; the launcher stops when that Chrome exits; the test asserts the Chrome command line (expose it in the `ready` line as `chrome-profile=<path>`) is under the temp folder and not Ian's profile.
- [ ] Step 5: Run the Check line. Commit.

### Task 9: M3 "how it's built" page and the evidence counts file

Depends: 8
Timeout: 40m
Tokens: 600000
Check: `node --test test/team-demo.test.mjs 2>&1 | tail -15 && node tools/team-demo.mjs --headless --no-open --exit-after-ready | grep -c 'built='`
Expect: 1

**Files:**
- Modify: `tools/team-demo.mjs`, `test/team-demo.test.mjs`
- Create: `tools/team-demo/built.html`, `docs/evidence/team-demo-counts.json`

**Interfaces:**
- Produces: `GET /built` and `GET /built.json` (`{connector:{tests,pass,fail,ranAt}, adapters:{gong,gainsight,ai,snowflake}, evidence:[{label,count,commit,date}]}`). The connector suite runs LIVE at launch (spawn `process.execPath` with `--test` and an explicit file list built with `readdirSync('connector/test')`, no glob, about 2 s) and its pass count is parsed from the tap or spec summary. Adapter states come from the live `/v1/health` (names `fake` or `gong-rest`, etc.; the page says "unproven" for anything not fake; `snowflake-sql (unproven)` appears once Task 13 lands). Every other count (1.1 selfcheck, step 1 probe, 1.0 selfcheck 475, guide 18, main suite) is read from `docs/evidence/team-demo-counts.json`, shown with its commit and date, never typed into the page.
- The page content (safety rails, one line each): 127.0.0.1 only; bearer token; dry-run default; write gate; sandbox first; idempotent item ids; offline rule (the tracker changes nothing when the connector is down).

- [ ] Step 1: Create `docs/evidence/team-demo-counts.json` from numbers you MEASURE in this task by running each command once (1.1 selfcheck per README, step 1 probe, 1.0 selfcheck 475 per README, guide 18 per README, the full `node --test --test-reporter=spec test/*.test.mjs` summary); each entry stores the command, the count, `git rev-parse --short HEAD` and today's date from `date -u`.
- [ ] Step 2: Add tests: `/built.json` `connector.pass` equals the pass count of a second independent run of the connector suite in the test (same explicit file list) and `fail` is 0; every `evidence[]` entry has `commit` and `date`; `/built` HTML contains each safety rail phrase and one `fake` or `unproven` word per adapter; no digits-only count literal in `tools/team-demo/built.html` (counts come from JSON: assert the file has no `/\b(503|475|180|72)\b/`).
- [ ] Step 3: Run; confirm red.
- [ ] Step 4: Implement the live suite run at launch, the two routes and the page. Print `built=<url>` in the `ready` line (Task 7 already reserves it).
- [ ] Step 5: Run the Check line. Commit.

### Task 10: M3 per-step captures for the look critic

Depends: 9
Timeout: 40m
Look: true
Captures: docs/evidence/team-demo-captures/*.png
Check: `node tools/team-demo-capture.mjs docs/evidence/team-demo-captures && ls docs/evidence/team-demo-captures | grep -c '\.png$'`
Expect: 6

**Files:**
- Create: `tools/team-demo-capture.mjs`, `docs/evidence/team-demo-captures/` (6 PNG files), `test/team-demo-capture.test.mjs`
- Modify: `tools/team-demo.mjs` only if it needs a `--capture-port` flag

**Interfaces:**
- Produces: `node tools/team-demo-capture.mjs <outdir>`: starts the launcher in headless mode with a debugging port, Chrome in a temp `--user-data-dir`, viewport 1440x900, and writes `01-check-for-calls.png`, `02-read-accounts.png`, `03-check-csat-dry-run.png`, `04-send-to-gainsight.png`, `05-health.png`, `06-how-its-built.png` (one per walkthrough step plus the built page). It drives the tracker with the real buttons through CDP the way `tools/connector-e2e.mjs` does.

- [ ] Step 1: Write `test/team-demo-capture.test.mjs`: the script's source takes an output dir argument, names the 6 files above, writes only inside that dir and the temp folder, and refuses a non-empty `--user-data-dir` outside `os.tmpdir()`. Run red.
- [ ] Step 2: Implement the capture script (reuse launcher functions by importing a `startTeamDemo()` export; if Task 7 did not export one, add it without changing the CLI behaviour).
- [ ] Step 3: Run the Check line. Then open each PNG with the Read tool and verify it shows what it claims (right subject, no overlay, no blank area): step 1 shows the call preview with 5 matched and 1 no-account, step 3 shows the CSAT dry run, step 4 shows 2 sent and 1 failed. A capture failing this is a defect: fix and re-run, do not commit it.
- [ ] Step 4: Commit the PNGs and the script. The look critic and PM first pass read these files; both page looks are taste calls for Ian's batch, not for this task. Do not self-approve looks.

### Task 11: M1 Snowflake key-pair JWT and the statement guard

Depends: 6
Timeout: 40m
Check: `node --test connector/test/snowflake-sql-auth.test.mjs 2>&1 | tail -12`
Expect: fail 0

**Files:**
- Create: `connector/lib/snowflake-jwt.mjs`, `connector/lib/snowflake-guard.mjs`, `connector/test/snowflake-sql-auth.test.mjs`

**Interfaces:**
- Produces: `buildSnowflakeJwt({ account, user, privateKeyPem, now }) -> string` (RS256 via `node:crypto` only; `iss = ACCOUNT.USER.SHA256:<base64 sha256 of the public key DER>`, `sub = ACCOUNT.USER`, both uppercased; `iat = now`, `exp = iat + 3600` at most); `publicKeyFingerprint(privateKeyPem) -> string`; `assertReadOnlySql(sql) -> string` (returns the statement with one trailing semicolon removed; throws if, after stripping `--` and `/* */` comments, it does not start with SELECT or WITH, or has any other semicolon). Tests use a throwaway RSA key generated in the test with `generateKeyPairSync`; no key file is committed.

- [ ] Step 1: Write exactly 6 tests: (jwt-1) header is `{alg:'RS256',typ:'JWT'}` and the signature verifies with the public key; (jwt-2) `iss`/`sub` uppercase and `iss` has the `SHA256:` fingerprint of the throwaway key; (jwt-3) `exp - iat <= 3600`, and an error is thrown if a caller asks for more; (guard-1) accepts `SELECT 1`, a leading comment then `WITH x AS (SELECT 1) SELECT * FROM x;`; (guard-2) rejects `DROP TABLE t`, `SELECT 1; DELETE FROM t` and an empty string; (guard-3) the error text never contains the private key.
- [ ] Step 2: Run; confirm red.
- [ ] Step 3: Implement both modules, zero dependencies.
- [ ] Step 4: Run the Check line. Prediction: 6 pass. Commit.

### Task 12: M1 snowflake-sql adapter, documented-shape fixtures, index wiring

Depends: 11
Timeout: 40m
Tokens: 600000
Check: `node --test connector/test/snowflake-sql.test.mjs connector/test/snowflake.test.mjs connector/test/server.test.mjs 2>&1 | tail -15`
Expect: fail 0

**Files:**
- Create: `connector/adapters/snowflake-sql.mjs`, `connector/fixtures/vendor/snowflake-200.json`, `snowflake-202-then-200.json`, `snowflake-multi-partition.json`, `snowflake-422.json`, `snowflake-429.json`, `connector/test/snowflake-sql.test.mjs`
- Modify: `connector/adapters/index.mjs` (remove the parked throw, add `snowflake: { fake, 'snowflake-sql' }`, add to `REAL`), `connector/test/snowflake.test.mjs` (the one test titled `snowflake: any adapter name other than fake throws the parked-stage-2 message`: change it to assert an unknown name such as `snowflake-rest` throws `adapter not built: snowflake-rest`)

**Interfaces:**
- Consumes: Task 11 `buildSnowflakeJwt`, `assertReadOnlySql`; the injection pattern of `gong-rest.mjs` (`factory(cfg, { fetchImpl, stateDir, sleep, now, ... })`).
- Produces: `create(cfg, opts) -> { name: 'snowflake-sql (unproven)', listCsat({since}) }`. Config keys: `account, user, privateKeyFile, warehouse, role, database, schema, sqlFile, timeoutSec, pollCapMs`. Call: `POST https://<account>.snowflakecomputing.com/api/v2/statements` with statement, warehouse, role, database, schema, timeout and `parameters: {MULTI_STATEMENT_COUNT: '1'}`. A 202 is polled with backoff up to `pollCapMs`; a 429 retries with jittered backoff using the same requestId and `retry=true`; partitions are fetched in turn; columns are mapped by name to the five CSAT fields and a missing column throws an error naming it. Fixtures are labelled `"_label": "documented-shape: built from Snowflake docs, not recorded from a real reply"`.

- [ ] Step 1: Write exactly 7 tests in `snowflake-sql.test.mjs` with `fetchImpl` injected and `sleep` stubbed (all under `connector/lib/test-net-guard.mjs`, asserting zero non-loopback attempts): (s1) 200 maps rows by column name to the five fields; (s2) 202 then 200 polls and returns rows; (s3) multi-partition fetches every partition in order; (s4) 429 retries with the SAME requestId and `retry=true`; (s5) 422 throws an error carrying the status and no credential text; (s6) a result missing a column throws an error naming that column; (s7) the Authorization header is `Bearer <jwt>` with `X-Snowflake-Authorization-Token-Type: KEYPAIR_JWT`, and the private key text never appears in any log line or error.
- [ ] Step 2: Run; confirm red.
- [ ] Step 3: Write the five fixtures from Snowflake's documented response shape (resultSetMetaData.rowType names, `data` arrays, `partitionInfo`), then the adapter.
- [ ] Step 4: Update `index.mjs` and the one changed test in `snowflake.test.mjs`.
- [ ] Step 5: Run the Check line, then `node --test "connector/test/*.test.mjs" 2>&1 | grep -E "^. (tests|pass|fail)"`. Prediction (measure it): 180 + 6 (Task 11) + 7 = 193 so far, 0 failures. Commit.

### Task 13: M1 health text, --check SKIP lines, CONNECT-SNOWFLAKE.md

Depends: 12
Timeout: 40m
Check: `node --test connector/test/snowflake-check.test.mjs connector/test/snowflake.test.mjs connector/test/check.test.mjs 2>&1 | tail -12 && node connector/server.mjs --help 2>&1 | head -3`
Expect: fail 0

**Files:**
- Create: `connector/test/snowflake-check.test.mjs`
- Modify: `connector/lib/check.mjs`, `connector/config.example.json` (only keys with empty placeholders, no secrets), `connector/CONNECT-SNOWFLAKE.md`, `connector/CONNECTORS.md`, `README.txt` (the adapter line from Task 1), `tools/connector-e2e.mjs` is NOT touched

**Interfaces:**
- Consumes: Task 12 adapter name `snowflake-sql (unproven)`. Produces: `/v1/health` shows `snowflake-sql (unproven)` for a config naming it (until a `--check` read proof, as for gong-rest); `--check` gains Snowflake steps (config present, key file readable, JWT builds, one read that returns a row count only). On `connector/config.example.json` every Snowflake step prints a SKIP line and nothing prints FAIL.

- [ ] Step 1: Read how `check.mjs` handles gong-rest (line ~45 `gong proof recorded`). Write exactly 4 tests in `snowflake-check.test.mjs`: (c1) health for a config naming `snowflake-sql` (with a stubbed adapter or a throwaway key) contains `snowflake-sql (unproven)` and validates the health schema; (c2) `--check` on `connector/config.example.json` prints only PASS or SKIP lines for Snowflake and no FAIL; (c3) a configured `--check` prints the row COUNT only, never a row value; (c4) `CONNECT-SNOWFLAKE.md` contains the admin request (attach the public key; a read-only role with USAGE and SELECT), the sentence that the network-policy question is UNCONFIRMED for this account, and still the headings that `snowflake.test.mjs` requires (`## What stage 2 fills in`, `## Column mapping`, `## Token handling`, `stage 2 (parked)`), or update that test's list in the same commit if you rename a heading.
- [ ] Step 2: Run; confirm red.
- [ ] Step 3: Implement the `--check` steps and the health name; edit the docs. Update the README Connector paragraph: snowflake-sql is built, zero dependencies, unproven until `--check`.
- [ ] Step 4: Run the Check line, then `node --test "connector/test/*.test.mjs" 2>&1 | grep -E "^. (tests|pass|fail)"`. Prediction (measure it): 180 + 6 + 7 + 4 = 197, 0 failures; state N = 17 new tests in the commit body. Run `node --test test/readme-counts.test.mjs` too. Commit.

### Task 14: M0b S1 and S2 checks (desk card and pre-1.2 reason)

Depends: 13
Timeout: 40m
Check: `N=$(grep -o -m1 '1.1.html --seed demo-seed.js --expect [0-9]*' README.txt | grep -o '[0-9]*$') && node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect $N | tail -4`
Expect: console errors: 0

**Files:**
- Modify: `tools/selfchecks-1.1.js`, `README.txt`, `docs/HOSTING.md`, `test/hosting-docs.test.mjs`, `test/selfcheck-exit.test.mjs` (count moves by exactly the checks added: S1 edits a check (+0), S2 adds one (+1), so base + 1 = 504 expected if Task 3 did not move the 503 base; the measured count is what goes in README.txt)
- Reference (read only): `C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-1.2-d3-race/.ledger/2026-10-20-runway-sim-c5-d3/reviews/look-fixes-final.md`

- [ ] Step 1: Read the reference review for items S1 and S2. S1: the FX4 check computes `found = !dis && !conf`, which passes when the desk card is absent; it must fail when the card is not rendered. S2: a new check must click the desk "Add a reason" on a pre-1.2 item and assert the reason is written.
- [ ] Step 2: RED first: for S1 write a mutant that removes the desk card from the rendered page (or a `--pre` script like `test/selfcheck-console-error.pre.js`) and show that the OLD check still passes and the NEW check fails; put both outputs in the commit body. For S2 show the new check fails when the click handler is removed.
- [ ] Step 3: Strengthen the FX4 check (S1) and add the S2 check. S1 edits an existing check (count +0); S2 adds one (+1). If the change adds two separate checks, the count moves by 2: the Check line's number must equal the measured result, so measure `--expect` first with a deliberately wrong number and read the real count from the output, then set it.
- [ ] Step 4: Update the count in README.txt (both lines), docs/HOSTING.md, `test/hosting-docs.test.mjs`, `test/selfcheck-exit.test.mjs`; run `node --test test/readme-counts.test.mjs test/hosting-docs.test.mjs test/selfcheck-exit.test.mjs`.
- [ ] Step 5: Run the Check line (it reads the count from README.txt, so README.txt must hold the measured number). Commit.

### Task 15: M0b S3 measure, N1 stale comment, N2 changelog figure

Depends: 14
Timeout: 40m
Check: `node --test test/changelog-12.test.mjs test/look-calls-text.test.mjs 2>&1 | tail -10`
Expect: fail 0

**Files:**
- Modify: `osm-book-of-business-tracker-1.1.html` (the stale comment, N1), `CHANGELOG.txt` (N2), `docs/evidence/` (the S3 measurement note `docs/evidence/2026-10-22-rail-reserve-zero-slack.md`)

- [ ] Step 1: Read the reference review (path in Task 14) for S3, N1, N2. S3: measure the zero-slack case of the rail reserve (assumed, not measured). N1: fix the stale comment. N2: back the CHANGELOG figure with a capture, or drop the figure.
- [ ] Step 2: S3: with headless Chrome (temp `--user-data-dir`), load the 1.1 html with `demo-seed.js` at a viewport where the rail reserve has zero slack, read the reserve and the rail position through CDP, and write the measured numbers, the viewport and the command to the evidence note. If the measurement disproves the assumption, say so in the note and stop this task with `NEEDS DECISION` in the commit body rather than changing behaviour.
- [ ] Step 3: N2: if a capture of the CHANGELOG figure's claim can be made with the same CDP script, save it under `docs/evidence/` and cite its filename in the CHANGELOG line; otherwise drop the figure. Add or adjust a text test in `test/changelog-12.test.mjs` that fails on the parent (the figure present without a citation) and passes after.
- [ ] Step 4: N1: fix the comment text only (no behaviour change), and confirm with the 1.1 selfcheck that the count is unchanged.
- [ ] Step 5: Run the Check line. Commit.

### Task 16: M0b N3 desk reason must not confirm an unreviewed signal

Depends: 15
Timeout: 40m
Tokens: 600000
Check: `node --test test/desk-reason-confirm.test.mjs 2>&1 | tail -10 && N=$(grep -o -m1 '1.1.html --seed demo-seed.js --expect [0-9]*' README.txt | grep -o '[0-9]*$') && node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect $N | tail -4`
Expect: console errors: 0

**Files:**
- Create: `test/desk-reason-confirm.test.mjs`
- Modify: `osm-book-of-business-tracker-1.1.html` (the desk "save a reason" handler), `tools/selfchecks-1.1.js` (if you add a selfcheck, the count moves by exactly that many; update README.txt, docs/HOSTING.md and the two tests as in Task 14; the Check line reads the count from README.txt)

- [ ] Step 1: Read the reference review (path in Task 14) for N3, then find the desk reason save code with `grep -n "Add a reason" osm-book-of-business-tracker-1.1.html`. N3: saving a reason from the desk must not also confirm an unreviewed signal on the same account. This is a behaviour change; the PM proxy ruled it the most reversible option, so keep it a small isolated edit.
- [ ] Step 2: Write `test/desk-reason-confirm.test.mjs` (load the function the way `test/csat-plan-match.test.mjs` loads tracker functions, or drive the page with CDP like `tools/connector-e2e.mjs`): an account has one unreviewed signal; saving a reason from the desk writes the reason and leaves that signal unreviewed (`confirmed` unchanged). Run it; confirm red on the current html.
- [ ] Step 3: Make the edit. Re-run the test (green) and the locked tests `node --test test/csat-no-network.test.mjs`.
- [ ] Step 4: Run the 1.1 selfcheck; the count must equal the number in README.txt (the Check line reads it from there; if you add a selfcheck, update README.txt first).
- [ ] Step 5: Look call 6 (the reason line printed once per signal; PM pick: print once) is NOT done here: it goes in Ian's batch. Write that one line in the commit body. Run the Check line. Commit.

---

## Self-review notes

- Spec coverage: M0a Task 1; M2 Tasks 2-6 (time-proof data first, ids of 15 or more, Check CSAT through the existing plan builder, e2e 8/8 today and +90 days, demo csat line); M3 Tasks 7-10 (launcher, walkthrough, built page with live suite count and committed evidence counts, per-step captures); M1 Tasks 11-13; M0b Tasks 14-16. The optional request panel is deliberately not planned.
- Locked files: `test/csat-no-network.test.mjs`, the 1.0 html, the three fixed-date fixtures and `tools/step*-probe.js` counts are in no task's Files list except as read-only or README text.
