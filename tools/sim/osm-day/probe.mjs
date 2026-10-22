// Probe: settles every ASSUMED row of the break table and runs the negative controls.
// usage: node tools/sim/osm-day/probe.mjs --version 1.0|1.1 [--control cleanup|ai|ai-negative|override|d3|l6]
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, countLeftovers } from './lib/browser.mjs';
import { BREAKS, OVERRIDE_NAMES } from './lib/breaks.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = join(ROOT, 'sim-runs');
const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const version = arg('version') || '1.0';
const control = arg('control');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pidAlive = pid => {
  try { return execFileSync('tasklist', ['/FI', `PID eq ${pid}`, '/NH'], { encoding: 'utf8', windowsHide: true }).split(/\s+/).includes(String(pid)); } catch { return false; }
};
mkdirSync(OUT, { recursive: true });
const runDir = join(OUT, `probe-${version}-run`);
const html = v => readFileSync(join(ROOT, `osm-book-of-business-tracker-${v}.html`), 'utf8');
class Fail extends Error { constructor(msg, code) { super(msg); this.code = code; } }
const fail = (msg, code = 1) => { throw new Fail(msg, code); }; // thrown, so every finally still stops the browser

// Minimal synthetic seed, shaped like the Add-customer modal's record (1.0:16772-16789). Runs in the page.
const SEED_FN = `window.__seed = (name, o) => {
  const c = { id: uid(), name, module: DATA.config.modules[0], implementationDate: o.impl || todayISO(),
    stage: DATA.config.stages[0].key, stageHistory: [{stage: DATA.config.stages[0].key, date: o.impl || todayISO()}],
    totalSessions: 8, targetGraduationDate: null, reportsCSRD: false, domainScores: {}, notes: '', riskOverride: null,
    sessionNotes: {}, compliance: defaultCompliance(), goals: [], exit: null };
  if (o.next) c.nextSessionScheduledOn = o.next;
  DATA.customers.push(c); DATA.activities[c.id] = o.acts || [];
  return c.id; }; true`;

