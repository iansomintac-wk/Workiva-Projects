# Runway: direct tests for resolveNow and shiftISO edges (F7 no-decision run)

Why: studio-harness feature F7 ("a no-decision run on Runway finishes with 0 waits on Ian and at most 2 auto-mode blocks"). Ian, 2026-10-26, in the F7 lane session: "Yes: F7 may run its no-decision test task on Runway in the cloud tonight. No money, no deploys, never Runway's main branch."
Suite: node --test connector/test/*.test.mjs
Data: (none)
Spend: $0
Done: bash -c 'node --test connector/test/*.test.mjs > /tmp/rnd-done.log 2>&1; rc=$?; grep -E "^# (tests|pass|fail)" /tmp/rnd-done.log; [ $rc -eq 0 ] && [ $(grep -E "^# pass" /tmp/rnd-done.log | grep -oE "[0-9]+") -ge 220 ] && grep -q "^# fail 0" /tmp/rnd-done.log && echo RUNWAY_ND_DONE'

## Global Constraints

- Node 22, ES modules, `node:` imports only (`node:test`, `node:assert/strict`), no new dependencies, no package.json.
- Add exactly one new file, `connector/test/rebase-edges.test.mjs`. Do not change any other file: no product code (`connector/lib/*`, any `.html`), no existing test, no docs. The tests describe today's behaviour of `connector/lib/rebase.mjs`; if a case surprises you, assert what the code does today and say so in a test-name suffix `(current behaviour)`, never change the code.
- Never run `git fetch`, `git pull`, `git clone`, `git checkout`/`git switch` of another branch, `--unshallow` or `--deepen`. This clone is shallow and blob-filtered on purpose; fetching history could pull files that must never enter this machine.
- Never create, read or open `book-of-business-RESTORE-POINT-*.json`, `book-of-business-export*.json` or `*-export.json`, and nothing under `data/`.
- No network, no browser, no Chrome, no AI provider calls. Do not push or merge.
- Tests must not depend on the machine's time zone or clock: pass explicit `now` values (or `env` objects to `resolveNow`), and for `resolveNow()` with no input assert only that the result is within 5 seconds of `Date.now()`.

---

### Task 1: direct tests for resolveNow and shiftISO edges

Depends: none
Files: `connector/test/rebase-edges.test.mjs`

Steps:
1. Read `connector/lib/rebase.mjs` (27 lines) and `connector/test/rebase.test.mjs` (to match its style; do not edit it).
2. Write `connector/test/rebase-edges.test.mjs` with at least 6 tests whose names start `rebase edges:`. Cover `resolveNow`: a number; a `Date`; a function returning a number; `undefined` with `env = { CONNECTOR_FAKE_NOW: '2026-09-08T00:00:00Z' }`; `undefined` with an empty `env` (within 5 s of now); `null` with an empty env. Cover `shiftISO`: an empty string stays empty; a year boundary (`2026-12-31` + 1 day); a leap day (`2028-02-28` + 1 day is `2028-02-29`); a negative shift across a month; a time suffix kept with a negative shift.
3. Run `node --test connector/test/rebase-edges.test.mjs` and see every test pass; then run the whole connector suite and see 0 failures.
4. Commit only the new file.

Check: `bash -c 'node --test connector/test/rebase-edges.test.mjs > /tmp/rnd1.log 2>&1; rc=$?; tail -6 /tmp/rnd1.log; [ $rc -eq 0 ] && ! grep -Eq "^ok .*# (SKIP|TODO)" /tmp/rnd1.log && [ $(grep -Ec "^ok .* - rebase edges:" /tmp/rnd1.log) -ge 6 ] && [ -z "$(git diff --name-only HEAD~1 HEAD | grep -v "^connector/test/rebase-edges.test.mjs$")" ] && echo RUNWAY_ND_T1_PASS'`
Expect: RUNWAY_ND_T1_PASS
