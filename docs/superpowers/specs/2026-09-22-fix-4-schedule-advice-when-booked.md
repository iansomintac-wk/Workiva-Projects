# Fix 4 — "Schedule Session N" advice on accounts that are already booked

Status: ready for plan + execute. Source: the 2026-09-22 field test
(https://claude.ai/artifact/WfeYTbKRhE5Tb4qj2qErsd).

## Problem

The `behind_target` signal in `SIGNAL_DEFS` always suggests
`Schedule Session N: <title> and reset the graduation plan`, even when
`c.nextSessionScheduledOn` is already set. In the field test, 9 of 15 ranked beats
carried that advice, and 8 of those 9 were already booked, including Keystone, whose
call was that same afternoon. The signal underneath (projected pace lands after the
target) may be fair. The suggested action is wrong, and it teaches the OSM to skip
the list.

## Reproduce (measured 2026-09-22, two identical runs)

```
node tools/sim/run-field-test.mjs --out metrics.json
```

| Metric | Baseline | Target |
|---|---|---|
| `fix4_scheduleAdviceButBooked` | 8 | **0** |
| `fix4_scheduleAdviceBeats` | 9 | 1 (the unbooked one, Brightline, keeps "Schedule…") |
| `fix4_rankedBeats` | 15 | report the new number; don't aim for one |
| self-checks | 369/369 | all passing, plus a new check for this fix |

## Required behaviour

When `behind_target` fires and the next session **is booked**, the action names
the booking and the real choice. For example:

> Session 5 booked Sep 30 — at this pace graduation lands Dec 16, 45 days after the Nov 1 target. Tighten the cadence or reset the target.

- Use the projected date and slip the tool already computes. Don't add a second pace model.
- Unbooked accounts keep the current "Schedule Session N…" text.
- The same rule applies at the other site that builds this text (~17612, scheduling
  coverage) if it can fire for a booked account. Check, and fix it or rule it out.
- File-header rule 3: change the `SIGNAL_DEFS` entry itself, not
  `getRecommendedAction` / `getCustomerNextSteps` individually.

## Decision for the planner

Whether the Today beat for a booked, behind-target account should rank lower
(it's less urgent than an unbooked one). Recommendation: yes, one severity step lower
when booked. But that changes ranking across Today, Risk and Copilot, so make it a
separate task in the plan with its own check. Ian can drop it at review.

## Code pointers (line numbers as of commit db7fc97)

- `SIGNAL_DEFS` ~6851; `behind_target` entry ~6898–6906
- `getNextSessionInfo`, `isBehindTarget`, `projectedGraduationDate`
- scheduling-coverage text ~17612
