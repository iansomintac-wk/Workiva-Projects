# Prompt coach: known-limits sweep for the `unsupported` note Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits/prompt-coach" && node --test --test-reporter=tap tests/rewrite_unit.test.js; node tests/simulate.js data/train_*.jsonl; node tests/customer_check.js; node tests/eval.js rulefeat data/test.jsonl
Data: (none)
helperToolCallCap: 30 (per helper)

**Goal:** The `unsupported` note (the attached file cannot support the ask) misses or false-fires less on the items parked after the T3/T6 run (C2, C4, S3, C5, S6, H4, plus one optional grounding flag), with no regression and no overfit.

**Architecture:** Small, local edits in `prompt-coach/engine/rewrite.js` only: the `FORECAST_ASK` / `FORECAST_BASIS` / `CAT_RE` / `yearForms` block and `cannotSupport()` (about lines 407-449), and the grounding block inside `coach()` (about lines 598-602). Notes stay additive; grades, weights, classifier, other notes and rewrite text are untouched. Each task appends two unit tests (a red-first test and a near-miss guard that passes on the parent and must stay quiet).

**Tech Stack:** Plain Node (CommonJS), `node:test` (tap reporter), bash check scripts in the git-ignored ledger. No new dependency.

**Spec:** the run prompt `docs/PROMPT_COACH_KNOWN_LIMITS_RUN_PROMPT.txt` (ORDER step 5) and the "Known limits / parked follow-ups" section of `docs/evidence/2026-10-19-prompt-coach-file-cannot-support.md`; patterns reused from `docs/superpowers/plans/2026-10-19-prompt-coach-file-cannot-support.md`. Research (done, no change): `docs/research/2026-10-19-scope3-names-e1-8.md` found Scope 3 names 1-15 match `CAT_NAME`. Plan reviews folded in: `.ledger/2026-10-19-prompt-coach-known-limits/reviews/plan-opus.md` and `plan-codex.md`.

## Global Constraints

