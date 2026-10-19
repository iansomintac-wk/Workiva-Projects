# Prompt coach: Scope 3 "in the file" by structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: `CHK=bash "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/.ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh"`; then `$CHK unit <57+new> 0` (65 after Task A, 69 after Tasks B and C), `$CHK suite`, `$CHK dump <task>`, `$CHK strong <task>`, `$CHK fixtures same <task>`, and the probe `node --test --test-reporter=spec .ledger/2026-10-19-prompt-coach-scope3-structure/reviews/test/probe.test.js` run from `prompt-coach/` (full one-line forms are in each task's guard step)
Data: (none)
helperToolCallCap: 30

**Goal:** The "file cannot support the ask" note fires for Scope 3 asks whose category the file does not report with a figure, including summary sheets with short labels and asks that name the category in words.

**Architecture:** Only `cannotSupport` and `categoryHit` (and new helpers beside them) in `prompt-coach/engine/rewrite.js` change (rules 1-4 of the spec), plus README text and the rebuilt single-file `dist/prompt-coach.html`. Rules 1-2 (what "listed" means, short labels) go in Task A; rules 3-4 (what a Scope 3 file and ask are, and the numbered-ask name check) in Task B; README known-limits list in Task C. No grade, weight, classifier or rewrite-text change.

**Tech Stack:** Node (node:test), plain JS engine, `tests/build.js` inlines the engine into `dist/prompt-coach.html`.

**Spec:** `docs/superpowers/specs/2026-10-19-prompt-coach-scope3-structure-design.md` (the authority; sections 2, 3, 5, 6). Section 6 steps 1 and 5 (sealed held-out, scoring, final review, evidence doc) are the lead's, not tasks.

## Global Constraints

- Existing 57 tests in `prompt-coach/tests/rewrite_unit.test.js` stay unchanged and green; new tests are appended only (8 in Task A, 4 in Task B); each new test must fail on the parent commit of its task.
- Guards after every task, each identical to base 59b09c1: simulate / customer_check / eval identical; 1,841 stored prompts `total=1841 trainFires=0`; no-file Strong rewrites byte-identical; fixtures same (19); probe 0 DIFF rows, 9 of 9 C4 layouts warn, dates sheet quiet.
- Rule 1 figure: a complete numeric token (optional thousands commas, decimals) that is not a 4-digit year (19xx/20xx, as a whole token: 2025 is a year, 2025.5 is a figure), not glued to letters (FY2025, Q4, H2, 1,240tCO2e, 1,240.5tCO2e, 1,240,500tCO2e do not count), and, written without thousands commas, not directly followed by "%". Window: a figure must START within the 60 characters after the name / short label / "category N" / "cat N", with the window cut at the next category name or "category N" first; the token is then judged whole against the original text (a token running past the window edge is not cut: "12%" starting at the 60th character is a percent, not a figure).
- Rule 1 also governs the numbered ask's own parenthesised name ("category 11 (use of sold products)"): that name counts as listed only if a figure follows it in the file.
- Rule 4 accepts a category named in words only; a bare "category 11" / "cat 11" without "Scope 3" stays quiet (existing test C1).
- Engine style: ES5-ish `function`/`const` inside the IIFE, regex tables named in capitals beside `CAT_NAME`, no new files, ASCII source (use `\u` escapes for symbols).
- No tuning toward the spec section 5 risks; a held-out miss is reported, not fixed in this run.
- Safety: no push, no merge, no installs, never port 8790. Commit messages end with the two attribution lines from the session reminder.

## Dist and README line 9 (resolved)

`prompt-coach/dist/prompt-coach.html` is committed (last rebuilt in 42e1b32) and built by `node tests/build.js`, which inlines `engine/rewrite.js`. So every commit that changes the engine (Tasks A and B) also rebuilds dist and updates the byte count on README line 9 in that same commit. The README counts LF bytes (`tr -d '\r' < dist/prompt-coach.html | wc -c`; the working copy has CRLF so plain `wc -c` shows 336173 against the README's 334435; measured at planning time). The new byte counts are measured by the implementer after each rebuild (the plan does not state them; the engine text changed after the earlier review's counts). Task C only edits README text, which is not inlined in dist, so it rebuilds only to confirm the count is unchanged. The spec's "remove incidental category words in the same commit as rule 1" is done in Task A as a minimal edit of README line 98; Task C then replaces that whole line with the list.

## Spec ambiguities resolved

