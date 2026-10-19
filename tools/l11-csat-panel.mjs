// Dev tooling (not part of the bundle): L11 CSAT warning check, control and captures (1.1). Synthetic data only.
// usage: node tools/l11-csat-panel.mjs --check     -> one L11-CHECK line, exit 0 only if the L11 step passes on the working-tree 1.1
//        node tools/l11-csat-panel.mjs --control   -> same step on the pre-change tracker at 96c55c0 (CONTROL_REF); must exit 1
// Throwaway osmsim-* profiles only (launch()), removed by ctx.stop() in a finally.
import { writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveUnderSimRuns } from './sim/osm-day/lib/outdir.mjs';
import { launch } from './sim/osm-day/lib/browser.mjs';
import { setupB } from './sim/osm-day/lib/setup.mjs';
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

try {
  if (process.argv.includes('--check')) process.exit((await check()) ? 0 : 1);
  else if (process.argv.includes('--control')) process.exit((await control()) ? 0 : 1);
  else { console.error('usage: node tools/l11-csat-panel.mjs --check | --control (vs ' + CONTROL_REF + ')'); process.exit(2); }
} catch (e) { console.log('l11 tool error: ' + e.message); process.exit(2); }
