// Part B of the OSM day sim: Fernhollow Renewables through its lifecycle, steps L1-L12 (chronological; L9 runs in two phases around L10).
// usage: node tools/sim/osm-day/steps-b.mjs --version 1.0|1.1 [--only L1,L2,...]
// Each step is {id, run(ctx) -> {passed, evidence}}. A step that cannot pass reports FAIL; it never bends its condition.
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './lib/browser.mjs';
import { filesSince } from './lib/outdir.mjs';
import { setupB } from './lib/setup.mjs';
import { classify } from './lib/results.mjs';
import { summaryLine } from './lib/report.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FERN = 'Fernhollow Renewables';

// Part B calendar (fake dates). L10 and L11 days derive from the committed date T (see committedDate, l10Day).
export const CAL = {
  L1: '2026-08-03', L2: '2026-08-05', L3: '2026-08-12',
  L4: { build: '2026-08-24', uat: '2026-09-21' },
  L5: '2026-10-05',
  L6: { from: '2026-10-06', to: '2026-10-26', day7: '2026-10-12' },
  L7: { email: '2026-10-26', until: '2026-11-30', from: '2026-10-27', to: '2026-12-01' },
  L8: '2026-12-02',
  L9: { start: '2026-12-07' },
};
export const L7_EMAIL = 'SIM-L7 Customer paused their CSRD rollout until the ruling is clear; will return after 30 November.';
export const L8_NOTE = "SIM-L8 The product doesn't behave as scoped for the reporting workflow.";

const DAY_MS = 86400000;
const utc = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / DAY_MS);
const addDays = (iso, n) => new Date(utc(iso) + n * DAY_MS).toISOString().slice(0, 10);
// Part B chronology (ruling P2): sessions on start + 7k, k = 0..N-1; T = the date of session N; L10 runs the day session N-1 is logged.
export const committedDate = (start, n) => addDays(start, 7 * (n - 1));
export const l10Day = T => addDays(T, -7);

const fernId = ctx => ctx.ev(`(DATA.customers.find(x => x.name === ${JSON.stringify(FERN)}) || {}).id || null`);
// N (sessions) and T (committed date) as saved on the account; the second guard behind ctx.state (Task 11).
export const ntFromCustomer = c => ({ N: c.totalSessions, T: c.targetGraduationDate });
export const ntMismatch = (a, b) => (a.N !== b.N ? `N ${a.N} vs ${b.N}` : a.T !== b.T ? `T ${a.T} vs ${b.T}` : null);
export async function recomputeNT(ctx) {
  const c = await ctx.ev(`JSON.stringify(DATA.customers.find(x => x.name === ${JSON.stringify(FERN)}) || {})`);
  return ntFromCustomer(JSON.parse(c));
}
// When a run is restored from a snapshot whose state lost N and T, take them from the saved data.
async function ensureNT(ctx) {
  if (ctx.state.N && ctx.state.T) return;
  const nt = await recomputeNT(ctx);
  ctx.state.N = nt.N; ctx.state.T = nt.T;
}
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
const logActivity = (ctx, type, summary, session) => ctx.ev(`(() => { const set = (i, v) => { const el = document.getElementById(i); if (!el) throw new Error('no #' + i); el.value = v;
  el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); };
  set('act-type', ${JSON.stringify(type)}); set('act-date', todayISO()); set('act-summary', ${JSON.stringify(summary)});${session ? ` set('act-session', ${JSON.stringify(String(session))});` : ''}
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

// The beat pane only exists for a booked call; the fake day books Fernhollow itself (setup, labelled), then focuses it on Today.
async function bookAndFocus(ctx, id) {
  await ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)}); c.nextSessionScheduledOn = todayISO(); saveData();
    ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = c.id; render(); return true; })()`);
  await sleep(300);
}
// Today's scroll observer can move the focused beat between two evaluations, so each pane action refocuses and acts in ONE evaluation.
const paneAct = (ctx, id, sel, body) => ctx.ev(`(() => { ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = ${JSON.stringify(id)}; render();
  const el = document.querySelector('.day-pane[data-day-holds="${id}"] ' + ${JSON.stringify(sel)}); if (!el) throw new Error('pane control not found: ' + ${JSON.stringify(sel)});
  ${body}; return true; })()`);
