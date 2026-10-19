# Fit Finder: three closest cards + Workiva AI sandbox check (design)

Date 2026-10-19. Talk held in session 52d5b479 ("NEW - Fit Finder share-ready resume"), after the share-ready run
merged (origin/prompt-coach 5a1e05c). Classified architectural (changes how the page presents its answer, adds a
measured check against the real product).

## Ian's words (verbatim, 2026-10-19)
- Rule C, tone-only edits: "Leave as is (Recommended)". Rule C stays; the page keeps "couldn't tell".
- Asked "teammates first or customers now?": "What can you do to make it ready for both? You have access to
  Workiva AI from the browser extension."
- On the spread (top 3 cards + sandbox test, teammates now, customers after a fresh blind check):
  "Yes, 2 + 3 (Recommended)".
- On this design: "Yes, write it up (Recommended)".

## Why (evidence)
Measured 2026-10-19 by the lead (tune set `fit-finder/data/synth/2026-10-18-tune.jsonl`, which earlier rounds
tuned on, so the numbers flatter the engine; the blind and holdout sets were not re-scored). Suite line reproduced
first: "first card right 23 of 35 ... wrong card 4 ... no card where one fits 8".
- Of 29 tasks with a gold card: first card right 17; right card anywhere in the engine's top 3: 20.
- If the person named the area (FR / GRC / SUS / GEN): 19; area + top 3: 20. Rejected: one extra question is
  not worth +2.
- The match score does not separate right from wrong first cards (right 1.5-4, wrong 1.5-5). Rejected: a
  "show a card only when sure" cut-off.
Read, not re-measured: blind set after the share-ready fixes, 11 of 29 right, 9 wrong, 9 no card, 4 cards on
not-a-fit tasks (`docs/evidence/2026-10-19-share-ready.md`); the last rule round moved it by 0.

## Design
A. Three closest cards (page). `FitEngine.match` already returns up to 3. The "where" panel
   (`fit-finder/web/template.html`, `where()`) shows them under "closest sourced use cases: pick the one that
   matches your work": the first expanded as today, the other two one line each. Choosing another card makes it
   the chosen card: the fuller prompt (`patternPrompt`) and the "first try" steps follow it. The no-card fallback
   ("Ask Workiva AI chat about your file") is unchanged. The "How it rates" note gets the new numbers, including
   how often a wrong card appears in the list.
B. Workiva AI sandbox check. About 8 cards across FR, GRC, SUS and GEN. For each: a made-up test file (no real
   or customer data) with planted items so the result is a count (for example 5 planted changes between two
   versions, 4 planted errors), and the prompt the page would show for a sample task on that card. Ian pastes each
   into Workiva AI through the Claude browser extension and returns the reply as text. Score per card: planted
   items found of N, facts invented (count), whether the feature is where the card says. A card that fails gets
   its wording or badge fixed in the same run; a card whose feature is missing in the sandbox is reported to Ian,
   not removed. The sandbox may have previews or entitlements a customer lacks: it shows what Workiva AI can do,
   not what every customer has.
C. Fair check. A fresh blind set of about 40 sentences and its gold labels, written by a helper on the top model
   that never sees `fit-finder/engine/` or the catalogue's `match` patterns, committed with a sha256 file before
   any engine or page change. Scored once on the parent commit and once at the end, never in between.

## Success criteria and prediction
- Prediction: on the fresh blind set, "right card anywhere in the 3 shown" is at least 3 more than "first card
  right" on the same set. Disproved by: a gain under 3, or the count of tasks with any wrong card shown rising
  by more than the gain. Known risk: the tune set showed exactly +3 (17 to 20), so the threshold is borderline and
  the fresh blind set is the real test.
- Sandbox: every tested card finds at least 4 of 5 planted items with 0 invented facts, or its text is fixed and
  re-run once; results table in the evidence doc.
- Customers: Ian decides after the evidence doc; this run does not share anything.
- All existing suites pass (the share-ready list in `docs/evidence/2026-10-19-share-ready.md`), the pagetest
  gains checks for the three-card list and the card switch, and dist byte counts in the README are LF as
  committed.

## Scope
In: page three-card list and card switch, README and "How it rates" numbers, sandbox kit (made-up files, prompts,
scoring sheet), fixes to failing cards' text, fresh blind set, evidence doc.
Out: engine keyword rules (no rule round), rule C, the Prompt Coach, publishing or sharing anything, pushing or
merging without Ian's yes.

## Data care
Never open, print or quote `fit-finder/data/real/` or `C:/Users/teasp/Documents/workiva-sealed/`. Do not re-score
`2026-10-19-blind.jsonl` or `2026-10-18-holdout.jsonl`. Sandbox files are made up; nothing customer-specific goes
anywhere. Outside reviewers are told not to open `fit-finder/data/real/`.
