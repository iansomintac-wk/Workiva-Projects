# Curriculum piece 1 — whole-branch review (2026-09-30)

Branch `curriculum-piece-1` at `58f3bb8` against `master` `85672e6`. Review only; nothing fixed.
Seats: one Opus reviewer subagent (requesting-code-review template), one `/code-review high`, and the
lead's own re-measurement, A1–A7 audit and one mutation re-run.

**Verdict: with fixes.** No critical defect. One regression needs Ian's ruling **before merge**, because the
migration writes ids into real books permanently (R1). Fix list for the Sonnet follow-up:
`sessions/curriculum-piece-1-fixes.md`.

## Re-measured by the lead (this session, at `58f3bb8`)

| What | Claimed (VALIDATION / ledger) | Measured now |
|---|---|---|
| Suite `--seed demo-seed.js --expect 379` | 379/379 | **379/379**, exit 0 |
| Guide `--fn runGuideSelfChecks --expect 18` | 18/18 | **18/18**, exit 0 |
| `migration-dryrun --from 11` | exit 0, 57→56, 0 lost, notes changed 1 (unexplained 0) | **same**, exit 0 |
| `migration-dryrun --from 12` | exit 0, 6 accts, 22 evidenced, 21/21, 45 moved, 0 lost, idempotent | **same**, exit 0 |
| Spec probe (demo seed + probe) | Carbon 66; delete_session2 reworded [0,0], orphaned [0,1] ×6, 6 detached; controls 0; runbook authored→authored | **same** |
| Tracker blob SHA-256 | `ad0c1fdd…` | **`ad0c1fdd…`** (LF blob; see D1) |

## A1–A7 audit (production mutation recorded + setup asserts > 0 evidenced)

| Check | Production mutation in VALIDATION/ledger | Evidence guard in code |
|---|---|---|
| A1 | pass 0 block deleted → 358/373 | `fx.ticked > 0` |
| A2 | reword mints new id in `setSessionDeliverables` → 371/373 | `fx.ticked > 0` |
| A3 | `rbLibraryIdIndex` lookup deleted in `authoredRunbookFor` | `fx.ticked > 0 && indexed > 0` |
| A4 | `sessionNoteKey` → `String(sessionNumber)` → 375/377 | `fx.ticked > 0 && kept > 0` |
| A5 | v12 stamping block commented → 377/378 (`stamped:0`) | `evidencedBefore > 0 && stamped > 0` in `_a5Invariant` |
| A6 | `data-cur-dl` handler restored to textarea split → 370/371 | **none** — structural scan + editor actions on an empty template; liveness is `scanLive`/`sampleLive` (M5 below) |
| A7 | replacer in `serializeBook` → A7 + v99 red; reject made unreachable → `threw:false` | `ticked > 0` |

**Mutation re-run by the lead:** A3 — deleted
`if(sessionId){ const byId = rbLibraryIdIndex()[sessionId]; if(byId) return byId; }` on a scratch copy.
Predicted 378/379 with only A3 red. Got: exit 1, **378/379**, only
`identity A3 … {"ticked":11,"indexed":36,"before":"authored","after":"standard","mod":"Carbon"}` — identical to
VALIDATION's recorded red. Worktree untouched.

## Findings, ranked

Tag: **V** = verified by running or by the lead's own trace; **T** = traced in code by a reviewer, not run;
**P** = plausible, reasoned only.

### Important

