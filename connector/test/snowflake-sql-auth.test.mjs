import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify, createPublicKey, createHash } from 'node:crypto';
import { buildSnowflakeJwt, publicKeyFingerprint } from '../lib/snowflake-jwt.mjs';
import { assertReadOnlySql } from '../lib/snowflake-guard.mjs';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const b64u = (s) => JSON.parse(Buffer.from(s, 'base64url').toString());
const NOW = 1_800_000_000;

test('jwt-1 header is RS256 JWT and signature verifies', () => {
  const jwt = buildSnowflakeJwt({ account: 'acme-xy1', user: 'bob', privateKeyPem, now: NOW });
  const [h, p, s] = jwt.split('.');
  assert.deepEqual(b64u(h), { alg: 'RS256', typ: 'JWT' });
  const v = createVerify('RSA-SHA256');
  v.update(`${h}.${p}`);
  assert.equal(v.verify(publicKey, Buffer.from(s, 'base64url')), true);
});

test('jwt-2 iss/sub uppercase with SHA256 fingerprint', () => {
  const jwt = buildSnowflakeJwt({ account: 'acme-xy1', user: 'bob', privateKeyPem, now: NOW });
  const claims = b64u(jwt.split('.')[1]);
  const der = createPublicKey(privateKeyPem).export({ type: 'spki', format: 'der' });
  const fp = 'SHA256:' + createHash('sha256').update(der).digest('base64');
  assert.equal(claims.sub, 'ACME-XY1.BOB');
  assert.equal(claims.iss, `ACME-XY1.BOB.${fp}`);
  assert.equal(publicKeyFingerprint(privateKeyPem), fp);
});

test('jwt-3 lifetime capped at 3600', () => {
  const claims = b64u(buildSnowflakeJwt({ account: 'a', user: 'u', privateKeyPem, now: NOW }).split('.')[1]);
  assert.equal(claims.iat, NOW);
  assert.ok(claims.exp - claims.iat <= 3600);
  assert.throws(() => buildSnowflakeJwt({ account: 'a', user: 'u', privateKeyPem, now: NOW, ttlSeconds: 3601 }));
});

test('guard-1 accepts read-only statements', () => {
  assert.equal(assertReadOnlySql('SELECT 1'), 'SELECT 1');
  const q = '-- hi\n/* c */ WITH x AS (SELECT 1) SELECT * FROM x;';
  assert.equal(assertReadOnlySql(q), q.slice(0, -1));
});

test('guard-2 rejects writes, multi-statement and empty', () => {
  assert.throws(() => assertReadOnlySql('DROP TABLE t'));
  assert.throws(() => assertReadOnlySql('SELECT 1; DELETE FROM t'));
  assert.throws(() => assertReadOnlySql(''));
});

test('guard-3 errors never contain the private key', () => {
  for (const bad of ['DROP TABLE t', '', 'SELECT 1; DELETE FROM t']) {
    try { assertReadOnlySql(bad); } catch (e) { assert.ok(!e.message.includes('PRIVATE KEY')); }
  }
  try { buildSnowflakeJwt({ account: 'a', user: 'u', privateKeyPem: privateKeyPem.slice(0, 80), now: NOW }); assert.fail('should throw'); }
  catch (e) {
    assert.ok(!e.message.includes('PRIVATE KEY'));
    assert.ok(!e.message.includes(privateKeyPem.split('\n')[1]));
  }
});

test('guard-4 WITH may not define a procedure or contain a write; a plain CTE SELECT passes', () => {
  assert.throws(() => assertReadOnlySql('WITH p AS PROCEDURE () RETURNS INT LANGUAGE SQL AS $$ BEGIN DROP TABLE t; END $$ CALL p()'));
  assert.throws(() => assertReadOnlySql('WITH x AS (SELECT 1) DELETE FROM t'));
  assert.throws(() => assertReadOnlySql('WITH x AS (SELECT 1) INSERT INTO t SELECT * FROM x'));
  assert.throws(() => assertReadOnlySql('with x as (select 1) merge into t using x on 1=1 when matched then delete'));
  assert.throws(() => assertReadOnlySql('WITH x AS (SELECT 1) UPDATE t SET a = 1'));
  const ok = "WITH x AS (SELECT 'updated' AS note, 1 AS deleted_at) SELECT * FROM x";
  assert.equal(assertReadOnlySql(ok), ok);
});
