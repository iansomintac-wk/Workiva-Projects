#!/usr/bin/env node
// End-to-end scenario (C-7): the real tracker page, loaded as a file:// page in headless Chrome, talking real
// HTTP to the real connector running FAKE adapters. Everything is on 127.0.0.1; no key, no external network.
//   node tools/connector-e2e.mjs [--days-ahead N] [--keep-logs]
// --days-ahead N runs the connector (env CONNECTOR_FAKE_NOW) and the pages (a Date shim) N days in the future, so both agree on today.
// Chrome is launched WITHOUT --allow-file-access-from-files, so it sends `Origin: null` like a real browser
// (that flag makes it send `file://`, which the connector correctly refuses). The connector's CORS is not loosened.
// The connector gets a temp config, token file and push log (free port); Chrome gets a fresh temp profile.
// All of it is removed at the end, and only the PIDs this runner spawned are killed.
// Prints `connector-e2e: N/8 passed, M failed`; exit 0 only for 8/8 with no console errors.
// NOT part of the distributable bundle — dev tooling, like docs/.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { removeDir, waitForExit } from './e2e-cleanup.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const keepLogs = process.argv.includes('--keep-logs');
const daysAheadIdx = process.argv.indexOf('--days-ahead');
const daysAhead = daysAheadIdx > 0 ? Number(process.argv[daysAheadIdx + 1]) : 0;
if (!Number.isFinite(daysAhead)) { console.error('--days-ahead needs a number'); process.exit(2); }
// Shifts new Date() and Date.now() by the same whole days the connector's fake clock is shifted by.
const dateShim = `(() => { const off = ${daysAhead} * 86400000; window.Date = new Proxy(Date, {
  construct(t, a, nt) { return a.length ? Reflect.construct(t, a, nt) : Reflect.construct(t, [t.now() + off], nt); },
  get(t, p, r) { return p === 'now' ? () => t.now() + off : Reflect.get(t, p, r); } }); return true; })()`;
const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('Could not find Chrome or Edge.'); process.exit(2); }

const tmp = mkdtempSync(join(tmpdir(), 'connector-e2e-'));
const profile = mkdtempSync(join(tmpdir(), 'connector-e2e-chrome-'));
const cfgPath = join(tmp, 'config.json');
const tokenPath = join(tmp, 'token.txt');
const logPath = join(tmp, 'fake-gainsight-log.jsonl');
writeFileSync(cfgPath, JSON.stringify({
  port: 0, gong: { adapter: 'fake', rebaseToToday: true }, gainsight: { adapter: 'fake' },
  snowflake: { adapter: 'fake', rebaseToToday: true, fixture: 'demo' }, ai: { adapter: 'fake', model: '', apiKey: '' },
}));

