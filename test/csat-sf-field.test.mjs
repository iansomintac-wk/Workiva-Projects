import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, J, htmlLF } from '../tools/lib/csat-fixture.mjs';

const src = htmlLF();
test('Salesforce ID: getIntegration returns the trimmed salesforceId and null when absent', () => {
  const c = loadCsat(['getIntegration'], [], { safeHttpUrl: () => null });
  assert.equal(c.getIntegration({ salesforceId: '  001abc  ' }).salesforceId, '001abc');
  assert.equal(c.getIntegration({}).salesforceId, null);
});
test('preserved: setOptionalField stores a trimmed non-empty value and deletes the key for an empty one (the gainsightId contract)', () => {
  const c = loadCsat(['setOptionalField']);
  const a = {}; c.setOptionalField(a, 'salesforceId', ' 001x ');
  const b = { salesforceId: 'old' }; c.setOptionalField(b, 'salesforceId', '');
  assert.equal(J(a).salesforceId, '001x'); assert.equal('salesforceId' in J(b), false);
});
test('Salesforce ID: the Details tab labels the existing box Gainsight ID, adds a Salesforce ID box below it, and the old combined label is gone', () => {
  assert.match(src, /<label>Gainsight ID<\/label><input type="text" id="cust-gainsight-id"/);
  assert.match(src, /<label>Salesforce ID<\/label><input type="text" id="cust-salesforce-id"/);
  assert.ok(src.indexOf('id="cust-gainsight-id"') < src.indexOf('id="cust-salesforce-id"'));
  assert.doesNotMatch(src, /<label>Gainsight \/ Salesforce ID[^<]*<\/label>/);   // also the "(optional)" form in Add Customer
  assert.match(src, /<label>Gainsight ID \(optional\)<\/label><input type="text" id="new-gainsight-id"[^>]*placeholder="e\.g\. 1I00[A-Z0-9]+"/);
});
test('Salesforce ID: applyIntegrationInputs writes salesforceId and the box is in the change-listener list (source presence; the headless drive proves the behaviour)', () => {
  assert.match(src, /setOptionalField\(cust, 'salesforceId', sidEl\.value\)/);
  assert.match(src, /\['#cust-contact','#cust-gainsight-id','#cust-salesforce-id',/);
});
