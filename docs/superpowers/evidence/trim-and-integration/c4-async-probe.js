/* C-4 async probe. Runs the real async "Refresh from Gainsight" flow with a stubbed connector fetch (no network, no key):
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js,docs/superpowers/evidence/trim-and-integration/c4-async-probe.js --fn c4ProbeResults --expect 11
   It restores: connector settings, _connectorFetch, DATA.customers, the stored book, ui fields. */
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
  const origCustJson = JSON.stringify(DATA.customers);
  const ok200 = body => Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(body)});
  window.c4ProbeResults = () => ({results});
  const $m = sel => document.querySelector('.modal-backdrop ' + sel);
  const tick = el => { el.checked = true; el.dispatchEvent(new Event('change', {bubbles: true})); };
  (async function(){
    try{
      const a = DATA.customers.find(c => c.gainsightId && !inImplementation(c));
      const b = DATA.customers.filter(c => c.gainsightId)[1];
      a.tier = 'Mid-market'; a.arr = 100000; a.renewalDate = '2027-01-01';
      a.compliance.associatedPeopleCSAT.done = false;
      const protect = () => JSON.stringify({stage: a.stage, goals: a.goals, notes: a.notes, domainScores: a.domainScores, name: a.name});
      const prot0 = protect();
      const accounts = [
        {gainsightId: a.gainsightId, name: a.name, tier: 'Enterprise', arr: 250000, renewalDate: '2027-06-30', csmOwner: 'Riley Demo',
          contacts: [{name: '<img src=x onerror=alert(1)>', email: 'evil@x.invalid', role: 'Champion'}], healthScore: 80,
          gates: {readinessAssessment: true, csatContact: true, successPlan: true}, openCtas: []},
        {gainsightId: 'GS-NOT-IN-BOOK', name: 'Ghost <b>Co</b>', tier: 'x', arr: 1, renewalDate: null, csmOwner: null, contacts: [], healthScore: 1, gates: {}, openCtas: []}];

      // 1. no connector: no button, nothing fetched, no modal
      localStorage.removeItem('obm-connector-settings-v1');
      rec('no connector: the header has no Refresh from Gainsight button', renderHeader().indexOf('btn-refresh-gainsight') === -1);
      let fetched = 0;
      _connectorFetch = () => { fetched++; return Promise.reject(new TypeError('Failed to fetch')); };
      await refreshFromGainsight();
      rec('no connector: refreshFromGainsight fetches nothing, opens no modal, throws nothing', fetched === 0 && !document.querySelector('.modal-backdrop'), 'fetched=' + fetched);

      // 2. configured but offline: quiet toast, nothing changed
      saveConnectorSettings({url: 'http://127.0.0.1:8787', token: 'tok'});
      rec('configured: the header shows Refresh from Gainsight', renderHeader().indexOf('btn-refresh-gainsight') !== -1);
      await refreshFromGainsight();
      const toast = document.getElementById('toast').textContent;
      rec('offline connector: a quiet "Connector offline" toast, no modal, nothing changed',
        /Connector offline/.test(toast) && !document.querySelector('.modal-backdrop') && JSON.stringify(DATA.customers) !== '' && a.tier === 'Mid-market', toast);

      // 3. online: request shape and preview
      let seen = null;
      _connectorFetch = (url, init) => { seen = {url, init}; return ok200({accounts}); };
      await refreshFromGainsight();
      rec('online: GET /v1/accounts with the bearer token', seen && seen.url === 'http://127.0.0.1:8787/v1/accounts' && seen.init.method === 'GET' && seen.init.headers.Authorization === 'Bearer tok', seen && seen.url);
      const groups = Array.prototype.map.call(document.querySelectorAll('.modal-backdrop .section-title'), e => e.textContent.replace(/\s+/g, ' '));
      rec('the preview has a differences group (1) and a not-linked group (1)', groups.length === 2 && /Differences.*\(1/.test(groups[0]) && /Not linked.*\(1\)/.test(groups[1]), JSON.stringify(groups));
      const boxes = Array.prototype.slice.call(document.querySelectorAll('.modal-backdrop [data-gp-on]'));
      rec('every box starts unchecked (tier, arr, renewal, contacts, CSAT gate = 5) and "Update 0 ticked" is disabled; the CSM owner row has no box',
        boxes.length === 5 && boxes.every(x => !x.checked) && $m('#gp-apply').disabled && /Update 0 ticked/.test($m('#gp-apply').textContent), boxes.length + ' boxes');
      const html = document.querySelector('.modal-backdrop').innerHTML;
      rec('connector strings are escaped: the hostile contact name and the ghost account name render as text, not markup',
        html.indexOf('<img') === -1 && html.indexOf('<b>Co') === -1 && html.indexOf('&lt;img') !== -1 && html.indexOf('&lt;b&gt;Co') !== -1);

      // 4. tick tier and the CSAT gate only; apply
      tick($m('[data-gp-on$="|tier"]'));
      tick($m('[data-gp-on$="|gate:csat"]'));
      const btn = $m('#gp-apply');
      const labelOk = /Update 2 ticked/.test(btn.textContent) && !btn.disabled;
      btn.click();
      rec('Update 2 ticked writes the tier and the CSAT gate and nothing else (arr, renewal, contacts, stage, goals, notes untouched); a pull record is stamped',
        labelOk && a.tier === 'Enterprise' && a.arr === 100000 && a.renewalDate === '2027-01-01' && !(a.stakeholders || []).some(s => s.email === 'evil@x.invalid')
        && a.compliance.associatedPeopleCSAT.done === true && protect() === prot0 && a.gainsight && a.gainsight.values.csmOwner === 'Riley Demo' && !a.csmOwner
        && !document.querySelector('.modal-backdrop'), JSON.stringify({labelOk, tier: a.tier, arr: a.arr}));

      // 5. second pull: tier now matches, CSAT now done; arr, renewal, contacts still differ; cancel writes nothing
      await refreshFromGainsight();
      const b2 = Array.prototype.slice.call(document.querySelectorAll('.modal-backdrop [data-gp-on]'));
      const before = JSON.stringify(DATA.customers);
      const cancel = $m('#gp-cancel'); if(cancel) cancel.click();
      rec('a second pull offers only what still differs (arr, renewal, contacts = 3), and Cancel writes nothing', b2.length === 3 && before === JSON.stringify(DATA.customers), b2.length + ' boxes');
    }catch(e){
      rec('probe ran without throwing', false, String(e && e.stack || e));
    }finally{
      const mb = document.querySelector('.modal-backdrop'); if(mb) mb.remove();
      _connectorFetch = origCF;
      DATA.customers = JSON.parse(origCustJson);
      if(rawC === null) localStorage.removeItem('obm-connector-settings-v1'); else localStorage.setItem('obm-connector-settings-v1', rawC);
      if(rawBook === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, rawBook);
      console.error = origErr;
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onErr);
      rec('no console errors or unhandled rejections during the probe (K8)', errs.length === 0, errs.join(' | ').slice(0, 300));
    }
  })();
})();
