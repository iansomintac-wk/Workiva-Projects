// connect-ready T-12: --measure-transcripts on fixtures and a stubbed fetch. Read-only; stores nothing. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { stats, runMeasure, WEEKS_PER_MONTH } from '../lib/measure.mjs';
import { runCli } from '../lib/cli.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TRANSCRIPTS = JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', 'gong-transcripts.json'), 'utf8'));
const ME = 'ian.fake@fake-osm.invalid';
const GONG = { adapter: 'gong-rest', baseUrl: 'https://fake-tenant.gong.invalid', accessKey: 'FAKE-KEY-123', accessKeySecret: 'FAKE-SECRET-456', myEmail: ME };
const NOW = new Date('2026-10-02T12:00:00Z');
const IDS = TRANSCRIPTS.callTranscripts.map((t) => t.callId);
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const EXTENSIVE = { records: { totalRecords: 10 }, calls: IDS.map((id, i) => ({
  metaData: { id, url: `https://fake-tenant.gong.invalid/call?id=${id}`, title: `FAKE call ${id}`, started: `2026-09-${String(10 + i).padStart(2, '0')}T15:00:00Z`, duration: 600 },
  parties: [{ emailAddress: ME, name: 'Ian Fake', affiliation: 'Internal' }], content: {} })) };
function stub() {
  const seen = [];
  const fn = async (url, init) => { const body = JSON.parse(init.body); seen.push({ url, body }); return json(200, url.endsWith('/v2/calls/transcript') ? TRANSCRIPTS : EXTENSIVE); };
  return { fn, seen };
}
const measure = async (opts = {}) => {
  const lines = []; const stateDir = mkdtempSync(join(tmpdir(), 'measure-')); const s = stub();
  const code = await runMeasure({ config: { gong: GONG }, stateDir, now: () => NOW, out: (l) => lines.push(l), deps: { fetchImpl: s.fn, sleep: async () => {}, now: () => NOW }, ...opts });
  return { code, lines, stateDir, seen: s.seen };
};

test('measure: stats are median (mean of the middle two), nearest-rank p90, max and mean; empty gives nulls', () => {
  assert.deepEqual(stats([100, 10, 20, 30, 40, 50, 60, 70, 80, 90]), { count: 10, median: 55, mean: 55, p90: 90, max: 100 });
  assert.deepEqual(stats([3, 1, 2]), { count: 3, median: 2, mean: 2, p90: 3, max: 3 });
  assert.deepEqual(stats([]), { count: 0, median: null, mean: null, p90: null, max: null });
});

test('measure: known fixture lengths give the expected lines, each labelled measured, derived or assumption', async () => {
  const r = await measure({ bookBytes: 1000000 });
  assert.equal(r.code, 0);
  const months = (4000000 / ((10 / (30 / 7)) * 55) / WEEKS_PER_MONTH).toFixed(1);
  assert.deepEqual(r.lines, [
    'measured: calls in the last 30 days: 10',
    'measured: transcript characters per call: median 55, mean 55, 90th percentile 90, max 100',
    'derived: calls per week: 2.3',
    'assumption: localStorage quota 5,000,000 bytes (not measured; --quota-bytes to change); 1 character counted as 1 byte',
    'measured: book size given: 1,000,000 bytes (--book-bytes)',
    `derived: months until the book fills at this rate: ${months}`,
  ]);
});

test('measure: asks for transcripts of exactly my calls in the window, stores nothing, and needs --book-bytes for the projection', async () => {
  const r = await measure();
  const t = r.seen.find((s) => s.url.endsWith('/v2/calls/transcript'));
  assert.deepEqual(t.body.filter, { fromDateTime: '2026-09-02T12:00:00.000Z', toDateTime: '2026-10-02T12:00:00.000Z', callIds: IDS });
  assert.deepEqual(readdirSync(r.stateDir), []);
  assert.equal(r.lines.at(-1), 'derived: months until the book fills: not computed (pass --book-bytes <n>)');
});

// T-14 fix A (F1)
test('measure F1: a no-calls 404 prints "no calls in the window" and exits 0', async () => {
  const lines = [];
  const fn = async () => json(404, { requestId: 'FAKE-REQ-1', errors: ['No calls found for the specified period'] });
  const code = await runMeasure({ config: { gong: GONG }, stateDir: mkdtempSync(join(tmpdir(), 'measure-')), now: () => NOW, out: (l) => lines.push(l),
    deps: { fetchImpl: fn, sleep: async () => {}, now: () => NOW } });
  assert.equal(code, 0, lines.join('\n'));
  assert.ok(lines.some((l) => l.includes('nothing to project')), lines.join('\n'));
});

