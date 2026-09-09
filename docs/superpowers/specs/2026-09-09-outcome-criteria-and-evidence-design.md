# Making the Outcome Number Mean Something — Criteria, Evidence, and a Graduation Verdict

Date: 2026-09-09
File: `osm-book-of-business-tracker-1.0.html`
Baseline: the file at the head of `today-tab-phases-1-2` (12 commits, suite 324/324).
**This work starts from a fresh branch after that one merges.** It is independent of
Phases 3–4 of `2026-09-09-today-tab-account-read-design.md` and does not depend on them.

## Problem

The file already claims this feature exists. `ADMIN_GAP_DEFS`, line 5113:

```js
{key:'outcome', label:'No Success Outcome Plan', editor:'outcome',
 why:'The numbered outcome is what graduation is judged against.',
 missing: c => !(c.compliance && c.compliance.outcomePlan && c.compliance.outcomePlan.done)},
```

**It states that the numbered outcome is the graduation criterion, and then checks a boolean.**

Traced every read of `outcomeNumber`: lines 14393, 15868, 17109 and 17161 — all `<select>`
selected-state or a name lookup against `DEFAULT_OUTCOME_NAMES`. Two writes (6121, 19474),
one migration (21237). **Nothing reasons over it.** No signal consumes it, no risk
calculation, no graduation logic. There is no graduation verdict function at all —
`graduationDurability()` is a portfolio-level "did it hold afterwards" metric. Graduation
is a stage a human sets by hand.

Meanwhile the raw material for a real answer is already in the file, disconnected:

| What exists | Where | What's wrong with it |
|---|---|---|
| Success criteria, per module, already written | `template.deliverables[]` — **12–15 per module**, split `ttfv1` / `ttfv2` | Not connected to the outcome |
| Per-account completion tracking, wired to real checkboxes | `sessionNotes[n].deliverables{}` (render 17895, write 19715) | A bare boolean, **keyed by the label string** |
| An evidence array | `getFirstValue().evidence[]` | Never used as evidence |

Measured deliverable counts: Sustainability 15 (9/6), Carbon 15 (9/6), GRC 15 (11/4),
Financial Reporting 13 (8/5), Sustainability + Carbon 12 (7/5). Exactly **one** deliverable
per module matches `/milestone/i`, so the existing milestone regex (line 6296) is too sparse
to serve as a criteria subset.

So this is not "add an outcome model." It is: **connect three things that already exist, and
make the file's own claim true.**

## Decisions

Each was put to the user and chosen explicitly.

| Decision | Chosen | Rejected |
|---|---|---|
| Criteria source | Derived from module deliverables, per-account override | Deliverables only, no customization; authored per account from scratch |
| Graduation | Verdict with recorded override | Hard gate; advisory only |
| Evidence | The tick becomes a record — date, source, optional link | Boolean tick; tick plus optional evidence where the verdict still counts ticks |
| Data model | One evidence store keyed by criterion id | Leave evidence in session notes; a full `c.outcome` object |

`c.outcome` was rejected because `compliance.outcomePlan.outcomeNumber` already exists and is
written from three UI surfaces. Two homes for one fact is the parallel-state split this file
avoids elsewhere.

## 1. Criterion identity — the load-bearing decision

`sessionNotes[n].deliverables` is keyed by prose. Reword a template deliverable and every
account's tick for it is silently orphaned. Today that loses a checkbox. Once graduation
depends on it, **it silently un-graduates accounts**, which is the failure this whole design
exists to prevent.

Ids are therefore **opaque and assigned at materialization**, never positional:

- An unmaterialized derived criterion has a **provisional display key** `s<session>#<index>`.
  It is used for rendering and DOM attributes only, and is **never stored**.
- **The first evidence write materializes it** into `c.outcomeCriteria.items[]` with a freshly
  generated opaque id: `{id:'oc_<8 hex>', text, stage, sourceSession, sourceIndex}`. `text` is a
  snapshot of the wording it was evidenced against.
- A **custom** criterion gets the same shape with no `sourceSession`, materialized immediately.
- Evidence is keyed by the opaque id **only**.

Derivation matches a materialized item back to a template deliverable by
`(sourceSession, text)` first, falling back to `(sourceSession, sourceIndex)`.

Why opaque rather than positional or hashed. A hash of the label breaks on rewording. A
positional id breaks two ways: inserting a deliverable mid-list shifts every later criterion's
identity, and — worse — the newly inserted one *collides* with the materialized id of the
criterion that used to sit there, silently inheriting its evidence. An opaque id assigned once,
paired with a text snapshot for re-matching, breaks on neither. It also lets the panel say
something true — *this account was evidenced against this wording* — when the curriculum has
since changed underneath it.

An unevidenced derived criterion stays purely derived. Nothing is stored until it earns storage.

## 2. Deriving the criteria list

```js
outcomeCriteriaFor(customer) → [{id, text, stage, source, evidence}]
```

PURE. No writes.

- Walk `getSessionTemplateSet(customer)` — it already clamps to the account's own
  `totalSessions`, so an 8-session account derives from its eight sessions, not twelve.
