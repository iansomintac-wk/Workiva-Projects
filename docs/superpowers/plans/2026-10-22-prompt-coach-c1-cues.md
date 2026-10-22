# Prompt Coach C1 Context Cues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: cd prompt-coach && node tests/c5_gate.js ; node tests/done_when.js --only C2,C4
Data: prompt-coach/engine/weights.json

**Goal:** Lift the strong-prompt "No changes needed" rate (bar C1, >= 27 of 30 on the fresh set) by adding Context cue families written from training misses, retraining, re-checking the Source sure cut-off, then reading the fresh 30 exactly once.

**Architecture:** Rule-based Context cues in `engine/rules.js` feed the per-letter logistic model; `tests/train.js rulefeat --tune` then `--tune-sure` rewrite `engine/weights.json`; `node tests/build.js` inlines both into the tracked `dist/prompt-coach.html`. Dev gates run on seen data (r1 via a guarded throwaway copy, test, sim); only if all pass is the fresh set read, once. No AI model or network call ($0, 2M token cap).

**Tech Stack:** Node (no deps), plain-JS engine, `node --test`, Git Bash scripts in `prompt-coach/docs/research/c1-probes/`.

**Spec:** `docs/superpowers/specs/2026-10-22-prompt-coach-c1-cues-design.md` (run prompt: `docs/PROMPT_COACH_C1_CUES_RUN_PROMPT.txt`).

## Global Constraints

- **Shell:** every command block runs in Git Bash (not PowerShell: the `data/train_*.jsonl` glob needs bash). Each block starts with this preamble, which keeps node's exit status through pipes: `set -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-cues; R=$W/prompt-coach; export PROBE_TMP=C:/Users/teasp/AppData/Local/Temp/c1cues-job`. Checks below are written with `$R`/`$W` and assume the preamble; they run from anywhere.
- Branch `prompt-coach-c1-cues`; never commit on `prompt-coach`. $0, usage only, 2M token cap across all helpers. No AI model, no network call, nothing to the brain or studio-harness.
- **Locked:** all `data/*.jsonl`, `tests/done_when.js` bar logic, the 3% false-sure cap and training-only file check in `train.js`, the C1-C5 bars. Check-script edits allowed: Task 1's fixes and Task 4's c5_gate eval floor; `train.js` tune-sure search only in Task 4 / Task 6, test first.
- **Fresh set rule:** `data/done_when_strong.jsonl` is never opened, copied, grepped, listed by content or scored before Task 7; `tests/validate_done_when_sets.js` is not run before Task 7. Name data files explicitly; never `cat data/*`, `grep -r data/`, `wc -l data/*`. Every copy is made with `mkcopy.sh` (Task 2), which excludes the fresh set and keeps probe.sh's `FRESH SET LEAKED` guard.
- **Cue writers** get TRAINING rows only, in a training-only copy (`mkcopy.sh ... train-only`: no `data/test*`, `sim_customers`, `done_when_strong*` file). r1, test and sim reach any writer as counts only, never rows or per-row output. `block.js` row output stays with the lead and is not pasted to a helper.
- **Rebuild rule:** after any change to `engine/` or `weights.json`, run `node tests/build.js`; commit `dist/prompt-coach.html` and the README build-size figure in the same commit; rebuild before C5 on the scratch merge too (`pagetest.js` reads the built page).
- **Freeze after Task 7:** once the fresh set is read, `engine/rules.js`, `weights.json`, `dist/`, and the tune logic in `train.js` are frozen. A final-review must-fix needing an engine change is not made; it goes to Ian with the C1 number. Final-review fixes may touch only docs, evidence and tests that do not change scoring.
- Test files are named, never a folder (node 26 `node --test <folder>` runs nothing). No helper edits the worktree while a check runs in it. A retrain takes ~18 s.
- "talk" baselines were MEASURED by the talk session, not by the plan writer (who ran nothing). Task 2 re-measures them; a different number is a stop to understand, not to tune around.

## Run settings

