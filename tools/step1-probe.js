/* Runway 1.1 Step 1 probe. Runs ONLY inside tools/selfcheck.mjs (headless Chrome, throwaway profile):
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step1-fixture.js,tools/step1-probe.js --fn step1Probe --expect N */
(function(){
  window.step1Probe = async function(){
    const results = [];
    const rec = (name, ok, detail) => results.push({name, ok: !!ok, detail: detail || ''});
    const realSet = Storage.prototype.setItem;
    let n = 0;
    Storage.prototype.setItem = function(k, v){ if(this === localStorage && k === STORAGE_KEY) n++; return realSet.apply(this, arguments); };
    const bookWrites = () => n;
    const settle = () => new Promise(r => setTimeout(r, 60));
    const waitFor = async (fn, ms) => { const t = Date.now(); while(!fn() && Date.now() - t < ms) await new Promise(r => setTimeout(r, 25)); return !!fn(); };
    const fakeBackupFile = () => { const f = {name: 'probe-backup.json', writes: 0, last: '',
      createWritable: async () => ({write: async s => { f.writes++; f.last = s; }, close: async () => {}})}; return f; };
    try{
      await settle();
      // ===== Step 1 checks go here, in task order =====

      rec('probe reached the end', true);
    }catch(e){
      rec('probe threw', false, String(e && e.stack || e));
    }finally{
      Storage.prototype.setItem = realSet;
    }
    return {results};
  };
})();
