/* node research/2026-10-20-quote-line-dump-compare.js before.jsonl after.jsonl
   Row counts must be equal and src must match row by row. Grade is compared on every row. Only headline and weak.verdict may change,
   and only on a row weak in both dumps that has a quote after; a quoted row must have changed. Exit 1 otherwise. */
const fs = require('fs');
const rd = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const a = rd(process.argv[2]), b = rd(process.argv[3]);
let changed = 0, quoted = 0, bad = 0;
if (a.length !== b.length) { bad++; console.log(`BAD row count before ${a.length} after ${b.length}`); }
const Q = /The coach read your ask as "/;
const get = (o, k) => k === 'headline' ? o.headline : o.stages[k.split('.')[0]][k.split('.')[1]];
const KEYS = ['headline', ...['weak', 'better', 'strong'].flatMap((s) => ['prompt', 'verdict'].map((f) => s + '.' + f))];
for (let i = 0; i < Math.min(a.length, b.length); i++) {
  const x = a[i], y = b[i];
  const q = Q.test(y.stages.weak.verdict) && Q.test(y.headline);
  const diff = KEYS.filter((k) => get(x, k) !== get(y, k));
  const only = diff.length === 2 && diff.includes('headline') && diff.includes('weak.verdict') && x.grade === 'weak' && y.grade === 'weak';
  if (diff.length) changed++; if (q) quoted++;
  const why = [];
  if (x.src !== y.src) why.push('src');
  if (x.grade !== y.grade) why.push('grade');
  if ((diff.length > 0) !== q) why.push('changed!=quoted');
  if (diff.length && !only) why.push('not weak-only');
  if (why.length) { bad++; console.log('BAD', y.src, why.join('+'), diff.join(',')); }
}
console.log(`rows ${b.length} changed ${changed} quoted ${quoted} bad ${bad}`);
process.exitCode = bad || changed !== quoted ? 1 : 0;
