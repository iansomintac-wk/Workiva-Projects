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

      const ALL = window.STEP1_CALLS.join('\n');
      const fixtureText = (i, n) => { const k = (i * 7919) % ALL.length; let s = '[' + i + '] ' + ALL.slice(k) + ALL.slice(0, k); while(s.length < n) s += s; return s.slice(0, n); };
      // the block of transcript text inside a prompt: how many of text's leading chars appear in a row, and where it starts
      const sentRun = (p, text) => { const i = p.indexOf(text.slice(0, 200)); if(i < 0) return {start: -1, len: 0}; let k = 0; while(k < text.length && p[i + k] === text[k]) k++; return {start: i, len: k}; };

      { // T4: no cut on read; cap only on send; C3 (send half), C4
        rec('T4 fixture loaded: call1 is 157,060 chars (C3 input)', window.STEP1_CALLS.length === 4 && window.STEP1_CALLS[0].length === 157060, 'total=' + ALL.length);
        const big = 'y'.repeat(130000);
        let got = null; const realToast = window.showToast; const toasts = []; window.showToast = m => toasts.push(m);
        readTranscriptFile(new File([big], 'big.txt'), t => { got = t; });
        await waitFor(() => got !== null, 3000);
        rec('T4 readTranscriptFile no longer cuts at 120,000', got && got.text.length === 130000 && got.truncated === false && !toasts.some(m => /truncated/i.test(m)), JSON.stringify(toasts));
        let got2 = null; toasts.length = 0;
        readTranscriptFile(new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'huge.txt'), t => { got2 = t; });
        await new Promise(r => setTimeout(r, 200));
        window.showToast = realToast;
        rec('T4 the 4 MB file-read limit still refuses', got2 === null && toasts.some(m => /over 4 MB/.test(m)));

        await withBook(async book => {
          const text = window.STEP1_CALLS[0];
          const NOTE = 'note';
          const act = {id: 'dbg1', date: todayISO(), type: 'Call', summary: NOTE, checklist: [], sessionNumber: 1};
          act.transcript = await saveTranscriptVerified('dbg1', text);
          book.activities[cid] = (book.activities[cid] || []).concat([act]);
          const realAi = window.callAiAPI, sent = [];
          window.callAiAPI = async (prompt, opts) => { sent.push(String(prompt)); return {text: '[]', truncated: false}; };
          try{ await generateSessionDebrief(cid, 'dbg1'); }finally{ window.callAiAPI = realAi; }
          const p = sent[0] || '';
          const budget = DEBRIEF_TRANSCRIPT_CHAR_CAP - NOTE.length - 1;     // note + newline + transcript <= 120,000
          const run = sentRun(p, text);
          rec('T4 C3 (send half): of a 157,060-char call the debrief sends exactly 120,000 - note - 1 chars of transcript, then the truncated marker',
            run.len === budget && p.includes('truncated to the first 120,000 characters'),
            `prompts=${sent.length} runLen=${run.len} budget=${budget}`);
          sent.length = 0;
        });
        await withBook(async book => {   // the cap is on the whole record: a long note leaves less room for transcript
          const text = window.STEP1_CALLS[0], longNote = 'N' + 'n'.repeat(4999);
          const act = {id: 'dbg2', date: todayISO(), type: 'Call', summary: longNote, checklist: [], sessionNumber: 1};
          act.transcript = await saveTranscriptVerified('dbg2', text);
          book.activities[cid] = (book.activities[cid] || []).concat([act]);
          const realAi = window.callAiAPI, sent = [];
          window.callAiAPI = async prompt => { sent.push(String(prompt)); return {text: '[]', truncated: false}; };
          try{ await generateSessionDebrief(cid, 'dbg2'); }finally{ window.callAiAPI = realAi; }
          const p = sent[0] || '', budget = DEBRIEF_TRANSCRIPT_CHAR_CAP - longNote.length - 1, run = sentRun(p, text);
          rec('T4 the 120,000 cap covers note + transcript together (a 5,000-char note leaves 114,999 for the transcript)',
            run.len === budget, `runLen=${run.len} budget=${budget}`);
        });

        // C4 (Guard: green when written, because Task 3 landed first; it protects the debrief half against a later break).
        await withBook(async book => {
          const text = window.STEP1_CALLS[0];
          const act = {id: 'dbg3', date: todayISO(), type: 'Call', summary: 'note', checklist: [], sessionNumber: 1};
          act.transcript = await saveTranscriptVerified('dbg3', text);
          book.activities[cid] = (book.activities[cid] || []).concat([act]);
          saveData();                                          // the stored book now holds the ref
          await tsDelete(act.transcript.ref);                  // delete the record behind the app
          await loadData();                                    // a real reload: startup must survive the missing record
          const act2 = DATA.activities[cid].find(a => a.id === 'dbg3');
          const realAi = window.callAiAPI, sent = [];
          window.callAiAPI = async prompt => { sent.push(String(prompt)); return {text: '[]', truncated: false}; };
          try{ await generateSessionDebrief(cid, 'dbg3'); }finally{ window.callAiAPI = realAi; }
          const joined = sent.join('\n'), st = ui.sessionDebriefs && ui.sessionDebriefs['dbg3'];
          rec('T4 C4 (guard): after a reload with the record deleted behind the app the book loads, the notice state shows, and the debrief (which did run) sends no transcript text',
            DATA.customers.length > 0 && !!act2 && activityTranscriptState(act2) === 'missing' && window.__transcriptLoad.bad >= 1 &&
            sent.length >= 1 && !joined.includes(text.slice(1000, 1200)) && (!st || !st.error), `prompts=${sent.length} bad=${window.__transcriptLoad.bad} err=${st && st.error}`);
        });
      }

      { // T5: attach / replace / remove
        await withBook(async book => {
          const act = {id: 'att1', date: todayISO(), type: 'Call', summary: 'n', checklist: []};
          book.activities[cid] = (book.activities[cid] || []).concat([act]);
          const text = window.STEP1_CALLS[0];
          const ok = await attachTranscript(cid, 'att1', {text, truncated: false});
          const a = DATA.activities[cid].find(x => x.id === 'att1');
          const rec1 = await tsGet(a.transcript.ref);
          rec('T5 C3 (stored half): attaching the 157,060-char call stores all 157,060 chars, in IndexedDB, not in the book',
            ok === true && a.transcript.chars === 157060 && rec1.text.length === 157060 && rec1.text === text && a.transcript.truncated === false &&
            !localStorage.getItem(STORAGE_KEY).includes(text.slice(5000, 5100)), `chars=${a.transcript.chars}`);
          { // C3 through ONE path: the activity just attached is the one the debrief reads
            const realAi = window.callAiAPI, sent = [];
            window.callAiAPI = async prompt => { sent.push(String(prompt)); return {text: '[]', truncated: false}; };
            try{ await generateSessionDebrief(cid, 'att1'); }finally{ window.callAiAPI = realAi; }
            const p = sent[0] || '', budget = DEBRIEF_TRANSCRIPT_CHAR_CAP - 'n'.length - 1, run = sentRun(p, text);
            rec('T5 C3 (one path): the activity stored whole is the same one the debrief cuts for sending',
              a.transcript.chars === 157060 && run.len >= budget && p.slice(run.start + budget, run.start + budget + 40) !== text.slice(budget, budget + 40) && p.includes('truncated to the first 120,000 characters'), `runLen=${run.len}`);
          }
          const oldRef = a.transcript.ref;
          const ok2 = await attachTranscript(cid, 'att1', {text: text + ' more', truncated: false});
          const a2 = DATA.activities[cid].find(x => x.id === 'att1');
          rec('T5 Replace writes the new version under its own ref, then deletes the old record and clears the undo slot',
            ok2 === true && a2.transcript.ref !== oldRef && (await tsGet(oldRef)) === undefined && (await tsGet(a2.transcript.ref)) && _undoSnapshot === null);
          const keepRef = a2.transcript.ref;
          const realCommit = window.commitDataCandidate; window.commitDataCandidate = () => false;
          let ok3; try{ ok3 = await attachTranscript(cid, 'att1', {text: 'replacement that will fail to commit', truncated: false}); }finally{ window.commitDataCandidate = realCommit; }
          const failedRef = 'att1:' + (await sha1Hex('replacement that will fail to commit')).slice(0, 12);
          rec('T5 a failed book commit keeps the old record and deletes the new one',
            ok3 === false && (await tsGet(keepRef)) && (await tsGet(failedRef)) === undefined && activityTranscript(a2).text.endsWith(' more'));
          const realCommit2 = window.commitDataCandidate; window.commitDataCandidate = () => false;
          const actB = {id: 'att2', date: todayISO(), type: 'Call', summary: 'n', checklist: []};
          DATA.activities[cid].push(actB);
          let ok4; try{ ok4 = await attachTranscript(cid, 'att2', {text: 'fresh attach that fails', truncated: false}); }finally{ window.commitDataCandidate = realCommit2; }
          rec('T5 a failed first Attach leaves no record behind', ok4 === false && (await tsGet('att2:' + (await sha1Hex('fresh attach that fails')).slice(0, 12))) === undefined);
          markUndoable('x'); saveData();   // gives the undo slot something to hold
          const ok5 = removeTranscript(cid, 'att1');
          await settle();
          rec('T5 Remove deletes the record and clears the undo slot, so Undo cannot restore a deleted ref',
            ok5 === true && (await tsGet(keepRef)) === undefined && !DATA.activities[cid].find(x => x.id === 'att1').transcript && _undoSnapshot === null && undoAvailable() === null);
        });
        await withBook(async book => {   // same text again + failed commit must NOT delete the record the book points to
          book.activities[cid] = (book.activities[cid] || []).concat([{id: 'att3', date: todayISO(), type: 'Call', summary: 'n', checklist: []}]);
          await attachTranscript(cid, 'att3', {text: 'same text kept', truncated: false});
          const refS = DATA.activities[cid].find(x => x.id === 'att3').transcript.ref;
          const rc = window.commitDataCandidate; window.commitDataCandidate = () => false;
          let okS; try{ okS = await attachTranscript(cid, 'att3', {text: 'same text kept', truncated: false}); }finally{ window.commitDataCandidate = rc; }
          rec('T5 a failed Replace with the SAME text keeps the record the book still points to',
            okS === false && !!(await tsGet(refS)) && activityTranscriptState(DATA.activities[cid].find(x => x.id === 'att3')) === 'ok');
        });
        await withBook(async book => {   // two activities share a ref: Remove on one keeps the record for the other
          book.activities[cid] = (book.activities[cid] || []).concat([{id: 'att4', date: todayISO(), type: 'Call', summary: 'n', checklist: []}]);
          await attachTranscript(cid, 'att4', {text: 'shared words', truncated: false});
          const t4 = DATA.activities[cid].find(x => x.id === 'att4').transcript;
          const actC = {id: 'att5', date: todayISO(), type: 'Call', summary: 'n', checklist: [], transcript: Object.assign({}, t4)};
          DATA.activities[cid].push(actC);
          removeTranscript(cid, 'att4'); await settle();
          rec('T5 Remove keeps a record another activity still points to (restored archives can share refs)', !!(await tsGet(t4.ref)) && activityTranscriptState(actC) === 'ok');
        });
        { // Clear all data (For Ian (c), recommended answer: wipe too)
          const t = await saveTranscriptVerified('wipe1', 'to be wiped');
          await tsTx('premigration', 'readwrite', s => s.put({date: todayISO() + ':wipe', raw: '{}'}));
          await wipeTranscriptStore();
          rec('T5 wipeTranscriptStore empties the transcripts, the pre-move copies and the map',
            (await tsGet(t.ref)) === undefined && (await tsTx('premigration', 'readonly', s => s.count())) === 0 && _transcriptMap.size === 0);
        }
      }

      { // T6: the move
        const tsOf = () => DATA.activities[cid].filter(a => a.id.startsWith('mv'));
        const keyOf = async raw => todayISO() + ':' + (await sha1Hex(raw)).slice(0, 12);
        const getPre = async raw => { const k = await keyOf(raw); return tsTx('premigration', 'readonly', s => s.get(k)); };
        const mkRaw = (n, chars, schema) => { const b = cloneData(DATA); b.schemaVersion = schema || 16; b.synthetic = true;
          b.activities[cid] = (b.activities[cid] || []).filter(a => !a.id.startsWith('mv'));
          for(let i = 0; i < n; i++) b.activities[cid].push({id: 'mv' + i, date: todayISO(), type: 'Call', summary: 's' + i, checklist: [], transcript: {text: fixtureText(i, chars), truncated: false}});
          return JSON.stringify(b); };
        await withBook(async () => {
          const raw = mkRaw(3, 20000);
          realSet.call(localStorage, STORAGE_KEY, raw);
          const w0 = bookWrites();
          await loadData();
          const stored = localStorage.getItem(STORAGE_KEY);
          const first = tsOf()[0];
          rec('T6 a v16 book with inline transcripts moves: refs in the book, schema 17, exact records, readable at once',
            DATA.schemaVersion === 17 && tsOf().every(a => a.transcript.ref && a.transcript.text === undefined) && !stored.includes(fixtureText(0, 20000).slice(100, 300)) &&
            activityTranscript(first).text === fixtureText(0, 20000) && (await tsGet(first.transcript.ref)).text === fixtureText(0, 20000));
          rec('T6 the move saves the book exactly once (guard: also true before the change)', bookWrites() - w0 === 1, 'writes=' + (bookWrites() - w0));
          const pre = await getPre(raw);
          rec('T6 C6: the pre-move copy in IndexedDB is identical to the original book string', !!pre && pre.raw === raw, `same=${pre && pre.raw === raw}`);
          const before = await tsTx('transcripts', 'readonly', s => s.count());
          const w1 = bookWrites(); await loadData();
          const after = await tsTx('transcripts', 'readonly', s => s.count());
          rec('T6 loading the moved book again writes nothing and adds no records (a second tab moving at once would write the same refs)',
            bookWrites() === w1 && before === 3 && after === 3 && DATA.schemaVersion === 17, `records=${after}`);
        });
        await withBook(async () => {   // two different books on one day each keep their own original
          const rawA = mkRaw(1, 2000), rawB = mkRaw(2, 2500);
          realSet.call(localStorage, STORAGE_KEY, rawA); await loadData();
          realSet.call(localStorage, STORAGE_KEY, rawB); await loadData();
          const pa = await getPre(rawA), pb = await getPre(rawB);
          rec('T6 C6 (same day): a second, different book moved the same day keeps its own original, not the first one',
            !!pa && !!pb && pa.raw === rawA && pb.raw === rawB && pa.date !== pb.date);
        });
        await withBook(async () => {   // a book already stamped 17 (IndexedDB was down) that still holds inline text
          const raw = mkRaw(2, 4000, 17);
          realSet.call(localStorage, STORAGE_KEY, raw);
          await loadData();
          const pre = await getPre(raw);
          rec('T6 a book already stamped 17 that still holds inline text gets the pre-move copy BEFORE its transcripts move',
            !!pre && pre.raw === raw && tsOf().length === 2 && tsOf().every(a => a.transcript.ref));
        });
        await withBook(async () => {   // the copy must succeed before anything moves
          const raw = mkRaw(2, 3000);
          realSet.call(localStorage, STORAGE_KEY, raw);
          const realCopy = window.savePremigrationCopy; window.savePremigrationCopy = async () => { throw new Error('probe: copy refused'); };
          try{ await loadData(); }finally{ window.savePremigrationCopy = realCopy; }
          rec('T6 if the pre-move copy cannot be saved, nothing moves: transcripts stay inline and readable, no record is written',
            tsOf().length === 2 && tsOf().every(a => a.transcript.text && !a.transcript.ref) && activityTranscript(tsOf()[0]).text === fixtureText(0, 3000) &&
            (await tsTx('transcripts', 'readonly', s => s.count())) === 0);
        });
        await withBook(async () => {   // C5 (Guard: green before the change, because nothing moves yet)
          const raw = mkRaw(2, 5000);
          realSet.call(localStorage, STORAGE_KEY, raw);
          _tsForceDown = true; _tsDbP = null;
          const toasts = []; const rt = window.showToast; window.showToast = m => toasts.push(m);
          let threw = false; try{ await loadData(); }catch(e){ threw = true; }
          window.showToast = rt; _tsForceDown = false; _tsDbP = null;
          rec('T6 C5 (guard): IndexedDB unavailable - the book loads, inline transcripts stay readable and stay inline, no error toast',
            !threw && DATA.customers.length > 0 && tsOf().length === 2 && tsOf().every(a => a.transcript.text && !a.transcript.ref) &&
            activityTranscript(tsOf()[1]).text === fixtureText(1, 5000) && !toasts.some(m => /error|fail|could not/i.test(m)), JSON.stringify(toasts));
        });
        await withBook(async () => {   // one bad record must not block the others
          const raw = mkRaw(3, 3000);
          realSet.call(localStorage, STORAGE_KEY, raw);
          const realGet = tsGet; window.tsGet = async ref => { const r = await realGet(ref); return r && ref.startsWith('mv1:') ? Object.assign({}, r, {text: r.text + '!'}) : r; };
          try{ await loadData(); }finally{ window.tsGet = realGet; }
          rec('T6 a record that fails its read-back stays inline while the others move',
            tsOf().filter(a => a.transcript.ref).length === 2 && tsOf().filter(a => a.transcript.text).length === 1 && tsOf().every(a => activityTranscript(a)));
        });
        await withBook(async () => {   // C2
          const N = 50;
          const rawWith = mkRaw(N, 40000);
          realSet.call(localStorage, STORAGE_KEY, rawWith);
          await loadData();
          const stored = localStorage.getItem(STORAGE_KEY);
          const base = JSON.parse(stored); base.activities[cid].forEach(a => { if(a.id.startsWith('mv')) delete a.transcript; });   // same normalized book, transcripts removed
          const baseLen = JSON.stringify(base).length;
          let kept = 0; tsOf().forEach((a, i) => { if(a.transcript && a.transcript.ref && activityTranscript(a) && activityTranscript(a).text === fixtureText(i, 40000)) kept++; });
          rec('T6 C2: after the move the stored book is at most 200 chars per transcript above the same book with none, and all 50 refs and their texts survive',
            stored.length - baseLen <= 200 * N && tsOf().length === N && kept === N, `stored=${stored.length} base=${baseLen} perTranscript=${((stored.length - baseLen) / N).toFixed(0)} kept=${kept}`);
        });
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
