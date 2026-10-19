# Fit Finder top-3 cards and Workiva AI sandbox check Implementation Plan (revision 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not tick boxes during the run (progress goes in the ledger).

Suite: bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder && node tests/catalogue.test.js'
Data: fit-finder/data/top3/, fit-finder/data/catalogue.json, fit-finder/sandbox/

**Goal:** Show the three closest cards on the Fit Finder page, measure on a fresh blind set whether that helps without more wrong cards, and test eight cards against Workiva AI in the sandbox with made-up files.

**Architecture:** A fresh blind set is written by a top-model helper that never sees the engine or the `match` patterns, and is committed with a sha256 file before any code change. The scorer gains a "right card anywhere in the 3 shown" count and an "any wrong card shown" count (tests first, then sanity-checked on the tune set); the blind set is scored once on the parent. The page gets a three-card list and a card switch (pagetest checks first, red then green). A sandbox kit (eight made-up files with five planted items each, the page's own prompt per card, a scoring sheet, one batched paste message) goes to Ian in one message; replies are scored, failing cards' text is fixed and only those are re-run. The engine is untouched, so the end score must equal the parent score; a freeze check proves it. Tasks run one at a time, in order.

**Tech Stack:** Node (no dependencies), JSONL, headless Chrome through `tests/pagetest.js`, bash, git.

**Spec:** `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/docs/superpowers/specs/2026-10-19-fit-finder-top3-sandbox-design.md` (the authority). Run order, stops and data care: `docs/TOP3_SANDBOX_RUN_PROMPT.txt`.

## Paths used below

- W = `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test` (branch `fit-finder-top3`)
- FF = `W/fit-finder`
- L = `W/.ledger/2026-10-19-top3-sandbox` (git-ignored; always `git add` named files, never `-A`)
- BASE = the Task 1 commit sha (the "parent commit" for the one-time scores); Task 1 step 7 writes it to `L/base.txt`
- Step tags: `[IMPL]` writes files; `[CHECK]` is read-only and each such command is a line the lead puts in `role-checks.txt` verbatim; `[LEAD]` is a dispatch, a stop or a decision.

## Global Constraints

- Write every code file (`.js`, `.sh`) with the Write tool, copying the plan's block exactly; never through a shell heredoc or echo (on this machine the Bash tool turns `\\` into `\`, measured 2026-10-18).
- Node 26: every test command names files, never folders (a folder arg runs nothing). Every check states a non-zero pass count.
- Chain required checks with `&&`, never `;` (a later success hides an earlier failure). Where a red state is expected, the command ends `|| echo "red: exit $?"` so the failure is shown, not hidden. Shape gates assert and exit non-zero; they do not just echo.
- Never open, print or quote `fit-finder/data/real/` or `C:/Users/teasp/Documents/workiva-sealed/`. `tests/catalogue.test.js` reads two files under `fit-finder/data/real/` and prints only counts: the lead and local Claude helpers may run it (as earlier runs did) and must never print or quote real rows; outside reviewers (Codex) must not run it, nor `tests/prompts-strong.test.js`, nor `tests/synth-score.js`.
- Never re-score `fit-finder/data/synth/2026-10-19-blind.jsonl` or `fit-finder/data/synth/2026-10-18-holdout.jsonl`. The new set (`fit-finder/data/top3/`) is scored exactly twice in the whole run: Task 2 step 8 (parent) and Task 7 step 1 (end). Nothing in between. The tune set `fit-finder/data/synth/2026-10-18-tune.jsonl` may be scored freely (Task 2 step 6, scorer sanity check). `tests/prompts-strong.test.js` globs `data/synth/*.jsonl`; the new set lives in `data/top3/` on purpose, so that test never runs the engine over it.
- Every reviewer or checker prompt (Opus, Codex, Sonnet checkers) says: do not open `fit-finder/data/real/`, `.ledger/` or `C:/Users/teasp/Documents/workiva-sealed/`; do not score `2026-10-19-blind.jsonl`, `2026-10-18-holdout.jsonl` or anything in `fit-finder/data/top3/`; do not run `tests/synth-score.js`. Reviewers get a safe-command allowlist (Task 8 step 1).
- No engine keyword-rule changes: `fit-finder/engine/fit.js` and every catalogue card's `id`, `area`, `ops` and `match` stay identical to BASE (proved by `tests/match-frozen.js`, Task 2). Rule C stays; the page keeps "couldn't tell".
- Sandbox files are made up. No real, customer or Workiva-internal data in them.
- The page change is local; nothing is published, pushed or merged by this plan. Ian decides on customers after the evidence doc.
- Say which numbers were measured now and which were read. (read) = from `docs/evidence/2026-10-19-share-ready.md` or the spec; (measured) = run by the plan author or a reviewer with read-only commands; (assumed) = reasoned, the executor verifies at the step.
- Commits use `git commit -F <file>`; the file is the subject line, a blank line, then these two trailer lines (a real newline between them): `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` then `Claude-Session: https://claude.ai/code/session_016u4eV5qCAP3YCBj49ZzHgP`. A session whose own reminder gives different lines uses those.

## Baselines

- (measured) Catalogue holds 26 cards: FR 7, GEN 6, GRC 9, SUS 4. Only 15 have a non-null `prompt`; the 11 with `"prompt": null` are `fr-tie-out`, `fr-xbrl-errors`, `fr-8k`, `gen-formula`, `gen-wdata`, `gen-translate`, `grc-test-steps`, `grc-issues`, `grc-control-from-risk`, `grc-flowchart`, `sus-disclosure`. 52 lines match `^\s*"(id|task)"` in `catalogue.json` and none contains `match`.
- (measured) `git show HEAD:fit-finder/dist/fit-finder.html | wc -c` = 91503 (LF as committed). `core.autocrlf=true` and there is no `.gitattributes`; the working-copy dist is CRLF and larger. Count bytes with `git show :<path> | wc -c` after `git add`.
- (measured) `synth-score.test.js` has 14 assertions. `pagetest.js` has two widths (1280, 375) and prints its summary line before its FAIL lines.
- (read) At fde835b: catalogue test prints "all catalogue checks pass"; prompts-strong "all prompts strong"; edge cards "edge cards pass (29)"; eval B 45/60 75.0%; fit-finder pagetest 98 checks, 0 failed; prompt-coach pagetest 12 checks; prompt-coach unit 29 pass; customer check PASS 229; GRADE acc 0.856, flips 8. The plan author did not re-run suites; the executor re-measures them in Task 8.
- (read) Tune-set evidence in the spec: first card right 17 of 29 with a gold card, right card anywhere in the top 3: 20 (gain 3); suite line "first card right 23 of 35".

## Cost

- Paid tools: none. Usage only (no money). Paid calls listed: none. Model calls (usage, not billed per call): Task 1 Opus writer helper (MODEL OVERRIDE: labels decide the outcome); Task 4 Sonnet kit writer; Task 8 Opus final reviewer and one read-only Codex review; Sonnet implementers for Tasks 2, 3, 6, 7, 9 and Sonnet checkers on every `[CHECK]` step.
- Helper tool-call cap for the whole run: 250 (writer 25, kit writer 40, the rest for implementers, checkers and reviewers). A helper stops at its own cap and reports.
- Helper-token estimate (rough, input plus output): T1 60k, T2 50k, T3 75k, T4 120k, T5 30k, T6 45k, T7 45k, T8 150k, T9 25k. Run total about 600k tokens.
- Groups: none (tasks run one at a time, in order; they share one worktree and one git index). Tune tasks: none (no number is tuned; the engine is frozen).

## Locked files (nobody edits these after the task that creates them)

- After Task 1: `fit-finder/data/top3/2026-10-19-top3.jsonl`, `fit-finder/data/top3/card-gold-top3.jsonl`, `fit-finder/data/top3/2026-10-19-top3.sha256`, `.gitattributes`.
- After Task 2: `fit-finder/tests/synth-score.js`, `fit-finder/tests/synth-score.test.js`, `fit-finder/tests/match-frozen.js`.
- After Task 4: `fit-finder/tests/sandbox-kit.js`, `fit-finder/tests/sandbox-kit.test.js`, the `planted` items and the files of `fit-finder/sandbox/key.json` (Task 6 may add or change `fill` entries only).
- Always: `fit-finder/engine/fit.js`, every card's `id`/`area`/`ops`/`match` in `fit-finder/data/catalogue.json`, `fit-finder/data/LABELING.md`, every existing `fit-finder/data/*.jsonl` and `fit-finder/data/synth/*`, `fit-finder/data/real/`, `prompt-coach/`.

---

### Task 1: Fresh blind set, written by a top-model helper, committed with a sha256 (spec C)

**Files:**
- Create: `L/cards-for-labeller.md`, `L/shape-gate.sh`, `FF/data/top3/2026-10-19-top3.jsonl`, `FF/data/top3/card-gold-top3.jsonl`, `FF/data/top3/2026-10-19-top3.sha256`, `W/.gitattributes`, `L/base.txt`
- Locked: everything in "Always".

**Interfaces:**
- Produces: prompts `{"id":"X1","task":"..."}` (38 to 44 rows); gold `{"id":"X1","fit":"good|partial|not","cards":["<card id>",...],"by":"model","conf":"high|low"}` one per line, compact JSON; a `not` row has `"cards":[]`. Both files LF. The sha256 file holds two lines checked with `cd FF/data/top3 && sha256sum -c 2026-10-19-top3.sha256`. `.gitattributes` has one line `fit-finder/data/top3/* -text` so other checkouts keep LF and the hashes hold. BASE = the commit of these files.

- [ ] **Step 1: [IMPL] Build the card sheet the writer may read (ids and one-line tasks only, no `match`).**
```bash
bash -c 'set -e -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; grep -E "^\s*\"(id|task)\"" fit-finder/data/catalogue.json | cut -c1-400 > .ledger/2026-10-19-top3-sandbox/cards-for-labeller.md; [ "$(wc -l < .ledger/2026-10-19-top3-sandbox/cards-for-labeller.md)" -eq 52 ] && [ "$(grep -ci match .ledger/2026-10-19-top3-sandbox/cards-for-labeller.md)" -eq 0 ] && echo sheet-ok'
```
Expected: `sheet-ok`, exit 0.

- [ ] **Step 2: [IMPL] Write the shape gate `L/shape-gate.sh`** (Write tool; it asserts, exits non-zero on the first failure, prints one OK line at the end; it never scores):
```bash
#!/usr/bin/env bash
# Shape gate for the fresh blind set. Asserts; exit 1 on the first failure. Does not score anything.
set -e -o pipefail
D=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder/data
P=$D/top3/2026-10-19-top3.jsonl; G=$D/top3/card-gold-top3.jsonl
fail() { echo "SHAPE-FAIL: $1"; exit 1; }
n=$(wc -l < "$P")
[ "$n" -ge 38 ] && [ "$n" -le 44 ] || fail "row count $n not in 38..44"
[ "$n" -eq "$(wc -l < "$G")" ] || fail "prompt and gold row counts differ"
[ "$(grep -Evc '^[{]"id":"X[0-9]+","task":".+"[}]$' "$P")" -eq 0 ] || fail "a prompt row has the wrong shape"
[ "$(grep -Evc '^[{]"id":"X[0-9]+","fit":"(good|partial|not)","cards":[[]("[a-z0-9-]+"(,"[a-z0-9-]+")*)?[]],"by":"model","conf":"(high|low)"[}]$' "$G")" -eq 0 ] || fail "a gold row has the wrong shape"
diff <(grep -o '"id":"X[0-9]*"' "$P") <(grep -o '"id":"X[0-9]*"' "$G") > /dev/null || fail "prompt and gold ids differ or are in a different order"
[ "$(grep -o '"id":"X[0-9]*"' "$P" | sort | uniq -d | wc -l)" -eq 0 ] || fail "duplicate ids"
f=$(grep -cE '"fit":"(good|partial)"' "$G") || true
k=$(grep -c '"fit":"not"' "$G") || true
[ $((f + k)) -eq "$n" ] || fail "fit + not != rows"
[ "$f" -ge 28 ] && [ "$k" -ge 8 ] || fail "need at least 28 that fit and 8 that do not (got $f and $k)"
[ "$(grep '"fit":"not"' "$G" | grep -c '"cards":[[]"')" -eq 0 ] || fail "a not-a-fit row lists cards"
[ "$(grep -c "$(printf '\r')" "$P" "$G" | grep -vc ':0$')" -eq 0 ] || fail "CR characters found (files must be LF)"
used=$(grep -o '"cards":[[][^]]*[]]' "$G" | grep -o '"[a-z0-9]*-[a-z0-9-]*"' | tr -d '"' | sort -u)
known=$(grep -oE '"id": "[a-z0-9-]+"' "$D/catalogue.json" | sed 's/.*: "//;s/"//' | sort -u)
[ "$(comm -23 <(echo "$used") <(echo "$known") | wc -l)" -eq 0 ] || fail "unknown card id in gold"
d=$(echo "$used" | wc -l)
[ "$d" -ge 12 ] || fail "only $d distinct cards used (need 12)"
t() { sed 's/.*"task":"//' "$1"; }
[ "$(cat <(t "$P") <(t "$D/synth/2026-10-19-blind.jsonl") <(t "$D/synth/2026-10-18-tune.jsonl") <(t "$D/synth/2026-10-18-holdout.jsonl") | sort | uniq -d | wc -l)" -eq 0 ] || fail "a task line equals a line in an older set"
echo "SHAPE-OK rows=$n fit=$f not=$k distinct_cards=$d"
```
(The older sets are read only for exact-duplicate lines; nothing is scored.)

- [ ] **Step 3: [LEAD] Dispatch the writer.** The dispatch's first line is `MODEL OVERRIDE: labels decide the outcome`; model Opus, fresh context. The dispatch is self-contained (the writer must not read this plan). Body:

"Read only (1) `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder/data/LABELING.md` and (2) `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-19-top3-sandbox/cards-for-labeller.md` (26 cards: id, and what job each is for). Do not open anything else: not `fit-finder/engine/`, `catalogue.json`, `fit-finder/tests/`, `docs/`, any other file under `fit-finder/data/`, `fit-finder/data/real/`, `.ledger/` (except that one file) or `workiva-sealed`. Write about 40 sentences a Workiva customer might type about their own work in financial reporting, GRC or sustainability, in their own words and varied phrasing (questions, commands, first person, with and without time words), covering a wide range of the 26 cards. Aim for 28 to 32 that fit (good or partial) and 8 to 12 that do not (judgment, sign-off, exact calculation, other systems, chasing people, one-offs). Do not copy phrases from the card sheet. Label each by LABELING.md. `cards` lists every card that is right to show for the sentence. A card is right to show only if its task is the job the sentence describes, so that card's prompt would serve this person as is; a related card that would need a different job is not right. List every card that qualifies, and none if none does (always none for `not`). Write exactly two files with the Write tool, one JSON object per line, compact, LF line endings, ids X1, X2, ...: `fit-finder/data/top3/2026-10-19-top3.jsonl`, one line per sentence like `{"id":"X1","task":"<one sentence>"}`, and `fit-finder/data/top3/card-gold-top3.jsonl`, one line per sentence like `{"id":"X1","fit":"good","cards":["<card id>"],"by":"model","conf":"high"}` (`fit` is good, partial or not; `by` is always model; `conf` is high or low; a not-a-fit row is `{"id":"X2","fit":"not","cards":[],"by":"model","conf":"low"}`). Reply in at most 6 lines: the counts only."

- [ ] **Step 4: [CHECK] Run the shape gate.**
```bash
bash -c 'set -o pipefail; bash C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-19-top3-sandbox/shape-gate.sh'
```
Expected: one line `SHAPE-OK rows=<38..44> fit=<>=28> not=<>=8> distinct_cards=<>=12>`, exit 0. On a `SHAPE-FAIL`, send the writer one correction round that quotes only the `SHAPE-FAIL` text (shape feedback only: never anything derived from the engine or scores), then re-run; the lead never edits rows or labels.

- [ ] **Step 5: [CHECK] The writer stayed blind: audit its actual tool calls, not its report.** The lead takes the writer's transcript file `T` (the sub-agent transcript the harness keeps) and lists every tool-call input path or command (assumed JSONL format: the lead adapts the extraction, not the assertion):
```bash
bash -c 'set -o pipefail; T=<writer transcript path>; grep -oE "\"(file_path|path|pattern|command)\":\"[^\"]*\"" "$T" | sort -u | grep -ciE "engine|catalogue\.json|tests/|docs/|data/real|sealed|synth/|card-gold|tasks\.jsonl" | grep -qx 0 && echo blind-ok'
```
Expected: `blind-ok`, exit 0. (This greps tool-call inputs only, not the dispatch text, which names the forbidden paths.) The permitted tool-call paths are exactly `LABELING.md`, `cards-for-labeller.md` and the two output files. If anything else appears, discard the set and re-dispatch once with a fresh helper.

- [ ] **Step 6: [IMPL] Write the sha256 file and `.gitattributes`, and check both.** Write `W/.gitattributes` (Write tool) containing the single line `fit-finder/data/top3/* -text`. Then:
```bash
bash -c 'set -e -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder/data/top3 && sha256sum 2026-10-19-top3.jsonl card-gold-top3.jsonl > 2026-10-19-top3.sha256 && [ "$(sha256sum -c 2026-10-19-top3.sha256 | grep -c ": OK")" -eq 2 ] && cd ../../.. && git add .gitattributes fit-finder/data/top3 && [ "$(git ls-files --eol fit-finder/data/top3 | grep -c "i/lf")" -ge 3 ] && echo hashes-ok'
```
Expected: `hashes-ok`, exit 0.

- [ ] **Step 7: [IMPL] Commit (before any page or engine change) and record BASE.** Message file subject: "Top-3: fresh blind set (X1..), gold labels and sha256, written by a top-model helper blind to the engine".
```bash
bash -c 'set -e -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git commit -q -F .ledger/2026-10-19-top3-sandbox/msg1.txt && git rev-parse HEAD | tee .ledger/2026-10-19-top3-sandbox/base.txt && [ "$(git show --stat --format= HEAD | grep -c "|")" -eq 4 ]'
```
Expected: a 40-hex sha, exit 0 (4 files: `.gitattributes`, the two data files, the sha256 file). `ledger-add` one line: set committed, sha, row counts; no score yet.

### Task 2: Top-3 counts in the scorer and a freeze check, tests first; sanity on the tune set; the one-time parent score

**Files:**
- Modify: `FF/tests/synth-score.test.js`, `FF/tests/synth-score.js`
- Create: `FF/tests/match-frozen.js`, `L/parent-score.txt`
- Locked: the Task 1 data files, the engine, `catalogue.json`.

**Interfaces:**
- Consumes: BASE from `L/base.txt`; the Task 1 data files.
- Produces: `node tests/synth-score.js prompts.jsonl gold.jsonl --top3` (flag last) prints the existing line unchanged and then a second line, exactly: `top 3: right card anywhere in the 3 shown X of F that fit (first card right R, gain G); any wrong card shown A of n (ids); first card wrong or on a not-a-fit prompt B; rise in wrong lists D`. Definitions: shown = `match(task, catalogue)` (up to 3 ids). A fit row is right in the top 3 when it shows a card that is in its gold `cards`, or shows no card and its gold `cards` is empty (the same rule that makes "first card right" = F - wrong - missed; so X counts "rightly none" rows too). R = existing first card right. G = X - R. A = rows (all rows) where at least one shown card is not in the row's gold `cards` (a not-a-fit row has `cards: []`, so any shown card counts). B = existing wrong + existing card on a not-a-fit prompt. D = A - B. Without `--top3` the output is the old single line. `node tests/match-frozen.js --base <sha>` prints `match-frozen PASS` (exit 0) or `match-frozen FAIL: ...` (exit 1).

- [ ] **Step 1: [IMPL] Write the new assertions first.** In `FF/tests/synth-score.test.js` change the `run` helper to take extra arguments, and add seven assertions before the `fs.rmSync` line. Replace the `run` helper with:
```js
const run = (prompts, gold, extra = []) => {
  const p = path.join(dir, 'p' + n + '.jsonl'), g = path.join(dir, 'g' + n + '.jsonl');
  fs.writeFileSync(p, text(prompts)); fs.writeFileSync(g, text(gold));
  return spawnSync(process.execPath, [script, p, g, ...extra], { encoding: 'utf8' });
};
```
and insert before `fs.rmSync(dir, { recursive: true, force: true });`:
```js
// --top3: the right card anywhere in the 3 shown, and any wrong card shown
const { match } = require('../engine/fit.js');
const multi = cat.useCases.find((u) => match(u.try, cat).length >= 2);
const shown = multi ? match(multi.try, cat).map((x) => x.id) : [];
const PM = [{ id: 'M1', task: multi ? multi.try : 'zzqx' }];
const gold = (fit, cards) => [{ id: 'M1', fit, cards, by: 'model', conf: 'high' }];
const second = (r) => (r.stdout.split('\n')[1] || '') + '\n';
ok('top3: a card sample with two or more matches exists', !!multi);
ok('top3: first card shown is in the gold', /^top 3: right card anywhere in the 3 shown 1 of 1 that fit \(first card right 1, gain 0\); any wrong card shown 1 of 1 \(M1\); first card wrong or on a not-a-fit prompt 0; rise in wrong lists 1\n$/.test(second(run(PM, gold('good', [shown[0]]), ['--top3']))), 'shown ' + shown.join(','));
ok('top3: a gold card at rank 2 counts as right in the 3', /^top 3: right card anywhere in the 3 shown 1 of 1 that fit \(first card right 0, gain 1\); any wrong card shown 1 of 1 \(M1\); first card wrong or on a not-a-fit prompt 1; rise in wrong lists 0\n$/.test(second(run(PM, gold('good', [shown[1]]), ['--top3']))));
ok('top3: no wrong card when the gold lists every shown card', /^top 3: right card anywhere in the 3 shown 1 of 1 that fit \(first card right 1, gain 0\); any wrong card shown 0 of 1 \(\); first card wrong or on a not-a-fit prompt 0; rise in wrong lists 0\n$/.test(second(run(PM, gold('good', shown), ['--top3']))));
ok('top3: a card shown on a not-a-fit row is a wrong card', /^top 3: right card anywhere in the 3 shown 0 of 0 that fit \(first card right 0, gain 0\); any wrong card shown 1 of 1 \(M1\); first card wrong or on a not-a-fit prompt 1; rise in wrong lists 0\n$/.test(second(run(PM, gold('not', []), ['--top3']))));
ok('top3: rows with no card shown (missed, and rightly none)', /^top 3: right card anywhere in the 3 shown 0 of 1 that fit \(first card right 0, gain 0\); any wrong card shown 0 of 2 \(\); first card wrong or on a not-a-fit prompt 0; rise in wrong lists 0\n$/.test(second(run(P, G, ['--top3']))));
ok('top3: without the flag the output is still one line', run(PM, gold('good', [shown[0]])).stdout.split('\n').filter(Boolean).length === 1);
```

- [ ] **Step 2: [CHECK] Red proof (the flag is not implemented at the parent).**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/synth-score.test.js | tail -7 || echo "red: exit $?"'
```
Expected: five lines starting `FAIL top3:` (not the "exists" one, not the "without the flag" one), the last line `synth-score tests FAILED: 5 of 21`, then `red: exit 1`. (assumed: 5 of 21; if different, report the real count and titles; do not edit the test.)

- [ ] **Step 3: [IMPL] Implement `--top3`.** In `FF/tests/synth-score.js`, after the final `console.log(...)` line (line 40), append:
```js
if (process.argv.includes('--top3')) {
  const shownIds = (r) => match(r.task, cat).map((u) => u.id);
  const inThree = fit.filter((r) => { const s = shownIds(r); return s.length ? s.some((c) => want(r).includes(c)) : !want(r).length; });
  const anyWrong = rows.filter((r) => shownIds(r).some((c) => !want(r).includes(c)));
  const R = fit.length - wrong.length - missed.length, B = wrong.length + notShown.length;
  console.log(`top 3: right card anywhere in the 3 shown ${inThree.length} of ${fit.length} that fit (first card right ${R}, gain ${inThree.length - R}); any wrong card shown ${anyWrong.length} of ${rows.length} (${ids(anyWrong)}); first card wrong or on a not-a-fit prompt ${B}; rise in wrong lists ${anyWrong.length - B}`);
}
```
(The flag is read from anywhere in argv, but `[pf, gf]` are the first two args, so pass the flag last.)

- [ ] **Step 4: [CHECK] Green.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/synth-score.test.js | tail -2'
```
Expected: `synth-score tests pass: 21`, exit 0.

- [ ] **Step 5: [IMPL] Write `FF/tests/match-frozen.js`, then prove it passes against BASE and fails against an older base.**
```js
/* node tests/match-frozen.js --base <sha>
   Exit 0 only if engine/fit.js and every catalogue card's id, area, ops and match (in order) are identical to <sha>.
   These are everything match() reads from the catalogue. Other fields may differ. */
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const i = process.argv.indexOf('--base');
const base = i >= 0 ? process.argv[i + 1] : '';
const bad = [];
if (!base) bad.push('no --base given');
else {
  const git = (a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
  const d = git(['diff', '--quiet', base, '--', ':(top)fit-finder/engine/fit.js']);
  if (d.status !== 0) bad.push('engine/fit.js differs from ' + base + ' (git diff exit ' + d.status + ')');
  const g = git(['show', base + ':fit-finder/data/catalogue.json']);
  if (g.status !== 0) bad.push('cannot read the catalogue at ' + base);
  else {
    const m = (c) => JSON.stringify(c.useCases.map((u) => [u.id, u.area, u.ops, u.match]));
    const now = JSON.parse(fs.readFileSync(path.join(root, 'data/catalogue.json'), 'utf8'));
    if (m(JSON.parse(g.stdout)) !== m(now)) bad.push('catalogue id/area/ops/match differs from ' + base);
  }
}
console.log(bad.length ? 'match-frozen FAIL: ' + bad.join(' | ') : 'match-frozen PASS');
process.exit(bad.length ? 1 : 0);
```
Check:
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/match-frozen.js --base $(cat ../.ledger/2026-10-19-top3-sandbox/base.txt) && ((node tests/match-frozen.js --base 2993c5e || true) | grep -c "engine/fit.js differs.*catalogue id/area/ops/match differs")'
```
Expected: `match-frozen PASS`, then `1` (the older base shows both reasons: the share-ready run changed the engine and 18 `match` lines), exit 0. If the second prints `0` the check is blind to one branch: stop and report.

- [ ] **Step 6: [CHECK] Scorer sanity on the tune set (allowed: the engine was tuned on it; the blind set is untouched).**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl --top3 | tee ../.ledger/2026-10-19-top3-sandbox/tune-sanity.txt | cut -c1-260 && grep -c "that fit (first card right 23, gain 3)" ../.ledger/2026-10-19-top3-sandbox/tune-sanity.txt'
```
Expected: the suite line starting `first card right: 23 of 35`, the `top 3:` line containing `of 35 that fit (first card right 23, gain 3)`, then `1`, exit 0 (the gain 3 is the lead's independent measurement 17 to 20, read from the spec; the 23 is the suite line, read). If the numbers differ the scorer or the assumption is wrong: stop before step 8 (the blind set must not be scored by a scorer that fails its sanity check) and report. Record this line's `rise in wrong lists` value in the ledger: it is the prior for the disproof clause.

- [ ] **Step 7: [IMPL] Commit the scorer, its tests and the freeze check.** Subject: "Top-3: scorer counts the right card anywhere in the 3 shown and any wrong card; engine freeze check". `git add fit-finder/tests/synth-score.js fit-finder/tests/synth-score.test.js fit-finder/tests/match-frozen.js` (named), `git commit -F <msgfile>`.

- [ ] **Step 8: [CHECK] The one-time parent score (exactly once; the output file is the record).**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; (cd data/top3 && [ "$(sha256sum -c 2026-10-19-top3.sha256 | grep -c ": OK")" -eq 2) && node tests/match-frozen.js --base $(cat ../.ledger/2026-10-19-top3-sandbox/base.txt) && node tests/synth-score.js data/top3/2026-10-19-top3.jsonl data/top3/card-gold-top3.jsonl --top3 | tee ../.ledger/2026-10-19-top3-sandbox/parent-score.txt | cut -c1-260 && [ "$(wc -l < ../.ledger/2026-10-19-top3-sandbox/parent-score.txt)" -eq 2 ]'
```
Expected: `match-frozen PASS`, then two lines (the first starts `first card right:`, the second starts `top 3:`), exit 0. The numbers are not known in advance. `ledger-add` the two lines as the recorded parent score. Do not run this command again anywhere.

### Task 3: Three-card list and card switch on the page, pagetest checks first (spec A)

**Files:**
- Modify: `FF/tests/pagetest.js`, `FF/web/template.html`, `FF/dist/fit-finder.html` (rebuilt, not hand-edited)
- Locked: the engine, the catalogue, the scorer.

**Interfaces:**
- Consumes: `FitEngine.match(text, FitCatalogue)` (up to 3 cards), `FitEngine.patternPrompt(text, card)`, `FitCatalogue.surfaces[card.surfaces[0]].steps`.
- Produces: in `#where`, the label `closest sourced use cases: pick the one that matches your work` (when 2 or 3 cards; unchanged `closest sourced use case` for one card; unchanged `where in Workiva AI` fallback), the chosen card expanded as today (its `h3` is the card's `task`), and one `button.alt` per other card holding the card's `task` and, after a dash, its feature name (no badge, no `h3`). Clicking an `.alt` makes that card the chosen card; `#fuller` and `#firstTry` follow it. Typing a new task, Try it, an example or a list pick goes back to the first card. Pagetest grows by 10 checks per width (20 in all): 98 -> 118.
- Fixture: no single catalogue sample gives three cards (measured by a reviewer), so the test builds two deterministic inputs by joining three catalogue `try` sentences (in catalogue order, first hit wins) such that `match` returns exactly three cards, the third card has a non-null fuller prompt and its fuller prompt differs from the first card's. The found texts are printed in the check detail.

- [ ] **Step 1: [IMPL] Add the checks to `FF/tests/pagetest.js`,** immediately before the line `// layout + capture`:
```js
      // three closest cards: a list; picking the third makes it the chosen card; the prompt really changes
      const fix = await ev(`(() => { const C = FitCatalogue, E = FitEngine, ts = C.useCases.map((u) => u.try), out = []; for (const a of ts) for (const b of ts) for (const c of ts) { if (out.length >= 2 || a === b || b === c || a === c) continue; const s = a + ' ' + b + ' ' + c; if (E.rate(s).fit === 'not') continue; const m = E.match(s, C); if (m.length !== 3) continue; const p1 = E.patternPrompt(s, m[0]), p3 = E.patternPrompt(s, m[2]); if (!p3 || p3 === p1) continue; out.push({ s, ids: m.map((u) => u.id) }); } return out; })()`);
      const J = (x) => JSON.stringify(x);
      check(W, 'two fixed sample tasks that give three close cards exist', fix.length === 2, 'found ' + fix.length);
      const M = fix[0] || { s: 'x', ids: [] }, M2 = fix[1] || { s: 'x', ids: [] };
      const U = `const U = (id) => FitCatalogue.useCases.find((u) => u.id === id) || {};`;
      const top = await ev(`(async () => { ${U} await setTask(${J(M.s)}); const ids = ${J(M.ids)}; return { label: t('#where .label'), h3: t('#where h3'), alts: q('#where .alt').map((a) => a.textContent), plain: q('#where .alt .avail, #where .alt h3').length === 0, tasks: ids.map((i) => U(i).task) }; })()`);
      check(W, 'list label asks the person to pick', /closest sourced use cases: pick the one that matches your work/.test(top.label), top.label);
      check(W, 'first card expanded, the other two as one-line cards', top.alts.length === 2 && top.h3 === top.tasks[0] && top.alts.some((a) => a.includes(top.tasks[1])) && top.alts.some((a) => a.includes(top.tasks[2])), J({ h3: top.h3, alts: top.alts }).slice(0, 120));
      check(W, 'one-line cards carry no badge or heading', top.alts.length === 2 && top.plain);
      const sw = await ev(`(async () => { ${U} const ids = ${J(M.ids)}, s = ${J(M.s)}; await setTask(s); const before = t('#fuller'); const alt = q('#where .alt')[1]; if (alt) alt.click(); await new Promise((r) => setTimeout(r, 300)); const c3 = U(ids[2]), steps = ((FitCatalogue.surfaces[(c3.surfaces || [])[0]] || {}).steps) || []; const fp = FitEngine.patternPrompt(s, c3); return { clicked: !!alt, h3: t('#where h3'), want: c3.task, alts: q('#where .alt').map((a) => a.textContent), tasks: ids.map((i) => U(i).task), li: q('#firstTry li').map((x) => x.textContent), steps, ftHidden: document.getElementById('firstTry').hidden, before, fuller: t('#fuller'), fp, fHidden: document.getElementById('fullerPanel').hidden }; })()`);
      check(W, 'clicking the third card makes it the chosen card', sw.clicked && sw.h3 === sw.want, J(sw.h3).slice(0, 60));
      check(W, 'the other two cards are now the one-line cards', sw.clicked && sw.alts.length === 2 && sw.alts.some((a) => a.includes(sw.tasks[0])) && sw.alts.some((a) => a.includes(sw.tasks[1])));
      check(W, 'first try follows the chosen card', sw.clicked && (sw.steps.length ? !sw.ftHidden && J(sw.li) === J(sw.steps) : sw.ftHidden || sw.li.length === 0));
      check(W, 'fuller prompt changes to the chosen card prompt', sw.clicked && !!sw.fp && !sw.fHidden && sw.fuller === '\u201c' + sw.fp + '\u201d' && sw.fuller !== sw.before);
      const back = await ev(`(async () => { ${U} await setTask(${J(M2.s)}); return { h3: t('#where h3'), want: U(${J(M2.ids[0] || '')}).task }; })()`);
      check(W, 'typing a new task goes back to its first card', sw.clicked && !!back.want && back.h3 === back.want, J(back.h3).slice(0, 60));
      const none = await ev(`(async () => { const c = ['Every month I read the draft board pack and list the open questions.', 'Each quarter I check the draft memo for typos and inconsistent terms.', 'I proofread the weekly newsletter for spelling mistakes every week.'].find((s) => { const r = FitEngine.rate(s); return r.fit !== 'not' && r.ops.length && FitEngine.match(s, FitCatalogue).length === 0; }); if (!c) return null; await setTask(c); return { h3: t('#where h3'), alts: q('#where .alt').length }; })()`);
      check(W, 'a task with no close card keeps the chat fallback and no list', !!none && none.h3 === 'Ask Workiva AI chat about your file' && none.alts === 0, J(none));
      await ev(`setTask(${J(M.s)})`); // so the layout check and the capture below include the three-card list
```
(If none of the three fallback sentences qualifies, the implementer picks another plain-English sentence whose `rate` is not `not` and whose `match` is empty, edits the array, and records it in the ledger. If the fixture search finds fewer than two inputs, the check fails by design: the implementer reports it and the lead decides; no template change can fix it.)

- [ ] **Step 2: [CHECK] Red proof against the current dist (not rebuilt).**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/pagetest.js C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-19-top3-sandbox/captures | grep -E "checks,|^FAIL" || echo "red: exit $?"'
```
Expected: `118 checks, 16 failed`, then FAIL lines (eight titles per width: list label, first card expanded, no badge, clicking the third card, the other two cards, first try, fuller prompt, typing a new task), then `red: exit 1`. The fixture-exists and fallback checks pass on the old page. (assumed: exactly 16; if different, report the real number and titles. Do not open the PNGs.)

- [ ] **Step 3: [IMPL] Edit `FF/web/template.html`.** (a) CSS: after the line starting `.where .src {` (line 95) add:
```css
.where ul.alts { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 8px; }
.where button.alt { width: 100%; text-align: left; font: inherit; font-size: 14.5px; color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; cursor: pointer; }
.where button.alt:hover { border-color: var(--ink); }
.where button.alt .alt-feat { color: var(--muted); }
```
(b) State: after `let rep = 'auto';` add `let chosen = 0, lastText = '';`. (c) In `render()`: in the empty-text branch add `lastText = '';` before the `return`; replace the lines from `const uc = ...` through `firstTry(...)` with:
```js
    const uc = r.fit === 'not' ? [] : FitEngine.match(text, FitCatalogue);
    if (text !== lastText) { chosen = 0; lastText = text; }
    if (chosen >= uc.length) chosen = 0;
    const cur = uc[chosen];
    where(r, uc, chosen);
    $('starterPanel').hidden = !r.prompt; $('coachLine').hidden = !r.prompt;
    $('starter').textContent = r.prompt ? '\u201c' + r.prompt + '\u201d' : '';
    const fuller = r.fit === 'not' ? null : FitEngine.patternPrompt(text, cur);
    $('fullerPanel').hidden = !fuller; $('fuller').textContent = fuller ? '\u201c' + fuller + '\u201d' : '';
    firstTry(r.fit === 'not' ? null : cur);
```
(d) Replace the `where` function with:
```js
  function where(r, uc, ci) {
    const box = $('where'); box.replaceChildren();
    if (r.fit === 'not' || !r.ops.length) { box.hidden = true; return; }
    const C = FitCatalogue, u = uc[ci || 0];
    const sid = u ? u.surfaces : ['files'], s = C.surfaces[sid[0]];
    box.append(el('span', 'label', u ? (uc.length > 1 ? 'closest sourced use cases: pick the one that matches your work' : 'closest sourced use case') : 'where in Workiva AI'));
    box.append(el('h3', '', u ? u.task : 'Ask Workiva AI chat about your file'));
    const use = el('p'); use.append(el('b', '', 'Use: '), s.name + '. ' + s.how); box.append(use);
    box.append(badge(u || { fitBasis: 'assumed' }, s));
    if (!u || u.fitBasis === 'assumed') box.append(el('p', 'also', HINT));
    if (u) { const st = el('p'); st.append(el('b', '', 'Stays with you: '), u.stays); box.append(st); }
    const refs = [...new Set([...(u ? u.refs : []), ...sid.flatMap((x) => C.surfaces[x].sources)])];
    const src = el('p', 'src', 'Source: ');
    refs.forEach((k, i) => { const a = el('a', '', C.sources[k].title); a.href = C.sources[k].url; a.target = '_blank'; a.rel = 'noopener'; src.append(i ? ', ' : '', a); });
    box.append(src);
    if (uc.length > 1) {
      const ul = el('ul', 'alts');
      uc.forEach((x, i) => {
        if (i === (ci || 0)) return;
        const li = el('li'), b = el('button', 'alt', x.task); b.type = 'button';
        b.append(el('span', 'alt-feat', ' \u2013 ' + C.surfaces[x.surfaces[0]].name));
        b.onclick = () => { chosen = i; render(); };
        li.append(b); ul.append(li);
      });
      box.append(ul);
    }
    box.hidden = false;
  }
```
The old `Also close:` line is removed. (e) So a repeated sentence also goes back to the first card, add `lastText = '';` as the first statement of three handlers: the role-card `Try it` handler (`t.onclick = () => { lastText = ''; $('task').value = u.try; ...`), the examples `onchange` handler, and the list-pick `pick` function.

- [ ] **Step 4: [IMPL] Rebuild the dist.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -e -o pipefail; node tests/build.js | grep -E "^dist/fit-finder.html [0-9]+ KB$"'
```
Expected: `dist/fit-finder.html <n> KB` with n between 89 and 93, exit 0.

- [ ] **Step 5: [CHECK] Green pagetest.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/pagetest.js C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-19-top3-sandbox/captures | grep -E "checks,|^FAIL"'
```
Expected: exactly one line, `118 checks, 0 failed`, exit 0. (The PNGs in the captures folder are for Ian; never load them into context.)

- [ ] **Step 6: [CHECK] Neighbouring suites still pass (the lead or a local helper runs these; Codex does not).**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/catalogue.test.js | tail -1 && node tests/edge-cards.test.js | tail -1 && node tests/prompts-strong.test.js | tail -1 && node tests/match-frozen.js --base $(cat ../.ledger/2026-10-19-top3-sandbox/base.txt)'
```
Expected: `all catalogue checks pass`, `edge cards pass (29)`, `all prompts strong`, `match-frozen PASS`, exit 0.

- [ ] **Step 7: [IMPL] Commit.** `git add fit-finder/tests/pagetest.js fit-finder/web/template.html fit-finder/dist/fit-finder.html`; subject "Top-3: the page shows the three closest cards and lets the person pick one"; `git commit -F <msgfile>`.

### Task 4: Sandbox kit: eight cards with made-up files, planted items, the page's own prompt, a scoring sheet, one batched message (spec B)

**Files:**
- Create: `FF/tests/sandbox-kit.js`, `FF/tests/sandbox-kit.test.js`, `FF/sandbox/key.json`, `FF/sandbox/<card id>.txt` (8 files), `FF/sandbox/scoring-sheet.md`, `FF/sandbox/built/` (8 prompts + `batch-message.md`)
- Locked: the catalogue (read only here).

**Interfaces:**
- Consumes: catalogue card fields `id`, `area`, `task`, `try`, `prompt`, `surfaces`; `FitEngine.patternPrompt(card.try, card)` must equal `card.prompt` and `match(card.try)` must list the card.
- Produces: `FF/sandbox/key.json` = array of 8 `{card, file, fill, planted}` where `fill` maps each `[bracket]` token in the card's prompt to text, and `planted` is five `{id:"P1".."P5", find:"<exact text that occurs once in the file>", note:"<what a correct reply says>"}`. Cards (2 per area, all with a non-null `prompt`): FR `fr-yoy-narrative`, `fr-narrative-tables`; GRC `grc-evidence`, `grc-rationalize`; SUS `sus-anomalies`, `sus-exec-narrative`; GEN `gen-summarize-file`, `gen-rewrite` (`gen-formula` was dropped: its prompt is null). File shapes: `fr-yoy-narrative` two clearly headed parts "CURRENT YEAR" and "PRIOR YEAR" of one made-up MD&A paragraph (five changed figures or statements; the prompt says two files, the chat takes pasted text, so the batch message says to add them as two files or paste both parts); `fr-narrative-tables` a made-up narrative plus a table with five mismatches; `grc-evidence` six short evidence descriptions for one control with five missing attributes; `grc-rationalize` twelve short control descriptions with five overlapping pairs or groups; `sus-anomalies` this and last period for ten made-up emissions lines with five outliers; `sus-exec-narrative` a made-up sustainability paragraph with five figures that must survive a rewrite; `gen-summarize-file` a made-up memo with five decisions needed; `gen-rewrite` a made-up board commentary with five figures or facts that must survive a shortening. Each file at most 2500 characters, its first line `MADE-UP TEST DATA`, no real companies or people, no `@`, no `http`, never the word "planted", and no labels that point at the items (no "ERROR", "changed", "outlier", "mismatch", "duplicate", "missing" beside an item). `node tests/sandbox-kit.js --tokens [card ids]` prints each card's bracket tokens (an explicit id with a null prompt exits 1 with `<id>: has no fuller prompt`); `--build <dir> [--only id,id]` writes `<id>.prompt.txt` and `batch-message.md` under `<dir>`. The test prints `sandbox-kit tests pass: 52`.

- [ ] **Step 1: [IMPL] Write `FF/tests/sandbox-kit.js`.**
```js
/* Sandbox kit builder. node tests/sandbox-kit.js --tokens [card ids] | --build <dir> [--only id,id]
   Reads sandbox/key.json and the catalogue. A card's prompt is its own fuller prompt (what the page shows for the card's sample task)
   with every [bracket] filled from the key. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const cat = JSON.parse(fs.readFileSync(path.join(root, 'data/catalogue.json'), 'utf8'));
const BR = /\[[^\]]+\]/g;
const card = (id) => { const u = cat.useCases.find((x) => x.id === id); if (!u) throw new Error('unknown card ' + id); return u; };
function load(keyPath) {
  const key = JSON.parse(fs.readFileSync(keyPath || path.join(root, 'sandbox/key.json'), 'utf8'));
  return key.map((k) => {
    const u = card(k.card), s = cat.surfaces[u.surfaces[0]], raw = u.prompt || '';
    const prompt = raw.replace(BR, (m) => (k.fill && k.fill[m] !== undefined ? k.fill[m] : m));
    const fileText = fs.readFileSync(path.join(root, 'sandbox', k.file), 'utf8');
    return { ...k, id: u.id, area: u.area, task: u.task, sample: u.try, feature: s.name, how: s.how, raw, prompt, fileText, u };
  });
}
function message(cards) {
  const head = ['# Workiva AI sandbox check: ' + cards.length + ' prompts', '',
    'For each card below, open a new Workiva AI chat. If your sandbox lets you add the made-up file to a workspace (two files where the file has a CURRENT YEAR and a PRIOR YEAR part), add it and select it with @ as the prompt says; otherwise paste the file text under the prompt and tell me you did. Copy each reply back as text, not a screenshot. For each card also tell me whether you found the feature the card names where the card says (yes, no, or where it actually is). Every file is made up.', ''];
  const body = cards.map((c, i) => ['==========', '## Card ' + (i + 1) + ' of ' + cards.length + ': ' + c.id + ' (' + c.area + ')',
    'Feature the card names: ' + c.feature + '. Where the card says to find it: ' + c.how, '', '### Prompt', c.prompt, '', '### File: ' + c.file, '----- file starts -----', c.fileText.trim(), '----- file ends -----', ''].join('\n'));
  return head.concat(body).join('\n');
}
module.exports = { load, message, card, BR };
if (require.main === module) {
  const a = process.argv.slice(2);
  if (a[0] === '--tokens') {
    const explicit = a.slice(1).length > 0;
    const ids = explicit ? a.slice(1) : cat.useCases.map((u) => u.id);
    for (const id of ids) {
      const p = card(id).prompt;
      if (!p) { if (explicit) { console.error(id + ': has no fuller prompt'); process.exit(1); } console.log(id + ': (no fuller prompt)'); continue; }
      console.log(id + ': ' + JSON.stringify([...new Set(p.match(BR) || [])]));
    }
  } else if (a[0] === '--build') {
    const out = a[1], oi = a.indexOf('--only'), only = oi >= 0 ? a[oi + 1].split(',') : null;
    if (!out) { console.error('usage: --build <dir> [--only id,id]'); process.exit(2); }
    const cards = load().filter((c) => !only || only.includes(c.id));
    fs.mkdirSync(out, { recursive: true });
    cards.forEach((c) => fs.writeFileSync(path.join(out, c.id + '.prompt.txt'), c.prompt + '\n'));
    fs.writeFileSync(path.join(out, 'batch-message.md'), message(cards) + '\n');
    console.log('built ' + cards.length + ' cards into ' + out);
  } else { console.error('usage: --tokens [ids] | --build <dir> [--only id,id]'); process.exit(2); }
}
```

- [ ] **Step 2: [IMPL] Write `FF/tests/sandbox-kit.test.js`.**
```js
/* node tests/sandbox-kit.test.js  The sandbox kit must be complete, made-up, pasteable and honest about the page's prompt. */
const fs = require('fs'), path = require('path');
const { load, message, BR } = require('./sandbox-kit.js');
const { patternPrompt, match } = require('../engine/fit.js');
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/catalogue.json'), 'utf8'));
let n = 0, fails = 0;
const ok = (name, cond, detail) => { n++; if (!cond) { fails++; console.log('FAIL ' + name + (detail ? ': ' + detail : '')); } };
let cards;
try { cards = load(); } catch (e) { console.log('FAIL key does not load: ' + e.message); process.exit(1); }
const count = (s, sub) => s.split(sub).length - 1;
const hasBracket = (s) => /\[[^\]]+\]/.test(s);
ok('key has 8 cards', cards.length === 8, 'found ' + cards.length);
const per = {}; cards.forEach((c) => { per[c.area] = (per[c.area] || 0) + 1; });
ok('two cards in each of FR, GRC, SUS, GEN', ['FR', 'GRC', 'SUS', 'GEN'].every((a) => per[a] === 2) && Object.keys(per).length === 4, JSON.stringify(per));
const sheet = fs.existsSync(path.join(__dirname, '../sandbox/scoring-sheet.md')) ? fs.readFileSync(path.join(__dirname, '../sandbox/scoring-sheet.md'), 'utf8') : '';
ok('scoring sheet names all 8 cards', cards.every((c) => sheet.includes(c.id)));
const msg = message(cards);
ok('batch message holds all 8 prompts, no answer key, under 30000 characters', cards.every((c) => msg.includes(c.prompt)) && !/planted/i.test(msg) && msg.length < 30000, 'length ' + msg.length);
for (const c of cards) {
  ok(c.id + ': page lists this card for its sample task and shows this prompt', c.raw.length > 0 && patternPrompt(c.sample, c.u) === c.raw && match(c.sample, cat).some((u) => u.id === c.id));
  ok(c.id + ': file is small, made up and clean', c.fileText.length <= 2500 && /^MADE-UP TEST DATA/.test(c.fileText) && !/[@]|http|planted/i.test(c.fileText), 'length ' + c.fileText.length);
  const ids = (c.planted || []).map((p) => p.id);
  ok(c.id + ': five planted items with unique ids', ids.length === 5 && new Set(ids).size === 5 && (c.planted || []).every((p) => p.find && p.note));
  ok(c.id + ': every planted item appears exactly once in the file', (c.planted || []).every((p) => count(c.fileText, p.find) === 1), (c.planted || []).filter((p) => count(c.fileText, p.find) !== 1).map((p) => p.id).join(','));
  ok(c.id + ': prompt has no [bracket] left', !hasBracket(c.prompt), (c.prompt.match(BR) || []).join(' '));
  ok(c.id + ': prompt has no planted-item text', !(c.planted || []).some((p) => c.prompt.includes(p.find)));
}
console.log(fails ? `sandbox-kit tests FAILED: ${fails} of ${n}` : `sandbox-kit tests pass: ${n}`);
process.exit(fails ? 1 : 0);
```
(Count: 4 global + 6 per card x 8 = 52. `BR` is only used for the failure detail, with `String.match`, which is safe with the `g` flag.)

- [ ] **Step 3: [CHECK] Red proof (no key yet).**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/sandbox-kit.test.js | tail -2 || echo "red: exit $?"'
```
Expected: `FAIL key does not load: ENOENT ...key.json` and `red: exit 1`.

- [ ] **Step 4: [LEAD] Dispatch the kit writer** (Sonnet, normal effort, fresh context). Task: "Read `fit-finder/tests/sandbox-kit.js`, `fit-finder/tests/sandbox-kit.test.js` and the Interfaces text of Task 4 (the lead pastes it). Run `node tests/sandbox-kit.js --tokens fr-yoy-narrative fr-narrative-tables grc-evidence grc-rationalize sus-anomalies sus-exec-narrative gen-summarize-file gen-rewrite` to see each prompt's bracket tokens. Write, with the Write tool: the 8 made-up files, `fit-finder/sandbox/key.json` (fill every token; five planted items each; `find` is an exact substring that occurs once in the file), and `fit-finder/sandbox/scoring-sheet.md`: a table with a header row and one row per card id with columns `card | area | planted | found of 5 | facts invented | feature where the card says | pass | fixed and re-run`, the `planted` column pre-filled with 5 and the others empty, plus this rubric. A planted item counts as found when the reply states what its `note` says. An invented fact is an unsupported factual claim: a number, date, name, entity, amount or event that is not in the file and is not a correct calculation from it. Not invented: a correct deduction or sum from the file (for example, a total that adds up), a finding that something is absent from the file ('no owner is named'), a plainly marked hypothesis or question ('this may be because...'), and framing words. Invented: 'revenue grew 12%' when the file shows no such figure; naming a person or system the file does not mention; quoting a standard section as if the file cited it. The files must contain no labels that point at the items. If a card has no usable prompt or its checks fail, substitute another card in the same area with a non-null prompt and say so. Do not read `fit-finder/data/real/`. Reply in at most 8 lines."

- [ ] **Step 5: [CHECK] Green, and the made-up-data grep covers files and fills.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/sandbox-kit.test.js | tail -2 && [ "$(grep -ciE "@|https?:|\binc\b|\bltd\b|workiva inc" sandbox/key.json sandbox/*.txt | grep -vc ":0$")" -eq 0 ] && echo clean'
```
Expected: `sandbox-kit tests pass: 52`, `clean`, exit 0. (The lead then reads all 8 files, under 20k characters, for anything that looks like a real company or person; none allowed.)

- [ ] **Step 6: [IMPL] Build the kit and check what was built.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -e -o pipefail; node tests/sandbox-kit.js --build sandbox/built && [ "$(ls sandbox/built | wc -l)" -eq 9 ] && [ "$(wc -c < sandbox/built/batch-message.md)" -lt 30000 ] && [ "$(grep -c "^## Card " sandbox/built/batch-message.md)" -eq 8 ] && echo kit-built'
```
Expected: `built 8 cards into sandbox/built`, `kit-built`, exit 0.

- [ ] **Step 7: [IMPL] Commit.** `git add fit-finder/tests/sandbox-kit.js fit-finder/tests/sandbox-kit.test.js fit-finder/sandbox/key.json fit-finder/sandbox/scoring-sheet.md fit-finder/sandbox/built` plus the 8 `fit-finder/sandbox/<card id>.txt` files by name; subject "Top-3: sandbox kit (8 cards, made-up files, 5 planted items each, scoring sheet, batch message)"; `git commit -F <msgfile>`.

### Task 5: [LEAD stop] Ian pastes the batch into Workiva AI; score the replies

**Files:**
- Create: `FF/sandbox/replies/<card id>.txt` (8), `FF/sandbox/replies/where.md`
- Modify: `FF/sandbox/scoring-sheet.md` (fill the rows)

**Interfaces:**
- Consumes: `FF/sandbox/built/batch-message.md` and `key.json`.
- Produces: a filled scoring sheet (pass = found >= 4 and 0 invented, per the rubric in the sheet); a list of failing cards and a list of cards whose feature was not where the card says.

- [ ] **Step 1: [LEAD] Notify and ask.** PushNotification and `notify.mjs`; then one message to Ian: "Please paste each of the 8 prompts + files in `fit-finder/sandbox/built/batch-message.md` into Workiva AI (new chat each), and send me the replies as text, plus yes/no/where for each feature." Time left stated. This is the only paste step. Nothing in Tasks 6 to 9 may start while waiting (the dist changes in Task 6).
- [ ] **Step 2: [IMPL] Save the replies verbatim** to `FF/sandbox/replies/<card id>.txt` and Ian's feature notes to `where.md`. Then check them for anything that should not be committed:
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; [ "$(ls sandbox/replies | wc -l)" -eq 9 ] && [ "$(grep -rcE "@|https?:" sandbox/replies | grep -vc ":0$")" -eq 0 ] && echo replies-clean'
```
Expected: `replies-clean`, exit 0. If a reply carries an address, a link or a workspace or user name, redact it with `[removed]` and say so in the sheet before committing.
- [ ] **Step 3: [IMPL] Score each reply twice** (the lead and one Sonnet checker given only the reply, the file, `key.json` and the rubric): found of 5 against each `note`; list every invented fact (with the rubric's examples in hand); copy Ian's yes/no/where; note whether the file was added with @ or pasted.
- [ ] **Step 4: [IMPL] Reconcile and fill the sheet.** Where the two scorers differ, the lead decides and writes one line of reason under the table.
- [ ] **Step 5: [CHECK] Every row is filled with numbers.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; [ "$(grep -cE "^\| *(fr|grc|sus|gen)-[a-z-]+ *\| *[A-Z]+ *\| *5 *\| *[0-5] *\| *[0-9]+ *\|" sandbox/scoring-sheet.md)" -eq 8 ] && echo sheet-filled'
```
Expected: `sheet-filled`, exit 0.
- [ ] **Step 6: [LEAD] Triage.** List failing cards and cards whose feature is missing. A missing feature is reported to Ian as it is; it is not removed from the catalogue. If no card fails, Task 6 steps 2 to 8 are skipped and Task 6 only records "none to fix".
- [ ] **Step 7: [IMPL] Commit** the replies and the filled sheet (named files); subject "Top-3: sandbox replies and scores"; `git commit -F <msgfile>`.

### Task 6: Fix failing cards' text and re-run only those (conditional on Task 5)

**Files:**
- Modify: `FF/data/catalogue.json` (only the `prompt`, `task`, `try`, `stays` fields of a failing card, a surface's `how`, or an availability badge; never `id`, `area`, `ops` or `match`), `FF/sandbox/key.json` (only `fill` entries, when a prompt fix adds or renames a bracket), `FF/dist/fit-finder.html` (rebuilt)
- Create: `FF/sandbox/built-rerun/`, `FF/sandbox/replies/rerun-<card id>.txt`
- Locked: the `planted` items and files, the engine, every card's `id`/`area`/`ops`/`match`.

**Interfaces:**
- Consumes: the failing-card list from Task 5.
- Produces: the same cards with fixed wording or badge; a re-run result per fixed card in the scoring sheet; no second fix round (a card still failing after the re-run is reported to Ian as is).

```rehearse
cp fit-finder/data/catalogue.json fit-finder/data/catalogue.json.pre-fix
cmp fit-finder/data/catalogue.json fit-finder/data/catalogue.json.pre-fix
rm fit-finder/data/catalogue.json.pre-fix
```

- [ ] **Step 1: [LEAD] Decide the fixes.** For each failing card write one line: what the reply got wrong and which wording or badge change addresses it (for example, the prompt's "Use only" line, an added "list every" instruction, or an availability badge that over-claims). If the list is empty, record "none" in the ledger and stop this task.
- [ ] **Step 2: [IMPL] Edit `FF/data/catalogue.json`** with the Edit tool, only the fields in Files above, only for failing cards.
- [ ] **Step 3: [CHECK] No rule change and the neighbouring suites hold.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/match-frozen.js --base $(cat ../.ledger/2026-10-19-top3-sandbox/base.txt) && node tests/catalogue.test.js | tail -1 && node tests/prompts-strong.test.js | tail -1 && node tests/sandbox-kit.test.js | tail -1 && node tests/edge-cards.test.js | tail -1'
```
Expected: `match-frozen PASS`, `all catalogue checks pass`, `all prompts strong`, `sandbox-kit tests pass: 52`, `edge cards pass (29)`, exit 0. A changed prompt must still start where the card's sample task starts (the kit test checks `patternPrompt`).
- [ ] **Step 4: [IMPL] Rebuild the dist and run the page test.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/build.js | tail -1 && node tests/pagetest.js C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-19-top3-sandbox/captures | grep -E "checks,|^FAIL"'
```
Expected: `dist/fit-finder.html <n> KB` then `118 checks, 0 failed`, exit 0.
- [ ] **Step 5: [IMPL] Build the re-run message for the fixed cards only.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -e -o pipefail; node tests/sandbox-kit.js --build sandbox/built-rerun --only <comma-separated failing card ids> && [ "$(grep -c "^## Card " sandbox/built-rerun/batch-message.md)" -eq <k> ] && echo rerun-built'
```
Expected: `built <k> cards into sandbox/built-rerun`, `rerun-built` (k = the number of fixed cards, known from step 1), exit 0.
- [ ] **Step 6: [LEAD] Stop: ask Ian to re-run only those cards** (notify, then the message from `built-rerun/batch-message.md`).
- [ ] **Step 7: [IMPL] Save, check and score (same two-scorer rule and same clean-reply check) and fill the "fixed and re-run" column.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; [ "$(ls sandbox/replies | grep -c "^rerun-")" -eq <k> ] && [ "$(grep -rcE "@|https?:" sandbox/replies | grep -vc ":0$")" -eq 0 ] && echo reruns-saved'
```
Expected: `reruns-saved`, exit 0.
- [ ] **Step 8: [IMPL] Commit** `fit-finder/data/catalogue.json fit-finder/dist/fit-finder.html fit-finder/sandbox/built-rerun fit-finder/sandbox/replies fit-finder/sandbox/scoring-sheet.md` (and `fit-finder/sandbox/key.json` if a `fill` changed), named paths; subject "Top-3: fix failing sandbox cards' text; re-run results"; `git commit -F <msgfile>`.

### Task 7: End blind score (once), "How it rates", README, dist byte counts

**Files:**
- Modify: `FF/tests/pagetest.js` (the `HOW` constant), `FF/web/template.html` (`#howRates`), `FF/README.md`, `FF/tests/README.md`, `FF/dist/fit-finder.html` (rebuilt)
- Create: `L/end-score.txt`

**Interfaces:**
- Consumes: `L/parent-score.txt`, BASE, the final dist from Task 6.
- Produces: the new "How it rates" sentence; README counts that match `git show :fit-finder/dist/fit-finder.html | wc -c`; the end score on record.

- [ ] **Step 1: [CHECK] The end score (the second and last scoring of the new set), and it must equal the parent score.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/match-frozen.js --base $(cat ../.ledger/2026-10-19-top3-sandbox/base.txt) && (cd data/top3 && [ "$(sha256sum -c 2026-10-19-top3.sha256 | grep -c ": OK")" -eq 2) && node tests/synth-score.js data/top3/2026-10-19-top3.jsonl data/top3/card-gold-top3.jsonl --top3 > ../.ledger/2026-10-19-top3-sandbox/end-score.txt && diff ../.ledger/2026-10-19-top3-sandbox/parent-score.txt ../.ledger/2026-10-19-top3-sandbox/end-score.txt && echo same-as-parent'
```
Expected: `match-frozen PASS`, `same-as-parent`, exit 0. (The engine and every `id`/`area`/`ops`/`match` are frozen, so the lines are identical; this is one measurement read twice. If `diff` differs, stop and report.) Nothing scores the set again after this.
- [ ] **Step 2: [IMPL] Test first: change `HOW` in `FF/tests/pagetest.js`.** Keep the existing text and add this sentence before "So treat it as a first guess", filling the slots from `end-score.txt` (n = the number after the second `of` in "any wrong card shown A of n"; F, X, R, A as printed):
`On <n> more new test sentences, written and labelled by AI and never tuned on, the page now lists up to three features: the right one was among them, or rightly none was shown, for <X> of <F> tasks that fit (the first one was right for <R>), and a wrong feature appeared in the list for <A> of <n> tasks.`
(The existing sentence for the first blind set is kept as is. The check `right for 15.` still holds.)
- [ ] **Step 3: [CHECK] Red.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/pagetest.js C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-19-top3-sandbox/captures | grep -E "checks,|^FAIL" || echo "red: exit $?"'
```
Expected: `118 checks, 2 failed`, `FAIL 1280px How it rates text present`, `FAIL 375px How it rates text present`, `red: exit 1`.
- [ ] **Step 4: [IMPL] Put the same sentence into `#howRates` in `FF/web/template.html`** (same position, same words, byte for byte equal to `HOW`).
- [ ] **Step 5: [IMPL] README.** In `FF/README.md`: update the build line 15 byte count after step 6; add the new files to the data table (the new set, its gold and sha256 under `data/top3/`, `sandbox/`); add a dated section "Top-3 and sandbox check (2026-10-19)" with the recorded parent score line, the end score line (same), the gain and the rise in wrong lists, the sandbox table summary, and the sentence "Tone-only edits stay without a card (rule C)". Add to `FF/tests/README.md`: `synth-score.js ... --top3`, `match-frozen.js --base <sha>`, `sandbox-kit.js` and its test; pagetest now 118 checks. Fix any sentence in the README that says the page shows one closest card.
- [ ] **Step 6: [IMPL] Rebuild and count LF bytes as committed.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test" && bash -c 'set -e -o pipefail; node fit-finder/tests/build.js | tail -1 && git add fit-finder/dist/fit-finder.html && git show :fit-finder/dist/fit-finder.html | wc -c && git show HEAD:prompt-coach/dist/prompt-coach.html | wc -c'
```
Expected: `dist/fit-finder.html <n> KB`, then the fit-finder LF byte count (write it into README line 15 and every nearby "now" mention), then `326963` (prompt-coach is untouched; the README keeps that number).
- [ ] **Step 7: [CHECK] Green.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/pagetest.js C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-19-top3-sandbox/captures | grep -E "checks,|^FAIL" && node tests/catalogue.test.js | tail -1'
```
Expected: `118 checks, 0 failed`, `all catalogue checks pass`, exit 0.
- [ ] **Step 8: [IMPL] Commit** `fit-finder/tests/pagetest.js fit-finder/web/template.html fit-finder/README.md fit-finder/tests/README.md fit-finder/dist/fit-finder.html`; subject "Top-3: How it rates and README carry the new blind numbers; LF byte counts"; `git commit -F <msgfile>`. `ledger-add` the end-score line.

### Task 8: Final whole-branch review (Opus + Codex read-only), fix round, all suites

**Files:**
- Create: `L/review/codex-prompt.txt`, `L/review/codex-out.txt`, `L/review/codex.log`, `L/review/opus-out.txt`
- Modify: only what a must-fix finding names
- Locked: engine, `id`/`area`/`ops`/`match`, the data sets.

**Interfaces:**
- Consumes: the branch diff `git diff 4a3946d..HEAD`.
- Produces: triaged findings, fixes, a full-suite run.

- [ ] **Step 1: [IMPL] Write `L/review/codex-prompt.txt`** (Write tool). Text: "Review the diff of branch fit-finder-top3 against 4a3946d (git diff 4a3946d..HEAD) for correctness, tests that could pass for the wrong reason, claims on the page or in the README that the measurements do not support, and made-up sandbox files that look real. Read-only. Do NOT open fit-finder/data/real/, .ledger/ or C:/Users/teasp/Documents/workiva-sealed/. Do NOT score fit-finder/data/synth/2026-10-19-blind.jsonl, fit-finder/data/synth/2026-10-18-holdout.jsonl or anything in fit-finder/data/top3/, and do not run fit-finder/tests/synth-score.js, catalogue.test.js or prompts-strong.test.js. Allowed commands only: git diff, git log, git show, git status; cat, head, tail, grep, rg, ls, wc on files outside the forbidden paths; and from fit-finder/ these node runs: tests/synth-score.test.js, tests/sandbox-kit.test.js, tests/match-frozen.js --base <sha>, tests/edge-cards.test.js, tests/pagetest.js <empty temp folder>. Anything else: do not run it, say in the review what you wanted to run. Reply with must-fix, should-fix and nits, each with file and line." The Opus reviewer dispatch carries the same text (read-only, reply at most 10 lines).
- [ ] **Step 2: [LEAD] Dispatch the Opus reviewer** (read-only, whole-branch diff, the Step 1 text; the lead runs the suites in step 6, not the reviewer).
- [ ] **Step 3: [LEAD] Run Codex with stdin from the file (closed after) and keep its log.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test" && bash -c 'codex exec -s read-only -c windows.sandbox=unelevated --skip-git-repo-check -o .ledger/2026-10-19-top3-sandbox/review/codex-out.txt - < .ledger/2026-10-19-top3-sandbox/review/codex-prompt.txt > .ledger/2026-10-19-top3-sandbox/review/codex.log 2>&1 || echo "codex exit $?"'
```
Expected: no `codex exit` line, `codex-out.txt` and `codex.log` non-empty.
- [ ] **Step 4: [CHECK] Audit what Codex actually did (not the prompt text, which names the forbidden paths).**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test" && bash -c 'set -o pipefail; grep -E "^(exec|\\$| *bash )" .ledger/2026-10-19-top3-sandbox/review/codex.log | grep -ciE "data/real|workiva-sealed|synth-score\.js|catalogue\.test|prompts-strong|blind|holdout|top3/" | grep -qx 0 && echo codex-clean'
```
Expected: `codex-clean`, exit 0. (assumed log format: lines recording each command; the lead adapts the extraction, not the rule. A hit means the review is void for that part: report to Ian.)
- [ ] **Step 5: [LEAD] Triage** both reports; a must-fix both reviewers disagree on goes to Ian. Fix must-fix and cheap should-fix items (no engine or `match` change), re-running the check that covers each. Record in the ledger.
- [ ] **Step 6: [CHECK] Fit Finder suites (the lead or a local helper; real rows are never printed).**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder" && bash -c 'set -o pipefail; node tests/catalogue.test.js | tail -1 && node tests/prompts-strong.test.js | tail -1 && node tests/edge-cards.test.js | tail -1 && node tests/synth-score.test.js | tail -1 && node tests/sandbox-kit.test.js | tail -1 && node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B | tail -1 && node tests/match-frozen.js --base $(cat ../.ledger/2026-10-19-top3-sandbox/base.txt) && node tests/pagetest.js C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-19-top3-sandbox/captures | grep -E "checks,|^FAIL"'
```
Expected, in order: `all catalogue checks pass`; `all prompts strong`; `edge cards pass (29)`; `synth-score tests pass: 21`; `sandbox-kit tests pass: 52`; the eval B summary with `45/60` and `75.0%` (read at fde835b; the executor records the line it prints); `match-frozen PASS`; `118 checks, 0 failed`.
- [ ] **Step 7: [CHECK] Prompt Coach untouched and still green.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test" && bash -c 'set -o pipefail; [ "$(git diff --name-only 4a3946d..HEAD -- prompt-coach | wc -l)" -eq 0 ] && cd prompt-coach && node tests/pagetest.js | tail -1 && node tests/rewrite_unit.test.js | tail -1 && node tests/customer_check.js | tail -1'
```
Expected: `12 checks, 0 failed`, `29 pass, 0 fail` (read; exact wording as the suite prints), `PASS 229` (read), exit 0. A different wording with the same counts is recorded; a different count is a failure to report.
- [ ] **Step 8: [CHECK] Data care and set integrity, then commit any fix-round change.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test" && bash -c 'set -o pipefail; [ "$(git diff --name-only 4a3946d..HEAD | grep -cE "data/real|workiva-sealed|2026-10-19-blind|2026-10-18-holdout" || true)" -eq 0 ] && (cd fit-finder/data/top3 && [ "$(sha256sum -c 2026-10-19-top3.sha256 | grep -c ": OK")" -eq 2) && echo integrity-ok'
```
Expected: `integrity-ok`, exit 0. Commit named files with trailers if the fix round changed any.

### Task 9: Evidence doc and the merge stop

**Files:**
- Create: `W/docs/evidence/2026-10-19-top3-sandbox.md`

**Interfaces:**
- Consumes: `parent-score.txt`, `end-score.txt`, `tune-sanity.txt`, the scoring sheet, review outcomes, the suite lines from Task 8.
- Produces: the doc Ian reads before deciding on customers.

- [ ] **Step 1: [IMPL] Write the doc** (Write tool) with these sections: (1) Ian's words (verbatim from the spec) and what this run did; (2) Prediction versus measured: the prediction text from the spec, the two score lines copied character for character from the ledger files (they are one measurement read twice), G (gain) and D (rise in wrong lists), the tune-set sanity line as the prior, and one plain sentence: "prediction held" if G is at least 3 and D is not more than G, else "prediction disproved: <which part>"; D is the rise against a first-card-only page (the old page already listed cards 2 and 3 as "Also close:" text); the share of fit rows with more than one gold card is reported (not a quota); (3) Sandbox results table, one row per card (`| fr-... | ...`): planted found of 5, facts invented, feature where the card says, fixed and re-run result, and whether the file was added with @ or pasted; failing and missing-feature cards listed plainly; the caveat that the sandbox may have previews or entitlements a customer lacks; (4) What changed on the page (the three-card list, the card switch; "how it rates" numbers) with the dist LF byte count; (5) Reviews: Opus and Codex counts, must-fix handled, the Codex audit result; (6) Suites with counts, each marked measured now; (7) Not done and why: engine rules, rule C, publishing; prompts-strong does not run over the new set by design; (8) For Ian: customers or not, and the merge (slip.json covers push and merge only when checks and the final review pass with no must-fix open; the lead decides and states it).
- [ ] **Step 2: [CHECK] The score lines in the doc are the recorded ones, and the sandbox table is complete.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test" && bash -c 'set -o pipefail; [ "$(grep -cFx -f .ledger/2026-10-19-top3-sandbox/end-score.txt docs/evidence/2026-10-19-top3-sandbox.md)" -ge 2 ] && [ "$(grep -cE "^\| *(fr|grc|sus|gen)-" docs/evidence/2026-10-19-top3-sandbox.md)" -eq 8 ] && echo doc-numbers-ok'
```
Expected: `doc-numbers-ok`, exit 0 (both recorded lines appear verbatim on their own lines; 8 table rows).
- [ ] **Step 3: [CHECK] No data-care slip in the doc.**
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test" && bash -c 'set -o pipefail; [ "$(grep -ciE "data/real/[a-z0-9]|workiva-sealed/[a-z0-9]" docs/evidence/2026-10-19-top3-sandbox.md || true)" -eq 0 ] && echo doc-clean'
```
Expected: `doc-clean`, exit 0.
- [ ] **Step 4: [IMPL] Commit** `docs/evidence/2026-10-19-top3-sandbox.md`; subject "Top-3 and sandbox: evidence doc"; `git commit -F <msgfile>`.
- [ ] **Step 5: [LEAD] Stop for merge** unless `slip.json` names it and its condition holds (checks and final review pass, no must-fix open): then the merge rule in the global agreement applies (backup branch `backup/prompt-coach-before-fit-finder-top3-<date>` at the remote tip first, never into the main checkout's local `prompt-coach`). Notify Ian. Do not share, publish or republish anything unless Ian asks.

## Expected breaks

- 1280px How it rates text present | fixed by Task 7
- 375px How it rates text present | fixed by Task 7

(New pagetest checks from Task 3 and new assertions from Task 2 are new tests, red by design and green by the end of their own task. No other existing test is expected to break: the engine and `match` fields do not change, `synth-score` output is unchanged without the flag, `prompts-strong` never sees the new set because it lives in `data/top3/`, and Task 6 touches only text fields that `prompts-strong`, the catalogue test and the kit test re-check.)

## Self-review

- Spec A: Task 3 (list, switch, fallback unchanged, "How it rates" numbers in Task 7). Spec B: Tasks 4 to 6 (eight cards, two per area, N=5 planted, batch message, score, fix, re-run only failing, missing feature reported not removed, caveat in the doc). Spec C: Tasks 1, 2, 7 (commit with sha256 before any change, scored once at the parent and once at the end; scorer sanity on the tune set first). Prediction and success criteria: Task 9 step 1 section 2, Task 6 step 7, Task 8 step 6. Scope-out items (rules, rule C, Coach, publish): enforced by the Global Constraints, `match-frozen.js` and Task 8 step 7.
- Placeholders: none left except values that do not exist until the run: the measured slots in Task 7 step 2 (from `end-score.txt`), the failing-card id list and k in Task 6 (from Task 5), the writer transcript path in Task 1 step 5, and the commit message files.
- Names used across tasks: `--top3`, `match-frozen.js --base`, `L/base.txt`, `L/parent-score.txt`, `L/end-score.txt`, `L/tune-sanity.txt`, `L/shape-gate.sh`, `data/top3/`, `sandbox/key.json`, `sandbox/built`, `sandbox/built-rerun`, `sandbox/replies`, `button.alt`, `ul.alts`, `chosen`, `lastText`.
