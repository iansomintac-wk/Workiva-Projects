/* Score the coach on real prompts from a CSV (see real-eval/README.md).
   node tests/eval_real.js real-eval/prompts.csv
   - Rows with S..E filled are scored against those labels.
   - Every row gets the coach's prediction in real-eval/predictions.csv, so a reviewer can
     label faster by agreeing/disagreeing instead of labeling from scratch. */
const fs = require('fs');
const path = require('path');
const R = require('../engine/rules.js');
const M = require('../engine/model.js');
const C = require('../engine/classify.js');
const W = require('../engine/rewrite.js');
const K = ['S', 'C', 'O', 'P', 'E'];

function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') q = false; else field += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.some((c) => c.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}
const csvCell = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

const file = process.argv[2];
if (!file) { console.error('usage: node tests/eval_real.js real-eval/prompts.csv'); process.exit(1); }
const weights = JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/weights.json'), 'utf8'));
const cls = C.unpack(JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/cls-weights.json'), 'utf8')));
const rows = parseCSV(fs.readFileSync(file, 'utf8')).filter((r) => r.prompt && !/^Paste one real prompt/.test(r.prompt));
if (!rows.length) { console.log('No prompts found. Fill in real-eval/prompts.csv first (see real-eval/README.md).'); process.exit(0); }

const yes = (v) => /^(1|y|yes|true|x)$/i.test(v);
const labeled = (r) => K.every((k) => r[k] !== '');
const stats = Object.fromEntries(K.map((k) => [k, { tp: 0, fp: 0, fn: 0, tn: 0 }]));
let gradeOk = 0, nLab = 0, intentOk = 0, nIntent = 0, flips = 0;
const out = [['id', 'prompt', 'pred_grade', ...K.map((k) => 'pred_' + k), 'pred_intent', 'intent_confidence', 'pred_domain', 'label_grade', 'agree'].join(',')];
for (const r of rows) {
  const p = M.predict(r.prompt, weights, { mode: weights.mode });
  const c = C.classify(r.prompt, cls);
  let intent = c.intent.label;
  if (intent === 'other' || c.intent.p < 0.5) intent = W.intentOf(R.normalize(r.prompt), false, true) || intent;
  const g = R.grade(p.on);
  let lg = '', agree = '';
  if (labeled(r)) {
    nLab++;
    const on = Object.fromEntries(K.map((k) => [k, yes(r[k])]));
    lg = R.grade(on); agree = lg === g ? 'yes' : 'no';
    if (lg === g) gradeOk++;
    if ((lg === 'weak' && g === 'strong') || (lg === 'strong' && g === 'weak')) flips++;
    for (const k of K) { const s = stats[k], y = on[k], yh = p.on[k]; if (y && yh) s.tp++; else if (yh) s.fp++; else if (y) s.fn++; else s.tn++; }
  }
  if (r.intent) { nIntent++; if (r.intent.toLowerCase() === intent) intentOk++; }
  out.push([r.id, r.prompt, g, ...K.map((k) => (p.on[k] ? 1 : 0)), intent, c.intent.p.toFixed(2), c.domain.label, lg, agree].map(csvCell).join(','));
}
// labeled rows also become training data: node tests/train.js rulefeat --tune data/train_*.jsonl real-eval/train_real.jsonl
const train = rows.filter(labeled).map((r) => JSON.stringify({ prompt: r.prompt, ...Object.fromEntries(K.map((k) => [k, yes(r[k]) ? 1 : 0])), stacked: yes(r.stacked) ? 1 : 0, intent: (r.intent || 'other').toLowerCase(), domain: (r.domain || 'GEN').toUpperCase(), tags: ['real'] }));
if (train.length) fs.writeFileSync(path.join(path.dirname(file), 'train_real.jsonl'), train.join('\n') + '\n');
const predFile = path.join(path.dirname(file), 'predictions.csv');
fs.writeFileSync(predFile, out.join('\n') + '\n');
console.log(`${rows.length} prompts, ${nLab} labeled. Predictions: ${predFile}`);
if (nLab) {
  console.log(`GRADE accuracy ${(100 * gradeOk / nLab).toFixed(1)}%  (weak<->strong flips: ${flips})`);
  for (const k of K) { const s = stats[k]; const pr = s.tp / ((s.tp + s.fp) || 1), rc = s.tp / ((s.tp + s.fn) || 1); console.log(`  ${k}: found ${(100 * rc).toFixed(0)}% of the ones present; right ${(100 * pr).toFixed(0)}% of the time it says present`); }
  if (nLab < 50) console.log(`Note: ${nLab} labeled prompts give a rough number (±${Math.round(100 / Math.sqrt(nLab))} points). Aim for 100+.`);
}
if (nIntent) console.log(`TASK accuracy ${(100 * intentOk / nIntent).toFixed(1)}% on ${nIntent} prompts with an intent label`);
