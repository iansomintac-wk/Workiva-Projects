// Follow-ups F-2 (T-14 F8, F9): vendor-http scrubs JSON-escaped secrets and keeps no raw vendor body. Stubbed fetch only. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { requestJson, VendorError } from '../lib/vendor-http.mjs';

installNetGuard();
const SECRET = 'FAKE"sec\\ret'; // the characters FAKE"sec\ret: a quote and a backslash, escaped inside JSON text
const ESCAPED = JSON.stringify(SECRET).slice(1, -1);
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const call = (body, status = 400) => requestJson({ fetchImpl: async () => json(status, body), method: 'POST', url: 'https://fake.invalid/x', body: {}, secrets: [SECRET], host: 'Fake' });

test('vendor-http F8: a secret with a quote and a backslash, echoed in a JSON error body, is absent from the message', async () => {
  await assert.rejects(call({ error: `bad key ${SECRET}` }), (e) => {
    assert.ok(e instanceof VendorError);
    assert.ok(!e.message.includes(SECRET), e.message);
    assert.ok(!e.message.includes(ESCAPED), e.message);
    assert.match(e.message, /\[redacted\]/);
    return true;
  });
});

test('vendor-http F9: the kept body is scrubbed, keeps its shape, and is not an enumerable field (so an uncaught print omits it)', async () => {
  await assert.rejects(call({ errors: [`No calls found ${SECRET}`], errorCode: 'GS_TL_10_0107' }, 404), (e) => {
    assert.equal(e.status, 404);
    assert.ok(Array.isArray(e.body.errors));
    assert.match(e.body.errors[0], /^No calls found \[redacted\]$/);
    assert.equal(e.body.errorCode, 'GS_TL_10_0107');
    assert.ok(!JSON.stringify(e.body).includes(ESCAPED));
    assert.ok(!Object.keys(e).includes('body'));
    assert.ok(!/\bbody:/.test(inspect(e)), inspect(e));
    return true;
  });
});
