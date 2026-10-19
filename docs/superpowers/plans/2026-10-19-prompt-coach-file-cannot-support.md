# Prompt coach: "the file cannot support this ask" (T3 / T6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-file-cannot-support/prompt-coach" && node --test --test-reporter=tap tests/rewrite_unit.test.js; node tests/simulate.js data/train_*.jsonl; node tests/customer_check.js; node tests/eval.js rulefeat data/test.jsonl
Data: (none)

**Goal:** The coach warns (note kind `unsupported`) and adds one decline line to the Strong rewrite when the attached file cannot support the ask (a forecast with no forecast basis in the file text, or a Scope 3 category the file does not list), plus a small FY25/FY2025 fix to the grounding note.

**Architecture:** One new function `cannotSupport(prompt, files, intent)` in `engine/rewrite.js` returns `null` or `{kind, ...}`. `coach()` stores it in `ctx.unsupported`, appends the decline line to the generated Evaluate segment of the Strong rewrite, and pushes an additive `unsupported` note. `web/template.html` adds `unsupported` to the list of rendered warning kinds. Grades, weights, classifier and every other rewrite are untouched.

**Tech Stack:** Plain Node (CommonJS), `node:test` (tap reporter), bash check scripts in the git-ignored ledger. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-19-prompt-coach-file-cannot-support-design.md` (approved 2026-10-19T08:24Z by the PM proxy, proxy decided). Run prompt: `docs/PROMPT_COACH_FILE_CANNOT_SUPPORT_RUN_PROMPT.txt`. Plan review (Codex revise, Opus approve) folded in: items C1-C5, O1-O5.

## Global Constraints

- `<WT>` = `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-file-cannot-support`; project `<WT>/prompt-coach`; ledger `<L>` = `<WT>/.ledger/2026-10-19-prompt-coach-file-cannot-support` (git-ignored).
- CHK = `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-file-cannot-support/.ledger/2026-10-19-prompt-coach-file-cannot-support/scripts/chk.sh` (created in Task 1). **Every check line below is `bash -c 'set -o pipefail; bash "<CHK>" ...'`** so the exit code of node survives; the script itself asserts the expected numbers and exits non-zero on any mismatch. Run checks with the Bash tool (PowerShell's `diff` is `Compare-Object`; the scripts use `cmp`).
- "No engine change beyond the spec (grades, weights, classifier, other notes and rewrites untouched)." Notes are additive.
- The test runs only when at least one attached file has non-empty `f.text`. The forecast basis is looked for in `f.text` only (spec 1a), never in sheet names or headers.
- Category trigger needs Scope 3 context in BOTH the ask and the file text, and at least 2 recognised categories in the file (one name that fits two categories counts once).
- Patterns are tuned on `train_*` rows of `prompt-coach/research/2026-10-19-cannot-support-labels.tsv` only. Non-train rows (test, test_unlabeled, sim_customers) are held out: only the lead reads their fires (`<L>/logs/<name>/heldout_fires.tsv`); helpers must not open that file and never tune from it.
- DO NOT read `<L>/heldout_sealed.json` (sealed; the lead reads it once after Task 2 is committed).
- Pass bar for the paired dump: 0 train fires. Held-out fires are reported by the lead, not a fail (a fire on test:177 "walk me through" is logged as an explain-gate miss).
- Locked (do not edit): every existing test in `tests/rewrite_unit.test.js` (new tests are appended only), `tests/eval.js`, `tests/simulate.js`, `tests/customer_check.js`, `tests/pagetest.js`, `tests/filetest.js`, `engine/weights.json`, `engine/cls-weights.json`, `engine/rules.js`, `engine/model.js`, `engine/classify.js`, `engine/files.js`, `data/`, `<L>/scripts/file_probe.js`, `guard_probe.js`, `standin_probe.js`, `make_labels.js`, `<L>/logs/b_*.log`, `<L>/logs/fixture_runs.json` (baselines on a7ba13f).
- Plain English in notes, no jargon. Decline line exactly: `If the file does not contain what this needs, say so instead of estimating.`
- Docs change in the same commit as the code they describe. No push, no live Workiva AI, no spend, no install. `tests/pagetest.js` and `tests/filetest.js`: report "not run" (no Playwright path); the page rendering of the new note is not browser-tested.
- Every commit message ends with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01Xei9FfYoNFdAHUpXgx5w6M`.

## Baselines (read from the ledger, measured on a7ba13f by the talk; Task 1 re-measures the dumps)

Unit 37 pass / 0 fail; simulate.js data/train_*.jsonl runs 2070, strongNotStrong 2, betterWeak 5, badText 2 (`<L>/logs/b_sim.log`); customer_check PASS 229 (`b_cust.log`); eval.js rulefeat data/test.jsonl GRADE acc=0.856, weak<->strong flips=8 (`b_eval.log`). dist/prompt-coach.html: the committed blob is 328,503 bytes (read, from the plan review); my earlier 330,187 was a CRLF checkout and is not the figure. README line 9 says 329566 (stale; Task 5 sets it to the LF bytes of the freshly built dist).

## Groups, tuning, cost

- Group A (sequential, all touch `engine/rewrite.js` or its test): Task 1 -> Task 2 -> Task 3. Task 4 (docs only) is independent. Task 5 needs 1-3. Task 6 needs 5. Lead step between Tasks 2 and 3: spec check 8 (below).
- TUNE BRIEF (Task 2): the one number is train-row fires from the Task 1 guard test and `chk.sh dump` (target 0), with T3 and T6 still firing. At most 3 pattern edits; only train rows or the two fixtures may drive an edit.
- Helper token estimate: T1 40k, T2 70k, T3 30k, T4 15k, T5 35k, T6 25k. Run total about 215k.
- Paid calls: none (offline Node only; no live Workiva AI).

