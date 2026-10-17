# Prompt Coach Rewrites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Better and Strong rewrites keep the user's sentences whole and in order, speak in the direct voice, fix common typos, and add a Context blank that fits the task, so Ian's invoice case produces the approved target text.

**Architecture:** All wording changes live in `prompt-coach/engine/rewrite.js` (sentence splitter, ordered assembly, `directVoice`, `fixTypos`, Context wording, one tip). Grading files are not touched, except one conditional widening of an existing Context cue in `rules.js` (Task 7). Checks are new categories in `prompt-coach/tests/customer_check.js` (set-wide) plus a `node --test` file (`prompt-coach/tests/rewrite_unit.test.js`) for per-task red/green.

**Tech Stack:** Node v26.5.0 (measured by the lead), `node:test`, Python 3 with python-docx/openpyxl/reportlab for the live-test files only (already used by `tests/make_fixtures.py`; nothing is installed).

**Spec:** `docs/superpowers/specs/2026-10-16-prompt-coach-rewrites-design.md` (approved by Ian 2026-10-16; the authority). Also read `docs/PROMPT_COACH_REWRITES_RUN_PROMPT.txt` (SAFETY, PERMISSIONS) and `prompt-coach/research/2026-10-16-prompting-evidence.md`.

Suite: node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js

Rest of the suite, one command per line (the suite passes only when every line meets its expected output; no `&&` chaining, so one failing line never hides the next):

```
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^FAIL|^PASS"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^FAIL|^PASS"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/eval.js rulefeat C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep "GRADE acc"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(runs|strongNotStrong|betterWeak)"
```

Data: (none)

helperToolCallCap: 45 (per helper dispatch, from `.ledger/2026-10-16-prompt-coach-rewrites/budget.json`). The run token cap there (600000) does not fit this plan; see "Estimates" and IAN 2026-10-17 (B): cap raised to 1.8M, full plan kept, cheaper variant not taken.

Groups: none (every task has a judgement step). Tune tasks: none (no task moves a single number; the Context-cue widening in Task 7 is a guarded side step with a hard eval floor).

Locked files (do not edit): `prompt-coach/engine/model.js`, `engine/weights.json`, `engine/cls-weights.json`, `engine/classify.js`, `prompt-coach/data/**`, `prompt-coach/web/template.html`, `prompt-coach/tests/eval.js`, `tests/simulate.js`, `tests/train*.js`. `engine/rules.js` is locked except the single conditional edit in Task 7 step 4. `prompt-coach/dist/` changes only through `node prompt-coach/tests/build.js` in Task 11. After Task 1, `prompt-coach/tests/fixtures/rewrites/blank_baseline.json` is locked. The published artifact is never republished.

Paid calls: none ($0, offline Node/Python only).

Review of this plan: the final review is `final-reviewer` alone. Codex cannot run a shell here (helper_unknown_error, same as ledger 2026-10-14-codex-shell-blocked-on-windows), so there is no Codex review unless Ian restores it.

**Conventions for checks.** Each check is one command per line, written with absolute paths, with no `cd`, no `VAR=value` prefix, no shell keywords, no `||`. Every task has a fenced `role-checks` block the lead copies verbatim into `role-checks.txt`. A step marked **LEAD:** writes a file, sets an environment variable, or runs a mutating command, so it cannot be a role-check; the lead (or a helper allowed to write) runs it. Commit lines are not checks; they use `cd ... && git ...` and are run by the implementer.

## Global Constraints

- Grading is unchanged: no edits to `model.js`, weights, or `classify.js`. Only a Context cue, only if `node prompt-coach/tests/eval.js rulefeat prompt-coach/data/test.jsonl` prints `GRADE acc=0.856` or higher (parent: `acc=0.856`, measured by the lead).
- No customer names or confidential data anywhere in the repo. Synthetic files only (Task 9 re-checks).
- Paragraph breaks, bullets, the "strong" definition, the tracked-changes view, and republishing are out of scope.
- Do not add a role line ("You are ..."); do not claim that removing "please" or "can you" improves answer quality (style only; evidence note).
- README changes ride in the same commit as the code they describe: every code task below ends with a README step.
- Never use bare `git stash`; never push, merge, or open a PR; commit only at the commit steps below.
- Commit messages end with the attribution lines the executing session's system reminder specifies (none if it gives none).
- Spec "Must stay green": eval >= 85.6%; simulate no worse than 8 strong-not-strong and 5 better-weak; customer_check passes by default and (IAN YES 2026-10-17 (A)) on `data/test.jsonl`; `tests/filetest.js` passes with `VENDOR=<folder the lead supplies>`; built page checked in a browser by the lead (desktop and phone width, no console errors, no sideways scroll).

## Decisions for Ian at the plan stop

