# Session prompt — Curriculum piece 1, build 4: per-row editor and delete confirmation (plan task 5)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/curriculum-piece-1-build-4.md and do it`
The instructions are everything below the line. Pasting them directly also works.

---

Build **plan task 5** of `docs/superpowers/plans/2026-09-28-curriculum-piece-1.md`, and only
that. Model: **Sonnet** for the implementer and for any re-review.

Where the work is: branch `curriculum-piece-1`, with tasks 2–4 committed.

Check the ledger for Ian's ruling on **M1** (activity numbering). If he chose (c), the delete
confirmation also states the logged-call impact. That wording is his, so use what the ledger
records. Otherwise build the confirmation exactly as the plan shows.

Context to load (nothing else up front):
1. `docs/superpowers/2026-09-28-curriculum-LEDGER.md`
2. The plan: the header, Global Constraints, and **Task 5 only**
3. The tracker's header comment (rule 2: tokens only). Grep for `function openCurriculumModal`
   and read only that function.

Baseline first: suite `--expect 375` must read 375/375.

UI: invoke `frontend-design` **for the layout of the per-session block only**, minimal (spec
§4b). The editor's look is piece 3. Use existing classes and `:root` tokens; no new visual
language. Route the screenshots of the editor to Ian. Don't judge the look yourself.

How to work: `superpowers:test-driven-development`. Record each production-mutation proof in
`VALIDATION.txt`. Logs go to files.

Finish:
- Verification: suite 377/377, guide 18/18, and the manual editor pass from plan step 6.
- Commit, update the ledger, and stop. Next: `sessions/curriculum-piece-1-build-5.md`.
