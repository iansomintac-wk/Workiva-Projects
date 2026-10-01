# Graduation Plan, Task 2 fix evidence (checker findings on bd153b0)

## Verified against the code
1. Confirmed. Gate rename/note used `change` -> saveData(); render(). The blur-triggered render replaced Remove / Add gate / checkbox before the click landed.
   Fix: rename and note save in place with no render() (the tracker's existing convention: `#comp-outcome-text` does `planText = value; saveData();`). Rename normalises the input value in place via cleanGoalText; an empty rename restores the stored text in place and toasts.
2. Confirmed. No existing remembered-`<details>` pattern in the tracker (its other handler avoids render() instead). Added session-only `ui.goalSecOpen`, `<details id="gp-sec-details">` renders `open` from it, a `toggle` listener updates it.
3. Confirmed unreached. Added c2f (planText-only account; asserts goalHintText and the panel show it) and c2g (details renders open iff ui.goalSecOpen).
4. 'graduated' check: Stage key is `'graduated'` (STAGES list, line ~2966; `c.stage !== 'graduated'` used throughout). renderGoalPanel's rule is correct. No change.

## Measured (this session)
- Red: `--expect 403` -> `402/403 passed, 1 failed` (c2g). c2f passed immediately, as the fallback already existed; it was untested, not broken.
- Green: `runSelfChecks: 403/403 passed, 0 failed`; guide (`node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18`) 18/18.
- Mutation: removed the planText fallback line in goalHintText -> FAIL c2f (`{"hint":null}`); restored, cmp identical.

## Not covered by the suite
- Findings 1 and the toggle listener in 2 are DOM event wiring (blur-before-click, toggle event); the in-page suite has no real-click harness. c2g covers only the render side of 2. Finding 1 was verified by reading the handlers (no render() on those paths), not by a click test.

## Docs
Counts 401 -> 403 in README.txt:74, VALIDATION.txt:47 (+ appended note), CHANGELOG.txt:36, and the plan's suite table and downstream estimates (+2 each, Task 3 step 2 text).
