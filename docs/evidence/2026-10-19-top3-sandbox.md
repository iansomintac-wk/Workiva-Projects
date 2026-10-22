# Top-3 and sandbox: evidence (2026-10-19)

Branch: fit-finder-top3. Plan: docs/superpowers/plans/2026-10-19-fit-finder-top3-sandbox.md. Spec: docs/superpowers/specs/2026-10-19-fit-finder-top3-sandbox-design.md.

## 1. Ian's words and what this run did

Ian's words (verbatim, from the spec):
- Rule C, tone-only edits: "Leave as is (Recommended)". Rule C stays; the page keeps "couldn't tell".
- Asked "teammates first or customers now?": "What can you do to make it ready for both? You have access to Workiva AI from the browser extension."
- On the spread (top 3 cards + sandbox test, teammates now, customers after a fresh blind check): "Yes, 2 + 3 (Recommended)".
- On this design: "Yes, write it up (Recommended)".

What this run did:
- Wrote a fresh blind set of 43 sentences (32 fit, 11 not) with gold labels, by a helper that never saw the engine or the card patterns. Committed with sha256 before any change (c93c1e4).
- Scored it once on the parent and once at the end. Nothing scored it in between.
- Built 8 sandbox cards with made-up files and planted items, ran them in Ian's own Workiva AI sandbox through a Chrome driver session, scored every answer twice, and fixed the failing cards.
- Skipped the three-card page (Task 3). The PM proxy decided this after the parent score (Ian may overturn). Reason in section 4.

## 2. Prediction versus measured

Prediction (spec): on the fresh blind set, "right card anywhere in the 3 shown" is at least 3 more than "first card right" on the same set. Disproved by a gain under 3, or the count of tasks with any wrong card shown rising by more than the gain.

The two score lines below are one measurement read twice (at the parent, then at the end). They are the recorded lines, unchanged.

Parent score:

first card right: 9 of 32 that fit; wrong card 1 (X2); no card where one fits 22 (X4,X5,X6,X8,X10,X12,X13,X14,X16,X17,X18,X22,X25,X26,X28,X29,X30,X33,X34,X36,X39,X40); card on a not-a-fit prompt 0 (); fit agreement 18 of 43; score 24
top 3: right card anywhere in the 3 shown 9 of 32 that fit (first card right 9, gain 0); any wrong card shown 1 of 43 (X2); first card wrong or on a not-a-fit prompt 1; rise in wrong lists 0

End score:

first card right: 9 of 32 that fit; wrong card 1 (X2); no card where one fits 22 (X4,X5,X6,X8,X10,X12,X13,X14,X16,X17,X18,X22,X25,X26,X28,X29,X30,X33,X34,X36,X39,X40); card on a not-a-fit prompt 0 (); fit agreement 18 of 43; score 24
top 3: right card anywhere in the 3 shown 9 of 32 that fit (first card right 9, gain 0); any wrong card shown 1 of 43 (X2); first card wrong or on a not-a-fit prompt 1; rise in wrong lists 0

- G (gain) = 0. D (rise in wrong lists) = 0. D is the rise against a first-card-only page; the old page already listed cards 2 and 3 as "Also close:" text.
- Prior, the tune-set sanity line (the tune set was tuned on, so it flatters the engine): first card right 23 of 35, top 3 right 26 of 35, gain 3; any wrong card shown 7 of 50; rise in wrong lists 3.
- Fit rows with more than one gold card: 2 of 32 (reported, not a quota).
- Scorer note: "first card right 9" includes X41, which fits, has no matching feature, and had none shown. So the right feature was first for 8 of 31.
- The main failure is no card at all: 22 of 32 that fit. A three-card list cannot fix that.

prediction disproved: gain 0, needed at least 3.

## 3. Sandbox results

Eight cards, two per area. Files were added with @ in chat with files (uploaded .docx or .xlsx, one fresh chat per card). Ian also ran card 1 once with the file text pasted. All files are made up. The company names (Quellmoor Foods, Tarnwick Works) had no match in 4 web searches (snippets only, not a registry check).

