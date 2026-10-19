# Prompt coach: "the file cannot support this ask" (T3 / T6)

Talk session 70f99f21, 2026-10-19. Class: bounded (notes and one Strong line in `engine/rewrite.js`, one page
list, one scoring-rule text). Branch `worktree-prompt-coach-file-cannot-support` from origin/prompt-coach a7ba13f
(the T5 fix round 4e28a8c is in).

Labels: **measured** = run in this talk; **read** = from a file or ledger, not re-run; **assumed** = reasoning only.
Probe scripts and logs: `.ledger/2026-10-19-prompt-coach-file-cannot-support/` (git-ignored) `scripts/`, `logs/`.

## Rulings (PM proxy for Ian, proxy decided, Ian may overturn)

Ian was asleep; the PM proxy answers for him (his words 2026-10-19 06:50Z: "The PM should be able to approve on my
behalf to make sure that those 3 projects are completely done", and his pick "Yes, start it: all calls").
Lines in `studio-harness/.ledger/proxy/decisions.md`:

- 08:12Z: "Q1 = its Rec. (yes), FY25 item = in scope only as the small separate item it recommends".
  Q1 read: change R14(c) so a clear decline scores job 1 when the answer key says the file cannot support the ask.
- 08:21Z: fix approach "B (its Rec.), proxy decided": a coach note plus one decline line in the Strong rewrite.
  Its reply: keep the checks named (T3/T6 red then green; T3 Strong contains the decline line and still grades
  strong; all 1,841 + T1-T5 Strong byte-identical; non-explain gate on the category trigger); the sealed
  held-out set is fine.

## The problem (measured)

From the tricky batch (results file lines 92-93, 98, read): T3 "what will our stock price do next quarter based
on this" with @fr_flux_q3.xlsx keeps the forecast ask and gets no warning; T6 (calculate Scope 3 category 11 for
FY25 from @sus_ghg_inventory.xlsx) is returned unchanged although the file has no category 11. All 4 T6 answers
and both T3 answers declined, which R7 calls right and R14(c) scored job 0 (read, SCORING_RULES.md line 218).

Re-run on a7ba13f with the live-test fixtures fed to the coach the way `engine/files.js` reads them (sheet name +
rows as text; `scripts/file_probe.js`, measured):

- T3 notes: periods only. Strong: "Use only @fr_flux_q3.xlsx. This is for [what it feeds]. What will our stock
  price do next quarter based on this. Format it as [...]. Do not add facts that are not in the source, and list
  any open questions separately."
- T6 notes: calc, grounding ("FY25" not in the file), periods. "FY25" is a false alarm (the file says FY2025);
  category 11 is not caught (the grounding note only looks at capitalised phrases, Scope N and periods).
- On all 19 fixture-backed prompts (13 live cases + T1-T6) the grounding note flags 5 terms, all 5 false alarms:
  "FY25" (T6), "SOX ITGC" (GRC-2, a framework, not file content), and "Emissions Source", "Amount Unit",
  "Total Spend" (SUS-1, column names the user wants created). Only FY25 is in scope here; the other 4 are logged.

## Probe on the stored prompts (measured)

All 8 `data/*.jsonl`, 1,841 prompts. The stored prompts carry no file contents, so "category or period not in the
file" cannot be counted on them directly; two proxies were used.

1. Forecast asks. A broad net (forecast, predict, projection, will ... be/do, next quarter/year, outlook, stock
   or share price, guidance; then will, estimate, expect, scenario, future) caught 71 rows. Opus (this talk)
   read all 71: **0 ask for a forecast the file cannot support**. They are deadlines ("assurance next month"),
   guidance in the file, "what will the auditor ask", estimates in the data. T3 is the only example.
2. Category asks, each prompt paired with its area's fixture (FR flux, SUS GHG inventory, GRC RCM;
   `scripts/guard_probe.js`): a Scope 3 "category N" absent from the file by number and by GHG Protocol name
   fires on 5 rows, all explain asks (category 11 or 15 to be explained, the file not the source).
3. The stand-in files that `tests/simulate.js` and `tests/customer_check.js` attach carry headers only
   (`scripts/standin_probe.js`): the category check fires on 12 prompts (8 not explain), the forecast check on 1
   ("take the forecast table on this slide", a noun use). Both are fixed by the gates in the design.

Labels: `prompt-coach/research/2026-10-19-cannot-support-labels.tsv`, 76 rows, 0 positives (Opus, not Ian). Fresh
split by file: `train_*` = train (43 rows), `test`, `test_unlabeled`, `sim_customers` = held-out (33 rows). The
old label ids 1-15 of the missing-ask file are not used.

Because the stored data has no positives, a **sealed held-out set** was written in this talk before any pattern
existed: `.ledger/2026-10-19-prompt-coach-file-cannot-support/heldout_sealed.json`, 16 fixture-backed prompts
(8 should fire, 8 near misses). The plan writer, implementers and checkers must not read it; the run lead reads it
once after the build task is committed.

GHG Protocol Scope 3 category names 1-15 (purchased goods and services ... investments): **read** from a search
summary by a Haiku research helper; the Standard's PDF (ghgprotocol.org, Corporate Value Chain Standard) did not
fetch as text, so the names were not checked against its Table 5.3. They match the names this talk expected.

## Design

All in `engine/rewrite.js` beside the notes block, plus one page list. Grades, weights, classifier and every other
rewrite are unchanged.

