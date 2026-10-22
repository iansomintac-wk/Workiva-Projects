// Dev tooling (not part of the bundle): L12 (CSAT follow-up) and agenda captures for 1.1. Synthetic data only.
// usage: node tools/l12-panel.mjs --captures -> sim-runs/l12/{agenda,csat-dates,pinned-line}.{png,txt}; CAPTURE-GUARD lines to sim-runs/captures-batch.log
// Throwaway osmsim-* profiles only (inSim in tools/l11-csat-panel.mjs), removed by ctx.stop() in a finally.
// The agenda needs Orion open promises, so nothing here closes them; the pinned line sits outside the ranking and needs no cleared promises.
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

// v13: the account is the Desk's selected account; its call prep is in Prepare, the CSAT block in Evidence.
const OPEN = (id, tab = 'prepare') => `(() => { ui.view = 'today'; ui.openCustomerId = null; ui.v13DeskId = ${J(id)}; ui.v13DeskFilter = null; ui.v13DeskTab = ${J(tab)}; render(); return !!document.querySelector('[data-v13-desk-body] [data-v13-desk-cust="' + cssEscape(${J(id)}) + '"]'); })()`;
// Open and test in ONE evaluation: Today's scroll handler can swap the shared working pane between calls.
const has = (ctx, id, expr, tab = 'prepare') => ctx.ev(`(() => { ui.v13DeskId = ${J(id)}; ui.v13DeskTab = ${J(tab)}; render(); return !!(${expr}); })()`);
const PANE = id => `(document.querySelector('[data-v13-desk-body]') || document.createElement('div'))`;

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
    await ctx.ev(OPEN(id, 'evidence')); await sleep(400);
    const csat = `Array.from(${PANE(id)}.querySelectorAll('.focus-act')).find(e => { const h = e.querySelector('h5'); return h && h.textContent.includes('Associated contact for CSAT'); })`;
    if (!(await has(ctx, id, csat, 'evidence'))) throw new Error('Orion pane has no CSAT focus-act; stopping');
    await shot(ctx, { file: 'csat-dates', id, targetExpr: csat, state: 'CSAT block, survey sent 2026-10-14, answered empty', text: await textOf(ctx, csat) });

    // (4) the pinned "Surveys to chase" line at the top of Today: outside the ranking, so it needs no cleared promises
    await ctx.ev(OPEN(id)); await sleep(400);
    const pinned = `document.querySelector('#surveys-to-chase')`;
    if (!(await ctx.ev(`!!${pinned}`))) throw new Error('no #surveys-to-chase line on Today; stopping');
    await shot(ctx, { file: 'pinned-line', id, targetExpr: pinned, state: 'Pinned Surveys to chase line at the top of Today, survey sent 2026-10-14, answered empty (day 7)', text: await textOf(ctx, pinned) });
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  installSignalCleanup(process, () => {});
  try {
    if (process.argv.includes('--captures')) { await captures(); process.exit(0); }
    else { console.error('usage: node tools/l12-panel.mjs --captures'); process.exit(2); }
  } catch (e) { console.log('l12 tool error: ' + e.message); process.exit(2); }
}
