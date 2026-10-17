// Part A of the OSM day sim: Ian's workday, steps D1-D5 (D6-D10 arrive in Task 8).
// usage: node tools/sim/osm-day/steps-a.mjs --version 1.0|1.1 [--only D1,D2,...]
// Each step is {id, run(ctx) -> {passed, evidence}}. A step that cannot pass reports FAIL; it never bends its condition.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './lib/browser.mjs';
import { setupA } from './lib/setup.mjs';
import { classify } from './lib/results.mjs';
import { summaryLine } from './lib/report.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const DAY = '2026-10-21';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ORION = 'Orion Semiconductor';

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
    const text = await orionPanel(ctx);
    const absent = checkTexts(text, ['SIM-OWE checklist', 'SIM-OWE you owe', 'SIM-OWE they owe', 'SIM-QUESTION']);
    return { passed: !absent.length, evidence: absent.length ? `absent from panel: ${absent.join(', ')}` : 'open deliverables and question on the panel' };
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
        transcript: !!(a && a.transcript && /SIM-D4-TRANSCRIPT/.test(a.transcript.text)), shown, customerId: c.id }); })()`));
    ctx.state.d4 = { customerId: info.customerId, activityId: info.id };
    const passed = info.found && info.transcript && info.shown && info.session === info.n && info.type === 'Call';
    return { passed, evidence: `activity ${info.found ? 'saved' : 'not saved'} (session ${info.session}/${info.n}, type ${info.type}), transcript.text ${info.transcript ? 'stored' : 'missing'}, ${info.shown ? 'in' : 'not in'} history` };
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
    await ctx.click(`[data-copy-debrief-email="${d4.activityId}"]`);
    let clip = null;
    for (const end = Date.now() + 5000; Date.now() < end && clip !== recap; await sleep(300)) {
      // The Windows clipboard returns CRLF; the textarea value is LF. Same text, so compare on LF.
      try { clip = (await ctx.ev(`navigator.clipboard.readText()`)).replace(/\r\n/g, '\n'); } catch (e) { clip = 'error: ' + e.message.slice(0, 80); }
    }
    await ctx.ev(`window.__simConn && localStorage.setItem(CONNECTOR_SETTINGS_KEY, window.__simConn); true`);
    const s = ctx.aiStats();
    return { passed: !!recap && clip === recap, evidence: `recap ${recap.length} chars; clipboard ${clip === recap ? 'equals recap' : 'is ' + JSON.stringify(String(clip).slice(0, 60))}; fake AI calls ${s.fake}` };
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