**R1. Turning on CSRD orphans every evidenced criterion (regression; needs Ian's ruling before merge). V**
`defaultDeliverableId(key,…)` slugs the template key, so `Sustainability (CSRD)` deliverables get
`dl_sustainability_csrd_*` ids, never the base `dl_sustainability_*`. Stamped records skip passes 1–2, so
nothing re-attaches. Reviewer probe (`tmp/rv/branch-probe.log` vs `master-probe.log`), Sustainability
account, 11 evidenced, flag on: **branch** 0 in curriculum / 11 orphaned / 22 rows; **master** 11 / 0 / 11.
Flag off restores; ticks made while on are orphaned in turn. `outcomeEvidence` is not cleared by the toggle,
so this is not an intended reset (session notes *are* cleared, on master too — pre-existing).
Same-text overlap measured by `/code-review`: 9 of 15 Sustainability (CSRD) and 7 of 12 Sustainability +
Carbon (CSRD) deliverables equal the base at the same position.
Options for Ian: (a) a CSRD default deliverable whose text equals the base at the same position reuses the
base's deterministic id (touches c2a); (b) accept, and say so in the CHANGELOG and the toggle's toast/confirm.
Module switch behaves the same (branch 0/11 kept, master 7/11) but already confirms and resets — defensible.

**R2. Duplicate ids inside one curriculum pass import and misplace evidence. V** (reviewer, via
`prepareImportedData`). `assertSessionTemplate` checks `deliverableIds` uniqueness only within one session.
Same deliverable id in sessions 2 and 5: ticking session 5 dedupes onto the stamped record, pass 0 places it at
the first occurrence → session 2 shows evidenced "reworded since" with session 5's text; session 5 stays
unticked. Same session id twice: notes on session 3 also show on session 2; `sessionDeleteImpact` reports the
first. **Duplicates across curricula must stay allowed**: renaming the Sustainability module re-adds
`Sustainability (CSRD)` via `applyDataBackfills` with the same deterministic ids (`sameFirstId: true`).
Fix: per curriculum key, reject a repeated session id or deliverable id anywhere in that key; not across keys.
New check red on both cases, with a production mutation proof.

**R3. Archive restore never runs v12→13. T** (lead read `prepareArchiveData`). The shell is `defaultData()`
→ `schemaVersion: CURRENT_SCHEMA_VERSION` (13), so `migrateData` skips the step for a pre-piece-1 archive:
criteria stay unstamped, notes numeric. That account keeps master's positional behaviour — a session delete
re-attaches evidence by index (A1's bug) and `readSessionNote` falls back to `notes['2']`. The same shape
already skipped v11→12 before this branch, so the defect is older; piece 1 raises its cost.
Fix: carry the archive's own `schemaVersion` (or stamp archives with one on export and treat a missing one as
12) into the shell before `prepareBookData`. Needs a check with a v12-shaped archive record.

**R4. Unplaced v12 orphans still go through the positional passes. P** (`/code-review`).
`matchStoredCriteria`: records the migration could not place stay unstamped and so remain eligible for passes
1–2 on every render. After a delete/reorder, an orphan `{sourceSession:3, sourceIndex:1, sourceCount:4}` can
match whichever session now sits at 3 with 4 deliverables, showing its evidence on an unrelated deliverable.
The real seed has such a record (`--from 12`: 22 evidenced, 21 placed). Fix: after v13, freeze unstamped
records as orphans (or mark them `unplaced` in the migration). Prove with a check that deletes a session ahead
of the orphan's old number.

**R5. Session reorder re-labels logged calls (depends on M1). T** (both seats).
`moveSessionTemplate` is new; activities still match on `a.sessionNumber`. Moving session 3 up makes the old
session 3 show "done" from session 2's call, `nextOpenSessionNumber` skips it, and `toggleDeliverableEvidence`
stamps that activity's id onto the other session's evidence. The ledger records M1 for delete only, and the
CHANGELOG ("stay with the session, not the position") omits calls. Not a defect to fix here: **fold reorder
into Ian's M1 ruling**; until then the CHANGELOG must say calls stay positional.

### Minor

- **M1r. Removing or clearing a deliverable orphans evidence with no prompt.** Clearing an input to retype it
  drops the id; retyping mints a new one, so evidence never returns and every account gets an unevidenced
  duplicate. Spec asks for confirmation only on session delete — suggestion: reuse `sessionDeleteImpact`
  per deliverable. **T**
- **M2r. Bulk entry lost.** The "one per line" textarea became a single-line input; a pasted list becomes one
  deliverable. Design call; splitting pasted newlines in `addDeliverableRow` would restore it. **T**
- **M3r. Legacy `Both` / `Both (CSRD)` keys get random session ids.** `ensureTemplateIds` runs in
  `migrateData` before `applyDataBackfills` renames them; no `DEFAULT_SESSION_TEMPLATES['Both']`, so ids are
  `hexId('ss_')` and `rbLibraryIdIndex` never matches → A3's guarantee silently fails for those books. **P**
- **M4r. v12→13 resolves curricula before backfill adds missing CSRD keys** (`migrationCurriculumFor`). A v12
  book with a CSRD account but no CSRD key gets base ids stamped; at runtime it resolves to CSRD defaults →
  permanent orphans. Unlikely (saved books carry the keys). **P**
- **M5r. Check quality.** c2a's "deterministic ids" half compares `stampDefaultTemplateIds` with the same
  `defaultDeliverableId` it calls — true by construction (idempotence half is real). A6 has no evidence guard;
  acceptable for a structural check, but its runtime half asserts only length/uniqueness, not that a reword
  keeps the id (A2 covers that). **T**
- **M6r. `sessionNoteKey` rebuilds the template set per call** via `getSessionTemplate` → O(n²) per session
  plan (12 sessions → 144 sanitizations) and a rebuild per account in portfolio signals. Pass `tpl.id` in. **T**
- **M7r. Duplicate logic.** v11 step hard-codes `/^ss_[a-z0-9_]+$/` instead of `SESSION_ID_RE`; the v12→13
  set builder re-implements `safeSessionTemplateForRender`'s alignment check. **T**

### Docs

- **D1. The SHA/CRLF "correction" is wrong. V** (lead: `git cat-file -p <rev>:tracker | tr -cd '\r' | wc -c`
  → **0** at master and HEAD; `wc -l` → 25,179 / 25,979). The ledger's "25,179 CR lines" and VALIDATION's
  "blob carries CRLF" wording mistake line counts for CR counts. `ad0c1fdd…` is the **LF blob**; this
  checkout (autocrlf=true) has a CRLF working tree with a different hash. Restore the "LF blob" wording in
  VALIDATION.txt and correct ledger task 6.
- **D2. CHANGELOG "379 self-checks (was 378)" should say was 369. V** (both seats; the diff adds 10 `check(`).
- **D3.** CHANGELOG must name the R5 exception (calls stay positional) unless M1 is ruled first.

### Reviewed and kept

- The v11→12 `ss_`-key skip (ledger's "unplanned production change") is safe: a real v11 book can't hold `ss_`
  keys (backfill v48 deleted non-numeric keys) and v12→13 re-runs are idempotent. Keep it.
- Single writer `setSessionDeliverables` enforced by A6's scan; pass 0 never falls through for stamped records;
  dedupe by deliverable id; import rejects malformed ids rather than re-minting; A7 uses a random id.

### Retracted by the lead

- I first added "CSRD toggle also hides 8 → 0 session notes". Wrong: the `#csrd-toggle` handler clears
  `c.sessionNotes` on master too; the reviewer's probe set `reportsCSRD` directly, bypassing the handler.

## Decisions for Ian (new from this review)

- **R1** CSRD ids: (a) same-text CSRD deliverables share the base id / (b) accept and disclose. **Ruled (a), 2026-09-30** ("Let's go A"; ledger, "Decisions made").
- **R5** fold session reorder into M1 (activities), or ship reorder with the CHANGELOG caveat.
- **M1r/M2r** deliverable-removal confirmation; restore bulk paste — yes/no each.
