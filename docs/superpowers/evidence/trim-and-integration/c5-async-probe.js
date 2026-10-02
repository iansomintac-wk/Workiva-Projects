/* C-5 async probe. Runs the real async "Send to Gainsight" flow with a stubbed connector fetch that behaves like the fake
   (sent + FAKE-<id>, or failed when fields.forceFail is true). No network, no key:
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js,docs/superpowers/evidence/trim-and-integration/c5-async-probe.js --fn c5ProbeResults --expect 13
   It restores: connector settings, _connectorFetch, DATA.gainsightQueue, the stored book, ui.view. */
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
  const hadQ = Object.prototype.hasOwnProperty.call(DATA, 'gainsightQueue'), origQ = DATA.gainsightQueue;
  const origView = ui.view;
  const ok200 = body => Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(body)});
  window.c5ProbeResults = () => ({results});
  const wait = async () => { for(let i = 0; i < 60; i++) await Promise.resolve(); };   // microtasks only: the harness reads the results once, without waiting on timers
  (async function(){
    try{
      const cust = DATA.customers.find(c => c.gainsightId && !inImplementation(c));
      const mk = (id, o) => Object.assign({id, date: todayISO(), customerId: cust.id, customerName: cust.name, kind: 'At-Risk CTA', payload: 'paste me ' + id,
        status: 'queued', fields: {ctaName: 'x', reason: 'r', severity: 'low'}, externalId: null, sentAt: null, error: null}, o || {});
      DATA.gainsightQueue = [mk('A'), mk('B', {fields: {forceFail: true}}), mk('D', {status: 'sent', externalId: 'FAKE-D', sentAt: new Date().toISOString()})];
      const snapshotD = JSON.stringify(DATA.gainsightQueue[2]);
      const bodies = [];
      let fetched = 0;

      // 1. no connector: no Send button, nothing fetched, paste text still builds
      localStorage.removeItem('obm-connector-settings-v1');
      _connectorFetch = () => { fetched++; return Promise.reject(new TypeError('Failed to fetch')); };
      const block0 = renderGainsightQueueBlock(DATA.gainsightQueue);
      const items0 = [{kind: 'compliance', customerId: cust.id, customerName: cust.name, label: 'CSAT contact', instruction: 'Add people', date: todayISO(), activityType: 'Graduation Success Plan'}];
      const text0 = buildGainsightBatchText(cust, items0);
      rec('no connector: no Send to Gainsight button, the copy-paste batch text still builds, the queue says there is no transport',
        block0.indexOf('btn-send-gainsight') === -1 && /CSAT contact: Add people/.test(text0) && /no transport/.test(block0), '');
      const r0 = await sendGainsightQueue();
      rec('no connector: sendGainsightQueue fetches nothing, changes nothing, throws nothing',
        fetched === 0 && r0 === null && DATA.gainsightQueue.every(q => q.status === 'queued' || q.id === 'D'), 'fetched=' + fetched);

      // 2. configured but offline: toast, nothing changes, items stay queued and retryable
      saveConnectorSettings({url: 'http://127.0.0.1:8787', token: 'tok'});
      const before = JSON.stringify(DATA.gainsightQueue);
      await sendGainsightQueue();
      rec('configured but offline: a "Connector offline" toast and the queue is byte-identical',
        /Connector offline/.test(document.getElementById('toast').textContent) && before === JSON.stringify(DATA.gainsightQueue), document.getElementById('toast').textContent);

      // 2b. (R3 I-5) a push that times out: outcome unknown, said so, queue untouched, no second request
      let timeoutFetches = 0;
      _connectorFetch = () => { timeoutFetches++; return Promise.reject(new DOMException('aborted', 'AbortError')); };
      const beforeT = JSON.stringify(DATA.gainsightQueue);
      await sendGainsightQueue(); await wait();
      const toastT = document.getElementById('toast').textContent;
      rec('a push that times out says it may have been sent (not "offline", not "nothing was sent"), sends once, and leaves the queue byte-identical',
        /may have been sent/i.test(toastT) && !/offline/i.test(toastT) && !/nothing was sent/i.test(toastT) && timeoutFetches === 1 && beforeT === JSON.stringify(DATA.gainsightQueue), toastT + ' fetches=' + timeoutFetches);

      // 3. online, partial success: A sent, B failed (forceFail), D never in the request
      _connectorFetch = (url, init) => {
        const body = JSON.parse(init.body); bodies.push({url, method: init.method, auth: init.headers.Authorization, ids: body.items.map(i => i.id), items: body.items});
        return ok200({results: body.items.map(i => i.fields && i.fields.forceFail === true
          ? {id: i.id, status: 'failed', externalId: null, error: 'fake failure (forceFail)'}
          : {id: i.id, status: 'sent', externalId: 'FAKE-' + i.id, error: null})});
      };
      ui.view = 'risk'; render();
      const btn = document.getElementById('btn-send-gainsight');
      rec('configured: the Risk tab queue shows "Send to Gainsight (2)" (the two unsent items)', !!btn && /Send to Gainsight \(2\)/.test(btn.textContent), btn && btn.textContent);
      btn.click(); await wait();
      const [A, B, D] = DATA.gainsightQueue;
      rec('the click POSTs /v1/push with the bearer token and exactly the two unsent items (the already-sent one is not in the body), customerRef carries the gainsightId',
        bodies.length === 1 && bodies[0].url === 'http://127.0.0.1:8787/v1/push' && bodies[0].method === 'POST' && bodies[0].auth === 'Bearer tok'
        && bodies[0].ids.join() === 'A,B' && bodies[0].items[0].customerRef.gainsightId === cust.gainsightId, JSON.stringify(bodies[0] && bodies[0].ids));
      rec('partial success is per item: A sent with FAKE-A and a stamp; B failed with the connector\'s error; D untouched',
        A.status === 'sent' && A.externalId === 'FAKE-A' && !!A.sentAt && B.status === 'failed' && B.error === 'fake failure (forceFail)' && B.externalId === null && JSON.stringify(D) === snapshotD,
        JSON.stringify({a: A.status, b: B.status}));
      const html = document.getElementById('app') ? document.getElementById('app').innerHTML : document.body.innerHTML;
      rec('the rendered queue shows "✓ sent · FAKE-A", B\'s error text and a Retry button for B only',
        html.indexOf('✓ sent · FAKE-A') !== -1 && html.indexOf('fake failure (forceFail)') !== -1 && html.split('data-queue-retry=').length === 2 && html.indexOf('data-queue-retry="B"') !== -1, '');
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const sq = (stored.gainsightQueue || []);
      rec('the result is saved: the stored book has A sent with its externalId and B failed', sq.length === 3 && sq[0].status === 'sent' && sq[0].externalId === 'FAKE-A' && sq[1].status === 'failed', '');

      // 4. Retry B (still forceFail): request has only B, stays failed and retryable; a second Send never re-sends A
      document.querySelector('[data-queue-retry="B"]').click(); await wait();
      rec('Retry sends only that item (A and D are not in the body) and a repeat failure keeps it failed and retryable',
        bodies.length === 2 && bodies[1].ids.join() === 'B' && DATA.gainsightQueue[1].status === 'failed' && !!document.querySelector('[data-queue-retry="B"]'), JSON.stringify(bodies[1] && bodies[1].ids));

      // 5. clear the cause and retry: B is sent; a further Send has nothing to send and fetches nothing
      DATA.gainsightQueue[1].fields = {ctaName: 'x', reason: 'r', severity: 'low'};
      await sendGainsightQueue(['B']);
      const n = bodies.length;
      const r5 = await sendGainsightQueue(); await wait();
      rec('after a successful retry B is sent; pressing Send again sends nothing (no request, nothing is ever sent twice)',
        DATA.gainsightQueue[1].status === 'sent' && DATA.gainsightQueue[1].externalId === 'FAKE-B' && r5 === null && bodies.length === n
        && DATA.gainsightQueue.filter(q => q.status === 'sent').length === 3, 'bodies=' + bodies.length);

      // 6. a result that says sent without an id is not believed
      DATA.gainsightQueue.push(mk('E'));
      _connectorFetch = () => ok200({results: [{id: 'E', status: 'sent', externalId: null, error: null}]});
      await sendGainsightQueue(['E']);
      rec('a "sent" result with no externalId leaves the item queued, not sent', DATA.gainsightQueue[3].status === 'queued' && DATA.gainsightQueue[3].externalId === null, DATA.gainsightQueue[3].status);
    }catch(e){
      rec('probe ran without throwing', false, String(e && e.stack || e));
    }finally{
      _connectorFetch = origCF;
      if(hadQ) DATA.gainsightQueue = origQ; else delete DATA.gainsightQueue;
      ui.view = origView;
      if(rawC === null) localStorage.removeItem('obm-connector-settings-v1'); else localStorage.setItem('obm-connector-settings-v1', rawC);
      if(rawBook === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, rawBook);
      console.error = origErr;
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onErr);
      rec('no console errors or unhandled rejections during the probe (K8)', errs.length === 0, errs.join(' | ').slice(0, 300));
    }
  })();
})();
