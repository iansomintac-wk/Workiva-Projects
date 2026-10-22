// Part A of the OSM day sim: Ian's workday, steps D1-D10.
// usage: node tools/sim/osm-day/steps-a.mjs --version 1.0|1.1 [--only D1,D2,...]
// Each step is {id, run(ctx) -> {passed, evidence}}. A step that cannot pass reports FAIL; it never bends its condition.
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AGENDA_OFF } from './lib/breaks.mjs';
import { launch } from './lib/browser.mjs';
import { filesSince } from './lib/outdir.mjs';
import { setupA } from './lib/setup.mjs';
import { classify } from './lib/results.mjs';
import { summaryLine } from './lib/report.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const DAY = '2026-10-21';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ORION = 'Orion Semiconductor';

// Ian 2026-10-20 ("D8 looks good and fix L8"): a confirmed case STAYS on the Risk list.
async function confirmWithReason(ctx, id, text) {
  await ctx.click(`[data-risk-confirm="${id}"]`);
  await sleep(300);
  const typed = await ctx.ev(`(() => { const ta = document.getElementById('rkc-reason'); if (!ta) return false; ta.value = ${JSON.stringify(text)}; ta.dispatchEvent(new Event('input', { bubbles: true })); return !document.getElementById('rkc-ok').disabled; })()`);
  if (!typed) return false;
  await ctx.click('#rkc-ok');
  await sleep(500);
  return true;
}
async function staysListed(ctx, id, reason) {
  const r = JSON.parse(await ctx.ev(`(() => { const el = document.getElementById('rk-c-${id}');
    const deck = [...document.querySelectorAll('.rk3-stage .rk3-card')]; const sig = document.querySelector('.rk-signals');
    return JSON.stringify({ exists: !!el, inDeck: !!el && deck.includes(el), confirmed: !!el && el.classList.contains('confirmed'),
      work: !!el && !!el.querySelector('.rk-work'),
      workShown: !!el && !!el.querySelector('.rk-work') && el.querySelector('.rk-work').getBoundingClientRect().height > 0 && el.querySelector('.rk-work').offsetParent !== null,
      why: !!el && !!el.querySelector('.rk-confirmed-why'),
      reasonShown: !!el && [...el.querySelectorAll('.rk-confirmed-why')].some(w => w.textContent.includes(${JSON.stringify(reason)})),
      stillSignal: !!(sig && sig.querySelector('#rk-c-${id}')), deckN: deck.length,
      deckBeforeSignals: !sig || !deck.length || !!(deck[deck.length - 1].compareDocumentPosition(sig) & Node.DOCUMENT_POSITION_FOLLOWING) }); })()`));
  r.ok = r.exists && r.inDeck && r.confirmed && r.work && r.workShown && r.why && r.reasonShown && !r.stillSignal && r.deckBeforeSignals;
  return r;
}

// Text of one account's beat panel as the Today screen renders it, with no click-through.
const panelText = (ctx, name) => ctx.ev(`(() => {
  const c = DATA.customers.find(x => x.name === ${JSON.stringify(name)});
  ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = c.id; render();
  const p = document.querySelector('.day-pane[data-day-holds="' + c.id + '"]');
  return p ? p.textContent.replace(/\\s+/g, ' ').trim() : null; })()`);

const checkTexts = (text, wanted) => wanted.filter(w => !(text || '').includes(w));

async function orionPanel(ctx) {
  await ctx.openOn(DAY);
  const text = await panelText(ctx, ORION);
  if (text === null) throw new Error('Orion has no beat panel on Today');
  return text;
}

// The stored transcript text: inline .text (1.0) or the 1.1 IndexedDB record the activity's ref points to (page function tsGet).
export const TRANSCRIPT_TEXT_JS = `(async a => { const t = a && a.transcript; if (!t) return ''; if (typeof t.text === 'string') return t.text;
  if (t.ref && typeof tsGet === 'function') { const r = await tsGet(t.ref); return (r && r.text) || ''; } return ''; })`;

