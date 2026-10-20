# Reason line under a weak prompt: probe (talk 2026-10-20)

Question (README "Still open"): the reason line for weak prompts is generic. How often is it wrong for the
prompt it sits under, and is it worth changing?

Probe: `research/2026-10-20-reason-line-probe.js`, output `research/2026-10-20-reason-line-probe.tsv`.
Read-only; reads `data/train_*.jsonl` and `research/live-tests/cases.json`; no held-out or sealed file, no
`data/test.jsonl`. It runs `coach()` with the page's own detector and classifier (as `web/template.html` does)
and checks each letter the line names against the row's SCOPE label.

## Counts (measured 2026-10-20)

| | rows |
|---|---|
| Training prompts | 1,080 |
| Graded weak by the coach (the reason line shows) | 430 |
| Line says the prompt lacks something its label says it has (HAS) | 89 |
| Label says the source or the ask is missing and the line is silent (MISSED) | 63 (61 of them the ask, O) |
| Either of the two (the line is wrong for the prompt) | **147 of 430 (34%)** |
| Line matches the label exactly | 262 |
| Weak prompts with several asks stacked; the line never says so | 40 |
| Distinct lines across the 430 | 56; 36 once the quoted verb is blanked |
| The two commonest lines | 104 and 91 prompts (45% together) |
| Lines that quote any of the prompt's own words | 56 (only the vague verb, e.g. "review") |
| Live-test prompts graded weak | 0 of 13 (all grade better) |

HAS by letter: who it is for 33, the ask 28, format 17, source 14, invented-facts rule 10 (a row can count twice).

## Examples (spot-checked by reading, 9 rows)

- `train_hard:135` "...in a concise board-ready bullet format: help with the 10-K." Line: "The AI has to guess what
  to read." The real gap, "help with" is no ask, is not named.
- `train_hard:258` "frm the scope 2 tab which sites up more than 20% yoy table pls". Line says the AI has to guess
  the one thing you want back; the prompt names it.
- `train_grc:86` "Draft an email to control owners reminding them about Q4 evidence". Line says it is missing who it
  is for and a format; both are there (control owners, an email).
- `train_grc:136` "How does our access review process compare to best practice?" Line names only the source; the
  vague ask is not named.
- Debatable by the labeling rules (I would not count them against the line): `train_sus:252` "Thoughts on the
  deck?" (label S = 0), `train_grc:195` "please map these" (label S = 1), `train_hard:202` (label C = 1 from "Our
  auditors start Monday"). About a third of the 9 spot-checks were of this kind, so the true wrong count is likely
  nearer 100 than 147 (assumed; settled by reading all 147 rows).

## Limits

- In-sample: the detector was trained on these same rows, so its misses here are fewer than on new prompts.
- The labels are the training labels; a few are arguable (above).
- The line is driven by the detector. Most errors are detector errors that the line repeats; a reworded template
  would repeat them too. Only a line built from the prompt's words can show the user what the coach read.

## Published work

Lookup by a Haiku helper (low cost, $0), 2026-10-20. R = I re-read the figure on the source page myself; C = the
helper read the page; S = search snippet or secondary source only.

- Wisniewski, Zierer & Hattie (2020), "The Power of Feedback Revisited", Frontiers in Psychology,
  doi 10.3389/fpsyg.2019.03087. R: 435 studies, d = 0.48 overall; high-information feedback d = 0.99 (k = 42);
  "Feedback is more effective the more information it contains."
- Olivera-Aguilar et al. (2022), "Comparing the Effect of Contextualized Versus Generic Automated Feedback on
  Students' Scientific Argumentation", ETS RR-22-03. R: 365 students; contextualized feedback was associated with
  higher final scores, depending on revisions made, initial score and gender. No effect size given.
- Chen, Lee, Jang & Sundar (2024), "Is Your Prompt Detailed Enough?", TAS 2024, N = 132, a text-to-image prompt
  coach. C: users added more detail; user experience did not improve significantly. The page does not say whether
  the feedback was generic or prompt-specific.
- Hoang & Storch (2024), IJLTR 12(1), EFL learners using Criterion: generic feedback got more uptake than specific.
  S only; a small multiple-case study. Counter-evidence; not confirmed.
- Shute (2008), "Focus on Formative Feedback", Review of Educational Research 78(1): specific feedback is one of her
  design qualities. S only.
- Hattie & Timperley (2007), Review of Educational Research 77(1). S only; not read.

Not found: any study comparing generic and prompt-specific reason lines in a prompt-writing coach. That the coach's
line behaves like the tutoring studies is assumed.
