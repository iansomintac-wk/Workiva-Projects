/* Fit engine: does a described task have a part Workiva AI can take?
   rate(text) -> { fit: 'good'|'partial'|'not', repeats, ops:[...], blockers:[...], hits:{op:[phrases]} }
   Rule from the Workiva AI explainer: repetitive, text-heavy reading, drafting, explaining and
   checking is a fit; judgment, sign-off, exact calculation, other systems and chasing people are not. */
(function (root) {
  const isNode = typeof module !== 'undefined' && module.exports;

  // what the task asks a person to do with text or tables
  const OPS = {
    READ: /\b(?:read(?:ing)?|go(?:ing)? through|review(?:ing)?|look(?:ing)? (?:at|over|through)|skim|pore over|wade through)\b/,
    SUMMARIZE: /\b(?:summar\w*|recap\w*|condens\w*|boil\w* (?:it |them )?down|key points|highlights|tl;?dr|brief(?:ing)?s?\b|exec(?:utive)? summary|status update)/,
    COMPARE: /\b(?:compar\w*|vs\.?|versus|against (?:last|prior|the)|what changed|changes? (?:from|between|since)|year[- ]over[- ]year|yoy|prior (?:reporting )?(?:year|period|quarter)|last (?:year|quarter)'?s?|diff(?:ing)?|benchmark\w*|peers?)\b/,
    CHECK: /\b(?:check\w*|review(?:ing)? (?:the |all |every |their )?(?:[\w-]+ )?evidence|tie[- ]?out\w*|ti(?:e|ing) (?:out|back)|reconcil\w*|verif\w*|validat\w*|proofread\w*|catch\w* (?:errors?|typos?|mistakes?)|look(?:ing)? for (?:errors?|gaps?|mistakes?|inconsisten\w*)|flag\w*|make sure|consisten\w*|inconsisten\w*|gaps?|missing|mismatch\w*|duplicates?|outliers?|anomal\w*|errors?|typos?|(?:don'?t|doesn'?t|do not|does not|still) match\w*|match(?:es)? (?:what|the)|see if|leav\w* comments|review comments|broken|foot(?:s|ing)? (?:and|to)|cross[- ]?foot\w*|whether (?:[\w-]+ ){0,5}(?:controls?|polic(?:y|ies)|procedures?|evidence|tests?|testing|documentation|scope) cover(?:s|ed)?)\b/,
    EXTRACT: /\b(?:pull(?:ing)? (?:out|together)?|extract\w*|list(?:ing)? (?:all|every|out)|compil\w*|gather(?:ing)? (?:all|the) (?:\w+ )?(?:from|in)|copy(?:ing)? (?:over|out)|find(?:ing)? (?:all|every|where)|not(?:es?|ing) (?:the |any |all )?(?:exceptions?|deviations?|findings?))\b/,
    DRAFT: /\b(?:draft\w*|writ(?:e|ing)|wrote|(?:generat|suggest)\w* (?:[\w-]+ ){0,3}questions?|prepar\w* (?:the |a )?(?:narrative|memo|commentary|footnote|finding|report|section|summary|response|reply|email|letter|deck|script|disclosure)|put together|write[- ]?ups?|creat\w* (?:the |a )?(?:narrative|memo|deck|slides?|template|checklist|test steps|quer(?:y|ies))|come up with|(?:creat\w*|build\w*) (?:the |a |an |our )?(?:[\w-]+ ){0,3}(?:roadmap|plan)s?(?! (?:in|into|on) (?:the |our |a )?(?:jira|sap|oracle|netsuite|erp|hyperion|onestream|blackline|asana|smartsheet|servicenow|workday|trello|monday|planner|ms project|microsoft project|(?!workiva |slide |presentation |spreadsheet )(?:[\w-]+ )?(?:system|tool|platform))\b| to (?:chase|collect|get (?:[\w-]+ ){0,4}(?:from|out of) (?:the )?(?:sites?|suppliers?|vendors?|owners?|teams?|people|managers?|business|plants?|facilit\w*)|gather|follow|send|email|schedule|book)))\b/,
    REWRITE: /\b(?:rewrit\w*|translat\w*|re-?word\w*|rephras\w*|edit\w*|tighten\w*|shorten\w*|simplif\w*|clean(?:ing)? up (?:the )?(?:language|wording|text)|polish\w*|tone|plain english|update (?:the )?(?:language|wording|narrative|section|policy|commentary|disclosure)|roll(?:ing)? forward (?:[\w']+ ){0,3}(?:commentary|narrative|text|language|disclosures?|sections?)|word(?:ed|ing) (?:[\w'-]+ ){0,2}better|keep(?:ing)? (?:[\w-]+ ){0,6}up to date)\b/,
    EXPLAIN: /\b(?:explain\w*|(?:generat|giv|writ|draft|suggest|offer)\w* (?:(?!their )[\w-]+ ){0,2}explanations?|interpret\w*|what (?:a|the) (?:new )?(?:rule|standard|requirement)s? (?:means?|requires?)|understand(?:ing)? (?:the|what|how)|walk(?:ing)? (?:\w+ )?through|answer(?:ing)? (?:\w+ ){0,2}questions?|new (?:rules?|standards?|requirements?|guidance))\b/,
    MAP: /\b(?:map\w*|crosswalk\w*|align\w* (?:to|with)|link\w* (?:\w+ ){0,3}to|which (?:principle|requirement|datapoint|criteria)|esrs datapoints?|coso|nist|iso ?27001|tag(?:ging)? (?:to|with))\b/,
    CLASSIFY: /\b(?:rank(?:s|ed|ing)?|rationali[sz]\w*|classif\w*|categori[sz]\w*|sort(?:ing)?|group(?:ing)?|bucket\w*|triag\w*|rat(?:e|ing) (?:each|the|them)|scor(?:e|ing) (?:each|the|them))\b/,
    ESTIMATE: /\b(?:estimat(?:e|es|ing) (?!(?:[\w-]+ ){0,4}(?:tax\w*|provisions?|reserves?|allowances?|accru\w*|impairment\w*|liabilit\w*|deferred|bad debts?|fair value|depreciation|amorti[sz]ation)\b)(?:the|how|what|our|an?|when)(?: [\w-]+){0,8} (?:needed|required|to (?:reach|hit|meet|achieve|close))\b|trajector(?:y|ies)\b)/,
    CALCULATE: /\b(?:calculat\w*|comput\w*|recalc\w*|math|add(?:ing)? up|sum(?:ming)?|totals?|emission factors?|convert(?:ing)? (?:units|kwh|litres|liters|gallons|currenc\w*)|fx|allocat\w*|accru\w*|depreciat\w*|forecast\w*|model(?:ing|ling)?\b|pivot)\b/,
    DECIDE: /\b(?:decid\w*|approv\w*|sign(?:ing)?[- ]?off|signs? off|judg\w*|materialit\w*|conclud\w*|determin\w*|assess(?:ing)? whether|evaluat\w* whether|whether (?:it|we|this) (?:is|are|should)|choos\w*|pick(?:ing)? (?:which|the)|call on|make the call|prioriti[sz]\w*|negotiat\w*)\b/,
    // a past tense (uploaded, submitted, exported ...) is acting only after "I" or "we"; otherwise it describes the data
    ACT: /\b(?:(?:from|out of|into) (?:the )?(?:erp|sap|oracle|netsuite|hyperion|onestream|blackline|gl system|system)\b|post(?:ing)? (?:the )?(?:[\w-]+ )?(?:entries|journals?|je)|calendar invites?|book(?:ing)?|(?:(?!\w+ed\b)|(?<=\b(?:i|we)(?:'ve| have| had)?(?: just| already| also| then)? ))(?:(?<!(?:owners?|they|people|teams?|sites?|suppliers?) )upload\w*|submit\w*|migrat\w*|schedul\w*|updat\w* (?:the )?(?:erp|sap|oracle|netsuite|system|portal|tracker|jira)|download\w*|export\w*|print\w*|distribut\w*)|fil(?:e|ing) (?:with|on|to) (?:the )?(?:sec|edgar)|edgar|send(?:ing)?|email(?:ing)? (?:out|the|everyone|them)|set(?:ting)? up (?:meetings?|calls?)|enter(?:ing)? (?:\w+ ){0,2}into|key(?:ing)? in|log(?:ging)? into|kick off|run(?:ning)? the (?:close|consolidation|report))\b/,
    COLLECT: /\b(?:chas\w*|follow(?:ing)?[- ]up(?! questions?)|track(?:ing)? down|workshops?|interview\w*|what (?:the )?(?:[\w-]+ )?(?:owners?|teams?|people|managers?) (?:say|tell)|nudg\w*|remind\w*|ping(?:ing)?|hound\w*|collect\w* (?:\w+ ){0,3}from|get(?:ting)? (?:\w+ ){0,4}(?:from|out of) (?:the )?(?:sites?|suppliers?|vendors?|owners?|teams?|people|managers?|business|plants?|facilit\w*)|request\w* (?:\w+ ){0,3}from|wait(?:ing)? (?:on|for) (?:people|them|the \w+ team|suppliers?|owners?|sites?)|survey(?:ing)? (?:the )?(?:suppliers?|sites?))\b/
  };
  const AI_OPS = ['READ', 'SUMMARIZE', 'COMPARE', 'CHECK', 'EXTRACT', 'DRAFT', 'REWRITE', 'EXPLAIN', 'MAP', 'CLASSIFY', 'ESTIMATE'];
  const BLOCKER_OF = { DECIDE: 'judgment', ACT: 'cross-system', COLLECT: 'collect-from-people', CALCULATE: 'exact-calc' };
  const REPEATS = /\b(?:every|each|all (?:\d+|the|our)|monthly|quarterly|annual(?:ly)?|weekly|daily|recurring|routine|always|again|each time|per (?:quarter|month|year|period)|every (?:quarter|month|year|close|cycle|period|time)|close|q[1-4]s?\b|quarter(?:s|ly)?|year[- ]end|10-?qs?|cycle|season|\d+ (?:entities|controls|suppliers|sites|sections|accounts|policies|risks)|10-?k|month[- ]end|earnings|board deck|management report|findings|workpapers|colleagues'? drafts|drafts from|responses|line by line|same email|filing|assurance(?! provider)|survey)\b/;
  const ONE_OFF = /\b(?:one[- ]?off|one[- ]time|once(?! a (?:year|quarter|month|week))|first time|this (?:one|single)|new project|implementation|migration|just this|ad hoc|this year only)\b/;
  const APPROVAL_ONLY = /\b(?:approv\w*|sign(?:ing)?[- ]?off|signs? off|final (?:call|decision)|materiality (?:call|decision|judg\w*))\b/;

  function normalize(t) {
    return (' ' + String(t || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ') + ' ')
      .replace(/\bu\b/g, 'you').replace(/\bw\/o\b/g, 'without').replace(/\b(?:prev|prv)\b/g, 'previous');
  }

  function rate(text, opts) {
    const t = normalize(text);
    const ops = [], hits = {};
    for (const [op, re] of Object.entries(OPS)) {
      const m = t.match(new RegExp(re.source, 'g'));
      if (m) { ops.push(op); hits[op] = [...new Set(m.map((s) => s.trim()))]; }
    }
    const ai = ops.filter((o) => AI_OPS.includes(o));
    // "read" alone is how every task starts; it counts only next to a real job
    const aiCore = ai.filter((o) => o !== 'READ');
    const blockers = [...new Set(ops.map((o) => BLOCKER_OF[o]).filter(Boolean))];
    const repeats = opts && typeof opts.repeats === 'boolean' ? opts.repeats : REPEATS.test(t) && !ONE_OFF.test(t);
    if (ONE_OFF.test(t)) blockers.push('one-off');
    let fit;
    if (!aiCore.length) fit = ai.length && !blockers.length ? 'partial' : 'not';
    else if (!blockers.length) fit = repeats ? 'good' : 'partial';
    else if (aiCore.every((o) => o === 'CHECK' || o === 'COMPARE') && blockers.some((b) => b !== 'judgment')) fit = 'not';
    else fit = aiCore.length >= 2 || !APPROVAL_ONLY.test(t) ? 'partial' : 'not';
    return { fit, repeats: repeats ? 1 : 0, ops, blockers, hits, steps: steps(t, ops), prompt: starter(text, ops, fit) };
  }

  // what each step is, who keeps it, and why (plain words; no product claims)
  const STEP = {
    READ: ['Read the material', 'ai', 'Workiva AI reads the file or selection you point it to.'],
    SUMMARIZE: ['Summarize it', 'ai', 'A first summary you can edit.'],
    COMPARE: ['Compare versions or periods', 'ai', 'It lists what changed; you judge what matters.'],
    CHECK: ['First-pass check', 'ai', 'It flags errors, gaps and mismatches; you confirm each one.'],
    EXTRACT: ['Pull out the items', 'ai', 'It lists every item it finds, with where it is.'],
    DRAFT: ['Write a first draft', 'ai', 'A draft from your source; you edit and own the final words.'],
    REWRITE: ['Rewrite or update text', 'ai', 'Shorter, clearer or updated wording; every number stays yours to check.'],
    EXPLAIN: ['Explain it', 'ai', 'A plain-language explanation; you check it against the source.'],
    MAP: ['Map to a framework', 'ai', 'Suggested links with reasons; you make the final call.'],
    CLASSIFY: ['Sort or tag items', 'ai', 'Suggested groups; you confirm them.'],
    ESTIMATE: ['First-pass estimate', 'ai', 'A projection from your data with the working shown; you check every number.'],
    CALCULATE: ['Calculate the numbers', 'you', 'Exact numbers belong in formulas or your system of record; the AI can explain a formula.'],
    DECIDE: ['Decide or sign off', 'you', 'Judgment and sign-off stay with a person.'],
    ACT: ['Act in other systems', 'you', 'Posting, sending, uploading and scheduling stay with you or your other tools.'],
    COLLECT: ['Get input from people', 'you', 'Chasing people stays with you; the AI can draft the request.']
  };
  function steps(t, ops) {
    const at = (op) => { const m = t.match(OPS[op]); return m ? m.index : 1e9; };
    return [...ops].sort((a, b) => at(a) - at(b)).map((op) => ({ op, label: STEP[op][0], who: STEP[op][1], why: STEP[op][2] }));
  }

  // a starter prompt for the part Workiva AI can take, keeping the person's own description
  const ASK = {
    CHECK: 'Check it for errors, gaps and mismatches. List each issue with where it is and why it looks wrong.',
    COMPARE: 'Compare the two versions or periods and list what changed, with where each change is.',
    SUMMARIZE: 'Summarize the key points in [number] bullets for [who will read it].',
    DRAFT: 'Draft a first version for [who will read it]. Mark anything I need to confirm as [to confirm].',
    REWRITE: 'Rewrite it to be [shorter, clearer, or up to date], keeping every number and fact.',
    EXTRACT: 'Pull every [item] into a table, with where each one appears.',
    EXPLAIN: 'Explain it in plain terms for [who will read it].',
    MAP: 'Map each item to [the framework], with a one-line reason. Mark any you are unsure of.',
    CLASSIFY: 'Sort the items into [the groups you use], one line each with the reason.',
    ESTIMATE: 'Estimate [what] from the data. Show each step of the working and mark every assumption as [to confirm].',
    READ: 'Read it and list the points I should look at first.'
  };
  // the first thing the task does that the AI can take (reading only when nothing else is there)
  function lead(text) {
    const t = normalize(text), at = (op) => { const m = t.match(OPS[op]); return m ? m.index : 1e9; };
    const ai = AI_OPS.filter((o) => OPS[o].test(t));
    return ai.filter((o) => o !== 'READ').sort((a, b) => at(a) - at(b))[0] || (ai.includes('READ') ? 'READ' : null);
  }
  function starter(text, ops, fit) {
    const first = lead(text);
    const task = String(text || '').trim().replace(/\s+/g, ' ').replace(/[.!?]*$/, '.');
    if (!first) {
      if (ops.includes('COLLECT')) return 'Draft a short, polite request to [who] asking for [what you need] by [date]. Context: ' + task;
      return null;
    }
    return 'Use only [the selected file or table]. My task: ' + task + ' ' + ASK[first] + ' Do not add facts that are not in the source; I will review and decide.';
  }
  // a use case's fuller prompt fits only when it starts where the person's task starts
  function patternPrompt(text, u) {
    return u && u.prompt && u.ops && lead(text) === u.ops[0] ? u.prompt : null;
  }

  // a checklist, test plan or calendar: rate every line that reads like a task
  function scan(text) {
    const lines = String(text || '').split(/\r?\n|;\s+|\u2022/).map((l) => l.replace(/^\s*(?:[-*\d.)\]]+|\[[ x]\])\s*/i, '').replace(/,\s*,+/g, ',').trim())
      .filter((l) => l.split(/\s+/).length >= 3 && l.length <= 300 && !/^##\s/.test(l));
    const seen = new Set(), out = [];
    for (const l of lines) {
      const k = l.toLowerCase(); if (seen.has(k)) continue; seen.add(k);
      const r = rate(l);
      if (r.ops.length) out.push({ task: l, ...r });
    }
    return out;
  }

  // which sourced use cases (data/catalogue.json) fit this task: a keyword hit plus a shared operation
  function match(text, catalogue, max) {
    const r = rate(text);
    if (r.fit === 'not' || !catalogue) return [];
    const t = normalize(text), ai = r.ops.filter((o) => AI_OPS.includes(o) && o !== 'READ');
    return catalogue.useCases.map((u) => {
      const kw = t.match(new RegExp('\\b(?:' + u.match + ')', 'g'));
      const shared = u.ops.filter((o) => ai.includes(o)).length;
      // a general entry gives way to a specific one that fits as well
      return { u, score: kw && shared ? shared * 2 + new Set(kw).size - (u.area === 'GEN' ? 1.5 : 0) : 0 };
    }).filter((x) => x.score).sort((a, b) => b.score - a.score).slice(0, max || 3).map((x) => x.u);
  }

  const api = { rate, scan, match, lead, patternPrompt, normalize, OPS, AI_OPS, STEP };
  if (isNode) module.exports = api; else root.FitEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
