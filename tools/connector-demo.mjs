#!/usr/bin/env node
// Fake-data demo of the connector (contract v1). Node only, no browser, no external network.
// Starts `node connector/server.mjs` with FAKE adapters on 127.0.0.1 (free port), with its config,
// token and push log in a temp dir; calls every route with the token; prints a short transcript;
// stops the connector; deletes the temp dir; exits 0. Any failure exits 1.
//   node tools/connector-demo.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'connector-demo-'));
const cfgPath = join(tmp, 'config.json');
const tokenPath = join(tmp, 'token.txt');
const logPath = join(tmp, 'fake-gainsight-log.jsonl');
writeFileSync(cfgPath, JSON.stringify({
  port: 0,
  gong: { adapter: 'fake' }, gainsight: { adapter: 'fake' }, ai: { adapter: 'fake', model: '', apiKey: '' },
}));

const say = (s) => console.log(s);
let child = null;

function startConnector() {
  return new Promise((resolve, reject) => {
    child = spawn(process.execPath, [join(root, 'connector', 'server.mjs')], {
      cwd: root,
      env: { ...process.env, CONNECTOR_CONFIG: cfgPath, CONNECTOR_TOKEN_FILE: tokenPath, CONNECTOR_LOG: logPath },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    const timer = setTimeout(() => reject(new Error(`connector did not start in 10 s: ${out}`)), 10000);
    child.stdout.on('data', (d) => {
      out += d;
      const port = (out.match(/listening http:\/\/127\.0\.0\.1:(\d+)/) || [])[1];
      const token = (out.match(/^token ([0-9a-f]{64})$/m) || [])[1];
      if (port && token) { clearTimeout(timer); resolve({ base: `http://127.0.0.1:${port}`, token }); }
    });
    child.stderr.on('data', (d) => { out += d; });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`connector exited early (${code}): ${out}`)); });
  });
}

function stopConnector() {
  if (!child || child.exitCode !== null) return Promise.resolve();
  return new Promise((r) => { child.removeAllListeners('exit'); child.on('exit', () => r()); child.kill(); });
}

async function main() {
  say('Connector demo: FAKE adapters only, 127.0.0.1 only, nothing leaves this machine.');
  say(`temp: ${tmp}`);
  const { base, token } = await startConnector();
  say(`connector pid: ${child.pid}`);
  say(`connector: ${base} (token ${token.slice(0, 8)}…, from ${tokenPath})`);

  const call = async (method, path, body, auth = true) => {
    const headers = {};
    if (auth) headers.Authorization = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    const r = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    say(`> ${method} ${path}${auth ? '' : ' (no token)'} -> ${r.status}`);
    return { status: r.status, body: await r.json() };
  };
  const expect = (cond, what) => { if (!cond) throw new Error(`unexpected response: ${what}`); };

  const anon = await call('GET', '/v1/health', null, false);
  expect(anon.status === 401, 'tokenless health should be 401');
  say('auth: no token -> 401');

  const health = await call('GET', '/v1/health');
  expect(health.status === 200, 'health');
  const accounts = await call('GET', '/v1/accounts');
  expect(accounts.status === 200, 'accounts');
  const calls = await call('GET', '/v1/calls?since=2026-09-01T00:00:00Z');
  expect(calls.status === 200, 'calls');

  const contactEmails = new Set(accounts.body.accounts.flatMap((a) => (a.contacts || []).map((c) => c.email)));
  const n = { id: 0, name: 0, email: 0, none: 0, touch: 0 };
  for (const c of calls.body.calls) {
    if (c.kind === 'email') n.touch++;
    else if (c.accountRef.gainsightId) n.id++;
    else if (c.accountRef.name) n.name++;
    else if (c.participants.some((p) => contactEmails.has(p.email))) n.email++;
    else n.none++;
  }

  const push = await call('POST', '/v1/push', { items: [
    { id: 'demo-1', kind: 'Pending items batch', customerRef: { gainsightId: 'GS-DEMO-001', name: 'Aldridge Energy' },
      fields: { gates: [{ gateKey: 'csat', contractKey: 'csatContact', gainsightAction: 'FAKE: set CSAT contact' }] } },
    { id: 'demo-2', kind: 'At-Risk CTA', customerRef: { gainsightId: 'GS-DEMO-003', name: 'Corvus Logistics' },
      fields: { ctaName: 'FAKE renewal risk', reason: 'FAKE reason', severity: 'High' } },
    { id: 'demo-3', kind: 'Success Outcome Plan', customerRef: { gainsightId: 'GS-DEMO-002', name: 'Brightwater Foods' },
      fields: { outcomes: ['FAKE outcome'], forceFail: true } },
  ] });
  expect(push.status === 200, 'push');
  const sent = push.body.results.filter((x) => x.status === 'sent').length;
  const failed = push.body.results.filter((x) => x.status === 'failed');
  const logLines = existsSync(logPath) ? readFileSync(logPath, 'utf8').trim().split('\n').length : 0;
  say(`  fake Gainsight log: ${logLines} lines in the temp dir`);

  const ai = await call('POST', '/v1/ai', { task: 'copilot_read', prompt: 'Read my book: 17 accounts, which need me this week?', maxTokens: 200 });
  expect(ai.status === 200 && typeof ai.body.text === 'string', 'ai');

  await stopConnector();
  rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  expect(!existsSync(tmp), 'temp dir removed');

  const a = health.body.adapters;
  say('--- summary ---');
  say(`health: ${a.gong}/${a.gainsight}/${a.ai}`);
  say(`calls: ${calls.body.calls.length} (${n.id} by id, ${n.name} name-only, ${n.email} email-only, ${n.none} unmatchable, ${n.touch} email touch)`);
  say(`accounts: ${accounts.body.accounts.length}`);
  say(`push: ${sent} sent, ${failed.length} failed${failed.length ? ` (${failed.map((f) => f.error.match(/\((.+)\)/)?.[1] || f.error).join(', ')})` : ''}`);
  const t = ai.body.text;
  say(`ai: ${t.length > 60 ? `${t.slice(0, 60)}…` : t}`);
  say('demo: ok, connector stopped, temp files removed');
}

main().catch(async (e) => {
  console.error(`demo failed: ${e.message}`);
  await stopConnector();
  rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  process.exit(1);
});
