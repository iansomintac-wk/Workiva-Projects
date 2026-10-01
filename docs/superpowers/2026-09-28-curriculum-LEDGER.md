# Curriculum authoring — ledger

Umbrella spec: `specs/2026-09-28-curriculum-identity-design.md` (approved by Ian 2026-09-28).
Decisions are in spec §1. Each piece gets its own spec, plan and build.

| Piece | Spec | Session prompt | State | Self-checks after | Commit |
|---|---|---|---|---|---|
| 1 Stable identity | specs/2026-09-28-curriculum-identity-design.md §3–6 | plan: sessions/curriculum-piece-1-plan.md; build: sessions/curriculum-piece-1-build-1…6.md; review: sessions/curriculum-piece-1-review.md | **built (tasks 2–7 done)** on branch `curriculum-piece-1` (plans/2026-09-28-curriculum-piece-1.md). Next: review (`sessions/curriculum-piece-1-review.md`) | **379/379** measured 2026-09-30 (guide 18/18) | task 2: `29689c4`; task 3: `2a57350`; task 4: `dd1ccf4`; task 5: `05e2356`; task 6: `a9da098`; task 7: `ec2f175` + `d4c2c00` (SHA re-measure); ledger: see git log |
| 2 Versioned curriculum + pinning | not written (outline in umbrella §2) | not written | after piece 1 | | |
| 3 Authoring UI + runbook editor | not written (outline in umbrella §2) | not written | after piece 2 | | |
| 4 Share, fork, upgrade | not written (outline in umbrella §2) | not written | after piece 3 | | |

## Baseline (measured 2026-09-28 unless marked)

- Probe, demo book, Carbon, 66 criteria evidenced: deleting session 2 → 6 accounts
  affected, 6 criteria per account shown as `reworded since` (was 0), 3 orphaned, 3 unevidenced.
  Controls: no-op 0 accounts, delete-last 0 accounts. Renaming session 1 → runbook
  `authored` → `standard`.
- Suite 369/369 seeded: **read** from the brief, not re-run in the spec session.
- I5 figures (9 → 11 ttfv1 criteria, `ttfvDays` 180 → null): **read** from `VALIDATION.txt`.

## Baseline re-measured in the plan session (2026-09-30, `a4f9bb3`)

- Suite **369/369** seeded, exit 0 (was only read before; now measured). Guide **18/18**, exit 0
  (`osm-runway-onboarding-1.0.html --fn runGuideSelfChecks`).
- Spec probe: **matches** the spec. Carbon 66 evidenced; `delete_session2` `reworded [0,6]` on all
  6 accounts, evInCurr 11→8, orphaned 0→3, unevidenced 0→3, 18 detached; controls 0;
  `rename_s1_runbook ["authored","standard"]`.

## The three open items (answered 2026-09-30)

1. **I5 reproduced** (`specs/2026-09-28-curriculum-identity-measure.js`, Carbon, 6/6 accounts,
   session 1 ttfv1): insert one deliverable and reword another in either order gives ttfv1 **9 → 11**,
   unevidenced **0 → 2**, and 1 orphan (the "duplicate"). `ttfvDays` → **null** only when First Value is
   *derived* (60…150 → null). The demo seed *records* `achievedOn`, which `getFirstValue()`
   prefers, so there `ttfvDays` doesn't move. Also measured: a **pure insert** alone makes the derived
   `ttfvDays` null, which is correct and unchanged by piece 1. So A2's "`ttfvDays` unchanged" can't
   hold as worded (**M3**, ruled 2026-09-30, see "Decisions made"). Source correction: the I5 figures were never in
   `VALIDATION.txt` (`git log -S` finds them only in `d8266be` and `3c76a56`).
2. **§3d: notes do shift.** Deleting Carbon session 2 puts **42 of 48** prep notes under the wrong
   session. Positional keys the spec does not cover, sent back as amendments rather than planned:
   **M1** `activity.sessionNumber` (32 of 38 session-linked calls move; it drives completion
   counts, next session, gap signal, runway/Gantt dates, the debrief prompt and Gainsight backfill);
   **M2** `totalSessions` placeholder padding after a delete (code read, not measured). **M4**:
   the "per-deliverable ticks" in notes are text-keyed legacy data that nothing writes, so re-keying them is moot.
