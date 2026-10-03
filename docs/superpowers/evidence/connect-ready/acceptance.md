Measured at HEAD de5b9aa, no network, temp CONNECTOR_STATE_DIR, no connector/config.json. Logs: tmp/A<n>-*.

| A-n | spec condition (short) | command | measured value | verdict |
|---|---|---|---|---|
| A-1 | connector tests all pass, count recorded | `node --test connector/test/*.test.mjs` | exit 0, tests 140, pass 140, fail 0. Plan table ends at 110 (T-13); the extra 30 come from T-14 fixes A-C and review additions, so the plan count is stale, not a failure | PASS |
| A-2 | selfcheck 473 + T-3 checks (475), exit 0 | `node tools/selfcheck.mjs ... --expect 475` | exit 0, 475/475 passed, 0 failed | PASS |
| A-3 | e2e exit 0 twice, no chrome dirs left | T-1 step-6 script (PowerShell) | exit 0 0; chrome dirs before 4 after 4 (equal); both logs 7/7 passed, "cleanup: temp config/profile removed" | PASS |
| A-4 | demo exit 0, same summary | `node tools/connector-demo.mjs` | exit 0; 6 calls, 17 accounts, 2 sent / 1 failed (forceFail), FAKE AI, temp files removed | PASS |
| A-5 | every new test file installs net guard; blocked empty | `git diff --name-only --diff-filter=A 51d1490..HEAD -- connector/test` then grep -L installNetGuard() | 12 new files, 0 lacking the call. Of all connector/test files, only demo.test.mjs and fixtures.test.mjs lack it, both pre-existing (not new); fixtures.test.mjs has only a `.invalid` URL string, no fetch. "blocked empty" is asserted inside each test's after(); passed with A-1, not re-measured separately | PASS |
| A-6 | no secret in branch diff | T-14 step-3 grep | 102 raw hits, 38 after the plan's exclusion filter; all 38 read by eye: key-name identifiers (accessKey, accessKeySecret, refreshToken), prose/docs, code that builds "Basic base64(accessKey:accessKeySecret)", test titles. No literal credential value. Tracked state files (config.json, proof.json, tokens, sent-record, dry-run.jsonl, token.txt): 0 | PASS (judgement on the 38) |
| A-7 | vendor fixtures carry source header | `node --test connector/test/vendor-fixtures.test.mjs` | tests 3, pass 3, fail 0 | PASS |
| A-8 | --check with no config: only SKIP, exit 0 | `node connector/server.mjs --check` (CONNECTOR_CONFIG pointing at a missing file) | exit 0; 2 lines, both SKIP (gong, gainsight: adapter is "fake"); 0 non-SKIP | PASS |
| A-9 | fake adapters show FAKE DATA as before | selfcheck c2h + e2e e1 | e1 "health line shows FAKE DATA (K9)" PASS in both e2e runs; selfcheck 475/475 includes c2h (not separately listed in output) | PASS |

git status --short line count after all runs: 0
