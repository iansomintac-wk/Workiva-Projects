// Verify C1-C8 of the day+lifecycle sim. Prints exactly one line per check and writes sim-runs/verify.txt.
//   node tools/sim/osm-day/verify.mjs                      run everything (two full runs, two field tests), then score
//   node tools/sim/osm-day/verify.mjs --score-only [--dir <state dir>]   score a state dir written by an earlier run
//   node tools/sim/osm-day/verify.mjs --c3-only --dir <folder under sim-runs>   print just C3 from results-1.0/1.1.json there (partial ok); exit 0 PASS, 1 FAIL, 2 harness error
// State dir (default sim-runs/verify): before.json, after.json, run1/, run2/ (run.mjs --out folders, run.exit),
// ft/<v>.json + ft/<v>.exit. Exit 0 only if C5-C8 hold and no run exited 2; C1-C4 are reported, not gated.
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveUnderSimRuns } from './lib/outdir.mjs';
import { stripTimings } from './lib/report.mjs';
import { CHECKED } from './lib/results.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..');
const VERSIONS = ['1.0', '1.1'];
const PREFIXES = ['fieldtest-', 'osmsim-', 'clockspike-', 'aispike-'];
const HASHES = {
  '1.0': '88ff9926fd49c837103b9b0eb9ebe554f8e5cbe2a48a0b6a55926441b67a64c4',
  '1.1': '0fdc8cf12335f35030e95bd2495cfcfef4b17b0f8a44b493759b7c8958c42a3e',
};
const trackerFile = v => join(ROOT, `osm-book-of-business-tracker-${v}.html`);

export function listLeftovers(dir = tmpdir()) {
  return readdirSync(dir).filter(n => PREFIXES.some(p => n.startsWith(p))).sort();
}

// Chrome processes whose command line carries one of our throwaway profile prefixes (alive right now).
export function simPids() {
  if (process.platform !== 'win32') return [];
  const out = execFileSync('powershell', ['-NoProfile', '-Command',
    "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | ForEach-Object { \"$($_.ProcessId)`t$($_.CommandLine)\" }"],
    { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 24 });
  const re = new RegExp(`user-data-dir=\\S*(${PREFIXES.join('|')})`);
  return out.split(/\r?\n/).filter(l => re.test(l)).map(l => Number(l.split('\t')[0]));
}

export const snapshotNow = () => ({ leftovers: listLeftovers(), pids: simPids() });

// ---- scoring (pure over the state dir, so a doctored copy can prove each FAIL path) ----
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const readNum = p => (existsSync(p) ? Number(readFileSync(p, 'utf8').trim()) : NaN);

function loadRuns(dir) {
  const runs = [];
  for (const n of ['run1', 'run2']) {
    const r = { name: n, exit: readNum(join(dir, n, 'run.exit')), res: {} };
    for (const v of VERSIONS) {
      const p = join(dir, n, `results-${v}.json`);
      if (existsSync(p)) r.res[v] = readJson(p);
    }
    runs.push(r);
  }
  return runs;
}

// First non-partial result per version (partial results never count for C1-C5).
function fullResult(runs, v) {
  for (const r of runs) if (r.res[v] && r.res[v].partial === false) return r.res[v];
  if (runs.some(r => r.res[v])) throw new Error(`only partial results for ${v}`);
  throw new Error(`no results for ${v}`);
}

const byPart = (steps, ch) => steps.filter(s => s.id.startsWith(ch));
function counts(steps) {
  const c = { PASS: 0, FAIL: 0, GAP: 0 };
  const fails = [];
  for (const s of steps) { c[s.status] = (c[s.status] || 0) + 1; if (s.status === 'FAIL') fails.push(s.id); }
  return { c, fails };
}
function partLine(tag, ch, runs) {
  const parts = []; let bad = false;
  for (const v of VERSIONS) {
    const { c, fails } = counts(byPart(fullResult(runs, v).steps, ch));
    if (fails.length) bad = true;
    parts.push(`${v} PASS ${c.PASS} FAIL ${c.FAIL}${fails.length ? ' [' + fails.join(',') + ']' : ''} GAP ${c.GAP}`);
  }
  return `${tag} ${bad ? 'FAIL' : 'PASS'} ${parts.join(' | ')}`;
}

