# Runway fake-book end to end, connector seam, team demo (design)

Written 2026-10-22 ~06:45Z by the fake-book talk (successor of d92f0cf6), branch `runway-fake-book-talk` off master fd3a09c.
Status: DRAFT for Ian's approval. The scope and demo-shape answers are PM proxy decisions; Ian may overturn either.

## 1. Ian's words and the decisions so far

- Ian, 2026-10-22T05:47:21Z (verbatim): "I just want the scaffolding to exist and to be optimized so if I present this to my
  internal team they can see how well-built this is and that once we add the connector then this would be good to go."
- The hand-off summary of the same ruling (proposed, not verbatim): stay on a fake book; complete end to end, minus the live
  Gainsight/Snowflake push and pull; a connector seam (push to Gainsight, pull from Snowflake; check whether one connector can
  also pull from Gainsight) with stub adapters and contract tests; a demo his internal team can be shown.
- Ian, 2026-10-20: "we can park this for now" (the live Snowflake auto-pull). This design keeps the live pull parked: no
  credentials, no network from code or tests, the fake stays the default.
- PM proxy decision, scope: **A**, close every seam and build the demo. Order: M0a, M2, M3, M1, M0b. Cut first: M0b, then M1.
  The PM first answered C (no Snowflake adapter). The lead challenged it once: the park covers live access, not adapter
  code, and "once we add the connector" means adding should be a credential step, not a build. The PM switched to A.
- PM proxy decision, demo shape: **A**, a live launcher with a walkthrough page and a measured "how it's built" page. The
  request-log panel is optional and cut first. Both page looks are taste calls for Ian's batch.

## 2. Evidence

Measured by this talk, 2026-10-22 06:32-06:40Z, on fd3a09c:

| What | Result |
|---|---|
| `node --test connector/test/*.test.mjs` | 180/180 |
| `node tools/connector-demo.mjs` | exit 0. It covers health, calls, accounts, push and ai. **No csat** |
| tracker 1.1 selfcheck `--expect 503` | 503/503 (README says 502: stale) |
| step 1 probe `--expect 72` | 72/72 (README says 65: stale) |
| `node tools/connector-e2e.mjs` | **5/7, 2 failed** (README says 7/7). See section 3 |
| `/v1/csat` callers in tracker 1.0 and 1.1 | 0 (grep). CSAT arrives only by CSV import or folder watch |
| CSAT fixture `connector/fixtures/snowflake-csat.json` | 4 rows, ids `1I00FAKE…`/`001FAKE…`. 0 match the demo book |
| `csatIdsMatch` (html:19872) | needs ids of 15 or more characters. Demo ids `GS-DEMO-001` (11 characters) can never match |
| RS256 key-pair JWT with Snowflake's claim shape, `node:crypto` only | built and verified offline (throwaway key) |
| Anything serves the demo book on 127.0.0.1:8801 | nothing in the repo (grep) |

Read, not re-run: the predecessor's merge evidence (suite 417/415/0/2, 1.0 475/475, guide 18/18 and others; logs under
`~/.claude/jobs/d92f0cf6/tmp/logs/`); the vendor facts in `connector/CONNECT-GAINSIGHT.md` (2026-10-02); the Snowflake PAT
and key-pair blocks (measured by Ian, 2026-10-20, `docs/research/2026-10-20-snowflake-pat-sql-api.md` on branch
`worktree-runway-snowflake-stage2`); and `docs/research/2026-10-22-connector-wiring-gaps.md` (this talk's researcher; tags inside).

## 3. Found during the talk: the e2e check is broken by time

e2 ("Check for calls opens a preview: 5 matched, 1 no-account") got an empty list, and e3 depends on it. Cause, shown by
experiment: "Check for calls" looks back 30 days on first use (cutoff 2026-09-22T06:39Z). All 6 fixture calls are dated
2026-09-08 to 2026-09-18. The check went 7/7 on 2026-10-01 and has failed since about 2026-10-18. The CLI demo still
passes because it sends a fixed `since=2026-09-01`. The same trap would empty "Check for calls" in the team demo.
Requirement (in M2): the fake call and CSAT data served to the demo and to the e2e are dated relative to today. The contract
tests keep their fixed dates. A test with the clock set 90 days ahead must still see the 6 calls.

## 4. Answer to "can one connector also pull from Gainsight?"

Yes, and it already does. `gainsight-rest` pushes (Timeline activity, CTA) and reads Company through
`POST /v1/data/objects/query/Company`. It is built and tested on recorded-shape fixtures, and stays unproven until `--check`.
The research note lists read endpoints for Person, Timeline and CTA list (read on vendor pages; the CTA open-filter is
UNCONFIRMED). Filling `openCtas` from the CTA list is a next bet, not this objective.
Reading Gainsight objects from Snowflake: Ian's CSAT query already reads `silver_prod.gainsight.company` (schema names only,
measured from his screenshot 2026-10-20). That is a company-run landing; no official Gainsight-to-Snowflake export was found
(UNCONFIRMED). Out of scope (option D was rejected).

