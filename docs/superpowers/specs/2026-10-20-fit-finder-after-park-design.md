# Fit Finder after the no-card park: honest score line, re-score, card step fixes (design)

Date 2026-10-20. Talk held in session 5aab3165 ("NEW - Fit Finder after-park talk"), prompt
`docs/FIT_FINDER_NO_CARD_NEXT_TALK_PROMPT.txt`, after the no-card probe (`docs/evidence/2026-10-20-fit-finder-no-card-probe.md`).
Classified architectural: B and C are small, but A changes what the engine shows and needs a fresh blind check.

## Ian's words (verbatim, 2026-10-20, AskUserQuestion)
- B, locked-file test fixes: "Yes, all four (Recommended)".
- C, re-score the 10-18 holdout and the 10-19 blind set with the split line: "Yes, re-score both (Recommended)".
- A, fix card step lists where a keyword hits but the steps disagree: "Yes, with blind set (Recommended)". The option
  as put to him: "Card step lists unfrozen for one run. Fresh ~40-task blind set scored before and after; undone if it
  moves nothing. Usage only, no money." The question said it unfreezes card steps, "not ids, areas or keywords".

## Evidence
Measured in this talk (2026-10-20, lead):
- Tune set, `node tests/synth-score.js data/synth/2026-10-18-tune.jsonl data/card-gold-synth-tune.jsonl`: "first card
  right: 23 of 35 that fit; wrong card 4 (N14,N15,N60,N69); no card where one fits 8 (...); ... score 16".
- Tune gold: 6 rows fit with no gold card (N27, N59, N65, N73, N80, N86). None is in the wrong-card list, so all 6 show
  no card and count as right: 23 of 35 = 17 of 29 right feature first + 6 rightly none.
- The probe script re-run (`node docs/evidence/2026-10-20-fit-finder-no-card-probe.js fit-finder`): keyword hit but no
  shared step 4 (tune) + 9 (half A) = 13 of 25 no-card misses; keyword-only what-if: right first 1 + 6 = 7, a wrong card
  shown 3 + 4 = 7. Both sets were tuned on, so these flatter the engine.
- `match()` returns at most 3 cards (`engine/fit.js` `hits.slice(0, max || 3)`); a test task with 4 raw hits exists
  (with `max` 10 one long task gave gen-formula, fr-narrative-tables, gen-rewrite, gen-summarize-file). No card's own
  sample task gets 4 or more hits (0 of 26).
- `tests/synth-score.test.js` asserts "without the flag the output is still one line"; `tests/fair-guard.js` reads
  `first card right: (\d+) of` from the catalogue suite lines (not from synth-score).
- In this worktree `tests/catalogue.test.js` fails with ENOENT on `data/real/2026-10-15-community.jsonl`: the folder is
  git-excluded and absent here. It exists in `../fit-finder-fair-test/` and `../fit-finder-v4/` (names checked, not opened).
Read, not re-measured: the 10-18 holdout holds 10 and the 10-19 blind set 12 fit-but-no-gold-card rows (probe doc);
earlier tuned-set rule rounds moved the blind score by 0 (`docs/evidence/2026-10-19-share-ready.md`).

## Design (order B, C, A)
B. Locked-file test fixes (tests and one sample file; engine and cards unchanged).
  1. `tests/synth-score.js`: the first line stays byte-identical up to and including "score N" (so earlier evidence
     still compares), and gains "; split: right feature first R of F, rightly none K (ids)", where F counts fitting rows
     with a gold card, R those whose first card is in the gold, K fitting rows with no gold card and no card shown.
     Still one line without `--top3`. Test: an empty-gold fitting row with no card shown is counted in K, not in R, and
     an empty-gold row with a card shown is still a wrong card.
  2. `tests/synth-score.test.js`: a rank 3 / rank 4 boundary under `--top3`. The test builds its own task with at
     least 4 raw hits (`match(t, cat, 10)`), uses the 3rd card as gold (counts as right in the 3) and the 4th (does
     not), so it does not depend on today's card order.
  3. `tests/sandbox-kit.test.js` line 20: the card's sample must list that card first (`match(...)[0].id === c.id`),
     not merely `.some`. Measured on 2026-10-19: all 8 kit cards rank first, so it should pass as it is.
  4. `sandbox/fr-yoy-narrative.txt`: a MADE-UP tag on the PRIOR YEAR section heading. The copy already uploaded to
     the Workiva AI sandbox is not changed; the evidence doc says so.
