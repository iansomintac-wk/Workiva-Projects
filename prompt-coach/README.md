# Workiva AI Prompt Coach (offline)

Grades a Workiva AI prompt as weak / better / strong against the SCOPE rubric, explains why,
writes better and strong versions grounded in the user's own words and files, and breaks the
strong version into toggleable SCOPE elements. Everything runs in the browser: no LLM, no
server, no uploads. Built for customer-facing use where Claude access can't be provisioned.

```sh
node tests/build.js                      # -> dist/prompt-coach.html (single file, ~140 KB)
node tests/eval.js rulefeat data/test.jsonl          # accuracy on held-out prompts
node tests/simulate.js data/train_*.jsonl            # rewrite invariants
node tests/train.js rulefeat --tune data/train_*.jsonl   # retrain engine/weights.json
```

## How it works

| Layer | File | What it does |
|---|---|---|
| Rules | `engine/rules.js` | ~150 regex cues per SCOPE letter on normalized text (typos, contractions, curly quotes). Each hit maps back to the user's original characters for highlighting. Also detects stacked asks and vague verbs. |
| Model | `engine/model.js` + `engine/weights.json` (16 KB) | Per-letter logistic regression over the rule hits only (no raw words), averaged over 5 seeded runs, with thresholds tuned on out-of-fold training predictions. |
| Rewrites | `engine/rewrite.js` | Detects area (FR / GRC / SUS / general) and task (15 intents). Splits the prompt into letter-tagged segments so the user's own wording is kept; fills missing letters from intent-specific templates and file metadata (file name, best-matching sheet, header row, periods). Re-grades its own strong version and swaps in more explicit wording if a letter doesn't register. Adds Workiva-specific tips. |
| Files | `engine/files.js` | Reads .docx (headings), .xlsx (sheets + header rows), .pptx (slide titles), .pdf, .csv, .txt in the browser; libraries load from cdnjs only when needed. |
| Page | `web/template.html` | Live grading, highlights, click-to-fix, ladder, SCOPE builder, examples, "how we grade". |

Grade rule: weak if Source or Objective is missing; strong if all five are present (and the
prompt asks for one thing at a time); otherwise better.

## Data

`data/LABELING.md` is the labeling guide. Training: 1,080 prompts across financial reporting, GRC,
sustainability and general work (`train_fr`, `train_grc`, `train_sus`, plus `train_hard`: paraphrases, gaming, near-misses). Held-out test: 320 prompts
written separately to stress the grader (realistic, paraphrase, gaming, messy, stacked,
near-miss, off-task). The test set was never used for tuning. A second, blind annotator
re-labeled the test set: grade agreement 99.1% (both annotators are LLMs, so human agreement
would likely be lower).

## Results on the held-out test set (320 prompts)

| Approach | Grade accuracy | Gaming prompts | Size |
|---|---|---|---|
| Rules only | 83.4% | 90% | 0 KB |
| Word/char n-gram model only | 75.9% | 42% | 2.6 MB |
| Rules + n-gram hybrid | 86.9% | 75% | 2.6 MB |
| **Rules + rule-feature model (shipped)** | **87.2%** | 80% | **18 KB** |

Rewrite simulation over 2,070 runs (training prompts, with and without a sample file): generated
strong versions re-grade as strong 99.8% of the time; toggling any letter always changes the
prompt; no duplicate sentences, empty fragments, or broken punctuation.

## Known limits

- Paraphrased cues are the weakest category (~78%). Add training prompts and retrain.
- Rewrites are templates: unknowns become `[bracketed placeholders]` the user fills in.
- It cannot judge whether the attached file actually supports the request beyond checking
  that periods and named terms in the prompt appear in the file.
- Knowledge-base and agent names come from Workiva support pages as of Oct 2026; confirm
  before publishing externally.

Research notes: `research/findings.md`.
