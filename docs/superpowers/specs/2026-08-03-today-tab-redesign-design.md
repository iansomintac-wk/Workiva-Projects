# Today Tab Redesign — Focus + Dispatch (v61)

Date: 2026-08-03
File: `osm-book-of-business-tracker-v61.html` (renamed from `-v60.html` as part
of this change; bundle references updated in `guide-manifest.json`,
`osm-runway-onboarding-v3.5.html`, `README.txt`, `VALIDATION.txt`)
Baseline: the file as it exists on disk (v60, 86 self-checks). The previously
described continuity strip / `todayActionsList` / `DATA.lastWorkedOn` work is
**not** in this file; it was never landed. This design supersedes it.

## Problem

`renderToday()` renders five parallel lists (`attention`, `due`, `coverage`,
`batching`, `gainsight`) plus four strips. The five lists can each contain the
same account, so a book with 6 troubled accounts produces 15+ rows describing
6 accounts. Every section renders even when empty, with a placeholder. Nothing
is opinionated about what matters most.

The deeper issue, from how the tab is actually used: **Today is a dispatcher,
not a reading surface.** Its job is to surface the exception and then get the
user to the exact place the work happens (Gainsight admin, log a session, risk
management). It currently renders full detail inline as if the user would act
from Today, and then all four `data-open-cust` handlers hard-set
`ui.panelTab = 'overview'` — so the tab knows what kind of work each item is
and then throws that information away on navigation.

## Research grounding

- **HubSpot Customer Success Workspace** — states its goal as a dashboard that
  tells a CSM "which account needs what, in what order, and why." Validates
  account-centric rows + ranking + citations, from the closest comparable
  domain (a CSM managing a book of business).
