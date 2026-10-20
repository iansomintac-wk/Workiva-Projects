# Prompt coach: weak-prompt reason line quotes the user's ask - Implementation Plan (rev 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: the five lines in `.ledger/2026-10-20-prompt-coach-reason-line/role-checks.txt` (unit, simulate, customer_check, eval rulefeat, pagetest), one per call, exactly as written there; pagetest runs after `node tests/build.js`
Data: (none)
helperToolCallCap: 30
Tasks: 5 (sequential, no parallel group, no tune task)
Paid calls: none (local node runs and a local headless Chrome; no model or API calls)

**Goal:** For a prompt that grades weak, when the detector is sure the ask is missing, the visible headline on "Your prompt" (and `stages.weak.verdict`) quotes the user's own ask words.

**Architecture:** `engine/rewrite.js` gets a pure `askQuote(prompt)` (the spec's span rule). `coach()` reads the ask probability from the `detect()` return (`{on, prob, d}`), and when a span is found appends the quote sentence to the weak `headline` and replaces the "A verb like" sentence in `stages.weak.verdict`. The page `detect` starts returning `prob`. A caller that returns no `prob` (simulate.js, customer_check.js, make_blank_baseline.js, the unit-test `detect`) gets today's headline and verdict byte for byte, which keeps those suite lines unchanged.

**Tech Stack:** plain Node (CommonJS, `node --test`), one inlined HTML build (`tests/build.js`), headless Chrome over CDP (as `tests/pagetest.js` does; already installed, nothing to install).

**Spec:** `docs/superpowers/specs/2026-10-20-prompt-coach-quote-line-design.md` (amended in Task 3 with the 06:04Z ruling).

## Why the headline (seam found after the spec)

The lead measured in real headless Chrome on dist at parent 5cfff0c: `stages.weak.verdict` is visible on no tab. For a weak prompt the page shows `r.headline` on "Your prompt" (`web/template.html` ~340-341: `r.offtopic ? ... : g !== r.grade ? <stacked text> : r.headline`); the stage tabs sit above the grade. Ruling (PM proxy for Ian, 2026-10-20T06:04Z, verbatim in `.ledger/2026-10-20-prompt-coach-reason-line/rulings.md`): "A. Quote in the visible headline on Your prompt, stages.weak.verdict changed to agree, same span rule and no-gos, drop test reads the headline." Proxy decided; Ian may overturn. The page's off-topic and stacked headline overrides stay as they are.

## Global Constraints

- Quote only the ask (O). Never the source. Wording says what the coach read ("The coach read your ask as"), never "Your ask is".
- Span rule exact (spec "The span rule"): ask probability missing or >= 0.2 -> no quote; first `VAGUE_VERB` match that opens a sentence (start, or after `. ! ?`, a line break or `:`, with only the spec's lead words between: hey, hi, ok, so, just, quick(ly), please, pls, plz, can/could you/u, would you, I need (you) to, I want (you) to, need (you) to, want (you) to, I'd like (you) to; NOT "okay"); skip a match followed directly by `:`; span runs to the first `. ; ? !` or line break; trim trailing spaces, commas, colons, dashes; over 8 words -> first 8 then `...`; no match -> no quote.
- With a span: `headline` = today's weak headline (either weak branch, unchanged text) + ` The coach read your ask as "<span>": that says what to look at, not what a finished answer looks like.` and `stages.weak.verdict` = `The AI has to guess <core>. The coach read your ask as "<span>": that says what to look at, not what a finished answer looks like. It is also missing <rest>.` No span: headline and verdict byte for byte today's. Better, Strong and the example Weak stage for a better/strong prompt unchanged. The stacked note stays the only place that says "several asks".
- Never change which letters the line names. No detector or classifier retraining.
- Locked (never touch): `heldout/`, any sealed file, `data/test.jsonl` (read only through `tests/eval.js`), `engine/*.json` (no writes), the original probe `research/2026-10-20-quote-line-probe.{js,md,tsv}`.
- Drop rule, stated before measuring (spec criterion 2, now read on the headline): if more than 10% of the quoted headlines quote the wrong words (by label or by eye) in the out-of-fold shipped-line check, revert and park. Prediction: about 51 quoted, 0 wrong by label, at most 2 wrong by eye.

## Must-stay-green values (lead measured on parent 5cfff0c; read here, re-run in Task 1 step 2)

| Line | Value on parent (also the final value if the change is dropped) | Final value if kept |
|---|---|---|
| unit | 57 pass 0 fail | 63 pass 0 fail (57 + 6 new, Task 1) |
| simulate | runs=2070 strongNotStrong 2 betterWeak 5 toggleNoEffect 0 dupSentence 0 badText 2 emptyFrag 0 | identical |
| customer_check | PASS 229 runs | identical |
| eval rulefeat | GRADE acc=0.856 flips=8 | identical |
| pagetest | 12 checks, 0 failed (lead measured) | 15 checks, 0 failed (3 added in Task 3) |

Measured by the plan writer: `dist/prompt-coach.html` is 336173 bytes on the parent while README line 9 says 334435 (already stale by 1738). Read only: the spec's probe counts (55 / 0 / 4 / 51 predicted).

## File Structure

- Modify `prompt-coach/engine/rewrite.js` (`askQuote`, `verdictFor`, `coach()` headline and stage); `prompt-coach/web/template.html:287-290`; `prompt-coach/tests/rewrite_unit.test.js` (6 tests); `prompt-coach/tests/pagetest.js` (3 checks); rebuilt `prompt-coach/dist/prompt-coach.html`; `prompt-coach/README.md` (line 9, "Still open" 157-164); the spec file (rulings).
- Create (Task 4) `prompt-coach/research/2026-10-20-quote-line-{dump,dump-compare,shipped-check}.js`, `...-shipped-check.tsv`; (Task 5) `prompt-coach/research/2026-10-20-quote-line-capture.js`, `docs/evidence/2026-10-20-prompt-coach-quote-line/*.png`; `docs/evidence/2026-10-20-prompt-coach-quote-line.md`.

All commands run from `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-analyze-format/prompt-coach` (`$PC`).

---

### Task 1: Failing unit tests (spec criterion 1, on weak.verdict and headline)

**Files:** Modify `prompt-coach/tests/rewrite_unit.test.js` (append after the last test).

**Interfaces:** Consumes `W.coach(prompt,{files,detect,...C.pick(prompt,CLS)})` -> `{grade, headline, stages}`; `M.predict` returns `{on, prob, rules}`. Produces helpers `detectP`, `withO(x)` (forces `prob.O`), `coachWith(prompt, det)`, constants `QUOTED`, `HELP` (used only inside this file).

- [ ] **Step 1: Append the tests**

```js
// ---- quote line (spec 2026-10-20-prompt-coach-quote-line-design.md): headline AND stages.weak.verdict ----
const detectP = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, prob: r.prob, d: r.rules }; };
const withO = (x) => (p) => { const r = detectP(p); return { ...r, prob: { ...r.prob, O: x } }; };
const coachWith = (prompt, det) => W.coach(prompt, { files: [], detect: det, ...C.pick(prompt, CLS) });
const QUOTED = /The coach read your ask as "/;
const HELP = 'help with the 10-K';
const SAYS = ': that says what to look at, not what a finished answer looks like.';
const quotedBoth = (o) => QUOTED.test(o.headline) && QUOTED.test(o.stages.weak.verdict);
const quotedNone = (o) => !QUOTED.test(o.headline) && !QUOTED.test(o.stages.weak.verdict);

test('quote line: "help with the 10-K" quotes the ask in headline and verdict; no probability means today\'s text', () => {
  const o = coachWith(HELP, detectP), old = coachWith(HELP, detect);
  assert.equal(o.stages.weak.verdict, 'The AI has to guess what to read and the one thing you want back. The coach read your ask as "help with the 10-K"' + SAYS + ' It is also missing who it is for, a format or scope and a rule about invented facts.');
  assert.equal(o.headline, old.headline + ' The coach read your ask as "help with the 10-K"' + SAYS);
  assert.ok(quotedNone(old), 'detect without prob must give today\'s headline and verdict');
});

test('quote line: a field label "Evaluate:" is never quoted', () => {
  assert.ok(quotedBoth(coachWith(HELP, withO(0))), 'contrast: the same detector quotes a real ask');
  const p = 'Evaluate: carefully', o = coachWith(p, withO(0));
  assert.equal(o.grade, 'weak');
  assert.ok(quotedNone(o), o.headline + ' | ' + o.stages.weak.verdict);
});

test('quote line: ask probability 0.2 gives no quote, 0.19 does', () => {
  assert.ok(quotedBoth(coachWith(HELP, withO(0.19))));
  const o = coachWith(HELP, withO(0.2));
  assert.ok(quotedNone(o), o.headline);
  assert.ok(o.stages.weak.verdict.includes('A verb like "help with" does not say what a finished answer looks like.'), o.stages.weak.verdict);
});

test('quote line: no sentence-opening vague verb gives today\'s headline and verdict byte for byte', () => {
  assert.ok(quotedBoth(coachWith(HELP, withO(0))), 'contrast: a sentence-opening verb is quoted');
  // the verb sits mid-sentence after a comma; if this prompt stops grading weak, use another with the verb mid-sentence
  const p = 'the 10-K needs a quick look, can you help', a = coachWith(p, withO(0)), b = coachWith(p, detect);
  assert.equal(a.grade, 'weak');
  assert.equal(a.headline, b.headline);
  assert.equal(a.stages.weak.verdict, b.stages.weak.verdict);
});

test('quote line: a prompt that grades better is unchanged', () => {
  assert.ok(quotedBoth(coachWith(HELP, withO(0))), 'contrast: a weak prompt is quoted');
  const p = 'Summarize the attached Q3 flux report for the CFO', a = coachWith(p, withO(0)), b = coachWith(p, detect);
  assert.notEqual(a.grade, 'weak');
  assert.equal(a.headline, b.headline);
  assert.deepEqual(a.stages, b.stages);
});

test('quote line: a long ask is cut to its first 8 words plus "..."', () => {
  const p = 'Review the 10-K and the proxy and the exhibits and the notes for me today.', o = coachWith(p, withO(0));
  assert.ok(o.headline.includes('The coach read your ask as "Review the 10-K and the proxy and the..."'), o.headline);
  assert.ok(o.stages.weak.verdict.includes('"Review the 10-K and the proxy and the..."'), o.stages.weak.verdict);
});
```

- [ ] **Step 2: Run on the parent (red)**

Run: `cd $PC && node --test --test-reporter=tap tests/rewrite_unit.test.js 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# pass 57` and `# fail 6`. If the failing assert in the Evaluate or mid-sentence test is the `grade === 'weak'` one (not the quote), swap the prompt for another of the same shape until the failure is the quote assert.

- [ ] **Step 3: Confirm all 6 fail**

Run: `cd $PC && node --test --test-reporter=tap tests/rewrite_unit.test.js 2>&1 | grep -E "^not ok.*quote line" | wc -l`
Expected: `6`

- [ ] **Step 4: Do not commit** (Tasks 1-3 land in one commit).

---

### Task 2: Span rule, quoted headline and verdict, probability plumbing

**Files:** Modify `prompt-coach/engine/rewrite.js` (`verdictFor` ~379-388; `askQuote` after the `VAGUE_ONLY` line ~405; `coach()` line 462, the `stages.weak` line ~582, the `return` at ~619; `api` at ~661); `prompt-coach/web/template.html:287-290`.

**Interfaces:** Consumes `detect(prompt)` possibly returning `prob`. Produces `askQuote(prompt) -> string|null` (exported), `verdictFor('weak', on, {vague, quote})`, and a `headline` that carries the quote sentence.

- [ ] **Step 1: Add after the `VAGUE_ONLY` const**

```js
  // Quote line: the user's own ask, only for a sentence-opening vague verb (spec 2026-10-20-prompt-coach-quote-line-design.md).
  const QUOTE_LEAD = /(?:^|[.!?\n]\s*|:\s*)(?:(?:hey|hi|ok|so|just|quick(?:ly)?|please|pls|plz|can (?:you|u)|could (?:you|u)|would you|i need (?:you )?to|i want (?:you )?to|need (?:you )?to|want (?:you )?to|i'?d like (?:you )?to)[\s,]+)*$/i;
  const QUOTE_SAYS = ': that says what to look at, not what a finished answer looks like.';
  function askQuote(prompt) {
    const re = new RegExp(VAGUE_VERB.source, 'gi'); let m;
    while ((m = re.exec(prompt))) {
      if (!QUOTE_LEAD.test(prompt.slice(0, m.index))) continue;
      if (prompt[m.index + m[0].length] === ':') continue; // a field label such as "Evaluate:"
      let s = prompt.slice(m.index).split(/[.;?!\n]/)[0].replace(/[\s,:-]+$/, '');
      const w = s.trim().split(/\s+/); if (w.length > 8) s = w.slice(0, 8).join(' ') + '...';
      return s || null;
    }
    return null;
  }
```

- [ ] **Step 2: In `verdictFor` replace line 384 with**

```js
      if (extra.quote) v += 'The coach read your ask as "' + extra.quote + '"' + QUOTE_SAYS + ' ';
      else if (extra.vague) v += 'A verb like "' + extra.vague + '" does not say what a finished answer looks like. ';
```

- [ ] **Step 3: In `coach()` make line 462 `const { on, d, prob } = detect(prompt);` and, just before `const stages = {`, add**

```js
    // quote the ask only for the user's own weak prompt, only when the detector says the ask is missing and is sure (p < 0.2); no probability = no quote
    const quote = grade === 'weak' && !on.O && prob && typeof prob.O === 'number' && prob.O < 0.2 ? askQuote(prompt) : null;
```

Add `quote` to the `stages.weak` extra object (`{ vague: <existing expression>, quote }`).

- [ ] **Step 4: Where `headline` is built (lines ~614-617), after the const add**

```js
    const headlineOut = quote ? headline + ' The coach read your ask as "' + quote + '"' + QUOTE_SAYS : headline;
```
and in the `return {...}` change `headline` to `headline: headlineOut`. Add `askQuote` to the `api` object. In `web/template.html` line 289 return `{ on: r.on, prob: r.prob, d: r.rules }`.

- [ ] **Step 5: Unit line.** Run: `cd $PC && node --test --test-reporter=tap tests/rewrite_unit.test.js 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# pass 63` and `# fail 0`.

- [ ] **Step 6: simulate, customer_check, eval lines** (one per call, as in role-checks.txt). Expected: `runs=2070 strongNotStrong 2 betterWeak 5 toggleNoEffect 0 dupSentence 0 badText 2 emptyFrag 0`; `PASS 229 runs`; `GRADE acc=0.856 flips=8`. Any difference: the prob-less path is not byte-identical; fix before Task 3.

No commit yet.

---

### Task 3: Page checks, rebuild, README, spec amendment, one commit

**Files:** Modify `prompt-coach/tests/pagetest.js` (before the `no console errors` check, line 68), `prompt-coach/dist/prompt-coach.html` (generated), `prompt-coach/README.md:9,157-164`, the spec's Rulings section.

**Interfaces:** Consumes Task 2. `pagetest.js`'s `type(v)` already returns `{headline, grade, tabs, ...}` (headline read from `#headline`). Produces the commit Task 4 may revert.

- [ ] **Step 1: Add three checks to `tests/pagetest.js`** (before `check('no console errors', ...)`):

```js
    r = await type('help with the 10-K');
    check('quote line: "help with the 10-K" headline quotes the ask', r.headline.includes('The coach read your ask as "help with the 10-K"'), r.headline.slice(0, 160));
    r = await type('Evaluate: carefully');
    check('quote line: "Evaluate:" label headline has no quote', !r.headline.includes('The coach read your ask'), r.headline.slice(0, 160));
    r = await type('the 10-K needs a quick look, can you help');
    check('quote line: no sentence-opening vague verb, headline has no quote', !r.headline.includes('The coach read your ask'), r.headline.slice(0, 160));
```
(Only the first fails on the parent; the exclusions pass on the parent too and are paired with that contrast.)

- [ ] **Step 2: Prove the first check fails on the parent dist.** Run on the unchanged parent dist (before rebuild): `cd $PC && node tests/pagetest.js 2>&1 | tail -4`
Expected: `FAIL quote line: "help with the 10-K" headline quotes the ask ...` and `pagetest: 15 checks, 1 failed`.

- [ ] **Step 3: Rebuild and run pagetest.** Run: `cd $PC && node tests/build.js && node tests/pagetest.js 2>&1 | tail -3`
Expected: `dist/prompt-coach.html ...KB` then `pagetest: 15 checks, 0 failed`. If Chrome is not at the default path set `CHROME`; if pagetest cannot run, record "not run" and the reason.

- [ ] **Step 4: README.** Line 9: replace `334435 bytes` with the output of `wc -c < dist/prompt-coach.html`. Rewrite "Still open" (lines 157-164): built 2026-10-20 for the ask only (PM proxy for Ian; Ian may overturn); the quote is in the visible headline on "Your prompt" and in `stages.weak.verdict`, only when the detector is sure the ask is missing (p < 0.2); the colon skip; source never quoted (12 of 17 wrong); the letters named are still the detector's; naming only the letters the detector is sure of is still open (Ian's morning list); the headline names only source and ask, so the earlier 147-of-430 probe measured a line users never see; the shipped out-of-fold count is in `docs/evidence/2026-10-20-prompt-coach-quote-line.md`. Do not invent numbers; the 55 / 0 / 4 counts are the probe's and are attributed so.

