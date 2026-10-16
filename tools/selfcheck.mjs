#!/usr/bin/env node
// Headless runner for the tracker's in-page self-check suite.
//   node tools/selfcheck.mjs [file.html] [--seed demo-seed.js[,second-seed.js]] [--fn runSelfChecks] [--expect 318] [--suite path|none] [--profile dir] [--verbose]
//   --suite: an external suite injected as an INLINE <script> after the page loads. Default: tools/selfchecks.js
//   when the target is osm-book-of-business-tracker-1.0.html, otherwise none (the guide keeps its in-page suite).
//   --profile: use <dir> (must be inside the OS temp folder) as the Chrome profile and do not delete it at exit.
//   --dump <file>: after the run, write window.__dump (a string) to <file> (must be inside the OS temp folder).
//   --serve <dir>: serve <dir> (must hold an index.html with the same sha256 as the positional file) from a GET-only server on 127.0.0.1 and run against http://127.0.0.1:<port>/ instead of file://.
//   --pre a.js[,b.js]: scripts registered with Page.addScriptToEvaluateOnNewDocument, so they run before the page's own scripts. window.__hostExpect = {protocol, host} is always registered first.
// Exit 0 when every check passes and the count matches --expect.
// NOT part of the distributable bundle — dev tooling, like docs/.

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename, dirname, sep } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { startStaticServer } from './static-server.mjs';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const positional = args.filter((a, i) =>
  !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));

const target = resolve(positional[0] || 'osm-book-of-business-tracker-1.0.html');
const fnName = flag('fn', 'runSelfChecks');
const expect = flag('expect', null);
const verbose = args.includes('--verbose');
const seedPaths = (flag('seed', '') || '').split(',').filter(Boolean);
const HERE = dirname(fileURLToPath(import.meta.url));
const SUITE_FOR = {
  'osm-book-of-business-tracker-1.0.html': join(HERE, 'selfchecks.js'),
  'osm-book-of-business-tracker-1.1.html': join(HERE, 'selfchecks-1.1.js'),
};
const suiteFlag = flag('suite', null);
const suitePath = suiteFlag === 'none' ? null : (suiteFlag ? resolve(suiteFlag) : (SUITE_FOR[basename(target)] || null));
const width = Number(flag('width', 1440));
const height = Number(flag('height', 900));
/* A RANDOM port per invocation. A fixed one lets a Chrome that outlived its
   parent — SIGKILL on the launcher does not reliably take down the browser
   process tree on Windows — keep listening, so the next run attaches to a stale
   page still holding the PREVIOUS build and reports checks against code that is
   no longer on disk. */
const PORT = Number(flag('port', 0)) || (9400 + Math.floor(Math.random() * 500));

if (!existsSync(target)) { console.error(`No such file: ${target}`); process.exit(2); }
const chrome = CHROME_CANDIDATES.find(p => existsSync(p));
if (!chrome) { console.error('Could not find Chrome or Edge.'); process.exit(2); }

const serveFlag = flag('serve', null);
let served = null;
if (serveFlag) {
  const dir = resolve(serveFlag), idx = join(dir, 'index.html');
  if (!existsSync(idx)) { console.error(`--serve: no index.html in ${dir}`); process.exit(2); }
  const h = f => createHash('sha256').update(readFileSync(f)).digest('hex');
  if (h(idx) !== h(target)) { console.error(`--serve: ${idx} is not the same build as ${target} (sha256 differs). Run: node tools/build-site.mjs`); process.exit(2); }
  served = await startStaticServer(dir);
  console.log(`serving ${dir} at ${served.url}`);
}
const targetUrl = served ? served.url : pathToFileURL(target).href;
const expectProtocol = served ? 'http:' : 'file:';
const expectHost = served ? new URL(served.url).host : '';
const preFiles = (flag('pre', '') || '').split(',').filter(Boolean);
for (const f of preFiles) if (!existsSync(resolve(f))) { console.error(`--pre: no such file: ${resolve(f)}`); process.exit(2); }
const profileFlag = flag('profile', null);
if (profileFlag) {
  const root = (resolve(tmpdir()) + sep).toLowerCase(), want = (resolve(profileFlag) + sep).toLowerCase();
  if (!want.startsWith(root)) { console.error('--profile must be a folder inside ' + tmpdir()); process.exit(2); }
}
const dumpFlag = flag('dump', null);
if (dumpFlag) {
  const root = (resolve(tmpdir()) + sep).toLowerCase(), want = resolve(dumpFlag).toLowerCase();
  if (!want.startsWith(root)) { console.error('--dump must be a file inside ' + tmpdir()); process.exit(2); }
}
const profile = profileFlag ? resolve(profileFlag) : mkdtempSync(join(tmpdir(), 'selfcheck-'));
const child = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--allow-file-access-from-files',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let chromeStderr = '';
child.stderr.on('data', d => { chromeStderr += String(d); });
const cleanup = () => {
  try { if (served) { served.server.closeAllConnections?.(); served.server.close(); } } catch {}
  try { child.kill('SIGKILL'); } catch {}
  try { if (!profileFlag) rmSync(profile, { recursive: true, force: true }); } catch {}
};
process.on('exit', cleanup);

