// Dev tooling (not part of the bundle): captures Fernhollow's gone-quiet row on Today (1.1) and counts gone_quiet rows per day.
// usage: node tools/sim/osm-day/capture-gq.mjs            -> sim-runs/gq-captures/fernhollow-<date>.{png,txt}
//        node tools/sim/osm-day/capture-gq.mjs --flood    -> sim-runs/gq-captures/flood.json
// Throwaway osmsim-* profiles only (launch()), removed by ctx.stop() in a finally.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveUnderSimRuns } from './lib/outdir.mjs';
import { launch } from './lib/browser.mjs';
import { setupA, setupB } from './lib/setup.mjs';
import { PART_A, DAY } from './steps-a.mjs';
import { PART_B, PART_B_ORDER, CAL } from './steps-b.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'gq-captures'), ROOT);
const FERN = 'Fernhollow Renewables';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const baseId = k => k.split('.')[0];
const runStep = (ctx, step, key) => key === 'L9.phase1' ? step.phase1(ctx) : key === 'L9.phase2' ? step.phase2(ctx) : step.run(ctx);

async function capture(date, upTo) {
  const ctx = await launch({ version: '1.1', startDay: CAL.L1, runDir: join(OUT, 'run-' + date), part: 'B' });
  try {
    await setupB(ctx);
    for (const key of PART_B_ORDER.slice(0, PART_B_ORDER.indexOf(upTo) + 1)) await runStep(ctx, PART_B.find(s => s.id === baseId(key)), key);
    await ctx.openOn(date);
    const info = JSON.parse(await ctx.ev(`(() => {
      const c = DATA.customers.find(x => x.name === ${JSON.stringify(FERN)});
      ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = null; render();
      const list = todayActionList();
      const idx = list.findIndex(r => r.customerId === c.id);
      const row = list[idx];
      const el = document.querySelector('#day .day-step[data-day-step="' + cssEscape(c.id) + '"]');
      let rect = null;
      if (el) { el.scrollIntoView({block:'center'}); const r = el.getBoundingClientRect(); rect = {x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height}; }
      return JSON.stringify({today: todayISO(), found: !!el, rank: idx + 1, of: list.length, source: row && row.source, headline: row && row.headline,
        reasons: row && row.reasons, state: accountStateLabel(c), rect});
    })()`));
    if (!info.found) throw new Error('no on-screen day step for Fernhollow on ' + date + ': ' + JSON.stringify(info));
    await sleep(300);
    const r = info.rect; const pad = 300;
    const shot = await ctx.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
      clip: { x: 0, y: Math.max(0, r.y - pad / 2), width: 1440, height: r.h + pad, scale: 1 } });
    mkdirSync(OUT, { recursive: true });
    const png = join(OUT, `fernhollow-${date}.png`);
    writeFileSync(png, Buffer.from(shot.data, 'base64'));
    writeFileSync(join(OUT, `fernhollow-${date}.txt`),
      `Account: ${FERN}\nDate: ${info.today}\nRank: ${info.rank} of ${info.of}\nSource: ${info.source}\nHeadline: ${info.headline}\nReason: ${(info.reasons || []).join(' | ')}\nAccount state label: ${info.state}\n`);
    console.log(`${png} | source ${info.source} | rank ${info.rank}/${info.of} | state ${info.state}`);
  } finally { await ctx.stop(); }
}

async function flood() {
  const days = [];
  const count = async ctx => {
    const day = await ctx.ev('todayISO()');
    const n = await ctx.ev(`(() => { const l = todayActionList(); return JSON.stringify({n: l.filter(r => r.source === 'gone_quiet').length,
      top15: l.slice(0, 15).filter(r => r.source === 'gone_quiet').length, names: l.filter(r => r.source === 'gone_quiet').map(r => r.customerName)}); })()`);
    days.push({ part: ctx.part, date: day, ...JSON.parse(n) });
  };
  const wrap = ctx => { const o = ctx.openOn; ctx.openOn = async iso => { await o(iso); await count(ctx); }; };
  const b = await launch({ version: '1.1', startDay: CAL.L1, runDir: join(OUT, 'run-flood-B'), part: 'B' });
  try {
    await setupB(b); wrap(b);
    for (const key of PART_B_ORDER) await runStep(b, PART_B.find(s => s.id === baseId(key)), key);
  } finally { await b.stop(); }
  const a = await launch({ version: '1.1', startDay: DAY, runDir: join(OUT, 'run-flood-A'), part: 'A' });
  try { await setupA(a); wrap(a); await a.openOn(DAY); } finally { await a.stop(); }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'flood.json'), JSON.stringify(days, null, 1));
  const ns = days.map(d => d.n).sort((x, y) => x - y);
  const dates = new Set(days.map(d => d.date));
  console.log(`dates ${dates.size}, records ${days.length}, max ${ns[ns.length - 1]}, median ${ns[Math.floor(ns.length / 2)]}, days with >=1: ${new Set(days.filter(d => d.n >= 1).map(d => d.date)).size}`);
}

if (process.argv.includes('--flood')) await flood();
else { await capture('2026-10-12', 'L5'); await capture('2026-12-01', 'L7'); }