3. **Export before upgrade is not enforced in code.** Documentation only: `VALIDATION.txt:350-354`
   and `plans/2026-09-09-outcome-phase-a.md:1143`. No prompt and no automatic pre-migration copy
   (`-prerepair-` only when repairs drop something; `-rejected-` only on failed validation; the
   backup nag is time-based). **Ian decides** whether piece 1 adds a prompt (it would be task 6b).

## Decisions pending (Ian)

- M1 activities: (a) key by session id / (b) leave to piece 2 pinning / (c) state the call impact in the delete confirmation
- M2 placeholder padding: include or defer
- M4 drop §4d's tick re-key sentence
- Export-before-upgrade prompt: yes (task 6b) / no
- Plan choices P1–P4 (plan header): accept or overrule before build 1

## Decisions made (Ian)

- **M3, 2026-09-30**, verbatim: "M3: whole-snapshot equals pure-insert control". Why the plan's
  proposal was not enough: measured on Carbon (derived First Value), the I5 bug gives
  ttfv1/unev/orphan/`ttfvDays` = 11/2/1/null and the pure-insert control 10/1/0/null. So
  "`ttfvDays` equals the control" passes on broken code. The counts tell them apart. Applied in
  plan Task 3's A2 code, spec §5's A2 row and the build-2 prompt. Build 2 is unblocked.

## Task 3 results (build 2, 2026-09-30, measured)

- Before: suite 371/371, guide 18/18; spec probe `delete_session2` `reworded [0,6]`, orphaned `[0,3]`,
  18 detached; measurement I5 both orders 9→11 ttfv1, 0→2 unev, 1 orphan.
- After: suite **373/373**, guide **18/18**; spec probe `reworded [0,0]`, orphaned **`[0,1]`**, evInCurr
  11→10, unevidenced `[0,1]`, 6 detached, controls 0, `rename_s1_runbook ["authored","standard"]`
  (Task 4); measurement I5 both orders ttfv1 **9→10**, unev **0→1**, orphan 0, reworded 1.
- Mutation proofs (in `VALIDATION.txt`): pass 0 removed → 358/373 (A1, A2 and 13 phaseA/B red);
  reword mints a new id → 371/373 (A2 and the phaseA reword check red; A1 green, it never rewords).
- **Correction: the plan expected orphaned `[0,3]` after the change. That was the before-number.**
  Measured Carbon deliverables per session `[2,1,2,2,1,1,1,1,1,1,1,1]`: session 2 has one
  (`dl_carbon_02_01`), so one orphan per account is right; the old 3 came from positional
  mismatching. Plan Task 3 Step 7 and Task 7's expectation are corrected to `[0,1]`.

## Task 4 results (build 3, 2026-09-30, measured)

- Before: suite 373/373, guide 18/18. RED (HEAD code + the two new checks): 373/375, A3
  `rbLibraryIdIndex is not defined`, c4b `{"ticked":22,"compared":16,"wrong":14}`.
- After: suite **375/375**, guide **18/18**. Spec probe `rename_s1_runbook ["authored","authored"]`
  (was `standard`); `delete_session2` reworded `[0,0]`, orphaned `[0,1]`, 6 detached on 6/6, as
  after Task 3. Measure probe: `notesShownUnderWrongSession` still **42/48**. That is expected:
  the probe writes numeric keys (unmigrated shape), which Task 6's migration re-keys.
- **Correction to the plan's checks: the trap had no guard.** With plan-as-written A3 + c4b, reverting
  either the backfill or the validator regex to `/^\d+$/` left the suite **375/375** (measured).
  c4b now loads its accounts through `prepareImportedData` before the delete; each revert then turns
  c4b red (backfill: `compared 0`; validator: `Import rejected … Session ss_carbon_01`). Four
  mutation proofs, each 374/375 with only its own check red, recorded in `VALIDATION.txt`.
- Implementer (Sonnet) inferred the RED summary line rather than capturing it; it was re-measured.

