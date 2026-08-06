# Verdict — REDESIGN (17/30)

The Today tab is honest, well-reasoned, and structurally duplicated: it tells the day twice through two identical scroll mechanics, meets the same account up to three times with three different control sets, and spends 16.4 viewports and 314 controls doing it — so the fix is a new organising axis, not a tidy-up of the existing one.

**Why redesign and not refine.** Total is below 20, and the two lowest scores (#5 unobtrusive 1, #10 as-little-design 1) both trace to the same structural cause: the tab is organised by *reason for surfacing* (call / this week / severity rank) rather than by the unit the OSM actually works (the account, once). No amount of restyling removes a duplicate that the information architecture creates. Note that #6 honest scored a full 3 — the reasoning layer is not what is broken, and must survive the redesign intact.

## The organising move

**Make the scroll axis the workday.** Scrollytelling earns attention when the axis maps to something that already has an order. Severity rank is a *sort*, not a sequence — which is why a second sequence (calls) had to be bolted above it. Time orders both: calls are fixed points, everything else is fill.

One timeline. Top is now, bottom is the end of the day. Calls sit at their real clock positions. Ranked work fills the gaps between them, sized to each gap by the `effortMin` the tracker already computes. Admin collects into a close.

**One account gets one beat.** If an account has a call today *and* a severity-3 signal *and* an unqueued Gainsight item, that is a single beat whose panel carries all three, with the reasons stacked. This single rule removes the 5×3 duplication, collapses the two scrolly systems into one, and makes "do it all from here" literally true rather than mostly true.

## Top moves

1. **#10 as little design as possible** — Replace `renderDayCalls` + `renderDayStory` with one `renderDay(beats)` over a `DAY_MOVEMENTS` registry. Evidence: E1 — two implementations of one mechanic, `acts.js:108` and `story.js:20`.
2. **#5 unobtrusive** — Key beats by account-day, not by surfacing reason; merge reasons into one stack. Evidence: E1 — `Northwind Utilities → blocks 1,2,3`; 314 controls for 18 accounts.
3. **#2 useful** — Open the tab scrolled to *now*, not to the top. A time axis only helps a time-poor user if it starts where they are. Evidence: E1 — 16.4 viewports.
4. **#9 environmentally friendly** — Window the panel pool to 3 nodes with swapped content instead of rendering all 15 panes. Evidence: E1 — 15 `[data-focus-pane]` in DOM to display 1; 120KB per render.
5. **#3 aesthetic** — Move the 416 inline `style` attributes into classes and give form controls a token size, closing the `13.3333px` / `10.375px` orphans. Evidence: E2.

## Preserve

- The severity registry and its `why` strings, and the asserted-vs-inferred chapter notes (`story.js:8-11`) — the sole 3/3 dimension.
- `todayActionList()` ordering and all scoring logic (header rule 6).
- The focus pane's inline compliance writes against the same `c.compliance` shape Edit Account uses (`focuspane.js:1-12`).
- Keyboard navigation bound once, reading DOM at keypress (`focusKeyHandler`).
- The guide's dependency-free technique: one rAF-throttled scroll listener, sticky stage, most-visible-wins observer, one-shot reveal, travelling chapter label.

## Discard

- The `.dc-*` call scrolly as a separate system. Evidence: `acts.js:108-134`. Caused #10 and #5.
- The "This week" block on Today — it restates today inside itself. Evidence: E1 block 2. Caused #5.
- Rendering every pane up front. Evidence: E1. Caused #9.
