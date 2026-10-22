/* node tools/agree.js <frozen> <final>   see tools/README.md */
const fs = require('fs');
const [ff, nf] = process.argv.slice(2);
const die = (m) => { console.log('agree FAIL: ' + m); process.exit(1); };
if (!ff || !nf) die('usage: agree.js <frozen> <final>');
const load = (f) => {
  const m = new Map();
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((x) => x.trim())) {
    const r = JSON.parse(l);
    if (m.has(r.id)) die('repeated id ' + r.id + ' in ' + f);
    m.set(r.id, r);
  }
  return m;
};
const A = load(ff), B = load(nf);
const bad = [];
for (const id of A.keys()) if (!B.has(id)) bad.push('id ' + id + ' missing from final');
for (const id of B.keys()) if (!A.has(id)) bad.push('id ' + id + ' not in frozen');
const key = (r) => r.fit + '|' + [...(r.cards || [])].sort().join(',');
let D = 0;
for (const [id, r] of A) {
  const n = B.get(id);
  if (!n) continue;
  const differs = key(r) !== key(n);
  if (differs) D++;
  if (differs && n.by !== 'ian') bad.push('changed row ' + id + ' lacks by:ian');
  if (!differs && n.by === 'ian') bad.push('unchanged row ' + id + ' has by:ian');
}
const N = A.size;
const ok = N > 0 && (N - D) / N >= 0.845;
console.log('N ' + N + ' D ' + D + ' agreement ' + (N ? ((N - D) / N * 100).toFixed(1) : '0.0') + '% ' + (ok && !bad.length ? 'PASS' : 'FAIL'));
if (bad.length) console.log('agree problems: ' + bad.slice(0, 10).join(' | '));
process.exit(bad.length || !ok ? 1 : 0);
