// Task 7: the team-demo launcher starts a fake-adapter connector and a 127.0.0.1:8801 server, and removes all of it on exit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const launcher = join(root, 'tools', 'team-demo.mjs');
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'NODE_TEST_CONTEXT'));

const canConnect = (port) => new Promise((res) => {
  const s = net.connect(port, '127.0.0.1');
  s.once('connect', () => { s.destroy(); res(true); });
  s.once('error', () => res(false));
});
const isFree = async () => !(await canConnect(8801));
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseReady(out) {
  const m = out.match(/^team-demo: ready (http:\/\/127\.0\.0\.1:8801\/) walkthrough=(\S+) built=(\S+) connector-pid=(\d+) pids=([\d,]+) tmp=(\S+) connector=(\S+)$/m);
  assert.ok(m, 'no ready line in: ' + out.slice(-600));
  return { pid: Number(m[4]), tmp: m[6], connector: m[7] };
}
async function assertGone({ pid, tmp, connector }) {
  for (let i = 0; i < 40 && (alive(pid) || existsSync(tmp)); i++) await sleep(250);
  assert.equal(existsSync(tmp), false, 'temp folder still exists: ' + tmp);
  assert.equal(alive(pid), false, 'connector pid still alive');
  assert.equal(await canConnect(8801), false, '8801 still accepting');
  assert.equal(await canConnect(Number(new URL(connector).port)), false, 'connector port still accepting');
}

const skip = (await isFree()) ? false : 'port 8801 is already taken on this machine; not touching it';

test('launcher with --exit-after-ready starts, reports ready and cleans up, twice in a row', { skip }, async () => {
  for (let i = 0; i < 2; i++) {
    const r = spawnSync(process.execPath, [launcher, '--headless', '--no-open', '--exit-after-ready'], { encoding: 'utf8', timeout: 60000, env });
    assert.equal(r.status, 0, (r.stdout || '') + (r.stderr || ''));
    await assertGone(parseReady(r.stdout));
  }
});

test('launcher stops with exit 2 and starts no connector when 8801 is in use', { skip }, async () => {
  const srv = net.createServer();
  await new Promise((res) => srv.listen(8801, '127.0.0.1', res));
  try {
    const r = spawnSync(process.execPath, [launcher, '--headless', '--no-open', '--exit-after-ready'], { encoding: 'utf8', timeout: 60000, env });
    assert.equal(r.status, 2, (r.stdout || '') + (r.stderr || ''));
    assert.match(r.stdout + r.stderr, /team-demo: port 8801 is in use, stopping/);
    assert.doesNotMatch(r.stdout, /connector-pid=/);
  } finally { await new Promise((res) => srv.close(res)); }
});

test('a kept-alive launcher serves the tracker and seed, and /__stop cleans everything up', { skip }, async () => {
  const child = spawn(process.execPath, [launcher, '--headless', '--no-open'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
  try {
    for (let i = 0; i < 240 && !/team-demo: ready/.test(out); i++) await sleep(250);
    const info = parseReady(out);
    for (const p of ['osm-book-of-business-tracker-1.1.html', 'demo-seed.js', 'demo-connector-seed.js']) {
      const res = await fetch('http://127.0.0.1:8801/' + p);
      assert.equal(res.status, 200, p);
      const body = await res.text();
      if (p === 'demo-connector-seed.js') assert.match(body, /obm-connector-settings-v1/);
    }
    assert.equal((await fetch('http://127.0.0.1:8801/', { method: 'GET' }).catch(() => ({ status: 0 }))).status === 500, false);
    await fetch('http://127.0.0.1:8801/__stop').catch(() => {});
    await new Promise((res) => { if (child.exitCode !== null) res(); else { child.once('exit', res); setTimeout(res, 20000); } });
    assert.equal(child.exitCode, 0, out.slice(-500));
    await assertGone(info);
  } finally { if (child.exitCode === null && child.pid) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); }
});
