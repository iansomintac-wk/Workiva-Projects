// B0 headed spike (P9): file:// page -> http://127.0.0.1 stub, HEADED browsers, fresh profile.
// The page beacons its result to the stub (/report?r=...); we read the stub's log.
// Exit code 1 if cors is not ok or nocors is not fail (the control must be able to fail).
// Normal-profile legs are intentionally not automated here (they would touch the user's real profile).
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
const D = import.meta.dirname.split('\\').join('/');
const T = (process.env.TEMP || D).split('\\').join('/');
const browsers = [
  ['chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'],
  ['edge', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'],
].filter(([, p]) => existsSync(p));
const results = [];
let bad = 0;
for (const [name, exe] of browsers) {
  for (const [mode, port] of [['cors', 47821], ['nocors', 47822]]) {
    const logs = [];
    const s = spawn(process.execPath, [`${D}/b0-stub.mjs`, mode, String(port)]);
    s.stdout.on('data', d => logs.push(...String(d).split('\n').map(x => x.trim()).filter(Boolean)));
    await new Promise(r => setTimeout(r, 500));
    const profile = `${T}/b0h-${name}-${mode}`;   // a throwaway profile: removed below, so no b0h-* is left in %TEMP%
    const b = spawn(exe, [`--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
      `file:///${D}/b0-page-headed.html#${port}`], { stdio: 'ignore' });
    let report = null;
    for (let i = 0; i < 80 && !report; i++) {
      await new Promise(r => setTimeout(r, 100));
      const l = logs.find(x => x.includes('/report?r='));
      if (l) report = decodeURIComponent(l.split('/report?r=')[1].split(' origin=')[0]);
    }
    spawnSync('taskkill', ['/T', '/F', '/PID', String(b.pid)], { stdio: 'ignore' }); // only the process we spawned
    s.kill();
    await new Promise(r => setTimeout(r, 1000));   // let the browser release its profile files
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 }); } catch (e) { console.log(`could not remove ${profile}: ${e.message}`); }
    const want = mode === 'cors' ? 'RESULT ok' : 'RESULT fail';
    const pass = !!report && report.startsWith(want);
    if (!pass) bad++;
    results.push({ browser: name, mode, report, pass, stubSaw: logs });
    console.log(JSON.stringify(results.at(-1)));
  }
}
console.log(bad ? `BLOCKED/UNEXPECTED legs: ${bad}` : `ALL LEGS AS EXPECTED (${results.length})`);
process.exit(bad ? 1 : 0);
