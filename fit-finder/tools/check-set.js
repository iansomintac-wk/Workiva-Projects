/* node tools/check-set.js <prompts> <gold|-> <catalogue> [--not-range LO HI]   see tools/README.md */
const fs = require('fs');
const a = process.argv.slice(2);
const ri = a.indexOf('--not-range');
const range = ri >= 0 ? [Number(a[ri + 1]), Number(a[ri + 2])] : null;
if (ri >= 0) a.splice(ri, 3);
const [pf, gf, cf] = a;
const bad = [];
const fail = (m) => { console.log('check-set FAIL: ' + m); process.exit(1); };
if (!pf || !gf || !cf) fail('usage: check-set.js <prompts> <gold|-> <catalogue> [--not-range LO HI]');
const rows = (f) => fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l, i) => {
  try { return JSON.parse(l); } catch (e) { fail(f + ' line ' + (i + 1) + ' is not JSON'); }
});
if (range && !(range[0] <= range[1])) fail('bad --not-range');
let P, cat;
try { P = rows(pf); cat = JSON.parse(fs.readFileSync(cf, 'utf8')); } catch (e) { fail(e.message); }
const cards = new Set(cat.useCases.map((u) => u.id));
const AREAS = ['FR', 'GRC', 'SUS', 'GEN'], per = { FR: 0, GRC: 0, SUS: 0, GEN: 0 };
if (!P.length) bad.push('0 rows');
const ids = new Set();
for (const r of P) {
  if (typeof r.id !== 'string' || typeof r.task !== 'string') { bad.push('row lacks string id/task'); continue; }
  if (ids.has(r.id)) bad.push('repeated id ' + r.id);
  ids.add(r.id);
  if (!AREAS.includes(r.area)) bad.push('bad area on ' + r.id); else per[r.area]++;
}
let M = 0, K = 0, U = 0;
if (gf !== '-') {
  const G = rows(gf), gids = new Set();
  M = G.length;
  for (const g of G) {
    if (gids.has(g.id)) bad.push('repeated gold id ' + g.id);
    gids.add(g.id);
    if (!ids.has(g.id)) bad.push('extra gold id ' + g.id);
    if (!['good', 'partial', 'not'].includes(g.fit)) bad.push('bad fit on ' + g.id);
    if (!Array.isArray(g.cards)) { bad.push('cards not an array on ' + g.id); continue; }
    if (g.fit === 'not') { K++; if (g.cards.length) bad.push('not row with cards ' + g.id); }
    for (const c of g.cards) if (!cards.has(c)) { U++; bad.push('unknown card ' + c + ' on ' + g.id); }
  }
  for (const id of ids) if (!gids.has(id)) bad.push('missing gold id ' + id);
  if (range && (K < range[0] || K > range[1])) bad.push('not count ' + K + ' outside ' + range[0] + '..' + range[1]);
}
console.log('rows ' + P.length + ', per area FR ' + per.FR + ' GRC ' + per.GRC + ' SUS ' + per.SUS + ' GEN ' + per.GEN + ', gold ' + M + ', not ' + K + ', unknown cards ' + U);
if (bad.length) { console.log('check-set FAIL: ' + [...new Set(bad)].slice(0, 20).join(' | ')); process.exit(1); }
