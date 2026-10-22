#!/usr/bin/env node
// S3 measurement: the Risk deck's last-case reserve, and whether the rail reaches the last case when the reserve has zero slack.
//   node tools/rail-reserve-measure.mjs [file.html] [--seed demo-seed.js] [--heights 900,1400,1800,2200] [--width 1440] [--dpr 1]
// Headless Chrome on a fresh temp --user-data-dir, CDP only. http/https requests are blocked (no network). Read-only: the seed writes
// to this temp profile's localStorage only. Prints one JSON line per viewport height.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const flag = (n, f) => { const i = args.indexOf('--' + n); return i !== -1 && args[i + 1] ? args[i + 1] : f; };
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const target = resolve(positional[0] || 'osm-book-of-business-tracker-1.1.html');
const seedPath = resolve(flag('seed', 'demo-seed.js'));
const heights = flag('heights', '900,1400,1800,2200').split(',').map(Number);
const width = Number(flag('width', 1440)), dpr = Number(flag('dpr', 1));
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
  .find(p => existsSync(p));
if (!chrome || !existsSync(target) || !existsSync(seedPath)) { console.error('Harness: missing chrome, target or seed.'); process.exit(2); }
const PORT = 9400 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), 'rail-reserve-'));
const child = spawn(chrome, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const done = code => { try { child.kill('SIGKILL'); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(code); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let page;
for (let i = 0; i < 150 && !page; i++) {
  try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page' && t.webSocketDebuggerUrl); } catch {}
  if (!page) await sleep(120);
}
if (!page) { console.error('Harness: no page.'); done(2); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
let id = 0; const pending = new Map();
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };

await send('Network.enable');
await send('Network.setBlockedURLs', { urls: ['http://*', 'https://*'] });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height: heights[0], deviceScaleFactor: dpr, mobile: false });
await send('Page.navigate', { url: pathToFileURL(target).href });
for (let i = 0; i < 200 && !(await ev(`document.readyState === 'complete' && typeof saveData === 'function'`)); i++) await sleep(150);
const seeded = await ev(`(() => { try { ${readFileSync(seedPath, 'utf8')}
  ; saveData(); return 'ok:' + DATA.customers.length; } catch (e) { return 'err:' + e.message; } })()`);
if (!String(seeded).startsWith('ok:')) { console.error('seed: ' + seeded); done(2); }

const MEASURE = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  scrollTo(0, 0);
  if (!window.__confirmed) { window.__confirmed = true; saveData = function(){ return true; }; /* in memory only, as tools/d8l8-probe.js does */
    buildRiskCases(buildRiskHubList()).forEach(k => setRiskVerdict(k.items[0], 'confirmed', 'short reason'));
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); }
  ui.view = 'risk'; ui.riskFocusId = null; render(); await frame(); await frame();
  dispatchEvent(new Event('resize')); await frame(); await frame();
  const track = document.querySelector('.rk3-track'), host = track && track.parentElement;
  if (!host || !host._deckCards || host.classList.contains("rk3--flat")) return {bound: false, track: !!track, host: !!host, deck: !!(host && host._deckCards), flat: !!(host && host.classList.contains("rk3--flat")), cases: buildRiskCases(buildRiskHubList()).length, view: ui.view};
  const n = host._deckCards.length, lastCard = host._deckCards[n - 1], lastId = lastCard.dataset.riskCase;
  const trackTop = track.getBoundingClientRect().top + scrollY;
  const below = Math.round((document.documentElement.scrollHeight - (track.getBoundingClientRect().bottom + scrollY)) * 100) / 100;
  const need = host._deckOffsetFor(n - 1);
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const reserveTail = track.offsetHeight - need;           // track height left after the last case's offset
  const slack = (maxScroll - (trackTop + need));           // scroll left past the last offset: <0 means unreachable
  const btn = document.querySelector('[data-spine-to="rk-c-' + lastId + '"]');
  if (btn) btn.click();
  let prev = null, same = 0; const t0 = Date.now();
  while (Date.now() - t0 < 4000) { await sleep(100); const k = scrollY + '|' + document.getAnimations().length; same = k === prev ? same + 1 : 0; prev = k; if (same >= 3 && document.getAnimations().length === 0) break; }
  await sleep(300);
  const trN = track.getBoundingClientRect().top;
  return {bound: true, cases: n, innerHeight, devicePixelRatio, trackHeight: track.offsetHeight, trackTop: +trackTop.toFixed(2), below,
    need: +need.toFixed(2), maxScroll: +maxScroll.toFixed(2), slack: +slack.toFixed(2), reserveTail: +reserveTail.toFixed(2),
    railClickScrollY: +scrollY.toFixed(2), gapToSlot: +(need + trN).toFixed(3), focusIsLast: ui.riskFocusId === lastId,
    lastBehind: lastCard.classList.contains('is-behind'), lastOpacity: +getComputedStyle(lastCard).opacity, hasRailButton: !!btn};
})()`;
for (const h of heights) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: h, deviceScaleFactor: dpr, mobile: false });
  await sleep(300);
  console.log(JSON.stringify({ viewport: `${width}x${h}`, ...(await ev(MEASURE)) }));
}
done(0);
