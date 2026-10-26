/* node tests/match-frozen.test.js
   match-frozen and fair-guard: --allow ops lets a card's ops change, nothing else. Edits data/catalogue.json and restores it after each case. */
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const WT = path.join(root, '..');
const catPath = path.join(root, 'data/catalogue.json');
const backup = path.join(os.tmpdir(), 'catalogue-backup-' + process.pid + '.json');
fs.copyFileSync(catPath, backup);
const engPath = path.join(root, 'engine/fit.js'), engBackup = path.join(os.tmpdir(), 'fit-backup-' + process.pid + '.js');
fs.copyFileSync(engPath, engBackup);
const withEngine = (title, fn) => {
  try {
    const before = fs.readFileSync(engPath, 'utf8');
    fs.writeFileSync(engPath, before + '\n// gate-test edit\n');
    ok(title + ': engine edit changed the file', fs.readFileSync(engPath, 'utf8') !== before);
    fn();
  } finally { fs.copyFileSync(engBackup, engPath); }
};
// engine edits by text: change(text) returns the new text; the file is restored afterwards
const withText = (title, change, fn) => {
  try {
    const before = fs.readFileSync(engPath, 'utf8');
    const after = change(before);
    ok(title + ': engine edit changed the file', after !== before);
    fs.writeFileSync(engPath, after);
    fn();
  } finally { fs.copyFileSync(engBackup, engPath); }
};
const withOpsValue = (title, fn) => withText(title, (t) => t.replace('READ: /', 'READ: /(?:)'), fn);
const withGateEdit = (title, fn) => withText(title, (t) => t.replace(/^    let fit;(\r?\n)/m, (m, e) => m + '    /* gate edit */' + e), fn);
const withOpsKey = (title, fn) => withText(title, (t) => t.replace(/^(    READ: .*?)(\r?\n)/m, (m, a, e) => a + ' newkey: /zzqx/,' + e), fn);
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
withEngine('j', () => {
  const r = node(['tests/match-frozen.js', '--base', 'HEAD', '--allow', 'engine']);
  ok('j: engine edit allowed with --allow engine', r.status === 0 && /match-frozen PASS/.test(out(r)));
});
withEngine('k', () => {
  const r = node(['tests/match-frozen.js', '--base', 'HEAD']);
  ok('k: engine edit fails without the flag', r.status === 1 && out(r).includes('engine/fit.js differs'));
});
withEngine('l', () => {
  withEdit('l', addCheck, () => {
    ok('l: ops change still fails with --allow engine', node(['tests/match-frozen.js', '--base', 'HEAD', '--allow', 'engine']).status === 1);
  });
});
withEngine('m', () => {
  withEdit('m', (c) => { c.useCases[0].match = 'zzqx'; }, () => {
    ok('m: match change fails with --allow engine', node(['tests/match-frozen.js', '--base', 'HEAD', '--allow', 'engine']).status === 1);
  });
});
{
  const r = node(['tests/fair-guard.js', '--base', 'HEAD', '--lock-base', 'HEAD', '--allow', 'bogus']);
  ok('n: fair-guard unknown --allow value fails', out(r).includes('unknown --allow value'));
}
withEdit('o', (c) => { c.useCases[0].match = 'zzqx'; }, () => {
  const r = node(['tests/fair-guard.js', '--base', 'HEAD', '--lock-base', 'HEAD', '--allow', 'engine']);
  ok('o: fair-guard --allow engine runs match-frozen', out(r).includes('match-frozen') && out(r).includes('FAIL'));
});
withEngine('p', () => {
  const r = node(['tests/fair-guard.js', '--base', 'HEAD', '--lock-base', 'HEAD', '--allow', 'engine']);
  ok('p: fair-guard --allow engine ignores the engine diff', !out(r).includes('engine/fit.js differs'));
});
const T3 = ['--base', 'HEAD', '--allow', 'tune3'];
const FG3 = ['tests/fair-guard.js', '--base', 'HEAD', '--lock-base', 'HEAD', '--allow', 'tune3'];
const setMatch = (c) => { c.useCases[0].match = 'zzqx'; };
const matchAndOps = (c) => { setMatch(c); addCheck(c); };
withEdit('t3a', matchAndOps, () => {
  const r = node(['tests/match-frozen.js', ...T3]);
  ok('t3a: match and ops change allowed with --allow tune3', r.status === 0 && /match-frozen PASS/.test(out(r)));
});
withEngine('t3b', () => {
  withEdit('t3b', matchAndOps, () => {
    ok('t3b: engine edit plus match and ops allowed with --allow tune3', node(['tests/match-frozen.js', ...T3]).status === 0);
  });
});
withEdit('t3c', (c) => { c.useCases[0].id += 'x'; }, () => {
  ok('t3c: id change fails with --allow tune3', node(['tests/match-frozen.js', ...T3]).status === 1);
});
withEdit('t3d', (c) => { c.useCases[0].area += ' x'; }, () => {
  ok('t3d: area change fails with --allow tune3', node(['tests/match-frozen.js', ...T3]).status === 1);
});
withEdit('t3e', (c) => { const u = c.useCases; [u[0], u[1]] = [u[1], u[0]]; }, () => {
  ok('t3e: card swap fails with --allow tune3', node(['tests/match-frozen.js', ...T3]).status === 1);
});
withEdit('t3f', (c) => { c.useCases.pop(); }, () => {
  ok('t3f: card count change fails with --allow tune3', node(['tests/match-frozen.js', ...T3]).status === 1);
});
withEdit('t3g', (c) => { const u = c.useCases[0]; const k = ['try', 'task', 'prompt'].find((x) => x in u); u[k] = 'zzqx'; }, () => {
  const o = out(node(FG3));
  ok('t3g: fair-guard tune3 flags other fields', o.includes('outside match fields') && !o.includes('unknown --allow value'));
});
withEngine('t3h', () => {
  ok('t3h: fair-guard tune3 rejects an engine edit outside OPS', out(node(FG3)).includes('engine-scope'));
});
withGateEdit('t3i', () => {
  ok('t3i: fair-guard tune3 rejects a gate edit', out(node(FG3)).includes('engine-scope'));
});
withOpsKey('t3i2', () => {
  ok('t3i2: fair-guard tune3 rejects an added OPS key', out(node(FG3)).includes('engine-scope'));
});
withOpsValue('t3j', () => {
  const o = out(node(FG3));
  ok('t3j: fair-guard tune3 accepts an OPS regex value', !o.includes('engine-scope') && !o.includes('unknown --allow value'));
});
withEdit('t3k', setMatch, () => {
  ok('t3k: no-flag match edit still fails', node(['tests/match-frozen.js', '--base', 'HEAD']).status === 1);
});
withEdit('t3k2', addCheck, () => {
  ok('t3k2: no-flag ops edit still fails', node(['tests/match-frozen.js', '--base', 'HEAD']).status === 1);
});
fs.rmSync(backup, { force: true });
fs.rmSync(engBackup, { force: true });
console.log(fails ? `match-frozen tests FAILED: ${fails} of ${n}` : `match-frozen tests pass: ${n}`);
process.exit(fails ? 1 : 0);
