# Sure letters in the weak headline: probe (talk 2026-10-20)

Question (talk prompt `docs/PROMPT_COACH_SURE_LETTERS_TALK_PROMPT.txt`): if the weak headline named only the
letters the detector is sure are missing, how many wrong headlines go away, how many right ones lose a letter, and
how many name no letter at all?

Probe: `research/2026-10-20-sure-letters-probe.js`, output `research/2026-10-20-sure-letters-probe.tsv` (run time
36 s). Read-only; reads `data/train_*.jsonl` only; no held-out or sealed file, no `data/test.jsonl`. Out of fold =
the detector retrained by `tests/train.js` on 4 of 5 folds, the same split as the quote-line probe, shipped
thresholds (S 0.625, O 0.3).

Target restated (per the quote-line run): the visible weak headline, "The AI would have to guess <what to read>
and <the one thing you want back>." It speaks only about S and O. A named letter is **false** when the label says
the prompt has it; the headline is **silent** on a letter the label says is missing and it does not name.
Wrong = either. Sure rule: name letter k only when the detector calls it missing and p[k] < cut.

## Counts (all measured 2026-10-20 by this probe)

| | in-sample | out of fold |
|---|---|---|
| Graded weak | 430 | 432 |
| Headline wrong now | **102** | **105** |
| of them naming a letter the prompt has (false) | 41 | 45 |
| of them silent on a missing S or O | 63 | 62 |

Correction: the talk prompt's 147 of 430 was the hidden reason line (all five letters). The visible headline is
wrong for 102 of 430 in-sample, 105 of 432 out of fold.

Sure cuts, out of fold (432 weak):

| cut | wrong | false lines | silent lines | wrong lines fixed | right lines that lose a correct letter | correct letters dropped | false letters dropped | name no letter |
|---|---|---|---|---|---|---|---|---|
| shipped | 105 | 45 | 62 | - | - | - | - | 0 |
| p < 0.3 | 105 | 44 | 63 | 1 | 1 | 2 | 1 | 2 |
| **p < 0.2** | **110** | 38 | 74 | 6 | 11 | 13 | 7 | 7 |
| p < 0.1 | 122 | 32 | 92 | 12 | 29 | 31 | 13 | 12 |

In-sample the same shape: p < 0.2 gives 111 wrong (4 fixed, 13 right lines lose a letter, 6 name none).

Why it fails: the detector is sure when it is wrong. Of the 46 false letters out of fold, 33 are named with
p < 0.1 (18 under 0.05) and only 7 at p >= 0.2. Per letter at p < 0.2: S removes 1 false and drops 4 correct;
O removes 6 false and drops 9 correct. No cut on either letter removes more false letters than correct ones.

## The 20 changed headlines at p < 0.2, out of fold, read by eye (Opus, this session)

- Lose a false letter (7): `train_fr:230` "can you look at cell F12" (the talk's test case: pS 0.46, now
  names only the ask); `fr:77` "write a footnote"; `fr:188` "map these to the taxonomy"; `fr:212` tie-out
  procedures; `sus:189` "Find duplicates"; `grc:67` and `fr:112`, which then name no letter.
- Lose a correct letter, line was right (11): `fr:135` "compare to last year", `fr:138` "benchmark our
  disclosures", `grc:49` "Find outliers.", `grc:188` "map to COSO", `grc:198` "Map controls to frameworks",
  `sus:164` "Write questions for the auditor", `fr:245` "format the attached deck", `sus:141` Wdata query,
  `sus:252` "Thoughts on the deck?", `hard:191`, `hard:196` "give me your take".
- Lose a correct letter, line was already wrong (2): `grc:204` "map this to the framework" keeps its false S
  (p 0.01) and drops the correct O; `hard:300` (three stacked asks) drops its correct S and names none.
- What the eye adds: the O band 0.2-0.3 is where the labels themselves disagree. "Find duplicates" is labelled
  as having an ask and "Find outliers." as lacking one; "map these to the taxonomy" has one, "map to COSO" lacks
  one. The cut trades one side of that noise for the other. By eye it is a wash at best (assumed; settled by
  relabelling those rows, which is not this talk's job).

## Limits

- Labels are the training labels; some are inconsistent (above). Out of fold is the closer guide to new prompts.
- Training rows carry no files, so the "You attached ..." headline is not exercised.
- No live or sandbox prompt was run; all 13 live-test prompts grade better than weak (read, reason-line probe).
