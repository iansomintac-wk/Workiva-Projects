import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = resolve(ROOT, 'tools', 'd3-prep-panel.mjs');

test('d3-prep panel tool lives in tools/, not under tools/sim/osm-day/', () => {
  assert.ok(existsSync(TOOL), 'tools/d3-prep-panel.mjs must exist');
  assert.ok(!existsSync(resolve(ROOT, 'tools', 'sim', 'osm-day', 'd3-prep-panel.mjs')));
});

test('d3-prep panel tool launches the sim, stops it in a finally, and never names port 8790', () => {
  const src = readFileSync(TOOL, 'utf8');
  assert.ok(src.includes('launch('));
  assert.match(src, /\bfinally\s*\{[^{}]*\bctx\.stop\(\)/, 'ctx.stop() must sit inside a finally { } block');
  assert.ok(!src.includes('8790'));
});

test('d3-prep --control writes its copy exclusively, deletes only what it created, cleans on exit/signal, and the file is gitignored', () => {
  const src = readFileSync(TOOL, 'utf8');
  assert.match(src, /flag:\s*'wx'/, "control file must be written with flag: 'wx'");
  assert.match(src, /\bcreated\b/, 'must track whether this run created the file');
  assert.match(src, /if\s*\(\s*created\s*\)\s*\{?\s*rmSync/, 'must delete only when this run created it');
  assert.match(src, /process\.on\(\s*'exit'/, 'must register an exit cleanup');
  assert.match(src, /process\.on\(\s*'SIG(INT|TERM)'/, 'must register a signal cleanup');
  const ign = readFileSync(resolve(ROOT, '.gitignore'), 'utf8').split(/\r?\n/);
  assert.ok(ign.includes('osm-book-of-business-tracker-d3ctl.html'), '.gitignore must list the control file');
});