## Lead step (not a task): spec check 8, sealed held-out

After Task 2 is committed the lead (not a helper) runs `<L>/scripts/sealed_run.js <ABSOLUTE <WT>/prompt-coach> <L>/heldout_sealed.json` once. The lead writes that script (it builds each file as `file_probe.js` `fileObj` does and calls `coach`); the plan cannot, because only the lead may open the sealed file. It appends one line to `<L>/progress.md`, exactly:
`SEALED check8 <UTC time>: should-fire X/8 fired; near-miss Y/8 fired; fired ids: <ids>; verdict PASS|FAIL` (PASS = X >= 7 and Y <= 1). No pattern change may follow; a miss is reported, not tuned. The lead also reads `heldout_fires.tsv` once and logs held-out fires (test:177) in the same file.

---

### Task 1: Failing tests, check script, dump scripts (spec checks 1, 2, 10; baseline for 4-7)

**Files:**
- Modify (append only): `prompt-coach/tests/rewrite_unit.test.js`
- Create (ledger, git-ignored): `<L>/scripts/chk.sh`, `<L>/scripts/dump_runs.js`, `<L>/scripts/cmp_fixture.js`
- Create (ledger output): `<L>/logs/base/strong_nofiles.txt`, `train_fires.tsv`, `heldout_fires.tsv`, `fixture_runs.json`

**Interfaces:**
- Produces: test helper `fx(name)` (file object built exactly as `<L>/scripts/file_probe.js` `fileObj` builds it); `chk.sh unit <pass> <fail> | dump <name> | strong <name> | fixtures <same|stage2|stage3> <name> | suite | dist <0|1>`; `dump_runs.js <abs root> <out dir>`; `cmp_fixture.js <base.json> <after.json> <same|stage2|stage3>`.
- Consumes: `research/live-tests/make_live_fixtures.js` (`SPECS`; no side effect when required), `engine/files.js` (`globalThis.ScopeFiles.periodsOf`).

- [ ] **Step 1: Append the tests** to the end of `prompt-coach/tests/rewrite_unit.test.js` (touch no existing test):

```js
// ---- T3/T6: the file cannot support the ask (spec 2026-10-19) ----
const RULES = require('../engine/rules.js');
const { SPECS } = require('../research/live-tests/make_live_fixtures.js');
require('../engine/files.js');
const FX_HEADER = (rows) => { for (const r of rows.slice(0, 12)) { const cells = (r || []).map((c) => (c == null ? '' : String(c).trim())).filter(Boolean); if (cells.filter((c) => /[A-Za-z]/.test(c) && c.length < 40).length >= 2) return cells.slice(0, 10); } return []; };
// Built the way engine/files.js reads a file and the way the ledger file_probe.js builds it: xlsx = "## sheet" + rows as text.
function fx(name) {
  const { periodsOf } = globalThis.ScopeFiles;
  const s = SPECS.find((x) => x.name === name); assert.ok(s, 'no fixture ' + name);
  if (s.kind === 'xlsx') { const rows = s.rows.filter((r) => r.length); const headers = FX_HEADER(rows), text = '## ' + s.sheet + '\n' + rows.map((r) => r.join(', ')).join('\n'); return { name, kind: 'Excel', text, sheets: [{ name: s.sheet, headers }], periods: periodsOf(headers.join(' ') + ' ' + text) }; }
  if (s.kind === 'docx') { const text = [s.title, ...s.paras].join(' '); return { name, kind: 'Word', text, headings: [s.title], periods: periodsOf(text) }; }
  if (s.kind === 'pdf') { const text = s.pages.map((p) => p.join(' ')).join('\n'); return { name, kind: 'PDF', text, periods: periodsOf(text) }; }
  return { name, kind: 'Text', text: s.text || '', periods: periodsOf(s.text || '') };
}
const mk = (name, sheet, body, headers = []) => ({ name, kind: 'Excel', sheets: [{ name: sheet, headers }], periods: [], text: '## ' + sheet + '\n' + body });
const DECLINE = 'If the file does not contain what this needs, say so instead of estimating.';
const T3 = 'what will our stock price do next quarter based on this';
const T6 = 'As a sustainability analyst, using only @sus_ghg_inventory.xlsx, calculate our Scope 3 category 11 (use of sold products) emissions for FY25. Show the method and every input with its source row in a short table (item, value, source row), then give the total in tCO2e. Keep it to one page, in a formal tone.';
const unsupported = (o) => o.notes.filter((n) => n.kind === 'unsupported');
const askCat = (n, scope3 = true) => 'Using only @s3.xlsx, calculate our ' + (scope3 ? 'Scope 3 ' : '') + 'category ' + n + ' emissions in a table with item, value and source row. Do not guess.';

test('unsupported: T3 forecast ask on the flux file gets the note and a Strong with the decline line that still grades strong', () => {
  const o = run(T3, [fx('fr_flux_q3.xlsx')]);
  assert.equal(unsupported(o).length, 1, JSON.stringify(o.notes));
  assert.match(unsupported(o)[0].text, /forecast/i);
  const s = o.stages.strong.prompt;
  assert.ok(s.endsWith(DECLINE), s);
  assert.equal(RULES.grade(detect(s).on), 'strong', s);
});

test('unsupported: T6 asks for Scope 3 category 11 the file does not list: note names it, Strong is the typed prompt', () => {
  const o = run(T6, [fx('sus_ghg_inventory.xlsx')]);
  assert.equal(unsupported(o).length, 1, JSON.stringify(o.notes));
  assert.match(unsupported(o)[0].text, /category 11/);
  assert.equal(o.stages.strong.prompt, T6);
});

test('unsupported: no file text means no note and no decline line (T3 with a bare file name)', () => {
  const o = run(T3, [{ name: 'fr_flux_q3.xlsx' }]);
  assert.equal(unsupported(o).length, 0);
  assert.ok(!o.stages.strong.prompt.includes(DECLINE));
});

test('unsupported: forecast basis is looked for in the file text only, not in a sheet named Forecast (C3)', () => {
  const hist = mk('hist.xlsx', 'Forecast', 'Account, Q1, Q2\nRevenue, 100, 120', ['Account', 'Q1']);
  hist.text = '## Actuals\nAccount, Q1, Q2\nRevenue, 100, 120'; // text is historical only; the sheet NAME says Forecast
  assert.equal(unsupported(run(T3, [hist])).length, 1);
  assert.equal(unsupported(run(T3, [mk('fc.xlsx', 'Plan', 'Account, FY26 forecast\nRevenue, 130')])).length, 0);
});

test('unsupported: a category ask needs Scope 3 in the ask and in the file (C1)', () => {
  const sales = mk('s3.xlsx', 'Sales', 'Category 1 Domestic, 500\nCategory 2 Export, 300');
  assert.equal(unsupported(run(askCat(11, false), [sales])).length, 0, 'not a Scope 3 ask');
  assert.equal(unsupported(run(askCat(11, true), [sales])).length, 0, 'file has no Scope 3 list');
  assert.equal(unsupported(run(askCat(11, false), [fx('sus_ghg_inventory.xlsx')])).length, 0, 'ask does not say Scope 3');
});

test('unsupported: leased assets fits both category 8 and 13, so it counts once and is not a fire (C2)', () => {
  const one = mk('s3.xlsx', 'Scope 3', 'Leased assets, 60');
  assert.equal(unsupported(run(askCat(13), [one])).length, 0, 'one recognised name is below the minimum of 2');
  const two = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nLeased assets, 60');
  assert.equal(unsupported(run(askCat(13), [two])).length, 0, 'generic leased assets may be 13');
  assert.equal(unsupported(run(askCat(11), [two])).length, 1, 'category 11 is absent');
  const up = mk('s3.xlsx', 'Scope 3', 'Waste, 90\nUpstream leased assets, 60');
  assert.equal(unsupported(run(askCat(13), [up])).length, 1, 'only the upstream kind is listed, so 13 is absent');
});

test('unsupported: no train-labelled row fires against any of the three area fixtures (tuning guard, train rows only)', () => {
  const rows = fs.readFileSync(path.join(__dirname, '../research/2026-10-19-cannot-support-labels.tsv'), 'utf8').split('\n').slice(1).filter(Boolean).map((l) => l.split('\t'));
  const train = rows.filter((r) => r[1] === 'train');
  assert.ok(train.length >= 40, 'train rows: ' + train.length);
  const files = ['fr_flux_q3.xlsx', 'sus_ghg_inventory.xlsx', 'grc_rcm.xlsx'].map(fx);
  const fired = [];
  for (const r of train) for (const f of files) if (unsupported(run(r[6], [f])).length) fired.push(r[2] + ' x ' + f.name);
  assert.deepEqual(fired, []);
});

test('unsupported: the page template renders the unsupported kind', () => {
  const html = fs.readFileSync(path.join(__dirname, '../web/template.html'), 'utf8');
  assert.ok(html.includes("'grounding', 'unsupported'"), 'template.html list of warning kinds');
});
```

