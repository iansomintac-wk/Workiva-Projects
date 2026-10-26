/* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
   (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
// fixture setup git: inherited GIT_* vars dropped so it can only touch the throwaway repo; any failure stops the test
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.toUpperCase().startsWith('GIT_')));
const git = (cwd, ...args) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: cleanEnv });
  if (r.status !== 0) fail(`setup git ${args.join(' ')}: exit ${r.status} ${(r.stderr || '').trim()}`);
  return r;
};

// throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
if (git(repo, 'init', '-q').status !== 0) fail('git init');
fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
git(repo, 'add', 'fit-finder/README.md');

// a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
const ev = path.join(tmp, 'ev.md');
fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
const gate = (env = {}) => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8', env: { ...process.env, ...env } });
const guard = (cwd, env = {}) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp, ...env } });
let n = 0;
const expect = (name, r, code, re) => {
  n++;
  if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
};

// 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
expect('untracked gate', gate(), 0, /^gate-check ok before/);

// 3-5. tracked: git add a file under data/real, and both fail naming it
git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
const t = trackedReal(ff);
if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
n++;

// 6-15. inherited git env vars that point git at another repo, index or tree must not hide the tracked file
const other = path.join(tmp, 'other');
fs.mkdirSync(other);
git(other, 'init', '-q');
const misleading = {
  GIT_DIR: path.join(other, '.git'),
  GIT_INDEX_FILE: path.join(tmp, 'empty-index'),
  GIT_WORK_TREE: other,
  GIT_COMMON_DIR: path.join(other, '.git'),
  GIT_OBJECT_DIRECTORY: path.join(other, '.git', 'objects'),
};
for (const [k, v] of Object.entries(misleading)) {
  expect(`${k} guard`, guard(ff, { [k]: v }), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
  expect(`${k} gate`, gate({ [k]: v }), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
}

// 16-17. an accidental git init inside fit-finder/ must not hide the outer repo's index
git(ff, 'init', '-q');
expect('nested repo guard', guard(ff), 1, /data-real-guard FAIL: git found repo root/);
expect('nested repo gate', gate(), 1, /gate-check FAIL: .*git found repo root/);
fs.rmSync(path.join(ff, '.git'), { recursive: true, force: true });

// 18. untrack again: passes again
git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
expect('untracked again gate', gate(), 0, /^gate-check ok before/);

// 19-21. a case variant (data/REAL) is caught too; put straight in the index so the test does not depend on the disk's case rules
const blob = git(repo, 'hash-object', '-w', 'fit-finder/data/real/fake.jsonl').stdout.trim();
git(repo, 'update-index', '--add', '--cacheinfo', `100644,${blob},fit-finder/data/REAL/x.jsonl`);
expect('case variant guard', guard(ff), 1, /data-real-guard FAIL: .*data\/REAL\/x\.jsonl/);
expect('case variant gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/REAL\/x\.jsonl/);
git(repo, 'update-index', '--force-remove', 'fit-finder/data/REAL/x.jsonl');
expect('case variant removed gate', gate(), 0, /^gate-check ok before/);

// 22. fails closed outside a git repo (git ls-files errors)
const bare = path.join(tmp, 'not-a-repo');
fs.mkdirSync(bare);
expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`data-real-guard-selftest ok (${n} checks)`);
