# Fit Finder rewrite-reach rule C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: cd fit-finder && node tests/catalogue.test.js
Data: (none)

**Goal:** Replace rewrite-reach rule V2 with rule C: the engine drops every "revise" and tone-word alternative and keeps only 383afd3's REWRITE line plus "worded ... better"; the rewrite card drops `revis` and the tone words and gains `re-?word`, `rephras`, `worded`, `wording`.

**Architecture:** Two single-line text swaps copied from the measured scratch files (the `REWRITE` regex on `engine/fit.js` line 16; the `gen-rewrite` `match` string on `data/catalogue.json` line 169), done by a script with hash checks so nothing is retyped. Tests first: the 13 rewrite-reach checks that claim V2 reach are rewritten to assert C, a new check file `tests/rewrite-pool.jsonl` (the round's 86 sentences) is added, and both must fail on the parent a313d12. Then rebuild the page, correct the README, add the evidence doc and the held-out file, and run 9 mutants.

**Tech Stack:** Node (no dependencies), plain regex, single-file HTML build via `node tests/build.js`.

**Spec:** `LED/round/report.md` (the round: why C, the table, held-out), with `LED=C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v420`. Exact target text: line 16 of `LED/round/c/fit.js` (line sha1 prefix 9785ed6149e6 with its newline, cc223e82fc26 without) and line 169 of `LED/round/c/catalogue.json` (the gen-rewrite `match`, line sha1 prefix 925916191ac7 with its newline, 1a85d2ea4c8b without; lead fix: the prefixes first given were whole-file hashes). The 13 checks that fail under C are listed under "Expected breaks" below (`LED/round/suite-c.txt` does not exist on disk; the same list is in `LED/round/score.txt`, section "== C", line "suite FAIL 13"). Pool: `LED/round/pool.jsonl` (87 rows). Held-out: `LED/heldout.jsonl` (40 rows).

## Global Constraints

- Repo root `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4` (call it `REPO`), branch `worktree-fit-finder-v4`, parent commit `a313d12`. Commit locally only; no push.
- Check sentences are fresh (the round's pool). Never copy text from `fit-finder/data/real/` (git-ignored customer comments). The pool row "Write it in a more professional manner." matches a real comment: it is dropped from the check file and from the new tests (the old check at line 390 used it; the replacement block does not).
- Measured by the planner just now: dist at HEAD is 83,833 bytes (`git show HEAD:fit-finder/dist/fit-finder.html | wc -c`); `engine/fit.js` and `data/catalogue.json` are CRLF in the working copy and LF in the index (`git ls-files --eol`), so the dist built in the working copy is NOT the committed size. gen-rewrite `match` is line 169 and `REWRITE` is line 16 in the repo and in `LED/round/c/`. In `LED/round/pool-results.tsv` (read, not re-run): C reads REWRITE and brings the card on exactly 6 pool asks (the 4 reword/rephrase/worded/wording sentences of the old newWords block plus "Get the note worded better before it goes out." and "I spend time wording these replies better."); no "none" row gets the card. Only read, not re-run by the planner: every score in `LED/round/report.md` (fresh 10 of 23 wrong 6; half A 12/29 w0; held-out B 13/30 w3; real 15/19 w2; eval A 52/60, B 45/60; 139 older texts 0 change vs 383afd3; held-out 40: C 7 of 20 asks, V2 13, live 3). Steps 3, 4 and 8 re-measure them.
- Scratch folder for every step: `LED/crun` (create it; outside the repo). Its scripts are `.cjs` (a `package.json` above `LED` says `"type": "module"`). Copies of the repo under `LED/crun` get their own `package.json` with `{"type":"commonjs"}` (Step 1).
- Every bash block starts with an absolute `cd`; keep it. The suite has to run from `fit-finder/`.
- Git Bash rewrites an argument that starts with `//` as a path (measured by the lead's dry run: the Step 2 anchor arrived as `/ rewrite reach ...` and the splice stopped), so the Step 2 splice runs with `MSYS_NO_PATHCONV=1`; keep it.
- Scripts and text files that contain a backslash are created with the Write tool, never a Bash heredoc or `echo` (a `\\` typed in a Bash command arrives as `\`).

## Scope, groups, cost

- One task, no parallel groups, not a tune task (the rule text is fixed by the round; the numbers are only re-read).
- Locked files (touch only these): `fit-finder/engine/fit.js`, `fit-finder/data/catalogue.json`, `fit-finder/tests/catalogue.test.js`, `fit-finder/tests/rewrite-pool.jsonl` (new), `fit-finder/dist/fit-finder.html`, `fit-finder/README.md`, `docs/evidence/2026-10-17-rewrite-reach-round.md` (new), `docs/evidence/2026-10-17-rewrite-heldout.jsonl` (new).
- Helper-token estimate: Task 1 about 70k; run total about 70k. Paid calls: none.

---

### Task 1: Rewrite-reach rule C

**Files:**
- Create: `fit-finder/tests/rewrite-pool.jsonl` (86 rows)
- Modify: `fit-finder/tests/catalogue.test.js` (replace the whole "rewrite reach" block, lines 335-413, with the C block; add the pool checks)
- Modify: `fit-finder/engine/fit.js:16` (REWRITE regex)
- Modify: `fit-finder/data/catalogue.json:169` (gen-rewrite `match`)
- Modify (generated): `fit-finder/dist/fit-finder.html`
- Modify: `fit-finder/README.md:15` (byte count) and the "Rewrite-reach rule" section (lines 196-223)
- Create: `docs/evidence/2026-10-17-rewrite-reach-round.md`, `docs/evidence/2026-10-17-rewrite-heldout.jsonl`

**Interfaces:**
- Consumes: `rate(text).ops` (contains `'REWRITE'` when the regex matches), `match(text, cat)` (sorted list, `[0].id` is the first card); in the test file the names `fs`, `path`, `assert`, `root`, `cat`, `check`, `rate`, `match` already exist, and `first` (line 304) is already taken, so the new helper is `firstCard`.
- Produces: nothing new in the API. Check names all start `rewrite reach:` or `rewrite pool:` so the mutant run can name them.

- [ ] **Step 1: Scratch scripts, the C copy, the 383afd3 copy and the pool file.** Create these three files with the Write tool, exact content.

`LED/crun/apply.cjs`:

```js
// usage: node apply.cjs <dst file> <src file> <1-based line>; copies one line, keeps the destination's line ending
const fs = require('fs');
const [dst, srcFile, lineNo] = process.argv.slice(2);
const n = Number(lineNo) - 1;
const src = fs.readFileSync(srcFile, 'utf8').split('\n')[n].replace(/\r$/, '');
const text = fs.readFileSync(dst, 'utf8').split('\n');
const cr = text[n].endsWith('\r') ? '\r' : '';
text[n] = src + cr;
fs.writeFileSync(dst, text.join('\n'));
console.log('replaced line', n + 1, 'of', dst);
```

`LED/crun/mkpool.cjs`:

```js
// usage: node mkpool.cjs <C copy fit-finder dir> <LED pool.jsonl> <out file> <real data dir>
// drops the one row that matches a real comment, marks "reach" on the RW rows rule C reads and answers with the card, checks no row is in the real data
const fs = require('fs'), path = require('path');
const [dir, src, out, realDir] = process.argv.slice(2);
const M = require(path.join(dir, 'engine/fit.js'));
const cat = JSON.parse(fs.readFileSync(path.join(dir, 'data/catalogue.json'), 'utf8'));
const DROP = 'Write it in a more professional manner.';
const rows = fs.readFileSync(src, 'utf8').trim().split(/\r?\n/).map((l) => JSON.parse(l));
const kept = rows.filter((r) => r.text !== DROP);
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[.?!]$/, '');
const real = fs.readdirSync(realDir).filter((f) => f.endsWith('.jsonl')).map((f) => norm(fs.readFileSync(path.join(realDir, f), 'utf8'))).join('\n');
const overlap = kept.filter((r) => real.includes(norm(r.text))).map((r) => r.text);
const outRows = kept.map((r) => {
  const o = { text: r.text, want: r.want, source: r.source };
  if (r.want === 'RW' && M.rate(r.text).ops.includes('REWRITE') && M.match(r.text, cat).some((u) => u.id === 'gen-rewrite')) o.reach = true;
  return o;
});
fs.writeFileSync(out, outRows.map((r) => JSON.stringify(r)).join('\n') + '\n');
const n = (f) => outRows.filter(f).length;
console.log('rows', outRows.length, 'none', n((r) => r.want === 'none'), 'RW', n((r) => r.want === 'RW'), 'reach', n((r) => r.reach), 'dropped', rows.length - kept.length, 'overlap with real', overlap.length);
console.log(outRows.filter((r) => r.reach).map((r) => '  reach: ' + r.text).join('\n'));
if (overlap.length) console.log('OVERLAP:', overlap.join(' | '));
```

`LED/crun/older.cjs`:

```js
// usage: node older.cjs <fit-finder dir now> <fit-finder dir 383afd3>: the older texts (tasks.jsonl + the 2026-10-15 community prompts) must rate and match the same
const fs = require('fs'), path = require('path');
const [now, old] = process.argv.slice(2);
const load = (d) => ({ M: require(path.join(d, 'engine/fit.js')), cat: JSON.parse(fs.readFileSync(path.join(d, 'data/catalogue.json'), 'utf8')) });
const A = load(now), B = load(old);
const read = (f) => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
const rows = [...read(path.join(now, 'data/tasks.jsonl')), ...read(path.join(now, 'data/real/2026-10-15-community.jsonl'))];
const ids = (d, t) => d.M.match(t, d.cat).map((u) => u.id).join(',');
let changed = 0;
for (const r of rows) if (JSON.stringify(A.M.rate(r.task)) !== JSON.stringify(B.M.rate(r.task)) || ids(A, r.task) !== ids(B, r.task)) changed++;
console.log('older texts:', rows.length, 'changed (rate + match ids):', changed);
```

Then run:

```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v420"; X="$LED/crun"; REPO="C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4"
rm -rf "$X/copy" "$X/b"; mkdir -p "$X/copy" "$X/b"
cd "$REPO" && git archive a313d12 fit-finder | tar -x -C "$X/copy" && git archive 383afd3 fit-finder | tar -x -C "$X/b"
echo '{"type":"commonjs"}' > "$X/copy/fit-finder/package.json"; echo '{"type":"commonjs"}' > "$X/b/fit-finder/package.json"
node "$X/apply.cjs" "$X/copy/fit-finder/engine/fit.js" "$LED/round/c/fit.js" 16 && node "$X/apply.cjs" "$X/copy/fit-finder/data/catalogue.json" "$LED/round/c/catalogue.json" 169
for p in "$LED/round/c/fit.js:16" "$X/copy/fit-finder/engine/fit.js:16" "$LED/round/c/catalogue.json:169" "$X/copy/fit-finder/data/catalogue.json:169"; do f="${p%:*}"; n="${p##*:}"; printf '%s %s  ' "$(sed -n ${n}p "$f" | tr -d '\r' | sha1sum | cut -c1-12)" "$(printf %s "$(sed -n ${n}p "$f" | tr -d '\r')" | sha1sum | cut -c1-12)"; echo "$f" | tail -c 40; done
node "$X/mkpool.cjs" "$X/copy/fit-finder" "$LED/round/pool.jsonl" "$REPO/fit-finder/tests/rewrite-pool.jsonl" "$REPO/fit-finder/data/real"
wc -l "$REPO/fit-finder/tests/rewrite-pool.jsonl"
```

Expected: two `replaced line` messages; the four hash lines pair up (the two fit.js lines equal, the two catalogue lines equal; each line prints two hashes, one with the trailing newline, one without; the fit.js lines print `9785ed6149e6 cc223e82fc26` and the catalogue lines `925916191ac7 1a85d2ea4c8b`, as measured by the lead's dry run; if not, stop and report); mkpool prints `rows 86 none 42 RW 44 reach 6 dropped 1 overlap with real 0` and lists the 6 reach sentences (the 4 `Reword/Rephrase/worded/wording ... reply to my colleague` ones plus `Get the note worded better ...` and `I spend time wording these replies better.`); `wc -l` prints 86. Stop and report if the rows, reach or overlap numbers differ (an overlap above 0 means a pool row is a real comment: do not commit it). The reach count 6 is the number to report.

- [ ] **Step 2: Write the C checks and splice them in.** Create `LED/crun/block.txt` with the Write tool, exact content (this is the whole new "rewrite reach" block plus the pool checks):

```js
// rewrite reach (rule C, 2026-10-17): only the "rewrite" family and "worded ... better" read as REWRITE; "revise" and tone words neither read nor bring the card
const reads = (t) => rate(t).ops.includes('REWRITE');
const firstCard = (t) => (match(t, cat)[0] || {}).id;
const anyRewriteCard = (t) => match(t, cat).some((u) => u.id === 'gen-rewrite');
const notRewrite = (t) => {
  assert(!reads(t), 'REWRITE wrongly read in: ' + t);
  assert(!anyRewriteCard(t), 'rewrite card wrongly shown for: ' + t);
};
check('rewrite reach: "revise" plus a piece of writing neither reads as REWRITE nor brings the card', () => {
  for (const t of ['Each week I revise the status email before it goes to the team.',
    'Revising my cover letter takes an hour.', 'I revise the long draft twice a month.',
    'Revise the opening paragraph of every memo.', 'Revise my reply.',
    'Revise these emails every week.', 'Revise the replies before they go out.'])
    notRewrite(t);
});
check('rewrite reach: "worded better" reads as REWRITE', () => {
  for (const t of ['Get the note worded better before it goes out.',
    'I spend time wording these replies better.']) {
    assert(reads(t), 'no REWRITE in: ' + t);
    assert.strictEqual(firstCard(t), 'gen-rewrite', 'rewrite card not first for: ' + t);
  }
});
check('rewrite reach: a tone word neither reads as REWRITE nor brings the card', () => {
  for (const t of ['Make the reply more professional.', 'Make my emails less formal.',
    'Make the answer more polite.', 'Make the pushback more diplomatic.',
    'Make the notice less friendly.', 'Make it more professional.',
    'Can you make this sound more polite?', 'Make my memo more concise every month.'])
    notRewrite(t);
});
check('rewrite reach: guards, numbers and plain nouns do not read as REWRITE', () => {
  for (const t of ['Revise the forecast every month.', 'Revise the budget numbers after close.',
    'Revising the headcount plan is slow.', 'She is a professional accountant.',
    'Review the formal approval steps.', 'The clause is worded by legal counsel.',
    'We want a more accurate close calendar.'])
    assert(!reads(t), 'REWRITE wrongly read in: ' + t);
});
check('rewrite reach: "revise" on a thing that only looks like writing is not REWRITE', () => {
  for (const t of ['Revise the draft budget each quarter.', 'Revise the letter of credit amount.',
    'Revise the note payable schedule every month.', 'Revise the note payable interest rate monthly.',
    'Revise the email address in the customer database.', 'Revise the memo field in the vendor table.',
    'Revise the draft forecast before close.'])
    notRewrite(t);
});
check('rewrite reach: a tone word that is not about a piece of writing is not REWRITE', () => {
  for (const t of ['Make the close process more formal.', 'Accrue more professional fees each quarter.',
    'We need a more formal approval process.', 'Hire more professional staff for the audit.',
    'The memo says we need a more formal approval process.', 'Make this process more formal.',
    'We pay more professional fees than peers.'])
    notRewrite(t);
});
// the card's new match words: each sentence has the REWRITE step and no other card word, so only the new word can pick gen-rewrite
const newWords = {
  're-?word': 'Reword the reply to my colleague before it goes out.',
  'rephras': 'Rephrase the reply to my colleague before it goes out.',
  'worded': 'Get the reply to my colleague worded better before it goes out.',
  'wording': 'I keep wording the reply better before it goes out.',
};
for (const [word, t] of Object.entries(newWords)) check('rewrite reach: card match word ' + word, () => {
  assert(reads(t), 'engine does not read REWRITE in: ' + t);
  assert.strictEqual(firstCard(t), 'gen-rewrite', 'first card for: ' + t);
});
check('rewrite reach: the card lists every new match word', () => {
  const m = cat.useCases.find((u) => u.id === 'gen-rewrite').match;
  for (const w of Object.keys(newWords)) assert(m.split('|').some((p) => p.startsWith(w)), 'missing ' + w);
});
check('rewrite reach: the card does not list the dropped words', () => {
  const m = cat.useCases.find((u) => u.id === 'gen-rewrite').match.split('|');
  for (const w of ['revis', 'professional', 'formal', 'polite', 'diplomatic', 'concise', 'friendly'])
    assert(!m.some((p) => p.startsWith(w)), 'the card still lists ' + w);
});
// the round's pool (tests/rewrite-pool.jsonl, 86 sentences from the 2026-10-17 reviews): "none" rows must not bring the rewrite card; "reach" marks the 6 asks rule C reads
const poolRows = fs.readFileSync(path.join(root, 'tests/rewrite-pool.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
check('rewrite pool: 86 rows, 42 none, 44 RW, 6 reach', () => {
  const n = (f) => poolRows.filter(f).length;
  assert.deepStrictEqual([poolRows.length, n((r) => r.want === 'none'), n((r) => r.want === 'RW'), n((r) => r.reach)], [86, 42, 44, 6]);
  assert(poolRows.filter((r) => r.reach).every((r) => r.want === 'RW'), 'reach on a row that is not an ask');
});
check('rewrite pool: no "none" sentence gets the rewrite card', () => {
  const bad = poolRows.filter((r) => r.want === 'none' && anyRewriteCard(r.text)).map((r) => r.text);
  assert.strictEqual(bad.length, 0, bad.length + ' of 42 get gen-rewrite, e.g. ' + bad.slice(0, 2).join(' | '));
});
check('rewrite pool: every reach sentence reads REWRITE and gets the rewrite card first', () => {
  for (const r of poolRows.filter((x) => x.reach)) {
    assert(reads(r.text), 'no REWRITE in: ' + r.text);
    assert.strictEqual(firstCard(r.text), 'gen-rewrite', 'rewrite card not first for: ' + r.text);
  }
});
```

Create `LED/crun/splice.cjs` with the Write tool, exact content:

```js
// usage: node splice.cjs <file> <first line> <last line> <expected start of first line> <expected text of last line> <new block file>
const fs = require('fs');
const [file, a, b, startsWith, lastIs, blockFile] = process.argv.slice(2);
const lines = fs.readFileSync(file, 'utf8').split('\n');
const i = Number(a) - 1, j = Number(b) - 1;
if (!lines[i].startsWith(startsWith) || lines[j].replace(/\r$/, '') !== lastIs) throw new Error('anchor mismatch: ' + JSON.stringify(lines[i].slice(0, 60)) + ' / ' + JSON.stringify(lines[j].slice(0, 60)));
const block = fs.readFileSync(blockFile, 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
lines.splice(i, j - i + 1, ...block);
fs.writeFileSync(file, lines.join('\n'));
console.log('spliced', file, 'lines', a, '-', b, '->', block.length, 'lines');
```

Then:

```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v420"; X="$LED/crun"; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4"
MSYS_NO_PATHCONV=1 node "$X/splice.cjs" fit-finder/tests/catalogue.test.js 335 413 "// rewrite reach (rule V1" "});" "$X/block.txt" && node --check fit-finder/tests/catalogue.test.js && echo syntax-ok
grep -c "revis\|more professional manner" fit-finder/tests/catalogue.test.js; git diff --stat | tail -2
```

Expected: `spliced ... lines 335 - 413 -> N lines`, `syntax-ok`, one changed file in the diff stat. The grep count is the number of lines that still mention "revis" (the notRewrite sentences and check titles; any number above 0 is fine) and must not include the real-comment sentence: `grep -c "Write it in a more professional manner" fit-finder/tests/catalogue.test.js` must print `0`. If the anchor check fails the line numbers moved: re-read the block and fix the numbers, do not edit the anchors.

- [ ] **Step 3: Run the new checks on the parent code; they must fail. Save the baselines.**

```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v420"; X="$LED/crun"
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder" && node tests/catalogue.test.js > "$X/before.txt"; echo "exit $?"; grep -c "^FAIL" "$X/before.txt"; grep "^FAIL" "$X/before.txt" | cut -c1-150
grep "first card right" "$X/before.txt" > "$X/before-cards.txt"; cat "$X/before-cards.txt" | cut -c1-140
node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A > "$X/evalA-before.txt"; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B > "$X/evalB-before.txt"; grep -h -o "fit agreement [^ ]*" "$X/evalA-before.txt" "$X/evalB-before.txt"
```

Expected: `exit 1` and exactly 4 `FAIL` lines, all on a313d12 code (V2): `rewrite reach: "revise" plus a piece of writing neither reads as REWRITE nor brings the card`, `rewrite reach: a tone word neither reads as REWRITE nor brings the card`, `rewrite reach: the card does not list the dropped words`, `rewrite pool: no "none" sentence gets the rewrite card` (its message says `19 of 42 get gen-rewrite`). The other new checks pass on V2 by design (the reword/worded sentences, the finance guards, the pool shape, the reach sentences): they stop an over-narrowing mutant in Step 8. `before-cards.txt` holds four lines: `first card right: 13 of 30; wrong card 3 (67,74,91)...`, `half A first card right: 12 of 29; wrong card 0`, `real prompts first card right: 15 of 19; wrong card 2`, `fresh prompts first card right: 12 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1)...`. Eval A and B baselines are the numbers printed (52/60 and 45/60 are the round's figures; keep the files whatever they print). If fewer than 4 FAIL lines show, a sentence is wrong: fix the sentence, never the rule. If the pool check does not say 19, stop and report.

- [ ] **Step 4: Apply rule C with the script; hash-check; run the suite, the evals and the older-texts check.**

```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v420"; X="$LED/crun"; REPO="C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4"; cd "$REPO"
node "$X/apply.cjs" fit-finder/engine/fit.js "$LED/round/c/fit.js" 16 && node "$X/apply.cjs" fit-finder/data/catalogue.json "$LED/round/c/catalogue.json" 169
for p in "$LED/round/c/fit.js:16" "$X/copy/fit-finder/engine/fit.js:16" "$REPO/fit-finder/engine/fit.js:16" "$LED/round/c/catalogue.json:169" "$X/copy/fit-finder/data/catalogue.json:169" "$REPO/fit-finder/data/catalogue.json:169"; do f="${p%:*}"; n="${p##*:}"; printf '%s  ' "$(sed -n ${n}p "$f" | tr -d '\r' | sha1sum | cut -c1-12)"; echo "$f" | tail -c 40; done
git diff --stat | tail -4
cd "$REPO/fit-finder" && node tests/catalogue.test.js > "$X/after.txt"; echo "exit $?"; grep -c "^FAIL" "$X/after.txt"; grep "first card right" "$X/after.txt" | diff "$X/before-cards.txt" - | cut -c1-170
node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A | diff "$X/evalA-before.txt" - && echo evalA-same; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B | diff "$X/evalB-before.txt" - && echo evalB-same
node "$X/older.cjs" "$REPO/fit-finder" "$X/b/fit-finder"
```

Expected: two `replaced line` messages; the six hashes pair up (the three fit.js lines show one hash, the three catalogue lines show one hash: the repo equals the round's tested files and the scratch copy that produced the pool marks); `git diff --stat` lists the test file, `engine/fit.js` (1 line) and `data/catalogue.json` (1 line); `exit 0`; `0`; the diff of the four score lines shows only the fresh line changed: `12 of 23` becomes `10 of 23` with `wrong card 6 (G2,G14,G15,G22,G26,X1)` unchanged (13/30 w3, half A 12/29 w0 and real 15/19 w2 identical); `evalA-same`; `evalB-same` (A 52/60, B 45/60); `older texts: 139 changed (rate + match ids): 0`. If a new sentence fails only because another card's word wins, reword that sentence to drop the other card's word (never change the rule) and say so in the commit message. If the fresh line is not 10 of 23 with the same six wrong cards, stop and report.

- [ ] **Step 5: Rebuild the page, run the page test, and measure the committed (LF) size.**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder" && node tests/build.js && node tests/pagetest.js | tail -3; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4" && git add fit-finder/dist/fit-finder.html && git show :fit-finder/dist/fit-finder.html | wc -c
```

Expected: pagetest prints `0 failed`; the last number is the staged (LF) size, call it N. It must differ from 83833 (if it is 83833 the build did not pick up the edits). Do NOT use `wc -c < dist/fit-finder.html`: the working copy is CRLF and bigger.

- [ ] **Step 6: README, evidence doc, held-out file.** 

(a) Create `LED/crun/readme-c.txt` with the Write tool, exact content:

```
Rewrite-reach rule C (2026-10-17). It replaces rule V1 (0dd05ca) and rule V2 (6f7090e); both were
reviewed and withdrawn. Rule C is the 383afd3 engine plus one alternative: "worded ... better"
(word-ed or word-ing, up to two words, then better: "get the note worded better") reads as REWRITE.
The rewrite card matches rewrit, shorten, tighten, plain english, board, executives, audience, tone,
too long, plus four new words: re-word, rephras, worded and wording. "Revise" and the tone words
(professional, formal, polite, diplomatic, concise, friendly) are not read as REWRITE and are not
on the card.

An earlier version of this section said V2 kept "all the V1 gains" and read a tone word "only when it
describes a piece of writing". Neither held. On the round's pool of 42 sentences that are not
rewrites ("Revise the budget draft before close.", "Make the notes payable schedule more formal."),
V2 gave 19 the rewrite card; every one of the 19 hit a card word V1 and V2 had added (revis 8,
formal 6, professional 3, concise 1, friendly 1), and dropping any single added engine alternative
still left 12 or more. So the guards did not converge and rule C removes the alternatives instead.

Numbers (the suite prints the fresh line first on its line:
`fresh prompts first card right: 10 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1)`; first
scored 8 of 23 before any rule, V2 12):
- Fresh 29 prompts: first card right 10 of 23, wrong card 6, the same six wrong cards as before.
  The rule was chosen after seeing which of these missed, so this is a tuned-on figure.
- Blind held-out, 40 sentences (`docs/evidence/2026-10-17-rewrite-heldout.jsonl`, 20 rewrite asks and
  20 that are not; labels by the model; each rule scored once): rewrite card on 7 of 20 asks for
  rule C, 13 for V2, 3 for the live rule (383afd3); on the 20 that are not rewrites 1 of 20 for every
  rule, the same row (H32, "tone at the top"). Rule C reaches fewer asks than V2 and is far
  cleaner on the pool: `tests/rewrite-pool.jsonl` holds 86 sentences, 0 of 42 non-rewrites get the
  card (V2 19), and 6 of 44 asks reach it.
- Unchanged: half A 12 of 29 wrong card 0, held-out B 13 of 30 wrong card 3, real prompts 15 of 19
  wrong card 2, eval A 52/60 and B 45/60, and the 139 older texts rate and match the same as at
  383afd3.

Known limit: asks such as "make this memo more concise", "make this more diplomatic" and "revise
this slide text" get no rewrite card. Rule C was chosen on the pool it is scored on; the held-out 40
is the out-of-sample check. One pool label is the model's call ("Accrue more professional fees." =
not a rewrite). Details: `docs/evidence/2026-10-17-rewrite-reach-round.md`.
The prediction above stays disproved as scored once, before the rule.
```

(b) Apply it and set the byte count (replace `N` below by the Step 5 number, with a thousands comma, e.g. `83,901`):

```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v420"; X="$LED/crun"; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4"
node "$X/splice.cjs" fit-finder/README.md 196 223 "Rewrite-reach rule (added 2026-10-17" "The prediction above stays disproved as scored once, before the rule." "$X/readme-c.txt"
sed -i 's/(83,833 bytes)/(N bytes)/' fit-finder/README.md
grep -n "bytes)" fit-finder/README.md | head -2; grep -n "V1\|V2\|83,833" fit-finder/README.md | cut -c1-110
```

Expected: `spliced ... lines 196 - 223`; the byte-count line shows N (the Step 5 number); the last grep shows only the new section's lines (history sentences naming V1/V2) and no `83,833`. Replace the literal `N` in the sed command with the real number before running it; the command must not run with a literal `N`.

(c) Create `docs/evidence/2026-10-17-rewrite-reach-round.md` with the Write tool, exact content:

```
# Rewrite-reach two-strikes round (2026-10-17, Fit Finder v4.20)

Source: the round report `LED/round/report.md` (an Opus helper, 129,116 tokens, 32 tool uses; the lead
re-ran `bash run.sh`, exit 0, score.txt byte-identical, and scored the held-out). Figures here are
copied from that report; the suite and eval figures were re-measured on the committed tree (see the
commit). Repo at a313d12 (V2); live rule 383afd3. The pool in `fit-finder/tests/rewrite-pool.jsonl`
is the round's pool of 87 sentences minus one row that matches a real comment (86 rows).

Verdict: rule C. 0 of 42 pool false positives get gen-rewrite, and no set gains a wrong first card.

| rule | pool FP with card /42 | asks RW+card /45 | fresh right/23, wrong | G10 G12 G13 G17 | A | B | real | eval A/B | 139 changed | suite FAIL |
|---|---|---|---|---|---|---|---|---|---|---|
| 383afd3 (U) | 0 | 0 | 8, 6 | none x4 | 12/29 w0 | 13/30 w3 | 15/19 w2 | 52/45 | 0/0 | 18 (14 V2-only, 4 V1) |
| HEAD a313d12 (V2) | 19 | 32 | 12, 6 | right x4 | same | same | same | 52/45 | 0/0 | 0 |
| C | 0 | 6 | 10, 6 | none none right right | same | same | same | 52/45 | 0/0 | 13 (10 V2-only, 3 V1) |

Wrong first cards are the same on every rule: fresh G2, G14, G15, G22, G26, X1; B 67, 74, 91; real W1, S1.
(The "asks" column counts the 45 pool asks with the row "Write it in a more professional manner."
included; that row is not read by C, so the count of 6 is the same on the 44 kept.)

## Held-out (lead; `2026-10-17-rewrite-heldout.jsonl`, 40 blind sentences, labels by the model, scored once per rule)

| rule | asks: rewrite card /20 (first) | not-rewrite: rewrite card /20 |
|---|---|---|
| 383afd3 (U) | 3 (3) | 1 (H32 "tone at the top") |
| C | 7 (7) | 1 (same H32) |
| V2 | 13 (12) | 1 (same H32) |

V2 and U were scored before C existed; C once, after. The round helper never opened the file.

## Causes (each shown by an experiment)
1. "revise + writing noun" fires on 8 false positives and 8 asks; its nouns are also finance objects
   (FP / ask / 168-row corpus: draft 6/1/13, memo 4/3/7, note 5/1/6, letter 2/2/0, revis 18/14/1).
2. The tone alternatives: "noun ... more/less tone" 7 FPs, 16 asks; "more/less tone manner/way/register"
   4 and 2 (formal 12/2/0, professional 8/10/4 as in "professional fees").
3. The card words decide what is shown: all 19 FPs with the card hit an added card word (revis 8, formal 6,
   professional 3, concise 1, friendly 1). Swap: V2 engine + 383afd3 card = 0 FPs; 383afd3 engine + V2 card = 1.
4. Guards do not converge: dropping any single added alternative or card word leaves 12 or more FPs.
   Only reword, rephras, wording (0 FPs) and worded (1, read by nothing) sit on the asks side alone.

## Rule C, exact
`engine/fit.js` line 16: 383afd3's REWRITE line plus `word(?:ed|ing) (?:[\w'-]+ ){0,2}better` before `keep(?:ing)`.
gen-rewrite `match`: `rewrit\w*|shorten\w*|tighten\w*|plain english|board|executives?|audience|tone|too long|re-?word\w*|rephras\w*|worded|wording`

## Limits
- C was chosen on the pool it is scored on (in-sample); the held-out 40 is the out-of-sample check.
- C reaches fewer asks than V2 (held-out 7 vs 13; fresh 10 vs 12): "make this memo more concise", "more
  diplomatic", "revise this slide text" get no card.
- One pool label is the helper's: "Accrue more professional fees." = none.
```

(d) Copy and check the held-out file, then re-read the README section once:

```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v420"; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4"
cp "$LED/heldout.jsonl" docs/evidence/2026-10-17-rewrite-heldout.jsonl; wc -l docs/evidence/2026-10-17-rewrite-heldout.jsonl; sha1sum docs/evidence/2026-10-17-rewrite-heldout.jsonl | cut -c1-8
```

Expected: `40` lines and hash prefix `991b35ee` (the round report's value). If different, stop and report.

- [ ] **Step 7: Commit (local only).**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4"
git add fit-finder/engine/fit.js fit-finder/data/catalogue.json fit-finder/tests/catalogue.test.js fit-finder/tests/rewrite-pool.jsonl fit-finder/dist/fit-finder.html fit-finder/README.md docs/evidence/2026-10-17-rewrite-reach-round.md docs/evidence/2026-10-17-rewrite-heldout.jsonl
git status --short
git commit -m "Fit Finder: rewrite-reach rule C (drops revise and tone words, card gains re-word/rephras/worded/wording; fresh 10 of 23 wrong 6, pool false positives 19 -> 0, held-out asks 7 of 20 vs V2 13, live 3)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UxBJDejVhQBFP3Xr9ZqMxR"
git show HEAD:fit-finder/dist/fit-finder.html | wc -c; git status --short
```

Expected: the first `git status --short` lists exactly the 8 paths above (6 `M`/`A` in fit-finder, 2 `A` in docs/evidence); the commit lands; the byte count equals N and equals the number in README line 15; the last `git status --short` is empty.

- [ ] **Step 8: Mutant run and final numbers, on the committed tree.** Create `LED/crun/mut.cjs` with the Write tool (not a Bash heredoc), exact content:

```js
const fs = require('fs'), cp = require('child_process');
const fit = 'engine/fit.js', cat = 'data/catalogue.json';
const R = String.raw;
const P = 'rewrite reach: ';
const onLine = (n, fn) => (s) => { const L = s.split('\n'); const before = L[n - 1]; L[n - 1] = fn(before); if (L[n - 1] === before) throw new Error('needle missing on line ' + n); return L.join('\n'); };
const cut = (needle) => (line) => line.replace(needle, '');
const swap = (a, b) => (line) => line.replace(a, () => b);
const T_REV = P + '"revise" plus a piece of writing neither reads as REWRITE nor brings the card';
const T_TONE = P + 'a tone word neither reads as REWRITE nor brings the card';
const T_WB = P + '"worded better" reads as REWRITE';
const T_DROP = P + 'the card does not list the dropped words';
const T_CW = (w) => P + 'card match word ' + w;
const CARD_END = R`|worded|wording"`;
const muts = [
  [fit, 'worded-better alternative dropped from the engine', onLine(16, cut(R`word(?:ed|ing) (?:[\w'-]+ ){0,2}better|`)), T_WB],
  [fit, 'tone words back in the engine', onLine(16, swap(R`|word(?:ed|ing) (?:`, R`|(?:more|less) (?:professional|formal|polite|diplomatic|concise|friendly)|word(?:ed|ing) (?:`)), T_TONE],
  [fit, 'revise back in the engine', onLine(16, swap(R`|word(?:ed|ing) (?:`, R`|revis\w*|word(?:ed|ing) (?:`)), T_REV],
  [fit, 'rephras dropped from the engine', onLine(16, cut(R`rephras\w*|`)), T_CW('rephras')],
  [cat, 'revis back on the card', onLine(169, swap(CARD_END, R`|revis\\w*|worded|wording"`)), T_DROP],
  [cat, 'friendly back on the card', onLine(169, swap(CARD_END, R`|worded|wording|friendly"`)), T_DROP],
  [cat, 'rephras dropped from the card', onLine(169, cut(R`rephras\\w*|`)), T_CW('rephras')],
  [cat, 'wording dropped from the card', onLine(169, swap(CARD_END, R`|worded"`)), T_CW('wording')],
  [cat, 're-?word dropped from the card', onLine(169, cut(R`re-?word\\w*|`)), T_CW('re-?word')],
];
let survived = 0;
for (const [file, label, fn, title] of muts) {
  const src = fs.readFileSync(file, 'utf8');
  let mutated;
  try { mutated = fn(src); } catch (e) { console.log('NEEDLE NOT FOUND', label, e.message); survived++; continue; }
  fs.writeFileSync(file, mutated);
  const out = cp.spawnSync('node', ['tests/catalogue.test.js'], { encoding: 'utf8' }).stdout || '';
  const killed = out.split('\n').some((l) => l.startsWith('FAIL ' + title + ' -'));
  if (!killed) survived++;
  console.log(killed ? 'killed  ' : 'SURVIVED', label, '<=', title.slice(15, 75));
  cp.spawnSync('git', ['checkout', '--', file]);
}
console.log('survivors:', survived);
```

Run, then the final numbers:

```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v420"
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder" && node "$LED/crun/mut.cjs"; git status --short
node tests/catalogue.test.js | tail -8 | cut -c1-200; node tests/pagetest.js | tail -2; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A | grep -o "fit agreement [^ ]*"; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B | grep -o "fit agreement [^ ]*"; node "$LED/crun/older.cjs" "$PWD" "$LED/crun/b/fit-finder"; git show HEAD:fit-finder/dist/fit-finder.html | wc -c; grep -n "bytes)" README.md | head -2
```

Expected: 9 lines starting `killed`, then `survivors: 0`; the first `git status --short` prints nothing (files restored by `git checkout`, safe because Step 7 committed). A `SURVIVED` line means a check is too weak: sharpen the sentence in the matching check (Step 2 block), re-run Steps 4 and 7 as a new commit (amend nothing), then re-run this step. A `NEEDLE NOT FOUND` line means the committed text differs from the needle: report it, do not edit the needle to fit. Final run: no `FAIL` line and `all catalogue checks pass`; fresh `10 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1)`, half A `12 of 29 ... 0`, held-out B `13 of 30 ... 3`, real `15 of 19 ... 2`; pagetest `0 failed`; eval A 52/60 and B 45/60 (the `fit agreement` lines as saved in Step 3); `older texts: 139 changed (rate + match ids): 0`; the byte count equals README line 15; status empty. Report the numbers as measured and say which were only read (the held-out 7/13/3 and the pool 0 of 42 vs 19 come from the round report; the 19 is re-measured by Step 3, the 0 by the Step 4 pool checks).

## Expected breaks

rewrite reach: "revise" plus a piece of writing reads as REWRITE | fixed by Task 1
rewrite reach: "more or less" plus a tone word reads as REWRITE | fixed by Task 1
rewrite reach: "revise" plus a plural noun or "reply" reads as REWRITE | fixed by Task 1
rewrite reach: a tone word about "it", "this" or "sound" reads as REWRITE | fixed by Task 1
rewrite reach: "more professional manner" reads as REWRITE | fixed by Task 1
rewrite reach: card match word revis | fixed by Task 1
rewrite reach: card match word professional | fixed by Task 1
rewrite reach: card match word formal | fixed by Task 1
rewrite reach: card match word polite | fixed by Task 1
rewrite reach: card match word diplomatic | fixed by Task 1
rewrite reach: card match word concise | fixed by Task 1
rewrite reach: card match word friendly | fixed by Task 1
rewrite reach: the card lists every new match word | fixed by Task 1
