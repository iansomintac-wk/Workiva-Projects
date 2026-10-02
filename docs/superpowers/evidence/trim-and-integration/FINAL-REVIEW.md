# Final whole-branch review: trim-and-integration (b1a8452..733a195)

Reviewer: final review, read-only. Measured during this review:
- `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 459` gave `runSelfChecks: 459/459 passed, 0 failed`, exit 0 (log: `selfcheck.log`).
- `node --test "connector/test/*.test.mjs"` gave 41 tests, 41 pass, exit 0 (log: `contract.log`).
- The tracker and guide sha256 values match VALIDATION.txt (fb952bb3…, ab5b092b…; 1,228,361 bytes).
- Secrets scan of the changed files found no key-shaped strings. The only 64-hex strings are checksums. No token.txt, config.json, docs/research/internal, PNG or JSONL files are tracked.
- A TZ probe confirmed issue I-3 (see there).

I did NOT run e2e 7/7 myself. That figure comes from the ledger and README.

## Strengths

- The contract boundary is clean. The server validates every response against its schema before sending it. It binds 127.0.0.1 only and compares the token in constant time. The key is never taken from a request, and provider errors have the key scrubbed out.
- The tracker's `normalizeConnectorUrl` accepts loopback only, so a pasted URL cannot send the token anywhere else.
- Every connector and AI string I traced into HTML is escaped: the call preview, the Gainsight diff (`gainsightValueHtml`), the queue row error and externalId, and `renderDayBriefFor`.
- The offline rule holds on every path I read. Each connector call catches OFFLINE and UNAUTHORIZED, writes nothing, and the toast says so.
- Writes are ticked-only, with one undo snapshot and one save each (`applyCallImport`, `applyGainsightPull`). A blank in Gainsight never erases a tracker value.
- Schema 16 migration is idempotent. `normalizeQueueItem` runs on both migrate and import. The tracker's task strings match the `ai-request` enum exactly, and the push `kind` enum matches the four kinds the tracker produces (checked against git history too).
- Docs counts agree everywhere at 459 / 41 / 7: README, VALIDATION, CHANGELOG, guide-manifest and header rule 5.

## Critical

None.

## Important

**I-1. `activity.gong` is never normalised on load or import. The normaliser sits inside the riskLog loop.**
- Where: `osm-book-of-business-tracker-1.0.html`, `repairAuxiliaryCollections`. The block `if(e.gong !== undefined){ normalizeGongLink(e.gong) … }` (about line 18237) is inside `Object.keys(data.riskLog).forEach(k => { const e = data.riskLog[k]; … })`. So it normalises riskLog entries, which never carry `gong`. `normalizeActivityCollections` (the activity loop) has no `gong` branch.
- How it fails: an imported or hand-edited book can carry any `gong` value on an activity, and it is kept as-is. Examples: a 5 MB `gong.summary`; `gong.url: "javascript:…"`; `gong.callId: 42`. The C-1 design says the normaliser runs wherever the field is present. Known follow-up 4 plans to render `gong.url` as an href, and it will trust this unvalidated value. Check `c1d` is titled "…activity.gong survive export/import **and are normalised**", but it only round-trips an already-valid gong object. It passes with no normaliser at all, which is why this slipped through.
- Fix: move the `gong` block into `normalizeActivityCollections` (next to the `a.transcript` branch). Make c1d import a malformed gong (non-string callId, `javascript:` url, oversize summary) and assert it is dropped or clamped.

**I-2. Every imported Gong call stores its full transcript in localStorage, so a real book will fill browser storage within weeks.**
- Where: `applyCallImport` sets `act.transcript = {text: … up to DEBRIEF_TRANSCRIPT_CHAR_CAP (120,000)}` for every ticked call, with no opt-in. `saveData` writes the whole DATA to localStorage. When the quota is hit it only toasts "Save failed", and from then on every edit fails to save.
- How it fails: using Ian's baseline of 8–12 calls a week, at an estimated 40–60k characters per 45-minute transcript (an estimate, not measured against real Gong), that is about 0.4–0.6 M characters a week. Chrome's per-origin localStorage limit is about 5 M UTF-16 characters, and all `file://` pages share that one origin. The book would stop saving in roughly 2–3 months, and sooner after a first 30-day pull. The fake fixtures have short transcripts, so no check or e2e step can see this. Before this branch, a stored transcript was a manual paste per debrief. Now it is automatic for every call.
- Fix: don't persist the transcript on import. Store `gong.callId`/`url` and fetch the transcript from the connector when a debrief needs it, or make storing it an opt-in per row. Add a size guard before `saveData` in `applyCallImport`.

