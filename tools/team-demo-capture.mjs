#!/usr/bin/env node
// Per-step captures of the team demo for the look critic.
//   node tools/team-demo-capture.mjs <outdir> [--user-data-dir=<empty folder under the temp folder>]
// Runs tools/team-demo.mjs (--no-open: only the fake connector and the 127.0.0.1:8801 server), starts headless Chrome (1440x900)
// in a fresh profile under os.tmpdir(), and clicks the tracker's real buttons through CDP, the way tools/connector-e2e.mjs does.
// Writes 01-check-for-calls.png ... 06-how-its-built.png into <outdir>. Everything else lives in the temp folder and is removed.
// Loopback and fake only. Stops only the PIDs it started. NOT part of the distributable bundle.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { removeDir, waitForExit } from './e2e-cleanup.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv[2];
if (!outArg || outArg.startsWith('--')) { console.error('usage: node tools/team-demo-capture.mjs <outdir>'); process.exit(2); }
const outDir = resolve(outArg);
const inside = (parent, child) => { const r = relative(resolve(parent), resolve(child)); return r !== '' && !r.startsWith('..') && !isAbsolute(r); };

const udArg = process.argv.slice(3).find((a) => a.startsWith('--user-data-dir='));
const udDir = udArg ? udArg.slice('--user-data-dir='.length) : null;
if (udDir && (!inside(tmpdir(), udDir) || (existsSync(udDir) && readdirSync(udDir).length))) {
  console.error(`team-demo-capture: refusing --user-data-dir ${udDir}: it must be an empty folder under ${tmpdir()}`);
  process.exit(2);
}

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('team-demo-capture: could not find Chrome or Edge'); process.exit(2); }

