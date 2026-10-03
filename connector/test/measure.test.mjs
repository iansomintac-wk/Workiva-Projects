// connect-ready T-12: --measure-transcripts on fixtures and a stubbed fetch. Read-only; stores nothing. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { stats, runMeasure, WEEKS_PER_MONTH } from '../lib/measure.mjs';

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