- [ ] **Step 2: Create the three ledger scripts.**

`<L>/scripts/chk.sh`:

```bash
#!/usr/bin/env bash
# chk.sh unit <pass> <fail> | dump <name> | strong <name> | fixtures <same|stage2|stage3> <name> | suite | dist <0|1>
# Every branch exits non-zero on a wrong result. (No redirect to a file is needed from the caller.)
set -o pipefail
W="C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-file-cannot-support"; P="$W/prompt-coach"; L="$W/.ledger/2026-10-19-prompt-coach-file-cannot-support"
cd "$P" || exit 2
case "$1" in
  unit)
    out=$(node --test --test-reporter=tap tests/rewrite_unit.test.js 2>&1)
    p=$(printf '%s\n' "$out" | sed -n 's/^# pass //p'); f=$(printf '%s\n' "$out" | sed -n 's/^# fail //p')
    if [ "$p" = "$2" ] && [ "$f" = "$3" ]; then echo "UNIT_OK pass=$p fail=$f"; else echo "UNIT_BAD pass=$p fail=$f wanted $2/$3"; printf '%s\n' "$out" | grep -E '^not ok' | head -10; exit 1; fi ;;
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
    n=$(grep -c "grounding., .unsupported" dist/prompt-coach.html); m=$(grep -c "say so instead of estimating" dist/prompt-coach.html)
    echo "dist list-of-kinds=$n decline=$m LF_bytes=$(tr -d '\r' < dist/prompt-coach.html | wc -c)"
    [ "$n" = "$2" ] && [ "$m" = "$2" ] || { echo "DIST_BAD wanted $2"; exit 1; }; echo DIST_OK ;;
  *) echo "unknown $1"; exit 2 ;;
esac
```

`<L>/scripts/dump_runs.js`:

