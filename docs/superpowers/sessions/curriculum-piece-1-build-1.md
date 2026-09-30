# Session prompt — Curriculum piece 1, build 1: template ids and the single writer (plan task 2)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/curriculum-piece-1-build-1.md and do it`
The instructions are everything below the line. Pasting them directly also works.

---

Build **plan task 2** of `docs/superpowers/plans/2026-09-28-curriculum-piece-1.md`, and only
that. Model: **Sonnet** for the implementer and for any re-review.

Where the work is: create branch `curriculum-piece-1` from `master`. Before starting, confirm
that the plan and `docs/superpowers/specs/2026-09-28-curriculum-identity-design.md` are present,
and that Ian has not overruled P1–P4 in the plan (check the ledger).

Context to load (nothing else up front):
1. `docs/superpowers/2026-09-28-curriculum-LEDGER.md`: the rules carried between sessions
2. The plan: the header, Global Constraints, the P1–P4 choices, and **Task 2 only**
3. The tracker's header comment (first ~45 lines). **Don't read the tracker whole.** Grep for
   the symbols the task names. Line numbers in the plan are as of `a4f9bb3` and drift.

Before changing code, measure the baseline. A figure you read is a claim:
- Suite: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 369 > $TEMP/sc.log 2>&1; tail -2 $TEMP/sc.log`
  Expected: 369/369. If it differs (for example the fixes ledger landed first), say so and
  rebase the plan's counts before writing anything.

How to work:
- `superpowers:test-driven-development`. The plan's steps are in TDD order: checks first, red, then code.
- Each new check counts only after it has gone red against its named **production** mutation,
  and that proof is recorded in `VALIDATION.txt`.
- Logs go to files under `$TEMP`, never into context.

Finish:
- `superpowers:verification-before-completion`: suite 371/371 exit 0, guide 18/18, both probes
  re-run, and the numbers stated.
- Commit (plan step 8). Update the ledger: piece 1 → `building (task 2 done)`, with the commit and the suite count.
- Stop at the task boundary. The next session is `sessions/curriculum-piece-1-build-2.md`, and it
  needs Ian's ruling on M3 first. Say so in one line.