// Follow-ups F-7 (T-14 F17, F18, F24)
const measureWith = async (fetchImpl, opts = {}) => {
  const lines = [];
  const code = await runMeasure({ config: { gong: GONG }, stateDir: mkdtempSync(join(tmpdir(), 'measure-')), now: () => NOW, out: (l) => lines.push(l),
    deps: { fetchImpl, sleep: async () => {}, now: () => NOW }, ...opts });
  return { code, lines };
};
const tenant = (transcripts = TRANSCRIPTS, extensive = EXTENSIVE) => async (url) => json(200, url.endsWith('/v2/calls/transcript') ? transcripts : extensive);

test('measure F17/F24: a 403 on transcripts is one FAIL line naming the Gong admin; the scope is "to confirm", not fact', async () => {
  const r = await measureWith(async (url) => (url.endsWith('/v2/calls/transcript') ? json(403, { errors: ['FAKE forbidden'] }) : json(200, EXTENSIVE)));
  assert.equal(r.code, 1);
  assert.equal(r.lines.length, 1, r.lines.join('\n'));
  assert.match(r.lines[0], /^FAIL measure: .*who fixes it: Gong admin \(.*api:calls:read:transcript.*to confirm\)$/);
  assert.ok(!/FAKE-KEY-123|FAKE-SECRET-456/.test(r.lines[0]));
});

test('measure F17: a gong adapter other than gong-rest is one FAIL line, exit 1, no call', async () => {
  let calls = 0;
  const r = await measureWith(async () => { calls++; return json(200, EXTENSIVE); }, { config: { gong: { adapter: 'fake' } } });
  assert.equal(r.code, 1);
  assert.deepEqual(r.lines, ['FAIL measure: gong.adapter is not "gong-rest"; run node connector/server.mjs --setup; who fixes it: Ian']);
  assert.equal(calls, 0);
});

test('measure F17: when every transcript returned is empty, months is "not computed", never Infinity', async () => {
  const empty = { ...TRANSCRIPTS, callTranscripts: TRANSCRIPTS.callTranscripts.map((t) => ({ ...t, transcript: [] })) };
  const r = await measureWith(tenant(empty), { bookBytes: 1000000 });
  assert.equal(r.code, 0);
  assert.equal(r.lines.at(-1), 'derived: months until the book fills: not computed (every transcript returned is empty)');
  assert.ok(!r.lines.some((l) => /Infinity|NaN/.test(l)), r.lines.join('\n'));
});

test('measure F17: a book at or over the quota gives "not computed", never a negative number', async () => {
  const r = await measureWith(tenant(), { bookBytes: 6000000 });
  assert.equal(r.code, 0);
  assert.equal(r.lines.at(-1), 'derived: months until the book fills: not computed (the book is already at or over the quota)');
});

test('measure F17: --book-bytes abc through the CLI is one FAIL line, exit 1, before any Gong call', async () => {
  const lines = []; let calls = 0;
  const code = await runCli(['--measure-transcripts', '--book-bytes', 'abc'], { config: { gong: GONG }, stateDir: mkdtempSync(join(tmpdir(), 'measure-')),
    out: (l) => lines.push(l), deps: { fetchImpl: async () => { calls++; return json(200, EXTENSIVE); }, sleep: async () => {} } });
  assert.equal(code, 1);
  assert.deepEqual(lines, ['FAIL measure: --book-bytes must be a number of bytes, 0 or more; who fixes it: Ian']);
  assert.equal(calls, 0);
});

test('measure F18: a call Gong returns no transcript for is counted apart and left out of the figures', async () => {
  const extra = { metaData: { id: 'FAKE-NO-TX', url: 'https://fake-tenant.gong.invalid/call?id=FAKE-NO-TX', title: 'FAKE call without transcript', started: '2026-09-25T15:00:00Z', duration: 600 },
    parties: [{ emailAddress: ME, name: 'Ian Fake', affiliation: 'Internal' }], content: {} };
  const r = await measureWith(tenant(TRANSCRIPTS, { ...EXTENSIVE, calls: [...EXTENSIVE.calls, extra] }));
  assert.equal(r.code, 0);
  assert.deepEqual(r.lines.slice(0, 4), [
    'measured: calls in the last 30 days: 11',
    'measured: calls with no transcript returned: 1 (left out of the figures below)',
    'measured: transcript characters per call: median 55, mean 55, 90th percentile 90, max 100',
    'derived: calls per week: 2.3 (calls with a transcript)',
  ]);
});
