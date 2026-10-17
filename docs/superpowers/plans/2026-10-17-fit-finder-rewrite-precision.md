# Fit Finder rewrite-reach rule V2 (precision) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: cd fit-finder && node tests/catalogue.test.js
Data: (none)

**Goal:** Narrow the rewrite-reach rule V1 so the engine stops reading numbers and finance prompts ("Revise the draft budget", "a more formal approval process") as REWRITE, while keeping every V1 gain; add `concise|friendly` to the rewrite card, plural nouns and "reply".

**Architecture:** Two text swaps copied from the measured scratch files (the `REWRITE` regex on `engine/fit.js` line 16; the `gen-rewrite` `match` string on `data/catalogue.json` line 169), done by a small script so nothing is retyped. New checks go into `tests/catalogue.test.js` first and must fail on 607cf8a. Then rebuild the page and rewrite the README paragraph for rule V1 as plain V2.

**Tech Stack:** Node (no dependencies), plain regex, single-file HTML build via `node tests/build.js`.

**Spec:** the findings F1-F6 in `C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v419/progress.md` (merged Opus + Codex final review of a1c94cb). Exact target text: line 16 of `.../fit-finder-v419/v2scratch/fit.js` and the `gen-rewrite` `match` line (line 169) of `.../fit-finder-v419/v2scratch/catalogue.json`. Probe that measured them: `.../fit-finder-v419/v2probe.cjs` (run as `node v2probe.cjs <abs fit-finder dir> <scratch dir> card plural`); its sentences are the test sentences below.

## Global Constraints

- Repo root `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4`, branch `worktree-fit-finder-v4`, parent commit `607cf8a`. Commit locally only; no push.
- Check sentences are written fresh (they are the probe's). Never copy text from `fit-finder/data/real/` (git-ignored customer comments).
- Measured by the planner just now: dist at HEAD is 82,907 bytes (`git show HEAD:fit-finder/dist/fit-finder.html | wc -c`); `engine/fit.js` and `data/catalogue.json` are CRLF in the working copy and LF in the index (`git ls-files --eol`), so the dist built in the working copy is NOT the committed size (the a1c94cb slip). Only read, not re-run by the planner: all card scores and the probe results (fresh 12 of 23 wrong 6 unchanged, 14 false-positive sentences REWRITE 14 -> 0, 139 older texts 0 changed, control 1, eval A 52/60, B 45/60). Steps 2 and 4 re-measure them.
- Scratch folder for every step: `LED/v2run`, where `LED=C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v419` (outside the repo). The probe deletes and refills `LED/v2run/copy`; keep no output files inside `copy`.
- Every bash block starts with an absolute `cd` (the shell keeps its folder between calls, so a bare `cd fit-finder` in one step breaks the repo-root paths of the next); keep it. The suite has to run from `fit-finder/`.
- The two scripts in Steps 3 and 7 contain backslashes: create them with the Write tool, never a Bash heredoc (a `\\` typed in a Bash command arrives as `\`).

## Scope, groups, cost

- One task, no parallel groups, not a tune task (the rule text is fixed by the probe; the numbers are only re-read).
- Locked files (touch only these): `fit-finder/engine/fit.js`, `fit-finder/data/catalogue.json`, `fit-finder/tests/catalogue.test.js`, `fit-finder/dist/fit-finder.html`, `fit-finder/README.md`.
- Helper-token estimate: Task 1 about 55k; run total about 55k. Paid calls: none.

---

### Task 1: Rewrite-reach rule V2 (precision)

**Files:**
- Modify: `fit-finder/tests/catalogue.test.js` (the "rewrite reach" block, lines 335-380: extend `newWords`, add five checks after the guards check at line 360)
- Modify: `fit-finder/engine/fit.js:16` (REWRITE regex)
- Modify: `fit-finder/data/catalogue.json:169` (gen-rewrite `match`)
- Modify (generated): `fit-finder/dist/fit-finder.html`
- Modify: `fit-finder/README.md:15` (byte count) and the "Rewrite-reach rule V1" paragraph (about lines 195-206)

**Interfaces:**
- Consumes: `rate(text).ops` (contains `'REWRITE'` when the regex matches), `match(text, cat)` (sorted list, `[0].id` is the first card); helpers `reads`, `newWords`, `cat`, `check`, `assert` already exist in the block.
- Produces: nothing new in the API. Check names all start `rewrite reach:` so the mutant run can name them.

- [ ] **Step 1: Write the failing checks.** In `fit-finder/tests/catalogue.test.js`:

(a) Add two entries to the `newWords` object (after the `diplomatic` entry, line 371):

```js
  'concise': 'Make my memo more concise every month.',
  'friendly': 'Make the reply to my colleague more friendly.',
```

(b) Insert this block right after the guards check (it ends at line 360, `});`), before the `// the card's new match words` comment:

