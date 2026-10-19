// Dev tooling (not part of the bundle): L11 CSAT warning check, control and captures (1.1). Synthetic data only.
// usage: node tools/l11-csat-panel.mjs --check     -> one L11-CHECK line, exit 0 only if the L11 step passes on the working-tree 1.1
//        node tools/l11-csat-panel.mjs --captures -> sim-runs/l11-csat/{no-contact-goal,no-contact-no-goal,contact-added}.{png,txt}
//        node tools/l11-csat-panel.mjs --control   -> same step on the pre-change tracker at 96c55c0 (CONTROL_REF); must exit 1
// Throwaway osmsim-* profiles only (launch()), removed by ctx.stop() in a finally.
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveUnderSimRuns } from './sim/osm-day/lib/outdir.mjs';
import { launch } from './sim/osm-day/lib/browser.mjs';
import { setupA, setupB } from './sim/osm-day/lib/setup.mjs';
import { DAY } from './sim/osm-day/steps-a.mjs';
import { PART_B, PART_B_ORDER, CAL } from './sim/osm-day/steps-b.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'l11-csat'), ROOT);
const CONTROL_REF = '96c55c0';

async function runL11(version) {
  const ctx = await launch({ version, startDay: CAL.L1, runDir: join(OUT, 'run-' + Date.now()), part: 'B' });
  try {
    await setupB(ctx);
    let r = null;
    for (const key of PART_B_ORDER) {            // L1..L10 run as unchecked setup, in date order, exactly as steps-b.mjs main() does
      const id = key.split('.')[0];
      const step = PART_B.find(s => s.id === id);
      if (!step) continue;
      if (key === 'L9.phase1') { await step.phase1(ctx); continue; }
      const res = await (key === 'L9.phase2' ? step.phase2(ctx) : step.run(ctx));
      if (id === 'L11') { r = res; break; }
    }
    return r;
  } finally { await ctx.stop(); }
}

async function check(version = '1.1') {
  const r = await runL11(version);
  if (!r) throw new Error('L11 step did not return a result');
  const passed = !!r.passed;
  console.log('L11-CHECK ' + JSON.stringify({ passed, evidence: r.evidence }));
  return passed;
}

async function control() {
  const file = join(ROOT, 'osm-book-of-business-tracker-l11ctl.html');
  let created = false;
  const cleanup = () => { if (created) { rmSync(file, { force: true }); created = false; } };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });
  try {
    // 'wx': fail rather than overwrite a file this run did not create
    writeFileSync(file, execFileSync('git', ['show', CONTROL_REF + ':osm-book-of-business-tracker-1.1.html'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }), { flag: 'wx' });
    created = true;
    return await check('l11ctl');
  } finally { cleanup(); }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const ACCOUNT = 'Aurora Renewables';
const STATES = [
  { file: 'no-contact-goal', label: 'no contact + goal', csat: false, goal: true },
  { file: 'no-contact-no-goal', label: 'no contact + no goal', csat: false, goal: false },
  { file: 'contact-added', label: 'contact marked added (no line)', csat: true, goal: true },
];

const SETUP_STATE = (name, st) => `(() => {
  const bd = document.querySelector('#gc-cancel'); if (bd) bd.click();
  const c = DATA.customers.find(x => x.name === ${JSON.stringify(name)});
  if (!c) return JSON.stringify({found: false});
  c.compliance = c.compliance || {};
  c.compliance.associatedPeopleCSAT = ${st.csat ? "{done: true, date: todayISO(), contactName: 'Dana Reyes'}" : "{done: false, date: null, contactName: ''}"};
  ${st.goal
    ? "if (!primaryGoal(c)) { c.goals = [{id: hexId('gl_'), type: GOAL_TYPES[0].key, text: 'Synthetic capture goal', targetCycle: '', primary: true, source: 'osm', createdOn: todayISO(), gates: [], verdict: null, verdictOn: null, verdictNote: '', supersededBy: null, changeReason: '', ackOn: null}]; }"
    : "c.goals = [];"}
  saveData(); ui.view = 'accounts'; ui.openCustomerId = c.id; render(); requestStageChange(c, 'graduated');
  return JSON.stringify({found: true});
})()`;

const READ_STATE = `(() => {
  const m = document.querySelector('.modal'); const l = document.querySelector('#gc-csat');
  if (!m) return JSON.stringify({modal: false});
  m.scrollIntoView({block: 'start'});
  const r = m.getBoundingClientRect();
  return JSON.stringify({modal: true, csat: !!l, text: l ? l.textContent.trim() : '', nogoal: !!document.querySelector('#gc-nogoal-wrap'),
    rect: {x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height}});
})()`;

async function captures() {
  await inSim(async ctx => {
    mkdirSync(OUT, { recursive: true });
    for (const st of STATES) {
      const set = JSON.parse(await ctx.ev(SETUP_STATE(ACCOUNT, st)));
      if (!set.found) throw new Error('account not found: ' + ACCOUNT);
      await sleep(400);
      const info = JSON.parse(await ctx.ev(READ_STATE));
      const ok = info.modal && (st.csat ? !info.csat : (info.csat && info.text !== '' && info.nogoal === !st.goal));
      if (!ok) throw new Error('preconditions failed for ' + st.file + '; stopping: ' + JSON.stringify({ ...info, rect: undefined }));
      const r = info.rect;
      const s = await ctx.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
      const buf = Buffer.from(s.data, 'base64');
      const png = join(OUT, st.file + '.png');
      writeFileSync(png, buf);
      const hex = createHash('sha256').update(buf).digest('hex').slice(0, 12);
      const txt = join(OUT, st.file + '.txt');
      writeFileSync(txt, `Account: ${ACCOUNT}
State: ${st.label}
Line text: ${info.csat ? info.text : '(none)'}
sha256 (first 12 of the png): ${hex}
`);
      console.log(png); console.log(txt);
      await ctx.ev("(() => { const b = document.querySelector('#gc-cancel'); if (b) b.click(); return 1; })()");
    }
  });
}

async function inSim(fn) {
  const ctx = await launch({ version: '1.1', startDay: DAY, runDir: join(OUT, 'run-' + Date.now()), part: 'A' });
  try {
    await setupA(ctx);
    await ctx.openOn(DAY);
    return await fn(ctx);
  } finally { await ctx.stop(); }
}

try {
  if (process.argv.includes('--check')) process.exit((await check()) ? 0 : 1);
  else if (process.argv.includes('--control')) process.exit((await control()) ? 0 : 1);
  else if (process.argv.includes('--captures')) { await captures(); process.exit(0); }
  else { console.error('usage: node tools/l11-csat-panel.mjs --check | --control (vs ' + CONTROL_REF + ') | --captures'); process.exit(2); }
} catch (e) { console.log('l11 tool error: ' + e.message); process.exit(2); }
