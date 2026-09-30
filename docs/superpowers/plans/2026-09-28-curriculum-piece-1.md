# Curriculum Piece 1: Stable Identity, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **One plan task per build session.** The session prompts are `docs/superpowers/sessions/curriculum-piece-1-build-N.md`.

**Goal:** Sessions and deliverables in the curriculum carry opaque ids. Criteria evidence, session notes and authored runbooks follow those ids instead of text or position. Deleting, reordering or rewording a curriculum item can then no longer misattribute or drop what an account has recorded.

**Architecture:** Every session template gets `id`. Every deliverable gets an id in a parallel `deliverableIds[]`. One writer (`setSessionDeliverables`) is the only code that changes either array. `outcomeCriteriaFor()` gains pass 0, which matches a stored record by `sourceDeliverableId` anywhere in the curriculum. Text and index matching stay only for unstamped legacy records. A schema 12 → 13 migration stamps existing records using today's matching against the unchanged curriculum, then re-keys session notes by session id.

**Tech Stack:** A single-file HTML/JS app (`osm-book-of-business-tracker-1.0.html`, about 25k lines) with in-page self-checks (`window.runSelfChecks()`). Headless-Chrome runners: `tools/selfcheck.mjs`, `tools/inspect.mjs` and `tools/migration-dryrun.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-28-curriculum-identity-design.md` (§4 design, §5 checks A1–A7). Ledger: `docs/superpowers/2026-09-28-curriculum-LEDGER.md`.

## Global Constraints

- Follow the editing rules in the tracker's header comment (lines 1–45). In particular: targeted edits only; `:root` tokens for all font sizes and colours; structural data changes get a new `CURRENT_SCHEMA_VERSION` plus a `migrateData()` step; do not extend `backfillCustomerRecord` for new-shape changes.
- `deliverables[]` stays an array of strings. Ids live in a parallel `deliverableIds[]` of the same length (spec §4a).
- Id formats: shipped defaults are deterministic, `ss_<slug>_<NN>` and `dl_<slug>_<NN>_<MM>`. `slug` is the template key lowercased with runs of non-`[a-z0-9]` replaced by `_` and trimmed. NN and MM are 1-based and zero-padded to 2. User-minted ids are `ss_` / `dl_` followed by 8 random hex. Validation regexes: `SESSION_ID_RE = /^ss_[a-z0-9_]+$/` and `DELIVERABLE_ID_RE = /^dl_[a-z0-9_]+$/`.
- **House rule for every new check:** it counts only after it has been shown **failing against a mutation of production code**. Never mutate the check's own body. Its setup asserts it evidenced **more than 0** criteria (liveness). Record each mutation proof in `VALIDATION.txt`: the mutation, the red line, and the revert.
- **Line numbers drift.** Every `:NNNN` below is as of `a4f9bb3`. Grep for the symbol.
- **README.txt, VALIDATION.txt and CHANGELOG.txt quote the suite count** (`README.txt:74`, `VALIDATION.txt:48`, `CHANGELOG.txt:36`). A task that adds checks updates all three in the same commit.
- Suite command: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect <N> > $TEMP/sc.log 2>&1; tail -2 $TEMP/sc.log`. Logs go to files, never into context.
- Guide suite (must stay 18/18): `node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18 > $TEMP/g.log 2>&1; tail -1 $TEMP/g.log`
- The fixes in `docs/superpowers/2026-09-22-fixes-LEDGER.md` touch the same file. Whichever lands second rebases and re-runs the suite and the probes.
- Out of scope (spec §6): versioning, pinning, `curriculumRef`, CSRD-as-variant, draft/publish, the runbook editor, the editor's visual design, sharing, forks, and upgrade previews.

## Suite count per task

| After task | New checks | Suite `--expect` |
|---|---|---|
| baseline (measured 2026-09-30) | — | 369 |
| 2 | c2a defaults/ensure-ids, A6 single writer | 371 |
| 3 | A1 delete-session, A2 I5 | 373 |
| 4 | A3 runbook rename, c4b notes follow delete | 375 |
| 5 | A4 reorder, c5b delete impact | 377 |
| 6 | A5 migration invariant | 378 |
| 7 | A7 export/import | 379 |

If Ian accepts amendment M1 (below) as a new task, the counts after it shift. The session doing that task updates this table.

## Pending decisions for Ian (not in the tasks below)

Task 1's measurements found items that §4 does not cover. Per the plan prompt, they go back to Ian as spec amendments and are **not** absorbed into tasks:

- **M1: `activity.sessionNumber` is positional and stored.** Measured: deleting Carbon session 2 moves **32 of 38** session-linked logged calls (6 accounts) under a different session title. The number drives completed count (`sessionsCompletedCount`), next open session (`nextOpenSessionNumber`), the gap signal (`customerSessionGapSignal`), runway and Gantt dates, the debrief prompt (`buildSessionDebriefPrompt` reads `templates[activity.sessionNumber - 1]`), and Gainsight backfill numbering (`planSessionBackfill`). Options: (a) stamp `activity.sessionId` and resolve by it; (b) leave it to piece 2 pinning, which stops the curriculum changing under in-flight accounts; (c) widen Task 5's delete confirmation to state how many accounts have logged calls on or after this session. A task for it would slot in after Task 5.
- **M2: `totalSessions` versus curriculum length.** Deleting a template from a curriculum no longer than an account's `totalSessions` pads a "not yet configured" placeholder at the tail (`getSessionTemplateSet` → `placeholderSessionTemplate`). This is a code read only, not measured: Carbon has 12 templates against `totalSessions` 8, so the probe can't show it.
- **M3: A2's pass condition "`ttfvDays` unchanged" cannot hold on a derived-First-Value account.** Measured: a **pure insert** of a ttfv1 deliverable already drives the derived `ttfvDays` to null (60…150 → null on 6/6), because the new criterion is correctly unevidenced. Pass 0 does not change that. The plan first proposed "`ttfvDays` equals the pure-insert control", but that also passes on today's buggy code (both null). **Ruled by Ian 2026-09-30: "M3: whole-snapshot equals pure-insert control".** Task 3's A2 compares ttfv1 count, unevidenced, orphans, duplicate text and `ttfvDays` to a pure insert at the same position, in both edit orders.
- **M4: §4d's "per-deliverable ticks inside a note re-key by deliverable id" is moot.** `sessionNotes[n].deliverables` is keyed by label **text**, is written by nothing at runtime (the listener writes only `prep`), and is read only by the v11→12 migration and by self-checks. The plan leaves the ticks untouched. Proposed: drop that sentence from §4d.
- **M5: source correction.** The I5 figures are not in `VALIDATION.txt` in any commit (`git log -S"one duplicated"` finds only `d8266be` and `3c76a56`). They are now measured (Task 1).
- **Export before upgrade: nothing in the app enforces it.** It is documented at `VALIDATION.txt:350-354` ("Export JSON before opening this build against live data") and in the Phase A plan (`plans/2026-09-09-outcome-phase-a.md:1143`). In code: no prompt, and no automatic pre-migration copy. `-prerepair-` is written only when repairs drop something; `-rejected-` only on failed validation. The 14-day backup nag and the 42-day prompt are time-based, not schema-based. **Ian decides** whether piece 1 adds an in-app prompt. If yes, it becomes Task 6b (same session as Task 6 is too much, so it gets its own session).

## Plan-level choices (made here; Ian may overrule before build 1)

- **P1: `ensureTemplateIds` runs in `applyDataBackfills`, not only in the migration.** Default templates are backfilled *after* `migrateData` (the CSRD keys and the FR/GRC refill), and new modules start as `[]`. Both need ids before anything reads them. It mints only where ids are **absent**. That is version-blind in the way header rule 4 warns about, but it lives at config level, not in `backfillCustomerRecord`, and it never alters existing ids.
- **P2: deliverables of a stored template get deterministic ids by exact text** when their session still equals the shipped default by key, position and title. Any other deliverable gets a random id.
- **P3: runbook ids are derived, not hand-written.** Spec §4d says `RUNBOOK_LIBRARY` entries gain the default's session id. The plan builds an id → script index from `DEFAULT_SESSION_TEMPLATES` titles once at load (`rbLibraryIdIndex`), so the 200 lines of scripts are not edited. The result is the same: a rename keeps the script.
- **P4: malformed ids on import are rejected, never re-minted.** Re-minting would silently orphan that book's evidence.

---

## Task 1: Measure the three open items (DONE in the plan session, 2026-09-30)

**Model:** Opus (plan session). **Session:** the plan session itself. No build session.
**Satisfies:** nothing directly. It settles spec §3b, §3d, §4d's grep and §4e.5 before any code.

Measured at `a4f9bb3`:

- Suite 369/369, exit 0, 3.4 s. Guide 18/18, exit 0.
- Spec probe (`specs/2026-09-28-curriculum-identity-probe.js`): `evidencedByModule` Carbon 66. `delete_session2` affected 6/6, `reworded [0,6]` on all 6, evInCurr 11→8, orphaned 0→3, unevidenced 0→3, ttfv unchanged, 18 criteria detached. `control_noop` 0 and `delete_last` 0. `rename_s1_runbook ["authored","standard"]`. **Matches the spec.**
- Measurement probe (`specs/2026-09-28-curriculum-identity-measure.js`, committed with this plan): Carbon, 6 accounts, 66 criteria ticked (liveness). Session 1 is ttfv1 with 2 deliverables.

  | per account (6/6 identical) | base | insert@0 + reword last | reword first + insert@end | pure insert (ctl) | pure reword (ctl) |
  |---|---|---|---|---|---|
  | ttfv1 criteria | 9 | **11** | **11** | 10 | 9 |
  | unevidenced | 0 | **2** | **2** | 1 | 0 |
  | orphaned (the "duplicate") | 0 | 1 | 1 | 0 | 0 |
  | reworded label | 0 | 0 | 0 | 0 | 1 |
  | `ttfvDays`, derived FV | 60…150 | **null** | **null** | **null** | unchanged |
  | `ttfvDays`, seed's recorded FV | 75…165 | unchanged | unchanged | unchanged | unchanged |

  I5 is reproduced. The seed records `firstValue.achievedOn`, and `getFirstValue()` prefers a recorded date over the derived one, so `ttfvDays` moves only on derived accounts (`_DERIVED_FV = true`).
- Session notes: after deleting session 2, **42 of 48** prep notes (6 accounts × 8 sessions) render under the wrong session. Session 1 is the only one unaffected.
- Activities: **32 of 38** session-linked activities sit under a different session title (see M1).
- Traps found for later tasks: `backfillCustomerRecord` **deletes** non-numeric `sessionNotes` keys (~:23659), and the import validator **rejects** them (~:24067). `safeSessionTemplateForRender` strips unknown template fields, so `id`/`deliverableIds` would never reach a reader. `materializeOutcomeCriterion` dedupes on stored `(sourceSession, sourceIndex)`, so after a delete a new tick would reuse the orphan's id. Existing self-checks mutate `deliverables` directly (`unshift`, `[0] =`, `= []`). The migration dry-run's v11 mode asserts "sessionNotes unchanged", which the 12→13 re-key will break.

---

## Task 2: Ids on templates, and the single writer

**Model:** Sonnet (implementer and re-review). **Session:** build 1.
**Satisfies:** A6. It also adds c2a (the deterministic-defaults and ensure-ids invariant), which Tasks 3–7 depend on.
**Mutations that must turn the new checks red (production code only):**
- A6: restore the textarea handler to `DATA.config.sessionTemplates[curKey()][idx].deliverables = area.value.split('\n').map(s=>s.trim()).filter(Boolean);`
- c2a: in `defaultSessionId`, return `hexId('ss_')` (random) instead of the deterministic id.

**Liveness:** A6 asserts the scanned source is over 100000 chars, contains `function setSessionDeliverables`, and that its regex matches the positive sample `'x.deliverables = y'`. c2a asserts it stamped more than 0 default templates.

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`:
  - new identity block directly after `DEFAULT_SESSION_TEMPLATES` (~:3512–3777)
  - `safeSessionTemplateForRender` (~:5933)
  - `applyDataBackfills` template section (~:4563–4591)
  - `openCurriculumModal` handlers (~:22664–22697)
  - existing self-checks that mutate templates (grep `\.deliverables\s*=`, `\.deliverables\[.*\]\s*=`, `\.deliverables\.(unshift|push|splice)` inside `_runSelfChecksInner`; at `a4f9bb3` about :9232, :9242, :9308, :9315, :9316, :9488, :9790, :10202)
