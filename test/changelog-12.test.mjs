import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const cl = readFileSync('CHANGELOG.txt', 'utf8').replace(/\r\n/g, '\n');
const sections = cl.split(/\n(?=\d+\.\d+ )/);
const s12 = sections.find(s => /^1\.2 /.test(s)) || '';

test('CHANGELOG 1.2: a 1.2 section exists and sits second, under the Hosting section the hosting test needs first', () => {
  assert.ok(s12.length > 0, 'no 1.2 section');
  assert.match(sections[1], /^1\.1 \S+ Hosting/);
  assert.equal(sections.indexOf(s12), 2);
});
test('CHANGELOG 1.2 task 1: names the CSAT plan builder', () => assert.match(s12, /CSAT import: buildCsatImportPlan/));
test('CHANGELOG 1.2 task 2: matching bullet names Salesforce ID, Gainsight ID, ambiguous and conflict', () => assert.match(s12, /Salesforce ID \(15 or 18 chars\), then Gainsight ID; ambiguous and conflicting rows/));
test('CHANGELOG 1.2 task 3: update rules bullet', () => assert.match(s12, /update rules \(newer sent wins/));
test('CHANGELOG 1.2 task 4: name matches are only suggestions', () => assert.match(s12, /name matches are only suggestions \(unticked\)/));
test('CHANGELOG 1.2 task 6: Salesforce ID box bullet', () => assert.match(s12, /new optional Salesforce ID box/));
test('README task 6: the Details description names both ID boxes', () => { const r = readFileSync('README.txt', 'utf8'); assert.match(r, /Salesforce ID/); assert.match(r, /Gainsight ID/); });
test('CHANGELOG 1.2 task 7: dry-run preview bullet', () => assert.match(s12, /Import CSAT dates \(CSV\) opens a dry-run preview/));
test('CHANGELOG 1.2 task 8: backup-first apply bullet', () => assert.match(s12, /Apply downloads a backup first/));
test('README task 8: Settings entry for Import CSAT dates (CSV)', () => assert.match(readFileSync('README.txt', 'utf8'), /Import CSAT dates \(CSV\)/));
test('CHANGELOG 1.2 task 9: folder watch plumbing bullet', () => assert.match(s12, /Folder watch plumbing: newest csat_runway_export_/));
test('CHANGELOG 1.2 task 10: Today line bullet', () => assert.match(s12, /Today shows "New CSAT export" with Review; nothing applies without Apply/));
test('README task 11: Settings controls and the file-name pattern', () => { const r = readFileSync('README.txt', 'utf8'); for (const re of [/Watch a folder for CSAT exports/, /csat_runway_export_/]) assert.match(r, re); });
test('VALIDATION task 11: the two checks Ian runs on his computer', () => { const v = readFileSync('VALIDATION.txt', 'utf8'); assert.match(v, /Allow on every visit/); assert.match(v, /dry-run/i); });
test('CHANGELOG 1.2 task 11: Settings watch controls bullet', () => assert.match(s12, /Settings > Watch a folder for CSAT exports/));
test('CHANGELOG 1.2 task 13: Call prep order bullet', () => assert.match(s12, /Call prep order is now Agenda, Promises, Last transcript, Pending deliverables/));
test('CHANGELOG 1.2 task 14: backup prompt bullet', () => assert.match(s12, /Back up your book first\?/));
test('CHANGELOG 1.2 task 15: nits bullet', () => assert.match(s12, /Graduate modal omits "\(0 of 0 gates done\)"/));
