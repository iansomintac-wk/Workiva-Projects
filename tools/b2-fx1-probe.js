/* 1.2 B2 FX1 probe: a backup write already waiting on the file system must not land once the tab goes stale.
   Asynchronous, so it is not in the main suite:
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/b2-fx1-probe.js --fn b2Fx1Probe --expect 1
   It restores: _staleTab, _staleToastShown, the tab-conflict banner, _suiteRunning, _fsHandle, _fsState, _fsError,
   _fsWriting, _fsLastWriteAt, DATA.synthetic, DATA.lastExportedAt and the stored book. */
window.b2Fx1Probe = async function b2Fx1Probe(){
  const results = [];
  const name = '1.2 B2 FX1 a backup write already waiting does not land after the tab goes stale';
  const before = localStorage.getItem(STORAGE_KEY);
  const banner = document.getElementById('tab-conflict');
  const bannerWas = banner ? banner.classList.contains('show') : false;
  const prevStale = _staleTab, prevToast = _staleToastShown, prevSuite = _suiteRunning;
  const prevHandle = _fsHandle, prevState = _fsState, prevErr = _fsError, prevWriting = _fsWriting, prevLast = _fsLastWriteAt;
  const hadSynthetic = Object.prototype.hasOwnProperty.call(DATA, 'synthetic'), prevSynthetic = DATA.synthetic;
  const hadExported = Object.prototype.hasOwnProperty.call(DATA, 'lastExportedAt'), prevExported = DATA.lastExportedAt;
  const calls = {write: 0, close: 0, abort: 0};
  let ok = false, detail = '';
  try{
    const fakeWritable = {write: async () => { calls.write++; }, close: async () => { calls.close++; }, abort: async () => { calls.abort++; }};
    let release = null;
    const gate = new Promise(res => { release = () => res(fakeWritable); });
    _suiteRunning = false; _fsHandle = {createWritable: () => gate}; _fsState = 'ready'; _fsWriting = false;
    delete DATA.synthetic;
    DATA.lastExportedAt = '2000-01-01';              // an unguarded write would also stamp storage
    const pending = fsWriteNow(true);                // parked on createWritable()
    window.dispatchEvent(new StorageEvent('storage', {key: STORAGE_KEY, oldValue: 'a', newValue: 'b'}));   // the tab goes stale
    release();
    const result = await pending;
    const unchanged = localStorage.getItem(STORAGE_KEY) === before;
    ok = result === false && calls.write === 0 && calls.close === 0 && unchanged && _staleTab === true;
    detail = JSON.stringify({result, calls, unchanged, stale: _staleTab});
  }catch(e){ detail = 'threw: ' + e.message; }
  _suiteRunning = prevSuite; _fsHandle = prevHandle; _fsState = prevState; _fsError = prevErr; _fsWriting = prevWriting; _fsLastWriteAt = prevLast;
  if(hadSynthetic) DATA.synthetic = prevSynthetic;
  if(hadExported) DATA.lastExportedAt = prevExported; else delete DATA.lastExportedAt;
  _staleTab = prevStale; _staleToastShown = prevToast;
  if(banner) banner.classList.toggle('show', bannerWas);
  try{ if(before === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, before); }catch(e){}
  results.push({name, ok, detail: ok ? '' : detail});
  return results;
}
