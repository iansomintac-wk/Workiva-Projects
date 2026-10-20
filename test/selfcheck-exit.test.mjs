import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const SC = resolve('tools/selfcheck.mjs');
const run = (...a) => spawnSync(process.execPath, [SC, 'osm-book-of-business-tracker-1.1.html', '--seed', 'demo-seed.js', '--expect', '491', ...a], { encoding: 'utf8', timeout: 240000 });

test('FX1 selfcheck exits 1 and prints "console errors: 1" when the page logs one console.error', () => {
  const r = run('--pre', 'test/selfcheck-console-error.pre.js');
  assert.match(r.stdout, /console errors: 1 /, r.stdout.slice(-600) + r.stderr.slice(-300));
  assert.equal(r.status, 1);
});

test('X3 field-test spawn error: bogus Chrome path exits 2 and leaves no fieldtest- folder', async () => {
  const { tmpdir } = await import('node:os');
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const realTmp = tmpdir();
  const priv = mkdtempSync(join(realTmp, 'x3priv-'));
  const saved = { TMP: process.env.TMP, TEMP: process.env.TEMP, TMPDIR: process.env.TMPDIR };
  process.env.TMP = process.env.TEMP = process.env.TMPDIR = priv;
  try {
    const { countLeftovers } = await import('../tools/sim/osm-day/lib/browser.mjs');
    const before = countLeftovers(['fieldtest-'], tmpdir());
    const r = spawnSync(process.execPath, [resolve('tools/sim/run-field-test.mjs')],
      { env: { ...process.env, OSM_SIM_CHROME: resolve('sim-runs/no-such-chrome.exe') }, encoding: 'utf8', timeout: 90000 });
    assert.equal(r.status, 2, (r.stdout || '').slice(-300) + (r.stderr || '').slice(-400));
    assert.equal(countLeftovers(['fieldtest-'], tmpdir()), before);
  } finally {
    for (const k of Object.keys(saved)) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
    rmSync(priv, { recursive: true, force: true });
  }
});
