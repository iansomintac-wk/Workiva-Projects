;
/* MEASUREMENT (throwaway), curriculum piece 1 plan task 1, run 2026-09-30 at a4f9bb3.
   Measures three things on the demo book, module Carbon, 6 non-CSRD accounts, every
   criterion evidenced first (liveness: `ticked` must be > 0):
     - I5: insert one deliverable AND reword another in the same session (two orders),
       with a pure-insert and a pure-reword control.
     - Session notes: does deleting session 2 move notes onto other sessions?
     - Activities: does deleting session 2 move logged calls onto other sessions?
   Run:
     cat demo-seed.js docs/superpowers/specs/2026-09-28-curriculum-identity-measure.js > $TEMP/m.js
     node tools/inspect.mjs osm-book-of-business-tracker-1.0.html --seed $TEMP/m.js --view dashboard --out $TEMP/m > $TEMP/m.log 2>&1
   Read only the `seeded ...` line.
   _DERIVED_FV: the demo seed RECORDS firstValue.achievedOn on these accounts, and
   getFirstValue() prefers a recorded date over the ttfv1-derived one, so with the seed's
   dates ttfvDays cannot move. true clears the recorded date so the derived path runs. */
const _DERIVED_FV = true;
const _mod='Carbon';
const _accts=DATA.customers.filter(c=>c.module===_mod && !c.reportsCSRD);
let _ticked=0; const _recorded=_accts.filter(c=>c.firstValue && c.firstValue.achievedOn).length;
if(_DERIVED_FV) _accts.forEach(c=>{ if(c.firstValue) delete c.firstValue.achievedOn; });
_accts.forEach(c=>{ outcomeCriteriaFor(c).forEach(cr=>{ if(setOutcomeEvidence(c, cr, {on:'2026-08-01', by:'customer'})) _ticked++; }); });
const _orig=JSON.parse(JSON.stringify(DATA.config.sessionTemplates[_mod]));
const _res={derivedFV:_DERIVED_FV, recordedFVOnSeed:_recorded, module:_mod, accounts:_accts.length, ticked:_ticked,
  s1:{title:_orig[0].title, stage:_orig[0].ttfvStage, n:_orig[0].deliverables.length}};
function _m(c){ const cr=outcomeCriteriaFor(c); const t1=cr.filter(x=>x.stage==='ttfv1');
  const texts=cr.map(x=>x.text); const dupText=texts.length-new Set(texts).size;
  return {ttfv1:t1.length, unev:cr.filter(x=>!x.evidence).length, orphan:cr.filter(x=>x.source==='no longer in the curriculum').length,
    reworded:cr.filter(x=>x.source==='curriculum (reworded since)').length, dupText, ttfv:ttfvDays(c)}; }
function _variant(edit){
  /* Edits go through the writer (piece 1): reword keeps the row's id, insert passes id:null. */
  const t=JSON.parse(JSON.stringify(_orig)); const rows=deliverableRows(t[0]); edit(rows); setSessionDeliverables(t[0], rows); DATA.config.sessionTemplates[_mod]=t;
  if(typeof _renderMemoResets!=='undefined') _renderMemoResets.forEach(r=>r());
  const res=_accts.map(_m);
  DATA.config.sessionTemplates[_mod]=JSON.parse(JSON.stringify(_orig));
  if(typeof _renderMemoResets!=='undefined') _renderMemoResets.forEach(r=>r());
  return res;
}
_res.base=_accts.map(_m);
_res.i5_insert0_rewordLast=_variant(d=>{ d[d.length-1].text+=' (reworded)'; d.unshift({id:null, text:'NEW deliverable'}); });
_res.i5_rewordFirst_insertEnd=_variant(d=>{ d[0].text+=' (reworded)'; d.push({id:null, text:'NEW deliverable'}); });
_res.ctl_pureInsert=_variant(d=>{ d.unshift({id:null, text:'NEW deliverable'}); });
_res.ctl_pureReword=_variant(d=>{ d[1].text+=' (reworded)'; });
/* Notes + activities: stamp a note on every session carrying its current title, then delete session 2. */
_accts.forEach(c=>{ c.sessionNotes={}; for(let n=1;n<=c.totalSessions;n++){ c.sessionNotes[n]={deliverables:{}, prep:'PREP:'+_orig[n-1].title}; } });
const _acts=[]; _accts.forEach(c=>{ (DATA.activities[c.id]||[]).forEach(a=>{ if(Number.isInteger(a.sessionNumber)) _acts.push({c, a, title:(_orig[a.sessionNumber-1]||{}).title}); }); });
const _t2=JSON.parse(JSON.stringify(_orig)); _t2.splice(1,1); DATA.config.sessionTemplates[_mod]=_t2;
let notesTotal=0, notesMisplaced=0;
_accts.forEach(c=>{ for(let n=1;n<=c.totalSessions;n++){ const tpl=getSessionTemplate(c,n); const p=readSessionNote(c,n).prep; notesTotal++;
  if(p!=='PREP:'+tpl.title) notesMisplaced++; } });
let actsMis=0; _acts.forEach(x=>{ const tpl=getSessionTemplate(x.c, x.a.sessionNumber); if(!tpl || tpl.title!==x.title) actsMis++; });
_res.delete_s2_notes={notesTotal, notesShownUnderWrongSession:notesMisplaced};
_res.delete_s2_activities={sessionLinkedActivities:_acts.length, nowUnderDifferentTitle:actsMis};
DATA.config.sessionTemplates[_mod]=_orig;
return 'ok:' + JSON.stringify(_res);
