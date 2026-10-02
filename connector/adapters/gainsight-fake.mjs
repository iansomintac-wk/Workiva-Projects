// FAKE Gainsight adapter: serves connector/fixtures/accounts.json; push only appends to a local log.
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'accounts.json');

export function create({ logPath } = {}) {
  const sent = new Map();   // R3 I-5: push is idempotent by item id; a sent id is answered again, not sent again
  return {
    name: 'fake',
    async listAccounts() {
      return JSON.parse(readFileSync(file, 'utf8')).accounts;
    },
    async push(items, { logPath: lp } = {}) {
      const path = lp || logPath;
      return items.map((it) => {
        if (sent.has(it.id)) return { id: it.id, status: 'sent', externalId: sent.get(it.id), error: null };
        if (path) appendFileSync(path, `${JSON.stringify({ at: new Date().toISOString(), ...it })}\n`);
        if (it.fields && it.fields.forceFail === true) {
          return { id: it.id, status: 'failed', externalId: null, error: 'fake failure (forceFail)' };
        }
        sent.set(it.id, `FAKE-${it.id}`);
        return { id: it.id, status: 'sent', externalId: `FAKE-${it.id}`, error: null };
      });
    },
  };
}
