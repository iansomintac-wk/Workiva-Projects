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
