# Prompt coach known limits: evidence (2026-10-19)

Plan: `docs/superpowers/plans/2026-10-19-prompt-coach-known-limits.md`. Research: `docs/research/2026-10-19-scope3-names-e1-8.md`. Base: d7dde04. Final HEAD at the time of the last check: 42e1b32.
Labels. "measured by the lead" or "measured by a helper" means that party ran it during the run and recorded it in `progress.md` or the run logs; the task that wrote this doc did not re-run it. "read" means copied from `progress.md`, a review file or a log. Only the helper-token sum and the probe DIFF counts were re-counted while writing this doc (measured now, from `helper-rows.md` and `logs/final_probe.log`). The sealed held-out file was not opened by this task.

## 1. Outcome
Of 6 built fixes, 2 shipped and 4 were reverted.
- Shipped: C5 "Q1 FY25" (32931d1) and S6 "Upstream/Downstream T&D" (f2f7b27).
- Reverted: C2 (af4f5a4), C4 (5d9b4c6), S3 (2270a61), H4 (a86f198).
- Why: Ian's ruling at 17:15Z, verbatim: "Ship the 2 clean fixes (Recommended)". The final review probe had found false fires or lost fires in the four (section 4). Read from `progress.md`.

## 2. Each built task was red first, then green (read, from progress.md; checker PASS on each)

| Task | Fix | Commit | Red | Green | Checker | Kept |
|---|---|---|---|---|---|---|
| T1 | C2 | 144694c | 54/1 | 55/0 | PASS | reverted |
| T2 | C4 | cc9eab5 | 56/1 | 57/0 | PASS | reverted |
| T3 | S3 | 7c4949e | 58/1 | 59/0 | PASS | reverted |
| T4 | C5 | 32931d1 | 60/1 | 61/0 | PASS | kept |
| T5 | S6 | f2f7b27 | 62/1 | 63/0 | PASS | kept |
| T6 | H4 | cfad8ae | 64/1 | 65/0 | PASS | reverted |

Counts are unit tests pass/fail. Each task also logged: 1,841 stored prompts with train fires 0, no-file Strong identical, fixtures same (19), full suite identical. Tune edits: 0 where recorded. T3: the first edit lost regex backslashes (scripted edit); it was fixed and all checks re-run. The task-to-fix mapping for T1 to T5 comes from the red test names in progress.md; T6 = H4 is by elimination from the four reverted tasks (1, 2, 3, 6).

## 3. Sealed held-out (24 fresh items, Opus-labelled, sha256 cf62b35d..)
Bar set by the lead at 15:17Z, before any scoring: PASS = should-fire at least 10/12 and near-miss at most 2/12. Scored once, on cfad8ae (after the last build task, 16:19Z). Read from `progress.md`; logs `logs/sealed_after.txt`, `logs/sealed_base.txt`.

| Run | Should-fire | Near-miss | Fired ids | Verdict |
|---|---|---|---|---|
| Blind, cfad8ae | 2/12 | 0/12 | K1, K2 | FAIL |
| Control, base d7dde04 | 2/12 | 0/12 | K1, K2 | identical, so no gain |
| Re-run on final HEAD after the revert (NOT blind) | 2/12 | 0/12 | K1, K2 | identical to base |

