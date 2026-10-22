// Setup for the OSM day sim. Seeds only what the plan's "Setup" section lists; every write is labelled setup.
//   setupA (fake date 2026-10-21): tools/sim/steps 01-06 (not 07), Fernhollow via Add customer, connector + AI
//           settings, then the seeded Orion / Coastal records and the three calls booked for the day.
//   setupB (fake date 2026-08-03): steps 01-06 only; 34 accounts; the part adds its own customer later.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STEPS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../steps');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// tools/sim/steps is shared with the field-test runner and still drives 1.1's own screens. In v13 the Backfill sessions
// button lives on System, so step 04 is replaced here by the same action taken through v13's route to it.
// 1.0 has no v13 screens or System button, so it keeps the shared steps unchanged (its own old route); the overrides apply to 1.1 only.
// Step 01 likewise: v13 keeps Settings inside the closed "More" menu, whose buttons have no innerText until it opens.
const STEP_OVERRIDES = {
  '01-open-settings.js': `(async () => {
  document.getElementById('btn-settings').click();
  await new Promise(r => setTimeout(r, 400));
  return document.getElementById('import-excel-input') ? 'settings open' : 'FAIL: no #import-excel-input';
})()`,
  '04-open-backfill.js': `(async () => {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.remove());
  ui.view = 'system'; render();
  const b = document.querySelector('[data-v13-sys-act="backfill"]');
  if (!b) return 'FAIL: no Backfill sessions button on System';
  b.click(); await new Promise(r => setTimeout(r, 500));
  return 'backfill open';
})()`
};

async function runBaseSteps(ctx) {
  for (const end = Date.now() + 20000; ; await sleep(250)) {
    if (await ctx.ev(`typeof XLSX !== 'undefined'`)) break;
    if (Date.now() > end) throw new Error('setup: XLSX library did not load (cdnjs unreachable?)');
  }
  if (await ctx.ev('DATA.customers.length')) throw new Error('setup: fresh profile is not empty');
  const files = readdirSync(STEPS_DIR).filter(f => /^0[1-6]-.*\.js$/.test(f)).sort();
  if (files.length !== 6) throw new Error(`setup: expected steps 01-06, found ${files.length}`);
  for (const f of files) {
    const v = await ctx.ev((ctx.version === '1.1' && STEP_OVERRIDES[f]) || readFileSync(join(STEPS_DIR, f), 'utf8'));
    if (typeof v === 'string' && v.startsWith('FAIL')) throw new Error(`setup: ${f}: ${v}`);
  }
}

export async function setupB(ctx) {
  await runBaseSteps(ctx);
  const n = await ctx.ev('DATA.customers.length');
  if (n !== 34) throw new Error(`setupB: expected 34 accounts, got ${n}`);
  ctx.state.setup = { part: 'B', accounts: n };
  return ctx.state.setup;
}

export async function setupA(ctx) {
  await runBaseSteps(ctx);
  // Fernhollow Renewables through the real Add customer modal (35 accounts).
  await ctx.ev(`ui.view = 'accounts'; ui.openCustomerId = null; render(); true`);
  await ctx.click('#btn-add-customer');
  await ctx.type('#new-name', 'Fernhollow Renewables');
  await ctx.click('#modal-save');
  await sleep(500);
  // Connector and AI settings (fake host, fake key), saved through the tracker's own savers.
  await ctx.ev(`saveConnectorSettings({url: ${JSON.stringify(ctx.connectorUrl)}, token: 'SIM-TOKEN'});
    saveAiSettings({apiKey: 'SIM-KEY', model: 'gemini-2.5-flash'}); true`);
  // Seeded records (labelled setup). Runs in the page; returns what it chose.
  const seeded = await ctx.ev(`(() => {
    const T = todayISO(); const by = n => DATA.customers.find(c => c.name === n);
    const out = { accounts: DATA.customers.length };
    if (!by('Fernhollow Renewables')) throw new Error('setupA: Fernhollow was not added');
    const orion = by('Orion Semiconductor'), aurora = by('Aurora Renewables'), coastal = by('Coastal Water Authority');
    if (!orion || !aurora || !coastal) throw new Error('setupA: base accounts missing');
    // Orion: last-meeting note (dated 2026-10-20, not the plan's 10-14: step 05 backfills Orion to 2026-10-16, so a 10-14 note is never the last one shown) + transcript + question thread + open checklist deliverable (seeded for D2/D3).
    const act = { id: uid(), date: '2026-10-20', type: 'Call', summary: 'SIM-LASTNOTE walked the sandbox plan with Priya.',
      checklist: [{ label: 'SIM-OWE checklist: confirm sandbox access', done: false }], sessionNumber: null, flagged: false,
      transcript: { text: 'SIM-TRANSCRIPT-LINE Priya: we will need the sandbox before the next session.', truncated: false } };
    setOpenThreadsFromText(act, parseOutstandingQuestions('SIM-QUESTION which sandbox region do we use?').questions.join('\\n'));
    DATA.activities[orion.id].push(act);
    orion.commitments = (orion.commitments || []).concat([
      { id: uid(), text: 'SIM-OWE you owe the sandbox walkthrough', direction: 'i_owe', due: '2026-10-23', doneOn: null },
      { id: uid(), text: 'SIM-OWE they owe the data file', direction: 'they_owe', due: null, doneOn: null },
      { id: uid(), text: 'SIM-D6 you owe the recap deck', direction: 'i_owe', due: null, doneOn: null },
      { id: uid(), text: 'SIM-D6 they owe the access list', direction: 'they_owe', due: null, doneOn: null }]);
    // Calls booked for today: Orion 10:00, Aurora 13:30, the alphabetically first implementation account.
    out.clearedStray = [];
    DATA.customers.forEach(c => { if (c.nextSessionScheduledOn === T && c !== orion && c !== aurora) { out.clearedStray.push(c.name); delete c.nextSessionScheduledOn; delete c.nextSessionTime; } });
    const impl = DATA.customers.filter(c => inImplementation(c)).map(c => c.name).sort()[0] || null;
    out.implAccount = impl;
    orion.nextSessionScheduledOn = T; orion.nextSessionTime = '10:00';
    aurora.nextSessionScheduledOn = T; aurora.nextSessionTime = '13:30';
    if (impl) { const c = by(impl); c.nextSessionScheduledOn = T; delete c.nextSessionTime; }
    // Coastal: back-dated risk-log entries (firstSeen 2026-10-10) for D8.
    const log = getRiskLog(); out.coastalRisk = 0;
    buildRiskHubList().filter(r => r.c.id === coastal.id).forEach(r => { const k = riskItemKey(r); if (isRecordObject(log[k])) { log[k].firstSeen = '2026-10-10'; out.coastalRisk++; } });
    out.orionId = orion.id;
    saveData();
    return out;
  })()`);
  if (!seeded.implAccount) throw new Error('setupA: no implementation account among the 35');
  ctx.state.setup = { part: 'A', ...seeded };
  return ctx.state.setup;
}
