# T-14 final whole-branch review: connect-ready

Reviewer: top model, read-only. Range `51d1490..99d1051` (branch `worktree-connect-ready`). Method:
`superpowers:requesting-code-review` reviewer template (plan alignment, quality, architecture, tests, readiness).
Read: spec (CR1-CR6, D1-D4, §3, §5, §6), plan (T-14, Blockers B1 (a) / B2 (a), Acceptance map), ledger, build-rules.
I read in full every new connector source file (state, write-gate, unlock, vendor-http, cli, check, setup, measure,
gong-rest, gainsight-auth, gainsight-rest, the index.mjs / server.mjs / config.example / .gitignore diffs, the tracker
diff). I grepped the runbooks, CONTRACT.md and the tests; I did not read every test body.

## Verdict

**Ready to merge: with fixes.** No blocker. Nothing writes to a production tenant without a valid unlock, and no
secret reaches stdout, logs, errors or tracked files on any path I traced. Six should-fix findings. Two of them,
F1 and F3, would break the first live use (Gong's documented 404 when a window has no calls, and a Timeline
duplicate hidden inside an HTTP 200). Counts: **0 blocker, 6 should-fix, 16 low** (one queued item, T-6 onDone
scrubbing, is refuted).

## Measured now (2026-10-03, this worktree, logs in this dir)

| Check | Result | Log |
|---|---|---|
| A-1 `node --test connector/test/*.test.mjs` | 125 tests, 125 pass, 0 fail, exit 0 | `T14-tests.txt` |
| A-2 selfcheck `--expect 475` | 475/475, exit 0 | `T14-a2.log` |
| A-4 `node tools/connector-demo.mjs` | exit 0. I did not compare the summary line by line with §2 | `T14-a4.log` |
| A-5 net guard | all 12 new test files call `installNetGuard()` (grep) | — |
| A-6 secret grep (plan T-14 Step 3 filter) on the branch diff | 45 hits. I read them all: identifiers, prose and test names only. No state file is tracked | `T14-diff.patch` |
| A-8 `--check` with no config, empty `CONNECTOR_STATE_DIR` | exit 0, 0 non-SKIP lines, 0 files written | `T14-a8.log` |
| A-3 / A-9 e2e | **not run by me** (needs Chrome). The lead re-runs them | — |

Vendor fact checked live in this review: the Gong `/v2/calls/extensive` page lists **404 "No calls found for the
specified period"**. Source: https://help.gong.io/apidocs/retrieve-detailed-call-data-by-various-filters-v2callsextensive-2.md,
fetched 2026-10-03 through a summarising fetch, so treat it as a claim from the vendor page. The page gives no
maximum for `filter.callIds`. I did not check the transcript page's 404.

## Strengths

- The write path fails closed. Dry-run is the default (`cfg.dryRun !== false`). The gate reads proof.json only for
  production and blocks when the file is unreadable or corrupt. The unlock is tied to the full tenant tuple
  (appUrl, apiBaseUrl, tenantId). The 1-item first send also holds when two pushes race. `--check --write` refuses
  a tenant that is not marked sandbox.
- Secrets: errors carry `e.message` only, and the message is scrubbed of the key, secret, Basic string, access
  token, client secret, code and refresh token. The dry-run file redacts the bearer. `/v1/push` returns a generic
  502 and logs the detail locally.
- Nothing is guessed. Token field names, the callback code parameter, tenant field names, the CTA company field
  and the CTA id path are all config. Each unknown asks for the value or reports the keys it saw.
- Refresh-token rotation is written to disk before the new access token is used, and refreshes in one process are
  single-flight.
- T-3 was right to parse the flags instead of matching the spec's literal `(unproven)`. The string
  `gainsight-rest (unproven, dry-run)` does not contain `(unproven)`.

## Findings

### F1. should-fix: Gong's "no calls" 404 is treated as a failure everywhere
- **Where:** `connector/adapters/gong-rest.mjs:52-66` (post/eachPage), `:107` (probe); `connector/lib/check.mjs:28-31`;
  `connector/lib/measure.mjs:23-24`; the tracker's `callSinceISO()` (html ~L19177).
