# Tricky batch: live results (2026-10-19)

Plan: `docs/superpowers/plans/2026-10-18-prompt-coach-tricky-batch.md`. Spec:
`docs/superpowers/specs/2026-10-18-prompt-coach-tricky-batch-design.md`. Rulebook:
`research/live-tests/SCORING_RULES.md`. Run ledger: `.ledger/2026-10-18-prompt-coach-next/`.

Labels: **measured** = recomputed while writing this file from a log in the ledger; **read** = taken from a
ledger row or a script's printed output and not recomputed here; **assumed** = reasoning only.

Everything below holds **on this set** only: 6 prompts x 2 versions x 2 runs = 24 answers.

## What was done

- **Coach version.** The grades and Strong rewrites come from the coach at commit 0ec11fa (engine unchanged since
  79cd855). origin/prompt-coach 5a1e05c has since changed `engine/rewrite.js`, so the T3/T4 findings and open
  question 4 may be partly fixed after merge.

- Six tricky prompts on the existing made-up fixtures (no customer data), graded by the engine as typed:
  T1 "variances?" (weak), T2 messy accruals with typos (weak), T3 a stock-price forecast from a flux file
  (weak), T4 three jobs in one ask (better), T5 supplier data with no source named (weak), T6 a polished
  but impossible ask, Scope 3 category 11 from a GHG inventory that has none (strong).
- Each prompt was run as typed and as the coach's Strong rewrite, 2 runs each: 24 answers. T6 typed and
  Strong are the same text (typed T6 already grades strong).
- The runs were in Ian's own Workiva AI sandbox, driven through Claude in Chrome by two driver sessions:
  driver 1 ran 10 of 12 (T1-T3) before its context stop, driver 2 ran the other 14 (read, ledger rows T5a,
  T5b+T6). The sent-text check (`sentcheck`) over all six runs: mismatches 0, missing 0 (read). Shortest
  answer 905 characters (read). Four answers asked a clarifying question first (Q01 Q08 Q16 Q23); the
  driver replied "continue" (read).
- Scoring: each answer got an opaque id (Q01-Q24). Both scorers saw the key, the rulebook, the prompt text
  and the answer, so **the version (typed or Strong) was inferable from the prompt text**; the ids hid
  version and run, the prompt text did not hide version. A leak (the key carried the typed prompt verbatim) was found and
  removed before scoring (read, row T78in).
- **Opus is the final scorer**: `claude -p --model opus --tools ""`, each call from its own empty folder.
  **Codex is the second scorer**: `codex exec`, read-only, each call from its own empty folder (read, rows
  T7, T8). Good answer = found at least 0.75 of key items, false 0, invented 1 (rulebook).

## Rulebook and gate

- `SCORING_RULES.md` R1-R9 came first; **R10-R15 were written after seeing the round-1 splits**, so the
  gate below is not a blind test of the rulebook.
- Gate: both scorers re-scored the same 6 earlier answers. Counting every field including extra: round 1,
  6 of 6 rows differ (read, row T2c); round 2, 5 of 6 differ (measured from `rescore2_compare.md`). The
  pass/fail verdict agreed in 6 of 6 (read).
- They split mostly on how many extras an answer has. Ian's ruling (verbatim pick): **"Report extras, don't
  gate (Rec.)"**. On the other 9 fields, 2 of 6 rows differ (R2 table, R6 job; measured from the same
  table). **Held** under the ruling only. As the spec wrote it ("any field"), prediction 1 is **disproved**; it passes only under Ian's ruling.

## Each prediction next to its result

| # | Prediction (spec) | Result on this set | Verdict |
|---|---|---|---|
| 1 | Rulebook: at most 2 of 6 re-scored rows differ | 2 of 6 on 9 fields (measured); 5 of 6 with extra (measured) | DISPROVED as the spec wrote it (any field); passes only under Ian's ruling |
| 2 | Strong rewrite has a higher good share than typed in at least 4 of 6 (assumed) | 2 of 6 (T1 1/2 to 2/2, T4 1/2 to 2/2; the other 4 are 2/2 both ways); typed 10/12, Strong 12/12 (read, script output, Opus rows). Codex rows: rewrite helps 1 of 6 (measured). Good answers: Opus 22, Codex 16, split on 6 rows Q01 Q05 Q07 Q15 Q16 Q21 (Opus good each) | DISPROVED under both scorers (2 is the disproof line) |
| 3 | Weak-graded prompts get a lower good share than strong-graded (assumed) | weak 7/8 (88%), better 1/2 (50%), strong 14/14 (100%) (read, script output; checked against the per-prompt table). Codex: weak 5/8 (63%), strong 10/14 (71%) (measured). Opus: weak 7/8, strong 14/14. Earlier batch, same measure: strong 52% < better 68% (75 rows, measured) | HELD under both, narrowly; n small |
| 4 | T6: at least 1 of 2 typed runs invents a figure (assumed) | typed 0 of 2, all T6 runs 0 of 4 (read, script output) | DISPROVED: Workiva AI declined every time |
| 5 | Opus and Codex differ on fewer than 1 in 3 of the 24 rows | 10 of 24 differ on 9 fields, after label mapping (measured); limit: at most 7 may differ | DISPROVED |
| 6 | Sample stated plainly | 24 answers (measured, 24 rows) | HELD (a statement) |