## Task 5 results (build 4, 2026-09-30, measured)

- Before: suite 375/375, guide 18/18. RED (new checks, no actions yet): `374/377`, A4
  `moveDeliverableRow is not defined`, c5b `sessionDeleteImpact is not defined`, A6
  `addDeliverableRow is not defined`.
- After: suite **377/377**, guide **18/18** (re-run by the orchestrator, not just read from the implementer).
- Mutation proofs (in `VALIDATION.txt`): `sessionNoteKey` → number: 375/377 (A4 and Task 4's c4b red);
  textarea-style split handler: 376/377 (A6 only); evidence filter dropped in `sessionDeleteImpact`:
  376/377 (c5b only, impact 4 where 3 have evidence).
- M1 still pending, so the delete confirmation is plan Step 5 as written (no logged-call sentence).
- Editor pass (headless Chrome over CDP, real DOM events): reword keeps id, reorder and session
  move/back, add, clear-removes, ✕, delete → Cancel keeps 12 sessions. Screenshots routed to Ian;
  look not judged.
- **Correction: I expected the delete confirmation on the demo seed to say 6 accounts. It said 0, and 0 is
  right.** The demo seed evidences no criteria; the 6/6 in "Baseline" comes from the spec probe, which ticks
  evidence first. With all criteria evidenced on 5 of the 6 Carbon accounts (55 ticked), it says
  "5 accounts have evidence on this session's deliverables".
- Deviation, kept: clearing a deliverable's input removes the row and so re-renders the modal (the plan
  re-renders only the app on reword, which would leave a blank input and shifted row indices).

## Task 6 results (build 5, 2026-09-30, measured)

- Before: suite 377/377, guide 18/18, v11 dry-run exit 0 (12 accounts, 57 ticks -> 56 evidence, 0 lost,
  `sessionNotes changed accounts: 1`, which was reported but never gated). RED: `377/378`, A5
  `stamped:0, unstamped:33, evidencedBefore:33, schema:12`.
- After: suite **378/378**, guide **18/18**. `--from 11`: exit 0, 0 ticks lost, notes changed 1
  (unexplained 0). `--from 12`: exit 0, 6 accounts, 22 evidenced, 21 placed / 21 stamped (the 22nd is the
  orphan), 45 notes moved, 0 lost, 0 verdict changes, second pass idempotent. Re-run by the lead, not
  just read from the implementer.
- The `sessionNotes changed: 1` is `legacy-badkey` (key `'3 '`), dropped by `backfillCustomerRecord` v48.
  The v11 dry-run now compares notes modulo the numeric -> id re-key, and an unexplained difference **fails**
  it (exit 1). Before, it was only reported.
- Mutation proofs: the implementer skipped the stamping loop (A5 red `stamped:0`, `--from 12` exit 1,
  "placed but unstamped 21"). A fresh checker ran two more: skipping the notes re-key (A5 `numericLeft:24`,
  `--from 12` exit 1) and dropping only `sourceDeliverableId` (A5 `stamped:0`). Each was reverted
  byte-identical.
- **Unplanned production change, kept (Ian may overrule):** the v11 -> 12 step now skips `ss_` note keys.
  Once v12 -> 13 existed, `phaseA the migration is idempotent` went red: it forces `schemaVersion = 11` over
  an already-migrated book, and the v11 step read `ss_` keys as bad keys and minted duplicate orphans. A
  real v11 book can't have `ss_` keys, so real migrations are unchanged. The checker's alternative is to
  change that check instead and keep production cleaner.
- Probes unchanged from Task 4, as expected: spec `delete_session2` reworded `[0,0]`, orphaned `[0,1]`;
  measure probe notes still 42/48, because it writes numeric keys after load.
- **The migration has not run against a real book.** It has run only against the fixtures and the two seeds.
- Correction: VALIDATION.txt's SHA-256 block had been stale since before piece 1. The tracker blob itself
  carries CRLF (25,179 CR lines at master `85672e6`), so its two forms coincide; the guide is LF-blob,
  CRLF-tree. Re-measured and rewritten.
