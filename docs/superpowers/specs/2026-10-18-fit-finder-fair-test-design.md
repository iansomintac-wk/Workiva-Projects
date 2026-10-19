# Fit Finder fair test: design

Written 2026-10-18 20:05Z by the talk session "NEW - Fit Finder fair test talk" on branch
`fit-finder-fair-test` (from `worktree-fit-finder-v4` 486cc1c). Path: architectural (new data set,
new scoring script, a tuning loop, a hold-out protocol).

## Ian's rulings (verbatim)

- About 19:24Z 2026-10-18: "Priority for me is 1) Fit Finder and Prompt Coach ..." (he presents on
  Monday 2026-10-19).
- About 19:58Z: "For the fit finder, Can't you optimize the engine behind it to replicate what an AI
  model would be able to do at a very small scale since it is very specific?"
- About 20:00Z, his pick (AskUserQuestion): "Bigger set, fair test (Rec.)". The option he picked:
  "The model writes and labels about 100 new realistic prompts. Tune on half, judge only on the
  untouched half. Check: wrong card at most 3 per 23 on the untouched half. Probably a few hours
  tonight, usage only. It is model-written, not real customer prompts; the real-set check stays for
  later."
- That pick lifts `docs/FIT_FINDER_RESUME_PROMPT.txt:68` ("do not start new tuning") for this round
  only. New prompts are labelled by the model; no label Ian made changes; Ian is not asked to label.
- Overnight slip (19:23Z, `.ledger/2026-10-18-fit-finder-fair-test/slip.json`): push its own branch
  yes; merge not named (no); spend none; new sessions yes.

The rulings above were relayed in the talk prompt by the PM proxy session; this session did not see
Ian's words directly.

## What exists (measured 2026-10-18 20:02Z unless marked read)

`cd fit-finder && node tests/catalogue.test.js` exits 0 and prints (measured):

| Set | Line |
|---|---|
| held-out B (`card-gold.jsonl`) | first card right 13 of 30; wrong card 3 (67,74,91); no card 14 |
| half A (`card-gold-a.jsonl`) | first card right 12 of 29; wrong card 0; no card 17 |
| real 19 (`card-gold-real.jsonl`) | first card right 15 of 19; wrong card 2 (W1,S1); no card 2 |
| fresh 29 (`card-gold-fresh.jsonl`) | first card right 15 of 23 that fit; wrong 5 (G2,G14,G15,G22,X1); no card 3; card on a not-a-fit prompt 1 (G5); fit agreement 12 of 29 |

`node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A|B` (measured): fit agreement A 52/60,
B 45/60.

Other measured facts:
- `data/real/` is excluded from git by `.git/info/exclude`; it was copied into this worktree from
  `fit-finder-v4` (19 + 29 rows) so the suite runs. It stays out of git.
- Catalogue: 26 cards (`data/catalogue.json` `useCases`), each with `task` text and a `match` regex.
- Mix of the 48 real gold rows by first card: general 16, financial reporting 7, sustainability 3,
  GRC 0, no card 22 (fresh: 6 not-a-fit, 13 good, 10 partial). Real prompt length: median about
  30 words (19-set median 29, range 11-54; fresh median 32, range 4-400).
- `tasks.jsonl` (120 tasks) is AI-written; fit good 27, partial 32, not 61. 86 rows in
  `tests/rewrite-pool.jsonl`.
- `LABELING.md` defines fit, repeats, ops, blockers; it has no card rule. The card rule used for the
  fresh set (README:179-181, read): a top-model labeler, blind to the engine, sees the labelling
  guide, the card descriptions and the prompt text (no match words) and gives a fit and every card
  right to show; a not-a-fit row has no cards.
- Near-copy check: `nearcopy.cjs` (5-word runs) is in
  `studio-harness/.claude/worktrees/bedtime-slip/.ledger/2026-10-16-24h-program/fit-finder-v422/`.
