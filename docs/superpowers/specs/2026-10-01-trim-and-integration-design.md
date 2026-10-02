# Trim + Gong/Gainsight connector: design (2026-10-01)

The talk was held 2026-10-01 with Ian, on branch `trim-audit` (based on master `57f263b`). It covers three stages:
**A** trim, **B** contract plus reference connector, **C** the tracker on the contract. Stage **D** (the
consolidations the integration unlocks) is out of scope and gets its own talk.

File: `osm-book-of-business-tracker-1.0.html`. Line numbers drift, so use the symbol names. All numbers below were
**RAN on 2026-10-01** by a read-only probe unless marked READ:
- `docs/superpowers/evidence/2026-10-01-talk-probes/spec-probe.md`
- `docs/superpowers/evidence/2026-10-01-talk-probes/trim-verify.md`

The probe seeds sit beside them, and they are the recipe for re-measuring. Background evidence (READ):
- `docs/superpowers/evidence/2026-10-01-trim-audit-overengineering.md`
- `docs/superpowers/evidence/2026-10-01-trim-audit-integration-seams.md`
- `docs/superpowers/evidence/2026-10-01-trim-audit-gong-gainsight-research.md`

## 1. Rulings (Ian's words, verbatim)

Each ruling quotes Ian's answer as given in the talk. The run does not reopen a ruling. If the code makes one
impossible, it stops and asks.

| # | Question | Ian's words | Meaning for the build |
|---|---|---|---|
| R1 | Which AI may see customer data | "Sanctioned AI, either Claude, Gemini, or ChatGPT." | Only those three providers. No other AI service is added |
| R2 | Where the AI runs | "I want AI inside the tracker. Is there a way to build scaffolding here so that I can add a Gong and Gainsight API or connector if this gets adopted by my company so essentially they would not even need to build anything we would just need a key or something to connect it and do the work." Then, on the direction: "Connector + contract (Recommended)" | AI features stay in the tracker. Gong, Gainsight and AI all go through one **connector** that holds every key. The tracker holds no third-party key |
| R3 | Safe trims | "T1,T2,T3,T5 now; T4 after re-export (Recommended)" | T4 is gated on the three pre-1.0 exports (§4 A6) |
| R4 | Where AI decision support lives | "Today per-account, Copilot = book read (Recommended)" | Per-account next actions and drift flags go on Today and the account panel. Copilot becomes the book-wide read and stops duplicating `needsAttentionList` |
| R5 | Decoration (card deck, instruments, telemetry, scroll motion) | "Decide by look, in the run (Recommended)" | Nothing is removed before Ian's look call (§6) |
| R6 | Time-saved report | "Retire it (Recommended)" | Remove it; stored fields stay inert |
| R7 | Self-check suite out of the shipped file (C1) | "Yes, move it first (Recommended)" | Stage A, task 1 |
| R8 | Order and scope | "A→B→C in this spec; D later (Recommended)" | Stage D is not designed here |
| R9 | When the admin asks go out | "After Stage B works (Recommended)" | Stage B ends with the ask doc and a fake-data demo |
| R10 | Design sections 1-3 | "yes, section 1 looks right" / "yes, section 2 looks right" / "yes, section 3 looks right" | §3-§5 as written |

Context on R2: Ian first leaned toward "workspace apps only" without being sure what it meant. Once the two
options were explained, he chose AI inside the tracker. R2 supersedes the seams report's recommended shape A
(Claude chat app with MCP connectors and a file inbox).

## 2. Baseline (RAN 2026-10-01)

