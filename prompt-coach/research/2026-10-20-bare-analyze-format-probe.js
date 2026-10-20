/* Read-only probe (talk 2026-10-20): how often does a bare "analyze/review X" get a wrong task format in Strong?
   node research/2026-10-20-bare-analyze-format-probe.js > research/2026-10-20-bare-analyze-format-probe.tsv
   Reads data/train_*.jsonl and research/live-tests/cases.json only; writes nothing but stdout.
   Bare ask: the vague verb list the coach itself uses, no task word its patterns know (intentOf strict = null),
   and (train rows) the label says no objective (O = 0).
   The shipped classifier was trained on these same rows, so its in-sample picks are optimistic; the probe also
   retrains it in memory on 5 folds (same code and seed as tests/train_cls.js) and scores each row out of fold. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const R = require(ROOT + '/engine/rules.js'), M = require(ROOT + '/engine/model.js'), W = require(ROOT + '/engine/rewrite.js'), C = require(ROOT + '/engine/classify.js');
const read = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const rows = ['fr', 'grc', 'sus', 'hard'].flatMap((d) => read(path.join(ROOT, 'data/train_' + d + '.jsonl')).map((r, i) => ({ ...r, src: 'train_' + d + ':' + (i + 1) })));
const SHIPPED = C.unpack(JSON.parse(fs.readFileSync(ROOT + '/engine/cls-weights.json')));
const detW = JSON.parse(fs.readFileSync(ROOT + '/engine/weights.json'));
const detect = (p) => { const r = M.predict(p, detW, { mode: detW.mode }); return { on: r.on, d: r.rules }; };

// same vague-verb list as engine/rewrite.js VAGUE_VERB
const VAGUE_VERB = /\b(?:analy[sz]e|look at|look over|go over|review|check|help|assist|work on|handle|thoughts|improve|clean up|take a look|have a look|figure out|investigate|examine|evaluate|assess|tell me about)\b/i;
const bare = (p) => VAGUE_VERB.test(p) && !W.intentOf(R.normalize(p), false, true);

// copy of trainHead in tests/train_cls.js (kept in memory; engine/cls-weights.json is never written)
const PRUNE = 0.15; let seed = 42; const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function trainHead(X, y, labels, { epochs = 40, lr = 0.8, l2 = 5e-5 } = {}) {
  const K = labels.length, idx = y.map((l) => labels.indexOf(l)); const w = new Map(), b = new Float64Array(K);
  const get = (i) => { let r = w.get(i); if (!r) { r = new Float64Array(K); w.set(i, r); } return r; };
  const order = X.map((_, i) => i);
  for (let ep = 0; ep < epochs; ep++) {
    for (let i = order.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
    const rate = lr / (1 + ep * 0.1);
    for (const n of order) {
      const x = X[n]; const z = new Float64Array(K);
      for (let c = 0; c < K; c++) { let s = b[c]; for (const [i, v] of x) { const r = w.get(i); if (r) s += r[c] * v; } z[c] = s; }
      const m = Math.max(...z); let sum = 0; for (let c = 0; c < K; c++) { z[c] = Math.exp(z[c] - m); sum += z[c]; }
      for (let c = 0; c < K; c++) { const g = z[c] / sum - (c === idx[n] ? 1 : 0); b[c] -= rate * g; for (const [i, v] of x) { const r = get(i); r[c] -= rate * (g * v + l2 * r[c]); } }
    }
  }
  const out = {}; for (const [i, r] of w) { const row = []; r.forEach((v, c) => { if (Math.abs(v) > PRUNE) row.push(c, Math.round(v * 100)); }); if (row.length) out[i] = row; }
  return { labels, b: [...b].map((v) => Math.round(v * 100)), w: out, scale: 100 };
}
const intentLabels = [...new Set(rows.map((r) => r.intent))].sort(), domainLabels = ['FR', 'GRC', 'SUS', 'GEN'];
const FOLDS = 5, fold = rows.map((_, i) => i % FOLDS), oof = new Array(rows.length);
for (let k = 0; k < FOLDS; k++) {
  const tr = rows.filter((_, i) => fold[i] !== k), X = tr.map((r) => C.featurize(r.prompt));
  const wk = C.unpack({ intent: trainHead(X, tr.map((r) => r.intent), intentLabels), domain: trainHead(X, tr.map((r) => r.domain), domainLabels) });
  rows.forEach((r, i) => { if (fold[i] === k) oof[i] = C.pick(r.prompt, wk); });
}

const fmtLine = (s) => s.replace(/\s+/g, ' ').trim(); // the whole Strong prompt, one line
const verdict = (pk, label) => (!pk.taskSure ? 'blank' : pk.intent === label ? 'right' : 'WRONG');
const out = ['src\tset\tlabel\tshipped\tshipped_p\tshipped_v\toof\toof_v\tprompt\tstrong(shipped pick)'];
const tally = { shipped: {}, oof: {} }; let nBare = 0, nVagueO0 = 0;
rows.forEach((r, i) => {
  if (r.O !== 0 || !VAGUE_VERB.test(r.prompt)) return; nVagueO0++;
  if (!bare(r.prompt)) return; nBare++;
  const ps = C.pick(r.prompt, SHIPPED), c = C.classify(r.prompt, SHIPPED), vs = verdict(ps, r.intent), vo = verdict(oof[i], r.intent);
  tally.shipped[vs] = (tally.shipped[vs] || 0) + 1; tally.oof[vo] = (tally.oof[vo] || 0) + 1;
  const o = W.coach(r.prompt, { files: [], detect, ...ps });
  out.push([r.src, 'train', r.intent, ps.intent || '-', c.intent.p.toFixed(2), vs, oof[i].intent || '-', vo, r.prompt, o.grade === 'strong' ? '(already strong)' : fmtLine(o.stages.strong.prompt)].join('\t'));
});
const live = JSON.parse(fs.readFileSync(ROOT + '/research/live-tests/cases.json'));
let nLive = 0;
for (const cs of live) {
  if (!bare(cs.prompt)) continue; nLive++;
  const ps = C.pick(cs.prompt, SHIPPED), c = C.classify(cs.prompt, SHIPPED);
  const o = W.coach(cs.prompt, { files: [], detect, ...ps });
  out.push([cs.id, 'live', '(unlabeled)', ps.intent || '-', c.intent.p.toFixed(2), ps.taskSure ? 'sure' : 'blank', '-', '-', cs.prompt, o.grade === 'strong' ? '(already strong)' : fmtLine(o.stages.strong.prompt)].join('\t'));
}
console.log(out.join('\n'));
console.log(`# train rows ${rows.length}; vague verb and O=0: ${nVagueO0}; bare (no known task word): ${nBare}`);
console.log(`# shipped classifier (in-sample): ${JSON.stringify(tally.shipped)}`);
console.log(`# 5-fold out-of-fold: ${JSON.stringify(tally.oof)}`);
console.log(`# live-test cases ${live.length}; bare: ${nLive}`);
