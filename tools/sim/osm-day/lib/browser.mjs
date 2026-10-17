// Browser layer for the OSM day sim: one headless Chrome per part, throwaway osmsim-* profile,
// fake clock, fake AI and fake connector through CDP Fetch, escape counting, safe cleanup.
// Built from the clock and AI spikes in .ledger/2026-10-16-runway-day-sim/spikes/.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { clockShim, CORS, aiBody, connectorReply, connectorUrl } from './fakes.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const AI_HOSTS = ['api.anthropic.com', 'api.openai.com', 'generativelanguage.googleapis.com'];
const RESOLVER_RULES = AI_HOSTS.map(h => `MAP ${h} ~NOTFOUND`).join(', ');
const CHROMES = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function assertMarker(read, expected) {
  if (read === undefined || read === null || read !== expected) {
    throw new Error(`break marker mismatch: expected ${expected}, read ${read}`);
  }
}

export function countLeftovers(prefixes, dir) {
  return readdirSync(dir).filter(n => prefixes.some(p => n.startsWith(p))).length;
}

// Kill by PID, wait for that PID to exit, only then remove the profile (with retries). Never removes while alive.
export async function cleanupProfile({ pid, profile, isAlive, kill, remove, exists, timeoutMs = 60000, removeMs = timeoutMs / 2 }) {
  try { kill(pid); } catch {}
  for (const end = Date.now() + timeoutMs; isAlive(pid); await sleep(100)) {
    if (Date.now() > end) throw new Error(`process still alive: pid ${pid}`);
  }
  for (const end = Date.now() + removeMs; ; await sleep(250)) {
    try { remove(profile); } catch {}
    if (!exists(profile)) return;
    if (Date.now() > end) break;
  }
  throw new Error(`profile remains: ${profile}`);
}

const pidKill = pid => {
  if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  else process.kill(pid, 'SIGKILL');
};

