# Prompt Coach: done when, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The offline coach says "No changes needed" for prompts that are surely strong, hands back Better/Strong prompts with no `[blanks]`, and lists follow-up questions below the improved prompt, with a harness (`tests/done_when.js`) that measures C1, C2, C4.

**Architecture:** Rules only, no model or network call. A confidence rule on the existing per-letter model (tuned out of fold on `train_*` only) drives "No changes needed". `engine/rewrite.js` swaps each placeholder for safe general wording (or drops it) and returns a per-letter questions list that the page shows outside the copied text.

**Tech Stack:** Node (CommonJS, no dependencies), single-file HTML page built by `tests/build.js`, `node --test` for unit tests.

**Spec:** `docs/superpowers/specs/2026-10-22-prompt-coach-done-when-design.md` (all paths below are relative to the worktree root; the coach lives in `prompt-coach/`).

Suite: cd prompt-coach && node tests/build.js && node tests/pagetest.js && node tests/eval.js rulefeat data/test.jsonl && node tests/simulate.js data/train_fr.jsonl data/train_grc.jsonl data/train_hard.jsonl data/train_sus.jsonl && node tests/customer_check.js && node --test --test-reporter=tap tests/rewrite_unit.test.js && node tests/done_when.js
Data: (none)
Spend: $0

Data note: `Data: (none)` because no task edits or deletes existing data. Task 2 adds new files; Task 3 regenerates `tests/fixtures/rewrites/blank_baseline.json` (a derived test fixture, not source data); Task 5 retrains `engine/weights.json` from `train_*` through the existing trainer.

## Global Constraints

- Cost is $0. No paid call, no LLM, no network call, from the coach or from any script in this plan.
- Made-up data only. No real customer, company or personal data in prompts, fixtures or keys. Use "Example Co" style names.
- Never tune on `prompt-coach/data/test.jsonl`, `prompt-coach/data/sim_customers.jsonl` or `prompt-coach/data/done_when_strong.jsonl`. Only `data/train_*.jsonl` may be used to choose a threshold or retrain. Held-out sets are read only to measure.
- Name test files, never folders: `node --test tests/rewrite_unit.test.js` (node 26 runs nothing for a folder).
- The README (`prompt-coach/README.md`) is updated in the same commit as whatever it describes, including any count, byte size or name nearby prose gets wrong (the README says the built page is 337042 bytes; fix it when `dist` is rebuilt).
- Tests first: every new test or check must fail before the code that satisfies it, and the worker must run it and see the failure before writing the code.
- Do not change the grade rule (weak if Source or Objective missing; strong if all five letters present and not stacked) or the SCOPE letters.
- Every existing assertion in `tests/customer_check.js`, `tests/rewrite_unit.test.js`, `tests/simulate.js` and `tests/eval.js` is locked, except the blank checks named in Task 3. Do not loosen any other assertion. Baselines measured at 902fbff: eval 85.6%, simulate 2 + 5 of 2,070 fails, customer_check PASS 229, rewrite_unit 67/67.
- The coach stays AI-free (Ian, 2026-10-22). If a bar cannot be met by rules, stop and report the numbers; do not add a model.
- Sandbox use is out of this plan (see "After the driver"). Never open production Workiva (app.wdesk.com).
- Commit only inside a task, message "task N: <title>". Never push or merge.

---

### Task 1: Measurement harness tests/done_when.js

**Files:**
- Create: `prompt-coach/tests/done_when.js`

**Interfaces:**
- Produces: CLI `node tests/done_when.js [--only C1,C2,C4]`. Prints one line per check, each starting with `C1`, `C2` or `C4`. Exit 1 if any check that ran misses its bar, else 0. Exports nothing. Later tasks call it.
- Consumes: `engine/rewrite.js` `coach(prompt, {files, detect, ...pick})`, `engine/model.js` `predict`, `engine/classify.js` `unpack`/`pick`, as in `tests/make_blank_baseline.js` (copy its detect/CLS/FILES setup; FILES is read out of `tests/customer_check.js` the same way).

