// Training-only probe: of the rows labeled Context=1, how many get zero Context hits under engine/rules.js.
// usage: node ctxzero.js <prompt-coach dir> [--rows]   Prints counts and 1-based row numbers only, never text.
const fs = require('fs'), path = require('path');
const R = process.argv[2] || process.cwd(), showRows = process.argv.includes('--rows');
const M = require(path.join(R, 'engine/model.js'));
const w = JSON.parse(fs.readFileSync(path.join(R, 'engine/weights.json')));
const files = fs.readdirSync(path.join(R, 'data')).filter((f) => /^train_.*\.jsonl$/.test(f)).sort();
let oc = 0, oz = 0;
for (const f of files) {
  const rows = fs.readFileSync(path.join(R, 'data', f), 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
  let c1 = 0; const zero = [];
  rows.forEach((r, i) => {
    if (r.C !== 1) return; c1++;
    if (M.predict(r.prompt, w, { mode: w.mode }).rules.el.C.hits.length === 0) zero.push(i + 1);
  });
  console.log(`ctxzero ${f} c1=${c1} zero=${zero.length}` + (showRows ? ' rows=' + zero.join(',') : ''));
  if (f !== 'train_ctx.jsonl') { oc += c1; oz += zero.length; }
}
console.log(`ctxzero older c1=${oc} zero=${oz}`);
