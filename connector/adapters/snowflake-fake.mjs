// FAKE Snowflake adapter: serves connector/fixtures/snowflake-csat.json (config fixture: 'demo' serves snowflake-csat-demo.json). No network.
// rebaseToToday (default false): shift the CSAT dates by whole days so the newest lands 1 day before today.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rebaseDays, shiftISO } from '../lib/rebase.mjs';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const DATES = ['CSAT_SENT_DATE', 'CSAT_ANSWERED_DATE'];

export function create({ rebaseToToday = false, now, fixture } = {}) {
  const file = join(fixtures, fixture === 'demo' ? 'snowflake-csat-demo.json' : 'snowflake-csat.json');
  return {
    name: 'fake',
    async listCsat({ since } = {}) {
      let rows = JSON.parse(readFileSync(file, 'utf8')).rows;
      if (rebaseToToday) {
        const newest = rows.flatMap((r) => DATES.map((k) => r[k])).filter(Boolean).sort().at(-1);
        const d = rebaseDays(newest, now);
        rows = rows.map((r) => {
          const o = { ...r };
          for (const k of DATES) if (o[k]) o[k] = shiftISO(o[k], d);
          return o;
        });
      }
      if (!since) return rows;
      const t = String(since).slice(0, 10);
      return rows.filter((r) => (r.CSAT_ANSWERED_DATE || r.CSAT_SENT_DATE) >= t);
    },
  };
}
