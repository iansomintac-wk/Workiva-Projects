import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = resolve(ROOT, 'tools', 'd3-prep-panel.mjs');

test('d3-prep panel tool lives in tools/, not under tools/sim/osm-day/', () => {
  assert.ok(existsSync(TOOL), 'tools/d3-prep-panel.mjs must exist');
  assert.ok(!existsSync(resolve(ROOT, 'tools', 'sim', 'osm-day', 'd3-prep-panel.mjs')));
});

test('d3-prep panel tool launches the sim, stops it in a finally, and never names port 8790', () => {
  const src = readFileSync(TOOL, 'utf8');
  assert.ok(src.includes('launch('));
  assert.match(src, /\bfinally\s*\{[^{}]*\bctx\.stop\(\)/, 'ctx.stop() must sit inside a finally { } block');
  assert.ok(!src.includes('8790'));
});

test('d3-prep --control writes its copy exclusively, deletes only what it created, cleans on exit/signal, and the file is gitignored', () => {
  const src = readFileSync(TOOL, 'utf8');
  assert.match(src, /flag:\s*'wx'/, "control file must be written with flag: 'wx'");
  assert.match(src, /\bcreated\b/, 'must track whether this run created the file');
  assert.match(src, /if\s*\(\s*created\s*\)\s*\{?\s*rmSync/, 'must delete only when this run created it');
  assert.match(src, /process\.on\(\s*'exit'/, 'must register an exit cleanup');
  assert.match(src, /proc\.on\(\s*sig\b/, 'must register a signal cleanup');
  assert.ok(src.includes("'SIGINT'") && src.includes("'SIGTERM'"));
  const ign = readFileSync(resolve(ROOT, '.gitignore'), 'utf8').split(/\r?\n/);
  assert.ok(ign.includes('osm-book-of-business-tracker-d3ctl.html'), '.gitignore must list the control file');
});

// Behavioural: a real launch() (headless Chrome via the sim), then SIGTERM is delivered in-process (process.emit; a real kill does not run handlers on Windows).
// Expect: exit 143, the control copy removed, and no new osmsim-* profile left behind (Chrome was stopped by its PID before exit).
test('d3-prep signal during a sim run: exits 143, removes the control copy and leaves its own osmsim profile (Chrome stopped)', { timeout: 120000 }, () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'd3sig-'));
  const copy = resolve(dir, 'control-copy.html');
  const script = `
    import { writeFileSync, rmSync } from 'node:fs';
    const tool = await import(${JSON.stringify(pathToFileURL(TOOL).href)});
    writeFileSync(${JSON.stringify(copy)}, 'x');
    tool.installSignalCleanup(process, () => rmSync(${JSON.stringify(copy)}, { force: true }));
    await tool.inSim(async ctx => { console.log('PROFILE=' + ctx.profile); console.log('READY'); process.emit('SIGTERM', 'SIGTERM'); await new Promise(() => {}); });
  `;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: ROOT, encoding: 'utf8', timeout: 100000 });
  try {
    assert.match(r.stdout || '', /READY/, 'child never reached the sim: ' + (r.stdout || '') + (r.stderr || '').slice(0, 400));
    assert.equal(r.status, 143, 'exit code; stderr: ' + (r.stderr || '').slice(0, 300));
    assert.ok(!existsSync(copy), 'control copy must be removed');
    const m = /PROFILE=(.+)/.exec(r.stdout || '');
    assert.ok(m, 'child must print the profile folder its own launch() created');
    assert.ok(!existsSync(m[1].trim()), 'this run Chrome profile left behind (browser not stopped): ' + m[1]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
