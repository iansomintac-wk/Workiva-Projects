// Orchestrator for the OSM day+lifecycle sim (dev tooling, not part of the bundle).
// usage: node tools/sim/osm-day/run.mjs [--version 1.0|1.1] [--part A|B] [--only <ids>] [--no-breaks] [--out <dir>]
// Writes <out>/{report-<v>.md, results-<v>.json, diff.md, run.log, times.txt}; default <out> is sim-runs/<stamp>.
// Exit: 0 clean, 1 findings (FAIL / VACUOUS / NOT-TESTED), 2 harness failure (inventory, guard, AI escape, cleanup).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './lib/browser.mjs';
import { setupA, setupB } from './lib/setup.mjs';
import { classify, breakVerdict, exitCode, CHECKED } from './lib/results.mjs';
import { summaryLine, renderReport, diffVersions } from './lib/report.mjs';
import { PART_A, PART_A_DEPS, DAY } from './steps-a.mjs';
import { PART_B, PART_B_ORDER, CAL, recomputeNT, ntMismatch } from './steps-b.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const A_IDS = PART_A.map(s => s.id);
const B_IDS = PART_B.map(s => s.id);
const VERSIONS = ['1.0', '1.1'];
const baseId = key => key.split('.')[0];

// ---- arguments and prerequisites -------------------------------------------------------------
export function parseArgs(argv) {
  const o = { versions: [...VERSIONS], parts: ['A', 'B'], breaks: true, partial: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => { if (i + 1 >= argv.length) throw new Error(`${a} needs a value`); return argv[++i]; };
    if (a === '--version') { const v = val(); if (!VERSIONS.includes(v)) throw new Error(`unknown version ${v} (want 1.0 or 1.1)`); o.versions = [v]; }
    else if (a === '--part') { const p = val(); if (!['A', 'B'].includes(p)) throw new Error(`unknown part ${p} (want A or B)`); o.parts = [p]; o.partial = true; }
    else if (a === '--only') {
      o.only = val().split(',').map(s => s.trim()).filter(Boolean);
      for (const id of o.only) if (![...A_IDS, ...B_IDS].includes(id)) throw new Error(`unknown step id ${id}`);
      o.partial = true;
    } else if (a === '--no-breaks') { o.breaks = false; o.partial = true; }
    else if (a === '--out') o.out = val();
    else throw new Error(`unknown flag ${a}`);
  }
  return o;
}

// Steps to run first, unchecked, labelled setup. Part B: every earlier step in date order. Part A: PART_A_DEPS.
export function prerequisites(ids) {
  const out = [];
  const selA = A_IDS.filter(id => ids.includes(id));
  const need = new Set();
  const addDeps = id => { for (const d of PART_A_DEPS[id] || []) if (!ids.includes(d)) { need.add(d); addDeps(d); } };
  selA.forEach(addDeps);
  out.push(...A_IDS.filter(id => need.has(id)));
  const selB = B_IDS.filter(id => ids.includes(id));
  if (selB.length) {
    const earliest = id => PART_B_ORDER.findIndex(k => baseId(k) === id);
    const cut = Math.max(...selB.map(earliest));
    out.push(...PART_B_ORDER.slice(0, cut).filter(k => !ids.includes(baseId(k))));
  }
  return out;
}

// ---- guards -----------------------------------------------------------------------------------
export function checkEscaped(stats, label) {
  if (stats && stats.escaped > 0) throw new Error(`AI requests escaped the fake in ${label}: ${stats.escaped}`);
}
const norm = s => String(s).replace(/\s+/g, ' ').trim();
export function d3Guard(before, after) {
  if (before == null) return ['no beat panel before the break'];
  if (after == null) return ['no beat panel after the break'];
  const errs = [];
  if (!(before.match(/SIM-OWE[^<]*/g) || []).length) errs.push('no seeded SIM-OWE entries on the panel before the break');
  if (/SIM-OWE/.test(after)) errs.push('SIM-OWE entries remain after the break');
  for (const t of ['SIM-QUESTION', 'Call prep', 'Open questions']) if (!after.includes(t)) errs.push(`"${t}" missing after the break`);
  if (norm(before.replace(/SIM-OWE[^<]*/g, '')) !== norm(after)) errs.push('the rest of the panel changed (break too wide)');
  return errs;
}
export function d4Guard(base, broken) {
  const errs = [];
  if (!base || !base.found) return ['D4 activity not found before the break'];
  if (!broken.found) errs.push('D4 activity missing after the break');
  else if (broken.summary !== base.summary) errs.push('D4 activity summary changed');
  if (broken.count !== base.count) errs.push(`account activity count ${base.count} -> ${broken.count}`);
  return errs;
}
export function d6Guard(base, broken) {
  const errs = [];
  for (const b of base) {
    const m = broken.find(x => x.text === b.text);
    if (!m) { errs.push(`commitment "${b.text}" lost`); continue; }
    if (!/^SIM-D6 /.test(b.text) && m.doneOn !== b.doneOn) errs.push(`commitment "${b.text}" doneOn ${b.doneOn} -> ${m.doneOn}`);
  }
  return errs;
}
export function l6Remaining(evidence) {
  const m = /remainingThroughDay7=\[([^\]]*)\]/.exec(evidence || '');
  return m ? m[1].split(' ;; ').map(s => s.trim()).filter(Boolean) : [];
}