// A harness that could not run exits 2 — never 1, which means "the app failed".
process.on('uncaughtException', e => {
  console.error('Harness failure: ' + (e && e.message || e));
  process.exit(2);
});
process.on('unhandledRejection', e => {
  console.error('Harness failure: ' + (e && e.message || e));
  process.exit(2);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function findPage(deadline, expectedUrl) {
  const expectedName = decodeURIComponent(expectedUrl.split('/').pop());
  let seen = [];
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const pages = list.filter(t => t.type === 'page' && t.webSocketDebuggerUrl);
      seen = pages.map(p => p.url);
      // Prefer a full-URL match — cheapest and least ambiguous when Chrome
      // reports one verbatim.
      const exact = pages.find(p => p.url && p.url.toLowerCase() === expectedUrl.toLowerCase());
      if (exact) return exact;
      // Chrome can normalise the drive letter or percent-encode parts of a
      // Windows file:// path, so fall back to comparing decoded basenames.
      const byName = pages.find(p => {
        try { return decodeURIComponent(p.url.split('/').pop()).toLowerCase() === expectedName.toLowerCase(); }
        catch { return false; }
      });
      if (byName) return byName;
    } catch { /* not up yet */ }
    await sleep(120);
  }
  // Taking "the first page we find" would happily attach to a stale Chrome
  // left over from a previous run — SIGKILL on the launcher doesn't reliably
  // take the browser process tree down on Windows — and silently report
  // checks against a PREVIOUS build that's no longer on disk. Require the URL
  // to match and say exactly what didn't, rather than guess.
  throw new Error(`No debuggable page matched the target.\n` +
    `  expected: ${expectedUrl}\n` +
    `  found: ${seen.length ? seen.join(', ') : '(none)'}\n` +
    chromeStderr.slice(-800));
}

