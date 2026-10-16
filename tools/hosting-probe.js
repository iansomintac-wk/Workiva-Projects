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
      { // FX5: an already-open Settings shows the answer when initStoragePersistence changes it
        const spy = window.__storageSpy;
        if(isFile || !spy){
          rec('FX5 an open Settings line follows a changed storage answer (served pages only)', isFile, isFile ? 'file:// makes no call' : 'storage spy missing');
        }else{
          const keep = _storageKept; let before = null, after = null, err = null;
          try{
            _storageKept = 'no';
            openSettingsModal();
            const el = () => document.getElementById('storage-kept-line');
            before = el() ? el().textContent.trim() : null;
            spy.reset(); spy.force = {persisted: true};
            await initStoragePersistence();
            after = el() ? el().textContent.trim() : null;
          }catch(e){ err = e.message; }
          finally{ spy.force = {persisted: undefined, persist: undefined}; document.querySelectorAll('.modal-backdrop').forEach(b => b.remove()); _storageKept = keep; }
          rec('FX5 an open Settings line follows a changed storage answer (no -> yes without reopening)',
            !err && before === 'Kept by browser: no (export regularly)' && after === 'Kept by browser: yes', JSON.stringify({before, after, err}));
        }
      }
      // ===== end of hosting checks =====
      rec('probe reached the end', true);
    }catch(e){ rec('probe threw: ' + (e && e.message), false, String(e && e.stack || e).slice(0, 300)); }
    return {results};
  };
  const fingerprint = async () => {
    const acts = Object.values(DATA.activities || {}).flat();
    const rows = [];
    for(const a of acts){
      const t = activityTranscript(a);
      if(t && a.transcript && a.transcript.ref) rows.push(a.transcript.ref + '\n' + t.text + '\n');
    }
    rows.sort();
    const buf = new TextEncoder().encode(rows.join(''));
    const h = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buf))).map(b => b.toString(16).padStart(2, '0')).join('');
    return {accounts: DATA.customers.length, activities: acts.length, transcripts: rows.length, tsSha256: h};
  };
  const hintText = () => { const el = document.getElementById('hosted-empty-hint'); return el ? el.textContent.trim() : null; };
  window.hostingMoveOut = async function(){
    const KEY = 'TEST-KEY-NOT-REAL-0001';
    const cid = DATA.customers[0].id;
    DATA.activities[cid] = DATA.activities[cid] || [];
    for(let i = 0; i < 3; i++){
      const a = {id: 'mv' + i, date: todayISO(), type: 'Call', summary: 'move test ' + i, checklist: []};
      a.transcript = await saveTranscriptVerified(a.id, window.STEP1_CALLS[i]);
      DATA.activities[cid].push(a);
    }
    saveAiSettings({apiKey: KEY, model: 'gemini-2.5-flash'});
    saveData();
    // C7 precondition (review item M4): the fake key must really be stored BEFORE Export, or "absent" would prove nothing.
    const keyStored = getAiSettings().apiKey === KEY && (localStorage.getItem(AI_SETTINGS_KEY) || '').includes(KEY);
    const blobs = []; const realBlob = window.Blob, realURL = URL.createObjectURL, realClick = HTMLAnchorElement.prototype.click;
    window.Blob = function(parts, opts){ blobs.push(parts.join('')); return new realBlob(parts, opts); };
    URL.createObjectURL = () => 'blob:probe'; HTMLAnchorElement.prototype.click = function(){};
    try{ exportData(); }finally{ window.Blob = realBlob; URL.createObjectURL = realURL; HTMLAnchorElement.prototype.click = realClick; }
    const exportText = blobs[0] || '';
    const fp = await fingerprint();
    window.__dump = JSON.stringify({fp, exportText, keyStored, aiKeyInExport: exportText.includes(KEY)});
    return {results: [
      {name: 'move out: the fake AI key is stored (getAiSettings and the stored item) before Export', ok: keyStored, detail: 'keyStored=' + keyStored},
      {name: 'move out: Export captured (' + exportText.length + ' bytes), fingerprint taken', ok: exportText.length > 0 && fp.transcripts === 3, detail: JSON.stringify(fp)},
    ]};
  };
  window.hostingMoveIn = async function(){
    if(typeof window.__incoming !== 'string') return {results: [{name: 'move in: window.__incoming missing', ok: false, detail: ''}]};
    const hintBefore = hintText();
    let cb = null; const rc = window.showConfirmModal, rt = window.showToast;
    window.showConfirmModal = (msg, onConfirm) => { cb = onConfirm; }; window.showToast = () => {};
    try{
      handleImportFile({target: {files: [new File([window.__incoming], 'moved-book.json')], value: 'x'}});
      const t0 = Date.now(); while(cb === null && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 25));
      await new Promise(r => setTimeout(r, 60));
    }finally{ window.showConfirmModal = rc; window.showToast = rt; }
    const committed = cb ? cb() === true : false;
    await new Promise(r => setTimeout(r, 60));
    const fp = await fingerprint();
    window.__dump = JSON.stringify({fp, hintBefore, hintAfter: hintText(), aiKeyAfter: getAiSettings().apiKey || ''});
    return {results: [{name: 'move in: Import committed', ok: committed, detail: JSON.stringify(fp)}]};
  };
})();