async function runControl(name) {
  if (name === 'cleanup') {
    const before = countLeftovers(['osmsim-'], tmpdir());
    const ctx = await launch({ version, startDay: '2026-10-21', runDir, part: 'cleanup' });
    const { pid, profile } = ctx;
    if (!existsSync(profile)) fail('control cleanup: FAIL profile missing before stop');
    await ctx.stop();
    const after = countLeftovers(['osmsim-'], tmpdir());
    if (pidAlive(pid)) fail('control cleanup: FAIL pid alive after stop');
    if (existsSync(profile)) fail('control cleanup: FAIL profile remains');
    if (after !== before) fail(`control cleanup: FAIL leftovers ${before} -> ${after}`);
    const f = mkdtempSync(join(tmpdir(), 'osmsim-control-'));
    const seen = countLeftovers(['osmsim-'], tmpdir());
    rmSync(f, { recursive: true, force: true });
    if (seen !== after + 1) fail('control cleanup: FAIL counter is blind to an osmsim-control folder');
    return console.log('control cleanup: ok');
  }
  const ctx = await launch({ version, startDay: '2026-10-21', runDir, part: 'control-' + name });
  try {
    if (name === 'ai' || name === 'ai-negative') {
      if (name === 'ai-negative') await ctx.send('Fetch.disable');
      await ctx.ev(`fetch('https://api.anthropic.com/v1/messages', {method:'POST', mode:'no-cors', body:'{}'}).then(r=>r.status, e=>'err')`);
      await sleep(1500);
      const s = ctx.aiStats();
      if (name === 'ai') {
        if (s.fake !== 1 || s.escaped !== 0) fail(`control ai: FAIL fake=${s.fake} escaped=${s.escaped}`);
        console.log('control ai: ok');
      } else {
        if (s.escaped !== 1) fail(`control ai-negative: FAIL escaped=${s.escaped} (guard is blind)`);
        console.log('escaped=1 (guard sees escapes)');
      }
    } else if (name === 'override') {
      await ctx.setBreak('D1'); ctx.noReinstall = true;
      let msg = null;
      try { await ctx.openOn('2026-10-21'); } catch (e) { msg = e.message; }
      if (!msg || !/break marker mismatch/.test(msg)) fail('control override: FAIL openOn did not throw the marker error');
      console.log('control override: ok');
    } else if (name === 'd3') {
      await ctx.ev(SEED_FN);
      const id = await ctx.ev(`__seed('Orion Semiconductor', {impl:'2026-09-01', next: todayISO(), acts:[{id:uid(), date:'2026-10-14', type:Object.keys(ACTIVITY_TYPES)[0], summary:'SIM-LASTNOTE met',
        checklist:[{label:'SIM-OWE checklist: confirm sandbox access', done:false}],
        openThreads:[{id:uid(), q:'SIM-QUESTION which sandbox region?', a:'', resolvedOn:null}]}]})`);
      const panel = `(() => { const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)});
        const call = callsScheduledToday().find(x => x.c.id === c.id);
        return v13DeskCallPrep(c, { calls: [call] }); })()`;
      const pre = await ctx.ev(panel);
      const owe = pre.match(/SIM-OWE[^<]*/g) || [];
      if (owe.length < 1) fail(`control d3: FAIL no SIM-OWE entries on the unbroken panel (${/Call prep/.test(pre) ? 'heading present' : 'no heading'})`);
      await ctx.ev(BREAKS.D3.js);
      const post = await ctx.ev(panel);
      const problems = [];
      if (/SIM-OWE/.test(post)) problems.push('SIM-OWE remains');
      if (!/SIM-QUESTION/.test(post)) problems.push('SIM-QUESTION gone');
      if (!/Call prep/.test(post) || !/Open questions/.test(post)) problems.push('heading gone');
      if (pre.replace(/SIM-OWE[^<]*/g, '') !== post) problems.push('rest of panel differs');
      if (problems.length) fail(`control d3: FAIL ${problems.join('; ')}`);
      console.log(`control d3: ok (${owe.length} SIM-OWE entries removed: ${owe.join(' | ')})`);
    } else if (name === 'l6') {
      await ctx.ev(SEED_FN);
      await ctx.ev(`__seed('Fernhollow Renewables', {impl:'2026-09-20', acts:[{id:uid(), date:'2026-10-05', type:Object.keys(ACTIVITY_TYPES)[0], summary:'SIM-L6 hand-off', sessionNumber:1}]})`);
      await ctx.ev('saveData(); true');
      const days = ['06', '07', '08', '09', '10', '11', '12'].map(d => `2026-10-${d}`);
      const look = `(() => { render(); const rows = todayActionList().filter(r => /Fernhollow/.test(JSON.stringify(r)));
        return JSON.stringify({rows: rows.map(r => r.headline + ' | ' + (r.reasons || []).join('; ')), dom: /Fernhollow/.test(document.body.innerText)}); })()`;
      let seen = 0; const first = [];
      for (const d of days) { await ctx.openOn(d); const r = JSON.parse(await ctx.ev(look)); if (r.rows.length) { seen++; first.push(d + ': ' + r.rows[0]); } }
      if (seen < 1) fail('control l6: FAIL unbroken run never shows Fernhollow on or before 10-12 (nothing to remove)');
      await ctx.setBreak('L6');
      for (const d of days) {
        await ctx.openOn(d);
        const r = JSON.parse(await ctx.ev(look));
        if (r.rows.length || r.dom) fail(`L6 break VACUOUS: ${d} ${r.rows.join(' / ') || 'in rendered Today only'}`);
      }
      console.log(`control l6: ok (unbroken showed Fernhollow on ${seen} of ${days.length} days, first ${first[0]}; broken on none)`);
    } else fail('unknown control ' + name, 2);
    const s = ctx.aiStats();
    if (name !== 'ai-negative' && s.escaped > 0) fail(`control ${name}: escaped AI requests ${s.escaped}`, 2);
  } finally { await ctx.stop(); }
}

