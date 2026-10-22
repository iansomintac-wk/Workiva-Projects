# Prompt coach C1: more Context cues (design)

Talk session 2307a63e, 2026-10-22 from 17:58Z. Branch `prompt-coach-c1-cues` from `prompt-coach` @ 74040ee.
Parent spec: `docs/superpowers/specs/2026-10-22-prompt-coach-done-when-design.md` (bars C1-C5).
Background: `prompt-coach/docs/research/2026-10-22-c1-options.md`.

## Rulings (verbatim)

- Ian, 2026-10-22 17:51:39Z, card '[Ian] C1 next' (~/.claude/answered-for-ian.jsonl row: time 2026-10-22T17:51:39.230Z,
  session 19888854, tool_use_id toolu_01FJynZJVMUmmYsApy2wK7ax, `left: ian-kind`, so the hook left it and the answer is Ian's): "More Context
  cues (Recommended)" - new talk + run: add cue families from training misses, retrain, re-check the Source cut-off,
  then read the fresh 30 once for the real C1 number.
- Standing: "Keep it AI-free (Recommended)" (~06:23Z); "Approve these five (Recommended)" (~06:28Z, C1-C5);
  "$0, 2M token cap (Recommended)" (~06:35Z, done-when run).
- PM proxy, this talk (proxy decided, Ian may overturn): design A approved; the fresh 30 is read only after the dev
  gates pass, else the run stops with numbers and leaves it unread (most reversible: an unread set can still be read,
  a read one cannot be unread); template.html:402 stays out of this run as a look item for Ian; $0 and a 2M token cap.

## Evidence

Measured this talk (throwaway copies in the job's tmp folder; `data/done_when_strong.jsonl` excluded from every copy
and never opened; r1 = `data/done_when_strong_r1.jsonl`, seen dev data):

| Measure | Control retrain (rules unchanged) | + 5 spike cue families |
|---|---|---|
| r1 "No changes needed" (C1 on r1) | 14/30 | 19/30 (fixes 5, breaks 0) |
| C2 test / sim | 5/247 = 2.0% / 2/111 = 1.8% | 7/247 = 2.8% / 2/111 = 1.8% |
| C4 blanks | 0 of 862 | 0 of 862 |
| Grade accuracy, `eval.js rulefeat data/test.jsonl` (shipped: 0.856) | 0.859 | 0.859 |
| Training rows labeled Context=1 with zero Context hits | 99/532 | 80/532 |
| Strong training rows below the Source / Context sure cut-off | 42 / 49 of 253 | 42 / 32 of 253 |
| Sure cut-offs from `--tune-sure` | S .99 C .70 O .3 P .3 E .5 | S .99 C .635 O .3 P .3 E .5 |

What still blocks the 11 r1 misses after the spike cues: 5 have zero Context hits (Context 0.60, under 0.635);
4 have 2-6 Source hits but sit at Source 0.95-0.99, under the 0.99 cut-off; 1 grades weak (Source 0.54); 1 has
every letter sure but no label (likely the stacked-ask rule; not investigated).

Source cut-off sweep on the spike copy (sure cut-offs otherwise as tuned; in-sample on training, test/sim/r1 only
read, not used to pick): S .99 -> r1 19/30, test 7/247, sim 2/111, train false sure 2.4%; S .95 -> 23/30, 9/247 (3.6%),
2/111, 3.0%; S .80 -> 23/30, 9/247, 3/111, 3.1%. So lowering Source alone tops out at 23; the 5 zero-Context rows
are the rest of the gap.

Read, not re-measured: the predecessor's figures in the options note (all reproduced above except "Context detector
precision 0.54", which is not eval.js's figure: eval.js gives Context P 0.891 on test for the control retrain); a
retrain of unchanged code does not reproduce the shipped weights (thresholds C 0.3 vs shipped 0.575), so every
comparison in this work is against a control retrain, not the shipped file.

Disclosure: the 5 spike cue families were written from training misses by a session that had already looked at the
r1 misses. r1 numbers are dev numbers on a seen set and are quoted as such.

## Design (approach A)

Approaches weighed: cues only (r1 ceiling about 24 by the sweep above); more labeled training prompts (a row with no
rule hit gets only the intercept, so more data cannot separate it); a second-stage "sure" classifier over the five
probabilities (untested, larger change); a softer middle tier (needs Ian's ruling on wording; parked in the options
note). A: cues plus a Source re-tune is the one the probes support.

1. Small fixes from the done-when final review, each test first:
   - `tests/train.js:89`: `/}(s*)$/` becomes `/}(\s*)$/` (today it only works because weights.json has no trailing newline).
   - `tests/c5_gate.js`: a test file reporting `pass 0` and `fail 0` is a FAIL, not a PASS.
   - `tests/done_when.js --only` with an empty or unknown set exits 2 with a message, not 0.
   - `docs/evidence/2026-10-22-prompt-coach-done-when.md` line 36: FR3 and GEN29 are "not sure" misses, not Better-step
     changes; correct the sentence.
   - `prompt-coach/docs/research/2026-10-22-c1-options.md`: remove the stray tool-call text at its end.
2. Context cues in `engine/rules.js`, C list: keep the 5 spike families (renamed from `spike-*` to plain tags) and add
   families written from the training rows labeled Context=1 with zero Context hits (80 of 532 after the spike).
   Written as general patterns over phrasing (who it is for, what it feeds, the situation), never copied from a row;
   never written from test, sim, r1 or the fresh set. Each family carries a short comment naming the phrasing it covers.
3. Retrain: `node tests/train.js rulefeat --tune data/train_*.jsonl`, then `--tune-sure`. Re-check Source: the
   tune-sure search may change so it finds the cut-off set that keeps the most strong training rows sure under the same
   cap (it may consider lowering a letter, e.g. Source, as well as raising one). The cap (false sure <= 3% of non-strong
   training rows, out of fold) and the training-only file check stay as they are.
4. Dev gates, after one build round: r1 >= 27 of 30 (seen set), C2 <= 5% on test and on sim, C4 0 blanks, C5 suite
   passes with the expected changes below. At most one fix round (more cues from training misses, or the tune-sure
   search), then re-measure. Still failing: stop with numbers, the fresh set stays unread.
5. Only when every dev gate passes: one read of the fresh 30, `node tests/done_when.js --only C1` first, then
   `node tests/validate_done_when_sets.js` once right after it. That C1 number is final. It is reported as it comes
   out; no tuning after it, and a failure in either command never permits a second read.

### Expected test changes

- `engine/weights.json` is replaced by the retrain; README figures that quote it (sure cut-offs, eval accuracy, the
  "S 0.99, C 0.7 ..." line, build size) change in the same commit.
- `tests/c5_gate.js` fails unless eval is exactly 0.856. That check becomes: eval at or above 0.856 (the shipped
  figure; control and spike retrains measured 0.859). It is a floor: eval below 0.856 fails the gate, so a grading
  regression cannot pass. Proxy decided, Ian may overturn.
- Any other `c5_gate.js` / `rewrite_unit` / `pagetest` / `customer_check` change is unexpected and stops the task.

### Locked during the run

The data files (train, test, sim, r1, fresh set), `tests/done_when.js` bar logic, the 3% cap and the training-only
check in `train.js`, and the C1-C5 bars. The only edits to check scripts are step 1's three fixes plus the c5_gate
eval-floor change above.

## Success criteria (prediction, and the result that disproves it)

| # | Measure | Prediction | Bar | Disproved / failed by |
|---|---|---|---|---|
| D1 | Training Context=1 rows with zero Context hits | 80 -> 40 or fewer | progress number, not a bar | more than 60 |
| D2 | r1 "No changes needed" (seen dev set) | 25-28 of 30 | >= 27 to read the fresh set | 26 or fewer |
| C1 | fresh strong-30, read once | 24-27 of 30 (lower than r1: r1 was seen) | >= 27 | 26 or fewer |
| C2 | non-strong "No changes needed", test and sim | ~3.5% test, ~2% sim | <= 5% each | over 5% on either |
| C4 | [blanks] in Better or Strong | 0 | 0 | any |
| C5 | README test block via `c5_gate.js` | passes with the changes above; eval ~0.86 | passes | any other failure |

D2 is a gate on a seen set: it decides whether the fresh set is read, and a pass there does not predict C1.

Also reported, not a bar: weak prompts graded strong and left untouched without the label (probe3; control test
10/247, sim 15/111).

## Out of scope

- Any AI model or network call. The softer middle tier. A second-stage sure classifier.
- The grade rule, the stacked-ask rule and the SCOPE letters themselves (r1's one stacked-like miss stays).
- template.html:402 "[fill in your details]" under Strong: a look item for Ian with a PM first-pass note.
- `runs/2026-10-22-prompt-coach-done-when/` runtime files tracked on prompt-coach: listed for Ian, not removed here.
- C3 sandbox runs (still pending from the done-when work).

## Rules for the run

$0 (usage only), 2M token cap. Workiva data stays in the workiva repo; nothing to the brain or studio-harness (work
repo). The fresh set is never opened, copied or scored before step 5; `validate_done_when_sets.js` is not run before
step 5. Feature branch from `prompt-coach`; push and merge under the merge rule (Ian 2026-10-21, Workiva repos clear):
backup branch, full suite on the result, final review. merge-gate.mjs cannot run its suite here (no npm test; it
always ends `REFUSE suite`, memory merge-gate-no-npm-test): the lead runs the gate with `--dry-run` for its other
checks, runs `node tests/c5_gate.js` and `node tests/done_when.js --only C2,C4` on base and on a scratch merge, and
stops for Ian's merge yes with that evidence (his 13:24Z by-hand yes covered PR #2 only).
