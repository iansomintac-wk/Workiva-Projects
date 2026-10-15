/* Runway 1.1 Step 0 probe. Runs ONLY inside tools/selfcheck.mjs (headless Chrome, throwaway profile):
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step0-probe.js --fn step0Probe --expect N
   Counts writes to the stored book (STORAGE_KEY) and uses a fake backup file. Restores what it changes. */
(function(){
  window.step0Probe = async function(){
    const results = [];
    const rec = (name, ok, detail) => results.push({name, ok: !!ok, detail: detail || ''});
    const realSet = Storage.prototype.setItem;
    let n = 0;
    Storage.prototype.setItem = function(k, v){ if(this === localStorage && k === STORAGE_KEY) n++; return realSet.apply(this, arguments); };
    const bookWrites = () => n;
    const settle = () => new Promise(r => setTimeout(r, 60));   // lets queueSave()'s setTimeout(0) fire
    const fakeBackupFile = () => { const f = {name: 'probe-backup.json', writes: 0,
      createWritable: async () => ({write: async () => { f.writes++; }, close: async () => {}})}; return f; };
    try{
      await settle();
      // ===== Step 0 checks go here, in task order =====

      { // T2: fsWriteNow after a rejected load
        const saved = {h: _fsHandle, s: _fsState, r: _rejectedLoadPayload, e: DATA.lastExportedAt, syn: DATA.synthetic};
        delete DATA.synthetic;   // after Task 6 the seed is synthetic and fsWriteNow would refuse it for that reason instead
        try{
          const ctl = fakeBackupFile();
          _fsHandle = ctl; _fsState = 'ready'; _rejectedLoadPayload = null;
          const okCtl = await fsWriteNow(true);
          rec('T2 control: a normal backup writes the file once', okCtl === true && ctl.writes === 1, `ok=${okCtl} writes=${ctl.writes}`);

          const f = fakeBackupFile();
          _fsHandle = f; _fsState = 'ready'; _rejectedLoadPayload = 'raw text that failed to load';
          DATA.lastExportedAt = '2000-01-01';   // would trigger the stamp write to storage
          const before = localStorage.getItem(STORAGE_KEY), w0 = bookWrites();
          const ok = await fsWriteNow(true);
          rec('T2 after a rejected load, Back up writes neither the file nor the stored book',
            ok === false && f.writes === 0 && bookWrites() === w0 && localStorage.getItem(STORAGE_KEY) === before,
            `ok=${ok} fileWrites=${f.writes} bookWrites=${bookWrites() - w0}`);
        }finally{
          _fsHandle = saved.h; _fsState = saved.s; _rejectedLoadPayload = saved.r; DATA.lastExportedAt = saved.e;
          if(saved.syn !== undefined) DATA.synthetic = saved.syn;
        }
      }

      { // T3: maintenance save with nothing changed
        saveData();                                   // storage now equals DATA
        const w0 = bookWrites();
        const ok = saveData({maintenance: true});
        rec('T3 a bookkeeping save of an unchanged book writes nothing', ok === true && bookWrites() === w0, `ok=${ok} writes=${bookWrites() - w0}`);
        DATA.__probeMark = 1;
        const w1 = bookWrites();
        saveData({maintenance: true});
        rec('T3 control: a bookkeeping save of a changed book writes once', bookWrites() === w1 + 1, `writes=${bookWrites() - w1}`);
        delete DATA.__probeMark; saveData({maintenance: true});
      }

      rec('probe reached the end', true);
    }catch(e){
      rec('probe threw', false, String(e && e.stack || e));
    }finally{
      Storage.prototype.setItem = realSet;
    }
    return {results};
  };
})();
