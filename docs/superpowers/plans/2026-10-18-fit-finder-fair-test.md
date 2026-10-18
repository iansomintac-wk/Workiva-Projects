# Fit Finder fair test Implementation Plan (revision 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not tick boxes during the run (progress goes in the ledger).

Suite: bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder && node tests/catalogue.test.js'
Data: fit-finder/data/, .ledger/2026-10-18-fit-finder-fair-test/, C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test/

**Goal:** Measure, on about 100 new model-written and model-labelled prompts, whether the Fit Finder's first-card rules hold up when tuned on one half and judged once on the untouched half.

**Architecture:** A fail-closed scoring script (`synth-score.js`) and a guard (`fair-guard.js`) are written, red-proven and locked first, with ledger checkers for engine purity, memorisation and the tune transcript. A writer helper and a different blind labeller helper produce the set. The set is split by seed; the untouched half and the unsplit batch move to a sealed folder outside the worktree before the engine sees any new row. One Sonnet helper tunes `fit.js` and the `match` fields on the tuning half, on its own branch, under the `tune-loop` skill. The kept diff is brought onto the main branch as one commit with the rebuilt dist and README numbers. The untouched half is hash-checked and scored exactly once.

**Tech Stack:** Node (no dependencies; no `jq`, it is not installed), JSONL files, `nearcopy.cjs` (5-word-run copy check), bash, git.

**Spec:** `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/docs/superpowers/specs/2026-10-18-fit-finder-fair-test-design.md` (the authority; implementers read it as well, but the tune helper never does). Where the lead's decisions differ from the spec, they win: the untouched half lives in a sealed folder outside the worktree (spec section 3 says `.ledger/.../holdout/`); fresh fit agreement is pinned (spec section 4 leaves it out).

## Paths used below

- W = `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test` (branch `fit-finder-fair-test`)
- FF = `W/fit-finder`
- L = `W/.ledger/2026-10-18-fit-finder-fair-test` (git-ignored after Task 1 step 1; never `git add -A`, always add named files)
- S (sealed) = `C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test` (outside the worktree; created in Task 6; its path is never put in a tune dispatch)
- Tune branch = `fit-finder-fair-test-tune` (made in Task 7 from the Task 6 commit)
- Step tags: `[IMPL]` writes files (implementer, or the writer/labeller helper); `[CHECK]` is read-only and each such command is a line the lead puts in `role-checks.txt` verbatim; `[LEAD]` is a dispatch or decision.

## Global Constraints

- Write every code file (`.js`, `.cjs`, `.sh`) with the Write tool, copying the plan's block exactly; never through a shell heredoc, echo or printf. Measured 2026-10-18 by the talk lead: on this machine the Bash tool turns `\\` into `\` in any command text, even inside single quotes and a quoted heredoc (`printf '%s\n' 'a\\b'` wrote `a\b`), which broke a regex. Check commands that need a literal backslash go in a script file.

