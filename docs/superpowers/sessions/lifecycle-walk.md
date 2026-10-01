# Session prompt — OSM lifecycle walk and gap list (step 2 of 4)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/lifecycle-walk.md and do it`
The instructions are everything below the line.

---

**Objective.** Walk one Onboarding Success Manager's (OSM) whole job through the tracker, from the partner
hand-off to graduation and the hand-over to the long-term CSM, and produce a ranked gap list. The gap list
feeds step 3, the design talk on the goals → Graduation Plan → One Document thread. This session researches
and measures; it does **not** change the tracker. Read-only on `osm-book-of-business-tracker-1.0.html`;
scripts and captures go to `$CLAUDE_JOB_DIR/tmp/` (or `$TEMP/lifecycle-walk/`), not the repo.

Why (Ian, 2026-09-30): he wants the tracker usable by every OSM for call prep, session/curriculum planning,
Gainsight admin, drift and at-risk tracking, and AI decision support. Session planning should feed a
"Graduation Plan" that enables the customer and delivers outcomes for the goals found at the hand-off from
implementation partners, so the two are visibly connected. All of it should roll up into a "One Document"
handed to the long-term CSM at graduation. Onboarding averages ~3 months. It can end sooner when the customer
needs no more enablement, or once the immediate goal is met: publishing this year's sustainability report, or
being set up to publish next year's, meaning the program, data collection sheets or tasks, factbook and report
are all set up.

The four steps (ruled by Ian 2026-09-30): (1) Ian gathers internal Workiva documents; (2) **this session**;
(3) the design talk, its own session; (4) in parallel, a shadow pilot of call prep and drift on 3–5 real
accounts once the AI/data-policy question is cleared.

## Inputs

1. **Ian's internal documents**, if any: `docs/research/internal/` (gitignored, company material: read in
   place, never commit, never quote whole passages into the repo; paraphrase and cite the file name). Expected:
   the partner hand-off template, graduation checklist or criteria, Gainsight CTA / success-plan fields, an
   example of what a long-term CSM receives. If the folder is missing or empty, say so in the first line of
   the gap list and continue on public material plus the demo data. Mark every finding that rests on an
   assumption Ian's documents would settle.
