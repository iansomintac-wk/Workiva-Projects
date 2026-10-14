/* Customer-faithfulness checks on the Strong rewrite (from the simulated-customer review, 2026-10-14).
   node tests/customer_check.js [file.jsonl ...]   default: data/sim_customers.jsonl
   Every prompt runs twice: alone, and with a matching file attached (as the page would). */
const fs = require('fs'), path = require('path');
const R = require('../engine/rules.js'), M = require('../engine/model.js'), W = require('../engine/rewrite.js'), C = require('../engine/classify.js');
const weights = JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/cls-weights.json'))));
const K = ['S', 'C', 'O', 'P', 'E'];
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
const FILES = {
  FR: { name: 'Q3 Flux.xlsx', kind: 'Excel', sheets: [{ name: 'Summary', headers: ['Account', 'Q2 FY26', 'Q3 FY26', 'Change'] }, { name: 'Detail', headers: ['Entity', 'Account', 'Amount'] }], periods: ['Q2 FY26', 'Q3 FY26'], text: 'Account Q2 FY26 Q3 FY26 revenue opex' },
  GRC: { name: 'RCM_FY26.xlsx', kind: 'Excel', sheets: [{ name: 'Controls', headers: ['Control ID', 'Description', 'Owner', 'Frequency'] }], periods: [], text: 'Control ID Description Owner Frequency' },
  SUS: { name: 'GHG Inventory 2025.xlsx', kind: 'Excel', sheets: [{ name: 'Scope 3', headers: ['Category', 'FY2024', 'FY2025'] }, { name: 'Scope 1', headers: ['Site', 'FY2024', 'FY2025'] }], periods: ['FY2024', 'FY2025'], text: 'Category FY2024 FY2025 Scope 3 emissions' }
};
const files = process.argv.slice(2); if (!files.length) files.push(path.join(__dirname, '../data/sim_customers.jsonl'));
const rows = files.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)));
const words = (s) => (s.toLowerCase().match(/[a-z0-9]+(?:['’][a-z]+)?/g) || []);
const VAGUE_ONLY = /^\s*(?:(?:please|pls|can (?:you|u)|could you)\s+)*(?:analy[sz]e|review|look (?:at|over)|go over|check|help(?: me)?(?: with)?|work on|take a look at)\b[^?]*$/i;
const fail = { numbers: [], role: [], askLost: [], sheet: [], notStrong: [], fileHeadline: [] };
let n = 0;
for (const r of rows) for (const withFile of [false, true]) {
  const file = withFile ? FILES[r.domain] : null; if (withFile && !file) continue;
  n++;
  const c = C.classify(r.prompt, CLS);
  const intent = (c.intent.label !== 'other' && c.intent.p >= 0.5 ? c.intent.label : W.intentOf(R.normalize(r.prompt), false, true) || (c.intent.label !== 'other' ? c.intent.label : null)) || undefined;
  const o = W.coach(r.prompt, { files: file ? [file] : [], detect, domain: c.domain.p >= 0.5 ? c.domain.label : undefined, intent });
  if (o.grade === 'strong') continue; // the user's own prompt is shown as-is
  const s = o.stages.strong.prompt, bare = s.replace(/\[[^\]]*\]/g, ' ');
  const known = new Set(words(r.prompt + ' ' + (file ? file.name + ' ' + file.sheets.map((x) => x.name + ' ' + x.headers.join(' ')).join(' ') + ' ' + file.periods.join(' ') : '')));
  const nums = (bare.toLowerCase().match(/\b\d+(?:\.\d+)?%?/g) || []).filter((x) => { const b = x.replace('%', ''); return !known.has(b) && ![...known].some((w) => w.startsWith(b) && /^[a-z]/.test(w.slice(b.length))); });
  if (nums.length) fail.numbers.push([r.prompt, nums.join(' '), s]);
  if (/\byou are (?:a|an|the)\b|\bact as\b/i.test(s) && !/\byou are\b|\bact as\b|\byou're\b/i.test(r.prompt)) fail.role.push([r.prompt, s]);
  for (const sent of r.prompt.split(/(?<=[.!?\n])\s+/).filter((x) => words(x).length >= 3)) {
    if (VAGUE_ONLY.test(sent) && words(sent).length <= 8) continue;
    const sw = words(sent), have = new Set(words(s));
    if (sw.filter((w) => have.has(w)).length / sw.length < 0.8) { fail.askLost.push([sent, s]); break; }
  }
  const sh = s.match(/sheet "([^"]+)"/);
  if (sh && !r.prompt.toLowerCase().includes(sh[1].toLowerCase())) fail.sheet.push([r.prompt, sh[1]]);
  { const on = detect(s).on; if (R.grade(on) !== 'strong') fail.notStrong.push([r.prompt, 'missing ' + K.filter((k) => !on[k]).join(''), s]); }
  if (file && !o.detected.S && !o.headline.includes('@' + file.name)) fail.fileHeadline.push([r.prompt, o.headline]);
}
let bad = 0;
for (const [k, v] of Object.entries(fail)) { bad += v.length; console.log(`${k.padEnd(13)} ${v.length}/${n}`); for (const x of v.slice(0, 2)) console.log('   e.g.', JSON.stringify(x).slice(0, 260)); }
console.log(bad ? 'FAIL' : 'PASS', n, 'runs');
process.exitCode = bad ? 1 : 0;
