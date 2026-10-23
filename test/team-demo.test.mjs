// Task 7: the team-demo launcher starts a fake-adapter connector and a 127.0.0.1:8801 server, and removes all of it on exit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import net from 'node:net';
import http from 'node:http';
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
  const m = out.match(/^team-demo: ready (http:\/\/127\.0\.0\.1:8801\/) walkthrough=(\S+) built=(\S+) connector-pid=(\d+) pids=([\d,]+) tmp=(\S+) chrome-profile=(\S+) connector=(\S+)$/m);
  assert.ok(m, 'no ready line in: ' + out.slice(-600));
  return { pid: Number(m[4]), tmp: m[6], profile: m[7], connector: m[8] };
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

test('walkthrough page has five steps, fake/unproven health, and only loopback URLs; Chrome profile is under the temp folder', { skip }, async () => {
  const child = spawn(process.execPath, [launcher, '--headless', '--no-open'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
  try {
    for (let i = 0; i < 240 && !/team-demo: ready/.test(out); i++) await sleep(250);
    const info = parseReady(out);
    assert.ok(info.profile.startsWith(info.tmp), 'chrome profile not under temp: ' + info.profile);
    assert.match(info.profile, /chrome-profile$/);
      assert.doesNotMatch(info.profile.split(String.fromCharCode(92)).join('/'), /Google\/Chrome\/User Data|Chrome\/Default/i);
    const res = await fetch('http://127.0.0.1:8801/walkthrough');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    const html = await res.text();
    const heads = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    assert.deepEqual(heads, ['Check for calls', 'Read Gainsight accounts', 'Check CSAT', 'Send to Gainsight', 'Health']);
    assert.equal((html.match(/^\s*<p class="real">What the real connector does:/gm) || []).length, 5);
    assert.match(html, /\/v1\/health/);
    assert.match(html, /Bearer/);
    assert.match(html, /fake/); assert.match(html, /unproven/);
    assert.match(html, /href="\/practice"/);
    const urls = html.match(/https?:\/\/[^\s"'<>)]+/g) || [];
    for (const u of urls) assert.match(u, /^https?:\/\/(127\.0\.0\.1|localhost)([:\/]|$)/, 'external URL: ' + u);
    await fetch('http://127.0.0.1:8801/__stop').catch(() => {});
    await new Promise((r) => { if (child.exitCode !== null) r(); else { child.once('exit', r); setTimeout(r, 20000); } });
    await assertGone(info);
  } finally { if (child.exitCode === null && child.pid) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); }
});

function connectorPassCount() {
  const dir = join(root, 'connector', 'test');
  const files = readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => join('connector', 'test', f));
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...files], { cwd: root, encoding: 'utf8', timeout: 120000, env });
  const out = (r.stdout || '') + (r.stderr || '');
  return { pass: Number((out.match(/^ℹ pass (\d+)$/m) || [])[1]), fail: Number((out.match(/^ℹ fail (\d+)$/m) || [])[1]) };
}

