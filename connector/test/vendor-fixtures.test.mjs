// connect-ready T-4 / A-7: every vendor fixture says it is a shape from docs, not from a live tenant. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';

installNetGuard();
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'vendor');
const HEADER = 'SHAPE FROM DOCS, NOT FROM A LIVE TENANT';
const load = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));

test('A-7 every vendor fixture is headed with the docs-not-tenant warning and a vendor source URL', () => {
  const files = readdirSync(dir);
  assert.ok(files.length >= 6, `expected at least 6 fixtures, found ${files.length}`);
  for (const f of files) {
    assert.match(f, /\.json$/, `${f}: only .json fixtures belong here`);
    const j = load(f);
    assert.equal(typeof j._source, 'string', `${f}: no _source`);
    assert.ok(j._source.startsWith(HEADER), `${f}: _source must start with "${HEADER}"`);
    assert.match(j._source, /https:\/\/(help\.gong\.io|support\.gainsight\.com)\/\S+/, `${f}: no vendor source URL`);
  }
});

test('vendor fixtures hold fake values only: every email and every URL host ends in .invalid', () => {
  for (const f of readdirSync(dir)) {
    const { _source, ...rest } = load(f);
    const text = JSON.stringify(rest);
    for (const m of text.matchAll(/[\w.+-]+@([\w-]+\.)+[\w-]+/g)) assert.match(m[0], /\.invalid$/, `${f}: ${m[0]}`);
    for (const m of text.matchAll(/https?:\/\/([^/"?]+)/g)) assert.match(m[1], /\.invalid$/, `${f}: ${m[1]}`);
  }
});

test('the transcript fixture holds calls 7101-7110 with 10, 20, ... 100 characters (T-12 relies on this)', () => {
  const t = load('gong-transcripts.json');
  const len = (ct) => ct.transcript.reduce((n, mono) => n + mono.sentences.reduce((k, s) => k + s.text.length, 0), 0);
  assert.deepEqual(t.callTranscripts.map((ct) => ct.callId), ['7101', '7102', '7103', '7104', '7105', '7106', '7107', '7108', '7109', '7110']);
  assert.deepEqual(t.callTranscripts.map(len), [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
});
