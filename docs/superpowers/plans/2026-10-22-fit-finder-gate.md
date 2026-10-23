# Fit Finder no-card step 2: engine step parser and fit gate Implementation Plan (driver format)

> **For agentic workers:** executed by `node bin/driver.mjs --no-merge --run 2026-10-22-fit-finder-gate` (a fresh Sonnet build worker per task, then a read-only Sonnet checker that sees the task text and the Check output). There is no lead step anywhere in this plan.

**Goal:** Test whether widening the engine's step parser (request-verb phrases in the `OPS` patterns) and narrowing blocker patterns that fire on ordinary words lowers the "no card where one fits" count, judged on a fresh blind set written and labelled before any engine edit; keep the engine change only if the fresh set agrees.

**Architecture:** First the guard tools (`--allow engine` in `tests/match-frozen.js` and `tests/fair-guard.js`; a locked diagnostic `tools/diag-nocard.js`; a keep/revert checker `tools/gate-check.js` and an edit-scope checker `tools/engine-scope.js`), then a fresh blind set (Sonnet writer, PM first-pass labels, Ian confirms in one batch), then BEFORE score once, a capped tune loop on `engine/fit.js` only, AFTER score once, keep or revert by script, then docs and build if kept.

**Tech Stack:** Node (no npm deps), JSONL data, git. `jq` is NOT installed in this shell: every data check is a node script that exits non-zero on a bad input.

**Spec:** `.ledger/2026-10-22-fit-finder-gate/design.md` (approved by the PM proxy; git-ignored, read it from the ledger). Branch `fit-finder-gate`, base `ae60341`.

Suite: cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && node tests/catalogue.test.js && node tests/edge-cards.test.js && node tests/synth-score.test.js && node tests/sandbox-kit.test.js && node tests/match-frozen.test.js && node tests/prompts-strong.test.js && node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A && node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B
Data: fit-finder/data/synth/2026-10-22-gate-fresh.jsonl, fit-finder/data/synth/2026-10-22-gate-fresh.sha256, fit-finder/data/card-gold-synth-gate.jsonl, fit-finder/data/synth/2026-10-18-tune.jsonl (read only), fit-finder/data/card-gold-synth-tune.jsonl (read only), fit-finder/data/tasks.jsonl and fit-finder/data/card-gold-a.jsonl (read only), fit-finder/data/real (copied in, git-excluded, never opened or committed)
Spend: $0 (usage only)

## Global Constraints

These apply to every task and every worker.

