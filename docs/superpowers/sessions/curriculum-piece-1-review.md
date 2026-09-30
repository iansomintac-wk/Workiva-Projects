# Session prompt — Curriculum piece 1: whole-branch review

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/curriculum-piece-1-review.md and do it`
The instructions are everything below the line. Pasting them directly also works.

---

Review branch `curriculum-piece-1` against `master`. This session reviews. It does not fix.
Model: **Opus** (whole-branch review is design judgement).

Context to load (nothing else up front):
1. `docs/superpowers/2026-09-28-curriculum-LEDGER.md`
2. `docs/superpowers/specs/2026-09-28-curriculum-identity-design.md` §4–5
3. `docs/superpowers/plans/2026-09-28-curriculum-piece-1.md`: the header, the pending decisions and
   the choices (the tasks only as needed)
4. The branch diff: `git diff master...curriculum-piece-1 --stat` first, then per hunk

Re-measure before reviewing. The figures in VALIDATION.txt are claims:
- suite `--expect 379`, guide 18/18, the spec probe, and `tools/migration-dryrun.mjs --from 11` and `--from 12`

How to work: `superpowers:requesting-code-review`, then `/code-review` on the branch. For each of
A1–A7, check that its VALIDATION entry records a **production** mutation that turned it red, and
that its setup asserts more than 0 evidenced criteria. Pick one mutation and re-run it yourself.

Finish: write the findings to the ledger (or a review file it links to), ranked. Fixes go to a
follow-up session on Sonnet via `superpowers:receiving-code-review`. Merging is Ian's call. Stop.
