/* C-6 async probe. Runs the real async "Brief my day" flow with a stubbed connector fetch that answers the way the fake
   AI adapter does (one account per [id:] line). No network, no key:
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js,docs/superpowers/evidence/trim-and-integration/c6-async-probe.js --fn c6ProbeResults --expect 11
   It restores: connector and AI settings, _connectorFetch, ui.dayBrief, ui.view, the stored book. */
(function(){
  const results = [];
  const rec = (name, ok, detail) => results.push({name, ok: !!ok, detail: detail || ''});
  const errs = [];
  const origErr = console.error;
  console.error = function(){ errs.push(Array.prototype.join.call(arguments, ' ')); };
  const onErr = e => errs.push('window error: ' + (e.message || e.reason || e));
  window.addEventListener('error', onErr);
  window.addEventListener('unhandledrejection', onErr);
  const rawC = localStorage.getItem('obm-connector-settings-v1');
  const rawAi = localStorage.getItem('obm-ai-settings-v1');
  const rawBook = localStorage.getItem(STORAGE_KEY);
  const origCF = _connectorFetch;
  const origView = ui.view, origBrief = ui.dayBrief;
  const ok200 = body => Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(body)});
  const fakeAnswer = prompt => JSON.stringify({accounts: [...String(prompt).matchAll(/\[id:([^\]\s]+)\]/g)].map(m => ({
    id: m[1], nextAction: 'FAKE next action', reason: 'FAKE reason', flags: [{kind: 'drift', text: 'FAKE drift flag', reason: 'FAKE reason'}]}))});
  window.c6ProbeResults = () => ({results});
  const wait = async () => { for(let i = 0; i < 60; i++) await Promise.resolve(); };   // microtasks only
  const app = () => (document.getElementById('app') || document.body).innerHTML;
  (async function(){
    try{
      const open = DATA.customers.filter(c => c.stage !== 'graduated');
      const calls = [];

      // 1. no connector, no key: Today shows no brief bar and nothing is fetched, on render or after
      localStorage.removeItem('obm-connector-settings-v1');
      localStorage.removeItem('obm-ai-settings-v1');
      _connectorFetch = (url, init) => { calls.push({url, body: init && init.body}); return Promise.reject(new TypeError('Failed to fetch')); };
      ui.dayBrief = null; ui.view = 'today'; render(); await wait();
      rec('no AI at all: Today has no Brief my day bar or button, and no request is made on render',
        app().indexOf('data-day-brief-bar') === -1 && !document.getElementById('btn-brief-my-day') && calls.length === 0, 'calls=' + calls.length);

      // 2. connector configured: the button appears; rendering alone still fetches nothing (no call on load or timer)
      saveConnectorSettings({url: 'http://127.0.0.1:8787', token: 'tok'});
      _connectorFetch = (url, init) => { const body = JSON.parse(init.body); calls.push({url, body}); return ok200({text: fakeAnswer(body.prompt), truncated: false}); };
      render(); await wait();
      const btn = document.getElementById('btn-brief-my-day');
      rec('configured: the Today bar shows "Brief my day" and the real-name disclosure; rendering made no request',
        !!btn && /Brief my day/.test(btn.textContent) && /real name/.test(app()) && calls.length === 0, 'calls=' + calls.length);

      // 3. the click: one POST /v1/ai, task brief_my_day, one [id:] per open account
      render(); await wait();
      const bookBefore = JSON.stringify(DATA);
      document.getElementById('btn-brief-my-day').click(); await wait();
      const sent = calls[0] && calls[0].body;
      rec('the click POSTs /v1/ai once with task brief_my_day, maxTokens 3200 and one [id:] line per open account',
        calls.length === 1 && calls[0].url === 'http://127.0.0.1:8787/v1/ai' && sent.task === 'brief_my_day' && sent.maxTokens === 3200
        && (sent.prompt.match(/\[id:[^\]]+\]/g) || []).length === open.length, JSON.stringify({n: calls.length, task: sent && sent.task}));
      rec('every open account gets a brief: Object.keys(ui.dayBrief.byId).length === open accounts',
        ui.dayBrief && Object.keys(ui.dayBrief.byId).length === open.length && ui.dayBrief.dropped === 0, (ui.dayBrief ? Object.keys(ui.dayBrief.byId).length : 'none') + ' of ' + open.length);
      rec('advisory: the book (DATA) is byte-identical after the brief and its re-render', JSON.stringify(DATA) === bookBefore, '');
      const html = app();
      const c0 = open.find(c => !!document.querySelector('[data-day-brief="' + c.id + '"]'));
      const ov = c0 ? renderOverviewTab(c0, computeRisk(c0)) : '';
      rec('Today shows the brief on account rows with "why: FAKE reason", and the account\'s Overview shows its action and flag reasons',
        html.indexOf('data-day-brief=') !== -1 && html.indexOf('why: FAKE reason') !== -1 && ov.indexOf('FAKE next action') !== -1 && ov.indexOf('FAKE drift flag') !== -1,
        'first=' + (c0 && c0.id));

      // 4. truncated answer: the length-cap notice shows
      _connectorFetch = (url, init) => { const body = JSON.parse(init.body); calls.push({url, body}); return ok200({text: fakeAnswer(body.prompt), truncated: true}); };
      await briefMyDay(); await wait();
      rec('a truncated answer shows the existing length-cap notice', ui.dayBrief.truncated === true && /length cap/.test(app()), '');

      // 5. hostile model text is escaped in the DOM
      const target = open[0];
      _connectorFetch = () => ok200({text: JSON.stringify({accounts: [{id: target.id, nextAction: '<img src=x id=c6-pwn>', reason: '<b id=c6-pwn2>x</b>', flags: []}]}), truncated: false});
      await briefMyDay(); await wait();
      ui.openCustomerId = null; render();
      const ov2 = renderOverviewTab(target, computeRisk(target));
      rec('model text is escaped: no element from the answer reaches the page or the Overview',
        !document.getElementById('c6-pwn') && !document.getElementById('c6-pwn2') && ov2.indexOf('<img') === -1 && ov2.indexOf('&lt;img') !== -1, '');

      // 6. unreadable answer: a quiet error, nothing shown per account, no throw
      _connectorFetch = () => ok200({text: 'Here is your day: call everyone.', truncated: false});
      await briefMyDay(); await wait();
      rec('a non-JSON answer shows "could not be read", no per-account brief, no throw',
        /could not be read/.test(app()) && Object.keys(ui.dayBrief.byId).length === 0 && app().indexOf('data-day-brief=') === -1, '');

      // 7. connector offline, no browser key: says so, Today's ranked day is still there
      _connectorFetch = () => Promise.reject(new TypeError('Failed to fetch'));
      await briefMyDay(); await wait();
      rec('offline with no key: the bar says the connector is not reachable and Today still renders its ranked day',
        /not reachable/.test(app()) && (app().indexOf('data-day-step=') !== -1 || app().indexOf('Nothing needs you') !== -1), '');
    }catch(e){
      rec('probe ran without throwing', false, String(e && e.stack || e));
    }finally{
      _connectorFetch = origCF;
      ui.view = origView; ui.dayBrief = origBrief;
      if(rawC === null) localStorage.removeItem('obm-connector-settings-v1'); else localStorage.setItem('obm-connector-settings-v1', rawC);
      if(rawAi === null) localStorage.removeItem('obm-ai-settings-v1'); else localStorage.setItem('obm-ai-settings-v1', rawAi);
      if(rawBook === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, rawBook);
      console.error = origErr;
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onErr);
      rec('no console errors or unhandled rejections during the probe (K8)', errs.length === 0, errs.join(' | ').slice(0, 300));
    }
  })();
})();