2. **Public research**: a probe on 2026-09-30 got 403s on the full pages, so these are search-snippet claims.
   Re-read before relying on them, and mark what you could not confirm:
   - Implementation arc: workiva.com/resources/implementation-guide-workiva-financial-reporting and
     …/implementing-workiva-fund-reporting-practical-guide (10–12 weeks: kickoff/discovery, build/UAT, training/
     go-live). A public SOW: trs.ky.gov/wp-content/uploads/2025/12/Atikin-Workiva.pdf ("Implementation is
     complete when the Customer's Solution will be supported by Workiva's Customer Success").
   - Sustainability objects (support.workiva.com, may need login): Program (topics → metrics, framework
     alignment GRI/SASB/TCFD/CDP/ESRS), data collection (tasks, Data Collection spreadsheet, Processes),
     Factbook (Admin / Source / Templates / Performance Tables / Framework Indices), the report linked to the
     Factbook, and the year roll-forward. Articles: 7460009877012, 4412844707604, 4418389230356.
   - Generic pattern: gainsight.com/blog/customer-onboarding/ and …/app/onboarding-success-plan-for-new-customers/
     ("Initial Value Moment" hand-off criteria; a success plan carried from pre-sales through onboarding to the
     CSM).
   Targeted searches only. **Research informs, it doesn't decide:** adopting any external framework or term
   is Ian's call in step 3.
3. **What the tracker has today**: a 2026-09-30 survey at `62e1a74` (read, not run, so re-verify each item you
   lean on). The call-prep brief (`buildCallPrepPrompt`) needs an API key. The curriculum has evidence per
   account (piece 1, schema 13). Gainsight is copy text, gates, a sync queue with no transport, and a 4-column
   CSV import. Drift has 8 `SIGNAL_DEFS` and a flat 14-day pace. AI is `callAiAPI` with 6 prompt builders, plus
   the offline `getRecommendedAction` and `suggestedPlaybooks`. The graduation dates and stages exist, but no
   plan object. Hand-off goals are the free-text `promisedOutcomes` on a form labelled "Sales handoff". The CSM
   packet is `buildKnowledgeTransferText`, which has no goal verdicts, no evidence and no report status.
   Program readiness exists only as curriculum deliverable text.
4. Context: the auto-memory note `osm-team-baseline` (Ian's own figures, 2026-09-22) (25–40 accounts, 8–12 calls/week, ~5 h admin/week, 4 tools today:
   Gainsight, a personal spreadsheet, Outlook, a team Smartsheet). The 2026-09-22 field test and its harness are
   `docs/superpowers/2026-09-22-fixes-LEDGER.md` and `tools/sim/run-field-test.mjs`; reuse the harness pattern.
   The tracker is ~1.6 MB: never read it whole; grep.

## The walk

Drive the real tracker headlessly (`tools/inspect.mjs`, or a copy of the field-test harness in tmp) on
`demo-seed.js` plus a scenario seed you write in tmp. Use three scenario accounts, each partner-led,
Sustainability or Sustainability + Carbon:
- **A, the standard path:** CSRD, goal "publish FY2026 report", 12 weeks, graduates on the plan.
- **B, early exit:** the goal is met by week 7 and the customer declines more enablement.
- **C, drift:** the champion changes in week 4, sessions slip, and the report-year goal moves to "ready for
  next year".

At each point (hand-off intake · kickoff · each enablement session's prep, the call and the follow-up ·
Gainsight admin that week · drift/risk review · graduation-readiness check · building the CSM hand-over),
record what the OSM needs, what the tracker gives (cite the function or view and whether you **ran** it or only
**read** it), the gap, its severity (blocks / costs time / cosmetic), and minutes, marking any estimate. Add
one **week across a full book** (30 accounts, 10 calls): the time to prep each call and to do the week's
Gainsight admin, against the ~5 h baseline.

Also check, and report as their own findings: the customer-data → third-party-AI path (what leaves the
machine, and with which key); backup and restore (run one export → clear → import on a scratch profile and
report whether the book came back identical); and anything that would stop a second OSM using the file
(shared curriculum, per-person data).

## Output

1. `docs/superpowers/evidence/<date>-lifecycle-walk.md`: the gap list ranked by severity × frequency. Each
   gap is tagged to one piece: goals at hand-off · Graduation Plan · program readiness gates · One Document ·
   plan-driven prep · drift calibration · Gainsight · data safety/policy · multi-OSM. Each has its evidence path
   and ran/read. Then the open questions only Ian can answer, and a short "what the public research supports"
   section with sources, marking what you couldn't confirm.
2. Publish the gap list as a private Artifact for Ian (load the artifact-design guidance) and give him the
   link.
3. Write the step 3 prompt `docs/superpowers/sessions/graduation-plan-design-talk.md`: a brainstorm + spec
   session (superpowers:brainstorming, architectural path) that starts from the gap list and Ian's documents,
   and opens with the question still pending from 2026-09-30: is the hand-off goal the spine (goal → sessions
   and deliverables → readiness gates → One Document verdict), or is it the report year?
4. One commit (the evidence doc and the step 3 prompt; never `docs/research/internal/`), push notification,
   then stop and give Ian the one-line paste for step 3.

## Working rules

You lead. Hand the noisy parts to subagents, one at a time, on the cheapest model that fits: the walk driver
on Sonnet, re-verifying the survey on Sonnet, public research on Sonnet, and ranking and synthesis on the top
model. Each replies in ≤ 10 lines and writes its detail to files. Logs go to files, never into context. Don't
load screenshots into context; any capture meant for Ian's judgement goes to him. Every number in the gap list
says whether it was measured or estimated. If your context grows large, write what you have to the evidence
doc and a resume prompt, and end.
