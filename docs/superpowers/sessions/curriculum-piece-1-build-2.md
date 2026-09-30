# Session prompt — Curriculum piece 1, build 2: criteria match by id (plan task 3)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/curriculum-piece-1-build-2.md and do it`
The instructions are everything below the line. Pasting them directly also works.

---

Build **plan task 3** of `docs/superpowers/plans/2026-09-28-curriculum-piece-1.md`, and only
that. Model: **Sonnet** for the implementer and for any re-review.

Where the work is: branch `curriculum-piece-1`. Task 2 must be committed there already;
confirm with `git log --oneline -3`.

**M3 is ruled** (Ian, 2026-09-30: "M3: whole-snapshot equals pure-insert control"). The plan's
A2 code already carries it: both edit orders, each compared to a pure insert at the same
position. Use it as written. If Step 2's controls do not come out at +1 ttfv1 / +1 unevidenced /
0 orphans, the fixture is wrong: debug it before writing code.

Context to load (nothing else up front):
1. `docs/superpowers/2026-09-28-curriculum-LEDGER.md`
2. The plan: the header, Global Constraints, M3, and **Task 3 only**
3. The tracker's header comment (first ~45 lines). Grep for `outcomeCriteriaFor`,
   `materializeOutcomeCriterion` and `setSessionDeliverables`. Don't read the file whole.

Baseline first: suite `--expect 371` must read 371/371 (the command is in the plan). Run the spec
probe too, and note its `delete_session2` line as the before-number.

How to work: `superpowers:test-driven-development`. Record each production-mutation proof in
`VALIDATION.txt`. Logs go to files.

Finish:
- Verification: suite 373/373, guide 18/18. Spec probe `delete_session2` `reworded [0,0]` and
  orphaned `[0,3]` on all 6 accounts. Measurement probe I5 rows `ttfv1 9→10`, `unev 0→1`. If a
  number differs from the plan's expectation, report it before committing.
- Commit, update the ledger, and stop. Next: `sessions/curriculum-piece-1-build-3.md`.