- Paths (written out in every check line so each runs alone): worktree `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits`; project `.../prompt-coach-known-limits/prompt-coach`; ledger `.../prompt-coach-known-limits/.ledger/2026-10-19-prompt-coach-known-limits` (git-ignored); CHK = `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits/.ledger/2026-10-19-prompt-coach-known-limits/scripts/chk.sh`. Old ledger (script source, Task 0 only): `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-file-cannot-support/.ledger/2026-10-19-prompt-coach-file-cannot-support`. In the text below `<WT>` = the worktree path, `<L>` = the ledger path, `<CHK>` = the CHK path; **in a check line they are written out in full.**
- Every check line is `bash -c 'set -o pipefail; bash "<CHK>" ...'` (written out); the script does its own `cd` and exits non-zero on any wrong number. Run with the Bash tool.
- TUNING RULE: patterns are tuned only on `train_*` rows of `prompt-coach/research/2026-10-19-cannot-support-labels.tsv` (via the train guard test and `chk.sh dump`) and on the fixtures. NEVER open `<L>/heldout_sealed.json` or any `heldout_fires.tsv`. The lead scores the sealed set exactly ONCE, after the last kept build task (Task 6, or Task 7 if kept), and nobody tunes after it.
- NO-GOS: grades, weights, classifier, any other note, any other rewrite text; installs; live Workiva AI; Codex's "Compare forecast Q4 revenue with Q3 actuals" warning (do not change it; do not pin it in a test).
- Must stay green after every task (header, measured on d7dde04 by the T3/T6 run; Task 0 re-measures): unit 53/0 + new tests; Strong with no files byte-identical on all 1,841 stored prompts; simulate 2070 / strongNotStrong 2 / betterWeak 5 / badText 2; customer_check PASS 229; eval acc 0.856, flips 8; dist rebuilt with the README byte count in the same commit (Task 8).
- Locked (do not edit): every existing test in `tests/rewrite_unit.test.js` (append only), `tests/eval.js`, `tests/simulate.js`, `tests/customer_check.js`, `tests/pagetest.js`, `tests/filetest.js`, `engine/weights.json`, `engine/cls-weights.json`, `engine/rules.js`, `engine/model.js`, `engine/classify.js`, `engine/files.js`, `web/template.html`, `data/`, `research/2026-10-19-cannot-support-labels.tsv`, everything under `<L>` except the files Task 0 creates (`scripts/chk.sh`, the copied `dump_runs.js`, `cmp_fixture.js`, `file_probe.js`, `tricky_prompts.json`) and the logs the checks write; `<L>/heldout_sealed.json`, `<L>/scripts/sealed_run.js`, `<L>/reviews/`.
- Plain English in note texts; no new note text is needed.
- A fixture or suite difference that a task did not intend is a stop: report it to the lead, do not edit `cmp_fixture.js` or the baseline logs.
- Docs change in the same commit as the code they describe. No push. `tests/pagetest.js` and `tests/filetest.js`: report "not run".
- Every commit message ends with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01JpMZoiN6vkphQyeBBQcoWt`.
- Regex behaviour was reasoned, not run (no probe was possible in the planning role): "assumed" until each red/green check shows it.

## Baselines

Measured by the planner: `node --test tests/rewrite_unit.test.js` at 20e024b gives tests 53, pass 53, fail 0. Read only (Task 0 measures): simulate 2070/2/5/2, customer_check PASS 229, eval acc 0.856 flips 8, 1,841 stored prompts. Measured by the Opus reviewer: README line 9 says 334009 bytes and `git show HEAD:prompt-coach/dist/prompt-coach.html | wc -c` gives 334009 (my `wc -c` on the CRLF checkout showed 335741; use the blob or the CR-stripped count).

## Groups, tuning, cost

- Group A (strictly sequential, all edit `engine/rewrite.js` and append to the test file): Task 0, then 1 -> 2 -> 3 -> 4 -> 5 -> 6, then OPTIONAL 7 (cut first), then Task 8 (needs the kept tasks), then Task 9.
- TUNE tasks (`tune-loop`): Tasks 1, 2, 6. TUNE BRIEF: the one number is train-row fires from the train guard test and `chk.sh dump <name>` (`trainFires`, target 0), red test passing, guard test passing. At most 2 pattern edits per tuning task beyond the code shown; only train rows or fixtures may drive an edit. Tasks 3, 4, 5, 7 are deterministic (a miss goes back to the lead).
- Lead step (not a task): after the last kept build task the lead runs `<L>/scripts/sealed_run.js` once, appends the result to `<L>/progress.md` and adds it to the evidence (Task 9). No intermediate scoring.
- Paid calls: none.

| Task | Item | Optional | Helpers | Token estimate |
|---|---|---|---|---|
| 0 | Scripts and baseline | no | 1 | 20k |
| 1 | C2 "Forecast product revenue" | no | 1 | 45k |
| 2 | C4 incidental category words | no | 1 | 50k |
| 3 | S3 "LE" as forecast basis | no | 1 | 30k |
| 4 | C5 "Q1 FY25" compound | no | 1 | 30k |
| 5 | S6 "Upstream T&D" | no | 1 | 30k |
| 6 | H4 stock/share price + future cue | no | 1 | 50k |
| 7 | "Summarize Scope" grounding flag | OPTIONAL | 1 | 30k |
| 8 | README and dist | no | 1 | 35k |
| 9 | Evidence doc | no | 1 | 20k |

Required total (0-6, 8, 9): 310k, 9 helpers. With Task 7: 340k, 10 helpers.

## Parked (not built)

By the lead's scope change after review: the SOX ITGC grounding flag (R8: an all-capital phrase filter would also silence "APAC EMEA" style terms missing from the file; needs an explicit framework list) and the SUS-1 output-column grounding flag (R9: a colon-span filter would also drop real source-column references and misses colon-free forms; needs explicit output-schema wording). Both stay as known limits in the README and evidence.

---

### Task 0: Scripts and baseline (no code change)

**Files:**
- Create (ledger, git-ignored): `<L>/scripts/chk.sh`; copies of `dump_runs.js`, `cmp_fixture.js`, `file_probe.js`, `tricky_prompts.json` from the old ledger `scripts/`
- Create (ledger output): `<L>/logs/b_sim.log`, `b_cust.log`, `b_eval.log`, `<L>/logs/base/strong_nofiles.txt`, `train_fires.tsv`, `heldout_fires.tsv` (lead-only), `fixture_runs.json`

**Interfaces:**
- Produces: `chk.sh unit <pass> <fail> | baseline | dump <name> | strong <name> | fixtures same <name> | suite | dist <fixed-string> <min-count>`; `<L>/logs/base/` as the parent reference.

- [ ] **Step 1: Copy the scripts** and assert no old-name reference is left (exit 0 on success): `bash -c 'set -o pipefail; O="C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-file-cannot-support/.ledger/2026-10-19-prompt-coach-file-cannot-support/scripts"; N="C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits/.ledger/2026-10-19-prompt-coach-known-limits/scripts"; mkdir -p "$N" "$N/../logs/base" && for f in dump_runs.js cmp_fixture.js file_probe.js tricky_prompts.json; do cp "$O/$f" "$N/$f"; done && sed -i "s#prompt-coach-file-cannot-support#prompt-coach-known-limits#g" "$N/dump_runs.js" "$N/cmp_fixture.js" "$N/file_probe.js" && ! grep -q "file-cannot-support" "$N/dump_runs.js" "$N/cmp_fixture.js" "$N/file_probe.js" && test -s "$N/tricky_prompts.json" && echo COPY_OK'`. Expected: `COPY_OK` and exit 0.

- [ ] **Step 2: Write `<L>/scripts/chk.sh`:**

```bash
#!/usr/bin/env bash
# chk.sh unit <pass> <fail> | baseline | dump <name> | strong <name> | fixtures same <name> | suite | dist <fixed-string> <min-count>
set -o pipefail
W="C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits"; P="$W/prompt-coach"; L="$W/.ledger/2026-10-19-prompt-coach-known-limits"
mkdir -p "$L/logs/base"; cd "$P" || exit 2
case "$1" in
  unit)
    out=$(node --test --test-reporter=tap tests/rewrite_unit.test.js 2>&1)
    p=$(printf '%s\n' "$out" | sed -n 's/^# pass //p'); f=$(printf '%s\n' "$out" | sed -n 's/^# fail //p')
    if [ "$p" = "$2" ] && [ "$f" = "$3" ]; then echo "UNIT_OK pass=$p fail=$f"; else echo "UNIT_BAD pass=$p fail=$f wanted $2/$3"; printf '%s\n' "$out" | grep -E '^not ok' | head -10; exit 1; fi ;;
  baseline)
    rc=0
    node tests/simulate.js data/train_*.jsonl > "$L/logs/b_sim.log" 2>&1 || { echo "simulate exit non-zero"; rc=1; }
    node tests/customer_check.js > "$L/logs/b_cust.log" 2>&1 || { echo "customer_check exit non-zero"; rc=1; }
    node tests/eval.js rulefeat data/test.jsonl > "$L/logs/b_eval.log" 2>&1 || { echo "eval exit non-zero"; rc=1; }
    grep -E "runs|strongNotStrong|betterWeak|badText" "$L/logs/b_sim.log" | head -4; tail -n 2 "$L/logs/b_cust.log"; grep -E "acc=|flips" "$L/logs/b_eval.log" | head -3
    grep -Eq "runs=2070\b" "$L/logs/b_sim.log" && grep -Eq "strongNotStrong +2\b" "$L/logs/b_sim.log" && grep -Eq "betterWeak +5\b" "$L/logs/b_sim.log" && grep -Eq "badText +2\b" "$L/logs/b_sim.log" || { echo "simulate counters differ from 2070/2/5/2"; rc=1; }
    grep -Eq "PASS 229 runs" "$L/logs/b_cust.log" || { echo "customer_check is not exactly PASS 229"; rc=1; }
    grep -q "acc=0.856" "$L/logs/b_eval.log" && grep -Eq "flips=8\b" "$L/logs/b_eval.log" || { echo "eval differs from acc 0.856 flips 8"; rc=1; }
    if [ $rc = 0 ]; then echo BASELINE_OK; else echo BASELINE_BAD; exit 1; fi ;;
  dump)     node "$L/scripts/dump_runs.js" "$P" "$L/logs/$2" ;;
  strong)   if cmp -s "$L/logs/base/strong_nofiles.txt" "$L/logs/$2/strong_nofiles.txt"; then echo STRONG_NOFILES_IDENTICAL; else echo STRONG_NOFILES_DIFFER; exit 1; fi ;;
  fixtures) node "$L/scripts/file_probe.js" "$P" "$L/logs/$3" > /dev/null && node "$L/scripts/cmp_fixture.js" "$L/logs/base/fixture_runs.json" "$L/logs/$3/fixture_runs.json" "$2" ;;
  suite)
    rc=0
    node tests/simulate.js data/train_*.jsonl > "$L/logs/a_sim.log" 2>&1; if cmp -s "$L/logs/b_sim.log" "$L/logs/a_sim.log"; then echo SIM_IDENTICAL; else echo SIM_DIFF; rc=1; fi
    node tests/customer_check.js > "$L/logs/a_cust.log" 2>&1; if cmp -s "$L/logs/b_cust.log" "$L/logs/a_cust.log"; then echo CUST_IDENTICAL; else echo CUST_DIFF; rc=1; fi
    node tests/eval.js rulefeat data/test.jsonl > "$L/logs/a_eval.log" 2>&1; if cmp -s "$L/logs/b_eval.log" "$L/logs/a_eval.log"; then echo EVAL_IDENTICAL; else echo EVAL_DIFF; rc=1; fi
    exit $rc ;;
  dist)
    n=$(grep -c -F "$2" dist/prompt-coach.html)
    echo "dist '$2' lines=$n LF_bytes=$(tr -d '\r' < dist/prompt-coach.html | wc -c)"
    if [ "$n" -ge "$3" ]; then echo DIST_OK; else echo "DIST_BAD wanted >= $3"; exit 1; fi ;;
  *) echo "unknown $1"; exit 2 ;;