// Judge for the D3 agenda leg: the agenda is on the panel and clicking Copy put the same list on the clipboard.
export function d3AgendaJudge({ found, text = '', items, copy, clip = '' } = {}) {
  const lacks = [];
  if (!found) lacks.push('agenda not on the panel');
  if (!copy) lacks.push('no Copy button');
  if (!clip) lacks.push('clipboard empty after Copy');
  else {
    if (!clip.startsWith('Agenda - ')) lacks.push('clipboard does not start "Agenda - "');
    for (const w of [ORION, 'Open question: SIM-QUESTION', 'Next step: SIM-OWE checklist']) if (!clip.includes(w)) lacks.push(`clipboard lacks "${w}"`);
  }
  for (const w of ['SIM-QUESTION', 'SIM-OWE checklist']) if (found && !(text || '').includes(w)) lacks.push(`agenda text lacks "${w}"`);
  // The complete ordered on-screen list must equal the clipboard's numbered lines.
  if (found && clip) {
    const num = l => /^\d+\.\s/.test(l), bare = l => String(l).trim().replace(/^\d+\.\s*/, '');
    const shown = (Array.isArray(items) ? items : String(text || '').split('\n').map(l => l.trim()).filter(num)).map(bare);
    const copied = clip.split('\n').map(l => l.trim()).filter(num).map(bare);
    if (shown.length !== copied.length || shown.some((l, i) => l !== copied[i])) lacks.push(`displayed agenda items differ from the copied lines (shown ${JSON.stringify(shown)}, copied ${JSON.stringify(copied)})`);
  }
  const passed = !lacks.length;
  return { passed, evidence: passed ? 'agenda on the panel, Copy put it on the clipboard' : lacks.join('; ') };
}

