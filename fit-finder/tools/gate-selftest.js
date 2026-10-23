/* node tools/gate-selftest.js : exercises gate-check.js (--no-git, plus one git-mode engine-diff case) and engine-scope.js. Prints gate-selftest ok or the first failure. */
const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const gc = path.join(__dirname, 'gate-check.js');
const es = require('./engine-scope.js');
const fail = (m) => { console.log('gate-selftest FAIL: ' + m); process.exit(1); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-selftest-'));
let n = 0;

// a score line; `cr` is the "first card right" number (differs from the split number on purpose)
const line = (R, F, W, N, K, cr) => `first card right: ${cr === undefined ? R + 3 : cr} of ${F + 4} that fit; wrong card ${W} (a); no card where one fits ${N} (b); card on a not-a-fit prompt ${K} (c); fit agreement 12 of 29; score 5; split: right feature first ${R} of ${F}, rightly none 3 (x)`;
const sum = (tag, R, F, W, N, K) => `${tag} feature ${R} of ${F}, wrong ${W}, no card ${N}, not-a-fit ${K}`;
function doc(o) {
  const b = o.b || [17, 29, 2, 8, 0], a = o.a;
  const L = ['BASE-SHA: ' + (o.sha || 'ae60341'), 'BEFORE-LINE: ' + line(...b), o.beforeSum || sum('BEFORE:', ...b)];
  if (!o.noPred) { if (!o.pmLate) L.push('PREDICTION-PM: x'); L.push('PREDICTION-LEAD: y'); }
  if (o.outcome && !a) L.push('OUTCOME: ' + o.outcome);
  if (o.reason) L.push('REASON: ' + o.reason);
  if (a) {
    L.push('AFTER-LINE: ' + line(...a), o.afterSum || sum('AFTER:', ...a));
    if (o.pmLate) L.push('PREDICTION-PM: x');
    L.push('OUTCOME: ' + o.outcome, 'REASON: ' + o.reason);
    if (o.pred) L.push('PREDICTION: ' + o.pred);
  }
  return L.join('\n') + '\n';
}
function run(stage, o, git) {
  const f = path.join(dir, 'ev' + (n++) + '.md');
  fs.writeFileSync(f, doc(o));
  const r = spawnSync('node', [gc, f, '--stage', stage].concat(git ? [] : ['--no-git']), { encoding: 'utf8' });
  return git ? r : r.status === 0;
}
const ok = (name, stage, o) => { if (!run(stage, o)) fail(name + ' should pass'); };
const bad = (name, stage, o) => { if (run(stage, o)) fail(name + ' should fail'); };

ok('before', 'before', {});
bad('before N0=5 no outcome', 'before', { b: [17, 29, 2, 5, 0] });
ok('before N0=5 inconclusive', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
bad('before N0=5 wrong reason', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'none' });
ok('final N0=5 inconclusive', 'final', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
bad('final N0=5 with after', 'final', { b: [17, 29, 2, 5, 0], a: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });

const B = [17, 29, 2, 8, 0];
ok('kept', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held' });
bad('kept pred did not hold', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'did not hold' });
ok('reverted N', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'reverted', reason: 'no-card fall < 2 (8 to 7)', pred: 'did not hold' });
bad('kept when N fell 1', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'kept', reason: 'none', pred: 'held' });
ok('reverted W', 'final', { b: B, a: [20, 29, 3, 5, 0], outcome: 'reverted', reason: 'wrong card rose (2 to 3)', pred: 'did not hold' });
ok('reverted K', 'final', { b: B, a: [20, 29, 2, 5, 1], outcome: 'reverted', reason: 'not-a-fit card rose (0 to 1)', pred: 'did not hold' });
const all = [20, 29, 3, 8, 1], r1 = 'no-card fall < 2 (8 to 8)', r2 = 'wrong card rose (2 to 3)', r3 = 'not-a-fit card rose (0 to 1)';
ok('all three', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r2, r3].join(' and '), pred: 'did not hold' });
bad('middle missing', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r3].join(' and '), pred: 'did not hold' });
bad('first two swapped', 'final', { b: B, a: all, outcome: 'reverted', reason: [r2, r1, r3].join(' and '), pred: 'did not hold' });
bad('PM after AFTER-LINE', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held', pmLate: true });
bad('summary disagrees', 'final', { b: B, a: [20, 29, 2, 6, 0], afterSum: sum('AFTER:', 21, 29, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
bad('summary from first card right', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], afterSum: sum('AFTER:', 24, 33, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
ok('summary from split with differing first-card number', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], outcome: 'kept', reason: 'none', pred: 'held' });

// git mode: engine/fit.js at BASE must be compared with HEAD (was a doubled path, always 'same')
const gr = run('before', { sha: '23757a5' }, true);
if (!/differs from BASE/.test(gr.stdout)) fail('git mode: BASE with a different engine/fit.js should report that it differs; got: ' + gr.stdout.trim());

// engine-scope
const base = fs.readFileSync(path.join(root, 'engine/fit.js'), 'utf8').replace(/\r\n/g, '\n');
const crlf = (s) => s.replace(/\n/g, '\r\n');
const once = (s, a, b) => { const i = s.indexOf(a); if (i < 0) fail('anchor missing: ' + a); return s.slice(0, i) + b + s.slice(i + a.length); };
const opsAt = base.indexOf('    READ: /') + 11;
const gateAt = base.indexOf('    let fit;\n') + 14;
const inOps = base.slice(0, opsAt) + '  ' + base.slice(opsAt);              // a changed char inside OPS
const inGate = base.slice(0, gateAt) + ' ' + base.slice(gateAt);              // a changed char inside the gate block
const step = /STEP/.test(base) ? once(base, 'STEP', 'STEq') : fail('no STEP label in engine');
const expect = (name, got, empty) => { if (!!got.length === empty) fail('engine-scope ' + name + (empty ? ' should be empty: ' + got.join('; ') : ' should fail')); };
expect('same', es.check(base, base), true);
expect('ops change', es.check(base, inOps), true);
expect('gate change', es.check(base, inGate), true);
expect('STEP change', es.check(base, step), false);
const km = base.match(/^\s{4}([A-Z]+):/m)[1];
expect('deleted key', es.check(base, once(base, '    ' + km + ':', '    ' + km.toLowerCase() + 'x:')), false);
expect('Date in OPS', es.check(base, base.slice(0, opsAt) + '/*Date.now()*/' + base.slice(opsAt)), false);
expect('crlf vs lf', es.check(crlf(base), base), true);
const mixed = (s) => s.split('\n').map((l, i, all) => i % 2 && i < all.length - 1 ? l + '\r' : l).join('\n');
expect('lf vs mixed ops change', es.check(base, mixed(inOps)), true);
expect('mixed STEP', es.check(base, mixed(step)), false);
// engine-scope strict mode (--ops-only)
const ST = { opsOnly: true };
const stc = (t) => { try { return es.check(base, t, ST); } catch (e) { return ['threw: ' + e.message]; } };
const gate13 = base.indexOf('    let fit;\n') + 13;
const gateEdit = base.slice(0, gate13) + ' ' + base.slice(gate13);
const readAt = base.indexOf('    READ: /');
const valEdit = base.slice(0, readAt + 11) + '(?:)' + base.slice(readAt + 11);
const eol = base.indexOf('\n', readAt);
expect('strict same', stc(base), true);
expect('strict value change', stc(valEdit), true);
expect('strict gate edit', stc(gateEdit), false);
expect('non-strict gate edit passes', es.check(base, gateEdit), true);
expect('strict added key line', stc(base.slice(0, readAt) + '    newkey: /zzqx/,\n' + base.slice(readAt)), false);
expect('strict added lowercase key line', stc(base.slice(0, readAt) + '    lowerkey: /zzqx/,\n' + base.slice(readAt)), false);
expect('strict renamed key', stc(once(base, '    READ:', '    READX:')), false);
expect('strict deleted line', stc(base.slice(0, readAt) + base.slice(eol + 1)), false);
expect('strict STEP change', stc(step), false);
const lineEnd = base.slice(readAt, eol).endsWith(',') ? eol : fail('first OPS line does not end with a comma');
expect('strict key on existing line', stc(base.slice(0, lineEnd) + ' newkey: /zzqx/,' + base.slice(lineEnd)), false);
expect('strict duplicate key on existing line', stc(base.slice(0, lineEnd) + ' READ: /zzqx/,' + base.slice(lineEnd)), false);
expect('strict ", x: /" inside a regex value', stc(once(base, '    READ: /', '    READ: /a|, x: \\/|')), true);
const l1 = base.indexOf('\n', readAt) + 1, l2 = base.indexOf('\n', l1) + 1, l3 = base.indexOf('\n', l2) + 1;
expect('strict reordered properties', stc(base.slice(0, l1) + base.slice(l2, l3) + base.slice(l1, l2) + base.slice(l3)), false);
{
  const fb = path.join(dir, 'base.js'), fn = path.join(dir, 'gate.js');
  fs.writeFileSync(fb, base); fs.writeFileSync(fn, gateEdit);
  const esCli = path.join(__dirname, 'engine-scope.js');
  const r = spawnSync('node', [esCli, '--files', fb, fn, '--ops-only'], { encoding: 'utf8' });
  if (r.status !== 1 || !/engine-scope FAIL/.test(r.stdout)) fail('CLI --ops-only should exit 1 with engine-scope FAIL; got ' + r.status + ' ' + r.stdout);
  const r2 = spawnSync('node', [esCli, '--files', fb, fn], { encoding: 'utf8' });
  if (r2.status !== 0) fail('CLI without the flag should exit 0');
}

// gitCheck with a scripted runner
let gg = null;
try { gg = require('./gate-git.js'); } catch (e) { /* reported by each case */ }
function gcase(name, outcome, st, wantEmpty) {
  // st: { diff, tune3, plain, scope } statuses
  const calls = [];
  const run = (cmd, args) => {
    calls.push([cmd, args]);
    if (cmd === 'git') return st.diff;
    if (args.includes('--allow')) return st.tune3;
    if (args.some((x) => /engine-scope/.test(x))) return st.scope;
    return st.plain;
  };
  let got;
  try { got = gg.gitCheck('fb26061', outcome, run); } catch (e) { got = ['threw: ' + e.message]; }
  if ((got.length === 0) !== wantEmpty) fail('gitCheck ' + name + (wantEmpty ? ' should be empty: ' : ' should report a problem; got ') + got.join('; '));
  return calls;
}
const cj = gcase('kept ok', 'kept', { diff: 1, tune3: 0, plain: 1, scope: 0 }, true);
gcase('kept but same', 'kept', { diff: 0, tune3: 0, plain: 1, scope: 0 }, false);
gcase('kept scope fails', 'kept', { diff: 1, tune3: 0, plain: 1, scope: 1 }, false);
gcase('kept tune3 fails', 'kept', { diff: 1, tune3: 1, plain: 1, scope: 0 }, false);
gcase('reverted differs', 'reverted', { diff: 1, tune3: 0, plain: 0, scope: 0 }, false);
gcase('reverted same', 'reverted', { diff: 0, tune3: 1, plain: 0, scope: 1 }, true);
const gd = cj.find((c) => c[0] === 'git');
if (!gd || !gd[1].includes(':(top)fit-finder/engine/fit.js') || !gd[1].includes(':(top)fit-finder/data/catalogue.json')) fail('gitCheck git diff should name engine/fit.js and data/catalogue.json');
console.log('gate-selftest ok');
