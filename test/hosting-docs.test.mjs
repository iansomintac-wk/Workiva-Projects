import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = f => (existsSync(f) ? readFileSync(f, 'utf8') : '');
const hosting = () => read('docs/HOSTING.md');
const firstSection = () => (read('CHANGELOG.txt').split(/\n(?=\d+\.\d+ )/)[1] || '');

test('HOSTING.md says what this is, what to upload, and what the host must give', () => {
  const t = hosting();
  assert.ok(t.length > 0, 'docs/HOSTING.md is missing');
  for (const re of [/site\/index\.html/, /\.nojekyll/, /node tools\/build-site\.mjs/, /own hostname/i, /https/i, /sign-in/i])
    assert.match(t, re);
});
test('HOSTING.md is accurate about where data goes: the book stays in the browser, AI features send text to the provider', () => {
  const t = hosting();
  assert.ok(t.length > 0, 'docs/HOSTING.md is missing');
  assert.match(t, /lives in this browser/i);
  assert.match(t, /AI features/);
  assert.match(t, /provider/i);
  assert.doesNotMatch(t, /nothing (is sent|leaves)|never leaves the browser|no data leaves/i);
});
test('HOSTING.md carries no email-shaped string except .invalid, no restore-point file name, no company name', () => {
  const t = hosting();
  assert.ok(t.length > 0, 'docs/HOSTING.md is missing');
  const bad = (t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).filter(m => !/\.invalid$/i.test(m));
  assert.deepEqual(bad, []);
  assert.doesNotMatch(t, /RESTORE-POINT/);
  assert.doesNotMatch(t, /Workiva/i);
});
test('README.txt has a Hosted paragraph that points at docs/HOSTING.md', () => {
  const t = read('README.txt');
  assert.match(t, /^Hosted\b/m); assert.match(t, /docs\/HOSTING\.md/);
});
test('CHANGELOG.txt: the hosting heading is the FIRST version section and names the builder', () => {
  const first = firstSection();
  assert.match(first, /^1\.1 \S+ Hosting/);
  assert.match(first, /build-site/);
});
test('HOSTING.md covers checking a copy from an address and publishing a new version; CHANGELOG names --serve', () => {
  const t = hosting();
  for (const re of [/--serve site/, /node tools\/selfcheck\.mjs/, /upload/i, /488/]) assert.match(t, re);
  assert.match(firstSection(), /--serve/);
});
test('HOSTING.md gives the three Settings storage lines verbatim; CHANGELOG names them', () => {
  const t = hosting();
  for (const s of ['Kept by browser: yes', 'Kept by browser: no (export regularly)', 'Kept by browser: not available when opened as a file']) assert.ok(t.includes(s), s);
  assert.match(firstSection(), /Kept by browser/);
});

test('HOSTING.md gives the empty-book hint verbatim; CHANGELOG names the hint', () => {
  assert.ok(hosting().includes('New address, no book here yet. Export from your old copy, then Import here (Settings).'));
  assert.match(firstSection(), /empty-book hint/i);
});
test('HOSTING.md states the C7 result exactly once (the AI key is, or is not, in Export)', () => {
  const t = hosting();
  const a = t.includes('The AI key is not in Export; enter it again after moving.');
  const b = t.includes('The AI key is carried in Export; check it after moving.');
  assert.equal(a !== b, true, 'exactly one of the two C7 sentences must appear');
});
test('HOSTING.md explains moving a book (Export, Import, transcripts); CHANGELOG names move-book', () => {
  const t = hosting();
  for (const re of [/Export/, /Import/, /transcripts/i, /Settings/]) assert.match(t, re);
  assert.match(firstSection(), /move-book/);
});

test('HOSTING.md carries the sha256 of the current 1.1 tracker (what the host compares index.html against)', () => {
  const sha = createHash('sha256').update(readFileSync('osm-book-of-business-tracker-1.1.html')).digest('hex');
  assert.ok(hosting().includes(sha), 'docs/HOSTING.md must contain ' + sha);
});

test('HOSTING.md names every external https origin the 1.1 page loads or calls, and no longer says it works with no network', () => {
  const html = readFileSync('osm-book-of-business-tracker-1.1.html', 'utf8');
  const origins = new Set();
  for (const m of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="(https:\/\/[^/"]+)/g)) origins.add(m[1]);   // loaded
  for (const m of html.matchAll(/\bfetch\(\s*[`'"](https:\/\/[^/`'"]+)/g)) origins.add(m[1]);                      // called
  assert.ok(origins.size >= 5, 'expected at least 5 origins, found ' + [...origins].join(' '));
  const doc = hosting();
  for (const o of origins) assert.ok(doc.includes(o.replace('https://', '')), 'docs/HOSTING.md must name ' + o);
  assert.ok(doc.includes('fonts.gstatic.com'), 'HOSTING.md must name fonts.gstatic.com');
  assert.ok(/^## What the page loads$/m.test(doc), 'section "What the page loads" missing');
  assert.ok(!/works with no network/i.test(doc), 'the "works with no network" sentence must be gone');
  assert.ok(/inline script/i.test(doc) && /inline style/i.test(doc), 'must say the page needs inline script and inline style');
  assert.ok(/integrity/i.test(doc), 'must say the xlsx script has no integrity attribute');
});
