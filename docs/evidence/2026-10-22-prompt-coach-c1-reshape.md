# Prompt coach C1 reshape: evidence (measured vs read)

Date 2026-10-22. Branch `prompt-coach-c1-reshape`. Spec: `docs/superpowers/specs/2026-10-22-prompt-coach-c1-reshape-design.md`. Plan: `docs/superpowers/plans/2026-10-22-prompt-coach-c1-reshape.md`.

**Committed state: the FALLBACK** (commit 787c3e2, C1 cue rules from aece903 plus the README retrain; probes in 3269d46). No candidate and no fix round was committed. The run stopped at the go/no-go (G) step.

"r1" is `done_when_strong_r1.jsonl`, a SEEN dev set. Every r1 number below is a seen number, not a held-out one. "measured now" = run this session with the command and log named; "read" = taken from the spec table, not re-run.

## Result table

| Measure | Prediction | Result | Status | Source |
|---|---|---|---|---|
| Baseline control (shipped weights, rules unchanged), r1 seen | 14/30 | C1 14/30; C2 test 5/247, sim 2/111; C4 0; c5_gate eval 0.856; REPRO OK 3007835695bb | measured now (Task 1) | `$CLAUDE_JOB_DIR/tmp/t1_*.log`; also in spec table (read) |
| F: fallback, r1 seen | C1 21/30, C2 3.2% / 2.7%, C4 0, c5_gate PASS | C1 21/30 (seen), C2 test 8/247 = 3.2%, sim 3/111 = 2.7%, C4 0 blanks, c5_gate 5 GATE PASS (eval 0.866), sure S .985 C .3 | measured now (Task 3 and again on the final tree) | `tmp/t3_*.log`, `tmp/t11_suite.log`, `tmp/t11_dw.log` |
| G: drafts labeled Context=1 with zero Context hits | 60-80% (assumed) | 3/16 = 18.8% | measured now (Task 6) | `ctxzero.js` on the draft; draft kept in the ledger, not the repo |
| G control: same drafts under the pre-fallback rules (3633614) | - | 6/16 with zero hits | measured now | same |
| D1: training Context=1 rows with zero hits after cue writing | under 8 | not measured (Tasks 7-10 not run) | not run | - |
| D2: r1 after cue writing (seen) | 23-26/30 (assumed) | not measured | not run | - |
| C1: fresh 30, read once | 22-26/30 if read, bar >= 27 | UNREAD, so C1 is open | not run | - |
| C2 | <= 4% each, bar <= 5% | test 3.2%, sim 2.7% (fallback) | measured now | `tmp/t11_dw.log` |
| C4 blanks | 0 | 0 (0 of 862 outputs, 453 prompts) | measured now | `tmp/t11_dw.log` |
| SIMALL (all-files simulate baseline, Task 4) | PASS = c5_base | baseline recorded: 4 files, PASS; a mutated base made the check FAIL (exit 1). Not re-run on the final tree: `train_ctx.jsonl` is not in the tree | measured now (Task 4) | ledger `simall.base.json` |
| ctxzero probe, older training rows | 12 zero-hit of 532 Context=1 | c1=532, zero=12 (control old rules: 99) | measured now (Task 4) | probe output |
| fit-finder `prompts-strong.test.js` | 1 pass, 0 fail | 1 pass, 0 fail | measured now | `tmp/t11_suite.log` |

## Predictions against their disproving result

- G predicted 60-80% (assumed); the disproving result was 50% or fewer. Measured 18.8%. DISPROVED, so the run stopped at G: the fallback stays, no cues were written from the drafts.
- D1, D2 and C1 predictions are untested (their tasks did not run). They are neither confirmed nor disproved.
- F matched every predicted figure.

## How the 20 training prompts were made

- One model, opus (helper reported `claude-opus-5-5[1m]`), both drafted AND labeled the 20 rows of `data/train_ctx.jsonl`: 10 not strong, Context=1 on 16 rows. The labeler is the drafter, so the labels are not independent.
- Blind relabel by a fresh opus of 5 rows (0, 1, 2, 11, 15): 0 letter disagreements (S, C, O, P, E). A mutated copy with one flipped letter was caught (1 disagreement), so the comparison was not vacuous. Two rows carried an "unsure" note (P on row 2, S on row 15) and both agreed anyway.
- The draft was locked (sha256 prefix 8ddc76caae44), then moved out of the repo after the G stop to the run ledger (`train_ctx.g-stop.jsonl`). It is not committed. REPRO OK 7e77a3d869eb after the move.
- The shipped coach runs with no AI; a model drafted and labeled the 20 training prompts offline (Ian's pick '[Ian] C1 way').
- No draft text appears in this document: counts only.

## Held-out discipline

- The fresh 30 (`done_when_strong.jsonl`) was never opened, copied, grepped or scored by this run. C1 is open: it still has no held-out reading.
- Every done_when number above came from a `mkcopy.sh ... r1` copy (the fresh set is not copied into it).
- Task 12's scratch worktrees (base and scratch merge) check out a second copy of `done_when_strong.jsonl` as part of the checkout; they do not read it.

## Final-tree Suite (measured now, state committed = fallback)

- `repro_weights.js`: REPRO OK 7e77a3d869eb
- `build.js`: dist 339 KB; committed LF size `git cat-file -s HEAD:prompt-coach/dist/prompt-coach.html` = 345526 bytes, matches README line 9 (a CRLF checkout is larger, 346976 by `wc -c`); `git diff --stat` empty after the build, tree clean
- `c5_gate.js`: 5 GATE lines, all PASS (eval acc 0.866; simulate 2/2, 5/5; customer_check 229 runs; rewrite_unit 77/0; pagetest 22 checks, 0 failed)
- `c1_fixes.test.js` + `train_order.test.js`: 8 pass, 0 fail
- fit-finder `prompts-strong.test.js`: 1 pass, 0 fail
- r1 copy `done_when.js --only C1,C2,C4`: C1 21 of 30 (seen; bar 27, MISS), C2 test 3.2% PASS, C2 sim 2.7% PASS, C4 0 PASS

## Final review (Opus + Codex, then fixes)

Fixed: (1) simall.js --check now fails on a missing baseline key, a failed child run or a non-numeric count, and --save refuses on a child failure (empty baseline: PASS before, FAIL after); (2) ctxzero.js resolves its dir argument (`.` now prints older c1=532 zero=12); (3) silentc.js exits 9 before any data read when data/done_when_strong_r1.jsonl exists; (4) README build size is the committed LF size and the cue count is the measured 145.

Declined: Opus should-fix rules.js:158 ("we make"), rules.js:140 ("this is used to") and nit rules.js:136 `\s*`. Changing rules.js re-opens the measured fallback F (C2 within bar), so they are follow-ups for the next C1 talk.

## Open

C1 stays open. A next try needs a different source of Context practice prompts than this single-model draft (only 3 of 16 Context=1 drafts were uncovered by existing cues, so there is little new signal to write cues from).
