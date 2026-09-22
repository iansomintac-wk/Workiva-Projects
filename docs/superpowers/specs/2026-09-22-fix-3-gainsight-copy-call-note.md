# Fix 3 — "Copy for Gainsight" leaves out the call note

Status: ready for plan + execute. Source: the 2026-09-22 field test
(https://claude.ai/artifact/WfeYTbKRhE5Tb4qj2qErsd).

## Problem

After an OSM logs a session, the tool adds three Gainsight to-dos ("Log call
summary in Gainsight timeline", "Update Last Touchpoint field", "Adjust health
score…"). Neither copy output contains the summary the OSM just wrote:

- `buildGainsightCopyText(c)` (the "Copy for Gainsight" modal) gives suggested next
  steps, gates, first value and contact, but no timeline entry.
- `buildGainsightBatchText(c, items)` ("Copy all N & queue") lists the to-dos
  themselves ("- [Call] Log call summary in Gainsight timeline").

So the OSM retypes the note in Gainsight. In the field-test time model this double
entry is the largest single cost (about −30 min per OSM per week at 10 calls).

## Reproduce (measured 2026-09-22, two identical runs)

```
node tools/sim/run-field-test.mjs --out metrics.json
```

Step `07-log-orion.js` logs Session 8 for Orion Semiconductor (note in
`window.__orionNote`).

| Metric | Baseline | Target |
|---|---|---|
| `fix3_copyTextHasCallNote` | false | **true** |
| `fix3_batchTextHasCallNote` | false | **true** (whenever a "Log call summary" item is in the batch) |
| self-checks | 369/369 | all passing, plus a new check for this fix |

## Required behaviour

When an account has a logged activity whose "Log call summary in Gainsight
timeline" to-do is still open, both copy outputs contain a **paste-ready
timeline entry** for it:

```
Sep 22, 2026 · Call · Session 8 of 8
<summary exactly as logged>
Next: <next session / next step if known>
Open promises: <i_owe / they_owe commitments not done, with due dates>
```

- Put it at the top of the text, before the existing sections.
- One entry per open "Log call summary" to-do, newest first.
- Existing content and the "nothing was pushed automatically" line stay as they are.
- Must survive `escapeHtml` in the modal's textarea path. Test with a note that
  contains `<`, `&` and quotes.

## Decision for the planner

The entry format above is a proposal. It isn't confirmed against a real Gainsight
Timeline field. Keep the format in one function so it's a one-place change if Ian's
team wants a different layout. Don't try to research Gainsight's schema. Ian will
confirm the format.

## Code pointers (line numbers as of commit db7fc97)

- `buildGainsightCopyText` ~7006, `openGainsightCopyModal` ~22710
- `buildGainsightBatchText` ~18608, `renderCustomerGainsightTab` ~18573
- the post-log checklist is generated when an activity is logged (see the "Log activity" handler
  and `pendingGainsightItems` ~7463)
- the impact key `gainsight_copy` stays as is