- `helperToolCallCap`: 30. Expected helper count: 11 on the pass path (T1, T2, T3 top-model cue writer, T4, T5, T7, T8 x2 [Opus final-reviewer, Codex], T8 doc writer, T9) plus 3 if Task 6 runs (cue writer, tune-sure change, gate recheck), and 1 review-fix helper.
- Groups: none parallel (shared worktree). Tune loop: Tasks 3-6 move one number (r1 "No changes needed", target >= 27); Task 6 is the single, conditional fix round.
- Paid calls: none ($0). Codex review uses `codex exec -s read-only -c windows.sandbox=unelevated --skip-git-repo-check -o <out> - < <prompt>` under the existing usage allowance.
- Token estimate (helper tokens): T1 60k, T2 55k, T3 150k, T4 100k, T5 70k, T6 (conditional) 200k, T7 40k, T8 200k, T9 70k. Total 745k without Task 6, 945k with it, against the 2M cap.

## Task 1: Small fixes from the done-when final review (spec Design 1)

**Files:**
- Create: `prompt-coach/tests/c1_fixes.test.js`
- Modify: `prompt-coach/tests/train.js:89`, `prompt-coach/tests/c5_gate.js`, `prompt-coach/tests/done_when.js:14-16`, `docs/evidence/2026-10-22-prompt-coach-done-when.md:36`, `prompt-coach/docs/research/2026-10-22-c1-options.md` (end)

**Interfaces:**
- Produces: `tests/c5_gate.js` exports `judgeTap(out) -> [boolean, string]` (false when `# fail` is missing or nonzero, or `# pass` is `0`) and runs its gates only when `require.main === module`. The regex fix stays inline in `train.js`.

- [ ] **Step 1: Write `tests/c1_fixes.test.js` (node:test), four tests.** (a) Regex behaviour: extract the replacement expression on `train.js` line 89 by source match, evaluate it with `new Function` on the text of `engine/weights.json` plus a trailing `"\n"` (and again plus `"  \n"`), and assert `JSON.parse` of the spliced result succeeds and its `sure` object equals the cut-offs passed in; this covers the regex being dead code, because the unfixed `/}(s*)$/` leaves the splice unparseable or unmatched on a trailing newline. (b) `judgeTap('# pass 0\n# fail 0\n')[0] === false`, `judgeTap('# pass 3\n# fail 0\n')[0] === true`. (c) `spawnSync(process.execPath, ['tests/done_when.js','--only','ZZ'])` exits 2 with a message naming the unknown set; `--only ''` also exits 2. (d) evidence line 36 says FR3 and GEN29 are "not sure" misses and no longer says "had their text changed by the Better step".
- [ ] **Step 2: Confirm it is red on the parent.** `bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-cues/prompt-coach && node --test --test-reporter=tap tests/c1_fixes.test.js | grep -E "^# (pass|fail)"'` -> expected `# fail` of at least 3 (requiring `c5_gate.js` on the parent runs all five gates and exits, so (b) cannot run; record whatever prints; (a) and (d) must each be red).
- [ ] **Step 3: Fix `train.js:89`** to `/}(\s*)$/`. Fix `c5_gate.js`: exported `judgeTap` with the pass-0 rule, gate loop inside `if (require.main === module) {...}`, `module.exports = { judgeTap }`. Fix `done_when.js`: when `only` is non-null and is empty or has a member the file does not handle, print `done_when: --only needs a known set` to stderr and `process.exit(2)` (read the file for the set names).
- [ ] **Step 4: Correct the evidence sentence** (FR3 and GEN29 are "not sure" misses, not Better-step changes) and delete the stray tool-call text at the end of `2026-10-22-c1-options.md`.
- [ ] **Step 5: Run.** `bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-cues/prompt-coach && node --test --test-reporter=tap tests/c1_fixes.test.js | grep -E "^# (pass|fail)"; node tests/c5_gate.js | grep -E "^GATE"'` -> expected `# pass 4`, `# fail 0`, five `GATE ... PASS` lines.
- [ ] **Step 6: Commit** the six files (c1_fixes.test.js, train.js, c5_gate.js, done_when.js, the evidence doc, the options note): "Prompt coach C1 cues: small fixes from done-when review" with the attribution lines. No engine change, so no rebuild.

