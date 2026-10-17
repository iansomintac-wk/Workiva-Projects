// Check helper for docs/EXTENSION_PROGRESS.md. usage: node docs/extension-checks/show.mjs <results-<v>.json> [id]
// Prints one line per step: "<id> <status> | break <verdict> | <evidence>" (evidence cut at 400 chars).
import { readFileSync } from 'node:fs';
const [file, only] = process.argv.slice(2);
const r = JSON.parse(readFileSync(file, 'utf8'));
for (const s of r.steps) {
  if (only && s.id !== only) continue;
  const b = (r.breaks || []).find(x => x.id === s.id);
  console.log(`${s.id} ${s.status} | break ${b ? b.verdict : '-'} | ${String(s.evidence || '').slice(0, 400)}`);
}