| Measure | Value |
|---|---|
| File | 28,283 lines, 1,787,753 bytes, schema `CURRENT_SCHEMA_VERSION = 15` |
| Self-checks | `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 437` gives **437/437, exit 0**, about 5.4 s |
| Suite | `_runSelfChecksInner`, L8274-16814: **8,541 lines, 537,958 bytes, 30.1 %** of the file. The wrapper `runSelfChecks` is L8270-8273, and `window.runSelfChecks = runSelfChecks` is at L16815 |
| AI | **7** live `callAiAPI` calls in 5 functions: `generateCopilotRead`, `generateCustomerAiBrief`, `generateSessionDebrief` ×3, `generateRiskSummaryAi`, `generateThreadAnswer`. `callAiAPI` is the single choke point. Provider fetches happen only in `callClaudeAPI`, `callOpenAIAPI` and `callGeminiAPI` |
| Keys in localStorage | `obm-ai-settings-v1` (one apiKey), `obm-gainsight-settings-v1` (apiKey, never sent), `obm-workiva-kb-settings-v1` (token, sent only by the Settings "Test search" button) |
| Import repair | Unknown keys on activities, customers and the top level are **kept**. A `gainsightQueue` item is **rebuilt** to `{id,date,customerId,customerName,kind,payload,status:'queued'}`. Status is forced to `queued`, and externalId, sentAt and error are **stripped** (normaliser about L27078) |
| Queue kinds | 4: `Success Outcome Plan`, `At-Risk CTA`, `Pending items batch`, `Success Plan objective` |
| G06 trap | Confirmed. The log form preselects `nextOpenSessionNumber(c)` for every activity type, and nothing clears it on a type change |
| Demo seed | 17 accounts, **0** with gainsightId, 84 activities of which 13 are Call |

## 3. Architecture (Stage B)

```
 Tracker (browser, file://)  ── HTTP+JSON, bearer token ──▶  Connector (node, zero deps)
   connector client                                          adapters: gong  = fake | rest*
   AI buttons → callAiAPI → /v1/ai                                     gainsight = fake | rest*/mcp*
   Today / panel / Copilot                                             ai    = fake | claude | openai | gemini
                                                             * = not built in this spec
```

- **The connector** is `connector/server.mjs`: Node with zero dependencies, run as `node connector/server.mjs`.
  - Config lives in `connector/config.json`, which is git-ignored. `connector/config.example.json` is committed.
  - On start the connector prints a random token. The user pastes it into the tracker once.
  - It allows CORS for the `null` origin (`file://`) and for localhost.
  - It binds to 127.0.0.1 only.
- **Adapters** are interchangeable modules behind one interface per service. Real Gong and Gainsight adapters are
  **not built** until an admin issues credentials. A real adapter that cannot be run would only produce a vacuous
  green. The AI adapters for Claude, OpenAI and Gemini are ported from the tracker's existing provider calls. They
  read the key from the connector config, never from the browser.
- **Contract v1.** It is documented in `connector/CONTRACT.md`, with JSON Schemas in `connector/schemas/`:

| Call | Request | Response |
|---|---|---|
| `GET /v1/health` | none | `{version, adapters:{gong,gainsight,ai}}`, where each adapter is `"fake"` or a provider name |
| `GET /v1/calls?since=ISO` | none | `{calls:[{callId,url,startedAt,durationSec,title,participants:[{name,email,affiliation}],accountRef:{gainsightId,name},summary,transcript}]}` |
| `GET /v1/accounts` | none | `{accounts:[{gainsightId,name,tier,arr,renewalDate,csmOwner,contacts:[{name,email,role}],healthScore,gates:{readinessAssessment,csatContact,successPlan},openCtas:[…]}]}` |
| `POST /v1/push` | `{items:[{id,kind,customerRef:{gainsightId,name},fields:{…}}]}` | `{results:[{id,status:"sent"\|"failed",externalId,error}]}` |
| `POST /v1/ai` | `{task,prompt,maxTokens}` | `{text}` |

- **Contract rule.** The tracker depends on the contract, never on an adapter. IT can re-implement the connector
  later, for example in Workato, without any tracker change.
- **Offline rule.** If the connector is unset or unreachable, the tracker behaves exactly as it does today, plus
  one quiet "connector offline" status line. No core-loop feature may depend on the connector.
- **Fake fixtures** live in `connector/fixtures/` and are written against the demo book's 17 accounts. They give
  each account a fake gainsightId, and the demo seed gains the same ids. They include:
  - calls that match on gainsightId
  - calls that match only by name
  - calls that match only by attendee email
  - one unmatchable call
  - one Email-type touch that must not become a session