1. Rule 3 counts only names and short labels (not "category N") toward "two categories with figures". Counting numbered rows would make the existing test C1 file ("Category 1 Domestic, 500 / Category 2 Export, 300", no Scope 3 text) a Scope 3 file and break C1, which must stay unchanged. Numbered "category N" still lists a category under rule 1 when the file says "Scope 3". (A needed deviation from rule 3's text; the lead states it in the evidence doc.)
2. The old numbered-row start `\n N [,\t:.-]` (a row beginning "11,") is dropped, because spec rule 1 names only the three starts (name, short label, "category N"/"cat N"); this also removes the "1. Preparation" risk (spec section 5.3). Behaviour change, listed in Risks: number-only rows ("11, 4000") no longer list a category.
3. The prototype `patch2.js` wrote its regex escapes inside `String.raw`, so `\b`, `\s` in its `'...'` strings became control characters and "category N" never matched; the plan writes real double-backslash escapes, so numbered matches work as spec rule 1 says. Guards decide whether that matters; a guard failure is reported to the lead, not tuned.
4. "Glued to letters" is read as: not preceded by a letter, digit, underscore or dot, and not followed by a letter, digit or underscore, judged on the complete numeric token ("1,240tCO2e" is one token glued to letters; its parts "1" and "240" are not figures); "$80" counts as a figure. Unit-suffixed values (1.2m, 80k) are therefore not figures; this follows the spec and is named in the README known limits.
5. Rule 4 "an alias" uses the same table as rule 2 (`CAT_LBL`), so asking for "EOL" or "purch. goods" is a category named in words.
6. The prototype's `;` after "waste" in the line-start pattern is not added: no spec rule needs it (rule 2 lists the waste forms; the base pattern `[,\t:]` stays).
7. (round 2) "60 characters" is read as the window within which a figure must start, not a cut-off for the token: the window is first cut at the next category name, then each number token that starts before the cut is validated whole against the full lowercased text.

---

### Task A: Rules 1-2 (listed means a figure; short labels)

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`CAT_RE`, `categoryHit`, lines ~415-421; `CAT_RE` has no other users, checked by grep)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (append 8 tests at the end)
- Modify: `prompt-coach/README.md` (line 9 byte count, line 98 wording, one new bullet after line 97)
- Modify (generated): `prompt-coach/dist/prompt-coach.html`

**Interfaces:**
- Consumes: `CAT_NAME`, `CAT_ASK`, `cannotSupport` (unchanged call sites at lines 442 and 447, `categoryHit(n, lower)` returns `'exact' | 'generic' | null`).
- Produces: `CAT_LBL` (array of 16, index 0 null, one non-global regex per category, aliases included), `CAT_ANY` (regex), `NUM_TOKEN` (regex source for one whole number token), `figureAfter(lower, end)` -> boolean, `givenListed(lower, s)` -> boolean (true when some occurrence of the string `s` in `lower` has a figure after it; Task B uses it), and `categoryHit(n, lower, byNameOnly)` where the optional third argument, when true, skips the "category N" start (Task B uses it).

- [ ] **Step 1: Prove the build is reproducible at base**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && node tests/build.js && git status --short dist && tr -d '\r' < dist/prompt-coach.html | wc -c`
Expected: `dist/prompt-coach.html NNN KB`, no `git status` line, then `334435`. If git status lists dist or the count differs, stop and report to the lead.

- [ ] **Step 2: Append the eight failing tests** to `prompt-coach/tests/rewrite_unit.test.js` (after the last test; `mk`, `run`, `unsupported`, `askCat` already exist in the file)

```js
test('unsupported: a category name in a passing remark with no figure after it is not listed (rule 1, K11 shape)', () => {
  const f = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nCapital goods, 300\nNote: cut business travel budgets in H2');
  assert.equal(unsupported(run(askCat(6), [f])).length, 1, 'business travel has no figure');
  const g = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nBusiness travel, 80');
  assert.equal(unsupported(run(askCat(6), [g])).length, 0, 'a figure after the name lists it');
});

test('unsupported: a category name inside another row\'s Note cell does not list it (rule 1, K13 shape)', () => {
  const f = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nUse of sold products, 70, Excludes fuel purchased for fleet - see fuel and energy note');
  assert.equal(unsupported(run(askCat(3), [f])).length, 1, 'fuel and energy only in a note');
  const g = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nFuel and energy, 40');
  assert.equal(unsupported(run(askCat(3), [g])).length, 0, 'its own row with a figure lists it');
});

test('unsupported: short labels with a figure list their category (rule 2)', () => {
  const f = mk('s3.xlsx', 'Scope 3', 'Purch. goods & svcs, 5200\nWaste in ops, 40\nUpstr. leased assets, 15\nEOL treatment, 90');
  assert.equal(unsupported(run(askCat(11), [f])).length, 1, 'category 11 is absent');
  for (const n of [1, 5, 8, 12]) assert.equal(unsupported(run(askCat(n), [f])).length, 0, 'category ' + n + ' is listed by its short label');
  assert.equal(unsupported(run(askCat(13), [f])).length, 1, 'upstream leased is category 8, not 13');
});

test('unsupported: years, FY/Q/H tags and a bare percent are not figures (rule 1)', () => {
  for (const tail of ['FY2025', 'Q4 H2', '2025', '12%', '(FY25 Q4)']) {
    const f = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nCapital goods, 300\nBusiness travel, ' + tail);
    assert.equal(unsupported(run(askCat(6), [f])).length, 1, tail);
  }
  for (const tail of ['80', '1,240', '12.5', '$80']) {
    const f = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nCapital goods, 300\nBusiness travel, ' + tail);
    assert.equal(unsupported(run(askCat(6), [f])).length, 0, tail);
  }
});

test('unsupported: the year exclusion covers the whole numeric token, so 2025.5 is a figure and 2025 is not (rule 1)', () => {
  const tailFile = (tail) => mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nCapital goods, 300\nBusiness travel, ' + tail);
  assert.equal(unsupported(run(askCat(6), [tailFile('2025')])).length, 1, '2025 is a year');
  assert.equal(unsupported(run(askCat(6), [tailFile('2025.5')])).length, 0, '2025.5 is a figure');
  assert.equal(unsupported(run(askCat(6), [tailFile('1999')])).length, 1, '1999 is a year');
  assert.equal(unsupported(run(askCat(6), [tailFile('1999.25')])).length, 0, '1999.25 is a figure');
});