esac
```

(The `baseline` patterns match the old log formats the Opus reviewer measured: `runs=2070`, `strongNotStrong  2`, `PASS 229 runs`, `GRADE acc=0.856  weak<->strong flips=8`. If `BASELINE_BAD` shows the right numbers, fix only the grep pattern in this ledger script.)

- [ ] **Step 3: Baseline unit run.** `bash -c 'set -o pipefail; bash "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits/.ledger/2026-10-19-prompt-coach-known-limits/scripts/chk.sh" unit 53 0'`. Expected: `UNIT_OK pass=53 fail=0`.

- [ ] **Step 4: Baseline logs.** Same CHK, argument `baseline`. Expected: the 2070 / 2 / 5 / 2 counters, `PASS 229 runs`, `acc=0.856`, `flips=8`, then `BASELINE_OK`.

- [ ] **Step 5: Baseline dump and fixtures.** Same CHK: `dump base` then `fixtures same base`. Expected: `DUMP total=1841 trainFires=0 trainForecast=0 trainCategory=0` and `FIXTURES_OK same (19)`. Any other number is a stop for the lead. Do not open `<L>/logs/base/heldout_fires.tsv`.

- [ ] **Step 6: Measure the dist bytes.** `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && git show HEAD:prompt-coach/dist/prompt-coach.html | wc -c; git status --short | head -5'`. Expected: `334009` (matches README line 9) and a status with no tracked changes. No commit in this task.

---

### Task 1: C2 "Forecast product revenue using this file" (TUNE)

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`FORECAST_ASK`, about line 410)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)

**Interfaces:**
- Consumes: test helpers already in the file: `run`, `sheetOf(sheet, body)`, `unsupported(o)`.
- Produces: `FORECAST_ASK` also matches "forecast" + up to two plain words + a money noun.

- [ ] **Step 1: Append the tests:**

```js
// ---- known-limits sweep (2026-10-19) ----
test('unsupported: "Forecast product revenue using this file" against historical-only text fires (C2b)', () => {
  const h = sheetOf('Actuals', 'Account, Q1, Q2\nRevenue, 100, 120');
  assert.equal(unsupported(run('Forecast product revenue using this file', [h])).length, 1);
  assert.equal(unsupported(run('Forecast Q4 EMEA product revenue from this file', [h])).length, 1);
});
test('unsupported: a forecast noun phrase about the file stays quiet (C2b near misses)', () => {
  const h = sheetOf('Actuals', 'Account, Q1, Q2\nRevenue, 100, 120');
  for (const p of ['Summarize the forecast table revenue on this slide', 'Explain the forecast variance revenue in this file', 'Compare product revenue between Q1 and Q2 in this file', 'Compare forecast against actual revenue in this file'])
    assert.equal(unsupported(run(p, [h])).length, 0, p);
  const plan = sheetOf('Plan', 'Account, FY26 forecast\nRevenue, 130');
  assert.equal(unsupported(run('Forecast product revenue using this file', [plan])).length, 0, 'file has a forecast');
  assert.equal(unsupported(run('Forecast revenue using this file', [h])).length, 1, 'the old case still fires');
});
```

- [ ] **Step 2: Red check.** `bash -c 'set -o pipefail; bash "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits/.ledger/2026-10-19-prompt-coach-known-limits/scripts/chk.sh" unit 54 1'`. Expected: `UNIT_OK pass=54 fail=1` (55 tests; only the first new test fails on the parent).

- [ ] **Step 3: Implement.** In the `FORECAST_ASK` regex literal insert this alternative immediately before the alternative that begins `(?:give|make|produce|build|create|run|need|want)` (keep the `|`):

```
forecast(?:ing)?\s+(?:(?:Q[1-4]|(?:FY|CY)\s?'?\d{2,4}|(?:19|20)\d{2}|next|the|this|our|my|each|every|full[- ]year|annual|quarterly|monthly)\s+)*(?:(?!(?:tables?|tabs?|sheets?|slides?|files?|columns?|rows?|variance|accuracy|errors?|bias|process|cycle|review|meeting|owners?|deck|model|template|assumptions?|is|are|was|were|has|have|shows?|in|on|of|from|and|or|vs|versus|to|with|by|for|against|than|at|actuals?)\b)[a-z][\w&-]*\s+){1,2}(?:revenue|sales|earnings|income|costs?|expenses?|demand|cash|margins?|growth|spend|profit|ebitda)\b|
```

- [ ] **Step 4: Green check.** Same CHK `unit 55 0`. Expected: `UNIT_OK pass=55 fail=0`. If the train guard names a fired row, apply the TUNE BRIEF (extend the excluded-word list; never relax the guard).

- [ ] **Step 5: Paired dump, Strong, fixtures.** `bash -c 'set -o pipefail; bash "<CHK written out>" dump a1 && bash "<CHK>" strong a1 && bash "<CHK>" fixtures same a1'`. Expected: `DUMP total=1841 trainFires=0 trainForecast=0 trainCategory=0`, `STRONG_NOFILES_IDENTICAL`, `FIXTURES_OK same (19)`.

