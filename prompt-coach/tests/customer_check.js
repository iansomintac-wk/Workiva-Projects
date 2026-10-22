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
const rows = files.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l, i) => ({ ...JSON.parse(l), __f: path.basename(f), __i: i })));
const words = (s) => (s.toLowerCase().match(/[a-z0-9]+(?:['’][a-z]+)?/g) || []);
const BASE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/rewrites/blank_baseline.json'), 'utf8'));
const BASE_FILES = new Set(Object.keys(BASE).map((k) => k.split('|')[0]));
// same list as the probe; "if you can't ..." is an evaluate rule, not filler
const FILLER = [/\bplease\b|\bpls\b|\bplz\b/i, /\bkindly\b/i, /\bthank(?:s| you)\b|\bthx\b/i, /\bcan (?:you|u)\b/i, /\bcould you\b/i, /\bwould you(?: mind)?\b/i, /\bi (?:was|am) wondering\b|\bi wonder\b/i, /\bif (?:possible|you (?:can|could)(?!['’]t| not))\b/i];
const unbalanced = (x) => x.split('(').length !== x.split(')').length || x.split('[').length !== x.split(']').length;
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const info = { onlyC: 0, strongQ: 0, blanks: [] };
const VAGUE_ONLY = /^\s*(?:(?:please|pls|can (?:you|u)|could you)\s+)*(?:analy[sz]e|review|look (?:at|over)|go over|check|help(?: me)?(?: with)?|work on|take a look at)\b[^?]*$/i;
// the coach tidies chat shorthand in the user's words; compare against the tidied form
const tidy0 = (x) => x.replace(/\bcan u\b/gi, 'can you').replace(/\bu\b/gi, 'you').replace(/\bur\b/gi, 'your').replace(/\b(?:pls|plz)\b/gi, 'please').replace(/^\s*(?:hi|hey|hello)\b[\s,!.]*/i, '').replace(/\b(?:any )?thoughts\s*\?+/gi, '').replace(/^\s*(?:thanks|thank you|thx|ty)\b[^.!?]*[.!?]*/i, '');
// declared change (spec 2026-10-16, deviation for Ian's yes): the compared user sentence gets the same direct-voice and typo rewrite as the output.
// It feeds askLost (named in the spec) and subjectLost and the new order check (not named).
const tidy = (x) => (W.fixTypos || ((y) => y))(W.directVoice(tidy0(x)));
const fail = { numbers: [], role: [], askLost: [], sheet: [], notStrong: [], fileHeadline: [], casual: [], unsureTask: [], unsureArea: [], splitNumber: [], assumedSource: [], writeOnly: [], subjectLost: [], filler: [], order: [], broken: [], blankMore: [], blankOnlyC: [], ianCase: [] };
let n = 0;
for (const r of rows) for (const withFile of [false, true]) {
  const file = withFile ? FILES[r.domain] : null; if (withFile && !file) continue;
  n++;
  const pick = C.pick(r.prompt, CLS);
  const o = W.coach(r.prompt, { files: file ? [file] : [], detect, ...pick });
  if (o.grade === 'strong') continue; // the user's own prompt is shown as-is
  const s = o.stages.strong.prompt, bare = s.replace(/\[[^\]]*\]/g, ' ');
  const bt = o.stages.better.prompt, blanks = (s.match(/\[[^\]]*\]/g) || []).length;
  const onlyC = K.filter((k) => !o.detected[k]).join('') === 'C' && !r.prompt.includes('[');
  info.blanks.push(blanks); if (s.includes('?')) info.strongQ++;
  if (FILLER.some((re) => re.test(s) || re.test(bt))) fail.filler.push([r.prompt, FILLER.some((re) => re.test(s)) ? s : bt]);
  { // kept sentences appear in the user's order: the first 20 cleaned characters of each, where found, at increasing positions
    const ns = norm(s); let last = -1, bad = false;
    for (const sent of r.prompt.split(/(?<=[.!?\n])\s+/).filter((x) => words(x).length >= 3)) {
      const key = norm(tidy(sent)).slice(0, 20); if (key.length < 8) continue;
      const at = ns.indexOf(key); if (at < 0) continue;
      if (at < last) { bad = true; break; } last = at;
    }
    if (bad) fail.order.push([r.prompt, s]); }
  if ((/;\s*[.!?]/.test(s) && !/;\s*[.!?]/.test(r.prompt)) || (unbalanced(s) && !unbalanced(r.prompt))) fail.broken.push([r.prompt, s]);
  { if (BASE_FILES.has(r.__f) && blanks > 0) fail.blankMore.push([r.prompt, blanks + ' > 0', s]); }
  if (onlyC) { info.onlyC++; if (blanks !== 0) fail.blankOnlyC.push([r.prompt, blanks, s]); }
  const known = new Set(words(r.prompt + ' ' + (file ? file.name + ' ' + file.sheets.map((x) => x.name + ' ' + x.headers.join(' ')).join(' ') + ' ' + file.periods.join(' ') : '')));
  const nums = (bare.toLowerCase().match(/\b\d+(?:\.\d+)?%?/g) || []).filter((x) => { const b = x.replace('%', ''); return !r.prompt.toLowerCase().includes(x) && !known.has(b) && ![...known].some((w) => w.startsWith(b) && /^[a-z]/.test(w.slice(b.length))); });
  if (nums.length) fail.numbers.push([r.prompt, nums.join(' '), s]);
  if (/\byou are (?:a|an|the)\b|\bact as\b/i.test(s) && !/\byou are\b|\bact as\b|\byou're\b/i.test(r.prompt)) fail.role.push([r.prompt, s]);
  for (const sent of r.prompt.split(/(?<=[.!?\n])\s+/).filter((x) => words(x).length >= 3)) {
    if (VAGUE_ONLY.test(sent) && words(sent).length <= 8) continue;
    const sw = words(tidy(sent)), have = new Set(words(s));
    if (sw.filter((w) => have.has(w)).length / sw.length < 0.8) { fail.askLost.push([sent, s]); break; }
  }
  const sh = s.match(/sheet "([^"]+)"/);
  if (sh && !r.prompt.toLowerCase().includes(sh[1].toLowerCase())) fail.sheet.push([r.prompt, sh[1]]);
  { const on = detect(s).on; if (R.grade(on) !== 'strong') fail.notStrong.push([r.prompt, 'missing ' + K.filter((k) => !on[k]).join(''), s]); }
  if (/\b(?:can u|u|ur|pls|plz)\b|(?:^|[.!?]\s+)(?:any )?thoughts\?|(?:^|[.!?]\s+)(?:hi|hey|hello|thanks|thx)\b/i.test(s)) fail.casual.push([r.prompt, s]);
  if (!pick.taskSure && !o.detected.O && !/identify and list the key points and where each one appears/i.test(s)) fail.unsureTask.push([r.prompt, s]);
  if (!pick.areaSure && /10-Q MD&A|SOX testing workpapers|CSRD report|audit committee|external auditors|assurance provider/.test(s.replace(r.prompt, ''))) fail.unsureArea.push([r.prompt, s]);
  if (/[A-Za-z0-9]\. [0-9]/.test(s) && !/[A-Za-z0-9]\. [0-9]/.test(r.prompt)) fail.splitNumber.push([r.prompt, s]);
  { const m = bare.match(/\b(?:the )?(?:selected|open) (table|report|document|text|range|data|rows?|section)\b/i);
    if (!file && !o.detected.S && m && !new RegExp('\\b' + m[1].replace(/s$/, ''), 'i').test(r.prompt)) fail.assumedSource.push([r.prompt, m[0]]); }
  if (['draft', 'checklist'].includes(o.intent) && /\bwork only from\b/i.test(s)) fail.writeOnly.push([r.prompt, s]);
  // the subject must survive even when a vague sentence is rewritten ("analyze our emissions data")
  { const VERBS = /^(?:analy[sz]e|review|look|check|help|with|go|over|work|take|please|pls|can|could|you|u|our|my|the|this|these|that|a|an|some|at|on|of|for|and|to|in|it|me|data|stuff|things|numbers)$/;
    const have = new Set(words(s)); const subj = words(tidy(r.prompt)).filter((w) => !VERBS.test(w) && w.length > 2);
    if (subj.length && subj.filter((w) => have.has(w)).length / subj.length < 0.6) fail.subjectLost.push([r.prompt, s]); }
  if (file && !o.detected.S && !o.headline.includes('@' + file.name)) fail.fileHeadline.push([r.prompt, o.headline]);
}
{ const rd = (f) => fs.readFileSync(path.join(__dirname, 'fixtures/rewrites', f), 'utf8').replace(/\r/g, ''), flat = (x) => x.replace(/\s+/g, ' ').trim();
  const ian = rd('ian_case.txt').trim(), want = { strong: flat(rd('ian_strong.txt')), better: flat(rd('ian_better.txt')) };
  const pdf = { name: 'Utility invoices Sep 2018.pdf', kind: 'PDF', sheets: [], periods: [], text: 'Invoice Account Service address Usage kWh Amount due USD' };
  for (const fl of [[], [pdf]]) { const o = W.coach(ian, { files: fl, detect, ...C.pick(ian, CLS) });
    for (const st of ['strong', 'better']) if (flat(o.stages[st].prompt) !== want[st]) fail.ianCase.push([st + ' files=' + fl.length, o.stages[st].prompt]); } }
const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
console.log('info: only-Context-missing runs', info.onlyC, '| strong with "?"', info.strongQ, '| strong blanks median', med(info.blanks));
let bad = 0;
for (const [k, v] of Object.entries(fail)) { bad += v.length; console.log(`${k.padEnd(13)} ${v.length}/${n}`); for (const x of v.slice(0, 2)) console.log('   e.g.', JSON.stringify(x).slice(0, 260)); }
console.log(bad ? 'FAIL' : 'PASS', n, 'runs');
process.exitCode = bad ? 1 : 0;