async function runProbe() {
  const lines = []; let bad = 0; let escaped = 0;
  const add = (ok, text) => { lines.push((ok ? 'ok       ' : 'MISMATCH ') + text); if (!ok) bad++; };
  const ctx = await launch({ version, startDay: '2026-10-21', runDir, part: 'probe' });
  try {
    const names = [...OVERRIDE_NAMES, 'render', 'saveData', 'confirmGraduation'];
    for (const n of new Set(names)) { const t = await ctx.ev(`typeof ${n}`); add(t === 'function', `typeof ${n} = ${t}`); }
    const at = await ctx.ev('typeof ACTIVITY_TYPES'); add(at === 'object', `typeof ACTIVITY_TYPES = ${at}`);
    await ctx.ev(BREAKS.D1.js);
    const set1 = await ctx.ev('window.__simBreak'); add(set1 === 'D1', `marker after install = ${set1}`);
    await ctx.openOn('2026-10-21');
    const afterReload = await ctx.ev('window.__simBreak'); add(afterReload === undefined, `marker after reload without re-install = ${afterReload} (must be unset)`);
    await ctx.setBreak('D1'); await ctx.openOn('2026-10-21');
    const re = await ctx.ev('window.__simBreak'); add(re === 'D1', `marker after openOn re-install = ${re}`);
    const d1 = await ctx.ev('JSON.stringify(callsScheduledToday())'); add(d1 === '[]', `D1 override takes effect: callsScheduledToday() = ${d1}`);
    await ctx.setBreak(null); await ctx.openOn('2026-10-21');
    let clip;
    try { const sn = await ctx.armClipboard(); await ctx.ev("navigator.clipboard.writeText('SIM-PROBE')"); clip = (await ctx.readClipboard()) === 'SIM-PROBE' && sn ? 'sentinel round trip ok' : 'hook did not record'; } catch (e) { clip = 'error: ' + e.message.slice(0, 80); }
    add(clip === 'sentinel round trip ok', `clipboard write/read = ${clip}`);
    for (const v of ['1.0', '1.1']) {
      const h = html(v), i = h.indexOf('function isGraduatingSoon(');
      const m = i >= 0 && h.slice(i, i + 600).match(/days <= (\d+)/);
      add(!!m && m[1] === '30', `GRAD_SOON_DAYS in ${v} = ${m ? m[1] : 'not found'}`);
    }
    const cfg = JSON.parse(await ctx.ev('JSON.stringify(DATA.config)'));
    const want = { riskWatchDays: 10, riskAlertDays: 21, dueSoonDays: 7, neglectDays: 21, defaultPaceDays: 14 };
    for (const k in want) add(cfg[k] === want[k], `config.${k} = ${cfg[k]} (assumed ${want[k]})`);
    const h = html(version);
    const body = n => { const i = h.indexOf(`function ${n}(`); return i < 0 ? '' : h.slice(i, i + 6000); };
    const calledElsewhere = n => h.replace(`function ${n}(`, '').includes(`${n}(`);
    add(/persistFn *= *saveData/.test(body('commitDataCandidate')), 'L1: commitDataCandidate persists through saveData (add-customer save goes via commitDataCandidate)');
    add(calledElsewhere('confirmGraduation'), 'L11: confirmGraduation is called by name somewhere');
    add(calledElsewhere('renderBeatPrep'), 'D3: renderBeatPrep is called by name somewhere');
    add(calledElsewhere('commitDataCandidate'), 'D4: commitDataCandidate is called by name somewhere');
    add(/todayActionList\(\)/.test(body('buildDayTimeline')), 'L6: buildDayTimeline sources Today rows from todayActionList()');
    const s = ctx.aiStats(); escaped = s.escaped; add(s.escaped === 0, `AI escaped = ${s.escaped}, fake = ${s.fake}`);
    add(ctx.pageErrors.length === 0, `page errors = ${ctx.pageErrors.length}`);
  } finally { await ctx.stop(); }
  writeFileSync(join(OUT, `probe-${version}.txt`), lines.join('\n') + '\n');
  console.log(`probe ${version}: ${lines.length} lines, mismatches ${bad}`);
  process.exit(escaped > 0 ? 2 : bad ? 1 : 0);
}

(control ? runControl(control) : runProbe()).then(() => process.exit(0), e => { if (e instanceof Fail) { console.log(e.message); process.exit(e.code); } console.log('probe harness error: ' + e.message); process.exit(2); });
