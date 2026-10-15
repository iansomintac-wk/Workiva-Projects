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
        let clicked = 0;                                // how many tabs were really found and clicked
        const clickTabs = async () => { for(const v of ['today','accounts','risk','copilot','today']){
          const t = document.querySelector(`.tab[data-view="${v}"]`); if(t){ t.click(); clicked++; } await settle(); } };
        await clickTabs();                              // first round may stamp genuinely new state
        const c1 = clicked;
        const w0 = bookWrites();
        await clickTabs();
        rec('T8 each round of tab clicks found and clicked all 5 tabs (so the 0-writes check below is not vacuous)', c1 === 5 && clicked - c1 === 5, `round1=${c1} round2=${clicked - c1}`);
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

      { // T8 (final-review S1): the read-only risk list must not stamp risk memory; the normal one saves only on change
        const realQ = window.queueSave; let queued = 0;
        window.queueSave = function(){ queued++; };    // observe saves here, so T3's maintenance skip cannot hide one
        const keepLog = JSON.stringify(DATA.riskLog);
        try{
          buildRiskHubList();                          // settle the log
          const stable = JSON.stringify(DATA.riskLog);
          queued = 0;
          buildRiskHubList();
          rec('T8 the normal risk list on a stable book queues 0 saves', queued === 0, `queued=${queued}`);
          const ks = Object.keys(DATA.riskLog || {});
          if(ks.length) delete DATA.riskLog[ks[0]];    // one risk is now brand new
          const before = JSON.stringify(DATA.riskLog);
          queued = 0;
          const items = buildRiskHubList({readOnly: true});
          rec('T8 the read-only risk list with a brand-new risk leaves the risk memory unchanged and queues 0 saves',
            ks.length > 0 && items.length > 0 && JSON.stringify(DATA.riskLog) === before && queued === 0,
            `risks=${ks.length} items=${items.length} queued=${queued} changed=${JSON.stringify(DATA.riskLog) !== before}`);
        }finally{
          window.queueSave = realQ; DATA.riskLog = JSON.parse(keepLog);
        }
      }

      { // T8 (final-review S7): edge cases of syntheticWouldReplaceReal
        const keep = DATA, keepRaw = localStorage.getItem(STORAGE_KEY);
        try{
          realSet.call(localStorage, STORAGE_KEY, '{not json');
          rec('T8 a synthetic book is refused over an unreadable stored book', syntheticWouldReplaceReal() === true);
          realSet.call(localStorage, STORAGE_KEY, JSON.stringify({customers: []}));
          rec('T8 a synthetic book may replace a stored book with no accounts', syntheticWouldReplaceReal() === false);
          realSet.call(localStorage, STORAGE_KEY, JSON.stringify(keep));
          rec('T8 a synthetic book may replace a stored synthetic book', keep.synthetic === true && syntheticWouldReplaceReal() === false);
        }finally{
          realSet.call(localStorage, STORAGE_KEY, keepRaw);
        }
      }

      { // T9 (final-review S3): the refusal toast shows on every user save, never on maintenance saves
        const keep = DATA, keepRaw = localStorage.getItem(STORAGE_KEY), realToast = window.showToast;
        const toasts = []; window.showToast = function(m){ toasts.push(String(m)); };
        const real = JSON.parse(JSON.stringify(DATA)); delete real.synthetic;
        try{
          realSet.call(localStorage, STORAGE_KEY, JSON.stringify(real));
          const w0 = bookWrites();
          const a = saveData(), b = saveData();
          rec('T9 two user saves of a test book over a real one -> 2 toasts, both refused, 0 book writes',
            a === false && b === false && toasts.length === 2 && bookWrites() === w0, `a=${a} b=${b} toasts=${toasts.length} writes=${bookWrites() - w0}`);
          toasts.length = 0;
          const m = saveData({maintenance: true});
          rec('T9 a maintenance save refused the same way shows 0 toasts', m === false && toasts.length === 0, `m=${m} toasts=${toasts.length}`);
        }finally{
          window.showToast = realToast; DATA = keep; realSet.call(localStorage, STORAGE_KEY, keepRaw);
        }
      }

      { // T10 (final-review S4): Back up now says why it did not back up
        const saved = {h: _fsHandle, s: _fsState, r: _rejectedLoadPayload, syn: DATA.synthetic, e: DATA.lastExportedAt, raw: localStorage.getItem(STORAGE_KEY), t: window.showToast};
        const toasts = []; window.showToast = function(m){ toasts.push(String(m)); };
        const cases = [
          ['the last load was rejected', () => { _rejectedLoadPayload = 'raw text that failed to load'; delete DATA.synthetic; }],
          ['this is a test book', () => { _rejectedLoadPayload = null; DATA.synthetic = true; }]
        ];
        try{
          rec('T10 fsBlockedReason exists', typeof fsBlockedReason === 'function');
          for(const [reason, arrange] of cases){
            const f = fakeBackupFile();
            _fsHandle = f; _fsState = 'ready'; arrange();
            toasts.length = 0;
            const ok = await fsWriteNow(false);
            rec(`T10 Back up now refused (${reason}) toasts "Not backed up: ${reason}." and writes no file`,
              ok === false && f.writes === 0 && toasts.length === 1 && toasts[0] === `Not backed up: ${reason}.`, `ok=${ok} writes=${f.writes} toasts=${JSON.stringify(toasts)}`);
            toasts.length = 0;
            await fsWriteNow(true);
            rec(`T10 the automatic backup refused (${reason}) shows 0 toasts`, toasts.length === 0, `toasts=${toasts.length}`);
            const line = fsStatusLine(), chip = renderBackupStatus();
            rec(`T10 status line and header chip say why (${reason})`,
              line.includes(reason) && chip.includes('Not backing up') && chip.includes(reason), `line=${line} chip=${chip.slice(0, 120)}`);
          }
        }finally{
          window.showToast = saved.t; _fsHandle = saved.h; _fsState = saved.s; _rejectedLoadPayload = saved.r; DATA.lastExportedAt = saved.e;
          if(saved.syn === undefined) delete DATA.synthetic; else DATA.synthetic = saved.syn;
          if(saved.raw !== null) realSet.call(localStorage, STORAGE_KEY, saved.raw);
        }
      }

      { // T11 (final-review S5): test book marker and "This is my real book now"
        const keep = DATA, keepSyn = DATA.synthetic, keepRaw = localStorage.getItem(STORAGE_KEY), realToast = window.showToast, realConfirm = window.showConfirmModal;
        const savedFs = {h: _fsHandle, s: _fsState};
        const toasts = []; window.showToast = function(m){ toasts.push(String(m)); };
        try{
          DATA.synthetic = true;
          const on = renderHeader();
          rec('T11 a test book shows the Test book marker and the button', on.includes('Test book') && on.includes('id="btn-make-real"') && on.includes('This is my real book now'), on.slice(0, 160));
          delete DATA.synthetic;
          const off = renderHeader();
          rec('T11 a real book shows neither marker nor button', !off.includes('Test book') && !off.includes('btn-make-real'));
          DATA.synthetic = true;

          let asked = null; window.showConfirmModal = function(msg, fn, label){ asked = {msg, fn, label}; };
          render();
          const btn = document.getElementById('btn-make-real');
          if(btn) btn.click();
          rec('T11 clicking the button asks for confirmation with the stated wording',
            !!asked && asked.label === 'Make it my real book' && typeof makeBookReal === 'function' && asked.fn === makeBookReal &&
            asked.msg === 'Make this your real book? From now on it is saved and backed up like any real book. Only do this if the accounts in it are yours.',
            `btn=${!!btn} asked=${JSON.stringify(asked && asked.label)}`);
          window.showConfirmModal = realConfirm;

          const real = JSON.parse(JSON.stringify(DATA)); delete real.synthetic;
          realSet.call(localStorage, STORAGE_KEY, JSON.stringify(real));
          toasts.length = 0;
          const w0 = bookWrites();
          if(typeof makeBookReal === 'function') makeBookReal();
          rec('T11 making a test book real over a stored real book is refused: stamp kept, 0 book writes, refusal toast',
            typeof makeBookReal === 'function' && DATA.synthetic === true && bookWrites() === w0 && localStorage.getItem(STORAGE_KEY) === JSON.stringify(real) &&
            toasts.includes('A real book is already stored here, so this test book cannot become it.'), `syn=${DATA.synthetic} writes=${bookWrites() - w0} toasts=${JSON.stringify(toasts)}`);

          realSet.call(localStorage, STORAGE_KEY, JSON.stringify({customers: []}));
          if(typeof makeBookReal === 'function') makeBookReal();
          const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
          const f = fakeBackupFile(); _fsHandle = f; _fsState = 'ready';
          const okFs = await fsWriteNow(true);
          rec('T11 with no real book stored, making it real drops the stamp (in memory and stored) and the backup then writes once',
            typeof makeBookReal === 'function' && DATA.synthetic === undefined && stored.synthetic === undefined && Array.isArray(stored.customers) && stored.customers.length > 0 && okFs === true && f.writes === 1,
            `syn=${DATA.synthetic} storedSyn=${stored.synthetic} ok=${okFs} writes=${f.writes}`);
        }finally{
          window.showToast = realToast; window.showConfirmModal = realConfirm; _fsHandle = savedFs.h; _fsState = savedFs.s;
          DATA = keep; if(keepSyn === undefined) delete DATA.synthetic; else DATA.synthetic = keepSyn; realSet.call(localStorage, STORAGE_KEY, keepRaw);
          render();
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
