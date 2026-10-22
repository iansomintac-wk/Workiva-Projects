/* node tools/score-once.js <name> <prompts> <gold> [--scorer <path>]   see tools/README.md */
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const L = process.env.FF_LEDGER || path.join(__dirname, '..', '..', '.ledger', '2026-10-22-fit-finder-bca');
const a = process.argv.slice(2);
const si = a.indexOf('--scorer');
const scorer = si >= 0 ? path.resolve(a[si + 1]) : path.join(__dirname, '..', 'tests', 'synth-score.js');
if (si >= 0) a.splice(si, 2);
const [name, prompts, gold] = a;
if (!name || !prompts || !gold || !/^[\w.-]+$/.test(name)) { console.log('STOP: usage: score-once.js <name> <prompts> <gold> [--scorer <path>]'); process.exit(3); }
const out = path.join(L, 'score-' + name + '.out'), started = path.join(L, 'score-' + name + '.started');
if (fs.existsSync(out)) {
  const t = fs.readFileSync(out, 'utf8'), nl = t.indexOf('\n');
  const m = /^STATUS (\d+)$/.exec(t.slice(0, nl < 0 ? t.length : nl));
  if (!m) { console.log('STOP: unreadable record ' + out); process.exit(3); }
  process.stdout.write(nl < 0 ? '' : t.slice(nl + 1));
  process.exit(Number(m[1]));
}
if (fs.existsSync(started)) { console.log('STOP: unknown outcome'); process.exit(3); }
fs.mkdirSync(L, { recursive: true });
fs.writeFileSync(started, new Date().toISOString() + '\n', { flag: 'wx' });
const cwd = path.join(__dirname, '..');
const r = spawnSync(process.execPath, [scorer, path.resolve(prompts), path.resolve(gold)], { cwd, encoding: 'utf8', maxBuffer: 1 << 26 });
const status = r.status === null ? 1 : r.status;
const tmp = out + '.tmp';
fs.writeFileSync(tmp, 'STATUS ' + status + '\n' + (r.stdout || ''));
fs.renameSync(tmp, out);
process.stdout.write(r.stdout || '');
if (r.stderr) process.stderr.write(r.stderr);
process.exit(status);
