# Outcome Criteria & Evidence — Phase B (Capture) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the outcome evidence store writable from the UI an OSM already uses, and let First Value maintain itself from the criteria it is actually made of.

**Architecture:** Phase A shipped criteria, an evidence store, a pure verdict and a read-only panel. Nothing in the running app can add evidence — the only records that exist are what the v11→v12 migration built from historical ticks. Phase B repoints the one control that already means "this deliverable happened" — the session card's deliverable checkbox — at `setOutcomeEvidence` / `clearOutcomeEvidence`, so ticking a box produces a dated, attributed record instead of a boolean in a parallel store. `getFirstValue()` then gains a derived path: a recorded `achievedOn` still wins, but an account with every `ttfv1` criterion evidenced no longer needs a human to stamp the date.

**Tech Stack:** Single-file vanilla HTML/CSS/JS (`osm-book-of-business-tracker-1.0.html`, ~1.53 MB). No build step, no dependencies. In-page self-check suite (`window.runSelfChecks()`), executed headless by `tools/selfcheck.mjs` over CDP.

**Spec:** `docs/superpowers/specs/2026-09-09-outcome-criteria-and-evidence-design.md` — §3 (Evidence), §5 (First Value becomes derived), §8 (Repointing the session checkbox), §11 checks 8 and 11, §12 row B.

## Global Constraints

- **One file.** Every change lands in `osm-book-of-business-tracker-1.0.html`. No new runtime files, no npm packages, no build step.
- **Reads stay pure.** Rendering and any `get*`/`read*` helper must not mutate the book. This is the v61/v90/v95/v97 bug family; the `v74.4` whole-book comparison guard is the standing enforcement and must stay green.
- **Never invent a date.** `setOutcomeEvidence` already refuses a non-ISO `on` and stores `null`. Derived First Value must return `null` rather than guess when every criterion's evidence is legacy.
- **Every new check must be demonstrated FAILING before it is accepted.** Six checks written during Phase A passed while asserting nothing; the red-flip rule is the only reason they were caught. A check that has never been seen to fail is not evidence.
- **Check naming:** `check('phaseB <sentence>', ok, detail)`, matching the `phaseA` block at lines 9021–9664.
- **Fixture pattern:** build a customer literal, call `backfillCustomerRecord(c)`, swap `DATA.customers` / `DATA.activities`, restore them in a trailing statement outside the `try`. Copy the shape at line 9570. If you touch `DATA.config.sessionTemplates`, restore it AND call `_renderMemoResets.forEach(r => r())`.
- **Suite arithmetic:** starts at **354**. Task 1 → 357, Task 2 → 359, Task 3 → 360, Task 4 → 363, Task 5 → 364.
- **The gate is a command, not a console read:**
  ```
  node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect <N>
  ```
  Exit 0 pass, 1 suite failure, 2 harness failure. Never pipe it to `tail` and read `$?` — that reports tail's exit code. Redirect to a file and read the file.
- **`note.deliverables` is left physically intact.** The migration's contract is that it only ever adds. Phase B stops reading and writing the field; it does not delete it. A handler that writes to two stores is exactly the second truth this phase exists to end.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `osm-book-of-business-tracker-1.0.html` | Modify, 5 regions | The whole app |
| `VALIDATION.txt` | Modify | Records what was verified and what was not |
| `CHANGELOG.txt`, `README.txt`, `guide-manifest.json` | Modify | Carry the suite count; all three currently say 354 |

The five regions in the tracker, at the line numbers as of `b1e5d1c`. **Re-grep before editing** — a plan is not a line-number oracle, and these have moved once per commit for forty commits.

| Region | Line | Anchor to grep |
|---|---|---|
| A. `getFirstValue` | 5613 | `function getFirstValue(c){` |
| B. evidence writers | 6071–6106 | `function setOutcomeEvidence(customer, criterion, rec){` |
| C. outcome panel row renderer | 18851 | `const list = outcomeCriteriaFor(c);` inside `renderOutcomeCriteria` |
| D. session card deliverables render | 19461–19472 | `const checked = !!note.deliverables[label];` |
| E. session card deliverable handler | 21279–21286 | `note.deliverables[label] = chk.checked;` |

Self-checks all land in the `phaseA` block, appended after the check at line 9664 (`phaseA the panel tells the two unknown states apart`).

---

## Task 1: Repoint the deliverable checkbox at the evidence store

