/* gitCheck(sha, outcome, run): the git state of engine/fit.js and data/catalogue.json against BASE, for gate-check.js.
   run(cmd, args) returns an exit status. Returns a list of problems (empty = ok). */
const path = require('path');
const root = path.join(__dirname, '..');
function gitCheck(sha, outcome, run) {
  const bad = [];
  const mf = path.join(root, 'tests/match-frozen.js'), es = path.join(root, 'tools/engine-scope.js');
  const same = run('git', ['diff', '--quiet', sha, 'HEAD', '--', ':(top)fit-finder/engine/fit.js', ':(top)fit-finder/data/catalogue.json']) === 0;
  if (outcome === 'kept') {
    if (same) bad.push('kept but engine/fit.js and data/catalogue.json equal BASE');
    if (run('node', [mf, '--base', sha, '--allow', 'tune3']) !== 0) bad.push('match-frozen --allow tune3 fails');
    if (run('node', [mf, '--base', sha]) === 0) bad.push('match-frozen passes without --allow tune3');
    if (run('node', [es, '--git', sha, '--ops-only']) !== 0) bad.push('engine-scope --ops-only fails');
  } else {
    if (!same) bad.push('engine/fit.js or data/catalogue.json differs from BASE but outcome is ' + outcome);
    if (run('node', [mf, '--base', sha]) !== 0) bad.push('match-frozen --base fails');
  }
  return bad;
}
module.exports = { gitCheck };
