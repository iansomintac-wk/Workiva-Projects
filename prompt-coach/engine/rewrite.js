/* Rewrite engine: builds weak / better / strong versions and the SCOPE breakdown without an LLM.
   coach(prompt, {files: [{name, kind, sheets:[{name, headers:[]}], headings:[], slides:[], periods:[], text}]},
         detector) -> { grade, detected, headline, stages:{weak,better,strong}, scope:{S..E}, notes[], intent, domain } */
(function (root) {
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('./rules.js') : root.ScopeRules;
  const K = ['S', 'C', 'O', 'P', 'E'];

  /* ---------------- domain + intent ---------------- */
  const DOMAIN = {
    FR: /\b(10-?k|10-?q|8-?k|20-?f|md&a|mda|footnotes?|sec\b|xbrl|tie-?out|earnings|revenue|ebitda|gaap|non-gaap|ifrs|balance sheet|income statement|cash flow|accruals?|journal entr|trial balance|ledger|flux|close|consolidat|segment|eps|goodwill|lease|asc \d+|comment letter|proxy|annual report|financial statements?|opex|capex|margin|forecast|budget|audit committee)\b/g,
    GRC: /\b(sox|icfr|controls?|rcm|risk (?:and )?control matrix|test (?:steps?|procedures?|of design|of operating)|toe|tod|walkthrough|evidence|deficienc|findings?|coso|nist|iso ?27001|soc ?[12]|itgc|policy|policies|procedures?|risk register|internal audit|audit plan|remediation|segregation of duties|sod|access review|compliance|key control|control owner|narrative|flowchart|attestation)\b/g,
    SUS: /\b(csrd|esrs|issb|ifrs s[12]|ghg|scope [123]|emissions?|co2e?|carbon|climate|tcfd|cdp|double materiality|materiality assessment|sustainability|esg|assurance|net[- ]zero|transition plan|energy|water|waste|biodiversity|supplier data|e1-\d|s1-\d|g1-\d|taxonomy|sbti|decarboni)\b/g
  };
  function domainOf(t) {
    let best = 'GEN', n = 0;
    for (const [d, re] of Object.entries(DOMAIN)) { const c = (t.match(re) || []).length; if (c > n) { n = c; best = d; } }
    return best;
  }
  const INTENTS = [
    ['errors', /\b(errors?|typos?|mistakes?|proofread|grammar|spelling|wrong)/],
    ['gaps', /\b(gaps?|missing (?:controls?|evidence|steps?|owners?|information|disclosures?)|incomplete|deficienc|weakness(?:es)?|not covered|coverage)/],
    ['rewrite', /\b(rewrite|re-?word|rephrase|shorten|tighten|condense|trim|simplify|edit|proofread|polish|make (?:it|this) (?:shorter|clearer|more concise|sound)|plain english|tone)/],
    ['formula', /\b(formula|vlookup|xlookup|sumif|index ?match|pivot|query|sql|wdata|calculated field|excel function)/],
    ['consistency', /\b(consisten|inconsisten|conflict|contradict|tie[- ]?out|tie out|ties to|tick and tie|match(?:es)? (?:the|between)|cross-?check|cross-?reference|discrepanc|mismatch|agree to)/],
    ['anomaly', /\b(anomal|outlier|unusual|missing values?|blank|duplicate|odd|spike|suspicious|data quality|gaps? in the data|errors? in the data)/],
    ['variance', /\b(varian|flux|change[sd]? (?:from|between|vs|versus)|year[- ]over[- ]year|yoy|quarter[- ]over[- ]quarter|qoq|increase|decrease|drove|drivers?|movement|trend|went up|went down|spiked|dropped|grew|declin)/],
    ['map', /\b(map|mapping|crosswalk|align (?:to|with)|which (?:principle|requirement|criteria|control objective)|link (?:each|the) .{0,20}to)/],
    ['questions', /\b(questions?|what would (?:an|the) (?:auditor|reviewer|regulator) ask|challenge|poke holes|red-?team|interview)/],
    ['checklist', /\b(checklist|steps|test procedures?|test steps|to-?do|action items|plan|procedure|walkthrough steps|playbook|how do i|how should we)/],
    ['explain', /\b(explain|what does .{0,40}(?:require|mean)|what is required|requirement|standard|define|definition|meaning of|interpret)/],
    ['compare', /\b(compare|comparison|benchmark|peers?|versus|vs\.?|against (?:the|our|prior)|gap analysis|differences? between)/],
    ['extract', /\b(extract|pull (?:out|together)?|list (?:all|every|each)|find (?:all|every)|capture|collect|inventory of|table of all)/],
    ['draft', /\b(draft|write|compose|create|prepare|generate|produce|put together|come up with)/],
    ['summarize', /\b(summar|overview|recap|tl;?dr|key (?:points|takeaways|themes)|highlights|brief)/]
  ];
  function intentOf(t, hasData, strict) {
    for (const [name, re] of INTENTS) if (re.test(t)) return name;
    if (strict) return null;
    return hasData ? 'variance' : 'summarize';
  }

  /* ---------------- vocabulary per domain ---------------- */
  const ROLE = {
    FR: { def: 'an SEC reporting manager', questions: 'an external auditor reviewing this filing', rewrite: 'a financial reporting editor', explain: 'a technical accounting advisor', map: 'a technical accounting advisor' },
    GRC: { def: 'an internal auditor', questions: 'an external SOX auditor', checklist: 'a SOX compliance lead', map: 'a controls specialist', rewrite: 'a policy writer' },
    SUS: { def: 'a sustainability reporting analyst', questions: 'a sustainability assurance reviewer', explain: 'a CSRD reporting advisor', map: 'a CSRD reporting advisor', rewrite: 'a sustainability report editor' },
    GEN: { def: 'a reporting analyst', rewrite: 'an editor', questions: 'a careful reviewer' }
  };
  const DEST = {
    FR: '[the 10-Q MD&A, the audit committee deck, or the close review]',
    GRC: '[the SOX testing workpapers or the audit committee update]',
    SUS: '[the climate section of the CSRD report or the assurance review]',
    GEN: '[who will read this and what it is for]'
  };
  const OBJECT_DEFAULT = {
    errors: 'text', gaps: 'document', variance: 'table', anomaly: 'table', consistency: 'document', rewrite: 'text', summarize: 'document', draft: 'source material',
    extract: 'document', compare: 'table', explain: 'requirement', questions: 'document', map: 'items', checklist: 'process description', formula: 'range'
  };

  /* ---------------- file grounding ---------------- */
  function words(s) { return (String(s).toLowerCase().match(/[a-z0-9][a-z0-9&%-]{2,}/g) || []); }
  function bestSheet(files, t) {
    const tw = new Set(words(t)); let best = null, score = -1;
    for (const f of files) for (const sh of f.sheets || []) {
      const s = words(sh.name + ' ' + (sh.headers || []).join(' ')).filter((w) => tw.has(w)).length;
      if (s > score) { score = s; best = { file: f, sheet: sh }; }
    }
    return best;
  }
  function periodsIn(files) {
    const set = new Set();
    for (const f of files) for (const p of f.periods || []) set.add(p);
    return [...set].sort();
  }
  function cleanFile(n) { return n.replace(/\s+/g, ' ').trim(); }

  function sourceFragment(ctx) {
    const { files, intent, domain } = ctx;
    if (files.length) {
      const sh = bestSheet(files, ctx.t);
      if (sh && sh.sheet && files.length && (sh.file.sheets || []).length > 1) return 'Use only @' + cleanFile(sh.file.name) + ', sheet "' + sh.sheet.name + '". ';
      if (files.length === 1) return 'Use only @' + cleanFile(files[0].name) + '. ';
      return 'Use only ' + files.slice(0, 10).map((f) => '@' + cleanFile(f.name)).join(', ') + '. ';
    }
    if (intent === 'explain' && domain === 'SUS') return 'Use the ' + (/\b(?:issb|ifrs s[12])\b/.test(ctx.t) ? 'ISSB' : 'ESRS') + ' knowledge base. ';
    if (intent === 'explain') return 'Use the [requirement or standard text] I have selected. ';
    let obj = ctx.object || OBJECT_DEFAULT[intent] || 'content';
    if (ctx.object && !/\b(?:data|table|rows?|columns?|sheet|tab|range|cells?|text|paragraph|section|report|document|doc|deck|slides?|file|memo|policy|matrix|rcm|register|log|list|schedule|note|draft|narrative|controls?|findings|letter|statement|workpaper|release|filing|disclosure)s?$/i.test(ctx.object)) obj += ['variance', 'anomaly', 'compare', 'formula'].includes(intent) ? ' data' : ' section';
    if (['consistency', 'summarize', 'questions'].includes(intent)) return 'Work only from the open ' + (domain === 'GRC' && intent !== 'consistency' ? 'document' : 'report') + '. ';
    return 'Work only from the selected ' + obj + '. ';
  }

  function contextFragment(ctx) {
    const roles = ROLE[ctx.domain] || ROLE.GEN;
    const role = roles[ctx.intent] || roles.def;
    return 'You are ' + role + ' preparing ' + DEST[ctx.domain] + '. ';
  }

  function periodPhrase(ctx) {
    const p = ctx.periods;
    if (p.length >= 2) return p[p.length - 2] + ' and ' + p[p.length - 1];
    return 'the current and prior period';
  }

  function objectiveFragment(ctx) {
    const o = ctx.object ? ' ' + ctx.object : '';
    switch (ctx.intent) {
      case 'errors': return 'Find errors in the' + (o || ' text') + ': wrong numbers, inconsistent terms, typos, and broken references. ';
      case 'gaps': return 'Identify gaps in the' + (o || ' content') + ': anything required that is missing, incomplete, or has no owner. ';
      case 'variance': return 'Identify the largest changes' + (o ? ' in the' + o : '') + ' between ' + periodPhrase(ctx) + '. ';
      case 'anomaly': return 'Find missing, unusual, or duplicate-looking values' + (o ? ' in the' + o : '') + '. ';
      case 'consistency': return 'Identify every number or statement that conflicts with another table, chart, or narrative. ';
      case 'rewrite': return 'Rewrite the selected' + (o || ' text') + ' for ' + (ctx.domain === 'GEN' ? 'a senior reader' : 'a senior executive audience') + '. ';
      case 'summarize': return 'Summarize the' + (o || ' content') + ' for a reader who has not seen it. ';
      case 'draft': return 'Draft ' + (ctx.object ? 'the ' + ctx.object : 'a first version of the section') + ' from the source. ';
      case 'extract': return 'Extract every ' + (ctx.object || 'relevant item') + ' into one list. ';
      case 'compare': return 'Compare the' + (o || ' figures') + ' against ' + (ctx.periods.length ? periodPhrase(ctx).split(' and ')[0] : 'the prior period') + ' and identify the differences that matter. ';
      case 'explain': return 'Explain ' + (ctx.object ? ctx.object : '[the requirement]') + ' for the person collecting the evidence. ';
      case 'questions': return 'Write the questions a reviewer is most likely to ask about the' + (o || ' content') + '. ';
      case 'map': return 'Map each ' + (ctx.object || 'item') + ' to the relevant ' + (ctx.domain === 'GRC' ? 'COSO principle or framework requirement' : ctx.domain === 'SUS' ? 'ESRS disclosure requirement' : 'framework requirement') + '. ';
      case 'checklist': return 'Turn the' + (o || ' process') + ' into test steps a new team member could follow. ';
      case 'formula': return 'Write the formula that ' + (ctx.object ? 'calculates ' + ctx.object : '[does what you need]') + '. ';
      default: return 'Identify the three most important points in the' + (o || ' content') + '. ';
    }
  }

  function paramsFragment(ctx) {
    const h = ctx.headers.slice(0, 4);
    const cols = h.length >= 2 ? h.join(', ') : null;
    switch (ctx.intent) {
      case 'errors': return 'List each issue with its location, what is wrong, and the suggested correction, in a table. ';
      case 'gaps': return 'Return a table: item, gap, why it matters, suggested fix, ranked by risk. ';
      case 'variance': return 'Show the three largest changes greater than 10%, ranked by magnitude, in a table: ' + (cols ? cols + ', ' : 'metric, both values, ') + 'change in absolute and percentage terms. ';
      case 'anomaly': return 'Return a table: ' + (cols ? cols + ', ' : 'item, period, value, ') + 'issue type, suggested check. Include variances greater than ±20%. ';
      case 'consistency': return 'For each conflict, give both locations and both values in a table. ';
      case 'rewrite': return 'Make it about 30% shorter, in plain English. ';
      case 'summarize': return 'Use five bullets, under 120 words in total. ';
      case 'draft': return 'Keep it to about 150 words, in the style of the existing section. ';
      case 'extract': return 'Return a table with one row per item' + (cols ? ' and columns ' + cols : '') + '. ';
      case 'compare': return 'Return a table: item, current, comparison, difference, and percent change. ';
      case 'explain': return 'Cover what must be disclosed, the data needed, the likely owner, and the evidence to retain, as short bullets. ';
      case 'questions': return 'Give ten questions ranked by priority, covering data quality, methodology, controls, assumptions, and evidence. ';
      case 'map': return 'Return a table: item, framework reference, one-line rationale. ';
      case 'checklist': return 'Use numbered steps, each with the evidence to collect and who owns it. ';
      case 'formula': return 'Give the formula first, then one line explaining each part. ';
      default: return 'Use five bullets, under 120 words. ';
    }
  }

  function evalFragment(ctx) {
    switch (ctx.intent) {
      case 'errors': return 'Do not change anything yourself, and flag anything you are not sure is an error.';
      case 'gaps': return 'Only flag gaps you can point to in the source, and mark judgment calls for my review.';
      case 'variance': return 'Do not speculate beyond the data; phrase explanations as hypotheses and list open questions for the data owner separately.';
      case 'anomaly': return 'Do not correct any values; flag anything you are unsure of.';
      case 'consistency': return 'Do not decide which value is correct.';
      case 'rewrite': return 'Preserve every number, date, and factual claim, and do not introduce new facts.';
      case 'summarize': return 'Do not add anything that is not in the source, and keep every figure exactly as written.';
      case 'draft': return 'Use only facts from the source, and mark anything I need to confirm as [to confirm].';
      case 'extract': return 'If an item is missing or unclear, say so rather than guessing.';
      case 'compare': return 'Show where each figure comes from, and do not explain causes the data does not support.';
      case 'explain': return 'Cite the sources, and say if the requirement is not covered.';
      case 'questions': return 'Base every question only on the source, and note which section each one refers to.';
      case 'map': return 'Mark any mapping you are unsure of as needing review; I will make the final call.';
      case 'checklist': return 'Do not invent controls or owners that are not in the source; list any gaps as open questions.';
      case 'formula': return 'If the request is ambiguous, state your assumption before the formula.';
      default: return 'Do not add facts that are not in the source, and list any open questions separately.';
    }
  }

  /* ---------------- reuse the user's own words ---------------- */
  // Turn the user's prompt into letter-tagged segments. Each sentence gets a host letter; cue
  // phrases for other letters inside it become their own inline segments, so switching a letter
  // off removes exactly its words. `alt` is what an inline segment collapses to when off.
  const S_INLINE = /\b(?:selected|highlighted|attached|uploaded|pasted|open|opened|current|enclosed|provided|shared|linked)\b/i;
  function userSegments(prompt, d, on) {
    const sentences = [];
    const re = /[^.;!?\n]+[.;!?]?/g; let m;
    while ((m = re.exec(prompt))) if (m[0].trim()) sentences.push({ start: m.index, end: m.index + m[0].length });
    const spans = [];
    const FIXED = /^(period|scope-n|number|region|scope-limit|structure|measures|format-word|here-is|work-off|wdata|on-screen|demonstrative|numbered-part|only-use-info)$/;
    for (const k of K) for (const h of d.el[k].hits) if (h.orig && h.orig[1] > h.orig[0] && !FIXED.test(h.tag)) {
      let b = h.orig[1]; while (b > h.orig[0] && /[.,;:!?\s]/.test(prompt[b - 1])) b--;
      spans.push({ k, a: h.orig[0], b, tag: h.tag });
    }
    const out = [];
    for (const snt of sentences) {
      const inside = spans.filter((x) => x.a >= snt.start && x.b <= snt.end + 1);
      const cov = {};
      for (const x of inside) cov[x.k] = (cov[x.k] || 0) + (x.b - x.a);
      let host = inside.some((x) => x.k === 'O') ? 'O' : Object.keys(cov).sort((p, q) => cov[q] - cov[p])[0] || 'O';
      const sentText = prompt.slice(snt.start, snt.end);
      // inline spans for non-host letters, narrowed and de-overlapped
      const inl = [];
      for (const x of inside) {
        if (x.k === host || x.k === 'O') continue;
        let a = x.a, b = x.b, alt = '';
        if (x.k === 'S') {
          const sub = prompt.slice(a, b);
          if (/\.(?:xlsx|xlsm|xls|csv|docx|doc|pdf|pptx|ppt|txt)\b/i.test(sub)) alt = 'the file';
          else { const mm = sub.match(S_INLINE); if (!mm) continue; a = a + mm.index; b = a + mm[0].length; }
        }
        if (inl.some((y) => a < y.b && b > y.a)) continue;
        inl.push({ k: x.k, a, b, alt });
      }
      inl.sort((p, q) => p.a - q.a);
      const segs = []; let cur = snt.start;
      for (const x of inl) {
        if (x.a > cur) segs.push({ text: prompt.slice(cur, x.a), letter: host });
        segs.push({ text: prompt.slice(x.a, x.b), letter: x.k, alt: x.alt, inline: true });
        cur = x.b;
      }
      if (cur < snt.end) segs.push({ text: prompt.slice(cur, snt.end), letter: host });
      const last = segs[segs.length - 1];
      if (last && !/[.!?]\s*$/.test(last.text)) { if (last.inline) segs.push({ text: '.', letter: host }); else last.text = last.text.replace(/\s*$/, '.'); }
      const vague = !inside.some((x) => x.k === 'O');
      out.push({ host, segs, inside, text: sentText, vague, letters: new Set([host, ...inl.map((x) => x.k)]) });
    }
    return out;
  }

  function asSentence(k, phrase) {
    let p = phrase.replace(/[.;,]+$/, '');
    if (k === 'C' && /^(for|to)\b/i.test(p)) p = 'This is ' + p;
    else if (k === 'P' && /^(in|as|into|under|within|no more than|at most|up to|less than|ranked|sorted|by)\b/i.test(p)) p = 'Return it ' + p;
    return p.replace(/^./, (c) => c.toUpperCase()) + '.';
  }

  // Join segments, dropping letters that are off and tidying the spacing/punctuation left behind.
  function assemble(segs, onSet) {
    let t = segs.map((g) => (onSet.has(g.letter) ? g.text : g.inline ? g.alt || '' : '')).join('');
    t = t.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/,\s*([.;!?])/g, '$1').replace(/\(\s*\)/g, '').replace(/\b(the|a|an) (the|a|an)\b/gi, '$1').replace(/^\s*[,;:]\s*/, '').trim();
    return t.replace(/(^|[.!?]\s+)([a-z])/g, (m0, p, c) => p + c.toUpperCase());
  }

  // The thing the prompt is about: noun phrase after the main verb, minus possessives.
  function objectOf(t) {
    const m = t.match(/\b(?:analy[sz]e|review|look at|check|summari[sz]e|explain|compare|identify|find|list|draft|write|rewrite|map|extract|help (?:me )?with|go over|improve|clean up|work on|tell me about)\s+(?:up |out |together |down )?(?:the |our |my |this |these |all |some |any |a |an )?((?:selected |attached |current |highlighted )?[a-z0-9&/-]+(?: [a-z0-9&/-]+){0,3}?)(?=[.,;?!]| for | and | to | so | in | from | with | by | that | which |\s*$)/);
    if (!m) return null;
    let o = m[1].replace(/^(?:selected|attached|current|highlighted) /, '').trim();
    if (/^(it|this|that|them|me|us|stuff|things|everything|something)$/.test(o) || /^(?:for|to|in|on|at|with|by|from|over|into|if|whether|and|or)\b/.test(o)) return null;
    return o.split(' ').length > 5 ? null : o;
  }

  function restoreCase(prompt, o) {
    if (!o) return o;
    const i = prompt.toLowerCase().indexOf(o);
    return i >= 0 ? prompt.slice(i, i + o.length) : o;
  }

  /* ---------------- Workiva-specific tips (from Workiva support documentation) ---------------- */
  function workivaTips(ctx, on, files) {
    const tips = [];
    if (files.length) tips.push('In Workiva AI chat, type @ and pick ' + (files.length === 1 ? 'the file' : 'each file') + ' so the AI can read ' + (files.length === 1 ? 'it' : 'them') + ' (up to 10 per prompt).');
    else if (!on.S) tips.push('The document companion does not read your open file unless you reference it. Select the text or table first, or type @ in chat to reference a file.');
    const tip = {
      rewrite: 'For quick changes, select the text and use the companion’s quick edits: Shorten, Elaborate, Rephrase, or Change tone.',
      formula: 'In a spreadsheet, select the cell and use Fix this formula or Explain this formula from the companion.',
      variance: 'In a spreadsheet, the companion works on the current sheet. Select the rows first, or try Find trends for a quick first pass.',
      anomaly: 'In a spreadsheet, the companion works on the current sheet. Select the range you want checked first.',
      summarize: ctx.files.some((f) => f.kind === 'Excel') ? 'For a quick first pass on a range, try the spreadsheet companion’s Summarize data action.' : null,
      consistency: ctx.domain === 'FR' ? 'If your package includes it, the Tie-Out Agent is built for finding discrepancies across a financial report. Ask your account team.' : null,
      compare: ctx.domain === 'FR' && /\bpeers?|competitors?|benchmark/.test(ctx.t) ? 'If your package includes it, the Benchmarking Agent compares your SEC filings with peers. Ask your account team.' : null,
      map: ctx.domain === 'SUS' ? 'If your package includes it, the Sustainability Disclosure Agent scores a disclosure against ESRS or ISSB requirements. Ask your account team.' : null,
      gaps: ctx.domain === 'SUS' ? 'If your package includes it, the Sustainability Disclosure Agent runs a gap assessment against ESRS or ISSB. Ask your account team.' : null,
      explain: ctx.domain === 'SUS' ? 'Switch the knowledge base to ESRS (or ISSB) for framework questions, then check the cited sources.' : null
    }[ctx.intent];
    if (tip) tips.push(tip);
    return tips;
  }

  /* ---------------- verdicts ---------------- */
  const MISSING = {
    S: 'what to read', C: 'who it is for', O: 'the one thing you want back', P: 'a format or scope', E: 'a rule about invented facts'
  };
  function listify(a) { return a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function verdictFor(stage, on, extra) {
    const miss = K.filter((k) => !on[k]);
    if (stage === 'weak') {
      const core = ['S', 'O'].filter((k) => !on[k]).map((k) => MISSING[k]);
      let v = 'The AI has to guess ' + listify(core.length ? core : miss.map((k) => MISSING[k])) + '. ';
      if (extra.vague) v += 'A verb like "' + extra.vague + '" does not say what a finished answer looks like. ';
      const rest = miss.filter((k) => !['S', 'O'].includes(k)).map((k) => MISSING[k]);
      if (rest.length) v += 'It is also missing ' + listify(rest) + '.';
      return v.trim();
    }
    if (stage === 'better') {
      const rest = miss.map((k) => MISSING[k]);
      return 'Now it has a source and a single job. ' + (rest.length ? 'Still missing: ' + listify(rest) + '.' : '');
    }
    return 'Source, context, one job, useful constraints, and a check. The AI has nothing left to guess, and you can verify the answer against the source.';
  }

  /* ---------------- main ---------------- */
  function coach(prompt, opts) {
    opts = opts || {};
    const files = opts.files || [];
    const detect = opts.detect || ((p) => { const d = R.detect(p, { files: files.map((f) => f.name) }); return { on: Object.fromEntries(K.map((k) => [k, d.el[k].on])), d }; });
    const { on, d } = detect(prompt);
    const t = d.text;
    const grade = R.grade(on);
    const chosen = bestSheet(files, t);
    const headers = ((chosen && chosen.sheet && chosen.sheet.headers) || []).filter((h) => h && h.length < 30).slice(0, 6);
    const ctx = {
      t, files, domain: opts.domain || domainOf(t + ' ' + files.map((f) => (f.text || '').slice(0, 3000)).join(' ').toLowerCase()),
      intent: null, object: restoreCase(prompt, objectOf(t)), periods: periodsIn(files), headers
    };
    ctx.intent = opts.intent || intentOf(t, files.some((f) => f.kind === 'Excel') || /\b(data|table|numbers|figures|emissions|revenue|metrics?)\b/.test(t));
    const gen = { S: sourceFragment(ctx), C: contextFragment(ctx), O: objectiveFragment(ctx), P: paramsFragment(ctx), E: evalFragment(ctx) };
    const sentences = userSegments(prompt, d, on);
    // A vague objective sentence is replaced by the generated objective; keep its other cues.
    const kept = [];
    for (const snt of sentences) {
      if (!on.O && (snt.host === 'O' || snt.vague &&  /\b(?:analy[sz]e|look at|look over|go over|review|check|help|assist|work on|handle|thoughts|improve|clean up|take a look|have a look|figure out|investigate|examine|evaluate|assess|tell me about)\b/i.test(snt.text))) {
        const taken = [];
        for (const x of snt.inside.filter((y) => y.k === 'C' || y.k === 'P' || y.k === 'E').sort((p, q) => p.a - q.a)) {
          if (taken.some((y) => x.a < y.b && x.b > y.a)) continue; taken.push(x);
          const phrase = prompt.slice(x.a, x.b).replace(/^[\s,]+|[\s,]+$/g, '');
          kept.push({ host: x.k, segs: [{ text: asSentence(x.k, phrase) + ' ', letter: x.k }], letters: new Set([x.k]) });
        }
        continue;
      }
      kept.push(snt);
    }
    const present = new Set(); for (const snt of kept) for (const l of snt.letters) present.add(l);
    const genUsed = new Set();
    const segments = [];
    for (const k of K) {
      for (const snt of kept.filter((x) => x.host === k)) { for (const g of snt.segs) segments.push(g); segments.push({ text: ' ', letter: k }); }
      if (!present.has(k) || (k === 'O' && !on.O) || (k === 'S' && !on.S && !present.has('S'))) { segments.push({ text: gen[k], letter: k, generated: true }); genUsed.add(k); }
    }
    const allOn = new Set(K);
    // Self-check: re-grade the strong version; if a generated letter does not register,
    // swap in a more explicit wording for it (at most two passes).
    const ALT = {
      S: ['Use only the selected content and nothing outside it. '],
      C: ['You are ' + ((ROLE[ctx.domain] || ROLE.GEN).def) + ', and this is for ' + DEST[ctx.domain] + '. '],
      O: ['List the three most important findings in the' + (ctx.object ? ' ' + ctx.object : ' source') + ', one per line. ', 'Identify and list the specific items that answer this request. '],
      P: ['Return a table with one row per item, under 150 words in total. '],
      E: ['Do not guess or add facts that are not in the source; flag anything you are unsure of.']
    };
    for (let pass = 0; pass < 2; pass++) {
      const chk = detect(assemble(segments, allOn)).on;
      const bad = K.filter((k) => !chk[k] && genUsed.has(k));
      if (!bad.length) break;
      for (const k of bad) {
        const seg = segments.find((g) => g.generated && g.letter === k);
        const alt = (ALT[k] || [])[pass];
        if (seg && alt) seg.text = alt;
      }
    }
    const strongP = assemble(segments, allOn);
    const betterSegs = segments.filter((g) => !g.generated || g.letter === 'S' || g.letter === 'O');
    const betterP = assemble(betterSegs, allOn);
    const vagueVerb = (t.match(/\b(analy[sz]e|look at|review|check|help(?: me)?(?: with)?|go over|improve|work on)\b/) || [])[1];
    const weakP = grade === 'weak' ? prompt.trim() : (vagueVerb ? vagueVerb : 'Look at').replace(/^./, (c) => c.toUpperCase()) + ' ' + (ctx.object ? 'our ' + ctx.object : 'this') + '.';
    const stages = {
      weak: { prompt: grade === 'weak' ? prompt.trim() : weakP, verdict: verdictFor('weak', grade === 'weak' ? on : { S: false, C: false, O: false, P: false, E: false }, { vague: grade === 'weak' && !on.O ? vagueVerb : (grade === 'weak' ? null : vagueVerb || 'look at') }) },
      better: { prompt: grade === 'better' ? prompt.trim() : betterP, verdict: verdictFor('better', grade === 'better' ? on : { ...on, S: true, O: true }, {}) },
      strong: { prompt: grade === 'strong' ? prompt.trim() : strongP, verdict: verdictFor('strong', on, {}) }
    };

    const why = {
      S: on.S ? 'You named what to read, so the answer stays inside your source.' : 'Added so the AI reads one specific source instead of guessing.',
      C: on.C ? 'Your context tells the AI who the output is for.' : 'Added so tone and level of detail fit the reader.',
      O: on.O ? 'Your one clear job gives the answer a finish line.' : 'Replaces a vague verb with one job that has a finish line.',
      P: on.P ? 'Your constraints shape the answer so it drops straight into review.' : 'Added so the format, scope, and size are decided up front.',
      E: on.E ? 'Your rule keeps a person in charge of what is true.' : 'Added so invented facts get flagged instead of slipping through.'
    };
    const scope = Object.fromEntries(K.map((k) => [k, { frag: assemble(segments.filter((g) => g.letter === k), allOn), why: why[k], mine: !genUsed.has(k) }]));

    const notes = [];
    if (d.stacked) notes.push({ kind: 'stacked', text: 'You are asking for several things at once. Split them into separate prompts and ask one at a time.' });
    if (d.words < 6) notes.push({ kind: 'short', text: 'Very short prompts leave almost everything to guesswork. Aim for one or two full sentences.' });
    if (files.length) {
      const fileText = files.map((f) => (f.text || '') + ' ' + (f.sheets || []).map((s) => s.name + ' ' + (s.headers || []).join(' ')).join(' ')).join(' ').toLowerCase();
      const terms = (prompt.match(/\b(?:FY|CY)\s?'?\d{2,4}\b|\bQ[1-4]\b|\b(?:19|20)\d{2}\b|\bScope [123]\b|\b[A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)+\b/g) || []).filter((x) => !/^(You|The|Use|Do|Please)\b/.test(x));
      const missingTerms = [...new Set(terms)].filter((x) => !fileText.includes(x.toLowerCase()));
      if (missingTerms.length) notes.push({ kind: 'grounding', text: 'Your prompt mentions ' + listify(missingTerms.map((x) => '"' + x + '"')) + ', which does not appear in the attached ' + (files.length === 1 ? 'file' : 'files') + '. Check you attached the right source.' });
      if (ctx.periods.length) notes.push({ kind: 'periods', text: 'Periods found in your files: ' + ctx.periods.join(', ') + '.' });
    }
    const tips = workivaTips(ctx, on, files);
    const filled = K.filter((k) => !on[k]);
    const headline = grade === 'strong' ? 'It names a source, context, one job, constraints, and a check.'
      : grade === 'better' ? 'It has a source and a job; it is missing ' + listify(filled.map((k) => MISSING[k])) + '.'
      : 'The AI would have to guess ' + listify(['S', 'O'].filter((k) => !on[k]).map((k) => MISSING[k])) + '.';
    const placeholders = (strongP.match(/\[[^\]]+\]/g) || []).length;
    return { grade, detected: on, headline, stages, scope, segments, notes, tips, intent: ctx.intent, domain: ctx.domain, placeholders, hits: d.el };
  }

  const api = { coach, assemble, domainOf, intentOf, objectOf, INTENTS, DOMAIN };
  if (isNode) module.exports = api; else root.ScopeRewrite = api;
})(typeof window !== 'undefined' ? window : globalThis);