```js
// V2 precision (2026-10-17): the 14 false-positive sentences. Each must not read as REWRITE and must not put the rewrite card first.
const notRewrite = (t) => {
  assert(!reads(t), 'REWRITE wrongly read in: ' + t);
  assert.notStrictEqual((match(t, cat)[0] || {}).id, 'gen-rewrite', 'rewrite card first for: ' + t);
};
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
check('rewrite reach: "revise" plus a plural noun or "reply" reads as REWRITE', () => {
  for (const t of ['Revise my reply.', 'Revise these emails every week.',
    'Revise the replies before they go out.'])
    assert(reads(t), 'no REWRITE in: ' + t);
});
check('rewrite reach: a tone word about "it", "this" or "sound" reads as REWRITE', () => {
  for (const t of ['Make it more professional.', 'Can you make this sound more polite?'])
    assert(reads(t), 'no REWRITE in: ' + t);
});
check('rewrite reach: "more professional manner" reads as REWRITE', () => {
  assert(reads('Write it in a more professional manner.'), 'no REWRITE in the manner sentence');
});
```

Expected: nothing runs yet; the file still parses (`node --check fit-finder/tests/catalogue.test.js` prints nothing).

- [ ] **Step 2: Save baselines, run the checks on the parent; they must fail.**

```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v419"; R="$LED/v2run"; mkdir -p "$R"
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder" && node tests/catalogue.test.js > "$R/before.txt"; echo "exit $?"; grep -c "^FAIL rewrite reach" "$R/before.txt"; grep "^FAIL rewrite reach" "$R/before.txt" | cut -c1-120
grep "first card right" "$R/before.txt" > "$R/before-cards.txt"
node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A > "$R/evalA-before.txt"; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B > "$R/evalB-before.txt"; tail -2 "$R/evalA-before.txt" "$R/evalB-before.txt"
node "$LED/v2probe.cjs" "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder" "$R/copy" card plural > "$R/probe.txt"; grep -E "^(sentences bad|fresh|older|control)" "$R/probe.txt" | cut -c1-200
```
Expected: `exit 1`; the `FAIL rewrite reach` count is at least 4 and the list includes the two false-positive checks, the plural check and `the card lists every new match word` (the `card match word concise` and `friendly` checks may fail too; the manner and "it/this/sound" checks pass on the parent, correctly: they guard against over-narrowing and kill a mutant in Step 7). `before-cards.txt` holds the fresh line `first card right: 12 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1)`; eval A 52/60 and B 45/60 (if the printed form differs keep the files as the baseline). The probe prints `sentences bad: 0`, `fresh V2  : right 12 of 23 (...); wrong 6 (G2,G14,G15,G22,G26,X1)`, `older texts: 139 changed (rate + match ids): 0`, `control (gen-rewrite removed) changes: 1`. If any of those four differs, stop and report it. If a false-positive check does NOT fail on the parent, the sentence is wrong: fix the sentence, not the rule.

