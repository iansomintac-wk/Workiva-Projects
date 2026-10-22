# Prompt Coach: done when, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The offline coach says "No changes needed" for prompts that are surely strong, hands back Better/Strong prompts with no `[blanks]`, and lists follow-up questions below the improved prompt, with a harness (`tests/done_when.js`) that measures C1, C2 and C4 and a regression gate (`tests/c5_gate.js`) that measures C5.

**Architecture:** Rules only, no model or network call. A confidence rule on the existing per-letter model (cut-offs chosen out of fold on `train_*` only, weights otherwise frozen) drives "No changes needed". `engine/rewrite.js` swaps each placeholder for safe general wording (or drops it) and returns a per-letter questions list that the page shows outside the copied text.

**Tech Stack:** Node (CommonJS, no dependencies), single-file HTML page built by `tests/build.js`, `node --test` for unit tests.

**Spec:** `docs/superpowers/specs/2026-10-22-prompt-coach-done-when-design.md` (all paths below are relative to the worktree root; the coach lives in `prompt-coach/`).

Suite: cd prompt-coach && node tests/build.js && node tests/c5_gate.js && node tests/done_when.js && node tests/validate_done_when_sets.js | tail -1 | grep -x VALID
Data: (none)
Spend: $0

Data note: `Data: (none)` because no task edits or deletes existing data. Task 2 adds new files; Task 3 regenerates `tests/fixtures/rewrites/blank_baseline.json` and edits `tests/fixtures/rewrites/ian_strong.txt` (derived test fixtures, not source data); Tasks 5 and 9 write only the `sure` key of `engine/weights.json` (no retrain). No task runs `tests/train.js` without `--tune-sure`, and none runs `tests/train_cls.js`. The move of the first strong-30 set to `data/done_when_strong_r1.jsonl` and the fresh `data/done_when_strong.jsonl` are lead steps before launch, not tasks.

## Global Constraints

- Cost is $0. No paid call, no LLM, no network call, from the coach or from any script in this plan.
- Made-up data only. No real customer, company or personal data in prompts, fixtures or keys. Use "Example Co" style names.
- Never tune on `prompt-coach/data/test.jsonl`, `prompt-coach/data/sim_customers.jsonl` or `prompt-coach/data/done_when_strong.jsonl` (the fresh held-out set). Only `data/train_*.jsonl` may be used to choose a cut-off. Held-out sets are read only to measure; a held-out miss is reported, never tuned on, and a retrain is Ian's call. `data/done_when_strong_r1.jsonl` (the first, seen strong-30) is dev data: it may serve as regression fixtures, never as the basis for choosing a cut-off.
- Name test files, never folders: `node --test tests/rewrite_unit.test.js` (node 26 runs nothing for a folder).
- The README (`prompt-coach/README.md`) is updated in the same commit as whatever it describes, including any count, byte size or name nearby prose gets wrong (the README says the built page is 337042 bytes; fix it when `dist` is rebuilt).
- Tests first: every new test or check must fail before the code that satisfies it, and the worker must run it and see the failure before writing the code.
- Do not change the grade rule (weak if Source or Objective missing; strong if all five letters present and not stacked) or the SCOPE letters.
- Every existing assertion in `tests/customer_check.js`, `tests/rewrite_unit.test.js`, `tests/simulate.js` and `tests/eval.js` is locked, except the blank checks named in Task 3 (customer_check `blankOnlyC`, `blankMore`, `unsureTask` at line 71, `ianCase`; the rewrite_unit titles listed under Expected breaks). Do not loosen any other assertion. Baselines read from 902fbff (not re-measured by the plan writer; Task 1 Step 1 re-measures them): eval `GRADE acc=0.856`, simulate `strongNotStrong` 2, `betterWeak` 5 and `badText` 2 of 2,070 runs (measured 2026-10-22 at 30ae1ed), customer_check PASS 229, rewrite_unit 67/67.
- The coach stays AI-free (Ian, 2026-10-22). If a bar cannot be met by rules, stop and report the numbers; do not add a model.
- Tools: `jq` is not installed; use `node -e`. `tests/eval.js` and `tests/simulate.js` always exit 0, so a pass is read from their printed lines (`GRADE acc=...`, `strongNotStrong N`, `badText N`), which `tests/c5_gate.js` does.
- Sandbox use is out of this plan (see "After the driver"). Never open production Workiva (app.wdesk.com).
- Commit only inside a task, message "task N: <title>". Never push or merge.

---

### Task 1: Measurement harness done_when.js and C5 gate

**Files:**
- Create: `prompt-coach/tests/done_when.js`
- Create: `prompt-coach/tests/c5_gate.js`
- Create: `prompt-coach/tests/fixtures/c5_base.json` (the measured base failure counts the gate compares against)
- Modify: `prompt-coach/README.md` (test block: one line each, with a comment)

**Interfaces:**
- Produces: CLI `node tests/done_when.js [--only C1,C2,C4]`. Prints one result line per check, each ending `PASS` or `MISS`: `C1 ...`, `C2 set=test ...`, `C2 set=sim ...`, `C4 ...` (C1 may instead print `C1 SKIP data/done_when_strong.jsonl not present`). Exit codes: 0 all bars met, 1 at least one bar missed, 2 script error (any thrown exception, missing engine file, zero rows or zero runs read). Exports nothing.
- Produces: CLI `node tests/c5_gate.js`. Runs, in order, `node tests/eval.js rulefeat data/test.jsonl`, `node tests/simulate.js data/train_fr.jsonl data/train_grc.jsonl data/train_hard.jsonl data/train_sus.jsonl`, `node tests/customer_check.js`, `node --test --test-reporter=tap tests/rewrite_unit.test.js`, `node tests/pagetest.js`. Prints `GATE <name> PASS|FAIL <detail>` per command and exits 1 if any FAIL, else 0. Rules: eval output must contain `GRADE acc=0.856`; every category line of simulate (`strongNotStrong`, `betterWeak`, `toggleNoEffect`, `dupSentence`, `badText`, `emptyFrag`) must have a count at or below its value in `tests/fixtures/c5_base.json`; customer_check last line must start `PASS`; rewrite_unit must show `# fail 0`; pagetest must exit 0 (read its tail to confirm how it signals failure and record that in a comment at the top of the gate). Counts in the base file may only stay or drop.
- Consumes: `engine/rewrite.js` `coach(prompt, {files, detect, ...pick})`, `engine/model.js` `predict`, `engine/classify.js` `unpack`/`pick`, as in `tests/make_blank_baseline.js` (copy its detect/CLS/FILES setup; FILES is read out of `tests/customer_check.js` the same way).

