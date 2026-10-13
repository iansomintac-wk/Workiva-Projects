# Measuring the coach on real prompts

All accuracy numbers so far come from AI-written prompts. Real prompts are shorter, messier and
vaguer, so this is the step that tells you the true accuracy before customers see it.

## 1. Collect (30–60 minutes)
- Copy `prompts-template.csv` to `prompts.csv` (Excel or Google Sheets is fine; save as CSV).
- Paste 100–200 real prompts, one per row: from internal pilots, colleagues, Gong call notes,
  or what customers typed in demos.
- Anonymize: replace customer and company names, people, and confidential figures
  (e.g. "Acme Corp" → "[customer]"). Keep the wording otherwise untouched, typos included.

## 2. Label (fastest path)
- Run `node tests/eval_real.js real-eval/prompts.csv` with the label columns empty.
  It writes `predictions.csv` with the coach's guess for every prompt.
- Copy the `pred_S`…`pred_E` values into `prompts.csv`, then correct only the ones you
  disagree with. Use `data/LABELING.md` for the rules: 1 = clearly present, 0 = not.
- Optional: `intent` (e.g. variance, rewrite, extract) and `domain` (FR, GRC, SUS, GEN).
- Best practice: have a second person label 30 of the same prompts and compare. Where you
  disagree, settle the rule and write it down in `data/LABELING.md`.

## 3. Score
```sh
node tests/eval_real.js real-eval/prompts.csv
```
Prints grade accuracy, how often each SCOPE element is found and how often it's right,
weak↔strong mix-ups, and task accuracy. Under 50 labeled prompts the number is rough.

## 4. Improve
Labeled rows are also written to `train_real.jsonl`. Retrain and rebuild:
```sh
node tests/train.js rulefeat --tune data/train_*.jsonl real-eval/train_real.jsonl
node tests/build.js
```
Keep 30–50 real prompts out of training as your own test set, or the score will look better
than it is.

Don't commit `prompts.csv` if it contains anything confidential; it's in `.gitignore`.