## 4. Stage A: trim

Do these in order, one commit each, and end every commit green. Docs (header rules, README, VALIDATION,
CHANGELOG) change in the **same commit** as the code they describe.

- **A1. Move the suite out (C1).**
  - Move `_runSelfChecksInner` and `window.runSelfChecks` into `tools/selfchecks.js`.
  - `tools/selfcheck.mjs` injects it as an **inline** script through CDP before calling the function. A `src=`
    file breaks the check that reads `document.scripts` textContent (about L10941).
  - Re-verify the `innerHTML.slice` checks (about L15291 and L15779) and the `String(fn).indexOf` checks (about
    L14491, L15644 and L15746). `runSelfChecks` must keep the text `_suiteRunning = false`.
  - `_suiteRunning` (L5417) stays in the product.
  - Update header rule 5, README and VALIDATION.
  - Pass: **437/437**, and the shipped file shrinks by about 538 KB.
- **A2. Dead code, T1 and T3.**
  - Delete the 12 unreachable functions. Comments were stripped before counting callers, and there is no `window[`
    dispatch:
    - `generatePortfolioAiBrief`
    - `renderRiskRow`, `renderRiskOwnership`, `renderRiskNextSteps`, `riskTrend`
    - `renderSignalCalibration`, `getSignalCalibration`
    - `partitionRisks`
    - `removeOutcomeCriterion`
    - `graduationDurability`
    - `openThreadsToText`
    - `icsUnfold`, which moves into the suite as a helper
  - Fix the false half of the comment at about L23578. It says the brief "is still what fills the summary block".
  - Stop writing `c.recommendationLog`. Existing data stays inert.
  - Edit or delete the checks that use these functions. Every removed check is named in the commit message along
    with the new total.
- **A3. Key scaffolds, T2.**
  - Remove the Gainsight settings block (`obm-gainsight-settings-v1`).
  - Remove `syncGainsightQueue` and its button.
  - Remove the Workiva KB scaffold (`searchWorkivaKnowledge`, settings, Test search).
  - On load, remove both localStorage keys once.
- **A4. One gate list, T5.**
  - `GATE_DEFS` becomes the only list, with one label per gate. `ADMIN_GAP_DEFS` and the compliance block in
    `pendingGainsightItems` derive from it. Today the three lists also use different keys (`readiness` and
    `sentiment`).
  - Keep both grad-date tests, as named predicates:
    - `gradDateMissing`, meaning there is no `targetGraduationDate`. Today it feeds the Today admin gaps.
    - `gradDateDrifted`, meaning `isGradDateWithinTolerance(c)===false`. It feeds gates and Gainsight items.
  - The Gainsight-instruction wording ("Log Sentiment via Readiness Assessment timeline activity", …) becomes a
    per-gate `gainsightAction` field on the same list.
- **A5. Retire time-saved, C6.** Remove all of the following:
  - the 16 live `trackImpact` call lines and `IMPACT_EVENTS` (13 keys)
  - the Settings "Time saved" block and `downloadImpactCsv`
  - `buildImpactReport` and `downloadImpactReport`
  - the day-close "N actions, about X saved" lines (about L20892-20946)
  - the wrap-up modal figure (about L26041)
  - the manager progress-report section (about L26646)
  - `DATA.impact`, `DATA.impactLog` and `config.impactMinutes` stay inert: no migration, and nothing reads them
  - the demo seed's stray `impact.events.gainsight_batch`
  - the 7 (±1) checks that touch this, which are removed and named
