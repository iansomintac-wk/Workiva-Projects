# Fit Finder no-card step 2: gate and parser (evidence)

BASE-SHA: ae60341

BASELINE (measured at ae60341):
first card right: 13 of 30; wrong card 3 (67,74,91); no card where one fits 14 (6,26,30,45,50,59,80,86,95,99,106,111,115,119)
half A first card right: 12 of 29; wrong card 0 (); no card where one fits 17 (16,17,19,29,32,36,53,58,66,70,75,78,94,96,100,103,108); labelled by Ian 15, by the model 14
real prompts first card right: 15 of 19; wrong card 2 (W1,S1); no card where one fits 2 (W5,S2); labelled by Ian 3, by the model 16
fresh prompts first card right: 15 of 23 that fit; wrong card 5 (G2,G14,G15,G22,X1); no card where one fits 3 (G10,G12,G20); card on a not-a-fit prompt 1 (G5); fit agreement 12 of 29; labelled by Ian 0, by the model 29
fit agreement 52/60 = 86.7%  good<->not mix-ups 0  repeats 78%
fit agreement 45/60 = 75.0%  good<->not mix-ups 1  repeats 67%
first card right: 23 of 35 that fit; wrong card 4 (N14,N15,N60,N69); no card where one fits 8 (N5,N7,N9,N29,N35,N40,N70,N83); card on a not-a-fit prompt 0 (); fit agreement 16 of 50; score 16; split: right feature first 17 of 29, rightly none 6 (N27,N59,N65,N73,N80,N86)

AGREEMENT: N 40 D 0 agreement 100.0% PASS
NOTE: PM labels are one card per row and no partial level; see the plan's deviations

BEFORE-LINE: first card right: 14 of 32 that fit; wrong card 3 (G14,G16,G37); no card where one fits 15 (G2,G3,G4,G11,G12,G13,G19,G24,G26,G27,G30,G31,G32,G33,G34); card on a not-a-fit prompt 0 (); fit agreement 16 of 40; score 21; split: right feature first 14 of 31, rightly none 0 ()
BEFORE: feature 14 of 31, wrong 3, no card 15, not-a-fit 0
PREDICTION-PM: (assumed) no-card misses on the gate set fall by about a third; wrong card rises by at most 1.
PREDICTION-LEAD: (assumed) on tune + half A the loop recovers 3 to 5 of the 6 gate misses to the right card, and 0 to 2 of the 19 keyword misses. Keep only if, on the gate set: no-card misses fall by >= 2, wrong card does not rise, card-on-not-a-fit does not rise. Disproved by: a fall < 2, or any rise in wrong card or card-on-not-a-fit.
TUNE-RESULT: start N 25, best N 23, kept 1 of 3 attempts, stop remaining gate misses need card keywords (match frozen), results L/results.tsv, tool uses 22
AFTER-LINE: first card right: 14 of 32 that fit; wrong card 3 (G14,G16,G37); no card where one fits 15 (G2,G3,G4,G11,G12,G13,G19,G24,G26,G27,G30,G31,G32,G33,G34); card on a not-a-fit prompt 0 (); fit agreement 16 of 40; score 21; split: right feature first 14 of 31, rightly none 0 ()
AFTER: feature 14 of 31, wrong 3, no card 15, not-a-fit 0
OUTCOME: reverted
REASON: no-card fall < 2 (15 to 15)
PREDICTION: did not hold
PINS-MOVED: none (reverted, engine equals ae60341)

REVIEW NOTES (lead, after the final review, 2026-10-23):
- The tune stopped after 3 of 12 attempts (N 25 to 23, target 19) for a reason the plan does not list ("remaining gate misses need card keywords (match frozen)"). The gate set may be scored only once, so "reverted" is the result of a short tune, not a full one.
- Task 8's Check failed only at its allowlist step: `git diff --name-only <task 7> HEAD` also listed the driver's own runs/ commits. Run unedited on the task's own commits (scratch copy, same fit-finder tree c500222), steps 1-11 passed; steps 12-14 passed on the branch. The lead marked Task 8 done.
- Both reviewers found one must-fix: tools/gate-check.js:72 checked the engine with a path relative to fit-finder/, so it could never see an engine change. Fixed in f54aee8 with Ian's yes (":(top)" path, plus a git-mode case in gate-selftest.js that fails on the old line). This run's result does not change (match-frozen --base confirms engine equals ae60341).
