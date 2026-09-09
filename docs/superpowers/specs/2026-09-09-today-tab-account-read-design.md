# Today Tab — Priority Order, the Account Read, and the Editable Session Plan

Date: 2026-09-09
File: `osm-book-of-business-tracker-1.0.html`
Baseline: the file as it exists on disk (1.0, 318 self-checks).
Supersedes the ordering decisions in
`2026-08-03-today-tab-redesign-design.md` (v61). The one-row-per-account rule
from that design is **kept**; the chronological timeline it introduced is
**replaced** by priority order.

## Problem

Four faults, reported from real use of the tab.

1. **Gainsight admin sits third from the top.** `renderAdminGaps()` — "Records
   to bring up to date", 49 records across ~13 accounts — renders above the
   day. The least time-critical work on the tab occupies the most valuable
   screen.

2. **Calls are not first.** `buildDayTimeline()` orders beats by the clock:
   calls are fixed points and ranked work fills the measured gaps between them.
   A 15:30 call therefore sits far down the page behind work. But a call is the
   only item on the tab with a hard deadline and another person attached to it.
   Ranked work and calls should be aligned on one axis — priority — and calls
   are the highest priority.

3. **The left column is nearly empty.** `.day-step` is `min-height:72vh` with
   `justify-content:center`, and spends that height on an eyebrow, a name, a
   headline and one reason. The height is load-bearing — it is the scroll
   mechanic that decides which account the right panel shows — but it is paying
   for almost no content.

4. **The right panel states facts, not conclusions.** `renderBeatStanding()`
   gives counts ("10 interactions over 77 days · 5 Calls, 3 Emails") and an
   extract of the last note. Nothing tells the OSM what those facts *mean* or
   what to do about them. The four Gainsight gates render as bare form controls
   with no reason to fill them in and no help filling them in.

## Decisions

Each was put to the user and chosen explicitly.

| Decision | Chosen | Rejected |
|---|---|---|
| Meeting order | Calls first, then work, one priority axis | Chronological spine; hoisted-calls duplicate block |
| Gainsight admin | Keep the card deck, move the section below the day | Convert to full beats (13 extra screens) |
| Session plan edits | Per-account, per-session override | Edit the module template; scratch-notes only |
| Summary | Computed prose, AI narrative on demand | Computed stats only; AI-authored summary |
| CSAT contact | Champion stakeholder, **plus** extended CSV import | Champion only; a new dedicated POC field |

## 1. Ordering — `buildDayTimeline()`

The day becomes a priority order.

```
CALLS   timed in clock order, untimed after them by name   (existing rule, unchanged)
WORK    ranked work in todayActionList() order             (existing rule, unchanged)
```

Movements collapse from the chronological set (`preface` / `call` / `gap` /
`after` / `run`) to two: **"Your calls today"** and **"Everything else needing
you."** `DAY_MOVEMENT_MAP` is reduced accordingly.

`fitBeatsToSlots()` is **kept but demoted from structure to annotation.** Where
two calls bound a real gap, each work beat placed in that gap carries one line:

> fits your 13:00–15:30 gap · ~25 min

The minutes guidance survives; it no longer dictates page order. If a beat
falls in no measurable gap the line is omitted — never guessed.

**Preserved invariants.** One beat per account (`v61 one Today row per
account`). An account with a call today that also has gates outstanding remains
a **call** beat with the gates in its panel. Calls are never dropped by the
`DAY_BEAT_MAX` cap; work is, and the cap says what it hid.

**Self-check impact.** `callsScheduledToday()` ordering is asserted directly
against that function, not against the timeline's movements, so the existing
call-order check is unaffected.

## 2. Section order — `renderToday()`

| Position | Now | After |
|---|---|---|
| 1 | Standing | Standing *(compressed)* |
| 2 | Readiness strip | Readiness *(compressed to one line)* |
| 3 | **Records to bring up to date** | **The day — calls, then work** |
| 4 | Resolved / paused / risk strips | Below the day |
| 5 | The day | Resolved / paused / risk strips |
| 6 | Below the day | **Records to bring up to date** |
| 7 | The close | The close |