- Evidence: `docs/superpowers/evidence/curriculum-piece-1-task6.md`.

## Task 7 results (build 6, 2026-09-30, measured)

- Before: suite 378/378, guide 18/18 (measured by the lead). RED: `FAIL identity A7 … serializeBook is not defined`
  (implementer, captured verbatim).
- After, measured by the lead at `d4c2c00`: suite **379/379**, guide **18/18**. `--from 11`: exit 0, 57 ticks -> 56 evidence,
  0 lost, notes changed 1 (unexplained 0). `--from 12`: exit 0, 6 accounts, 22 evidenced, 21 placed / 21 stamped, 45 notes
  moved, 0 lost, 0 verdict changes, idempotent. Spec probe: Carbon 66 ticked, `delete_session2` affected 6, reworded
  `[0,0]` ×6, orphaned `[0,1]` ×6, 6 detached; no-op and delete-last 0; `rename_s1_runbook ["authored","authored"]`.
  Measure probe: base ttfv1 9; I5 ttfv1 10, unev 1, orphan 0, reworded 1. All as after Task 6.
- `serializeBook` is the one serializer for `exportData` and `fsWriteNow`. Left alone: the localStorage save (persistence),
  the single-customer archive record, and the queue/ICS/CSV/text/HTML exports (none writes a whole book).
  `prepareBookData` order: `migrateData` -> `applyDataBackfills` -> `assertNormalizedBookData`, so id-less legacy books get
  ids before the new id validation runs.
- Mutation proofs (in `VALIDATION.txt`): the plan's replacer in `serializeBook` -> A7 red (`randomPresent:false,
  idsSame:false`), and v99 red too; making the `deliverableIds` reject unreachable -> A7 red (`threw:false`). Both reverted.
  The lead re-ran the replacer mutation at `d4c2c00`: exit 1, only A7 (`ticked:4, randomPresent:false, idsSame:false`) and
  v99 red; revert hash `ad0c1fdd…` identical; 379/379 again.
- **Lead ruling: check `v99` changed.** Its clause required the literal `JSON.stringify(DATA, null, 2)` in `fsWriteNow`,
  which routing through `serializeBook` breaks. It now requires `serializeBook(DATA)` there and
  `JSON.stringify(data, null, 2)` in `serializeBook`. Nothing else in v99 changed.
- **Correction: VALIDATION's SHA-256 block was stale again.** Task 7's first commit marked it "carried" while the tracker had
  changed (stated `3a3e1b62…`, measured `942536ef…`). Re-measured in `d4c2c00`: tracker `ad0c1fdd…` (1,607,191 bytes;
  the one byte is a restored comment space). Guide unchanged.
- Deferred to the review: import validation checks `deliverableIds` uniqueness only within a template, so duplicate session
  ids across templates, or duplicate deliverable ids across sessions, pass import.

## Rules carried between sessions

- A new check counts only once it has been shown failing against a mutation of
  **production** code, and its setup must assert that it evidenced more than 0 criteria. The
  spec session's first probe run was green only because the seed had no evidence.
- Line numbers drift with each commit. Grep for the symbol.
- Plan code for a check is a hypothesis too. Task 2's A6 regex, copied as written, stayed
  green under its own named mutation (it allowed one `[..]` group; the handler's receiver is
  `sessionTemplates[curKey()][idx]`). It was caught only because the mutation proof was run.
  Fixed in `29689c4`. Tasks 3–7 will copy more check code from the plan, so each one runs its
  mutation proof for the same reason.
- P1–P4 were not overruled before build 1, so build 1 went ahead on them as written.
- README.txt and VALIDATION.txt quote the self-check count. A task that adds checks updates
  both files in the same commit.
- Schema changes keep the export-before-upgrade discipline. Today that is documentation only
  (see "The three open items"); whether the app enforces it is Ian's call.
- **Done in task 4:** notes keyed by session id needed `backfillCustomerRecord` and the import validator to accept
  `ss_` keys. Today both delete or reject any non-numeric key.
- The fixes in `2026-09-22-fixes-LEDGER.md` touch the same file. Whichever lands second
  rebases, and re-runs the suite and the probe.