Render and write move together. Splitting them ships an intermediate where ticking a box changes nothing visible — a state a reviewer should reject, so it is not a task boundary.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html` region D (render, ~19461) and region E (handler, ~21279)
- Modify: `osm-book-of-business-tracker-1.0.html` — three new checks appended after line ~9664

**Interfaces:**
- Consumes: `outcomeCriteriaFor(customer) -> [{id, text, stage, source, sourceSession, sourceIndex, evidence, provisional?}]` (pure); `setOutcomeEvidence(customer, criterion, {on, by, activityId?, note?, legacy?}) -> {on, by, ...}`; `clearOutcomeEvidence(customer, criterionId) -> boolean`; `getSessionActivity(customer, sessionNumber) -> activity|null`; `todayISO()`.
- Produces: the DOM contract `data-session-deliverable="<customerId>|<sessionNumber>|<index>"` (unchanged from today), and the invariant that a ticked box means an entry exists in `customer.outcomeEvidence`.

- [ ] **Step 1: Write the three failing checks**

Append inside the self-check block, after the `phaseA the panel tells the two unknown states apart` IIFE (~line 9664):

```js
  (function(){
    /* Phase B / Spec 8. The tick is the capture UI. Phase A shipped an
       evidence store nothing could write to; this is the one control an OSM
       already uses that means "this deliverable happened", so it is the one
       that should write. Ticking records a dated, attributed entry; un-ticking
       DELETES it (Spec 3 — "evidenced" stays a single question) while leaving
       the materialized criterion, so re-ticking reuses the same identity
       rather than minting a second one. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb1__', name:'Tick Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb1__: []};

      const crit = outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0);
      const rec = setOutcomeEvidence(c, crit, {on: todayISO(), by:'osm'});
      const id = Object.keys(c.outcomeEvidence)[0];
      const opaque = /^oc_[0-9a-f]{8}$/.test(id);
      const dated = rec.on === todayISO() && rec.by === 'osm';
      const rendersTicked = /data-session-deliverable="__pb1__\|1\|0"[^>]*checked/
        .test(renderSessionCard(c, 1, getSessionTemplate(c, 1), false));

      clearOutcomeEvidence(c, id);
      const goneFromEvidence = c.outcomeEvidence[id] === undefined;
      const criterionSurvives = c.outcomeCriteria.items.some(x => x.id === id);
      const rendersUnticked = !/data-session-deliverable="__pb1__\|1\|0"[^>]*checked/
        .test(renderSessionCard(c, 1, getSessionTemplate(c, 1), false));

      // Re-ticking reuses the SAME identity — no second record.
      const again = outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0);
      setOutcomeEvidence(c, again, {on: todayISO(), by:'osm'});
      const oneIdentity = c.outcomeCriteria.items
        .filter(x => x.sourceSession === 1 && x.sourceIndex === 0).length === 1
        && again.id === id;

      ok = opaque && dated && rendersTicked && goneFromEvidence && criterionSurvives
        && rendersUnticked && oneIdentity;
      detail = JSON.stringify({opaque, dated, rendersTicked, goneFromEvidence,
        criterionSurvives, rendersUnticked, oneIdentity});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB a ticked deliverable is evidence, and un-ticking deletes it without losing identity', ok, detail);
  })();
  (function(){
    /* A tick migrated from a legacy book carries {on:null, legacy:true}. It is
       still a real human act, so the box must read TICKED — an account that
       used the tracker before evidence tracking existed must not open to a
       wall of empty checkboxes and look like it lost its history. The second
       assertion is the one that matters: the box BESIDE it, which nobody
       ticked, must not read ticked. A render that hardcoded checked would pass
       the first half on its own. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb2__', name:'Legacy Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb2__: []};
      const tpl = getSessionTemplate(c, 2);
      const twoOrMore = tpl.deliverables.length >= 2;   // the fixture must be able to fail
      const crit = outcomeCriteriaFor(c).find(x => x.sourceSession === 2 && x.sourceIndex === 0);
      setOutcomeEvidence(c, crit, {on: null, by:'unknown', legacy:true});

      const html = renderSessionCard(c, 2, tpl, false);
      const firstTicked = /data-session-deliverable="__pb2__\|2\|0"[^>]*checked/.test(html);
      const secondClear = !/data-session-deliverable="__pb2__\|2\|1"[^>]*checked/.test(html);

      ok = twoOrMore && firstTicked && secondClear;
      detail = JSON.stringify({deliverables: tpl.deliverables.length, twoOrMore, firstTicked, secondClear});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB an undated legacy tick still reads as ticked, and its neighbour does not', ok, detail);
  })();
  (function(){
    /* v97 again, on the region this task edits. renderSessionCard now calls
       outcomeCriteriaFor, which walks the template set and returns provisional
       criteria for anything not yet materialized. If any of that leaked a
       write, opening the Session Plan tab would stamp criteria onto every
       account in the book. Whole-book comparison, not a spot check. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb3__', name:'Pure Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb3__: []};
      const before = JSON.stringify(DATA.customers);
      for(let n = 1; n <= c.totalSessions; n++) renderSessionCard(c, n, getSessionTemplate(c, n), n === 1);
      ok = JSON.stringify(DATA.customers) === before;
      detail = ok ? 'unchanged' : 'the session card wrote to the book';
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB rendering every session card still writes nothing', ok, detail);
  })();
```

- [ ] **Step 2: Run them and watch all three fail**

```
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 357 > "$CLAUDE_JOB_DIR/tmp/t1-red.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t1-red.txt"
```

Expected: exit 1. `phaseB a ticked deliverable…` fails on `rendersTicked` — the render still reads `note.deliverables`, which is empty. `phaseB an undated legacy tick…` fails on `firstTicked` for the same reason.

**`phaseB rendering every session card still writes nothing` will PASS on its first run.** It guards a regression this task could introduce, not a defect that exists today. To satisfy the red-flip rule, flip it deliberately: temporarily change `readSessionNote` to `getSessionNote` inside `renderSessionCard`, confirm the check fails, then revert. Record both outputs.

- [ ] **Step 3: Repoint the render**

Region D. Replace the `tpl.deliverables.map(...)` block — the one containing `const checked = !!note.deliverables[label];` — with:

```js
          ${(()=>{
            /* v100 / Spec 8. ONE truth. The tick reads the evidence store, not
               the parallel boolean map in the session note. That map still
               exists in stored data — the migration only ever adds — but
               nothing reads it for meaning any more.
               outcomeCriteriaFor is resolved ONCE per card: it walks the whole
               template set, and calling it inside the map would walk it
               thirteen times to render one session. */
            const criteria = outcomeCriteriaFor(c);
            return tpl.deliverables.map((label,idx)=>{
              const crit = criteria.find(x => x.sourceSession === num && x.sourceIndex === idx);
              const ev = crit ? crit.evidence : null;
              const checked = !!ev;
              return `
              <label class="checklist-item ${checked?'done':''}">
                <input type="checkbox" data-session-deliverable="${c.id}|${num}|${idx}" ${checked?'checked':''}>
                ${escapeHtml(label)}
              </label>
            `;
            }).join('');
          })()}
