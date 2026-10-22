// Dev tooling (not part of the bundle): D3 call-prep Promises section check, control and captures (1.1).
// usage: node tools/d3-prep-panel.mjs --check      -> prints one D3PREP-CHECK line, exit 0 only if ok
//        node tools/d3-prep-panel.mjs --control    -> same checks on the pre-change tracker at c297df3 (CONTROL_REF); must exit 1
//        node tools/d3-prep-panel.mjs --captures   -> sim-runs/d3-prep/{orion-10-21,one-promise,none}.{png,txt}
// Throwaway osmsim-* profiles only (launch()), removed by ctx.stop() in a finally. Synthetic data only.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveUnderSimRuns } from './sim/osm-day/lib/outdir.mjs';
import { launch } from './sim/osm-day/lib/browser.mjs';
import { setupA } from './sim/osm-day/lib/setup.mjs';
import { DAY } from './sim/osm-day/steps-a.mjs';
import { guardShot, seedExported, resetCapture } from './lib/capture-guard.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'd3-prep'), ROOT);
const CONTROL_REF = 'c297df3';
const GUARD_LOG = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'captures-batch.log'), ROOT);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const OPEN = name => `(() => {
  const c = DATA.customers.find(x => x.name === ${JSON.stringify(name)});
  if (!c) return JSON.stringify({found: false});
  ui.view = 'today'; ui.openCustomerId = null; ui.v13DeskId = c.id; ui.v13DeskFilter = null; ui.v13DeskTab = 'prepare'; render();
  const pane = document.querySelector('[data-v13-desk-body] [data-v13-desk-pane]');
  const out = {found: true, id: c.id, pane: !!pane, open: openCommitments(c).length};
  if (!pane) return JSON.stringify(out);
  pane.scrollIntoView({block: 'start'});
  const pr = pane.getBoundingClientRect();
  out.rect = {x: pr.left + scrollX, y: pr.top + scrollY, w: pr.width, h: pr.height};
  const secs = pane.querySelectorAll('[data-beat-promises-sec]');
  out.sections = secs.length;
  out.rows = pane.querySelectorAll('[data-beat-promise]').length;
  const rowsFor = lab => { const g = Array.from(pane.querySelectorAll('[data-beat-promise-group]')).find(e => e.textContent.trim() === lab); const ul = g && g.nextElementSibling; return ul ? ul.querySelectorAll('li').length : 0; };
  out.youOweRows = rowsFor('You owe'); out.theyOweRows = rowsFor('They owe you');
  const more = pane.querySelector('[data-beat-promises-more]');
  out.moreText = more ? more.textContent.replace(/\\s+/g, ' ').trim() : '';
  const t = pane.textContent;
  out.simOweYou = t.includes('SIM-OWE you owe'); out.simOweThey = t.includes('SIM-OWE they owe');
  out.callPrep = t.includes('Call prep');
  out.sectionHeight = secs[0] ? secs[0].getBoundingClientRect().height : 0;
  return JSON.stringify(out);
})()`;

// Signal cleanup. launch() (browser.mjs) registers its own SIGINT/SIGTERM handler AFTER ours; it stops Chrome by its PID, removes
// the osmsim-* profile and only then exits (130/143). So ours must remove the file, must NOT exit (an early exit skips that stop),
// and keeps an unref'd timer as a backstop for a signal that lands before launch() has registered.
export function installSignalCleanup(proc, cleanup) {
  for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
    proc.on(sig, () => { cleanup(); setTimeout(() => proc.exit(code), 15000).unref(); });
  }
}

export async function inSim(fn, version = '1.1') {
  const ctx = await launch({ version, startDay: DAY, runDir: join(OUT, 'run-' + Date.now()), part: 'A' });
  try {
    await setupA(ctx);
    await seedExported(ctx, DAY);                 // before load, so the 'never exported' backup nag never opens
    await ctx.openOn(DAY);
    return await fn(ctx);
  } finally { await ctx.stop(); }
}
const open = async (ctx, name) => JSON.parse(await ctx.ev(OPEN(name)));

