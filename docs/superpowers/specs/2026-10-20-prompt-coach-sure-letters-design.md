# Prompt coach: weak headline names only sure letters (design, PARKED)

Status: **parked**, not built. Talk session a42b31bc, 2026-10-21 (UTC; talk dated 2026-10-20 locally).
Talk prompt: `docs/PROMPT_COACH_SURE_LETTERS_TALK_PROMPT.txt` (on the quote-line worktree).

## Ruling (verbatim)

Ian, 2026-10-21T01:27Z, typed selection on the card "Showing only the letters the coach is sure of makes the
weak headline worse (105 wrong becomes 110), because the coach is most confident exactly when it's wrong. What
should happen to this idea?" (Park (Recommended) / Build at p < 0.2 anyway / Narrower: source letter only /
New talk: fix the labels): **"New talk: fix the labels"**. Recorded in
`.ledger/2026-10-20-prompt-coach-reason-line/rulings.md`.

## Target

The visible weak headline on Your prompt: `The AI would have to guess <what to read> and <the one thing you want
back>.` (plus the shipped ask quote). Not `stages.weak.verdict`, which no tab shows (read: quote-line evidence).

## Design as it would have been built

- Wording per case: both letters sure -> today's text; one sure -> `The AI would have to guess what to read.` or
  `... the one thing you want back.`; the ask quote unchanged (it already needs p(O) < 0.2).
- Fallback, no letter sure: `Check it says what to read and the one thing you want back.` (advice, no claim).
- No-go: never name a letter with p >= 0.2; never say the coach is sure.
- Check that proves it wrong, stated before measuring: out-of-fold headline check on the training rows; drop if
  more than 105 of 432 weak headlines are wrong (no net rise).

## Evidence (measured 2026-10-20 by `prompt-coach/research/2026-10-20-sure-letters-probe.js`)

- Headline wrong now: 102 of 430 in-sample, 105 of 432 out of fold.
- At p < 0.2 out of fold: 110 wrong; 7 false letters removed, 13 correct letters dropped, 7 headlines name none.
  The drop rule would fire. p < 0.1: 122. S-only cut: 1 removed, 4 dropped.
- 33 of 46 false letters out of fold are named at p < 0.1: the detector's errors are confident, so no cut
  separates them.
- By eye (20 changed rows): the 0.2-0.3 band of the ask is where training labels contradict each other.

Read, not measured here: the 147-of-430 reason-line figure and the shipped quote-line numbers.

## Why parked, and what replaces it

A cut on the detector's confidence cannot fix confident errors. The next talk looks at the cause Ian picked:
training labels that disagree on near-identical prompts. Prompt: `docs/PROMPT_COACH_LABEL_FIX_TALK_PROMPT.txt`.