The readiness strip keeps its position above the day. This preserves the v87
ruling — *"first, before anything the tracker claims to know about the book"* —
because it is a caveat on the truth of everything below it. It is compressed to
a single line plus its action so that the standing and the readiness strip
together do not consume the first screen. **Target: the first call beat is
visible without scrolling at 900px viewport height.**

## 3. The beat — left column

`min-height:72vh` **stays.** `justify-content` changes `center` → `flex-start`
with top padding, so beats stop shifting vertically as content length varies.

```
3 OF 12 · 13:00 CALL
Corvus Group
──────────────────────────────────────────────
STATE          Needs Attention · 61% health
WHY            · Session 2 due, none logged in 19 days
               · You owe them the connector list (11d)
               · Sentiment never captured
WHAT DO I DO   Run Session 2 and close the connector promise
OUTSTANDING    2 open questions · 3 deliverables
```

- **State** — new `accountStateLabel(c)`, a **display-only wrapper** over
  `computeRisk()` with an explicit mapping:

  | `computeRisk()` | `riskLabel()` (unchanged) | `accountStateLabel()` |
  |---|---|---|
  | `'risk'` | Off Track | **Off Track** |
  | `'watch'` | Watch | **Needs Attention** |
  | anything else | On Track | **On Track** |

  `riskLabel()` keeps its 19 call sites and the `'Watch'`
  string stays intact, because `'Watch'` is also a *comparison value* in the
  risk taxonomy (`item.kind === 'Watch'`, line 13771, written at 13801). A
  global rename would be a string-matching hazard for cosmetic gain.
- **Why** — `beat.reasons`, capped at 4, `+N more` beyond.
- **What do I do** — `beat.headline`, unchanged.
- **Outstanding** — `collectOpenQuestions(c).length` and unchecked checklist
  items across all activities.

Health history, severity basis, signal key and full notes demote to evidence in
the right panel. The current "Why this one" block loses its headline and
drivers to the left column and becomes evidence only — no duplication.

## 4. The beat panel — right column

1. **Header** — name · module · state · health
2. **The account read** — computed prose (§5), with `Write the narrative with AI`
3. **Payload, by beat kind:**
   - **Call** → the session plan, open and editable (§8)
   - **Work** → evidence for the signal, dispatch chips, Done / Not this
4. **Gainsight gates** — outcome plan / CSAT / sentiment, demoted below the plan
5. **Risk** — unchanged

## 5. The account read — computed prose

Replaces the counts-and-extract block. Answers **"what does the OSM need to
know or do?"** in prose, in priority order, with the Gainsight nudges inside
the story rather than beside it as a checklist.

### Structure

A registry, following the established pattern of `TODAY_SOURCE_DEFS` and
`SIGNAL_DEFS`:

```js
ACCOUNT_READ_DEFS = [
  { key, band, order,
    when(c, ctx)    → evidence object | null,   // PURE. no writes.
    prose(evidence) → string,                    // computed sentence(s)
    actions(evidence) → [{label, action}] }
]
```

Two bands, rendered in order:

- **`know`** — what changed, what is unresolved, what the record cannot tell you
- **`before-this-closes`** — the gentle Gainsight nudges

There is deliberately **no `do` band.** "What do I do" is the left column's job
(§3). The read supplies the knowledge and the nudges; the single recommended
action lives on the left and is not repeated here. A finding may still carry
*its own* buttons — those are specific to that finding (upload a transcript,
use outcome 4), not the beat's overall next action.

**Rendering.** Each firing def produces one paragraph, in `order`. Related
findings are **not** merged into shared prose — the worked example below reads
as merged because `flagged_open`, `open_deliverables` and a missing data-role
stakeholder happen to be adjacent and about one subject, but each is emitted by
its own def and could fire alone. Prose templates must therefore read correctly
in isolation.

The `know` band renders at most **4** findings; the rest collapse behind
"+N more". Ordering within the band is by `order`, lowest first.

