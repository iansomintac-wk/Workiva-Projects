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

      { // T3: reading
        rec('T3 the app marks itself ready and records the load interval and the time to ready',
          window.__appReadyDone === true && typeof window.__loadDataMs === 'number' && typeof window.__startupMs === 'number', `ready=${window.__appReadyDone} load=${window.__loadDataMs} start=${window.__startupMs}`);
        await withBook(async book => {
          const a1 = {id: 'a1', date: todayISO(), type: 'Call', summary: 's', checklist: []};
          const a2 = {id: 'a2', date: todayISO(), type: 'Call', summary: 's', checklist: [], transcript: {text: 'inline words', truncated: true}};
          book.activities[cid] = (book.activities[cid] || []).concat([a1, a2]);
          a1.transcript = await saveTranscriptVerified('a1', 'stored words');
          rec('T3 activityTranscript reads the new (ref) form', activityTranscript(a1).text === 'stored words' && activityTranscript(a1).truncated === false && activityTranscriptState(a1) === 'ok');
          rec('T3 activityTranscript still reads the old inline form', activityTranscript(a2).text === 'inline words' && activityTranscript(a2).truncated === true);
          await loadTranscriptMap();
          await window.__transcriptLoadDone;
          rec('T3 loadTranscriptMap reads only referenced records and reports the count', _transcriptMap.size === 1 && window.__transcriptLoad.count === 1 && window.__transcriptLoad.bad === 0 && typeof window.__transcriptLoad.ms === 'number', JSON.stringify(window.__transcriptLoad));
          await tsDelete(a1.transcript.ref); await loadTranscriptMap();
          rec('T3 a deleted record reads as missing (null text, state missing) and the book still loads',
            activityTranscript(a1) === null && activityTranscriptState(a1) === 'missing' && activityTranscript(a2) !== null && window.__transcriptLoad.bad === 1);
          const html = transcriptControlsHtml({id: cid}, a1);
          rec('T3 a missing record shows the exact notice and no View button',
            html.includes('Transcript missing from this browser - restore from a backup') && !html.includes('data-view-transcript'), html.slice(0, 160));
          await tsPut({ref: a1.transcript.ref, activityId: 'a1', text: 'TAMPERED', chars: 8, sha1: a1.transcript.sha1, savedAt: ''});
          await loadTranscriptMap();
          rec('T3 a record whose text fails its SHA-1 reads as missing', activityTranscriptState(a1) === 'missing');
          { // long uncut transcript still says what the AI gets
            const longRef = 'a3:0123456789ab';
            _transcriptMap.set(longRef, {text: 't', chars: DEBRIEF_TRANSCRIPT_CHAR_CAP + 10, sha1: 'b'.repeat(40)});
            const a3 = {id: 'a3', date: todayISO(), type: 'Call', summary: 's', checklist: [], transcript: {ref: longRef, chars: DEBRIEF_TRANSCRIPT_CHAR_CAP + 10, sha1: 'b'.repeat(40), truncated: false}};
            const h3 = transcriptControlsHtml({id: cid}, a3);
            rec('T3 a stored transcript longer than 120,000 chars shows the "first 120,000 characters" note even though it is not cut', /first 120,000 characters/.test(h3), h3.slice(0, 200));
          }
        });
        const big = 'x'.repeat(DEBRIEF_TRANSCRIPT_CHAR_CAP + 5);
        const nd = {customers: [{id: '__t3__'}], activities: {'__t3__': [
          {id: 'n1', date: todayISO(), type: 'Call', summary: 'ok', checklist: [], transcript: {text: big, truncated: false}},
          {id: 'n2', date: todayISO(), type: 'Call', summary: 'ok', checklist: [], transcript: {ref: 'n2:0123456789ab', chars: 5, sha1: 'a'.repeat(40), truncated: false}},
          {id: 'n3', date: todayISO(), type: 'Call', summary: 'ok', checklist: [], transcript: {ref: 7, chars: 'x'}}]}};
        normalizeActivityCollections(nd);
        const [n1, n2, n3] = nd.activities['__t3__'];
        rec('T3 the load-time cleanup no longer cuts inline text', n1.transcript.text.length === DEBRIEF_TRANSCRIPT_CHAR_CAP + 5 && n1.transcript.truncated === false);
        rec('T3 the load-time cleanup keeps a valid ref form and drops a malformed one (activity survives)',
          n2.transcript && n2.transcript.ref === 'n2:0123456789ab' && n3.transcript === undefined && nd.activities['__t3__'].length === 3);
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
