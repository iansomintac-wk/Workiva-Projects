# Fit Finder rewrite-reach rule V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: cd fit-finder && node tests/catalogue.test.js
Data: (none)

**Goal:** Make the engine read "revise the draft email", "worded better" and "more professional" as REWRITE, and let the `gen-rewrite` card match those words, so the rewrite card reaches more real prompts.

**Architecture:** One alternation added to the `REWRITE` regex in `engine/fit.js`; one list of match words added to the `gen-rewrite` entry in `data/catalogue.json`. New checks in `tests/catalogue.test.js` are written first and must fail on 383afd3. Then rebuild the page and update the README.

**Tech Stack:** Node (no dependencies), plain regex, single-file HTML build via `node tests/build.js`.

**Spec:** `docs/FIT_FINDER_RESUME_PROMPT.txt` lines 49-56 (rewrite-reach probe, V1) and the last section of `fit-finder/README.md`. Exact regex text: V1 branch of `C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/variant-a1b6.js` (reproduced in Step 3).

## Global Constraints

- Repo root `C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4`, branch `worktree-fit-finder-v4`, parent commit `383afd3`. Commit locally only; no push.
- Check sentences are written fresh. Never copy text from `fit-finder/data/real/` (git-ignored customer comments).
- Measured now: dist at HEAD is 82,594 bytes (`git show HEAD:fit-finder/dist/fit-finder.html | wc -c`). Only read, not re-run by the planner: all card scores (8 of 23 fresh, 12 after V1, per the resume prompt). The lead ran every Step 1 sentence on a scratch copy with V1 applied (job bc8a82fb tmp/v1probe.js): 26 of 28 behaved as intended; the 'revis' and 'wording' card sentences failed and were replaced by sentences measured to pass (each fails when its word is removed from the card). Step 2 and Step 4 still prove them in the repo.
- Scratch folder for every step: `C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr` (outside the repo).
- Run all commands from the repo root; the suite has to run from `fit-finder/`.

## Scope, groups, cost

- One task, no parallel groups, not a tune task (the rule text is fixed by the probe; the number is only re-read).
- Locked files (touch only these): `fit-finder/engine/fit.js`, `fit-finder/data/catalogue.json`, `fit-finder/tests/catalogue.test.js`, `fit-finder/dist/fit-finder.html`, `fit-finder/README.md`.
- Helper-token estimate: Task 1 about 60k; run total about 60k. Paid calls: none.

---

### Task 1: Rewrite-reach rule V1

**Files:**
- Modify: `fit-finder/tests/catalogue.test.js` (append new checks before the final `console.log` at line 381, or right after the "commentary" check at line 329-335; the helpers `rate`, `match`, `cat`, `check`, `assert` already exist at the top)
- Modify: `fit-finder/engine/fit.js:16` (REWRITE regex)
- Modify: `fit-finder/data/catalogue.json:169` (gen-rewrite `match`)
- Modify (generated): `fit-finder/dist/fit-finder.html`
- Modify: `fit-finder/README.md:15` (byte count) and the section "Right card on fresh real prompts" (line 174 on)

**Interfaces:**
- Consumes: `rate(text).ops` (array that contains `'REWRITE'` when the regex matches), `match(text, cat)` (sorted list of use cases, `[0].id` is the first card).
- Produces: nothing new in the API. Check names all start `rewrite reach:` so a mutant run can grep them.

- [ ] **Step 1: Write the failing checks.** Insert this block into `fit-finder/tests/catalogue.test.js` right after the "commentary" check (it ends at line 335):

```js
// rewrite reach (rule V1, 2026-10-17): wording changes that name no "rewrite" verb still read as REWRITE
const reads = (t) => rate(t).ops.includes('REWRITE');
check('rewrite reach: "revise" plus a piece of writing reads as REWRITE', () => {
  for (const t of ['Each week I revise the status email before it goes to the team.',
    'Revising my cover letter takes an hour.', 'I revise the long draft twice a month.',
    'Revise the opening paragraph of every memo.'])
    assert(reads(t), 'no REWRITE in: ' + t);
});
check('rewrite reach: "worded better" reads as REWRITE', () => {
  for (const t of ['Get the note worded better before it goes out.',
    'I spend time wording these replies better.'])
    assert(reads(t), 'no REWRITE in: ' + t);
});
check('rewrite reach: "more or less" plus a tone word reads as REWRITE', () => {
  for (const t of ['Make the reply more professional.', 'Make my emails less formal.',
    'Make the answer more polite.', 'Make the pushback more diplomatic.',
    'Make the summary more concise.', 'Make the notice less friendly.'])
    assert(reads(t), 'no REWRITE in: ' + t);
});
check('rewrite reach: guards, numbers and plain nouns do not read as REWRITE', () => {
  for (const t of ['Revise the forecast every month.', 'Revise the budget numbers after close.',
    'Revising the headcount plan is slow.', 'She is a professional accountant.',
    'Review the formal approval steps.', 'The clause is worded by legal counsel.',
    'We want a more accurate close calendar.'])
    assert(!reads(t), 'REWRITE wrongly read in: ' + t);
});
// the card's new match words: each sentence has the REWRITE step and no other card word, so only the new word can pick gen-rewrite
const newWords = {
  'revis': 'Revise the email to my colleague before it goes out.',
  're-?word': 'Reword the reply to my colleague before it goes out.',
  'rephras': 'Rephrase the reply to my colleague before it goes out.',
  'worded': 'Get the reply to my colleague worded better before it goes out.',
  'wording': 'I keep wording the reply better before it goes out.',
  'professional': 'Make the reply to my colleague more professional.',
  'formal': 'Make the reply to my colleague less formal.',
  'polite': 'Make the reply to my colleague more polite.',
  'diplomatic': 'Make the reply to my colleague more diplomatic.',
};
for (const [word, t] of Object.entries(newWords)) check('rewrite reach: card match word ' + word, () => {
  assert(reads(t), 'engine does not read REWRITE in: ' + t);
  assert.strictEqual((match(t, cat)[0] || {}).id, 'gen-rewrite', 'first card for: ' + t);
});
check('rewrite reach: the card lists every new match word', () => {
  const m = cat.useCases.find((u) => u.id === 'gen-rewrite').match;
  for (const w of Object.keys(newWords)) assert(m.split('|').some((p) => p.startsWith(w)), 'missing ' + w);
});
```