- [ ] **Step 6: Suite.** Same CHK `suite`. Expected: `SIM_IDENTICAL`, `CUST_IDENTICAL`, `EVAL_IDENTICAL`.

- [ ] **Step 7: Commit.** `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach known limits C2: forecast + product word + money noun is a forecast ask"` (+ attribution lines).

(From here every check line is written the same way: `bash -c 'set -o pipefail; bash "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits/.ledger/2026-10-19-prompt-coach-known-limits/scripts/chk.sh" <args>'`, with `&&` between several CHK calls, each repeating the full path. "Same CHK" above and below means exactly that.)

---

### Task 2: C4 incidental category words are not a category list (TUNE)

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (new `rowLabelCats` above `cannotSupport`; `cannotSupport` row text and gate)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)

**Interfaces:**
- Consumes: `CAT_RE`, `categoryHit` (existing); the Word file shape from `engine/files.js`: `text` is flattened to one line (whitespace collapsed) and `lines` holds the real paragraphs and table rows (`cells.join(', ')`).
- Produces: module-private `rowLabelCats(rowsText)` returning the number of categories 1-15 listed as the label of a row (a label that names two or more categories counts for none).

- [ ] **Step 1: Append the tests:**

```js
test('unsupported: category words inside a note sentence are not a category list (C4b)', () => {
  const f = sheetOf('Scope 3 notes', 'Scope 3 notes: Business travel and Investments are covered in the appendix.\nPrepared by, Finance');
  assert.equal(unsupported(run(askCat(11), [f])).length, 0);
  const g = sheetOf('Scope 3 notes', 'Business travel and Investments, both covered in the appendix\nPrepared by, Finance');
  assert.equal(unsupported(run(askCat(11), [g])).length, 0, 'one label naming two categories is not two rows');
  const w = { name: 'n.docx', kind: 'Word', text: 'Scope 3 notes Business travel and Investments are covered in the appendix.', lines: ['Scope 3 notes', 'Business travel and Investments are covered in the appendix.'], periods: [] };
  assert.equal(unsupported(run(askCat(11), [w])).length, 0, 'Word paragraph');
});
test('unsupported: real category rows (comma, tab, long numbered labels, Word table rows) still make a list (C4b guard)', () => {
  assert.equal(unsupported(run(T6, [fx('sus_ghg_inventory.xlsx')])).length, 1);
  assert.equal(unsupported(run(askCat(11), [mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nBusiness travel, 80')])).length, 1);
  assert.equal(unsupported(run(askCat(11), [mk('s3.xlsx', 'Scope 3', 'Business travel\t310\nEmployee commuting\t20')])).length, 1);
  assert.equal(unsupported(run(askCat(6), [mk('s3.xlsx', 'Scope 3', 'Business travel\t310\nEmployee commuting\t20')])).length, 0, 'category 6 is listed');
  assert.equal(unsupported(run(askCat(11), [mk('s3.xlsx', 'Scope 3', 'Category 4 - Upstream transportation and distribution, 150\nCategory 12 - End-of-life treatment of sold products, 20')])).length, 1, 'long labels');
  const w = { name: 'n.docx', kind: 'Word', text: 'Scope 3 Purchased goods, 5200 Business travel, 80', lines: ['Scope 3', 'Purchased goods, 5200', 'Business travel, 80'], periods: [] };
  assert.equal(unsupported(run(askCat(11), [w])).length, 1, 'Word table as files.js reads it');
  const flat = { name: 'n.pdf', kind: 'PDF', text: 'Scope 3 categories Purchased goods Business travel', periods: [] };
  assert.equal(unsupported(run(askCat(11), [flat])).length, 1, 'flattened document text keeps the old rule');
});
```

- [ ] **Step 2: Red check.** Same CHK `unit 56 1`. Expected: `UNIT_OK pass=56 fail=1` (57 tests; only the first new test fails on the parent; the guard passes on the parent).

- [ ] **Step 3: Implement.** Add above `function cannotSupport`:

```js
  // Categories 1-15 listed as a row label: the cell before the first comma, tab or colon of a line (up to 90 characters). A label that names two or more categories ("Business travel and Investments, ...") is a sentence, and counts for none.
  function rowLabelCats(rowsText) {
    const labels = rowsText.split('\n').map((l) => { const m = /^[ \t]*([^,\t:]{1,90})[,\t:]/.exec(l); return m ? m[1].trim() : ''; }).filter(Boolean);
    const hits = new Set();
    for (const lb of labels) {
      const got = [];
      for (let n = 1; n <= 15; n++) if (CAT_RE[n].test(lb + ',') || new RegExp('^(?:(?:category|cat\\.?)\\s*)?' + n + '(?:\\b|$)').test(lb)) got.push(n);
      if (got.length === 1) hits.add(got[0]);
    }
    return hits.size;
  }
```

  In `cannotSupport`, after the `const lower = ...` line add:

```js
    // Word keeps its real paragraphs and table rows in f.lines (text is one flattened line); spreadsheets keep rows as lines of text. Flattened text with no line breaks (PDF, slides, old Word shapes) cannot show rows, so it keeps the old rule (2 names anywhere).
    const rowsText = files.map((f) => (f.lines ? f.lines.join('\n') : f.text || '')).join('\n').toLowerCase();
    const flat = files.some((f) => !f.lines && f.kind !== 'Excel' && (f.text || '').trim() && !/\n/.test(f.text));
```

  and replace the line `if (exact + (generic ? 1 : 0) < 2) return null; // ...` with:

```js
    const listed = rowLabelCats(rowsText) + (generic ? 1 : 0);
    if (!(listed >= 2 || exact >= 3 || (flat && exact + (generic ? 1 : 0) >= 2))) return null; // a list needs 2 row labels (a plain "leased assets" row counts once), or 3 names anywhere
```

- [ ] **Step 4: Green check.** Same CHK `unit 57 0`. Expected: `UNIT_OK pass=57 fail=0` (existing C1, C2 leased, C4 tests stay green).

- [ ] **Step 5: Paired dump, Strong, fixtures.** Same CHK: `dump a2`, `strong a2`, `fixtures same a2`. Expected: `DUMP ... trainFires=0 ...`, `STRONG_NOFILES_IDENTICAL`, `FIXTURES_OK same (19)` (T6 must still fire; this task only removes fires).

- [ ] **Step 6: Suite.** Same CHK `suite`. Expected: three `*_IDENTICAL` lines.

