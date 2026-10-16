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
      { // T3: D3 storage request. Counts come from tools/hosting-spy.js, installed BEFORE the page's own scripts ran.
        const spy = window.__storageSpy;
        const LINE = {yes: 'Kept by browser: yes', no: 'Kept by browser: no (export regularly)', na: 'Kept by browser: not available when opened as a file'};
        const waitFor = async (cond, ms) => { const t0 = Date.now(); while(!cond() && Date.now() - t0 < ms) await new Promise(r => setTimeout(r, 25)); return cond(); };
        const settingsLine = () => {
          try{
            openSettingsModal();
            const el = document.getElementById('storage-kept-line');
            const t = el ? el.textContent.trim() : null;
            document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
            return t;
          }catch(e){ return 'threw: ' + e.message; }
        };
        // The page's own start-up calls, snapshotted before anything below can add a call.
        if(!isFile && spy) await waitFor(() => spy.calls.persisted >= 1 && spy.results.length >= spy.calls.persisted + spy.calls.persist, 3000);
        const startup = spy ? {calls: {...spy.calls}, results: spy.results.map(r => ({...r}))} : null;
        const startupLine = settingsLine();
        const pv = startup && startup.results.find(r => r.fn === 'persisted');
        const pr = startup && startup.results.find(r => r.fn === 'persist');
        const wantPersistCalls = pv && pv.value === true ? 0 : 1;
        const keptAtStart = !!((pv && pv.value === true) || (pr && pr.value === true));
        const keep = typeof _storageKept === 'undefined' ? undefined : _storageKept;
        const scenario = async force => {     // re-run the app's own function with controlled answers; counts and state both recorded
          spy.reset(); spy.force = force;
          let st, err = null;
          try{ st = await initStoragePersistence(); }catch(e){ err = e.message; }
          finally{ spy.force = {persisted: undefined, persist: undefined}; }
          return {calls: {...spy.calls}, st, err, line: settingsLine()};
        };
        rec('T3 initStoragePersistence and storageKeptLine exist', typeof initStoragePersistence === 'function' && typeof storageKeptLine === 'function');
        rec('T3 the page\'s own start-up calls: ' + (isFile ? 'file:// made NO storage call' : 'persisted once, persist once only if persisted said no'),
          !!startup && (isFile ? (startup.calls.persisted === 0 && startup.calls.persist === 0)
                               : (startup.calls.persisted === 1 && startup.calls.persist === wantPersistCalls)), JSON.stringify(startup));
        rec('T3 the Settings line after start-up is ' + (isFile ? 'the file:// text' : 'yes or no to match what the browser answered'),
          startupLine === (isFile ? LINE.na : (keptAtStart ? LINE.yes : LINE.no)), String(startupLine));
        let a = {err: 'spy missing'}, b = a, c = a;
        if(spy){
          a = await scenario({persisted: true});
          b = await scenario({persisted: false, persist: false});
          c = await scenario({persisted: false, persist: true});
        }
        const sc = (r, wantCalls, wantSt, wantLine) => !r.err && r.calls.persisted === wantCalls[0] && r.calls.persist === wantCalls[1] && r.st === wantSt && r.line === wantLine;
        rec('T3 already persisted: ' + (isFile ? 'file:// still makes no call' : 'persisted called once, persist NOT called, state yes, line yes'),
          isFile ? sc(a, [0, 0], 'na', LINE.na) : sc(a, [1, 0], 'yes', LINE.yes), JSON.stringify(a));
        rec('T3 request refused (persisted false, persist false): ' + (isFile ? 'file:// still makes no call' : 'persisted once, persist once, state no, line "no (export regularly)"'),
          isFile ? sc(b, [0, 0], 'na', LINE.na) : sc(b, [1, 1], 'no', LINE.no), JSON.stringify(b));
        rec('T3 request granted (persisted false, persist true): ' + (isFile ? 'file:// still makes no call' : 'persisted once, persist once, state yes, line yes'),
          isFile ? sc(c, [0, 0], 'na', LINE.na) : sc(c, [1, 1], 'yes', LINE.yes), JSON.stringify(c));
        if(keep !== undefined) _storageKept = keep;
      }
      { // T4: D2 empty-book hint
        const TEXT = 'New address, no book here yet. Export from your old copy, then Import here (Settings).';
        const hasFn = typeof shouldShowHostedHint === 'function' && typeof renderHostedEmptyHint === 'function';
        rec('T4 the hint text is exactly the spec text', typeof HOSTED_EMPTY_HINT === 'string' && HOSTED_EMPTY_HINT === TEXT, typeof HOSTED_EMPTY_HINT === 'string' ? HOSTED_EMPTY_HINT : 'HOSTED_EMPTY_HINT missing');
        rec('T4 shouldShowHostedHint: http empty yes, https empty yes, file empty no, http with an account no',
          hasFn && shouldShowHostedHint('http:', {customers: []}) === true && shouldShowHostedHint('https:', {customers: []}) === true
            && shouldShowHostedHint('file:', {customers: []}) === false && shouldShowHostedHint('http:', {customers: [{id: 'x'}]}) === false
            && shouldShowHostedHint('http:', undefined) === true);
        const hintInDom = () => { const el = document.getElementById('hosted-empty-hint'); return el ? el.textContent.trim() : null; };
        const keepData = DATA, keepRaw = localStorage.getItem(STORAGE_KEY);
        let emptyDom = 'not run', fullDom = 'not run', afterImport = 'not run';
        try{
          DATA = cloneData(keepData); DATA.customers = []; DATA.activities = {};   // an empty book, in memory only
          render(); emptyDom = hintInDom();
          DATA = keepData; render(); fullDom = hintInDom();                          // the test book: has accounts
          // empty -> real Import handler -> accounts present
          const exported = serializeBackup(keepData, serializeBook(keepData));
          DATA = cloneData(keepData); DATA.customers = []; DATA.activities = {}; render();
          let cb = null; const rc = window.showConfirmModal, rt = window.showToast;
          window.showConfirmModal = (msg, onConfirm) => { cb = onConfirm; }; window.showToast = () => {};
          try{
            handleImportFile({target: {files: [new File([exported], 'test-book.json')], value: 'x'}});
            const t0 = Date.now(); while(cb === null && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 25));
            await settle();
          }finally{ window.showConfirmModal = rc; window.showToast = rt; }
          const committed = cb ? cb() === true : false;
          afterImport = committed ? hintInDom() : 'import did not commit';
        }catch(e){ afterImport = 'threw: ' + e.message; }
        finally{
          DATA = keepData; if(keepRaw !== null) Storage.prototype.setItem.call(localStorage, STORAGE_KEY, keepRaw);
          render();
        }
        rec('T4 empty book: hint ' + (isFile ? 'hidden on file://' : 'visible with the exact text when served'),
          isFile ? emptyDom === null : emptyDom === TEXT, String(emptyDom));
        rec('T4 a book with accounts: hint hidden', fullDom === null, String(fullDom));
        rec('T4 after the real Import handler puts accounts in: hint ' + (isFile ? 'still hidden' : 'was visible before and is hidden now'),
          afterImport === null && (isFile || emptyDom === TEXT), String(afterImport));
      }
      // ===== end of hosting checks =====
      rec('probe reached the end', true);
    }catch(e){ rec('probe threw: ' + (e && e.message), false, String(e && e.stack || e).slice(0, 300)); }
    return {results};
  };
})();
