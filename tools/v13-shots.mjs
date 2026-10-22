#!/usr/bin/env node
// Side-by-side capture runner for the v13 look port. Opens one HTML file in a
// headless Chrome with a throwaway profile inside the OS temp folder (never
// Ian's own profile), optionally runs seed scripts, then for each step runs its
// JS, waits, and writes <out>/<name>.png. Prints one line per capture with the
// sha256 and the size of the bytes written.
//   node tools/v13-shots.mjs <file.html> --steps steps.json --out <dir>
//        [--seed demo-seed.js[,b.js]] [--w 1440] [--h 900] [--now 2026-10-01T12:00:00]
// steps.json: [{ "name": "desk", "js": "setView('desk')", "wait": 800, "full": false }]
// A step's js may return a string; it is printed next to the capture (use it
// to fingerprint what is on screen, e.g. the heading text).
// NOT part of the distributable bundle - dev tooling, like docs/.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => existsSync(p));
const args = process.argv.slice(2);
const flag = (n, f) => { const i = args.indexOf('--' + n); return i !== -1 && args[i + 1] ? args[i + 1] : f; };
const target = resolve(args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || '');
const steps = JSON.parse(readFileSync(resolve(flag('steps', '')), 'utf8'));
const outDir = resolve(flag('out', '.artifacts/v13'));
const seeds = (flag('seed', '') || '').split(',').filter(Boolean).map(p => readFileSync(resolve(p), 'utf8'));
const W = +flag('w', 1440), H = +flag('h', 900);
const NOW = flag('now', '');
if (!CHROME || !existsSync(target)) { console.error('Harness: missing chrome or target.'); process.exit(2); }
mkdirSync(outDir, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'v13-shots-'));
const PORT = 9400 + Math.floor(Math.random() * 400);
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
let code = 0;
try {
  let ws;
  for (let i = 0; i < 50 && !ws; i++) {
    await sleep(200);
    try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); const p = l.find(t => t.type === 'page'); if (p) ws = p.webSocketDebuggerUrl; } catch {}
  }
  if (!ws) throw new Error('no page target');
  const sock = new WebSocket(ws); await new Promise(r => sock.addEventListener('open', r));
  let id = 0; const pending = new Map();
  sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result?.result?.value; };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  if (NOW) await send('Page.addScriptToEvaluateOnNewDocument', { source:
    `(()=>{const T=new Date(${JSON.stringify(NOW)}).getTime(),R=Date,o=R.now();class D extends R{constructor(...a){super(...(a.length?a:[T+(R.now()-o)]))} static now(){return T+(R.now()-o)}};window.Date=D;})();` });
  await send('Page.navigate', { url: pathToFileURL(target).href });
  for (let i = 0; i < 100; i++) { await sleep(200); if (await ev('document.readyState') === 'complete') break; }
  await sleep(1500);
  for (const s of seeds) await ev(`(()=>{${s}\n;return 'ok'})()`);
  if (seeds.length) await sleep(800);
  for (const st of steps) {
    let note = '';
    try { note = String(await ev(`(async()=>{${st.js || ''}})()`) ?? ''); } catch (e) { note = 'STEP ERROR: ' + e.message.split('\n')[0]; code = 1; }
    await sleep(st.wait ?? 800);
    let clip;
    // A full-page capture starts from the top: a scroll left over from the previous step
    // would draw the sticky top bar part-way down the image.
    if (st.full) { await ev('window.scrollTo(0,0)'); await sleep(300); }
    if (st.full) { const h =await ev('Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)'); clip = { x: 0, y: 0, width: W, height: Math.min(h, 6000), scale: 1 }; }
    const shot = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip, captureBeyondViewport: true } : {}) });
    const buf = Buffer.from(shot.result.data, 'base64');
    const file = join(outDir, st.name + '.png'); writeFileSync(file, buf);
    console.log(`${st.name}  ${buf.length}B  sha256:${createHash('sha256').update(buf).digest('hex').slice(0, 12)}  ${note.slice(0, 160)}`);
  }
  sock.close();
} catch (e) { console.error('Harness: ' + e.message); code = 2; }
finally { proc.kill(); await sleep(500); try { rmSync(profile, { recursive: true, force: true }); } catch {} }
process.exit(code);