- [ ] **Step 7: Commit.** `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach known limits C4: a category list needs row labels, not words in a note"` (+ attribution lines). Known limits for the evidence: three or more category names in one note still count; a wide layout whose only categories are column headers (no row labels) is now quiet where the parent fired.

---

### Task 3: S3 "LE" (latest estimate) is a forecast basis

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (new `LE_BASIS` after `FORECAST_BASIS`; the forecast gate line)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)

**Interfaces:**
- Produces: module-private `LE_BASIS` (case-sensitive standalone token `LE`).

- [ ] **Step 1: Append the tests:**

```js
test('unsupported: an LE (latest estimate) column or "FY26 LE" header counts as a forecast basis (S3b)', () => {
  for (const body of ['Account, Actual, LE\nRevenue, 100, 105, 110', 'Account, FY25 Actual, FY26 LE\nRevenue, 100, 130'])
    assert.equal(unsupported(run('Predict next quarter revenue from this', [sheetOf('Model', body)])).length, 0, body);
});
test('unsupported: words that only contain "le" are no forecast basis (S3b guard)', () => {
  for (const body of ['Account, Role\nRevenue, 100', 'Account, Sample, Table\nRevenue, 1', 'Account, le monde\nRevenue, 1', 'Account, Legal Entity\nRevenue, 1'])
    assert.equal(unsupported(run('Predict next quarter revenue from this', [sheetOf('Model', body)])).length, 1, body);
});
```

- [ ] **Step 2: Red check.** Same CHK `unit 58 1`. Expected: `UNIT_OK pass=58 fail=1` (59 tests).

- [ ] **Step 3: Implement.** After the `FORECAST_BASIS` line add `const LE_BASIS = /(?:^|[\s,;(|])LE(?=$|[\s,;)|:])/m; // "LE" = latest estimate; case-sensitive standalone token, so "le", "Role" and "Legal Entity" do not count (a column headed with the abbreviation LE, for example a legal-entity code, would also silence the note: the safe direction)`. Change `if (FORECAST_ASK.test(prompt) && !FORECAST_BASIS.test(text)) return { kind: 'forecast' };` to `if (FORECAST_ASK.test(prompt) && !FORECAST_BASIS.test(text) && !LE_BASIS.test(text)) return { kind: 'forecast' };`.

- [ ] **Step 4: Green check.** Same CHK `unit 59 0`. Expected: `UNIT_OK pass=59 fail=0`.

- [ ] **Step 5: Paired dump, Strong, fixtures.** Same CHK: `dump a3`, `strong a3`, `fixtures same a3`. Expected: `trainFires=0`, `STRONG_NOFILES_IDENTICAL`, `FIXTURES_OK same (19)`.

- [ ] **Step 6: Suite.** Same CHK `suite`. Expected: three `*_IDENTICAL`.

- [ ] **Step 7: Commit.** `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach known limits S3: LE counts as a forecast basis"` (+ attribution lines).

---

### Task 4: C5 "Q1 FY25" compound term in the grounding note

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`yearForms`)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)

**Interfaces:**
- Consumes: `yearForms(term)`; the grounding `terms` regex joins only `Q[1-4]\s?FY` compounds, so only "Q1 FY25" / "Q1FY25" arrive here (CY compounds arrive as two terms and are out of scope: the CY branch of the regex is deliberately FY-only).
- Produces: `yearForms("Q1 FY25")` returns adjacent spellings: `Q1 FY2025`, `Q1FY25`, `FY2025 Q1`, `FY25-Q1` and the like. Decision (S3 review): the bare calendar year forms `Q1 2025` / `2025 Q1` are NOT accepted for a fiscal "Q1 FY25" (a fiscal year need not be the calendar year), consistent with plain "FY25" vs "2025" staying flagged.

- [ ] **Step 1: Append the tests:**

```js
test('grounding: "Q1 FY25" counts as present when the file says "FY2025 Q1" or "Q1 FY2025" (C5b)', () => {
  const g = (o) => o.notes.filter((n) => n.kind === 'grounding').map((n) => n.text).join(' ');
  const ask = 'Using only @f.xlsx, summarise Q1 FY25 revenue in a table with each source row. Do not guess.';
  assert.ok(!/Q1 FY25/.test(g(run(ask, [sheetOf('Rev', 'Account, FY2025 Q1, FY2025 Q2\nRevenue, 1, 2')]))));
  assert.ok(!/Q1 FY25/.test(g(run(ask, [sheetOf('Rev', 'Account, Q1 FY2025\nRevenue, 1')]))));
});
test('grounding: a different quarter or year, or a bare calendar year, is still flagged for "Q1 FY25" (C5b guard)', () => {
  const g = (o) => o.notes.filter((n) => n.kind === 'grounding').map((n) => n.text).join(' ');
  const ask = 'Using only @f.xlsx, summarise Q1 FY25 revenue in a table with each source row. Do not guess.';
  for (const body of ['Account, FY2025 Q2\nRevenue, 1', 'Account, FY2024 Q1\nRevenue, 1', 'Account, Q1 2025\nRevenue, 1', 'Account, Q1, FY2025 total\nRevenue, 1'])
    assert.match(g(run(ask, [sheetOf('Rev', body)])), /Q1 FY25/, body);
  assert.ok(!/Q1 FY25/.test(g(run(ask, [sheetOf('Rev', 'Account, Q1 FY25\nRevenue, 1')]))), 'literal match still passes');
});
```

  (Check-note: the "Q1, FY2025 total" case is flagged because the forms must be adjacent; the executor confirms this on the red/green run. If the existing "Q1" term handling makes any body above behave differently, stop and report to the lead.)

- [ ] **Step 2: Red check.** Same CHK `unit 60 1`. Expected: `UNIT_OK pass=60 fail=1` (61 tests; the first new test fails on the parent, the guard passes on the parent).

- [ ] **Step 3: Implement.** At the top of `function yearForms(term)` (before the existing `const m = ...`) insert:

```js
    const q = /^(Q[1-4])\s?(FY)\s?'?(\d{2}|\d{4})$/i.exec(term);
    if (q) { // fiscal compound only: adjacent forms in either order; a bare calendar year (Q1 2025) is not accepted for a fiscal year
      const out = [];
      for (const y of yearForms(q[2] + q[3])) out.push(q[1] + ' ' + y, q[1] + y, y + ' ' + q[1], y + q[1], q[1] + '-' + y, y + '-' + q[1]);
      return out;
    }
```

