/* node tools/label-sheet.js <draft> <card-view> <out>
   node tools/label-sheet.js --verify <sheet> <draft> <catalogue>      see tools/README.md */
const fs = require('fs'), path = require('path');
const HEADER = 'PM FIRST PASS (ruling 2026-10-22-fit-finder-pm-labels-first): label every row below per the guide that follows; read only this sheet, never fit-finder/engine/, data/catalogue.json, data/synth/, data/card-gold*, data/real/, data/top3/, the workiva-sealed folder or any earlier set.';
const OUTPUT = 'Your whole reply is under 150 words. PICK is ONE line of space-separated tokens, one per row, <id>=<label>, for example F1=gen-translate F2=not F3=none. The label is the id of the single best card (first card), or none (the task fits but no card does), or not (not a fit), per the guide. No other text on the PICK line. WHY: one short line on any row you are unsure of. CHECKED: the files you opened (the sheet only).';
const guide = () => fs.readFileSync(path.join(__dirname, '..', 'data', 'LABELING.md'), 'utf8').replace(/\r\n/g, '\n').replace(/\s+$/, '');
const rows = (f) => fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
const one = (s) => String(s).replace(/\s+/g, ' ').trim();
const build = (draft, cards) => [
  HEADER,
  '## Labeling guide\n\n' + guide(),
  '## Cards\n\n' + cards.map((c) => '- ' + c.id + ' | ' + c.area + ' | ' + one(c.task) + ' | try: ' + one(c.try)).join('\n'),
  '## Rows\n\n' + draft.map((r) => '### ' + r.id + ' | ' + r.area + '\n' + one(r.task)).join('\n\n'),
  '## Output\n\n' + OUTPUT,
].join('\n\n') + '\n';
const die = (m) => { console.log('label-sheet FAIL: ' + m); process.exit(1); };
const a = process.argv.slice(2);
try {
  if (a[0] === '--verify') {
    const [, sheet, draft, cf] = a;
    if (!sheet || !draft || !cf) die('usage: label-sheet.js --verify <sheet> <draft> <catalogue>');
    const cards = JSON.parse(fs.readFileSync(cf, 'utf8')).useCases;
    const want = build(rows(draft), cards);
    if (fs.readFileSync(sheet, 'utf8').replace(/\r\n/g, '\n') !== want) die('sheet differs from the one built from the draft and catalogue');
    console.log('label-sheet ok');
  } else {
    const [draft, cv, out] = a;
    if (!draft || !cv || !out) die('usage: label-sheet.js <draft> <card-view> <out>');
    const d = rows(draft);
    if (!d.length) die('draft has 0 rows');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, build(d, JSON.parse(fs.readFileSync(cv, 'utf8')).useCases));
    console.log('label-sheet rows ' + d.length);
  }
} catch (e) { die(e.message); }
