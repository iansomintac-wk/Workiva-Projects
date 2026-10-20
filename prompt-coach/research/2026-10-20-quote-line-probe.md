# Reason line that quotes the prompt: span probe (talk 2026-10-20)

Question (Ian's ruling 2026-10-20, "Quote the prompt (Recommended)"): can the weak-prompt reason line quote the
prompt's own words for the ask (O) and the source (S), and how often would the quote sit on the wrong words?

Probe: `research/2026-10-20-quote-line-probe.js`, output `research/2026-10-20-quote-line-probe.tsv` (one row per
weak prompt, in-sample and out of fold). Read-only; reads `data/train_*.jsonl` and `research/live-tests/cases.json`;
no held-out or sealed file, no `data/test.jsonl`. One probe pass.

## Span rules tried

- Ask (O): the clause that starts at a vague verb (the coach's own `VAGUE_VERB` list) and runs to `. ; ? !` or a
  line break, at most 8 words then `...`. Strict: the verb opens a sentence (after please / can you / I need you
  to). Loose: anywhere.
- Source (S): the noun phrase after the main verb (`objectOf` in `engine/rewrite.js`, the one Strong already uses).
- A quote shows only for a letter the detector calls missing, and only when its probability is under a "sure" cut.
  By label, a quote is right when the label says that letter is missing, a misquote when the label says it is there.

## Out of fold is real here

The detector was retrained by `tests/train.js` on 4 of 5 folds (same split as the bare-analyze probe) with the
shipped thresholds. Checked: the fold detectors change at least one letter on 29 of 1,080 rows and 567 ask
weights; grade accuracy is 0.902 out of fold against 0.905 in-sample (measured 2026-10-20). The `rulefeat`
detector leans on hand rules, so it barely overfits, and the counts below barely move between the two.

## Counts (measured 2026-10-20; out of fold, sure cut p < 0.2 unless said)

| | in-sample | out of fold |
|---|---|---|
| Weak prompts (the reason line shows) | 430 | 432 |
| Detector says the ask is missing | 206 | 211 |
| ... a strict ask span is found (loose) | 56 (73) | 55 (72) |
| Ask quotes shown at p < 0.2 / wrong by label | 54 / 0 | 55 / 0 |
| Detector says the source is missing | 375 | 377 |
| ... a source span is found | 151 | 152 |
| Source quotes shown at p < 0.2 / wrong by label | 149 / 5 | 148 / 5 |
| Weak prompts with no quote at all (ask and source) | 240 | 243 |
| Weak prompts with no quote, ask only | 376 | 377 |
| Weak prompts labeled stacked / 2+ asks a rule can split | 40 / 13 | 41 / 13 |

The sure cut barely matters: at p < 0.1 the ask quotes drop to 51 and the source quotes to 148 (out of fold).

Of the 54 in-sample ask quotes, 39 sit on prompts whose line already quotes the vague verb today ('A verb like
"review" ...'); 15 prompts get a quote for the first time.

## Read by eye (the label check cannot see a quote on the wrong words)

- Ask, all 55 out-of-fold quotes: 4 are wrong words (7%), all the same kind: a template-shaped prompt whose
  "Evaluate:" field label is taken for the ask ("Evaluate: carefully" in `train_hard:152`, `:164`, `:172`,
  `:187`). Two more are right but clumsy, running past a comma ("Analyze the Wdata query 'Emissions_FY25' for
  executives, keep..."). Skipping a verb followed by a colon removes exactly those 4 and leaves the other 51
  quotes unchanged (checked 2026-10-20 on the probe's rows, the rule applied to the 55 quoted prompts; not a
  second full pass).
- Source, 17 quotes in a 20-line random sample (seed 7): 12 are wrong words (71%). The rule grabs what to produce,
  not what to read ("MD&A" in "draft MD&A", "control description", "150-word transition plan summary"), or junk
  ("it over" from "Check it over", "where" from "find where"). The label check missed these because those rows
  really do lack a source. The source rule fails.
- Stacked, the 13 splits: every clause is a real ask; 6 of the 13 miss a third ask joined by "and" ("write the
  board memo and fix the charts"). The page already shows a stacked note ("You are asking for several things at
  once...").

## Cross-check from a parallel session (read, not measured here)

A duplicate talk session (job 92f303c6, stopped tonight in favor of this one) ran a looser ask rule: any
sentence with a vague verb, verb to sentence end, up to 10 words, else a one-sentence prompt of 10 words or
fewer. It reported the same out-of-fold weak count (432), 172 ask quotes with 22 wrong by label (12.8%, over the
10% drop line), and 0 stacked prompts with two quotable asks. Its source rule (our/my/the + data noun) was not
read by eye. Its files were left uncommitted in the `prompt-coach-quote-line` worktree. This supports the strict
sentence-opening rule; the looser the rule, the more it misquotes.

## What this means

- An ask quote is safe (0 wrong by label, 4 of 55 by eye) but reaches 55 of 432 weak prompts, and it fires only
  where the detector already says the ask is missing, so it fixes none of the 147 wrong lines in the reason-line
  probe; those are detector errors on which letter is missing.
- A source quote is not safe with any simple rule tried here.
- Live tests: 0 of 13 grade weak, so the line would not show on any of them.

## Published work

Carried from `research/2026-10-20-reason-line-probe.md` (not re-read this session): specific feedback helps in
tutoring (Wisniewski, Zierer & Hattie 2020, high-information feedback d = 0.99, k = 42; R there). Counter-evidence:
Hoang & Storch (2024), EFL learners took up generic feedback more than specific (search snippet only, not
confirmed); Chen et al. (2024), a prompt coach made users add detail without a better user experience (helper read
the page; does not say whether its feedback was generic or specific). Nothing found on quoting the user's own words
in a prompt-writing coach.