- [ ] **Step 5: Amend the spec** (`docs/superpowers/specs/2026-10-20-prompt-coach-quote-line-design.md`): in "Rulings" add the 06:04Z proxy ruling verbatim (quoted in "Why the headline" above); in "The line, by case" add that with a span the same quote sentence is appended to the weak headline (today's headline text + ` The coach read your ask as "<span>"...`), that the headline is what the page shows on "Your prompt", and that the drop check and criteria 1 and 3 read the headline as well as `stages.weak.verdict`; note the probe's lead list had "okay" and the shipped rule follows the spec's list.

- [ ] **Step 6: Re-run unit line and greps.** Run: `cd $PC && node --test --test-reporter=tap tests/rewrite_unit.test.js 2>&1 | grep -E "^# (pass|fail)"; grep -c "The coach read your ask as" dist/prompt-coach.html; grep -c "prob: r.prob" dist/prompt-coach.html`
Expected: `# pass 63`, `# fail 0`, `2` or more, at least `1`.

- [ ] **Step 7: Commit (engine, template, tests, pagetest, dist, README, spec together).**

```bash
cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-analyze-format
git add prompt-coach/engine/rewrite.js prompt-coach/web/template.html prompt-coach/tests/rewrite_unit.test.js prompt-coach/tests/pagetest.js prompt-coach/dist/prompt-coach.html prompt-coach/README.md docs/superpowers/specs/2026-10-20-prompt-coach-quote-line-design.md
git commit -m "Prompt coach: weak headline and verdict quote the user's ask (ask only, p<0.2, colon skip); dist rebuilt, README byte count corrected, spec amended" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012xqQ7n7ws4b6v6v7Z1VWxR"
```
Check: `git show --stat HEAD | grep -E "engine/.*json"` prints nothing.

---

### Task 4: Only-quoted-rows-change dump, out-of-fold drop check on the headline

**Files:** Create `prompt-coach/research/2026-10-20-quote-line-dump.js`, `...-dump-compare.js`, `...-shipped-check.js`, `...-shipped-check.tsv`. Reads `data/train_*.jsonl` only; temp output under `/tmp/qdump`.

**Interfaces:** Consumes the Task 3 commit and parent `5cfff0c` via `git archive`. Produces the numbers the evidence doc (Task 5) quotes, and the keep/drop decision Task 5 branches on.

- [ ] **Step 1: Dump script and compare script.**

`research/2026-10-20-quote-line-dump.js`:
```js
/* node research/2026-10-20-quote-line-dump.js <engineDir> > rows.jsonl
   Every train row: grade, headline and the three stage prompts and verdicts, shipped detector (with prob), engine from <engineDir>. Reads data/train_*.jsonl only. */
const fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2]), ROOT = path.join(__dirname, '..');
const M = require(dir + '/model.js'), W = require(dir + '/rewrite.js'), C = require(dir + '/classify.js');
const weights = JSON.parse(fs.readFileSync(dir + '/weights.json')), CLS = C.unpack(JSON.parse(fs.readFileSync(dir + '/cls-weights.json')));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, prob: r.prob, d: r.rules }; };
for (const d of ['fr', 'grc', 'sus', 'hard']) fs.readFileSync(path.join(ROOT, 'data/train_' + d + '.jsonl'), 'utf8').split('\n').filter((l) => l.trim()).forEach((l, i) => {
  const r = JSON.parse(l), o = W.coach(r.prompt, { files: [], detect, ...C.pick(r.prompt, CLS) });
  console.log(JSON.stringify({ src: 'train_' + d + ':' + (i + 1), grade: o.grade, headline: o.headline, stages: o.stages }));
});
```
`research/2026-10-20-quote-line-dump-compare.js`:
```js
/* node research/2026-10-20-quote-line-dump-compare.js before.jsonl after.jsonl : changed rows must equal quoted rows; only headline and stages.weak.verdict may change, and only on a weak row. */
const fs = require('fs');
const rd = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const a = rd(process.argv[2]), b = rd(process.argv[3]);
let changed = 0, quoted = 0, bad = 0;
b.forEach((y, i) => {
  const x = a[i], q = /The coach read your ask as "/.test(y.stages.weak.verdict) && /The coach read your ask as "/.test(y.headline);
  const diff = ['headline', ...['weak', 'better', 'strong'].flatMap((s) => ['prompt', 'verdict'].map((f) => s + '.' + f))].filter((k) => { const get = (o) => k === 'headline' ? o.headline : o.stages[k.split('.')[0]][k.split('.')[1]]; return get(x) !== get(y); });
  const only = diff.length === 2 && diff.includes('headline') && diff.includes('weak.verdict') && x.grade === 'weak';
  if (diff.length) changed++; if (q) quoted++;
  if (x.src !== y.src || (diff.length > 0) !== q || (diff.length && !only)) { bad++; console.log('BAD', y.src, diff.join(',')); }
});
console.log(`rows ${b.length} changed ${changed} quoted ${quoted} bad ${bad}`);
process.exitCode = bad || changed !== quoted ? 1 : 0;
```

- [ ] **Step 2: Run before (parent engine) and after.**
```bash
cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-analyze-format
mkdir -p /tmp/qdump && git archive 5cfff0c prompt-coach/engine | tar -x -C /tmp/qdump
cd prompt-coach
node research/2026-10-20-quote-line-dump.js /tmp/qdump/prompt-coach/engine > /tmp/qdump/before.jsonl
node research/2026-10-20-quote-line-dump.js engine > /tmp/qdump/after.jsonl
node research/2026-10-20-quote-line-dump-compare.js /tmp/qdump/before.jsonl /tmp/qdump/after.jsonl | tail -5
```
Expected: last line `rows 1080 changed N quoted N bad 0`, N equal and > 0 (in-sample; record the number printed), exit 0. A `BAD` line: fix the engine and redo from Task 3 step 3. If node cannot read `/tmp` paths, use one `mktemp -d` path consistently.

- [ ] **Step 3: Create the shipped-line out-of-fold check by copying the probe under a new name** (the original is untouched):
`sed -n '17,35p' research/2026-10-20-quote-line-probe.js` gives the 19 setup lines (requires, rows, CLS, SHIPPED, out-of-fold training into the OS temp folder, `detector` returning prob). Create `research/2026-10-20-quote-line-shipped-check.js` = a header comment ("Drop check, spec criterion 2, read on the headline. node research/2026-10-20-quote-line-shipped-check.js > research/2026-10-20-quote-line-shipped-check.tsv. Setup copied from the 2026-10-20 probe, which and whose counts are untouched.") + those 19 lines verbatim + :
```js
const out = []; let weak = 0, quoted = 0, misLabel = 0;
rows.forEach((r, i) => {
  const o = W.coach(r.prompt, { files: [], detect: detector(foldW[fold[i]]), ...C.pick(r.prompt, CLS) });
  if (o.grade !== 'weak') return; weak++;
  const m = /The coach read your ask as "(.*)": that says/.exec(o.headline); if (!m) return;
  quoted++; if (r.O !== 0) misLabel++;
  out.push([r.src, ['S', 'C', 'O', 'P', 'E'].map((k) => (r[k] ? k : '-')).join(''), r.O === 0 ? 'labelOK' : 'labelMIS', m[1], r.prompt.replace(/\s+/g, ' '), o.headline].join('\t'));
});
console.log(['src', 'label SCOPE', 'by label', 'quoted span', 'prompt', 'headline'].join('\t'));
console.log(out.join('\n'));
console.log(`# out of fold: weak ${weak}, quoted ${quoted}, wrong by label ${misLabel}`);
```

- [ ] **Step 4: Run it, read every quoted headline by eye.**
Run: `cd $PC && node research/2026-10-20-quote-line-shipped-check.js > research/2026-10-20-quote-line-shipped-check.tsv; tail -1 research/2026-10-20-quote-line-shipped-check.tsv; cut -f3,4,5 research/2026-10-20-quote-line-shipped-check.tsv | head -70`
Expected (prediction, stated before measuring): `# out of fold: weak 432, quoted ~51, wrong by label 0`. Count quoted spans that are not the user's ask words (by eye, against the prompt column; also confirm the headline reads as today's headline plus the quote sentence). Do not tune the rule after seeing this. Write the measured numbers down now (pre-drop measurements); they stay in their own section of the evidence doc.

- [ ] **Step 5: Apply the drop rule exactly as stated; the outcome is KEPT or DROPPED.** wrongTotal = wrong by label + wrong by eye (not double counted). If wrongTotal / quoted <= 0.10: KEPT, go to step 6. If > 0.10: DROPPED, run, in order:
```bash
cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-analyze-format
git revert --no-commit HEAD
```
Then in `prompt-coach/README.md` (after the revert the dist is the parent's 336173 bytes) set line 9 to the true count from `wc -c < prompt-coach/dist/prompt-coach.html` (it must say 336173, not 334435), and rewrite "Still open" to say the quote was built, measured (give the Task 4 step 4 numbers), dropped by the pre-stated 10% rule and parked. Then stage and commit:
```bash
git add prompt-coach/README.md
git commit -m "Prompt coach: quote line reverted and parked (drop rule: wrong words over 10% out of fold)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012xqQ7n7ws4b6v6v7Z1VWxR"
```
Check the committed README (not the working copy): `BYTES=$(wc -c < prompt-coach/dist/prompt-coach.html); git show HEAD:prompt-coach/README.md | grep -c "$BYTES bytes"` -> `1`; `git show HEAD:prompt-coach/README.md | grep -c "dropped by the pre-stated 10% rule"` -> `1`; `git show HEAD:prompt-coach/README.md | grep -c 334435` -> `0`; `git status --short prompt-coach/README.md | wc -l` -> `0`.

- [ ] **Step 6: Commit the scripts and tsv** (`git add prompt-coach/research/2026-10-20-quote-line-dump.js prompt-coach/research/2026-10-20-quote-line-dump-compare.js prompt-coach/research/2026-10-20-quote-line-shipped-check.js prompt-coach/research/2026-10-20-quote-line-shipped-check.tsv`, trailer as above, message "Prompt coach: quote line dump and out-of-fold shipped check").

Check: `git diff 5cfff0c --stat -- prompt-coach/research/2026-10-20-quote-line-probe.js prompt-coach/research/2026-10-20-quote-line-probe.md prompt-coach/engine/weights.json prompt-coach/engine/cls-weights.json | wc -l` prints `0`.

---

### Task 5: Captures and evidence doc (branches on KEPT or DROPPED)

**Files:** Create `docs/evidence/2026-10-20-prompt-coach-quote-line.md`; if KEPT also `prompt-coach/research/2026-10-20-quote-line-capture.js` and `docs/evidence/2026-10-20-prompt-coach-quote-line/{quote,exclusion}.png`.

**Interfaces:** Consumes the Task 4 outcome. Produces the evidence doc with two separate result sections: "Pre-drop measurements" (Task 4 numbers, always present) and "Final state" (what the repo's HEAD gives).

- [ ] **Step 1: If KEPT, capture script** (CDP like `tests/pagetest.js`; copy its Chrome launch lines 3-11, the `send`/`ev` helpers and viewport override from that file, no new dependency). After `Page.navigate` and a 1500 ms wait, for each case `{name:'quote', prompt:'help with the 10-K'}` and `{name:'exclusion', prompt:'Evaluate: carefully'}`: set `#prompt`, dispatch `input`, wait 700 ms, get the rect of the nearest ancestor of `#headline` that also contains `#yourLabel` via `getBoundingClientRect`, `Page.captureScreenshot` with `{format:'png', clip:{x,y,width,height,scale:1}}`, write to `docs/evidence/2026-10-20-prompt-coach-quote-line/<name>.png`, print `name sha256 headline-text` (`crypto.createHash('sha256')`). If DROPPED: skip steps 1-3 and write "captures not taken: change dropped" in the doc.

- [ ] **Step 2: If KEPT, run it.** Run: `cd $PC && node research/2026-10-20-quote-line-capture.js`
Expected: `quote <64-hex> ...The coach read your ask as "help with the 10-K"...` and `exclusion <64-hex> ...` with no "The coach read your ask".

- [ ] **Step 3: If KEPT, open both PNGs with Read** and confirm: right subject (the Your prompt panel), nothing on top, no blank area; quote.png shows the quote sentence, exclusion.png does not. If wrong, fix the clip and re-run.

- [ ] **Step 4: Write `docs/evidence/2026-10-20-prompt-coach-quote-line.md` with these sections, kept apart:**
  1. Prediction and drop rule, copied from Global Constraints (stated before measuring).
  2. **Pre-drop measurements** (always, from the Task 3/4 state with the change applied): unit 63/0 (Task 2 step 5), pagetest 15 checks (Task 3 step 3), the Task 4 step 2 dump line, the Task 4 step 4 numbers (weak, quoted, wrong by label, wrong by eye with every wrong span listed, rate), the verdict KEPT or DROPPED.
  3. **Final state** (what HEAD gives after the verdict, from Step 5 below): KEPT -> unit 63 pass, pagetest 15 checks, other three lines identical to the parent, PNG sha256 and the two headline texts; DROPPED -> unit 57 pass, pagetest 12 checks, other three identical to the parent, no PNGs, README byte count 336173.
  4. The 06:04Z ruling; the finding "the 147-of-430 probe measured a line users never see; the headline names only source and ask"; a Read-not-measured line (published work, the duplicate session's 12.8%, the lead's Chrome measurement of the seam).
  5. **For Ian**: (1) proxy decided A (headline) at 06:04Z after B (ask only); he may overturn; (2) the 147-of-430 wrong-letter figure applies to a verdict nobody sees, so re-measure the headline's source/ask claim if he wants one; (3) option D (name only sure letters) is still his; (4) the README byte count was stale and is corrected; (5) the live sandbox shows nothing (0 of 13 weak).

- [ ] **Step 5: Final-state suite.** Run `cd $PC && node tests/build.js` (rebuilds the dist for the current HEAD; if DROPPED confirm `git status --short prompt-coach/dist | wc -l` is `0`, else commit nothing), then the five role-checks lines, one per call. Expected, KEPT: unit `# pass 63`, `# fail 0`; simulate `runs=2070 strongNotStrong 2 betterWeak 5 toggleNoEffect 0 dupSentence 0 badText 2 emptyFrag 0`; `PASS 229 runs`; `GRADE acc=0.856 flips=8`; `pagetest: 15 checks, 0 failed`. Expected, DROPPED: the same except unit `# pass 57`, `# fail 0` and `pagetest: 12 checks, 0 failed`. Paste these final values into the doc's "Final state" section only.

- [ ] **Step 6: Commit** (`git add docs/evidence/2026-10-20-prompt-coach-quote-line.md`, plus on KEPT `docs/evidence/2026-10-20-prompt-coach-quote-line prompt-coach/research/2026-10-20-quote-line-capture.js`; trailer as above).

---

## Expected breaks

(none) - no existing test title changes: every existing caller returns no `prob`, so output is byte-identical; `tests/pagetest.js` gains 3 checks and no existing check changes. The 6 new unit tests and the first new page check are red on the parent by design (Task 1, Task 3 step 2) and fixed by Task 2.

## Self-review (spec coverage)

- Criterion 1 -> Task 1 (headline and verdict). 2 -> Task 4 steps 3-5 on the headline. 3 -> Task 4 steps 1-2 (headline + weak.verdict only). 4 -> Task 2 step 6, Task 3, Task 5 step 5. 5 -> Task 3 steps 3-4. Ruling items -> "Why the headline", Task 3 steps 1 and 5, Task 5 step 4.
- Source never quoted and no stacked wording: no code path.

## Spec gaps found (resolved)

1. README line 9 byte count was already stale on the parent (336173 vs 334435); Task 3 and the revert path set the true count, and the revert path checks the committed README.
2. A span with no match in the narrower `vagueVerb` regex (rewrite.js:579): the quote is added anyway.
3. The probe's lead list had "okay", the spec's does not; the shipped rule follows the spec, so the shipped-line count may differ slightly from the probe's 55/51.
4. "Callers pass the probability" is done by the page `detect` only; other callers stay prob-less on purpose.
5. The "no quote" unit and page checks pass on the parent alone, so each is paired with a contrast assert that is red on the parent.
6. Tasks 1-3 share one commit (README, dist, spec move with the code).
7. The headline seam (stages.weak.verdict is unseen) invalidates the spec's premise that the verdict is the user-facing line; handled by the 06:04Z ruling and the evidence-doc finding.

## Token estimates (helper tokens) and locked files

| Task | Estimate |
|---|---|
| 1 | 12k |
| 2 | 18k |
| 3 | 18k |
| 4 | 30k |
| 5 | 20k |
| Run total | about 98k, 30 tool calls (cap) |

Locked files: `prompt-coach/heldout/`, sealed files, `prompt-coach/data/test.jsonl` (via `tests/eval.js` only), `prompt-coach/engine/*.json`, `prompt-coach/research/2026-10-20-quote-line-probe.{js,md,tsv}`.