```

`note` is still read by this function for `note.prep` in the "Notes for next meeting" block — leave that alone. `readSessionNote` stays; only the deliverables map changes.

- [ ] **Step 4: Repoint the handler**

Region E. Replace the whole `$$('[data-session-deliverable]')` listener with:

```js
    $$('[data-session-deliverable]').forEach(chk => chk.addEventListener('change', e=>{
      /* v100 / Spec 8. Ticking is a claim about the world, so it records one:
         today's date, attributed to the OSM by default, linked to the session's
         logged activity when there is one. Un-ticking DELETES the entry rather
         than storing {met:false} — Spec 3.
         No render() call: the old handler never re-rendered either, and
         re-rendering here would collapse every open run-script <details> on the
         page under the user's cursor. */
      const [custId, numStr, idxStr] = chk.dataset.sessionDeliverable.split('|');
      const num = parseInt(numStr, 10), idx = parseInt(idxStr, 10);
      const crit = outcomeCriteriaFor(c).find(x => x.sourceSession === num && x.sourceIndex === idx);
      if(!crit) return;
      if(chk.checked){
        const act = getSessionActivity(c, num);
        const rec = {on: todayISO(), by:'osm'};
        if(act) rec.activityId = act.id;
        setOutcomeEvidence(c, crit, rec);
      } else if(!crit.provisional){
        clearOutcomeEvidence(c, crit.id);
      }
      saveData();
    }));
```

The `!crit.provisional` guard matters. A provisional criterion has a positional placeholder id and no stored record, so there is nothing to clear; passing that id to `clearOutcomeEvidence` would be a no-op that only reads as one by accident.

- [ ] **Step 5: Run the suite**

```
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 357 > "$CLAUDE_JOB_DIR/tmp/t1-green.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t1-green.txt"
```

Expected: exit 0, `357/357 passed, 0 failed`. A count of 356 or 358 means a check was miscounted or an existing one broke — read the failure list before touching anything.

- [ ] **Step 6: Commit**

```
git add osm-book-of-business-tracker-1.0.html
git commit -F - <<'MSG'
Repoint the session deliverable tick at the evidence store

Phase A shipped criteria, an evidence store, a verdict and a panel, and
nothing in the running app could write a single evidence record. The only
records that could exist were what the migration built from history.

The deliverable checkbox already means "this happened". It now says so in
a form that carries a date and an attribution, instead of a boolean in a
parallel map. sessionNotes[n].deliverables is left physically intact — the
migration's contract is that it only ever adds — but nothing reads it for
meaning any more.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
MSG
```

---

## Task 2: Attribute the evidence and link the activity

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html` region D (add the control), region E (add its handler), plus one CSS rule
- Modify: `osm-book-of-business-tracker-1.0.html` — two new checks

**Interfaces:**
- Consumes: everything Task 1 consumes, plus `OUTCOME_EVIDENCE_BY = ['customer','osm','unknown']`.
- Produces: the DOM contract `data-deliverable-by="<customerId>|<sessionNumber>|<index>"` on a `<select>`; the invariant that changing it preserves `on` and `activityId`.

**A deviation from the spec, stated rather than smuggled.** §8 asks for "a control to mark it customer-demonstrated and to link the activity." The attribution gets a real control. The activity link is made automatically from `getSessionActivity(c, num)` rather than through a picker, because the session card is already scoped to exactly one session and that session's logged call *is* the activity that proves its deliverables. A picker would ask the user to answer a question the card already knows the answer to. When no activity is logged, no `activityId` key is written at all — never a fabricated link.

- [ ] **Step 1: Write the two failing checks**

```js
  (function(){
    /* Spec 3: `by` distinguishes "the customer demonstrated it" from "we
       observed it" — the difference between evidence and assertion, and the
       thing a graduation conversation actually turns on. Changing it must not
       cost the record its date or its activity link; a control that silently
       reset `on` to today would quietly move this account's TTFV every time
       someone corrected who did the demonstrating. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb4__', name:'By Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb4__: []};
      const crit = outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0);
      const older = isoAddDays(todayISO(), -30);
      setOutcomeEvidence(c, crit, {on: older, by:'osm', activityId:'act_fixed'});
      const id = Object.keys(c.outcomeEvidence)[0];

      const fresh = outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0);
      setOutcomeEvidence(c, fresh, Object.assign({}, fresh.evidence, {by:'customer'}));
      const ev = c.outcomeEvidence[id];
      const keptDate = ev.on === older;
      const keptLink = ev.activityId === 'act_fixed';
      const nowCustomer = ev.by === 'customer';
      const oneRecord = Object.keys(c.outcomeEvidence).length === 1;

      const html = renderSessionCard(c, 1, getSessionTemplate(c, 1), false);
      const hasControl = html.indexOf('data-deliverable-by="__pb4__|1|0"') !== -1;
      const showsCustomer = /data-deliverable-by="__pb4__\|1\|0"[\s\S]{0,400}?<option value="customer" selected/
        .test(html);
      // The box nobody ticked must not offer a live attribution control.
      const neighbourDisabled = /data-deliverable-by="__pb4__\|1\|1"[^>]*disabled/.test(html);

      ok = keptDate && keptLink && nowCustomer && oneRecord && hasControl
        && showsCustomer && neighbourDisabled;
      detail = JSON.stringify({keptDate, keptLink, nowCustomer, oneRecord, hasControl,
        showsCustomer, neighbourDisabled});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB evidence can be marked customer-demonstrated without losing its date or its link', ok, detail);
  })();
  (function(){
    /* The link is made from the session's own logged activity, and ONLY when
       one exists. Both halves are asserted on the same account, because a
       handler that always wrote activityId would pass the first half and
       fabricate a reference on the second. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb5__', name:'Link Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c];
      DATA.activities = {__pb5__: [{id:'act_s3', type:'Call', date: isoAddDays(todayISO(), -5),
        summary:'Session 3 held', sessionNumber:3, checklist:[], flagged:false}]};

      // Session 3 HAS an activity; session 4 does not. Same code path, both ways.
      [3, 4].forEach(n => {
        const crit = outcomeCriteriaFor(c).find(x => x.sourceSession === n && x.sourceIndex === 0);
        const act = getSessionActivity(c, n);
        const rec = {on: todayISO(), by:'osm'};
        if(act) rec.activityId = act.id;
        setOutcomeEvidence(c, crit, rec);
      });

      const stored = Object.keys(c.outcomeEvidence).map(k => c.outcomeEvidence[k]);
      const twoRecords = stored.length === 2;
      const oneLinked = stored.filter(x => x.activityId === 'act_s3').length === 1;
      const oneUnlinked = stored.filter(x => !('activityId' in x)).length === 1;

      ok = twoRecords && oneLinked && oneUnlinked;
      detail = JSON.stringify({twoRecords, oneLinked, oneUnlinked, stored});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB a deliverable ticked during a logged session links that activity, and never invents one', ok, detail);
  })();
```