- [ ] **Step 2: Save baselines and run the checks on the parent; they must fail.**

Run (creates scratch files outside the repo):
```bash
mkdir -p "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr" && cd fit-finder && node tests/catalogue.test.js > "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/before.txt"; echo "exit $?"; grep -c "^FAIL rewrite reach" "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/before.txt"; grep "first card right" "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/before.txt" > "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/before-cards.txt"; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A > "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/evalA-before.txt"; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B > "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/evalB-before.txt"; tail -3 "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/evalA-before.txt" "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/evalB-before.txt"
```
Expected: `exit 1`; the count is at least 12 (the three positive checks, the card-word checks, the list check; the guards check passes on the parent, which is correct: it is a guard); `before-cards.txt` holds the lines with `fresh prompts first card right: 8 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1)`; eval A shows 52/60 and B 45/60 (as the resume prompt says; if the printed form differs, keep the files as the baseline). If the guards check fails here, the sentence is wrong: fix the sentence, not the rule.

- [ ] **Step 3: Write the minimal implementation.** Two edits, exact text.

(a) `fit-finder/engine/fit.js` line 16. In the REWRITE regex, replace the tail
`|keep(?:ing)? (?:[\w-]+ ){0,6}up to date)\b/,`
with
`|revis(?:e|ing) (?:[\w'-]+ ){0,2}(?:email|letter|memo|message|draft|text|wording|language|paragraph|section|note)|word(?:ed|ing) (?:[\w'-]+ ){0,2}better|(?:more|less) (?:professional|formal|polite|diplomatic|concise|friendly)|keep(?:ing)? (?:[\w-]+ ){0,6}up to date)\b/,`
(the three new alternatives go in front of the `keep(?:ing)?` one; nothing else on the line changes).

(b) `fit-finder/data/catalogue.json` line 169, the `gen-rewrite` entry. In its `"match"`, replace `|audience|tone|too long"` with
`|audience|tone|too long|re-?word\\w*|rephras\\w*|revis\\w*|worded|wording|professional|formal|polite|diplomatic"`
(JSON text: each backslash is doubled, as the existing words are).

- [ ] **Step 4: Run the suite and the evals; compare with the baselines.**

```bash
cd fit-finder && node tests/catalogue.test.js > "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/after.txt"; echo "exit $?"; grep -c "^FAIL" "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/after.txt"; grep "first card right" "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/after.txt" | diff "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/before-cards.txt" - ; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A | diff "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/evalA-before.txt" - && echo evalA-same; node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B | diff "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/evalB-before.txt" - && echo evalB-same
```
Expected: `exit 0`; `0`; the diff shows only the fresh line changing, and the new line contains `fresh prompts first card right: 12 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1)` (the "no card where one fits" count falls, fit agreement may move); the lines for half A (12/29, wrong 0), held-out (13/30, wrong 3) and real (15/19, wrong 2) appear on neither side of the diff, so they are unchanged; `evalA-same`; `evalB-same` (A 52/60, B 45/60). If a new sentence fails only because another card's word wins, reword that sentence to drop the other card's word (never change the rule), and say so in the commit message.

- [ ] **Step 5: Rebuild the page and run the page test.**

```bash
cd fit-finder && node tests/build.js && node tests/pagetest.js | tail -3; wc -c < dist/fit-finder.html
```
Expected: pagetest prints `0 failed`; the byte count is the new dist size, call it N (it differs from 82594 because the regex and card grew; if it is still 82594, the build did not pick up the edits).

