/* node tools/ops-check.js <base sha>   see tools/README.md */
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const FF = path.join(__dirname, '..');

function compare(oldCat, newCat, aiOps) {
  const o = oldCat.useCases, n = newCat.useCases;
  if (o.length !== n.length) return { ok: false, reason: 'card count ' + o.length + ' to ' + n.length };
  let changed = 0;
  for (let i = 0; i < o.length; i++) {
    const a = o[i], b = n[i];
    if (a.id !== b.id) return { ok: false, reason: 'card order or id differs at ' + i };
    const strip = (u) => { const c = Object.assign({}, u); delete c.ops; return JSON.stringify(c, Object.keys(c).sort()); };
    if (strip(a) !== strip(b)) return { ok: false, reason: a.id + ': a field other than ops differs' };
    const ao = a.ops || [], bo = b.ops || [];
    if (bo.length < ao.length || ao.some((x, k) => bo[k] !== x)) return { ok: false, reason: a.id + ': ops do not start with the old ops' };
    if (bo.length > ao.length) {
      changed++;
      for (const x of bo.slice(ao.length)) if (!aiOps.includes(x)) return { ok: false, reason: a.id + ': ' + x + ' is not in AI_OPS' };
    }
  }
  if (!changed) return { ok: false, reason: 'no card changed' };
  return { ok: true, changed };
}

function main() {
  const fail = (m) => { console.log('ops-check FAIL: ' + m); process.exit(1); };
  const base = process.argv[2];
  if (!base) fail('usage: ops-check.js <base sha>');
  const g = spawnSync('git', ['show', base + ':fit-finder/data/catalogue.json'], { cwd: FF, encoding: 'utf8', maxBuffer: 1 << 27 });
  if (g.status !== 0) fail('cannot read the catalogue at ' + base);
  const r = compare(JSON.parse(g.stdout), JSON.parse(fs.readFileSync(path.join(FF, 'data', 'catalogue.json'), 'utf8')), require('../engine/fit.js').AI_OPS);
  if (!r.ok) fail(r.reason);
  console.log('ops-check ok ' + r.changed + ' cards changed');
}
module.exports = { compare };
if (require.main === module) main();