- **A6. Pre-1.0 migrations, T4. Gated.** It runs only after Ian has done one of two things:
  - opened and re-saved these three exports in today's tracker at schema 15:
    - `Documents\Johnny Silverhand\book-of-business-export.json` (schema 8)
    - `Documents\Runway Tracker\book-of-business-RESTORE-POINT-2026-08-03.json` (schema 2)
    - `Downloads\book-of-business-export (5).json` (schema 2)
  - or said they don't matter.

  Then it removes:
  - the v0→v11 `migrateData` steps (L4734-4941)
  - `OLD_GUESSED_OUTCOME_NAMES`, `LEGACY_TEMPLATE_KEYS` and the pre-v38 backfills. These three are **ungated and
    run on every load**.

  Imports with `schemaVersion < 11` are then refused with a clear message. The v11→v15 steps stay. If Ian hasn't
  answered when Stage A ends, A6 is skipped and recorded in the ledger as pending.

## 5. Stage B and Stage C

### Stage B: contract and connector

- **B0. Reachability spike. Do this first, before anything else in B or C.**
  - **RAN in the talk (2026-10-01).** Headless Chrome, fresh profile, no `--allow-file-access-from-files`. A
    `file://` page fetching a `http://127.0.0.1` stub:
    - **Succeeded** when the stub sent `Access-Control-Allow-Origin: null`, `Allow-Headers: authorization` and
      answered the `OPTIONS` preflight. The stub saw `OPTIONS` then `GET`, both from origin `null`.
    - **Failed** ("Failed to fetch") without those headers.
    - Chrome sent no Private Network Access header.
    - Recipe: `docs/superpowers/evidence/2026-10-01-talk-probes/b0-*`.
  - **Still unverified:** a headed, normal Chrome profile; Edge; any company-managed browser policy. B0 re-runs the
    recipe headed before B1.
  - Proof it is wrong: a console CORS or PNA error.
  - **If it is blocked, stop and ask Ian.** The fallback is the connector serving the tracker file itself from
    `http://127.0.0.1`, which changes where the book's storage lives, so it is his call.
- **B1.** `connector/CONTRACT.md`, the schemas, and the fixtures (§3). The demo seed gains fake gainsightIds.
- **B2.** `server.mjs`: health, token, CORS, the bind address, and the fake gong and gainsight adapters. Contract
  tests run in Node: every response validates against its schema, every request without a token gets 401, and the
  push results are logged to `connector/fake-gainsight-log.jsonl` (git-ignored).
- **B3.** AI adapters (fake, claude, openai, gemini), ported from `callClaudeAPI`, `callOpenAIAPI` and
  `callGeminiAPI`. Their tests use the fake adapter only. **This build makes no real AI call.**
- **B4.** The admin-ask one-pager, `docs/superpowers/drafts/connector-admin-ask.md`. It covers the Gong Tech admin
  (key and secret or an OAuth app, transcript scope `api:calls:read:transcript`, the extensive scope for briefs
  marked UNCONFIRMED), the Gainsight Super Admin (OAuth app with Read/Write, Timeline, CTA and Success Plan writes,
  Company and Person reads, sandbox tenant) and IT (where the connector runs, a company-issued AI key, and sign-off
  for sending Gong transcripts to the sanctioned AI, which the research report marks as an inference). It also
  includes a fake-data demo script. **Stop: Ian reviews the ask doc and the demo.**

### Stage C: the tracker on the contract

- **C-1. Schema 15→16**, a single `migrateData` step per header rule 4.
  - It adds an optional `activity.gong` = `{callId,url,startedAt,durationSec,participants[],summary,matchedBy}`.
    Gong's transcript fills the existing `activity.transcript`, clamped to the existing 120,000-char cap.
    `gong.summary` never overwrites `activity.summary`.
  - Queue items gain `fields{}`, `status` ∈ {queued, sent, failed}, `externalId`, `sentAt` and `error`. The import
    normaliser keeps them; an old prose-only item stays valid.
  - It adds an optional `customer.gainsight` = `{pulledAt, values{}}`.
  - Migration dry-run from 15 is required.
- **C-2. Connector client.**
  - Settings gets one "Connector" block (address, token, status). The status says **FAKE DATA** whenever
    `/v1/health` reports a fake adapter.
  - The offline rule from §3 applies.
  - `callAiAPI` routes to `/v1/ai` when a connector is configured, so all 7 AI features move at once.
