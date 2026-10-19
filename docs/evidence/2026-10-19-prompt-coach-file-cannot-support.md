# Prompt coach T3/T6: the file cannot support the ask (evidence, 2026-10-19)

Spec: `docs/superpowers/specs/2026-10-19-prompt-coach-file-cannot-support-design.md`. Plan: `docs/superpowers/plans/2026-10-19-prompt-coach-file-cannot-support.md`.
Figures are labelled. "measured" means re-run on 8216cda (the final-review fix round; this commit changes only this doc) from the run ledger logs `logs/lead/fix_*.log`. "measured by the lead" means the lead ran it during the run and it is recorded in `progress.md` or `logs/lead/sealed_check8*.log`; this task did not re-run it. "read" means copied from `progress.md` or a spec.

## Success table (the spec's 10 checks), on 8216cda

| # | Check | Prediction | Result | Measured / read | Status |
|---|---|---|---|---|---|
| 1 | T3 with the flux file: note `unsupported`, Strong has the decline line and still grades strong | fails on parent, passes after | red 45/1 on 3b006aa (read); unit 53/0 now, test 38 passes | measured (after), read (red) | pass |
| 2 | T6 with the GHG inventory: note names category 11; Strong equals the typed prompt | fails on parent, passes after | red 40/5 on 20c5030 (read); test 39 passes now | measured (after), read (red) | pass |
| 3 | FY25 not flagged when the file says FY2025; FY26 still flagged | fails on parent, passes after | test 46 passes now; S4 fix: "FY2020" against an FY2024/FY2025 file is flagged again (lead probe) | measured (after), red 45/1 read | pass |
| 4 | Strong rewrites, no files, all 1,841 stored prompts | byte-identical | STRONG_NOFILES_IDENTICAL, total 1,841 | measured | pass |
| 5 | Fixture-paired 1,841: `unsupported` fires | 0 train fires | train fires 0 and held-out paired fires 0 (after4) | measured by the lead (held-out file not opened by this task) | pass |
| 6 | Tricky T1-T6 Strong, fixture text | only T3 differs, by the decline line | FIXTURES_OK stage3 (19) | measured | pass |
| 7 | Live cases (13) notes and Strong | unchanged | The 19 fixture runs are FR-1..4, GRC-1..4, SUS-1..5 (13 live cases) plus T1-T6; FIXTURES_OK stage3 (19); customer_check identical to baseline | measured | pass |
| 8 | Sealed held-out (16), read once by the lead | at least 7 of 8 fire, at most 1 of 8 near misses | Blind result on 3b006aa patterns: should-fire 8/8, near-miss 0/8, PASS; control on the parent engine 0/8 and FAIL, so the check can fail. Re-run after the fix round 8216cda, NOT blind (the lead had seen the set): 7/8 and 0/8, PASS. H4 ("Where will our share price go after the Q3 release?") stopped firing because the C1 fix removed the bare stock/share-price trigger; not tuned | blind: read, measured by the lead 08:55Z; re-run: NOT blind, measured by the lead 09:26Z | pass |
| 9 | Must stay green | unit 37/0 + new; simulate, customer_check, eval identical | unit 53/0 (8 new tests red 45/8 on the parent engine, read); sim/cust/eval logs identical to baseline | measured | pass |
| 10 | Built page lists `unsupported` among rendered kinds | present | DIST_OK; dist LF 334,009 bytes (was 328,503 on the parent); README grep matched | measured | pass |

Summary: 10 of 10 pass. Row 8 has a blind result (8/8) and a later non-blind re-run (7/8), both reported.

## Final review and ruling

- Reviews of 3dc88de: Opus (merge, 0 must-fix, S1-S6) and Codex (fix first, C1-C5). The lead's probes against the parent confirmed C1 (historical "stock price movements" falsely flagged), C2 ("Forecast Q4 revenue" missed), C3 (basis "Plant output" missed, "plan" prefix), C4 (incidental Scope 3 lines treated as a category list) and S4 (FY2020 regression). Measured by the lead.
- Fix round 8216cda fixed C1-C4, S4, S1, S3 and S5 (PM proxy ruling 09:20Z; C5 and S6 parked).
- Re-reviews of 8216cda: Sonnet said merge (28 probes, 0 new false positives); Codex said fix first (C1, C3, S1, S4, S5 fixed; C2, C4, S3 partial; two new warnings, see the limits below).
- PM proxy ruling 09:31Z: merge now, with all open items listed as known limits. Proxy decided; Ian may overturn.
- R14(c) (a clear decline may score job 1 when the file cannot support the ask) was proxy decided (commit 0d16f66, wording b563275). Ian may overturn it. Approach B, the spec and the plan were also proxy approved.

## Not run
- `tests/pagetest.js` and `tests/filetest.js`: not run (no Playwright path; nothing installed). Page rendering is not browser-tested; row 10 is a string check on the built file.
- No answer-quality gain is claimed: no live Workiva AI run was done on the new Strong text.
- The Scope 3 category names (1-15) came from a search summary, not checked against Table 5.3 (read).

## Known limits / parked follow-ups for Ian
From the final-review fix round (all measured by the lead or read from the re-reviews):
- C2 partial: "Forecast product revenue using this file" is still missed.
- C4 partial: a Scope 3 note that names "Business travel" and "Investments" counts as a category list.
- S3: "LE" is not taken as a forecast basis.
- Codex's "Compare forecast Q4 revenue with Q3 actuals" and "Explain how we used forecast FY2025 revenue..." now get the warning (the parent did not). Lead view: arguably correct, since the file has no forecast. Ian to decide.
- C5: the "Q1 FY25" compound term.
- S6: the "Upstream T&D" category name.
- H4 and "Estimate where the stock price goes next quarter" are missed (share or stock price with a future cue but no will-be/do verb).
- Pre-existing cosmetic grounding flag on "Summarize Scope".
Earlier parked items: Q2, Q3, Q5, SOX ITGC, SUS-1 column names, T5 known limits (see `2026-10-19-prompt-coach-missing-data.md`).

## T5 discrepancy settled
`missingAsk("missing net zero targets")` returns false (measured on the engine at the time; also false for "Which sites are missing net zero targets?" and "find suppliers missing net zero targets"; the lead measured false at 08:30Z). The earlier T5 line saying it fires was wrong and is corrected in the missing-data evidence doc.

## Cost of the run
Helper tokens: 891,694 across the 25 rows of `helper-rows.md` (sum of the tokens column, each row's own figure including resumed rows), against the 1.0M cap (raised from 750k and 900k by proxy rulings). It excludes the lead's own session, the earlier talk session, the Codex reviews (no token column in helper-rows.md), and this evidence task. Wall times are mostly "not measured".
