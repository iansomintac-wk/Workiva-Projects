/* node tests/prompts-strong.test.js
   Every prompt the Fit Finder page can show must grade "strong" in the Prompt Coach, graded as the coach page grades
   (model.predict + rewrite.coach + classify.pick; strong with stacked rules counts as "better"). Exit 1 if any is not. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '../..');
const F = require('../engine/fit.js');
const M = require(path.join(root, 'prompt-coach/engine/model.js'));
const R = require(path.join(root, 'prompt-coach/engine/rules.js'));
const W = require(path.join(root, 'prompt-coach/engine/rewrite.js'));
const C = require(path.join(root, 'prompt-coach/engine/classify.js'));
const rj = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const weights = rj('prompt-coach/engine/weights.json');
const CLS = C.unpack(rj('prompt-coach/engine/cls-weights.json'));
const cat = rj('fit-finder/data/catalogue.json');
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
const grade = (p) => {
  const r = W.coach(p, { files: [], detect, ...C.pick(p, CLS) });
  return r.offtopic ? 'weak' : r.grade === 'strong' && r.hits && r.stacked ? 'better' : r.grade; // the page's display rule
};
const rows = (f) => fs.readFileSync(path.join(root, 'fit-finder/data', f), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const sets = [];
const taskSets = [['tasks.jsonl', rows('tasks.jsonl')]];
for (const f of fs.readdirSync(path.join(root, 'fit-finder/data/synth')).filter((x) => x.endsWith('.jsonl'))) taskSets.push(['synth/' + f, rows('synth/' + f)]);
for (const [name, rs] of taskSets) {
  const starters = [], fuller = [];
  for (const t of rs) {
    const r = F.rate(t.task);
    if (r.prompt) starters.push(r.prompt);
    const fp = r.fit === 'not' ? null : F.patternPrompt(t.task, F.match(t.task, cat)[0]);
    if (fp) fuller.push(fp);
  }
  sets.push([name + ' starters', starters], [name + ' fuller', fuller]);
}
sets.push(['catalogue use cases', cat.useCases.filter((u) => u.prompt).map((u) => u.prompt)]);
sets.push(['COLLECT starter', [F.rate('Chase the site owners for their data every month.').prompt].filter(Boolean)]);
// the starter keeps the person's own task: it ends at a clause boundary or is the whole task, keeps the clause its ask is for, and repeats no placeholder
const norm = (t) => String(t).trim().replace(/\s+/g, ' ').replace(/[.!?]*$/, '');
const BOUNDARY = /^(?:;\s|,\s*then\s|\s+then\s|\s+and then\s|\s+and (?:make|create|build|prepare)\b)/;
const shape = [];
for (const [name, rs] of taskSets) for (const t of rs) {
  const r = F.rate(t.task); if (!r.prompt) continue;
  // the task text sits between "My task: "/"Context: " and the ask; the task may itself contain an ask verb, so take the longest prefix that is really in the task (else the shortest)
  const head = r.prompt.match(/(?:My task|Context): /), whole = norm(t.task);
  let kept = null;
  if (head) {
    const rest = r.prompt.slice(head.index + head[0].length), cands = [];
    for (let m, re = / (?:Draft a|Summarize|Compare|Check|Rewrite|Translate|Pull|Explain|Map|Sort|Estimate|Read) /g; (m = re.exec(rest)); re.lastIndex = m.index + 1) cands.push(norm(rest.slice(0, m.index)));
    kept = cands.filter((c) => whole.includes(c)).sort((a, b) => b.length - a.length)[0] ?? (cands[0] ?? null);
  }
  const tag = name + ' ' + String(t.id).slice(0, 12) + ' ' + whole.slice(0, 40);
  if (kept === null) { shape.push('no task text found: ' + tag); continue; }
  if (!whole.includes(kept)) shape.push('task not kept as written: ' + tag);
  else if (kept !== whole) {
    // a cut is clean only at a clause or sentence end on BOTH sides (a cut at the very start or end of the task has nothing on that side)
    const at = whole.indexOf(kept), after = whole.slice(at + kept.length), before = whole.slice(0, at).replace(/ +$/, '');
    const afterOK = after === '' || BOUNDARY.test(after) || /^[.!?] /.test(after), beforeOK = before === '' || /(?:;|then|and|[.!?])$/.test(before);
    if (!afterOK || !beforeOK) shape.push('cut mid-phrase: ' + tag + ' -> ' + kept.slice(-30));
  }
  const lead = F.lead(t.task);
  if (lead && !F.OPS[lead].test(F.normalize(kept))) shape.push('lead clause lost (' + lead + '): ' + tag);
  const ph = r.prompt.match(/\[[^\]]+\]/g) || [];
  if (new Set(ph).size !== ph.length) shape.push('placeholder twice: ' + tag);
}
// a starter never drops a constraint, a condition, a list item or the thing "it" refers to (fix B): these words must appear in the starter's task text
const KEEP = [
  ['Compare the current and prior reports; do not reveal employee names.', ['do not reveal employee names']],
  ['Read the incident log; then draft an email about it', ['incident log', 'draft an email about it']],
  ['If any account changed by more than 10% then explain why', ['more than 10%', 'explain why']],
  ['Check these balances for mismatches: cash; receivables; payables', ['cash', 'receivables', 'payables']],
  ['Summarize the audit minutes; only use the signed version', ['only use the signed version']],
  ['Pull the open items from the log, and keep the owner names out; then draft the cover email', ['keep the owner names out']],
  ['Check the vendor file for gaps; when a contract expires within 90 days then flag it; then email Sam', ['expires within 90 days']],
  ['Check the ledger for gaps: sales; returns; refunds; then draft an email about them', ['sales', 'returns', 'refunds', 'ledger']]
];
for (const [t, words] of KEEP) {
  const p = F.rate(t).prompt || '', task = p.slice(p.indexOf('My task: ')).toLowerCase();
  for (const w of words) if (!task.includes(w.toLowerCase())) shape.push('starter dropped "' + w + '": ' + t.slice(0, 50));
}
// a translation gets a translate ask, not "Rewrite it" (fix B2), and the target language is filled in
for (const [t, lang] of [['Translate the entire annual report for all our international investors including sustainability disclosures into Spanish', 'Spanish'], ['Every quarter I translate the board pack to German for the Frankfurt team', 'German'], ['Translate the policy manual into French and German', 'French']]) {
  const p = F.rate(t).prompt || '';
  if (!/ Translate it into /.test(p) || /Rewrite it/.test(p) || !p.includes('Translate it into ' + lang)) shape.push('translate starter wrong: ' + t.slice(0, 50));
  sets.push(['translate starter', [p]]);
}
const sh = [...new Set(shape)];
console.log('starter shape: ' + sh.length + ' problems');
for (const f of sh.slice(0, 60)) console.log('  FAIL ' + f);
let bad = sh.length;
for (const [name, ps] of sets) {
  const n = { weak: 0, better: 0, strong: 0 }, failing = [];
  for (const p of ps) { const g = grade(p); n[g]++; if (g !== 'strong') failing.push(g + ' ' + p.slice(0, 60)); }
  bad += failing.length;
  console.log(name + ': n ' + ps.length + ' ' + JSON.stringify(n));
  for (const f of [...new Set(failing)]) console.log('  FAIL ' + f);
}
if (!sets.find(([n, p]) => n === 'COLLECT starter' && p.length)) { console.log('FAIL COLLECT starter not produced'); bad++; }
console.log(bad ? bad + ' prompts not strong' : 'all prompts strong');
process.exit(bad ? 1 : 0);
