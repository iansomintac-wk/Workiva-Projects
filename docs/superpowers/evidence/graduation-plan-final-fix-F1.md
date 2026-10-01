# Final-review fix F1 (I1, I2)

TDD: added f1a-f1d first; run showed 4 FAIL (f1a re-open reads 5/5 with no next session; f1b re-graduation keeps old exit;
f1c re-opened no-goal account has no banner; f1d graduated panel has Change goal).

Fix (osm-book-of-business-tracker-1.0.html):
- `getExit(c)` returns the stored exit only while `c.stage === 'graduated'`; new `getGraduation(c)` likewise. Stored values
  are untouched on leaving Graduated. Readers (plannedSessionTotal, nextOpenSessionNumber, packet early-exit / no-goal /
  historic lines, implementation line, goal-panel banner) already go through `getExit`; the packet no-goal line now uses `getGraduation`.
- `applyGraduation` always rewrites `c.exit` (null when no sessions unheld) and `c.graduation`.
- Goal panel omits "Change goal" when graduated; the click handler refuses too.
- Migration/normaliser unchanged (they read raw `c.exit`/`c.graduation`, so stored values stay).
- c4i: removed the assertion that a kept exit on a live stage still reads 5/5 (that was the I1 bug); f1a covers the re-opened view.

Measured: `runSelfChecks: 431/431 passed, 0 failed`; guide 18/18; scenarios 6/6 (see final report for the migration dry-run result).
Docs: README, VALIDATION (:47, :153, :158, new entry), CHANGELOG, plan suite table updated. Historic VALIDATION lines (398, 1370-1381) left as records.
Deviation: none. Ian may overrule the keep-stored-values default at merge.
