// Shared by the 1.2 headless drives. Synthetic profiles only: launch() makes osmsim-* folders that ctx.stop() removes.
import { writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveUnderSimRuns } from '../sim/osm-day/lib/outdir.mjs';
import { launch } from '../sim/osm-day/lib/browser.mjs';
import { setupA } from '../sim/osm-day/lib/setup.mjs';
import { DAY } from '../sim/osm-day/steps-a.mjs';
import { seedExported } from './capture-guard.mjs';
import { installSignalCleanup } from '../l11-csat-panel.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTROL_REF = '56206c4';
export { DAY };
export const OUT_DIR = name => resolveUnderSimRuns(join(ROOT, 'sim-runs', name), ROOT);
export async function inSimVersion(version, outName, fn) {
  const ctx = await launch({ version, startDay: DAY, runDir: join(OUT_DIR(outName), 'run-' + Date.now()), part: 'A' });
  try { await setupA(ctx); await seedExported(ctx, DAY); await ctx.openOn(DAY); return await fn(ctx); } finally { await ctx.stop(); }
}
export async function withTracker(control, fn) {
  if (!control) return fn('1.1');
  const file = join(ROOT, 'osm-book-of-business-tracker-csat12ctl.html'); let made = false;
  const cleanup = () => { if (made) { rmSync(file, { force: true }); made = false; } };
  process.on('exit', cleanup); installSignalCleanup(process, cleanup);
  try {
    writeFileSync(file, execFileSync('git', ['show', CONTROL_REF + ':osm-book-of-business-tracker-1.1.html'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }), { flag: 'wx' });
    made = true; return await fn('csat12ctl');
  } finally { cleanup(); }
}
export const isMain = url => !!process.argv[1] && resolve(process.argv[1]) === fileURLToPath(url);