C. Re-score the sealed sets, once each, after B lands: `data/synth/2026-10-18-holdout.jsonl` with
   `data/card-gold-synth-holdout.jsonl`, and `data/synth/2026-10-19-blind.jsonl` with `data/card-gold-synth-blind.jsonl`,
   on the B commit. Hash check first where a `.sha256` file exists; a mismatch is a stop. The lead runs them and copies
   the printed lines verbatim to the evidence doc. No tuning, no reading of the sentences, no further scoring of these
   two sets in this run.
A. Card step lists (card `ops` only).
  1. Fresh blind set first: about 40 task sentences across FR, GRC, SUS and GEN, roughly a quarter not a fit, written
     and labelled by one helper on the top model that never sees `fit-finder/engine/`, the catalogue's `match` or
     `ops` fields, or any earlier set; labels follow `data/LABELING.md` and are by the model (`"by":"model"`), never
     asked of Ian. Committed with a `.sha256` before any card change, then the 5-word near-copy check against the
     real prompts (path given by the lead, never printed).
  2. Score it on that commit (before). The line, split part included, goes to the ledger verbatim.
  3. A helper changes `ops` of cards where a keyword hits but the task's step is missing from the card, using only
     the tune set and half A (the 13 rows). Each added step must be one the card's feature really does (card text and
     `data/capabilities-confirmed.md`); no id, area, match, engine or page change.
     `tests/match-frozen.js` gains `--allow ops`, which still fails on any id, area, match or engine change (a test
     shows it does), and the plan's guard runs it with that flag.
  4. Score the blind set once more (after). Keep the change only if right feature first rises by at least 1 and the
     score S does not rise; otherwise revert the ops commit and record it.
  5. The catalogue suite and `tests/fair-guard.js` pins hold (B 13/3, A 12/0, real 15/2, fresh 15/5/1/12, eval pins),
     or a pin change is shown to Ian with its reason.

## Success criteria and predictions
- B: the tune line prints "split: right feature first 17 of 29, rightly none 6 (N27,N59,N65,N73,N80,N86)".
  Disproved by any other split on the tune set. Each new test fails on the parent commit and passes after (red before
  green), except sandbox-kit's first-card check, which is expected to pass on both (a control: point it at a card
  whose sample ranks second and see it fail).
- C: prediction, assumed and untested: the holdout's and the older blind set's "first card right" each drop by about
  their rightly-none count once split out (10 and 12). Disproved by: K well below those counts (the engine shows a
  wrong card on many of them).
- A: prediction: on the fresh blind set, right feature first rises by 2 or more and wrong card rises by at most 1.
  Disproved by: a gain under 2. Keep or revert per A4. Known risk: tuned-set rounds have moved blind scores by 0
  before; this run treats that as the likely outcome, not a failure of the run.
- All suites pass in a worktree that has `data/real/` copied in (git-excluded, never committed); README and "How it
  rates" carry the split numbers and the A result; README dist byte counts are LF as committed.

## Scope
In: the four B items, the C re-score, the A blind set, ops changes, `match-frozen --allow ops`, README and
"How it rates" numbers, evidence doc.
Out: engine rules, card ids, areas, match patterns and card text beyond what an ops change requires to stay true,
the no-card fallback (still parked), the top3 set `data/top3/` (not opened, not scored), the Prompt Coach, publishing or
sharing anything, changing any label Ian made.

## Data care
Never open, print or quote `fit-finder/data/real/`, `fit-finder/data/top3/` or
`C:/Users/teasp/Documents/workiva-sealed/`. The sealed holdout and older blind set are scored once each (C) and never
read. Sandbox files are made up. Outside reviewers are told not to open `fit-finder/data/real/`, and their log is
checked. Work repo: nothing goes to the brain or studio-harness.
