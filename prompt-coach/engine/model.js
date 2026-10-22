/* Tiny per-element logistic regression over hashed text features + rule hits.
   predict(prompt, weights, {mode:'model'|'hybrid'}) -> {on, prob, stacked, el} */
(function (root) {
  const R = typeof module !== 'undefined' && module.exports ? require('./rules.js') : root.ScopeRules;
  const K = ['S', 'C', 'O', 'P', 'E'];
  const DIM = 1 << 18;

  function hash(s) { // FNV-1a 32-bit
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0) % DIM;
  }

  function featurize(prompt, opts) {
    const useRules = !opts || opts.mode !== 'model';
    const useText = !opts || opts.mode !== 'rulefeat';
    const d = R.detect(prompt, opts);
    const t = d.text.replace(/[^a-z0-9&$%#./' -]/g, ' ').replace(/\s+/g, ' ').trim();
    const toks = t.split(' ').filter(Boolean);
    const f = new Map();
    const add = (k, v = 1) => { const h = hash(k); f.set(h, (f.get(h) || 0) + v); };
    add('__bias');
    for (let i = 0; useText && i < toks.length; i++) {
      const w = toks[i].replace(/^\d+(\.\d+)?$/, '<num>').replace(/^\d+%$/, '<pct>');
      add('w:' + w);
      if (i + 1 < toks.length) add('b:' + w + '_' + toks[i + 1].replace(/^\d+(\.\d+)?$/, '<num>'));
      if (i + 2 < toks.length) add('t:' + w + '_' + toks[i + 1] + '_' + toks[i + 2]);
    }
    const padded = ' ' + t + ' ';
    for (let i = 0; useText && i + 4 <= padded.length; i++) add('c:' + padded.slice(i, i + 4), 0.3);
    const lenBucket = toks.length < 6 ? 'xs' : toks.length < 15 ? 's' : toks.length < 35 ? 'm' : toks.length < 70 ? 'l' : 'xl';
    add('len:' + lenBucket);
    if (useRules) {
      for (const k of K) {
        const e = d.el[k];
        add('r:' + k + ':on', e.on ? 1 : 0);
        add('r:' + k + ':score', Math.min(e.score, 3));
        for (const h of e.hits) add('rt:' + k + ':' + h.tag);
      }
      for (const v of d.vague) add('vague:' + v);
    }
    // L2-normalize text features so long prompts don't dominate
    let norm = 0; for (const v of f.values()) norm += v * v; norm = Math.sqrt(norm) || 1;
    const out = []; for (const [k, v] of f) out.push([k, v / norm]);
    if (opts && opts.mode === 'rulefeat') {
      // each letter sees only its own cues plus shared signals, so one letter can't vouch for another
      const per = {};
      for (const k of K) {
        const g = new Map(); const put = (key, v = 1) => { const h = hash(key); g.set(h, (g.get(h) || 0) + v); };
        put('__bias'); put('len:' + lenBucket);
        const e = d.el[k];
        put('r:' + k + ':on', e.on ? 1 : 0); put('r:' + k + ':score', Math.min(e.score, 3));
        for (const h of e.hits) put('rt:' + k + ':' + h.tag);
        for (const v of d.vague) put('vague:' + v);
        let n2 = 0; for (const v of g.values()) n2 += v * v; n2 = Math.sqrt(n2) || 1;
        per[k] = [...g].map(([h, v]) => [h, v / n2]);
      }
      return { x: out, per, d };
    }
    return { x: out, d };
  }

  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }

  function predict(prompt, weights, opts) {
    const mode = (opts && opts.mode) || weights.mode || 'hybrid';
    const { x, per, d } = featurize(prompt, { ...opts, mode });
    const on = {}, prob = {};
    for (const k of K) {
      const W = weights.w[k]; let z = W.b || 0;
      for (const [i, v] of (per ? per[k] : x)) { const wi = W.v[i]; if (wi) z += wi * v; }
      prob[k] = sigmoid(z); on[k] = prob[k] >= (weights.thr && weights.thr[k] || 0.5);
    }
    if (d.text.trim().split(/\s+/).length <= 2 && !d.el.O.on) on.O = false; // greetings
    return { on, prob, sure: weights.sure || null, stacked: d.stacked, el: d.el, vague: d.vague, rules: d };
  }

  const api = { featurize, predict, hash, DIM };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ScopeModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
