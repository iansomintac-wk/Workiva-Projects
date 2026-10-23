/* Task (intent) and area (domain) classifier: softmax regression over hashed words + pattern hits.
   classify(prompt, weights) -> { intent: {label, p}, domain: {label, p} } */
(function (root) {
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('./rules.js') : root.ScopeRules;
  const W = isNode ? require('./rewrite.js') : root.ScopeRewrite;
  const DIM = 1 << 14;
  function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0) % DIM; }
  const FEATS = { bigram: false, prefix: false }; // word pairs and prefixes added size without accuracy
  const STOP = new Set('the a an of to for and or in on with at by from is are be please can could would you i we me my our this that it'.split(' '));

  function featurize(prompt) {
    const t = R.normalize(prompt);
    const toks = t.replace(/[^a-z0-9&%' -]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
    const f = new Map();
    const add = (k, v = 1) => { const h = hash(k); f.set(h, (f.get(h) || 0) + v); };
    add('__bias');
    for (let i = 0; i < toks.length; i++) {
      const w = toks[i].replace(/^\d+(\.\d+)?%?$/, '<num>');
      add('w:' + w);
      if (FEATS.bigram && i + 1 < toks.length) add('b:' + w + '_' + toks[i + 1]);
      if (FEATS.prefix) add('s:' + w.slice(0, 5));
      if (i < 4) add('first:' + w); // the leading verb carries most of the task
    }
    for (const [name, re] of W.INTENTS) if (re.test(t)) add('ri:' + name, 2);
    for (const [name, re] of Object.entries(W.DOMAIN)) { const n = (t.match(new RegExp(re.source, 'g')) || []).length; if (n) add('rd:' + name, Math.min(n, 3)); }
    let norm = 0; for (const v of f.values()) norm += v * v; norm = Math.sqrt(norm) || 1;
    return [...f].map(([k, v]) => [k, v / norm]);
  }

  // expand the compact integer format into per-feature class arrays once at load
  function unpack(raw) {
    const out = {};
    for (const key of ['intent', 'domain']) {
      const h = raw[key], K = h.labels.length, w = {};
      for (const [i, flat] of Object.entries(h.w)) { const row = new Float32Array(K); for (let j = 0; j < flat.length; j += 2) row[flat[j]] = flat[j + 1] / h.scale; w[i] = row; }
      out[key] = { labels: h.labels, b: h.b.map((v) => v / h.scale), w };
    }
    return out;
  }

  function softmaxHead(x, head) {
    const z = head.labels.map((_, c) => { let s = head.b[c]; for (const [i, v] of x) { const w = head.w[i]; if (w) s += (w[c] || 0) * v; } return s; });
    const m = Math.max(...z); const e = z.map((v) => Math.exp(v - m)); const sum = e.reduce((a, b) => a + b, 0);
    let best = 0; for (let c = 1; c < e.length; c++) if (e[c] > e[best]) best = c;
    return { label: head.labels[best], p: e[best] / sum, probs: Object.fromEntries(head.labels.map((l, c) => [l, e[c] / sum])) };
  }

  function classify(prompt, weights) {
    const x = featurize(prompt);
    return { intent: softmaxHead(x, weights.intent), domain: softmaxHead(x, weights.domain) };
  }

  // Task and area for the coach: trust the classifier when it is confident, else fall back to
  // patterns and report that it is unsure (the coach then adds blanks instead of a task template).
  function pick(prompt, weights) {
    const c = classify(prompt, weights);
    let taskSure = c.intent.label !== 'other' && c.intent.p >= 0.5;
    const pattern = W.intentOf(R.normalize(prompt), false, true);
    // "SoD conflicts" / "conflict of interest" are not a compare-two-sources cue: do not take the model's consistency label
    const guarded = c.intent.label === 'consistency' && !pattern && /\b(?:sod|duties)[- ]conflicts?\b|\bconflicts? of interest\b/.test(R.normalize(prompt));
    if (guarded) taskSure = false;
    const intent = guarded ? undefined : (taskSure ? c.intent.label : pattern || (c.intent.label !== 'other' ? c.intent.label : null)) || undefined;
    // a prompt with no area words ("make this sound less harsh") is not sure, however the model leans
    const areaSure = c.domain.p >= 0.85 || (c.domain.p >= 0.5 && W.domainOf(R.normalize(prompt)) !== 'GEN');
    return { intent, domain: areaSure ? c.domain.label : undefined, taskSure, areaSure };
  }

  const api = { featurize, classify, unpack, pick, DIM };
  if (isNode) module.exports = api; else root.ScopeClassify = api;
})(typeof window !== 'undefined' ? window : globalThis);
