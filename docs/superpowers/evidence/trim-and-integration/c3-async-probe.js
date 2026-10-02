/* C-3 async probe. Run as a seed so the real async "Check for calls" flow runs end to end with a
   stubbed connector fetch (no network, no key):
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js,docs/superpowers/evidence/trim-and-integration/c3-async-probe.js --fn c3ProbeResults --expect 12
   It restores: connector settings, _connectorFetch, DATA.activities, the stored book, ui fields. */
(function(){
  const results = [];
  const rec = (name, ok, detail) => results.push({name, ok: !!ok, detail: detail || ''});
  const errs = [];
  const origErr = console.error;
  console.error = function(){ errs.push(Array.prototype.join.call(arguments, ' ')); };
  const onErr = e => errs.push('window error: ' + (e.message || e));
  window.addEventListener('error', onErr);
  window.addEventListener('unhandledrejection', onErr);
  const rawC = localStorage.getItem('obm-connector-settings-v1');
  const rawBook = localStorage.getItem(STORAGE_KEY);
  const origCF = _connectorFetch;
  const origActsJson = JSON.stringify(DATA.activities);
  const origUi = {connector: ui.connector, last: ui.lastCallPullAt};
  const ok200 = body => Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(body)});
  const mk = (id, kind, title, startedAt, gid, name, emails) => ({callId: id, kind, url: 'https://fake.gong.invalid/call/' + id, startedAt, durationSec: 60, title,
    participants: emails.map(e => ({name: 'P', email: e, affiliation: 'customer'})),
    accountRef: {gainsightId: gid, name}, summary: 'FAKE gong summary', transcript: 'FAKE transcript'});
  const calls = [
    mk('c-demo-001', undefined, 'Aldridge Energy: session check-in', '2026-09-08T14:00:00Z', 'GS-DEMO-001', 'Aldridge Energy', []),
    mk('c-demo-004', undefined, 'Quick sync with Sam', '2026-09-15T13:00:00Z', null, null, ['sam.demo@fake-customer.invalid']),
    mk('c-demo-005', undefined, 'Intro call with unknown prospect', '2026-09-17T10:00:00Z', null, null, ['pat.nobody@unknown-company.invalid']),
    mk('c-demo-006', 'email', 'Email: follow-up on checklist', '2026-09-18T09:00:00Z', 'GS-DEMO-002', 'Brightwater Foods', [])];
  window.c3ProbeResults = () => ({results});
  const $m = sel => document.querySelector('.modal-backdrop ' + sel);
  const tick = el => { el.checked = true; el.dispatchEvent(new Event('change', {bubbles: true})); };
  (async function(){
    try{
      // 1. no connector configured: no button, and calling the flow does nothing loud
      localStorage.removeItem('obm-connector-settings-v1');
      rec('no connector: the header has no Check for calls button', renderHeader().indexOf('btn-check-calls') === -1);
      let fetched = 0;
      _connectorFetch = () => { fetched++; return Promise.reject(new TypeError('Failed to fetch')); };
      await checkForCalls();
      rec('no connector: checkForCalls fetches nothing, opens no modal, throws nothing',
        fetched === 0 && !document.querySelector('.modal-backdrop'), 'fetched=' + fetched);

      // 2. configured but offline: quiet toast, no modal
      saveConnectorSettings({url: 'http://127.0.0.1:8787', token: 'tok'});
      rec('configured: the header shows Check for calls', renderHeader().indexOf('btn-check-calls') !== -1);
      await checkForCalls();
      const toast = document.getElementById('toast').textContent;
      rec('offline connector: a quiet "Connector offline" toast, no modal, nothing changed',
        /Connector offline/.test(toast) && !document.querySelector('.modal-backdrop'), toast);

      // 3. online: request shape, then the preview modal
      let seen = null;
      _connectorFetch = (url, init) => { seen = {url, init}; return ok200({calls}); };
      await checkForCalls();
      rec('online: GET /v1/calls?since=<ISO> with the bearer token',
        seen && /^http:\/\/127\.0\.0\.1:8787\/v1\/calls\?since=\d{4}-\d{2}-\d{2}T/.test(seen.url) && seen.init.method === 'GET'
        && seen.init.headers.Authorization === 'Bearer tok', seen && seen.url);
      const groups = Array.prototype.map.call(document.querySelectorAll('.modal-backdrop .section-title'), e => e.textContent.replace(/\s+/g, ' '));
      rec('the preview has a matched group (3) and a no-account group (1)',
        groups.length === 2 && /Matched.*\(3\)/.test(groups[0]) && /No account.*\(1\)/.test(groups[1]), JSON.stringify(groups));
      const boxes = Array.prototype.slice.call(document.querySelectorAll('.modal-backdrop [data-cp-on]'));
      rec('every confirm box starts unchecked and "Add 0 confirmed" is disabled',
        boxes.length === 4 && boxes.every(b => !b.checked) && $m('#cp-add').disabled && /Add 0 confirmed/.test($m('#cp-add').textContent),
        boxes.length + ' boxes');

      // 4. K7 in the modal: the email row has no session choice; changing a Call row to Email clears it
      const emailRow = $m('[data-cp-type="m2"]').closest('tr');
      rec('the Email row has its session select disabled and empty',
        emailRow.querySelector('[data-cp-sess]').disabled && emailRow.querySelector('[data-cp-sess]').value === '');
      const sessSel = $m('[data-cp-sess="m0"]');
      sessSel.value = sessSel.options[1].value; sessSel.dispatchEvent(new Event('change', {bubbles: true}));
      const typeSel = $m('[data-cp-type="m0"]');
      typeSel.value = 'Email'; typeSel.dispatchEvent(new Event('change', {bubbles: true}));
      const afterRow = $m('[data-cp-type="m0"]').closest('tr');
      rec('changing a Call row (a session picked) to Email clears and disables the session pick',
        afterRow.querySelector('[data-cp-sess]').disabled && afterRow.querySelector('[data-cp-sess]').value === '');
      const t2 = $m('[data-cp-type="m0"]'); t2.value = 'Call'; t2.dispatchEvent(new Event('change', {bubbles: true}));
      const s2 = $m('[data-cp-sess="m0"]'); s2.value = s2.options[1].value; const want = s2.value; s2.dispatchEvent(new Event('change', {bubbles: true}));

      // 5. confirm two (the Call with session 4, the Email), pick an account for the unmatched row but leave it unticked
      tick($m('[data-cp-on="m0"]'));
      tick($m('[data-cp-on="m2"]'));
      const before = JSON.stringify(DATA.activities);
      const addBtn = $m('#cp-add');
      const labelOk = /Add 2 confirmed/.test(addBtn.textContent) && !addBtn.disabled;
      addBtn.click();
      const aldr = DATA.customers.find(c => c.gainsightId === 'GS-DEMO-001'), bright = DATA.customers.find(c => c.gainsightId === 'GS-DEMO-002');
      const callAct = (DATA.activities[aldr.id] || []).find(a => a.gong && a.gong.callId === 'c-demo-001');
      const mailAct = (DATA.activities[bright.id] || []).find(a => a.gong && a.gong.callId === 'c-demo-006');
      rec('Add 2 confirmed writes exactly the two ticked calls; the Call keeps its picked session, the Email has none (K7), summary is the title',
        labelOk && callAct && callAct.sessionNumber === Number(want) && callAct.summary === 'Aldridge Energy: session check-in'
        && mailAct && mailAct.type === 'Email' && mailAct.sessionNumber === null && mailAct.summary === 'Email: follow-up on checklist'
        && !(DATA.activities[DATA.customers.find(c => (c.stakeholders || []).length).id] || []).some(a => a.gong)
        && !document.querySelector('.modal-backdrop') && before !== JSON.stringify(DATA.activities),
        JSON.stringify({labelOk, call: callAct && callAct.sessionNumber, mail: mailAct && mailAct.sessionNumber}));

      // 6. a second pull: the two added calls are now "already in the tracker"
      await checkForCalls();
      const g2 = Array.prototype.map.call(document.querySelectorAll('.modal-backdrop .section-title'), e => e.textContent.replace(/\s+/g, ' '));
      rec('a second pull lists the two added calls as already in the tracker',
        g2.length === 3 && /Matched.*\(1\)/.test(g2[0]) && /Already in the tracker.*\(2\)/.test(g2[2]), JSON.stringify(g2));
      const cancel = $m('#cp-cancel'); if(cancel) cancel.click();
    }catch(e){
      rec('probe ran without throwing', false, String(e && e.stack || e));
    }finally{
      const mb = document.querySelector('.modal-backdrop'); if(mb) mb.remove();
      _connectorFetch = origCF;
      DATA.activities = JSON.parse(origActsJson);
      ui.connector = origUi.connector; ui.lastCallPullAt = origUi.last;
      if(rawC === null) localStorage.removeItem('obm-connector-settings-v1'); else localStorage.setItem('obm-connector-settings-v1', rawC);
      if(rawBook === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, rawBook);
      console.error = origErr;
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onErr);
      rec('no console errors or unhandled rejections during the probe (K8)', errs.length === 0, errs.join(' | ').slice(0, 300));
    }
  })();
})();
