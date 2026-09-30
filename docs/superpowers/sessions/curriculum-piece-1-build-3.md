# Session prompt — Curriculum piece 1, build 3: notes and runbooks keyed by session id (plan task 4)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/curriculum-piece-1-build-3.md and do it`
The instructions are everything below the line. Pasting them directly also works.

---

Build **plan task 4** of `docs/superpowers/plans/2026-09-28-curriculum-piece-1.md`, and only
that. Model: **Sonnet** for the implementer and for any re-review.

Where the work is: branch `curriculum-piece-1`, with tasks 2 and 3 committed. Confirm with `git log --oneline -3`.

Context to load (nothing else up front):
1. `docs/superpowers/2026-09-28-curriculum-LEDGER.md`
2. The plan: the header, Global Constraints, P3, and **Task 4 only**
3. The tracker's header comment. Grep for `readSessionNote`, `getSessionNote`,
   `authoredRunbookFor`, `rbLibraryIndex`, `sessionNotes[` and `backfillCustomerRecord`. Don't read the file whole.

Baseline first: suite `--expect 373` must read 373/373.

The trap to respect: `backfillCustomerRecord` **deletes** non-numeric note keys, and the import
validator **rejects** them. Change both in this task, or every id-keyed note vanishes on the next load.

How to work: `superpowers:test-driven-development`. Record each production-mutation proof in
`VALIDATION.txt`. Logs go to files.

Finish:
- Verification: suite 375/375, guide 18/18. Spec probe `rename_s1_runbook ["authored","authored"]`.
- Commit, update the ledger, and stop. Next: `sessions/curriculum-piece-1-build-4.md`.
