# Prompt coach: Scope 3 "in the file" by structure, evidence 2026-10-19

Marking: **measured** = a command was run in this run (the ledger row says so). **read** = taken from a document, a helper or reviewer report, or a log; not re-run for this write-up. "Assumed" = reasoned, not run. The ledger (`.ledger/2026-10-19-prompt-coach-scope3-structure/`) is the authority for what was run; it is not committed, so the facts needed from it are copied here. Branch `worktree-prompt-coach-scope3-structure`, base `59b09c1`, HEAD `b7c34f5`. Dollar cost: not measured (usage only; Ian approved "Nothing" extra spend).

## 1. Result in one paragraph

The sealed held-out test FAILED its bar. The bar was at least 10 of 12 should-warn items warn and 0 of 12 near-misses warn; the result was 2 of 12 should-warn and 1 of 12 near-miss (measured, scored once at HEAD `b7c34f5`). The prediction that the bar would be met is disproved. Per the spec the result is reported and was not tuned: no code, test or data changed after scoring. For diagnosis only (not a second score), the base engine run through the same script gives 1 of 12 and 0 of 12 (measured), so the change gained one should-warn item (S17) and added one false warning (S24). All guards (section 3) are identical to base. Both final reviews and the lead's edge probe found new false warnings and some lost correct warnings. The lead recommends not merging. Ian's push and merge ruling already says "No, stop for me" for the merge.

## 2. What was built

Spec: `docs/superpowers/specs/2026-10-19-prompt-coach-scope3-structure-design.md` (approved by Ian, 2026-10-19). Plan: `docs/superpowers/plans/2026-10-19-prompt-coach-scope3-structure.md`, approved by Ian with plan sha256 `4a40c12b..` (Opus and Codex reviewed). All code is in `prompt-coach/engine/rewrite.js` (`cannotSupport` and helpers), with `prompt-coach/dist/prompt-coach.html` rebuilt and `prompt-coach/README.md` updated in the same commits. Nothing else under `engine/` or `web/` changed (final Opus review, read).