export async function launch({ version, startDay, runDir, part, seed = null, chromePath = process.env.OSM_SIM_CHROME }) {
  const chrome = chromePath || CHROMES.find(existsSync);
  if (!chrome) throw new Error('Chrome not found');
  const target = join(ROOT, `osm-book-of-business-tracker-${version}.html`);
  if (!existsSync(target)) throw new Error(`tracker not found: ${target}`);
  const downloads = resolve(runDir, `downloads-${part}`);
  mkdirSync(downloads, { recursive: true });
  const connectorPort = 9900 + Math.floor(Math.random() * 100);
  const connector = connectorUrl(connectorPort);
  const profile = mkdtempSync(join(tmpdir(), 'osmsim-'));
  const child = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1440,900',
    `--host-resolver-rules=${RESOLVER_RULES}`, '--no-proxy-server', 'about:blank'], { stdio: 'ignore', windowsHide: true });
  const pid = child.pid;
  let childErr = null; let dead = false;
  child.on('error', e => { childErr = e; dead = true; });
  child.on('exit', () => { dead = true; });
  // Alive = Node's own handle on the child has not seen it exit (no tasklist polling; immune to PID reuse).
  const alive = () => !dead && child.exitCode === null && child.signalCode === null;
  let ws = null; let stopped = false;
  const onSig = sig => { stop().finally(() => process.exit(sig === 'SIGINT' ? 130 : 143)); };
  process.once('SIGINT', onSig); process.once('SIGTERM', onSig);
  const stop = async () => {
    if (stopped) return; stopped = true;
    process.removeListener('SIGINT', onSig); process.removeListener('SIGTERM', onSig);
    try { ws && ws.close(); } catch {}
    await cleanupProfile({ pid, profile, isAlive: alive, kill: pidKill, remove: p => rmSync(p, { recursive: true, force: true }), exists: existsSync });
  };
  try {
    let page; let cdpPort = 0;
    for (const end = Date.now() + 20000; Date.now() < end && !page; await sleep(150)) {
      if (childErr) throw new Error('Chrome failed to start: ' + childErr.message);
      if (dead) throw new Error('Chrome exited before opening a debugging port');
      if (!cdpPort) { try { cdpPort = Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split(/\r?\n/)[0]) || 0; } catch {} }
      if (!cdpPort) continue;
      try { page = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find(t => t.type === 'page'); } catch {}
    }
    if (!page) throw new Error('no page target');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error('CDP socket failed')); });

    let id = 0; const pend = new Map(); const reqUrls = new Map();
    const stats = { fake: 0, escaped: 0 }; const pageErrors = [];
    const send = (method, params = {}) => new Promise((r, j) => {
      const i = ++id;
      const t = setTimeout(() => { pend.delete(i); j(new Error('CDP timeout: ' + method)); }, 30000);
      pend.set(i, { r: v => { clearTimeout(t); r(v); }, j: e => { clearTimeout(t); j(e); } });
      try { ws.send(JSON.stringify({ id: i, method, params })); } catch (e) { pend.delete(i); clearTimeout(t); j(e); }
    });
    ws.onclose = () => { for (const [, p] of pend) p.j(new Error('CDP socket closed')); pend.clear(); };
    const ctx = { pid, profile, version, part, connectorUrl: connector, connectorPort, downloads, state: {}, pageErrors, noReinstall: false };
    let activeBreak = null; let breakDef = null; let scriptId = null;

    const fulfill = (requestId, body) => send('Fetch.fulfillRequest', { requestId, responseCode: 200,
      responseHeaders: CORS, body: Buffer.from(body).toString('base64') });
    ws.onmessage = async ev => {
      const m = JSON.parse(ev.data);
      if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(m.error.message)) : p.r(m.result); return; }
      if (m.method === 'Page.javascriptDialogOpening') { try { await send('Page.handleJavaScriptDialog', { accept: false }); } catch {} }
      else if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text);
      else if (m.method === 'Network.requestWillBeSent') reqUrls.set(m.params.requestId, m.params.request.url);
      else if (m.method === 'Network.loadingFailed') {
        const u = reqUrls.get(m.params.requestId) || '';
        let host = ''; try { host = new URL(u).host; } catch {}
        if (AI_HOSTS.includes(host) && /NAME_NOT_RESOLVED/i.test(m.params.errorText || '')) stats.escaped++;
      } else if (m.method === 'Fetch.requestPaused') {
        const { requestId, request } = m.params;
        try {
          const host = new URL(request.url).host;
          if (request.method === 'OPTIONS') await fulfill(requestId, '');
          else if (AI_HOSTS.includes(host)) {
            stats.fake++;
            await fulfill(requestId, JSON.stringify(aiBody(request.url, request.postData || '', { email: !(breakDef && breakDef.ai === 'noEmail') })));
          } else await fulfill(requestId, JSON.stringify(connectorReply(request.postData || '')));
        } catch {
          // An AI-host request we could not fulfil is not safe: count it as escaped.
          try { if (AI_HOSTS.includes(new URL(request.url).host)) stats.escaped++; } catch {}
          try { await send('Fetch.failRequest', { requestId, errorReason: 'Failed' }); } catch {}
        }
      }
    };

    const ev = async src => {
      const res = await send('Runtime.evaluate', { expression: src, awaitPromise: true, returnByValue: true });
      if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
      return res.result.value;
    };
    const waitApp = async what => {
      for (const end = Date.now() + 20000; Date.now() < end; await sleep(200)) {
        try { if (await ev(`typeof DATA === 'object' && document.readyState === 'complete'`)) return; } catch {}
      }
      throw new Error('app never ready: ' + what);
    };

    await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
    await send('Fetch.enable', { patterns: [...AI_HOSTS.map(h => ({ urlPattern: `https://${h}/*` })), { urlPattern: `${connector}/*` }] });
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
    // Headless clipboard fails with "Document is not focused" without focus emulation (D5 needs it).
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    try { await send('Browser.grantPermissions', { permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] }); } catch {}

    ctx.ev = ev;
    ctx.send = send;
    ctx.aiStats = () => ({ ...stats });
    ctx.snapshot = async () => ({ ls: await ev(`JSON.stringify(Object.fromEntries(Object.entries(localStorage)))`), state: JSON.parse(JSON.stringify(ctx.state)) });
    ctx.openOn = async iso => {
      if (scriptId) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: scriptId });
      scriptId = (await send('Page.addScriptToEvaluateOnNewDocument', { source: clockShim(iso) })).identifier;
      await send('Page.navigate', { url: pathToFileURL(target).href });
      await sleep(100);
      await waitApp(iso);
      if (breakDef && breakDef.js) {
        if (!ctx.noReinstall) await ev(breakDef.js);
        await ev(`typeof render === 'function' && render()`);
        assertMarker(await ev('window.__simBreak'), activeBreak);
      }
    };
    ctx.setBreak = async bid => {
      if (bid === null) { activeBreak = null; breakDef = null; return; }
      const { BREAKS } = await import('./breaks.mjs');
      if (!BREAKS[bid]) throw new Error('unknown break ' + bid);
      activeBreak = bid; breakDef = BREAKS[bid];
    };
    ctx.click = t => ev(`(() => { const t = ${JSON.stringify(t)};
      let el = null; try { el = document.querySelector(t); } catch {}
      if (!el) el = [...document.querySelectorAll('button,a,[role=button],label,summary,input[type=button],input[type=submit],li,div,span')]
        .find(e => (e.innerText || e.value || '').trim() === t);
      if (!el) throw new Error('click target not found: ' + t);
      el.click(); return true; })()`);
    ctx.type = (selector, text) => ev(`(() => { const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('type target not found: ' + ${JSON.stringify(selector)});
      el.focus(); el.value = ${JSON.stringify(text)};
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    ctx.stop = stop;

    if (seed) {
      await ctx.openOn(startDay);
      await ev(`(() => { const o = JSON.parse(${JSON.stringify(seed.ls)}); localStorage.clear(); for (const k in o) localStorage.setItem(k, o[k]); return true; })()`);
      ctx.state = JSON.parse(JSON.stringify(seed.state || {}));
    }
    await ctx.openOn(startDay);
    return ctx;
  } catch (e) {
    try { await stop(); } catch (e2) { e.message += ` (cleanup also failed: ${e2.message})`; }
    throw e;
  }
}
