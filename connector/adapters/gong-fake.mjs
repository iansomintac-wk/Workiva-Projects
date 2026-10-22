// FAKE Gong adapter: serves connector/fixtures/calls.json. No network.
// rebaseToToday (default false): shift startedAt by whole days so the newest call lands 1 day before today.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rebaseDays, shiftISO } from '../lib/rebase.mjs';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'calls.json');

export function create({ rebaseToToday = false, now } = {}) {
  return {
    name: 'fake',
    async listCalls({ since } = {}) {
      let calls = JSON.parse(readFileSync(file, 'utf8')).calls;
      if (rebaseToToday) {
        const newest = calls.map((c) => c.startedAt).sort().at(-1);
        const d = rebaseDays(newest, now);
        calls = calls.map((c) => ({ ...c, startedAt: shiftISO(c.startedAt, d) }));
      }
      if (!since) return calls;
      const t = Date.parse(since);
      return calls.filter((c) => Date.parse(c.startedAt) >= t);
    },
  };
}
