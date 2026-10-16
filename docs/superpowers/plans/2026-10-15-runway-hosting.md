# Runway hosting (a site ready for company sign-in, nothing published) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build D1-D6 of the approved hosting spec so that checks C1-C9 can each be run by one exact command with a stated expected output, and nothing is published.

**Architecture:** A dependency-free Node site builder with a guard (`tools/build-site.mjs`), a tiny GET-only static server used by `tools/selfcheck.mjs --serve <dir>` (so the same in-page checks run from `http://127.0.0.1:<port>/`), a harness that opens a blank page, installs page-start scripts (`--pre`), then navigates (so storage calls and console errors are seen from the first byte), two small edits to the 1.1 tracker (empty-book hint, storage-persist request plus a Settings line), one in-page probe file (`tools/hosting-probe.js`) and one page-start spy (`tools/hosting-spy.js`), a move-book tool that proves an Export/Import between a file:// copy and a served copy in two throwaway profiles, and the documents (`docs/HOSTING.md`, README, CHANGELOG) which each task writes with its own code.

**Tech Stack:** Node (the repo already needs a Node with global `WebSocket` and `fetch`), `node:test` for unit tests, headless Chrome through the existing `tools/selfcheck.mjs`, plain HTML/JS in one file. No new dependencies, no `package.json`.

**Spec:** `docs/superpowers/specs/2026-10-15-runway-hosting-design.md` (approved by Ian 2026-10-15, "Approve as written"). Run prompt: `docs/RUNWAY_HOSTING_RUN_PROMPT.txt`. The spec wins over this plan where they differ.

**Revision note (2026-10-16, revision 2):** revised from plan sha256 `138f77388d0dbcb2` to apply the lead's merged review list `.ledger/2026-10-15-runway-hosting/reviews/plan-merged.md` (M1-M5, S1-S8, X1, the failed-load question), which merges the two reviews `.ledger/2026-10-15-runway-hosting/reviews/plan-codex.md` (Codex) and `.ledger/2026-10-15-runway-hosting/reviews/plan-opus.md` (Opus). The last section, "Review dispositions", maps each item to the plan lines that answer it. Task count is unchanged at 6.

Suite: `node --test test/build-site.test.mjs test/static-server.test.mjs test/move-book.test.mjs test/hosting-docs.test.mjs` ; `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 475` ; `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475` ; `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step0-probe.js --fn step0Probe --expect 34` ; `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step1-fixture.js,tools/step1-probe.js --fn step1Probe --expect <N1, recorded in Task 1 step 1>` ; `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect <count in each task>` and the same with `--serve site` (needs `node tools/build-site.mjs` first)
Data: (none)

Helper tool-call cap: 60

**Task count: 6** (the lead sets `tasksLeft` to 6).

## Global Constraints