test('unsupported: a number glued to letters is not a figure, even a comma-grouped or decimal one (rule 1)', () => {
  const tailFile = (tail) => mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nCapital goods, 300\nBusiness travel, ' + tail);
  assert.equal(unsupported(run(askCat(6), [tailFile('1,240tCO2e')])).length, 1, '1,240tCO2e is glued to letters');
  assert.equal(unsupported(run(askCat(6), [tailFile('1,240.5tCO2e')])).length, 1, '1,240.5tCO2e is one token glued to letters');
  assert.equal(unsupported(run(askCat(6), [tailFile('1,240,500tCO2e')])).length, 1, '1,240,500tCO2e is one token glued to letters');
  assert.equal(unsupported(run(askCat(6), [tailFile('1,240 tCO2e')])).length, 0, 'a space makes 1,240 a figure');
  assert.equal(unsupported(run(askCat(6), [tailFile('1,240')])).length, 0, '1,240 is a figure');
  assert.equal(unsupported(run(askCat(6), [tailFile('1,240.5')])).length, 0, '1,240.5 is a figure');
  assert.equal(unsupported(run(askCat(6), [tailFile('1,240,500')])).length, 0, '1,240,500 is a figure');
});

test('unsupported: the 60-character window stops at the next category name (rule 1)', () => {
  const h = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nCapital goods, 300\nBusiness travel\nEmployee commuting, 40');
  assert.equal(unsupported(run(askCat(6), [h])).length, 1, 'the next row\'s figure belongs to commuting');
  const g = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nCapital goods, 300\nBusiness travel, 80\nEmployee commuting, 40');
  assert.equal(unsupported(run(askCat(6), [g])).length, 0, 'its own figure lists it');
});

test('unsupported: a figure may start inside the 60 characters but is judged as a whole token (rule 1, window edge)', () => {
  const tailFile = (tail) => mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nCapital goods, 300\nBusiness travel' + tail);
  assert.equal(unsupported(run(askCat(6), [tailFile(' '.repeat(59) + '12%')])).length, 1, '12% starts at the 60th character; the "%" past the window still makes it a percent');
  assert.equal(unsupported(run(askCat(6), [tailFile(' '.repeat(50) + '1,240')])).length, 0, '1,240 inside the window is a figure');
});
```

- [ ] **Step 3: Run the new tests and see them fail on the parent**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" unit 65 0`
Expected: `UNIT_BAD pass=57 fail=8 wanted 65/0` followed by eight `not ok` lines (the eight new titles). Any other count: stop. (If the window-edge test passes on the parent's first assertion or the engine collapses runs of spaces before the check, stop and report: the test's filler would need changing, a lead decision.)

- [ ] **Step 4: Replace `CAT_RE` and `categoryHit` in `prompt-coach/engine/rewrite.js`** (delete the `CAT_RE` line and the whole `categoryHit` function with its comment; keep `CAT_ASK`, `CAT_EXPLAIN`, `CAT_NAME` as they are; insert this where they were)

```js
  // One label per category: the full name plus the short forms a summary sheet uses (purch. goods, waste in ops, upstr./downstr., EOL).
  const CAT_LBL = [null, /purchased goods|purch\.? goods/, /capital goods/, /fuel[- ]and[- ]energy|energy-related/, /upstream (?:transport|t ?& ?d|t and d)|upstr\.? (?:transport|t ?& ?d)/, /waste generated|waste in op|(?:^|\n)\s*waste\s*[,\t:]/, /business travel/, /commut/, /upstream leased|upstr\.? leased/, /downstream (?:transport|t ?& ?d|t and d)|downstr\.? (?:transport|t ?& ?d)/, /processing of sold/, /use of sold/, /end[- ]of[- ]life|\beol\b/, /downstream leased|downstr\.? leased/, /franchis/, /investment/];
  const CAT_ANY = new RegExp(CAT_LBL.slice(1).map((r) => r.source).join('|') + '|\\b(?:category|cat\\.?)\\s*\\d{1,2}\\b');
  // One whole number token, matched greedily: a comma-grouped number (1,240 / 1,240,500, optional decimals) or a plain one (80 / 12.5 / 2025).
  // A comma group only counts when it is exactly three digits and ends the digits, so "1,2400" is the plain "1" then "2400".
  const NUM_TOKEN = '\\d{1,3}(?:,\\d{3})+(?!\\d)(?:\\.\\d+)?|\\d+(?:\\.\\d+)?';
  // Is the token lower.slice(i, j) a figure? Judged on the whole token in the original text, never on a window slice.
  function isFigure(lower, i, j) {
    const t = lower.slice(i, j), prev = i > 0 ? lower[i - 1] : '', next = j < lower.length ? lower[j] : '';
    if (/[a-z0-9_.]/.test(prev)) return false;                       // glued before (FY2025, Q4, H2, the tail of 1.2.3)
    if (/[a-z0-9_]/.test(next) || (next === '.' && /\d/.test(lower[j + 1] || ''))) return false; // glued after (1,240tco2e, 1.2.3)
    if (t.indexOf(',') < 0) {
      if (next === '%') return false;                                 // a bare percent
      if (/^(?:19|20)\d{2}$/.test(t)) return false;                   // a whole-token year (2025 yes, 2025.5 no)
    }
    return true;
  }
  // A figure follows the name when a number token STARTS within the 60 characters after it, the window being cut at the next category name or "category N" first.
  // The token itself is validated whole (it may run past the window edge).
  function figureAfter(lower, end) {
    const w = lower.slice(end, end + 60), c = w.search(CAT_ANY), lim = end + (c >= 0 ? c : w.length);
    const re = new RegExp(NUM_TOKEN, 'g'); re.lastIndex = end; let m;
    while ((m = re.exec(lower)) && m.index < lim) if (isFigure(lower, m.index, m.index + m[0].length)) return true;
    return false;
  }
  // True when some occurrence of s (a name typed in the ask) has a figure after it in the file text.
  function givenListed(lower, s) { for (let i = lower.indexOf(s); i >= 0; i = lower.indexOf(s, i + 1)) if (figureAfter(lower, i + s.length)) return true; return false; }
  // 'exact' = listed with a figure by number or by its own name; 'generic' = a plain "leased assets" row with a figure, which may be category 8 or 13; null = not listed.
  // byNameOnly skips "category N" (rule 3 counts names and short labels only).
  function categoryHit(n, lower, byNameOnly) {
    const starts = [new RegExp(CAT_LBL[n].source, 'g')];
    if (!byNameOnly) starts.unshift(new RegExp('\\b(?:category|cat\\.?)\\s*' + n + '\\b', 'g'));
    for (const re of starts) { let m; while ((m = re.exec(lower))) { if (figureAfter(lower, m.index + m[0].length)) return 'exact'; if (!m[0].length) re.lastIndex++; } }
    if (n === 8 || n === 13) {
      const rest = lower.replace(/(?:upstream|downstream|upstr\.?|downstr\.?) leased/g, ''), re = /leased assets/g; let m;
      while ((m = re.exec(rest))) if (figureAfter(rest, m.index + m[0].length)) return 'generic';
    }
    return null;
  }
```

