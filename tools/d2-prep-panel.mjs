// Dev tooling (not part of the bundle): D2 call-prep transcript box check and captures (1.1).
// usage: node tools/d2-prep-panel.mjs --check      -> prints one D2PREP-CHECK line, exit 0 only if ok
//        node tools/d2-prep-panel.mjs --captures   -> sim-runs/d2-prep/{orion-10-21,fixture3,no-transcript}.{png,txt}
// Throwaway osmsim-* profiles only (launch()), removed by ctx.stop() in a finally. Synthetic data only.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { resolveUnderSimRuns } from './sim/osm-day/lib/outdir.mjs';
import { launch } from './sim/osm-day/lib/browser.mjs';
import { setupA } from './sim/osm-day/lib/setup.mjs';
import { DAY } from './sim/osm-day/steps-a.mjs';
import { guardShot, seedExported, resetCapture } from './lib/capture-guard.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'd2-prep'), ROOT);
const fx = { window: {} };
vm.runInNewContext(readFileSync(join(ROOT, 'tools', 'step1-fixture.js'), 'utf8'), fx);
const CALLS = fx.window.STEP1_CALLS;
const GUARD_LOG = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'captures-batch.log'), ROOT);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Opens the account's prep panel (as steps-a panelText does) and reports the pane and its transcript boxes.
const OPEN = name => `(() => {
  const c = DATA.customers.find(x => x.name === ${JSON.stringify(name)});
  if (!c) return JSON.stringify({found: false});
  ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = c.id; render();
  const pane = document.querySelector('.day-pane[data-day-holds="' + cssEscape(c.id) + '"]');
  const boxes = pane ? pane.querySelectorAll('[data-beat-transcript]') : [];
  const box = boxes[0] || null;
  let rect = null, boxInfo = null;
  if (pane) { pane.scrollIntoView({block: 'start'}); const r = pane.getBoundingClientRect(); rect = {x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height}; }
  if (box) { const r = box.getBoundingClientRect(); boxInfo = {height: r.height, lineHeight: parseFloat(getComputedStyle(box).lineHeight), scrolls: box.scrollHeight > box.clientHeight}; }
  const withTx = (DATA.activities[c.id] || []).filter(a => a && a.transcript && (a.transcript.ref || (a.transcript.text || '').trim())).length;
  const label = box ? (box.closest('[data-beat-transcript-sec]').querySelector('.lbl') || {}).textContent : null;
  return JSON.stringify({found: true, id: c.id, pane: !!pane, boxes: boxes.length, rect, boxInfo, withTx, label});
})()`;
// Labelled setup: put a fixture call on an account as a past-dated activity (replaces the seeded transcript when one exists).
const SEED = (name, text, replace) => `(() => {
  const c = DATA.customers.find(x => x.name === ${JSON.stringify(name)});
  const list = DATA.activities[c.id] = DATA.activities[c.id] || [];
  const tr = {text: ${JSON.stringify(text)}, truncated: false};
  const own = ${JSON.stringify(!!replace)} ? list.find(a => a && a.transcript) : null;
  if (own) own.transcript = tr;
  else list.push({id: uid(), date: '2026-10-20', type: 'Call', summary: 'SIM-D2PREP fixture call', checklist: [], sessionNumber: null, flagged: false, transcript: tr});
  saveData(); return true;
})()`;

async function inSim(fn) {
  const ctx = await launch({ version: '1.1', startDay: DAY, runDir: join(OUT, 'run-' + Date.now()), part: 'A' });
  try {
    const seeded = await setupA(ctx);
    await seedExported(ctx, DAY);                 // before load, so the 'never exported' backup nag never opens
    await ctx.openOn(DAY);
    return await fn(ctx, seeded);
  } finally { await ctx.stop(); }
}
const open = async (ctx, name) => JSON.parse(await ctx.ev(OPEN(name)));

async function check() {
  return inSim(async ctx => {
    const au = await open(ctx, 'Aurora Renewables');
    const noTranscriptPane = !!(au.found && au.pane);
    const noTranscriptBoxes = noTranscriptPane ? au.boxes : -1;
    await ctx.ev(SEED('Orion Semiconductor', CALLS[0], true));
    const or = await open(ctx, 'Orion Semiconductor');
    const b = or.boxInfo || { height: 0, lineHeight: 0, scrolls: false };
    const maxAllowed = 6 * b.lineHeight + 24;
    const ok = noTranscriptPane && au.withTx === 0 && noTranscriptBoxes === 0 && !!or.pane && b.height > 0 && b.height <= maxAllowed && b.scrolls;
    const line = { noTranscriptPane, noTranscriptBoxes, fixture0Height: b.height, lineHeight: b.lineHeight, maxAllowed, scrolls: b.scrolls, ok };
    if (au.withTx !== 0) line.auroraHasTranscript = au.withTx;
    console.log('D2PREP-CHECK ' + JSON.stringify(line));
    return ok;
  });
}

async function shot(ctx, file, name, info) {
  if (!info.found || !info.pane) throw new Error('no prep pane for ' + name + ': ' + JSON.stringify(info));
  await sleep(300);
  mkdirSync(OUT, { recursive: true });
  const png = join(OUT, file + '.png');
  const pane = `document.querySelector('.day-pane[data-day-holds="' + cssEscape(${JSON.stringify(info.id)}) + '"]')`;
  try { await guardShot(ctx, { name: 'd2-' + file, account: name, accountId: info.id, targetExpr: pane, png, logFile: GUARD_LOG }); }
  finally { await resetCapture(ctx); }
  writeFileSync(join(OUT, file + '.txt'), `Account: ${name}\nBox height: ${info.boxInfo ? info.boxInfo.height + 'px' : 'none (no transcript box)'}\nLabel: ${info.label || 'none'}\nBoxes in pane: ${info.boxes}\n`);
  console.log(png);
  console.log(join(OUT, file + '.txt'));
}

async function captures() {
  await inSim(async (ctx, seeded) => {
    await shot(ctx, 'orion-10-21', 'Orion Semiconductor', await open(ctx, 'Orion Semiconductor'));
    const third = JSON.parse(await ctx.ev(`(() => JSON.stringify(DATA.customers.filter(c => c.nextSessionScheduledOn === todayISO() && c.name !== 'Orion Semiconductor' && c.name !== 'Aurora Renewables').map(c => c.name).sort()))()`));
    if (!third.length) throw new Error('no third account booked for ' + DAY + '; stopping');
    await ctx.ev(SEED(third[0], CALLS[3], false));
    await shot(ctx, 'fixture3', third[0], await open(ctx, third[0]));
    await shot(ctx, 'no-transcript', 'Aurora Renewables', await open(ctx, 'Aurora Renewables'));
  });
}

if (process.argv.includes('--check')) process.exit((await check()) ? 0 : 1);
else if (process.argv.includes('--captures')) await captures();
else { console.error('usage: node tools/d2-prep-panel.mjs --check | --captures'); process.exit(2); }
