#!/usr/bin/env node
// Field-test harness: builds the 34-account OSM book from the 2026-09-22 field
// test THROUGH THE REAL UI (Excel import, Gainsight value import, backfill grid),
// layers on months of history, works the 10:00 call, then prints the baseline
// metrics each fix spec in docs/superpowers/specs/2026-09-22-fix-*.md names.
//
//   node tools/sim/run-field-test.mjs [--out metrics.json] [--keep]
//
// Throwaway Chrome profile per run — never touches a real book. Dates are
// relative to today, so metrics are stable day to day. Needs network once for
// the XLSX library the tracker loads from cdnjs (the Excel import uses it).
// Exit 0 = ran (read the metrics); exit 2 = harness failure. NOT part of the
// distributable bundle — dev tooling, like tools/inspect.mjs.
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf('--' + n); return i !== -1 ? (args[i + 1] || true) : null; };
const TARGET = resolve(HERE, '../../osm-book-of-business-tracker-1.0.html');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!CHROME) { console.error('Chrome/Edge not found'); process.exit(2); }

const PORT = 9400 + Math.floor(Math.random() * 500); // random: a stale Chrome on a fixed port would serve an old build
const profile = mkdtempSync(join(tmpdir(), 'fieldtest-'));
const child = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1440,900',
  pathToFileURL(TARGET).href], { stdio: 'ignore' });
const cleanup = () => {
  try { process.platform === 'win32' ? execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' }) : child.kill('SIGKILL'); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
};
const fail = m => { console.error('Harness failure: ' + m); cleanup(); process.exit(2); };
process.on('unhandledRejection', e => fail(e && e.message || e));
const sleep = ms => new Promise(r => setTimeout(r, ms));

let page;
for (const end = Date.now() + 20000; Date.now() < end && !page; await sleep(150)) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    page = list.find(t => t.type === 'page' && /osm-book-of-business-tracker/.test(decodeURIComponent(t.url)));
  } catch {}
}
if (!page) fail('tracker page never appeared');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error('CDP socket failed')); });
let id = 0; const pend = new Map(); const pageErrors = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(m.error.message)) : p.r(m.result); }
  if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text);
};
const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pend.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async src => {
  const res = await send('Runtime.evaluate', { expression: src, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
  return res.result.value;
};
await send('Runtime.enable');
for (const end = Date.now() + 20000; Date.now() < end; await sleep(200)) {
  if (await evaluate(`typeof DATA === 'object' && typeof XLSX !== 'undefined' && document.readyState === 'complete'`)) break;
}
if (!(await evaluate(`typeof XLSX !== 'undefined'`))) fail('XLSX library did not load (cdnjs unreachable?)');
if (await evaluate(`DATA.customers.length`)) fail('fresh profile is not empty');

const steps = readdirSync(join(HERE, 'steps')).filter(f => f.endsWith('.js')).sort();
let metrics = null;
for (const f of steps) {
  let v;
  try { v = await evaluate(readFileSync(join(HERE, 'steps', f), 'utf8')); }
  catch (e) { fail(`${f} threw: ${String(e.message).split('\n')[0]}`); }
  if (typeof v === 'string' && v.startsWith('FAIL')) fail(`${f}: ${v}`);
  if (f.startsWith('99-')) metrics = v;
  else console.log(`${f.padEnd(22)} ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 110)}`);
}
if (pageErrors.length) console.log('PAGE ERRORS:', pageErrors.length, '—', String(pageErrors[0]).split('\n')[0]);
const outPath = flag('out');
if (typeof outPath === 'string') writeFileSync(outPath, JSON.stringify(metrics, null, 2));
console.log(JSON.stringify(metrics, null, 1));
if (!flag('keep')) cleanup();
process.exit(0);
