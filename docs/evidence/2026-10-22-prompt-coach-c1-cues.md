# Prompt coach C1 cues: where it stopped (2026-10-22)

## Outcome

The run was stopped by the PM proxy (proxy decided, Ian may overturn) at Task 4, at about 18:58Z, after 54 minutes.
C1 was not measured. The fresh set (prompt-coach/data/done_when_strong.jsonl) was never opened, copied or scored,
and was not opened for this doc. Spec: docs/superpowers/specs/2026-10-22-prompt-coach-c1-cues-design.md.
Ledger: .ledger/2026-10-22-prompt-coach-c1-cues/ (progress.md, rulings.md; git-ignored).

## Success criteria

| Row | What it asks | Bar | Result |
|---|---|---|---|
| D1 | Training Context=1 rows with zero Context hits | 40 or fewer (progress number) | 99 -> 12/532. Prediction held. First pass gave 10; a checker found row-lifted patterns, and the generalisation pass raised it to 12 |
| D2 | r1 "No changes needed" (seen dev set) | >= 27 of 30 to read the fresh set | MISS. Best state that also passed C2: 23/30 (states A and B). State C reached 28/30 but failed C2 on sim |
| C1 | fresh strong-30, read once | >= 27 of 30 | not measured (fresh set unread) |
| C2 | non-strong "No changes needed", test and sim | <= 5% each | per state, see below |
| C4 | [blanks] in Better or Strong | 0 | 0 in every state measured (baseline 0 of 862) |
| C5 | README test block via c5_gate.js | passes | rewrite_unit fails in every retrained or new-cue state; see below |

## States

| State | What it is | r1 | C2 test / sim | C4 | rewrite_unit | eval |
|---|---|---|---|---|---|---|
| Baseline | start of run, no new cues | 14/30 | 5/247 = 2.0% / 2/111 = 1.8% | 0/862 | passes (77/0 at the earlier done-when commit) | 0.859 |
| A | shipped weights + new cues (branch HEAD) | 23/30 | 2.8% / 3.6% | 0 | 76/1 (#13) | 0.869 |
| B | retrain, then restore shipped S weights and thresholds, re-tune sure | 23/30 | 3.2% / 3.6% | 0 | 76/1 | 0.866 |
| C | shipped weights + tune-sure-only cut-offs S .98 C .58 (from training) | 28/30 | 3.6% / 16/111 = 14.4% (MISS) | 0 | 76/1 | 0.869 |
| Task 4 retrain | full retrain, thresholds S .625 C .3 O .3 P .3 E .5 | not measured in the task row | not measured in the task row | not measured in the task row | FAIL 74/3 (#13, #76, #77) | 0.866 |

Other numbers:
- Baseline sure cut-offs S .99 C .70 O .3 P .3 E .5. Baseline zero-hit rows 99/532; strong rows below the C sure cut-off 49/253.
- Task 4 retrain: sure cut-offs S .99 C .3 O .3 P .3 E .5, false sure 23/827 = 2.78%, strong train sure 189/253. Eval, simulate,
  customer_check and pagetest gates passed. Build 339 KB, weights 5 KB. Lowering cut-offs further: none helped.
- State A tune-sure on training only: S .98 C .58 O .3 P .3 E .45, false sure 24/827 = 2.90%, strong sure 207/253.
- State A r1 misses (7): C-blocked 5 (C score .66, zero hits, sure .7), S .98 1, none 1.
- Eval in A, B and C is above the 0.856 floor. The exact-0.856 gate fails as expected before the floor change.
- Cue context: context-0 rows with any C hit went 40/548 -> 43/548.

No tested state passes every dev gate: A and B miss D2 (23 of 30, bar 27); C passes D2 but misses C2 on sim; all fail rewrite_unit #13.

## Root cause of the rewrite_unit break

Measured by the Opus debug helper on copies:
- #76 and #77 fail on any retrain, with old or new rules. The shipped weights predate the rt:S:the-document cue
  (a46f7bb, 10-14): a retrain learns -4.396 for it, and the shipped weights have no entry. Shipped weights have been stale
  since dfe2c65, and the shipped thresholds (S .625, C .575) are not reproducible by --tune.
- #13 fails on any retrain (C threshold .575 -> .3), and also with shipped weights plus the new feeds-into cue (76/1).
  The fixture's gold is Context=1 (S1 C1 O1 P1 E1), so #13 pins a known miss. Re-pointing it is Ian's call.
- Sure C .3 comes from the new cues, not from the threshold search.
- Fix A (no retrain, keep shipped weights): 76/1, eval 0.869. Fix B (retrain, restore shipped S weights and thresholds,
  re-tune sure): 76/1, eval 0.866, sure C .3, false sure 2.78%.

## Measured versus read

- Re-run by the lead: baseline (r1 14/30, C2, C4, sure cut-offs, eval 0.859, zero-hit 99/532, strong below C sure 49/253);
  D1 10/532 and 12/532 and context-0 43/548; Task 1 tests (4 pass, 0 fail).
- From helper reports only, not re-run by the lead: state A/B/C gate numbers, the Task 4 retrain numbers, and the
  debug helper's root-cause findings. The lead ran block.js on state A and read the r1 miss breakdown.
- Token and dollar figures: mostly not measured.

## Disclosures

- r1 is a seen set (it was dev data in the earlier done-when run), so r1 gains do not predict a fresh-set result.
- The lead saw r1 per-row block output before measuring state C.
- The cue writer saw training rows only, in a stripped copy (train data, engine, tools). It briefly wrote a rules.js.bak
  and a stray file outside the copy, and deleted both.

## Branch state

Branch prompt-coach-c1-cues. HEAD has Tasks 1-3 (3d2fe90 small fixes, c4175c8 guarded copy helper, 9515a81 and aece903
Context cues). With the shipped weights it fails rewrite_unit #13 (76/1), so it must not be merged as is. Task 4's
uncommitted work was discarded with git restore after confirming the reverse patch applies, and is kept as a patch
in the git-ignored ledger: .ledger/2026-10-22-prompt-coach-c1-cues/artifacts/t4-uncommitted.patch.

## Small notes

- Pre-existing dead contraction alternatives at prompt-coach/engine/rules.js:100 (not touched by this run; out of scope).
- The c1probe3 left-untouched figure was not measured.
- template.html:402 stays out of scope as a look item.

## Next bet (PM, proxy decided)

A separate talk to make the weights reproducible (this fixes #76, #77 and #13), then a fresh yes on a reshaped C1.
Re-pointing locked rewrite_unit #13 or skipping --tune would need a spec amendment, which is Ian's.