- Each template's `deliverables[]`, in order. `stage` is that template's `ttfvStage`.
- Match each derived deliverable against `c.outcomeCriteria.items[]` by `(sourceSession, text)`,
  falling back to `(sourceSession, sourceIndex)`. A match yields the materialized item — its
  opaque id and its stored text — in place of the derived one. **A materialized entry's stored
  text wins over the template's current wording**, because that is what the evidence attests to.
- A materialized item that matches no current deliverable still appears: its source deliverable
  was deleted from the curriculum, and discarding an evidenced criterion because a template
  changed would lose a human's assertion. It renders as `'no longer in the curriculum'`.
- Exclude ids in `c.outcomeCriteria.removed[]`.
- Append custom items with no `sourceSession`.

`source` is `'curriculum'`, `'curriculum (reworded since)'`, or `'added for this account'` — so
the panel can label where a criterion came from.

## 3. Evidence

```js
c.outcomeEvidence = {
  "s3#0": {on:'2026-06-14', by:'customer', activityId:'act_88', note:''},
  "s1#1": {on:null, by:'unknown', legacy:true}
}
```

- `on` — ISO date, or `null` for a migrated tick whose date was never captured.
- `by` — `'customer'` (they demonstrated it), `'osm'` (observed or done for them), `'unknown'`.
- `activityId` — optional link to the activity that proves it. Activities already carry
  summaries, checklists, flags and attached transcripts.
- `legacy: true` — this tick predates evidence tracking. **Never invent a date for one.**

A criterion is **evidenced** when an entry exists. `on === null` still counts as met — the tick
was a real human act — but the UI shows it as *met, date unknown*, and the verdict reports the
count separately so the gap is visible rather than papered over.

**Un-ticking deletes the entry**, and leaves the materialized criterion in place. The criterion
keeps its opaque id and its text snapshot, so re-ticking it later reuses the same identity
rather than minting a second one. Deleting the entry rather than storing `{met:false}` keeps
"evidenced" a single question — does a record exist — instead of two.

## 4. The verdict

```js
outcomeVerdict(customer) → {
  outcomeNumber, outcomeName,
  ttfv1: {met, total}, ttfv2: {met, total},
  unevidenced: [{id, text, stage}],
  undated: n,
  gates: {gradDate, csat, sentiment},   // the existing ADMIN_GAP_DEFS three
  openBlockers: n,
  state: 'ready' | 'not_ready' | 'unknown',
  reasons: [string]
}
```

PURE. Stores nothing — no cached verdict anywhere.

`state` is **`'unknown'` when no `outcomeNumber` is selected**, never `'not_ready'`. That is the
file's existing absence-versus-negative-evidence principle: an unassessed readiness domain is
not low readiness, and an unchosen outcome is not a failed one.

`'ready'` requires: every criterion evidenced, all three compliance gates done
(`outcomePlan`, `associatedPeopleCSAT`, `sentiment`), a committed `targetGraduationDate`, and
`openBlockers(customer).length === 0`. Anything else is `'not_ready'`, with `reasons` naming
each unmet condition. `reasons` is ordered most-blocking first and is what the UI prints — the
verdict never renders a bare state without them.

## 5. First Value becomes derived

`getFirstValue()` keeps its returned shape. It gains one derived path: when every `ttfv1`
criterion is evidenced and `fv.achievedOn` is not set by hand, `achievedOn` is the latest
evidence date among them (or `null` if all are legacy).

**A manually recorded `achievedOn` always wins.** The tracker does not overwrite a date a human
asserted.

This turns a hand-maintained field into a self-maintaining one, and it is the reason to group
criteria by `ttfvStage` rather than inventing a new grouping.

## 6. Graduating anyway

Setting the stage to `graduated` while `state !== 'ready'` asks for a reason and records:

```js
c.graduationOverride = {on:'2026-10-14', reason:'…', unevidencedIds:[…], state:'not_ready'}
```

The snapshot of what was outstanding at the moment of the decision is the point — the record
says what was accepted, not merely that something was.

This follows the pattern the Risk workflow already establishes: the machine proposes, the human
adjudicates, and the adjudication is kept.

## 7. Making `ADMIN_GAP_DEFS` true

Add a fifth gap definition:

```js
{key:'criteria', label:'Outcome criteria unevidenced', editor:'criteria',
 why:'The numbered outcome is what graduation is judged against, and these are what it is judged on.',
 missing: c => outcomeVerdict(c).unevidenced.length > 0}
```

The existing `outcome` def stays — `outcomePlan.done` still means "a plan was created", which
is a different fact from "its criteria are met". Its `why` line becomes true rather than
aspirational, because the number now drives a verdict.

This raises the admin gap count. Expected and stated, not silently absorbed.

## 8. Repointing the session checkbox

Lines 17895 (render) and 19715 (write) move from `note.deliverables[label]` to the evidence
store, so there is **one truth**. The checkbox keeps working and starts writing richer records:
ticking it stores `{on: todayISO(), by:'osm'}` by default, with a control to mark it
customer-demonstrated and to link the activity.

**Reads must stay pure.** The `readSessionNote` / `getSessionNote` split (line 5765) exists
because rendering used to materialize empty note records; v97 made that a rule. Any new read
path follows it.