## Task 2: Probe helper and baseline control retrain (run prompt step 2)

Depends: 1

**Files:**
- Create: `prompt-coach/docs/research/c1-probes/mkcopy.sh`; throwaway copies and logs under `$PROBE_TMP`
- Modify: `.ledger/2026-10-22-prompt-coach-c1-cues/progress.md` (baseline row)

**Interfaces:**
- Produces: `bash mkcopy.sh <src prompt-coach dir> <dest dir> <r1|train-only>`: tars `src` excluding `./data/done_when_strong.jsonl`, `./dist`, `./real-eval`; mode `r1` renames `data/done_when_strong_r1.jsonl` into the fresh slot; mode `train-only` also deletes `data/test*.jsonl`, `data/sim_customers.jsonl`, `data/done_when_strong_r1.jsonl`; exits 9 printing `FRESH SET LEAKED` if the fresh file exists in the copy before the rename or any held-out file survives in train-only mode. Later tasks use it for every copy.

- [ ] **Step 1: Write `mkcopy.sh`** from the tar/guard lines in `probe.sh` plus the two modes. Self-test (preamble set): `bash $R/docs/research/c1-probes/mkcopy.sh $R $PROBE_TMP/t train-only && ls $PROBE_TMP/t/data | grep -c -E "test|sim|done_when"` -> expected `0`.
- [ ] **Step 2: Control probe, rules unchanged.** `bash "$R/docs/research/c1-probes/probe.sh" "$R" control | tail -n 20` (preamble set; `control` only). probe.sh keeps its own guard.
- [ ] **Step 3: Read** `sure cut-offs`, `C1`, `C2`, `C4`: `grep -E "^C1|^C2|^C4|^ERROR" $PROBE_TMP/control.dw.log`. Expected (talk): r1 14/30; C2 test 5/247 = 2.0%, sim 2/111 = 1.8%; C4 0 of 862; sure cut-offs S .99 C .70 O .3 P .3 E .5.
- [ ] **Step 4: Eval and zero-hit count on the control copy.** `cd $PROBE_TMP/control && node tests/eval.js rulefeat data/test.jsonl | grep "GRADE acc"` -> `GRADE acc=0.859`; `node $R/docs/research/c1-probes/block.js $PROBE_TMP/control | grep "^train C"` -> `train C: label=1 with zero hits 99/532; strong rows below C sure 49/253`. (Lead only; block.js row output is not shared with helpers.)
- [ ] **Step 5: Compare and commit.** Any difference: stop, report both values to the lead. All equal: write the baseline row to progress.md. `cd $W && git status --short` -> expected only the new `mkcopy.sh`; commit it: "Prompt coach C1 cues: guarded copy helper" with attribution lines.

## Task 3: Context cue families in `engine/rules.js` (run prompt step 3)

Depends: 2

Design-judgement task: ONE helper on the top model (Opus), TRAINING rows only, in a training-only copy.

**Files:**
- Create: `prompt-coach/docs/research/c1-probes/zerohit.js`
- Modify: `prompt-coach/engine/rules.js` (Context cue list only)
- Read: `prompt-coach/docs/research/c1-probes/addcues.js` (the 5 spike families)

**Interfaces:**
- Produces: `zerohit.js <prompt-coach dir>` prints `#<n> <prompt>` for each training row with Context=1 and zero Context hits, then `zero-hit C rows: N/<positives>`; it reads only `data/train_*.jsonl` and throws on any other name. `engine/rules.js` holds the 5 spike families renamed from `spike-*` to plain tags plus new families. Task 4 owns the rebuild, weights, README and dist.