"Shown no changes needed" today means `coach(...).grade === 'strong'` (the message does not exist yet). Define a helper `noChangesNeeded(o)` in `done_when.js`: today it returns `o.grade === 'strong'`; Task 5 changes it to read `o.noChanges`.

- [ ] **Step 1:** Measure the base first (on this commit, before any change): run the five gate commands by hand and write the six simulate category counts to `tests/fixtures/c5_base.json` with `node -e`. Assert in the commit message that `strongNotStrong` is 2, `betterWeak` is 5 and `badText` is 2, eval is `GRADE acc=0.856`, customer_check PASS 229, rewrite_unit 67 pass. If any differs, stop and report the real numbers.
- [ ] **Step 2:** Write `tests/c5_gate.js` per the interface above. Run it: it must exit 0 on the unchanged base (this proves the base file and the parsing are right).
- [ ] **Step 3:** Write `tests/done_when.js` C1: read `data/done_when_strong.jsonl` if it exists (else print the SKIP line and do not count it as a miss); count rows where `noChangesNeeded(o)` is true and the Strong and Better prompt text equals the original prompt trimmed; bar >= 27 of 30. Print `C1 <n> of <m> (bar 27 of 30) PASS|MISS`.
- [ ] **Step 4:** C2: for `data/test.jsonl` and `data/sim_customers.jsonl`, among rows where not all of S,C,O,P,E are 1 or `stacked` is 1 ("non-strong"), the share with `noChangesNeeded`; bar <= 5% each, one line per set with counts and percent.
- [ ] **Step 5:** C4: over test.jsonl + sim_customers.jsonl + the weak-12 prompts (read `research/live-tests/weak12/prompts.json` if present, else say `weak12 not present` in the line), run `coach` twice per prompt (no files; with the matching `FILES[domain]` when one exists). For EVERY run, strong or not, count `[...]` occurrences in both `stages.better.prompt` and `stages.strong.prompt` (each stage counted separately). Print `C4 blanks=<n> (better=<b>, strong=<s>) across <m> outputs, runs with a blank <p>% (bar 0) PASS|MISS`. Exit 2 if `m` is 0.
- [ ] **Step 6:** Add `--only` (a list such as `--only C2,C4` runs just those checks and skips the others silently). Wrap the main body so any thrown error prints `ERROR <message>` and exits 2, and only a bar miss exits 1.
- [ ] **Step 7:** Run it. It must exit 1 today. Record in the commit message the baseline lines (C2 near 6% and 15%, C4 blank runs near 92% and 97%).
- [ ] **Step 8:** Add both commands to the README test block (one line each, with a comment) in the same commit. Commit.

Check: `cd prompt-coach && node tests/c5_gate.js && out=$(node tests/done_when.js; echo "rc=$?") && echo "$out" | grep -q '^rc=1$' && echo "$out" | grep -qE '^C2 set=test .*MISS' && echo "$out" | grep -qE '^C2 set=sim .*MISS' && echo "$out" | grep -qE '^C4 .*MISS' && echo "$out" | grep -qE '^C1 ' && ! echo "$out" | grep -q '^ERROR' && echo BASELINE-MISSES-AS-EXPECTED`
Expect: BASELINE-MISSES-AS-EXPECTED
Depends: none
Timeout: 25m
Tokens: 130000

---

### Task 2: Test sets strong-30 and weak-12

**Prerequisite (the lead does this before launch, not the worker):** the 42 prompts are drafted by an Opus helper (the spec says top model; the build role is Sonnet) and committed as `prompt-coach/data/done_when_strong.jsonl` (final 30 rows; Task 2 does not write it, only validates it) and `prompt-coach/research/live-tests/weak12/drafts.json` (12 entries, each with `prompt`, `domain`, `fixture` {`file`, `type`, content spec with seeded issues}, `intended_output`, `requested_format`, `key` {`findings`, `must_not_invent`}). This task builds the fixture generator, `prompts.json`, `answer_key.json` and the validator from those committed files; it does not write or reword prompts.

