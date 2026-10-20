// Dev tooling (not part of the bundle): headless drive of the real 1.1 UI for the CSAT import (CI-2 dry run, Cancel, Apply with backup,
// report), CI-3 persistence and CI-4 (fake folder watch). Synthetic data only; throwaway osmsim-* profile (tools/lib/drive-sim.mjs), never a normal Chrome profile.
// usage: node tools/csat-import-drive.mjs [--control] --check   -> "OK|FAIL csat-import-drive: <evidence>"
//        node tools/csat-import-drive.mjs --captures            -> sim-runs/csat12/{dry-run,today-line}.{png,txt}
// --control runs the pre-change tracker (CONTROL_REF) from a temporary csat12ctl file and must FAIL.
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { inSimVersion, withTracker, isMain, DAY, ROOT } from './lib/drive-sim.mjs';
import { guardShot, resetCapture } from './lib/capture-guard.mjs';
import { resolveUnderSimRuns } from './sim/osm-day/lib/outdir.mjs';

export function judgeImportDrive(r) {
  const checks = {
    summary: /^\d+ rows: \d+ match, \d+ dates? change/.test(r.summary || ''),
    sections: r.sections === 6,
    settingsControls: r.settingsControls === true,
    settingsWired: r.settingsWired === true,
    bigRejected: r.bigRejected === true,
    cancelUnchanged: r.cancelChanged === 0,
    realBackupOrder: JSON.stringify(r.order) === JSON.stringify(['exportData', 'saveData', 'markUndoable', 'apply', 'saveData']),
    datesApplied: r.datesAfter > 0,
    backupHoldsOldDates: r.backupHasPreImportDate === true && r.backupHasNewDate === false,
    secondRunChangesNothing: r.datesAfterSecond === 0 && r.secondApplyDisabled === true,
    reloadKeeps: r.reloadKeepsDates === true && r.reloadKeepsImportRecord === true,
    noNewAccounts: r.accountsAfter === r.accountsBefore,
    lineForNewer: r.lineForNewer === true,
    reviewOpensModal: r.reviewOpensModal === true,
    lineGoneAfterApply: r.lineForSame === false,
    handleRoundTrip: r.handleRoundTrip === true,
    handleDeleted: r.handleDeleted === true
  };
  const failed = Object.keys(checks).filter(k => !checks[k]);
  return { passed: failed.length === 0, evidence: failed.length ? 'failed: ' + failed.join(', ') : 'all ' + Object.keys(checks).length + ' checks hold' };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const J = v => JSON.stringify(v);
const SKIP_ID = '0014000000YgdVaAAJ';   // the spec's own skip-list value
const HEADER = 'SALESFORCE_ACCOUNT_ID,GAINSIGHT_COMPANY_ID,COMPANY_NAME,CSAT_SENT_DATE,CSAT_ANSWERED_DATE';
let NEW, OLD;   // picked per run from dates the sim's own book never contains, so a backup holding NEW was written after the import and one holding OLD before it
const sfId = i => '001FAKEDRV' + String(i).padStart(5, '0') + 'AAA';

// Wait until expr (evaluated in the page) is truthy, up to ms.
async function waitFor(ctx, expr, ms = 6000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await ctx.ev(`!!(${expr})`)) return true; await sleep(100); }
  return false;
}
const dates = ctx => ctx.ev(`JSON.stringify(DATA.customers.map(c => c.compliance && c.compliance.associatedPeopleCSAT ? [c.compliance.associatedPeopleCSAT.surveySentOn, c.compliance.associatedPeopleCSAT.surveyAnsweredOn] : null))`);
async function openFile(ctx, name, csv, mod) {
  await ctx.ev(`(() => { handleCsatFile({target: {files: [new File([${J(csv)}], ${J(name)}, {lastModified: ${mod}})], value: ''}}); return 1; })()`);
  return waitFor(ctx, `document.querySelector('#csat-summary')`);
}

