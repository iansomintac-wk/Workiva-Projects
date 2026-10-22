#!/usr/bin/env node
// Team demo launcher: a fake-adapter connector plus a 127.0.0.1:8801 server for the 1.1 tracker.
//   node tools/team-demo.mjs [--headless] [--no-open] [--exit-after-ready]
// Chrome opens the walkthrough with a fresh --user-data-dir under the temp folder (--headless adds --headless=new and a debugging port; --no-open skips Chrome).
// Everything is loopback and fake (no key, no external network). Temp files live in os.tmpdir()/team-demo-XXXX.
// Ctrl+C, SIGTERM, a crash, Chrome exiting or GET /__stop (from 127.0.0.1) stop every child by PID and delete the temp folder.
// Never touches ports 8790 or 8800. NOT part of the distributable bundle.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { removeDir, waitForExit } from './e2e-cleanup.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const PORT = 8801;
const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const FILES = {
  '/osm-book-of-business-tracker-1.1.html': ['osm-book-of-business-tracker-1.1.html', 'text/html; charset=utf-8'],
  '/walkthrough': ['tools/team-demo/walkthrough.html', 'text/html; charset=utf-8'],
  '/walkthrough.html': ['tools/team-demo/walkthrough.html', 'text/html; charset=utf-8'],
  '/demo-seed.js': ['demo-seed.js', 'text/javascript; charset=utf-8'],
};

let tmp = null, connector = null, chrome = null, server = null, stopping = null, connectorUrl = '', connectorToken = '';

function killTree(child) {
  if (!child || !child.pid || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(child.pid); } catch {} }
}

function shutdown(code) {
  if (stopping) return stopping;
  stopping = (async () => {
    try { if (server) await new Promise((r) => { server.close(r); server.closeAllConnections?.(); setTimeout(r, 2000); }); } catch {}
    killTree(chrome); killTree(connector);
    await waitForExit(chrome, 5000); await waitForExit(connector, 5000);
    await new Promise((r) => setTimeout(r, 300));
    if (tmp) { const p = removeDir(tmp, 'temp folder'); if (p) console.error('team-demo: ' + p); }
    process.exit(code);
  })();
  return stopping;
}

function startConnector() {
  const cfgPath = join(tmp, 'config.json');
  writeFileSync(cfgPath, JSON.stringify({
    port: 0, gong: { adapter: 'fake', rebaseToToday: true }, gainsight: { adapter: 'fake' },
    snowflake: { adapter: 'fake', rebaseToToday: true, fixture: 'demo' }, ai: { adapter: 'fake', model: '', apiKey: '' },
  }));
  return new Promise((resolve, reject) => {
    connector = spawn(process.execPath, [join(root, 'connector', 'server.mjs')], {
      cwd: root,
      env: { ...process.env, CONNECTOR_CONFIG: cfgPath, CONNECTOR_TOKEN_FILE: join(tmp, 'token.txt'), CONNECTOR_LOG: join(tmp, 'push-log.jsonl') },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    const timer = setTimeout(() => reject(new Error(`connector did not start in 15 s: ${out}`)), 15000);
    connector.stdout.on('data', (d) => {
      out += d;
      const port = (out.match(/listening http:\/\/127\.0\.0\.1:(\d+)/) || [])[1];
      const token = (out.match(/^token ([0-9a-f]{64})$/m) || [])[1];
      if (port && token) { clearTimeout(timer); resolve({ url: `http://127.0.0.1:${port}`, token }); }
    });
    connector.stderr.on('data', (d) => { out += d; });
    connector.on('exit', (code) => { clearTimeout(timer); if (!stopping) { console.error(`team-demo: connector exited (${code})`); shutdown(1); } reject(new Error(`connector exited early (${code}): ${out}`)); });
  });
}

function listen() {
  server = createServer((req, res) => {
    const path = (req.url || '/').split('?')[0];
    const local = req.socket.remoteAddress === '127.0.0.1' || req.socket.remoteAddress === '::ffff:127.0.0.1';
    if (path === '/__stop') {
      if (!local) { res.writeHead(403).end(); return; }
      res.writeHead(200, { 'content-type': 'text/plain' }).end('stopping\n');
      setImmediate(() => shutdown(0));
      return;
    }
    if (path === '/demo-connector-seed.js') {
      const body = `try{localStorage.setItem('obm-connector-settings-v1',${JSON.stringify(JSON.stringify({ url: connectorUrl, token: connectorToken }))});}catch(e){}\n`;
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' }).end(body);
      return;
    }
    const f = FILES[path];
    if (!f || (req.method !== 'GET' && req.method !== 'HEAD')) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': f[1], 'cache-control': 'no-store' }).end(readFileSync(join(root, f[0])));
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', resolve);
  });
}

async function main() {
  try { await listen(); }
  catch (e) {
    if (e && e.code === 'EADDRINUSE') { console.log('team-demo: port 8801 is in use, stopping'); process.exit(2); }
    throw e;
  }
  tmp = mkdtempSync(join(tmpdir(), 'team-demo-'));
  const c = await startConnector();
  connectorUrl = c.url; connectorToken = c.token;
  const base = `http://127.0.0.1:${PORT}/`;
  const profile = join(tmp, 'chrome-profile');
  if (!args.has('--no-open')) {
    const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
    if (chromePath) {
      const flags = args.has('--headless') ? ['--headless=new', '--remote-debugging-port=0'] : [];
      chrome = spawn(chromePath, [...flags, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', base + 'walkthrough'], { stdio: 'ignore' });
      chrome.on('exit', () => { if (!stopping) shutdown(0); });
    } else console.error('team-demo: no Chrome or Edge found; open ' + base + 'walkthrough yourself');
  }
  const pids = [process.pid, connector.pid, chrome && chrome.pid].filter(Boolean).join(',');
  console.log(`team-demo: ready ${base} walkthrough=${base}walkthrough built=${base}osm-book-of-business-tracker-1.1.html connector-pid=${connector.pid} pids=${pids} tmp=${tmp} chrome-profile=${profile} connector=${connectorUrl}`);
  if (args.has('--exit-after-ready')) await shutdown(0);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('uncaughtException', (e) => { console.error('team-demo: crash: ' + (e && e.stack || e)); shutdown(1); });
process.on('unhandledRejection', (e) => { console.error('team-demo: crash: ' + (e && e.stack || e)); shutdown(1); });
main();
