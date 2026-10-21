import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../osm-book-of-business-tracker-1.1.html', import.meta.url), 'utf8');
const sc = readFileSync(new URL('../tools/selfchecks-1.1.js', import.meta.url), 'utf8');

test('note chip expansion part is "Expansion signal: <phrase>" without the category word in brackets', () => {
  const line = html.split('\n').find(l => l.includes('const chipText ='));
  assert.ok(line, 'chipText line exists');
  const m = line.match(/Expansion signal: \$\{expCats\.map\((.*?)\)\.join\('([^']*)'\)\}/);
  assert.ok(m, 'expansion part found');
  assert.notEqual(m[1], 'chipPart', 'expansion must not reuse the label (“phrase”) formatter');
  assert.equal(m[2], ' · ');
  // evaluate the expansion mapper on a sample
  const fn = new Function('escapeHtml', `return (${m[1]});`)(s => s);
  assert.equal(fn({ label: 'Expansion', phrase: 'upsell' }), 'upsell');
  // risk chip text unchanged
  assert.ok(line.includes('riskCats.map(chipPart).join(\' · \')'));
});

test('pre-1.2 confirmed label reads "Confirmed before reasons were required." plus the Add a reason button', () => {
  assert.ok(html.includes('<p class="rk-confirmed-why">Confirmed before reasons were required. <button class="link-btn"'));
  assert.ok(!html.includes('Confirmed before reasons were required: add a reason'));
  assert.ok(sc.includes('Confirmed before reasons were required.'));
  assert.ok(!sc.includes('required: add a reason'));
});
