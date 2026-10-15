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

      rec('probe reached the end', true);
    }catch(e){
      rec('probe threw', false, String(e && e.stack || e));
    }finally{
      Storage.prototype.setItem = realSet;
    }
    return {results};
  };
})();
