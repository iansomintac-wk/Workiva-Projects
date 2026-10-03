// Cleanup helpers for tools/connector-e2e.mjs (connect-ready T-1). A cleanup problem is reported, never thrown,
// so the harness exit code is the scenarios' result. Node built-ins only.
import { rmSync } from 'node:fs';

// Node retries EPERM/EBUSY/ENOTEMPTY with a linear backoff: 12 tries at 250 ms steps waits up to ~19.5 s in all.
export function removeDir(path, label, rm = rmSync) {
  try { rm(path, { recursive: true, force: true, maxRetries: 12, retryDelay: 250 }); return null; }
  catch (e) { return `${label} not removed (${e && (e.code || e.message)}): ${path}`; }
}

export function waitForExit(child, ms) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((r) => { const t = setTimeout(r, ms); child.once('exit', () => { clearTimeout(t); r(); }); });
}
