/* Read-only probe (talk 2026-10-20): is the reason line under a weak prompt right for that prompt?
   node research/2026-10-20-reason-line-probe.js > research/2026-10-20-reason-line-probe.tsv
   Reads data/train_*.jsonl and research/live-tests/cases.json only; writes nothing but stdout.
   The reason line is coach().stages.weak.verdict for a prompt the coach grades weak, with the same detector and
   classifier the page uses (web/template.html). Each letter the line names is checked against the row's label:
     HAS    the line says the prompt lacks a letter the label says it has (or calls the verb vague when O = 1)
     MISSED the label says S or O is absent and the line does not name it (the real gap is not in the line)
     minor  the label says C, P or E is absent and the line does not name it
   The detector was trained on these rows, so its errors here are in-sample and optimistic. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const W = require(ROOT + '/engine/rewrite.js'), M = require(ROOT + '/engine/model.js'), C = require(ROOT + '/engine/classify.js');
const read = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const rows = ['fr', 'grc', 'sus', 'hard'].flatMap((d) => read(path.join(ROOT, 'data/train_' + d + '.jsonl')).map((r, i) => ({ ...r, src: 'train_' + d + ':' + (i + 1) })));
const CLS = C.unpack(JSON.parse(fs.readFileSync(ROOT + '/engine/cls-weights.json')));
const detW = JSON.parse(fs.readFileSync(ROOT + '/engine/weights.json'));
const detect = (p) => { const r = M.predict(p, detW, { mode: detW.mode }); return { on: r.on, d: r.rules }; };
const run = (p) => W.coach(p, { files: [], detect, ...C.pick(p, CLS) });

// same phrases as MISSING in engine/rewrite.js
const PHRASE = { S: 'what to read', C: 'who it is for', O: 'the one thing you want back', P: 'a format or scope', E: 'a rule about invented facts' };
const named = (line) => Object.keys(PHRASE).filter((k) => line.includes(PHRASE[k]));
const shape = (line) => line.replace(/"[^"]*"/g, '"_"'); // the template with the quoted verb blanked

const out = ['src\tlabel SCOPE\tstacked\tHAS\tMISSED\tminor\treason line\tprompt'];
const n = { weak: 0, rows: rows.length, has: 0, missed: 0, either: 0, minor: 0, vagueHas: 0, stackedUnsaid: 0, exact: 0 };
const lines = {}, shapes = {};
for (const r of rows) {
  const o = run(r.prompt);
  if (o.grade !== 'weak') continue;
  n.weak++;
  const line = o.stages.weak.verdict, say = named(line);
  lines[line] = (lines[line] || 0) + 1; shapes[shape(line)] = (shapes[shape(line)] || 0) + 1;
  const has = say.filter((k) => r[k] === 1);
  if (/A verb like/.test(line) && r.O === 1) { has.push('vague'); n.vagueHas++; }
  const missed = ['S', 'O'].filter((k) => r[k] === 0 && !say.includes(k));
  const minor = ['C', 'P', 'E'].filter((k) => r[k] === 0 && !say.includes(k));
  if (has.length) n.has++; if (missed.length) n.missed++; if (has.length || missed.length) n.either++; if (minor.length) n.minor++;
  if (!has.length && !missed.length && !minor.length) n.exact++;
  if (r.stacked) n.stackedUnsaid++;
  const lab = ['S', 'C', 'O', 'P', 'E'].map((k) => (r[k] ? k : '-')).join('');
  out.push([r.src, lab, r.stacked, has.join(',') || '-', missed.join(',') || '-', minor.join(',') || '-', line, r.prompt.replace(/\s+/g, ' ')].join('\t'));
}
const live = JSON.parse(fs.readFileSync(ROOT + '/research/live-tests/cases.json'));
const liveOut = [];
for (const cs of live) {
  const o = run(cs.prompt);
  liveOut.push(['live ' + cs.id, o.grade, o.grade === 'weak' ? o.stages.weak.verdict : '(not weak)', cs.prompt.replace(/\s+/g, ' ')].join('\t'));
}
const top = (m, k) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, k).map(([s, c]) => `#   ${c}\t${s}`).join('\n');
console.log(out.join('\n'));
console.log(liveOut.map((l) => '# ' + l).join('\n'));
console.log(`# train rows ${n.rows}; graded weak by the coach: ${n.weak}`);
console.log(`# HAS (line names something the label says the prompt has): ${n.has}; of those, vague-verb clause with O=1: ${n.vagueHas}`);
console.log(`# MISSED (label says S or O absent, line silent): ${n.missed}`);
console.log(`# HAS or MISSED: ${n.either}; minor only-C/P/E silence rows: ${n.minor}; line exactly matches the label: ${n.exact}`);
console.log(`# weak rows labeled stacked (several asks), which the line never mentions: ${n.stackedUnsaid}`);
console.log(`# distinct reason lines: ${Object.keys(lines).length}; distinct templates (quoted verb blanked): ${Object.keys(shapes).length}`);
console.log('# most common lines:\n' + top(lines, 5));