- Never open or print `fit-finder/data/real/` contents (customer prompts). Counts and ids only. No helper prompt, dispatch or log quotes from it. Every Codex prompt says: do not open `fit-finder/data/real/`, `.ledger/`, or `C:/Users/teasp/Documents/workiva-sealed/`.
- Seed 20261018; the split uses the same LCG as `tests/eval.js` (`s = (s * 1664525 + 1013904223) >>> 0`, divide by 4294967296, Fisher-Yates from the end, `j = (rnd() * (i + 1)) | 0`); first `floor(n/2)` ids are the tuning half, the rest untouched.
- Row shapes: prompts `{"id":"N1".."N104","task":"..."}`; gold `{"id","fit":"good|partial|not","cards":[...],"by":"model","conf":"high|low"}`; a `not` row has `cards: []`.
- Score `S = 2W + M + 2K` (W wrong card, M no card where one fits, K card on a not-a-fit prompt); lower is better.
- Pins (fair-guard): B right >= 13 and wrong <= 3; A right >= 12 and wrong <= 0; real right >= 15 and wrong <= 2; fresh right >= 15, wrong <= 5, card on not-a-fit <= 1, fit agreement >= 12 (of 29); eval A fit agreement >= 52 and B >= 45, each over 60 rows; the suite and both eval runs exit 0; `catalogue.json` differs from the pre-tune commit only in `match` fields.
- Keep rule per tune attempt: score strictly lower than the best kept AND tuning-half first-card right >= its pre-tune value. Tune target: tuning-half wrong <= floor(3F/23) with that same right condition.
- Engine purity: the added lines of the engine/catalogue diff, grepped for the code forms `require(`, `process.`, `argv`, `fs.`, `readFile`, a line-start or call `import`, `fetch(`, browser storage and `N<digits>` ids (match words such as "processing" stay allowed), give 0 hits. Memorisation: on the added lines, regex syntax is replaced with spaces, then a 4-word run shared with a tuning prompt gives 0 hits (no waiver), and no added alternative is longer than 3 words.
- Pass bar on the untouched half: wrong card <= floor(3F/23), F = its fitting rows (F = 37 gives 4). Reported, not pass: first card right, fit agreement on both halves, the pre-tune tuning-half line, count of `conf: low` labels.
- The untouched half is scored once. Its single output is written to a file (Task 9) and recorded; every later step compares committed copies by sha256 only and never re-scores.
- Nothing containing an untouched-half row stays in the worktree or `.ledger/` after Task 6.
- The live page is not republished (Ian's). This plan pushes nothing and merges nothing. (The overnight slip allows a push of its own branch; the lead decides that after the run. No merge.)
- Every `bash -c` check line starts `set -o pipefail` and its expected exit status is stated; a red proof expects exit 1 and says so.
- Commit messages end with these two lines (a real newline between them):
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` then `Claude-Session: https://claude.ai/code/session_01H2qm8GtpiHC26XLfs5izTu`
- Say which numbers were measured now and which were read.
- Note on `.git/info/exclude`: it is shared by every worktree of the repo, so adding `.ledger/` hides `.ledger/` in all of them. It is safe (the file already ends with a newline, measured by the review).

## Cost

- Paid tools: none. Usage only (Claude subscription; the Codex review is read-only on the existing subscription, no per-call spend).
- Paid calls listed: none. Model calls (usage, not billed per call): Task 4 Opus writer; Task 5 Opus labeller; Task 7 Sonnet tune helper; Task 10 Opus final-reviewer and one read-only Codex review; Sonnet implementers for Tasks 1-3, 4, 5, 6, 8, 9, 10 and Sonnet checkers on every `[CHECK]` step (Haiku may type Tasks 1-3's code, which is given in full).
- Helper tool-call cap for the whole run: 400 (writer 25, labeller 25, tune helper 90, the rest for implementers, checkers and reviewers). A helper stops at its own cap and reports.
- Helper-token estimate (rough, input plus output): T1 40k, T2 45k, T3 35k, T4 90k, T5 80k, T6 35k, T7 450k, T8 40k, T9 30k, T10 150k. Run total about 995k tokens.
- Groups: none (each task needs the one before). Tune task: Task 7 only.

## Locked files (nobody edits these after the task that creates them)

- After Task 1: `fit-finder/tests/synth-score.js`, `fit-finder/tests/synth-score.test.js`.
- After Task 2: `fit-finder/tests/fair-guard.js`, `L/strict-pins.json`, `L/guard-red.sh`.
- After Task 3: `L/tune-checks.cjs`, `L/numbers.cjs`, `L/nearcopy.cjs`, `L/tc-fixtures/`, `L/tc-test.sh`.
- Always: `fit-finder/tests/catalogue.test.js`, `fit-finder/tests/eval.js`, `fit-finder/tests/build.js`, `fit-finder/tests/pagetest.js`, `fit-finder/data/LABELING.md`, every existing `fit-finder/data/*.jsonl`, `fit-finder/data/real/`, `fit-finder/tests/rewrite-pool.jsonl`, every non-`match` field of `fit-finder/data/catalogue.json`.
- After Task 6: `fit-finder/data/synth/2026-10-18-tune.jsonl`, `fit-finder/data/card-gold-synth-tune.jsonl`, `fit-finder/data/synth/2026-10-18-holdout.sha256`, everything under `S` (read only by Task 9).
- Only Task 7 (on the tune branch) may edit `fit-finder/engine/fit.js` and the `match` fields of `fit-finder/data/catalogue.json`. Task 8 only copies the kept versions. After Task 8 both are locked ("no rule change after the untouched half is scored").

---

### Task 1: Fail-closed scoring script, test-first (Sonnet implementer; checker Sonnet)

**Files:**
- Create: `FF/tests/synth-score.test.js`, `FF/tests/synth-score.js`
- Locked: everything in the locked list above that already exists.

**Interfaces:**
- Produces: `node tests/synth-score.js <prompts.jsonl> <gold.jsonl>` prints one line: `first card right: R of F that fit; wrong card W (ids); no card where one fits M (ids); card on a not-a-fit prompt K (ids); fit agreement A of n; score S`. Exit 0. On any bad input it prints nothing on stdout, a reason on stderr (`synth-score: ...`) and exits 2: no args (usage), unreadable file, malformed row (not JSON, no string id, prompt without a task, gold fit not good/partial/not, gold cards not an array of strings), duplicate id (reasons `duplicate prompt id`, `duplicate gold id`), prompt and gold id sets not identical (`ids differ`), unknown card id (`unknown card`), cards on a not-a-fit row (`not-a-fit`), no rows (`no rows`).

- [ ] **Step 1: [IMPL] Ledger hygiene.**
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; cd $W; E=$(git rev-parse --git-path info/exclude); grep -qx ".ledger/" "$E" || echo ".ledger/" >> "$E"; git status --short | grep -c "^?? .ledger/" || true'
```
Expected: prints `0`, exit 0 (`.ledger/` no longer listed as untracked).

- [ ] **Step 2: [IMPL] Write the test first: `FF/tests/synth-score.test.js`.**
```js
/* node tests/synth-score.test.js
   synth-score must score a good pair and fail closed (exit 2, nothing on stdout) on every bad input. */
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const script = path.join(__dirname, 'synth-score.js');
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/catalogue.json'), 'utf8'));
const card = cat.useCases[0].id;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synth-score-'));
let n = 0, fails = 0;
const text = (rows) => rows.map((r) => (typeof r === 'string' ? r : JSON.stringify(r))).join('\n') + '\n';
const run = (prompts, gold) => {
  const p = path.join(dir, 'p' + n + '.jsonl'), g = path.join(dir, 'g' + n + '.jsonl');
  fs.writeFileSync(p, text(prompts)); fs.writeFileSync(g, text(gold));
  return spawnSync(process.execPath, [script, p, g], { encoding: 'utf8' });
};
const ok = (name, cond, detail) => { n++; if (!cond) { fails++; console.log('FAIL ' + name + (detail ? ': ' + detail : '')); } };
const closed = (name, r, why) => ok(name, r.status === 2 && r.stdout === '' && r.stderr.includes(why), `exit ${r.status} stdout "${r.stdout}" stderr "${r.stderr.trim()}"`);
const P = [{ id: 'T1', task: 'zzqx vvkw' }, { id: 'T2', task: 'zzqx vvkw jjrp' }];
const G = [{ id: 'T1', fit: 'good', cards: [card], by: 'model', conf: 'high' }, { id: 'T2', fit: 'not', cards: [], by: 'model', conf: 'low' }];

const r = run(P, G);
ok('scores a good pair', r.status === 0 && /^first card right: 0 of 1 that fit; wrong card 0 \(\); no card where one fits 1 \(T1\); card on a not-a-fit prompt 0 \(\); fit agreement \d+ of 2; score 1\n$/.test(r.stdout), `exit ${r.status} out "${r.stdout}" err "${r.stderr.trim()}"`);
const u = spawnSync(process.execPath, [script], { encoding: 'utf8' });
closed('usage error', u, 'usage');
closed('duplicate prompt id', run([P[0], P[0]], G), 'duplicate prompt id');
closed('duplicate gold id', run(P, [G[0], G[0], G[1]]), 'duplicate gold id');
closed('gold lacks a prompt id', run(P, [G[0]]), 'ids differ');
closed('gold has an extra id', run(P, [...G, { ...G[1], id: 'T3' }]), 'ids differ');
closed('same count, different ids', run(P, [G[0], { ...G[1], id: 'T9' }]), 'ids differ');
closed('malformed json line', run(P, [G[0], '{not json']), 'malformed gold row');
closed('prompt row without task', run([P[0], { id: 'T2' }], G), 'malformed prompt row');
closed('bad fit value', run(P, [G[0], { ...G[1], fit: 'maybe' }]), 'malformed gold row');
closed('cards not an array', run(P, [{ ...G[0], cards: card }, G[1]]), 'malformed gold row');
closed('unknown card id', run(P, [{ ...G[0], cards: ['NOPE'] }, G[1]]), 'unknown card');
closed('cards on a not-a-fit row', run(P, [G[0], { ...G[1], cards: [card] }]), 'not-a-fit');
closed('empty files', run([], []), 'no rows');
fs.rmSync(dir, { recursive: true, force: true });
console.log(fails ? `synth-score tests FAILED: ${fails} of ${n}` : `synth-score tests pass: ${n}`);
process.exit(fails ? 1 : 0);
```

- [ ] **Step 3: [CHECK] Red proof (the script does not exist at the parent commit).**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder && node tests/synth-score.test.js | tail -2; echo "exit $?"'
```
Expected: lines starting `FAIL`, last line `synth-score tests FAILED: 14 of 14`, then `exit 1` (this exit 1 is the red state; with pipefail it is node's status).

- [ ] **Step 4: [IMPL] Write `FF/tests/synth-score.js`.**
```js
/* Score the first card on a prompt file against a gold file, in the suite's fresh-line format plus a score.
   node tests/synth-score.js prompts.jsonl gold.jsonl      score S = 2*wrong + no card + 2*card on a not-a-fit prompt (lower is better)
   Fails closed: exit 2, nothing on stdout, on any bad input. */
const fs = require('fs'), path = require('path');
const die = (m) => { console.error('synth-score: ' + m); process.exit(2); };
const [pf, gf] = process.argv.slice(2);
if (!pf || !gf) die('usage: node tests/synth-score.js prompts.jsonl gold.jsonl');
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/catalogue.json'), 'utf8'));
const { rate, match } = require('../engine/fit.js');
const cardIds = new Set(cat.useCases.map((u) => u.id));
const load = (f, what) => {
  let t;
  try { t = fs.readFileSync(f, 'utf8'); } catch (e) { return die('cannot read ' + what + ' file'); }
  return t.split('\n').filter((l) => l.trim()).map((l, i) => {
    try { const r = JSON.parse(l); if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id) throw new Error('x'); return r; }
    catch (e) { return die('malformed ' + what + ' row ' + (i + 1)); }
  });
};
const rows = load(pf, 'prompt'), goldRows = load(gf, 'gold');
rows.forEach((r, i) => { if (typeof r.task !== 'string' || !r.task.trim()) die('malformed prompt row ' + (i + 1)); });
goldRows.forEach((g, i) => {
  if (!['good', 'partial', 'not'].includes(g.fit) || !Array.isArray(g.cards) || g.cards.some((c) => typeof c !== 'string')) die('malformed gold row ' + (i + 1));
  const bad = g.cards.find((c) => !cardIds.has(c));
  if (bad) die('unknown card ' + bad + ' in gold row ' + g.id);
  if (g.fit === 'not' && g.cards.length) die('cards on a not-a-fit gold row ' + g.id);
});
const uniq = (a, what) => { const s = new Set(); for (const r of a) { if (s.has(r.id)) die('duplicate ' + what + ' id ' + r.id); s.add(r.id); } return s; };
const pi = uniq(rows, 'prompt'), gi = uniq(goldRows, 'gold');
if (pi.size !== gi.size || [...pi].some((x) => !gi.has(x))) die('prompt and gold ids differ');
if (!rows.length) die('no rows');
const gold = new Map(goldRows.map((g) => [g.id, g]));
const first = (r) => (match(r.task, cat)[0] || {}).id, want = (r) => gold.get(r.id).cards;
const fit = rows.filter((r) => gold.get(r.id).fit !== 'not');
const wrong = fit.filter((r) => first(r) && !want(r).includes(first(r)));
const missed = fit.filter((r) => !first(r) && want(r).length);
const notShown = rows.filter((r) => gold.get(r.id).fit === 'not' && first(r));
const agree = rows.filter((r) => rate(r.task).fit === gold.get(r.id).fit).length;
const ids = (a) => a.map((r) => r.id).join(',');
const S = 2 * wrong.length + missed.length + 2 * notShown.length;
console.log(`first card right: ${fit.length - wrong.length - missed.length} of ${fit.length} that fit; wrong card ${wrong.length} (${ids(wrong)}); no card where one fits ${missed.length} (${ids(missed)}); card on a not-a-fit prompt ${notShown.length} (${ids(notShown)}); fit agreement ${agree} of ${rows.length}; score ${S}`);
```

- [ ] **Step 5: [CHECK] Green proof, then equivalence with the suite on the fresh set (counts and ids only).**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder && node tests/synth-score.test.js | tail -1; echo "exit $?"'
```
Expected: `synth-score tests pass: 14`, `exit 0`.
```bash
bash -c 'set -e -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder; A=$(node tests/synth-score.js data/real/2026-10-17-fresh.jsonl data/card-gold-fresh.jsonl | sed "s/; score .*//"); B=$(node tests/catalogue.test.js | grep "^fresh prompts first card right" | sed "s/^fresh prompts //; s/; labelled by.*//"); [ -n "$A" ] && [ "$A" = "$B" ] && echo SAME; node tests/synth-score.js data/real/2026-10-17-fresh.jsonl data/card-gold-fresh.jsonl | grep -c "right: 15 of 23 that fit; wrong card 5 (G2,G14,G15,G22,X1);.*card on a not-a-fit prompt 1 (G5); fit agreement 12 of 29; score 15"'
```
Expected: `SAME` then `1`, exit 0 (score 15 = 2x5 + 3 + 2x1). If the figures differ from the suite's, the script is wrong; do not edit the suite.

- [ ] **Step 6: [IMPL] Commit.**
```bash
bash -c 'set -e; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git add fit-finder/tests/synth-score.js fit-finder/tests/synth-score.test.js; git commit -m "Fit Finder fair test: fail-closed synth-score and its test (red on the parent, green on fresh set)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01H2qm8GtpiHC26XLfs5izTu"'
```

- [ ] **Step 7: [CHECK] Commit scope.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git diff --name-only HEAD~1..HEAD; echo "exit $?"'
```
Expected: exactly `fit-finder/tests/synth-score.js` and `fit-finder/tests/synth-score.test.js`, `exit 0`.

---

### Task 2: Guard, test-first with one red proof per condition (Sonnet implementer; checker Sonnet)

**Files:**
- Create: `FF/tests/fair-guard.js`; ledger: `L/strict-pins.json`, `L/guard-red.sh`
- Locked: everything above that exists. The red proofs edit tracked files in the working tree and revert them with `git checkout -- <file>`; `data/real/` is never copied.

**Interfaces:**
- Consumes: Task 1 commit (so the working tree is clean for the red proofs).
- Produces: `node tests/fair-guard.js --base <sha> [--lock-base <sha>] [--pins <file>]` prints `fair-guard PASS` (exit 0) or `fair-guard FAIL: <reason> | <reason>` (exit 1). `--base` falls back to env `FAIR_BASE`; missing base is a FAIL. `--lock-base` (default: the base) is the commit the locked paths are compared with. `--pins` is a JSON file of the shape below; default is the pin set in Global Constraints.
  Reasons it can print: `suite exit N`, `<set>: suite line missing`, `B|A|real|fresh: right N < M`, `...: wrong N > M`, `fresh: card on not-a-fit N > M`, `fresh: fit agreement N < M`, `eval A|B: exit N`, `eval A|B: no summary line`, `eval A|B: denominator N != M`, `eval A|B: agreement N < M`, `locked files differ from base`, `locked paths have uncommitted or untracked changes`, `catalogue: differs from base outside match fields`, `no --base given`.

- [ ] **Step 1: [CHECK] Red proof (the guard does not exist at the parent commit).**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder && node tests/fair-guard.js --base HEAD 2>&1 | tail -1; echo "exit $?"'
```
Expected: a `Cannot find module` line and `exit 1`.

- [ ] **Step 2: [IMPL] Write `FF/tests/fair-guard.js`.**
```js
/* Guard for the fair-test tuning loop.  node tests/fair-guard.js --base <sha> [--lock-base <sha>] [--pins <file>]
   Exit 0 only if: the suite exits 0; every pin holds (suite lines incl. fresh fit agreement); eval A and B exit 0 over the pinned
   number of rows and hold their agreement pins; the locked paths are unchanged against the lock base; catalogue.json differs
   from <sha> only in match fields. */
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a.splice(i, 2)[1] : d; };
const root = path.join(__dirname, '..');
const pinFile = opt('--pins');
const base = opt('--base', process.env.FAIR_BASE);
const lockBase = opt('--lock-base', base);
const pins = pinFile ? JSON.parse(fs.readFileSync(pinFile, 'utf8'))
  : { B: { r: 13, w: 3 }, A: { r: 12, w: 0 }, real: { r: 15, w: 2 }, fresh: { r: 15, w: 5, k: 1, agree: 12 }, evalA: 52, evalB: 45, evalRows: 60 };
const bad = [];
const run = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
const git = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
const suite = run(['tests/catalogue.test.js']);
if (suite.status !== 0) bad.push('suite exit ' + suite.status);
const lines = (suite.stdout || '').split('\n');
const num = (re, l) => { const m = re.exec(l); return m ? +m[1] : NaN; };
const pin = (label, prefix, need) => {
  const l = lines.find((x) => x.startsWith(prefix));
  if (!l) { bad.push(label + ': suite line missing'); return; }
  const right = num(/first card right: (\d+) of/, l), wrong = num(/wrong card (\d+)/, l);
  if (!(right >= need.r)) bad.push(`${label}: right ${right} < ${need.r}`);
  if (!(wrong <= need.w)) bad.push(`${label}: wrong ${wrong} > ${need.w}`);
  if (need.k !== undefined) { const k = num(/card on a not-a-fit prompt (\d+)/, l); if (!(k <= need.k)) bad.push(`${label}: card on not-a-fit ${k} > ${need.k}`); }
  if (need.agree !== undefined) { const g = num(/fit agreement (\d+) of/, l); if (!(g >= need.agree)) bad.push(`${label}: fit agreement ${g} < ${need.agree}`); }
};
pin('B', 'first card right:', pins.B);
pin('A', 'half A first card right:', pins.A);
pin('real', 'real prompts first card right:', pins.real);
pin('fresh', 'fresh prompts first card right:', pins.fresh);
for (const [h, key] of [['A', 'evalA'], ['B', 'evalB']]) {
  const e = run(['tests/eval.js', 'data/tasks.jsonl', 'data/tasks.jsonl', '--ids', h]);
  const m = /fit agreement (\d+)\/(\d+)/.exec(e.stdout || '');
  if (e.status !== 0) bad.push(`eval ${h}: exit ${e.status}`);
  if (!m) bad.push(`eval ${h}: no summary line`);
  else {
    if (+m[2] !== pins.evalRows) bad.push(`eval ${h}: denominator ${m[2]} != ${pins.evalRows}`);
    if (+m[1] < pins[key]) bad.push(`eval ${h}: agreement ${m[1]} < ${pins[key]}`);
  }
}
const locked = ['fit-finder/tests', 'fit-finder/data/LABELING.md', 'fit-finder/data/synth', ':(glob)fit-finder/data/*.jsonl'];
if (!base) bad.push('no --base given');
else {
  const d = git(['diff', '--quiet', lockBase, '--', ...locked]);
  if (d.status !== 0) bad.push('locked files differ from base (git diff exit ' + d.status + ')');
  const s = git(['status', '--porcelain', '--', ...locked]);
  if (s.status !== 0 || s.stdout.trim()) bad.push('locked paths have uncommitted or untracked changes');
  const g = git(['show', base + ':fit-finder/data/catalogue.json']);
  if (g.status !== 0) bad.push('catalogue: cannot read base ' + base);
  else {
    const strip = (c) => JSON.stringify({ ...c, useCases: c.useCases.map((u) => { const { match, ...rest } = u; return rest; }) });
    const now = JSON.parse(fs.readFileSync(path.join(root, 'data/catalogue.json'), 'utf8'));
    if (strip(JSON.parse(g.stdout)) !== strip(now)) bad.push('catalogue: differs from base outside match fields');
  }
}
console.log(bad.length ? 'fair-guard FAIL: ' + bad.join(' | ') : 'fair-guard PASS');
process.exit(bad.length ? 1 : 0);
```

- [ ] **Step 3: [IMPL] Write `L/strict-pins.json` (every pin one notch stricter than today) and `L/guard-red.sh`.**
`L/strict-pins.json`:
```json
{"B":{"r":14,"w":2},"A":{"r":13,"w":-1},"real":{"r":16,"w":1},"fresh":{"r":16,"w":4,"k":0,"agree":13},"evalA":53,"evalB":46,"evalRows":61}
```
`L/guard-red.sh` (one red condition per block; each edit is reverted with `git checkout -- <file>`; a trap reverts on any exit; it needs a clean tree and a committed guard):
```bash
#!/usr/bin/env bash
# Run from anywhere. Needs: Task 1 and guard committed, clean tracked tree. Prints "red conditions ok: N of 6" and exits 0 only if N = 6.
cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test || exit 3
L=.ledger/2026-10-18-fit-finder-fair-test
trap 'git checkout -- fit-finder/data/catalogue.json fit-finder/data/LABELING.md fit-finder/engine/fit.js' EXIT
ok=0; OUT=""
G="node fit-finder/tests/fair-guard.js"
red() { name="$1"; shift; OUT=$("$@" 2>&1); code=$?; if [ "$code" -eq 1 ]; then return 0; fi; echo "NOT RED (exit $code): $name"; return 1; }
has() { if printf '%s' "$OUT" | grep -q -- "$1"; then return 0; fi; echo "MISSING reason '$1'"; return 1; }
# 1 card text change (not a match field)
node -e 'const f="fit-finder/data/catalogue.json",fs=require("fs"),c=JSON.parse(fs.readFileSync(f,"utf8"));c.useCases[0].task+=" (changed)";fs.writeFileSync(f,JSON.stringify(c,null,2))'
red "card text changed" $G --base HEAD && has "differs from base outside match fields" && ok=$((ok+1))
git checkout -- fit-finder/data/catalogue.json
# 2 locked file edit (the labelling guide)
echo "x" >> fit-finder/data/LABELING.md
red "locked file edited" $G --base HEAD && has "locked files differ from base" && has "uncommitted or untracked" && ok=$((ok+1))
git checkout -- fit-finder/data/LABELING.md
# 3 stricter pin file: every pin label must appear in the reasons
red "stricter pins" $G --base HEAD --pins $L/strict-pins.json && has "B: right" && has "A: wrong" && has "real: right" && has "fresh: right" && has "fresh: card on not-a-fit" && has "fresh: fit agreement" && has "eval A: agreement" && has "eval B: agreement" && has "eval A: denominator 60 != 61" && ok=$((ok+1))
# 4 engine that throws: suite and both evals exit non-zero
echo "throw new Error('guard red test');" >> fit-finder/engine/fit.js
red "engine throws" $G --base HEAD && has "suite exit 1" && has "eval A: exit 1" && has "eval B: exit 1" && ok=$((ok+1))
git checkout -- fit-finder/engine/fit.js
# 5 no base
red "no base" env -u FAIR_BASE $G && has "no --base given" && ok=$((ok+1))
# 6 clean again: the guard passes and the tree is clean
OUT=$($G --base HEAD 2>&1); code=$?; if [ "$code" -eq 0 ] && [ "$OUT" = "fair-guard PASS" ] && [ -z "$(git status --porcelain -- fit-finder)" ]; then ok=$((ok+1)); else echo "NOT GREEN at the end: exit $code"; fi
echo "red conditions ok: $ok of 6"
[ "$ok" -eq 6 ]
```

- [ ] **Step 4: [IMPL] Commit the guard (so the red proofs run on a clean tree).**
```bash
bash -c 'set -e; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git add fit-finder/tests/fair-guard.js; git commit -m "Fit Finder fair test: fair-guard (pins incl. fresh agreement, exit statuses, locked files, match-only catalogue)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01H2qm8GtpiHC26XLfs5izTu"'
```

- [ ] **Step 5: [CHECK] Green on HEAD.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder && node tests/fair-guard.js --base HEAD | tail -1; echo "exit $?"'
```
Expected: `fair-guard PASS`, `exit 0`.

- [ ] **Step 6: [IMPL] Run the six red conditions.**
```bash
bash -c 'set -o pipefail; bash C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-18-fit-finder-fair-test/guard-red.sh | tail -8; echo "exit $?"'
```
Expected: last line `red conditions ok: 6 of 6`, `exit 0`, no `NOT RED` or `MISSING` lines. If a reason is missing, fix `fair-guard.js` and recommit (still before Task 4).

- [ ] **Step 7: [CHECK] The tree is clean again and the commit scope is right.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git status --short | grep -v "^??" | wc -l; git diff --name-only HEAD~1..HEAD; echo "exit $?"'
```
Expected: `0`, then `fit-finder/tests/fair-guard.js` only, `exit 0`.

---

### Task 3: Ledger checkers: purity, memorisation, transcript audit, numbers (Sonnet implementer; checker Sonnet)

**Files:**
- Create (ledger, not committed): `L/tune-checks.cjs`, `L/numbers.cjs`, `L/tc-fixtures/*`, `L/tc-test.sh`; copy `L/nearcopy.cjs`.
- Locked: all repo files (this task changes none).

**Interfaces:**
- Produces: `node tune-checks.cjs purity (--base <sha> | --added <file>)` prints `purity hits N` (lines hit; never the text); `node tune-checks.cjs memo (--base <sha> | --added <file>) --prompts <jsonl>` prints `near-copy hits A; long alternatives B`; `node tune-checks.cjs audit <transcript.jsonl>` prints `tool_use inputs scanned N; forbidden hits H` (needles `workiva-sealed` and `2026-10-18-fit-finder-fair-test/new`, case-insensitive, backslashes read as `/`). Exit 0 clean, 1 hits, 2 usage or bad input (audit: also 2 when 0 tool_use inputs were scanned). `--base` runs `git diff -U0 <sha>..HEAD -- fit-finder/engine fit-finder/data/catalogue.json` from the current directory (run from `W`) and keeps the added lines only.
- Produces: `node numbers.cjs <scoreline-file>` prints `R=.. F=.. W=.. M=.. K=.. agree=.. score=.. bar=<floor(3F/23)> wrong_within_bar=yes|no`.

- [ ] **Step 1: [IMPL] Copy nearcopy.**
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; mkdir -p $W/.ledger/2026-10-18-fit-finder-fair-test/tc-fixtures; cp C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v422/nearcopy.cjs $W/.ledger/2026-10-18-fit-finder-fair-test/nearcopy.cjs; ls $W/.ledger/2026-10-18-fit-finder-fair-test | grep -c nearcopy.cjs'
```
Expected: `1`, exit 0.

- [ ] **Step 2: [IMPL] Write the fixtures and the test runner first.**
Fixtures in `L/tc-fixtures/` (create each with exactly this content):
- `added-ok.txt`: `      "match": "(?i)\\b(tidy|polish|rephrase)\\b.{0,20}\\b(email|memo)\\b"`
- `added-require.txt`: `const fs = require('fs');`
- `added-id.txt`: `if (id === 'N12') return [];`
- `added-copy.txt`: `      "match": "(?i)alpha\\s+beta\\s+gamma|delta"` (a 4-word run hidden by regex syntax, every alternative 3 words or fewer)
- `added-long.txt`: `      "match": "(?i)(one two three four five)"` (one 5-word alternative, no copy)
- `prompts.jsonl`: `{"id":"T1","task":"Please alpha beta gamma delta now"}`
- `transcript-bad.jsonl` (two lines): `{"type":"user","message":{"content":"look in workiva-sealed"}}` then `{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","input":{"file_path":"C:\\Users\\teasp\\Documents\\workiva-sealed\\x\\prompts.jsonl"}}]}}`
- `transcript-ok.jsonl` (two lines): `{"type":"user","message":{"content":"never open workiva-sealed"}}` then `{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"ls fit-finder/engine"}}]}}`
- `transcript-empty.jsonl` (one line): `{"type":"user","message":{"content":"hello"}}`

`L/tc-test.sh`:
```bash
#!/usr/bin/env bash
# Prints "tune-checks tests: P of 12" and exits 0 only if all 12 hold.
cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test || exit 3
L=.ledger/2026-10-18-fit-finder-fair-test; F=$L/tc-fixtures; T="node $L/tune-checks.cjs"
p=0; n=0
t() { want="$1"; shift; n=$((n+1)); out=$("$@" 2>&1); code=$?; if [ "$code" -eq "$want" ]; then p=$((p+1)); else echo "FAIL (exit $code, want $want): $* :: $out"; fi; }
t 0 $T purity --added $F/added-ok.txt
t 1 $T purity --added $F/added-require.txt
t 1 $T purity --added $F/added-id.txt
t 0 $T memo --added $F/added-ok.txt --prompts $F/prompts.jsonl
t 1 $T memo --added $F/added-copy.txt --prompts $F/prompts.jsonl
t 1 $T memo --added $F/added-long.txt --prompts $F/prompts.jsonl
t 1 $T audit $F/transcript-bad.jsonl
t 0 $T audit $F/transcript-ok.jsonl
t 2 $T audit $F/transcript-empty.jsonl
t 2 $T purity
t 2 $T nonsense
t 0 node $L/numbers.cjs $F/scoreline.txt
echo "tune-checks tests: $p of $n"
[ "$p" -eq "$n" ]
```
and `L/tc-fixtures/scoreline.txt`: `first card right: 15 of 23 that fit; wrong card 5 (G2,G14,G15,G22,X1); no card where one fits 3 (A,B,C); card on a not-a-fit prompt 1 (G5); fit agreement 12 of 29; score 15`.
Also assert in the output of the memo-copy case, by eye in step 3, that `near-copy hits 1; long alternatives 0` and for the long case `near-copy hits 0; long alternatives 1` (the runner only checks exit codes; step 5 prints these two lines).

- [ ] **Step 3: [CHECK] Red proof (the scripts do not exist yet).**
```bash
bash -c 'set -o pipefail; bash C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-18-fit-finder-fair-test/tc-test.sh | tail -1; echo "exit $?"'
```
Expected: `tune-checks tests: 0 of 12` (or a count below 12), `exit 1`. This is the failing state.

- [ ] **Step 4: [IMPL] Write `L/tune-checks.cjs` and `L/numbers.cjs`.**
`L/tune-checks.cjs`:
```js
// node tune-checks.cjs purity (--base <sha> | --added <file>)
// node tune-checks.cjs memo   (--base <sha> | --added <file>) --prompts <jsonl>
// node tune-checks.cjs audit  <transcript.jsonl>
// Exit 0 clean, 1 hits, 2 usage or bad input. Prints counts only, never the matched text.
const fs = require('fs'), { spawnSync } = require('child_process');
const [cmd, ...a] = process.argv.slice(2);
const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const die = (m) => { console.error('tune-checks: ' + m); process.exit(2); };
const readLines = (f) => { try { return fs.readFileSync(f, 'utf8').split('\n'); } catch (e) { return die('cannot read ' + f); } };
// the diff's added and removed lines; --added/--removed files stand in for git in the fixtures
const diffLines = () => {
  if (opt('--added')) return { add: readLines(opt('--added')).filter(Boolean), del: opt('--removed') ? readLines(opt('--removed')).filter(Boolean) : [] };
  const base = opt('--base'); if (!base) die('need --base or --added');
  const g = spawnSync('git', ['diff', '-U0', base + '..HEAD', '--', 'fit-finder/engine', 'fit-finder/data/catalogue.json'], { encoding: 'utf8' });
  if (g.status !== 0) die('git diff failed');
  const ls = g.stdout.split('\n');
  return { add: ls.filter((l) => /^\+[^+]/.test(l)).map((l) => l.slice(1)), del: ls.filter((l) => /^-[^-]/.test(l)).map((l) => l.slice(1)) };
};
const added = () => diffLines().add;
// words with regex syntax turned into spaces: group openers (?: (?= (?! (?<= (?<! and flags (?i), quantifiers {0,20},
// escapes \s \b \w, then every non letter/digit. Tested 2026-10-18 by the talk lead (memo-test: 6 of 6 cases).
const words = (s) => s.toLowerCase()
  .replace(/\(\?(?:<?[=!]|:|[a-z]+\))/g, ' ')
  .replace(/\{\d*,?\d*\}/g, ' ')
  .replace(/\\./g, ' ')
  .replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
// the quoted strings (JSON-decoded) and regex literals on a line
const chunks = (l) => {
  const out = []; let m;
  const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|\/((?:[^\/\\\n]|\\.)+)\/[a-z]*/g;
  while ((m = re.exec(l))) {
    let s = m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3];
    if (m[1] !== undefined) { try { s = JSON.parse('"' + m[1] + '"'); } catch (e) { /* keep raw */ } }
    out.push(s);
  }
  return out;
};
if (cmd === 'purity') {
  // code forms only, so match words such as "processing", "import" or "fetch" stay allowed
  // tested 2026-10-18 by the talk lead: 9 of 9 code lines caught, 4 of 4 match strings passed (before the clock/URL forms were added)
  const re = /\brequire\s*\((?!\?)|\bprocess\.|\bargv\b|\bfs\.|\breadFile|^\s*import\b|\bimport\s*\((?!\?)|\bfetch\s*\((?!\?)|XMLHttpRequest|localStorage|sessionStorage|indexedDB|\bDate\b|performance\.now|https?:\/\/|\bN[0-9]+\b/;
  const hits = added().filter((l) => re.test(l)).length;
  console.log('purity hits ' + hits);
  process.exit(hits ? 1 : 0);
} else if (cmd === 'memo') {
  const pf = opt('--prompts'); if (!pf) die('need --prompts');
  const N = 4, gram = (w) => { const g = []; for (let i = 0; i + N <= w.length; i++) g.push(w.slice(i, i + N).join(' ')); return g; };
  const ref = new Set();
  for (const l of readLines(pf).filter((x) => x.trim())) { let r; try { r = JSON.parse(l); } catch (e) { die('bad prompts row'); } gram(words(r.task || '')).forEach((g) => ref.add(g)); }
  if (!ref.size) die('no reference grams');
  // only what the edit adds counts: grams and alternatives already on the removed lines are not new
  const { add, del } = diffLines(), oldG = new Set(), oldAlt = new Set();
  for (const l of del) {
    const cs = chunks(l);
    gram(words(cs.join(' '))).forEach((g) => oldG.add(g));
    cs.forEach((c) => c.split('|').forEach((x) => oldAlt.add(words(x).join(' '))));
  }
  let hits = 0, longAlt = 0;
  for (const l of add) {
    const cs = chunks(l);
    if (gram(words(cs.join(' '))).some((g) => !oldG.has(g) && ref.has(g))) hits++;
    for (const c of cs) for (const x of c.split('|')) { const w = words(x); if (w.length > 3 && !oldAlt.has(w.join(' '))) longAlt++; }
  }
  console.log(`near-copy hits ${hits}; long alternatives ${longAlt}`);
  process.exit(hits || longAlt ? 1 : 0);
} else if (cmd === 'audit') {
  const f = a[0]; if (!f) die('need a transcript path');
  const needles = ['workiva-sealed', '2026-10-18-fit-finder-fair-test/new'];
  // tool calls and their results (a listing or search that surfaces the folder counts too); the dispatch text is never a tool_use
  let scanned = 0, results = 0, hits = 0;
  const has = (v) => needles.some((n) => JSON.stringify(v).replace(/\\\\/g, '/').toLowerCase().includes(n));
  const walk = (o) => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o && typeof o === 'object') {
      if (o.type === 'tool_use' && o.input !== undefined) { scanned++; if (has(o.input)) hits++; return; }
      if (o.type === 'tool_result') { results++; if (has(o.content)) hits++; return; }
      Object.values(o).forEach(walk);
    }
  };
  for (const l of readLines(f)) { if (!l.trim()) continue; try { walk(JSON.parse(l)); } catch (e) { /* skip a non-JSON line */ } }
  console.log(`tool_use inputs scanned ${scanned}; tool results ${results}; forbidden hits ${hits}`);
  process.exit(scanned === 0 ? 2 : hits ? 1 : 0);
} else die('unknown command (purity | memo | audit)');
```
`L/numbers.cjs`:
```js
// node numbers.cjs <file holding one synth-score line>
const fs = require('fs');
const l = fs.readFileSync(process.argv[2], 'utf8');
const g = (re) => { const m = re.exec(l); if (!m) { console.error('numbers: no match ' + re); process.exit(2); } return +m[1]; };
const R = g(/first card right: (\d+) of/), F = g(/of (\d+) that fit/), W = g(/wrong card (\d+)/), M = g(/no card where one fits (\d+)/);
const K = g(/card on a not-a-fit prompt (\d+)/), A = g(/fit agreement (\d+) of/), S = g(/score (\d+)/);
const bar = Math.floor(3 * F / 23);
console.log(`R=${R} F=${F} W=${W} M=${M} K=${K} agree=${A} score=${S} bar=${bar} wrong_within_bar=${W <= bar ? 'yes' : 'no'}`);
```

- [ ] **Step 5: [CHECK] Green, and the two single-cause lines.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; L=.ledger/2026-10-18-fit-finder-fair-test; bash $L/tc-test.sh | tail -1; node $L/tune-checks.cjs memo --added $L/tc-fixtures/added-copy.txt --prompts $L/tc-fixtures/prompts.jsonl; node $L/tune-checks.cjs memo --added $L/tc-fixtures/added-long.txt --prompts $L/tc-fixtures/prompts.jsonl; node $L/numbers.cjs $L/tc-fixtures/scoreline.txt'
```
Expected: `tune-checks tests: 12 of 12`, then `near-copy hits 1; long alternatives 0`, then `near-copy hits 0; long alternatives 1`, then `R=15 F=23 W=5 M=3 K=1 agree=12 score=15 bar=3 wrong_within_bar=no`. The two memo lines each exit 1, so the whole command ends with exit 1 by design: the checker reports the printed lines, not the final exit. (If the lead wants an exit-0 line, run the three commands separately and expect exits 0, 1, 1 and 0.)

- [ ] **Step 6: [CHECK] Nothing tracked changed.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git status --short | grep -v "^??" | wc -l; echo "exit $?"'
```
Expected: `0`, `exit 0`.

---

### Task 4: Write and dedupe the 104 prompts (writer: Opus helper, fresh context; dedupe by Sonnet implementer)

**Files:**
- Create (ledger only): `L/writer-brief.md`, `L/new/raw.jsonl` (writer), `L/new/prompts.jsonl`, `L/new/dropped.txt`, `L/dedupe.cjs`, `L/built-on.cjs`, `L/shape.cjs`, `L/dedupe-ref/` (temporary; deleted in step 7)
- Locked: all repo files (this task changes none).

**Interfaces:**
- Produces: `L/new/prompts.jsonl` with at least 100 rows `{"id":"N<k>","task":"..."}`, ids keep their original numbers (no renumbering); `L/new/dropped.txt` lists dropped ids and why. `L/dedupe-ref/` is absent when the task ends.

```rehearse
mkdir -p .ledger/2026-10-18-fit-finder-fair-test/dedupe-ref
touch .ledger/2026-10-18-fit-finder-fair-test/dedupe-ref/tasks.jsonl
rm -rf .ledger/2026-10-18-fit-finder-fair-test/dedupe-ref
```

- [ ] **Step 1: [IMPL] Build the writer's one input file `L/writer-brief.md`** (the writer reads only this file; it names no card, match word, engine file or real prompt).
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; L=$W/.ledger/2026-10-18-fit-finder-fair-test; mkdir -p $L/new; { cat <<"EOF"
# Writer brief
Read only this file. Do not open any other file on this machine except to write your output file.
You are writing realistic customer prompts for a test set.

## Who the customer is
EOF
sed -n "3,7p" $W/fit-finder/data/LABELING.md
cat <<"EOF"

## What to write
Exactly 104 prompts, ids N1 to N104. Target mix by the kind of ask: about a third general writing help (reword, email, memo, summarise a file, a formula); about a fifth financial reporting; about a tenth sustainability; about a tenth GRC or audit; the rest no card or not a fit (system actions, approvals, exact calculation, personal or product questions).

## Style
One or two sentences in the voice of the customer, typed into an AI assistant box. Lengths from a few words to one long paragraph (about 400 words at most once); median near 30 words. Mixed polish: some terse, some chatty, a few with a typo. No numbering, no labels, no quoting a tool name unless a customer would.

## Output
Write exactly 104 lines of JSONL, one per prompt, like {"id":"N1","task":"..."} through N104, to this file: C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-18-fit-finder-fair-test/new/raw.jsonl
No commentary file. Tool-call cap 25. Reply in at most 5 lines.
EOF
} > $L/writer-brief.md; wc -l $L/writer-brief.md'
```
Expected: a line count of about 20, exit 0.

- [ ] **Step 2: [LEAD] Dispatch the writer.** The dispatch's first line is `MODEL OVERRIDE: written data, quality decides`; model Opus, fresh context; the rest of the dispatch is one sentence: "Read `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-18-fit-finder-fair-test/writer-brief.md` and do what it says." Paths only; the lead never prints the output.

- [ ] **Step 3: [IMPL] Build the reference folder for the copy check** (copies only; originals untouched; nothing printed), including the strings the rules were built on (card `task`, `try` and `prompt` text and every 5-word-or-longer string literal in `catalogue.test.js`).
`L/built-on.cjs`:
```js
// node built-on.cjs <fit-finder root> <out.jsonl>
const fs = require('fs'), [root, out] = process.argv.slice(2);
const cat = JSON.parse(fs.readFileSync(root + '/data/catalogue.json', 'utf8'));
const rows = [];
for (const u of cat.useCases) for (const k of ['task', 'try', 'prompt']) for (const s of [].concat(u[k] || [])) if (typeof s === 'string') rows.push({ task: s });
const t = fs.readFileSync(root + '/tests/catalogue.test.js', 'utf8');
for (const m of t.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
  const s = m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3];
  if (s.split(/\s+/).length >= 5) rows.push({ task: s });
}
fs.writeFileSync(out, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
console.log('built-on rows', rows.length);
```
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; L=$W/.ledger/2026-10-18-fit-finder-fair-test; R=$L/dedupe-ref; rm -rf $R; mkdir -p $R; cp $W/fit-finder/data/real/*.jsonl $R/; cp $W/fit-finder/data/tasks.jsonl $R/tasks.jsonl; cp $W/fit-finder/tests/rewrite-pool.jsonl $R/rewrite-pool.jsonl; node $L/built-on.cjs $W/fit-finder $R/built-on.jsonl; ls $R | wc -l'
```
Expected: `built-on rows N` (N above 100) and `5` (two real files, tasks, pool, built-on). Do not print the real files.

- [ ] **Step 4: [IMPL] Write `L/dedupe.cjs` and `L/shape.cjs`.**
`L/dedupe.cjs` (keeps the first of any two rows sharing a 5-word run; drops a row that shares a run with any reference row; the same word rule as nearcopy):
```js
// node dedupe.cjs <refdir> <raw.jsonl> <out.jsonl> <dropped.txt>
const fs = require('fs'), path = require('path');
const N = 5, [refDir, rawF, outF, dropF] = process.argv.slice(2);
const words = (s) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
const grams = (w) => { const g = []; for (let i = 0; i + N <= w.length; i++) g.push(w.slice(i, i + N).join(' ')); return g; };
const ref = new Set();
for (const f of fs.readdirSync(refDir).filter((f) => f.endsWith('.jsonl')))
  for (const l of fs.readFileSync(path.join(refDir, f), 'utf8').split('\n')) {
    if (!l.trim()) continue; let r; try { r = JSON.parse(l); } catch (e) { continue; }
    grams(words(r.task || r.text || '')).forEach((g) => ref.add(g));
  }
const seen = new Set(), keep = [], drop = [];
for (const l of fs.readFileSync(rawF, 'utf8').split('\n').filter((x) => x.trim())) {
  const r = JSON.parse(l), g = grams(words(r.task));
  if (g.some((x) => ref.has(x))) { drop.push(r.id + ' reference'); continue; }
  if (g.some((x) => seen.has(x))) { drop.push(r.id + ' duplicate'); continue; }
  g.forEach((x) => seen.add(x)); keep.push(l);
}
fs.writeFileSync(outF, keep.join('\n') + '\n'); fs.writeFileSync(dropF, drop.join('\n') + '\n');
console.log('reference grams', ref.size, 'rows in', keep.length + drop.length, 'kept', keep.length, 'dropped', drop.length);
```
`L/shape.cjs`:
```js
// node shape.cjs <prompts.jsonl>  exit 1 if ids are not unique
const fs = require('fs');
const rows = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const w = rows.map((r) => r.task.trim().split(/\s+/).length).sort((x, y) => x - y);
const u = new Set(rows.map((r) => r.id)).size;
console.log(`rows ${rows.length}; unique ids ${u}; words min ${w[0]} median ${w[Math.floor((w.length - 1) / 2)]} max ${w[w.length - 1]}`);
process.exit(u === rows.length ? 0 : 1);
```

- [ ] **Step 5: [IMPL] Run the dedupe, then verify with nearcopy.**
```bash
bash -c 'set -e -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-18-fit-finder-fair-test; node dedupe.cjs dedupe-ref new/raw.jsonl new/prompts.jsonl new/dropped.txt; N=5 node nearcopy.cjs dedupe-ref new/prompts.jsonl | tail -1; wc -l new/raw.jsonl new/prompts.jsonl | tail -3'
```
Expected: `rows in 104`, `kept K dropped D` with K + D = 104; nearcopy last line `... lines with a shared run of 5 words: 0`; `reference grams` clearly above 1000 (near 0 means the reference folder is wrong); exit 0. Stop and report to the lead if K < 100 (a replacement batch is the lead's call; do not rewrite dropped rows).

- [ ] **Step 6: [CHECK] Shape.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-18-fit-finder-fair-test; node shape.cjs new/prompts.jsonl; echo "exit $?"'
```
Expected: `rows K; unique ids K; words min .. median 20-45 .. max ..`, `exit 0`.

- [ ] **Step 7: [IMPL] Delete the reference copies (they hold customer files), then check.**
```bash
bash -c 'set -e -o pipefail; rm -rf C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-18-fit-finder-fair-test/dedupe-ref'
```
```bash
bash -c 'set -o pipefail; test ! -e C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-18-fit-finder-fair-test/dedupe-ref && echo ABSENT; echo "exit $?"'
```
Expected (the second line is the checker's): `ABSENT`, `exit 0`.

- [ ] **Step 8: [IMPL] Record** in `L/progress.md`: writer model/effort, tool calls used, D dropped, the dropped ids, K kept, the median word count.

---

### Task 5: Blind labels (labeller: a different Opus helper, fresh context)

**Files:**
- Create (ledger only): `L/make-label-input.cjs`, `L/validate-gold.cjs`, `L/new/label-input.md`, `L/new/gold.jsonl` (labeller)
- Locked: all repo files.

**Interfaces:**
- Consumes: `L/new/prompts.jsonl`.
- Produces: `L/new/gold.jsonl`, exactly one row per prompt id. The lead never prints `label-input.md` or any prompt text.

- [ ] **Step 1: [IMPL] Write and run `L/make-label-input.cjs`** (the labeller's one input file: the full labelling guide, the 26 cards as `id :: task` with no match words, the card rule, the prompts, the output instructions).
```js
// node make-label-input.cjs <fit-finder root> <ledger dir>
const fs = require('fs'), [root, led] = process.argv.slice(2);
const cat = JSON.parse(fs.readFileSync(root + '/data/catalogue.json', 'utf8'));
const out = [
  '# Labeller brief', 'Read only this file. Do not run any engine, and do not open any other file except to write your output file.', '',
  '## Labelling guide', fs.readFileSync(root + '/data/LABELING.md', 'utf8'), '',
  '## Cards (id :: task)', ...cat.useCases.map((u) => u.id + ' :: ' + u.task), '',
  '## Card rule', 'Give a fit (good, partial or not) and every card right to show, in no order. A not-a-fit row has no cards.', '',
  '## Output', 'One JSONL row per prompt below, same id, to ' + led + '/new/gold.jsonl : {"id","fit":"good|partial|not","cards":[card ids],"by":"model","conf":"high|low"}. conf is low when you are unsure. Tool-call cap 25. Reply in at most 5 lines.', '',
  '## Prompts', fs.readFileSync(led + '/new/prompts.jsonl', 'utf8'),
].join('\n');
fs.writeFileSync(led + '/new/label-input.md', out);
console.log('label-input lines', out.split('\n').length);
```
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; node $W/.ledger/2026-10-18-fit-finder-fair-test/make-label-input.cjs $W/fit-finder $W/.ledger/2026-10-18-fit-finder-fair-test'
```
Expected: `label-input lines N` (N a few hundred), exit 0.

- [ ] **Step 2: [LEAD] Dispatch the labeller.** Opus, fresh context, not the writer. The dispatch is one sentence: "Read `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/.ledger/2026-10-18-fit-finder-fair-test/new/label-input.md` and do what it says." Paths only. It must not be given the engine, any engine output, the match words, the writer's notes, `fit-finder/data/real/` or the other gold files.

- [ ] **Step 3: [IMPL] Write `L/validate-gold.cjs`.**
```js
// node validate-gold.cjs <dir holding prompts.jsonl and gold.jsonl> <catalogue.json>   exit 0 only if every defect count is 0
const fs = require('fs'), [dir, catFile] = process.argv.slice(2);
const load = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } });
const P = load(dir + '/prompts.jsonl'), G = load(dir + '/gold.jsonl');
const cards = new Set(JSON.parse(fs.readFileSync(catFile, 'utf8')).useCases.map((u) => u.id));
const GG = G.filter(Boolean), PP = P.filter(Boolean);
const ps = new Set(PP.map((r) => r.id)), gs = new Set(GG.map((r) => r.id));
const only = (a, b) => [...a].filter((x) => !b.has(x)).length;
const d = {
  unparsable: P.length - PP.length + G.length - GG.length,
  dupPrompt: PP.length - ps.size, dupGold: GG.length - gs.size,
  idsOnlyInPrompts: only(ps, gs), idsOnlyInGold: only(gs, ps),
  badFit: GG.filter((g) => !['good', 'partial', 'not'].includes(g.fit)).length,
  notWithCards: GG.filter((g) => g.fit === 'not' && (g.cards || []).length).length,
  badByConf: GG.filter((g) => g.by !== 'model' || !['high', 'low'].includes(g.conf)).length,
  unknownCards: GG.filter((g) => !Array.isArray(g.cards) || g.cards.some((c) => !cards.has(c))).length,
};
const c = (f) => GG.filter((g) => g.fit === f).length, low = GG.filter((g) => g.conf === 'low').length;
console.log(`prompts ${P.length}; gold rows ${G.length}; ` + Object.entries(d).map(([k, v]) => `${k} ${v}`).join('; ') + `; fit good ${c('good')} partial ${c('partial')} not ${c('not')}; F ${c('good') + c('partial')}; conf low ${low}`);
process.exit(Object.values(d).some((v) => v) || !P.length || P.length !== G.length ? 1 : 0);
```

- [ ] **Step 4: [CHECK] Validate (no engine run).**
```bash
bash -c 'set -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; node $W/.ledger/2026-10-18-fit-finder-fair-test/validate-gold.cjs $W/.ledger/2026-10-18-fit-finder-fair-test/new $W/fit-finder/data/catalogue.json; echo "exit $?"'
```
Expected: `prompts K; gold rows K;` every defect count `0`, then the fit mix, `F`, `conf low`; `exit 0`. Any failure goes back to the labeller once (not the writer).

- [ ] **Step 5: [IMPL] Record in `L/progress.md`:** the printed line, helper tool calls used. Do not run the engine on any new row yet.

---

### Task 6: Split, seal, hash, score the tuning half once, commit (Sonnet implementer; checker Sonnet)

**Files:**
- Create (ledger): `L/split.cjs`, `L/verify-sealed.cjs`
- Create (sealed, outside the worktree): `S/holdout/prompts.jsonl`, `S/holdout/gold.jsonl`, `S/new/` (the whole unsplit batch moved from `L/new/`)
- Create (repo, committed): `fit-finder/data/synth/2026-10-18-tune.jsonl`, `fit-finder/data/card-gold-synth-tune.jsonl`, `fit-finder/data/synth/2026-10-18-holdout.sha256`
- Locked: engine, catalogue, tests, all other data.

**Interfaces:**
- Consumes: `L/new/prompts.jsonl`, `L/new/gold.jsonl` (validated).
- Produces: the tuning files (committed), the sealed folder, the sha256 lines in `progress.md` and in the committed `.sha256` file, `BASE` = this task's commit sha (record it in `progress.md`), the pre-tune tuning-half line in `progress.md`.

```rehearse
mkdir -p fit-finder/data/synth
mkdir -p C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test/holdout
mkdir -p .ledger/2026-10-18-fit-finder-fair-test/new
touch .ledger/2026-10-18-fit-finder-fair-test/new/prompts.jsonl
mv .ledger/2026-10-18-fit-finder-fair-test/new C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test/new
: > fit-finder/data/synth/2026-10-18-tune.jsonl
: > fit-finder/data/card-gold-synth-tune.jsonl
: > fit-finder/data/synth/2026-10-18-holdout.sha256
```

- [ ] **Step 1: [IMPL] Write `L/split.cjs`** (throws on a missing or duplicate gold row; never writes the text `undefined`).
```js
// node split.cjs <prompts> <gold> <tunePrompts> <tuneGold> <holdPrompts> <holdGold>
const fs = require('fs');
const [pf, gf, tp, tg, hp, hg] = process.argv.slice(2);
const load = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim());
const P = load(pf), G = {};
for (const l of load(gf)) { const id = JSON.parse(l).id; if (G[id]) throw new Error('duplicate gold id ' + id); G[id] = l; }
const ids = P.map((l) => JSON.parse(l).id);
for (const id of ids) if (!G[id]) throw new Error('no gold row for ' + id);
if (new Set(ids).size !== ids.length || Object.keys(G).length !== ids.length) throw new Error('id sets differ');
let s = 20261018; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
const sh = [...ids]; for (let i = sh.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [sh[i], sh[j]] = [sh[j], sh[i]]; }
const cut = Math.floor(sh.length / 2), tune = new Set(sh.slice(0, cut));
const pick = (inSet) => P.filter((l) => tune.has(JSON.parse(l).id) === inSet);
const out = (f, rows) => fs.writeFileSync(f, rows.join('\n') + '\n');
out(tp, pick(true)); out(hp, pick(false));
out(tg, pick(true).map((l) => G[JSON.parse(l).id])); out(hg, pick(false).map((l) => G[JSON.parse(l).id]));
console.log('n', ids.length, 'tune', cut, 'untouched', ids.length - cut);
```

- [ ] **Step 2: [IMPL] Run it; the untouched half is written straight into the sealed folder.**
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; L=$W/.ledger/2026-10-18-fit-finder-fair-test; S=C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test; mkdir -p $S/holdout $W/fit-finder/data/synth; node $L/split.cjs $L/new/prompts.jsonl $L/new/gold.jsonl $W/fit-finder/data/synth/2026-10-18-tune.jsonl $W/fit-finder/data/card-gold-synth-tune.jsonl $S/holdout/prompts.jsonl $S/holdout/gold.jsonl; wc -l $W/fit-finder/data/synth/2026-10-18-tune.jsonl $W/fit-finder/data/card-gold-synth-tune.jsonl $S/holdout/prompts.jsonl $S/holdout/gold.jsonl | tail -5'
```
Expected: `n K tune floor(K/2) untouched K-floor(K/2)` (K = 104 gives 52 and 52); the four line counts agree pairwise (tune prompts = tune gold; untouched prompts = untouched gold), exit 0.

- [ ] **Step 3: [IMPL] Move the unsplit batch into the sealed folder.** Nothing with an untouched row may stay behind (`L/new/` holds raw, prompts, gold, dropped.txt and label-input.md).
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; S=C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test; mv $W/.ledger/2026-10-18-fit-finder-fair-test/new $S/new; ls $S/new | wc -l; test ! -e $W/.ledger/2026-10-18-fit-finder-fair-test/new && echo MOVED'
```
Expected: a file count of 5, `MOVED`, exit 0.

- [ ] **Step 4: [IMPL] Write `L/verify-sealed.cjs`, then [CHECK] run it.**
```js
// node verify-sealed.cjs <rows file>... [--expect-found]
// Counts the rows (lines) of the given files that appear verbatim in any file under the worktree (not .git, not data/real). Prints counts only.
// Without --expect-found: exit 1 if any row is found. With it (positive control): exit 1 unless every row is found.
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), expectFound = args.includes('--expect-found'), files = args.filter((x) => !x.startsWith('--'));
const WT = 'C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test';
const rows = files.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean));
const found = new Set();
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(d, e.name).replace(/\\/g, '/');
    if (p.endsWith('fit-finder/data/real')) continue;
    if (e.isDirectory()) { walk(p); continue; }
    let t; try { if (fs.statSync(p).size > 20e6) continue; t = fs.readFileSync(p, 'utf8'); } catch (err) { continue; }
    for (const r of rows) if (t.includes(r)) found.add(r);
  }
};
walk(WT);
console.log(`rows checked ${rows.length}; found in worktree files ${found.size}`);
process.exit(expectFound ? (found.size === rows.length ? 0 : 1) : (found.size ? 1 : 0));
```
```bash
bash -c 'set -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; S=C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test; node $W/.ledger/2026-10-18-fit-finder-fair-test/verify-sealed.cjs $S/holdout/prompts.jsonl $S/holdout/gold.jsonl; echo "exit $?"; node $W/.ledger/2026-10-18-fit-finder-fair-test/verify-sealed.cjs --expect-found $W/fit-finder/data/synth/2026-10-18-tune.jsonl; echo "exit $?"'
```
Expected: first `rows checked N; found in worktree files 0`, `exit 0`; second (the positive control: the tuning prompts are in the worktree, so the scan must find them) `rows checked M; found in worktree files M`, `exit 0`. A first line with a nonzero found count stops the run.

- [ ] **Step 5: [IMPL] Hash the untouched files and record the hashes in two places.**
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; S=C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test; cd $S/holdout; sha256sum prompts.jsonl gold.jsonl > $W/fit-finder/data/synth/2026-10-18-holdout.sha256; { echo; echo "## Untouched half sha256 (recorded at the split; sealed folder: $S)"; cat $W/fit-finder/data/synth/2026-10-18-holdout.sha256; } >> $W/.ledger/2026-10-18-fit-finder-fair-test/progress.md; cat $W/fit-finder/data/synth/2026-10-18-holdout.sha256 | wc -l'
```
Expected: `2`, exit 0; `progress.md` ends with the heading and two `<64 hex>  prompts.jsonl|gold.jsonl` lines. (Hashes reveal nothing about the rows, so the `.sha256` file is committed in step 7 as tamper evidence outside the ledger.)

- [ ] **Step 6: [IMPL] Score the tuning half once, pre-tune (never the untouched half), and record.**
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; L=$W/.ledger/2026-10-18-fit-finder-fair-test; cd $W/fit-finder; node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl > $L/tune-pre.txt; cat $L/tune-pre.txt; node $L/numbers.cjs $L/tune-pre.txt; { echo; echo "## Tuning half, pre-tune"; cat $L/tune-pre.txt; node $L/numbers.cjs $L/tune-pre.txt; } >> $L/progress.md'
```
Expected: one score line, then `R=.. F=.. ... bar=..`; `progress.md` gains both. Record `R_pre` (= R), `F_tune` (= F) and the target `bar` there. The spec's prediction for this line: right 40-65% of fits, wrong 10-25% of fits.

- [ ] **Step 7: [IMPL] Suite green with the new files in place; commit; record BASE.**
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; cd $W/fit-finder; node tests/catalogue.test.js | tail -1; cd $W; git add fit-finder/data/synth/2026-10-18-tune.jsonl fit-finder/data/card-gold-synth-tune.jsonl fit-finder/data/synth/2026-10-18-holdout.sha256; git commit -m "Fit Finder fair test: tuning half of the new set (model-written, model-labelled), split seed 20261018; untouched-half sha256" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01H2qm8GtpiHC26XLfs5izTu"; git rev-parse HEAD'
```
Expected: `all catalogue checks pass`, then a commit sha. Write the sha into `progress.md` as `BASE` (full 40 characters).

- [ ] **Step 8: [CHECK] Commit scope and the sealed boundary (counts only; the checker never prints a row).**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git diff --name-only HEAD~1..HEAD; git ls-files | grep -c holdout; echo "exit $?"'
```
Expected: exactly the three committed paths from step 7, then `1` (only the `.sha256` file has `holdout` in its name), `exit 0`. Re-run the first command of step 4 once more: found `0`.

---

### Task 7: Tuning (tune-loop; Sonnet helper; checker: fresh Sonnet) [TUNE]

**Files:**
- Edit (only these, on the tune branch): `fit-finder/engine/fit.js`, the `match` fields of `fit-finder/data/catalogue.json`
- Ledger: `L/tune/results.tsv`, `L/tune/*.log`
- Locked: see the TUNE BRIEF; nothing else changes.

**Interfaces:**
- Consumes: Task 6 commit as `BASE`; `R_pre`, `F_tune`, `bar` from `progress.md`; `tests/synth-score.js`, `tests/fair-guard.js`.
- Produces: zero or more kept commits on branch `fit-finder-fair-test-tune`; `results.tsv`; a final HEAD equal to the last keep.

```rehearse
touch fit-finder/data/catalogue.json
touch fit-finder/engine/fit.js
```

The tune dispatch is the brief below plus the rules below and nothing else. It never names the sealed path, the word "sealed", "holdout", the spec, the plan or any ledger folder but `tune/`. The lead substitutes literal values for every `<...>` from `progress.md` before dispatching; a dispatch that still holds an angle-bracket placeholder is a stop.

```
TUNE BRIEF
number:        `score` (the last field of the check line) on the tuning file; lower is better. S = 2*wrong card + no card where one fits + 2*card on a not-a-fit prompt. KEEP an attempt only if its score is strictly lower than the best kept score AND its "first card right: R" is at least <R_PRE> (the pre-tune value). Otherwise discard.
check:         bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder && node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl'   (prints one line ending "score S"; deterministic, so the 5-run pre-check should give 5 equal values). It has no deadline of its own: run it under `timeout --kill-after=10 <seconds left in this attempt>`.
guard:         bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder && node tests/fair-guard.js --base <BASE>'   (must print "fair-guard PASS", exit 0). No deadline of its own either: same `timeout --kill-after=10` wrapper.
editable:      fit-finder/engine/fit.js ; the "match" fields of fit-finder/data/catalogue.json (no other field, no new card)
locked:        fit-finder/tests/ (every file), every fit-finder/data/*.jsonl, fit-finder/data/synth/, fit-finder/data/real/, fit-finder/data/LABELING.md, fit-finder/dist/, fit-finder/web/, fit-finder/README.md. Under .ledger/ open nothing except .ledger/2026-10-18-fit-finder-fair-test/tune/ (write results.tsv and logs there).
attempts:      12
per-attempt:   10 minutes
cost cap:      12 attempts, 10 minutes each, 3 hours total wall time, 90 helper tool uses (tokens recorded, not a cap)
target:        tuning-file wrong card at most <BAR> AND first card right at least <R_PRE>; stop early when both hold
visual:        no
```

Extra rules for the helper (in the dispatch, beyond the brief):
```
RULES
1. Work only on branch fit-finder-fair-test-tune (already checked out). Commit each attempt before running the guard and the check. End every commit message with these two lines: "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" and "Claude-Session: https://claude.ai/code/session_01H2qm8GtpiHC26XLfs5izTu".
2. A task-boundary hook note fires after every attempt commit and asks you to finish and report. For this task the whole loop is one task: carry on until a tune-loop stop rule (target met, 12 attempts, 3 hours, 90 tool uses, or two strikes), then report.
3. A kept rule is a general word or phrase, never text copied from a tuning prompt. No added alternative (text between | characters) longer than 3 words. Do not write a run of 4 or more words that appears in a tuning prompt, even with regex pieces such as \s+ between the words.
4. fit.js stays pure: no require(, process., argv, fs., readFile, import statement or import(, fetch(, browser storage, no URL, no clock (Date, performance.now), no id such as N12. The checker greps your ADDED lines for those code forms and a hit discards the commit. Match words such as "processing" or "imported" are fine; never write a token like N followed by digits.
5. Do not open fit-finder/data/real/. Do not look for, list or open any folder other than the repository files you edit, the tuning file pair named in the brief, and .ledger/2026-10-18-fit-finder-fair-test/tune/. Do not guess other data files.
6. Results lines go to .ledger/2026-10-18-fit-finder-fair-test/tune/results.tsv: commit<TAB>score<TAB>status<TAB>seconds<TAB>description. Report in at most 10 lines: baseline, best, kept/attempts, stop reason, kept commits, tool uses counted.
```

- [ ] **Step 1: [IMPL] Make the tune branch from `BASE` and check.**
```bash
bash -c 'set -e -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git switch -c fit-finder-fair-test-tune; mkdir -p .ledger/2026-10-18-fit-finder-fair-test/tune; git rev-parse HEAD; git rev-parse --abbrev-ref HEAD'
```
Expected: the `BASE` sha (equal to `progress.md`) and `fit-finder-fair-test-tune`, exit 0.

- [ ] **Step 2: [LEAD] Dispatch the Sonnet tune helper** under the `tune-loop` skill with the brief and the rules above, nothing else. Note the helper's agent id.

- [ ] **Step 3: [LEAD] Receive the helper's report** (at most 10 lines: baseline, best, kept/attempts, stop reason, kept commits, `results.tsv` path, tool uses counted). Do not read the helper's transcript text.

- [ ] **Step 4: [CHECK] Leak audit of the tool_use inputs (not the dispatch text).** The transcript is `~/.claude/projects/C--Users-teasp-Documents-workiva--claude-worktrees-fit-finder-fair-test/<session>/subagents/agent-<id>.jsonl` (path pattern measured by the plan review; the record shape is assumed and is confirmed by the scanned count below).
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; node .ledger/2026-10-18-fit-finder-fair-test/tune-checks.cjs audit "<transcript path>"; echo "exit $?"'
```
Expected: `tool_use inputs scanned N; tool results R; forbidden hits 0` with N above 0 (N = 0 exits 2 and means the path or record shape is wrong, not a pass), `exit 0`. Record the line in `progress.md`. A nonzero hit count stops the run and goes to Ian.

- [ ] **Step 5: [CHECK] Scope, purity and memorisation (counts only).**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git status --short | grep -v "^??" | wc -l; git diff --name-only <BASE>..HEAD; node .ledger/2026-10-18-fit-finder-fair-test/tune-checks.cjs purity --base <BASE>; echo "purity exit $?"; node .ledger/2026-10-18-fit-finder-fair-test/tune-checks.cjs memo --base <BASE> --prompts fit-finder/data/synth/2026-10-18-tune.jsonl; echo "memo exit $?"'
```
Expected: `0` (tree clean), the diff lists only `fit-finder/engine/fit.js` and/or `fit-finder/data/catalogue.json` (or nothing, if no attempt was kept), `purity hits 0` with `purity exit 0`, `near-copy hits 0; long alternatives 0` with `memo exit 0`. There is no waiver: a hit means the offending kept commit is dropped by the lead (revert it on the tune branch, then re-run steps 5 and 6). HEAD equals the last `keep` commit in `results.tsv`.

- [ ] **Step 6: [CHECK] Re-run `check` and `guard` on HEAD.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder; node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl; echo "check exit $?"; node tests/fair-guard.js --base <BASE>; echo "guard exit $?"'
```
Expected: a score equal to the last kept number in `results.tsv` with `first card right: R` where R is at least `R_pre`, `check exit 0`, `fair-guard PASS`, `guard exit 0`.

- [ ] **Step 7: [IMPL] Record in `progress.md`:** the post-tune tuning-half line (`node numbers.cjs` on a file holding it), whether the target was met, the audit line, the tool uses counted, and the kept commit subjects. If nothing was kept, say so; Task 8 then only switches back to the main branch (step 1) and is otherwise skipped.

---

### Task 8: Bring the kept diff onto the main branch as one commit with dist and README (Sonnet implementer; checker Sonnet). Skip steps 2-7 if Task 7 kept nothing.

**Files:**
- Modify: `fit-finder/engine/fit.js`, `fit-finder/data/catalogue.json` (copied from the tune branch), `fit-finder/dist/fit-finder.html` (written by `tests/build.js`), `fit-finder/README.md`
- Locked: tests, all other data.

```rehearse
touch fit-finder/data/catalogue.json
touch fit-finder/engine/fit.js
touch fit-finder/dist/fit-finder.html
```

- [ ] **Step 1: [IMPL] Switch back and take only the two kept files from the tune branch.**
```bash
bash -c 'set -e -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git switch fit-finder-fair-test; git checkout fit-finder-fair-test-tune -- fit-finder/engine/fit.js fit-finder/data/catalogue.json; git diff --cached --name-only'
```
Expected: the two paths (or only the ones the tune branch changed), exit 0.

- [ ] **Step 2: [CHECK] Guard and suite on this working tree.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder; node tests/fair-guard.js --base <BASE>; echo "guard exit $?"; node tests/catalogue.test.js | tail -1; echo "suite exit $?"'
```
Expected: `fair-guard PASS`, `guard exit 0`, `all catalogue checks pass`, `suite exit 0`.

- [ ] **Step 3: [IMPL] Build, then the page test with its captures inside the ledger (never Downloads).**
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; mkdir -p $W/.ledger/2026-10-18-fit-finder-fair-test/captures; cd $W/fit-finder; node tests/build.js; node tests/pagetest.js $W/.ledger/2026-10-18-fit-finder-fair-test/captures/ 2>&1 | tail -3'
```
Expected: the build line `dist/fit-finder.html NNN KB`; pagetest ends in a pass line with no `FAIL`; exit 0.

- [ ] **Step 4: [IMPL] Stage dist and read its LF byte count as it will be committed.**
```bash
bash -c 'set -e -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git add fit-finder/dist/fit-finder.html; git show :fit-finder/dist/fit-finder.html | wc -c'
```
Expected: one number, the dist LF byte count (not the Windows file size). Use it in the README.

- [ ] **Step 5: [IMPL] Update the README numbers** that the changes make wrong, using figures printed now (measured): the suite lines for B, A, real and fresh, eval A/B, the dist byte count from step 4, and a short "2026-10-18 fair test" note (set sizes, split seed, the kept rules in one line each; the untouched-half result goes into Task 9's commit). Find the lines with `grep -n "first card right\|bytes\|fit agreement" fit-finder/README.md`. Measure with:
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder; node tests/catalogue.test.js | grep "first card right"; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A | grep "^fit agreement"; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B | grep "^fit agreement"; echo "exit $?"'
```
Expected: four `first card right` lines at or inside the pins, `fit agreement 52/60` or more, `45/60` or more, `exit 0`.

- [ ] **Step 6: [IMPL] One commit: engine, catalogue, dist and README together.**
```bash
bash -c 'set -e; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git add fit-finder/engine/fit.js fit-finder/data/catalogue.json fit-finder/dist/fit-finder.html fit-finder/README.md; git commit -m "Fit Finder fair test: kept first-card rules, rebuilt dist, README numbers and dist byte count (live page not republished)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01H2qm8GtpiHC26XLfs5izTu"'
```

- [ ] **Step 7: [CHECK] The README byte count equals the committed blob; the commit holds only the four paths.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; N=$(git show HEAD:fit-finder/dist/fit-finder.html | wc -c); echo "dist bytes $N"; grep -c "$N" fit-finder/README.md; git diff --name-only HEAD~1..HEAD; git status --short | grep -v "^??" | wc -l; echo "exit $?"'
```
Expected: `dist bytes N`, a grep count of 1 or more, the four paths (fewer if one file was unchanged), `0`, `exit 0`. If the count is 0, fix the README and `git commit --amend --no-edit` (still one commit, since nothing has been pushed).

---

### Task 9: Hash check, score the untouched half once, commit it (Sonnet implementer; checker Sonnet)

**Files:**
- Create (repo): `fit-finder/data/synth/2026-10-18-holdout.jsonl`, `fit-finder/data/card-gold-synth-holdout.jsonl`
- Create (sealed): `S/untouched-score.txt` (the single scoring output)
- Modify: `fit-finder/README.md` (result line)
- Locked: everything else; no rule change after this task.

```rehearse
: > fit-finder/data/synth/2026-10-18-holdout.jsonl
: > fit-finder/data/card-gold-synth-holdout.jsonl
```

- [ ] **Step 1: [CHECK] Hash check against the committed file and `progress.md` (a mismatch stops the run and goes to the lead).**
```bash
bash -c 'set -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; cd C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test/holdout; sha256sum -c $W/fit-finder/data/synth/2026-10-18-holdout.sha256; grep -c "$(sha256sum prompts.jsonl | cut -d" " -f1)" $W/.ledger/2026-10-18-fit-finder-fair-test/progress.md; echo "exit $?"'
```
Expected: `prompts.jsonl: OK`, `gold.jsonl: OK`, `1`, `exit 0`.

- [ ] **Step 2: [IMPL] Score once. The output goes into a file that cannot be overwritten (`noclobber`); do not run this step a second time.**
```bash
bash -c 'set -e -o pipefail -o noclobber; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; S=C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test; node $W/fit-finder/tests/synth-score.js $S/holdout/prompts.jsonl $S/holdout/gold.jsonl > $S/untouched-score.txt; cat $S/untouched-score.txt; echo "exit $?"'
```
Expected: one line in the Task 1 format, `exit 0`. If the command exits 2 (the script failed closed) nothing was scored: report to the lead; do not edit any file to make it pass.

- [ ] **Step 3: [IMPL] Record the line verbatim and the bar.**
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; S=C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test; L=$W/.ledger/2026-10-18-fit-finder-fair-test; { echo; echo "## Untouched half, scored once, post-tune"; cat $S/untouched-score.txt; node $L/numbers.cjs $S/untouched-score.txt; } >> $L/progress.md; node $L/numbers.cjs $S/untouched-score.txt'
```
Expected: `R=.. F=.. W=.. ... bar=.. wrong_within_bar=yes|no`, exit 0. That `yes|no` is the pass verdict.

- [ ] **Step 4: [IMPL] Copy the half into the repo.**
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; S=C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test; cp $S/holdout/prompts.jsonl $W/fit-finder/data/synth/2026-10-18-holdout.jsonl; cp $S/holdout/gold.jsonl $W/fit-finder/data/card-gold-synth-holdout.jsonl; ls $W/fit-finder/data/synth | wc -l'
```
Expected: `3` (tune, holdout, sha256), exit 0.

- [ ] **Step 5: [CHECK] Committed copies equal the sealed originals by sha256 only (no re-scoring).**
```bash
bash -c 'set -e -o pipefail; W=C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; A=$(sha256sum $W/fit-finder/data/synth/2026-10-18-holdout.jsonl $W/fit-finder/data/card-gold-synth-holdout.jsonl | cut -d" " -f1 | tr "\n" " "); B=$(cut -d" " -f1 $W/fit-finder/data/synth/2026-10-18-holdout.sha256 | tr "\n" " "); [ -n "$A" ] && [ "$A" = "$B" ] && echo SAME'
```
Expected: `SAME`, exit 0 (the file order in the `.sha256` is prompts then gold, as written in Task 6 step 5).

- [ ] **Step 6: [IMPL] Add the result to the README** (one line: the verbatim score line from `S/untouched-score.txt`, the bar and whether it passed, labelled "model-written, model-labelled; not real customer prompts"), then run the suite.
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder; node tests/catalogue.test.js | tail -1; echo "exit $?"'
```
Expected: `all catalogue checks pass`, `exit 0`.

- [ ] **Step 7: [IMPL] Commit the half.**
```bash
bash -c 'set -e; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git add fit-finder/data/synth/2026-10-18-holdout.jsonl fit-finder/data/card-gold-synth-holdout.jsonl fit-finder/README.md; git commit -m "Fit Finder fair test: untouched half scored once, then committed (result in README)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01H2qm8GtpiHC26XLfs5izTu"'
```

- [ ] **Step 8: [CHECK] Commit scope; no rule change after the scoring.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git diff --name-only HEAD~1..HEAD; git diff HEAD~1..HEAD -- fit-finder/engine fit-finder/data/catalogue.json | wc -l; echo "exit $?"'
```
Expected: exactly the three paths, `0`, `exit 0`.

---

### Task 10: Evidence document and final review (evidence: Sonnet implementer; review: Opus final-reviewer plus read-only Codex)

**Files:**
- Create: `docs/evidence/2026-10-19-fit-finder-fair-test.md` (due by 2026-10-19 14:00Z)
- Locked: all else.

- [ ] **Step 1: [IMPL] Write the evidence doc** with these sections, every figure marked measured (run now) or read, and the exact command that printed it: (1) what was tested and what was not (model-written, model-labelled; not real customers; the real-set check stays Ian's); (2) the set: rows written 104, dropped D and why, kept K, split sizes, F per half, `conf: low` count, label mix; (3) pre-tune tuning-half line, post-tune tuning-half line, untouched-half line (verbatim from `S/untouched-score.txt`), pass bar and pass/fail; (4) the pins, each reported: B, A, real, fresh (incl. fit agreement), eval A/B, from the step 2 run; (5) the spec's prediction against the result, including the two "disproved if" tests (untouched wrong above 6 per 23; untouched improving as much as the tuning half); (6) kept rules (one line each) or "none kept", attempts used, tool uses, the transcript audit line, the purity and memorisation lines; (7) limits, copied from the spec's "Limits, said plainly"; (8) what is Ian's: republish the live page, the real-set check; (9) process notes: the plan rebuilds dist before scoring the untouched half (the spec lists it after; the order is harmless because the rules were locked either way), the untouched half's pre-tune score was not measured (the "before" is the tuning half's pre-tune rate). State the improvement of each half as (post minus pre-tune rate) so the independence test is checkable.

- [ ] **Step 2: [CHECK] Measure the numbers now.**
```bash
bash -c 'set -o pipefail; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test/fit-finder; node tests/catalogue.test.js | grep "first card right"; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A | grep "^fit agreement"; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B | grep "^fit agreement"; node tests/fair-guard.js --base <BASE> --lock-base HEAD; echo "exit $?"'
```
Expected: four first-card lines at or inside the pins, eval A >= 52/60 and B >= 45/60, `fair-guard PASS`, `exit 0`. (`--lock-base HEAD` compares the locked paths with the current commit; the catalogue comparison still uses `BASE`.)

- [ ] **Step 3: [IMPL] Commit the evidence doc.**
```bash
bash -c 'set -e; cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-fair-test; git add docs/evidence/2026-10-19-fit-finder-fair-test.md; git commit -m "Fit Finder fair test: evidence document" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01H2qm8GtpiHC26XLfs5izTu"'
```

- [ ] **Step 4: [LEAD] Opus final-reviewer** is given file paths only: the spec, this plan, the `git log --stat <BASE>^..HEAD` output path (the lead saves it with `tee` outside the worktree if needed), `L/progress.md`, `L/tune/results.tsv` and the evidence doc. It does not open `fit-finder/data/real/` or the sealed folder. Checks: spec coverage section by section; no rule change after the untouched half was scored (`git log` order: the Task 9 commit is after the last engine commit); the hash matched; the audit count 0; each pin reported; claims in the evidence doc match the command outputs; README and dist consistent. Reply at most 10 lines.

- [ ] **Step 5: [LEAD] Read-only Codex review** (per the lead's Codex wrapper, read-only sandbox, no write access). The prompt must say: "Review the diff `<BASE>..HEAD` and `docs/evidence/2026-10-19-fit-finder-fair-test.md` against `docs/superpowers/specs/2026-10-18-fit-finder-fair-test-design.md`. Do not open, list or read `fit-finder/data/real/`, `.ledger/`, or `C:/Users/teasp/Documents/workiva-sealed/` (customer prompts and sealed data). Do not modify anything. Report at most 10 lines: leaks of the untouched half into tuning, any rule copied from a tuning prompt, any claim in the evidence doc the code or data does not support."

- [ ] **Step 6: [IMPL] Fixes.** Any review finding goes back as a documentation or evidence fix only; a finding that needs an engine change is reported to Ian, not fixed (no change after the scoring). Re-run step 2 and commit with message `Fit Finder fair test: review fixes` (with the two trailer lines).

---

## Expected breaks

(none)

No existing test title breaks: the suite (`catalogue.test.js`) does not read the new `data/synth/` files; Task 7's guard rejects any kept change that lowers a pinned figure or fails an existing suite check; Task 8 changes only what the kept diff and the rebuild change, and `catalogue.test.js` does not read the README or the dist.

## Review items not taken

- Opus 17 (list each added alternative with the tuning rows it changes; send a one-row rule to the lead): not taken; replaced by the lead's decision 5 (4-word near-copy check after regex syntax is stripped, no waiver, no alternative over 3 words), which is stricter and machine-checked. Per-rule row attribution would need an engine run per alternative.
- Opus 19 (score the untouched half a second time with BASE's engine after Task 9): not taken; it is a spec change (the spec says the untouched half is scored once) and the lead's decision 9 says once. Flagged for the lead: it would give the untouched half its own "before" and make the independence test meaningful; cheap, and no leak after the rules are locked.
- Opus 9, second half (report the "reach a sourced use case" coverage line): not taken; no such line exists in the suite output the guard reads, and the plan does not invent one. The fresh fit agreement pin (12 of 29) is taken.
- Opus 4, optional guard clause (fail if `fit.js` has `require(` or `process.`): not taken in the guard; the lead's decision 3 puts the purity grep in the ledger checker over the added lines instead (Task 3, run in Task 7 step 5).
- Opus 3, random sealed folder name: not taken; the lead fixed the sealed path (`workiva-sealed/2026-10-18-fit-finder-fair-test`) and the audit needles instead.
- Codex 6, "enforce filesystem isolation" for the engine: only partly taken. The purity grep, the sealed folder outside the worktree and the transcript audit are the controls; nothing sandboxes the helper's process.
- Codex 7, "inspect decoded patterns and matching behaviour": partly taken. The memorisation check decodes JSON escapes and strips regex syntax; it does not run each alternative against the rows.

Everything else in both reviews is fixed above, including all nits (trailers, push wording, shared exclude note, `sort | wc -l` removed with `jq`, `process.execPath`, ordering note, transcript path pattern, counts-only checker, `split(/\s+/)`, literal `BASE`).

## Self-review notes

- Spec coverage: set (T4), blind labels (T5), split, seal and hash (T6), scoring script and guard (T1, T2), ledger checkers (T3), tuning with caps, keep rule, purity, near-copy and transcript audit (T7), rebuild and README in the kept-rules commit (T8), hash check, single score, commit (T9), evidence and reviews (T10), prediction and pass bar (T10, Global Constraints).
- Type consistency: score line format is defined once (Task 1 Interfaces) and parsed by `fair-guard.js` (suite lines, same prefix words), `numbers.cjs` and the Task 9 steps; `BASE`, `R_pre`, `F_tune` and `bar` are recorded in `progress.md` by Task 6 and read by Tasks 7-10; guard flags (`--base`, `--lock-base`, `--pins`) are the same in Tasks 2, 7, 8 and 10.
- Every `[CHECK]` command is a verbatim role-checks line; steps that write files are `[IMPL]`. Placeholders in angle brackets (`<BASE>`, `<R_PRE>`, `<BAR>`, `<transcript path>`) are filled by the lead or the implementer from `progress.md` before the command runs; none is left in a dispatch.
