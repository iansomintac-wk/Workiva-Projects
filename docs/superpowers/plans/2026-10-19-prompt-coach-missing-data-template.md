# Prompt coach: missing-data version of the anomaly template (T5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach" && bash -c 'set -o pipefail; node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"'; node tests/simulate.js data/train_fr.jsonl data/train_grc.jsonl data/train_hard.jsonl data/train_sus.jsonl; node tests/customer_check.js; node tests/eval.js rulefeat data/test.jsonl
Data: (none)

**Goal:** When the coach has picked the anomaly task and the ask is about missing or blank items, the Strong rewrite gets a missing-data table and the rule "Do not fill in or estimate missing values." instead of the outlier table and rule.

**Architecture:** One exported test function `missingAsk(prompt)` in `engine/rewrite.js`; `coach()` sets `ctx.missingAsk` only when `ctx.intent === 'anomaly'`; `paramsFragment` and `evalFragment` branch on it inside their existing `case 'anomaly'`. Grades, weights, classifier, notes, tips and other intents are untouched.

**Tech Stack:** plain Node (CommonJS), `node:test` with the tap reporter, `tests/build.js` to inline the engine into one HTML file. Shell: Git Bash (POSIX sh; `bash -c` works as written).

**Spec:** `docs/superpowers/specs/2026-10-19-prompt-coach-missing-data-template-design.md`

## Global Constraints

- Intent gate: the change applies only when intent is `anomaly` AND the missing-data test fires.
- Fragments verbatim: P = `"Return a table: " + (detected columns, or "item") + ", what is missing, where it should be. "`; E = `"Do not fill in or estimate missing values."`. The `anomaly` objective fragment ("wrong, missing, or out of place") stays.
- Nothing else changes: grades, weights, classifier, notes, tips, other intents.
- The pattern is tuned on label ids 16-38 of `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach/research/2026-10-19-missing-ask-labels.tsv` ONLY. Ids 1-15 (test, test_unlabeled, sim_customers) are the held-out check: read once, in Task 4, never tune on them. If held-out misses the bar, report it; do not retune to it.
- Spec design 1: a missing word inside a conditional or rule clause ("if X is missing", "don't guess missing dates") does not count; a prompt that "also asks about wrong, zero, duplicate, exception or out-of-place values" is mixed and does not take the template. Following the spec's wording: (a) the wrong-value words are tested on the WHOLE prompt (a conditional that asks for zeros, "if a zero is found, report it too", still makes it mixed); (b) the exemption drops only the condition clause itself (from "if" to the next comma or the end of the sentence), not a request that a condition introduces, so "If possible, list missing emissions data." is a missing-data ask and fires.
- No installs, no push, no merge, no live Workiva AI run, no spend. `tests/pagetest.js` and `tests/filetest.js` are reported "not run" (no working Playwright path on this PC).
- Paths. Repo root = `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix`. The ledger folder is `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data` (git-ignored; never commit it). Every command below has the paths written out in full; run them in Git Bash. Every `git add`/`git commit` runs from the repo root: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix" && git ...`.
- `UNIT` means exactly: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach" && bash -c 'set -o pipefail; node --test --test-reporter=tap tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"'` (exit status is node's; the expected lines are exact).

## Baselines (read from the ledger `logs/b_*.log`, measured by the talk; the plan writer measured only `wc -c` of dist = 328632 and `ls data/train_*.jsonl` = train_fr, train_grc, train_hard, train_sus)

unit 29/29; simulate (4 train files, runs=2070) strongNotStrong 2, betterWeak 5, badText 2; customer_check PASS 229; eval acc 0.856. Task 1 re-dumps the before snapshots from the parent so the comparison does not rest on a read file.

## Locked files (tasks may not alter these beyond what a task names)

- `prompt-coach/tests/simulate.js`, `customer_check.js`, `eval.js`, `pagetest.js`, `filetest.js`, `build.js`
- `prompt-coach/engine/classify.js`, `rules.js`, `model.js`, `weights.json`, `cls-weights.json`
- `prompt-coach/data/*`, `prompt-coach/research/2026-10-19-missing-ask-labels.tsv` (read only)
- Existing files in the ledger `scripts/` and `logs/` (read only; new files may be added)
- `prompt-coach/tests/rewrite_unit.test.js`: append new tests only; do not edit or delete existing ones.
- `prompt-coach/engine/rewrite.js`: only the missing-data function, the `ctx.missingAsk` line, `case 'anomaly'` in `paramsFragment` and `evalFragment`, and the export.