- Modify `README.txt`, `VALIDATION.txt`, `CHANGELOG.txt` (count 369 → 371)

**Interfaces (produced, used by Tasks 3–7):**
- `SESSION_ID_RE`, `DELIVERABLE_ID_RE` (regex consts)
- `hexId(prefix) → string`: prefix plus 8 lowercase hex
- `templateKeySlug(key) → string`, `defaultSessionId(key, i) → string`, `defaultDeliverableId(key, i, j) → string`, with i and j 0-based
- `setSessionDeliverables(tpl, rows) → tpl`, where `rows: Array<{id: string|null, text: string}>`
- `deliverableRows(tpl) → Array<{id, text}>`
- `ensureTemplateIds(sessionTemplates) → number` (count minted)
- `newSessionTemplate(templates) → tpl`, `removeSessionTemplate(templates, idx) → void`, `applyDeliverablesTextarea(tpl, value) → tpl` (interim; Task 5 removes it)
- `safeSessionTemplateForRender` output gains `id` (when valid) and `deliverableIds` (when aligned)

- [ ] **Step 1: Write the two failing checks.** Add them at the end of the Phase A/B criteria block in `_runSelfChecksInner` (after the check named `phaseA rewording follows evidence, and inserting neither moves nor inherits it`):

```js
  (function(){
    /* c2a — curriculum identity (piece 1). Shipped defaults carry DETERMINISTIC
       ids so every browser shipping the same default agrees on identity, and
       ensureTemplateIds() is idempotent and never re-mints an id it already set. */
    let ok = false, detail = '';
    const prevT = DATA.config.sessionTemplates;
    try{
      let stamped = 0, wrong = [];
      Object.entries(DEFAULT_SESSION_TEMPLATES).forEach(([key, list]) => list.forEach((tpl, i) => {
        stamped++;
        if(tpl.id !== defaultSessionId(key, i)) wrong.push(key + '#' + i);
        (tpl.deliverables || []).forEach((_, j) => {
          if((tpl.deliverableIds || [])[j] !== defaultDeliverableId(key, i, j)) wrong.push(key + '#' + i + '.' + j);
        });
      }));
      const copy = JSON.parse(JSON.stringify(DEFAULT_SESSION_TEMPLATES));
      Object.values(copy).forEach(list => list.forEach(t => { delete t.id; delete t.deliverableIds; }));
      copy.__custom__ = [{title:'Custom session', ttfvStage:'ttfv1', enable:[], deliverables:['A','B']}];
      const first = ensureTemplateIds(copy);
      const snap = JSON.stringify(copy);
      const second = ensureTemplateIds(copy);
      const sameAsDefaults = Object.keys(DEFAULT_SESSION_TEMPLATES).every(k =>
        JSON.stringify(copy[k].map(t => [t.id, t.deliverableIds])) ===
        JSON.stringify(DEFAULT_SESSION_TEMPLATES[k].map(t => [t.id, t.deliverableIds])));
      const custom = copy.__custom__[0];
      const customOk = SESSION_ID_RE.test(custom.id) && custom.deliverableIds.length === 2
        && custom.deliverableIds.every(x => DELIVERABLE_ID_RE.test(x));
      ok = stamped > 0 && wrong.length === 0 && first > 0 && second === 0
        && JSON.stringify(copy) === snap && sameAsDefaults && customOk;
      detail = JSON.stringify({stamped, wrong: wrong.slice(0, 5), first, second, sameAsDefaults, customOk});
    }catch(err){ detail = err.message; }
    DATA.config.sessionTemplates = prevT;
    check('identity: shipped defaults carry deterministic ids, and ensureTemplateIds is idempotent', ok, detail);
  })();
  (function(){
    /* A6 — curriculum identity (piece 1). setSessionDeliverables is the ONLY code
       allowed to write a template's deliverables/deliverableIds. Two halves:
       (1) a source scan: no other code assigns or mutates those arrays;
       (2) every editor action leaves the two arrays the same length. */
    let ok = false, detail = '';
    const prevT = DATA.config.sessionTemplates;
    try{
      const src = Array.from(document.scripts).filter(s => !s.src).map(s => s.textContent).join('\n');
      const rest = src.split(setSessionDeliverables.toString()).join('');
      const re = new RegExp('([A-Za-z_$][\\w$]*(?:\\[[^\\]\\n]*\\])?)\\.(deliverables|deliverableIds)'
        + '\\s*(?:=(?!=)|\\[[^\\]\\n]*\\]\\s*=(?!=)|\\.(?:push|pop|shift|unshift|splice|sort|reverse)\\()', 'g');
      // Not stored templates: a session NOTE's legacy label-keyed .deliverables
      // map, and safeSessionTemplateForRender's throwaway render copy `safe`.
      const EXEMPT_RECEIVER = /^(note|safe|sessionNotes\[[^\]]*\])$/;
      const sampleLive = new RegExp(re.source).test('x.deliverables = y');
      const hits = []; let m;
      while((m = re.exec(rest))){ if(!EXEMPT_RECEIVER.test(m[1])) hits.push(rest.slice(Math.max(0, m.index - 30), m.index + 40)); }
      const scanLive = src.length > 100000 && src.indexOf('function setSessionDeliverables') !== -1 && sampleLive;

      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const key = DATA.config.modules[0];
      const list = DATA.config.sessionTemplates[key];
      list.push(newSessionTemplate(list));
      applyDeliverablesTextarea(list[list.length - 1], 'one\ntwo\n\nthree');
      applyDeliverablesTextarea(list[0], (list[0].deliverables || []).concat(['added']).join('\n'));
      removeSessionTemplate(list, 1);
      const aligned = Object.values(DATA.config.sessionTemplates).every(l => !Array.isArray(l) || l.every(t =>
        Array.isArray(t.deliverableIds) && t.deliverableIds.length === t.deliverables.length
        && new Set(t.deliverableIds).size === t.deliverableIds.length));
      ok = scanLive && hits.length === 0 && aligned;
      detail = JSON.stringify({scanLive, hits: hits.slice(0, 3), aligned});
    }catch(err){ detail = err.message; }
    DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity: only setSessionDeliverables writes deliverables/deliverableIds, and editor actions keep them aligned', ok, detail);
  })();
```