const BASE = 'http://127.0.0.1:8801';
const tmp = mkdtempSync(join(tmpdir(), 'team-demo-capture-'));
const profile = udDir || join(tmp, 'chrome-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let launcher = null, chrome = null;
const kill = (c) => {
  if (!c || !c.pid || c.exitCode !== null || c.signalCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(c.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { c.kill('SIGKILL'); } catch {} }
};

async function startTeamDemo() {
  launcher = spawn(process.execPath, [join(root, 'tools', 'team-demo.mjs'), '--no-open'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  launcher.stdout.on('data', (d) => { out += d; }); launcher.stderr.on('data', (d) => { out += d; });
  for (const dl = Date.now() + 90000; Date.now() < dl && !/team-demo: ready/.test(out); await sleep(200)) {
    if (launcher.exitCode !== null) throw new Error('team-demo exited early: ' + out.slice(-400));
  }
  const m = out.match(/team-demo: ready (\S+) .*connector=(\S+)/);
  if (!m) throw new Error('team-demo did not become ready: ' + out.slice(-400));
  return { connector: m[2] };
}

async function main() {
  const demo = await startTeamDemo();
  const token = (await (await fetch(BASE + '/demo-connector-seed.js')).text()).match(/[0-9a-f]{64}/)[0];
  const seed = await (await fetch(BASE + '/demo-seed.js')).text();
  const port = 9900 + Math.floor(Math.random() * 90);
  chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
  let page = null;
  for (const dl = Date.now() + 20000; Date.now() < dl && !page; await sleep(150)) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page' && t.webSocketDebuggerUrl); } catch {}
  }
  if (!page) throw new Error('no debuggable page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('CDP socket failed')), { once: true }); });
  let mid = 0; const pending = new Map(); const errors = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') errors.push(String(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text).split('\n')[0]);
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++mid; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.delete(id)) rej(new Error(`CDP ${method} timed out`)); }, 60000);
  });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const ev = async (body) => {
    const r = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true,
      expression: `(async () => { try { return JSON.stringify(await (async () => { ${body} })()); } catch (e) { return JSON.stringify({ __err: String(e && e.stack || e) }); } })()` });
    if (r.exceptionDetails) throw new Error('eval threw: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    const v = JSON.parse(r.result.value);
    if (v && v.__err) throw new Error(v.__err.split('\n').slice(0, 3).join(' | '));
    return v;
  };
  const waitFor = async (expr, ms = 10000) => { for (const d = Date.now() + ms; Date.now() < d; await sleep(100)) { if (await ev(`return !!(${expr});`)) return true; } throw new Error('timed out waiting for: ' + expr); };
  const navigate = async (url, ready) => {
    await send('Page.navigate', { url });
    for (const d = Date.now() + 20000; Date.now() < d; await sleep(150)) {
      const r = await send('Runtime.evaluate', { returnByValue: true, expression: `location.href.startsWith(${JSON.stringify(url)}) && document.readyState === 'complete' && ${ready}` });
      if (r.result?.value === true) return;
    }
    throw new Error('page did not load: ' + url);
  };
  mkdirSync(outDir, { recursive: true });
  const shot = async (name) => {
    await sleep(400);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(outDir, name), Buffer.from(r.data, 'base64'));
    // v13 fingerprint + layout measures, printed per shot (v13 container is #app [data-osm]).
    const fp = await ev(`const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const tables = Array.from(document.querySelectorAll('.modal-backdrop table, .modal table')).map((t) => { let b = t; while (b && b.scrollWidth <= b.clientWidth && b !== document.body && !/auto|scroll/.test(getComputedStyle(b).overflowX)) b = b.parentElement; return {sw: t.scrollWidth, cw: t.clientWidth, box: b ? [b.scrollWidth, b.clientWidth] : null}; });
      return {osm: !!document.querySelector('#app [data-osm]'), h: Array.from(document.querySelectorAll('h1,h2,.section-title')).filter(vis).slice(0, 4).map((e) => e.textContent.replace(/\\s+/g, ' ').trim().slice(0, 50)), tables, counter: !!document.querySelector('.day-marker'), ranked: document.body.innerText.includes('Ranked by severity'), ofN: /\\d+ of \\d+/i.test(Array.from(document.querySelectorAll('.day-marker')).map((e) => e.textContent).join())};`).catch((e) => ({ err: String(e.message) }));
    console.log('captured ' + name + ' ' + JSON.stringify(fp));
  };
  const closeModals = `document.querySelectorAll('.modal-backdrop').forEach(e => e.remove()); return true;`;

  await navigate(BASE + '/osm-book-of-business-tracker-1.1.html', `typeof saveData === 'function'`);
  const seeded = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => { try { ${seed}\n; saveData(); return 'ok:' + DATA.customers.length; } catch (e) { return 'err:' + e.message; } })()` });
  if (!String(seeded.result?.value).startsWith('ok:')) throw new Error('seed failed: ' + seeded.result?.value);
  await ev(`saveConnectorSettings({url: ${JSON.stringify(demo.connector)}, token: ${JSON.stringify(token)}}); await checkConnectorHealth(); ui.view = 'today'; render(); return ui.connector.state;`);

  // 1. Check for calls: the preview, 5 matched and 1 no-account.
  await ev(`document.getElementById('btn-check-calls').click(); return true;`);
  await waitFor(`document.querySelector('.modal-backdrop [data-cp-on]')`);
  const t1 = await ev(`return Array.from(document.querySelectorAll('.modal-backdrop .section-title')).map(e => e.textContent.replace(/\\s+/g, ' ').trim());`);
  if (!(t1.length === 2 && /Matched.*\(5\)/.test(t1[0]) && /No account.*\(1\)/.test(t1[1]))) throw new Error('call preview is not 5 matched + 1 no-account: ' + JSON.stringify(t1));
  await shot('01-check-for-calls.png');
  await ev(closeModals);

  // 2. Read Gainsight accounts: the refresh list.
  await ev(`ui.view = 'today'; render(); document.getElementById('btn-refresh-gainsight').click(); return true;`);
  await waitFor(`document.querySelector('.modal-backdrop [data-gp-on]')`);
  await shot('02-read-accounts.png');
  await ev(closeModals);

  // 3. Check CSAT: the dry run, before Apply.
  await ev(`ui.view = 'today'; render(); document.getElementById('btn-settings').click(); return true;`);
  await waitFor(`document.getElementById('btn-check-survey-connector')`);
  await ev(`document.getElementById('btn-check-survey-connector').click(); return true;`);
  await waitFor(`document.getElementById('csat-apply')`);
  await shot('03-check-csat-dry-run.png');
  await ev(closeModals);

  // 4. Send to Gainsight: three queued items, one set to fail.
  await ev(`
    const cust = DATA.customers.find(c => c.gainsightId) || DATA.customers[0];
    const mk = (id, fields) => ({id, date: todayISO(), customerId: cust.id, customerName: cust.name, kind: 'At-Risk CTA', payload: 'p ' + id, status: 'queued', fields, externalId: null, sentAt: null, error: null});
    DATA.gainsightQueue = [mk('demo-ok-1', {ctaName: 'Renewal at risk', reason: 'Sponsor left', severity: 'low'}), mk('demo-ok-2', {ctaName: 'Low usage', reason: 'No logins in 30 days', severity: 'low'}), mk('demo-bad', {ctaName: 'Contract question', reason: 'Legal review', severity: 'low', forceFail: true})];
    saveData(); ui.view = 'risk'; render(); return true;`);
  await ev(`document.getElementById('btn-send-gainsight').click(); return true;`);
  await waitFor(`DATA.gainsightQueue.every(q => q.status !== 'queued')`);
  const q = await ev(`return DATA.gainsightQueue.map(x => x.status);`);
  if (q.filter((s) => s === 'sent').length !== 2 || q.filter((s) => s === 'failed').length !== 1) throw new Error('send result is not 2 sent + 1 failed: ' + JSON.stringify(q));
  // v13 Risk screen: bring the Gainsight queue (3 rows, 2 sent, 1 failed) into view; the Send toast stays as the result line.
  await ev(`const h = Array.from(document.querySelectorAll('h2,h3,.section-title')).find((e) => /Gainsight queue/.test(e.textContent)); if (h) h.scrollIntoView({block: 'start'}); return !!h;`);
  await shot('04-send-to-gainsight.png');

  // 5. Health: on the v13 shell the connector health line lives in the More menu's status row; open it so the line is on screen.
  await ev(`ui.view = 'today'; render(); return true;`);
  await waitFor(`/Connector: FAKE DATA/.test(document.querySelector('.v13-menu-status')?.textContent || '')`);
  await ev(`document.getElementById('toast').classList.remove('show'); document.querySelector('[data-v13-menu]').open = true; return true;`);
  await shot('05-health.png');

  // 6. How it is built.
  await navigate(BASE + '/built', `document.body.innerText.length > 50`);
  await shot('06-how-its-built.png');
  ws.close();
  if (errors.length) console.log(`team-demo-capture: ${errors.length} page exception(s): ${errors.slice(0, 3).join(' | ')}`);
}

let code = 1;
try { await main(); code = 0; }
catch (e) { console.error('team-demo-capture: ' + (e && e.message || e)); }
try { await fetch(BASE + '/__stop'); } catch {}
await waitForExit(launcher, 20000);
kill(launcher); kill(chrome);
await waitForExit(chrome, 5000);
await sleep(300);
const p = removeDir(tmp, 'temp folder'); if (p) console.error('team-demo-capture: ' + p);
process.exit(code);
