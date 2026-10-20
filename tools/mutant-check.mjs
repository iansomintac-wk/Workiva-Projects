// Run tests against a mutated COPY of the 1.1 tracker (the real file is never written).
// usage: node tools/mutant-check.mjs --find "<exact text, once>" --replace "<text>" -- test/a.test.mjs [more tests]
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const a = process.argv.slice(2), dd = a.indexOf('--');
const arg = n => { const i = a.indexOf(n); return i >= 0 && (dd < 0 || i < dd) ? a[i + 1] : undefined; };
const find = arg('--find'), rep = arg('--replace'), tests = dd < 0 ? [] : a.slice(dd + 1);
if (find === undefined || rep === undefined || !tests.length) { console.error('usage: --find X --replace Y -- test files'); process.exit(2); }
const src = readFileSync('osm-book-of-business-tracker-1.1.html', 'utf8').replace(/\r\n/g, '\n');
const n = src.split(find).length - 1;
if (n !== 1) { console.error('NEEDLE-COUNT ' + n + ' (must be exactly 1)'); process.exit(2); }
let code = 2;
const dir = mkdtempSync(join(tmpdir(), 'mutant-'));
try {
  const f = join(dir, 'mutant.html');
  writeFileSync(f, src.replace(find, () => rep));
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...tests], { env: { ...process.env, NODE_TEST_CONTEXT: undefined, CSAT_HTML_PATH: f }, encoding: 'utf8' });
  const killed = r.status !== 0;
  console.log(killed ? 'MUTANT KILLED (the tests failed, as they must)' : 'MUTANT SURVIVED (the tests still pass: they are vacuous for this guard)');
  code = killed ? 0 : 1;
} finally { rmSync(dir, { recursive: true, force: true }); }
process.exit(code);
