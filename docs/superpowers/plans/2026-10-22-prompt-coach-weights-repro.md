# Prompt Coach Reproducible Weights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: cd prompt-coach && node tests/c5_gate.js, plus node tests/done_when.js --only C2,C4, plus node tests/repro_weights.js once it exists (Task 2)
Data: (none)

**Goal:** A retrain with the README commands rebuilds `engine/weights.json` byte for byte, in any shell, and the 7 weight-tied rewrite tests no longer depend on which weights the retrain lands on.

**Architecture:** `train.js` sorts its data-file arguments into one fixed order (fr, grc, sus, hard, then others alphabetically). A new `tests/repro_weights.js` retrains into a temp file and byte-compares. The weights are retrained once on this branch (new baseline). Seven tests in `tests/rewrite_unit.test.js` pin the grader's letters through the file's own `forced()` helper (only for the test's own prompt, with the real detector as fallback for the rewrite's internal draft checks); a 24-order sweep and one mutant per pinned test prove the pins are neither fragile nor vacuous.

**Tech Stack:** Node v26.5.0 (node:test, tap reporter), Git Bash on Windows. AI-free, $0, no installs.

**Spec:** `docs/superpowers/specs/2026-10-22-prompt-coach-weights-repro-design.md` (Design 1-4, Done-when D1-D9). Run prompt: `docs/PROMPT_COACH_WEIGHTS_REPRO_RUN_PROMPT.txt`. Probes: `prompt-coach/docs/research/weights-repro/` (README.md, orders.sh, f13.sh, orders.txt). Lead decisions: `.ledger/2026-10-22-prompt-coach-weights-repro/rulings.md`.

## Global Constraints

