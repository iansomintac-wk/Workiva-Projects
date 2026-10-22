/* node tools/keep-check.js <EV>   see tools/README.md */
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const FF = path.join(__dirname, '..');

// the keep rule: kept iff R1 >= R0 + 1 and S1 <= S0
function decide(b, a) {
  const rOk = a.R >= b.R + 1, sOk = a.S <= b.S;
  if (rOk && sOk) return { outcome: 'kept', reason: 'none' };
  const r = 'R gain < 1 (' + b.R + ' to ' + a.R + ')', s = 'S rose (' + b.S + ' to ' + a.S + ')';
  if (!rOk && !sOk) return { outcome: 'reverted', reason: 'R gain < 1 and S rose (' + b.R + ' to ' + a.R + '; ' + b.S + ' to ' + a.S + ')' };
  return { outcome: 'reverted', reason: rOk ? s : r };
}

function main() {
  const fail = (m) => { console.log('keep-check FAIL: ' + m); process.exit(1); };
  const ev = process.argv[2];
  if (!ev || !fs.existsSync(ev)) fail('evidence doc not found');
  const text = fs.readFileSync(ev, 'utf8').split(/\r?\n/);
  const line = (p) => { const l = text.filter((x) => x.startsWith(p + ': ')); if (l.length !== 1) fail(p + ' appears ' + l.length + ' times'); return l[0].slice(p.length + 2).trim(); };
  const num = (l, p, what) => { const m = new RegExp(p + '(\\d+)').exec(l); if (!m) fail('no "' + p + 'N" in ' + what); return Number(m[1]); };
  const bl = line('BEFORE-LINE'), al = line('AFTER-LINE'), outcome = line('OUTCOME'), reason = line('REASON');
  const d = decide({ R: num(bl, 'right feature first ', 'BEFORE-LINE'), S: num(bl, 'score ', 'BEFORE-LINE') }, { R: num(al, 'right feature first ', 'AFTER-LINE'), S: num(al, 'score ', 'AFTER-LINE') });
  if (!['kept', 'reverted'].includes(outcome)) fail('OUTCOME must be kept or reverted');
  if (d.outcome !== outcome) fail('rule gives ' + d.outcome + ', evidence says ' + outcome);
  if (d.reason !== reason) fail('REASON should be "' + d.reason + '", evidence says "' + reason + '"');
  const git = (args) => spawnSync('git', args, { cwd: FF, encoding: 'utf8' });
  const g = git(['rev-list', '-1', '--grep=^task 11:', 'HEAD']);
  const sha = (g.stdout || '').trim();
  if (g.status !== 0 || !sha) fail('no commit with subject "task 11:" found');
  const frozen = (extra) => spawnSync(process.execPath, [path.join(FF, 'tests', 'match-frozen.js'), '--base', sha, ...extra], { cwd: FF, encoding: 'utf8' }).status === 0;
  if (outcome === 'reverted') { if (!frozen([])) fail('reverted, but match-frozen fails against the task 11 commit'); }
  else {
    if (!frozen(['--allow', 'ops'])) fail('kept, but match-frozen --allow ops fails');
    if (frozen([])) fail('kept, but match-frozen passes without --allow ops (no ops change)');
  }
  console.log('keep-check ok ' + outcome);
}
module.exports = { decide };
if (require.main === module) main();