async function drive(ctx, wantCaptures) {
  const r = {};
  // 1. setup: made-up Salesforce IDs on the first 4 customers, customer 0 already surveyed on OLD
  const free = async list => { const book = await ctx.ev('JSON.stringify(DATA)'); const d = list.find(x => !book.includes(x)); if (!d) throw new Error('no free drive date in ' + list[0] + '..'); return d; };
  OLD = await free(Array.from({length: 28}, (_, i) => '2026-06-' + String(i + 1).padStart(2, '0')));
  NEW = await free(Array.from({length: 28}, (_, i) => '2026-09-' + String(28 - i).padStart(2, '0')));
  r.accountsBefore = await ctx.ev(`(() => {
    for (let i = 0; i < 4; i++) DATA.customers[i].salesforceId = '001FAKEDRV' + String(i).padStart(5, '0') + 'AAA';
    const c0 = DATA.customers[0]; c0.compliance = c0.compliance || {};
    c0.compliance.associatedPeopleCSAT = Object.assign({done: false, date: null, contactName: ''}, c0.compliance.associatedPeopleCSAT, {surveySentOn: '${OLD}', surveyAnsweredOn: null});
    saveData(); return DATA.customers.length; })()`);
  const csv = [HEADER, `${sfId(0)},,Made Up Zero,${NEW},`, `${sfId(1)},,Made Up One,${NEW},`, `${sfId(2)},,Made Up Two,${NEW},`,
    `001FAKEDRV99999AAA,,Nobody Here,${NEW},`, `${SKIP_ID},,Skipped Row,${NEW},`].join('\n');
  // 2. spies
  await ctx.ev(`(() => {
    window.__order = []; window.__toasts = [];
    const wrap = (name, tag) => { const orig = window[name]; window[name] = function () { window.__order.push(tag); return orig.apply(this, arguments); }; };
    wrap('exportData', 'exportData'); wrap('markUndoable', 'markUndoable'); wrap('applyCsatImportPlan', 'apply'); wrap('saveData', 'saveData');
    const st = window.showToast; window.showToast = function (m) { window.__toasts.push(String(m)); return st.apply(this, arguments); };
    return 1; })()`);
  // 3. Settings controls
  await ctx.ev(`(openSettingsModal(), 1)`);
  r.settingsControls = await ctx.ev(`['btn-import-csat','btn-csat-watch','btn-csat-check','btn-csat-unwatch'].every(id => !!document.getElementById(id))`);
  await ctx.ev(`(() => { window.__clicked = ''; HTMLInputElement.prototype.click = function () { window.__clicked = this.id; }; const b = document.getElementById('btn-import-csat'); if (b) b.click(); return 1; })()`);
  await waitFor(ctx, `window.__clicked`, 2000);
  r.settingsWired = (await ctx.ev(`window.__clicked`)) === 'import-csat-input';
  await ctx.ev(`(() => { document.querySelectorAll('.modal-backdrop').forEach(b => b.remove()); return 1; })()`);
  // 4. over 8 MB
  await ctx.ev(`(() => { handleCsatFile({target: {files: [new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'csat_runway_export_big.csv')], value: ''}}); return 1; })()`);
  await sleep(300);
  r.bigRejected = await ctx.ev(`window.__toasts.some(t => t.includes('over 8 MB')) && !document.querySelector('#csat-apply')`);
  // 5. dry run, then Cancel
  const mod = Date.now();
  await openFile(ctx, 'csat_runway_export_drive.csv', csv, mod);
  r.summary = await ctx.ev(`document.querySelector('#csat-summary').textContent.trim()`);
  r.sections = await ctx.ev(`document.querySelectorAll('.modal details').length`);
  if (wantCaptures) await capture(ctx, { file: 'dry-run', state: 'Dry-run modal for a made-up CSAT export, before Apply', expr: `document.querySelector('#csat-summary').closest('.modal')` });
  const before = await dates(ctx);
  await ctx.ev(`(document.querySelector('#csat-cancel').click(), 1)`);
  await sleep(200);
  r.cancelChanged = (await dates(ctx)) === before ? 0 : 1;
  // 6. Apply with backup
  await openFile(ctx, 'csat_runway_export_drive.csv', csv, mod);
  await ctx.ev(`(window.__order.length = 0, document.querySelector('#csat-apply').click(), 1)`);
  await waitFor(ctx, `document.querySelector('#csat-report-close')`);
  r.order = JSON.parse(await ctx.ev(`JSON.stringify(window.__order)`));
  r.datesAfter = await ctx.ev(`DATA.customers.filter(c => c.compliance && c.compliance.associatedPeopleCSAT && c.compliance.associatedPeopleCSAT.surveySentOn === ${J(NEW)}).length`);
  let backup = '';
  for (const t = Date.now(); Date.now() - t < 5000 && !backup;) {
    const f = readdirSync(ctx.downloads).find(n => n.startsWith('book-of-business-export') && !n.endsWith('.crdownload'));
    if (f) { await sleep(300); backup = readFileSync(join(ctx.downloads, f), 'utf8'); } else await sleep(150);
  }
  r.backupHasPreImportDate = backup.includes(OLD); r.backupHasNewDate = backup.includes(NEW);
  await ctx.ev(`(document.querySelector('#csat-report-close') && document.querySelector('#csat-report-close').click(), 1)`);
  // 7. second run changes nothing
  await openFile(ctx, 'csat_runway_export_drive.csv', csv, mod);
  const second = await ctx.ev(`document.querySelector('#csat-summary').textContent`);
  r.datesAfterSecond = /\b0 dates? change/.test(second) ? 0 : 1;
  r.secondApplyDisabled = await ctx.ev(`!!document.querySelector('#csat-apply') && document.querySelector('#csat-apply').disabled`);
  await ctx.ev(`(document.querySelector('#csat-cancel').click(), 1)`);
  // 8. reload the same profile
  await ctx.openOn(DAY);
  r.reloadKeepsDates = await ctx.ev(`DATA.customers[0].compliance.associatedPeopleCSAT.surveySentOn === ${J(NEW)}`);
  r.reloadKeepsImportRecord = await ctx.ev(`!!DATA.csatImport && DATA.csatImport.fileName === 'csat_runway_export_drive.csv'`);
  r.accountsAfter = await ctx.ev(`DATA.customers.length`);
  // 9. fake folder watch with a newer file
  const newCsv = [HEADER, `${sfId(1)},,Made Up One,2026-10-20,`].join('\n');
  await ctx.ev(`(() => {
    const text = ${J(newCsv)}, lm = Date.now() + 120000;
    window.__fake = {queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      values: async function* () { yield {kind: 'file', name: 'csat_runway_export_new.csv', getFile: async () => new File([text], 'csat_runway_export_new.csv', {lastModified: lm})}; }};
    return 1; })()`);
  // Finding: a non-cloneable object makes st.put throw inside fsIdb's onsuccess, so the store promise never settles (a real handle clones fine).
  // Step 9 therefore swaps csatFolderStore for a no-op; step 10 below exercises the real IndexedDB path.
  await ctx.ev(`(window.__realStore = window.csatFolderStore, window.csatFolderStore = async () => true, 1)`);
  await ctx.ev(`csatWatchUse(window.__fake).then(() => (window.csatFolderStore = window.__realStore, 1))`);
  await ctx.ev(`(ui.view = 'today', render(), 1)`); await sleep(500);
  r.lineForNewer = await ctx.ev(`!!document.querySelector('#csat-watch-line') && document.querySelector('#csat-watch-line').textContent.includes('New CSAT export')`);
  if (wantCaptures && r.lineForNewer) await capture(ctx, { file: 'today-line', state: 'Today line for a newer CSAT export found in a watched folder', expr: `document.querySelector('#csat-watch-line')` });
  await ctx.ev(`(() => { const b = document.querySelector('[data-csat-review]'); if (b) b.click(); return 1; })()`);
  r.reviewOpensModal = await waitFor(ctx, `document.querySelector('#csat-apply')`, 3000);
  if (r.reviewOpensModal) {
    await ctx.ev(`(document.querySelector('#csat-apply').click(), 1)`);
    await waitFor(ctx, `document.querySelector('#csat-report-close')`);
    await ctx.ev(`(document.querySelector('#csat-report-close') && document.querySelector('#csat-report-close').click(), 1)`);
    await sleep(500);
  }
  r.lineForSame = await ctx.ev(`!!document.querySelector('#csat-watch-line')`);
  // 10. real IndexedDB round trip
  await ctx.ev(`csatFolderStore('probe').then(() => 1)`);
  r.handleRoundTrip = (await ctx.ev(`csatFolderLoad().then(v => v === 'probe')`)) === true;
  await ctx.ev(`csatWatchStop().then(() => 1)`);
  r.handleDeleted = (await ctx.ev(`csatFolderLoad().then(v => v === undefined)`)) === true;
  return r;
}