The labeler was unsure of K7 and K20.
Misses by family (read, from the lead's reading after scoring, no tuning):
- Wording outside the fixed patterns: K3 ("rev forcast" typo), K6 (share price "lands"), K7 ("stock move"), K8 ("price target").
- Scope 3 asks against a methodology note or summary sheet, not treated as a category list: K11, K12, K13, K23, K24.
- K20: a YTD-actuals forecast ask (labeler unsure).

Reading: the fixes cure the named cases with zero regressions, but they did not generalize (an overfit signal). Report only; no tuning after scoring. The harness check ran known unit cases through the scorer and 3/3 fired, so the scorer is not the cause for those shapes.

## 4. Final review probe (before and after the revert)
Probe `reviews/test/probe.test.js` on cfad8ae against the base, run by the lead, log `logs/final_probe.log`. DIFF rows counted now from that log (measured now); the false/lost reading is the lead's (read).

| Family | DIFF rows in log | Reading |
|---|---|---|
| H4 | 10 | 9 new false fires on past or deadline asks ("Show how the stock price moves after the Q3 earnings release, using this file"); 1 intended gain ("Estimate the share price next quarter") |
| C2 | 5 | 4 new false fires ("Explain why forecast product revenue differs from actuals in this file", "Check whether forecast EMEA revenue was entered correctly in this file", ...); 1 intended gain ("Forecast product revenue using this file") |
| C4 | 7 | 6 lost fires (2-page PDF, 2-slide deck, semicolon CSV, Word paragraph, Word bullets with and without commas or dashes) and 1 new fire (a dates sheet) |
| LE (S3) | 3 | 3 lost fires ("Entity, LE", "LE (Lebanon)", "Account / LE / Actual") |

No ReDoS: branch timings about equal to base. Tasks 4 (C5) and 5 (S6): no findings, no probe cases.
After the revert (`logs/final_probe_after_revert.log`): 0 DIFF rows (measured now by grep count).

## 5. Must-stay-green on final HEAD (42e1b32)
Measured by the lead (revert verify line in progress.md) and by the T8 helper; read here.
- Unit 57/0 (53 base plus 4 appended tests; d7dde04..HEAD removes 0 test lines and changes rewrite.js by +7/-1).
- 1,841 no-file Strong rewrites identical to base; train fires 0.
- Fixtures same (19).
- simulate, customer_check and eval: identical to base (suite recorded as identical).
- dist: 334,435 LF bytes (334,009 before C5 and S6), equal to README line 9; the lead verified the committed blob.

## 6. Research (helper R1, sonnet, read)
- Scope 3 category names 1 to 15 match `CAT_NAME`. Source: the ghgprotocol.org calculation guidance page, not Table 5.3 (the PDF was unreadable).
- E1-8 = internal carbon pricing: NOT confirmed from the primary text (eur-lex returned empty); secondary sources only, and they are consistent.

## 7. Not run
- `tests/pagetest.js` and `tests/filetest.js`: not run (no Playwright path, nothing installed). The page is not browser-tested.
- No live Workiva AI run on the new text; no answer-quality gain is claimed.
- Task 7 (optional "Summarize Scope") cut by the lead at 16:58Z to stay inside the token cap.
- SOX ITGC and SUS-1 column names: parked (moved out of the plan after both plan reviews).

## 8. Known limits / for the next talk
The four reverted items go to a later redesign talk with the probe cases in section 4:
- C2: "Forecast product revenue using this file" stays missed, since the fix also fired on "Explain why forecast product revenue differs from actuals in this file".
- C4: a Scope 3 note and a category list are not told apart in PDF, slide, semicolon CSV or Word layouts.
- S3: "LE" is not taken as a forecast basis ("Account / LE / Actual").
- H4: "Estimate the share price next quarter" stays missed; a share or stock price with a future cue needs a rule that ignores past and deadline asks.
- Sealed misses: the K-ids in section 3, mainly typos, other price wordings, and Scope 3 asks against a methodology note.
- Open Codex warning: "Compare forecast Q4 revenue with Q3 actuals" gets the warning. Still Ian's call.
- Ian's sandbox check of the T3 decline line in a Workiva AI sandbox is still open.
- Codex final inspection findings R2 (PDF/slide newline-joined text), R3 (numeric labels such as "1. Preparation"), R4 ("Where should the stock price column go in next quarter's report?") and R5 (flat computed across files) were raised against cfad8ae; they were not re-checked on the final HEAD (read only).

## 9. Cost
- Helper tokens: 826,480 across 21 rows of `helper-rows.md` (measured now, sum of the tokens column) before this task. Cap 1.1M, raised from 600k by Ian at 16:00Z. Codex runs are not counted (no token column). The lead's own session and this task are excluded.
- Wall time: about 2h30m (read; run start 15:04Z; not timed to the second).
