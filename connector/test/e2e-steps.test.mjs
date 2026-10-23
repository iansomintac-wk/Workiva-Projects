// Task 5: the e2e runner declares 8 steps, the clock-ahead flag, the demo fixture config and the Check CSAT step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools', 'connector-e2e.mjs'), 'utf8');

test('e2e runner: declares /8 passed and no stale /7', () => {
  assert.match(src, /\/8 passed/);
  assert.doesNotMatch(src, /\/7 passed/);
});
test('e2e runner: accepts --days-ahead and sets CONNECTOR_FAKE_NOW from it', () => {
  assert.match(src, /--days-ahead/);
  assert.match(src, /CONNECTOR_FAKE_NOW/);
});
test('e2e runner: temp connector config rebases to today and serves the demo CSAT fixture', () => {
  assert.match(src, /rebaseToToday:\s*true/);
  assert.match(src, /fixture:\s*'demo'/);
});
test('e2e runner: has the e8 Check CSAT step', () => {
  assert.match(src, /check\('e8 Check CSAT/);
});

test('e2e runner: runs the committed connector directly (the demo CSAT fixture passes the schema, no padded copy)', () => {
  assert.doesNotMatch(src, /padEnd\(36/);
  assert.match(src, /join\(root, 'connector', 'server\.mjs'\)/);
});