export const PART_A = [
  { id: 'D1', async run(ctx) {
    await ctx.openOn(DAY);
    await ctx.ev(`ui.view = 'today'; render(); true`);
    const beats = JSON.parse(await ctx.ev(`JSON.stringify([...document.querySelectorAll('[data-day-step]')].map(s => ({
      name: s.querySelector('h4').textContent.trim(), eyebrow: s.querySelector('.ds-eyebrow').textContent.trim() }))
      .filter(b => /call/.test(b.eyebrow)))`));
    const impl = ctx.state.setup.implAccount;
    const want = { [ORION]: '10:00am', 'Aurora Renewables': '1:30pm', [impl]: 'time not set' };
    const got = Object.fromEntries(beats.map(b => [b.name, b.eyebrow]));
    const problems = [];
    for (const n of Object.keys(want)) if (!(n in got)) problems.push(`missing ${n}`); else if (!got[n].includes(want[n])) problems.push(`${n} shows "${got[n]}"`);
    for (const n of Object.keys(got)) if (!(n in want)) problems.push(`unexpected ${n}`);
    return { passed: !problems.length && beats.length === 3, evidence: `${beats.length} call beats: ${beats.map(b => b.name + ' (' + b.eyebrow.replace(/^\d+ of \d+ . /, '') + ')').join('; ')}${problems.length ? ' | ' + problems.join('; ') : ''}` };
  } },
  { id: 'D2', async run(ctx) {
    const text = await orionPanel(ctx);
    const wanted = ['Call prep', 'Session', 'SIM-LASTNOTE', 'SIM-TRANSCRIPT-LINE', 'SIM-QUESTION'];
    const absent = checkTexts(text, wanted);
    if (!/Sessions\s*\d+\s*\/\s*\d+/.test(text)) absent.push('Sessions n/total');
    return { passed: !absent.length, evidence: absent.length ? `absent from panel: ${absent.join(', ')}` : 'all prep texts on the panel, no click-through' };
  } },
  { id: 'D3', async run(ctx) {
    await ctx.openOn(DAY);
    // Documented extra break (VALIDATION.txt): removes only the agenda so only the agenda judge can fail. Never set by a normal run.
    if (process.env.SIM_EXTRA_BREAK === 'agenda-off') await ctx.ev(AGENDA_OFF);
    const text = await panelText(ctx, ORION);
    if (text === null) throw new Error('Orion has no beat panel on Today');
    const absent = checkTexts(text, ['SIM-OWE checklist', 'SIM-OWE you owe', 'SIM-OWE they owe', 'SIM-QUESTION']);
    // Click Copy for real; headless Chrome has no clipboard permission, so capture what the page hands to navigator.clipboard.writeText.
    const info = JSON.parse(await ctx.ev(`(async () => {
      window.__clip = null; navigator.clipboard.writeText = t => { window.__clip = t; return Promise.resolve(); };
      const c = DATA.customers.find(x => x.name === ${JSON.stringify(ORION)});
      ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = c.id; render();
      const pane = document.querySelector('.day-pane[data-day-holds="' + c.id + '"]');
      const p = pane && pane.querySelector('[data-beat-agenda]');
      const btn = p && p.querySelector('[data-beat-agenda-copy]');
      const text = p ? p.innerText : '';
      const items = p ? [...p.querySelectorAll('ol > li')].map(li => li.innerText.trim()) : [];
      if (btn) btn.click();
      await new Promise(r => setTimeout(r, 100));
      return JSON.stringify({ found: !!p, text, items, copy: !!btn, clip: window.__clip || '' }); })()`));
    const j = d3AgendaJudge(info);
    return { passed: !absent.length && j.passed, evidence: `${absent.length ? `absent from panel: ${absent.join(', ')}` : 'open deliverables and question on the panel'}; agenda: ${j.evidence}` };
  } },
  { id: 'D4', async run(ctx) {
    await ctx.openOn(DAY);
    const info = JSON.parse(await ctx.ev(`(async () => {
      const c = DATA.customers.find(x => x.name === ${JSON.stringify(ORION)}); const n = nextOpenSessionNumber(c);
      ui.view = 'today'; ui.openCustomerId = c.id; ui.panelTab = 'log'; render();
      await new Promise(r => setTimeout(r, 300));
      const set = (id, v) => { const el = document.getElementById(id); if (!el) throw new Error('no #' + id); el.value = v;
        el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); };
      set('act-type', 'Call'); set('act-date', todayISO()); set('act-session', String(n));
      set('act-summary', 'SIM-D4 Session ' + n + ' with Priya: reviewed the sandbox plan and the data file.');
      set('act-transcript', 'SIM-D4-TRANSCRIPT Priya: the sandbox plan looks right. Us: we will send the data file Friday.');
      document.getElementById('btn-save-activity').click();
      await new Promise(r => setTimeout(r, 800));
      const a = (DATA.activities[c.id] || []).find(x => /^SIM-D4 /.test(x.summary || ''));
      ui.openCustomerId = c.id; ui.panelTab = 'activity'; render();
      await new Promise(r => setTimeout(r, 300));
      const shown = document.body.textContent.includes('SIM-D4 Session');
      return JSON.stringify({ n, found: !!a, id: a && a.id, session: a && a.sessionNumber, type: a && a.type,
        transcript: /SIM-D4-TRANSCRIPT/.test(await (${TRANSCRIPT_TEXT_JS})(a)), shown, customerId: c.id }); })()`));
    ctx.state.d4 = { customerId: info.customerId, activityId: info.id };
    const passed = info.found && info.transcript && info.shown && info.session === info.n && info.type === 'Call';
    return { passed, evidence: `activity ${info.found ? 'saved' : 'not saved'} (session ${info.session}/${info.n}, type ${info.type}), transcript ${info.transcript ? 'stored' : 'missing'}, ${info.shown ? 'in' : 'not in'} history` };
  } },
  { id: 'D5', async run(ctx) {
    const d4 = ctx.state.d4;
    if (!d4 || !d4.activityId) throw new Error('D5 needs the call D4 logged (ctx.state.d4)');
    await ctx.openOn(DAY);
    const key = `${d4.customerId}|${d4.activityId}`;
    await ctx.ev(`ui.view = 'today'; ui.openCustomerId = ${JSON.stringify(d4.customerId)}; ui.panelTab = 'activity'; render(); true`);
    // With a connector configured the tracker sends AI to the connector (/v1/ai), which the fake connector does not answer;
    // D5 therefore runs on the browser-key route (fake AI host) with the connector settings cleared, and restores them after.
    await ctx.ev(`window.__simConn = localStorage.getItem(CONNECTOR_SETTINGS_KEY); localStorage.removeItem(CONNECTOR_SETTINGS_KEY); true`);
    await ctx.click(`[data-generate-session-debrief="${key}"]`);
    let area = false;
    for (const end = Date.now() + 20000; Date.now() < end && !area; await sleep(300)) {
      area = await ctx.ev(`!!document.querySelector('[data-debrief-email-text="${d4.activityId}"]')`);
    }
    if (!area) return { passed: false, evidence: 'no "Draft email recap" appeared after generating the debrief' };
    const recap = await ctx.ev(`document.querySelector('[data-debrief-email-text="${d4.activityId}"]').value`);
    await ctx.armClipboard();
    await ctx.click(`[data-copy-debrief-email="${d4.activityId}"]`);
    let clip = null;
    for (const end = Date.now() + 5000; Date.now() < end && clip !== recap; await sleep(300)) {
      // The Windows clipboard returns CRLF; the textarea value is LF. Same text, so compare on LF.
      clip = await ctx.readClipboard();
    }
    await ctx.ev(`window.__simConn && localStorage.setItem(CONNECTOR_SETTINGS_KEY, window.__simConn); true`);
    const s = ctx.aiStats();
    return { passed: !!recap && clip === recap, evidence: `recap ${recap.length} chars; clipboard ${clip === recap ? 'equals recap' : 'is ' + JSON.stringify(String(clip).slice(0, 60))}; fake AI calls ${s.fake}` };
  } },
  { id: 'D6', async run(ctx) {
    await ctx.openOn(DAY);
    const pre = JSON.parse(await ctx.ev(`(() => {
      const c = DATA.customers.find(x => x.name === ${JSON.stringify(ORION)});
      const mine = (c.commitments || []).find(x => /^SIM-D6 you owe/.test(x.text)), theirs = (c.commitments || []).find(x => /^SIM-D6 they owe/.test(x.text));
      if (!mine || !theirs) return JSON.stringify({ missing: true });
      ui.view = 'today'; ui.openCustomerId = c.id; ui.panelTab = 'coordination'; render();
      return JSON.stringify({ mine: mine.id, theirs: theirs.id, mineDone: mine.doneOn, theirsDone: theirs.doneOn }); })()`));
    if (pre.missing) throw new Error('D6 needs the SIM-D6 commitments setupA seeds on Orion');
    await sleep(300);
    await ctx.click(`[data-coord-toggle="commitment|${pre.mine}"]`);
    await sleep(300);
    const post = JSON.parse(await ctx.ev(`(() => {
      const c = DATA.customers.find(x => x.name === ${JSON.stringify(ORION)});
      const f = id => (c.commitments || []).find(x => x.id === id);
      const open = (c.commitments || []).filter(x => !x.doneOn && /^SIM-D6 /.test(x.text)).map(x => x.text);
      return JSON.stringify({ mineDone: f(${JSON.stringify(pre.mine)}).doneOn, theirsDone: f(${JSON.stringify(pre.theirs)}).doneOn, open, today: todayISO() }); })()`));
    const passed = !pre.mineDone && !pre.theirsDone && post.mineDone === post.today && !post.theirsDone && post.open.length === 1 && /^SIM-D6 they owe/.test(post.open[0]);
    return { passed, evidence: `"you owe" doneOn ${pre.mineDone || 'open'} -> ${post.mineDone || 'open'}; "they owe" ${post.theirsDone ? 'closed' : 'still open'}; open SIM-D6: ${post.open.join(' | ') || 'none'}` };
  } },
  { id: 'D7', async run(ctx) {
    await ctx.openOn(DAY);
    if (!(await ctx.ev(`connectorConfigured()`))) return { passed: false, evidence: 'connector not configured (D5 should have restored it)' };
    const id = await ctx.ev(`DATA.customers.find(x => x.name === ${JSON.stringify(ORION)}).id`);
    const ownRow = `(() => getGainsightQueue().find(q => q.kind === 'Pending items batch' && q.customerId === ${JSON.stringify(id)} && /Log call summary in Gainsight timeline/.test(q.payload || '')))()`;
    if (await ctx.ev(`!!${ownRow}`)) throw new Error('D7: its own batch row already exists');
    await ctx.ev(`ui.view = 'today'; ui.openCustomerId = ${JSON.stringify(id)}; ui.panelTab = 'gainsight'; render(); true`);
    await sleep(300);
    await ctx.click(`[data-gainsight-batch="${id}"]`);
    await sleep(500);
    const queuedRow = JSON.parse(await ctx.ev(`JSON.stringify((${ownRow}) || null)`));
    if (!queuedRow) return { passed: false, evidence: `no queued "Pending items batch" row for ${ORION} containing "Log call summary in Gainsight timeline"` };
    await ctx.ev(`ui.openCustomerId = null; ui.view = 'risk'; render(); true`);
    await sleep(300);
    await ctx.click('#btn-send-gainsight');
    let row = queuedRow;
    for (const end = Date.now() + 15000; Date.now() < end && row.status !== 'sent'; await sleep(300)) {
      row = JSON.parse(await ctx.ev(`JSON.stringify(getGainsightQueue().find(q => q.id === ${JSON.stringify(queuedRow.id)}) || null)`)) || row;
    }
    await ctx.ev(`ui.view = 'risk'; render(); true`);
    const shown = await ctx.ev(`[...document.querySelectorAll('.rk-queue-row')].some(r => r.textContent.includes(${JSON.stringify(ORION)}) && r.textContent.includes('Pending items batch') && r.textContent.includes('sent'))`);
    const related = !!row.externalId && row.externalId === 'SIM-EXT-' + row.id;
    return { passed: row.status === 'sent' && related && shown, evidence: `own row ${queuedRow.status} -> ${row.status}; externalId ${!row.externalId ? 'missing' : related ? 'matches own row id' : 'does not match own row id'}; ${shown ? 'shows sent' : 'not shown as sent'} on the Risk tab; GAP notes: close a CTA after an ordinary call, success plan task update, Renewal Forecast Scorecard` };
  } },
  { id: 'D8', async run(ctx) {
    await ctx.openOn(DAY);
    const id = await ctx.ev(`DATA.customers.find(x => x.name === 'Coastal Water Authority').id`);
    const card = `(() => { const el = document.getElementById('rk-c-${id}'); return el ? el.className : null; })()`;
    const lastActioned = `(() => { const k = buildRiskCases(buildRiskHubList()).find(k => k.c.id === ${JSON.stringify(id)}); return k ? k.items.map(it => (it.tracking && it.tracking.lastActioned) || null).join(',') : null; })()`;
    await ctx.ev(`ui.view = 'risk'; ui.openCustomerId = null; render(); true`);
    await sleep(300);
    const before = await ctx.ev(card);
    if (!before) return { passed: false, evidence: 'Coastal Water Authority has no case in the Risk tab before actioning' };
    const lastBefore = await ctx.ev(lastActioned);
    const cls = s => s.replace(/rk3-card|is-active|sev\d/g, '').trim();
    const reason = 'SIM-D8 the sponsor said they may not renew';
    if (!(await confirmWithReason(ctx, id, reason))) return { passed: false, evidence: 'the confirm control did not open the reason box, or Confirm stayed disabled after a reason was typed' };
    const after = await ctx.ev(card);
    const lastAfter = await ctx.ev(lastActioned);
    const stays = await staysListed(ctx, id, reason);
    // set BY the confirm: every item carries a date, and it is new (changed from before) or the sim day
    const actioned = !!lastAfter && lastAfter.split(",").every(Boolean) && (lastAfter !== lastBefore || lastAfter.split(",").every(d => String(d).startsWith(DAY)));
    return { passed: stays.ok && actioned, evidence: `actioned ${actioned}; case ${cls(before)} -> ${after === null ? 'gone from the list' : cls(after)}; ${JSON.stringify(stays)}; lastActioned ${lastBefore} -> ${lastAfter}` };
  } },
  { id: 'D9', async run(ctx) {
    await ctx.openOn(DAY);
    const impl = ctx.state.setup.implAccount;
    const heads = name => ctx.ev(`(() => { const c = DATA.customers.find(x => x.name === ${JSON.stringify(name)});
      ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = c.id; render();
      const p = document.querySelector('.day-pane[data-day-holds="' + c.id + '"]');
      return p ? JSON.stringify([...p.querySelectorAll('h5')].map(h => h.textContent.replace(/\\s+/g, ' ').trim())) : null; })()`);
    const implHeads = JSON.parse(await heads(impl) || 'null');
    if (!implHeads) return { passed: false, evidence: `${impl} has no beat panel on Today` };
    const implOk = implHeads.some(h => h.includes('Gainsight gates start at Go-Live')) && !implHeads.some(h => h.startsWith('Sentiment'));
    const live = JSON.parse(await heads(ORION) || 'null');
    if (!live) return { passed: false, evidence: `${ORION} has no beat panel on Today` };
    const isImpl = await ctx.ev(`inImplementation(DATA.customers.find(x => x.name === ${JSON.stringify(ORION)}))`);
    const sent = h => h.find(x => x.startsWith('Sentiment'));
    const before = sent(live);
    const id = await ctx.ev(`DATA.customers.find(x => x.name === ${JSON.stringify(ORION)}).id`);
    let after = null, done = null;
    if (before) {
      await ctx.ev(`(() => { const c = DATA.customers.find(x => x.name === ${JSON.stringify(ORION)}); ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = c.id; render();
        const b = document.querySelector('.day-pane[data-day-holds="' + c.id + '"] [data-fp-toggle="sentiment|' + c.id + '"]'); if (!b) throw new Error('no sentiment toggle in the Orion pane'); b.click(); return true; })()`);
      await sleep(400);
      after = sent(JSON.parse(await heads(ORION) || '[]'));
      done = await ctx.ev(`!!DATA.customers.find(x => x.name === ${JSON.stringify(ORION)}).compliance.sentiment.done`);
    }
    const passed = implOk && !isImpl && !!before && /not logged/.test(before) && /logged/.test(after || '') && !/not logged/.test(after || '') && done === true;
    return { passed, evidence: `${impl}: ${implOk ? 'gates-start-at-Go-Live note, no Sentiment block' : 'headings ' + implHeads.join(' / ')}; ${ORION} (${isImpl ? 'in implementation' : 'post Go-Live'}): "${before || 'no Sentiment block'}" -> "${after || '-'}", stored done ${done}` };
  } },
  { id: 'D10', async run(ctx) {
    await ctx.openOn(DAY);
    await ctx.ev(`ui.view = 'today'; ui.openCustomerId = null; render(); true`);
    await sleep(300);
    if (await ctx.ev(`dayIsClosed()`)) throw new Error('D10: the day was already closed before wrap-up');
    await ctx.click('[data-wrap-day]');
    await sleep(500);
    const closed = await ctx.ev(`dayIsClosed() && getDayClose().date === todayISO()`);
    await ctx.click('#modal-cancel');
    await sleep(300);
    const t0 = Date.now() - 50;
    await ctx.click('[data-backup-now]');
    let file = null;
    for (const end = Date.now() + 20000; Date.now() < end && !file; await sleep(400)) {
      const fresh = filesSince(ctx.downloads, t0, '.json');
      if (fresh.length) file = fresh[0];
    }
    if (!file) return { passed: false, evidence: `day ${closed ? 'closed' : 'not closed'}; no backup file reached downloads-A` };
    await sleep(300);
    const parsed = JSON.parse(readFileSync(join(ctx.downloads, file), 'utf8'));
    const n = (parsed.customers || (parsed.data && parsed.data.customers) || []).length;
    return { passed: closed && n === 35, evidence: `day ${closed ? 'closed' : 'not closed'}; backup ${file} holds ${n} customers (want 35)` };
  } },
];

