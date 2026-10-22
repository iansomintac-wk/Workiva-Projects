# Fit Finder, no card shown: probe (2026-10-20)

Talk: "NEW - Fit Finder no-card talk" (prompt `docs/FIT_FINDER_NO_CARD_TALK_PROMPT.txt`). Read-only; no engine, card or
page change. Script: `docs/evidence/2026-10-20-fit-finder-no-card-probe.js` (`node <script> fit-finder`).

## Sets used, and not used
- Used: the tune set (`data/synth/2026-10-18-tune.jsonl`, 50 rows) and half A of `data/tasks.jsonl` with
  `data/card-gold-a.jsonl` (29 rows). Both were tuned on, so they flatter the engine.
- Not opened or scored: `data/top3/` (the fresh blind set with the 22 misses), the 10-18 holdout, the 10-19 blind set,
  `data/real/`. The 22 misses themselves were not read; the causes below are from the stand-in sets only.
- The suite line reproduced first (tune): "first card right: 23 of 35 that fit; wrong card 4; no card where one fits 8".

## Why a fitting task with a matching feature got no card (25 rows: tune 8, half A 17)
A card is shown only when one of its keywords is in the task AND it shares a step (CHECK, DRAFT ...) with the task.

| cause | tune | half A | total |
|---|---|---|---|
| a card keyword hit, but no shared step | 4 | 9 | 13 |
| engine says not a fit | 4 | 2 | 6 |
| no card keyword at all | 0 | 6 | 6 |

Gold area of the first gold card: tune SUS 2, GRC 3, GEN 3; half A GEN 11, FR 5, GRC 1.
Wording pattern behind the biggest cause: the keyword names a card whose step list is narrower than the task's verb.
Examples: "proofread the 10-K" hits gen-rewrite (steps: REWRITE) while "proofread" reads as CHECK; "write a formula"
hits gen-formula (EXPLAIN, CHECK) while "write" reads as DRAFT; "risk assessment ... rate them" hits grc-risk-summary
(SUMMARIZE only).

## What-if fallbacks (fire only when no card is shown and the engine does not say not-a-fit)
| fallback | right card first | right card in 3 | lists with a wrong card | cards where gold says none |
|---|---|---|---|---|
| keyword only (drop the shared-step rule) | 7 of 25 | 8 | 7 | 5 (tune) |
| nearest cards in a guessed area (by shared steps) | 2 of 25 | 5 | 17 | 10 (tune) |

"Cards where gold says none" counts only the tune set: half A gold lists fitting tasks only.
These are tuned-set numbers. Earlier rule rounds that looked good on tuned sets moved the blind score by 0
(`docs/evidence/2026-10-19-share-ready.md`, read, not re-measured).

## The X41 pattern in older gold sets (gold labels counted; no engine run on the sealed sets)
Rows where the task fits but has no matching feature (scored "right" when no card is shown):
tune 6 (N27, N59, N65, N73, N80, N86), 10-18 holdout 10, 10-19 blind 12.
Measured on the tune set: all 6 show no card, so "23 of 35" is 17 of 29 right feature first plus 6 rightly none
(matches the 10-19 spec's "17 of 29"). The effect on the holdout and blind lines is not measured: it needs a
re-score, which is off limits; check that would settle it: a scorer that counts "rightly none" apart (queued below).

## Decision: parked (PM proxy as Ian, 2026-10-20T05:34Z, proxy decided; Ian may overturn)
Asked: try a fallback for tasks that get no card, or park it? Options put: 1 park (recommended), 2 keyword-only
"might fit", 3 nearest cards in the area, 4 fix the card step lists where keyword and steps disagree.
Proxy's words (verbatim): "1, PARK. Why: your recommendation; it is the most reversible; option 2 shows about as many
wrong cards as right on sets that flatter it; option 4 unfreezes card ops, which stays Ian's call."
Logged: studio-harness `.ledger/proxy/decisions.md`, line dated 2026-10-20T05:34Z (checked present).

- The page keeps its no-card answer ("Ask Workiva AI chat about your file"). No engine, card, page or test change; only the README gained a section.
- Option 3 is dropped (2 of 25 right first, a wrong card in 17 lists, 10 cards where none belongs).
- Revive condition: Ian says yes to option 4 (unfreezing card ops), and a fresh ~40-sentence blind set, written by a
  helper that never sees the engine or the match patterns, is scored before and after.

## For Ian (queued, not decided)
1. Option 4: fix card step lists where the keyword and the steps disagree (13 of 25 misses on tuned sets). Needs
   card ops unfrozen and one run with a new blind set.
2. Locked-file test fixes (from `docs/evidence/2026-10-19-top3-sandbox.md` section 5): the scorer counts "rightly
   none" apart, with an empty-gold test; a rank 3 / rank 4 boundary case in synth-score.test; sandbox-kit.test checks
   the first card, not `.some` (all 8 kit cards rank first today, so no live bug); the MADE-UP tag on the prior-year
   section of `fr-yoy-narrative.txt`.
3. X41 finding: the older gold sets hold the same pattern (tune 6, holdout 10, older blind 12). On the tune set all 6
   show no card and count as "right". Fix 2's scorer change would show the split on the sealed sets.
