/* node tools/label-handoff.js [--check] <looks file> <sheet> <ian batch json> <catalogue> <out frozen> <out gold>   see tools/README.md */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const L = process.env.FF_LEDGER || path.join(__dirname, '..', '..', '.ledger', '2026-10-22-fit-finder-bca');
const stop = (m) => { console.log('STOP: ' + m); process.exit(3); };
const a = process.argv.slice(2);
const check = a[0] === '--check';
if (check) a.shift();
if (a.length !== 6) stop('usage: label-handoff.js [--check] <looks> <sheet> <batch> <catalogue> <out frozen> <out gold>');
const [looksF, sheetF, batchF, catF, frozenF, goldF] = a;
const read = (f, what) => { if (!fs.existsSync(f)) stop(what + ' not found: ' + f); return fs.readFileSync(f); };

const sheetBuf = read(sheetF, 'sheet');
const sheetIds = [...sheetBuf.toString('utf8').matchAll(/^### (\S+) \| \S+\s*$/gm)].map((m) => m[1]);
if (!sheetIds.length) stop('no rows in the sheet');
if (new Set(sheetIds).size !== sheetIds.length) stop('repeated id in the sheet');
const cards = new Set(JSON.parse(read(catF, 'catalogue').toString('utf8')).useCases.map((u) => u.id));
const legal = (l) => l === 'none' || l === 'not' || cards.has(l);
const row = (id, label, by) => label === 'not' ? { id, fit: 'not', cards: [], by } : { id, fit: 'good', cards: label === 'none' ? [] : [label], by };

// the PM's PICK: one line of <id>=<label> tokens after a PICK marker
const lines = read(looksF, 'looks file').toString('utf8').split(/\r?\n/);
const tokensOk = (s) => { const t = s.trim().split(/\s+/).filter(Boolean); return t.length && t.every((x) => /^[^\s=]+=[^\s=]+$/.test(x)) ? t : null; };
const cands = [];
lines.forEach((ln, i) => {
  const m = /^\W*PICK\b\W*(.*)$/.exec(ln);
  if (!m) return;
  const same = tokensOk(m[1]);
  if (same) return cands.push(same);
  if (!m[1].trim()) {
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    const next = j < lines.length && tokensOk(lines[j]);
    if (next) cands.push(next);
  }
});
if (cands.length !== 1) stop(cands.length ? 'more than one PICK line' : 'no PICK line of id=label tokens');
const pick = new Map();
for (const t of cands[0]) {
  const [id, label] = t.split('=');
  if (pick.has(id)) stop('id ' + id + ' appears twice in the PICK');
  if (!sheetIds.includes(id)) stop('PICK id ' + id + ' is not in the sheet');
  if (!legal(label)) stop('unknown label ' + label + ' for ' + id);
  pick.set(id, label);
}
for (const id of sheetIds) if (!pick.has(id)) stop('sheet id ' + id + ' missing from the PICK');

// Ian's batch
let batch;
try { batch = JSON.parse(read(batchF, 'batch file').toString('utf8')); } catch (e) { stop('batch file is not JSON'); }
if (typeof batch.words !== 'string' || !batch.words.trim()) stop('batch words is empty');
const sha = crypto.createHash('sha256').update(sheetBuf).digest('hex');
if (batch.sheetSha256 !== sha) stop('batch sheetSha256 does not match the sheet');
const shaF = path.join(L, 'label-sheet.sha256');
if (fs.existsSync(shaF) && fs.readFileSync(shaF, 'utf8').trim().slice(0, 64) !== sha) stop('sheet differs from label-sheet.sha256');
if (typeof batch.accepted !== 'boolean') stop('batch accepted is not a boolean');
if (!Array.isArray(batch.changes)) stop('batch changes is not an array');
if (batch.accepted && batch.changes.length) stop('accepted is true but changes is not empty');
for (const c of batch.changes) {
  if (!c || !sheetIds.includes(c.id)) stop('change id ' + (c && c.id) + ' is not in the sheet');
  if (typeof c.label !== 'string' || !legal(c.label)) stop('change has an illegal label for ' + c.id);
}

const frozen = sheetIds.map((id) => row(id, pick.get(id), 'pm'));
const final = new Map(batch.changes.map((c) => [c.id, c.label]));
let D = 0;
const gold = sheetIds.map((id) => {
  const l = final.has(id) ? final.get(id) : pick.get(id);
  if (l === pick.get(id)) return row(id, l, 'pm');
  D++;
  return row(id, l, 'ian');
});
const text = (rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
if (check) {
  const same = (f, rows) => fs.existsSync(f) && fs.readFileSync(f, 'utf8') === text(rows);
  if (!same(frozenF, frozen) || !same(goldF, gold)) { console.log('label-handoff FAIL: outputs differ from a recomputation'); process.exit(1); }
} else {
  fs.writeFileSync(frozenF, text(frozen));
  fs.writeFileSync(goldF, text(gold));
}
console.log('label-handoff ok rows ' + sheetIds.length + ' changed ' + D);
