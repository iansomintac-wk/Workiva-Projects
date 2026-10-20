# Prompt coach: quote line, evidence (2026-10-20)

Shipped state: HEAD b62746c, wording D. The headline ends ` The coach read your ask as "<span>".` (the quote alone, no clause after it). Section 1 is round 1 kept as history; sections 2 and 3 are the final review, the fix round and the final state.

Labels: **measured this run (Lead)** = the lead ran it in the plan run; **measured this run (Task 5 helper)** = run by the Task 5 helper; **read** = taken from a doc or report, not re-run here.

## 1. Round 1 (first wording, superseded)

Wording then: `...: that says what to look at, not what a finished answer looks like.` Replaced in the fix round below.

### 1.1 Prediction and drop rule (stated before measuring)

Drop rule: if more than 10% of the quoted headlines quote the wrong words (by label or by eye) in the out-of-fold shipped-line check, revert and park. Prediction: about 51 quoted, 0 wrong by label, at most 2 wrong by eye.

### 1.2 Pre-drop measurements (change applied)

- Parent baseline on 5cfff0c, measured this run (Lead): unit 57/0; simulate runs 2070, strongNotStrong 2, betterWeak 5, toggleNoEffect 0, dupSentence 0, badText 2, emptyFrag 0; customer_check PASS 229; eval rulefeat acc 0.856 flips 8; pagetest 12/0.
- Red then green, measured this run (Lead): unit 57/6 (6 new tests red) -> 63/0; pagetest on the parent dist with the new checks 15/1 (the quote check red) -> 15/0.
- Train dump, in-sample, measured this run (Lead): rows 1080, changed 50, quoted 50, bad 0.
- Drop check, out of fold, measured this run (Lead): weak 432, quoted 51, wrong by label 0; wrong by eye 0 of 51 (Opus reader). Borderline rows: 24 cut at the ".xlsx" dot; 9 a second ask behind "..."; 40 "review" from an OBJECTIVE: template value (not counted). Worst case 3/51 = 5.9%, under 10%.
- Prediction (about 51 / 0 / at most 2) met. Verdict: **KEPT**.
- Warts for the final review (read, from the reader's notes): span cut on a "." inside a file name; trailing comma before "..."; en and em dash not trimmed.

### 1.3 State after round 1 (superseded; before the fix round), measured this run (Task 5 helper)

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
| "help with the 10-K" | `2026-10-20-prompt-coach-quote-line/quote.png` (superseded) | `2f8377bce1924016c0c0d40c99597b7310568ec5bd687d7d1275bec1dd602638` | The AI would have to guess what to read and the one thing you want back. The coach read your ask as "help with the 10-K": that says what to look at, not what a finished answer looks like. |
| "Evaluate: carefully" | `2026-10-20-prompt-coach-quote-line/exclusion.png` | `9eee68bc2c2317ab524796c616b29f0c094fce6cfaf7444c3d89bed1017793a1` | The AI would have to guess what to read and the one thing you want back. |

### 1.4 Ruling and finding

- PM proxy ruling 06:04Z (`.ledger/2026-10-20-prompt-coach-reason-line/rulings.md`): the quote goes in the headline. Basis, measured this run (Lead, headless Chrome on the parent dist): the weak reason line (`stages.weak.verdict`) is visible on no tab since 16a49e2 (2026-10-14); the control headline is visible.
- Finding: the 147-of-430 probe measured a line users never see; the headline names only source and ask.
- Read, not measured here: published work, the duplicate session's 12.8%, the lead's Chrome measurement of the seam.
- Process note (read): the Codex plan review needed a scratch CODEX_HOME and the unelevated sandbox (elevated fails in a background job, Windows error 1223).

## 2. Final review and fix round

Findings (read, from the reviewers' reports `reviews/final-opus.md` and `reviews/final-codex-result-2.json`):
- Opus SF1: a one-word span makes the clause "says what to look at" false; 6 of 51 out of fold (lead-counted: Analyze, Help, help, review, Thoughts, thoughts). SF2: the span is cut on any dot (file names).
- Codex QC-001: leading spaces. QC-002: en and em dashes. QC-003: the compare check could pass when it should fail.
- Codex QC-102: this doc's Final state was stale (this rewrite). Codex QC-101: wording A failed the gate (see below).

Steps, each from `.ledger/2026-10-20-prompt-coach-reason-line/progress.md`:

| Step | Commit | Result | Who measured |
|---|---|---|---|
| Fix for SF1, SF2, QC-001, QC-002 (one word gives no quote, sentence-end rule, leading space, dash trim) | 08f6c15 | unit red 63/4 -> green 67/0; lead re-ran the red on the engine export (63/4) and the green | implementer; lead re-run |
| Compare hardening (QC-003) | 3e4197f | old compare passed both mutations; hardened compare exits 1 on both ("BAD row count before 1080 after 1079"; "BAD train_fr:1 grade"); compare 1080 / 44 / 44 / 0; out of fold weak 432, quoted 45, wrong by label 0; one-word quotes 0 | implementer; lead re-run |
| By-eye on the 45 with the old clause | - | wrong words 0 of 45; "says what to look at" false 6 of 45 (strict), 11 with borderline | Opus reader |
| Wording A (PM proxy ruling 08:40Z): `: that does not say what a finished answer looks like.` | 53b208a | red 66/1 -> 67/0; dist 337095 | implementer; lead opened quote.png |
| Shipped check went vacuous | f79f5b6 | after the wording change it reported "quoted 0": its matcher was pinned to the old words "that says". Fix: matcher takes any tail; red quoted 0 -> green 45; spans identical to the earlier TSV | lead caught it; implementer fixed |
| By-eye on A | - | wrong words 0 of 45; false 6 of 45 (the clause is false where the prompt gives a format or length after the span: rows 5, 25, 26, 27, 30, 40). Above the proxy's bar of 4, so A drops | Opus reader |
| Wording D (quote alone), per the proxy chain | b62746c | red 66/1 -> 67/0; out of fold 45 / 0, spans identical; dist 337042 | implementer; lead re-ran |
| By-eye on D | - | wrong words 0 of 45; false 1 of 45 (2.2%): row 12 "look at cell F12", where the first sentence says the AI must guess what to read although the label S is present. A detector error the quote exposes, counted. Shape-bad 0. Verdict: **KEPT** (drop rule 10%) | Opus reader |

Both the one-word failure and the wording-A failure were caught by a reader looking at the 45 headlines, and the vacuous shipped check by the lead; none by the automated checks as first written.

## 3. Final state (HEAD b62746c), measured by the lead

| Line | Result |
|---|---|
| unit | 67 pass, 0 fail |
| pagetest | 15 checks, 0 failed |
| simulate | runs 2070, strongNotStrong 2, betterWeak 5, toggleNoEffect 0, dupSentence 0, badText 2, emptyFrag 0 |
| customer_check | PASS 229 runs |
| eval rulefeat | acc 0.856, flips 8 |
| compare, in-sample | rows 1080, changed 44, quoted 44, bad 0 |
| shipped check, out of fold | weak 432, quoted 45, wrong by label 0 (lead); wrong words by eye 0 of 45, false 1 of 45 (Opus reader) |
| dist | 337042 bytes (equals the README line 9 count) |

Captures (fingerprints measured by the lead, who opened quote.png):

| Case | File | sha256 | Headline text |
|---|---|---|---|
| "help with the 10-K" | `2026-10-20-prompt-coach-quote-line/quote.png` | `1f941d9a1260c68d0e4c15a6792bc7f6b378f74e6172e0fcc7d1802924c3b4ae` | The AI would have to guess what to read and the one thing you want back. The coach read your ask as "help with the 10-K". |
| "Evaluate: carefully" | `2026-10-20-prompt-coach-quote-line/exclusion.png` | `9eee68bc2c2317ab524796c616b29f0c094fce6cfaf7444c3d89bed1017793a1` | The AI would have to guess what to read and the one thing you want back. |

## 4. For Ian

1. The 147-of-430 finding: that probe measured a reason line users never see (no tab shows it since 16a49e2); the headline names only source and ask. Re-measure the headline's claim if he wants a figure.
2. Row 12 ("look at cell F12"): the headline says the AI must guess what to read although the source label is present. A detector error the quote makes visible; the 1 false of 45.
3. The PM proxy made the wording calls: A (quote in the visible headline, 06:04Z), then the clause `: that does not say what a finished answer looks like.`, then D (quote alone) when that clause was false on 6 of 45. All his to overturn.
4. Odd endings among the 45 (a trailing comma before "...", some 8-word spans): not fixed.
5. Option D from the talk (name only the letters the detector is sure of) is still his.
6. The live sandbox shows nothing (0 of 13 weak).
