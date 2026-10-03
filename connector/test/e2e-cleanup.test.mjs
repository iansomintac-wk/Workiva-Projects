// connect-ready T-1: e2e cleanup problems are reported as text, never thrown. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { removeDir, waitForExit } from '../../tools/e2e-cleanup.mjs';

installNetGuard();

test('e2e cleanup: an EPERM from rm is returned as one line, not thrown', () => {
  const rm = () => { throw Object.assign(new Error('operation not permitted'), { code: 'EPERM' }); };
  const msg = removeDir('C:/fake/profile', 'Chrome temp profile', rm);
  assert.equal(msg, 'Chrome temp profile not removed (EPERM): C:/fake/profile');
});

test('e2e cleanup: a removable dir is removed, returns null, and rm is asked to retry 12 times', () => {
  const d = mkdtempSync(join(tmpdir(), 'e2e-cleanup-test-'));
  writeFileSync(join(d, 'f.txt'), 'x');
  let opts = null;
  const msg = removeDir(d, 'temp', (p, o) => { opts = o; rmSync(p, o); });
  assert.equal(msg, null);
  assert.equal(existsSync(d), false);
  assert.deepEqual(opts, { recursive: true, force: true, maxRetries: 12, retryDelay: 250 });
});

test('e2e cleanup: waitForExit resolves on exit, and after the timeout when no exit comes', async () => {
  const child = Object.assign(new EventEmitter(), { exitCode: null, signalCode: null });
  const p = waitForExit(child, 5000);
  child.emit('exit', 0);
  await p;
  const t0 = Date.now();
  await waitForExit(Object.assign(new EventEmitter(), { exitCode: null, signalCode: null }), 50);
  assert.ok(Date.now() - t0 >= 45);
  await waitForExit(null, 5000); // no child: resolves at once
});