- Done-when (README:218, read): first card right at least 12 of 23 and wrong at most 3, then the same
  bar once on a second untouched real set. This round does not replace that; it is model-written.

## Design

### 1. The new set (about 100 prompts)

- Written by a frontier-model helper (Opus) that sees: who the customer is (LABELING.md's first
  paragraph), the measured mix above as a target, and style notes on length and form. It does not see
  real prompt text, the card match words or the engine. Reason: the rules were tuned on the real and
  `tasks.jsonl` prompts; a set written from them would score the engine on its own training data.
- Target mix, by the kind of ask (from the 48 real rows, rounded): about a third general writing help
  (reword, email, memo, summarise a file, a formula); about a fifth financial reporting; about a tenth
  sustainability; about a tenth GRC or audit; the rest no card or not a fit (system actions,
  approvals, exact calculation, personal or product questions). Lengths spread from a few words to
  a long paragraph, median near 30.
- Rows: `{"id":"N1".."N104","task":"..."}`. The helper writes 104 so that up to 4 can be dropped by
  the dedupe check and the set stays at least 100.
- Dedupe: no row shares a 5-word run with `data/real/`, `data/tasks.jsonl` or
  `tests/rewrite-pool.jsonl` (nearcopy, N=5), and no two new rows share one. A hit is dropped, not
  rewritten. The count dropped is recorded.

### 2. Blind labels

- A second frontier-model helper (Opus, fresh context, not the writer) labels every row as the fresh
  set was labelled: LABELING.md, the 26 cards' `id` and `task` text, the prompt text. It never sees
  the engine, its output, the match words or the writer's notes.
- Row: `{"id","fit":"good|partial|not","cards":[...],"by":"model","conf":"high|low"}`. A not-a-fit
  row has `cards: []`. Every card right to show, in no order.

### 3. Split before any tuning

- After labelling and before the engine runs on any new row, split with the `eval.js` LCG shuffle,
  seed 20261018, first floor(n/2) to the tuning half, the rest untouched.
- Tuning half: `fit-finder/data/synth/2026-10-18-tune.jsonl` and
  `fit-finder/data/card-gold-synth-tune.jsonl`, committed.
- Untouched half: moved outside the worktree to
  `C:/Users/teasp/Documents/workiva-sealed/2026-10-18-fit-finder-fair-test/` (prompts and gold),
  together with the unsplit batch and full label files, so nothing with untouched rows stays in the
  worktree or `.ledger/`. Its sha256 is written to the ledger at the split. The tuning helper's
  dispatch never names that folder; after tuning, the lead scans the helper's tool calls (not its
  dispatch text) for the folder name and records the count (expected 0).

### 4. Scoring script and guard (written before tuning, then locked)

- `fit-finder/tests/synth-score.js <prompts> <gold>` prints one line in the fresh line's format:
  first card right R of F that fit; wrong card W (ids); no card M (ids); card on a not-a-fit prompt
  K (ids); fit agreement A of n; plus a `score S` field where S = 2W + M + 2K (lower is better;
  a wrong card costs more than no card, as rule C chose). Proof it scores like the suite: run on the
  fresh files it prints the suite's fresh figures exactly (15 of 23, wrong 5, no card 3, card on
  not-a-fit 1, fit agreement 12 of 29). It fails closed (exit 2, no line) on duplicate ids, prompt
  and gold id sets that differ, malformed rows, unknown card ids, or cards on a not-a-fit row.
- `fit-finder/tests/fair-guard.js` exits 0 only when: the suite exits 0; every existing set's line is
  no worse than the pins (B right >= 13 and wrong <= 3; A right >= 12 and wrong <= 0; real right
  >= 15 and wrong <= 2; fresh right >= 15, wrong <= 5, card on not-a-fit <= 1, fit agreement
  >= 12 of 29); both eval runs exit 0 with denominator 60 and A >= 52, B >= 45; the locked files
  are unchanged from the pre-tune commit; and `catalogue.json` differs from it only in `match`
  fields (no new card, no change to any card text, source or availability).