- **Defect:** Gong documents 404 "No calls found for the specified period" on `/v2/calls/extensive`.
  `requestJson` throws on every non-2xx, so an empty window becomes an error.
- **Failure scenarios:** (a) The tracker pulls `/v1/calls?since=<last pull>`. Every later "Check for calls" with
  no new calls gets a 502, so the tracker reports a failed check on a normal day. (b) `--check` probes the last 24
  hours. On a weekend or a quiet day it prints `FAIL gong read: Gong HTTP 404 …; who fixes it: Ian (check
  gong.baseUrl…)`, which points at the wrong cause, and no proof is recorded. The proof cannot pass on a quiet day.
  (c) `--measure-transcripts` with no calls in 30 days prints FAIL instead of "no calls in the window".
- **Fix:** in gong-rest, treat a 404 with a JSON body from the extensive endpoint as an empty page (`calls: []`, no
  cursor). Cite the source URL and mark it CONFIRMED (status and text) / UNCONFIRMED (body shape). In `--check`, a
  404 gives `PASS gong auth` (a bad key gives 401) and `PASS gong read: 0 calls in the last 24 hours`, and records
  the proof with `shapes: {noCalls404: true}`. Alternatively the probe can widen to 30 days, so `--check` sees real
  shapes more often. Measure then prints "no calls" through the existing `!st.count` path.
- **Tests:** stub 404 `{requestId, errors:["No calls found…"]}`. Then `listCalls()` resolves `[]`; `runCheck` exits 0
  with a `PASS gong read` line and a proof file; `runMeasure` exits 0 with "nothing to project"; a non-JSON 404
  still FAILs.

### F2. should-fix: `--check` can record a Gong proof from a reply that is not Gong's
- **Where:** `connector/lib/check.mjs:28-39`, `connector/adapters/gong-rest.mjs:107` (`|| {}`), `connector/lib/vendor-http.mjs:25`.
- **Defect:** a 2xx body that is not JSON parses to `null`. The probe turns that into `{}`, then check prints
  `PASS gong read: 0 call(s)` and `recordProof`. The honesty rule says nothing is proven until a live check passes,
  and this would record a proof for a host that is not Gong.
- **Scenario:** a captive portal, a proxy, or a mistyped base URL that answers 200 with HTML. Health then shows
  `gong-rest` with no `(unproven)`, and the tracker drops UNPROVEN.
- **Fix:** before PASS and proof, require `Array.isArray(page.calls)` (or the F1 404-empty path). Otherwise
  `FAIL gong read: the reply is not a Gong call list (top-level keys: …)`, with Ian as the fixer (base URL).
- **Test:** stub 200 `text/html` → exit 1, a FAIL line, no proof.json. Stub 200 `{}` → FAIL.

### F3. should-fix: a Timeline duplicate inside an HTTP 200 leaves the item stuck as failed
- **Where:** `connector/adapters/gainsight-rest.mjs:95-98` (idFrom) and `:187` (the duplicate check reads only
  `e.body`, which only an HTTP error carries).
- **Defect:** the T-8 fix (54986f8) correctly fails a 200 that carries `data.failures[id]`. But the
  `GS_TL_10_0107` duplicate check only runs on non-2xx replies. Gainsight's insert reply is per-record
  (`data.success` / `data.failures`), so a duplicate most likely arrives as a 200 with a failure entry. Where the
  code sits is UNCONFIRMED per research. Today only a 400 is tested (`gainsight-push.test.mjs:95`).
