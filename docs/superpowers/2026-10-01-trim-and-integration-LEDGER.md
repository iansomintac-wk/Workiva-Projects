# Trim + Gong/Gainsight connector (stages A, B, C) — ledger

Spec: `specs/2026-10-01-trim-and-integration-design.md` (rulings R1-R10 in §1, quoted verbatim; Stage D out of scope).
Plan: `plans/2026-10-01-trim-and-integration.md` (plan-level choices P1-P9). Run prompt: `sessions/trim-and-integration-run.md`.
Branch: `trim-and-integration` (worktree `.claude/worktrees/trim-and-integration`, at `b1a8452`).
Paid runs approved: none ($0). The only external call allowed is C-9's single AI call on Ian's own key, at Ian's stop.

## Baseline (measured 2026-10-01 by the run lead at `b1a8452`)

- Suite `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 437`:
  **437/437** passed, 0 failed, exit 0.
- Planning measurements (plan writer, same commit, this worktree; not the lead): working tree 1,787,753 bytes, CRLF
  (28,283 CR bytes); git blob 1,759,470 bytes; the span A1 moves is 538,504 LF bytes (`_runSelfChecksInner` alone
  537,958).

## Tasks

| # | Task | State | Commit | Check command | Measured result (lead re-run) | Deviation from spec (reason) |
|---|---|---|---|---|---|---|
| A1 | Move the suite to `tools/selfchecks.js` | done | 1a49b3f | suite `--expect 437`; guide 18/18; scenarios 6/6 | 437/437; guide 18/18; scenarios 6/6 (lead, 2026-10-01). Checker PASS | P1 --suite flag; extra README/guide-manifest doc lines (doc-only) |
| A2 | Dead code (T1) + stop writing `recommendationLog` (T3) | done | 64170ca | suite `--expect 435` (estimate); `node tools/refcount.mjs …` all 0 | 432/432 (+1 trim a2a, −6 named in A2.md); scenarios 6/6; guide 18/18 (lead). refcount 0 ×13. Checker PASS | 432 not 435: 3 'edit' checks were pure dead-code introspection, removed and named. ui.aiPortfolioBrief kept (still read; plan's delete condition unmet) — follow-up for final review. demo-seed drops graduationDurability() field |
| A3 | Key scaffolds (T2) + one-time key cleanup | done | c0fac1b | suite `--expect 435` (estimate); K3 grep | 432/432 (+trim a3a, −workiva knowledge renderer check); scenarios 6/6 (lead). Checker PASS | Plan table's 435 baseline stale after A2 (432); VALIDATION SHA block split + 'both LF' corrected (A2 checker nits) |
| A4 | One gate list (T5), `gradDateMissing` / `gradDateDrifted` | done | d57f38d | suite `--expect 438` (estimate); scenarios 6/6 | 435/435 (+trim a4a, a4b, a4c); scenarios 6/6; guide 18/18 (lead). Checker PASS | P2 labels; gainsightItemText helper ('label: instruction'); admin rows in GATE_DEFS order; K4 evidence from a4c assertions + red mutation (--verbose prints no detail on pass) |
| A5 | Retire time-saved (C6) | done | c9208d6 | suite `--expect 433` (estimate); guide 18/18; refcount 0 | 428/428 (+trim a5a, −8 dead time-saved checks named in A5.md); scenarios 6/6; guide 18/18; refcount 0 ×6 (lead). Checker PASS | Motion switch extracted to its own Settings block (was bound only after an impact edit); stored impact fields inert, no schema bump (R6) |
| A6 | Pre-1.0 migrations (T4) — **gated** on Ian re-saving the 3 pre-1.0 exports or saying they don't matter | skipped (pending, Ian: "skip A6") | — | suite `--expect 432` (estimate); `migration-dryrun --from 11` and `--from 14` exit 0 | pending | If no answer by the end of A5: skipped, recorded pending |
| B0 | Headed reachability spike (Chrome, Edge, fresh + normal profile) — **stop if blocked** | done | 493ab82 | `b0-run.mjs` and `b0-run-headed.mjs`: cors ok, nocors fail | Headed fresh-profile: Chrome 154 cors ok / nocors fail; Edge 153 cors ok / nocors fail (lead re-run, exit 0; stub saw OPTIONS+GET for cors, OPTIONS only for nocors). Checker PASS | Normal-profile legs NOT RUN: both browsers were running and the leg writes to Ian's real profile; manual recipe in B0.md; open risk, not a gate (spec B0). Runner leaves %TEMP%/b0h-* profiles (lead deleted them) — follow-up |
| B1 | Contract v1, schemas, fixtures; demo seed gains gainsightIds | done | 69dfd84 | contract tests `# fail 0`; suite unchanged | Contract tests 15 pass / 0 fail; tracker 428/428; scenarios 6/6 (lead). Checker PASS | Seed: GS-DEMO-001..017 + one stakeholder email; tracker normalizeStakeholder() drops email (gap → assigned to C-1, see Log) |
| B2 | Server, token, CORS, bind, fake Gong/Gainsight | done | 621b836 | contract tests `# fail 0` | Contract tests 29 pass / 0 fail (+14 server t1-t14); worktree clean, no token/log left (lead). Checker PASS (bind hard-coded 127.0.0.1, timingSafeEqual, anchored CORS, streaming 413) | port ?? 8787 (port 0 for tests); /v1/ai 404 until B3; env overrides CONNECTOR_CONFIG/TOKEN_FILE/LOG for tests (documented) |
| B3 | AI adapters (fake, claude, openai, gemini), stub fetch only | done | 5e06c85, fix 75f4c52 | contract tests `# fail 0` | Contract tests 37→40 pass / 0 fail (lead, after fix). Checkers PASS ×2 | Checker finding fixed: optional boolean truncated added to ai-response (tracker shows length-cap notices in ≥8 places; would be lost via connector); test-net-guard blocks any non-127.0.0.1 fetch in tests. Models mirrored from tracker: claude-sonnet-5, gpt-5.4-mini, gemini-2.5-flash |
| B4 | Admin-ask one-pager + fake-data demo — **stop for Ian (R9)** | done — STOP for Ian (R9) | d09b8ed | `node tools/connector-demo.mjs` exit 0 | node tools/connector-demo.mjs exit 0 (6 calls, 17 accounts, 2 sent / 1 forceFail, fake AI; temp files removed); contract 41/41 (lead). Checker PASS | Demo test t15 added to contract suite (40→41). One-pager 944 words (~2 pages); 8 items marked 'to confirm with admin'; 'no documented way to limit Gong key to one user' phrasing not in research (hedged) |
| C-1 | Schema 15 → 16 | done | 232ab75 | suite `--expect 438` (estimate); `migration-dryrun --from 15` exit 0 | 434/434 (+c1a..c1f); scenarios 6/6; dry-run --from 15 and --from 14 exit 0 (lead). Checker PASS | Lead addition: optional stakeholder email (normalizeStakeholder, form, import, migration, c1f). 3 'schema === 15' assertions → CURRENT_SCHEMA_VERSION / >=15 (strict pin in c1e). guide-manifest schema 12→16 (was stale) |
| C-2 | Connector client, Settings block, offline rule, AI routing | pending | — | suite `--expect 442` (estimate) | pending | — |
| C-3 | Gong pull "Check for calls" + G06 fix | pending | — | suite `--expect 447` (estimate) | pending | — |
| C-4 | Gainsight pull "Refresh from Gainsight" | pending | — | suite `--expect 450` (estimate) | pending | — |
| C-5 | Push "Send to Gainsight" | pending | — | suite `--expect 453` (estimate) | pending | — |
| C-6 | AI decision support (R4) | pending | — | suite `--expect 456` (estimate) | pending | — |
| C-7 | End-to-end scenario against the fake connector | pending | — | `node tools/connector-e2e.mjs` → 7/7 | pending | — |
| C-8 | Decoration look call (R5) — **gated** on Ian's batched look calls | pending (gated) | — | capture runner 8/8; removals only as Ian rules | pending | — |
| C-9 | Retire browser AI — **gated** on Ian's sanctioned key (R1) | skipped (pending, Ian: "skip ... C-9") | — | suite (measured); e2e 7/7; refcount 0 | pending | Without a key: skipped, recorded pending; browser AI stays as fallback |

## Acceptance checks (measured values, not "passes")

| Id | Expected | Measured | Where |
|---|---|---|---|
| K1 | After A1, 437/437; shipped file shrinks ≥ 530,000 bytes (blob from 1,759,470; working tree from 1,787,753) | **437/437**; blob 1,759,470→1,221,271 (−538,199); working tree 1,787,753→1,241,007 (−546,746). Lead-measured | A1 |
| K2 | After A2-A5, every removed check named; 0 non-comment refs per removed symbol (`tools/refcount.mjs`) | Every removed check named: A2 −6/+1, A3 −1/+1, A5 −8/+1 (evidence notes + commit messages). refcount 0 for all removed symbols: A2 13, A3 10, A5 6 task + 9 helpers (lead re-ran A5's 6) | A2, A3, A5 (A6 if built) |
| K3 | After A3, the two retired key strings appear only in the one-time cleanup | Retired key strings: 1 occurrence in shipped HTML (RETIRED_SETTINGS_KEYS, used only by cleanupRetiredSettingsKeys) + the a3a check in tools/selfchecks.js (not shipped). Lead grep | A3 |
| K4 | After A4, each gate's label identical on Today, the account card and the Gainsight section; both grad-date predicates have own checks | Labels Readiness Assessment / Success Outcome Plan / Graduation date SLA / CSAT contact identical on admin gaps, account card, Gainsight row (a4c, rendered HTML; mutation → red). gradDateMissing = a4a, gradDateDrifted = a4b | A4 |
| K5 | Contract tests pass; every fixture response validates; tokenless request → 401 | Contract tests 40/40, 0 fail (lead). Every fixture and every non-error response validates against its schema (tests + server-side validation, t12 bad adapter → 500). Tokenless/wrong/longer/Basic token → 401 on all 5 routes (t2; mutation if(false) → red) | B1-B3 |
| K6 | 15 → 16 dry-run passes; a `status:'sent'` + `externalId` queue item survives export/import | Dry-run 15→16 exit 0: shape true, idempotent true, transcriptKept true, console errors 0 (lead). c1b: {status:'sent', externalId, sentAt, error, fields} survives serializeBook→prepareImportedData; mutation (force 'queued') → red | C-1 |
| K7 | An Email activity never gets a sessionNumber (log form or Gong match) | pending | C-3, C-7 |
| K8 | Connector stopped: full suite passes, Today renders, no console errors | pending | C-7 |
| K9 | C-7 scenario passes; health line shows FAKE DATA | pending | C-7 |
| K10 | No third-party key in tracker localStorage after C-9; before C-9 only `obm-ai-settings-v1` | pending | C-2 (before), C-9 (after) |

## Look calls for Ian (batched)

None yet. C-8 files the decoration captures (Copilot and Risk, with and without each decoration).

## Log

- 2026-10-01: baseline 437/437 measured by the lead at `b1a8452`. Plan written (top model): 20 tasks (A 6, B 5, C 9), plan-level choices P1-P9, projected final 456/456 with A6 pending (455 if A6 lands). Awaiting Ian's plan approval.
- 2026-10-01: Ian, verbatim: "approved, P1-P9 as written; skip A6 and C-9". Plan and P1-P9 approved; A6 and C-9 recorded pending (no key; pre-1.0 exports not re-saved). Projected final 456/456.
- 2026-10-01: A2 checker nits A/B (VALIDATION SHA block: one hash under both blob and CRLF headings; stale 'both LF' sentence) handed to the A3 builder.
- 2026-10-01: STAGE A closed (A6 skipped per Ian). Lead-measured: suite 428/428 (437 → 437 → 432 → 432 → 435 → 428); shipped tracker blob 1,759,470 → 1,172,380 (−587,090, −33.4%); working tree 1,787,753 → 1,191,330 (−596,423). Suite file tools/selfchecks.js 540,507 bytes (not shipped). Follow-up for final review: ui.aiPortfolioBrief (only ever null since A2).
- 2026-10-01: B0 not blocked in a headed browser, so no stop; proceeding to B1. Follow-ups for final review: ui.aiPortfolioBrief; b0-run-headed.mjs temp-profile cleanup.
- 2026-10-01: GAP found by B1 checker: C-3's email-only match (check c3a) needs a stakeholder email, but normalizeStakeholder() keeps only id/name/role/note and no task adds email. Lead assigns it to C-1 (the one schema step, 15→16): add optional stakeholder email to normalizeStakeholder, the stakeholder form and import, with a migrateData step and a check. Not a ruling change: it serves the spec's own C-3 matching.
- 2026-10-01: STAGE B closed. STOP for Ian (R9): admin-ask docs/superpowers/drafts/connector-admin-ask.md + demo node tools/connector-demo.mjs. Nothing sent to any admin. Stage C waits on Ian.
- 2026-10-01: Ian, verbatim: "approved, go ahead with Stage C". R9 stop cleared; Stage C starts (C-1..C-8; C-9 skipped).
