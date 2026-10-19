import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = resolve(ROOT, 'tools', 'd2-prep-panel.mjs');

test('d2-prep panel tool lives in tools/, not under tools/sim/osm-day/', () => {
  assert.ok(existsSync(TOOL), 'tools/d2-prep-panel.mjs must exist');
  assert.ok(!existsSync(resolve(ROOT, 'tools', 'sim', 'osm-day', 'd2-prep-panel.mjs')));
});

test('d2-prep panel tool launches the sim, stops it in a finally, and never names port 8790', () => {
  const src = readFileSync(TOOL, 'utf8');
  assert.ok(src.includes('launch('));
  assert.match(src, /\bfinally\s*\{[^{}]*\bctx\.stop\(\)/, 'ctx.stop() must sit inside a finally { } block');
  assert.ok(!src.includes('8790'));
});
