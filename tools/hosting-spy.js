/* Runs BEFORE the page's own scripts (tools/selfcheck.mjs --pre tools/hosting-spy.js, registered with
   Page.addScriptToEvaluateOnNewDocument). Counts every call the page makes to navigator.storage.persisted/persist and
   passes it through to the real function, unless a test sets spy.force.<fn> to a boolean. */
(function(){
  const spy = window.__storageSpy = {
    available: false, calls: {persisted: 0, persist: 0}, results: [], force: {persisted: undefined, persist: undefined},
    reset(){ this.calls.persisted = 0; this.calls.persist = 0; this.results.length = 0; },
  };
  try{
    const proto = typeof StorageManager !== 'undefined' ? StorageManager.prototype : null;
    if(!proto) return;
    spy.available = true;
    for(const fn of ['persisted', 'persist']){
      const real = proto[fn];
      if(typeof real !== 'function') continue;
      proto[fn] = function(...a){
        spy.calls[fn]++;
        const forced = spy.force[fn];
        const p = forced === undefined ? real.apply(this, a) : Promise.resolve(forced);
        return Promise.resolve(p).then(v => { spy.results.push({fn, value: v}); return v; },
                                       e => { spy.results.push({fn, error: String(e)}); throw e; });
      };
    }
  }catch(e){ spy.error = String(e); }
})();
