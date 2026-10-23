/* node tools/engine-scope.js --git <sha> | --files <baseFile> <newFile>
   Only the OPS patterns and the rate() gate lines (from `let fit;` to `return { fit,`) of engine/fit.js may change. */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const norm = (s) => s.replace(/\r\n/g, '\n');
const REGIONS = [
  ['OPS', '  const OPS = {\n', '\n  };\n  const AI_OPS'],
  ['gate', '    let fit;\n', '\n    return { fit,'],
];
function split(text) {
  const regions = {};
  let masked = text;
  for (const [name, a, b] of REGIONS) {
    const i = masked.indexOf(a), j = i < 0 ? -1 : masked.indexOf(b, i + a.length);
    if (i < 0 || j < 0) return { missing: name, masked, regions };
    regions[name] = masked.slice(i + a.length, j);
    masked = masked.slice(0, i + a.length) + '<<' + name + '>>' + masked.slice(j);
  }
  return { masked, regions };
}
function check(baseText, newText) {
  const base = norm(baseText), now = norm(newText), bad = [];
  const b = split(base), n = split(now);
  if (b.missing) bad.push('base lacks the ' + b.missing + ' region');
  if (n.missing) bad.push('new text lacks the ' + n.missing + ' region');
  if (bad.length) return bad;
  if (b.masked !== n.masked) bad.push('engine changed outside the OPS block and the gate block');
  const keys = (r) => (r.match(/^\s{4}([A-Z]+):/gm) || []).map((x) => x.trim()).join(',');
  if (keys(b.regions.OPS) !== keys(n.regions.OPS)) bad.push('OPS keys differ');
  const left = new Map();
  for (const l of base.split('\n')) left.set(l, (left.get(l) || 0) + 1);
  const added = [];
  for (const l of now.split('\n')) {
    if (left.get(l) > 0) left.set(l, left.get(l) - 1); else added.push(l);
  }
  const banned = /Date|performance|location|http|fetch|require\(|process/;
  for (const l of added) if (banned.test(l)) bad.push('added line has a banned word: ' + l.trim().slice(0, 60));
  return bad;
}
module.exports = { check };
if (require.main === module) {
  const a = process.argv.slice(2), root = path.join(__dirname, '..');
  let base, now;
  if (a[0] === '--git' && a[1]) {
    const g = spawnSync('git', ['show', a[1] + ':fit-finder/engine/fit.js'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
    if (g.status !== 0) { console.log('engine-scope FAIL: cannot read engine at ' + a[1]); process.exit(1); }
    base = g.stdout;
    now = fs.readFileSync(path.join(root, 'engine/fit.js'), 'utf8');
  } else if (a[0] === '--files' && a[2]) {
    base = fs.readFileSync(a[1], 'utf8');
    now = fs.readFileSync(a[2], 'utf8');
  } else { console.log('usage: engine-scope.js --git <sha> | --files <base> <new>'); process.exit(2); }
  const bad = check(base, now);
  console.log(bad.length ? 'engine-scope FAIL: ' + bad.join(' | ') : 'engine-scope ok');
  process.exit(bad.length ? 1 : 0);
}
