# Runway fake-book on the v13 look - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the fake-book features (Check CSAT button, desk card, desk reason handler, team-demo launcher and captures) on the v13 look, with the live Gainsight/Snowflake connection plainly parked, then merge to `runway-v13-look`.

**Architecture:** Merge local branch `runway-v13-look` (f086a14, same as origin) into `runway-fake-book-v13` (= fake-book 8f0e766 tip), resolve 4 conflict hunks keeping both sides, measure every count, then prove each fake-book tracker feature works on the v13 screens with one red-first check per feature. Reshoot the demo captures, audit that nothing live is on by default, write one evidence doc, review, merge.

**Tech Stack:** Node (zero dependencies, `node:test`), single-file HTML trackers, headless Chrome over CDP with a fresh `--user-data-dir`, git.

**Spec:** `docs/RUNWAY_FAKE_BOOK_V13_RUN_PROMPT.txt` (TO DO 1a-1f, 2, 3; SAFETY binding). Feature detail: `docs/superpowers/plans/2026-10-22-runway-fake-book.md` (T4, T10, T14, T16). Ian's three look issues: `C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book/runs/2026-10-22-runway-fake-book/RUNWAY_LOOK_FIX_PROMPT.txt` (read only).

Suite: node --test --test-reporter=spec "test/*.test.mjs" "connector/test/*.test.mjs"
Data: (none)

Worktree (every Check line starts with this): `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13"`. Branch `runway-fake-book-v13`.

## Global Constraints

Workers do NOT load CLAUDE.md. These apply to every task.

- Test first. A new check must FAIL on the parent commit and PASS after. If a v13 feature already works on the merge, the check is still written, shown red against a mutant (remove the button or handler in memory or via a `--pre` script like `test/selfcheck-console-error.pre.js`) and green on the real file; say "no defect, regression guard" in the commit body. Never invent a defect.
- LOCKED, no edit without Ian's ruling: `osm-book-of-business-tracker-1.0.html`; `test/csat-no-network.test.mjs`; `tools/sim/osm-day/steps-a.mjs`, `steps-b.mjs`, `lib/breaks.mjs` (brain `runway-d3-race-locked-line` is a one-off yes for one line already merged; it covers no other edit); the three fixed-date fixtures in `connector/fixtures/`; expected counts in `tools/step*-probe.js`.
- A tracker function that calls the connector must not have a name starting with `csat` (the locked no-network test scans every `csat*` function).
- Editing the 1.1 html changes its sha256. After every html edit run `node tools/repin.mjs` (it rewrites `docs/HOSTING.md` and `tools/sim/osm-day/verify.mjs` from the working file; it refuses CR bytes) and commit the pins with the edit.
- Counts are re-measured, never added. A count in README.txt, docs/HOSTING.md, `test/hosting-docs.test.mjs`, `test/selfcheck-exit.test.mjs`, `test/readme-counts.test.mjs` is written only from a run of its command in this task, with command and number in the commit body.
- SAFETY: $0 spend; no installs; no network except 127.0.0.1; ports 127.0.0.1:8801 only for this work, never 8790 or 8800; no real Gainsight, Snowflake or Gong credentials or calls; Chrome only with a fresh temp `--user-data-dir`, never Ian's profile; never read his real book, `*RESTORE-POINT*` files or real CSAT file; stop processes by PID only (ones you started); publish nothing; never touch master (fd3a09c).
- `node --test <folder>` runs nothing on Node 26: pass explicit files or a quoted glob.
- Do not edit while a suite or selfcheck you started is still running.
- Commit message `task N: <title>`; end with the attribution lines the session gives. No push except Task 11 (backup branch, then the merge push).

## Baselines (measured by me just now vs only read)

