# Next session — curriculum authoring, and the outstanding Phase B items

> **Status 2026-09-28 (brainstorm session):** §1 has been brainstormed. Ian answered
> all four questions below, and the answers are recorded in
> `specs/2026-09-28-curriculum-identity-design.md` §1. The work is split into four
> pieces, and piece 1 (stable identity) is specified there. A probe measured a second
> defect, larger than I5: deleting a session silently re-attaches evidence to the
> wrong deliverables (6 per account on the demo book). **Ian approved the spec.
> Next session:** paste `sessions/curriculum-piece-1-plan.md` (plan only). Progress
> is tracked in `2026-09-28-curriculum-LEDGER.md`. Do not brainstorm §1 again. The
> §2 items 2 and 3 are unchanged.

Written 2026-09-28 at the end of the Phase B / v74.5 session, which stopped at its
context limit. Nothing here has been designed yet. The next session starts with
`superpowers:brainstorming` on §1; it is architectural, not bounded.

---

## 1. Curriculum authoring (Ian's ask, verbatim in substance)

> "The Curriculum [should] intuitively be updated by whomever will create or develop
> the curriculum they want to use. What we have now is just a placeholder created
> from Workiva public support documentation I was able to save or scrape, so it may
> eventually become outdated or other OSMs in FR or GRC might want to develop the
> Curriculum differently. I want users to be able to change this to however they
> like but still keep fidelity with the talk track and other parts of informing the
> OSM what is important or needed for that session or call."

### What already exists — do not design from scratch

A curriculum editor is already in Settings, at **`osm-book-of-business-tracker-1.0.html:22521-22694`**
(re-grep `function curKey()`; line numbers drift every commit). It already supports:

- per-module template lists, with a CSRD variant keyed `'<module> (CSRD)'` (`curKey()`, :22521)
- add a session (:22613, :22664), delete a session (:22673)
- edit `title` (:22679), `ttfvStage` (:22684), `enable[]` (:22689), `deliverables[]` (:22694)

So the ask is **not** "build an editor". It is closer to: make the existing one safe,
discoverable, and faithful to the talk track.

### The thing that makes this urgent rather than cosmetic

Phase B made `deliverables[]` **identity-bearing**. They are no longer just text on a
card. Each one derives an outcome success criterion, criteria carry opaque evidence
ids, evidence drives `outcomeVerdict()`, and — as of this session — every `ttfv1`
criterion being evidenced derives the account's First Value date, which feeds
`ttfvDays()` and the portfolio TTFV median.

The final Phase B review measured the consequence (recorded in `VALIDATION.txt`):

| | before edit | after: insert one deliverable **and** reword another, same session |
|---|---|---|
| ttfv1 criteria | 9 | 11 (one new, one duplicated) |
| unevidenced | 0 | 2 |
| Overview badge | `Achieved Aug 21 · derived` | `not yet evidenced` |
| `ttfvDays` | 180 | `null` (drops out of the median) |

**That fires for every account on that module at once, from one Settings edit, with no
warning.** Line 22694 — `deliverables = area.value.split('\n')` — is precisely the
operation that triggers it.

Reassuring, and measured: a **pure insert** keeps every tick (text match wins), and a
**pure reword** keeps evidence, the checkbox, the date, and labels itself
`curriculum (reworded since)`. The spec's central promise holds. The failure needs a
reword **and** a count change in the same session.

So: **curriculum authoring and the parked "I5" defect are one project, not two.**
Designing an inviting authoring UI on top of an identity model that silently drops
evidence would be the wrong order.

### "Fidelity with the talk track" — what that actually means here

A session template is consumed by more than the session card. Before designing, read:

- `buildSessionRunbook(customer, tpl)` — **:3913** — builds the 45-minute run script
- `RUNBOOK_SOURCE_LABEL` — **:3919** — the card shows which source a script came from
- the default templates — **:3514 onward** — shape is `{title, ttfvStage, enable[], deliverables[]}`

The open question the brainstorm must answer: when an author writes their own
curriculum, what happens to the talk track? Does the runbook derive from the
template (so a new session gets a generic script), is it authored alongside, or is
there a third path? `RUNBOOK_SOURCE_LABEL` existing at all suggests the file already
has an opinion about this — read it before asking Ian.

### Questions worth asking Ian (one at a time, per the skill)

1. Who authors — each OSM for their own book, or one person per team publishing a
   curriculum others adopt? This decides whether curricula need identity/versioning
   or stay per-browser like everything else in this app.
2. When an author edits a live curriculum, what should happen to accounts mid-flight
   on it? (The honest options: block, warn-and-proceed, or version the curriculum so
   in-flight accounts keep theirs.)
3. Is the talk track authored, derived, or optional?
4. FR and GRC want *different* curricula — is that a new module alongside the
   existing ones, or a full replacement of the module list?

Do not answer these from the repo. They are product decisions.

---

## 2. Outstanding items from Phase B — Ian asked whether these belong in a new session

**Yes, all of them** — per the standing working agreement, one product / one task /
one session. Suggested grouping and order:

1. **Curriculum authoring + criterion identity (§1).** Architectural. Absorbs the
   parked reword-plus-count-change defect, because they are the same surface.
2. **The two DOM listeners have no coverage.** Small and self-contained. Removing
   `saveData()` from both leaves the suite green at 369/369 — measured twice, and
   recorded in `VALIDATION.txt` under WHAT WAS NOT VERIFIED rather than papered over
   with a source-text scan. Covering it honestly needs a way to exercise a listener
   without `attachEvents()` rebinding the live app; that is the real problem to solve.
3. **The guide still teaches the pre-Phase-B First Value model.** Content authoring,
   not engineering: `osm-runway-onboarding-1.0.html` never mentions deliverable-
   checkbox evidence capture, the customer-demonstrated/we-observed attribution, or
   the derived First Value path. It is *incomplete, not wrong* — an OSM following it
   still gets correct behaviour, because the Log Activity path still works and a
   recorded date still wins. Named in both records.

Also open, from Ian's own field-test memory and not yet scoped: the tracker is
awaiting team approval, so anything that changes stored shape should keep the
"export before you upgrade" discipline Phase A established.

---

## 3. State at handoff

- Branch `master`, tree clean, **no remote configured**.
- Last commits: `db7fc97` (v74.5 liveness proof + VALIDATION history fix), `13aebe3`
  (mid-suite key-leak checkpoint), `53e021e` (`readImpactStore`).
- Suites: seeded **369/369** exit 0; guide **18/18** exit 0; unseeded **365/369**
  with four pre-existing failures that genuinely need a populated book.
- Schema version **12**, unchanged since Phase A. Phase B and the v74.5 work were
  purely additive — no migration outstanding.
- `VALIDATION.txt` is current and states which figures were measured when. Trust it
  over any number quoted in a summary, including this file's.

## 4. One process note worth carrying forward

This session caught **eleven** self-checks that were green while the guarantee they
named was broken, plus three fixtures that never reached the code they claimed to
test. Every one was caught by the same rule, which is now the house rule:

> A new check must be demonstrated FAILING against a mutation of **production** code
> — never against the check's own body. A red produced by editing the check proves
> nothing.

`v74.5` now also proves its own instrument is alive on every run, because a guard
that asserts "this list is empty" passes forever once its recorder stops recording.
