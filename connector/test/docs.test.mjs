// connect-ready T-13: runbooks and admin ask keep the honesty rules. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(root, '..');
const read = (p) => readFileSync(p, 'utf8');
const RUNBOOKS = ['CONNECT-GONG.md', 'CONNECT-GAINSIGHT.md'].map((f) => join(root, f));
const ASK = join(repo, 'docs', 'superpowers', 'drafts', 'connector-admin-ask.md');

test('docs: admin ask describes what is built, unproven until --check, with the redirect URI and confirmed CTA endpoints', () => {
  const t = read(ASK);
  assert.ok(!/built only once credentials exist/.test(t));
  assert.ok(t.includes('unproven until `--check`'));
  assert.ok(t.includes('http://127.0.0.1:8787/oauth/callback'));
  const cta = t.split('\n').filter((l) => l.includes('/v2/cockpit/cta'));
  assert.ok(cta.length && cta.every((l) => !/to confirm with admin/i.test(l)), 'CTA endpoints are CONFIRMED (Q12)');
  assert.match(t, /IP allowlist[^\n]*not re-confirmed on 2026-10-02/);
  // B1: the one admin question about an objective on an existing Success Plan.
  assert.match(t, /objective on an existing Success Plan[^\n]*to confirm with admin/);
});

test('docs: each runbook has an admin part, an Ian part, and Vendor facts that are each CONFIRMED with a URL or "to confirm with admin"', () => {
  for (const f of RUNBOOKS) {
    assert.ok(existsSync(f), f);
    const t = read(f);
    assert.match(t, /^## Part 1: for the admin/m, f);
    assert.match(t, /^## Part 2: for Ian/m, f);
    assert.ok(t.includes('--setup') && t.includes('--check'), f);
    const facts = (t.split(/^## Vendor facts\s*$/m)[1] || '').split(/^## /m)[0];
    const bullets = facts.split('\n').filter((l) => /^\s*- /.test(l));
    assert.ok(bullets.length >= 4, `${f}: too few vendor facts`);
    // \bCONFIRMED\b does not match inside "UNCONFIRMED", so an UNCONFIRMED bullet must say "to confirm with admin".
    for (const b of bullets) assert.ok(/\bCONFIRMED\b.*https:\/\//.test(b) || /to confirm with admin/.test(b), `${f}: ${b}`);
  }
});

test('docs: Gainsight runbook carries the B1 admin question and the B2 read-back SKIP', () => {
  const t = read(RUNBOOKS[1]);
  assert.match(t, /objective[^\n]*existing Success Plan/i);
  assert.ok(t.includes('SKIP gainsight write read-back'));
  assert.ok(t.includes('[SBX] TEST'));
});

// T-14 fix C (F5): the Basic-key scope and the key-page menu path are not confirmed (research-vendor-apis.md:61-67).
test('docs F5: the Gong runbook never gives the Basic-key scope or the Ecosystem menu path without "to confirm"; check.mjs does not state them as fact', () => {
  const t = read(RUNBOOKS[0]);
  const step1 = t.split('\n').slice(t.split('\n').findIndex((l) => /^1\. Create an API access key/.test(l))).slice(0, 4).join(' ');
  assert.match(step1, /Ecosystem[^.]*to confirm|to confirm[^.]*Ecosystem/, 'step 1 path');
  assert.match(step1, /api:calls:read:extensive[^.]*to confirm|to confirm[^.]*api:calls:read:extensive/, 'step 1 scope');
  for (const l of t.split('\n')) {
    if (/## Vendor facts/.test(l)) break;
    if (/api:calls:read:extensive|Ecosystem/.test(l) && !/^1\.|^\s+`api:calls|^\s+to confirm/.test(l)) assert.ok(/to confirm/.test(l), `unmarked: ${l}`);
  }
  const c = read(join(root, 'lib', 'check.mjs'));
  for (const l of c.split('\n').filter((x) => /api:calls:read:extensive|Ecosystem/.test(x))) assert.ok(/to confirm/.test(l), `check.mjs states as fact: ${l}`);
});

// T-14 fix C (F6): every key the Gainsight write paths need() must be named in the runbook.
test('docs F6: CONNECT-GAINSIGHT.md names authorEmail and every need() key of the write paths', () => {
  const t = read(RUNBOOKS[1]);
  const src = read(join(root, 'adapters', 'gainsight-rest.mjs'));
  const keys = new Set();
  for (const m of src.matchAll(/need\(cfg, \[([^\]]*)\]/g)) for (const k of m[1].matchAll(/'([^']+)'/g)) keys.add(k[1]);
  assert.ok(keys.has('authorEmail'));
  // The runbook names a dotted key by its top-level block (`cta`) or whole (`timeline.typeName`).
  for (const k of keys) assert.ok(t.includes(k) || t.includes('`' + k.split('.')[0] + '`'), `CONNECT-GAINSIGHT.md does not name ${k}`);
});

test('docs: no doc claims an adapter works with Gong or Gainsight; CONTRACT says unproven until --check and has no stale I-2 heading', () => {
  const files = [...RUNBOOKS, ASK, join(root, 'CONTRACT.md')];
  for (const f of files) assert.ok(!/works with (Gong|Gainsight)|(Gong|Gainsight)[- ]rest works|is working with (Gong|Gainsight)/i.test(read(f)), f);
  const c = read(join(root, 'CONTRACT.md'));
  assert.ok(c.includes('unproven until `--check`'));
  assert.ok(!/^## Before a real Gong adapter/m.test(c));
});

// Follow-ups F-4 (T-14 F22 and the mixed-code checker low)
test('docs F22: CONTRACT.md says a duplicate\'s externalId is our item id, and that the duplicate code among other codes still counts as sent', () => {
  const c = read(join(root, 'CONTRACT.md'));
  assert.match(c, /`externalId` is our item id/);
  assert.match(c, /alongside other codes/);
});

// Follow-ups F-7 (F24): how a Basic key gets the transcript scope is not confirmed (same pattern as F5).
test('docs F24: the transcript scope is never stated as fact for the key (measure.mjs, CONNECT-GONG.md steps)', () => {
  const m = read(join(root, 'lib', 'measure.mjs'));
  for (const l of m.split('\n').filter((x) => /api:calls:read:transcript/.test(x))) assert.ok(/to confirm/.test(l), `measure.mjs states as fact: ${l}`);
  for (const l of read(RUNBOOKS[0]).split('\n')) {
    if (/## Vendor facts/.test(l)) break;
    if (/transcript scope|api:calls:read:transcript/.test(l)) assert.ok(/to confirm/.test(l), `unmarked: ${l}`);
  }
});
test('Fix B N2: CONNECT-SNOWFLAKE.md flags the region-style JWT account identifier as unverified and says what to check', () => {
  const t = read(join(root, 'CONNECT-SNOWFLAKE.md'));
  assert.match(t, /xy12345\.us-east-2\.aws/);
  assert.match(t, /UNVERIFIED[^\n]*(account identifier|JWT)/i);
  assert.match(t, /401/);
});
