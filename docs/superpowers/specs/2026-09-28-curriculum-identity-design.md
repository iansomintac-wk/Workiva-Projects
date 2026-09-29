# Curriculum Authoring — Umbrella, and Piece 1: Stable Identity

Date: 2026-09-28
File: `osm-book-of-business-tracker-1.0.html`
Baseline: `d8266be` on `master` (suite 369/369 seeded, schema 12).
Brief: `docs/superpowers/next-session-curriculum-authoring.md`.
Probe: `docs/superpowers/specs/2026-09-28-curriculum-identity-probe.js` (see §5).

This document does two things. §1–2 record Ian's product decisions and split
curriculum authoring into four pieces, each of which gets its own spec, plan
and build. §3–6 specify **piece 1 only**. Pieces 2–4 are outlined, not
designed.

---

## 1. Decisions (Ian, 2026-09-28, this session)

| # | Question | Answer |
|---|---|---|
| 1 | Who authors a curriculum? | **Both.** A team publishes a base curriculum, and each OSM can still tweak their own copy. |
| 2 | What happens to in-flight accounts when a curriculum changes? | **Pin; offer upgrade.** An account stays on the version it started with. Moving it to a newer version is a deliberate step with a preview. |
| 3 | Talk track: authored, derived, or optional? | **Authored, scaffold default.** The script is part of the curriculum. A new session starts from the generated scaffold, which the author can edit. The card keeps saying which source it is showing. |
| 4 | Do FR/GRC get new modules or a replacement set? | **Curricula are per module.** A module can have several curricula, and each account picks one. The module list stays the product taxonomy. |
| — | Approach and order | **Approach A (stable ids), pieces in the order below.** |

## 2. Decomposition

1. **Stable identity (this spec).** Sessions and deliverables carry opaque ids.
   Criteria, and anything else that is per session, match on those ids instead
   of text or position. Every later piece depends on this: versioning, forking
   and upgrade previews all need to say which deliverable in v3 is the same
   deliverable as one in v2, and only an id answers that without guessing.
2. **Curriculum as a versioned object.** Shape: `{id, module, name, version,
   basedOn:{id, version}|null, sessions[]}`. Each account stores `curriculumRef
   {id, version}`. Today's `sessionTemplates[module]` become one "Workiva
   placeholder" curriculum per module. `'<module> (CSRD)'` becomes a variant
   curriculum, not a key convention. Schema bump with export-before-upgrade.
   Decision 2 (pinning) lives here.