- [ ] **Step 4: Green check.** Same CHK `unit 61 0`. Expected: `UNIT_OK pass=61 fail=0` (the S4 FY2020 test and the FY25/FY2025 test stay green).

- [ ] **Step 5: Paired dump, Strong, fixtures.** Same CHK: `dump a4`, `strong a4`, `fixtures same a4`. Expected: `trainFires=0`, `STRONG_NOFILES_IDENTICAL`, `FIXTURES_OK same (19)` (the Opus review measured no fixture note quoting a "Q1 FY" compound; any difference is a stop for the lead).

- [ ] **Step 6: Suite.** Same CHK `suite`. Expected: three `*_IDENTICAL`.

- [ ] **Step 7: Commit.** `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach known limits C5: Q1 FY25 matches FY2025 Q1 in the grounding note"` (+ attribution lines).

---

### Task 5: S6 "Upstream T&D" category name

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`CAT_RE` entries 4 and 9)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)

**Interfaces:**
- Produces: `CAT_RE[4]` and `CAT_RE[9]` also match `upstream t&d` / `downstream t&d` (also `t & d`, `t and d`).

- [ ] **Step 1: Append the tests** (both aliases are in the red test; the guard holds only on the parent too):

```js
test('unsupported: a row "Upstream T&D" or "Downstream T&D" lists category 4 or 9, so asking for it does not fire (S6b)', () => {
  const up = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nUpstream T&D, 150\nBusiness travel, 80');
  assert.equal(unsupported(run(askCat(4), [up])).length, 0);
  const down = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nDownstream T&D, 70\nBusiness travel, 80');
  assert.equal(unsupported(run(askCat(9), [down])).length, 0);
});
test('unsupported: Upstream T&D is not Downstream T&D, and a truly missing category still fires (S6b guard)', () => {
  const up = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nUpstream T&D, 150\nBusiness travel, 80');
  assert.equal(unsupported(run(askCat(9), [up])).length, 1, 'only upstream is listed');
  const down = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nDownstream T&D, 70\nBusiness travel, 80');
  assert.equal(unsupported(run(askCat(4), [down])).length, 1, 'downstream is not upstream');
  assert.equal(unsupported(run(askCat(11), [up])).length, 1);
});
```

- [ ] **Step 2: Red check.** Same CHK `unit 62 1`. Expected: `UNIT_OK pass=62 fail=1` (63 tests; on the parent the red test fails and the guard passes: parent `CAT_RE[4]` and `[9]` do not match "T&D", so both guard asks fire exactly as asserted).

- [ ] **Step 3: Implement.** In `CAT_RE` replace `/upstream transport/` with `/upstream (?:transport|t ?& ?d|t and d)/` and `/downstream transport/` with `/downstream (?:transport|t ?& ?d|t and d)/`.

- [ ] **Step 4: Green check.** Same CHK `unit 63 0`. Expected: `UNIT_OK pass=63 fail=0`.

- [ ] **Step 5: Paired dump, Strong, fixtures.** Same CHK: `dump a5`, `strong a5`, `fixtures same a5`. Expected: `trainFires=0`, `STRONG_NOFILES_IDENTICAL`, `FIXTURES_OK same (19)`.

- [ ] **Step 6: Suite.** Same CHK `suite`. Expected: three `*_IDENTICAL`.

- [ ] **Step 7: Commit.** `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach known limits S6: Upstream and Downstream T&D are categories 4 and 9"` (+ attribution lines).

---

### Task 6: H4 stock/share price with a future cue, without bringing back C1 (TUNE)

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (new constants and `stockForward` after `LE_BASIS`; the forecast gate line)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)

**Interfaces:**
- Produces: module-private `stockForward(prompt)`: true when one sentence has stock/share price, a future cue (next quarter/year/month/week/day/FY/Qn, going forward, tomorrow, by year end, by the end of, after the Qn release/results/earnings) and either a move verb (go, goes, going, head(s), heading, move(s), moving) or a predict verb (estimate, forecast, predict, project, guess), and no past or summary cue.

H4's real text (evidence doc, read): "Where will our share price go after the Q3 release?" Added case from the review: "Estimate the share price next quarter".

- [ ] **Step 1: Append the tests:**

```js
test('unsupported: a stock or share price with a future cue is a forecast ask without a will-be/do verb (H4)', () => {
  const px = sheetOf('Prices', 'Date, Stock price\n2025-01-02, 10\n2025-01-03, 11');
  for (const p of ['Estimate where the stock price goes next quarter', 'Where will our share price go after the Q3 release?', 'Estimate the share price next quarter', T3])
    assert.equal(unsupported(run(p, [px])).length, 1, p);
});
test('unsupported: historical or summary stock price asks stay quiet; a forecast in the file silences H4 (H4 guard, C1)', () => {
  const px = sheetOf('Prices', 'Date, Stock price\n2025-01-02, 10\n2025-01-03, 11');
  for (const p of ['Summarize the stock price movements in this file', 'Summarize where the stock price went last quarter and how it moves with next quarter guidance', 'The share price goes into the Q3 report', 'Chart the stock price for the next quarter table', 'Estimate the share price impact of the Q3 release on last quarter costs'])
    assert.equal(unsupported(run(p, [px])).length, 0, p);
  const fc = sheetOf('Plan', 'Date, Stock price forecast\n2025-01-02, 10');
  assert.equal(unsupported(run('Estimate where the stock price goes next quarter', [fc])).length, 0);
});
```

  (Note: the last quiet prompt has a past cue ("last"), so it stays quiet; if the T3 line does not fire on the parent for a reason other than the new rule, nothing changes, T3 already fires.)

- [ ] **Step 2: Red check.** Same CHK `unit 64 1`. Expected: `UNIT_OK pass=64 fail=1` (65 tests; the first new test fails on the parent for the first three prompts; the guard passes on the parent).

- [ ] **Step 3: Implement.** After the `LE_BASIS` line add:

