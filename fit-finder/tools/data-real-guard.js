/* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed). */
const { spawnSync } = require('child_process');
function trackedReal(dir) {
  const r = spawnSync('git', ['ls-files', '--', 'data/real'], { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
  return { ok: true, files: r.stdout.split(/\r?\n/).filter(Boolean) };
}
module.exports = { trackedReal };
if (require.main === module) {
  const t = trackedReal(process.cwd());
  if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
  if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
  console.log('data-real-guard ok');
}