- **C-3. Gong pull: "Check for calls".**
  - Match each call to an account in this order: gainsightId, then exact name, then attendee email against
    `stakeholders`.
  - Show a preview in three groups: matched, unmatched, already linked. Nothing is written without confirmation.
  - A session link is set only for session types and only when the user confirms it in the preview.
  - The G06 fix: changing the log form's type to a non-session type clears the session select.
- **C-4. Gainsight pull: "Refresh from Gainsight".**
  - The preview shows "Gainsight says X, tracker has Y" for tier, ARR, renewalDate, CSM owner and contacts.
  - It offers to tick a gate when Gainsight shows it done.
  - It never writes stage, goals, verdicts, notes or scores.
  - The value-CSV import stays.
- **C-5. Push: "Send to Gainsight".**
  - Queue items carry structured `fields`: the gates come from A4's single list, and the goal events and At-Risk
    CTAs get their own fields.
  - Each item shows sent ✓ with its id, or failed with the error and a Retry button.
  - Day close counts from `status`.
  - The clipboard texts stay as the offline fallback.
- **C-6. AI decision support (R4).**
  - A "Brief my day" task goes through `/v1/ai`. On Today and in the account panel, each account gets one next
    action and any drift or risk flags, **each with its reason**.
  - Copilot becomes the book read: cross-account patterns and weekly movement. Remove its copy of
    `needsAttentionList`.
  - Deterministic `SIGNAL_DEFS` stay live, with no connector needed.
- **C-7. End-to-end scenario.** Headless Chrome runs the tracker against the fake connector:
  1. pull calls
  2. confirm one match
  3. Email stays unlinked
  4. push
  5. see sent
  6. kill the connector, and the tracker still works
- **C-8. Decoration look call (R5).**
  - Capture Copilot and Risk with and without each of these: card deck, glideslope and telemetry, scroll drivers.
  - File the captures for Ian, using studio-harness `look-critic`, then pass them to Ian. Don't judge them yourself.
  - Removal happens only as Ian rules.
- **C-9. Retire browser AI. Gated.**
  - Only after the connector's real AI adapter has answered one call with a **sanctioned key Ian supplies** (R1).
  - Then remove the direct provider calls from the tracker, `obm-ai-settings-v1` and its Settings block.
  - Until then, the browser path remains the fallback when no connector is set.

## 6. Acceptance checks (record each one in the ledger with the measured value)

| # | Check |
|---|---|
| K1 | After A1, the suite still reports 437/437, and the shipped file shrinks by ≥ 530,000 bytes from 1,787,753 (the suite alone is 537,958 bytes) |
| K2 | After A2-A5, every removed check is named. `grep` finds 0 non-comment references to each removed symbol |
| K3 | After A3, `grep -c "obm-gainsight-settings-v1\|obm-workiva-kb-settings-v1"` finds only the one-time cleanup |
| K4 | After A4, every gate's label is identical on Today, the account card and the Gainsight section, and both grad-date predicates have their own checks |
| K5 | The connector's contract tests pass. Every fixture response validates. A request without a token gets 401 |
| K6 | The 15→16 migration dry-run passes. A queue item with `status:'sent'` and `externalId` survives export and import |
| K7 | An Email-type activity is never given a sessionNumber, whether by the log form or by the Gong match |
| K8 | With the connector stopped, the full suite passes and Today renders, with no console errors |
| K9 | The C-7 scenario passes. The health line shows FAKE DATA |
| K10 | No third-party key in tracker localStorage once C-9 has run. Before C-9, only `obm-ai-settings-v1` |

## 7. Out of scope

- Stage D: one outcome model (C2), one risk registry plus the fix for "champion left" scoring positive (C3, G11),
  one dismissal memory (C4), and retiring plays, coordination and imports (C7).
- Real Gong and Gainsight adapters.
- Hosting the connector.
- Audit items C9 (the `attachEvents` split) and C10 (gradReview ownership).
- **Paid spend: $0.** The only real external call is C-9's single AI call, made with Ian's key, at Ian's stop.
