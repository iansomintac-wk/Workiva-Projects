// Part B of the OSM day sim: Fernhollow Renewables through its lifecycle, steps L1-L6 (L7-L12 follow in Task 10).
// usage: node tools/sim/osm-day/steps-b.mjs --version 1.0|1.1 [--only L1,L2,...]
// Each step is {id, run(ctx) -> {passed, evidence}}. A step that cannot pass reports FAIL; it never bends its condition.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './lib/browser.mjs';
import { setupB } from './lib/setup.mjs';
import { classify } from './lib/results.mjs';
import { summaryLine } from './lib/report.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FERN = 'Fernhollow Renewables';

// Part B calendar (fake dates). L7-L12 are added by Task 10.
export const CAL = {
  L1: '2026-08-03', L2: '2026-08-05', L3: '2026-08-12',
  L4: { build: '2026-08-24', uat: '2026-09-21' },
  L5: '2026-10-05',
  L6: { from: '2026-10-06', to: '2026-10-26', day7: '2026-10-12' },
};

const DAY_MS = 86400000;
const utc = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / DAY_MS);
const addDays = (iso, n) => new Date(utc(iso) + n * DAY_MS).toISOString().slice(0, 10);

const fernId = ctx => ctx.ev(`(DATA.customers.find(x => x.name === ${JSON.stringify(FERN)}) || {}).id || null`);
const marker = async ctx => (await ctx.ev('window.__simBreak')) || null;
const withBreak = async (ctx, text) => { const m = await marker(ctx); return m ? `${text} [break ${m} active]` : text; };
const openPanel = (ctx, id, tab) => ctx.ev(`ui.view = 'accounts'; ui.openCustomerId = ${JSON.stringify(id)}; ui.panelTab = ${JSON.stringify(tab)}; render(); true`);
// Open the page on a fake day, then cancel the start-up "Download backup" nag (a confirm modal the tracker raises on load
// once the book has gone unexported); left open it sits in front of the step's own confirm and swallows its click.
async function openDay(ctx, iso) {
  await ctx.openOn(iso);
  for (let i = 0; i < 5; i++) {
    const closed = await ctx.ev(`(() => { const b = document.querySelector('.modal-backdrop #confirm-cancel'); if (b) b.click(); return !!b; })()`);
    if (!closed) break;
  }
}
// Close any modal left open (a refused action keeps its modal; a goal form opens after Go-Live).
const dismissModals = ctx => ctx.ev(`(() => { const b = document.querySelector('#confirm-cancel, #modal-cancel'); if (b) b.click(); return !!b; })()`);

// Fill the Log tab and save. `type` is the option value; the session field only exists after Go-Live and is left alone.
const logActivity = (ctx, type, summary) => ctx.ev(`(() => { const set = (i, v) => { const el = document.getElementById(i); if (!el) throw new Error('no #' + i); el.value = v;
  el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); };
  set('act-type', ${JSON.stringify(type)}); set('act-date', todayISO()); set('act-summary', ${JSON.stringify(summary)});
  document.getElementById('btn-save-activity').click(); return true; })()`);

async function setPhase(ctx, id, phase) {
  await openPanel(ctx, id, 'implementation');
  await sleep(200);
  await ctx.click(`[data-impl-phase="${phase}"]`);
  await sleep(300);
}

