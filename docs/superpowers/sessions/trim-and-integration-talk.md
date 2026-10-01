# Session prompt: trim + Gainsight/Gong integration (the talk)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/trim-and-integration-talk.md and do it`
The instructions are everything below the line.

---

**Objective.** Hold the design talk with Ian for two linked decisions, then write one spec:
1. **What to trim or consolidate.** The tracker is judged over-engineered in places. Its core loop (Today → account
   panel → log → graduation → CSM packet) is sound.
2. **The end state.** Pull Gong call transcripts and summaries aligned to the tracker's call sessions. Push the
   tracker's admin items into Gainsight. Pull account information from Gainsight.

This is "the talk" half of the objective. It follows the global rule "one objective, two sessions". Invoke
`superpowers:brainstorming` before proposing anything. Ian makes every call; the evidence below informs, it doesn't
decide.

**Read first (evidence, all 2026-10-01, read-only audits at master `57f263b`):**
- `docs/superpowers/evidence/2026-10-01-trim-audit-overengineering.md`. Its figures are RAN unless marked:
  - The self-check suite is 30.6% of the shipped file.
  - The file grew 26% since 1.0 (22,403 → 28,283 lines; schema 11 → 15).
  - There are 852 functions, and `attachEvents` alone is 1,582 lines.
  - Outcomes are modelled 5 ways.
  - Candidates are in three groups: T1-T5 (trim now), C1-C10 (consolidate) and Keep.
- `docs/superpowers/evidence/2026-10-01-trim-audit-integration-seams.md`. Today's Gainsight touchpoints and queue
  kinds; the activity/call model; field ownership; the browser constraint; the interfaces a connector could use.
- `docs/superpowers/evidence/2026-10-01-trim-audit-gong-gainsight-research.md`. External facts are marked
  CONFIRMED/UNCONFIRMED with sources:
  - Gainsight has an official MCP server (read plus create/update of CTAs, success plans, timeline). It needs a
    Super Admin's one-time setup.
  - Gong transcripts come only through its REST API, with admin-issued credentials. Gong's official MCP is read-only
    and returns synthesized answers, not transcripts.

**Decisions to put to Ian (do not decide them yourself):**
1. **AI/data policy (G01, step 4).** The existing AI features already send full account context, notes and up to
   120k chars of transcript from the browser to api.anthropic.com with the user's key (seams report). A
   Gong/Gainsight connection widens this. Settle the policy before designing the transport.
2. Which trims to do now: T1-T5. T4 (dropping pre-1.0 migrations) needs Ian's yes that no pre-1.0 export matters.
3. Whether the decoration layer goes: card deck, band, telemetry, motion (C5).
4. Whether the time-saved report retires. It multiplies counts by assumed minutes (C6).
5. The connector shape. The seams report recommends Claude with Gong/Gainsight MCP connectors, exchanging an
   inbox/outbox JSON through a preview-and-confirm import, with a local helper possible later behind the same
   contract. The alternative is a small local helper from day one.
6. What to ask the Gainsight Super Admin and the Gong Tech admin for, and when.
7. **Order:** trim first, integration first, or interleaved. The audit says C2-C8 should wait for the integration
   design; T1-T5 can go any time.

**Rules.**
- Probe before you spec: any count or threshold in the spec comes from a read-only probe on the real file.
- Grep the tracker; never read it whole. Its header comment (first ~45 lines) holds the editing rules.
- No code changes in the talk. The output is a spec under `docs/superpowers/specs/` and a run prompt under
  `docs/superpowers/sessions/`, committed on a branch, with Ian merging.
- Never commit `docs/research/internal/`. Send nothing to any service.
