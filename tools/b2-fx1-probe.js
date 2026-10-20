/* 1.2 B2 FX1 probe: a backup write already waiting on the file system must not land once the tab goes stale,
   and a normal (not stale) write still completes. Asynchronous, so it is not in the main suite:
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/b2-fx1-probe.js --fn b2Fx1Probe --expect 2
   It restores: _staleTab, _staleToastShown, the tab-conflict banner, _suiteRunning, _fsHandle, _fsState, _fsError,
   _fsWriting, _fsLastWriteAt, DATA.synthetic, DATA.lastExportedAt and the stored book. */
window.b2Fx1Probe = async function b2Fx1Probe(){
  const results = [];
  const banner = document.getElementById('tab-conflict');
  const bannerWas = banner ? banner.classList.contains('show') : false;
  const prevStale = _staleTab, prevToast = _staleToastShown, prevSuite = _suiteRunning;
  const prevHandle = _fsHandle, prevState = _fsState, prevErr = _fsError, prevWriting = _fsWriting, prevLast = _fsLastWriteAt;
  const hadSynthetic = Object.prototype.hasOwnProperty.call(DATA, 'synthetic'), prevSynthetic = DATA.synthetic;
  const hadExported = Object.prototype.hasOwnProperty.call(DATA, 'lastExportedAt'), prevExported = DATA.lastExportedAt;
  const before = localStorage.getItem(STORAGE_KEY);
  const restore = () => {
    _suiteRunning = prevSuite; _fsHandle = prevHandle; _fsState = prevState; _fsError = prevErr; _fsWriting = prevWriting; _fsLastWriteAt = prevLast;
    if(hadSynthetic) DATA.synthetic = prevSynthetic;
    if(hadExported) DATA.lastExportedAt = prevExported; else delete DATA.lastExportedAt;
    _staleTab = prevStale; _staleToastShown = prevToast;
    if(banner) banner.classList.toggle('show', bannerWas);
    try{ if(before === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, before); }catch(e){}
  };
  /* One deferred fake writer; goStale says whether another tab changes the book while createWritable() is pending. */
  const run = async goStale => {
    const calls = {write: 0, close: 0, abort: 0};
    const fakeWritable = {write: async () => { calls.write++; }, close: async () => { calls.close++; }, abort: async () => { calls.abort++; }};
    let release = null;
    const gate = new Promise(res => { release = () => res(fakeWritable); });
    localStorage.setItem(STORAGE_KEY, before === null ? '{}' : before);
    const base = localStorage.getItem(STORAGE_KEY);
    _staleTab = false; _suiteRunning = false; _fsHandle = {createWritable: () => gate}; _fsState = 'ready'; _fsWriting = false;
    delete DATA.synthetic;
    DATA.lastExportedAt = '2000-01-01';              // a write that completes stamps today into storage
    const pending = fsWriteNow(true);                // parked on createWritable()
    if(goStale) window.dispatchEvent(new StorageEvent('storage', {key: STORAGE_KEY, oldValue: 'a', newValue: 'b'}));
    release();
    const result = await pending;
    const now = localStorage.getItem(STORAGE_KEY);
    return {result, calls, unchanged: now === base, stamped: typeof now === 'string' && now.indexOf('"lastExportedAt":"' + todayISO() + '"') !== -1, stale: _staleTab};
  };
  let d1 = null, d2 = null;
  try{ d1 = await run(true); }catch(e){ d1 = {threw: e.message}; }
  const ok1 = !!d1 && d1.result === false && d1.calls && d1.calls.write === 0 && d1.calls.close === 0 && d1.unchanged === true && d1.stale === true;
  results.push({name: '1.2 B2 FX1 a backup write already waiting does not land after the tab goes stale', ok: ok1, detail: ok1 ? '' : JSON.stringify(d1)});
  try{ d2 = await run(false); }catch(e){ d2 = {threw: e.message}; }
  const ok2 = !!d2 && d2.result === true && d2.calls && d2.calls.write === 1 && d2.calls.close === 1 && d2.calls.abort === 0 && d2.stamped === true && d2.stale === false;
  results.push({name: '1.2 B2 FX1 a backup write with the tab not stale completes and stamps storage', ok: ok2, detail: ok2 ? '' : JSON.stringify(d2)});
  restore();
  return results;
};