## 9. Migration — schema 11 → 12

For each customer, for each `sessionNotes[n].deliverables` entry that is `true`:

1. Match the label against that session's template `deliverables[]`.
2. **Matched:** materialize the criterion (id `s<n>#<index>`, text snapshot) and write
   `c.outcomeEvidence[id] = {on:null, by:'unknown', legacy:true}`.
3. **Unmatched** — the label is no longer in the template, so this tick was *already* orphaned
   before this change: preserve it as a custom criterion carrying the original label, evidenced
   and legacy. Nothing a human ticked is discarded.

`sessionNotes[n].deliverables` is **left in place, unread**, for this release. Deleting user
data during a migration, in an app whose only persistence is `localStorage` and whose automatic
backup is one-click-per-session by browser constraint, is not a risk worth taking to tidy a
field. A self-check asserts nothing reads it, so it cannot quietly come back to life.

`CURRENT_SCHEMA_VERSION` goes to 12 with a numbered step in `migrateData()`, matching the
eleven that precede it.

## 10. Where it surfaces

Deliberately narrow. Three surfaces, in this order:

1. **The account's Overview panel** — the criteria list grouped by stage, with evidence detail
   and the verdict. This is the one that must exist.
2. **The session UI** — the repointed checkbox (§8).
3. **`Records to bring up to date`** — the new gap def (§7); and the graduation override (§6).

**Not in this spec:** the Today beat. Phase 3 of the other spec builds a computed account read
that will want the verdict as one of its findings, and wiring it twice is waste. The verdict
function is the interface; that spec can consume it.

## 11. Self-checks

TDD. Written first, each demonstrated failing before its implementation. The suite starts at 324.

**Load-bearing:**

1. `outcomeCriteriaFor()` and `outcomeVerdict()` are PURE — running each twice against a frozen
   book yields byte-identical output and writes nothing. (The v61/v97 class of bug: rendering
   and reading used to stamp state.)
2. **Rewording a template deliverable does not orphan materialized evidence.** Materialize,
   reword the template, assert the evidence still resolves and the panel reports "reworded since".
3. **Inserting a deliverable mid-list neither moves nor inherits existing evidence.**
   Materialize `s3#1`, insert a new deliverable at index 0 of session 3, assert the original
   evidence still resolves to its original text and the newly inserted criterion is unevidenced.
   This is the collision a positional id would cause — the new criterion silently inheriting the
   old one's evidence — and it is the reason ids are opaque.
4. `state` is `'unknown'` — never `'not_ready'` — when no `outcomeNumber` is selected.
5. Migration: a `true` tick becomes legacy evidence with `on:null`; an unmatched label is
   preserved as a custom criterion, not dropped. Assert on a book carrying both.
6. **No migrated evidence is given an invented date.** Every legacy entry has `on === null`.

**Behavioural:**

7. Criteria derivation clamps to `totalSessions` — an 8-session account yields no `s9#*` ids.
8. All `ttfv1` criteria evidenced → `getFirstValue().achievedOn` is derived; a manual
   `achievedOn` wins over the derived one.
9. Graduating with unevidenced criteria records an override carrying the outstanding ids.
10. The new gap def raises `adminGapCount()` on a book with unevidenced criteria, and does not
    fire on one where every criterion is evidenced.
11. Nothing reads `sessionNotes[n].deliverables` any more.
12. No check leaks state — the `v74.4` whole-book guard stays green.

**Every new check must be demonstrated failing before it is accepted.** Three of the seven
checks written into the previous plan passed while asserting nothing, and all three went green
on their first run; the red-flip requirement is the only reason they were caught.

## 12. Sequencing

| Phase | Delivers | Risk |
|---|---|---|
| **A — the engine** | Criterion ids, derivation, evidence store, verdict, migration, Overview panel (read-only) | **High.** New schema version and a migration over real accounts. Export the book first. |
| **B — capture** | Repointed session checkbox, derived First Value | Medium. Touches a working control. |
| **C — the claim** | Graduation verdict, recorded override, new admin gap def | Low. Additive on top of A. |

Phase A carries all the risk and none of the payoff — it should still ship alone, because a
migration that lands with nothing else in the diff is a migration you can actually review.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Migration corrupts a real 15-account book | Export JSON before running it. Migration only ever adds; the source field is left intact. Check 5 asserts both branches on a synthetic book carrying both shapes. |
| Two accounts on one module share criteria until edited | Accepted — the 18 outcome names are already a fixed corporate vocabulary, so per-module criteria are consistent with that. Per-account override is the escape hatch. |
| 12–15 checkboxes is a lot of surface | Group by `ttfv1` / `ttfv2` and collapse the evidenced ones. Verify the panel at both extremes — an account with zero evidence and one with all of it. |
| Legacy evidence with no date weakens the verdict | Reported separately as `undated`, never hidden. The verdict says how much of its own basis is undated. |
| `graduationOverride` becomes a rubber stamp | Out of scope to police. The record exists so the pattern is visible; if every account carries one, that is a finding about the criteria, not about the feature. |