- **Scenario:** an item is sent, then `sent-record.json` fails to write (the code logs "a repeat Send could
  duplicate it") or the process dies before it writes. The next Send gets 200 + `failures[id]` with
  `GS_TL_10_0107`. The item answers `failed` with "Gainsight rejected the item" on every Send and never leaves the
  queue, although it is in Gainsight.
- **Fix:** in idFrom, when `JSON.stringify(bad)` contains `DUPLICATE_EXTERNAL_ID`, return `it.id`, the same as the
  400 path. Keep the comment that the location is UNCONFIRMED.
- **Test:** stub 200 `{data:{success:{},failures:{"q-timeline-1":[{errorCode:"GS_TL_10_0107"}]}}}`. The item is
  `sent` and recorded, and a second push makes 0 fetch calls.

### F4. should-fix: two processes can spend the same single-use refresh token
- **Where:** `connector/adapters/gainsight-auth.mjs:47-72`.
- **Defect:** `inflight` serialises refreshes within one tokenSource in one process only. The running connector
  and a `--check`, `--check --write` or `--measure`-style CLI run in a second terminal each read the same
  `gainsight-tokens.json`. Once the access token is more than 58 minutes old, both refresh with the same refresh
  token. Spec §3.1 (CONFIRMED): refresh tokens are single-use and "reuse trips breach detection".
- **Scenario:** the tracker is open with the connector running. An hour later Ian runs `--check`, as the runbook
  says. The two refreshes collide, Gainsight may revoke the token family, and every call fails until `--setup`
  signs in again.
- **Fix:** take an exclusive lock `gainsight-tokens.json.lock` (`openSync(path,'wx')`) around refresh, waiting
  briefly while it exists and treating a lock older than 60 s as stale. After taking the lock, re-read the tokens
  file. If `obtainedAt` is newer than the value read before, use it and do not refresh. Remove the lock in
  `finally`. Add `connector/*.lock` to `.gitignore`. Add one line to CONNECT-GAINSIGHT.md, in the same commit.
- **Test:** two `createTokenSource` instances on one tokensPath, an expired token, and a stub that counts refresh
  POSTs. `Promise.all` of both `accessToken()` calls makes exactly 1 refresh call, and both return the new access
  token.

### F5. should-fix: the Gong runbook and `--check` give unconfirmed facts as instructions (T-13 queue, confirmed)
- **Where:** `connector/CONNECT-GONG.md:12-13` (and the table at `:37`); `connector/lib/check.mjs:29-30`.
- **Defect:** step 1 tells the admin to create an **access key** at "Admin center > Settings > Ecosystem > API" and
  give it the scope `api:calls:read:extensive`. Research confirms that menu path for creating an **OAuth app**
  (research-vendor-apis.md:61) and that scope for OAuth/Bearer access (:21, :38). How a Basic key gets scopes is
  UNCONFIRMED (:67), and the runbook's own facts list says "to confirm" (CONNECT-GONG.md:62). The instruction
  contradicts that list and breaks the rule that every vendor fact carries CONFIRMED or "to confirm". The `--check`
  FAIL texts repeat both as fact.
- **Scenario:** the admin looks for a scope picker on the key page and finds none, or the key page is somewhere
  else. Ian is told a 403 means a scope is missing when the cause may be different.
- **Fix:** step 1: "Create an API access key (the OAuth app lives at Admin center > Settings > Ecosystem > API,
  CONFIRMED; whether the key page is there too is to confirm). If the key page offers scopes, include
  `api:calls:read:extensive` (scope model for Basic keys: to confirm)." In check.mjs:29-30, soften to "on the Gong
  API page" and "may need api:calls:read:extensive (to confirm)".
- **Test:** extend `docs.test.mjs` so that the step-1 lines naming the path or scope contain "to confirm", and
  check.mjs's 403 text does not state the scope as fact.

### F6. should-fix: the runbook's fill-in list misses `gainsight.authorEmail`
- **Where:** `connector/CONNECT-GAINSIGHT.md:44`; code `connector/adapters/gainsight-rest.mjs:79,106` (`need(...,'authorEmail')`).
- **Defect:** the list of config keys to fill names `fieldMap`, `gateFieldMap`, `contactQuery`, `timeline.typeName`
  and `cta`, but not `authorEmail`. `--setup` never asks for it, yet every Timeline and CTA send needs it. This is
  a doc out of step with the code.
- **Scenario:** `--check --write` on the sandbox answers `config gainsight.authorEmail is empty; see
  connector/CONNECT-GAINSIGHT.md`, and that page does not mention the key.
