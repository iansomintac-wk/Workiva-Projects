// Dev tooling (not part of the bundle): L12 (CSAT follow-up) and agenda captures for 1.1. Synthetic data only.
// usage: node tools/l12-panel.mjs --captures -> sim-runs/l12/{agenda,csat-dates,pinned-line,today-row}.{png,txt}; CAPTURE-GUARD lines to sim-runs/captures-batch.log
// Throwaway osmsim-* profiles only (inSim in tools/l11-csat-panel.mjs), removed by ctx.stop() in a finally.
// Order matters: the agenda needs Orion's open promises, and the Today row needs them cleared (an overdue promise, severity 4, hides
// the severity-2 CSAT row), so agenda and csat-dates are shot first and the promises are closed last, before today-row.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveUnderSimRuns } from './sim/osm-day/lib/outdir.mjs';
import { inSim, installSignalCleanup } from './l11-csat-panel.mjs';
import { guardShot, resetCapture, seedExported } from './lib/capture-guard.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'l12'), ROOT);
const GUARD_LOG = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'captures-batch.log'), ROOT);
const ORION = 'Orion Semiconductor';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const J = v => JSON.stringify(v);

const OPEN = id => `(() => { ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = ${J(id)}; render(); ui.todayFocusId = null; setTodayFocus(${J(id)}); return !!document.querySelector('.day-pane[data-day-holds="' + cssEscape(${J(id)}) + '"]'); })()`;
// Open and test in ONE evaluation: Today's scroll handler can swap the shared working pane between calls.
const has = (ctx, id, expr) => ctx.ev(`(() => { ui.todayFocusId = null; setTodayFocus(${J(id)}); return !!(${expr}); })()`);
const PANE = id => `(document.querySelector('.day-pane[data-day-holds="' + cssEscape(${J(id)}) + '"]') || document.createElement('div'))`;

async function shot(ctx, { file, id, targetExpr, state, text }) {
  mkdirSync(OUT, { recursive: true });
  const png = join(OUT, file + '.png');
  try { await guardShot(ctx, { name: 'l12-' + file, account: ORION, accountId: id, targetExpr, png, logFile: GUARD_LOG }); }
  finally { await resetCapture(ctx); }
  const hex = createHash('sha256').update(readFileSync(png)).digest('hex').slice(0, 12);
  writeFileSync(join(OUT, file + '.txt'), `Account: ${ORION}\nState: ${state}\nVisible text: ${text.replace(/\s+/g, ' ').trim()}\nsha256 (first 12 of the png): ${hex}\n`);
  console.log(png); console.log(join(OUT, file + '.txt'));
}

const textOf = (ctx, expr) => ctx.ev(`(() => { const t = ${expr}; return t ? t.textContent : ''; })()`);

async function topSource(ctx, id) {
  return await ctx.ev(`(() => { const r = todayActionList().find(x => x.customerId === ${J(id)}); return r ? r.source : null; })()`);
}

