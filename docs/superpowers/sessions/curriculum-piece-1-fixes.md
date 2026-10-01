# Session prompt — Curriculum piece 1: review fixes

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/curriculum-piece-1-fixes.md and do it`
The instructions are everything below the line. Pasting them directly also works.

---

Fix the findings in `docs/superpowers/evidence/curriculum-piece-1-review.md`. Use
`superpowers:receiving-code-review` first: verify each finding before you fix it, and push back with
evidence where one is wrong. Model: **Sonnet** for the lead seats, and for the implementer and checker
subagents. One finding per subagent, one at a time.

Where the work is: branch `curriculum-piece-1` (`58f3bb8`). The review branch
`curriculum-piece-1-review` adds only docs (this prompt, the review file, the ledger row). Merge or
cherry-pick it first.

**R1 is ruled (a)** (ledger, "Decisions made"): build it as recorded there. R5, M1r and M2r are Ian's
calls. Do only what the ledger records as ruled.

Context to load (nothing else up front):
1. `docs/superpowers/2026-09-28-curriculum-LEDGER.md`
2. `docs/superpowers/evidence/curriculum-piece-1-review.md`
3. Grep for symbols. Don't read the tracker whole.

Baseline first: suite `--seed demo-seed.js --expect 379` must read 379/379, and guide 18/18.

Order: D1, D2 (docs only) → R2 → R3 → R4 → R1 → M3r, M4r, M6r, M7r → anything else ruled.

For each fix:
- Write the new check first and capture it **red** on the current code.
- Fix. Then turn the check red again with a **production** mutation, revert it, and confirm `cmp` is
  identical. The check's setup must assert more than 0 evidenced criteria (or `stamped > 0` for
  migration checks).
- Update the suite count in README.txt, VALIDATION.txt and CHANGELOG.txt in the same commit.
- A fresh checker subagent re-runs the check, and the lead re-runs the suite itself.
- Write a ledger entry with the measured before/after.

Finish: re-run the suite, the guide, the spec probe, and `tools/migration-dryrun.mjs --from 11` and
`--from 12`, and record them in the ledger. Then stop. Merging is Ian's call.
