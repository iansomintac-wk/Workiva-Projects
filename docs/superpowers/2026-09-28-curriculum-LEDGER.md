# Curriculum authoring — ledger

Umbrella spec: `specs/2026-09-28-curriculum-identity-design.md` (approved by Ian 2026-09-28).
Decisions are in spec §1. Each piece gets its own spec, plan and build.

| Piece | Spec | Session prompt | State | Self-checks after | Commit |
|---|---|---|---|---|---|
| 1 Stable identity | specs/2026-09-28-curriculum-identity-design.md §3–6 | plan: sessions/curriculum-piece-1-plan.md; build: sessions/curriculum-piece-1-build-1…6.md; review: sessions/curriculum-piece-1-review.md | **building (task 2 done)** on branch `curriculum-piece-1` (plans/2026-09-28-curriculum-piece-1.md). Build 2 can start (M3 ruled 2026-09-30) | **371/371** measured 2026-09-30 (guide 18/18) → 379 planned | task 2: `29689c4` |
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
- Notes keyed by session id need `backfillCustomerRecord` and the import validator to accept
  `ss_` keys. Today both delete or reject any non-numeric key.
- The fixes in `2026-09-22-fixes-LEDGER.md` touch the same file. Whichever lands second
  rebases, and re-runs the suite and the probe.
