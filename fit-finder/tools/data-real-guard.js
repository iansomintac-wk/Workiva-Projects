/* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed).
   Inherited GIT_DIR-style env vars are dropped so they cannot point git at another repo or index, and the data/real
   segment is matched in any case (data/REAL on Windows is the same folder). The repo git finds must be the one whose
   root is fit-finder's parent, so an accidental git init inside fit-finder/ cannot hide the real index. */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const norm = (p) => { const r = fs.realpathSync.native(p); return process.platform === 'win32' ? r.toLowerCase() : r; };
const DROP = ['GIT_DIR', 'GIT_INDEX_FILE', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY'];
const REAL = /(^|\/)data\/real(\/|$)/i;
function trackedReal(dir) {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (DROP.includes(k.toUpperCase())) delete env[k];
  const r = spawnSync('git', ['-C', dir, 'ls-files', '-z'], { cwd: dir, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
  const top = spawnSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { cwd: dir, encoding: 'utf8', env });
  if (top.status !== 0) return { ok: false, error: 'git rev-parse failed: ' + (top.error ? top.error.message : (top.stderr || '').trim()) };
  const want = path.resolve(dir, '..');
  let same = false;
  try { same = norm(top.stdout.trim()) === norm(want); } catch (e) { /* unresolvable path: not the same repo */ }
  if (!same) return { ok: false, error: `git found repo root ${top.stdout.trim()}, expected ${want} (a nested repo inside fit-finder?)` };
  return { ok: true, files: r.stdout.split('\0').filter((f) => f && REAL.test(f)) };
}
module.exports = { trackedReal };
if (require.main === module) {
  const t = trackedReal(process.cwd());
  if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
  if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
  console.log('data-real-guard ok');
}