| Task | Commit | What it does | Unit tests after (measured) | dist LF bytes (read, implementer) |
|---|---|---|---|---|
| Plan | `b49229b` | Approved plan | - | - |
| A | `286e37c` | Rule 1: a category counts as "listed" only when its name, short label, or "category N" is followed within 60 characters by a figure (not a year, not glued to letters, not a bare percentage), cut at the next category. Rule 2: short labels (`purch. goods`, `waste in ops`, `upstr.`/`downstr.`, `EOL`). Removed "incidental category words" from README. | 65/0 (red on parent 57/8, measured by lead) | 337,205 |
| B | `699f182` | Rules 3-4: a file counts as Scope 3 if it says "Scope 3" or has at least two categories with figures; an ask counts as Scope 3 if it says "Scope 3" or names a category in words. Rule 3 counts names and labels only (plan decision C1). | 69/0 (red on parent 65/4, measured) | 337,854 |
| C | `b629753` | README known-limits list only (+11/-1 lines). | 69/0 | unchanged |
| D | `b7c34f5` | Number rows list a category again, with a figure (restores the base's "row starting `6, 1200`" behaviour, now requiring a figure on that same row). | 72/0 (red on parent 69/3, measured) | 338,240 |

Task D was added by Ian's ruling (verbatim, about 18:35Z, session c846565a): "Fix it as Task D (Recommended)". Reason: the lead found that a spreadsheet or CSV note with number-only rows (`1, 4910 / 6, 1200 / 7, 398`) and an ask for an absent category fired at base but was quiet after Task B (measured). Cause shown by code: the base `categoryHit` counted rows starting `N,`; plan ambiguity 3 dropped that, so such a table listed 0 categories and the check never ran. Task D's one deviation: the row-start figure is read from its own line only, because a 60-character window took the next row's figure (test 3 caught it; read, implementer).

Each of A, B, D: red first on the parent commit, then implementer, an independent checker (all PASS), and a lead re-run of the guards (measured).

## 3. Guards, base vs HEAD

Base `59b09c1` (measured, BASE-GUARDS) against HEAD `b7c34f5` (measured, LEAD-RERUN-D). The same guards were also run after A and B and were identical each time.

| Guard | Base | HEAD | Same? |
|---|---|---|---|
| Unit tests | 57 pass / 0 fail | 72 / 0 (15 new, none removed) | 15 new tests, old 57 unchanged |
| Stored prompts compared (`DUMP`) | 1841 rows, 0 train fires | 1841 rows, 0 train fires | identical |
| Strong text with no files | baseline | identical | identical |
| Fixture runs | 19 | 19, same | identical |
| Probe (base vs branch) | 0 DIFF; C4 9 of 10 rows warn (9 layouts), `datesSheet` quiet | 0 DIFF; C4 9, `datesSheet` quiet | identical |
| simulate (`SIM`), runs 2070 | strongNotStrong 2, betterWeak 5, badText 2 (log of the Task A check, read) | identical (`SIM_IDENTICAL`) | identical |
| customer_check (`CUST`) | PASS 229 (log, read) | identical | identical |
| eval rulefeat (`EVAL`) | acc 0.856, flips 8 (log, read) | identical | identical |
| Browser tests (pagetest.js, filetest.js) | not run | not run | parked |

The guards pass because none of them exercises a Scope 3 file with category rows against a Scope 3 ask: train prompts run against one fixed Excel file (final Opus review, read, `scripts/dump_runs.js:31`). "0 train warnings" therefore says little about rules 3-4.

## 4. Held-out result

**How it was written.** A blind Opus helper (general-purpose, told nothing of the engine) wrote 24 Scope 3 items: 12 should-warn and 12 near-misses, six file shapes with 4 items each. The lead's acceptance check passed (counts 24, 12, 12, 24). The labeler marked two items unsure: S12 (labelled fire) and S24 (labelled quiet). The file `heldout_sealed.json` was sealed with sha256 `78685e6b8d5fc50ec7a4653be6308b6ed7236d6fc7b930fb9a38c3328d3687bb` at 17:22Z, before any code change; the scoring script `sealed_run.js` has sha256 `31ce8a79ccfc380549046851a5f6349cd117e9b66b0b04c0606aab66c0fc5564`. The bar was fixed before sealing and never edited: at least 10 of 12 should-warn warn and 0 of 12 near-misses warn; unsure items count as labelled. The lead opened the file only by running the script, once, at 19:46Z (both shas re-verified equal to the seal).

**Score (measured, `logs/sealed_score_b7c34f5.log`).** Should-warn 2/12 fired (S6, S17); near-miss 1/12 fired (S24). Verdict FAIL.

| Item | Expected | Got | Cause (gate order in `cannotSupport`: 1 explain ask is quiet, 2 ask must say "Scope 3" or name a category in words, 3 file must say "Scope 3" or have at least two named categories with figures, 4 at least two categories listed, 5 asked category checked) |
|---|---|---|---|
| S6, S17 | warn | warned | pass |
| S1 | warn | quiet | gate 2: ask uses abbreviations (FERA, T&D) |
| S4 | warn | quiet | gate 3: Word prose, no "Scope 3", no categories with figures |
| S7 | warn | quiet | gate 1: "Explain ..." ask |
| S9 | warn | quiet | gate 3: CSV with a numeric `cat_no` column, no "Scope 3" words |
| S12 (unsure) | warn | quiet | gate 3: spend register, no Scope 3 words |
| S13 | warn | quiet | gate 3: Scope 1 fleet note |
| S15 | warn | quiet | gate 1: "Explain ..." ask (gate 3 also fails) |
| S20 | warn | quiet | gate 1: classifier intent is explain (the explain word pattern does not match) |
| S22 | warn | quiet | gate 1: classifier intent is explain (gate 2 also fails: abbreviation) |
| S23 | warn | quiet | gate 1: "Explain ..." ask (gate 3 also fails) |
| S24 (unsure, near-miss) | quiet | warned | gate 5: "Category 9 is included in Category 4" is not read as covered |
| other 10 near-misses | quiet | quiet | pass |

**Diagnosis by gate (read, `reviews/heldout_diagnosis.md`; a sonnet helper traced an engine copy and its fired/quiet pattern matched the official score for every traced item).** Of the 10 misses: gate 1 (explain asks) 5; gate 2 (abbreviations only) 1; gate 3 (file not recognisably Scope 3) 4; gate 4 none. Plus the one false warning at gate 5. The explain-ask gate predates this run, and spec section 3 listed explain asks as an ask shape the labeler should cover; the labeler treated "Explain ..." asks that need a figure from the file as should-warn, the engine treats all explain asks as quiet. That is a rule question for Ian, not a tuning question. The helper's note that S20 would then need the figureless "Not relevant" row to count as unlisted is assumed, not traced.

**Base comparison (measured by the helper, diagnosis only, not a second score).** Base engine through the same script: should-warn 1/12 (S6 only), near-miss 0/12. So HEAD gained S17 and added S24; the other 10 misses are unchanged from base.

**Evaluation-fidelity limit.** `sealed_run.js` builds file objects that keep Word newlines, but production `engine/files.js:51` flattens Word text with `replace(/\s+/g, ' ')` (lead, code read). Held-out Word items were therefore scored on a friendlier shape than production gives. Excel rows are joined by newlines; PowerPoint and PDF text joins with a space within each slide or page (code read). The score may overstate Word behaviour; it was not re-scored in production shape.

## 5. Reviews

**Plan, Opus (read, `reviews/plan_review_opus.md`).** Ran the plan's code on a scratch copy of base: unit 57/4 to 61/0 and 61/3 to 64/0; all guards equal base after A and B. One must-fix (M1: Task B kept the old `lower.includes(given)` path, so a numbered ask with a name stayed quiet on a file that mentioned the name only). Six should-fix: S1 unit-suffixed values (1.2m, 80k) are not figures; S2 no test for the window cut at the next category; S3 a `;` in the waste pattern goes beyond the spec; S4 rules 3-4 may read expense or capex sheets as Scope 3; S5 README "2,161" counts rows, not prompts (1,841 prompts); S6 README limits list lacked the new limits.

**Plan, Codex (read, `reviews/plan_review_codex.md`, CLI 0.162.0).** R1 same as Opus M1. R2: 2025.5 was rejected as a year. R3: `1,240tCO2e` got accepted because a prefix "1" matched. Verdict after round 1 and round 2: REVISE. R4: a grouped number backtracked (`1,240.5tCO2e`, `1,240,500tCO2e` accepted). R5: the 60-character window truncated a token (`12%` read as `1`). The lead re-ran R4 and R5 and confirmed both (measured). Round 3: **APPROVED**, no material defects. Dispositions (read): accepted M1/R1, R2, R3, S2, S3, S5, S6, R4, R5; rejected S1 (beyond spec, listed in README limits); S4 sent to Ian at approval (Ian accepted the risk as in the spec).

**Final, Opus (read, `reviews/final_opus.md`).** Must-fix 0, should-fix 4, notes 7. Ran: 72 unit tests pass; the committed dist is 338,240 bytes and matches the code (every changed line appears in both). Should-fix: (1) rules 3-4 let finance asks into the Scope 3 check (category words matched with no word edges: "reinvestment", file name "@Investments.xlsx", "commut", "franchis"); (2) rule 1 loses base warnings on transposed tables and on prose without figures, and README does not say so; (3) README line 96 does not describe Task D number rows; (4) no unit test for the false-positive side of rule 4 or for those layouts. Reviewer's own merge note: the sealed result is about a wash against base (+S17, -S24) and it would not merge before its probe ran. Its own probe was refused by the role hook, so its edge results were assumed until the lead ran it (below).

**Final, Codex (read, `reviews/final_codex.md`, fresh inspect, verdict REVISE).** R1 (high): the sealed bar failed and needs Ian's disposition, with no tuning against the scored set. R2 (medium): `files.js:51` flattens Word text, so Task D's number-row rule (needs a newline) never fires on real Word files, and the Word test supplies artificial newlines. R3 (medium): the leased-assets generic fallback deletes the directional names before the figure window, so `Purchased goods, 5200 / Leased assets, n/a / Upstream leased assets, 80` lets the generic row borrow the 80. These were static source traces, not runtime reproductions (Codex's own limitations).

**Lead edge probe (measured, `logs/final_opus_probe.log`).** The lead ran the reviewer's probe read-only (engine plus `git show` base; 0 held-out references) over 22 edge inputs. Dist fresh LF 338,240 equals the committed blob. 14 rows DIFFER from base (the brief said 12; see the count below).

| Row | Case | Base | HEAD | Kind |
|---|---|---|---|---|
| E1 | ask on investment (summarize) | quiet | warns cat 15 | new false warning |
| E2 | ask on commuting (summarize) | quiet | warns cat 7 | new false warning |
| E3 | ask on capex (extract) | quiet | warns cat 15 | new false warning |
| E4 | expense sheet, franchise | quiet | warns cat 14 | new false warning |
| E5 | expense sheet, investment (compare) | quiet | warns cat 15 | new false warning |
| E6 | balance sheet, capital goods | quiet | warns cat 2 | new false warning |
| E17 | ask with waste as a prefix | quiet | warns cat 5 | new false warning |
| E18 | ask on reinvestment (summarize) | quiet | warns cat 15 | new false warning |
| E8 | value-first row, cat 6 (listed) | quiet | warns cat 6 | listed category now warns |
| E10 | long description, cat 1 (listed) | quiet | warns cat 1 | listed category now warns |
| E11 | k-suffix value, cat 6 (listed) | quiet | warns cat 6 | listed category now warns |
| E15 | year-valued row, cat 6 (listed) | quiet | warns cat 6 | listed category now warns |
| E7 | transposed table, cat 11 | warns cat 11 | quiet | lost correct base warning |
| E9 | prose with no figures, cat 11 | warns cat 11 | quiet | lost correct base warning |

That is 8 new false warnings on finance asks and sheets (E1-E6, E17, E18), 4 where a category the file lists now warns (E8, E10, E11, E15), and 2 lost base warnings (E7, E9). Correction, out loud: the brief said 12 DIFF rows; the log has 14 lines marked DIFF (counted just now, measured), and the table lists all 14. Rows E7b, E8b, E12, E13, E13b, E14, E14b and E16 matched base.

## 6. Corrections the lead made out loud (from the ledger)

1. **Path slip with the sealed file (about 17:5xZ).** The lead's path conversion `${T//\//}` produced `C:/Users/teasp/.claude/jobs/c846565atmp` (a missing slash), and the sealed file and the scratch Codex home landed there. The lead moved them into `jobs/c846565a/tmp`, removed the stray empty directory with `rmdir`, and re-verified the sealed sha `78685e6b..` unchanged. The sealed file was not opened.
2. **Word-regression overstatement (LEAD-CORRECTION after Codex R2).** The lead's earlier finding (18:2xZ) said the number-only-rows regression was real. Code read shows it was real for spreadsheets and CSV only; for real Word files base and HEAD were both quiet, because the row rule needs newlines and `files.js:51` flattens Word text. The same read showed `sealed_run.js` keeps Word newlines, so held-out Word items were scored on a friendlier shape than production.
3. **Brain-skip reason.** The lead skipped brain capture at `b49229b` saying "work repos do not feed the brain". That was wrong: the remote is `github.com/iansomintac/workiva`, owner `iansomintac`, so the rule does not apply. Brain capture runs before the hand-off commit.

## 7. Cost per dispatch (from ledger rows; read)

Dollars: not measured on every row. "Tool uses" for some rows come from the helper notification and include refused calls (marked by the ledger). Codex tokens are as reported in its result (input includes cache; resumed sessions look cumulative, so Codex rows are not added to the helper total).

| Dispatch | Model | Tokens | Tool uses | Wall time | $ |
|---|---|---|---|---|---|
| Held-out writer | Opus (general-purpose) | 87,927 | 6 | 4m08s | not measured |
| Plan writer | Sonnet | 76,693 | 16 | 4m24s | not measured |
| Plan review (Opus) | Opus | 133,694 | 24 | 10m13s | not measured |
| Plan review (Codex R1) | Codex | in 257,871, out 2,898 | - | 75s | not measured |
| Plan revise 1 | Sonnet | 65,372 | 8 | 2m36s | not measured |
| Plan review (Codex R2) | Codex | in 517,076, out 4,392 | - | 42s | not measured |
| Plan revise 2 | Sonnet | 70,953 | 10 | 3m09s | not measured |
| Plan review (Codex R3) | Codex | in 734,539, out 5,613 | - | 34s | not measured |
| Task A implementer / checker | Sonnet | 40,804 / 24,792 | 14 / 14 | 2m16s / 1m46s | not measured |
| Task B implementer / checker | Sonnet | 37,699 / 23,319 | 19 / 15 | 3m03s / 1m41s | not measured |
| Task C implementer / checker | Sonnet | 26,564 / 18,707 | 7 / 8 | 1m22s / 24s | not measured |
| Task D implementer / checker | Sonnet | 39,626 / 22,136 | 24 / 15 | 6m01s / 1m49s | not measured |
| Held-out diagnosis | Sonnet | 70,440 | 8 | 1m31s | not measured |
| Final review (Opus) | Opus | 83,700 | 25 | 7m35s | not measured |
| Final review (Codex) | Codex | in 872,614, out 3,626 | - | 95s | not measured |

Totals (my sums of the rows above, measured by hand-add): helper tokens 822,426 (all non-Codex rows); helper tool uses 213; helper wall time about 52 minutes (3,118 s); Codex wall time 246 s. The ledger's own BUDGET row (measured with the helper-budget counter) said 460,457 helper tokens at plan approval, against 434,639 from adding the rows up to that point; the 25,818 gap is the talk session's own helper (row aafff0b7 in helper-rows.md, written before this run began), which the counter's file includes (lead, checked against helper-rows.md). Counter total after this doc was written (lead, summed from helper-rows.md, measured): 936,788 tokens in 17 rows, of which 910,970 are this run's (the 25,818 talk row excluded); that includes this evidence writer (89,224), which the hand-add above does not. The small gap to the hand-add comes from notification figures vs counter figures. Run token cap 1,200,000 (Ian raised it from 800,000). Spend beyond usage: $0.

Run start 17:13Z; plan approval about 17:55Z; Task D ruling about 18:35Z; score 19:46Z.

## 8. Ian's rulings (verbatim, 2026-10-19)

- Slip words (copied from `slip.json`, since the ledger is not committed): "AskUserQuestion answers 2026-10-19 (talk session, predecessor 3276bf06; typed by Ian, he started this talk himself): push = \"Yes, push its branch (Recommended)\"; merge = \"No, stop for me (Recommended)\"; spend = \"Nothing (Recommended)\"; new sessions = \"Yes, when needed (Recommended)\""
- Talk, approach: "Fix Scope 3, document rest (Recommended)".
- Talk, design: "Yes, write the spec (Recommended)".
- Talk, spec: "Approve the spec (Recommended)".
- Earlier ruling this builds on (17:15Z): "Ship the 2 clean fixes (Recommended)".
- Run, about 17:55Z, plan: "Approve the plan (Recommended)" (plan sha256 `4a40c12b..`, risk S4 accepted as in the spec); token cap: "Raise to 1.2M (Recommended)".
- Run, about 18:35Z, number-only rows: "Fix it as Task D (Recommended)".

No ruling yet on the failed sealed bar or on the merge of this run.

## 9. Open for Ian / next talk

1. **Merge decision.** The lead recommends not merging. Reason: the bar failed (2/12 and 1/12), the sealed gain over base is one item against one added false warning, and the edge probe found 8 new false warnings on finance asks and sheets plus 2 lost correct base warnings. Ian's earlier merge answer is "No, stop for me".
2. **False-warning class from rules 3-4.** Category words match with no word edges and any two ledger rows with a shared name and figures make a "Scope 3 file" (E1-E6, E17, E18). It follows the spec, so it is Ian's call; the fix needs a new talk and its own held-out set, since this one is spent and must not be tuned against.
3. **Explain-ask gate against the held-out's explain items.** 5 of the 10 misses are "Explain ..." asks the engine keeps quiet by design. Decide whether an explain ask that needs a figure from the file should be coached.
4. **Word flattening.** `files.js:51` flattens Word text, so the Task D number-row rule never fires on real Word files, and the Word unit test uses artificial newlines. Needs a fix using the reader's structural lines, and a test in the real reader shape.
5. **Leased-assets window (Codex R3).** The generic fallback can borrow a downstream row's figure.
6. **Harness fidelity.** `sealed_run.js` keeps Word newlines, production does not; any future held-out score should use the production file shape.
7. **Other small items from the reviews.** README line 96 does not describe Task D number rows; README limits list does not mention transposed tables or figureless prose; no false-positive unit tests for rule 4; the gap in the guards (train prompts run against one fixed file).
8. **From the run prompt, open for Ian (not this run).** Codex's warning on "Compare forecast Q4 revenue with Q3 actuals"; a Workiva AI sandbox check of the T3 decline line; the E1-8 primary quote (eur-lex, Reg. 2023/2772).
9. **From the run prompt, parked.** Q2, Q3, Q5 and T5 known limits; SOX ITGC and SUS-1 grounding flags; the "Summarize Scope" grounding flag; browser tests (pagetest.js, filetest.js).
