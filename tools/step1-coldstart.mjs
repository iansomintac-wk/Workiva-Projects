import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const SPREAD_FLOOR_MS = 30;   // For Ian (b): set to 0 for the literal 15% rule
const profile = mkdtempSync(join(tmpdir(), 'step1-cold-'));
const run = fn => spawnSync(process.execPath, ['tools/selfcheck.mjs', 'osm-book-of-business-tracker-1.1.html', '--profile', profile,
  '--seed', 'tools/step1-fixture.js,tools/step1-probe.js', '--fn', fn, '--expect', fn === 'step1SeedLarge' ? '1' : '2', '--verbose'], { encoding: 'utf8' });
const unlocked = async () => {
  for (let i = 0; i < 150; i++) {
    if (!existsSync(join(profile, 'lockfile')) && !existsSync(join(profile, 'SingletonLock'))) return;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Chrome still holds the profile');
};
let code = 1;
try {
  const seed = run('step1SeedLarge');
  if (seed.status !== 0) { console.log(seed.stdout + seed.stderr); throw new Error('seed start failed'); }
  const ms = [];
  for (let i = 0; i < 3; i++) {
    await unlocked();
    const r = run('step1StartupCheck');
    const m = /loadMs=([0-9.]+)/.exec(r.stdout + '');
    if (r.status !== 0 || !m) { console.log(r.stdout + r.stderr); throw new Error('start ' + (i + 1) + ' failed'); }
    console.log('start ' + (i + 1) + ': ' + (/loadMs=[^\n]*/.exec(r.stdout) || [''])[0]);
    ms.push(Number(m[1]));
  }
  const sorted = ms.slice().sort((a, b) => a - b), med = sorted[1], spread = (sorted[2] - sorted[0]) / med;
  console.log(`C8 starts (loadMs): ${ms.join(' / ')}  median ${med}  spread ${(spread * 100).toFixed(0)}%`);
  console.log('SPREAD_FLAG: ' + (spread > 0.15 && med >= SPREAD_FLOOR_MS ? 'yes (lead: stop and report the numbers to Ian)' : 'no'));
  code = med < 500 ? 0 : 1;
  console.log(code === 0 ? 'C8 PASS: median under 500 ms' : 'C8 FAIL: median 500 ms or more');
} catch (e) { console.log(String(e.message || e)); code = 1; }
finally { try { await unlocked(); } catch {} rmSync(profile, { recursive: true, force: true }); }
process.exit(code);
