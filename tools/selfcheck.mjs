#!/usr/bin/env node
// Headless runner for the tracker's in-page self-check suite.
//   node tools/selfcheck.mjs [file.html] [--seed demo-seed.js] [--fn runSelfChecks] [--expect 318]
// Exit 0 when every check passes and the count matches --expect.
// NOT part of the distributable bundle — dev tooling, like docs/.

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
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
const fnName = flag('fn', 'runSelfChecks');
const expect = flag('expect', null);
const PORT = Number(flag('port', 9333));

if (!existsSync(target)) { console.error(`No such file: ${target}`); process.exit(2); }
const chrome = CHROME_CANDIDATES.find(p => existsSync(p));
if (!chrome) { console.error('Could not find Chrome or Edge.'); process.exit(2); }

const profile = mkdtempSync(join(tmpdir(), 'selfcheck-'));
const child = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--allow-file-access-from-files',
  pathToFileURL(target).href,
], { stdio: ['ignore', 'ignore', 'pipe'] });

let chromeStderr = '';
child.stderr.on('data', d => { chromeStderr += String(d); });
const cleanup = () => {
  try { child.kill('SIGKILL'); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
};
process.on('exit', cleanup);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function findPage(deadline) {
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* not up yet */ }
    await sleep(120);
  }
  throw new Error('Chrome exposed no debuggable page.\n' + chromeStderr.slice(-800));
}

function rpc(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', ev => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve: res, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : res(msg.result);
    }
  });
  return (method, params = {}) => new Promise((res, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve: res, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

const page = await findPage(Date.now() + 20000);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', () => rej(new Error('CDP socket failed')), { once: true });
});
const send = rpc(ws);

const pageErrors = [];
await send('Runtime.enable');
ws.addEventListener('message', ev => {
  let m; try { m = JSON.parse(ev.data); } catch { return; }
  if (m.method === 'Runtime.exceptionThrown') {
    pageErrors.push(m.params.exceptionDetails?.exception?.description
      || m.params.exceptionDetails?.text || 'unknown exception');
  }
});

const readyDeadline = Date.now() + 30000;
let ready = false;
while (Date.now() < readyDeadline) {
  const r = await send('Runtime.evaluate', {
    expression: `document.readyState === 'complete' && typeof window[${JSON.stringify(fnName)}] === 'function'`,
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

const seedPath = flag('seed', null);
if (seedPath) {
  const seedSrc = readFileSync(resolve(seedPath), 'utf8');
  const seeded = await send('Runtime.evaluate', {
    expression: `(() => { try { ${seedSrc}
      ; if (typeof saveData === 'function') saveData();
      return 'ok:' + (DATA.customers ? DATA.customers.length : 0);
    } catch (e) { return 'err:' + String(e && e.message || e); } })()`,
    returnByValue: true, awaitPromise: true,
  });
  const v = String(seeded.result?.value || '');
  if (v.startsWith('err:')) { console.error('Seed failed: ' + v.slice(4)); process.exit(2); }
  console.log(`seeded ${v.slice(3)} accounts from ${seedPath}`);
}

const run = await send('Runtime.evaluate', {
  expression: `(() => {
    try {
      const r = window[${JSON.stringify(fnName)}]();
      const list = Array.isArray(r) ? r : (r && r.results) || [];
      return JSON.stringify({ ok: true, total: list.length,
        failed: list.filter(x => !x.ok).map(x => ({ name: x.name, detail: String(x.detail || '').slice(0, 300) })) });
    } catch (e) { return JSON.stringify({ ok: false, error: String(e && e.stack || e) }); }
  })()`,
  returnByValue: true, awaitPromise: true,
});

let out;
try { out = JSON.parse(run.result.value); }
catch { console.error('Suite returned an unreadable result:', run.result); process.exit(2); }
if (!out.ok) { console.error(`${fnName}() threw:\n${out.error}`); process.exit(1); }

const passed = out.total - out.failed.length;
console.log(`${fnName}: ${passed}/${out.total} passed, ${out.failed.length} failed`);
for (const f of out.failed) console.log(`  FAIL  ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
if (pageErrors.length) {
  console.log(`\n${pageErrors.length} console error(s) on load:`);
  for (const e of pageErrors) console.log('  ' + e.split('\n')[0]);
}

let code = out.failed.length ? 1 : 0;
if (expect !== null && out.total !== Number(expect)) {
  console.log(`\nExpected ${expect} checks, the suite defines ${out.total}.`);
  code = 1;
}
if (pageErrors.length) code = 1;
process.exit(code);
