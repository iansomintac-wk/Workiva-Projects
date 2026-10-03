// --measure-transcripts (connect-ready §3.5, CR4): read-only; stores nothing. Supplies the numbers for Ian's I-2
// choice. Every line is labelled measured, derived or assumption. Node built-ins only.
import { loadAdapters } from '../adapters/index.mjs';

export const WEEKS_PER_MONTH = 52 / 12;
const DAYS = 30;
const fmt = (n) => Number(n).toLocaleString('en-US');

export function stats(lengths) {
  const s = [...lengths].sort((a, b) => a - b);
  const n = s.length;
  if (!n) return { count: 0, median: null, mean: null, p90: null, max: null };
  const median = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  return { count: n, median, mean: s.reduce((a, b) => a + b, 0) / n, p90: s[Math.ceil(0.9 * n) - 1], max: s[n - 1] };
}

export async function runMeasure({ config = {}, stateDir, deps = {}, out = console.log, bookBytes = null, quotaBytes = 5000000, now = () => new Date() } = {}) {
  const cfg = config.gong || {};
  if (cfg.adapter !== 'gong-rest') { out('FAIL measure: gong.adapter is not "gong-rest"; run node connector/server.mjs --setup; who fixes it: Ian'); return 1; }
  const gong = loadAdapters({ gong: cfg }, { ...deps, stateDir }).gong;
  const since = new Date(now().getTime() - DAYS * 86400000).toISOString();
  let r;
  try { r = await gong.transcriptLengths({ since }); }
  catch (e) { out(`FAIL measure: ${e.message}; who fixes it: ${e.status === 403 ? 'Gong admin (needs api:calls:read:transcript)' : 'Ian'}`); return 1; }
  const st = stats(r.lengths);
  out(`measured: calls in the last ${DAYS} days: ${r.calls}`);
  if (!st.count) { out('derived: nothing to project (no calls in the window)'); return 0; }
  out(`measured: transcript characters per call: median ${fmt(st.median)}, mean ${fmt(Math.round(st.mean))}, 90th percentile ${fmt(st.p90)}, max ${fmt(st.max)}`);
  const perWeek = r.calls / (DAYS / 7);
  out(`derived: calls per week: ${perWeek.toFixed(1)}`);
  out(`assumption: localStorage quota ${fmt(quotaBytes)} bytes (not measured; --quota-bytes to change); 1 character counted as 1 byte`);
  if (bookBytes == null) { out('derived: months until the book fills: not computed (pass --book-bytes <n>)'); return 0; }
  out(`measured: book size given: ${fmt(bookBytes)} bytes (--book-bytes)`);
  const months = (quotaBytes - bookBytes) / (perWeek * st.mean) / WEEKS_PER_MONTH;
  out(`derived: months until the book fills at this rate: ${months.toFixed(1)}`);
  return 0;
}
