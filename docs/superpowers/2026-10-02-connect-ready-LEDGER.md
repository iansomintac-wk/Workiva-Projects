# Connect-ready (real adapters built ahead of the admin, gated) — ledger

Spec: `specs/2026-10-02-connect-ready-design.md` (rulings CR1-CR6 in §1, defaults D1-D4 in §3.6).
Plan: `plans/2026-10-02-connect-ready.md` (blockers B1-B2, spec gaps 1-8). Run prompt: `sessions/connect-ready-run.md`.
Branch: `worktree-connect-ready` (worktree `.claude/worktrees/connect-ready`, from `master` at `51d1490`).
Paid runs approved: none ($0). No external calls; every vendor call in tests goes to a stubbed fetch.

Wording rule: adapters are "tested on recorded-shape fixtures" and "unproven until `--check`". Nothing here says an
adapter works with Gong or Gainsight.

## Baseline (measured 2026-10-02 by the run lead at `51d1490`, this worktree)

- `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 473`: **473/473**, exit 0.
- `node --test connector/test/*.test.mjs`: **43/43** pass, 0 fail, exit 0.
- `node tools/connector-demo.mjs`: exit 0.
- `node tools/connector-e2e.mjs`, two runs: scenarios **7/7** both times; exit **0**, then exit **1** (uncaught
  `EPERM` from `rmSync` on `%LOCALAPPDATA%\Temp\connector-e2e-chrome-*`). 3 leftover profile dirs afterwards.
  The spec recorded "exit 1 in 2 of 2 runs"; measured here it is intermittent. T-1 still applies.

## Stops

| When | Stop | State |
|---|---|---|
| 2026-10-02 | Plan approval (plan `3682d02`), with B1 and B2 for Ian | Ian, 2026-10-03: "approved, B1 a, B2 a — go" |

## Tasks