export const C3_DAY7 = '2026-10-12';
const DAYROWS_RE = /dayRows=\[([^\]]*)\]/;
const c3Entry = s => { const [d, rank, where] = s.split('@'); return { d, rank: rank === 'none' ? null : Number(rank), where: where === 'none' ? '' : where }; };
// The one place that says "rendered in a day step": a day step (a booked call's beat), in the day's 15.
// Below the day (past what one day holds) and a gate-deck card do not count (Ian's ruling, spec line 41).
export const c3OnScreen = e => e.rank !== null && e.rank <= 15 && /day step/.test(e.where);
function c3Version(v, res) {
  if (!res) return { ok: false, text: `${v} not run`, ran: false };
  const s = (res.steps || []).find(x => x.id === 'L6');
  const m = s && DAYROWS_RE.exec(s.evidence || '');
  if (!m) return { ok: false, text: `${v} L6 dayRows unreadable`, ran: true };
  const days = m[1].split(';').filter(Boolean).map(c3Entry).filter(e => e.d <= C3_DAY7);
  const hit = days.find(c3OnScreen);
  if (hit) return { ok: true, text: `${v} in the day's 15 on screen on ${hit.d} (rank ${hit.rank}, ${hit.where})`, ran: true };
  return { ok: false, ran: true, text: `${v} no on-screen row in the day's 15 on or before ${C3_DAY7} (seen: ${days.map(e => `${e.d.slice(5)}:${e.rank === null ? '-' : e.rank}/${e.where || '-'}`).join(' ')})` };
}
// Ian's ruling (2026-10-19): on 1.1 a silent new customer's row is in the day's 15 within 7 days of hand-off. 1.0 is reported and expected to fail; only 1.1 gates the line.
export function c3FromResults(res) {
  const r10 = c3Version('1.0', res['1.0']), r11 = c3Version('1.1', res['1.1']);
  return `C3 ${r11.ok ? 'PASS' : 'FAIL'} ${r10.text}${r10.ran && !r10.ok ? ' (reported, expected to fail)' : ''} | ${r11.text}`;
}
export function c3(runs) {
  return c3FromResults(Object.fromEntries(VERSIONS.map(v => [v, fullResult(runs, v)])));
}

function c4(runs) {
  const parts = []; let ok = true;
  for (const v of VERSIONS) {
    const br = fullResult(runs, v).breaks || [];
    const n = k => br.filter(b => b.verdict === k).length;
    if (br.length !== CHECKED.length || n('FLIPPED') !== CHECKED.length) ok = false;
    parts.push(`${v} FLIPPED ${n('FLIPPED')} VACUOUS ${n('VACUOUS')} NOT-TESTED ${n('NOT-TESTED')} of ${br.length}`);
  }
  return `C4 ${ok ? 'PASS' : 'FAIL'} ${parts.join(' | ')}`;
}

function c5(runs) {
  const diffs = [];
  for (const v of VERSIONS) {
    const a = runs[0].res[v], b = runs[1].res[v];
    if (!a || !b || a.partial !== false || b.partial !== false) throw new Error(`C5 needs two full runs for ${v}`);
    const sa = stripTimings(a), sb = stripTimings(b);
    for (const k of ['steps', 'breaks']) {
      const n = Math.max(sa[k].length, sb[k].length);
      for (let i = 0; i < n; i++) {
        if (JSON.stringify(sa[k][i]) !== JSON.stringify(sb[k][i])) diffs.push(`${v} ${k === 'steps' ? '' : 'break '}${(sa[k][i] || sb[k][i]).id}`);
      }
    }
    if (JSON.stringify({ ...sa, steps: 0, breaks: 0 }) !== JSON.stringify({ ...sb, steps: 0, breaks: 0 })) diffs.push(`${v} header`);
  }
  return { ok: diffs.length === 0, line: diffs.length ? `C5 FAIL differs: ${diffs.join(', ')}` : 'C5 PASS identical' };
}

function c6(before, after) {
  const fresh = after.leftovers.filter(n => !before.leftovers.includes(n));
  const alive = after.pids.filter(p => !before.pids.includes(p));
  const ok = !fresh.length && !alive.length;
  return { ok, line: `C6 ${ok ? 'PASS' : 'FAIL'} ${fresh.length} new folders${fresh.length ? ' (' + fresh.join(', ') + ')' : ''}, ${alive.length} pids alive${alive.length ? ' (' + alive.join(',') + ')' : ''}` };
}

function c7(dir, before, after) {
  const exits = VERSIONS.map(v => readNum(join(dir, 'ft', `${v}.exit`)));
  const metricKeys = VERSIONS.map(v => {
    try { return Object.keys(readJson(join(dir, 'ft', `${v}.json`)) || {}).length; } catch { return 0; }
  });
  const fresh = after.leftovers.filter(n => n.startsWith('fieldtest-') && !before.leftovers.includes(n));
  const ok = exits.every(e => e === 0) && metricKeys.every(k => k > 0) && fresh.length === 0;
  return { ok, line: `C7 ${ok ? 'PASS' : 'FAIL'} exit ${exits.every(e => e === 0) ? '0 x2' : 'NOT 0 x2 (' + exits.join(' ') + ')'}, metrics keys ${metricKeys.join('/')}, ${fresh.length} new folders` };
}

