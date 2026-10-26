/* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed).
   Inherited GIT_DIR-style env vars are dropped so they cannot point git at another repo or index, and the data/real
   segment is matched in any case (data/REAL on Windows is the same folder). */
const { spawnSync } = require('child_process');
const DROP = ['GIT_DIR', 'GIT_INDEX_FILE', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY'];
const REAL = /(^|\/)data\/real(\/|$)/i;
function trackedReal(dir) {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (DROP.includes(k.toUpperCase())) delete env[k];
  const r = spawnSync('git', ['-C', dir, 'ls-files', '-z'], { cwd: dir, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
  return { ok: true, files: r.stdout.split('\0').filter((f) => f && REAL.test(f)) };
}
module.exports = { trackedReal };
if (require.main === module) {
  const t = trackedReal(process.cwd());
  if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
  if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
  console.log('data-real-guard ok');
}
