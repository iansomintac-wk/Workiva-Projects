/* node tools/nearcopy.js <fresh> <real dir> [--catalogue <catalogue>]   see tools/README.md
   Never prints text: only counts and fresh ids. */
const fs = require('fs'), path = require('path');
const a = process.argv.slice(2);
const ci = a.indexOf('--catalogue');
const catf = ci >= 0 ? a[ci + 1] : null;
if (ci >= 0) a.splice(ci, 2);
const [fresh, dir] = a;
const die = (m) => { console.log('nearcopy FAIL: ' + m); process.exit(1); };
if (!fresh || !dir) die('usage: nearcopy.js <fresh> <real dir> [--catalogue <catalogue>]');
const strings = (v, out) => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
};
const words = (s) => s.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
const windows = (text) => { const w = words(text), r = []; for (let i = 0; i + 5 <= w.length; i++) r.push(w.slice(i, i + 5).join(' ')); return r; };
const jsonl = (f) => fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
let files = [];
try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')); } catch (e) { die('cannot read the real dir'); }
const real = new Set();
let R = 0, first = null;
for (const f of files) for (const row of jsonl(path.join(dir, f))) {
  R++;
  for (const s of strings(row, [])) for (const w of windows(s)) { real.add(w); if (first === null) first = w; }
}
console.log('files read ' + files.length + ', rows read ' + R + ', windows ' + real.size);
if (!files.length || !R || !real.size) die('nothing read');
// positive control: an in-memory row built from the first real window must be flagged
const control = { id: 'control', task: 'zz ' + first + ' zz' };
const flagged = (row, set) => strings(row, []).some((s) => windows(s).some((w) => set.has(w)));
if (!flagged(control, real)) { console.log('control: miss'); die('positive control missed'); }
console.log('control: hit');
const leak = new Set();
if (catf) for (const u of JSON.parse(fs.readFileSync(catf, 'utf8')).useCases) if (typeof u.try === 'string') for (const w of windows(u.try)) leak.add(w);
const hits = [];
for (const row of jsonl(fresh)) {
  const bodies = strings({ task: row.task }, []);
  const t = bodies.length ? bodies : strings(row, []);
  const probe = { t };
  if (flagged(probe, real) || (catf && flagged(probe, leak))) hits.push(row.id);
}
console.log(hits.length ? 'hits: ' + hits.join(' ') : 'hits: none');
process.exit(hits.length ? 1 : 0);
