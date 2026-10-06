# Session prompt: connect-ready follow-ups (the run)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/connect-ready-followups-run.md and do it`
The instructions are everything below the line.

---

**Objective.** Fix the low findings left from the connect-ready run. Ian chose this as the next task on 2026-10-05
("Connect-ready follow-ups"). There is no separate talk: the findings are already written and triaged, and the
plan approval stop is where Ian rules on scope.

**The spec is the review.** `docs/superpowers/evidence/connect-ready/T14-review.md` (F1..F23, each with defect,
failure scenario and recommended fix). F1-F6 are already fixed and merged. Read it in full first, then:
- the ledger `docs/superpowers/2026-10-02-connect-ready-LEDGER.md` (the T-14 row lists what was left);
- the connect-ready spec `docs/superpowers/specs/2026-10-02-connect-ready-design.md` (rulings CR1-CR6, defaults
  D1-D4; do not reopen any) and the plan's Global Constraints in `docs/superpowers/plans/2026-10-02-connect-ready.md`;
- `docs/superpowers/sessions/connect-ready-followups-subagent-rules.md` (rules every build and checker subagent
  reads first; they worked in the connect-ready run).

**In scope (all low):**
- Review findings F7, F8, F9, F10, F11, F13, F14, F15, F16, F17, F18, F20, F21, F22, F23.
- Checker lows from the T-14 fix batches (in the ledger's T-14 row): the stale-lock takeover race (crashed holder
  plus two waiters), lock release on a failed token write untested, and a `data.failures` entry carrying the
  duplicate code alongside other codes counting as sent (undocumented).
- F24 (found by the lead): `connector/lib/measure.mjs` 403 text states the transcript scope as fact; mark it "to
  confirm", as F5 did for the Gong runbook.

**Out of scope:** F19 ("sandbox" is self-declared; spec §3.4(1) by design, Ian did not reopen it). F12 (refuted).
Anything that needs a live tenant or credentials. Ian's rulings B1 (a) and B2 (a).

**Careful with F10 (OAuth `state`).** The research does not confirm Gainsight echoes `state`. The review says: do
not make it required. If the plan builds it, it must be optional (configured off by default, behaviour unchanged
when off), or the plan lists it as a question for Ian at plan approval.

**Where.**
- This prompt and the rules file were committed on branch `worktree-connect-ready-followups-handoff` (based on
  `master` at `55e3c69`). If they are not on `master` when you start, branch from that hand-off branch so they
  travel with the work; if neither has them, stop and ask.
- Work in a worktree. Never push to `main` or `master`, and never merge.

## Shape of the run

1. **Plan.** Invoke `superpowers:writing-plans` and hand the writing to a fresh top-model subagent. It writes
   `docs/superpowers/plans/2026-10-05-connect-ready-followups.md`: tasks grouped by file seam (e.g. auth/lock,
   push, check/setup/cli, measure, health), each task naming the finding ids it closes, ≤ 8 steps, a check
   command and its expected output. Any finding it recommends NOT fixing is listed with the reason for Ian.
   Then **stop for Ian's plan approval**.
2. **Build.** Tasks in plan order, **one at a time, never in parallel**: a fresh Sonnet build subagent (top model
   only where the plan says design judgement is needed, e.g. the lock race), TDD; then a fresh Sonnet checker;
   then the lead re-runs the check command itself and records the measured result in the ledger. Haiku is not
   used for transcription here: in the connect-ready run a Haiku builder invented fixtures instead of copying the
   plan (T-4, reverted).
3. **Review.** Final whole-branch review on the top model (`superpowers:requesting-code-review`), fixes through
   the same loop, then **stop for merge**.

The lead never plans or builds in its own context. Logs go to `$CLAUDE_JOB_DIR/tmp/`, never into context.

## Ledger

Create `docs/superpowers/2026-10-05-connect-ready-followups-LEDGER.md` in the shape of the connect-ready ledger:
one row per task (state, commit, finding ids, check command, measured result, deviation), a stops table, and a log.
If the lead's context grows large, write the ledger and a resume prompt under `docs/superpowers/sessions/`, then end.

## Checks

- **Baseline first.** Measured by the previous lead on `master` at `c6b7f2b` on 2026-10-03. Re-measure; don't
  trust these figures:
  - `node --test connector/test/*.test.mjs` → 140/140.
  - `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475` → 475/475.
  - `node tools/connector-e2e.mjs` → 7/7, exit 0.
  - `node tools/connector-demo.mjs` → exit 0.
  Send each output to a file and read only the summary lines. If they differ, stop before planning.
- After each task: the task's check plus the connector tests; the self-checks too if the tracker changed. Every
  change to a total names its tests.

## Rules

- The connector stays Node built-ins only, no `package.json`.
- Unproven means unproven: "tested on recorded-shape fixtures", "unproven until `--check`".
- Docs change in the same commit as the code they describe.
- Never commit `connector/config.json`, `proof.json`, `gainsight-tokens.json`, `sent-record.json`, `dry-run.jsonl`,
  `token.txt`, `*.lock`, any key, or `docs/research/internal/`.
- Send nothing to any external service. Read-only vendor docs pages may be fetched to confirm a fact; cite the URL.
- Gotchas from the last run: `git revert` rejects `-q`; `git merge` reads no message from stdin (use `-F <file>`);
  the studio guard blocks `git checkout -- <path>` (use `git restore <path>`); the worktree guard refuses compound
  shell lines that compute paths or run git inside loops (split them).

## Stops (each one: push notification, then ask in the session)

Plan approval; a ruling the code makes impossible; the same fix failing twice; any spend (approved total: $0);
merge or push.

## Done means

Every in-scope finding is fixed and checked, or listed with Ian's decision. The final review's findings are fixed
or listed. Baseline checks re-measured at the end. Then stop for Ian's merge call with the branch name and a
one-line summary.
