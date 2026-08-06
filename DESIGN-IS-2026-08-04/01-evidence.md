# Evidence

All figures measured in-browser on the 18-account book unless marked INFERRED.

## E1 — Structural

| Measure | Value |
|---|---|
| Interactive elements on the tab | **314** (17 per account) |
| DOM nodes under `#app` | 1,463 |
| Generated HTML for one tab | 120,690 bytes |
| Max nesting depth | 11 |
| Total tab height | **11,977px = 16.4 viewports** |
| Inline `style` attributes | **416** |

Top-level blocks of the Today render, with height in viewports:

| # | Block | vh | Content |
|---|---|---|---|
| 0 | `.day-standing` | 0.2 | the one-sentence standing |
| 1 | `.day-calls` | **3.9** | Calls today — own scrolly + own `.dc-dots` |
| 2 | `.section-card` | 0.8 | This week |
| 3 | `.story` | **10.9** | The ranked story — own scrolly + own `.story-dots` |
| 4 | `.section-card` | 0.4 | Also today |
| 5 | `p` | 0.0 | All-clear line |

**Repeated-affordance count: 5 of 18 accounts appear in three separate blocks each** (blocks 1, 2, 3 — Calls today, This week, The story), each time with a different set of controls and no stated relationship between the appearances. Example: `Northwind Utilities → blocks 1,2,3`.

**Two independent scrollytelling systems on one tab.** `renderDayCalls` (scratchpad `acts.js:108-134`) builds `.dc-steps`/`.dc-stage`/`.dc-dots`; `renderDayStory` (`story.js:20-58`) builds `.story-steps`/`.story-stage`/`.story-dots`. Same mechanic, same dot vocabulary, two implementations, two narratives.

**Over-rendering:** 15 `[data-story-step]` + **15 `[data-focus-pane]`** + 5 `[data-call-card]` are all in the DOM simultaneously; one pane is visible at a time (`.active` toggling, `focuspane.js:24`).

## E2 — Visual

- **Type scale observed (computed px):** `10.375, 11, 12.5, 13.3333, 14, 16, 22, 28, 30, 38, 44, 46` — 12 distinct sizes. `13.3333px` is Chrome's default for form controls and `10.375px` is an off-scale remainder; neither is a `:root` token value, so both are orphan styles under header rule 2.
- **Distinct rendered colours:** 30.
- **States present:** `:focus-visible` ✅ · `prefers-reduced-motion` ✅ · empty state ✅ (`.empty`, `today69.js:111`) · error ✅ (app error modal) · success ✅ (toast) · **disabled ❌** (no `[disabled]` on the surface).
- **Idle animations: 0.**

## E3 — Copy & honesty

The strongest dimension, and it is deliberate rather than accidental:

- `acts.js:4` — "Everything in it is counted, never estimated."
- `story.js:8-11` — chapter notes separate asserted from inferred in plain words: *"Someone asserted this — a flag you set, or a promise you made. Everything below this chapter is inferred."* and *"Nobody has said anything is wrong. The tracker noticed silence, pace, or a keyword — read the note before you act on it."*
- `focuspane.js:34` — every pick shows its own basis: `severity N of 4 · signal <key>`.
- Tracker `:2806` — AI citations must be verbatim from the cited curriculum session or they are **discarded mechanically by the client**, and an answer with no surviving citation is shown as unverified.
- No superlatives, no fake scarcity, no confirmshaming, no forced continuity. Label→behaviour mismatches found: **none**.

## E4 — Weight & friction

- File size **927KB**; all JS inline. Network requests after load: **0**. Idle animations: **0**. Modals/badges on load: 0.
- Motion gated behind `prefers-reduced-motion` (`focushandlers.js:17`).
- 120KB of HTML re-generated on every `render()`, including 14 panes that are not visible.

## E5 — Accessibility

- `:focus-visible` styling present; keyboard navigation for the story via `focusKeyHandler` (J/K/arrows), bound once, reads DOM at keypress.
- Every primary action in the focus pane is a real `button`/`select`/`input`/`textarea` — keyboard reachable.
- Contrast tokens are solved against the darkest surface (`--bg-card-hover`) rather than white, so ratios hold on hover.
- Dots expose `aria-label` with the account name.
- **Gap:** the two dot rails are visually identical but address different collections; nothing announces which is which beyond position.

## Reference mechanics (for the redesign, not scored)

**Guide (`osm-runway-onboarding-v3.9.html`) — the in-house technique, dependency-free:**
- `--scroll` root property = `(scrollY/max)*100`, rAF-throttled, one listener (`:479-481`).
- `.journey-stage { position:sticky }` beside `.journey-step { min-height:92vh; opacity:.25 }` → `.active { opacity:1 }` (`:130`).
- Scene cross-fade: `opacity` + `translateY(18px) scale(.985)` → none, `.45s/.55s cubic-bezier(.2,.8,.2,1)` (`:132`).
- One-shot `.reveal` observer that **unobserves after firing** (`:483`).
- Most-visible-wins observer, `threshold:[.3,.5,.7]`, `rootMargin:'-18% 0px -18% 0px'` (`:491`).
- **A travelling chapter label**: sections carry `data-chapter`/`data-nav-theme`; a probe at `innerHeight*.18` rewrites the nav label and inverts the nav theme as you pass (`:478`).
- Pointer parallax via `--mx`/`--my`, rAF-throttled, skipped under reduced motion (`:482`).

**hadaka.jp — the edge case.** Next.js + Tailwind (utility CSS only; **zero** `position:sticky` in its stylesheet) + Lenis + THREE.js. The motion is not in CSS at all. Its actual mechanic:
- **One global scalar** — `globalProgress` / `threeratio` — measured in *screen units*, taking values like `3.25`, `3.35`, `5`, `6.5`, `7`, `11.3`.
- Every element **declares the range of that scalar in which it exists**: `material.opacity = smoothstep(ratio, 3.25, 3.35)`, `visible = ratio > 3.25`, and sections mount at named integer offsets (`<Bounds offset={7}>`).
- Lenis interpolates scroll so the scalar moves *continuously* rather than in wheel-sized jumps.

The transferable idea is **not** WebGL. It is that there is no per-section scroll code: one timeline, and a registry of range-gated subscribers. That is the same shape as this codebase's `SIGNAL_DEFS` / `TODAY_SOURCE_DEFS` / `STORY_CHAPTERS`.

**Curriculum engine — the in-house authoring model.** A session is an ordered, authored unit with `title`, `enable[]`, `deliverables[]`, and a runbook; downstream consumers may reorder or add colour but may never contradict it, and citations are verified verbatim (`:2596-2615`, `:2796-2825`). The transferable idea: **work is a script with declared deliverables, and everything said about it must trace to the script.**
