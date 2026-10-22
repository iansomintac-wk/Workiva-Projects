# Runway v13 fixes - plan

Source: docs/RUNWAY_V13_FIXES_PROMPT.txt (fix list from session 9c78980f). Ian, 2026-10-22, relayed verbatim:
"THE POINT WAS TO CHANGE THE DESIGN AND THEN FIX WHATEVER NEEDED TO BE FIXED BECAUSE WITH A DESIGN THE PREVIOUS UX/UI WOULD MOST LIKELY CHANGE." / "JUST FINISH IT NOW".
Lead: session 0e0cbb80, branch runway-v13-fixes (from runway-v13-look 8df9a0c). Ledger: .ledger/2026-10-22-runway-v13-fixes/progress.md (git-ignored).
Data: (none) - no book data model change; tests and self-checks use demo-seed.js and fixtures only.
Suite: node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect <N> ; node --test "test/*.test.mjs" "connector/test/*.test.mjs"

## Rules for every task (read first)

- First command in your isolated worktree: `git checkout -B v13f-<key> <BASE>` (BASE given in your dispatch); `git log -1 --format=%h` must print BASE. Commit only there, explicit paths (`git add <paths>`).
- v13 wins on layout, hierarchy, copy and colour. Keep 1.1's engine and data: no new DATA fields, no new features, never a health score or combined score.
- Tests first: add self-checks in tools/selfchecks-1.1.js inside the screen's `/* ==== v13 checks: X ==== */` block (or a new `/* ==== v13 fixes: <key> ==== */` block at the end of the v13 checks). Run the suite once before your code and record how many of your new checks fail (must be all of them); then after (all pass, 0 console errors). Log to a file under $CLAUDE_JOB_DIR/tmp or the task's out dir, read the summary line only.
- Verify: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect <535 + yours>`. Do NOT re-pin and do NOT run the node test suite (the sha pin fails until the lead re-pins after merge), except Task 2 which touches no HTML.
- Captures: `node tools/v13-shots.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --now 2026-10-12T08:40:00 --steps <json> --out <dir>`; step format: see C:/Users/teasp/.claude/jobs/0e0cbb80/tmp/steps-final.json. Open every capture you take; right subject, nothing on top, no blank area. Before shots: C:/Users/teasp/.claude/jobs/0e0cbb80/tmp/shots/final/. v13 reference: C:/Users/teasp/.claude/jobs/0e0cbb80/tmp/shots/v13/ and the template `C:/Users/teasp/.claude/jobs/0e0cbb80/tmp/v13/design_handoff_osm_workstation/source/OSM Workstation v13.dc.html` (standalone: `.../OSM Workstation v13 standalone.html`).
- Safety: never open Ian's normal Chrome profile (the tools use a temp profile), never write to his real book, publish nothing, no installs.
- Reply in at most 10 lines: status, commit, red/green counts, capture paths with what each shows.

## Task 1 - Desk work tabs act on the Desk's account (fix items 1a, 2, 9)

Files: osm-book-of-business-tracker-1.1.html (Desk block `v13 screen: Desk`, plus the smallest shared change needed), tools/selfchecks-1.1.js, CHANGELOG.txt.
- The Desk tabs (Prepare/Capture/Evidence/Record) draw 1.1's tab renderers inside `inert` (v13DeskTabBody). Their controls, bound by attachEvents, look up ui.openCustomerId, so on the Desk they could act on the wrong account. Make every control in those tab bodies act on the Desk's selected account (ui.v13DeskId, falling back to the first row as v13Desk does) and drop `inert` and the "Read here" title. Keep "Open full account" (the overlay) working.
- Prepare: fit 1.1's session plan into v13's Prepare structure Goal > Evidence > Uncertainty > Next review (see the v13 template's Prepare tab and v13-desk-full.png); keep 1.1's real content, shorter, no invented fields. Anything of 1.1's plan that has no v13 slot stays reachable (collapsed details or via the full account).
- Checks (red first): with openCustomerId set to account B and v13DeskId = A, logging an activity in Capture adds it to A, not B; a session-plan control in Prepare changes A; the tab panel has no inert attribute; Prepare shows the four v13 headings.
- CHANGELOG.txt: add a top entry "1.1 - v13 look." covering the v13 port (five screens, switch obm-next-screens-v1, '0' = old screens) and this fix.
- Captures: desk Prepare and Capture tabs, after.

## Task 2 - Day sim and its tools run on v13 (fix item 3)

Files: tools/sim/osm-day/** , tools/l12-persist-check.mjs, tools/d3-prep-panel.mjs, tools/l11-csat-panel.mjs, tools/l12-panel.mjs, tools/d2-prep-panel.mjs and any test that drives them (test/*.test.mjs) - no HTML edits.
- tools/sim/osm-day/lib/browser.mjs pins the old screens (localStorage 'obm-next-screens-v1' = '0'). Port the sim steps (steps-a.mjs, steps-b.mjs, verify.mjs, probe.mjs) and the tools to drive the v13 screens (Desk tabs, Co-pilot, Accounts, Risk, System), then remove the pin. steps-a.mjs carries one line Ian approved (D3 race): keep its intent.
- Where a v13 screen lacks a control the sim needs, use v13's route to it (e.g. Desk "Open full account" opens the overlay panel) rather than re-adding the old screen. If Task 1 is needed first for a step (Desk tab controls), note it and drive the overlay for now.
- Check: the README commands for the sim and each tool pass with no pin; record before (pinned) and after (unpinned) pass counts. Tests: `node --test "test/*.test.mjs" "connector/test/*.test.mjs"` - no new failures versus BASE.

## Task 3 - Accounts heading controls and Month calendar (fix item 7)

Files: osm-book-of-business-tracker-1.1.html (Accounts block only), tools/selfchecks-1.1.js (Accounts checks block).
- An extra row of 1.1 search/filter/sort controls sits under the Accounts heading (v13 has none). Keep the function (ids stay so attachEvents binds them) but fit them into v13's layout: one compact line in the heading area in v13 type and tokens, not a second toolbar.
- Compare the Month calendar with v13's (v13-acc-cal-month.png in C:/Users/teasp/.claude/jobs/0e0cbb80/tmp/shots/accounts/v13/ and the template); fix layout, hierarchy and copy differences.
- Checks (red first): the controls sit inside the heading section; search still filters; Month view matches the v13 structure you name. Captures: accounts table + month, after.

## Task 4 - Co-pilot "Before today's calls" and "Overdue" proven (fix item 8)

Files: tools/selfchecks-1.1.js (Co-pilot checks block), a fixture seed if needed (tools/v13-copilot-fixture.js), osm-book-of-business-tracker-1.1.html only if a group is broken.
- The groups are coded in the Co-pilot block but the demo book has none due. Add a fixture (a call booked today with prep owed; an overdue item) and checks that each group renders with the right item and count; a control (fixture removed) shows the group absent. Capture the Co-pilot with the fixture.

## Task 5 - Overlay panel in v13 tokens, dark mode, initials (fix items 1b, 4, 5) - after Tasks 1, 3, 4 merge

Files: osm-book-of-business-tracker-1.1.html (panel overlay styles, v13 shell/token CSS), tools/selfchecks-1.1.js.
- Restyle the full-account overlay panel (opened by "Open full account") in v13 tokens: type, colours, radius, spacing as the v13 screens use. No layout or behaviour change beyond the look.
- Dark mode: with the theme button set to dark, every v13 screen (Desk, Co-pilot, Accounts all six views, Risk, System) and the overlay use the dark tokens: no light sheet left on a dark page, text contrast readable. Capture each in dark.
- Initials circle "Me": if 1.1 already stores a user name in Settings, show its initials; else leave "Me". No new field.
- Checks (red first): computed background of the overlay and each screen's main sheet differs between light and dark and matches the token; initials rule.

## Task 6 - The Desk carries 1.1's Today-pane features (found by Task 2) - added 2026-10-22 ~16:45Z

Why: Task 2 (commit f61956b, branch v13f-sim) found that with v13 on, these accepted 1.1 features have no surface: Call prep (how the last call ended, open question, transcript line, Agenda + Copy agenda, you owe / they owe promises: D2, D3), the Sentiment toggle and the "Gainsight gates start at Go-Live" note (D9), "Wrap up the day" and "Back up the book" (D10), the Go-Live controls data-fp-outcome / data-fp-csat / data-fp-csat-sent / data-fp-csat-answered (L9-L12, L11) and the #surveys-to-chase line (L12). They lived in the old Today day pane (.day-pane, ui.todayFocusId). Restoring them is a fix, not a feature: no new data, same behaviour.
Files: osm-book-of-business-tracker-1.1.html (Desk block; reuse the old pane's renderers and handlers), tools/selfchecks-1.1.js.
- Give each one a home on the v13 Desk for the selected account, in v13 type and tokens: Call prep inside Prepare (it is the call review); Go-Live outcome/CSAT controls where the account's stage needs them (Prepare or Evidence); Sentiment toggle and the gates note in Capture; Surveys to chase as one line in the Today heading area; Wrap up the day and Back up the book in the Today heading or the Desk foot. Keep the same ids and data attributes so attachEvents and the sim find them; controls act on the Desk's account (controlCustomer, data-v13-desk-cust from Task 1).
- Checks (red first): with the switch on, each surface above is present on the Desk for an account that qualifies and acts on the Desk's account (one check per group).
- Captures: Desk Prepare with Call prep, Capture with Sentiment, Today heading with Surveys to chase and Wrap up / Back up.
Then Task 2 resumes on top: port the sim steps and tools to these surfaces, pin removed.

## Lead tasks (no helper)

- Item 6: report the left-out-for-lack-of-data list to Ian; no work.
- Item 10: remove worktrees v13-{desk,copilot,accounts,risk,system} and the five agent-* worktrees with node C:/Users/teasp/Documents/studio-harness/bin/remove-worktree.mjs <path> (--dry-run first).
- Merge each task branch into runway-v13-fixes, re-pin (node tools/repin.mjs), self-checks + full tests on the merge, README counts in the same commit.
- Final review, captures batch to Ian.
