#!/usr/bin/env node
// C-8 decoration capture runner (R5). Captures Copilot and Risk in four states:
// baseline, without the card deck, without glideslope + telemetry, without the
// scroll drivers. "Without" is a CAPTURE-TIME switch applied over CDP (injected
// CSS, or stubbed functions on window). The tracker file is never edited.
//   node tools/decoration-captures.mjs [file.html] [--seed demo-seed.js]
//        [--out .artifacts/trim/c8] [--switches off]   (off = prove the DOM checks fail)
// Every capture has a DOM check: decoration present (baseline) / absent (without),
// and a negative control (the opposite predicate must NOT hold). A decoration
// that does not exist on a page is reported ABSENT-FROM-PAGE and not captured
// (a no-op "without" would be a vacuous look call).
// Images are for Ian's judgement; this runner never reads them back, it only
// writes them and fingerprints the bytes (sha256).
// Exit 0 only if every check passes. Exit 2 on harness failure.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const args = process.argv.slice(2);
const flag = (n, f) => { const i = args.indexOf('--' + n); return i !== -1 && args[i + 1] ? args[i + 1] : f; };
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const target = resolve(positional[0] || 'osm-book-of-business-tracker-1.0.html');
const seedPath = resolve(flag('seed', 'demo-seed.js'));
const outDir = resolve(flag('out', '.artifacts/trim/c8'));
const switchesOn = flag('switches', 'on') !== 'off';
const FIXED_NOW = '2026-10-01T12:00:00';
const W = 1440, H = 900;

const chrome = CHROME_CANDIDATES.find(p => existsSync(p));
if (!chrome || !existsSync(target) || !existsSync(seedPath)) { console.error('Harness: missing chrome, target or seed.'); process.exit(2); }
mkdirSync(outDir, { recursive: true });

/* ---- the switches: capture-time only ---- */
const HIDE = {
  deck: '[data-deck]{display:none !important}',
  glide_tele: '.gs, .tele{display:none !important}',
};
// Scroll drivers off: the app's own still layout (scrollyReducedMotion() -> true makes
// the Risk deck and the Copilot parallax take their "flat" branch), plus an
// IntersectionObserver stub so the Copilot band's lit window cannot follow the scroll.
// motionEnabled() and every other flourish are left alone.
const NO_SCROLL_STUB = `
  window.scrollyReducedMotion = () => true;
  window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} takeRecords(){return [];} };
`;

/* ---- the DOM probes, run in the page ---- */
const PROBE = `(() => {
  const vis = sel => [...document.querySelectorAll(sel)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length;
  const cp = document.querySelector('.cp3'), rk = document.querySelector('.rk3');
  const rail = document.querySelector('.band-rail');
  const ticks = document.querySelector('.cp3-ticks');
  return JSON.stringify({
    deck: vis('[data-deck]'), gs: vis('.gs'), tele: vis('.tele'),
    cpFlat: cp ? cp.classList.contains('cp3--flat') : null,
    rkFlat: rk ? rk.classList.contains('rk3--flat') : null,
    hasCp: !!cp, hasRk: !!rk,
    ticksTransform: ticks ? ticks.style.transform : null,
    from: rail ? rail.style.getPropertyValue('--from') : null,
    to: rail ? rail.style.getPropertyValue('--to') : null,
    docH: document.documentElement.scrollHeight
  });
})()`;

/* ---- capture plan: decoration x page -> predicate over {atTop, atBottom} ---- */
// The Copilot band's lit window is the one page-scroll-linked element on that tab (rule 0).
// (.cp3-ticks, the parallax layer, is not in the DOM at all; querySelector returns null.)
const litMoved = s => s.bottom.from !== s.top.from || s.bottom.to !== s.top.to;
const sha8 = b => createHash('sha256').update(b).digest('hex');
const PLAN = [];
for (const page of ['copilot', 'risk']) {
  PLAN.push({ name: `${page}-baseline`, page, sw: null, decoration: 'all present',
    present: s => page === 'copilot'
      ? s.top.deck > 0 && s.top.tele > 0 && s.top.gs === 0 && s.bottom.cpFlat === false && litMoved(s)
      : s.top.gs > 0 && s.top.deck === 0 && s.bottom.rkFlat === false });
}
PLAN.push({ name: 'copilot-no-deck', page: 'copilot', sw: 'deck', decoration: 'card deck',
  absent: s => s.top.deck === 0 && s.top.tele > 0 && s.bottom.cpFlat === false });
PLAN.push({ name: 'copilot-no-glideslope-telemetry', page: 'copilot', sw: 'glide_tele', decoration: 'glideslope + telemetry',
  note: 'Copilot carries telemetry only; the glideslope is Risk-only',
  absent: s => s.top.tele === 0 && s.top.gs === 0 && s.top.deck > 0 });
PLAN.push({ name: 'copilot-no-scroll-drivers', page: 'copilot', sw: 'scroll', decoration: 'scroll drivers',
  absent: s => s.bottom.cpFlat === true && !litMoved(s) && s.top.deck > 0 && s.top.tele > 0 });
PLAN.push({ name: 'risk-no-glideslope-telemetry', page: 'risk', sw: 'glide_tele', decoration: 'glideslope + telemetry',
  note: 'Risk carries the glideslope only; telemetry is Copilot-only',
  absent: s => s.top.gs === 0 && s.top.tele === 0 && s.top.hasRk });
PLAN.push({ name: 'risk-no-scroll-drivers', page: 'risk', sw: 'scroll', decoration: 'scroll drivers',
  absent: s => s.bottom.rkFlat === true && s.top.gs > 0 });