```js
  // H4: a stock or share price with a future cue and a move or predict verb in one sentence, and no past or summary cue ("Summarize the stock price movements" stays quiet: C1).
  const STOCK_PX = /\b(?:stock|share)\s+price\b/i, STOCK_VERB = /\b(?:goes|go|going|heads?|heading|moves?|moving|estimate|forecast|predict|project|guess)\b/i;
  const STOCK_FUTURE = /\b(?:next\s+(?:quarter|year|month|week|day|fy\d{0,4}|q[1-4])|going forward|tomorrow|by (?:year[- ]end|the end of)|after the (?:q[1-4]|quarter|year|earnings)\b[^.?!]{0,20}(?:release|results|earnings|call))\b/i;
  const STOCK_PAST = /\b(?:summari[sz]e|recap|histor\w*|last|past|previous|prior|so far|ytd|was|were|went|moved)\b/i;
  function stockForward(prompt) { return prompt.split(/[.?!]+\s+/).some((s) => STOCK_PX.test(s) && STOCK_VERB.test(s) && STOCK_FUTURE.test(s) && !STOCK_PAST.test(s)); }
```

  and change the forecast gate line (the one that begins `if (FORECAST_ASK.test(prompt)`) to `if ((FORECAST_ASK.test(prompt) || stockForward(prompt)) && !FORECAST_BASIS.test(text) && !LE_BASIS.test(text)) return { kind: 'forecast' };`.

- [ ] **Step 4: Green check.** Same CHK `unit 65 0`. Expected: `UNIT_OK pass=65 fail=0` (the C1 "historical stock price summary" test and the T3 test stay green). If the train guard names a fired row, apply the TUNE BRIEF (tighten `STOCK_VERB` or extend `STOCK_PAST`).

- [ ] **Step 5: Paired dump, Strong, fixtures.** Same CHK: `dump a6`, `strong a6`, `fixtures same a6`. Expected: `trainFires=0`, `STRONG_NOFILES_IDENTICAL`, `FIXTURES_OK same (19)`.

- [ ] **Step 6: Suite.** Same CHK `suite`. Expected: three `*_IDENTICAL`.

- [ ] **Step 7: Commit.** `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach known limits H4: stock or share price with a future cue is a forecast ask"` (+ attribution lines). If Task 7 is cut, the lead runs the sealed set now, once.

---

### Task 7 (OPTIONAL, cut first): "Summarize Scope" grounding flag

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (grounding block in `coach()`, the `terms` line)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)

**Interfaces:**
- Produces: local `tp` = the prompt with a leading imperative verb removed at the start of the prompt or a sentence; the term regex runs on `tp`. The verb list leaves out Total, Sum and List (they begin real terms such as "Total Spend").

- [ ] **Step 1: Append the tests:**

```js
test('grounding: a leading verb is not part of a capitalised term: "Summarize Scope 3" checks "Scope 3" (S7)', () => {
  const g = (o) => o.notes.filter((n) => n.kind === 'grounding').map((n) => n.text).join(' ');
  assert.equal(g(run('Summarize Scope 3 emissions by category', [sheetOf('Scope 3', 'Purchased goods, 5200\nBusiness travel, 80')])), '');
});
test('grounding: other capitalised terms are still flagged when the file lacks them (S7 guard)', () => {
  const g = (o) => o.notes.filter((n) => n.kind === 'grounding').map((n) => n.text).join(' ');
  assert.match(g(run('Compare Net Zero Targets with the plan', [sheetOf('Sheet1', 'Account, Q1\nRevenue, 1')])), /Net Zero Targets/);
  assert.match(g(run('Summarize Scope 3 emissions by category', [sheetOf('Sheet1', 'Account, Q1\nRevenue, 1')])), /Scope 3/);
  assert.match(g(run('Total Spend by vendor, using @f.xlsx and nothing else', [sheetOf('Sheet1', 'Account, Q1\nRevenue, 1')])), /Total Spend/);
});
```

- [ ] **Step 2: Red check.** Same CHK `unit 65 2`. Expected: `UNIT_OK pass=65 fail=2` (67 tests; both new tests fail on the parent: it quotes "Summarize Scope" and flags no "Scope 3").

- [ ] **Step 3: Implement.** Above `const terms = ...` add:

```js
      const tp = prompt.replace(/(^|[.?!]\s+)(?:Summari[sz]e|Show|Compare|Explain|Calculate|Draft|Write|Create|Give|Find|Check|Review|Extract|Pull|Build|Prepare|Identify|Tell|Make|Update|Flag|Rewrite|Reconcile|Compute|Estimate|Forecast|Predict|Analy[sz]e|Break)\s+/g, '$1');
```

  and change `(prompt.match(/\bQ[1-4]\s?FY...` on the `terms` line to `(tp.match(` (same regex, only the receiver changes).

- [ ] **Step 4: Green check.** Same CHK `unit 67 0`. Expected: `UNIT_OK pass=67 fail=0`.

- [ ] **Step 5: Paired dump, Strong, fixtures.** Same CHK: `dump a7`, `strong a7`, `fixtures same a7`. Expected: `trainFires=0`, `STRONG_NOFILES_IDENTICAL`, `FIXTURES_OK same (19)`. A fixture or customer case whose quoted grounding term changes is a stop for the lead: report it, do not edit baselines.

- [ ] **Step 6: Suite.** Same CHK `suite`. Expected: three `*_IDENTICAL`.

- [ ] **Step 7: Commit.** `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach known limits: a leading verb is not part of a grounding term"` (+ attribution lines). Then the lead runs the sealed set once.

---

### Task 8: README and dist, byte count in the same commit

**Files:**
- Modify: `prompt-coach/dist/prompt-coach.html` (generated by `tests/build.js`)
- Modify: `prompt-coach/README.md` (line 9 byte count; the `unsupported` and grounding entries in "Coach notes", about lines 86-100)

**Interfaces:**
- Consumes: the kept tasks' final engine. Unit total after this task: 65 (Tasks 1-6) or 67 (with Task 7).

- [ ] **Step 1: Red check on dist.** `bash -c 'set -o pipefail; bash "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits/.ledger/2026-10-19-prompt-coach-known-limits/scripts/chk.sh" dist "function stockForward" 1'`. Expected: `DIST_BAD wanted >= 1` and a non-zero exit.

- [ ] **Step 2: Rebuild.** `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits/prompt-coach" && node tests/build.js | tail -n 2'`. Expected: it names the written file, no error.

- [ ] **Step 3: Check and note the bytes.** Same dist check as Step 1. Expected: `DIST_OK` and `dist 'function stockForward' lines=1 LF_bytes=<N>`; `<N>` is the CR-stripped byte count the README carries.

