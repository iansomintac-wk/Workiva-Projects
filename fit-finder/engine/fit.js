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
    COMPARE: /\b(?:compar\w*|vs\.?|versus|against (?:last|prior|the)|what changed|changes? (?:from|between|since)|year[- ]over[- ]year|yoy|prior (?:year|period|quarter)|last (?:year|quarter)'?s?|diff(?:ing)?|benchmark\w*|peers?)\b/,
    CHECK: /\b(?:check\w*|tie[- ]?out\w*|ti(?:e|ing) (?:out|back)|reconcil\w*|verif\w*|validat\w*|proofread\w*|catch\w* (?:errors?|typos?|mistakes?)|look(?:ing)? for (?:errors?|gaps?|mistakes?|inconsisten\w*)|flag\w*|make sure|consisten\w*|inconsisten\w*|gaps?|missing|mismatch\w*|duplicates?|outliers?|anomal\w*|errors?|typos?|(?:don'?t|doesn'?t|do not|does not|still) match\w*|match(?:es)? (?:what|the)|see if|leav\w* comments|review comments|broken|foot(?:s|ing)? (?:and|to)|cross[- ]?foot\w*)\b/,
    EXTRACT: /\b(?:pull(?:ing)? (?:out|together)?|extract\w*|list(?:ing)? (?:all|every|out)|compil\w*|gather(?:ing)? (?:all|the) (?:\w+ )?(?:from|in)|copy(?:ing)? (?:over|out)|find(?:ing)? (?:all|every|where))\b/,
    DRAFT: /\b(?:draft\w*|writ(?:e|ing)|wrote|prepar\w* (?:the |a )?(?:narrative|memo|commentary|footnote|finding|report|section|summary|response|reply|email|letter|deck|script|disclosure)|put together|commentary|write[- ]?ups?|creat\w* (?:the |a )?(?:narrative|memo|deck|slides?|template|checklist|test steps)|come up with)\b/,
    REWRITE: /\b(?:rewrit\w*|re-?word\w*|rephras\w*|edit\w*|tighten\w*|shorten\w*|simplif\w*|clean(?:ing)? up (?:the )?(?:language|wording|text)|polish\w*|tone|plain english|update (?:the )?(?:language|wording|narrative|section|policy|commentary|disclosure)|roll(?:ing)? forward (?:\w+ ){0,3}(?:commentary|narrative|text|language|disclosures?|sections?)|keep(?:ing)? (?:[\w-]+ ){0,6}up to date)\b/,
    EXPLAIN: /\b(?:explain\w*|interpret\w*|what (?:a|the) (?:new )?(?:rule|standard|requirement)s? (?:means?|requires?)|understand(?:ing)? (?:the|what|how)|walk(?:ing)? (?:\w+ )?through|answer(?:ing)? (?:\w+ ){0,2}questions?|new (?:rules?|standards?|requirements?|guidance))\b/,
    MAP: /\b(?:map\w*|crosswalk\w*|align\w* (?:to|with)|link\w* (?:\w+ ){0,3}to|which (?:principle|requirement|datapoint|criteria)|esrs datapoints?|coso|nist|iso ?27001|tag(?:ging)? (?:to|with))\b/,
    CLASSIFY: /\b(?:classif\w*|categori[sz]\w*|sort(?:ing)?|group(?:ing)?|bucket\w*|triag\w*|rat(?:e|ing) (?:each|the|them)|scor(?:e|ing) (?:each|the|them))\b/,
    CALCULATE: /\b(?:calculat\w*|comput\w*|recalc\w*|math|add(?:ing)? up|sum(?:ming)?|totals?|emission factors?|convert(?:ing)? (?:units|kwh|litres|liters|gallons|currenc\w*)|fx|allocat\w*|accru\w*|depreciat\w*|forecast\w*|model(?:ing|ling)?\b|pivot)\b/,
    DECIDE: /\b(?:decid\w*|approv\w*|sign(?:ing)?[- ]?off|signs? off|judg\w*|materialit\w*|conclud\w*|determin\w*|assess(?:ing)? whether|evaluat\w* whether|whether (?:it|we|this) (?:is|are|should)|choos\w*|pick(?:ing)? (?:which|the)|call on|make the call|prioriti[sz]\w*|negotiat\w*)\b/,
    ACT: /\b(?:post(?:ing)? (?:the )?(?:[\w-]+ )?(?:entries|journals?|je)|migrat\w*|calendar invites?|book(?:ing)?|upload\w*|submit\w*|fil(?:e|ing) (?:with|on|to) (?:the )?(?:sec|edgar)|edgar|send(?:ing)?|email(?:ing)? (?:out|the|everyone|them)|schedul\w*|set(?:ting)? up (?:meetings?|calls?)|updat\w* (?:the )?(?:erp|sap|oracle|netsuite|system|portal|tracker|jira)|enter(?:ing)? (?:\w+ ){0,2}into|key(?:ing)? in|log(?:ging)? into|download\w*|export\w*|print\w*|distribut\w*|kick off|run(?:ning)? the (?:close|consolidation|report))\b/,
    COLLECT: /\b(?:chas\w*|follow(?:ing)?[- ]up(?! questions?)|track(?:ing)? down|workshops?|interview\w*|what (?:the )?(?:[\w-]+ )?(?:owners?|teams?|people|managers?) (?:say|tell)|nudg\w*|remind\w*|ping(?:ing)?|hound\w*|collect\w* (?:\w+ ){0,3}from|get(?:ting)? (?:\w+ ){0,4}(?:from|out of) (?:the )?(?:sites?|suppliers?|vendors?|owners?|teams?|people|managers?|business|plants?|facilit\w*)|request\w* (?:\w+ ){0,3}from|wait(?:ing)? (?:on|for) (?:people|them|the \w+ team|suppliers?|owners?|sites?)|survey(?:ing)? (?:the )?(?:suppliers?|sites?))\b/
  };
  const AI_OPS = ['READ', 'SUMMARIZE', 'COMPARE', 'CHECK', 'EXTRACT', 'DRAFT', 'REWRITE', 'EXPLAIN', 'MAP', 'CLASSIFY'];
  const BLOCKER_OF = { DECIDE: 'judgment', ACT: 'cross-system', COLLECT: 'collect-from-people', CALCULATE: 'exact-calc' };
  const REPEATS = /\b(?:every|each|all (?:\d+|the|our)|monthly|quarterly|annual(?:ly)?|weekly|daily|recurring|routine|always|again|each time|per (?:quarter|month|year|period)|every (?:quarter|month|year|close|cycle|period|time)|close|q[1-4]s?\b|quarter(?:s|ly)?|year[- ]end|10-?qs?|cycle|season|\d+ (?:entities|controls|suppliers|sites|sections|accounts|policies|risks)|10-?k|month[- ]end|earnings|board deck|management report|findings|workpapers|colleagues'? drafts|drafts from|responses|line by line|same email|filing|assurance|survey)\b/;
  const ONE_OFF = /\b(?:one[- ]?off|one[- ]time|once(?! a (?:year|quarter|month|week))|first time|this (?:one|single)|new project|implementation|migration|just this|ad hoc|this year only)\b/;
  const APPROVAL_ONLY = /\b(?:approv\w*|sign(?:ing)?[- ]?off|signs? off|final (?:call|decision)|materiality (?:call|decision|judg\w*))\b/;

  function normalize(t) {
    return (' ' + String(t || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ') + ' ')
      .replace(/\bu\b/g, 'you').replace(/\bw\/o\b/g, 'without').replace(/\b(?:prev|prv)\b/g, 'previous');
  }

  function rate(text) {
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
    const repeats = REPEATS.test(t) && !ONE_OFF.test(t);
    if (ONE_OFF.test(t)) blockers.push('one-off');
    let fit;
    if (!aiCore.length) fit = ai.length && !blockers.length ? 'partial' : 'not';
    else if (!blockers.length) fit = repeats ? 'good' : 'partial';
    else if (aiCore.every((o) => o === 'CHECK' || o === 'COMPARE') && blockers.some((b) => b !== 'judgment')) fit = 'not';
    else fit = aiCore.length >= 2 || !APPROVAL_ONLY.test(t) ? 'partial' : 'not';
    return { fit, repeats: repeats ? 1 : 0, ops, blockers, hits };
  }

  const api = { rate, normalize, OPS, AI_OPS };
  if (isNode) module.exports = api; else root.FitEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
