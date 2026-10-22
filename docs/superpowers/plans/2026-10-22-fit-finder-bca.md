# Fit Finder after the park (order B, C, A) Implementation Plan (revision 5, driver format)

> **For agentic workers:** executed by `node bin/driver.mjs` (a fresh Sonnet build worker per task, then a read-only Sonnet checker that sees the task text and the Check output). There is no lead step anywhere in this plan.

**Goal:** Make the Fit Finder score line honest (split of right card vs rightly none), re-score the two sealed sets once, then try card step-list (`ops`) fixes against a fresh blind set and keep them only if they help.

**Architecture:** B edits tests and one sample file only. C runs the scorer once per sealed set (through a once-only wrapper) and writes the lines to the evidence doc. A adds a fresh PM-labelled blind set (Ian confirms the labels at the Look task), an `--allow ops` mode in `tests/match-frozen.js` and `tests/fair-guard.js`, an `ops`-only catalogue change, and a keep-or-revert rule checked by script.

**Tech Stack:** Node (no npm deps), JSONL data, git. `jq` is NOT installed in this shell (measured by the lead): every data check is a node script that exits non-zero on a bad input and prints the count it checked.

**Spec:** `docs/superpowers/specs/2026-10-20-fit-finder-after-park-design.md`

Suite: cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder" && node tests/catalogue.test.js && node tests/edge-cards.test.js && node tests/synth-score.test.js && node tests/sandbox-kit.test.js && node tests/match-frozen.test.js && node tests/prompts-strong.test.js && node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A && node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B
Data: fit-finder/data/synth, fit-finder/data/card-gold-synth-fresh.jsonl, fit-finder/data/catalogue.json (ops only), fit-finder/data/real (copied in, git-excluded, never opened or committed)
Spend: $0 (usage only)

## Global Constraints

These apply to every task and every worker.