- [ ] **Step 6: Update the README, then commit.** In `fit-finder/README.md`:
  1. Line 15: change `(82,594 bytes)` to the new byte count N with a thousands comma.
  2. Append to the "Right card on fresh real prompts (2026-10-17)" section (after its last paragraph, before the next heading or end of file): a short paragraph, in plain words: rewrite-reach rule V1 was added after the first score above (engine reads "revise" + a writing noun, "worded better", "more/less" + a tone word as REWRITE; the rewrite card gains re-word, rephrase, revis, worded, wording, professional, formal, polite, diplomatic). The suite now prints `fresh prompts first card right: 12 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1)` plus the rest of the printed line as the suite shows it (paste the real line from `after.txt`, labelled by the model 29). Say plainly: the rule was chosen after seeing which of these 29 prompts missed, so 12 of 23 is a tuned-on figure, not a new held-out test; 0 of the 139 older texts change in rate() or match() (measured by the lead on a V1 scratch copy; control: removing gen-rewrite changes 1), so there is no held-out evidence either way; the prediction above stays disproved as scored once, before the rule. Do not quote any customer text.
  3. Check nothing else in the README now disagrees (`grep -n "8 of 23\|82,594" fit-finder/README.md`: the first-score line stays, labelled as the first score).

Commit (local only):
```bash
git add fit-finder/engine/fit.js fit-finder/data/catalogue.json fit-finder/tests/catalogue.test.js fit-finder/dist/fit-finder.html fit-finder/README.md
git commit -m "Fit Finder: rewrite-reach rule V1 (fresh first card right 8 -> 12 of 23, wrong 6 unchanged; tuned on these 29, not a held-out test)" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013JGmgjbApSeReHaYgXYreN"
```
Expected: the commit lands; `git status` clean. Check: `git show HEAD:fit-finder/dist/fit-finder.html | wc -c` equals the number written in the README line 15.

- [ ] **Step 7: Mutant run.** Each engine alternative alone, and each new card word alone, is removed from the committed files; the new checks must catch it. Create the script outside the repo WITH THE WRITE TOOL (not a Bash heredoc: a `\\` in a Bash tool command arrives as `\`, which breaks the needles), run it, and it restores the files with `git checkout` after each mutant (safe because Step 6 committed).

File `C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/mut.js` (Write tool), exact content:
```js
const fs = require('fs'), cp = require('child_process');
const fit = 'engine/fit.js', cat = 'data/catalogue.json';
const muts = [
  [fit, "|revis(?:e|ing) (?:[\\w'-]+ ){0,2}(?:email|letter|memo|message|draft|text|wording|language|paragraph|section|note)"],
  [fit, "|word(?:ed|ing) (?:[\\w'-]+ ){0,2}better"],
  [fit, "|(?:more|less) (?:professional|formal|polite|diplomatic|concise|friendly)"],
  ...['re-?word\\\\w*', 'rephras\\\\w*', 'revis\\\\w*', 'worded', 'wording', 'professional', 'formal', 'polite', 'diplomatic'].map((w) => [cat, '|' + w]),
];
let survived = 0;
for (const [file, needle] of muts) {
  const src = fs.readFileSync(file, 'utf8');
  const from = file === cat ? src.indexOf('"match": "rewrit') : 0;
  const at = src.indexOf(needle, from);
  if (at < 0) { console.log('NEEDLE NOT FOUND', needle); survived++; continue; }
  fs.writeFileSync(file, src.slice(0, at) + src.slice(at + needle.length));
  const out = cp.spawnSync('node', ['tests/catalogue.test.js'], { encoding: 'utf8' }).stdout;
  const killed = /^FAIL rewrite reach/m.test(out);
  if (!killed) survived++;
  console.log(killed ? 'killed  ' : 'SURVIVED', file, needle);
  cp.spawnSync('git', ['checkout', '--', file]);
}
console.log('survivors:', survived);
```
Run:
```bash
cd fit-finder && node "C:/Users/teasp/.claude/jobs/bc8a82fb/tmp/rr/mut.js"; git status --short
```
Expected: 12 lines starting `killed`, then `survivors: 0`; `git status --short` prints nothing (files restored). A `SURVIVED` line means a check is too weak: add or sharpen a sentence in the matching check (Step 1 block), re-run Steps 4 and 6 (commit the fix as a new commit; amend nothing), then re-run this step. Note: removing the `revis` engine alternative may also be caught by the card-word checks; any `FAIL rewrite reach` line counts.

- [ ] **Step 8: Final suite and numbers, on the committed tree.**

```bash
cd fit-finder && node tests/catalogue.test.js | tail -8 | cut -c1-260; node tests/pagetest.js | tail -2; git show HEAD:fit-finder/dist/fit-finder.html | wc -c; grep -n "bytes)" README.md | head -2
```
Expected: no `FAIL` line; the fresh line reads `first card right: 12 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1)`; the half A, held-out and real lines are as in `before.txt` (12/29 wrong 0; 13/30 wrong 3; 15/19 wrong 2); pagetest `0 failed`; the byte count printed equals the one in README line 15. Report the numbers as measured, and say which were only read.

Note on expected breaks (the section below is empty on purpose: the rehearse parser reads every line there as a break): none. No existing check changes its expected output: the printed fresh line moves (8 to 12 of 23) but it is a print, not a check, and the README quotes both the first score and the new one.

## Expected breaks