1. **Cannot-support test**, only when at least one attached file has text (`f.text` non-empty):
   a. *Forecast with no basis*: the prompt asks for a prediction (predict, forecast as a verb or "forecast for",
      projection, stock or share price, "what will our/the X do/be/...") and no attached file's text has a
      forecast, budget, plan, guidance, outlook, projection, target or estimate word. A noun use about the file
      ("the forecast table on this slide") does not count.
   b. *Category not in the file*: the prompt names a Scope 3 "category N" / "cat N" / "cat. N"; the file lists
      Scope 3 categories (at least 2 recognised by number or GHG Protocol name); and category N is not among them
      by number, by its name, or by the name the user gave in brackets. Explain or definition asks
      ("explain", "what counts", "what does ... mean", "walk me through", or intent `explain`) do not count.
   Exact patterns: the plan writer's, tuned on the train rows only.
2. **Note** (new kind `unsupported`, additive): forecast: "You are asking for a forecast, but nothing in the
   attached file looks like a forecast, budget or plan, so Workiva AI can only guess. Ask what the file shows, or
   attach the forecast." Category: "Your file lists Scope 3 categories, but not category N[ (name)], so Workiva AI
   cannot work it out from this file." Wording may be tightened by the plan; plain English, no jargon.
   The page shows it: `web/template.html` adds `unsupported` to the list of warning kinds it renders (line 350).
3. **Decline line** in the Strong rewrite when the note fires and the prompt is not already strong: the generated
   Evaluate segment ends with "If the file does not contain what this needs, say so instead of estimating."
   A strong prompt is returned as typed (the coach's rule), so T6 gets the note only.
4. **FY item (separate task)**: in the grounding note, a fiscal or calendar year term counts as present when its
   other form is in the file (FY25 and FY2025, FY'25, FY 2025; the same for CY). FY26 against a file with only
   FY2024/FY2025 is still flagged.
5. **R14(c)** in `research/live-tests/SCORING_RULES.md`: a refusal stays job 0, except when the answer key says the
   file cannot support the ask: a clear decline that says what the file lacks is job 1 (R7 case). The R14(c)
   versus R7 paragraph and the results file's open question 1 record the ruling as proxy decided. Scores already
   given are not re-scored in this run (no live batch); the change applies to the next batch.

## Scope

In: `engine/rewrite.js` (the test, the note, the decline line, the FY match), `web/template.html` (one list),
`tests/rewrite_unit.test.js`, `dist/prompt-coach.html` rebuilt, `README.md` (notes section and wording rules,
dist byte count), `research/live-tests/SCORING_RULES.md` and the tricky results file (R14(c)), the labels file,
the evidence doc.
Out: the other 4 grounding false alarms (SOX ITGC, output column names); T1, T2, T4 findings; Q2, Q3, Q5 (parked);
classifier, weights, grades; any live Workiva AI run; any spend; any new dependency.

## Success criteria, each with a prediction and what would disprove it

| # | Check | Prediction | Disproved if |
|---|---|---|---|
| 1 | Unit: T3 typed with @fr_flux_q3.xlsx (fixture text): note `unsupported` present; Strong contains the decline line and grades strong | fails on parent, passes after | passes on parent, or fails after |
| 2 | Unit: T6 with @sus_ghg_inventory.xlsx: note `unsupported` names category 11; Strong byte-identical to the typed prompt | fails on parent, passes after | as 1 |
| 3 | Unit (FY task): T6 grounding note does not name "FY25"; FY26 against the same file is still flagged | fails on parent, passes after | as 1 |
| 4 | Strong rewrites, no files, all 1,841 stored prompts | byte-identical | any differs |
| 5 | Fixture-paired 1,841 (guard_probe pairing): `unsupported` fires | 0 (forecast 0, category 0) | any train row fires; a fire on the held-out test:177 pair ("walk me through", the explain gate's real test) is reported as a gate miss |
| 6 | Tricky T1-T6 Strong (fixture text) | only T3 differs, by the decline line only | any other change |
| 7 | Live cases (13) notes and Strong | unchanged except no "FY25"-type flags (none expected among them) | any change |
| 8 | Sealed held-out (16), read once by the lead after the build | at least 7 of 8 fire, at most 1 of 8 near misses fires | fewer than 7, or 2+ near misses |
| 9 | Must stay green (measured on a7ba13f) | unit 37/0 + new; simulate.js data/train_*.jsonl runs 2070, strongNotStrong 2, betterWeak 5, badText 2; customer_check PASS 229; eval.js rulefeat data/test.jsonl GRADE acc 0.856, flips 8 | any worse |
| 10 | Built page lists `unsupported` among rendered kinds (string check on dist) | present | absent |

`tests/pagetest.js` and `tests/filetest.js` need a Linux Playwright path (read, T5 evidence); the run reports them
as not run unless it finds a working one. The page rendering of the new note is therefore **not browser-tested**.
No answer-quality gain is claimed: there is no live run; this changes what the coach says.

## Known risks (assumed, each with its check)

- A large real file read past 200 rows or 60,000 characters (files.js limits) could hide a category that is
  there: a false note. Check: none possible offline beyond the fixtures; the note says "your file lists ... but
  not", which fails soft.
- The decline line could make Workiva AI decline asks it could answer. It is added only when the note fires
  (predicted 0 of 1,841 paired rows).
