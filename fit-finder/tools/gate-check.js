/* node tools/gate-check.js <EV> --stage before|final [--no-git]
   Checks the gate evidence doc: summaries derived from the score lines, the keep rule, the REASON text, prediction order, git state. */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const a = process.argv.slice(2);
const stage = a.indexOf('--stage') >= 0 ? a[a.indexOf('--stage') + 1] : '';
const noGit = a.includes('--no-git');
const file = a.find((x, i) => !x.startsWith('--') && a[i - 1] !== '--stage');
if (!file || !['before', 'final'].includes(stage)) { console.log('usage: gate-check.js <EV> --stage before|final [--no-git]'); process.exit(2); }
const root = path.join(__dirname, '..');
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
const get = (tag) => {
  const i = lines.findIndex((l) => l.startsWith(tag));
  return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
};
const bad = [];
function parse(text) {
  const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
  const s = /split: right feature first (\d+) of (\d+)/.exec(text);
  const r = { R: s ? +s[1] : NaN, F: s ? +s[2] : NaN, W: m(/wrong card (\d+)/), N: m(/no card where one fits (\d+)/), K: m(/card on a not-a-fit prompt (\d+)/) };
  return Object.values(r).some(Number.isNaN) ? null : r;
}
const derived = (x) => `feature ${x.R} of ${x.F}, wrong ${x.W}, no card ${x.N}, not-a-fit ${x.K}`;
function side(lineTag, sumTag) {
  const L = get(lineTag), S = get(sumTag);
  if (!L) { bad.push('missing ' + lineTag); return null; }
  const p = parse(L.v);
  if (!p) { bad.push(lineTag + ' lacks the score numbers'); return null; }
  if (!S) bad.push('missing ' + sumTag);
  else if (S.v !== derived(p)) bad.push(`${sumTag} should be "${derived(p)}"`);
  return { p, L };
}
const base = get('BASE-SHA:');
if (!base || !base.v) bad.push('missing BASE-SHA:');
const b = side('BEFORE-LINE:', 'BEFORE:');
const pm = get('PREDICTION-PM:'), lead = get('PREDICTION-LEAD:');
if (!pm) bad.push('missing PREDICTION-PM:');
if (!lead) bad.push('missing PREDICTION-LEAD:');
const outcome = get('OUTCOME:'), reason = get('REASON:');
let a1 = null;
const finalOutcome = outcome ? outcome.v : 'pending';
if (b) {
  const N0 = b.p.N, inconclusive = N0 < 6;
  if (inconclusive) {
    if (!outcome || outcome.v !== 'inconclusive') bad.push('before no-card < 6: OUTCOME must be inconclusive');
    if (!reason || reason.v !== `before no-card < 6 (${N0})`) bad.push(`REASON must be "before no-card < 6 (${N0})"`);
  }
  if (stage === 'final') {
    if (inconclusive) {
      if (get('AFTER-LINE:') || get('AFTER:')) bad.push('inconclusive run must have no AFTER-LINE or AFTER:');
    } else {
      a1 = side('AFTER-LINE:', 'AFTER:');
      if (!outcome || !['kept', 'reverted'].includes(outcome.v)) bad.push('OUTCOME must be kept or reverted');
      const al = get('AFTER-LINE:');
      if (al && pm && lead && (pm.i > al.i || lead.i > al.i)) bad.push('PREDICTION lines must come before AFTER-LINE');
      if (a1) {
        const x = b.p, y = a1.p, why = [];
        if (!(x.N - y.N >= 2)) why.push(`no-card fall < 2 (${x.N} to ${y.N})`);
        if (!(y.W <= x.W)) why.push(`wrong card rose (${x.W} to ${y.W})`);
        if (!(y.K <= x.K)) why.push(`not-a-fit card rose (${x.K} to ${y.K})`);
        const kept = why.length === 0, want = kept ? 'none' : why.join(' and ');
        if (outcome && outcome.v !== (kept ? 'kept' : 'reverted')) bad.push(`OUTCOME should be ${kept ? 'kept' : 'reverted'}`);
        if (!reason || reason.v !== want) bad.push(`REASON should be "${want}"`);
        const pr = get('PREDICTION:');
        if (!pr || pr.v !== (kept ? 'held' : 'did not hold')) bad.push(`PREDICTION: should be "${kept ? 'held' : 'did not hold'}"`);
      }
    }
  }
}
if (!noGit && base && base.v && !bad.length) {
  const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8' }).status;
  const sha = base.v, mf = path.join(root, 'tests/match-frozen.js');
  const same = run('git', ['diff', '--quiet', sha, 'HEAD', '--', ':(top)fit-finder/engine/fit.js']) === 0;
  if (finalOutcome === 'kept') {
    if (same) bad.push('kept but engine/fit.js equals BASE');
    if (run('node', [mf, '--base', sha, '--allow', 'engine']) !== 0) bad.push('match-frozen --allow engine fails');
    if (run('node', [mf, '--base', sha]) === 0) bad.push('match-frozen passes without --allow engine');
  } else {
    if (!same) bad.push('engine/fit.js differs from BASE but outcome is ' + finalOutcome);
    if (run('node', [mf, '--base', sha]) !== 0) bad.push('match-frozen --base fails');
  }
}
if (bad.length) { console.log('gate-check FAIL: ' + bad.join('; ')); process.exit(1); }
const f = (t, x) => `${t} feature ${x.R} of ${x.F} wrong ${x.W} no-card ${x.N} not-a-fit ${x.K}`;
console.log(`gate-check ok ${stage} ${finalOutcome}; ${f('before', b.p)}` + (a1 ? `; ${f('after', a1.p)}` : ''));
