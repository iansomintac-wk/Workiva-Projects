# Runway 1.1 → v13 look (plan)

Suite: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect <N>` and `node --test "test/*.test.mjs" "connector/test/*.test.mjs"`
Data: (none)
Branch: `runway-v13-look` from master fd3a09c. Baseline measured 2026-10-22 15:40Z: self-checks 503/503 (README says 502: stale), tests 597, 595 pass, 0 fail.

Ian, 2026-10-22 (relayed verbatim by the overnight-watch session): "THE POINT WAS TO CHANGE THE DESIGN AND THEN FIX WHATEVER NEEDED TO BE FIXED BECAUSE WITH A DESIGN THE PREVIOUS UX/UI WOULD MOST LIKELY CHANGE." So v13 wins on layout and flow; only the engine is kept (DATA/saveData, undo, imports/exports, backups, AI calls, pseudonymisation). Old-UI patches from 10-12..10-22 are not carried over. Old-UI layout self-checks may be replaced by v13 checks; data and safety checks are never weakened.

Reference: v13 standalone + `source/OSM Workstation v13.dc.html` (template = markup with inline styles; logic = `class Component`), extracted to `C:/Users/teasp/.claude/jobs/9c78980f/tmp/v13/design_handoff_osm_workstation/`. Screens (README order): Desk, Co-pilot, Accounts, Risk, System.

## How (D1)
- One browser-only switch `obm-next-screens-v1` (localStorage, never in the book or exports), default **on** = v13. `render()` picks the v13 shell when on, the old one when off.
- New code goes in one marked section `/* ==== v13 screens ==== */`: `v13Shell()`, `v13Desk()`, `v13Copilot()`, `v13Accounts()`, `v13Risk()`, `v13System()`. They only read while drawing; each wires its own clicks inside its container (`v13Bind(root)`), except where an existing button id is reused on purpose so `attachEvents()` keeps working (header actions, file inputs, settings, quick log, undo).
- Tokens: v13 light/dark tokens from the README on `:root` / `[data-theme=dark]`, Figtree + JetBrains Mono from Google Fonts (same pattern as today's Plus Jakarta link). Theme toggle top right, stored in `obm-theme-v1`.
- Features v13 has no screen for stay reachable: the selected account's "Open full account" opens the existing panel overlay (`ui.openCustomerId`).
- Any change to the 1.1 file needs the pinned sha256 re-pinned (`tools/repin.mjs`, see git log 679c7af).
- Captures: `node tools/v13-shots.mjs <file> --steps <json> --out <dir> [--seed demo-seed.js] [--now 2026-10-12T08:40:00]` (throwaway Chrome profile in the OS temp folder).

## Tasks

### Task 1: Shell, tokens, switch
Files: `osm-book-of-business-tracker-1.1.html`, `tools/selfchecks-1.1.js`.
1. Add the switch, the v13 tokens and fonts, the theme toggle.
2. `v13Shell()`: top bar as v13 (OSM mark, pill nav Desk / Co-pilot (badge) / Accounts / Risk / System, crumb, date chip, theme button, initials), page background `--page`. The old hero, stat tiles and numbered tabs are not drawn in v13 mode.
3. 1.1's header actions (undo, quick log, check calls, refresh from Gainsight, settings, progress report, add customer, backup status, test-book marker, hidden file inputs) move into the top bar or a compact menu there, keeping their ids.
4. Nav maps to `ui.view`: desk→today, copilot, accounts, risk, system (new value; old mode treats it as today).
5. Self-checks: the suite turns the switch off for the old-UI checks; add checks that v13 mode draws the shell, every nav item switches view, and the switch never enters `DATA` or an export.
Check: suite passes with the new count; tests fail 0; capture `desk` shows the v13 top bar.

### Task 2: Desk, top half
Today heading (+ "N calls · N confirmed risk · N signals to check · N things you owe today"), Day/Week toggle, strip chips (v13 `deskVals`: signals to check, confirmed risk, you owe today, in implementation, post-implementation, ready for graduation, Gainsight due), each filtering/jumping as v13; timeline card with hours, now-line and today's call blocks from 1.1's day data (`buildDayTimeline`). Counts come from 1.1's existing functions, never a health score.
Check: v13 checks for heading, chips and timeline; capture vs `v13-desk`.

### Task 3: Desk, book + selected account
Left "Your book" list (name, next session time, session progress ticks; no health number). Right: selected account card (eyebrow, big name, status pill, three fact cards: next planned session / meetings held / customer demonstrated), "Since the last conversation" collapsed chips, work tabs Prepare / Capture / Evidence / Record whose bodies reuse 1.1's existing tab content (session plan + brief / log activity / outcomes + handoff / activity + Gainsight), "Open full account".
Check: v13 checks for list, facts, tabs; capture vs `v13-desk-full`.

### Task 4: Co-pilot. Task 5: Accounts. Task 6: Risk. Task 7: System
Each: v13 layout from its template section, content from 1.1's existing renderers (`renderCopilot` data, `renderAccounts` views, `renderRiskTab` signals/confirmed, settings modal sections on a page). Check: v13 checks for the screen; capture vs its v13 capture.

### Task 8: Fix list
Side-by-side captures of every screen; list what the new design needs fixed (with captures); fix in small tasks. README + CHANGELOG counts updated in the same commit as the change.

Stops: captures to Ian after Tasks 1-3, 4-5, 6-7. Merge only after Ian's yes on the screenshots, through the merge rule.
