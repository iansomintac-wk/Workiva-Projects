# Outcome Criteria & Evidence — Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the numbered Success Outcome real success criteria, real evidence, and a computed verdict — so that `ADMIN_GAP_DEFS`' existing claim that "the numbered outcome is what graduation is judged against" becomes true instead of aspirational.

**Architecture:** Criteria are **derived**, not authored: they come from the account's own curriculum (`template.deliverables[]`, 12–15 per module, already clamped to `totalSessions` by `getSessionTemplateSet()`). Nothing is stored until a criterion is acted on; the first act **materializes** it with an opaque id and a text snapshot, and evidence is keyed by that id alone. `outcomeVerdict()` is a pure function over criteria, evidence, the three compliance gates and open blockers — it stores nothing.

**Tech Stack:** Single-file vanilla HTML/CSS/JS (`osm-book-of-business-tracker-1.0.html`, ~22,600 lines). No build step, no dependencies. Tests are an in-page `check()` suite run headlessly via `tools/selfcheck.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-09-outcome-criteria-and-evidence-design.md` — **Phase A only.** Phases B (repointed session checkbox, derived First Value) and C (graduation verdict, override, admin gap def) are separate plans and are explicitly out of scope here.

## Global Constraints

- **Target file:** `osm-book-of-business-tracker-1.0.html`. Branch `outcome-criteria-evidence`.
- **Suite command:** `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect <n>`. Chrome launch plus parsing 1.4MB takes 30–60 seconds — use a generous timeout. Exit 0 pass, 1 checks failed or count mismatched, 2 harness failure.
- **Suite starts at 324.** Each task states its own expected count. Never adjust `--expect` to match what you got.
- **Every new check must be demonstrated failing before it is accepted.** Three of the seven checks written into the previous plan passed while asserting nothing, and all three went green on their first run. A green check that was never seen red is not evidence.
- **`outcomeCriteriaFor()` and `outcomeVerdict()` are PURE.** No writes, no materialization, no `saveData()`. Rendering that mutates persistent state is the file's most-repeated defect — `readSessionNote`/`getSessionNote` (line 5765) exist because of it, and v97 made purity a rule.
- **Ids are opaque and assigned once.** `oc_<8 chars>` via the existing `uid()` (line 4720). The positional key `s<session>#<index>` is a **display key only and is never stored** — not in `items`, not in `removed`, not in `outcomeEvidence`.
- **Never invent a date.** A migrated tick gets `on: null`, not `todayISO()`. `null` means unknown; unknown is not zero.
- **Nothing is deleted from `sessionNotes[n].deliverables`.** It is left intact and unread. Phase B repoints its UI; this plan does not touch it.
- **`DEFAULT_OUTCOME_NAMES` is 18 entries** (line 4088) and `outcomeNumber` is 1-based against it.
- Commit after each task. End every commit message with exactly:
```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
```

## Design correction found while reading the code

The spec says a derived criterion is excluded when its id is in `outcomeCriteria.removed[]`. Taken literally that would store a **positional** key in `removed`, reintroducing the exact fragility opaque ids exist to prevent.

**Ruling, folded into this plan:** *any* act on a derived criterion — evidencing it **or** removing it — materializes it first. `removed[]` therefore holds only opaque ids, and the positional key never reaches storage. Task 2 implements removal that way.

## File structure

One file, four new regions:

| Region | Responsibility | Goes near |
|---|---|---|
| Criteria derivation | `outcomeCriterionKey()`, `outcomeCriteriaFor()` — pure | After `getSessionTemplate()` (~line 5714) |
| Evidence store | `materializeOutcomeCriterion()`, `setOutcomeEvidence()`, `clearOutcomeEvidence()`, `removeOutcomeCriterion()` — the only writers | Immediately after the derivation region |
| The verdict | `outcomeVerdict()` — pure | Immediately after the evidence store |
| Persistence | backfill defaults, validation, migration 11→12 | `backfillCustomerRecord` (21218), `assertNormalizedBookData` (~21627), `migrateData` (~4362) |

---