## Groups and tune

No group marks: every task needs judgement. Task 2 tunes one thing (the pattern) on train ids 16-38 with a fixed ceiling: mention and mixed rows never fire; train ask ids 25 27 30 33 36 37 38 all fire; 3 edits max.

## Paid calls

None.

## Token estimates (helper tokens)

Task 1: 14k. Task 2: 32k. Task 3: 22k. Task 4: 42k. Run total: ~110k.

## File structure

- Modify `prompt-coach/engine/rewrite.js`; modify `prompt-coach/tests/rewrite_unit.test.js` (6 new tests: 29 -> 35).
- Rebuild `prompt-coach/dist/prompt-coach.html`; modify `prompt-coach/README.md`.
- Create `docs/evidence/2026-10-19-prompt-coach-missing-data.md`.
- New ledger files (git-ignored): `scripts/compare_strong.js`, `scripts/compare_tricky.js`, `logs/strong_before_fresh.tsv`, `logs/tricky_before_fresh.txt`, `logs/notes_before.txt`, `logs/strong_after.tsv`, `logs/tricky_after.txt`, `logs/notes_after.txt`.

---

### Task 1: Failing T5 test, and fresh before-snapshots from the parent (spec check 1)

**Files:**
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (append at end)
- Write (ledger): `logs/strong_before_fresh.tsv`, `logs/tricky_before_fresh.txt`, `logs/notes_before.txt`

**Interfaces:**
- Consumes: existing test helpers `run(prompt, files, extra)`, `W.coach`.
- Produces: test `missing-data: T5 typed with @sus_supplier_data.csv gets the missing-data table and rule`; before snapshots for Task 4.

- [ ] **Step 1: Append the test**

```js
// ---- T5: missing-data version of the anomaly template (spec 2026-10-19) ----
test('missing-data: T5 typed with @sus_supplier_data.csv gets the missing-data table and rule', () => {
  const o = run('Which suppliers are missing emissions data?', [{ name: 'sus_supplier_data.csv' }]);
  const s = o.stages.strong.prompt;
  assert.equal(o.intent, 'anomaly');
  assert.ok(s.includes('what is missing'), s);
  assert.ok(s.includes('Do not fill in or estimate missing values'), s);
  assert.ok(!s.includes('why it looks wrong'), s);
  assert.ok(!s.includes('Do not correct any values'), s);
});
```

- [ ] **Step 2: Run on the parent; it must fail**

Run: `UNIT`
Expected: `# pass 29` and `# fail 1`, exit status 1 (`not ok 30 - missing-data: T5 typed ...` on the `what is missing` assertion). If the `intent` assertion fails first, report it (spec says `anomaly`, p 0.90).

- [ ] **Step 3: Prove the engine being dumped is the parent engine**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix" && git diff --quiet -- prompt-coach/engine; echo tree=$?; git diff --quiet 3891478 HEAD -- prompt-coach/engine; echo head=$?; git diff --quiet 6154fae 3891478 -- prompt-coach/engine; echo parent=$?`
Expected: `tree=0` (working tree equals HEAD for the engine), `head=0` and `parent=0` (no engine change since the 6154fae state the old snapshots were made on). Any non-zero: stop and report before dumping.

- [ ] **Step 4: Dump fresh before-snapshots from the parent engine**

Run these three (Git Bash; redirects are allowed for the executor):
`node "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/strong_dump.js" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs/strong_before_fresh.tsv" | tail -n 12`
`node "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/tricky_all.js" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs/tricky_before_fresh.txt" | tail -n 8`
`node "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/notes_probe.js" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/tricky_prompts.json" > "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs/notes_before.txt"`
Then compare to the talk's snapshots:
`cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs" && cmp strong_before_fresh.tsv strong_before_1630a36.tsv; echo strong_cmp=$?; cmp tricky_before_fresh.txt tricky_strong_6154fae.txt; echo tricky_cmp=$?`
Expected: `strong_cmp=0`, `tricky_cmp=0`. If either is not 0, the `*_fresh` file is the "before" in Task 4 (it already is); say so in the evidence doc.

