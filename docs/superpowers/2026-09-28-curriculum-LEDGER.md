# Curriculum authoring — ledger

Umbrella spec: `specs/2026-09-28-curriculum-identity-design.md` (approved by Ian 2026-09-28).
Decisions are in spec §1. Each piece gets its own spec, plan and build.

| Piece | Spec | Session prompt | State | Self-checks after | Commit |
|---|---|---|---|---|---|
| 1 Stable identity | specs/2026-09-28-curriculum-identity-design.md §3–6 | sessions/curriculum-piece-1-plan.md | spec approved; needs plan | | |
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

## Rules carried between sessions

- A new check counts only once it has been shown failing against a mutation of
  **production** code, and its setup must assert that it evidenced more than 0 criteria. The
  spec session's first probe run was green only because the seed had no evidence.
- Line numbers drift with each commit. Grep for the symbol.
- README.txt and VALIDATION.txt quote the self-check count. A task that adds checks updates
  both files in the same commit.
- Schema changes keep the export-before-upgrade discipline (piece 1 plan task 1 finds out
  how that is enforced today).
- The fixes in `2026-09-22-fixes-LEDGER.md` touch the same file. Whichever lands second
  rebases, and re-runs the suite and the probe.