- Names. WT = `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate`; FF = `WT/fit-finder`; L = `WT/.ledger/2026-10-22-fit-finder-gate` (the run's ledger, git-ignored; a worker may write files there and must not `git add` them); EV = `WT/docs/evidence/2026-10-22-fit-finder-gate.md`; BASE = `ae60341`. Check commands are written out in full.
- THE BAN (repeated in every task that reads data): never open, print, quote, list or `cat` `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or anything under `WT/../fit-finder-no-card/.ledger/2026-10-22-fit-finder-bca/` named `nocard-step1-*` (the K1-K40 set), nor any copy of it. Running `fit-finder/tools/nearcopy.js` (it reads `data/real` itself and prints counts and ids only) is the only allowed contact with `data/real`, and only in Task 4. Work repo: nothing to the brain or studio-harness.
- Every `fit-finder/tools/` script that takes a ledger reads the env var `FF_LEDGER`. Set `FF_LEDGER=WT/.ledger/2026-10-22-fit-finder-gate` in EVERY tool command (`score-once.js`, `label-handoff.js`, `diag-selftest.js`, and any other); never rely on the default, which points at the old bca ledger. Read `fit-finder/tools/README.md` before using a tool.
- Scope. Only `fit-finder/engine/fit.js` may change the engine, and only in Task 8 (the `OPS` pattern lines and the `rate()` gate lines from `let fit;` up to the `return { fit,` line). Card id, area, match and ops in `data/catalogue.json` stay frozen for the whole plan. `match()` is not edited. The 19 keyword misses are not a target. `engine/fit.js` has CRLF line endings in the working tree: keep them (edit in a way that preserves CRLF).
- Locked files (no task edits them except where the task names them): `fit-finder/tests/` (only Task 1 edits `match-frozen.js`, `fair-guard.js`, `match-frozen.test.js`, `README.md` there; Task 10 may edit `pagetest.js` and `README.md` there), `fit-finder/tools/` (Tasks 2 and 3 create files there; Tasks 4 to 7 only use them; locked from Task 8), `fit-finder/data/` (Task 6 adds the gate set and gold; nothing else), `fit-finder/data/catalogue.json`, `fit-finder/data/synth/2026-10-18-holdout.jsonl`, `fit-finder/data/synth/2026-10-19-blind.jsonl`, `fit-finder/data/synth/2026-10-18-tune.jsonl`, the old fresh set `fit-finder/data/synth/2026-10-22-fresh.jsonl` and `fit-finder/data/card-gold-synth-fresh.jsonl`, and the new gate set once committed.
- No push, no PR, no merge, no `git reset` of anything that was pushed (the driver runs with `--no-merge`; Ian merges). Commit exactly once at the end of the task as `task N: <title>` with N and the title from the heading, adding only the files the task names (`git add <named files>`, never `-A`, never the ledger or `data/real`); if nothing is tracked to commit, use `git commit --allow-empty -m "task N: <title>"`. Task 8 additionally makes its attempt commits (see the task); Task 10 may make a second commit. Every commit message ends with these two lines, verbatim:
  `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_018nnBdF1CRka9u3omGAzQPQ`
- Shas are found from the commit subjects: `git rev-list -1 --grep='^task N:' HEAD`. Never rely on a remembered sha (BASE is the one fixed sha).
- Once-only scoring: the gate set's before and after lines are produced only through `FF_LEDGER=... node tools/score-once.js gate-before|gate-after <prompts> <gold>`. Its record `L/score-gate-before.out` / `L/score-gate-after.out` is the only source for the line copied into EV. No other task runs a scorer on the gate set; no Check runs a scorer on it; Task 8 (the tune loop) never reads or scores it.
- Red-before-green proofs are recorded by the worker as lines in `L/red-green.log` (format in each task); a Check greps them. Every test that proves a criterion must fail on the parent commit.
- Evidence doc line prefixes (each on its own line, verbatim copies, never paraphrased): `BASE-SHA:`, `AGREEMENT:`, `BEFORE-LINE:`, `BEFORE:`, `PREDICTION-PM:`, `PREDICTION-LEAD:`, `AFTER-LINE:`, `AFTER:`, `OUTCOME:` (`kept`, `reverted` or `inconclusive`), `REASON:`, `PREDICTION:`, `TUNE-RESULT:`, `PINS-MOVED:`.
- Count definitions for `BEFORE:` / `AFTER:` summaries and any page claim: the feature count is the scorer's `split: right feature first R of F` (R of F), NOT `first card right: ...` (that number also counts rightly-none rows). Wrong card W, no card N and not-a-fit K come from the line's `wrong card W`, `no card where one fits N`, `card on a not-a-fit prompt K`. The keep rule uses only N, W and K.
- Pins that must hold at the end (via `tests/fair-guard.js`, directional: right not lower, wrong and not-a-fit not higher, eval agreement not lower): B 13/3, A 12/0, real 15/2, fresh 15/5/1/12, eval A 52, eval B 45 of 60. A pin that cannot hold is a failure to report, not an auto-accept. Printed numbers that move are listed under `PINS-MOVED:` for Ian (Task 10).
- Baseline numbers (measured by the lead's read-only probe; Task 0 and Task 2 re-measure them): tune right feature first 17 of 29, tune wrong 4, tune no card 8; half A right 12 of 29, wrong 0, no card 17; diag no-card N = 25.

## Deviations from the design and the previous plan (all forced by the driver)

- The blind writer is a Sonnet worker (spec A1 wanted a top-model helper; the driver gives every task a Sonnet worker). Blindness is by instruction and by script checks (the writer packet has only id, area, role, task and stays per card; near-copy and catalogue-leak scripts), not a transcript audit.
- The Look task (Task 5) replaces the lead's PM dispatch: the driver's PM worker labels the sheet in its PICK per `data/LABELING.md` (PM first pass). PICK is one compact line of `<id>=<label>` tokens: a label is the first card id, `none` or `not`. So the gold has no `partial` level and one gold card per row. Ian confirms in one batch (see "After the label batch"). The sheet text is exactly what the locked `tools/label-sheet.js` builds.
- New set and gold names (not the old `2026-10-22-fresh` ones): `data/synth/2026-10-22-gate-fresh.jsonl` (+ `.sha256`) and `data/card-gold-synth-gate.jsonl`, committed in Task 6 before any engine edit.
- New tools are in `fit-finder/tools/` (not locked by fair-guard): `diag-nocard.js` (Task 2), `gate-check.js` and `engine-scope.js` (Task 3). The old `keep-check.js` (ops rule) is not used.
- Added to the design: the BEFORE and AFTER summaries show the right-feature count (`split: right feature first R of F`), wrong card, no card and card-on-a-not-a-fit, copied to `BEFORE:` / `AFTER:` lines and printed by `gate-check.js`.
- The design says "revert the engine commit(s)" if not kept: Task 9 reverts with `git revert --no-commit` of the commits that touched `engine/fit.js`, then one commit. If the outcome is `inconclusive` there is no engine edit to revert.
- If reverted or inconclusive, Task 10 runs the suite and fair-guard on HEAD and changes no page text (design: "If reverted, suite + fair-guard on HEAD").
- Rehearse: this plan adds new files only and edits no existing data file, so it carries no `rehearse` block.

## Run estimate (assumed, helper tokens; not measured)

Groups: G1 guards and tools (Tasks 1-3, can run while the label batch awaits Ian); G2 fresh set (Tasks 4-6, Task 5 awaits Ian); G3 score and tune (Tasks 7-9); G4 finish (Task 10). Tune task: Task 8 (TUNE BRIEF inside). Task 8 carries `Tokens: 900000` (driver default cap is 400000).

| Task | Group | Estimate (tokens) |
|---|---|---|
| 0 baseline | G1 | 60k |
| 1 guard --allow engine | G1 | 150k |
| 2 diag-nocard | G1 | 120k |
| 3 gate-check and engine-scope | G1 | 180k |
| 4 blind writer | G2 | 70k |
| 5 label sheet (Look) | G2 | 80k |
| 6 gold, agreement, commit | G2 | 100k |
| 7 score BEFORE | G3 | 80k |
| 8 tune (TUNE) | G3 | 700k |
| 9 score AFTER, keep or revert | G3 | 100k |
| 10 finish | G4 | 250k |
| checkers (11 x about 40k) | all | 440k |

Run total estimate: about 2.3M tokens (usage, not money). Paid calls: none. The driver's own final Opus review, Codex review and merge gate run after the last task (the merge is refused: `--no-merge`).

## After the label batch (not a task; for the session that talks to Ian)

When the run reaches `awaiting` on Task 5: put the label sheet (`L/captures/labels/label-sheet.md`) and the PM's PICK (`runs/2026-10-22-fit-finder-gate/looks/5.md`) to Ian as one batch in plain words ("accept the PM labels, or say which rows differ"). Then that session (not the driver) writes `.ledger/2026-10-22-fit-finder-gate/ian-label-batch.json`:
`{"sheetSha256":"<sha256 of label-sheet.md>","words":"<Ian's answer, verbatim>","accepted":true|false,"changes":[{"id":"G7","label":"gen-translate"}]}` (`label` uses the PICK vocabulary: a card id, `none` or `not`; `changes` is empty when `accepted` is true). It then marks Task 5 done in the run's `progress.md` in the driver's row format and restarts the driver. A missing file never means "accepted": Task 6 stops.

---

### Task 0: Baseline at ae60341

Depends: none

Files: create `docs/evidence/2026-10-22-fit-finder-gate.md` (EV); create (ledger, not committed) `L/baseline-ae60341.log`, `L/base-lines.txt`, `L/base-k.txt`, `L/red-green.log`.

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or the `nocard-step1-*` K1-K40 files under the old bca ledger. Running the suite is fine; opening those files is not.

Steps:
1. Confirm `git merge-base --is-ancestor ae60341 HEAD` exits 0 and `git status --short -- fit-finder` prints nothing. If either fails, write `STOP: base` in `L/baseline-ae60341.log` and finish.
2. Run these nine commands one at a time from FF, appending to `L/baseline-ae60341.log` the line `== <command> exit <n>` after each one's output: `node tests/catalogue.test.js`, `node tests/edge-cards.test.js`, `node tests/synth-score.test.js`, `node tests/sandbox-kit.test.js`, `node tests/match-frozen.test.js`, `node tests/prompts-strong.test.js`, `node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A`, `node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B`, `node tests/fair-guard.js --base ae60341`. A failing command is recorded, not fixed; write `STOP: <command>` in the log for any non-zero exit.
3. Save the baseline numbers into `L/base-lines.txt`, exactly 7 lines, in this order: the four suite lines from `node tests/catalogue.test.js` that start `first card right:`, `half A first card right:`, `real prompts first card right:`, `fresh prompts first card right:`; the first `fit agreement` line of eval A and of eval B (`grep -m1 'fit agreement'`); and the tune line from `node tests/synth-score.test.js`'s sibling scorer `node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl` (the tune set is not sealed).
4. From the tune line take the number after `card on a not-a-fit prompt ` and write `K=<n>` to `L/base-k.txt`.
5. Create the empty `L/red-green.log`. Create EV with the heading `# Fit Finder no-card step 2: gate and parser (evidence)`, the line `BASE-SHA: ae60341`, and the 7 lines of `L/base-lines.txt` under the text `BASELINE (measured at ae60341):`.
6. Commit `task 0: baseline at ae60341` with EV only.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && L=../.ledger/2026-10-22-fit-finder-gate && test "$(grep -c '^== .* exit [0-9]*$' $L/baseline-ae60341.log)" = 9 && ! grep -q '^STOP' $L/baseline-ae60341.log && test "$(wc -l < $L/base-lines.txt | tr -d ' ')" = 7 && grep -q 'wrong card 4 (' $L/base-lines.txt && grep -q 'no card where one fits 8 (' $L/base-lines.txt && grep -q '^K=[0-9][0-9]*$' $L/base-k.txt && grep -q '^BASE-SHA: ae60341' ../docs/evidence/2026-10-22-fit-finder-gate.md && grep -c '^== .* exit 0$' $L/baseline-ae60341.log`
Expect: 9

---

### Task 1: Guard change: --allow engine in match-frozen and fair-guard, with tests

Depends: 0

Timeout: 25 m

Files: modify `fit-finder/tests/match-frozen.js`, `fit-finder/tests/fair-guard.js`, `fit-finder/tests/match-frozen.test.js`, `fit-finder/tests/README.md` (one line). Ledger: append to `L/red-green.log`.

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or the `nocard-step1-*` K1-K40 files under the old bca ledger.

Interface produced: `node tests/match-frozen.js --base <sha> [--allow ops|engine]`: with `engine` the `engine/fit.js` difference is not reported; the catalogue tuple stays `[id, area, ops, match]` (card id, area, match and ops stay frozen). Any other `--allow` value fails with `unknown --allow value`. `node tests/fair-guard.js ... [--allow ops|engine]`: `ops` unchanged; `engine` additionally runs `node tests/match-frozen.js --base <base> --allow engine` and fails if that fails; any other value fails with `unknown --allow value`. Without the flag both behave as today.

Steps:
1. Add the failing cases to `tests/match-frozen.test.js` (it already has `withEdit`, `addCheck`, `node`, `out`, `ok`). Add an engine helper after the `backup` line:
```js
const engPath = path.join(root, 'engine/fit.js'), engBackup = path.join(os.tmpdir(), 'fit-backup-' + process.pid + '.js');
fs.copyFileSync(engPath, engBackup);
const withEngine = (title, fn) => {
  try {
    const before = fs.readFileSync(engPath, 'utf8');
    fs.writeFileSync(engPath, before + '\n// gate-test edit\n');
    ok(title + ': engine edit changed the file', fs.readFileSync(engPath, 'utf8') !== before);
    fn();
  } finally { fs.copyFileSync(engBackup, engPath); }
};
```
   Add before the final `fs.rmSync(backup...)` line (and also `fs.rmSync(engBackup, { force: true })` there): (j) `withEngine`: `match-frozen.js --base HEAD --allow engine` exits 0 and prints `match-frozen PASS`; (k) `withEngine`, no flag: exit 1 and output contains `engine/fit.js differs`; (l) `withEngine` wrapping a `withEdit` with the existing `addCheck` ops edit, `--allow engine`: exit 1 (ops stays frozen); (m) `withEngine` wrapping a `withEdit` that sets `c.useCases[0].match = 'zzqx'`, `--allow engine`: exit 1; (n) `node tests/fair-guard.js --base HEAD --lock-base HEAD --allow bogus`: output contains `unknown --allow value`; (o) a `withEdit` that sets `match = 'zzqx'`, then `node tests/fair-guard.js --base HEAD --lock-base HEAD --allow engine`: output contains `match-frozen` and `FAIL`; (p) `withEngine`, `fair-guard.js --base HEAD --lock-base HEAD --allow engine`: output does NOT contain `engine/fit.js differs`.
2. Run `node tests/match-frozen.test.js`. Cases j, n and o must fail on the parent (flag unknown). Append `task 1 red <n>` (n at least 3, the real count of failing cases) to `L/red-green.log`. Run `git diff --quiet HEAD -- engine data/catalogue.json` and confirm exit 0 (the helpers restored the files).
3. Implement `tests/match-frozen.js`: change the flag check to `if (j >= 0 && !['ops', 'engine'].includes(allow)) bad.push('unknown --allow value: ' + allow);`; wrap the engine diff (the `const d = git(['diff', '--quiet', ...` line and its `if`) in `if (allow !== 'engine') { ... }`; update the header comment (with `engine` the engine may differ; id, area, ops, match still frozen).
4. Implement `tests/fair-guard.js`: replace the `allowOps` line with `const allowV = opt('--allow'); const allowOps = allowV === 'ops', allowEngine = allowV === 'engine';`; after `const bad = [];` add `if (allowV !== undefined && !allowOps && !allowEngine) bad.push('unknown --allow value: ' + allowV);`; inside the `else` branch of `if (!base)`, add `if (allowEngine) { const mf = run(['tests/match-frozen.js', '--base', base, '--allow', 'engine']); if (mf.status !== 0) bad.push('card id/area/ops/match changed: ' + (mf.stdout || '').trim()); }`; update the header comment.
5. Run `node tests/match-frozen.test.js` until green; confirm `git diff --quiet HEAD -- engine data/catalogue.json` (exit 0). Add one line to `tests/README.md`: `node tests/match-frozen.js --base <sha> --allow engine` (and `fair-guard.js ... --allow engine`) lets `engine/fit.js` differ; card id, area, match and ops stay frozen.
6. Commit `task 1: --allow engine in match-frozen and fair-guard` with the four files.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && grep -qE '^task 1 red [3-9]' ../.ledger/2026-10-22-fit-finder-gate/red-green.log && git diff --quiet HEAD -- engine data/catalogue.json && node tests/match-frozen.test.js | tail -n 3`
Expect: match-frozen tests pass

---

### Task 2: diag-nocard.js, the locked number for the tune loop

Depends: 0

Files: create `fit-finder/tools/diag-nocard.js`, `fit-finder/tools/diag-selftest.js`, `fit-finder/tools/fixtures/diag-engine-wrong.js`, `fit-finder/tools/fixtures/diag-engine-none.js`; modify `fit-finder/tools/README.md` (one table row). Ledger: append to `L/red-green.log`.

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, the `nocard-step1-*` K1-K40 files, or any gate or fresh set. This script reads only the tune set and half A.

Interface produced: `node tools/diag-nocard.js [--engine <path>]` (run from FF; `--engine` only for the self-test) prints exactly one line `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`. If tune wrong W > 4, or tune not-a-fit K > BASE_K, or half A wrong > 0, it also prints `INVALID: <reasons>` and exits 1; else exit 0. Bad input exits 2 with nothing on stdout. It also exports `judge({T, A, W, K, wrongA})` returning the list of reasons (empty = valid). Definitions: first card = `match(task, cat)[0].id` using the engine's `match` and `data/catalogue.json`. Tune (`data/synth/2026-10-18-tune.jsonl` rows, gold `data/card-gold-synth-tune.jsonl`): T = rows with gold fit not `not`, gold cards non-empty and no first card; W = rows with gold fit not `not`, a first card and the first card not in gold cards; K = rows with gold fit `not` and a first card. Half A (`data/card-gold-a.jsonl`, task text from `data/tasks.jsonl` by id; every id must exist there and have `fit` not `not`, else exit 2): A = rows with non-empty gold cards and no first card; wrongA = rows with a first card not in gold cards. N = T + A.

Steps:
1. Write `tools/diag-selftest.js` first (it spawns `node tools/diag-nocard.js` from FF, and requires `./diag-nocard.js` for `judge`). Cases: (a) real engine: exit 0, stdout equals `diag no-card 25 (tune 8, halfA 17); tune wrong 4; tune not-a-fit <K>` with K read from `L/base-k.txt` (`K=<n>`; L from `FF_LEDGER`); (b) `--engine tools/fixtures/diag-engine-wrong.js` (a stub exporting `match: () => [{ id: 'fr-tie-out' }]` and a `rate` returning `{ fit: 'good' }`): exit 1 and stdout contains `INVALID`; (c) `--engine tools/fixtures/diag-engine-none.js` (`match: () => []`): exit 0, no `INVALID`, and N larger than 25; (d) `judge` with `{T:8, A:17, W:5, K:K0, wrongA:0}` returns a non-empty list; with `K0 + 1` returns non-empty; with `wrongA: 1` returns non-empty; with `{T:8, A:17, W:4, K:K0, wrongA:0}` returns an empty list. Print `diag-selftest ok` or the first failure.
2. Run `FF_LEDGER=<L> node tools/diag-selftest.js`: it fails (script missing). Append `task 2 red 1` to `L/red-green.log`.
3. Write `tools/diag-nocard.js` as specified. Put the constant `const BASE_K = <n>;` at the top, with `<n>` the number in `L/base-k.txt` (`K=<n>`), and `const MAX_TUNE_WRONG = 4;`. The script's source must not contain the path patterns `data/real`, `data/top3`, `2026-10-18-holdout`, `2026-10-19-blind`, `gate-fresh`, `card-gold-synth-gate`, `card-gold-synth-fresh`, `2026-10-22-fresh`. Run main only when `require.main === module`.
4. Run `FF_LEDGER=<L> node tools/diag-selftest.js` until it prints `diag-selftest ok`. Run `node tools/diag-nocard.js` and confirm the line is `diag no-card 25 (tune 8, halfA 17); tune wrong 4; tune not-a-fit <K>`. A different N or W disproves the lead's probe: write `STOP: diag baseline <line>` in `L/red-green.log` and do not change the expected text.
5. Add a row for `diag-nocard.js` and `diag-selftest.js` to `tools/README.md`. Commit `task 2: diag-nocard.js and self-test` with the new files and the README.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && L=../.ledger/2026-10-22-fit-finder-gate && grep -qx 'task 2 red 1' $L/red-green.log && grep -q "^const BASE_K = $(cut -d= -f2 $L/base-k.txt);" tools/diag-nocard.js && ! grep -q 'data/real\|data/top3\|2026-10-18-holdout\|2026-10-19-blind\|gate-fresh\|card-gold-synth-gate\|card-gold-synth-fresh\|2026-10-22-fresh' tools/diag-nocard.js && FF_LEDGER=$(cd .. && pwd)/.ledger/2026-10-22-fit-finder-gate node tools/diag-selftest.js && test "$(node tools/diag-nocard.js)" = "diag no-card 25 (tune 8, halfA 17); tune wrong 4; tune not-a-fit $(cut -d= -f2 $L/base-k.txt)"`
Expect: diag-selftest ok

---

### Task 3: gate-check.js and engine-scope.js, with a self-test

Depends: 0

Timeout: 20 m

Files: create `fit-finder/tools/gate-check.js`, `fit-finder/tools/engine-scope.js`, `fit-finder/tools/gate-selftest.js`; modify `fit-finder/tools/README.md` (two table rows). Ledger: append to `L/red-green.log`.

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or the `nocard-step1-*` K1-K40 files. These scripts read only the evidence doc, the engine and git.

Interfaces produced:
- `node tools/gate-check.js <EV> --stage before|final [--no-git]` (`--no-git` only for the self-test). Parses from EV the lines `BASE-SHA:`, `BEFORE-LINE:`, `BEFORE:`, `PREDICTION-PM:`, `PREDICTION-LEAD:`, and for `final` also `AFTER-LINE:`, `AFTER:`, `OUTCOME:`, `REASON:`, `PREDICTION:`. From a score line: feature count R of F = the two numbers after `split: right feature first ` (NOT `first card right:`, which also counts rightly-none rows), W = after `wrong card `, N = after `no card where one fits `, K = after `card on a not-a-fit prompt `. The summary line must equal `BEFORE: feature R of F, wrong W, no card N, not-a-fit K` (and `AFTER:` likewise), derived from its score line. Rules. `before` stage: all those lines present, summary equals the derived text, both PREDICTION lines present, and if N0 < 6 then `OUTCOME: inconclusive` and `REASON: before no-card < 6 (N0)` are present. `final` stage: if N0 < 6, OUTCOME must be `inconclusive`, there is no `AFTER-LINE` or `AFTER:` line, and REASON as above; else OUTCOME is `kept` or `reverted`, the AFTER lines are present, and the `PREDICTION-PM` / `PREDICTION-LEAD` lines are on earlier lines than `AFTER-LINE` (written before the AFTER score). Keep rule (unchanged, uses N, W, K only): kept iff `N0 - N1 >= 2` and `W1 <= W0` and `K1 <= K0`. Derived REASON: `none` for kept; else the failed parts joined by ` and `, in this order and wording: `no-card fall < 2 (N0 to N1)`, `wrong card rose (W0 to W1)`, `not-a-fit card rose (K0 to K1)`. A `PREDICTION:` line (final stage, non-inconclusive) must be `held` exactly when the outcome is kept, else `did not hold`. Git check (not with `--no-git`): BASE from `BASE-SHA:`; `reverted` or `inconclusive`: `git diff --quiet BASE HEAD -- fit-finder/engine/fit.js` exits 0 and `node tests/match-frozen.js --base BASE` passes; `kept`: the engine differs from BASE, `node tests/match-frozen.js --base BASE --allow engine` passes, and without the flag it fails. Prints `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after feature R1 of F1 wrong W1 no-card N1 not-a-fit K1` (the `after` part only at `final` when an AFTER-LINE exists; at `before` stage `<outcome>` is the OUTCOME if present else `pending`), else `gate-check FAIL: <reasons>` and exit 1.
- `engine-scope.js` exports `check(baseText, newText)` returning a list of problems (empty = ok). FIRST normalise both texts to LF (`replace(/\r\n/g, '\n')`; `engine/fit.js` has CRLF endings in the working tree while `git show` may give LF), then locate regions on the normalised text. Mask in both texts (a) from `  const OPS = {\n` to `\n  };\n  const AI_OPS` and (b) from `    let fit;\n` to `\n    return { fit,`. The masked texts must be identical; the set of `OPS` keys (lines matching `^\s{4}([A-Z]+):` inside region a) must be identical; region (b) must still start with `let fit;`; the added lines (a line diff of the normalised texts) must not contain `Date`, `performance`, `location`, `http`, `fetch`, `require(` or `process`. CLI `node tools/engine-scope.js --git <sha>` compares `git show <sha>:fit-finder/engine/fit.js` with the working file and prints `engine-scope ok` or `engine-scope FAIL: <problems>` (exit 1). It also accepts `--files <baseFile> <newFile>` for the self-test.

Steps:
1. Write `tools/gate-selftest.js` first. It builds evidence docs in memory (written to `os.tmpdir()`) and runs `gate-check.js ... --no-git`: before-stage ok; before-stage with N0 = 5 and no OUTCOME fails, with `OUTCOME: inconclusive` and the right REASON passes; final-stage cases: (N0 8, N1 6, W and K equal) kept with `REASON: none` passes; (N0 8, N1 7) reverted with `REASON: no-card fall < 2 (8 to 7)` passes and `kept` fails; (N0 8, N1 5, W 2 to 3) reverted with `REASON: wrong card rose (2 to 3)` passes; (N1 5, K 0 to 1) with `REASON: not-a-fit card rose (0 to 1)` passes; (N0 8, N1 8, W 2 to 3, K 0 to 1) must require ALL THREE reasons in order, `REASON: no-card fall < 2 (8 to 8) and wrong card rose (2 to 3) and not-a-fit card rose (0 to 1)` passes, and each of: the same with the middle reason missing, and the same with the first two reasons swapped, fails; a PREDICTION-PM line after the AFTER-LINE fails; a summary line that disagrees with its score line fails; a summary built from `first card right: R of F` instead of the `split:` numbers fails (use a score line where the two differ). For `engine-scope.js` it reads `engine/fit.js` and checks: `check(base, base)` is empty; a changed character inside the OPS block passes; a changed character inside the gate block passes; a changed `STEP` label (outside both) fails; a deleted OPS key fails; `Date.now()` added inside OPS fails; mixed line endings: with the base text CRLF and the new text LF-only (same content) the result is empty, with base LF and new text mixed (some lines CRLF, some LF) and a changed character inside OPS the result is empty, and with mixed endings plus a changed `STEP` label it fails. Print `gate-selftest ok` or the first failure.
2. Run `node tools/gate-selftest.js` (fails: scripts missing). Append `task 3 red 1` to `L/red-green.log`.
3. Write `tools/gate-check.js` and `tools/engine-scope.js` as specified (no engine edit, no network, no scorer call).
4. Run `node tools/gate-selftest.js` until it prints `gate-selftest ok`. Run `node tools/engine-scope.js --git ae60341` (expect `engine-scope ok`, since nothing changed, whatever the line endings).
5. Add two rows to `tools/README.md`. Commit `task 3: gate-check and engine-scope with self-test` with the three scripts and the README.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && grep -qx 'task 3 red 1' ../.ledger/2026-10-22-fit-finder-gate/red-green.log && node tools/engine-scope.js --git ae60341 && node tools/gate-selftest.js`
Expect: gate-selftest ok

---

### Task 4: Blind sentence writer (Sonnet worker, not the top model)

Depends: 0

Files: create (ledger only, NOT added to git) `L/writer-cards.json`, `L/writer-LABELING.md`, `L/gate-draft.jsonl` with rows `{"id":"G1","area":"FR","task":"..."}`.

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or the `nocard-step1-*` K1-K40 files. After step 1 the writer reads ONLY `L/writer-cards.json` and `L/writer-LABELING.md`. The writer must not open `fit-finder/engine/`, `fit-finder/data/catalogue.json` after step 1 (and never any `match`, `ops`, `prompt`, `try`, `refs` or `evidence` text), `fit-finder/data/synth/`, any `card-gold*` file, `fit-finder/data/tasks.jsonl`, or any earlier set. The sentences must not be steered toward any parser phrase or engine behaviour; this is a blind set.

Steps:
1. Build the writer packet with one node command (the catalogue is read by that command only, its output is not printed): `node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('fit-finder/data/catalogue.json','utf8'));fs.writeFileSync('.ledger/2026-10-22-fit-finder-gate/writer-cards.json',JSON.stringify({useCases:c.useCases.map(u=>({id:u.id,area:u.area,role:u.role,task:u.task,stays:u.stays}))},null,2))"`, then `cp fit-finder/data/LABELING.md .ledger/2026-10-22-fit-finder-gate/writer-LABELING.md`. Confirm `writer-cards.json` has, per card, exactly the keys `id`, `area`, `role`, `task`, `stays` and no `match`, `ops`, `prompt`, `try`, `refs`, `evidence` key.
2. Read only those two files. Write about 40 task sentences as a Workiva customer would describe a task in their own words, spread across the areas the cards cover (FR, GRC, SUS, GEN as they appear in `writer-cards.json`); about 6 to 10 of the 40 are not a fit for a text-reading assistant (approving, sending, booking, chasing people, exact arithmetic) per `writer-LABELING.md`; one to three sentences each; vary length and wording (some terse, some chatty). Write the rows directly to `L/gate-draft.jsonl` (ids G1 to Gn, area one of FR, GRC, SUS, GEN). Only after the file is written, read `fit-finder/tools/README.md` for the check scripts' exact usage.
3. Run `node fit-finder/tools/check-set.js .ledger/2026-10-22-fit-finder-gate/gate-draft.jsonl - fit-finder/data/catalogue.json` and `node fit-finder/tools/nearcopy.js .ledger/2026-10-22-fit-finder-gate/gate-draft.jsonl fit-finder/data/real --catalogue fit-finder/data/catalogue.json` (the script reads `data/real` itself and prints ids only; do not open the real files yourself). If `check-set.js` fails, fix the rows. If `nearcopy.js` flags ids, rewrite those sentences from scratch and rerun until `hits: none`. Do not look at the real files to see why.
4. Do not `git add` anything. Commit with `git commit --allow-empty -m "task 4: blind sentence draft written"` plus the two attribution lines.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && node -e "const c=JSON.parse(require('fs').readFileSync('../.ledger/2026-10-22-fit-finder-gate/writer-cards.json','utf8')).useCases;const ok=['id','area','role','task','stays'];if(!c.length||c.some(u=>Object.keys(u).some(k=>!ok.includes(k))))process.exit(1);console.log('writer-cards keys ok',c.length)" && node tools/check-set.js ../.ledger/2026-10-22-fit-finder-gate/gate-draft.jsonl - data/catalogue.json && node tools/nearcopy.js ../.ledger/2026-10-22-fit-finder-gate/gate-draft.jsonl data/real --catalogue data/catalogue.json && test "$(node -e "const n=require('fs').readFileSync('../.ledger/2026-10-22-fit-finder-gate/gate-draft.jsonl','utf8').split('\n').filter(Boolean).length;console.log(n>=38&&n<=44?'rowsok':'rowsbad')")" = rowsok && test -z "$(git status --short -- data/synth | grep gate)"`
Expect: hits: none

---

### Task 5: Label sheet for the PM first pass and Ian's one-batch confirmation (Look task)

Depends: 4

Look: true
Captures: .ledger/2026-10-22-fit-finder-gate/captures/labels/*.md

Files: create (ledger) `L/pm-card-view.json`, `L/captures/labels/label-sheet.md`, `L/label-sheet.sha256`.

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or the `nocard-step1-*` K1-K40 files. The PM pass labels from the sheet alone.

Steps:
1. Read `fit-finder/tools/README.md` and `fit-finder/tools/label-sheet.js` (locked; do not edit it). Run `node fit-finder/tools/card-view.js fit-finder/data/catalogue.json .ledger/2026-10-22-fit-finder-gate/pm-card-view.json` (cards without `match` and `ops`).
2. Run `node fit-finder/tools/label-sheet.js .ledger/2026-10-22-fit-finder-gate/gate-draft.jsonl .ledger/2026-10-22-fit-finder-gate/pm-card-view.json .ledger/2026-10-22-fit-finder-gate/captures/labels/label-sheet.md`. The sheet is exactly what that tool builds and `--verify` accepts byte for byte: its fixed PM FIRST PASS header line, the labeling guide, the card list, one block per row (`### <id> | <area>` and the sentence) and its fixed output instruction (whose example tokens such as `F1=gen-translate` are only an example; the real PICK uses the row ids G1..Gn). Do not edit the sheet by hand and do not change the tool.
3. Run `node fit-finder/tools/label-sheet.js --verify .ledger/2026-10-22-fit-finder-gate/captures/labels/label-sheet.md .ledger/2026-10-22-fit-finder-gate/gate-draft.jsonl fit-finder/data/catalogue.json`; it must print `label-sheet ok`. Then write the sheet's sha256 (`sha256sum`, first field) to `L/label-sheet.sha256`.
4. Commit with `git commit --allow-empty -m "task 5: label sheet for the PM pass and Ian"` plus the two attribution lines.

After this task's worker and checker pass, the driver's PM worker opens the capture and files PICK/WHY/CHECKED in `runs/2026-10-22-fit-finder-gate/looks/5.md`: it labels each row per `data/LABELING.md` in its PICK (PM first pass), using the row ids of the sheet. The run then waits for Ian (see "After the label batch"). Plain words for Ian: "The PM has labelled the made-up sentences; accept them, or say which rows you would label differently."

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && node tools/label-sheet.js --verify ../.ledger/2026-10-22-fit-finder-gate/captures/labels/label-sheet.md ../.ledger/2026-10-22-fit-finder-gate/gate-draft.jsonl data/catalogue.json && test "$(sha256sum ../.ledger/2026-10-22-fit-finder-gate/captures/labels/label-sheet.md | cut -c1-64)" = "$(cut -c1-64 ../.ledger/2026-10-22-fit-finder-gate/label-sheet.sha256)"`
Expect: label-sheet ok

---

### Task 6: Gold from the PM labels and Ian's answer, agreement gate, commit the set

Depends: 5

Files: create `fit-finder/data/synth/2026-10-22-gate-fresh.jsonl`, `fit-finder/data/synth/2026-10-22-gate-fresh.sha256`, `fit-finder/data/card-gold-synth-gate.jsonl`, `L/pm-labels.frozen.jsonl`; modify EV.

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or the `nocard-step1-*` K1-K40 files. No engine edit in this task.

Steps:
1. Read `fit-finder/tools/README.md`. Inputs at these exact paths: the PM's looks file `runs/2026-10-22-fit-finder-gate/looks/5.md` (under WT; the driver run name is `2026-10-22-fit-finder-gate`), Ian's answer `.ledger/2026-10-22-fit-finder-gate/ian-label-batch.json` (keys `sheetSha256`, `words`, `accepted`, `changes`), the sheet `L/captures/labels/label-sheet.md`.
2. Run `FF_LEDGER=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/.ledger/2026-10-22-fit-finder-gate node fit-finder/tools/label-handoff.js runs/2026-10-22-fit-finder-gate/looks/5.md .ledger/2026-10-22-fit-finder-gate/captures/labels/label-sheet.md .ledger/2026-10-22-fit-finder-gate/ian-label-batch.json fit-finder/data/catalogue.json .ledger/2026-10-22-fit-finder-gate/pm-labels.frozen.jsonl fit-finder/data/card-gold-synth-gate.jsonl`. If it exits 3 (`STOP: ...`: missing looks file, missing batch file, empty words, wrong sheet hash, a bad PICK), write `STOP: <its reason>` in EV and finish; a missing batch file never means accepted. The frozen file is made from the PM's record before Ian's changes are applied.
3. Copy `L/gate-draft.jsonl` to `fit-finder/data/synth/2026-10-22-gate-fresh.jsonl`.
4. Run `node fit-finder/tools/check-set.js fit-finder/data/synth/2026-10-22-gate-fresh.jsonl fit-finder/data/card-gold-synth-gate.jsonl fit-finder/data/catalogue.json --not-range 6 12` (`unknown cards 0`, `not` between 6 and 12). Outside that range, write `STOP: not count` in EV and finish.
5. Run `node fit-finder/tools/agree.js .ledger/2026-10-22-fit-finder-gate/pm-labels.frozen.jsonl fit-finder/data/card-gold-synth-gate.jsonl` and copy its line after `AGREEMENT: ` in EV, plus the line `NOTE: PM labels are one card per row and no partial level; see the plan's deviations`. If it prints FAIL (agreement under 84.5%), write `STOP: agreement` in EV and do not commit the set or gold.
6. `git add` the two data files, hash the staged bytes (CRLF safe): `git show :fit-finder/data/synth/2026-10-22-gate-fresh.jsonl | sha256sum | cut -c1-64` and the same for the gold. Write `fit-finder/data/synth/2026-10-22-gate-fresh.sha256` as `<hash> *prompts.jsonl` then `<hash> *gold.jsonl`, `git add` it and EV, and commit `task 6: gate fresh set committed (PM labels, Ian-confirmed), before any engine edit`.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate && FF_LEDGER=$W/.ledger/2026-10-22-fit-finder-gate node tools/label-handoff.js --check $W/runs/2026-10-22-fit-finder-gate/looks/5.md ../.ledger/2026-10-22-fit-finder-gate/captures/labels/label-sheet.md ../.ledger/2026-10-22-fit-finder-gate/ian-label-batch.json data/catalogue.json ../.ledger/2026-10-22-fit-finder-gate/pm-labels.frozen.jsonl data/card-gold-synth-gate.jsonl && node tools/agree.js ../.ledger/2026-10-22-fit-finder-gate/pm-labels.frozen.jsonl data/card-gold-synth-gate.jsonl && node tools/check-set.js data/synth/2026-10-22-gate-fresh.jsonl data/card-gold-synth-gate.jsonl data/catalogue.json --not-range 6 12 && test "$(git show HEAD:fit-finder/data/synth/2026-10-22-gate-fresh.jsonl | sha256sum | cut -c1-64)" = "$(sed -n 1p data/synth/2026-10-22-gate-fresh.sha256 | cut -c1-64)" && test "$(git show HEAD:fit-finder/data/card-gold-synth-gate.jsonl | sha256sum | cut -c1-64)" = "$(sed -n 2p data/synth/2026-10-22-gate-fresh.sha256 | cut -c1-64)" && grep -q '^AGREEMENT: N ' ../docs/evidence/2026-10-22-fit-finder-gate.md && ! grep -q '^STOP' ../docs/evidence/2026-10-22-fit-finder-gate.md && git diff --quiet ae60341 HEAD -- engine data/catalogue.json`
Expect: PASS

---

### Task 7: Score the gate set BEFORE (once) and write the predictions

Depends: 6, 1, 2, 3

Files: modify EV; create (ledger) `L/diag-before.txt`.

Checker note: do NOT run the scorer on the gate set; read EV and the ledger records only.

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or the `nocard-step1-*` K1-K40 files. No engine edit in this task.

Steps:
1. Confirm `git status --short -- fit-finder` prints nothing and, from FF, `git diff --quiet ae60341 HEAD -- engine data/catalogue.json` exits 0.
2. Read `fit-finder/tools/README.md`. Score the gate set ONCE through the wrapper from FF: `FF_LEDGER=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/.ledger/2026-10-22-fit-finder-gate node tools/score-once.js gate-before data/synth/2026-10-22-gate-fresh.jsonl data/card-gold-synth-gate.jsonl`. If it exits 3, write `STOP: before outcome unknown` in EV and finish. Write the single line verbatim after `BEFORE-LINE: ` in EV. Then write `BEFORE: feature R of F, wrong W, no card N, not-a-fit K` with R and F the two numbers after `split: right feature first ` (NOT the `first card right:` numbers), W after `wrong card `, N after `no card where one fits `, K after `card on a not-a-fit prompt `, all copied from that line.
3. Write the output of `node tools/diag-nocard.js` (a tune and half A reading, no gate-set data) to `L/diag-before.txt`.
4. Write these prediction lines in EV now, before any later task (from the design): `PREDICTION-PM: (assumed) no-card misses on the gate set fall by about a third; wrong card rises by at most 1.` and `PREDICTION-LEAD: (assumed) on tune + half A the loop recovers 3 to 5 of the 6 gate misses to the right card, and 0 to 2 of the 19 keyword misses. Keep only if, on the gate set: no-card misses fall by >= 2, wrong card does not rise, card-on-not-a-fit does not rise. Disproved by: a fall < 2, or any rise in wrong card or card-on-not-a-fit.`
5. Inconclusive guard: if N is less than 6, also write `OUTCOME: inconclusive` and `REASON: before no-card < 6 (N)` (with the real N) in EV. Every later engine task is then a no-op that records it.
6. Commit `task 7: gate set before-line and predictions` with EV.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && L=../.ledger/2026-10-22-fit-finder-gate && E=../docs/evidence/2026-10-22-fit-finder-gate.md && head -n 1 $L/score-gate-before.out | grep -qx 'STATUS 0' && test "$(tail -n +2 $L/score-gate-before.out | head -n 1)" = "$(grep '^BEFORE-LINE: ' $E | cut -c14-)" && ! grep -q '^STOP' $E && node tools/gate-check.js $E --stage before`
Expect: gate-check ok before

---

### Task 8: Tune loop: engine step parser and fit gate

Depends: 7

Timeout: 75 m

Tokens: 900000

Files: modify `fit-finder/engine/fit.js` (editable: the `OPS` pattern lines and the `rate()` gate lines from `let fit;` to the line before `return { fit,`, nothing else); create (ledger) `L/results.tsv`; modify EV (add `TUNE-RESULT:`).

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or the `nocard-step1-*` K1-K40 files. You must NOT open, score or read `fit-finder/data/synth/2026-10-22-gate-fresh.jsonl`, `fit-finder/data/card-gold-synth-gate.jsonl`, `fit-finder/data/synth/2026-10-22-fresh.jsonl`, `fit-finder/data/card-gold-synth-fresh.jsonl`, the holdout (`2026-10-18-holdout`) or the 10-19 blind set, nor `L/gate-draft.jsonl`, `L/writer-cards.json` or the label sheet: the set that judges the change must not tune it. You may read the tune set, half A and their gold (`data/synth/2026-10-18-tune.jsonl`, `data/card-gold-synth-tune.jsonl`, `data/tasks.jsonl`, `data/card-gold-a.jsonl`), the engine, the catalogue and the tests.

If EV contains the line `OUTCOME: inconclusive`: append `TUNE-RESULT: skipped (inconclusive)` to EV, commit `task 8: tune skipped (inconclusive)` with EV, and finish (no engine edit).

Otherwise run this loop (it is the tune-loop skill, inlined; you may not have the skill, so follow this text exactly):

```
TUNE BRIEF
number:        diag no-card N = tune no-card + half A no-card, from `node tools/diag-nocard.js` run in fit-finder/ (one line: diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K); lower is better; start 25
check:         cd fit-finder && node tools/diag-nocard.js   (prints INVALID and exits 1 when tune wrong > 4, tune not-a-fit rises over its base, or half A wrong > 0)
guard:         cd fit-finder && node tests/catalogue.test.js > /dev/null && node tests/fair-guard.js --base ae60341 --lock-base <task 6 commit> --allow engine   (suite exit 0 and fair-guard PASS)
editable:      fit-finder/engine/fit.js, the OPS pattern lines and the rate() gate lines only (from `let fit;` to before `return { fit,`)
locked:        fit-finder/tests/, fit-finder/tools/, fit-finder/data/, fit-finder/data/catalogue.json, the gate fresh set and gold, the old fresh set, the holdout and 10-19 blind sets, README and dist
attempts:      12
per-attempt:   5 m (neither the check nor the guard enforces its own deadline: wrap each in `timeout --kill-after=10 <seconds left>`)
cost cap:      12 attempts, 5 m per attempt, 60 m total wall time, 150 helper tool uses; tokens are recorded, not a cap
target:        N <= 19
visual:        no
```

Steps:
1. Context (measured by the lead's probe; sentence text is in the tune and half A files). Of 25 no-card misses on tune + half A, 6 are the fit gate saying `not`: 5 with no step parsed (tune N9, N29, N35, N83; half A id 75) and 1 with a blocker op (half A id 32: COMPARE + COLLECT). The other 19 pass the gate and miss on keywords (not a target). The 5 no-step sentences ask for "generate a starting matrix", "turn my notes into proper test procedures", "answering follow-up questions", "difference between X and Y, which should I use", "how do I reset". The parser has no step for these plain request verbs, and `match()` needs a shared step. The idea: add request-verb phrases to the existing AI step patterns in `OPS` (generate/create/build a draft or matrix, turn X into Y, answer questions, difference between / which should I use / how do I), and narrow blocker patterns that fire on ordinary words. Gate logic lines may change only if the loop shows a gain. `tests/catalogue.test.js` pins many phrases; the guard catches a break. `engine/fit.js` has CRLF endings; keep them.
2. Pre-check: get the task 6 commit sha (`git rev-list -1 --grep='^task 6:' HEAD`) and the task 7 commit sha (`git rev-list -1 --grep='^task 7:' HEAD`). Run the check 5 times on the untouched branch (log to `L/tune-precheck.log`). All 5 must be equal (it is deterministic); the keep rule is then "strictly lower than the best kept". If they differ, do not start: write `TUNE-RESULT: stopped, check not stable <values>` in EV, commit `task 8: tune stopped (check not stable)`, and finish. Note the start time (`date +%s`).
3. Loop. Log the baseline as `keep` in `L/results.tsv` (tab-separated columns: commit, number, status, seconds, description; status keep|discard|crash). Each attempt: one idea, edit only the editable lines, commit it BEFORE running (message `task 8 attempt <k>: <idea>`, with the two attribution lines), run the guard then the check with all output to a log file in L, read only the summary line. Keep ONLY if ALL hold: N is strictly lower than the best kept; the guard passes; the check did not print INVALID; `node tools/engine-scope.js --git ae60341` prints `engine-scope ok`; `git diff --name-only <task 7 commit> HEAD` lists ONLY `fit-finder/engine/fit.js` (the full allowlist, checked before every keep); and the simplicity rule holds (a tiny gain that adds messy code is discarded; the same number with less code is kept). Otherwise `git reset --keep <last kept commit>` (local, unpushed attempts only). `INVALID`, a crash or empty output is never a keep. Append one `results.tsv` line per attempt. An attempt past 5 minutes is discarded.
4. Stop at the first of: N <= 19; 12 attempts; 60 minutes wall time; 150 tool uses of your own; 3 crashes in a row. Check the clock and your count at the start of each attempt. Never pause to ask; never run past a cap. Never edit a locked file; never read the URL or the clock from the code under edit.
5. After the loop: HEAD must equal the last `keep` commit and the working tree clean (`git status --short -- fit-finder` empty). Run `node tools/engine-scope.js --git ae60341` (expect `engine-scope ok`) and `git diff --name-only <task 7 commit> HEAD` (expect only `fit-finder/engine/fit.js`, or nothing if no attempt was kept).
6. Write to EV one line: `TUNE-RESULT: start N 25, best N <best>, kept <k> of <attempts> attempts, stop <reason>, results L/results.tsv, tool uses <count>`. Commit `task 8: tune engine parser and fit gate (N <start> to <best>)` with EV (the kept attempt commits come before it; if no attempt was kept it is an EV-only commit). After it, `git diff --name-only <task 7 commit> HEAD` lists only `fit-finder/engine/fit.js` and `docs/evidence/2026-10-22-fit-finder-gate.md`.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && E=../docs/evidence/2026-10-22-fit-finder-gate.md && T6=$(git rev-list -1 --grep='^task 6:' HEAD) && T7=$(git rev-list -1 --grep='^task 7:' HEAD) && test -n "$T6" && test -n "$T7" && grep -q '^TUNE-RESULT: ' $E && git diff --quiet HEAD -- . && test -z "$(git diff --name-only $T7 HEAD | grep -v -x -e 'fit-finder/engine/fit.js' -e 'docs/evidence/2026-10-22-fit-finder-gate.md')" && node tools/engine-scope.js --git ae60341 && git diff --quiet $T6 HEAD -- tests tools data && node tests/catalogue.test.js > /dev/null && node tests/fair-guard.js --base ae60341 --lock-base $T6 --allow engine && node tools/diag-nocard.js`
Expect: fair-guard PASS

---

### Task 9: Score the gate set AFTER (once), keep or revert by script

Depends: 8

Files: modify EV; possibly revert Task 8's engine commits.

Checker note: do NOT run the scorer on the gate set; the Check reads EV, the ledger record and the git state.

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or the `nocard-step1-*` K1-K40 files.

Steps:
1. If EV contains `OUTCOME: inconclusive`: write nothing new in EV (the gate check forbids an AFTER line then), commit `git commit --allow-empty -m "task 9: after-score skipped (inconclusive)"` plus the attribution lines, and finish.
2. Otherwise read `fit-finder/tools/README.md`. Score the gate set ONCE from FF (even if Task 8 kept no engine change): `FF_LEDGER=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/.ledger/2026-10-22-fit-finder-gate node tools/score-once.js gate-after data/synth/2026-10-22-gate-fresh.jsonl data/card-gold-synth-gate.jsonl`. If it exits 3, write `STOP: after outcome unknown` in EV and finish. Write the line verbatim after `AFTER-LINE: ` in EV and the summary `AFTER: feature R of F, wrong W, no card N, not-a-fit K` (same derivation as `BEFORE:` in Task 7: R and F from `split: right feature first R of F`).
3. Apply the rule exactly (kept iff no-card falls by at least 2 AND wrong card does not rise AND card-on-a-not-a-fit does not rise, comparing `BEFORE-LINE` with `AFTER-LINE`). Write `OUTCOME: kept` or `OUTCOME: reverted`. REASON by arithmetic: `REASON: none` when kept; else the failed parts joined by ` and `, in this order: `no-card fall < 2 (N0 to N1)`, `wrong card rose (W0 to W1)`, `not-a-fit card rose (K0 to K1)`, with the real numbers (all three when all three fail). Write `PREDICTION: held` when kept, else `PREDICTION: did not hold` (the PREDICTION-PM and PREDICTION-LEAD lines were written in Task 7, before this score).
4. If reverted: from WT run `for c in $(git rev-list "$(git rev-list -1 --grep='^task 7:' HEAD)"..HEAD -- fit-finder/engine/fit.js); do git revert --no-commit $c; done` (newest first), confirm `git diff --cached --quiet ae60341 -- fit-finder/engine/fit.js` exits 0 (the staged engine equals BASE; if no commit touched the engine there is nothing to revert), then commit once as `task 9: revert engine tune (<REASON>)` including EV. If kept: commit `task 9: gate set after-line, engine tune kept` with EV only.
5. Make no further scorer run on the gate set in this run.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && L=../.ledger/2026-10-22-fit-finder-gate && E=../docs/evidence/2026-10-22-fit-finder-gate.md && ! grep -q '^STOP' $E && if grep -q '^OUTCOME: inconclusive' $E; then test ! -e $L/score-gate-after.out; else head -n 1 $L/score-gate-after.out | grep -qx 'STATUS 0' && test "$(tail -n +2 $L/score-gate-after.out | head -n 1)" = "$(grep '^AFTER-LINE: ' $E | cut -c13-)"; fi && node tools/gate-check.js $E --stage final`
Expect: gate-check ok final

---

### Task 10: Finish: docs and build if kept, final suite and guard

Depends: 9

Timeout: 30 m

Files: if `OUTCOME: kept`: modify `fit-finder/README.md` (numbers sections; the dist byte count at line 15), `fit-finder/web/template.html` (the How it rates text), `fit-finder/tests/pagetest.js` (`HOW` constant at line 8, checked at line 96), `fit-finder/tests/README.md` if a number it states moved, `fit-finder/dist/fit-finder.html` (rebuilt), EV. If `reverted` or `inconclusive`: EV only.

Ban: never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/`, or the `nocard-step1-*` K1-K40 files. Do not run a scorer on the gate set, the old fresh set, the holdout or the 10-19 blind set (all scored once; their recorded lines stay as they are, and any sentence about them says they were scored before this engine change).

Steps:
1. Read `OUTCOME:` in EV. If `reverted` or `inconclusive`: run the Suite commands from FF, write `PINS-MOVED: none (<outcome>, engine equals ae60341)` in EV, commit `task 10: final suite and guard on HEAD (<outcome>)` with EV, THEN run `node tests/fair-guard.js --base ae60341 --lock-base HEAD` from FF (fair-guard rejects uncommitted changes in locked paths, so it runs after the commit); it must print `fair-guard PASS`. Finish. Steps 2 to 8 are for `kept` only.
2. Kept. Compare the suite's printed numbers with `L/base-lines.txt` (Task 0): re-run `node tests/catalogue.test.js` (lines `first card right:`, `half A first card right:`, `real prompts first card right:`, `fresh prompts first card right:`), both `node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A|B` agreement lines, and the tune line `node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl` (the tune set is not sealed). For every one whose printed numbers differ from the baseline write one line in EV: `PINS-MOVED: <name> <old> -> <new>; reason: <one short line, e.g. which sentence now gets a step>`. If none differ write `PINS-MOVED: none`. These go to Ian.
3. Failing page test first: edit `HOW` in `tests/pagetest.js` to the new How it rates text: keep the existing text, update only the numbers that the re-run of step 2 shows moved (tune split, and any suite line it quotes), keep the sealed-set sentences as they are, and add one sentence on the gate set using the feature counts from `BEFORE:` and `AFTER:` in EV (the `split: right feature first R of F` numbers, never the `first card right` numbers), for example `On N new test sentences (written by AI, labels confirmed by Ian, never tuned on), the right feature came first for R0 of F0 that fit and have a matching feature before the parser change and R1 of F1 after; no feature was shown for N0, now N1`. Copy numbers from EV and the re-run, not from memory. If a count that another `pagetest.js` assertion pins moved (for example the `/right for 15./` regex near line 97, real prompts), update that assertion to the re-run's number too, and list it under `PINS-MOVED:` in EV; change no other assertion. Run `node tests/pagetest.js`; the `How it rates text present` check must fail now; append `task 10 red 1` to `L/red-green.log`. Chrome is required; there is no fallback.
4. Edit `web/template.html` so its How it rates text equals `HOW`. Update `README.md` (the sections that state the moved numbers, the gate-set before and after, the `AGREEMENT:` line, and one sentence saying what the parser change was). Update `tests/README.md` only if a number it states moved.
5. Rebuild: `node tests/build.js`; `tr -cd '\r' < dist/fit-finder.html | wc -c` must be `0` (LF; if `tests/build.js` does not already normalise, add `.replace(/\r\n/g, '\n')` to its `html` constant). Put the byte count of the built `dist/fit-finder.html` (`wc -c`) into README line 15 and every nearby prose count.
6. Before the commit run the Suite commands and `node tests/pagetest.js` (98 checks, 0 failed).
7. Commit `task 10: README, How it rates and LF build for the engine tune`, then measure `git show HEAD:fit-finder/dist/fit-finder.html | wc -c`; if it differs from the README's number, fix the README and make a second commit `task 10: README dist byte count` (no amend).
8. AFTER the last commit run `node tests/fair-guard.js --base ae60341 --lock-base HEAD --allow engine` from FF (fair-guard rejects uncommitted test changes, so it cannot run before the commit); it must print `fair-guard PASS`.

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-gate/fit-finder" && E=../docs/evidence/2026-10-22-fit-finder-gate.md && T9=$(git rev-list -1 --grep='^task 9:' HEAD) && test -n "$T9" && grep -q '^PINS-MOVED:' $E && test "$(git status --short -- . | wc -l | tr -d ' ')" = 0 && node tests/catalogue.test.js > /dev/null && node tests/synth-score.test.js > /dev/null && node tests/match-frozen.test.js > /dev/null && if grep -q '^OUTCOME: kept' $E; then grep -qx 'task 10 red 1' ../.ledger/2026-10-22-fit-finder-gate/red-green.log && test "$(git show HEAD:fit-finder/dist/fit-finder.html | tr -cd '\r' | wc -c | tr -d ' ')" = 0 && test "$(git show HEAD:fit-finder/dist/fit-finder.html | wc -c | tr -d ' ')" = "$(grep -o 'dist/fit-finder.html ([0-9]* bytes' README.md | head -n 1 | grep -o '[0-9]*')" && test "$(git diff --name-only $T9 HEAD -- tests data tools engine | grep -v -x -e 'fit-finder/tests/pagetest.js' -e 'fit-finder/tests/README.md' | wc -l | tr -d ' ')" = 0 && node tests/pagetest.js | tail -n 2 && node tests/fair-guard.js --base ae60341 --lock-base HEAD --allow engine; else node tests/fair-guard.js --base ae60341 --lock-base HEAD; fi`
Expect: fair-guard PASS

---

## Expected breaks
