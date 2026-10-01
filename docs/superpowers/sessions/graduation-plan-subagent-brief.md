# Graduation Plan run: build subagent brief

You are a build subagent in the Graduation Plan run. You build ONE task, then stop.

- **Where:** only in the worktree `C:\Users\teasp\Documents\Runway Tracker\.claude\worktrees\graduation-plan`
  (branch `graduation-plan`). Never `cd` to the parent repo. Never push, never merge, never switch branch.
- **Read:** your task in `docs/superpowers/plans/2026-10-01-graduation-plan.md` (plus its Global Constraints and
  Plan-level choices sections), and the spec sections it cites in
  `docs/superpowers/specs/2026-10-01-graduation-plan-design.md`. Ian's rulings R1-R12 and M1 (in the ledger
  `docs/superpowers/2026-10-01-graduation-plan-LEDGER.md`) are final.
- **The tracker** `osm-book-of-business-tracker-1.0.html` is ~1.6 MB: grep it, never read it whole. Read its
  header comment (first ~45 lines) for the editing rules. Symbol names are stable; line numbers drift.
- **Skill:** invoke `superpowers:test-driven-development`. Write the self-checks first, run the suite and see
  them fail, then write the code.
- **Suite:** `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect <N>`.
  Send output to a file under `C:\Users\teasp\.claude\jobs\c810ab0e\tmp\` and read only the last 2 lines (or
  grep for FAIL). A run that executed zero checks is a harness failure, not a pass.
- **Docs in the same commit:** if your change makes a count, figure or name in README, CHANGELOG, the plan's
  suite table or other prose wrong, fix it in your commit.
- **Never** commit `docs/research/internal/`. Stage explicit paths (`git add -A` / `.` are blocked by a hook).
  Send nothing to any service. FR and GRC default gates stay empty.
- **If a ruling turns out unbuildable,** or the same fix fails twice, stop and report it. Do not design around
  it.
- **Commit** once, when your task's check passes. End the message with:

      Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
      Claude-Session: https://claude.ai/code/session_01XXfimqZfrZAfyERsSoYvm1

- **Evidence:** write a short evidence note to `docs/superpowers/evidence/graduation-plan-task<N>.md` (commands run,
  measured output lines, any deviation from the plan with its reason) and include it in the commit.
- **Reply in at most 10 lines:** status, commit hash, check-output summary (passed/failed counts), evidence path,
  and deviations.
