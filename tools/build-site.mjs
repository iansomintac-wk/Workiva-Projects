#!/usr/bin/env node
// Runway site builder (D1). No dependencies.
//   node tools/build-site.mjs [--root <dir>]                  build <root>/site from the list below, then run the guard
//   node tools/build-site.mjs --check <dir> [--root <dir>]    run the guard alone on <dir>
// Exit 0 ok. Exit 1 guard failure (stderr names the rule). Exit 2 foreign file in site/, site/ is a link, or missing source.
import { existsSync, readdirSync, readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf('--' + n); return i !== -1 && args[i + 1] ? args[i + 1] : null; };
const root = resolve(opt('root') || join(HERE, '..'));

// THE LIST. Nothing else is ever copied.
const SOURCE = 'osm-book-of-business-tracker-1.1.html';
const NAMES = ['index.html', '.nojekyll'];

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const sha256 = buf => createHash('sha256').update(buf).digest('hex');
const isFile = p => { try { return lstatSync(p).isFile(); } catch { return false; } };   // lstat: a link of any kind is not a plain file
const isLink = p => { try { return lstatSync(p).isSymbolicLink(); } catch { return false; } };

function guard(dir, srcPath) {
  const fails = [];
  const names = existsSync(dir) ? readdirSync(dir) : [];
  const extra = names.filter(n => !NAMES.includes(n));
  const missing = NAMES.filter(n => !names.includes(n));
  const notFiles = NAMES.filter(n => names.includes(n) && !isFile(join(dir, n)));   // right name, wrong kind (a folder)
  if (extra.length || missing.length || notFiles.length) {
    fails.push(`guard (a) failed: the file set must be exactly {${NAMES.join(', ')}}, both plain files; unexpected: [${extra.join(', ')}] missing: [${missing.join(', ')}] not a plain file: [${notFiles.join(', ')}]`);
  }
  const nj = join(dir, '.nojekyll');
  if (isFile(nj) && statSync(nj).size !== 0) fails.push(`guard (d) failed: .nojekyll must be empty (it is ${statSync(nj).size} bytes)`);
  const idx = join(dir, 'index.html');
  if (isFile(idx)) {
    const buf = readFileSync(idx);
    if (sha256(buf) !== sha256(readFileSync(srcPath))) fails.push(`guard (b) failed: index.html differs from ${SOURCE} (sha256 mismatch)`);
    const text = buf.toString('utf8');
    const bad = [...text.matchAll(EMAIL)].filter(m => !/\.invalid$/i.test(m[0]));
    if (bad.length) fails.push(`guard (c) failed: ${bad.length} email-shaped string(s) in index.html (first at character ${bad[0].index}); only addresses ending .invalid are allowed`);
  }
  return fails;
}

const srcPath = join(root, SOURCE);
if (!existsSync(srcPath)) { console.error(`source missing: ${srcPath}`); process.exit(2); }

const checkDir = opt('check');
if (checkDir) {
  const dir = resolve(checkDir), fails = guard(dir, srcPath);
  if (fails.length) { fails.forEach(f => console.error(f)); process.exit(1); }
  console.log(`guard ok: ${NAMES.length} files, index.html sha256 ${sha256(readFileSync(join(dir, 'index.html')))}`);
  process.exit(0);
}

const out = join(root, 'site');
if (isLink(out)) {
  console.error(`site/ is a symlink or junction; refusing to read or write through it (nothing was touched): ${out}`);
  process.exit(2);
}
if (existsSync(out)) {
  const foreign = readdirSync(out, { withFileTypes: true }).filter(e => !NAMES.includes(e.name) || !e.isFile()).map(e => e.name);
  if (foreign.length) {
    console.error(`site/ holds entries that are not plain files on the builder's list, nothing was deleted or written: ${foreign.join(', ')}`);
    process.exit(2);
  }
}
mkdirSync(out, { recursive: true });
copyFileSync(srcPath, join(out, 'index.html'));
writeFileSync(join(out, '.nojekyll'), '');
const fails = guard(out, srcPath);
if (fails.length) {
  fails.forEach(f => console.error(f));
  for (const n of NAMES) rmSync(join(out, n), { force: true });   // never leave a failed build lying around to be uploaded
  process.exit(1);
}
console.log(`built site/: ${NAMES.join(', ')}`);
console.log(`guard ok: ${NAMES.length} files, index.html sha256 ${sha256(readFileSync(join(out, 'index.html')))}`);