test('/built and /built.json show the live connector suite, the adapters and dated evidence counts', { skip }, async () => {
  const child = spawn(process.execPath, [launcher, '--headless', '--no-open'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
  try {
    for (let i = 0; i < 240 && !/team-demo: ready/.test(out); i++) await sleep(250);
    const info = parseReady(out);
    assert.match(out, /built=http:\/\/127\.0\.0\.1:8801\/built(\s|$)/);
    const second = connectorPassCount();
    const j = await (await fetch('http://127.0.0.1:8801/built.json')).json();
    assert.ok(j.connector.tests > 0);
    assert.equal(j.connector.pass, second.pass);
    assert.equal(j.connector.fail, 0);
    assert.ok(j.connector.ranAt);
    for (const k of ['gong', 'gainsight', 'ai', 'snowflake']) assert.equal(typeof j.adapters[k], 'string', k);
    assert.ok(j.evidence.length >= 5);
    for (const e of j.evidence) { assert.ok(e.label && e.commit && e.date, JSON.stringify(e)); assert.equal(typeof e.count, 'number'); }
    const res = await fetch('http://127.0.0.1:8801/built');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    const html = await res.text();
    for (const phrase of ['127.0.0.1 only', 'bearer token', 'dry-run by default', 'write gate', 'sandbox first', 'idempotent item ids', 'offline rule']) {
      assert.ok(html.toLowerCase().includes(phrase), 'missing rail: ' + phrase);
    }
    for (const k of ['gong', 'gainsight', 'ai', 'snowflake']) assert.match(html, new RegExp(`data-adapter="${k}"[^>]*>[^<]*\\b(fake|unproven)\\b`), k);
    for (const e of j.evidence) assert.ok(html.includes(e.commit) && html.includes(e.date) && html.includes(String(e.count)), e.label);
    await fetch('http://127.0.0.1:8801/__stop').catch(() => {});
    await new Promise((r) => { if (child.exitCode !== null) r(); else { child.once('exit', r); setTimeout(r, 20000); } });
    await assertGone(info);
  } finally { if (child.exitCode === null && child.pid) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); }
});

test('built.html has no typed count literals; counts come from the evidence file', () => {
  const p = join(root, 'tools', 'team-demo', 'built.html');
  assert.ok(existsSync(p), 'built.html missing');
  assert.doesNotMatch(readFileSync(p, 'utf8'), /\b(503|475|180|72)\b/);
});

// Task 9: the Evidence counts table on the /built page reads docs/evidence/team-demo-counts.json; its counts must be
// the same numbers README.txt tells people to expect (the file once said 503 while the suite defined 564).
test('team-demo-counts.json: 1.1, 1.0, guide and step 1 counts equal the --expect numbers in README.txt', () => {
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const readme = readFileSync(join(root, 'README.txt'), 'utf8').replace(/\r\n/g, '\n').split('\n').map(norm);
  const counts = JSON.parse(readFileSync(join(root, 'docs', 'evidence', 'team-demo-counts.json'), 'utf8'));
  const byLabel = Object.fromEntries(counts.entries.map((e) => [e.label, e]));
  for (const label of ['Tracker 1.1 self-check', 'Tracker 1.0 self-check', 'Onboarding guide self-check', 'Step 1 probe']) {
    const e = byLabel[label];
    assert.ok(e, 'no entry: ' + label);
    const own = Number(norm(e.command).match(/--expect (\d+)$/)[1]);
    const lines = readme.filter((l) => l.includes(norm(e.command).replace(/ --expect \d+$/, '') + ' --expect '));
    assert.ok(lines.length > 0, label + ': its command is not in README.txt');
    for (const l of lines) {
      const n = Number(l.match(/--expect (\d+)/)[1]);
      assert.equal(e.count, n, label + ': json count ' + e.count + ' != README --expect ' + n);
      assert.equal(own, n, label + ': json command --expect ' + own + ' != README --expect ' + n);
    }
  }
});

// Fix A / M1 + S2: the walkthrough opens a practice-book entry the launcher seeds with fake data only; other origins get no token and cannot stop it.
// Raw request so the test can set Host / Origin / Sec-Fetch-Site exactly like a browser page would.
const get = (path, headers = {}) => new Promise((res, rej) => {
  const r = http.request({ host: '127.0.0.1', port: 8801, path, method: 'GET', headers }, (resp) => {
    let b = ''; resp.on('data', (d) => { b += d; }); resp.on('end', () => res({ status: resp.statusCode, body: b }));
  });
  r.on('error', rej); r.end();
});

test('walkthrough practice path: seeded entry, cross-site refusals, same-origin still works, /__stop obeys the same rule', { skip }, async () => {
  const child = spawn(process.execPath, [launcher, '--no-open'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
  try {
    for (let i = 0; i < 240 && !/team-demo: ready/.test(out); i++) await sleep(250);
    assert.match(out, /team-demo: ready/);
    // M1: every walkthrough button opens the practice entry, not the bare (empty) tracker.
    const wt = (await get('/walkthrough')).body;
    assert.equal((wt.match(/href="\/practice"/g) || []).length, 5, 'five Open-the-tracker buttons go to /practice');
    assert.doesNotMatch(wt, /href="\/osm-book-of-business-tracker-1\.1\.html"/);
    // /practice is the tracker plus the practice loader.
    const page = await get('/practice');
    assert.equal(page.status, 200);
    assert.match(page.body, /<script src="\/demo-practice\.js"><\/script>\s*<\/body>/);
    const loader = await get('/demo-practice.js');
    assert.equal(loader.status, 200);
    assert.match(loader.body, /001DEMO/, 'loader carries the fake practice book');
    assert.match(loader.body, /forceFail/, 'loader carries the fake send queue (one set to fail)');
    assert.match(loader.body, /confirm\(/, 'a book that already has data is replaced only after a confirm');
    assert.match(loader.body, /obm-connector-settings-v1|saveConnectorSettings/);
    const token = (loader.body.match(/[0-9a-f]{64}/) || [])[0];
    assert.ok(token, 'same-origin loader carries the connector token');
    // S2: a page from another origin gets neither the token nor a way to stop the launcher.
    const bad = [{ origin: 'http://evil.example' }, { origin: 'null' }, { 'sec-fetch-site': 'cross-site' }, { host: 'evil.example:8801' }];
    for (const p of ['/demo-connector-seed.js', '/demo-practice.js']) {
      for (const h of bad) { const r = await get(p, h); assert.equal(r.status, 403, p + ' ' + JSON.stringify(h)); assert.doesNotMatch(r.body, /[0-9a-f]{64}/); }
      const ok = await get(p, { origin: 'http://127.0.0.1:8801', 'sec-fetch-site': 'same-origin' });
      assert.equal(ok.status, 200); assert.match(ok.body, new RegExp(token));
    }
    for (const h of bad) assert.equal((await get('/__stop', h)).status, 403, '/__stop ' + JSON.stringify(h));
    assert.equal(child.exitCode, null, 'launcher still running after the refused stops');
    assert.equal((await get('/__stop')).status, 200);
    await new Promise((res) => { if (child.exitCode !== null) res(); else { child.once('exit', res); setTimeout(res, 20000); } });
    assert.equal(child.exitCode, 0, out.slice(-400));
  } finally { if (child.exitCode === null && child.pid) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); }
});

