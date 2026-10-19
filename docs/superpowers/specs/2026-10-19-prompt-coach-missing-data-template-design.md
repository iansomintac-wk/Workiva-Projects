# Prompt coach: a missing-data version of the anomaly template (T5)

Talk session d505d863, 2026-10-19. Class: bounded (one template change in `engine/rewrite.js`).
Branch `worktree-prompt-coach-findings-fix` from origin/prompt-coach 6154fae.

Labels: **measured** = run in this talk; **read** = from a file or ledger, not re-run; **assumed** = reasoning only.

## Ian's rulings (verbatim, AskUserQuestion, 2026-10-19)

- Which finding first: "T5 wrong template (Rec.)"
- How: "Missing-data version (Rec.)". The option he picked read: when the coach has picked the anomaly
  task and the ask is about missing or blank data, swap in a fitting table (item, what is missing, where it
  should be) and the line "Do not fill in or estimate missing values."; template only, grades and the
  classifier unchanged.

## The problem (measured)

T5 is "Which suppliers are missing emissions data?" with @sus_supplier_data.csv. Its Strong rewrite ends
"Return a table: item, value, why it looks wrong, what to check. Do not correct any values; flag anything you
are unsure of." That is the outlier check, not the missing-data question.

- Cause: `classify.js` `pick()` labels T5 `anomaly` at p = 0.90 (`taskSure`), so the text patterns in
  `rewrite.js` `INTENTS` are never consulted (pattern result: null). The classifier has no `gaps` label at
  all. `paramsFragment` and `evalFragment` then add anomaly's table and rule.
- Answers were not hurt on the live run: T5 typed 2/2 good, Strong 2/2 good (Opus; read, results file).
  This fix is about the coach's advice being right, not a measured gain in answers. **Assumed**: a table
  asking "why it looks wrong" for a blank cell invites invented reasons.

## Re-check of the six tricky findings on the current coach (measured)

The coach at 6154fae gives byte-identical grades and Strong rewrites to 0ec11fa on T1-T6 (`cmp` exit 0).
The engine diff since then (rewrite.js +53/-9) adds notes and tips only. Notes changed:
T4 now gets the "stacked" note (split the asks), T6 gets "calc". With the real GHG file loaded, T6's
grounding note names "Scope 3" and "FY25", not category 11; "FY25" is a false alarm (the file says
"FY2025"), a new small finding. T1, T2, T3, T5, T6 hold as written; T4 is partly addressed by the note
(rewrite still unsplit, files not @-named, "[number] bullets" kept).

## Probe on the stored prompts (measured)

All 8 `data/*.jsonl` files, 1,841 prompts. The coach picks `anomaly` for 141. Of those, 38 contain a
missing-data word (`missing|blank|empty|no data/value/figure|without a value`). Opus (this talk) labeled all
38 from their full text, in `prompt-coach/research/2026-10-19-missing-ask-labels.tsv`:

| Label | Meaning | Rows | Unique prompts | Strong shows anomaly lines today |
|---|---|---|---|---|
| ask | the question is about what is missing or blank | 24 | 21 | 11 (ids 1 3 8 14 25 27 30 33 36 37 38) |
| mixed | missing and wrong values together (zero, duplicate, exception) | 6 | 4 | 5 (ids 5 6 11 12 19) |
| mention | "missing" only in a rule or side clause, or another sense ("a blank tab") | 8 | 7 | 1 (id 28) |

"Shows anomaly lines" = the Strong prompt (no files) contains "Do not correct any values" or "why it looks
wrong". The other rows already carry their own format and rule, so the coach adds none. All 38 Strong
rewrites grade strong today. Duplicates: ids 10-15 repeat 4-9 (test and test_unlabeled).

Held-out split: the trigger is designed on the `train_*` rows (ids 16-38) only; ids 1-15 (`test`,
`test_unlabeled`, `sim_customers`) are the held-out check. The labels are Opus's, not Ian's.

## Design

1. A missing-data test on the user's prompt, used only when the coach's intent is `anomaly`: the ask is
   about missing or blank items, and the prompt does not also ask about wrong, zero, duplicate, exception
   or out-of-place values. A missing word inside a conditional or rule clause ("if X is missing", "don't
   guess missing dates") does not count. Exact pattern: the plan writer's, tuned on ids 16-38 only.
2. When it fires: `paramsFragment` gives "Return a table: " + (detected columns, or "item") + ", what is
   missing, where it should be. "; `evalFragment` gives "Do not fill in or estimate missing values.".
   The `anomaly` objective fragment already says "wrong, missing, or out of place" and stays.
3. Nothing else changes: grades, weights, classifier, notes, tips, other intents.

## Scope

In: `engine/rewrite.js` (the test and two fragments), `tests/rewrite_unit.test.js`, `dist/prompt-coach.html`
rebuilt, `README.md` (a wording-rules line and the dist byte count), the labels file.
Out: the T1-T4 and T6 findings; the classifier and weights; notes and tips; the "FY25" grounding false
alarm (logged for later); any live Workiva AI run; any spend.

## Success criteria, each with a prediction and what would disprove it

| # | Check | Prediction | Disproved if |
|---|---|---|---|
| 1 | Unit test: T5 typed with @sus_supplier_data.csv; Strong contains "what is missing" and "Do not fill in or estimate missing values", and not "why it looks wrong" or "Do not correct any values" | fails on parent, passes after | passes on parent, or fails after |
| 2 | ask rows that showed anomaly lines (11): now show the missing-data lines instead | 11 of 11 (train 7: 25 27 30 33 36 37 38; held-out 4: 1 3 8 14, where 8 and 14 are one prompt) | fewer than 10 of 11, or held-out fewer than 3 of 4 |
| 3 | mixed rows showing anomaly lines (5) | all 5 unchanged | any changes |
| 4 | mention rows | all 8 Strong rewrites byte-identical | any changes |
| 5 | The other 1,803 prompts (all but the 38) | Strong rewrite byte-identical, before vs after | any differs |
| 6 | Strong grade on the 38 | 38 of 38 still strong | any drops |
| 7 | T1-T4, T6 Strong rewrites (tricky probe) | byte-identical | any differs |
| 8 | Must stay green | unit tests all pass (29 + new); simulate.js on data/train_*.jsonl: strongNotStrong <= 2, betterWeak <= 5, badText <= 2 (baseline measured); customer_check PASS 229 runs; eval.js rulefeat data/test.jsonl acc 0.856 | any worse |

Check 5 holds by construction only if the change is gated on intent `anomaly` and the missing-data test;
the check still runs, so a leak through a shared helper would show. `tests/pagetest.js` and
`tests/filetest.js` need a Playwright or npm vendor path not present on this PC (pagetest requires
`/opt/node22/...`; measured: path is Linux); the run reports them as not run unless it finds one.

## Next

Q1-Q3 and Q5 from the tricky-batch results stay parked with their recommendations (see the run prompt).
After this run: T3/T6 ("the file cannot support this ask") is next by the PM's order.
