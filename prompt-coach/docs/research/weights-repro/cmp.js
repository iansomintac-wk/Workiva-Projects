// node cmp.js <copy-name>... : compare out/<n>.1 vs .2 and vs shipped (w/dfe2c65.json)
const fs = require('fs'), T = 'C:/Users/teasp/.claude/jobs/73f0cb40/tmp/';
const M = require(T + 'c/head/engine/model.js');
const ship = JSON.parse(fs.readFileSync(T + 'w/dfe2c65.json'));
const K = ['S', 'C', 'O', 'P', 'E'];
const hdoc = String(M.hash('rt:S:the-document') % M.DIM);
function diff(a, b) {
  let n = 0, max = 0, keys = 0;
  for (const k of K) {
    const ks = new Set([...Object.keys(a.w[k].v), ...Object.keys(b.w[k].v)]); keys += ks.size;
    for (const i of ks) { const d = Math.abs((a.w[k].v[i] || 0) - (b.w[k].v[i] || 0)); if (d > 0) n++; if (d > max) max = d; }
    const db = Math.abs(a.w[k].b - b.w[k].b); if (db > 0) n++; if (db > max) max = db;
  }
  return `diff entries ${n}/${keys} max ${max.toFixed(3)}`;
}
console.log('hash rt:S:the-document ->', hdoc, 'shipped S has it:', hdoc in ship.w.S.v);
for (const n of process.argv.slice(2)) {
  const [a, b] = [1, 2].map((r) => JSON.parse(fs.readFileSync(`${T}out/${n}.${r}.json`)));
  const same = JSON.stringify(a) === JSON.stringify(b);
  console.log(`${n}: run1==run2 ${same} | thr ${JSON.stringify(a.thr)} | vs shipped: ${diff(a, ship)} | the-document ${a.w.S.v[hdoc] ?? 'absent'}`);
}
