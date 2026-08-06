# Design spec — Today as one day (tracker v72)

Approved direction: **clock-time day · draft-in-beat / push-at-close · replace outright.**

## 0. The data correction

`nextSessionScheduledOn` is validated by `isRealISODate` (`:4686`) — a **date, no time of day**. Nothing in the schema records when a call happens. A timeline that printed "10:00 · Meridian Bank" would be asserting a number the book does not contain, on a tab whose one perfect score is honesty ("counted, never estimated", `acts.js:4`).

So the clock is **optional and earned**:

- Schema **5 → 6** adds `c.nextSessionTime` — optional `"HH:MM"` (24h), absent by default. Migration step is a normalizer: strip anything not matching `/^([01]\d|2[0-3]):[0-5]\d$/`.
- **With a time**, the beat shows it, gaps are measured in real minutes, and work is fitted to gaps by `effortMin`.
- **Without a time**, the day degrades to *ordinal* movements — "Before your first call", "Between calls", "After your last call" — and states load per movement without claiming any clock position.
- The time is settable in two places that write the same field: Edit Account (beside the existing date input, `:10962`) and inline on the call beat itself.
- Calls with a time sort before calls without; untimed calls keep the current `name.localeCompare` order and are labelled "time not set".

This is the difference between a tab that looks precise and one that is.

## 1. Registry — `DAY_MOVEMENTS`

The day's shape is generated per-day, not fixed. A no-call day and a five-call day produce different timelines from the same registry.

```
DAY_MOVEMENTS = [
  {key:'open',    label:'The standing',        worked:false},
  {key:'preface', label:'Before your first call'},
  {key:'gap',     label:'Between calls'},      // instantiated once per gap
  {key:'call',    label:'Call'},               // instantiated once per call
  {key:'after',   label:'After your last call'},
  {key:'close',   label:'The close',           worked:false}
]
```

Movements with no beats are omitted entirely — an OSM with no calls today sees `open → after → close`, which reads correctly as "a clear day of account work" rather than as an empty scaffold.

## 2. The beat — one account, one appearance

`buildDayTimeline()` returns an ordered array of beats. A beat is keyed by **account-day**, not by surfacing reason:

```
{ kind:'call'|'work'|'close',
  customerId, movementKey, at,            // 'HH:MM' or null
  headline, reasons[],                    // ALL reasons, stacked
  severity, effortMin, signalKey,
  call: {next, prepped, last, threads} | null }
```

Construction:

1. `callsScheduledToday()` → call beats, sorted by `at` then name.
2. `todayActionList()` → ranked work rows (ordering untouched, header rule 6).
3. **Merge**: if a work row's `customerId` already has a call beat, its `headline`/`reasons`/`severity` fold into that beat. `severity = max(...)`. It does **not** get a second beat.
4. Remaining work rows distribute into movements: highest severity into the earliest available gap, so urgent work lands before the first call rather than after the last.
5. When gap minutes are known (both bounding calls timed), a gap accepts beats until `Σ effortMin` exceeds it; the overflow moves to the next movement, and the movement states the overflow honestly rather than silently truncating.

**Severity 4 cannot hide.** Regardless of placement, a severity-4 beat gets a rail marker and is counted in the standing — the failure mode named in the verdict.

## 3. Motion — one scalar, range-gated subscribers

The hadaka mechanic, built with the guide's dependency-free technique. No new libraries.