```js
// node dump_runs.js <ABSOLUTE prompt-coach root> <out dir>
// Writes strong_nofiles.txt (one JSON string per stored prompt, all data/*.jsonl, no files), and pairs each stored prompt
// with its area fixture (as guard_probe.js does). Fires on train_* files -> train_fires.tsv (helpers may read);
// fires on every other file -> heldout_fires.tsv (LEAD ONLY). Prints train counts only. Exit 1 if total != 1841 or any train fire.
const fs = require('fs'), path = require('path');
const root = process.argv[2], out = process.argv[3];
fs.mkdirSync(out, { recursive: true });
const E = (f) => require(path.join(root, 'engine', f));
const M = E('model.js'), W = E('rewrite.js'), C = E('classify.js'); E('files.js');
const { periodsOf } = globalThis.ScopeFiles;
const weights = JSON.parse(fs.readFileSync(path.join(root, 'engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(root, 'engine/cls-weights.json'))));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
const { SPECS } = require(path.join(root, 'research/live-tests/make_live_fixtures.js'));
function headerRow(rows) { for (const r of rows.slice(0, 12)) { const cells = (r || []).map((c) => (c == null ? '' : String(c).trim())).filter(Boolean); if (cells.filter((c) => /[A-Za-z]/.test(c) && c.length < 40).length >= 2) return cells.slice(0, 10); } return []; }
function fileObj(name) {
  const s = SPECS.find((x) => x.name === name);
  if (s.kind !== 'xlsx') throw new Error('area fixtures are xlsx');
  const rows = s.rows.filter((r) => r.length); const headers = headerRow(rows), text = '## ' + s.sheet + '\n' + rows.map((r) => r.join(', ')).join('\n');
  return { name, kind: 'Excel', text, sheets: [{ name: s.sheet, headers }], periods: periodsOf(headers.join(' ') + ' ' + text) };
}
const PAIR = { FR: 'fr_flux_q3.xlsx', SUS: 'sus_ghg_inventory.xlsx', GRC: 'grc_rcm.xlsx' };
const DOM = {}; for (const l of fs.readFileSync(path.join(root, 'data/test.jsonl'), 'utf8').split('\n')) if (l.trim()) { const j = JSON.parse(l); if (j.prompt) DOM[j.prompt] = j.domain; }
const strong = [], trainF = [], heldF = []; let total = 0, tf = 0, tc = 0;
for (const f of fs.readdirSync(path.join(root, 'data')).filter((x) => x.endsWith('.jsonl')).sort()) {
  let i = 0;
  for (const l of fs.readFileSync(path.join(root, 'data', f), 'utf8').split('\n')) {
    i++; if (!l.trim()) continue; const j = JSON.parse(l); if (!j.prompt) continue; total++;
    strong.push(JSON.stringify(W.coach(j.prompt, { files: [], detect, ...C.pick(j.prompt, CLS) }).stages.strong.prompt));
    const dom = j.domain || DOM[j.prompt] || (/sus/.test(f) ? 'SUS' : /grc/.test(f) ? 'GRC' : 'FR');
    const r = W.coach(j.prompt, { files: [fileObj(PAIR[dom] || PAIR.FR)], detect, ...C.pick(j.prompt, CLS) });
    const u = r.notes.find((n) => n.kind === 'unsupported');
    if (!u) continue;
    const row = [f + ':' + i, PAIR[dom] || PAIR.FR, u.text, j.prompt.replace(/\s+/g, ' ')].join('\t');
    if (/^train_/.test(f)) { trainF.push(row); /forecast/i.test(u.text) ? tf++ : tc++; } else heldF.push(row);
  }
}
fs.writeFileSync(path.join(out, 'strong_nofiles.txt'), strong.join('\n') + '\n');
fs.writeFileSync(path.join(out, 'train_fires.tsv'), trainF.join('\n') + (trainF.length ? '\n' : ''));
fs.writeFileSync(path.join(out, 'heldout_fires.tsv'), heldF.join('\n') + (heldF.length ? '\n' : ''));
console.log('DUMP total=' + total + ' trainFires=' + trainF.length + ' trainForecast=' + tf + ' trainCategory=' + tc);
if (total !== 1841 || trainF.length) process.exit(1);
```

`<L>/scripts/cmp_fixture.js`:

```js
// node cmp_fixture.js <base.json> <after.json> <same|stage2|stage3>
// same   : after is byte-identical to base for all 19 cases.
// stage2 : T3 and T6 each gain exactly one `unsupported` note and nothing else in notes; after.T3.strong === base.T3.strong + ' ' + DECLINE;
//          every other field of T3 and T6, and every other case, is byte-identical.
// stage3 : as stage2, and T6 also loses its grounding note that names "FY25".
// Exit non-zero on any difference.
const fs = require('fs');
const [, , ap, bp, mode] = process.argv;
const a = JSON.parse(fs.readFileSync(ap, 'utf8')), b = JSON.parse(fs.readFileSync(bp, 'utf8'));
const DECLINE = 'If the file does not contain what this needs, say so instead of estimating.';
const bad = [];
if (a.length !== 19 || b.length !== 19) bad.push('LENGTH ' + a.length + ' ' + b.length);
for (let i = 0; i < Math.min(a.length, b.length); i++) {
  const x = a[i], y = b[i], id = x.id, ex = JSON.parse(JSON.stringify(x));
  if (mode === 'stage2' || mode === 'stage3') {
    const un = y.notes.filter((n) => n.startsWith('unsupported:'));
    const want = (id === 'T3' || id === 'T6') ? 1 : 0;
    if (un.length !== want) bad.push(id + ': expected ' + want + ' unsupported note(s), got ' + un.length);
    let base = x.notes.slice();
    if (mode === 'stage3' && id === 'T6') base = base.filter((n) => !/^grounding: .*"FY25"/.test(n));
    if (JSON.stringify(y.notes.filter((n) => !n.startsWith('unsupported:'))) !== JSON.stringify(base)) bad.push(id + ': other notes changed');
    ex.notes = y.notes;
    if (id === 'T3') ex.strong = x.strong + ' ' + DECLINE;
  } else if (mode !== 'same') bad.push('mode ' + mode);
  if (JSON.stringify(ex) !== JSON.stringify(y)) bad.push(id + ': differs from the expected result');
}
if (bad.length) { console.log('FIXTURES_BAD (' + mode + ')\n' + bad.join('\n')); process.exit(1); }
console.log('FIXTURES_OK ' + mode + ' (19)');
```