- [ ] **Step 5: Commit the failing test**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix" && git add prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach T5: failing test for the missing-data template"
```
(end the message with the attribution lines from the session's system reminder)

---

### Task 2: The missing-data test, tuned on train ids 16-38

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (new function above `paramsFragment`; the export object next to `sentenceSpans`)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (append three tests)

**Interfaces:**
- Consumes: label rows `id<TAB>file<TAB>label<TAB>prompt` (header row first).
- Produces: `W.missingAsk(prompt: string) -> boolean`.

- [ ] **Step 1: Append three tests (all fail: `W.missingAsk` is not a function)**

```js
test('missing-data: missingAsk fires on train ask rows 25 27 30 33 36 37 38 and on no mixed or mention row (ids 16-38)', () => {
  const rows = fs.readFileSync(path.join(__dirname, '../research/2026-10-19-missing-ask-labels.tsv'), 'utf8').replace(/\r/g, '').trim().split('\n').slice(1).map((l) => l.split('\t'));
  const train = rows.filter((r) => Number(r[0]) >= 16);
  assert.equal(train.length, 23);
  for (const r of train) {
    const fired = W.missingAsk(r[3]);
    if (r[2] === 'mixed' || r[2] === 'mention') assert.equal(fired, false, r[0] + ' ' + r[2] + ': ' + r[3]);
    if (['25', '27', '30', '33', '36', '37', '38'].includes(r[0])) assert.equal(fired, true, r[0] + ': ' + r[3]);
  }
});

test('missing-data: a truly mixed request does not take the missing-only template', () => {
  assert.equal(W.missingAsk('List missing values and, if a zero is found, report it too.'), false);
  assert.equal(W.missingAsk('Which suppliers have duplicate or missing emissions data?'), false);
  assert.equal(W.missingAsk('List any outliers. If a value is missing, say so.'), false);
  assert.equal(W.missingAsk('Which suppliers are missing emissions data?'), true);
});

test('missing-data: a request that a condition introduces still counts as a missing-data ask', () => {
  assert.equal(W.missingAsk('If possible, list missing emissions data.'), true);
  assert.equal(W.missingAsk('List the suppliers. If the file has a blank tab, ignore it.'), false);
});
```
Run `UNIT`. Expected: `# pass 29`, `# fail 4`, exit 1.

- [ ] **Step 2: Add the candidate `missingAsk` to `engine/rewrite.js`** (above `paramsFragment`, inside the same function scope; add `missingAsk` to the exported object)

```js
  /* Missing-data ask (spec 2026-10-19): the user asks what is missing or blank, not what is wrong.
     Rule and condition clauses are cut out before looking for the missing word, so "if X is missing" and
     "don't guess missing dates" do not count; the condition clause ends at its comma, so "If possible, list
     missing data" keeps its request. Wrong-value words are looked for in the whole prompt (mixed ask). */
  const MISS_WORD = /\b(?:missing|blank|empty|no (?:data|values?|figures?)|without (?:a |any )?(?:values?|data))\b/;
  const MISS_RULE = /\bif\b[^,.;!?\n]*|\b(?:don'?t|do not|never|not)\s+(?:\w+\s+){0,3}?(?:guess|assume|estimate|fill|make up|chase|plug|infer)\b[^.;!?\n]*|\bleave\b[^.;!?\n]*\bblank\b|\b(?:a|an|new|the)\s+(?:\w+\s+){0,2}?blank (?:tab|sheet|page|template|row|line|space)\b/g;
  const MISS_WRONG = /\b(?:zero|duplicat\w*|exceptions?|wrong|incorrect|outliers?|anomal\w*|unusual|mismatch\w*|suspicious|spikes?|out of place|inconsisten\w*|typos?)\b/;
  function missingAsk(prompt) {
    const s = String(prompt || '').toLowerCase().replace(/[\u2018\u2019]/g, "'");
    return MISS_WORD.test(s.replace(MISS_RULE, ' ')) && !MISS_WRONG.test(s);
  }
```