### Task 1: Criteria derivation

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html` — add functions after `getSessionTemplate()` (~5714); add checks after the `phase2` checks (~8530)

**Interfaces:**
- Consumes: `getSessionTemplateSet(customer)` → array of `{title, ttfvStage, enable[], deliverables[]}`, already clamped to `customer.totalSessions`. `isRecordObject(x)`.
- Produces: `outcomeCriterionKey(sessionNumber, index)` → `'s3#0'`. `outcomeCriteriaFor(customer)` → `[{id, text, stage, source, sourceSession, sourceIndex, evidence, provisional?}]`, in curriculum order, then unmatched materialized items. `evidence` is the stored record or `null`. `source` is one of `'curriculum'`, `'curriculum (reworded since)'`, `'no longer in the curriculum'`, `'added for this account'`.

- [ ] **Step 1: Write the failing checks**

Insert after the last `phase2` check block closes:

```javascript
  (function(){
    /* Phase A: criteria are DERIVED from the account's own curriculum and clamp
       to its own plan length. An 8-session account must not inherit criteria
       from sessions 9-12 it will never run. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc1__', name:'Crit Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__oc1__: []};
      _renderMemoResets.forEach(r => r());
      const list = outcomeCriteriaFor(c);
      const sessions = [...new Set(list.map(x => x.sourceSession))].sort((a,b)=>a-b);
      const clamped = sessions.every(n => n >= 1 && n <= 8);
      const allProvisional = list.every(x => x.provisional === true && x.evidence === null);
      const hasStages = list.every(x => x.stage === 'ttfv1' || x.stage === 'ttfv2');
      const keysUnique = new Set(list.map(x => x.id)).size === list.length;
      ok = list.length > 0 && clamped && allProvisional && hasStages && keysUnique;
      detail = JSON.stringify({n:list.length, sessions, clamped, allProvisional, hasStages, keysUnique});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    _renderMemoResets.forEach(r => r());
    check('phaseA criteria derive from the curriculum and clamp to the account plan', ok, detail);
  })();
  (function(){
    /* PURE. Deriving criteria must not materialize anything, must not touch the
       book, and must return byte-identical output twice. renderToday() stamping
       DATA.riskLog is the defect class this guards against. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc2__', name:'Pure Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__oc2__: []};
      const before = JSON.stringify(c);
      const a = JSON.stringify(outcomeCriteriaFor(c));
      const b = JSON.stringify(outcomeCriteriaFor(c));
      ok = a === b && JSON.stringify(c) === before
        && c.outcomeCriteria === undefined && c.outcomeEvidence === undefined;
      detail = JSON.stringify({stable: a === b, bookUntouched: JSON.stringify(c) === before,
        materialized: c.outcomeCriteria !== undefined});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA deriving criteria is pure and materializes nothing', ok, detail);
  })();
  (function(){
    /* A materialized criterion whose deliverable was later DELETED from the
       curriculum still appears, labelled. Discarding an evidenced criterion
       because a template changed would throw away a human's assertion. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc3__', name:'Ghost Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.outcomeCriteria = {items:[
        {id:'oc_ghost1', text:'A deliverable no template still carries', stage:'ttfv1',
         sourceSession:2, sourceIndex:9},
        {id:'oc_added1', text:'Something the OSM added', stage:'ttfv2',
         sourceSession:null, sourceIndex:null}
      ], removed:[]};
      DATA.customers = [c]; DATA.activities = {__oc3__: []};
      const list = outcomeCriteriaFor(c);
      const ghost = list.find(x => x.id === 'oc_ghost1');
      const added = list.find(x => x.id === 'oc_added1');
      ok = !!ghost && ghost.source === 'no longer in the curriculum'
        && !!added && added.source === 'added for this account';
      detail = JSON.stringify({ghost: ghost && ghost.source, added: added && added.source});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA a deleted-from-curriculum criterion survives, labelled', ok, detail);
  })();
```

- [ ] **Step 2: Run the suite to verify all three fail**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 327
```

Expected: `324/327 passed, 3 failed`, each detail reporting `outcomeCriterionKey is not defined` or `outcomeCriteriaFor is not defined`. Exit 1.

- [ ] **Step 3: Add the derivation functions**

Insert immediately after `getSessionTemplate()`:

```javascript
/* ============ OUTCOME CRITERIA ============
   ADMIN_GAP_DEFS has said since it was written that "the numbered outcome is
   what graduation is judged against", and then checked a boolean. Every read of
   outcomeNumber was a <select>'s selected-state or a name lookup; nothing
   reasoned over it. These functions are what make that sentence true.

   Criteria are DERIVED, never authored from nothing: the curriculum already
   states 12-15 deliverables per module, already specific, already grouped by
   ttfvStage. getSessionTemplateSet() already clamps them to the account's own
   totalSessions. Nothing is stored until a criterion is acted on.

   Identity is OPAQUE and assigned once, at materialization. The positional key
   below is for display and DOM attributes only and must never be stored: a
   deliverable inserted mid-list shifts every later position, and the inserted
   one would inherit the evidence of whatever used to sit there. */
function outcomeCriterionKey(sessionNumber, index){ return 's' + sessionNumber + '#' + index; }

/* PURE. Returns the account's criteria in curriculum order, then any
   materialized item the curriculum no longer carries. Writes nothing. */
function outcomeCriteriaFor(customer){
  if(!customer) return [];
  const store = isRecordObject(customer.outcomeCriteria) ? customer.outcomeCriteria : {};
  const stored = Array.isArray(store.items) ? store.items : [];
  const removed = new Set(Array.isArray(store.removed) ? store.removed : []);
  const evidence = isRecordObject(customer.outcomeEvidence) ? customer.outcomeEvidence : {};
  const claimed = new Set();
  const out = [];

  getSessionTemplateSet(customer).forEach((tpl, i) => {
    const sessionNumber = i + 1;
    (tpl.deliverables || []).forEach((text, idx) => {
      /* Match a materialized item by (sourceSession, text) first so a REORDERED
         deliverable keeps its evidence, then by (sourceSession, sourceIndex) so
         a REWORDED one does too. */
      const hit = stored.find(s => !claimed.has(s.id) && s.sourceSession === sessionNumber && s.text === text)
               || stored.find(s => !claimed.has(s.id) && s.sourceSession === sessionNumber && s.sourceIndex === idx);
      if(hit){
        claimed.add(hit.id);
        if(removed.has(hit.id)) return;
        out.push({id:hit.id, text:hit.text, stage:hit.stage || tpl.ttfvStage || '',
          source: hit.text === text ? 'curriculum' : 'curriculum (reworded since)',
          sourceSession:sessionNumber, sourceIndex:idx, evidence: evidence[hit.id] || null});
        return;
      }
      out.push({id: outcomeCriterionKey(sessionNumber, idx), text, stage: tpl.ttfvStage || '',
        source:'curriculum', sourceSession:sessionNumber, sourceIndex:idx,
        evidence:null, provisional:true});
    });
  });

  stored.forEach(s => {
    if(claimed.has(s.id) || removed.has(s.id)) return;
    out.push({id:s.id, text:s.text, stage:s.stage || '',
      source: s.sourceSession ? 'no longer in the curriculum' : 'added for this account',
      sourceSession: s.sourceSession || null, sourceIndex: s.sourceIndex,
      evidence: evidence[s.id] || null});
  });
  return out;
}
```

- [ ] **Step 4: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 327
```

Expected: `327/327 passed, 0 failed`. Exit 0.

- [ ] **Step 5: Prove the purity check has teeth**

Temporarily add `customer.outcomeCriteria = customer.outcomeCriteria || {items:[],removed:[]};` as the second line of `outcomeCriteriaFor`. Re-run. The purity check MUST go red with `materialized:true`. Paste the detail string into your report, then remove that line and re-run green.

- [ ] **Step 6: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -F- <<'EOF'
feat: derive outcome success criteria from the curriculum

The numbered Success Outcome has been a dropdown nothing read. Criteria now
derive from the account's own template deliverables — 12-15 per module,
already written, already grouped by ttfvStage, already clamped to the
account's plan length.

Pure: derivation materializes nothing. The positional key it returns is for
display only; storage identity is opaque and assigned once, because a
deliverable inserted mid-list would otherwise inherit the evidence of
whatever used to sit at its index.

327/327.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
EOF
```

---

### Task 2: The evidence store

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html` — add writers after `outcomeCriteriaFor()`; add `outcomeEvidence`/`outcomeCriteria` defaults to `backfillCustomerRecord()` (~21218); add checks after Task 1's

**Interfaces:**
- Consumes: `outcomeCriteriaFor(customer)`, `uid()` (line 4720), `todayISO()`, `isRealISODate()`, `isRecordObject()`.
- Produces:
  - `materializeOutcomeCriterion(customer, criterion)` → the stored `{id, text, stage, sourceSession, sourceIndex}` record. Idempotent by `(sourceSession, sourceIndex)` for derived criteria.
  - `setOutcomeEvidence(customer, criterion, {on, by, activityId, note})` → the stored evidence record. Materializes first. `by` is `'customer' | 'osm' | 'unknown'`.
  - `clearOutcomeEvidence(customer, criterionId)` → `true` if an entry was deleted.
  - `removeOutcomeCriterion(customer, criterion)` → the opaque id it recorded in `removed[]`.
  - `c.outcomeCriteria = {items:[], removed:[]}` and `c.outcomeEvidence = {}` exist on every backfilled record.

- [ ] **Step 1: Write the failing checks**

```javascript
  (function(){
    /* Materialization assigns an OPAQUE id. The positional display key must
       never reach storage — not in items, not in removed, not in the evidence
       map — because it is not stable under insertion. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc4__', name:'Mat Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__oc4__: []};
      const first = outcomeCriteriaFor(c)[0];
      const rec = setOutcomeEvidence(c, first, {on: todayISO(), by:'customer'});
      const keys = Object.keys(c.outcomeEvidence);
      const storedIds = c.outcomeCriteria.items.map(x => x.id);
      const noPositional = keys.concat(storedIds, c.outcomeCriteria.removed)
        .every(k => /^oc_/.test(k));
      // Re-deriving now returns the opaque id in place of the provisional key.
      const after = outcomeCriteriaFor(c)[0];
      ok = /^oc_/.test(rec ? keys[0] : '') && noPositional && keys.length === 1
        && after.id === storedIds[0] && after.provisional !== true
        && after.evidence && after.evidence.by === 'customer';
      detail = JSON.stringify({keys, storedIds, noPositional, afterId: after.id});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA evidence materializes an opaque id and no positional key is ever stored', ok, detail);
  })();
  (function(){
    /* THE TWO WAYS IDENTITY BREAKS, in one check.

       REWORDING: change a deliverable's text and its evidence must follow it,
       via the (sourceSession, sourceIndex) fallback.

       INSERTION: add a deliverable at index 0 of a session that already has
       evidence at index 0. With positional ids the new criterion would silently
       inherit the old one's evidence — the collision opaque ids exist for. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const c = {id:'__oc5__', name:'Insert Co', module:mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__oc5__: []};
      _renderMemoResets.forEach(r => r());
      const original = outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0);
      setOutcomeEvidence(c, original, {on: todayISO(), by:'osm'});
      const evidencedId = c.outcomeCriteria.items[0].id;
      const originalText = original.text;

      // (a) REWORD the deliverable in place. Evidence must follow it.
      DATA.config.sessionTemplates[mod][0].deliverables[0] = originalText + ' (reworded)';
      _renderMemoResets.forEach(r => r());
      const reworded = outcomeCriteriaFor(c).find(x => x.id === evidencedId);
      const survivedReword = !!reworded && !!reworded.evidence
        && reworded.source === 'curriculum (reworded since)' && reworded.text === originalText;

      // (b) Restore, then INSERT a new deliverable at index 0.
      DATA.config.sessionTemplates[mod][0].deliverables[0] = originalText;
      DATA.config.sessionTemplates[mod][0].deliverables.unshift('BRAND NEW DELIVERABLE');
      _renderMemoResets.forEach(r => r());
      const after = outcomeCriteriaFor(c);
      const inserted = after.find(x => x.text === 'BRAND NEW DELIVERABLE');
      const kept = after.find(x => x.id === evidencedId);
      const survivedInsert = !!inserted && inserted.evidence === null
        && !!kept && kept.text === originalText && !!kept.evidence && kept.evidence.by === 'osm';

      ok = survivedReword && survivedInsert;
      detail = JSON.stringify({survivedReword, survivedInsert,
        rewordedSource: reworded && reworded.source,
        insertedEvidence: inserted && inserted.evidence,
        keptHasEvidence: !!(kept && kept.evidence)});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('phaseA rewording follows evidence, and inserting neither moves nor inherits it', ok, detail);
  })();
  (function(){
    /* Un-ticking DELETES the entry and keeps the criterion, so re-ticking reuses
       the same identity instead of minting a second one. And removing a derived
       criterion materializes it first, so removed[] holds only opaque ids. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc6__', name:'Toggle Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__oc6__: []};
      const first = outcomeCriteriaFor(c)[0];
      setOutcomeEvidence(c, first, {on: todayISO(), by:'osm'});
      const id = c.outcomeCriteria.items[0].id;
      clearOutcomeEvidence(c, id);
      const gone = c.outcomeEvidence[id] === undefined;
      const criterionKept = c.outcomeCriteria.items.some(x => x.id === id);
      setOutcomeEvidence(c, outcomeCriteriaFor(c).find(x => x.id === id), {on: todayISO(), by:'osm'});
      const sameIdentity = c.outcomeCriteria.items.length === 1 && !!c.outcomeEvidence[id];
      // Removal of a still-provisional criterion must materialize it.
      const second = outcomeCriteriaFor(c).find(x => x.provisional === true);
      const removedId = removeOutcomeCriterion(c, second);
      const removedOpaque = /^oc_/.test(removedId) && c.outcomeCriteria.removed.indexOf(removedId) !== -1;
      const excluded = !outcomeCriteriaFor(c).some(x => x.id === removedId);
      ok = gone && criterionKept && sameIdentity && removedOpaque && excluded;
      detail = JSON.stringify({gone, criterionKept, sameIdentity, removedId, removedOpaque, excluded});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA un-ticking keeps identity, and removal stores only opaque ids', ok, detail);
  })();
```

- [ ] **Step 2: Run the suite to verify all three fail**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 331
```

Expected: `328/331 passed, 3 failed` — `setOutcomeEvidence is not defined`. Exit 1.

- [ ] **Step 3: Add the writers**

Insert immediately after `outcomeCriteriaFor()`:

```javascript
/* The ONLY writers of criteria and evidence. Everything else reads.

   Materialization is what anchors identity: a criterion earns a stored record
   the first time anyone acts on it, and from then on its opaque id is what
   evidence is keyed by. Removal materializes too, so removed[] can never hold
   a positional key. */
function materializeOutcomeCriterion(customer, criterion){
  if(!isRecordObject(customer.outcomeCriteria)) customer.outcomeCriteria = {items:[], removed:[]};
  if(!Array.isArray(customer.outcomeCriteria.items)) customer.outcomeCriteria.items = [];
  if(!Array.isArray(customer.outcomeCriteria.removed)) customer.outcomeCriteria.removed = [];
  if(criterion && !criterion.provisional){
    const known = customer.outcomeCriteria.items.find(x => x.id === criterion.id);
    if(known) return known;
  }
  const dup = customer.outcomeCriteria.items.find(x =>
    x.sourceSession === (criterion.sourceSession || null) && x.sourceIndex === criterion.sourceIndex);
  if(dup) return dup;
  /* sourceCount is what makes the index fallback in outcomeCriteriaFor safe: it
     only trusts a stored sourceIndex while the session still holds the same
     number of deliverables. A session that gained or lost one has shifted every
     later position, and matching on the index there would attach one
     criterion's evidence to a different criterion, silently. */
  const count = criterion.sourceSession
    ? ((getSessionTemplateSet(customer)[criterion.sourceSession - 1] || {}).deliverables || []).length
    : null;
  const rec = {id:'oc_' + uid().slice(0, 8), text: String(criterion.text || ''),
    stage: criterion.stage || '', sourceSession: criterion.sourceSession || null,
    sourceIndex: criterion.sourceIndex === undefined ? null : criterion.sourceIndex,
    sourceCount: count};
  customer.outcomeCriteria.items.push(rec);
  return rec;
}

const OUTCOME_EVIDENCE_BY = ['customer', 'osm', 'unknown'];

function setOutcomeEvidence(customer, criterion, rec){
  if(!customer || !criterion) return null;
  const stored = materializeOutcomeCriterion(customer, criterion);
  if(!isRecordObject(customer.outcomeEvidence)) customer.outcomeEvidence = {};
  const on = (rec && isRealISODate(rec.on)) ? rec.on : null;   // never invent a date
  const by = (rec && OUTCOME_EVIDENCE_BY.indexOf(rec.by) !== -1) ? rec.by : 'unknown';
  const out = {on, by};
  if(rec && typeof rec.activityId === 'string' && rec.activityId) out.activityId = rec.activityId;
  if(rec && typeof rec.note === 'string' && rec.note.trim()) out.note = rec.note.trim().slice(0, 500);
  if(rec && rec.legacy === true) out.legacy = true;
  customer.outcomeEvidence[stored.id] = out;
  return out;
}

/* Deleting the entry, rather than storing {met:false}, keeps "evidenced" a
   single question — does a record exist — instead of two. The criterion itself
   stays, so re-ticking reuses the same identity. */
function clearOutcomeEvidence(customer, criterionId){
  if(!customer || !isRecordObject(customer.outcomeEvidence)) return false;
  if(customer.outcomeEvidence[criterionId] === undefined) return false;
  delete customer.outcomeEvidence[criterionId];
  return true;
}

function removeOutcomeCriterion(customer, criterion){
  if(!customer || !criterion) return null;
  const stored = materializeOutcomeCriterion(customer, criterion);
  if(customer.outcomeCriteria.removed.indexOf(stored.id) === -1){
    customer.outcomeCriteria.removed.push(stored.id);
  }
  clearOutcomeEvidence(customer, stored.id);
  return stored.id;
}
```

- [ ] **Step 4: Add the backfill defaults**

In `backfillCustomerRecord()` (~21218), immediately after the `c.compliance` lines:

```javascript
  // v99 (Phase A): outcome criteria overrides and the evidence store. Absent
  // means "derive everything, nothing evidenced" — the same contract as every
  // other optional per-account collection here.
  if(!isRecordObject(c.outcomeCriteria)) c.outcomeCriteria = {items:[], removed:[]};
  if(!Array.isArray(c.outcomeCriteria.items)) c.outcomeCriteria.items = [];
  if(!Array.isArray(c.outcomeCriteria.removed)) c.outcomeCriteria.removed = [];
  if(!isRecordObject(c.outcomeEvidence)) c.outcomeEvidence = {};
```

- [ ] **Step 5: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 331
```

Expected: `331/331 passed, 0 failed`. Exit 0.

- [ ] **Step 6: Prove the collision check has teeth**

Temporarily change `materializeOutcomeCriterion`'s id line to `const rec = {id: outcomeCriterionKey(criterion.sourceSession, criterion.sourceIndex), …}` — i.e. store the positional key. Re-run. **Both** the opaque-id check and the insertion check MUST go red. Paste both detail strings, then restore the opaque id and re-run green.

This is the single most important demonstration in the plan: it proves the design's central claim rather than asserting it.

- [ ] **Step 7: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -F- <<'EOF'
feat: the outcome evidence store

Evidence is keyed by an opaque id assigned once, at materialization, with a
text snapshot of the wording it was evidenced against. Un-ticking deletes the
entry and keeps the criterion, so re-ticking reuses the identity. Removal
materializes first, so removed[] can never hold a positional key.

Proven by reverting to positional ids and watching two checks go red: with
them, a deliverable inserted mid-list silently inherits the evidence of
whatever used to sit at its index.

Never invents a date: an evidence record with no valid date stores null.

331/331.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
EOF
```

---

### Task 3: The verdict

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html` — add `outcomeVerdict()` after the writers; add checks after Task 2's

**Interfaces:**
- Consumes: `outcomeCriteriaFor()`, `openBlockers(customer)` → array, `DEFAULT_OUTCOME_NAMES` via `DATA.config.outcomeNames`.
- Produces: `outcomeVerdict(customer)` → `{outcomeNumber, outcomeName, ttfv1:{met,total}, ttfv2:{met,total}, unevidenced:[{id,text,stage}], undated, gates:{outcomePlan,csat,sentiment,gradDate}, openBlockers, state, reasons}`. `state` is `'ready' | 'not_ready' | 'unknown'`. PURE.

- [ ] **Step 1: Write the failing checks**

```javascript
  (function(){
    /* ABSENCE IS NOT FAILURE. An account with no outcome chosen is 'unknown',
       never 'not_ready' — the same principle that stops an unassessed readiness
       domain reading as low readiness. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc7__', name:'Unknown Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = null;
      DATA.customers = [c]; DATA.activities = {__oc7__: []};
      const v = outcomeVerdict(c);
      c.compliance.outcomePlan.outcomeNumber = 4;
      const v2 = outcomeVerdict(c);
      ok = v.state === 'unknown' && v2.state === 'not_ready'
        && v2.outcomeName === DATA.config.outcomeNames[3]
        && v2.reasons.length > 0;
      detail = JSON.stringify({noNumber: v.state, withNumber: v2.state,
        name: v2.outcomeName, reasons: v2.reasons.length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA an unchosen outcome is unknown, not failed', ok, detail);
  })();
  (function(){
    /* The verdict is PURE and counts what it claims: ttfv1/ttfv2 split, an
       explicit undated count so legacy evidence cannot quietly pad the result. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc8__', name:'Count Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = 1;
      DATA.customers = [c]; DATA.activities = {__oc8__: []};
      const list = outcomeCriteriaFor(c);
      const t1 = list.filter(x => x.stage === 'ttfv1');
      setOutcomeEvidence(c, t1[0], {on: todayISO(), by:'osm'});
      setOutcomeEvidence(c, t1[1], {on: null, by:'unknown', legacy:true});
      const before = JSON.stringify(c);
      const a = JSON.stringify(outcomeVerdict(c));
      const b = JSON.stringify(outcomeVerdict(c));
      const v = outcomeVerdict(c);
      ok = a === b && JSON.stringify(c) === before
        && v.ttfv1.met === 2 && v.ttfv1.total === t1.length
        && v.undated === 1 && v.unevidenced.length === list.length - 2;
      detail = JSON.stringify({pure: a === b, untouched: JSON.stringify(c) === before,
        ttfv1: v.ttfv1, undated: v.undated, unevidenced: v.unevidenced.length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA the verdict is pure and counts undated evidence separately', ok, detail);
  })();
  (function(){
    /* 'ready' requires ALL of it: every criterion evidenced, three compliance
       gates, a committed graduation date, no open blockers. Each missing one
       must produce a reason, not a silent downgrade. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc9__', name:'Ready Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance = {sentiment:{done:true, date:todayISO(), answerA:'a', answerB:'b'},
        outcomePlan:{done:true, date:todayISO(), outcomeNumber:2, planText:''},
        associatedPeopleCSAT:{done:true, date:todayISO(), contactName:'X'}};
      c.targetGraduationDate = isoAddDays(todayISO(), 30);
      DATA.customers = [c]; DATA.activities = {__oc9__: []};
      outcomeCriteriaFor(c).forEach(x => setOutcomeEvidence(c, x, {on: todayISO(), by:'osm'}));
      const ready = outcomeVerdict(c);
      c.targetGraduationDate = null;
      const noDate = outcomeVerdict(c);
      ok = ready.state === 'ready' && ready.reasons.length === 0
        && noDate.state === 'not_ready' && noDate.reasons.length === 1;
      detail = JSON.stringify({ready: ready.state, readyReasons: ready.reasons,
        noDate: noDate.state, noDateReasons: noDate.reasons});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA ready requires every condition, and each failure names itself', ok, detail);
  })();
```

- [ ] **Step 2: Run the suite to verify all three fail**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 335
```

Expected: `332/335 passed, 3 failed` — `outcomeVerdict is not defined`. Exit 1.

- [ ] **Step 3: Add the verdict**

```javascript
/* PURE. Stores nothing — there is no cached verdict anywhere, because a stored
   verdict is a second source of truth that goes stale the moment anything it
   read changes. */
function outcomeVerdict(customer){
  const op = (customer && customer.compliance && customer.compliance.outcomePlan) || {};
  const names = DATA.config.outcomeNames || [];
  const num = Number.isInteger(op.outcomeNumber) ? op.outcomeNumber : null;
  const list = outcomeCriteriaFor(customer);
  const stageCount = stage => {
    const inStage = list.filter(x => x.stage === stage);
    return {met: inStage.filter(x => x.evidence).length, total: inStage.length};
  };
  const unevidenced = list.filter(x => !x.evidence).map(x => ({id:x.id, text:x.text, stage:x.stage}));
  const undated = list.filter(x => x.evidence && !x.evidence.on).length;
  const gates = {
    outcomePlan: !!op.done,
    csat: !!(customer && customer.compliance && customer.compliance.associatedPeopleCSAT && customer.compliance.associatedPeopleCSAT.done),
    sentiment: !!(customer && customer.compliance && customer.compliance.sentiment && customer.compliance.sentiment.done),
    gradDate: !!(customer && customer.targetGraduationDate)
  };
  const blockers = (typeof openBlockers === 'function' && customer) ? openBlockers(customer).length : 0;

  const reasons = [];
  if(unevidenced.length) reasons.push(`${unevidenced.length} success criteri${unevidenced.length===1?'on is':'a are'} unevidenced`);
  if(blockers) reasons.push(`${blockers} open blocker${blockers===1?'':'s'}`);
  if(!gates.gradDate) reasons.push('no committed graduation date');
  if(!gates.outcomePlan) reasons.push('the outcome plan is not marked created');
  if(!gates.csat) reasons.push('no CSAT contact');
  if(!gates.sentiment) reasons.push('no readiness assessment');

  /* An unchosen outcome is UNKNOWN, never failed. Absence of a judgement is not
     a negative judgement — the same rule that stops an unassessed readiness
     domain reading as low readiness. */
  const state = num === null ? 'unknown' : (reasons.length ? 'not_ready' : 'ready');

  return {outcomeNumber: num, outcomeName: num ? (names[num - 1] || 'Customer Success Outcome') : null,
    ttfv1: stageCount('ttfv1'), ttfv2: stageCount('ttfv2'),
    unevidenced, undated, gates, openBlockers: blockers, state,
    reasons: state === 'unknown' ? [] : reasons};
}
```

- [ ] **Step 4: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 335
```

Expected: `335/335 passed, 0 failed`. Exit 0.

- [ ] **Step 5: Prove the unknown/failed distinction has teeth**

Temporarily change the `state` line to `const state = reasons.length ? 'not_ready' : 'ready';` — dropping the unknown branch. Re-run. The first check MUST go red with `noNumber:"not_ready"`. Paste the detail, restore, re-run green.

- [ ] **Step 6: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -F- <<'EOF'
feat: outcomeVerdict() — a computed graduation verdict

Pure, and stores nothing. Counts criteria by ttfv stage, reports undated
evidence separately so a migrated tick cannot quietly pad the result, and
names every unmet condition rather than printing a bare state.

An account with no outcome chosen is 'unknown', never 'not_ready'. Absence
of a judgement is not a negative judgement.

335/335.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
EOF
```

---

### Task 4: Migration 11 → 12, and validation

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html` — `CURRENT_SCHEMA_VERSION` (line 4102); new migration step after `v = 11;` (~4362); `assertNormalizedBookData` customer loop (~21627); checks after Task 3's

**Interfaces:**
- Consumes: `materializeOutcomeCriterion()`, `setOutcomeEvidence()`, `getSessionTemplateSet()`.
- Produces: `CURRENT_SCHEMA_VERSION === 12`. Every `sessionNotes[n].deliverables[label] === true` becomes a legacy evidence record; `sessionNotes` itself is untouched.

- [ ] **Step 1: Write the failing checks**

```javascript
  (function(){
    /* MIGRATION. A ticked deliverable becomes evidence with on:null — never a
       date the book does not have. A label the template no longer carries was
       ALREADY orphaned before this change; it is preserved as a custom
       criterion rather than dropped, because a human ticked it. */
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      const firstLabel = DATA.config.sessionTemplates[mod][0].deliverables[0];
      const book = {schemaVersion: 11, config: JSON.parse(JSON.stringify(DATA.config)),
        customers: [{id:'__mig1__', name:'Mig Co', module: mod,
          stage: DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
          totalSessions:8, domainScores:{}, stageHistory:[{stage:DATA.config.stages[1].key, date: isoAddDays(todayISO(), -200)}],
          sessionNotes:{ '1': {deliverables:{}, prep:''} },
          compliance: defaultCompliance()}],
        activities: {__mig1__: []}};
      book.customers[0].sessionNotes['1'].deliverables[firstLabel] = true;
      book.customers[0].sessionNotes['1'].deliverables['A LABEL NO TEMPLATE CARRIES'] = true;
      book.customers[0].sessionNotes['1'].deliverables['AN UNTICKED ONE'] = false;
      migrateData(book);
      const c = book.customers[0];
      const ids = Object.keys(c.outcomeEvidence || {});
      const everyLegacyUndated = ids.every(k => c.outcomeEvidence[k].on === null
        && c.outcomeEvidence[k].legacy === true && c.outcomeEvidence[k].by === 'unknown');
      const orphan = (c.outcomeCriteria.items || []).find(x => x.text === 'A LABEL NO TEMPLATE CARRIES');
      const matched = (c.outcomeCriteria.items || []).find(x => x.text === firstLabel);
      const untickedSkipped = ids.length === 2;
      const sessionNotesIntact = c.sessionNotes['1'].deliverables[firstLabel] === true;
      ok = book.schemaVersion === 12 && everyLegacyUndated && !!orphan && !!matched
        && orphan.sourceSession === null && matched.sourceSession === 1
        && untickedSkipped && sessionNotesIntact;
      detail = JSON.stringify({v: book.schemaVersion, ids: ids.length, everyLegacyUndated,
        orphan: !!orphan, matched: !!matched, untickedSkipped, sessionNotesIntact});
    }catch(err){ detail = err.message; }
    check('phaseA migration turns ticks into undated legacy evidence and drops nothing', ok, detail);
  })();
  (function(){
    /* The migration must be IDEMPOTENT — running it twice must not double the
       evidence, because migrateData runs on every import as well as on load. */
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      const label = DATA.config.sessionTemplates[mod][0].deliverables[0];
      const mk = () => ({schemaVersion: 11, config: JSON.parse(JSON.stringify(DATA.config)),
        customers: [{id:'__mig2__', name:'Idem Co', module: mod,
          stage: DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
          totalSessions:8, domainScores:{}, stageHistory:[{stage:DATA.config.stages[1].key, date: isoAddDays(todayISO(), -200)}],
          sessionNotes:{ '1': {deliverables:{[label]: true}, prep:''} },
          compliance: defaultCompliance()}],
        activities: {__mig2__: []}});
      const once = mk(); migrateData(once);
      const twice = mk(); migrateData(twice); twice.schemaVersion = 11; migrateData(twice);
      const a = Object.keys(once.customers[0].outcomeEvidence).length;
      const b = Object.keys(twice.customers[0].outcomeEvidence).length;
      const itemsA = once.customers[0].outcomeCriteria.items.length;
      const itemsB = twice.customers[0].outcomeCriteria.items.length;
      ok = a === 1 && b === 1 && itemsA === 1 && itemsB === 1;
      detail = JSON.stringify({evidenceOnce:a, evidenceTwice:b, itemsOnce:itemsA, itemsTwice:itemsB});
    }catch(err){ detail = err.message; }
    check('phaseA the migration is idempotent', ok, detail);
  })();
  (function(){
    /* An imported book carrying malformed outcome data must be REJECTED at the
       boundary, not silently repaired into something plausible. */
    let ok = false, detail = '';
    try{
      const base = () => ({schemaVersion: 12, config: JSON.parse(JSON.stringify(DATA.config)),
        customers: [{id:'__val1__', name:'Val Co', module: DATA.config.modules[0],
          stage: DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
          totalSessions:8, domainScores:{}, sessionNotes:{},
          stageHistory:[{stage:DATA.config.stages[1].key, date: isoAddDays(todayISO(), -200)}],
          compliance: defaultCompliance(), outcomeCriteria:{items:[], removed:[]}, outcomeEvidence:{}}],
        activities: {__val1__: []});
      const badDate = base();
      badDate.customers[0].outcomeEvidence['oc_x'] = {on:'not-a-date', by:'osm'};
      let rejectedDate = false;
      try{ prepareBookData(badDate, 'Test'); }catch(e){ rejectedDate = true; }
      const badBy = base();
      badBy.customers[0].outcomeEvidence['oc_y'] = {on:null, by:'nonsense'};
      let rejectedBy = false;
      try{ prepareBookData(badBy, 'Test'); }catch(e){ rejectedBy = true; }
      const good = base();
      good.customers[0].outcomeEvidence['oc_z'] = {on:null, by:'unknown', legacy:true};
      let accepted = false;
      try{ prepareBookData(good, 'Test'); accepted = true; }catch(e){ accepted = false; }
      ok = rejectedDate && rejectedBy && accepted;
      detail = JSON.stringify({rejectedDate, rejectedBy, accepted});
    }catch(err){ detail = err.message; }
    check('phaseA malformed outcome evidence is rejected at the import boundary', ok, detail);
  })();
```

- [ ] **Step 2: Run the suite to verify all three fail**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 338
```

Expected: `335/338 passed, 3 failed`. Exit 1.

- [ ] **Step 3: Bump the schema version**

Line 4102: `const CURRENT_SCHEMA_VERSION = 11;` → `12`, and update its trailing comment to `// Phase A: + per-account outcome criteria and evidence`.

- [ ] **Step 4: Add the migration step**

Immediately after the `v = 11;` line and its closing `}`:

```javascript
  if(v === 11){
    /* v11 -> v12 (Phase A): per-account outcome criteria and evidence.

       INFERS NO DATES. A ticked deliverable is a real human act and becomes
       evidence, but the book never recorded WHEN, so `on` is null and `legacy`
       says why. Stamping todayISO() here would manufacture a history that never
       happened — the same reasoning as the v10->v11 impactLog step above.

       A label the template no longer carries was ALREADY orphaned before this
       change; it is preserved as a custom criterion rather than dropped,
       because someone ticked it. sessionNotes is left completely intact: Phase
       B repoints its UI, and deleting user data to tidy a field is not a risk
       worth taking in an app whose only store is localStorage. */
    (data.customers || []).forEach(c => {
      if(!isRecordObject(c)) return;
      if(!isRecordObject(c.outcomeCriteria)) c.outcomeCriteria = {items:[], removed:[]};
      if(!Array.isArray(c.outcomeCriteria.items)) c.outcomeCriteria.items = [];
      if(!Array.isArray(c.outcomeCriteria.removed)) c.outcomeCriteria.removed = [];
      if(!isRecordObject(c.outcomeEvidence)) c.outcomeEvidence = {};
      if(!isRecordObject(c.sessionNotes)) return;
      const templates = (data.config && data.config.sessionTemplates
        && data.config.sessionTemplates[c.module]) || [];
      Object.keys(c.sessionNotes).forEach(key => {
        const note = c.sessionNotes[key];
        if(!/^\d+$/.test(key) || !isRecordObject(note) || !isRecordObject(note.deliverables)) return;
        const sessionNumber = parseInt(key, 10);
        const tpl = templates[sessionNumber - 1];
        const labels = (tpl && Array.isArray(tpl.deliverables)) ? tpl.deliverables : [];
        Object.keys(note.deliverables).forEach(label => {
          if(note.deliverables[label] !== true) return;      // an unticked box is not evidence
          const idx = labels.indexOf(label);
          const criterion = idx === -1
            ? {text: label, stage:'', sourceSession: null, sourceIndex: null}
            : {text: label, stage: tpl.ttfvStage || '', sourceSession: sessionNumber, sourceIndex: idx};
          const already = c.outcomeCriteria.items.find(x =>
            x.text === label && x.sourceSession === criterion.sourceSession);
          if(already){
            if(c.outcomeEvidence[already.id] === undefined){
              c.outcomeEvidence[already.id] = {on:null, by:'unknown', legacy:true};
            }
            return;
          }
          const rec = materializeOutcomeCriterion(c, criterion);
          c.outcomeEvidence[rec.id] = {on:null, by:'unknown', legacy:true};
        });
      });
    });
    v = 12;
  }
```

- [ ] **Step 5: Add validation**

In `assertNormalizedBookData`'s customer loop, immediately after the `c.firstValue` block:

```javascript
    if(c.outcomeCriteria !== undefined){
      if(!isRecordObject(c.outcomeCriteria) || !Array.isArray(c.outcomeCriteria.items)
        || !Array.isArray(c.outcomeCriteria.removed)) rejectData(source, `${label} has invalid outcome criteria.`);
      c.outcomeCriteria.items.forEach((it,j)=>{
        if(!isRecordObject(it) || typeof it.id !== 'string' || !it.id || typeof it.text !== 'string'){
          rejectData(source, `${label} outcome criterion ${j+1} is invalid.`);
        }
      });
    }
    if(c.outcomeEvidence !== undefined){
      if(!isRecordObject(c.outcomeEvidence)) rejectData(source, `${label} has invalid outcome evidence.`);
      Object.entries(c.outcomeEvidence).forEach(([id, ev])=>{
        if(!isRecordObject(ev)) rejectData(source, `${label} outcome evidence ${id} is invalid.`);
        if(ev.on !== null && !isRealISODate(ev.on)) rejectData(source, `${label} outcome evidence ${id} has an invalid date.`);
        if(OUTCOME_EVIDENCE_BY.indexOf(ev.by) === -1) rejectData(source, `${label} outcome evidence ${id} has an unknown source.`);
      });
    }
```

- [ ] **Step 6: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 338
```

Expected: `338/338 passed, 0 failed`. Exit 0.

If `v74.4` (the whole-book guard) fails, a check above mutated `DATA.config.sessionTemplates` without restoring it — Task 2's insertion check deep-clones and restores; confirm yours does too.

- [ ] **Step 7: Prove the no-invented-date rule has teeth**

Temporarily change the migration's two evidence writes from `{on:null, …}` to `{on: todayISO(), …}`. Re-run. The migration check MUST go red with `everyLegacyUndated:false`. Paste the detail, restore `null`, re-run green.

- [ ] **Step 8: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -F- <<'EOF'
feat: migrate ticked deliverables into outcome evidence (schema 11 -> 12)

Every ticked deliverable becomes an evidence record. It never becomes a
dated one: the book never recorded when, so `on` is null and `legacy` says
why. Stamping today's date would manufacture a history that never happened.

A label no template still carries was already orphaned before this change;
it is preserved as a custom criterion rather than dropped, because someone
ticked it. sessionNotes is left completely intact — Phase B repoints its UI.

Idempotent, and malformed outcome data is rejected at the import boundary
rather than silently repaired.

338/338.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
EOF
```

---

### Task 5: The Overview surface

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html` — `renderOverviewTab(c, risk)` (~17317); CSS near the existing `.bp-*` rules; checks after Task 4's

**Interfaces:**
- Consumes: `outcomeCriteriaFor()`, `outcomeVerdict()`, `escapeHtml()`, `escapeAttr()`, `fmtDate()`.
- Produces: `renderOutcomeCriteria(c)` → HTML string. **Read-only in Phase A** — no controls, no writes. Phase B adds capture; Phase C adds the verdict's graduation role.

- [ ] **Step 1: Write the failing checks**

```javascript
  (function(){
    /* The panel states the verdict and names what is outstanding. Read-only in
       Phase A: rendering must emit no control that writes, because the capture
       UI is Phase B and a half-wired control is worse than none. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__ov1__', name:'View Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = 4;
      DATA.customers = [c]; DATA.activities = {__ov1__: []};
      const list = outcomeCriteriaFor(c);
      setOutcomeEvidence(c, list[0], {on: todayISO(), by:'customer'});
      setOutcomeEvidence(c, list[1], {on: null, by:'unknown', legacy:true});
      const before = JSON.stringify(c);
      const html = renderOutcomeCriteria(c);
      const v = outcomeVerdict(c);
      const namesOutcome = html.indexOf(escapeHtml(v.outcomeName)) !== -1;
      const showsStages = html.indexOf('ttfv1') !== -1 || html.toLowerCase().indexOf('first value') !== -1;
      const showsUndated = html.indexOf('date unknown') !== -1;
      const noWriters = !/data-(oc|outcome)-(set|clear|remove|tick)/.test(html)
        && html.indexOf('<input') === -1 && html.indexOf('<textarea') === -1;
      const pure = JSON.stringify(c) === before;
      ok = namesOutcome && showsStages && showsUndated && noWriters && pure;
      detail = JSON.stringify({namesOutcome, showsStages, showsUndated, noWriters, pure});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA the outcome panel states the verdict, is read-only, and renders purely', ok, detail);
  })();
  (function(){
    /* Criterion text is user-controlled once an OSM edits it. Every one must be
       escaped, or a criterion containing a quote breaks the markup. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__ov2__', name:'Esc Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = 1;
      c.outcomeCriteria = {items:[{id:'oc_xss1', text:'<img src=x onerror=alert(1)> & "quoted"',
        stage:'ttfv2', sourceSession:null, sourceIndex:null}], removed:[]};
      DATA.customers = [c]; DATA.activities = {__ov2__: []};
      const html = renderOutcomeCriteria(c);
      ok = html.indexOf('<img src=x') === -1 && html.indexOf('&lt;img') !== -1
        && html.indexOf('&amp;') !== -1;
      detail = JSON.stringify({rawImg: html.indexOf('<img src=x') !== -1,
        escaped: html.indexOf('&lt;img') !== -1});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA criterion text is escaped in the outcome panel', ok, detail);
  })();
```

- [ ] **Step 2: Run the suite to verify both fail**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 344
```

Expected: `338/340 passed, 2 failed` — `renderOutcomeCriteria is not defined`. Exit 1.

- [ ] **Step 3: Add the renderer**

Insert immediately before `renderOverviewTab()`:

```javascript
/* PURE. Read-only in Phase A: no control here writes anything, because capture
   is Phase B and a half-wired checkbox is worse than no checkbox. */
function renderOutcomeCriteria(c){
  const v = outcomeVerdict(c);
  if(v.state === 'unknown'){
    return `<div class="section-card" style="margin-top:16px;">
      <div class="section-title" style="margin-top:0;">Success outcome</div>
      <p class="bp-basis" style="margin:0;">No numbered outcome chosen yet, so there is nothing to judge graduation against. Pick one on the Edit account tab.</p>
    </div>`;
  }
  const list = outcomeCriteriaFor(c);
  const row = x => {
    const ev = x.evidence;
    const mark = ev ? '✓' : '○';
    const meta = !ev ? '' : ev.on
      ? `met ${fmtDate(ev.on)} · ${escapeHtml(ev.by === 'customer' ? 'customer demonstrated' : ev.by === 'osm' ? 'OSM observed' : 'source unknown')}`
      : 'met — date unknown, predates evidence tracking';
    const note = x.source === 'curriculum' ? '' : ` <span class="bp-basis">(${escapeHtml(x.source)})</span>`;
    return `<div class="oc-row${ev ? ' oc-met' : ''}">
      <span class="oc-mark">${mark}</span>
      <span class="oc-text">${escapeHtml(x.text)}${note}
        ${meta ? `<span class="oc-meta">${meta}</span>` : ''}</span>
    </div>`;
  };
  const group = (label, stage, counts) => {
    const rows = list.filter(x => x.stage === stage);
    if(!rows.length) return '';
    return `<div class="oc-group">
      <div class="lbl">${escapeHtml(label)} <span class="bp-basis">${counts.met} of ${counts.total}</span></div>
      ${rows.map(row).join('')}
    </div>`;
  };
  const other = list.filter(x => x.stage !== 'ttfv1' && x.stage !== 'ttfv2');
  return `
    <div class="section-card" style="margin-top:16px;">
      <div class="section-title" style="margin-top:0;">Success outcome <span class="badge ${v.state === 'ready' ? 'badge-ontrack' : 'badge-watch'}">${v.state === 'ready' ? 'READY' : 'NOT READY'}</span></div>
      <p class="bp-basis" style="margin:-4px 0 10px;">Outcome ${v.outcomeNumber} · ${escapeHtml(v.outcomeName)}</p>
      ${group('First value', 'ttfv1', v.ttfv1)}
      ${group('Outcome', 'ttfv2', v.ttfv2)}
      ${other.length ? `<div class="oc-group"><div class="lbl">Other</div>${other.map(row).join('')}</div>` : ''}
      ${v.reasons.length ? `<p class="bp-basis" style="margin:10px 0 0;">Not ready: ${escapeHtml(v.reasons.join(' · '))}.</p>` : ''}
      ${v.undated ? `<p class="bp-basis" style="margin:6px 0 0;">${v.undated} criteri${v.undated===1?'on was':'a were'} ticked before evidence was tracked, so ${v.undated===1?'its date is':'their dates are'} unknown.</p>` : ''}
    </div>`;
}
```

- [ ] **Step 4: Add the CSS**

Beside the existing `.bp-*` rules:

```css
  /* Outcome criteria. A list, not a table — the text is the content and the
     mark is an annotation on it. */
  .oc-group{margin-top:12px;}
  .oc-row{display:flex; gap:var(--space-2); align-items:baseline; padding:4px 0;
    font-size:var(--text-sm); color:var(--text-dim);}
  .oc-row.oc-met{color:var(--text);}
  .oc-mark{font-family:var(--font-mono); color:var(--text-faint); flex:0 0 auto;}
  .oc-row.oc-met .oc-mark{color:var(--status-ontrack-text, var(--accent-info));}
  .oc-text{min-width:0; overflow-wrap:anywhere;}
  .oc-meta{display:block; font-size:var(--text-xs); color:var(--text-faint); margin-top:2px;}
```

- [ ] **Step 5: Call it from the Overview tab**

In `renderOverviewTab(c, risk)`, insert `${renderOutcomeCriteria(c)}` as the LAST interpolation in the returned template — immediately before its final closing backtick and any wrapper `</div>`. It is a self-contained `section-card` like the blocks above it, so it needs no surrounding markup. Do not restructure anything already in that function.

- [ ] **Step 6: Run the suite**

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 344
```

Expected: `340/340 passed, 0 failed`. Exit 0.

- [ ] **Step 7: Prove the escaping check has teeth**

Temporarily change `${escapeHtml(x.text)}` to `${x.text}`. Re-run. The escaping check MUST go red with `rawImg:true`. Paste the detail, restore, re-run green.

- [ ] **Step 8: Look at it in a browser**

The suite cannot see layout. Open the file in Chrome, run `demo-seed.js` in the console, open an account's Overview tab and confirm:

1. The criteria list renders grouped by First value / Outcome, with counts.
2. An account with an outcome number and no evidence shows every criterion unticked and a NOT READY badge with reasons.
3. Nothing on the panel is clickable — Phase A is read-only.
4. Narrow the window below 900px and confirm nothing overflows horizontally.

- [ ] **Step 9: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html
git commit -F- <<'EOF'
feat: show outcome criteria and the verdict on the account Overview

Grouped by ttfv stage, with each criterion's evidence date and source, and
the verdict's reasons named rather than a bare state. Criteria ticked before
evidence tracking say so instead of showing an invented date.

Read-only: capture is Phase B, and a half-wired control is worse than none.

340/340.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
EOF
```

---

## Verification of the whole plan

```bash
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 344
node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18
```

Expected: `340/340` exit 0. **The guide reports 17/18 and has done since before this work** — `quick mode actually removes the guided-only chapters` fails on a file identical to master. Pre-existing, out of scope; run it only to confirm this branch did not make it worse.

**Then, on a copy of the real book:** Export JSON from the current app first. Load the export into the new build and confirm the migration ran — every previously ticked deliverable appears as a criterion marked *date unknown*, and no account lost one.

## Out of scope — deliberately

- **Evidence capture.** No control in Phase A writes evidence. Phase B repoints the session checkbox.
- **`sessionNotes[n].deliverables`.** Left intact and unread. Phase B owns it.
- **First Value derivation.** Phase B.
- **Graduation verdict, the override record, the new admin gap def.** Phase C.
- **The Today beat.** Phase 3 of the other spec consumes `outcomeVerdict()`; wiring it twice is waste.

## Notes for the executor

- **Line numbers drift.** Anchor on unique surrounding strings.
- **`migrateData` runs on every import as well as on load.** Anything you add there must be idempotent — Task 4 check 2 asserts it.
- **Any check that mutates `DATA.config`** must deep-clone and restore it. `v74.4` compares the whole book and will catch you.
- **If a check passes on its first run, stop.** It is not testing what you think. Make it fail before you make it pass — three checks in the previous plan shipped green and asserted nothing.