Every def is pure and testable in isolation. A def that finds nothing returns
`null` and renders nothing — no placeholder, consistent with the v61
hide-when-empty ruling.

### The findings

| Key | Fires when | Prose carries |
|---|---|---|
| `unlogged_session` | A session's scheduled date has passed with no activity logged against it | The date, what the last call said would happen next, and that the tracker cannot tell whether it happened. Actions: **Upload the transcript** · **Log the session** · **Reschedule** |
| `flagged_open` | An activity is flagged and unresolved | How long ago, and the flagged text itself |
| `first_value_unevidenced` | `getFirstValue(c).achievedOn` empty at ≥ 50% of sessions | Sessions done vs total, framed as the halfway mark with nothing to point at |
| `open_threads` | `collectOpenQuestions(c)` non-empty | Each question, when raised, how long unanswered |
| `open_deliverables` | Unchecked checklist items exist | Count, and the oldest |
| `stale_record` | Days since last touch exceeds the account's own cadence | Its cadence vs this gap — a slip measured against itself, not a global threshold |
| `outcome_plan_gap` | `!compliance.outcomePlan.done` | The recommendation and its evidence (§6) |
| `csat_gap` | `!compliance.associatedPeopleCSAT.done` | The champion, offered for one-click use (§7) |
| `sentiment_gap` | `!compliance.sentiment.done` | That it is two questions and two minutes |
| `grad_date_gap` | No `targetGraduationDate` | That the runway is measured against a projection instead of a promise |
| `early_transition` | `projectedGraduationDate(c) < targetGraduationDate` by ≥ 14 days | Pace, projected date, target date, and that CSM transition could be raised early (§9) |

### Worked example

Against JBT Marel Corporation as it stands in the book on 2026-09-09:

```
WHAT YOU NEED TO KNOW

You flagged this account 49 days ago and it has been quiet since. The Jul 22
call — Session 6 — closed by scheduling a follow-up "for next week". That week
passed seven weeks ago and nothing has been logged. Either Session 7 happened
and is unrecorded, or it never happened; both are worth knowing before you dial.

        [ Upload the transcript ]  [ Log the session ]  [ Reschedule ]

Six of twelve sessions in, first value is still not evidenced — the halfway
mark with nothing to point at.

The flag itself is unresolved. Ian asked about database connectors on Jul 22 —
Power BI, Snowflake, Amazon S3 — and said the data team needs to be in the
room. No stakeholder with a data role is recorded here, and 22 deliverables
are still unchecked.

BEFORE THIS CLOSES
Sentiment has never been logged. Two questions, two minutes, and it's the only
one of the four gates still open on this account.

        [ Log it now ]                     [ Write the narrative with AI ]
```

### The AI narrative

`Write the narrative with AI` calls the existing Copilot transport for prose
across the whole history. Cached on the account and invalidated when
`interactionCount` changes, so it cannot go stale silently and does not re-bill
on every scroll. **The computed read is always rendered; the narrative is
additive.** With no API key the panel is complete and correct.

## 6. The outcome plan recommender

`DEFAULT_OUTCOME_NAMES` is 18 outcomes with distinctive vocabulary
(*Reduce Professional Services / Contractor Spend*, *Mitigate Key Person Risk*,
*Establish a Single Source of Truth*). This is tractable without a model, using
the same machinery already proven by `customerKeywordSignal()`.

### Mechanism

New `OUTCOME_SIGNAL_DICT` — for each of the 18 outcomes, a phrase list. Scored
over the account's typed notes **and attached transcripts**:

- A phrase match counts once per activity, not once per occurrence, so one
  chatty transcript cannot dominate.
- Matches age out at `keywordSignalMaxAgeDays`, reusing the existing window
  that stops an old note firing forever.
- **Threshold: ≥ 2 distinct phrases across ≥ 2 separate activities, and the top
  score must exceed the runner-up by ≥ 2.** Below that, no recommendation.

**It says nothing rather than guessing.** A plausible wrong recommendation the
OSM must un-pick is worse than silence. Expected fire rate on real books is
roughly half to two-thirds of accounts.

### Output

