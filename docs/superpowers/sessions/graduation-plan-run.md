# Session prompt: Graduation Plan run (step 3 of 4, the run)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/graduation-plan-run.md and do it`
The instructions are everything below the line.

---

**Objective.** Build the approved Graduation Plan design: goals → gates → One Document. The spec is
`docs/superpowers/specs/2026-10-01-graduation-plan-design.md`. Read it in full first. It holds Ian's rulings
R1-R12, the data model, the flows, the 7-task split and the acceptance checks A1-A8. Do not reopen a ruling; if
the code makes one impossible, stop and ask Ian.

This is "the run" half of the objective. It follows the global rule "One objective, two sessions".

**Where.**
- First confirm the spec is on `master`. It was committed on branch `worktree-graduation-plan-design`, and Ian
  merges it. If the spec is missing, stop and ask.
- Branch from `master` and work in a worktree.
- Never push to `main`/`master`, and never merge. The run ends by stopping for Ian's merge call.

## Shape of the run

1. **Plan.**
   - Invoke `superpowers:writing-plans`. Hand the plan writing to a fresh subagent on the top model (design
     judgement). It writes `docs/superpowers/plans/2026-10-01-graduation-plan.md` with the spec's 7 tasks, each
     ≤ 8 steps, each with its check command and expected output.
   - Then **stop for Ian's plan approval** (push notification, then ask in the session).
2. **Build.** Take the tasks in order, **one at a time, never in parallel**:
   - A fresh build subagent (Sonnet unless the task needs design judgement) uses
     `superpowers:test-driven-development`: self-checks first, then code. It commits, and replies in ≤ 10 lines:
     status, commit, check-output summary, evidence path.
   - A fresh **checker** subagent (Sonnet) then reviews that commit against the plan task and the spec section,
     and reports in ≤ 10 lines.
   - The lead **re-runs the check command itself** and records the result in the ledger.
3. **Review.** After task 7, run the final whole-branch review on the top model
   (`superpowers:requesting-code-review`). Fix findings through the same build → checker loop. Then **stop for
   merge**.

The lead never plans or builds in its own context. Logs go to files under `$CLAUDE_JOB_DIR/tmp/`, never into
context.

## Ledger

Create `docs/superpowers/2026-10-01-graduation-plan-LEDGER.md` in the shape of
`docs/superpowers/2026-09-28-curriculum-LEDGER.md`. Give one row per task: state, commit, check command, measured
result, and any deviation from the spec with its reason. The ledger is the memory, not the transcript. If the
lead's context grows large, write the ledger and a resume prompt under `docs/superpowers/sessions/`, then end; a
fresh run resumes from the ledger.

## Checks

- **Baseline first** (MEASURED 389/389 on 2026-10-01 at `828e354`; re-measure, don't trust it):
  `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 389`
  Send output to a file and read only the last 2 lines. If it isn't 389/389, stop and say so before planning.
- After each task: the same command, with `--expect` raised to the new total. A pass that ran zero checks is a
  harness failure, not a pass.
- Task 1 adds `--from 13` to `tools/migration-dryrun.mjs` and must show A2.
- Task 7's scenario seed and headless run must show A3-A8. Each acceptance check is recorded in the ledger with the
  measured value, not "passes".
- The spec's probe recipe (appendix) is how to re-measure §8 numbers if a task touches them.

## Rules

- **Grep the tracker; never read it whole** (about 1.6 MB, about 25k lines). Its header comment (first ~45 lines)
  holds the editing rules. The spec's symbol names are stable; its line numbers drift.
- Follow the existing patterns: `CURRENT_SCHEMA_VERSION`, the `migrateData` chain, normalisers like
  `normalizeGradReview`, `SIGNAL_DEFS` entries, the `HANDOFF_IN_FIELDS` registry, and the Gainsight to-do queue.
- **Change docs in the same commit** as the code they describe (README, CHANGELOG, any count in prose).
- Never commit `docs/research/internal/`.
- **Do not design around the AI/data policy (G01)**; it is Ian's, in step 4. This build sends nothing to any
  service.
- FR and GRC gate defaults stay **empty**. Do not invent their content.

## Stops (each: push notification, then ask in the session)

- Plan approval.
- Merge or push.
- The same fix failing twice.
- Any spend. **Paid runs: none.** This build needs no paid API calls; the approved total is $0.
- A decision only Ian can make (e.g. a ruling that turns out unbuildable).

Batch any look calls (screenshots of the goal panel, graduation confirm and Settings block) and file them for Ian
at the end of the build stage. Keep building what doesn't depend on them.

## Done means

All 7 tasks are committed and checked, A1-A8 are recorded in the ledger with measured values, and the final
review's findings are fixed or listed. Then stop for Ian's merge call, with the branch name and the one-line
summary.