| card | planted found of 5 | facts invented | feature where the card says | fixed and re-run | added with @ or pasted |
|---|---|---|---|---|---|
| fr-yoy-narrative | 5 | 1 ("$" on every amount; Ian's pasted run added "£") | yes: chat with files (@) | prompt fixed (keep amounts and units as written, mark unexplained changes TO CONFIRM); re-run 5 found, 0 invented, pass | @ (Ian also pasted once) |
| fr-narrative-tables | 5 | 0 | yes: chat with files (@) | not needed | @ |
| grc-evidence | 5 | 0 | no: Evidence analyzer is not in this sandbox; plain @ chat answered | card kept, feature reported | @ |
| grc-rationalize | 5 | 0 | no: no Risk and Control knowledge base in this sandbox; plain @ chat answered | card kept, feature reported | @ |
| sus-anomalies | 5 | 0 | yes: in the spreadsheet (Ask about selected cells); in place 5 found, 0 invented | not needed | @ in chat, then in place |
| sus-exec-narrative | 5 | 0 | yes: in the document (select text, Quick edits) | no re-run; "stays" now says count the words yourself | @ in chat, then in place |
| gen-summarize-file | 4 | 1 ("£" added; decisions squeezed into "three points") | yes: chat with files (@) | prompt fixed twice; re-run 1: 4 found, 0 invented (amounts dropped); re-run 2: 5 found, 0 invented, pass | @ |
| gen-rewrite | 5 | 0 (borderline: "slightly below target" for "a little lower than we hoped") | yes: in the document (same route) | no re-run; "stays" now says every number and fact, count the words | @ in chat, then in place |

Plainly:
- Failed the first run: fr-yoy-narrative and gen-summarize-file (both added a currency). Both pass after the fix.
- Failing in place: gen-rewrite in the document ("close to the budget" became "within budget"; 74 words against under 70). sus-exec-narrative in place passes the sheet rule but broke two instructions (92 to 94 words against under 80; led with the cause, not what changed). In chat it was 85 words and it misreported its own count (79). Word counts are measured, not taken from the answers (the answers' own counts were wrong 3 times out of 4). This is Workiva AI behaviour; the prompts were not changed for it.
- Missing feature: grc-evidence (Evidence analyzer) and grc-rationalize (Risk and Control knowledge base) are absent in this sandbox. Reported, not removed (spec).
- Card 1 no longer names the Prompt advisor (Ian: "This should replace that").
- Caveat: the sandbox may have previews or entitlements a customer lacks, and it lacked two GRC features. It shows what Workiva AI can do, not what every customer has.
- "6 pass" in the sheet means the sheet rule only (found at least 4, 0 invented). It does not mean every instruction was followed: see the word limits above, and gen-summarize-file needed two re-runs.

## 4. What changed on the page

- The page still shows one card in full. Cards 2 and 3 are "Also close:" names, as before. The three-card list and the card switch were not built.
- Why: the parent score showed gain 0, and the main failure (no card, 22 of 32) is one a list cannot fix.
- The "How it rates" sentence now carries the new numbers: "On 43 more new test sentences, written and labelled by AI and never tuned on, the first feature was right for 8 of the 31 that fit and have a matching feature, wrong for 1, and none was shown for 22 of them; it rightly showed none for the 11 that do not fit and for the 1 that fits but has no matching feature."
- fr-yoy-narrative now names the files chat first (final review must-fix).
- Prompt fixes on fr-yoy-narrative and gen-summarize-file. Prompt advisor dropped from fr-yoy-narrative (Ian's words); it stays on two rewrite cards.
- Dist size: 92152 bytes (LF).

## 5. Reviews

- Opus final review: 1 must-fix, 3 should-fix, 5 nits.
- Codex review: 2 must-fix, 3 should-fix, 1 nit.
- All must-fix handled in 9888c48: surfaces order; "How it rates" and README wording; "6 pass" qualified.
- Codex audit: 146 commands. No run of a forbidden script. No read of the real-data folder, the top3 set, the blind or holdout sets, or the sealed folder. Two commands read the scorer source (cat, rg): that is reading the code under review, not scoring.
- 5-word overlap check against the real prompts (N=5, 57 files): 8 lines, all one stock phrase, "the year over year change", already present 3 times before this branch.
- Open for Ian (locked files, not changed):
  - The scorer should count "rightly none" separately, with an empty-gold test.
  - synth-score.test has no rank 3 / rank 4 boundary case.
  - sandbox-kit.test checks .some, not the first match. Measured now: all 8 kit cards rank first, so no live bug.
  - fr-yoy-narrative.txt: the prior-year section lacks the MADE-UP tag (file already uploaded).
  - gen-rewrite chat "slightly below target" scored 0 invented (borderline).
  - The older blind-set sentences may share the X41 pattern (not checked).

## 6. Suites

Measured now by the lead at 9888c48, except the lines marked 88cdc8e (9888c48 changed only catalogue surfaces, wording and dist).
- Catalogue checks: all pass.
- Prompts: all strong.
- Edge cards: pass (29).
- synth-score tests: pass, 21 (88cdc8e).
- sandbox-kit tests: pass, 52.
- Eval B fit agreement: 45/60 = 75.0% (88cdc8e).
- match-frozen: PASS.
- Pagetest: 98 checks, 0 failed.
- prompt-coach untouched: pagetest 12/0, rewrite 29 pass 0 fail, customer_check PASS 229 runs (88cdc8e).
- Integrity: ok.

## 7. Not done, and why

- Engine rules: not changed. The engine and match fields are frozen for this run (match-frozen PASS).
- Rule C (tone-only edits): left as is, by Ian's word.
- Publishing: nothing was shared or published.
- The prompts-strong check does not run over the new blind set, by design: it lives apart from the catalogue.
- The three-card page (Task 3): skipped, see section 4.
- A fallback for the 22 of 31 with no card: talked 2026-10-20, parked (`docs/evidence/2026-10-20-fit-finder-no-card-probe.md`).

## 8. For Ian

- Merge: the lead's view is to merge per slip.json. Checks and both reviews pass, and no must-fix is open.
- Customers: the prompt cards are usable, with the sandbox caveats above. The card finder is not ready to recommend features to customers on its own: it shows no card for 22 of 31. Ian decides.
- Ian may overturn the proxy's skip of the three-card page.