- [ ] **Step 2: Run them and watch both fail**

```
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 359 > "$CLAUDE_JOB_DIR/tmp/t2-red.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t2-red.txt"
```

Expected: exit 1. The first fails on `hasControl` — no such element exists yet.

The second exercises `setOutcomeEvidence` directly and **will pass on its first run**. Flip it by temporarily changing `if(act) rec.activityId = act.id;` to assign `'act_s3'` unconditionally, confirm `oneUnlinked` goes false, then revert. Record both outputs.

- [ ] **Step 3: Add the control to the render**

Inside the map added in Task 1, replace the returned template with:

```js
              const by = ev ? (ev.by || 'unknown') : 'osm';
              const sel = v => by === v ? ' selected' : '';
              return `
              <label class="checklist-item ${checked?'done':''}">
                <input type="checkbox" data-session-deliverable="${c.id}|${num}|${idx}" ${checked?'checked':''}>
                ${escapeHtml(label)}
                <select class="deliverable-by" data-deliverable-by="${c.id}|${num}|${idx}"
                  title="Who demonstrated this? Evidence the customer showed you is worth more at graduation than something you observed."
                  ${checked?'':'disabled'}>
                  <option value="osm"${sel('osm')}>we observed it</option>
                  <option value="customer"${sel('customer')}>customer demonstrated</option>
                  ${by === 'unknown' ? '<option value="unknown" selected>source unknown</option>' : ''}
                </select>
              </label>
            `;
```

`unknown` is offered only when the stored record already carries it. It is what the migration produced, not a choice worth giving anyone.

Add the style beside the existing `.checklist-item` rule — grep `\.checklist-item`:

```css
    .deliverable-by { margin-left:8px; font-size:var(--text-xs); color:var(--text-faint);
      background:transparent; border:1px solid var(--border-soft); border-radius:4px; padding:1px 4px; }
    .deliverable-by:disabled { opacity:.35; }
```

- [ ] **Step 4: Add its handler, and have the tick enable it**

In region E, after `saveData();` inside the checkbox listener and before its closing brace:

```js
      /* Enable the attribution control in place rather than re-rendering. A
         render here would collapse every open <details> on the page. */
      const bySel = document.querySelector(`[data-deliverable-by="${chk.dataset.sessionDeliverable}"]`);
      if(bySel){ bySel.disabled = !chk.checked; if(chk.checked) bySel.value = 'osm'; }
```

Then, immediately after that listener:

```js
    $$('[data-deliverable-by]').forEach(sel => sel.addEventListener('change', ()=>{
      /* Attribution only. The date and the activity link are the record's other
         two facts and must survive being re-attributed — resetting `on` to
         today here would move this account's TTFV every time someone corrected
         who did the demonstrating. */
      const [custId, numStr, idxStr] = sel.dataset.deliverableBy.split('|');
      const num = parseInt(numStr, 10), idx = parseInt(idxStr, 10);
      const crit = outcomeCriteriaFor(c).find(x => x.sourceSession === num && x.sourceIndex === idx);
      if(!crit || !crit.evidence) return;
      setOutcomeEvidence(c, crit, Object.assign({}, crit.evidence, {by: sel.value}));
      saveData();
    }));
```

- [ ] **Step 5: Run the suite**

```
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 359 > "$CLAUDE_JOB_DIR/tmp/t2-green.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t2-green.txt"
```

Expected: exit 0, `359/359`.

- [ ] **Step 6: Look at it, do not only test it**

```
node tools/inspect.mjs osm-book-of-business-tracker-1.0.html demo-seed.js sessions "$CLAUDE_JOB_DIR/tmp/t2-sessions"
```

Read the `.txt` and open the `.png`. A `<select>` inside a `<label>` that also contains a checkbox can toggle that checkbox when clicked, because the label forwards the click to its control. Confirm in the capture that the control renders inline and that clicking it is not the same click target as the box. If it is, move the `<select>` outside the `<label>` and hold the row together with a wrapper `<div>`.

- [ ] **Step 7: Commit**

```
git add osm-book-of-business-tracker-1.0.html
git commit -F - <<'MSG'
Attribute deliverable evidence and link the session that produced it

"The customer demonstrated it" and "we observed it" are different claims,
and the difference is what a graduation conversation turns on. The tick
now carries which one, and links the session's logged activity when there
is one — never a fabricated reference when there is not.

Re-attributing preserves the date and the link. A control that reset `on`
to today would have moved this account's TTFV every time someone corrected
who did the demonstrating.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
MSG
```