- [ ] **Step 3: Red check.** Run: `bash -c 'set -o pipefail; bash "<CHK>" unit 40 5'` (CHK written out as defined above).
  Expected: `UNIT_OK pass=40 fail=5` (45 tests: 37 old + 8 new). The five failing are the T3, T6, C3 forecast-basis, C2 leased and page-template tests; the no-text, C1 and train-guard tests pass on the parent because nothing emits `unsupported` yet (they are guards that must stay green).

- [ ] **Step 4: Record the baseline on the parent engine** (engine still unchanged). Run: `bash -c 'set -o pipefail; bash "<CHK>" dump base'` then `bash -c 'set -o pipefail; node "<L>/scripts/file_probe.js" "<WT>/prompt-coach" "<L>/logs/base" > /dev/null && bash "<CHK>" fixtures same base'` (the second compares `base` with itself only to prove the script runs). Then prove the stored a7ba13f baseline reproduces: `bash -c 'set -o pipefail; node "<L>/scripts/cmp_fixture.js" "<L>/logs/fixture_runs.json" "<L>/logs/base/fixture_runs.json" same'`. Expected: `DUMP total=1841 trainFires=0 trainForecast=0 trainCategory=0`, `FIXTURES_OK same (19)`, `FIXTURES_OK same (19)`.

- [ ] **Step 5: Commit.** `cd "<WT>" && git add prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach T3/T6: failing tests for the cannot-support note (red)"` (+ attribution lines). Check: `bash -c 'set -o pipefail; cd "<WT>" && test -z "$(git status --short)" && echo CLEAN'` expected `CLEAN`.

---

### Task 2: Cannot-support test, `unsupported` note, decline line, page list (spec checks 1, 2, 4, 5, 6, 7, 9, 10)

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (new block before `/* ---------------- main ---------------- */` at line 407; one line after line 424; decline mutation after line 521; one note push after line 555)
- Modify: `prompt-coach/web/template.html:350`
- Test: `prompt-coach/tests/rewrite_unit.test.js` (Task 1 tests)

**Interfaces:**
- Consumes: `fx`, `mk`, `run`, `unsupported`, `askCat` test helpers (Task 1).
- Produces: module-private `cannotSupport(prompt, files, intent)` returning `null`, `{kind:'forecast'}` or `{kind:'category', n:Number, name:String}`; note `{kind:'unsupported', text}`; constant `DECLINE`.

TUNE BRIEF: metric = train-row fires from the Task 1 guard test and `chk.sh dump` (target 0) with T3 and T6 still firing. Patterns below are starting candidates (lifted from `guard_probe.js`); change a pattern only when a train row or a fixture positive shows it wrong; at most 3 edits; never open `heldout_fires.tsv` or `heldout_sealed.json`.

- [ ] **Step 1: Insert the block** above `/* ---------------- main ---------------- */` in `engine/rewrite.js`:

```js
  /* ---------------- the file cannot support the ask (T3 / T6) ---------------- */
  const DECLINE = 'If the file does not contain what this needs, say so instead of estimating.';
  // A prediction ask. "forecast" counts as a verb, "forecast for", or the thing to produce; "the forecast table on this slide" is a noun use about the file and does not.
  const FORECAST_ASK = /\b(?:predict\w*|projections?|(?:stock|share) price|forecast(?:ing)?\s+(?:for|our|my|next|what|how|whether|revenue|sales|earnings)\b|(?:give|make|produce|build|create|run|need|want)\s+(?:me\s+)?(?:a|an|the)?\s*(?:\w+\s+)?forecast\b(?!\s+(?:table|tab|sheet|slide|file|column|row))|what will (?:our|the|it|this)\s+(?:[\w&-]+\s+){0,3}(?:do|be|look like|end up|land|come in))/i;
  const FORECAST_BASIS = /\b(?:forecast|budget|plan|guidance|outlook|projection|target|estimate)/i;
  const CAT_ASK = /\b(?:category|cat\.?)\s*(\d{1,2})\b(?:\s*\(([^)]{3,60})\))?/gi;
  const CAT_EXPLAIN = /\b(?:explain|what counts|what does\b[^?.]*\bmean|walk me through|define|definition|what is)\b/i;
  const CAT_NAME = [null, 'purchased goods and services', 'capital goods', 'fuel- and energy-related activities', 'upstream transportation and distribution', 'waste generated in operations', 'business travel', 'employee commuting', 'upstream leased assets', 'downstream transportation and distribution', 'processing of sold products', 'use of sold products', 'end-of-life treatment of sold products', 'downstream leased assets', 'franchises', 'investments'];
  const CAT_RE = [null, /purchased goods/, /capital goods/, /fuel|energy-related/, /upstream transport/, /waste/, /business travel/, /commut/, /upstream leased/, /downstream transport/, /processing of sold/, /use of sold/, /end[- ]of[- ]life/, /downstream leased/, /franchis/, /investment/];
  // 'exact' = listed by number or by its own name; 'generic' = a plain "leased assets" row, which may be category 8 or 13; null = not listed.
  function categoryHit(n, lower) {
    if (new RegExp('\\b(?:category|cat\\.?)\\s*' + n + '\\b').test(lower) || new RegExp('(?:^|\\n)\\s*' + n + '\\s*[,\\t:.-]').test(lower) || CAT_RE[n].test(lower)) return 'exact';
    if ((n === 8 || n === 13) && /leased assets/.test(lower.replace(/(?:upstream|downstream) leased/g, ''))) return 'generic';
    return null;
  }
  function cannotSupport(prompt, files, intent) {
    if (!files.some((f) => (f.text || '').trim())) return null;
    const text = files.map((f) => f.text || '').join('\n'); // file text only: a sheet or header named Forecast is not a forecast
    if (FORECAST_ASK.test(prompt) && !FORECAST_BASIS.test(text)) return { kind: 'forecast' };
    if (intent === 'explain' || CAT_EXPLAIN.test(prompt)) return null;
    const lower = text.toLowerCase();
    if (!/scope\s*3/i.test(prompt) || !/scope\s*3/.test(lower)) return null; // Scope 3 context in the ask AND in the file
    let exact = 0, generic = false;
    for (let n = 1; n <= 15; n++) { const h = categoryHit(n, lower); if (h === 'exact') exact++; else if (h === 'generic') generic = true; }
    if (exact + (generic ? 1 : 0) < 2) return null; // one name that fits two categories counts once
    for (const m of prompt.matchAll(CAT_ASK)) {
      const n = Number(m[1]); if (n < 1 || n > 15) continue;
      const given = (m[2] || '').toLowerCase().trim();
      if (categoryHit(n, lower) === null && !(given && lower.includes(given))) return { kind: 'category', n, name: given || CAT_NAME[n] };
    }
    return null;
  }
  function unsupportedNote(u) {
    return u.kind === 'forecast'
      ? 'You are asking for a forecast, but nothing in the attached file looks like a forecast, budget or plan, so Workiva AI can only guess. Ask what the file shows, or attach the forecast.'
      : 'Your file lists Scope 3 categories, but not category ' + u.n + ' (' + u.name + '), so Workiva AI cannot work it out from this file.';
  }

```

