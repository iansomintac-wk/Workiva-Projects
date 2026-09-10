#!/usr/bin/env node
// Headless inspector for the tracker: seeds a book, switches to a named view,
// and captures what actually rendered — text, a full-page screenshot, and a
// small meta summary (headings, button labels, console errors).
//   node tools/inspect.mjs <file.html> --seed <seed.js> --view <viewname> --out <dir>
//        [--width 1440] [--height 900] [--prefix <name>]
// Exit 0 on success. Exit 2 on any harness failure (bad target, seed threw,
// Chrome not found, page URL mismatch, etc.) — never 1, which would mean "the
// app itself failed" rather than "the tool could not inspect it".
// NOT part of the distributable bundle — dev tooling, like docs/.

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

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
const seedPath = flag('seed', null);
const viewName = flag('view', null);
const panelId = flag('panel', null);
const panelTab = flag('panel-tab', null);
const outDir = flag('out', null);
const width = Number(flag('width', 1440));
const height = Number(flag('height', 900));
const prefix = flag('prefix', viewName);

if (!existsSync(target)) { console.error(`No such file: ${target}`); process.exit(2); }
if (!seedPath) { console.error('Missing --seed <seed.js>'); process.exit(2); }
if (!existsSync(resolve(seedPath))) { console.error(`No such seed file: ${seedPath}`); process.exit(2); }
if (!viewName) { console.error('Missing --view <viewname>'); process.exit(2); }
if (!outDir) { console.error('Missing --out <dir>'); process.exit(2); }
mkdirSync(outDir, { recursive: true });

const chrome = CHROME_CANDIDATES.find(p => existsSync(p));
if (!chrome) { console.error('Could not find Chrome or Edge.'); process.exit(2); }

/* A RANDOM port per invocation. A fixed one lets a Chrome that outlived its
   parent — SIGKILL on the launcher does not reliably take down the browser
   process tree on Windows — keep listening, so the next run attaches to a stale
   page still holding the PREVIOUS build and reports results against code that
   is no longer on disk. */
const PORT = Number(flag('port', 0)) || (9400 + Math.floor(Math.random() * 500));

const targetUrl = pathToFileURL(target).href;
const profile = mkdtempSync(join(tmpdir(), 'inspect-'));
const child = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--allow-file-access-from-files',
  targetUrl,
], { stdio: ['ignore', 'ignore', 'pipe'] });

let chromeStderr = '';
child.stderr.on('data', d => { chromeStderr += String(d); });
const cleanup = () => {
  try { child.kill('SIGKILL'); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
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
  // results against a PREVIOUS build that's no longer on disk. Require the URL
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

// Verifying the attached page's URL matches the target file BEFORE doing
// anything else. A fixed/wrong page here would report results against code
// that isn't the file we were asked to inspect.
const page = await findPage(Date.now() + 20000, targetUrl);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', () => rej(new Error('CDP socket failed')), { once: true });
});
const send = rpc(ws);

const pageErrors = [];
await send('Runtime.enable');
await send('Page.enable');
ws.addEventListener('message', ev => {
  let m; try { m = JSON.parse(ev.data); } catch { return; }
  if (m.method === 'Runtime.exceptionThrown') {
    pageErrors.push(m.params.exceptionDetails?.exception?.description
      || m.params.exceptionDetails?.text || 'unknown exception');
  }
});

// Viewport, applied before anything else evaluates layout-dependent state.
await send('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: 1, mobile: false,
});

const readyDeadline = Date.now() + 30000;
let ready = false;
while (Date.now() < readyDeadline) {
  const r = await send('Runtime.evaluate', {
    expression: `document.readyState === 'complete' && typeof window.render === 'function' && typeof window.saveData === 'function'`,
    returnByValue: true,
  });
  if (r.result?.value === true) { ready = true; break; }
  await sleep(150);
}
if (!ready) {
  console.error('window.render()/saveData() never became available.');
  if (pageErrors.length) console.error('Page errors:\n  ' + pageErrors.join('\n  '));
  process.exit(2);
}

// Seed the book. Exit 2 (harness failure, not "the app failed") on any throw —
// checked via exceptionDetails, not just the returned value, since a seed can
// throw synchronously without ever producing a return value to inspect.
const seedSrc = readFileSync(resolve(seedPath), 'utf8');
const seeded = await send('Runtime.evaluate', {
  expression: `(() => { try { ${seedSrc}
    ; if (typeof saveData === 'function') saveData();
    return 'ok:' + (typeof DATA !== 'undefined' && DATA.customers ? DATA.customers.length : 0);
  } catch (e) { return 'err:' + String(e && e.stack || e); } })()`,
  returnByValue: true, awaitPromise: true,
});
if (seeded.exceptionDetails) {
  console.error('Seed failed to compile or threw: ' +
    (seeded.exceptionDetails.exception?.description || seeded.exceptionDetails.text || 'unknown'));
  process.exit(2);
}
const seedResult = String(seeded.result?.value ?? '');
if (!seedResult.startsWith('ok:')) {
  console.error('Seed threw: ' +
    (seedResult || '(no value returned — likely a syntax error in the seed file)'));
  process.exit(2);
}
console.log(`seeded ${seedResult.slice(3)} accounts from ${seedPath}`);

