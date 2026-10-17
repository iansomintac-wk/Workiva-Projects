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
