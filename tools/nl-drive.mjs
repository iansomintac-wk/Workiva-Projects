// Dev tooling (not part of the bundle): headless drive of the real 1.1 page for the three small CSAT-round changes.
//   NL-1 Call prep order, NL-2 backup prompt title/button (another confirm unchanged), NL-3 no "(0 of 0 gates done)" and the Answered box
//   hidden until a sent date. Synthetic data only; throwaway osmsim-* profile (tools/lib/drive-sim.mjs), never a normal Chrome profile.
// usage: node tools/nl-drive.mjs [--control] --check   -> "OK|FAIL nl-drive: <evidence>"
//        node tools/nl-drive.mjs --captures            -> sim-runs/csat12/{call-prep-order,backup-prompt,csat-block}.{png,txt}
// --control runs the pre-change tracker (CONTROL_REF) from a temporary csat12ctl file and must FAIL.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { inSimVersion, withTracker, isMain, ROOT } from './lib/drive-sim.mjs';
import { guardShot, resetCapture } from './lib/capture-guard.mjs';
import { resolveUnderSimRuns } from './sim/osm-day/lib/outdir.mjs';

const GOOD_ORDER = ['Agenda', 'Promises', 'Last transcript', 'Pending deliverables'];
export function judgeNl(r) {
  const checks = {
    'Call prep order': JSON.stringify(r.order) === JSON.stringify(GOOD_ORDER),
    'backup prompt title': r.promptTitle === 'Back up your book first?',
    'backup prompt button class': r.promptButtonClass === 'btn btn-primary',
    'backup prompt button text': r.promptButtonText === 'Download backup',
    'other confirm title unchanged': r.otherConfirmTitle === 'Are you sure?',
    'other confirm button unchanged': r.otherConfirmButtonClass === 'btn btn-danger',
    'no "0 of 0" in Graduate': r.gradHasZeroOfZero === false,
    'Answered hidden without a sent date': r.answeredHiddenNoSent === true,
    'Answered shown after a sent date': r.answeredShownAfterTyping === true
  };
  const failed = Object.keys(checks).filter(k => !checks[k]);
  return { passed: failed.length === 0, evidence: failed.length ? 'failed: ' + failed.join('; ') : 'all ' + Object.keys(checks).length + ' checks hold' };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const J = v => JSON.stringify(v);
const ORION = 'Orion Semiconductor';
const OPEN = id => `(() => { ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = ${J(id)}; render(); ui.todayFocusId = null; setTodayFocus(${J(id)}); return !!document.querySelector('.day-pane[data-day-holds="' + cssEscape(${J(id)}) + '"]'); })()`;
const PANE = id => `(document.querySelector('.day-pane[data-day-holds="' + cssEscape(${J(id)}) + '"]') || document.createElement('div'))`;
const OPEN_DETAILS = id => `(() => { ui.view = 'today'; ui.openCustomerId = ${J(id)}; ui.panelTab = 'details'; render(); return 1; })()`;
const textOf = (ctx, expr) => ctx.ev(`(() => { const t = ${expr}; return t ? t.textContent : ''; })()`);
const clearModals = ctx => ctx.ev(`(document.querySelectorAll('.modal-backdrop').forEach(b => b.remove()), 1)`);

async function drive(ctx, wantCaptures) {
  const r = {};
  const id = await ctx.ev(`(DATA.customers.find(x => x.name === ${J(ORION)}) || {}).id || null`);
  if (!id) throw new Error('account not found: ' + ORION);
  // (a) Call prep order in Orion's pane, by indexOf on its innerHTML
  if (!(await ctx.ev(OPEN(id)))) throw new Error('no Orion pane on Today');
  await sleep(400);
  const marks = [['Agenda', 'data-beat-agenda'], ['Promises', 'data-beat-promises-sec'], ['Last transcript', 'data-beat-transcript'], ['Pending deliverables', 'Pending deliverables']];
  // open and read in ONE evaluation: Today's scroll handler can swap the shared working pane between calls
  const idx = JSON.parse(await ctx.ev(`(() => { ${OPEN(id)}; const h = ${PANE(id)}.innerHTML; return JSON.stringify(${J(marks.map(m => m[1]))}.map(m => h.indexOf(m))); })()`));
  r.order = marks.map((m, i) => [m[0], idx[i]]).filter(p => p[1] >= 0).sort((a, b) => a[1] - b[1]).map(p => p[0]);
  r.orderIdx = idx;
  if (wantCaptures) {
    const prep = `(() => { const a = ${PANE(id)}.querySelector('[data-beat-agenda]'); return a ? a.closest('.focus-act') : null; })()`;
    await shot(ctx, { file: 'call-prep-order', id, targetExpr: prep, state: 'Call prep block in the Orion pane: Agenda, Promises, Last transcript, Pending deliverables', text: await textOf(ctx, prep) });
  }
  // (b) the real load-time backup prompt
  const p = JSON.parse(await ctx.ev(`(() => { DATA.lastExportedAt = null; maybePromptBackup(); const m = document.querySelector('.modal'); const ok = document.getElementById('confirm-ok');
    return JSON.stringify({t: m && m.querySelector('h3') ? m.querySelector('h3').textContent : null, c: ok ? ok.className : null, x: ok ? ok.textContent : null}); })()`));
  r.promptTitle = p.t; r.promptButtonClass = p.c; r.promptButtonText = p.x;
  if (wantCaptures) await shot(ctx, { file: 'backup-prompt', id: '', targetExpr: `document.querySelector('.modal')`, state: 'Backup prompt as the page shows it for a never-exported book', text: await textOf(ctx, `document.querySelector('.modal')`) });
  await clearModals(ctx);
  // (c) a different real confirm: the account's Delete button; Cancel so nothing is deleted
  const before = await ctx.ev(`DATA.customers.length`);
  await ctx.ev(OPEN_DETAILS(id)); await sleep(300);
  const del = JSON.parse(await ctx.ev(`(() => { const b = document.getElementById('btn-delete-cust'); if (!b) return JSON.stringify({}); b.click();
    const m = document.querySelector('.modal'); const ok = document.getElementById('confirm-ok');
    const o = JSON.stringify({t: m && m.querySelector('h3') ? m.querySelector('h3').textContent : null, c: ok ? ok.className : null});
    const cancel = document.getElementById('confirm-cancel'); if (cancel) cancel.click(); return o; })()`));
  r.otherConfirmTitle = del.t === undefined ? null : del.t; r.otherConfirmButtonClass = del.c === undefined ? null : del.c;
  r.nothingDeleted = (await ctx.ev(`DATA.customers.length`)) === before;
  await clearModals(ctx);
  // (d) Graduate modal for a goal with 0 gates (primaryGoal overridden for this one call only)
  r.gradHasZeroOfZero = await ctx.ev(`(() => { const real = window.primaryGoal; const c = DATA.customers.find(x => x.id === ${J(id)});
    try { window.primaryGoal = () => ({text: 'x', gates: []}); openGraduationConfirmModal(c); const m = document.querySelector('.modal'); return !!m && m.innerHTML.includes('0 of 0'); }
    finally { window.primaryGoal = real; document.querySelectorAll('.modal-backdrop').forEach(b => b.remove()); } })()`);
  // (e) Answered box in the beat pane and on the Details tab: hidden with no sent date, visible after typing one
  const setSent = v => ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${J(id)}); c.compliance = c.compliance || {};
    c.compliance.associatedPeopleCSAT = Object.assign({done: false, date: null, contactName: ''}, c.compliance.associatedPeopleCSAT, {surveySentOn: ${J(v)}, surveyAnsweredOn: null}); saveData(); return 1; })()`);
  // One evaluation per surface (open, read, type the date through a real change event, read again): the same ids exist in the pane and on Details,
  // so each read is scoped to its own surface (inside the Orion day pane, or outside every day pane for the Details tab).
  const surf = `(name) => { const all = () => [...document.querySelectorAll('[data-fp-csat-ans-wrap]')];
    const wrap = () => name === 'pane' ? ${PANE(id)}.querySelector('[data-fp-csat-ans-wrap]') : all().find(w => !w.closest('.day-pane'));
    const inp = () => name === 'pane' ? ${PANE(id)}.querySelector('[data-fp-csat-sent]') : [...document.querySelectorAll('[data-fp-csat-sent]')].find(w => !w.closest('.day-pane'));
    return {wrap, inp}; }`;
  const hid = [], sho = [];
  for (const name of ['pane', 'details']) {
    await setSent(null);
    const res = JSON.parse(await ctx.ev(`(() => { const S = (${surf})(${J(name)}); ${name === 'pane' ? OPEN(id) : OPEN_DETAILS(id)};
      const w0 = S.wrap(), hidden = !!w0 && w0.style.display === 'none', i = S.inp(); if (!i) return JSON.stringify({hidden, shown: false, why: 'no input'});
      i.focus(); i.value = '2026-10-14'; i.dispatchEvent(new Event('input', {bubbles: true})); i.dispatchEvent(new Event('change', {bubbles: true}));
      const S2 = (${surf})(${J(name)}); const w1 = S2.wrap(); return JSON.stringify({hidden, shown: !!w1 && w1.style.display !== 'none'}); })()`));
    hid.push(res.hidden); sho.push(res.shown);
    if (name === 'pane' && wantCaptures) {
      const blk = `(() => { const w = ${PANE(id)}.querySelector('[data-fp-csat-ans-wrap]'); return w ? w.closest('.focus-act') : null; })()`;
      await ctx.ev(OPEN(id));
      await shot(ctx, { file: 'csat-block', id, targetExpr: blk, state: 'CSAT block in the pane after a sent date is typed (Answered box visible)', text: await textOf(ctx, blk) });
    }
  }
  r.answeredHiddenNoSent = hid.every(Boolean); r.answeredShownAfterTyping = sho.every(Boolean);
  r.answeredDetail = { hid, sho };
  return r;
}

async function shot(ctx, c) {
  const out = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'csat12'), ROOT), log = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'captures-batch.log'), ROOT);
  mkdirSync(out, { recursive: true });
  const png = join(out, c.file + '.png');
  try { await guardShot(ctx, { name: 'csat12-' + c.file, account: c.id ? ORION : '', accountId: c.id || '', targetExpr: c.targetExpr, png, logFile: log }); } finally { await resetCapture(ctx); }
  const hex = createHash('sha256').update(readFileSync(png)).digest('hex').slice(0, 12);
  writeFileSync(join(out, c.file + '.txt'), `State: ${c.state}\nVisible text: ${c.text.replace(/\s+/g, ' ').trim()}\nsha256 (first 12 of the png): ${hex}\n`);
  console.log(png); console.log(join(out, c.file + '.txt'));
}

if (isMain(import.meta.url)) {
  const control = process.argv.includes('--control'), wantCaptures = process.argv.includes('--captures');
  if (!process.argv.includes('--check') && !wantCaptures) { console.error('usage: node tools/nl-drive.mjs [--control] --check | --captures'); process.exit(2); }
  let code = 1;
  try {
    const r = await withTracker(control, v => inSimVersion(v, 'csat12', ctx => drive(ctx, wantCaptures)));
    const j = judgeNl(r);
    if (!j.passed || r.nothingDeleted === false) console.log('raw: ' + JSON.stringify(r));
    if (r.nothingDeleted === false) { console.log('FAIL nl-drive: the Delete confirm test removed an account'); code = 1; }
    else if (process.argv.includes('--check')) { console.log((j.passed ? 'OK' : 'FAIL') + ' nl-drive: ' + j.evidence); code = j.passed ? 0 : 1; }
    else code = 0;
  } catch (e) { console.log('FAIL nl-drive: error: ' + String((e && e.message) || e).slice(0, 300)); code = 1; }
  process.exit(code);
}