// Switch views, then wait for the DOM to settle: poll the container's
// innerText.length until two consecutive 250ms samples agree, capped at 5s.
const switchResult = await send('Runtime.evaluate', {
  expression: `(() => { try {
      ui.view = ${JSON.stringify(viewName)};
      ${panelId ? `ui.openCustomerId = ${JSON.stringify(panelId)};` : ''}
      ${panelTab ? `ui.panelTab = ${JSON.stringify(panelTab)};` : ''}
      render();
      ${panelId ? `if(!DATA.customers.some(c => c.id === ${JSON.stringify(panelId)})) return 'err:no customer with id ' + ${JSON.stringify(panelId)} + ' in this book';` : ''}
      return 'ok';
    } catch (e) { return 'err:' + String(e && e.stack || e); } })()`,
  returnByValue: true, awaitPromise: true,
});
if (switchResult.exceptionDetails) {
  console.error('View switch threw: ' +
    (switchResult.exceptionDetails.exception?.description || switchResult.exceptionDetails.text || 'unknown'));
  process.exit(2);
}
const switchValue = String(switchResult.result?.value ?? '');
if (!switchValue.startsWith('ok')) {
  console.error('View switch failed: ' + switchValue);
  process.exit(2);
}

// The app's own markup names exactly one element it renders into:
//   <div class="app" id="app">Loading…</div>  →  render() writes to #app.
// That is the main content container; fall back to <body> and say so.
const containerProbe = await send('Runtime.evaluate', {
  expression: `document.getElementById('app') ? '#app' : null`,
  returnByValue: true,
});
let containerSelector = containerProbe.result?.value;
let usedFallback = false;
if (!containerSelector) { containerSelector = 'body'; usedFallback = true; }

async function sampleTextLength() {
  const r = await send('Runtime.evaluate', {
    expression: `(() => { const el = document.querySelector(${JSON.stringify(containerSelector)}) || document.body; return el.innerText.length; })()`,
    returnByValue: true,
  });
  return r.result?.value ?? 0;
}

const settleDeadline = Date.now() + 5000;
let prevLen = await sampleTextLength();
while (Date.now() < settleDeadline) {
  await sleep(250);
  const len = await sampleTextLength();
  if (len === prevLen) break;
  prevLen = len;
}

// Gather text + structural summary from the container.
const summary = await send('Runtime.evaluate', {
  expression: `(() => {
    const el = document.querySelector(${JSON.stringify(containerSelector)}) || document.body;
    const text = el.innerText || '';
    const headings = [...el.querySelectorAll('h1,h2,h3,h4,h5')].map(h => h.textContent.trim()).filter(Boolean);
    const seenBtn = new Set();
    const buttonLabels = [];
    for (const b of el.querySelectorAll('button')) {
      const t = b.textContent.replace(/\\s+/g, ' ').trim();
      if (!t || seenBtn.has(t)) continue;
      seenBtn.add(t);
      buttonLabels.push(t);
      if (buttonLabels.length >= 60) break;
    }
    return JSON.stringify({ text, textLength: text.length, headings, buttonLabels });
  })()`,
  returnByValue: true, awaitPromise: true,
});
if (summary.exceptionDetails) {
  console.error('Capture threw: ' +
    (summary.exceptionDetails.exception?.description || summary.exceptionDetails.text || 'unknown'));
  process.exit(2);
}
let captured;
try { captured = JSON.parse(summary.result.value); }
catch { console.error('Capture returned an unreadable result:', summary.result); process.exit(2); }

// Full-page screenshot.
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
const pngBuffer = Buffer.from(shot.data, 'base64');

const outTxtPath = join(outDir, `${prefix}.txt`);
const outPngPath = join(outDir, `${prefix}.png`);
const outMetaPath = join(outDir, `${prefix}.meta.json`);

writeFileSync(outTxtPath, captured.text, 'utf8');
writeFileSync(outPngPath, pngBuffer);
const meta = {
  view: viewName,
  panel: panelId,
  panelTab,
  seed: seedPath,
  viewport: { width, height, deviceScaleFactor: 1 },
  textLength: captured.textLength,
  screenshotBytes: pngBuffer.length,
  containerSelector: usedFallback ? `${containerSelector} (fallback — no #app found)` : containerSelector,
  headings: captured.headings,
  buttonLabels: captured.buttonLabels,
  errors: pageErrors,
};
writeFileSync(outMetaPath, JSON.stringify(meta, null, 2), 'utf8');

console.log(`wrote ${outTxtPath} (${captured.textLength} chars)`);
console.log(`wrote ${outPngPath} (${pngBuffer.length} bytes)`);
console.log(`wrote ${outMetaPath}`);
if (pageErrors.length) {
  console.log(`\n${pageErrors.length} console error(s) captured:`);
  for (const e of pageErrors) console.log('  ' + e.split('\n')[0]);
}

process.exit(0);