- [ ] **Step 3: Run the tests**

Run `UNIT`. Expected: `# pass 32`, `# fail 1` (only the Task 1 test), exit 1. A failure message in the labels test names the id and prompt.

- [ ] **Step 4: Tune only if Step 3 shows another failure (max 3 edits; ids 16-38 only)**

Edit `MISS_WORD`, `MISS_RULE` or `MISS_WRONG`, re-run `UNIT`. Do NOT read or test ids 1-15. If still stuck after 3 edits, stop and report the id.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach T5: missingAsk test, tuned on train label ids 16-38"
```

---

### Task 3: Wire the two fragments (turns Task 1 green)

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (the line after `ctx.intent = opts.intent || intentOf(...)`, about line 409; `case 'anomaly'` about lines 146 and 167)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (append two tests)

**Interfaces:**
- Consumes: `missingAsk` from Task 2; `cols` already computed in `paramsFragment` from `ctx.headers`.
- Produces: `ctx.missingAsk` (true only when `ctx.intent === 'anomaly'` and `missingAsk(prompt)`).

- [ ] **Step 1: Set the flag** directly after the `ctx.intent = ...` line:

```js
    ctx.missingAsk = ctx.intent === 'anomaly' && missingAsk(prompt);
```

- [ ] **Step 2: Branch in `paramsFragment`**

```js
      case 'anomaly': return ctx.missingAsk
        ? 'Return a table: ' + (cols ? cols + ', ' : 'item, ') + 'what is missing, where it should be. '
        : 'Return a table: ' + (cols ? cols + ', ' : 'item, value, ') + 'why it looks wrong, what to check. ';
```

- [ ] **Step 3: Branch in `evalFragment`**

```js
      case 'anomaly': return ctx.missingAsk ? 'Do not fill in or estimate missing values.' : 'Do not correct any values; flag anything you are unsure of.';
```
(`BLANK.E` calls `evalFragment({ intent: null })`: unaffected.)

- [ ] **Step 4: Append the guard test and the detected-columns test** (spec design 2 names the "detected columns" branch)

```js
test('missing-data: a mixed ask keeps its anomaly lines, and another intent never gets the missing-data rule', () => {
  const mixed = run('Which suppliers have duplicate or missing emissions data?', [{ name: 'sus_supplier_data.csv' }], { intent: 'anomaly', taskSure: true }).stages.strong.prompt;
  assert.ok(mixed.includes('why it looks wrong'), mixed);
  assert.ok(mixed.includes('Do not correct any values'), mixed);
  assert.ok(!mixed.includes('Do not fill in or estimate missing values'), mixed);
  const q = 'Which controls are missing evidence?';
  assert.equal(W.missingAsk(q), true);
  const gaps = run(q, [], { intent: 'gaps', taskSure: true }).stages.strong.prompt;
  assert.ok(gaps.includes('Only flag gaps you can point to in the source'), gaps);
  assert.ok(!gaps.includes('Do not fill in or estimate missing values'), gaps);
});

