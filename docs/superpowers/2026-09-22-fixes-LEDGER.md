# Field-test fixes — ledger

Source: the 2026-09-22 field test (https://claude.ai/artifact/WfeYTbKRhE5Tb4qj2qErsd).
Each session reads this file first, updates **its own row only** when it ends,
and does not start the next fix.

**Run order:** 1 → 4 → 3 (all edit the one tracker file, so run them one after
another, never in parallel). Fixes 2 and 5 need a brainstorm session with Ian
first, and can happen any time since they only write docs.

## Baselines (measured 2026-09-22 at commit db7fc97, two identical runs)

- `node tools/selfcheck.mjs --seed demo-seed.js` → **369/369**
- `node tools/sim/run-field-test.mjs` →

```
fix1_backfillFalseRisks 24      fix1_riskSignalsTotal 68     fix1_backfillInHandoffPacket true
fix2_coastalState watch         fix2_coastalReasons [Behind target, Watch]
fix3_copyTextHasCallNote false  fix3_batchTextHasCallNote false
fix4_scheduleAdviceBeats 9      fix4_scheduleAdviceButBooked 8   fix4_rankedBeats 15
fix5_timeSavedTodayMin 353      fix5_setupShareOfTimeSaved 99%
ctx_gainsightPending 66  ctx_complianceOnKickoff 13  ctx_gradDateChangeItems 20  ctx_status risk:2 watch:14 ontrack:18
```

A fix is expected to move **only its own metrics**. When a session ends, record
the full metric line. Any change to another fix's metric is a finding, not noise.

## Status

| Fix | Spec | Session prompt | State | Self-checks after | Metrics after | Commit |
|---|---|---|---|---|---|---|
| 1 Backfill false risk | specs/2026-09-22-fix-1-backfill-false-risk.md | sessions/fix-1.md | ready | | | |
| 4 Schedule advice when booked | specs/2026-09-22-fix-4-schedule-advice-when-booked.md | sessions/fix-4.md | ready | | | |
| 3 Gainsight copy carries call note | specs/2026-09-22-fix-3-gainsight-copy-call-note.md | sessions/fix-3.md | ready | | | |
| 2 Silent customer | specs/2026-09-22-fix-2-silent-customer-DECISIONS.md | sessions/fix-2-brainstorm.md | needs Ian | | | |
| 5 Time-saved honesty | specs/2026-09-22-fix-5-time-saved-honesty-DECISIONS.md | sessions/fix-5-brainstorm.md | needs Ian | | | |

## Notes carried between sessions

- Line numbers in the specs are as of db7fc97. Each fix shifts them, so grep for
  the named symbol rather than trusting the number.
- README.txt and VALIDATION.txt quote the self-check count (369). A fix that adds
  checks updates those files **in the same commit**.
