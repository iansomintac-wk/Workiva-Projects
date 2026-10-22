# Prompt coach C1 reshape: new practice prompts for Context (design)

Talk session 0b6e9a11, 2026-10-22 from 21:05Z. Branch `prompt-coach-c1-reshape` from `origin/prompt-coach` @ e7bda50
(weights repro 46b0c12 and the gate fix 7620ab6 both merged there). Parent specs: `2026-10-22-prompt-coach-done-when-design.md`
(bars C1-C5), `2026-10-22-prompt-coach-c1-cues-design.md`, `2026-10-22-prompt-coach-weights-repro-design.md`.

## Rulings (verbatim)

- Ian, 2026-10-22 ~21:13Z, card '[Ian] C1 way' (~/.claude/answered-for-ian.jsonl row 21:13:36.660Z, this session,
  `left: "ian-kind"`, so the hook left it and the answer is Ian's): "New practice prompts (Recommended)". The card said a
  model drafts and labels these prompts offline while we build, the shipped coach itself still runs with no AI, and asked him
  to decide whether that fits "keep it AI-free"; this pick is that decision. Its stop rule: "If the practice-30 stays under 25
  or the 5% bar breaks, stop and ship the fallback."
- Standing: "Keep it AI-free (Recommended)", the C1-C5 bars, "$0, 2M token cap (Recommended)".
- PM (studio-harness:pm, this talk; proxy decided, Ian may overturn): commit the fallback first so the retreat costs nothing;
  one draft-and-cue round; log which model drafted and labeled the new prompts; keep C4 in every run; confirm on sim that new
  cues do not push C2 up. Labeling coach training data is not a Fit Finder label, so it is not Ian's.
- Carried from the C1 cues talk (PM proxy there, Ian may overturn): the fresh 30 is read only after every dev gate passes;
  `c5_gate.js`'s eval check becomes a floor (at or above 0.856) instead of an exact match.

## Evidence

Measured this talk in throwaway copies (`mkcopy.sh <src> <dest> r1`: the fresh set is never copied; r1 is renamed into its
slot). r1 = `data/done_when_strong_r1.jsonl`, a seen dev set: every r1 number below is a dev number. No r1 prompt text was
printed or read in this talk (the probes print row numbers and scores only). Logs: `~/.claude/jobs/0b6e9a11/tmp/states/`.

| State (new baseline) | r1 | C2 test / sim | C4 | eval | rewrite_unit | sure S / C |
|---|---|---|---|---|---|---|
| control (shipped weights, rules unchanged) | 14/30 | 5/247 2.0% / 2/111 1.8% | 0 | 0.856 | 77/0 | .99 / .715 |
| A: C1-cues rules (aece903), no retrain | 19/30 | 7/247 2.8% / 3/111 2.7% | 0 | 0.869 | 77/0 | .99 / .715 |
| B: A + README retrain (`--tune`, `--tune-sure`) | 21/30 | 8/247 3.2% / 3/111 2.7% | 0 | 0.866 | 77/0 | .985 / .3 |
| C: A + `--tune-sure` only | 26/30 | 9/247 3.6% / 15/111 **13.5% MISS** | 0 | 0.869 | 77/0 | .985 / .575 |

- B misses (block.js): 5 rows with zero Context hits (Context prob 0.15, graded "better"), 3 Source-blocked, 1 with no
  blocking letter (stacked-ask, out of scope).
- Source sweep on B (ssweep.js, in-sample): S .97-.80 lifts r1 to 22-23/30 but training false sure rises to 3.5-3.6%, over the
  locked 3% cap. So the cap-respecting fallback is B as tuned, 21/30. (Correction: the Ian card said "at most 23 of 30 with the
  best Source setting"; 23 needs the cap broken.)
- State C reaches 26-28 only because Context sure .575 sits under the 0.66 no-evidence score, so every prompt with silent
  Context counts as sure: that is the 15/111 sim. Training-only separation tested (silentc.js): among training prompts given
  "No changes needed" with zero Context hits, 14 of 14 are non-strong and 0 strong, so no training-picked cut-off (word count,
  total hits) can split silent strong from silent weak. A second-stage rule would need r1 or sim to pick it: ruled out.
- Training rows labeled Context=1 with zero Context hits under the cue rules: 12/532 (read: C1 cues stop report; block.js
  reproduced 12/532 today). The training data has little left to write Context cues from: hence new practice prompts.
- `done_when.js --only ZZ` and `--only ""` exit 2, "--only needs a known set" (measured in the B copy): the talk prompt's small
  item is already fixed. `c5_gate.js` on B: only `eval` fails (exact 0.856 vs 0.866); simulate, customer_check, rewrite_unit and
  pagetest (after build) pass.

Read, measured on the old weights (not comparable, quoted only for history): control 14/30, spike cues 19/30, C2 2.8%/1.8%;
old states A 23/30, B 23/30, C 28/30 with sim 14.4%.

## Design

1. Fallback commit (state B). Bring `engine/rules.js` from aece903 (the C1 cue families, written from training misses). Retrain
   with the two README commands. `c5_gate.js` eval check becomes `acc >= 0.856`, test first: a fixture output with
   `GRADE acc=0.866` fails the old check and passes the new one; `GRADE acc=0.855` fails both. README figures that quote the
   weights (sure line, eval, build size) change in the same commit.
2. New practice prompts. One helper on the top model drafts 20 training prompts in `data/train_ctx.jsonl` (same fields as
   `data/train_*.jsonl`, labels per `data/LABELING.md`), varied in how they say who the work is for, what it feeds and the
   situation, across the existing domains, with weak ones mixed in (at least 6 of 20 not strong) so the cues learn a contrast.
   The helper's prompt contains no text from r1, test, sim or the fresh set, and the helper is told not to open them. The
   ledger row names the model that drafted and labeled them. A fresh checker re-labels 5 at random; disagreement on more
   than 1 letter is a stop.
3. Go/no-go: share of the drafts labeled Context=1 that get zero Context hits under step 1's rules. More than half: go on.
   Half or fewer: there is little to learn; stop and keep the fallback.
4. Context cues written only from training rows with Context=1 and zero hits (the drafts plus the 12 older rows), as general
   patterns with a one-line comment each, never copying a row. Retrain with the README commands; `repro_weights.js` must print
   REPRO OK.
5. Dev gates, measured in a `mkcopy.sh <src> <dest> r1` copy (never `done_when.js` in the repo before step 6), one fix
   round at most (more cues from training misses only): r1 >= 27/30 (seen set) to read the fresh set;
   C2 <= 5% on test and on sim; C4 0 blanks; `c5_gate.js` PASS; REPRO OK. Ian's stop rule applies before that: r1 under 25 or
   C2 over 5% stops the run with the fallback kept. r1 25 or 26 also stops (bar to read is 27); keep whichever committed state
   passes C2, C4 and c5_gate with the higher r1, fresh unread, C1 recorded as open.
6. Only when every dev gate passes: read the fresh 30 once, `node tests/done_when.js --only C1`, then
   `node tests/validate_done_when_sets.js` right after. That C1 number is final, reported as it comes out, no tuning after it.

### Locked during the run

Data files (train, test, sim, r1, fresh; `train_ctx.jsonl` is locked once step 2's check passes), `done_when.js` bar logic,
the 3% cap and the training-only check in `train.js`, `rewrite_unit.test.js`, the C1-C5 bars, and `c5_gate.js` except step 1's
floor change. `node tests/repro_weights.js` prints REPRO OK after every retrain and before every commit.

## Success criteria (prediction, and the result that disproves it)

| # | Measure | Prediction | Bar | Disproved / failed by |
|---|---|---|---|---|
| F | fallback (step 1) r1, C2, C4, c5_gate | 21/30, 3.2% / 2.7%, 0, PASS | C2, C4, c5_gate | any other figure |
| G | drafts labeled Context=1 with zero Context hits (step 3) | 60-80% (assumed) | > 50% to go on | 50% or fewer |
| D1 | training Context=1 rows with zero hits after step 4 | under 8 | progress number | more than 12 |
| D2 | r1 after step 4 (seen set) | 23-26/30 (assumed: drafted phrasing may not cover r1's 5 silent rows) | >= 27 to read fresh | 26 or fewer |
| C1 | fresh 30, read once | if read: 22-26/30, below r1 | >= 27 | 26 or fewer |
| C2 | test / sim | <= 4% each | <= 5% each | over 5% on either |
| C4 | blanks | 0 | 0 | any |

Honest read of D2: the more likely outcome is a stop at the dev gate with the fallback kept and C1 open. That still answers
whether drafted Context coverage moves r1.

## Out of scope

AI calls in the coach; the middle-tier message and a larger C1 set (both Ian's, raised in his card, not chosen); a
second-stage sure rule (ruled out above); the stacked-ask rule; template.html:402 "[fill in your details]" (a look item for
Ian, PM first pass); the weights-repro known limits (V8 sort, same-basename tie-break); anything to the brain (work repo).