test('missing-data: detected sheet headers lead the missing-data table', () => {
  const f = { name: 'sus_supplier_data.csv', kind: 'CSV', periods: [], text: '', sheets: [{ name: 'Suppliers', headers: ['Supplier', 'Country', 'Emissions tCO2e'] }] };
  const s = run('Which suppliers are missing emissions data?', [f]).stages.strong.prompt;
  assert.ok(s.includes('Return a table: Supplier, Country, Emissions tCO2e, what is missing, where it should be.'), s);
});
```
If the header test fails only because the headers are not picked up, read `bestSheet` (rewrite.js line 65) and adjust the fixture (sheet name or headers), not the engine. If the guard test's `mixed` anomaly-line assertions fail, check on the parent whether `taskSure: true` yields those lines there; if not, report it.

- [ ] **Step 5: Run unit tests**

Run `UNIT`. Expected exactly: `# pass 35` and `# fail 0`, exit 0 (29 old + 6 new).

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach T5: missing-data table and rule when the anomaly ask is about missing data"
```

---

### Task 4: Measure, rebuild, document (spec checks 2-8)

**Files:**
- Create (ledger, not committed): `scripts/compare_strong.js`, `scripts/compare_tricky.js`
- Rebuild: `prompt-coach/dist/prompt-coach.html`
- Modify: `prompt-coach/README.md` (line 9 byte count; one new bullet after line 84)
- Create: `docs/evidence/2026-10-19-prompt-coach-missing-data.md`

**Interfaces:**
- Consumes: `strong_dump.js`, `tricky_all.js`, `notes_probe.js` (arguments as in Task 1 Step 4), the `*_fresh` and `notes_before` files.
- Produces: exit codes from the compare scripts; the evidence doc.

- [ ] **Step 1: Create the two compare scripts**

`C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/compare_strong.js`:
```js
// node compare_strong.js <abs prompt-coach> <before.tsv> <after.tsv>
// Rows keyed by file+line; fields: file, line, intent, grade, strong. Labels matched by exact prompt text.
const fs = require("fs"), path = require("path"); const [root, bf, af] = process.argv.slice(2);
const rd = (f) => fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => l.split("\t"));
const B = rd(bf), A = rd(af); let bad = 0; const fail = (m) => { console.log("FAIL", m); bad++; };
if (B.length !== 1841 || A.length !== 1841) fail("total rows before " + B.length + ", after " + A.length + ", expected 1841 each");
const prompt = {};
for (const f of fs.readdirSync(path.join(root, "data")).filter((x) => x.endsWith(".jsonl")).sort())
  fs.readFileSync(path.join(root, "data", f), "utf8").split("\n").forEach((l, i) => { if (!l.trim()) return; const p = JSON.parse(l).prompt; if (p) prompt[f + "\t" + (i + 1)] = p.trim(); });
