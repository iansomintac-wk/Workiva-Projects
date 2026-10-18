# Live test results, 2026-10-18

Run: 12 planted-answer cases plus the FR-2 pilot. Three prompts: P1 = original, P2 = Strong at 73be350, P3 = Strong now. 2 runs each, fresh chats, Ian's own Workiva sandbox, made-up files (no customer data), 2026-10-18.

## Summary tables (verbatim from the lead's summary log, live_plants_summary.md)

Built by summary_build.cjs from logs/live_<CASE>_scores.md (Opus-final rows; Codex second scorer, per-row "vs Codex" in each file) and answer_key.json. P1 = original prompt, P2 = Strong at 73be350, P3 = Strong now; 2 runs each, fresh chat, Ian's own Workiva sandbox, 2026-10-18.
invented: 1 = no fact absent from the file (higher is better). false: mean count per answer (lower is better).

| Case | Prompt | keyed-found share (mean/items) | hard plant found | false (mean) | valid extras (mean) | invented (mean, 1=none) | clarify count | gate |
|---|---|---|---|---|---|---|---|---|
| FR-4 | P1 | 1.00 (3.0/3) | 2/2 | 0.5 | 2.0 | 0.5 | 0 | PASS |
| FR-4 | P2 | 1.00 (3.0/3) | 2/2 | 0.5 | 3.0 | 1.0 | 0 |  |
| FR-4 | P3 | 1.00 (3.0/3) | 2/2 | 1.0 | 4.0 | 1.0 | 0 |  |
| FR-1 | P1 | 1.00 (4.0/4) | 2/2 | 1.5 | 4.0 | 1.0 | 0 | PASS |
| FR-1 | P2 | 1.00 (4.0/4) | 2/2 | 1.0 | 8.0 | 1.0 | 0 |  |
| FR-1 | P3 | 1.00 (4.0/4) | 2/2 | 1.5 | 10.0 | 1.0 | 0 |  |
| FR-3 | P1 | 1.00 (5.0/5) | 2/2 | 0.0 | 0.0 | 1.0 | 0 | too easy (Ian: record, move on) |
| FR-3 | P2 | 1.00 (5.0/5) | 2/2 | 0.0 | 0.0 | 1.0 | 0 |  |
| FR-3 | P3 | 1.00 (5.0/5) | 2/2 | 0.0 | 0.0 | 1.0 | 0 |  |
| GRC-1 | P1 | 0.83 (2.5/3) | 1/2 | 0.0 | 2.5 | 1.0 | 0 | PASS |
| GRC-1 | P2 | 0.50 (1.5/3) | 1/2 | 1.5 | 3.5 | 1.0 | 0 |  |
| GRC-1 | P3 | 0.33 (1.0/3) | 2/2 | 0.0 | 5.5 | 1.0 | 0 |  |
| GRC-3 | P1 | 1.00 (2.0/2) | 2/2 | 1.5 | 2.0 | 1.0 | 0 | PASS |
| GRC-3 | P2 | 0.50 (1.0/2) | 2/2 | 0.0 | 0.0 | 1.0 | 0 |  |
| GRC-3 | P3 | 1.00 (2.0/2) | 2/2 | 0.0 | 0.0 | 1.0 | 0 |  |
| GRC-2 | P1 | 1.00 (3.0/3) | 2/2 | 0.0 | 7.0 | 1.0 | 0 | too easy (Ian: record, move on) |
| GRC-2 | P2 | 1.00 (3.0/3) | 2/2 | 0.0 | 5.0 | 1.0 | 0 |  |
| GRC-2 | P3 | 1.00 (3.0/3) | 2/2 | 0.0 | 5.0 | 1.0 | 0 |  |
| GRC-4 | P1 | 0.83 (5.0/6) | 2/2 | 0.5 | 0.0 | 0.5 | 0 | PASS |
| GRC-4 | P2 | 0.92 (5.5/6) | 2/2 | 2.0 | 3.0 | 0.5 | 0 |  |
| GRC-4 | P3 | 0.92 (5.5/6) | 2/2 | 1.5 | 3.0 | 0.5 | 0 |  |
| SUS-1 | P1 | 1.00 (5.0/5) | 2/2 | 0.0 | 4.0 | 1.0 | 0 | too easy (Ian: record; same for later) |
| SUS-1 | P2 | 1.00 (5.0/5) | 2/2 | 0.0 | 7.0 | 1.0 | 0 |  |
| SUS-1 | P3 | 1.00 (5.0/5) | 2/2 | 0.0 | 5.5 | 1.0 | 0 |  |
| SUS-2 | P1 | 1.00 (2.0/2) | 2/2 | 0.0 | 4.0 | 1.0 | 0 | PASS |
| SUS-2 | P2 | 1.00 (2.0/2) | 2/2 | 0.0 | 4.5 | 1.0 | 0 |  |
| SUS-2 | P3 | 1.00 (2.0/2) | 2/2 | 1.5 | 3.5 | 1.0 | 0 |  |
| SUS-3 | P1 | 1.00 (4.0/4) | 2/2 | 0.0 | 0.0 | 1.0 | 0 | PASS |
| SUS-3 | P2 | 0.88 (3.5/4) | 2/2 | 0.0 | 2.5 | 1.0 | 0 |  |
| SUS-3 | P3 | 0.88 (3.5/4) | 2/2 | 0.0 | 2.5 | 1.0 | 0 |  |
| SUS-4 | P1 | 0.75 (3.0/4) | 2/2 | 0.5 | 11.0 | 1.0 | 0 | PASS |
| SUS-4 | P2 | 0.75 (3.0/4) | 0/2 | 1.0 | 3.0 | 1.0 | 0 |  |
| SUS-4 | P3 | 0.75 (3.0/4) | 0/2 | 1.5 | 4.5 | 1.0 | 0 |  |
| SUS-5 | P1 | 1.00 (3.0/3) | 2/2 | 0.0 | 4.0 | 1.0 | 0 | too easy (Ian: record; same for later) |
| SUS-5 | P2 | 1.00 (3.0/3) | 2/2 | 0.0 | 7.5 | 1.0 | 0 |  |
| SUS-5 | P3 | 1.00 (3.0/3) | 2/2 | 0.0 | 7.0 | 1.0 | 0 |  |