| # | Task | Model | State | Commit | Check command | Measured result (lead re-run) | Deviation from spec (reason) |
|---|---|---|---|---|---|---|---|
| T-1 | e2e cleanup reported, not thrown | Sonnet | done | 29fa2ad | `node tools/connector-e2e.mjs` exit 0, two runs in a row | connector 46/46 (+3 e2e-cleanup); e2e 4 runs in a row: exit 0 ×4, 7/7 ×4, no cleanup warnings, no new leftover profiles (lead, 2026-10-03). Checker PASS | rmSync import dropped (unused). Low: harness wiring (removeDir → exit code) proven only by the e2e exit, no unit test |
| T-2 | Proof store, health suffixes, registry, config.example, .gitignore | Sonnet | done | 667c6e2 | `node --test connector/test/*.test.mjs`; demo | connector 52/52 (+6 proof.test); demo exit 0; no forbidden files tracked (lead, 2026-10-03). Checker PASS | server.test t14 unknown-adapter name gong-rest → gong-live (gong-rest now registered; assertion unchanged) |
| T-3 | Tracker status line D2 (UNPROVEN / DRY RUN) | Sonnet | done | 5ff9729 | selfcheck `--expect 475` (plan estimate: +c2j, c2k) | 475/475 (+connector c2j, c2k; none removed); connector 52/52; e2e 7/7 exit 0 (lead, 2026-10-03). Checker PASS | Plan gap 1: parses trailing flags, not the `(unproven)` substring. Live prose counts 473→475 in README.txt, VALIDATION.txt, guide-manifest.json (plan step 6 expected none; historical lines kept). Open: other prose may still say "43" connector tests — sweep in T-13 |
| T-4 | Recorded-shape vendor fixtures | Haiku → Sonnet | done | fca78bf (failed attempt b53ae0a, reverted c0cb484) | `node --test connector/test/*.test.mjs` | connector 55/55 (+3 vendor-fixtures); all 6 fixtures parse as JSON with the SHAPE FROM DOCS header (lead, 2026-10-03). Checker PASS (script deep-equal to the plan) | Haiku attempt FAILED review: invented 9 fixtures instead of the plan's 6, invalid JSON, 1 test not 3, no net guard. Reverted; redone on Sonnet (first fix, passed). Lesson: transcription on Haiku failed here; later tasks stay on Sonnet |
| T-5 | `gong-rest` listCalls | Sonnet | done | a173a00 | `node --test connector/test/*.test.mjs`; demo | connector 62/62 (+7 gong-rest); demo exit 0 (lead, 2026-10-03). Checker PASS | Low (T-14): vendor-http scrubs secrets after JSON.stringify, so a secret with JSON-escaped chars would not be scrubbed. Plan gaps 4, 7: accountRef always null; CONTRACT.md Gong section moves here from T-13 |
| T-6 | Gainsight OAuth, callback, rotation persisted before use | top | done | 65a96fa | `node --test connector/test/*.test.mjs`; demo | connector 70/70 (+8 gainsight-auth); demo exit 0 (lead, 2026-10-03). Checker PASS | CONTRACT.md: /oauth/callback named as the one route without the bearer token (setup-only, 127.0.0.1, one-shot, 410 after). For T-14: no OAuth `state`/CSRF check (plan/spec silent; research does not confirm Gainsight echoes state — confirm before requiring); no nosniff header; confirm onDone's exchange error text is scrubbed. Plan gap 6: token reply field names are config |
| T-7 | `gainsight-rest` reads | Sonnet | done | 5b7a8c9 | `node --test connector/test/*.test.mjs`; demo | connector 77/77 (+7 gainsight-read); demo exit 0 (lead, 2026-10-03). Checker PASS | For T-14 (low): gate test lacks `1` / `"true"` cases; no test for empty-config "not configured" throw. (Checker's "no blocked-list assert" was wrong: installNetGuard registers that after() itself, test-net-guard.mjs:21-23.) Plan gaps 2, 3: gates from gateFieldMap (false unless exactly true); openCtas [] |
| T-8 | `gainsight-rest` push, send record, dry-run | Sonnet | done | 4ad1f9b, fix 54986f8 | `node --test connector/test/*.test.mjs`; demo | connector 85 → 88/88 (+8 gainsight-push, +3 fix tests); demo exit 0; fix tests red on the old adapter (2 fail), green after (lead, 2026-10-03). Checker FAIL then PASS | Checker blocker fixed (first fix): Timeline 200 with `data.failures[id]` / no activityId was reported sent and recorded → now failed, not recorded. CONTRACT.md states the crash window: CTA repeat may double-send (research Q14). CTA with no idPath: sent, id null (plan). Plan's extra after() on installNetGuard dropped (returns nothing; guard asserts itself). Admin-ask B1 question not in T-8 → T-13. Until T-9, `dryRun:false` reaches any configured tenant. B1 (a) ruled by Ian: objective items answer failed, stay queued |
| T-9 | Write gate and `--unlock-production` | top | done | e7af321 | `node --test connector/test/*.test.mjs`; demo; `--unlock-production` smoke on piped stdin | connector 101/101 (+8 plan, +5 builder: corrupt proof blocks, unset dryRun after unlock, first-send race, empty appUrl / unreadable proof refuse, scripted CLI); demo exit 0; no state file tracked (lead, 2026-10-03). Builder smoke: wrong URL exit 1 writes nothing, right URL exit 0. Checker PASS (adversarial: no unlocked production path found) | Plan test stub reply re-keyed by item id (needed after the T-8 fix; still asserts sent + count). Production vs sandbox is the user's `environment` label (spec §3.4 allows). OAuth --setup wiring is T-11 per plan. For T-14 (low): EOF on the unlock prompt leaves `ask` unsettled (nothing written, odd exit). Plan gap 5: unlock record tied to tenant; tenant typed back in both paths |
| T-10 | `--check`, `--check --write` | Sonnet | done | 5e85683 | `node --test connector/test/*.test.mjs`; `node connector/server.mjs --check` (no config, temp state dir) | connector 108/108 (+7 check); `--check` no config: 2 SKIP lines, exit 0, 0 state files written (lead, 2026-10-03). Checker PASS | Plan's count "100" assumed a lower baseline; 101 + 7 = 108. For T-14 (low): no test that Gainsight secrets are absent from `--check` output (Gong's is tested); no `--check --write` test with a partial-failure reply. B2 (a) ruled by Ian: read-back prints SKIP, proof from create replies |
| T-11 | `--setup` | Sonnet | done | 6a6982e, fix 2f137b9 | `node --test connector/test/*.test.mjs`; `--setup` smoke on piped stdin (default path and CONNECTOR_CONFIG); `--unlock-production` on EOF | connector 115 → 118/118 (+7 setup, +3 fix); default-path `--setup` exit 0, wrote git-ignored config.json (lead deleted it), --check 2 SKIP; override path: exit 1 ENOENT before fix, exit 0 + file created after; missing-config plain server: one line, exit 1; demo exit 0 (lead, 2026-10-03). Checkers PASS ×2 | Builder fixed the plan's `makeAsk` (lost piped lines, hung exit 13) with a line queue; EOF answers '' — checker confirmed '' can never write an unlock (closes T-9 EOF note). Lead's smoke found the CONNECTOR_CONFIG crash; fix also adds a FAIL line for callback port in use. Low (T-14): no test for config.json mode 0o600; no test that config.example.json is untouched; empty secret answers accepted (the following --check fails on them) |
| T-12 | `--measure-transcripts` | Sonnet | pending | — | per plan | — | — |
| T-13 | Runbooks, CONTRACT.md, admin ask | Sonnet | pending | — | per plan | — | — |
| T-14 | Final whole-branch review | top | pending | — | — | — | — |

Plan estimate for connector tests after T-13: 110 (from 43). This is an estimate; each task row records the measured count.

## Acceptance checks

| # | Measured value | Measured by / when |
|---|---|---|
| A-1 | — | — |
| A-2 | — | — |
| A-3 | — | — |
| A-4 | — | — |
| A-5 | — | — |
| A-6 | — | — |
| A-7 | — | — |
| A-8 | — | — |
| A-9 | — | — |

## Log

- 2026-10-02: baseline re-measured (above). Plan written by a top-model subagent, committed `3682d02`, 3,254 lines,
  14 tasks. Lead checked the commit, the task headings and the blockers section. Stopped for plan approval.
