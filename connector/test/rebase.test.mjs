import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rebaseDays, shiftISO } from '../lib/rebase.mjs';
import { create as gong } from '../adapters/gong-fake.mjs';
import { create as snow } from '../adapters/snowflake-fake.mjs';
import { loadAdapters } from '../adapters/index.mjs';

const DAY = 86400000;
const now = () => Date.now() + 90 * DAY;
// The tracker's todayISO() is the LOCAL date, so the rebase target is the local date too.
const localISO = (ms) => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const iso = (ms) => new Date(ms).toISOString();

test('default config keeps the fixed fixture dates', async () => {
  const calls = await gong({}).listCalls();
  const days = calls.map((c) => c.startedAt.slice(0, 10)).sort();
  assert.equal(days[0], '2026-09-08');
  assert.equal(days.at(-1), '2026-09-18');
});

test('rebaseToToday calls: all inside 30d, spacing unchanged, newest 1 day before today', async () => {
  const base = await gong({}).listCalls();
  const calls = await gong({ rebaseToToday: true, now }).listCalls({ since: iso(now() - 30 * DAY) });
  assert.equal(calls.length, 6);
  const t0 = Date.parse(base[0].startedAt);
  const r0 = Date.parse(calls[0].startedAt);
  calls.forEach((c, i) => assert.equal(Date.parse(c.startedAt) - r0, Date.parse(base[i].startedAt) - t0));
  const newest = Math.max(...calls.map((c) => Date.parse(c.startedAt)));
  assert.equal(iso(newest).slice(0, 10), localISO(now() - DAY));
});

test('rebaseToToday csat: every row, sent <= answered, empty stays empty', async () => {
  const base = await snow({}).listCsat();
  // the fixture spans 50 days, so a 30d window cannot hold every row; use 60d
  const rows = await snow({ rebaseToToday: true, now }).listCsat({ since: iso(now() - 60 * DAY) });
  assert.equal(rows.length, base.length);
  rows.forEach((r, i) => {
    if (r.CSAT_ANSWERED_DATE) assert.ok(r.CSAT_SENT_DATE <= r.CSAT_ANSWERED_DATE);
    else assert.equal(base[i].CSAT_ANSWERED_DATE, '');
  });
  const newest = rows.flatMap((r) => [r.CSAT_SENT_DATE, r.CSAT_ANSWERED_DATE]).filter(Boolean).sort().at(-1);
  assert.equal(newest, localISO(now() - DAY));
});

test('shiftISO keeps the time part; rebaseDays counts whole days minus lag', () => {
  assert.equal(shiftISO('2026-09-08T14:00:00Z', 10), '2026-09-18T14:00:00Z');
  assert.equal(shiftISO('2026-09-08', -8), '2026-08-31');
  assert.equal(rebaseDays('2026-09-20', new Date(2026, 8, 30, 12).getTime()), 9);
});

test('loadAdapters passes rebaseToToday and now to the fakes', async () => {
  const a = loadAdapters({ gong: { adapter: 'fake', rebaseToToday: true }, snowflake: { adapter: 'fake', rebaseToToday: true } }, { now });
  assert.equal((await a.gong.listCalls({ since: iso(now() - 30 * DAY) })).length, 6);
  assert.equal((await a.snowflake.listCsat({ since: iso(now() - 60 * DAY) })).length, 4);
});
