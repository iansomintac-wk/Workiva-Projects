# Handoff

````
/make-plan Redesign the Today tab of osm-book-of-business-tracker-v71.html (single-file HTML/JS, no build step, no server, localStorage, opens from file://). Current design failed a Dieter Rams audit at 17/30 with critical gaps in principles #3 aesthetic, #5 unobtrusive, #9 environmentally friendly, and #10 as little design as possible.

Verdict paragraph:
> The Today tab is honest, well-reasoned, and structurally duplicated: it tells the day twice through two identical scroll mechanics, meets the same account up to three times with three different control sets, and spends 16.4 viewports and 314 controls doing it — so the fix is a new organising axis, not a tidy-up of the existing one.

Why redesign and not refine: total is below 20, and the two lowest scores (#5 and #10) trace to one structural cause — the tab is organised by *reason for surfacing* (Calls today / This week / severity rank) rather than by the unit the user actually works (the account, once). No restyling removes a duplicate that the information architecture creates.

Primary user: a Workiva Onboarding Success Manager running 15–20 accounts through TTFV-1/TTFV-2 to graduation alongside Gainsight. Meetings most of the day; minutes, not hours, between them.
Primary task: arrive at Today, learn what today is, and do the work — call prep, Gainsight entries, risk creation/updates, compliance gates — without navigating away.

Preserve from current design:
- The severity registry TODAY_SOURCE_DEFS and its `why` strings, and the asserted-vs-inferred chapter notes in STORY_CHAPTERS — the only 3/3 dimension in the audit. Regression check: the phrase "Nobody has said anything is wrong. The tracker noticed silence, pace, or a keyword" must still render.
- todayActionList() ordering and all scoring logic — computeRisk, healthScore, gates (header rule 6).
- The focus pane's inline writes against the same c.compliance shape Edit Account uses — one source of truth, two places to reach it.
- Keyboard navigation bound once, reading the DOM at keypress time (a stale closure broke this once already).
- Undo via reading localStorage before writing.

Discard:
- renderDayCalls and the entire .dc-* scrolly system. Evidence: two implementations of one mechanic. Caused #10 and #5.
- The "This week" block — it restates today inside itself. Caused #5.
- Rendering all 15 focus panes to display 1. Caused #9.
- Both dot rails — visually identical, addressing different collections.

Top moves:
1. #10 as little design as possible: replace renderDayCalls + renderDayStory with one renderDay(beats) over a DAY_MOVEMENTS registry. Evidence: acts.js:108 and story.js:20 are the same mechanic twice.
2. #5 unobtrusive: key beats by account-day, not by surfacing reason; merge all reasons into one stack with severity = max. Evidence: "Northwind Utilities → blocks 1,2,3"; 314 controls for 18 accounts.
3. #2 useful: open the tab scrolled to the first unfinished beat, not the top. A time axis only helps a time-poor user if it starts where they are. Evidence: 16.4 viewports.
4. #9 environmentally friendly: window the panel pool to 3 nodes with swapped content. Evidence: 15 [data-focus-pane] in DOM to show 1; 120KB generated per render.
5. #3 aesthetic: move 416 inline style attributes into classes and give form controls a token font size, closing the 13.3333px and 10.375px orphans. Evidence: 12 distinct computed type sizes.

Organising principle: make the scroll axis the workday. Calls are fixed points; ranked work fills the gaps between them; admin collects into a close. One account gets exactly one beat.

Critical data constraint: nextSessionScheduledOn is date-only (isRealISODate, line 4686). There is no time of day in the schema. Do NOT print clock times that the book does not contain. Add an optional c.nextSessionTime ("HH:MM") under a schema bump 5→6 with a normalizer migration; show real times and real gap minutes only when it is set, and degrade to ordinal movements ("Before your first call", "Between calls", "After your last call") when it is not.

Motion: one rAF-throttled scroll listener writing a single --day scalar on :root, with beats declaring the range in which they are active — the hadaka.jp model of one timeline and range-gated subscribers, built with the in-house guide's dependency-free technique (sticky stage, most-visible-wins IntersectionObserver at threshold [.3,.5,.7] / rootMargin -18% 0px -18% 0px, one-shot reveal, travelling data-chapter label). No new dependencies. Everything gated behind prefers-reduced-motion, which degrades to a plain ordered list at full opacity.

Non-goals:
- Do not change tabs other than Today, except the Edit Account time input and the Gainsight queue's existing consumers.
- Do not alter severity numbers or health/risk maths.
- Do not introduce a build step, framework, or external library.

Deliverables for the plan:
- New information architecture: DAY_MOVEMENTS registry and buildDayTimeline() beat construction, including gap fitting and overflow.
- Migration step for schema 5→6 with the HH:MM normalizer.
- States checklist: empty (no calls, no ranked work), loading (n/a — synchronous), error, success, focus, disabled.
- Self-checks asserting CURRENT_SCHEMA_VERSION rather than a literal: at most one beat per customerId; every movementKey in the registry; merged beats carry both reasons at severity = max; severity-4 marked regardless of placement; time normalizer rejects "25:00"/"9:5"/"abc"; untimed days render no clock string; pane pool ≤3 nodes; gap overflow stated not dropped; DATA.riskLog unmutated by the suite; suite re-runnable.
- Verification that window.runSelfChecks() passes and that the count only grows.

Anti-patterns to guard against:
- Porting the old two-system structure under new styling.
- Printing invented clock times.
- Silently truncating overflow work — state what was moved and why.
- Re-rendering on scroll (it fights the scroll and destroys half-typed fields); swap classes and pane content instead.
- Leaving an addEventListener whose handler was deleted — it does not throw, and keyboard support dies silently.
````
