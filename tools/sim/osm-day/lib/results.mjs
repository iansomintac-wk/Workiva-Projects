// Result rules, inventory, break verdict and exit code for the day+lifecycle sim.
export const STEP_IDS = [
  ...Array.from({ length: 10 }, (_, i) => `D${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `L${i + 1}`),
];
export const CHECKED = STEP_IDS.filter((id) => id !== 'L12');

export const GAPS = {
  D3: 'meeting agenda',
  D7: ['close a CTA after an ordinary call', 'success plan task update', 'Renewal Forecast Scorecard'],
  L10: 'CSM request (Google form)',
  L12: 'CSAT survey sent/answered tracking and follow-up',
};

export function classify({ id, passed } = {}) {
  if (!STEP_IDS.includes(id)) throw new Error(`unknown step id: ${id}`);
  if (id === 'L12') return { id, status: 'GAP', gap: GAPS.L12 };
  if (typeof passed !== 'boolean') throw new Error(`step ${id} needs a boolean passed`);
  const r = { id, status: passed ? 'PASS' : 'FAIL' };
  if (GAPS[id]) r.gap = GAPS[id];
  return r;
}

export function breakVerdict(base, broken) {
  if (base !== 'PASS') return 'NOT-TESTED';
  return broken === 'FAIL' ? 'FLIPPED' : 'VACUOUS';
}

export function validateRun({ steps = [], breaks = [], scope } = {}) {
  const errs = [];
  const wantSteps = scope ? scope.ids : STEP_IDS;
  const wantBreaks = scope ? (scope.breaks ? scope.ids.filter((i) => CHECKED.includes(i)) : []) : CHECKED;

  const sIds = steps.map((s) => s.id);
  const bIds = breaks.map((b) => b.id);
  for (const id of sIds) if (!STEP_IDS.includes(id)) errs.push(`unknown step id ${id}`);
  for (const id of bIds) if (!STEP_IDS.includes(id)) errs.push(`unknown break id ${id}`);
  for (const id of wantSteps) if (!sIds.includes(id)) errs.push(`missing step ${id}`);
  for (const id of new Set(sIds)) {
    if (STEP_IDS.includes(id) && !wantSteps.includes(id)) errs.push(`unexpected step ${id}`);
    if (sIds.filter((x) => x === id).length > 1) errs.push(`duplicate step ${id}`);
  }
  for (const id of wantBreaks) if (!bIds.includes(id)) errs.push(`missing break ${id}`);
  for (const id of new Set(bIds)) {
    if (id === 'L12') errs.push('break on L12');
    else if (STEP_IDS.includes(id) && !wantBreaks.includes(id)) errs.push(`unexpected break ${id}`);
    if (bIds.filter((x) => x === id).length > 1) errs.push(`duplicate break ${id}`);
  }
  for (const s of steps) {
    if (CHECKED.includes(s.id) && s.status === 'GAP') errs.push(`checked step ${s.id} reported GAP`);
  }
  for (const b of breaks) {
    if (b.verdict === 'NOT-TESTED') {
      const s = steps.find((x) => x.id === b.id);
      if (!s || s.status !== 'FAIL') errs.push(`break ${b.id} NOT-TESTED without a FAIL step`);
    }
  }
  return errs;
}

export function exitCode({ steps = [], breaks = [], scope, harnessError } = {}) {
  if (harnessError) return 2;
  if (validateRun({ steps, breaks, scope }).length) return 2;
  if (steps.some((s) => s.status === 'FAIL')) return 1;
  if (breaks.some((b) => b.verdict !== 'FLIPPED')) return 1;
  return 0;
}