### 5. Tuning (tune-loop)

- One helper (Sonnet) under the `tune-loop` skill. Number: `score` on the tuning half (lower is
  better). Guard: `fair-guard.js`. Editable: `fit-finder/engine/fit.js` and the `match` fields of
  `fit-finder/data/catalogue.json`. Locked: both tests scripts above, `catalogue.test.js`,
  `eval.js`, every `data/*.jsonl` and `data/real/`, `LABELING.md`, the holdout folder.
- Keep rule per attempt: score strictly lower than the best kept, and first card right on the tuning
  half not below its pre-tune value (so dropping right cards cannot buy a lower score).
- The loop runs on branch `fit-finder-fair-test-tune`; the kept diff comes back to
  `fit-finder-fair-test` as one commit with the rebuilt page and README (step 7).
- A kept rule is a general word or phrase, not text lifted from a tuning prompt: with regex syntax
  turned into spaces, the added lines share no 4-word run with a tuning prompt (0 hits, no waiver),
  and no added alternative is longer than 3 words.
- The engine stays pure: the added lines contain no require, process, argv, fs, readFile, import,
  fetch, storage or new-prompt id.
- Caps: 12 attempts, 10 minutes each, 3 hours total, 90 tool uses. Target: tuning-half wrong at most
  floor(3F/23) with right not below its pre-tune value.

### 6. Score the untouched half once

- Check the sha256 against the one recorded at the split; a mismatch stops the run.
- Run `synth-score.js` on it once, record the line verbatim, then commit the half into
  `fit-finder/data/synth/` and `data/card-gold-synth-holdout.jsonl`. No rule change after this.

### 7. Rebuild and document

- If any engine change was kept: `node tests/build.js`, `node tests/pagetest.js` (pass), README
  numbers and dist byte count (LF size as committed) in the same commit. The live page is not
  republished; that is Ian's.
- Evidence doc `docs/evidence/2026-10-19-fit-finder-fair-test.md`, due by 2026-10-19 14:00Z.

## Success criteria

- Pass (Ian's bar): on the untouched half, wrong card at most floor(3F/23), where F is the count of
  its fitting rows (F = 37 gives at most 4).
- And no regression on fresh 29, real 19, A, B and eval A/B (the pins above), each reported.
- Reported, not a pass condition: first card right on the untouched half against the 12-of-23 rate,
  fit agreement on both halves, the pre-tune tuning-half line, and the number of low-confidence
  labels.

## Prediction (written before any new prompt exists)

- Pre-tune, the tuning half: first card right 40-65% of fits, wrong card 10-25% of fits (the fresh set
  scored 35% right and 26% wrong untuned; model-written prompts are likely cleaner, so a little better).
- After tuning, the untouched half: wrong card 3 to 5 per 23 fits, so about an even chance of passing;
  right 50-70%. The untouched half improves less than the tuning half. The untouched half is never
  scored before tuning, so its "before" is the tuning half's pre-tune rate (same random split, same
  mix).
- Disproved if the untouched half's wrong rate is above 6 per 23 (no better than the untuned fresh set),
  or if it improves as much as or more than the tuning half (then the halves are not independent or
  the set is too easy to tell anything).

## Out of scope

Republishing the live page; any label Ian made; widening rule C's "revise" or tone words (withdrawn,
README:208-211) unless the guard passes on the 42-sentence pool, which the suite checks; Prompt Coach;
the second real set.

## Limits, said plainly

- The set is model-written and model-labelled; the writer and labeler are the same model family as
  the one that wrote `tasks.jsonl`. A pass says the rules generalise to new model-written asks, not to
  customers. The real-set check stays Ian's, later.
- About 50 rows per half and about 37 fits: one wrong card moves the rate by about 3 points.
- One writer, one labeler, one run.