- [ ] **Step 1: Write `zerohit.js`** (model: the training loop at the end of `block.js`). Check in the worktree (preamble set): `node $R/docs/research/c1-probes/zerohit.js $R | tail -n 1` -> `zero-hit C rows: N/532` with N the committed-weights figure (record it; the control copy gave 99).
- [ ] **Step 2: Make the writer's copy.** `bash $R/docs/research/c1-probes/mkcopy.sh $R $PROBE_TMP/cuewriter train-only`; check `ls $PROBE_TMP/cuewriter/data` lists only `LABELING.md` and the four `train_*.jsonl`. The helper works only inside `$PROBE_TMP/cuewriter`.
- [ ] **Step 3: Brief the helper** (spec Design 2 text; the `zerohit.js` list from the copy; `addcues.js`; the C list; allowed data files `train_fr.jsonl`, `train_grc.jsonl`, `train_hard.jsonl`, `train_sus.jsonl`). It edits `engine/rules.js` in the copy only: rename the 5 spike families, add general patterns over phrasing (who it is for, what it feeds, the situation) for the remaining zero-hit rows, one comment line per family, no pattern copying a row. Reply at most 10 lines, listing every data file it opened.
- [ ] **Step 4: Apply and check the scope.** Copy `$PROBE_TMP/cuewriter/engine/rules.js` over `$R/engine/rules.js`; then `cd $W && git status --short | grep -v "^??"` -> expected exactly ` M prompt-coach/engine/rules.js` (plus `zerohit.js` untracked). Anything else touched: stop.
- [ ] **Step 5: Report D1.** Rerun the step-1 command -> prediction 40 or fewer of 532 (spike alone: 80). Report as it comes (progress number, not a bar; more than 60 disproves the prediction). `node -e "require('$R/engine/rules.js')" && echo loads` -> `loads`.
- [ ] **Step 6: Commit** `rules.js` and `zerohit.js`: "Prompt coach C1 cues: Context cue families from training misses (D1 <number>)" with attribution lines. Weights and dist are rebuilt in Task 4; this commit alone is not a shipping state.

## Task 4: Retrain, tune-sure with Source re-check, rebuild, README, eval floor (run prompt step 4)

Depends: 3

**Files:**
- Modify: `prompt-coach/tests/train.js` (tune-sure search), `prompt-coach/tests/c5_gate.js` (eval floor), `prompt-coach/engine/weights.json` (retrain), `prompt-coach/dist/prompt-coach.html` (rebuild), `prompt-coach/README.md` (figures incl. build size)
- Test: `prompt-coach/tests/c1_fixes.test.js` (extend)

**Interfaces:**
- Consumes: Task 1's `judgeTap`.
- Produces: `c5_gate.js` exports `judgeEval(out) -> [boolean, string]` (ok when `GRADE acc=` parses and is `>= 0.856`); `--tune-sure` prints a line `tried lowering: <letters>` before `sure cut-offs`; new `weights.json` with `sure`; rebuilt `dist/`.

- [ ] **Step 1: Write the failing tests first** in `c1_fixes.test.js`: (a) `judgeEval`: 0.859 and 0.856 true; 0.855 and `''` false. (b) tune-sure, run in a `mkcopy.sh ... train-only` copy: `node tests/train.js rulefeat --tune-sure data/train_*.jsonl` output contains `tried lowering:` and its `false sure x/N (y%)` has `y <= 3.00`; after the run `JSON.parse` of the copy's `engine/weights.json` succeeds and has a `sure` object with keys S,C,O,P,E (the written file parses after the splice); `node tests/train.js rulefeat --tune-sure data/LABELING.md` (any non-train file) exits non-zero. Run (preamble set): `cd $R && node --test --test-reporter=tap tests/c1_fixes.test.js | grep -E "^# (pass|fail)"` -> expected `# fail` above 0 (judgeEval undefined; no `tried lowering` yet).
- [ ] **Step 2: Implement** (a helper does this, not the lead). `judgeEval` in `c5_gate.js` used in the gate list. In `train.js` `--tune-sure`: also try lowering a letter's cut-off (Source first, 0.005 steps), keep the set with the most strong training rows sure under the same out-of-fold 3% cap, print `tried lowering: <letters>`. The cap and the training-only check are untouched. Tests -> `# fail 0`.
- [ ] **Step 3: Retrain.** `cd $R && node tests/train.js rulefeat --tune data/train_*.jsonl | tail -n 5; node tests/train.js rulefeat --tune-sure data/train_*.jsonl | tail -n 4` (preamble set) -> `tuned thresholds ...`, `sure cut-offs {...} false sure x/N (<= 3.00%)`, `wrote sure to`. Record cut-offs and strong sure count (control S .99 C .70; spike C .635).
- [ ] **Step 4: Rebuild.** `cd $R && node tests/build.js | tail -n 3` -> a build line with the new size; note it for the README.
- [ ] **Step 5: Measure.** `cd $R && node tests/eval.js rulefeat data/test.jsonl | grep "GRADE acc"` (about 0.859, must be >= 0.856); `node tests/c5_gate.js | grep "^GATE"` -> five PASS. Any gate change other than the eval floor stops the task.
- [ ] **Step 6: README in the same commit as the rebuild:** the "S 0.99, C 0.7, O 0.3, P 0.3, E 0.45" line, `weights.json` "4 KB", build size, "FAIL if eval is not 0.856" -> "below 0.856", line 82 cue names if renamed. Check: `grep -n "0.856\|S 0.99" $R/README.md` -> every hit matches.
- [ ] **Step 7: Commit** weights.json, dist/prompt-coach.html, train.js, c5_gate.js, c1_fixes.test.js, README: "Prompt coach C1 cues: retrain, Source re-check, rebuild, eval floor 0.856" with attribution lines.

