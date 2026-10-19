# Prompt coach, Scope 3 reshape: evidence

**Verdict: FAIL.** The held-out test was scored once, on commit 7c49c74, and it missed Ian's bar ("zero wrong + beat base by 2") on both parts. It is reported as a miss. Nothing was tuned afterwards.

Marks: **measured** = a command run this session produced it; **read** = taken from a ledger or spec file; **assumed** = reasoning, not tested.

## Scores

- Score line, 24 fresh held-out items, scored once at 2026-10-19T22:49Z (stored in the score log): `nearmiss_warn=1/12 base_catch=2/12 branch_catch=2/12 gain=0 forecast_notes=0 heldout=FAIL quiet=QUIET_OK verdict=FAIL`. **measured** (the stored line re-verified with `score.js --verify-log`)
- (a) Near-misses that wrongly warn: 1 of 12. Bar is 0. **measured**
- (b) Should-warn items caught: branch 2 of 12, base 2 of 12. Bar was base + 2, so at least 4. **measured**
- (c) Gain over base: 0. Bar was +2. **measured**
- Forecast notes: 0. **measured**
- Quiet probe rows: QUIET_OK, 0 new warnings against base. **measured**

## Per item, base vs branch (W = warns, - = quiet)

- Should-warn items: H10 base W, branch W. H16 base W, branch W. **measured**
- The other 10 should-warn items (H1, H4, H5, H9, H11, H15, H17, H19, H22, H24) are quiet on both base and branch. **measured**
- Near-misses: H6 is quiet on base and warns on branch (the one wrong warning). The other 11 near-misses are quiet on both. **measured**
- H6 is a slides item, and the warning names category 15 (investments). Its ask (the one held-out ask quoted here): "In plain terms, what does Scope 3 category 15, investments, actually cover? I'm writing a talk track for a new analyst and don't need any numbers." **measured**
- Cause of H6: the classifier reads it as an explain ask. Base skips the check on that intent alone; with the intent forced to summarize, base warns. The branch removed that intent-only skip (spec rule 2), and "what does ... cover" is not one of the explain words the new rule looks for. **measured** (h6 cause log)
- H9 ("franchise stores") is missed by both. The ask names no category, so no category ask is detected. **measured**

## Why the bar could not be met

- The kept gate needs both the ask and the file to say "Scope 3". That holds for only 3 of the 12 should-warn items (H9, H10, H16). **measured**
- So the most the branch could catch was 3, below the bar of 4, whatever the new rules did. **measured** (arithmetic on the per-item gate facts)
- The other 9 should-warn items fail the gate: 4 only the ask says "Scope 3" (H1, H11, H19, H22), 4 only the file does (H4, H5, H17, H24), 1 neither (H15). **measured**
- The spec predicted the gain would come from Word items and explain-with-figure items. The Word should-warn items (H4, H9, H17, H19, H22, H24) were never reached except H9, which fails on category detection. **measured**

## Hard-row and guard counts (all against base)

- Quiet sets: 4 (not the plan's 5, a plan counting error; the list names 4). Rows: E 18, P1 36, charts 6, stored asks 1,516. Base already warns on 3 of these rows; the branch adds 0 new. **measured**
- Unit tests: 75 pass, 0 fail (base 57; 18 added by this work). **measured**
- Guards: GUARDS_OK. Base counts re-measured: fixtures 19, train warnings 0, simulate 2,070, customer 229, rulefeat 8. The branch matches on all of them. **measured**
- Dist size: README says the LF byte count, 335,298 bytes. The plan's check used the CRLF working copy and got 336,361, which would have made the README wrong; fixed in 7c49c74. **measured**

## Explain asks: spec vs measured

- Spec said the 9 stored explain asks split 4 stay quiet, 3 checked, 2 stacked stay quiet. **read**
- Measured: 9 explain asks, 6 name a category number: 5 exempt, 1 checked. The other 3 name no number. **measured**
- The rule was not adjusted to fit the spec's split. One known limit: "Pull Scope 3 Category 4 totals from the attached logistics file ... and explain" is exempt. **measured**

## Prediction vs result

- Prediction: bar met, gain of +2 or +3, no near-miss warning. **read** (spec; it was marked assumed there)
- Result: gain 0, one near-miss warning. The prediction is disproved on both counts. **measured**
- What it got wrong: it assumed the Word and explain-with-figure items would pass the old gate. The gate decided the outcome. **assumed** (my reading of the diagnosis, not tested by a change)

## Limits

- Only 24 items (12 + 12), written by a helper, not real customer asks or real customer sheets. **read**
- Files were built by us and read by the real file reader; PowerPoint text can split mid-word, which this does not model. **read**
- `pagetest.js` and `filetest.js` were not run. **read**
- The Codex plan review needed Ian's yes for a throwaway home before it could run. **read**
- Nothing here was checked in a Workiva sandbox. **read**

## What Ian decides next

1. Keep the branch or drop it. It adds one wrong warning (H6) and catches nothing more than base. Safest: do not ship it. The 18 new unit tests do pass.
2. Whether a new attempt should relax the "ask and file both say Scope 3" gate. That is a new design and a new held-out set, since this one is now spent. It is not a tweak to this branch.
3. Whether the bar itself is reachable: with the gate kept, 3 of 12 is the ceiling, so "base + 2" can only pass if base catches at most 1.
