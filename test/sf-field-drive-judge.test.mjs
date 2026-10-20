import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { judgeSfField } from '../tools/sf-field-drive.mjs';

const good = { boxFound: true, typed: '001FAKEDRIVE00001AA', afterReload: '001FAKEDRIVE00001AA', gidBefore: 'GS-DRIVE-KEEP', gidAfterSet: 'GS-DRIVE-KEEP', keyPresentAfterClear: false, keyPresentAfterClearReload: false, gidAfterClear: 'GS-DRIVE-KEEP' };
test('SF drive judge: typing only the Salesforce box, reload, then clearing it passes when gainsightId never moved', () => { assert.equal(judgeSfField(good).passed, true); });
test('SF drive judge: no box, not saved after reload, gainsightId changed, key left after clearing (before or after reload) each fail it', () => {
  for (const bad of [{ boxFound: false }, { afterReload: undefined }, { gidAfterSet: 'x' }, { keyPresentAfterClear: true }, { keyPresentAfterClearReload: true }, { gidAfterClear: null }]) assert.equal(judgeSfField({ ...good, ...bad }).passed, false, JSON.stringify(bad));
});
test('SF drive tool: never names a Downloads path', () => {
  assert.doesNotMatch(readFileSync('tools/sf-field-drive.mjs', 'utf8') + readFileSync('tools/lib/drive-sim.mjs', 'utf8'), /Downloads/);
});
