# Subagent rules (connect-ready follow-ups run)

Carried over from the connect-ready run (2026-10-03), where they lived in the lead's temp folder and worked. The
lead's prompt names the worktree, the plan task and the log folder.

# Build subagent rules

- Work ONLY in the git worktree the lead names. All reads, writes, git there. Never push or merge. Use Edit/Write tools for file edits (compound shell commands with variables may be refused by the worktree guard).
- Read the follow-ups plan task the lead names, the finding it fixes in `docs/superpowers/evidence/connect-ready/T14-review.md`, the Global Constraints of `docs/superpowers/plans/2026-10-02-connect-ready.md` (Ian ruled **B1 (a)** and **B2 (a)**; do not reopen), the spec sections cited in `docs/superpowers/specs/2026-10-02-connect-ready-design.md`, and `docs/superpowers/evidence/connect-ready/research-vendor-apis.md` where vendor facts are involved.
- Follow the plan task exactly. If the plan is wrong against the code, make the smallest correct deviation and report it.
- Invoke Skill `superpowers:test-driven-development` first: tests first, see them fail, then code. Report how many tests failed before the fix.
- Node built-ins only, no package.json, no third-party package. Every new connector test file installs `connector/lib/test-net-guard.mjs`. No network calls to any external service; vendor calls only through a stubbed fetch.
- Unproven means unproven: never write that an adapter works with Gong/Gainsight. Say "tested on recorded-shape fixtures" and "unproven until `--check`". Every vendor constant carries its source URL and CONFIRMED/UNCONFIRMED from the research file; never guess a field name — make it config.
- Docs describing changed code (connector/CONTRACT.md, connector/CONNECT-GONG.md, connector/CONNECT-GAINSIGHT.md, the admin ask, config.example.json, any count in prose) change in the same commit.
- Never commit connector/config.json, proof.json, gainsight-tokens.json, sent-record.json, dry-run.jsonl, token.txt, *.lock, keys, or docs/research/internal/.
- The tracker html is huge: grep it, never read it whole.
- Send long output to files under the log folder the lead names (prefix with your task id) and read only summary lines.
- Before committing run: the task's check command, and `node --test connector/test/*.test.mjs` (file glob; the directory form fails on Windows). Do not edit the ledger.
- Commit message starts with the task id ("F-n:") and ends with the attribution lines the lead gives you.
- Reply in ≤10 lines: status, commit hash, exact check commands run with counts and exit codes, evidence log paths, any deviation and why.

# Checker rules

- Read-only: do not edit or commit. Same worktree. Review the named commit against its plan task, the finding in T14-review.md, the connect-ready Global Constraints, and the spec sections it cites.
- Check: every plan step done; tests not vacuous (would they fail if the behaviour broke?); new test files install the net guard; no forbidden files; Node built-ins only; vendor constants carry source URL + CONFIRMED/UNCONFIRMED and no guessed field names; no "works with Gong/Gainsight" wording; secrets never logged or printed; docs changed in the same commit; test count reconciles with the previous total.
- `installNetGuard()` registers its own `after()` asserting `blocked` is empty (connector/lib/test-net-guard.mjs:21-23) — a test file that calls it needs no separate after(); do not flag that.
- Do not flag the commit trailer the lead specified.
- You may run the task's unit tests with output to a file in the log folder; read only the summary.
- Reply ≤10 lines: verdict PASS or FAIL, each finding with file:line and severity (blocker/low).