const labels = fs.readFileSync(path.join(root, "research/2026-10-19-missing-ask-labels.tsv"), "utf8").replace(/\r/g, "").trim().split("\n").slice(1).map((l) => l.split("\t"));
const byText = new Map(); for (const [id, , label, p] of labels) { const k = p.trim(); if (!byText.has(k)) byText.set(k, []); byText.get(k).push({ id, label }); }
const matched = new Map(); const ASK11 = new Set(["1", "3", "8", "14", "25", "27", "30", "33", "36", "37", "38"]);
const MIXED5 = ["5", "6", "11", "12", "19"];
const NEW = ["what is missing", "Do not fill in or estimate missing values"], OLD = ["why it looks wrong", "Do not correct any values"];
let changed = 0, labeledRows = 0, outsideRows = 0, mixedRowsSeen = 0, mentionRowsSeen = 0;
for (let i = 0; i < Math.min(A.length, B.length); i++) {
  const b = B[i], a = A[i]; const key = b[0] + ":" + b[1];
  if (b[0] !== a[0] || b[1] !== a[1]) { fail("key order " + key); continue; }
  const L = byText.get(prompt[b[0] + "\t" + b[1]]) || []; L.forEach((x) => matched.set(x.id, x.label));
  for (let c = 0; c < 4; c++) if (b[c] !== a[c]) fail("field " + c + " changed " + key + " (" + b[c] + " -> " + a[c] + ")");
  if (L.length) { labeledRows++; if (a[3] !== "strong") fail("after grade not strong " + key); } else outsideRows++;
  const diff = b[4] !== a[4];
  const isMM = L.some((x) => x.label === "mixed" || x.label === "mention");
  if (L.some((x) => x.label === "mixed")) mixedRowsSeen++; if (L.some((x) => x.label === "mention")) mentionRowsSeen++;
  if (isMM && diff) fail("mixed/mention row changed " + key);
  if (!L.length && diff) fail("unlabeled row changed " + key);
  if (diff) {
    changed++;
    if (!L.some((x) => ASK11.has(x.id))) fail("changed row is not one of the 11 ask ids " + key);
    for (const s of NEW) if (!a[4].includes(s)) fail("new fragment missing '" + s + "' " + key);
    for (const s of OLD) { if (a[4].includes(s)) fail("old fragment still present '" + s + "' " + key); if (!b[4].includes(s)) fail("old fragment absent before '" + s + "' " + key); }
  }
}
const unmatched = labels.filter(([id]) => !matched.has(id)).map(([id]) => id);
const mixedIds = [...matched].filter(([, l]) => l === "mixed").map(([id]) => id), mentionIds = [...matched].filter(([, l]) => l === "mention").map(([id]) => id);
console.log("rows", A.length, "outsideLabelRows", outsideRows, "labeledRows", labeledRows, "matchedLabelIds", matched.size, "unmatched", unmatched.join(" ") || "none", "mixedRows", mixedRowsSeen, "mentionRows", mentionRowsSeen, "changed", changed);
if (matched.size !== 37) fail("matched label ids " + matched.size + ", expected exactly 37");
if (unmatched.length !== 1) fail("unmatched label ids " + unmatched.length + ", expected exactly 1 (name it in the evidence doc)");
if (!MIXED5.every((id) => matched.get(id) === "mixed")) fail("the 5 mixed anomaly-line ids " + MIXED5.join(",") + " are not all present");
if (mentionIds.length !== 8) fail("mention ids present " + mentionIds.length + ", expected 8");
if (changed !== 11) fail("changed rows " + changed + ", expected exactly 11");
if (outsideRows + labeledRows !== 1841) fail("row split does not add up");
process.exit(bad ? 1 : 0);
```
`C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/compare_tricky.js`:
```js
// node compare_tricky.js <before.txt> <after.txt>: T1-T4 and T6 blocks must be byte-identical; exactly one block (T5) differs.
const fs = require("fs"); const [bf, af] = process.argv.slice(2);
const blocks = (f) => { const m = {}; for (const b of fs.readFileSync(f, "utf8").split(/\n\n(?=T\d )/)) m[b.slice(0, 2)] = b; return m; };
const B = blocks(bf), A = blocks(af); let bad = 0, t5 = 0;
for (const id of ["T1", "T2", "T3", "T4", "T5", "T6"]) {
  if (!B[id] || !A[id]) { console.log("FAIL missing", id); bad++; continue; }
  const same = B[id] === A[id];
  if (id === "T5") { if (!same) t5++; } else if (!same) { console.log("FAIL block differs", id); bad++; }
}
console.log("T5 differing blocks", t5, "| other differing blocks", bad);
console.log("T5 after:", A.T5);
if (t5 !== 1 || !/what is missing, where it should be\. Do not fill in or estimate missing values\.$/.test(A.T5) || !/^T5 \[strong\]/.test(A.T5)) bad++;
process.exit(bad ? 1 : 0);
```

- [ ] **Step 2: Strong dump after, then compare keyed by row (checks 2-6)**

Run: `node "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/strong_dump.js" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs/strong_after.tsv" | tail -n 14`
Then: `node "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/compare_strong.js" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs/strong_before_fresh.tsv" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs/strong_after.tsv"; echo exit=$?`
Expected: the dump prints `ask:missingLines 11` (ids 1 3 8 14 25 27 30 33 36 37 38; ids 8 and 14 are one prompt) and no `mixed:missingLines` or `mention:missingLines`; the compare prints `rows 1841 ... matchedLabelIds 37 unmatched <one id> ... changed 11` and `exit=0`. It fails (and `exit=1`) unless: total rows are 1841 before and after; matched label ids are exactly 37 with exactly 1 unmatched (name it in the evidence doc); the 5 mixed anomaly-line ids (5 6 11 12 19) and 8 mention ids are present and their Strong text is byte-identical; every row's file, line, intent and grade fields are identical before and after; every row outside the labels is byte-identical (the spec says 1,803 prompts outside the 38 label rows; the script prints the actual outside-label row count, which is 1841 minus the stored rows matched by text, and the evidence doc records it next to the 1,803 figure); every labeled after-grade is `strong`; exactly the 11 ask rows changed, and on each, both new fragments are present and both old anomaly fragments are absent (and were present before). Any FAIL line disproves checks 2-6: record it, do not retune on ids 1-15, stop and report. Held-out ids 1 3 8 14 are read here for the first time (at least 3 of 4 among the changed).

- [ ] **Step 3: Tricky probe and notes (check 7)**