Never auto-sets the field. Renders the number, the name, and the citations:

```
No success outcome plan yet. Reading your notes, #4 Reduce Professional
Services / Contractor Spend is the strongest match — "contractor spend"
appears in your Apr 14 and Jun 18 notes, and the Session 4 transcript says
"stop paying the consultants to do this." Three mentions across two months,
nothing competing.

        [ Use outcome 4 ]  [ Pick another ]  [ Ask AI to choose ]
```

`Ask AI to choose` is the escalation for accounts under the threshold. It
returns the **same shape** — a number and its reason — so the UI does not
branch on provenance, and the panel labels which it is showing.

## 7. CSAT contact — champion, and the CSV

The CSAT survey contact is in practice the customer POC, which the file already
models as the stakeholder with role `champion` (v67 replaced a free-text
`primaryContact` with this list, deliberately).

- **In-panel:** when the gate is open and a champion exists, the prose names
  them and offers one-click fill.
- **No champion recorded:** the prose asks for one instead — a gap worth
  surfacing on its own.

### CSV import extension

`CSV_VALUE_FIELDS` gains two entries; `guessValueColumnMapping()` gains their
header heuristics:

```js
{key:'contactName',  label:'Primary contact',       guess:['contact name','primary contact','poc','champion','contact']},
{key:'contactEmail', label:'Primary contact email', guess:['contact email','email','e-mail']}
```

**One row per account, carrying that account's own contact.** A 15-row export
fills 15 accounts, each with its own champion. Nothing is shared between
accounts.

The importer is already mapping-driven with a diff preview that reads the same
pure function the commit does, so no new import UI or matching logic is needed.
**One wrinkle:** existing fields are scalars; a champion is a record in a
collection. `buildValueImportRows()` must render this change shape as
`Champion: (none) → Divyang Sharma` and must **not** clobber an existing
champion without showing the replacement in the preview.

Existing CSVs without contact columns continue to work — the fields map to
nothing, which the mapping UI already handles.

## 8. The session plan — per-account, editable

Curriculum today is **per-module**: `DATA.config.sessionTemplates[module]`,
shared by every account on that module. There is no per-account override
anywhere in the file. Editing on Today must not rewrite twelve other accounts'
plans.

### Resolution order

Extends the existing three-source chain (`template.runbook` →
`RUNBOOK_LIBRARY` → `generateStandardRunbook()`) with a fourth, highest-
precedence source:

```
c.sessionPlans[n]  →  template.runbook  →  RUNBOOK_LIBRARY  →  generateStandardRunbook()
```

`resolveRunbook()` gains the per-account check at the top. The panel labels
which source it is showing, as it does today.

### Editing

In-place editing of segment time, title, talk track and steps; add, remove and
reorder segments. First edit materialises the resolved plan into
`c.sessionPlans[n]`, so editing a generated scaffold is identical to editing an
authored one. `Revert` deletes the key and falls back through the chain.

**A plan edit must never write to `DATA.config.sessionTemplates`.** This is the
load-bearing guarantee of the whole feature and gets its own self-check.

### Carry-forward

When a session is logged with unchecked deliverables, the next session's plan
offers those items as a carry-forward segment the OSM can accept or dismiss.
Accepting materialises the override. **Offered, never auto-inserted** — the
OSM decides what the next call covers.

## 9. Early CSM transition signal

`projectedGraduationDate(c)` exists; line 5781 already asks whether projected
is *later* than target. The inverse is the signal.

Fires when projected is **≥ 14 days earlier** than `targetGraduationDate`, on
an account with ≥ 3 sessions logged (below that the projection rests on too
little). Renders in the `know` band:

> You're running ahead: 8 of 12 sessions done, projected to finish Oct 14
> against a target of Dec 1. If the pace holds this is ready for CSM transition
> about seven weeks early — worth raising now rather than at the end.

Read-only prose. It does not move the target date; that stays the OSM's call.

## 10. Data model

