# Brief for every curriculum fix subagent (implementer)

Used by the piece-1 review-fix run (2026-09-30) and reused by later curriculum runs. The lead names the
worktree, branch, finding, starting suite count N and log dir in the dispatch prompt.

Tracker: `osm-book-of-business-tracker-1.0.html` (~26k lines, ~1.6 MB). **Never read it whole.** Grep for
symbols and read small ranges. Line numbers drift, so grep again after each edit. Work only in the worktree the
lead names.

Inputs: the finding or ruling the lead names, and the ledger `docs/superpowers/2026-09-28-curriculum-LEDGER.md`
(read only "Decisions made", "Rules carried between sessions" and the last section). Ian's rulings are binding;
do nothing that is not ruled.

Commands. Send output to a file in your log dir, outside the repo (e.g. `$CLAUDE_JOB_DIR/tmp/<FINDING>/` or
`$TEMP/<FINDING>/`). Never dump logs into context; read only the summary line and the FAIL lines.
- suite: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect N`
- guide: `node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18`
- dry runs: `node tools/migration-dryrun.mjs --from 11` and `--from 12`

## Protocol for a code change
1. **Verify first.** Write the new self-check (in `runSelfChecks`, next to the `identity` checks; copy their
   style) and run the suite on the CURRENT code. It must go **red** for the reason the finding names. Capture the
   exact FAIL line. If you cannot make it red, STOP: do not fix; report "pushback" with the evidence.
2. The check's setup must assert it evidenced more than 0 criteria (`ticked > 0` or similar; `stamped > 0` for
   migration checks), and its result object prints those counts. Assert literal expected numbers, not values
   recomputed by the helper the fix uses (true-by-construction is a known failure class here). Where the check
   asserts a rejection, match the message, not just "threw".
3. Fix production code: the smallest change that makes it green. No unrelated edits.
4. **Mutation proof:** copy the fixed tracker to your log dir (`fixed.html`), break the PRODUCTION fix (not the
   check), and run the suite: the new check must go red (record the FAIL line and the count). Restore from
   `fixed.html`; `cmp fixed.html osm-book-of-business-tracker-1.0.html` must print nothing. Then green again.
5. Count bump N → N+k in the same commit: `README.txt` (`must be N/N`), `VALIDATION.txt` (`N/N passed`, ~line 47),
   `CHANGELOG.txt` (the `N console-callable self-checks` line and the curriculum section's `N self-checks (was …)`).
   Then verify: `grep -n "must be\|passed, 0 failed\|self-checks" README.txt VALIDATION.txt CHANGELOG.txt | head`.
   Both numerator and denominator must read the new N (a fix on 2026-09-30 left `382/381`).
6. Add a `VALIDATION.txt` block at the end in the style of `CURRICULUM IDENTITY — FIX R4`: what changed, RED first
   line, fixture, MUTATION PROOF (mutation, red line, cmp identical), MEASURED THIS SESSION (suite, guide).
   If the tracker changed, re-measure the SHA-256 block: `git add` it, then
   `git show :osm-book-of-business-tracker-1.0.html | sha256sum` and `git cat-file -s :osm-book-of-business-tracker-1.0.html`.
   Write "(N bytes, LF blob)". This checkout has autocrlf=true, so the working-tree hash differs. `git hash-object`
   is not SHA-256. Keep the working tree CRLF; don't leave LF-only inserted lines.
7. Ledger: append 3–6 lines under the section the lead names: what changed, before/after counts measured, the RED
   line, the mutation red line, cmp identical.
8. One commit for the change, message `Curriculum <piece/topic> <ID>: <what>`, ending with the attribution lines the
   lead gives you. Do not push, merge, or touch other branches or worktrees. Never use `git stash`.

## Reply (≤ 10 lines)
status (done / pushback / blocked), commit sha, suite before→after, the RED line (trimmed to 200 chars), the
mutation red line, cmp result, evidence path. Nothing else.