- Never edit `osm-book-of-business-tracker-1.0.html`. App edits (D2, D3) go to `osm-book-of-business-tracker-1.1.html` only. After every task: `git diff --quiet master -- osm-book-of-business-tracker-1.0.html` exits 0.
- Locked files (do not edit): `osm-book-of-business-tracker-1.0.html`, `tools/selfchecks.js`, `tools/selfchecks-1.1.js` (the 475-check suite as 1.1 needs it), `demo-seed.js`, `tools/step0-probe.js`, `tools/step1-probe.js`, `tools/step1-fixture.js`, `tools/step1-coldstart.mjs`. New checks go in the NEW `tools/hosting-probe.js`, not into the Step 1 probe. Files the plan does edit: `tools/selfcheck.mjs` (Tasks 2 and 5), `osm-book-of-business-tracker-1.1.html` (Tasks 3 and 4), `.gitignore`, `README.txt`, `CHANGELOG.txt`, `docs/HOSTING.md` (every task appends its own section).
- Nothing is uploaded or published: no Pages, no new git remote, no `.github/` folder or workflow. The one push allowed is the run's own branch `runway-hosting` to `origin` (Ian's slip), done by the lead, never by a task. Master is never pushed.
- The app runs only through `tools/selfcheck.mjs` (and Task 5's tool, which calls it), headless, in a throwaway profile. Never open any HTML file from this folder in Ian's normal Chrome. Never run `chrome.exe` without `--user-data-dir`. The static server never uses port 8790.
- Test data is synthetic only: `demo-seed.js` and `tools/step1-fixture.js`. Test emails use `example.com` or `.invalid`, never a real customer domain. Never read, copy or name-match `book-of-business-RESTORE-POINT-*.json`, exports, recordings, screenshots or zips (the builder copies only its written list). Never write test data where the real book lives.
- Stop the `--serve` web server and test browsers by their own PIDs / handles only, never by image name. The server lives inside the `selfcheck.mjs` process and is closed in its exit handler.
- 1.1 file editing rules (top comment of the file): targeted edits, `:root` tokens for any styling, no data-shape change (D2 and D3 add no stored data, so no schema bump).
- Every new check must fail before its change (red) and pass after (green); record both outputs in the ledger. Every commit message ends with the attribution lines the session's system reminder gives.
- Docs travel with code (spec D6, Ian's standing rule): each task writes its own `docs/HOSTING.md` section, README and CHANGELOG lines and its own docs test in the same commit as the code. Task 6 only adds the fingerprint line and runs everything.
- Texts that must match the spec verbatim: hint `New address, no book here yet. Export from your old copy, then Import here (Settings).`; Settings lines `Kept by browser: yes`, `Kept by browser: no (export regularly)`, `Kept by browser: not available when opened as a file`.
- Email-shaped regex (the guard and the docs test): `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`; a match ending `.invalid` is allowed; threshold 0.
- Shell (review item X1, stated once): every command in this plan is written for Git Bash, which is what the helpers' Bash tool is (`sha256sum`, `ls -A`, `grep`, `sed`, `mktemp` all run there; measured 2026-10-16 when the lead ran `sha256sum` on both tracker files). Run them from the Bash tool, not PowerShell.
- Logged-run pattern (review items S3 and M3): a check command writes the whole run to a log, prints node's own exit status, then greps only the lines that matter, so no `tail` can drop the `serving` or `page origin` line and no pipe can hide a failing exit status. Shape: `L=$(mktemp); node <command> > "$L" 2>&1; echo "exit=$?"; grep -E "<pattern>" "$L"; rm -f "$L"`. Every "(logged)" command below uses it.
- Console-error rule (S3): `tools/selfcheck.mjs` prints one line `console errors: N (exceptions a, console.error b, log c, network d; favicon requests ignored f)` on every run. C8 passes only when the file:// run and the served run print the same N and N is 0. If the file:// baseline is not 0, the implementer stops and hands the list to the lead; the locked suite is never edited.

## Measured / read baselines

- READ (lead, measured 2026-10-16 at 0737f07; not re-run by this plan author): 1.1 and 1.0 selfcheck both `runSelfChecks: 475/475 passed, 0 failed`; 1.1 is 1,279,237 bytes, sha256 `086a3a8c34a641273cf89caed4095dadae9c059bd775896947afcfc7c12c38c9`. Task 1 step 1 re-measures both; any difference is a stop.
- MEASURED by this plan author (2026-10-16, read-only greps and file reads): the repo has no `package.json`, no `test/` folder, no `bin/rehearse.mjs`; `tools/selfcheck.mjs` is 291 lines, launches Chrome with the target URL on its command line (lines 64-69) and only attaches over CDP afterwards (line 154), so a spy cannot be installed before the page's own scripts today; it counts only `Runtime.exceptionThrown` (lines 165-171, printed lines 280-283, exit code line 290); `init()` is at html line 20299 (`await loadData(); ... render();`); `openSettingsModal()` at 17641; `render()` at 9295 builds `${renderTabs()}` then the view at 9311-9316; `renderDashboard()` empty branch at 10044; `exportData()` at 18206, `serializeBackup()` at 18079, `handleImportFile(e)` at 18941; `AI_SETTINGS_KEY = 'obm-ai-settings-v1'` at 1726 with `saveAiSettings(settings)` / `getAiSettings()`; `git branch -r` lists `origin/runway-step0-1`, `origin/runway-step1`, `origin/runway-tracker`, `origin/worktree-runway-step0-plan` and no `origin/master`; `CHANGELOG.txt` line 4 is the first version heading (`1.1 — Step 1 ...`), line 33 the next, line 51 `1.0 — August 6, 2026`; `README.txt` "Running it" is at line 17 and its closing paragraph ends at line 28.
- READ from the Step 1 probe: helpers `exportCapture()` (spies `Blob`, calls `exportData()`), `driveImport(text)` (calls the real `handleImportFile` with a fake file, captures the confirm callback), and the pattern `withBook` live inside `tools/step1-probe.js` (lines ~20-25, 384-401). They are not importable; Tasks 4 and 5 copy the few lines they need.
- FINDING on D2: there is NO existing test of the empty-book screen in `tools/selfchecks-1.1.js`, `tools/step0-probe.js` or `tools/step1-probe.js` (grepped for `No accounts`, `Add your first`, `emptyIllustration`, `renderDashboard(`: no hits in tools). The nearest existing tests are `T8 a synthetic book may replace a stored book with no accounts` in `tools/step0-probe.js` (about a stored empty book, not the screen) and the string check `v87 every readiness action maps to a real opener` in `tools/selfchecks-1.1.js` (line 6396; it only inspects `attachEvents`/`renderActivityTab`). The empty screen itself is `renderDashboard()` (html:10044, text "No accounts yet", shown for `DATA.customers.length === 0`). So Task 4 writes new empty-book checks in `tools/hosting-probe.js`; nothing existing is reused or edited.

## File map

| File | Change | Responsibility |
|---|---|---|
| `tools/build-site.mjs` | create (Task 1) | D1 builder and guard |
| `test/build-site.test.mjs` | create (Task 1) | C1, C2, C3 controls |
| `.gitignore` | modify (Task 1) | add `site/` |
| `docs/HOSTING.md` | create (Task 1), append (Tasks 2-6) | D6, grows with the code |
| `README.txt`, `CHANGELOG.txt` | modify (Task 1), CHANGELOG bullets appended (Tasks 2-5) | Hosted paragraph, release lines |
| `test/hosting-docs.test.mjs` | create (Task 1), append (Tasks 2-6) | docs content checks |
| `tools/static-server.mjs` | create (Task 2) | D5 GET-only static server on 127.0.0.1 |
| `test/static-server.test.mjs` | create (Task 2) | server unit tests incl. symlink escape |
| `tools/selfcheck.mjs` | modify (Task 2: blank-then-navigate, `--pre`, `--serve`, error counting, origin assertion; Task 5: `--dump`) | harness |
| `tools/hosting-spy.js` | create (Task 2) | page-start spy on `navigator.storage.persist/persisted` |
| `tools/hosting-probe.js` | create (Task 2), append (Tasks 3, 4, 5) | all new in-page checks, `window.hostingProbe` |
| `osm-book-of-business-tracker-1.1.html` | modify (Tasks 3, 4) | D3 and D2 |
| `tools/move-book.mjs` | create (Task 5) | D4 move-book tool (C6, C7, C4 after import) |
| `test/move-book.test.mjs` | create (Task 5) | compare logic |

Probe check counts (`--expect`): Task 2 = 3, Task 3 = 9, Task 4 = 14. Unit-test counts: build-site 9 (Task 1), hosting-docs 5 (Task 1) then 6, 7, 8, 10, 11 (Tasks 2, 3, 4, 5, 6), static-server 10 (Task 2), move-book 8 (Task 5).

## C1-C9 to task and command

All commands run from the worktree root in Git Bash. "Lead" commands are run by the lead (the plan-writer role cannot run them).

| # | Built in | Exact command | Expected output |
|---|---|---|---|
| C1 | Task 1 (final re-run in Task 6) | `node tools/build-site.mjs && ls -A site && node tools/build-site.mjs --check site && sha256sum osm-book-of-business-tracker-1.1.html site/index.html` | `ls` prints exactly `.nojekyll` and `index.html`; `guard ok: 2 files, index.html sha256 <hex>`; the two `sha256sum` lines show the same hex (at Task 1 time `086a3a8c...c38c9`; later the hash of the edited 1.1) |
| C2 | Task 1 | `node --test test/build-site.test.mjs` | `fail 0`; the five guard-control tests (C2a-C2d plus C2e) are among the passes (exit 0) |
| C3 | Task 1 | `node --test test/build-site.test.mjs` (the keep.txt test; it uses a temp root) | `fail 0`; test `C3 builder refuses a site/ that holds a foreign file` passes |
| C4 | Tasks 4 and 5 | served (logged): `node tools/build-site.mjs`, then `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 14`; file: same without `--serve site` and the build; after import: `node tools/move-book.mjs` | `hostingProbe: 14/14 passed, 0 failed` both ways; move-book prints `C4 PASS hint visible on the empty served book, hidden after import` |
| C5 | Task 3 | same two probe commands, `--expect 9` (Task 3) / `--expect 14` (final) | `hostingProbe: 14/14 passed, 0 failed` file and served; the checks inside use the page-start spy, so the real start-up counts are asserted (file:// 0 and 0; served persisted 1, persist 0 if already persisted else 1), plus controlled already-persisted and refused scenarios |
| C6 | Task 5 | `node tools/move-book.mjs` | `C6 PASS accounts A/A activities B/B transcripts 3/3 sha256 <64 hex> (equal both sides)`; exit 0 |
| C7 | Task 5 (stated in HOSTING.md in Task 5) | `node tools/move-book.mjs` | one line `C7 FINDING AI key in Export: absent` or `... present`, printed only after the tool proved the fake key was stored before Export (a finding, either is exit 0) |
| C8 | Task 2 (re-run after Tasks 3, 4, 5, 6) | logged: `node tools/build-site.mjs`, then `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 475`, then the same with `--serve site` added | both print `runSelfChecks: 475/475 passed, 0 failed`, `exit=0`, and the same `console errors: 0 (...)` line; the served run also prints `serving ... at http://127.0.0.1:<port>/` and `page origin: http://127.0.0.1:<port>`; the file run prints `page origin: file://` |
| C9 | none (lead only, nothing is built) | `git remote -v` (diff against the base text the lead saved before Task 1) ; `git diff --name-only ac2dccb..runway-hosting` (must show no `.github/` line) ; `gh api repos/iansomintac/Workiva/pages` ; `gh repo view iansomintac/Workiva --json visibility` ; `git branch -r` | remote text unchanged; no `.github/` path; `gh api` returns HTTP 404 (`Not Found`); `{"visibility":"PRIVATE"}`; the `git branch -r` list has no `origin/master` |

### REG: the standard regression block (Tasks 3, 4, 5, 6 run it; copy it, it is written once here)

Replace `P` with the task's probe count (3 for Task 2, 9 for Task 3, 14 for Task 4 onward) and `N1` with the number recorded in Task 1 step 1.

```
node tools/build-site.mjs
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 475 > "$L" 2>&1; echo "exit=$?"; grep -E "page origin|runSelfChecks:|console errors:|FAIL" "$L"; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --seed demo-seed.js --expect 475 > "$L" 2>&1; echo "exit=$?"; grep -E "serving|page origin|runSelfChecks:|console errors:|FAIL" "$L"; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect P > "$L" 2>&1; echo "exit=$?"; grep -E "page origin|hostingProbe:|console errors:|FAIL" "$L"; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect P > "$L" 2>&1; echo "exit=$?"; grep -E "serving|page origin|hostingProbe:|console errors:|FAIL" "$L"; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475 > "$L" 2>&1; echo "exit=$?"; grep -E "runSelfChecks:|console errors:|FAIL" "$L"; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step0-probe.js --fn step0Probe --expect 34 > "$L" 2>&1; echo "exit=$?"; grep -E "step0Probe:|FAIL" "$L"; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step1-fixture.js,tools/step1-probe.js --fn step1Probe --expect N1 > "$L" 2>&1; echo "exit=$?"; grep -E "step1Probe:|FAIL" "$L"; rm -f "$L"
git diff --quiet master -- osm-book-of-business-tracker-1.0.html ; echo "1.0 diff exit=$?"
```
Expected: every `exit=0`; `runSelfChecks: 475/475 passed, 0 failed` (three times: 1.1 file, 1.1 served, 1.0); `hostingProbe: P/P passed, 0 failed` (file and served); `step0Probe: 34/34 passed, 0 failed`; `step1Probe: N1/N1 passed, 0 failed`; every `console errors: 0 (...)` line has the same N and it is 0 (1.0 may differ from 1.1 only if the Task 2 baseline recorded it); served runs show `serving ... at http://127.0.0.1:<port>/` and `page origin: http://127.0.0.1:<port>`; file runs show `page origin: file://`; no `FAIL` line; `1.0 diff exit=0`. Any break of an existing check is a stop for the lead.

The lead re-runs REG itself after every task (review item S2: the served 475 after Tasks 2, 3, 4, 5 and 6, not only after Tasks 2 and 6).

## Groups and tune tasks

- Groups: none. Every task touches app behaviour, the harness or judgement-bearing docs.
- Tune tasks: none. No task moves one number.

## Helper-token estimate (assumed, not measured; one fresh implementer + one checker per task)

| Task | Estimate |
|---|---|
| 1 Builder, guard and first docs | 80k |
| 2 Static server, `--serve`, harness upgrade | 110k |
| 3 D3 storage request | 100k |
| 4 D2 empty-book hint | 95k |
| 5 D4 move-book tool, C6, C7 | 120k |
| 6 Fingerprint line and final C1-C8 run | 50k |

Run total: about 555k helper tokens (assumed).

## Paid calls

None. All work is local with synthetic data; no AI provider is called. Spend answer in the slip is $0. Codex reviews (plan and diff) use Ian's ChatGPT plan only while `codex login status` says "Logged in using ChatGPT"; otherwise skipped and recorded.

## Expected breaks

(none expected) Task 3 and Task 4 add code to the 1.1 file and do not change any existing behaviour; the 475-check suite (`tools/selfchecks-1.1.js`) is locked and must stay 475/475. Task 2 changes how `tools/selfcheck.mjs` launches Chrome (blank page, then navigate); no existing test covers that file, and REG proves the 475, 34 and N1 runs are unchanged. If an edit breaks an existing check, that is a stop for the lead, not a license to edit the suite.

## Spec ambiguities resolved here

1. Existing empty-book test: none exists (see Baselines); Task 4 writes new checks.
2. `selfcheck.mjs --serve <dir>`: the positional HTML file is still required; it picks the suite (by name, as today) and Task 2 refuses (exit 2) if `<dir>/index.html` has a different sha256 from it, so C8 compares the same build.
3. D3 on a served page whose browser has no `navigator.storage.persist`: Settings says `Kept by browser: no (export regularly)` (the spec gives the file:// text only for file://).
4. D3 spies (revised): the spy is installed before the page's scripts run (`--pre tools/hosting-spy.js`, which selfcheck registers with CDP `Page.addScriptToEvaluateOnNewDocument` after launching Chrome on `about:blank`), so the checks assert the page's own start-up calls; the spy can also force results for the controlled scenarios. The source-regex proof is dropped.
5. D1 guard: on failure the builder prints the rule and a character offset, never the matched text (a real address must not land in a log), and removes the two files it wrote. A folder named `index.html` or `.nojekyll` is a guard (a) failure.
6. D4 uses the demo seed plus the first three `STEP1_CALLS` from `tools/step1-fixture.js`; the AI-key probe for C7 uses a fake key string `TEST-KEY-NOT-REAL-0001` and the tool refuses to report a finding unless the key was stored before Export.
7. C9 `git remote -v` base: the lead saves its output before Task 1 (the plan writer's shell refuses `git remote`).
8. Harness change: selfcheck now starts Chrome on `about:blank` and navigates, for every run (one code path). Reason: the page-start script and the error counters must exist before the first page script runs. Console-error counting is added but does not change the exit code (exceptions still do, as before); C8 compares the printed lines.
9. Favicon: a served page may request `/favicon.ico`, which the static server correctly 404s. selfcheck ignores failed requests for `/favicon.ico` (and says how many it ignored on the `console errors:` line). This is assumed to be needed on the served page and is not needed on file://; the Task 2 served run settles it (the ignored count prints either way).
10. Task 6 would otherwise have no test that fails on the parent, so it adds a docs test that `docs/HOSTING.md` carries the sha256 of the current 1.1 file (what IT compares `index.html` against). Any later 1.1 edit makes that test fail until the line is updated, which is the intent.

---

### Task 1: Site builder, guard and the first docs (D1, D6 start; C1, C2, C3)

**Files:**
- Create: `tools/build-site.mjs`
- Create: `test/build-site.test.mjs`
- Create: `test/hosting-docs.test.mjs`
- Create: `docs/HOSTING.md`
- Modify: `.gitignore` (append `site/`)
- Modify: `README.txt` (Hosted paragraph), `CHANGELOG.txt` (new heading)

**Interfaces:**
- Produces CLI: `node tools/build-site.mjs [--root <dir>]` builds `<root>/site/` (default root = repo root); `node tools/build-site.mjs --check <dir> [--root <dir>]` runs the guard alone. Exit 0 ok; exit 1 guard failure, stderr line starts `guard (a)`, `guard (b)` or `guard (c)`; exit 2 for a foreign file or folder in `site/` (stderr names it) or a missing source.
- Success lines (stdout): build prints `built site/: index.html, .nojekyll`, then the check line `guard ok: 2 files, index.html sha256 <64 hex>`.
- Produces `docs/HOSTING.md` (sections What this is, What to upload, What the host must give), a `Hosted` paragraph in README.txt, and the heading `1.1 — Hosting. A site you can put behind company sign-in (nothing is published).` as the FIRST version heading in CHANGELOG.txt. Later tasks append to these.

- [ ] **Step 1: Re-measure baselines (read-only) and record the Step 1 probe count**

Run, from the worktree root (logged runs):
```
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 475 > "$L" 2>&1; echo "exit=$?"; grep -E "runSelfChecks:|FAIL|Harness|Expected" "$L"; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475 > "$L" 2>&1; echo "exit=$?"; grep -E "runSelfChecks:|FAIL|Harness|Expected" "$L"; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step0-probe.js --fn step0Probe --expect 34 > "$L" 2>&1; echo "exit=$?"; grep -E "step0Probe:|FAIL" "$L"; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step1-fixture.js,tools/step1-probe.js --fn step1Probe > "$L" 2>&1; echo "exit=$?"; grep -E "step1Probe:|FAIL" "$L"; rm -f "$L"
grep -o -E "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}" osm-book-of-business-tracker-1.1.html | wc -l
```
Expected: `exit=0` and `runSelfChecks: 475/475 passed, 0 failed` twice; `step0Probe: 34/34 passed, 0 failed`; a line `step1Probe: N1/N1 passed, 0 failed` (write N1 in the ledger: it is the `--expect` for the Step 1 probe in every later task); the last command prints `0`. Any difference from 475/475/34, or any non-zero email count, is a stop. (These runs predate the Task 2 harness change, so they print no `console errors:` line; Task 2 records that baseline.)

- [ ] **Step 2: Write the failing tests** (`test/build-site.test.mjs` and `test/hosting-docs.test.mjs`)

`test/build-site.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const BUILDER = resolve('tools/build-site.mjs');
const SRC = 'osm-book-of-business-tracker-1.1.html';
const sha = b => createHash('sha256').update(b).digest('hex');
const mkRoot = (html = '<html><body>fixture book, no addresses</body></html>') => {
  const root = mkdtempSync(join(tmpdir(), 'build-site-test-'));
  writeFileSync(join(root, SRC), html);
  return root;
};
const run = (...a) => spawnSync(process.execPath, [BUILDER, ...a], { encoding: 'utf8' });
const cleanup = r => rmSync(r, { recursive: true, force: true });

test('C1 builder writes exactly index.html (same sha256 as the source) and an empty .nojekyll', () => {
  const root = mkRoot();
  try {
    const r = run('--root', root);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(readdirSync(join(root, 'site')).sort(), ['.nojekyll', 'index.html']);
    assert.equal(sha(readFileSync(join(root, 'site/index.html'))), sha(readFileSync(join(root, SRC))));
    assert.equal(readFileSync(join(root, 'site/.nojekyll')).length, 0);
    assert.match(r.stdout, /guard ok: 2 files, index\.html sha256 [0-9a-f]{64}/);
  } finally { cleanup(root); }
});

test('C2a guard (a): a stray RESTORE-POINT.json in the output dir exits 1 and names the rule', () => {
  const root = mkRoot();
  try {
    assert.equal(run('--root', root).status, 0);
    writeFileSync(join(root, 'site/RESTORE-POINT.json'), '{}');
    const r = run('--check', join(root, 'site'), '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(a\)/);
    assert.match(r.stderr, /RESTORE-POINT\.json/);
  } finally { cleanup(root); }
});

test('C2b guard (c): an email-shaped string (x@example.com) inside index.html exits 1 and names the rule', () => {
  const root = mkRoot('<html>contact x@example.com</html>');
  try {
    const dir = join(root, 'out'); mkdirSync(dir);
    writeFileSync(join(dir, 'index.html'), readFileSync(join(root, SRC)));   // same bytes, so only (c) can fail
    writeFileSync(join(dir, '.nojekyll'), '');
    const r = run('--check', dir, '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(c\)/);
    assert.doesNotMatch(r.stderr, /example\.com/, 'the matched text must not be printed');
  } finally { cleanup(root); }
});

test('C2c guard (b): one byte changed in index.html exits 1 and names the rule', () => {
  const root = mkRoot();
  try {
    assert.equal(run('--root', root).status, 0);
    const f = join(root, 'site/index.html');
    const b = readFileSync(f); b[b.length - 2] = b[b.length - 2] ^ 1; writeFileSync(f, b);
    const r = run('--check', join(root, 'site'), '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(b\)/);
  } finally { cleanup(root); }
});

test('C2d a@b.invalid passes the guard', () => {
  const root = mkRoot('<html>placeholder a@b.invalid only</html>');
  try {
    const r = run('--root', root);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(run('--check', join(root, 'site'), '--root', root).status, 0);
  } finally { cleanup(root); }
});

test('C2e guard (a): a FOLDER named index.html (right name, wrong kind) exits 1 and names the rule', () => {
  const root = mkRoot();
  try {
    const dir = join(root, 'out'); mkdirSync(dir); mkdirSync(join(dir, 'index.html'));
    writeFileSync(join(dir, '.nojekyll'), '');
    const r = run('--check', dir, '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(a\)/);
    assert.match(r.stderr, /index\.html/);
  } finally { cleanup(root); }
});

test('C3 builder refuses a site/ that holds a foreign file: exit 2, names it, deletes nothing', () => {
  const root = mkRoot();
  try {
    mkdirSync(join(root, 'site'));
    writeFileSync(join(root, 'site/keep.txt'), 'mine');
    const r = run('--root', root);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /keep\.txt/);
    assert.equal(readFileSync(join(root, 'site/keep.txt'), 'utf8'), 'mine');
    assert.equal(existsSync(join(root, 'site/index.html')), false);
  } finally { cleanup(root); }
});

test('rebuild: a site/ holding only listed names is replaced with the new source', () => {
  const root = mkRoot('<html>one</html>');
  try {
    assert.equal(run('--root', root).status, 0);
    writeFileSync(join(root, SRC), '<html>two</html>');
    assert.equal(run('--root', root).status, 0);
    assert.equal(readFileSync(join(root, 'site/index.html'), 'utf8'), '<html>two</html>');
  } finally { cleanup(root); }
});

test('a build whose source trips the guard exits 1 and leaves no index.html behind', () => {
  const root = mkRoot('<html>leak x@example.com</html>');
  try {
    const r = run('--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(c\)/);
    assert.equal(existsSync(join(root, 'site/index.html')), false);
  } finally { cleanup(root); }
});
```

`test/hosting-docs.test.mjs` (Tasks 2-6 append more tests to this file; the helpers at the top are final):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = f => (existsSync(f) ? readFileSync(f, 'utf8') : '');
const hosting = () => read('docs/HOSTING.md');
const firstSection = () => (read('CHANGELOG.txt').split(/\n(?=\d+\.\d+ )/)[1] || '');

test('HOSTING.md says what this is, what to upload, and what the host must give', () => {
  const t = hosting();
  assert.ok(t.length > 0, 'docs/HOSTING.md is missing');
  for (const re of [/site\/index\.html/, /\.nojekyll/, /node tools\/build-site\.mjs/, /own hostname/i, /https/i, /sign-in/i])
    assert.match(t, re);
});
test('HOSTING.md is accurate about where data goes: the book stays in the browser, AI features send text to the provider', () => {
  const t = hosting();
  assert.ok(t.length > 0, 'docs/HOSTING.md is missing');
  assert.match(t, /lives in this browser/i);
  assert.match(t, /AI features/);
  assert.match(t, /provider/i);
  assert.doesNotMatch(t, /nothing (is sent|leaves)|never leaves the browser|no data leaves/i);
});
test('HOSTING.md carries no email-shaped string except .invalid, no restore-point file name, no company name', () => {
  const t = hosting();
  assert.ok(t.length > 0, 'docs/HOSTING.md is missing');
  const bad = (t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).filter(m => !/\.invalid$/i.test(m));
  assert.deepEqual(bad, []);
  assert.doesNotMatch(t, /RESTORE-POINT/);
  assert.doesNotMatch(t, /Workiva/i);
});
test('README.txt has a Hosted paragraph that points at docs/HOSTING.md', () => {
  const t = read('README.txt');
  assert.match(t, /^Hosted\b/m); assert.match(t, /docs\/HOSTING\.md/);
});
test('CHANGELOG.txt: the hosting heading is the FIRST version section and names the builder', () => {
  const first = firstSection();
  assert.match(first, /^1\.1 \S+ Hosting/);
  assert.match(first, /build-site/);
});
```

- [ ] **Step 3: Run it to verify it fails (red)**

Run: `node --test test/build-site.test.mjs test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"`
Expected: `pass 0` and `fail 14` (the 9 builder tests fail because `tools/build-site.mjs` does not exist, so the spawned node exits 1 with "Cannot find module"; the 5 docs tests fail because there is no HOSTING.md, no Hosted paragraph and no hosting heading; the email test fails on the existence assertion, not vacuously). Record the output.

- [ ] **Step 4: Write `tools/build-site.mjs` and the `.gitignore` line**

```js
#!/usr/bin/env node
// Runway site builder (D1). No dependencies.
//   node tools/build-site.mjs [--root <dir>]                  build <root>/site from the list below, then run the guard
//   node tools/build-site.mjs --check <dir> [--root <dir>]    run the guard alone on <dir>
// Exit 0 ok. Exit 1 guard failure (stderr names the rule). Exit 2 foreign file in site/ or missing source.
import { existsSync, readdirSync, readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf('--' + n); return i !== -1 && args[i + 1] ? args[i + 1] : null; };
const root = resolve(opt('root') || join(HERE, '..'));

// THE LIST. Nothing else is ever copied.
const SOURCE = 'osm-book-of-business-tracker-1.1.html';
const NAMES = ['index.html', '.nojekyll'];

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const sha256 = buf => createHash('sha256').update(buf).digest('hex');
const isFile = p => { try { return statSync(p).isFile(); } catch { return false; } };

function guard(dir, srcPath) {
  const fails = [];
  const names = existsSync(dir) ? readdirSync(dir) : [];
  const extra = names.filter(n => !NAMES.includes(n));
  const missing = NAMES.filter(n => !names.includes(n));
  const notFiles = NAMES.filter(n => names.includes(n) && !isFile(join(dir, n)));   // right name, wrong kind (a folder)
  if (extra.length || missing.length || notFiles.length) {
    fails.push(`guard (a) failed: the file set must be exactly {${NAMES.join(', ')}}, both plain files; unexpected: [${extra.join(', ')}] missing: [${missing.join(', ')}] not a plain file: [${notFiles.join(', ')}]`);
  }
  const idx = join(dir, 'index.html');
  if (isFile(idx)) {
    const buf = readFileSync(idx);
    if (sha256(buf) !== sha256(readFileSync(srcPath))) fails.push(`guard (b) failed: index.html differs from ${SOURCE} (sha256 mismatch)`);
    const text = buf.toString('utf8');
    const bad = [...text.matchAll(EMAIL)].filter(m => !/\.invalid$/i.test(m[0]));
    if (bad.length) fails.push(`guard (c) failed: ${bad.length} email-shaped string(s) in index.html (first at character ${bad[0].index}); only addresses ending .invalid are allowed`);
  }
  return fails;
}

const srcPath = join(root, SOURCE);
if (!existsSync(srcPath)) { console.error(`source missing: ${srcPath}`); process.exit(2); }

const checkDir = opt('check');
if (checkDir) {
  const dir = resolve(checkDir), fails = guard(dir, srcPath);
  if (fails.length) { fails.forEach(f => console.error(f)); process.exit(1); }
  console.log(`guard ok: ${NAMES.length} files, index.html sha256 ${sha256(readFileSync(join(dir, 'index.html')))}`);
  process.exit(0);
}

const out = join(root, 'site');
if (existsSync(out)) {
  const foreign = readdirSync(out, { withFileTypes: true }).filter(e => !NAMES.includes(e.name) || !e.isFile()).map(e => e.name);
  if (foreign.length) {
    console.error(`site/ holds entries that are not plain files on the builder's list, nothing was deleted or written: ${foreign.join(', ')}`);
    process.exit(2);
  }
}
mkdirSync(out, { recursive: true });
copyFileSync(srcPath, join(out, 'index.html'));
writeFileSync(join(out, '.nojekyll'), '');
const fails = guard(out, srcPath);
if (fails.length) {
  fails.forEach(f => console.error(f));
  for (const n of NAMES) rmSync(join(out, n), { force: true });   // never leave a failed build lying around to be uploaded
  process.exit(1);
}
console.log(`built site/: ${NAMES.join(', ')}`);
console.log(`guard ok: ${NAMES.length} files, index.html sha256 ${sha256(readFileSync(join(out, 'index.html')))}`);
```
Append to `.gitignore` (after the last line, with a short comment): `# Hosting build output (tools/build-site.mjs rebuilds it)` then `site/`.

- [ ] **Step 5: Write the first docs** (same commit as the builder)

(a) Create `docs/HOSTING.md` with exactly this content:
```
# Hosting the OSM Runway tracker

This page is written so it can go to whoever runs the host, unchanged. Nothing in this repository publishes anything.

## What this is

The tracker is one HTML file. It runs in the browser. The book (accounts, activities, call transcripts) lives in this browser's own storage for the address the page is opened from: a copy opened as a file and a copy opened from a web address each have their own, separate, empty-to-start book. The tracker does not send the book to a server. The AI features are the exception: when someone enters an AI key in Settings and uses an AI feature, the text they ask about is sent to the AI provider they configured (Anthropic, OpenAI or Gemini), and nowhere else. Everything else works with no network.

## What to upload

Exactly two files, made by `node tools/build-site.mjs` into the `site/` folder: `site/index.html` (a byte-for-byte copy of the 1.1 tracker) and `site/.nojekyll` (an empty file; GitHub Pages serves files as they are when it is present). The builder only ever copies those two names, refuses to run if `site/` holds anything else, and stops with an error if the result is not exactly those two files, if `index.html` differs from the tracker, or if `index.html` holds an email-shaped string (other than ones ending `.invalid`).

## What the host must give

- Its own hostname: not a folder on a shared site, because everything served from one host can read the book and the AI key that the browser stores for that host.
- https.
- Company sign-in in front of the page.
```
(b) `README.txt`: insert after the paragraph that ends `connection. Everything else works offline.` (line 28) and its blank line, before the two blank lines that precede `What the tracker does`, this paragraph (the word `Hosted` starts the line):
```
Hosted: the 1.1 tracker can also be served from a company-sign-in site. Running
node tools/build-site.mjs makes site/ (two files); docs/HOSTING.md says what a
host must provide. Nothing here publishes anything.
```
(c) `CHANGELOG.txt`: insert directly BEFORE the current first version heading (the line `1.1 — Step 1 (transcripts out of the book). ...` at line 4), keeping one blank line after the new block:
```
1.1 — Hosting. A site you can put behind company sign-in (nothing is published).

    - tools/build-site.mjs builds site/ (index.html and .nojekyll only) and refuses
      anything else; its guard checks the file set, the sha256 and email-shaped text.
    - docs/HOSTING.md: what to upload and what a host must give.

```
Later tasks append bullets to this block (above its closing blank line), never a second hosting heading.

- [ ] **Step 6: Run the tests (green), the real build (C1), and the git status**

```
node --test test/build-site.test.mjs test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"
node tools/build-site.mjs && ls -A site && node tools/build-site.mjs --check site && sha256sum osm-book-of-business-tracker-1.1.html site/index.html
git status --short
```
Expected: `pass 14` and `fail 0`; build prints `built site/: index.html, .nojekyll` and `guard ok: 2 files, index.html sha256 086a3a8c34a641273cf89caed4095dadae9c059bd775896947afcfc7c12c38c9`; `ls -A` prints `.nojekyll` and `index.html`; the two `sha256sum` lines carry the same hex; `git status --short` shows exactly ` M .gitignore`, ` M CHANGELOG.txt`, ` M README.txt`, `?? docs/HOSTING.md`, `?? test/build-site.test.mjs`, `?? test/hosting-docs.test.mjs`, `?? tools/build-site.mjs` and NOT `site/`. (This assumes the lead committed the plan file and the run prompt first; if the plan file or `.ledger/` shows as untracked, that is the lead's and is left alone.)

- [ ] **Step 7: Run the 1.0 byte check**

```
git diff --quiet master -- osm-book-of-business-tracker-1.0.html ; echo "1.0 diff exit=$?"
```
Expected: `1.0 diff exit=0`. (The foreign-file refusal is already proven by test C3 in a temp root; do not create `keep.txt` in the real `site/`.)

- [ ] **Step 8: Commit**

```
git add tools/build-site.mjs test/build-site.test.mjs test/hosting-docs.test.mjs docs/HOSTING.md README.txt CHANGELOG.txt .gitignore
git commit -m "Hosting D1 + D6 start: site builder with guard (a file set, b sha256, c no email-shaped strings), HOSTING.md first sections"
```
(End the message with the session's attribution lines.)

---

### Task 2: Static server, harness upgrade and `selfcheck.mjs --serve` (D5; first half of C8)

**Files:**
- Create: `tools/static-server.mjs`
- Create: `test/static-server.test.mjs`
- Create: `tools/hosting-spy.js`
- Create: `tools/hosting-probe.js` (skeleton, 3 checks)
- Modify: `tools/selfcheck.mjs` (usage comment; imports; `--serve` and `--pre` flags; Chrome opens `about:blank`; Log and Network events; page-start scripts; navigate; origin assertion; error-count line; `cleanup`)
- Modify: `test/hosting-docs.test.mjs` (append 1 test), `docs/HOSTING.md` (append), `CHANGELOG.txt` (append bullet)

**Interfaces:**
- Produces: `export async function startStaticServer(dir) -> { server, port, url, close }`; `url` is `http://127.0.0.1:<port>/`. GET only (other methods 405 with `Allow: GET`), no listing (a directory serves its `index.html` or 404), only files inside `dir` (after decoding and symlink/junction resolution), never port 8790, bound to `127.0.0.1`.
- Produces: `selfcheck.mjs <file.html> [--serve <dir>] [--pre a.js[,b.js]]`. `--serve` refuses (exit 2) unless `<dir>/index.html` has the same sha256 as `<file.html>`, serves `<dir>`, prints `serving <dir> at http://127.0.0.1:<port>/`, closes the server in its exit handler. Every run: Chrome starts on `about:blank`; selfcheck registers (CDP `Page.addScriptToEvaluateOnNewDocument`) first `window.__hostExpect = {protocol, host}` (`{"protocol":"http:","host":"127.0.0.1:<port>"}` when served, `{"protocol":"file:","host":""}` otherwise) and then each `--pre` file, then calls `Page.navigate`. After the page is ready it prints `page origin: <protocol>//<host>` and exits 2 if that differs from the expectation (so the origin check cannot pass by accident). It counts and prints `console errors: N (exceptions a, console.error b, log c, network d; favicon requests ignored f)` on every run; the exit code still depends only on failed checks, exceptions and `--expect`, as before.
- Produces: `tools/hosting-spy.js`, a page-start script defining `window.__storageSpy = { available, calls: {persisted, persist}, results: [{fn, value}|{fn, error}], force: {persisted, persist}, reset() }`. It wraps `StorageManager.prototype.persisted/persist`, counts every call, passes through to the real function unless `force.<fn>` is not `undefined`.
- Produces: `window.hostingProbe()` (async, returns `{results:[{name,ok,detail}]}`) with the marker comment `// ===== end of hosting checks =====` that Tasks 3-5 insert above; "probe reached the end" is always last.

- [ ] **Step 1: Write the failing tests** (`test/static-server.test.mjs`, and one docs test)

`test/static-server.test.mjs`:
```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startStaticServer } from '../tools/static-server.mjs';

let base, dir, srv;
const get = (path, method = 'GET') => new Promise((res, rej) => {
  const r = http.request({ host: '127.0.0.1', port: srv.port, path, method }, resp => {
    const chunks = []; resp.on('data', c => chunks.push(c));
    resp.on('end', () => res({ status: resp.statusCode, headers: resp.headers, body: Buffer.concat(chunks).toString('utf8') }));
  });
  r.on('error', rej); r.end();
});
before(async () => {
  base = mkdtempSync(join(tmpdir(), 'static-server-test-'));
  dir = join(base, 'site'); mkdirSync(dir); mkdirSync(join(dir, 'sub')); mkdirSync(join(dir, 'withindex'));
  mkdirSync(join(base, 'outside'));
  writeFileSync(join(dir, 'index.html'), '<html>home</html>');
  writeFileSync(join(dir, 'app.js'), 'var a=1;');
  writeFileSync(join(dir, 'data.json'), '{}');
  writeFileSync(join(dir, 'withindex/index.html'), '<html>inner</html>');
  writeFileSync(join(base, 'secret.txt'), 'outside the served folder');
  writeFileSync(join(base, 'outside/secret2.txt'), 'outside two');
  srv = await startStaticServer(dir);
});
after(async () => { await srv.close(); rmSync(base, { recursive: true, force: true }); });

test('binds to 127.0.0.1 on a free port that is not 8790', () => {
  assert.equal(srv.server.address().address, '127.0.0.1');
  assert.ok(srv.port > 0 && srv.port !== 8790);
  assert.equal(srv.url, `http://127.0.0.1:${srv.port}/`);
});
test('GET / serves index.html as text/html', async () => {
  const r = await get('/');
  assert.equal(r.status, 200); assert.match(r.headers['content-type'], /^text\/html/); assert.equal(r.body, '<html>home</html>');
});
test('content types: .js, .json', async () => {
  assert.match((await get('/app.js')).headers['content-type'], /^text\/javascript/);
  assert.match((await get('/data.json')).headers['content-type'], /^application\/json/);
});
test('a folder with no index.html is 404, never a listing', async () => {
  const r = await get('/sub/'); assert.equal(r.status, 404); assert.doesNotMatch(r.body, /index of|app\.js/i);
});
test('a folder with an index.html serves it', async () => {
  assert.equal((await get('/withindex/')).body, '<html>inner</html>');
});
test('paths that climb out of the folder are 404 (raw and percent-encoded)', async () => {
  for (const p of ['/../secret.txt', '/%2e%2e/secret.txt', '/sub/../../secret.txt', '/..%2fsecret.txt']) {
    const r = await get(p); assert.ok(r.status === 404 || r.status === 400, p + ' -> ' + r.status); assert.doesNotMatch(r.body, /outside the served folder/);
  }
});
test('a symlinked FILE inside the folder that points outside is 404 (skipped with the reason if links cannot be made here)', async t => {
  try { symlinkSync(join(base, 'secret.txt'), join(dir, 'link.txt'), 'file'); }
  catch (e) { return t.skip('could not create a file symlink on this machine: ' + (e.code || e.message)); }
  const r = await get('/link.txt'); assert.equal(r.status, 404); assert.doesNotMatch(r.body, /outside the served folder/);
});
test('a directory junction/symlink inside the folder that points outside is 404 (skipped with the reason if it cannot be made)', async t => {
  try { symlinkSync(join(base, 'outside'), join(dir, 'linkdir'), 'junction'); }
  catch (e) { return t.skip('could not create a directory junction on this machine: ' + (e.code || e.message)); }
  const r = await get('/linkdir/secret2.txt'); assert.equal(r.status, 404); assert.doesNotMatch(r.body, /outside two/);
});
test('anything but GET is 405 with Allow: GET (POST, PUT, DELETE, HEAD)', async () => {
  for (const m of ['POST', 'PUT', 'DELETE', 'HEAD']) { const r = await get('/', m); assert.equal(r.status, 405, m); assert.equal(r.headers.allow, 'GET'); }
});
test('close() stops the server: a new connection is refused', async () => {
  const s2 = await startStaticServer(dir); const p = s2.port; await s2.close();
  await assert.rejects(() => new Promise((res, rej) => { const c = net.connect(p, '127.0.0.1'); c.on('connect', () => { c.destroy(); res(); }); c.on('error', rej); }));
});
```
Append to `test/hosting-docs.test.mjs`:
```js
test('HOSTING.md covers checking a copy from an address and publishing a new version; CHANGELOG names --serve', () => {
  const t = hosting();
  for (const re of [/--serve site/, /node tools\/selfcheck\.mjs/, /upload/i, /475/]) assert.match(t, re);
  assert.match(firstSection(), /--serve/);
});
```
Run (red): `node --test test/static-server.test.mjs test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail|skipped) [0-9]+"`
Expected: `pass 5`, `fail 2` (the server test file fails to load, `ERR_MODULE_NOT_FOUND` for `tools/static-server.mjs`, and counts as one failed test; the new docs test fails; the five Task 1 docs tests still pass). Record it.

- [ ] **Step 2: Write `tools/static-server.mjs`, run the server tests (green)**

```js
// Tiny static server for tools/selfcheck.mjs --serve. GET only, no listing, only files under <dir>, 127.0.0.1 only.
import http from 'node:http';
import { realpathSync, statSync, createReadStream, existsSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.csv': 'text/csv; charset=utf-8',
};
const NEVER_PORT = 8790;

export async function startStaticServer(dir) {
  const root = realpathSync(resolve(dir));
  const inside = p => p === root || p.startsWith(root + sep);
  const plain = (res, code, extra = {}) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', ...extra }); res.end(); };
  const handler = (req, res) => {
    if (req.method !== 'GET') return plain(res, 405, { Allow: 'GET' });
    let p;
    try { p = decodeURIComponent(req.url.split('?')[0].split('#')[0]); } catch { return plain(res, 400); }
    if (p.includes('\0') || p.includes('\\')) return plain(res, 400);
    let file = resolve(join(root, p));
    try {
      if (!inside(file)) return plain(res, 404);
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!existsSync(file)) return plain(res, 404);
      file = realpathSync(file);                       // follows symlinks and junctions: the REAL location must still be inside
      if (!inside(file) || !statSync(file).isFile()) return plain(res, 404);
    } catch { return plain(res, 404); }
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': statSync(file).size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    });
    createReadStream(file).pipe(res);
  };
  for (let attempt = 0; attempt < 5; attempt++) {
    const server = http.createServer(handler);
    await new Promise((ok, bad) => { server.once('error', bad); server.listen(0, '127.0.0.1', ok); });
    const port = server.address().port;
    if (port === NEVER_PORT) { await new Promise(r => server.close(r)); continue; }
    return {
      server, port, url: `http://127.0.0.1:${port}/`,
      close: () => new Promise(r => { server.closeAllConnections?.(); server.close(() => r()); }),
    };
  }
  throw new Error('could not get a free port other than ' + NEVER_PORT);
}
```
Run: `node --test test/static-server.test.mjs 2>&1 | grep -E "(pass|fail|skipped) [0-9]+"`
Expected: `pass 10` and `fail 0`. If this PC cannot create a file symlink without admin rights the output is `pass 9`, `skipped 1` (or 2 if junctions fail too) with the reason text printed by the runner; that is acceptable only with the reason copied into the ledger. A silent pass is not.

- [ ] **Step 3: Write the spy and the probe skeleton, then run the red `--serve` check** (before touching `selfcheck.mjs`)

Create `tools/hosting-spy.js`:
```js
/* Runs BEFORE the page's own scripts (tools/selfcheck.mjs --pre tools/hosting-spy.js, registered with
   Page.addScriptToEvaluateOnNewDocument). Counts every call the page makes to navigator.storage.persisted/persist and
   passes it through to the real function, unless a test sets spy.force.<fn> to a boolean. */
