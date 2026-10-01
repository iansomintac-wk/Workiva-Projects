# Session prompt: Graduation Plan design talk (step 3 of 4)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/graduation-plan-design-talk.md and do it`
The instructions are everything below the line.

---

**Objective.** Hold the design talk on the goals → Graduation Plan → One Document thread with Ian, and leave a
written spec and a run prompt. This is "the talk" half of the objective. It needs Ian in the conversation, and it
ends with a spec file and a run prompt, **not code**. Do not edit `osm-book-of-business-tracker-1.0.html` in this
session.

**Process.**
- Invoke `superpowers:brainstorming` before proposing anything, and take its architectural path.
- Ask one question at a time.
- Propose 2-3 approaches with trade-offs before settling.
- Get Ian's approval section by section.

## Inputs

1. **The gap list:** `docs/superpowers/evidence/2026-09-30-lifecycle-walk.md`.
   - Read it in full.
   - 4 of the top 5 gaps (G02-G05) sit on this thread: no goal field at hand-off, no plan object linking goal to
     sessions and deliverables, no program-readiness status, and a CSM packet with no goal verdicts. G01 (AI egress)
     is ranked first but is a policy question for step 4.
   - The walk's raw evidence was under `C:\Users\teasp\.claude\jobs\86d4edab\tmp\lw\` and may be gone. Rely on the
     numbers quoted in the doc.
2. **Ian's internal documents:** `docs/research/internal/` (gitignored).
   - In step 2 the folder was missing. If it exists now, read it in place before the first design question.
     Never commit it, and never quote whole passages; paraphrase and cite the file name.
   - Expected: the partner hand-off template, graduation checklist or criteria, Gainsight CTA / success-plan
     fields, and an example of what a long-term CSM receives.
   - For every gap flagged "Settled by Ian's docs? yes", say whether the documents settle it, and how.
   - If the folder is still missing or empty, say so first, and ask Ian the gap list's open questions directly
     instead.
3. **Ian's framing (2026-09-30), from `docs/superpowers/sessions/lifecycle-walk.md`:**
   - Session planning feeds a Graduation Plan that delivers outcomes for the goals found at the partner hand-off,
     and it rolls up into a One Document for the long-term CSM.
   - Onboarding averages about 3 months.
   - It can end early when the customer needs no more enablement, or once the immediate goal is met: publishing
     this year's report, or being set up to publish next year's.
4. **What the tracker already has** (verified in step 2; build on it rather than beside it):
   - Partner-led implementation mode `c.implementation`, with phases Align → Go-Live.
   - Hand-off forms `c.handoffIn` / `c.handoffOut`.
   - Per-account outcome criteria with evidence (curriculum piece 1, schema 13).
   - The "Success Outcome Plan" gate `compliance.outcomePlan`.
   - A post-graduation `gradReview` (held / partial / lapsed).
   - 16 `SIGNAL_DEFS`.
   - `buildKnowledgeTransferText`.

## Open with the pending question

Ask Ian first: **is the hand-off goal the spine, or is it the report year?**

- **Goal spine:** the hand-off goal → the sessions and deliverables that serve it → readiness gates → the One
  Document's verdict on that goal.
- **Report-year spine:** the reporting cycle (this year's report, or set-up for next year's) and its roll-forward
  carry the plan, and goals hang off it.

Bring the gap list's finding into that question. Public research suggests that "publish this year's CSRD report"
may not be a realistic 2026 goal for most new customers. Sources: one fetched law-firm summary of the March 2026
Omnibus agreement (EU companies' first reports for FY2027, published 2028), plus search snippets. Ask whether that
matches what Ian sees at hand-off.

Then work through the other open questions from the gap list as the design needs them:
- what counts as graduation evidence, and what an early exit must record;
- what the partner hands over;
- which Gainsight fields the OSM keeps current;
- what the CSM reads;
- whether OSMs share one curriculum.

Leave the AI/data-policy question to Ian and step 4. Note it in the spec, but do not design around an assumed
answer.

## Rules

- **Probe before you spec.** A spec that carries counts or thresholds (sessions per goal, readiness criteria,
  signal thresholds, minutes saved) is approved only after a read-only probe on real data has put its numbers in
  the spec.
  - Run probes against the demo book or a scenario seed with the headless harness: `tools/inspect.mjs`, or the
    field-test pattern in `tools/sim/run-field-test.mjs`.
  - Scripts and captures go to `$CLAUDE_JOB_DIR/tmp/`, not the repo.
  - Each number in the spec says whether it was measured or estimated.
- **Adopting external terms is Ian's call.** Words such as "Initial Value Moment", "success plan", "program
  readiness", "Factbook" stages or framework names come from public research marked SNIPPET or NOT CONFIRMED.
  Offer them as options; never adopt one in the spec without Ian's say-so.
- **Research instead of guessing, targeted.** If a design question needs a fact about how Workiva Sustainability
  or Gainsight is set up, check the internal documents first, then do one targeted search. Mark what you could
  not confirm.
- **Grep the tracker; never read it whole** (it is about 1.6 MB).
- **Keep it small.** Hand-offs, schema bumps and migrations follow the existing patterns (`CURRENT_SCHEMA_VERSION`,
  the migration chain). The spec should split the build into tasks of 8 steps or fewer.

## Output

1. The spec, `docs/superpowers/specs/<date>-graduation-plan-design.md`, containing:
   - the chosen spine and why;
   - the data model change, if any;
   - how a goal links to sessions, deliverables, readiness gates and the One Document verdict;
   - early exit and goal change;
   - what the CSM packet gains;
   - which gaps from the list each part closes, by id;
   - which gaps it leaves for later;
   - every count or threshold, with its probe evidence.
2. The run prompt, `docs/superpowers/sessions/<name>.md`:
   - Use the same shape as this file: a header with the one-line paste, then the instructions below a `---` line.
   - It is for the run session, which plans with `superpowers:writing-plans` and builds through subagents, one task
     at a time, each followed by a checker.
   - It should list the paid runs the run may use, if any, with their stated total.
3. One commit containing the spec and the run prompt. Never commit `docs/research/internal/`.
4. A push notification, then stop and give Ian the one-line paste for the run.
