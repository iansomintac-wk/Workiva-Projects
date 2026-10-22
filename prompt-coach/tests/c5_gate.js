/* C5 gate: runs the README test commands and compares them with the measured base.
   node tests/c5_gate.js      prints "GATE <name> PASS|FAIL <detail>" per command; exits 1 if any FAIL, else 0.
   eval.js and simulate.js always exit 0, so they are read from their printed lines.
   simulate: every category count must be at or below tests/fixtures/c5_base.json (counts there may only stay or drop).
   pagetest.js signals failure by exit 1 (any failed check, or a thrown error), with "FAIL <check>" lines and a
   last line "pagetest: N checks, M failed"; it reads dist/prompt-coach.html, so run node tests/build.js first. */
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/c5_base.json'), 'utf8'));
const CATS = ['strongNotStrong', 'betterWeak', 'toggleNoEffect', 'dupSentence', 'badText', 'emptyFrag'];

const run = (args) => {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const lastLine = (s) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop() || '';

// TAP judge: fails when "# fail" is missing or nonzero, or "# pass" is 0.
const judgeTap = (out) => {
  const p = out.match(/^# pass (\d+)/m), f = out.match(/^# fail (\d+)/m);
  return [!!f && f[1] === '0' && !!p && p[1] !== '0', `pass ${p ? p[1] : '?'} fail ${f ? f[1] : '?'}`];
};

const gates = [
  ['eval', ['tests/eval.js', 'rulefeat', 'data/test.jsonl'], (r) => {
    const m = r.out.match(/GRADE acc=([0-9.]+)/);
    const acc = m ? parseFloat(m[1]) : NaN;
    return [acc >= 0.856, m ? m[0] : 'no GRADE line'];
  }],
  ['simulate', ['tests/simulate.js', 'data/train_fr.jsonl', 'data/train_grc.jsonl', 'data/train_hard.jsonl', 'data/train_sus.jsonl'], (r) => {
    const got = {}, bad = [];
    for (const k of CATS) {
      const m = r.out.match(new RegExp('^' + k + '\\s+(\\d+)', 'm'));
      got[k] = m ? +m[1] : null;
      if (got[k] === null || !(k in BASE) || got[k] > BASE[k]) bad.push(k);
    }
    return [bad.length === 0, CATS.map((k) => `${k}=${got[k]}/${BASE[k]}`).join(' ') + (bad.length ? ' over: ' + bad.join(',') : '')];
  }],
  ['customer_check', ['tests/customer_check.js'], (r) => [lastLine(r.out).startsWith('PASS'), lastLine(r.out)]],
  ['rewrite_unit', ['--test', '--test-reporter=tap', 'tests/rewrite_unit.test.js'], (r) => judgeTap(r.out)],
  ['pagetest', ['tests/pagetest.js'], (r) => [r.code === 0, `exit ${r.code}; ${lastLine(r.out)}`]],
];

if (require.main === module) {
  let failed = 0;
  for (const [name, args, judge] of gates) {
    let ok, detail;
    try { [ok, detail] = judge(run(args)); } catch (e) { ok = false; detail = 'ERROR ' + e.message; }
    if (!ok) failed++;
    console.log(`GATE ${name} ${ok ? 'PASS' : 'FAIL'} ${detail}`);
  }
  process.exit(failed ? 1 : 0);
}
module.exports = { judgeTap, gates };
