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

test('vendor-http R-1: a secret that straddles the 500-char detail cut leaves no fragment (scrub before truncate)', async () => {
  const S = 'FAKE-SECRET-STRADDLE-123456';
  const body = { error: 'a'.repeat(485) + S }; // {"error":" is 10 chars, so the secret starts at char 495 of the detail; a cut at 500 would keep 5 of its chars
  assert.equal(JSON.stringify(body).indexOf(S), 495);
  await assert.rejects(requestJson({ fetchImpl: async () => json(400, body), method: 'POST', url: 'https://fake.invalid/x', body: {}, secrets: [S], host: 'Fake' }), (e) => {
    assert.ok(e instanceof VendorError);
    for (let n = 6; n <= S.length; n++) assert.ok(!e.message.includes(S.slice(0, n)), `prefix of length ${n} leaked`);
    assert.ok(!e.message.includes('FAKE-'), e.message.slice(-60));
    return true;
  });
});
