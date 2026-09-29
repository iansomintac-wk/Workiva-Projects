;
/* PROBE (throwaway): session-delete renumbering vs criterion identity */
function _snap(){
  const out = {};
  DATA.customers.forEach(c => {
    const cr = outcomeCriteriaFor(c);
    out[c.id] = {name:c.name, module:c.module, csrd:!!c.reportsCSRD,
      total:cr.length,
      evidenced:cr.filter(x=>x.evidence).length,
      evidencedInCurriculum:cr.filter(x=>x.evidence && x.source.indexOf('curriculum')===0).length,
      orphaned:cr.filter(x=>x.source==='no longer in the curriculum').length,
      provisional:cr.filter(x=>x.provisional).length, reworded:cr.filter(x=>x.source==='curriculum (reworded since)').length, sess:c.totalSessions,
      ttfv:(typeof ttfvDays==='function'? ttfvDays(c):'n/a')};
  });
  return out;
}
function _diff(a,b,mod){
  const rows=[]; let affected=0, evLostTotal=0, ttfvLost=0, onModule=0;
  Object.keys(a).forEach(id=>{ const x=a[id], y=b[id];
    if(x.module!==mod || x.csrd) return;
    onModule++;
    if(JSON.stringify(x)!==JSON.stringify(y)) affected++;
    evLostTotal += x.evidencedInCurriculum - y.evidencedInCurriculum;
    if(x.ttfv!==null && y.ttfv===null) ttfvLost++;
    rows.push({sess:x.sess, reworded:[x.reworded,y.reworded], name:x.name, evInCurr:[x.evidencedInCurriculum,y.evidencedInCurriculum], orphaned:[x.orphaned,y.orphaned], unevidenced:[x.total-x.evidenced, y.total-y.evidenced], ttfv:[x.ttfv,y.ttfv]});
  });
  return {onModule, affected, evidenceDetachedFromCurriculum:evLostTotal, ttfvDroppedToNull:ttfvLost, rows};
}
const _mod='Carbon';
// Evidence EVERY criterion on this module's non-CSRD accounts, so a detach is observable.
let _ticked=0;
DATA.customers.filter(c=>c.module===_mod && !c.reportsCSRD).forEach(c=>{
  outcomeCriteriaFor(c).forEach(cr=>{ if(setOutcomeEvidence(c, cr, {on:'2026-08-01', by:'customer'})) _ticked++; });
});
const _base=_snap();
const _mods={ticked:_ticked}; Object.values(_base).forEach(r=>{ if(!r.csrd) _mods[r.module]=(_mods[r.module]||0)+r.evidenced; });
const _orig=JSON.parse(JSON.stringify(DATA.config.sessionTemplates[_mod]));
const _res={module:_mod, sessionsInCurriculum:_orig.length, evidencedByModule:_mods};
DATA.config.sessionTemplates[_mod]=JSON.parse(JSON.stringify(_orig));
_res.control_noop=_diff(_base,_snap(),_mod); delete _res.control_noop.rows;
const _t2=JSON.parse(JSON.stringify(_orig)); _t2.splice(1,1); DATA.config.sessionTemplates[_mod]=_t2;
_res.delete_session2=_diff(_base,_snap(),_mod);
const _tl=JSON.parse(JSON.stringify(_orig)); _tl.pop(); DATA.config.sessionTemplates[_mod]=_tl;
_res.delete_last=_diff(_base,_snap(),_mod); delete _res.delete_last.rows;
DATA.config.sessionTemplates[_mod]=JSON.parse(JSON.stringify(_orig));
const _c=DATA.customers.find(c=>c.module===_mod && !c.reportsCSRD);
const _before=buildSessionRunbook(_c,getSessionTemplate(_c,1)).source;
DATA.config.sessionTemplates[_mod][0].title += ' (renamed)';
_res.rename_s1_runbook=[_before, buildSessionRunbook(_c,getSessionTemplate(_c,1)).source];
DATA.config.sessionTemplates[_mod]=_orig;
return 'ok:' + JSON.stringify(_res);