"Shown no changes needed" today means `coach(...).grade === 'strong'` (the message does not exist yet). Define a helper `noChangesNeeded(o)` in this file: today it returns `o.grade === 'strong'`; Task 5 changes it to read the new field `o.noChanges`.

- [ ] **Step 1:** Write the script. C1: read `data/done_when_strong.jsonl` if it exists (else print `C1 skipped: data/done_when_strong.jsonl not present` and do not count it as a miss); count rows where `noChangesNeeded(o)` is true and Strong/Better prompt text equals the original prompt trimmed; bar >= 27 of 30. C2: for `data/test.jsonl` and `data/sim_customers.jsonl`, among rows where not all of S,C,O,P,E are 1 or `stacked` is 1 ("non-strong"), the share with `noChangesNeeded`; bar <= 5% each. Print counts and percent.
- [ ] **Step 2:** C4: over test.jsonl + sim_customers.jsonl + the weak-12 prompts (read `research/live-tests/weak12/prompts.json` if present, else skip that part and say so in the line), run `coach` twice per prompt (no files; with the matching `FILES[domain]` when one exists) and count `[...]` occurrences in `stages.better.prompt` and `stages.strong.prompt` for coach-not-strong runs. Print `C4 blanks=<n> across <m> outputs (bar 0)`, plus the share of runs with at least one blank.
- [ ] **Step 3:** Add `--only` so a list such as `--only C2,C4` runs just those checks and skips the others silently.
- [ ] **Step 4:** Run it. It must exit 1 today. Record in the commit message the baseline lines: C2 near 6% and 15%, C4 blank runs near 92% and 97% of coach-not-strong runs.
- [ ] **Step 5:** Add the command to the README test block (one line, with a comment) in the same commit. Commit.

Check: `cd prompt-coach && out=$(node tests/done_when.js; echo "rc=$?") && test "$(echo "$out" | grep -cE '^(C1|C2|C4)')" -ge 3 && echo "$out" | grep -q 'rc=1' && echo BASELINE-MISSES-AS-EXPECTED`
Expect: BASELINE-MISSES-AS-EXPECTED
Depends: none
Timeout: 15m
Tokens: 120000

---

### Task 2: Test sets strong-30 and weak-12

**Files:**
- Create: `prompt-coach/data/done_when_strong.jsonl` (30 rows, same keys as `data/test.jsonl`: prompt, S, C, O, P, E = 1, stacked 0, intent, domain, tags `["done-when-strong"]`)
- Create: `prompt-coach/research/live-tests/weak12/make_weak12_fixtures.js` (modelled on `research/live-tests/make_live_fixtures.js`; `VENDOR=<npm dir> node make_weak12_fixtures.js` writes `./fixtures`; invented data only)
- Create: `prompt-coach/research/live-tests/weak12/prompts.json` (12 entries: id `FR-W1..4`, `GRC-W1..4`, `SUS-W1..4`; prompt; domain; fixture file name; intended output; requested format)
- Create: `prompt-coach/research/live-tests/weak12/answer_key.json` (same shape as `research/live-tests/fixtures/answer_key.json`: job, found, hard, optional, mustNotClaim, absent per SCORING_RULES.md)
- Create: `prompt-coach/research/live-tests/weak12/fixtures/*` (12 made-up files, built by the script; if the script cannot run for lack of the vendor libraries, say so in the commit message and leave the script and the `prompts.json` in place)
- Create: `prompt-coach/tests/validate_done_when_sets.js`

