# Fix 1 — The backfill note raises a false "Loss of Champions" risk

Status: ready for plan + execute. Source: the 2026-09-22 field test
(https://claude.ai/artifact/WfeYTbKRhE5Tb4qj2qErsd).

## Problem

The Backfill sessions grid writes each caught-up session with the summary
`Session N completed. Backfilled catch-up entry — logged after the fact.`
(`BACKFILL_NOTE_EXACT` / `BACKFILL_NOTE_EST`). The `champion_loss` entry in
`RISK_TAXONOMY` includes the phrase `'backfill'`, as in backfilling a departed
person's role. Every backfilled account is therefore classified as a
Customer Team / Loss of Champions risk, from text the tool wrote itself.

Where it spreads: the Risk tab cards, Copilot, the Today beat's evidence, and the
**CSM knowledge-transfer packet** ("OPEN AT TRANSFER — RISK [Category signal /
Customer Team/Loss of Champions]"). So a false risk leaves the OSM team.

Also seen, same cause: the Today beat's "LAST OTHER" line shows the backfill
placeholder instead of the most recent real note from that date.

## Reproduce (measured 2026-09-22, two identical runs)

```
node tools/sim/run-field-test.mjs --out metrics.json
```

| Metric | Baseline | Target |
|---|---|---|
| `fix1_backfillFalseRisks` | 24 | **0** |
| `fix1_riskSignalsTotal` | 68 | 44 (68 − 24; if it moves by any other amount, find out why) |
| `fix1_backfillInHandoffPacket` | true | **false** |
| `window.runSelfChecks()` (`node tools/selfcheck.mjs --seed demo-seed.js`) | 369/369 | 370+/370+, all passing, including a new check for this fix |

## Required behaviour

1. Notes the tool generates itself are never scanned for risk-taxonomy phrases or
   advisor risk/positive keywords.
2. A **real** note that says "we need to backfill Dana's role" still matches
   `champion_loss`. Don't just delete the phrase: it's a legitimate signal in human text.
3. Existing books that already contain backfill notes stop raising the false
   signal on load, with no action from the user.

## Decision for the planner (recommendation included)

- **A. Mark generated activities** (e.g. `generated: 'backfill'`). This is a data-shape
  change, so file-header rule 4 applies: bump `CURRENT_SCHEMA_VERSION` (currently 12)
  and add a `migrateData()` step that tags existing notes whose summary starts with
  `Session N completed. Backfilled catch-up entry`. It's robust to future wording changes.
- **B. Match on the known prefix** at scan time. No schema change, but it's fragile if
  the note text ever changes.

Recommendation: **A**. It's what rule 4 exists for, and the migration makes
requirement 3 hold.

## Code pointers (line numbers as of commit db7fc97)

- `BACKFILL_NOTE_EXACT` / `_EST`: ~18793; written at ~18903
- `RISK_TAXONOMY` (`champion_loss` at ~16170); scan loop at ~16192
- `scanForKeywords` ~6705, `customerKeywordSignal` ~6729
- `migrateData` ~4179, `CURRENT_SCHEMA_VERSION` ~4143
- KT packet: `buildKnowledgeTransferText` ~18623
- Read the editing rules in the tracker's HTML header comment before any edit.

## Out of scope

The "LAST OTHER" line on the beat shows the placeholder. Fix it only if it falls out
naturally from requirement 1; otherwise note it in the ledger.
