// Read-only probe: how often polite filler, questions and blanks survive into Better/Strong.
// node research/rewrite_probe.js "$PWD" data/sim_customers.jsonl data/test.jsonl   (run from prompt-coach/)
const fs = require('fs'), path = require('path');
const PC = process.argv[2];
const R = require(PC + '/engine/rules.js'), M = require(PC + '/engine/model.js'), W = require(PC + '/engine/rewrite.js'), C = require(PC + '/engine/classify.js');
const weights = JSON.parse(fs.readFileSync(PC + '/engine/weights.json'));
const CLS = C.unpack(JSON.parse(fs.readFileSync(PC + '/engine/cls-weights.json')));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
const FILES = {
  FR: { name: 'Q3 Flux.xlsx', kind: 'Excel', sheets: [{ name: 'Summary', headers: ['Account', 'Q2 FY26', 'Q3 FY26', 'Change'] }, { name: 'Detail', headers: ['Entity', 'Account', 'Amount'] }], periods: ['Q2 FY26', 'Q3 FY26'], text: 'Account Q2 FY26 Q3 FY26 revenue opex' },
  GRC: { name: 'RCM_FY26.xlsx', kind: 'Excel', sheets: [{ name: 'Controls', headers: ['Control ID', 'Description', 'Owner', 'Frequency'] }], periods: [], text: 'Control ID Description Owner Frequency' },
  SUS: { name: 'GHG Inventory 2025.xlsx', kind: 'Excel', sheets: [{ name: 'Scope 3', headers: ['Category', 'FY2024', 'FY2025'] }, { name: 'Scope 1', headers: ['Site', 'FY2024', 'FY2025'] }], periods: ['FY2024', 'FY2025'], text: 'Category FY2024 FY2025 Scope 3 emissions' }
};
const FILL = /\b(?:please|pls|plz|kindly|can (?:you|u)|could you|would you|will you|i was wondering|i'?d like you to|i need you to|would it be possible|thanks|thank you|thx)\b/i;
const out = {};
for (const f of process.argv.slice(3)) {
  const rows = fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
  const c = { runs: 0, inFill: 0, gradedStrongWithFill: 0, strongFill: 0, betterFill: 0, strongQ: 0, nonStrongRuns: 0, blanks: [], ex: [] };
  for (const r of rows) for (const withFile of [false, true]) {
    const file = withFile ? FILES[r.domain] : null; if (withFile && !file) continue;
    c.runs++;
    const pick = C.pick(r.prompt, CLS);
    const o = W.coach(r.prompt, { files: file ? [file] : [], detect, ...pick });
    const hasFill = FILL.test(r.prompt); if (hasFill) c.inFill++;
    const s = o.stages.strong.prompt, b = o.stages.better.prompt;
    if (o.grade === 'strong') { if (hasFill) c.gradedStrongWithFill++; continue; }
    c.nonStrongRuns++;
    c.blanks.push((s.match(/\[[^\]]+\]/g) || []).length);
    if (hasFill && FILL.test(s)) { c.strongFill++; if (c.ex.length < 3) c.ex.push(s.slice(0, 220)); }
    if (hasFill && FILL.test(b)) c.betterFill++;
    if (/\?/.test(s.replace(/\[[^\]]*\]/g, ''))) c.strongQ++;
  }
  const inFillNonStrong = c.inFill - c.gradedStrongWithFill;
  const hist = {}; for (const x of c.blanks) hist[x] = (hist[x] || 0) + 1;
  out[path.basename(f)] = { runs: c.runs, inputsWithFiller: c.inFill, ofWhichGradedStrong_shownVerbatim: c.gradedStrongWithFill,
    strongKeepsFiller: c.strongFill + '/' + inFillNonStrong, betterKeepsFiller: c.betterFill + '/' + inFillNonStrong,
    strongHasQuestionMark: c.strongQ + '/' + c.nonStrongRuns, blanksPerStrong: hist, examples: c.ex };
}
console.log(JSON.stringify(out, null, 1));