async function check(version = '1.1') {
  return inSim(async ctx => {
    const au = await open(ctx, 'Aurora Renewables');
    const auroraPane = !!(au.found && au.pane);
    const auroraSections = auroraPane ? au.sections : -1;
    const or = await open(ctx, 'Orion Semiconductor');
    const orionPane = !!(or.found && or.pane);
    const ok = auroraPane && auroraSections === 0 && au.open === 0 && orionPane && or.rows === 5 && or.youOweRows === 3 && or.theyOweRows === 2
      && /^1 more/.test(or.moreText) && or.simOweYou && or.simOweThey && or.sectionHeight > 0;
    const line = { orionPane, rows: or.rows || 0, youOweRows: or.youOweRows || 0, theyOweRows: or.theyOweRows || 0, moreText: or.moreText || '', simOweYou: !!or.simOweYou, simOweThey: !!or.simOweThey, auroraPane, auroraSections, sectionHeight: or.sectionHeight || 0, ok };
    if (au.open !== 0) line.auroraOpen = au.open;
    console.log('D3PREP-CHECK ' + JSON.stringify(line));
    return ok;
  }, version);
}

async function control() {
  const file = join(ROOT, 'osm-book-of-business-tracker-d3ctl.html');
  let created = false;
  const cleanup = () => { if (created) { rmSync(file, { force: true }); created = false; } };
  process.on('exit', cleanup);
  installSignalCleanup(process, cleanup);
  try {
    // 'wx': fail rather than overwrite a file this run did not create
    writeFileSync(file, execFileSync('git', ['show', CONTROL_REF + ':osm-book-of-business-tracker-1.1.html'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }), { flag: 'wx' });
    created = true;
    return await check('d3ctl');
  } finally { cleanup(); }
}

async function shot(ctx, file, name, info, extra) {
  if (!info.found || !info.pane) throw new Error('no prep pane for ' + name + ': ' + JSON.stringify(info));
  await sleep(300);
  mkdirSync(OUT, { recursive: true });
  const png = join(OUT, file + '.png');
  const pane = `document.querySelector('[data-v13-desk-body] [data-v13-desk-pane]')`;
  try { await guardShot(ctx, { name: 'd3-' + file, account: name, accountId: info.id, targetExpr: pane, png, logFile: GUARD_LOG }); }
  finally { await resetCapture(ctx); }
  writeFileSync(join(OUT, file + '.txt'), `Account: ${name}\nOpen commitments: ${info.open}\nPromise rows: ${info.rows}\nSection height: ${info.sectionHeight}px\n${extra || ''}`);
  console.log(png);
  console.log(join(OUT, file + '.txt'));
}

async function captures() {
  await inSim(async ctx => {
    await shot(ctx, 'orion-10-21', 'Orion Semiconductor', await open(ctx, 'Orion Semiconductor'));
    await ctx.ev(`(() => { const c = DATA.customers.find(x => x.name.startsWith('Solaris')) || DATA.customers.find(x => x.name.startsWith('Halcyon')); c.nextSessionScheduledOn = todayISO(); saveData(); render(); return c.name; })()`);
    const name = await ctx.ev(`(() => (DATA.customers.find(x => x.name.startsWith('Solaris')) || DATA.customers.find(x => x.name.startsWith('Halcyon'))).name)()`);
    const one = await open(ctx, name);
    const pt = await ctx.ev(`(() => { const p = document.querySelector('[data-v13-desk-body] [data-v13-desk-pane]'); return !!p && p.textContent.includes('Call prep'); })()`);
    if (!(one.pane && pt && one.sections === 1 && one.rows === 1 && one.open === 1)) throw new Error('one-promise preconditions failed; stopping: ' + JSON.stringify({ ...one, callPrep: pt }));
    await shot(ctx, 'one-promise', name, one, 'booked for this capture only\n');
    const au = await open(ctx, 'Aurora Renewables');
    if (!(au.pane && au.sections === 0)) throw new Error('none capture preconditions failed; stopping: ' + JSON.stringify(au));
    await shot(ctx, 'none', 'Aurora Renewables', au);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--control')) installSignalCleanup(process, () => {});
  if (process.argv.includes('--check')) process.exit((await check()) ? 0 : 1);
  else if (process.argv.includes('--control')) process.exit((await control()) ? 0 : 1);
  else if (process.argv.includes('--captures')) await captures();
  else { console.error('usage: node tools/d3-prep-panel.mjs --check | --control (vs ' + CONTROL_REF + ') | --captures'); process.exit(2); }
}
