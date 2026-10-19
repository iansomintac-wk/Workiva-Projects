import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = resolve(ROOT, 'tools', 'l11-csat-panel.mjs');

test('l11-csat panel tool lives in tools/, not under tools/sim/osm-day/', () => {
  assert.ok(existsSync(TOOL), 'tools/l11-csat-panel.mjs must exist');
  assert.ok(!existsSync(resolve(ROOT, 'tools', 'sim', 'osm-day', 'l11-csat-panel.mjs')));
});

test('l11-csat panel tool launches the sim, stops it in a finally, and never names port 8790', () => {
  const src = readFileSync(TOOL, 'utf8');
  assert.ok(src.includes('launch('));
  assert.match(src, /\bfinally\s*\{[^{}]*\bctx\.stop\(\)/, 'ctx.stop() must sit inside a finally { } block');
  assert.ok(!src.includes('8790'));
});

test('l11-csat --control writes its copy exclusively, deletes only what it created, cleans on exit/signal, and the file is gitignored', () => {
  const src = readFileSync(TOOL, 'utf8');
  assert.match(src, /flag:\s*'wx'/, "control file must be written with flag: 'wx'");
  assert.match(src, /\bcreated\b/, 'must track whether this run created the file');
  assert.match(src, /if\s*\(\s*created\s*\)\s*\{?\s*rmSync/, 'must delete only when this run created it');
  assert.match(src, /process\.on\(\s*'exit'/, 'must register an exit cleanup');
  assert.match(src, /'SIGINT'/); assert.match(src, /'SIGTERM'/);
  assert.match(src, /proc\.on\(\s*sig\b/, 'must register a signal cleanup');
  const ign = readFileSync(resolve(ROOT, '.gitignore'), 'utf8').split(/\r?\n/);
  assert.ok(ign.includes('osm-book-of-business-tracker-l11ctl.html'), '.gitignore must list the control file');
});

test('l11-csat panel tool pins the control ref 96c55c0', () => {
  const src = readFileSync(TOOL, 'utf8');
  assert.ok(src.includes('96c55c0'));
  assert.ok(!src.includes('8790'));
});

test('l11-csat --captures screenshots three states to png + txt with a sha256 prefix, and stops the browser in a finally', () => {
  const src = readFileSync(TOOL, 'utf8');
  assert.ok(src.includes('--captures'));
  assert.ok(src.includes('Page.captureScreenshot'));
  assert.ok(src.includes("createHash('sha256')"));
  for (const stem of ['no-contact-goal', 'no-contact-no-goal', 'contact-added']) assert.ok(src.includes(stem), stem);
  assert.match(src, /\bfinally\s*\{[^{}]*\bctx\.stop\(\)/);
});

test('l11-csat --captures clips the graduation confirm box through its own #gc-ok button, not the first .modal in the document', () => {
  const src = readFileSync(TOOL, 'utf8');
  assert.ok(!/document\.querySelector\(\s*'\.modal'\s*\)/.test(src), 'must not take the first .modal');
  assert.match(src, /getElementById\(\s*'gc-ok'\s*\)/);
  assert.match(src, /\bok\.closest\(\s*'\.modal'\s*\)/, "must find the box as #gc-ok's .modal");
  assert.match(src, /\bm\.querySelector\(\s*'#gc-csat'\s*\)/, 'the warning line must be looked up inside that box');
});

// Behavioural: a real launch() (headless Chrome via the sim), then SIGTERM is delivered in-process (process.emit; a real kill does not run handlers on Windows).
// Expect: exit 143, the control copy removed, and no new osmsim-* profile left behind (Chrome was stopped by its PID before exit).
test('l11-csat signal during a sim run: exits 143, removes the control copy and leaves no osmsim profile (Chrome stopped)', { timeout: 120000 }, () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'l11sig-'));
  const copy = resolve(dir, 'control-copy.html');
  const profiles = () => new Set(readdirSync(tmpdir()).filter(n => n.startsWith('osmsim-')));
  const before = profiles();
  const script = `
    import { writeFileSync, rmSync } from 'node:fs';
    const tool = await import(${JSON.stringify(pathToFileURL(TOOL).href)});
    writeFileSync(${JSON.stringify(copy)}, 'x');
    tool.installSignalCleanup(process, () => rmSync(${JSON.stringify(copy)}, { force: true }));
    await tool.inSim(async () => { console.log('READY'); process.emit('SIGTERM', 'SIGTERM'); await new Promise(() => {}); });
  `;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: ROOT, encoding: 'utf8', timeout: 100000 });
  try {
    assert.match(r.stdout || '', /READY/, 'child never reached the sim: ' + (r.stdout || '') + (r.stderr || '').slice(0, 400));
    assert.equal(r.status, 143, 'exit code; stderr: ' + (r.stderr || '').slice(0, 300));
    assert.ok(!existsSync(copy), 'control copy must be removed');
    const leaked = [...profiles()].filter(n => !before.has(n));
    assert.deepEqual(leaked, [], 'Chrome profile left behind (browser not stopped)');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
