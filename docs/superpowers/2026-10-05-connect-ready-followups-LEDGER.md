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
| 2026-10-05 | Merge (F-1..F-8 and R-1 done, final review clean, end checks measured) | waiting for Ian |

## Tasks

| # | Task | Findings | Model | State | Commit | Check command | Measured result (lead re-run) | Deviation |
|---|---|---|---|---|---|---|---|---|
| F-1 | Lock: stale takeover race, release on failed write | lock lows, F23 | top | done | da60012 | `node --test connector/test/*.test.mjs` → 144 | connector 144/144 (+4 gainsight-auth: lock race crashed holder + two waiters, stale takeover file, failed write releases lock, F23 non-date obtainedAt), exit 0 (lead, 2026-10-05). Checker PASS: 3 of 4 new tests red on da60012~1; release test pins existing behaviour (plan intended). Builder saw one demo.test "did not start in 10 s" flake; checker 2 runs + lead 1 run did not reproduce | Extra comment clause in gainsight-auth.mjs (plan gave no text). Low, left: breakStale keeps one check-then-unlink (live holder overrunning 60 s releasing during a takeover could drop a third waiter's fresh lock; comment names only the crash case); stale takeover-file removal is itself unguarded (reachable only after a crash mid-takeover) |
| F-2 | vendor-http scrub | F8, F9 | Sonnet | done | 3703ed6 | `node --test connector/test/*.test.mjs` → 146 | connector 146/146 (+2 vendor-http: F8 JSON-escaped secret, F9 kept body scrubbed and non-enumerable), exit 0 (lead, 2026-10-05). Checker PASS: both red on 3703ed6~1; callers gong-rest.mjs:25 and gainsight-rest.mjs:193 read `e.body` directly, unaffected | None. Low, pre-existing, left: `detail` cut to 500 chars before scrubAll, so a secret straddling char 500 could leave a fragment |
| F-3 | Health survives corrupt proof.json | F7 | Sonnet | done | 09ae0d6 | `node --test connector/test/*.test.mjs` → 147 | connector 147/147 (+1 proof: corrupt proof.json gives health 200, both adapters unproven), exit 0 (lead, 2026-10-05). Checker PASS: red on 09ae0d6~1 (502 !== 200); loadProofSafe used only by the two health name getters; gate, unlock and state.mjs:42 keep strict loadProof, so corrupt proof still blocks writes | None. Low, left: test covers a parse error only, not valid-JSON-wrong-type (`[]`) or EACCES (the code handles both as unproven) |
| F-4 | Push | F13, F14, F22, mixed-code duplicate | Sonnet | done | 2d56384 | `node --test connector/test/*.test.mjs` → 152 | connector 152/152 (+5: docs F22; gainsight-read F13 gate 1/"true" and not-configured; gainsight-push F14 mid-batch failure and mixed-code duplicate stays sent), exit 0 (lead, 2026-10-05). Only F22 red on old code; the other 4 pin existing behaviour, each red under a mutation (builder, then checker re-did all 4 in a throwaway worktree). Checker PASS | No logic change: CONTRACT.md send-record bullet (Ian's ruling: mixed codes stay sent) and a hasExactCode comment. Low, left: F14 test is not uniquely load-bearing (4 older tests fail under the same mutation); one over-long line in CONTRACT.md near 123 (cosmetic) |
| F-5 | Callback nosniff; unknown CLI argument exits 2 | F11, F20 | Sonnet | done | b8c3784 | `node --test connector/test/*.test.mjs` → 154; demo; e2e | connector 154/154 (+2: oauth F11 text/plain + nosniff; server t15 unknown argument prints usage, exit 2, no server), exit 0 (lead, 2026-10-05). Checker PASS: both red on b8c3784~1; every launch site checked (e2e, demo, runbooks, tests use no args or known commands); e2e 7/7 exit 0, demo exit 0 (checker) | None. Note: any known command in argv wins, so `--chek --check` still runs the check. Low, left: new CONTRACT.md sentence is one long line (cosmetic) |
| F-6 | Setup re-asks empty secrets; --check secrets and partial write | F15, F16 | Sonnet | done | 21cc217 | `node --test connector/test/*.test.mjs` → 157 | connector 157/157 (+3: setup F16 empty key/secret re-asked, nothing empty written; check F15 Gainsight secrets absent from output; check F15 partial --check --write records no proof, exit 1; plus a config.example.json-untouched assertion in an existing test), exit 0 (lead, 2026-10-05). Checker PASS: F16 red on parent; both F15 tests (pinning existing behaviour) red under mutation; re-ask ends after 3 tries, EOF answers '' so closed stdin does not hang | No `0o600` test (plan: Node ignores POSIX modes on Windows). Low, left: CONTRACT.md:211 sentence appended to an already long line (cosmetic) |
| F-7 | `--measure-transcripts` guards; scope "to confirm" | F17, F18, F24 | Sonnet | done | b457d7f | `node --test connector/test/*.test.mjs` → 164; demo | connector 164/164 (+7: measure F17/F24 403 text, wrong adapter, every transcript empty, book at/over quota, `--book-bytes abc`, F18 no transcript; docs F24), exit 0 (lead, 2026-10-05); demo exit 0 (builder). Checker PASS: 6 red on b457d7f~1; whole-repo sweep finds no scope stated as fact outside history (CONNECT-GONG.md:66 CONFIRMED is the endpoint scope, cited) | Plan's mutation for the wrong-adapter test ('gong-restx') cannot fail it (test uses adapter 'fake'); builder proved it by disabling the guard. Calls/week now counts calls with a transcript, labelled when some had none. No callId batching (plan). Low, open: `--book-bytes ""` → Number('') = 0 may pass validation (num() not checked) — for final review |
| F-8 | OAuth `state`, optional, off by default | F10 | Sonnet | done | 00c85ed | `node --test connector/test/*.test.mjs` → 167; demo | connector 167/167 (+3 gainsight-auth: F10 URL has state only when `oauth.stateParam` set; wrong/missing state 400, no token call, real redirect still works; off = callback ignores state as before), exit 0 (lead, 2026-10-05); checker 5 sequential runs 167/167 ×5; demo exit 0 (builder). Checker PASS: 2 red on 00c85ed~1; "off" pin red under mutation; state is setup's random hex, checked before `used = true` | `stateParam` is the query parameter NAME (default `""` = off). Docs say Gainsight echoing state is UNCONFIRMED. Low, left: expectedState defaults to null, so a caller that sets stateParam but passes no expectedState skips the check (only caller setup.mjs passes it). FLAKE: builder's first full run 166/167, F-1 test "takeover file left by a process that died mid-takeover" failed once; not reproduced in 5 checker runs + 1 lead run (final review: 27 more runs, none). Suspected (unproven): 500 ms real-time lockWaitMs vs takeLock's wall-clock deadline under load, or Windows EPERM on re-creating a just-deleted file (gainsight-auth.mjs:64-66) |
| R-1 | Final-review fixes: scrub before truncate; CONTRACT.md argument wording | review Minor 1, 2 (= F-2 low) | Sonnet | done | ff169d6, fix a1750e0 | `node --test connector/test/*.test.mjs` → 168 | connector 168/168 (+1 vendor-http R-1: secret straddling the 500-char cut leaves no fragment), exit 0 (lead, 2026-10-05). Test red on parent (message ended "...FAKE-"). Checker FAIL then PASS | First checker failed the CONTRACT.md wording ("any other argument is ignored" — known sub-flags are honoured); fixed first time (a1750e0, docs only), re-check PASS against cli.mjs:30-45 and server.mjs:137-144 |

Recommended not to fix (plan): F21 (health strings fixed by spec §3.2/CR6; tracker D2 knows only `unproven`/`dry-run`);
F16's `0o600` test (Node ignores POSIX modes on Windows); F17 callId batching (no documented maximum).

## Final review (top model, 2026-10-05, range e9db1a7..73085ad)

Verdict: ready to merge; no Critical, no Important; 2 Minor, both fixed in R-1. Reviewer measured connector 167/167 ×3,
e2e 7/7 exit 0, demo exit 0, gainsight-auth 24/24 under parallel load; no forbidden files; no stale test counts in prose.
Rulings on open lows: (a) takeover-test flake: leave (not reproduced in 27 runs; keep the error text if it recurs);
(b) `--book-bytes ""` = 0: leave (output prints "book size given: 0 bytes", not silent); (c) breakStale's last
check-then-unlink window: leave (needs a live holder past 60 s, documented); (d) truncate before scrub: fixed (R-1);
(e) expectedState null default: leave (only caller always passes it). Full review was written to the job tmp dir (not kept).

## End-of-run checks (measured 2026-10-05 by the run lead at a1750e0)

- `node --test connector/test/*.test.mjs`: **168/168**, exit 0 (baseline 140; +28 named in the rows above).
- `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475`: **475/475**, exit 0 (tracker unchanged).
- `node tools/connector-e2e.mjs`: **7/7**, exit 0.
- `node tools/connector-demo.mjs`: exit 0.

## Log

- 2026-10-05: predecessor 97b2ee77 removed (`claude rm`, no flags; state done, worktree clean). Baseline measured.
  Plan written by a fresh top-model subagent, committed `04b4241`. Stop for plan approval.
- 2026-10-05: Ian approved. F-1..F-8 built one at a time (builder, checker, lead re-run); all checkers PASS first time.
  Final review on the top model; its 2 Minor fixed as R-1 (one wording fix after a checker FAIL). End checks measured.
  Stop for merge. Every in-scope finding is fixed; F21 left by Ian's ruling; F12, F19 out of scope.