Before editing run `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && grep -rn "CAT_RE" prompt-coach/engine prompt-coach/tests prompt-coach/web | grep -v "rewrite.js" | head -3` (expected: no output; if any, stop). `isFigure` is the load-bearing function: the case table under "Figure case table" below is its specification, and the Step 2 tests decide it; if one fails, correct the function to the stated meaning (complete numeric token, judged whole), never the test. The regex was not run by the planner (no read-only way to run it).

- [ ] **Step 5: Run the unit tests**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" unit 65 0`
Expected: `UNIT_OK pass=65 fail=0`. If an existing test fails, fix the engine, never the test; if it cannot be fixed without changing a test, stop and report.

- [ ] **Step 6: Rebuild dist, update README in the same change**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && node tests/build.js && bash "../.ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" dist CAT_LBL 1`
Expected: `dist 'CAT_LBL' lines=N LF_bytes=<NEW>` and `DIST_OK` (N at least 1; `<NEW>` is measured by the implementer). Then with the Edit tool: (a) README line 9 `334435 bytes` -> `<NEW> bytes`; (b) README line 98: delete `incidental category words, ` so it reads `forecast phrasing such as "Forecast product revenue...", LE as a forecast basis, and future share-price asks are not handled.`; (c) after README line 97 add the bullet `- Scope 3 listed means a figure (2026-10-19): a category is in the file only when its name, short label (purch. goods, waste in ops, upstr./downstr., EOL) or "category N" / "cat N" is followed within 60 characters by a figure (not a year, not FY/Q/H tags, not a number glued to letters, not a bare percent) before the next category name starts.`
Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && N=$(tr -d '\r' < dist/prompt-coach.html | wc -c) && sed -n 9p README.md | grep -c "$N bytes" && grep -c "incidental" README.md`
Expected: `1` then `0` (grep -c prints 0 and exits 1; that is the pass).

- [ ] **Step 7: Run all guards** (each a single line; task name `taskA`; keep this order, `dump` must run before `fixtures` because the fixtures probe does not create its output folder)

```
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" suite
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" dump taskA
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" strong taskA
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" fixtures same taskA
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && node --test --test-reporter=spec "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/.ledger/2026-10-19-prompt-coach-scope3-structure/reviews/test/probe.test.js" | grep -c " DIFF"
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && node --test --test-reporter=spec "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/.ledger/2026-10-19-prompt-coach-scope3-structure/reviews/test/probe.test.js" | grep -cE "PROBE C4-(pdf2page|pdf1page|ppt2slide|csv|csvSemicolon|wordTable|wordPara|wordBulletNoComma|wordBulletDash) base=1 branch=1"
```
Expected, in order: `SIM_IDENTICAL`, `CUST_IDENTICAL`, `EVAL_IDENTICAL`; `DUMP total=1841 trainFires=0 ...`; `STRONG_NOFILES_IDENTICAL`; `FIXTURES_OK same (19)`; `0`; `9`. Also `PROBE C4-datesSheet base=0 branch=0` stays (the DIFF count of 0 covers it). Any other result: stop, report to the lead, do not tune.

- [ ] **Step 8: Commit**

```
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js prompt-coach/README.md prompt-coach/dist/prompt-coach.html && git commit -m "Prompt coach Scope 3 structure: listed means a figure, short labels (rules 1-2)"
```
(append the two attribution lines from the session reminder to the message)

#### Figure case table (the specification of `isFigure` / `figureAfter`; the lead can run each row)

"Tail" rows: the file's last line is `Business travel, <tail>` after two other listed categories; "warns" = figure absent, "quiet" = figure present (category 6 asked). Each row was hand-traced against the code above, not executed.

