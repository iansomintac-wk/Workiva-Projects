/* node tools/diag-selftest.js   self-test of diag-nocard.js. Prints `diag-selftest ok` or the first failure. */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const fail = (m) => { console.log('diag-selftest FAIL: ' + m); process.exit(1); };
const ledger = process.env.FF_LEDGER;
if (!ledger) fail('FF_LEDGER not set');
const m = /^K=(\d+)\s*$/.exec(fs.readFileSync(path.join(ledger, 'base-k.txt'), 'utf8'));
if (!m) fail('bad base-k.txt');
const K0 = Number(m[1]);
const ff = path.join(__dirname, '..');
const run = (...a) => spawnSync('node', ['tools/diag-nocard.js', ...a], { cwd: ff, encoding: 'utf8' });
const { judge } = require('./diag-nocard.js');

let r = run();
if (r.status !== 0) fail('(a) real engine exit ' + r.status);
const want = `diag no-card 25 (tune 8, halfA 17); tune wrong 4; tune not-a-fit ${K0}\n`;
if (r.stdout !== want) fail('(a) stdout ' + JSON.stringify(r.stdout));

r = run('--engine', 'tools/fixtures/diag-engine-wrong.js');
if (r.status !== 1 || !r.stdout.includes('INVALID')) fail('(b) wrong engine: exit ' + r.status + ' ' + r.stdout);

r = run('--engine', 'tools/fixtures/diag-engine-none.js');
const n = /^diag no-card (\d+) /.exec(r.stdout);
if (r.status !== 0 || r.stdout.includes('INVALID') || !n || Number(n[1]) <= 25) fail('(c) none engine: exit ' + r.status + ' ' + r.stdout);

const j = (o) => judge(o);
if (!j({ T: 8, A: 17, W: 5, K: K0, wrongA: 0 }).length) fail('(d) W 5 accepted');
if (!j({ T: 8, A: 17, W: 4, K: K0 + 1, wrongA: 0 }).length) fail('(d) K+1 accepted');
if (!j({ T: 8, A: 17, W: 4, K: K0, wrongA: 1 }).length) fail('(d) wrongA 1 accepted');
if (j({ T: 8, A: 17, W: 4, K: K0, wrongA: 0 }).length) fail('(d) baseline rejected');
console.log('diag-selftest ok');
