# Prompt coach T3/T6: the file cannot support the ask (evidence, 2026-10-19)

Spec: `docs/superpowers/specs/2026-10-19-prompt-coach-file-cannot-support-design.md`. Plan: `docs/superpowers/plans/2026-10-19-prompt-coach-file-cannot-support.md`.
Everything marked "measured" was re-run now on 56c29e1 (the parent of the evidence commit; code identical) (logs in the run ledger `logs/final/`, `logs/a_*.log`). "read" means copied from the run ledger `progress.md` or a spec, not re-run now.

## Success table (the spec's 10 checks)

| # | Check | Prediction | Result | Measured / read | Status |
|---|---|---|---|---|---|
| 1 | T3 with the flux file: note `unsupported`, Strong has the decline line and still grades strong | fails on parent, passes after | red 45/1 on 3b006aa (read); test 38 passes now, unit 46/0 | measured (after), read (red) | pass |
| 2 | T6 with the GHG inventory: note names category 11; Strong equals the typed prompt | fails on parent, passes after | red 40/5 on 20c5030 (read); test 39 passes now | measured (after), read (red) | pass |
| 3 | FY25 not flagged when the file says FY2025; FY26 still flagged | fails on parent, passes after | test 46 passes now | measured (after), red 45/1 read | pass |
| 4 | Strong rewrites, no files, all 1,841 stored prompts | byte-identical | STRONG_NOFILES_IDENTICAL | measured | pass |
| 5 | Fixture-paired 1,841: `unsupported` fires | 0 train fires | trainFires=0, forecast 0, category 0 (measured). Held-out pair test:177 ("walk me through"): did not fire, so no explain-gate miss (read, measured by the lead 08:55Z) | train measured, held-out read | pass |
| 6 | Tricky T1-T6 Strong, fixture text | only T3 differs, by the decline line | FIXTURES_OK stage3 (19 fixture-backed runs match the baseline except the T3 decline line); test 38 asserts the exact decline line | measured | pass |
| 7 | Live cases (13) notes and Strong | unchanged | The stage3 fixture comparison covers 19 cases: the 13 live cases FR-1..FR-4, GRC-1..GRC-4, SUS-1..SUS-5 plus T1-T6 (ids listed by the lead from logs/after3/fixture_runs.json). All 13 live cases unchanged (FIXTURES_OK stage3 (19)); customer_check output also identical to baseline (PASS 229) | measured | pass |
| 8 | Sealed held-out (16), read once by the lead | at least 7 of 8 fire, at most 1 of 8 near misses | should-fire 8/8, near-miss 0/8, verdict PASS; control on the parent engine 0/8 and FAIL, so the check can fail | read, measured by the lead 08:55Z (sealed file not opened by this task) | pass |
| 9 | Must stay green | unit 37/0 + new; simulate 2070, 2/5/2; customer_check PASS 229; eval acc 0.856 flips 8 | unit 46/0 (37 old + 9 new); simulate runs=2070, strongNotStrong 2, betterWeak 5, badText 2; customer_check PASS 229; eval acc=0.856 flips=8; SIM/CUST/EVAL logs byte-identical to baseline | measured | pass |
| 10 | Built page lists `unsupported` among rendered kinds | present | `chk.sh dist 1`: list-of-kinds=1, decline=1, DIST_OK; dist blob 328,503 B before, 333,428 B (LF) after, README says 333,428 and the blob grep matched | measured | pass |

Summary: 10 of 10 pass; row 7 is measured through the stage3 fixture comparison, which includes the 13 live cases.

## Not run
- `tests/pagetest.js` and `tests/filetest.js`: not run (no Playwright path; nothing installed). Page rendering is not browser-tested; row 10 is a string check on the built file.
- No answer-quality gain is claimed: no live Workiva AI run was done on the new Strong text.
- The Scope 3 category names (1-15) came from a search summary, not checked against Table 5.3 (read).

## Ruling
R14(c) (a clear decline may score job 1 when the file cannot support the ask) was proxy decided (commit 0d16f66, wording b563275). Ian may overturn it. Approach B, the spec and the plan were also approved by the proxy (progress.md).

## Parked
Q2, Q3, Q5, SOX ITGC, SUS-1 column names, T5 known limits (see `2026-10-19-prompt-coach-missing-data.md`).

## T5 discrepancy settled
`missingAsk("missing net zero targets")` returns false (measured now by node on HEAD; also false for "Which sites are missing net zero targets?" and "find suppliers missing net zero targets"; the lead measured false at 08:30Z). The earlier T5 line saying it fires was wrong; it is corrected in the missing-data evidence doc in this commit.

## Cost of the run (sum of the token column in progress.md)
Rows with figures add to 632,294 tokens (plan 99,603; plan reviews 53,808 + 110,068 + 75,480; T1 49,536 + 25,702; T2 38,258 + 22,451; T3 29,793 + 20,607; T4 27,570 + 18,472; T5 33,522 + 27,424), plus 16,177 for the Haiku research helper in the earlier talk, 648,471 in all against a 750k cap. Rows with no figure: the lead's own session, the earlier talk session, this evidence task, and the Codex plan review's wall time. Wall times are mostly "not measured". T4 and T5 implementer rows are cumulative figures.