const GUARD = {
  D3: {
    capture: async ctx => { await ctx.openOn(DAY); return ctx.ev(`(() => { const c = DATA.customers.find(x => x.name === 'Orion Semiconductor');
      ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = c.id; render();
      const p = document.querySelector('.day-pane[data-day-holds="' + c.id + '"]'); return p ? p.innerHTML : null; })()`); },
    check: d3Guard,
  },
  D4: {
    capture: ctx => ctx.ev(`(() => { const s = ${JSON.stringify(ctx.state.d4 || {})}; const acts = DATA.activities[s.customerId] || [];
      const a = acts.find(x => x.id === s.activityId);
      return { found: !!a, count: acts.length, summary: a ? a.summary : null, hasTranscript: !!(a && a.transcript) }; })()`),
    check: d4Guard,
  },
  D6: {
    capture: ctx => ctx.ev(`(() => { const c = DATA.customers.find(x => x.name === 'Orion Semiconductor');
      return (c.commitments || []).map(x => ({ text: x.text, doneOn: x.doneOn || null })); })()`),
    check: d6Guard,
  },
};

// ---- one part of one version ------------------------------------------------------------------
const cut = (s, n) => String(s).replace(/\s+/g, ' ').slice(0, n);
const snapshotWithDay = async ctx => { const s = await ctx.snapshot(); s.day = await ctx.ev('todayISO()'); return s; };

async function runStep(ctx, step, key) {
  if (key === 'L9.phase1') return step.phase1(ctx);
  if (key === 'L9.phase2') return step.phase2(ctx);
  return step.run(ctx);
}

async function runPart({ v, part, ids, prereq, breaksOn, runDir, log }) {
  const steps = part === 'A' ? PART_A : PART_B;
  const keys = part === 'A' ? A_IDS : PART_B_ORDER;
  const chosen = keys.filter(k => prereq.includes(k) || ids.includes(baseId(k)));
  const t0 = Date.now();
  const recs = [];
  const snaps = {};
  const guards = {};
  const ctx = await launch({ version: v, startDay: part === 'A' ? DAY : CAL.L1, runDir: join(runDir, v), part });
  try {
    await (part === 'A' ? setupA : setupB)(ctx);
    log.push(`setup | ${v} part ${part}: ${part === 'A' ? 'implementation account ' + ctx.state.setup.implAccount : 'accounts ' + ctx.state.setup.accounts}`);
    for (const key of chosen) {
      const id = baseId(key);
      const step = steps.find(s => s.id === id);
      snaps[key] = await snapshotWithDay(ctx);
      const t = Date.now();
      const r = await runStep(ctx, step, key);
      if (prereq.includes(key)) { log.push(`${key} (setup) | ${v} ran unchecked`); continue; }
      if (key === 'L9.phase1') continue;
      const rec = { ...classify({ id, passed: r.passed }), evidence: cut(r.evidence, 600) };
      rec.ms = Date.now() - t;
      if (GUARD[id]) guards[id] = await GUARD[id].capture(ctx);
      recs.push(rec);
    }
    log.push(`ai | ${v} part ${part} base: fake ${ctx.aiStats().fake}, escaped ${ctx.aiStats().escaped}; page errors ${ctx.pageErrors.length}`);
    checkEscaped(ctx.aiStats(), `${v} part ${part}`);
  } finally { await ctx.stop(); }
  const baseMs = Date.now() - t0;

  const breaks = [];
  const t1 = Date.now();
  if (breaksOn) {
    for (const rec of recs) {
      const id = rec.id;
      if (!CHECKED.includes(id)) continue;
      const seed = snaps[id === 'L9' ? 'L9.phase1' : id];
      if (!seed) throw new Error(`no snapshot for ${id}`);
      const c2 = await launch({ version: v, startDay: seed.day, runDir: join(runDir, `${v}-breaks`), part, seed });
      try {
        if (id === 'L10' || id === 'L11') {
          const mm = ntMismatch({ N: c2.state.N, T: c2.state.T }, await recomputeNT(c2));
          if (mm) throw new Error(`${id}: restored state differs from saved data (${mm})`);
        }
        await c2.setBreak(id);
        const step = steps.find(s => s.id === id);
        let r;
        if (id === 'L9') { await step.phase1(c2); r = await step.phase2(c2); } else r = await step.run(c2);
        const broken = classify({ id, passed: r.passed });
        const verdict = breakVerdict(rec.status, broken.status);
        let evidence = cut(r.evidence, 400);
        if (rec.status === 'PASS' && GUARD[id]) {
          const errs = GUARD[id].check(guards[id], await GUARD[id].capture(c2));
          if (errs.length) throw new Error(`${id} break guard: ${errs.join('; ')}`);
        }
        let final = verdict;
        if (id === 'L6' && rec.status === 'PASS') {
          const rem = l6Remaining(String(r.evidence));
          if (rem.length) { final = 'VACUOUS'; evidence = `Fernhollow still on Today through day 7: ${rem.join(' ;; ')}`; }
        }
        breaks.push({ id, verdict: final, base: rec.status, broken: broken.status, evidence });
        rec.breakResult = final;
        log.push(`ai | ${v} ${id} break: fake ${c2.aiStats().fake}, escaped ${c2.aiStats().escaped}`);
        checkEscaped(c2.aiStats(), `${v} ${id} break`);
      } finally { await c2.stop(); }
    }
  }
  recs.sort((x, y) => steps.findIndex(s => s.id === x.id) - steps.findIndex(s => s.id === y.id));
  return { recs, breaks, baseMs, breakMs: Date.now() - t1 };
}

