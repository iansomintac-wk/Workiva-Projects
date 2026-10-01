# Brief for a curriculum fix checker (read-only on the repo)

A fresh checker follows every implementer. The lead names the worktree, finding, commit sha, suite count N and
the implementer's claims.

**Do not edit, stage or commit anything in the worktree.** Mutations go on scratch copies in your log dir
(`$CLAUDE_JOB_DIR/tmp/<FINDING>-check/` or `$TEMP/<FINDING>-check/`). selfcheck accepts any path:
`node tools/selfcheck.mjs <path-to-copy> --seed demo-seed.js --expect N`, run from the worktree. Logs go to files;
read only summary and FAIL lines. Never read the tracker whole; grep. The lead may be running the suite on the real
file at the same time.

Do ALL four steps. Steps 2 and 3 must be run, not reasoned about:
1. `git show --stat <sha>`, and the tracker diff only (`git show <sha> -- osm-book-of-business-tracker-1.0.html`).
   Judge: does the fix do what the finding asks, and no more? Does the check assert evidence > 0 in its setup? Is it
   true by construction (would it pass on broken code)? Any regression risk in the diff? Answer the lead's extra
   questions with evidence.
2. Red on the pre-fix code: copy the current tracker and revert only the production hunk(s) by hand, keeping the
   check. The new check must be red and everything else green.
3. A mutation of your own, different from the implementer's, on a copy of the fixed code: the new check must go red.
   If it survives, report that as a coverage gap.
4. Report ≤ 10 lines: verdict (confirmed / problem), counts, red lines (≤ 200 chars each), concerns. Mark what you
   ran and what you only read.