## Task 5: Dev gates (run prompt step 5)

Depends: 4

**Files:**
- Create (throwaway): `$PROBE_TMP/gate/`
- Modify: `.ledger/2026-10-22-prompt-coach-c1-cues/progress.md`

**Interfaces:**
- Produces: a line `DEV GATES PASS|FAIL r1=<n>/30 C2test=<x>% C2sim=<y>% C4=<b>` in progress.md. Task 7 runs only on PASS; Task 6 runs only on FAIL.

- [ ] **Step 1: Score r1 on a guarded copy of the committed branch (no retrain).** `bash $R/docs/research/c1-probes/mkcopy.sh $R $PROBE_TMP/gate r1 && cd $PROBE_TMP/gate && node tests/done_when.js --only C1 | grep -E "^C1|^ERROR"` (preamble set) -> prediction D2 25-28 of 30; gate >= 27.
- [ ] **Step 2: C2 and C4 on the branch.** `cd $R && node tests/done_when.js --only C2,C4 | grep -E "^C[24]|^ERROR"` -> C2 <= 5% on test and sim (prediction ~3.5% / ~2%), C4 0 of 862, no C1 line.
- [ ] **Step 3: C5 suite on the rebuilt page.** `cd $R && node tests/c5_gate.js | grep "^GATE"` -> five PASS.
- [ ] **Step 4: Probe3 (reported, not a bar).** Run it from the worktree root: `cd $R && node docs/research/c1-probes/c1probe3.js $R | cut -c1-220` (preamble set). It reads only test, sim and `data/done_when_strong_r1.jsonl` by literal name, never the fresh set, and is read-only. Compare control test 10/247, sim 15/111.
- [ ] **Step 5: Record** the DEV GATES line (PASS only if r1 >= 27, C2 <= 5% on both, C4 0, C5 five PASS). Report D1 and D2 as measured.
- [ ] **Step 6: On FAIL** go to Task 6. Do not read the fresh set.

## Task 6: Fix round (conditional on Task 5 FAIL; at most once)

Depends: 5 (runs only if its line says DEV GATES FAIL)

**Files:**
- Modify: `prompt-coach/engine/rules.js` and/or `prompt-coach/tests/train.js`, `prompt-coach/engine/weights.json`, `prompt-coach/dist/prompt-coach.html`, `prompt-coach/README.md` (figures)
- Test: `prompt-coach/tests/c1_fixes.test.js` (extend if the tune-sure search changes)

