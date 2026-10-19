# Prompt coach: Scope 3 "not in the file" check, reshape (option A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape/prompt-coach" && node --test --test-reporter=tap tests/rewrite_unit.test.js; node tests/simulate.js data/train_*.jsonl; node tests/customer_check.js; node tests/eval.js rulefeat data/test.jsonl
Data: (none)

**Goal:** The Scope 3 "category not in the file" warning stops misreading Word tables, stops skipping real "explain with figures" asks, and counts short row labels as listed, with zero wrong warnings.

**Architecture:** Three small edits inside `cannotSupport` and `categoryHit` in `prompt-coach/engine/rewrite.js` on base 59b09c1 (Word `lines` joined by newline for the Scope 3 part only; explain skip decided per sentence with a change-word veto; short-form regexes added to the category matcher), then README and `dist` in one commit. A fresh sealed held-out set is written, built into real files and frozen BEFORE any code change, and scored once at the end.

**Tech Stack:** Plain Node (CommonJS), `node:test` (tap reporter), headless Chrome from `C:/Program Files/Google/Chrome/Application` for the real `engine/files.js` reader (no installs; libraries from cdnjs as in production). Bash check scripts in the git-ignored ledger.

**Spec:** `docs/superpowers/specs/2026-10-19-prompt-coach-scope3-reshape-design.md` (approved by Ian 2026-10-19). Run prompt: `docs/PROMPT_COACH_SCOPE3_RESHAPE_RUN_PROMPT.txt`. Plan review Opus R1 folded in (see "Review dispositions").

## Global Constraints

