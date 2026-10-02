// Test-only guard: any fetch to a host other than 127.0.0.1 throws and is recorded, so a test that falls
// through to the real network fails loudly even when an adapter swallows the error into "Network error".
// installNetGuard() replaces globalThis.fetch and restores it (and asserts nothing was blocked) after the file's tests.
import { after } from 'node:test';
import assert from 'node:assert/strict';

export const blocked = [];
const realFetch = globalThis.fetch;

export async function guardedFetch(url, init) {
  const u = String(url && url.url ? url.url : url);
  if (!/^http:\/\/127\.0\.0\.1(:|\/|$)/.test(u)) {
    blocked.push(u);
    throw new Error(`NETWORK GUARD: blocked non-loopback fetch to ${u}`);
  }
  return realFetch(url, init);
}

export function installNetGuard() {
  globalThis.fetch = guardedFetch;
  after(() => {
    globalThis.fetch = realFetch;
    assert.deepEqual(blocked, [], 'a test reached for the real network');
  });
}
