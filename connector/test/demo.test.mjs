// B4: the fake-data demo (tools/connector-demo.mjs) runs end to end, exits 0, and leaves nothing behind.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const demo = join(root, 'tools', 'connector-demo.mjs');

test('t15 connector demo: six summary lines, exit 0, connector stopped, temp files removed', () => {
  const tokenBefore = existsSync(join(root, 'connector', 'token.txt'));
  const logBefore = existsSync(join(root, 'connector', 'fake-gainsight-log.jsonl'));
  const r = spawnSync(process.execPath, [demo], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.equal(r.status, 0, `exit ${r.status}; stderr: ${r.stderr}`);
  const lines = r.stdout.trim().split(/\r?\n/);
  const tail = lines.slice(-6);
  assert.equal(tail[0], 'health: fake/fake/fake');
  assert.equal(tail[1], 'calls: 6 (2 by id, 1 name-only, 1 email-only, 1 unmatchable, 1 email touch)');
  assert.equal(tail[2], 'accounts: 17');
  assert.equal(tail[3], 'push: 2 sent, 1 failed (forceFail)');
  assert.match(tail[4], /^ai: FAKE AI \(copilot_read\)/);
  assert.equal(tail[5], 'demo: ok, connector stopped, temp files removed');
  assert.ok(lines.includes('auth: no token -> 401'), 'the demo shows a tokenless request refused');

  const tmp = (r.stdout.match(/^temp: (.+)$/m) || [])[1];
  assert.ok(tmp, 'the demo names its temp dir');
  assert.equal(existsSync(tmp), false, 'temp dir (config, token, log) removed');
  const pid = Number((r.stdout.match(/^connector pid: (\d+)$/m) || [])[1]);
  assert.ok(pid > 0, 'the demo names the connector pid');
  assert.throws(() => process.kill(pid, 0), 'connector process is gone');

  assert.equal(existsSync(join(root, 'connector', 'token.txt')), tokenBefore, 'no connector/token.txt created');
  assert.equal(existsSync(join(root, 'connector', 'fake-gainsight-log.jsonl')), logBefore, 'no repo log created');
});