---

## Task 3: Render the evidence note

Parked in Phase A because nothing could create a note. Tasks 1–2 make `note` reachable through `setOutcomeEvidence`'s existing `note` field — trimmed, capped at 500 characters — so the panel must stop discarding it.

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html` region C — the `row` closure inside `renderOutcomeCriteria` (~18852) — plus one CSS rule
- Modify: `osm-book-of-business-tracker-1.0.html` — one new check

**Interfaces:**
- Consumes: `criterion.evidence.note` — a trimmed string of at most 500 characters, or absent.
- Produces: nothing new.

- [ ] **Step 1: Write the failing check**

```js
  (function(){
    /* setOutcomeEvidence has accepted and stored `note` since Phase A, and the
       panel has silently discarded it since Phase A — invisible until Phase B
       made notes reachable. It is OSM-authored free text, so the escaping half
       is not decoration: a note containing markup must not become markup. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb6__', name:'Note Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = 4;
      DATA.customers = [c]; DATA.activities = {__pb6__: []};
      const list = outcomeCriteriaFor(c);
      const manyCriteria = list.length >= 2;      // the fixture must be able to fail
      const raw = 'Dana walked us through it live <b>on screen</b> & signed off';
      setOutcomeEvidence(c, list[0], {on: todayISO(), by:'customer', note: raw});
      // A second evidenced criterion with NO note, so an empty element shows up.
      setOutcomeEvidence(c, outcomeCriteriaFor(c)[1], {on: todayISO(), by:'osm'});

      const html = renderOutcomeCriteria(c);
      const shows = html.indexOf(escapeHtml(raw)) !== -1;
      const notRawMarkup = html.indexOf('<b>on screen</b>') === -1;
      const noEmpties = (html.match(/class="oc-note"/g) || []).length === 1;

      ok = manyCriteria && shows && notRawMarkup && noEmpties;
      detail = JSON.stringify({criteria: list.length, manyCriteria, shows, notRawMarkup,
        noteEls: (html.match(/class="oc-note"/g) || []).length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB an evidence note is shown, escaped, and absent when there is none', ok, detail);
  })();
```

- [ ] **Step 2: Run it and watch it fail**

```
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 360 > "$CLAUDE_JOB_DIR/tmp/t3-red.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t3-red.txt"
```

Expected: exit 1, failing on `shows` and on `noteEls: 0` — the note is stored and never rendered.

- [ ] **Step 3: Render it**

In `renderOutcomeCriteria`'s `row` closure, after the `<span class="oc-meta">` line and before the closing `</span></div>`:

```js
        ${ev && ev.note ? `<span class="oc-note">${escapeHtml(ev.note)}</span>` : ''}
```

Add the style beside `.oc-meta` — grep `\.oc-meta`:

```css
    .oc-note { display:block; font-size:var(--text-xs); color:var(--text-faint);
      font-style:italic; margin-top:2px; }
```

- [ ] **Step 4: Run the suite**

```
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 360 > "$CLAUDE_JOB_DIR/tmp/t3-green.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t3-green.txt"
```

Expected: exit 0, `360/360`.

- [ ] **Step 5: Commit**

```
git add osm-book-of-business-tracker-1.0.html
git commit -F - <<'MSG'
Show the evidence note the store has always accepted

setOutcomeEvidence has stored `note` since Phase A and the panel has
discarded it since Phase A. Nothing could create one until the tick started
writing evidence, so the gap was invisible.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
MSG
```

---

## Task 4: Derive First Value from the ttfv1 criteria

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html` region A — add `derivedFirstValueDate` above `getFirstValue` (~5613) and rewrite `getFirstValue`'s body
- Modify: `osm-book-of-business-tracker-1.0.html` ~18893 — the Overview First Value badge, so a derived date says it is derived
- Modify: `osm-book-of-business-tracker-1.0.html` — three new checks

**Interfaces:**
- Consumes: `outcomeCriteriaFor(customer)`, `isRealISODate(s) -> boolean`, `ISO_DATE_RE`.
- Produces:
  - `derivedFirstValueDate(customer) -> string|null` — PURE.
  - `getFirstValue(c) -> {definition, evidence, achievedOn, derivedFrom}`. `derivedFrom` is `'ttfv1'` when `achievedOn` came from criteria, otherwise `null`. Purely additive: the existing three keys keep their meaning and their types, so all fourteen existing call sites are unaffected.

**Two rules that read backwards if you skim them.**

1. **Latest, not earliest.** `recomputeFirstValueAchievedOn` takes the *earliest* activity-evidence date, because any one qualifying activity is sufficient — first value happened when the first proof appeared. The derived path takes the *latest* of the ttfv1 criteria, because it needs *all* of them — first value is not reached until the last of its criteria is. These are different rules for a reason. Do not unify them.

2. **Never derive from an empty list.** `[].every(...)` is `true`. An account whose module authors no ttfv1 deliverables would otherwise derive a first-value date from nothing at all — the same every-of-zero bug that made an empty criteria list report READY in Phase A.

- [ ] **Step 1: Write the three failing checks**

```js
  (function(){
    /* Spec 5. First value stops being a field somebody has to remember to
       stamp. Every ttfv1 criterion evidenced -> the date is the LATEST of them,
       because first value is not reached until the last of its criteria is. One
       criterion short -> no date at all, not a partial one. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb7__', name:'Derive Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb7__: []};
      const t1 = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1');
      const enough = t1.length >= 3;            // the fixture must be able to fail

      // All but the last evidenced -> still nothing.
      for(let i = 0; i < t1.length - 1; i++){
        const live = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1')[i];
        setOutcomeEvidence(c, live, {on: isoAddDays(todayISO(), -(40 - i)), by:'osm'});
      }
      const partial = getFirstValue(c).achievedOn === null;

      // The last one, dated LATER than every other, is the date that wins.
      const last = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1').slice(-1)[0];
      const latest = isoAddDays(todayISO(), -3);
      setOutcomeEvidence(c, last, {on: latest, by:'customer'});
      const fv = getFirstValue(c);
      const derivedIsLatest = fv.achievedOn === latest;
      const labelled = fv.derivedFrom === 'ttfv1';

      // PURE: reading it twice writes nothing.
      const before = JSON.stringify(DATA.customers);
      getFirstValue(c); getFirstValue(c);
      const pure = JSON.stringify(DATA.customers) === before;

      ok = enough && partial && derivedIsLatest && labelled && pure;
      detail = JSON.stringify({ttfv1: t1.length, enough, partial, derivedIsLatest, labelled, pure,
        got: fv.achievedOn, latest});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB first value derives from the last ttfv1 criterion, and not from a partial set', ok, detail);
  })();
  (function(){
    /* Spec 5, the load-bearing half: a date a human asserted ALWAYS wins. The
       recorded date here is deliberately EARLIER than the derived one would be,
       so an implementation that took the max of the two would FAIL rather than
       coincidentally agree. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb8__', name:'Manual Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb8__: []};
      const n = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1').length;
      for(let i = 0; i < n; i++){
        const live = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1')[i];
        setOutcomeEvidence(c, live, {on: isoAddDays(todayISO(), -10), by:'osm'});
      }
      const wouldDerive = derivedFirstValueDate(c);

      const recorded = isoAddDays(todayISO(), -90);
      c.firstValue = {definition:null, evidence:[{date: recorded, note:'demo', activityId:'act_1'}],
        achievedOn: recorded};
      const fv = getFirstValue(c);

      const recordedWins = fv.achievedOn === recorded;
      const notLabelledDerived = fv.derivedFrom === null;
      const differs = wouldDerive !== null && wouldDerive !== recorded;

      ok = recordedWins && notLabelledDerived && differs;
      detail = JSON.stringify({recordedWins, notLabelledDerived, differs, wouldDerive, recorded});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB a recorded achieved date always beats the derived one', ok, detail);
  })();
  (function(){
    /* every() over an empty list is TRUE. An account whose curriculum authors
       no ttfv1 deliverables must derive NOTHING — this is the every-of-zero bug
       that made an empty criteria list report READY in Phase A, in its second
       home. And an account whose ttfv1 evidence is entirely legacy has no dates
       to take a maximum of: null, never a guess. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      const c = {id:'__pb9__', name:'Empty Co', module:mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb9__: []};

      // (a) all-legacy evidence -> every criterion met, and still no date.
      const n = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1').length;
      const hadSome = n > 0;
      for(let i = 0; i < n; i++){
        const live = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1')[i];
        setOutcomeEvidence(c, live, {on: null, by:'unknown', legacy:true});
      }
      const allMet = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1').every(x => x.evidence);
      const legacyGivesNoDate = derivedFirstValueDate(c) === null;

      // (b) no ttfv1 criteria at all -> no date.
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      DATA.config.sessionTemplates[mod].forEach(t => { t.deliverables = []; });
      _renderMemoResets.forEach(r => r());
      const emptyGivesNoDate = derivedFirstValueDate(c) === null
        && outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1').length === 0;

      ok = hadSome && allMet && legacyGivesNoDate && emptyGivesNoDate;
      detail = JSON.stringify({ttfv1: n, hadSome, allMet, legacyGivesNoDate, emptyGivesNoDate});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('phaseB neither an empty ttfv1 list nor all-legacy evidence invents a first-value date', ok, detail);
  })();
```

- [ ] **Step 2: Run them and watch all three fail**

```
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 363 > "$CLAUDE_JOB_DIR/tmp/t4-red.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t4-red.txt"
```

Expected: exit 1, all three failing. A `ReferenceError: derivedFirstValueDate is not defined` is a legitimate red — but confirm the `detail` field actually says that, rather than something unrelated that would have failed anyway.

- [ ] **Step 3: Implement the derived path**

Immediately above `function getFirstValue(c){`:

```js
/* v100 / Spec 5. First value stops being a field somebody has to remember to
   stamp, because the criteria it is made of are now tracked individually.

   A RECORDED achievedOn always wins. recomputeFirstValueAchievedOn stamps that
   one from activity evidence a human marked, and the tracker does not overwrite
   a date a human asserted.

   Two rules here read backwards if you skim them:

   LATEST, not earliest. The activity path takes the earliest date because any
   one qualifying activity is sufficient. This path needs ALL of ttfv1, so first
   value is not reached until the last of its criteria is.

   NEVER from an empty list. [].every() is true, so an account whose module
   authors no ttfv1 deliverables would otherwise derive a date from nothing at
   all — the every-of-zero bug that made an empty criteria list report READY,
   in its second home.

   All-legacy evidence yields null: those ticks are real, but no date was ever
   captured for them and one will not be invented here. */
function derivedFirstValueDate(c){
  if(!c) return null;
  const t1 = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1');
  if(!t1.length) return null;
  if(!t1.every(x => x.evidence)) return null;
  const dates = t1.map(x => x.evidence.on).filter(d => isRealISODate(d));
  if(!dates.length) return null;
  return dates.reduce((max, d) => d > max ? d : max, dates[0]);
}
```

Then replace `getFirstValue`'s body:

```js
function getFirstValue(c){
  const fv = c.firstValue || {};
  const recorded = (typeof fv.achievedOn === 'string' && ISO_DATE_RE.test(fv.achievedOn)) ? fv.achievedOn : null;
  const derived = recorded ? null : derivedFirstValueDate(c);
  return {
    definition: (typeof fv.definition === 'string' && fv.definition.trim()) ? fv.definition.trim() : null,
    evidence: Array.isArray(fv.evidence) ? fv.evidence : [],
    achievedOn: recorded || derived,
    derivedFrom: derived ? 'ttfv1' : null
  };
}
```

- [ ] **Step 4: Say so on screen**

At the Overview First Value badge (~18893, grep ``Achieved ${fmtDate(fv.achievedOn)}``), the tooltip currently reads "Earliest first-value evidence date — see the Activity Log tab." That is now true of only one of the two paths. Replace the badge expression with:

```js
          ${fv.achievedOn
            ? `<span class="badge badge-ontrack" title="${escapeAttr(fv.derivedFrom === 'ttfv1'
                ? 'Derived: every first-value success criterion is evidenced, dated by the last of them. See the Session Plan tab.'
                : 'Earliest first-value evidence date — see the Activity Log tab.')} Information only; does not affect graduation readiness.">${icon('check')} Achieved ${fmtDate(fv.achievedOn)}${fv.derivedFrom === 'ttfv1' ? ' · derived' : ''}</span>`
            : `<span style="font-size:var(--text-xs); color:var(--text-faint);">not yet evidenced — mark evidence in Log Activity, or tick the first-value deliverables on the Session Plan tab</span>`}
```

- [ ] **Step 5: Run the suite**

```
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 363 > "$CLAUDE_JOB_DIR/tmp/t4-green.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t4-green.txt"
```

Expected: exit 0, `363/363`.

**Watch for one specific collateral failure.** `ttfvDays()` reads `getFirstValue().achievedOn`, and `portfolioTTFVStat()` medians it across the book. More accounts now carry dates, so the portfolio median can move, and the `n >= 5` floor can now be crossed by a book that previously fell short. If a pre-existing check asserts a specific median or a specific count of contributing accounts, it is not wrong — the input genuinely changed. Read what it asserts, confirm the new number by hand, and update the check with a comment saying why. Do not weaken the assertion to make it pass.

- [ ] **Step 6: Commit**

```
git add osm-book-of-business-tracker-1.0.html
git commit -F - <<'MSG'
Derive first value from the criteria it is made of

A recorded achievedOn still wins — the tracker does not overwrite a date a
human asserted. But an account with every ttfv1 criterion evidenced no
longer waits for someone to remember to stamp one.

The derived date is the LATEST of those criteria, not the earliest: first
value is not reached until the last of its criteria is. An empty ttfv1 list
derives nothing, because every() over an empty list is true and that is
exactly how an empty criteria list once reported READY.

This can move the portfolio TTFV median. More accounts now carry an honest
date; none carry an invented one.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
MSG
```

---

## Task 5: Assert the second truth is gone, and update the records

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html` — one new check
- Modify: `VALIDATION.txt`, `CHANGELOG.txt`, `README.txt`, `guide-manifest.json`

**Interfaces:**
- Consumes: everything above.
- Produces: nothing.

Spec check 11 says "nothing reads `sessionNotes[n].deliverables` any more." Read literally that is false, and should be: the migration (~4437), `backfillCustomerRecord` (~22797) and the import validator (~23203) all still touch the field, correctly — one translates it, one keeps its shape legal, one refuses a malformed one. What must be true is that nothing reads it *for meaning*, and the assertion that shows that is behavioural: writing to the legacy map must change nothing on screen.

- [ ] **Step 1: Write the check**

```js
  (function(){
    /* Spec check 11. NOT "no code mentions the field" — the migration, the
       backfill and the import validator all still touch it, and should. What
       must be true is that nothing reads it for MEANING.
       The third assertion is the decisive one: setting the legacy boolean
       directly changes nothing on screen. A render that still consulted it
       would show a tick nobody evidenced, and the two stores would silently
       disagree the first time anyone hand-edited a book or restored an old
       export. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb10__', name:'One Truth Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb10__: []};
      const tpl = getSessionTemplate(c, 1);

      const noLegacyRead = renderSessionCard.toString().indexOf('.deliverables[') === -1;

      // Writing evidence must not write the legacy map.
      const notesBefore = JSON.stringify(c.sessionNotes);
      setOutcomeEvidence(c,
        outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0),
        {on: todayISO(), by:'osm'});
      const legacyUntouched = JSON.stringify(c.sessionNotes) === notesBefore;

      // And writing the legacy map must not change what renders.
      const before = renderSessionCard(c, 1, tpl, false);
      const note = getSessionNote(c, 1);            // a WRITER — deliberate here
      note.deliverables[tpl.deliverables[0]] = true;
      note.deliverables[tpl.deliverables[1]] = true;
      const after = renderSessionCard(c, 1, tpl, false);
      const legacyIsInert = before === after;

      ok = noLegacyRead && legacyUntouched && legacyIsInert;
      detail = JSON.stringify({noLegacyRead, legacyUntouched, legacyIsInert});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB the legacy deliverables map is inert — evidence is the only truth', ok, detail);
  })();
```

- [ ] **Step 2: Flip it red on purpose, then green**

This check will **pass on its first run**, because Tasks 1–2 already removed the read. It is the whole point of the phase, so it does not get accepted on a green it was born with. Temporarily restore `const checked = !!note.deliverables[label];` in the render and confirm it fails on `noLegacyRead` **and** on `legacyIsInert` — both halves, not one. Then revert.

```
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 364 > "$CLAUDE_JOB_DIR/tmp/t5-red.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t5-red.txt"
```

Record both the red and the green output.

- [ ] **Step 3: Run both suites green**

```
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 364 > "$CLAUDE_JOB_DIR/tmp/t5-green.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t5-green.txt"
node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18 > "$CLAUDE_JOB_DIR/tmp/t5-guide.txt" 2>&1; echo "exit=$?"; cat "$CLAUDE_JOB_DIR/tmp/t5-guide.txt"
```

Expected: `364/364` and `18/18`, both exit 0.

- [ ] **Step 4: Update the four records that carry the count**

```
grep -rn "354" VALIDATION.txt CHANGELOG.txt README.txt guide-manifest.json
```

Replace each with 364. Then re-measure the hashes rather than editing the old ones — a written number that never met the thing it describes is the exact failure the August record was corrected for:

```
sha256sum osm-book-of-business-tracker-1.0.html osm-runway-onboarding-1.0.html
stat -c '%n %s' osm-book-of-business-tracker-1.0.html osm-runway-onboarding-1.0.html
```

In `VALIDATION.txt`, under **SCOPE OF THE CHANGE SINCE 1.0**, add after the Phase A section:

```
OUTCOME CRITERIA AND EVIDENCE, PHASE B (suite 354 -> 364)
  - The session deliverable checkbox writes evidence. Phase A shipped a store
    that nothing in the running app could write to; the only records that could
    exist were what the migration built from history. Ticking a box now records
    a date, an attribution, and the session's activity where one is logged.
  - sessionNotes[n].deliverables is left physically intact and is no longer read
    for meaning. A check asserts that writing to it changes nothing on screen.
  - First Value derives itself: every ttfv1 criterion evidenced gives an
    achieved date, taken from the LAST of them. A recorded date always wins.
    This can move the portfolio TTFV median — more accounts carry an honest
    date, none carry an invented one.
```

Under **WHAT WAS NOT VERIFIED**, delete the line "Evidence capture from the Overview panel. Phase A ships that panel read-only by design; capture is Phase B." — capture now exists, on the session card rather than the panel. Replace it with what is still untrue:

```
  - The Overview outcome panel remains read-only. Capture landed on the session
    card, where the OSM already ticks deliverables; the panel still only reports.
  - Nobody has ticked a box in a real browser against a real book. Every
    assertion above is a headless render or a direct function call.
```

- [ ] **Step 5: Commit**

```
git add VALIDATION.txt CHANGELOG.txt README.txt guide-manifest.json osm-book-of-business-tracker-1.0.html
git commit -F - <<'MSG'
Assert the legacy deliverables map is inert; update the records to 364

Spec check 11 stated literally — "nothing reads the field" — is false and
should be: the migration translates it, the backfill keeps its shape legal,
the validator refuses a malformed one. What must be true is that nothing
reads it for meaning, and the assertion that shows it is behavioural:
writing the legacy boolean changes nothing on screen.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QCor8uQ3RFXpBXe9D8bCGg
MSG
```

---

## After the last task

Before calling Phase B done, look at it rather than only testing it:

```
node tools/inspect.mjs osm-book-of-business-tracker-1.0.html demo-seed.js sessions "$CLAUDE_JOB_DIR/tmp/pb-sessions"
node tools/inspect.mjs osm-book-of-business-tracker-1.0.html demo-seed.js overview "$CLAUDE_JOB_DIR/tmp/pb-overview"
```

Then run `superpowers:requesting-code-review` over the full branch diff. Phase A's worst defects — real dated evidence silently overwritten, one criterion inheriting another's evidence, a signal permanently capped at severity 3 — were all found by review, and not one of them by a test.

## Out of scope for Phase B, deliberately

- **Graduation verdict, recorded override, the fifth admin gap def** — Phase C, spec §6 and §7.
- **Adding or editing criteria by hand from the panel.** The store supports it (`materializeOutcomeCriterion` accepts a custom criterion, `removeOutcomeCriterion` exists) and no UI reaches it. Nothing in Phase B needs it.
- **Draining `sessionNotes[n].deliverables`.** It is dead weight in stored data and it stays. A handler that writes to two stores is the second truth this phase exists to end.
- **`planLength` not mirroring backfill's `highestLoggedSessionNumber` raise** — parked from Phase A; one edge-case account renders a criterion twice.

## Self-review

**Spec coverage.** §8 render → Task 1 Step 3. §8 write → Task 1 Step 4. §8 "a control to mark it customer-demonstrated and to link the activity" → Task 2, with the auto-link deviation stated. §8 "reads must stay pure" → Task 1 check 3. §3 `note` → Task 3. §5 → Task 4, both halves — derived path and recorded-wins. §11 check 8 → Task 4 checks 1 and 2. §11 check 11 → Task 5. §11 check 12, the `v74.4` whole-book guard, is unchanged and must stay green; every task's suite run covers it. §6, §7 and §11 checks 9–10 are Phase C and are named as out of scope above.

**Placeholders.** None. Every code step carries the actual code, every check carries its assertions, every command carries its arguments and its expected exit code.

**Type consistency.** `outcomeCriteriaFor` returns objects with `sourceSession` (number|null) and `sourceIndex` (number|null); the render and both handlers match on `parseInt`-ed numbers, which is why `numStr`/`idxStr` are parsed rather than compared as strings — a dataset value is a string and `'1' === 1` is false. `setOutcomeEvidence(customer, criterion, rec)` is called with a criterion object, never an id, everywhere. `clearOutcomeEvidence(customer, criterionId)` is called with an id, never an object, everywhere. `derivedFirstValueDate` returns `string|null`; `getFirstValue().derivedFrom` is `'ttfv1'|null` rather than a boolean, so a later phase can add a second derived source without changing the type.
