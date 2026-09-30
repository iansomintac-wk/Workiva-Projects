# Session prompt — Curriculum piece 1, build 5: migration 12 → 13 and dry-run (plan task 6)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/curriculum-piece-1-build-5.md and do it`
The instructions are everything below the line. Pasting them directly also works.

---

Build **plan task 6** of `docs/superpowers/plans/2026-09-28-curriculum-piece-1.md`, and only
that. Model: **Sonnet** for the implementer and for any re-review.

Where the work is: branch `curriculum-piece-1`, with tasks 2–5 committed.

Context to load (nothing else up front):
1. `docs/superpowers/2026-09-28-curriculum-LEDGER.md` (did Ian ask for an export-before-upgrade
   prompt? If yes, that is task 6b in its **own** session after this one, not here)
2. The plan: the header, Global Constraints, and **Task 6 only**
3. The tracker's header comment (rule 4: schema bump plus a numbered migration step). Grep for
   `CURRENT_SCHEMA_VERSION`, `function migrateData`, `if(v === 11)` and `sessionNotesIntact`.
4. `tools/migration-dryrun.mjs` and `tools/legacy-seed.js` (read these whole; they are small)

Baseline first: suite `--expect 377` must read 377/377. Run
`node tools/migration-dryrun.mjs > $TEMP/dry.log 2>&1; echo $?` for the v11 baseline exit code.

Traps named in the plan: the Phase A import check that reads `sessionNotes['1']`, and the dry-run's
v11 "sessionNotes unchanged" assertion. Both break when notes re-key. Fix them in this task and
keep their intent.

How to work: `superpowers:test-driven-development`. Record each production-mutation proof in
`VALIDATION.txt`, and say plainly that the migration has not run against a real book.

Finish:
- Verification: suite 378/378, guide 18/18, and dry-run exit 0 in both `--from 11` and `--from 12`.
- Commit, update the ledger, and stop. Next: `sessions/curriculum-piece-1-build-6.md`.
