import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = resolve(ROOT, 'tools', 'l12-panel.mjs');

test('l12 panel tool lives in tools/, not under tools/sim/osm-day/', () => {
  assert.ok(existsSync(TOOL), 'tools/l12-panel.mjs must exist');
  assert.ok(!existsSync(resolve(ROOT, 'tools', 'sim', 'osm-day', 'l12-panel.mjs')));
});

test('l12 panel tool: guarded shots, seeded export, signal cleanup, three stems, no today-row shot', () => {
  const s = readFileSync(TOOL, 'utf8');
  for (const w of ['inSim(', '--captures', 'guardShot(', 'seedExported(', 'installSignalCleanup', 'csat-dates', 'agenda', 'pinned-line', '#surveys-to-chase',
    ]) assert.ok(s.includes(w), w);
  for (const w of ['today-row', 'TODAY-ROW-SKIPPED', 'todayActionList(']) assert.ok(!s.includes(w), 'obsolete today-row shot must be gone: ' + w);
});

test('l12 panel tool does not launch itself and never names the clicked nag, the live port or a text walk', () => {
  const s = readFileSync(TOOL, 'utf8');
  assert.ok(!s.includes('launch('));
  for (const w of ['#confirm-cancel', '8790', 'TreeWalker']) assert.ok(!s.includes(w), w);
});
