// FAKE Gong adapter: serves connector/fixtures/calls.json. No network.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'calls.json');

export function create() {
  return {
    name: 'fake',
    async listCalls({ since } = {}) {
      const calls = JSON.parse(readFileSync(file, 'utf8')).calls;
      if (!since) return calls;
      const t = Date.parse(since);
      return calls.filter((c) => Date.parse(c.startedAt) >= t);
    },
  };
}
