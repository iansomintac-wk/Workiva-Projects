# Prompt coach: reproducible weights (design)

Date: 2026-10-22. Talk session 73f0cb40 (successor of run lead 02598fea, "Prompt coach C1 cues", stopped at Task 4).
Branch: prompt-coach-weights-repro, from c4175c8 (prompt-coach-c1-cues before the Context cues: 3d2fe90 small fixes and
c4175c8 guarded copy helper, both checked in that run). Main branch: prompt-coach.
Probe scripts and full numbers: prompt-coach/docs/research/weights-repro/ (README.md, orders.txt).

## Problem

Retraining does not reproduce the shipped prompt-coach weights, so no cue change can be checked cleanly. A retrain
fails rewrite_unit tests that the shipped weights pass, so the C1 run could not tell a cue regression from noise.

## Root cause (measured 2026-10-22, on throwaway copies; Node v26.5.0, Git Bash)

- `--tune` and `--tune-sure` are deterministic: two runs on one commit give the same bytes (5 commits checked).
- The shipped `w` and `thr` (unchanged since dfe2c65, 10-13) were trained with the files in the order
  fr, grc, sus, hard. Every later retrain used the shell glob `data/train_*.jsonl` (fr, grc, hard, sus). Row order
  drives the seeded shuffle, so every weight moves a little and the tuned thresholds move a lot.
  At dfe2c65, `train.js rulefeat --tune` with that order rebuilds the shipped file byte-identical
  (sha256 88d8fd50...). The other 23 orders differ in 276-283 of 281 entries.
- The shipped `sure` cut-offs (S .99 C .7 O .3 P .3 E .45, set at f5552de) come from `--tune-sure` in glob order; the
  README order gives C .715. So the shipped file mixes two orders.
- Disproved: "the rt:S:the-document cue (a46f7bb) breaks #76/#77 on any retrain" (hand-off). At c4175c8 a retrain in
  the README order includes that cue (-4.396) and passes rewrite_unit 77/0 with eval 0.856.
- Over all 24 file orders at c4175c8, rewrite_unit is 77/0 in only 6; eval is 0.856-0.863 in all 24; thresholds move
  S .45-.7 and C .3-.65 with order alone. The failing tests run a fixed prompt through the real trained detector and need
  a set grade: #1, #9, #11, #13, #14, #76, #77 (and #31, #35, #36 in one order).
- #13 ("context: only Context missing means no blank, even when a kept sentence has a Context cue") uses the
  test.jsonl row "We need this for our user-control assessment ...", gold S1 C1 O1 P1 E1. Without the C1 cues the
  detector misses its Context (prob .502 < .575); with the new feeds-into cue it finds it (.882). The test needed that
  miss. With Context pinned off through the test file's own `forced()` helper, #13 passes 77/0 on shipped weights,
  on a retrain, with and without the cues (3 states measured).
- Order-independent training (rows sorted by prompt) is byte-identical across orders but gives 72/5, eval 0.859.

Read, not measured here: the C1 run's state A/B/C numbers (docs/evidence/2026-10-22-prompt-coach-c1-cues.md on branch
prompt-coach-c1-cues). Research (Haiku helper): scikit-learn advises one seeded random state passed everywhere
(checked); DVC detects changed inputs by content hash (search snippet only); no source found on file order or on
stubbing models in unit tests.

## Ian's rulings (verbatim answers to decision cards; the hook left both to him, rows `left: "ian-kind"`)

- 2026-10-22 19:31Z, "which weights the prompt coach ships from now on": "New baseline, fixed order (Recommended)".
  Option text: training script sets the order fr, grc, sus, hard itself; retrain on today's code (no C1 cues); add a
  check that a retrain matches the committed file byte for byte.
- 2026-10-22 19:45Z, "how to fix #13 and its look-alikes": "Pin letters in all 7 (Recommended)". Option text: spec
  amendment: the 7 weight-tied rewrite tests (#1, #9, #11, #13, #14, #76, #77) set the grader's letters themselves; the run
  proves each still fails when its rule is broken (mutant check) and passes on all 24 file orders.
- Not covered by a ruling: #31, #35, #36 (flipped in one order; the talk's card wrongly said only 7 flip, corrected in
  the talk). They stay as they are unless Ian adds them.
- (c) reshaping C1 is not decided here: its numbers were measured on weights nobody could rebuild, so it goes to a later
  talk on the new baseline.

## Design