| # | Text after the name | Token(s) | Figure? | Result | Source |
|---|---|---|---|---|---|
| 1 | `, 1,240.5tco2e` | `1,240.5` next `t` | no | warns | R4 (lead) |
| 2 | `, 1,240,500tco2e` | `1,240,500` next `t` | no | warns | R4 (lead) |
| 3 | `, 1,240.5` | `1,240.5` | yes | quiet | R4 |
| 4 | `, 1,240,500` | `1,240,500` | yes | quiet | R4 |
| 5 | 59 spaces then `12%` (token starts at char 60 of the window) | `12` next `%` | no | warns | R5 |
| 6 | 50 spaces then `1,240` | `1,240` | yes | quiet | R5 |
| 7 | `, 1,240tco2e` | `1,240` next `t` | no | warns | R3 |
| 8 | `, 1,240 tco2e` | `1,240` next space | yes | quiet | R3 |
| 9 | `, 1,240` | `1,240` | yes | quiet | R3 |
| 10 | `, 2025` | `2025` year | no | warns | R2 |
| 11 | `, 2025.5` | `2025.5` (not a year) | yes | quiet | R2 |
| 12 | `, 1999` | `1999` year | no | warns | R2 |
| 13 | `, 1999.25` | `1999.25` | yes | quiet | R2 |
| 14 | `, fy2025` | `2025` prev `y` | no | warns | spec |
| 15 | `, q4 h2` | `4` prev `q`, `2` prev `h` | no | warns | spec |
| 16 | `, (fy25 q4)` | `25` prev `y`, `4` prev `q` | no | warns | spec |
| 17 | `, 12%` | `12` next `%` | no | warns | spec |
| 18 | `, 80` | `80` | yes | quiet | spec |
| 19 | `, 12.5` | `12.5` | yes | quiet | spec |
| 20 | `, $80` | `80` prev `$` | yes | quiet | spec |
| 21 | `, 1,240%` | `1,240` has commas, `%` allowed | yes | quiet | spec ("without commas") |
| 22 | `, 12.5%` | `12.5` next `%` | no | warns | spec |
| 23 | `, 1.2.3` | `1.2` next `.3`; then `3` prev `.` | no | warns | glue rule |
| 24 | `, 1,2400` | grouped fails; plain `1` next `,` is a figure | yes | quiet | assumed, not in a disposition |
| 25 | `\nemployee commuting, 40` right after the name (no figure of its own) | window cut at `commut` before `40` | no | warns | S2 |

Rows 21, 23 and 24 are the planner's own edge cases (not tested in Task A, listed so the lead can see what the code does with them); every other row has a test in Step 2.

---

### Task B: Rules 3-4 (Scope 3 file by structure; Scope 3 ask by category words) and the numbered ask's own name

**Files:**
- Modify: `prompt-coach/engine/rewrite.js` (`cannotSupport`, lines ~439-448 after Task A)
- Modify: `prompt-coach/tests/rewrite_unit.test.js` (append 4 tests)
- Modify: `prompt-coach/README.md` (line 9 byte count; the unsupported bullet at line 95; one new bullet)
- Modify (generated): `prompt-coach/dist/prompt-coach.html`

**Interfaces:**
- Consumes: `CAT_LBL`, `categoryHit(n, lower, byNameOnly)`, `givenListed(lower, s)`, `CAT_ASK`, `CAT_NAME` from Task A.
- Produces: the changed gate in `cannotSupport` and the figure-checked numbered-ask name; return shape `{ kind: 'category', n, name }` is unchanged.

- [ ] **Step 1: Append the four failing tests** to `prompt-coach/tests/rewrite_unit.test.js`

```js
test('unsupported: a summary sheet of short labels with figures is a Scope 3 list without the words (rule 3, K23/K24 shape)', () => {
  const sum = mk('summary.xlsx', 'Summary', 'Purch. goods & svcs, 5200\nWaste in ops, 40\nUpstr. leased assets, 15\nEOL treatment, 90');
  const o = run(askCat(11), [sum]);
  assert.equal(unsupported(o).length, 1, JSON.stringify(o.notes));
  assert.match(unsupported(o)[0].text, /category 11/);
  assert.equal(unsupported(run(askCat(12), [sum])).length, 0, 'EOL is listed');
  const one = mk('summary.xlsx', 'Summary', 'Business travel, 80\nTotal, 80');
  assert.equal(unsupported(run(askCat(11), [one])).length, 0, 'one category with a figure is not a list');
  const rows = mk('rows.xlsx', 'Sales', 'Category 1 Domestic, 500\nCategory 2 Export, 300');
  assert.equal(unsupported(run(askCat(11), [rows])).length, 0, 'numbered rows alone do not make a Scope 3 file (C1)');
});

test('unsupported: an ask that names a category in words gets the same check without "Scope 3" (rule 4, K11/K12 shape)', () => {
  const f = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nBusiness travel, 80');
  const ask = (w) => 'Using only @s3.xlsx, calculate our ' + w + ' emissions in a table with item, value and source row. Do not guess.';
  const a = unsupported(run(ask('use of sold products'), [f]));
  assert.equal(a.length, 1);
  assert.match(a[0].text, /category 11/);
  const b = unsupported(run(ask('EOL treatment'), [f]));
  assert.equal(b.length, 1);
  assert.match(b[0].text, /category 12/);
  assert.equal(unsupported(run(ask('business travel'), [f])).length, 0, 'listed with a figure');
  assert.equal(unsupported(run(ask('Scope 3 category 11 (use of sold products)'), [f])).length, 1, 'number and name give one note');
});

test('unsupported: a bare category number without "Scope 3" or a category name in words stays quiet (rule 4, C1 guard)', () => {
  const f = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nBusiness travel, 80');
  const words = 'Using only @s3.xlsx, calculate our use of sold products emissions in a table with item, value and source row. Do not guess.';
  assert.equal(unsupported(run(words, [f])).length, 1, 'the category in words fires');
  assert.equal(unsupported(run(askCat(11, false), [f])).length, 0, 'category 11 alone stays quiet');
  assert.equal(unsupported(run('Explain what counts as use of sold products in @s3.xlsx.', [f])).length, 0, 'explain asks stay excluded');
});

test('unsupported: a numbered ask with its name in brackets still needs a figure after that name in the file (rule 1, numbered ask)', () => {
  const ask = 'Using only @s3.xlsx, calculate our Scope 3 category 11 (use of sold products) emissions in a table with item, value and source row. Do not guess.';
  const f = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nCapital goods, 300\nNote: use of sold products not yet assessed');
  assert.equal(unsupported(run(ask, [f])).length, 1, 'the name is only in a remark, no figure after it');
  const g = mk('s3.xlsx', 'Scope 3', 'Purchased goods, 5200\nCapital goods, 300\nUse of sold products, 70');
  assert.equal(unsupported(run(ask, [g])).length, 0, 'its own row with a figure lists it');
});
```

