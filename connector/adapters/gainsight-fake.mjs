// FAKE Gainsight adapter: serves connector/fixtures/accounts.json; push only appends to a local log.
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'accounts.json');

export function create({ logPath } = {}) {
  return {
    name: 'fake',
    async listAccounts() {
      return JSON.parse(readFileSync(file, 'utf8')).accounts;
    },
    async push(items, { logPath: lp } = {}) {
      const path = lp || logPath;
      return items.map((it) => {
        if (path) appendFileSync(path, `${JSON.stringify({ at: new Date().toISOString(), ...it })}\n`);
        if (it.fields && it.fields.forceFail === true) {
          return { id: it.id, status: 'failed', externalId: null, error: 'fake failure (forceFail)' };
        }
        return { id: it.id, status: 'sent', externalId: `FAKE-${it.id}`, error: null };
      });
    },
  };
}