- **IAN YES 2026-10-17 (A)** (default applied below): a prompt whose only missing letter is Context always gets exactly one Context blank, even when a kept sentence carries a Context cue the model does not credit. On the parent, `customer_check` on `data/test.jsonl` already FAILS (measured by the lead: `FAIL 609`, `notStrong 4/609`, all from the "We need this for our user-control assessment..." prompt, "missing C"; the spec's "test.jsonl passes" was not true on the parent). `blankMore` compares only-Context-missing runs against `max(baseline, 1)`, because the spec says both "exactly one blank" and "no more blanks than today" and those clash on prompts whose baseline is 0. Bar for `data/test.jsonl`: PASS. **Fallback if Ian says no:** skip the only-Context rule in Task 7 step 5; bar for `data/test.jsonl` is every category 0 except `notStrong` at most 4/609 and only the parent's runs; `blankOnlyC` skips runs with no generated Context piece; `blankMore` stays a plain comparison with the baseline.
- **IAN 2026-10-17 (B): cap raised to 1.8M, full plan kept, cheaper variant not taken**: token cap. See "Estimates": the plan needs about 1.77M helper tokens (cheaper variant about 1.59M) against a 600k cap with 382,703 already spent (measured). Ian raises the cap or picks the cheaper variant.
- Declared deviations from the approved spec text (each needs his yes): (1) the `tidy()` mirror in `customer_check.js` also feeds `subjectLost` and also applies the typo fix (spec names `askLost` and filler removal only); (2) a Better-graded prompt now shows its cleaned text in the Better tab, not the raw prompt (needed for the spec's target Better); (3) "if possible", "if you can" and mid-sentence "can/could you" before a verb are removed (needed for the spec's "0 filler"; rule 3 lists only sentence-initial forms); (4) General-area wording for data tasks is "This is for [what it feeds]." (the spec gives "[what it is for]" with no example only for the General area); (5) results go into a Result column of the spec's success table.

## Baselines

| | Value | Source |
|---|---|---|
| customer_check default (sim_customers) | PASS, 229 runs | measured by lead |
| customer_check data/test.jsonl | FAIL, 609 runs, notStrong 4/609 (one prompt, "missing C"), other categories 0 | measured by lead |
| eval rulefeat test.jsonl | `GRADE acc=0.856` | measured by lead |
| simulate (train + test) | strongNotStrong 8, betterWeak 5; 2,679 runs | measured by lead |
| Non-strong runs sim / test | 180 / 477 | read from spec |
| Strong with filler sim / test | 32 / 34 | read from spec |
| Strong containing "?" sim / test | 30 / 59 | read from spec |
| Strong blanks median / max | 2 / 4 | read from spec |

## File structure

- Modify `prompt-coach/engine/rewrite.js`: `sentenceSpans` (Task 3), ordered assembly with `src`/`idx` (Task 4), `directVoice` and the Better-stage change (Task 5), `fixTypos` (Task 6), `contextFragment`, `ALT.C`, only-Context rule (Task 7), tip in `workivaTips` (Task 8). Exports added to `api`: `directVoice`, `fixTypos`, `sentenceSpans`.
- Modify `prompt-coach/tests/customer_check.js`: new categories `filler`, `order`, `broken`, `blankMore`, `blankOnlyC`, `ianCase`; declared change to `tidy()` (Task 5).
- Create `prompt-coach/tests/rewrite_unit.test.js`, `prompt-coach/tests/make_blank_baseline.js`, `prompt-coach/tests/fixtures/rewrites/{ian_case.txt, ian_strong.txt, ian_better.txt, blank_baseline.json}` (Tasks 1, 3).
- Create `prompt-coach/research/live-tests/{make_live_fixtures.py, cases.json, make_cases.js, cases.md, fixtures/*}` (Tasks 9, 10).
- Create `docs/evidence/2026-10-16-prompt-coach-rewrites.md` (Task 12) and `docs/PROMPT_COACH_LIVE_TEST_RUN_PROMPT.txt` (Task 13).
- Modify `prompt-coach/README.md` in each code task; add a Result column to the spec's success table in Task 11.
- This plan file is committed with Task 1.

---

### Task 1: Fixtures and the 73be350 blank baseline

**Files:**
- Create: `prompt-coach/tests/fixtures/rewrites/ian_case.txt`, `ian_strong.txt`, `ian_better.txt`, `blank_baseline.json`
- Create: `prompt-coach/tests/make_blank_baseline.js`
- Commit with it: `docs/superpowers/plans/2026-10-16-prompt-coach-rewrites.md`

**Interfaces:**
- Produces: `ian_case.txt` (Ian's input), `ian_strong.txt` / `ian_better.txt` (golden targets from the spec), `blank_baseline.json` = `{ "<jsonl basename>|<row index>|<0 or 1 (file attached)>": <blank count in the Strong rewrite> }` for every non-strong run at the engine of 73be350.

- [ ] **Step 1: Red check (nothing exists yet)**

Run: `jq 'length' C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/fixtures/rewrites/blank_baseline.json`
Expected: fails with "No such file" (non-zero exit).

- [ ] **Step 2: LEAD: copy Ian's input; write the golden files**

Run: `cp C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/.ledger/2026-10-16-prompt-coach-rewrites/ian_case.txt C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/fixtures/rewrites/ian_case.txt` (create the `rewrites` folder first with `mkdir -p`).

Write `ian_strong.txt` (one line, UTF-8, em dash kept, copied from the spec's target):

```
I have attached the following utility bill invoices. This table feeds [what it is for, such as our Scope 2 inventory]. Input the applicable dates (use the first day of the month for each entry; for example, if the transaction was 9/18/2018, put 9/1/2018), location, emissions source, amount and amount unit in table format from each invoice. If there are multiple addresses on an invoice, break those out separately. The column headers should read as follows: Date, Location, Emissions Source, Amount, Amount Unit, Total Spend, Currency. Before finalizing your response, explicitly state how many documents/invoices you found in the knowledge base, then confirm that every single one is represented in the table. Do not stop at the first set of results — ensure all records are accounted for. For every row in the output table, include an inline citation indicating which invoice or document the data came from.
```

Write `ian_better.txt`: the identical text with the sentence `This table feeds [what it is for, such as our Scope 2 inventory]. ` removed (the second sentence).

- [ ] **Step 3: Write the baseline generator**

Create `prompt-coach/tests/make_blank_baseline.js`:

```js
/* Writes tests/fixtures/rewrites/blank_baseline.json: blank count in the Strong rewrite for every non-strong run
   (each prompt alone and with the matching file), keyed "<file>|<row>|<0/1>".
   Run ONLY while engine/ equals commit 73be350:  node tests/make_blank_baseline.js data/sim_customers.jsonl data/test.jsonl */
const fs = require('fs'), path = require('path');
const M = require('../engine/model.js'), W = require('../engine/rewrite.js'), C = require('../engine/classify.js');
const weights = JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/cls-weights.json'))));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
// same FILES table as customer_check.js (the probes read it the same way)
const src = fs.readFileSync(path.join(__dirname, 'customer_check.js'), 'utf8');
const FILES = eval('(' + src.match(/const FILES = (\{[\s\S]*?\n\});/)[1] + ')');
const out = {};
for (const f of process.argv.slice(2)) {
  fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).forEach((l, i) => {
    const r = JSON.parse(l);
    for (const withFile of [false, true]) {
      const file = withFile ? FILES[r.domain] : null; if (withFile && !file) continue;
      const o = W.coach(r.prompt, { files: file ? [file] : [], detect, ...C.pick(r.prompt, CLS) });
      if (o.grade === 'strong') continue;
      out[path.basename(f) + '|' + i + '|' + (withFile ? 1 : 0)] = (o.stages.strong.prompt.match(/\[[^\]]*\]/g) || []).length;
    }
  });
}
fs.writeFileSync(path.join(__dirname, 'fixtures/rewrites/blank_baseline.json'), JSON.stringify(out));
console.log('wrote', Object.keys(out).length, 'entries');
```

- [ ] **Step 4: Confirm the engine is still the 73be350 engine, then LEAD: generate**

Run: `git diff --stat 73be350 -- prompt-coach/engine | wc -l`
Expected: `0`

LEAD: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/make_blank_baseline.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/sim_customers.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl`
Expected: `wrote 657 entries` (spec: 180 + 477 non-strong runs; read, not measured. If the count differs, record the real number in the commit message; do not edit the script to force 657).

- [ ] **Step 5: Green check**

Run: `jq 'length' C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/fixtures/rewrites/blank_baseline.json`
Expected: `657` (same note).

Run: `grep -c "" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/fixtures/rewrites/ian_strong.txt C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/fixtures/rewrites/ian_better.txt`
Expected: each file reports `:1`.

- [ ] **Step 6: Commit (includes this plan file)**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/tests/fixtures/rewrites prompt-coach/tests/make_blank_baseline.js docs/superpowers/plans/2026-10-16-prompt-coach-rewrites.md && git commit -m "Prompt coach rewrites: plan, Ian's case fixtures and blank baseline at 73be350"
```

```role-checks
jq 'length' C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/fixtures/rewrites/blank_baseline.json
grep -c "" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/fixtures/rewrites/ian_strong.txt C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/fixtures/rewrites/ian_better.txt
git diff --stat 73be350 -- prompt-coach/engine | wc -l
```

(README: no behaviour change in this task; Task 2 documents the new checks.)

---

### Task 2: Failing checks in customer_check.js

**Files:**
- Modify: `prompt-coach/tests/customer_check.js` (add categories; do not touch the `const FILES = {...};` block, the probes eval it)
- Modify: `prompt-coach/README.md`

**Interfaces:**
- Consumes: `fixtures/rewrites/*` (Task 1), `o.stages.better.prompt`.
- Produces: categories `filler`, `order`, `broken`, `blankMore`, `blankOnlyC`, `ianCase`, printed like the existing ones; an `info:` line `info: only-Context-missing runs N | strong with "?" M | strong blanks median X`.

- [ ] **Step 1: Add the checks**

(a) Keep the file name and row index. Replace the `rows` line with:

```js
const rows = files.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l, i) => ({ ...JSON.parse(l), __f: path.basename(f), __i: i })));
```

(b) After the `words` helper add:

```js
const BASE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/rewrites/blank_baseline.json'), 'utf8'));
const BASE_FILES = new Set(Object.keys(BASE).map((k) => k.split('|')[0]));
// same list as the probe; "if you can't ..." is an evaluate rule, not filler
const FILLER = [/\bplease\b|\bpls\b|\bplz\b/i, /\bkindly\b/i, /\bthank(?:s| you)\b|\bthx\b/i, /\bcan (?:you|u)\b/i, /\bcould you\b/i, /\bwould you(?: mind)?\b/i, /\bi (?:was|am) wondering\b|\bi wonder\b/i, /\bif (?:possible|you (?:can|could)(?!['’]t| not))\b/i];
const unbalanced = (x) => x.split('(').length !== x.split(')').length || x.split('[').length !== x.split(']').length;
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const info = { onlyC: 0, strongQ: 0, blanks: [] };
```

(c) Add keys to the `fail` object: `filler: [], order: [], broken: [], blankMore: [], blankOnlyC: [], ianCase: []`.

(d) Inside the loop, after the line `const s = o.stages.strong.prompt, bare = ...;` add:

```js
  const bt = o.stages.better.prompt, blanks = (s.match(/\[[^\]]*\]/g) || []).length;
  const onlyC = K.filter((k) => !o.detected[k]).join('') === 'C' && !r.prompt.includes('[');
  info.blanks.push(blanks); if (s.includes('?')) info.strongQ++;
  if (FILLER.some((re) => re.test(s) || re.test(bt))) fail.filler.push([r.prompt, FILLER.some((re) => re.test(s)) ? s : bt]);
  { // kept sentences appear in the user's order: the first 20 cleaned characters of each, where found, at increasing positions
    const ns = norm(s); let last = -1, bad = false;
    for (const sent of r.prompt.split(/(?<=[.!?\n])\s+/).filter((x) => words(x).length >= 3)) {
      const key = norm(tidy(sent)).slice(0, 20); if (key.length < 8) continue;
      const at = ns.indexOf(key); if (at < 0) continue;
      if (at < last) { bad = true; break; } last = at;
    }
    if (bad) fail.order.push([r.prompt, s]); }
  if ((/;\s*[.!?]/.test(s) && !/;\s*[.!?]/.test(r.prompt)) || (unbalanced(s) && !unbalanced(r.prompt))) fail.broken.push([r.prompt, s]);
  { const key = r.__f + '|' + r.__i + '|' + (withFile ? 1 : 0);
    if (BASE_FILES.has(r.__f)) {
      if (!(key in BASE)) fail.blankMore.push([r.prompt, 'no baseline entry', s]);
      else { const allowed = onlyC ? Math.max(BASE[key], 1) : BASE[key]; if (blanks > allowed) fail.blankMore.push([r.prompt, blanks + ' > ' + allowed, s]); } } }
  if (onlyC) { info.onlyC++; if (blanks !== 1) fail.blankOnlyC.push([r.prompt, blanks, s]); }
```

`tidy` is the existing helper defined above the loop; Task 5 widens it.

(e) After the loop, before the summary print, add the golden check for Ian's case (it runs once whatever data file is given) and the info line:

```js
{ const rd = (f) => fs.readFileSync(path.join(__dirname, 'fixtures/rewrites', f), 'utf8').replace(/\r/g, ''), flat = (x) => x.replace(/\s+/g, ' ').trim();
  const ian = rd('ian_case.txt').trim(), want = { strong: flat(rd('ian_strong.txt')), better: flat(rd('ian_better.txt')) };
  const pdf = { name: 'Utility invoices Sep 2018.pdf', kind: 'PDF', sheets: [], periods: [], text: 'Invoice Account Service address Usage kWh Amount due USD' };
  for (const fl of [[], [pdf]]) { const o = W.coach(ian, { files: fl, detect, ...C.pick(ian, CLS) });
    for (const st of ['strong', 'better']) if (flat(o.stages[st].prompt) !== want[st]) fail.ianCase.push([st + ' files=' + fl.length, o.stages[st].prompt]); } }
const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
console.log('info: only-Context-missing runs', info.onlyC, '| strong with "?"', info.strongQ, '| strong blanks median', med(info.blanks));
```

- [ ] **Step 2: Run on the parent engine; the new categories must fail**

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(filler|order|broken|blankMore|blankOnlyC|ianCase|casual|numbers|askLost|subjectLost|notStrong) |^FAIL|^PASS|^info"`
Expected: `filler` about 32 failing runs (spec: 32 of 180 non-strong sim runs, read); `ianCase 4/229`; `blankMore 0`; the old categories `0/229` (parent default run was PASS 229, measured); last lines `FAIL 229 runs` and an `info:` line.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(filler|order|ianCase|blankMore|blankOnlyC|notStrong) |^FAIL|^PASS"`
Expected: `filler` about 34 (read), `notStrong 4/609` (measured on the parent), `FAIL 609 runs`.

- [ ] **Step 3: Record which new categories are really red**

Copy the two `e.g.` lines of `blankOnlyC` (expected on test.jsonl: the "We need this for our user-control assessment" prompt with 0 blanks) and of `order` into the commit message. Where `order`, `broken` or `blankOnlyC` print 0 on the parent for a data set, they are regression guards there; the Ian-case check and the unit tests in Tasks 3, 4 and 7 carry the red. Do not change a check to force a failure.

- [ ] **Step 4: README**

In `prompt-coach/README.md` replace the command line `node tests/customer_check.js                         # strong version keeps the user's ask, adds blanks not facts` with:

```
node tests/customer_check.js                         # strong version keeps the user's ask, adds blanks not facts; no filler, original order, whole pieces, blank rule, Ian's invoice case
```

- [ ] **Step 5: Commit the failing checks**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/tests/customer_check.js prompt-coach/README.md && git commit -m "Prompt coach rewrites: failing checks first (filler, order, whole pieces, blank rule, Ian's case)"
```

```role-checks
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(filler|order|broken|blankMore|blankOnlyC|ianCase|casual|numbers|askLost|subjectLost|notStrong) |^FAIL|^PASS|^info"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(filler|order|ianCase|blankMore|blankOnlyC|notStrong) |^FAIL|^PASS"
```

---

### Task 3: Splitting (a `;` and anything inside ( ) or [ ] never ends a sentence)

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (new `sentenceSpans`; `userSegments`)
- Create: `prompt-coach/tests/rewrite_unit.test.js`
- Modify: `prompt-coach/README.md`

**Interfaces:**
- Produces: `sentenceSpans(prompt) -> [{start, end}]` (exported in `api`); `userSegments` uses it.

- [ ] **Step 1: Write the failing unit tests (this file's helper block is reused by later tasks)**

Create `prompt-coach/tests/rewrite_unit.test.js`:

```js
/* node --test --test-reporter=tap tests/rewrite_unit.test.js : one focused test per rewrite rule (spec 2026-10-16).
   The tap reporter is needed: since Node 23 the default reporter prints "ℹ pass N", which "^# pass" greps miss. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const M = require('../engine/model.js'), W = require('../engine/rewrite.js'), C = require('../engine/classify.js');
const weights = JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/cls-weights.json'))));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
const K = ['S', 'C', 'O', 'P', 'E'];
const IAN = fs.readFileSync(path.join(__dirname, 'fixtures/rewrites/ian_case.txt'), 'utf8').replace(/\r/g, '').trim();
const PDF = { name: 'Utility invoices Sep 2018.pdf', kind: 'PDF', sheets: [], periods: [], text: 'Invoice Account Service address Usage kWh Amount due USD' };
const run = (prompt, files = [], extra = {}) => W.coach(prompt, { files, detect, ...C.pick(prompt, CLS), ...extra });
const missing = (o) => K.filter((k) => !o.detected[k]).join('');
const bal = (s, a, b) => s.split(a).length === s.split(b).length;

test('splitting: a semicolon inside parentheses never ends a sentence (Ian case)', () => {
  const o = run(IAN);
  assert.notEqual(o.grade, 'strong');
  const s = o.stages.strong.prompt;
  assert.ok(!/;\s*[.!?]/.test(s), s);
  assert.ok(s.includes('for each entry; for example'), s);
  assert.ok(bal(s, '(', ')') && bal(s, '[', ']'), s);
});

test('splitting: square brackets and a trailing semicolon stay whole', () => {
  const o = run('Summarize the attached report [see the Q3 tab; skip Q2]. Keep it to five bullets;\nDo not guess.');
  assert.notEqual(o.grade, 'strong');
  const s = o.stages.strong.prompt;
  assert.ok(s.includes('[see the Q3 tab; skip Q2]'), s);
  assert.ok(!/;\s*[.!?]/.test(s), s);
});

test('splitting: sentenceSpans keeps decimals and an unclosed bracket inside its paragraph', () => {
  const t = 'Margin rose 14.2% (see A.8.x; note). Next (unclosed bracket here.\nSecond paragraph.';
  const sp = W.sentenceSpans(t).map((x) => t.slice(x.start, x.end));
  assert.deepEqual(sp, ['Margin rose 14.2% (see A.8.x; note).', ' Next (unclosed bracket here.', 'Second paragraph.']);
});
```

The third test pins "an unclosed bracket swallows the rest of its paragraph but never the next one". If the first two spans differ only by leading-space handling, adjust the expected strings to what the scanner returns, but keep decimals and `A.8.x` unsplit and the paragraph boundary intact.

- [ ] **Step 2: Run, expect FAIL**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 0` and `# fail 3` (the first two on `;.` or unbalanced text, the third because `W.sentenceSpans` is not a function).

- [ ] **Step 3: Implement**

In `rewrite.js`, before `userSegments` add:

```js
  // A sentence ends at . ! ? outside ( ) and [ ], or at a line break. A ";" never ends one. A "." followed by a
  // non-space ("14.2%", "A.8.x") is not an end. Brackets never carry across a line break.
  function sentenceSpans(prompt) {
    const spans = [], n = prompt.length; let i = 0;
    while (i < n) {
      while (i < n && prompt[i] === '\n') i++;
      if (i >= n) break;
      const start = i; let depth = 0, ended = false;
      while (i < n && prompt[i] !== '\n') {
        const c = prompt[i];
        if (c === '(' || c === '[') depth++;
        else if ((c === ')' || c === ']') && depth > 0) depth--;
        else if (depth === 0 && /[.!?]/.test(c) && !(c === '.' && i + 1 < n && /[^\s.]/.test(prompt[i + 1]))) { ended = true; break; }
        i++;
      }
      if (ended) while (i < n && /[.;!?]/.test(prompt[i])) i++;
      if (prompt.slice(start, i).trim()) spans.push({ start, end: i });
    }
    return spans;
  }
```

In `userSegments`, replace

```js
    const sentences = [];
    const re = /(?:[^.;!?\n]|\.(?=[^\s.]))+[.;!?]*/g; let m; // a period inside "14.2%" or "A.8.x" is not a sentence end
    while ((m = re.exec(prompt))) if (m[0].trim()) sentences.push({ start: m.index, end: m.index + m[0].length });
```

with `    const sentences = sentenceSpans(prompt);`

Change the closing-period line so a trailing `;` `,` `:` becomes the period instead of gaining one: replace `last.text = last.text.replace(/\s*$/, '.')` with `last.text = last.text.replace(/[\s;,:]*$/, '.')`. Add `sentenceSpans` to `api`.

- [ ] **Step 4: Run, expect PASS; confirm nothing else moved**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 3`, `# fail 0`.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(numbers|role|askLost|sheet|notStrong|casual|splitNumber|subjectLost|broken|blankMore) "`
Expected: every listed category `0/229`. Merging sentences at ";" can change the vague-sentence replace path (8-word limit), so `blankMore` is checked here; if it is above 0, read the `e.g.` lines and fix the splitter, not the check.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(runs|strongNotStrong|betterWeak|badText|dupSentence)"`
Expected: `strongNotStrong 8`, `betterWeak 5` or lower (parent measured 8 and 5); `badText` and `dupSentence` not higher than before this task (record them at the start of the task).

- [ ] **Step 5: README and commit**

Add to `prompt-coach/README.md` a section after "Known limits" (later tasks add bullets):

```
## Rewrite wording rules (2026-10-16)

- Sentences: a `;` and anything inside `( )` or `[ ]` never ends a sentence, so a kept sentence is never cut in half. Unit tests: `node --test --test-reporter=tap tests/rewrite_unit.test.js`.
```

Also add `node --test --test-reporter=tap tests/rewrite_unit.test.js   # one test per rewrite rule` to the command block.

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js prompt-coach/README.md && git commit -m "Prompt coach rewrites: a semicolon or bracket never ends a sentence"
```

```role-checks
node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(numbers|role|askLost|sheet|notStrong|casual|splitNumber|subjectLost|broken|blankMore) "
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(runs|strongNotStrong|betterWeak|badText|dupSentence)"
```

---

### Task 4: Order (kept sentences stay in the user's order)

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`userSegments` result gets `idx`; `build()` in `coach()`)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (append)
- Modify: `prompt-coach/README.md`

**Interfaces:**
- Consumes: `sentenceSpans` (Task 3).
- Produces: every non-generated segment in `o.segments` has a numeric `src` (index of the user's sentence it came from; spacer segments carry their sentence's `src`); generated segments have `generated: true` and no `src`. Order: opening Source sentences, generated Source, generated Context, the remaining kept sentences with the generated Objective inserted where the (first) replaced vague sentence was (else straight after Context), then generated Parameters, generated Evaluate. Every segment keeps its `letter`.

- [ ] **Step 1: Append failing tests**

```js
test('order: kept sentences keep the user order (Ian case)', () => {
  const s = run(IAN).stages.strong.prompt;
  const at = (x) => { const i = s.indexOf(x); assert.ok(i >= 0, x + ' missing in: ' + s); return i; };
  assert.ok(at('I have attached') < at('break those out') && at('break those out') < at('column headers') && at('column headers') < at('Before finalizing') && at('Before finalizing') < at('For every row'), s);
});

test('order: letters do not regroup the user sentences', () => {
  const o = run('Keep it under five bullets. Summarize the attached report. This is for the audit committee.');
  assert.notEqual(o.grade, 'strong');
  const s = o.stages.strong.prompt;
  assert.ok(s.indexOf('five bullets') < s.indexOf('Summarize the attached') && s.indexOf('Summarize the attached') < s.indexOf('audit committee'), s);
  const us = o.segments.filter((g) => !g.generated);
  assert.ok(us.every((g) => typeof g.src === 'number') && us.every((g, i) => !i || g.src >= us[i - 1].src));
});

test('order: generated Context sits right after the opening Source sentence, before the next user sentence', () => {
  const o = run(IAN, [PDF]);
  const segs = o.segments, gi = segs.findIndex((g) => g.generated && g.letter === 'C');
  assert.ok(gi > 0, 'no generated Context segment');
  assert.ok(segs.slice(0, gi).every((g) => g.src === 0 || /^\s*$/.test(g.text)), JSON.stringify(segs.slice(0, gi).map((g) => [g.letter, g.src, g.text])));
  const next = segs.slice(gi + 1).find((g) => !/^\s*$/.test(g.text));
  assert.ok(next && !next.generated && next.src === 1, 'the segment after Context must start sentence 1 ("Input the applicable dates"), got ' + JSON.stringify(next));
});

test('order: a generated Objective takes the place of the vague sentence it replaced', () => {
  const o = run('Analyze the revenue changes. I attached the Q3 flux file.');
  const segs = o.segments, oi = segs.findIndex((g) => g.generated && g.letter === 'O');
  assert.ok(oi >= 0, 'this prompt did not take the replace-the-vague-sentence path: ' + o.stages.strong.prompt);
  const si = segs.findIndex((g) => !g.generated && /attached/.test(g.text));
  assert.ok(si > oi, 'user Source sentence must come after the Objective that replaced the vague sentence before it');
});
```

If the fourth test's prompt does not take the replace path (its message says so), pick another "vague sentence, then a Source sentence" prompt from `prompt-coach/data/sim_customers.jsonl` (`grep -n "\"prompt\": \"\(Analy\|Review\|Look\)" prompt-coach/data/sim_customers.jsonl | head`), check with the same assertion, and note the substitution in the commit message.

- [ ] **Step 2: Run, expect FAIL**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 3`, `# fail 4`. (Test 3 is red on the parent because there Context follows "Before finalizing", so the segment after it is not sentence 1.)

- [ ] **Step 3: Implement ordered assembly**

In `userSegments`, give each sentence its index: the `out.push({ host, segs, inside, text: sentText, vague, letters: ... })` call also gets `idx: out.length`.

In `coach()` > `build(broad)`:
1. Add `let objAt = -1;` next to `let folded = false;`.
2. In the replace-the-vague-sentence branch, as the first statement inside the `if (...) {` before `const taken = [];`, add `if (objAt < 0) objAt = kept.length;` (the Objective takes the first replaced sentence's place; the broad path can replace more than one). Give the pushed extras the sentence index: `kept.push({ host: x.k, idx: snt.idx, segs: [...], letters: new Set([x.k]) })`.
3. In the fold branch (`g.O = 'For ' + subject ...; folded = true; continue;`) add `if (objAt < 0) objAt = kept.length;` before `continue`.
4. Replace the block from `const present = new Set(); ...` through the `for (const k of K) {...}` loop (ends just before `const allOn = new Set(K);`) with:

```js
      const present = new Set(); for (const snt of kept) for (const l of snt.letters) present.add(l);
      const genUsed = new Set();
      for (const k of K) if (!present.has(k) || (k === 'O' && !on.O) || (k === 'S' && !on.S && !present.has('S'))) genUsed.add(k);
      const segments = [];
      const emit = (list) => { for (const snt of list) { for (const x of snt.segs) segments.push({ ...x, src: snt.idx }); segments.push({ text: ' ', letter: snt.host, src: snt.idx }); } };
      const pushGen = (k) => { if (genUsed.has(k)) segments.push({ text: g[k], letter: k, generated: true }); };
      // opening Source sentences: leading kept Source sentences that come before any replaced vague sentence
      let open = 0; while (open < kept.length && kept[open].host === 'S' && (objAt < 0 || open < objAt)) open++;
      const cut = genUsed.has('O') ? Math.min(Math.max(objAt >= 0 ? objAt : open, open), kept.length) : kept.length;
      emit(kept.slice(0, open)); pushGen('S'); pushGen('C');
      emit(kept.slice(open, cut)); pushGen('O'); emit(kept.slice(cut));
      pushGen('P'); pushGen('E');
```

Do not name the helper `gen` (it would shadow the outer `gen` object that `const g = { ...gen }` reads).

If the Ian-case Context test fails because sentence 0's host letter is not `S`, run `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/.ledger/2026-10-16-prompt-coach-rewrites/repro.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/.ledger/2026-10-16-prompt-coach-rewrites/ian_case.txt | grep -A12 SEGMENTS` to see the host letters, then widen `open` to also accept `kept[open].letters.has('S') && kept[open].host !== 'O'`. Record that in the commit message.

- [ ] **Step 4: Run, expect PASS; existing checks unchanged**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 7`, `# fail 0`.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(order|numbers|askLost|notStrong|subjectLost|sheet|blankMore|broken) "`
Expected: all `0/229` (`order` was red or a guard before).

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(runs|strongNotStrong|betterWeak|toggleNoEffect|dupSentence|badText|emptyFrag)"`
Expected: `strongNotStrong 8` or lower, `betterWeak 5` or lower, `toggleNoEffect 0`, `emptyFrag 0`.

- [ ] **Step 5: README and commit**

Append to the "Rewrite wording rules" section: `- Order: kept sentences appear in the user's order. Generated Source and Context go right after the opening Source sentences; a generated Objective takes the place of the vague sentence it replaced; generated Parameters and Evaluate go last. Every piece keeps its letter, so the SCOPE toggles work as before.`

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js prompt-coach/README.md && git commit -m "Prompt coach rewrites: kept sentences stay in the user's order"
```

```role-checks
node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(order|numbers|askLost|notStrong|subjectLost|sheet|blankMore|broken) "
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(runs|strongNotStrong|betterWeak|toggleNoEffect|dupSentence|badText|emptyFrag)"
```

---

### Task 5: Direct voice (and the Better stage for a Better-graded prompt)

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`directVoice` next to `tidyChat`; `assemble`; `stages.better`; `api`)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (append)
- Modify: `prompt-coach/tests/customer_check.js` (declared change to `tidy()`)
- Modify: `prompt-coach/README.md`

**Interfaces:**
- Consumes: `sentenceSpans` (Task 3).
- Produces: `directVoice(text) -> text` (exported). `assemble()` applies it, so Better, Strong and the SCOPE toggle fragments all use it. For a prompt graded `better`, `stages.better.prompt` is now the rewritten Better text (Strong's user pieces without generated Context/Parameters/Evaluate). If that text re-grades `weak`, the fallback is the cleaned user text (`assemble([{ text: prompt, letter: 'O' }], new Set(K))`: tidy, direct voice, typos), never the raw prompt.

- [ ] **Step 1: Append failing tests**

```js
test('direct voice: sentence-initial politeness becomes an imperative; other questions stay', () => {
  const cases = [
    ['Please input the dates.', 'Input the dates.'],
    ['Kindly send the list.', 'Send the list.'],
    ['Can you please summarize the attached report?', 'Summarize the attached report.'],
    ['Could you list every control?', 'List every control.'],
    ['Would you mind reviewing the memo?', 'Review the memo.'],
    ['Would you mind reconciling the accounts?', 'Would you mind reconciling the accounts?'],
    ['I was wondering if you could check the totals.', 'Check the totals.'],
    ["I'd like you to extract the dates.", 'Extract the dates.'],
    ['I need you to flag gaps.', 'Flag gaps.'],
    ['Additionally, ensure that if a row is blank, flag it.', 'If a row is blank, flag it.'],
    ['Also, please make sure if there are two addresses, split them.', 'If there are two addresses, split them.'],
    ['Use it (please use column B) for the list.', 'Use it (use column B) for the list.'],
    ['Send the table pls.', 'Send the table.'],
    ['Summarize it, thanks.', 'Summarize it.'],
    ['Do it, if possible.', 'Do it.'],
    ["If you can't tell why a row moved, say so.", "If you can't tell why a row moved, say so."],
    ['Q3 is due Friday can you draft the memo?', 'Q3 is due Friday. Draft the memo.'],
    ['Pull the data, and can you rewrite the bio?', 'Pull the data, and rewrite the bio.'],
    ['What can you tell me about SG&A?', 'What can you tell me about SG&A?'],
    ['List the invoice(s) and word(s).', 'List the invoices and words.'],
    ['What drove the change in SG&A?', 'What drove the change in SG&A?']
  ];
  for (const [i, want] of cases) assert.equal(W.directVoice(i), want, i);
});

test('direct voice: no filler in Better or Strong (Ian case, with and without the file)', () => {
  const FILL = /\bplease\b|\bpls\b|\bkindly\b|\bcan you\b|\bcould you\b|\bwould you\b|\bi was wondering\b|\bif possible\b/i;
  for (const files of [[], [PDF]]) {
    const o = run(IAN, files);
    assert.ok(!FILL.test(o.stages.better.prompt), o.stages.better.prompt);
    assert.ok(!FILL.test(o.stages.strong.prompt), o.stages.strong.prompt);
    assert.ok(o.stages.better.prompt.startsWith('I have attached the following utility bill invoices. Input the applicable dates'), o.stages.better.prompt);
  }
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 7`, `# fail 2` (`W.directVoice is not a function`; Better still shows the raw prompt with "Please").

- [ ] **Step 3: Implement `directVoice`**

Below `tidyChat` in `rewrite.js` add:

```js
  // Direct voice: polite openers become imperatives, filler words go. Questions that are not
  // "can/could/would you + verb" stay questions; a "?" becomes "." only on a sentence we converted.
  const GERUND = { summarizing: 'summarize', reviewing: 'review', checking: 'check', listing: 'list', extracting: 'extract', comparing: 'compare', writing: 'write', drafting: 'draft', explaining: 'explain', looking: 'look', pulling: 'pull', putting: 'put', sending: 'send', giving: 'give', making: 'make', taking: 'take', finding: 'find', creating: 'create', preparing: 'prepare', flagging: 'flag', mapping: 'map', rewriting: 'rewrite', identifying: 'identify', analyzing: 'analyze', analysing: 'analyse' };
  function directSentence(s) {
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/); const lead = m[1], trail = m[3]; let b = m[2]; const orig = b; let converted = false;
    b = b.replace(/^(?:additionally|also),?\s+(?:(?:please|kindly)\s+)?(?:ensure|make sure)(?: that)?\s+(?=if\b)/i, () => { converted = true; return ''; });
    b = b.replace(/^(?:(?:please|kindly|pls|plz),?\s+)?would you mind\s+([a-z]+ing)\b\s*/i, (x, g) => (GERUND[g.toLowerCase()] ? (converted = true, GERUND[g.toLowerCase()] + ' ') : x));
    b = b.replace(/^(?:(?:please|kindly|pls|plz),?\s+)?(?:(?:can|could|would) you(?!\s+mind\b)|i was wondering if you (?:could|can|would)|i wonder if you (?:could|can)|i(?:'d| would) (?:like|love) you to|i (?:need|want) you to)(?:,?\s+(?:please|kindly|pls|plz))?,?\s+(?=[a-z])/i, () => { converted = true; return ''; });
    // declared extension of spec rule 3: a "can/could you + verb" in the middle of a sentence (not a question word first)
    if (!/^(?:what|which|who|whom|whose|when|where|why|how)\b/i.test(b)) {
      b = b.replace(/\b(and|then|so)\s+(?:can|could|would) you(?:\s+(?:please|kindly))?\s+(?=[a-z])/gi, (x, w) => { converted = true; return w + ' '; })
        .replace(/([A-Za-z0-9)])\s+(?:can|could) you(?:\s+(?:please|kindly))?\s+([a-z])/gi, (x, p, c) => { converted = true; return p + '. ' + c.toUpperCase(); });
    }
    b = b.replace(/,?\s+(?:please|pls|plz|kindly|thanks|thank you)(?: so much| in advance| a lot)?\s*(?=[.!?]|$)/gi, '')
      .replace(/,?\s+if (?:at all )?possible\s*(?=[.!?]|$)/gi, '').replace(/^if (?:at all )?possible,?\s+/i, '')
      .replace(/^if you (?:can|could),\s+/i, '').replace(/,?\s+if you (?:can|could)\s*(?=[.!?]|$)/gi, '')
      .replace(/\b(?:please|pls|plz|kindly),?\s+/gi, '')
      .replace(/\b([A-Za-z]{3,})\(s\)/g, '$1s');
    if (b !== orig) b = b.replace(/^[a-z]/, (c) => c.toUpperCase());
    if (converted) b = b.replace(/\?+$/, '.');
    return lead + b + trail;
  }
  function directVoice(text) {
    let out = '', cur = 0;
    for (const sp of sentenceSpans(text)) { out += text.slice(cur, sp.start) + directSentence(text.slice(sp.start, sp.end)); cur = sp.end; }
    return out + text.slice(cur);
  }
```

In `assemble`, after the line `t = tidyChat(t).replace(/([.!?])[.!?]+/g, ...)` add: `t = directVoice(t).replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/\(\s*\)/g, '').trim();` (before the capitalising `return`).

Stage change in `coach()`: replace the `better:` prompt expression `grade === 'better' ? prompt.trim() : betterP` with:

```js
grade !== 'better' || R.grade(detect(betterP).on) !== 'weak' ? betterP : assemble([{ text: prompt, letter: 'O' }], allOn)
```

(keep the existing `verdict:` expression). Add `directVoice` to `api`.

- [ ] **Step 4: Run, expect unit PASS; iterate on the filler list with the set-wide check**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 9`, `# fail 0`.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(filler|askLost|subjectLost|casual) |e\.g\." | head -8`
Expected now: `filler` below 32 (ideally 0) and `askLost` / `subjectLost` non-zero for the wrong reason (the check compares the polite user sentence with the new imperative). If `filler` is above 0, read the `e.g.` lines and add only patterns from the probe's filler list (please, kindly, thanks, can/could/would you, I was wondering, if possible / if you can) to `directSentence`; repeat until `filler 0` on both data sets. Do not strip an evaluate rule such as "If you can't tell ...". Do not remove other words.

- [ ] **Step 5: Declared change to `customer_check.js` (`tidy`)**

Rename the existing `const tidy = (x) => x.replace(...)...;` to `const tidy0` (same chain, unchanged) and add:

```js
// declared change (spec 2026-10-16, deviation for Ian's yes): the compared user sentence gets the same direct-voice and typo rewrite as the output.
// It feeds askLost (named in the spec) and subjectLost and the new order check (not named).
const tidy = (x) => (W.fixTypos || ((y) => y))(W.directVoice(tidy0(x)));
```

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(filler|askLost|subjectLost|numbers|role|sheet|notStrong|casual|splitNumber|unsureTask|unsureArea|assumedSource|writeOnly|fileHeadline|order|broken|blankMore) "`
Expected: all `0/229` (`ianCase` and `blankOnlyC` stay red until Tasks 6 and 7).

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(filler|askLost|subjectLost|order|broken|blankMore) "`
Expected: all `0/609`. Mid-sentence "can you" (test.jsonl lines 238 and 262, read by the reviewer) is covered by the extension above.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(strongNotStrong|betterWeak|badText|dupSentence)"`
Expected: `strongNotStrong` 8 or lower, `betterWeak` 5 or lower (if the Better-stage change pushes it past 5, tighten the guard to `=== 'better'` and re-run), `badText` and `dupSentence` not higher than before this task.

- [ ] **Step 6: README and commit**

Append: `- Direct voice (Better and Strong): sentence-initial "please", "kindly", "can/could/would you", "would you mind", "I was wondering if you could", "I'd like/need/want you to" become an imperative; "please", "pls", "thanks", "if possible" and a mid-sentence "can/could you" before a verb are removed; "Additionally/Also, (please) ensure/make sure (that) if" becomes "If"; "word(s)" becomes "words"; a "?" becomes "." only on a converted sentence. Style only: the evidence on "please" is mixed (research/2026-10-16-prompting-evidence.md). A Better-graded prompt now shows its cleaned-up text in the Better tab, not the raw prompt.`

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js prompt-coach/tests/customer_check.js prompt-coach/README.md && git commit -m "Prompt coach rewrites: direct voice in Better and Strong; askLost compares the same cleaned wording"
```

```role-checks
node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(filler|askLost|subjectLost|numbers|role|sheet|notStrong|casual|splitNumber|unsureTask|unsureArea|assumedSource|writeOnly|fileHeadline|order|broken|blankMore) "
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(filler|askLost|subjectLost|order|broken|blankMore) "
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(strongNotStrong|betterWeak|badText|dupSentence)"
```

---

### Task 6: Typos

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`TYPOS`, `fixTypos`, `assemble`, `api`)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (append)
- Modify: `prompt-coach/README.md`

**Interfaces:**
- Produces: `fixTypos(text) -> text` (exported): whole words only; keeps a leading capital or ALL CAPS. `assemble()` applies it after `directVoice`. `customer_check.js` already calls it through `tidy` (Task 5).

- [ ] **Step 1: Append failing test**

```js
test('typos: common misspellings are fixed as whole words, case kept', () => {
  assert.equal(W.fixTypos('Seperately, recieve it; occured untill tomorrow. Teh adress is definately wierd.'), 'Separately, receive it; occurred until tomorrow. The address is definitely weird.');
  assert.equal(W.fixTypos('The seperatelyx and Reciever words stay.'), 'The seperatelyx and Reciever words stay.');
  assert.ok(!/seperat/.test(run(IAN).stages.strong.prompt));
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 9`, `# fail 1`.

- [ ] **Step 3: Implement**

Below `directVoice` in `rewrite.js`:

```js
  const TYPOS = { seperate: 'separate', seperately: 'separately', recieve: 'receive', recieved: 'received', occured: 'occurred', occurence: 'occurrence', occuring: 'occurring', definately: 'definitely', accomodate: 'accommodate', acheive: 'achieve', begining: 'beginning', beleive: 'believe', calender: 'calendar', wich: 'which', teh: 'the', adress: 'address', adresses: 'addresses', enviroment: 'environment', existance: 'existence', independant: 'independent', neccessary: 'necessary', necesary: 'necessary', refered: 'referred', succesful: 'successful', tommorow: 'tomorrow', untill: 'until', wierd: 'weird' };
  const TYPO_RE = new RegExp('\\b(' + Object.keys(TYPOS).join('|') + ')\\b', 'gi');
  function fixTypos(t) {
    return t.replace(TYPO_RE, (m) => { const f = TYPOS[m.toLowerCase()];
      if (m.length > 1 && m === m.toUpperCase()) return f.toUpperCase();
      return m[0] === m[0].toUpperCase() ? f[0].toUpperCase() + f.slice(1) : f; });
  }
```

In `assemble`, change the line added in Task 5 to start with `t = fixTypos(directVoice(t))...`. Add `fixTypos` to `api`.

- [ ] **Step 4: Run, expect PASS**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 10`, `# fail 0`.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(askLost|subjectLost|filler|order|broken|blankMore) "`
Expected: all `0/229`.

- [ ] **Step 5: README and commit**

Append: `- Typos: about 27 common misspellings ("seperately", "recieve", "occured", ...) are fixed as whole words in the user's text in rewrites (list: TYPOS in engine/rewrite.js).`

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js prompt-coach/README.md && git commit -m "Prompt coach rewrites: fix common typos in the user's wording"
```

```role-checks
node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(askLost|subjectLost|filler|order|broken|blankMore) "
```

---

### Task 7: Context wording, one-blank rule

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`contextFragment`, `ALT.C`, only-Context rule in `build()`)
- Modify: `prompt-coach/engine/rules.js` (ONLY if the step 3 probe shows the spec's wording does not register as Context; widen the existing Context cue whose probe control registers on its own; no new tag, no weight change)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (append)
- Modify: `prompt-coach/README.md`
- Create (LEAD, git-ignored): `.ledger/2026-10-16-prompt-coach-rewrites/ctx_probe.js`

**Interfaces:**
- Produces: for `extract`: `This table feeds [what it is for, such as <area example>].`; for `variance`, `anomaly`, `consistency`, `compare`, `map`, `formula`: `This is for [what it feeds, such as <area example>].`; other intents keep `This is for <DEST[area]>.`. Area examples: FR `the quarterly flux review`, GRC `our SOX control testing`, SUS `our Scope 2 inventory`, GEN none (`[what it is for]` for extract, `[what it feeds]` otherwise). `ALT.C` fallbacks have exactly one blank each. IAN YES 2026-10-17 (A): when Context is the only missing letter (detector: S, O, P, E on, C off), `genUsed` is exactly `{C}`: a Context piece is generated even when a kept sentence carries a Context cue the model does not credit, and no other letter is generated (so the prompt gets exactly one blank).

- [ ] **Step 1: Append failing tests**

```js
test('context: wording fits the task and registers as Context', () => {
  const base = 'Extract every date from the attached file into a table. Do not guess.';
  const want = [
    ['extract', 'SUS', 'This table feeds [what it is for, such as our Scope 2 inventory].'],
    ['extract', 'GEN', 'This table feeds [what it is for].'],
    ['variance', 'FR', 'This is for [what it feeds, such as the quarterly flux review].'],
    ['anomaly', 'GRC', 'This is for [what it feeds, such as our SOX control testing].'],
    ['compare', 'GEN', 'This is for [what it feeds].']
  ];
  for (const [intent, domain, text] of want) {
    const o = run(base, [], { intent, domain, taskSure: true, areaSure: true });
    assert.equal(missing(o), 'C', 'base must be missing only Context; probe another base: ' + JSON.stringify(o.detected));
    assert.ok(o.stages.strong.prompt.includes(text), intent + '/' + domain + ': ' + o.stages.strong.prompt);
    assert.equal((o.stages.strong.prompt.match(/\[[^\]]*\]/g) || []).length, 1, o.stages.strong.prompt);
  }
  const o = run(base, [], { intent: 'summarize', domain: 'FR', taskSure: true, areaSure: true });
  assert.ok(/10-Q MD&A|intended for \[who will read it/.test(o.stages.strong.prompt), 'other intents keep the destination wording or its one-blank fallback: ' + o.stages.strong.prompt);
});

test('context: only Context missing means exactly one blank, even when a kept sentence has a Context cue', () => {
  const rows = fs.readFileSync(path.join(__dirname, '../data/test.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const row = rows.find((r) => /user-control assessment/.test(r.prompt));
  assert.ok(row, 'the "We need this for our user-control assessment" prompt is in data/test.jsonl');
  const o = run(row.prompt);
  assert.equal(missing(o), 'C', JSON.stringify(o.detected));
  assert.equal((o.stages.strong.prompt.match(/\[[^\]]*\]/g) || []).length, 1, o.stages.strong.prompt);
  assert.notEqual(o.stages.strong.prompt.trim(), row.prompt.trim());
});

test('context: Ian case gets the approved Strong and Better text, with and without the file', () => {
  const flat = (x) => x.replace(/\s+/g, ' ').trim();
  const rd = (f) => flat(fs.readFileSync(path.join(__dirname, 'fixtures/rewrites', f), 'utf8'));
  for (const files of [[], [PDF]]) {
    const o = run(IAN, files);
    assert.equal(flat(o.stages.strong.prompt), rd('ian_strong.txt'));
    assert.equal(flat(o.stages.better.prompt), rd('ian_better.txt'));
  }
});
```

If the first assertion in test 1 says the base is not "only Context missing", change `base` to a prompt the detector reads as S+O+P+E (probe with the step 3 script's detector, not with the expected text).

- [ ] **Step 2: Run, expect FAIL**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 10`, `# fail 3`.

- [ ] **Step 3: LEAD: save the probe and run it (candidate wordings against the CURRENT rules)**

LEAD: write `.ledger/2026-10-16-prompt-coach-rewrites/ctx_probe.js`:

```js
const fs = require('fs'); const PC = process.argv[2];
const M = require(PC + '/engine/model.js');
const w = JSON.parse(fs.readFileSync(PC + '/engine/weights.json'));
const base = fs.readFileSync(PC + '/tests/fixtures/rewrites/ian_better.txt', 'utf8').trim();
const cands = ['',
  'This table feeds [what it is for, such as our Scope 2 inventory].', 'This table feeds [what it is for].',
  'This is for [what it feeds, such as the quarterly flux review].', 'This is for [what it feeds, such as our SOX control testing].', 'This is for [what it feeds].',
  'This is for [the 10-Q MD&A, the audit committee deck, or the close review].',
  'We need this for [what it is for].',
  'This is intended for [who will read it, such as our assurance provider].', 'The audience is [who will read it, such as my manager].'];
for (const x of cands) { const r = M.predict(base + ' ' + x, w, { mode: w.mode }); console.log(r.on.C ? 'C ON ' : 'C off', JSON.stringify(x)); }
```

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/.ledger/2026-10-16-prompt-coach-rewrites/ctx_probe.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach`
Expected: the empty control `C off`; `We need this for [what it is for].` `C off` (the 'purpose' cue alone does not turn C on: measured on the parent by the lead); the "This is intended for" line `C ON` (the 'audience-is' cue, 1.1, registered for Ian's case on the parent). Decision rule, in order: (a) if the five spec wordings (lines 2 to 6) say `C ON`, use them as written and skip step 4; (b) otherwise widen, in step 4, the existing cue whose control line registers alone (expected `audience-is`, not `purpose`); (c) if no widened cue turns lines 2 to 6 on with `GRADE acc=0.856` or higher, revert `rules.js` and STOP: tell Ian his target wording cannot register without a grading change (his call); do not change the target text.

- [ ] **Step 4 (conditional): widen the registering cue, then check eval**

In `engine/rules.js`, in the Context cue chosen in step 3 (expected the one tagged `'audience-is'`, regex `\b(?:audience|readers?|reader base) (?:is|are|will be)\b|\bwritten for\b|\baimed at\b|\btargeted at\b|\bintended for\b`), add the alternatives `|\bthis (?:table|list|output|extract|summary|result) feeds\b|\bthis is for \[`. No new tag, no weight edit. Re-run the step 3 probe (lines 2 to 6 must say `C ON`), then:

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/eval.js rulefeat C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep "GRADE acc"`
Expected: `acc=0.856` or higher (eval prints 3 decimals on 320 prompts, so one prompt lost shows as 0.853). If lower, revert the `rules.js` edit (rule (c) in step 3).

- [ ] **Step 5: Implement the wording, the one-blank fallbacks, and the only-Context rule**

In `rewrite.js` replace `contextFragment` with:

```js
  // Context fits the task: a table feeds something; other data tasks are "for" something. Blank, never a guessed audience.
  const CTX_EXAMPLE = { FR: 'the quarterly flux review', GRC: 'our SOX control testing', SUS: 'our Scope 2 inventory', GEN: null };
  const DATA_CTX = new Set(['variance', 'anomaly', 'consistency', 'compare', 'map', 'formula']);
  function contextFragment(ctx) {
    const ex = CTX_EXAMPLE[ctx.audDomain] ? ', such as ' + CTX_EXAMPLE[ctx.audDomain] : '';
    if (ctx.intent === 'extract') return 'This table feeds [what it is for' + ex + ']. ';
    if (DATA_CTX.has(ctx.intent)) return 'This is for [what it feeds' + ex + ']. ';
    return 'This is for ' + DEST[ctx.audDomain] + '. ';
  }
```

Keep today's `ALT.C[0]` text (`The audience is [who will read it, such as ...]`) only if the step 3 probe shows it registers; otherwise use the probe's registering wording. Either way each `ALT.C` entry must have exactly one blank: replace the second entry (`'The reader is [such as ...]; it is for ' + DEST + '. '`, two blanks) with `'This is intended for [who will read it, such as ' + AUDIENCE[ctx.audDomain] + ']. '`.

IAN YES 2026-10-17 (A): in `build()` replace the `genUsed` loop added in Task 4 with:

```js
      const onlyC = !on.C && K.every((k) => k === 'C' || on[k]);
      const genUsed = new Set(onlyC ? ['C'] : []);
      if (!onlyC) for (const k of K) if (!present.has(k) || (k === 'O' && !on.O) || (k === 'S' && !on.S && !present.has('S'))) genUsed.add(k);
```

(Fallback if Ian says no to (A): skip this replacement; in `customer_check.js` make `blankOnlyC` skip runs with no generated Context segment and `blankMore` use the plain baseline.)

- [ ] **Step 6: Run, expect PASS; blank rule and golden check green**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 13`, `# fail 0`.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(ianCase|blankOnlyC|blankMore|filler|order|broken|askLost|subjectLost|notStrong|numbers) |^FAIL|^PASS|^info"`
Expected: every category `0/229`, `PASS 229 runs`, and an `info:` line (record its three numbers for Task 11).

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(ianCase|blankOnlyC|blankMore|filler|order|broken|notStrong) |^FAIL|^PASS"`
Expected (IAN YES 2026-10-17 (A) default): all `0/609` and `PASS 609 runs` (parent: `notStrong 4/609`, `FAIL`). Fallback bar: `notStrong` at most 4/609 and only the parent's runs, every other category 0.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/eval.js rulefeat C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep "GRADE acc"`
Expected: `acc=0.856` or higher.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(strongNotStrong|betterWeak)"`
Expected: `strongNotStrong` 8 or lower, `betterWeak` 5 or lower.

- [ ] **Step 7: README and commit**

Append: `- Context fits the task: "This table feeds [what it is for, such as our Scope 2 inventory]." for extraction; "This is for [what it feeds, such as ...]." for variance, anomaly, consistency, compare, map and formula tasks; the example follows the area (flux review, SOX control testing, Scope 2 inventory; none for general). A prompt whose only missing letter is Context gets exactly one blank, even when one of its sentences has a Context cue the model does not credit.` If `rules.js` was edited, add: `One Context cue ('audience-is') was widened to read these sentences; grade accuracy on data/test.jsonl is <the printed value>.` (write the real value; leave no placeholder text).

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/engine prompt-coach/tests/rewrite_unit.test.js prompt-coach/README.md && git commit -m "Prompt coach rewrites: Context wording fits the task; one blank when only Context is missing"
```

```role-checks
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/.ledger/2026-10-16-prompt-coach-rewrites/ctx_probe.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach
node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^(ianCase|blankOnlyC|blankMore|filler|order|broken|askLost|subjectLost|notStrong|numbers) |^FAIL|^PASS|^info"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(ianCase|blankOnlyC|blankMore|filler|order|broken|notStrong) |^FAIL|^PASS"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/eval.js rulefeat C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep "GRADE acc"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(strongNotStrong|betterWeak)"
```

---

### Task 8: Tip for "attached" plus "knowledge base"

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`ctx.prompt`, `workivaTips`)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (append)
- Modify: `prompt-coach/README.md`

**Interfaces:**
- Produces: when the prompt says "attached" or "uploaded" and also "knowledge base", `o.tips` contains `Your prompt says both "attached" and "knowledge base". Use one: in chat, type @ and pick each file you want read.`

- [ ] **Step 1: Append failing test**

```js
test('tip: "attached" plus "knowledge base" gets a use-one tip; either alone does not', () => {
  const has = (o) => o.tips.some((t) => /both "attached" and "knowledge base"/.test(t) && /type @ and pick each file/.test(t));
  assert.ok(has(run(IAN)));
  assert.ok(has(run(IAN, [PDF])));
  assert.ok(!has(run('Summarize the attached report in five bullets.')));
  assert.ok(!has(run('Summarize what the knowledge base says about Scope 2 in five bullets.')));
  assert.ok(has(run('Check the uploaded file against the Knowledge Base and list differences.')));
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 13`, `# fail 1`.

- [ ] **Step 3: Implement**

In `coach()` add `prompt` to `ctx` (`const ctx = { prompt, t, files, ...`). In `workivaTips`, after the first `if/else if` that pushes the @ tip, add:

```js
    if (/\b(?:attached|uploaded)\b/i.test(ctx.prompt || '') && /\bknowledge base\b/i.test(ctx.prompt || '')) tips.push('Your prompt says both "attached" and "knowledge base". Use one: in chat, type @ and pick each file you want read.');
```

- [ ] **Step 4: Run, expect PASS**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 14`, `# fail 0`.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^FAIL|^PASS"`
Expected: `PASS 229 runs`.

- [ ] **Step 5: README and commit**

Append: `- Tip: a prompt that says both "attached"/"uploaded" and "knowledge base" gets a tip to use one and, in chat, type @ and pick each file. The @-file limits are unconfirmed (Workiva support pages returned 403 to the fetcher); the live test confirms them.`

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js prompt-coach/README.md && git commit -m "Prompt coach rewrites: tip when a prompt says both attached and knowledge base"
```

```role-checks
node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^FAIL|^PASS"
```

---

### Task 9: Synthetic live-test files and the case list

**Files:**
- Create: `prompt-coach/research/live-tests/make_live_fixtures.py`
- Create: `prompt-coach/research/live-tests/cases.json`
- Create (generated, LEAD): `prompt-coach/research/live-tests/fixtures/*` (14 files)

**Interfaces:**
- Produces: `cases.json` = `[{ "id", "area", "files": [names under fixtures/], "prompt" }]` (13 cases; `SUS-1` uses Ian's invoice prompt) and 14 synthetic files. Task 10 reads `cases.json`.

- [ ] **Step 1: Check the generator's libraries exist (no installs)**

LEAD: `python3 -c "import docx, openpyxl, reportlab; print('ok')"`
Expected: `ok`. If it errors, STOP and report (installing needs Ian's yes).

- [ ] **Step 2: Red check**

Run: `ls C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/fixtures`
Expected: fails ("No such file").

- [ ] **Step 3: Write `cases.json`**

Exactly these 13 cases (`SUS-1.prompt` is the exact text of `prompt-coach/tests/fixtures/rewrites/ian_case.txt`, newlines as `\n`):

| id | area | files | prompt |
|---|---|---|---|
| FR-1 | FR | fr_flux_q3.xlsx | Can you please look at the attached flux file and tell me what drove the change in SG&A between Q2 and Q3? Thanks! |
| FR-2 | FR | fr_revenue_footnote.docx, fr_trial_balance.xlsx | pls check that the numbers in the attached revenue footnote tie to the attached trial balance, kindly list any that dont match |
| FR-3 | FR | fr_mdna_draft.docx | Could you rewrite the liquidity paragraph in the attached MD&A draft so its shorter? Please keep every number. |
| FR-4 | FR | fr_accruals.xlsx | I was wondering if you could find any unusual accruals in the attached ledger extract, if possible. |
| GRC-1 | GRC | grc_rcm.xlsx | Please list the key controls in the attached RCM that have no owner. Also, please make sure that if a frequency is missing you flag it. |
| GRC-2 | GRC | grc_access_policy.docx | Can you review the attached access policy for gaps against SOX ITGC expectations? |
| GRC-3 | GRC | grc_test_results.xlsx | would you mind summarizing the deficiencies in the attached testing workbook for the audit committee? |
| GRC-4 | GRC | grc_walkthrough.docx | Turn the attached walkthrough narrative into numbered test steps. Please include the evidence to keep (seperately for each step). |
| SUS-1 | SUS | sus_utility_invoices.pdf | (Ian's invoice prompt, verbatim) |
| SUS-2 | SUS | sus_ghg_inventory.xlsx | Can you check the attached GHG inventory for outliers in Scope 3 and list them? |
| SUS-3 | SUS | sus_supplier_data.csv | Please extract every supplier with missing emissions data from the attached file into a table. |
| SUS-4 | SUS | sus_climate_policy.docx | Could you map the attached climate policy to ESRS E1 requirements? Thanks. |
| SUS-5 | SUS | sus_water_bills.pdf | Please input the applicable dates, location, usage and amount from each attached water bill (seperately for each address) in table format. |

- [ ] **Step 4: Write the generator**

Create `prompt-coach/research/live-tests/make_live_fixtures.py` (all content invented: "Example Co", "Example Supplier A-E", "100 Sample Street"; no real names, addresses, emails or phone numbers):

```python
"""Synthetic live-test files. python3 make_live_fixtures.py  (writes ./fixtures). Invented data only."""
import os
import docx, openpyxl
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixtures')
os.makedirs(OUT, exist_ok=True)

def xlsx(name, sheet, rows):
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = sheet
    for r in rows: ws.append(r)
    wb.properties.creator = 'synthetic'
    wb.save(os.path.join(OUT, name))

def doc(name, title, paras):
    d = docx.Document(); d.add_heading(title, 1)
    for p in paras: d.add_paragraph(p)
    d.core_properties.author = 'synthetic'
    d.save(os.path.join(OUT, name))

def pdf(name, pages):
    c = canvas.Canvas(os.path.join(OUT, name), pagesize=letter)
    c.setAuthor('synthetic')
    for lines in pages:
        y = 740
        for ln in lines: c.drawString(60, y, ln); y -= 18
        c.showPage()
    c.save()

xlsx('fr_flux_q3.xlsx', 'Summary', [['Account', 'Q2 FY26', 'Q3 FY26', 'Change'], ['Revenue', 1200, 1310, 110], ['Cost of revenue', 480, 505, 25], ['SG&A', 210, 268, 58], ['R&D', 150, 152, 2], ['Interest expense', 12, 12, 0]])
xlsx('fr_trial_balance.xlsx', 'TB', [['Account', 'Balance'], ['Product revenue', 790], ['Service revenue', 520], ['Deferred revenue', 140], ['Accounts receivable', 330]])
doc('fr_revenue_footnote.docx', 'Note 3: Revenue', ['Example Co recognized product revenue of $790 and service revenue of $510 for the quarter.', 'Deferred revenue was $140 at quarter end.'])
doc('fr_mdna_draft.docx', 'MD&A draft: Liquidity', ['Liquidity. As of the quarter end, Example Co held cash and cash equivalents of $412 million and had no borrowings outstanding under its revolving credit facility.', 'We believe existing cash, together with cash from operations, is sufficient to meet our needs for at least the next twelve months.'])
xlsx('fr_accruals.xlsx', 'Accruals', [['Entry', 'Account', 'Amount', 'Memo'], ['JE-101', 'Accrued bonus', 40, 'Q3 bonus'], ['JE-102', 'Accrued legal', 5, 'Routine'], ['JE-103', 'Accrued legal', 480, ''], ['JE-104', 'Accrued freight', 12, 'Sep freight'], ['JE-105', 'Accrued bonus', 40, 'Q3 bonus']])
xlsx('grc_rcm.xlsx', 'Controls', [['Control ID', 'Description', 'Owner', 'Frequency'], ['C-01', 'Journal entry review', 'Controller', 'Monthly'], ['C-02', 'Access recertification', '', 'Quarterly'], ['C-03', 'Bank reconciliation', 'Treasury lead', ''], ['C-04', 'Vendor master change approval', '', ''], ['C-05', 'Revenue cutoff review', 'Revenue accountant', 'Monthly']])
doc('grc_access_policy.docx', 'Access Policy', ['Purpose. This policy sets rules for access to finance systems.', 'Access requests must be approved by the system owner.', 'Accounts are reviewed when needed.', 'Terminated users should lose access.'])
xlsx('grc_test_results.xlsx', 'Testing', [['Control ID', 'Result', 'Deficiency type', 'Note'], ['C-01', 'Pass', '', ''], ['C-02', 'Fail', 'Design', 'No owner named'], ['C-03', 'Fail', 'Operating', 'Two months late'], ['C-04', 'Fail', 'Design', 'No frequency'], ['C-05', 'Pass', '', '']])
doc('grc_walkthrough.docx', 'Walkthrough: Vendor payments', ['The AP clerk enters the invoice and matches it to the purchase order.', 'The AP supervisor approves any invoice above the approval limit in the payment system.', 'Treasury releases the payment run each Thursday.'])
pdf('sus_utility_invoices.pdf', [['Example Power Co - Invoice', 'Account: 000-111', 'Service address: 100 Sample Street', 'Service period: 9/1/2018 - 9/30/2018', 'Usage: 12,400 kWh', 'Amount due: USD 1,488.00'], ['Example Gas Co - Invoice', 'Account: 000-222', 'Service address: 100 Sample Street', 'Transaction date: 9/18/2018', 'Usage: 310 therms', 'Amount due: USD 372.50'], ['Example Power Co - Invoice', 'Account: 000-333', 'Service address: 200 Sample Avenue', 'Service period: 9/1/2018 - 9/30/2018', 'Usage: 8,050 kWh', 'Amount due: USD 966.00']])
xlsx('sus_ghg_inventory.xlsx', 'Scope 3', [['Category', 'FY2024', 'FY2025'], ['Purchased goods', 5200, 5350], ['Business travel', 310, 295], ['Employee commuting', 410, 4100], ['Waste', 90, 88]])
with open(os.path.join(OUT, 'sus_supplier_data.csv'), 'w', newline='') as f:
    f.write('Supplier,Country,Emissions tCO2e\nExample Supplier A,US,120\nExample Supplier B,DE,\nExample Supplier C,PL,45\nExample Supplier D,US,\nExample Supplier E,MX,300\n')
doc('sus_climate_policy.docx', 'Climate Policy', ['Example Co will measure and report its Scope 1, 2 and 3 emissions each year.', 'The company has set a target to cut Scope 1 and 2 emissions by 42 percent by 2030 from a 2022 base.', 'The board reviews climate risks once a year.'])
pdf('sus_water_bills.pdf', [['Example Water Co - Bill', 'Service address: 100 Sample Street', 'Bill date: 3/12/2019', 'Usage: 42 kgal', 'Amount due: USD 310.00'], ['Example Water Co - Bill', 'Service address: 200 Sample Avenue', 'Bill date: 3/12/2019', 'Usage: 17 kgal', 'Amount due: USD 128.40']])
print('wrote', len(os.listdir(OUT)), 'files')
```

- [ ] **Step 5: LEAD: generate; then check**

LEAD: `python3 C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/make_live_fixtures.py`
Expected: `wrote 14 files`.

Run: `ls C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/fixtures | wc -l`
Expected: `14`.

Run: `jq 'length' C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.json`
Expected: `13`.

Run: `jq -r '.[].files[]' C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.json | sort -u | wc -l`
Expected: `14` (every fixture is used; Task 10's generator throws if a case names a file that is missing).

Run (identity scan; expected count 0 per file): `grep -cEi "gmail|@[a-z0-9-]+\.[a-z]{2,}|\b[0-9]{3}-[0-9]{3}-[0-9]{4}\b" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/make_live_fixtures.py C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.json`
Expected: both files `:0`. (The word "workiva" is not scanned for here: nothing in these two files should contain it, and the cases.md header in Task 10 names the sandbox. The checker also reads the generator once for any real-looking name; all names are "Example ..." and "Sample ...", and the file author metadata is set to "synthetic".)

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/research/live-tests && git commit -m "Prompt coach rewrites: 14 synthetic live-test files and 13 cases"
```

```role-checks
ls C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/fixtures | wc -l
jq 'length' C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.json
jq -r '.[].files[]' C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.json | sort -u | wc -l
grep -cEi "gmail|@[a-z0-9-]+\.[a-z]{2,}|\b[0-9]{3}-[0-9]{3}-[0-9]{4}\b" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/make_live_fixtures.py C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.json
```

(No README change: the folder is described by Task 10.)

---

### Task 10: `cases.md` (original, 73be350 Strong, new Strong)

**Files:**
- Create: `prompt-coach/research/live-tests/make_cases.js`
- Create (generated, LEAD): `prompt-coach/research/live-tests/cases.md`
- Modify: `prompt-coach/README.md` (one bullet pointing to the folder)

**Interfaces:**
- Consumes: `cases.json` (Task 9), the current engine, and the 73be350 engine read with `git show`.
- Produces: `cases.md`: for each case id, area, files, grade now, then fenced blocks: Original, Strong at 73be350, Strong now, Better now. A case whose original already grades strong has a one-line marker instead of a Strong-now block (the page shows a strong prompt as is).

- [ ] **Step 1: Red check**

Run: `grep -c "^### " C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.md`
Expected: fails (no such file).

- [ ] **Step 2: Write the generator**

Create `prompt-coach/research/live-tests/make_cases.js`:

```js
/* node research/live-tests/make_cases.js  -> research/live-tests/cases.md
   Strong at 73be350 is produced by that commit's own engine files (read with git, written to a temp folder that is removed after loading). */
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const PC = path.join(__dirname, '../..');
function load(dir) {
  const M = require(path.join(dir, 'engine/model.js')), W = require(path.join(dir, 'engine/rewrite.js')), C = require(path.join(dir, 'engine/classify.js'));
  const weights = JSON.parse(fs.readFileSync(path.join(dir, 'engine/weights.json'))), CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(dir, 'engine/cls-weights.json'))));
  const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
  return (prompt, files) => W.coach(prompt, { files, detect, ...C.pick(prompt, CLS) });
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pc73be350-')), old = path.join(tmp, 'x'); fs.mkdirSync(path.join(old, 'engine'), { recursive: true });
for (const f of ['rules.js', 'model.js', 'rewrite.js', 'classify.js', 'weights.json', 'cls-weights.json'])
  fs.writeFileSync(path.join(old, 'engine', f), cp.execFileSync('git', ['show', '73be350:prompt-coach/engine/' + f], { cwd: PC, maxBuffer: 1 << 26 }));
const oldCoach = load(old), newCoach = load(PC);
fs.rmSync(tmp, { recursive: true, force: true });
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8'));
for (const c of cases) for (const n of c.files) if (!fs.existsSync(path.join(__dirname, 'fixtures', n))) throw new Error(c.id + ': fixture missing: ' + n);
const fileObj = (n) => ({ name: n, kind: /\.xlsx$/.test(n) ? 'Excel' : /\.pdf$/.test(n) ? 'PDF' : /\.docx$/.test(n) ? 'Word' : 'CSV', sheets: [], periods: [], text: '' });
let md = '# Live-test cases (2026-10-16)\n\nEach case: the user\'s original prompt, the Strong rewrite at 73be350, and the Strong and Better rewrites now. Run the three prompts (original, 73be350 Strong, new Strong) in fresh chats with the same file in the Workiva AI sandbox. Synthetic files are in `fixtures/`. Generated by `make_cases.js`; do not edit by hand.\n\n';
for (const c of cases) {
  const fl = c.files.map(fileObj), a = oldCoach(c.prompt, fl), b = newCoach(c.prompt, fl);
  md += '### ' + c.id + ' (' + c.area + ')\n\nFiles: ' + c.files.join(', ') + '\n\nGrade now: ' + b.grade + '\n\nOriginal:\n```\n' + c.prompt + '\n```\nStrong at 73be350 (grade ' + a.grade + '):\n```\n' + a.stages.strong.prompt + '\n```\n';
  md += b.grade === 'strong' ? 'Strong now: (original grades strong; the page shows it as is)\n\n' : 'Strong now:\n```\n' + b.stages.strong.prompt + '\n```\nBetter now:\n```\n' + b.stages.better.prompt + '\n```\n\n';
}
fs.writeFileSync(path.join(__dirname, 'cases.md'), md);
console.log('wrote', cases.length, 'cases');
```

- [ ] **Step 3: LEAD: generate**

LEAD: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/make_cases.js`
Expected: `wrote 13 cases`.

- [ ] **Step 4: Check the output**

Run: `grep -c "^### " C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.md`
Expected: `13`.

Run: `grep -cEi "gmail|@[a-z0-9-]+\.[a-z]{2,}|\b[0-9]{3}-[0-9]{3}-[0-9]{4}\b" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.md`
Expected: `0`. ("workiva" is deliberately not scanned: the header says "Workiva AI sandbox".)

Run (no filler in any rewritten Strong; cases that grade strong have no block and are skipped): `grep -A2 "^Strong now:" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.md | grep -Eic "please|kindly|can you|could you|would you|pls|thanks"`
Expected: `0`. A non-zero count means the engine still leaves filler on a realistic case: report it; do not edit the cases to hide it.

- [ ] **Step 5: README and commit**

Add to the README "Rewrite wording rules" section: `- Live test: synthetic files and 13 cases (original, 73be350 Strong, new Strong) are in research/live-tests/ (cases.md is generated by make_cases.js). The live run itself is a separate session with Ian.`

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/research/live-tests prompt-coach/README.md && git commit -m "Prompt coach rewrites: cases.md with original, 73be350 Strong and new Strong"
```

```role-checks
grep -c "^### " C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.md
grep -cEi "gmail|@[a-z0-9-]+\.[a-z]{2,}|\b[0-9]{3}-[0-9]{3}-[0-9]{4}\b" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.md
grep -A2 "^Strong now:" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/research/live-tests/cases.md | grep -Eic "please|kindly|can you|could you|would you|pls|thanks"
```

---

### Task 11: Must stay green, results, rebuilt page

**Files:**
- Modify: `prompt-coach/dist/prompt-coach.html` (only by running the build)
- Modify: `prompt-coach/README.md` (re-measured figures, only where a number it states changed)
- Modify: `docs/superpowers/specs/2026-10-16-prompt-coach-rewrites-design.md` (add a Result column to the success-criteria table; do not change the approved text elsewhere)

**Interfaces:**
- Consumes: everything above.
- Produces: the measured values for the spec's success table (used by Task 12).

- [ ] **Step 1: Full suite (every line its own command)**

Run: `node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"`
Expected: `# pass 14`, `# fail 0`.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/eval.js rulefeat C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep "GRADE acc"`
Expected: `acc=0.856` or higher (parent measured 0.856).

Run (train only, for the README sentence): `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl | grep -E "^(runs|strongNotStrong|betterWeak|toggleNoEffect|dupSentence|badText|emptyFrag)"`
Expected: record `runs=` and the strongNotStrong percentage (README states 2,070 runs and 99.8% re-grade for train-only; update that sentence only if they differ).

Run (train plus test, the spec's gate): `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(runs|strongNotStrong|betterWeak|toggleNoEffect|dupSentence|badText|emptyFrag)"`
Expected: `runs=2679` (measured on the parent), `strongNotStrong` 8 or lower, `betterWeak` 5 or lower, `toggleNoEffect 0`, `emptyFrag 0`, `dupSentence` and `badText` not higher than at the start of the run.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^FAIL|^PASS|^info"`
Expected: `PASS 229 runs` and the `info:` line.

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^FAIL|^PASS|^info"`
Expected (IAN YES 2026-10-17 (A) default): `PASS 609 runs`. Fallback bar: `FAIL` with `notStrong` at most 4/609 and every other category 0.

- [ ] **Step 2: LEAD: re-run the probes (before/after for the success table)**

LEAD (needs the `OUT` environment variable; the probe throws if it is unset): run `filler_probe.js` with `OUT` set to `.ledger/2026-10-16-prompt-coach-rewrites/logs/filler_after.json`, arguments `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach` then the two data files `.../prompt-coach/data/sim_customers.jsonl` and `.../prompt-coach/data/test.jsonl`, piping through `cut -c1-400`.
Expected: for both files `betterAnyFiller 0` and `strongAnyFiller 0` (spec: 66 Strong before, 0 predicted); `medBlanks` 2 or lower; the `strong` object's `question` counts summed over both files at most 40 (before 89; the prediction is assumed).

Run: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/.ledger/2026-10-16-prompt-coach-rewrites/blank_probe.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/sim_customers.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | cut -c1-300`
Expected: `>=3 blanks` counts not higher than the spec baseline (sim 57, test 150) and no letter above its baseline (S/C/O/P/E sim 83/148/29/87/16, test 167/340/130/237/25).

- [ ] **Step 3: LEAD: real-file test and build**

LEAD (needs the `VENDOR` environment variable, a folder with `node_modules/` holding mammoth, xlsx, jszip, pdfjs-dist; if none exists, STOP, no installing): run `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/filetest.js` with `VENDOR=<folder the lead supplies>`, piping through `grep -E "→|errors:"` (the 8 fixture rows print before the summary, so do not use `tail`).
Expected: all 8 fixtures read correctly (README: last run all 8), exit 0.

LEAD: `node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/build.js | tail -2`
Expected: a line naming `dist/prompt-coach.html` with its size (README: about 300 KB).

Run: `grep -c "directVoice" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/dist/prompt-coach.html`
Expected: a number of 1 or more (0 means the page was not rebuilt).

Lead only (not an executor step): open `prompt-coach/dist/prompt-coach.html` in a browser on desktop and phone width: no console errors, no sideways scroll, Ian's invoice case (`tests/fixtures/rewrites/ian_case.txt`) shows the approved Strong and Better. Do not republish the artifact.

- [ ] **Step 4: Fill the spec's success table (add a Result column) and the README figures**

In the spec, in the "Success criteria and predictions" table, add a fifth column `Result (measured <date>)` to the header and each row, and fill it from steps 1 and 2: filler count (both sets, Better and Strong), Strong containing "?", Strong blanks median, "only-Context-missing prompts with exactly 1 blank: k of N" (from the `info:` line and `blankOnlyC 0`), grade accuracy. Where a "Disproved if" condition holds, say so in that cell. Write numbers and words, no placeholder text; use "at most" instead of the `<=` symbol in new cells. Do not edit the spec text elsewhere.

In the README update only figures that changed: the "Rewrite simulation over N runs ... 99.8%" sentence (from the train-only run) and add under "Rewrite wording rules" one line with the before/after numbers (filler 66 to the measured value, "?" 89 to the measured value).

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add prompt-coach/dist/prompt-coach.html prompt-coach/README.md docs/superpowers/specs/2026-10-16-prompt-coach-rewrites-design.md && git commit -m "Prompt coach rewrites: must-stay-green run, results, rebuilt page"
```

```role-checks
node --test --test-reporter=tap C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/rewrite_unit.test.js | grep -E "^# (pass|fail)"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/eval.js rulefeat C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep "GRADE acc"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl | grep -E "^(runs|strongNotStrong|betterWeak|toggleNoEffect|dupSentence|badText|emptyFrag)"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/simulate.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_fr.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_grc.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_hard.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/train_sus.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^(runs|strongNotStrong|betterWeak|toggleNoEffect|dupSentence|badText|emptyFrag)"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js | grep -E "^FAIL|^PASS|^info"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/tests/customer_check.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | grep -E "^FAIL|^PASS|^info"
node C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/.ledger/2026-10-16-prompt-coach-rewrites/blank_probe.js C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/sim_customers.jsonl C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/data/test.jsonl | cut -c1-300
grep -c "directVoice" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/prompt-coach/dist/prompt-coach.html
```

---

### Task 12: Evidence doc

**Files:**
- Create: `docs/evidence/2026-10-16-prompt-coach-rewrites.md`

- [ ] **Step 1: Red check**

Run: `ls C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/docs/evidence/2026-10-16-prompt-coach-rewrites.md`
Expected: fails ("No such file").

- [ ] **Step 2: Write the doc**

Create the file with these sections (real numbers from Task 11, each tagged `measured` with the command that produced it, or `read` with its source; no placeholder text; write "at most" and "at least" instead of comparison symbols):
1. What changed: one line per spec rule 1 to 7, plus the Better-stage change for Better-graded prompts, the declared `tidy()` change (it also feeds `subjectLost`, plus the typo mirror), the mid-sentence "can/could you" extension, and Ian's decisions (A) and (B) with what he said.
2. Success table (before, predicted, result, disproved or not), copied from the spec's Result column.
3. Must-stay-green table: eval accuracy, simulate counts (train-only and train plus test), customer_check default and `data/test.jsonl` (state that the parent already failed `notStrong 4/609`, measured), filetest, built page (who checked it, or "not yet checked").
4. Ian's case: approved target against the engine output, with and without the PDF (the `ianCase` line).
5. Not tested or open: live test not run (next session); Workiva @-file limits unconfirmed; artifact not republished; Codex review not available (shell blocked), so `final-reviewer` alone; the published artifact is probably an older build.
6. Measured vs read: every figure with its label.

- [ ] **Step 3: Check**

Run: `grep -c "<" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/docs/evidence/2026-10-16-prompt-coach-rewrites.md`
Expected: `0` (no leftover placeholders or comparison symbols; rephrase any legitimate `<`).

Run: `grep -cE "measured|read" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/docs/evidence/2026-10-16-prompt-coach-rewrites.md`
Expected: 10 or more.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add docs/evidence/2026-10-16-prompt-coach-rewrites.md && git commit -m "Prompt coach rewrites: evidence doc with measured and read figures"
```

```role-checks
grep -c "<" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/docs/evidence/2026-10-16-prompt-coach-rewrites.md
grep -cE "measured|read" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/docs/evidence/2026-10-16-prompt-coach-rewrites.md
```

---

### Task 13: Live-test session prompt (draft, not launched)

**Files:**
- Create: `docs/PROMPT_COACH_LIVE_TEST_RUN_PROMPT.txt`

- [ ] **Step 1: Red check**

Run: `ls C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/docs/PROMPT_COACH_LIVE_TEST_RUN_PROMPT.txt`
Expected: fails ("No such file").

- [ ] **Step 2: Write the prompt**

Same shape as `docs/PROMPT_COACH_REWRITES_RUN_PROMPT.txt` (lines starting `WHERE`, `ORDER`, `PERMISSIONS`, `SAFETY`). Content from the spec's "Next session" section:
- WHERE: worktree path, branch, pointers to `prompt-coach/research/live-tests/cases.md`, `cases.json`, `fixtures/`, the spec, the evidence doc.
- ORDER: Ian present and logs in to the Workiva AI sandbox; for each case, three fresh chats with the same file (original, 73be350 Strong, new Strong); 13 cases minimum, more as time allows (Ian: "as many simulations as possible"); score each answer 0/1 on right source, did the one job, usable format, invented facts (1 = none), and record "asked for clarification" without scoring it; Ian spot-checks and his call breaks ties; open Workiva's support articles in the browser and confirm the @-file limits (the 403 fetch gap); write dated results to `prompt-coach/research/live-tests/results-<date>.md`; update the README tip bullet with the confirmed limits in the same commit.
- PERMISSIONS: sandbox only, synthetic files only; no settings, sharing, deleting or publishing; no push or merge unless Ian's slip says so; spend $0 unless Ian approves; no new sessions.
- SAFETY: no customer data; do not republish the artifact; stop for Ian at login and at any decision only he can make.

End with the line: `Draft only. Do not launch; Ian starts this session himself.`

- [ ] **Step 3: Check**

Run: `grep -cE "^(WHERE|ORDER|PERMISSIONS|SAFETY)" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/docs/PROMPT_COACH_LIVE_TEST_RUN_PROMPT.txt`
Expected: `4`.

Run: `grep -c "Do not launch" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/docs/PROMPT_COACH_LIVE_TEST_RUN_PROMPT.txt`
Expected: `1`.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" && git add docs/PROMPT_COACH_LIVE_TEST_RUN_PROMPT.txt && git commit -m "Prompt coach rewrites: live-test session prompt (draft, not launched)"
```

```role-checks
grep -cE "^(WHERE|ORDER|PERMISSIONS|SAFETY)" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/docs/PROMPT_COACH_LIVE_TEST_RUN_PROMPT.txt
grep -c "Do not launch" C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites/docs/PROMPT_COACH_LIVE_TEST_RUN_PROMPT.txt
```

---

## Expected breaks

- customer_check: askLost | fixed by Task 5
- customer_check: subjectLost | fixed by Task 5

(Both compare the user's sentence with the rewrite; once the rewrite drops "Can you please" and the like they fail for the wrong reason until the declared `tidy()` change in Task 5 step 5. The new categories `filler`, `order`, `ianCase`, `blankOnlyC` are red on purpose from Task 2 and go green in Tasks 4, 5 and 7; they are new tests, not broken ones. `customer_check` on `data/test.jsonl` was already failing on the parent (`notStrong 4/609`); Task 7 fixes it under IAN YES 2026-10-17 (A).)

## Estimates (helper tokens; paid calls: none)

Basis (measured by the lead): 382,703 helper tokens over 67 tool calls so far (talk helper 26,986/6, plan writer 153,894/23, Opus reviewer 202,160/38), about 5.7k per call. Per task: implementer calls plus checker calls, times 5.7k.

| Task | Implementer + checker calls | Estimate |
|---|---|---|
| 1 Fixtures and baseline | 8 + 4 | 68k |
| 2 Failing checks | 12 + 5 | 97k |
| 3 Splitting | 12 + 5 | 97k |
| 4 Order | 16 + 6 | 125k |
| 5 Direct voice | 20 + 7 | 154k |
| 6 Typos | 8 + 4 | 68k |
| 7 Context and blank rule | 20 + 7 | 154k |
| 8 Tip | 7 + 3 | 57k |
| 9 Live-test files and cases | 14 + 5 | 108k |
| 10 cases.md | 10 + 4 | 80k |
| 11 Must stay green | 14 + 5 | 108k |
| 12 Evidence doc | 7 + 3 | 57k |
| 13 Live-test prompt | 5 + 3 | 46k |
| Tasks subtotal | | 1,219k |
| Plan re-review after this revision | | 200k |
| Final review (`final-reviewer` alone) | | 200k |
| Fix round | | 150k |
| **Run total** | | **about 1.77M** |

Cheaper variant (IAN 2026-10-17 (B): cap raised to 1.8M, full plan kept, cheaper variant not taken): fold Task 6 into Task 5 (about 43k saved), fold Task 8 into Task 7 (about 37k saved), and make Tasks 12 and 13 lead-side (about 103k of helper tokens saved; the lead still spends its own): **about 1.59M**. Both exceed the 600k cap in `budget.json` (and `tasksLeft: 12` there is stale; the plan has 13 tasks, 11 in the cheaper variant). With 382,703 already spent, Ian must raise the cap (about 1.5M to 2M) or accept cutting scope.

## Review dispositions

Source: `.ledger/2026-10-16-prompt-coach-rewrites/reviews/plan-review.md` (7 must-fix, 15 should-fix, 8 notes). Applied 22, rejected 0 of must-fix and should-fix; notes 4, 5, 6 applied.

Must-fix
1. Applied: only-Context rule in Task 7 step 5 (IAN YES 2026-10-17 (A)), bar PASS on test.jsonl with a stated fallback; the Suite is now one command per line.
2. Applied: `blankMore` uses `max(baseline, 1)` for only-Context runs (Task 2 step 1d); flagged for Ian as (A).
3. Applied: probe controls added (`We need this for [...]`, the DEST wording), probe saved as `ctx_probe.js`; the widened cue is the one whose control registers alone (expected `audience-is`), never assumed `purpose`.
4. Applied: every `node --test` line uses `--test-reporter=tap` and drops `2>&1`.
5. Applied: Estimates re-forecast from measured actuals; cap and cheaper variant raised as (B); `tasksLeft` mismatch noted.
6. Applied: (a) no `cd` in checks, absolute paths, role-checks blocks per task; (b) filler probe marked LEAD with the ledger log path; (c) `VENDOR=` step marked LEAD; (d) the `while read` loop replaced by `ls`/`jq` counts and `make_cases.js` throws on a missing fixture, and `||` removed; (e) awk replaced by `grep -A2`; (f) long `node -e` saved as `ctx_probe.js`.
7. Applied: "workiva" dropped from the identity scans.

Should-fix
1. Applied: Task 7 test asserts missing letters equal `C`, with the base probed ("...into a table. Do not guess.").
2. Applied: the summarize case accepts the DEST wording or the one-blank fallback.
3. Applied: with only Context missing, `genUsed` is exactly `{C}`; Task 2 step 3 records the `blankOnlyC` examples.
4. Applied: `order` now compares cleaned sentence text positions, not `src`.
5. Applied: Task 4 test 3 asserts the segment after Context is sentence 1.
6. Applied: Better fallback is the cleaned user text (`assemble`), not the raw prompt.
7. Applied: mid-sentence "can/could you" rule, tests, and declared extension of spec rule 3.
8. Applied: `if you can` filler regex uses `(?!['’]t| not)` in the check and the engine; test added.
9. Applied: `(?!\s+mind\b)` on the "would you" rule; test added.
10. Applied: `tidy()` change listed as a declared deviation for Ian's yes ("Decisions for Ian").
11. Applied: Task 3 step 4 adds `blankMore` and simulate.
12. Applied: README figure comes from a train-only simulate run; train plus test is the gate.
13. Applied: filetest filtered with `grep -E "→|errors:"`.
14. Applied: suppliers renamed Example Supplier A to E; file author metadata set to "synthetic".
15. Applied: strong-graded cases get a marker line instead of a Strong-now block, so the filler count skips them.

Notes applied: 4 (`if (objAt < 0)` so the Objective takes the first replaced sentence's place), 5 (temp engine copy removed after loading; the plan file is committed with Task 1), 6 ("at most" instead of `<=` in the docs and results).

## Self-review notes

- Spec coverage: splitting (T3), order (T4), direct voice (T5), typos (T6), Context wording, one-blank rule and the Context cue allowance (T7), tip (T8); checks (T2 plus unit tests), declared `askLost` change (T5), Ian's case golden (T1, T2, T7); must-stay-green and the success table with a Result column (T11); evidence doc (T12); live-test fixtures, `cases.md`, session prompt (T9, T10, T13); README in each code task.
- Names used across tasks: `sentenceSpans`, `directVoice`, `fixTypos`, `src`, `idx`, `objAt`, `onlyC`, `blank_baseline.json` keys `<file>|<row>|<0/1>`, info line `info: only-Context-missing runs ...`.
