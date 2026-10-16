/* Runway hosting probe. Runs ONLY inside tools/selfcheck.mjs (headless Chrome, throwaway profile):
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html [--serve site] --pre tools/hosting-spy.js --seed demo-seed.js,tools/hosting-probe.js --fn hostingProbe --expect N
   Each task inserts its checks above the "end of hosting checks" marker; "probe reached the end" stays last. */
(function(){
  window.hostingProbe = async function(){
    const results = [];
    const rec = (name, ok, detail) => results.push({name, ok: !!ok, detail: detail || ''});
    const settle = () => new Promise(r => setTimeout(r, 60));
    const isFile = location.protocol === 'file:';
    try{
      await settle();
      // ===== hosting checks go here, in task order =====
      const ex = window.__hostExpect;
      rec('T2 page protocol and host equal what the harness independently expects (--serve sets http: and 127.0.0.1:<port>, otherwise file:)',
        !!ex && location.protocol === ex.protocol && location.host === ex.host,
        ex ? `expected ${ex.protocol}//${ex.host}, page is ${location.protocol}//${location.host}` : 'window.__hostExpect missing (harness too old)');
      rec('T2 the storage spy was installed before the page ran (--pre tools/hosting-spy.js)',
        !!window.__storageSpy && window.__storageSpy.available === true, window.__storageSpy ? JSON.stringify(window.__storageSpy.calls) : 'window.__storageSpy missing');
      // ===== end of hosting checks =====
      rec('probe reached the end', true);
    }catch(e){ rec('probe threw: ' + (e && e.message), false, String(e && e.stack || e).slice(0, 300)); }
    return {results};
  };
})();
