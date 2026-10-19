# Prompt coach live test: plants in 12 cases, then run and score

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: none (no repo test reads the fixtures; the gate is `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh`, built in Task 1)
Data: prompt-coach/research/live-tests/fixtures

**Goal:** Plant a known, checkable answer (at least one hard to spot) in the fixture of each of the 12 live-test cases other than FR-2, then run 3 prompts x 2 runs per case in Ian's sandbox and score them against the keys.

**Architecture:** `make_live_fixtures.js` stays the only source of the files, but it is never run inside the repo tree: `plants_regen.sh` runs a copy in a temp folder and copies in only the files the task owns, so FR-2's two fixtures are never written. `fixtures/answer_key.json` gains one entry per case (job, found, hard, optional, mustNotClaim, plus `proof` strings that must appear in the generated file, `counts` (line-anchored regex with an exact line count) and `absent` strings that must not). A checker script proves every proof string and count is right in the regenerated file, FR-2 is unchanged (files by blob, key entry by full text against b4db9ae), and RCM and test-results use the same control IDs. Four small helper scripts in the ledger make every check assert node's own exit status. Run tasks follow the FR-2 pilot: driver sends, Opus scorer, Codex read-only second scorer.

**Tech Stack:** Node (SheetJS `xlsx`, `jszip` from the vendor dir), bash, Workiva AI sandbox via the driver session (Chrome), Opus scorer agents, `codex exec` read-only.

**Spec:** Ian's ruling 2026-10-18, "A + harder plants (Recommended)" (progress.md line 285): plant known answers in all 12 other cases, at least one hard to spot per case; 2 runs per prompt; cases one at a time; score the first case and check the scores discriminate before running the rest. Cases: `prompt-coach/research/live-tests/cases.md`. FR-2 pattern: commit b4db9ae. Hard plants are hypotheses until each case's gate (Task 6 Step 6 table); difficulty is not assumed.

## Global Constraints

