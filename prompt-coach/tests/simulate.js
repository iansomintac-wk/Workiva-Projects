/* Rewrite simulation: run the coach over labeled prompts and check invariants.
   node tests/simulate.js file.jsonl... [--show N]
   Uses the rule-feature model if engine/weights.json exists (same as the page), else rules. */
const fs = require('fs');
const path = require('path');
const R = require('../engine/rules.js');
const W = require('../engine/rewrite.js');
const M = require('../engine/model.js');
const K = ['S', 'C', 'O', 'P', 'E'];

const args = process.argv.slice(2);
const si = args.indexOf('--show'); const show = si >= 0 ? +args.splice(si, 2)[1] : 8;
const weights = fs.existsSync(path.join(__dirname, '../engine/weights.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/weights.json'), 'utf8')) : null;
const detect = (p) => {
  const d = R.detect(p);
  if (!weights) return { on: Object.fromEntries(K.map((k) => [k, d.el[k].on])), d };
  const r = M.predict(p, weights, { mode: weights.mode });
  return { on: r.on, d };
};
const rows = args.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)));

// A tiny synthetic workbook so file-grounded rewrites are exercised too.
const FILES = {
  FR: [{ name: 'Q3 Flux.xlsx', kind: 'Excel', sheets: [{ name: 'Summary', headers: ['Account', 'Q2 FY26', 'Q3 FY26', 'Change'] }, { name: 'Detail', headers: ['Entity', 'Account', 'Amount'] }], periods: ['Q2 FY26', 'Q3 FY26'], text: 'Account Q2 FY26 Q3 FY26 revenue opex' }],
  GRC: [{ name: 'RCM_FY26.xlsx', kind: 'Excel', sheets: [{ name: 'Controls', headers: ['Control ID', 'Description', 'Owner', 'Frequency'] }], periods: [], text: 'Control ID Description Owner Frequency' }],
  SUS: [{ name: 'GHG Inventory 2025.xlsx', kind: 'Excel', sheets: [{ name: 'Scope 3', headers: ['Category', 'FY2024', 'FY2025'] }], periods: ['FY2024', 'FY2025'], text: 'Category FY2024 FY2025 Scope 3 emissions' }],
  GEN: []
};

const fail = { strongNotStrong: [], betterWeak: [], toggleNoEffect: [], dupSentence: [], badText: [], emptyFrag: [] };
let n = 0, placeholders = 0, withFiles = 0, mineKept = 0, mineTotal = 0;
for (const r of rows) {
  for (const useFiles of [false, true]) {
    const files = useFiles ? FILES[r.domain] || [] : [];
    if (useFiles && !files.length) continue;
    n++; if (useFiles) withFiles++;
    const out = W.coach(r.prompt, { files, detect });
    const sP = out.stages.strong.prompt, bP = out.stages.better.prompt;
    const sg = R.grade(detect(sP).on), bg = R.grade(detect(bP).on);
    if (sg !== 'strong') fail.strongNotStrong.push({ prompt: r.prompt, strong: sP, got: sg, on: K.filter((k) => detect(sP).on[k]).join('') });
    if (bg === 'weak') fail.betterWeak.push({ prompt: r.prompt, better: bP, on: K.filter((k) => detect(bP).on[k]).join('') });
    placeholders += out.placeholders;
    for (const k of K) {
      if (!out.scope[k].frag.trim()) fail.emptyFrag.push({ prompt: r.prompt, k });
      if (out.scope[k].mine) { mineTotal++; }
      const off = W.assemble(out.segments, new Set(K.filter((x) => x !== k)));
      if (off === W.assemble(out.segments, new Set(K))) fail.toggleNoEffect.push({ prompt: r.prompt, k });
    }
    const sents = sP.split(/(?<=[.!?])\s+/).map((x) => x.toLowerCase().trim());
    if (new Set(sents).size !== sents.length) fail.dupSentence.push({ strong: sP });
    if (out.grade !== 'strong' && /\s[,.;]|\.\.|,,|\bthe the\b|\ba a\b|^\W|\(\s*\)|\s{2}/.test(sP)) fail.badText.push({ strong: sP });
    if (r.prompt.length > 15 && out.grade !== 'weak') { mineKept += sP.includes(r.prompt.trim().slice(0, 15)) ? 1 : 0; }
  }
}
console.log(`runs=${n} (with files ${withFiles}) placeholders/run=${(placeholders / n).toFixed(2)}`);
for (const [k, v] of Object.entries(fail)) console.log(`${k.padEnd(16)} ${v.length} (${(100 * v.length / n).toFixed(1)}%)`);
for (const [k, v] of Object.entries(fail)) if (v.length) { console.log(`\n--- ${k} ---`); v.slice(0, show).forEach((e) => console.log(JSON.stringify(e).slice(0, 400))); }