- [ ] **Step 2: Wire it into `coach()`.** (a) After `ctx.missingAsk = ...` (line 424) add `ctx.unsupported = cannotSupport(prompt, files, ctx.intent);`. (b) After `const { segments, genUsed } = built;` (line 521), before `const allOn`, add:

```js
    // T3: when the file cannot support the ask, the generated Evaluate sentence also tells the AI to decline (a strong prompt is returned as typed, so it never gets this).
    if (ctx.unsupported && grade !== 'strong') { const ev = segments.find((x) => x.generated && x.letter === 'E'); if (ev && !ev.text.includes(DECLINE)) ev.text = ev.text.replace(/\s*$/, ' ') + DECLINE; }
```
  (c) Inside `if (files.length) {`, after the `grounding` push (line 555), add `if (ctx.unsupported) notes.push({ kind: 'unsupported', text: unsupportedNote(ctx.unsupported) });`.

- [ ] **Step 3: Page list.** In `prompt-coach/web/template.html` line 350 change `['calc', 'stacked', 'grounding']` to `['calc', 'stacked', 'grounding', 'unsupported']`.

- [ ] **Step 4: Green check.** Run: `bash -c 'set -o pipefail; bash "<CHK>" unit 45 0'`. Expected: `UNIT_OK pass=45 fail=0`. (If the train guard names a fired row, apply the TUNE BRIEF.)

- [ ] **Step 5: Spec 4 and 5 (all 1,841).** Run: `bash -c 'set -o pipefail; bash "<CHK>" dump after2 && bash "<CHK>" strong after2'`. Expected: `DUMP total=1841 trainFires=0 trainForecast=0 trainCategory=0` then `STRONG_NOFILES_IDENTICAL`. Do not open `<L>/logs/after2/heldout_fires.tsv`; the lead reads it.

- [ ] **Step 6: Spec 6 and 7 (fixture runs).** Run: `bash -c 'set -o pipefail; bash "<CHK>" fixtures stage2 after2'`. Expected: `FIXTURES_OK stage2 (19)`. This asserts T3 gets exactly one `unsupported` note and `strong === base.strong + ' ' + DECLINE`, T6 gets exactly one `unsupported` note with its Strong byte-identical, and every other field and the other 17 cases are byte-identical.

- [ ] **Step 7: Spec 9 (must stay green).** Run: `bash -c 'set -o pipefail; bash "<CHK>" suite'`. Expected: `SIM_IDENTICAL`, `CUST_IDENTICAL`, `EVAL_IDENTICAL` (the stand-in files carry headers only, so the empty-text gate keeps them silent). On a `*_DIFF`, inspect `diff -u` of the two logs with `head -40`; the pass bar is then runs 2070, strongNotStrong 2, betterWeak 5, badText 2; PASS 229; GRADE acc=0.856 flips=8, and any other difference is a failure to explain.

- [ ] **Step 8: Commit.** `cd "<WT>" && git add prompt-coach/engine/rewrite.js prompt-coach/web/template.html && git commit -m "Prompt coach T3/T6: unsupported note and decline line when the file cannot support the ask"` (+ attribution lines). The lead then runs the Lead step (spec check 8).

---

### Task 3: FY25 / FY2025 in the grounding note (spec check 3, own task)

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (grounding block, the `missingTerms` line)
- Test: `prompt-coach/tests/rewrite_unit.test.js` (append)

**Interfaces:**
- Consumes: `fx`, `run`, `T6` (Task 1).
- Produces: module-private `yearForms(term)` returning the other spellings of an `FY`/`CY` year term.

- [ ] **Step 1: Append the failing test:**

