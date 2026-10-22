// node perm.js <copy> : train W (no tune) for each order of the 4 train files; report diff vs shipped dfe2c65 weights
const fs = require('fs'), cp = require('child_process'), T = 'C:/Users/teasp/.claude/jobs/73f0cb40/tmp/';
const copy = process.argv[2], dir = T + 'c/' + copy;
const ship = JSON.parse(fs.readFileSync(T + 'w/dfe2c65.json'));
const K = ['S', 'C', 'O', 'P', 'E'];
const files = ['fr', 'grc', 'hard', 'sus'];
const perms = (a) => a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
for (const p of perms(files)) {
  const out = `${T}out/perm-${copy}-${p.join('-')}.json`;
  cp.execFileSync('node', ['tests/train.js', 'rulefeat', '--out', out, ...p.map((f) => `data/train_${f}.jsonl`)], { cwd: dir });
  const w = JSON.parse(fs.readFileSync(out));
  let n = 0, max = 0;
  for (const k of K) {
    for (const i of new Set([...Object.keys(w.w[k].v), ...Object.keys(ship.w[k].v)])) { const d = Math.abs((w.w[k].v[i] || 0) - (ship.w[k].v[i] || 0)); if (d) n++; max = Math.max(max, d); }
    const db = Math.abs(w.w[k].b - ship.w[k].b); if (db) n++; max = Math.max(max, db);
  }
  console.log(p.join(','), 'diff', n, 'max', max.toFixed(3));
}
