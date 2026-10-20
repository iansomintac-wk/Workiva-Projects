/* Read-only probe (talk 2026-10-20): can the weak-prompt reason line quote the prompt's own words, and how often
   does the quote sit on the wrong words?
   node research/2026-10-20-quote-line-probe.js > research/2026-10-20-quote-line-probe.tsv
   Reads data/train_*.jsonl and research/live-tests/cases.json only. Writes nothing in the repo; the out-of-fold
   detector weights go to the OS temp folder (tests/train.js --out) and are deleted at the end.
   Two span rules, both on the prompt's own words:
     ask (O)    the clause that starts at a vague verb (the coach's own VAGUE_VERB list), up to . ; ? ! or a line
                break, at most 8 words. strict: the verb opens a sentence (after please / can you / I need you to);
                loose: the verb is anywhere.
     source (S) the noun phrase after the main verb (engine objectOf, the same one Strong uses), e.g. "the deck".
   A quote is shown only for a letter the detector calls missing, and only when its probability is under a "sure"
   cut. The line then says that letter is missing about the quoted words, so the quote is RIGHT when the label
   says that letter is missing and a MISQUOTE when the label says the prompt has it.
   Scored twice: in-sample (the shipped detector, trained on these rows) and out of fold (detector retrained by
   tests/train.js on 4 of 5 folds, same fold split as research/2026-10-20-bare-analyze-format-probe.js, with the
   shipped thresholds). */
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

// same vague-verb list as engine/rewrite.js VAGUE_VERB
const VAGUE_VERB = /\b(?:analy[sz]e|look at|look over|go over|review|check|help|assist|work on|handle|thoughts|improve|clean up|take a look|have a look|figure out|investigate|examine|evaluate|assess|tell me about)\b/i;
const LEAD = /(?:^|[.!?\n]\s*|:\s*)(?:(?:hey|hi|ok|okay|so|just|quick(?:ly)?|please|pls|plz|can (?:you|u)|could (?:you|u)|would you|i need (?:you )?to|i want (?:you )?to|need (?:you )?to|want (?:you )?to|i'?d like (?:you )?to)[\s,]+)*$/i;
const words = (s) => s.trim().split(/\s+/);
function askSpan(prompt, strict) {
  const re = new RegExp(VAGUE_VERB.source, 'gi'); let m;
  while ((m = re.exec(prompt))) {
    if (strict && !LEAD.test(prompt.slice(0, m.index))) continue;
    let s = prompt.slice(m.index).split(/[.;?!\n]/)[0].replace(/[\s,:-]+$/, '');
    const w = words(s); if (w.length > 8) s = w.slice(0, 8).join(' ') + '...';
    return s;
  }
  return null;
}
function sourceSpan(prompt) {
  const o = W.objectOf(R.normalize(prompt)); if (!o) return null;
  const i = prompt.toLowerCase().indexOf(o);
  return i >= 0 ? prompt.slice(i, i + o.length) : null; // only words that are in the prompt as typed
}
// several asks: clauses split at the stacking connectors, each with a verb the coach knows
const JOB = /\b(?:summari[sz]e|draft|write|rewrite|translate|fix|build|create|make|map|tie out|compare|explain|extract|pull|update|email|send|remind|list|flag|find|identify|prepare|put together|calculate|reconcile|format)\b/i;
const asks = (p) => p.split(/\b(?:and also|also|and then|then|plus|additionally|as well as|separately|oh and)\b|;|\.\s+/i).map((s) => s.trim()).filter((s) => VAGUE_VERB.test(s) || JOB.test(s));

const CUTS = [['any', 1], ['p<0.2', 0.2], ['p<0.1', 0.1]];
const runAll = (label, detOf) => {
  const t = Object.fromEntries(CUTS.map(([c]) => [c, { weak: 0, askClaim: 0, askStrict: 0, askLoose: 0, askRight: 0, askMis: 0, srcClaim: 0, srcSpan: 0, srcRight: 0, srcMis: 0, quoted: 0, mis: 0, noQuote: 0 }]));
  const st = { weakStacked: 0, quotable: 0 }; const tsv = [];
  rows.forEach((r, i) => {
    const det = detOf(i), o = W.coach(r.prompt, { files: [], detect: det, ...C.pick(r.prompt, CLS) });
    if (o.grade !== 'weak') return;
    const pr = det(r.prompt).prob, strictA = askSpan(r.prompt, true), looseA = askSpan(r.prompt, false), srcA = sourceSpan(r.prompt);
    if (r.stacked) { st.weakStacked++; if (asks(r.prompt).length >= 2) st.quotable++; }
    const cells = [];
    for (const [c, cut] of CUTS) {
      const x = t[c]; x.weak++;
      const qa = !o.detected.O && pr.O < Math.min(cut, SHIPPED.thr.O + 1e-9) && strictA, qs = !o.detected.S && pr.S < Math.min(cut, SHIPPED.thr.S + 1e-9) && srcA;
      if (!o.detected.O) { x.askClaim++; if (strictA) x.askStrict++; if (looseA) x.askLoose++; }
      if (!o.detected.S) { x.srcClaim++; if (srcA) x.srcSpan++; }
      if (qa) { x.quoted++; if (r.O === 0) x.askRight++; else { x.askMis++; x.mis++; } }
      if (qs) { x.quoted++; if (r.S === 0) x.srcRight++; else { x.srcMis++; x.mis++; } }
      if (!qa && !qs) x.noQuote++;
      cells.push((qa ? (r.O === 0 ? 'askOK' : 'askMIS') : '-') + '/' + (qs ? (r.S === 0 ? 'srcOK' : 'srcMIS') : '-'));
    }
    const lab = ['S', 'C', 'O', 'P', 'E'].map((k) => (r[k] ? k : '-')).join('');
    tsv.push([label, r.src, lab, r.stacked, pr.O.toFixed(2), pr.S.toFixed(2), ...cells, strictA || '-', looseA || '-', srcA || '-', r.prompt.replace(/\s+/g, ' ')].join('\t'));
  });
  return { t, st, tsv };
};
const ins = runAll('in-sample', () => detector(SHIPPED)), oof = runAll('oof', (i) => detector(foldW[fold[i]]));

console.log(['set', 'src', 'label SCOPE', 'stacked', 'pO', 'pS', ...CUTS.map(([c]) => 'quote ' + c), 'ask span strict', 'ask span loose', 'source span', 'prompt'].join('\t'));
console.log([...ins.tsv, ...oof.tsv].join('\n'));
const live = JSON.parse(fs.readFileSync(ROOT + '/research/live-tests/cases.json'));
for (const cs of live) {
  const o = W.coach(cs.prompt, { files: [], detect: detector(SHIPPED), ...C.pick(cs.prompt, CLS) });
  console.log(['# live', cs.id, o.grade, askSpan(cs.prompt, true) || '-', sourceSpan(cs.prompt) || '-'].join('\t'));
}
for (const [name, res] of [['in-sample', ins], ['out of fold', oof]]) {
  console.log(`# ${name}: weak stacked ${res.st.weakStacked}, of them with 2+ ask clauses a rule can quote: ${res.st.quotable}`);
  for (const [c] of CUTS) console.log(`# ${name} ${c}: ${JSON.stringify(res.t[c])}`);
}
