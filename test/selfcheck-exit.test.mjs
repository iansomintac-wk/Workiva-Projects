import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const SC = resolve('tools/selfcheck.mjs');
const run = (...a) => spawnSync(process.execPath, [SC, 'osm-book-of-business-tracker-1.1.html', '--seed', 'demo-seed.js', '--expect', '475', ...a], { encoding: 'utf8', timeout: 240000 });

test('FX1 selfcheck exits 1 and prints "console errors: 1" when the page logs one console.error', () => {
  const r = run('--pre', 'test/selfcheck-console-error.pre.js');
  assert.match(r.stdout, /console errors: 1 /, r.stdout.slice(-600) + r.stderr.slice(-300));
  assert.equal(r.status, 1);
});
