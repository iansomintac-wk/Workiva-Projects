# Session prompt: connect-ready run (the run)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/connect-ready-run.md and do it`
The instructions are everything below the line.

---

**Objective.** Build the approved design. The spec is
`docs/superpowers/specs/2026-10-02-connect-ready-design.md`; read it in full first.

It holds:
- Ian's rulings CR1-CR6, quoted verbatim (§1), and the defaults D1-D4 approved with them (§3.6)
- the measured baseline (§2)
- the vendor facts, proof model, adapters, write gate and commands (§3)
- tasks T-1 to T-14 (§4)
- the acceptance checks A-1 to A-9 (§5)
- what is out of scope (§6)

Do not reopen a ruling. If the code makes one impossible, stop and ask Ian.

This is "the run" half of the objective. It follows the global rule "one objective, two sessions".

**Where.**
- First confirm the spec is on `master`. It was committed on branch `worktree-connect-ready-talk`, and Ian merges
  it. If it is missing, stop and ask.
- Branch from `master` and work in a worktree.
- Never push to `main` or `master`, and never merge.

## Shape of the run

1. **Plan.**
   - Invoke `superpowers:writing-plans`. Hand the plan writing to a fresh subagent on the top model.
   - It writes `docs/superpowers/plans/2026-10-02-connect-ready.md` using the spec's task ids. Each task has ≤ 8
     steps, a check command and the expected output.
   - Then **stop for Ian's plan approval**.
2. **Build.** Take the tasks in spec order, **one at a time, never in parallel**:
   - A fresh build subagent (Sonnet unless the task needs design judgement; T-6 OAuth and T-9 write gate may use the
     top model) uses `superpowers:test-driven-development`: checks first, then code. It commits, and replies in
     ≤ 10 lines with status, commit, check-output summary and evidence path.
   - A fresh **checker** subagent (Sonnet) reviews that commit against the plan task and the spec section.
   - The lead **re-runs the check command itself** and records the measured result in the ledger.
3. **Review.**
   - After T-13, run the final whole-branch review (T-14) on the top model (`superpowers:requesting-code-review`).
   - Fix findings through the same build → checker loop.
   - Then **stop for merge**.

The lead never plans or builds in its own context. Logs go to files under `$CLAUDE_JOB_DIR/tmp/`, never into
context.

## Ledger

Create `docs/superpowers/2026-10-02-connect-ready-LEDGER.md` in the shape of
`docs/superpowers/2026-10-01-trim-and-integration-LEDGER.md`.
- Give one row per task: state, commit, check command, measured result, and any deviation with its reason.
- Give one row per A check, with the measured value.

If the lead's context grows large, write the ledger and a resume prompt under `docs/superpowers/sessions/`, then
end.

## Checks

- **Baseline first.** It was MEASURED on 2026-10-02 at `aced277`. Re-measure; don't trust these figures:
  - `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 473` → 473/473.
  - `node --test connector/test/*.test.mjs` → 43/43. Use the file glob; the directory form fails on Windows.
  - `node tools/connector-e2e.mjs` → scenarios 7/7 but **exit 1** (cleanup EPERM, spec §2). T-1 fixes this first.
  - `node tools/connector-demo.mjs` → exit 0.
  Send each output to a file and read only the summary lines. If self-checks or connector tests differ, stop before
  planning.
- After each task, run the task's check plus the connector tests, and the self-checks when the tracker changed, with
  `--expect` set to the new total. Every change to a total names its checks. A pass that ran zero checks is a harness
  failure.
- Every new connector test file installs `connector/lib/test-net-guard.mjs` (A-5).

## Rules

- **Grep the tracker; never read it whole.** Its header comment (first ~45 lines) holds the editing rules. Symbol
  names are stable; line numbers drift. T-3 is the only tracker task and changes no data shape (no schema bump).
- The connector stays Node built-ins only, no `package.json`, no third-party package.
- **Unproven means unproven.** No commit message, doc or ledger line says an adapter "works" with Gong or Gainsight.
  Say "tested on recorded-shape fixtures" and "unproven until `--check`". Every vendor constant carries its source
  URL and CONFIRMED / UNCONFIRMED from `docs/superpowers/evidence/connect-ready/research-vendor-apis.md`. If a needed
  fact is not there, research it (vendor's own page, cite the URL) or make it config; never guess a field name.
- **Change docs in the same commit** as the code they describe: CONTRACT.md, the runbooks, the admin ask,
  `config.example.json`, and any count in prose.
- Never commit `connector/config.json`, `proof.json`, `gainsight-tokens.json`, `sent-record.json`, `dry-run.jsonl`,
  `token.txt`, or any key. Never commit `docs/research/internal/`.
- **Send nothing to any external service.** No credentials exist; every vendor call in tests goes to a stubbed
  fetch.

## Stops (each one: push notification, then ask in the session)

- Plan approval.
- A ruling the code makes impossible, or a vendor fact the build needs that research cannot confirm and config
  cannot carry.
- The same fix failing twice.
- Any spend. **Paid runs: none.** The approved total is $0.
- Merge or push.

## Done means

T-1 to T-13 are committed and checked, T-14's findings are fixed or listed, A-1 to A-9 are recorded with measured
values. Then stop for Ian's merge call, with the branch name, a one-line summary, and the admin's next step: send
the updated admin ask, then on connection day run `node connector/server.mjs --setup`.