MEASURED by the plan writer today with `git show <branch>:<file> | grep -c ...` and `grep -n` (no suite run: my shell cannot run suites):
- Merge base of `runway-fake-book-v13` and `runway-v13-look` = fd3a09c. Diff `HEAD...runway-v13-look` = 29 files, +3854/-155; files touching both sides: README.txt, docs/HOSTING.md, CHANGELOG.txt, 1.1 html, tools/selfchecks-1.1.js, tools/sim/osm-day/verify.mjs, plus test/capture-guard.test.mjs and test/d3-agenda-sim.test.mjs.
- 1.1 html hook counts, fake-book tip vs `runway-v13-look` (lines containing the text): `btn-check-survey-connector` 2 vs 0; `surveyRowsToTable` 2 vs 0; `Add a reason` 2 vs 3; `openDeskRiskConfirm` 2 vs 2; `btn-check-calls` 2 vs 3; `dk-risk` 29 vs 29. So T4's two names exist only on the fake-book side and must come through the merge intact; T14/T16 touch code both sides also have (`openDeskRiskConfirm`, `Add a reason`).
- README `--expect` for tracker 1.1: 504 on fake-book (lines 210, 310), 560 on look (lines 210, 308). Step 1 probe: 72 fake-book, 65 look. Step 0 probe 34 and FX1 probe 2 on both. `check('` lines in `tools/selfchecks-1.1.js`: 504 vs 560 (a line count, not the run count).
- Fake-book `test/desk-reason-confirm.test.mjs` has 2 tests; `selfchecks-1.1.js` already holds the S1 (FX4 desk card required) and S2 checks.

READ only (claims from the run prompt, not re-run): look f086a14 sc 560/560, tests 597/595/0 fail/2 skip, sim 1.1 22/22 exit 0; fake-book connector suite 180/180 at fd3a09c, step 1 probe 72/72, connector-e2e 8/8.

TO BE MEASURED by Task 2 (the plan holds no expected number for these): merged 1.1 selfcheck count (guess 561 = 560 + S2; it is a guess), merged step 1 probe count, node test totals, connector suite total, connector-e2e, sim 1.1 and 1.0 results, d2/d3/l11/l12 checks, launcher health. Later tasks that say "the Task 2 number" read it from `docs/evidence/2026-10-22-fake-book-v13-merge-numbers.md`.

## Order, groups, estimates, paid calls

Groups: A (merge and gate) = Tasks 1-2. B (features on v13 screens) = Tasks 3-6. C (captures, look) = Task 7. D (parked audit, evidence) = Tasks 8-9. E (review, merge) = Tasks 10-11. Cut from the end only if told: none of A-D may be cut. No tune tasks. Locked files: listed in Global Constraints.

| Task | Group | Helper-token estimate |
|---|---|---|
| 1 merge | A | 90k |
| 2 full checks | A | 80k |
| 3 T4 Check CSAT | B | 150k |
| 4 T14 desk card | B | 130k |
| 5 T16 desk reason | B | 130k |
| 6 other breaks from Task 2 | B | 100k |
| 7 T10 reshoot [IAN: look] | C | 130k |
| 8 parked-live audit | D | 90k |
| 9 evidence doc | D | 70k |
| 10 final review | E | 250k |
| 11 merge | E | 80k |

Run total: about 1,300k helper tokens before review fix rounds. Paid calls: none ($0). Codex read-only review in Task 10 uses the already-logged-in `codex exec` CLI; it adds no per-call spend I can measure (open question whether Ian counts it).

## Expected breaks

