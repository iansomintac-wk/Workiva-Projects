# Prompt coach: Scope 3 "not in the file" check, reshape after the failed bar (design)

Date: 2026-10-19. Talk session cba7d32e (talk prompt `docs/PROMPT_COACH_SCOPE3_RESHAPE_TALK_PROMPT.txt` on branch
worktree-prompt-coach-scope3-structure, predecessor run c846565a).
Branch: `worktree-prompt-coach-scope3-reshape`, from `origin/prompt-coach` at 59b09c1 (base). The scope3-structure
branch (fc40f5c) is evidence only and is not built on.
Status: approved. Ian, 2026-10-19, on the written spec (wider change-word list included): "Approve the spec (Recommended)".

Marking: **measured** = run in this talk; **read** = from a document, log or helper report; **assumed** = reasoned only.
Ledger (git-ignored): `.ledger/2026-10-19-prompt-coach-scope3-reshape/` (probe/SUMMARY.md, rulings.md; the
predecessor ledger is copied in as `predecessor-scope3-structure-ledger/`).

## Ian's rulings (verbatim, this talk, 2026-10-19)

- (c) which mistake is worse: "Wrong warning is worse (Recommended)"
- (a) explain asks: first "why is keep them quiet recommended vs treat like any other ask"; after the 9-ask counts
  (section 1): "Middle rule (Recommended)"
- (b) Word flattening: "Use clean lines in this check (Recommended)"
- approach: "A: base + small safe fixes (Recommended)"
- bar: "Zero wrong + beat base by 2 (Recommended)"

## 1. Problem and probe evidence

The previous run's sealed bar failed: 2/12 should-warn, 1/12 near-miss (base 1/12, 0/12); its edge probe found 8 new
false warnings, 4 listed-but-warns (E8, E10, E11, E15) and 2 lost base warnings (E7, E9) (read, evidence doc of
fc40f5c, sections 1, 4, 5). Its core rule ("listed only when a figure follows the name") errs toward warning: each
layout it misreads becomes a wrong warning. Base's "any mention counts as listed" errs toward quiet, which matches
ruling (c).

Probes this talk ($0, nothing installed; scripts and outputs in the ledger `probe/`):
- P1, real reader shape (measured): the real `engine/files.js` run in headless Chrome with its production cdnjs
  libraries over 6 hand-built Office-XML fixtures and the 7 repo fixtures. Word `text` glues every paragraph and table
  cell with no separator ("Business travel1,240"); Word `lines` from the same call is clean ("Business travel, 1,240").
  PowerPoint joins a slide's runs with spaces (a mid-word run split reads "Busi ness"); PDF is one line per page;
  Excel and CSV one line per row. The old `sealed_run.js` and the live-test SPECS built friendlier Word text.
- P1b (measured): HEAD fc40f5c never warns on a real Word table (D1). A scratch patch reading Word `lines` in the
  check made D1 warn for an unlisted category and stay quiet for listed ones; on HEAD it also made a Word capital-plan
  table (D4, no "Scope 3" text) count as a Scope 3 file, because HEAD's rule 3 accepts 2 category names with figures.
- P2 (helper sonnet/low; lead spot-checked 2 figures, measured): 1,516 unique stored asks; 60 say "Scope 3"; 0 name a
  category without "Scope 3"; 0 off-topic fires. Two public charts of accounts (ERPNext US 312 accounts, AU 235): only
  category 15 "investment" fires; 1 distinct category each. No real customer asks or sheets exist (limit).
- Explain asks (measured): 9 of the 60 stored Scope 3 asks hit the explain exception: 4 are definitions (no file
  needed), 5 need the file's figures, and 3 of those 5 are stacked asks where "explain" belongs to another request.

## 2. Scope (option A: base plus small safe fixes)

Built on base 59b09c1 `cannotSupport` (`prompt-coach/engine/rewrite.js`); the base gate stays: the ask says "Scope 3"
AND the file says "Scope 3", and at least 2 categories are listed.

1. Word clean lines: in the Scope 3 part of `cannotSupport` only, a Word file's text is `f.lines.join('\n')` when
   `lines` is present. The 4 other readers of `f.text` in `rewrite.js` (empty-file test, forecast check, area
   detection, grounding) and the page are unchanged.
2. Explain middle rule: the check is skipped only when an explain word (`CAT_EXPLAIN`) is in the same sentence
   (the engine's `sentenceSpans`) as the "Scope 3" or category mention, and that sentence has no change word (why,
   rose, rise, jumped, increase(d), decrease(d), fell, drop(ped), change(d), %, vs, versus, compared). The classifier's
   explain intent alone no longer skips the check.