async function capture(ctx, c) {
  const out = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'csat12'), ROOT), log = resolveUnderSimRuns(join(ROOT, 'sim-runs', 'captures-batch.log'), ROOT);
  mkdirSync(out, { recursive: true });
  const png = join(out, c.file + '.png');
  try { await guardShot(ctx, { name: 'csat12-' + c.file, account: '', accountId: '', targetExpr: c.expr, png, logFile: log }); } finally { await resetCapture(ctx); }
  const text = await ctx.ev(`(() => { const t = ${c.expr}; return t ? t.textContent : ''; })()`);
  const hex = createHash('sha256').update(readFileSync(png)).digest('hex').slice(0, 12);
  writeFileSync(join(out, c.file + '.txt'), `State: ${c.state}\nVisible text: ${text.replace(/\s+/g, ' ').trim()}\nsha256 (first 12 of the png): ${hex}\n`);
  console.log(png); console.log(join(out, c.file + '.txt'));
}

if (isMain(import.meta.url)) {
  const control = process.argv.includes('--control'), wantCaptures = process.argv.includes('--captures');
  if (!process.argv.includes('--check') && !wantCaptures) { console.error('usage: node tools/csat-import-drive.mjs [--control] --check | --captures'); process.exit(2); }
  let code = 1;
  try {
    const r = await withTracker(control, v => inSimVersion(v, 'csat12', ctx => drive(ctx, wantCaptures)));
    const j = judgeImportDrive(r);
    if (!j.passed) console.log('raw: ' + JSON.stringify(r));
    if (process.argv.includes('--check')) { console.log((j.passed ? 'OK' : 'FAIL') + ' csat-import-drive: ' + j.evidence); code = j.passed ? 0 : 1; }
    else code = 0;
  } catch (e) { console.log('FAIL csat-import-drive: error: ' + String((e && e.message) || e).slice(0, 300)); code = 1; }
  process.exit(code);
}
