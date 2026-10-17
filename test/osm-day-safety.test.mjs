import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertMarker, cleanupProfile, countLeftovers } from '../tools/sim/osm-day/lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SIM = join(ROOT, 'tools/sim/osm-day');
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

test('control a: cleanup never removes while the process is alive', async () => {
  let removed = 0;
  await assert.rejects(cleanupProfile({ pid: 1, profile: 'x', isAlive: () => true, kill: () => {}, remove: () => { removed++; }, exists: () => true, timeoutMs: 200 }), /process still alive/);
  assert.equal(removed, 0);
});

test('control b: a profile that survives removal is reported', async () => {
  await assert.rejects(cleanupProfile({ pid: 1, profile: 'x', isAlive: () => false, kill: () => {}, remove: () => {}, exists: () => true, timeoutMs: 200 }), /profile remains/);
});

test('cleanup kills, waits for exit, then removes', async () => {
  const order = []; let alive = true;
  await cleanupProfile({ pid: 7, profile: 'p', isAlive: () => { order.push('alive?' + alive); const a = alive; alive = false; return a; },
    kill: () => order.push('kill'), remove: () => order.push('remove'), exists: () => !order.includes('remove'), timeoutMs: 2000 });
  assert.equal(order[0], 'kill');
  assert.ok(order.indexOf('remove') > order.lastIndexOf('alive?true'));
});

test('control c: countLeftovers sees a leftover osmsim- folder', () => {
  const before = countLeftovers(['osmsim-'], tmpdir());
  const dir = mkdtempSync(join(tmpdir(), 'osmsim-test-'));
  try { assert.equal(countLeftovers(['osmsim-'], tmpdir()), before + 1); }
  finally { rmSync(dir, { recursive: true, force: true }); }
  assert.equal(countLeftovers(['osmsim-'], tmpdir()), before);
});

test('control d: assertMarker throws on missing or wrong marker', () => {
  assert.throws(() => assertMarker(undefined, 'D1'));
  assert.throws(() => assertMarker('D2', 'D1'));
  assert.doesNotThrow(() => assertMarker('D1', 'D1'));
});

test('control e: no screenshots/recordings/port 8790; browser.mjs keeps its guards', () => {
  const files = walk(SIM);
  assert.ok(files.length > 0);
  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    for (const bad of ['captureScreenshot', 'startScreencast', 'screencast', '8790']) assert.ok(!t.includes(bad), `${f} contains ${bad}`);
  }
  const b = readFileSync(join(SIM, 'lib/browser.mjs'), 'utf8');
  assert.ok(b.includes('--user-data-dir'));
  assert.ok(b.includes('setDownloadBehavior'));
});

test('cleanup keeps retrying the delete past 5 s when the folder frees at about 6 s', async () => {
  const t0 = Date.now(); let attempts = 0; let freed = false;
  await cleanupProfile({ pid: 9, profile: 'p', isAlive: () => false, kill: () => {},
    remove: () => { attempts++; if (Date.now() - t0 >= 6000) freed = true; }, exists: () => !freed });
  assert.ok(freed && Date.now() - t0 >= 6000 && attempts > 1);
});

