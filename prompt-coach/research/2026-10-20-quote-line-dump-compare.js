/* node research/2026-10-20-quote-line-dump-compare.js before.jsonl after.jsonl : changed rows must equal quoted rows; only headline and stages.weak.verdict may change, and only on a weak row. */
const fs = require('fs');
const rd = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const a = rd(process.argv[2]), b = rd(process.argv[3]);
let changed = 0, quoted = 0, bad = 0;
b.forEach((y, i) => {
  const x = a[i], q = /The coach read your ask as "/.test(y.stages.weak.verdict) && /The coach read your ask as "/.test(y.headline);
  const diff = ['headline', ...['weak', 'better', 'strong'].flatMap((s) => ['prompt', 'verdict'].map((f) => s + '.' + f))].filter((k) => { const get = (o) => k === 'headline' ? o.headline : o.stages[k.split('.')[0]][k.split('.')[1]]; return get(x) !== get(y); });
  const only = diff.length === 2 && diff.includes('headline') && diff.includes('weak.verdict') && x.grade === 'weak';
  if (diff.length) changed++; if (q) quoted++;
  if (x.src !== y.src || (diff.length > 0) !== q || (diff.length && !only)) { bad++; console.log('BAD', y.src, diff.join(',')); }
});
console.log(`rows ${b.length} changed ${changed} quoted ${quoted} bad ${bad}`);
process.exitCode = bad || changed !== quoted ? 1 : 0;