async function onTrackNoReadiness(ctx, id) {
  return JSON.parse(await ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)});
    const pend = pendingGainsightItems().filter(p => p.customerId === c.id);
    const rows = todayActionList().filter(r => r.customerId === c.id);
    return JSON.stringify({ risk: computeRisk(c), label: riskLabel(computeRisk(c)), impl: inImplementation(c), phase: c.implementation && c.implementation.phase,
      pending: pend.map(p => p.label), readinessRows: rows.filter(r => /Readiness Assessment|sentiment/i.test(JSON.stringify(r))).length }); })()`));
}

export const PART_B = [
  { id: 'L1', async run(ctx) {
    await openDay(ctx, CAL.L1);
    if (await fernId(ctx)) throw new Error('L1: Fernhollow already exists before it is added');
    await ctx.ev(`ui.view = 'accounts'; ui.openCustomerId = null; render(); true`);
    await ctx.click('#btn-add-customer');
    await ctx.type('#new-name', FERN);
    await ctx.type('#new-contact', 'Dana Reyes <dana.reyes@example.com>');
    await ctx.click('#new-in-impl');
    await ctx.ev(`document.getElementById('new-impl-phase').value = 'align'; document.getElementById('new-impl-phase').dispatchEvent(new Event('change', {bubbles: true})); true`);
    await ctx.type('#new-impl-partner', 'Example Partner Co');
    await ctx.click('#modal-save');
    await sleep(500);
    const r = JSON.parse(await ctx.ev(`(() => { const c = DATA.customers.find(x => x.name === ${JSON.stringify(FERN)});
      return JSON.stringify({ n: DATA.customers.length, found: !!c, impl: !!c && inImplementation(c), phase: c && c.implementation && c.implementation.phase,
        contact: (c && c.primaryContact) || null, start: c && c.implementationDate, today: todayISO() }); })()`));
    const exampleOnly = !r.contact || /example\.com/.test(r.contact);
    return { passed: r.found && r.n === 35 && r.impl && r.phase === 'align' && exampleOnly,
      evidence: await withBreak(ctx, `accounts ${r.n} (want 35); Fernhollow ${r.found ? 'added' : 'not found'}, in implementation ${r.impl}, phase ${r.phase}, start ${r.start} (today ${r.today}), contact ${r.contact}`) };
  } },
  { id: 'L2', async run(ctx) {
    await openDay(ctx, CAL.L2);
    const id = await fernId(ctx);
    if (!id) return { passed: false, evidence: 'Fernhollow does not exist at L2 (L1 did not add it)' };
    const want = { whatWasSold: 'SIM-L2 CSRD module, 40 seats.', promisedOutcomes: 'SIM-L2 first report ready before year end.',
      knownRisks: 'SIM-L2 partner capacity is thin.', salesContact: 'Sam Ortiz sam.ortiz@example.com' };
    await openPanel(ctx, id, 'handoff');
    await sleep(300);
    for (const [k, v] of Object.entries(want)) await ctx.type(`#ho-in-${k}`, v);
    await sleep(300);
    await openDay(ctx, CAL.L2); // reload: what survives is what was saved
    await openPanel(ctx, id, 'handoff');
    await sleep(300);
    const r = JSON.parse(await ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)});
      const stored = (c.handoffIn && c.handoffIn.values) || {};
      const shown = {}; Object.keys(${JSON.stringify(want)}).forEach(k => { const el = document.getElementById('ho-in-' + k); shown[k] = el ? el.value : null; });
      return JSON.stringify({ stored, shown }); })()`));
    const bad = Object.keys(want).filter(k => r.stored[k] !== want[k] || r.shown[k] !== want[k]);
    return { passed: !bad.length, evidence: await withBreak(ctx, bad.length ? `after reload, not stored/shown: ${bad.join(', ')}` : `${Object.keys(want).length} hand-off fields stored and shown after reload`) };
  } },
  { id: 'L3', async run(ctx) {
    await openDay(ctx, CAL.L3);
    const id = await fernId(ctx);
    if (!id) return { passed: false, evidence: 'Fernhollow does not exist at L3' };
    await setPhase(ctx, id, 'kickoff');
    await openPanel(ctx, id, 'log');
    await sleep(300);
    await logActivity(ctx, 'Partner Sync', 'SIM-L3 partner sync: kick-off scheduled with the partner team.');
    await sleep(800);
    const r = JSON.parse(await ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)});
      const a = (DATA.activities[c.id] || []).find(x => /^SIM-L3 /.test(x.summary || ''));
      return JSON.stringify({ phase: c.implementation && c.implementation.phase, found: !!a, type: a && a.type, checklist: a ? (a.checklist || []).map(i => i.label) : null, session: a && a.sessionNumber }); })()`));
    return { passed: r.phase === 'kickoff' && r.found && r.type === 'Partner Sync' && r.checklist.length === 0 && !r.session,
      evidence: await withBreak(ctx, `phase ${r.phase}; Partner Sync ${r.found ? 'logged' : 'not logged'}; checklist items ${r.checklist ? r.checklist.length : '-'}${r.checklist && r.checklist.length ? ' (' + r.checklist.join(' | ') + ')' : ''}; session ${r.session == null ? 'none' : r.session}`) };
  } },
  { id: 'L4', async run(ctx) {
    const rows = [];
    for (const [phase, iso] of [['build', CAL.L4.build], ['uat', CAL.L4.uat]]) {
      await openDay(ctx, iso);
      const id = await fernId(ctx);
      if (!id) return { passed: false, evidence: `Fernhollow does not exist at ${iso}` };
      await setPhase(ctx, id, phase);
      await openDay(ctx, iso); // re-render on the day, break re-installed
      const r = await onTrackNoReadiness(ctx, id);
      rows.push({ iso, phase, r, brk: await marker(ctx) });
    }
    const ok = rows.every(x => x.r.phase === x.phase && x.r.impl && x.r.risk === 'ontrack' && x.r.pending.length === 0 && x.r.readinessRows === 0);
    return { passed: ok, evidence: rows.map(x => `${x.iso} phase ${x.r.phase} ${x.r.label}, pending items ${x.r.pending.length}${x.r.pending.length ? ' (' + x.r.pending.slice(0, 2).join('; ') + ')' : ''}, Readiness Assessment rows ${x.r.readinessRows}, breakActive ${x.brk ? 'true' : 'false'}`).join(' | ') };
  } },
  { id: 'L5', async run(ctx) {
    await openDay(ctx, CAL.L5);
    const id = await fernId(ctx);
    if (!id) return { passed: false, evidence: 'Fernhollow does not exist at L5' };
    await openPanel(ctx, id, 'log');
    await sleep(300);
    await logActivity(ctx, 'Call', 'SIM-L5 hand-off call with Dana: partner hands the build to us.');
    await sleep(800);
    await openPanel(ctx, id, 'implementation');
    await sleep(300);
    await ctx.click('#btn-impl-golive');
    await sleep(300);
    await ctx.click('#confirm-ok');
    await sleep(600);
    await dismissModals(ctx); // the goal form that opens after Go-Live (or the confirm a refusal leaves open)
    await sleep(300);
    await openPanel(ctx, id, 'sessions');
    await sleep(300);
    const r = JSON.parse(await ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)});
      const a = (DATA.activities[c.id] || []).find(x => /^SIM-L5 /.test(x.summary || ''));
      const txt = document.body.innerText; const next = getNextSessionInfo(c);
      return JSON.stringify({ phase: c.implementation && c.implementation.phase, wentLiveOn: c.implementation && c.implementation.wentLiveOn, today: todayISO(),
        live: !inImplementation(c), call: a ? { type: a.type, session: a.sessionNumber == null ? null : a.sessionNumber, date: a.date } : null,
        planShown: /Session 1\\b/.test(txt), hasNext: !!next,
        onboarding: pendingGainsightItems().some(p => p.customerId === c.id), risk: computeRisk(c) }); })()`));
    const passed = r.phase === 'golive' && r.wentLiveOn === r.today && r.live && !!r.call && r.call.type === 'Call' && r.call.session === null
      && r.planShown && r.hasNext && r.onboarding;
    return { passed, evidence: await withBreak(ctx, `phase ${r.phase}, wentLiveOn ${r.wentLiveOn}; hand-off ${r.call ? r.call.type + ' ' + r.call.date + ', session ' + (r.call.session === null ? 'not linked' : r.call.session) : 'call not logged'}; session plan ${r.planShown ? 'shown' : 'not shown'}; onboarding gates active ${r.onboarding}; risk ${r.risk}`) };
  } },
  { id: 'L6', async run(ctx) {
    const days = [];
    for (let d = CAL.L6.from; d <= CAL.L6.to; d = addDays(d, 1)) days.push(d);
    const log = [];
    for (const d of days) {
      await openDay(ctx, d);
      await ctx.ev(`ui.view = 'today'; ui.openCustomerId = null; render(); true`);
      const r = JSON.parse(await ctx.ev(`(() => { const c = DATA.customers.find(x => x.name === ${JSON.stringify(FERN)});
        if (!c) return JSON.stringify({ missing: true });
        const list = todayActionList(); const idx = list.findIndex(r => r.customerId === c.id); const row = idx >= 0 ? list[idx] : null;
        const inBeat = [...document.querySelectorAll('[data-day-step] h4')].some(h => h.textContent.includes(${JSON.stringify(FERN)}));
        const inBelow = [...document.querySelectorAll('[data-today-row] .todo-cust')].some(h => h.textContent.includes(${JSON.stringify(FERN)}));
        const inDeck = [...document.querySelectorAll('.dk-name')].some(h => h.textContent.includes(${JSON.stringify(FERN)}));
        // Rendered anywhere on the Today screen: a day step, the Below-the-day rows, or a Gainsight gate deck card.
        const rendered = document.body.innerText.includes(${JSON.stringify(FERN)});
        const cov = computeCoverage(c);
        return JSON.stringify({ rank: idx >= 0 ? idx + 1 : null, headline: row ? row.headline : null, reason: row ? (row.reasons || []).join('; ') : null, rendered,
          where: [inBeat && 'day step', inBelow && 'Below the day', inDeck && 'gate deck'].filter(Boolean).join('+') || (rendered ? 'elsewhere on Today' : null), inList: idx >= 0, beyondBeatCap: idx >= 15, capHidden: !!row && !inBeat && !inBelow, risk: computeRisk(c), coverage: cov ? cov.status : null }); })()`));
      r.d = d;
      log.push(r);
    }
    if (log.some(x => x.missing)) return { passed: false, evidence: 'Fernhollow does not exist for L6' };
    const firstRanked = (() => { const x = log.find(y => y.inList); return x ? x.d : 'never'; })();
    const first = f => { const x = log.find(f); return x ? x.d : 'never'; };
    const firstToday = first(x => x.rendered);
    const firstWatch = first(x => x.risk === 'watch' || x.risk === 'risk');
    const firstOffTrack = first(x => x.risk === 'risk');
    const ft = log.find(x => x.rendered);
    const reasonIsCoverage = !!ft && /nothing scheduled/i.test(ft.reason || '');
    const remaining = log.filter(x => x.d <= CAL.L6.day7 && (x.rendered || x.rank !== null)).map(x => `${x.d}: ${x.headline} | ${x.reason}`);
    const passed = firstToday !== 'never' && firstToday <= CAL.L6.day7;
    const dayNo = d => d === 'never' ? 'never' : daysBetween(CAL.L5, d);
    return { passed, evidence: await withBreak(ctx, `firstToday=${firstToday} (day ${dayNo(firstToday)}) firstWatch=${firstWatch} (day ${dayNo(firstWatch)}) firstOffTrack=${firstOffTrack} (day ${dayNo(firstOffTrack)}) rank=${ft ? ft.rank : 'none'} firstRanked=${firstRanked} where=${ft ? ft.where : 'none'} beyondBeatCapDays=${log.filter(x => x.beyondBeatCap).length}/${log.length} reasonIsCoverage=${reasonIsCoverage} reason="${ft ? ft.reason : ''}" capHiddenDays=${log.filter(x => x.capHidden).length}/${log.length} remainingThroughDay7=[${remaining.join(' ;; ')}]`) };
  } },
];

async function main() {
  const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
  const version = arg('version') || '1.0';
  const only = (arg('only') || '').split(',').map(s => s.trim()).filter(Boolean);
  const want = only.length ? only : PART_B.map(s => s.id);
  for (const id of want) if (!PART_B.some(s => s.id === id)) throw new Error(`unknown Part B step ${id}`);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = join(ROOT, 'sim-runs', `steps-b-${version}-${stamp}`);
  mkdirSync(runDir, { recursive: true });
  const lines = []; let anyFail = false;
  const ctx = await launch({ version, startDay: CAL.L1, runDir, part: 'B' });
  try {
    await setupB(ctx);
    lines.push(`setup | accounts ${ctx.state.setup.accounts}, no Fernhollow`);
    for (const step of PART_B) {
      if (!want.includes(step.id)) continue;
      const r = await step.run(ctx);
      const rec = { ...classify({ id: step.id, passed: r.passed }), evidence: String(r.evidence).replace(/\s+/g, ' ').slice(0, 600) };
      if (rec.status === 'FAIL') anyFail = true;
      lines.push('PARTIAL ' + summaryLine(rec));
    }
    const s = ctx.aiStats();
    lines.push(`ai | fake ${s.fake}, escaped ${s.escaped}; page errors ${ctx.pageErrors.length}`);
    if (s.escaped > 0) throw new Error(`AI requests escaped the fake: ${s.escaped}`);
  } finally {
    await ctx.stop();
    writeFileSync(join(runDir, 'steps-b.log'), lines.join('\n') + '\n');
  }
  for (const l of lines) console.log(l.slice(0, 700));
  console.log(`log: ${join(runDir, 'steps-b.log')}`);
  return anyFail ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(code => process.exit(code), e => { console.log('steps-b harness error: ' + e.message); process.exit(2); });
}
