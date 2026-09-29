# Session prompt — Curriculum piece 1: stable identity (PLAN ONLY)

Paste everything below this line as the first message of a fresh Claude Code session in this repo.

---

Write the implementation plan for **curriculum authoring piece 1: stable identity**,
and only that. This session plans. It does not build.

Where the work is: the spec was committed on branch `worktree-curriculum-identity-spec`
(`3c76a56` and the handoff commit after it), not on `master`. If that branch has been
merged, work from `master`. If it hasn't, branch from it. Either way, before planning,
confirm that `docs/superpowers/specs/2026-09-28-curriculum-identity-design.md` is present.

Context to load (nothing else up front):
1. `docs/superpowers/2026-09-28-curriculum-LEDGER.md`: the four pieces, their state, and the rules
2. `docs/superpowers/specs/2026-09-28-curriculum-identity-design.md`: the approved spec.
   §4 is the design and §5 lists the acceptance checks A1–A7.
3. The editing rules in the header comment of `osm-book-of-business-tracker-1.0.html`
   (the first ~45 lines). **Don't read the tracker whole** (25k lines). Grep for the
   symbols the spec names (`outcomeCriteriaFor`, `materializeOutcomeCriterion`,
   `authoredRunbookFor`, `readSessionNote`, `function curKey`, `CURRENT_SCHEMA_VERSION`,
   `prepareBookData`) and read only those sections. The spec's line numbers are as of
   `d8266be` and drift with each commit.

Before writing any task, measure the baseline. The spec *reads* several figures, and
a figure you read is a claim, not a fact:
- Suite: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 369 > $TEMP/sc.log 2>&1; tail -2 $TEMP/sc.log`
- Probe: concatenate `demo-seed.js` + `docs/superpowers/specs/2026-09-28-curriculum-identity-probe.js`
  into one seed file under `$TEMP`, then
  `node tools/inspect.mjs osm-book-of-business-tracker-1.0.html --seed <that file> --view dashboard --out $TEMP/probe > $TEMP/probe.log 2>&1`
  and read only the `seeded …` line. Expected: `delete_session2` reworded `[0,6]` on all
  6 Carbon accounts, and `rename_s1_runbook` `["authored","standard"]`. If the numbers
  differ, say so before planning.

The spec leaves three things open, and plan task 1 must settle them with evidence:
- **Reproduce I5** (spec §3b). Its figures come from `VALIDATION.txt` and haven't been re-run.
- **Measure §3d:** do session notes shift when a session is deleted? Also grep every other
  per-account read keyed by session number. Anything positional that the spec §4d doesn't
  cover goes back to me as a spec amendment. Don't quietly add it to the plan.
- **Find the "export before you upgrade" mechanism** Phase A used. Grep found no
  in-app prompt. Report what enforces it, if anything, and let me decide whether piece 1
  adds one.

How to write the plan:
- Use `superpowers:writing-plans`. Write the plan to
  `docs/superpowers/plans/2026-09-28-curriculum-piece-1.md`.
- Tasks have 8 steps or fewer. Each task says which acceptance check(s) from spec §5 it
  satisfies, the production mutation that must turn each new check red (house rule:
  never a mutation of the check's own body), and the liveness assertion that its setup
  evidenced more than 0 criteria.
- Order: task 1 is measurement only (above). Then ids and the single writer
  (`setSessionDeliverables`), id-first matching (pass 0), notes and runbook keyed by
  session id, the editor's per-row inputs and the session-delete confirmation, the
  12→13 migration with a dry-run mode for 12→13, and export/import (A7).
- For each task, name the model. Implementers and re-reviews run on Sonnet; the top model
  is only for design judgement.
- The per-row editor is UI. Its task invokes `frontend-design` for the layout only, and
  keeps it minimal (spec §4b). The authoring UI's look is piece 3.
- Say which session builds which task. One plan task per build session, unless two small
  tasks touch the same area and suit the same model. Decide that in the plan, never mid-build.
- Write one session prompt file per build session under `docs/superpowers/sessions/`, in the
  same shape as this one.

Finish:
- Update the ledger: piece 1 → `planned`, with the plan path, the measured baseline
  (suite count and probe numbers), and the answers to the three open items.
- Show me the plan and ask before committing. Then stop. Don't start building.
