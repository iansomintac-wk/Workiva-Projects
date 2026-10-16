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

      { // T7: log form and Gong
        await withBook(async book => {
          const big = fixtureText(7, 130000);
          const act = {id: 'lg1', date: todayISO(), type: 'Call', summary: 'logged', checklist: [], sessionNumber: null, flagged: false};
          const c = DATA.customers.find(x => x.id === cid);
          const ok = await submitLoggedActivity(c, act, big, false);
          const a = DATA.activities[cid].find(x => x.id === 'lg1');
          rec('T7 the log form stores a 130,000-char transcript whole, as a verified ref', ok === true && a.transcript.ref && a.transcript.chars === 130000 && a.transcript.truncated === false && activityTranscript(a).text === big);
          const realCommit = window.commitDataCandidate; window.commitDataCandidate = () => false;
          const act2 = {id: 'lg2', date: todayISO(), type: 'Call', summary: 'logged2', checklist: [], sessionNumber: null, flagged: false};
          let ok2; try{ ok2 = await submitLoggedActivity(c, act2, 'text that must not stick', false); }finally{ window.commitDataCandidate = realCommit; }
          rec('T7 a failed log commit leaves no record behind', ok2 === false && (await tsGet('lg2:' + (await sha1Hex('text that must not stick')).slice(0, 12))) === undefined);
          _tsForceDown = true; _tsDbP = null;
          const act3 = {id: 'lg3', date: todayISO(), type: 'Call', summary: 'logged3', checklist: [], sessionNumber: null, flagged: false};
          const ok3 = await submitLoggedActivity(c, act3, big, false);
          _tsForceDown = false; _tsDbP = null;
          const a3 = DATA.activities[cid].find(x => x.id === 'lg3');
          rec('T7 with IndexedDB unavailable the log form falls back to the inline, uncut form', ok3 === true && a3.transcript.text === big && !a3.transcript.ref);
          // a second Save while the first is still writing
          const actA = {id: 'lgA', date: todayISO(), type: 'Call', summary: 'A', checklist: [], sessionNumber: null, flagged: false};
          const actB = {id: 'lgB', date: todayISO(), type: 'Call', summary: 'B', checklist: [], sessionNumber: null, flagged: false};
          const [rA, rB] = await Promise.all([submitLoggedActivity(c, actA, fixtureText(11, 60000), false), submitLoggedActivity(c, actB, fixtureText(12, 60000), false)]);
          rec('T7 a second Save while the first is still writing is refused (no double log)', rA === true && rB === false && DATA.activities[cid].some(x => x.id === 'lgA') && !DATA.activities[cid].some(x => x.id === 'lgB'));
          // Gong: synchronous inline uncut, then moved to a ref
          const saved = DATA.activities; DATA.activities = {gk: []};
          const savedCust = DATA.customers; DATA.customers = [Object.assign(cloneData({c: savedCust[0]}).c, {id: 'gk', name: 'Gong probe'})];
          let res, after;
          try{
            res = applyCallImport([{call: {callId: 'g-probe-1', title: 'Probe call', startedAt: new Date().toISOString(), transcript: fixtureText(9, 130000)}, customerId: 'gk', type: 'Call', sessionNumber: null, matchedBy: 'manual'}]);
            const immediate = DATA.activities.gk[0].transcript;
            await _transcriptMovePending;
            after = DATA.activities.gk[0].transcript;
            rec('T7 Gong import stores 130,000 chars uncut at once, then the move makes it a verified ref',
              res.created === 1 && immediate.text.length === 130000 && immediate.truncated === false && after.ref && after.chars === 130000 && (await tsGet(after.ref)).text === fixtureText(9, 130000));
          }finally{ DATA.activities = saved; DATA.customers = savedCust; }
        });
      }

      { // T8: files
        const sha = s => sha1Hex(s);
        // capture what Export writes, and drive the real Import handler
        const exportCapture = () => {
          const blobs = []; const realBlob = window.Blob, realURL = URL.createObjectURL, realClick = HTMLAnchorElement.prototype.click;
          window.Blob = function(parts, opts){ blobs.push(parts.join('')); return new realBlob(parts, opts); };
          URL.createObjectURL = () => 'blob:probe'; HTMLAnchorElement.prototype.click = function(){};
          try{ exportData(); }finally{ window.Blob = realBlob; URL.createObjectURL = realURL; HTMLAnchorElement.prototype.click = realClick; }
          return blobs[0] || '';
        };
        const driveImport = async fileText => {      // returns {cb, toasts}; cb = the real confirm callback (null if none was offered)
          let cb = null; const toasts = [];
          const rc = window.showConfirmModal, rt = window.showToast;
          window.showConfirmModal = (msg, onConfirm) => { cb = onConfirm; }; window.showToast = m => toasts.push(m);
          try{
            handleImportFile({target: {files: [new File([fileText], 'export.json')], value: 'x'}});
            await waitFor(() => cb !== null || toasts.length > 0, 15000);
            await settle();
          }finally{ window.showConfirmModal = rc; window.showToast = rt; }
          return {cb, toasts};
        };
        await withBook(async book => {
          // C1: 50 x 160K, load, REAL Export, fresh browser, REAL Import handler
          const N = 50, texts = [], ids = [];
          book.activities[cid] = (book.activities[cid] || []).filter(a => !a.id.startsWith('big'));
          for(let i = 0; i < N; i++){
            texts.push(fixtureText(i, 160000)); ids.push('big' + i);
            const a = {id: 'big' + i, date: todayISO(), type: 'Call', summary: 'b' + i, checklist: []};
            a.transcript = await saveTranscriptVerified(a.id, texts[i]);
            book.activities[cid].push(a);
          }
          saveData();
          await loadData();                                    // load: map rebuilt from IndexedDB
          const bookJson = serializeBook(DATA);
          const out = exportCapture();                         // what the Export button writes
          const parsed = JSON.parse(out);
          rec('T8 the Export file holds the book (refs only) plus a top-level transcripts object',
            bookJson.length < 400000 && parsed.transcripts && Object.keys(parsed.transcripts).length >= N && !bookJson.includes(texts[0].slice(500, 700)), `bookJson=${bookJson.length}`);
          await tsClearAll(); _transcriptMap.clear(); _tsVersion++;           // a fresh browser
          const d = await driveImport(out);
          const okCommit = d.cb ? d.cb() === true : false;      // the real confirm callback: prepareImportedData + commit
          let same = 0;                                         // NO loadTranscriptMap here: the import itself must leave them readable
          for(let i = 0; i < N; i++){ const a = DATA.activities[cid].find(x => x.id === ids[i]); const t = a && activityTranscript(a); if(t && await sha(t.text) === await sha(texts[i])) same++; }
          const storedBook = JSON.parse(localStorage.getItem(STORAGE_KEY));
          rec('T8 C1: 50 x 160K transcripts survive load, the real Export, and the real Import handler, readable at once, identical by SHA-1, and the stored book carries no transcripts object',
            okCommit === true && same === N && storedBook.transcripts === undefined && localStorage.getItem(STORAGE_KEY).length < 400000, `same=${same}/${N} stored=${localStorage.getItem(STORAGE_KEY).length}`);
        });
        await withBook(async book => {
          // an import that would put a test book over a real one is refused BEFORE any record is written
          const real = cloneData(DATA); delete real.synthetic; real.customers = real.customers.slice(0, 1);
          realSet.call(localStorage, STORAGE_KEY, JSON.stringify(real));
          const inc = cloneData(DATA); inc.synthetic = true;
          inc.activities[cid] = [{id: 'syn1', date: todayISO(), type: 'Call', summary: 's', checklist: [], transcript: {text: 'synthetic text must not be stored', truncated: false}}];
          await tsClearAll();
          const d = await driveImport(JSON.stringify(inc));
          rec('T8 a synthetic file over a stored real book is refused before any transcript is written',
            d.cb === null && d.toasts.some(m => /test book/i.test(m)) && (await tsTx('transcripts', 'readonly', s => s.count())) === 0, JSON.stringify(d.toasts));
        });
        await withBook(async book => {
          // old file shape (inline text) imports and moves on the way in
          const old = cloneData(DATA); old.schemaVersion = 16;
          old.activities[cid] = (old.activities[cid] || []).concat([{id: 'oldin', date: todayISO(), type: 'Call', summary: 's', checklist: [], transcript: {text: 'old shape text', truncated: true}}]);
          const st = await stageImportedTranscripts(Object.values(old.activities), undefined);
          const cand = prepareImportedData(old);
          const a = cand.activities[cid].find(x => x.id === 'oldin');
          rec('T8 an old-shape (inline) file is moved on the way in, keeping its truncated flag', a.transcript.ref && a.transcript.truncated === true && (await tsGet(a.transcript.ref)).text === 'old shape text');
          // a ref whose text is not in the file
          const miss = cloneData(DATA); miss.activities[cid] = [{id: 'nofile', date: todayISO(), type: 'Call', summary: 's', checklist: [], transcript: {ref: 'nofile:' + 'a'.repeat(12), chars: 3, sha1: 'a'.repeat(40), truncated: false}}];
          const st2 = await stageImportedTranscripts([miss.activities[cid]], {});
          const cand2 = prepareImportedData(miss);
          rec('T8 a ref with no text in the file imports and shows as missing, not as a failed import', st2.missing === 1 && activityTranscriptState(cand2.activities[cid][0]) === 'missing');
          // a record already in IndexedDB is reused AND put in the map
          const t = await saveTranscriptVerified('reuse1', 'already here');
          _transcriptMap.clear();
          const ru = [{id: 'reuse1', date: todayISO(), type: 'Call', summary: 's', checklist: [], transcript: {ref: t.ref, chars: t.chars, sha1: t.sha1, truncated: false}}];
          const st4 = await stageImportedTranscripts([ru], undefined);
          rec('T8 a record already present is reused without a rewrite and is readable at once (map filled)', st4.written === 0 && st4.missing === 0 && activityTranscript(ru[0]) && activityTranscript(ru[0]).text === 'already here');
          // IndexedDB down: the file's text stays usable inline
          _tsForceDown = true; _tsDbP = null;
          const dn = cloneData(DATA); dn.activities[cid] = [{id: 'dn1', date: todayISO(), type: 'Call', summary: 's', checklist: [], transcript: {ref: 'dn1:' + (await sha1Hex('down text')).slice(0, 12), chars: 9, sha1: await sha1Hex('down text'), truncated: false}}];
          const st3 = await stageImportedTranscripts([dn.activities[cid]], {['dn1:' + (await sha1Hex('down text')).slice(0, 12)]: 'down text'});
          _tsForceDown = false; _tsDbP = null;
          rec('T8 with IndexedDB unavailable an imported transcript becomes inline text', st3.unavailable === true && dn.activities[cid][0].transcript.text === 'down text');
        });
        await withBook(async book => {
          // cache: rebuilt only when a transcript is added, replaced or removed
          const act = {id: 'cch1', date: todayISO(), type: 'Call', summary: 's', checklist: []};
          book.activities[cid] = (book.activities[cid] || []).concat([act]);
          await attachTranscript(cid, 'cch1', {text: fixtureText(1, 40000), truncated: false});
          serializeBackup(DATA, serializeBook(DATA)); const b0 = _tsBackupBuilds;
          serializeBackup(DATA, serializeBook(DATA)); serializeBackup(DATA, serializeBook(DATA));
          const unchanged = _tsBackupBuilds - b0;
          await attachTranscript(cid, 'cch1', {text: fixtureText(2, 40000), truncated: false});
          serializeBackup(DATA, serializeBook(DATA)); const afterReplace = _tsBackupBuilds - b0;
          removeTranscript(cid, 'cch1');
          serializeBackup(DATA, serializeBook(DATA)); const afterRemove = _tsBackupBuilds - b0;
          rec('T8 the transcripts part of the backup is rebuilt only when a transcript is added, replaced or removed', unchanged === 0 && afterReplace === 1 && afterRemove === 2, `unchanged=${unchanged} replace=${afterReplace} remove=${afterRemove}`);
          // the backup file writer uses it
          const f = fakeBackupFile(); const sv = {h: _fsHandle, s: _fsState, syn: DATA.synthetic};
          await attachTranscript(cid, 'cch1', {text: 'in the backup file', truncated: false});
          delete DATA.synthetic; _fsHandle = f; _fsState = 'ready';
          const okFs = await fsWriteNow(true);
          _fsHandle = sv.h; _fsState = sv.s; DATA.synthetic = sv.syn;
          rec('T8 the backup file write contains the transcripts object', okFs === true && JSON.parse(f.last).transcripts && Object.values(JSON.parse(f.last).transcripts).includes('in the backup file'));
        });
      }

      { // T9: archive and restore
        const captureBlob = fn => {
          let captured = null; const realURL = URL.createObjectURL, realBlob = window.Blob, realClick = HTMLAnchorElement.prototype.click;
          window.Blob = function(parts, opts){ captured = parts.join(''); return new realBlob(parts, opts); };
          URL.createObjectURL = () => 'blob:probe'; HTMLAnchorElement.prototype.click = function(){};
          try{ fn(); }finally{ window.Blob = realBlob; URL.createObjectURL = realURL; HTMLAnchorElement.prototype.click = realClick; }
          return captured;
        };
        const driveRestore = async fileText => {
          let cb = null; const toasts = [];
          const rc = window.showConfirmModal, rt = window.showToast;
          window.showConfirmModal = (msg, onConfirm) => { cb = onConfirm; }; window.showToast = m => toasts.push(m);
          try{
            handleRestoreArchiveFile({target: {files: [new File([fileText], 'archive.json')], value: 'x'}});
            await waitFor(() => cb !== null || toasts.length > 0, 8000);
            await settle();
          }finally{ window.showConfirmModal = rc; window.showToast = rt; }
          return {cb, toasts};
        };
        await withBook(async book => {
          const base = cloneData(DATA.customers[0]); Object.assign(base, {id: 'arch1', name: 'Archive probe', stage: 'active'});
          book.customers.push(base);
          const act = {id: 'ar-a1', date: todayISO(), type: 'Call', summary: 's', checklist: []};
          book.activities['arch1'] = [act];
          await attachTranscript('arch1', 'ar-a1', {text: fixtureText(3, 30000), truncated: false});
          const ref = DATA.activities['arch1'][0].transcript.ref;
          const captured = captureBlob(() => archiveCustomer('arch1'));
          const file = JSON.parse(captured);
          rec('T9 the archive file carries the customer\'s transcripts, and the book no longer references them',
            file.transcripts && file.transcripts[ref] === fixtureText(3, 30000) && !DATA.customers.some(x => x.id === 'arch1') && !JSON.stringify(DATA.activities).includes(ref));
          rec('T9 archiving keeps the record in IndexedDB (unlinked, never auto-deleted)', (await tsGet(ref)) && (await tsGet(ref)).text === fixtureText(3, 30000));
          // restore with the record present: re-link without rewriting
          const before = (await tsGet(ref)).savedAt;
          const st = await stageImportedTranscripts([file.activities], file.transcripts);
          rec('T9 restore with the record still present re-links it without rewriting', st.missing === 0 && (await tsGet(ref)).savedAt === before && st.written === 0, JSON.stringify(st));
          // restore with the record gone: written from the file
          await tsDelete(ref); _transcriptMap.delete(ref);
          const file2 = JSON.parse(captured);
          const st2 = await stageImportedTranscripts([file2.activities], file2.transcripts);
          rec('T9 restore with the record gone writes it from the file and the text reads back', st2.written === 1 && (await tsGet(ref)).text === fixtureText(3, 30000));
          // the REAL restore handler: record gone, restored account's transcript readable at once
          await tsDelete(ref); _transcriptMap.clear(); _tsVersion++;
          const d = await driveRestore(captured);
          const okR = d.cb ? d.cb() === true : false;
          const restored = DATA.customers.find(x => x.name === 'Archive probe');
          const ra = restored && (DATA.activities[restored.id] || [])[0];
          rec('T9 the real restore handler brings the account back with its transcript readable at once (no reload)',
            okR === true && !!restored && !!ra && activityTranscript(ra) && activityTranscript(ra).text === fixtureText(3, 30000) && (await tsGet(ref)).text === fixtureText(3, 30000), JSON.stringify(d.toasts));
        });
        await withBook(async book => {
          // a restore while a test book would replace a stored real one is refused before any record is written
          const real = cloneData(DATA); delete real.synthetic; real.customers = real.customers.slice(0, 1);
          realSet.call(localStorage, STORAGE_KEY, JSON.stringify(real));
          const base = cloneData(DATA.customers[0]); Object.assign(base, {id: 'arch2', name: 'Archive refused', stage: 'active'});
          const archiveText = JSON.stringify({archiveVersion: 1, customer: base, activities: [{id: 'rf1', date: todayISO(), type: 'Call', summary: 's', checklist: [], transcript: {text: 'must not be stored', truncated: false}}], healthHistory: [], transcripts: {}});
          await tsClearAll();
          const d = await driveRestore(archiveText);
          rec('T9 a restore while a test book would replace a stored real one is refused before any transcript is written',
            d.cb === null && d.toasts.some(m => /test book/i.test(m)) && (await tsTx('transcripts', 'readonly', s => s.count())) === 0, JSON.stringify(d.toasts));
        });
      }

      { // T10: C7. Before = today's cost (serializeBook of a book with the text inline, in memory only); after = serializeBackup with a warm cache.
        const SPREAD_FLOOR_MS = 30;
        const median = a => a.slice().sort((x, y) => x - y)[1];
        const spread = a => (Math.max(...a) - Math.min(...a)) / median(a);
        await withBook(async book => {
          const N = 500;
          book.activities[cid] = (book.activities[cid] || []).filter(a => !a.id.startsWith('lg'));
          for(let i = 0; i < N; i++){
            const a = {id: 'lg' + i, date: todayISO(), type: 'Call', summary: 'l' + i, checklist: []};
            a.transcript = await saveTranscriptVerified(a.id, fixtureText(i, 40000));
            book.activities[cid].push(a);
          }
          const inline = cloneData(book);                       // the pre-Step-1 shape, in memory only (never stored)
          inline.activities[cid].forEach(a => { if(a.transcript && a.transcript.ref) a.transcript = {text: _transcriptMap.get(a.transcript.ref).text, truncated: false}; });
          serializeBackup(book, serializeBook(book));           // warm the cache; also a warm-up run for both paths
          serializeBook(inline);
          const before = [], after = [];
          for(let r = 0; r < 3; r++){                           // alternating before / after
            let t = performance.now(); serializeBook(inline); before.push(performance.now() - t);
            t = performance.now(); serializeBackup(book, serializeBook(book)); after.push(performance.now() - t);
          }
          const fmt = a => a.map(x => x.toFixed(1)).join('/');
          const sp = (a, name) => `${name} spread=${(spread(a) * 100).toFixed(0)}% ${median(a) < SPREAD_FLOOR_MS ? '(median under ' + SPREAD_FLOOR_MS + ' ms: floor, stop rule not applied)' : '(median at/over floor: lead applies the 15% stop rule)'}`;
          rec('T10 C7: backup preparation for 500 x 40K with transcripts unchanged takes under 30 ms per write (median of 3)',
            median(after) < 30, `after=${fmt(after)} median=${median(after).toFixed(1)}ms; before(today)=${fmt(before)} median=${median(before).toFixed(1)}ms (spec: 167); ${sp(after, 'after')}; ${sp(before, 'before')}`);
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