- Root: `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites` (call it ROOT). In run tasks, `[ROOT+L]` stands for `cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites && L=.ledger/2026-10-16-prompt-coach-rewrites/logs &&`.
- Invented data only. No real data. Fixture text is synthetic ("Example Co").
- FR-2 stays unchanged: `fixtures/fr_trial_balance.xlsx` git blob `f53fe7880c70c5bf48bef98bbbaa078077145f73`, `fixtures/fr_revenue_footnote.docx` blob `ea4288029fb03ba0ef2b5a00b63586770b2d8b95`, and the `"FR-2"` entry in `answer_key.json` identical, as JSON text, to the entry in `git show b4db9ae:prompt-coach/research/live-tests/fixtures/answer_key.json`. The FR-2 key entry and its 2 fixtures are compared to b4db9ae in full by the checker and never written by any task. No command in this plan runs the generator inside the repo tree: it runs only in a temp folder (`plants_regen.sh`, and the `rehearse` blocks, which copy named owned files out of a temp folder), so a generator crash or interruption cannot touch the FR-2 files.
- Do not edit `cases.md`, `cases.json`, `make_cases.js` (generated; prompts unchanged).
- Out of scope: sandbox settings, sharing, deleting anything in the sandbox; real data; pushing `prompt-coach` or main.
- Commits on branch `worktree-prompt-coach-rewrites` only, one per build task, message ends with the two attribution lines from the committing session's system reminder, copied as given (do not retype a model name from this plan).
- `.ledger/` is git-ignored: the checker, helpers and logs are not committed.
- Locked (do not touch): `.ledger/2026-10-16-prompt-coach-rewrites/plant_check.cjs`, `logs/live_FR-2*.md`, `logs/codex_fr2_*` (read as a template only), the FR-2 entry and FR-2 fixtures.
- Every check command either runs through `plants_gate.sh` (asserts node's exit code and the PASS/FAIL counts) or is a `test "$(...)" = N && echo OK` line (an explicit exit assert). No check reads only the last command of a pipe.

## How a proof string is written

`plants_check_all.cjs` turns each fixture into text: xlsx = one line per row, cells placed by their column letter and joined by ` | ` (an empty cell shows as nothing between the bars; trailing blank cells may be absent, so no proof ends on a blank cell); docx = one line per paragraph; pdf = one line per text line; csv = raw lines. Runs of spaces collapse to one, lines are trimmed. A `proof` string passes when it is a substring of that text (so `a |  | b` is written `a | | b`). A proof may span lines with `\n` in the JSON. `absent` strings (case-insensitive) must not appear. If a proof string does not match the real generated text after the edit, fix the string to the real text only if the planted value is the same; never weaken the planted value.

A substring proof can also match a longer, populated neighbour (`...,DE,` inside `...,DE,120`; `| 410 | 4100` inside `| 410 | 41000`; `... | 480` inside `... | 480 | memo`). So any proof whose end is a value, or an empty cell, is checked by `counts` instead: each `counts` item is `{"match": regex, "n": exact number of normalized lines that match}`. Write the regex with `^` and `$` so it covers the whole line, and use `[|]` for a bar (no backslashes, so it survives JSON). A trailing blank cell may be absent from the line, so a row that ends on a blank cell is written `... 480( [|])?$`. A count is also how a key that depends on a count (7 suppliers, 6 controls, 4 invoices) is pinned.

Key entry shape for the 12 new cases: `{"job":str,"found":[str...],"hard":str (a substring of one found item),"optional":[str...] (credited when stated, never required),"mustNotClaim":[str...],"proof":[str...],"counts":[{"match":str,"n":int}...] (optional),"absent":[str...]}`.

## Per-case keys (what each prompt asks, what a correct answer finds, the hard plant, false findings)

Same-fixture note: no two cases share a file. GRC-1 (RCM) and GRC-3 (test results) share control IDs C-01 to C-06 and are kept consistent (C-06 exists in both; the checker enforces the ID match).

| Case | Prompt asks | Planted key (values) | Hard one (provisional) | Prohibited claims (false findings) |
|---|---|---|---|---|
| FR-1 | What drove SG&A change Q2 to Q3 | SG&A 210 to 268 = +58 = Salaries +28 (110 to 138) + Marketing +21 (60 to 81) + Legal fees +9 (25 to 34) + Other 0 (optional) | Legal +9 note says "Includes 7 one-time settlement": 7 of Q3's 34 is one-time; about 2 of the rise is left if Q2 had none (Q2 not stated) | R&D or interest expense named as a driver; a cause for salaries (hiring, raises) stated as fact; all 9 called one-time |
| FR-3 | Shorten the liquidity paragraph, keep every number | Keep $412 million, $38 million (foreign subsidiaries), $250 million (revolver, undrawn), $300 million senior notes due 2029, twelve months | $38 million sits inside a clause and the $300 million notes are a second sentence | "no debt" or "debt-free" (only the revolver is undrawn); a number dropped or unit changed ($412, $0.4 billion); added facts (covenants, rates, ratings) |
| FR-4 | Find unusual accruals | JE-103 Accrued legal 480 with no memo (routine legal is 5); JE-101 and JE-105 same bonus 40 "Q3 bonus" (possible duplicate, to verify); JE-104 and JE-106 freight 12, memos "Sep freight" and "Sept freight" (possible near-duplicate, to verify) | JE-104/JE-106 near-duplicate (different entry number, memo spelling) | JE-102 (5, Routine) flagged as unusual; any value "corrected" |
| GRC-1 | Key controls with no owner; flag missing frequency | Key controls without owner: C-02 (Access recertification) and C-06 (owner "TBD", Annual). Missing frequency: C-03 (key) and C-04 (not key). C-04 has no owner and no frequency but "Key control" = No | C-06 owner "TBD" counts as no owner; C-04 is not key | C-01 or C-05 listed; C-04 listed as a key control; "TBD" accepted as an owner |
| GRC-2 | Review access policy for gaps vs SOX ITGC | Gaps: review has no frequency ("when needed"); termination has no deadline ("should"); emergency access: any manager, by phone or email, no ticket, no after-the-fact review stated, an exception to the system-owner approval rule whose safeguards need review | Emergency exception in the last paragraph sits against the approval rule | Policy said to set a review frequency, termination deadline, password rule, or after-the-fact review (none exists); invented clause quotes. Naming a gap the policy lacks (password, privileged access) is a valid extra |
| GRC-3 | Summarize deficiencies for the audit committee, figures exact | 3 deficiencies: C-02 Design "No owner named"; C-03 Operating "Two months late"; C-04 Design "No frequency". 2 Design, 1 Operating. Optional when a count is stated: 5 tested, 3 failed, 2 passed, 6 listed, C-06 "Not tested" | Exactly 3: C-01 (Pass, "One exception in 25 samples, within tolerance") and C-06 (Not tested) are not deficiencies | Severity ("material weakness", "significant deficiency"); a dollar amount; 4 deficiencies; "3 of 6 tested" or a 50 percent failure rate; C-01 or C-06 called a deficiency or failed. Correct derived counts and percentages with the right denominator are fine |
| GRC-4 | Walkthrough into numbered test steps with evidence per step | 3 steps in order: AP clerk enters invoice and matches PO; AP supervisor approves above the limit; Treasury releases payment run Thursday. Evidence proposed for each step (invoice and PO match record; approval record above the limit; payment run release log). Open questions: approval limit amount not stated; Treasury releaser not named; no stated approval below the limit | Last sentence: the same AP clerk updates vendor bank details (potential segregation-of-duties risk to follow up; conditional wording accepted) | A dollar limit; a named person, or an owner or role not in the walkthrough; a goods-receipt or three-way-match step; a changed day |
| SUS-1 | 4 invoices into the table (first of month, split addresses) | 5 rows: 9/1/2018 100 Sample Street electricity 12,400 kWh 1,488.00 USD; 9/1/2018 100 Sample Street gas 310 therms 372.50 USD; 9/1/2018 200 Sample Avenue electricity 5,000 kWh 600.00 USD; 9/1/2018 210 Sample Avenue electricity 3,050 kWh 366.00 USD; 10/1/2018 100 Sample Street electricity 12,900 kWh 1,548.00 CAD. Count stated: 4 invoices ("1 document, 4 invoices" is accepted) | Invoice 3 holds two addresses (5,000 + 3,050 = 8,050 kWh; 600 + 366 = 966); invoice 4 is in CAD | 3 invoices counted; one row of 8,050/966 for invoice 3; CAD shown as USD or converted; therms converted to kWh |
| SUS-2 | Outliers in Scope 3 | Employee commuting FY2025 4100 vs FY2024 410 (10 times). Headers now say tCO2e | Leased assets 60 to 0.061 with the row note "FY2025 in ktCO2e": read as kt, 0.061 kt = 61 t, comparable with 60 tCO2e, a unit mix, not a 99.9 percent fall | Leased assets reported as a real collapse; Purchased goods flagged only for size; 4100 stated as corrected to 410 |
| SUS-3 | Suppliers with missing emissions data | Missing: Example Supplier B (DE), Example Supplier D (US), Example Supplier G (IT, cell reads "n/a"): 3 of 7 | G's "n/a" is text, not blank | F (FR, value 0) listed as missing without saying 0 is a reported value; any estimated value; count of 4 |
| SUS-4 | Map climate policy to ESRS E1 | Measure Scope 1, 2, 3 yearly maps to E1-6; "cut Scope 1 and 2 by 42 percent by 2030 from a 2022 base" maps to E1-4 with scope 1 and 2 only; board reviews climate risks once a year is governance, marked needs review; "No internal carbon price is currently used" relates to E1-8 (internal carbon pricing) as a negative statement | E1-8: the policy says no internal carbon price is used; the answer must say so (not map a price) and may mark the mapping for review | Target said to cover Scope 3 or all emissions; another percent, year or base; a carbon price said to be used; E1-1 (transition plan) or E1-9 (financial effects) called covered |
| SUS-5 | Water bills: dates, location, usage, amount per address | 3 rows: 100 Sample Street, service period 2/1/2019-2/28/2019, 42 kgal, USD 310.00; 200 Sample Avenue, 2/1/2019-2/28/2019, 17 CCF, USD 128.40; 100 Sample Street, 3/1/2019-3/31/2019, 39 kgal, USD 287.10 | 17 CCF is a different unit from kgal: kept as given, not silently converted or added to the kgal rows | Rows 1 and 3 merged; CCF turned into kgal without saying so; 42 + 17 summed; bill date used with no service period |

ESRS E1 disclosure numbers (E1-4 targets, E1-6 gross Scope 1, 2, 3 emissions, E1-8 internal carbon pricing, E1-1 transition plan, E1-9 anticipated financial effects) and what E1-8 asks for are from memory of the standard: assumed, not checked against a source. Task 5 Step 2 asks the implementer to confirm with one search; Ian owns the final call. Until then the SUS-4 key does not say E1-8 is "not covered".

## Budget

Measured FR-2 costs (from progress.md, read not re-measured): implementer 28,829 tokens (2-line change); checker 23,972; Opus scorer 54,948 for 3 answers; Codex 5,484 for 3 answers (Codex tokens sat outside the cap in FR-2: 16,849); driver 3 sends in 3m24s (driver tokens not measured). Everything else here is an estimate (assumed). Helper tokens left: about 760,000 (figure given by the lead, not measured here; the earlier draft said 894,000).

| Task | Basis | Tokens |
|---|---|---|
| 1 checker + 4 helpers: implementer + checker | 40k + 24k (assumed: a new script and three small ones; FR-2 was a 2-line change) | 64,000 |
| 2-5 plant tasks: implementer + checker each | 4 x (42k + 24k) (assumed: preflight, append helper, 3-4 generator lines + key each) | 264,000 |
| **Build subtotal** | | **328,000** |
| 6 FR-4 scoring (6 answers) | fixed-overhead model 27.5k + 6 x 9.2k = 82.7k; linear 6 x 18.3k = 110k | 82,700 to 110,000 |
| 7-11 scoring, 2 cases each (12 answers) | fixed-overhead 27.5k + 12 x 9.2k = 137.9k; linear 220k; x5 tasks | 689,500 to 1,100,000 |
| 12 SUS-5 scoring (6 answers) | as Task 6 | 82,700 to 110,000 |
| **Scoring subtotal (7 dispatches)** | 54,948 / 3 = 18,316 per answer x 72 answers = 1,318,700 (linear); the fixed-overhead model assumes half of 54,948 is per-dispatch overhead: 27.5k x 7 + 9.2k x 72 = 854,900. The scorer now also reads each sent prompt (about 0.3k per answer, ignored) | about 855,000 to 1,318,700 |
| Codex second scorer (7 dispatches) | 5,484 / 3 = 1,828 per answer x 72, outside the cap as in FR-2 | about 132,000 (not counted) |
| Driver | 12 cases x 6 sends at about 68 s per send (3m24s / 3) | about 82 min wall time; tokens unmeasured |

**Total in the cap: 328,000 + 855,000 to 1,318,700 = about 1.18M to 1.65M, against about 760,000 left. It does not fit as written (short by about 423k to 887k).** After the build, 432k is left. At the fixed-overhead model that scores FR-4 plus two pairs (82.7k + 2 x 137.9k = 358.5k; a third pair needs 496.4k), so 5 cases. At the linear model it scores FR-4 plus one pair (110k + 220k = 330k), so 3 cases.

Levers for Ian (none applied here; the rubric and the Opus-scorer rule are Ian's): (1) stop after the Task 6 gate and ask for more budget; (2) script counts the keyed values and Opus scores only the hard plant and false findings (rubric change); (3) drop the per-task checkers on Tasks 3-5 (saves 72k) or on Tasks 2-5 (96k); (4) 1 run per prompt for cases 8-12 (halves their scoring); (5) a Sonnet scorer for the cases after the Task 6 gate (scorer-model rule change); (6) fewer cases, for example only the cases whose plant passes the gate. Measure the real per-dispatch cost after Task 6 and re-estimate before Task 7.

Scorer caps (sized from the table above, 20 percent over the linear-model estimate, a ceiling not an expected spend): one-case dispatch 135k tokens / 20 tool calls; two-case dispatch 265k tokens / 30 tool calls. The scorer appends one score row per answer as it goes, so a cap hit leaves a short file that the row-count check catches.

## Paid calls (every one)

- Tasks 1-5: one implementer + one checker each (Sonnet-class, 10 calls). Task 5 also one web search.
- Tasks 6-12: 7 Opus scorer dispatches (Task 6: FR-4 alone; Tasks 7-11: two cases each; Task 12: SUS-5 alone), 7 Codex read-only dispatches, and 72 prompt sends in Ian's own sandbox through the driver session (12 cases x 3 prompts x 2 runs). The sandbox sends use Workiva AI in Ian's private sandbox, as in the pilot; Ian approved the 2-run scale on 2026-10-18.
- No tune tasks (no TUNE BRIEF). No task group is marked: each build task already has 3 files or fewer and a different case set, and the run tasks need a gate between them.

## Expected breaks

none

---

### Task 1: Checker and helper scripts (red first)

**Files:**
- Create: `.ledger/2026-10-16-prompt-coach-rewrites/plants_check_all.cjs`, `plants_gate.sh`, `plants_pre.sh`, `plants_regen.sh`, `plants_append.cjs` (all in the same ledger folder)
- Read only: `prompt-coach/research/live-tests/fixtures/answer_key.json`, `.ledger/2026-10-16-prompt-coach-rewrites/plant_check.cjs` (do not touch it)

**Interfaces:**
- Produces: `node plants_check_all.cjs <live-tests dir> [CASE[,CASE...]] [--dump]`. Default checks all 13 cases. Prints `PASS <case>` or `FAIL <case>: <reason>`; exits 1 on any FAIL, 2 after printing `CRASH <message>` on any exception (bad JSON, missing vendor dir); `--dump` prints the fixture text of the named cases (scorer input) and exits 0.
- Produces: `bash plants_gate.sh <expect_rc> <pass-count|-> <fail-count|-> [CASE,CASE]` runs the checker, captures node's own exit code, counts `^PASS` and `^FAIL` lines, prints `GATE_OK` or `GATE_BAD` (exit 1).
- Produces: `bash plants_pre.sh` prints `CLEAN` or lists the dirty files under `prompt-coach/research/live-tests` and exits 1.
- Produces: `bash plants_regen.sh '<regex of owned fixture file names>' <expected file count>` runs a copy of the generator in a temp folder (never in the repo tree), copies in only the fixture files that match the regex (never an FR-2 file; the script refuses a regex that names one), checks the FR-2 blobs against b4db9ae before and after, prints `FR2_UNCHANGED_BEFORE`, `copied=<n>`, `FR2_UNCHANGED_AFTER`, `gen_rc=<n>` and `git status --short`, exits non-zero if the generator failed, the copied count differs from the expected count, or an FR-2 blob differs.
- Produces: `node plants_append.cjs <answer_key.json> < block` appends key entries (stdin block starts with `,` and has no trailing comma), validates, refuses duplicates, never changes existing entries.
- Consumes: the vendor jszip path used by `plant_check.cjs`.

- [ ] **Step 1: Write `plants_check_all.cjs`.**

```js
// node plants_check_all.cjs <live-tests dir> [CASE,CASE] [--dump]
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const JSZip = require('C:/Users/teasp/AppData/Local/Temp/prompt-coach-rewrites-4756fc2d/vendor/node_modules/jszip');
const args = process.argv.slice(2), dump = args.includes('--dump');
const pos = args.filter((a) => a !== '--dump'), dir = pos[0], only = pos[1] ? pos[1].split(',') : null;
const FILES = { 'FR-1': ['fr_flux_q3.xlsx'], 'FR-2': ['fr_revenue_footnote.docx', 'fr_trial_balance.xlsx'], 'FR-3': ['fr_mdna_draft.docx'], 'FR-4': ['fr_accruals.xlsx'], 'GRC-1': ['grc_rcm.xlsx'], 'GRC-2': ['grc_access_policy.docx'], 'GRC-3': ['grc_test_results.xlsx'], 'GRC-4': ['grc_walkthrough.docx'], 'SUS-1': ['sus_utility_invoices.pdf'], 'SUS-2': ['sus_ghg_inventory.xlsx'], 'SUS-3': ['sus_supplier_data.csv'], 'SUS-4': ['sus_climate_policy.docx'], 'SUS-5': ['sus_water_bills.pdf'] };
const FR2_BLOBS = { 'fr_trial_balance.xlsx': 'f53fe7880c70c5bf48bef98bbbaa078077145f73', 'fr_revenue_footnote.docx': 'ea4288029fb03ba0ef2b5a00b63586770b2d8b95' };
const fr2Base = () => JSON.stringify(JSON.parse(execFileSync('git', ['show', 'b4db9ae:prompt-coach/research/live-tests/fixtures/answer_key.json'], { cwd: dir, encoding: 'utf8' }))['FR-2']);
const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const tOf = (b) => unesc([...b.matchAll(/<(?:w:)?t\b[^>]*>([^<]*)<\/(?:w:)?t>/g)].map((x) => x[1]).join(''));
const colIdx = (ref) => ref.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
async function xlsxText(buf) {
  const z = await JSZip.loadAsync(buf), f = z.file('xl/sharedStrings.xml');
  const ss = f ? [...(await f.async('string')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => tOf(m[1])) : [];
  const out = [];
  for (const n of Object.keys(z.files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()) {
    const x = await z.file(n).async('string');
    for (const r of x.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [];
      for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const t = (c[1].match(/\bt="(\w+)"/) || [])[1], b = c[2] || '', ref = (c[1].match(/\br="([A-Z]+)\d+"/) || [])[1];
        let val;
        if (t === 'inlineStr') val = tOf(b);
        else { const v = (b.match(/<v>([^<]*)<\/v>/) || [])[1]; val = v === undefined ? '' : t === 's' ? ss[+v] : unesc(v); }
        cells[ref ? colIdx(ref) : cells.length] = val;
      }
      out.push(Array.from(cells, (x) => (x === undefined ? '' : x)).join(' | '));
    }
  }
  return out.join('\n');
}
async function docxText(buf) {
  const z = await JSZip.loadAsync(buf), x = await z.file('word/document.xml').async('string');
  return [...x.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)].map((m) => tOf(m[1])).join('\n');
}
const pdfText = (buf) => [...buf.toString('latin1').matchAll(/\((.*?)\) Tj/g)].map((m) => m[1].replace(/\\([()\\])/g, '$1')).join('\n');
async function textOf(file) {
  const buf = fs.readFileSync(path.join(dir, 'fixtures', file));
  if (file.endsWith('.xlsx')) return xlsxText(buf);
  if (file.endsWith('.docx')) return docxText(buf);
  if (file.endsWith('.pdf')) return pdfText(buf);
  return buf.toString('utf8');
}
const norm = (s) => s.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n');
const blob = (buf) => crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + buf.length + '\0'), buf])).digest('hex');
(async () => {
  const kf = path.join(dir, 'fixtures/answer_key.json');
  const key = JSON.parse(fs.readFileSync(kf, 'utf8'));
  const cases = only || Object.keys(FILES), texts = {};
  let bad = 0;
  const fail = (c, why) => { bad++; console.log('FAIL ' + c + ': ' + why); };
  for (const c of cases) { if (!FILES[c]) throw new Error('unknown case ' + c); texts[c] = norm((await Promise.all(FILES[c].map(textOf))).join('\n')); }
  if (dump) { for (const c of cases) console.log('=== ' + c + '\n' + texts[c]); return; }
  for (const c of cases) {
    const k = key[c], before = bad;
    if (!k) { fail(c, 'key entry missing'); continue; }
    if (c === 'FR-2') {
      if (JSON.stringify(k) !== fr2Base()) fail(c, 'FR-2 key entry differs from b4db9ae');
      for (const [f, h] of Object.entries(FR2_BLOBS)) if (blob(fs.readFileSync(path.join(dir, 'fixtures', f))) !== h) fail(c, f + ' is not byte-identical to b4db9ae');
    } else {
      if (!k.job || !Array.isArray(k.found) || !k.found.length) fail(c, 'job/found missing');
      if (!k.hard || !(k.found || []).some((f) => f.includes(k.hard))) fail(c, 'hard missing or not inside a found item');
      if (!Array.isArray(k.mustNotClaim) || !k.mustNotClaim.length) fail(c, 'mustNotClaim missing');
      if (!Array.isArray(k.proof) || !k.proof.length) fail(c, 'proof missing');
      if (k.optional !== undefined && !Array.isArray(k.optional)) fail(c, 'optional must be an array');
      if (k.counts !== undefined && !(Array.isArray(k.counts) && k.counts.every((q) => q && typeof q.match === 'string' && Number.isInteger(q.n)))) fail(c, 'counts must be [{match:string,n:int}]');
      for (const p of k.proof || []) if (!texts[c].includes(norm(p))) fail(c, 'proof not in file: ' + p);
      if (Array.isArray(k.counts)) for (const q of k.counts) {
        if (!q || typeof q.match !== 'string') continue;
        const re = new RegExp(q.match), n = texts[c].split('\n').filter((l) => re.test(l)).length;
        if (n !== q.n) fail(c, 'line count of /' + q.match + '/ is ' + n + ', key says ' + q.n);
      }
      for (const a of k.absent || []) if (texts[c].toLowerCase().includes(a.toLowerCase())) fail(c, 'absent string present: ' + a);
    }
    if (bad === before) console.log('PASS ' + c);
  }
  if (texts['GRC-1'] && texts['GRC-3']) {
    const ids = (t) => t.split('\n').map((l) => l.split(' | ')[0]).filter((x) => /^C-\d+$/.test(x)).sort().join(',');
    if (ids(texts['GRC-1']) !== ids(texts['GRC-3'])) fail('GRC-1/GRC-3', 'control IDs differ: ' + ids(texts['GRC-1']) + ' vs ' + ids(texts['GRC-3']));
    else console.log('PASS GRC-1/GRC-3 ids ' + ids(texts['GRC-1']));
  }
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('CRASH ' + e.message); process.exit(2); });
```

- [ ] **Step 2: Write the four helpers** (same ledger folder).

`plants_gate.sh`:

```bash
#!/usr/bin/env bash
# plants_gate.sh <expect_rc> <pass-count|-> <fail-count|-> [CASE,CASE]
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" || exit 99
OUT=$(node .ledger/2026-10-16-prompt-coach-rewrites/plants_check_all.cjs prompt-coach/research/live-tests $4)
RC=$?
P=$(printf '%s\n' "$OUT" | grep -c '^PASS')
F=$(printf '%s\n' "$OUT" | grep -c '^FAIL')
printf '%s\n' "$OUT" | grep -E '^(PASS|FAIL|CRASH)'
echo "node_rc=$RC pass=$P fail=$F"
ok=1
[ "$RC" = "$1" ] || ok=0
[ "$2" = "-" ] || [ "$P" = "$2" ] || ok=0
[ "$3" = "-" ] || [ "$F" = "$3" ] || ok=0
if [ "$ok" = 1 ]; then echo GATE_OK; else echo GATE_BAD; exit 1; fi
```

`plants_pre.sh`:

```bash
#!/usr/bin/env bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" || exit 99
S=$(git status --short prompt-coach/research/live-tests)
if [ -z "$S" ]; then echo CLEAN; else echo "DIRTY:"; echo "$S"; exit 1; fi
```

`plants_regen.sh`. The generator runs from a copy in a temp folder (it writes to `__dirname/fixtures`, so the temp copy writes only inside the temp folder). Only the files the task owns are copied into the repo. The two FR-2 files are never a copy target and their blobs are compared to `b4db9ae` before and after:

```bash
#!/usr/bin/env bash
# plants_regen.sh '<regex of fixture file names this task owns>' <expected number of files>
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites" || exit 99
D=prompt-coach/research/live-tests
OWN="$1"; WANT="$2"
case "$OWN" in ''|*FR-2*|*fr_trial_balance*|*fr_revenue_footnote*) echo "REFUSED: empty regex or it names an FR-2 file"; exit 98;; esac
case "$WANT" in ''|*[!0-9]*) echo "REFUSED: expected file count missing"; exit 98;; esac
fr2() { # $1 = label
  for f in fr_trial_balance.xlsx fr_revenue_footnote.docx; do
    [ "$(git hash-object $D/fixtures/$f)" = "$(git rev-parse b4db9ae:$D/fixtures/$f)" ] || { echo "FR2_CHANGED_$1 $f"; return 1; }
  done
  echo "FR2_UNCHANGED_$1"
}
fr2 BEFORE || exit 96
T=$(mktemp -d) || exit 97
cp $D/make_live_fixtures.js "$T/make_live_fixtures.js"
node "$T/make_live_fixtures.js"
G=$?
N=0
if [ "$G" = 0 ]; then
  for f in $(ls "$T/fixtures" | grep -E "$OWN" | grep -v -E '^(fr_trial_balance\.xlsx|fr_revenue_footnote\.docx)$'); do
    cp "$T/fixtures/$f" "$D/fixtures/$f" && N=$((N+1))
  done
fi
rm -rf "$T"
echo "copied=$N"
echo "gen_rc=$G"
fr2 AFTER || exit 95
git status --short $D
[ "$G" = 0 ] || exit $G
[ "$N" = "$WANT" ] || { echo "COPIED_COUNT_WRONG want=$WANT got=$N"; exit 94; }
```

`plants_append.cjs`:

```js
// node plants_append.cjs <answer_key.json> < block   (block: lines that start with ,"CASE":{...} ; no trailing comma)
const fs = require('fs');
const f = process.argv[2], block = fs.readFileSync(0, 'utf8').trim();
const old = fs.readFileSync(f, 'utf8'), oldKey = JSON.parse(old);
if (!block.startsWith(',')) { console.error('block must start with a comma'); process.exit(2); }
const t = old.trimEnd();
if (!t.endsWith('}')) { console.error('key file does not end with }'); process.exit(2); }
const next = t.slice(0, -1).trimEnd() + '\n' + block + '\n}\n';
const nk = JSON.parse(next); // throws on a stray or missing comma
const added = block.split('\n').filter((l) => l.startsWith(',"')).length;
if (Object.keys(nk).length !== Object.keys(oldKey).length + added) { console.error('duplicate or missing case key'); process.exit(3); }
for (const k of Object.keys(oldKey)) if (JSON.stringify(nk[k]) !== JSON.stringify(oldKey[k])) { console.error('existing entry changed: ' + k); process.exit(4); }
fs.writeFileSync(f, next);
console.log('appended ' + added + ' entries');
```

- [ ] **Step 3: Red run on the parent state.**
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 1 - 12`
Expected: twelve `FAIL <case>: key entry missing` lines, `PASS FR-2`, then `node_rc=1`, `GATE_OK` (the gate expects rc 1 and 12 FAIL; `GATE_BAD` means the checker did not behave).

- [ ] **Step 4: Prove the FR-2 pieces are real, and that the regen script protects FR-2.**
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 0 1 0 FR-2`
Expected: `PASS FR-2`, `node_rc=0 pass=1 fail=0`, `GATE_OK`.
Then run: `cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites && D=$(node .ledger/2026-10-16-prompt-coach-rewrites/plants_check_all.cjs prompt-coach/research/live-tests FR-2 --dump) && echo "$D" | grep -q 'Service revenue | 520' && echo "$D" | grep -q '[$]510' && echo "$D" | grep -q '[$]140' && echo "$D" | grep -q '[$]303' && echo DUMP_OK`
Expected: `DUMP_OK` (the `&&` chain stops on node's own failure because `D=$(...)` carries node's exit status).
Then run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_regen.sh 'fr_trial_balance' 0; echo regen_rc=$?`
Expected: `REFUSED: empty regex or it names an FR-2 file` and `regen_rc=98` (the script will not take an FR-2 file name).

- [ ] **Step 5: Prove the crash path and the append helper refuse bad input.**
Run: `cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites && node .ledger/2026-10-16-prompt-coach-rewrites/plants_check_all.cjs prompt-coach/research/no-such-dir; echo node_rc=$?`
Expected: a line starting `CRASH` and `node_rc=2`.
Run: `cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites && printf '%s' '"FR-1":{}' | node .ledger/2026-10-16-prompt-coach-rewrites/plants_append.cjs prompt-coach/research/live-tests/fixtures/answer_key.json; echo append_rc=$?; git status --short prompt-coach/research/live-tests`
Expected: `block must start with a comma`, `append_rc=2`, and an empty status listing (the file was not touched).

- [ ] **Step 6: No commit** (everything is in the git-ignored ledger). Note in progress.md: "Task 1 done, red at 12 FAIL, gate GATE_OK".

---

### Task 2: Plant FR-1, FR-3, FR-4

**Files:**
- Modify: `prompt-coach/research/live-tests/make_live_fixtures.js` lines 11, 14, 15
- Modify: `prompt-coach/research/live-tests/fixtures/answer_key.json` (append 3 entries via `plants_append.cjs`; FR-2 text untouched)
- Regenerated (copied in from the temp run): `fixtures/fr_flux_q3.xlsx`, `fixtures/fr_mdna_draft.docx`, `fixtures/fr_accruals.xlsx`

**Interfaces:** Consumes the Task 1 scripts and entry shape. Produces keys `FR-1`, `FR-3`, `FR-4`.

- [ ] **Step 1: Preflight and red check.**
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_pre.sh && bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 1 0 3 FR-1,FR-3,FR-4`
Expected: `CLEAN`, three `FAIL ...: key entry missing`, `GATE_OK`.

- [ ] **Step 2: Replace generator line 11** (FR-1) with:

```js
xlsx('fr_flux_q3.xlsx', 'Summary', [['Account', 'Q2 FY26', 'Q3 FY26', 'Change', 'Note'], ['Revenue', 1200, 1310, 110], ['Cost of revenue', 480, 505, 25], ['SG&A', 210, 268, 58], ['R&D', 150, 152, 2], ['Interest expense', 12, 12, 0], [], ['SG&A detail', 'Q2 FY26', 'Q3 FY26', 'Change', 'Note'], ['SG&A - Salaries', 110, 138, 28], ['SG&A - Marketing', 60, 81, 21], ['SG&A - Legal fees', 25, 34, 9, 'Includes 7 one-time settlement'], ['SG&A - Other', 15, 15, 0]]);
```

- [ ] **Step 3: Replace generator line 14** (FR-3, one paragraph so every number belongs to the paragraph to shorten) with:

```js
doc('fr_mdna_draft.docx', 'MD&A draft: Liquidity', ['Liquidity. As of the quarter end, Example Co held cash and cash equivalents of $412 million, of which $38 million was held by foreign subsidiaries, and had no borrowings outstanding under its $250 million revolving credit facility. Our $300 million of senior notes due 2029 remain outstanding. We believe existing cash, together with cash from operations, is sufficient to meet our needs for at least the next twelve months.']);
```

- [ ] **Step 4: Replace generator line 15** (FR-4) with:

```js
xlsx('fr_accruals.xlsx', 'Accruals', [['Entry', 'Account', 'Amount', 'Memo'], ['JE-101', 'Accrued bonus', 40, 'Q3 bonus'], ['JE-102', 'Accrued legal', 5, 'Routine'], ['JE-103', 'Accrued legal', 480, ''], ['JE-104', 'Accrued freight', 12, 'Sep freight'], ['JE-105', 'Accrued bonus', 40, 'Q3 bonus'], ['JE-106', 'Accrued freight', 12, 'Sept freight']]);
```

- [ ] **Step 5: Append the three key entries** (the block starts with a comma, ends without one; the helper adds the closing brace). Row-ending values are pinned by whole-line `counts`, not by substring proofs (480 would otherwise match a populated memo cell):

```bash
cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites && node .ledger/2026-10-16-prompt-coach-rewrites/plants_append.cjs prompt-coach/research/live-tests/fixtures/answer_key.json <<'EOF'
,"FR-1": {"job":"Explain what drove SG&A from Q2 to Q3 using only the flux file","found":["SG&A rose 58 (210 to 268)","Salaries +28 (110 to 138)","Marketing +21 (60 to 81)","Legal fees +9 (25 to 34); the note says Q3 includes 7 one-time settlement, so about 2 of the rise is left if Q2 had no such item (Q2 is not stated)"],"hard":"Legal fees +9","optional":["Other 0 (no change)"],"mustNotClaim":["R&D or interest expense named as a driver of SG&A","a cause for the salaries rise (hiring, raises) stated as fact","all 9 of legal fees called one-time"],"proof":["SG&A detail | Q2 FY26 | Q3 FY26 | Change | Note","Includes 7 one-time settlement"],"counts":[{"match":"^SG&A - ","n":4},{"match":"^SG&A - Salaries [|] 110 [|] 138 [|] 28$","n":1},{"match":"^SG&A - Marketing [|] 60 [|] 81 [|] 21$","n":1},{"match":"^SG&A - Legal fees [|] 25 [|] 34 [|] 9 [|] Includes 7 one-time settlement$","n":1},{"match":"^SG&A - Other [|] 15 [|] 15 [|] 0( [|])?$","n":1}],"absent":["headcount","hiring"]}
,"FR-3": {"job":"Shorten the liquidity paragraph and keep every number","found":["412 million cash","38 million held by foreign subsidiaries","250 million revolving credit facility, no borrowings under it","300 million senior notes due 2029 still outstanding","twelve months"],"hard":"38 million held by foreign subsidiaries","optional":[],"mustNotClaim":["no debt or debt-free (the notes are outstanding; only the revolver is undrawn)","a number dropped or a unit changed ($412 without million, $0.4 billion)","added facts: covenants, interest rates, ratings"],"proof":["$412 million","$38 million","$250 million","no borrowings outstanding under its $250 million revolving credit facility","$300 million of senior notes due 2029","twelve months"],"absent":["debt-free"]}
,"FR-4": {"job":"Find unusual accruals in the ledger extract","found":["JE-103 Accrued legal 480, no memo, against 5 for routine legal (JE-102)","JE-101 and JE-105 possible duplicate to verify: Accrued bonus 40, memo Q3 bonus, different entry numbers","JE-104 and JE-106 possible near-duplicate to verify: Accrued freight 12, memos Sep freight and Sept freight"],"hard":"JE-104 and JE-106 possible near-duplicate","optional":[],"mustNotClaim":["JE-102 (5, Routine) flagged as unusual","any value corrected or restated"],"proof":["Entry | Account | Amount | Memo"],"counts":[{"match":"^JE-10[1-6] [|]","n":6},{"match":"^JE-102 [|] Accrued legal [|] 5 [|] Routine$","n":1},{"match":"^JE-103 [|] Accrued legal [|] 480( [|])?$","n":1},{"match":"^JE-10[15] [|] Accrued bonus [|] 40 [|] Q3 bonus$","n":2},{"match":"^JE-104 [|] Accrued freight [|] 12 [|] Sep freight$","n":1},{"match":"^JE-106 [|] Accrued freight [|] 12 [|] Sept freight$","n":1}],"absent":[]}
EOF
```

Expected: `appended 3 entries`, exit 0. Then run `node -e "JSON.parse(require('fs').readFileSync('prompt-coach/research/live-tests/fixtures/answer_key.json','utf8'));console.log('JSON_OK')"` from ROOT; expected `JSON_OK`.

- [ ] **Step 6: Regenerate (temp run, copy in the three owned files only), then run the gate.**
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_regen.sh 'fr_flux_q3|fr_mdna_draft|fr_accruals' 3 && bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 0 4 0 FR-1,FR-2,FR-3,FR-4`
Expected: `FR2_UNCHANGED_BEFORE`, `copied=3`, `gen_rc=0`, `FR2_UNCHANGED_AFTER`; the status lists only `make_live_fixtures.js`, `answer_key.json`, `fr_flux_q3.xlsx`, `fr_mdna_draft.docx`, `fr_accruals.xlsx` as modified; then `PASS FR-1`, `PASS FR-2`, `PASS FR-3`, `PASS FR-4`, `node_rc=0 pass=4 fail=0`, `GATE_OK`. (The plan file itself is outside `live-tests`, so it does not show.)

- [ ] **Step 7: Commit** `git add` those five paths; message `Prompt coach live test: plant known answers in FR-1, FR-3, FR-4` plus the two trailer lines.

```rehearse
T=$(mktemp -d)
cp prompt-coach/research/live-tests/make_live_fixtures.js "$T/make_live_fixtures.js"
node "$T/make_live_fixtures.js"
cp "$T/fixtures/fr_flux_q3.xlsx" "$T/fixtures/fr_mdna_draft.docx" "$T/fixtures/fr_accruals.xlsx" prompt-coach/research/live-tests/fixtures/
```

---

### Task 3: Plant GRC-1, GRC-2, GRC-3, GRC-4

**Files:**
- Modify: `prompt-coach/research/live-tests/make_live_fixtures.js` lines 16-19
- Modify: `prompt-coach/research/live-tests/fixtures/answer_key.json` (append 4 entries via `plants_append.cjs`)
- Regenerated (copied in from the temp run): `fixtures/grc_rcm.xlsx`, `grc_access_policy.docx`, `grc_test_results.xlsx`, `grc_walkthrough.docx`

**Interfaces:** Keys `GRC-1..4`. RCM and results must list the same IDs C-01 to C-06 (checker enforces).

- [ ] **Step 1: Preflight and red check.**
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_pre.sh && bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 1 - 4 GRC-1,GRC-2,GRC-3,GRC-4`
Expected: `CLEAN`, four `FAIL ...: key entry missing`, `GATE_OK`.

- [ ] **Step 2: Replace generator lines 16-19** with:

```js
xlsx('grc_rcm.xlsx', 'Controls', [['Control ID', 'Description', 'Owner', 'Frequency', 'Key control'], ['C-01', 'Journal entry review', 'Controller', 'Monthly', 'Yes'], ['C-02', 'Access recertification', '', 'Quarterly', 'Yes'], ['C-03', 'Bank reconciliation', 'Treasury lead', '', 'Yes'], ['C-04', 'Vendor master change approval', '', '', 'No'], ['C-05', 'Revenue cutoff review', 'Revenue accountant', 'Monthly', 'Yes'], ['C-06', 'Inventory count', 'TBD', 'Annual', 'Yes']]);
doc('grc_access_policy.docx', 'Access Policy', ['Purpose. This policy sets rules for access to finance systems.', 'Access requests must be approved by the system owner.', 'Accounts are reviewed when needed.', 'Terminated users should lose access.', 'In an emergency, any manager may grant access by phone or email, and no ticket is required.']);
xlsx('grc_test_results.xlsx', 'Testing', [['Control ID', 'Result', 'Deficiency type', 'Note'], ['C-01', 'Pass', '', 'One exception in 25 samples, within tolerance'], ['C-02', 'Fail', 'Design', 'No owner named'], ['C-03', 'Fail', 'Operating', 'Two months late'], ['C-04', 'Fail', 'Design', 'No frequency'], ['C-05', 'Pass', '', ''], ['C-06', 'Not tested', '', 'Scheduled for Q4']]);
doc('grc_walkthrough.docx', 'Walkthrough: Vendor payments', ['The AP clerk enters the invoice and matches it to the purchase order.', 'The AP supervisor approves any invoice above the approval limit in the payment system.', 'Treasury releases the payment run each Thursday.', 'The same AP clerk also updates vendor bank details when a vendor sends a change request.']);
```

- [ ] **Step 3: Append the four key entries.** Counts pin the six controls, the Yes/No split, the Pass/Fail/Not tested split and the whole line of every row that ends on a value or blank (`C-05 | Pass` may lose its trailing blank cells, hence `( [|]|$)`):

```bash
cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites && node .ledger/2026-10-16-prompt-coach-rewrites/plants_append.cjs prompt-coach/research/live-tests/fixtures/answer_key.json <<'EOF'
,"GRC-1": {"job":"List key controls in the RCM with no owner; flag any missing frequency","found":["Key controls with no owner: C-02 Access recertification (blank) and C-06 Inventory count (owner reads TBD)","Missing frequency: C-03 Bank reconciliation (key) and C-04 Vendor master change approval (not key)","C-04 has no owner and no frequency but Key control = No, so it is not a key control without an owner"],"hard":"C-06 Inventory count (owner reads TBD)","optional":[],"mustNotClaim":["C-01 or C-05 listed","C-04 listed as a key control","TBD accepted as a named owner"],"proof":["C-01 | Journal entry review | Controller | Monthly | Yes","C-02 | Access recertification | | Quarterly | Yes","C-03 | Bank reconciliation | Treasury lead | | Yes","C-05 | Revenue cutoff review | Revenue accountant | Monthly | Yes"],"counts":[{"match":"^C-0[1-6] [|]","n":6},{"match":"[|] Yes$","n":5},{"match":"[|] No$","n":1},{"match":"^C-04 [|] Vendor master change approval [|] [|] [|] No$","n":1},{"match":"^C-06 [|] Inventory count [|] TBD [|] Annual [|] Yes$","n":1}],"absent":[]}
,"GRC-2": {"job":"Review the access policy for gaps against SOX ITGC expectations","found":["Reviews happen 'when needed': no frequency","Terminated users 'should' lose access: no deadline, not a must","Emergency access: any manager, by phone or email, no ticket; no after-the-fact review requirement stated; an exception to the system-owner approval rule whose safeguards need review"],"hard":"Emergency access","optional":["Gaps the policy does not mention at all (password rule, privileged access, segregation of duties) named as missing, not as quoted clauses"],"mustNotClaim":["the policy sets a review frequency, a termination deadline, a password rule or an after-the-fact review","quotes of clauses that are not in the policy"],"proof":["Access requests must be approved by the system owner.","Accounts are reviewed when needed.","Terminated users should lose access.","any manager may grant access by phone or email, and no ticket is required"],"absent":["password","privileged","segregation","quarterly","annual"]}
,"GRC-3": {"job":"Summarize the deficiencies for the audit committee, keeping figures exact","found":["3 deficiencies, not more: C-02 Design (No owner named), C-03 Operating (Two months late), C-04 Design (No frequency); C-01's single exception within tolerance and C-06 Not tested are not deficiencies","2 Design, 1 Operating"],"hard":"3 deficiencies, not more","optional":["5 controls tested, 3 failed, 2 passed (6 listed, 1 not tested)","C-06 Not tested (Scheduled for Q4): neither pass nor fail","C-01 Pass with One exception in 25 samples, within tolerance"],"mustNotClaim":["a severity rating (material weakness, significant deficiency)","a dollar amount or any wrong figure (correct derived counts and percentages with the right denominator are fine)","4 deficiencies, '3 of 6 tested' or a 50 percent failure rate","C-01 or C-06 called a deficiency or failed"],"proof":["Control ID | Result | Deficiency type | Note","C-01 | Pass | | One exception in 25 samples, within tolerance"],"counts":[{"match":"^C-0[1-6] [|]","n":6},{"match":"[|] Fail [|]","n":3},{"match":"[|] Pass( [|]|$)","n":2},{"match":"[|] Not tested [|]","n":1},{"match":"[|] Design [|]","n":2},{"match":"[|] Operating [|]","n":1},{"match":"^C-02 [|] Fail [|] Design [|] No owner named$","n":1},{"match":"^C-03 [|] Fail [|] Operating [|] Two months late$","n":1},{"match":"^C-04 [|] Fail [|] Design [|] No frequency$","n":1},{"match":"^C-06 [|] Not tested [|] [|] Scheduled for Q4$","n":1}],"absent":["material weakness"]}
,"GRC-4": {"job":"Turn the walkthrough into numbered test steps with evidence per step","found":["Step 1: AP clerk enters the invoice and matches it to the PO","Step 2: AP supervisor approves any invoice above the approval limit","Step 3: Treasury releases the payment run each Thursday","Evidence proposed for each of the 3 steps (for example invoice and PO match record; approval record for invoices above the limit; payment run release log); proposed evidence is not a fact claim","Open questions: approval limit amount not stated; Treasury releaser not named; no approval stated below the limit","Potential segregation-of-duties risk to follow up: the same AP clerk enters invoices and updates vendor bank details (independent approval of bank changes not stated); conditional wording is accepted"],"hard":"the same AP clerk enters invoices and updates vendor bank details","optional":[],"mustNotClaim":["a dollar approval limit","a named person, or an owner or role not in the walkthrough","a goods-receipt or three-way-match step","a day other than Thursday"],"proof":["The AP clerk enters the invoice and matches it to the purchase order.","The AP supervisor approves any invoice above the approval limit in the payment system.","Treasury releases the payment run each Thursday.","The same AP clerk also updates vendor bank details when a vendor sends a change request."],"counts":[{"match":"^(The AP clerk enters|The AP supervisor approves|Treasury releases) ","n":3},{"match":"^The same AP clerk also ","n":1}],"absent":["$","receiving","three-way"]}
EOF
```

Expected: `appended 4 entries`. Then from ROOT run `node -e "JSON.parse(require('fs').readFileSync('prompt-coach/research/live-tests/fixtures/answer_key.json','utf8'));console.log('JSON_OK')"`; expected `JSON_OK`.

- [ ] **Step 4: Regenerate (temp run, copy in the four owned files only), then run the gate.**
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_regen.sh 'grc_' 4 && bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 0 6 0 GRC-1,GRC-2,GRC-3,GRC-4,FR-2`
Expected: `FR2_UNCHANGED_BEFORE`, `copied=4`, `gen_rc=0`, `FR2_UNCHANGED_AFTER`; status lists generator, key and the four grc files only; `PASS GRC-1`, `PASS GRC-2`, `PASS GRC-3`, `PASS GRC-4`, `PASS FR-2`, `PASS GRC-1/GRC-3 ids C-01,C-02,C-03,C-04,C-05,C-06`, `node_rc=0 pass=6 fail=0`, `GATE_OK`. The `C-02 | Access recertification | | Quarterly | Yes` proof is what shows the blank Owner column landed in the right place; if it fails, run `--dump GRC-1` and fix the column logic, not the proof.

- [ ] **Step 5: Commit** those six paths; message `Prompt coach live test: plant known answers in GRC-1 to GRC-4` plus trailers.

```rehearse
T=$(mktemp -d)
cp prompt-coach/research/live-tests/make_live_fixtures.js "$T/make_live_fixtures.js"
node "$T/make_live_fixtures.js"
cp "$T/fixtures/grc_rcm.xlsx" "$T/fixtures/grc_access_policy.docx" "$T/fixtures/grc_test_results.xlsx" "$T/fixtures/grc_walkthrough.docx" prompt-coach/research/live-tests/fixtures/
```

---

### Task 4: Plant SUS-1, SUS-2, SUS-3

**Files:**
- Modify: `prompt-coach/research/live-tests/make_live_fixtures.js` lines 20-22
- Modify: `prompt-coach/research/live-tests/fixtures/answer_key.json` (append 3 entries via `plants_append.cjs`)
- Regenerated (copied in from the temp run): `fixtures/sus_utility_invoices.pdf`, `sus_ghg_inventory.xlsx`, `sus_supplier_data.csv`

- [ ] **Step 1: Preflight and red check.**
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_pre.sh && bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 1 0 3 SUS-1,SUS-2,SUS-3`
Expected: `CLEAN`, three `FAIL ...: key entry missing`, `GATE_OK`.

- [ ] **Step 2: Replace generator lines 20-22** with:

```js
pdf('sus_utility_invoices.pdf', [['Example Power Co - Invoice', 'Account: 000-111', 'Service address: 100 Sample Street', 'Service period: 9/1/2018 - 9/30/2018', 'Usage: 12,400 kWh', 'Amount due: USD 1,488.00'], ['Example Gas Co - Invoice', 'Account: 000-222', 'Service address: 100 Sample Street', 'Transaction date: 9/18/2018', 'Usage: 310 therms', 'Amount due: USD 372.50'], ['Example Power Co - Invoice', 'Account: 000-333', 'Service period: 9/1/2018 - 9/30/2018', 'Service address: 200 Sample Avenue', 'Usage: 5,000 kWh', 'Charge: USD 600.00', 'Service address: 210 Sample Avenue', 'Usage: 3,050 kWh', 'Charge: USD 366.00', 'Amount due: USD 966.00'], ['Example Power Co - Invoice', 'Account: 000-111', 'Service address: 100 Sample Street', 'Service period: 10/1/2018 - 10/31/2018', 'Usage: 12,900 kWh', 'Amount due: CAD 1,548.00']]);
xlsx('sus_ghg_inventory.xlsx', 'Scope 3', [['Category', 'FY2024 (tCO2e)', 'FY2025 (tCO2e)', 'Note'], ['Purchased goods', 5200, 5350], ['Business travel', 310, 295], ['Employee commuting', 410, 4100], ['Waste', 90, 88], ['Upstream transport', 150, 142], ['Leased assets', 60, 0.061, 'FY2025 in ktCO2e']]);
SPECS.push({ kind: 'csv', name: 'sus_supplier_data.csv', text: 'Supplier,Country,Emissions tCO2e\nExample Supplier A,US,120\nExample Supplier B,DE,\nExample Supplier C,PL,45\nExample Supplier D,US,\nExample Supplier E,MX,300\nExample Supplier F,FR,0\nExample Supplier G,IT,n/a\n' });
```

- [ ] **Step 3: Append the three key entries.** The SUS-3 proof is the whole file as one multi-line string, so each empty cell is anchored by the next line; `counts` adds the exact line counts (7 suppliers, 2 lines ending on a comma). Value-ending lines in SUS-1, SUS-2 are pinned by whole-line counts:

```bash
cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites && node .ledger/2026-10-16-prompt-coach-rewrites/plants_append.cjs prompt-coach/research/live-tests/fixtures/answer_key.json <<'EOF'
,"SUS-1": {"job":"Put the invoices into the table: first of month, one row per address, citation per row, state the invoice count","found":["4 invoices stated (1 document holding 4 invoices is accepted)","9/1/2018 | 100 Sample Street | electricity | 12,400 kWh | 1,488.00 USD","9/1/2018 | 100 Sample Street | gas | 310 therms | 372.50 USD","9/1/2018 | 200 Sample Avenue | electricity | 5,000 kWh | 600.00 USD and 9/1/2018 | 210 Sample Avenue | electricity | 3,050 kWh | 366.00 USD (invoice 3 split)","10/1/2018 | 100 Sample Street | electricity | 12,900 kWh | 1,548.00 CAD"],"hard":"invoice 3 split","optional":[],"mustNotClaim":["3 invoices counted","one row of 8,050 kWh and 966 for invoice 3","CAD shown as USD or converted","therms converted to kWh"],"proof":["Service period: 10/1/2018 - 10/31/2018","Service address: 210 Sample Avenue"],"counts":[{"match":"^Example (Power|Gas) Co - Invoice$","n":4},{"match":"^Service address: ","n":5},{"match":"^Service address: 210 Sample Avenue$","n":1},{"match":"^Usage: ","n":5},{"match":"^Usage: 12,400 kWh$","n":1},{"match":"^Usage: 310 therms$","n":1},{"match":"^Usage: 5,000 kWh$","n":1},{"match":"^Usage: 3,050 kWh$","n":1},{"match":"^Usage: 12,900 kWh$","n":1},{"match":"^Amount due: (USD|CAD) ","n":4},{"match":"^Amount due: USD 1,488[.]00$","n":1},{"match":"^Amount due: USD 372[.]50$","n":1},{"match":"^Amount due: USD 966[.]00$","n":1},{"match":"^Amount due: CAD 1,548[.]00$","n":1},{"match":"^Charge: USD 600[.]00$","n":1},{"match":"^Charge: USD 366[.]00$","n":1},{"match":"CAD","n":1}],"absent":[]}
,"SUS-2": {"job":"List Scope 3 outliers without correcting values","found":["Employee commuting FY2025 4100 against FY2024 410: 10 times, likely an extra digit (hypothesis)","Leased assets 60 to 0.061: the row note says FY2025 is in ktCO2e while the header says tCO2e; read as kt it is 61 t, comparable with 60, so a unit mix to flag, not a real 99.9 percent fall"],"hard":"Leased assets 60 to 0.061","optional":[],"mustNotClaim":["Leased assets reported as a real collapse","Purchased goods flagged only because it is large","4100 stated as corrected to 410"],"proof":["Category | FY2024 (tCO2e) | FY2025 (tCO2e) | Note"],"counts":[{"match":"^(Purchased goods|Business travel|Employee commuting|Waste|Upstream transport|Leased assets) [|]","n":6},{"match":"^Employee commuting [|] 410 [|] 4100$","n":1},{"match":"^Leased assets [|] 60 [|] 0[.]061 [|] FY2025 in ktCO2e$","n":1}],"absent":[]}
,"SUS-3": {"job":"Extract every supplier with missing emissions data into a table; say so rather than guess","found":["Example Supplier B (DE): blank","Example Supplier D (US): blank","Example Supplier G (IT): cell reads n/a, text not a number","3 missing of 7 suppliers; Example Supplier F (FR) reports 0, a value, not missing"],"hard":"Example Supplier G (IT)","optional":[],"mustNotClaim":["Example Supplier F listed as missing without saying 0 is a reported value","any estimated emissions value","a count of 4 missing"],"proof":["Supplier,Country,Emissions tCO2e\nExample Supplier A,US,120\nExample Supplier B,DE,\nExample Supplier C,PL,45\nExample Supplier D,US,\nExample Supplier E,MX,300\nExample Supplier F,FR,0\nExample Supplier G,IT,n/a"],"counts":[{"match":"^Example Supplier [A-G],","n":7},{"match":",$","n":2},{"match":"^Example Supplier B,DE,$","n":1},{"match":"^Example Supplier D,US,$","n":1},{"match":"^Example Supplier F,FR,0$","n":1},{"match":"^Example Supplier G,IT,n/a$","n":1}],"absent":[]}
EOF
```

Expected: `appended 3 entries`. Then from ROOT run `node -e "JSON.parse(require('fs').readFileSync('prompt-coach/research/live-tests/fixtures/answer_key.json','utf8'));console.log('JSON_OK')"`; expected `JSON_OK`.

- [ ] **Step 4: Regenerate (temp run, copy in the three owned files only), then run the gate.**
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_regen.sh 'sus_utility_invoices|sus_ghg_inventory|sus_supplier_data' 3 && bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 0 4 0 SUS-1,SUS-2,SUS-3,FR-2`
Expected: `FR2_UNCHANGED_BEFORE`, `copied=3`, `gen_rc=0`, `FR2_UNCHANGED_AFTER`; status lists generator, key and the three sus files only; `PASS SUS-1`, `PASS SUS-2`, `PASS SUS-3`, `PASS FR-2`, `node_rc=0 pass=4 fail=0`, `GATE_OK`. If a `Usage: ...` or `Amount due: ...` count fails because the PDF text differs, run `--dump SUS-1` and fix the regex to the real line (same value, same count).

- [ ] **Step 5: Commit** those five paths; message `Prompt coach live test: plant known answers in SUS-1 to SUS-3` plus trailers.

```rehearse
T=$(mktemp -d)
cp prompt-coach/research/live-tests/make_live_fixtures.js "$T/make_live_fixtures.js"
node "$T/make_live_fixtures.js"
cp "$T/fixtures/sus_utility_invoices.pdf" "$T/fixtures/sus_ghg_inventory.xlsx" "$T/fixtures/sus_supplier_data.csv" prompt-coach/research/live-tests/fixtures/
```

---

### Task 5: Plant SUS-4, SUS-5, README line, full check

**Files:**
- Modify: `prompt-coach/research/live-tests/make_live_fixtures.js` lines 23-24
- Modify: `prompt-coach/research/live-tests/fixtures/answer_key.json` (append 2 entries via `plants_append.cjs`)
- Modify: `prompt-coach/README.md` line 81 (one sentence)
- Regenerated (copied in from the temp run): `fixtures/sus_climate_policy.docx`, `fixtures/sus_water_bills.pdf`

- [ ] **Step 1: Preflight and red check.**
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_pre.sh && bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 1 0 2 SUS-4,SUS-5`
Expected: `CLEAN`, two `FAIL ...: key entry missing`, `GATE_OK`.

- [ ] **Step 2: Confirm the ESRS E1 ids and what E1-8 asks** with one web search (ESRS E1 disclosure requirements: E1-1 transition plan, E1-4 targets, E1-6 gross Scopes 1, 2, 3 emissions, E1-8 internal carbon pricing, E1-9 anticipated financial effects). If any id is wrong, or E1-8 turns out not to fit a "no internal carbon price" statement, fix the SUS-4 key in Step 4 before writing it and say so in the commit body. Record the source URL in progress.md.

- [ ] **Step 3: Replace generator lines 23-24** with:

```js
doc('sus_climate_policy.docx', 'Climate Policy', ['Example Co will measure and report its Scope 1, 2 and 3 emissions each year.', 'The company has set a target to cut Scope 1 and 2 emissions by 42 percent by 2030 from a 2022 base.', 'The board reviews climate risks once a year.', 'No internal carbon price is currently used.']);
pdf('sus_water_bills.pdf', [['Example Water Co - Bill', 'Service address: 100 Sample Street', 'Service period: 2/1/2019 - 2/28/2019', 'Bill date: 3/12/2019', 'Usage: 42 kgal', 'Amount due: USD 310.00'], ['Example Water Co - Bill', 'Service address: 200 Sample Avenue', 'Service period: 2/1/2019 - 2/28/2019', 'Bill date: 3/12/2019', 'Usage: 17 CCF', 'Amount due: USD 128.40'], ['Example Water Co - Bill', 'Service address: 100 Sample Street', 'Service period: 3/1/2019 - 3/31/2019', 'Bill date: 4/12/2019', 'Usage: 39 kgal', 'Amount due: USD 287.10']]);
```

- [ ] **Step 4: Append the two key entries.** SUS-5 usage, amount and period lines are pinned by whole-line counts (3 bills, 3 usage lines), so `42 kgal` cannot match `420 kgal`:

```bash
cd C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-rewrites && node .ledger/2026-10-16-prompt-coach-rewrites/plants_append.cjs prompt-coach/research/live-tests/fixtures/answer_key.json <<'EOF'
,"SUS-4": {"job":"Map the climate policy to ESRS E1; mark unsure mappings as needing review","found":["Measure and report Scope 1, 2 and 3 each year -> E1-6","Cut Scope 1 and 2 by 42 percent by 2030 from a 2022 base -> E1-4 (targets), Scope 1 and 2 only","Board reviews climate risks once a year -> governance of climate risk, marked needs review","No internal carbon price is currently used -> relates to E1-8 (internal carbon pricing) as a negative statement: no price is applied; the mapping may be marked for review"],"hard":"No internal carbon price","optional":[],"mustNotClaim":["the 42 percent target covers Scope 3 or all emissions","another percent, year or base year","a carbon price said to be used or set","E1-1 (transition plan) or E1-9 (financial effects) called covered"],"proof":["Scope 1 and 2 emissions by 42 percent by 2030 from a 2022 base","No internal carbon price is currently used.","The board reviews climate risks once a year."],"absent":["net zero","transition plan"]}
,"SUS-5": {"job":"Water bills: dates, location, usage, amount, one row per bill and address","found":["100 Sample Street | 2/1/2019-2/28/2019 | 42 kgal | USD 310.00","200 Sample Avenue | 2/1/2019-2/28/2019 | 17 CCF | USD 128.40 (unit CCF kept, not silently converted)","100 Sample Street | 3/1/2019-3/31/2019 | 39 kgal | USD 287.10 (same address, a separate row)"],"hard":"17 CCF","optional":[],"mustNotClaim":["rows 1 and 3 merged","CCF turned into kgal without saying so, or 42 and 17 summed","bill date used with no service period"],"proof":["Service address: 200 Sample Avenue","Bill date: 4/12/2019"],"counts":[{"match":"^Example Water Co - Bill$","n":3},{"match":"^Service address: ","n":3},{"match":"^Service address: 100 Sample Street$","n":2},{"match":"^Service period: 2/1/2019 - 2/28/2019$","n":2},{"match":"^Service period: 3/1/2019 - 3/31/2019$","n":1},{"match":"^Usage: ","n":3},{"match":"^Usage: 42 kgal$","n":1},{"match":"^Usage: 17 CCF$","n":1},{"match":"^Usage: 39 kgal$","n":1},{"match":"^Amount due: USD 310[.]00$","n":1},{"match":"^Amount due: USD 128[.]40$","n":1},{"match":"^Amount due: USD 287[.]10$","n":1}],"absent":[]}
EOF
```

Expected: `appended 2 entries`. Then from ROOT run `node -e "JSON.parse(require('fs').readFileSync('prompt-coach/research/live-tests/fixtures/answer_key.json','utf8'));console.log('JSON_OK')"`; expected `JSON_OK`.

- [ ] **Step 5: README** line 81: after "the files by `VENDOR=<npm dir> node make_live_fixtures.js`" add "; each file carries planted answers listed in `fixtures/answer_key.json`".

- [ ] **Step 6: Regenerate (temp run, copy in the two owned files only), then run the full gate.**
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_regen.sh 'sus_climate_policy|sus_water_bills' 2 && bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 0 14 0`
Expected: `FR2_UNCHANGED_BEFORE`, `copied=2`, `gen_rc=0`, `FR2_UNCHANGED_AFTER`; status lists generator, key, README and the two fixture files only; `node_rc=0 pass=14 fail=0` (13 cases plus the GRC-1/GRC-3 id line), `GATE_OK`.

- [ ] **Step 7: Commit** those five paths; message `Prompt coach live test: plant known answers in SUS-4, SUS-5; note the key in the README` plus trailers. The lead then runs `--dump` for each case into `LOGS/<case>_fixture_text.txt` (scorer input).

```rehearse
T=$(mktemp -d)
cp prompt-coach/research/live-tests/make_live_fixtures.js "$T/make_live_fixtures.js"
node "$T/make_live_fixtures.js"
cp "$T/fixtures/sus_climate_policy.docx" "$T/fixtures/sus_water_bills.pdf" prompt-coach/research/live-tests/fixtures/
```

---

## Run protocol (Tasks 6-12)

Applies to every run task. Logs live in `.ledger/2026-10-16-prompt-coach-rewrites/logs/` (call it LOGS).

- **Prompts:** the three texts per case are from `cases.md`: Original (P1), Strong at 73be350 (P2), Strong now (P3). Fill every blank with the same text in both Strong prompts of a case. FR cases: `the quarterly close review`; FR-3 also `[target length]` = `about 50 words`. GRC cases: `our SOX control testing`; GRC-3 `[number]` = `3`, `[length]` = `150 words`. SUS cases: the single phrase `our CSRD climate disclosure review` in every audience, purpose and feeds blank of both Strong prompts (it reads in "The audience is ...", "This is for ..." and "This table feeds ..." and is true for all five SUS tasks); SUS-5 `[what you want back...]` = `the readings for each bill`. The P1 original has no blanks.
- **Sends:** the driver (session 4a3e4556 or its successor, Chrome, Ian's own sandbox, private folder "Prompt coach test - Ian") uploads the case file (Upload, not Import; needs the `/add-dir` for fixtures that Ian already ran), then per prompt opens a fresh chat, picks the file with `@`, sends. 3 prompts x 2 runs = 6 fresh chats per case, order P1 P2 P3 run 1, then P1 P2 P3 run 2. No clarification is answered; a clarifying question is logged as the answer with `clarify: Y`. A re-planted file is uploaded under a versioned name (for example `fr_accruals_v2.xlsx`) because nothing is deleted in the sandbox, and the driver logs the file name it picked in every chat.
- **Log format** (`LOGS/live_<CASE>.md`), one block per chat: a `## P<n> run <r>` heading, then `File picked: <name>`, then `Prompt sent:` followed by a fenced block holding the exact filled text that was pasted, then `Answer:` and the answer verbatim, then `clarify: Y` or `clarify: N`.
- **Never:** change sandbox settings, share, delete anything in the sandbox, send to the org sandbox, or use real data.
- **Scorer (Opus agent; caps: one-case dispatch 135k tokens / 20 tool calls, two-case dispatch 265k tokens / 30 tool calls, sized from the Budget table):** inputs `LOGS/live_<CASE>.md` (it holds the exact prompt sent with each answer), `LOGS/<case>_fixture_text.txt` (from `plants_check_all.cjs ... <CASE> --dump`, run by the lead), and the case's entry in `answer_key.json`. It appends one row per answer as it goes. Per answer: found (keyed `found` items reported with all values right, list which; `optional` items credited when stated), false findings (a statement that contradicts the file, an unsupported factual claim, or a listed `mustNotClaim` item; quote each), valid extra findings (true statements about the file, valid open questions or proposed evidence that are not in the key; counted in their own column, never as false), hard found Y/N, table or format asked (1/0, judged against the prompt sent in that chat), invented facts (1 if none absent from the file; quote any), clarify Y/N, right source, one job, usable format. Output `LOGS/live_<CASE>_scores.md` in the FR-2 table layout plus the extra column.
- **Codex check (per scorer dispatch):** `codex exec` read-only, no shell. The lead copies `LOGS/codex_fr2_prompt.txt` (read as a template, never written) to a new `LOGS/codex_<CASE>_prompt.txt` and rewrites that copy with this case's rubric, key, fixture text and answers (with each sent prompt) inline; output to `LOGS/codex_<CASE>_out.txt` (the lead redirects it). `logs/codex_fr2_*` stays untouched. Disagreements with the Opus scorer are listed, not averaged.
- **Gate (every case):** the Task 6 Step 6 table applies to each case's scores. A case that does not PASS stops the run before the next task: the lead tells Ian and waits.

### Task 6: Run, score and gate the first case (FR-4)

**Files:** Create (ledger, not committed): `LOGS/live_FR-4.md`, `LOGS/FR-4_fixture_text.txt`, `LOGS/live_FR-4_scores.md`, `LOGS/codex_FR-4_prompt.txt`, `LOGS/codex_FR-4_out.txt`.

- [ ] **Step 1: Lead checks the committed fixtures** (Tasks 2-5 done).
Run: `bash .ledger/2026-10-16-prompt-coach-rewrites/plants_gate.sh 0 14 0`
Expected: `node_rc=0 pass=14 fail=0`, `GATE_OK` (a crash or a bad key file gives `CRASH` and `GATE_BAD`, never a silent zero).
- [ ] **Step 2: Fixture text.** Run `node .ledger/2026-10-16-prompt-coach-rewrites/plants_check_all.cjs prompt-coach/research/live-tests FR-4 --dump` into `LOGS/FR-4_fixture_text.txt` (lead redirect). Check: `[ROOT+L] test "$(grep -c 'JE-106 | Accrued freight | 12 | Sept freight' $L/FR-4_fixture_text.txt)" = 1 && echo OK`. Expected `OK`.
- [ ] **Step 3: Driver sends FR-4**, 6 chats, answers to `LOGS/live_FR-4.md` in the log format above. Check: `[ROOT+L] test "$(grep -c '^## P' $L/live_FR-4.md)" = 6 && test "$(grep -c '^Prompt sent:' $L/live_FR-4.md)" = 6 && test "$(grep -c '^File picked:' $L/live_FR-4.md)" = 6 && echo OK`. Expected `OK`.
- [ ] **Step 4: Opus scorer** for FR-4 (one case, 6 answers, caps 135k / 20). Check: `[ROOT+L] test "$(grep -c '^| P' $L/live_FR-4_scores.md)" = 6 && echo OK`. Expected `OK`.
- [ ] **Step 5: Codex second scorer** from `LOGS/codex_FR-4_prompt.txt`. Check: `[ROOT+L] test "$(grep -c '^| P' $L/codex_FR-4_out.txt)" = 6 && echo OK`; list disagreements.
- [ ] **Step 6: Discrimination gate (lead).** Take the per-prompt means (P1, P2, P3; 2 runs each) of keyed-found count, hard found (0-2), false findings and invented facts. Let H = number of the 6 answers that found the hard plant, and D = true when at least one of the four means differs between two prompts. Check the rows below in order, top to bottom; the first row that matches decides. The outcomes are mutually exclusive by this order: **any STOP row takes precedence over PASS** (so H = 0 is STOP even if the means differ), and PASS is only what is left after every STOP row has been ruled out.

| Order | Pattern across the 6 answers | Outcome |
|---|---|---|
| 1 | H = 0 (hard plant found in 0 of 6) | STOP: check the key against the fixture text first (a key or file error); if the key is right, the plant may be too hard or unfair; tell Ian |
| 2 | Every one of the 6 answers has every keyed item and the hard plant, 0 false, 0 invented | STOP: too easy. Tell Ian; propose a harder plant (versioned file name) for this case and any case with the same kind of plant; do not start the next task |
| 3 | H = 6 and all four means equal across the three prompts (and row 2 did not match: the same false finding or the same miss shows in all) | STOP: no difference between prompts; tell Ian |
| 4 | None of rows 1 to 3 matched: that is H = 1 to 5, or H = 6 with D true | PASS: continue |

- [ ] **Step 7: Re-estimate budget** from the real scorer cost (tokens for this dispatch) and say whether Tasks 7-12 fit the remaining helper tokens; if not, stop and ask Ian which lever to use.

### Task 7: Run and score FR-1 and FR-3

**Files:** `LOGS/live_FR-1.md`, `live_FR-3.md`, `FR-1_fixture_text.txt`, `FR-3_fixture_text.txt`, `live_FR-1_scores.md`, `live_FR-3_scores.md`, `codex_FR-1_prompt.txt`, `codex_FR-3_prompt.txt`, `codex_FR-1_out.txt`, `codex_FR-3_out.txt`.

- [ ] **Step 1: Fixture text** for FR-1 and FR-3 via `--dump`. Check: `[ROOT+L] test "$(grep -c 'Includes 7 one-time settlement' $L/FR-1_fixture_text.txt)" = 1 && echo OK`. Expected `OK`.
- [ ] **Step 2: Driver sends FR-1** (6 chats). Check: `[ROOT+L] test "$(grep -c '^Prompt sent:' $L/live_FR-1.md)" = 6 && test "$(grep -c '^## P' $L/live_FR-1.md)" = 6 && echo OK`. Expected `OK`.
- [ ] **Step 3: Driver sends FR-3** (6 chats). Check: same two counts on `live_FR-3.md`, expected `OK`.
- [ ] **Step 4: One Opus scorer dispatch for both cases** (12 answers, caps 265k / 30). Check: `[ROOT+L] test "$(grep -c '^| P' $L/live_FR-1_scores.md)" = 6 && test "$(grep -c '^| P' $L/live_FR-3_scores.md)" = 6 && echo OK`. Expected `OK`.
- [ ] **Step 5: Codex check** for both cases (new prompt files); list disagreements.
- [ ] **Step 6: Gate and record.** Apply the Task 6 Step 6 table (rows checked in order, any STOP row beats PASS) to each case; a case that is not PASS stops the run. Record scores summary and tokens in progress.md.

### Task 8: Run and score GRC-1 and GRC-3

**Files:** `LOGS/live_GRC-1.md`, `live_GRC-3.md`, their `_fixture_text.txt`, `_scores.md`, `codex_*_prompt.txt`, `codex_*_out.txt`.

- [ ] **Step 1: Fixture text** via `--dump`. Check: `[ROOT+L] test "$(grep -c 'TBD' $L/GRC-1_fixture_text.txt)" = 1 && echo OK`. Expected `OK`.
- [ ] **Step 2: Driver sends GRC-1** (6 chats). Check the `## P` and `Prompt sent:` counts equal 6 as in Task 7 Step 2.
- [ ] **Step 3: Driver sends GRC-3** (6 chats). Same counts.
- [ ] **Step 4: One Opus scorer dispatch** (12 answers, caps 265k / 30). Check 6 score rows per file as in Task 7 Step 4.
- [ ] **Step 5: Codex check** (new prompt files); list disagreements.
- [ ] **Step 6: Gate and record** as in Task 7 Step 6.

### Task 9: Run and score GRC-2 and GRC-4

**Files:** `LOGS/live_GRC-2.md`, `live_GRC-4.md`, their `_fixture_text.txt`, `_scores.md`, `codex_*_prompt.txt`, `codex_*_out.txt`.

- [ ] **Step 1: Fixture text** via `--dump`. Check: `[ROOT+L] test "$(grep -c 'no ticket is required' $L/GRC-2_fixture_text.txt)" = 1 && echo OK`. Expected `OK`.
- [ ] **Step 2: Driver sends GRC-2** (6 chats). Counts as in Task 7 Step 2.
- [ ] **Step 3: Driver sends GRC-4** (6 chats). Same counts.
- [ ] **Step 4: One Opus scorer dispatch** (12 answers, caps 265k / 30). Check 6 score rows per file.
- [ ] **Step 5: Codex check** (new prompt files); list disagreements.
- [ ] **Step 6: Gate and record** as in Task 7 Step 6.

### Task 10: Run and score SUS-1 and SUS-2

**Files:** `LOGS/live_SUS-1.md`, `live_SUS-2.md`, their `_fixture_text.txt`, `_scores.md`, `codex_*_prompt.txt`, `codex_*_out.txt`.

- [ ] **Step 1: Fixture text** via `--dump`. Check: `[ROOT+L] test "$(grep -c 'CAD 1,548.00' $L/SUS-1_fixture_text.txt)" = 1 && echo OK`. Expected `OK`.
- [ ] **Step 2: Driver sends SUS-1** (6 chats; the SUS-1 prompts are long, expect longer chats). Counts as in Task 7 Step 2.
- [ ] **Step 3: Driver sends SUS-2** (6 chats). Same counts.
- [ ] **Step 4: One Opus scorer dispatch** (12 answers, caps 265k / 30). Check 6 score rows per file.
- [ ] **Step 5: Codex check** (new prompt files); list disagreements.
- [ ] **Step 6: Gate and record** as in Task 7 Step 6.

### Task 11: Run and score SUS-3 and SUS-4

**Files:** `LOGS/live_SUS-3.md`, `live_SUS-4.md`, their `_fixture_text.txt`, `_scores.md`, `codex_*_prompt.txt`, `codex_*_out.txt`.

- [ ] **Step 1: Fixture text** via `--dump`. Check: `[ROOT+L] test "$(grep -c 'Supplier G,IT,n/a' $L/SUS-3_fixture_text.txt)" = 1 && echo OK`. Expected `OK`.
- [ ] **Step 2: Driver sends SUS-3** (6 chats; csv upload). Counts as in Task 7 Step 2.
- [ ] **Step 3: Driver sends SUS-4** (6 chats). Same counts.
- [ ] **Step 4: One Opus scorer dispatch** (12 answers, caps 265k / 30). Check 6 score rows per file.
- [ ] **Step 5: Codex check** (new prompt files); list disagreements.
- [ ] **Step 6: Gate and record** as in Task 7 Step 6.

### Task 12: Run and score SUS-5, then summary

**Files:** `LOGS/live_SUS-5.md`, `SUS-5_fixture_text.txt`, `live_SUS-5_scores.md`, `codex_SUS-5_prompt.txt`, `codex_SUS-5_out.txt`, `LOGS/live_plants_summary.md`.

- [ ] **Step 1: Fixture text** via `--dump`. Check: `[ROOT+L] test "$(grep -c 'Usage: 17 CCF' $L/SUS-5_fixture_text.txt)" = 1 && echo OK`. Expected `OK`.
- [ ] **Step 2: Driver sends SUS-5** (6 chats). Counts as in Task 7 Step 2.
- [ ] **Step 3: Opus scorer** (one case, 6 answers, caps 135k / 20), then Codex check with its own prompt file; gate as in Task 6 Step 6. Check: `[ROOT+L] test "$(grep -c '^| P' $L/live_SUS-5_scores.md)" = 6 && echo OK`. Expected `OK`.
- [ ] **Step 4: Summary** `LOGS/live_plants_summary.md`: one table, 12 cases plus FR-2 pilot, per prompt: mean keyed-found share, hard-plant found count (of 2 runs), false findings, valid extras, invented, clarify count, and each case's gate outcome. Say which numbers were scored by hand and which Codex disagreed on.
- [ ] **Step 5: Report to Ian** in plain words: which prompt (original, 73be350 Strong, Strong now) did better or worse and where the sample is too small to say; tokens used against the helper tokens left at the start of the run.
- [ ] **Step 6: Stop.** No push, no merge, no next session without Ian's yes.

## Review fixes

Finding ids: O-n = Opus step 1 findings in order (the Opus review file); C-n = Codex findings as numbered in the Opus rulings (step 2 of that file). Severities are Opus's.

| Finding | Severity | Fixed at |
|---|---|---|
| O-1 scorer cap below the plan's own estimate | MUST-FIX | Run protocol "Scorer" (caps 135k/20 and 265k/30, 20 percent over the linear estimate) and Budget "Scorer caps"; scorer appends rows as it goes; Tasks 6-12 row-count checks |
| O-2 SUS Strong blank fills differ between the two Strong prompts | MUST-FIX | Run protocol "Prompts": one phrase `our CSRD climate disclosure review` in both Strong prompts for all SUS cases; fill is logged inside the "Prompt sent" block |
| O-3 trailing comma in key inserts | MUST-FIX | Task 1 Step 2 `plants_append.cjs` (leading-comma blocks, JSON.parse, duplicate and FR-2 checks); Tasks 2-5 key steps; JSON_OK check in each |
| O-4 vacuous pipeline checks | MUST-FIX | Task 1 `plants_gate.sh` (node's rc captured, PASS and FAIL counts asserted, checker CRASH exit 2); all Task 1-6 checks; run-task checks use `test "$(...)" = N && echo OK`; Task 6 Step 1 asserts pass=14 fail=0 |
| O-5 false-finding rule counts true extras | MUST-FIX | Run protocol "Scorer": false = contradicts the file, unsupported factual claim, or `mustNotClaim`; true extras in their own column; GRC-2 and GRC-3 prohibited-claim wording |
| O-6 FR-2 key lock too loose | SHOULD-FIX | Task 1 checker `fr2Base()` compares the whole FR-2 entry to b4db9ae; Global Constraints |
| O-7 GRC-3 required items the prompt does not ask for | SHOULD-FIX | GRC-3 key: found = 3 deficiencies + split; C-01, C-06 and the 5/3 counts moved to `optional`/`mustNotClaim` |
| O-8 GRC-3 "3 of 6" ambiguous | SHOULD-FIX | GRC-3 mustNotClaim: "3 of 6 tested" or a 50 percent failure rate |
| O-9 FR-1 "Other 0" required | SHOULD-FIX | FR-1 key: "Other 0" moved to `optional` |
| O-10 GRC-4 role in source scored false | SHOULD-FIX | GRC-4 mustNotClaim: "a named person, or an owner or role not in the walkthrough" |
| O-11 SUS-2 no unit on FY columns | SHOULD-FIX | Task 4 Step 2 headers `FY2024 (tCO2e)`, `FY2025 (tCO2e)`; key and proof updated |
| O-12 xlsx blank cells by document order | SHOULD-FIX | Task 1 checker places cells by `r` column letter; Task 3 Step 4 proof `C-02 | Access recertification | | Quarterly | Yes` shows the blank landed right |
| O-13 gate looks only at variance within the 6 answers | SHOULD-FIX | Task 6 Step 6 table (per-prompt means or hard in 1-5 of 6; ceiling, floor and flat patterns each stop); applied to every case |
| O-14 re-plant file name clash in the sandbox | SHOULD-FIX | Run protocol "Sends": versioned file name and `File picked:` logged per chat |
| O-15 generator failure leaves FR-2 overwritten | SHOULD-FIX | First fix: `plants_regen.sh` restored with `;` after the generator whatever its exit. Superseded by the C-8 re-review row below (the generator no longer runs in the repo tree) |
| O-16 `git status` lists the untracked plan | NIT | Status scoped to `prompt-coach/research/live-tests` in `plants_pre.sh` and `plants_regen.sh` |
| O-17 struck first bullet in Task 1 Files | NIT | Task 1 Files lists only `plants_check_all.cjs` and the helpers; the slip line is deleted |
| O-18 trailer hard-codes a model name | NIT | Global Constraints: copy the two lines from the committing session's reminder |
| O-19 SUS-1 "1 document" read as undercount | NIT | SUS-1 key accepts "1 document holding 4 invoices" |
| O-20 budget prose "7 to 8 cases" | NIT | Budget: both models stated (5 cases fixed-overhead, 3 linear) against about 760k |
| C-1 SUS-4 E1-8 "gap" may be wrong | MUST-FIX | SUS-4 key: E1-8 relates as a negative statement, "covered" claim dropped from mustNotClaim; note under the case table; Task 5 Step 2 search can still change the key |
| C-2 FR-1 "2 is not one-time" assumes Q2 | SHOULD-FIX | FR-1 found item: "about 2 is left if Q2 had no such item (Q2 not stated)" |
| C-3 SUS-2 units | SHOULD-FIX | Same as O-11 |
| C-4 GRC-4 key lacks evidence per step | SHOULD-FIX | GRC-4 found: evidence proposed for each of the 3 steps, not a fact claim |
| C-5 GRC-4 segregation wording too strong | SHOULD-FIX | GRC-4 key: potential risk to follow up; conditional wording accepted |
| C-6 JSON trailing comma | dup of O-3 | See O-3 |
| C-7 FR-2 key structural check | dup of O-6 | See O-6 |
| C-8 FR-2 overwritten by regeneration | dup of O-15 | See O-15; re-review NOT FIXED, fixed in the re-review row below |
| C-9 broad checkout discards changes | SHOULD-FIX | Step 1 of Tasks 2-5 runs `plants_pre.sh` (tree under live-tests must be clean); `plants_regen.sh` now copies in only the files the task owns (no checkout needed) |
| C-10 pipelines hide node exit | dup of O-4 | See O-4 |
| C-11 proof coverage | SHOULD-FIX | Proofs added: FR-1 Other row, FR-4 JE-102, GRC-1 C-01/C-05, GRC-3 C-02/C-04, GRC-4 all sentences, SUS-1 usage lines, SUS-3 Supplier D, SUS-5 all usage and amount lines. Derived calculations (sums, counts) not asserted: the gate only needs the source values. Re-review NOT FIXED, fixed in the re-review row below |
| C-12 scorer lacks the filled prompts | MUST-FIX | Run protocol "Log format" (exact prompt sent above each answer) and "Scorer"/"Codex check" (inputs); `Prompt sent:` count check in Tasks 6-12 |
| C-13 false findings "not in the key" | dup of O-5 | See O-5 |
| C-14 locked `codex_fr2_prompt.txt` rewritten | SHOULD-FIX | Run protocol "Codex check": copy as a template to `LOGS/codex_<CASE>_prompt.txt`; Global Constraints lock reworded |
| C-15 FR-4 duplicates as potential | SHOULD-FIX | FR-4 key: "possible duplicate to verify" wording |
| C-16 GRC-2 "no later review" | SHOULD-FIX | GRC-2 key: "no after-the-fact review requirement stated", exception whose safeguards need review |
| C-17 GRC-3 derived counts | SHOULD-FIX | GRC-3 mustNotClaim allows correct derived counts and percentages |
| C-18 gate gap for ceiling/floor | dup of O-13 | See O-13 |
| C-19 hard plants unproven | SHOULD-FIX | Spec line and case table column "Hard one (provisional)"; a non-PASS gate stops the run (Run protocol "Gate", Tasks 7-11 Step 6) |
| Re-review NEW: gate outcomes conflict (zero hard-plant hits with differing means matched both PASS and STOP) | MUST-FIX | Task 6 Step 6: rows numbered 1 to 4 and checked in order, first match decides, "any STOP row takes precedence over PASS", PASS is the leftover (row 4); Task 7 Step 6 repeats the order |
| Re-review C-8: generator still overwrote FR-2 before restoration | MUST-FIX | Global Constraints (generator never runs in the repo tree); Task 1 Interfaces and Step 2 `plants_regen.sh` (runs a temp copy, copies in only owned files, refuses an FR-2 regex, FR-2 blobs checked against b4db9ae before and after, copied count asserted); Task 1 Step 4 refusal check; Tasks 2-5 regen step and `rehearse` blocks (named owned files only) |
| Re-review C-11: substring proofs could match a populated neighbour (`Example Supplier B,DE,` inside `...,DE,120`), no exact row counts | SHOULD-FIX | "How a proof string is written" (`counts` rule); Task 1 Step 1 checker (`counts` validated and checked); SUS-3 proof now the whole file as one multi-line string plus line counts (7 suppliers, 2 empty cells, each B/D/F/G line anchored); same flaw fixed by whole-line counts in FR-1 (Other), FR-4 (JE-103), GRC-1 (C-04, C-06, 6 controls), GRC-3 (6 controls, Pass/Fail/Not tested/Design/Operating counts), SUS-1 (usage, amount, charge lines, 4 invoices), SUS-2 (commuting 4100, leased assets, 6 rows), SUS-5 (3 bills, usage, amount, period lines) |

Not fixed: none. Open risks that remain: the plan writer could not run node, so the checker, the PDF line format, the xlsx blank-cell layout and the new `counts` regexes are unmeasured until Task 1 and Tasks 2-5 run (a regex that disagrees with the real text is fixed to the real line, same value, per "How a proof string is written"); ESRS ids and E1-8 wording unchecked until Task 5 Step 2; the helper-token total (about 1.18M to 1.65M) does not fit about 760k and Ian picks the lever.

## Self-review (done)

- Spec coverage: 12 cases keyed with a hard plant each; 2 runs per prompt (Run protocol); one case at a time with a gate after the first (Task 6) and after each later case; scorer caps sized from the Budget table; Codex check with new per-case prompt files; budget with measured FR-2 costs and the lead's 760k figure; out-of-scope list present.
- Placeholder scan: no TBD in steps. Proof strings and counts that depend on the real generated text carry a fix rule (see "How a proof string is written").
- Consistency: key names `job/found/hard/optional/mustNotClaim/proof/counts/absent` match the checker; files named `plants_check_all.cjs`, `plants_gate.sh`, `plants_pre.sh`, `plants_regen.sh`, `plants_append.cjs` throughout; `plants_regen.sh` takes (regex, expected count): Task 2 = 3, Task 3 = 4, Task 4 = 3, Task 5 = 2; GRC IDs match between Task 3 key and fixtures; gate counts: Task 2 = 4, Task 3 = 6, Task 4 = 4, Task 5 and Task 6 = 14.