1. **Fixed file order in train.js.** train.js puts its data-file arguments in one fixed order before reading:
   train_fr, train_grc, train_sus, train_hard, then any other file name alphabetically. Same for `--tune`, `--tune-sure`
   and `--cv`. The README command `node tests/train.js rulefeat --tune data/train_*.jsonl` then gives the same file in
   any shell that expands the glob. The training-only check on `--tune-sure` is unchanged (locked).
2. **New baseline.** On this branch: `--tune`, then `--tune-sure`, with the README commands. Commit engine/weights.json,
   rebuild dist, and update every README figure it changes (thresholds and sure line in the Model row, build bytes,
   weights size) in the same commit.
3. **Reproduction check.** New `prompt-coach/tests/repro_weights.js`: retrains into a temp file with the README commands
   (`--tune`, then `--tune-sure`), byte-compares with engine/weights.json, prints `REPRO OK <sha256-prefix>` and exits 0,
   or prints the first differing letter/entry and exits 1. Never writes engine/weights.json. Added to the README test
   block; c5_gate.js is not changed.
4. **Pin letters in the 7 tests** (Ian 19:45Z). In tests/rewrite_unit.test.js, each of #1, #9, #11, #13, #14, #76, #77
   gets its detection from `forced(...)` (or a pinned `detect`), with the letters, probabilities and `sure` that make the
   test's own premise true (for example #13: Context off; #76: all on, above sure; #77: all on, no probabilities). What
   each test asserts about the rewrite does not change. Test titles stay; no test is dropped.
5. **Out of scope:** C1 cues and C1 bars; reading data/done_when_strong.jsonl; #31/#35/#36; template.html:402; the dead
   contraction alternatives at engine/rules.js:100; any data file.

Locked (unchanged): data files, the C1-C5 bars, the 3% sure cap, the training-only check in train.js, c5_gate.js and its
exact `GRADE acc=0.856` rule, tests/fixtures/c5_base.json. AI-free, $0, no installs.

## Done when (each with its prediction and what disproves it)

| # | Check | Prediction | Disproved by |
|---|---|---|---|
| D1 | `node tests/repro_weights.js` on the branch | exit 0, `REPRO OK` | any byte difference |
| D1c | Control: the script run before Design 2 is committed (engine/weights.json still the old shipped file) | exit 1 | exit 0 (the check cannot fail) |
| D1o | Retrain with the files passed in reverse order, then D1 | exit 0 (order fixed in train.js) | exit 1 |
| D2 | Thresholds and sure in the committed file | thr S .5 C .575 O .3 P .3 E .45; sure S .99 C .715 O .3 P .3 E .45 | any other value (then the copy probe and the branch differ: stop and find out why) |
| D3 | `node --test --test-reporter=tap tests/rewrite_unit.test.js` after Design 2, before Design 4 | 77 ok, 0 not ok | any not ok |
| D4 | Same, after Design 4, on the branch and on all 24 file orders (orders.sh pattern, copies whose train.js has Design 1 taken out, else every order is the same) | 77/0 in 24 of 24 | any order with a not ok |
| D4m | Mutant per pinned test: break the rewrite rule it names, in a scratch copy | that test fails, 7 of 7 | a pinned test that still passes (pinned too loosely: restore it as it was and tell Ian) |
| D4c | Same pinned tests on a copy with the C1 cues (9515a81, aece903) added and a retrain | #13 passes; 77/0 | #13 or another pinned test fails |
| D5 | `node tests/eval.js rulefeat data/test.jsonl` | GRADE acc=0.856 (c5_gate passes unchanged; floor 0.856) | any other value |
| D6 | `node tests/c5_gate.js` | PASS | FAIL (a simulate count above c5_base.json is a stop for Ian, not a re-baseline) |
| D7 | `node tests/done_when.js --only C2,C4` | C2 test and sim <= 2.0% / 1.8% (sure C rose .7 -> .715, so no more false "no changes"); C4 0 blanks | C2 above 5% or C4 above 0 |
| D8 | r1 (seen set) in a mkcopy.sh r1 copy, `done_when.js --only C1` there | about 14 of 30, at or below the control 14 | reported only, no bar; r1 is a seen set |
| D9 | pagetest.js after build.js | passes | any failure |

## Risks

- The 24-order sweep and the mutant check are the only proof the pinned tests are not vacuous; a test that passes with
  its rule broken must not be kept pinned.
- If D2 differs from the copy probe, the branch's code differs from c4175c8 somewhere that matters; find it before going on.
- Merge: merge-gate.mjs cannot run its suite here (memory merge-gate-no-npm-test), so the merge stops for Ian with the
  measured suite on base and on the merge result.