- [ ] **Step 1: Counts brief.** The lead gives helpers only counts: r1 N/30, which letter blocks how many r1 rows (the `r1 blocking letter counts` line of `block.js`), C2, C4. No r1/test/sim row text, no per-row lines.
- [ ] **Step 2: Cue writer (top model)** in a fresh `mkcopy.sh ... train-only` copy: run `zerohit.js` there, add families for remaining training misses, same brief and comment rule as Task 3. Apply its `rules.js` to the worktree; `git status --short | grep -v "^??"` -> only `engine/rules.js` modified.
- [ ] **Step 3: Tune-sure change, only if the counts point at a cut-off** (for example Source). A helper (never the lead) writes the failing test in `c1_fixes.test.js` first (cap <= 3% holds, lowering tried, non-train refused, written weights parse), then the change; tests -> `# fail 0`.
- [ ] **Step 4: Retrain and rebuild** as Task 4 steps 3-4; update README figures.
- [ ] **Step 5: Re-measure** with Task 5 steps 1-3 and 5; append the new DEV GATES line.
- [ ] **Step 6: Commit** the changed files with the rebuilt dist: "Prompt coach C1 cues: fix round (D1 <n>, r1 <n>/30)" with attribution lines.
- [ ] **Step 7: Still FAIL: STOP.** Write all numbers (r1, C2 test/sim, C4, C5, D1) to progress.md, leave the fresh set unread, report to the lead. Task 7 does not run; Task 8 records the stop; Task 9 does not run.

## Task 7: Read the fresh 30 once (run prompt step 6)

Depends: 5 or 6 (only if the latest DEV GATES line says PASS)

**Files:**
- Create: `.ledger/2026-10-22-prompt-coach-c1-cues/fresh-read.log`
- First reads of `prompt-coach/data/done_when_strong.jsonl`, through the two commands below only

- [ ] **Step 1: Precondition.** `grep "DEV GATES" $W/.ledger/2026-10-22-prompt-coach-c1-cues/progress.md | tail -n 1` -> expected a `DEV GATES PASS` line. Otherwise stop.
- [ ] **Step 2: Clean tree.** `cd $W && git status --short` -> expected empty.
- [ ] **Step 3: The one read.** `cd $R && node tests/done_when.js --only C1 2>&1 | tee $W/.ledger/2026-10-22-prompt-coach-c1-cues/fresh-read.log | grep -E "^C1|^ERROR"` (preamble set) -> prediction 24-27 of 30; bar >= 27. Record exactly as printed.
- [ ] **Step 4: Validate the sets, once, right after.** `cd $R && node tests/validate_done_when_sets.js 2>&1 | tail -n 8` -> expected a pass line; add the tail to fresh-read.log.
- [ ] **Step 5: No second read, no tuning.** The C1 number is final, pass or fail. A failure or error in step 3 or 4 never permits re-running either command.
- [ ] **Step 6: FREEZE.** From here `engine/rules.js`, `weights.json`, `dist/` and the tune logic in `train.js` do not change in this run. The lead records the C1 number in progress.md.

## Task 8: Evidence doc and final review (run prompt step 7)

