// Snowflake key-pair JWT (RS256) using node:crypto only.
import { createPrivateKey, createPublicKey, createHash, createSign } from 'node:crypto';

const MAX_TTL = 3600;

function loadKey(privateKeyPem) {
  try {
    return createPrivateKey(privateKeyPem);
  } catch {
    throw new Error('Snowflake private key could not be parsed');
  }
}

export function publicKeyFingerprint(privateKeyPem) {
  const pub = createPublicKey(loadKey(privateKeyPem));
  const der = pub.export({ type: 'spki', format: 'der' });
  return 'SHA256:' + createHash('sha256').update(der).digest('base64');
}

const b64u = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

export function buildSnowflakeJwt({ account, user, privateKeyPem, now, ttlSeconds = MAX_TTL }) {
  if (!(ttlSeconds > 0) || ttlSeconds > MAX_TTL) throw new Error(`JWT lifetime must be 1..${MAX_TTL} seconds`);
  const key = loadKey(privateKeyPem);
  const qual = `${String(account).toUpperCase()}.${String(user).toUpperCase()}`;
  const iat = now ?? Math.floor(Date.now() / 1000);
  const claims = { iss: `${qual}.${publicKeyFingerprint(privateKeyPem)}`, sub: qual, iat, exp: iat + ttlSeconds };
  const input = `${b64u({ alg: 'RS256', typ: 'JWT' })}.${b64u(claims)}`;
  const sig = createSign('RSA-SHA256').update(input).sign(key).toString('base64url');
  return `${input}.${sig}`;
}
