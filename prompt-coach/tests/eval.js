/* Score a grader against labeled JSONL.
   node tests/eval.js <grader: rules|model|hybrid> <file.jsonl...> [--errors S|C|O|P|E|grade] [--n 25] */
const fs = require('fs');
const path = require('path');
const R = require('../engine/rules.js');

const args = process.argv.slice(2);
const mode = args.shift();
const errIdx = args.indexOf('--errors');
const errKey = errIdx >= 0 ? args.splice(errIdx, 2)[1] : null;
const nIdx = args.indexOf('--n');
const nShow = nIdx >= 0 ? +args.splice(nIdx, 2)[1] : 25;
const files = args;

const rows = files.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)));
const K = ['S', 'C', 'O', 'P', 'E'];

let predict;
if (mode === 'rules') predict = (p) => { const d = R.detect(p); return { on: Object.fromEntries(K.map((k) => [k, d.el[k].on])), stacked: d.stacked, d }; };
else {
  const M = require('../engine/model.js');
  const weights = JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/weights.json'), 'utf8'));
  predict = (p) => { const r = M.predict(p, weights, { mode }); return { on: r.on, stacked: r.stacked, d: r }; };
}

const stats = Object.fromEntries([...K, 'stacked'].map((k) => [k, { tp: 0, fp: 0, fn: 0, tn: 0 }]));
const conf = {}; let correct = 0, offByTwo = 0;
const errors = [];
const byTag = {};
for (const r of rows) {
  const pr = predict(r.prompt);
  for (const k of K) {
    const y = !!r[k], yh = !!pr.on[k], s = stats[k];
    if (y && yh) s.tp++; else if (!y && yh) s.fp++; else if (y && !yh) s.fn++; else s.tn++;
    if (errKey === k && y !== yh) errors.push({ want: +y, got: +yh, prompt: r.prompt, hits: pr.d.el ? pr.d.el[k].hits.map((h) => h.tag).join(',') : '' });
  }
  { const y = !!r.stacked, yh = !!pr.stacked, s = stats.stacked; if (y && yh) s.tp++; else if (!y && yh) s.fp++; else if (y && !yh) s.fn++; else s.tn++; }
  const g = R.grade(Object.fromEntries(K.map((k) => [k, !!r[k]])));
  const gh = R.grade(pr.on);
  conf[g + '>' + gh] = (conf[g + '>' + gh] || 0) + 1;
  if (g === gh) correct++;
  if ((g === 'weak' && gh === 'strong') || (g === 'strong' && gh === 'weak')) offByTwo++;
  if (errKey === 'grade' && g !== gh) errors.push({ want: g, got: gh, prompt: r.prompt, on: K.filter((k) => pr.on[k]).join('') + ' vs ' + K.filter((k) => r[k]).join('') });
  for (const tag of (r.tags || []).concat(['domain:' + r.domain])) {
    byTag[tag] = byTag[tag] || { n: 0, ok: 0 }; byTag[tag].n++; if (g === gh) byTag[tag].ok++;
  }
}
const f1 = (s) => { const p = s.tp / (s.tp + s.fp || 1), r = s.tp / (s.tp + s.fn || 1); return { p, r, f: (2 * p * r) / (p + r || 1), acc: (s.tp + s.tn) / (s.tp + s.tn + s.fp + s.fn) }; };
console.log(`mode=${mode} n=${rows.length}`);
for (const k of [...K, 'stacked']) { const m = f1(stats[k]); console.log(`${k.padEnd(8)} P=${m.p.toFixed(3)} R=${m.r.toFixed(3)} F1=${m.f.toFixed(3)} acc=${m.acc.toFixed(3)}`); }
console.log(`GRADE acc=${(correct / rows.length).toFixed(3)}  weak<->strong flips=${offByTwo}`);
console.log('confusion (true>pred):', JSON.stringify(conf));
const tagLine = Object.entries(byTag).filter(([, v]) => v.n >= 8).map(([t, v]) => `${t}:${(v.ok / v.n).toFixed(2)}(${v.n})`).join('  ');
console.log('grade acc by tag:', tagLine);
if (errKey) { console.log(`\n--- ${errors.length} errors on ${errKey} (showing ${Math.min(nShow, errors.length)}) ---`); errors.slice(0, nShow).forEach((e) => console.log(JSON.stringify(e))); }