let connector = null;
let chrome = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startConnector() {
  return new Promise((resolve, reject) => {
    connector = spawn(process.execPath, [join(root, 'connector', 'server.mjs')], {
      cwd: root,
      env: { ...process.env, CONNECTOR_CONFIG: cfgPath, CONNECTOR_TOKEN_FILE: tokenPath, CONNECTOR_LOG: logPath,
        ...(daysAhead ? { CONNECTOR_FAKE_NOW: new Date(Date.now() + daysAhead * 86400000).toISOString() } : {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    const timer = setTimeout(() => reject(new Error(`connector did not start in 10 s: ${out}`)), 10000);
    connector.stdout.on('data', (d) => {
      out += d;
      const port = (out.match(/listening http:\/\/127\.0\.0\.1:(\d+)/) || [])[1];
      const token = (out.match(/^token ([0-9a-f]{64})$/m) || [])[1];
      if (port && token) { clearTimeout(timer); resolve({ url: `http://127.0.0.1:${port}`, token }); }
    });
    connector.stderr.on('data', (d) => { out += d; });
    connector.on('exit', (code) => { clearTimeout(timer); reject(new Error(`connector exited early (${code}): ${out}`)); });
  });
}
function stopConnector() {
  if (!connector || connector.exitCode !== null || connector.signalCode !== null) return Promise.resolve();
  return new Promise((r) => { connector.removeAllListeners('exit'); connector.on('exit', () => r()); connector.kill(); });
}
function killChrome() {
  if (!chrome || !chrome.pid) return;
  // Windows: SIGKILL on the launcher does not take down the browser's process tree; kill our own tree by PID.
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { chrome.kill('SIGKILL'); } catch {} }
}
// Cleanup problems are reported, never thrown (connect-ready T-1): the exit code is the scenarios' result.
async function cleanup() {
  killChrome();
  await stopConnector();
  await waitForExit(chrome, 5000);
  await sleep(500);
  const problems = [];
  if (!keepLogs) { const p = removeDir(tmp, 'temp config'); if (p) problems.push(p); }
  const p = removeDir(profile, 'Chrome temp profile'); if (p) problems.push(p);
  return problems;
}

const results = [];
const check = async (name, fn) => {
  try {
    const r = await fn();
    results.push({ name, ok: r.ok === true, detail: r.detail || '' });
  } catch (e) { results.push({ name, ok: false, detail: 'threw: ' + (e && e.message || e) }); }
};

async function main() {
  const { url, token } = await startConnector();
  const PORT = 9900 + Math.floor(Math.random() * 90);
  const target = pathToFileURL(join(root, 'osm-book-of-business-tracker-1.0.html')).href;
  // NO --allow-file-access-from-files: the page must send `Origin: null`, like a real browser opening the file.
  chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', target], { stdio: ['ignore', 'ignore', 'pipe'] });

  let page = null;
  for (const deadline = Date.now() + 20000; Date.now() < deadline && !page; await sleep(150)) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl && /osm-book-of-business-tracker-1\.0\.html/i.test(t.url));
    } catch { /* not up yet */ }
  }
  if (!page) throw new Error('no debuggable tracker page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('CDP socket failed')), { once: true }); });
  let mid = 0;
  const pending = new Map();
  const consoleErrors = [];
  let killed = false, errorsBeforeKill = 0;
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') consoleErrors.push('exception: ' + String(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text).split('\n')[0]);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push('console.error: ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 200));
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++mid; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.delete(id)) rej(new Error(`CDP ${method} timed out`)); }, 60000);
  });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  // Run page code (an async body that returns a JSON-able value).
  const ev = async (body) => {
    const r = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true,
      expression: `(async () => { try { return JSON.stringify(await (async () => { ${body} })()); } catch (e) { return JSON.stringify({ __err: String(e && e.stack || e) }); } })()` });
    if (r.exceptionDetails) throw new Error('eval threw: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    const v = JSON.parse(r.result.value);
    if (v && v.__err) throw new Error(v.__err.split('\n').slice(0, 3).join(' | '));
    return v;
  };
  for (let i = 0; i < 200; i++) {
    const r = await send('Runtime.evaluate', { expression: `document.readyState === 'complete' && typeof saveData === 'function'`, returnByValue: true });
    if (r.result?.value === true) break;
    await sleep(150);
  }
  if (daysAhead) await send('Runtime.evaluate', { expression: dateShim, returnByValue: true });
  const suite = readFileSync(join(root, 'tools', 'selfchecks.js'), 'utf8');
  const seed = readFileSync(join(root, 'demo-seed.js'), 'utf8');
  await ev(`const s = document.createElement('script'); s.textContent = ${JSON.stringify(suite)}; document.body.appendChild(s); return typeof window.runSelfChecks;`);
  const seeded = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => { try { ${seed}\n; saveData(); return 'ok:' + DATA.customers.length; } catch (e) { return 'err:' + e.message; } })()` });
  if (!String(seeded.result?.value).startsWith('ok:')) throw new Error('seed failed: ' + seeded.result?.value);
  // Save the connector settings the way Settings does, then run the page's own startup health check.
  await ev(`saveConnectorSettings({url: ${JSON.stringify(url)}, token: ${JSON.stringify(token)}}); await checkConnectorHealth(); ui.view = 'today'; render(); return ui.connector.state;`);
  const waitFor = async (expr, ms = 8000) => { for (const d = Date.now() + ms; Date.now() < d; await sleep(100)) { if (await ev(`return !!(${expr});`)) return true; } return false; };

  // A second page (same Chrome, same temp profile, new CDP target) on a tracker file, shimmed, seeded and pointed at the connector.
  const openPage = async (file, connUrl, connToken) => {
    const fileUrl = pathToFileURL(join(root, file)).href;
    const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURI(fileUrl)}`, { method: 'PUT' })).json();
    const sock = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((res, rej) => { sock.addEventListener('open', res, { once: true }); sock.addEventListener('error', () => rej(new Error('CDP socket failed (page 2)')), { once: true }); });
    let n = 0; const wait = new Map();
    sock.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id && wait.has(m.id)) { const p = wait.get(m.id); wait.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
      if (m.method === 'Runtime.exceptionThrown') consoleErrors.push('page2 exception: ' + String(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text).split('\n')[0]);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push('page2 console.error: ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 200));
    });
    const snd = (method, params = {}) => new Promise((res, rej) => {
      const id = ++n; wait.set(id, { res, rej }); sock.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (wait.delete(id)) rej(new Error(`CDP ${method} timed out (page 2)`)); }, 60000);
    });
    await snd('Runtime.enable'); await snd('Page.enable');
    await snd('Page.setDownloadBehavior', { behavior: 'deny' }).catch(() => {});
    const run = async (body) => {
      const r = await snd('Runtime.evaluate', { awaitPromise: true, returnByValue: true,
        expression: `(async () => { try { return JSON.stringify(await (async () => { ${body} })()); } catch (e) { return JSON.stringify({ __err: String(e && e.stack || e) }); } })()` });
      if (r.exceptionDetails) throw new Error('eval threw: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      const v = JSON.parse(r.result.value);
      if (v && v.__err) throw new Error(v.__err.split('\n').slice(0, 3).join(' | '));
      return v;
    };
    for (let i = 0; i < 200; i++) {
      const r = await snd('Runtime.evaluate', { expression: `document.readyState === 'complete' && typeof saveData === 'function'`, returnByValue: true });
      if (r.result?.value === true) break;
      await sleep(150);
    }
    if (daysAhead) await snd('Runtime.evaluate', { expression: dateShim, returnByValue: true });
    const seeded2 = await snd('Runtime.evaluate', { returnByValue: true, expression: `(() => { try { ${seed}
; saveData(); return 'ok:' + DATA.customers.length; } catch (e) { return 'err:' + e.message; } })()` });
    if (!String(seeded2.result?.value).startsWith('ok:')) throw new Error('page 2 seed failed: ' + seeded2.result?.value);
    await run(`saveConnectorSettings({url: ${JSON.stringify(connUrl)}, token: ${JSON.stringify(connToken)}}); await checkConnectorHealth(); ui.view = 'today'; render(); return ui.connector.state;`);
    const waitFor2 = async (expr, ms = 8000) => { for (const d = Date.now() + ms; Date.now() < d; await sleep(100)) { if (await run(`return !!(${expr});`)) return true; } return false; };
    return { ev: run, waitFor: waitFor2, close: () => { try { sock.close(); } catch {} fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`).catch(() => {}); } };
  };

  await check('e1 health line shows FAKE DATA (K9)', async () => {
    const r = await ev(`const t = document.body.innerText; return {state: ui.connector.state, fake: ui.connector.fake, shown: /Connector: FAKE DATA/.test(t), mixed: /Connector: connected/.test(t)};`);
    return { ok: r.state === 'online' && r.fake === true && r.shown && !r.mixed, detail: JSON.stringify(r) };
  });

  let sessionRowInfo = null;
  await check('e2 Check for calls (the button) opens a preview: 5 matched, 1 no-account, 0 already linked', async () => {
    await ev(`document.getElementById('btn-check-calls').click(); return true;`);
    await waitFor(`document.querySelector('.modal-backdrop [data-cp-on]')`);
    const r = await ev(`return {titles: Array.from(document.querySelectorAll('.modal-backdrop .section-title')).map(e => e.textContent.replace(/\\s+/g, ' ').trim())};`);
    const t = r.titles;
    return { ok: t.length === 2 && /Matched.*\(5\)/.test(t[0]) && /No account.*\(1\)/.test(t[1]), detail: JSON.stringify(t) };
  });

  let beforeActs = null;
  await check('e3 add matched Call with a session + the Email touch (session forced in): Call gets gong.matchedBy and that session, Email gets none (K7)', async () => {
    beforeActs = await ev(`return Object.values(DATA.activities).reduce((n, l) => n + l.filter(a => a.gong).length, 0);`);
    const pick = await ev(`
      const rows = Array.from(document.querySelectorAll('.modal-backdrop tbody tr'));
      let callKey = null, callSess = null, emailKey = null;
      for (const tr of rows) {
        const on = tr.querySelector('[data-cp-on]'); if (!on || on.disabled) continue;
        const key = on.dataset.cpOn, type = tr.querySelector('[data-cp-type]').value, sel = tr.querySelector('[data-cp-sess]');
        const opt = sel && !sel.disabled ? Array.from(sel.options).find(o => /^\\d+$/.test(o.value)) : null;
        if (type === 'Call' && opt && !callKey) { callKey = key; callSess = opt.value; }
        if (type === 'Email' && !emailKey) emailKey = key;
      }
      if (!callKey || !emailKey) return {callKey, emailKey};
      const fire = (el, prop, val) => { el[prop] = val; el.dispatchEvent(new Event('change', {bubbles: true})); };
      // The re-render replaces the DOM after every change, so re-query each time.
      const q = (a, k) => document.querySelector('.modal-backdrop [' + a + '="' + k + '"]');
      fire(q('data-cp-sess', callKey), 'value', callSess);
      fire(q('data-cp-on', callKey), 'checked', true);
      fire(q('data-cp-on', emailKey), 'checked', true);
      const es = q('data-cp-sess', emailKey);                       // disabled for Email: force a session number in anyway
      es.disabled = false; const o = document.createElement('option'); o.value = '1'; o.textContent = '1'; es.appendChild(o);
      fire(es, 'value', '1');
      return {callKey, callSess, emailKey};`);
    if (!pick.callKey || !pick.emailKey) return { ok: false, detail: 'no session-capable Call row or no Email row: ' + JSON.stringify(pick) };
    await ev(`document.getElementById('cp-add').click(); return true;`);
    const r = await ev(`
      const all = []; Object.keys(DATA.activities).forEach(cid => DATA.activities[cid].forEach(a => { if (a.gong) all.push({type: a.type, sess: a.sessionNumber, by: a.gong.matchedBy, callId: a.gong.callId}); }));
      return {all, modalGone: !document.querySelector('.modal-backdrop')};`);
    const mine = r.all;
    const call = mine.find((a) => a.type === 'Call'), email = mine.find((a) => a.type === 'Email');
    sessionRowInfo = pick;
    const added = r.all.length - beforeActs;
    return { ok: added === 2 && !!call && call.sess === Number(pick.callSess) && !!call.by && !!email && email.sess === null && r.modalGone,
      detail: JSON.stringify({ added, call, email, forcedSession: pick.callSess }) };
  });

  await check('e4 Refresh from Gainsight (the button): tick a differing field and a gate, Update changes only what was ticked', async () => {
    await ev(`document.getElementById('btn-refresh-gainsight').click(); return true;`);
    await waitFor(`document.querySelector('.modal-backdrop [data-gp-on]')`);
    const pick = await ev(`
      const boxes = Array.from(document.querySelectorAll('.modal-backdrop [data-gp-on]'));
      const key = boxes.map(b => b.dataset.gpOn).find(k => /\\|(tier|arr|renewalDate)$/.test(k));
      if (!key) return {key: null, n: boxes.length};
      const cid = key.split('|')[0], field = key.split('|')[1];
      const c = DATA.customers.find(x => x.id === cid);
      const before = {tier: c.tier, arr: c.arr, renewalDate: c.renewalDate, stage: c.stage, notes: JSON.stringify(c.notes || null), stakeholders: (c.stakeholders || []).length};
      const b = document.querySelector('.modal-backdrop [data-gp-on="' + key + '"]'); b.checked = true; b.dispatchEvent(new Event('change', {bubbles: true}));
      return {key, cid, field, before, n: boxes.length};`);
    if (!pick.key) return { ok: false, detail: 'no tick-able differing field: ' + JSON.stringify(pick) };
    const btn = await ev(`const a = document.getElementById('gp-apply'); return {text: a.textContent, disabled: a.disabled};`);
    await ev(`document.getElementById('gp-apply').click(); return true;`);
    const after = await ev(`const c = DATA.customers.find(x => x.id === ${JSON.stringify(pick.cid)}); return {tier: c.tier, arr: c.arr, renewalDate: c.renewalDate, stage: c.stage, notes: JSON.stringify(c.notes || null), stakeholders: (c.stakeholders || []).length, gs: !!c.gainsight, modalGone: !document.querySelector('.modal-backdrop')};`);
    const changed = ['tier', 'arr', 'renewalDate'].filter((f) => String(after[f]) !== String(pick.before[f]));
    const untouched = after.stage === pick.before.stage && after.notes === pick.before.notes && after.stakeholders === pick.before.stakeholders;
    return { ok: /Update 1 ticked/.test(btn.text) && !btn.disabled && changed.length === 1 && changed[0] === pick.field && untouched && after.gs && after.modalGone,
      detail: JSON.stringify({ ticked: pick.key, button: btn.text, changed, untouched }) };
  });

  await check('e5 Send to Gainsight with one forceFail item: per-item sent (FAKE- id) and failed (error + Retry); the connector log has 2 lines', async () => {
    await ev(`
      const cust = DATA.customers.find(c => c.gainsightId);
      const mk = (id, fields) => ({id, date: todayISO(), customerId: cust.id, customerName: cust.name, kind: 'At-Risk CTA', payload: 'p ' + id, status: 'queued', fields, externalId: null, sentAt: null, error: null});
      DATA.gainsightQueue = [mk('e2e-ok', {ctaName: 'x', reason: 'r', severity: 'low'}), mk('e2e-bad', {ctaName: 'x', reason: 'r', severity: 'low', forceFail: true})];
      saveData(); ui.view = 'risk'; render(); return true;`);
    const label = await ev(`const b = document.getElementById('btn-send-gainsight'); return b ? b.textContent : null;`);
    await ev(`document.getElementById('btn-send-gainsight').click(); return true;`);
    await waitFor(`DATA.gainsightQueue.every(q => q.status !== 'queued')`);
    const r = await ev(`const [a, b] = DATA.gainsightQueue; return {a: {s: a.status, x: a.externalId, at: !!a.sentAt}, b: {s: b.status, x: b.externalId, e: b.error}};`);
    const lines = existsSync(logPath) ? readFileSync(logPath, 'utf8').trim().split('\n').length : 0;
    globalThis.__e5 = r;
    return { ok: /Send to Gainsight \(2\)/.test(label || '') && r.a.s === 'sent' && /^FAKE-/.test(r.a.x || '') && r.a.at && r.b.s === 'failed' && !!r.b.e && r.b.x === null && lines === 2,
      detail: JSON.stringify({ label, ...r, logLines: lines }) };
  });

  await check('e6 Brief my day (the button, via the fake AI): Today shows a per-account brief', async () => {
    await ev(`ui.view = 'today'; render(); return true;`);
    await ev(`document.getElementById('btn-brief-my-day').click(); return true;`);
    await waitFor(`ui.dayBrief && !ui.dayBrief.loading`, 15000);
    /* Every briefed account that Today draws must show its brief: shown ids === briefed ids whose name appears on Today.
       Briefed accounts not on Today are reported with the reason (the brief covers the whole book; Today lists only the
       accounts that need attention today). */
    const r = await ev(`const ids = Object.keys(ui.dayBrief.byId || {});
      const shownIds = [...new Set([...document.querySelectorAll('[data-day-brief]')].map(e => e.getAttribute('data-day-brief')))];
      const text = document.body.innerText;
      const nameOf = id => (DATA.customers.find(c => c.id === id) || {}).name || id;
      const onToday = ids.filter(id => shownIds.includes(id) || text.includes(nameOf(id)));
      const notOnToday = ids.filter(id => !onToday.includes(id)).map(id => { const c = DATA.customers.find(x => x.id === id) || {}; return nameOf(id) + ' (stage ' + c.stage + ')'; });
      const missing = onToday.filter(id => !shownIds.includes(id)).map(nameOf);
      return {err: ui.dayBrief.error || '', n: ids.length, shown: shownIds.length, onToday: onToday.length, missing, notOnToday, text: /FAKE next action/.test(text)};`);
    return { ok: !r.err && r.n > 0 && r.shown > 0 && r.shown === r.onToday && r.missing.length === 0 && r.text, detail: JSON.stringify(r) };
  });

  await check('e8 Check CSAT (the button in Settings, second page on tracker 1.1): dry run lists changed and unmatched rows, Apply backs up first then changes the dates', async () => {
    const p2 = await openPage('osm-book-of-business-tracker-1.1.html', url, token);
    try {
      await p2.ev(`const prior = window.exportData; window.__order = []; window.__snap = null;
        window.exportData = function(){ window.__order.push('backup'); window.__snap = JSON.stringify(DATA.customers.map(c => (c.compliance && c.compliance.associatedPeopleCSAT) || null)); return prior.apply(this, arguments); };
        return true;`);
      const snapOf = `JSON.stringify(DATA.customers.map(c => (c.compliance && c.compliance.associatedPeopleCSAT) || null))`;
      const before = await p2.ev(`return ${snapOf};`);
      await p2.ev(`document.getElementById('btn-settings').click(); return true;`);
      if (!await p2.waitFor(`document.getElementById('btn-check-survey-connector')`)) return { ok: false, detail: 'no Check CSAT button in Settings' };
      await p2.ev(`document.getElementById('btn-check-survey-connector').click(); return true;`);
      if (!await p2.waitFor(`document.getElementById('csat-apply')`)) return { ok: false, detail: 'no CSAT modal: ' + await p2.ev(`return document.body.innerText.slice(-200);`) };
      const dry = await p2.ev(`const n = t => { const s = Array.from(document.querySelectorAll('.modal-backdrop summary')).find(e => e.textContent.startsWith(t)); const m = s && /\\((\\d+)\\)/.exec(s.textContent); return m ? Number(m[1]) : -1; };
        return {changed: n('Dates that would change'), unmatched: n('Rows not in Runway'), summary: document.getElementById('csat-summary').textContent, applyDisabled: document.getElementById('csat-apply').disabled, order: window.__order.length, snap: ${snapOf}};`);
      const untouchedDry = dry.snap === before && dry.order === 0;
      await p2.ev(`document.getElementById('csat-apply').click(); return true;`);
      await p2.waitFor(`document.getElementById('csat-report-close')`);
      const after = await p2.ev(`return {order: window.__order, snapAtBackup: window.__snap, snap: ${snapOf}, saved: !/not saved/.test(document.body.innerText)};`);
      return { ok: dry.changed >= 1 && dry.unmatched >= 1 && !dry.applyDisabled && untouchedDry && after.order.length === 1 && after.snapAtBackup === before && after.snap !== before && after.saved,
        detail: JSON.stringify({ changed: dry.changed, unmatched: dry.unmatched, summary: dry.summary, untouchedDry, backups: after.order.length, backupBeforeChange: after.snapAtBackup === before, datesChanged: after.snap !== before, saved: after.saved, daysAhead }) };
    } finally { p2.close(); }
  });

  await check('e7 connector stopped: health says Connector offline, the full suite passes on the scenario book, Today renders, no console errors since the kill (K8)', async () => {
    await stopConnector();
    killed = true; errorsBeforeKill = consoleErrors.length;
    const h = await ev(`await checkConnectorHealth(); ui.view = 'today'; render(); return {state: ui.connector.state, shown: /Connector offline/.test(document.body.innerText), today: document.body.innerText.length > 500};`);
    const todayAfterScenario = await ev(`ui.view = 'today'; render(); return document.body.innerText.length > 500 && !!document.querySelector('[data-day-brief-bar]');`);
    // The full suite runs on the book the scenario produced (Gong links, Gainsight stamps, sent/failed queue items): no reseed.
    const s = await ev(`const r = window.runSelfChecks(); const list = Array.isArray(r) ? r : (r && r.results) || []; return {total: list.length, failed: list.filter(x => !x.ok).map(x => x.name + ': ' + String(x.detail || '').slice(0, 120))};`);
    await ev(`ui.view = 'today'; render(); return true;`);
    await sleep(500);
    const since = consoleErrors.length - errorsBeforeKill;
    return { ok: h.state === 'offline' && h.shown && h.today && todayAfterScenario && s.total >= 459 && s.failed.length === 0 && since === 0,
      detail: JSON.stringify({ ...h, todayAfterScenario, suiteTotal: s.total, suiteFailed: s.failed.slice(0, 3), consoleErrorsSinceKill: since }) };
  });

  ws.close();
  const passed = results.filter((r) => r.ok).length;
  results.sort((a, b) => a.name.localeCompare(b.name)); // e8 runs before e7 stops the connector; print in label order
  for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : ' — ' + r.detail}`);
  if (process.argv.includes('--verbose')) for (const r of results) console.log(`  detail ${r.name.slice(0, 2)}: ${r.detail}`);
  if (consoleErrors.length) { console.log(`${consoleErrors.length} console error(s):`); for (const e of consoleErrors) console.log('  ' + e); }
  console.log(`connector-e2e: ${passed}/8 passed, ${results.length - passed} failed`);
  return passed === 8 && results.length === 8 && consoleErrors.length === 0 ? 0 : 1;
}

let code = 2;
try { code = await main(); }
catch (e) { console.error('Harness failure: ' + (e && e.message || e)); }
const problems = await cleanup().catch((e) => [`cleanup threw: ${e && e.message || e}`]);
for (const p of problems) console.log(`cleanup warning: ${p}`);
console.log(`cleanup: ${problems.length ? `${problems.length} problem(s), see warnings above` : 'temp config/profile removed'}${keepLogs ? ` (kept: ${tmp})` : ''}`);
process.exit(code);