```js
c.sessionPlans = {                 // per-account, per-session curriculum override
  "2": { segments:[{m,title,talk,steps:[]}], editedOn, basedOn:'library'|'template'|'generated' }
}
c.recordNarrative = { text, generatedOn, interactionCount }
```

Absent means *fall through to the module template* — the same contract as the
file's other optional per-account collections. **No schema migration and no
`CURRENT_SCHEMA_VERSION` bump.** `backfillCustomerRecord()` is unchanged;
both keys are read defensively at their call sites.

The CSV extension writes a **stakeholder record**, an existing shape. No new
storage.

## 11. Self-checks

Written first, TDD. Current suite is 318 and must stay green.

**Load-bearing:**

1. Editing a session plan never mutates `DATA.config.sessionTemplates` — deep
   equality before and after an edit, on a book with two accounts sharing a
   module.
2. Revert restores the module template exactly.
3. Calls always rank above work in `buildDayTimeline()`, across book shapes:
   no calls, calls only, calls + work over `DAY_BEAT_MAX`.
4. One beat per account still holds.

**Structural:**

5. Every beat renders a state, a why, and an action — none blank.
6. `renderAdminGaps()` appears after `renderDay()` in `renderToday()` output.
7. Movements reduce to at most two.

**The read:**

8. Every `ACCOUNT_READ_DEFS` entry is pure — running the full read twice
   against a frozen book yields byte-identical output and writes nothing.
   (Guards the v61 class of bug where rendering Today stamped `DATA.riskLog`.)
9. The read completes with no API key present.
10. The narrative cache invalidates when `interactionCount` changes.
11. The outcome recommender returns nothing below threshold.
12. The outcome recommender cites only text that exists in the record —
    every citation is verifiable against a note or transcript.
13. `early_transition` never fires below 3 logged sessions.

**Import:**

14. A CSV without contact columns imports exactly as it does today.
15. An import that would replace an existing champion shows the replacement in
    the preview before committing.

## 12. Sequencing

This is too large for one implementation plan. It decomposes into four phases,
each independently shippable with the suite green. **Phases 1 and 2 deliver the
layout the user asked for; 3 and 4 deliver the intelligence.** Ship in order.

| Phase | Delivers | Sections | Risk |
|---|---|---|---|
| **1 — Order** | Calls first, admin to the bottom, movements reduced | §1, §2 | Low. Reordering and deletion; no new data. |
| **2 — The beat** | Left column restructured, panel reordered, duplication removed | §3, §4 | Low. Presentation only. |
| **3 — The read** | `ACCOUNT_READ_DEFS`, computed prose, AI narrative, early-transition signal | §5, §9 | Medium. New registry, but pure functions. |
| **4 — Assist** | Outcome recommender, CSAT champion fill, CSV extension, editable session plan | §6, §7, §8 | High. New data model, new import shape, the no-clobber guarantee. |

Phase 4 is the largest and could split again — the session plan editor (§8) is
independent of the recommender and CSAT work (§6, §7) and shares no code with
them. Split it if phase 4 runs long.

Each phase runs the full suite before the next begins. **No phase lands with
the suite below its starting count.**

## 13. Out of scope

- Renaming `'Watch'` globally. Display-only wrapper instead; see §3.
- Converting admin-only accounts into beats. Deck stays; see Decisions.
- Any Gainsight *transport*. `syncGainsightQueue()` remains a seam with nothing
  behind it, and the UI must keep saying so.
- Editing curriculum for the whole module from Today. That stays in Settings.

## 14. Risks

| Risk | Mitigation |
|---|---|
| Outcome recommender fires on weak evidence and the OSM trusts it | Hard threshold; cites verbatim evidence; never auto-sets; self-check 12 |
| The read becomes a wall of text on a troubled account | Bands are ordered and capped; `know` shows at most 4 findings, rest behind "+N more" |
| Per-account plans drift from an improved module curriculum | Panel labels the source and offers revert; drift is visible, not silent |
| The left column still under-fills on a clean account | A clean account has few findings by definition — verify the layout at both extremes before claiming done |
| 318 checks make a large refactor risky | Checks written before implementation; suite run after each section, not once at the end |
