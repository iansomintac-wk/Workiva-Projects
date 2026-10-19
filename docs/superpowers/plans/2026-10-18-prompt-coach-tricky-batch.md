# Prompt Coach Scoring Rulebook and Tricky Batch Implementation Plan (rev 3, Ian-approved with 3 fixes)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach" && node tests/customer_check.js | tail -3 && node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E "^# (tests|pass|fail)"'
Data: prompt-coach/research/live-tests

**Goal:** One scoring rulebook for both scorers, a check that it removes the Opus/Codex split, then 24 live answers to six deliberately tricky prompts, scored and reported.

**Architecture:** Docs and data only. No change to `prompt-coach/engine/`, weights or rewrite. The ledger talk scripts grade prompts and print the coach's Strong rewrites. Live answers come from Ian's own Workiva sandbox, driven through Claude in Chrome by a separate driver session (as in the 2026-10-18 live test). Scoring is Opus (final) plus Codex (second), both blind to version, run and coach grade.

**Tech Stack:** Node (existing prompt-coach scripts, `node:test`), Codex CLI 0.162.0 (read-only, no shell), Claude in Chrome, Markdown, JSON, TSV.

**Spec:** `docs/superpowers/specs/2026-10-18-prompt-coach-tricky-batch-design.md` (read it with this plan). Run order: `docs/PROMPT_COACH_TRICKY_BATCH_RUN_PROMPT.txt`.

## Paths used below

- ROOT = `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites`
- PC = ROOT/prompt-coach; LT = PC/research/live-tests
- LEDGER = ROOT/.ledger/2026-10-18-prompt-coach-next; SCRIPTS = LEDGER/scripts; LOGS = LEDGER/logs (create it)
- OLD = ROOT/.ledger/2026-10-16-prompt-coach-rewrites/logs (old answers `live_<CASE>.md`, scores `live_<CASE>_scores.md`, `<CASE>_fixture_text.txt`)
- BASE = commit `1c6782b` (branch tip when the plan was written)
- Fixture text for keys, from OLD (case -> file, measured from cases.md by the plan review): FR-1 = fr_flux_q3.xlsx, FR-4 = fr_accruals.xlsx, GRC-2 = grc_access_policy.docx, GRC-3 = grc_test_results.xlsx, SUS-2 = sus_ghg_inventory.xlsx, SUS-3 = sus_supplier_data.csv.
- Score-file fields (10, measured in live_SUS-4_scores.md): found, false, extra, hard, table, invented, clarify, source, job, format. "Differs in any field" (the gate) means any of these 10; `found` is compared as the SET of items, not the count.

## Global Constraints

- Coach is not changed: nothing under `prompt-coach/engine/`, `weights.json`, `rewrite.js`, `web/`, `dist/`. Coach findings go in the results file only.
- Made-up fixtures only, Ian's own sandbox only (private folder "Prompt coach test - Ian"); no settings, sharing, deleting, or republishing; no customer data.
- Spend: none. Codex and Workiva AI usage only. Any paid call = stop. Claude helpers are permitted by the slip line (it limits paid tools).
- "Good answer" = keyed-found share at least .75, false 0, invented 1 (spec wording; "invented 1" is read as the invented field scoring 1, none invented, per the score files; Task 1 confirms against `live_SUS-2_scores.md`).
- Strong rewrite = the coach's Strong output as the page produces it, sent unfilled (blanks left as written), generated with the exact attachment set of that live prompt.
- 6 prompts x 2 versions (typed, Strong) x 2 runs = 24 answers, a fresh chat each. No more than 2 runs.
- Answers go verbatim to ledger log files, never into context. Sample claim: "on this set" only.
- Before the first Codex call read the studio-harness ledger gotchas `2026-10-14-codex-shell-blocked-on-windows` and `2026-10-17-codex-unelevated-sandbox-runs-on-windows`. Codex runs as `codex exec` read-only with no shell needed; each Codex score or re-score is a FRESH call with only whitelisted inputs pasted INLINE into the prompt (rulebook, key, fixture text, the prompt as sent, the answer), started from an empty temp folder outside the repo so it has no path to any score file (Task 2 step 3; Task 8 uses the same method).
- `node --test` takes explicit FILES, not a folder: gotcha `2026-10-16-node26-test-folder-arg-runs-nothing`. Always check the TAP `# tests` count is above 0 and `# fail 0`.
- Every check line below is `cd "<abs>" && ...` (or `bash -c '...'`), runnable from anywhere. Pipelines that must fail on an early error use `bash -c 'set -o pipefail; ...'`.
- Opaque ids: scorers see only ids `Q01`..`Q24` (map held by the lead in `LOGS/id_map.tsv`, columns qid, T, version, run). Version, run and coach grade are joined after scoring, in Task 9. The sent prompt text is shown to the scorer (needed for the table/format rule) so the version is inferable from it; the results file says so.

## Stops (lead pushes a notification, then asks Ian)

1. STOP-A plan approval: DONE (Ian approved rev 2 with the 3 fixes applied in this rev 3). Ian set the helper-token cap at 700k and approved the final T6 text as written (below).
2. STOP-B re-score GATE (end of Task 2): 3 or more of 6 rows differing in any of the 10 fields = stop, no live run.
3. STOP-C sandbox sign-in (start of Task 4): Ian signs in to his Workiva sandbox in Chrome and confirms the driver session.
4. STOP-D any spend, any push/merge the slip does not name, any Ian decision, two strikes on a failing check.

## Final T6 text (approved by Ian as written; Task 3 still tests that it grades strong)

