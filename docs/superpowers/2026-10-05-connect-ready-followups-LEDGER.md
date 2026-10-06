# Connect-ready follow-ups (low findings F7-F24) — ledger

Spec: `evidence/connect-ready/T14-review.md` (F1-F6 fixed earlier; F12 refuted, F19 out of scope).
Plan: `plans/2026-10-05-connect-ready-followups.md` (`04b4241`). Run prompt: `sessions/connect-ready-followups-run.md`.
Branch: `connect-ready-followups` (worktree `.claude/worktrees/connect-ready-followups`, from hand-off branch
`worktree-connect-ready-followups-handoff` at `e9db1a7`, itself on `master` `55e3c69`).
Paid runs approved: none ($0). No external calls.

Wording rule: adapters are "tested on recorded-shape fixtures" and "unproven until `--check`".

## Baseline (measured 2026-10-05 by the run lead at `e9db1a7`, this worktree)

- `node --test connector/test/*.test.mjs`: **140/140**, exit 0.
- `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475`: **475/475**, exit 0.
- `node tools/connector-e2e.mjs`: **7/7**, exit 0.
- `node tools/connector-demo.mjs`: exit 0.

Matches the previous lead's figures (2026-10-03, `c6b7f2b`).

## Stops

| When | Stop | State |
|---|---|---|
| 2026-10-05 | Plan approval (plan `04b4241`), questions: F10 build F-8?; F21 leave unfixed?; mixed-code duplicate stays "sent"? | Ian, 2026-10-05: "Approve F-1..F-7"; F10 "Build F-8, off by default"; F21 "Leave unfixed"; duplicate "Keep as sent" |

## Tasks

| # | Task | Findings | Model | State | Commit | Check command | Measured result (lead re-run) | Deviation |
|---|---|---|---|---|---|---|---|---|
| F-1 | Lock: stale takeover race, release on failed write | lock lows, F23 | top | done | da60012 | `node --test connector/test/*.test.mjs` → 144 | connector 144/144 (+4 gainsight-auth: lock race crashed holder + two waiters, stale takeover file, failed write releases lock, F23 non-date obtainedAt), exit 0 (lead, 2026-10-05). Checker PASS: 3 of 4 new tests red on da60012~1; release test pins existing behaviour (plan intended). Builder saw one demo.test "did not start in 10 s" flake; checker 2 runs + lead 1 run did not reproduce | Extra comment clause in gainsight-auth.mjs (plan gave no text). Low, left: breakStale keeps one check-then-unlink (live holder overrunning 60 s releasing during a takeover could drop a third waiter's fresh lock; comment names only the crash case); stale takeover-file removal is itself unguarded (reachable only after a crash mid-takeover) |
| F-2 | vendor-http scrub | F8, F9 | Sonnet | done | 3703ed6 | `node --test connector/test/*.test.mjs` → 146 | connector 146/146 (+2 vendor-http: F8 JSON-escaped secret, F9 kept body scrubbed and non-enumerable), exit 0 (lead, 2026-10-05). Checker PASS: both red on 3703ed6~1; callers gong-rest.mjs:25 and gainsight-rest.mjs:193 read `e.body` directly, unaffected | None. Low, pre-existing, left: `detail` cut to 500 chars before scrubAll, so a secret straddling char 500 could leave a fragment |
| F-3 | Health survives corrupt proof.json | F7 | Sonnet | done | 09ae0d6 | `node --test connector/test/*.test.mjs` → 147 | connector 147/147 (+1 proof: corrupt proof.json gives health 200, both adapters unproven), exit 0 (lead, 2026-10-05). Checker PASS: red on 09ae0d6~1 (502 !== 200); loadProofSafe used only by the two health name getters; gate, unlock and state.mjs:42 keep strict loadProof, so corrupt proof still blocks writes | None. Low, left: test covers a parse error only, not valid-JSON-wrong-type (`[]`) or EACCES (the code handles both as unproven) |
| F-4 | Push | F13, F14, F22, mixed-code duplicate | Sonnet | done | 2d56384 | `node --test connector/test/*.test.mjs` → 152 | connector 152/152 (+5: docs F22; gainsight-read F13 gate 1/"true" and not-configured; gainsight-push F14 mid-batch failure and mixed-code duplicate stays sent), exit 0 (lead, 2026-10-05). Only F22 red on old code; the other 4 pin existing behaviour, each red under a mutation (builder, then checker re-did all 4 in a throwaway worktree). Checker PASS | No logic change: CONTRACT.md send-record bullet (Ian's ruling: mixed codes stay sent) and a hasExactCode comment. Low, left: F14 test is not uniquely load-bearing (4 older tests fail under the same mutation); one over-long line in CONTRACT.md near 123 (cosmetic) |
| F-5 | | F11, F20 | Sonnet | planned | | → 154 | | |
| F-6 | | F15, F16 | Sonnet | planned | | → 157 | | |
| F-7 | | F17, F18, F24 | Sonnet | planned | | → 164 | | |
| F-8 | OAuth `state`, optional, off by default | F10 | Sonnet | planned | | → 167 | | |

Recommended not to fix (plan): F21 (health strings fixed by spec §3.2/CR6; tracker D2 knows only `unproven`/`dry-run`);
F16's `0o600` test (Node ignores POSIX modes on Windows); F17 callId batching (no documented maximum).

## Log

- 2026-10-05: predecessor 97b2ee77 removed (`claude rm`, no flags; state done, worktree clean). Baseline measured.
  Plan written by a fresh top-model subagent, committed `04b4241`. Stop for plan approval.