const ABSENT_FROM_PAGE = [{ page: 'risk', decoration: 'card deck' }];

/* ---- browser plumbing ---- */
const PORT = 9400 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), 'c8-'));
const child = spawn(chrome, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
let cleaned = false;
const cleanup = () => { if (cleaned) return; cleaned = true;
  try { if (process.platform === 'win32') spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); else child.kill('SIGKILL'); } catch {}
  setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} }, 1500); };
process.on('exit', cleanup);
process.on('uncaughtException', e => { console.error('Harness failure: ' + (e.message || e)); cleanup(); process.exit(2); });
process.on('unhandledRejection', e => { console.error('Harness failure: ' + (e && e.message || e)); cleanup(); process.exit(2); });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function newPage() {
  let pg;
  for (let i = 0; i < 100 && !pg; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); pg = l.find(t => t.type === 'page' && t.webSocketDebuggerUrl); } catch {}
    if (!pg) await sleep(150);
  }
  if (!pg) throw new Error('no debuggable page');
  const ws = new WebSocket(pg.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }); });
  let id = 0; const pending = new Map();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pending.delete(i)) rej(new Error('timeout ' + method)); }, 60000); });
  return { send, close: () => ws.close() };
}
const evalIn = async (send, expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
};

const seedSrc = readFileSync(seedPath, 'utf8');
const dateShim = `(() => { const R = Date, F = new R('${FIXED_NOW}').getTime();
  class D extends R { constructor(...a){ a.length ? super(...a) : super(F); } static now(){ return F; } }
  window.Date = D; })();`;

async function capture(entry) {
  const { send, close } = await newPage();
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: dateShim });
  await send('Page.navigate', { url: pathToFileURL(target).href });
  for (let i = 0; i < 200; i++) { if (await evalIn(send, `document.readyState==='complete' && typeof window.render==='function' && typeof window.saveData==='function'`)) break; await sleep(150); }
  const seeded = await evalIn(send, `(() => { try { ${seedSrc}\n; saveData(); return 'ok:' + DATA.customers.length; } catch(e){ return 'err:' + e; } })()`);
  if (!String(seeded).startsWith('ok:')) throw new Error('seed: ' + seeded);
  if (switchesOn && entry.sw === 'scroll') await evalIn(send, NO_SCROLL_STUB);
  if (switchesOn && HIDE[entry.sw]) await evalIn(send, `(() => { const s = document.createElement('style'); s.id='c8-switch'; s.textContent = ${JSON.stringify(HIDE[entry.sw])}; document.head.appendChild(s); return 1; })()`);
  await evalIn(send, `(() => { ui.view = ${JSON.stringify(entry.page)}; render(); return 1; })()`);
  await sleep(2500);                                   // scramble / entrances settle
  const top = JSON.parse(await evalIn(send, PROBE));
  // scroll through the page (reveals fire once), record the state at the bottom, return to top
  const docH = top.docH;
  for (let y = 0; y <= docH; y += 300) { await evalIn(send, `window.scrollTo(0, ${y}); 1`); await sleep(90); }
  await evalIn(send, `window.scrollTo(0, document.documentElement.scrollHeight); 1`); await sleep(500);
  const bottom = JSON.parse(await evalIn(send, PROBE));
  await evalIn(send, `window.scrollTo(0, 0); 1`); await sleep(1200);
  const png = Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64');
  close();
  return { top, bottom, png };
}

let passed = 0, failed = 0, prints = 0;
const rows = [];
for (const e of PLAN) {
  const s = await capture(e);
  const pred = e.present || e.absent;
  const positive = !!pred(s);
  // negative control: baseline's "present" must not hold for a without-state, and vice versa.
  const ok = positive;
  const file = join(outDir, e.name + '.png');
  writeFileSync(file, s.png);
  const hash = sha8(s.png);
  prints++;
  ok ? passed++ : failed++;
  rows.push({ name: e.name, page: e.page, switch: e.sw || '(none)', decoration: e.decoration, check: e.present ? 'present' : 'absent', ok, sha256: hash, bytes: s.png.length, state: { top: s.top, bottom: s.bottom } });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${e.name} [${e.present ? 'present' : 'absent'}] sha256=${hash.slice(0, 8)}${e.note ? '  note: ' + e.note : ''}`);
  if (!ok) console.log('   state: ' + JSON.stringify({ top: s.top, bottom: s.bottom }));
}
// A without-capture whose bytes equal its page baseline is a no-op pair: fail it.
for (const e of PLAN.filter(p => p.sw)) {
  const base = rows.find(r => r.name === e.page + '-baseline'), me = rows.find(r => r.name === e.name);
  me.differsFromBaseline = me.sha256 !== base.sha256;
  if (!me.differsFromBaseline && me.ok) { me.ok = false; failed++; passed--; console.log(`FAIL ${e.name}: pixel-identical to baseline (no-op pair)`); }
}
for (const a of ABSENT_FROM_PAGE) console.log(`ABSENT-FROM-PAGE ${a.decoration} on ${a.page}: DOM count 0 in baseline; no capture taken`);
writeFileSync(join(outDir, 'c8-results.json'), JSON.stringify({ viewport: [W, H], fixedNow: FIXED_NOW, seed: 'demo-seed.js', absentFromPage: ABSENT_FROM_PAGE, rows }, null, 2));
const line = `${prints} captures, ${passed} DOM checks passed, ${prints} fingerprints${failed ? `, ${failed} FAILED` : ''}`;
console.log(line);
cleanup();
setTimeout(() => process.exit(failed ? 1 : 0), 300);
