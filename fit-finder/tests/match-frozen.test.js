/* node tests/match-frozen.test.js
   match-frozen and fair-guard: --allow ops lets a card's ops change, nothing else. Edits data/catalogue.json and restores it after each case. */
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const WT = path.join(root, '..');
const catPath = path.join(root, 'data/catalogue.json');
const backup = path.join(os.tmpdir(), 'catalogue-backup-' + process.pid + '.json');
fs.copyFileSync(catPath, backup);
let n = 0, fails = 0;
const ok = (title, cond) => { n++; if (!cond) { fails++; console.log('FAIL: ' + title); } };
const node = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
const out = (r) => (r.stdout || '') + (r.stderr || '');
const git = (args) => spawnSync('git', args, { cwd: WT, encoding: 'utf8' });
// edit(cat) mutates the parsed catalogue; the file is restored afterwards
const withEdit = (title, edit, fn) => {
  try {
    const before = fs.readFileSync(catPath, 'utf8');
    const cat = JSON.parse(before);
    edit(cat);
    const after = JSON.stringify(cat, null, 2) + '\n';
    ok(title + ': edit changed the file', JSON.stringify(JSON.parse(before)) !== JSON.stringify(JSON.parse(after)));
    fs.writeFileSync(catPath, after);
    fn();
  } finally { fs.copyFileSync(backup, catPath); }
};
const addCheck = (c) => { const u = c.useCases[0]; if (!u.ops.includes('CHECK')) u.ops.push('CHECK'); else u.ops = u.ops.filter((o) => o !== 'CHECK'); };

withEdit('a', addCheck, () => {
  const r = node(['tests/match-frozen.js', '--base', 'HEAD', '--allow', 'ops']);
  ok('a: ops change allowed with --allow ops', r.status === 0 && /match-frozen PASS/.test(out(r)));
});
withEdit('b', addCheck, () => {
  ok('b: ops change fails without the flag', node(['tests/match-frozen.js', '--base', 'HEAD']).status === 1);
});
withEdit('c', (c) => { c.useCases[0].match = 'zzqx'; }, () => {
  ok('c: match change fails with --allow ops', node(['tests/match-frozen.js', '--base', 'HEAD', '--allow', 'ops']).status === 1);
});
withEdit('d', (c) => { c.useCases[0].area = c.useCases[0].area + ' x'; }, () => {
  ok('d: area change fails', node(['tests/match-frozen.js', '--base', 'HEAD', '--allow', 'ops']).status === 1);
});
withEdit('e', (c) => { c.useCases[0].id = c.useCases[0].id + '-x'; }, () => {
  ok('e: id change fails', node(['tests/match-frozen.js', '--base', 'HEAD', '--allow', 'ops']).status === 1);
});
{
  const eng = git(['log', '--format=%H', '-n', '1', '--', ':(top)fit-finder/engine/fit.js']).stdout.trim();
  const par = eng + '^';
  const a = git(['rev-parse', '--verify', eng + '^{commit}']), b = git(['rev-parse', '--verify', par + '^{commit}']);
  ok('engine commit and its parent resolve', a.status === 0 && b.status === 0 && a.stdout.trim().length === 40 && b.stdout.trim().length === 40);
  const r = node(['tests/match-frozen.js', '--base', b.stdout.trim()]);
  ok('f: engine difference is reported', r.status === 1 && out(r).includes('engine/fit.js differs'));
}
{
  const r = node(['tests/match-frozen.js', '--base', 'HEAD', '--allow', 'bogus']);
  ok('g: unknown --allow value fails', r.status === 1 && out(r).includes('unknown --allow value'));
}
withEdit('h', addCheck, () => {
  const r = node(['tests/fair-guard.js', '--base', 'HEAD', '--lock-base', 'HEAD', '--allow', 'ops']);
  ok('h: fair-guard --allow ops ignores ops', !out(r).includes('differs from base outside match fields'));
});
withEdit('i', addCheck, () => {
  const r = node(['tests/fair-guard.js', '--base', 'HEAD', '--lock-base', 'HEAD']);
  ok('i: fair-guard without the flag flags ops', out(r).includes('differs from base outside match fields'));
});
fs.rmSync(backup, { force: true });
console.log(fails ? `match-frozen tests FAILED: ${fails} of ${n}` : `match-frozen tests pass: ${n}`);
process.exit(fails ? 1 : 0);