// Task 6: field-test launch guard
const FT = readFileSync(join(ROOT, 'tools/sim/run-field-test.mjs'), 'utf8');
const HOSTS = ['api.anthropic.com', 'api.openai.com', 'generativelanguage.googleapis.com'];
test('field test: --target flag, three resolver rules', () => {
  assert.match(FT, /flag\('target'\)/);
  for (const h of HOSTS) assert.ok(FT.includes(`MAP ${h} ~NOTFOUND`), h);
  assert.match(FT, /--host-resolver-rules=/);
});
test('field test: cleanup is the shared cleanupProfile on Node child liveness, awaited, with exit(2) leftover branch', () => {
  assert.match(FT, /import\s*\{[^}]*cleanupProfile[^}]*\}\s*from\s*'\.\/osm-day\/lib\/browser\.mjs'/);
  assert.match(FT, /await cleanupProfile\(/);
  assert.match(FT, /child\.exitCode === null && child\.signalCode === null/);
  assert.match(FT, /catch[^]*process\.exit\(2\)/);
  assert.doesNotMatch(FT, /const cleanup = \(\) =>/);
});
test('field test: every exit awaits cleanup first', () => {
  for (const m of FT.matchAll(/process\.exit\((\d)\)/g)) {
    const before = FT.slice(Math.max(0, m.index - 400), m.index);
    if (m[1] === '0' || /fail = /.test(before)) assert.match(before, /await cleanup\(\)/, `exit at ${m.index}`);
  }
});
test('outbound-call ban: no callAiAPI( or provider URL in field test or steps', () => {
  const files = [join(ROOT, 'tools/sim/run-field-test.mjs'), ...readdirSync(join(ROOT, 'tools/sim/steps')).filter(f => f.endsWith('.js')).map(f => join(ROOT, 'tools/sim/steps', f))];
  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    assert.doesNotMatch(t, /callAiAPI\(/, f);
    assert.doesNotMatch(t, /https?:\/\/[^\s'"`]*(anthropic|openai|googleapis)/i, f);
  }
});

// X1: browser safety
const BR = readFileSync(join(SIM, 'lib/browser.mjs'), 'utf8');
test('X1 browser: own debugging port via DevToolsActivePort, no random 9400 port, no proxy', () => {
  assert.match(BR, /--remote-debugging-port=0/);
  assert.match(BR, /DevToolsActivePort/);
  assert.ok(!BR.includes('9400'));
  assert.match(BR, /--no-proxy-server/);
});
test('X1 browser: error, timeout, close, dialog and signal handling present', () => {
  assert.match(BR, /child\.on\('error'/);
  assert.match(BR, /CDP timeout/);
  assert.match(BR, /ws\.onclose/);
  assert.match(BR, /Page\.handleJavaScriptDialog/);
  assert.match(BR, /SIGINT/);
  assert.match(BR, /SIGTERM/);
});
test('X1 verify: spawnSync calls carry a timeout', () => {
  const v = readFileSync(join(SIM, 'verify.mjs'), 'utf8');
  const calls = [...v.matchAll(/spawnSync\(process\.execPath[^]*?\}\);/g)].map(m => m[0]);
  assert.ok(calls.length >= 2);
  for (const c of calls) assert.match(c, /timeout:/);
});
test('X1 spawn error: invalid Chrome path rejects, profile folder removed, run exits 2', async () => {
  const { launch } = await import('../tools/sim/osm-day/lib/browser.mjs');
  const before = countLeftovers(['osmsim-'], tmpdir());
  const runDir = mkdtempSync(join(tmpdir(), 'x1run-'));
  try {
    await assert.rejects(launch({ version: '1.0', startDay: '2026-10-21', runDir, part: 'x1', chromePath: join(runDir, 'no-such-chrome.exe') }));
    assert.equal(countLeftovers(['osmsim-'], tmpdir()), before);
  } finally { rmSync(runDir, { recursive: true, force: true }); }
  const { spawnSync } = await import('node:child_process');
  const out = mkdtempSync(join(ROOT, 'sim-runs-x1-'));
  try {
    const r = spawnSync(process.execPath, [join(SIM, 'run.mjs'), '--version', '1.0', '--part', 'A', '--only', 'D1', '--no-breaks', '--out', join(ROOT, 'sim-runs', 'ext', 'x1-spawnerr')],
      { env: { ...process.env, OSM_SIM_CHROME: join(out, 'nope.exe') }, encoding: 'utf8', timeout: 60000 });
    assert.equal(r.status, 2);
    assert.equal(countLeftovers(['osmsim-'], tmpdir()), before);
  } finally { rmSync(out, { recursive: true, force: true }); }
});
