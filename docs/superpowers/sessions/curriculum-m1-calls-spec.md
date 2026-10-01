# Session prompt — Curriculum M1: logged calls follow their session (the talk: brainstorm + spec)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/curriculum-m1-calls-spec.md and do it`
The instructions are everything below the line.

---

Brainstorm **M1** with me and turn it into a spec. **No code in this session.** Ian is in the conversation; this is
the talk, and the run gets its own session afterwards.

Why: piece 1 made criteria, notes and runbooks follow their session by id. Logged calls still match by
`activity.sessionNumber`. Deleting Carbon session 2 moves **32 of 38** session-linked calls to the wrong session
(measured 2026-09-30, plan session). Review finding **R5**: the new `moveSessionTemplate` reorder does the same
silently. Moving session 3 up makes the old session 3 show "done" from session 2's call, `nextOpenSessionNumber`
skips it, and `toggleDeliverableEvidence` stamps that call's id onto the other session's evidence. Today the CHANGELOG
says calls stay positional.

Load only:
1. `docs/superpowers/2026-09-28-curriculum-LEDGER.md` ("The three open items" §2, "Decisions pending", "Decisions
   made", "Review fixes")
2. R5 in `docs/superpowers/evidence/curriculum-piece-1-review.md`
3. Umbrella spec `docs/superpowers/specs/2026-09-28-curriculum-identity-design.md` §1–2 (decisions, piece outline;
   piece 2 is pinning)
Grep the tracker for symbols; never read it whole.

Use `superpowers:brainstorming`. Ask one question at a time, each with your recommendation:
1. **M1 option.** (a) calls carry a session id; (b) leave it to piece 2 pinning; (c) only state the call impact in
   the delete and reorder confirmations. The lead of the review-fix run recommended (a), with (c) as an interim if (a)
   waits.
2. **R5 until M1 lands.** Keep reorder with the CHANGELOG caveat, add the call count to its confirmation, or disable
   reorder.
3. **A call on a deleted session.** It keeps the dead id and shows as "removed session", or something else. What
   the completion count, next session and gap signal do with it.
4. **Migration (schema 13 → 14).** Stamp each call's session id from its number against the account's curriculum
   at upgrade time. Calls numbered past the curriculum (the placeholder tail, `totalSessions` > templates) touch
   **M2** (placeholder padding after a delete, still pending): fold M2 in or defer it.
5. **Outputs.** Gainsight backfill, CSV/ICS/text exports, the debrief prompt and runway/Gantt dates show a session
   *number*: derive it from the id at render and export time?
6. **Export before upgrade.** A second schema bump raises the still-pending prompt question (task 6b) again.

Once I've answered, **probe before spec**: a read-only probe on the demo seed (and on my real exported book if I
provide one) that counts, for delete session 2 and for reorder 2↔3, how many calls change session, and how many
values move in each consumer: completion counts, next session, gap signal, runway/Gantt dates, debrief prompt,
Gainsight backfill. Also count calls past the curriculum (for M2). Put those numbers in the spec as targets, each
marked measured. Copy the probe style from `docs/superpowers/specs/2026-09-28-curriculum-identity-probe.js`.

Write:
- the spec, `docs/superpowers/specs/2026-10-<dd>-curriculum-m1-calls.md`, in the format of the piece-1 spec:
  decisions with Ian's verbatim words, required behaviour, acceptance checks with their red conditions, code pointers,
  measured baseline;
- `docs/superpowers/sessions/curriculum-m1-calls-run.md`, the run prompt (plan, then build tasks, then checker per
  task, then the final review on the top model), which reuses `sessions/curriculum-subagent-brief.md` and
  `sessions/curriculum-checker-brief.md`;
- ledger updates: move each ruled item from "Decisions pending" to "Decisions made" with the verbatim words, and add
  an M1 row or note.

Commit, tell me the one-line paste for the run, and stop.
