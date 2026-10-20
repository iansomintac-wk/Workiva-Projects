// FAKE Snowflake adapter: serves connector/fixtures/snowflake-csat.json. No network.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'snowflake-csat.json');

export function create() {
  return {
    name: 'fake',
    async listCsat({ since } = {}) {
      const rows = JSON.parse(readFileSync(file, 'utf8')).rows;
      if (!since) return rows;
      const t = String(since).slice(0, 10);
      return rows.filter((r) => (r.CSAT_ANSWERED_DATE || r.CSAT_SENT_DATE) >= t);
    },
  };
}