On criterion 4: the coach rated T6 strong, and the answer was a correct refusal; on this set the coach's
"strong" said nothing about whether the file could support the ask.

## Opus-Codex agreement on the 24

- **Label-wording artifact.** The first agreement run said 21 of 24 rows differ (read, `agree_out.txt`,
  kept as the record). The lead found the found-item lists differed in 20 rows by wording only (one scorer
  wrote a short figure, the other the line name) (read, row T9s4).
- **Fix.** A third model (a Sonnet helper), given only the keys and the label lists with scorer names
  hidden, mapped each list to key item numbers: 48 lists, 0 unmatched; the mapped count equalled each
  scorer's own found count in 48 of 48 (read, row T9map).
- **After mapping: 10 of 24 rows differ** on the 9 fields (measured). By field: false 6 (Codex higher in
  all 6), job 4 (Opus 1, Codex 0), found set 1 (Q07), hard 1 (Q07), table 1 (Q20) (read, row T9s4b).
- **Extra, reported not gated:** totals Opus 123, Codex 198; the two differ in 21 of 24 rows (measured).

## Unruled rows (rulebook gap)

- Items a scorer could not settle from the rulebook: **Opus 14** (T1 3, T2 1, T3 2, T4 3, T5 0, T6 5),
  **Codex 1** (T4 Q02 table) (measured, counted from `scores_opus_unruled.txt` and
  `scores_codex_unruled.txt`). The plan's threshold is 4, so Opus's 14 is a **rulebook gap**.
- Themes: (1) refusal versus job: R14(c) scores a refusal as job 0, but for T3 and T6 declining is the
  right answer (T3 x2, T6 x4); (2) the coach's unfilled "[number] bullets" placeholder versus the table and
  format fields (T4); (3) found credit for a partly named key item (T2 Q07); (4) whether a correctly
  computed % change counts as "a number not in the file" (T1); (5) row numbering by data row or sheet row
  (T6 Q14); (6) whether a "recurring ~$2" item counts toward found (T1; decides Q16 and Q21).
- **The rulebook was not edited mid-batch**; these are left for Ian (below).

## Coach findings (not fixed here)

From reading the six Strong rewrites (`tricky_findings.txt`); out of scope for this batch.

- T1 (3 blanks): the bare "Variances?" stays as a sentence inside the template.
- T2 (2 blanks): typos kept verbatim; the vague ask is unchanged.
- T3 (2 blanks): the forecast ask is kept; the template adds "Use only" and "Do not add facts" but no
  warning that the file cannot support it.
- T4 (1 blank): neither file is named with @; the three-job ask is not split; "Use [number] bullets" does
  not fit an email draft.
- T5 (1 blank): wrong template (an outlier-check table, "Do not correct any values") for a missing-data
  question.
- T6 (0 blanks): returned unchanged; the coach does not detect that category 11 is absent from the file.

## Limits

- Small sample: weak n=8, better n=2. Typed prompts already got good answers 10 of 12 times, so the rewrite
  test had little room to show a gain.
- Version was inferable by both scorers (prompt text visible).
- R10-R15 were written after the round-1 splits.
- Old comparison column: the earlier answers sum to **75 rows** (better 17/25 = 68%, strong 26/50 = 52%,
  weak 0/0; measured from the script output), including FR-2's older 3-row table, which has no extra or
  hard fields. Correction: `criteria.md` says "earlier 72"; the column adds up to 75.

## Open questions for Ian

1. **Refusal when declining is right.** Recommended: when the key says the file cannot support the ask, a
   clear decline scores job 1. This would settle 6 of Opus's 14 unruled items. Your call: change R14(c)?
2. **The "[number]" placeholder.** Recommended: score table and format as N/A when the prompt itself left
   the count blank, and log the blank as a coach finding. Agree?
3. **Extra.** Keep reporting it as Opus/Codex totals (123 vs 198 here), or define a counting unit so it can
   be gated?
4. **Which coach finding first?** Recommended: T5's wrong template (it changes what the answer is asked
   for), then T3/T6 (no warning when the file cannot support the ask).
5. **Scorer agreement.** 10 of 24 rows differ, mostly on false (Codex stricter). Is Opus-as-final enough,
   or do you want a third read on the 10 split rows?