// ---- main -------------------------------------------------------------------------------------
export async function main(argv) {
  const args = parseArgs(argv);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = args.out ? resolve(args.out) : join(ROOT, 'sim-runs', stamp);
  mkdirSync(outDir, { recursive: true });
  const log = [];
  const times = [];
  const prereq = args.only ? prerequisites(args.only) : [];
  const partIds = part => (args.only ? args.only.filter(id => (part === 'A' ? A_IDS : B_IDS).includes(id)) : part === 'A' ? A_IDS : B_IDS);
  const parts = args.only && !argv.includes('--part') ? args.parts.filter(p => partIds(p).length) : args.parts;
  const allIds = parts.flatMap(partIds);
  const scope = args.partial ? { ids: allIds, breaks: args.breaks } : undefined;
  let worst = 0; let harnessError = null;
  const perVersion = {};
  try {
    for (const v of args.versions) {
      const startedAt = new Date().toISOString();
      let steps = []; let breaks = [];
      for (const part of parts) {
        const ids = partIds(part);
        const pre = prereq.filter(k => (part === 'A' ? A_IDS : PART_B_ORDER).includes(k));
        const r = await runPart({ v, part, ids, prereq: pre, breaksOn: args.breaks, runDir: outDir, log });
        steps = steps.concat(r.recs); breaks = breaks.concat(r.breaks);
        times.push(`${v} part ${part}: ${(r.baseMs / 1000).toFixed(1)}s steps + ${(r.breakMs / 1000).toFixed(1)}s breaks = ${((r.baseMs + r.breakMs) / 1000).toFixed(1)}s`);
      }
      perVersion[v] = { version: v, partial: args.partial, startedAt, steps, breaks };
      const code = exitCode({ steps, breaks, scope });
      worst = Math.max(worst, code);
      writeFileSync(join(outDir, `report-${v}.md`), renderReport({ version: v, steps, startedAt, partial: args.partial }));
      writeFileSync(join(outDir, `results-${v}.json`), JSON.stringify(perVersion[v], null, 2));
      for (const s of steps) log.push(`${v} | ${args.partial ? 'PARTIAL ' : ''}${summaryLine(s)}`);
      log.push(`summary ${v} | steps ${steps.length} breaks ${breaks.length} | exit ${code}`);
    }
  } catch (e) {
    harnessError = e.message; worst = 2;
    log.push(`harness error: ${e.message}`);
  }
  const vs = Object.keys(perVersion);
  const diff = vs.length === 2
    ? diffVersions(perVersion[vs[0]].steps, perVersion[vs[1]].steps).map(d => `- ${d.id}: ${vs[0]} ${d.a ? summaryLine(d.a) : '-'} || ${vs[1]} ${d.b ? summaryLine(d.b) : '-'}`)
    : ['(one version run: nothing to compare)'];
  writeFileSync(join(outDir, 'diff.md'), `# 1.0 vs 1.1 differences\n\n${diff.join('\n') || '(none)'}\n`);
  writeFileSync(join(outDir, 'times.txt'), times.join('\n') + '\n');
  writeFileSync(join(outDir, 'run.log'), log.join('\n') + '\n');
  for (const l of log) console.log(l.slice(0, 260));
  console.log('times:'); for (const t of times) console.log('  ' + t);
  console.log(`run folder: ${outDir}`);
  return harnessError ? 2 : worst;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then(code => process.exit(code), e => { console.log('run harness error: ' + e.message); process.exit(2); });
}