- [ ] **Step 2: Run the suite and confirm both new checks fail.** Run: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 371 > $TEMP/sc.log 2>&1; tail -2 $TEMP/sc.log`. Expected: `369/371 passed, 2 failed`, with the two failures being the checks above (`defaultSessionId is not defined` and similar). Confirm with `grep -n "FAIL" $TEMP/sc.log | cut -c1-200`.

- [ ] **Step 3: Add the identity block immediately after the closing `};` of `DEFAULT_SESSION_TEMPLATES`.** The consts must come **before** `stampDefaultTemplateIds()` runs (TDZ).

```js
/* ============ CURRICULUM IDENTITY (piece 1) ============
   Sessions and deliverables carry opaque ids so that everything recorded
   against them (criteria evidence, session notes, authored runbooks) follows
   the item, not its text or position. deliverables[] stays an array of
   strings; ids live in the parallel deliverableIds[]. setSessionDeliverables()
   is the ONLY writer of either array (self-check A6 scans for others).
   Shipped defaults get DETERMINISTIC ids so every browser that ships the
   same default agrees on identity; user-minted ids are random. */
const SESSION_ID_RE = /^ss_[a-z0-9_]+$/;
const DELIVERABLE_ID_RE = /^dl_[a-z0-9_]+$/;
function hexId(prefix){
  const b = new Uint8Array(4);
  if(window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(b);
  else for(let i = 0; i < 4; i++) b[i] = Math.floor(Math.random() * 256);
  return prefix + Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
}
function templateKeySlug(key){ return String(key).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
function defaultSessionId(key, i){ return 'ss_' + templateKeySlug(key) + '_' + String(i + 1).padStart(2, '0'); }
function defaultDeliverableId(key, i, j){ return 'dl_' + templateKeySlug(key) + '_' + String(i + 1).padStart(2, '0') + '_' + String(j + 1).padStart(2, '0'); }
/* THE writer. rows: [{id|null, text}]. id:null (or an invalid/duplicate id)
   mints a new one. Empty text drops the row. Text is stored as given — callers
   trim — so stamping ids onto a default can never alter its wording. */
function setSessionDeliverables(tpl, rows){
  const seen = new Set(), texts = [], ids = [];
  (Array.isArray(rows) ? rows : []).forEach(r => {
    if(!r || typeof r.text !== 'string' || !r.text.trim()) return;
    let id = (typeof r.id === 'string' && DELIVERABLE_ID_RE.test(r.id) && !seen.has(r.id)) ? r.id : hexId('dl_');
    while(seen.has(id)) id = hexId('dl_');
    seen.add(id); texts.push(r.text); ids.push(id);
  });
  tpl.deliverables = texts;
  tpl.deliverableIds = ids;
  return tpl;
}
function deliverableRows(tpl){
  const ids = Array.isArray(tpl.deliverableIds) ? tpl.deliverableIds : [];
  return (Array.isArray(tpl.deliverables) ? tpl.deliverables : []).map((text, j) => ({id: ids[j] || null, text}));
}
function stampDefaultTemplateIds(){
  Object.entries(DEFAULT_SESSION_TEMPLATES).forEach(([key, list]) => list.forEach((tpl, i) => {
    tpl.id = defaultSessionId(key, i);
    setSessionDeliverables(tpl, tpl.deliverables.map((text, j) => ({id: defaultDeliverableId(key, i, j), text})));
  }));
}
stampDefaultTemplateIds();
/* Assigns ids ONLY where they are absent. A template that already carries
   deliverableIds is left alone even if malformed: the import validator rejects
   that (plan task 7) rather than re-minting, which would silently orphan
   evidence. A template still equal to a shipped default by key, position and
   title gets the default's deterministic ids (deliverables matched by exact
   text); anything else is random. Non-string deliverables are left for the
   shape validator to reject. Returns how many templates it changed. */
function ensureTemplateIds(sessionTemplates){
  if(!isRecordObject(sessionTemplates)) return 0;
  let changed = 0;
  Object.entries(sessionTemplates).forEach(([key, list]) => {
    if(!Array.isArray(list)) return;
    const defaults = Array.isArray(DEFAULT_SESSION_TEMPLATES[key]) ? DEFAULT_SESSION_TEMPLATES[key] : [];
    const usedS = new Set(list.map(t => t && t.id).filter(Boolean));
    list.forEach((tpl, i) => {
      if(!isRecordObject(tpl)) return;
      const def = (defaults[i] && defaults[i].title === tpl.title) ? defaults[i] : null;
      let touched = false;
      if(tpl.id === undefined){
        tpl.id = (def && !usedS.has(def.id)) ? def.id : hexId('ss_');
        usedS.add(tpl.id); touched = true;
      }
      if(tpl.deliverableIds === undefined && Array.isArray(tpl.deliverables)
         && tpl.deliverables.every(t => typeof t === 'string')){
        const byText = new Map();
        if(def) def.deliverables.forEach((t, j) => { if(!byText.has(t)) byText.set(t, def.deliverableIds[j]); });
        const taken = new Set();
        setSessionDeliverables(tpl, tpl.deliverables.map(text => {
          const id = byText.get(text);
          if(id && !taken.has(id)){ taken.add(id); return {id, text}; }
          return {id: null, text};
        }));
        touched = true;
      }
      if(touched) changed++;
    });
  });
  return changed;
}
function newSessionTemplate(templates){
  const tpl = {id: hexId('ss_'), title: `Session ${templates.length + 1}`,
    ttfvStage: templates.length < 7 ? 'ttfv1' : 'ttfv2', enable: []};
  return setSessionDeliverables(tpl, []);
}
function removeSessionTemplate(templates, idx){ templates.splice(idx, 1); }
/* INTERIM until the per-row editor (plan task 5). A textarea cannot express
   identity: a line that is unchanged keeps its id; anything else is new. */
function applyDeliverablesTextarea(tpl, value){
  const prior = new Map();
  deliverableRows(tpl).forEach(r => { if(!prior.has(r.text)) prior.set(r.text, r.id); });
  const used = new Set();
  const rows = String(value).split('\n').map(s => s.trim()).filter(Boolean).map(text => {
    let id = prior.get(text) || null;
    if(id && used.has(id)) id = null;
    if(id) used.add(id);
    return {id, text};
  });
  return setSessionDeliverables(tpl, rows);
}
```

- [ ] **Step 4: Wire the block in.**
  - In `safeSessionTemplateForRender`, replace the `deliverables:` line of `safe` so ids travel with their text, and pass the id through:

```js
    deliverables: Array.isArray(template.deliverables) ? template.deliverables.filter(x=>typeof x==='string') : fallback.deliverables
  };
  // Piece 1: identity passes through only when it is aligned with the text.
  // A misaligned template (only possible by bypassing setSessionDeliverables)
  // renders with no ids, so it can never attach evidence by a wrong id.
  if(typeof template.id === 'string' && SESSION_ID_RE.test(template.id)) safe.id = template.id;
  if(Array.isArray(template.deliverables) && Array.isArray(template.deliverableIds)
     && template.deliverableIds.length === template.deliverables.length
     && template.deliverables.every(x => typeof x === 'string')
     && template.deliverableIds.every(x => typeof x === 'string' && DELIVERABLE_ID_RE.test(x))){
    safe.deliverableIds = template.deliverableIds.slice();
  }
```

  - In `applyDataBackfills`, after the Financial Reporting/GRC backfill loop, add `ensureTemplateIds(data.config.sessionTemplates);` with this comment: `// Piece 1: any template entering the app (defaults backfilled above, a new module's [], an older book) gets ids before anything reads it. Mints only where absent; the v12->v13 migration (plan task 6) is what stamps stored criteria.`
  - In `openCurriculumModal`:
    - the add-session handler pushes `newSessionTemplate(templates)`
    - the remove handler calls `removeSessionTemplate(DATA.config.sessionTemplates[curKey()], idx)`
    - the deliverables textarea handler calls `applyDeliverablesTextarea(DATA.config.sessionTemplates[curKey()][idx], area.value)`
  - Convert every existing self-check that mutates a template's deliverables to the writer, keeping each check's intent:
    - a reword keeps the row's id: `const rows = deliverableRows(tpl); rows[0].text = originalText + ' (reworded)'; setSessionDeliverables(tpl, rows);`
    - an insert passes `{id:null, text}`
    - `t.deliverables = []` becomes `setSessionDeliverables(t, [])`
    - the restore-after-reword keeps the id

- [ ] **Step 5: Run the suite and confirm it is green.** Same command, `--expect 371`. Expected: `371/371 passed, 0 failed`, exit 0. If A6 lists a hit that is not a stored session template, extend `EXEMPT_RECEIVER` only when the receiver really is a note or a render copy, and give a one-line reason in the comment. Any template receiver gets converted instead. Run the guide suite; expected 18/18.

- [ ] **Step 6: Prove each check with its production mutation, one at a time.**
  - (a) Restore the textarea `split` assignment (see Mutations). Run `--expect 371`; expected `370/371`, and the failure is the A6 check. Revert.
  - (b) Make `defaultSessionId` return `hexId('ss_')`. Expected `370/371`, and the failure is c2a. Revert.
  - Confirm `git diff` shows no mutation remnants, then re-run green.

- [ ] **Step 7: Update the docs and re-run both probes.**
  - Change 369 → 371 at `README.txt:74`, `VALIDATION.txt:48` and `CHANGELOG.txt:36`.
  - Append a `VALIDATION.txt` section `CURRICULUM IDENTITY — TASK 2 (suite 369 -> 371)` recording the two mutation proofs: the mutation, the red line, the revert.
  - Re-run the spec probe and the measurement probe (commands in their headers). Expected: numbers unchanged from Task 1, since nothing matches by id yet. Record them.

- [ ] **Step 8: Commit.**

```bash
git add osm-book-of-business-tracker-1.0.html README.txt VALIDATION.txt CHANGELOG.txt
git commit -m "Curriculum piece 1 task 2: template ids and the single deliverables writer (A6)"
```

---

## Task 3: Criteria match by id (pass 0)

**Model:** Sonnet. **Session:** build 2. **M3 ruled** (2026-09-30): "M3: whole-snapshot equals pure-insert control". A2 below already uses it.
**Satisfies:** A1, A2.
**Mutations:**
- A1: remove pass 0 from `matchStoredCriteria`, i.e. delete the `templates.forEach` block that reads `byDl`.
- A2: in `setSessionDeliverables`, mint a new id when a row's id exists on the template with different text (reword → new id). Add `const priorText = new Map(deliverableRows(tpl).map(r => [r.id, r.text]));` and, in the row loop, `if(id && priorText.has(id) && priorText.get(id) !== r.text) id = hexId('dl_');`

**Liveness:** both checks assert `ticked > 0` from their fixture.

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`:
  - `outcomeCriteriaFor` (~:5994)
  - `materializeOutcomeCriterion` (~:6069)
  - suite helper and 2 checks
- Modify `docs/superpowers/specs/2026-09-28-curriculum-identity-measure.js` (the `_variant` edits go through the writer)
- Modify `README.txt`, `VALIDATION.txt`, `CHANGELOG.txt` (371 → 373)

**Interfaces:**
- Consumes (Task 2): `setSessionDeliverables`, `deliverableRows`, `removeSessionTemplate`, and `safeSessionTemplateForRender` output with `id`/`deliverableIds`
- Produces:
  - `matchStoredCriteria(stored, templates) → {matched: Array<Array<record|null>>, claimed: Set<string>}`. It is PURE. `templates` is an array in session order of `{id?, deliverables: string[], deliverableIds?: string[]}`. Task 6's migration calls it.
  - `outcomeCriteriaFor` rows gain `sourceSessionId` and `sourceDeliverableId` (string or null)
  - stored criterion records gain `sourceSessionId` and `sourceDeliverableId`, only when known
  - suite helper `_identityFixture(n) → {mod, accts, ticked}`, defined at `_runSelfChecksInner` scope. Tasks 4–7 reuse it.

- [ ] **Step 1: Write the fixture helper and the two failing checks.** Place the helper once, just above the Task 2 checks:

```js
  /* Piece 1 fixture: n synthetic accounts on a module with >= 8 sessions, every
     criterion evidenced. The CALLER saves/restores DATA.customers, DATA.activities
     and DATA.config.sessionTemplates (deep-clone templates before mutating). */
  function _identityFixture(n){
    const mod = (Array.isArray(DATA.config.sessionTemplates['Carbon']) && DATA.config.sessionTemplates['Carbon'].length >= 8)
      ? 'Carbon' : DATA.config.modules[0];
    const accts = Array.from({length:n}, (_, k) => {
      const c = {id:'__idfx' + k + '__', name:'Identity Co ' + k, module:mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      return c;
    });
    DATA.customers = accts;
    DATA.activities = Object.fromEntries(accts.map(c => [c.id, []]));
    _renderMemoResets.forEach(r => r());
    let ticked = 0;
    accts.forEach(c => outcomeCriteriaFor(c).forEach(cr => {
      if(setOutcomeEvidence(c, cr, {on: isoAddDays(todayISO(), -30), by:'customer'})) ticked++;
    }));
    return {mod, accts, ticked};
  }
```

  A1 check (the spec's 3a setup):

```js
  (function(){
    /* A1 — deleting session 2 must not re-attach its evidence to anything. Before
       piece 1 the demo book showed 6 'reworded since' rows per account (spec §3a). */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(3);
      const list = DATA.config.sessionTemplates[fx.mod];
      const deletedIds = new Set(list[1].deliverableIds);
      const before = new Map(fx.accts.map(c => [c.id, new Map(outcomeCriteriaFor(c)
        .filter(x => x.evidence).map(x => [x.sourceDeliverableId, x.id]))]));
      removeSessionTemplate(list, 1);
      _renderMemoResets.forEach(r => r());
      let reworded = 0, orphanedOther = 0, orphanedDeleted = 0, wrongOwner = 0, followed = 0;
      fx.accts.forEach(c => outcomeCriteriaFor(c).forEach(x => {
        if(x.source === 'curriculum (reworded since)') reworded++;
        if(x.source === 'no longer in the curriculum'){
          const s = c.outcomeCriteria.items.find(r => r.id === x.id);
          if(s && deletedIds.has(s.sourceDeliverableId)) orphanedDeleted++; else orphanedOther++;
        }
        if(x.evidence && x.sourceDeliverableId){
          const wasId = before.get(c.id).get(x.sourceDeliverableId);
          if(wasId === x.id) followed++; else wrongOwner++;
        }
      }));
      // A new tick on the session that slid into the plan (old session 9) must
      // materialize ITS OWN record. Positional dedupe on stored (sourceSession,
      // sourceIndex) would hand it old session 8's record, which now sits at 7.
      const c0 = fx.accts[0];
      const fresh = outcomeCriteriaFor(c0).find(x => x.provisional && x.sourceDeliverableId);
      const misdeduped = !fresh || materializeOutcomeCriterion(c0, fresh).sourceDeliverableId !== fresh.sourceDeliverableId;
      ok = fx.ticked > 0 && reworded === 0 && orphanedOther === 0
        && orphanedDeleted === fx.accts.length * deletedIds.size && wrongOwner === 0 && followed > 0 && !misdeduped;
      detail = JSON.stringify({ticked: fx.ticked, reworded, orphanedDeleted, orphanedOther, wrongOwner, followed, misdeduped});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity A1: deleting a session orphans only its own criteria and re-attaches nothing', ok, detail);
  })();
```

  A2 check (I5). Its pass condition is Ian's M3 ruling (2026-09-30): "M3: whole-snapshot equals
  pure-insert control". `ttfvDays` alone cannot fail on the I5 bug: measured, the bug and the
  pure-insert control are both `null` on the derived path, and on the recorded path it never
  moves. The counts are what tell correct from broken (control 10/1/0, bug 11/2/1).

```js
  (function(){
    /* A2 — I5: insert one deliverable AND reword another in the same ttfv1 session.
       Measured before piece 1 (task 1): ttfv1 9 -> 11, unevidenced 0 -> 2, one
       orphaned duplicate. Pass (Ian's M3 ruling): in BOTH edit orders, the whole
       criteria snapshot equals a PURE insert at the same position, and the reworded
       criterion keeps its evidence. The control must itself show +1 ttfv1, 1
       unevidenced, 0 orphans, so a degenerate control cannot make this pass.
       ttfvDays is in the snapshot as a regression guard only: a new unevidenced
       ttfv1 criterion correctly un-derives First Value in both. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(2);
      const tpl = DATA.config.sessionTemplates[fx.mod][0];
      const orig = deliverableRows(tpl);
      const c = fx.accts[0];
      const snap = () => {
        _renderMemoResets.forEach(r => r());
        const list = outcomeCriteriaFor(c), texts = list.map(x => x.text);
        return {ttfv1: list.filter(x => x.stage === 'ttfv1').length,
          unev: list.filter(x => !x.evidence).length,
          orphan: list.filter(x => x.source === 'no longer in the curriculum').length,
          dupText: texts.length - new Set(texts).size, ttfv: ttfvDays(c),
          rewordedKept: list.some(x => x.source === 'curriculum (reworded since)' && x.evidence)};
      };
      const base = snap();
      const NEW = {id:null, text:'NEW deliverable'};
      const copy = () => orig.map(r => ({id:r.id, text:r.text}));
      const run = rows => { setSessionDeliverables(tpl, rows); return snap(); };
      // Order A: insert at the front, reword the last. Order B: reword the first, insert at the end.
      const ctlA = run([NEW].concat(copy()));
      const a = copy(); a[a.length - 1].text += ' (reworded)';
      const gotA = run([NEW].concat(a));
      const ctlB = run(copy().concat([NEW]));
      const b = copy(); b[0].text += ' (reworded)';
      const gotB = run(b.concat([NEW]));
      const counts = s => JSON.stringify([s.ttfv1, s.unev, s.orphan, s.dupText, s.ttfv]);
      const ctlOk = [ctlA, ctlB].every(s => s.ttfv1 === base.ttfv1 + 1 && s.unev === base.unev + 1 && s.orphan === 0);
      ok = fx.ticked > 0 && ctlOk
        && counts(gotA) === counts(ctlA) && gotA.rewordedKept
        && counts(gotB) === counts(ctlB) && gotB.rewordedKept;
      detail = JSON.stringify({ticked: fx.ticked, base, ctlA, gotA, ctlB, gotB});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity A2: insert + reword in one session adds exactly the new criterion and keeps the reworded evidence', ok, detail);
  })();
```

- [ ] **Step 2: Run `--expect 373` and confirm both fail.** Expected: `371/373`, with A1 failing on `reworded > 0` (or `wrongOwner > 0`) and A2 failing with `gotA`/`gotB` at ttfv1 +2, unev +2, orphan 1 against controls at +1/+1/0 (task 1 measured 11/2/1 vs 10/1/0 on Carbon). If a control is not +1/+1/0, the fixture is wrong: stop and debug before writing code. Record the red detail strings; they are the before-numbers.

- [ ] **Step 3: Extract the matching core and add pass 0.** Replace the body of `outcomeCriteriaFor` from `getSessionTemplateSet(customer).forEach(...)` down to (not including) the orphan loop with a call to this new pure function. Place it directly above `outcomeCriteriaFor` and keep the existing pass 1/2 comments inside it:

```js
/* PURE. Places stored criterion records onto a curriculum. Pass 0 (piece 1):
   a record with a sourceDeliverableId matches the deliverable carrying that
   id WHEREVER it now sits (any session, any index). Such a record never
   falls through to text or index — if its id is gone, it is 'no longer in
   the curriculum'. That rule is what closes spec §3a/§3b. Passes 1 and 2 run
   only on records WITHOUT a sourceDeliverableId (legacy/imported bridge).
   templates: session order, each {id?, deliverables:[string], deliverableIds?}. */
function matchStoredCriteria(stored, templates){
  const claimed = new Set();
  const byDl = new Map();
  stored.forEach(s => { if(s && s.sourceDeliverableId && !byDl.has(s.sourceDeliverableId)) byDl.set(s.sourceDeliverableId, s); });
  const legacy = stored.filter(s => s && !s.sourceDeliverableId);
  const matched = templates.map(t => new Array((t.deliverables || []).length).fill(null));
  templates.forEach((tpl, i) => (tpl.deliverables || []).forEach((_, idx) => {
    const id = Array.isArray(tpl.deliverableIds) ? tpl.deliverableIds[idx] : null;
    const hit = id ? byDl.get(id) : null;
    if(hit && !claimed.has(hit.id)){ claimed.add(hit.id); matched[i][idx] = hit; }
  }));
  templates.forEach((tpl, i) => {
    const sessionNumber = i + 1;
    const deliverables = tpl.deliverables || [];
    /* Pass 1 — TEXT … (keep the existing comment) */
    deliverables.forEach((text, idx) => {
      if(matched[i][idx]) return;
      const hit = legacy.find(s => !claimed.has(s.id) && s.sourceSession === sessionNumber && s.text === text);
      if(hit){ claimed.add(hit.id); matched[i][idx] = hit; }
    });
    /* Pass 2 — INDEX … (keep the existing comment) */
    deliverables.forEach((text, idx) => {
      if(matched[i][idx]) return;
      const hit = legacy.find(s => !claimed.has(s.id) && s.sourceSession === sessionNumber
        && s.sourceIndex === idx
        && (s.sourceCount === undefined || s.sourceCount === deliverables.length));
      if(hit){ claimed.add(hit.id); matched[i][idx] = hit; }
    });
  });
  return {matched, claimed};
}
```

  In `outcomeCriteriaFor`: `const set = getSessionTemplateSet(customer); const {matched, claimed} = matchStoredCriteria(stored, set);` Then loop `set.forEach((tpl, i) => …)` using `matched[i][idx]`. Add `sourceSessionId: tpl.id || null, sourceDeliverableId: (tpl.deliverableIds || [])[idx] || null` to both the matched row and the provisional row. Orphan rows add `sourceSessionId: s.sourceSessionId || null, sourceDeliverableId: s.sourceDeliverableId || null`. Delete the old `const claimed = new Set();`.

- [ ] **Step 4: Stamp and dedupe by id in `materializeOutcomeCriterion`.** Replace the `dup` lookup with:

```js
  /* Piece 1: a criterion that knows its deliverable id is identified by it
     alone. Deduping it on (sourceSession, sourceIndex) would, after a session
     delete, hand a new tick the id of the deleted session's record. Legacy
     positional dedupe applies only among unstamped records. */
  const dup = criterion.sourceDeliverableId
    ? customer.outcomeCriteria.items.find(x => x.sourceDeliverableId === criterion.sourceDeliverableId)
    : (criterion.sourceSession
        ? customer.outcomeCriteria.items.find(x => !x.sourceDeliverableId &&
            x.sourceSession === criterion.sourceSession && x.sourceIndex === idx)
        : customer.outcomeCriteria.items.find(x =>
            !x.sourceSession && x.text === String(criterion.text || '')));
```

  After building `rec`: `if(criterion.sourceDeliverableId){ rec.sourceSessionId = criterion.sourceSessionId || null; rec.sourceDeliverableId = criterion.sourceDeliverableId; }`

- [ ] **Step 5: Run `--expect 373`.** Expected: `373/373`, exit 0. The existing check `phaseA rewording follows evidence, and inserting neither moves nor inherits it` must still pass; it now passes through pass 0. Run the guide suite: 18/18.

- [ ] **Step 6: Mutation proofs.** Apply the A1 mutation: expected `372/373`, with A1 red. Revert. Apply the A2 mutation: expected A2 red (it can also turn A1 or the Phase A reword check red; record exactly which). Revert. Check `git diff` is clean of mutations, then re-run green.

- [ ] **Step 7: Probes and docs.**
  - Edit the measurement probe's `_variant` so the edits go through the writer (`const rows = deliverableRows(t[0]); …; setSessionDeliverables(t[0], rows)`; reword keeps the id, insert passes `id:null`).
  - Re-run both probes. Expected spec probe: `delete_session2` `reworded [0,0]` on all 6 and orphaned `[0,3]`; `rename_s1_runbook` still `["authored","standard"]` (Task 4 fixes it). Expected measurement probe: I5 rows `ttfv1 9→10`, `unev 0→1`, orphan 0, reworded 1.
  - If either number differs, stop and report before committing.
  - Update the counts 371 → 373 and add the VALIDATION section `TASK 3 (suite 371 -> 373)` with the mutation proofs and the probe numbers.

- [ ] **Step 8: Commit.** `git commit -m "Curriculum piece 1 task 3: criteria match by deliverable id (A1, A2)"`

---

## Task 4: Notes and authored runbooks keyed by session id

**Model:** Sonnet. **Session:** build 3.
**Satisfies:** A3. It also adds c4b ("notes follow their session through a delete"), which is the measured §3d defect: 42/48 notes misplaced.
**Mutations:**
- A3: delete the `if(sessionId){ … rbLibraryIdIndex() … }` lookup in `authoredRunbookFor`.
- c4b: make `sessionNoteKey` return `String(sessionNumber)` (notes keyed by number again).

**Liveness:**
- A3 asserts the precondition `before === 'authored'`, and that `Object.keys(rbLibraryIdIndex()).length > 0`.
- c4b asserts `ticked > 0` and more than 0 notes compared.

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`:
  - `readSessionNote` / `getSessionNote` (~:6260)
  - `authoredRunbookFor` / `buildSessionRunbook` (~:3901)
  - `backfillCustomerRecord` notes loop (~:23655)
  - the note-key validator in the import/normalized assertion (~:24066)
  - direct `sessionNotes[...]` reads (~:2439 AI context, ~:17834 Command Center)
  - bulk note clears (~:21755, ~:21762)
- Modify `README.txt`, `VALIDATION.txt`, `CHANGELOG.txt` (373 → 375)

**Interfaces:**
- Consumes: `getSessionTemplate(customer, n).id` (Task 2), `_identityFixture`, `removeSessionTemplate`
- Produces:
  - `SESSION_NOTE_KEY_RE = /^(\d+|ss_[a-z0-9_]+)$/`
  - `sessionNoteKey(customer, sessionNumber) → string`
  - `readSessionNote(customer, sessionNumber)` and `getSessionNote(customer, sessionNumber)` keep their signatures
  - `rbLibraryIdIndex() → {[sessionId]: segments}`
  - `authoredRunbookFor(customer, title, sessionId)`

- [ ] **Step 1: Write the two failing checks.**

```js
  (function(){
    /* A3 — renaming a session keeps its authored talk track (spec §3c: measured
       'authored' -> 'standard'). */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(1);
      const c = fx.accts[0];
      const indexed = Object.keys(rbLibraryIdIndex()).length;
      const before = buildSessionRunbook(c, getSessionTemplate(c, 1)).source;
      DATA.config.sessionTemplates[fx.mod][0].title += ' (renamed)';
      _renderMemoResets.forEach(r => r());
      const after = buildSessionRunbook(c, getSessionTemplate(c, 1)).source;
      ok = fx.ticked > 0 && indexed > 0 && before === 'authored' && after === 'authored';
      detail = JSON.stringify({ticked: fx.ticked, indexed, before, after, mod: fx.mod});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity A3: renaming a session keeps its authored runbook', ok, detail);
  })();
  (function(){
    /* c4b — session notes follow their session through a delete (spec §3d;
       measured before piece 1: 42 of 48 notes rendered under the wrong session). */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(2);
      fx.accts.forEach(c => { for(let n = 1; n <= c.totalSessions; n++){
        getSessionNote(c, n).prep = 'P:' + getSessionTemplate(c, n).title; } });
      removeSessionTemplate(DATA.config.sessionTemplates[fx.mod], 1);
      _renderMemoResets.forEach(r => r());
      let compared = 0, wrong = 0;
      fx.accts.forEach(c => { for(let n = 1; n <= c.totalSessions; n++){
        const p = readSessionNote(c, n).prep;
        if(!p) continue;                       // the session that slid into the plan had no note
        compared++;
        if(p !== 'P:' + getSessionTemplate(c, n).title) wrong++;
      } });
      ok = fx.ticked > 0 && compared > 0 && wrong === 0;
      detail = JSON.stringify({ticked: fx.ticked, compared, wrong});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity: session notes follow their session through a delete', ok, detail);
  })();
```

- [ ] **Step 2: Run `--expect 375` and confirm both fail** (`rbLibraryIdIndex is not defined`; c4b `wrong > 0`). Record the details. **Caution:** in the fixture, `fx.mod` must have an authored library entry for session 1. If A3 reports `before !== 'authored'`, that is a fixture problem, not a pass. Pick the module the spec probe used (Carbon) and record which.

- [ ] **Step 3: Re-key notes.** Replace `readSessionNote` / `getSessionNote` with:

```js
/* Piece 1: notes are keyed by SESSION ID, so deleting or reordering a session
   no longer moves them onto its neighbour. A numeric key is the pre-migration
   shape (or a placeholder session with no id); it is read as a fallback and
   moved to the id key the first time the note is written. */
const SESSION_NOTE_KEY_RE = /^(\d+|ss_[a-z0-9_]+)$/;
function sessionNoteKey(customer, sessionNumber){
  const tpl = getSessionTemplate(customer, sessionNumber);
  return (tpl && tpl.id) ? tpl.id : String(sessionNumber);
}
function readSessionNote(customer, sessionNumber){
  const notes = (customer && customer.sessionNotes) || {};
  const key = sessionNoteKey(customer, sessionNumber);
  const hit = notes[key] || (key !== String(sessionNumber) ? notes[sessionNumber] : null);
  return hit ? hit : {deliverables:{}, prep:''};
}
function getSessionNote(customer, sessionNumber){
  if(!customer.sessionNotes) customer.sessionNotes = {};
  const key = sessionNoteKey(customer, sessionNumber);
  const num = String(sessionNumber);
  if(!customer.sessionNotes[key] && key !== num && customer.sessionNotes[num]){
    customer.sessionNotes[key] = customer.sessionNotes[num];
    delete customer.sessionNotes[num];
  }
  if(!customer.sessionNotes[key]) customer.sessionNotes[key] = {deliverables:{}, prep:''};
  return customer.sessionNotes[key];
}
```

  Keep the v97 comment above them. Then:
  - (a) **Trap:** in `backfillCustomerRecord`'s notes loop, replace `/^\d+$/.test(key)` with `SESSION_NOTE_KEY_RE.test(key)`. Without this, every id-keyed note is **deleted** on the next load. Do the same in the import/normalized validator (`Object.entries(c.sessionNotes).forEach(([session,note])=>{ if(!/^\d+$/.test(session) …`).
  - (b) Route the direct reads at ~:2439 (`sessionNotes[i+1]`) and ~:17834 (`sessionNotes[next.number]`) through `readSessionNote`.
  - (c) Read the bulk clears at ~:21755/:21762 and keep their behaviour. If they clear by number, clear by `sessionNoteKey`.

- [ ] **Step 4: Runbook lookup by id.** Add after `rbLibraryIndex`:

```js
/* Piece 1: authored scripts are found by the deterministic session id of the
   shipped default they were written for, so a rename keeps the script (spec
   §3c). Resolved per DEFAULT key with the same library candidates the title
   lookup uses (exact key, then any library key the template key contains), so
   'Sustainability + Carbon' sessions still reach the 'Sustainability' scripts. */
let _rbIdIndex = null;
function rbLibraryIdIndex(){
  if(_rbIdIndex) return _rbIdIndex;
  _rbIdIndex = {};
  const libs = Object.keys(RUNBOOK_LIBRARY);
  Object.entries(DEFAULT_SESSION_TEMPLATES).forEach(([key, list]) => {
    const candidates = [key].concat(libs.filter(l => l !== key && key.includes(l)));
    list.forEach(tpl => {
      for(const lib of candidates){
        const byTitle = RUNBOOK_LIBRARY[lib] || {};
        const title = Object.keys(byTitle).find(t => rbTitleKey(t) === rbTitleKey(tpl.title));
        if(title){ _rbIdIndex[tpl.id] = byTitle[title]; break; }
      }
    });
  });
  return _rbIdIndex;
}
```

  Change the signature to `authoredRunbookFor(customer, title, sessionId)` and put this first in its body: `if(sessionId){ const byId = rbLibraryIdIndex()[sessionId]; if(byId) return byId; }`. In `buildSessionRunbook`, call `authoredRunbookFor(customer, tpl.title, tpl.id)`. Grep for any other `authoredRunbookFor(` caller and pass the id there too.

- [ ] **Step 5: Run `--expect 375`: green, exit 0.** Guide 18/18. **Watch** the existing v97 purity check ("reading a session note must not CREATE one") and the Phase A legacy-ticks import check that asserts `c.sessionNotes['1'].deliverables[firstLabel] === true`. The first must stay green. The second must also stay green in this task, because no migration re-keys yet.

- [ ] **Step 6: Mutation proofs.** Apply the A3 mutation: expected A3 red. Revert. Apply the c4b mutation (`sessionNoteKey` returns the number): expected c4b red. Revert. Check the diff is clean, then green.

- [ ] **Step 7: Probes and docs.** Re-run the spec probe. Expected `rename_s1_runbook ["authored","authored"]`, other numbers as after Task 3. Re-run the measurement probe. `delete_s2_notes.notesShownUnderWrongSession` stays 42, because the probe writes notes directly under **numeric** keys, which is the unmigrated shape. Record this as the expected unmigrated behaviour; Task 6's migration is what moves those keys. Update the counts 373 → 375 and add the VALIDATION section.

- [ ] **Step 8: Commit.** `git commit -m "Curriculum piece 1 task 4: session notes and authored runbooks keyed by session id (A3)"`

---

## Task 5: Per-row deliverable editor, session reorder, and delete confirmation

**Model:** Sonnet. The session invokes `frontend-design` **for layout only**, minimal per spec §4b; the editor's look is piece 3. **Session:** build 4.
**Satisfies:** A4, the A6 extension (new actions stay aligned, textarea gone), and c5b (the delete-impact count is real).
**Mutations:**
- A4: `sessionNoteKey` returns `String(sessionNumber)` (key notes by number again, as the spec names).
- A6: restore the textarea handler that splits the text (as in Task 2).
- c5b: in `sessionDeleteImpact`, drop the evidence filter so it counts every account on the curriculum.

**Liveness:**
- A4 asserts `ticked > 0` and more than 0 notes compared.
- c5b asserts `ticked > 0` and that the fixture has one unevidenced account on the same module, so the mutation is observable.

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`:
  - identity block (new actions)
  - `openCurriculumModal` markup (~:22565–22590) and handlers
  - the A6 check (extend its action list, remove `applyDeliverablesTextarea`)
- Modify `README.txt`, `VALIDATION.txt`, `CHANGELOG.txt` (375 → 377)

**Interfaces:**
- Consumes: `setSessionDeliverables`, `deliverableRows`, `removeSessionTemplate`, `outcomeCriteriaFor` rows' `sourceDeliverableId`, `resolveRawCurriculum`, `showConfirmModal`
- Produces:
  - `moveSessionTemplate(templates, idx, dir) → boolean`
  - `moveDeliverableRow(tpl, j, dir) → boolean`
  - `rewordDeliverableRow(tpl, j, text) → tpl` (empty text removes the row)
  - `addDeliverableRow(tpl, text) → tpl`
  - `removeDeliverableRow(tpl, j) → tpl`
  - `sessionDeleteImpact(templateKey, sessionId) → {accounts: number}`

- [ ] **Step 1: Write the failing checks.**
  - A4: from `_identityFixture(2)`, write a note per session (`'P:' + tpl.id`), then run `moveDeliverableRow(list[0], 0, +1)` and `moveSessionTemplate(list, 0, +1)`. Assert:
    - every evidenced criterion before is still evidenced, found by `sourceDeliverableId`, with the same criterion `id`
    - `getSessionTemplate(c, 2).id` is the old session-1 id
    - `readSessionNote(c, 2).prep === 'P:' + oldS1Id`
    - `readSessionNote(c, 1).prep === 'P:' + oldS2Id`
    - `ticked > 0`
  - c5b: from `_identityFixture(3)`, add one more synthetic account on `fx.mod` with no evidence (`backfillCustomerRecord`, push to `DATA.customers`). Assert `sessionDeleteImpact(fx.mod, list[1].id).accounts === 3` and `ticked > 0`.
  - A6 extension: in the action list, replace the two `applyDeliverablesTextarea` calls with `addDeliverableRow`, `rewordDeliverableRow`, `moveDeliverableRow`, `removeDeliverableRow` and `moveSessionTemplate`. Keep the source scan.

  Write them in the same IIFE and save/restore shape as the Task 3 checks.

- [ ] **Step 2: Run `--expect 377` and confirm A4 and c5b fail, with the functions not defined.** A6 fails too until the new actions exist; record it.

- [ ] **Step 3: Add the actions to the identity block** (and delete `applyDeliverablesTextarea`):

```js
function moveSessionTemplate(templates, idx, dir){
  const j = idx + dir;
  if(idx < 0 || idx >= templates.length || j < 0 || j >= templates.length) return false;
  const [t] = templates.splice(idx, 1); templates.splice(j, 0, t);
  return true;
}
function moveDeliverableRow(tpl, j, dir){
  const rows = deliverableRows(tpl), k = j + dir;
  if(j < 0 || j >= rows.length || k < 0 || k >= rows.length) return false;
  const [r] = rows.splice(j, 1); rows.splice(k, 0, r);
  setSessionDeliverables(tpl, rows);
  return true;
}
/* Editing an input is a REWORD: the id is kept. Clearing it removes the row. */
function rewordDeliverableRow(tpl, j, text){
  const rows = deliverableRows(tpl);
  if(rows[j]) rows[j].text = String(text).trim();
  return setSessionDeliverables(tpl, rows);
}
function addDeliverableRow(tpl, text){
  return setSessionDeliverables(tpl, deliverableRows(tpl).concat([{id:null, text:String(text).trim()}]));
}
function removeDeliverableRow(tpl, j){
  const rows = deliverableRows(tpl); rows.splice(j, 1);
  return setSessionDeliverables(tpl, rows);
}
/* Impact of deleting a session, from real data (spec §4b): how many accounts
   on THIS curriculum have evidence on its deliverables. */
function sessionDeleteImpact(templateKey, sessionId){
  const list = DATA.config.sessionTemplates[templateKey];
  const tpl = Array.isArray(list) ? list.find(t => t && t.id === sessionId) : null;
  if(!tpl) return {accounts: 0};
  const ids = new Set(tpl.deliverableIds || []);
  const accounts = DATA.customers.filter(c => resolveRawCurriculum(c) === list
    && outcomeCriteriaFor(c).some(cr => cr.evidence && ids.has(cr.sourceDeliverableId))).length;
  return {accounts};
}
```

- [ ] **Step 4: Invoke `frontend-design` for the layout of the per-session block only** (rows, add input, move and remove buttons, focus order). Constraints: existing classes (`field`, `btn btn-sm`, `btn-danger`, `session-card`) and `:root` tokens only (header rule 2); no new visual language. Then replace the deliverables `<textarea data-cur-deliverables>` in `renderModalBody` with:
  - one `<input type="text" data-cur-dl="${i}|${j}" value="${escapeAttr(text)}" aria-label="Session ${i+1} deliverable ${j+1}">` per row, with `↑`/`↓`/`✕` buttons (`data-cur-dl-move="${i}|${j}|-1"`, `…|1`, `data-cur-dl-remove="${i}|${j}"`), each with an `aria-label`
  - one `<input data-cur-dl-new="${i}" placeholder="Add a deliverable">`
  - session `↑`/`↓` buttons (`data-cur-move-session="${i}|-1"` and `…|1`)

  Wire the handlers to the actions above, each followed by `saveData(); renderModalBody(); render();`. The reword handler fires on `change`, and re-renders only the app (`saveData(); render();`), not the modal, so focus is kept. Remove the old textarea handler.

- [ ] **Step 5: Session-delete confirmation.** Change the remove-session handler to:

```js
    $$('[data-cur-remove-session]').forEach(btn => btn.addEventListener('click', ()=>{
      const idx = parseInt(btn.dataset.curRemoveSession,10);
      const list = DATA.config.sessionTemplates[curKey()];
      const tpl = list[idx];
      const n = sessionDeleteImpact(curKey(), tpl.id).accounts;
      const impact = n === 0 ? 'No account has evidence on this session\'s deliverables.'
        : `${n} account${n===1?' has':'s have'} evidence on this session's deliverables; it will show as "no longer in the curriculum".`;
      showConfirmModal(`Remove session ${idx+1}, "${tpl.title}"? ${impact}`, ()=>{
        removeSessionTemplate(list, idx);
        saveData(); renderModalBody(); render();
      });
    }));
```

  If Ian accepts M1(c), the logged-call impact sentence goes here. Do not add it without his ruling.

- [ ] **Step 6: Run `--expect 377`: green.** Guide 18/18. Then check the editor by hand: `node tools/inspect.mjs` can't open a modal, so use the `run` skill or a browser. The checks are: open Settings → Session Curriculum; reword a deliverable, reorder one, add one, delete a session with evidence (the confirm text shows the count), and cancel. **Route the screenshots to Ian; do not judge the look.**

- [ ] **Step 7: Mutation proofs (A4, A6, c5b, one at a time), then docs.** Each mutation must turn its own check red; record the red line and revert. Update the counts 375 → 377 and add the VALIDATION section.

- [ ] **Step 8: Commit.** `git commit -m "Curriculum piece 1 task 5: per-row deliverable editor, session reorder, delete confirmation (A4, A6)"`

---

## Task 6: Migration 12 → 13, plus a dry-run mode for it

**Model:** Sonnet. **Session:** build 5. It runs its own session because the dry-run starts headless Chrome (child process). If Ian says yes to the export-before-upgrade prompt, that is **Task 6b**, a separate session after this one.
**Satisfies:** A5.
**Mutation:** in the v12→13 step, skip the stamping loop (comment out the `matched.forEach(… rec.sourceSessionId = …)` block).
**Liveness:** A5 asserts that before migration more than 0 criteria are evidenced, and that more than 0 records are stamped after.

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`:
  - `CURRENT_SCHEMA_VERSION` (~:4143)
  - `migrateData` (new `if(v === 12)` step after the v11→12 step)
  - the v11→12 step's curriculum resolution (~:4415–4436), extracted to a helper
  - the Phase A legacy-ticks import check that reads `c.sessionNotes['1']` (grep `sessionNotesIntact`)
- Modify `tools/migration-dryrun.mjs` (add `--from 12`)
- Create `tools/legacy-seed-v12.js`
- Modify `README.txt`, `VALIDATION.txt`, `CHANGELOG.txt` (377 → 378)

**Interfaces:**
- Consumes: `ensureTemplateIds` (Task 2), `matchStoredCriteria` (Task 3), `SESSION_NOTE_KEY_RE` (Task 4), `_identityFixture`
- Produces:
  - `migrationCurriculumFor(data, c) → {templates: Array, planLength: number}`, the v11→12 resolution extracted verbatim (explicit count, never `getSessionTemplateSet`)
  - suite helper `_v12Book(accts) → book` (strips ids and stamps and re-keys notes to numbers, `schemaVersion: 12`). Task 7 reuses it.

- [ ] **Step 1: Write the failing A5 check.** Build `_identityFixture(3)`, write notes per session via `getSessionNote`, and give one account a pure-reword legacy record, so pass 2 is exercised. Then `const book = _v12Book(fx.accts)`:
  - clone the current DATA envelope and replace `customers`/`activities`
  - delete every template's `id`/`deliverableIds`
  - delete every stored item's `sourceSessionId`/`sourceDeliverableId`
  - re-key each id-keyed note to its session number
  - set `schemaVersion = 12`

  Build the envelope the way the existing Phase A import check does (grep `sessionNotesIntact`). Compute **before** with `DATA.customers = book.customers; DATA.config.sessionTemplates = book.config.sessionTemplates` and per account `[strip(outcomeCriteriaFor(c)), outcomeVerdict(c), ttfvDays(c)]`, where `strip` deletes `sourceSessionId`/`sourceDeliverableId` from each row. Compute **after** with `const prepared = prepareBookData(cloneData(book), 'SelfCheck')` and the same triple on `prepared.customers` / `prepared.config.sessionTemplates`. Assert:
  - the before and after JSON are equal per account
  - every stored item that **before** placed in the curriculum (row not provisional, `source` starting `curriculum`) has `sourceDeliverableId` after
  - no numeric note key ≤ planLength remains when its template has an id
  - a second `prepareBookData` on the prepared book leaves `outcomeCriteria` deep-equal (idempotent)
  - `evidencedBefore > 0 && stamped > 0`

  Name it `identity A5: v12 -> v13 migration keeps every verdict and stamps every placed item`.
- [ ] **Step 2: Run `--expect 378`: A5 fails** (`schemaVersion` stays 12, and there is no stamping).
- [ ] **Step 3: Implement.** Set `CURRENT_SCHEMA_VERSION = 13` with the comment `// piece 1: + curriculum identity (template ids, criterion stamps, notes by session id)`. Extract `migrationCurriculumFor(data, c)` from the v11→12 step, with no behaviour change, and call it there. Add:

```js
  if(v === 12){
    /* v12 -> v13 (curriculum piece 1): stable identity.
       1. Every stored template gets ids (deterministic where it still equals a
          shipped default by key, position and title; random otherwise).
       2. For every account, TODAY's matching (passes 1 and 2 — the curriculum
          is unchanged mid-migration, so that matching is correct right now) is
          run against the account's own curriculum with an EXPLICIT count, and
          every stored item it places is stamped with sourceSessionId /
          sourceDeliverableId. Items it cannot place stay unstamped and keep
          their 'no longer in the curriculum' state.
       3. Numeric sessionNotes keys move to the session id.
       Never through getSessionTemplateSet(): this runs before applyDataBackfills,
       on un-normalized fields (the trap in materializeOutcomeCriterion's comment). */
    const allTemplates = (data.config && data.config.sessionTemplates) || {};
    ensureTemplateIds(allTemplates);
    (data.customers || []).forEach(c => {
      if(!isRecordObject(c)) return;
      const {templates, planLength} = migrationCurriculumFor(data, c);
      const set = templates.slice(0, planLength).map(t => isRecordObject(t) && Array.isArray(t.deliverables)
        ? {id: t.id, deliverables: t.deliverables.filter(x => typeof x === 'string'),
           deliverableIds: (Array.isArray(t.deliverableIds) && t.deliverableIds.length === t.deliverables.length) ? t.deliverableIds : []}
        : {deliverables: []});
      const stored = (isRecordObject(c.outcomeCriteria) && Array.isArray(c.outcomeCriteria.items)) ? c.outcomeCriteria.items : [];
      const {matched} = matchStoredCriteria(stored, set);
      matched.forEach((row, i) => row.forEach((rec, idx) => {
        const dl = set[i].deliverableIds[idx];
        if(!rec || !set[i].id || !dl) return;
        rec.sourceSessionId = set[i].id;
        rec.sourceDeliverableId = dl;
      }));
      if(isRecordObject(c.sessionNotes)) Object.keys(c.sessionNotes).forEach(key => {
        if(!/^\d+$/.test(key)) return;
        const n = parseInt(key, 10);
        const t = (n >= 1 && n <= set.length) ? set[n - 1] : null;
        if(!t || !t.id || c.sessionNotes[t.id] !== undefined) return;
        c.sessionNotes[t.id] = c.sessionNotes[key];
        delete c.sessionNotes[key];
      });
    });
    v = 13;
  }
```

  **Trap:** the existing Phase A import check asserts `c.sessionNotes['1'].deliverables[firstLabel] === true`. After this step that note lives under session 1's id. Change the read to `readSessionNote(c, 1).deliverables[firstLabel] === true`, keeping its intent (the legacy ticks survive). Grep the suite for any other `schemaVersion` fixture that assumes 12 is current.
- [ ] **Step 4: Run `--expect 378`: green.** Guide 18/18.
- [ ] **Step 5: Mutation proof.** Skip the stamping loop: A5 red on "every placed item stamped". Revert. Diff clean, then green.
- [ ] **Step 6: Dry-run mode.**
  - Add `--from 11|12` to `tools/migration-dryrun.mjs`; the default stays `11`.
  - `--from 12` loads `tools/legacy-seed-v12.js`. That seed builds `window.__LEGACY_BOOK__` in the page: `defaultData()` with template ids stripped, then about six customers on Carbon and Sustainability with evidence set **while templates have no ids** (so the records are legacy). It needs these shapes:
    - a CSRD account
    - a reworded deliverable (pass-2 match)
    - a removed deliverable (orphan)
    - `totalSessions: "8"` as a string
    - an account whose curriculum is shorter than its `totalSessions` (placeholder tail)
    - numeric notes on every session

    Finish with `schemaVersion: 12`.
  - The v12 analysis: for each customer, the A5 invariant through `prepareBookData`; placed but unstamped items (must be 0); notes moved; second-pass idempotence. Exit 0 only if all hold.
  - **Trap:** the v11 mode asserts `sessionNotes` unchanged, and v11 books now also pass through 12→13. Compare notes **modulo the numeric → id re-key**.
  - Run both modes. Expected: exit 0 for each, reports under `.artifacts/`. Record the counts.
- [ ] **Step 7: Probes and docs.** Re-run both probes. The measurement probe's notes figure only moves if its notes go through a migration, so record it and don't expect a change. Update the counts 377 → 378. Add the VALIDATION section with the mutation proof and both dry-run results, and state that the migration has **not** run against a real book (same honesty as the Phase A entry at `VALIDATION.txt:350`).
- [ ] **Step 8: Commit.** `git commit -m "Curriculum piece 1 task 6: schema 12 -> 13 identity migration and dry-run mode (A5)"`

---

## Task 7: Export and import keep ids (A7)

**Model:** Sonnet. **Session:** build 6.
**Satisfies:** A7.
**Mutation:** in `serializeBook`, drop ids: `JSON.stringify(data, (k, v) => (k === 'id' && typeof v === 'string' && /^ss_/.test(v)) || k === 'deliverableIds' ? undefined : v, 2)`.
**Liveness:** the fixture includes at least one **user-minted** (random-id) session with deliverables. Deterministic default ids would be re-minted identically by `ensureTemplateIds`, so the mutation needs a random id to be observable. It also asserts `ticked > 0`.

**Files:**
- Modify `osm-book-of-business-tracker-1.0.html`:
  - `exportData` (~:23494) and every other `JSON.stringify(DATA` that writes a backup (grep it, e.g. `fsScheduleBackup`), routed through one serializer
  - `assertSessionTemplate` (~:24024): require valid ids post-normalization. Confirm with grep that it is called from `assertNormalizedBookData`, i.e. after backfills.
- Modify `README.txt`, `VALIDATION.txt`, `CHANGELOG.txt` (378 → 379)

**Interfaces:**
- Consumes: `_identityFixture`, `_v12Book` (Task 6), `newSessionTemplate`, `addDeliverableRow`
- Produces: `serializeBook(data) → string`

- [ ] **Step 1: Write the failing A7 check.**
  - Set up `_identityFixture(2)`, push `newSessionTemplate(list)` with two `addDeliverableRow`s onto the module, and evidence one of its criteria on one account (after `_renderMemoResets`; the account's `totalSessions` must reach it, or put the new session at index 0 with `moveSessionTemplate`).
  - Take `const before = {templates: ids of every template, items: every stored item's [id, sourceDeliverableId]}`.
  - Build `const env = JSON.parse(serializeBook(<current DATA with fixture customers>)); const back = prepareBookData(env, 'SelfCheck');`, then assert the same ids come back unchanged.
  - Second half: `prepareBookData(JSON.parse(serializeBook(_v12Book(fx.accts))), 'SelfCheck')` satisfies the A5 invariant. Reuse Task 6's comparison, factored into a suite helper `_a5Invariant(book)` if Task 6 did not already.
  - Assert `ticked > 0` and that a random-id session is present.
- [ ] **Step 2: Run `--expect 379`: A7 fails** (`serializeBook is not defined`).
- [ ] **Step 3: Implement.**
  - Add `function serializeBook(data){ return JSON.stringify(data, null, 2); }` with a comment: `// The one serializer for every book that leaves the app (export, file backup). Self-check A7 proves ids survive it.`
  - Use it in `exportData` and in each backup writer found by grep.
  - In `assertSessionTemplate` add:
    - `if(typeof template.id !== 'string' || !SESSION_ID_RE.test(template.id)) rejectData(source, \`sessionTemplates[${key}] session ${index+1} has an invalid id.\`);`
    - a check that `deliverableIds` is an array of `DELIVERABLE_ID_RE` strings, the same length as `deliverables`, unique; otherwise `rejectData(…, 'has deliverable ids that do not match its deliverables.')`

  A malformed id is **rejected, never re-minted**: re-minting would silently orphan that book's evidence.
- [ ] **Step 4: Run `--expect 379`: green.** Guide 18/18. Also add a negative case inside A7: a v13 envelope whose one template has `deliverableIds` one short must throw from `prepareBookData`, so the validator is shown live.
- [ ] **Step 5: Mutation proof.** Apply the replacer mutation: A7 red, on the random-id session's ids changing. Revert. Diff clean, then green.
- [ ] **Step 6: End-to-end numbers.**
  - Re-run the spec probe, the measurement probe, and `tools/migration-dryrun.mjs` in both modes.
  - Expected spec probe: `delete_session2 reworded [0,0]`, orphaned `[0,3]`, `rename_s1_runbook ["authored","authored"]`, controls 0.
  - Record every number in VALIDATION, split into measured this session and carried.
- [ ] **Step 7: Docs.** Update the counts 378 → 379. Add a CHANGELOG entry for piece 1 (user-visible: per-row deliverable editor, reorder, delete confirmation, schema 13). Update the ledger row: piece 1 → `built`, with the self-check count and commit.
- [ ] **Step 8: Commit.** `git commit -m "Curriculum piece 1 task 7: ids survive export and import (A7)"`

---

## Review (after Task 7)

**Model:** Opus (the top model for the whole-branch review). **Session:** review (`sessions/curriculum-piece-1-review.md`).
`superpowers:requesting-code-review`, then `/code-review` on the branch diff against `master`. Findings are handled via `superpowers:receiving-code-review` in a follow-up session. Re-reviews run on Sonnet.

## Session map

| Session | Plan task | Model | Prompt |
|---|---|---|---|
| plan (done) | 1 (measure) + this plan | Opus | `sessions/curriculum-piece-1-plan.md` |
| build 1 | 2 ids + writer | Sonnet | `sessions/curriculum-piece-1-build-1.md` |
| build 2 | 3 pass 0 (M3 ruled 2026-09-30) | Sonnet | `sessions/curriculum-piece-1-build-2.md` |
| build 3 | 4 notes + runbook by id | Sonnet | `sessions/curriculum-piece-1-build-3.md` |
| build 4 | 5 editor + delete confirm (+ frontend-design, layout only) | Sonnet | `sessions/curriculum-piece-1-build-4.md` |
| build 5 | 6 migration + dry-run | Sonnet | `sessions/curriculum-piece-1-build-5.md` |
| build 6 | 7 export/import | Sonnet | `sessions/curriculum-piece-1-build-6.md` |
| review | whole branch | Opus | `sessions/curriculum-piece-1-review.md` |

No two tasks share a session. Tasks 3 and 4 are both small, but they touch different areas (matching versus notes and runbooks). Tasks 6 and 7 share the import boundary, but Task 6 runs a child process (headless Chrome), which the pairing rule excludes.

Every build session works on branch `curriculum-piece-1`. Build 1 creates it from `master`, and later sessions continue on it. Each session makes one commit, and merging is Ian's call.
