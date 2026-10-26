# Runway: direct tests for resolveNow and shiftISO edges (F7 no-decision run)

Why: studio-harness feature F7 ("a no-decision run on Runway finishes with 0 waits on Ian and at most 2 auto-mode blocks"). Ian, 2026-10-26, in the F7 lane session: "Yes: F7 may run its no-decision test task on Runway in the cloud tonight. No money, no deploys, never Runway's main branch."
Suite: node --test connector/test/*.test.mjs
Data: (none)
Spend: $0
Done: bash -c 'node --test --test-reporter=tap connector/test/*.test.mjs > /tmp/rnd-done.log 2>&1; rc=$?; grep -E "^# (tests|pass|fail)" /tmp/rnd-done.log; [ $rc -eq 0 ] && grep -qx "# fail 0" /tmp/rnd-done.log && [ $(grep -Ec "^ok .* - rebase edges:" /tmp/rnd-done.log) -ge 6 ] && [ $(grep -E "^# pass" /tmp/rnd-done.log | grep -oE "[0-9]+") -ge 220 ] && echo RUNWAY_ND_DONE'

## Global Constraints

- Node 22, ES modules. Imports: `node:test`, `node:assert/strict` and `../lib/rebase.mjs` only. No new dependencies, no package.json.
- Branch: you are on `harness/runway-no-decision`. Commit only there. Never check out, commit to, push or merge `main`, `master` or `runway-v13-look`.
- Add exactly one new file, `connector/test/rebase-edges.test.mjs`. Do not change any other file: no product code (`connector/lib/*`, any `.html`), no existing test, no docs. The tests describe today's behaviour of `connector/lib/rebase.mjs`; if a case surprises you, assert what the code does today and say so in a test-name suffix `(current behaviour)`, never change the code.
- Never run `git fetch`, `git pull`, `git clone`, `git checkout`/`git switch` of another branch, `--unshallow` or `--deepen`. This clone is shallow and blob-filtered on purpose; fetching history could pull files that must never enter this machine. Lazy fetching is switched off in this clone (its partial-clone promisor is removed), so git fails rather than fetching a missing object; treat any `missing object` or `lazy fetch` error as a stop, never a reason to fetch.
- Never create, read or open `book-of-business-RESTORE-POINT-*.json`, `book-of-business-export*.json` or `*-export.json`, and nothing under `data/`.
- No external network, no browser, no Chrome, no AI provider calls. Loopback (127.0.0.1) traffic from existing connector tests is fine. Do not push or merge.
- Tests must not depend on the machine's time zone or clock: pass explicit `now` values and explicit `env` objects to `resolveNow`. For the fallback cases (`undefined` or `null` with an empty env), freeze the clock with `t.mock.method(Date, 'now', () => 1789000000000)` (node:test restores it when the test ends) and assert exactly `1789000000000`.

---

### Task 1: direct tests for resolveNow and shiftISO edges

Depends: none
Files: `connector/test/rebase-edges.test.mjs`

Steps:
1. Read `connector/lib/rebase.mjs` (27 lines) and `connector/test/rebase.test.mjs` (to match its style; do not edit it).
2. Write `connector/test/rebase-edges.test.mjs` with at least 6 tests whose names start `rebase edges:`. Cover `resolveNow`: a number; a `Date`; a function returning a number; `undefined` with `env = { CONNECTOR_FAKE_NOW: '2026-09-08T00:00:00Z' }`; `undefined` with an empty `env` and `null` with an empty `env` (both with `Date.now` frozen as above; exactly `1789000000000`). Expected values: `resolveNow(1789000000000, {})` is `1789000000000`; `resolveNow(new Date('2026-09-08T00:00:00Z'), {})` and the env case are `Date.parse('2026-09-08T00:00:00Z')`; `resolveNow(() => 5, {})` is `5`. Cover `shiftISO`: an empty string stays empty; a year boundary (`2026-12-31` + 1 day); a leap day (`2028-02-28` + 1 day is `2028-02-29`); a negative shift across a month; a time suffix kept with a negative shift.
3. Run `node --test connector/test/rebase-edges.test.mjs` and see every test pass; then run the whole connector suite and see 0 failures.
4. Commit only the new file.

Check: `bash -c 'node --test --test-reporter=tap connector/test/rebase-edges.test.mjs > /tmp/rnd1.log 2>&1; rc=$?; tail -6 /tmp/rnd1.log; [ $rc -eq 0 ] && ! grep -Eq "^ok .*# (SKIP|TODO)" /tmp/rnd1.log && [ $(grep -Ec "^ok .* - rebase edges:" /tmp/rnd1.log) -ge 6 ] || exit 1; ch=$(git diff --name-status origin/runway-v13-look...HEAD -- . ":(exclude)runs" ":(exclude)docs/superpowers/plans") || exit 1; [ "$ch" = "$(printf "A\tconnector/test/rebase-edges.test.mjs")" ] || { echo "changed: $ch"; exit 1; }; d=$(git status --porcelain -- . ":(exclude)runs") || exit 1; [ -z "$d" ] || { echo "uncommitted: $d"; exit 1; }; echo RUNWAY_ND_T1_PASS'`
Expect: RUNWAY_ND_T1_PASS