## FR-2 pilot (scored before the planted-key method; 1 run per prompt plus repeats, see logs/live_FR-2_scores.md)

| Prompt | found (0-3) | false | table | invented | clarify | right source | one job | usable format | invented (run) | run total |
| P1 original | 3 (SR, DR, AR) | 0 | 1 | 1 | N | 1 | 1 | 1 | 1 | 4/4 |
| P2 Strong@73be350 | 3 (SR, DR, AR) | 0 | 1 | 1 | N | 1 | 1 | 1 | 1 | 4/4 |
| P3 Strong now | 3 (SR, DR, AR) | 0 | 1 | **0** | N | 1 | 1 | 1 | **0** | 3/4 |

## Per case: 0/1 scores and clarify count

Computed from the "| P" rows of each case's scores file. Each cell shows run 1 + run 2 (1 = yes). invented: 1 = no fact absent from the file. clarify = number of runs (of 2) where the answer asked a clarifying question.

| Case | Prompt | source | job | format | invented | clarify |
|---|---|---|---|---|---|---|
| FR-1 | P1 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| FR-1 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| FR-1 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| FR-3 | P1 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| FR-3 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| FR-3 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| FR-4 | P1 | 1+1 | 1+1 | 1+1 | 0+1 | 0 |
| FR-4 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| FR-4 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| GRC-1 | P1 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| GRC-1 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| GRC-1 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| GRC-2 | P1 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| GRC-2 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| GRC-2 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| GRC-3 | P1 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| GRC-3 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| GRC-3 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| GRC-4 | P1 | 1+1 | 1+1 | 1+1 | 1+0 | 0 |
| GRC-4 | P2 | 1+1 | 1+1 | 1+1 | 0+1 | 0 |
| GRC-4 | P3 | 1+1 | 1+1 | 1+1 | 1+0 | 0 |
| SUS-1 | P1 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-1 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-1 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-2 | P1 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-2 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-2 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-3 | P1 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-3 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-3 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-4 | P1 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-4 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-4 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-5 | P1 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-5 | P2 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |
| SUS-5 | P3 | 1+1 | 1+1 | 1+1 | 1+1 | 0 |


Only 4 cells are not 1+1: FR-4 P1 (run 1 invented a generalisation), GRC-4 P1 and P3 (run 2 added a goods receipt), GRC-4 P2 (run 1 same). Clarify count is 0 in every case.

## Totals per prompt (lead-measured)

| Set | Measure | P1 | P2 | P3 |
|---|---|---|---|---|
| All 12 cases | keyed-found share | .951 | .879 | .907 |
| All 12 cases | hard plant found | 23/24 | 21/24 | 22/24 |
| All 12 cases | false statements (mean per answer) | .38 | .50 | .58 |
| All 12 cases | invented (1 = none) | .92 | .96 | .96 |
| 8 gate-PASS cases | keyed-found share | .926 | .819 | .860 |
| 8 gate-PASS cases | hard plant found | 15/16 | 13/16 | 14/16 |
| 8 gate-PASS cases | false statements (mean per answer) | .56 | .75 | .88 |

## Plain reading

- On these files the original prompt did as well as or better than both Strong prompts on keyed findings, the hard plant and false statements.
- The Strong prompts gave more extras and the asked-for tables.
- 2 runs per prompt is a small sample.
- 4 cases (FR-3, GRC-2, SUS-1, SUS-5) were too easy to separate the prompts (Ian: recorded, moved on).

## Notable

- SUS-4: P2 and P3 mapped "no internal carbon price" to E1-5, E1-4 or E1-7, not E1-8 (the key's mapping). E1-8 = internal carbon pricing is read from secondary sources, not quoted from Reg. 2023/2772.
- SUS-3: 4 of 4 Strong-prompt answers claimed "pasted" data that was not pasted. Ruled not false (FR-3 precedent).

## Measured vs read

- Measured this session: the answers and scores (Opus check of every Codex row; Codex as second scorer).
- Read, not measured: the @-file limits, read from the Workiva support page in Chrome on 2026-10-18 (logs/support_limits_2026-10-18.md; page "Reference specific files in chat with Workiva AI", updated Sep 9, 2026): max 10 files per prompt; Word, Excel, images, CSV, PDF, Workiva Document; Word and Excel ticked for AWS only; files must be in the workspace first; no size or page limit stated.

## Not tested

- Org sandbox.
- Google and Microsoft providers.
- More than 1 file per prompt (except FR-2).
- More than 2 runs.
- Size limits.