3. Short labels count as listed: base `categoryHit` also accepts the short forms `purch. goods`, `waste in op(s)`,
   `upstr.` / `downstr.` (transport, T&D, leased), `EOL`. Direction: a category the file shows in short form is not
   reported missing.
4. README: the known-limits list says what is still not caught (a file or ask without "Scope 3" text, abbreviations
   such as FERA, the explain cases above, PowerPoint mid-word run splits) and that Word is read by lines; dist byte
   count updated in the same commit as the code.

Out of scope: HEAD's figure rule and its rules 3-4; option D (a "say so if it is not in the file" line in every Scope 3
strong version; it waits for Ian's Workiva AI sandbox check); any change to `files.js`; forecast, share-price or LE
detection; grades, weights, classifier; installs; live Workiva AI spend; tuning against any sealed set (S1-S24 and
K1-K24 are SEEN). Open for Ian, not this run: merge of the scope3-structure branch (lead recommends not), Codex's
"Compare forecast Q4 revenue with Q3 actuals" warning, the sandbox check of the decline line, the E1-8 eur-lex quote.
Parked: Q2, Q3, Q5, T5; SOX ITGC and SUS-1 grounding flags; "Summarize Scope" grounding flag; browser tests.

## 3. Success criteria, prediction, what disproves it

Fresh held-out (first task, before any code change): a blind Opus helper writes 24 new items, 12 should-warn and
12 near-misses, labelled by truth (does the ask need a category figure the file lacks?), not by our rules. Shapes:
Word table, Word prose, Word bullets, PDF, slides, Excel summary sheet with short labels, CSV; asks by name, by number
with "Scope 3", explain-with-figure, explain-definition (near-miss), stacked asks, finance asks and finance sheets
using category words (near-miss). No reuse of S1-S24, K1-K24 or the probe phrasings. The lead builds each file as a
real file (`probe/p1/make_fixtures.js` style), reads it with the real `files.js` in headless Chrome
(`probe/p1/run_reader.js`), and seals items plus frozen reader output plus the scoring script (sha256 in the ledger).
Opened once, by the scoring script, after the last build task; base and branch are scored on the same frozen output.

Pass bar (Ian, "Zero wrong + beat base by 2"):
- Hard: 0 of 12 near-misses warn; 0 new warnings against base on every probe row expected quiet: edge probe E1-E18
  of the predecessor ledger, the P1 real-shape files x the listed / listed-num / finance asks, the two ERPNext charts
  laid out as sheets with a figure per account, and the 1,516 stored asks with train files.
- Catches: the branch warns on at least base + 2 of the 12 should-warn items.
- Guards identical to base except intended changes named per task: unit tests (existing pass unchanged, new added
  only), 0 warnings on train files (`dump_runs.js`), no-file Strong rewrites byte-identical, fixtures (19),
  `simulate.js`, `customer_check.js`, `eval.js rulefeat` (guard list read from the predecessor spec; counts are
  re-measured at base in task 1).

Prediction: met, with a gain of +2 or +3 (assumed), all from Word items and explain-with-figure items. Disproved by any
near-miss warning, any new warning on a quiet probe row, or a gain under 2. A miss is reported, not tuned.

## 4. Risks (assumed, not tested)

- Rule 3 also raises the count of listed categories, so a summary sheet that says "Scope 3" and was below 2 now runs
  the check; a category it lists in a form still not recognised would warn. The hard bar covers it.
- Sentence splitting on stacked asks joined by commas keeps 2 of the 5 explain-with-figure stored asks skipped.
- Word `lines` caps at 2,000 entries; a longer document loses the tail for this check only.

## 5. Build order (tasks of at most 8 steps; tests first, each failing on base)

1. Held-out written and sealed (section 3); probe sets copied into the ledger; base guard counts measured.
2. Word clean lines, with a unit test built from the P1 reader output of D1.
3. Explain middle rule, with unit tests from the 9 stored explain asks (4 stay quiet, 3 checked, 2 stacked stay quiet).
4. Short labels as listed, with a unit test that a short-label row is not reported missing.
5. README and dist.
6. Score once; guards; probe rows; evidence doc `docs/evidence/YYYY-MM-DD-prompt-coach-scope3-reshape.md`.
7. Final review, Opus and Codex; fix round; stop for merge.