```js
test('grounding: FY25 counts as present when the file has FY2025; FY26 against the same file is still flagged', () => {
  const sus = fx('sus_ghg_inventory.xlsx');
  const g = (o) => o.notes.filter((n) => n.kind === 'grounding').map((n) => n.text).join(' ');
  assert.ok(!/FY25/.test(g(run(T6, [sus]))), g(run(T6, [sus])));
  assert.match(g(run('Using only @sus_ghg_inventory.xlsx, list the Scope 3 totals for FY26 in a table with each source row. Do not guess.', [sus])), /FY26/);
});
```

- [ ] **Step 2: Red check.** Run: `bash -c 'set -o pipefail; bash "<CHK>" unit 45 1'`. Expected: `UNIT_OK pass=45 fail=1` (46 tests; fails on the parent because T6 still names "FY25").

- [ ] **Step 3: Implement.** Add above `cannotSupport` in `engine/rewrite.js`:

```js
  // "FY25" is present when the file says FY2025 (or FY 2025, FY'25), and the same for CY; FY26 against FY2024/FY2025 is still absent.
  function yearForms(term) {
    const m = /^(FY|CY)\s?'?(\d{2}|\d{4})$/i.exec(term); if (!m) return [term];
    const y = m[2].length === 2 ? '20' + m[2] : m[2], p = m[1];
    return [p + y, p + y.slice(2), p + ' ' + y, p + ' ' + y.slice(2), p + "'" + y.slice(2)];
  }
```
  and change the `missingTerms` line to `const missingTerms = [...new Set(terms)].filter((x) => !fileText.includes(x.toLowerCase()) && !yearForms(x).some((v) => fileText.includes(v.toLowerCase())));`

- [ ] **Step 4: Green check.** Run: `bash -c 'set -o pipefail; bash "<CHK>" unit 46 0'`. Expected: `UNIT_OK pass=46 fail=0`.

- [ ] **Step 5: Re-dump (spec 4, 6, 7).** Run: `bash -c 'set -o pipefail; bash "<CHK>" dump after3 && bash "<CHK>" strong after3 && bash "<CHK>" fixtures stage3 after3'`. Expected: the `DUMP ... trainFires=0` line, `STRONG_NOFILES_IDENTICAL`, `FIXTURES_OK stage3 (19)` (T6 has exactly one `unsupported` note and no `FY25` grounding note; no other case changes).

- [ ] **Step 6: Spec 9.** Run: `bash -c 'set -o pipefail; bash "<CHK>" suite'`. Expected: `SIM_IDENTICAL`, `CUST_IDENTICAL`, `EVAL_IDENTICAL`.

- [ ] **Step 7: Commit.** `cd "<WT>" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js && git commit -m "Prompt coach T3/T6: FY25 matches FY2025 in the grounding note"` (+ attribution lines).

---

### Task 4: R14(c) text and open question 1, marked proxy decided (spec design point 5)

**Files:**
- Modify: `prompt-coach/research/live-tests/SCORING_RULES.md` (R14 item (c) near line 179; the "R14(c) versus R7" paragraph near lines 218-220)
- Modify: `prompt-coach/research/live-tests/results/2026-10-19-tricky-batch-results.md` (open question 1 near line 110)

- [ ] **Step 1: Read** lines 172-182 and 205-222 of `SCORING_RULES.md` and lines 108-114 of the results file.
- [ ] **Step 2: Edit R14(c)**: a refusal stays job 0 "except when the answer key says the file cannot support the ask: a clear decline that says what the file lacks is job 1 (the R7 case)".
- [ ] **Step 3: Rewrite the "R14(c) versus R7" paragraph**: state the ruling, "proxy decided 2026-10-19 08:12Z (PM proxy for Ian; Ian may overturn)", and that scores already given are not re-scored in this run; the change applies to the next batch. Remove "Ian decides whether to change R14(c)".
- [ ] **Step 4: Edit open question 1** in the results file: keep the question and append "Answered: yes, R14(c) changed; proxy decided 2026-10-19, Ian may overturn. Not re-scored; applies to the next batch."
- [ ] **Step 5: Check.** Run: `bash -c 'set -o pipefail; cd "<WT>/prompt-coach" && [ "$(grep -c "proxy decided" research/live-tests/SCORING_RULES.md)" -ge 1 ] && [ "$(grep -c "proxy decided" research/live-tests/results/2026-10-19-tricky-batch-results.md)" -ge 1 ] && [ "$(grep -c "Ian decides whether to change R14(c)" research/live-tests/SCORING_RULES.md)" = 0 ] && echo R14_OK'`. Expected: `R14_OK` (before the change the first count is 0, so it fails on the parent).
- [ ] **Step 6: Commit.** `cd "<WT>" && git add prompt-coach/research/live-tests/SCORING_RULES.md prompt-coach/research/live-tests/results/2026-10-19-tricky-batch-results.md && git commit -m "Prompt coach: R14(c) lets a clear decline score job 1 when the file cannot support the ask (proxy decided)"` (+ attribution lines).

---

### Task 5: Rebuild dist, README notes, wording rules, byte count (spec check 10)

**Files:**
- Modify: `prompt-coach/dist/prompt-coach.html` (generated by `tests/build.js`)
- Modify: `prompt-coach/README.md` (line 9 byte count; "Coach notes" section from line 87: add the `unsupported` note and the FY rule, "Four warning notes" becomes "Five"; "Rewrite wording rules" from line 72: add the decline line)