- **Fix:** add `authorEmail` (a Gainsight user's email, used for Author and CTA owner) to the list. Optionally,
  `--setup` asks for it.
- **Test:** a docs.test assertion that every key `need()` checks appears in CONNECT-GAINSIGHT.md.

### F7. low: health throws on a corrupt proof.json
- `gainsight-rest.mjs:229`, `gong-rest.mjs:87`: the `name` getters call `loadProof`, which `JSON.parse`s without a
  catch. A corrupt proof.json makes `/v1/health` throw, so the tracker shows offline instead of UNPROVEN, and the
  real reason is hidden. The write gate already handles this case. Fix: catch and treat as unproven. Test: corrupt
  proof.json → health 200 with `(unproven)`.

### F8. low: the scrub runs after JSON.stringify (T-5 queue, confirmed)
- `connector/lib/vendor-http.mjs:27-28`: a secret containing `"`, `\` or control characters is escaped inside the
  stringified body, so the raw secret no longer matches. Gong keys, Basic base64 and bearer tokens normally contain
  none of these, so the realistic exposure is about nil. Fix: in `scrubAll`, also scrub
  `JSON.stringify(secret).slice(1,-1)`. Test: secret `FAKE"sec\\ret` echoed in a 400 body is absent from the message.

### F9. low: `VendorError.body` keeps the raw reply, unscrubbed
- `vendor-http.mjs:7,29`: nothing prints it today; only the duplicate check reads it. An uncaught VendorError at the
  CLI top level would print it through Node's default handler. Fix: keep only what is needed (for example a
  `duplicate` flag), or scrub the body. List only.

### F10. low: no OAuth `state` (T-6 queue, confirmed; do not require it)
- `gainsight-auth.mjs:19-26, 80-102`: the Gainsight authorize parameters in research are `clientId`,
  `redirectUri` and `scopes` (research-vendor-apis.md:99-100). `state` is documented for Gong's OAuth (:62), not
  Gainsight's. The exposure is a login-CSRF: a page in Ian's browser would have to hit the one-shot callback,
  inside the 10-minute setup window, knowing the configured code-param name, with a code valid for Ian's own
  tenant. Recommend config-optional `oauth.stateParam`: when set, send a random value and require it echoed; when
  empty, behave as now. Do not make it required while it is unconfirmed. List only.

### F11. low: no `X-Content-Type-Options: nosniff` on the callback reply (T-6 queue, confirmed)
- `server.mjs:111-113`: a `text/plain` reply reflects the query names. Modern browsers do not sniff text/plain into
  HTML, so the risk is nil-to-low. A one-line header fix. List.

### F12. refuted: onDone's exchange error text is scrubbed (T-6 queue)
- `gainsight-auth.mjs:35-38, 99`: `tokenCall` scrubs the client secret and the code from vendor errors. `persist`
  errors carry only the path and an errno code. Network errors are fixed text. No action.

### F13. low: T-7 test gaps (queue, confirmed)
- `toAccount` gates use `=== true` (`gainsight-rest.mjs:43`), so `1` and `"true"` give false. That is fail-safe:
  the gate is not offered. No test pins this behaviour. There is also no test for the `apiBaseUrl`-empty "not
  configured" throw (`:137`). Add both tests. List.

### F14. low: no test for one item failing inside a batch (T-8 queue, confirmed gap)
- By reading `sendOne`/`push` (`:183-225`), a failed item is returned and the loop continues. Add a 3-item test
  (fail in the middle) asserting the other two are sent and recorded. List.

### F15. low: T-10 test gaps (queue, confirmed)
- No test that Gainsight secrets (client secret, access token) are absent from `--check` output, and no
  `--check --write` partial-failure test (one kind fails → no write proof; by reading `check.mjs:90-100`, `ok=false`
  skips `recordProof`). List.

### F16. low: T-11 gaps (queue, confirmed)
- No test for config.json mode `0o600` (ignored on Windows anyway). No test that config.example.json is untouched
  (by reading, `configPath` is never the example unless `CONNECTOR_CONFIG` points at it). Empty secret answers are
  accepted (`setup.mjs:45-46, 61-62`). The `--check` that follows then FAILs "missing gong.accessKeySecret", so the
  user is told, one step late. Fix cheaply with `askValid(…, v => !!v)` for secrets. List.