**I-3. Gong calls are dated by their UTC day, so evening calls in US time zones are refused as future-dated or logged a day late.**
- Where: `applyCallImport` uses `const date = call.startedAt.slice(0, 10)` and then `if(date > today) return;`, where `todayISO()` is the local date. `openCallPreviewModal` (`callLine`) uses the same slice.
- Measured: with TZ=America/Los_Angeles, `startedAt 2026-10-01T01:30:00Z` slices to `2026-10-01` while the local date is `2026-09-30`.
- How it fails: a call at 6:30pm PT, checked the same evening, is silently skipped ("Nothing was added", or a lower count). Because `ui.lastCallPullAt` then moves past it, it does not reappear until a reload. After that it is logged on the wrong day, which skews last-touch and risk timing.
- Fix: `const date = localDateISO(new Date(call.startedAt))`, both in `applyCallImport` and in the preview.

**I-4. `applyPushResults` matches results against the whole queue instead of the ids that were sent** (known follow-up 6). Assessment: fix now.
- Where: `applyPushResults` uses `queue.find(x => x.id === r.id)`.
- How it fails: a connector that IT re-implements (the contract invites Workato) and that echoes an extra or wrong id marks a queued item that was never sent as `sent` with an externalId. That item then never goes to Gainsight, and the OSM sees "✓ sent". The loss is silent, and the fix is one line.
- Fix: pass the request ids, e.g. `applyPushResults(resp.results, new Set(items.map(q => q.id)))`, and ignore results outside that set.

**I-5. A timeout is reported as "offline", so a push may be sent twice and a slow AI request is sent a second time on the browser key.**
- Where: `connectorRequest` catches every fetch rejection, including the `AbortController` timeout, as `code: 'OFFLINE'`.
- How it fails, push: `/v1/push` has the default 15 s timeout. If the connector is slow but did push, the tracker says "Connector offline — nothing was sent" and leaves the items queued. The next Send creates duplicates in Gainsight. CONTRACT.md says nothing about push being idempotent by item id.
- How it fails, AI: the tracker's AI timeout (60 s) equals the connector's provider timeout (60 s). A slow provider makes the tracker abort first. `callAiAPI` then treats that as OFFLINE and silently re-sends the whole prompt straight to the provider with the browser key: a second paid call that routes around the connector. Without a browser key, the OSM is told "The connector is not reachable. Start it with node connector/server.mjs" while it is running.
- Fix: map `AbortError` to `code: 'TIMEOUT'`. Don't fall back on TIMEOUT. For push, say "may have been sent; check before retrying". Set the tracker's AI timeout above the connector's (e.g. 75 s). Add one line to CONTRACT.md that `/v1/push` must be idempotent on `items[].id`.

**I-6. "Brief my day" will likely truncate on a real-size book, and then shows nothing.**
- Where: `briefMyDay` calls `callAiAPI(…, {task:'brief_my_day', maxTokens: 3200})`. `parseDayBrief` needs the whole JSON object.
- How it fails: Ian's baseline is 25–40 accounts. One entry (id, nextAction, reason, plus a flag with text and reason) is about 100–150 output tokens; this is an estimate, not measured on a real model. 40 × ~125 is about 5,000 tokens, which is over 3,200. The cut-off JSON fails `JSON.parse`, the error branch shows "could not be read as a day brief" for the whole book, and the length-cap note is not shown because that branch ignores `res.truncated`. Pressing "Brief again" fails the same way. The fake adapter returns compact JSON, so the e2e passes.
- Fix: size maxTokens to the number of accounts (e.g. 200 × open accounts, with a ceiling), or ask for compact keys. When `res.truncated && parsed.error`, say that the length cap was hit. Measure once on a real model before claiming it works.

## Minor