- [ ] **Step 2: Run them and see them fail on the parent**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" unit 69 0`
Expected: `UNIT_BAD pass=65 fail=4 wanted 69/0` plus four `not ok` lines for the new titles.

- [ ] **Step 3: Change the gate in `cannotSupport`** (`prompt-coach/engine/rewrite.js`). (a) Replace the one line `if (!/scope\s*3/i.test(prompt) || !/scope\s*3/.test(lower)) return null; // Scope 3 context in the ask AND in the file` with the first block below. (b) In the existing `for (const m of prompt.matchAll(CAT_ASK))` loop, replace the one line `if (categoryHit(n, lower) === null && !(given && lower.includes(given))) return { kind: 'category', n, name: given || CAT_NAME[n] };` with `if (categoryHit(n, lower) === null && !(given && givenListed(lower, given))) return { kind: 'category', n, name: given || CAT_NAME[n] };` (the given name now counts as listed only when a figure follows it). (c) Add the second block (one loop line) after that `for` loop. Leave the `exact`/`generic` counting as is.

```js
    const pl = prompt.toLowerCase(), named = [], numbered = [...prompt.matchAll(CAT_ASK)].map((m) => Number(m[1])).filter((n) => n >= 1 && n <= 15);
    for (let n = 1; n <= 15; n++) if (CAT_LBL[n].test(pl)) named.push(n);
    if (!(/scope\s*3/i.test(prompt) || named.length)) return null; // Scope 3 ask: the words, or a category named in words (a bare "category 11" stays quiet)
    let byName = 0; for (let n = 1; n <= 15; n++) if (categoryHit(n, lower, true)) byName++;
    if (!(/scope\s*3/.test(lower) || byName >= 2)) return null; // Scope 3 file: the words, or at least 2 categories (by name or short label) with figures
```
```js
    for (const n of named) if (!numbered.includes(n) && categoryHit(n, lower) === null) return { kind: 'category', n, name: CAT_NAME[n] };
```
Note: the `let exact = 0, generic = false;` line stays where it is; do not redeclare `lower`.

- [ ] **Step 4: Run the unit tests**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" unit 69 0`
Expected: `UNIT_OK pass=69 fail=0`. Existing C1 ("a category ask needs Scope 3 in the ask and in the file") must be among the passes; if it fails, the file gate is counting numbered rows, so check `categoryHit(n, lower, true)` is used for `byName`.

- [ ] **Step 5: Rebuild dist, update README**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && node tests/build.js && bash "../.ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" dist "named.length" 1`
Expected: `dist 'named.length' lines=N LF_bytes=<NEW>` and `DIST_OK` (`<NEW>` measured by the implementer). Then with the Edit tool: README line 9 `<previous> bytes` -> `<NEW> bytes`; in the unsupported bullet (line 95) replace `the ask says "Scope 3" and names a category N, the file's text says Scope 3 and recognises at least 2 categories, and category N is not listed in it` with `the ask says "Scope 3" or names a category in words (a bare "category 11" without Scope 3 stays quiet) and names a category (by number or in words), the file's text says Scope 3 or has at least 2 categories with figures (by name or short label), and that category is not listed with a figure in it`; add after the Task A bullet: `- Scope 3 by structure (2026-10-19): a summary sheet with short labels and figures counts as a Scope 3 list without the words "Scope 3"; an ask that names a category in words (or by short label such as EOL) is checked like a numbered one; the name typed in brackets after a category number counts as listed only when a figure follows it in the file.`
Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && N=$(tr -d '\r' < dist/prompt-coach.html | wc -c) && sed -n 9p README.md | grep -c "$N bytes"`
Expected: `1`.

- [ ] **Step 6: Run all guards** (task name `taskB`; unit is 69)

```
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" unit 69 0
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" suite
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" dump taskB
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" strong taskB
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" fixtures same taskB
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && node --test --test-reporter=spec "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/.ledger/2026-10-19-prompt-coach-scope3-structure/reviews/test/probe.test.js" | grep -c " DIFF"
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && node --test --test-reporter=spec "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/.ledger/2026-10-19-prompt-coach-scope3-structure/reviews/test/probe.test.js" | grep -cE "PROBE C4-(pdf2page|pdf1page|ppt2slide|csv|csvSemicolon|wordTable|wordPara|wordBulletNoComma|wordBulletDash) base=1 branch=1"
```
Expected, in order: `UNIT_OK pass=69 fail=0`; `SIM_IDENTICAL`, `CUST_IDENTICAL`, `EVAL_IDENTICAL`; `DUMP total=1841 trainFires=0 ...`; `STRONG_NOFILES_IDENTICAL`; `FIXTURES_OK same (19)`; `0`; `9`. Any other result: stop and report; no tuning.

