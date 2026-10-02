/* C-2 async probe. Run as a seed so the real async path is exercised with a stubbed fetch
   (no network, no key):
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js,docs/superpowers/evidence/trim-and-integration/c2-async-probe.js --fn c2ProbeResults --expect 8
   Everything it touches (both settings keys, window.fetch, _connectorFetch, ui.connector) is restored. */
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
  const rawA = localStorage.getItem('obm-ai-settings-v1');
  const origFetch = window.fetch;
  const origCF = _connectorFetch;
  const origUi = ui.connector;
  const ok200 = body => Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(body)});
  window.c2ProbeResults = () => ({results});
  (async function(){
    try{
      saveConnectorSettings({url: 'http://127.0.0.1:8787', token: 'tok'});
      localStorage.removeItem('obm-ai-settings-v1');

      // 1. truncated:true passes through callAiAPI, and the request is what the contract asks for
      let seen = null;
      _connectorFetch = (url, init) => { seen = {url, init}; return ok200({text: 'ok', truncated: true}); };
      const r1 = await callAiAPI('p', {task: 'copilot_read', maxTokens: 5});
      rec('truncated:true from the connector reaches the caller of callAiAPI',
        r1 && r1.text === 'ok' && r1.truncated === true, JSON.stringify(r1));
      rec('request is POST /v1/ai with bearer and {task, prompt, maxTokens}',
        seen && seen.url === 'http://127.0.0.1:8787/v1/ai' && seen.init.method === 'POST'
        && seen.init.headers.Authorization === 'Bearer tok'
        && seen.init.body === '{"task":"copilot_read","prompt":"p","maxTokens":5}', JSON.stringify(seen && seen.init));
      _connectorFetch = () => ok200({text: 'ok'});
      const r1b = await callAiAPI('p', {});
      rec('absent truncated reads as false', r1b.truncated === false, JSON.stringify(r1b));

      // 2. offline, no browser key: a plain OFFLINE error, no crash
      _connectorFetch = () => Promise.reject(new TypeError('Failed to fetch'));
      let code2 = '';
      try{ await callAiAPI('p', {task: 'x'}); }catch(e){ code2 = e.code; }
      rec('offline connector and no browser key rejects with code OFFLINE', code2 === 'OFFLINE', code2);

      // 3. offline, browser key present: falls back to the browser path (global fetch stubbed, no network)
      saveAiSettings({apiKey: 'k', model: 'gemini-2.5-flash'});
      let browserCalls = 0;
      window.fetch = () => { browserCalls++; return ok200({candidates: [{content: {parts: [{text: 'browser'}]}, finishReason: 'STOP'}]}); };
      const r3 = await callAiAPI('p', {task: 'x'});
      rec('offline connector with a browser key falls back to the browser path',
        r3.text === 'browser' && browserCalls === 1, JSON.stringify(r3));

      // 4. 401 is shown, not hidden by the fallback
      _connectorFetch = () => Promise.resolve({ok: false, status: 401, json: () => Promise.resolve({error: 'unauthorized'})});
      let code4 = '';
      browserCalls = 0;
      try{ await callAiAPI('p', {task: 'x'}); }catch(e){ code4 = e.code; }
      rec('a 401 surfaces as UNAUTHORIZED and does not fall back', code4 === 'UNAUTHORIZED' && browserCalls === 0, code4 + ' browserCalls=' + browserCalls);

      // 5. health: offline then fake
      _connectorFetch = () => Promise.reject(new TypeError('Failed to fetch'));
      await checkConnectorHealth();
      rec('checkConnectorHealth against a dead connector sets offline and renders Connector offline',
        ui.connector.state === 'offline' && renderConnectorStatus().indexOf('Connector offline') !== -1, ui.connector.state);
      _connectorFetch = () => ok200({version: '1', adapters: {gong: 'fake', gainsight: 'fake', ai: 'fake'}});
      await checkConnectorHealth();
      rec('checkConnectorHealth against a fake-adapter connector renders FAKE DATA',
        ui.connector.state === 'online' && renderConnectorStatus().indexOf('FAKE DATA') !== -1, renderConnectorStatus());
    }catch(e){
      rec('probe ran without throwing', false, String(e && e.stack || e));
    }finally{
      window.fetch = origFetch;
      _connectorFetch = origCF;
      ui.connector = origUi;
      if(rawC === null) localStorage.removeItem('obm-connector-settings-v1'); else localStorage.setItem('obm-connector-settings-v1', rawC);
      if(rawA === null) localStorage.removeItem('obm-ai-settings-v1'); else localStorage.setItem('obm-ai-settings-v1', rawA);
      console.error = origErr;
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onErr);
      rec('no console errors or unhandled rejections during the probe (K8)', errs.length === 0, errs.join(' | ').slice(0, 300));
    }
  })();
})();
