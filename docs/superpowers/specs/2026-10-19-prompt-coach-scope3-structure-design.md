# Prompt coach: Scope 3 "in the file" by structure (design)

Date: 2026-10-19. Talk session: predecessor 3276bf06's redesign talk (talk prompt
`docs/PROMPT_COACH_KNOWN_LIMITS_REDESIGN_TALK_PROMPT.txt` on branch worktree-prompt-coach-known-limits).
Branch: `worktree-prompt-coach-scope3-structure`, from `prompt-coach` at 59b09c1 (contains 77ecb77).
Status: approved. Ian, 2026-10-19, on the written spec: "Approve the spec (Recommended)".

## Ian's rulings (verbatim, this talk)

- 2026-10-19, approach: "Fix Scope 3, document rest (Recommended)"
- 2026-10-19, design: "Yes, write the spec (Recommended)" (to the five-part design and pass bar in section 3)

Earlier ruling this builds on: 2026-10-19 17:15Z, "Ship the 2 clean fixes (Recommended)" (the known-limits run kept
C5 and S6, reverted C2, C4, S3, H4).

## 1. Problem (measured in this talk unless marked read)

The "file cannot support the ask" note (`prompt-coach/engine/rewrite.js`, `cannotSupport`, lines 434-450 at 59b09c1)
misses Scope 3 asks for a category the file does not report. On the spent held-out set
(`.ledger/2026-10-19-prompt-coach-known-limits/heldout_sealed.json`, now SEEN), the 5 Scope 3 should-warn items
K11, K12, K13, K23 and K24 are all quiet. A debug trace of the gate showed three causes, one per item group:

| Items | Cause (measured: gate trace and file text) |
|---|---|
| K11, K12 | The category name appears only in a passing remark ("cut business travel budgets in H2", "approved investments in sub-metering"), and `categoryHit` counts any mention as "listed". The ask also says neither "Scope 3" nor "category N" (K12) or only "cat 15" (K11). |
| K13 | "fuel and energy" appears only inside a Note cell of another row ("Excludes fuel purchased for fleet - see fuel and energy note"). |
| K23, K24 | A summary sheet with short labels ("Purch. goods & svcs", "Waste in ops", "Upstr. leased assets", "EOL treatment") and no "Scope 3" text: only 1 category is recognised, so the file is not taken as a Scope 3 list. |

The forecast and share-price misses (K3, K6, K7, K8, K20) are a different kind: open-ended wording. Probe of the 2,161
stored prompts in `prompt-coach/data/*.jsonl` (measured, all AI-written; `real-eval/` holds only the template, so no
real prompts exist): "forecast" 1 (a noun use, "the forecast table on this slide"), "share/stock price" 0, "price
target" 0, "predict" 0, "Scope 3" 75. Last run's word-pattern fixes for these did not generalise (sealed 2/12, same as
base; read, evidence doc section 3).

## 2. Scope

In scope:
1. Rule 1, "listed" means "has a figure": a category counts as in the file only when its name, its short label, or
   "category N" / "cat N" is followed within 60 characters by a figure, before any other category name or
   "category N" starts. A figure is a number (with optional thousands commas and decimals) that is not a 4-digit year
   (19xx/20xx), not glued to letters (FY2025, Q4, H2 do not count), and, when written without thousands commas, not
   directly followed by "%".
2. Rule 2, short labels: a fixed alias list for the 15 categories: `purch. goods`, `waste in op(s)`, `upstr.` /
   `downstr.` (transport, T&D, leased), `EOL`. The 15 full names in `CAT_NAME` stay as they are.
3. Rule 3, Scope 3 file: the file says "Scope 3", or it has at least two categories with figures (rule 1).
4. Rule 4, Scope 3 ask: the ask says "Scope 3", or it names a category in words (one of the 15 names or a rule 2
   alias). A bare "category 11" or "cat 11" without "Scope 3" stays quiet, as today (unit test C1 is unchanged). Every
   category named in words is checked against the file, as numbered ones already are.
5. README: replace the one-line limits note (README line 98 at 59b09c1) with a short known-limits list: forecast
   phrasing, future share or stock price, LE as a forecast basis, and the probe counts from section 1 as the reason
   they are left. Remove "incidental category words" from it in the same commit as rule 1. Update the dist byte count
   on README line 9 in the same commit as the code.