- README step 1 probe lines all expect 72 | fixed by Task 1 (a naive merge keeps look's 65 on some lines; Task 1 writes the measured number)
- README has no stale 502 or 65 expect counts | fixed by Task 1
- README 1.1 selfcheck lines agree with each other and with HOSTING.md | fixed by Task 1
- HOSTING.md carries the sha256 of the current 1.1 tracker* | fixed by Task 1 (and again by Tasks 3, 4, 5, 6 via repin)
- FX1 selfcheck exits 1 and prints* | fixed by Task 1 (its `--expect` count)
- sha256 pin check inside tools/sim/osm-day/verify.mjs | fixed by Task 1 (`node tools/repin.mjs`)

---

## Task 1: Merge runway-v13-look into runway-fake-book-v13 (A)

Depends: none
Timeout: 40m

**Files:**
- Modify (conflicts): `README.txt` (2 hunks, counts), `docs/HOSTING.md` (1 hunk, sha256), `tools/sim/osm-day/verify.mjs` (1 hunk, sha256 pin)
- Modify (counts after merge): `test/hosting-docs.test.mjs`, `test/selfcheck-exit.test.mjs`, `test/readme-counts.test.mjs` only where a count there now disagrees with a measured one
- Do not touch: the 1.1 html and `tools/selfchecks-1.1.js` text (they merged with no conflict; this task does not edit them)

**Interfaces:**
- Produces: a merge commit on `runway-fake-book-v13` whose 1.1 html contains both look's v13 screens and `btn-check-survey-connector`, `surveyRowsToTable`, `checkSurveyDatesViaConnector`; counts in README.txt equal to what the commands print (Task 2 re-checks).

- [ ] Step 1: Confirm a clean start and the parent: `git status --short` prints nothing; `git rev-parse --short HEAD`; `git rev-parse --short runway-v13-look` prints f086a14.
- [ ] Step 2: `git merge --no-ff --no-commit runway-v13-look`. Expect exactly README.txt, docs/HOSTING.md, tools/sim/osm-day/verify.mjs in conflict (4 hunks). If the list differs, stop and write what differs in the commit body.
- [ ] Step 3: Resolve keeping both sides. README.txt: keep prose from both; for each `--expect N` line run the command (README lines ~210-213 and ~308-313) and write the printed number, never an addition. Keep the fake-book "8/8 passed" e2e line and the `snowflake-sql` wording.
- [ ] Step 4: `node tools/repin.mjs` (prints `repinned 1.1 <8 hex>`); this resolves the HOSTING.md and verify.mjs hunks from the merged html. `grep -c '<<<<<<<\|>>>>>>>' README.txt docs/HOSTING.md tools/sim/osm-day/verify.mjs` must show 0 for each.
- [ ] Step 5: `node --test test/readme-counts.test.mjs test/hosting-docs.test.mjs test/selfcheck-exit.test.mjs test/capture-guard.test.mjs test/d3-agenda-sim.test.mjs`. Fix only counts (the numbers you just measured) until green.
- [ ] Step 6: `git add -A && git commit` with the merge message, the four hunks named, and each measured count with its command in the body.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && git log -1 --format=%p | wc -w && git merge-base --is-ancestor runway-v13-look HEAD && echo look-in-branch && grep -c 'btn-check-survey-connector' osm-book-of-business-tracker-1.1.html && node --test test/readme-counts.test.mjs test/hosting-docs.test.mjs test/selfcheck-exit.test.mjs 2>&1 | grep -E "^# (pass|fail)"`
**Expect:** `2` (two parents), `look-in-branch`, `2`, then `# fail 0`.
Red-first: before the commit, the same command fails (the Check run on parent 8f0e766 prints no `look-in-branch`).

## Task 2: Full checks on the merge, record every number (A)

Depends: 1
Timeout: 60m

**Files:**
- Create: `docs/evidence/2026-10-22-fake-book-v13-merge-numbers.md` (command, measured number, date, one line each; plus a "failures" list)
- Logs: write each run's output to `sim-runs/fake-book-v13/<name>.log` (git-ignored; if not ignored, add nothing to git) and quote only the last 6 lines

**Interfaces:**
- Produces: the numbers later tasks and Task 9 read. Each row: command | printed result | exit code.

- [ ] Step 1: 1.1 selfcheck: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 999 | tail -4`; the deliberate wrong `--expect` prints the real count. Record it, then re-run with that number: must exit 0 and print `console errors: 0`. If the count is not README.txt's number, fix README.txt, HOSTING.md and the two tests (measured value only).
- [ ] Step 2: Probes: step 0 (`--fn step0Probe`), step 1 (`--fn step1Probe`), FX1 (`--fn b2Fx1Probe`), `node tools/step1-coldstart.mjs`, 1.0 selfcheck (475) and the guide (18), each with the command from README.txt lines 206-214 and 316.
- [ ] Step 3: `node --test --test-reporter=spec "test/*.test.mjs" "connector/test/*.test.mjs" 2>&1 | tail -12`; record tests/pass/fail/skipped. Any failure goes in the "failures" list with its exact title.
- [ ] Step 4: `node tools/sim/osm-day/run.mjs --version 1.1` (1.1 must be 22/22, exit 0) and `--version 1.0` (7 known FAIL stay; record the count, do not fix). Ports: the sim uses its own; never 8790/8800.
- [ ] Step 5: `node tools/connector-e2e.mjs` (expect 8/8); `node tools/d2-prep-panel.mjs --check`; `node tools/d3-prep-panel.mjs --check`; `node tools/l11-csat-panel.mjs --check`; `node tools/l12-persist-check.mjs` (its header says its flag); `node tools/team-demo.mjs --headless --exit-after-ready` (the M3 launcher on 127.0.0.1:8801; it must print ready and exit 0, leave no temp folder).
- [ ] Step 6: Write the evidence file; for each FAIL add one line: "defect in v13 merge: yes/no, owner Task 3/4/5/6". Commit.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && grep -c '^| ' docs/evidence/2026-10-22-fake-book-v13-merge-numbers.md && grep -c 'exit' docs/evidence/2026-10-22-fake-book-v13-merge-numbers.md`
**Expect:** both numbers at least 14 (selfcheck, 6 probes/guide/1.0, node tests, sim 1.1, sim 1.0, e2e, d2, d3, l11, l12, launcher).
Red-first: the file does not exist on the parent, so the Check prints a grep error there.

## Task 3: T4 Check CSAT (connector) works on the v13 Settings screen (B)

Depends: 2
Timeout: 40m
Tokens: 600000

**Files:**
- Modify: `osm-book-of-business-tracker-1.1.html` only if the check shows a defect (Settings block holding `btn-check-survey-connector`; v13 Settings layout)
- Modify: `tools/selfchecks-1.1.js` (add one check, name starts `T4v13:`), README.txt / docs/HOSTING.md / the two count tests (count = Task 2 number + 1 added, confirmed by run), pins via `node tools/repin.mjs`
- Test: `test/connector-survey-pull.test.mjs` (already exists; keep green)

**Interfaces:**
- Consumes: `connectorConfigured()`, `connectorRequest`, `buildCsatImportPlan`, `openCsatImportModal`, `surveyRowsToTable(rows) -> string[][]`, `checkSurveyDatesViaConnector()`, button id `btn-check-survey-connector` (the 1.1 html names, unchanged).
- Produces: selfcheck `T4v13` in `tools/selfchecks-1.1.js`: with a stubbed connector config on the demo seed, open Settings on the v13 screen, assert `#btn-check-survey-connector` is present and visible (non-zero box, not covered), click it with a stub `connectorRequest` returning demo rows, assert the CSAT import modal opens with a changed, a filled, an unchanged and an unmatched row; with `connectorConfigured()` false, assert the button is absent.

- [ ] Step 1: Read `tools/selfchecks-1.1.js` around an existing Settings check (grep `btn-check-calls`) and write the `T4v13` check the same way.
- [ ] Step 2: RED: run the 1.1 selfcheck with the check and a mutant that renames the button id (via a `--pre` script) and show it fails; also run it on the unmodified merge. Put both outputs (the last 6 lines each) in the commit body. If the unmodified merge passes, write "no defect, regression guard".
- [ ] Step 3: If red on the real file: fix the html (smallest change: re-attach the button to the v13 Settings container, keep the `connectorConfigured()` conditional, no `csat*` name added). Re-run green.
- [ ] Step 4: `node --test test/connector-survey-pull.test.mjs test/csat-no-network.test.mjs test/csat-plan-match.test.mjs test/csat-modal.test.mjs`.
- [ ] Step 5: Run the selfcheck with the new count; update README.txt, HOSTING.md and the count tests; `node tools/repin.mjs`; run `node --test test/readme-counts.test.mjs test/hosting-docs.test.mjs test/selfcheck-exit.test.mjs`.
- [ ] Step 6: Commit (pins in the same commit).

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --verbose 2>&1 | grep -E "T4v13|console errors" ; node --test test/connector-survey-pull.test.mjs test/csat-no-network.test.mjs 2>&1 | grep -E "^# fail"`
**Expect:** a `T4v13` PASS line, `console errors: 0`, `# fail 0`.

## Task 4: T14 desk card (S1, S2) works on the v13 Desk (B)

Depends: 3
Timeout: 40m
Tokens: 500000

**Files:**
- Modify: `tools/selfchecks-1.1.js` (FX4 and S2 checks already merged; adjust only if the v13 desk markup changed their selectors), `osm-book-of-business-tracker-1.1.html` only if a defect shows, README.txt / HOSTING.md / count tests if the count moves, pins via `node tools/repin.mjs`
- Reference (read only): `C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-1.2-d3-race/.ledger/2026-10-20-runway-sim-c5-d3/reviews/look-fixes-final.md`

**Interfaces:**
- Consumes: the merged FX4 check (requires a rendered `.dk-risk` card holding the reason text, S1) and the S2 check (a real click on the desk "Add a reason" of a pre-1.2 confirmed item opens the reason modal, writes the reason, the desk shows "Confirmed as a risk").
- Produces: both checks reachable and passing on the v13 Desk; the count in README.txt equal to the run.

- [ ] Step 1: Run `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --verbose 2>&1 | grep -E "FX4|S2:|Call 3"` and record PASS/FAIL for each.
- [ ] Step 2: RED (S1): with a `--pre` script that removes every `.dk-risk` element after render, show the FX4 check FAILS (the card is required); RED (S2): with the "Add a reason" click handler removed in memory, show S2 FAILS. Last 6 lines of each in the commit body.
- [ ] Step 3: If either is red on the real merge, fix the v13 desk markup or the check selector; the html change is the smallest that makes the card render and the button clickable. No change to unrelated v13 screens.
- [ ] Step 4: Open the Desk of one demo account in headless Chrome (temp profile) and confirm by CDP that the open-risks card is on screen (non-zero box). Put the measured box in the commit body.
- [ ] Step 5: Update counts only if they moved (measured); `node tools/repin.mjs` if the html changed; `node --test test/readme-counts.test.mjs test/hosting-docs.test.mjs test/selfcheck-exit.test.mjs`. Commit.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --verbose 2>&1 | grep -E "FX4:|S2:|console errors"`
**Expect:** a PASS line each for `FX4:` and `S2:`, and `console errors: 0`.

## Task 5: T16 desk "save a reason" does not confirm an unreviewed signal, on the v13 Desk (B)

Depends: 4
Timeout: 40m
Tokens: 500000

**Files:**
- Modify: `test/desk-reason-confirm.test.mjs` (keep its 2 tests; add the page-level case below), `tools/selfchecks-1.1.js` (add one check `T16v13:` and bump counts by exactly 1, measured), `osm-book-of-business-tracker-1.1.html` only if a defect shows (`openDeskRiskConfirm` and the v13 desk "Add a reason" handler), README.txt / HOSTING.md / count tests, pins via repin

**Interfaces:**
- Consumes: `openDeskRiskConfirm(logKey) -> boolean`, `setRiskVerdict`, `riskItemHasReason`, the loader `loadCsat` from `tools/lib/csat-fixture.mjs`.
- Produces: selfcheck `T16v13`: on the demo seed give one account two signals, one legacy-confirmed (no reason) and one unreviewed; a real click on the v13 desk "Add a reason" saves the reason on the first and leaves the second with `verdict === undefined`.

- [ ] Step 1: Run `node --test test/desk-reason-confirm.test.mjs 2>&1 | tail -10`; record result on the merge (unit-level).
- [ ] Step 2: Write the `T16v13` selfcheck (page level, real click). RED: apply a mutant (via `--pre`) that makes the desk handler also call `setRiskVerdict` on every unreviewed signal of the account; show `T16v13` FAILS and the existing unit test fails on the same mutant if applied to the function source.
- [ ] Step 3: Run `T16v13` on the unmodified merge. If it fails, fix the v13 desk handler wiring (small isolated edit); if it passes, say "no defect, regression guard".
- [ ] Step 4: Run `node --test test/csat-no-network.test.mjs test/desk-reason-confirm.test.mjs`, then the selfcheck at the new measured count; update counts, `node tools/repin.mjs`, run the three count tests.
- [ ] Step 5: Look call 6 (print the reason once per signal) is not done here; it goes in Ian's batch (Task 7 notes it). One line in the commit body. Commit.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && node --test test/desk-reason-confirm.test.mjs 2>&1 | grep -E "^# (pass|fail)"; node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --verbose 2>&1 | grep -E "T16v13|console errors"`
**Expect:** `# fail 0`, a `T16v13` PASS line, `console errors: 0`.

## Task 6: Fix anything else Task 2 showed broken (B)

Depends: 5
Timeout: 40m
Tokens: 400000

**Files:**
- Modify: only files named by a failure in `docs/evidence/2026-10-22-fake-book-v13-merge-numbers.md` ("failures" list, "defect in v13 merge: yes"); html edits need `node tools/repin.mjs`
- If the list is empty: modify only `docs/evidence/2026-10-22-fake-book-v13-merge-numbers.md` (add the line "no other defects; Tasks 3-5 results appended") and stop at Step 2.

- [ ] Step 1: Re-run the failing command for each listed failure on the current HEAD (Tasks 3-5 may have fixed it); drop the ones now green.
- [ ] Step 2: For each remaining failure write the red test or check first (a test that fails now), show it red, fix with the smallest edit, show green.
- [ ] Step 3: Re-run the whole Task 2 command list on the new HEAD and write the second column of numbers ("after Tasks 3-6") into the evidence file. Counts equal the runs.
- [ ] Step 4: Commit.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && node --test --test-reporter=spec "test/*.test.mjs" "connector/test/*.test.mjs" 2>&1 | grep -E "^# (tests|pass|fail|skipped)" ; node tools/sim/osm-day/run.mjs --version 1.1 2>&1 | tail -3`
**Expect:** `# fail 0`; sim 1.1 summary 22/22 and exit 0 (check `echo` of the exit in the log).

## Task 7: [IAN: look] Reshoot the team-demo captures on the v13 look (C)

Depends: 6
Timeout: 60m
Look: true
Captures: docs/evidence/team-demo-captures/*.png

**Files:**
- Modify: `docs/evidence/team-demo-captures/01-check-for-calls.png` ... `06-how-its-built.png` (6 PNG), `looks/10.md` (the look note; create under `docs/evidence/team-demo-captures/` if the run keeps looks elsewhere, say where in the commit body)
- Modify only if a layout defect shows on v13: `osm-book-of-business-tracker-1.1.html` (the v13 modal tables) or `tools/team-demo/walkthrough.html` / `tools/team-demo/built.html`; pins via repin
- Test: `test/team-demo-capture.test.mjs`

- [ ] Step 1: Run `node --test test/team-demo-capture.test.mjs`; green on the merge.
- [ ] Step 2: Reshoot: `node tools/team-demo-capture.mjs docs/evidence/team-demo-captures` (viewport 1440x900, temp profile, 127.0.0.1:8801). Do not crop to hide a defect.
- [ ] Step 3: Open every one of the six PNGs with the Read tool. For each say: right subject, nothing on top, no blank area. Ian's 3 issues, checked on the new files: (1) shot 01 the Session column is not clipped behind a horizontal scrollbar in either table; (2) shot 02 the right column ("never edits or removes one") is not clipped; (3) shot 05 the floating "1 OF 12" counter does not cover the "Ranked by severity" text. Write each as "still applies / gone" with the evidence in `looks/10.md`.
- [ ] Step 4: For any issue that still applies, write a failing layout test first (a CDP measure: `scrollWidth <= clientWidth` of the table box; the counter box does not intersect the text box), fix the layout (not the crop), re-shoot, repeat from Step 3.
- [ ] Step 5: Run the look critic helper on the six files, then the PM first pass (studio-harness:pm); write both into `looks/10.md`. Commit PNGs and notes. Do NOT self-approve the looks.
- [ ] Step 6: `[IAN: look]`: add the six files, the critic and PM result, and look call 6 (reason line printed once per signal; PM pick: print once) to the end-of-run batch for Ian (AskUserQuestion, header `[Ian]`). Keep building Tasks 8-9 meanwhile; Task 11 waits for his answer.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && ls docs/evidence/team-demo-captures | grep -c '[.]png' && node --test test/team-demo-capture.test.mjs 2>&1 | grep -E "^# fail"`
**Expect:** `6` and `# fail 0`. The look itself is Ian's.

## Task 8: Parked-live audit (D)

Depends: 6
Timeout: 40m

**Files:**
- Modify: `README.txt`, `connector/CONNECT-GAINSIGHT.md`, `connector/CONNECT-SNOWFLAKE.md`, `connector/CONNECTORS.md`, `docs/HOSTING.md`, `tools/team-demo/walkthrough.html` (each gets one plain sentence if missing)
- Create: `test/parked-live.test.mjs`

**Interfaces:**
- Produces: `test/parked-live.test.mjs` with these tests (titles exact): `parked live: README and the three CONNECT/CONNECTORS docs say live Gainsight and Snowflake wait on Ian's internal team`; `parked live: the tracker works offline and by file import without them (docs say so)`; `parked live: no default code path reaches a Gainsight or Snowflake host (connector config.example.json holds no host, fake adapters are the default)`; `parked live: the walkthrough says the live connection is parked`.

- [ ] Step 1: `grep -n -i "parked\|internal team\|waits on" README.txt docs/HOSTING.md connector/*.md tools/team-demo/walkthrough.html` and write down which of the six files already say it (measured: today `CONNECT-SNOWFLAKE.md` line 9 says stage 2 was parked; the wording "waits on Ian's internal team" was not found in README.txt or HOSTING.md by my grep).
- [ ] Step 2: Write `test/parked-live.test.mjs` (source-text assertions on the six files plus `connector/config.example.json`); the "no default network" test also runs the connector with default config under `connector/lib/test-net-guard.mjs` and asserts zero non-127.0.0.1 connections; and re-uses the locked `test/csat-no-network.test.mjs` as the cited proof for CSAT (cite it; do not edit it). Run RED (the docs lack the sentence).
- [ ] Step 3: Add the sentences, one per file, plain English: live Gainsight/Snowflake needs credentials and access from Ian's internal team; until then the tracker is fully usable offline and by file import (CSV, Export/Import); the fake connector sends nothing anywhere.
- [ ] Step 4: Re-run green; run `node --test test/readme-counts.test.mjs test/hosting-docs.test.mjs` (HOSTING.md edited; `node tools/repin.mjs` only if the html changed, which it does not here).
- [ ] Step 5: Commit.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && node --test test/parked-live.test.mjs test/csat-no-network.test.mjs 2>&1 | grep -E "^# (pass|fail)"`
**Expect:** `# fail 0` and pass at least 5.
Red-first: Step 2 shows `# fail` greater than 0 on the parent docs.

## Task 9: Good-to-go evidence doc (D)

Depends: 8
Timeout: 30m

**Files:**
- Create: `docs/evidence/2026-10-22-runway-fake-book-v13.md`
- Modify: `test/parked-live.test.mjs` (add one test: the evidence doc names every feature area, the parked item and the deferred list)

**Interfaces:**
- Consumes: `docs/evidence/2026-10-22-fake-book-v13-merge-numbers.md` (Task 2 and 6 numbers), the Task 7 look status, the deferred list in `git show runway-v13-look:docs/evidence/2026-10-22-runway-v13-fixes.md` (line 42: signal ids (EV-27); co-pilot minutes saved and applied/edited/dismissed counts; "Applied for you"; "After your calls"; implementation %; check-ins due; sentiment and renewal pickers; Gainsight dry-run, JSON preview, field mapping, per-row company-ID boxes; renewal window; TTFV target; curriculum versions).

- [ ] Step 1: Write the test first: it fails because the file is missing. Run red.
- [ ] Step 2: Write the doc, one table row per feature area (v13 look screens, Check for calls, Refresh from Gainsight, Send to Gainsight, Check CSAT (T4), desk card (T14), desk reason (T16), Snowflake adapter, launcher and walkthrough, captures, sim, parked-live audit): the check command, the measured result (copied from the numbers file, re-run if older than the last html change), and the file or test that proves it.
- [ ] Step 3: Add "Parked" (live Gainsight/Snowflake, until Ian's internal team supplies access) and "Deferred by Ian 2026-10-22" (the list above) sections; mark the look status of Task 7 truthfully (awaiting Ian or confirmed).
- [ ] Step 4: Re-run any command whose number is older than the last html commit; fix a stale number out loud in the commit body.
- [ ] Step 5: Run green; commit.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && node --test test/parked-live.test.mjs 2>&1 | grep -E "^# (pass|fail)" && grep -c '^| ' docs/evidence/2026-10-22-runway-fake-book-v13.md`
**Expect:** `# fail 0` and a table row count of at least 12.

## Task 10: Final whole-branch review, Opus and Codex read-only (E)

Depends: 9
Timeout: 90m
Tokens: 800000

**Files:**
- Create: `.ledger/2026-10-22-runway-fake-book-v13/reviews/final-opus.md`, `.../final-codex.md`, `.../final-merged.md` (git-ignored)
- Modify: whatever the merged findings name (fix round), with a red test first for each behaviour finding

- [ ] Step 1: Read ledger traps `2026-10-14-codex-shell-blocked-on-windows` and `2026-10-17-codex-unelevated-sandbox-runs-on-windows` and the "final review codex" row in the runway-v13-fixes progress.md before launching Codex.
- [ ] Step 2: final-reviewer (Opus) reads `git diff runway-v13-look...HEAD` and the evidence doc; writes findings with file:line. Codex: `codex exec` read-only (codex-cli 0.163.0) on the same diff. Both are read-only; neither edits.
- [ ] Step 3: Merge the two reports into `final-merged.md`: each finding fixed, or not-fixed with the reason, or sent to Ian.
- [ ] Step 4: Fix round: one commit per finding with its red test first; `node tools/repin.mjs` after any html edit; re-measure any moved count.
- [ ] Step 5: Re-run the Suite command and the Task 2 list; update the numbers file and the evidence doc to the final values.
- [ ] Step 6: Commit.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && node --test --test-reporter=spec "test/*.test.mjs" "connector/test/*.test.mjs" 2>&1 | grep -E "^# (tests|pass|fail|skipped)" && ls .ledger/2026-10-22-runway-fake-book-v13/reviews | grep -c final-`
**Expect:** `# fail 0` and `3`.

## Task 11: [IAN: none - slip names merge] Merge runway-fake-book-v13 into runway-v13-look by the merge rule (E)

Depends: 10, and Ian's answer to Task 7's look batch (PM proxy 2026-10-22: review needs no look answer; the merge does)
Timeout: 40m

**Files:**
- No file edits. Branches only: remote `backup/runway-v13-look-before-runway-fake-book-v13-2026-10-22` (new), local `runway-v13-look`

- [ ] Step 1: Back up the target's remote tip first: `git fetch origin` then `git push origin origin/runway-v13-look:refs/heads/backup/runway-v13-look-before-runway-fake-book-v13-2026-10-22` (unforced). Confirm with `git ls-remote origin backup/runway-v13-look-before-runway-fake-book-v13-2026-10-22`.
- [ ] Step 2: Merge in a scratch state: from the worktree, `git switch runway-v13-look` is not possible if another worktree holds it; instead run `git merge-tree` check, then perform the merge in the worktree that holds `runway-v13-look` (find it with `git worktree list`). Conflicts keep both sides. Never touch master.
- [ ] Step 3: Full suite on the result: the Suite command, `node tools/selfcheck.mjs ... --expect <README number>`, `node tools/sim/osm-day/run.mjs --version 1.1` (22/22, exit 0). No failure that `runway-v13-look` (f086a14) lacks.
- [ ] Step 4: If the suite is clean: `git push origin runway-v13-look` (unforced). If any new failure appears, do not push: fix on `runway-fake-book-v13` first and repeat from Task 10 Step 5.
- [ ] Step 5: Report to Ian in plain English: what is good to go, the numbers, the one thing parked (the live Gainsight/Snowflake connection), and his remaining decision (when to merge `runway-v13-look` into master). Add the run row in the ledger.

**Check:** `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-fake-book-v13" && git ls-remote origin backup/runway-v13-look-before-runway-fake-book-v13-2026-10-22 | wc -l && git fetch origin && git merge-base --is-ancestor runway-fake-book-v13 origin/runway-v13-look && echo merged`
**Expect:** `1` and `merged`.

---

## Self-review notes

- Spec coverage: 1a Task 1; 1b Task 2; 1c Tasks 3 (T4), 4 (T14), 5 (T16), 6 (anything else Task 2 shows); 1d Task 7; 1e Task 8; 1f Task 9; 2 Task 10; 3 Task 11; 4 Task 11 Step 5.
- Header lines: `Suite:` and `Data: (none)` present; no data task, so no rehearse block.
- Assumed, not tested: T4/T14/T16 may already work on v13 (my greps show the names present on the merge result of both sides, not that the screens reach them). Tasks 3-5 are written to be honest either way (mutant red, plus fix if the real file is red).

## Re-scope 2026-10-22 (PM proxy decision A, after Task 4 measured it)

Task 4 found the selfcheck suite pins the v13 switch OFF (`tools/selfchecks-1.1.js` line 10), so the FX4/S2 checks prove T14 only on the old screens; with v13 ON (the default) the Desk has 0 `.dk-risk` and 0 `[data-dk-risk]`, and risks are confirmed on the v13 Risk screen (`data-risk-confirm`, "Confirmed before reasons were required. Add a reason"). Tasks 4-5 therefore add checks that set the switch to '1' and prove the T14 (S1 reason shown for a confirmed risk; S2 Add a reason writes it and shows confirmed) and T16 (saving a reason never confirms an unreviewed signal) intents on the v13 Risk screen; red vs a mutant; html fixed only if one fails. The old-screen checks stay (switch '0' still shows those screens). No new Desk card (that would be new look, Ian's call). If a Risk screen wording or layout change is needed to pass, stop and send it to Ian as a taste item. Task 4's first commit f6dca6b (empty, old-screen guard record) stands.
