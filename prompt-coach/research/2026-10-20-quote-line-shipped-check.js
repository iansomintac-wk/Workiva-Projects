/* Drop check, spec criterion 2, read on the headline. node research/2026-10-20-quote-line-shipped-check.js > research/2026-10-20-quote-line-shipped-check.tsv. Setup copied from the 2026-10-20 probe, which and whose counts are untouched. */
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const R = require(ROOT + '/engine/rules.js'), M = require(ROOT + '/engine/model.js'), W = require(ROOT + '/engine/rewrite.js'), C = require(ROOT + '/engine/classify.js');
const read = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const rows = ['fr', 'grc', 'sus', 'hard'].flatMap((d) => read(path.join(ROOT, 'data/train_' + d + '.jsonl')).map((r, i) => ({ ...r, src: 'train_' + d + ':' + (i + 1) })));
const CLS = C.unpack(JSON.parse(fs.readFileSync(ROOT + '/engine/cls-weights.json')));
const SHIPPED = JSON.parse(fs.readFileSync(ROOT + '/engine/weights.json'));

// out-of-fold detectors: retrain with the repo's own trainer on 4 folds, never touching engine/weights.json
const FOLDS = 5, fold = rows.map((_, i) => i % FOLDS), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'quote-probe-'));
const foldW = [];
for (let k = 0; k < FOLDS; k++) {
  const tr = path.join(TMP, 'train' + k + '.jsonl'), out = path.join(TMP, 'w' + k + '.json');
  fs.writeFileSync(tr, rows.filter((_, i) => fold[i] !== k).map((r) => JSON.stringify(r)).join('\n'));
  cp.execFileSync(process.execPath, [ROOT + '/tests/train.js', SHIPPED.mode, '--out', out, tr], { stdio: 'ignore' });
  foldW.push({ ...JSON.parse(fs.readFileSync(out)), thr: SHIPPED.thr });
}
fs.rmSync(TMP, { recursive: true, force: true });
const detector = (w) => (p) => { const r = M.predict(p, w, { mode: w.mode }); return { on: r.on, prob: r.prob, d: r.rules }; };
const out = []; let weak = 0, quoted = 0, misLabel = 0;
rows.forEach((r, i) => {
  const o = W.coach(r.prompt, { files: [], detect: detector(foldW[fold[i]]), ...C.pick(r.prompt, CLS) });
  if (o.grade !== 'weak') return; weak++;
  const m = /The coach read your ask as "(.*?)"(?=[.:])/.exec(o.headline); if (!m) return;
  quoted++; if (r.O !== 0) misLabel++;
  out.push([r.src, ['S', 'C', 'O', 'P', 'E'].map((k) => (r[k] ? k : '-')).join(''), r.O === 0 ? 'labelOK' : 'labelMIS', m[1], r.prompt.replace(/\s+/g, ' '), o.headline].join('\t'));
});
console.log(['src', 'label SCOPE', 'by label', 'quoted span', 'prompt', 'headline'].join('\t'));
console.log(out.join('\n'));
console.log(`# out of fold: weak ${weak}, quoted ${quoted}, wrong by label ${misLabel}`);
