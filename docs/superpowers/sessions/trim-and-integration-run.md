# Session prompt: trim + Gong/Gainsight connector run (the run)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/trim-and-integration-run.md and do it`
The instructions are everything below the line.

---

**Objective.** Build the approved design. The spec is
`docs/superpowers/specs/2026-10-01-trim-and-integration-design.md`; read it in full first.

It holds:
- Ian's rulings R1-R10, quoted verbatim
- the measured baseline (§2)
- the architecture and contract (§3)
- Stage A tasks A1-A6 (§4)
- Stage B tasks B0-B4 and Stage C tasks C-1 to C-9 (§5)
- the acceptance checks K1-K10 (§6)
- what is out of scope (§7)

Do not reopen a ruling. If the code makes one impossible, stop and ask Ian.

This is "the run" half of the objective. It follows the global rule "one objective, two sessions".

**Where.**
- First confirm the spec is on `master`. It was committed on branch `trim-audit`, and Ian merges it. If it is
  missing, stop and ask.
- Branch from `master` and work in a worktree.
- Never push to `main` or `master`, and never merge.

## Shape of the run

1. **Plan.**
   - Invoke `superpowers:writing-plans`. Hand the plan writing to a fresh subagent on the top model.
   - It writes `docs/superpowers/plans/2026-10-01-trim-and-integration.md` in three stages, using the spec's task
     ids. Each task has ≤ 8 steps, a check command and the expected output.
   - Then **stop for Ian's plan approval**.
2. **Build.** Take the tasks in spec order, **one at a time, never in parallel**:
   - A fresh build subagent (Sonnet unless the task needs design judgement) uses
     `superpowers:test-driven-development`: checks first, then code. It commits, and replies in ≤ 10 lines with
     status, commit, check-output summary and evidence path.
   - A fresh **checker** subagent (Sonnet) reviews that commit against the plan task and the spec section.
   - The lead **re-runs the check command itself** and records the measured result in the ledger.
3. **Stage boundaries.**
   - After A: report the new check total and the shipped-file bytes (K1-K4).
   - After B4: **stop for Ian** with the admin-ask doc and the fake-data demo (R9).
   - After C-8: file the decoration captures and ask for every look call in one batch (R5).
4. **Review.**
   - After the last buildable task, run the final whole-branch review on the top model
     (`superpowers:requesting-code-review`).
   - Fix findings through the same build → checker loop.
   - Then **stop for merge**.

The lead never plans or builds in its own context. Logs go to files under `$CLAUDE_JOB_DIR/tmp/`, never into
context.

## Ledger

Create `docs/superpowers/2026-10-01-trim-and-integration-LEDGER.md` in the shape of
`docs/superpowers/2026-10-01-graduation-plan-LEDGER.md`.
- Give one row per task: state, commit, check command, measured result, and any deviation with its reason.
- Give one row per K check, with the measured value.

If the lead's context grows large, write the ledger and a resume prompt under `docs/superpowers/sessions/`, then
end.

## Checks

- **Baseline first.** It was MEASURED at 437/437 on 2026-10-01 at `57f263b`. Re-measure it; don't trust that
  figure:
  `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 437`.
  Send the output to a file and read only the last 2 lines. If it isn't 437/437, stop before planning.
- After each task, run the same command with `--expect` set to the new total. Every change to the total names its
  checks. A pass that ran zero checks is a harness failure.
- After A1, the suite lives in `tools/selfchecks.js`. The command stays the same, and the docs say so in the same
  commit.
- Connector tasks also run their Node contract tests, and C-7 runs the end-to-end scenario.
- The spec's probe files (`docs/superpowers/evidence/2026-10-01-talk-probes/`) are the recipe for re-measuring any
  §2 number a task touches. B0 re-runs `b0-run.mjs` **headed** before B1.

## Rules

- **Grep the tracker; never read it whole** (about 1.79 MB, 28k lines). Its header comment (first ~45 lines) holds
  the editing rules. Symbol names are stable; line numbers drift.
- Header rule 4: any data-shape change gets a new `CURRENT_SCHEMA_VERSION` and a `migrateData` step. That is C-1
  only (15→16).
- **Change docs in the same commit** as the code they describe: header rules, README, VALIDATION, CHANGELOG, and
  any count in prose.
- Never commit `docs/research/internal/`. Never commit `connector/config.json` or any key.
- **Send nothing to any external service.** The connector runs fake adapters only. The single exception is C-9's
  one AI call, made with a key Ian supplies, at Ian's stop.

## Stops (each one: push notification, then ask in the session)

- Plan approval.
- B0 blocked in a headed browser. The fallback changes where the book's storage lives, so it is Ian's call.
- After B4: the admin-ask doc and the demo.
- A6 (T4): only once Ian has re-saved the three pre-1.0 exports listed in §4, or said they don't matter. If there
  is no answer by the end of Stage A, skip it and record it as pending.
- C-8: the decoration look calls, batched.
- C-9: Ian supplies a sanctioned AI key (R1). Without it, C-9 is skipped and recorded as pending; the browser AI
  stays as the fallback.
- The same fix failing twice.
- Any spend. **Paid runs: none** beyond C-9's single AI call on Ian's own key, so the approved total is $0 from the
  run.
- Merge or push.

## Done means

Every buildable task is committed and checked, K1-K10 are recorded with measured values, any gated task is marked
pending with its reason, and the final review's findings are fixed or listed. Then stop for Ian's merge call, with
the branch name and a one-line summary.