`As a sustainability analyst, using only @sus_ghg_inventory.xlsx, calculate our Scope 3 category 11 (use of sold products) emissions for FY25. Show the method and every input with its source row in a short table (item, value, source row), then give the total in tCO2e. Keep it to one page, in a formal tone.`

No "say what is missing" clause (it would make a clean decline the prompt's own doing and rig the T6 prediction). Category 11 is absent from the inventory (SUS-2 text, measured by the plan review). If Task 3 finds this grades below strong, reword within these limits, at most 2 tries, never adding a missing-input clause; then show Ian the changed text (it is no longer the approved text).

## Task kinds, groups, helpers, cost

| Task | Kind | Who | Est. helper tokens (assumed) |
|---|---|---|---|
| 1 Rulebook | doc, Opus | helper 1 (Opus) | 50k |
| 2 Codex re-score + GATE | Codex x6 run by the lead; compare by helper | lead + helper 2 (Sonnet) | 30k |
| 3 Prompts, rewrites, keys (merged) | code + data | helper 3 (Sonnet) | 55k |
| 4 Run sheet, STOP-C, uploads | live setup | helper 4 (Sonnet) + driver | 20k |
| 5 Live T1-T3 (12) | LIVE | driver session (separate, Claude in Chrome) | driver ~150k own context |
| 6 Live T4-T6 (12) | LIVE | same driver | driver ~150k |
| 7 Opus scoring of 24 | Opus scoring | helper 5 (Opus) | 100k |
| 8 Codex second scoring | Codex x6 run by the lead | lead (Codex tokens, not a Claude helper) | 0 helper; Codex ~60k (assumed) |
| 9 Agreement + criteria | code + Opus | helper 6 (Sonnet) | 50k |
| 10 Results + README | doc, Opus | helper 7 (Opus) | 45k |

Helpers: 7 Claude helpers + 1 driver session + 12 Codex calls (6 re-score, 6 score) run by the lead. Helper total about 350k (assumed); driver about 300k in its own session (assumed); Codex about 100k (assumed); about 750k all told, against Ian's cap of 700k: the Codex share is metered separately, and if Claude helpers plus driver (about 650k assumed) approach 700k the lead stops and asks (STOP-D). No tune tasks.

Paid calls: none. Metered use is Codex CLI and Workiva AI in Ian's sandbox only (slip: spend none). Anything else = STOP-D.

Locked files: `prompt-coach/engine/`, `prompt-coach/web/`, `prompt-coach/dist/`, `prompt-coach/tests/`, `prompt-coach/data/`, `LT/cases.json`, `LT/cases.md`, `LT/make_cases.js`, `LT/make_live_fixtures.js`, every fixture in `LT/fixtures/` except `answer_key.json`, and the old ledger `.ledger/2026-10-16-prompt-coach-rewrites/`.

LOCK CHECK (run at the end of Tasks 3 and 10; expected: no output from either command):
`cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git diff --name-only 1c6782b -- prompt-coach/engine prompt-coach/web prompt-coach/dist prompt-coach/tests prompt-coach/data prompt-coach/research/live-tests/cases.json prompt-coach/research/live-tests/cases.md prompt-coach/research/live-tests/make_cases.js prompt-coach/research/live-tests/make_live_fixtures.js prompt-coach/research/live-tests/fixtures .ledger/2026-10-16-prompt-coach-rewrites ':!prompt-coach/research/live-tests/fixtures/answer_key.json'`
`cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git status --porcelain -- prompt-coach/engine prompt-coach/web prompt-coach/dist prompt-coach/tests prompt-coach/data prompt-coach/research/live-tests/cases.json prompt-coach/research/live-tests/cases.md prompt-coach/research/live-tests/make_cases.js prompt-coach/research/live-tests/make_live_fixtures.js prompt-coach/research/live-tests/fixtures .ledger/2026-10-16-prompt-coach-rewrites ':!prompt-coach/research/live-tests/fixtures/answer_key.json'`

## Expected breaks

(none) | no existing test reads the T-keys or the README live-test line; Task 9 step 6 greps to confirm, and the Suite runs at the end of Task 10.

---

### Task 1: Rulebook SCORING_RULES.md   [doc, Opus]

**Files:**
- Create: `prompt-coach/research/live-tests/SCORING_RULES.md`, `LOGS/rulings_found.txt`, `LOGS/rescore_pick.tsv`
- Read: OLD `live_SUS-2_scores.md`, `live_SUS-4_scores.md`, `live_FR-4_scores.md`, `live_FR-1_scores.md`, `live_GRC-4_scores.md`, `SCRIPTS/vs_codex.tsv`, `LT/fixtures/answer_key.json`, `LT/results/2026-10-18-live-test-results.md`

**Interfaces:**
- Produces: `SCORING_RULES.md` with rules R1-R9 (Tasks 2, 7, 8 hand it to both scorers); `rescore_pick.tsv` (the 6 rows Task 2 re-scores, picked FIRST so the rulebook can avoid them).

- [ ] **Step 1:** `mkdir -p` LOGS. From `vs_codex.tsv` pick the 2 most-split rows per case (SUS-4, GRC-4, FR-1) by the count of differing fields among the 10; ties: lower row id. Write `rescore_pick.tsv` (case, row id, fields that differed, count).
- [ ] **Step 2:** Read the five score files; list every ruling (SUS-2, SUS-4 rulings a-h, FR precedents) in `rulings_found.txt`.
- [ ] **Step 3:** Write `SCORING_RULES.md`: purpose line, the 10 score fields as the score files use them, rules R1-R9. R1 invented = a company fact (value, name, entity, event) found nowhere in the file. R2 a wrong statement about something that IS in the file, or a wrong framework reference, is false, not invented. R3 an assessment, sufficiency judgment or general-practice statement is an extra, not false. R4 hard = Y only when the hard item is itself found. R5 found never exceeds the key count. R6 table/format is 0/1 against what the prompt asked. R7 for keys where the file does not support the ask (T3, T6), found = the answer says so, and any figure given for the ask is invented. R8 score from the answer text only. R9 where no rule decides, write "unruled" and the reason. Each rule gets one example; examples may quote rulings from SUS-2, FR-4 and other cases but NEVER any row of SUS-4, GRC-4 or FR-1 (blindness of Task 2: the rulebook is built from those cases' rulings in general terms, with no row quoted).
- [ ] **Step 4:** Add a "Good answer" section: keyed-found share at least .75, false 0, invented 1, in the score files' field terms.
- [ ] **Step 5:** Checks:
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -c -E "^(#+ )?R[1-9]\b" prompt-coach/research/live-tests/SCORING_RULES.md` -> `9`
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -c -i -E "TBD|TODO|fill in|live_SUS-4|live_GRC-4|live_FR-1" prompt-coach/research/live-tests/SCORING_RULES.md` -> `0`
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -c . .ledger/2026-10-18-prompt-coach-next/logs/rescore_pick.tsv` -> `6` or `7` (6 rows, optional header)
- [ ] **Step 6:** Commit: `git add prompt-coach/research/live-tests/SCORING_RULES.md && git commit -m "Prompt coach: scoring rulebook for both scorers"` (attribution lines from the session reminder).

Test that fails on the parent: the first grep outputs nothing and exits 2 (file absent).

---

### Task 2: Codex re-score of 6 old answers and the GATE   [Codex run by the lead + Sonnet compare; STOP-B]

**Files:**
- Create: `LOGS/rescore_part_<n>_prompt.txt`, `LOGS/rescore_part_<n>_answer.txt`, `LOGS/rescore_in_<n>.txt` (6 each, n = 1..6 in `rescore_pick.tsv` order), `LOGS/rescore_codex_<n>.txt` (6), `LOGS/rescore_compare.md`
- Read: `rescore_pick.tsv`, OLD answers `live_SUS-4.md`, `live_GRC-4.md`, `live_FR-1.md`, `<CASE>_fixture_text.txt`, `LT/fixtures/answer_key.json`, `SCORING_RULES.md`; Opus rows from OLD `_scores.md` are read ONLY in step 5

**Interfaces:**
- Consumes: Task 1. Produces: `rescore_compare.md` ending `GATE: <n> of 6 rows differ`.

- [ ] **Step 1:** Cut the prompt and the answer of each picked row out of the `live_<CASE>.md` section named in `rescore_pick.tsv` into `rescore_part_<n>_prompt.txt` and `rescore_part_<n>_answer.txt` (those sections carry no scores; confirm). Build each `rescore_in_<n>.txt` by concatenating ONLY: the rulebook, that case's key entry, the case's fixture text, the two parts, and the ask "score this answer on the 10 fields, in the TSV row format given".
- [ ] **Step 2:** Blindness check on the inputs: no Opus score values and no copied score-table rows. Run:
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && node -e "const fs=require('fs');const d='.ledger/2026-10-18-prompt-coach-next/logs/';let bad=[];const cells=l=>l.split('|');const tableRow=l=>{const c=cells(l);return c.length>=4&&c.some(x=>/^\s*(\d+|Y|N)\s*$/.test(x))};for(let n=1;n<=6;n++){const all=fs.readFileSync(d+'rescore_in_'+n+'.txt','utf8');if(/vs Codex|Opus-final|_scores\.md|\|\s*(found|false|extra|hard|invented)\s*\|/i.test(all))bad.push(n+':marker');for(const p of ['prompt','answer']){const t=fs.readFileSync(d+'rescore_part_'+n+'_'+p+'.txt','utf8');if(t.split('\n').some(tableRow))bad.push(n+':'+p+':tablerow')}}console.log(bad.length,bad.join(' '))"` -> `0 ` . The row test (3 or more `|` cells holding digits, Y or N) is applied to the prompt and answer parts only, because the fixture text legitimately has pipe-delimited rows. A hit in an answer part is reviewed by the lead and cleared only if it is the answer's own table, not a score row; a marker hit anywhere is fatal for that input (rebuild it). Also `wc -c` of each `_answer.txt` above 300 (the answer text is really there).
- [ ] **Step 3:** Read the two Codex gotchas. For each n the lead makes an empty temp folder outside the repo: `mkdir -p "$CLAUDE_JOB_DIR/tmp/rescore_<n>"` and confirms it is empty (`ls -A` prints nothing). It runs `codex exec` read-only, no shell, with that folder as its working directory (`-C` or `cd`), skipping the git-repo check, and the whole `rescore_in_<n>.txt` text passed inline (stdin), so Codex has no path to any score file; output copied to `LOGS/rescore_codex_<n>.txt`. Each is a fresh call. Failure twice on one row = two strikes.
- [ ] **Step 4:** Check each output contains a parseable score row: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -l -E "invented" .ledger/2026-10-18-prompt-coach-next/logs/rescore_codex_*.txt | wc -l` -> `6`; any file lacking it was an error or refusal and is re-run once, not scored.
- [ ] **Step 5:** Helper 2 compares each Codex row with the Opus-final row in the OLD `_scores.md` over all 10 fields, `found` as an item set. Writes `rescore_compare.md`: 6 rows, each differing field with reason, last line `GATE: <n> of 6 rows differ`.
- [ ] **Step 6:** **STOP-B.** `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -c "^GATE: [0-6] of 6 rows differ" .ledger/2026-10-18-prompt-coach-next/logs/rescore_compare.md` -> `1`. If n is 3 or more: notify Ian and stop (prediction: at most 2). Otherwise note it in progress.md and go on. Ledger only; nothing to commit.

---

### Task 3: Prompts, grades, Strong rewrites, then keys T1-T6   [code + data edit; merged old Tasks 3+4]

**Files:**
- Create: `SCRIPTS/tricky_all.js`, `SCRIPTS/keycheck.js`, `LOGS/tricky_grades.txt`, `LOGS/tricky_strong_all.txt`, `LOGS/tricky_prompts.json`, `LOGS/tricky_findings.txt`, `LOGS/key_proofs.txt`
- Modify: `prompt-coach/research/live-tests/fixtures/answer_key.json` (append T1..T6; existing keys untouched)
- Reuse unchanged: `SCRIPTS/grade_tricky.js`, `SCRIPTS/rewrite_tricky.js` (first argument = the prompt-coach folder)

**Interfaces:**
- Produces: `tricky_all.js <promptCoachFolder> <strongOutFile>`, so argv[2] = folder, argv[3] = output file. Prints `T<n> | <files> | <typed grade>` lines to stdout (= `tricky_grades.txt`). Writes `T<n> [<strong grade>] <strong prompt>` blocks, blank-line separated, to argv[3] (= `tricky_strong_all.txt`; its `[grade]` is the Strong version's coach grade, used in Task 9), and writes `LOGS/tricky_prompts.json` as `{T1:{files:[...],prompt:"..."},...}` next to it. Keys T1..T6 in `answer_key.json` carry `job`, `found`, `hard`, `optional`, `mustNotClaim`, `proof`, plus `files` (the attachment set) and `prompt` (typed text, equality-checked in step 6).

Prompt table (typed text; files = exact attachment set used in the live chat and for the rewrite):
T1 `fr_flux_q3.xlsx` `variances?`; T2 `fr_accruals.xlsx` `hey so cud u chek the accruals file thing and like see whats off, i think somethings wrong w/ a couple of them maybe idk`; T3 `fr_flux_q3.xlsx` `what will our stock price do next quarter based on this`; T4 `grc_test_results.xlsx` + `grc_access_policy.docx` `Summarize our access policy, list the failed tests in the attached results, and draft an email to the control owners about remediation.`; T5 `sus_supplier_data.csv` `Which suppliers are missing emissions data?`; T6 `sus_ghg_inventory.xlsx` the Final T6 text above.

- [ ] **Step 1:** Baseline with the unchanged talk script, comparing typed grades to the spec's (T1 weak, T2 weak, T3 weak, T4 better, T5 weak):
  `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && node .ledger/2026-10-18-prompt-coach-next/scripts/grade_tricky.js "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach" | grep -E "^T[1-5] " | grep -c -E "weak|better"'` -> `5`; compare each grade to the spec list by eye. The two talk scripts call `M.predict` with different options (`{}` vs `{mode:weights.mode}`); step 2 uses ONE detect for both typed and Strong grading.
- [ ] **Step 2:** Create `tricky_all.js`: requires as in the two talk scripts; one `detect = (p)=>{const r=M.predict(p,weights,{mode:weights.mode});return{on:r.on,d:r.rules}}` used for typed AND Strong grades (the page's options); array of six `[id, [file names], prompt]` from the table above, T4 with BOTH files; typed grade `R.grade(detect(prompt).on)`; Strong = `W.coach(p,{files:files.map(n=>({name:n})),detect,...C.pick(p,CLS)}).stages.strong.prompt` (string, else `JSON.stringify`); outputs as in Interfaces.
- [ ] **Step 3:** Run it and check:
  `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && node .ledger/2026-10-18-prompt-coach-next/scripts/tricky_all.js "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach" .ledger/2026-10-18-prompt-coach-next/logs/tricky_strong_all.txt | tee .ledger/2026-10-18-prompt-coach-next/logs/tricky_grades.txt | grep -c -i "weak"'` -> at least `2` (talk: 5 weak, 1 better; the spec check is at least 2 typed weak)
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep "^T6" .ledger/2026-10-18-prompt-coach-next/logs/tricky_grades.txt` -> a line whose grade is the strong grade (talk: T6 typed rated strong). If not, reword T6 within the limits above; a third failure = report to the lead.
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -c "^T[1-6] \[" .ledger/2026-10-18-prompt-coach-next/logs/tricky_strong_all.txt` -> `6`
- [ ] **Step 4:** Read the Strong text (do not fix): `tricky_findings.txt` with blank count per prompt and the spec's known issues (T2 typos kept, T4 file naming now both files are passed, T5 wrong template, T1 bare sentence, T3 forecast still asked, anything new on T6).
- [ ] **Step 5:** Confirm each fixture file's contents by its OLD fixture text (mapping in Paths). `ls` the OLD fixture texts first; if one is missing, extract with the method in OLD `plant_check.cjs`. Write each key's `proof` strings (verbatim lines) and `found` items; T3 and T6: `found` = ["the file does not support the ask","no figure given"], `mustNotClaim` includes any made-up number or a stock-price direction (T3) / a category 11 total (T6). If a file does not support a key as the spec describes, stop and report; fixtures are not changed. Rehearse the edit (block below), then append T1-T6 with `files` and `prompt`.
- [ ] **Step 6:** Create `keycheck.js <answer_key.json> <ledgerLogsDir> <oldLogsDir>`, exit non-zero unless: (a) every T1..T6 `proof` string is a substring of the mapped OLD fixture text; (b) the pre-existing keys deep-equal `git show 1c6782b:prompt-coach/research/live-tests/fixtures/answer_key.json`; (c) each T key's `prompt` and `files` equal `tricky_prompts.json`. Check:
  `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && node .ledger/2026-10-18-prompt-coach-next/scripts/keycheck.js prompt-coach/research/live-tests/fixtures/answer_key.json .ledger/2026-10-18-prompt-coach-next/logs .ledger/2026-10-16-prompt-coach-rewrites/logs | tail -4'` -> `proof misses: 0`, `old keys changed: 0`, `prompt mismatches: 0`, `keys: 6 added`. On the parent the same command exits non-zero (script absent). Then run LOCK CHECK (both commands) -> no output. Commit: `git add prompt-coach/research/live-tests/fixtures/answer_key.json && git commit -m "Prompt coach tricky batch: keys T1-T6"` (attribution lines).

```rehearse
node -e "const fs=require('fs');const p='prompt-coach/research/live-tests/fixtures/answer_key.json';const k=JSON.parse(fs.readFileSync(p,'utf8'));console.log(Object.keys(k).length)"
git diff --stat -- prompt-coach/research/live-tests/fixtures/answer_key.json
```

---

### Task 4: Run sheet, id map, sign-in, uploads   [live setup; STOP-C]

**Files:**
- Create: `LOGS/run_sheet.md`, `LOGS/id_map.tsv` (qid, T, version, run), `LOGS/driver_upload_report.txt`
- Read: `LOGS/tricky_strong_all.txt`, `LOGS/tricky_prompts.json`, `docs/PROMPT_COACH_LIVE_TEST_RESUME_PROMPT.txt`, `.ledger/2026-10-16-prompt-coach-rewrites/progress.md` (driver lines)

**Interfaces:**
- Produces: `run_sheet.md` rows `| Q<nn> | text sent | @ files |` (24, qid only, no version, no T number), and the lead-held `id_map.tsv`.

Driver method (as in the 2026-10-18 live test): a separate driver session with Claude in Chrome (earlier Ian launched `claude --bg --chrome` himself; the lead then sends the brief by SendMessage so the driver's own permission check fires). Windows Chrome, Ian's own sandbox (workspace id starts `w_ce824c6e`), private folder "Prompt coach test - Ian" (Ian only). Upload, not Import. Fresh chat per prompt, files attached by typing `@` and picking each chip, Strong prompts sent unfilled, clarification questions logged (not answered beyond "continue").

- [ ] **Step 1:** Assign Q01..Q24 in a fixed shuffled order (a node one-liner with a fixed seed, so reruns agree): for each T the four runs typed-r1, strong-r1, typed-r2, strong-r2, then permute the 24 so the same prompt's runs are not adjacent. Write `id_map.tsv`. Build `run_sheet.md` from `tricky_prompts.json` (typed) and `tricky_strong_all.txt` (Strong), text copied exactly.
- [ ] **Step 2:** Check:
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -c -E "^\| Q(0[1-9]|1[0-9]|2[0-4]) \|" .ledger/2026-10-18-prompt-coach-next/logs/run_sheet.md` -> `24`
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && node -e "const a=require('fs').readFileSync('.ledger/2026-10-18-prompt-coach-next/logs/id_map.tsv','utf8').trim().split('\n').filter(l=>/^Q\d\d\t/.test(l));console.log(a.length,new Set(a.map(l=>l.split('\t')[0])).size)"` -> `24 24`
- [ ] **Step 3:** **STOP-C.** Notify Ian; he signs in to his Workiva sandbox (Windows Chrome) and confirms the driver session id; if uploads are refused he runs `/add-dir` for the fixtures folder in the driver, as last time. Nothing starts before his yes.
- [ ] **Step 4:** Driver uploads any of the 6 fixture files missing from the private folder (check by name first) and writes `driver_upload_report.txt` with the six names it saw.
- [ ] **Step 5:** Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -c -E "fr_flux_q3.xlsx|fr_accruals.xlsx|grc_test_results.xlsx|grc_access_policy.docx|sus_supplier_data.csv|sus_ghg_inventory.xlsx" .ledger/2026-10-18-prompt-coach-next/logs/driver_upload_report.txt` -> at least `6`. Nothing to commit.

---

### Task 5: Live runs, first 12 answers (T1-T3)   [LIVE via the driver session]

**Files:**
- Create: `LOGS/live_T1.md`, `LOGS/live_T2.md`, `LOGS/live_T3.md` (sections `## Q<nn>`: sent text, send time, chips, any clarification, then the answer verbatim)
- Read: `LOGS/run_sheet.md`, `LOGS/id_map.tsv` (lead only, to tell the driver which qids go in which file)

**Interfaces:**
- Consumes: Task 4. Produces: verbatim logs Tasks 7-8 score. The lead never reads answers into context.

- [ ] **Step 1:** Lead sends the driver a brief (SendMessage): run the listed qids, fresh chat each, attach files with `@`, send the text exactly, wait until the answer finishes, copy it verbatim to the named log file under `## Q<nn>`, log any clarification or read error. Safety: own sandbox only; no settings, sharing or deleting; stop and report on a sign-in prompt, any billing or upgrade prompt (= spend, STOP-D), or any file that looks like customer data.
- [ ] **Step 2:** Driver runs the 12 qids of T1-T3 (per `id_map.tsv`) and replies with a table: qid, sent time, chips shown, clarification y/n, read errors.
- [ ] **Step 3:** Fingerprint (no content read):
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && cat .ledger/2026-10-18-prompt-coach-next/logs/live_T1.md .ledger/2026-10-18-prompt-coach-next/logs/live_T2.md .ledger/2026-10-18-prompt-coach-next/logs/live_T3.md | grep -c "^## Q[0-9][0-9]"` -> `12`
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && wc -c .ledger/2026-10-18-prompt-coach-next/logs/live_T1.md .ledger/2026-10-18-prompt-coach-next/logs/live_T2.md .ledger/2026-10-18-prompt-coach-next/logs/live_T3.md | tail -4` -> each file at least 1500 bytes; a section under about 100 characters means a failed answer: re-ask that qid once.
- [ ] **Step 4:** Sent-text check: a small node script (`SCRIPTS/sentcheck.js <run_sheet.md> <live_T*.md...>`, created here) compares the "sent:" line of each `## Q<nn>` to the run-sheet row; output `mismatches: 0`.
- [ ] **Step 5:** Record rows done and any non-standard event in progress.md. Nothing to commit.

---

### Task 6: Live runs, last 12 answers (T4-T6)   [LIVE via the driver session]

**Files:**
- Create: `LOGS/live_T4.md`, `LOGS/live_T5.md`, `LOGS/live_T6.md` (same layout)
- Read: `LOGS/run_sheet.md`, `LOGS/id_map.tsv`

**Interfaces:**
- Produces: the other 12 answers (declines are logged verbatim).

- [ ] **Step 1:** Same brief for the T4-T6 qids (T4 attaches two files).
- [ ] **Step 2:** Driver runs them and replies with the same table.
- [ ] **Step 3:** Fingerprint:
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && cat .ledger/2026-10-18-prompt-coach-next/logs/live_T4.md .ledger/2026-10-18-prompt-coach-next/logs/live_T5.md .ledger/2026-10-18-prompt-coach-next/logs/live_T6.md | grep -c "^## Q[0-9][0-9]"` -> `12`
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && cat .ledger/2026-10-18-prompt-coach-next/logs/live_T*.md | grep -c "^## Q[0-9][0-9]"` -> `24`
- [ ] **Step 4:** `sentcheck.js` over T4-T6 -> `mismatches: 0`.
- [ ] **Step 5:** Record in progress.md. Nothing to commit.

---

### Task 7: Opus scoring of the 24 (final scorer)   [Opus scoring]

**Files:**
- Create: `SCRIPTS/tsvcheck.js`, `LOGS/scores_opus_T1.md`..`T6.md`, `LOGS/scores_opus_all.tsv`, `LOGS/scores_opus_unruled.txt`
- Read: `SCORING_RULES.md`, keys T1-T6, `LOGS/live_T<n>.md`, the mapped OLD fixture text

**Interfaces:**
- `tsvcheck.js <file.tsv>`: columns exactly `qid keyN found foundItems false extra hard table invented clarify source job format` (tab-separated, one header line); exits non-zero unless there are exactly 24 data rows, unique ids Q01..Q24, all 13 columns, and `found` an integer not above `keyN` (R5). Prints `rows: 24 ok` or the first problem.
- Produces: `scores_opus_all.tsv` in that layout.

- [ ] **Step 1:** Write `tsvcheck.js`. Test it on synthetic files in a scratch folder under LOGS: a valid 24-row file prints `rows: 24 ok`; the same with a duplicate id, a missing id, or `found` above `keyN` exits non-zero. (A grep for a tab does not work in Git Bash; this script is the check.)
- [ ] **Step 2:** Dispatch one fresh Opus scorer given only: the rulebook, keys, fixture text, each answer under its qid with the prompt as sent. Not given version, run, coach grade, the id map, or any Codex output. It writes per-prompt files, the TSV and the unruled list.
- [ ] **Step 3:** Check:
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && node .ledger/2026-10-18-prompt-coach-next/scripts/tsvcheck.js .ledger/2026-10-18-prompt-coach-next/logs/scores_opus_all.tsv` -> `rows: 24 ok`
  `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -c . .ledger/2026-10-18-prompt-coach-next/logs/scores_opus_unruled.txt` -> a number (record; above 4 means a rulebook gap: report it in the results file, do not edit the rulebook mid-batch)
- [ ] **Step 4:** The lead spot-checks 3 rows against the answer text (found never above the key count): names in progress.md. Nothing to commit.

---

### Task 8: Codex second scoring of the 24   [Codex, run by the lead; blind to Task 7]

**Files:**
- Create: `LOGS/codex_in_T<n>.txt` (6), `LOGS/codex_out_T<n>.txt` (6), `LOGS/scores_codex_all.tsv`

**Interfaces:**
- Consumes: the same whitelisted inputs as Task 7 (never anything from `scores_opus_*`). Produces: `scores_codex_all.tsv`, same layout.

- [ ] **Step 1:** Per prompt build `codex_in_T<n>.txt`: rulebook, that key, fixture text, the four answers under their qids with the prompt as sent, the TSV row format. No version, run, grade or map.
- [ ] **Step 2:** Pattern check on the inputs: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -l -i -E "scores_opus|id_map|opus-final|vs codex" .ledger/2026-10-18-prompt-coach-next/logs/codex_in_T*.txt | wc -l` -> `0`. (Words like "typed" can legitimately sit inside a prompt being scored, so they are not in the pattern.)
- [ ] **Step 3:** The lead runs a fresh `codex exec` per file the same way as Task 2 step 3: from an empty temp folder outside the repo (`$CLAUDE_JOB_DIR/tmp/score_<n>/`), read-only, no shell, the input inline on stdin; output to `codex_out_T<n>.txt`. Two failures on one = two strikes.
- [ ] **Step 4:** Merge to `scores_codex_all.tsv`; `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && node .ledger/2026-10-18-prompt-coach-next/scripts/tsvcheck.js .ledger/2026-10-18-prompt-coach-next/logs/scores_codex_all.tsv` -> `rows: 24 ok`
- [ ] **Step 5:** Nothing to commit.

---

### Task 9: Agreement and the success-criteria numbers   [code with tests + Opus]

**Files:**
- Create: `SCRIPTS/agree.js`, `SCRIPTS/agree.test.js`, `SCRIPTS/old_rows.tsv`, `LOGS/criteria.md`
- Read: both TSVs, `LOGS/id_map.tsv`, `LOGS/tricky_grades.txt` (typed grades), `LOGS/tricky_strong_all.txt` (Strong grades, in the `[grade]` of each block), OLD `live_*_scores.md` (12 of them), `LT/results/2026-10-18-live-test-results.md`

**Interfaces (agree.js exports, CommonJS):**
- `differs(rowA, rowB)` -> boolean, true when any of the 10 fields differs, `found` compared via `foundItems` as a set.
- `isGood(row)` -> `found/keyN >= 0.75 && false == 0 && invented == 1`.
- `betterCount(rows)` -> number of the 6 prompts whose Strong version has a higher good-answer share than typed (rows carry `T`, `version`, `good`).
- `shareByGrade(rows)` -> `{weak:{n,good,share}, better:{...}, strong:{...}}`. Each answer is grouped by the coach grade OF THE PROMPT VERSION IT RAN: a typed answer by its typed prompt's grade, a Strong answer by that prompt's Strong grade (rows carry `grade`, set by the CLI from the id map: version typed -> typed grade from `tricky_grades.txt`, version strong -> Strong grade from `tricky_strong_all.txt`).
- `t6Invented(rows)` -> `{typed:n of 2, all:n of 4}` counting `invented == 0`.
- CLI: `node agree.js <opus.tsv> <codex.tsv> <id_map.tsv> <grades.txt> <strong_all.txt> [old_rows.tsv]` prints `rows differ: <n> of 24`, the per-prompt table, the per-grade table (new 24, then old rows beside it), the T6 line.

- [ ] **Step 1 (tests first):** Write `agree.test.js` with `node:test` and synthetic rows with ASSERTED results: (a) identical rows -> `differs` false; one changed `hard` -> true; same `found` count with different `foundItems` -> true; (b) isGood: found 3 of 4, false 0, invented 1 -> true; found 2 of 4 -> false; false 1 -> false; invented 0 -> false; (c) `betterCount` over 6 synthetic prompts where Strong beats typed in exactly 4 -> 4, and a variant with 2 -> 2; (d) `shareByGrade` over a 12-row synthetic set where each row's `grade` is the grade of the version it ran (4 rows graded weak with 2 good; 4 better with 3 good; 4 strong with 1 good) -> weak .5, better .75, strong .25; plus a mixed case: a prompt whose typed version is weak and Strong version is strong puts its typed answers in `weak` and its Strong answers in `strong` (counts n asserted); (e) `t6Invented`: one typed answer with invented 0 -> `{typed:1, all:1}`; none -> 0. Run:
  `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && node --test --test-reporter=tap .ledger/2026-10-18-prompt-coach-next/scripts/agree.test.js | grep -E "^# (tests|pass|fail)"'` -> fails first (module absent, non-zero exit); a script that always prints 0 cannot pass these.
- [ ] **Step 2:** Implement `agree.js`; the same command -> `# tests` above 0, `# pass` equal to tests, `# fail 0` (exit 0):
  `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && node --test --test-reporter=tap .ledger/2026-10-18-prompt-coach-next/scripts/agree.test.js | grep -E "^# (tests|pass|fail)"'`
- [ ] **Step 3:** Build `old_rows.tsv` from the 12 OLD `_scores.md` tables (Opus-final columns), same layout plus the coach grade of the prompt version each old answer ran (spec: 13 originals "better", 26 Strong rewrites "strong" on the 39 tested prompts; read). Count and parse the rows actually present and report that number (do not assume 72). This is the measured comparison column.
- [ ] **Step 4:** Run on the real pair:
  `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && node .ledger/2026-10-18-prompt-coach-next/scripts/agree.js .ledger/2026-10-18-prompt-coach-next/logs/scores_opus_all.tsv .ledger/2026-10-18-prompt-coach-next/logs/scores_codex_all.tsv .ledger/2026-10-18-prompt-coach-next/logs/id_map.tsv .ledger/2026-10-18-prompt-coach-next/logs/tricky_grades.txt .ledger/2026-10-18-prompt-coach-next/logs/tricky_strong_all.txt .ledger/2026-10-18-prompt-coach-next/scripts/old_rows.tsv | tail -30'` -> prints `rows differ: <n> of 24` (prediction: 7 or fewer, under 1 in 3), the per-prompt table, the per-grade tables, the T6 line.
- [ ] **Step 5:** Write `criteria.md`: one line per spec criterion (gate result from Task 2, rewrite helps in at least 4 of 6, rating agrees, T6, scorer agreement, sample), prediction, result, held/disproved, each number marked measured (computed just now) or read.
- [ ] **Step 6:** `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -l -E "answer_key|live-test" prompt-coach/tests/*.js | wc -l` -> record it; above 0 means read those files and list any break for the lead. Nothing to commit.

---

### Task 10: Results file, README line, suite, commit   [doc, Opus]

**Files:**
- Create: `prompt-coach/research/live-tests/results/<date>-tricky-batch-results.md` (date = day of writing, `YYYY-MM-DD`)
- Modify: `prompt-coach/README.md` line 81 (the "Live test:" line)
- Read: `LOGS/criteria.md`, `LOGS/rescore_compare.md`, `LOGS/tricky_findings.txt`

**Interfaces:**
- Consumes: Task 9. Produces: the committed deliverable.

- [ ] **Step 1:** Write the results file: what was done (6 prompts x 2 versions x 2 runs = 24, Ian's own sandbox, driver via Claude in Chrome, scorers saw opaque ids but the prompt text, so version was inferable); the rulebook and the gate result; each spec prediction next to its result (held / disproved), measured or read; Opus-Codex agreement; the "unruled" rows; coach findings from `tricky_findings.txt` (not fixed here); sample stated plainly ("on this set"); open questions for Ian.
- [ ] **Step 2:** Edit `prompt-coach/README.md` line 81 in the same commit: append a sentence naming the tricky batch, `research/live-tests/SCORING_RULES.md` and the new results file; fix any count nearby that is now wrong.
- [ ] **Step 3:** Run the Suite (header command) -> `customer_check` ends with its pass line, then `# tests <n>` with n above 0, and `# fail 0`; `pipefail` makes an early error fail the command.
- [ ] **Step 4:** Criteria present: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && grep -c -i -E "held|disproved" prompt-coach/research/live-tests/results/*-tricky-batch-results.md` -> at least `5`.
- [ ] **Step 5:** Run LOCK CHECK (both commands) -> no output.
- [ ] **Step 6:** Commit results + README together: `git add prompt-coach/research/live-tests/results prompt-coach/README.md && git commit -m "Prompt coach tricky batch: results and README line"` (attribution lines). No push; final review (Opus + Codex), fix round and merge belong to the lead per the slip.

---

## Self-review (spec coverage)

- Scope 1 -> Task 1. Scope 2 -> Task 2 (gate). Scope 3 -> Tasks 3-6. Scope 4 -> Tasks 7-9. Scope 5 -> Task 10.
- Success criteria: gate (Task 2); rewrite helps, rating agrees, T6, scorer agreement, sample (Tasks 9-10).
- Out of scope respected: LOCK CHECK in Tasks 3 and 10.

## Spec ambiguities resolved

1. T6's typed text is in no file (script has `fix this`): Task 3 uses the Final T6 text above, approved by Ian.
2. "invented 1" read as the invented field scoring 1 (none invented), confirmed in Task 1.
3. Live logs go to LOGS (ledger), per the run prompt.
4. Scorers cannot be fully version-blind (they need the sent text for R6); only labels are hidden. The results file says so.

## Review fixes (F1-F12 and rev 3 -> where)

- F1 argument contract: Task 3 Interfaces (`tricky_all.js <folder> <out>`, argv[2], argv[3]); step 3 command has no stray `x`.
- F2 lock check: "LOCK CHECK" section after Locked files; run in Task 3 step 6 and Task 10 step 5 (real absolute path, `git diff --name-only 1c6782b -- ...` plus `git status --porcelain -- ...`, expected empty).
- F3 agree.js tests: Task 9 steps 1-2 (`agree.test.js`, asserted synthetic cases for differs, good-answer thresholds, betterCount 4 vs 2, grade shares, T6).
- F4 blind re-score: Task 1 steps 1 and 3 (6 rows picked first; no row of SUS-4, GRC-4, FR-1 quoted; grep check) and Task 2 steps 1-3 (whitelisted inputs inline). REV 3: Task 2 step 3 runs Codex from an empty temp folder outside the repo (`$CLAUDE_JOB_DIR/tmp/rescore_<n>/`) with all inputs inline, and step 2's check rejects copied score-table rows (3 or more `|` cells holding digits/Y/N in the prompt and answer parts) as well as score markers. Task 8 step 3 uses the same method.
- F5 TSV validation: Task 7 `tsvcheck.js` (24 unique ids), reused in Task 8; no tab grep anywhere.
- F6 order: prompts merged before keys in Task 3; step 6 checks key `prompt` equals the script's prompt.
- F7 key proofs: Task 3 step 6 `keycheck.js` (proof substrings in fixture text, old keys unchanged vs 1c6782b).
- F8 T4 attachments: Task 3 step 2 passes both T4 files to the rewrite; key `files` records the set.
- F9 opaque ids: Global Constraints "Opaque ids", Task 4 step 1, Tasks 7-8, join in Task 9. REV 3: Task 9 `shareByGrade` groups each answer by the coach grade of the version it ran (typed grade for typed, Strong grade for Strong, joined from the id map; the CLI now also takes `tricky_strong_all.txt`), with a mixed-case test.
- F10 suite: header `Suite:` and Task 3 checks use `bash -c 'set -o pipefail; ...'`; Task 10 step 3 asserts tests above 0 and fail 0. REV 3: Task 9 steps 1, 2 and 4 node commands are wrapped in `bash -c 'set -o pipefail; ...'`.
- F11 cost: merged Tasks 3+4, one driver session, lead runs Codex calls; estimate about 350k helper (assumed) plus about 300k driver and about 100k Codex (assumed); 7 Claude helpers, 1 driver, 12 Codex calls. REV 3: Ian's cap is 700k (Stops and cost sections).
- F12 T6: "Say which inputs the file does not give" dropped; final text in the "Final T6 text" section, approved by Ian as written (rev 3).
- Opus should-fixes applied: S1 (T6), S2 (one detect), S3 (merge), S4 (opaque ids; limit stated), S5 (10 fields, found as set), S6 (keycheck mapping), S7 (Task 2 step 4 grep), S9 (old_rows.tsv), S10 (no bc).
