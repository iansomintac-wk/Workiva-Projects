import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const BUILDER = resolve('tools/build-site.mjs');
const SRC = 'osm-book-of-business-tracker-1.1.html';
const sha = b => createHash('sha256').update(b).digest('hex');
const mkRoot = (html = '<html><body>fixture book, no addresses</body></html>') => {
  const root = mkdtempSync(join(tmpdir(), 'build-site-test-'));
  writeFileSync(join(root, SRC), html);
  return root;
};
const run = (...a) => spawnSync(process.execPath, [BUILDER, ...a], { encoding: 'utf8' });
const cleanup = r => rmSync(r, { recursive: true, force: true });

test('C1 builder writes exactly index.html (same sha256 as the source) and an empty .nojekyll', () => {
  const root = mkRoot();
  try {
    const r = run('--root', root);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(readdirSync(join(root, 'site')).sort(), ['.nojekyll', 'index.html']);
    assert.equal(sha(readFileSync(join(root, 'site/index.html'))), sha(readFileSync(join(root, SRC))));
    assert.equal(readFileSync(join(root, 'site/.nojekyll')).length, 0);
    assert.match(r.stdout, /guard ok: 2 files, index\.html sha256 [0-9a-f]{64}/);
  } finally { cleanup(root); }
});

test('C2a guard (a): a stray RESTORE-POINT.json in the output dir exits 1 and names the rule', () => {
  const root = mkRoot();
  try {
    assert.equal(run('--root', root).status, 0);
    writeFileSync(join(root, 'site/RESTORE-POINT.json'), '{}');
    const r = run('--check', join(root, 'site'), '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(a\)/);
    assert.match(r.stderr, /RESTORE-POINT\.json/);
  } finally { cleanup(root); }
});

test('C2b guard (c): an email-shaped string (x@example.com) inside index.html exits 1 and names the rule', () => {
  const root = mkRoot('<html>contact x@example.com</html>');
  try {
    const dir = join(root, 'out'); mkdirSync(dir);
    writeFileSync(join(dir, 'index.html'), readFileSync(join(root, SRC)));   // same bytes, so only (c) can fail
    writeFileSync(join(dir, '.nojekyll'), '');
    const r = run('--check', dir, '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(c\)/);
    assert.doesNotMatch(r.stderr, /example\.com/, 'the matched text must not be printed');
  } finally { cleanup(root); }
});

test('C2c guard (b): one byte changed in index.html exits 1 and names the rule', () => {
  const root = mkRoot();
  try {
    assert.equal(run('--root', root).status, 0);
    const f = join(root, 'site/index.html');
    const b = readFileSync(f); b[b.length - 2] = b[b.length - 2] ^ 1; writeFileSync(f, b);
    const r = run('--check', join(root, 'site'), '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(b\)/);
  } finally { cleanup(root); }
});

test('C2d a@b.invalid passes the guard', () => {
  const root = mkRoot('<html>placeholder a@b.invalid only</html>');
  try {
    const r = run('--root', root);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(run('--check', join(root, 'site'), '--root', root).status, 0);
  } finally { cleanup(root); }
});

test('C2e guard (a): a FOLDER named index.html (right name, wrong kind) exits 1 and names the rule', () => {
  const root = mkRoot();
  try {
    const dir = join(root, 'out'); mkdirSync(dir); mkdirSync(join(dir, 'index.html'));
    writeFileSync(join(dir, '.nojekyll'), '');
    const r = run('--check', dir, '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(a\)/);
    assert.match(r.stderr, /index\.html/);
  } finally { cleanup(root); }
});

test('C3 builder refuses a site/ that holds a foreign file: exit 2, names it, deletes nothing', () => {
  const root = mkRoot();
  try {
    mkdirSync(join(root, 'site'));
    writeFileSync(join(root, 'site/keep.txt'), 'mine');
    const r = run('--root', root);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /keep\.txt/);
    assert.equal(readFileSync(join(root, 'site/keep.txt'), 'utf8'), 'mine');
    assert.equal(existsSync(join(root, 'site/index.html')), false);
  } finally { cleanup(root); }
});

test('rebuild: a site/ holding only listed names is replaced with the new source', () => {
  const root = mkRoot('<html>one</html>');
  try {
    assert.equal(run('--root', root).status, 0);
    writeFileSync(join(root, SRC), '<html>two</html>');
    assert.equal(run('--root', root).status, 0);
    assert.equal(readFileSync(join(root, 'site/index.html'), 'utf8'), '<html>two</html>');
  } finally { cleanup(root); }
});

test('a build whose source trips the guard exits 1 and leaves no index.html behind', () => {
  const root = mkRoot('<html>leak x@example.com</html>');
  try {
    const r = run('--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(c\)/);
    assert.equal(existsSync(join(root, 'site/index.html')), false);
  } finally { cleanup(root); }
});

test('FX2 builder refuses a site/ that is a junction/symlink: exit 2, names the rule, target untouched', t => {
  const root = mkRoot(), target = mkdtempSync(join(tmpdir(), 'build-site-target-'));
  try {
    try { symlinkSync(target, join(root, 'site'), 'junction'); }
    catch (e) { return t.skip('could not create a junction here: ' + (e.code || e.message)); }
    const r = run('--root', root);
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stderr, /symlink or junction/);
    assert.deepEqual(readdirSync(target), []);
  } finally { cleanup(root); cleanup(target); }
});

test('FX3a guard (a): a .nojekyll that is a symlink to an empty file exits 1 and names the rule (skipped if file symlinks cannot be made here)', t => {
  const root = mkRoot();
  try {
    const dir = join(root, 'out'); mkdirSync(dir);
    writeFileSync(join(dir, 'index.html'), readFileSync(join(root, SRC)));
    writeFileSync(join(root, 'empty.txt'), '');
    try { symlinkSync(join(root, 'empty.txt'), join(dir, '.nojekyll'), 'file'); }
    catch (e) { return t.skip('could not create a file symlink on this machine: ' + (e.code || e.message)); }
    const r = run('--check', dir, '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(a\)/);
    assert.match(r.stderr, /\.nojekyll/);
  } finally { cleanup(root); }
});

test('FX3a2 guard (a): index.html that is a directory junction exits 1 and names the rule', t => {
  const root = mkRoot();
  try {
    const dir = join(root, 'out'); mkdirSync(dir); mkdirSync(join(root, 'real'));
    writeFileSync(join(dir, '.nojekyll'), '');
    try { symlinkSync(join(root, 'real'), join(dir, 'index.html'), 'junction'); }
    catch (e) { return t.skip('could not create a junction here: ' + (e.code || e.message)); }
    const r = run('--check', dir, '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(a\)/);
  } finally { cleanup(root); }
});

test('FX3b guard (d): a non-empty .nojekyll exits 1 and names the rule', () => {
  const root = mkRoot();
  try {
    const dir = join(root, 'out'); mkdirSync(dir);
    writeFileSync(join(dir, 'index.html'), readFileSync(join(root, SRC)));
    writeFileSync(join(dir, '.nojekyll'), 'x');
    const r = run('--check', dir, '--root', root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /guard \(d\)/);
    assert.match(r.stderr, /\.nojekyll/);
  } finally { cleanup(root); }
});
