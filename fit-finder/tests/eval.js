/* Score the fit engine against labels. node tests/eval.js tasks.jsonl gold.jsonl [--ids A|B] [--show N]
   tasks: {"id","task"}; gold: {"id","fit","repeats","ops","blockers"}. --ids splits by a seeded shuffle. */
const fs = require('fs'), path = require('path');
const F = require('../engine/fit.js');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a.splice(i, 2)[1] : d; };
const half = opt('--ids', null), show = +opt('--show', 0);
const load = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map(JSON.parse);
const tasks = load(a[0]), gold = Object.fromEntries(load(a[1]).map((g) => [g.id, g]));
let ids = tasks.map((t) => t.id);
if (half) {
  let s = 20261015; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const sh = [...ids]; for (let i = sh.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [sh[i], sh[j]] = [sh[j], sh[i]]; }
  const cut = Math.floor(sh.length / 2); ids = half === 'A' ? sh.slice(0, cut) : sh.slice(cut);
}
const set = new Set(ids), rows = tasks.filter((t) => set.has(t.id) && gold[t.id]);
const L = ['good', 'partial', 'not'], conf = {}; let ok = 0, rep = 0, far = 0; const misses = [];
for (const r of rows) {
  const p = F.rate(r.task), g = gold[r.id];
  conf[g.fit + '>' + p.fit] = (conf[g.fit + '>' + p.fit] || 0) + 1;
  if (p.fit === g.fit) ok++; else misses.push([g.fit, p.fit, r.task, p.ops.join(','), (g.ops || []).join(',')]);
  if ((g.fit === 'good' && p.fit === 'not') || (g.fit === 'not' && p.fit === 'good')) far++;
  if (p.repeats === g.repeats) rep++;
}
console.log(`fit agreement ${ok}/${rows.length} = ${(100 * ok / rows.length).toFixed(1)}%  good<->not mix-ups ${far}  repeats ${(100 * rep / rows.length).toFixed(0)}%`);
console.log('gold>pred', JSON.stringify(conf));
for (const m of misses.slice(0, show)) console.log(`  ${m[0]}->${m[1]} | ${m[2].slice(0, 110)} | eng:${m[3]} | gold:${m[4]}`);
