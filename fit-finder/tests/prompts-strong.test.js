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
  return r.grade === 'strong' && r.hits && R.detect(p).stacked ? 'better' : r.grade;
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
  const m = r.prompt.match(/(?:My task|Context): (.*?) (?:Draft a|Summarize|Compare|Check|Rewrite|Pull|Explain|Map|Sort|Estimate|Read) /);
  const kept = m ? norm(m[1]) : null, whole = norm(t.task), tag = name + ' ' + String(t.id).slice(0, 12) + ' ' + whole.slice(0, 40);
  if (kept === null) { shape.push('no task text found: ' + tag); continue; }
  if (!whole.includes(kept)) shape.push('task not kept as written: ' + tag);
  else if (kept !== whole && !BOUNDARY.test(whole.slice(whole.indexOf(kept) + kept.length)) && !/(?:^|;|then|and) *$/.test(whole.slice(0, whole.indexOf(kept)).replace(/ +$/, ''))) shape.push('cut mid-phrase: ' + tag + ' -> ' + kept.slice(-30));
  const lead = F.lead(t.task);
  if (lead && !F.OPS[lead].test(F.normalize(kept))) shape.push('lead clause lost (' + lead + '): ' + tag);
  const ph = r.prompt.match(/\[[^\]]+\]/g) || [];
  if (new Set(ph).size !== ph.length) shape.push('placeholder twice: ' + tag);
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