- One rAF-throttled `scroll` listener writes `--day` (0–100) on `:root`, exactly as the guide's `updateScroll` does (`:479-481`). One listener for the whole tab, replacing the two observer systems.
- Each beat declares its range; the active beat is chosen most-visible-wins, `threshold:[.3,.5,.7]`, `rootMargin:'-18% 0px -18% 0px'` (guide `:491`).
- The **stage is sticky** (`position:sticky`, guide `:130`); panels cross-fade with `opacity` + `translateY(18px) scale(.985)` → none over `.45s/.55s cubic-bezier(.2,.8,.2,1)` (guide `:132`).
- A **travelling movement marker** replaces the two dot rails — the guide's `data-chapter` probe at `innerHeight*.18` (`:478`), reading "Between calls · 2 of 4" as you pass.
- One **fixed backdrop** whose tint is driven by `--day` and the active movement — the single-canvas idea from hadaka, expressed as one CSS gradient layer rather than WebGL. Zero idle animation; it only moves when scroll moves.
- Everything above is inside `if(!matchMedia('(prefers-reduced-motion: reduce)').matches)`. Under reduced motion the timeline is a plain ordered list at full opacity, no dimming, no cross-fade, keyboard and click still switching panels.

**Entry point:** the tab opens scrolled to the first unfinished beat, not to the top — the move that makes a time axis serve a time-poor person instead of taxing them. Implemented with `scrollIntoView({block:'center'})` after first paint, skipped if the user has already scrolled.

## 4. Windowed panel pool (fixes #9 and #10)

Today renders 15 panes to show 1. v72 keeps **3 pane nodes** — previous, active, next — and swaps their *content* on beat change. The container nodes are never replaced, so scroll is never fought and no half-typed field is destroyed; only the two off-screen nodes are rewritten. Expected: DOM nodes for the tab drop from ~1,463 toward ~400, generated HTML from ~120KB toward ~35KB.

## 5. Admin — draft in beat, push at close

`DATA.gainsightQueue` already exists (`:9057-9060`) and is already sanitized on import (`:13679`). No new store.

- Every inline action in a beat panel — outcome plan, CSAT contact, sentiment, risk CTA — **queues** rather than firing, and the beat shows a "→ added to close" acknowledgement.
- Actions that write `c.compliance` still write it immediately (they are the record, not a message); it is the *Gainsight-facing* payload that queues.
- **The close** is the final movement: everything queued, grouped by kind, with `Review` / `Push all` / `Export CSV`, plus what moved today and what is left. This is the "push-all button" already discussed for the Gainsight tab, sited where the day ends.

## 6. Removed

- `renderDayCalls` and the whole `.dc-*` system — absorbed into call beats.
- `renderDayStory` and the `.story-*` system — absorbed into work beats.
- The **This week** block — it restates today inside itself. The 7-day lookahead moves to the close as a one-line "tomorrow and the rest of the week" summary with a link, not a second list of the same accounts.
- Both dot rails, replaced by one movement marker + one progress rail.

## 7. Preserved verbatim

`todayActionList()` ordering · `computeRisk` / `healthScore` / gates · `SIGNAL_DEFS` · `TODAY_SOURCE_DEFS` and its `why` strings · `STORY_CHAPTERS` notes (they become movement notes) · the focus pane's writes against the same `c.compliance` shape as Edit Account · single-binding keyboard navigation reading DOM at keypress · undo via pre-write `localStorage` read.

## 8. Verification

Added to `runSelfChecks()`, asserting `CURRENT_SCHEMA_VERSION` rather than a literal:

1. `buildDayTimeline()` emits **at most one beat per customerId** — the duplication guard.
2. Every beat's `movementKey` exists in `DAY_MOVEMENTS`.
3. A customer with both a call today and a ranked signal yields one beat carrying both reasons, with `severity = max`.
4. Severity-4 beats are marked and counted in the standing regardless of placement.
5. Time normalizer rejects `"25:00"`, `"9:5"`, `"abc"`; accepts `"09:05"`, `"23:59"`.
6. Untimed calls degrade to ordinal movements with no clock string rendered anywhere.
7. The pane pool holds ≤3 nodes at any beat count.
8. Gap overflow is stated, never silently dropped.
9. `DATA.riskLog` is not mutated by the suite (existing guard).
10. Suite is re-runnable — memos reset at start, not mid-check.
