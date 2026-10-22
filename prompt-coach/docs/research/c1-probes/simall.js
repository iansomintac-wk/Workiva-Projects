// All-files simulate check (c5_gate.js simulates only the four original train files).
// usage: node simall.js <prompt-coach dir> --save <file> | --check <file>
const { spawnSync } = require('child_process'); const fs = require('fs'), path = require('path');
const [R, mode, file] = process.argv.slice(2);
const CATS = ['strongNotStrong', 'betterWeak', 'toggleNoEffect', 'dupSentence', 'badText', 'emptyFrag'];
const files = fs.readdirSync(path.join(R, 'data')).filter((f) => /^train_.*\.jsonl$/.test(f)).sort().map((f) => 'data/' + f);
const r = spawnSync(process.execPath, ['tests/simulate.js', ...files], { cwd: R, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (r.error || r.status !== 0) { console.log('SIMALL FAIL child simulate failed status=' + r.status); process.exit(1); }
const out = (r.stdout || '') + (r.stderr || '');
const got = {};
for (const k of CATS) { const m = out.match(new RegExp('^' + k + '\\s+(\\d+)', 'm')); got[k] = m ? +m[1] : null; }
if (mode === '--save') {
  if (CATS.some((k) => got[k] === null)) { console.log('SIMALL refuse to save: missing counts'); process.exit(1); }
  fs.writeFileSync(file, JSON.stringify({ files: files.length, ...got })); console.log('SIMALL saved files=' + files.length, JSON.stringify(got)); }
else {
  const b = JSON.parse(fs.readFileSync(file, 'utf8'));
  const num = (v) => typeof v === 'number' && Number.isFinite(v);
  const bad = CATS.filter((k) => !num(got[k]) || !num(b[k]) || got[k] > b[k]);
  console.log('SIMALL ' + (bad.length ? 'FAIL over: ' + bad.join(',') : 'PASS'), 'files=' + files.length, JSON.stringify(got));
  process.exit(bad.length ? 1 : 0);
}
