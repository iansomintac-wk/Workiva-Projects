import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = resolve(ROOT, 'tools', 'l12-persist-check.mjs');

test('l12 persist check: legacy book loads and both dates persist in real Chrome', () => {
  assert.ok(existsSync(TOOL), 'tools/l12-persist-check.mjs must exist');
  const r = spawnSync(process.execPath, [TOOL], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
  assert.equal(r.status, 0, 'exit 0 expected; stdout: ' + (r.stdout || '').slice(-300));
  assert.match(r.stdout, /L12-PERSIST \{"legacy":true,"saved":true,"ok":true\}/);
});

test('l12 persist check source: uses inSim, prepareBookData and change events; no cancel button, no port 8790', () => {
  assert.ok(existsSync(TOOL), 'tools/l12-persist-check.mjs must exist');
  const src = readFileSync(TOOL, 'utf8');
  assert.match(src, /import\s*\{[^}]*\binSim\b[^}]*\}\s*from\s*'\.\/l11-csat-panel\.mjs'/);
  assert.ok(src.includes('prepareBookData(') && src.includes('change'));
  assert.ok(!src.includes('#confirm-cancel') && !src.includes('8790'));
});
