# Fit Finder fair test: evidence

Written 2026-10-18 (due 2026-10-19 14:00Z) on branch `fit-finder-fair-test`. Spec:
`docs/superpowers/specs/2026-10-18-fit-finder-fair-test-design.md`. Plan:
`docs/superpowers/plans/2026-10-18-fit-finder-fair-test.md`.

Labels used below. **measured now** means I ran the command in the step 2 run (output saved at
`.ledger/2026-10-18-fit-finder-fair-test/step2.log`, called L/step2.log) while writing this
document. **read** means copied from a file the run wrote earlier, with its source; I did not
re-run it. L is `.ledger/2026-10-18-fit-finder-fair-test`. No prompt text from any set is quoted
here; only ids and counts.

Result in one line: on the untouched half, wrong card 5 of 42 fitting rows against a bar of 5.
That is a pass, exactly at the bar. One more wrong card would have failed it.

## 1. What was tested, and what was not

- Tested: whether the Fit Finder's first-card rules, tuned on one half of a new set of 100
  prompts, still pick the right card on the other half, which was sealed and scored once.
- The prompts were written by one Opus helper and labelled by a second, separate Opus helper that
  never saw the engine or its match words. Neither saw real customer prompts. (read: L/progress.md,
  rows T4.2 and T5.2.)
- Not tested: real customer prompts. A pass here says the rules carry over to new model-written
  asks, not to customers. The real-set check stays Ian's.
