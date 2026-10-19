# Prompt coach: missing-data template (T5), evidence 2026-10-19

Marking: Measured = run in this task; Read = from the ledger baselines (`logs/b_*.log`) or the lead's report.
Labels are Opus's, not Ian's. No answer-quality gain was measured (no live Workiva AI run); this shows only what the Strong text says. Notes were compared, tips were not (no tip probe; the engine diff touches no tip code).

## Change
Pattern: the missing-data function `missingAsk` in `prompt-coach/engine/rewrite.js`, tuned on train label ids 16-38 only (edit count: see the Task 2 commit). When intent is `anomaly` and it fires, Strong gets "Return a table: [columns or item], what is missing, where it should be." and "Do not fill in or estimate missing values." in place of the outlier table and rule.

## Checks
| Check | Prediction | Before | After | Verdict |
|---|---|---|---|---|
| Unit tests (Measured; Read for the lead's 35/0 at e59dcc4) | 35/0 | 29/29 (Read) | 35/0 | pass |
| Rows compared | 1841 | 1841 (fresh parent dump, Measured) | 1841 | pass |
| Changed Strong rows | exactly 11 ask rows (ids 1 3 8 14 25 27 30 33 36 37 38) | - | 11 | pass |
| Mixed (5) and mention (7 present) rows | byte-identical | - | identical | pass |
| Row grade, intent, file, line | unchanged | - | unchanged | pass |
| Tricky probe T1-T4, T6 | identical | - | identical; only T5 differs and ends with the new fragments | pass |
| Notes probe | identical | - | `cmp` 0 | pass |
| simulate (4 train files, runs 2070) | strongNotStrong <=2, betterWeak <=5, badText <=2 | 2 / 5 / 2 (Read) | 2 / 5 / 2 | pass |
| customer_check | PASS 229 | PASS 229 (Read) | PASS 229 | pass |
| eval rulefeat test.jsonl | acc 0.856 | 0.856 (Read) | 0.856 (flips 8) | pass |
| pagetest.js, filetest.js | - | - | not run (no working Playwright on this PC; nothing installed) | not run |

Rows outside the labels: 1804 measured (rows not matched by text to a stored label), against the spec's 1,803. Labeled rows 37 of 38 labels. Unmatched label id: 23, a mention row in the labels file (so 7 mention rows present, not 8).

## Held-out result (ids 1-15, read for the first time here; nothing tuned)
Ask ids 1, 3, 8, 14 all changed (4 of 4; the bar was at least 3 of 4). Ids 8 and 14 are one prompt. The mixed ids 5 6 11 12 19 and the mention rows did not change.

## Guard test (lead's measurements, Read)
Task 3's guard test was green on the parent. A mutant without the MISS_WRONG clause turns it red (tests 31, 32 and 34 fail). The gaps half of the guard is a forward guard only. Its gaps-half prompt was changed off-plan to "Which suppliers are missing emissions data?".

## Strike 1: check correction (proxy ruling on a locked check, for Ian to overturn)
First run of the Step 2 compare failed (9 FAIL lines). Cause: the spec counts a row as showing anomaly lines if it has EITHER old line (strong_dump.js, `anomalyLines`), but my compare demanded BOTH new lines on every changed row. Rows sim_customers:41, train_hard:291 and train_sus:232 had only the old table line, and train_sus:52 had only the old rule; each got exactly its counterpart. The engine was correct. I also misread those rows as compare-intent; all 11 are anomaly ask rows. The unmatched id and mention count were also wrong in my first compare (expected 8 mention and any 1 unmatched).
Ruling: PM proxy for Ian, decisions.md line 101 (07:48Z). Only ledger scripts changed.
- Before: for each changed row, assert both new fragments present and both old fragments absent (and present before).
- After: for each pair (old table line "why it looks wrong, what to check." to "what is missing, where it should be."; old rule "Do not correct any values; flag anything you are unsure of." to "Do not fill in or estimate missing values."), if the old line was present before it must be absent after and the new one present; at least one pair per row; applying the swaps (and "item, value, " to "item, ") to the before text must equal the after text byte for byte. `missingLines` in the dump counts either new line (11). Mention expected 7 with unmatched exactly [23].