- [ ] **Step 1: Red check on dist.** Run: `bash -c 'set -o pipefail; bash "<CHK>" dist 1'`. Expected: fails with `DIST_BAD wanted 1` (counts are 0 before the rebuild).
- [ ] **Step 2: Rebuild.** Run: `bash -c 'set -o pipefail; cd "<WT>/prompt-coach" && node tests/build.js | tail -n 2'`. Expected: it names the written file, no error.
- [ ] **Step 3: Check.** Run: `bash -c 'set -o pipefail; bash "<CHK>" dist 1'`. Expected: `DIST_OK` and a line `dist list-of-kinds=1 decline=1 LF_bytes=<N>`. Note `<N>`: it is the LF byte count of the freshly built file (CR bytes stripped), the number the README must carry. Do not use `wc -c` on the checkout (it may be CRLF; the committed blob before this change was 328,503).
- [ ] **Step 4: README.** Set the line 9 byte count to `<N>`. In "Coach notes" add the `unsupported` entry (forecast ask with no forecast, budget, plan, guidance, outlook, projection, target or estimate word in an attached file's text; a Scope 3 category N asked with "Scope 3" in the ask, not listed in a file whose text says Scope 3 and recognises at least 2 categories, one name fitting two categories counting once; explain asks excluded; only when a file has text; additive, never changes grade, weight or other rewrite text) and the grounding rule ("FY25 counts as present when the file says FY2025; FY26 is still flagged"). In "Rewrite wording rules" add the decline line and when it is added (note fires, prompt not already strong, Strong has a generated Evaluate sentence).
- [ ] **Step 5: Full checks on the built result.** Run: `bash -c 'set -o pipefail; bash "<CHK>" unit 46 0 && bash "<CHK>" suite'`. Expected: `UNIT_OK pass=46 fail=0`, `SIM_IDENTICAL`, `CUST_IDENTICAL`, `EVAL_IDENTICAL`. `tests/pagetest.js` and `tests/filetest.js`: not run (no Playwright path; install nothing).
- [ ] **Step 6: Commit** (dist and README in one commit). `cd "<WT>" && git add prompt-coach/dist/prompt-coach.html prompt-coach/README.md && git commit -m "Prompt coach T3/T6: rebuild dist, README notes, wording rules and byte count"` (+ attribution lines). Then verify the README figure against the committed blob: `bash -c 'set -o pipefail; cd "<WT>" && n=$(git show HEAD:prompt-coach/dist/prompt-coach.html | wc -c) && grep -c "$n bytes" prompt-coach/README.md'`. Expected: `1`.

---

### Task 6: Evidence doc (fills the spec's success-criteria table)

**Files:**
- Create: `docs/evidence/2026-10-19-prompt-coach-file-cannot-support.md`

- [ ] **Step 1: Re-measure** each figure now (the Task 5 Step 5 outputs, the `after3` dumps, the Task 5 Step 3 line). Label each figure "measured" or "read".
- [ ] **Step 2: Write the doc** with the spec's 10-row table (check, prediction, result, measured/read, status). Row 5: train fires 0 (measured); held-out fires from the lead's progress.md note. Row 8 (sealed held-out): copy the `SEALED check8` line from `<L>/progress.md`. Row 9: unit 46/0, simulate 2070/2/5/2, customer_check PASS 229, eval acc 0.856 flips 8. Row 10: the `dist` line. State: pagetest.js and filetest.js not run; page rendering not browser-tested; no answer-quality gain claimed (no live run); the R14(c) ruling is proxy decided. List the parked items (Q2, Q3, Q5, SOX ITGC, SUS-1 column names, T5 known limits).
- [ ] **Step 3: Settle the T5 discrepancy** named in the run prompt ("missing net zero targets": the T5 evidence says it fires, the hand-off says it does not): the lead or implementer calls `require('<WT>/prompt-coach/engine/rewrite.js').missingAsk('<the exact ask text from the T5 evidence>')` once and the doc records the measured answer, labelled measured.
- [ ] **Step 4: Check.** Run: `bash -c 'set -o pipefail; cd "<WT>" && f=docs/evidence/2026-10-19-prompt-coach-file-cannot-support.md && [ "$(grep -c measured $f)" -ge 10 ] && [ "$(grep -c "TBD\|TODO" $f)" = 0 ] && echo EVIDENCE_OK'`. Expected: `EVIDENCE_OK`.
- [ ] **Step 5: Commit.** `cd "<WT>" && git add docs/evidence/2026-10-19-prompt-coach-file-cannot-support.md && git commit -m "Prompt coach T3/T6: evidence"` (+ attribution lines).

---

## Expected breaks

None: no existing test is expected to break (`Data: (none)`; the note and decline line are additive and gated on non-empty file text; the three baseline logs are expected byte-identical).

## Self-review (spec coverage)

- Check 1 T3: Tasks 1, 2. Check 2 T6: Tasks 1, 2. Check 3 FY: Task 3. Check 4: Task 2 Step 5, Task 3 Step 5. Check 5: Task 2 Step 5 (train fires 0; held-out by the lead). Checks 6, 7: Task 2 Step 6, Task 3 Step 5 (exact T3 decline-line assertion). Check 8: Lead step. Check 9: Task 2 Step 7, Task 3 Step 6, Task 5 Step 5. Check 10: Task 1 (template test), Task 5. Design point 5 (R14(c)): Task 4. README, dist, byte count: Task 5. Evidence: Task 6.
- Review items: C1 (Scope 3 in ask and file; test "a category ask needs Scope 3"), C2 (`categoryHit` generic/exact; leased test), C3 (`f.text` only; Forecast-sheet test), C4/O1 (`cmp_fixture.js` exact assertions), C5 (`bash -c 'set -o pipefail; ...'` with assertions in `chk.sh`), O2/O3 (`dump_runs.js` train counts only, held-out to a lead-only file, pass bar 0 train fires), O4 (Lead step with script and progress line), O5 (LF bytes, `dist` check, blob verification).
- The category note adds the name in brackets (`category 11 (use of sold products)`), which the T6 test matches with `/category 11/`.
- Not read in detail: the simulate, customer_check and eval output formats (only log tails), so spec check 9 compares whole logs with `cmp` against the baselines.
