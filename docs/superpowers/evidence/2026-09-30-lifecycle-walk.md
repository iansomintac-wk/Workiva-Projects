Internal documents folder `docs/research/internal/` is missing (no partner hand-off template, graduation criteria, Gainsight field list or CSM packet example was provided); this study continues on public material plus demo and scenario data.

# OSM lifecycle walk and gap list (step 2 of 4), 2026-09-30

**Published for Ian:** https://claude.ai/artifact/13yEgzJULBWhbxLR9EXX2X (private Artifact of this gap list).

**What this is.** One Onboarding Success Manager's job walked through `osm-book-of-business-tracker-1.0.html`
(read-only, worktree `lifecycle-walk` at `632261c`) from partner hand-off to the CSM hand-over, on three scenario
accounts and one 30-account week. It feeds step 3, the design talk on goals → Graduation Plan → One Document.

**Evidence and provenance.**
- All scripts, seeds, logs and outputs live outside the repo under
  `C:\Users\teasp\.claude\jobs\86d4edab\tmp\lw\` (written below as `lw\`). They are not committed and may be
  cleaned up; the key numbers are quoted inline so this document stands alone.
  - `lw\01-survey.md`: code survey, re-verified by reading (READ).
  - `lw\02-walk.md` plus `lw\walk\`: headless walk in Chrome through the page's own functions and DOM (RAN).
  - `lw\03-research.md`: public research.
- The lead re-ran two probes on 2026-09-30 and got the same results:
  - `backup-probe.mjs`: export SHA `4d70458c…` equals the import SHA, and the diff is `[]`.
  - `kw-probe.mjs`: "Our champion Priya has left the company." scores positive `["champion"]` and risk `[]`;
    "Report slipped to FY2027." scores nothing.
- This synthesis ran no new measurements. Every figure below was either RAN by the walk or the lead, or READ from
  code or the survey, and each one says which.
- **Minute labels.**
  - MEASURED means interactions the harness counted, converted at the walk's rate model: 2 s per click,
    4 s per select or date field, and 8 s per text field plus 0.3 s per typed character. The rate model is the
    walk agent's assumption, not Ian's. Reading and thinking time are never inside a MEASURED figure.
  - ESTIMATE means the number was assumed, and its basis is stated.
- Scenario accounts (fictional): A Alder Foods (CSRD, goal "Publish FY2026 report", graduates on plan),
  B Birch Logistics (goal met week 7, declines more enablement), C Cedar Mining (champion change week 4, sessions
  slip, goal moves to "ready for next year"). Clock: Go-Live 2026-07-08, week 12 = 2026-09-30.

## Scoring rule

**Score = severity × frequency.**
- Severity:
  - blocks = 3: the OSM cannot do the job step in the tracker at all.
  - costs time = 2: it works, but with extra effort or a wrong or late answer.
  - cosmetic = 1.
- Frequency:
  - 3: every call, every non-session log, or every week across the book.
  - 2: once per account (intake, graduation, hand-over), or once per at-risk account.
  - 1: exception paths that only some accounts take (goal change, early exit, rescheduled session, restore,
    a second OSM).
- Ties break in this order:
  1. Higher severity.
  2. Silent errors (wrong data with no warning) before visible ones.
  3. More minutes per week across a 30-account book.
  4. For the blocks-severity ties, dependency order: a gap that other gaps depend on comes first.

"Settled by Ian's docs?" = yes means the finding rests on an assumption that the missing internal documents
would confirm or overturn.

## Ranked gap list

| Rank | Id | Gap | Piece | Severity | Frequency | Score | Minutes | Evidence | Ran/Read | Settled by Ian's docs? |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | G01 | AI features send real account names, contacts, partner names, note text and raw transcripts to a third-party model on the OSM's personal key, straight from the browser, with no redaction | data safety/policy | blocks (AI use until policy is cleared) | per call once AI prep is on | 9 | n/a | `lw\walk\ai\*.prompt.txt`, `lw\walk\ai-egress-summary.json` | RAN | yes (AI/data policy) |
| 2 | G02 | No goal field: the hand-off goal can only be free text in 4 places (first-value definition, outcome-plan text, "Outcomes promised in the sale", notes) | goals at hand-off | blocks (goal tracking) | per account | 6 | MEASURED 1.1 min account create; no goal step exists | `lw\walk\walk1-out.json`; survey §7 | RAN | yes (hand-off template) |
| 3 | G03 | No plan object linking goal → sessions → deliverables → graduation test; the CSRD curriculum ends at S8 "Double Materiality Assessment" with no publish, assurance or sign-off step | Graduation Plan | blocks (for the stated goal) | per account | 6 | n/a | `lw\walk\curriculum.json`; survey §6 | RAN (curriculum), READ (no plan object) | yes (graduation criteria) |
| 4 | G04 | Program readiness (program, data collection, Factbook, report linked, roll-forward) exists only as curriculum deliverable text and 3 default outcome labels; there is no field, status or signal for it | program readiness gates | blocks (the "set up for next year" goal cannot be tested) | per account | 6 | n/a | survey §9 (L4822-4826, L3513-3702) | READ | yes (graduation checklist) |
| 5 | G05 | The CSM packet (`buildKnowledgeTransferText`) has no goal verdicts, no per-criterion evidence (B has 8 of 9 criteria evidenced, and the packet is silent on them), no report status, no gradReview verdict and no early-exit reason. For C it shows "Publish FY2026 report" promised and "Ready for next year" as first value, with no note of the change | One Document | blocks (goal-based hand-over) | per graduation | 6 | MEASURED 2 clicks to generate; outbound form MEASURED 1.7 min per account | `lw\walk\kt_Alder Foods.txt`, `kt_Birch Logistics.txt`, `kt_Cedar.txt` | RAN | yes (CSM packet example) |
| 6 | G06 | The log form pre-selects the next open session for every activity type, so an email or exit note silently becomes a "held" session. In run 1, C's champion-change email became "Session 4 held" and B's exit note "Session 6 held"; pace, health, ticks and the CSM packet all followed | plan-driven prep | costs time (silent, corrupts the record) | per non-session log | 6 | MEASURED 4 s per log to avoid it, if noticed | `lw\walk\evidence-run1-session-autolink-trap.json` | RAN | no |
| 7 | G07 | Gainsight work is bookkeeping only: no transport (`syncGainsightQueue` returns `transport_not_built`). Each Call creates 3 to-do items. "Copy all and queue" does not clear them (70 pending before and after) | Gainsight | costs time | per week | 6 | Gainsight keying ESTIMATE 90 min/week (3 items × 3 min × 10 calls; the 3 min is the app's own `gainsight_item` constant, which its source calls an assumption). Mark-done MEASURED 3.8 min/week | `lw\walk\week30-out.json`; survey §3 | RAN (tracker), READ (no transport) | yes (Gainsight fields) |
| 8 | G08 | No offline call-prep view: `buildCallPrepContext` assembles the facts, but only the AI brief renders them. With no key there is an error and no brief, so prep is 4 tabs read by hand (about 13,600 characters per call) | plan-driven prep | costs time | per call | 6 | Clicks MEASURED 10 s per call; reading ESTIMATE 5 min per call = 50 min/week | `lw\walk\nokey-probe.mjs` (0 requests, empty brief), `lw\walk\week30-out.json` | RAN | no |
| 9 | G09 | The customer recap email exists only as an AI feature (Session Debrief); there is no offline template | plan-driven prep | costs time | per call | 6 | ESTIMATE 5 min per call = 50 min/week, if sent | `lw\02-walk.md` row 7 | RAN | no |
| 10 | G10 | The grad-date-accuracy Gainsight item recurs in most weeks, cannot be cleared by "Mark done" (only by editing the target date), and stays on a graduated account (B still shows "Gainsight To-Do 1" on 09-30) | Gainsight | costs time | per account-week | 6 | MEASURED about 6 s per account-week; A had 29 items in 13 weeks | `lw\walk\probe2.json` (`gainsightBirch`) | RAN | no |
| 11 | G11 | Champion loss reads as positive: the positive list has "champion" and the risk list has only the exact phrase "champion left". "Our champion Priya has left the company." scores positive `["champion"]` and risk `[]`. C first reaches Today 16 days after the sponsor change, and `escalating_risk`, `risk_language`, `slow_pace` and `session_gap` never fire | drift calibration | costs time (misleading) | per at-risk account | 4 | Detection lag MEASURED 16 days (champion change 08-05, first Today 08-21) | `lw\walk\kw-probe.json`, `lw\walk\walk1-out.json` (`weekly`) | RAN (lead re-ran kw-probe) | no |
| 12 | G12 | Day-0 false alarm: at Go-Live, `behind_target` fires on all three accounts because a 12-week target is shorter than 14-day pace × 8 sessions (112 days). Each shows "Needs Attention" until session 1 is logged | drift calibration | costs time | per account | 4 | n/a (clears in week 0) | `lw\walk\walk1-out.json` (`goLive`), `lw\walk\probe1.json` | RAN | partly (real session counts and cadence) |
| 13 | G13 | No "ready to graduate" prompt once a target date is set. A at 8/8 sessions with no missing gates gets "Account looks steady - no urgent action needed"; `ready_to_set_date` fires only when there is no target date | Graduation Plan | costs time | per account | 4 | MEASURED about 0.2 min (7 clicks) to check by hand | `lw\walk\kw-probe.json` (`aReadyState`); L7112 | RAN + READ | yes (graduation criteria) |
| 14 | G14 | No partner-to-OSM acceptance record: the inbound form is the "Sales handoff (inbound)" (7 free-text fields, marked PROVISIONAL). Partner mode (`c.implementation`, phases Align → Go-Live) has no exit or acceptance checklist | goals at hand-off | costs time | per account | 4 | MEASURED 4.6 min per account (6 fields 2.4 + stakeholder 0.6 + 2 partner-sync logs 1.6); reading partner documents not counted | `lw\walk\walk1-out.json`; survey §7 | RAN | yes (partner hand-off template) |
| 15 | G15 | Success plan exists only as the "Success Outcome Plan" gate (`compliance.outcomePlan` {done, date, outcomeNumber, planText}) plus two plan URLs; there is no success-plan object to mirror Gainsight's Objective CTAs and tasks | Gainsight | costs time | per account | 4 | MEASURED 1.8 min for gates at kickoff | survey §3, §6 | RAN (gates), READ | yes (Gainsight CTA / success-plan fields) |
| 16 | G16 | Goal change overwrites: there is no goal history, and no signal fires on a goal change. C's original goal survives only in the inbound hand-off text | goals at hand-off | blocks (goal tracking) | per goal change | 3 | MEASURED 1.0 min to overwrite | `lw\walk\walk1-out.json` (W6-W8 weekly), `lw\walk\kt_Cedar.txt` | RAN | no |
| 17 | G17 | A second OSM cannot share a curriculum or a book: there is no owner field, the curriculum is per book in `DATA.config`, import overwrites, and there is no team roll-up. A second OSM can still use an independent copy | multi-OSM | blocks (shared curriculum, team view) | per second OSM | 3 | n/a | `lw\walk\multi-report.json` | RAN + READ | yes (how the team would share) |
| 18 | G18 | Early exit has no reason, no goal verdict and no flag; the stage dropdown goes straight to "graduated" with no confirm. Planned sessions cannot go below 6 (typed 5, stored 6), so B shows 5/6 permanently with one unevidenced criterion | Graduation Plan | costs time | per early exit | 2 | MEASURED 0.2 min | `lw\walk\probe2.json` (`overviewBirch`) | RAN | yes (what early graduation requires) |
| 19 | G19 | Goal-change wording fires nothing: "Report slipped to FY2027." and "Customer wants to push the report to next year." both score risk `[]` | drift calibration | costs time | per goal change | 2 | n/a | `lw\walk\kw-probe.json` | RAN (lead re-ran) | no |
| 20 | G20 | Import replaces the whole book after one confirm. Importing a colleague's file wiped the receiving OSM's extra account and curriculum edit (RAN on the 3-account and 30-account books) | data safety/policy | costs time | per import | 2 | n/a | `lw\walk\multi-report.json` | RAN | no |
| 21 | G21 | Stages never auto-advance: the Kanban, Gantt and CSM packet show "Kickoff" through week 12 unless the OSM moves the stage by hand. A's history is kickoff → graduated, with no ttfv1 or ttfv2 | Graduation Plan | cosmetic | per account | 2 | ESTIMATE 2 clicks × 2 moves per account (not run) | `lw\walk\walk1-out.json` | RAN | no |
| 22 | G22 | A new stakeholder's role defaults silently to "Champion", and the CSM packet shows it | One Document | cosmetic | per account | 2 | n/a | `lw\walk\kt_Cedar.txt` | RAN | no |
| 23 | G23 | A rescheduled session overwrites the date, leaving no record of the slip, its cause or how often it happened (C's S4 slipped twice) | drift calibration | cosmetic | per slip | 1 | MEASURED 0.1 min | `lw\walk\walk1-out.json` | RAN | no |
| 24 | G24 | Backup does not carry the AI key and model, the Gainsight settings or UI prefs; after a restore these must be entered again | data safety/policy | cosmetic | per restore | 1 | n/a | `lw\walk\backup-report.json` | RAN | no |

G01 ranks first by the rule, not by what is visible today. With no key, no request is made (0 requests, RAN). The
score applies once AI call prep is switched on, which is Ian's stated aim and the condition for the step 4 pilot.

Read by piece:
- The goals → Graduation Plan → readiness → One Document thread holds 4 of the top 5 gaps (G02-G05) and 11 of
  the 24 in total: G02, G03, G04, G05, G13, G14, G16, G18, G21 and G22, plus G15 on the Gainsight side.
- The largest time cost sits outside the tracker: Gainsight keying (G07, ESTIMATE 90 min/week), plus manual prep
  reading (G08) and recap emails (G09), ESTIMATE 50 min/week each.

## AI egress

How it was tested (RAN):
- A dummy key was stored in the page's own settings.
- `window.fetch` was replaced by a recording stub that throws, and a CDP `Fetch` interceptor failed every http(s)
  request as a second barrier. Nothing left the machine.
- Scenario A was given a transcript containing a person, an email address, a phone number and a renewal date, plus
  in-memory ARR 1,850,000, tier and renewal date.
- Scripts: `lw\walk\ai-probe.mjs`, `ai-scan.mjs`. Captures: `lw\walk\ai\*.json`, `*.prompt.txt`.

Where requests go and with which key:
- The endpoint follows the chosen model: Gemini by default (`gemini-2.5-flash`), Anthropic or OpenAI. Requests go
  straight from the browser, with no proxy.
- The key is the OSM's own, stored in localStorage `obm-ai-settings-v1`. It travels in a request header, never the
  URL, and it is not in the Export JSON.
- The default model's own label warns that on Google's free tier, prompts may be used to improve Google products.

What left, by feature (RAN):
- **Call prep** (6,635-character prompt): real account name, primary contact, partner firm and partner contact,
  goal text and session notes. Not sent: ARR, tier, renewal date, Gainsight ID or inbound hand-off text.
- **Session debrief** (3 calls of 3,226, 1,714 and 6,205 characters): the note and the raw transcript, unredacted,
  three times. Names, the email address, the phone number and the renewal date inside the transcript all went.
  Free text defeats field-level pseudonymising.
- **Risk summary and thread answer:** real account name, recent notes, the customer's question and curriculum text.
- **Portfolio brief and Copilot read:** "Account-XXXXX" pseudonyms with only module, stage, risk label, health and
  counts.

Call sites: 8 in total (6 prompt builders + 2 inline), READ in survey §5.

## Backup and restore

The book came back identical, and this was RAN twice (the walk, then the lead's re-run).
- **Method:** on a fresh scratch profile, the real `exportData()` ran, then `localStorage.clear()` and a reload
  (0 customers), then the real `handleImportFile` with its confirm. The comparison used canonical key-sorted JSON,
  SHA-256 and a recursive diff.
- **Result:** the export and import SHA are both `4d70458c…`, and the diff is `[]`. Persisted storage equals memory
  after import. Against the pre-export book, the only difference is `lastExportedAt`, which `exportData()` stamps on
  purpose.
- **Archive round trip:** archiving B, removing it and restoring it gave diff `[]`.
- **Not carried:** see G24. Import replaces everything; see G20.
- **Sizes:** the walk book is 70,835 bytes and its export 102,056 bytes (MEASURED).
- **Evidence:** `lw\walk\backup-report.json`, `lw\walk\rerun-backup.log`.

## Multi-OSM

A second OSM can use the file today as an independent copy, and nothing blocks that (RAN). The same file opened
from another path in the same Chrome profile saw the same book, because storage is per browser profile, not per file.

What does not exist:
- An owner or user field (READ: the only owner-like keys are blocker and risk owners).
- A merge on import: import overwrites (RAN).
- A shared or versioned curriculum: `sessionTemplates` live in each book's `DATA.config` (READ and RAN).
- A team roll-up: the manager Progress Report is a single-OSM export (READ L24857).
- Settings in the file: the AI key and Gainsight domain stay with each browser (RAN).

Cross-tab protection is a banner only.

Evidence: `lw\walk\multi-report.json`.

## The full-book week against the ~5 h baseline

Setup: a 30-account book (4 partner builds, 2 graduated, 24 live) with 10 calls from Monday 2026-09-28 to Friday
2026-10-02, each run through the same prep, call-script and follow-up sequence (`lw\walk\week30-out.json`).

| Item | Minutes | Label |
|---|---|---|
| Prep clicks (5 clicks, 4 tabs, × 10 calls) | 1.7 | MEASURED |
| Run-script clicks (3 × 10) | 1.0 | MEASURED |
| Follow-up (log, 2 deliverables, next date; 130-character notes) | 10.6 | MEASURED |
| Friday Gainsight "Mark done" (70 items across 23 accounts, 114 clicks) | 3.8 | MEASURED |
| **Tracker interaction subtotal** | **17.1** | **MEASURED** |
| Extra typing for real notes (about 600 characters, not 130) | 24 | ESTIMATE |
| Reading prep (5 min × 10) | 50 | ESTIMATE |
| Gainsight keying (3 items × 3 min × 10 calls; gate items extra) | 90 | ESTIMATE (app constant) |
| Monday read of Today (20 ranked rows, 7 "Needs Attention", 17,184 characters) | 15 | ESTIMATE |
| Glance at the 14 non-call live accounts | 14-20 | ESTIMATE |
| **Estimated subtotal** | **about 199** | **ESTIMATE** |
| **Week total** | **about 216 (3.6 h)** | 17 MEASURED + 199 ESTIMATE |
| Recap emails, if sent (5 min × 10) | +50 | ESTIMATE, not in total |

Against Ian's ~5 h/week admin:
- The 5 h figure is Ian's (memory note `osm-team-baseline`, 2026-09-22). It was read here, not measured.
- The tracker's own clicks and typing are 17 min (MEASURED). About 92% of the 3.6 h is estimated time, and most of
  that sits outside the tracker: Gainsight keying, reading and Outlook.
- The 5 h is not broken down, so this walk cannot say which parts of it the tracker removes.
- The app's own Monday banner said "13 accounts need you, roughly 300 minutes of work". That figure comes from the
  `EFFORT_MIN` constants (L18705), which the source calls assumptions, so it is not a measurement.

## Corrections to the brief's figures

The brief's survey was taken at `62e1a74` and read, not run. Re-verified:

1. **Drift signals.** The brief gives "8 `SIGNAL_DEFS`". There are **16** (L7193-7339), in priority order from
   `flagged` to `session_gap` (READ).
2. **Pace.** The brief gives "a flat 14-day pace". The 14 days is `config.defaultPaceDays` (L4783) and can be
   changed in Settings. `customerPaceSignal` needs at least 2 completed sessions and uses actual days per session
   (READ).
3. **AI call sites.** The brief gives "`callAiAPI` with 6 prompt builders". There are **8** call sites:
   - 6 named builders: call prep, session debrief, score extraction, call review, risk summary and thread answer.
   - 2 inline prompts: portfolio brief and Copilot read. These 2 send pseudonyms, not names (READ; egress RAN).
4. **Graduation.** The brief gives "no plan object". That holds for a plan object, but two related structures do
   exist (READ):
   - `compliance.outcomePlan`, the "Success Outcome Plan" gate {done, date, outcomeNumber, planText}.
   - `gradReview`, a post-graduation check 30 days out (`gradReviewDays`) with the verdicts held, partial and lapsed.
5. **Hand-off.** The brief gives "Hand-off goals are the free-text `promisedOutcomes` on a form labelled 'Sales
   handoff'". That is confirmed. In addition, partner-led implementation is modelled in `c.implementation`: phase,
   partner, partner contact, target Go-Live, risks and pause, with phases Align, Kick-Off, Build, UAT and Go-Live.
   It has no partner-to-OSM acceptance record (READ; RAN in the walk).
6. **Gainsight CSV import.** The brief gives "a 4-column CSV import". The columns are matched by guessing from the
   headers, not fixed: account name (required), tier or segment, contract value and renewal date (READ).
7. **Research claims in the brief.**
   - "10-12 weeks" comes from the **fund** reporting guide's search snippet only.
   - "Initial Value Moment" was not found on the Gainsight blog page that was read.
   - The public SOW is for Workiva **Audit Management**, not Sustainability.
   - The Factbook tab names, the CDP/ESRS alignment and the roll-forward steps were not confirmed.
   - See the research section below.
8. **One of the walk's own labels.** The walk table rates the account-creation goal gap "costs time" (row 1) and the
   goal-connection gap "blocks" (row 21). This list merges them as G02 and G03 at "blocks". The underlying defect is
   that the goal has no field, and that blocks every later step that would test the goal.

## Open questions only Ian can answer

1. **Is "publish this year's CSRD report" a realistic goal?**
   - The public research (one fetched law-firm summary, Morgan Lewis, March 2026, agreement stage; plus search
     snippets) says the Omnibus agreement narrows CSRD scope and moves first reports for EU companies to FY2027,
     published 2028.
   - If so, a new 2026 customer's "publish FY2026 CSRD report" goal fits only a company already reporting
     (wave 1) and still in scope. For most new customers the first-year goal is likely voluntary or another
     framework (GRI, SASB, ISSB or CDP), or "set up to publish next year".
   - Does that match what Ian sees at hand-off?
2. **What is the spine: the hand-off goal or the report year?** One option is goal → sessions and deliverables →
   readiness gates → One Document verdict. The other hangs everything on the reporting year and its roll-forward.
3. **What counts as graduation evidence?**
   - Is a deliverable the customer demonstrated enough, or must the report or program artefact exist?
   - Is "set up to publish next year" a pass?
   - What does an early exit need recorded?
4. **AI and data policy.** May customer names, contacts, notes and call transcripts go to a third-party model on a
   personal key? Which providers and tiers are allowed? Is redaction required? This gates G01 and the step 4 pilot.
5. **What does the partner hand over today?** Is it a document, a meeting, a Gainsight record or nothing? This
   settles G02 and G14.
6. **Which Gainsight fields must the OSM keep current?** Success plan, CTAs, timeline and health. Do the 3 items per
   call and 3 min per item match reality? This settles G07, G15 and the 90 min estimate.
7. **What does the long-term CSM actually receive and read?** This settles G05.
8. **Will OSMs share one curriculum?** If so, who owns edits? This settles G17.
9. **How is the ~5 h/week admin split** between Gainsight, the spreadsheet, Outlook and Smartsheet? It is needed to
   say what the tracker removes.

## What the public research supports

Labels:
- CONFIRMED: page text read.
- SNIPPET: search-result summary only.
- NOT CONFIRMED: not found or not reachable.

workiva.com and support.workiva.com returned 403 to fetches. Detail is in `lw\03-research.md`.

| Claim | Source | Mark |
|---|---|---|
| Implementation runs about 10-12 weeks: kickoff/discovery wk 1-4, build/UAT wk 5-8, templates wk 9-10, training/go-live wk 11-12; customer commits 1-2 days/week from 2-3 people (fund reporting) | workiva.com/resources/implementing-workiva-fund-reporting-practical-guide | SNIPPET |
| The same arc in the financial-reporting guide | workiva.com/resources/implementation-guide-workiva-financial-reporting | NOT CONFIRMED (listing only) |
| A partner SOW has 5 phases (Align, Solution, Build, Test, Go-Live). Go-Live means the implementation is complete and the solution "will be supported by Workiva's Customer Success and Support teams". UAT acceptance ends vendor build changes. It includes "deemed complete" clauses. The customer owns end-user training "with support from their Customer Success Manager" | trs.ky.gov/wp-content/uploads/2025/12/Atikin-Workiva.pdf (Audit Management, not Sustainability) | CONFIRMED |
| The Sustainability Program organizes material topics → metrics, automates data collection tasks and aligns metrics with framework disclosures. It ships with SASB, GRI Universal and TCFD-based topics | support.workiva.com articles 7460009877012, 4412844707604 | SNIPPET |
| Data Collection spreadsheet (by topic and year) → Factbook (topics, metrics, aggregations, framework indices) | same | SNIPPET |
| CDP and ESRS alignment; Factbook tab names (Admin, Source, Templates, Performance Tables, Framework Indices); report linked to Factbook; year roll-forward steps | support.workiva.com (incl. 4418389230356) | NOT CONFIRMED |
| Onboarding builds early wins and ends by moving the customer to long-term success management; "co-create success plans" with goals, milestones and measures | gainsight.com/blog/customer-onboarding/ | CONFIRMED |
| "Initial Value Moment" as hand-off wording | same | NOT CONFIRMED |
| A Gainsight Success Plan = Objective CTAs + tasks, with fields Name, Company, Relationship, Type and Status | support.gainsight.com Success Plan docs | SNIPPET |
| A plan is carried from pre-sales through onboarding to the CSM | gainsight.com/…/onboarding-success-plan-for-new-customers/ | NOT CONFIRMED |
| Stop-the-clock Directive (EU) 2025/794 delays wave 2 by 2 years | Simmons & Simmons, Baker McKenzie, Sidley (search summary) | SNIPPET |
| The March 2026 Omnibus agreement narrows CSRD scope (about EUR 450m turnover and 1,000 employees; AND/OR unclear in the summary). EU companies first report FY2027, published 2028; non-EU groups FY2028, published 2029; the wave structure is removed | morganlewis.com/pubs/2026/03/eu-institutions-agree-substance-related-amendments-to-csrd-and-csddd-under-esg-omnibus | CONFIRMED (fetch summary of an agreement-stage article; final adopted text not checked) |

Research informs the design talk; it does not decide it. Adopting any external term, such as "Initial Value Moment",
"success plan" or "program readiness", is Ian's call in step 3.