function rpc(ws) {
  let id = 0;
  const pending = new Map();
  const failAll = why => {
    for (const [, p] of pending) p.reject(new Error(why));
    pending.clear();
  };
  ws.addEventListener('close', ev => failAll(`CDP socket closed (code ${ev.code}) — Chrome went away mid-run.`));
  ws.addEventListener('error', () => failAll('CDP socket error — Chrome went away mid-run.'));
  ws.addEventListener('message', ev => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve: res, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : res(msg.result);
    }
  });
  return (method, params = {}, timeoutMs = 120000) => new Promise((res, reject) => {
    const mid = ++id;
    const timer = setTimeout(() => {
      if (pending.delete(mid)) reject(new Error(`CDP ${method} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    pending.set(mid, {
      resolve: v => { clearTimeout(timer); res(v); },
      reject: e => { clearTimeout(timer); reject(e); },
    });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

const page = await findPage(Date.now() + 20000, 'about:blank');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', () => rej(new Error('CDP socket failed')), { once: true });
});
const send = rpc(ws);

const pageErrors = [];     // Runtime.exceptionThrown (counted before, and still decides the exit code)
const consoleErrors = [];  // console.error(...) calls
const logErrors = [];      // Log.entryAdded level "error": failed resource loads, security messages
const netFails = [];       // Network.loadingFailed, not cancelled
const reqUrl = new Map();
let ignoredFavicon = 0;
const isFavicon = u => /\/favicon\.ico(\?|$)/i.test(String(u || ''));
await send('Runtime.enable');
await send('Page.enable');
await send('Log.enable');
await send('Network.enable');
ws.addEventListener('message', ev => {
  let m; try { m = JSON.parse(ev.data); } catch { return; }
  const p = m.params || {};
  if (m.method === 'Runtime.exceptionThrown') {
    pageErrors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'unknown exception');
  } else if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') {
    consoleErrors.push((p.args || []).map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200));
  } else if (m.method === 'Log.entryAdded' && p.entry?.level === 'error') {
    if (isFavicon(p.entry.url) || isFavicon(p.entry.text)) ignoredFavicon++;
    else logErrors.push(`${p.entry.source}: ${String(p.entry.text).slice(0, 160)} ${p.entry.url || ''}`);
  } else if (m.method === 'Network.requestWillBeSent') {
    reqUrl.set(p.requestId, p.request?.url);
  } else if (m.method === 'Network.loadingFailed' && !p.canceled) {
    const u = reqUrl.get(p.requestId);
    if (isFavicon(u)) ignoredFavicon++; else netFails.push(`${u || p.requestId}: ${p.errorText}`);
  }
});

/* Pin the viewport instead of leaving it at whatever headless Chrome
   defaults to. Any check that reads getComputedStyle()/layout is a
   viewport-dependent assertion in disguise — an unpinned default can change
   between Chrome versions, differs from what a human sees in a real window,
   and previously made the guide's "quick mode hides guided chapters" check
   fail under headless Chrome's 782px default (a responsive @media rule, not
   a mode bug) while passing at 1440x900. Set explicitly, before the
   readiness poll, so nothing evaluates layout against an unchosen size. */
await send('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: 1, mobile: false,
});

// Page-start scripts first, THEN navigate: they run before any of the page's own scripts.
const pre = [`window.__hostExpect = ${JSON.stringify({ protocol: expectProtocol, host: expectHost })};`,
  ...preFiles.map(f => readFileSync(resolve(f), 'utf8'))];
for (const source of pre) await send('Page.addScriptToEvaluateOnNewDocument', { source });
const nav = await send('Page.navigate', { url: targetUrl });
if (nav.errorText) { console.error(`Page.navigate to ${targetUrl} failed: ${nav.errorText}`); process.exit(2); }

// For a page with an external suite, wait for the app, not for runSelfChecks.
const readyExpr = suitePath
  ? `location.href !== 'about:blank' && document.readyState === 'complete' && typeof saveData === 'function' && window.__appReadyDone !== false`
  : `location.href !== 'about:blank' && document.readyState === 'complete' && typeof window[${JSON.stringify(seedPaths.length ? 'runSelfChecks' : fnName)}] === 'function'`;
const readyDeadline = Date.now() + 30000;
let ready = false;
while (Date.now() < readyDeadline) {
  const r = await send('Runtime.evaluate', {
    expression: readyExpr,
    returnByValue: true,
  });
  if (r.result?.value === true) { ready = true; break; }
  await sleep(150);
}
if (!ready) {
  console.error(`window.${fnName}() never became available.`);
  if (pageErrors.length) console.error('Page errors:\n  ' + pageErrors.join('\n  '));
  process.exit(2);
}
const gotOrigin = (await send('Runtime.evaluate', { expression: 'location.protocol + "//" + location.host', returnByValue: true })).result?.value;
const wantOrigin = `${expectProtocol}//${expectHost}`;
console.log(`page origin: ${gotOrigin}`);
if (gotOrigin !== wantOrigin) { console.error(`page origin ${gotOrigin} is not the expected ${wantOrigin}`); process.exit(2); }

if (suitePath) {
  if (!existsSync(suitePath)) { console.error(`No such suite: ${suitePath}`); process.exit(2); }
  const src = readFileSync(suitePath, 'utf8');
  // INLINE, not src=: a check reads the non-src script text of the page.
  const inj = await send('Runtime.evaluate', { returnByValue: true, expression:
    `(() => { const s = document.createElement('script'); s.textContent = ${JSON.stringify(src)};
      document.body.appendChild(s); return typeof window.runSelfChecks === 'function'; })()` });
  if (inj.result?.value !== true) { console.error('Suite injection did not define window.runSelfChecks.'); process.exit(2); }
}

for (const seedPath of seedPaths) {
  if (!existsSync(resolve(seedPath))) { console.error(`No such file: ${resolve(seedPath)}`); process.exit(2); }
  const seedSrc = readFileSync(resolve(seedPath), 'utf8');
  const seeded = await send('Runtime.evaluate', {
    expression: `(() => { try { ${seedSrc}
      ; if (typeof saveData === 'function') saveData();
      return 'ok:' + (DATA.customers ? DATA.customers.length : 0);
    } catch (e) { return 'err:' + String(e && e.message || e); } })()`,
    returnByValue: true, awaitPromise: true,
  });
  if (seeded.exceptionDetails) {
    console.error('Seed failed to compile or threw: ' +
      (seeded.exceptionDetails.exception?.description || seeded.exceptionDetails.text || 'unknown'));
    process.exit(2);
  }
  const v = String(seeded.result?.value ?? '');
  if (!v.startsWith('ok:')) {
    console.error('Seed did not report success: ' +
      (v || '(no value returned — likely a syntax error in the seed file)'));
    process.exit(2);
  }
  console.log(`seeded ${v.slice(3)} accounts from ${seedPath}`);
}
if (seedPaths.length) {
  const has = await send('Runtime.evaluate', {
    expression: `typeof window[${JSON.stringify(fnName)}] === 'function'`, returnByValue: true });
  if (has.result?.value !== true) {
    console.error(`window.${fnName}() was not defined by the seed.`);
    process.exit(2);
  }
}

const run = await send('Runtime.evaluate', {
  expression: `(async () => {
    try {
      const r = await window[${JSON.stringify(fnName)}]();
      const list = Array.isArray(r) ? r : (r && r.results) || [];
      return JSON.stringify({ ok: true, total: list.length,
        passes: ${verbose ? 'true' : 'false'} ? list.filter(x => x.ok).map(x => ({ name: x.name, detail: String(x.detail || '').slice(0, 1000) })) : [],
        failed: list.filter(x => !x.ok).map(x => ({ name: x.name, detail: String(x.detail || '').slice(0, 300) })) });
    } catch (e) { return JSON.stringify({ ok: false, error: String(e && e.stack || e) }); }
  })()`,
  returnByValue: true, awaitPromise: true,
});

if (run.exceptionDetails) {
  console.error('Suite evaluation threw: ' +
    (run.exceptionDetails.exception?.description || run.exceptionDetails.text || 'unknown'));
  process.exit(2);
}

let out;
try { out = JSON.parse(run.result.value); }
catch { console.error('Suite returned an unreadable result:', run.result); process.exit(2); }
if (!out.ok) { console.error(`${fnName}() threw:\n${out.error}`); process.exit(1); }

if (out.total === 0) {
  console.error('The suite reported zero checks — it did not run. Treating as a harness failure.');
  process.exit(2);
}

const passed = out.total - out.failed.length;
if (verbose) for (const p of out.passes) console.log(`  PASS  ${p.name}${p.detail ? ` — ${p.detail}` : ''}`);
console.log(`${fnName}: ${passed}/${out.total} passed, ${out.failed.length} failed`);
for (const f of out.failed) console.log(`  FAIL  ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
const errTotal = pageErrors.length + consoleErrors.length + logErrors.length + netFails.length;
console.log(`console errors: ${errTotal} (exceptions ${pageErrors.length}, console.error ${consoleErrors.length}, log ${logErrors.length}, network ${netFails.length}; favicon requests ignored ${ignoredFavicon})`);
for (const e of [...consoleErrors, ...logErrors, ...netFails]) console.log('  ' + String(e).split('\n')[0]);
if (pageErrors.length) {
  console.log(`\n${pageErrors.length} console error(s) on load:`);
  for (const e of pageErrors) console.log('  ' + e.split('\n')[0]);
}

if (dumpFlag) {
  const d = await send('Runtime.evaluate', { expression: 'typeof window.__dump === "string" ? window.__dump : null', returnByValue: true });
  if (typeof d.result?.value !== 'string') { console.error('--dump: window.__dump was not set by the run.'); process.exit(2); }
  writeFileSync(resolve(dumpFlag), d.result.value);
}
let code = out.failed.length ? 1 : 0;
if (expect !== null && out.total !== Number(expect)) {
  console.log(`\nExpected ${expect} checks, the suite defines ${out.total}.`);
  code = 1;
}
if (pageErrors.length || errTotal > 0) code = 1;
process.exit(code);
