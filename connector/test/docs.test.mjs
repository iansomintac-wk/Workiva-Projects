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

test('docs: no doc claims an adapter works with Gong or Gainsight; CONTRACT says unproven until --check and has no stale I-2 heading', () => {
  const files = [...RUNBOOKS, ASK, join(root, 'CONTRACT.md')];
  for (const f of files) assert.ok(!/works with (Gong|Gainsight)|(Gong|Gainsight)[- ]rest works|is working with (Gong|Gainsight)/i.test(read(f)), f);
  const c = read(join(root, 'CONTRACT.md'));
  assert.ok(c.includes('unproven until `--check`'));
  assert.ok(!/^## Before a real Gong adapter/m.test(c));
});
