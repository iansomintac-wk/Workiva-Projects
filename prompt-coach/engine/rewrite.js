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
    ['variance', /\b(varian|flux|change[sd]? (?:from|between|vs|versus)|year[- ]over[- ]year|yoy|quarter[- ]over[- ]quarter|qoq|increase|decrease|drove|drivers?|movement|trend|went up|went down|go(?:es)? (?:up|down)|(?:up|down) (?:vs|versus|from|compared)|spiked|dropped|grew|declin)/],
    ['map', /\b(map|mapping|crosswalk|align (?:to|with)|which (?:principle|requirement|criteria|control objective)|link (?:each|the) .{0,20}to)/],
    ['questions', /\b(questions?|what would (?:an|the) (?:auditor|reviewer|regulator) ask|challenge|poke holes|red-?team|interview)/],
    ['checklist', /\b(checklist|steps|test procedures?|test steps|to-?do|action items|plan|procedure|walkthrough steps|playbook|how do i|how should we)/],
    ['explain', /\b(explain|what does .{0,40}(?:require|mean)|what is required|requirement|standard|define|definition|meaning of|interpret)/],
    ['compare', /\b(compare|comparison|benchmark|peers?|versus|vs\.?|against (?:the|our|prior)|gap analysis|differences? between)/],
    ['extract', /\b(extract|pull (?:out|together)?|list (?:all|every|each)|find (?:all|every)|capture|collect|inventory of|table of all)/],
    ['draft', /\b(draft|write|compose|create|prepare|generate|produce|put together|come up with)/],
    ['summarize', /\b(summar|overview|recap|tl;?dr|key (?:points|takeaways|themes)|highlights|brief)/]
  ];
  const LIST_INTENT = new Set(['errors', 'gaps', 'consistency', 'anomaly', 'map', 'questions', 'checklist', 'extract', 'compare']);
  // The user's own verb asks for changed text ("can u fix them"), so a list of found items is not what they want back.
  const CHANGE_ASK = /\b(?:fix|correct|rewrite|reword|rephrase|revise|edit|update|standardi[sz]e|harmoni[sz]e|align|clean up)\b/;
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
  // Generated text adds a finish line and a format, but never facts, counts, or limits the user
  // did not give: those become [blanks] for the user to fill in.
  const AUDIENCE = { FR: 'the audit committee', GRC: 'our external auditors', SUS: 'our assurance provider', GEN: 'my manager' };

  /* ---------------- file grounding ---------------- */
  function words(s) { return (String(s).toLowerCase().match(/[a-z0-9][a-z0-9&%-]{2,}/g) || []); }
  function bestSheet(files, t) {
    const tw = new Set(words(t)); let best = null, score = -1;
    for (const f of files) for (const sh of f.sheets || []) {
      const s = words(sh.name + ' ' + (sh.headers || []).join(' ')).filter((w) => tw.has(w)).length;
      const named = t.includes(sh.name.toLowerCase());
      if (named) return { file: f, sheet: sh, score: s, named };
      if (s > score) { score = s; best = { file: f, sheet: sh, score: s, named }; }
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
      if (sh && sh.named && (sh.file.sheets || []).length > 1) return 'Use only @' + cleanFile(sh.file.name) + ', sheet "' + sh.sheet.name + '". ';
      if (files.length === 1) return 'Use only @' + cleanFile(files[0].name) + '. ';
      return 'Use only ' + files.slice(0, 10).map((f) => '@' + cleanFile(f.name)).join(', ') + '. ';
    }
    // No file: name what the user named; otherwise leave the source as a blank, never a guessed type.
    if (intent === 'explain' && domain === 'SUS') return /\b(?:issb|ifrs s[12])\b/.test(ctx.t) ? 'Use the ISSB knowledge base. ' : /\besrs\b/.test(ctx.t) ? 'Use the ESRS knowledge base. ' : 'Use [the ESRS or ISSB knowledge base, or the standard text you selected]. ';
    if (intent === 'explain') return 'Use the [requirement or standard text] I have selected. ';
    // writing tasks need room for new wording, so the source is a starting point, not a fence
    const lead = ['draft', 'checklist'].includes(intent) ? 'Start from ' : 'Work only from ';
    return lead + '[the selected text, table, or file]. ';
  }

  // Context fits the task: a table feeds something; other data tasks are "for" something. Blank, never a guessed audience.
  const CTX_EXAMPLE = { FR: 'the quarterly flux review', GRC: 'our SOX control testing', SUS: 'our Scope 2 inventory', GEN: null };
  const DATA_CTX = new Set(['variance', 'anomaly', 'consistency', 'compare', 'map', 'formula']);
  function contextFragment(ctx) {
    const ex = CTX_EXAMPLE[ctx.audDomain] ? ', such as ' + CTX_EXAMPLE[ctx.audDomain] : '';
    if (ctx.intent === 'extract') return 'This table feeds [what it is for' + ex + ']. ';
    if (DATA_CTX.has(ctx.intent)) return 'This is for [what it feeds' + ex + ']. ';
    return 'This is for ' + DEST[ctx.audDomain] + '. ';
  }

  function periodPhrase(ctx) {
    const mine = ctx.promptPeriods || [];
    if (mine.length >= 2) return mine[0] + ' and ' + mine[1];
    if (mine.length === 1) return null; // a single named period: "for Q4 FY26", not "between"
    const p = ctx.periods;
    if (p.length >= 2) return p[p.length - 2] + ' and ' + p[p.length - 1];
    return 'the current and prior period';
  }

  function objectiveFragment(ctx) {
    const o = ctx.object ? ' ' + ctx.object : '';
    switch (ctx.intent) {
      case 'errors': return 'List each error in the' + (o || ' text') + ' and where it is. ';
      case 'gaps': return 'List what is missing from the' + (o || ' content') + '. ';
      case 'variance': { const pp = periodPhrase(ctx); return 'Identify what drove the change' + (o ? ' in the' + o : '') + (pp ? ' between ' + pp : ctx.promptPeriods[0] ? ' for ' + ctx.promptPeriods[0] : '') + '. '; }
      case 'anomaly': return 'List any values' + (o ? ' in the' + o : '') + ' that look wrong, missing, or out of place. ';
      case 'consistency': return 'List every number or statement that does not match. ';
      case 'rewrite': return 'Rewrite ' + (o ? 'the' + o : 'it') + ' and return the revised version. ';
      case 'summarize': return 'Summarize the key points of the' + (o || ' content') + '. ';
      case 'draft': return 'Draft ' + (ctx.object ? 'the ' + ctx.object : 'the text') + ' from the source. ';
      case 'extract': return 'Extract every ' + (ctx.object || 'relevant item') + ' into one list. ';
      case 'compare': return 'List what is different between the two' + (o ? ' ' + ctx.object : '') + '. ';
      case 'explain': return 'Explain ' + (ctx.object ? ctx.object : '[the requirement]') + ' in plain terms. ';
      case 'questions': return 'List the questions a reviewer is most likely to ask. ';
      case 'map': return 'Map each ' + (ctx.object || 'item') + ' to [the framework and version]. ';
      case 'checklist': return 'Turn the' + (o || ' process') + ' into numbered steps. ';
      case 'formula': return 'Write the formula that ' + (ctx.object ? 'calculates ' + ctx.object : '[does what you need]') + '. ';
      default: return 'List the most important points in the' + (o || ' content') + '. ';
    }
  }

  /* Missing-data ask (spec 2026-10-19): the user asks what is missing or blank, not what is wrong.
     Rule and condition clauses are cut out before looking for the missing word, so "if X is missing" and
     "don't guess missing dates" do not count; the condition clause ends at its comma, so "If possible, list
     missing data" keeps its request. Wrong-value words are looked for in the whole prompt (mixed ask). */
  const MISS_WORD = /\b(?:missing|blank|empty|no (?:data|values?|figures?)|without (?:a |any )?(?:values?|data))\b/;
  const MISS_RULE = /(?<!\b(?:check|see|ask|confirm|find out|tell (?:me|us))\s)\bif\b[^,.;!?\n]*|\b(?:don'?t|do not|never|not)\s+(?:\w+\s+){0,3}?(?:guess|assume|estimate|fill|make up|chase|plug|infer)\b[^.;!?\n]*|\bleave\b[^.;!?\n]*\bblank\b|\b(?:a|an|new|the)\s+(?:\w+\s+){0,2}?blank (?:tab|sheet|page|template|row|line|space)\b/g;
  const MISS_WRONG = /\b(?:zero|invalid|negative|error\w*|duplicat\w*|exceptions?|wrong|incorrect|outliers?|anomal\w*|unusual|mismatch\w*|suspicious|spikes?|out of place|inconsisten\w*|typos?)\b/;
  function missingAsk(prompt) {
    const s = String(prompt || '').toLowerCase().replace(/[\u2018\u2019]/g, "'");
    return MISS_WORD.test(s.replace(MISS_RULE, ' ')) && !MISS_WRONG.test(s);
  }

  function paramsFragment(ctx) {
    const h = ctx.headers.slice(0, 4);
    const cols = h.length >= 2 ? h.join(', ') : null;
    switch (ctx.intent) {
      case 'errors': return 'Return a table: location, what is wrong, suggested fix. ';
      case 'gaps': return 'Return a table: item, what is missing, why it matters. ';
      case 'variance': return 'Return a table: ' + (cols ? cols + ', ' : 'item, both values, ') + 'change in amount and percent. Include only changes over [your threshold]. ';
      case 'anomaly': return ctx.missingAsk
        ? 'Return a table: ' + (cols ? cols + ', ' : 'item, ') + 'what is missing, where it should be. '
        : 'Return a table: ' + (cols ? cols + ', ' : 'item, value, ') + 'why it looks wrong, what to check. ';
      case 'consistency': return 'For each mismatch, give both locations and both values in a table. ';
      case 'rewrite': return 'Keep it to [target length], in the same voice. ';
      case 'summarize': return 'Use [number] bullets. ';
      case 'draft': return 'Keep it to about [length], in the style of the existing text. ';
      case 'extract': return 'Return a table with one row per item' + (cols ? ' and columns ' + cols : ' and where it appears') + '. ';
      case 'compare': return 'Return a table: item, before, after, what changed. ';
      case 'explain': return 'Use short bullets. ';
      case 'questions': return 'Give [number] questions, most important first. ';
      case 'map': return 'Return a table: item, framework reference, one-line reason. ';
      case 'checklist': return 'Use numbered steps, each with the evidence to keep. ';
      case 'formula': return 'Give the formula first, then one line explaining each part. ';
      default: return 'Use [number] short bullets. ';
    }
  }

  function evalFragment(ctx) {
    switch (ctx.intent) {
      case 'errors': return 'Do not change anything yourself, and flag anything you are not sure is an error.';
      case 'gaps': return 'Only flag gaps you can point to in the source, and mark judgment calls for my review.';
      case 'variance': return 'Do not speculate beyond the data; phrase explanations as hypotheses and list open questions for the data owner separately.';
      case 'anomaly': return ctx.missingAsk ? 'Do not fill in or estimate missing values.' : 'Do not correct any values; flag anything you are unsure of.';
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
  // A sentence ends at . ! ? outside ( ) and [ ], or at a line break. A ";" never ends one. A "." followed by a
  // non-space ("14.2%", "A.8.x") is not an end. Brackets never carry across a line break.
  function sentenceSpans(prompt) {
    const spans = [], n = prompt.length; let i = 0;
    while (i < n) {
      while (i < n && prompt[i] === '\n') i++;
      if (i >= n) break;
      const start = i; let depth = 0, ended = false;
      while (i < n && prompt[i] !== '\n') {
        const c = prompt[i];
        if (c === '(' || c === '[') depth++;
        else if ((c === ')' || c === ']') && depth > 0) depth--;
        else if (depth === 0 && /[.!?]/.test(c) && !(c === '.' && i + 1 < n && /[^\s.]/.test(prompt[i + 1]))) { ended = true; break; }
        i++;
      }
      if (ended) while (i < n && /[.;!?]/.test(prompt[i])) i++;
      if (prompt.slice(start, i).trim()) spans.push({ start, end: i });
    }
    return spans;
  }
  function userSegments(prompt, d, on) {
    const sentences = sentenceSpans(prompt);
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
      if (last && !/[.!?]\s*$/.test(last.text)) { if (last.inline) segs.push({ text: '.', letter: host }); else last.text = last.text.replace(/[\s;,:]*$/, '.'); }
      const vague = !inside.some((x) => x.k === 'O');
      out.push({ idx: out.length, host, segs, inside, text: sentText, vague, letters: new Set([host, ...inl.map((x) => x.k)]) });
    }
    return out;
  }

  function asSentence(k, phrase) {
    let p = phrase.replace(/[.;,]+$/, '');
    if (k === 'C' && /^(for|to)\b/i.test(p)) p = 'This is ' + p;
    else if (k === 'P' && /^(?:for|during|over|across|since|from|between)\s/i.test(p)) p = 'Focus on ' + p.replace(/^\w+\s/, '');
    else if (k === 'P' && /^(in|as|into|under|within|no more than|at most|up to|less than|ranked|sorted|by)\b/i.test(p)) p = 'Return it ' + p;
    return p.replace(/^./, (c) => c.toUpperCase()) + '.';
  }

  // Chat shorthand reads badly in a prompt someone will reuse; greetings and "thoughts?" add nothing.
  function tidyChat(t) {
    return t.replace(/\bcan u\b/gi, (m) => m.slice(0, 4) + 'you').replace(/\bu\b/g, 'you').replace(/\bur\b/g, 'your').replace(/\b(?:pls|plz)\b/gi, 'please')
      .replace(/(^|[.!?]\s+)(?:hi|hey|hello)(?: there| all| team)?\b\s*[,!.]*\s*/gi, '$1')
      .replace(/(^|[.!?]\s+)(?:thanks|thank you|thx|ty)\b[^.!?]*(?:[.!?]+\s*|$)/gi, '$1')
      .replace(/(^|[.!?]\s+)(?:any )?thoughts\s*\?+\s*/gi, '$1')
      .replace(/,?\s*(?:any )?thoughts\s*\?+/gi, '.').replace(/\.\./g, '.').trim();
  }

  // Direct voice: polite openers become imperatives, filler words go. Questions that are not
  // "can/could/would you + verb" stay questions; a "?" becomes "." only on a sentence we converted.
  const GERUND = { summarizing: 'summarize', reviewing: 'review', checking: 'check', listing: 'list', extracting: 'extract', comparing: 'compare', writing: 'write', drafting: 'draft', explaining: 'explain', looking: 'look', pulling: 'pull', putting: 'put', sending: 'send', giving: 'give', making: 'make', taking: 'take', finding: 'find', creating: 'create', preparing: 'prepare', flagging: 'flag', mapping: 'map', rewriting: 'rewrite', identifying: 'identify', analyzing: 'analyze', analysing: 'analyse' };
  function directSentence(s) {
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/); const lead = m[1], trail = m[3]; let b = m[2]; const orig = b; let converted = false;
    b = b.replace(/^(?:additionally|also),?\s+(?:(?:please|kindly)\s+)?(?:ensure|make sure)(?: that)?\s+(?=if\b)/i, () => { converted = true; return ''; });
    b = b.replace(/^(?:(?:please|kindly|pls|plz),?\s+)?would you mind\s+([a-z]+ing)\b\s*/i, (x, g) => (GERUND[g.toLowerCase()] ? (converted = true, GERUND[g.toLowerCase()] + ' ') : x));
    b = b.replace(/^(?:(?:please|kindly|pls|plz),?\s+)?(?:(?:can|could|would) you(?!\s+mind\b)|i was wondering if you (?:could|can|would)|i wonder if you (?:could|can)|i(?:'d| would) (?:like|love) you to|i (?:need|want) you to)(?:,?\s+(?:please|kindly|pls|plz))?,?\s+(?=[a-z])/i, () => { converted = true; return ''; });
    // declared extension of spec rule 3: a "can/could you + verb" in the middle of a sentence (not a question word first)
    // a question-word sentence stays a question; only a ", and/then/so can you + verb" tail splits off as its own imperative
    if (/^(?:what|which|who|whom|whose|when|where|why|how)\b/i.test(b)) {
      b = b.replace(new RegExp('^([\\s\\S]*?),?\\s+(?:(?:and|then|so)\\s+(also|plus)|(also|plus)|and|then|so)\\s+(?:can|could|would) you(?:\\s+(?:please|kindly))?\\s+(?=[a-z])([\\s\\S]*)$', 'i'), (x, head, g1, g2, tail) => { converted = true; const w = g1 || g2; return head + '? ' + (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() + ' ' + tail : tail.replace(/^[a-z]/, (c) => c.toUpperCase())); });
    }
    // a bare lead-in (also/plus/and/but/so/then) stays; only the "can you" goes
    b = b.replace(/^(also|plus|and|but|so|then)(,?)\s+(?:can|could|would) you(?:\s+(?:please|kindly))?\s+(?=[a-z])/i, (x, w, c) => { converted = true; return w + c + ' '; });
    b = b.replace(/\b(and|then|so|also|plus)\s+(?:can|could|would) you(?:\s+(?:please|kindly))?\s+(?=[a-z])/gi, (x, w) => { converted = true; return w + ' '; });
    if (!/^(?:what|which|who|whom|whose|when|where|why|how)\b/i.test(b)) {
      // an "If ..." opener keeps its condition: "If X, do Y." rather than "If X. Do Y."
      const cond = /^if\b/i.test(b);
      b = b.replace(/([A-Za-z0-9)'"’”])(?:,|\s+[-–—])?\s+(?:can|could) you(?:\s+(?:please|kindly))?\s+([a-z])/gi, (x, p, c) => { converted = true; return cond ? p + ', ' + c : p + '. ' + c.toUpperCase(); });
    }
    b = b.replace(/([-–—,;:])\s+(?:please|pls|plz|kindly),/gi, '$1');
    b = b.replace(/\s+(?:please|pls|plz|kindly)(?=,)/gi, '');
    b = b.replace(/,?\s+(?:please|pls|plz|kindly|thanks|thank you)(?: so much| in advance| a lot)?\s*(?=[.!?]|$)/gi, '')
      .replace(/,?\s+if (?:at all )?possible\s*(?=[.!?]|$)/gi, '').replace(/^if (?:at all )?possible,?\s+/i, '')
      .replace(/^if you (?:can|could),\s+/i, '').replace(/,?\s+if you (?:can|could)\s*(?=[.!?]|$)/gi, '')
      .replace(/\b(?:please|pls|plz|kindly),?\s+/gi, '')
      .replace(/\b([A-Za-z]{3,})\(s\)/g, '$1s');
    if (b !== orig) b = b.replace(/^[a-z]/, (c) => c.toUpperCase());
    if (converted) b = b.replace(/\?+$/, '.');
    return lead + b + trail;
  }
  function directVoice(text) {
    let out = '', cur = 0;
    for (const sp of sentenceSpans(text)) { out += text.slice(cur, sp.start) + directSentence(text.slice(sp.start, sp.end)); cur = sp.end; }
    return out + text.slice(cur);
  }
  const TYPOS = { seperate: 'separate', seperately: 'separately', recieve: 'receive', recieved: 'received', occured: 'occurred', occurence: 'occurrence', occuring: 'occurring', definately: 'definitely', accomodate: 'accommodate', acheive: 'achieve', begining: 'beginning', beleive: 'believe', calender: 'calendar', wich: 'which', teh: 'the', adress: 'address', adresses: 'addresses', enviroment: 'environment', existance: 'existence', independant: 'independent', neccessary: 'necessary', necesary: 'necessary', refered: 'referred', succesful: 'successful', tommorow: 'tomorrow', untill: 'until', wierd: 'weird' };
  const TYPO_RE = new RegExp('\\b(' + Object.keys(TYPOS).join('|') + ')\\b', 'gi');
  function fixTypos(t) {
    return t.replace(TYPO_RE, (m) => { const f = TYPOS[m.toLowerCase()];
      if (m.length > 1 && m === m.toUpperCase()) return f.toUpperCase();
      return m[0] === m[0].toUpperCase() ? f[0].toUpperCase() + f.slice(1) : f; });
  }

  // Join segments, dropping letters that are off and tidying the spacing/punctuation left behind.
  function assemble(segs, onSet) {
    let t = segs.map((g) => (onSet.has(g.letter) ? g.text : g.inline ? g.alt || '' : '')).join('');
    t = t.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/,\s*([.;!?])/g, '$1').replace(/\(\s*\)/g, '').replace(/\b(the|a|an) (the|a|an)\b/gi, '$1').replace(/^\s*[,;:]\s*/, '').trim();
    t = tidyChat(t).replace(/([.!?])[.!?]+/g, (m) => (m.includes('?') ? '?' : m[0])); // "...", "??" -> one mark
    t = fixTypos(directVoice(t)).replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/\(\s*\)/g, '').trim();
    return t.replace(/(^|[.!?]\s+)([a-z])/g, (m0, p, c) => p + c.toUpperCase());
  }

  // The thing the prompt is about: noun phrase after the main verb, minus possessives.
  function objectOf(t) {
    const m = t.match(/\b(?:analy[sz]e|review|look at|check|summari[sz]e|explain|compare|identify|find|list|draft|write|rewrite|map|extract|help (?:me )?with|go over|improve|clean up|work on|tell me about)\s+(?:up |out |together |down )?(?:the |our |my |this |these |all |some |any |a |an )?((?:selected |attached |current |highlighted )?[a-z0-9&/-]+(?: [a-z0-9&/-]+){0,3}?)(?=[.,;?!]| for | and | to | so | in | from | with | by | that | which | vs\.? | versus | against | compared |\s*$)/);
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
    else if (!on.S) tips.push('To point Workiva AI at the right content, select the text or table first, or type @ in chat to reference a file.');
    if (/\b(?:attached|uploaded)\b/i.test(ctx.prompt || '') && /\bknowledge base\b/i.test(ctx.prompt || '')) tips.push('Your prompt says both "attached" and "knowledge base". Use one: in chat, type @ and pick each file you want read.');
    const tip = {
      rewrite: 'For quick changes, select the text and use the companion’s quick edits to shorten, change the tone, or elaborate.',
      formula: 'In a spreadsheet, select the cell and use Fix this formula or Explain this formula from the companion.',
      variance: 'In a spreadsheet, the companion works on what you select. Select a cell or a range of rows first, or try Find trends for a quick first pass.',
      anomaly: 'In a spreadsheet, the companion works on what you select. Select the cell or range you want checked first.',
      summarize: ctx.files.some((f) => f.kind === 'Excel') ? 'For a quick first pass on a range, try the spreadsheet companion’s Summarize data action.' : null,
      consistency: ctx.domain === 'FR' ? 'If your package includes it, the Tie-out assistant (a preview, for 10-K and 10-Q filings only) is built for finding discrepancies across a financial report. Ask your account team.' : null,
      compare: ctx.domain === 'FR' && /\bpeers?|competitors?|benchmark/.test(ctx.t) ? 'If your package includes it, Benchmarking (a preview) compares the disclosures in your financial report with those of peer companies. Ask your account team.' : null,
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

  // does the generated objective keep the subject of the user's sentence ("emissions data")?
  const FILLER = /^(?:analy[sz]e|review|look|check|help|with|go|over|work|take|please|pls|can|could|you|u|our|my|the|this|these|that|a|an|some|at|on|of|for|and|to|in|it|me|is|are|stuff|things)$/;
  function covers(objective, sentence) {
    const o = objective.toLowerCase();
    const subj = (sentence.toLowerCase().match(/[a-z0-9&-]+/g) || []).filter((w) => w.length > 2 && !FILLER.test(w));
    return !subj.length || subj.filter((w) => o.includes(w)).length / subj.length >= 0.6;
  }
  const VAGUE_LEAD = /^\s*(?:(?:please|pls|can (?:you|u)|could you)\s+)*(?:analy[sz]e|review|look (?:at|over)|go over|check|help(?: me)?(?: with)?|work on|take a look at)\s+/i;
  const VAGUE_VERB = /\b(?:analy[sz]e|look at|look over|go over|review|check|help|assist|work on|handle|thoughts|improve|clean up|take a look|have a look|figure out|investigate|examine|evaluate|assess|tell me about)\b/i;
  const VAGUE_ONLY = /^\s*(?:(?:please|pls|can (?:you|u)|could you)\s+)*(?:analy[sz]e|review|look (?:at|over)|go over|check|help(?: me)?(?: with)?|work on|take a look at)\b[^?]*$/i;

  /* ---------------- the file cannot support the ask (T3 / T6) ---------------- */
  const DECLINE = 'If the file does not contain what this needs, say so instead of estimating.';
  // A prediction ask. "forecast" counts as a verb, "forecast for", or the thing to produce; "the forecast table on this slide" is a noun use about the file and does not.
  const FORECAST_ASK = /\b(?:predict\w*|projections?|forecast(?:ing)?\s+(?:for|our|my|next|what|how|whether)\b|forecast(?:ing)?\s+(?:(?:Q[1-4]|(?:FY|CY)\s?'?\d{2,4}|(?:19|20)\d{2}|next|the|this|our|my|each|every|full[- ]year|annual|quarterly|monthly)\s+)*(?:revenue|sales|earnings|income|costs?|expenses?|demand|cash|margins?|growth|spend|profit|ebitda)\b|(?:give|make|produce|build|create|run|need|want)\s+(?:me\s+)?(?:a|an|the)?\s*(?:\w+\s+)?forecast\b(?!\s+(?:table|tab|sheet|slide|file|column|row))|what will (?:our|the|it|this)\s+(?:[\w&-]+\s+){0,3}(?:do|be|look like|end up|land|come in)\b)/i;
  const FORECAST_BASIS = /\b(?:forecast(?:s|ed|ing)?|budget(?:s|ed|ing)?|plan(?:s|ned|ning)?|guidance|outlook|projections?|projected|targets?|estimat(?:e|es|ed|ion)|fcst|bgt|latest estimate|(?:(?:FY|CY)\s?'?\d{2,4}|(?:19|20)\d{2})E)\b/i;
  const CAT_ASK = /\b(?:category|cat\.?)\s*(\d{1,2})\b(?:\s*\(([^)]{3,60})\))?/gi;
  const CAT_EXPLAIN = /\b(?:explain|what counts|what does\b[^?.]*\bmean|walk me through|define|definition|what is)\b/i;
  const CAT_NAME = [null, 'purchased goods and services', 'capital goods', 'fuel- and energy-related activities', 'upstream transportation and distribution', 'waste generated in operations', 'business travel', 'employee commuting', 'upstream leased assets', 'downstream transportation and distribution', 'processing of sold products', 'use of sold products', 'end-of-life treatment of sold products', 'downstream leased assets', 'franchises', 'investments'];
  // One label per category: the full name plus the short forms a summary sheet uses (purch. goods, waste in ops, upstr./downstr., EOL).
  const CAT_LBL = [null, /purchased goods|purch\.? goods/, /capital goods/, /fuel[- ]and[- ]energy|energy-related/, /upstream (?:transport|t ?& ?d|t and d)|upstr\.? (?:transport|t ?& ?d)/, /waste generated|waste in op|(?:^|\n)\s*waste\s*[,\t:]/, /business travel/, /commut/, /upstream leased|upstr\.? leased/, /downstream (?:transport|t ?& ?d|t and d)|downstr\.? (?:transport|t ?& ?d)/, /processing of sold/, /use of sold/, /end[- ]of[- ]life|\beol\b/, /downstream leased|downstr\.? leased/, /franchis/, /investment/];
  const CAT_ANY = new RegExp(CAT_LBL.slice(1).map((r) => r.source).join('|') + '|\\b(?:category|cat\\.?)\\s*\\d{1,2}\\b');
  // One whole number token, matched greedily: a comma-grouped number (1,240 / 1,240,500, optional decimals) or a plain one (80 / 12.5 / 2025).
  // A comma group only counts when it is exactly three digits and ends the digits, so "1,2400" is the plain "1" then "2400".
  const NUM_TOKEN = '\\d{1,3}(?:,\\d{3})+(?!\\d)(?:\\.\\d+)?|\\d+(?:\\.\\d+)?';
  // Is the token lower.slice(i, j) a figure? Judged on the whole token in the original text, never on a window slice.
  function isFigure(lower, i, j) {
    const t = lower.slice(i, j), prev = i > 0 ? lower[i - 1] : '', next = j < lower.length ? lower[j] : '';
    if (/[a-z0-9_.]/.test(prev)) return false;                       // glued before (FY2025, Q4, H2, the tail of 1.2.3)
    if (/[a-z0-9_]/.test(next) || (next === '.' && /\d/.test(lower[j + 1] || ''))) return false; // glued after (1,240tco2e, 1.2.3)
    if (t.indexOf(',') < 0) {
      if (next === '%') return false;                                 // a bare percent
      if (/^(?:19|20)\d{2}$/.test(t)) return false;                   // a whole-token year (2025 yes, 2025.5 no)
    }
    return true;
  }
  // A figure follows the name when a number token STARTS within the 60 characters after it, the window being cut at the next category name or "category N" first.
  // The token itself is validated whole (it may run past the window edge).
  function figureAfter(lower, end) {
    const w = lower.slice(end, end + 60), c = w.search(CAT_ANY), lim = end + (c >= 0 ? c : w.length);
    const re = new RegExp(NUM_TOKEN, 'g'); re.lastIndex = end; let m;
    while ((m = re.exec(lower)) && m.index < lim) if (isFigure(lower, m.index, m.index + m[0].length)) return true;
    return false;
  }
  // True when some occurrence of s (a name typed in the ask) has a figure after it in the file text.
  function givenListed(lower, s) { for (let i = lower.indexOf(s); i >= 0; i = lower.indexOf(s, i + 1)) if (figureAfter(lower, i + s.length)) return true; return false; }
  // 'exact' = listed with a figure by number or by its own name; 'generic' = a plain "leased assets" row with a figure, which may be category 8 or 13; null = not listed.
  // byNameOnly skips "category N" (rule 3 counts names and short labels only).
  function categoryHit(n, lower, byNameOnly) {
    const starts = [new RegExp(CAT_LBL[n].source, 'g')];
    if (!byNameOnly) starts.unshift(new RegExp('\\b(?:category|cat\\.?)\\s*' + n + '\\b', 'g'));
    for (const re of starts) { let m; while ((m = re.exec(lower))) { if (figureAfter(lower, m.index + m[0].length)) return 'exact'; if (!m[0].length) re.lastIndex++; } }
    if (n === 8 || n === 13) {
      const rest = lower.replace(/(?:upstream|downstream|upstr\.?|downstr\.?) leased/g, ''), re = /leased assets/g; let m;
      while ((m = re.exec(rest))) if (figureAfter(rest, m.index + m[0].length)) return 'generic';
    }
    return null;
  }
  // "FY25" is present when the file says FY2025 (or FY 2025, FY'25), and the same for CY; FY26 against FY2024/FY2025 is still absent.
  function yearForms(term) {
    const q = /^(Q[1-4])\s?(FY)\s?'?(\d{2}|\d{4})$/i.exec(term);
    if (q) { // fiscal compound only: adjacent forms in either order; a bare calendar year (Q1 2025) is not accepted for a fiscal year
      const out = [];
      for (const y of yearForms(q[2] + q[3])) out.push(q[1] + ' ' + y, q[1] + y, y + ' ' + q[1], y + q[1], q[1] + '-' + y, y + '-' + q[1]);
      return out;
    }
    const m = /^(FY|CY)\s?'?(\d{2}|\d{4})$/i.exec(term); if (!m) return [term];
    const y = m[2].length === 2 ? '20' + m[2] : m[2], p = m[1];
    return [p + y, p + y.slice(2), p + ' ' + y, p + ' ' + y.slice(2), p + "'" + y.slice(2)];
  }
  function cannotSupport(prompt, files, intent) {
    if (!files.some((f) => (f.text || '').trim())) return null;
    const text = files.map((f) => (f.text || '').replace(/^## .*$/gm, '')).join('\n'); // file text only: a sheet NAME (the '## name' line engine/files.js writes) is not a forecast; a header cell or a cell value is
    if (FORECAST_ASK.test(prompt) && !FORECAST_BASIS.test(text)) return { kind: 'forecast' };
    if (intent === 'explain' || CAT_EXPLAIN.test(prompt)) return null;
    const lower = files.map((f) => f.text || '').join('\n').toLowerCase(); // the sheet name still counts as Scope 3 context here
    if (!/scope\s*3/i.test(prompt) || !/scope\s*3/.test(lower)) return null; // Scope 3 context in the ask AND in the file
    let exact = 0, generic = false;
    for (let n = 1; n <= 15; n++) { const h = categoryHit(n, lower); if (h === 'exact') exact++; else if (h === 'generic') generic = true; }
    if (exact + (generic ? 1 : 0) < 2) return null; // one name that fits two categories counts once
    for (const m of prompt.matchAll(CAT_ASK)) {
      const n = Number(m[1]); if (n < 1 || n > 15) continue;
      const given = (m[2] || '').toLowerCase().trim();
      if (categoryHit(n, lower) === null && !(given && lower.includes(given))) return { kind: 'category', n, name: given || CAT_NAME[n] };
    }
    return null;
  }
  function unsupportedNote(u) {
    return u.kind === 'forecast'
      ? 'You are asking for a forecast, but nothing in the attached file looks like a forecast, budget or plan, so Workiva AI can only guess. Ask what the file shows, or attach the forecast.'
      : 'Your file lists Scope 3 categories, but not category ' + u.n + ' (' + u.name + '), so Workiva AI cannot work it out from this file.';
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
    const headers = ((chosen && (chosen.named || (chosen.score > 0 && chosen.file.sheets.length === 1)) && chosen.sheet.headers) || []).filter((h) => h && h.length < 30).slice(0, 6);
    const ctx = {
      prompt, t, files, domain: opts.domain || domainOf(t + ' ' + files.map((f) => (f.text || '').slice(0, 3000)).join(' ').toLowerCase()),
      promptPeriods: [...new Set((prompt.match(/\b(?:FY|CY)\s?'?\d{2,4}\b|\bQ[1-4]\s?(?:FY\s?'?\d{2,4})?\b|\bH[12]\s?(?:FY\s?'?\d{2,4})?\b|\b20\d{2}\b/gi) || []).map((x) => x.replace(/\s+/g, ' ').toUpperCase()))],
      intent: null, object: restoreCase(prompt, objectOf(t)), periods: periodsIn(files), headers
    };
    ctx.audDomain = opts.areaSure === false ? 'GEN' : ctx.domain;
    ctx.intent = opts.intent || intentOf(t, files.some((f) => f.kind === 'Excel') || /\b(data|table|numbers|figures|emissions|revenue|metrics?)\b/.test(t));
    ctx.missingAsk = ctx.intent === 'anomaly' && missingAsk(prompt);
    ctx.unsupported = cannotSupport(prompt, files, ctx.intent);
    const taskSure = opts.taskSure !== false;
    const gen = { S: sourceFragment(ctx), C: contextFragment(ctx), O: objectiveFragment(ctx), P: paramsFragment(ctx), E: evalFragment(ctx) };
    const BLANK = { O: 'Identify and list [what you want back, such as the issues and where they are, or the key points]. ', P: 'Format it as [a table, bullets, or a short paragraph]. ', E: evalFragment({ intent: null }) };
    if (!taskSure) Object.assign(gen, BLANK);
    const sentences = userSegments(prompt, d, on);
    const eh = d.el.E.hits;
    const scopeLimitOnlyE = eh.length > 0 && eh.every((h) => h.tag === 'do-not-touch' && h.orig && /^[^.!?\n]*\b(?:outside|beyond|other than|apart from|aside from|except)\b/i.test(prompt.slice(h.orig[0])));
    // First try keeping every sentence of the user's own ask. If the strong version still has no
    // clear job, fall back to replacing the vague sentence (the user's other cues are kept).
    function build(broad) {
      const g = { ...gen }; let folded = false; let objAt = -1;
      // A vague objective sentence is replaced by the generated objective; keep its other cues.
      const kept = [];
      for (const snt of sentences) {
        if (!/[a-z0-9]/i.test(tidyChat(snt.text))) continue; // only "thoughts?" or a greeting
        // Only a bare "analyze/review/look at X" is replaced; any other wording is the user's ask and stays.
        // ...and a bare one only when the new objective still names what it was about (the fallback keeps its cues)
        if (!on.O && (covers(g.O, snt.text) && VAGUE_ONLY.test(snt.text) && snt.text.trim().split(/\s+/).length <= 8 || broad && (snt.host === 'O' || snt.vague && VAGUE_VERB.test(snt.text)))) {
          if (objAt < 0) objAt = kept.length;
          const taken = [];
          for (const x of snt.inside.filter((y) => y.k === 'C' || y.k === 'P' || y.k === 'E').sort((p, q) => p.a - q.a)) {
            if (taken.some((y) => x.a < y.b && x.b > y.a)) continue; taken.push(x);
            const phrase = prompt.slice(x.a, x.b).replace(/^[\s,]+|[\s,]+$/g, '');
            const core = phrase.replace(/^(?:for|during|over|across|since|from|between|in)\s+/i, '').toLowerCase();
            if (core && gen[x.k === 'P' ? 'O' : x.k] && gen.O.toLowerCase().includes(core)) continue; // already stated by the new objective
            kept.push({ host: x.k, idx: snt.idx, segs: [{ text: asSentence(x.k, phrase) + ' ', letter: x.k }], letters: new Set([x.k]) });
          }
          continue;
        }
        if (!on.O && !folded && VAGUE_ONLY.test(snt.text) && snt.text.trim().split(/\s+/).length <= 8) {
          const subject = snt.text.trim().replace(VAGUE_LEAD, '').replace(/[.!?\s]+$/, '');
          if (subject && !/^(?:it|this|that|them|these|those)$/i.test(subject)) {
            g.O = 'For ' + subject + ': ' + g.O.charAt(0).toLowerCase() + g.O.slice(1); folded = true; if (objAt < 0) objAt = kept.length; continue;
          }
        }
        kept.push(snt);
      }
      // The user's own question stays as the job; add only a finish line for them to fill in.
      if (!on.O && !folded && kept.some((x) => x.text && x.host === 'O')) Object.assign(g, { O: BLANK.O, P: BLANK.P, E: BLANK.E });
      const present = new Set(); for (const snt of kept) for (const l of snt.letters) present.add(l);
      // Only Context missing: add just that sentence. A letter the detector sees in a sentence that does not host it
      // (e.g. the objective inside a Source sentence) still needs a segment of its own, written without a blank.
      const onlyC = !on.C && K.every((k) => k === 'C' || on[k]);
      const genUsed = new Set(onlyC ? ['C'] : []);
      if (onlyC) { const BF = { S: 'Use only the selected content and nothing outside it. ', O: 'List the specific items that answer this, one per line. ', P: 'Keep it short. ', E: 'Do not guess or add facts that are not in the source; flag anything you are unsure of.' };
        for (const k of K) if (k !== 'C' && !present.has(k)) { genUsed.add(k); if (g[k].includes('[')) g[k] = BF[k]; } }
      else for (const k of K) if (!present.has(k) || (k === 'O' && !on.O) || (k === 'S' && !on.S && !present.has('S'))) genUsed.add(k);
      // A scope limit ("Don't comment on anything outside X") matches Evaluate but is a Parameter by the labeling rules (data/LABELING.md);
      // when it is the only Evaluate match, the coach still adds its own checking sentence.
      if (on.E && scopeLimitOnlyE) genUsed.add('E');
      const segments = [];
      const emit = (list) => { for (const snt of list) { for (const x of snt.segs) segments.push({ ...x, src: snt.idx }); segments.push({ text: ' ', letter: snt.host, src: snt.idx }); } };
      const pushGen = (k) => { if (genUsed.has(k)) segments.push({ text: g[k], letter: k, generated: true }); };
      // opening Source sentences: leading kept Source sentences that come before any replaced vague sentence
      let open = 0; while (open < kept.length && kept[open].host === 'S' && (objAt < 0 || open < objAt)) open++;
      const cut = genUsed.has('O') ? Math.min(Math.max(objAt >= 0 ? objAt : open, open), kept.length) : kept.length;
      emit(kept.slice(0, open)); pushGen('S'); pushGen('C');
      emit(kept.slice(open, cut)); pushGen('O'); emit(kept.slice(cut));
      pushGen('P'); pushGen('E');
      const allOn = new Set(K);
      // Self-check: re-grade the strong version; if a generated letter does not register,
      // swap in a more explicit wording for it (at most two passes).
      const ALT = {
        S: ['Use only the selected content and nothing outside it. '],
        C: ['The audience is [who will read it, such as ' + AUDIENCE[ctx.audDomain] + ']. ', 'This is intended for [who will read it, such as ' + AUDIENCE[ctx.audDomain] + ']. '],
        O: ['List the specific items that answer this, one per line. ', 'Identify and list the specific items that answer this request. '],
        P: ['Return a table with one row per item, under [length]. ', 'Return a table with one row per item and one line per row, under [length]. '],
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
      // Generated text must not knock out a letter the user already had (an example word such as "review"
      // reads as a vague verb): if the objective is lost, add a blank-free one after the Context sentence.
      { const fin = detect(assemble(segments, allOn)).on;
        if (!fin.O && !genUsed.has('O')) {
          const at = segments.findIndex((x) => x.generated && x.letter === 'C');
          segments.splice(at + 1, 0, { text: g.O.includes('[') ? ALT.O[0] : g.O, letter: 'O', generated: true }); genUsed.add('O');
        } }
      // Fewer blanks when it costs nothing: when the task is sure and a generated Context sentence already adds a blank,
      // a blank-free objective replaces the fill-in one if the result stays strong. Only for tasks whose output is a list.
      { const seg = segments.find((x) => x.generated && x.letter === 'O' && x.text.includes('['));
        if (seg && taskSure && genUsed.has('C') && LIST_INTENT.has(ctx.intent) && !CHANGE_ASK.test(ctx.t)) { const was = seg.text; seg.text = ALT.O[0]; if (R.grade(detect(assemble(segments, allOn)).on) !== 'strong') seg.text = was; } }
      const betterOk = R.grade(detect(assemble(segments.filter((g) => !g.generated || g.letter === 'S' || g.letter === 'O'), allOn)).on) !== 'weak';
      return { segments, genUsed, ok: detect(assemble(segments, allOn)).on.O && betterOk };
    }
    let built = build(false);
    // with no confident task there is nothing better to put in its place, so never drop their words
    if (!built.ok && !on.O && taskSure) { const alt = build(true); if (alt.ok) built = alt; }
    const { segments, genUsed } = built;
    // T3: when the file cannot support the ask, the generated Evaluate sentence also tells the AI to decline (a strong prompt is returned as typed, so it never gets this).
    if (ctx.unsupported && grade !== 'strong') { const ev = segments.find((x) => x.generated && x.letter === 'E'); if (ev && !ev.text.includes(DECLINE)) ev.text = ev.text.replace(/\s*$/, ' ') + DECLINE; }
    const allOn = new Set(K);
    const strongP = assemble(segments, allOn);
    const betterSegs = segments.filter((g) => !g.generated || g.letter === 'S' || g.letter === 'O');
    const betterP = assemble(betterSegs, allOn);
    const vagueVerb = (t.match(/\b(analy[sz]e|look at|review|check|help(?: me)?(?: with)?|go over|improve|work on)\b/) || [])[1];
    const weakP = grade === 'weak' ? prompt.trim() : (vagueVerb ? vagueVerb : 'Look at').replace(/^./, (c) => c.toUpperCase()) + ' ' + (ctx.object ? 'our ' + ctx.object : 'this') + '.';
    const stages = {
      weak: { prompt: grade === 'weak' ? prompt.trim() : weakP, verdict: verdictFor('weak', grade === 'weak' ? on : { S: false, C: false, O: false, P: false, E: false }, { vague: grade === 'weak' && !on.O ? vagueVerb : (grade === 'weak' ? null : vagueVerb || 'look at') }) },
      better: { prompt: grade !== 'better' || R.grade(detect(betterP).on) !== 'weak' ? betterP : assemble([{ text: prompt, letter: 'O' }], allOn), verdict: verdictFor('better', grade === 'better' ? on : { ...on, S: true, O: true }, {}) },
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
    const stackedAll = !!d.stacked || listStacked(prompt);
    if (stackedAll) notes.push({ kind: 'stacked', text: 'You are asking for several things at once. Split them into separate prompts and ask one at a time.' });
    if (PERSONAL.test(prompt) || salaryPersonal(prompt)) notes.push({ kind: 'personal', text: "This prompt seems to include personal or account details. Remove them or check your company's policy before you paste it." });
    if (CALC.test(prompt)) notes.push({ kind: 'calc', text: 'Workiva AI can get figures wrong. Check every figure it calculates against the source.' });
    const offtopic = !files.length && NONWORK.test(prompt) && !WORK.test(prompt) && !WORK2.test(prompt) && !Object.values(DOMAIN).some((re) => { re.lastIndex = 0; return re.test(t); });
    if (offtopic) notes.push({ kind: 'offtopic', text: 'This does not look like a Workiva task. The Coach is for prompts about your reports, data or documents.' });
    if (d.words < 6) notes.push({ kind: 'short', text: 'Very short prompts leave almost everything to guesswork. Aim for one or two full sentences.' });
    if (files.length) {
      const fileText = files.map((f) => (f.text || '') + ' ' + (f.sheets || []).map((s) => s.name + ' ' + (s.headers || []).join(' ')).join(' ')).join(' ').toLowerCase();
      const terms = (prompt.match(/\bQ[1-4]\s?FY\s?'?\d{2,4}\b|\b(?:FY|CY)\s?'?\d{2,4}\b|\bQ[1-4]\b|\b(?:19|20)\d{2}\b|\bScope [123]\b|\b[A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)+\b/g) || []).filter((x) => !/^(You|The|Use|Do|Please)\b/.test(x));
      const missingTerms = [...new Set(terms)].filter((x) => !yearForms(x).some((v) => new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\d)', 'i').test(fileText)));
      if (missingTerms.length) notes.push({ kind: 'grounding', text: 'Your prompt mentions ' + listify(missingTerms.map((x) => '"' + x + '"')) + ', which does not appear in the attached ' + (files.length === 1 ? 'file' : 'files') + '. Check you attached the right source.' });
      if (ctx.unsupported) notes.push({ kind: 'unsupported', text: unsupportedNote(ctx.unsupported) });
      if (ctx.periods.length) notes.push({ kind: 'periods', text: 'Periods found in your files: ' + ctx.periods.join(', ') + '.' });
    }
    const tips = workivaTips(ctx, on, files);
    const filled = K.filter((k) => !on[k]);
    const headline = grade === 'strong' ? 'It names a source, context, one job, constraints, and a check.'
      : grade === 'better' ? 'It has a source and a job; it is missing ' + listify(filled.map((k) => MISSING[k])) + '.'
      : !on.S && files.length ? 'You attached ' + listify(files.map((f) => cleanFile(f.name))) + ', but the prompt does not point to it. Start with ' + files.map((f) => '@' + cleanFile(f.name)).join(' ') + (on.O ? ' so the AI knows what to read.' : ' and say the one thing you want back.')
      : 'The AI would have to guess ' + listify(['S', 'O'].filter((k) => !on[k]).map((k) => MISSING[k])) + '.';
    const placeholders = (strongP.match(/\[[^\]]+\]/g) || []).length;
    return { grade, detected: on, headline, stages, scope, segments, notes, stacked: stackedAll, offtopic, tips, intent: ctx.intent, domain: ctx.domain, placeholders, hits: d.el };
  }

  // Coach notes (T4): additive warnings that never change a grade, weight or rewrite.
  const LIST_VERBS = /^(?:please |then |also )?(summari[sz]e|draft|write|rewrite|compare|list|check|review|extract|translate|calculate|compute|reconcile|explain|analy[sz]e|flag|email|format|convert|prepare|generate|find|build|create)\b/;
  function listStacked(text) {
    const seen = new Set();
    for (const seg of text.toLowerCase().split(/\s*(?:,\s*(?:and\s+|then\s+)?|;\s*|\s+and\s+)/)) { const m = LIST_VERBS.exec(seg.trim()); if (m) seen.add(m[1].replace(/z/g, 's')); }
    return seen.size >= 3;
  }
  const PERSONAL = new RegExp([
    String.raw`\b\d{3}-\d{2}-\d{4}\b`,
    String.raw`\b(?:ssn|social security(?: number| no\.?)?)\W{0,5}\d{3}[- ]?\d{2}[- ]?\d{4}\b`,
    String.raw`\bdate of birth\b|\bdob\b`,
    String.raw`\bborn\b[^.\n]{0,20}\b(?:19|20)\d{2}\b`,
    // an account / card / routing / IBAN number needs a number marker or a bank/card word: "GL account 40100200" and "bank loan of 25000000" are accounting
    String.raw`\b(?:account|acct|routing|iban|card)\s*(?:number|no\.?|#)\s*:?\s*\d[\d -]{6,}\d`,
    String.raw`\b(?:bank|checking|savings|card)\s+(?:account|acct)\s*:?\s*\d[\d -]{6,}\d`,
    String.raw`\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}\b`
  ].join('|'), 'i');
  const SALARY = /\bsalar(?:y|ies)\b/i;
  const AGGREGATE = /\b(?:expense|expenses|accruals?|budget|total|cost|costs|payroll|department|departments|rose|fell|increase|decrease|%)\b|%/i;
  function salaryPersonal(text) {
    if (!SALARY.test(text)) return false;
    const amount = /\bsalar(?:y|ies)\b(?:\W+\w+){0,4}?\W+\$?\d[\d,.]*\d|\$?\d[\d,.]*\d(?:\W+\w+){0,4}?\W+salar(?:y|ies)\b/i.test(text);
    const person = /\b[A-Z][a-z]+(?: [A-Z][a-z]+)?['’]s salar/.test(text) || /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text.replace(/(^|[.!?]\s+)\S+/g, '$1')) || /\b(?:employee|his|her)\b/i.test(text);
    if (/\b[A-Z][a-z]+(?: [A-Z][a-z]+)?['’]s salar/.test(text)) return true;
    if (!amount && !(person && /\$\s?\d|\b\d{4,}\b/.test(text))) return false;
    return !(AGGREGATE.test(text) && !person);
  }
  const CALC = /\b(?:calculate|compute|recalculate|recompute|work out|sum|sum up|total up|add up)\b|\btotal(?:s|ed)? (?:the|each|all|by)\b/i;
  const NONWORK = /\b(?:weather|forecast for (?:today|tomorrow)|poems?|haiku|limerick|jokes?|riddles?|stories|story|recipes?|songs?|lyrics|movies?|films?|sports?|football|soccer|baseball|basketball|horoscope|trivia|vacation|holiday|restaurants?|cats?|dogs?|pets?|birthday|wedding|dating|gossip|celebrity|video games?|fairy tale|bedtime)\b/i;
  const WORK2 = /\b(?:docs?|letters?|paragraphs?|tabs?|text|drafts?|slides?|releases?|headlines?|calcs?|eps|pages?|charts?|graphs?|list|bullets?|notes?|minutes|agenda|proposal|plan|checklist|template|workbook|excel|pdf|powerpoint|csv|sentences?|wording|tone|rewrite|proofread|edit|cfo|ceo|auditors?|assurers?|regulators?|stakeholders?|analysts?|investors?|clients?|team|manager|company|business|project|quarterly|annual|cost|costs|price|sales|profit|loss|income|assets?|liabilit\w*|cash|debt|loan|percent|pbc|pcaob|cells?|columns?|rows?|talking points)\b|[%$€£]/i;
  const WORK = /\b(?:report|reports|data|document|documents|file|files|spreadsheet|sheet|table|budget|audit|auditor|control|controls|risk|risks|policy|policies|revenue|expense|expenses|variance|filing|disclosure|esg|sox|ledger|invoice|invoices|statement|statements|financial|finance|accounting|compliance|workiva|wdata|workspace|board|committee|quarter|fiscal|emissions|sustainability|tax|payroll|forecast|margin|contract|memo|deck|presentation|section|footnote|10-?k|10-?q|xbrl|kpi|metrics?|figures?|numbers?|customer|customers|vendor|vendors|employee|employees|email|summary|analysis|review|q[1-4]|fy\s?\d*)\b|@\w/i;

  // The one display rule, used by the page and by the Fit Finder prompts-strong test so they cannot drift:
  // off-topic is shown weak; a strong grade with several asks stacked is shown better.
  function displayGrade(r, prompt) {
    if (r.offtopic) return 'weak';
    return r.grade === 'strong' && r.hits && r.stacked ? 'better' : r.grade;
  }

  const api = { displayGrade, listStacked, sentenceSpans, missingAsk, directVoice, fixTypos, coach, assemble, domainOf, intentOf, objectOf, INTENTS, DOMAIN };
  if (isNode) module.exports = api; else root.ScopeRewrite = api;
})(typeof window !== 'undefined' ? window : globalThis);
