# Prompt coach: quote line, evidence (2026-10-20)

Labels: **measured this run (Lead)** = the lead ran it in the plan run; **measured this run (Task 5 helper)** = run by the Task 5 helper; **read** = taken from a doc or report, not re-run here.

## 1. Prediction and drop rule (stated before measuring)

Drop rule: if more than 10% of the quoted headlines quote the wrong words (by label or by eye) in the out-of-fold shipped-line check, revert and park. Prediction: about 51 quoted, 0 wrong by label, at most 2 wrong by eye.

## 2. Pre-drop measurements (change applied)

- Parent baseline on 5cfff0c, measured this run (Lead): unit 57/0; simulate runs 2070, strongNotStrong 2, betterWeak 5, toggleNoEffect 0, dupSentence 0, badText 2, emptyFrag 0; customer_check PASS 229; eval rulefeat acc 0.856 flips 8; pagetest 12/0.
- Red then green, measured this run (Lead): unit 57/6 (6 new tests red) -> 63/0; pagetest on the parent dist with the new checks 15/1 (the quote check red) -> 15/0.
- Train dump, in-sample, measured this run (Lead): rows 1080, changed 50, quoted 50, bad 0.
- Drop check, out of fold, measured this run (Lead): weak 432, quoted 51, wrong by label 0; wrong by eye 0 of 51 (Opus reader). Borderline rows: 24 cut at the ".xlsx" dot; 9 a second ask behind "..."; 40 "review" from an OBJECTIVE: template value (not counted). Worst case 3/51 = 5.9%, under 10%.
- Prediction (about 51 / 0 / at most 2) met. Verdict: **KEPT**.
- Warts for the final review (read, from the reader's notes): span cut on a "." inside a file name; trailing comma before "..."; en and em dash not trimmed.

## 3. Final state (HEAD, after build), measured this run (Task 5 helper)

After `node tests/build.js`, one role-checks line each:

| Line | Result | Parent |
|---|---|---|
| unit | `# pass 63`, `# fail 0` | 57/0 |
| simulate | runs=2070 strongNotStrong 2 betterWeak 5 toggleNoEffect 0 dupSentence 0 badText 2 emptyFrag 0 | identical |
| customer_check | PASS 229 runs | identical |
| eval rulefeat | GRADE acc=0.856 flips=8 | identical |
| pagetest | 15 checks, 0 failed | 12/0 |

`git status --short prompt-coach/dist` after the build: empty (dist matches the commit). filetest: not run (it was not in the role checks and was not confirmed to work with nothing installed). README byte count was stale on the parent (336173 vs stated 334435); now 337684 (read, from the lead).

Captures (headless Chrome, 1280x900, the Your prompt panel; its label reads "WHY IT'S WEAK" for a weak grade), made by `prompt-coach/research/2026-10-20-quote-line-capture.js`. A first run clipped in viewport coordinates after scrolling and produced two blank images; the script now adds the scroll offset. Both final images were opened and checked: right panel, nothing on top, no blank area.

| Case | File | sha256 | Headline text |
|---|---|---|---|
| "help with the 10-K" | `2026-10-20-prompt-coach-quote-line/quote.png` | `2f8377bce1924016c0c0d40c99597b7310568ec5bd687d7d1275bec1dd602638` | The AI would have to guess what to read and the one thing you want back. The coach read your ask as "help with the 10-K": that says what to look at, not what a finished answer looks like. |
| "Evaluate: carefully" | `2026-10-20-prompt-coach-quote-line/exclusion.png` | `9eee68bc2c2317ab524796c616b29f0c094fce6cfaf7444c3d89bed1017793a1` | The AI would have to guess what to read and the one thing you want back. |

## 4. Ruling and finding

- PM proxy ruling 06:04Z (`.ledger/2026-10-20-prompt-coach-reason-line/rulings.md`): the quote goes in the headline. Basis, measured this run (Lead, headless Chrome on the parent dist): the weak reason line (`stages.weak.verdict`) is visible on no tab since 16a49e2 (2026-10-14); the control headline is visible.
- Finding: the 147-of-430 probe measured a line users never see; the headline names only source and ask.
- Read, not measured here: published work, the duplicate session's 12.8%, the lead's Chrome measurement of the seam.
- Process note (read): the Codex plan review needed a scratch CODEX_HOME and the unelevated sandbox (elevated fails in a background job, Windows error 1223).

## 5. For Ian

1. Proxy decided A (headline) at 06:04Z after B (ask only); he may overturn.
2. The 147-of-430 wrong-letter figure applies to a verdict nobody sees; re-measure the headline's source/ask claim if he wants one.
3. Option D (name only sure letters) is still his.
4. The README byte count was stale and is corrected.
5. The live sandbox shows nothing (0 of 13 weak).