## 5. Milestones

Each one is built test-first. A new or changed test fails on the parent commit and passes on the task's commit.

### M0a: true numbers in the docs
- README: 1.1 `--expect 502` becomes 503; step 1 `--expect 65` becomes 72; the stale "no real adapter is built" line
  (README:227-228) says what is built (gong-rest and gainsight-rest built and unproven; Snowflake fake, and
  snowflake-sql once M1 lands). The connector-e2e line stays honest: it is fixed in M2, and its count changes there.
- Done when: each `--expect` line in README, when run, exits 0. Prediction: 503 and 72. Disproved by any other count.

### M2: the CSAT pull through the connector, and the fake book end to end
- Tracker 1.1 (1.0 is never edited): a "Check CSAT (connector)" button beside Import CSAT in Settings. It appears only
  when a connector is set up, the same rule as Check for calls. It calls `GET /v1/csat` and turns `{rows}` into the same
  table the CSV path builds (header row of the five column names, then values). It feeds the EXISTING
  `buildCsatImportPlan` and `openCsatImportModal`: the same dry run, backup first and Apply. No new matching logic.
  Offline or failed: a message, and nothing changes (offline rule).
- The function that calls the connector must not be named `csat*`. `test/csat-no-network.test.mjs` scans every `csat*`
  function for network use, and that test is locked.
- Fake data that works on any day: the fake Gong and CSAT data served to the demo and to the e2e is rebased to today
  (section 3). The demo book and the demo CSAT rows share fake ids of 15 or more characters (for example
  `001DEMO0000000001AAA`), so the dry run shows real matches: at least one each of a new date, a filled answered date,
  unchanged, and an unmatched row. The plan writer probes how the demo seed's ids affect the 503 count before it fixes
  the number.
- `tools/connector-e2e.mjs` gains a Check CSAT step. `tools/connector-demo.mjs` gains a csat line.
- Done when: an equivalence test shows the CSV route and the connector route give the identical plan for the same rows;
  `connector-e2e` passes every step, including Check CSAT, today and with the clock set 90 days ahead; connector suite,
  1.1 selfcheck, csat tests and the full `node --test test/*.test.mjs` are green. Prediction: e2e 8/8. Disproved by any
  failure, or by an empty preview on either date.

### M3: the team demo
- `node tools/team-demo.mjs` (zero dependencies):
  1. starts the fake connector on a free 127.0.0.1 port, with a temp config, token and state folder;
  2. serves tracker 1.1 plus `demo-seed.js` on 127.0.0.1:8801. A demo-only seed sets the connector address and token on
     that origin, so the tracker file itself does not change. If 8801 is taken, it stops with a message;
  3. opens Chrome with `--user-data-dir` in the temp folder, never Ian's normal profile;
  4. shows a walkthrough page (Check for calls, Read Gainsight accounts, Check CSAT then dry run then Apply, Send to
     Gainsight with 2 sent and 1 failed, the health line naming each adapter fake or unproven). Each step says what the
     real connector will do in its place;
  5. shows a "how it's built" page: the contract and its adapters, the safety rails (127.0.0.1 only, bearer token,
     dry-run default, write gate, sandbox first, idempotent item ids, offline rule), the adapter states from the live
     `/v1/health` ("Snowflake: shaped, unproven" once M1 lands), and test counts. The connector suite runs live at launch
     (about 2 s). Every other count is read from a committed evidence file and shown with its commit and date, never typed
     by hand.
- Ctrl+C, a crash or a closed browser stops every child it started, by PID only. It never touches :8790 or :8800 and
  deletes the temp folder.
