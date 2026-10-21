/* Read-only probe (sure-letters talk 2026-10-20): if the weak headline named only the letters the detector is
   sure are missing, how many wrong headlines go away, how many right ones lose a letter, how many name none?
   node research/2026-10-20-sure-letters-probe.js > research/2026-10-20-sure-letters-probe.tsv
   Reads data/train_*.jsonl only. Writes nothing in the repo; out-of-fold weights go to the OS temp folder
   (tests/train.js --out, same 5-fold split as research/2026-10-20-quote-line-probe.js) and are deleted at the end.
   Target: the visible weak headline "The AI would have to guess <what to read> and <the one thing you want back>."
   (engine/rewrite.js; no files attached in training rows). It names S and/or O, whichever the detector calls missing.
   A named letter is FALSE when the row's label says the prompt has it; the line is SILENT on a letter when the
   label says it is missing and the line does not name it. Wrong = FALSE or SILENT (the 147-of-430 definition,
   restricted to S and O, which is all the headline speaks about).
   Sure rule: name letter k only when the detector calls it missing AND prob[k] < cut. No letter sure = fallback. */
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const M = require(ROOT + '/engine/model.js'), W = require(ROOT + '/engine/rewrite.js'), C = require(ROOT + '/engine/classify.js');
const read = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const rows = ['fr', 'grc', 'sus', 'hard'].flatMap((d) => read(path.join(ROOT, 'data/train_' + d + '.jsonl')).map((r, i) => ({ ...r, src: 'train_' + d + ':' + (i + 1) })));
const CLS = C.unpack(JSON.parse(fs.readFileSync(ROOT + '/engine/cls-weights.json')));
const SHIPPED = JSON.parse(fs.readFileSync(ROOT + '/engine/weights.json'));

const FOLDS = 5, fold = rows.map((_, i) => i % FOLDS), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sure-probe-'));
const foldW = [];
for (let k = 0; k < FOLDS; k++) {
  const tr = path.join(TMP, 'train' + k + '.jsonl'), out = path.join(TMP, 'w' + k + '.json');
  fs.writeFileSync(tr, rows.filter((_, i) => fold[i] !== k).map((r) => JSON.stringify(r)).join('\n'));
  cp.execFileSync(process.execPath, [ROOT + '/tests/train.js', SHIPPED.mode, '--out', out, tr], { stdio: 'ignore' });
  foldW.push({ ...JSON.parse(fs.readFileSync(out)), thr: SHIPPED.thr });
}
fs.rmSync(TMP, { recursive: true, force: true });
const detector = (w) => (p) => { const r = M.predict(p, w, { mode: w.mode }); return { on: r.on, prob: r.prob, d: r.rules }; };

const SO = ['S', 'O'];
const score = (named, r) => {
  const fals = named.filter((k) => r[k] === 1), silent = SO.filter((k) => r[k] === 0 && !named.includes(k));
  return { fals, silent, wrong: fals.length > 0 || silent.length > 0 };
};
const CUTS = [['shipped', 1], ['p<0.3', 0.3], ['p<0.2', 0.2], ['p<0.1', 0.1]];
const runAll = (label, detOf) => {
  const t = Object.fromEntries(CUTS.map(([c]) => [c, { weak: 0, wrong: 0, falseLines: 0, silentLines: 0, wrongGone: 0, falseGone: 0, newWrong: 0, rightLostLetter: 0, lostCorrectLetters: 0, droppedFalseLetters: 0, noLetter: 0, noLetterLabelMissing: 0, changed: 0 }]));
  const tsv = [];
  rows.forEach((r, i) => {
    const det = detOf(i), o = W.coach(r.prompt, { files: [], detect: det, ...C.pick(r.prompt, CLS) });
    if (o.grade !== 'weak') return;
    const pr = det(r.prompt).prob, base = SO.filter((k) => !o.detected[k]), b = score(base, r), cells = [];
    for (const [c, cut] of CUTS) {
      const x = t[c], named = base.filter((k) => pr[k] < cut), s = score(named, r), dropped = base.filter((k) => !named.includes(k));
      x.weak++;
      if (s.wrong) x.wrong++; if (s.fals.length) x.falseLines++; if (s.silent.length) x.silentLines++;
      if (b.wrong && !s.wrong) x.wrongGone++; if (b.fals.length && !s.fals.length) x.falseGone++;
      if (!b.wrong && s.wrong) x.newWrong++;
      const lostOK = dropped.filter((k) => r[k] === 0).length;
      x.lostCorrectLetters += lostOK; x.droppedFalseLetters += dropped.length - lostOK;
      if (!b.wrong && lostOK) x.rightLostLetter++;
      if (!named.length) { x.noLetter++; if (SO.some((k) => r[k] === 0)) x.noLetterLabelMissing++; }
      if (dropped.length) x.changed++;
      cells.push(named.join('') || '(none)');
    }
    tsv.push([label, r.src, ['S', 'C', 'O', 'P', 'E'].map((k) => (r[k] ? k : '-')).join(''), pr.S.toFixed(2), pr.O.toFixed(2), base.join(''), b.wrong ? 'WRONG' : 'ok', ...cells, o.headline, r.prompt.replace(/\s+/g, ' ')].join('\t'));
  });
  return { t, tsv };
};
const ins = runAll('in-sample', () => detector(SHIPPED)), oof = runAll('oof', (i) => detector(foldW[fold[i]]));
console.log(['set', 'src', 'label SCOPE', 'pS', 'pO', 'named now', 'now', ...CUTS.map(([c]) => 'named ' + c), 'headline now', 'prompt'].join('\t'));
console.log([...ins.tsv, ...oof.tsv].join('\n'));
for (const [name, res] of [['in-sample', ins], ['out of fold', oof]])
  for (const [c] of CUTS) console.log(`# ${name} ${c}: ${JSON.stringify(res.t[c])}`);