Depends: 7 (or Task 6 step 7's STOP: the doc then records the stop numbers and the fresh set unread)

**Files:**
- Create: `docs/evidence/2026-10-22-prompt-coach-c1-cues.md`, `.ledger/2026-10-22-prompt-coach-c1-cues/reviews/final-review.md` (reviewers' combined findings)
- Modify: docs, evidence, and non-scoring tests only (freeze)

- [ ] **Step 1: Write the evidence doc.** "Measured this run" (control baseline, D1, D2, C2 test/sim, C4, C5, eval, sure cut-offs, probe3, C1) and "Read, not measured" (talk figures, predecessor numbers). State: r1 is seen dev data; the 5 spike families came from a session that had seen the r1 misses; C1 was read once and is final; prediction versus result for D1, D2, C1-C5; whether the Task 6 fix round ran. Look items: `template.html:402` "[fill in your details]" under Strong (PM first-pass note), tracked `runs/2026-10-22-prompt-coach-done-when/` runtime files.
- [ ] **Step 2: Numbers check.** Every figure from `$PROBE_TMP` logs, progress.md or fresh-read.log. `grep -c "TBD\|TODO" $W/docs/evidence/2026-10-22-prompt-coach-c1-cues.md` -> `0`.
- [ ] **Step 3: Opus final-reviewer** on `git diff prompt-coach...HEAD` (stat first). Findings only, at most 10 lines, saved to `reviews/final-review.md`.
- [ ] **Step 4: Codex review.** `codex exec -s read-only -c windows.sandbox=unelevated --skip-git-repo-check -o <out> - < <prompt>`; prompt names the spec, the diff, and "does any change leak held-out data or loosen a locked item?". Append the reply to `reviews/final-review.md`.
- [ ] **Step 5: Fix round, frozen scope.** Fix docs, evidence and non-scoring tests only. A must-fix needing an engine change is not made: it is written into the evidence doc and reported to Ian with the C1 number.
- [ ] **Step 6: Suite and commit.** `bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-cues/prompt-coach && node tests/c5_gate.js | grep "^GATE"; node tests/done_when.js --only C2,C4 | grep -E "^C[24]|^ERROR"'` -> five PASS, C2 <= 5%, C4 0 (no C1). Commit: "Prompt coach C1 cues: evidence and review fixes" with attribution lines.

## Task 9: [IAN: merge] Merge stop (run prompt step 8)

Depends: 8 (and Task 7 PASS path)

**Files:**
- Create: `.ledger/2026-10-22-prompt-coach-c1-cues/merge-evidence.md`
- No source edits

- [ ] **Step 1: Back up and push.** `STUDIO=C:/Users/teasp/Documents/studio-harness`; `git fetch origin prompt-coach`; `git push origin refs/remotes/origin/prompt-coach:refs/heads/backup/prompt-coach-before-prompt-coach-c1-cues-2026-10-22`; `git push origin prompt-coach-c1-cues`. No force flags.
- [ ] **Step 2: Open the PR** with base `prompt-coach` (`gh pr create --base prompt-coach --head prompt-coach-c1-cues`, body = the evidence doc summary + attribution line); note the PR number `<pr>`.
- [ ] **Step 3: Gate dry run.** `node "$STUDIO/bin/merge-gate.mjs" <pr> --review $W/.ledger/2026-10-22-prompt-coach-c1-cues/reviews/final-review.md --dry-run` -> expected `REFUSE suite` only (it cannot run a suite here; memory merge-gate-no-npm-test); all other checks OK. Record it.
- [ ] **Step 4: Suite on base and on a scratch merge.** In a scratch worktree of `origin/prompt-coach` (preamble `set -o pipefail`): `node tests/build.js | tail -n 1; node tests/c5_gate.js | grep "^GATE"; node tests/done_when.js --only C2,C4 | grep -E "^C[24]|^ERROR"`. Then `git merge --no-ff prompt-coach-c1-cues`, rebuild with `node tests/build.js`, rerun the same lines. Expected: no failure on the merge that the base lacks. Record both outputs.
- [ ] **Step 5: Write merge-evidence.md** (base vs merge outputs, dry-run output, backup branch, PR number, C1 number, disclosures, look items), notify, and STOP for Ian's merge yes (his 13:24Z by-hand yes covered PR #2 only). Nothing merges before it.

## Expected breaks

- c5_gate eval exact 0.856 check (`GATE eval` needs `GRADE acc=0.856`) | fixed by Task 4
- README c5_gate line "FAIL if eval is not 0.856", the sure cut-offs line, weights and build sizes | fixed by Task 4
- pagetest on a stale `dist/prompt-coach.html` after the cue change | fixed by Task 4
- Any other c5_gate, rewrite_unit, pagetest or customer_check change is unexpected and stops the task.

## Self-review

- Spec coverage: Design 1 -> T1; Design 2 -> T3, T6; Design 3, eval floor, README, rebuild -> T4; Design 4 -> T5, T6; Design 5 -> T7; evidence, review, merge -> T8, T9; baseline -> T2.
- Fresh set is first opened in Task 7 only; Tasks 2, 3, 5, 6 use `mkcopy.sh` copies that exclude it, and Task 5 step 4 runs c1probe3.js from the worktree root, which never names the fresh set.