- Not done: the live page was not republished (Ian's). Nothing was spent beyond usage.

## 2. The set

| Item | Value | Source |
|---|---|---|
| Rows written | 104 (ids N1 to N104) | read: L/progress.md, T4.2 |
| Dropped by the dedupe check (D) | 4: N8, N10, N16 (shared a 5-word run with a reference set) and N95 (shared one with another new row) | read: L/progress.md, "Task 4 (steps 3-8)" |
| Kept (K) | 100 (exactly the floor of 100) | read: same |
| Split | seed 20261018, 50 tuning, 50 untouched (the plan's "MOVED 5" is 5 files moved to the sealed folder, not rows) | read: L/progress.md, T6 row |
| Fitting rows (F) | tuning half 35; untouched half 42; both 77 | read: L/progress.md (T5 line F 77; pre-tune and untouched lines) |
| Label mix, all 100 | fit good 71, partial 6, not 23 | read: L/progress.md, "Task 5 steps 3-5" |
| Low-confidence labels | `conf: low` on 37 of 100 | read: same |
| Fit rows with no card in the gold | 16: 6 of the 35 tuning fit rows, 10 of the 42 untouched fit rows | read: L/progress.md, T5 lead re-run; the 6/10 split read from the lead's count of the gold files (reviews/merged-final.md). By design: the labeller marked these as a fit but named no catalogue card. Under the scorer a card shown on one of them counts as wrong, and no card counts as right. |
| First gold card by area (all 100) | general (gen) 31, financial reporting (fr) 11, sustainability (sus) 10, governance, risk and compliance (grc) 9, no card 39 | read: lead's count of the gold files, reviews/merged-final.md |

The set is not the mix the brief aimed for: the brief targeted about a fifth financial reporting
and the first gold card is financial reporting on 11 of 100 (read, above), with general cards on 31.
Both halves were drawn by the same random split, but they differ in the two places that matter
for the second "disproved if" test (section 5): not-a-fit rows are 15 in the tuning half against 8
in the untouched half, and fit rows with no gold card are 6 of 35 against 10 of 42.

Note on the labeller: it said it read "it recurs" loosely, treating each prompt as one instance of
a recurring task. N55 and N58 were marked partial (N55 by the ranking rule, N58 for its judgement
core). The 37 low-confidence labels show how soft some labels are.

The blind check: the lead searched the writer's and labeller's tool-call inputs for engine, data,
tests, catalogue, real, card-gold and LABELING. Hits were 0 and 0, and the same search on the
lead's own files gave 5 and 6, so the search can find things. (read: L/progress.md, T5.2 row.)
The same kind of search on the tune helper's tool-call inputs (lead, measured 2026-10-18, read
from L/progress.md T10 lead row): `data/real` mentioned 0 times (control: the helper's tuning file,
4 times) and no other `data/` path.

## 3. Scores and the bar

All three lines are the `synth-score.js` format. The first two are read from
L/tune-pre.txt and L/tune-post.txt. The third is copied verbatim from `fit-finder/README.md`
line 262, which equals the sealed score file (the lead compared them, L/progress.md T9 re-run).

- Pre-tune, tuning half (read, L/tune-pre.txt):
  `first card right: 19 of 35 that fit; wrong card 5 (N14,N15,N27,N60,N69); no card where one fits 11 (N5,N7,N9,N20,N29,N35,N40,N66,N70,N72,N83); card on a not-a-fit prompt 0 (); fit agreement 16 of 50; score 21`
- Post-tune, tuning half (read, L/tune-post.txt):
  `first card right: 23 of 35 that fit; wrong card 4 (N14,N15,N60,N69); no card where one fits 8 (N5,N7,N9,N29,N35,N40,N70,N83); card on a not-a-fit prompt 0 (); fit agreement 16 of 50; score 16`
- Untouched half, scored once after the rules were locked (read, verbatim from README):
  `first card right: 25 of 42 that fit; wrong card 5 (N42,N48,N53,N56,N91); no card where one fits 12 (N17,N18,N24,N52,N63,N77,N79,N88,N93,N99,N100,N102); card on a not-a-fit prompt 1 (N34); fit agreement 19 of 50; score 24`

Pass bar: wrong card at most floor(3F/23). With F = 42, 3 x 42 / 23 = 5.48, floor 5 (measured
now, node arithmetic). Wrong card is 5.

**Result: PASS, at the bar.** One more wrong card would have failed. The 5 wrong cards are N42,
N48, N53, N56, N91, and a card was also shown on one not-a-fit prompt (N34), which the bar does
not count but the score does.

**What "first card right" counts.** Right = fits - wrong - missed (the scorer's definition, equal to
the suite's fresh line, proven equal in plan Task 1). A fit row whose gold has no card therefore
counts as right when no card is shown. So "right" includes correct silences.

**Card-hit-only view** (a card shown and in the gold; fit rows with no gold card left out):

- Tuning half, measured now: 14 of 29 fit rows with a gold card before the tune, 17 of 29 after
  (6 of the 35 tuning fit rows have no gold card). Command: the node script
  `.ledger/2026-10-18-fit-finder-fair-test/hits.cjs` (ledger, not committed), run on the tuning
  prompt and tuning gold files only: `node .ledger/2026-10-18-fit-finder-fair-test/hits.cjs
  <abs root> fit-finder/data/synth/2026-10-18-tune.jsonl fit-finder/data/card-gold-synth-tune.jsonl`
  with `<abs root>` the absolute path of `fit-finder` at HEAD for after (prints cardHits 17), and
  for before a directory holding `engine/fit.js` and `data/catalogue.json` from
  `git show aea7461:fit-finder/...` (prints cardHits 14). (The reviewer's figure of 14 to 17 of 35 uses 35 as the denominator; same hits.)
- Untouched half, not re-scored: 32 of 42 fit rows have a gold card and 10 do not (read: lead's
  count of the gold files). The single score line gives right 25, so card hits are between 15 and
  20 (25 minus at most 10 correct silences). The read-only Codex review re-ran the committed copy
  and reports 15 (35.7% of 42; 15 of 32 card rows): read from the reviewer, not measured by the run.

**Bar sensitivity.** By the spec's definition F is all fitting rows (42): bar floor(3 x 42 / 23) = 5,
and 5 wrong passes at the bar. If F counted only fit rows with a gold card (32), the bar would be
floor(3 x 32 / 23) = 4 (node arithmetic, measured now) and 5 wrong would fail. The verdict stays
the spec's. Which reading counts is Ian's (section 8).

Fit agreement in plain words: the engine's fit rating matched the gold fit label on 16 of 50
tuning rows both before and after the tune, and on 19 of 50 untouched rows. The tune did not move
it, and it is low on both halves.

One more fact to hold against the pass: the bar is a count, and about 42 fits means a single card
moves the rate by about 2 to 3 points. I did not compute a confidence interval.

## 4. The pins (measured now)

Command (step 2), run from `fit-finder/` (first at HEAD 0b0707f, re-run for the review fixes at
HEAD 95835d6; same figures both times; output of the re-run in L/step2-fixes.log), guard compared
with BASE `aea74611bf1cec86aae2a58c7f5cb12102418f25` and `--lock-base HEAD`:

```
node tests/catalogue.test.js | grep "first card right"
node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A | grep "^fit agreement"
node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B | grep "^fit agreement"
node tests/fair-guard.js --base <BASE> --lock-base HEAD ; echo "exit $?"
```

| Pin | Required | Measured now | Held |
|---|---|---|---|
| held-out B | right >= 13, wrong <= 3 | right 13 of 30; wrong 3 (67,74,91) | yes, at both |
| half A | right >= 12, wrong <= 0 | right 12 of 29; wrong 0 | yes, at both |
| real 19 | right >= 15, wrong <= 2 | right 15 of 19; wrong 2 (W1,S1) | yes, at both |
| fresh 29 | right >= 15, wrong <= 5, card on a not-a-fit <= 1, fit agreement >= 12 of 29 | right 15 of 23; wrong 5 (G2,G14,G15,G22,X1); not-a-fit card 1 (G5); fit agreement 12 of 29 | yes, at all four |
| eval A | >= 52 of 60 | 52/60 = 86.7% | yes, at the pin |
| eval B | >= 45 of 60 | 45/60 = 75.0% | yes, at the pin |
| fair-guard | PASS, exit 0 | `fair-guard PASS`, `exit 0` | yes |

The guard's PASS used `--lock-base HEAD`, which compares the locked paths with the current commit,
so it does not by itself show "unchanged since BASE". That is shown by `git diff aea7461 HEAD --
fit-finder/tests fit-finder/data` (measured now): it lists only the catalogue match line and the
two holdout files (`card-gold-synth-holdout.jsonl`, `synth/2026-10-18-holdout.jsonl`), which the
split added.

The pins (read: spec, "Scoring script and guard") were the pre-tune figures, so "held" means
"no worse than before", and every one sits exactly on its pin. The tuning moved none of them in
either direction. (Pre-tune values read from L/progress.md, "Talk" 20:02Z line; they match.)

## 5. The prediction against the result

Written before any new prompt existed (spec, "Prediction").

| Predicted | Result | Read |
|---|---|---|
| Pre-tune tuning half: right 40-65% of fits | 19 of 35 = 54.3% | inside |
| Pre-tune tuning half: wrong 10-25% of fits | 5 of 35 = 14.3% | inside |
| Untouched half after tuning: wrong 3 to 5 per 23 fits | 5 of 42 = 2.74 per 23 | a little better than predicted, below the range |
| Untouched half: right 50-70% | 25 of 42 = 59.5% (right as defined in section 3, correct silences included) | inside |
| Same, card hits only | 15 of 42 = 35.7% (read from the Codex re-run, not measured by the run) | outside (below 50%) |
| About an even chance of passing | passed, at the bar | consistent |

(Rates are measured now by node arithmetic from the read lines in section 3.) The prediction is
inside under the spec's definition of right and outside under the card-hit-only reading.

Against the rate the README already held for the real fresh set (the 12-of-23 done-when, 52.2%,
node arithmetic), the untouched half's right rate is 25 of 42 = 59.5%, a little higher. The two
sets and the labellers differ, so this is a reference point, not a like-for-like comparison.

### The two "disproved if" tests

Improvement is post minus pre-tune rate. The untouched half has no pre-tune score of its own; its
"before" is the tuning half's pre-tune rate, per the spec. The halves are not the same mix: the
split is random, but not-a-fit rows are 15 against 8 and fit rows with no gold card 6 of 35
against 10 of 42, so this test rests on halves that differ there.

1. Untouched wrong above 6 per 23? Result 2.74 per 23 (5 of 42). Not disproved.
2. Untouched half improves as much as or more than the tuning half?

| Measure | Tuning half: pre-tune -> post | Tuning improvement | Untouched: post | Untouched improvement (post minus tuning pre-tune rate) |
|---|---|---|---|---|
| Right, % of fits | 54.3 -> 65.7 | +11.4 points | 59.5 | +5.2 points |
| Wrong, % of fits | 14.3 -> 11.4 | -2.9 points | 11.9 | -2.4 points |

On right the untouched half improved less than half as much (+5.2 against +11.4). On wrong it
improved by 2.4 points against 2.9: smaller, but the gap is under one card. So the test is not
disproved on either measure, but only the right-card gap is a clear one. The wrong-card
comparison cannot tell the difference between "the rules generalised partly" and "the untouched
half was easier than the tuning half to begin with", because there is no pre-tune score on the
untouched half. The spec's prediction that the untouched half improves less holds on right and
is a near-tie on wrong. The plan flagged a cheap fix (score the untouched half a second time
with BASE's engine) and did not take it, because the spec says once; see section 9.

## 6. Kept rules, attempts, audit

Source: L/tune/results.tsv and L/progress.md (read).

- Attempts used: 5 of 12. Tool uses by the tune helper: 21 tool-call inputs in its transcript
  against a cap of 90. Total time well inside the 3-hour cap (the helper's two rounds took 1m54s
  and 0m37s by the notification).
- Kept, in order: `5604d6b` (rewrite-family words in `fit.js` plus a change to the gen-rewrite
  match; right 21, wrong 6, score 20) and `6ae0943` (the gen-rewrite match drops the word
  paragraph, and no card when the only job is drafting an email; right 23, wrong 4, score 16).
  The first keep raised tuning wrong from 5 to 6 before the second brought it to 4. Both touched
  only `fit-finder/engine/fit.js` and the `match` fields of `catalogue.json`.
- Net change from BASE (read: `git diff aea7461 HEAD -- fit-finder/engine fit-finder/data/catalogue.json`):
  the gen-rewrite match gained proofread, bullet, capitali[sz]e, synonym(s) and "better word";
  `fit.js` gained REWRITE words (capitali[sz]e, synonyms, better/different/another/simpler
  word|phrase|term, and "turn ... into paragraphs/bullets/table/list/summary/prose/sentences")
  and the no-card rule for an ask whose only operation is DRAFT and that mentions e-mail.
  "paragraph" was added by 5604d6b and removed again by 6ae0943; BASE never had it.
- Discarded: `727dd68` and `1193efd` (the catalogue edit did not apply because of escaping, no
  effect, score stayed 21).
- Dropped by the lead: `cb71c14`. It reached score 16 but one added alternative in the email
  rule was longer than 3 words, and the plan allows no waiver. The helper was resumed, rebuilt the
  fix without a long alternative (attempt 5), and reached the same score 16.
- Transcript audit (lead, after tuning): tool-call inputs scanned 21, tool results scanned 21,
  hits on the sealed-folder names 0 (exit 0).
- Engine purity (added lines have no `require`, `process`, `argv`, `fs`, `readFile`, `import`,
  `fetch`, storage, clock, URL or new-prompt id): 0 hits.
- Memorisation (added lines, regex syntax turned into spaces): 0 shared 4-word runs with a tuning
  prompt, 0 added alternatives over 3 words.
- Untouched-half hash: sha256 matched the one recorded at the split, "OK OK" for both files, and
  the hash is from the T9 rows; the verify-sealed scan (found 0 holdout rows elsewhere, control 50 of 50)
  is from the T6 row (read: L/progress.md).
- Last engine commit `5616b3a`, before the scoring commit `0b0707f`: no rule change after the
  untouched half was scored (read: T9 lead re-run, ORDER-OK; I did not re-run `git log`).

## 7. Limits (from the spec, "Limits, said plainly")

- The set is model-written and model-labelled; the writer and labeler are the same model family as
  the one that wrote `tasks.jsonl`. A pass says the rules generalise to new model-written asks, not
  to customers. The real-set check stays Ian's, later.
- About 50 rows per half and about 37 fits: one wrong card moves the rate by about 3 points.
- One writer, one labeler, one run.

Added in this run, from the measured numbers: 37 of 100 labels are `conf: low`, 16 fit rows have
no card in the gold, and the labeller read "it recurs" loosely. All three loosen the ground truth
the bar is measured against. The wrong-card count of 5 was also reached on a half where 12 fits
got no card; the engine may pass partly by staying silent (assumed; the gold has no way to test it).

## 8. What is Ian's

- Republishing the live page. The rebuilt page (83016 bytes, read from the README; 72 page checks,
  0 failed, read from L/progress.md T8) is committed in `5616b3a`, but not published. Ruled
  2026-10-19: "Not yet (Recommended)": republish only after a pass on a second untouched real set.
- Merging: ruled 2026-10-19: "Merge, safe way (Recommended)". The branch was merged into
  prompt-coach as `a96a1f1` and pushed; the target's old tip is kept at
  `backup/prompt-coach-before-fit-finder-fair-test-2026-10-19` (`79cd855`). Suite measured on the
  target 8 of 8 exit 0, on the merge 10 of 10 (fair-guard locked to the branch tip, `c5ff55c`).
- Ledger records: ruled 2026-10-19: "Yes, all three (Recommended)": the guard pathspec defect,
  the Bash backslash gotcha and the 1.7M cap ruling are ratified in studio-harness (`27b3f0a`).
- The real-set check: the bar on a second untouched real set, which this round does not replace.
- Whether a pass at the bar, on model-written prompts, is enough to publish. That is a judgement
  about risk, not a measurement.
- The token cap ruling: the run used up its 1.3M helper token cap at the Task 9 checker, and Ian
  raised it to 1.7M (read: L/progress.md, 22:06Z). Task 10 and the reviews ran under that ruling.
- Which bar reading counts for Monday: F as all fitting rows (42, bar 5, pass at the bar) or as fit
  rows with a gold card (32, bar 4, fail). Section 3. Ruled 2026-10-18 22:46Z: "All 42 count
  (Recommended)", so the verdict is pass at the bar, with the 32-row fail reported beside it.
- The e-mail rule (Opus S1, not fixed because the engine is locked after the scoring):
  `fit-finder/engine/fit.js` line 134 returns no card for any ask whose only operation is DRAFT and
  that mentions e-mail. At least five DRAFT-only cards exist (8-K, test steps, findings, new
  controls, remediation), so such asks lose a fitting card and no pin catches it. Ruled 2026-10-19
  00:19Z: "Leave it, fix with fresh set (Recommended)": no engine change now; a fix comes only with
  a fresh unscored set.
- Reviews: the Opus final-reviewer and a read-only Codex review ran (plan Task 10 steps 4 and 5);
  their findings are fixed in this document and the README except the two items above, which are
  Ian's. Reviews: L/reviews/opus-final-review.md, L/reviews/codex-final-review.log,
  L/reviews/merged-final.md.

## 9. Process notes and plan-level fixes found in the run

- The plan rebuilds the dist (Task 8) before scoring the untouched half (Task 9); the spec lists
  the order the other way. The order is harmless because the rules were locked either way.
- The untouched half's pre-tune score was not measured. Its "before" is the tuning half's
  pre-tune rate, which is why section 5's second test is only partly checkable. The plan's
  reviews noted that scoring it once more with BASE's engine would fix that and was not taken, as
  the spec says once.
- Fair-guard locked-path bug: the first version's locked-files check used pathspecs relative to
  `fit-finder/`, so it checked nothing. Guard red test 2 was not red; this was caught by the
  implementer and fixed in `0184eef` (root-relative pathspecs); 6 of 6 red tests were red after.
- `cb71c14` was dropped for a long alternative in the email rule (section 6); the plan's rule
  had no waiver, so the lead reset to `5604d6b` and resumed the helper.
- README elisions: Task 8 found two 5-word runs in the README that were already there and were
  shared with real prompts (both ordinary reporting phrases). They were elided with "..." in the
  amended commit `5616b3a`. No claim changed (checker's reading), and the near-copy check of the
  README against the real set is 0. This is a pre-existing overlap the earlier README had,
  flagged for Ian.
- Two tune attempts (727dd68, 1193efd) failed on escaping in the catalogue edit. Separately, the lead measured that this machine's Bash tool turns two backslashes into one in command text (plan line 27), and the plan now says code files go through the Write tool only (I did not test whether that caused the two failures). Proposed for the ledger.
- Plan expectations that were off: Task 2's lead packet said line 1 exits 0 (the plan's exit 1 was
  right); Task 3 step 6 expected exit 0 where `grep -v` of nothing exits 1 under pipefail (the
  count 0 was the evidence).
- This document's own check: `nearcopy.cjs` with N=5 against `fit-finder/data/real`, over the README and this document (measured now, after the review fixes): last line measured: `real grams 2729 lines with a shared run of 5 words: 0`. Command: `N=5 node .ledger/2026-10-18-fit-finder-fair-test/nearcopy.cjs fit-finder/data/real fit-finder/README.md docs/evidence/2026-10-19-fit-finder-fair-test.md | tail -1`, run from the worktree root; its last line must end in ": 0". The document quotes no prompt text.
