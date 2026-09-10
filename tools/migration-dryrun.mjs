#!/usr/bin/env node
// Dry-run harness for the v11 -> v12 outcome-criteria/evidence migration.
//   node tools/migration-dryrun.mjs [file.html] [--seed tools/legacy-seed.js] [--out .artifacts/migration-dryrun.md]
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
const seedPath = resolve(flag('seed', 'tools/legacy-seed.js'));
const outPath = resolve(flag('out', '.artifacts/migration-dryrun.md'));
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
    const beforeNotesStr = b ? JSON.stringify(b.sessionNotes||{}) : null;
    const afterNotesStr = JSON.stringify(c.sessionNotes||{});
    if(beforeNotesStr !== afterNotesStr){
      sessionNotesChanged.push({customerId:c.id, name:c.name,
        beforeKeys: b ? Object.keys(b.sessionNotes||{}) : [],
        afterKeys: Object.keys(c.sessionNotes||{})});
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
  push('`sessionNotes` is byte-identical, before vs. after, for every account.');
} else {
  push('`sessionNotes` differs for these accounts after the full `prepareBookData` pass (migration + backfills):');
  push('');
  for (const s of result.sessionNotesChanged) {
    push(`- **${s.name}** (\`${s.customerId}\`) — before keys: ${JSON.stringify(s.beforeKeys)}, after keys: ${JSON.stringify(s.afterKeys)}`);
  }
  push('');
  push('This is expected for `legacy-badkey`: `migrateData` (the v11->v12 step under test) leaves `sessionNotes` untouched and migrates the `\'3 \'`-keyed tick into a custom criterion; the key itself is then deleted by `backfillCustomerRecord` (pre-existing v48 behavior — "an unusable note shell is removed rather than rejecting the whole book" — that runs immediately afterward as part of the same `prepareBookData` call, not by the new migration). The tick survives as evidence; only the unusable shell is gone.');
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
console.log(`sessionNotes changed accounts: ${result.sessionNotesChanged.length}  Second-pass doubling: ${result.anyDoubled}`);
if (pageErrors.length) {
  console.log(`\n${pageErrors.length} console error(s) on load:`);
  for (const e of pageErrors) console.log('  ' + e.split('\n')[0]);
}

let code = 0;
if (result.vanished.length > 0) code = 1;
if (result.nonNullDates.length > 0) code = 1;
if (result.anyDoubled) code = 1;
if (pageErrors.length) code = 1;
process.exit(code);