- [ ] **Step 7: Commit**

```
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && git add prompt-coach/engine/rewrite.js prompt-coach/tests/rewrite_unit.test.js prompt-coach/README.md prompt-coach/dist/prompt-coach.html && git commit -m "Prompt coach Scope 3 structure: Scope 3 file by structure, ask by category words (rules 3-4)"
```
(append the two attribution lines)

---

### Task C: README known-limits list

**Files:**
- Modify: `prompt-coach/README.md` (the one-line known-limits note, line 98 at base, now ~line 100)

**Interfaces:**
- Consumes: the README as left by Task B (line 9 already correct).
- Produces: the final known-limits list the lead cites in the evidence doc.

- [ ] **Step 1: Failing check first**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && grep -c "1,841 stored prompts" README.md`
Expected: `0` (this check passes only after Step 2).

- [ ] **Step 2: Replace the line that starts `- Known limits of the unsupported note:`** (Edit tool; it is the only such line) with:

```
- Known limits of the unsupported note (left alone on purpose; probe of the 1,841 stored prompts in data/*.jsonl (2,161 rows, of which 320 have no prompt), all AI-written, no real prompts exist, so there is too little to build a rule that generalises; the word-pattern fixes tried earlier did not generalise on a sealed set):
  - Forecast phrasing: "forecast" appears in 1 of the 1,841 prompts, as a noun ("the forecast table on this slide"). Asks such as "Forecast product revenue..." are not handled.
  - Future share or stock price: "share price" or "stock price" 0, "price target" 0, "predict" 0 of the 1,841. Not handled.
  - LE (latest estimate) as a forecast basis: not treated as a forecast, budget or plan word.
  - Scope 3 is checked by structure (a figure within 60 characters after the category name, short label or "category N"). Known misses, all left alone on purpose:
    - a figure before the name ("1,240 tCO2e came from business travel") is not seen as listed;
    - unit-suffixed figures ("1.2m", "80k") are not figures, because a number glued to letters does not count;
    - an unformatted value from 1900 to 2099 ("2050") is read as a year;
    - a figure more than 60 characters after the name (a long description column) is not seen;
    - a remark line followed by an unlabelled number can be read as that category's figure;
    - number-only rows ("11, 4000") no longer list a category.
```

- [ ] **Step 3: Passing check, and the dist byte count is untouched**

Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && grep -c "1,841 stored prompts" README.md && grep -c "incidental" README.md`
Expected: `1` then `0`.
Run: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && node tests/build.js && git status --short dist && N=$(tr -d '\r' < dist/prompt-coach.html | wc -c) && sed -n 9p README.md | grep -c "$N bytes"`
Expected: `dist/prompt-coach.html NNN KB`, no `git status` line (dist unchanged), then `1`.

- [ ] **Step 4: Run all guards** (task name `taskC`; unit is 69, same lines as Task B Step 6 with `taskC` in place of `taskB`)

```
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" unit 69 0
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" suite
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" dump taskC
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" strong taskC
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && bash ".ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh" fixtures same taskC
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && node --test --test-reporter=spec "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/.ledger/2026-10-19-prompt-coach-scope3-structure/reviews/test/probe.test.js" | grep -c " DIFF"
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/prompt-coach" && node --test --test-reporter=spec "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure/.ledger/2026-10-19-prompt-coach-scope3-structure/reviews/test/probe.test.js" | grep -cE "PROBE C4-(pdf2page|pdf1page|ppt2slide|csv|csvSemicolon|wordTable|wordPara|wordBulletNoComma|wordBulletDash) base=1 branch=1"
```
Expected: same as Task B Step 6 (`UNIT_OK pass=69 fail=0`, three IDENTICAL lines, `DUMP total=1841 trainFires=0`, `STRONG_NOFILES_IDENTICAL`, `FIXTURES_OK same (19)`, `0`, `9`).

- [ ] **Step 5: Commit**

```
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-scope3-structure" && git add prompt-coach/README.md && git commit -m "Prompt coach Scope 3 structure: README known-limits list"
```
(append the two attribution lines)

---

## Expected breaks

none (the existing 57 tests stay green; the 12 new tests (8 in Task A, 4 in Task B) fail on their task's parent by design and are fixed by Tasks A and B).

## Locked files

Do not edit, in any task: the existing 57 tests in `prompt-coach/tests/rewrite_unit.test.js` (append only), `.ledger/2026-10-19-prompt-coach-scope3-structure/scripts/chk.sh`, `.ledger/2026-10-19-prompt-coach-scope3-structure/reviews/test/probe.test.js`, `.ledger/2026-10-19-prompt-coach-scope3-structure/scripts/sealed_run.js`, `.ledger/2026-10-19-prompt-coach-scope3-structure/heldout_sealed.json`. Also untouched: `prompt-coach/data/`, `engine/weights.json`, `engine/cls-weights.json`, `engine/rules.js`.

## Risks (spec section 5, assumed not tested; no tuning toward them)

1. A figure before the name ("1,240 tCO2e came from business travel") is not seen as listed, so an ask for that category could warn falsely.
2. The 60-character window can reach a figure on the next line when no category name sits between them.
3. Numbered row labels ("1. Preparation") next to a category name could read as a figure (the old numbered-row start is dropped, which lowers but does not remove this).
4. Plan-specific, assumed: the dates sheet ("1/31/2025, Business travel, 80") has one category, so it stays quiet through the 2-category minimum, not through the figure rule; the probe decides.
5. Unit-suffixed values ("1.2m", "80k", "$1.2M"), unformatted values 1900-2099 and a figure beyond 60 characters read as no figure, so those rows can warn falsely (named in the README, Task C).
6. Number-only rows ("11, 4000") no longer list a category (ambiguity 2); a sheet of such rows with a Scope 3 ask now warns where base was quiet.

## Lead steps (not tasks)

Held-out is already sealed (sha256 in progress.md). After Task C: score once with `node scripts/sealed_run.js` (bar: at least 10 of 12 should-warn warn, 0 of 12 near-misses warn); re-run guards; final review (Opus plus Codex); evidence doc `docs/evidence/YYYY-MM-DD-prompt-coach-scope3-structure.md` (state the rule 3 deviation, ambiguity 1, and correct spec section 1's "2,161 prompts" to 1,841 out loud); raise with Ian at plan approval whether rules 3-4 should be narrowed (Opus S4: two ordinary finance rows make a Scope 3 file; any category word in an ask triggers a check; the 1,841 prompts do not catch this, only the near-miss set does); update `budget.json` tasksLeft from this plan.

## Review dispositions (round 1)

- Opus M1 and Codex R1 (accept): Task A adds `givenListed` beside `categoryHit`; Task B Step 3(b) replaces `lower.includes(given)` with `givenListed(lower, given)`; new Task B test 4 (numbered ask with bracketed name, name in a remark without a figure, warns; fails on the parent because base is quiet). Unit counts were 64 after A, 68 after B (now 65 and 69, round 2).
- Codex R2 (accept): the year exclusion is on the whole token (`isFigure`: a comma-free token matching `^(?:19|20)\d{2}$` is a year), so 2025 is a year and 2025.5 a figure; Task A test 5 (the 2025 assertion fails on the parent).
- Codex R3 (accept): complete-token validation: "1,240tCO2e" (glued to letters) is not a figure; the plain-number branch cannot accept a prefix of a comma-grouped number; Task A test 6 (1,240tCO2e warns; fails on the parent). Round 2 replaced the single FIGURE regex with greedy token matching plus `isFigure`.
- Opus S1 (reject for this run): the spec defines a figure as not glued to letters; unit-suffixed figures stay non-figures; recorded in ambiguity 4, Risks 5 and the Task C README list.
- Opus S2 (accept): Task A test 7 fails if the window is not cut at the next category name (and fails on the parent).
- Opus S3 (accept): the `;` addition to the waste pattern is dropped; no spec rule needs it; ambiguity 6.
- Opus S4 (no plan change): faithful to spec; the lead raises it with Ian at plan approval (Lead steps).
- Opus S5 (accept): Task C README says "1,841 stored prompts (2,161 rows, of which 320 have no prompt)"; the Step 1 and 3 greps now match "1,841 stored prompts".
- Opus S6 (accept): Task C list names figure before the name, unit-suffixed figures (1.2m), unformatted 1900-2099 read as years, figure more than 60 characters after the name; also the remark/unlabelled number case and number-only rows.
- Opus N1 (applied): stated in ambiguity 1 and the Lead steps. N2 (applied): Risks 6, ambiguity 2, README list. N3 (no change needed). N4 (not applied: optional, harmless, the exact+generic gate counts it once). N5 (applied: Task B Step 5 README wording "names a category (by number or in words)"). N6 (applied: the Task A Step 7 note that `dump` runs before `fixtures`). N7 (applied: byte counts are measured by the implementer, none stated). N8 and N9 (no change; N9's untested 5/5 spent-item figure is the lead's to re-measure).

## Review dispositions (round 2)

The lead re-ran the round-1 FIGURE on three claims and all three were wrong under spec rule 1 (", 1,240.5tco2e" figure, ", 1,240,500tco2e" figure, a 60-character window ending "  1" of "12%" figure).

- Codex R4 (accept): the grouped alternative must match the whole token. `NUM_TOKEN` matches a comma-grouped number greedily with its decimals (`\d{1,3}(?:,\d{3})+(?!\d)(?:\.\d+)?`, else a plain `\d+(?:\.\d+)?`), and `isFigure` then applies the glued-to-letters, percent and year checks to that whole token. Tests: Task A test 6 now also asserts "1,240.5tCO2e" and "1,240,500tCO2e" warn and "1,240.5" and "1,240,500" are quiet (the two warn assertions fail on the parent, which lists by name alone).
- Codex R5 (accept): `figureAfter` no longer slices-and-tests. It cuts the window at the next category name first (`lim`), then accepts only number tokens that START before `lim`, each validated whole against the full lowercased text (so a "%" or letter past the window edge still counts). New Task A test 8: name followed by 59 spaces then "12%" warns (fails on the parent); name followed by 50 spaces then "1,240" is quiet.
- Unit counts: Task A 57 + 8 = 65; Task B 65 + 4 = 69; Task C unchanged at 69. Every task is still 8 steps or fewer (A 8, B 7, C 5), with single-command check lines.
- The case table (25 rows) under Task A lists every FIGURE/figureAfter case from both disposition files plus the spec cases and three planner edge cases.