Out of scope: any change to forecast or share-price detection (C2, H4, S3/LE); grades, weights or a classifier; the
open items (1) Codex's warning on "Compare forecast Q4 revenue with Q3 actuals", (2) the Workiva AI sandbox check of the
T3 decline line, (3) the E1-8 primary quote; parked items Q2, Q3, Q5, T5, SOX ITGC and SUS-1 grounding flags,
"Summarize Scope" grounding flag; browser tests (pagetest.js, filetest.js); installs; live spend.

## 3. Success criteria, prediction, and what disproves it

Fresh held-out (first task of the run, before any code change): an Opus helper writes 24 new Scope 3 items, 12 that
should warn and 12 near-misses, covering file shapes (spreadsheet table, summary sheet with short labels, Word prose
note, PDF, slide, CSV) and ask shapes (category by name, by number with "Scope 3", by abbreviation, explain asks).
It must not reuse K1-K24 or the probe phrasings. It is saved, its sha256 recorded in the ledger, and it is opened only
by the lead's scoring script, once, after the last build task. The labeler marks items it is unsure of.

Pass bar (Ian approved, 2026-10-19): at least 10 of 12 should-warn items warn, and 0 of 12 near-misses warn.
Prediction: the bar is met. It is disproved by fewer than 10 warning, any near-miss warning, or any guard below
changing. No tuning after scoring; a miss is reported, not fixed in the same run.

Guards (each must be identical to base 59b09c1):
- Unit tests: the existing 57 pass unchanged; new tests are added only.
- 1,841 stored prompts: 0 warnings on train files (`dump_runs.js`), no-file Strong rewrites byte-identical.
- Fixtures: same (19).
- `simulate.js`, `customer_check.js`, `eval.js rulefeat`: output identical.
- Reviewer probe (`reviews/test/probe.test.js` of the known-limits run, retargeted): 0 rows differing from base, and
  all 9 C4 layouts (PDF 1 and 2 page, 2 slides, CSV, semicolon CSV, Word table, paragraph, bullets with and without
  commas) still warn; the dates sheet stays quiet.

## 4. Evidence from the talk's prototype (measured on a scratch copy, throwaway)

Scripts kept in `.ledger/2026-10-19-prompt-coach-scope3-structure/prototype/` (git-ignored): `patch.js` (rule 4),
`patch2.js` (rules 1-3), `probe_proto.test.js`. Against base on the same machine:

| Check | Base | Prototype |
|---|---|---|
| Unit tests | 57/0 | 57/0 |
| Spent Scope 3 should-warn items warning | 0/5 | 5/5 |
| Spent near-misses warning (all families) | 0/12 | 0/12 |
| 1,841 stored prompts, train warnings | 0 | 0 |
| No-file Strong rewrites, fixtures (19), simulate, customer_check, eval | | identical |
| Probe rows differing from base; C4 layouts warning | | 0; 9 of 9 |

Limits of this evidence: the rule was written while looking at the five spent items, so 5/5 shows the causes are
cured, not that the rule generalises; that is what the fresh held-out is for. A first prototype (rule 4 alone, by
number too) changed nothing on the spent set (2/12 both ways), and dropping "Scope 3" for a bare number broke unit
test C1, which is why rule 4 accepts only words.

## 5. Risks to watch (assumed, not tested)

- A prose note that puts the figure before the name ("1,240 tCO2e came from business travel") is not seen as listed,
  so an ask for that category would warn falsely. The held-out may catch it; if it does, it is reported, not tuned.
- A 60-character window can reach a figure belonging to the next line when no category name sits between them (a
  remark line followed by an unlabelled number).
- Numbered row labels ("1. Preparation", Codex R3 of the last run) next to a category name could read as a figure.

## 6. Build order for the run (tasks of at most 8 steps; tests first)

1. Opus writes and seals the fresh held-out (section 3); lead records sha256 and the bar.
2. Rule 1 and rule 2 with failing unit tests first (mention without a figure is not listed; short labels with a figure
   are listed; a Note cell does not list another category).
3. Rule 3 and rule 4 with failing unit tests first (summary sheet without "Scope 3" text; category named in words;
   bare number without "Scope 3" stays quiet).
4. README known-limits list and dist rebuild (byte count on line 9) in the same commit.
5. Lead scores the held-out once; guards re-run; final review (Opus plus Codex); evidence doc
   `docs/evidence/YYYY-MM-DD-prompt-coach-scope3-structure.md`.
