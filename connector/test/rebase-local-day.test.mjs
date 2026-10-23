// Fix A / S5: the fake adapters rebase on the same calendar day the tracker's todayISO() uses (the local day), not the UTC day.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'NODE_TEST_CONTEXT'));

function run(tz, nowISO) {
  const code = `import('./connector/lib/rebase.mjs').then(async (m) => {
    const { create } = await import('./connector/adapters/snowflake-fake.mjs');
    const now = Date.parse(${JSON.stringify(nowISO)});
    const rows = await create({ rebaseToToday: true, fixture: 'demo', now }).listCsat();
    const newest = rows.flatMap((r) => [r.CSAT_SENT_DATE, r.CSAT_ANSWERED_DATE]).filter(Boolean).sort().at(-1);
    const d = new Date(now); const local = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    console.log(JSON.stringify({ local, newest, days: m.rebaseDays('2026-10-01', now) }));
  });`;
  const r = spawnSync(process.execPath, ['-e', code], { cwd: root, env: { ...env, TZ: tz }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim());
}

test('17:30 PDT on 2026-10-22 (already 2026-10-23 in UTC): newest fake CSAT date lands the day before the LOCAL today', () => {
  const r = run('America/Los_Angeles', '2026-10-23T00:30:00Z');
  assert.equal(r.local, '2026-10-22');
  assert.equal(r.newest, '2026-10-21');
});

test('the same instant gives the same answer in the morning and the evening of one local day', () => {
  const morning = run('America/Los_Angeles', '2026-10-22T16:00:00Z');   // 09:00 PDT
  const evening = run('America/Los_Angeles', '2026-10-23T00:30:00Z');   // 17:30 PDT
  assert.equal(morning.newest, evening.newest);
  assert.equal(morning.days, evening.days);
});
