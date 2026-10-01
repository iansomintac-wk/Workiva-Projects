# Curriculum piece 1, task 6: schema 12 -> 13 migration, A5, dry-run `--from 12`

Status: done, uncommitted. Everything marked (M) was measured in this session; (R) was read.

## Numbers
| | before | RED | after |
|---|---|---|---|
| suite | 377/377 (M, lead) | `runSelfChecks: 377/378 passed, 1 failed` (M) | `runSelfChecks: 378/378 passed, 0 failed` (M) |
| guide | 18/18 (M, lead) | | `runGuideSelfChecks: 18/18 passed, 0 failed` (M) |

A5 RED message (M): `{"evidencedBefore":33,"stamped":0,"unstamped":33,"rewordedBefore":true,"schema":12,"verdictsEqual":true,"numericLeft":24,"idempotent":true}`. Liveness holds in the RED run (33 evidenced, a reworded record present), so it failed for the right reason.

## Two failures after implementing (both mine)
1. Backslash lost from `/^\d+$/` in the new step (my escaping): no notes moved, A5 showed `numericLeft: 24`. Found by printing keys.
2. `phaseA the migration is idempotent` went red: `{"evidenceOnce":1,"evidenceTwice":2,"itemsOnce":1,"itemsTwice":2}`. That check sets a migrated book back to schema 11 and re-runs the v11 step. After 12->13 the notes sit under `ss_` keys, and the v11 step treated those as "bad keys" and minted duplicate orphan criteria. Fix: the v11 step skips `ss_...` note keys (a real v11 book has none). This is a small production change in the v11 step, not in the extracted helper. Deviation from the plan, which did not foresee it.

## Mutation proofs (production code, never the check body)
- Mutation: stamping `matched.forEach(...)` block in the v12 step commented out.
  - Suite red (M): `runSelfChecks: 377/378 passed, 1 failed`; A5 `{"evidencedBefore":33,"stamped":0,"unstamped":33,"rewordedBefore":true,"schema":13,"verdictsEqual":true,"numericLeft":0,"idempotent":true}`.
  - `verdictsEqual` stays true under the mutation (reader falls back to passes 1/2), so the stamp assertion is the discriminator, as the plan's mutation line implies.
  - Revert: `cmp` identical to the saved green copy (uncommitted tree, so `git diff` against HEAD cannot show a revert); suite 378/378.
- Dry-run `--from 12` under the same mutation (M): exit 1, `Placed: 21  Stamped: 0  Placed but unstamped (must be 0): 21`, `Live: false`. Reverted, `cmp` identical, exit 0.

## Dry runs (M)
- `node tools/migration-dryrun.mjs` (`--from 11`), exit 0: 12 accounts, 57 ticks before, 56 evidence after, 0 lost, 0 non-null dates, 0 sourceCount anomalies, second pass no doubling, `sessionNotes changed accounts: 1 (unexplained: 0)`.
- `--from 12`, exit 0: schema 12 -> 13; 6 accounts, 22 evidence records; 21 placed, 21 stamped, 0 unstamped (the 22nd is the orphan, left unstamped on purpose); 45 notes moved (48 less 3 for the 5-template account whose sessions 6-8 have no id); 0 notes lost/changed; 0 numeric keys left on a session with an id; 0 verdict changes; second pass identical; liveness true. Report: `.artifacts/migration-dryrun-v12.md` (gitignored).
- Six seed shapes in `tools/legacy-seed-v12.js`: normal, CSRD, reworded (pass 2), orphan, `totalSessions: "8"`, short module (5 templates, plan 8). Numeric notes on sessions 1-8 for every account. The seed does not commit/render the book (v11 seed does); the harness only needs `prepareBookData`.
- The v12 "before" is the same book run through `normalizeActivityCollections` + `applyDataBackfills` but not `migrateData`: today's matching, normalized. That is the proxy for "before"; it is not the old production code.

## Why `sessionNotes changed accounts: 1` at baseline
Not gating: the v11 harness only reported it (exit code looked at lost ticks, non-null dates, doubling, page errors). The one account is `legacy-badkey` (note key `'3 '`). The v11 step turns its tick into a custom criterion and `backfillCustomerRecord` (v48, pre-existing) then deletes the unusable-key note shell. The report prose already said so.
After the 12->13 step (before my harness change) the count was 12 of 12 (M), because every numeric key was re-keyed. I changed the comparison to modulo re-key: after re-keying ids back to numbers, the notes must equal "before notes minus keys failing SESSION_NOTE_KEY_RE". That count is still 1 (the same account). I also made an unexplained difference gate the run (exit 1); that is new behaviour beyond the plan's "compare modulo the re-key" and is the stated intent (no note content lost or changed). Report prose for that section was updated.

## Probes (M)
- Spec probe: Carbon 66 evidenced; `delete_session2` affected 6/6, reworded [0,0], evInCurr 11->10, orphaned 0->1, unevidenced 0->1, 6 detached; controls 0; `rename_s1_runbook ["authored","authored"]`. Same as after Task 4.
- Measure probe: base ttfv1 9; I5 both orders ttfv1 10, unev 1, orphan 0, reworded 1 (equal to the pure-insert control apart from reworded 1); `delete_s2_notes` 42 of 48 wrong; activities 32 of 38. Notes and activities unchanged, as the plan predicted: the probe writes numeric keys directly, no migration runs.

## Docs
Suite count 377 -> 378 in README.txt:74, VALIDATION.txt:48, CHANGELOG.txt:36 (grep for 377 in those files now hits only historical Task 5 entries in VALIDATION.txt). VALIDATION.txt has a new "CURRICULUM IDENTITY — TASK 6" section and tooling-list lines. It states plainly that the migration has not run against a real book and says Export JSON first. Not done: the SHA-256 block at the top of VALIDATION.txt was not re-measured (its own text says to do that last, at commit time).

## Other deviations / not verified
- The `CURRENT_SCHEMA_VERSION` comment and the v12 step are the plan text verbatim. `migrationCurriculumFor` is the v11 resolution moved verbatim (its comments kept, dedented); no behaviour change, the Phase A suite checks still pass.
- A5's check code differs from the plan only in detail: the stamped assertion reads the stored record (`sourceDeliverableId && sourceSessionId`), because the derived row carries the template's ids whether or not the record was stamped.
- Not verified: any real book; the in-app Export JSON prompt (Task 6b, Ian's call); browsers other than headless Chrome.
- Files: osm-book-of-business-tracker-1.0.html, tools/migration-dryrun.mjs, tools/legacy-seed-v12.js (new), README.txt, VALIDATION.txt, CHANGELOG.txt.
