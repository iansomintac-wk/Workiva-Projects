# Session prompt — Curriculum piece 1: follow-ups M1r and M2r (the run)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/curriculum-piece-1-followups.md and do it`
The instructions are everything below the line.

---

Build the two editor follow-ups from the piece-1 review, **only if Ian has ruled them**. Model: Sonnet for the
implementer and checker subagents, one at a time, never in parallel. You are the lead: don't plan or build in your
own context.

**Gate, first:** open `docs/superpowers/2026-09-28-curriculum-LEDGER.md`, section "Decisions made". Build M1r only if
it records Ian's verbatim "yes" for M1r, and the same for M2r. If neither is ruled, stop and say so. Don't treat the
lead's recommendation in "Decisions pending" as a ruling.

Where: branch from `master` if `curriculum-piece-1-fixes` has been merged into it, otherwise from
`curriculum-piece-1-fixes` (`89fdd52` or later). Make a new branch `curriculum-piece-1-followups` in a worktree.

Load only: the ledger (the sections above, plus "Review fixes"), the M1r/M2r text in
`docs/superpowers/evidence/curriculum-piece-1-review.md`, and the two briefs:
`docs/superpowers/sessions/curriculum-subagent-brief.md` (implementer protocol) and
`docs/superpowers/sessions/curriculum-checker-brief.md` (checker protocol). Hand each subagent its brief's path;
don't paste the protocol.

Baseline first, measured by you: suite `--seed demo-seed.js --expect 387` reads 387/387, and the guide reads 18/18.

**M1r: confirm before a deliverable edit drops evidence.**
Today, clearing a deliverable's input (to retype it) or removing its row drops its id inside
`setSessionDeliverables`. Retyping mints a new id, so evidence on every account is orphaned with no prompt. Required:
when an edit in the curriculum editor would drop a deliverable id that has evidence on at least one account, confirm
first and name the count (reuse or extend `sessionDeleteImpact`, which counts per session today). Cancel leaves the
template and evidence unchanged. With zero evidence, no prompt. Rewording keeps the id (A2), so a reword must not
prompt. Entry points: the `data-cur-dl` input handler, the row-remove button, `setSessionDeliverables`.
The check stubs `window.confirm`: drop an evidenced deliverable (assert ticked > 0) and cancel, so the id and
evidence are kept; confirm, so it is removed and orphaned as today; drop an unevidenced one, so there is no prompt;
reword, so there is no prompt.

**M2r: bulk paste.**
The "one per line" textarea became one input per deliverable, so a pasted list becomes one deliverable. Required:
text with newlines added through `addDeliverableRow` (and a paste into a deliverable input) splits into one
deliverable per non-empty trimmed line, each with a new unique id. Existing deliverables keep their ids, order and
evidence. The check pastes `"a\nb\n\nc"` into a session that has evidenced deliverables (assert ticked > 0): it
expects 3 new deliverables with unique ids, unchanged prior ids, and evidence intact.

Order: M1r, then M2r, whichever is ruled. For each: implementer (red first, fix, production mutation, `cmp`, count
bump 387 → 388 → 389 in README, VALIDATION and CHANGELOG, VALIDATION block, ledger lines under
`## Follow-ups (M1r, M2r)`), then a fresh checker, then you re-run the suite yourself. If the same fix fails twice,
stop and ask Ian.

Finish: re-run the suite, the guide, the spec probe (concatenate `demo-seed.js` +
`docs/superpowers/specs/2026-09-28-curriculum-identity-probe.js`, run `node tools/inspect.mjs
osm-book-of-business-tracker-1.0.html --seed <that file> --view dashboard --out <dir>`, and read the `seeded …`
line), and `tools/migration-dryrun.mjs --from 11` and `--from 12`. Record them in the ledger and update the piece-1
row. The editor is UI, so file a capture of the confirm and of a bulk paste for Ian's look call (route it to him; don't
judge it yourself). Send a push notification, then stop. Merging is Ian's call.