- [ ] **Step 3: Apply the measured text with a script (nothing retyped).** Create `LED/v2run/apply.cjs` with the Write tool, exact content:

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
Then:
```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v419"; R="$LED/v2run"; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4"
node "$R/apply.cjs" fit-finder/engine/fit.js "$LED/v2scratch/fit.js" 16 && node "$R/apply.cjs" fit-finder/data/catalogue.json "$LED/v2scratch/catalogue.json" 169
for p in "$LED/v2scratch/fit.js" "$R/copy/engine/fit.js" fit-finder/engine/fit.js "$LED/v2scratch/catalogue.json" "$R/copy/data/catalogue.json" fit-finder/data/catalogue.json; do printf '%s  ' "$(tr -d '\r' < "$p" | sha1sum | cut -c1-12)"; echo "$p" | tail -c 40; done
git diff --stat | tail -4
```
Expected: two `replaced line` messages; the six hashes pair up: the three fit.js lines show one hash, the three catalogue.json lines show one hash (the repo equals both the lead's scratch file and the probe-built copy that produced the measurements); `git diff --stat` lists the test file, `engine/fit.js` (1 line changed) and `data/catalogue.json` (1 line changed). If a hash pair differs, stop and report.

- [ ] **Step 4: Run the suite and the evals; compare with the baselines.**

```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v419"; R="$LED/v2run"
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder" && node tests/catalogue.test.js > "$R/after.txt"; echo "exit $?"; grep -c "^FAIL" "$R/after.txt"; grep "first card right" "$R/after.txt" | diff "$R/before-cards.txt" - && echo cards-same; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A | diff "$R/evalA-before.txt" - && echo evalA-same; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B | diff "$R/evalB-before.txt" - && echo evalB-same
```
Expected: `exit 0`; `0`; `cards-same` (the fresh line and the half A, held-out and real lines are unchanged: fresh 12 of 23 wrong 6 G2,G14,G15,G22,G26,X1); `evalA-same`; `evalB-same` (A 52/60, B 45/60). If a new sentence fails only because another card's word wins, reword that sentence to drop the other card's word (never change the rule) and say so in the commit message.

- [ ] **Step 5: Rebuild the page, run the page test, and measure the committed (LF) size.**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder" && node tests/build.js && node tests/pagetest.js | tail -3; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4" && git add fit-finder/dist/fit-finder.html && git show :fit-finder/dist/fit-finder.html | wc -c
```
Expected: pagetest prints `0 failed`; the last number is the staged (LF) size, call it N. It must differ from 82907 (if it is 82907 the build did not pick up the edits). Do NOT use `wc -c < dist/fit-finder.html`: the working copy is CRLF and bigger.

- [ ] **Step 6: Rewrite the README paragraph, then commit.** In `fit-finder/README.md`:

1. Line 15: change `(82,907 bytes)` to N with a thousands comma.
2. Replace the whole paragraph that starts `Rewrite-reach rule V1 (2026-10-17, added after the first score above)` and ends `The prediction above stays disproved as scored once, before the rule.` (keep the `fresh prompts first card right: 12 of 23 ...` line exactly as it is, it does not change) with:

```
Rewrite-reach rule (added 2026-10-17 as V1 after the first score above, narrowed the same day to V2
after a review found V1 also fired on numbers and finance prompts). Beyond the older words, the
engine reads three kinds of wording as REWRITE:

- "revise" or "revising", up to two words, then email, letter, memo, message, draft, text, wording,
  language, paragraph, section, note or reply (plural too), but only when that noun ends the phrase:
  punctuation, the end of the text, or a joining word such as to, for, before, and, every.
  "Revise the status email before it goes out" counts. "Revise the draft budget", "the letter of
  credit", "the note payable schedule" and "the email address" no longer do.
- "worded better" or "wording ... better" (up to two words between).
- "more" or "less" with professional, formal, polite, diplomatic, concise or friendly, but only when
  it describes a piece of writing: after a writing word (email, reply, memo, letter, message, note,
  text, wording, language, tone, response, answer, summary, draft, pushback, notice, paragraph,
  section, commentary, narrative; up to four words between), after "it", "this", "that" or "them",
  or after sound, read or come across, and the phrase must end there ("make it more professional",
  "make this sound more polite"); or followed by manner, tone, way, voice, style, register, wording
  or language ("in a more professional manner"). It no longer reads "a more formal approval
  process", "hire more professional staff", "more professional fees" or "make this process more
  formal".

The rewrite card matches re-word, rephrase, revis, worded, wording, professional, formal, polite,
diplomatic, concise and friendly. The suite prints (unchanged by V2)
`fresh prompts first card right: 12 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1); no card where one fits 5 (G4,G16,G19,G20,G21); card on a not-a-fit prompt 1 (G5); fit agreement 12 of 29; labelled by Ian 0, by the model 29`.
V2 was checked on 14 sentences that V1 read as REWRITE and V2 does not (suite checks guard them),
on the V1 gains (all kept), and on the 139 older texts: 0 change in rate() or match() (control:
removing gen-rewrite changes 1). The rule was chosen after seeing which of these 29 prompts missed,
so 12 of 23 is a tuned-on figure, not a held-out test, and there is no held-out evidence either way.
The prediction above stays disproved as scored once, before the rule.
```
3. Check nothing else disagrees: `grep -n "V1\|82,907\|a writing noun" fit-finder/README.md` should show no leftover claim (the first-score `8 of 23` text stays, labelled as the first score).

Commit (local only):
```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4"
git add fit-finder/engine/fit.js fit-finder/data/catalogue.json fit-finder/tests/catalogue.test.js fit-finder/dist/fit-finder.html fit-finder/README.md
git status --short
git commit -m "Fit Finder: rewrite-reach rule V2 (end-of-phrase and writing-object guards, plurals, reply, concise/friendly on the card; fresh 12 of 23 wrong 6 unchanged, 14 false positives -> 0)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01G4ZB5724WRt2iQ85rbuyxc"
git show HEAD:fit-finder/dist/fit-finder.html | wc -c
```
Expected: `git status --short` lists exactly the five files; the commit lands; the last number equals N and equals the number written in README line 15; `git status --short` is then empty.

- [ ] **Step 7: Mutant run.** Each new clause is removed from the committed files; the named check must FAIL. Create `LED/v2run/mut.cjs` with the Write tool (not a Bash heredoc), exact content:

```js
const fs = require('fs'), cp = require('child_process');
const fit = 'engine/fit.js', cat = 'data/catalogue.json';
const R = String.raw;
const cut = (s, needle) => { const i = s.indexOf(needle); if (i < 0) throw new Error('needle missing: ' + needle.slice(0, 50)); return s.slice(0, i) + s.slice(i + needle.length); };
const swap = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('needle missing: ' + a.slice(0, 50)); return s.slice(0, i) + b + s.slice(i + a.length); };
const T_A = 'rewrite reach: "revise" on a thing that only looks like writing is not REWRITE';
const T_B = 'rewrite reach: a tone word that is not about a piece of writing is not REWRITE';
const T_PL = 'rewrite reach: "revise" plus a plural noun or "reply" reads as REWRITE';
const T_MAN = 'rewrite reach: "more professional manner" reads as REWRITE';
const T_LIST = 'rewrite reach: the card lists every new match word';
const REV_LA = R`(?= ?(?:[^\w\s]|$)| (?:to|for|before|after|so|and|or|but|that|which|from|with|in|on|at|i|we|it|until|when|each|every|twice|once|takes?|took|is|was|are|again|first|then|because|if|as|by|of (?:my|the|our|this|that|a|an|your|his|her|their|every|each|all))\b)`;
const TONE_LA = R`(?= ?(?:[^\w\s]|$)| (?:and|or|but|to|for|than|before|after|when|so|please|while|without|in|with|now|overall|instead|if|because|as|every|each|again|today|first|next|by|on|at|from)\b)`;
const OBJ_START = R`(?:(?:emails?|repl(?:y|ies)|memos?`;
const OBJ_END = R`(?:more|less) (?:professional|formal|polite|diplomatic|concise|friendly)(?= `;
const MANNER = R`|(?:more|less) (?:professional|formal|polite|diplomatic|concise|friendly) (?:manner|tone|way|voice|style|register|wording|language)`;
const muts = [
  [fit, 'end-of-phrase lookahead on revise', (s) => cut(s, REV_LA), T_A],
  [fit, 'writing-object prefix on the tone word', (s) => { const i = s.indexOf(OBJ_START), j = s.indexOf(OBJ_END, i); if (i < 0 || j < 0) throw new Error('obj missing'); return s.slice(0, i) + s.slice(j); }, T_B],
  [fit, 'complement lookahead on the tone word', (s) => cut(s, TONE_LA), T_B],
  [fit, 'manner alternative', (s) => cut(s, MANNER), T_MAN],
  [fit, 'plural s? on the revise nouns', (s) => swap(s, R`(?:emails?|letters?|memos?|messages?|drafts?|texts?|wording|language|paragraphs?|sections?|notes?|repl(?:y|ies))(?=`, R`(?:email|letter|memo|message|draft|text|wording|language|paragraph|section|note|repl(?:y|ies))(?=`), T_PL],
  [fit, 'repl(y|ies) on the revise nouns', (s) => swap(s, R`notes?|repl(?:y|ies))(?=`, R`notes?)(?=`), T_PL],
  [cat, 'concise|friendly on the card', (s) => { const i = s.indexOf('"match": "rewrit'), j = s.indexOf('|concise|friendly"', i); if (i < 0 || j < 0) throw new Error('card missing'); return s.slice(0, j) + s.slice(j + '|concise|friendly'.length); }, T_LIST],
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
  console.log(killed ? 'killed  ' : 'SURVIVED', label, '<=', title.slice(15, 60));
  cp.spawnSync('git', ['checkout', '--', file]);
}
console.log('survivors:', survived);
```
Run:
```bash
LED="C:/Users/teasp/Documents/studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v419"
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder" && node "$LED/v2run/mut.cjs"; git status --short
```
Expected: 7 lines starting `killed`, then `survivors: 0`; `git status --short` prints nothing (files restored by `git checkout`, safe because Step 6 committed). A `SURVIVED` line means a check is too weak: sharpen a sentence in the matching check (Step 1 block), re-run Steps 4 and 6 (a new commit; amend nothing), then re-run this step. A `NEEDLE NOT FOUND` line means the committed regex differs from the needle: report it, do not edit the needle to fit.

- [ ] **Step 8: Final suite and numbers, on the committed tree.**

```bash
cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder" && node tests/catalogue.test.js | tail -8 | cut -c1-260; node tests/pagetest.js | tail -2; git show HEAD:fit-finder/dist/fit-finder.html | wc -c; grep -n "bytes)" README.md | head -2; git status --short
```
Expected: no `FAIL` line; the fresh line reads `first card right: 12 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1)`; half A, held-out and real lines as in `before.txt` (12/29 wrong 0; 13/30 wrong 3; 15/19 wrong 2); pagetest `0 failed`; the byte count equals README line 15; status empty. Report the numbers as measured, and say which were only read (eval A 52/60, B 45/60 are measured in Step 4; the probe numbers in Step 2).

Note on expected breaks (the section below is empty on purpose: the rehearse parser reads every non-empty line under it as a break): none. No existing check changes its expected output: the V1 "rewrite reach" checks keep their sentences and pass on V2 (the probe ran them), and the printed fresh line does not move.

## Expected breaks
