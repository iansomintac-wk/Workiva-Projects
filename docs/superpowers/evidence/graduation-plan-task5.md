# Graduation plan task 5: GOALS section (evidence)

Commands (all run just now, output in `C:\Users\teasp\.claude\jobs\c810ab0e\tmp\t5-*.log`):
- RED: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 422` -> `417/422 passed, 5 failed` (c5a-c5e).
- GREEN: same command -> `422/422 passed, 0 failed`. Guide: `runGuideSelfChecks: 18/18`.
- Mutation: removed the `buildGoalsSectionLines(c)` insert -> `417/422`, FAIL c5a-c5e; restored (cmp identical).

Packet length on the demo book (17 accounts, throwaway probe `.artifacts/grad-plan/mkprobe.mjs`, `riskLog` swapped and restored):
- before: min 691, median 1,281, max 1,529
- after:  min 730, median 1,320, max 1,568 (+39 chars each)
- Spec §8 says 691-1,714; min and median reproduce, max measured 1,529 here (the 1,714 was read, not reproduced).

Deviations:
- Mutation proof removes the insert rather than moving it after SESSION HISTORY (stronger; c5a pins order anyway).
- Early exit line format: `Early exit: <label>[ — note] (<date>). Sessions marked not needed: Session N — title; ...`
  (the date was added; the brief only required reason, note and sessions).
- Test helpers gp5Packet/gp5Goals swap `DATA.riskLog` around the packet build (Task 4 note).
- Plan suite table row 5 marked "422 (measured)".