export const PART_A_DEPS = { D5: ['D4'] };

async function main() {
  const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
  const version = arg('version') || '1.0';
  const only = (arg('only') || '').split(',').map(s => s.trim()).filter(Boolean);
  const want = only.length ? only : PART_A.map(s => s.id);
  for (const id of want) if (!PART_A.some(s => s.id === id)) throw new Error(`unknown Part A step ${id}`);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = join(ROOT, 'sim-runs', `steps-a-${version}-${stamp}`);
  mkdirSync(runDir, { recursive: true });
  const lines = []; let anyFail = false;
  const ctx = await launch({ version, startDay: DAY, runDir, part: 'A' });
  try {
    await setupA(ctx);
    lines.push(`setup | implementation account: ${ctx.state.setup.implAccount}; stray bookings cleared: ${ctx.state.setup.clearedStray.join(', ') || 'none'}; Coastal risk entries back-dated: ${ctx.state.setup.coastalRisk}`);
    const order = [];
    for (const id of PART_A.map(s => s.id)) {
      if (!want.includes(id)) continue;
      for (const d of PART_A_DEPS[id] || []) if (!want.includes(d) && !order.some(o => o.id === d)) order.push({ id: d, dep: true });
      order.push({ id, dep: false });
    }
    for (const { id, dep } of order) {
      const step = PART_A.find(s => s.id === id);
      const r = await step.run(ctx);
      if (dep) { lines.push(`setup | ran ${id} unchecked (dependency)`); continue; }
      const rec = { ...classify({ id, passed: r.passed }), evidence: String(r.evidence).replace(/\s+/g, ' ').slice(0, 300) };
      if (rec.status === 'FAIL') anyFail = true;
      lines.push('PARTIAL ' + summaryLine(rec));
    }
    const s = ctx.aiStats();
    lines.push(`ai | fake ${s.fake}, escaped ${s.escaped}; page errors ${ctx.pageErrors.length}`);
    if (s.escaped > 0) throw new Error(`AI requests escaped the fake: ${s.escaped}`);
  } finally {
    await ctx.stop();
    writeFileSync(join(runDir, 'steps-a.log'), lines.join('\n') + '\n');
  }
  for (const l of lines) console.log(l);
  console.log(`log: ${join(runDir, 'steps-a.log')}`);
  return anyFail ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(code => process.exit(code), e => { console.log('steps-a harness error: ' + e.message); process.exit(2); });
}