- Names. WT = `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card`; FF = `WT/fit-finder`; L = `WT/.ledger/2026-10-22-fit-finder-bca` (the run's ledger, git-ignored; a worker may write files there and must not `git add` them); EV = `WT/docs/evidence/2026-10-22-fit-finder-after-park.md`. Check commands are written out in full.
- Never open, print or quote `fit-finder/data/real/`, `fit-finder/data/top3/` or `C:/Users/teasp/Documents/workiva-sealed/`. Work repo: nothing to the brain or studio-harness. The sealed holdout (`data/synth/2026-10-18-holdout.jsonl`) and the 10-19 blind set (`data/synth/2026-10-19-blind.jsonl`) are scored once each, in Task 7 only; their lines are never read or printed (the scorer prints counts and ids only), and no other task runs a scorer on them. (`tools/nearcopy.js` reads `data/real` for the repo's own 5-word near-copy rule and prints counts and fresh ids only; that is accepted.)
- B changes tests and one sample file; engine and cards unchanged. A changes card `ops` only: no id, area, match, engine or page-engine change. Ian's labels are never changed.
- No push, no PR, no merge (the driver's own gate does that). Commit exactly once at the end of the task, as `task N: <title>` with N and the title from the heading, adding only the files the task names (`git add <named files>`, never `-A`, never the ledger or `data/real`); if nothing is tracked to commit, use `git commit --allow-empty -m "task N: <title>"`. Every commit message ends with these two lines, verbatim:
  `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01BioeWeDVz9MXRt9vEWH5sN`
- Shas are found from the commit subjects: `git rev-list -1 --grep='^task N:' HEAD` gives the commit of task N. Never rely on a remembered sha.
- Once-only scoring: the holdout, the 10-19 blind set and the fresh before/after lines are produced only through `node tools/score-once.js <name> <prompts> <gold>` (written in Task 5; read `fit-finder/tools/README.md` for its exact behaviour). Its record `L/score-<name>.out` is the only source for the line copied into EV; never call `tests/synth-score.js` directly on those sets. A Check never runs a scorer on a sealed or fresh set; it only reads files the worker wrote.
- Tool scripts: every task that uses a script in `fit-finder/tools/` must first read `fit-finder/tools/README.md` (written in Task 5), which states each script's arguments, outputs and exit codes.
- Red-before-green proofs are recorded by the worker as lines in `L/red-green.log` (format given in each task); a Check greps them.
- Evidence doc line prefixes (each on its own line, verbatim copies, never paraphrased): `PRE-EXISTING:`, `B-SHA:`, `HOLDOUT-HASH:`, `BLIND-HASH:`, `HOLDOUT-LINE:`, `BLIND-LINE:`, `AGREEMENT:`, `BEFORE-LINE:`, `AFTER-LINE:`, `OUTCOME:` (`kept` or `reverted`), `REASON:`.
- Pins that must hold at the end: B 13/3, A 12/0, real 15/2, fresh 15/5/1/12, eval pins (via `tests/fair-guard.js`). A pin change is a failure to report, not an auto-accept.
- Locked: `fit-finder/engine/fit.js` (never edited), `fit-finder/data/catalogue.json` (Task 12 only, `ops` only), `fit-finder/data/synth/2026-10-18-holdout.jsonl`, `fit-finder/data/synth/2026-10-19-blind.jsonl`, `fit-finder/data/synth/2026-10-18-tune.jsonl` (never edited). Nothing may be uncommitted in `fit-finder/tests`, `fit-finder/data/synth` or `fit-finder/data/*.jsonl` when `fair-guard` runs.
- Sandbox copy already uploaded to Workiva AI is not changed; the evidence doc says so.
- The eight Suite commands (run from FF) are: `node tests/catalogue.test.js`, `node tests/edge-cards.test.js`, `node tests/synth-score.test.js`, `node tests/sandbox-kit.test.js`, `node tests/match-frozen.test.js` (exists from Task 6 on), `node tests/prompts-strong.test.js`, `node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A`, `node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B`.

## Deviations from the spec and the earlier review rounds (all forced by the driver)

- Order fix 2026-10-22 (after the first driver pass parked the re-score): the tooling task now runs as Task 5 and the B gate and C re-score as Task 7, because the re-score needs `tools/score-once.js` and the driver lets a task depend only on an earlier one. Task contents are unchanged except the task numbers and that the re-score's suite now includes `match-frozen.test.js`.

- Spec A1 asked for a top-model helper to write the sentences. The driver gives every task a Sonnet worker, so Task 8's writer is a Sonnet worker. The blindness is by instruction (it writes without opening any repo file) and by a script check against the catalogue's `try` text, not by a transcript audit: workers' transcripts are not available to a Check.
- The transcript audit is dropped for Task 8 (writer), the PM labels (Look task) and Task 12 (ops worker) for the same reason. What replaces it: the prohibition is stated in the task text, and Checks prove what can be proven (Task 8: near-copy and catalogue-leak scripts with positive controls; Task 12: ops-only, append-only, allowed-values check against the previous commit). That the ops worker did not read the fresh set cannot be proven; Task 12's text forbids it.
- The Look task replaces the lead's PM dispatch: the driver's PM worker (read-only) labels the sheet in its PICK, per `data/LABELING.md` (PM first pass, ruling 2026-10-22-fit-finder-pm-labels-first). The driver's look prompt asks for PICK/WHY/CHECKED in under 150 words, so PICK is one compact line of `<id>=<label>` tokens. Consequence: a label is the first card id (fit `good`, one gold card), `none` (fits, no card; fit `good`, no gold card) or `not`. The gold therefore has no `partial` level and at most one gold card per row; the scorer treats `good` and `partial` alike (`fit !== 'not'`), but a task with two valid cards is scored against one. This simplification is recorded in EV by Task 10.
- Ian confirms in one batch after the PM pass; the tasks after the Look task wait for that (see "After the label batch").
- The set is NOT committed before labels: Task 8 writes the draft only in L (git-ignored). Task 10 commits set, gold and `.sha256` together after the agreement check, before any card change.
- New scripts live in `fit-finder/tools/` (not in the locked `tests/` folder), so they do not trip fair-guard's lock.
- Spec ordering deviation kept from round 1: the near-copy check runs before the commit (Task 8).

## After the label batch (not a task; for the session that talks to Ian)

When the run reaches `awaiting` on Task 9: put the label sheet (`L/captures/labels/label-sheet.md`) and the PM's PICK (`runs/2026-10-22-fit-finder-bca/looks/9.md`) to Ian as one batch in plain words ("accept the PM labels, or say which rows differ"). Then that session (not the driver) writes `.ledger/2026-10-22-fit-finder-bca/ian-label-batch.json`:
`{"sheetSha256":"<sha256 of label-sheet.md>","words":"<Ian's answer, verbatim>","accepted":true|false,"changes":[{"id":"F7","label":"gen-translate"}]}` (`label` uses the PICK vocabulary: a card id, `none` or `not`; `changes` is empty when `accepted` is true). It then marks Task 9 done in `runs/2026-10-22-fit-finder-bca/progress.md` in the driver's row format and restarts the driver. A missing file never means "accepted": Task 10 stops.

---

### Task 0: Worktree setup and baseline

Depends: none

Files: create (git-excluded, copy only) `fit-finder/data/real/`; create (ledger, not committed) `L/baseline-83d6e50.log`, `L/baseline-tune-line.txt`, `L/red-green.log`.

Steps:
1. Compare the two copies of the real folder by name only, never opening a file: `diff -rq C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder/data/real C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder/data/real`. If it prints anything, stop: write `STOP: real copies differ` into `L/baseline-83d6e50.log` and finish (the Check then fails).
2. Copy the v4 folder: `cp -r C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder/data/real C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder/data/real`. Confirm `git status --short` does not list `data/real` (git-excluded). If it does, stop and do not add it.
3. Confirm HEAD is `83d6e50` (`git log --oneline -1`).
4. Run these seven commands one by one from FF, each time appending to `L/baseline-83d6e50.log` a line `== <command> exit <n>` (the exit status) after its output: `node tests/catalogue.test.js`, `node tests/edge-cards.test.js`, `node tests/synth-score.test.js`, `node tests/sandbox-kit.test.js`, `node tests/prompts-strong.test.js`, `node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A`, `node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B`. (`tests/match-frozen.test.js` does not exist at 83d6e50; it is not run.) Then run `node tests/fair-guard.js --base 83d6e50` and append `== fair-guard exit <n>` the same way. A failing command is recorded, not fixed: failures are "pre-existing on 83d6e50". Any failure other than a missing `data/real` file is noted in the log as `STOP`.
5. Save the baseline tune line: `node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl > L/baseline-tune-line.txt` (the tune set is not sealed).
6. Create the empty `L/red-green.log`. Commit with `--allow-empty` (nothing tracked).

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card" && test "$(ls fit-finder/data/real | wc -l)" -gt 0 && test "$(git status --short | grep -c 'data/real')" = 0 && test "$(grep -c '^== .* exit [0-9]*$' .ledger/2026-10-22-fit-finder-bca/baseline-83d6e50.log)" = 8 && ! grep -q '^STOP' .ledger/2026-10-22-fit-finder-bca/baseline-83d6e50.log && grep -c '^first card right: 23 of 35 that fit; wrong card 4 (N14,N15,N60,N69)' .ledger/2026-10-22-fit-finder-bca/baseline-tune-line.txt`
Expect: 1

---

### Task 1: B1 split line in synth-score.js

Depends: 0

Files: modify `fit-finder/tests/synth-score.js` (the first `console.log`, about line 47), `fit-finder/tests/synth-score.test.js`.

Interface produced: the first output line is the old line byte-identical up to and including `score N`, then `; split: right feature first R of F, rightly none K (ids)`. F = fitting rows with a gold card, R = those whose first card is in the gold, K = fitting rows with empty gold and no card shown, `ids` = their ids comma-joined. One line without `--top3`.

Steps:
1. Read `tests/synth-score.test.js` lines 1-36 for its helpers (`run(P, G)`, `ok(title, cond)`, `P`, `G`, `card`). Add after the line-22 case, using only names declared above line 22 (not `multi` or `shown`, declared at line 39, a TDZ error): (a) row T1 text `'zzqx vvkw'` (shows no card) with gold `{fit:'good',cards:[]}`: stdout matches `/; split: right feature first 0 of 0, rightly none 1 \(T1\)\n$/` and contains `first card right: 1 of 1 that fit`; (b) an empty-gold `good` row whose text is `cat.useCases[0].try`: stdout contains `wrong card 1` and `rightly none 0 ()`; (c) the line-22 case's stdout `r.stdout` must contain `; split: ` AND, after `.replace(/; split: .*/, '')`, still match the exact old line regex of the line-22 case (copy it; the old regex ends `score 1\n$`), so it fails on the parent (no suffix there).
2. Run `node tests/synth-score.test.js`. Exactly 3 cases (a, b, c) must fail; the unchanged line-22 case still passes on the parent. Append `task 1 red 3` to `L/red-green.log` only if the failure count is 3; any other count means a case is wrong: fix the case, not the count.
3. Implement. After `const S = ...` add `const withGold = fit.filter((r) => want(r).length), rightNone = fit.filter((r) => !want(r).length && !first(r)), R = withGold.filter((r) => first(r) && want(r).includes(first(r))).length;` and append after `score ${S}` in the template string: `; split: right feature first ${R} of ${withGold.length}, rightly none ${rightNone.length} (${ids(rightNone)})`.
4. Change the line-22 case regex to end `score 1; split: .*\n$` (the only existing test that breaks).
5. Run `node tests/synth-score.test.js` (all green) and `node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl`: expect `...score 16; split: right feature first 17 of 29, rightly none 6 (N27,N59,N65,N73,N80,N86)`. Any other split disproves the spec prediction: stop, write `STOP: split` in `L/red-green.log`, and do not change the expected text.
6. Commit `task 1: B1 split line in synth-score.js` with the two files.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder" && grep -qx 'task 1 red 3' ../.ledger/2026-10-22-fit-finder-bca/red-green.log && node tests/synth-score.test.js > /dev/null && node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl | grep -qF "$(cat ../.ledger/2026-10-22-fit-finder-bca/baseline-tune-line.txt)" && node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl | grep -o 'score 16; split.*'`
Expect: score 16; split: right feature first 17 of 29, rightly none 6 (N27,N59,N65,N73,N80,N86)

---

### Task 2: B2 rank 3 / rank 4 boundary test under --top3

Depends: 1

Files: modify `fit-finder/tests/synth-score.test.js` (append after the top3 cases, after line 50, where `match`, `cat`, `PM`, `second`, `gold`, `run` exist); create or append `docs/evidence/2026-10-22-fit-finder-after-park.md`.

Steps:
1. Build a task text by joining card `try` fields (the catalogue has `try`, not `sample`): loop over `cat.useCases`, adding each `u.try` until `match(text, cat, 10).length >= 4` (join at most 8). `const all = match(text, cat, 10).map((u) => u.id)`. Add `ok('top3: found a task with 4 or more raw hits', all.length >= 4)`. Case 1: gold `[all[2]]` with `--top3`, line 2 matches `/right card anywhere in the 3 shown 1 of 1 that fit/`. Case 2: gold `[all[3]]`, line 2 matches `/right card anywhere in the 3 shown 0 of 1 that fit/`. Use the file's existing helpers as the nearby top3 cases do.
2. Run `node tests/synth-score.test.js`: green (the engine already cuts at 3, so this test cannot fail on the parent; this is a recorded spec deviation, the spec exempts only sandbox-kit).
3. Control instead of red-on-parent: temporarily change `match(r.task, cat)` to `match(r.task, cat, 10)` inside `shownIds` in `tests/synth-score.js` (about line 42). Run the test: Case 2 must fail. Append `task 2 control red <n>` (n = number of failures, at least 1) to `L/red-green.log`. Restore the line (`git checkout -- fit-finder/tests/synth-score.js`) and confirm `git diff --stat -- fit-finder/tests/synth-score.js` is empty.
4. Write one line in EV (create the file with a heading if absent): `DEVIATION: B2 control instead of red-on-parent, engine already cuts at 3`.
5. Commit `task 2: B2 rank 3 / rank 4 boundary test` with `tests/synth-score.test.js` and EV.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder" && grep -qE '^task 2 control red [1-9]' ../.ledger/2026-10-22-fit-finder-bca/red-green.log && test "$(grep -c 'match(r.task, cat, 10)' tests/synth-score.js)" = 0 && grep -q 'top3: found a task with 4 or more raw hits' tests/synth-score.test.js && node tests/synth-score.test.js | tail -n 1`

---

### Task 3: B3 sandbox-kit first-card check

Depends: 2

Files: modify `fit-finder/tests/sandbox-kit.test.js:20` (`.some((u) => u.id === c.id)` becomes `(match(c.sample, cat)[0] || {}).id === c.id`; keep the title text unchanged).

Steps:
1. Make the edit.
2. Run `node tests/sandbox-kit.test.js`: expect `sandbox-kit tests pass: ` and the old count (spec: all 8 kit cards rank first).
3. Control the spec asks for, uncommitted: temporarily set one kit card's `sample` to another catalogue card's `try` text where the kit card ranks second (find one: for each other card `o`, `match(o.try, cat)` with the kit card at index 1). The old `.some` check passes there, the new check fails. Run the test: `sandbox-kit tests FAILED: 1 of`. Append `task 3 control red 1` to `L/red-green.log`. Restore the file to the single line-20 change (`git diff` shows only that line).
4. Commit `task 3: B3 sandbox-kit first-card check`.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder" && grep -qx 'task 3 control red 1' ../.ledger/2026-10-22-fit-finder-bca/red-green.log && grep -c 'match(c.sample, cat)\[0\]' tests/sandbox-kit.test.js | grep -qx 1 && node tests/sandbox-kit.test.js | tail -n 1`
Expect: sandbox-kit tests pass:

---

### Task 4: B4 MADE-UP tag on the PRIOR YEAR heading

Depends: 3

Files: modify `fit-finder/sandbox/fr-yoy-narrative.txt:6`, `fit-finder/tests/sandbox-kit.test.js`.

Steps:
1. Add a test that reads `sandbox/fr-yoy-narrative.txt`, finds the line starting `PRIOR YEAR`, and checks it contains `MADE-UP`. Run `node tests/sandbox-kit.test.js`: expect `sandbox-kit tests FAILED: 1 of`; append `task 4 red 1` to `L/red-green.log`.
2. Edit line 6 to `PRIOR YEAR (MADE-UP) - Management discussion, Tarnwick Works`. Do not touch `sandbox/built*` or the uploaded copy.
3. Run the test: `sandbox-kit tests pass: ` with the old count plus 1. If the "small, made up and clean" test fails on the 2500-character limit, shorten the tag.
4. Commit `task 4: B4 MADE-UP tag on the prior-year heading`.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder" && grep -qx 'task 4 red 1' ../.ledger/2026-10-22-fit-finder-bca/red-green.log && grep -q '^PRIOR YEAR.*MADE-UP' sandbox/fr-yoy-narrative.txt && node tests/sandbox-kit.test.js | tail -n 1`
Expect: sandbox-kit tests pass:

---

### Task 5: Tooling scripts with a self-test and a README

Depends: 4

Files: create `fit-finder/tools/README.md`, `fit-finder/tools/check-set.js`, `fit-finder/tools/nearcopy.js`, `fit-finder/tools/agree.js`, `fit-finder/tools/card-view.js`, `fit-finder/tools/label-sheet.js`, `fit-finder/tools/label-handoff.js`, `fit-finder/tools/score-once.js`, `fit-finder/tools/keep-check.js`, `fit-finder/tools/ops-check.js`, `fit-finder/tools/selftest.js`, `fit-finder/tools/fixtures/` (tiny made-up fixtures).

`tools/README.md` is the reference every later task reads; it states each script's arguments, outputs and exit codes exactly as below.

Behaviour (fixed here; each script exits non-zero on a problem and prints the count it checked):
- `check-set.js <prompts> <gold|-> <catalogue> [--not-range LO HI]`: fails on 0 rows, a row lacking string `id`/`task`, a repeated id, an `area` not in FR/GRC/SUS/GEN; with a gold file, fails on a missing or extra gold id, `fit` not in good/partial/not, `cards` not an array, a `not` row with cards, or a card id absent from the catalogue; with `--not-range LO HI` fails if the count of `not` gold rows is outside LO..HI. Prints `rows N, per area FR a GRC b SUS c GEN d, gold M, not K, unknown cards U`.
- `nearcopy.js <fresh> <real dir> [--catalogue <catalogue>]`: reads every `*.jsonl` in the real dir, collects all string values of each row, lowercases words, builds the set of 5-word windows; flags a fresh row if any of its windows is in the set. With `--catalogue` it also flags a fresh row sharing a 5-word window with any card's `try` text (a leak check). It never prints text; it prints `files read F, rows read R, windows W`, `control: hit`, `hits: none` or `hits: <fresh ids>`. It exits 1 if F, R or W is 0, if the positive control misses (a fake row built in memory from the first real window must be flagged), or if there is a hit.
- `agree.js <frozen> <final>`: compares by id. D = ids where `fit` differs or sorted `cards` differ. Exits 1 if any differing row lacks `"by":"ian"` or any unchanged row has it, or an id set differs. Prints `N <n> D <d> agreement <pct> PASS|FAIL`; PASS when (N-D)/N >= 0.845 (for N=40, D <= 6).
- `card-view.js <catalogue> <out>`: writes each use case minus `match` and `ops` (keeps `try`, which `match()` does not read) and prints `cards N`.
- `label-sheet.js <draft> <card-view> <out>` builds the label sheet (format in Task 9) and `label-sheet.js --verify <sheet> <draft> <catalogue>` checks it and prints `label-sheet ok`.
- `label-handoff.js <looks file> <sheet> <ian batch json> <catalogue> <out frozen> <out gold>` parses and validates the PM's PICK and Ian's batch and writes both outputs; `label-handoff.js --check <same six arguments>` recomputes both outputs in memory and exits 0 only if they equal the files byte for byte. Rules: the looks file must exist; the PICK is ONE line of space-separated `<id>=<label>` tokens found after a `PICK` marker in the looks file; every id in the sheet appears exactly once; a label is a catalogue card id, `none` or `not`; the batch file must exist, `words` must be non-empty, `sheetSha256` must equal the sha256 of the sheet file (and the sheet must match `L/label-sheet.sha256` if that file exists), `accepted` must be a boolean, each `changes[].id` a sheet id with a legal label, and `accepted:true` requires empty `changes`. Any violation prints `STOP: <reason>` and exits 3. Frozen file: one row per sheet id `{"id","fit","cards","by":"pm"}` from the PICK (card id: fit `good`, cards `[id]`; `none`: fit `good`, cards `[]`; `not`: fit `not`, cards `[]`). Gold: the frozen rows with Ian's `changes` applied the same way and `"by":"ian"` on exactly the changed rows (a change equal to the PM label is ignored and not tagged). Prints `label-handoff ok rows N changed D`.
- `score-once.js <name> <prompts> <gold> [--scorer <path>]`: runs `node tests/synth-score.js <prompts> <gold>` from the `fit-finder` folder (or the `--scorer` for self-tests) at most once per `<name>`. If `L/score-<name>.out` exists it prints that file's stdout part and exits with its recorded status, without running anything. Else if `L/score-<name>.started` exists with no `.out` it prints `STOP: unknown outcome` and exits 3. Else it writes `.started`, runs the scorer, writes `.out` atomically (temp file then rename) as first line `STATUS <n>`, then the scorer's stdout, prints the stdout and exits with the scorer's status. `L` is `<repo root>/.ledger/2026-10-22-fit-finder-bca`.
- `keep-check.js <EV>`: reads `BEFORE-LINE`, `AFTER-LINE`, `OUTCOME`, `REASON` from the evidence doc; R = number after `right feature first `, S = number after `score `. Rule: kept iff `R1 >= R0 + 1` and `S1 <= S0`. Derived REASON must equal the written one: `R gain < 1 (R0 to R1)` or `S rose (S0 to S1)` or `R gain < 1 and S rose (R0 to R1; S0 to S1)`; kept has `REASON: none`. It also checks the git state: if `reverted`, `node tests/match-frozen.js --base <task 11 commit>` passes without the flag; if `kept`, it passes with `--allow ops` and fails without. Prints `keep-check ok <outcome>`.
- `ops-check.js <base sha>`: compares `data/catalogue.json` at that sha with the working tree; passes only if every card's id, area, match and text fields are equal, each card's `ops` starts with the old `ops` (append only, `ops[0]` unchanged), every added value is in the `AI_OPS` list in `tests/catalogue.test.js` line 23, and at least one card changed. Prints `ops-check ok <n> cards changed`.
- `selftest.js` runs each script on fixtures with known answers and prints `selftest ok` or the first failure. Controls: check-set rejects a bad row, an unknown card and a `not` count outside the range; agree detects a changed label and a missed tag and passes a no-change case with `D 0`; nearcopy flags a planted window, and its zero-files case exits 1; label-handoff exits 3 on a missing batch file, an empty `words`, a wrong `sheetSha256`, a missing id, a duplicate id and an unknown label, and `--check` fails on an edited output; score-once runs a fixture scorer (which appends a line to a counter file) once and a second call prints the saved line with the counter still at one line, and a lone `.started` gives exit 3; keep-check's rule gives kept for (R+1, S equal), reverted for (R+0), reverted for an S rise; ops-check rejects a prepended step and accepts an appended one.

Steps:
1. Write `selftest.js` and the fixtures first; run it: it fails (scripts missing). Append `task 5 red 1` to `L/red-green.log`.
2. Write the ten scripts and `tools/README.md` as specified above. No engine edit; the self-test uses fixtures only and reads no real data.
3. Run `node fit-finder/tools/selftest.js` until it prints `selftest ok`.
4. Commit `task 5: tooling scripts, self-test and README` with `fit-finder/tools/`.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card" && grep -qx 'task 5 red 1' .ledger/2026-10-22-fit-finder-bca/red-green.log && test -s fit-finder/tools/README.md && node fit-finder/tools/selftest.js`
Expect: selftest ok

---

### Task 6: Guard changes: --allow ops in match-frozen and fair-guard, with tests

Depends: 5

Files: modify `fit-finder/tests/match-frozen.js`, `fit-finder/tests/fair-guard.js`, `fit-finder/tests/README.md` (one line); create `fit-finder/tests/match-frozen.test.js`.

Interface produced: `node tests/match-frozen.js --base <sha> [--allow ops]`: with the flag the compared tuple is `[u.id, u.area, u.match]` (`match` is a string, not an array); any other `--allow` value fails with `unknown --allow value`. `node tests/fair-guard.js ... [--allow ops]`: with the flag the catalogue strip also drops `ops` (it already drops `match`). Without the flag both behave as today.

Steps:
1. Write the failing test file `match-frozen.test.js`. It copies `data/catalogue.json` to a temp backup and restores it in a `try/finally` after each case. Each fixture first asserts its edit really changed the file (`JSON.stringify` before !== after), then calls the guard with `--base HEAD`. Cases: (a) one card's `ops` gets `"CHECK"` appended if absent, with `--allow ops`: exit 0 and `match-frozen PASS`; (b) same edit without the flag: exit 1; (c) replace the whole `match` string of one card with `"zzqx"`, with `--allow ops`: exit 1; (d) change one card's `area`: exit 1; (e) change one card's `id`: exit 1; (f) the engine case without writing the engine: run git from the repo root WT with the pathspec `:(top)fit-finder/engine/fit.js`: `ENG = git log --format=%H -n 1 -- ":(top)fit-finder/engine/fit.js"`, `PAR = ENG + '^'`; first assert `git rev-parse --verify ENG^{commit}` and `git rev-parse --verify PAR^{commit}` both exit 0 with 40-character output (ok title `engine commit and its parent resolve`); then run the guard with `--base PAR`; its output must contain `engine/fit.js differs`; (g) `--allow bogus`: exit 1 with `unknown --allow value`; (h) fair-guard with the flag: with the case-(a) edit in place, `node tests/fair-guard.js --base HEAD --lock-base HEAD --allow ops` output must NOT contain `differs from base outside match fields` (other failures such as uncommitted locked files are allowed and not asserted); (i) fair-guard without the flag, same edit: output MUST contain `differs from base outside match fields`.
2. Run `node tests/match-frozen.test.js`: it fails at case (a) and case (h) (flag unknown). Append `task 6 red <n>` (n at least 2) to `L/red-green.log`.
3. Implement match-frozen: read `--allow` like `--base`; value `ops` drops `u.ops` from the tuple; any other value pushes `unknown --allow value`; update the header comment.
4. Implement fair-guard: read `--allow` with the file's `opt('--allow')`; when `ops`, its `strip` also removes `ops`; update the header comment.
5. Run `node tests/match-frozen.test.js` green; confirm `git status --short` does not list `data/catalogue.json` (restored). Add one line to `tests/README.md`.
6. Commit `task 6: --allow ops in match-frozen and fair-guard` with the four files.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card" && grep -qE '^task 6 red [2-9]' .ledger/2026-10-22-fit-finder-bca/red-green.log && test "$(git status --short | grep -c 'data/catalogue.json')" = 0 && cd fit-finder && node tests/match-frozen.test.js | tail -n 3`
Expect: pass

---

### Task 7: B gate and C re-score of the two sealed sets

Depends: 6

Files: modify (or create) `docs/evidence/2026-10-22-fit-finder-after-park.md` (EV).

Checker note: do NOT run the scorer on the holdout or the blind set; read EV and the ledger records only.

Steps:
1. Run the eight Suite commands one at a time from FF (`node tests/catalogue.test.js`, `node tests/edge-cards.test.js`, `node tests/synth-score.test.js`, `node tests/sandbox-kit.test.js`, `node tests/match-frozen.test.js`, `node tests/prompts-strong.test.js`, `node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A`, `node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B`) and `node tests/match-frozen.js --base 83d6e50`. Expect each to pass (plus the new tests) and `match-frozen PASS`. Record in EV: `B-SHA: <git rev-parse --short HEAD>` and one `PRE-EXISTING: <title>` line per failure listed in `L/baseline-83d6e50.log` (or `PRE-EXISTING: none`).
2. Holdout hash from the committed bytes, not the working copy (working files are CRLF through `core.autocrlf=true`; HEAD bytes match the manifest `data/synth/2026-10-18-holdout.sha256`): `git show HEAD:fit-finder/data/synth/2026-10-18-holdout.jsonl | sha256sum | cut -c1-64` and `git show HEAD:fit-finder/data/card-gold-synth-holdout.jsonl | sha256sum | cut -c1-64` must equal `6d722c0de4afd43f5a0de9a549baf93e334060010e74fb6fbcfef755e7290803` and `4fc2e86fd1060d67e8af9ea8914ef2e2601baf71cb037861194f9e9bd5b8feaf`. A mismatch is a stop: write `STOP: holdout hash` in EV and do not score. Write `HOLDOUT-HASH: <hash1> <hash2>` in EV.
3. The 10-19 blind set has no manifest: write `BLIND-HASH: <hash1> <hash2>` in EV, the HEAD-byte hashes of `fit-finder/data/synth/2026-10-19-blind.jsonl` and `fit-finder/data/card-gold-synth-blind.jsonl`.
4. Score the holdout ONCE, through the wrapper, from FF: `node tools/score-once.js holdout data/synth/2026-10-18-holdout.jsonl data/card-gold-synth-holdout.jsonl`. It prints the scorer's one line (and on a retry prints the saved record without re-running). If it exits 3 (a started run with no record) write `STOP: holdout outcome unknown` in EV and finish. Write the line verbatim after `HOLDOUT-LINE: ` in EV. Do not open the data files. Prediction (assumed): K near 10.
5. Score the 10-19 blind set ONCE the same way: `node tools/score-once.js blind data/synth/2026-10-19-blind.jsonl data/card-gold-synth-blind.jsonl`; verbatim after `BLIND-LINE: `. Prediction (assumed): K near 12.
6. Add a short note to EV: whether K matched each prediction, the sandbox-copy note (the copy uploaded to Workiva AI is unchanged), the B2 control deviation. Commit `task 7: B gate and C re-score of the sealed sets` with EV.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card" && E=docs/evidence/2026-10-22-fit-finder-after-park.md && L=.ledger/2026-10-22-fit-finder-bca && test "$(grep -c '^HOLDOUT-LINE: first card right: .*; split: right feature first [0-9]* of [0-9]*, rightly none [0-9]* (' $E)" = 1 && test "$(grep -c '^BLIND-LINE: first card right: .*; split: right feature first [0-9]* of [0-9]*, rightly none [0-9]* (' $E)" = 1 && head -n 1 $L/score-holdout.out | grep -qx 'STATUS 0' && head -n 1 $L/score-blind.out | grep -qx 'STATUS 0' && test "$(tail -n +2 $L/score-holdout.out | head -n 1)" = "$(grep '^HOLDOUT-LINE: ' $E | cut -c16-)" && test "$(tail -n +2 $L/score-blind.out | head -n 1)" = "$(grep '^BLIND-LINE: ' $E | cut -c13-)" && grep -q '^HOLDOUT-HASH: 6d722c0de4afd43f5a0de9a549baf93e334060010e74fb6fbcfef755e7290803 4fc2e86fd1060d67e8af9ea8914ef2e2601baf71cb037861194f9e9bd5b8feaf' $E && test "$(git show HEAD:fit-finder/data/synth/2026-10-18-holdout.jsonl | sha256sum | cut -c1-64)" = 6d722c0de4afd43f5a0de9a549baf93e334060010e74fb6fbcfef755e7290803 && grep -q '^BLIND-HASH: [0-9a-f]\{64\} [0-9a-f]\{64\}' $E && grep -q '^B-SHA: ' $E && ! grep -q '^STOP' $E && cd fit-finder && node tests/match-frozen.js --base 83d6e50`
Expect: match-frozen PASS

---

### Task 8: A1a blind sentence writer (Sonnet worker, not the top model)

Depends: 7

Files: create (ledger only, NOT added to git) `L/fresh-draft.jsonl` with rows `{"id":"F1","area":"FR","task":"..."}`.

Steps:
1. Write about 40 task sentences as a Workiva customer would describe a task in their own words: 10 per area for FR (financial reporting), GRC, SUS (sustainability) and GEN (general writing and documents); about 10 of the 40 are not a fit for a text-reading assistant (approving, sending, booking, chasing people, exact arithmetic); one to three sentences each; vary length and wording (some terse, some chatty). Do this without opening any file in the repository: you must not read `fit-finder/engine/`, `fit-finder/data/catalogue.json`, any `data/synth/` or `card-gold*` file, `data/real/`, `data/top3/`, the sealed folder, or any earlier set, and you must not name or write toward any product feature or card. Write the rows directly to `L/fresh-draft.jsonl` (ids F1 to Fn). Only after the file is written, read `fit-finder/tools/README.md` for the check scripts' exact usage.
2. Run `node fit-finder/tools/check-set.js .ledger/2026-10-22-fit-finder-bca/fresh-draft.jsonl - fit-finder/data/catalogue.json` and `node fit-finder/tools/nearcopy.js .ledger/2026-10-22-fit-finder-bca/fresh-draft.jsonl fit-finder/data/real --catalogue fit-finder/data/catalogue.json`. If `check-set.js` fails, fix the rows. If `nearcopy.js` flags ids (it prints ids only, never text), rewrite those sentences from scratch and rerun until `hits: none`. Do not look at the real files to see why.
3. Do not `git add` anything. Commit with `git commit --allow-empty -m "task 8: blind sentence draft written"` plus the two attribution lines.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder" && node tools/check-set.js ../.ledger/2026-10-22-fit-finder-bca/fresh-draft.jsonl - data/catalogue.json && node tools/nearcopy.js ../.ledger/2026-10-22-fit-finder-bca/fresh-draft.jsonl data/real --catalogue data/catalogue.json && test "$(node -e "const n=require('fs').readFileSync('../.ledger/2026-10-22-fit-finder-bca/fresh-draft.jsonl','utf8').split('\n').filter(Boolean).length;console.log(n>=38&&n<=44?'rowsok':'rowsbad')")" = rowsok && test -z "$(git status --short -- data/synth | grep fresh)"`
Expect: hits: none

---

### Task 9: A1b label sheet for the PM first pass and Ian's one-batch confirmation (Look task)

Depends: 8

Look: true
Captures: .ledger/2026-10-22-fit-finder-bca/captures/labels/*.md

Files: create (ledger) `L/pm-card-view.json`, `L/captures/labels/label-sheet.md`, `L/label-sheet.sha256`.

Steps:
1. Read `fit-finder/tools/README.md`. Run `node fit-finder/tools/card-view.js fit-finder/data/catalogue.json .ledger/2026-10-22-fit-finder-bca/pm-card-view.json` (cards without `match` and `ops`).
2. Run `node fit-finder/tools/label-sheet.js .ledger/2026-10-22-fit-finder-bca/fresh-draft.jsonl .ledger/2026-10-22-fit-finder-bca/pm-card-view.json .ledger/2026-10-22-fit-finder-bca/captures/labels/label-sheet.md`. The sheet must contain, in this order: (1) the line `PM FIRST PASS (ruling 2026-10-22-fit-finder-pm-labels-first): label every row below per the guide that follows; read only this sheet, never fit-finder/engine/, data/catalogue.json, data/synth/, data/card-gold*, data/real/, data/top3/, the workiva-sealed folder or any earlier set.` (2) the full text of `fit-finder/data/LABELING.md`; (3) the card list from `pm-card-view.json` (id, area, card text, `try`); (4) one block per fresh row: `id`, `area`, the sentence; (5) the output instruction, which must say: `Your whole reply is under 150 words. PICK is ONE line of space-separated tokens, one per row, <id>=<label>, for example F1=gen-translate F2=not F3=none. The label is the id of the single best card (first card), or none (the task fits but no card does), or not (not a fit), per the guide. No other text on the PICK line. WHY: one short line on any row you are unsure of. CHECKED: the files you opened (the sheet only).`
3. Run `node fit-finder/tools/label-sheet.js --verify <sheet> .ledger/2026-10-22-fit-finder-bca/fresh-draft.jsonl fit-finder/data/catalogue.json` and fix the sheet until it prints `label-sheet ok`. Then write the sheet's sha256 (`sha256sum`, first field) to `L/label-sheet.sha256`.
4. Commit with `git commit --allow-empty -m "task 9: label sheet for the PM pass and Ian"` plus the two attribution lines.

After this task's worker and checker pass, the driver's PM worker opens the capture and files PICK/WHY/CHECKED in `runs/2026-10-22-fit-finder-bca/looks/9.md`. The run then waits for Ian (see "After the label batch"). Plain words for Ian: "The PM has labelled the made-up sentences; accept them, or say which rows you would label differently."

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder" && node tools/label-sheet.js --verify ../.ledger/2026-10-22-fit-finder-bca/captures/labels/label-sheet.md ../.ledger/2026-10-22-fit-finder-bca/fresh-draft.jsonl data/catalogue.json && test "$(sha256sum ../.ledger/2026-10-22-fit-finder-bca/captures/labels/label-sheet.md | cut -c1-64)" = "$(cut -c1-64 ../.ledger/2026-10-22-fit-finder-bca/label-sheet.sha256)"`
Expect: label-sheet ok

---

### Task 10: A1c gold from the PM labels and Ian's answer, agreement gate, commit the set

Depends: 9

Files: create `fit-finder/data/synth/2026-10-22-fresh.jsonl`, `fit-finder/data/synth/2026-10-22-fresh.sha256`, `fit-finder/data/card-gold-synth-fresh.jsonl`, `L/pm-labels.frozen.jsonl`; modify EV.

Steps:
1. Read `fit-finder/tools/README.md`. Inputs, at these exact paths: the PM's looks file `runs/2026-10-22-fit-finder-bca/looks/9.md` (under WT), Ian's answer `.ledger/2026-10-22-fit-finder-bca/ian-label-batch.json` (written by the session that put the batch to Ian: keys `sheetSha256`, `words`, `accepted`, `changes`), the sheet `L/captures/labels/label-sheet.md`.
2. Run `node fit-finder/tools/label-handoff.js runs/2026-10-22-fit-finder-bca/looks/9.md .ledger/2026-10-22-fit-finder-bca/captures/labels/label-sheet.md .ledger/2026-10-22-fit-finder-bca/ian-label-batch.json fit-finder/data/catalogue.json .ledger/2026-10-22-fit-finder-bca/pm-labels.frozen.jsonl fit-finder/data/card-gold-synth-fresh.jsonl`. If it exits 3 (`STOP: ...`: missing looks file, missing batch file, empty words, wrong sheet hash, a bad PICK), write `STOP: <its reason>` in EV and finish; a missing batch file never means accepted. The frozen file is made from the PM's record before Ian's changes are applied.
3. Copy `L/fresh-draft.jsonl` to `fit-finder/data/synth/2026-10-22-fresh.jsonl`.
4. Run `node fit-finder/tools/check-set.js fit-finder/data/synth/2026-10-22-fresh.jsonl fit-finder/data/card-gold-synth-fresh.jsonl fit-finder/data/catalogue.json --not-range 8 12` (gold rows equal the prompt rows, `unknown cards 0`, `not` between 8 and 12). Outside that range, write `STOP: not count` in EV and finish.
5. Run `node fit-finder/tools/agree.js .ledger/2026-10-22-fit-finder-bca/pm-labels.frozen.jsonl fit-finder/data/card-gold-synth-fresh.jsonl` and copy its line after `AGREEMENT: ` in EV, plus the line `NOTE: PM labels are one card per row and no partial level; see the plan's deviations`. If it prints FAIL, write `STOP: agreement` in EV and do not commit the set or gold.
6. `git add` the two data files, then hash the staged bytes (CRLF safe): `git show :fit-finder/data/synth/2026-10-22-fresh.jsonl | sha256sum | cut -c1-64` and the same for the gold. Write `fit-finder/data/synth/2026-10-22-fresh.sha256` as `<hash> *prompts.jsonl` then `<hash> *gold.jsonl`, `git add` it and EV, and commit `task 10: fresh blind set committed (PM labels, Ian-confirmed), before any card change`.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder" && node tools/label-handoff.js --check ../runs/2026-10-22-fit-finder-bca/looks/9.md ../.ledger/2026-10-22-fit-finder-bca/captures/labels/label-sheet.md ../.ledger/2026-10-22-fit-finder-bca/ian-label-batch.json data/catalogue.json ../.ledger/2026-10-22-fit-finder-bca/pm-labels.frozen.jsonl data/card-gold-synth-fresh.jsonl && node tools/agree.js ../.ledger/2026-10-22-fit-finder-bca/pm-labels.frozen.jsonl data/card-gold-synth-fresh.jsonl && node tools/check-set.js data/synth/2026-10-22-fresh.jsonl data/card-gold-synth-fresh.jsonl data/catalogue.json --not-range 8 12 && test "$(git show HEAD:fit-finder/data/synth/2026-10-22-fresh.jsonl | sha256sum | cut -c1-64)" = "$(sed -n 1p data/synth/2026-10-22-fresh.sha256 | cut -c1-64)" && test "$(git show HEAD:fit-finder/data/card-gold-synth-fresh.jsonl | sha256sum | cut -c1-64)" = "$(sed -n 2p data/synth/2026-10-22-fresh.sha256 | cut -c1-64)" && grep -q '^AGREEMENT: N ' ../docs/evidence/2026-10-22-fit-finder-after-park.md && ! grep -q '^STOP' ../docs/evidence/2026-10-22-fit-finder-after-park.md`
Expect: PASS

---

### Task 11: A2 score the fresh set (before) and freeze the 13 ops rows

Depends: 10

Files: create `fit-finder/tools/ops-rows.js`, `L/ops-rows.frozen.jsonl`; modify EV; create (ledger) `L/progress-before-line.txt`.

Checker note: do NOT run the fresh-set scorer; read EV and the ledger records only.

Steps:
1. Confirm `git status --short | grep -c 'fit-finder/'` is `0` (nothing uncommitted there).
2. Read `fit-finder/tools/README.md`. Score the fresh set ONCE through the wrapper from FF: `node tools/score-once.js before data/synth/2026-10-22-fresh.jsonl data/card-gold-synth-fresh.jsonl`. If it exits 3, write `STOP: before outcome unknown` in EV and finish. Write the single line verbatim after `BEFORE-LINE: ` in EV, and the same line into `L/progress-before-line.txt`.
3. Write `fit-finder/tools/ops-rows.js`: it copies the selection logic of `docs/evidence/2026-10-20-fit-finder-no-card-probe.js` (read that script first; it finds, on the tune set and half A only, rows where a keyword hits but the task's step is missing from the card) and prints one JSON line per qualifying row `{"id","task","hitCards":[...],"missing":[...]}`, then a last line `qualifying rows N`. It opens only `data/synth/2026-10-18-tune.jsonl`, `data/tasks.jsonl` (half A) and their gold files. Its source must not contain the path patterns `data/real`, `2026-10-18-holdout`, `2026-10-19-blind`, `2026-10-22-fresh`, `card-gold-synth-fresh`, `data/top3`. It exits 1 if N is 0.
4. Freeze the rows now, on the unchanged catalogue: run it from FF and write the JSON lines (without the last `qualifying rows` line) to `L/ops-rows.frozen.jsonl`. The line count must be 13 (4 tune + 9 half A, spec lines 21-22); a different count is a stop: write `STOP: ops rows N` in EV and finish. Task 12 reads this frozen file and never re-extracts.
5. Commit `task 11: fresh set before-line, 13 ops rows frozen` with EV and `fit-finder/tools/ops-rows.js`.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card" && E=docs/evidence/2026-10-22-fit-finder-after-park.md && L=.ledger/2026-10-22-fit-finder-bca && test "$(grep -c '^BEFORE-LINE: first card right: .*; split: right feature first [0-9]* of [0-9]*, rightly none [0-9]* (' $E)" = 1 && head -n 1 $L/score-before.out | grep -qx 'STATUS 0' && test "$(tail -n +2 $L/score-before.out | head -n 1)" = "$(grep '^BEFORE-LINE: ' $E | cut -c14-)" && test "$(grep -c '^first card right: ' $L/progress-before-line.txt)" = 1 && test "$(wc -l < $L/ops-rows.frozen.jsonl | tr -d ' ')" = 13 && ! grep -q 'data/real\|2026-10-18-holdout\|2026-10-19-blind\|2026-10-22-fresh\|card-gold-synth-fresh\|data/top3' fit-finder/tools/ops-rows.js && ! grep -q '^STOP' $E && test "$(git status --short | grep -c 'fit-finder/')" = 0`

---

### Task 12: A3 card step lists (ops only)

Depends: 11

Files: modify `fit-finder/data/catalogue.json` (card `ops` arrays only).

Steps:
1. Read `fit-finder/tools/README.md`. Read `L/ops-rows.frozen.jsonl` (13 rows, each with task text, keyword-hit card ids and missing steps). Do NOT re-run `tools/ops-rows.js` and do not re-extract rows.
2. Using only those 13 rows, `fit-finder/data/capabilities-confirmed.md` and each hit card's text in the catalogue, add a step to a card's `ops` only if the card's feature really does it by the card text and the capabilities file. Append only, never change `ops[0]` (the engine uses `u.ops[0]` for the page prompt and ranks cards by shared ops). Allowed values are the `AI_OPS` list in `fit-finder/tests/catalogue.test.js` line 23. No change to id, area, match, engine, page or card text.
3. Do not open `data/synth/2026-10-22-fresh.jsonl`, `data/card-gold-synth-fresh.jsonl`, `data/synth/2026-10-18-holdout.jsonl`, `data/synth/2026-10-19-blind.jsonl`, `data/real/` or `data/top3/` at any point (the fresh set must not tune the thing it judges). The Check proves the change is ops-only and append-only; it cannot prove this reading rule, so it is yours to keep.
4. Run the Check's commands locally. If `fair-guard` or any suite test fails because of the new `ops` (it can shift prompts-strong or sandbox-kit), fix the ops change or drop the offending addition.
5. Commit `task 12: card step lists, ops only` with `fit-finder/data/catalogue.json`.

Timeout: 25 m

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder" && B=$(git rev-list -1 --grep='^task 11:' HEAD) && L10=$(git rev-list -1 --grep='^task 10:' HEAD) && test -n "$B" && test -n "$L10" && test "$(wc -l < ../.ledger/2026-10-22-fit-finder-bca/ops-rows.frozen.jsonl | tr -d ' ')" = 13 && node tools/ops-check.js $B && node tests/match-frozen.js --base $B --allow ops && ! node tests/match-frozen.js --base $B > /dev/null && node tests/fair-guard.js --base $B --lock-base $L10 --allow ops && node tests/catalogue.test.js && node tests/edge-cards.test.js && node tests/synth-score.test.js && node tests/sandbox-kit.test.js && node tests/match-frozen.test.js && node tests/prompts-strong.test.js && node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A && node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B`
Expect: fair-guard PASS

---

### Task 13: A4 score after, keep or revert (exact rule)

Depends: 12

Files: modify EV; possibly revert Task 12's commit.

Checker note: do NOT run the fresh-set scorer; the Check reads EV, the ledger record and the git state.

Steps:
1. Read `fit-finder/tools/README.md`. Score the fresh set ONCE through the wrapper from FF: `node tools/score-once.js after data/synth/2026-10-22-fresh.jsonl data/card-gold-synth-fresh.jsonl`. If it exits 3, write `STOP: after outcome unknown` in EV and finish. Write the line verbatim after `AFTER-LINE: ` in EV and append the same line to `L/progress-before-line.txt` under a line `AFTER:`.
2. Apply the rule exactly: KEEP only if `R1 >= R0 + 1` AND `S1 <= S0`, with R and S read from `BEFORE-LINE` and `AFTER-LINE` (R is the number after `right feature first `, S the number after `score `). Otherwise REVERT. Write `OUTCOME: kept` or `OUTCOME: reverted`. REASON is set by arithmetic: for kept `REASON: none`; reverted: `REASON: R gain < 1 (R0 to R1)` if only the first criterion failed, `REASON: S rose (S0 to S1)` if only the second, `REASON: R gain < 1 and S rose (R0 to R1; S0 to S1)` if both, with the real numbers. Also write a line `PREDICTION: held|did not hold` (spec: R1 - R0 >= 2 and wrong card rise at most 1).
3. If reverted: from WT run `git revert --no-commit <task 12 commit>` (find it with `git rev-list -1 --grep='^task 12:' HEAD`), then commit once as `task 13: revert card step lists (<REASON>)` including EV. If kept: commit `task 13: fresh set after-line, ops kept` with EV only.
4. Make no further scorer run on the fresh set in this run.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card" && E=docs/evidence/2026-10-22-fit-finder-after-park.md && L=.ledger/2026-10-22-fit-finder-bca && head -n 1 $L/score-after.out | grep -qx 'STATUS 0' && test "$(tail -n +2 $L/score-after.out | head -n 1)" = "$(grep '^AFTER-LINE: ' $E | cut -c13-)" && ! grep -q '^STOP' $E && node fit-finder/tools/keep-check.js $E`
Expect: keep-check ok

---

### Task 14: README, How it rates, page test, LF build, final suite and guard

Depends: 13

Files: modify `fit-finder/README.md` (numbers sections about lines 156-262; the dist byte count at line 15), `fit-finder/web/template.html` (the How it rates text), `fit-finder/tests/pagetest.js` (`HOW` constant at line 8, checked at line 96), `fit-finder/tests/build.js` (LF normalisation), `fit-finder/dist/fit-finder.html` (rebuilt), `fit-finder/tests/README.md`.

Steps:
1. Failing page test first: edit `HOW` in `tests/pagetest.js` to the new How it rates text, which in both outcomes carries the split numbers and the A result: the tune split (17 of 29 right feature first, 6 rightly none), the two C lines' right-first and rightly-none counts copied from the `HOLDOUT-LINE` and `BLIND-LINE` lines of EV, and the A result: either kept (`R0 to R1`, W0 to W1 from `BEFORE-LINE`/`AFTER-LINE`) or reverted with the exact `REASON:` string from EV. Copy numbers from EV, not from memory. Run `node tests/pagetest.js`. Chrome is required and was measured available (`98 checks, 0 failed` at the baseline); there is no fallback. The `How it rates text present` check must fail now; append `task 14 red 1` to `L/red-green.log`.
2. Edit `web/template.html` so its How it rates text equals `HOW`. Add the same numbers to `README.md` (split section, the two C lines verbatim, the A result with the same REASON wording, the agreement line from the `AGREEMENT:` line of EV) and edit the `tests/README.md` synth-score line to mention the split.
3. LF build: `tests/build.js` writes the template through, and `core.autocrlf=true` makes the working template CRLF. Append `.replace(/\r\n/g, '\n')` to the `html` constant (line 5). Run `node tests/build.js`; `grep -c $'\r' dist/fit-finder.html` must be `0`.
4. Put the byte count of the built `dist/fit-finder.html` (`wc -c`) into README line 15 (the old one is `92152`) and every nearby prose count.
5. Run the eight Suite commands (listed in Global Constraints) and `node tests/pagetest.js` (98 checks, 0 failed).
6. Commit `task 14: split numbers, A result and LF build on README and How it rates`, then measure `git show HEAD:fit-finder/dist/fit-finder.html | wc -c`; if it differs from the README's number, fix the README and make a second commit `task 14: README dist byte count` (no amend).

Timeout: 30 m

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-no-card/fit-finder" && T11=$(git rev-list -1 --grep='^task 11:' HEAD) && T13=$(git rev-list -1 --grep='^task 13:' HEAD) && test -n "$T11" && test -n "$T13" && grep -qx 'task 14 red 1' ../.ledger/2026-10-22-fit-finder-bca/red-green.log && test "$(git status --short | grep -c 'fit-finder/')" = 0 && test "$(git show HEAD:fit-finder/dist/fit-finder.html | grep -c $'\r')" = 0 && test "$(git show HEAD:fit-finder/dist/fit-finder.html | wc -c)" = "$(grep -o 'dist/fit-finder.html (\([0-9]*\) bytes' README.md | head -n 1 | grep -o '[0-9]*')" && grep -q 'rightly none' web/template.html && grep -q 'rightly none' README.md && test "$(git diff --name-only $T13 HEAD -- tests ../fit-finder/data/synth ':(glob)data/*.jsonl' | grep -v -x -e 'fit-finder/tests/pagetest.js' -e 'fit-finder/tests/build.js' -e 'fit-finder/tests/README.md' | wc -l)" = 0 && node tests/catalogue.test.js > /dev/null && node tests/synth-score.test.js > /dev/null && node tests/sandbox-kit.test.js > /dev/null && node tests/match-frozen.test.js > /dev/null && node tests/pagetest.js | tail -n 2 && node tests/fair-guard.js --base $T11 --lock-base HEAD --allow ops`
Expect: fair-guard PASS

---

## Expected breaks

scores a good pair | fixed by Task 1

## Review items covered

Round 1: 1 no groups (every task has its own worker and checker); 2 no jq (tools scripts with control counts, Task 5); 3 nearcopy with counts and a positive control (Tasks 5, 8); 4 frozen PM labels and agree.js by script, not by tag (Tasks 7, 10); 5 PM blindness (Look sheet text only; audit dropped, see Deviations); 6 guard change in Task 6, named `--lock-base` in Tasks 12 and 14; 7 How it rates and pagetest in Task 14 in both outcomes; 8 holdout hashed from HEAD bytes (Task 7); 9 `match` is a string, fixtures assert a real change, id case (Task 6); 10 read-only extractor, N must be 13 (Task 11); 11 LF build and `git show` size (Task 14).
Round 2: baseline suite without `match-frozen.test.js` (Tasks 0, 5); Task 1 case (c) suffix and prefix, exactly 3 red cases; transcript audit dropped; Task 6 case (f) `:(top)` pathspec; REASON by arithmetic verified by `keep-check.js`; fair-guard cases (h) and (i) named.
Round 3/4: 1 attribution lines verbatim (Global Constraints); 2 Chrome required, fallback deleted (Task 14); 3 exact label handoff paths and STOP conditions, "After the label batch" section (Tasks 9, 10); 4 PICK is one compact line of `<id>=<label>` tokens, parsed, validated and frozen by `label-handoff.js` (Tasks 7, 9, 10); 5 `score-once.js` for the holdout, blind, before and after lines (Tasks 5, 7, 11, 13); 6 the 13 ops rows frozen in Task 11, read by Task 12; 7 every task carries its lists or names `fit-finder/tools/README.md` or another exact file to read; 8 Task 11 path ban uses path patterns, `not` count 8-12 enforced in `check-set.js` and in the Task 10 Check, nearcopy's read of `data/real` accepted.
