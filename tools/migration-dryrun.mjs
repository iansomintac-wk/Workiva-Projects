#!/usr/bin/env node
// Dry-run harness for the schema migrations that touch recorded evidence.
//   node tools/migration-dryrun.mjs [file.html] [--from 11|12|13|14] [--seed <seed.js>] [--out <report.md>]
//   --from 14:           the v14 -> v15 default-gates migration (ruling M3): empty Financial
//                        Reporting and GRC gate lists are filled from the shipped defaults, a typed
//                        list and every other module are kept, an existing goal's copied gates are
//                        untouched, a second pass changes nothing (seed tools/legacy-seed-v14.js,
//                        report .artifacts/migration-dryrun-v14.md).
//   --from 13:           the v13 -> v14 graduation-plan migration (and on to v15, so Financial Reporting
//                        and GRC end 5/5/3/3 and 5/5/3/0 gates): every account gets goals [],
//                        exit null and graduation null (nothing invented, a historic graduation
//                        gets no exit record), config.goalGates covers every module, a second
//                        pass changes nothing (seed tools/legacy-seed-v13.js, report
//                        .artifacts/migration-dryrun-v13.md).
//   --from 11 (default): the v11 -> v12 outcome-criteria/evidence migration, then 12 -> 13
//                        (seed tools/legacy-seed.js, report .artifacts/migration-dryrun.md).
//   --from 12:           the v12 -> v13 curriculum-identity migration (piece 1): every verdict
//                        unchanged, every placed item stamped, numeric notes re-keyed to
//                        session ids (seed tools/legacy-seed-v12.js, report
//                        .artifacts/migration-dryrun-v12.md).
// Builds a legacy (schemaVersion 11) book in the page, snapshots every ticked
// deliverable, runs the book through the app's REAL import boundary
// (prepareBookData), snapshots the result, reconciles every tick against its
// fate, and writes a readable report. Exit 0 only when nothing was lost, no
// evidence carries an invented date, and a second pass does not double
// anything. Modelled on tools/selfcheck.mjs: same random port and page-URL
// verification, for the same reason — a fixed port lets a stale headless
// Chrome answer for a previous build that is no longer on disk.
// NOT part of the distributable bundle — dev tooling, like docs/.

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const positional = args.filter((a, i) =>
  !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));

const target = resolve(positional[0] || 'osm-book-of-business-tracker-1.0.html');
const FROM = flag('from', '11');
if (!['11', '12', '13', '14'].includes(FROM)) { console.error(`--from must be 11, 12, 13 or 14, got ${FROM}`); process.exit(2); }
const seedPath = resolve(flag('seed', FROM === '14' ? 'tools/legacy-seed-v14.js' : FROM === '13' ? 'tools/legacy-seed-v13.js' : FROM === '12' ? 'tools/legacy-seed-v12.js' : 'tools/legacy-seed.js'));
const outPath = resolve(flag('out', FROM === '14' ? '.artifacts/migration-dryrun-v14.md' : FROM === '13' ? '.artifacts/migration-dryrun-v13.md' : FROM === '12' ? '.artifacts/migration-dryrun-v12.md' : '.artifacts/migration-dryrun.md'));
/* A RANDOM port per invocation — see selfcheck.mjs: a fixed one lets a Chrome
   that outlived its launcher (SIGKILL doesn't reliably take the process tree
   down on Windows) keep answering for a stale page holding a previous build. */
const PORT = Number(flag('port', 0)) || (9900 + Math.floor(Math.random() * 500));

if (!existsSync(target)) { console.error(`No such file: ${target}`); process.exit(2); }
if (!existsSync(seedPath)) { console.error(`No such seed file: ${seedPath}`); process.exit(2); }
const chrome = CHROME_CANDIDATES.find(p => existsSync(p));
if (!chrome) { console.error('Could not find Chrome or Edge.'); process.exit(2); }

const targetUrl = pathToFileURL(target).href;
const profile = mkdtempSync(join(tmpdir(), 'migration-dryrun-'));
const child = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--allow-file-access-from-files',
  targetUrl,
], { stdio: ['ignore', 'ignore', 'pipe'] });