**Interfaces:**
- Produces: `prompts.json` as `[{id, domain, prompt, file, intended, format}]` (Task 1's C4 reads `.prompt` and `.domain`); `data/done_when_strong.jsonl` (Tasks 1, 5, 6 read it).

- [ ] **Step 1:** Write `tests/validate_done_when_sets.js` first. It fails (exit 1) if: strong-30 does not have exactly 30 rows, or domains are not all of FR, GRC, SUS and general (at least 5 each, 30 total); any strong-30 row has a letter label not 1 or stacked not 0; weak-12 does not have 12 prompts, 4 each of FR/GRC/SUS; any weak-12 prompt does not grade `weak` in the coach (`coach(...).grade === 'weak'`); any weak-12 key entry is missing `found`, `mustNotClaim` or `job`; any fixture named in `prompts.json` is missing; any of the 42 prompts is an exact or near copy of a row in `data/train_*.jsonl` or `data/test.jsonl` (normalize: lowercase, strip punctuation and spaces; near copy = Jaccard over word 3-grams >= 0.6). Print one line per failed rule, then `VALID` or `INVALID`. Run it now and see it fail on missing files.
- [ ] **Step 2:** Draft strong-30: fresh prompts that name a source, state a context or reader, one objective, parameters (format, length, scope) and an evaluation or check, asking for one thing. Mix of FR, GRC, SUS and general, with at least 5 of each. Made-up data only. Do not copy or lightly reword any train or test row.
- [ ] **Step 3:** Draft weak-12 prompts: each 4 FR / 4 GRC / 4 SUS, written like a hurried user (missing Source or Objective so they grade weak), each tied to one made-up fixture the script builds.
- [ ] **Step 4:** Write the fixtures script and answer key per `SCORING_RULES.md` (planted findings in `found`, one `hard` item per case where sensible, `mustNotClaim` for facts absent from the file, requested format). Run the script if its libraries are available.
- [ ] **Step 5:** Run the validator until it prints `VALID`. If a draft weak prompt grades better, make it vaguer; if a strong row does not read as strong, fix the row, not the grader.
- [ ] **Step 6:** Commit. Ian confirms labels in one batch afterward (PM first pass); do not edit after the Look.

Check: `cd prompt-coach && node tests/validate_done_when_sets.js | tail -1 | grep -x VALID`
Expect: VALID
Depends: none
Look: true
Captures: prompt-coach/data/done_when_strong.jsonl, prompt-coach/research/live-tests/weak12/prompts.json, prompt-coach/research/live-tests/weak12/answer_key.json
Timeout: 20m
Tokens: 150000

---

### Task 3: Ready to paste, no blanks

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (template and placeholder code; `placeholders` count at line ~637 stays and must now be 0 for Better and Strong)
- Modify: `prompt-coach/tests/customer_check.js` (`blankOnlyC` and `blankMore` checks only)
- Modify: `prompt-coach/tests/fixtures/rewrites/blank_baseline.json` (every value becomes 0)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (the 6 blank or placeholder lines only)
- Modify: `prompt-coach/tests/make_blank_baseline.js` (header comment: now writes zeros; keep it runnable)
- Modify: `prompt-coach/README.md` (test-block comment "adds blanks not facts" becomes "adds safe general wording, not facts"; "How it works" Rewrites row; the Strong-version prose)

**Interfaces:**
- Consumes: Task 1's `node tests/done_when.js --only C4`.
- Produces: `coach(...)` output where `stages.better.prompt` and `stages.strong.prompt` contain no `[...]`; Task 4 builds on the same fill points.

Safe wording rule (spec section 2): replace each `[placeholder]` with general wording Workiva AI can act on without a guess the user would object to ("the attached file", "a short table", "for the reader of this report"), or drop the clause when no safe wording exists. File metadata still fills specifics when a file is attached. Each SCOPE letter still has its piece, so the toggles work (`scope` in the output keeps one piece per letter).

- [ ] **Step 1:** List the placeholders the engine can emit: `grep -n "\[" engine/rewrite.js | grep -i "who\|number\|file\|format\|reader"` and run `node tests/done_when.js --only C4` to see the count (nonzero).
- [ ] **Step 2:** Test first: in `tests/customer_check.js` change `blankOnlyC` to require `blanks === 0` (not 1) and `blankMore` to require `blanks === 0` (replace the baseline lookup with a zero cap); in `tests/rewrite_unit.test.js` change the 6 blank or placeholder lines so each asserts `0 blanks` in the output and, where a line asserted fact-free wording, keep that assertion. Add one new unit test: `ready to paste: no [blank] in Better or Strong for a bare ask, and each SCOPE letter still has a piece`. Run both files and see them fail.
- [ ] **Step 3:** Change `engine/rewrite.js` so every placeholder becomes safe general wording or is dropped. Re-grade check inside the rewrite (the existing "re-grades its own strong version" loop) must still pass: the filled wording must still register as its letter, or the letter's explicit variant is used.
- [ ] **Step 4:** Regenerate `tests/fixtures/rewrites/blank_baseline.json` with `node tests/make_blank_baseline.js data/sim_customers.jsonl data/test.jsonl` (after setting its output to zeros per the header edit) and confirm every value is 0 with `jq 'to_entries|map(.value)|unique' tests/fixtures/rewrites/blank_baseline.json`.
- [ ] **Step 5:** Run `node tests/customer_check.js`, `node --test --test-reporter=tap tests/rewrite_unit.test.js`, `node tests/simulate.js data/train_fr.jsonl data/train_grc.jsonl data/train_hard.jsonl data/train_sus.jsonl` and `node tests/eval.js rulefeat data/test.jsonl`. All must match the locked baselines (no failure the base lacks, eval 85.6%) apart from the changed blank checks. Fix the code, never a locked assertion.
- [ ] **Step 6:** Update the README lines named above, then commit.

Check: `cd prompt-coach && node tests/done_when.js --only C4 && node tests/customer_check.js | tail -3 && node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E '^# (pass|fail)' && node tests/eval.js rulefeat data/test.jsonl | grep -F 'acc=0.856'`
Expect: acc=0.856
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
- Create: `prompt-coach/research/captures/done-when-questions.md` (output of the script, for Ian)
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
- [ ] **Step 6:** Run the unit tests, `node tests/pagetest.js`, `node tests/customer_check.js`; update the README byte size to `wc -c < dist/prompt-coach.html`; commit.

Check: `cd prompt-coach && node tests/build.js && node tests/pagetest.js | tail -3 && node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E '^# fail 0' && node tests/capture_questions.js && grep -c 'To make it even better, tell Workiva AI:' dist/prompt-coach.html`
Expect: # fail 0
Depends: 3
Look: true
Captures: prompt-coach/research/captures/done-when-questions.md
Timeout: 30m
Tokens: 300000

---

### Task 5: "No changes needed"

**Files:**
- Modify: `prompt-coach/engine/model.js` and/or `prompt-coach/engine/weights.json` (confidence rule and its tuned cut-offs)
- Modify: `prompt-coach/tests/train.js` (add a `--tune-sure` step that picks the cut-offs out of fold on `train_*` rows only; reuse its existing 5-fold out-of-fold loop at lines ~75-90)
- Modify: `prompt-coach/engine/rewrite.js` (`coach()` returns `noChanges: boolean` and `noChangesReason: string`; when true, `stages.better.prompt` and `stages.strong.prompt` equal the user's prompt unchanged and `questions` is `[]`)
- Modify: `prompt-coach/web/template.html` (headline "No changes needed: <reason>" on the Your prompt tab; Better and Strong tabs show the prompt unchanged with no copy-extra text)
- Modify: `prompt-coach/tests/done_when.js` (`noChangesNeeded(o)` reads `o.noChanges`)
- Modify: `prompt-coach/tests/rewrite_unit.test.js`, `prompt-coach/tests/pagetest.js` (new tests only)
- Modify: `prompt-coach/README.md`; rebuild `prompt-coach/dist/prompt-coach.html`

**Interfaces:**
- Consumes: Task 4's `questions`; Task 1's `tests/done_when.js --only C2,C4`.
- Produces: `coach(...).noChanges` and `.noChangesReason` (a one-line reason naming what the prompt already has, built from the five detected letters); `engine/weights.json` gains a `sure` object with per-letter minimum probabilities; the rule is "every letter above its `sure` cut-off, grade is strong, and no stacked ask". A prompt that grades strong but not surely keeps today's behaviour.

- [ ] **Step 1:** Test first. Add unit tests: `no changes needed: a prompt with all five letters above the cut-offs shows noChanges and unchanged Better/Strong`; `no changes needed: a strong prompt with a stacked ask is not sure`; `no changes needed: a strong-but-borderline prompt keeps today's behaviour`; `no changes needed: a non-strong prompt is never noChanges`. Add the pagetest assertion that the Your prompt tab shows `No changes needed` for an all-five-letters prompt. Run and see them fail.
- [ ] **Step 2:** Add `--tune-sure` to `tests/train.js`: from the out-of-fold probabilities of `data/train_*.jsonl` only, choose per-letter cut-offs that keep false "sure" (non-strong gold label shown as sure) at or below 3% of non-strong training rows out of fold, while keeping the most strong training rows sure. It must never open `data/test.jsonl`, `data/sim_customers.jsonl` or `data/done_when_strong.jsonl` (assert that in the script by refusing those paths). Write the cut-offs into `engine/weights.json` under `sure`. Run `node tests/train.js rulefeat --tune-sure data/train_*.jsonl` with the files named by the shell glob; the retrain of the other weights must not change (diff `weights.json` apart from `sure`).
- [ ] **Step 3:** Implement `noChanges` in `engine/rewrite.js` and the page changes in `web/template.html`. Build with `node tests/build.js`.
- [ ] **Step 4:** Measure: `node tests/done_when.js --only C2,C4`. C2 must be at or under 5% on both sets. If C2 is above 5% on either, tighten the `sure` cut-offs using training data only (never by reading which held-out row is wrong), rerun, up to one more round; if still missed, stop and write the numbers into the commit message and exit the task with the check failing so Ian is told.
- [ ] **Step 5:** Run the full locked suite pieces: `node tests/eval.js rulefeat data/test.jsonl` (85.6%, grade rule unchanged), `node tests/simulate.js data/train_fr.jsonl data/train_grc.jsonl data/train_hard.jsonl data/train_sus.jsonl`, `node tests/customer_check.js`, `node --test --test-reporter=tap tests/rewrite_unit.test.js`, `node tests/pagetest.js`. None may fail where the base did not. Update the README (How it works Model/Rewrites/Page rows, test block, built-page byte size). Commit.

Check: `cd prompt-coach && node tests/build.js && node tests/done_when.js --only C2,C4 && node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E '^# fail 0' && node tests/pagetest.js | tail -3 && node tests/customer_check.js | tail -2`
Expect: # fail 0
Depends: 4
Timeout: 40m
Tokens: 400000

---

### Task 6: C1 measurement on strong-30

**Files:**
- Modify: `prompt-coach/tests/done_when.js` only if the C1 line needs a count fix (no tuning).
- Create: `prompt-coach/research/2026-10-22-done-when-c1.txt` (the run output, kept for Task 7)

**Interfaces:**
- Consumes: Task 2's `data/done_when_strong.jsonl` (after Ian confirms its labels) and Task 5's `noChanges`.
- Produces: the measured C1 count that Task 7 quotes.

- [ ] **Step 1:** Run `node tests/done_when.js --only C1` and save the output to `research/2026-10-22-done-when-c1.txt` with `| tee`.
- [ ] **Step 2:** The bar is 27 of 30 or more with the prompt untouched. If it misses, do not tune on strong-30 and do not edit the set. Add the 3+ missed prompts as paraphrase-free new training rows only if they are clearly strong by `data/LABELING.md` and written fresh (not the strong-30 text), retrain per the README, rerun Task 5's `--tune-sure`, and rerun C2. One round only.
- [ ] **Step 3:** If still under 27 after the one round, stop: commit the output file with the miss recorded and let the check fail so Ian gets the numbers (spec: no AI model).
- [ ] **Step 4:** Re-run the lock checks after any retrain: `node tests/eval.js rulefeat data/test.jsonl`, `node tests/done_when.js --only C2,C4`, `node tests/customer_check.js`.
- [ ] **Step 5:** Commit.

Check: `cd prompt-coach && node tests/done_when.js --only C1 | tee /dev/stderr | grep -E '^C1 .*(2[7-9]|30) of 30'`
Expect: of 30
Depends: 2, 5
Timeout: 20m
Tokens: 150000

---

### Task 7: Evidence doc and README

**Files:**
- Create: `docs/evidence/2026-10-22-prompt-coach-done-when.md`
- Modify: `prompt-coach/README.md`

**Interfaces:**
- Consumes: outputs of `node tests/done_when.js`, the README test block, and `research/2026-10-22-done-when-c1.txt` from Task 6.

- [ ] **Step 1:** Run the whole README test block fresh and capture each result line (build, pagetest, eval, simulate, customer_check, rewrite_unit, done_when). These are the C5 numbers; quote only what you just measured.
- [ ] **Step 2:** Write the evidence doc: a table of C1, C2, C4, C5 (today, bar, measured now, pass or miss), each marked "measured now" or "read"; C3 listed as "not run: needs the sandbox session (see After the driver)"; the yardstick mapping listed as not done. State the test-set caveat (strong-30 and weak-12 are drafts until Ian confirms). List the expected test changes made in Task 3 by file and what each now asserts.
- [ ] **Step 3:** Update the README: test block final form (includes `done_when.js` and the validator), a short "Done when" section (what "No changes needed" means, the questions list, "ready to paste"), the `Still open` list (C3, yardstick page, label confirmation), and every count or size that changed (`wc -c < dist/prompt-coach.html`).
- [ ] **Step 4:** Check the doc against the README for the same numbers; commit.

Check: `grep -c 'C3' docs/evidence/2026-10-22-prompt-coach-done-when.md && grep -q 'done_when.js' prompt-coach/README.md && grep -q "$(wc -c < prompt-coach/dist/prompt-coach.html)" prompt-coach/README.md && echo EVIDENCE-OK`
Expect: EVIDENCE-OK
Depends: 6
Timeout: 15m
Tokens: 80000

---

## Groups and tuning

- Group A (no data wait): Tasks 1, 3, 4, 5 run in order. Task 2 is independent of them and waits on Ian only for Tasks 6 and C3.
- Task 5 is the one tune task (it moves one number, C2, by choosing the `sure` cut-offs out of fold on training data); run it under the tune-loop skill, one metric, held-out sets read only to measure.
- Locked files (no edits beyond those named): `prompt-coach/data/test.jsonl`, `prompt-coach/data/sim_customers.jsonl`, `prompt-coach/data/done_when_strong.jsonl` once Ian confirms, `prompt-coach/engine/rules.js`, `prompt-coach/engine/classify.js`, `prompt-coach/engine/cls-weights.json`, `prompt-coach/tests/eval.js`, `prompt-coach/tests/simulate.js`.

## Token estimates (helper tokens, my estimate, not measured)

Task 1: 120k. Task 2: 150k. Task 3: 300k. Task 4: 300k. Task 5: 400k. Task 6: 150k. Task 7: 80k. Run total: about 1.5M helper tokens.

## Paid calls

None. $0.

## Expected breaks

- blank-only-C: strong output has other than exactly 1 blank | fixed by Task 3
- blankMore: blanks above baseline (tests/customer_check.js) | fixed by Task 3
- context: only Context missing means exactly one blank* | fixed by Task 3
- other intents keep the destination wording or its one-blank fallback* | fixed by Task 3

Note on titles: the first two are `tests/customer_check.js` failure buckets, not `node --test` titles; the other two are `tests/rewrite_unit.test.js` titles. The worker finds the other four blank or placeholder lines in that file (spec says six in total) and edits only those; the exact titles are read from the file at execution time.

## After the driver

Not tasks; they need a `--chrome` session after Ian confirms Task 2.

1. Yardstick page: open https://support.workiva.com/hc/en-us/articles/19173586555412 in Ian's browser, save the text verbatim to `prompt-coach/research/2026-10-22-workiva-tips.md`, map each README rewrite rule to a line of the page or of SCOPE, and list any conflict for Ian (do not change silently).
2. C3 sandbox run: weak-12 in the Workiva AI sandbox (https://sandbox.wdesk.com/ only), improved prompt pasted as-is, 2 runs each (24), the original prompt 2 runs each beside it, scored by `research/live-tests/SCORING_RULES.md` with a second-provider scorer. Bars: at least 22 of 24 intended answer in the requested format; 0 of 24 invent a fact; keyed findings found at least the original's. One browser driver at a time.
3. Merge: backup branch, full suite, final review, per the merge rule.
