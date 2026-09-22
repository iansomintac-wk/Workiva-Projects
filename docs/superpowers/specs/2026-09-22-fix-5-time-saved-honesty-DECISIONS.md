# Fix 5 — The Time-Saved report counts setup as savings (DECISIONS NEEDED)

Status: **needs a brainstorm session with Ian before any spec or code.**
Source: the 2026-09-22 field test (https://claude.ai/artifact/WfeYTbKRhE5Tb4qj2qErsd).

## What was measured

- Field test (with one Progress Report click): the report showed **6h 21m saved today;
  5h 49m (92%)** from `session_backfilled` (105 × 3 min) and `value_imported`
  (34 × 1 min).
- Harness (no Progress Report click): `fix5_timeSavedTodayMin = 353`,
  `fix5_setupShareOfTimeSaved = "99%"`.

Both figures are correct for what each run did. They differ by the 25 minutes
credited for one Progress Report.

Credits are gross. Logging an activity credits +4 min but costs the OSM time and
creates a to-do to retype the note in Gainsight. There is no cost side.

Why it matters: this report is the evidence an approver will look at. The
field-test memo recommends a timed pilot, and this report should be able to serve
as its instrument.

## Questions only Ian can answer

1. **Setup actions** (backfill, value import, Excel import): leave them out of time saved,
   report them separately as "onboarding effort", or credit them only once they
   replace a real existing chore?
2. **Cost side:** should the report subtract an estimated cost per log or per upkeep
   action, so it shows *net* time? If so, what are the defaults? (They'd be editable,
   like the current `impactMinutes`.)
3. **The pilot:** should the report support a "baseline week" (OSM enters how long
   Monday planning, call prep, Gainsight entry and the manager update took *before*
   the tool) so the pilot compares measured against measured?
4. **Headline:** what one number should an approver see first?

## Code pointers (line numbers as of commit db7fc97)

- `IMPACT_EVENTS` ~15948 (minutes per action), `trackImpact` ~16003
- setup credits: `trackImpact('session_backfilled', …)` ~19099,
  `trackImpact('value_imported', …)` ~24696
- `buildImpactReport` ~16077, `computeImpactSummary` ~16056; the Progress Report
  header also quotes a time-saved figure
