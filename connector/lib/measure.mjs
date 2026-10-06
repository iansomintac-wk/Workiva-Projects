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

const validBytes = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

export async function runMeasure({ config = {}, stateDir, deps = {}, out = console.log, bookBytes = null, quotaBytes = 5000000, now = () => new Date() } = {}) {
  const cfg = config.gong || {};
  if (cfg.adapter !== 'gong-rest') { out('FAIL measure: gong.adapter is not "gong-rest"; run node connector/server.mjs --setup; who fixes it: Ian'); return 1; }
  // T-14 F17: a flag that is not a byte count stops here, before any Gong call (Number('abc') is NaN).
  for (const [flag, v] of [['--book-bytes', bookBytes], ['--quota-bytes', quotaBytes]]) {
    if (v !== null && !validBytes(v)) { out(`FAIL measure: ${flag} must be a number of bytes, 0 or more; who fixes it: Ian`); return 1; }
  }
  const gong = loadAdapters({ gong: cfg }, { ...deps, stateDir }).gong;
  const since = new Date(now().getTime() - DAYS * 86400000).toISOString();
  let r;
  try { r = await gong.transcriptLengths({ since }); }
  // F24: the transcript endpoint's scope is CONFIRMED for OAuth (research Q3); how a Basic key gets scopes is not (F5).
  catch (e) { out(`FAIL measure: ${e.message}; who fixes it: ${e.status === 403 ? 'Gong admin (the key may lack api:calls:read:transcript; how a key gets scopes is to confirm)' : 'Ian'}`); return 1; }
  out(`measured: calls in the last ${DAYS} days: ${r.calls}`);
  if (!r.calls) { out('derived: nothing to project (no calls in the window)'); return 0; }
  if (r.noTranscript) out(`measured: calls with no transcript returned: ${r.noTranscript} (left out of the figures below)`);
  const st = stats(r.lengths);
  if (!st.count) { out('derived: nothing to project (no transcripts returned)'); return 0; }
  out(`measured: transcript characters per call: median ${fmt(st.median)}, mean ${fmt(Math.round(st.mean))}, 90th percentile ${fmt(st.p90)}, max ${fmt(st.max)}`);
  const perWeek = st.count / (DAYS / 7);
  out(`derived: calls per week: ${perWeek.toFixed(1)}${r.noTranscript ? ' (calls with a transcript)' : ''}`);
  out(`assumption: localStorage quota ${fmt(quotaBytes)} bytes (not measured; --quota-bytes to change); 1 character counted as 1 byte`);
  if (bookBytes == null) { out('derived: months until the book fills: not computed (pass --book-bytes <n>)'); return 0; }
  out(`measured: book size given: ${fmt(bookBytes)} bytes (--book-bytes)`);
  const notComputed = (why) => out(`derived: months until the book fills: not computed (${why})`);
  if (!(st.mean > 0)) { notComputed('every transcript returned is empty'); return 0; }
  if (bookBytes >= quotaBytes) { notComputed('the book is already at or over the quota'); return 0; }
  const months = (quotaBytes - bookBytes) / (perWeek * st.mean) / WEEKS_PER_MONTH;
  out(`derived: months until the book fills at this rate: ${months.toFixed(1)}`);
  return 0;
}