- **IBM Carbon Design System, empty states** — an empty state should *replace*
  the element including its chrome ("the column headers and footer should not
  be present"), and repeated empty states in one space lose their impact.
  Names the five-placeholder-cards problem.
- **NN/g, progressive disclosure** — hiding content creates a "discovery
  deficit": users assume what they cannot see does not exist. This is why
  collapse-when-nonempty was **rejected** and why hide-when-empty is paired
  with a one-line all-clear footer.
- **Linear** — opinionated defaults reduce decision fatigue by narrowing the
  surface of choice rather than presenting equally-weighted options.
- **ChurnZero** — a CSM's day is framed as prioritizing coverage toward
  high-risk / low-engagement accounts; account-level, not task-level.

Explicitly **rejected** from the starting hypothesis: "collapse the
lowest-urgency section by default." `ui.todayCollapsed` already defaults
`{gainsight: true}`, and a collapsed section with a count badge is the worst
case — visible, asserting there is work, requiring a click to learn what.
Hide-when-empty removes a zero; collapse-when-nonempty hides a non-zero.

## Design

### 1. One row per account

New `todayActionList()` emits at most one entry per account:

```
{ customerId, customerName, severity, source, headline, reasons[], panelTab,
  health, daysSinceTouch, alsoWaiting: [{label, panelTab, count}] }
```

Candidate sources per account are built from the existing engines, each
carrying its own severity; the highest becomes the row headline, the remainder
become `alsoWaiting` deep-link chips.

Accounts that are in implementation, graduated, or have no actionable source
are excluded. In-implementation accounts keep their existing dedicated strip.

**Batch opportunities stay separate** — genuinely cross-account, does not fit
a per-account row.

### 2. Severity as a registry, not scattered numbers

`TODAY_SOURCE_DEFS` declares `{source, severity, why}` for every non-signal
source. `SIGNAL_DEFS` entries keep their native `severity()`. The `why` string
is not a comment — it renders as the tooltip on the severity chip, so the
number is explainable in the UI without reading source. A self-check asserts
every source key used by `todayActionList()` has a registry entry.

Bands mirror `SIGNAL_DEFS`: 4 = act today, 3 = act this week, 2 =
scheduled/admin work, 1 = opportunity.

### 3. Deterministic ordering

severity desc → health asc → days-since-touch desc → name asc → id asc.
A total order, so it is self-checkable for stability.

### 4. "Start here" card

Renders `todayActionList()[0]` with its full `reasons[]`, a "Why this one"
line naming the signal, its severity, how many accounts tie at that severity,
and the tie-break that decided it. Existing Done/Dismiss handlers attach when
signal-backed, so a wrong pick is demotable in one click.

Entries [1] and [2] render as compact runners-up inside the card. The ranked
list below starts at index 3 — no repetition.

The card renders nothing at all when the list is empty.

### 5. Deep-linking

`data-open-cust` handlers gain optional `data-open-tab`, validated against
`PANEL_TAB_KEYS`. Default stays `overview`, so every existing call site is
unaffected.

Coverage rows dispatch to `details`, **not** `sessions` — the editable "Next
session scheduled on" field lives on Edit Account. Session Plan is the
intuitive-sounding destination and the wrong one; dispatch has to follow the
field, not the name. (That tab's helper text still read "Feeds Today →
Scheduling Coverage", a section this redesign removes; updated.)

### 6. Emptiness

Empty sections vanish. One muted footer line names what is clear.

### 7. Preserved deliberately

- All four strips (paused, implementation, risk-hygiene, resolved-banner) stay
  non-collapsible and unchanged — each was an explicit trade for something
  else being hidden.
- Scheduling Coverage keeps its inline date input + "Add to calendar" — the
  only place Today lets the user act without leaving.
- `needsAttentionList()`, `computeTodayDiff()`, `getWeeklyDigest()` keep their
  current semantics; the NEW badge carries onto account rows.
- No schema bump: everything is derived, nothing new is persisted, Done/Dismiss
  reuse the existing `signalSuppressions` shape. Header rule 4 not triggered.

## Self-checks (86 → 99, all passing)

1. every Today source declares a severity band in `TODAY_SOURCE_DEFS`
2. every declared band carries a `why` string that explains it
3. severities are integers 1–4
4. **no Today row renders without a citation** — an unexplained recommendation
   is unrenderable
5. every deep-link targets a real panel tab
6. one row per account
7. dispatch chips never repeat a destination
8. every panel tab has a chip label
9. ranking is deterministic across genuine rebuilds (memos reset between)
10. **Start-here card shows exactly `todayActionList()[0]`** — the card cannot
    drift from the list it summarizes
11. Start-here card is absent when nothing is ranked
12. in-implementation and graduated accounts excluded, live ones kept
13. the Today checks leave the real book's risk memory untouched
14. **running the suite leaves the book's risk memory exactly as it found it**
    (suite-wide, asserted as the final check)

Checks 4 and 10 are what keep the opinionated pick honest rather than merely
confident.

## Two pre-existing bugs found while building those checks

Both fixed; neither was introduced by this work.

**1. Data loss on every self-check run.** The v58 and v59 hub checks saved
`DATA.riskLog` by *reference*, then let their synthetic runs stamp into that
same object and prune every real key — the real accounts aren't in
`DATA.customers` during the swap, so their risks look resolved. Restoring the
reference restored the already-corrupted object. So every `runSelfChecks()`
call silently erased the book's real risk memory (the `firstSeen` dates the
7-day and 14-day thresholds run on) and left synthetic keys behind. Header
rule 5 mandates running the suite after every edit, so the damage compounded
on exactly the workflow the file requires. Both now use a throwaway
`DATA.riskLog = {}`, matching what the v60 check already did. Check 14 above
exists so a future omission trips immediately.

**2. The suite was not re-runnable.** The v60 risk-memory check reset
`_riskMemo` / `_healthMemo` mid-check but not at its start, so a second
`runSelfChecks()` in one page session (no `render()` between to clear them)
served `__v60__`'s cached `ontrack` classification from the previous run's
end, produced no Off Track hub item, and died on `undefined.logKey`. Now
verified: four consecutive calls, 99/99 each.

## Accepted trade-offs

- Per-account rows hide item-level detail; mitigated by counts in chips, not
  eliminated.
- The severity mapping across unlike sources is a judgment call. Documented in
  the registry and surfaced in the UI, but still a judgment.
- The five section subtitles disappear. They currently teach what each list
  means; per-account rows have nowhere to put that. Real loss, accepted.
- `ui.todayCollapsed` becomes near-vestigial. Mechanism kept, not ripped out.