- Paths. `PC` = `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach` (bash `/c/Users/teasp/...`). `JT` = `C:/Users/teasp/.claude/jobs/7ce6ba3a/tmp` (bash `/c/Users/teasp/.claude/jobs/7ce6ba3a/tmp`). All scratch copies, scripts and logs live under `JT`. GNU tar needs `/c/...` paths.
- Working directory. Every shell block and every `JT` script begins with an absolute `cd` (to `PC` unless a step says otherwise), starts with `set -euo pipefail`, and uses absolute paths for anything under `JT`. Never rely on the shell being where the last step left it. Every check line below is written `cd "<PC literal>" && ...`.
- Commit and push blocks. Each commit or push block begins with a lone `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro"` line (the worktree root), run as its own call before the git commands; the git commands are then plain git with nothing around them. Never rely on the shell's current directory.
- Leak guard. `data/done_when_strong.jsonl` is never opened, copied, grepped or scored. Do not run `tests/done_when.js --only C1` or `tests/validate_done_when_sets.js` outside a copy made by `docs/research/c1-probes/mkcopy.sh`. Every `git archive` copy excludes it, and the script exits non-zero at once on a leak: `test ! -e "$DEST/data/done_when_strong.jsonl" || { echo LEAK; exit 1; }`.
- Locked (never edit): all data files, the C1-C5 bars, the 3% sure cap, the training-only check in `train.js` (the `tune-sure reads data/train_*.jsonl only` assert line), `tests/c5_gate.js` and its exact `GRADE acc=0.856` rule, `tests/fixtures/c5_base.json`. A simulate count above c5_base is a stop for Ian, not a re-baseline.
- Out of scope: C1 cues and C1 bars, #31/#35/#36, `template.html:402`, `engine/rules.js:100`.
- `engine/weights.json` and `dist/prompt-coach.html` are build outputs (a retrain and `node tests/build.js`), not data files. `Data: (none)`: no rehearse blocks.
- Scratch copies exclude `dist`, so run `node tests/build.js` in a copy before any step that runs `c5_gate.js` or `pagetest.js` there.
- Git Bash guard: in this worktree plain git commands only (no loops or variables around git); multi-step shell goes in a script file under `JT`. `.ledger/` is git-ignored: never delete, clean or remove this worktree.
- Commit messages end with: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_015vpC7MHZd3bYqQ8kk8aGo8`. Commit only at the commit step of an approved task. No push except Task 10.
- Stops (report to the run lead, do not work around): D2 differs from the talk probe; a pinned test survives its mutant; a pinned test fails in any of the 24 orders; the merge; run token cap 2M.
- Helper limits: `helperToolCallCap` 30 per helper; each helper replies in at most 10 lines; long output goes to files under `JT`, piped through `tail`/`grep` into context.
- TAP numbers #1, #9, #11, #13, #14, #76, #77 are the 1-based order of `test(` calls in `tests/rewrite_unit.test.js` (77 total): #1 `splitting: a semicolon inside parentheses...`, #9 `direct voice: no filler in Better or Strong...`, #11 `typos: common misspellings...`, #13 `context: only Context missing means no blank...`, #14 `context: Ian case gets the approved Strong and Better text...`, #76 `better stage: a prompt graded strong is returned untouched in Better`, #77 `better stage: a strong prompt that is not sure still has Better equal to Strong`.
- Lead decisions (rulings.md): (a) #76 pins all five on with `allProb(0)` (below sure) so `noChanges` (rewrite.js:636) cannot overwrite Better and hide rewrite.js:593; (b) D4 bar is "the 7 pinned tests pass in 24 of 24 orders, and the full file is 77/0 on the branch"; #31/#35/#36 failing in order `hard,sus,fr,grc` (orders.txt:17) is expected and reported, not a stop.

## Expected breaks

None. No existing test is expected to break. (Task 1's new `tests/train_order.test.js` is red before `train.js` changes by design; it is new, not a break.) Any other red result is a stop, not an expected break.

## Run summary

No groups (no task pair shares a one-shot setup that fits the talk-and-run group rule). No tune tasks (no number is tuned; D2 is a stop-to-understand check). Paid calls: none ($0); helpers are Claude Code sub-agents inside the 2M run cap. Token estimates are per task helper total (builder + checker), sized by task, not measured.

| Task | Title | Est. helper tokens |
|---|---|---|
| 1 | Fixed file order in train.js (test first) | 40k |
| 2 | tests/repro_weights.js and the D1c control | 45k |
| 3 | New baseline: retrain, rebuild, README figures, D1/D1o/D2/D3/D5/D6/D7/D9 | 70k |
| 4 | Pin letters in the 7 tests | 70k |
| 5 | D4 24-order sweep and D4c cue copy | 90k |
| 6 | D4m one mutant per pinned test | 80k |
| 7 | D8 r1 report (seen set) | 35k |
| 8 | Evidence doc | 40k |
| 9 | Final review (Opus + Codex) and fix round | 120k |
| 10 | Merge stop [IAN: merge] | 55k |
| | **Run total** | **645k** (cap 2M) |

---

### Task 1: Fixed file order in train.js (test first)

Depends: none

**Files:**
- Create: `prompt-coach/tests/train_order.test.js`
- Modify: `prompt-coach/tests/train.js:16-17` (insert one line between the `const out = ...` line and the `if (tuneSure) for ...` line)

**Interfaces:**
- Produces: `train.js` accepts its data files in any order and reads them as train_fr, train_grc, train_sus, train_hard, then any other name alphabetically. The inserted line carries the marker comment `/*FIXED_ORDER*/` (Task 5 deletes that line with `sed -i '/FIXED_ORDER/d'` to build the "Design 1 taken out" copies).

- [ ] **Step 1: Write the failing test.** Create `tests/train_order.test.js`:

```js
/* node --test --test-reporter=tap tests/train_order.test.js : train.js gives the same bytes for any order of its data-file arguments. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const TRAIN = path.join(__dirname, 'train.js');
const WORDS = ['summarize', 'audit', 'report', 'for the committee', 'use only the attached file', 'five bullets', 'flag anything', 'revenue', 'controls', 'draft', 'table', 'tone', 'last year', 'policy memo', 'check'];
function rows(seed, n) {
  let s = seed; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  return Array.from({ length: n }, (_, i) => {
    const o = { prompt: Array.from({ length: 6 }, () => WORDS[(r() * WORDS.length) | 0]).join('. ') + '. ' + seed + '-' + i };
    for (const k of 'SCOPE'.split('')) o[k] = r() < 0.5 ? 1 : 0;
    return o;
  });
}
function fixture(names) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'train-order-'));
  names.forEach((n, i) => fs.writeFileSync(path.join(d, n + '.jsonl'), rows(i + 1, 30).map((x) => JSON.stringify(x)).join('\n') + '\n'));
  return d;
}
function trainBytes(dir, order, tag) {
  const out = path.join(dir, 'out-' + tag + '.json');
  cp.execFileSync(process.execPath, [TRAIN, 'rulefeat', '--tune', '--out', out, ...order.map((n) => path.join(dir, n + '.jsonl'))], { stdio: 'pipe' });
  return fs.readFileSync(out);
}
test('train.js: two data files in either order give identical weights bytes', () => {
  const d = fixture(['train_fr', 'train_grc']);
  assert.deepEqual(trainBytes(d, ['train_fr', 'train_grc'], 'a'), trainBytes(d, ['train_grc', 'train_fr'], 'b'));
});
test('train.js: four named files plus an extra, scrambled, give identical weights bytes', () => {
  const d = fixture(['train_fr', 'train_grc', 'train_sus', 'train_hard', 'train_zz']);
  assert.deepEqual(trainBytes(d, ['train_fr', 'train_grc', 'train_sus', 'train_hard', 'train_zz'], 'a'), trainBytes(d, ['train_zz', 'train_hard', 'train_sus', 'train_grc', 'train_fr'], 'b'));
});
```

- [ ] **Step 2: Run it red.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node --test --test-reporter=tap tests/train_order.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 0` and `# fail 2`. If it passes, the fixture is too small to move the weights: make rows bigger (n 60) until it fails; do not go on with a green test.

- [ ] **Step 3: Implement.** In `tests/train.js`, after the `const out = ...` line (line 16) and before the training-only `assert` line, insert this single line (the assert line itself is unchanged):

```js
{ const RK = ['train_fr', 'train_grc', 'train_sus', 'train_hard'], nm = (f) => path.basename(f).replace(/\.jsonl$/, ''), rk = (f) => { const i = RK.indexOf(nm(f)); return i < 0 ? RK.length : i; }; args.sort((a, b) => rk(a) - rk(b) || (nm(a) < nm(b) ? -1 : nm(a) > nm(b) ? 1 : 0)); } /*FIXED_ORDER*/
```

- [ ] **Step 4: Run it green.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node --test --test-reporter=tap tests/train_order.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 2` and `# fail 0`.

- [ ] **Step 5: Prove the training-only assert is byte-identical to the starting commit (c4175c8), by content.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && git diff -U0 c4175c8 -- tests/train.js | grep -E "^[-+]" | grep -vE "^(\+\+\+|---)" | grep -c "FIXED_ORDER"; git diff -U0 c4175c8 -- tests/train.js | grep -E "^[-+]" | grep -vE "^(\+\+\+|---)" | wc -l`
Expected: `1` and `1` (the only changed line in the file is the inserted FIXED_ORDER line; the `tune-sure reads data/train_` line is therefore neither removed nor edited).

- [ ] **Step 6: Commit** the test, `train.js`, and the plan file (the plan is untracked until now; committing it here keeps later `git status` checks clean). Run the `cd` line as its own call first, then the git commands:
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro"
```
```bash
git add prompt-coach/tests/train.js prompt-coach/tests/train_order.test.js docs/superpowers/plans/2026-10-22-prompt-coach-weights-repro.md
git commit -m "Prompt coach weights repro: train.js reads data files in one fixed order (test first), plan"
```
(add the two attribution lines). Do not commit `engine/weights.json`.

---

### Task 2: tests/repro_weights.js and the D1c control

Depends: 1

**Files:**
- Create: `prompt-coach/tests/repro_weights.js`
- Modify: `prompt-coach/README.md` (test block, near line 12-19: add the line `node tests/repro_weights.js                  # retrain into a temp file with the two README commands, byte-compare engine/weights.json -> REPRO OK <sha256-prefix>`)

**Interfaces:**
- Produces: `node tests/repro_weights.js` (run from `prompt-coach/`): exit 0 and stdout `REPRO OK <first 12 hex of sha256>`, or exit 1 with `REPRO FAIL first difference: <where>`. Never writes `engine/weights.json`. Used by Tasks 3, 5, 9, 10 and the Suite line.

- [ ] **Step 1: Write the script.** `repro_weights.js`: (a) `tmp = fs.mkdtempSync(os.tmpdir()/repro-)`; `out = tmp/weights.json`; (b) files = `fs.readdirSync(<prompt-coach>/data).filter(f => /^train_.*\.jsonl$/.test(f)).map(f => 'data/' + f)` in plain readdir order (this stands in for the shell glob, which is the point: order must not matter); (c) `execFileSync(node, ['tests/train.js','rulefeat','--tune','--out',out,...files])` then the same with `--tune-sure` (same flags as README; `cwd: path.join(__dirname,'..')`); (d) read both files; if `Buffer.equals` print `REPRO OK ` + sha256 hex slice(0,12), exit 0; (e) else parse both and find the first difference in this order: `thr[k]`, `sure[k]`, `w[k].b`, then the first index in `w[k].v` that differs (letters S,C,O,P,E); print `REPRO FAIL first difference: <letter> <field/index> committed=<a> retrained=<b>` (or `byte order/format only` if the parsed values are equal), exit 1; (f) remove the temp dir in a `finally`. It must not open any path under `engine/` for writing.

- [ ] **Step 2: Add the README test-block line** (text above), keeping the block's column alignment.

- [ ] **Step 3: D1c control, on the branch before the baseline commit (engine/weights.json is still the old shipped file).**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node tests/repro_weights.js | tail -n 3; echo "exit=${PIPESTATUS[0]}"`
Expected: a `REPRO FAIL first difference: ...` line and `exit=1`. Exit 0 here means the check cannot fail: stop and report to the run lead (D1c disproved).

- [ ] **Step 4: Prove it never writes the weights.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && git status --short engine/weights.json | wc -l`
Expected: `0`.

- [ ] **Step 5: Record D1c** (the exact FAIL line and `exit=1`) as a row in `.ledger/2026-10-22-prompt-coach-weights-repro/progress.md`; it goes into the evidence doc in Task 8.

- [ ] **Step 6: Commit.** The `cd` line first, as its own call:
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro"
```
```bash
git add prompt-coach/tests/repro_weights.js prompt-coach/README.md
git commit -m "Prompt coach weights repro: repro_weights.js (control fails on the old shipped file)"
```
(add attribution lines).

---

### Task 3: New baseline (retrain, rebuild, README figures)

Depends: 2

**Files:**
- Modify: `prompt-coach/engine/weights.json` (build output of the retrain), `prompt-coach/dist/prompt-coach.html` (build output of `node tests/build.js`; only if tracked: check `git ls-files prompt-coach/dist`)
- Modify: `prompt-coach/README.md` (line 9 build bytes; Model row line 29: weights size "(4 KB)", threshold wording, and the sure line `(S 0.99, C 0.7, O 0.3, P 0.3, E 0.45)` -> `C 0.715`; any other figure the retrain changes, found by grepping the README for the old numbers)
- Scratch: `JT/d1o.sh`, `JT/d1o/`

**Interfaces:**
- Consumes: Task 1 (`train.js` fixed order), Task 2 (`repro_weights.js`).
- Produces: the committed baseline that Tasks 4-10 test against. Record its commit SHA in progress.md (Task 6 Step 5 may need it).

- [ ] **Step 1: Retrain with the README commands** (from `prompt-coach/`, the glob expands to fr, grc, hard, sus; Design 1 fixes the order):
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach"
node tests/train.js rulefeat --tune data/train_*.jsonl
node tests/train.js rulefeat --tune-sure data/train_*.jsonl
```

- [ ] **Step 2: D2 check (a stop if different).**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node -e "const w=require('./engine/weights.json');console.log(JSON.stringify([w.thr,w.sure]))"`
Expected: `[{"S":0.5,"C":0.575,"O":0.3,"P":0.3,"E":0.45},{"S":0.99,"C":0.715,"O":0.3,"P":0.3,"E":0.45}]`. Any other number: STOP, restore with `git checkout -- engine/weights.json` (run from `prompt-coach/`), report to the run lead; do not tune around it.

- [ ] **Step 3: Rebuild and measure the README figures.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node tests/build.js | tail -n 3 && wc -c dist/prompt-coach.html engine/weights.json`
Update README line 9 (bytes), the Model row (weights KB rounded as in the row's style; sure line C 0.715; thresholds if the row names them). Record old and new figure for each edit in progress.md.

- [ ] **Step 4: Checks D1, D1o, D3, D5.** Write `JT/d1o.sh` (`set -euo pipefail`; `cd` to `PC`; `mkdir -p JT/d1o`): retrain with the 4 files passed in reverse into `JT/d1o/weights.json` (`node tests/train.js rulefeat --tune --out /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/d1o/weights.json data/train_sus.jsonl data/train_hard.jsonl data/train_grc.jsonl data/train_fr.jsonl`, then the same with `--tune-sure`) and `cmp` it with `engine/weights.json`.
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node tests/repro_weights.js | tail -n 1 && bash /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/d1o.sh && echo D1O_SAME`
Expected: `REPRO OK <12 hex>` (D1) and `D1O_SAME` (D1o: no cmp output).
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"; node tests/eval.js rulefeat data/test.jsonl | grep -o "GRADE acc=[0-9.]*"`
Expected: `# pass 77`, `# fail 0` (D3, before any pinning) and `GRADE acc=0.856` (D5). Any `not ok` in D3 is a stop to understand.

- [ ] **Step 5: Checks D6, D7, D9** (build.js ran in Step 3, so dist exists).
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node tests/c5_gate.js | tail -n 4; node tests/done_when.js --only C2,C4 | tail -n 12; node tests/pagetest.js | tail -n 4`
Expected: c5_gate `PASS`; C2 test <= 2.0% and sim <= 1.8%, C4 0 blanks (stops: C2 above 5%, C4 above 0, a simulate count above c5_base.json); pagetest passes. If any output names `done_when_strong`, stop.

- [ ] **Step 6: Commit weights, dist (if tracked) and README figures together.** The `cd` line first, as its own call:
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro"
```
```bash
git add prompt-coach/engine/weights.json prompt-coach/README.md
git add prompt-coach/dist
git commit -m "Prompt coach weights repro: new baseline weights (fixed order), README figures"
```
(add attribution lines; skip the `dist` add if `git ls-files prompt-coach/dist` is empty).

- [ ] **Step 7: Re-run D1 after the commit; the tree must be clean.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node tests/repro_weights.js | tail -n 1 && git status --short -- . | wc -l`
Expected: `REPRO OK <12 hex>` and `0`. Put every D1/D1o/D2/D3/D5/D6/D7/D9 number and the commit SHA in progress.md.

---

### Task 4: Pin letters in the 7 tests

Depends: 3

**Files:**
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (move three helper definitions to the top; edit the bodies of tests #1, #9, #11, #13, #14, #76, #77 only where they choose their detector)
- Scratch: `JT/pinprobe.js`, `JT/pin/`

**Interfaces:**
- Consumes: baseline weights (Task 3), existing `forced(on, prob)`, `detectP`, `allProb`.
- Produces: `pinned(text, on, prob)` = `(p) => (p.trim() === text.trim() ? forced(on, prob)(p) : detectP(p))`, i.e. the letters are pinned for the test's own prompt only; the rewrite's internal draft checks (rewrite.js:554, 565, 574, 593 call `detect` on assembled drafts) keep the real detector. Titles unchanged; no assertion about a rewrite changed. Tasks 5 and 6 rely on this file's exact state.

- [ ] **Step 1: Probe the letters each test's premise needs.** Write `JT/pinprobe.js` (reads, prints, writes nothing; loads `PC/engine/*.js` and the fixtures by absolute path): for `IAN` (from `tests/fixtures/rewrites/ian_case.txt`) and the `user-control assessment` row of `data/test.jsonl` print `M.predict(...).on` and `.prob` with the baseline weights, and the same for the two `STRONG_EDITED` texts. Keep output in `JT/pinprobe.txt` and the letters in progress.md. Pinned values: IAN tests (#1, #9, #11, #14) = exactly the five letters `detect(IAN).on` returns on this baseline; #13 = all five on except C (`{S:true,C:false,O:true,P:true,E:true}`, the row's gold is S1 C1 O1 P1 E1); #76 = all five on with `allProb(0)`; #77 = all five on, no probabilities.

- [ ] **Step 2: Move the helpers to the top.** Move the definitions of `detectP` (line 518), `forced` (line 624) and `allProb` (line 625) to just after the `detect` line (line 8), unchanged, and add after them:
```js
const runWith = (prompt, files, det) => W.coach(prompt, { files, detect: det, ...C.pick(prompt, CLS) });
const pinned = (text, on, prob) => (p) => (p.trim() === text.trim() ? forced(on, prob)(p) : detectP(p));
const ALL_ON = { S: true, C: true, O: true, P: true, E: true };
```
Delete the old definitions. Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"` -> `# pass 77`, `# fail 0` (a pure move changes nothing).

- [ ] **Step 3: Measure the IAN pin in a scratch copy first** (Opus finding: forcing the letters on every detector call, including the rewrite's own draft checks, may break #14's exact text). `JT/pin.sh` (`set -euo pipefail`): archive the working tree as of Step 2 into `JT/pin/` (`cd PC && tar --exclude=./data/done_when_strong.jsonl --exclude=./dist --exclude=./real-eval -cf - . | tar -xf - -C /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/pin`, leak guard), then in the copy apply two variants of the IAN edit from Step 4 and run `rewrite_unit.test.js` after each: (A) `forced(IAN_ON, {})` on every call; (B) `pinned(IAN, IAN_ON, {})`. Write both results to `JT/out/pin_ab.txt`.
Run: `grep -E "^(A|B) " /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/out/pin_ab.txt`
Expected: one line per variant with `ok`/`not ok` counts. Use B in the repo either way (it is the only variant that cannot change the rewrite's own checks); report A's result for #14 in progress.md. If B has any `not ok` among #1, #9, #11, #14, stop and report to the run lead.

- [ ] **Step 4: Pin the IAN tests (#1, #9, #11, #14).** Add `const IAN_ON = { S: .., C: .., O: .., P: .., E: .. }` (the five booleans from Step 1) beside `IAN`. Replace `run(IAN...)` by `runWith(IAN, [], pinned(IAN, IAN_ON, {}))` in #1, #9, #11 (inside its `assert.ok(!/seperat/.test(run(IAN).stages.strong.prompt))` line) and by `runWith(IAN, files, pinned(IAN, IAN_ON, {}))` in #9 and #14 (loops over `files`). #1 and #11 pass `files` as `[]` explicitly (their `run(IAN)` defaults to `[]`). The `fixTypos` assert lines of #11 are untouched.

- [ ] **Step 5: Pin #13.** Replace `const o = run(row.prompt);` by `const o = runWith(row.prompt, [], pinned(row.prompt, { S: true, C: false, O: true, P: true, E: true }, {}));` with a comment above: `// All five letters pinned (Context off): the test's premise is "only Context missing", whatever the weights detect.` Asserts untouched.

- [ ] **Step 6: Pin #76 and #77.** #76: replace `coachWith(text, detectP)` by `coachWith(text, pinned(text, ALL_ON, allProb(0)))` (all on, below sure, so `noChanges` at rewrite.js:636 stays false and the Better rule at rewrite.js:593 is what the test sees). #77: replace `coachWith(text, detect)` by `coachWith(text, (p) => ({ ...detect(p), on: ALL_ON }))` (all on, no probabilities, never sure). Asserts untouched.

- [ ] **Step 7: Check on the branch, and that nothing but detector choice changed.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E "^# (pass|fail)" && git diff -U0 -- tests/rewrite_unit.test.js | grep -E "^[-+].*assert" | wc -l`
Expected: `# pass 77`, `# fail 0` and `2` (exactly the one #11 line `assert.ok(!/seperat/.test(run(IAN)...` as a `-` and a `+`; any other assert line changed is a stop).

- [ ] **Step 8: Commit.** The `cd` line first, as its own call:
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro"
```
```bash
git add prompt-coach/tests/rewrite_unit.test.js
git commit -m "Prompt coach weights repro: pin grader letters in the 7 weight-tied rewrite tests"
```
(add attribution lines).

---

### Task 5: D4 24-order sweep and D4c cue copy

Depends: 4

**Files:**
- Create (scratch only, under `JT`, not committed): `JT/mk_base.sh`, `JT/d4_orders.sh`, `JT/d4c.sh`, `JT/out/d4.txt`, `JT/out/d4c.txt`. Repo files: none changed.

**Interfaces:**
- Consumes: the Task 4 commit (pinned test file) and the `/*FIXED_ORDER*/` marker from Task 1.
- Produces: D4 and D4c numbers for the evidence doc.

- [ ] **Step 1: Make the base scratch copy.** `JT/mk_base.sh` (`set -euo pipefail`; `D=/c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/base`; `rm -rf "$D"; mkdir -p "$D"`; `cd` to `PC`; `git archive HEAD . ':!data/done_when_strong.jsonl' ':!dist' ':!real-eval' | tar -x -C "$D"`; `test ! -e "$D/data/done_when_strong.jsonl" || { echo LEAK; exit 1; }`; `sed -i '/FIXED_ORDER/d' "$D/tests/train.js"`).
Run: `bash /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/mk_base.sh && grep -c FIXED_ORDER /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/base/tests/train.js`
Expected: no `LEAK`, script exit 0, then `0`.

- [ ] **Step 2: Write `JT/d4_orders.sh`**, adapted from `docs/research/weights-repro/orders.sh` with `T=/c/Users/teasp/.claude/jobs/7ce6ba3a/tmp`, `set -euo pipefail`, and the source copy `$T/base` instead of `$T/c/cuefree`. Keep orders.sh's exact row format, written to `$T/out/d4.txt` (cleared first): `echo "$p | thr $thr | sure $sure | ru $(grep -c '^ok ' ru.tap)/$(grep -c '^not ok ' ru.tap) $(grep '^not ok ' ru.tap | cut -d' ' -f3 | tr '\n' ',') | $ev"` where `$p` is the order as `fr,grc,hard,sus` (comma-joined, 24 permutations), `$thr` and `$sure` are the JSON after `tuned thresholds` / `sure cut-offs`, the not-ok field is the TAP test numbers each followed by a comma, and `$ev` is `GRADE acc=0.8xx`. Per order: copy `base` to `$T/s/o-$p`, `cd` into it, `train.js rulefeat --tune <files in that order>` then `--tune-sure`, `node --test --test-reporter=tap tests/rewrite_unit.test.js > ru.tap`, `node tests/eval.js rulefeat data/test.jsonl`, delete the copy; last line `DONE`.

- [ ] **Step 3: Run it in the background and wait** (24 orders; run_in_background, no polling).
Run: `bash /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/d4_orders.sh`

- [ ] **Step 4: Check D4 and its controls** (rows only: lines starting with an order, not `DONE`).
Run: `cd /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/out && R=$(grep -E "^[a-z]+,[a-z]+,[a-z]+,[a-z]+ \|" d4.txt); echo "$R" | wc -l; echo "$R" | cut -d' ' -f1 | sort -u | wc -l; echo "$R" | cut -d'|' -f2 | sort -u | wc -l; echo "$R" | grep -cE "ru [0-9]+/[0-9]+ ([0-9]+,)*(1|9|11|13|14|76|77),"; echo "$R" | grep -c "| ru 77/0 "; tail -n 1 d4.txt`
Expected, in order: `24` rows; `24` distinct orders; a number well above `1` distinct thresholds (orders.txt: S .45-.7, C .3-.65; `1` means the marker removal failed and the sweep proves nothing); `0` rows where any of #1, #9, #11, #13, #14, #76, #77 is `not ok` (the D4 bar, ruling b); the count of fully-77/0 rows (report it; at least 24 minus the order `hard,sus,fr,grc`); `DONE`. Report which rows are not 77/0 and which tests failed (expected: #31, #35, #36 in `hard,sus,fr,grc` only, as in orders.txt:17; not a stop). A pinned test failing in any order is a stop: report the order and the test.

- [ ] **Step 5: D4c.** `JT/d4c.sh` (`set -euo pipefail`, absolute paths): unpack the Task 4 commit into `JT/c1/` the way Step 1 does (Design 1 left in; this copy is a normal retrain). From `PC` run `git show --format= 9515a81 aece903 -- engine data ':!data/done_when_strong.jsonl' ':!engine/weights.json'` redirected to `JT/cues.patch`; `patch -p1 -d JT/c1 --dry-run < JT/cues.patch` first (paths in the patch are relative to `prompt-coach/` when run from `PC`; if they come out with a `prompt-coach/` prefix use `-p2`), then for real. The `tests/` directory is not patched, so the pinned tests stay as committed. A hunk outside `engine`/`data` is a stop. In the copy: `cd` into it, retrain with the README commands (`--tune data/train_*.jsonl`, `--tune-sure data/train_*.jsonl`), run `rewrite_unit.test.js` (tap) and `eval.js`, write the result to `JT/out/d4c.txt`.
Run: `bash /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/d4c.sh; grep -E "^# (pass|fail)|^not ok|GRADE" /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/out/d4c.txt`
Expected: `# pass 77`, `# fail 0`, no `not ok` (#13 passes with the feeds-into cue); GRADE value reported only.

- [ ] **Step 6: Leak check and record.**
Run: `ls /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/base/data /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/c1/data | grep -c "^done_when_strong.jsonl$"`
Expected: `0`. Record the 24-row summary and the D4c numbers in progress.md. No commit (nothing in the repo changed).

---

### Task 6: D4m one mutant per pinned test

Depends: 5

**Files:**
- Create (scratch only): `JT/mutants.sh`, `JT/out/d4m.txt`, scratch copy `JT/mut/`. Repo files: none changed (unless Step 5 restores a test).

**Interfaces:**
- Consumes: Task 4 commit; the base copy recipe of Task 5 Step 1 (Design 1 left in; mutants run on the baseline weights).
- Produces: D4m: 7 of 7 pinned tests fail on their mutant.

- [ ] **Step 1: Locate the rewrite rule each pinned test names** (grep `engine/rewrite.js`, read only the matching function):

| Test | Rule to break in the scratch copy of `engine/rewrite.js` |
|---|---|
| #1 | the sentence splitter's rule that a `;` inside parentheses does not end a sentence (make it split there) |
| #9 | the filler-removal list or lead-in rule (stop removing `please`/`kindly`) |
| #11 | `fixTypos` (make it a no-op or drop the `seperat` fix) |
| #13 | the rule that leaves no `[blank]` when only Context is missing (make it emit a blank) |
| #14 | one word of the approved Strong text the Ian-case fixtures check (change the wording the rewrite generates) |
| #76 | the "graded strong returned untouched in Better" rule at rewrite.js:593 (make Better differ from the input) |
| #77 | the "strong but not sure: Better equals Strong" rule (make Better differ from Strong) |

- [ ] **Step 2: Write `JT/mutants.sh`** (`set -euo pipefail`, absolute paths, explicit `cd`). For each of the 7 tests n: fresh unpack of the Task 4 commit into `JT/mut/` (`cd PC && git archive HEAD . ':!data/done_when_strong.jsonl' ':!dist' ':!real-eval' | tar -x -C /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/mut`, leak guard that exits 1), apply that test's one-line mutation with `sed -i` on `JT/mut/engine/rewrite.js`, confirm with `diff` against `PC/engine/rewrite.js` that exactly one hunk changed, `cd` into `JT/mut` and run `node --test --test-reporter=tap tests/rewrite_unit.test.js > mut.tap`. Append one row per mutant to `JT/out/d4m.txt`: `#<n> | mutant: <what> | failing: <TAP numbers of every "not ok" line> | NOT-OK-AS-EXPECTED` if `grep -q "^not ok <n> " mut.tap`, else `... | SURVIVED`.

- [ ] **Step 3: Run it.**
Run: `bash /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/mutants.sh; tail -n 9 /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/out/d4m.txt`
Expected: seven rows.

- [ ] **Step 4: Check the exact ID set** (not just a count).
Run: `grep "NOT-OK-AS-EXPECTED$" /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/out/d4m.txt | cut -d' ' -f1 | sort -V | tr '\n' ' '`
Expected: `#1 #9 #11 #13 #14 #76 #77 ` exactly (no duplicates, none missing).

- [ ] **Step 5: If any row says `SURVIVED`: STOP.** Restore that test to its pre-Task-4 form (`cd PC && git show <Task 3 commit SHA from progress.md>:prompt-coach/tests/rewrite_unit.test.js` for that test body only; edit by hand; commit with the worktree-root `cd` line first, message `Prompt coach weights repro: restore #<n> (pin survived its mutant)`), then report to the run lead for Ian. Do not loosen further and do not pick a different mutant to make it fail; one honest re-pick is allowed only if the first mutant did not actually break the rule (show the diff).

- [ ] **Step 6: Record D4m (one row: the 7 results and the mutation diffs)** in progress.md. No commit unless Step 5 happened.

---

### Task 7: D8 r1 report (seen set)

Depends: 4

**Files:**
- Create (scratch only): `JT/r1/` (via `mkcopy.sh`), `JT/out/d8.txt`. Repo files: none changed.

**Interfaces:**
- Consumes: baseline weights and pinned tests as committed.
- Produces: the D8 number (report, no bar).

- [ ] **Step 1: Make the r1 copy with the guarded helper only.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && bash docs/research/c1-probes/mkcopy.sh "$PWD" /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/r1 r1; echo "exit=$?"`
Expected: `exit=0` (exit 9 + `FRESH SET LEAKED` is a stop). `mkcopy.sh` excludes `dist` and `data/done_when_strong.jsonl` and renames the r1 file into the fresh slot in the copy only.

- [ ] **Step 2: Run C1 in the copy only.**
Run: `cd /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/r1 && node tests/done_when.js --only C1 | tail -n 12`
Expected: a C1 line with a count out of 30 (the talk's control is 14, read not measured; about 14 expected). No bar: report the number; say r1 is a seen set. Output from the repo's own `prompt-coach/` folder instead of the copy is a rule breach: stop and report.

- [ ] **Step 3: Save the output** (the builder pipes the Step 2 command into `JT/out/d8.txt`; this plan role cannot redirect) and write the number, "r1 is a seen set, report only", and the control 14 in progress.md.

---

### Task 8: Evidence doc

Depends: 6, 7

**Files:**
- Create: `docs/evidence/2026-10-22-prompt-coach-weights-repro.md`

- [ ] **Step 1: Write the doc** with a table of every D row, one row each: D1, D1c, D1o, D2, D3, D4, D4m (one row listing the 7 results), D4c, D5, D6, D7, D8, D9. Each row: the check, the prediction (from the spec and rulings), the number measured (from progress.md, with the command and date) and `measured` or `read`. State separately what was only read: the C1 run's state A/B/C numbers (talk claims, from branch prompt-coach-c1-cues), the control 14 of 30, the research snippets (scikit-learn, DVC). Name the proxies (job tmp copies stand in for the repo).
- [ ] **Step 2: Add "What changed"**: train.js fixed order (1 line), repro_weights.js, baseline thresholds and sure line (old vs new numbers), README figures changed (old -> new), 7 pinned tests (and #76 below sure, with the reason), D4 bar as ruled (7 pinned in 24 of 24; full file 77/0 on the branch; which rows were not 77/0, #31/#35/#36 expected), and that #31/#35/#36 stay as they are (not in Ian's ruling).
- [ ] **Step 3: Add "Next"**: the next talk is C1 reshape (c) on the new baseline, because the C1 run's state A/B/C numbers were measured on weights nobody could rebuild.
- [ ] **Step 4: Check the doc against the log.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro" && grep -cE "^\| D(1|1c|1o|2|3|4|4m|4c|5|6|7|8|9) " docs/evidence/2026-10-22-prompt-coach-weights-repro.md`
Expected: `13`.
- [ ] **Step 5: Commit.** The `cd` line first, as its own call:
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro"
```
```bash
git add docs/evidence/2026-10-22-prompt-coach-weights-repro.md
git commit -m "Prompt coach weights repro: evidence (measured vs read, every D row)"
```
(add attribution lines).

---

### Task 9: Final review (Opus + Codex) and fix round

Depends: 8

**Files:**
- Modify: only what a confirmed finding names (inside the files listed in Tasks 1-8; never a locked file).

- [ ] **Step 1: Opus final-reviewer and Codex review the diff** `git diff c4175c8...HEAD` (run lead dispatches; each reviewer limited to 30 tool calls, reply at most 10 lines). Brief: spec D1-D9 vs evidence doc rows, locked files untouched, README figures match the committed files, no assert changed in the 7 tests beyond the one #11 line, #76 pin is below sure.
- [ ] **Step 2: Check the locked-files claim by content.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro" && git diff --stat c4175c8 HEAD | grep -cE "prompt-coach/data/|c5_gate|c5_base"; git diff -U0 c4175c8 HEAD -- prompt-coach/tests/train.js | grep -E "^[-+]" | grep -cE "tune-sure reads"`
Expected: `0` and `0`.
- [ ] **Step 3: Triage findings** to confirmed / not confirmed by running the thing each names; fix confirmed ones in one round (each fix with a re-run of the check it touches: Task 3 Step 4/5 commands for weights and README, Task 4 Step 7 for tests).
- [ ] **Step 4: Re-run the Suite once on the final tree.**
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro/prompt-coach" && node tests/build.js | tail -n 1; node tests/c5_gate.js | tail -n 2; node tests/done_when.js --only C2,C4 | tail -n 6; node tests/repro_weights.js | tail -n 1; node --test --test-reporter=tap tests/train_order.test.js | grep -E "^# (pass|fail)"`
Expected: c5_gate `PASS`; C2/C4 within D7; `REPRO OK <12 hex>`; `# pass 2`, `# fail 0`.
- [ ] **Step 5: Commit fixes (if any)** as `Prompt coach weights repro: review fixes` (worktree-root `cd` line first, as its own call; add attribution lines); update the evidence doc in the same commit if a figure changed.

---

### Task 10: Merge stop [IAN: merge]

Depends: 9

**Files:**
- Create (scratch only): `JT/mk_merge.sh`, `JT/base_s/`, `JT/merged_s/`, `JT/out/suite_base.txt`, `JT/out/suite_merged.txt`. Repo files: none.

**Interfaces:**
- Consumes: the final tree of Task 9.
- Produces: a push of the branch and the backup branch, then a stop. The merge itself is not done by the plan; Ian's yes is needed.

- [ ] **Step 1: Dry run of the gate for the other checks.** `merge-gate.mjs` cannot run its suite here (memory: no npm test in this repo).
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro" && node C:/Users/teasp/Documents/studio-harness/bin/merge-gate.mjs --dry-run | tail -n 20` (use the flags its `--help` prints for branch, target `prompt-coach`, and the slip). Expected: every check except the suite passes; the suite refusal is expected. Record the output tail.
- [ ] **Step 2: Scratch copies.** `JT/mk_merge.sh` (`set -euo pipefail`; `cd` to the worktree root; absolute extraction dirs `JT/base_s` and `JT/merged_s`, each emptied first). Base: `git archive prompt-coach:prompt-coach . ':!data/done_when_strong.jsonl' ':!dist' ':!real-eval' | tar -x -C "$BASE"`. Merge result: `TREE=$(git merge-tree --write-tree prompt-coach HEAD)` (a conflict makes it exit non-zero: stop and report the files; Ian's rule is to keep both sides, but that is his call at the stop), then `git archive "$TREE:prompt-coach" . ':!data/done_when_strong.jsonl' ':!dist' ':!real-eval' | tar -x -C "$MERGED"`. After each unpack: `test ! -e "$DIR/data/done_when_strong.jsonl" || { echo LEAK; exit 1; }`. (`<tree>:prompt-coach` roots the archive at the prompt-coach folder, so the exclusions are relative to it; the git commands are plain, with the variables only in the shell around them, not inside git arguments other than `$TREE`.)
Run: `bash /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/mk_merge.sh && ls /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/base_s /c/Users/teasp/.claude/jobs/7ce6ba3a/tmp/merged_s | grep -c "^engine$"`
Expected: no `LEAK`, exit 0, and `2`.
- [ ] **Step 3: Run the Suite in each copy** (dist was excluded, so build first). For each copy `<D>` in `base_s` then `merged_s`: `cd <D> && node tests/build.js | tail -n 1; node tests/c5_gate.js | tail -n 3; node tests/done_when.js --only C2,C4 | tail -n 8; node tests/repro_weights.js | tail -n 1; node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"` (on base_s `repro_weights.js` does not exist: write `n/a (does not exist on base)`). The builder pipes each copy's output into `JT/out/suite_base.txt` / `suite_merged.txt`. Expected: no failure on the merged copy that the base lacks. If a check fails on both because a held-out file is absent from the copy, say so plainly; do not copy the fresh set to fix it.
- [ ] **Step 4: Push the backup (the remote tip of the target), then the branch** (the run prompt names both; the approved plan satisfies the task-boundary hook). The `cd` line first, as its own call:
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-weights-repro"
```
```bash
git fetch origin prompt-coach
git push origin origin/prompt-coach:refs/heads/backup/prompt-coach-before-prompt-coach-weights-repro-2026-10-22
git push origin prompt-coach-weights-repro
```
Expected: fetch succeeds, both pushes succeed without `--force`. A refusal is a stop.
- [ ] **Step 5: STOP and report to Ian** through the run lead (decision card, recommendation first): the Suite on base and on the merge result side by side (c5_gate, C2/C4 numbers, rewrite_unit pass/fail, repro_weights), the two pushed refs, the D4 (7 pinned in 24 of 24) and D4m (7 of 7) results, and "next talk: C1 reshape (c) on the new baseline". Do not merge until Ian's yes: the merge is `[IAN: merge]`.
- [ ] **Step 6 (after Ian's yes only):** the run lead merges per the merge rule; this plan does not.

---

## Self-review (writer)

- Spec coverage: Design 1 (T1), Design 2 (T3), Design 3 (T2), Design 4 (T4); D1c (T2), D1/D1o/D2/D3/D5/D6/D7/D9 (T3), D4 + D4c (T5), D4m (T6), D8 (T7), evidence (T8), review (T9), merge stop (T10).
- Measured by the plan writer: only file contents and line numbers (test titles and TAP numbers counted from `tests/rewrite_unit.test.js`, 77 `test(` calls; rewrite.js:593/636 read). No suite was run. Read, not measured: D2 numbers, D4/D4m/D4c/D8 expectations.
- Placeholder scan: Task 4 Step 1 takes the IAN letters from a probe on the new baseline rather than quoting them (they depend on the retrain).
