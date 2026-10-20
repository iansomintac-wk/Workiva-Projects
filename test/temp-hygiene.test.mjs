import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

test('NL-4 hygiene: X1 and X3 point TMP/TEMP/TMPDIR at a private folder before they count leftovers', () => {
  for (const f of ['test/osm-day-safety.test.mjs', 'test/selfcheck-exit.test.mjs']) {
    const s = readFileSync(f, 'utf8');
    assert.match(s, /process\.env\.TMP\s*=/, f);
    assert.match(s, /mkdtempSync\(join\(realTmp,/, f);
  }
});
test('NL-4 hygiene: X1 and X3 still pass, and really run, while another process keeps creating osmsim-/fieldtest- folders in the shared temp folder', async () => {
  const shared = tmpdir();
  const writer = spawn(process.execPath, ['-e', `const fs=require('fs'),p=require('path'),d=${JSON.stringify(shared)};let i=0;const made=[];const t=setInterval(()=>{for(const pre of ['osmsim-','fieldtest-']){const n=p.join(d,pre+'load'+process.pid+'-'+(i++));fs.mkdirSync(n);made.push(n);}},25);process.on('SIGTERM',()=>{clearInterval(t);for(const n of made)try{fs.rmSync(n,{recursive:true,force:true})}catch{};process.exit(0)});`], { stdio: 'ignore' });
  assert.ok(writer.pid, 'the load writer did not start');
  try {
    await new Promise(r => setTimeout(r, 300));
    const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', '--test-name-pattern=^X1 spawn error|^X3 field-test spawn error', 'test/osm-day-safety.test.mjs', 'test/selfcheck-exit.test.mjs'], { encoding: 'utf8', timeout: 300000, env: Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'NODE_TEST_CONTEXT')) });
    const out = (r.stdout || '') + (r.stderr || '');
    assert.equal(r.status, 0, out.slice(-800));
    assert.match(out, /✔ X1 spawn error/, 'X1 did not run: ' + out.slice(-400));
    assert.match(out, /✔ X3 field-test spawn error/, 'X3 did not run: ' + out.slice(-400));
    assert.match(out, /ℹ pass 2\b/); assert.match(out, /ℹ fail 0\b/);
  } finally {
    writer.kill('SIGTERM');                                    // the writer is our own child: stop it by its PID only
    await new Promise(r => setTimeout(r, 500));
    const mine = [`osmsim-load${writer.pid}-`, `fieldtest-load${writer.pid}-`];
    for (const n of readdirSync(shared).filter(x => mine.some(p => x.startsWith(p)))) {
      const full = resolve(join(shared, n));
      if (full.startsWith(resolve(shared) + sep)) rmSync(full, { recursive: true, force: true });   // only this writer's folders, only under the temp dir
    }
  }
});
