# Session prompt — Curriculum piece 1, build 6: export and import keep ids (plan task 7)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/curriculum-piece-1-build-6.md and do it`
The instructions are everything below the line. Pasting them directly also works.

---

Build **plan task 7** of `docs/superpowers/plans/2026-09-28-curriculum-piece-1.md`, and only
that. Model: **Sonnet** for the implementer and for any re-review.

Where the work is: branch `curriculum-piece-1`, with tasks 2–6 committed.

Context to load (nothing else up front):
1. `docs/superpowers/2026-09-28-curriculum-LEDGER.md`
2. The plan: the header, Global Constraints, P4, and **Task 7 only**
3. Grep for `function exportData`, `JSON.stringify(DATA`, `function assertSessionTemplate` and
   `function assertNormalizedBookData`. Don't read the tracker whole.

Baseline first: suite `--expect 378` must read 378/378.

The liveness point to respect: default templates have deterministic ids that `ensureTemplateIds`
would re-mint identically. A7 needs a **user-minted** session in its fixture, or the mutation can't turn it red.

How to work: `superpowers:test-driven-development`. Record each production-mutation proof in
`VALIDATION.txt`. Logs go to files.

Finish:
- Verification: suite 379/379, guide 18/18, both probes, and the dry-run in both modes. State
  every number, and mark which were measured this session.
- CHANGELOG entry for piece 1. Ledger: piece 1 → `built`, with the self-check count and commit.
- Commit and stop. Next: `sessions/curriculum-piece-1-review.md`.
