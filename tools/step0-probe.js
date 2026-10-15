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
        const saved = {h: _fsHandle, s: _fsState, r: _rejectedLoadPayload, e: DATA.lastExportedAt, syn: DATA.synthetic, raw: localStorage.getItem(STORAGE_KEY)};
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
          if(saved.raw !== null) realSet.call(localStorage, STORAGE_KEY, saved.raw);   // the control backup also stamps storage; put the stored book back
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

      { // T4: drawing and tab clicks
        const clickTabs = async () => { for(const v of ['today','accounts','risk','copilot','today']){
          const t = document.querySelector(`.tab[data-view="${v}"]`); if(t) t.click(); await settle(); } };
        await clickTabs();                              // first round may stamp genuinely new state
        const w0 = bookWrites();
        await clickTabs();
        rec('T4 a second round of tab clicks writes the book 0 times', bookWrites() === w0, `writes=${bookWrites() - w0}`);
        const w1 = bookWrites();
        render(); render(); await settle();
        rec('T4 redrawing an unchanged book writes 0 times', bookWrites() === w1, `writes=${bookWrites() - w1}`);
      }

      { // T5: loadData
        const keep = DATA, keepRaw = localStorage.getItem(STORAGE_KEY);
        try{
          saveData();
          const w0 = bookWrites();
          await loadData();
          rec('T5 loading an up-to-date book writes nothing', bookWrites() === w0, `writes=${bookWrites() - w0}`);
          const old = JSON.parse(localStorage.getItem(STORAGE_KEY)); delete old.weeklySnapshot;   // backfill restores it
          realSet.call(localStorage, STORAGE_KEY, JSON.stringify(old));
          const w1 = bookWrites();
          await loadData();
          rec('T5 control: loading a book that needs a backfill writes once', bookWrites() === w1 + 1, `writes=${bookWrites() - w1}`);
        }finally{
          DATA = keep; realSet.call(localStorage, STORAGE_KEY, keepRaw);
        }
      }

      { // T6: synthetic books
        rec('T6 the demo seed book is stamped synthetic and the stamp survives loading', DATA.synthetic === true, `synthetic=${DATA.synthetic}`);
        const keep = DATA, keepRaw = localStorage.getItem(STORAGE_KEY);
        const real = JSON.parse(JSON.stringify(DATA)); delete real.synthetic;
        try{
          realSet.call(localStorage, STORAGE_KEY, JSON.stringify(real));       // a real book is stored
          const w0 = bookWrites();
          const ok = saveData();
          rec('T6 saving a synthetic book over a real one is refused', ok === false && bookWrites() === w0 && localStorage.getItem(STORAGE_KEY) === JSON.stringify(real), `ok=${ok}`);
          const cand = JSON.parse(JSON.stringify(keep));
          const okImp = commitDataCandidate(cand);
          rec('T6 importing a synthetic book over a real one is refused and leaves DATA as it was', okImp === false && DATA === keep, `ok=${okImp}`);
          const f = fakeBackupFile(), sv = {h: _fsHandle, s: _fsState};
          _fsHandle = f; _fsState = 'ready';
          const okFs = await fsWriteNow(true);
          _fsHandle = sv.h; _fsState = sv.s;
          rec('T6 a synthetic book is never written to the backup file', okFs === false && f.writes === 0, `ok=${okFs} writes=${f.writes}`);
          DATA = real;
          rec('T6 control: a real book still saves over a real one', saveData() === true);
        }finally{
          DATA = keep; realSet.call(localStorage, STORAGE_KEY, keepRaw);
        }
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