Run: `node "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/tricky_all.js" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs/tricky_after.txt" | tail -n 8`
Then: `node "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/compare_tricky.js" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs/tricky_before_fresh.txt" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs/tricky_after.txt"; echo exit=$?`
Expected: `T5 differing blocks 1 | other differing blocks 0`, `exit=0`, and the printed T5 block ends "item, what is missing, where it should be. Do not fill in or estimate missing values."
Notes: `node "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/notes_probe.js" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach" "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/scripts/tricky_prompts.json" > "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs/notes_after.txt"; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/.ledger/2026-10-19-prompt-coach-missing-data/logs" && cmp notes_before.txt notes_after.txt; echo notes_cmp=$?` Expected `notes_cmp=0`. The probe covers notes only; tips have no probe and are not compared (stated limit; the engine diff touches no tip code).

- [ ] **Step 4: Must-stay-green (check 8), each from `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach`**

- `UNIT` -> `# pass 35`, `# fail 0`
- `node tests/simulate.js data/train_fr.jsonl data/train_grc.jsonl data/train_hard.jsonl data/train_sus.jsonl | head -n 8` -> runs=2070; strongNotStrong <= 2, betterWeak <= 5, badText <= 2
- `node tests/customer_check.js | tail -n 2` -> `PASS 229 runs`
- `node tests/eval.js rulefeat data/test.jsonl | grep -m1 "GRADE acc"` -> `GRADE acc=0.856`
- `pagetest.js`, `filetest.js`: record "not run (no Playwright path on this PC)".
Any worse = stop and report.

- [ ] **Step 5: Rebuild dist; README**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix/prompt-coach" && node tests/build.js && wc -c dist/prompt-coach.html` (N = the byte count).
Edit README.md line 9: replace `326963 bytes` with N (it was already stale; dist measured 328632 before this change). Add after line 84 this bullet: `- Missing data (2026-10-19): when the coach picks the anomaly task and the ask is about missing or blank items (missingAsk in engine/rewrite.js: a missing/blank/empty word outside any "if ..." condition clause or "don't guess ..." rule clause, and no zero, duplicate, exception or wrong-value word anywhere in the prompt), Strong gets "Return a table: [columns or item], what is missing, where it should be." and "Do not fill in or estimate missing values." instead of the outlier table and rule. Grades, classifier, notes and tips are unchanged. Unit tests: tests/rewrite_unit.test.js ("missing-data: ...").` The README states no unit-test count (its only "29" is the unrelated table cell on line 134: leave it alone).

- [ ] **Step 6: Write the evidence doc** `docs/evidence/2026-10-19-prompt-coach-missing-data.md`: the spec's success table (checks 1-8) with prediction, before, after, verdict; each number marked Measured (this run) or Read (baselines from the ledger `logs/b_*.log`); the final pattern and edit count; held-out result for ids 1-15; the one unmatched label id and the outside-label row count against the spec's 1,803; pagetest/filetest "not run"; labels are Opus's, not Ian's; no answer-quality gain measured; notes compared, tips not.

- [ ] **Step 7: Commit (one commit: dist, README, evidence)**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-findings-fix" && git add prompt-coach/dist/prompt-coach.html prompt-coach/README.md docs/evidence/2026-10-19-prompt-coach-missing-data.md && git commit -m "Prompt coach T5: rebuild dist, README wording rule and byte count, evidence"
```
(end with the attribution lines; no push, no merge)

---

## Expected breaks

None. The change adds fragments only on rows that fire; no existing test title is expected to fail. Any existing unit test, simulate, customer_check or eval result that moves is a stop-and-report.

## Self-review

- Spec coverage: design 1 -> Task 2; design 2 (incl. detected columns) -> Task 3; design 3 and checks 3-7 -> Task 4 compare scripts; check 1 -> Task 1; check 2 -> Task 4 Step 2; check 8 -> Task 4 Step 4; scope items (dist, README, evidence) -> Task 4.
- Ambiguities resolved: "typed with @file" = the plain T5 prompt plus a file object, as tricky_all.js does; the wrong-value words are checked on the whole prompt (spec: "also asks about wrong, zero, ..."); the condition exemption ends at the comma (spec exempts the missing word inside the condition, not the request after it); the README has no unit-count prose; the candidate pattern was not run by the plan writer (no script execution), so Task 2 verifies it.