- `ROOT` = `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape`; project `ROOT/prompt-coach`; ledger `L` = `ROOT/.ledger/2026-10-19-prompt-coach-scope3-reshape` (git-ignored); predecessor ledger `PL` = `L/predecessor-scope3-structure-ledger`; reader harness `L/probe/p1/` (`make_fixtures.js`, `run_reader.js`).
- Base = commit 59b09c1. The base gate stays: ask says "Scope 3" AND file says "Scope 3", and at least 2 categories listed.
- **How warnings are read (measured by the Opus reviewer: `coach()` has no `.unsupported` field).** The warning is a note: `o.notes.filter((n) => n.kind === 'unsupported')` (engine/rewrite.js:609; tests/rewrite_unit.test.js:375 defines `unsupported(o)`; `run(prompt, files, extra)` at line 12 calls `W.coach(prompt, { files, detect, ...C.pick(prompt, CLS), ...extra })`). Every new unit test uses the existing `run(...)` and `unsupported(...)` helpers and asserts on the note TEXT: the category note reads `Your file lists Scope 3 categories, but not category <n> (<name>), ...`, so assert `unsupported(o).length === 1` and `unsupported(o)[0].text.includes('category ' + n + ' (')`. A quiet assertion is `unsupported(o).length === 0`, never `!o.unsupported`. `L/scripts/lib.js` (Task 1b) exports the same `run`/`unsupported` (copied from the test file, classifier pick included) for `score.js` and `quiet`.
- **Definition of "warn".** Held-out scoring counts the category note only (note of kind `unsupported` whose text starts `Your file lists Scope 3 categories`), because these items test the category check; a forecast note on a finance near-miss is reported separately as "forecast note" and does not count. `quiet` rows count ANY `unsupported` note that the branch emits and base does not (stricter). The final verdict prints held-out AND quiet.
- Spec rule 1 (Word clean lines): in the Scope 3 part of `cannotSupport` only, a Word file's text is `f.lines.join('\n')` when `lines` is present. The 4 other readers of `f.text` in `rewrite.js` (empty-file test, forecast check, area detection, grounding) and the page are unchanged.
- Spec rule 2 (explain middle rule): skip the check only when an explain word (`CAT_EXPLAIN`) is in the same sentence (`sentenceSpans`) as the "Scope 3" or category mention AND that sentence has no change word. The change-word list is exactly the spec's: why, rose, rise, jumped, increase(d), decrease(d), fell, drop(ped), change(d), `%`, vs, versus, compared. No widening without Ian's yes. The classifier's `intent === 'explain'` alone no longer skips.
- Spec rule 3 (short labels count as listed): `categoryHit` also accepts `purch. goods`, `waste in op(s)`, `upstr.` / `downstr.` (transport, T&D, leased), `EOL`. A category shown in short form is not reported missing.
- Pass bar (Ian: "Zero wrong + beat base by 2"): 0 of 12 near-misses warn; 0 new warnings vs base on E1-E18, the P1 real-shape files x listed / listed-num / finance asks, the two ERPNext charts as sheets with a figure per account, and the 1,516 stored asks with train files; branch warns on at least base + 2 of the 12 should-warn items. A miss is reported, never tuned.
- Guards identical to base: existing unit tests pass unchanged (new ones appended only), 0 warnings on train files (`dump_runs.js`), no-file Strong rewrites byte-identical, 19 fixtures, `simulate.js`, `customer_check.js`, `eval.js rulefeat`. Counts are re-measured at base in Task 1b.
- Out of scope / locked (do not edit): `prompt-coach/engine/files.js`, forecast / share-price / LE detection, grades, weights (`engine/weights*.json`, `engine/cls-weights.json`), `engine/rules.js`, `engine/model.js`, `engine/classify.js`, `data/`, existing tests in `tests/rewrite_unit.test.js`, `tests/eval.js`, `tests/simulate.js`, `tests/customer_check.js`, `tests/pagetest.js`, `tests/filetest.js`, HEAD fc40f5c's figure rule (not built on), option D. `chk.sh guards` enforces this with commands (see the table).
- NEVER open `PL/heldout_sealed.json` items (S1-S24, K1-K24 are SEEN) except through the reuse-check script that prints counts only; the fresh sealed file is opened once, by the scoring script, in Task 6. No tuning against any set after scoring.
- Implementer and checker briefs are the plan text only. They never receive `items.json` or any held-out text; the checker diffs every new test string against `items.json` by 5-word shingles (script prints a count only).
- No push before Task 7, no merge (slip: push own branch yes, merge no), no live Workiva AI, no spend (usage only), no install. `tests/pagetest.js` and `tests/filetest.js` are reported "not run" (no browser path); page rendering is not browser-tested.
- Plain-English warning text is unchanged. Docs change in the same commit as the code they describe (the dist byte count in README goes with the dist rebuild, Task 5).
- Commit trailers: `Co-Authored-By: <the model that made the commit> <noreply@anthropic.com>` (this session's reminder gives `Claude Sonnet 5.5`) and `Claude-Session: https://claude.ai/code/session_011vB4jkccTRKQCcffFeiR5r`.
- Marks in every report and the evidence doc: **measured** (run now), **read** (from a doc/log/helper), **assumed** (reasoned only).
- The plan file is committed at plan approval (before Task 1) so `git status` is clean afterwards.

## Run settings

- helperToolCallCap: **30** per helper dispatch (matches budget.json; unchanged).
- tasksLeft (helper dispatches expected, after plan approval): **16**. T1a: 1 (blind held-out writer); T1b: 1 (base counts, chk.sh, quiet inputs); T2-T5: 2 each = 8 (implementer, checker); T6: 2 (scoring and probe rows run by the lead's helper, evidence-doc writer); T7: 4 (Opus review, Codex review, fix-round implementer, re-check). The lead builds the held-out fixtures and runs each check itself. budget.json currently says 14 (assumed); update it to 16 at plan approval.
- Plan tasks: 8. Helper-token estimate (assumed, sized on the predecessor run): T1a 60k, T1b 100k, T2 80k, T3 100k, T4 80k, T5 40k, T6 130k, T7 220k; run total about **810k** against the 1.0M runTokenCap.
- Groups: all 8 tasks are strictly sequential, one helper at a time, never parallel (T2-T4 edit the same function; T6 needs T5's dist). No TUNE tasks: the single scoring pass in T6 is a measurement, not a loop.
- Paid calls: none. Opus/Codex/Sonnet helpers run on usage only (slip: spend nothing). No live Workiva AI; headless Chrome fetches the public cdnjs libraries free, as in probe P1.

## Check script (created in Task 1b, reused by every later task)

`CHK` = `L/scripts/chk.sh` (bash, `set -o pipefail`, `cd` to `ROOT/prompt-coach`). Any mismatch prints `..._BAD` and exits non-zero.

| Subcommand | Prints on success |
|---|---|
| `heldout` | `HELDOUT_OK items=24 warn=12 near=12 sha_ok=3` (items, frozen reader output and scoring script match `L/heldout_sha256.txt`) |
| `baseline` | `BASE_OK unit=57 fixtures=19 trainwarn=0 simulate=<n> customer=<n> rulefeat=<n>` with the 3 `<n>` re-measured at base and stored in `L/logs/base/counts.txt` |
| `unit <pass> <fail>` | `UNIT_OK pass=<pass> fail=<fail>` |
| `guards` | `GUARDS_OK` when ALL hold: train-file dump has 0 warnings; no-file Strong rewrites are byte-identical to `L/logs/base/`; fixtures (19) identical except lines the task names; simulate / customer_check / eval rulefeat equal `L/logs/base/counts.txt`; `git diff --name-only 59b09c1 -- prompt-coach/engine/files.js prompt-coach/engine/classify.js prompt-coach/engine/model.js prompt-coach/engine/rules.js 'prompt-coach/engine/*weights*.json' prompt-coach/data prompt-coach/tests/eval.js prompt-coach/tests/simulate.js prompt-coach/tests/customer_check.js prompt-coach/tests/pagetest.js prompt-coach/tests/filetest.js` is empty; `git diff 59b09c1 -- prompt-coach/tests/rewrite_unit.test.js \| grep -c '^-[^-]'` is 0 |
| `quiet` | `QUIET_OK new_warn=0 sets=5 e=18 p1=<a> charts=<b> stored=1516 ...` printing one row count PER set (E1-E18 = 18; P1 files x 3 asks; two ERPNext charts as sheets; 1,516 stored asks paired with train files; plus the set sizes recorded in `L/logs/base/quiet_counts.txt`). Fails (`QUIET_BAD short=<set>`) if any set has fewer rows than the base-recorded count |
| `quiet --selftest` | `QUIET_SELFTEST_OK` : runs `quiet` with a stub branch engine that always warns and requires `QUIET_BAD`; also runs it with a stub engine equal to base and requires `QUIET_OK` (proves the check can fail and can pass) |
| `dist <fixed-string> <min-count>` | `DIST_OK count=<n>` |

Model the script on `PL/scripts/chk.sh`, `PL/scripts/dump_runs.js`, `PL/scripts/cmp_fixture.js`.

## Expected breaks

None expected. Every existing unit test must pass unchanged (57 at base, measured); new tests are appended only. If one breaks, stop and report; do not edit it.

---

### Task 1a: Fresh held-out written, built, sealed

Group: sequential. Tokens (assumed): 60k.

**Files:**
- Create (ledger, git-ignored): `L/heldout/items.json`, `L/heldout/writer_audit.md`, `L/heldout/make_fixtures.js`, `L/heldout/fx/*` (real files), `L/heldout/reader_out.json`
- Modify: none in the repo.

**Interfaces:**
- Produces: `items.json` = array of 24 `{id:"H1".."H24", label:"warn"|"near", shape, ask, file:{name, kind, rows|paragraphs|slides}, why}` where `rows` / `paragraphs` / `slides` are the EXACT cells, paragraphs or slide texts to put in the file (the lead copies them; the lead authors none); `reader_out.json` = what the REAL `files.js` hands the engine per file.

- [ ] **Step 1: Blind Opus helper writes the items.** Dispatch one Opus helper with the Write tool ONLY (no Read, Grep, Glob, Bash) and permission to write one path, `L/heldout/items.json`; it sees only the brief text, never the repo, spec or plan. Brief: write 24 items, 12 should-warn and 12 near-miss, each an ask plus the exact content of one attached file, labelled by truth (does the ask need a Scope 3 category figure the file lacks? yes = warn), not by any rule. Shapes: Word table, Word prose, Word bullets, PDF, slides, Excel summary sheet with short labels, CSV; asks by name, by number with "Scope 3", explain-with-figure, explain-definition (near-miss), stacked asks, finance asks and finance sheets using category words (near-miss). Reply at most 10 lines.
- [ ] **Step 2: Audit the writer.** Lead reads the helper's tool-call list (from the dispatch result) and writes `L/heldout/writer_audit.md`: tools used, count, confirmation that only one Write to `items.json` happened. If any other tool call appears, the set is discarded and rewritten.
- [ ] **Step 3: Counts and reuse check.** `node -e` prints `24 12 12` (items, warn, near). Reuse script `L/scripts/reuse.js` compares each ask against ALL banned sets, printing only counts: S1-S24 and K1-K24 in `PL/heldout_sealed.json`, E1-E18 asks, P1 asks, the 9 stored explain asks, the P2 asks, and every ask string in the plan's unit tests. Rule set BEFORE running: an item is "reused" if more than 20% of its 5-word shingles appear in any banned set (stock phrase "scope 3 category N" is whitelisted); print `reused=<n> maxfrac=<x>`. Expected `reused=0`; a reused item is returned to a fresh writer (new dispatch, same limits).
- [ ] **Step 4: Build real files.** `L/heldout/make_fixtures.js` copies each item's exact rows / paragraphs / slides into a real file in `L/heldout/fx/`, extending `L/probe/p1/make_fixtures.js`. The P1 script has no xlsx or csv writer (measured, grep count 0): write CSV as plain text; write xlsx by extending its store-only zip helper with a minimal `xl/worksheets/sheet1.xml`, `xl/sharedStrings.xml`, `xl/workbook.xml`, `[Content_Types].xml` and rels. Run it; expected 24 files.
- [ ] **Step 5: Read with the real reader.** `node "L/probe/p1/run_reader.js" "ROOT/prompt-coach/engine/files.js" "L/heldout/fx" "L/heldout/reader_out.json"` (Chrome at `C:/Program Files/Google/Chrome/Application`). Expected: 24 entries, each with non-empty `text`; Word entries also have `lines`; the xlsx and csv entries have row text (a zero-row Excel or CSV entry is a build bug: fix the build, not the item).
- [ ] **Step 6: Record, do not seal yet.** The seal (sha256 of `items.json`, `reader_out.json`, `score.js`) is written at the end of Task 1b, after `score.js` has its dry run.
- [ ] **Step 7: Check.** Run the Check below.
- [ ] **Step 8: Nothing to commit (ledger is git-ignored). Lead notes completion in `L/progress.md`.**

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape" && node -e "const a=require('./.ledger/2026-10-19-prompt-coach-scope3-reshape/heldout/items.json'),r=require('./.ledger/2026-10-19-prompt-coach-scope3-reshape/heldout/reader_out.json');const t=Array.isArray(r)?r:Object.values(r);console.log(a.length,a.filter(x=>x.label==='warn').length,a.filter(x=>x.label==='near').length,t.length,t.filter(x=>(x.text||'').trim()).length)" && node ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/reuse.js" | tail -n 1`
Expected: `24 12 12 24 24` then `reused=0 maxfrac=<x>`.

---

### Task 1b: score.js with dry run, chk.sh, quiet inputs, base counts, seal

Group: sequential. Tokens (assumed): 100k.

**Files:**
- Create (ledger): `L/scripts/lib.js`, `L/scripts/score.js`, `L/scripts/chk.sh`, `L/scripts/quiet.js`, `L/quiet/*` (quiet inputs), `L/heldout_sha256.txt`, `L/logs/base/counts.txt`, `L/logs/base/quiet_counts.txt`, `L/tmp/base/` (base engine from `git show 59b09c1:...`)

**Interfaces:**
- `lib.js` exports `run(prompt, files, extra)` and `unsupported(o)` copied from `tests/rewrite_unit.test.js` lines 12 and 375 (classifier pick and `detect` included, so base is the base users see), plus `engineAt('base'|'branch')`.
- `score.js [--engine-stub <path>]` scores base and branch on the frozen `reader_out.json`, prints `SCORE nearmiss_warn=<a>/12 base_catch=<b>/12 branch_catch=<c>/12 gain=<c-b> forecast_notes=<f> heldout=<PASS|FAIL> quiet=<QUIET_OK|QUIET_BAD> verdict=<PASS|FAIL>`; PASS needs a=0, c>=b+2 AND quiet OK. It writes its own log `L/logs/final/score.log` (the full line, the git HEAD SHA of the scored engine, a timestamp) and REFUSES to run if that log already exists. `score.js --verify-log` only prints the stored line.

- [ ] **Step 1: Write `lib.js` and `score.js`** as above. `--verify-log` and the refuse-twice guard are built now, before the seal.
- [ ] **Step 2: Dry run before sealing.** Run `score.js --dry-run` (does not write the log): it feeds one known-warning row, ask `Give me Scope 3 category 4 emissions.` with a file whose text is `## Summary\nScope 3 summary\n6, 1,240\n7, 890`, through `run`+`unsupported` on base, and must print `DRY_OK warnings=1`; and a known-quiet row (same file, ask for category 6) must print `warnings=0`. A reader of `r.unsupported` would read 0 for both and fail this step.
- [ ] **Step 3: Build quiet inputs** into `L/quiet/` with a fixed row count per set, recorded in `L/logs/base/quiet_counts.txt`: E1-E18 (from `PL/reviews/test/final_opus_probe.test.js`, 18 rows), the P1 real-shape files (`L/probe/p1/fx`, reader output `reader_out.json`) x the listed / listed-num / finance asks (3 asks per file), the two ERPNext charts (from `L/probe/p2`) laid out as sheets with a figure per account, and the 1,516 stored asks (from `data/*.jsonl`, unique) paired with the train files.
- [ ] **Step 4: Write `chk.sh` and `quiet.js`** (table above), including the guards git commands and `quiet --selftest` (stub always-warn must give `QUIET_BAD`, stub = base must give `QUIET_OK`).
- [ ] **Step 5: Measure base counts** on the unchanged tree and write `L/logs/base/counts.txt`: unit 57, fixtures 19, train warnings 0, simulate, customer_check, eval rulefeat numbers; per-fixture and no-file Strong baselines under `L/logs/base/`.
- [ ] **Step 6: Seal.** `sha256sum` of `items.json`, `reader_out.json`, `score.js` into `L/heldout_sha256.txt` (3 lines). No item has been scored.
- [ ] **Step 7: Self-test.** `chk.sh quiet --selftest`, then `chk.sh heldout`, `chk.sh baseline`.
- [ ] **Step 8: Nothing to commit (ledger git-ignored).**

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape" && node ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/score.js" --dry-run | tail -n 2 && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" quiet --selftest && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" heldout && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" baseline`
Expected: `DRY_OK warnings=1` and `DRY_OK warnings=0`, `QUIET_SELFTEST_OK`, `HELDOUT_OK items=24 warn=12 near=12 sha_ok=3`, `BASE_OK unit=57 fixtures=19 trainwarn=0 simulate=<n> customer=<n> rulefeat=<n>`.

---

### Task 2: Word clean lines (rule 1)

Group: sequential. Tokens (assumed): 80k.

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (function `cannotSupport`, the `lower` line, ~439)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)

**Interfaces:**
- Consumes: reader shape `{name, kind:'Word', text, lines:[...], sheets:[], periods:[]}` (P1, measured: `text` glues cells with no separator, `lines` is clean); the test file's `run` and `unsupported` helpers.
- Produces: `cannotSupport` builds `lower` from `f.lines.join('\n')` for `f.kind === 'Word'` files that have `lines`, else `f.text`.

- [ ] **Step 1: Write the failing tests** (append, exact names). Word file `d1 = {name:'d1.docx', kind:'Word', sheets:[], periods:[], text:'Scope 3 emissions by category61,240' + '7890', lines:['Scope 3 emissions by category','6, 1,240','7, 890']}` (text glued exactly as the real reader does).
  (1) `unsupported: a Word file is read by its clean lines, so number rows count as listed (D1)`: `unsupported(run('Using this file, calculate Scope 3 category 4 upstream transport emissions for FY25.', [d1]))` has length 1 and `[0].text.includes('category 4 (')`. Fails on base: glued text lists 0 categories, so the check never runs.
  (2) `unsupported: a Word file that lists the category stays quiet (D1 guard)`: same file plus `'4, 410'` in `lines` and `'4410'` appended to `text`; `unsupported(...).length === 0`.
  (3) `unsupported: a non-Word file with lines is still read from its text`: `kind:'Excel'`, same `lines` property; result length equals the result with `lines` removed (assert both lengths).
- [ ] **Step 2: Run to verify fail on base.** Check A. Expected on base: `# pass 2` `# fail 1` (test 1 fails; 2 and 3 are guards that pass on base).
- [ ] **Step 3: Implement.** Replace the `lower` line with `const scope3Text = (f) => (f.kind === 'Word' && Array.isArray(f.lines) ? f.lines.join('\n') : (f.text || ''));` and `const lower = files.map(scope3Text).join('\n').toLowerCase();`. Touch nothing else.
- [ ] **Step 4: Run new tests.** Check A. Expected `# pass 3`, `# fail 0`.
- [ ] **Step 5: Full unit file, guards and quiet.** Check B. Expected all OK. A new quiet warning stops the task: report it, do not tune.
- [ ] **Step 6: Diff scope.** `cd "ROOT" && git diff --stat HEAD -- prompt-coach/engine` Expected: `rewrite.js` only, a few lines.
- [ ] **Step 7: Commit.** `git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach Scope 3 reshape: Word clean lines in the category check"` + trailers.
- [ ] **Step 8: Checker helper re-reads the diff against rule 1 (no other `f.text` reader changed) and diffs the new test strings against `items.json` (count only); lead re-runs Check B.**

Check A: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape/prompt-coach" && node --test --test-reporter=tap --test-name-pattern="clean lines|D1 guard|non-Word" tests/rewrite_unit.test.js 2>&1 | grep -E "^# (pass|fail)"`
Expected after Step 4: `# pass 3` and `# fail 0`.

Check B: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape" && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" unit 60 0 && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" guards && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" quiet`
Expected: `UNIT_OK pass=60 fail=0`, `GUARDS_OK`, `QUIET_OK new_warn=0 ...`.

---

### Task 3: Explain middle rule (rule 2)

Group: sequential. Tokens (assumed): 100k.

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`cannotSupport`, the `if (intent === 'explain' || CAT_EXPLAIN.test(prompt)) return null;` line ~438; add `CAT_CHANGE` and `explainSkips` beside `CAT_EXPLAIN`)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)
- Create (ledger): `L/scripts/explain9.js`, `L/logs/final/explain9.log`

**Interfaces:**
- Consumes: `sentenceSpans(prompt)` returns `[{start,end}]` (rewrite.js ~204); `CAT_EXPLAIN`; `CAT_ASK` (a `/gi` regex: never call `.test`/`.exec` on it directly).
- Produces: `CAT_CHANGE = /\b(?:why|rose|rise|jumped|increased?|decreased?|fell|dropped?|changed?|vs|versus|compared)\b|%/i` (the spec's list exactly); `explainSkips(prompt)` returns true when some sentence has a `CAT_EXPLAIN` match, a `scope\s*3` or category mention (tested with non-global copies: `new RegExp(CAT_ASK.source,'i')` and `/\bcategory\b/i`), and no `CAT_CHANGE`. `cannotSupport` returns `null` at that line only when `explainSkips(prompt)`; the `intent` parameter stays in the signature.

- [ ] **Step 1: Write the failing tests** (append; every title contains `explain`). File `f3 = {name:'s3.xlsx', kind:'Excel', sheets:[{name:'Summary',headers:[]}], periods:[], text:'## Summary\nScope 3 summary\n6, 1,240\n7, 890'}` (lists 6 and 7). Use `run` and `unsupported`.
  (a) `unsupported: explain a definition stays quiet`: `Explain what Scope 3 category 4 covers.` -> length 0 (guard, passes on base).
  (b) `unsupported: explain with a change word is checked`: `Explain why Scope 3 category 4 rose in FY25.` -> length 1, text includes `category 4 (`. Fails on base.
  (c) `unsupported: explain in another sentence is checked`: `Explain the method used in this report. Then give me Scope 3 category 4 emissions.` -> length 1. Fails on base.
  (d) `unsupported: explain in the same sentence stays quiet`: `Summarise the file and explain Scope 3 category 4.` -> length 0 (guard).
  (e) `unsupported: explain with a percent is checked`: `Explain Scope 3 category 4 as a % of total.` -> length 1. Fails on base.
  (f) `unsupported: explain sentence that also names the category number still reaches the number check` (the `/gi` lastIndex trap): `Explain what Scope 3 category 4 covers. Then give me Scope 3 category 5 emissions.` -> the second sentence is not an explain sentence, so length 1 and text includes `category 5 (` (fails on base: base skips everything).
- [ ] **Step 2: Measure the 9 stored explain asks (do not guess).** Write `L/scripts/explain9.js`: it extracts the 60 stored Scope 3 asks from `data/*.jsonl`, keeps the 9 that match `CAT_EXPLAIN`, runs each through the IMPLEMENTED rule against `f3` extended with two other listed categories, and prints per ask `skipped|checked` and whether it names a category number; write the full output to `L/logs/final/explain9.log` with the script (reading, not shell redirection). Only asks that name a number can assert a warning. The reviewer's approximation (assumed) is 7 skipped / 2 checked with 1 numbered; the spec said 4 / 3 / 2 (read). Record the measured split as constants in a test `unsupported: the 9 stored explain asks split as measured (explain9)` asserting skipped-versus-checked for each numbered ask; if the split is not what the spec said, REPORT it in the evidence doc; never adjust the rule to hit it.
- [ ] **Step 3: Run to verify fail on base.** Check A with the tests from Step 1. Expected on base: `# pass 2` `# fail 4` ((b), (c), (e), (f) fail; (a), (d) pass).
- [ ] **Step 4: Implement** `CAT_CHANGE` and `explainSkips` as above and change the skip line to `if (explainSkips(prompt)) return null;`.
- [ ] **Step 5: Run new tests.** Check A. Expected `# pass 6` `# fail 0` for the six; add the `explain9` test and expect `# pass 7`.
- [ ] **Step 6: Full unit file, guards and quiet.** Check B. New quiet warning stops the task: report, do not tune. Diff scope: `cd "ROOT" && git diff --stat HEAD -- prompt-coach` Expected: `rewrite.js` and `rewrite_unit.test.js` only (uncommitted changes of this task).
- [ ] **Step 7: Commit** `Prompt coach Scope 3 reshape: explain only skips in the same sentence, no change word` + trailers.
- [ ] **Step 8: Checker re-reads the diff against rule 2 (change-word list exactly as the spec; classifier untouched; non-global copies used for `CAT_ASK`) and diffs test strings against `items.json`; lead re-runs Check B.**

Check A: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape/prompt-coach" && node --test --test-reporter=tap --test-name-pattern="explain" tests/rewrite_unit.test.js 2>&1 | grep -E "^# (pass|fail)"`
Expected after Step 5: `# pass 7` and `# fail 0` (requires both counts; the pattern also selects any existing test with "explain" in its title, so the implementer first runs the pattern on base, records that count k as `L/logs/base/explain_pattern.txt`, and the expected pass is `7 + k`).

Check B: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape" && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" unit 67 0 && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" guards && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" quiet`
Expected: `UNIT_OK pass=67 fail=0` (57 base + 3 from Task 2 + 7 new), `GUARDS_OK`, `QUIET_OK new_warn=0 ...`.

---

### Task 4: Short labels count as listed (rule 3)

Group: sequential. Tokens (assumed): 80k.

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`CAT_RE` / `categoryHit`, lines ~415-421)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)

**Interfaces:**
- Consumes: `categoryHit(n, lower)` returns `'exact'`, `'generic'` or `null` (lower-cased text).
- Produces: `categoryHit` also returns `'exact'` for short forms: cat 1 `purch\.? goods`; cat 5 `waste in ops?\b`; cat 4 `upstr\.? (?:transport|t ?& ?d|t and d)`; cat 9 `downstr\.? (?:transport|t ?& ?d|t and d)`; cat 8 `upstr\.? leased`; cat 13 `downstr\.? leased`; cat 12 `\beol\b`. Long-form behaviour unchanged.

- [ ] **Step 1: Write the failing tests** (append; every title contains `short label`). File `f4 = {name:'summary.xlsx', kind:'Excel', sheets:[{name:'Summary',headers:[]}], periods:[], text:'## Summary\nScope 3 summary\nPurch. goods, 1,200\nWaste in ops, 300'}`.
  (a) `unsupported: short label rows count as listed (category 6 missing)`: `Calculate Scope 3 category 6 business travel emissions.` -> length 1, text includes `category 6 (`. Fails on base (the two short rows list 0, so the check never runs).
  (b) `unsupported: short label shows category 5 as listed`: `Calculate Scope 3 category 5 waste emissions.` -> length 0 (guard).
  (c) `unsupported: short label sheet with Upstr. T&D, Downstr. T&D, EOL`: text `## S\nScope 3 summary\nUpstr. T&D, 400\nDownstr. T&D, 500\nEOL, 80` (it carries a "Scope 3 summary" line so the base gate passes); ask for category 12 -> length 0; category 4 -> length 0; category 6 -> length 1 with `category 6 (`. The category 6 assertion fails on base.
  (d) `unsupported: short label EOL needs a word boundary`: text `## S\nScope 3 summary\nGeology survey, 1\nPurch. goods, 2\nBusiness travel, 3` (the word "geology" contains "eol"; measured by the reviewer that "protocol" does not), ask `Calculate Scope 3 category 12 emissions.` -> length 1 with `category 12 (` (a regex without `\b` would read "geology" as category 12 and stay quiet). Passes on base and on a correct branch: a guard against a missing `\b`.
- [ ] **Step 2: Run to verify fail on base.** Check A. Expected on base: `# pass 2` `# fail 2` ((a) and (c) fail; (b) and (d) pass).
- [ ] **Step 3: Implement** the short forms (add `CAT_SHORT = [null, ...]` and OR it in beside `CAT_RE[n]`).
- [ ] **Step 4: Run new tests.** Check A. Expected `# pass 4` `# fail 0`.
- [ ] **Step 5: Full unit file, guards and quiet.** Check B. A new quiet warning is a fail: report it; do not widen or tune the regexes. Fixtures: if a fixture's note changes, stop and report.
- [ ] **Step 6: Diff scope.** `cd "ROOT" && git diff --stat HEAD -- prompt-coach` Expected: `rewrite.js` and `rewrite_unit.test.js` only.
- [ ] **Step 7: Commit** `Prompt coach Scope 3 reshape: short row labels count as listed` + trailers.
- [ ] **Step 8: Checker re-reads the diff against rule 3 (only the listed short forms; direction = fewer missing) and diffs test strings against `items.json`; lead re-runs Check B.**

Check A: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape/prompt-coach" && node --test --test-reporter=tap --test-name-pattern="short label" tests/rewrite_unit.test.js 2>&1 | grep -E "^# (pass|fail)"`
Expected after Step 4: `# pass 4` and `# fail 0`.

Check B: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape" && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" unit 71 0 && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" guards && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" quiet`
Expected: `UNIT_OK pass=71 fail=0` (57 + 3 + 7 + 4), `GUARDS_OK`, `QUIET_OK new_warn=0 ...`.

---

### Task 5: README and dist

Group: sequential. Tokens (assumed): 40k.

**Files:**
- Modify: `prompt-coach/README.md` (line 9 byte count 334435 is stale: base dist measured 336173; the known-limits list; the unsupported-note paragraph near line 90)
- Modify: `prompt-coach/dist/prompt-coach.html` (rebuilt by `node tests/build.js`; build does not minify, so `explainSkips` appears in it)

**Interfaces:**
- Consumes: Tasks 2-4 engine changes.
- Produces: dist containing `explainSkips` and `CAT_CHANGE`; README stating the exact new byte count.

- [ ] **Step 1: Failing check first.** `chk.sh dist "explainSkips" 1` on the unbuilt dist. Expected on base dist: `DIST_BAD count=0`.
- [ ] **Step 2: Rebuild.** `cd "ROOT/prompt-coach" && node tests/build.js`.
- [ ] **Step 3: Measure bytes.** `wc -c dist/prompt-coach.html` -> N (base was 336173; do not guess).
- [ ] **Step 4: Edit README.** Line 9 byte count -> N. Known-limits list: what is still not caught (a file or ask without "Scope 3" text; abbreviations such as FERA; the explain cases the middle rule still skips, e.g. stacked asks joined by commas in one sentence; PowerPoint mid-word run splits, a slide run split reads "Busi ness"); say Word is read by its clean lines for this check (capped at 2,000 entries); describe the middle rule and short labels in the unsupported-note paragraph. Grep the README for any nearby count the changes make wrong.
- [ ] **Step 5: Re-run dist check.** Expected `DIST_OK count=1` or more for `explainSkips` and for `CAT_CHANGE`.
- [ ] **Step 6: Guards.** `chk.sh guards`. Expected `GUARDS_OK`.
- [ ] **Step 7: Commit** `Prompt coach Scope 3 reshape: README known limits and dist rebuild` + trailers (README and dist together).
- [ ] **Step 8: Checker confirms the README byte count equals `wc -c` of the committed dist.**

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape" && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" dist "explainSkips" 1 && N=$(wc -c < prompt-coach/dist/prompt-coach.html | tr -d ' ') && grep -c "$N bytes" prompt-coach/README.md`
Expected: `DIST_OK count=1` (or more) then `1`.

---

### Task 6: Score once; guards; probe rows; evidence doc

Group: sequential. Tokens (assumed): 130k.

**Files:**
- Read (ledger): `L/heldout/items.json`, `L/heldout/reader_out.json`, `L/scripts/score.js`, `L/heldout_sha256.txt`
- Create: `docs/evidence/<date of the run>-prompt-coach-scope3-reshape.md` (date = the day the run scores; the spec says date of the run)
- Created by `score.js` itself: `L/logs/final/score.log`

**Interfaces:**
- Consumes: sealed files (sha256 must match), branch engine after Task 5.
- Produces: the verdict (held-out AND quiet) and the evidence doc.

- [ ] **Step 1: Confirm the seal.** `chk.sh heldout`. Expected `HELDOUT_OK ... sha_ok=3`. If not, stop and report.
- [ ] **Step 2: Score once.** `node "L/scripts/score.js"`. It scores base and branch on the same frozen `reader_out.json`, writes `L/logs/final/score.log` (line, scored git SHA, timestamp) and refuses to run again once the log exists. No second run after any edit.
- [ ] **Step 3: Hard rows and guards.** `chk.sh quiet`, `chk.sh guards`, `chk.sh unit 71 0`. Report `pagetest.js` and `filetest.js` as "not run".
- [ ] **Step 4: Record, do not tune.** A miss (any near-miss warning, any new quiet-row warning, gain < 2) is reported with item ids; no code, rule, set or threshold is changed afterwards. Prediction to compare: met with +2 or +3 (assumed).
- [ ] **Step 5: Write the evidence doc**: scores (a, b, c, gain, forecast notes), base vs branch per item id, hard-row counts per set, guard counts vs `L/logs/base/counts.txt`, the `explain9` measured split vs the spec's 4/3/2, limits (no real customer asks or sheets; PowerPoint mid-word splits; held-out is 24 items), the scored git SHA from `score.log`. Item ids and verdicts; near-miss asks may be quoted, S/K items never.
- [ ] **Step 6: Mark every number** `**measured**`, `**read**` or `**assumed**` on the same line.
- [ ] **Step 7: Commit** `git add docs/evidence && git commit -m "Prompt coach Scope 3 reshape: evidence (scored once)"` + trailers.
- [ ] **Step 8: Lead re-runs the Check and compares the doc numbers to `score.log` and `L/logs/final/*`.**

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape" && node ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/score.js" --verify-log | tail -n 2 && grep -c -E "\*\*(measured|read|assumed)\*\*" docs/evidence/*-prompt-coach-scope3-reshape.md`
Expected: `SCORE nearmiss_warn=0/12 base_catch=<b>/12 branch_catch=<c>/12 gain=<c-b> ... verdict=PASS` (or `verdict=FAIL`, reported as is), and a mark count at least equal to the number of number-bearing lines (the lead counts those lines by `grep -c -E "[0-9]"` of the results section and requires marks >= that).

---

### Task 7: Final whole-branch review, fix round, stop for merge

Group: sequential. Tokens (assumed): 220k.

**Files:**
- Modify: only files named by an accepted review finding, within the locked-files limits above.
- Create (ledger): `L/reviews/opus.md`, `L/reviews/codex.md`, `L/reviews/merged.md`

**Interfaces:**
- Consumes: the whole branch (Tasks 2-6) against base 59b09c1; `score.log` scored SHA.
- Produces: merged finding list, fixes with tests, final guard rerun, hand-off.

- [ ] **Step 1: Opus review** (`studio-harness:final-reviewer`) of `git diff 59b09c1...HEAD` against spec rules 1-4 and the locked-files list. Reply at most 10 lines; full text to `L/reviews/opus.md`.
- [ ] **Step 2: Codex review** (`claudex-loop:codex-review`) of the same diff; full text to `L/reviews/codex.md`.
- [ ] **Step 3: Lead merges the lists** into `L/reviews/merged.md`, dropping duplicates and out-of-scope items (held-out tuning, option D, files.js, figure rule).
- [ ] **Step 4: Fix round.** Per accepted finding: a test that fails first, the fix, rerun. Nothing is tuned against the fresh held-out.
- [ ] **Step 5: Unscored changes.** Any engine change made after the scored SHA is listed as "unscored" in the evidence doc, in the same commit as the fix; held-out is not re-scored (`score.js` refuses).
- [ ] **Step 6: If the engine changed, rebuild dist and update the README byte count in the same commit** (as Task 5).
- [ ] **Step 7: Commit** fixes (`Prompt coach Scope 3 reshape: review fixes`) + trailers; push only the branch `worktree-prompt-coach-scope3-reshape` (slip allows), never merge. Re-run the Check.
- [ ] **Step 8: Hand-off PM step, then STOP for merge** (PushNotification, notify.mjs, ask in the session).

Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-reshape" && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" unit <71 + review-fix tests> 0 && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" guards && bash ".ledger/2026-10-19-prompt-coach-scope3-reshape/scripts/chk.sh" quiet && git status --short -- prompt-coach docs | wc -l`
Expected: `UNIT_OK pass=<total> fail=0`, `GUARDS_OK`, `QUIET_OK new_warn=0 ...`, `0`.

---

## Review dispositions (Opus R1)

- M1 (`coach().unsupported` does not exist): fixed. Global Constraints "How warnings are read"; every test in T2-T4 uses `run` + `unsupported` and asserts note text; `lib.js` in T1b; T1b Step 2 dry run proves a known warning row counts 1 and a known quiet row counts 0.
- M2 (`--verify-log` not built, retyped log, second run possible): fixed. T1b Interfaces: `score.js` writes its own log with SHA and timestamp, refuses a second run, `--verify-log` only prints; built before the seal (T1b Steps 1, 6).
- M3 (quiet rows have no build step and cannot fail): fixed. T1b Step 3 builds each set with recorded row counts; `quiet` prints a count per set and fails on shortfall; `quiet --selftest` with always-warn and base stubs (check table, T1b Steps 4, 7).
- M4 (T3 (f) was a guess): fixed. T3 Step 2: `explain9.js` extracts the 9 asks from `data/*.jsonl`, measures with the implemented rule, asserts skipped vs checked for numbered asks only, reports a differing split, never adjusts the rule.
- M5 (T4 (d) "protocol" proves nothing): fixed. T4 (d) uses "Geology survey" and expects a warning for category 12.
- M6 (blind writer can read the spec): fixed. T1a Steps 1-2: Write-only helper, one output path, tool calls audited into `writer_audit.md`.
- S1 (`CAT_CHANGE` wider than spec): fixed. T3 Interfaces and Global Constraints use the spec list exactly.
- S2 (`CAT_ASK` `/gi` lastIndex): fixed. T3 uses non-global copies; test (f) covers it.
- S3 (coach called without classifier pick): fixed. `lib.js` copies `run` including `C.pick` (same as the unit test and the page).
- S4 (T2 third test name): fixed. Exact names given; pattern matches all three.
- S5 (`# fail 0` also passes on 0 tests): fixed. Every Check A states exact pass and fail counts (T3 adds the base-pattern count k).
- S6 (T4 (c) lacked "Scope 3"): fixed. The sheet carries a "Scope 3 summary" line.
- S7 (reuse check only S/K): fixed. T1a Step 3 compares against all banned sets with a 20% shingle threshold set before running.
- S8 (locked files only reviewed): fixed. `guards` runs the `git diff --name-only` and removed-test-line commands.
- S9 (quiet only in T4): fixed. `quiet` runs in T2, T3, T4 Check B.
- S10 (post-score fixes make evidence stale): fixed. Scored SHA in `score.log`; T7 Step 5 lists "unscored" changes.
- S11 (`git status` count with untracked plan): fixed. Plan committed at approval (Global Constraints); T7 check narrows to `prompt-coach docs`.
- S12 (no xlsx/csv writer): fixed. T1a Step 4 says how to build both and requires row text from the real reader.
- S13 (lead authoring held-out content / leak): fixed. Writer gives exact cells and paragraphs; implementer and checker briefs are plan text only; checker shingle-diffs test strings against `items.json`.
- S14 (what "warn" means; verdict ignores quiet): fixed. Definition in Global Constraints; `score.js` prints held-out AND quiet.
- N1 (T1 too big): fixed. Split into T1a and T1b.
- N2 (`HEAD~1` diff scope): fixed. `git diff --stat HEAD` (uncommitted changes of the task).
- N3 (grep matches "already"): fixed. Greps `\*\*(measured|read|assumed)\*\*` with a per-number-line count.
- N4 (fixed trailer model): fixed. Trailer uses the model that made the commit.
- N5 (fixed evidence date): fixed. Date of the run.
