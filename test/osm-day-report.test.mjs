import test from 'node:test';
import assert from 'node:assert/strict';
import { summaryLine, renderReport, diffVersions, stripTimings } from '../tools/sim/osm-day/lib/report.mjs';

const rec = (o) => ({ id: 'D1', status: 'PASS', evidence: 'ev', day: '2026-10-21', ...o });

test('identical lists diff to empty', () => {
  assert.deepEqual(diffVersions([rec({})], [rec({})]), []);
});

test('differing evidence gives one entry naming the id', () => {
  const d = diffVersions([rec({ id: 'D2' }), rec({ id: 'D4' })], [rec({ id: 'D2' }), rec({ id: 'D4', evidence: 'other' })]);
  assert.equal(d.length, 1);
  assert.equal(d[0].id, 'D4');
});

test('an id present in only one list is a diff entry', () => {
  const d = diffVersions([rec({ id: 'D1' })], [rec({ id: 'D1' }), rec({ id: 'D9' })]);
  assert.deepEqual(d.map((e) => e.id), ['D9']);
});

test('summaryLine for GAP names GAP and the id', () => {
  const s = summaryLine(rec({ id: 'L12', status: 'GAP', gap: 'CSAT thing' }));
  assert.match(s, /L12/);
  assert.match(s, /GAP/);
  assert.match(s, /CSAT thing/);
});

test('summaryLine shows NOT-TESTED break result and joins array gaps', () => {
  const s = summaryLine(rec({ id: 'D7', status: 'FAIL', breakResult: 'NOT-TESTED', gap: ['a1', 'b2'] }));
  assert.match(s, /NOT-TESTED/);
  assert.match(s, /a1/);
  assert.match(s, /b2/);
});

test('renderReport lists every id and status, PARTIAL iff partial', () => {
  const steps = [rec({ id: 'D1' }), rec({ id: 'L3', status: 'FAIL' })];
  const full = renderReport({ version: '1.1', steps, startedAt: '2026-10-16T00:00:00Z', partial: false });
  const part = renderReport({ version: '1.1', steps, startedAt: '2026-10-16T00:00:00Z', partial: true });
  for (const t of ['D1', 'L3', 'PASS', 'FAIL', '1.1']) assert.ok(full.includes(t), t);
  assert.ok(!full.includes('PARTIAL'));
  assert.ok(part.includes('PARTIAL'));
});

test('stripTimings: runs differing only in startedAt/ms are equal', () => {
  const a = { version: '1.0', startedAt: 'x', steps: [{ id: 'D1', status: 'PASS', ms: 5 }] };
  const b = { version: '1.0', startedAt: 'y', steps: [{ id: 'D1', status: 'PASS', ms: 900 }] };
  assert.deepEqual(stripTimings(a), stripTimings(b));
});

test('stripTimings: a differing status stays different', () => {
  const a = { startedAt: 'x', steps: [{ id: 'D1', status: 'PASS', ms: 5 }] };
  const b = { startedAt: 'x', steps: [{ id: 'D1', status: 'FAIL', ms: 5 }] };
  assert.notDeepEqual(stripTimings(a), stripTimings(b));
});

test('stripTimings does not mutate its input', () => {
  const a = { startedAt: 'x', steps: [{ id: 'D1', ms: 5 }] };
  stripTimings(a);
  assert.equal(a.startedAt, 'x');
  assert.equal(a.steps[0].ms, 5);
});
