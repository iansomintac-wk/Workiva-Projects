// Task 10: the team-demo capture script writes six named PNGs into the dir it is given, and only uses temp-folder Chrome profiles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'tools', 'team-demo-capture.mjs');
const src = () => readFileSync(script, 'utf8');
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'NODE_TEST_CONTEXT'));

test('the script exists and takes the output dir from its first argument', () => {
  assert.ok(existsSync(script), 'tools/team-demo-capture.mjs is missing');
  assert.match(src(), /process\.argv\[2\]/);
});

test('it names the six capture files', () => {
  const s = src();
  for (const f of ['01-check-for-calls.png', '02-read-accounts.png', '03-check-csat-dry-run.png', '04-send-to-gainsight.png', '05-health.png', '06-how-its-built.png']) assert.ok(s.includes(f), f);
});

test('it writes only inside the output dir (every writeFileSync target is built from outDir or the temp folder)', () => {
  const writes = [...src().matchAll(/writeFileSync\(([^,]+),/g)].map((m) => m[1].trim());
  assert.ok(writes.length > 0);
  for (const w of writes) assert.match(w, /outDir|tmp/, 'write target: ' + w);
  assert.doesNotMatch(src(), /\.claude|RESTORE-POINT/);
});

test('it refuses a --user-data-dir outside the temp folder', () => {
  const r = spawnSync(process.execPath, [script, join(root, 'docs', 'evidence', 'x-never-written'), '--user-data-dir=' + root], { encoding: 'utf8', timeout: 30000, env });
  assert.equal(r.status, 2, (r.stdout || '') + (r.stderr || ''));
  assert.match((r.stdout || '') + (r.stderr || ''), /user-data-dir/);
  assert.equal(existsSync(join(root, 'docs', 'evidence', 'x-never-written')), false);
});
