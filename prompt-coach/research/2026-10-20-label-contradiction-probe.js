/* Read-only probe (label-fix talk 2026-10-20): how often do near-identical training prompts carry opposite S or O
   labels, and how many of the 46 out-of-fold false letters (research/2026-10-20-sure-letters-probe.tsv, oof rows)
   have such a twin?
   node research/2026-10-20-label-contradiction-probe.js
   Reads data/train_*.jsonl and the sure-letters TSV only. Writes research/2026-10-20-label-contradiction-*.tsv.
   No held-out or sealed file, no data/test.jsonl.
   Normalise: lowercase words; drop leading filler ("can you", "pls", "help me"); verb = first word left.
   Strict group = verb + first content word after it (the object noun). Loose twin of row r on letter k = another
   row with the same verb, content-word Jaccard >= 1/3, word counts within x2, and the opposite label on k. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const rows = ['fr', 'grc', 'sus', 'hard'].flatMap((d) => read(path.join(ROOT, 'data/train_' + d + '.jsonl')).map((r, i) => ({ ...r, src: 'train_' + d + ':' + (i + 1) })));
const bySrc = new Map(rows.map((r) => [r.src, r]));

const FILLER = new Set('can could would will you u pls please plz hey hi ok okay so quick quickly i need want to help me just kindly lets let us go ahead and also now then hello thanks thank'.split(' '));
const STOP = new Set('the a an this these that those our my your their its it them me us we i you u to for of in on at by with from and or but also all any some each every is are be as into about what which how pls please can could would just so then there here out up do does did have has get'.split(' '));
const norm = (p) => {
  const w = p.toLowerCase().match(/[a-z0-9]+/g) || [];
  let i = 0; while (i < w.length && FILLER.has(w[i])) i++;
  const verb = w[i] || '';
  const rest = w.slice(i + 1).filter((t) => !STOP.has(t));
  return { verb, obj: rest[0] || '', content: new Set([verb, ...rest].filter(Boolean)), n: w.length };
};
rows.forEach((r) => (r.nm = norm(r.prompt)));
const jac = (a, b) => { let x = 0; for (const t of a) if (b.has(t)) x++; return x / (a.size + b.size - x || 1); };
const short = (s) => s.replace(/\s+/g, ' ').slice(0, 140);

// 1. Strict groups: verb + object noun, size >= 2, labels disagree on S or O.
const groups = new Map();
rows.forEach((r) => { const k = r.nm.verb + '|' + r.nm.obj; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
const multi = [...groups.entries()].filter(([, g]) => g.length >= 2);
const dis = (g, k) => new Set(g.map((r) => r[k])).size > 1;
const disS = multi.filter(([, g]) => dis(g, 'S')), disO = multi.filter(([, g]) => dis(g, 'O'));
const disAny = multi.filter(([, g]) => dis(g, 'S') || dis(g, 'O'));
const gl = ['key\tsize\tdisagree\tmembers (src label prompt)'];
disAny.sort((a, b) => b[1].length - a[1].length).forEach(([k, g]) => gl.push([k, g.length, (dis(g, 'S') ? 'S' : '') + (dis(g, 'O') ? 'O' : ''),
  g.map((r) => r.src + ' S' + r.S + 'O' + r.O + ' ' + short(r.prompt)).join(' || ')].join('\t')));
fs.writeFileSync(path.join(__dirname, '2026-10-20-label-contradiction-groups.tsv'), gl.join('\n') + '\n');

// 2. Loose contradicting pairs across all training rows.
let pairsS = 0, pairsO = 0; const inPairS = new Set(), inPairO = new Set();
const twinOf = (r, k) => {
  let best = null;
  for (const q of rows) {
    if (q === r || q.nm.verb !== r.nm.verb || q[k] === r[k]) continue;
    if (Math.max(q.nm.n, r.nm.n) > 2 * Math.min(q.nm.n, r.nm.n)) continue;
    const j = jac(q.nm.content, r.nm.content);
    if (j >= 1 / 3 && (!best || j > best.j)) best = { q, j };
  }
  return best;
};
for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
  const r = rows[a], q = rows[b];
  if (r.nm.verb !== q.nm.verb || Math.max(q.nm.n, r.nm.n) > 2 * Math.min(q.nm.n, r.nm.n) || jac(q.nm.content, r.nm.content) < 1 / 3) continue;
  if (r.S !== q.S) { pairsS++; inPairS.add(r.src).add(q.src); }
  if (r.O !== q.O) { pairsO++; inPairO.add(r.src).add(q.src); }
}

// 3. The 46 out-of-fold false letters and their twins.
const tsv = fs.readFileSync(path.join(__dirname, '2026-10-20-sure-letters-probe.tsv'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
const head = tsv[0].split('\t'), I = (c) => head.indexOf(c);
const falseLetters = [];
tsv.slice(1).map((l) => l.split('\t')).filter((c) => c[0] === 'oof').forEach((c) => {
  const r = bySrc.get(c[I('src')]);
  for (const k of ['S', 'O']) if (c[I('named now')].includes(k) && r[k] === 1) falseLetters.push({ r, k, p: c[I('p' + k)] });
});
const out = ['src\tletter\tp\tstrict group disagrees\tloose twin\tjaccard\ttwin label\tprompt\ttwin prompt'];
let strictHit = 0, looseHit = 0, eitherHit = 0;
falseLetters.forEach(({ r, k, p }) => {
  const g = groups.get(r.nm.verb + '|' + r.nm.obj), sg = g.some((q) => q[k] !== r[k]);
  const t = twinOf(r, k);
  if (sg) strictHit++; if (t) looseHit++; if (sg || t) eitherHit++;
  out.push([r.src, k, p, sg ? 'yes' : 'no', t ? t.q.src : '', t ? t.j.toFixed(2) : '', t ? 'S' + t.q.S + 'O' + t.q.O : '', short(r.prompt), t ? short(t.q.prompt) : ''].join('\t'));
});
fs.writeFileSync(path.join(__dirname, '2026-10-20-label-contradiction-false-letters.tsv'), out.join('\n') + '\n');

console.log(JSON.stringify({
  rows: rows.length, strictGroups: groups.size, strictGroupsSize2: multi.length,
  strictDisagreeS: disS.length, strictDisagreeO: disO.length, strictDisagreeAny: disAny.length,
  rowsInStrictDisagree: disAny.reduce((s, [, g]) => s + g.length, 0),
  loosePairsS: pairsS, loosePairsO: pairsO, rowsInLoosePairS: inPairS.size, rowsInLoosePairO: inPairO.size,
  falseLetters: falseLetters.length, falseS: falseLetters.filter((f) => f.k === 'S').length,
  falseWithStrictContradiction: strictHit, falseWithLooseTwin: looseHit, falseWithEither: eitherHit,
}));

// 4. Bare "this/these/it" rows: a demonstrative with no source word anywhere in the prompt. Owner's rule (README,
//    simulated-customer review): a bare "this" does not name a source; "this para", "the doc" do. S label split.
const SRCW = /\b(selected|selection|highlighted|attached|attachment|sheet|tab|cell|cells|doc|document|file|table|slide|slides|deck|report|section|note|footnote|paragraph|para|column|row|rows|query|intelligence|memo|email|policy|rcm|xlsx|pdf|tracker|register|draft|finding|deficiency|entry|letter|release|narrative|wording|text|sentence|bullet|bullets|chart|page)\b/i;
const bare = rows.filter((r) => /\b(this|these|it)\b/i.test(r.prompt) && !SRCW.test(r.prompt));
const bl = ['src\tS\tO\tprompt'];
bare.forEach((r) => bl.push([r.src, r.S, r.O, short(r.prompt)].join('\t')));
fs.writeFileSync(path.join(__dirname, '2026-10-20-label-contradiction-bare-this.tsv'), bl.join('\n') + '\n');
console.log(JSON.stringify({ bareThisRows: bare.length, bareThisS1: bare.filter((r) => r.S === 1).length, bareThisS0: bare.filter((r) => r.S === 0).length }));