- Optional, cut first: a collapsed "show requests" panel listing each contract request and reply.
- Done when: `test/team-demo.test.mjs` runs the launcher headless twice in a row; both runs reach ready, the temp folder is
  gone, the ports are free, and the page's connector count equals the live suite run. A headed run is captured per
  walkthrough step, each capture opened and checked, then the look critic, then Ian's batch.

### M1: the Snowflake adapter, shaped and unproven
- `connector/adapters/snowflake-sql.mjs`, zero dependencies (no snowflake-sdk: that would be an install, which needs Ian's yes).
  - Auth: key-pair JWT, RS256, built with `node:crypto` (measured buildable). `iss = ACCOUNT.USER.SHA256:<fingerprint>`,
    `sub = ACCOUNT.USER`, uppercase, `exp` no more than 1 hour after `iat` (read). The private key file lives outside the
    repo and is never logged.
  - Call: `POST https://<account>.snowflakecomputing.com/api/v2/statements` with statement, warehouse, role, database,
    schema, timeout and `MULTI_STATEMENT_COUNT=1`. A 202 is polled with backoff up to a configured cap (Ian's query ran
    over 1 minute, so this path is the normal one). A 429 retries with jittered backoff, using the same requestId and
    `retry=true`. Partitions are fetched in turn. Columns are mapped by name to the five CSAT fields; a missing column is
    an error that names it.
  - Statement guard: the query comes from a configured `.sql` file. It must start with SELECT or WITH once comments are
    stripped, and may have only a trailing semicolon. The real guard is the read-only role an admin grants; this check is
    a second line.
- `adapters/index.mjs` accepts `snowflake-sql`. `/v1/health` shows `snowflake-sql (unproven)` until a `--check` read proof.
  `--check` gets Snowflake steps (config, key file, auth, one read giving a row count only). On the example config they
  are SKIP lines.
- Fixtures: `connector/fixtures/vendor/snowflake-*.json` for 200, 202 then 200, multi-partition, 422 and 429. They are
  labelled documented-shape: built from Snowflake's docs, not recorded from a real reply.
- `CONNECT-SNOWFLAKE.md`: the admin request (attach Ian's public key; a read-only role with USAGE and SELECT). The
  network-policy question is UNCONFIRMED for this account.
- Done when: new contract tests pass with `test-net-guard` showing no network; `--check` on the example config prints only
  SKIP lines; a config naming `snowflake-sql` shows `snowflake-sql (unproven)` in health; the full connector suite is
  green. Prediction: 180 + N (N stated in the plan). Disproved by any network attempt or any FAIL line on the example config.

### M0b: carried review items (cut first)
- From `look-fixes-final.md` (verdict merge, no must-fix):
  - S1: the FX4 check `found = !dis && !conf` passes when the desk card is absent. It must fail when the card is not
    rendered.
  - S2: add a check that clicks the desk "Add a reason" on a pre-1.2 item and asserts that the reason is written.
  - S3: measure the zero-slack case of the rail reserve. It is assumed, not measured.
  - N1: fix the stale comment.
  - N2: back the CHANGELOG figure with a capture, or drop the figure.
  - N3: saving a reason from the desk must not also confirm an unreviewed signal on the same account. This is a behaviour
    change, ruled by the PM proxy as the most reversible option.
- Look call 6 (the reason line printed once per signal; PM pick: print once) goes in Ian's batch.
- Done when: each new check fails on the parent commit and passes after; the 1.1 count moves by exactly the checks added.

## 6. Out of scope

Live Gainsight, Snowflake or Gong calls; real credentials; switching Ian's real book; editing 1.0; filling `openCtas` from
Gainsight; reading Gainsight objects from Snowflake; Success Plan objective push (blocker B1); any install; publishing or
uploading from the folder.

## 7. Safety

$0 spend. No network from code or tests (test-net-guard, 127.0.0.1 only). Workiva data stays in this repo; only names go to
the brain or studio-harness. Never read `*RESTORE-POINT*` files, exports, or Ian's real CSAT file. Never touch the 6
untracked files in Ian's main checkout. Stop processes by PID only. Push and merge only under the merge rule and the slip.

## 8. Ian's batch at the end of the run

The walkthrough page look; the how-it's-built page look; the request-log panel (if built); look call 6. The PM takes a first
pass on each; Ian decides.
