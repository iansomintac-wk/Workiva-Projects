# Prompt coach weights repro: evidence (2026-10-22)

Branch `prompt-coach-weights-repro`. Spec: `docs/superpowers/specs/2026-10-22-prompt-coach-weights-repro-design.md`. Plan: `docs/superpowers/plans/2026-10-22-prompt-coach-weights-repro.md`.

Proxy: the scratch copies under the run lead's job tmp folder (`C:/Users/teasp/.claude/jobs/7ce6ba3a/tmp`) stand in for the repo in D4, D4m, D4c and D8. Raw outputs are in `tmp/out` (d4.txt, d4c.txt, d4m.txt, d4m_first_pick.txt, d8.txt, pin_ab.txt). Commit SHAs: 3435e62 (train.js order), 32b9446 (repro_weights.js), db4e5f5 (new baseline), 42d0629 (7 pinned tests).

"measured (lead)" = the lead re-ran it after the helper. "measured (helper)" = only the helper's run, checked by a second helper reading the output. "read" = taken from a document or a talk, not run here.

## Done-when table

| Row | Check | Prediction | Result | Status |
|---|---|---|---|---|
| D1 | `node tests/repro_weights.js` on the branch | exit 0, `REPRO OK` | `REPRO OK 3007835695bb` | measured (lead) |
| D1c | Control: same script with `engine/weights.json` still the old shipped file | exit 1 | `REPRO FAIL first difference: S thr committed=0.625 retrained=0.5`, exit=1 | measured (lead) |
| D1o | Retrain with files in reverse order, then D1 | exit 0 | `cmp` of the reverse-order retrain vs `engine/weights.json`: no output (byte-identical). No hash | measured (T3 helper; re-measured by the Opus final review with `diff -q`) |
| D2 | Thresholds and sure in the committed file | thr S .5 C .575 O .3 P .3 E .45; sure S .99 C .715 O .3 P .3 E .45 | exact match | measured (lead) |
| D3 | `rewrite_unit.test.js` after the new baseline, before pinning | 77 ok, 0 not ok | 77/0 | measured (lead) |
| D4 | Same file after pinning, on the branch and on all 24 file orders | 77/0 in 24 of 24 | Branch 77/0. 24 rows, 24 orders, 22 distinct threshold sets, 23 orders at 77/0, 0 pinned tests failing in any order. One order (hard,sus,fr,grc) is 74/3: #31, #35, #36 fail. Expected, see "What changed" | measured (helper; lead re-counted d4.txt, did not re-run the sweep) |
| D4m | One mutant per pinned test (#1 #9 #11 #13 #14 #76 #77) | each pinned test fails, 7 of 7 | 7 of 7 fail as expected, 0 survived. #1 needed a second pick (below) | measured (lead re-ran mutants.sh, exit 0) |
| D4c | Pinned tests on a copy with C1 cues (9515a81, aece903) and a retrain | #13 passes; 77/0 | 77/0, `GRADE acc=0.866` on that copy; no leak into the repo (helper-reported 0) | measured (helper; lead re-ran the c1 `rewrite_unit` 77/0 only) |
| D5 | `node tests/eval.js rulefeat data/test.jsonl` | `GRADE acc=0.856` | 0.856 | measured (lead) |
| D6 | `node tests/c5_gate.js` | PASS | PASS, exit 0; simulate counts equal `c5_base.json` | measured (lead) |
| D7 | `node tests/done_when.js --only C2,C4` | C2 test/sim at or below 2.0% / 1.8%; C4 0 blanks | C2 2.0% / 1.8%; C4 0 | measured (lead) |
| D8 | r1 (a seen set) in a `mkcopy.sh r1` copy, `done_when.js --only C1` | about 14 of 30, no bar | `C1 14 of 30 (bar 27 of 30) MISS` | measured (lead) |
| D9 | `pagetest.js` after `build.js` | passes | pagetest 22 checks, 0 failed (from Task 3's c5_gate run) | measured (lead, lead_t3_c5.log) |

D8 note: `done_when.js` exits 1 on this run. That is its own C1 bar (27 of 30), not D8's. D8 has no bar; r1 is a seen set and 14 of 30 equals the control.

D4m detail (failing test numbers per mutant, from d4m.txt): #1 fails 1,2,3,14. #9 fails 9,14,17. #11 fails 11,14. #13 fails 13. #14 fails 12,14. #76 fails 76,77. #77 fails 40,77.

## Measured vs read

Measured in this run (commands above): D1, D1c, D1o, D2, D3, D5, D6, D7, D8, D9, the D4 sweep, the D4m mutants, D4c.

Only read, not re-run:
- The C1 run's state A/B/C numbers (talk claims, from branch `prompt-coach-c1-cues`). They were measured on weights nobody could rebuild.
- The control of 14 of 30 on C1 (a talk claim). D8 measured 14 of 30 in the r1 copy, which matches it but is a separate run.
- The research snippets on pinning random seeds and input order (scikit-learn, DVC).
- The lead did not re-run the D4 sweep or the D4c retrain; it re-counted d4.txt and re-ran the c1 copy's `rewrite_unit` (77/0).

## What changed

- `prompt-coach/tests/train.js`: reads the data files in one fixed order (1 line, test first). Before this, the glob order changed the trained weights.
- `prompt-coach/tests/repro_weights.js` (new): retrains into a temp file with the two README commands and byte-compares `engine/weights.json`. Prints `REPRO OK <sha256 prefix>`.
- Baseline: `thr` S 0.625 -> 0.5; every other threshold unchanged (C .575, O .3, P .3, E .45). `sure` C 0.7 -> 0.715; every other sure value unchanged (S .99, O .3, P .3, E .45). Source: the old shipped file read from 3435e62 against D2.
- README: build bytes 338538 -> 339250 (line 9); Model row `sure` line C 0.7 -> 0.715; added the `repro_weights.js` command line. Weights size stays "4 KB".
- 7 pinned tests (#1 #9 #11 #13 #14 #76 #77) in `rewrite_unit.test.js`: each now pins the grader letters it depends on, so it no longer moves with the retrained weights. 2 assert lines differ, including the one #11 line. #76 is pinned below sure (all letters on, allProb(0)), not above it as the spec's example said: `noChanges` (rewrite.js:636) overwrites Better when sure, which hides rewrite.js:593 and lets the D4m mutant survive.
- D4 bar as ruled: the 7 pinned tests pass in 24 of 24 orders; the full file is 77/0 on the branch. In order hard,sus,fr,grc, #31, #35 and #36 fail (74/3). That is expected. They are not in Ian's ruling and stay as they are.
- Pin variant: A (pin S,O,P,E on, C off) gave 76/1 with #14 failing; B gave 77/0. B was kept (pin_ab.txt). A and B use the same letters and differ only in which detect calls are pinned.
- The pin fixes the letters only on the test's own prompt; the rewrite's draft checks still use the real weights.

## Known limits

- REPRO depends on V8's sort: training shuffles with `sort(() => rand() - .5)`. Measured on Node v26.5.0 only.
- `train.js` sorts data files by basename, so same-named files in different folders keep argument order and a retrain over them still depends on shell order. Rare; a full-path tie-break would close it.
- `repro_weights.js` firstDifference assumes both files have `sure`, `thr` and `w`; a retrained file missing one throws a TypeError stack instead of a `REPRO FAIL` line. Still exit 1, so not a false pass.

## Gate fix (Ian's ruling at the merge stop)

- Codex flagged `c5_gate.js:40-42`: the live `rewrite_unit` gate did not use `judgeTap`, so it would accept pass 0 / fail 0. It came in with 3d2fe90 (C1 run). Opus did not flag it. The lead confirmed it by reading the code.
- Ian, 2026-10-22 20:57Z, merge-stop card (his own pick, hook row `left: "ian-kind"`): "Fix the gate, then merge (Recommended)". That unlocked `c5_gate.js` for this one wire-up only.
- Fixed in 7620ab6. The rewrite_unit judge is now `(r) => judgeTap(r.out)`, and `gates` is exported. New test in `c1_fixes.test.js`: "live rewrite_unit gate rejects pass 0 and accepts pass 77". Measured (lead): 5/0 on the branch. Control: in a scratch copy of 7620ab6 with the old judge and only the export added, that test fails (not ok 3). `c5_gate.js` still prints all five GATE lines PASS (rewrite_unit pass 77 fail 0, GRADE acc=0.856). The `GRADE acc=0.856` rule is unchanged.

## Plan corrections made during the run

- Task 5: the patch dry-run was dropped and `patch -p2` used, because aece903 builds on 9515a81.
- Task 6: `sed -b -i` for the CRLF files.
- D4m #9: the mutant sits at the line-324 skip.
- D4m #1: the first pick (paren depth no longer tracks `(`) SURVIVED, failing none, because Ian's parentheses hold no `.`, `!` or `?`. It was re-picked once to "a `;` inside parentheses now ends a sentence", which fails 1,2,3,14. The first-pick result is kept in d4m_first_pick.txt. The checker judged the re-pick honest.

## Lead decisions (Ian may overturn)

- (a) #76 is pinned below sure, not above (reason in "What changed").
- (b) The D4 bar is the 7 pinned tests in 24 of 24 orders, plus the full file 77/0 on the branch; #31/#35/#36 failing in one order is reported, not a stop.
- The PM (studio-harness:pm) approved the plan with (a) and (b) standing: "APPROVED. Plan stands as written." Neither is Ian's own ruling.

## Next

The next talk is C1 reshape (c) on the new baseline, because the C1 run's state A/B/C numbers were measured on weights nobody could rebuild.
