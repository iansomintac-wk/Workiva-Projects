# Prompt coach: one scoring rulebook, then a tricky live batch

Talk session "NEW - Prompt Coach next talk", 2026-10-18. Ledger: `.ledger/2026-10-18-prompt-coach-next/progress.md`.
Follows the live test (`prompt-coach/research/live-tests/results/2026-10-18-live-test-results.md`).

## Ian's rulings (verbatim picks, AskUserQuestion, 2026-10-18)

1. ~20:00Z, to PM proxy 3: "Tricky batch after run 12 (Rec.)" (option: about 6 deliberately hard prompts, messy, very
   short, off-topic, mixed, run live; check how often the coach's own rating agrees with how good the live answer was).
2. ~19:58Z, his question: "The prompt coach has access to Workiva AI so can't you just do more simulations to stress
   test it so it can get as close as possible it would be as if a ai model were called?" Answered in the talk: the coach
   is offline and never calls Workiva AI; live runs in his sandbox are the simulations; this batch is one.
3. (time not recorded; between 21:17Z and 00:19Z): "Fix scoring, then batch (Rec.)".
4. (time not recorded; before 00:19Z): "One rulebook for both (Rec.)".
5. (time not recorded; before 00:19Z): "Prompt + coach rewrite (Rec.)" (each tricky prompt run as typed and as the coach's Strong rewrite, 2 runs
   each; at least 2 of 6 must be rated weak or re-pick before running).

## Evidence

Measured in the talk:
- E1-8 = "Internal carbon pricing" (Reg. 2023/2772, ESRS E1 para 62), read from the EUR-Lex OJ PDF with pdftotext. The
  SUS-4 key stands; no re-score for the key.
- Why the scorers split: of 72 rows, 60 differ (57 in the files' "vs Codex" column, 3 of 6 FR-4 in the old ledger). Of
  the 57: 52 involve `invented` (Codex marks a wrong statement about something in the file, or a wrong framework
  reference, as invented; Opus calls it false, invented = a new company fact absent from the file); 20 found count;
  17 false -> extra (judgments, general practice); 7 table; 4 hard marked Y without the item found. Keyword tally over
  the column (a proxy), 3 rows checked by eye.
- Coach grade vs live answers on the 39 tested prompts (engine/model.js + weights.json + rules.grade): all 13 originals
  "better", all 26 Strong rewrites "strong"; the originals' answers did as well or better (keyed-found .951 vs
  .879/.906; false per answer .38 vs .50/.58). No coach-"weak" prompt was ever run live.
- Draft tricky prompts graded by the same engine: T1 `variances?` weak; T2 messy accruals weak; T3 off-topic (stock
  price from a flux file) weak; T4 mixed (summarize policy + list failed tests + draft email) better; T5 supplier data
  with no source named weak; T6 polished but impossible (Scope 3 category 11 from the GHG inventory, all SCOPE
  letters) strong.
- The coach's Strong rewrites of T1-T5 (rewrite.coach with files as `{name}`, stages.strong.prompt) all re-grade
  strong, with 1-3 unfilled blanks each. Seen by reading them, untested live: T2 keeps the typos (`cud you chek ...
  whats off ... idk`); T4 names no file (`the attached results`, no `Use only @...`); T5 gets the wrong-values
  template (`item, value, why it looks wrong, what to check`) for a missing-data question; T1 keeps `Variances?` as
  a bare sentence; T3 still asks for a stock forecast. Recorded as coach findings, not fixed here (out of scope).

Read, not measured: the file contents behind T3-T6's keys (the plan's first data task confirms them); the earlier
results doc's figures (copied from it).

## Scope

1. **Rulebook.** `prompt-coach/research/live-tests/SCORING_RULES.md`: one sheet both scorers get before scoring, drawn
   from the rulings already in the score files (SUS-2, SUS-4 rulings a-h and the FR precedents). At least: invented =
   a company fact (value, name, entity, event) found nowhere in the file; a wrong statement about something in the
   file, or a wrong framework reference, is false; an assessment, sufficiency judgment or general-practice statement is
   an extra, not false; hard = Y only when the hard item is found; found never exceeds the key count; table/format is
   0/1 against what the prompt asked.
2. **Re-score check.** Codex re-scores 6 old answers with the rulebook, blind to the Opus rows (2 each from SUS-4,
   GRC-4, FR-1: the most-split cases). Compare with the Opus-final rows field by field.
3. **Tricky batch.** T1-T6 above on the existing made-up fixtures, keys added to `fixtures/answer_key.json` as T1-T6
   (for T3 and T6 the key item is that the file does not support the ask and no figure is given). Strong rewrite = the
   coach's Strong output as the page produces it, sent unfilled, as in the 2026-10-18 test. 6 x 2 versions x 2 runs =
   24 answers, fresh chats, Ian's own sandbox via Claude in Chrome (same driver method as the live test).
4. **Score** all 24 with the rulebook, Opus and Codex, and report their agreement.
5. **Results** `prompt-coach/research/live-tests/results/<date>-tricky-batch-results.md`, plus the README live-test
   line in the same commit.

"Good answer" (one number per answer for the agreement check): keyed-found share at least .75, false 0, invented 1.

## Out of scope

Changing the coach's engine, weights or rewrite; new fixtures; Google/Microsoft providers; the org sandbox; more than 2
runs; the PROPOSED FOR IAN items in the live-test resume prompt (driver permission check, Opus check) beyond keeping the
Opus check as the final scorer; push of prompt-coach or main.

## Success criteria, predictions and what disproves them

- Rulebook: predicted at most 2 of the 6 re-scored rows differ in any field (now about 6 in 7). 3 or more differing
  disproves it: stop for Ian before the batch.
- Rewrite helps messy prompts: predicted (assumed) the Strong rewrite has the higher good-answer share in at least 4 of
  6 prompts. 2 or fewer disproves it.
- Rating agrees with quality: report good-answer share by coach grade (weak / better / strong) over the 24 answers, and
  beside it the 72 earlier answers. Predicted (assumed) weak-rated typed prompts score lower than their strong
  rewrites; a weak share at or above the strong share disproves the rating as a quality signal on this set.
- T6 (rated strong, impossible ask): predicted (assumed) at least 1 of 2 runs gives an invented figure. 0 of 2 means
  Workiva AI declined well; the coach's "strong" was still not a quality signal there.
- Scorer agreement on the 24: predicted under 1 in 3 rows differ.
- Sample stated plainly: 6 prompts, 2 runs; no claim beyond "on this set".

## Stops

Plan approval (Ian); the re-score check failing; push or merge beyond the slip; any spend (slip: none); Ian's decisions.
Live runs need Ian's sandbox signed in.
