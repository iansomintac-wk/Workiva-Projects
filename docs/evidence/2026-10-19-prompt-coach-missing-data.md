# Prompt coach: missing-data template (T5), evidence 2026-10-19

Marking: Measured = run in this task; Read = from the ledger baselines (`logs/b_*.log`) or the lead's report.
Labels are Opus's, not Ian's. No answer-quality gain was measured (no live Workiva AI run); this shows only what the Strong text says. Notes were compared, tips were not (no tip probe; the engine diff touches no tip code).

## Change
Pattern: the missing-data function `missingAsk` in `prompt-coach/engine/rewrite.js`, tuned on train label ids 16-38 only (pattern edits in Task 2: 0 of 3). When intent is `anomaly` and it fires, Strong gets "Return a table: [columns or item], what is missing, where it should be." and "Do not fill in or estimate missing values." in place of the outlier table and rule.

## Checks
| Check | Prediction | Before | After | Verdict | Basis |
|---|---|---|---|---|---|
| Unit tests (35/0 at a737ba3; 37/0 after the fix round, below) | 35/0 | 29/29 (Read) | 35/0 | pass | Measured after; before Read |
| Rows compared | 1841 | 1841 (fresh parent dump, Measured) | 1841 | pass | Measured |
| Changed Strong rows | exactly 11 ask rows (ids 1 3 8 14 25 27 30 33 36 37 38) | - | 11 | pass | Measured |
| Mixed rows: 6 present (ids 5 6 11 12 19 and 31); the spec's 5 show anomaly lines, id 31 shows none | byte-identical | - | all 6 unchanged | pass | Measured |
| Row grade, intent, file, line | unchanged | - | unchanged | pass | Measured |
| Tricky probe T1-T4, T6 | identical | - | identical; only T5 differs and ends with the new fragments | pass | Measured |
| Notes probe | identical | - | `cmp` 0 | pass | Measured |
| simulate (4 train files, runs 2070) | strongNotStrong <=2, betterWeak <=5, badText <=2 | 2 / 5 / 2 (Read) | 2 / 5 / 2 | pass | Measured after; before Read |
| customer_check | PASS 229 | PASS 229 (Read) | PASS 229 | pass | Measured after; before Read |
| eval rulefeat test.jsonl | acc 0.856 | 0.856 (Read) | 0.856 (flips 8) | pass | Measured after; before Read |
| pagetest.js, filetest.js | - | - | not run (no working Playwright on this PC; nothing installed) | not run | not run |

Rows outside the labels: 1804 measured (rows not matched by text to a stored label), against the spec's 1,803. Labeled rows 37 of 38 labels. Unmatched label id: 23, a mention row. It is in `train_grc.jsonl`; it did not match because the labels file flattened its newlines (so 7 mention rows present, not 8).

## Held-out result (ids 1-15, read for the first time here; nothing tuned)
Ask ids 1, 3, 8, 14 all changed (4 of 4; the bar was at least 3 of 4). Ids 8 and 14 are one prompt. The mixed ids 5 6 11 12 19 and the mention rows did not change.

## Guard test (lead's measurements, Read)
Task 3's guard test was green on the parent. A mutant without the MISS_WRONG clause turns it red (tests 31, 32 and 34 fail). The gaps half of the guard is a forward guard only. Its gaps-half prompt was changed off-plan to "Which suppliers are missing emissions data?".

## Strike 1: check correction (proxy ruling on a locked check, for Ian to overturn)
First run of the Step 2 compare failed (9 FAIL lines). Cause: the spec counts a row as showing anomaly lines if it has EITHER old line (strong_dump.js, `anomalyLines`), but my compare demanded BOTH new lines on every changed row. Rows sim_customers:41, train_hard:291 and train_sus:232 had only the old table line, and train_sus:52 had only the old rule; each got exactly its counterpart. The engine was correct. I also misread those rows as compare-intent; all 11 are anomaly ask rows. The unmatched id and mention count were also wrong in my first compare (expected 8 mention and any 1 unmatched).
Ruling: PM proxy for Ian, decisions.md line 101 (07:48Z). Only ledger scripts changed.
- Before: for each changed row, assert both new fragments present and both old fragments absent (and present before).
- After: for each pair (old table line "why it looks wrong, what to check." to "what is missing, where it should be."; old rule "Do not correct any values; flag anything you are unsure of." to "Do not fill in or estimate missing values."), if the old line was present before it must be absent after and the new one present; at least one pair per row; applying the swaps (and "item, value, " to "item, ") to the before text must equal the after text byte for byte. `missingLines` in the dump counts either new line (11). Mention expected 7 with unmatched exactly [23].

## Fix round (proxy ruling B, 07:59Z)
Two review findings were closed: (1) the "if" exemption cut an indirect question ("Check if any suppliers are missing emissions data"); (2) invalid, negative and error words did not make a prompt mixed. Change in `missingAsk` only: "if" right after check, see, ask, confirm, find out or tell me/us is no longer a condition clause (a clause such as "If X is missing, ..." is still cut at the comma); MISS_WRONG gained invalid, negative and errorw*.

Red first (Measured): 2 new tests, unit 35 pass / 2 fail before the code change; after it 37 pass / 0 fail.

| Phrase | missingAsk before (a737ba3 engine, Measured) | after (Measured) |
|---|---|---|
| Check if any suppliers are missing emissions data | false | true |
| Tell me if any suppliers are missing emissions data | false | true |
| See whether any suppliers are missing emissions data | true | true |
| Find missing or invalid emissions values | true | false |
| Flag negative emissions and missing values | true | false |
| Find errors and missing values in the supplier file | true | false |
| If a value is missing, say so. | false | false |
| If possible, list missing emissions data. | true | true |

Re-run (Measured, after the fix; logs `logs/*_fix.*`): compare_strong exit 0, rows 1841, changed 11, matched 37, unmatched 23, mixed rows 6, mention rows 7; tricky "T5 differing blocks 1 | other differing blocks 0"; notes cmp 0; simulate runs 2070, strongNotStrong 2, betterWeak 5, badText 2; customer_check PASS 229; eval acc 0.856; unit 37/0. Same as before the fix.
Label-level missingAsk misses (Measured on all 38 labels): ids 4 and 10 (mention) still fire, masked because those prompts' own format keeps the output unchanged; id 26 (ask) is silent. No new misses.
Held-out caveat: ids 1-15 were already read at Task 4, so post-fix numbers on them are NOT held-out. The held-out result stays Task 4's: 4 of 4 ask ids changed; the pattern-level mention ids 4 and 10 fire, masked.

## Known limits (not fixed; proxy ruling)
- "missing net zero targets": does NOT fire missingAsk (measured by node, 2026-10-19; the earlier line saying it fires was wrong).
- "ignore duplicates" and "Exceptions tab": the wrong-value words are checked on the whole prompt, so these keep a genuine missing ask from firing.