(function(){
  const spy = window.__storageSpy = {
    available: false, calls: {persisted: 0, persist: 0}, results: [], force: {persisted: undefined, persist: undefined},
    reset(){ this.calls.persisted = 0; this.calls.persist = 0; this.results.length = 0; },
  };
  try{
    const proto = typeof StorageManager !== 'undefined' ? StorageManager.prototype : null;
    if(!proto) return;
    spy.available = true;
    for(const fn of ['persisted', 'persist']){
      const real = proto[fn];
      if(typeof real !== 'function') continue;
      proto[fn] = function(...a){
        spy.calls[fn]++;
        const forced = spy.force[fn];
        const p = forced === undefined ? real.apply(this, a) : Promise.resolve(forced);
        return Promise.resolve(p).then(v => { spy.results.push({fn, value: v}); return v; },
                                       e => { spy.results.push({fn, error: String(e)}); throw e; });
      };
    }
  }catch(e){ spy.error = String(e); }
})();
```
Create `tools/hosting-probe.js`:
```js
/* Runway hosting probe. Runs ONLY inside tools/selfcheck.mjs (headless Chrome, throwaway profile):
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html [--serve site] --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect N
   Each task inserts its checks above the "end of hosting checks" marker; "probe reached the end" stays last. */
(function(){
  window.hostingProbe = async function(){
    const results = [];
    const rec = (name, ok, detail) => results.push({name, ok: !!ok, detail: detail || ''});
    const settle = () => new Promise(r => setTimeout(r, 60));
    const isFile = location.protocol === 'file:';
    try{
      await settle();
      // ===== hosting checks go here, in task order =====
      const ex = window.__hostExpect;
      rec('T2 page protocol and host equal what the harness independently expects (--serve sets http: and 127.0.0.1:<port>, otherwise file:)',
        !!ex && location.protocol === ex.protocol && location.host === ex.host,
        ex ? `expected ${ex.protocol}//${ex.host}, page is ${location.protocol}//${location.host}` : 'window.__hostExpect missing (harness too old)');
      rec('T2 the storage spy was installed before the page ran (--pre tools/hosting-spy.js)',
        !!window.__storageSpy && window.__storageSpy.available === true, window.__storageSpy ? JSON.stringify(window.__storageSpy.calls) : 'window.__storageSpy missing');
      // ===== end of hosting checks =====
      rec('probe reached the end', true);
    }catch(e){ rec('probe threw: ' + (e && e.message), false, String(e && e.stack || e).slice(0, 300)); }
    return {results};
  };
})();
```
Run (red; the old selfcheck ignores `--serve` and `--pre` and opens the file):
```
node tools/build-site.mjs
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 3 --verbose > "$L" 2>&1; echo "exit=$?"; grep -E "serving|page origin|T2|hostingProbe:" "$L"; rm -f "$L"
```
Expected (red): `exit=1`; NO `serving` line and NO `page origin` line; `hostingProbe: 1/3 passed, 2 failed` with both T2 checks listed as FAIL (`window.__hostExpect missing (harness too old)` and `window.__storageSpy missing`). Record it. (Red here means the harness neither served the page nor installed anything before it.)

- [ ] **Step 4: Upgrade `tools/selfcheck.mjs`** (all edits in one pass; change nothing else)

(a) Usage comment, add two lines:
`//   --serve <dir>: serve <dir> (must hold an index.html with the same sha256 as the positional file) from a GET-only server on 127.0.0.1 and run against http://127.0.0.1:<port>/ instead of file://.`
`//   --pre a.js[,b.js]: scripts registered with Page.addScriptToEvaluateOnNewDocument, so they run before the page's own scripts. window.__hostExpect = {protocol, host} is always registered first.`
(b) Imports: add `import { createHash } from 'node:crypto';` and `import { startStaticServer } from './static-server.mjs';`.
(c) Replace `const targetUrl = pathToFileURL(target).href;` (line 57) with:
```js
const serveFlag = flag('serve', null);
let served = null;
if (serveFlag) {
  const dir = resolve(serveFlag), idx = join(dir, 'index.html');
  if (!existsSync(idx)) { console.error(`--serve: no index.html in ${dir}`); process.exit(2); }
  const h = f => createHash('sha256').update(readFileSync(f)).digest('hex');
  if (h(idx) !== h(target)) { console.error(`--serve: ${idx} is not the same build as ${target} (sha256 differs). Run: node tools/build-site.mjs`); process.exit(2); }
  served = await startStaticServer(dir);
  console.log(`serving ${dir} at ${served.url}`);
}
const targetUrl = served ? served.url : pathToFileURL(target).href;
const expectProtocol = served ? 'http:' : 'file:';
const expectHost = served ? new URL(served.url).host : '';
const preFiles = (flag('pre', '') || '').split(',').filter(Boolean);
for (const f of preFiles) if (!existsSync(resolve(f))) { console.error(`--pre: no such file: ${resolve(f)}`); process.exit(2); }
```
(d) In the `spawn(chrome, [...])` argument list replace `targetUrl,` with `'about:blank',`. Replace `const page = await findPage(Date.now() + 20000, targetUrl);` with `const page = await findPage(Date.now() + 20000, 'about:blank');`.
(e) Replace the block from `const pageErrors = [];` through the end of the `ws.addEventListener('message', ...)` block (lines 162-171) with:
```js
const pageErrors = [];     // Runtime.exceptionThrown (counted before, and still decides the exit code)
const consoleErrors = [];  // console.error(...) calls
const logErrors = [];      // Log.entryAdded level "error": failed resource loads, security messages
const netFails = [];       // Network.loadingFailed, not cancelled
const reqUrl = new Map();
let ignoredFavicon = 0;
const isFavicon = u => /\/favicon\.ico(\?|$)/i.test(String(u || ''));
await send('Runtime.enable');
await send('Page.enable');
await send('Log.enable');
await send('Network.enable');
ws.addEventListener('message', ev => {
  let m; try { m = JSON.parse(ev.data); } catch { return; }
  const p = m.params || {};
  if (m.method === 'Runtime.exceptionThrown') {
    pageErrors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'unknown exception');
  } else if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') {
    consoleErrors.push((p.args || []).map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200));
  } else if (m.method === 'Log.entryAdded' && p.entry?.level === 'error') {
    if (isFavicon(p.entry.url) || isFavicon(p.entry.text)) ignoredFavicon++;
    else logErrors.push(`${p.entry.source}: ${String(p.entry.text).slice(0, 160)} ${p.entry.url || ''}`);
  } else if (m.method === 'Network.requestWillBeSent') {
    reqUrl.set(p.requestId, p.request?.url);
  } else if (m.method === 'Network.loadingFailed' && !p.canceled) {
    const u = reqUrl.get(p.requestId);
    if (isFavicon(u)) ignoredFavicon++; else netFails.push(`${u || p.requestId}: ${p.errorText}`);
  }
});
```
(f) Directly after the `Emulation.setDeviceMetricsOverride` call (before `readyExpr`) add:
```js
// Page-start scripts first, THEN navigate: they run before any of the page's own scripts.
const pre = [`window.__hostExpect = ${JSON.stringify({ protocol: expectProtocol, host: expectHost })};`,
  ...preFiles.map(f => readFileSync(resolve(f), 'utf8'))];
for (const source of pre) await send('Page.addScriptToEvaluateOnNewDocument', { source });
const nav = await send('Page.navigate', { url: targetUrl });
if (nav.errorText) { console.error(`Page.navigate to ${targetUrl} failed: ${nav.errorText}`); process.exit(2); }
```
(g) In both branches of `readyExpr` start the expression with `location.href !== 'about:blank' && `.
(h) Directly after the `if (!ready) { ... }` block add:
```js
const gotOrigin = (await send('Runtime.evaluate', { expression: 'location.protocol + "//" + location.host', returnByValue: true })).result?.value;
const wantOrigin = `${expectProtocol}//${expectHost}`;
console.log(`page origin: ${gotOrigin}`);
if (gotOrigin !== wantOrigin) { console.error(`page origin ${gotOrigin} is not the expected ${wantOrigin}`); process.exit(2); }
```
(i) Directly before the existing `if (pageErrors.length) {` block that prints `console error(s) on load` add:
```js
const errTotal = pageErrors.length + consoleErrors.length + logErrors.length + netFails.length;
console.log(`console errors: ${errTotal} (exceptions ${pageErrors.length}, console.error ${consoleErrors.length}, log ${logErrors.length}, network ${netFails.length}; favicon requests ignored ${ignoredFavicon})`);
for (const e of [...consoleErrors, ...logErrors, ...netFails]) console.log('  ' + String(e).split('\n')[0]);
```
(j) In `cleanup` add as the first line: `try { if (served) { served.server.closeAllConnections?.(); served.server.close(); } } catch {}`.

- [ ] **Step 5: Green checks: the probe both ways, and the C8 baseline**

```
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 3 --verbose > "$L" 2>&1; echo "exit=$?"; grep -E "serving|page origin|T2|hostingProbe:|console errors:" "$L"; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 3 --verbose > "$L" 2>&1; echo "exit=$?"; grep -E "page origin|T2|hostingProbe:|console errors:" "$L"; rm -f "$L"
```
Expected: both `exit=0` and `hostingProbe: 3/3 passed, 0 failed`; served shows `serving ... at http://127.0.0.1:<port>/`, `page origin: http://127.0.0.1:<port>` and a T2 detail `expected http://127.0.0.1:<port>, page is http://127.0.0.1:<port>`; file shows `page origin: file://`; both show `console errors: 0 (...)`. Then the negative control for the origin assertion (it must be able to fail): `L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve tools --seed demo-seed.js --expect 475 > "$L" 2>&1; echo "exit=$?"; grep -E "serving|--serve" "$L"; rm -f "$L"` expects `exit=2` and a `--serve: no index.html` line (a folder that is not the build is refused).

- [ ] **Step 6: Docs for this task** (same commit)

Append to `docs/HOSTING.md`:
```

## Check a copy from an address before it goes up

`node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --seed demo-seed.js --expect 475` serves the `site/` folder from a small local web server (127.0.0.1, GET only, no folder listing) in a throwaway browser profile, opens it by address instead of as a file, and runs the same 475 in-page checks. It refuses to run unless `site/index.html` is the same build as the tracker file, and it prints the address it served and the address the page really had, so a page that was not served by address cannot pass. It also prints a `console errors:` count; for a good build that count is 0 for the file run and the served run.

## Publish a new version

1. Change the tracker file (never the 1.0 file).
2. `node tools/build-site.mjs` rebuilds `site/` and refuses to run if `site/` holds anything else.
3. Run the `--serve site` command above and the same command without `--serve site`; both must print 475/475 and the same `console errors:` count.
4. Upload the two files in `site/` only when the owner of the site says yes.
```
Append to `CHANGELOG.txt`'s hosting block (above its closing blank line) the bullet:
```
    - tools/selfcheck.mjs --serve <dir> runs the same in-page checks from a served
      address (127.0.0.1, GET only); every run now opens a blank page then navigates,
      supports --pre page-start scripts and prints a console-error count.
```
Run: `node --test test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"`. Expected: `pass 6`, `fail 0`.

- [ ] **Step 7: Regression: run REG (defined above) with P = 3**

Expected: as the REG block says. Task 2's first REG run is the baseline: write the 1.1 file `console errors:` N in the ledger. If N is not 0, STOP and hand the printed lines to the lead (no edits to the locked suite). If the served run's N differs from the file run's N, STOP: list the extra lines. A non-zero `favicon requests ignored` on the served run is expected and is not a stop; record the number.

- [ ] **Step 8: Commit**

```
git add tools/static-server.mjs test/static-server.test.mjs tools/selfcheck.mjs tools/hosting-spy.js tools/hosting-probe.js test/hosting-docs.test.mjs docs/HOSTING.md CHANGELOG.txt
git commit -m "Hosting D5: GET-only static server, selfcheck --serve/--pre with origin assertion and console-error count (served suite 475/475)"
```
(Attribution lines at the end.)

---

### Task 3: Ask the browser to keep storage (D3; C5)

**Files:**
- Modify: `osm-book-of-business-tracker-1.1.html` (new functions immediately above `function openSettingsModal(){` at ~17641; one `<p>` in `openSettingsModal` after the "Your tracker lives only in this browser" paragraph ~17658; one call in `init()` after `render();` ~20305)
- Modify: `tools/hosting-probe.js` (insert 6 checks above the end marker; total becomes 9)
- Modify: `test/hosting-docs.test.mjs` (append 1 test), `docs/HOSTING.md` (append), `CHANGELOG.txt` (append bullet)

**Interfaces:**
- Produces in the 1.1 file: `let _storageKept = 'no'`; `async function initStoragePersistence()` returns `'yes' | 'no' | 'na'` and sets `_storageKept`; `function storageKeptLine()` returns exactly one of the three spec strings; the Settings modal contains `<p id="storage-kept-line">`.
- Behaviour: file:// makes no storage call and gives `'na'`; otherwise, if `navigator.storage.persist` exists, call `persisted()` and only if false call `persist()` once; no API or a throw gives `'no'`. `init()` calls it once, not awaited.
- Consumes: Task 2's `window.__storageSpy` (counts and forced results) and `window.__hostExpect`.

- [ ] **Step 1: Add the six checks to `tools/hosting-probe.js`** (insert above `// ===== end of hosting checks =====`) and one docs test

```js
      { // T3: D3 storage request. Counts come from tools/hosting-spy.js, installed BEFORE the page's own scripts ran.
        const spy = window.__storageSpy;
        const LINE = {yes: 'Kept by browser: yes', no: 'Kept by browser: no (export regularly)', na: 'Kept by browser: not available when opened as a file'};
        const waitFor = async (cond, ms) => { const t0 = Date.now(); while(!cond() && Date.now() - t0 < ms) await new Promise(r => setTimeout(r, 25)); return cond(); };
        const settingsLine = () => {
          try{
            openSettingsModal();
            const el = document.getElementById('storage-kept-line');
            const t = el ? el.textContent.trim() : null;
            document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
            return t;
          }catch(e){ return 'threw: ' + e.message; }
        };
        // The page's own start-up calls, snapshotted before anything below can add a call.
        if(!isFile && spy) await waitFor(() => spy.calls.persisted >= 1 && spy.results.length >= spy.calls.persisted + spy.calls.persist, 3000);
        const startup = spy ? {calls: {...spy.calls}, results: spy.results.map(r => ({...r}))} : null;
        const startupLine = settingsLine();
        const pv = startup && startup.results.find(r => r.fn === 'persisted');
        const pr = startup && startup.results.find(r => r.fn === 'persist');
        const wantPersistCalls = pv && pv.value === true ? 0 : 1;
        const keptAtStart = !!((pv && pv.value === true) || (pr && pr.value === true));
        const keep = typeof _storageKept === 'undefined' ? undefined : _storageKept;
        const scenario = async force => {     // re-run the app's own function with controlled answers; counts and state both recorded
          spy.reset(); spy.force = force;
          let st, err = null;
          try{ st = await initStoragePersistence(); }catch(e){ err = e.message; }
          finally{ spy.force = {persisted: undefined, persist: undefined}; }
          return {calls: {...spy.calls}, st, err, line: settingsLine()};
        };
        rec('T3 initStoragePersistence and storageKeptLine exist', typeof initStoragePersistence === 'function' && typeof storageKeptLine === 'function');
        rec('T3 the page\'s own start-up calls: ' + (isFile ? 'file:// made NO storage call' : 'persisted once, persist once only if persisted said no'),
          !!startup && (isFile ? (startup.calls.persisted === 0 && startup.calls.persist === 0)
                               : (startup.calls.persisted === 1 && startup.calls.persist === wantPersistCalls)), JSON.stringify(startup));
        rec('T3 the Settings line after start-up is ' + (isFile ? 'the file:// text' : 'yes or no to match what the browser answered'),
          startupLine === (isFile ? LINE.na : (keptAtStart ? LINE.yes : LINE.no)), String(startupLine));
        let a = {err: 'spy missing'}, b = a, c = a;
        if(spy){
          a = await scenario({persisted: true});
          b = await scenario({persisted: false, persist: false});
          c = await scenario({persisted: false, persist: true});
        }
        const sc = (r, wantCalls, wantSt, wantLine) => !r.err && r.calls.persisted === wantCalls[0] && r.calls.persist === wantCalls[1] && r.st === wantSt && r.line === wantLine;
        rec('T3 already persisted: ' + (isFile ? 'file:// still makes no call' : 'persisted called once, persist NOT called, state yes, line yes'),
          isFile ? sc(a, [0, 0], 'na', LINE.na) : sc(a, [1, 0], 'yes', LINE.yes), JSON.stringify(a));
        rec('T3 request refused (persisted false, persist false): ' + (isFile ? 'file:// still makes no call' : 'persisted once, persist once, state no, line "no (export regularly)"'),
          isFile ? sc(b, [0, 0], 'na', LINE.na) : sc(b, [1, 1], 'no', LINE.no), JSON.stringify(b));
        rec('T3 request granted (persisted false, persist true): ' + (isFile ? 'file:// still makes no call' : 'persisted once, persist once, state yes, line yes'),
          isFile ? sc(c, [0, 0], 'na', LINE.na) : sc(c, [1, 1], 'yes', LINE.yes), JSON.stringify(c));
        if(keep !== undefined) _storageKept = keep;
      }
```
Append to `test/hosting-docs.test.mjs`:
```js
test('HOSTING.md gives the three Settings storage lines verbatim; CHANGELOG names them', () => {
  const t = hosting();
  for (const s of ['Kept by browser: yes', 'Kept by browser: no (export regularly)', 'Kept by browser: not available when opened as a file']) assert.ok(t.includes(s), s);
  assert.match(firstSection(), /Kept by browser/);
});
```

- [ ] **Step 2: Run it (red) on the file page, the served page, and the docs test**

```
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 9 > "$L" 2>&1; echo "exit=$?"; grep -E "page origin|hostingProbe:|FAIL" "$L" | cut -c1-140; rm -f "$L"
node tools/build-site.mjs
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 9 > "$L" 2>&1; echo "exit=$?"; grep -E "serving|page origin|hostingProbe:|FAIL" "$L" | cut -c1-140; rm -f "$L"
node --test test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"
```
Expected (red): file `exit=1`, `hostingProbe: 4/9 passed, 5 failed` (T2 x2 and the end check pass, and the file:// start-up-count check passes because file:// made 0 calls even before the change; the other five T3 checks FAIL); served `exit=1`, `hostingProbe: 3/9 passed, 6 failed` (the start-up-count check also fails: the page made no storage call); docs `pass 6`, `fail 1`. If a count differs, record the real one and the failing names; it must still be a failing run for the T3 names. Record all three outputs.

- [ ] **Step 3: Add the functions to the 1.1 file** (immediately above `function openSettingsModal(){`)

```js
/* Hosting D3: ask the browser to keep this site's storage (so a hosted copy is not the first thing evicted).
   Never on file:// (no call at all). Called once from init(); persisted() first, persist() only if it said no. */
let _storageKept = 'no';   // 'yes' | 'no'; file:// is decided in storageKeptLine()
async function initStoragePersistence(){
  if(location.protocol === 'file:') return 'na';
  try{
    if(!(navigator.storage && navigator.storage.persist)){ _storageKept = 'no'; return 'no'; }
    let kept = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    if(!kept) kept = await navigator.storage.persist();
    _storageKept = kept ? 'yes' : 'no';
  }catch(e){ _storageKept = 'no'; }
  return _storageKept;
}
function storageKeptLine(){
  if(location.protocol === 'file:') return 'Kept by browser: not available when opened as a file';
  return _storageKept === 'yes' ? 'Kept by browser: yes' : 'Kept by browser: no (export regularly)';
}
```
In `openSettingsModal`, directly after the `<p ...>${icon('warn')} Your tracker lives <strong>only in this browser ...</p>` line add:
```js
      <p id="storage-kept-line" style="color:var(--text-faint); font-size:var(--text-xs); margin:-2px 0 8px;">${escapeHtml(storageKeptLine())}</p>
```
In `init()`, directly after the `render();` that follows `applyRoute();` add: `initStoragePersistence();  // hosting D3: no await, it never blocks start-up and never throws`.

- [ ] **Step 4: Docs for this task** (same commit)

Append to `docs/HOSTING.md`:
```

## Keeping the browser's storage

On a served address the tracker asks the browser, once at start-up, to keep its storage (it asks first whether the browser already does, and only asks if not). Chrome and Edge answer on their own, without a prompt; the answer depends on how the browser rates the site. Settings shows one line with the result: `Kept by browser: yes`, `Kept by browser: no (export regularly)`, or, for a copy opened as a file (where no request is made), `Kept by browser: not available when opened as a file`. Export regularly either way.
```
Append to the CHANGELOG hosting block the bullet:
```
    - Settings shows "Kept by browser: yes / no (export regularly)" and, on a served
      address only, the tracker asks the browser to keep its storage (never on file://).
```

- [ ] **Step 5: Run it (green): probe both ways and docs**

```
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 9 > "$L" 2>&1; echo "exit=$?"; grep -E "page origin|hostingProbe:|console errors:|FAIL" "$L" | cut -c1-140; rm -f "$L"
node tools/build-site.mjs
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 9 > "$L" 2>&1; echo "exit=$?"; grep -E "serving|page origin|hostingProbe:|console errors:|FAIL" "$L" | cut -c1-140; rm -f "$L"
node --test test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"
```
Expected: both `exit=0`, `hostingProbe: 9/9 passed, 0 failed`, `console errors: 0 (...)`; served shows the `serving` and `page origin: http://127.0.0.1:<port>` lines; docs `pass 7`, `fail 0`. (Served proves the real start-up counts and the controlled refused/granted/already-persisted scenarios; file proves 0 calls and the file:// text.) Record which answer this Chrome gave at start-up (the T3 start-up check detail prints it) for the ledger.

- [ ] **Step 6: Run REG (defined above) with P = 9**

Expected: as the REG block says (the 1.1 hash changed, so the build step rebuilds `site/`).

- [ ] **Step 7: Commit**

```
git add osm-book-of-business-tracker-1.1.html tools/hosting-probe.js test/hosting-docs.test.mjs docs/HOSTING.md CHANGELOG.txt
git commit -m "Hosting D3: ask the browser to keep storage (served pages only) and show it in Settings"
```
(Attribution lines at the end.)

---

### Task 4: Empty-book hint (D2; C4)

**Files:**
- Modify: `osm-book-of-business-tracker-1.1.html` (new constant and two functions above `render()`; one line in `render()`'s template)
- Modify: `tools/hosting-probe.js` (insert 5 checks above the end marker; total becomes 14)
- Modify: `test/hosting-docs.test.mjs` (append 1 test), `docs/HOSTING.md` (append), `CHANGELOG.txt` (append bullet)

**Interfaces:**
- Produces in the 1.1 file: `const HOSTED_EMPTY_HINT`; `function shouldShowHostedHint(protocol, data)` (pure: true when `protocol !== 'file:'` and `data` has no accounts); `function renderHostedEmptyHint()` returns `''` or a `<div id="hosted-empty-hint" role="note">` holding the hint text; `render()` puts it after `${renderTabs()}` on every view.
- Consumes: Task 2's probe skeleton. Existing empty-book test: none (see Baselines); these are the first.

- [ ] **Step 1: Add the five checks to `tools/hosting-probe.js`** (above the end marker) and one docs test

```js
      { // T4: D2 empty-book hint
        const TEXT = 'New address, no book here yet. Export from your old copy, then Import here (Settings).';
        const hasFn = typeof shouldShowHostedHint === 'function' && typeof renderHostedEmptyHint === 'function';
        rec('T4 the hint text is exactly the spec text', typeof HOSTED_EMPTY_HINT === 'string' && HOSTED_EMPTY_HINT === TEXT, typeof HOSTED_EMPTY_HINT === 'string' ? HOSTED_EMPTY_HINT : 'HOSTED_EMPTY_HINT missing');
        rec('T4 shouldShowHostedHint: http empty yes, https empty yes, file empty no, http with an account no',
          hasFn && shouldShowHostedHint('http:', {customers: []}) === true && shouldShowHostedHint('https:', {customers: []}) === true
            && shouldShowHostedHint('file:', {customers: []}) === false && shouldShowHostedHint('http:', {customers: [{id: 'x'}]}) === false
            && shouldShowHostedHint('http:', undefined) === true);
        const hintInDom = () => { const el = document.getElementById('hosted-empty-hint'); return el ? el.textContent.trim() : null; };
        const keepData = DATA, keepRaw = localStorage.getItem(STORAGE_KEY);
        let emptyDom = 'not run', fullDom = 'not run', afterImport = 'not run';
        try{
          DATA = cloneData(keepData); DATA.customers = []; DATA.activities = {};   // an empty book, in memory only
          render(); emptyDom = hintInDom();
          DATA = keepData; render(); fullDom = hintInDom();                          // the test book: has accounts
          // empty -> real Import handler -> accounts present
          const exported = serializeBackup(keepData, serializeBook(keepData));
          DATA = cloneData(keepData); DATA.customers = []; DATA.activities = {}; render();
          let cb = null; const rc = window.showConfirmModal, rt = window.showToast;
          window.showConfirmModal = (msg, onConfirm) => { cb = onConfirm; }; window.showToast = () => {};
          try{
            handleImportFile({target: {files: [new File([exported], 'test-book.json')], value: 'x'}});
            const t0 = Date.now(); while(cb === null && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 25));
            await settle();
          }finally{ window.showConfirmModal = rc; window.showToast = rt; }
          const committed = cb ? cb() === true : false;
          afterImport = committed ? hintInDom() : 'import did not commit';
        }catch(e){ afterImport = 'threw: ' + e.message; }
        finally{
          DATA = keepData; if(keepRaw !== null) Storage.prototype.setItem.call(localStorage, STORAGE_KEY, keepRaw);
          render();
        }
        rec('T4 empty book: hint ' + (isFile ? 'hidden on file://' : 'visible with the exact text when served'),
          isFile ? emptyDom === null : emptyDom === TEXT, String(emptyDom));
        rec('T4 a book with accounts: hint hidden', fullDom === null, String(fullDom));
        rec('T4 after the real Import handler puts accounts in: hint ' + (isFile ? 'still hidden' : 'was visible before and is hidden now'),
          afterImport === null && (isFile || emptyDom === TEXT), String(afterImport));
      }
```
(The pure-table and text checks come first so a missing function shows as a failure, not a throw. The last check also requires the served empty book to have shown the hint first, so it cannot pass vacuously before the change.)

Append to `test/hosting-docs.test.mjs`:
```js
test('HOSTING.md gives the empty-book hint verbatim; CHANGELOG names the hint', () => {
  assert.ok(hosting().includes('New address, no book here yet. Export from your old copy, then Import here (Settings).'));
  assert.match(firstSection(), /empty-book hint/i);
});
```

- [ ] **Step 2: Run it (red), served, file and docs**

```
node tools/build-site.mjs
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 14 > "$L" 2>&1; echo "exit=$?"; grep -E "serving|page origin|hostingProbe:|FAIL" "$L" | cut -c1-140; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 14 > "$L" 2>&1; echo "exit=$?"; grep -E "page origin|hostingProbe:|FAIL" "$L" | cut -c1-140; rm -f "$L"
node --test test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"
```
Expected (red): served `exit=1` and `hostingProbe: 10/14 passed, 4 failed` (the text check, the pure-table check, "empty book: hint visible" and "after the real Import handler" FAIL; "a book with accounts: hint hidden" passes vacuously, which is why the other four carry the red); file `exit=1` and `hostingProbe: 12/14 passed, 2 failed` (text and pure-table); docs `pass 7`, `fail 1`. If a count differs, record the real one; the named checks must be among the failures. Record the outputs.

- [ ] **Step 3: Add the hint to the 1.1 file** (just above `function render(){` at ~9295)

```js
/* Hosting D2: a hosted copy starts as a new address with its own empty storage. Say so, once, on an empty book.
   Never on file:// (the book you opened is the book). Gone as soon as the book has an account, so also after an Import. */
const HOSTED_EMPTY_HINT = 'New address, no book here yet. Export from your old copy, then Import here (Settings).';
function shouldShowHostedHint(protocol, data){
  return protocol !== 'file:' && !(data && Array.isArray(data.customers) && data.customers.length > 0);
}
function renderHostedEmptyHint(){
  if(!shouldShowHostedHint(location.protocol, DATA)) return '';
  return `<div id="hosted-empty-hint" role="note" style="margin:8px 0; padding:8px 12px; border:1px solid var(--border); border-radius:8px; background:var(--bg-panel); color:var(--text-faint); font-size:var(--text-xs);">${escapeHtml(HOSTED_EMPTY_HINT)}</div>`;
}
```
In `render()`'s template change
```
    ${renderTabs()}
    ${ui.view === 'today' ? renderToday()
```
to
```
    ${renderTabs()}
    ${renderHostedEmptyHint()}
    ${ui.view === 'today' ? renderToday()
```
(only the one inserted line). Confirm the tokens `--border`, `--bg-panel`, `--text-faint`, `--text-xs` exist: `grep -c -e "--bg-panel:" -e "--text-xs:" -e "--border:" -e "--text-faint:" osm-book-of-business-tracker-1.1.html` must be at least 4 (one definition each); if one is missing use the nearest token the file already defines.

- [ ] **Step 4: Docs for this task** (same commit)

Append to `docs/HOSTING.md`:
```

## A new address starts empty

A hosted address has its own storage, so its tracker starts with no accounts. While the book has no accounts, and only on a served address (never for a copy opened as a file), the tracker shows one line under the tabs: "New address, no book here yet. Export from your old copy, then Import here (Settings)." It disappears as soon as the book has an account, so also after an Import.
```
Append to the CHANGELOG hosting block the bullet:
```
    - Empty-book hint on a served address ("New address, no book here yet. ..."),
      hidden on file:// and as soon as the book has an account.
```

- [ ] **Step 5: Run it (green), served and file, and docs**

```
node tools/build-site.mjs
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 14 > "$L" 2>&1; echo "exit=$?"; grep -E "serving|page origin|hostingProbe:|console errors:|FAIL" "$L" | cut -c1-140; rm -f "$L"
L=$(mktemp); node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect 14 > "$L" 2>&1; echo "exit=$?"; grep -E "page origin|hostingProbe:|console errors:|FAIL" "$L" | cut -c1-140; rm -f "$L"
node --test test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"
```
Expected: both `exit=0`, `hostingProbe: 14/14 passed, 0 failed`, `console errors: 0 (...)`; docs `pass 8`, `fail 0`. Served proves: empty visible, book hidden, after import hidden. File proves: empty hidden. (This is C4 for the three served rows plus the file row.)

- [ ] **Step 6: Run REG (defined above) with P = 14**

Expected: as the REG block says. The probe restores the book it touched in a `finally`, and every selfcheck run is its own throwaway profile, so nothing is left on disk.

- [ ] **Step 7: Commit**

```
git add osm-book-of-business-tracker-1.1.html tools/hosting-probe.js test/hosting-docs.test.mjs docs/HOSTING.md CHANGELOG.txt
git commit -m "Hosting D2: empty-book hint on a served copy (hidden on file://, hidden once there is an account)"
```
(Attribution lines at the end.)

---

### Task 5: Move a book between a file:// copy and a served copy (D4; C6, C7, C4 after import)

**Files:**
- Modify: `tools/selfcheck.mjs` (add `--dump <file>`)
- Modify: `tools/hosting-probe.js` (add `window.hostingMoveOut` and `window.hostingMoveIn`; `hostingProbe` stays at 14 checks)
- Create: `tools/move-book.mjs`
- Create: `test/move-book.test.mjs`
- Modify: `test/hosting-docs.test.mjs` (append 2 tests), `docs/HOSTING.md` (append), `CHANGELOG.txt` (append bullets)

**Interfaces:**
- Produces: `selfcheck.mjs --dump <file>`: after the run, writes `window.__dump` (a string) to `<file>`; `<file>` must be inside the OS temp folder (same rule as `--profile`) or exit 2; exit 2 if `window.__dump` is not a string.
- Produces in the probe file: `hostingMoveOut()` (builds the test book with 3 fixture transcripts and a fake AI key, proves the key is stored, runs the real Export, sets `window.__dump = JSON.stringify({fp, exportText, keyStored, aiKeyInExport})`) returning TWO results (key stored; Export captured); `hostingMoveIn()` (reads `window.__incoming`, reports `hintBefore`, runs the real Import handler, sets `window.__dump = JSON.stringify({fp, hintBefore, hintAfter, aiKeyAfter})`) returning ONE result. `fp = {accounts, activities, transcripts, tsSha256}` where `tsSha256` is SHA-256 hex over the lines `ref + "\n" + text + "\n"` of every transcript sorted by ref.
- Produces in `tools/move-book.mjs`: `export function compareFingerprints(out, inn)`, `export function checkHint(inDump)`, `export function c7Line(out)` each returning `{ok, lines}`; CLI `node tools/move-book.mjs` prints `temp dir: <path>` first, then the C6, C4 and C7 lines, then `temp dir removed: yes|no`, and exits 0 only if C6, C4 and the C7 precondition (fake key stored) pass.

- [ ] **Step 1: Write the failing tests** (`test/move-book.test.mjs` and two docs tests), then run them red

`test/move-book.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareFingerprints, checkHint, c7Line } from '../tools/move-book.mjs';

const fp = (o = {}) => ({ accounts: 5, activities: 12, transcripts: 3, tsSha256: 'a'.repeat(64), ...o });

test('C6 equal fingerprints pass and the line carries the counts and the hash', () => {
  const r = compareFingerprints(fp(), fp());
  assert.equal(r.ok, true);
  assert.match(r.lines.join('\n'), /^C6 PASS accounts 5\/5 activities 12\/12 transcripts 3\/3 sha256 a{64}/m);
});
test('C6 a different account count fails', () => { assert.equal(compareFingerprints(fp(), fp({ accounts: 4 })).ok, false); });
test('C6 a different transcript hash fails', () => { assert.equal(compareFingerprints(fp(), fp({ tsSha256: 'b'.repeat(64) })).ok, false); });
test('C6 zero transcripts on both sides is NOT a pass', () => { assert.equal(compareFingerprints(fp({ transcripts: 0 }), fp({ transcripts: 0 })).ok, false); });
test('C4 hint must be visible before the import and hidden after it', () => {
  const TEXT = 'New address, no book here yet. Export from your old copy, then Import here (Settings).';
  assert.equal(checkHint({ hintBefore: TEXT, hintAfter: null }).ok, true);
  assert.equal(checkHint({ hintBefore: null, hintAfter: null }).ok, false);
  assert.equal(checkHint({ hintBefore: TEXT, hintAfter: TEXT }).ok, false);
});
test('C7 is void (FAIL, not a finding) when the fake key was not stored before Export', () => {
  const r = c7Line({ keyStored: false, aiKeyInExport: false, exportText: 'x' });
  assert.equal(r.ok, false); assert.match(r.lines[0], /^C7 FAIL/); assert.doesNotMatch(r.lines[0], /FINDING/);
});
test('C7 key stored and not in the Export text: finding "absent"', () => {
  const r = c7Line({ keyStored: true, aiKeyInExport: false, exportText: 'abc' });
  assert.equal(r.ok, true); assert.match(r.lines[0], /^C7 FINDING AI key in Export: absent/);
});
test('C7 key stored and in the Export text: finding "present"', () => {
  const r = c7Line({ keyStored: true, aiKeyInExport: true, exportText: 'abc' });
  assert.equal(r.ok, true); assert.match(r.lines[0], /^C7 FINDING AI key in Export: present/);
});
```
Append to `test/hosting-docs.test.mjs`:
```js
test('HOSTING.md states the C7 result exactly once (the AI key is, or is not, in Export)', () => {
  const t = hosting();
  const a = t.includes('The AI key is not in Export; enter it again after moving.');
  const b = t.includes('The AI key is carried in Export; check it after moving.');
  assert.equal(a !== b, true, 'exactly one of the two C7 sentences must appear');
});
test('HOSTING.md explains moving a book (Export, Import, transcripts); CHANGELOG names move-book', () => {
  const t = hosting();
  for (const re of [/Export/, /Import/, /transcripts/i, /Settings/]) assert.match(t, re);
  assert.match(firstSection(), /move-book/);
});
```
Run: `node --test test/move-book.test.mjs test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"`
Expected (red): `pass 8` and `fail 3` (the move-book test file fails to load, module `tools/move-book.mjs` not found, counted as one failed test; the two new docs tests fail; the eight earlier docs tests pass). Record it.

- [ ] **Step 2: Add `--dump` to `tools/selfcheck.mjs`**

Add `writeFileSync` to the `node:fs` import. Add `//   --dump <file>: after the run, write window.__dump (a string) to <file> (must be inside the OS temp folder).` to the usage comment. After the `profileFlag` block add:
```js
const dumpFlag = flag('dump', null);
if (dumpFlag) {
  const root = (resolve(tmpdir()) + sep).toLowerCase(), want = resolve(dumpFlag).toLowerCase();
  if (!want.startsWith(root)) { console.error('--dump must be a file inside ' + tmpdir()); process.exit(2); }
}
```
Just before `let code = out.failed.length ? 1 : 0;` add:
```js
if (dumpFlag) {
  const d = await send('Runtime.evaluate', { expression: 'typeof window.__dump === "string" ? window.__dump : null', returnByValue: true });
  if (typeof d.result?.value !== 'string') { console.error('--dump: window.__dump was not set by the run.'); process.exit(2); }
  writeFileSync(resolve(dumpFlag), d.result.value);
}
```

- [ ] **Step 3: Add the two functions to `tools/hosting-probe.js`** (after the closing of `window.hostingProbe`, still inside the outer IIFE)

First confirm the stored field name: `grep -n -A8 "function getAiSettings" osm-book-of-business-tracker-1.1.html` must show the key field is `apiKey`; if the field is named differently, use that name below (and in `aiKeyAfter`).
```js
  const fingerprint = async () => {
    const acts = Object.values(DATA.activities || {}).flat();
    const rows = [];
    for(const a of acts){
      const t = activityTranscript(a);
      if(t && a.transcript && a.transcript.ref) rows.push(a.transcript.ref + '\n' + t.text + '\n');
    }
    rows.sort();
    const buf = new TextEncoder().encode(rows.join(''));
    const h = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buf))).map(b => b.toString(16).padStart(2, '0')).join('');
    return {accounts: DATA.customers.length, activities: acts.length, transcripts: rows.length, tsSha256: h};
  };
  const hintText = () => { const el = document.getElementById('hosted-empty-hint'); return el ? el.textContent.trim() : null; };
  window.hostingMoveOut = async function(){
    const KEY = 'TEST-KEY-NOT-REAL-0001';
    const cid = DATA.customers[0].id;
    DATA.activities[cid] = DATA.activities[cid] || [];
    for(let i = 0; i < 3; i++){
      const a = {id: 'mv' + i, date: todayISO(), type: 'Call', summary: 'move test ' + i, checklist: []};
      a.transcript = await saveTranscriptVerified(a.id, window.STEP1_CALLS[i]);
      DATA.activities[cid].push(a);
    }
    saveAiSettings({apiKey: KEY, model: 'gemini-2.5-flash'});
    saveData();
    // C7 precondition (review item M4): the fake key must really be stored BEFORE Export, or "absent" would prove nothing.
    const keyStored = getAiSettings().apiKey === KEY && (localStorage.getItem(AI_SETTINGS_KEY) || '').includes(KEY);
    const blobs = []; const realBlob = window.Blob, realURL = URL.createObjectURL, realClick = HTMLAnchorElement.prototype.click;
    window.Blob = function(parts, opts){ blobs.push(parts.join('')); return new realBlob(parts, opts); };
    URL.createObjectURL = () => 'blob:probe'; HTMLAnchorElement.prototype.click = function(){};
    try{ exportData(); }finally{ window.Blob = realBlob; URL.createObjectURL = realURL; HTMLAnchorElement.prototype.click = realClick; }
    const exportText = blobs[0] || '';
    const fp = await fingerprint();
    window.__dump = JSON.stringify({fp, exportText, keyStored, aiKeyInExport: exportText.includes(KEY)});
    return {results: [
      {name: 'move out: the fake AI key is stored (getAiSettings and the stored item) before Export', ok: keyStored, detail: 'keyStored=' + keyStored},
      {name: 'move out: Export captured (' + exportText.length + ' bytes), fingerprint taken', ok: exportText.length > 0 && fp.transcripts === 3, detail: JSON.stringify(fp)},
    ]};
  };
  window.hostingMoveIn = async function(){
    if(typeof window.__incoming !== 'string') return {results: [{name: 'move in: window.__incoming missing', ok: false, detail: ''}]};
    const hintBefore = hintText();
    let cb = null; const rc = window.showConfirmModal, rt = window.showToast;
    window.showConfirmModal = (msg, onConfirm) => { cb = onConfirm; }; window.showToast = () => {};
    try{
      handleImportFile({target: {files: [new File([window.__incoming], 'moved-book.json')], value: 'x'}});
      const t0 = Date.now(); while(cb === null && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 25));
      await new Promise(r => setTimeout(r, 60));
    }finally{ window.showConfirmModal = rc; window.showToast = rt; }
    const committed = cb ? cb() === true : false;
    await new Promise(r => setTimeout(r, 60));
    const fp = await fingerprint();
    window.__dump = JSON.stringify({fp, hintBefore, hintAfter: hintText(), aiKeyAfter: getAiSettings().apiKey || ''});
    return {results: [{name: 'move in: Import committed', ok: committed, detail: JSON.stringify(fp)}]};
  };
```

- [ ] **Step 4: Write `tools/move-book.mjs`**

```js
#!/usr/bin/env node
// D4: prove a book moves from the file:// copy to the served copy. Two throwaway Chrome profiles (selfcheck.mjs makes and
// deletes them), test book only (demo-seed.js + the first 3 calls of tools/step1-fixture.js), nothing touches Ian's Chrome.
//   node tools/move-book.mjs
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const HINT = 'New address, no book here yet. Export from your old copy, then Import here (Settings).';

export function compareFingerprints(o, i) {
  const same = ['accounts', 'activities', 'transcripts', 'tsSha256'].every(k => o[k] === i[k]);
  const ok = same && o.transcripts > 0;
  return { ok, lines: [ok
    ? `C6 PASS accounts ${o.accounts}/${i.accounts} activities ${o.activities}/${i.activities} transcripts ${o.transcripts}/${i.transcripts} sha256 ${o.tsSha256} (equal both sides)`
    : `C6 FAIL out ${JSON.stringify(o)} in ${JSON.stringify(i)}${o.transcripts > 0 ? '' : ' (zero transcripts is not a pass)'}`] };
}
export function checkHint(d) {
  const ok = d.hintBefore === HINT && d.hintAfter === null;
  return { ok, lines: [ok ? 'C4 PASS hint visible on the empty served book, hidden after import'
    : `C4 FAIL hint before=${JSON.stringify(d.hintBefore)} after=${JSON.stringify(d.hintAfter)}`] };
}
export function c7Line(out) {
  if (!out.keyStored) return { ok: false, lines: ['C7 FAIL the fake AI key was not stored before Export, so the finding would prove nothing'] };
  return { ok: true, lines: [`C7 FINDING AI key in Export: ${out.aiKeyInExport ? 'present' : 'absent'} (stored fake key searched for in ${String(out.exportText || '').length} bytes of Export text)`] };
}

function main() {
  const tmp = mkdtempSync(join(tmpdir(), 'move-book-'));
  console.log(`temp dir: ${tmp}`);
  const sc = (...a) => spawnSync(process.execPath, ['tools/selfcheck.mjs', 'osm-book-of-business-tracker-1.1.html', ...a], { encoding: 'utf8' });
  let code = 1;
  try {
    const b = spawnSync(process.execPath, ['tools/build-site.mjs'], { encoding: 'utf8' });
    if (b.status !== 0) { console.log(b.stdout + b.stderr); return finish(tmp, 1); }
    const outFile = join(tmp, 'out.json'), inFile = join(tmp, 'in.json');
    const r1 = sc('--seed', 'demo-seed.js,tools/step1-fixture.js,tools/hosting-probe.js', '--fn', 'hostingMoveOut', '--expect', '2', '--dump', outFile);
    if (r1.status !== 0) { console.log('move out failed\n' + r1.stdout + r1.stderr); return finish(tmp, 1); }
    const out = JSON.parse(readFileSync(outFile, 'utf8'));
    const seedFile = join(tmp, 'incoming-seed.js');
    writeFileSync(seedFile, 'window.__incoming = ' + JSON.stringify(out.exportText) + ';\n');
    const r2 = sc('--serve', 'site', '--seed', seedFile + ',tools/hosting-probe.js', '--fn', 'hostingMoveIn', '--expect', '1', '--dump', inFile);
    if (r2.status !== 0) { console.log('move in failed\n' + r2.stdout + r2.stderr); return finish(tmp, 1); }
    const inn = JSON.parse(readFileSync(inFile, 'utf8'));
    const c6 = compareFingerprints(out.fp, inn.fp), c4 = checkHint(inn), c7 = c7Line(out);
    console.log(c6.lines.join('\n')); console.log(c4.lines.join('\n')); console.log(c7.lines.join('\n'));
    code = c6.ok && c4.ok && c7.ok ? 0 : 1;
  } catch (e) { console.log('move-book failed: ' + (e && e.message || e)); }
  return finish(tmp, code);
}
function finish(tmp, code) {
  rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  console.log(`temp dir removed: ${existsSync(tmp) ? 'no' : 'yes'}`);
  return code;
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
```
Note: `--seed` takes a comma-separated list, so the generated seed path must contain no comma (a temp path has none).

- [ ] **Step 5: Run the unit tests (green), then the real tool and the temp-folder check (S5)**

```
node --test test/move-book.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"
L=$(mktemp); node tools/move-book.mjs > "$L" 2>&1; echo "exit=$?"; grep -E "^(C[0-9]|temp dir)" "$L" | cut -c1-200; D=$(sed -n 's/^temp dir: //p' "$L" | head -1); if test -n "$D" && test ! -e "$D"; then echo "temp folder gone: $D"; else echo "TEMP FOLDER STILL THERE OR NOT NAMED: $D"; fi; rm -f "$L"
```
Expected: `pass 8`, `fail 0`; then `exit=0` and these lines: `temp dir: <path>`, `C6 PASS accounts A/A activities B/B transcripts 3/3 sha256 <64 hex> (equal both sides)`, `C4 PASS hint visible on the empty served book, hidden after import`, `C7 FINDING AI key in Export: absent|present (stored fake key searched for in N bytes of Export text)`, `temp dir removed: yes`, and `temp folder gone: <the same path>`. Write the C7 word in the ledger; step 6 needs it. (The red for the tool itself is step 1: before it exists nothing can run; a deliberately broken run is covered by the C6 FAIL and C7 FAIL unit tests.)

- [ ] **Step 6: Docs for this task** (same commit; write the measured C7 sentence)

Append to `docs/HOSTING.md` (use the C7 sentence that matches step 5: `absent` gives the first, `present` the second; write exactly one of them, verbatim):
```

## Moving a book to the new address

1. In the old copy: Settings, Export. The Export file carries the accounts, the activities and the call transcripts (transcripts travel inside the Export file).
2. Open the new address. It shows "New address, no book here yet" until the import.
3. In the new copy: Settings, Import, choose the Export file, confirm.
4. AI key: <ONE of these two sentences, verbatim: "The AI key is not in Export; enter it again after moving."  or  "The AI key is carried in Export; check it after moving.">

`node tools/move-book.mjs` rehearses this with the test book only: it exports from a file copy, imports into a served copy in two throwaway browser profiles, and prints `C6 PASS` when the account, activity and transcript counts and a hash over the transcripts are equal on both sides.
```
(Replace the angle-bracket line with the single chosen sentence, so the file contains exactly one of the two.) Append to the CHANGELOG hosting block the bullets:
```
    - tools/move-book.mjs proves an Export from a file copy imports into a served
      copy (counts and transcript hash equal) and records whether the AI key is in Export.
```
Run: `node --test test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"`. Expected: `pass 10`, `fail 0`.

- [ ] **Step 7: Run REG (defined above) with P = 14**

Expected: as the REG block says. Temp-folder cleanup was proved in step 5 (the tool names its own folder and the check asserts it is gone); no `ls | grep -c` guesswork.

- [ ] **Step 8: Commit**

```
git add tools/selfcheck.mjs tools/hosting-probe.js tools/move-book.mjs test/move-book.test.mjs test/hosting-docs.test.mjs docs/HOSTING.md CHANGELOG.txt
git commit -m "Hosting D4: move-book tool (file:// to served, counts and transcript sha256) and the measured AI-key finding"
```
(Attribution lines at the end.)

---

### Task 6: Fingerprint line and the final C1-C8 run

**Files:**
- Modify: `docs/HOSTING.md` (append the fingerprint section)
- Modify: `test/hosting-docs.test.mjs` (append 1 test)

**Interfaces:**
- Consumes: the final 1.1 file (edited by Tasks 3 and 4) and everything above.
- Produces: `docs/HOSTING.md` section "Checking what you received" with the sha256 of the final `site/index.html`, and a test that keeps it equal to the real 1.1 file.

- [ ] **Step 1: Write the failing test** (append to `test/hosting-docs.test.mjs`)

Add `import { createHash } from 'node:crypto';` to the imports at the top, then append:
```js
test('HOSTING.md carries the sha256 of the current 1.1 tracker (what the host compares index.html against)', () => {
  const sha = createHash('sha256').update(readFileSync('osm-book-of-business-tracker-1.1.html')).digest('hex');
  assert.ok(hosting().includes(sha), 'docs/HOSTING.md must contain ' + sha);
});
```

- [ ] **Step 2: Run it (red)**

Run: `node --test test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"`
Expected: `pass 10` and `fail 1` (HOSTING.md has no hash; the hash is no longer `086a3a8c...` because Tasks 3 and 4 edited the file). Record it.

- [ ] **Step 3: Compute the hash and write the section**

Run `sha256sum osm-book-of-business-tracker-1.1.html`. Append to `docs/HOSTING.md`, with the real 64-hex value in place of the angle-bracket word:
```

## Checking what you received

`index.html` in this package is a byte-for-byte copy of the 1.1 tracker. Its sha256 is `<the 64-hex value>`. Compare it with `sha256sum index.html` (or `Get-FileHash index.html` in PowerShell) before uploading. This line is updated in the same commit as any change to the tracker.
```

- [ ] **Step 4: Run it (green)**

Run: `node --test test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail) [0-9]+"`
Expected: `pass 11`, `fail 0`.

- [ ] **Step 5: Final C1-C8 run, all node tests, nothing published**

```
node --test test/build-site.test.mjs test/static-server.test.mjs test/move-book.test.mjs test/hosting-docs.test.mjs 2>&1 | grep -E "(pass|fail|skipped) [0-9]+"
node tools/build-site.mjs && ls -A site && node tools/build-site.mjs --check site && sha256sum osm-book-of-business-tracker-1.1.html site/index.html
```
then REG (defined above) with P = 14, then:
```
L=$(mktemp); node tools/move-book.mjs > "$L" 2>&1; echo "exit=$?"; grep -E "^(C[0-9]|temp dir)" "$L" | cut -c1-200; rm -f "$L"
git diff --name-only ac2dccb..HEAD | grep -c "^.github/"
```
Expected: node tests `pass 38` (9 + 10 + 8 + 11; or 37 and `skipped 1`, or 36 and `skipped 2`, only with the symlink reason recorded in Task 2) and `fail 0`; `.nojekyll` and `index.html`, `guard ok: 2 files, index.html sha256 <hex>` equal to the hex printed for 1.1 and to the hex in `docs/HOSTING.md` (the hash is no longer `086a3a8c...`; record the new hash as the C1 fingerprint); REG lines as written there (475/475 file, served and 1.0; `hostingProbe: 14/14` both ways; identical `console errors: 0` lines; `serving` and `page origin: http://127.0.0.1:<port>` on the served runs); the move-book lines `C6 PASS`, `C4 PASS`, `C7 FINDING` (matching the one sentence in HOSTING.md) and `temp dir removed: yes`, `exit=0`; the last command prints `0`. C9 is the lead's (table above). Do NOT run any `git push`, `git remote add`, `gh` write command, or create any `.github/` path.

- [ ] **Step 6: Commit**

```
git add docs/HOSTING.md test/hosting-docs.test.mjs
git commit -m "Hosting D6: HOSTING.md fingerprint of the final 1.1 build; final C1-C8 run recorded"
```
(Attribution lines at the end.)

---

## Self-review (run by the plan writer)

- Spec coverage: D1 Task 1; D5 Task 2; D3 Task 3; D2 Task 4; D4 Task 5; D6 written in every task and closed in Task 6; C1-C9 in the table; the spec's safety rules are in Global Constraints and Task 6 step 5; "site/ added to .gitignore" Task 1 step 4; the "plan writer finds the existing empty-book test and reuses it" is answered (none exists; Task 4 writes new ones). C5's start-up counts now come from a spy that exists before the page's scripts (Task 2 step 3, used in Task 3).
- Placeholders: none left except the deliberate `<N1, recorded in Task 1 step 1>` and `P` in REG (numbers only a run can give), the `<hex>`, `A`, `B`, `<port>` in expected-output lines (values only a run can give; the shape is exact), and the two bracketed spots in Task 5 step 6 and Task 6 step 3 that the step itself says how to fill (the C7 word comes from step 5's run; the hash from `sha256sum`).
- Names: `startStaticServer`, `initStoragePersistence`, `storageKeptLine`, `_storageKept`, `HOSTED_EMPTY_HINT`, `shouldShowHostedHint`, `renderHostedEmptyHint`, `hostingProbe`, `hostingMoveOut`, `hostingMoveIn`, `compareFingerprints`, `checkHint`, `c7Line`, `window.__hostExpect`, `window.__storageSpy` are used identically across tasks. Probe counts: Task 2 = 3, Task 3 = 9, Task 4 = 14; unit-test counts: build-site 9, static-server 10, move-book 8, hosting-docs 5 / 6 / 7 / 8 / 10 / 11 after Tasks 1 / 2 / 3 / 4 / 5 / 6. Total node tests at the end: 9 + 10 + 8 + 11 = 38.
- Steps per task: 8, 8, 7, 7, 8, 6 (all at most 8).
- Open for Ian (not blocking): on a failed load the app also shows an empty book, and the hint (spec-literal) would then say "no book here yet" while a rejected stored book exists. The plan follows the spec as written; the lead records it as an open nit on the approval page. A one-line fix if Ian wants it: also hide the hint while `_rejectedLoadPayload` is set (add the test to Task 4 step 1 first).

## Review dispositions

Maps every item of `.ledger/2026-10-15-runway-hosting/reviews/plan-merged.md` to what answers it. "Step" means a numbered step of the named task.

| Item | Answered by |
|---|---|
| M1 docs in the same commit | Global Constraints ("Docs travel with code"); File map rows for HOSTING.md, README, CHANGELOG and `test/hosting-docs.test.mjs`; Task 1 steps 2 and 5 (first docs and tests), Task 2 step 6, Task 3 step 4, Task 4 step 4, Task 5 step 6 (the measured C7 sentence); Task 6 keeps only the fingerprint line and the final run; each task's commit step lists its docs files |
| M2 C5 spies on the real start-up calls | Architecture paragraph; Task 2 step 3 (`tools/hosting-spy.js`) and step 4 items (c), (d), (f) (blank page, `Page.addScriptToEvaluateOnNewDocument`, navigate); Task 3 step 1 (checks 2 and 3 assert the page's own start-up counts, checks 4-6 the already-persisted, refused and granted scenarios); Task 3 step 5 expected output; Spec ambiguity 4 (source-regex proof dropped) |
| M3 served-origin check can fail, `serving` line visible | Task 2 interfaces; step 3 (red: `window.__hostExpect missing`), step 4 items (c), (f), (h) (independent expectation and exit 2 on mismatch), step 5 (negative control, `serving` and `page origin` grepped from a full log); Global Constraints "Logged-run pattern"; REG |
| M4 C7 confirms the fake key was stored | Task 5 interfaces; step 3 (`keyStored` before Export, a second result); step 1 and step 4 (`c7Line` and its two tests); C7 row of the C table; Spec ambiguity 6 |
| M5 HOSTING.md does not claim nothing leaves the browser | Task 1 step 5(a) "What this is" text (book stays in the browser; AI features send the asked-about text to the configured provider); Task 1 step 2 test "accurate about where data goes" (fails on the old claim) |
| S1 docs red count, test requires the file | Task 1 step 2 (every docs test asserts the file exists); step 3 expects `fail 14` (9 builder + 5 docs) |
| S2 served 475 re-run after Tasks 3, 4, 5 | REG block (second command) run by Task 2 step 7, Task 3 step 6, Task 4 step 6, Task 5 step 7, Task 6 step 5; the paragraph after REG says the lead re-runs it after every task; C8 row |
| S3 console errors counted and compared | Global Constraints "Console-error rule"; Task 2 interfaces and step 4 item (e) and (i) (`console.error`, `Log.entryAdded`, `Network.loadingFailed`; favicon handling in Spec ambiguity 9); Task 2 step 7 (baseline measured first, stop if not 0); C8 row; logged-run pattern keeps node's exit status |
| S4 refused scenario asserts counts and state | Task 3 step 1 (`sc()` helper compares calls, returned state and Settings line for each scenario); red/green counts in steps 2 and 5 |
| S5 temp cleanup | Task 5 interfaces ("prints `temp dir: <path>` ... `temp dir removed`"), step 4 (`finish()`), step 5 (the check asserts the named folder is gone) |
| S6 CHANGELOG heading position | Task 1 interfaces and step 5(c) (heading inserted BEFORE the current first version heading, line 4); the Task 1 docs test `^1\.1 \S+ Hosting` on the first section; later tasks append bullets to that block |
| S7 symlink escape test | Task 2 step 1 (file symlink test and directory junction test, each reports `skip` with the reason if a link cannot be made, never a silent pass); step 2 expected output; Task 6 step 5 count rule |
| S8 Opus nits | exact red counts: Task 1 step 3 (`fail 14`), Task 2 step 1 (`pass 5 / fail 2`) and step 3 (`1/3`), Task 3 step 2 (`4/9`, `3/9`, docs `pass 6 / fail 1`), Task 4 step 2 (`10/14`, `12/14`, docs `pass 7 / fail 1`), Task 5 step 1 (`pass 8 / fail 3`), Task 6 step 2 (`pass 10 / fail 1`); regex at old plan:605 removed with the source check (Spec ambiguity 4); `git status` expectation in Task 1 step 6; guard (a) rejects a folder named `index.html` or `.nojekyll` (Task 1 step 2 test C2e, step 4 `isFile`); "no internal names" promise is now tested (Task 1 step 2, third docs test: no `Workiva`, no email-shaped string, no restore-point name); stray C3 clause dropped from the C table; the twice-in-a-row run dropped from Task 4 |
| X1 Unix-shell finding rejected | Global Constraints, "Shell (review item X1, stated once)" |
| Failed-load question (empty book and hint) | Self-review, last bullet: follows the spec as written, flagged as an open nit for Ian, with the one-line fix and its test named |