**Files:**
- Validate only (do not edit): `prompt-coach/data/done_when_strong.jsonl` (30 rows, same keys as `data/test.jsonl`: prompt, S, C, O, P, E = 1, stacked 0, intent, domain, tags `["done-when-strong"]`; domain values FR, GRC, SUS or GEN)
- Create: `prompt-coach/research/live-tests/weak12/make_weak12_fixtures.js` (modelled on `research/live-tests/make_live_fixtures.js`; reads each draft's `fixture` spec; `VENDOR=<npm dir> node make_weak12_fixtures.js` writes `./fixtures`; invented data only)
- Create: `prompt-coach/research/live-tests/weak12/prompts.json` (12 entries from `drafts.json`: id `FR-W1..4`, `GRC-W1..4`, `SUS-W1..4`; prompt; domain; fixture file name; intended output; requested format)
- Create: `prompt-coach/research/live-tests/weak12/answer_key.json` (from each draft's `key`, in the shape of `research/live-tests/fixtures/answer_key.json`: job, found, hard, optional, mustNotClaim, absent per SCORING_RULES.md)
- Create: `prompt-coach/research/live-tests/weak12/fixtures/*` (12 made-up files, built by the script)
- Create: `prompt-coach/tests/validate_done_when_sets.js`

**Interfaces:**
- Consumes: the two committed draft files above; the existing generator `research/live-tests/make_live_fixtures.js`, which reads `VENDOR` (default `C:/Users/teasp/AppData/Local/Temp/prompt-coach-rewrites-4756fc2d/vendor`, the npm dir whose `node_modules` holds the file-writing libraries it requires).
- Produces: `prompts.json` as `[{id, domain, prompt, file, intended, format}]` (Task 1's C4 reads `.prompt` and `.domain`); `data/done_when_strong.jsonl` is read by Tasks 1, 5, 6.

- [ ] **Step 1:** Prerequisite check. Run `ls "$VENDOR/node_modules" | head` (VENDOR as above, or the value the lead names). If the folder or the libraries `make_live_fixtures.js` requires are missing, or `data/done_when_strong.jsonl` or `weak12/drafts.json` is missing, STOP and report `PREREQUISITE MISSING: <what>` as the task result. There is no fallback: do not skip the fixtures and do not draft prompts yourself.
- [ ] **Step 2:** Write `tests/validate_done_when_sets.js` first. It fails (exit 1) if: strong-30 does not have exactly 30 rows, or domains are not all of FR, GRC, SUS and GEN (at least 5 each, 30 total); any strong-30 row has a letter label not 1 or stacked not 0; weak-12 does not have 12 prompts, 4 each of FR/GRC/SUS; any weak-12 prompt does not grade `weak` in the coach (`coach(...).grade === 'weak'`); any weak-12 key entry is missing `found`, `mustNotClaim` or `job`; any fixture named in `prompts.json` is missing; any of the 42 prompts is an exact or near copy of a row in `data/train_*.jsonl` or `data/test.jsonl` (normalize: lowercase, strip punctuation and spaces; near copy = Jaccard over word 3-grams >= 0.6). Print one line per failed rule, then `VALID` or `INVALID`. Run it now and see it fail on the missing weak-12 files.
- [ ] **Step 3:** Convert `drafts.json` to `prompts.json` and `answer_key.json` (keys per Interfaces; `key.findings` becomes `found`, `key.must_not_invent` becomes `mustNotClaim`, `job` from `intended_output`). Do not edit prompt text.
- [ ] **Step 4:** Write `make_weak12_fixtures.js` per the drafts' `fixture` specs and `research/live-tests/SCORING_RULES.md` (seeded issues present in each file, one `hard` item per case where sensible). Run `VENDOR=<dir> node make_weak12_fixtures.js` in `research/live-tests/weak12`; all 12 fixtures must exist.
- [ ] **Step 5:** Run the validator. If it prints `INVALID` because a draft prompt fails a rule (a weak prompt grades better, a strong row reads weak, a near copy), do not reword it: report the failing ids to the lead, who re-drafts on Opus. Rule failures about files, counts or keys are yours to fix.
- [ ] **Step 6:** Commit. Labels are confirmed by Ian later in Task 8's batch; if Ian changes a label afterward, Task 6 is re-run.

Check: `cd prompt-coach && node tests/validate_done_when_sets.js | tail -1 | grep -x VALID`
Expect: VALID
Depends: none
Timeout: 40m
Tokens: 300000

---

### Task 3: Ready to paste, no blanks

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (template and placeholder code; `placeholders` count at line ~637 stays and must now be 0 for Better and Strong)
- Modify: `prompt-coach/tests/customer_check.js` (`blankOnlyC`, `blankMore` checks; line 71 `unsureTask`, which now asserts the safe wording that replaces `identify and list [what you want back...]` instead of the bracket; `ianCase` keeps comparing exactly, now against the updated fixture)
- Modify: `prompt-coach/tests/fixtures/rewrites/ian_strong.txt` (exactly one change: the span `[what it is for, such as our Scope 2 inventory]` becomes the safe wording the engine now emits; every other character stays. `ian_better.txt` has no bracket and is not touched. Expected-output exception: this text was Ian-approved, so the new text goes to Ian in Task 8's batch.)
- Modify: `prompt-coach/tests/fixtures/rewrites/blank_baseline.json` (every value becomes 0)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (the blank or placeholder lines only: lines 133-137, 143, 146 in `context: wording fits the task and registers as Context`, lines 149 and 155 in `context: only Context missing means exactly one blank, even when a kept sentence has a Context cue`; line 164 `context: Ian case gets the approved Strong and Better text, with and without the file` is unchanged and passes by the updated `ian_strong.txt`)
- Modify: `prompt-coach/tests/make_blank_baseline.js` (header comment: now writes zeros; keep it runnable)
- Modify: `prompt-coach/README.md` (test-block comment "adds blanks not facts" becomes "adds safe general wording, not facts"; "How it works" Rewrites row; the Strong-version prose)

**Interfaces:**
- Consumes: Task 1's `node tests/done_when.js --only C4`.
- Produces: `coach(...)` output where `stages.better.prompt` and `stages.strong.prompt` contain no `[...]`; Task 4 builds on the same fill points.

Safe wording rule (spec section 2): replace each `[placeholder]` with general wording Workiva AI can act on without a guess the user would object to ("the attached file", "a short table", "for the reader of this report"), or drop the clause when no safe wording exists. File metadata still fills specifics when a file is attached. Each SCOPE letter still has its piece, so the toggles work (`scope` in the output keeps one piece per letter).

- [ ] **Step 1:** List the placeholders the engine can emit: `grep -n "\[" engine/rewrite.js | grep -i "who\|number\|file\|format\|reader"` and run `node tests/done_when.js --only C4` to see the count (nonzero, exit 1).
- [ ] **Step 2:** Test first. In `tests/customer_check.js` change `blankOnlyC` to require `blanks === 0` (not 1), `blankMore` to require `blanks === 0` (zero cap in place of the baseline lookup), and line 71 to require the safe wording (a regex the worker writes after seeing what Step 4 emits; until then it must fail). In `tests/rewrite_unit.test.js` change the lines named under Files so each asserts zero `[...]` in the Strong output and, where a line asserted fact-free wording, keep that assertion. Add one new unit test: `ready to paste: no [blank] in Better or Strong for a bare ask, and each SCOPE letter still has a piece`. Run both files and see them fail.
- [ ] **Step 3:** Change `engine/rewrite.js` so every placeholder becomes safe general wording or is dropped. The re-grade check inside the rewrite (the existing "re-grades its own strong version" loop) must still pass: the filled wording must still register as its letter, or the letter's explicit variant is used.
- [ ] **Step 4:** Update `tests/fixtures/rewrites/ian_strong.txt` with the one-span change, and confirm every other character is identical with `git diff --word-diff=porcelain tests/fixtures/rewrites/ian_strong.txt` (only the bracket span differs). Regenerate `tests/fixtures/rewrites/blank_baseline.json` with `node tests/make_blank_baseline.js data/sim_customers.jsonl data/test.jsonl` (header edited to write zeros) and confirm every value is 0 with `node -e "const b=require('./tests/fixtures/rewrites/blank_baseline.json');process.exit(Object.values(b).every(v=>v===0)?0:1)"`.
- [ ] **Step 5:** Run `node tests/customer_check.js`, `node --test --test-reporter=tap tests/rewrite_unit.test.js`, `node tests/simulate.js data/train_fr.jsonl data/train_grc.jsonl data/train_hard.jsonl data/train_sus.jsonl` and `node tests/eval.js rulefeat data/test.jsonl`. All must match the locked baselines (no failure the base lacks, `GRADE acc=0.856`) apart from the changed checks. Fix the code, never a locked assertion.
- [ ] **Step 6:** Update the README lines named above, then commit.

Check: `cd prompt-coach && node tests/done_when.js --only C4 && node tests/customer_check.js | tail -1 | grep -q '^PASS' && node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E '^# fail 0' && node tests/eval.js rulefeat data/test.jsonl | grep -F 'GRADE acc=0.856'`
Expect: GRADE acc=0.856
Depends: 1
Timeout: 30m
Tokens: 300000

---

### Task 4: Questions list below the improved prompt

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (add `questions` to the `coach()` return)
- Modify: `prompt-coach/web/template.html` (render the list under the Better/Strong prompt, outside the copied text)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (new tests only)
- Modify: `prompt-coach/tests/pagetest.js` (new assertions only)
- Create: `prompt-coach/tests/capture_questions.js` (writes the capture below)
- Create: `prompt-coach/research/captures/done-when-questions.md` (output of the script; Ian sees it in Task 8's batch)
- Rebuild: `prompt-coach/dist/prompt-coach.html`
- Modify: `prompt-coach/README.md` (Page row; built-page byte size from `wc -c`)

**Interfaces:**
- Consumes: Task 3's blank-free wording and its fill points (a letter "filled generically" is one where the engine used the intent template, not the user's words or file metadata).
- Produces: `coach(...).questions`, an array of `{letter: 'S'|'C'|'O'|'P'|'E', text: string}` in SCOPE order, one per letter filled generically, using the exact spec wording: S "Which file or section should it read?"; C "Who is it for?"; P "How long, and in what format?"; E "What should it do if the data is missing?". (Objective has no question.) Empty array when nothing was filled generically. Task 5 relies on this field being empty for "No changes needed" results.

- [ ] **Step 1:** Test first, in `tests/rewrite_unit.test.js`: `questions: a bare ask gets one question per generically filled letter, none for letters the user wrote`, `questions: not part of stages.better.prompt or stages.strong.prompt`, `questions: empty when the user supplied every letter`. Run and see them fail.
- [ ] **Step 2:** Implement `questions` in `engine/rewrite.js` from the generic-fill flags; do not alter any prompt text.
- [ ] **Step 3:** In `tests/pagetest.js` add assertions (new lines only): under the Better and Strong tabs a block headed `To make it even better, tell Workiva AI:` lists the questions; the Copy button's text does not contain that heading. Run `node tests/build.js` first, then pagetest, and see the new assertions fail before the template edit.
- [ ] **Step 4:** Edit `web/template.html` to render it (a heading plus a short list under the prompt box, not inside the element that Copy reads). Rebuild with `node tests/build.js`.
- [ ] **Step 5:** Write `tests/capture_questions.js` that runs three sample prompts (one FR bare ask, one GRC, one SUS, made-up) through `coach` and writes `research/captures/done-when-questions.md`: each prompt, its Strong prompt, and its questions list exactly as the page shows them.
- [ ] **Step 6:** Run the unit tests, `node tests/pagetest.js`, `node tests/customer_check.js`, `node tests/done_when.js --only C4`; update the README byte size to `wc -c < dist/prompt-coach.html`; commit.

Check: `cd prompt-coach && node tests/build.js && node tests/pagetest.js | grep -E "^pagetest: [0-9]+ checks, 0 failed" && node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E '^# fail 0' && node tests/customer_check.js | tail -1 | grep -q '^PASS' && node tests/done_when.js --only C4 && node tests/capture_questions.js && grep -c 'To make it even better, tell Workiva AI:' dist/prompt-coach.html`
Expect: # fail 0
Depends: 3
Timeout: 30m
Tokens: 300000

---

### Task 5: "No changes needed"

**Files:**
- Modify: `prompt-coach/engine/model.js` and/or `prompt-coach/engine/weights.json` (confidence rule; `weights.json` gains only a `sure` object)
- Modify: `prompt-coach/tests/train.js` (add a `--tune-sure` mode, see Step 2)
- Modify: `prompt-coach/engine/rewrite.js` (`coach()` returns `noChanges: boolean` and `noChangesReason: string`; when true, `stages.better.prompt` and `stages.strong.prompt` equal the user's prompt unchanged and `questions` is `[]`)
- Modify: `prompt-coach/web/template.html` (headline "No changes needed: <reason>" on the Your prompt tab; Better and Strong tabs show the prompt unchanged with no copy-extra text)
- Modify: `prompt-coach/tests/done_when.js` (`noChangesNeeded(o)` reads `o.noChanges`)
- Modify: `prompt-coach/tests/rewrite_unit.test.js`, `prompt-coach/tests/pagetest.js` (new tests only)
- Modify: `prompt-coach/README.md`; rebuild `prompt-coach/dist/prompt-coach.html`

**Interfaces:**
- Consumes: Task 4's `questions`; Task 1's `tests/done_when.js --only C2,C4` and `tests/c5_gate.js`.
- Produces: `coach(...).noChanges` and `.noChangesReason` (a one-line reason naming what the prompt already has, built from the five detected letters); `engine/weights.json` gains a `sure` object with per-letter minimum probabilities and nothing else changes in it (the existing `thr` and weights stay as they are: thr S 0.625, C 0.575, O 0.3, P 0.3, E 0.45, read not measured); the rule is "every letter above its `sure` cut-off, grade is strong, and no stacked ask". A prompt that grades strong but not surely keeps today's behaviour.

- [ ] **Step 1:** Test first. Add unit tests: `no changes needed: a prompt with all five letters above the cut-offs shows noChanges and unchanged Better/Strong`; `no changes needed: a strong prompt with a stacked ask is not sure`; `no changes needed: a strong-but-borderline prompt keeps today's behaviour`; `no changes needed: a non-strong prompt is never noChanges`. Add the pagetest assertion that the Your prompt tab shows `No changes needed` for an all-five-letters prompt. Run and see them fail.
- [ ] **Step 2:** Add `--tune-sure` to `tests/train.js`. It does NOT retrain: it loads the existing `engine/weights.json`, computes out-of-fold probabilities on `data/train_*.jsonl` only (reuse the existing 5-fold out-of-fold loop at lines ~75-90, with the trained weights' hyper-parameters), chooses per-letter cut-offs that keep false "sure" (non-strong gold label shown as sure) at or below 3% of non-strong training rows out of fold while keeping the most strong training rows sure, and writes back the same file with only the `sure` key added. It must refuse any path for `data/test.jsonl`, `data/sim_customers.jsonl` or `data/done_when_strong.jsonl` (assert that in the script). Run `node tests/train.js rulefeat --tune-sure data/train_*.jsonl` (files from the shell glob, without `--tune`). Prove the other weights are untouched: `git diff --stat engine/weights.json` shows only added lines and `node -e "const a=require('./engine/weights.json'),b=JSON.parse(require('child_process').execSync('git show HEAD:prompt-coach/engine/weights.json'));delete a.sure;process.exit(JSON.stringify(a)===JSON.stringify(b)?0:1)"` exits 0. Then `node tests/eval.js rulefeat data/test.jsonl | grep -F 'GRADE acc=0.856'` must still match.
- [ ] **Step 3:** Implement `noChanges` in `engine/rewrite.js` and the page changes in `web/template.html`. Build with `node tests/build.js`.
- [ ] **Step 4:** Measure once: `node tests/done_when.js --only C2,C4`. Cut-off choices came from training data only (Step 2). If C2 is above 5% on either held-out set, do NOT change the cut-offs and do not run another round: commit what you have, write the C2 numbers into the commit message, and end the task with its Check failing so Ian is told (a retrain or a different rule is Ian's call).
- [ ] **Step 5:** Run `node tests/c5_gate.js` (eval `GRADE acc=0.856`, simulate categories at or below base, customer_check, rewrite_unit, pagetest). None may fail where the base did not. Update the README (How it works Model/Rewrites/Page rows, test block, built-page byte size). Commit.

Check: `cd prompt-coach && node tests/build.js && node tests/done_when.js --only C2,C4 && node tests/c5_gate.js && node tests/eval.js rulefeat data/test.jsonl | grep -F 'GRADE acc=0.856'`
Expect: GRADE acc=0.856
Depends: 4
Timeout: 40m
Tokens: 400000

---

### Task 9: C1 fix round

Ian approved exactly this (2026-10-22 13:31:26Z, card "[Ian] C1 miss": "Fix + fresh test"). Task 6 measured C1 17/30 on the first strong-30 set (measured by the lead at 4158145; C2 2.0% test / 2.7% sim PASS; C4 0 blanks PASS). That set is now seen: before launch the lead moves it to `data/done_when_strong_r1.jsonl` (dev data) and replaces `data/done_when_strong.jsonl` with a fresh held-out set. This task reads `data/test.jsonl` and `data/sim_customers.jsonl` only through the C2/C4 measurement in Step 5 and the Check (measure once, never tune or choose by them); it never reads `data/done_when_strong.jsonl`; it uses `data/train_*.jsonl` and, for regression fixtures only, `data/done_when_strong_r1.jsonl`.

Misses on the old set, measured by the lead (labels FR6 etc. are the lead's names for rows of the r1 file): 9 had Context probability 0.66, below `sure.C` 0.70 (FR6 FR7 GRC9 SUS18 SUS21 SUS24 GEN26 GEN27 GEN28); FR3 and GEN29 graded strong with Strong text unchanged, but the Better stage edited the text; GRC14 hit the stacked-list rule; SUS22 had Context not detected. GRC14 and SUS22 are out of scope here; Task 7's evidence doc notes them as open.

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (the `better:` entry of `stages`, line ~593: when `grade === 'strong'` the Better prompt is `prompt.trim()`)
- Modify: `prompt-coach/tests/train.js` (the `--tune-sure` cut-off rule, Step 3)
- Modify: `prompt-coach/engine/weights.json` (the `sure` values only)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (new tests only)
- Modify: `prompt-coach/README.md` (cut-off values and rule); rebuild `prompt-coach/dist/prompt-coach.html`
- Read only (run by the Check, not edited): `prompt-coach/tests/pagetest.js`, `prompt-coach/tests/c5_gate.js`

If the Better change or the new `sure` cut-offs break an existing test (including Task 5's `no changes needed: a strong-but-borderline prompt keeps today's behaviour` tests in `rewrite_unit.test.js`, `pagetest.js` or `c5_gate.js`), the task does not edit that test or gate. It commits, writes the failing test name in the commit message and ends with its Check failing, so Ian is told.

**Interfaces:**
- Consumes: Task 5's `noChanges`, `weights.sure` and `--tune-sure`; `data/done_when_strong_r1.jsonl` (the FR3 and GEN29 rows as regression fixtures).
- Produces: for every prompt graded strong, `stages.better.prompt === stages.strong.prompt === prompt.trim()` whether or not `noChanges` is true; a re-picked `sure` object. Task 6 measures the result on the fresh set.

- [ ] **Step 1:** Red test first. Find the two regression prompts: run `coach` over the rows of `data/done_when_strong_r1.jsonl` and list the rows with `grade === 'strong'` and `stages.better.prompt !== prompt.trim()` (these are FR3 and GEN29). Copy their texts into `tests/rewrite_unit.test.js` as inline strings so the test does not depend on a data file. Add two tests. (a) `better stage: a prompt graded strong is returned untouched in Better` (asserts `grade === 'strong'` and `stages.better.prompt === text.trim()` for both texts). This is the red-before-green evidence: it must fail on the parent commit, and you run it and see it fail before Step 2. (b) `better stage: a strong prompt that is not sure still has Better equal to Strong`. This one is a guard and may already pass on the parent; that is accepted. If one of the FR3/GEN29 texts is graded strong but not sure (`noChanges` false) and its Better differs from Strong today, use it for (b) so (b) also fails first. Run `node --test tests/rewrite_unit.test.js` and see (a) fail.
- [ ] **Step 2:** Make the fix in `engine/rewrite.js` (line ~593) and run the same file until it passes. Grades and every other stage stay as they are.
- [ ] **Step 3:** Re-pick the cut-offs from training data only, by a stated rule. Change `--tune-sure` in `tests/train.js` and write the rule in its header comment and in the README. The rule: on the out-of-fold probabilities of `data/train_*.jsonl`, for each Context cut-off on the 0.01 grid from 0.50 upward, search S in {0.95, 0.96, 0.97, 0.98, 0.99} and O, P, E on the 0.05 grid 0.10 to 0.95; keep the set with the most strong rows sure whose false sure is at or below 3% of non-strong rows; take the LOWEST Context cut-off whose best set keeps at least as many strong training rows sure as today's cut-offs. Ties: the first set found in that loop order (C ascending, then S, O, P, E in that nesting order, each ascending). Why: Context is the letter strong prompts miss on (r1 dev analysis), and the numbers come from training only. This replaces the earlier "centre of the longest flat run" rule: the lead measured it (training out-of-fold, seed 7, 14:50Z) and it picks C 0.87, which raises the cut-off (strong sure 158 to 143), and C alone at 0.66 breaks the cap (31/827 = 3.75%). Write back only the `sure` values. Print today's set and the picked set, with false sure over non-strong rows and strong rows sure over strong rows, for both. Expected print (the lead ran this rule): today 20/827 false sure, 158/253 strong sure; picked `{"S":0.99,"C":0.65,"O":0.55,"P":0.2,"E":0.95}`, false sure 24/827 (2.90%), strong sure 166/253. If the script prints a different set, stop: commit, put both sets in the message, and end with the Check failing. Disclosure (put it in the commit message and the README): the lead tried candidate sets on `data/done_when_strong_r1.jsonl` (dev data, already seen); this set scored C1 27/30 there before the Better fix; the fresh set was not read. Choose nothing by looking at either strong set or at `data/test.jsonl` or `data/sim_customers.jsonl`.
- [ ] **Step 4:** Run `node tests/train.js rulefeat --tune-sure data/train_*.jsonl` (no `--tune`, no other trainer). Prove only `sure` changed with the Task 5 Step 2 comparison, corrected, since HEAD now has `sure` and the old command fails on unchanged weights: `node -e "const a=require('./engine/weights.json'),b=JSON.parse(require('child_process').execSync('git show HEAD:prompt-coach/engine/weights.json'));delete a.sure;delete b.sure;process.exit(JSON.stringify(a)===JSON.stringify(b)?0:1)"` (exit 0). Keep the printed train-side numbers for the commit message and README.
- [ ] **Step 5:** `node tests/build.js && node tests/done_when.js --only C2,C4`. If C2 is above 5% on either set, do not adjust and do not run another round: commit, write the numbers in the message, and end with the Check failing so Ian is told.
- [ ] **Step 6:** `node tests/c5_gate.js` must be green. Update the README (cut-offs, the rule, built-page byte size) and commit with the train-side numbers.

Check: `cd prompt-coach && node tests/build.js && node --test tests/rewrite_unit.test.js && node tests/c5_gate.js && node tests/done_when.js --only C2,C4 | grep -c PASS | grep -x 3`
Expect: 3
Depends: 5
Timeout: 40m
Tokens: 350000

---

### Task 6: C1 measurement on the fresh set

**Files:**
- Create: `prompt-coach/research/2026-10-22-done-when-c1.txt` (the run output, kept for Task 7)

Measures the fresh held-out set (`data/done_when_strong.jsonl`, replaced by the lead before launch) once, after Task 9. Measurement only. No other file changes, no retrain, no new training rows, no edits to the set.

**Interfaces:**
- Consumes: `data/done_when_strong.jsonl` (the fresh set, committed by the lead; labels are drafts until Ian confirms them in Task 8) and the work of Tasks 5 and 9 (`noChanges`, Better untouched for strong, re-picked `sure`).
- Produces: the measured fresh-set C1 count that Task 7 quotes.

- [ ] **Step 1:** Run `node tests/done_when.js --only C1 > research/2026-10-22-done-when-c1.txt; echo "exit $?" >> research/2026-10-22-done-when-c1.txt` (no tee; the saved file keeps node's exit status as its last line).
- [ ] **Step 2:** Read the saved file's last line. If it is `exit 2` (a `done_when.js` script error: thrown error, missing file, zero rows), that is not a bar miss: do not commit a result, do not list rows, and end the task with its Check failing, with the file's `ERROR` line in the reply. If it is `exit 0` (C1 at 27 of 30 or more, prompt untouched), go to Step 4. If it is `exit 1` (a bar miss), go to Step 3.
- [ ] **Step 3:** On a miss, first collect the missed rows; do not tune on the fresh set, do not edit it, do not retrain. `done_when.js` prints no row ids (it is a locked check script; never edit it). List the missed 1-based row numbers with a throwaway script in the OS temp folder (never in the repo) that uses the same pass condition as `done_when.js` lines 41-43 (`noChangesNeeded(o)` true and the Strong and Better prompt text equal to the trimmed original). Append the count and the missed row numbers to `research/2026-10-22-done-when-c1.txt`, so the file is complete before it is committed.
- [ ] **Step 4:** Commit `research/2026-10-22-done-when-c1.txt`. On a pass, commit it as it stands. On a miss, put the count and the missed row numbers in the commit message and then end the task with its Check failing, so Ian gets the numbers (spec: no AI model; a retrain is Ian's call).

Check: `cd prompt-coach && grep -qx 'exit 0' research/2026-10-22-done-when-c1.txt && node tests/done_when.js --only C1 | grep -E '^C1 .*(2[7-9]|30) of 30.*PASS'`
Expect: of 30
Depends: 2, 5, 9
Timeout: 10m
Tokens: 100000

---

### Task 7: Evidence doc and README

**Files:**
- Create: `docs/evidence/2026-10-22-prompt-coach-done-when.md`
- Create: `prompt-coach/tests/check_evidence.js`
- Modify: `prompt-coach/README.md`

**Interfaces:**
- Consumes: fresh output of `node tests/done_when.js` and `node tests/c5_gate.js`, and `research/2026-10-22-done-when-c1.txt` from Task 6.
- Produces: `node tests/check_evidence.js` runs `done_when.js` and `c5_gate.js` itself, then exits 1 unless every result line printed (`C1 ...`, `C2 set=test ...`, `C2 set=sim ...`, `C4 ...`, and each `GATE ...` line) appears verbatim in the evidence doc, every one of them ends `PASS`, and the doc has a line starting `C3 pending` (C3 runs after the driver in a `--chrome` session, see "After the driver").

This task never runs `tests/train.js` or `tests/train_cls.js` (the first, run with `--tune`, would overwrite `weights.json` and drop `sure`; the second writes the locked classifier weights). The README test block keeps those trainer lines marked "retrain only, not part of verification", and verification reads the frozen artifacts instead.

- [ ] **Step 1:** Verify the frozen artifacts without training: `git diff --quiet <task-1-parent> -- prompt-coach/engine/cls-weights.json prompt-coach/engine/rules.js prompt-coach/engine/classify.js` exits 0 (`<task-1-parent>` is the commit before Task 1's), and `engine/weights.json` differs from that commit only by the `sure` key (the `node -e` check from Task 5 Step 2).
- [ ] **Step 2:** Run `node tests/c5_gate.js` and `node tests/done_when.js` fresh; keep each result line. These are the C5 and C1/C2/C4 numbers; quote only what you just measured.
- [ ] **Step 3:** Write the evidence doc: a table of C1, C2, C4, C5 (today, bar, measured now, pass or miss), each marked "measured now" or "read", with the result lines pasted verbatim. C1 reports both numbers: the first round, 17/30 on the first strong-30 set (now `data/done_when_strong_r1.jsonl`, seen and dev data; marked "read", from Task 6's first run and the progress ledger), and the fresh-set result (measured now, Task 6). List the open misses from that first round that Task 9 did not address (GRC14 stacked list, SUS22 Context not detected). A line `C3 pending: needs the sandbox session (see After the driver)`; the yardstick mapping listed as not done. State the test-set caveat (the fresh strong-30 and weak-12 are drafts until Ian confirms in Task 8). List the expected test changes made in Task 3 by file and what each now asserts.
- [ ] **Step 4:** Write `tests/check_evidence.js` per the interface and run it against the doc; fix the doc, not the checker, if it fails.
- [ ] **Step 5:** Update the README: test block final form (includes `done_when.js`, `c5_gate.js` and the validator; trainer lines marked retrain only), a short "Done when" section (what "No changes needed" means, the questions list, "ready to paste"), the `Still open` list (C3, yardstick page, label confirmation), and every count or size that changed (`wc -c < dist/prompt-coach.html`).
- [ ] **Step 6:** Check the doc against the README for the same numbers; commit.

Check: `cd prompt-coach && node tests/check_evidence.js && grep -q 'done_when.js' README.md && grep -q "$(wc -c < dist/prompt-coach.html)" README.md && echo EVIDENCE-OK`
Expect: EVIDENCE-OK
Depends: 6
Timeout: 20m
Tokens: 120000

---

### Task 8: Ian's review batch [IAN: look]

Leaf task. Nothing depends on it. It gathers what Ian must confirm, in one place, after all build tasks.

**Files:**
- Create: `prompt-coach/tests/make_look_batch.js`
- Create: `prompt-coach/research/captures/2026-10-22-done-when-look-batch.md`

**Interfaces:**
- Consumes: `data/done_when_strong.jsonl` (the fresh 30), `research/live-tests/weak12/prompts.json` and `answer_key.json` (the 12 weak prompts and 12 keys); Task 3's new `tests/fixtures/rewrites/ian_strong.txt`; Task 4's `research/captures/done-when-questions.md` page captures; Task 6's `research/2026-10-22-done-when-c1.txt`.

- [ ] **Step 1:** Write `tests/make_look_batch.js` that assembles four sections into the batch file: (1) the 42 prompts (the fresh 30 plus weak-12; id, domain, text, the label or the key) with a line per set saying "labels are drafts, Ian confirms"; (2) the new `ian_strong.txt` text next to the old (from `git show`) with the changed span marked, and the sentence "Ian-approved text changed because blanks are gone"; (3) the contents of `done-when-questions.md`; (4) the C1 line (fresh set).
- [ ] **Step 2:** Run it. Open the output and check each section has content (a green run that wrote empty sections is not a pass).
- [ ] **Step 3:** Commit. Ian confirms in one batch (PM first pass first); do not edit the sets after the Look without re-running Task 6.

Check: `cd prompt-coach && node tests/make_look_batch.js && test "$(grep -c '^## ' research/captures/2026-10-22-done-when-look-batch.md)" -ge 4 && test "$(grep -c 'done-when-strong\|FR-W1\|GRC-W4\|SUS-W4' research/captures/2026-10-22-done-when-look-batch.md)" -ge 4 && echo BATCH-OK`
Expect: BATCH-OK
Depends: 7
Look: true
Captures: prompt-coach/research/captures/2026-10-22-done-when-look-batch.md, prompt-coach/research/captures/done-when-questions.md
Timeout: 10m
Tokens: 40000

---

## Groups and tuning

- Group A (no data wait): Tasks 1, 3, 4, 5, 9, 6, 7 run in order with no human gate; Task 2 is independent and Task 6 waits for it. Task 8 is the only Look and the only task with Ian's hands; nothing depends on it.
- Tasks 5 and 9 are the tune tasks (each moves one number by choosing the `sure` cut-offs out of fold on training data; Task 5 moves C2, Task 9 re-picks by the lowest-Context-cut-off rule to lift C1 without raising C2 above 5%); run each under the tune-loop skill, one metric, held-out sets read only to measure, one measurement, no second round.
- Locked files (no edits beyond those named): `prompt-coach/data/test.jsonl`, `prompt-coach/data/sim_customers.jsonl`, `prompt-coach/data/done_when_strong.jsonl` (the fresh set, committed by the lead before launch), `prompt-coach/data/done_when_strong_r1.jsonl` (moved by the lead, read-only fixtures), `prompt-coach/engine/rules.js`, `prompt-coach/engine/classify.js`, `prompt-coach/engine/cls-weights.json`, `prompt-coach/tests/eval.js`, `prompt-coach/tests/simulate.js`, `prompt-coach/tests/done_when.js` after Task 5 (Task 6 only runs it), and `prompt-coach/engine/weights.json` apart from the `sure` key.

## Token estimates (helper tokens, my estimate, not measured)

Task 1: 130k. Task 2: 300k. Task 3: 300k. Task 4: 300k. Task 5: 400k. Task 9: 350k. Task 6: 100k. Task 7: 120k. Task 8: 40k. Run total: about 2.04M helper tokens. Wall time estimate: about 4h of timeouts.

## Paid calls

None. $0.

## Expected breaks

- context: wording fits the task and registers as Context | fixed by Task 3
- context: only Context missing means exactly one blank, even when a kept sentence has a Context cue | fixed by Task 3
- context: Ian case gets the approved Strong and Better text, with and without the file | fixed by Task 3

Note on titles: the first two are `node --test` titles whose blank lines Task 3 edits (lines 133-137, 143, 146, 149, 155); the third stays unchanged in the test file and fails only until `ian_strong.txt` is updated. The new `ian_strong.txt` wording goes to Ian in Task 8's batch. Also broken and fixed by Task 3 but not `node --test` titles: `tests/customer_check.js` buckets `blankOnlyC`, `blankMore`, `unsureTask` (line 71) and `ianCase`. Task 9 breaks no named test (Better equals Strong for strong prompts only adds a new assertion; the C5 gate and the C2/C4 checks are re-run in its Check).

## After the driver

Not tasks; they need a `--chrome` session after Ian confirms Task 8.

1. Yardstick page: open https://support.workiva.com/hc/en-us/articles/19173586555412 in Ian's browser, save the text verbatim to `prompt-coach/research/2026-10-22-workiva-tips.md`, map each README rewrite rule to a line of the page or of SCOPE, and list any conflict for Ian (do not change silently). The spec records that this moved out of the build tasks.
2. C3 sandbox run: weak-12 in the Workiva AI sandbox (https://sandbox.wdesk.com/ only), improved prompt pasted as-is, 2 runs each (24), the original prompt 2 runs each beside it, scored by `research/live-tests/SCORING_RULES.md` with a second-provider scorer. Bars: at least 22 of 24 intended answer in the requested format; 0 of 24 invent a fact; keyed findings found at least the original's. One browser driver at a time. Its result replaces the `C3 pending` line in the evidence doc.
3. Merge: backup branch, full suite, final review, per the merge rule.
