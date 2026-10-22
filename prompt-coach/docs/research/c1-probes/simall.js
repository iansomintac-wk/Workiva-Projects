// All-files simulate check (c5_gate.js simulates only the four original train files).
// usage: node simall.js <prompt-coach dir> --save <file> | --check <file>
const { spawnSync } = require('child_process'); const fs = require('fs'), path = require('path');
const [R, mode, file] = process.argv.slice(2);
const CATS = ['strongNotStrong', 'betterWeak', 'toggleNoEffect', 'dupSentence', 'badText', 'emptyFrag'];
const files = fs.readdirSync(path.join(R, 'data')).filter((f) => /^train_.*\.jsonl$/.test(f)).sort().map((f) => 'data/' + f);
const r = spawnSync(process.execPath, ['tests/simulate.js', ...files], { cwd: R, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const out = (r.stdout || '') + (r.stderr || '');
const got = {};
for (const k of CATS) { const m = out.match(new RegExp('^' + k + '\\s+(\\d+)', 'm')); got[k] = m ? +m[1] : null; }
if (mode === '--save') { fs.writeFileSync(file, JSON.stringify({ files: files.length, ...got })); console.log('SIMALL saved files=' + files.length, JSON.stringify(got)); }
else {
  const b = JSON.parse(fs.readFileSync(file, 'utf8'));
  const bad = CATS.filter((k) => got[k] === null || got[k] > b[k]);
  console.log('SIMALL ' + (bad.length ? 'FAIL over: ' + bad.join(',') : 'PASS'), 'files=' + files.length, JSON.stringify(got));
  process.exit(bad.length ? 1 : 0);
}
