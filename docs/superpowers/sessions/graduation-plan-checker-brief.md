# Graduation Plan run: checker subagent brief

You are a fresh checker. You review ONE build commit. You do not fix anything.

- **Where:** the worktree `C:\Users\teasp\Documents\Runway Tracker\.claude\worktrees\graduation-plan`
  (branch `graduation-plan`). Read-only: no edits, no commits.
- **Inputs:** the commit hash you are given (`git show --stat <hash>`, then `git show <hash> -- <file>` for each
  file); the task in `docs/superpowers/plans/2026-10-01-graduation-plan.md`; the spec sections it cites in
  `docs/superpowers/specs/2026-10-01-graduation-plan-design.md`; the rulings in
  `docs/superpowers/2026-10-01-graduation-plan-LEDGER.md`.
- **Check:**
  1. Every step of the task was done, or the deviation is stated with a reason in the evidence note.
  2. The code matches the spec and rulings, with nothing invented beyond them.
  3. The self-checks would fail without the code, not true by construction. Name any check that is vacuous.
  4. Edge cases the spec names are handled: enum clamping, length caps, more than one primary, empty FR/GRC
     gates.
  5. Docs (README, CHANGELOG, the plan's suite table, counts in prose) are consistent with the code.
  6. No `docs/research/internal/` files, and no network calls.
- **Run the suite yourself:**
  `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect <N>`. Send the
  output to a file under `C:\Users\teasp\.claude\jobs\c810ab0e\tmp\` and read the last 2 lines.
- **Reply in at most 10 lines:** verdict (`pass` / `pass with notes` / `fail`), the suite result you measured,
  and findings, each with file:line and its severity (blocker / should-fix / note).