async function captures() {
  await inSim(async ctx => {
    const id = await ctx.ev(`(DATA.customers.find(x => x.name === ${J(ORION)}) || {}).id || null`);
    if (!id) throw new Error('account not found: ' + ORION);
    await seedExported(ctx, '2026-10-21');   // inSim already seeds before load; this keeps the book marked exported if it was re-saved
    // (i) survey sent 2026-10-14, no answer
    await ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${J(id)}); c.compliance = c.compliance || {}; c.compliance.associatedPeopleCSAT = Object.assign({done: false, date: null, contactName: ''}, c.compliance.associatedPeopleCSAT, {surveySentOn: '2026-10-14', surveyAnsweredOn: null}); saveData(); render(); return 1; })()`);
    if (!(await ctx.ev(OPEN(id)))) throw new Error('no Orion pane on Today');
    await sleep(400); await ctx.ev(OPEN(id)); await sleep(300);

    // (3) agenda, with Orion's promises still open
    const agenda = `${PANE(id)}.querySelector('[data-beat-agenda]')`;
    if (!(await has(ctx, id, agenda))) throw new Error('Orion pane has no [data-beat-agenda]; stopping');
    await shot(ctx, { file: 'agenda', id, targetExpr: agenda, state: 'Call prep agenda with Copy agenda button, Orion promises open', text: await textOf(ctx, agenda) });

    // (2) CSAT block with both dates
    await ctx.ev(OPEN(id)); await sleep(400);
    const csat = `Array.from(${PANE(id)}.querySelectorAll('.focus-act')).find(e => { const h = e.querySelector('h5'); return h && h.textContent.includes('Associated contact for CSAT'); })`;
    if (!(await has(ctx, id, csat))) throw new Error('Orion pane has no CSAT focus-act; stopping');
    await shot(ctx, { file: 'csat-dates', id, targetExpr: csat, state: 'CSAT block, survey sent 2026-10-14, answered empty', text: await textOf(ctx, csat) });

    // (4) the pinned "Surveys to chase" line at the top of Today: outside the ranking, so it needs no cleared promises
    await ctx.ev(OPEN(id)); await sleep(400);
    const pinned = `document.querySelector('#surveys-to-chase')`;
    if (!(await ctx.ev(`!!${pinned}`))) throw new Error('no #surveys-to-chase line on Today; stopping');
    await shot(ctx, { file: 'pinned-line', id, targetExpr: pinned, state: 'Pinned Surveys to chase line at the top of Today, survey sent 2026-10-14, answered empty (day 7)', text: await textOf(ctx, pinned) });

    // (ii) make CSAT the top candidate: close Orion's open promises (one cause at a time, max 5 passes: promises, then a flagged activity, then a behind-target date)
    let src = await topSource(ctx, id);
    for (let pass = 0; pass < 5 && src !== 'csat_unanswered'; pass++) {
      const flagged = src === 'signal:flagged', behind = src === 'signal:behind_target';
      // the cause named by src: a flagged activity (severity 4) else the open promises; one cause per pass
      await ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${J(id)}); if (${flagged}) getFlaggedActivities(c).forEach(a => { a.flagged = false; }); else if (${behind}) c.targetGraduationDate = projectedGraduationDate(c); else openCommitments(c).forEach(x => { x.doneOn = '2026-10-21'; }); saveData(); render(); return 1; })()`);
      src = await topSource(ctx, id);
    }
    if (src !== 'csat_unanswered') throw new Error('Orion Today row source is ' + src + ', not csat_unanswered; stopping');
    await ctx.ev(OPEN(id)); await sleep(400);

    // (1) Today row: the scheduled Orion day-step, selected by account id
    // The day-step if it carries the CSAT line; Orion's call day-step only gets the headline while the account ranks inside the day's 15 beats,
    // otherwise the account sits in the 'Below the day' overflow ([data-today-row]), so fall back to that row.
    const stepExpr = `([document.querySelector('.day-step[data-day-step="' + cssEscape(${J(id)}) + '"]'), ...Array.from(document.querySelectorAll('[data-today-row]')).filter(r => r.querySelector('[data-open-cust="' + cssEscape(${J(id)}) + '"]'))].filter(Boolean).find(e => e.textContent.includes('CSAT survey sent')) || document.querySelector('.day-step[data-day-step="' + cssEscape(${J(id)}) + '"]'))`;
    const txt = await textOf(ctx, stepExpr);
    if (!txt) throw new Error('no Orion Today row (day-step or overflow row); stopping');
    if (!txt.includes('CSAT survey sent')) { console.log('TODAY-ROW-SKIPPED: Orion ranks past the 15 day beats (CSAT is severity 2) so its call day-step carries no CSAT headline and it is not in Below the day; no today-row shot'); return; }
    await shot(ctx, { file: 'today-row', id, targetExpr: stepExpr, state: 'Today row, top candidate csat_unanswered (Orion promises closed, any flag cleared, target date set to projected, so nothing outranks it), survey sent 2026-10-14', text: txt });
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  installSignalCleanup(process, () => {});
  try {
    if (process.argv.includes('--captures')) { await captures(); process.exit(0); }
    else { console.error('usage: node tools/l12-panel.mjs --captures'); process.exit(2); }
  } catch (e) { console.log('l12 tool error: ' + e.message); process.exit(2); }
}
