/* node tests/match-frozen.js --base <sha>
   Exit 0 only if engine/fit.js and every catalogue card's id, area, ops and match (in order) are identical to <sha>.
   These are everything match() reads from the catalogue. Other fields may differ. */
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const i = process.argv.indexOf('--base');
const base = i >= 0 ? process.argv[i + 1] : '';
const bad = [];
if (!base) bad.push('no --base given');
else {
  const git = (a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
  const d = git(['diff', '--quiet', base, '--', ':(top)fit-finder/engine/fit.js']);
  if (d.status !== 0) bad.push('engine/fit.js differs from ' + base + ' (git diff exit ' + d.status + ')');
  const g = git(['show', base + ':fit-finder/data/catalogue.json']);
  if (g.status !== 0) bad.push('cannot read the catalogue at ' + base);
  else {
    const m = (c) => JSON.stringify(c.useCases.map((u) => [u.id, u.area, u.ops, u.match]));
    const now = JSON.parse(fs.readFileSync(path.join(root, 'data/catalogue.json'), 'utf8'));
    if (m(JSON.parse(g.stdout)) !== m(now)) bad.push('catalogue id/area/ops/match differs from ' + base);
  }
}
console.log(bad.length ? 'match-frozen FAIL: ' + bad.join(' | ') : 'match-frozen PASS');
process.exit(bad.length ? 1 : 0);
