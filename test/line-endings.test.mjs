import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { repinTexts } from '../tools/repin.mjs';

const F = v => `osm-book-of-business-tracker-${v}.html`;
const sha = b => createHash('sha256').update(b).digest('hex');
const git = (...a) => spawnSync('git', a, { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 });
const OLD = 'a'.repeat(64);
const HOSTING = `intro\n\`index.html\` ... Its sha256 is \`${OLD}\`. more\n`;
const VERIFY = `const PINS = {\n  '1.0': '${'b'.repeat(64)}',\n  '1.1': '${OLD}',\n};\n`;

test('line endings: no tracker in the working tree has a CR byte', () => {
  for (const v of ['1.0', '1.1']) assert.equal(readFileSync(F(v)).includes(13), false, F(v) + ' has CR bytes');
});
test('line endings: .gitattributes pins the trackers to eol=lf', () => {
  assert.match(readFileSync('.gitattributes', 'utf8'), /^osm-book-of-business-tracker-\*\.html text eol=lf\s*$/m);
});
test('line endings: git sees both trackers as LF in the working tree', () => {
  const out = git('ls-files', '--eol', F('1.0'), F('1.1')).stdout.toString();
  assert.equal((out.match(/w\/lf/g) || []).length, 2, out);
  assert.doesNotMatch(out, /w\/crlf/);
});
test('line endings: every pin (verify.mjs C8 for 1.0 and 1.1, HOSTING.md for 1.1) equals the working-file sha256', () => {
  const v = readFileSync('tools/sim/osm-day/verify.mjs', 'utf8');
  const hosting = readFileSync('docs/HOSTING.md', 'utf8');
  for (const ver of ['1.0', '1.1']) assert.ok(v.includes(`'${ver}': '${sha(readFileSync(F(ver)))}'`), `verify.mjs pin for ${ver}`);
  assert.ok(hosting.includes(sha(readFileSync(F('1.1')))), 'HOSTING.md pin for 1.1');
});
test('line endings: the 1.0 working file is byte-identical to its committed blob (1.0 content is never edited)', () => {
  assert.equal(sha(readFileSync(F('1.0'))), sha(git('show', 'HEAD:' + F('1.0')).stdout));
});
test('repin: bytes with a CR are refused and nothing is returned', () => {
  assert.throws(() => repinTexts(Buffer.from('a\r\nb\r\n'), HOSTING, VERIFY), /^Error: repin: .*CR/);
});
test('repin: LF bytes update both 1.1 pins to the new sha and leave the 1.0 pin line alone', () => {
  const bytes = Buffer.from('<html>\nx\n</html>\n');
  const r = repinTexts(bytes, HOSTING, VERIFY);
  assert.equal(r.sha, sha(bytes));
  assert.ok(r.hosting.includes('Its sha256 is `' + r.sha + '`') && !r.hosting.includes(OLD));
  assert.ok(r.verify.includes(`'1.1': '${r.sha}'`) && r.verify.includes(`'1.0': '${'b'.repeat(64)}'`) && !r.verify.includes(OLD));
});
test('repin: a missing pin line is an error, not a silent skip', () => {
  assert.throws(() => repinTexts(Buffer.from('x\n'), 'no pin here', VERIFY), /repin: pattern not found in docs\/HOSTING\.md/);
  assert.throws(() => repinTexts(Buffer.from('x\n'), HOSTING, 'no pin here'), /repin: pattern not found in tools\/sim\/osm-day\/verify\.mjs/);
});
