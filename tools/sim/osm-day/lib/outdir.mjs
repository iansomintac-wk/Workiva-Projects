// Output-folder and download helpers shared by run.mjs, verify.mjs and the download steps.
import { readdirSync, statSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';

// Resolve p; it must lie strictly under <root>/sim-runs, else throw (callers exit 2 before creating anything).
export function resolveUnderSimRuns(p, root) {
  const base = resolve(root, 'sim-runs');
  const full = resolve(p);
  const low = s => (process.platform === 'win32' ? s.toLowerCase() : s);
  if (!low(full).startsWith(low(base + sep))) throw new Error(`${p} is outside ${base}`);
  return full;
}

// Files in dir with the extension whose mtime is at or after sinceMs (a download that landed after the click).
export function filesSince(dir, sinceMs, ext) {
  return readdirSync(dir).filter(f => f.endsWith(ext) && statSync(join(dir, f)).mtimeMs >= sinceMs);
}
