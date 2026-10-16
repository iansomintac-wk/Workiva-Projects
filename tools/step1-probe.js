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

      const cid = DATA.customers[0].id;
      const resetStore = async () => { _tsForceDown = false; _tsDbP = null; try{ await tsClearAll(); }catch(e){} _transcriptMap.clear(); _tsVersion++; };
      const withBook = async fn => {
        const keep = DATA, keepRaw = localStorage.getItem(STORAGE_KEY);
        DATA = cloneData(DATA);
        try{ await fn(DATA); }
        finally{ await resetStore(); DATA = keep; if(keepRaw !== null) realSet.call(localStorage, STORAGE_KEY, keepRaw); }
      };
      await resetStore();

      { // T2: the store
        rec('T2 sha1Hex("abc") is the known digest', await sha1Hex('abc') === 'a9993e364706816aba3e25717850c26c9cd0d89d');
        const uni = 'héllo – 日本語 \u{1F600} end';
        const t = await saveTranscriptVerified('act-1', uni);
        const back = await tsGet(t.ref);
        rec('T2 saveTranscriptVerified returns {ref,chars,sha1,truncated:false} with ref = id:first 12 hex of sha1, created true, and created is not enumerable',
          t && t.ref === 'act-1:' + t.sha1.slice(0, 12) && t.chars === uni.length && t.truncated === false && /^[0-9a-f]{40}$/.test(t.sha1) &&
          t.created === true && !JSON.stringify(t).includes('created'), JSON.stringify(t));
        rec('T2 the record round-trips non-ASCII text exactly and the map holds it',
          back && back.text === uni && back.activityId === 'act-1' && typeof back.savedAt === 'string' && _transcriptMap.get(t.ref).text === uni);
        { // same text again: reuse, no rewrite, created false
          const before = (await tsGet(t.ref)).savedAt;
          await new Promise(r => setTimeout(r, 15));
          const again = await saveTranscriptVerified('act-1', uni);
          rec('T2 saving the same text again reuses the record (created false, savedAt unchanged)', again.ref === t.ref && again.created === false && (await tsGet(t.ref)).savedAt === before);
        }
        { // several refs in one transaction
          const t2 = await saveTranscriptVerified('act-9', 'nine'), t3 = await saveTranscriptVerified('act-8', 'eight');
          const m = await tsGetMany([t.ref, t2.ref, t3.ref, 'nope:000000000000']);
          rec('T2 tsGetMany returns the present records and omits the absent one', m.size === 3 && m.get(t2.ref).text === 'nine' && m.get(t3.ref).text === 'eight' && !m.has('nope:000000000000'));
          await tsDelete(t2.ref); await tsDelete(t3.ref);
        }
        await tsDelete(t.ref);
        rec('T2 tsDelete removes the record', (await tsGet(t.ref)) === undefined);
        { // read-back mismatch: the new record must be deleted and the save must throw
          const realGet = tsGet; let threw = false, leftover;
          window.tsGet = async ref => { const r = await realGet(ref); return r ? Object.assign({}, r, {text: r.text + 'X'}) : r; };
          try{ await saveTranscriptVerified('act-2', 'some text'); }catch(e){ threw = true; }
          window.tsGet = realGet;
          leftover = await tsGet('act-2:' + (await sha1Hex('some text')).slice(0, 12));
          rec('T2 a read-back that fails the SHA-1 check throws and leaves no record', threw && leftover === undefined, `threw=${threw}`);
        }
        _tsForceDown = true; _tsDbP = null;
        const none = await saveTranscriptVerified('act-3', 'x');
        _tsForceDown = false; _tsDbP = null;
        rec('T2 with IndexedDB unavailable, saveTranscriptVerified resolves null and writes nothing', none === null && (await tsGet('act-3:' + (await sha1Hex('x')).slice(0, 12))) === undefined);
        await resetStore();
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
