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
| A1 | Move the suite to `tools/selfchecks.js` | pending | — | suite `--expect 437`; guide 18/18; scenarios 6/6 | pending | — |
| A2 | Dead code (T1) + stop writing `recommendationLog` (T3) | pending | — | suite `--expect 435` (estimate); `node tools/refcount.mjs …` all 0 | pending | — |
| A3 | Key scaffolds (T2) + one-time key cleanup | pending | — | suite `--expect 435` (estimate); K3 grep | pending | — |
| A4 | One gate list (T5), `gradDateMissing` / `gradDateDrifted` | pending | — | suite `--expect 438` (estimate); scenarios 6/6 | pending | — |
| A5 | Retire time-saved (C6) | pending | — | suite `--expect 433` (estimate); guide 18/18; refcount 0 | pending | — |
| A6 | Pre-1.0 migrations (T4) — **gated** on Ian re-saving the 3 pre-1.0 exports or saying they don't matter | skipped (pending, Ian: "skip A6") | — | suite `--expect 432` (estimate); `migration-dryrun --from 11` and `--from 14` exit 0 | pending | If no answer by the end of A5: skipped, recorded pending |
| B0 | Headed reachability spike (Chrome, Edge, fresh + normal profile) — **stop if blocked** | pending | — | `b0-run.mjs` and `b0-run-headed.mjs`: cors ok, nocors fail | pending | — |
| B1 | Contract v1, schemas, fixtures; demo seed gains gainsightIds | pending | — | contract tests `# fail 0`; suite unchanged | pending | — |
| B2 | Server, token, CORS, bind, fake Gong/Gainsight | pending | — | contract tests `# fail 0` | pending | — |
| B3 | AI adapters (fake, claude, openai, gemini), stub fetch only | pending | — | contract tests `# fail 0` | pending | — |
| B4 | Admin-ask one-pager + fake-data demo — **stop for Ian (R9)** | pending | — | `node tools/connector-demo.mjs` exit 0 | pending | — |
| C-1 | Schema 15 → 16 | pending | — | suite `--expect 438` (estimate); `migration-dryrun --from 15` exit 0 | pending | — |
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
| K1 | After A1, 437/437; shipped file shrinks ≥ 530,000 bytes (blob from 1,759,470; working tree from 1,787,753) | pending | A1 |
| K2 | After A2-A5, every removed check named; 0 non-comment refs per removed symbol (`tools/refcount.mjs`) | pending | A2, A3, A5 (A6 if built) |
| K3 | After A3, the two retired key strings appear only in the one-time cleanup | pending | A3 |
| K4 | After A4, each gate's label identical on Today, the account card and the Gainsight section; both grad-date predicates have own checks | pending | A4 |
| K5 | Contract tests pass; every fixture response validates; tokenless request → 401 | pending | B1-B3 |
| K6 | 15 → 16 dry-run passes; a `status:'sent'` + `externalId` queue item survives export/import | pending | C-1 |
| K7 | An Email activity never gets a sessionNumber (log form or Gong match) | pending | C-3, C-7 |
| K8 | Connector stopped: full suite passes, Today renders, no console errors | pending | C-7 |
| K9 | C-7 scenario passes; health line shows FAKE DATA | pending | C-7 |
| K10 | No third-party key in tracker localStorage after C-9; before C-9 only `obm-ai-settings-v1` | pending | C-2 (before), C-9 (after) |

## Look calls for Ian (batched)

None yet. C-8 files the decoration captures (Copilot and Risk, with and without each decoration).

## Log

- 2026-10-01: baseline 437/437 measured by the lead at `b1a8452`. Plan written (top model): 20 tasks (A 6, B 5, C 9), plan-level choices P1-P9, projected final 456/456 with A6 pending (455 if A6 lands). Awaiting Ian's plan approval.
- 2026-10-01: Ian, verbatim: "approved, P1-P9 as written; skip A6 and C-9". Plan and P1-P9 approved; A6 and C-9 recorded pending (no key; pre-1.0 exports not re-saved). Projected final 456/456.
