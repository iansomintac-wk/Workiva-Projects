/* Guard for the fair-test tuning loop.  node tests/fair-guard.js --base <sha> [--lock-base <sha>] [--pins <file>]
   Exit 0 only if: the suite exits 0; every pin holds (suite lines incl. fresh fit agreement); eval A and B exit 0 over the pinned
   number of rows and hold their agreement pins; the locked paths are unchanged against the lock base; catalogue.json differs
   from <sha> only in match fields. */
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a.splice(i, 2)[1] : d; };
const root = path.join(__dirname, '..');
const pinFile = opt('--pins');
const base = opt('--base', process.env.FAIR_BASE);
const lockBase = opt('--lock-base', base);
const pins = pinFile ? JSON.parse(fs.readFileSync(pinFile, 'utf8'))
  : { B: { r: 13, w: 3 }, A: { r: 12, w: 0 }, real: { r: 15, w: 2 }, fresh: { r: 15, w: 5, k: 1, agree: 12 }, evalA: 52, evalB: 45, evalRows: 60 };
const bad = [];
const run = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
const git = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
const suite = run(['tests/catalogue.test.js']);
if (suite.status !== 0) bad.push('suite exit ' + suite.status);
const lines = (suite.stdout || '').split('\n');
const num = (re, l) => { const m = re.exec(l); return m ? +m[1] : NaN; };
const pin = (label, prefix, need) => {
  const l = lines.find((x) => x.startsWith(prefix));
  if (!l) { bad.push(label + ': suite line missing'); return; }
  const right = num(/first card right: (\d+) of/, l), wrong = num(/wrong card (\d+)/, l);
  if (!(right >= need.r)) bad.push(`${label}: right ${right} < ${need.r}`);
  if (!(wrong <= need.w)) bad.push(`${label}: wrong ${wrong} > ${need.w}`);
  if (need.k !== undefined) { const k = num(/card on a not-a-fit prompt (\d+)/, l); if (!(k <= need.k)) bad.push(`${label}: card on not-a-fit ${k} > ${need.k}`); }
  if (need.agree !== undefined) { const g = num(/fit agreement (\d+) of/, l); if (!(g >= need.agree)) bad.push(`${label}: fit agreement ${g} < ${need.agree}`); }
};
pin('B', 'first card right:', pins.B);
pin('A', 'half A first card right:', pins.A);
pin('real', 'real prompts first card right:', pins.real);
pin('fresh', 'fresh prompts first card right:', pins.fresh);
for (const [h, key] of [['A', 'evalA'], ['B', 'evalB']]) {
  const e = run(['tests/eval.js', 'data/tasks.jsonl', 'data/tasks.jsonl', '--ids', h]);
  const m = /fit agreement (\d+)\/(\d+)/.exec(e.stdout || '');
  if (e.status !== 0) bad.push(`eval ${h}: exit ${e.status}`);
  if (!m) bad.push(`eval ${h}: no summary line`);
  else {
    if (+m[2] !== pins.evalRows) bad.push(`eval ${h}: denominator ${m[2]} != ${pins.evalRows}`);
    if (+m[1] < pins[key]) bad.push(`eval ${h}: agreement ${m[1]} < ${pins[key]}`);
  }
}
const locked = [':(top)fit-finder/tests', ':(top)fit-finder/data/LABELING.md', ':(top)fit-finder/data/synth', ':(top,glob)fit-finder/data/*.jsonl'];
if (!base) bad.push('no --base given');
else {
  const d = git(['diff', '--quiet', lockBase, '--', ...locked]);
  if (d.status !== 0) bad.push('locked files differ from base (git diff exit ' + d.status + ')');
  const s = git(['status', '--porcelain', '--', ...locked]);
  if (s.status !== 0 || s.stdout.trim()) bad.push('locked paths have uncommitted or untracked changes');
  const g = git(['show', base + ':fit-finder/data/catalogue.json']);
  if (g.status !== 0) bad.push('catalogue: cannot read base ' + base);
  else {
    const strip = (c) => JSON.stringify({ ...c, useCases: c.useCases.map((u) => { const { match, ...rest } = u; return rest; }) });
    const now = JSON.parse(fs.readFileSync(path.join(root, 'data/catalogue.json'), 'utf8'));
    if (strip(JSON.parse(g.stdout)) !== strip(now)) bad.push('catalogue: differs from base outside match fields');
  }
}
console.log(bad.length ? 'fair-guard FAIL: ' + bad.join(' | ') : 'fair-guard PASS');
process.exit(bad.length ? 1 : 0);
