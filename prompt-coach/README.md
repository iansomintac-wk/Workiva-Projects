# Workiva AI Prompt Coach (offline)

Grades a Workiva AI prompt as weak / better / strong against the SCOPE rubric, explains why,
writes better and strong versions grounded in the user's own words and files, and breaks the
strong version into toggleable SCOPE elements. Everything runs in the browser: no LLM, no
server, no uploads. Built for customer-facing use where Claude access can't be provisioned.

```sh
node tests/build.js                      # -> dist/prompt-coach.html (single file, 337684 bytes, LF)
node tests/pagetest.js                      # real-browser page test of the built page (notes, display grade, off-topic); build first
node tests/eval.js rulefeat data/test.jsonl          # accuracy on held-out prompts
node tests/simulate.js data/train_*.jsonl            # rewrite invariants
node tests/customer_check.js                         # strong version keeps the user's ask, adds blanks not facts; no filler, original order, whole pieces, blank rule, Ian's invoice case
node --test --test-reporter=tap tests/rewrite_unit.test.js   # one focused test per rewrite rule; splitting: a ";" or text inside ( ) [ ] never ends a sentence (sentenceSpans)
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
strong versions re-grade as strong 99.9% of the time (2 of 2,070 do not); toggling any letter always
changes the prompt; no duplicate sentences or empty fragments (2 runs have other bad text).

## Known limits

- Paraphrased cues are the weakest category (~78%). Add training prompts and retrain.
- Rewrites are templates: unknowns become `[bracketed placeholders]` the user fills in.
- It cannot judge whether the attached file actually supports the request beyond checking
  that periods and named terms in the prompt appear in the file.
- Knowledge-base and agent names come from Workiva support pages as of Oct 2026; confirm
  before publishing externally.

## Rewrite wording rules (2026-10-16)

- Sentences: a `;` and anything inside `( )` or `[ ]` never ends a sentence, so a kept sentence is never cut in half. Unit tests: `node --test --test-reporter=tap tests/rewrite_unit.test.js`.
- Order: kept sentences appear in the user's order. Generated Source and Context go right after the opening Source sentences; a generated Objective takes the place of the vague sentence it replaced; generated Parameters and Evaluate go last. Every piece keeps its letter, so the SCOPE toggles work as before.
- Direct voice (Better and Strong): sentence-initial "please", "kindly", "can/could/would you", "would you mind", "I was wondering if you could", "I'd like/need/want you to" become an imperative; "please", "pls", "thanks" and "if possible" are removed; commas are kept ("Short please, no jargon" becomes "Short, no jargon"), except that a "please," right after a dash is dropped with no comma left; a mid-sentence "can/could you" before a verb starts its own imperative sentence; the lead-ins Also, Plus and And are kept ("Also can you add X" becomes "Also add X"); a sentence that opens with a question word (what, which, who, when, where, why, how) stays a question, and only a ", and/plus can you ..." tail is split off as its own imperative; "Additionally/Also, (please) ensure/make sure (that) if" becomes "If"; "word(s)" becomes "words"; a "?" becomes "." only on a sentence that was converted to an imperative. Known limit: a bare "can you hear me" becomes "Hear me". Style only: the evidence on "please" is mixed (research/2026-10-16-prompting-evidence.md). The engine computes the cleaned-up Better text for a Better-graded prompt, but the page does not show a Better tab for it yet (known limit).
- Scope limits: when the only Evaluate match in the user's prompt is a scope limit ("Don't comment on anything outside Category 1."), the labeling rules call that a Parameter (data/LABELING.md), so Strong keeps the sentence and still adds the coach's own Evaluate sentence. Unit test: `tests/rewrite_unit.test.js`.
- Typos: about 27 common misspellings ("seperately", "recieve", "occured", ...) are fixed as whole words in the user's text in rewrites (list: TYPOS in engine/rewrite.js).
- Context fits the task: "This table feeds [what it is for, such as our Scope 2 inventory]." for extraction; "This is for [what it feeds, such as ...]." for variance, anomaly, consistency, compare, map and formula tasks; the example follows the area (flux review, SOX control testing, Scope 2 inventory; none for general). A prompt whose only missing letter is Context gets exactly one blank, even when one of its sentences has a Context cue the model does not credit. One Context cue ('audience-is') was widened to read these sentences; grade accuracy on data/test.jsonl is 0.856.
- Objective kept (debug fix A): if the finished Strong prompt no longer registers an objective (the Context example can trip the vague-verb rule), a blank-free objective is added after the generated Context. On a sure task with a generated Context, the fill-in objective becomes the blank-free list one ("List the specific items that answer this, one per line.") when the result stays Strong, but only for list tasks, and not when the user's own words ask for changed text (fix, rewrite, correct, ...) (intent errors, gaps, consistency, anomaly, map, questions, checklist, extract or compare); rewrite, explain, draft, summarize and similar tasks keep the fill-in objective. The fallback table wording for the format letter (P) gains a second variant.
- Tip: a prompt that says both "attached"/"uploaded" and "knowledge base" gets a tip to use one and, in chat, type @ and pick each file. Workiva's support page "Reference specific files in chat with Workiva AI" (updated 2026-09-09, opened 2026-10-18) gives: a maximum of 10 files per prompt; file types Word, Excel, images, CSV, PDF and Workiva Document (Word and Excel are ticked for AWS only, not Google or Microsoft); files must be uploaded to the workspace first; no size or page limit is stated. The tip gives no limit numbers. Live-test results: research/live-tests/results/2026-10-18-live-test-results.md.
- Live test: synthetic files and 13 cases (original, 73be350 Strong, new Strong) are in research/live-tests/ (cases.md is generated by make_cases.js; the files by `VENDOR=<npm dir> node make_live_fixtures.js`; each file carries planted answers listed in `fixtures/answer_key.json`). The live run was done with Ian on 2026-10-18; results are in research/live-tests/results/2026-10-18-live-test-results.md. A tricky batch followed on 2026-10-19 (6 messy or impossible prompts, typed and coach Strong, 2 runs each = 24 answers in Ian's sandbox, scored by Opus and Codex under research/live-tests/SCORING_RULES.md); results are in research/live-tests/results/2026-10-19-tricky-batch-results.md.
- Filler and questions (measured 2026-10-17, sim_customers + test): rewrites with filler (please, can you, ...) went from 66 Strong to 0 Better and 0 Strong; Strong rewrites containing "?" went from 89 to 69 (24 + 45).
- Every letter can be switched off (fix 4): when only Context is missing and another letter was found inside someone else's sentence (for example the objective inside the opening Source sentence), that letter still gets its own short blank-free sentence, so its toggle changes the text. Known limit: the sentence can repeat the ask ("Summarize the key points of the content." after "give a 100-word summary"; 4 of the 62 runs this changed).
- Missing data (2026-10-19): when the coach picks the anomaly task and the ask is about missing or blank items (missingAsk in engine/rewrite.js), Strong gets "Return a table: [columns or item], what is missing, where it should be." and "Do not fill in or estimate missing values." instead of the outlier table and rule. It counts as a missing ask when a missing/blank/empty word (or no data/values, without values) remains after two kinds of clause are cut: a conditional clause ("If X is missing, ...", cut from "if" to the next comma or sentence end) and a "don't guess/assume/estimate/fill ..." rule clause. The conditional exemption does not apply to an indirect question: "if" right after check, see, ask, confirm, find out or tell me/us ("Check if any suppliers are missing emissions data") is kept as the ask. Any wrong-value word anywhere in the prompt makes it mixed and the old outlier text stays: zero, invalid, negative, error(s), duplicate, exception, wrong, incorrect, outlier, anomaly, unusual, mismatch, suspicious, spike, out of place, inconsistent, typo. Known limits: "net zero", "ignore duplicates" and "Exceptions tab" also trip the word check or the ask. Grades, classifier, notes and tips are unchanged. Unit tests: tests/rewrite_unit.test.js ("missing-data: ...").
- File cannot support the ask (2026-10-19): when the `unsupported` note fires, the prompt is not already strong, and Strong has a generated Evaluate sentence, that sentence gets "If the file does not contain what this needs, say so instead of estimating." added at the end. A Strong prompt and a prompt with no generated Evaluate sentence are left as they were.

## Coach notes (T4, 2026-10-18)

Five warning notes, additive only (engine/rewrite.js, small diff beside the notes block; another run owns the engine, weights and rewrite text). Grades, weights, rule scores and rewrite text are unchanged; only the page's display rule changed. The display rule is one exported function, `ScopeRewrite.displayGrade(result, prompt)` (off-topic shows weak; strong with stacked asks shows better), used by the page and by fit-finder/tests/prompts-strong.test.js. For an off-topic prompt the page shows the off-topic note and no Better/Strong rewrite tabs. The page renders the personal, calc, stacked (not for off-topic), off-topic, grounding and unsupported notes; `node tests/pagetest.js` types real inputs into dist/prompt-coach.html in headless Chrome and checks them (run `node tests/build.js` first).
- personal: SSN (with dashes, or 9 digits after an SSN / social security word), date of birth or "born ... year", an account/card/routing/IBAN number (needs the word number/no/# or a bank/card word before the digits, or an IBAN-shaped code), or a person's salary (a name or employee/his/her with an amount, or "Name's salary"). Not fired by GL account numbers, loan amounts, salary expense, the word IBAN or approval routing. The page also warns on emails, card numbers and passwords.
- calc: asks to calculate, compute, sum, total or work out a figure. Workiva AI can get figures wrong; check against the source.
- stacked: the existing note also fires for a comma/and list of 3 or more distinct task verbs (listStacked in rewrite.js; rules.js stacked() is untouched because model features use it). coach() returns `stacked`, and the page downgrades strong to better with it.
- offtopic: only a clear non-work cue (weather, poem, joke, recipe, ...) with no work or document words and no attached file (fires on 1 of 2,020 non-off-task train/test rows). coach() returns `offtopic`; the page shows weak instead of a polished finance rewrite as strong.
- unsupported (2026-10-19): a warning when the attached file cannot support the ask. Only when a file has text. Two cases. Forecast: the ask wants a forecast, and no forecast, budget, plan, guidance, outlook, projection, target or estimate word (whole words, also Fcst, Bgt and FY26E-style headers) appears in the file's text; a sheet name does not count. A stock or share price alone is not a forecast ask. Scope 3 category: the ask says "Scope 3" and names a category N, the file's text says Scope 3 and recognises at least 2 categories, and category N is not listed in it (one name that fits two categories counts once). Explain asks are excluded from the Scope 3 category case only; the forecast case applies to them too. It is additive: it never changes the grade, a weight or the other rewrite text. Grounding rule: "FY25" counts as present when the file says "FY2025"; "FY26" is still flagged. Unit tests: tests/rewrite_unit.test.js.
- Grounding compound term (2026-10-19): "Q1 FY25" in the ask matches "FY2025 Q1" or "Q1 FY2025" in the file; only FY compounds, nothing else.
- Scope 3 categories (2026-10-19): "Upstream T&D" and "Downstream T&D" rows in the file count as categories 4 and 9.
- Known limits of the unsupported note: forecast phrasing such as "Forecast product revenue...", incidental category words, LE as a forecast basis, and future share-price asks are not handled.

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

- Grade matches the blind label 64.5% (78/121) at first, against 86% on `data/test.jsonl`; these
  prompts are more casual. No blind-weak prompt was graded strong.
- Casual wording, scored on a held-out half (61 prompts; patterns written from the other half
  only): 62.3% at first; 68.9% after relabeling 8 prompts to the owner's rule that a bare "this"
  ("make this sound less harsh") does not name a source, while "this para", "this journal entry"
  or "the doc" does; 70.5% after adding casual source and ask patterns. `data/test.jsonl` stays
  at 85.6%. Retraining with the tuning half added did not move the held-out half, so the shipped
  weights are unchanged. "the 10-K" still does not count as a source (the labeling guide treats
  it as a destination, as in "for the 10-Q MD&A").
- Rewrite changes, in rounds: (1) keep the user's own sentence; blanks instead of roles, counts,
  limits or unnamed sheets; name an attached file in the reason line. (2) When the task is unclear
  or the user asked their own question, add a blank finish line and format instead of a task
  template; tidy chat shorthand; keep decimals like "14.2%" intact. (3) With no file and no
  source named, the source is a blank; writing tasks "start from" it; audience examples follow
  the area only when the prompt has area words. (4) A bare "analyze our emissions data" keeps its
  subject: "For our emissions data: identify and list [...]" (the previous round dropped it;
  `customer_check.js` now checks this on `data/test.jsonl` too: 13 → 0).

| Reviewer measure (121 prompts) | Before | Round 1 | Round 2 | Round 3 |
|---|---|---|---|---|
| Strong version keeps what the user meant | 76 | 91 | 97 | 104 |
| ...of the 72 weak prompts | 33 | 43 | 50 | 56 |
| ...no file attached (61 prompts) | 41 | | 53 | 58 |
| Adds specifics the user never gave, no file attached | 29 | | 24 | 4 |
| Would copy it (1-5), all prompts | 2.76 | 2.99 | 3.27 | 3.25 |

**How far to trust this.** The reviewers are not consistent. On outputs that did not change
between two runs, "reads clumsily" went from 15 to 33 of 83, and "adds specifics" on 47
unchanged file-attached outputs went from 3 to 32. Read only large, repeated movements; the
deterministic checks in `tests/customer_check.js` and real prompts (`real-eval/`) are the
better evidence. The file-attached half is also skewed by the test setup: every second prompt
got a file of its area whether or not the prompt was about it.

Parked (Ian, 2026-10-20): when the coach rewrites a bare "analyze/review X" it can pick a task
format, which can be wrong if the task is misread. Measured 2026-10-20 on the training rows: 67
bare asks; the classifier guesses a task on 16 (in-sample, all match the label) and leaves a
blank on 51; scored out of fold it guesses on 1, wrongly; 0 of 13 live-test cases are bare.
Published work favours asking only when the task is unclear, which the blank already does. See
`research/2026-10-20-bare-analyze-format-probe.md`.

Still open: the reason line for weak prompts was generic, and often wrong for the prompt. Measured
2026-10-20 on the training rows (in-sample): 430 of 1,080 grade weak; on 147 of them the line names
something the prompt has (89) or misses its missing source or ask (63); two lines cover 45% of
them; 0 of 13 live-test cases grade weak. Ian chose (2026-10-20) a line that quotes the prompt's own
words. Built 2026-10-20 for the ask only (PM proxy for Ian; Ian may overturn): the weak headline on
"Your prompt" and `stages.weak.verdict` add `The coach read your ask as "<span>"`, only when the
detector is sure the ask is missing (p < 0.2); a vague verb followed directly by a colon (a field label) is
skipped. The source is never quoted (a source quote picked the wrong words 12 times in 17). The probe
counted 55 of 432 weak prompts reached out of fold, 0 wrong by label, 4 wrong words by eye before the
colon skip (probe counts, not re-measured here). The letters the line names are still the detector's;
naming only the letters the detector is sure of is still open (Ian's morning list). The earlier
147-of-430 probe measured the reason line, which no tab shows since 16a49e2; the headline names only
source and ask. The shipped out-of-fold count is in
`docs/evidence/2026-10-20-prompt-coach-quote-line.md`. See `research/2026-10-20-quote-line-probe.md`.
