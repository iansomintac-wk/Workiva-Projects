import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readme = readFileSync('README.txt', 'utf8');
const hosting = readFileSync('docs/HOSTING.md', 'utf8');
const lines = readme.split('\n');

test('README has no stale 502 or 65 expect counts', () => {
  assert.doesNotMatch(readme, /--expect 502\b/);
  assert.doesNotMatch(readme, /--expect 65\b/);
});
test('README 1.1 selfcheck lines agree with each other and with HOSTING.md', () => {
  const ns = lines
    .map(l => l.match(/osm-book-of-business-tracker-1\.1\.html --seed demo-seed\.js --expect (\d+)/))
    .filter(Boolean).map(m => m[1]);
  assert.ok(ns.length >= 1, 'no 1.1 selfcheck line found');
  assert.equal(new Set(ns).size, 1, 'README copies disagree: ' + ns);
  const n = ns[0];
  assert.ok(hosting.includes(`${n}/${n}`), `HOSTING.md lacks ${n}/${n}`);
  assert.ok(hosting.includes(`--expect ${n}`), `HOSTING.md lacks --expect ${n}`);
});
test('README step 1 probe lines all expect 72', () => {
  const p = lines.filter(l => /--fn step1Probe/.test(l));
  assert.ok(p.length >= 1);
  for (const l of p) assert.match(l, /--expect 72\b/);
});
test('README Connector section names the built adapters as unproven', () => {
  assert.doesNotMatch(readme, /no real adapter is built/);
  const sec = readme.slice(readme.indexOf('Connector (Stage B)'));
  for (const w of ['gong-rest', 'gainsight-rest', 'unproven']) assert.ok(sec.includes(w), w);
});
test('prose counts ("N in all", "N in-page checks") equal the --expect number', () => {
  const n = readme.match(/osm-book-of-business-tracker-1\.1\.html --seed demo-seed\.js --expect (\d+)/)[1];
  const prose = [...readme.matchAll(/\b(\d+) in all\b/g)].map(m => m[1])
    .concat([...hosting.matchAll(/\b(\d+) in-page checks\b/g)].map(m => m[1]));
  assert.ok(prose.length >= 3, 'expected 2 README + 1 HOSTING prose counts, found ' + prose.length);
  for (const p of prose) assert.equal(p, n, `prose count ${p} != --expect ${n}`);
});
