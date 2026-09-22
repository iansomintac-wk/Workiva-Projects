# Session prompt — Fix 1 (plan + execute)

Paste everything below this line as the first message of a fresh Claude Code session in this repo.

---

Work on **Fix 1: the backfill note raises a false Loss of Champions risk**, and only that.

Context to load (nothing else up front):
1. `docs/superpowers/2026-09-22-fixes-LEDGER.md`: baselines, run order, rules
2. `docs/superpowers/specs/2026-09-22-fix-1-backfill-false-risk.md`: the spec, with its target metrics
3. The editing rules in the header comment of `osm-book-of-business-tracker-1.0.html`
   (the first ~45 lines). **Don't read the tracker whole** (25k lines). Grep for the
   symbols the spec names and read only those sections.

How to run it:
- Planning happens in this session, using `superpowers:writing-plans`. Write the plan to
  `docs/superpowers/plans/2026-09-22-fix-1.md`. Tasks have 8 steps or fewer. Show me the plan and wait
  for my OK before executing.
- Execute with `superpowers:subagent-driven-development`: one fresh implementer
  sub-agent per task on **Sonnet**, and a **Sonnet** reviewer per task. The planner (this
  session) doesn't write the implementation.
- Tests first (`superpowers:test-driven-development`): add the new self-check, see
  it fail, then implement.
- Logs go to files, and only summary lines come back into context:
  - `node tools/selfcheck.mjs --seed demo-seed.js > $TEMP/sc.log 2>&1; tail -2 $TEMP/sc.log`
  - `node tools/sim/run-field-test.mjs --out $TEMP/m.json > $TEMP/ft.log 2>&1; cat $TEMP/m.json`
- Before claiming done, use `superpowers:verification-before-completion`: the spec's target
  metrics are hit, every self-check passes, and **no other fix's metric moved**
  (compare against the ledger baseline).

Finish:
- Update the self-check count in README.txt / VALIDATION.txt if it changed (same commit).
- Fill in this fix's row in the ledger (state, self-checks after, full metric line).
- Show me the diff summary and ask before committing. Then stop. Don't start the next fix.
