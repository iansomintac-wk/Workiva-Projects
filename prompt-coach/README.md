# Workiva AI Prompt Coach (offline)

Grades a Workiva AI prompt as weak / better / strong against the SCOPE rubric, explains why,
writes better and strong versions grounded in the user's own words and files, and breaks the
strong version into toggleable SCOPE elements. Everything runs in the browser: no LLM, no
server, no uploads. Built for customer-facing use where Claude access can't be provisioned.

```sh
node tests/build.js                      # -> dist/prompt-coach.html (single file, ~300 KB)
node tests/eval.js rulefeat data/test.jsonl          # accuracy on held-out prompts
node tests/simulate.js data/train_*.jsonl            # rewrite invariants
node tests/customer_check.js                         # strong version keeps the user's ask, adds blanks not facts
node tests/train.js rulefeat --tune data/train_*.jsonl   # retrain engine/weights.json
node tests/train_cls.js --eval data/test.jsonl data/train_*.jsonl   # retrain task/area classifier
python3 tests/make_fixtures.py && VENDOR=<npm dir> node tests/filetest.js   # real-file test
node tests/eval_real.js real-eval/prompts.csv        # score on real prompts (see real-eval/README.md)
```

## How it works

| Layer | File | What it does |
|---|---|---|
| Rules | `engine/rules.js` | ~150 regex cues per SCOPE letter on normalized text (typos, contractions, curly quotes). Each hit maps back to the user's original characters for highlighting. Also detects stacked asks and vague verbs. |
| Model | `engine/model.js` + `engine/weights.json` (4 KB) | Per-letter logistic regression over that letter's own rule hits only (no raw words, no cross-letter features, so one element can't vouch for another), averaged over 5 seeded runs, thresholds tuned on out-of-fold training predictions. |
| Task + area | `engine/classify.js` + `engine/cls-weights.json` (166 KB) | Softmax regression over words + intent/domain pattern hits. Task 69.7% / area 86.3% on test (pattern-only baseline: 48% / 78%); 79% when confident. Low confidence falls back to patterns and the page asks the user to confirm. |
| Rewrites | `engine/rewrite.js` | Detects area (FR / GRC / SUS / general) and task (15 intents). Splits the prompt into letter-tagged segments so the user's own wording is kept; fills missing letters from intent-specific templates and file metadata (file name, best-matching sheet, header row, periods). Re-grades its own strong version and swaps in more explicit wording if a letter doesn't register. Adds Workiva-specific tips. |
| Files | `engine/files.js` | Reads .docx (headings), .xlsx (sheets + header rows), .pptx (slide titles), .pdf, .csv, .txt in the browser; libraries load from cdnjs only when needed. |
| Page | `web/template.html` | Two sections. Weak → strong: your prompt is the first tab (live grade with one-sentence reason, highlights, a small attach-file button, an example menu), then Better and Strong tabs. Build it with SCOPE: toggle each letter of the strong version. Task and area are detected automatically. Plus "how we grade". |

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
| Rules + rule-feature model, shared features | 87.5% | 82% | 18 KB |
| **Rules + per-letter rule-feature model (shipped)** | **85.6%** | 82% | **4 KB** |

The shared-feature model scored higher by inferring letters from other letters (a prompt with an
audience usually also has a check rule). That made the coach credit elements the user never
wrote, so the shipped model credits each element only from its own cues. It also finds more of
what users did write: Context recall 0.77 → 0.81, Parameters 0.75 → 0.81.

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

## Real files

`tests/filetest.js` loads real Word, Excel, PowerPoint, PDF and CSV files (from
`tests/make_fixtures.py`) into the built page in Chromium, serving the page's CDN libraries from a
local npm install of the same versions. Last run: all 8 fixtures read correctly (sheet names,
header rows, headings, slide titles, periods); image-only PDFs and legacy .doc files show clear
messages.

Research notes: `research/findings.md`. Real-prompt evaluation kit: `real-eval/README.md`.

## Simulated-customer review (2026-10-14)

121 new prompts written as 15 customer personas (`data/sim_customers.jsonl`, blind-labeled by
an LLM), run through the page's own code, half with a file attached. Two LLM reviewers played
each customer and rated what the page showed. All personas, labels and reviewers are AI
stand-ins, not real users.

- Grade matches the blind label 64.5% (78/121), against 86% on `data/test.jsonl`; these prompts
  are more casual. No blind-weak prompt was graded strong.
- After the rewrite changes (keep the user's own sentence, add blanks instead of roles,
  counts, limits or unnamed sheets; name an attached file in the reason line):

| Reviewer measure (121 prompts) | Before | After |
|---|---|---|
| Strong version keeps what the user meant | 76 | 91 |
| ...of the 72 weak prompts | 33 | 43 |
| Adds specifics the user never gave | 67 | 37 |
| Reads clumsily | 49 | 62 |
| Would copy it (1-5), weak prompts | 1.96 | 2.28 |

Still open: wrong task templates when the task is misread, audience examples that don't fit the
area, and the user's casual wording ("can u") kept verbatim.