const paneClick = (ctx, id, sel) => paneAct(ctx, id, sel, 'el.click()');
const paneType = (ctx, id, sel, text) => paneAct(ctx, id, sel, `el.value = ${JSON.stringify(text)}; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }))`);
const gates = (ctx, id) => ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)}); const k = c.compliance;
  return JSON.stringify({ readiness: !!k.sentiment.done, outcome: !!k.outcomePlan.done, csatDone: !!k.associatedPeopleCSAT.done, contact: k.associatedPeopleCSAT.contactName || '',
    date: c.targetGraduationDate || null, sessions: [...new Set((DATA.activities[c.id] || []).map(a => a.sessionNumber).filter(Boolean))].sort((a, b) => a - b), total: c.totalSessions }); })()`).then(JSON.parse);
const SILENCE_SRC = /^(coverage_|session_due$|signal:(stalled|session_gap|slow_pace|behind_target))/;
// Every ranked candidate source for Fernhollow today (not only the top row), so a silence reason hidden behind a higher one still counts.
const candidateSources = ctx => ctx.ev(`(() => { const c = DATA.customers.find(x => x.name === ${JSON.stringify(FERN)}); if (!c) return JSON.stringify({ missing: true });
  const g = pendingGainsightItems().reduce((m, it) => { (m[it.customerId] = m[it.customerId] || []).push(it); return m; }, {});
  return JSON.stringify({ sources: todayAccountCandidates(c, { gainsightByCustomer: g }).map(x => x.source), paused: isPaused(c),
    regulatory: buildRiskHubList({ readOnly: true }).filter(it => it.c.id === c.id && it.category && it.category.key === 'regulatory').length }); })()`).then(JSON.parse);

// L11 verdict. With no CSAT contact the tracker must refuse: stage and queue after the OK click decide (the tracker has no CSAT check today, so this FAILs).
export function l11Judge({ g0, m1, noContact, with: w }) {
  const refused = noContact.stage !== 'graduated' && noContact.queued === 0;
  const first = `no-CSAT state read back done:${g0.csatDone}, contactName:"${g0.contact}"; graduation modal OK ${m1.disabled ? 'disabled (refused)' : 'ENABLED without a CSAT contact (no refusal)'}; ${noContact.clicked ? 'clicked OK' : 'did not click OK'} with no contact: stage ${noContact.stage}, "Success Plan objective" queue items ${noContact.queued}`;
  if (!w) return { passed: false, evidence: first + (refused ? '; with-contact leg not run' : '; graduated with no contact, so the with-contact leg was skipped') };
  const graduated = w.stage === 'graduated' && w.queued > 0;
  return { passed: refused && graduated, evidence: `${first}; with contact "${w.g1.contact}" (done ${w.g1.csatDone}) OK ${w.m2.open ? (w.m2.disabled ? 'disabled' : 'enabled') : 'modal not open'}; stage ${w.stage}, queue items ${w.queued}` };
}

// L7 verdict: a leak is a silence-source row on a paused day (not the replaced isPaused flag); rank and rendered come from the rendered Today.
export function l7Judge(days, cal) {
  const paused = days.filter(x => x.d <= cal.until), last = days[days.length - 1];
  const leaks = paused.filter(x => x.silence.length);
  const passed = !leaks.length && last.d === cal.to && !last.paused && last.silence.length > 0 && last.regulatory === 0;
  const where = x => `rank ${x.rank == null ? 'none' : x.rank}, rendered ${x.rendered}, cap-hidden ${x.capHidden}`;
  return { passed, evidence: `pause until ${cal.until}; paused days ${paused.length}, with a silence row: ${leaks.length}${leaks.length ? ' (' + leaks.slice(0, 3).map(x => x.d + ' ' + x.silence.join('+') + ', ' + where(x)).join('; ') + ')' : ''}; ${last.d}: paused ${last.paused}, silence sources [${last.silence.join(', ')}], ${where(last)}, Regulatory cases ${last.regulatory}` };
}
// L5: the session plan counts as shown only inside Fernhollow's open Sessions panel, with Session 1 card titles, and not as the pre-Go-Live PREVIEW.
export function sessionsPlanShown(panel) {
  return !!panel && panel.panelTitle.includes(FERN) && panel.cardTitles.some(t => /^Session 1\b/.test(t)) && !/curriculum below is a PREVIEW/i.test(panel.text || '');
}
// L9 phase 1: 12-07 .. T-7 (sessions 1..N-1), goal, committed date, the three gate recordings.
async function l9phase1(ctx) {
  const start = CAL.L9.start;
  await openDay(ctx, start);
  const id = await fernId(ctx);
  if (!id) throw new Error('L9: Fernhollow does not exist');
  const N = await ctx.ev(`DATA.customers.find(x => x.id === ${JSON.stringify(id)}).totalSessions`);
  const T = committedDate(start, N);
  ctx.state.N = N; ctx.state.T = T; ctx.state.l9 = { gradSoon: {} };
  // Goal: the tracker's own createGoal (the goal form is not part of the L9 PASS), saved.
  await ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)});
    if (!primaryGoal(c)) createGoal(c, { type: 'publish', text: 'SIM-L9 publish the first CSRD report', source: 'osm' }); saveData(); return true; })()`);
  await openPanel(ctx, id, 'details');
  await sleep(300);
  await ctx.type('#target-grad-date', T);
  await sleep(400);
  // Gate recordings in the Today beat pane (toggleComplianceGate is what L9's break removes).
  await openDay(ctx, start);
  await bookAndFocus(ctx, id);
  await paneAct(ctx, id, `[data-fp-outcome="${id}"]`, "el.value = '1'; el.dispatchEvent(new Event('change', { bubbles: true }))");
  await sleep(300);
  await paneClick(ctx, id, `[data-fp-toggle="outcomePlan|${id}"]`);
  await sleep(300);
  await paneType(ctx, id, `[data-fp-csat="${id}"]`, 'Dana Reyes');
  await sleep(600);
  await paneClick(ctx, id, `[data-fp-toggle="associatedPeopleCSAT|${id}"]`);
  await sleep(300);
  await paneType(ctx, id, `[data-fp-sentiment="a|${id}"]`, 'SIM-L9 the team trusts the partner build.');
  await paneType(ctx, id, `[data-fp-sentiment="b|${id}"]`, 'SIM-L9 more reporting training.');
  await sleep(600);
  await paneClick(ctx, id, `[data-fp-toggle="sentiment|${id}"]`);
  await sleep(300);
  for (let k = 0; k <= N - 2; k++) {
    const day = addDays(start, 7 * k);
    if (k > 0) await openDay(ctx, day);
    ctx.state.l9.gradSoon[day] = await ctx.ev(`isGraduatingSoon(DATA.customers.find(x => x.id === ${JSON.stringify(id)}))`);
    await openPanel(ctx, id, 'log');
    await sleep(300);
    await logActivity(ctx, 'Call', `SIM-L9 session ${k + 1} of ${N} with Dana: curriculum on pace.`, k + 1);
    await sleep(800);
  }
  ctx.state.l9.phase1 = true;
}
// L9 phase 2 on T: session N, then the verdict over all four recordings.
async function l9phase2(ctx) {
  await ensureNT(ctx);
  const { N, T } = ctx.state;
  if (!N || !T || !ctx.state.l9 || !ctx.state.l9.phase1) throw new Error('L9 phase 2 needs L9 phase 1 first (ctx.state.N, T)');
  await openDay(ctx, T);
  const id = await fernId(ctx);
  await openPanel(ctx, id, 'log');
  await sleep(300);
  await logActivity(ctx, 'Call', `SIM-L9 session ${N} of ${N} with Dana: curriculum complete.`, N);
  await sleep(800);
  const g = await gates(ctx, id);
  const all = Array.from({ length: N }, (_, i) => i + 1);
  const sessionsOk = JSON.stringify(g.sessions) === JSON.stringify(all);
  const bad = [!sessionsOk && `sessions logged ${g.sessions.join(',') || 'none'} (want 1..${N})`, !g.outcome && 'Success Outcome Plan not done', !g.readiness && 'Readiness Assessment not done',
    !(g.csatDone && g.contact) && `CSAT contact not recorded (done ${g.csatDone}, contact "${g.contact}")`, g.date !== T && `committed date ${g.date} (want ${T})`].filter(Boolean);
  return { passed: !bad.length, evidence: await withBreak(ctx, bad.length ? bad.join('; ') : `N=${N} sessions logged weekly from ${CAL.L9.start} to ${T}; outcome plan, Readiness Assessment, CSAT contact "${g.contact}" and committed date ${g.date} all recorded`) };
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
      const pn = document.querySelector('.panel'); const next = getNextSessionInfo(c);
      const panel = pn ? { panelTitle: (pn.querySelector('#panel-title') || {}).textContent || '', cardTitles: [...pn.querySelectorAll('.session-card-title')].map(e => e.textContent.trim()), text: pn.innerText } : null;
      return JSON.stringify({ phase: c.implementation && c.implementation.phase, wentLiveOn: c.implementation && c.implementation.wentLiveOn, today: todayISO(),
        live: !inImplementation(c), call: a ? { type: a.type, session: a.sessionNumber == null ? null : a.sessionNumber, date: a.date } : null,
        panel, hasNext: !!next,
        onboarding: pendingGainsightItems().some(p => p.customerId === c.id), risk: computeRisk(c) }); })()`));
    r.planShown = sessionsPlanShown(r.panel);
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
  { id: 'L7', async run(ctx) {
    await openDay(ctx, CAL.L7.email);
    const id = await fernId(ctx);
    if (!id) return { passed: false, evidence: 'Fernhollow does not exist at L7' };
    await openPanel(ctx, id, 'log');
    await sleep(300);
    await logActivity(ctx, 'Email', L7_EMAIL);
    await sleep(800);
    await openPanel(ctx, id, 'details');
    await sleep(300);
    await ctx.type('#pause-until', CAL.L7.until);
    await ctx.type('#pause-reason', 'SIM-L7 CSRD rollout paused until the ruling is clear');
    await ctx.click('#btn-save-pause');
    await sleep(500);
    const days = [];
    for (let d = CAL.L7.from; d <= CAL.L7.to; d = addDays(d, 1)) {
      await openDay(ctx, d);
      const r = await candidateSources(ctx);
      if (r.missing) return { passed: false, evidence: 'Fernhollow does not exist for L7' };
      r.d = d; r.silence = r.sources.filter(s => SILENCE_SRC.test(s));
      Object.assign(r, JSON.parse(await ctx.ev(`(() => { ui.view = 'today'; ui.openCustomerId = null; render();
        const c = DATA.customers.find(x => x.name === ${JSON.stringify(FERN)}); const list = todayActionList(); const idx = list.findIndex(r => r.customerId === c.id);
        const inBeat = [...document.querySelectorAll('[data-day-step] h4')].some(h => h.textContent.includes(${JSON.stringify(FERN)}));
        const inBelow = [...document.querySelectorAll('[data-today-row] .todo-cust')].some(h => h.textContent.includes(${JSON.stringify(FERN)}));
        return JSON.stringify({ rank: idx >= 0 ? idx + 1 : null, rendered: document.body.innerText.includes(${JSON.stringify(FERN)}), capHidden: idx >= 0 && !inBeat && !inBelow }); })()`)));
      days.push(r);
    }
    const j = l7Judge(days, CAL.L7);
    return { passed: j.passed, evidence: await withBreak(ctx, j.evidence) };
  } },
  { id: 'L8', async run(ctx) {
    await openDay(ctx, CAL.L8);
    const id = await fernId(ctx);
    if (!id) return { passed: false, evidence: 'Fernhollow does not exist at L8' };
    const prodSignals = `buildRiskHubList({ readOnly: true }).filter(it => it.c.id === ${JSON.stringify(id)} && it.category && it.category.key === 'product').length`;
    const card = `(() => { const el = document.getElementById('rk-c-${id}'); return el ? el.className : null; })()`;
    const preSignals = await ctx.ev(prodSignals);
    await openPanel(ctx, id, 'log');
    await sleep(300);
    await logActivity(ctx, 'Other', L8_NOTE);
    await sleep(800);
    const signals = await ctx.ev(prodSignals);
    await ctx.ev(`ui.view = 'risk'; ui.openCustomerId = null; render(); true`);
    await sleep(300);
    const cls = s => s.replace(/rk3-card|is-active|sev\d/g, '').trim();
    const before = await ctx.ev(card);
    if (!before) return { passed: false, evidence: `no Risk tab case for Fernhollow after the note (Product signals ${preSignals} -> ${signals})` };
    const hasConfirm = await ctx.ev(`!!document.querySelector('[data-risk-confirm="${id}"]')`);
    if (!hasConfirm) return { passed: false, evidence: `case listed (${cls(before)}) but no "Yes - it's real" control to action it` };
    await ctx.click(`[data-risk-confirm="${id}"]`);
    await sleep(500);
    const after = await ctx.ev(card);
    const lastActioned = await ctx.ev(`(() => { const k = buildRiskCases(buildRiskHubList()).find(k => k.c.id === ${JSON.stringify(id)}); return k ? k.items.map(it => (it.tracking && it.tracking.lastActioned) || null).join(',') : null; })()`);
    return { passed: signals > preSignals && after === null, evidence: await withBreak(ctx, `Product signal ${preSignals} -> ${signals} after the note; case card ${cls(before)} -> ${after === null ? 'gone from the list' : cls(after) + ' (still listed)'}; lastActioned ${lastActioned}`) };
  } },
  { id: 'L9', async run(ctx) { await l9phase1(ctx); return l9phase2(ctx); }, phase1: l9phase1, phase2: l9phase2 },
  { id: 'L10', async run(ctx) {
    await ensureNT(ctx);
    const { N, T } = ctx.state;
    if (!N || !T || !ctx.state.l9 || !ctx.state.l9.phase1) throw new Error('L10 needs L9 phase 1 first (ctx.state.N, T)');
    const day = l10Day(T);
    await openDay(ctx, day);
    const id = await fernId(ctx);
    const soon = await ctx.ev(`isGraduatingSoon(DATA.customers.find(x => x.id === ${JSON.stringify(id)}))`);
    await ctx.ev(`ui.view = 'accounts'; ui.openCustomerId = null; ui.quickFilter = 'grad30'; render(); true`);
    await sleep(300);
    const listed = await ctx.ev(`document.body.innerText.includes(${JSON.stringify(FERN)})`);
    await ctx.ev(`ui.quickFilter = null; render(); true`);
    await openPanel(ctx, id, 'handoff');
    await sleep(300);
    const t0 = Date.now() - 50;
    await ctx.armClipboard();
    await ctx.click(`[data-handoff-copy="${id}"]`);
    await sleep(500);
    let clip = '';
    clip = await ctx.readClipboard();
    await ctx.click(`[data-handoff-download="${id}"]`);
    let file = null;
    for (const end = Date.now() + 15000; Date.now() < end && !file; await sleep(400)) {
      const fresh = filesSince(ctx.downloads, t0, '.txt');
      if (fresh.length) file = fresh[0];
    }
    await sleep(300);
    const text = file ? readFileSync(join(ctx.downloads, file), 'utf8') : '';
    const clipOk = clip.length > 100 && clip.includes(FERN);
    const fileOk = text.length > 100 && text.includes(FERN);
    // Secondary evidence: the last Part B day at or before T-31 (the account's state on that real day).
    const early = Object.keys(ctx.state.l9.gradSoon).filter(d => d <= addDays(T, -31)).sort().pop();
    return { passed: soon && listed && clipOk && fileOk, evidence: await withBreak(ctx, `day ${day} (T ${T}): isGraduatingSoon ${soon}, listed under the graduating-soon filter ${listed}; Copy packet ${clipOk ? clip.length + ' chars' : 'no packet (' + clip.slice(0, 40) + ')'}; Download .txt ${fileOk ? file + ' ' + text.length + ' chars' : 'no packet file'}; secondary: graduating soon on ${early || 'no Part B day on or before T-31'}${early ? ' = ' + ctx.state.l9.gradSoon[early] : ''}; GAP: CSM request (Google form) is not in the tracker`) };
  } },
  { id: 'L11', async run(ctx) {
    await ensureNT(ctx);
    const { N, T } = ctx.state;
    if (!N || !T || !ctx.state.l9 || !ctx.state.l9.phase1) throw new Error('L11 needs L9 first (ctx.state.N, T)');
    await openDay(ctx, T);
    const id = await fernId(ctx);
    // Exact no-CSAT state (setup, direct write): every other prerequisite stays as L9 left it.
    await ctx.ev(`(() => { const a = DATA.customers.find(x => x.id === ${JSON.stringify(id)}).compliance.associatedPeopleCSAT; a.done = false; a.date = null; a.contactName = ''; saveData(); return true; })()`);
    const g0 = await gates(ctx, id);
    const fill = () => ctx.ev(`(() => { const r = document.querySelector('input[name="gc-verdict"][value="met"]'); if (!r) throw new Error('no verdict radio in the graduation modal'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true }));
      const n = document.getElementById('gc-note'); n.value = 'SIM-L11 the first report went out.'; n.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    const modalState = () => ctx.ev(`(() => { const ok = document.getElementById('gc-ok'); return JSON.stringify({ open: !!ok, disabled: ok ? ok.disabled : null }); })()`).then(JSON.parse);
    const openModal = () => ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)}); ui.view = 'accounts'; ui.openCustomerId = c.id; render(); requestStageChange(c, 'graduated'); return true; })()`);
    await openModal();
    await sleep(400);
    await fill();
    const m1 = await modalState();
    if (!m1.open) throw new Error('L11: the graduation modal did not open');
    // No contact: click OK if the tracker leaves it enabled, then judge refusal by the stage and queue read after the click.
    let clicked = false;
    if (!m1.disabled) { await ctx.click('#gc-ok'); clicked = true; await sleep(600); await dismissModals(ctx); }
    const readState = async () => JSON.parse(await ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)});
      return JSON.stringify({ stage: c.stage, queued: getGainsightQueue().filter(q => q.customerId === c.id && q.kind === 'Success Plan objective').length }); })()`));
    const noContact = { clicked, ...(await readState()) };
    if (!clicked) { await ctx.click('#gc-cancel'); await sleep(300); }
    let withContact = null;
    if (noContact.stage !== 'graduated') {
      // With a CSAT contact (through the beat pane): reopen and confirm.
      await bookAndFocus(ctx, id);
      await paneType(ctx, id, `[data-fp-csat="${id}"]`, 'Dana Reyes');
      await sleep(600);
      await paneClick(ctx, id, `[data-fp-toggle="associatedPeopleCSAT|${id}"]`);
      await sleep(300);
      const g1 = await gates(ctx, id);
      await openModal();
      await sleep(400);
      await fill();
      const m2 = await modalState();
      if (m2.open && !m2.disabled) await ctx.click('#gc-ok');
      await sleep(600);
      await dismissModals(ctx);
      withContact = { g1, m2, ...(await readState()) };
    }
    const j = l11Judge({ g0, m1, noContact, with: withContact });
    return { passed: j.passed, evidence: await withBreak(ctx, j.evidence) };
  } },
  { id: 'L12', async run() {
    return { passed: true, evidence: 'GAP: nothing in the tracker tracks a CSAT survey sent or answered, or its follow-up' };
  } },
];

export const PART_B_ORDER = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9.phase1', 'L10', 'L9.phase2', 'L11', 'L12'];

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
    // Run in date order (PART_B_ORDER: L9 phase 1, L10, L9 phase 2, L11), report in step order.
    const results = {};
    for (const key of PART_B_ORDER) {
      const id = key.split('.')[0];
      if (!want.includes(id)) continue;
      const step = PART_B.find(s => s.id === id);
      if (key === 'L9.phase1') { await step.phase1(ctx); continue; }
      results[id] = await (key === 'L9.phase2' ? step.phase2(ctx) : step.run(ctx));
    }
    for (const step of PART_B) {
      const r = results[step.id];
      if (!r) continue;
      const rec = { ...classify({ id: step.id, passed: r.passed }), evidence: String(r.evidence).replace(/\s+/g, ' ').slice(0, 600) };
      if (rec.status === 'FAIL') anyFail = true;
      lines.push((only.length ? 'PARTIAL ' : '') + summaryLine(rec));
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
