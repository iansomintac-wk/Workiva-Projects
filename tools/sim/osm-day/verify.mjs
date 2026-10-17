// Verify C1-C8 of the day+lifecycle sim. Prints exactly one line per check and writes sim-runs/verify.txt.
//   node tools/sim/osm-day/verify.mjs                      run everything (two full runs, two field tests), then score
//   node tools/sim/osm-day/verify.mjs --score-only [--dir <state dir>]   score a state dir written by an earlier run
// State dir (default sim-runs/verify): before.json, after.json, run1/, run2/ (run.mjs --out folders, run.exit),
// ft/<v>.json + ft/<v>.exit. Exit 0 only if C5-C8 hold and no run exited 2; C1-C4 are reported, not gated.
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTimings } from './lib/report.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..');
const VERSIONS = ['1.0', '1.1'];
const PREFIXES = ['fieldtest-', 'osmsim-', 'clockspike-', 'aispike-'];
const HASHES = {
  '1.0': 'a21ca8c34c9c0859bf6b26e77f53a748e34daa026c21d2dba8f95f980d2fbddb',
  '1.1': 'b247a93cd504416518077088e5092bad234ec5eb5a51491bc24f87e08edd22d2',
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

const L6RE = /firstToday=(\S+)(?: \(day (\d+)\))? firstWatch=(\S+)(?: \(day (\d+)\))? firstOffTrack=(\S+)(?: \(day (\d+)\))?/;
function c3(runs) {
  const parts = []; let ok = true;
  for (const v of VERSIONS) {
    const s = fullResult(runs, v).steps.find(x => x.id === 'L6');
    const m = s && L6RE.exec(s.evidence || '');
    if (!m) { ok = false; parts.push(`${v} L6 evidence unreadable`); continue; }
    const [t, w, o] = [m[2], m[4], m[6]].map(x => (x === undefined ? Infinity : Number(x)));
    const b = [t <= 7, w <= 10, o <= 21];
    if (!b.every(Boolean)) ok = false;
    const d = x => (x === Infinity ? 'never' : 'd' + x);
    parts.push(`${v} Today ${d(t)}<=7 ${b[0]}, Watch ${d(w)}<=10 ${b[1]}, OffTrack ${d(o)}<=21 ${b[2]}`);
  }
  return `C3 ${ok ? 'PASS' : 'FAIL'} ${parts.join(' | ')}`;
}

function c4(runs) {
  const parts = []; let ok = true;
  for (const v of VERSIONS) {
    const br = fullResult(runs, v).breaks || [];
    const n = k => br.filter(b => b.verdict === k).length;
    if (br.length !== 21 || n('FLIPPED') !== 21) ok = false;
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
  // Information only: the same comparison with the tracker-made random connector id (SIM-EXT-...) masked.
  const mask = r => JSON.stringify(stripTimings(r)).replace(/SIM-EXT-[a-z0-9]+/g, 'SIM-EXT-*');
  const masked = VERSIONS.every(v => mask(runs[0].res[v]) === mask(runs[1].res[v]));
  return { ok: diffs.length === 0, line: diffs.length ? `C5 FAIL differs: ${diffs.join(', ')} (random SIM-EXT id masked: ${masked ? 'identical' : 'still differs'})` : 'C5 PASS identical' };
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

function c8() {
  const got = {}; let ok = true;
  for (const v of VERSIONS) {
    got[v] = createHash('sha256').update(readFileSync(trackerFile(v))).digest('hex');
    if (got[v] !== HASHES[v]) ok = false;
  }
  const base = spawnSync('git', ['rev-parse', '--verify', '--quiet', 'master'], { cwd: ROOT }).status === 0 ? 'master' : 'main';
  const d = spawnSync('git', ['diff', '--quiet', base, '--', ...VERSIONS.map(v => `osm-book-of-business-tracker-${v}.html`)], { cwd: ROOT });
  const clean = d.status === 0;
  return { ok: ok && clean, line: `C8 ${ok && clean ? 'PASS' : 'FAIL'} 1.0 ${got['1.0'].slice(0, 8)}... 1.1 ${got['1.1'].slice(0, 8)}... diff ${clean ? 'clean' : 'DIRTY vs ' + base + ' (git exit ' + d.status + ')'}${ok ? '' : ' HASH CHANGED'}` };
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
  const dir = resolve(di >= 0 ? args[di + 1] : join(ROOT, 'sim-runs', 'verify'));
  try {
    if (!args.includes('--score-only')) runAll(dir);
    const { lines, code } = score(dir);
    const outPath = join(dirname(dir), 'verify.txt');
    writeFileSync(outPath, lines.join('\n') + `\nexit ${code}\n`);
    console.log(lines.join('\n'));
    process.exit(code);
  } catch (e) {
    console.log('verify harness error: ' + e.message);
    process.exit(2);
  }
}
