# Connect-ready: real Gong and Gainsight adapters built ahead of the admin (2026-10-02)

**Objective (Ian, 2026-10-02, verbatim):** "It might take a while before i get any admin to provide anything. I just
want everything already setup so that all they would need to do is just help me connect it."

This is the talk half of "one objective, two sessions". The run builds it from
`docs/superpowers/sessions/connect-ready-run.md`. Prior work: `docs/superpowers/specs/2026-10-01-trim-and-integration-design.md`
(R1-R10 still stand) and `connector/CONTRACT.md` (v1, unchanged in shape by this spec).

**The honesty rule this spec keeps.** The admin ask said an adapter that cannot run against the real service "would
pass its tests without proving anything". So nothing built here is called working until a live check has passed
against the real tenant. Until then every real adapter reports itself `unproven`, the tracker shows it, and Gainsight
writes are gated (§3.4). Tests prove the mapping from the vendors' documented shapes. Only `--check` proves the vendor.

## 1. Rulings (Ian's words, verbatim)

Each ruling quotes Ian's answer as given in the talk (option labels he picked, as shown to him). The run does not
reopen a ruling. If the code makes one impossible, it stops and asks.

| # | Question | Ian's words | Meaning for the build |
|---|---|---|---|
| CR1 | Real adapters before credentials? | "Build, gated (Recommended)" | Real Gong and Gainsight adapters from the public docs, tested on recorded-shape fixtures, `unproven` in health until a live `--check` passes; writes blocked until their own proof (§3.4) |
| CR2 | Safeguards on the first real Gainsight writes | "Dry-run mode (Recommended), Sandbox first (Recommended), Would any research here help on how other similar tools are doing this?" | Dry-run is the default; production writes need a sandbox self-test pass (or, with no sandbox, Ian's explicit unlock). No daily write cap. The research question led to CR3 |
| CR3 | Research-suggested additions | "Saved send record (Recommended), Pass tied to tenant (Recommended), First live Send = 1 item (Recommended)" | Persisted item-id → Gainsight-id record; a sandbox pass is void if the tenant changes; the first production push sends 1 item. Plan-then-apply was not chosen |
| CR4 | Transcripts before I-2 is decided | "Off + measure (Recommended)" | `gong-rest` sends `transcript: ""`; a read-only `--measure-transcripts` reports real sizes so Ian can make the I-2 choice later |
| CR5 | How credentials reach the laptop | "Guided setup (Recommended)" | `--setup` asks one value at a time, writes the git-ignored `config.json`, runs `--check`; one runbook per vendor |
| CR6 | Design sections 1-3 | "Yea" / "Yes" / "Yes" | §3-§5 as written, including the four defaults in §3.6 |

Earlier rulings this spec touches: **I-2** (Ian chose C: block the first real Gong adapter until real transcript
sizes are measured) is kept by CR4, because no transcript reaches the book before the measurement. **R1** (only
Claude, Gemini or ChatGPT) is untouched.

## 2. Baseline (MEASURED 2026-10-02 at `aced277`, worktree `connect-ready-talk`)

| Measure | Value |
|---|---|
| Self-checks | `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 473` gives **473/473, exit 0** |
| Connector tests | `node --test connector/test/*.test.mjs` gives **43 tests, 43 pass, 0 fail, exit 0**. Note: `node --test connector/test/` (directory form) **fails on Windows** with 1 bogus failing "test"; always pass the file glob |
| End-to-end | `node tools/connector-e2e.mjs`: scenarios **7/7 passed**, but **exit 1 in 2 of 2 runs**. Cause: `cleanup()` (`tools/connector-e2e.mjs`, `rmSync(profile, …)`) throws `EPERM` on Chrome's temp profile after `taskkill`; the throw is uncaught, so a full pass exits 1. 2 leftover `connector-e2e-chrome-*` dirs were in `%LOCALAPPDATA%\Temp` afterwards. The 2026-10-01 ledger's "e2e 7/7" is true of the scenarios, not of the exit code |
| Demo | `node tools/connector-demo.mjs` **exit 0** (6 calls, 17 accounts, 2 sent / 1 forceFail, fake AI) |
| Connector source | `connector/adapters/*.mjs` + `server.mjs` = **15,535 bytes**; Node built-ins only, no `package.json` |
| Adapters | Gong `fake`; Gainsight `fake`; AI `fake`, `claude`, `openai`, `gemini` (AI real ones tested on stubbed fetch only) |
| Network guard | `connector/lib/test-net-guard.mjs` blocks and records any test fetch not to 127.0.0.1; used by `ai.test.mjs` and `server.test.mjs` |
| Tracker status line | `applyConnectorHealth` / `renderConnectorStatus` (tracker ~L1855-1886): `c.fake` is true only when an adapter string is exactly `"fake"`. **Any other string renders "Connector: connected"**, so an unproven adapter would look live today |
| `transcript` in `schemas/calls.json` | required string, no `minLength`, so `""` is valid without a contract change |

Logs of these runs were in the talk's job temp dir and are not kept. The run re-measures before planning.

## 3. Design

### 3.1 Vendor facts used (research 2026-10-02)

Source notes: `docs/superpowers/evidence/connect-ready/research-vendor-apis.md` (14 questions; 10 CONFIRMED on the
vendor's own pages, 4 UNCONFIRMED or partial) and `research-write-safety.md` (Stripe, Terraform, Zapier, Workato,
Make, Gainsight, HubSpot). Both were read through a summarising fetch, so field names are claims until a live run.
Every adapter constant taken from them carries a comment with its source URL and CONFIRMED / UNCONFIRMED.

What the adapters rely on:
- Gong: base URL is per customer; Basic auth with access key:secret. `/v2/calls/extensive` lists calls with
  parties and brief in one request, cursor-paged; the date filter needs both `fromDateTime` and `toDateTime`.
  Affiliation is Internal / External / Unknown, mapped to `internal` / `customer` / `unknown`. `primaryUserIds`
  matches the host only, so "my calls" is a participant-email filter on the laptop. Transcript length = sum of
  `sentences[].text` lengths across `/v2/calls/transcript`.
- Gainsight: per-API base URLs (Company and Person differ). OAuth authorization code: authorize at
  `<app>/v1/authorize`, token at `<app>/v1/users/oauth/access/token`; access token 3600 s; refresh token 365 days,
  **single-use and rotated on every refresh** (reuse trips breach detection). Company query
  `POST /v1/data/objects/query/Company` with `select`/`where`/`limit`/`offset`, max 5,000 per call. Timeline create
  `POST /v1/ant/es/activity` with `ExternalId`. Success Plan `v2/successPlan`. CTA create/update
  `POST`/`PUT /v2/cockpit/cta` (confirmed this time; the admin ask had it "to confirm"). Only Timeline has a
  dedupe key (`ExternalId`); Success Plans and CTAs do not. Rate limit pages disagree (100 vs 200 calls/min); plan to
  the lower.
- Unknowable without a tenant (become config or `--check` steps, never guesses): Company field names for tier,
  ARR, renewal date, CSM owner, health; `data` vs `data.records` in query responses; Gong `brief` key; Person-by-email
  path; whether an OAuth bearer works on every endpoint; Timeline duplicate-`ExternalId` reply; sandbox details for
  both vendors; Ian's Gong user and tenant URL.

### 3.2 Proof model

- New git-ignored `connector/proof.json`: per adapter, `state` (`unproven` | `proven`), `provenAt`, `tenant`
  (base URL and, for Gainsight, tenant id) and the response shapes `--check` observed. Gainsight carries separate
  `read` and `write` proofs.
- `/v1/health` adapter strings stay single strings (no contract bump): `"gong-rest (unproven)"`,
  `"gainsight-rest (unproven, dry-run)"`, `"gainsight-rest (dry-run)"`, `"gainsight-rest"`. A CONTRACT.md version
  note records the suffixes.
- A proof is void when the configured tenant differs from the one it was recorded against (CR3).

### 3.3 Adapters

- **`gong-rest`** (`listCalls({since})`): extensive call list from `since` (default 30 days back) to now, all
  cursor pages, filtered to calls where `gong.myEmail` is a participant. Maps to `schemas/calls.json`; `summary` from
  the brief (empty string if absent); `transcript` always `""` (CR4); `accountRef` from Gong's CRM context if
  present, else `{gainsightId:null, name:null}` so the tracker's existing name/email matching applies. Errors scrub
  key and secret (same pattern as `ai-shared.mjs`).
- **Gainsight auth**: authorization-code exchange through `GET /oauth/callback` on the connector (redirect URI
  `http://127.0.0.1:<port>/oauth/callback`, registered by the admin). Tokens in git-ignored
  `connector/gainsight-tokens.json`. On refresh, the new refresh token is written to disk **before** the new access
  token is used. A failed write stops the request with an error naming the file.
- **`gainsight-rest` reads** (`listAccounts()`): Company query with `gainsight.fieldMap` (config; keys `tier`, `arr`,
  `renewalDate`, `csmOwner`, `healthScore`, each a tenant field name or empty = `null`), all offset pages; reads
  `data` or `data.records`; contacts through the Company Person object query (UNCONFIRMED; an empty list if the
  query is not configured). `gates` and `openCtas` per `schemas/accounts.json`; a field the tenant lacks is `null`.
- **`gainsight-rest` push** (`push(items)`), by queue kind (default D1 in §3.6):
  - `Success Plan objective` → `v2/successPlan` objective; `At-Risk CTA` → `POST /v2/cockpit/cta`;
  - `Pending items batch` and `Success Outcome Plan` → a Timeline activity whose notes carry the content.
  - **Saved send record** (CR3): git-ignored `connector/sent-record.json`, item id → `{externalId, kind, tenant, at}`,
    written after each success and read on start. A repeated id answers `sent` with the stored id and makes no call.
    Timeline items also send the item id as `ExternalId`. A `failed` id is not stored (contract rule unchanged).
  - **Dry-run** (CR2), on by default (`gainsight.dryRun: true`): builds the exact requests, appends them with
    credentials redacted to git-ignored `connector/dry-run.jsonl`, and answers each item
    `failed` with `error: "dry run: not sent; see connector/dry-run.jsonl"`, so items stay in the tracker's queue.

### 3.4 Write gate (CR2, CR3)

A non-dry-run push is allowed only when one of these holds for the configured tenant:
1. `gainsight.environment` is `sandbox` (writes to a sandbox are the proof itself), or
2. a sandbox write proof exists **and** Ian ran `--unlock-production`, or
3. no sandbox exists and Ian ran `--unlock-production`, which prints the tenant and requires typing the tenant URL
   back.

Otherwise each item is `failed` with an error naming the missing step. After unlock, the **first production push
sends only its first item**; the rest answer `failed: "first live send is 1 item; check it in Gainsight, then Send
again"`. The limit lifts after that item is `sent`.

### 3.5 Commands (all in `server.mjs` argument handling, Node built-ins only)

- **`--check`**: read-only. Per configured adapter: config present, auth, one smallest read, Gainsight `fieldMap`
  probe (one Company with the mapped fields; names each rejected field). Prints one line per step: `PASS`,
  `FAIL <step>: <what to fix, who fixes it>` or `SKIP <not configured>`. Exit 0 when nothing FAILs. All reads passing
  records the read proofs.
- **`--check --write`**: only when `gainsight.environment` is `sandbox`. Creates one `[SBX] TEST-<date>` record of
  each push kind, reads each back, records the write proof tied to the tenant. Test records are **left in the
  sandbox** (default D4). Refuses with a message on a production tenant.
- **`--setup`** (CR5): one question at a time per vendor, either vendor skippable. Gong: base URL (format-checked),
  access key, secret (not echoed), Ian's Gong email. Gainsight: tenant URL, sandbox or production, OAuth client id
  and secret (not echoed), then prints the authorize URL and waits for the callback. Writes `config.json`, then runs
  `--check`.
- **`--unlock-production`**: §3.4.
- **`--measure-transcripts`** (CR4): read-only, stores nothing. Last 30 days of Ian's calls; prints count, median,
  90th percentile and max transcript characters, calls per week, and projected months until the book's localStorage
  fills given `--book-bytes <n>` and a stated quota (default 5,000,000 bytes, labelled an assumption). Every figure is
  labelled `measured` or `derived`.

### 3.6 Defaults approved with section 3 (CR6)

- **D1** Queue kinds without a confirmed Gainsight object (`Pending items batch`, `Success Outcome Plan`) go to a
  Timeline activity.
- **D2** Tracker status line: "Connector: UNPROVEN" when any adapter string contains `(unproven)`, "Connector: DRY
  RUN" when one contains `(dry-run)`; warning colour, like FAKE DATA. FAKE DATA keeps priority.
- **D3** Production unlock without a sandbox: `--unlock-production` with the tenant URL typed back, then the 1-item
  first send.
- **D4** Sandbox test records are labelled `[SBX] TEST-` and left in the sandbox; delete endpoints for CTA and
  Success Plans were not confirmed.

### 3.7 Docs (same commit as the code they describe)

- `connector/CONNECT-GONG.md`, `connector/CONNECT-GAINSIGHT.md`: part one for the admin (where to click, scopes,
  the redirect URI, what to read out to Ian), part two for Ian (`--setup`, what each `FAIL` means and who fixes it).
  Each vendor fact carries CONFIRMED or "to confirm with admin" and its source URL.
- `connector/CONTRACT.md`: health suffixes (version note), proof states, "Before a real Gong adapter" rewritten to
  "transcripts off until the I-2 choice; `--measure-transcripts` supplies the numbers", new commands.
- `docs/superpowers/drafts/connector-admin-ask.md`: replace "No real Gong or Gainsight adapter. Those get built only
  once credentials exist…" with what is built and that it is unproven until `--check`; CTA endpoints confirmed;
  OAuth redirect URI to register; Gong "IP allowlist, optional expiry" marked not re-confirmed on 2026-10-02.
- `connector/config.example.json`: new fields, all empty, every adapter still `fake`, `dryRun: true`.
- `.gitignore`: `proof.json`, `gainsight-tokens.json`, `sent-record.json`, `dry-run.jsonl`.

## 4. Tasks (run order; each ≤ 8 steps; one build subagent, then one checker)

| Id | Task | Check |
|---|---|---|
| T-1 | e2e harness: cleanup failures are reported, not thrown; exit code is the scenarios' result; temp profile removal retried longer | `node tools/connector-e2e.mjs` exit 0, two runs in a row |
| T-2 | Proof store, health suffixes, registry accepts `gong-rest` / `gainsight-rest`, `config.example.json` and `.gitignore` | connector tests pass; health test for each suffix |
| T-3 | Tracker status line D2, with self-checks | self-checks `473 + new`, exit 0 |
| T-4 | Recorded-shape fixtures under `connector/fixtures/vendor/`, each headed `SHAPE FROM DOCS, NOT FROM A LIVE TENANT` with its source URL | fixtures test asserts the header on every file |
| T-5 | `gong-rest` (§3.3) | connector tests incl. paging, filter, affiliation map, `transcript === ""`, key scrub |
| T-6 | Gainsight OAuth (§3.3), callback route, rotation persisted before use | tests incl. a failed token-file write stops the request |
| T-7 | `gainsight-rest` reads (§3.3) | tests incl. `data` and `data.records`, missing fieldMap → `null` |
| T-8 | `gainsight-rest` push, saved send record, dry-run (§3.3) | tests incl. repeat id after restart makes no call; dry-run file has no credential |
| T-9 | Write gate (§3.4) and `--unlock-production` | tests for each gate state and the 1-item first send |
| T-10 | `--check`, `--check --write` (§3.5) | no config → all `SKIP`, exit 0; stubbed tenant → PASS/FAIL lines as specified |
| T-11 | `--setup` (§3.5), scripted stdin, stubbed fetch | test writes a config to a temp path; secrets never on stdout |
| T-12 | `--measure-transcripts` (§3.5) on fixtures | test: known fixture lengths give the expected median/p90/max |
| T-13 | Runbooks, CONTRACT.md, admin ask (§3.7) | grep: no "built only once credentials exist"; every vendor fact line has CONFIRMED or "to confirm" |
| T-14 | Final whole-branch review on the top model | findings fixed through build → checker, or listed |

The plan writer may split a task that needs more than 8 steps; it may not merge or drop one.

## 5. Acceptance checks (record each in the ledger with the measured value)

- **A-1** Connector tests: `node --test connector/test/*.test.mjs` all pass; the count is recorded per task, from 43.
- **A-2** Self-checks: `473 + the T-3 checks`, exit 0.
- **A-3** e2e exit 0 on two consecutive runs; no `connector-e2e-chrome-*` dir left by them.
- **A-4** Demo `node tools/connector-demo.mjs` exit 0 with the same summary as §2.
- **A-5** Zero real network calls: every new test file installs `test-net-guard`; `blocked` is empty.
- **A-6** No secret in tracked files: grep of the branch diff for key, secret, token and bearer values finds only
  placeholders and test strings marked fake.
- **A-7** Every file in `connector/fixtures/vendor/` carries the source header (T-4 test).
- **A-8** `node connector/server.mjs --check` with no config prints only `SKIP` lines, exit 0.
- **A-9** With `fake` adapters the tracker shows FAKE DATA exactly as before (e2e e1 still passes).

## 6. Out of scope

- Any live call to Gong, Gainsight or an AI provider. No credentials exist. **Paid spend: $0.**
- The I-2 storage choice itself (link-only vs cap). This spec only supplies the measurement.
- C-9 (retire browser AI; waits on a sanctioned key, R1), A6 (waits on re-saved pre-1.0 exports), Stage D.
- A daily write cap and plan-then-apply (not chosen, CR2/CR3).
- Deleting sandbox test records (D4), hosting the connector, a Workato re-implementation.
- Sending the admin ask. Ian sends it.