let chromeStderr = '';
child.stderr.on('data', d => { chromeStderr += String(d); });
const cleanup = () => {
  try { child.kill('SIGKILL'); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
};
process.on('exit', cleanup);

// A harness that could not run exits 2 — never 1, which means "the app failed".
process.on('uncaughtException', e => {
  console.error('Harness failure: ' + (e && e.message || e));
  process.exit(2);
});
process.on('unhandledRejection', e => {
  console.error('Harness failure: ' + (e && e.message || e));
  process.exit(2);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function findPage(deadline, expectedUrl) {
  const expectedName = decodeURIComponent(expectedUrl.split('/').pop());
  let seen = [];
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const pages = list.filter(t => t.type === 'page' && t.webSocketDebuggerUrl);
      seen = pages.map(p => p.url);
      const exact = pages.find(p => p.url && p.url.toLowerCase() === expectedUrl.toLowerCase());
      if (exact) return exact;
      const byName = pages.find(p => {
        try { return decodeURIComponent(p.url.split('/').pop()).toLowerCase() === expectedName.toLowerCase(); }
        catch { return false; }
      });
      if (byName) return byName;
    } catch { /* not up yet */ }
    await sleep(120);
  }
  // Taking "the first page we find" would happily attach to a stale Chrome
  // left over from a previous run and silently report against dead code.
  throw new Error(`No debuggable page matched the target.\n` +
    `  expected: ${expectedUrl}\n` +
    `  found: ${seen.length ? seen.join(', ') : '(none)'}\n` +
    chromeStderr.slice(-800));
}

function rpc(ws) {
  let id = 0;
  const pending = new Map();
  const failAll = why => {
    for (const [, p] of pending) p.reject(new Error(why));
    pending.clear();
  };
  ws.addEventListener('close', ev => failAll(`CDP socket closed (code ${ev.code}) — Chrome went away mid-run.`));
  ws.addEventListener('error', () => failAll('CDP socket error — Chrome went away mid-run.'));
  ws.addEventListener('message', ev => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve: res, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : res(msg.result);
    }
  });
  return (method, params = {}, timeoutMs = 120000) => new Promise((res, reject) => {
    const mid = ++id;
    const timer = setTimeout(() => {
      if (pending.delete(mid)) reject(new Error(`CDP ${method} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    pending.set(mid, {
      resolve: v => { clearTimeout(timer); res(v); },
      reject: e => { clearTimeout(timer); reject(e); },
    });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

const page = await findPage(Date.now() + 20000, targetUrl);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', () => rej(new Error('CDP socket failed')), { once: true });
});
const send = rpc(ws);

const pageErrors = [];
await send('Runtime.enable');
ws.addEventListener('message', ev => {
  let m; try { m = JSON.parse(ev.data); } catch { return; }
  if (m.method === 'Runtime.exceptionThrown') {
    pageErrors.push(m.params.exceptionDetails?.exception?.description
      || m.params.exceptionDetails?.text || 'unknown exception');
  }
});

async function evaluate(expression, label) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    throw new Error(`${label} threw: ` + (r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'unknown'));
  }
  return r.result?.value;
}

const readyDeadline = Date.now() + 30000;
let ready = false;
while (Date.now() < readyDeadline) {
  const r = await send('Runtime.evaluate', {
    expression: `document.readyState === 'complete' && typeof prepareBookData === 'function' && typeof commitDataCandidate === 'function'`,
    returnByValue: true,
  });
  if (r.result?.value === true) { ready = true; break; }
  await sleep(150);
}
if (!ready) {
  console.error('The tracker never became ready (prepareBookData/commitDataCandidate not found).');
  if (pageErrors.length) console.error('Page errors:\n  ' + pageErrors.join('\n  '));
  process.exit(2);
}

// 1. Evaluate legacy-seed.js to build the v11 book and stash it, un-migrated,
//    on window.__LEGACY_BOOK__.
const seedSrc = readFileSync(seedPath, 'utf8');
const seedResultRaw = await send('Runtime.evaluate', {
  expression: `(() => { try { const r = ${seedSrc}
    ; return 'ok:' + JSON.stringify(r);
  } catch (e) { return 'err:' + String(e && e.stack || e); } })()`,
  returnByValue: true, awaitPromise: true,
});
if (seedResultRaw.exceptionDetails) {
  console.error('Seed failed to compile or threw: ' +
    (seedResultRaw.exceptionDetails.exception?.description || seedResultRaw.exceptionDetails.text || 'unknown'));
  process.exit(2);
}
const seedResult = String(seedResultRaw.result?.value ?? '');
if (!seedResult.startsWith('ok:')) {
  console.error('legacy-seed.js did not report success: ' + (seedResult || '(no value — likely a syntax error)'));
  process.exit(2);
}
console.log(`Seeded: ${seedResult.slice(3)}`);

// --from 13: the v13 -> v14 graduation-plan migration (additive; infers nothing), carried on to v15.
// --from 14: the v14 -> v15 default-gates migration (ruling M3). Same harness, different expectations.
if (FROM === '13' || FROM === '14') {
  const V14 = FROM === '14';
  const v13Expr = `(() => { try {
    function clone(x){ return JSON.parse(JSON.stringify(x)); }
    const raw = window.__LEGACY_BOOK__;
    if(!raw) return JSON.stringify({__harnessError__: 'window.__LEGACY_BOOK__ was not set by the seed'});
    const rawById = {}; raw.customers.forEach(c => { rawById[c.id] = c; });
    const prepared = prepareBookData(clone(raw), 'DryRun13');
    const gg = prepared.config.goalGates || {};
    const types = ['publish', 'setup_next', 'program', 'disclosure'];
    const lens = k => gg[k] ? types.map(t => (gg[k][t] || []).length).join('/') : 'missing';
    const perAccount = prepared.customers.map(c => ({id: c.id, name: c.name, stage: c.stage,
      goalsIsEmptyArray: Array.isArray(c.goals) && c.goals.length === 0,
      goalsKept: JSON.stringify(c.goals) === JSON.stringify(rawById[c.id].goals), rawHasShape: rawById[c.id].goals !== undefined,
      exitIsNull: c.exit === null, graduationIsNull: c.graduation === null,
      rawHadNone: rawById[c.id].goals === undefined && rawById[c.id].exit === undefined && rawById[c.id].graduation === undefined}));
    const keys = Object.keys(gg);
    const csrdKeys = keys.filter(k => / \\(CSRD\\)$/.test(k));
    const otherKeys = keys.filter(k => DEFAULT_MODULES.indexOf(k) === -1 && csrdKeys.indexOf(k) === -1);
    const snap = x => JSON.stringify([x.customers.map(c => [c.goals, c.exit, c.graduation]), x.config.goalGates]);
    const again = prepareBookData(clone(prepared), 'DryRun13-2');
    return JSON.stringify({schemaBefore: raw.schemaVersion, schemaAfter: prepared.schemaVersion, current: CURRENT_SCHEMA_VERSION,
      perAccount, goalGateKeys: keys, defaultModulesPresent: DEFAULT_MODULES.filter(m => gg[m]).length,
      defaultModules: DEFAULT_MODULES.length, csrdKeys: csrdKeys.length, otherKeys: otherKeys.length,
      frPublishFirst: ((gg['Financial Reporting'] || {}).publish || [])[0] || null, customPublish: ((gg['Custom Module'] || {}).publish || []).join('|'),
      lens: {Sustainability: lens('Sustainability'), FinancialReporting: lens('Financial Reporting'), GRC: lens('GRC'), Custom: lens('Custom Module')},
      historicGraduatedWithExit: prepared.customers.filter(c => c.stage === 'graduated' && (c.exit !== null || c.goals.length > 0)).length,
      idempotent: snap(again) === snap(prepared)});
  } catch (e) { return JSON.stringify({__harnessError__: String(e && e.stack || e)}); } })()`;
  const raw13 = await evaluate(v13Expr, 'v13 analysis');
  let r13;
  try { r13 = JSON.parse(raw13); } catch { console.error('v13 analysis returned an unreadable result:', raw13); process.exit(2); }
  if (r13.__harnessError__) { console.error('Harness failure inside the page: ' + r13.__harnessError__); process.exit(2); }
  const pa13 = r13.perAccount;
  const n13 = pa13.length;
  const cnt = k => pa13.filter(p => p[k]).length;
  const live13 = n13 > 0 && pa13.some(p => p.stage === 'graduated')
    && (V14 ? cnt('rawHasShape') === n13 : cnt('rawHadNone') === n13);
  const lines13 = [
    V14 ? '# Migration dry run — v14 -> v15 default FR/GRC gates (M3)' : '# Migration dry run — v13 -> v14 graduation plan, on to v15', '',
    `Generated ${new Date().toISOString()} against \`${target.split(/[\\/]/).pop()}\`, seeded from \`${seedPath.split(/[\\/]/).pop()}\`.`, '',
    `Schema: ${r13.schemaBefore} -> ${r13.schemaAfter} (app current: ${r13.current})`, '',
    '| Account | stage | goals [] | exit null | graduation null |',
    '|---|---|---|---|---|',
    ...pa13.map(p => `| ${p.name} | ${p.stage} | ${p.goalsIsEmptyArray} | ${p.exitIsNull} | ${p.graduationIsNull} |`), '',
    `goalGates keys: ${r13.goalGateKeys.join(', ')}`, '',
    `Gates per list (publish/setup_next/program/disclosure): Sustainability ${r13.lens.Sustainability}, Financial Reporting ${r13.lens.FinancialReporting}, GRC ${r13.lens.GRC}, Custom Module ${r13.lens.Custom}`, '',
    `Second pass leaves goals, exit, graduation and goalGates unchanged: **${r13.idempotent}**`, '',
    `Liveness (every raw account had no goals/exit/graduation, one is graduated): **${live13}**`, ''
  ];
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, lines13.join('\n') + '\n', 'utf8');
  console.log(`Report written to ${outPath}`);
  console.log('');
  console.log(`Schema ${r13.schemaBefore} -> ${r13.schemaAfter}  Accounts: ${n13}  goals:[] ${cnt('goalsIsEmptyArray')}/${n13}  exit:null ${cnt('exitIsNull')}/${n13}  graduation:null ${cnt('graduationIsNull')}/${n13}`);
  console.log(`goalGates: default modules ${r13.defaultModulesPresent}/${r13.defaultModules} (+${r13.csrdKeys} CSRD, +${r13.otherKeys} other)  Sustainability ${r13.lens.Sustainability}  Financial Reporting ${r13.lens.FinancialReporting}  GRC ${r13.lens.GRC}  Custom Module ${r13.lens.Custom}`);
  if (V14) console.log(`Existing goals unchanged: ${cnt('goalsKept')}/${n13}  FR publish[0]: ${JSON.stringify(r13.frPublishFirst)}  Custom Module publish: ${JSON.stringify(r13.customPublish)}`);
  console.log(`Historic graduated with an invented exit (must be 0): ${r13.historicGraduatedWithExit}  Second-pass idempotent: ${r13.idempotent}  Console errors: ${pageErrors.length}`);
  if (pageErrors.length) { for (const e of pageErrors) console.log('  ' + e.split('\n')[0]); }
  const shapeOk13 = V14 ? cnt('goalsKept') === n13 : cnt('goalsIsEmptyArray') === n13;
  const wantFR = V14 ? '1/5/3/3' : '5/5/3/3', wantCustom = V14 ? '1/0/0/0' : '0/0/0/0';   // v14 seed: one typed FR gate, one typed Custom gate
  const ok13 = r13.schemaAfter === r13.current && r13.current === 15 && live13 && shapeOk13 && cnt('exitIsNull') === n13
    && cnt('graduationIsNull') === n13 && r13.defaultModulesPresent === r13.defaultModules && r13.csrdKeys === 2 && r13.otherKeys === 1
    && r13.lens.Sustainability === '5/5/3/3' && r13.lens.FinancialReporting === wantFR && r13.lens.GRC === '5/5/3/0'
    && (!V14 || r13.frPublishFirst === 'Typed by an OSM') && r13.lens.Custom === wantCustom && r13.historicGraduatedWithExit === 0 && r13.idempotent && !pageErrors.length;
  process.exit(ok13 ? 0 : 1);
}

// --from 12: the v12 -> v13 identity migration. Same shape as the v11 analysis —
// everything computed in-page with the app's own functions.
if (FROM === '12') {
  const v12Expr = `(() => { try {
    function clone(x){ return JSON.parse(JSON.stringify(x)); }
    const raw = window.__LEGACY_BOOK__;
    if(!raw) return JSON.stringify({__harnessError__: 'window.__LEGACY_BOOK__ was not set by the seed'});
    const reset = () => { if(typeof _renderMemoResets !== 'undefined') _renderMemoResets.forEach(r => r()); };
    const strip = list => list.map(x => { const y = Object.assign({}, x); delete y.sourceSessionId; delete y.sourceDeliverableId; return y; });
    const triple = c => JSON.stringify([strip(outcomeCriteriaFor(c)), outcomeVerdict(c), ttfvDays(c)]);
    const prevData = DATA;
    let before, after;
    try {
      // BEFORE: the same book, normalized but NOT migrated — today's matching (passes 1 and 2).
      const b = clone(raw);
      DATA = b; normalizeActivityCollections(b); applyDataBackfills(b); reset();
      before = {schema: raw.schemaVersion, accts: b.customers.map(c => ({id: c.id, name: c.name,
        triple: triple(c),
        evidenced: outcomeCriteriaFor(c).filter(x => x.evidence).length,
        placed: outcomeCriteriaFor(c).filter(x => !x.provisional && String(x.source).indexOf('curriculum') === 0).map(x => x.id)}))};
    } finally { DATA = prevData; reset(); }
    // AFTER: the REAL import path.
    const prepared = prepareBookData(clone(raw), 'DryRun12');
    try {
      DATA = prepared; reset();
      after = prepared.customers.map(c => {
        const cur = (prepared.config.sessionTemplates[c.module] || []);
        const key = (c.reportsCSRD && Array.isArray(prepared.config.sessionTemplates[c.module + ' (CSRD)'])) ? c.module + ' (CSRD)' : c.module;
        const list = prepared.config.sessionTemplates[key] || cur;
        return {id: c.id, triple: triple(c), items: c.outcomeCriteria.items,
          sessionIds: list.slice(0, c.totalSessions).map(t => t && t.id),
          notes: c.sessionNotes};
      });
    } finally { DATA = prevData; reset(); }
    const rawById = {}; raw.customers.forEach(c => { rawById[c.id] = c; });
    const perAccount = before.accts.map((bf, i) => {
      const af = after[i];
      const stamped = bf.placed.filter(id => { const r = af.items.find(x => x.id === id); return r && r.sourceDeliverableId && r.sourceSessionId; }).length;
      const rawNotes = rawById[bf.id].sessionNotes || {};
      let moved = 0, lostOrChanged = 0;
      Object.keys(rawNotes).forEach(k => {
        const sid = af.sessionIds[parseInt(k, 10) - 1];
        const where = sid ? sid : k;   // a session with no id (placeholder tail) keeps its numeric key
        if(sid){ if(af.notes[k] !== undefined) lostOrChanged++; else moved++; }
        if(JSON.stringify(af.notes[where]) !== JSON.stringify(rawNotes[k])) lostOrChanged++;
      });
      const numericLeftWithId = Object.keys(af.notes).filter(k => /^\\d+$/.test(k) && af.sessionIds[parseInt(k,10)-1]).length;
      return {id: bf.id, name: bf.name, verdictSame: bf.triple === af.triple, evidenced: bf.evidenced,
        placed: bf.placed.length, stamped, unstamped: bf.placed.length - stamped,
        notesMoved: moved, notesLostOrChanged: lostOrChanged, numericLeftWithId};
    });
    const again = prepareBookData(clone(prepared), 'DryRun12-2');
    const idem = again.customers.map((c, i) => JSON.stringify([c.outcomeCriteria, c.outcomeEvidence, c.sessionNotes])
      === JSON.stringify([prepared.customers[i].outcomeCriteria, prepared.customers[i].outcomeEvidence, prepared.customers[i].sessionNotes]));
    return JSON.stringify({schemaBefore: before.schema, schemaAfter: prepared.schemaVersion,
      current: CURRENT_SCHEMA_VERSION, perAccount, idempotent: idem.every(Boolean)});
  } catch (e) { return JSON.stringify({__harnessError__: String(e && e.stack || e)}); } })()`;
  const raw12 = await evaluate(v12Expr, 'v12 analysis');
  let r12;
  try { r12 = JSON.parse(raw12); } catch { console.error('v12 analysis returned an unreadable result:', raw12); process.exit(2); }
  if (r12.__harnessError__) { console.error('Harness failure inside the page: ' + r12.__harnessError__); process.exit(2); }
  const pa = r12.perAccount;
  const sum = k => pa.reduce((s, p) => s + p[k], 0);
  const totals = {accounts: pa.length, evidenced: sum('evidenced'), placed: sum('placed'), stamped: sum('stamped'),
    unstamped: sum('unstamped'), notesMoved: sum('notesMoved'), notesBad: sum('notesLostOrChanged'),
    numericLeft: sum('numericLeftWithId'), verdictChanged: pa.filter(p => !p.verdictSame).length};
  const live = totals.evidenced > 0 && totals.stamped > 0 && totals.notesMoved > 0;
  const lines12 = [
    '# Migration dry run — v12 -> v13 curriculum identity', '',
    `Generated ${new Date().toISOString()} against \`${target.split(/[\\/]/).pop()}\`, seeded from \`${seedPath.split(/[\\/]/).pop()}\`.`, '',
    `Schema: ${r12.schemaBefore} -> ${r12.schemaAfter} (app current: ${r12.current})`, '',
    '| Account | verdict same | evidenced | placed | stamped | unstamped | notes moved | notes lost/changed | numeric left (with id) |',
    '|---|---|---|---|---|---|---|---|---|',
    ...pa.map(p => `| ${p.name} | ${p.verdictSame} | ${p.evidenced} | ${p.placed} | ${p.stamped} | ${p.unstamped} | ${p.notesMoved} | ${p.notesLostOrChanged} | ${p.numericLeftWithId} |`), '',
    `Second pass leaves criteria, evidence and notes unchanged: **${r12.idempotent}**`, '',
    `Liveness (evidenced > 0, stamped > 0, notes moved > 0): **${live}**`, ''
  ];
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, lines12.join('\n') + '\n', 'utf8');
  console.log(`Report written to ${outPath}`);
  console.log('');
  console.log(`Schema ${r12.schemaBefore} -> ${r12.schemaAfter}  Accounts: ${totals.accounts}  Evidenced: ${totals.evidenced}`);
  console.log(`Placed: ${totals.placed}  Stamped: ${totals.stamped}  Placed but unstamped (must be 0): ${totals.unstamped}`);
  console.log(`Notes moved: ${totals.notesMoved}  Notes lost/changed (must be 0): ${totals.notesBad}  Numeric keys left on a session with an id (must be 0): ${totals.numericLeft}`);
  console.log(`Verdict changed accounts (must be 0): ${totals.verdictChanged}  Second-pass idempotent: ${r12.idempotent}  Live: ${live}`);
  if (pageErrors.length) { console.log(`\n${pageErrors.length} console error(s) on load:`); for (const e of pageErrors) console.log('  ' + e.split('\n')[0]); }
  const ok12 = r12.schemaAfter === r12.current && live && totals.unstamped === 0 && totals.notesBad === 0
    && totals.numericLeft === 0 && totals.verdictChanged === 0 && r12.idempotent && !pageErrors.length;
  process.exit(ok12 ? 0 : 1);
}

// 2/3/4/5. Snapshot before, run the REAL import path (prepareBookData), snapshot
// after, reconcile every tick, and check a second pass for doubling. All done
// in-page so every computation uses the app's own functions — no reimplementing
// migration semantics in Node.
const analysisExpr = `(() => { try {
  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  const rawBook = window.__LEGACY_BOOK__;
  if(!rawBook) return JSON.stringify({__harnessError__: 'window.__LEGACY_BOOK__ was not set by the seed'});
  const before = clone(rawBook);

  const ticks = [];
  (before.customers||[]).forEach(c=>{
    const notes = c.sessionNotes || {};
    Object.keys(notes).forEach(sessionKey=>{
      const note = notes[sessionKey];
      const deliverables = (note && note.deliverables) || {};
      Object.keys(deliverables).forEach(label=>{
        if(deliverables[label] === true) ticks.push({customerId:c.id, name:c.name, sessionKey, label});
      });
    });
  });

  // THE REAL IMPORT PATH. Mutates rawBook in place; 'before' was already cloned.
  const migrated = prepareBookData(rawBook, 'DryRun');
  const after = clone(migrated);

  function curriculumFor(bookConfig, customer){
    const templates = bookConfig.sessionTemplates || {};
    const moduleKey = (Array.isArray(templates[customer.module]) && templates[customer.module].length)
      ? customer.module : ((bookConfig.modules||[])[0] || customer.module);
    const csrdKey = customer.reportsCSRD ? (moduleKey + ' (CSRD)') : null;
    if(csrdKey && Array.isArray(templates[csrdKey]) && templates[csrdKey].length) return templates[csrdKey];
    return Array.isArray(templates[moduleKey]) ? templates[moduleKey] : [];
  }

  const beforeById = {}; (before.customers||[]).forEach(c=>{ beforeById[c.id]=c; });
  const perAccount = [];
  const nonNullDates = [];
  const sessionNotesChanged = [];
  const sourceCountZero = [];

  (after.customers||[]).forEach(c=>{
    const items = (c.outcomeCriteria && c.outcomeCriteria.items) || [];
    const evidence = c.outcomeEvidence || {};
    const evList = Object.keys(evidence).map(id=>({id, on:evidence[id].on, by:evidence[id].by, legacy:!!evidence[id].legacy}));
    perAccount.push({customerId:c.id, name:c.name, itemsLength: items.length, evidenceKeysLength: evList.length, evidence: evList});

    evList.forEach(e=>{ if(e.on !== null) nonNullDates.push({customerId:c.id, name:c.name, evidenceId:e.id, on:e.on}); });

    const b = beforeById[c.id];
    /* The 12 -> 13 step (piece 1) moves a numeric note key to its session id, so
       compare modulo that re-key. What must hold: after the re-key, the notes are
       exactly the before notes minus the keys backfillCustomerRecord drops as unusable
       (SESSION_NOTE_KEY_RE). Anything else is a lost or changed note. */
    const cur = curriculumFor(after.config, c);
    const rekeyed = {};
    Object.keys(c.sessionNotes||{}).forEach(k=>{
      let nk = k;
      if(/^ss_/.test(k)){ const i = cur.findIndex(t=>t && t.id === k); if(i >= 0) nk = String(i+1); }
      rekeyed[nk] = c.sessionNotes[k];
    });
    const keep = {};
    Object.keys((b && b.sessionNotes)||{}).forEach(k=>{ if(/^(\\d+|ss_[a-z0-9_]+)$/.test(k)) keep[k] = b.sessionNotes[k]; });
    const norm = o => JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]));
    const unexplained = norm(rekeyed) !== norm(keep);
    if(b && norm(b.sessionNotes||{}) !== norm(rekeyed)){
      sessionNotesChanged.push({customerId:c.id, name:c.name,
        beforeKeys: Object.keys(b.sessionNotes||{}),
        afterKeys: Object.keys(c.sessionNotes||{}), unexplained});
    }

    const curriculum = curriculumFor(after.config, c);
    items.forEach(it=>{
      if(it.sourceSession){
        const tpl = curriculum[it.sourceSession-1];
        const realCount = (tpl && Array.isArray(tpl.deliverables)) ? tpl.deliverables.length : 0;
        if(it.sourceCount === 0 && realCount > 0){
          sourceCountZero.push({customerId:c.id, name:c.name, criterionId:it.id, sourceSession:it.sourceSession, realCount});
        }
      }
    });
  });

  const afterById = {}; (after.customers||[]).forEach(c=>{ afterById[c.id]=c; });
  const reconciliationRows = [];
  const vanished = [];
  ticks.forEach(t=>{
    const acct = afterById[t.customerId];
    const items = (acct && acct.outcomeCriteria && acct.outcomeCriteria.items) || [];
    const evidence = (acct && acct.outcomeEvidence) || {};
    const numericKey = /^\\d+$/.test(t.sessionKey);
    const sessionNum = numericKey ? parseInt(t.sessionKey,10) : null;
    const candidates = items.filter(it => it.text === t.label && (it.sourceSession === sessionNum || it.sourceSession === null));
    const preferred = candidates.find(it => it.sourceSession === sessionNum && sessionNum !== null)
      || candidates.find(it => it.sourceSession === null);
    let fate, criterionId=null, ev=null;
    if(!preferred){
      fate = 'VANISHED — no matching criterion';
      vanished.push(Object.assign({}, t, {reason:'no matching criterion'}));
    } else {
      criterionId = preferred.id;
      ev = evidence[preferred.id] || null;
      if(!ev){
        fate = 'VANISHED — criterion exists but no evidence';
        vanished.push(Object.assign({}, t, {reason:'criterion without evidence', criterionId}));
      } else if(preferred.sourceSession === sessionNum && sessionNum !== null){
        fate = 'matched curriculum criterion';
      } else {
        fate = 'orphaned custom criterion';
      }
    }
    reconciliationRows.push(Object.assign({}, t, {fate, criterionId,
      evidenceOn: ev ? ev.on : undefined, evidenceBy: ev ? ev.by : undefined, evidenceLegacy: ev ? !!ev.legacy : undefined}));
  });

  // Second pass: run the ALREADY-migrated book through the import path again.
  const secondPass = clone(migrated);
  const migrated2 = prepareBookData(secondPass, 'DryRun-2');
  const secondPerAccount = (migrated2.customers||[]).map(c=>({
    customerId:c.id,
    itemsLength: ((c.outcomeCriteria&&c.outcomeCriteria.items)||[]).length,
    evidenceKeysLength: Object.keys(c.outcomeEvidence||{}).length
  }));
  const idempotenceDelta = secondPerAccount.map(s2=>{
    const first = perAccount.find(p=>p.customerId===s2.customerId);
    return {customerId:s2.customerId,
      itemsDelta: s2.itemsLength - (first?first.itemsLength:0),
      evidenceDelta: s2.evidenceKeysLength - (first?first.evidenceKeysLength:0)};
  });
  const anyDoubled = idempotenceDelta.some(d=>d.itemsDelta!==0 || d.evidenceDelta!==0);

  return JSON.stringify({
    totalAccountsBefore: (before.customers||[]).length,
    totalTicksBefore: ticks.length,
    perAccount,
    totalItemsAfter: perAccount.reduce((s,p)=>s+p.itemsLength,0),
    totalEvidenceAfter: perAccount.reduce((s,p)=>s+p.evidenceKeysLength,0),
    reconciliationRows,
    vanished,
    nonNullDates,
    sessionNotesChanged,
    sourceCountZero,
    anyDoubled,
    idempotenceDelta
  });
} catch (e) { return JSON.stringify({__harnessError__: String(e && e.stack || e)}); } })()`;

const analysisJson = await evaluate(analysisExpr, 'Analysis');
let result;
try { result = JSON.parse(analysisJson); }
catch { console.error('Analysis returned an unreadable result:', analysisJson); process.exit(2); }
if (result.__harnessError__) {
  console.error('Harness failure inside the page: ' + result.__harnessError__);
  process.exit(2);
}

// ---- Reconcile and report ----
const lines = [];
const push = s => { lines.push(s); };

push('# Migration dry run — v11 -> v12 outcome criteria/evidence');
push('');
push(`Generated ${new Date().toISOString()} against \`${target.split(/[\\/]/).pop()}\`, seeded from \`${seedPath.split(/[\\/]/).pop()}\`.`);
push('');
push('## Headline numbers');
push('');
push(`- Accounts in the legacy book: **${result.totalAccountsBefore}**`);
push(`- Total \`true\` ticks across all sessionNotes (before): **${result.totalTicksBefore}**`);
push(`- Total outcomeCriteria items (after): **${result.totalItemsAfter}**`);
push(`- Total outcomeEvidence records (after): **${result.totalEvidenceAfter}**`);
push(`- **Ticks lost (must be 0): ${result.vanished.length}**`);
push(`- Evidence records with a non-null \`on\` date (must be 0): **${result.nonNullDates.length}**`);
push(`- Accounts where \`sourceCount\` is 0 against a session that really holds deliverables: **${result.sourceCountZero.length}**`);
push(`- Second \`prepareBookData\` pass doubles anything: **${result.anyDoubled ? 'YES — regression' : 'no'}**`);
push('');

push('## Every tick and its fate');
push('');
push('| Account | Session key | Label | Fate | Criterion id | Evidence on / by / legacy |');
push('|---|---|---|---|---|---|');
for (const r of result.reconciliationRows) {
  const ev = r.criterionId ? `${r.evidenceOn === undefined ? '' : r.evidenceOn} / ${r.evidenceBy ?? ''} / ${r.evidenceLegacy ?? ''}` : '—';
  push(`| ${r.name} (\`${r.customerId}\`) | \`${JSON.stringify(r.sessionKey)}\` | ${r.label} | ${r.fate} | ${r.criterionId ?? '—'} | ${ev} |`);
}
push('');

push('## Vanished ticks (headline — must be empty)');
push('');
if (result.vanished.length === 0) {
  push('None. Every pre-migration tick has a corresponding criterion + evidence record.');
} else {
  for (const v of result.vanished) push(`- **${v.name}** (\`${v.customerId}\`) session \`${JSON.stringify(v.sessionKey)}\` label "${v.label}" — ${v.reason}`);
}
push('');

push('## Evidence with an invented date (must be empty)');
push('');
if (result.nonNullDates.length === 0) {
  push('None. Every migrated evidence record carries `on: null` — the migration never invents a date.');
} else {
  for (const n of result.nonNullDates) push(`- **${n.name}** (\`${n.customerId}\`) evidence \`${n.evidenceId}\` has on=${n.on}`);
}
push('');

push('## sessionNotes integrity');
push('');
if (result.sessionNotesChanged.length === 0) {
  push('`sessionNotes` is identical, before vs. after (modulo the numeric-key -> session-id re-key), for every account.');
} else {
  push('`sessionNotes` differs (modulo the numeric-key -> session-id re-key) for these accounts after the full `prepareBookData` pass (migrations + backfills):');
  push('');
  for (const s of result.sessionNotesChanged) {
    push(`- **${s.name}** (\`${s.customerId}\`) — before keys: ${JSON.stringify(s.beforeKeys)}, after keys: ${JSON.stringify(s.afterKeys)}`);
  }
  push('');
  push('Expected only for `legacy-badkey`: the v11->v12 step migrates the `\'3 \'`-keyed tick into a custom criterion; the key itself is then deleted by `backfillCustomerRecord` (pre-existing v48 behavior — "an unusable note shell is removed rather than rejecting the whole book" — which runs in the same `prepareBookData` call). The tick survives as evidence; only the unusable shell is gone. An account is flagged UNEXPLAINED if its notes differ from "before, minus unusable keys, modulo the re-key": that would be a lost or changed note and fails the run.');
  push('');
  for (const s of result.sessionNotesChanged) push(`- ${s.name}: ${s.unexplained ? '**UNEXPLAINED**' : 'explained (unusable key dropped)'}`);
}
push('');

push('## sourceCount:0 against a non-empty session (should be empty)');
push('');
if (result.sourceCountZero.length === 0) {
  push('None found.');
} else {
  for (const s of result.sourceCountZero) push(`- **${s.name}** (\`${s.customerId}\`) criterion \`${s.criterionId}\` sourceSession ${s.sourceSession} — template really has ${s.realCount} deliverable(s).`);
}
push('');

push('## Second-pass idempotence (migrateData/prepareBookData run again on the migrated book)');
push('');
push('| Account | items delta | evidence delta |');
push('|---|---|---|');
for (const d of result.idempotenceDelta) push(`| ${d.customerId} | ${d.itemsDelta} | ${d.evidenceDelta} |`);
push('');
push(result.anyDoubled ? '**Regression: a second pass changed counts.**' : 'No account gained or lost a single item or evidence record on the second pass. The migration is idempotent, as required for it to run safely on every load and every import.');
push('');

push('## Per-account after-state');
push('');
push('| Account | outcomeCriteria.items.length | Object.keys(outcomeEvidence).length |');
push('|---|---|---|');
for (const p of result.perAccount) push(`| ${p.name} (\`${p.customerId}\`) | ${p.itemsLength} | ${p.evidenceKeysLength} |`);
push('');

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`Report written to ${outPath}`);

// ---- Console summary ----
console.log('');
console.log(`Accounts: ${result.totalAccountsBefore}  Ticks before: ${result.totalTicksBefore}  Evidence after: ${result.totalEvidenceAfter}`);
console.log(`Ticks lost: ${result.vanished.length}  Non-null evidence dates: ${result.nonNullDates.length}  sourceCount:0 anomalies: ${result.sourceCountZero.length}`);
console.log(`sessionNotes changed accounts: ${result.sessionNotesChanged.length} (unexplained: ${result.sessionNotesChanged.filter(s=>s.unexplained).length})  Second-pass doubling: ${result.anyDoubled}`);
if (pageErrors.length) {
  console.log(`\n${pageErrors.length} console error(s) on load:`);
  for (const e of pageErrors) console.log('  ' + e.split('\n')[0]);
}

let code = 0;
if (result.vanished.length > 0) code = 1;
if (result.nonNullDates.length > 0) code = 1;
if (result.anyDoubled) code = 1;
if (result.sessionNotesChanged.some(s => s.unexplained)) code = 1;
if (pageErrors.length) code = 1;
process.exit(code);