### F17. low: `--measure-transcripts` arithmetic and the request (T-12 queue, confirmed)
- `measure.mjs:34`: when every transcript is empty the mean is 0, which gives `Infinity`; book larger than quota
  gives a negative number; a bad flag (`--book-bytes abc`) gives `NaN` (`cli.mjs:40`). Fix: validate the flags as
  finite and non-negative, and print "not computed (reason)" otherwise. `gong-rest.mjs:95` sends every callId in
  one request; no maximum is documented on the extensive page, and I did not check the transcript page. A 30-day
  window of one user's calls is small. No tests for 403, the wrong-adapter FAIL or zero calls (F1 adds zero calls).
  List.

### F18. low: calls without a transcript count as 0 characters
- `gong-rest.mjs:94`: every id starts at 0, so calls Gong has not transcribed (or did not return) pull the
  median down. Report "calls with no transcript: n" and exclude them from the stats, or label the figure. List.

### F19. low: "sandbox" is self-declared (by design, §3.4(1); not reopened)
- `write-gate.mjs:14`, `check.mjs:78`: a production tenant mislabelled `environment: "sandbox"` gets live writes
  and `[SBX] TEST` records. This is what the spec rules. A possible cheap guard, for Ian to decide: `--setup` warns
  when the chosen environment is sandbox but the URL matches a recorded production unlock. List.

### F20. low: an unknown CLI flag starts the server
- `server.mjs:137-154`: `node connector/server.mjs --chek` is not in `COMMANDS`, so the connector starts listening
  silently. Fix: any argument that is not a command prints usage and exits 2. List.

### F21. low: health shows no flag for a locked production tenant
- With `dryRun:false` on production, a read proof and no unlock, health says `gainsight-rest` (status "connected"),
  but every Send fails with the unlock message. The message names the step, so this is honest, but the status line
  could show it. List.

### F22. low: a duplicate ExternalId stores our item id as `externalId`
- `gainsight-rest.mjs:187`: the Gainsight activityId is not known, so the item id is recorded. Document it in
  CONTRACT.md (externalId may be our id for a re-sent Timeline item). List.

### F23. low: an invalid `obtainedAt` means the token is never refreshed
- `gainsight-auth.mjs:68`: `Date.parse` gives NaN, the comparison is false, and an expired token is used forever
  (401s). Treat NaN as expired. List.

## Fix now (blockers + should-fix), three batches

**Batch A — Gong reads: empty-window 404 and an honest probe** (F1, F2). About 6 steps: red tests (404 → [], check
PASS + proof with noCalls404, measure "no calls", HTML 200 → FAIL no proof); gong-rest 404 handling with the source
comment; check.mjs shape guard and 404 path; CONTRACT.md / CONNECT-GONG.md FAIL table in the same commit; run
connector tests and the demo.

**Batch B — Gainsight seams: duplicate inside a 200, cross-process refresh lock** (F3, F4). About 8 steps: red test
for 200+failures duplicate; idFrom fix; red test for two token sources making 1 refresh; lock + re-read in
`refresh`; `.gitignore` `connector/*.lock`; CONNECT-GAINSIGHT.md line; run tests and the demo; confirm no `.lock`
is left in a temp state dir.

**Batch C — Runbook honesty** (F5, F6). About 5 steps: red docs.test assertions (step-1 path/scope marked "to
confirm"; every `need()` key named in CONNECT-GAINSIGHT.md); edit CONNECT-GONG.md step 1 and its FAIL table;
soften check.mjs 401/403 texts (and their test expectations); add `authorEmail` to CONNECT-GAINSIGHT.md; run tests.

## List only

F7, F8, F9, F10, F11, F13, F14, F15, F16, F17, F18, F19, F20, F21, F22, F23 (low). F12 refuted. If a batch has spare
steps, the cheapest of these are F7 (one try/catch), F11 (one header), F23 (one NaN check) and F16's
empty-secret re-ask.
