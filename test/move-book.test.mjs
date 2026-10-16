import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareFingerprints, checkHint, c7Line } from '../tools/move-book.mjs';

const fp = (o = {}) => ({ accounts: 5, activities: 12, transcripts: 3, tsSha256: 'a'.repeat(64), ...o });

test('C6 equal fingerprints pass and the line carries the counts and the hash', () => {
  const r = compareFingerprints(fp(), fp());
  assert.equal(r.ok, true);
  assert.match(r.lines.join('\n'), /^C6 PASS accounts 5\/5 activities 12\/12 transcripts 3\/3 sha256 a{64}/m);
});
test('C6 a different account count fails', () => { assert.equal(compareFingerprints(fp(), fp({ accounts: 4 })).ok, false); });
test('C6 a different transcript hash fails', () => { assert.equal(compareFingerprints(fp(), fp({ tsSha256: 'b'.repeat(64) })).ok, false); });
test('C6 zero transcripts on both sides is NOT a pass', () => { assert.equal(compareFingerprints(fp({ transcripts: 0 }), fp({ transcripts: 0 })).ok, false); });
test('C4 hint must be visible before the import and hidden after it', () => {
  const TEXT = 'New address, no book here yet. Export from your old copy, then Import here (Settings).';
  assert.equal(checkHint({ hintBefore: TEXT, hintAfter: null }).ok, true);
  assert.equal(checkHint({ hintBefore: null, hintAfter: null }).ok, false);
  assert.equal(checkHint({ hintBefore: TEXT, hintAfter: TEXT }).ok, false);
});
test('C7 is void (FAIL, not a finding) when the fake key was not stored before Export', () => {
  const r = c7Line({ keyStored: false, aiKeyInExport: false, exportText: 'x' });
  assert.equal(r.ok, false); assert.match(r.lines[0], /^C7 FAIL/); assert.doesNotMatch(r.lines[0], /FINDING/);
});
test('C7 key stored and not in the Export text: finding "absent"', () => {
  const r = c7Line({ keyStored: true, aiKeyInExport: false, exportText: 'abc' });
  assert.equal(r.ok, true); assert.match(r.lines[0], /^C7 FINDING AI key in Export: absent/);
});
test('C7 key stored and in the Export text: finding "present"', () => {
  const r = c7Line({ keyStored: true, aiKeyInExport: true, exportText: 'abc' });
  assert.equal(r.ok, true); assert.match(r.lines[0], /^C7 FINDING AI key in Export: present/);
});
