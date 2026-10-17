// Report, version diff and summary line for the day+lifecycle sim.
const gapText = (g) => (Array.isArray(g) ? g.join('; ') : g);

export function summaryLine(rec) {
  const parts = [`${rec.id} ${rec.status}`];
  if (rec.gap) parts.push(`GAP: ${gapText(rec.gap)}`);
  if (rec.breakResult) parts.push(`break ${rec.breakResult}`);
  if (rec.day) parts.push(`day ${rec.day}`);
  if (rec.evidence) parts.push(rec.evidence);
  return parts.join(' | ');
}

export function renderReport({ version, steps = [], startedAt, partial } = {}) {
  const lines = [`# OSM day+lifecycle sim report, tracker ${version}`];
  if (partial) lines.push('', 'PARTIAL run: not every step or break was run.');
  lines.push('', `Started: ${startedAt}`, '');
  for (const s of steps) lines.push(`- ${summaryLine(s)}`);
  return lines.join('\n') + '\n';
}

const key = (r) => JSON.stringify([r.status, r.gap ?? null, r.evidence ?? null, r.day ?? null, r.breakResult ?? null]);

export function diffVersions(a = [], b = []) {
  const ma = new Map(a.map((r) => [r.id, r]));
  const mb = new Map(b.map((r) => [r.id, r]));
  const ids = [...new Set([...ma.keys(), ...mb.keys()])];
  const out = [];
  for (const id of ids) {
    const x = ma.get(id);
    const y = mb.get(id);
    if (!x || !y || key(x) !== key(y)) out.push({ id, a: x ?? null, b: y ?? null });
  }
  return out;
}

export function stripTimings(v) {
  if (Array.isArray(v)) return v.map(stripTimings);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, val] of Object.entries(v)) if (k !== 'startedAt' && k !== 'ms') o[k] = stripTimings(val);
    return o;
  }
  return v;
}
