# Prompt coach done-when: where it stopped (2026-10-22)

Stopped by Ian at 15:10:16Z, card "[Ian] C1 stop": "Stop with numbers (Recommended)". State is commit f984c75
on branch worktree-prompt-coach-done-when. The fresh strong-30 set (data/done_when_strong.jsonl) is NOT
measured and was not opened for this doc. Spec: docs/superpowers/specs/2026-10-22-prompt-coach-done-when-design.md.

## The five bars and where each stands at f984c75

| Bar | What it asks | Status |
|---|---|---|
| C1 | strong-30: "No changes needed" shown and the prompt untouched, at least 27 of 30 | MISS on the first set (17/30, measured earlier); fresh set unread |
| C2 | non-strong prompts wrongly told "no changes", 5% or less on test and on sim | PASS (re-run below) |
| C3 | weak-12 in the Workiva AI sandbox, 22 of 24 intended answers, 0 invented facts | PENDING, never run (needs a separate --chrome session) |
| C4 | no [blanks] in Better or Strong output | PASS (re-run below) |
| C5 | every command in the README test block passes | PASS on the gate (re-run below) |

## Re-run just now at f984c75 (measured)

`cd prompt-coach && node tests/done_when.js --only C2,C4`
- C2 set=test no-changes 5 of 247 non-strong = 2.0% (bar <= 5%) PASS
- C2 set=sim no-changes 3 of 111 non-strong = 2.7% (bar <= 5%) PASS
- C4 blanks=0 (better=0, strong=0) across 862 outputs (453 prompts, weak12 12), runs with a blank 0.0% (bar 0) PASS

`node tests/c5_gate.js | tail -3`
- GATE customer_check PASS PASS 229 runs
- GATE rewrite_unit PASS pass 77 fail 0
- GATE pagetest PASS exit 0; pagetest: 22 checks, 0 failed

Built page: 338,538 bytes (`wc -c < prompt-coach/dist/prompt-coach.html`, measured just now).

## Measured earlier (from the run ledger, not re-run now)

- 13:35Z, at 4158145: C1 17/30 on the first strong-30 (called r1, now dev data) = MISS (bar 27). C2 test 2.0%,
  sim 2.7%, C4 0 blanks of 862 all passed. Misses: 9 prompts had a Context score of 0.66, under the 0.70
  "sure" cut-off (FR6 FR7 GRC9 SUS18 SUS21 SUS24 GEN26 GEN27 GEN28); GRC14 not sure on another letter
  (stacked list); FR3 and GEN29 had their text changed by the Better step; SUS22 graded "better" (Context not detected).
- 15:02-15:15Z, Task 9 (build b046b1f): new cut-offs {S .99 C .65 O .55 P .2 E .95}, picked from training data only.
  On training: 24/827 false "sure" (2.90%, under the 3% cap). On the simulated customers: C2 sim 15/111 = 13.5%
  MISS (bar 5%). Test set 4/247 = 1.6% PASS. The training-side cap did not carry over to the sim set.
  The two-strikes rule parked the task. These cut-offs were undone in f984c75.
- r1 C1 with the current (restored) cut-offs: 17/30. With the Better fix added: also 17/30 (the fix adds 0 on r1).
  An earlier scratch figure of 27/30 "with old cut-offs" was wrong: a Context 0.65 setting had been left over from a control test.
- Kept: the Better fix (a strong prompt comes back untouched in Better), with its tests.

## Open items

- GRC14: a stacked list, not sure on another letter.
- SUS22: Context not detected, so it grades "better".
- The fresh strong-30 stays unread for whatever comes next.
- A possible retrain of the model is Ian's call. No AI model is used (ruling: keep it AI-free).
- C3 (sandbox runs) never started; Tasks 7 and 8 of the plan were not run.

## Ian's rulings (verbatim)

- 2026-10-22 (before the talk), ruling 2026-10-22-prompt-coach-done-when: "Prompt Coach is done when the output provided for the improved prompts follow prompting best practices i.e if I were to use the provided improved prompt in Workiva AI that it would give me the intended output without mistakes or issues. Also if the user that provided the prompt already gave a strong prompt, that the prompt coach would be able to agree and let the user know that no improvements needed to their prompt. Right now I've been using Workiva AI to improve whatever prompt I provide, so the idea is that you would be able to do it as if AI did it."
- ~06:23Z, "[Ian] Coach": "Keep it AI-free (Recommended)". Come back with numbers if rules can't reach the bars after one build round.
- ~06:28Z, "[Ian] Done-when": "Approve these five (Recommended)".
- ~06:35Z, "[Ian] Spend": "$0, 2M token cap (Recommended)".
- 13:31:26Z, "[Ian] C1 miss": "Fix + fresh test (Recommended)".
- 15:00:40Z, "[Ian] C1 fix": "Launch now (Recommended)".
- 15:10:16Z, "[Ian] C1 stop": "Stop with numbers (Recommended)". Undo Task 9 cut-offs, keep the Better fix, write the numbers here.