// C8: 1.1 is guarded by its pin, 1.0 by pin and diff.
function c8() {
  const got = {}; let ok = true;
  for (const v of VERSIONS) {
    got[v] = createHash('sha256').update(readFileSync(trackerFile(v))).digest('hex');
    if (got[v] !== HASHES[v]) ok = false;
  }
  const base = spawnSync('git', ['rev-parse', '--verify', '--quiet', 'master'], { cwd: ROOT }).status === 0 ? 'master' : 'main';
  const d = spawnSync('git', ['diff', '--quiet', base, '--', 'osm-book-of-business-tracker-1.0.html'], { cwd: ROOT });
  const clean = d.status === 0;
  return { ok: ok && clean, line: `C8 ${ok && clean ? 'PASS' : 'FAIL'} 1.0 ${got['1.0'].slice(0, 8)}... 1.1 ${got['1.1'].slice(0, 8)}... 1.0 diff ${clean ? 'clean vs ' + base : 'DIRTY vs ' + base + ' (git exit ' + d.status + ')'}${ok ? '' : ' HASH CHANGED'}` };
}

export function score(dir) {
  const runs = loadRuns(dir);
  const before = readJson(join(dir, 'before.json')), after = readJson(join(dir, 'after.json'));
  const lines = [];
  const gate = [];
  lines.push(partLine('C1', 'D', runs));
  lines.push(partLine('C2', 'L', runs));
  lines.push(c3(runs));
  lines.push(c4(runs));
  const r5 = c5(runs); lines.push(r5.line); gate.push(r5.ok);
  const r6 = c6(before, after); lines.push(r6.line); gate.push(r6.ok);
  const r7 = c7(dir, before, after); lines.push(r7.line); gate.push(r7.ok);
  const r8 = c8(); lines.push(r8.line); gate.push(r8.ok);
  const runBad = runs.some(r => r.exit === 2 || Number.isNaN(r.exit));
  if (runBad) lines.push(`note: a run exited 2 or has no exit code (${runs.map(r => r.name + '=' + r.exit).join(', ')})`);
  return { lines, code: gate.every(Boolean) && !runBad ? 0 : 1 };
}

// ---- running ----
function runAll(dir) {
  mkdirSync(join(dir, 'ft'), { recursive: true });
  writeFileSync(join(dir, 'before.json'), JSON.stringify(snapshotNow(), null, 2));
  for (const n of ['run1', 'run2']) {
    const out = join(dir, n);
    mkdirSync(out, { recursive: true });
    const r = spawnSync(process.execPath, [join(HERE, 'run.mjs'), '--out', out], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 25 * 60 * 1000 });
    writeFileSync(join(out, 'stdout.txt'), (r.stdout || '') + (r.stderr || ''));
    writeFileSync(join(out, 'run.exit'), String(r.status ?? 2));
  }
  for (const v of VERSIONS) {
    const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'sim', 'run-field-test.mjs'), '--target', trackerFile(v), '--out', join(dir, 'ft', `${v}.json`)],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 10 * 60 * 1000 });
    writeFileSync(join(dir, 'ft', `${v}.log`), (r.stdout || '') + (r.stderr || ''));
    writeFileSync(join(dir, 'ft', `${v}.exit`), String(r.status ?? 2));
  }
  writeFileSync(join(dir, 'after.json'), JSON.stringify(snapshotNow(), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const di = args.indexOf('--dir');
  let dir;
  try {
    if (args.includes('--c3-only')) {
      if (di < 0) throw new Error('--c3-only needs --dir');
      const cdir = resolveUnderSimRuns(args[di + 1], ROOT);
      const res = {};
      for (const v of VERSIONS) { const p = join(cdir, `results-${v}.json`); if (existsSync(p)) res[v] = readJson(p); }
      const line = c3FromResults(res);
      console.log(line);
      process.exit(line.startsWith('C3 PASS') ? 0 : 1);
    }
    const fresh = join(ROOT, 'sim-runs', 'verify-' + new Date().toISOString().replace(/[:.]/g, '-'));
    dir = di >= 0 ? resolveUnderSimRuns(args[di + 1], ROOT) : args.includes('--score-only') ? join(ROOT, 'sim-runs', 'verify') : fresh;
    if (!args.includes('--score-only') && existsSync(join(dir, 'run1'))) throw new Error(`${dir} already holds a run; use a fresh folder`);
    if (!args.includes('--score-only')) runAll(dir);
    const { lines, code } = score(dir);
    const outPath = join(dir, 'verify.txt');
    writeFileSync(outPath, lines.join('\n') + `\nexit ${code}\n`);
    console.log(lines.join('\n'));
    process.exit(code);
  } catch (e) {
    console.log('verify harness error: ' + e.message);
    process.exit(2);
  }
}