- [ ] **Step 4: README.** Read lines 5-12 and 84-100 first. Set line 9 to `<N>`. Describe exactly what changed: forecast asks now also catch "forecast" + up to two plain words + a money noun ("Forecast product revenue"), and a stock or share price with a future cue and a move or predict verb in one sentence with no past or summary cue ("Where will our share price go after the Q3 release?", "Estimate the share price next quarter"); a standalone `LE` token in the file text counts as a forecast basis; a Scope 3 category list needs at least two categories listed as row labels (one label naming two categories counts for none) or three names anywhere, flattened PDF/slide text keeps the old two-name rule, and "Upstream T&D" / "Downstream T&D" are categories 4 and 9; the grounding note treats "Q1 FY25" as present when the file says "FY2025 Q1", "Q1 FY2025" and similar adjacent forms (a bare "Q1 2025" does not count for a fiscal year, in line with FY25 vs 2025; CY compounds are not handled); if Task 7 was kept, a leading verb is not part of a term. Known limits to list: three or more category names in one note still count; a wide layout whose categories are only column headers is now quiet; a column headed with the abbreviation LE (for example a legal-entity code) also silences the forecast note; the SOX ITGC and SUS-1 output-column grounding flags remain (parked); Codex's "Compare forecast Q4 revenue with Q3 actuals" warning is unchanged (Ian's call).

- [ ] **Step 5: Full checks on the built result.** `bash -c 'set -o pipefail; bash "<CHK>" unit 65 0 && bash "<CHK>" suite'` (CHK written out in full; use `unit 67 0` if Task 7 was kept). Expected: `UNIT_OK pass=65 fail=0`, `SIM_IDENTICAL`, `CUST_IDENTICAL`, `EVAL_IDENTICAL`. `tests/pagetest.js` and `tests/filetest.js`: not run.

- [ ] **Step 6: Commit** (dist and README together): `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && git add prompt-coach/dist/prompt-coach.html prompt-coach/README.md && git commit -m "Prompt coach known limits: rebuild dist, README notes and byte count"` (+ attribution lines). Then verify: `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && n=$(git show HEAD:prompt-coach/dist/prompt-coach.html | wc -c) && grep -c "$n bytes" prompt-coach/README.md'`. Expected: `1`.

---

### Task 9: Evidence doc (the lead adds the sealed result)

**Files:**
- Create: `docs/evidence/2026-10-19-prompt-coach-known-limits.md`
- Modify: `docs/evidence/2026-10-19-prompt-coach-file-cannot-support.md` (one pointer line under "Known limits / parked follow-ups for Ian")

- [ ] **Step 1: Re-measure** every figure now (Task 8 Step 5 outputs, the latest `chk.sh dump` line, the dist line and README byte check). Label each "measured" or "read".
- [ ] **Step 2: Write the doc**: one row per item (C2, C4, S3, C5, S6, H4, and Task 7 kept or cut): red test title, guard test title, result (measured), train fires (measured), what remains. Add the Scope 3 names research result (read, no change), fixture and suite results, the dist line, "pagetest.js and filetest.js not run; page rendering not browser-tested; no answer-quality gain claimed". Leave exactly one line `SEALED (lead): to be added by the lead from the progress.md note` for the lead; do not open the sealed file or `heldout_fires.tsv`.
- [ ] **Step 3: Known limits after this run** (carry forward): the Task 8 README list; the parked SOX ITGC (R8) and SUS-1 output-column (R9) flags with the reviewers' reasons; Q2, Q3, Q5, T5 known limits; the Workiva AI sandbox check of the T3 decline line is Ian's.
- [ ] **Step 4: Pointer.** Append under the old doc's "Known limits" heading: `Followed up by docs/evidence/2026-10-19-prompt-coach-known-limits.md (C2, C4, S3, C5, S6, H4; SOX ITGC and SUS-1 columns parked).`
- [ ] **Step 5: Check.** `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && f=docs/evidence/2026-10-19-prompt-coach-known-limits.md && [ "$(grep -c measured $f)" -ge 8 ] && [ "$(grep -c "TBD\|TODO" $f)" = 0 ] && grep -c "known-limits.md" docs/evidence/2026-10-19-prompt-coach-file-cannot-support.md'`. Expected: `1` (non-zero exit before the file exists).
- [ ] **Step 6: Commit.** `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-known-limits" && git add docs/evidence/2026-10-19-prompt-coach-known-limits.md docs/evidence/2026-10-19-prompt-coach-file-cannot-support.md && git commit -m "Prompt coach known limits: evidence"` (+ attribution lines).

---

## Expected breaks

None: no existing test is expected to break. Changes either narrow a fire (Tasks 2, 3, 5, 7) or add a fire on new phrasing (Tasks 1, 6) that no existing test pins; the existing C1-C4, S1, S3, S4, T3, T6 and FY25 tests stay green. Tasks 8-9 change docs and the built dist only. The parked SOX ITGC and SUS-1 items are not built, so no fixture difference is expected anywhere. If an existing test breaks, that is a stop for the lead.

## Self-review

- Review fixes: M1/R5 (Task 5 red test holds both T&D aliases, guard passes on the parent, `62 1` holds); R1 (`tricky_prompts.json` copied; found in the old scripts dir by search); R2/S6 (`! grep -q`, `COPY_OK`, exit 0); R3 (exact counters, exit statuses, `PASS 229 runs`); R7 (one sealed score after the last kept build task); S7 (absolute paths in check lines); S1 (one label per category, cap 90, long-label and sentence cases); S2 (wording fixed: only a literal LE token silences, with a Legal Entity near miss); S3 (bare calendar year not accepted; tests either way); S4 (H4 real text and "Estimate the share price next quarter" now fire); S8 ("against", "than", "at", "actuals" excluded, case added); R4 (`f.lines` used, flat text keeps old rule, Word guards); R6 (claim narrowed to FY compounds); N2, N3, N4 folded in. Tasks 8 and 9 of the first draft are parked.
- Names: `rowLabelCats(rowsText)`, `LE_BASIS`, `STOCK_PX/STOCK_VERB/STOCK_FUTURE/STOCK_PAST`, `stockForward`, `yearForms`, `tp` are used consistently; the forecast gate line is edited in Tasks 1 (none), 3 and 6 (Task 6 quotes the Task 3 form).
- Unit counts: 53 + 2 per task (Tasks 1-6: 65; Task 7: 67); red checks expect 1 failure, 2 for Task 7.
- Assumed, not run: all regex behaviour; the log-format greps; the Task 4 "Q1, FY2025 total" guard case and the Task 6 "Estimate the share price impact ... last quarter costs" quiet case (the executor reports a surprise to the lead).