- **M-1. `ui.lastCallPullAt` advances to "now" on Add** (`openCallPreviewModal`, the `#cp-add` handler). `since` filters on `startedAt`. A call that Gong finishes processing after a pull, or that was left unticked, falls before the new `since` and stays hidden for the rest of the session. Dedupe by callId already exists. Fix: always use the 30-day window, or don't advance `since` past the oldest unticked call.
- **M-2. The tracker throws away the connector's error message.** `connectorErrorFor(status)` never reads the `{error}` body, so the 502 the contract carefully scrubs ("Invalid API key. Check the key in the connector config.") reaches the OSM as "The connector answered HTTP 502." Fix: read `resp.json().error` (escaped where it is rendered) and append it.
- **M-3. The account Gainsight tab counts sent items as queued.** `renderCustomerGainsightTab` uses `getGainsightQueue().filter(q => q.customerId === c.id).length` and shows "N queued". Its comment (about line 12495) still says "there is no transport behind the queue", which is false since C-5. Fix: filter `status !== 'sent'` and update the comment.
- **M-4. One bad queue item blocks the whole push.** `normalizeQueueItem` accepts any `kind` (default `'item'`) and an empty `customerName`. The push schema requires the 4-value enum and `name` minLength 1, so one such imported item turns "Send all" into a 400 for every item, again and again. Fix: in `buildPushRequest`, skip and flag items whose kind is outside the enum or whose name is blank.
- **M-5. `normalizeGainsightPull` clones `values` with no size limits.** A large `contacts` array from Gainsight is copied into every pulled customer (`c.gainsight`). Fix: cap `contacts` (e.g. 50) and the string lengths, as `normalizeGongLink` does.
- **M-6. Self-checks that depend on the live book's shape** (the same class C-7 fixed):
  - `c6a` uses `live[0].id, live[1].id`, so it throws with fewer than 2 open accounts.
  - `c6c` and `c6d` use `open[0]` and `…[0]`, so they throw with no open account.
  - `c3d` uses `DATA.customers.find(x => !inImplementation(x) && x.totalSessions > 0)`; with no match, `renderLogActivityTab(undefined)` throws.

  They pass on demo-seed and used-book-seed, but would fail in a real book with one open account or with every account in implementation. Fix: build the 2–3 fixture customers inside each check, as c3c now does.
- **M-7. Known follow-ups, assessed:**
  - (1) `ui.aiPortfolioBrief` is only ever null: acceptable, delete it in the next pass.
  - (2) b0 temp profiles left behind: acceptable, it is a spike tool.
  - (3) Settings "Check" saves before Cancel, and a malformed URL is dropped silently: worth fixing soon. Typing `localhost:8787` without `http://` leaves the connector "unset" with no message. Show "address must be http://127.0.0.1:<port>".
  - (4) Email activities with a sessionNumber from import: acceptable. The `gong.url` href must wait for I-1.
  - (5) No checks for bad values in `buildGainsightDiff` or for undo of a pull: acceptable, add when touched.
  - (7) Weak c6d/c6c clauses: acceptable.
  - (8) `String(fn).indexOf` checks: acceptable as wiring guards, but they pass on renamed-but-dead code. Prefer behavioural checks when next touched.
- **M-8. Stale prose.**
  - Tracker header line 4 and README line 5 say "no server". Correct with "optional local connector".
  - README line 24 says AI features "call the Anthropic API". They can now go through the connector or to OpenAI or Gemini.
  - The CHANGELOG 1.0 entry (line 37) says the 1.0 suite was "in tools/selfchecks.js". That is anachronistic: it moved there at A1.
  - Ledger "Look calls for Ian (batched): None yet" is stale after Ian's C-8 ruling.
  - Comments at lines 2049, 2484 and 2633 refer to a "portfolio brief" (now the Copilot read).
- **M-9. Origin `null` acceptance is broader than `file://`.** Every sandboxed iframe on any website also sends `Origin: null`, so the bearer token is the only guard. This is acceptable with a 32-byte token, but CONTRACT.md should say it plainly so that whoever re-implements the contract never makes the token optional.
- **M-10. The connector token sits in `file://` localStorage, where Chrome lets every local HTML file read it.** The browser AI key already has the same exposure, and the CONTRACT/README framing is accurate. Note it in the admin-ask draft.

## Verdict

Ready to merge after fixes: **yes**, once I-1, I-3 and I-4 are fixed (all three are small) and a decision is made on I-2, I-5 and I-6. I-2 and I-6 only appear with real data volumes, so they could be logged as blockers for the first real adapter instead of being fixed in this merge. That choice is Ian's. Nothing is Critical: every new path is offline-safe, escaped and ticked-only.