3. **Authoring UI.** Edit a draft, then publish it as a new version. Adds an
   inline runbook editor that starts from `generateStandardRunbook()`
   (decision 3), and an impact line before publishing ("N accounts on this
   curriculum stay on vN until upgraded").
4. **Share, fork, upgrade.** Curriculum export and import as its own file. A
   fork records `basedOn`, and an incoming team version reconciles with local
   edits by deliverable id (decision 1). A per-account upgrade shows which
   criteria carry over, which are new and which are dropped, and which
   evidence moves.

Each piece should leave the app shippable on its own. Piece 1 alone already
fixes both measured defects in §3, with no versioning.

---

## 3. Piece 1 — the problem, measured

### 3a. Deleting a session misattributes evidence (new; measured today)

`outcomeCriteriaFor()` (`:5994`) matches stored criteria only within the same
`sourceSession` **number**. The editor's *Remove* button (`:22671`) is a bare
`splice` with no confirmation, so it renumbers every later session.

Probe on the demo book, 2026-09-28. Module Carbon, every criterion on its
6 non-CSRD accounts given evidence (66 records), then session 2 deleted in
memory:

| per account (all 6 identical) | before | after deleting session 2 |
|---|---|---|
| evidenced criteria still in the curriculum | 11 | 8 |
| of those, labelled `curriculum (reworded since)` | 0 | **6** |
| `no longer in the curriculum` | 0 | 3 |
| unevidenced | 0 | 3 |

Controls: a no-op re-assignment changed 0 accounts. Deleting the last session
changed 0 accounts, because it lies beyond these accounts' `totalSessions` (8).

The 6 "reworded" rows are the serious finding. Old session 3 became session 2
and has the same deliverable count, so pass 2 (index) attached old session 2's
evidence to old session 3's deliverables. The UI then presents that as a
harmless reword. This is **silent misattribution**, not loss: the evidence is
attached to the wrong deliverable, and nothing flags it.

### 3b. Reword plus count change in one session (I5; read, not re-measured)

From `VALIDATION.txt` (Phase B final review). I have not re-run it. Piece 1's
first plan task reproduces it before changing anything:

| | before | insert one deliverable and reword another |
|---|---|---|
| ttfv1 criteria | 9 | 11 (one new, one duplicated) |
| unevidenced | 0 | 2 |
| `ttfvDays` | 180 | `null` |

### 3c. Renaming a session drops its authored talk track (measured today)

`authoredRunbookFor()` (`:3901`) looks up `RUNBOOK_LIBRARY` by module and
exact title. Probe: Carbon session 1, runbook source `authored` → after
appending " (renamed)" to its title → `standard`. The card relabels itself,
but nothing warns the author, and the full script is gone.

### 3d. Session notes are positional (read, not measured)

`customer.sessionNotes[sessionNumber]` (`:6267`) holds prep notes and
per-deliverable ticks. By reading the code, the same delete in 3a would move
session 4's notes under session 3. The plan's first task measures this
together with 3b.

### The root cause of all four

The textarea editor (`:22692`, `deliverables = area.value.split('\n')`) and
`splice` **cannot express identity**. After an edit, the app has only text
and position to go on, and a combined edit is genuinely ambiguous. Better
heuristics can't fix this, because the information was never captured.

---

## 4. Piece 1 — design

### 4a. Ids on the template

- Every session template gets `id` (`'ss_' + 8 hex`), and every deliverable
  gets an id in a parallel array, `deliverableIds[]`, the same length as
  `deliverables[]`. `deliverables[]` **stays an array of strings**, because
  the runbook generator, the script export, the card and the AI review all
  read it as strings. Changing its element type would touch every consumer
  for no gain.
- A single writer, `setSessionDeliverables(tpl, rows)`, where `rows` is
  `[{id|null, text}]`, is the only code allowed to change either array.
  `id:null` mints a new id. The editor must go through it. A self-check
  asserts that no other code assigns `.deliverables =` on a stored template,
  demonstrated failing against a production mutation that reintroduces the
  textarea split.
- Shipped default templates get **deterministic** ids (for example
  `ss_carbon_01`, `dl_carbon_01_03`), so every browser that ships the same
  default agrees on identity. Pieces 2 and 4 rely on this when a team
  curriculum is based on the placeholder. User-minted ids are random.

### 4b. The editor expresses intent

- **Deliverables:** the one textarea per session becomes one input per
  deliverable, with add, remove and move-up/down buttons. Editing an input is
  a reword and keeps the id. Remove drops the id. Add mints a new one. This is
  the minimum UI change that captures identity. The authoring UI's look and
  flow belong to piece 3.
- **Sessions:** removing a session asks for confirmation and states its
  impact from real data: "N accounts have evidence on this session's
  deliverables; it will show as 'no longer in the curriculum'." Deleting
  stays allowed. Pinning (piece 2) is what protects in-flight accounts.
  Sessions also get move-up/down, which becomes safe once identity is by id.

### 4c. Criteria match by id

- Materialized criterion records gain `sourceSessionId` and
  `sourceDeliverableId`.
- `outcomeCriteriaFor()` gains **pass 0**: match a stored record to the
  deliverable with the same `sourceDeliverableId`, **wherever that
  deliverable now sits** (any session, any index). Records with a
  `sourceDeliverableId` never fall through to the text or index passes. If
  their id is gone, they are "no longer in the curriculum". That rule is what
  closes 3a and 3b.
- Passes 1 and 2 (text, index) stay only for records that have no
  `sourceDeliverableId`, which in practice means none after migration (4e).
  They remain as a defensive bridge for imported legacy exports.
- `source` labelling is unchanged: the stored text differs from the current
  text, so it reads `curriculum (reworded since)`. That label can now be
  trusted to mean a reword.
- Display positions (`sourceSession`, `sourceIndex`) stay derived at render
  time, and `outcomeCriterionKey()` stays display-only, as today.

### 4d. Other per-session data keys by session id

- `sessionNotes` re-keys from session number to session id, with a read
  fallback to the number for unmigrated data. The per-deliverable ticks
  inside a note re-key by deliverable id.
- `authoredRunbookFor()` looks up by session id first and falls back to the
  title. `RUNBOOK_LIBRARY` entries gain the deterministic session id of the
  default they were written for. A rename then keeps the authored script
  (closes 3c). The decision-3 authoring of `tpl.runbook` is piece 3.

The plan's first task greps every read of a session number as a key
(`sessionNotes`, `completedSessions`-style counters, activity-to-session
links) and lists them. Anything positional that it finds and that 4d does not
cover gets added to this spec before building. It does not get quietly
absorbed.

### 4e. Migration, schema 12 → 13

1. Assign ids to every stored template: deterministic ids where the template
   still equals a shipped default by module, session position and title;
   random ids otherwise.
2. For every account, run the **current** matching (passes 1 and 2) against
   the **unchanged** curriculum. That matching is correct at this moment,
   because nothing has been edited mid-migration. Stamp
   `sourceSessionId`/`sourceDeliverableId` onto every stored item it places.
   Items it cannot place are left unstamped and keep their current
   "no longer in the curriculum" state.
3. Re-key `sessionNotes` by session id.
4. It runs with an explicit count and explicit templates, never through
   `getSessionTemplateSet()` on un-normalized fields (the trap recorded in
   the `materializeOutcomeCriterion` comment).
5. Export before you upgrade (the Phase A discipline the brief names).
   **Unverified:** grepping for a pre-migration backup prompt ("before you
   upgrade", "pre-migration", backup plus migrat) found nothing in the app.
   The plan's first task finds out how Phase A actually enforced this: a
   release note, README step, or in-app prompt. If nothing in the app
   enforces it, the task says so, and Ian decides whether piece 1 adds a
   prompt.

**Invariant:** for every account, `outcomeCriteriaFor()` and
`outcomeVerdict()` return deep-equal results before and after migration,
apart from the added id fields. `ttfvDays()` is identical too.
`tools/migration-dryrun.mjs` is written for v11 → v12, so the plan adds a
12 → 13 mode (or a sibling tool) that checks this invariant through the real
import boundary (`prepareBookData`).

---

## 5. Acceptance checks

Each check is a self-check in the suite, and each must be **shown failing
against a mutation of production code** before it counts (house rule, see
the brief §4).

| # | Check | Pass | Mutation that must turn it red |
|---|---|---|---|
| A1 | Delete session 2 on an evidenced Carbon book (3a setup) | 0 `reworded since`, which was 6. Only the deleted session's criteria go to "no longer in the curriculum". Every later criterion keeps its own evidence, verified by id. | Remove pass 0 |
| A2 | I5 reproduction (insert one and reword another in one session) | +1 criterion (the new one), 1 unevidenced, no duplicate, `ttfvDays` unchanged | Mint a new id on reword |
| A3 | Rename a session with an authored script | Runbook source stays `authored` | Remove the id lookup in `authoredRunbookFor` |
| A4 | Reorder deliverables, and reorder sessions | Evidence and notes follow their items | Key notes by number again |
| A5 | Migration invariant on the seeded book with evidence ticked | Deep-equal criteria, verdict and `ttfvDays` before and after; every placed item is stamped | Skip the stamping step |
| A6 | Only `setSessionDeliverables` writes `deliverables`/`deliverableIds` | The arrays always have equal length after any editor action | Restore the textarea `split` handler |
| A7 | Export, then import the v13 book | Ids survive unchanged. A v12 export imports and migrates, satisfying A5. | Drop ids in export |

**Liveness:** A1 and A5 also assert that their setup actually evidenced more
than 0 criteria. The first probe run in this session was green only because
the demo seed has zero evidence (`evidencedByModule: Carbon 0`). A check
without that assertion can pass without testing anything.

Suite after piece 1: 369 + the new checks, seeded, exit 0. Guide suite 18/18
unchanged.

**Reproducing the probe:** concatenate `demo-seed.js` and the probe file into
one seed, then run
`node tools/inspect.mjs osm-book-of-business-tracker-1.0.html --seed <joined> --view dashboard --out <dir>`.
The JSON result is printed on the `seeded …` line.

## 6. Out of scope for piece 1

- Versioning, pinning, `curriculumRef`, and CSRD as a variant (piece 2).
- Draft/publish, the runbook editor, and visual design of the editor (piece 3).
- File sharing, forks, and the upgrade preview (piece 4).
- The two uncovered DOM listeners and the guide's First Value content (brief
  §2 items 2 and 3). They remain separate sessions.
