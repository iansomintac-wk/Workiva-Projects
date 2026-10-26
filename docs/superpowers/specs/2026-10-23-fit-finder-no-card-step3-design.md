# Fit Finder no-card step 3: card keywords and verb reading, one tune (design)

Date: 2026-10-23. Talk session ff5e5d85. Branch `fit-finder-no-card-step3` from `origin/prompt-coach` fb26061
(fit-finder/ identical to 5a4f393, where step 2 merged). Ledger: `.ledger/2026-10-23-fit-finder-no-card-step3/`.

## Rulings

- PM (proxy decided, 2026-10-23 ~04:04Z): go ahead with step 3, both levers, not park. Ian keeps the fresh gate labels,
  push/merge and the label Fit Finder ships. If the keep rule fails: revert, park Fit Finder with a ledger line, no reshape
  and retry.
- Ian, 2026-10-23 04:05Z, answering the step 3 card (hook row `left: ian-kind`, so his own answer): "A: tune both
  (Recommended)", i.e. tune card keywords, card verb lists and the engine's verb reading on the practice sets; fresh gate
  set scored once; keep rule as below; park if it fails.

## Why (evidence)

Measured 2026-10-23 at fb26061 (scripts in the ledger folder; no sealed file opened). What blocks each "no card where one
fits" row, for the first labelled card:

| Set | Misses | Keyword only | Verb only (keyword already hits) | Both |
|---|---|---|---|---|
| tune (synth 10-18) | 8 | 2 | 4 | 2 |
| half A | 17 | 5 | 3 | 9 |
| 10-22 gate (spent) | 15 | 3 | 8 | 4 |

The tune + half A totals equal `tools/diag-nocard.js` ("diag no-card 25 (tune 8, halfA 17); tune wrong 4; tune not-a-fit 0").
Keywords alone reach at most 7 of 25 practice misses and 3 of 15 old gate misses, so step 3 opens both levers.

Measured and dropped: a keyword-only fallback (offer a card whenever its keywords hit) took no-card 25 to 9 but wrong card
4 to 11 and card on not-a-fit 0 to 11 on tune + half A.

Read, not re-measured: step 2's tune (`docs/evidence/2026-10-22-fit-finder-gate.md`) stopped at 3 of 12 attempts (N 25 to
23) citing "remaining misses need card keywords"; the table above shows that was true for few of them.

## Scope

In: one run, following the step 2 plan's shape (`docs/superpowers/plans/2026-10-22-fit-finder-gate.md`):
1. Baseline at the branch base.
2. Guards: one new allowance (`--allow tune3` or equivalent) in `tests/match-frozen.js` and `tests/fair-guard.js` under
   which these may change together: each card's `match` and `ops` in `data/catalogue.json`, and the `OPS` block of
   `engine/fit.js` (values only; keys fixed, as `tools/engine-scope.js` already enforces). Card `id`, `area`, order, count,
   prompts and every other field stay frozen; a check fails on any other change. Tests for the new allowance fail before
   and pass after.
3. A brand-new blind gate set of 40 sentences, the 10-22 set's mix (measured: FR 8 fit + 3 not, GEN 8 + 1, GRC 10 + 2,
   SUS 6 + 2; 32 fit, 8 not-a-fit), new file names
   dated 2026-10-23, written by a helper that sees no engine, catalogue match field or practice sentence; sealed by sha256.
4. Labels: the PM takes a first pass; Ian confirms all of them in one batch (label sheet, as on 10-22). Committed before any
   engine or catalogue edit.
5. Score the new gate set BEFORE, once.
6. Tune: a capped keep-or-undo loop (`tune-loop`) on one number, `diag-nocard` N (tune + half A only), with the guards
   `diag-nocard` already judges (tune wrong <= 4, tune not-a-fit <= 0, half A wrong 0) plus `fair-guard` pins. Up to 12
   attempts. The loop stops only at the tune-loop skill's own stops (target N <= 15, the 12-attempt cap, wall time,
   tool-use cap, 3 crashes in a row); any other stop reason, such as step 2's "needs a frozen lever", is a defect the lead
   records and the checker fails.
7. Score the new gate set AFTER, once; keep or revert by script (`tools/gate-check.js`).
8. If kept: update README counts and dist in the same commit as the change; evidence doc
   `docs/evidence/2026-10-23-fit-finder-no-card-step3.md`.

Out: new cards; card prompt text; the page's look; data/real labels; the keyword fallback; reopening or rescoring the
10-22 gate set; any spend.

## Success criteria and prediction

- Keep rule (scored once on the new gate set, the step 2 rule): no-card misses fall by 2 or more, and neither wrong card nor
  card on a not-a-fit prompt rises. Otherwise revert and park Fit Finder.
- Prediction (assumed): on tune + half A, N falls from 25 to 15 or fewer; on the new gate set, no-card misses fall by 4 or
  more with wrong card unchanged. Disproved by: N above 15 after the tune, or a gate fall below 4, or any rise in wrong card
  or card on not-a-fit.

## Safety

- Never open `fit-finder/data/real/`, `fit-finder/data/top3/`, `C:/Users/teasp/Documents/workiva-sealed/` or any
  `nocard-step1-*` file; every helper and Codex prompt says so, and Codex logs are checked for reads of that folder.
- Changed text files share no 5-word run with `fit-finder/data/real/` except stock phrases (nearcopy check, run by the
  existing tool, not by opening the folder).
- $0; Workiva data stays in the workiva repo; nothing to the brain; logs to files.

## Known harness seams (for the plan writer)

- A Check that diffs `<task commit>..HEAD` must exclude `runs/<run>/` (the driver commits there).
- Pass the driver `--base prompt-coach` (there is no main branch; the default made the driver's Codex review see nothing).
- Paths under `tools/` in git commands need `:(top)`.
- The guard allowances today are either-or (`--allow ops` or `--allow engine`); step 3 needs the combined one in item 2.
