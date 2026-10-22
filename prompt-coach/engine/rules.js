/* SCOPE rule detectors. Pure functions, no dependencies; runs in Node and the browser.
   detect(prompt, {files}) -> { text, el: {S,C,O,P,E: {on, score, hits[]}}, stacked, vague[], words } */
(function (root) {
  const CONTRACTIONS = [
    [/\bdon'?t\b/g, 'do not'], [/\bdoesn'?t\b/g, 'does not'], [/\bdidn'?t\b/g, 'did not'],
    [/\bcan'?t\b/g, 'cannot'], [/\bwon'?t\b/g, 'will not'], [/\bisn'?t\b/g, 'is not'],
    [/\baren'?t\b/g, 'are not'], [/\bshouldn'?t\b/g, 'should not'], [/\bwouldn'?t\b/g, 'would not'],
    [/\byou'?re\b/g, 'you are'], [/\bwe'?re\b/g, 'we are'], [/\bi'?m\b/g, 'i am'],
    [/\bi'?ll\b/g, 'i will'], [/\bwe'?ll\b/g, 'we will'], [/\bit'?s\b/g, 'it is'],
    [/\bthat'?s\b/g, 'that is'], [/\bwhat'?s\b/g, 'what is'], [/\bi'?ve\b/g, 'i have'],
    [/\bwe'?ve\b/g, 'we have'], [/\blet'?s\b/g, 'let us'], [/\bdont\b/g, 'do not'], [/\bcant\b/g, 'cannot']
  ];
  // Common misspellings seen in quick typing.
  const TYPOS = {
    teh: 'the', adn: 'and', tabel: 'table', tbale: 'table', selcted: 'selected', seleted: 'selected',
    slected: 'selected', attahced: 'attached', atached: 'attached', attched: 'attached', summarise: 'summarize',
    summerize: 'summarize', summary: 'summary', anaylze: 'analyze', analyse: 'analyze',
    analize: 'analyze', varience: 'variance', variences: 'variances', comparre: 'compare', identfy: 'identify',
    indentify: 'identify', explian: 'explain', expalin: 'explain', speculte: 'speculate', speculat: 'speculate',
    spreadhseet: 'spreadsheet', spreasheet: 'spreadsheet', spredsheet: 'spreadsheet', docuemnt: 'document',
    documnet: 'document', reprot: 'report', rpeort: 'report', controsl: 'controls', contorls: 'controls',
    emmissions: 'emissions', statment: 'statement', statments: 'statements', sumarize: 'summarize', pls: 'please', plz: 'please', emisions: 'emissions', emissons: 'emissions', paragrpah: 'paragraph',
    pargraph: 'paragraph', bulelts: 'bullets', bulets: 'bullets', cloumns: 'columns', colums: 'columns',
    quater: 'quarter', qaurter: 'quarter', assurnace: 'assurance', disclosrue: 'disclosure', disclousre: 'disclosure',
    hypothsis: 'hypothesis', hypotheses: 'hypotheses', questoins: 'questions', quesitons: 'questions',
    draf: 'draft', rewirte: 'rewrite', reivew: 'review', reveiw: 'review', evidance: 'evidence', evidnce: 'evidence',
    executve: 'executive', exectuive: 'executive', commitee: 'committee', comittee: 'committee', audiance: 'audience',
    footnot: 'footnote', higlighted: 'highlighted', hilighted: 'highlighted', higlight: 'highlight', thier: 'their'
  };

  function normToken(w) {
    let t = w.toLowerCase().replace(/[\u2018\u2019\u02bc`]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, ' - ');
    t = t.replace(/\b[a-z]+\b/g, (x) => TYPOS[x] || x);
    for (const [re, rep] of CONTRACTIONS) t = t.replace(new RegExp(re.source, 'g'), rep);
    return t;
  }
  // Returns the normalized text plus, for every normalized character, the [start,end) of the
  // original token it came from, so detector hits can be highlighted in what the user typed.
  function normalizeWithMap(raw) {
    const src = String(raw || '');
    let text = ' ', map = [null];
    const re = /\S+/g; let m;
    while ((m = re.exec(src))) {
      const nt = normToken(m[0]);
      const span = [m.index, m.index + m[0].length];
      for (let i = 0; i < nt.length; i++) map.push(span);
      text += nt + ' '; map.push(null);
    }
    return { text, map };
  }
  function normalize(raw) { return normalizeWithMap(raw).text; }
  function toOriginal(map, start, end) {
    let a = null, b = null;
    for (let i = start; i < end && i < map.length; i++) if (map[i]) { if (a === null) a = map[i][0]; b = map[i][1]; }
    return a === null ? null : [a, b];
  }

  const NOUN_SRC = '(?:data(?:set)?|paras?|commentar(?:y|ies)|quotes?|entry|journal entr(?:y|ies)|recommendations?|descriptions?|release|table|tables|cells?|rows?|columns?|range|ranges|text|paragraphs?|sections?|files?|docs?|documents?|reports?|sheets?|spreadsheets?|workbook|worksheets?|deck|slides?|presentation|tabs?|query|queries|pdf|memo|policy|policies|matrix|rcm|narratives?|drafts?|disclosures?|figures|numbers|values|schedule|schedules|footnotes?|notes?|exhibits?|entries|lines?|items?|controls?|findings|evidence|results|output|chart|graph|list|content|language|wording|summary|filing|statement|statements|ledger|tb|trial balance|register|log|workpapers?|template|appendix|transcript|minutes|email|contract|agreement|invoice|samples?|population|inventory|factbook|questionnaire|survey|responses|letter|comment letter|10-k|10-q|8-k|md&a|esg report|sustainability report|annual report)';
  const SRC_LOCATOR = '(?:selected|highlighted|attached|uploaded|pasted|linked|open|opened|current|enclosed|following|above|below|provided|shared)';

  // Each rule: [regex, weight, tag]. Weights are summed; an element is "on" at >= 1.
  const RULES = {
    S: [
      [/\b(?:open|opened|attached|selected|highlighted|pasted|uploaded|showing)\s+(?:here|now|right now|in front of (?:you|me)|on (?:my |the |your )?screen|in (?:this|the) (?:chat|window|tab))\b|\b(?:up |open )?on (?:my |the |your )?screen\b|\byou can see (?:right )?now\b/, 1.2, 'open-here'],
      [/\b(?:that is|that's|which is|i have|i've got|i have got|we have|i've|i am|i'm|we're|we are)\s+(?:got\s+)?(?:open|editing|working (?:in|on|from)|looking at|reviewing|drafting)\b/, 1.1, 'ive-got-open'],
      [/\b[\w&'-]+\s+(?:i|we)\s+(?:have\s+|just\s+|'ve\s+)?(?:attached|selected|highlighted|pasted|uploaded|opened|shared|dropped in|sent over|sent|linked|added|included)\b/, 1.1, 'noun-i-attached'],
      [/\b(?:the|this|our|my)\s+(?:[\w&'()-]+\s+){0,4}(?:attached|enclosed|selected|open|above|below)\b(?![\s-]+(?:questions?|items?|issues?|findings?|points?|to\b))/, 1.0, 'noun-attached'],
      [/\b(?:column|col|row)\s+[a-z]{1,2}\b(?!\s*(?:is|are|and|or|to))/, 0.9, 'column-letter'],
      [/\bfrom what(?: is|'s)? (?:selected|highlighted|open|attached|on screen|pasted)\b|\bwhatever(?: is|'s)? in\b/, 1.1, 'from-whats'],
      [/(?:^|\s)@[\w(]/, 1.3, 'at-mention'],
      [/\b(?:the|this|my|our|these|those|that|your)\s+(?:\w+\s+)?(?:selected|highlighted|attached|uploaded|pasted|enclosed|linked|shared)\b|\b(?:selected|highlighted|attached|uploaded|enclosed)\s+(?!to\b|by\b|for\b|with\b)[\w$&'-]{2,}/, 1.2, 'locator-any'],
      [/\(\s*(?:attached|enclosed|see attached|selected|uploaded)\s*\)/, 1.2, 'paren-attached'],
      [/\b(?:the|on the|in the|from the|using the|off the|within the|across the|on|in|from|using)\s+['"]?[\w&'()\/.-]+(?:\s+[\w&'()\/.-]+){0,5}?['"]?\s+(?:tab|tabs|sheet|worksheet|workbook|query|dashboard)\b/, 1.2, 'named-tab'],
      [/'[^']{2,60}'\s+(?:tab|sheet|worksheet|column|section|slide|file|query|table|report|deck|document|workbook)\b|\b(?:tab|sheet|worksheet|column|section|slide|query|table|report|file|workbook)\s+'[^']{2,60}'/, 1.2, 'single-quoted-part'],
      [/\bopen\s+(?:\w+\s+){0,3}(?:release|statement|calendar|checklist|file|deck|doc|document|report|spreadsheet|workbook|draft|policy|memo|matrix|rcm|workpaper|10-k|10-q|filing)\b/, 1.1, 'open-doc'],
      [new RegExp('\\b' + SRC_LOCATOR + '\\s+(?:[\\w&$-]+\\s+){0,4}' + NOUN_SRC + '\\b'), 1.2, 'locator'],
      [new RegExp('\\b' + NOUN_SRC + '\\s+(?:i|we|you)\\s+(?:have\\s+|just\\s+|have just\\s+)?(?:selected|highlighted|attached|uploaded|pasted|shared|opened|linked|included|dropped|sent|added)\\b'), 1.2, 'i-selected'],
      [/\b(?:i|we) (?:have |just |have just )?(?:selected|highlighted|attached|uploaded|pasted|opened|dropped in|added|linked)\b/, 1.0, 'i-selected-verb'],
      [new RegExp('\\b(?:this|these|that|those)\\s+(?:[\\w&$-]+\\s+){0,3}' + NOUN_SRC + '\\b'), 1.0, 'demonstrative'],
      [/\b(?:what|everything) (?:i have|i've got|is|we have) (?:got )?(?:open|selected|highlighted|in front of me|on screen)\b/, 1.2, 'whats-open'],
      [/\bin front of (?:me|you)\b|\bon (?:my|the) screen\b/, 0.8, 'on-screen'],
      [/\b[\w()&-]+(?:[ _-][\w()&-]+){0,5}\.(?:xlsx|xlsm|xls|csv|docx|doc|pdf|pptx|ppt|txt)\b/, 1.3, 'filename'],
      [/\b(?:tab|sheet|worksheet|column|section|slide|page|note|exhibit|appendix|row|cell|item|schedule|table|part)\s+(?:called|named|labeled|labelled|titled)\b/, 1.2, 'named-part'],
      [/"[^"]{2,60}"\s+(?:tab|sheet|worksheet|column|section|slide|file|query|table|report|deck|document)\b/, 1.2, 'quoted-part'],
      [/\b(?:tab|sheet|worksheet|column|section|slide|query|table|report|file)\s+"[^"]{2,60}"/, 1.2, 'quoted-part2'],
      [/\b(?:note|footnote|slide|page|section|item|exhibit|appendix|schedule|row|rows|column|columns|cell|cells|tab|part)\s+(?:[a-z]?\d+[a-z]?(?:\.\d+)*|[ivx]+|[a-z]{1,3}\d+(?::[a-z]{1,3}\d+)?)\b/, 1.0, 'numbered-part'],
      // a definite reference to one open document ("the doc", "the policy"); "our controls" stays vague, and
      // "the 10-K" is usually a destination ("for the 10-Q MD&A"), so filings are left to the locator rules
      [/\b(?:the|this|that)\s+(?:q[1-4]\s+|fy\d{2}\s+|draft\s+|current\s+)?(?:doc|document|policy|memo|deck|workbook|spreadsheet)\b(?!\s+(?:template|process|owner|team))/, 1.0, 'the-document'],
      [/\b(?:knowledge base|knowledgebase|esrs\s*\/\s*issb intelligence|issb intelligence|esrs intelligence|support intelligence|framework kb|the kb)\b/, 1.2, 'kb'],
      [/\b(?:wdata|the query|saved query|connected data|the dataset)\b/, 0.7, 'wdata'],
      [/\b(?:using|use|based on|from|in|off|within|against|per)\s+(?:only\s+)?(?:the\s+)?(?:my|our)\s+(?:attached|selected|open|current|uploaded)\b/, 1.0, 'using-my-attached'],
      [/\b(?:pasted|attached|included|provided|shown|listed|copied) (?:above|below|here|in this (?:chat|message|thread))\b/, 1.1, 'pasted-here'],
      [/\b(?:the|this) (?:doc|document|report|file|spreadsheet|workbook|deck|sheet|draft|memo|policy|matrix|table) (?:i am|i'm|we are|we're) (?:in|working (?:in|on)|editing|viewing)\b/, 1.2, 'working-in'],
      [/\b(?:work|working|go|going) (?:off|from) (?:of )?(?:the|this|my)\b/, 0.6, 'work-off'],
      [/\b(?:here is|here are|here's|below is|below are|following is)\b/, 0.6, 'here-is']
    ],
    C: [
      [/\b(?:lands?|goes|going|ends up|will land|put|is|be) (?:it )?in front of (?:the |our |my )?(?:audit committee(?: chair)?|board|auditors?|external auditors?|assurance provider|lenders?|lender folks|investors|analysts|regulators|the sec|sec|cfo|ceo|controller|treasurer|cae|internal audit director|(?:new |our new )(?:[\w-]+ ){0,2}(?:analyst|accountant|controller|lead|hire|staff|manager|team member|director|associate)|team lead|leadership|management|legal|ir|investor relations|customers|clients|examiners?)\b|\b(?:the |our |my )?(?:audit committee(?: chair)?|board|auditors?|external auditors?|assurance provider|lenders?|lender folks|investors|analysts|regulators|the sec|sec|cfo|ceo|controller|treasurer|cae|internal audit director|(?:new |our new )(?:[\w-]+ ){0,2}(?:analyst|accountant|controller|lead|hire|staff|manager|team member|director|associate)|team lead|leadership|management|legal|ir|investor relations|customers|clients|examiners?)(?:'s)?\s+(?:\w+\s+){0,2}?(?:sees?|reads?|read|likes?|hates?|grilled|sent|is (?:a|jumpy|new|coming|on|green|out)|are (?:on|coming|new|green|sniffing|circling)|walk(?:s)? in|starts|came over|is shadowing|is still|doesn't|does not|will (?:read|see|ask|review)|keeps?|asked|pushed|flagged)\b/, 1.1, 'audience-situation'],
      [/\b(?:we|we're|we are|our team|the team|i'm|i am)\s+(?:are\s+|is\s+)?(?:restating|filing|doing|refreshing|onboarding|adopting|implementing|migrating|switching|covering|failed|missed|got|getting|under|in the middle of|green|new|small|stretched|short-staffed|behind)\b|\bfirst-?year (?:sox|filer|csrd|reporting)\b|\bafter the ipo\b|\bcan(?:'t|not) afford\b|\bthe team is (?:green|new|small|stretched)\b|\bis new to us\b/, 1.0, 'situation2'],
      [/\bfor (?:someone|somebody|a person|people|anyone|a reader|readers) who\b|\bso (?:a |an |the )?non-?[\w-]+ (?:gets|can follow|understands|follows)\b|\bfor (?:a |an )?non-?(?:accountant|expert|specialist|finance|technical|audit)\w*\b|\bwho (?:has|have) never\b|\bdoesn't speak (?:audit|accounting|finance)\b/, 1.1, 'reader-who'],
      [/\b(?:for|to|give|with|brief|briefing|email|emailing|memo|update|message|tell|show|send|present|presenting|walk|explain (?:\w+ )?to)\s+(?:the |our |my |a |an |this |its )?(?:audit committee(?: chair| members?)?|board(?: of directors)?|(?:external |internal |new |outside )?auditors?|external audit|legal(?: team)?|(?:retail |institutional )?investors|lenders?|bank|(?:our )?sales team|execs|executives|leadership|controller|treasurer|(?:my |our )?manager|cae|cfo|ceo|cro|cco|ciso|cio|vp of \w+|vp|control owners?|process owners?|steering committee|disclosure committee|ir(?: team)?|investor relations|xbrl team|filing agent|new hires?|new (?:staff|close staff|staff accountants?|analysts?|team members?|preparers?)|first-?time (?:\w+ )?preparers|outside counsel|counsel|regulators?|sec staff|the sec|customers|clients?|employees|staff|finance team|hr|it team|it|fp&a|tax team|partners?|reviewers?|examiners?|rating agencies|shareholders)\b/, 1.1, 'audience2'],
      [/\b(?:the |our |my )?(?:audit committee(?: chair| members?)?|board(?: of directors)?|(?:external |internal |new |outside )?auditors?|external audit|legal(?: team)?|(?:retail |institutional )?investors|lenders?|bank|(?:our )?sales team|execs|executives|leadership|controller|treasurer|(?:my |our )?manager|cae|cfo|ceo|cro|cco|ciso|cio|vp of \w+|vp|control owners?|process owners?|steering committee|disclosure committee|ir(?: team)?|investor relations|xbrl team|filing agent|new hires?|new (?:staff|close staff|staff accountants?|analysts?|team members?|preparers?)|first-?time (?:\w+ )?preparers|outside counsel|counsel|regulators?|sec staff|the sec|customers|clients?|employees|staff|finance team|hr|it team|it|fp&a|tax team|partners?|reviewers?|examiners?|rating agencies|shareholders)\s+(?:will|wants?|needs?|asked|ask|keeps? asking|keep|are going to|is going to|is reading|are reading|reads?|reviews?|reviewing|requested|requests?|expects?|flagged|signs?|sign-off|sign off|is picky|are picky|have asked|has asked|meeting|call|pre-?read|deck|pack|book|review|prep)\b/, 1.0, 'audience-acts'],
      [/\bi am (?:prepping|preparing|briefing|drafting|closing|assigning|writing|working|presenting|getting ready|heading|meeting|reviewing|responding|onboarding|building|putting together|trying|new|the|a|an|our|on|in charge|responsible|leading|running|covering|filling in)\b/, 1.0, 'i-am'],
      [/\b(?:we|our team|our company|the company|i|our (?:\w+ ){0,2}(?:admin|auditor|auditors|team|cfo|controller|lead|manager|vp))\s+(?:file|filed|are filing|will file|changed|moved|had|have had|are heading|are going|are a|are an|just|recently|switched|acquired|merged|lost|hired|failed|flagged|resigned|keep|are new|are small|are a smaller|are still|are behind|are short|are stretched|are being|were|have been|got)\b/, 0.9, 'background2'],
      [/\b(?:before|ahead of|for) (?:the |our |tomorrow's |next week's |this week's |friday's |monday's |thursday's |the upcoming )?(?:[\w&-]+ ){0,3}(?:goes out|is due|meeting|call|deadline|review|pre-?read|filing|close|committee|walkthrough|audit|visit|presentation|session)\b/, 0.8, 'event'],
      [/\bso (?:that )?(?:a |an |the |our |my )?(?:new|non-technical|non-?accountant|junior|first-time|non-finance|lay|business|general)?\s*(?:\w+ ){0,2}(?:can|could|will|would) (?:follow|understand|get it|use|read|act|decide|sign|reperform|rebuild|assign)\b|\bso (?:\w+ ){1,3}get it\b|\b(?:to|for) (?:a|an|our|the|my) (?:new|first-time|non-technical|junior|non-finance) \w+/, 1.0, 'so-reader-can'],
      [/\b(?:customers|clients|regulators|auditors|investors|the board|management|leadership) (?:keep|keeps|have been|are) (?:asking|requesting|pushing|concerned)\b/, 1.0, 'stakeholder-asking'],
      [/\bas (?:the |an? |our )?(?:head of \w+|vp of \w+|cro|cae|cfo|cco|ciso|cio|chair|admin|tester|lead|coach|preparer|owner|reviewer|controller|treasurer|team|member)\b/, 1.1, 'as-title'],
      [/\b(?:you are (?:an?|the|my|our|now|acting|playing|working as|serving as)\b|act as|acting as|pretend (?:to be|you are)|imagine you are|take the role of|play the role of|role:|as my|from the perspective of|wear(?:ing)? (?:your|the|an?) [\w ]{2,30} hat|put on (?:your|an?) [\w ]{2,30} hat|think like)\b/, 1.2, 'role'],
      [/\bas (?:an?|the|our) (?:experienced |senior |seasoned |skeptical |external |internal |independent )?(?:[\w&-]+ ){0,3}(?:analyst|auditor|reviewer|controller|accountant|expert|specialist|consultant|officer|manager|cfo|cco|ciso|partner|preparer|writer|editor|lead|director|advisor|adviser|counsel|lawyer|examiner|regulator|investor|economist|engineer|assessor|verifier)\b/, 1.2, 'as-role'],
      [/\bfor (?:the |our |a |an |my )?(?:audit committee|board|board of directors|executives?|executive team|exec team|leadership|leadership team|senior leadership|c-suite|cfo|ceo|coo|cio|ciso|controller|investors?|analysts?|auditors?|external auditors?|internal audit|regulators?|the sec|sec staff|management|assurance (?:provider|team)|non-?(?:experts?|specialists?|finance (?:people|readers|audience))|new (?:hires?|analysts?|team members?|staff)|stakeholders|steering committee|disclosure committee|process owners?|control owners?|business owners?|employees|staff|customers|suppliers|lenders|rating agencies|shareholders|readers)\b/, 1.1, 'audience'],
      [/\b(?:goes|going|go|headed|heading|will go|being sent|be sent|sent) to (?:the |our )?(?:audit committee|board|cfo|ceo|leadership|executives|auditors|regulators|investors|sec|committee|management)\b/, 1.1, 'goes-to'],
      [/\b(?:presenting|present|presented|sharing|share|send|sending|submit|submitting) (?:it |this )?to (?:the |our )?(?:audit committee|board|cfo|ceo|leadership|executives|auditors|regulators|investors|committee|management|team)\b/, 1.0, 'presenting-to'],
      [/\b(?:audience|readers?|reader base) (?:is|are|will be)\b|\bwritten for\b|\baimed at\b|\btargeted at\b|\bintended for\b|\bthis (?:table|list|output|extract|summary|result) feeds\b|\bthis is for \[/, 1.1, 'audience-is'],
      [/\bfor (?:the |our |a |an |my )?(?!selected|attached|highlighted|open|current)(?:[\w&/-]+ ){0,3}(?:report|filing|10-k|10-q|8-k|20-f|md&a|mda|footnotes?|disclosures?|memo|email|newsletter|earnings (?:release|call|script)|press release|proxy|csrd|esrs|cdp|tcfd|issb|sustainability report|annual report|integrated report|board (?:pack|book|deck|meeting|update)|audit committee (?:deck|meeting|pre-?read|update)|submission|comment letter response|management letter|pre-?read|investor day|lender call|rating agency|deck|presentation|meeting|walkthrough|steering committee|committee)\b/, 1.0, 'destination'],
      [/\b(?:we are|i am|our team is|the team is|we have|we will be|i will be) (?:preparing|getting ready|going through|working (?:on|through)|in the middle of|new to|about to|facing|undergoing|starting|kicking off|a first-?year|first-?time|under)\b/, 1.0, 'background'],
      [/\b(?:ahead of|in preparation for|to prepare for|in advance of|before (?:the|our) (?:audit|assurance|filing|board|meeting|review|deadline|call))\b/, 0.9, 'ahead-of'],
      [/\b(?:so that|so i can|so we can|so they can|so the|in order to|the goal is|our goal is|my goal is|the purpose is|purpose:|goal:|this will be used|we need this for|i need this for|which will be used|to help (?:the|our|me|us) (?:\w+ ){0,3}(?:decide|understand|prepare|explain|brief|present))\b/, 0.9, 'purpose'],
      [/\b(?:first-?year|first-?time|newly public|recently ipo'd|ipo|pre-ipo|new to (?:csrd|sox|esrs|sec))\b/, 0.6, 'situation'],
      // the writer's current task: "I'm preparing ...", "you are briefing ..."
      [/\b(?:you're|you are|i'm|i am) (?:preparing|coaching|helping|briefing|drafting|writing|building|putting together|interviewing|onboarding)\b/, 0.9, 'you-are-doing'],
      // "as the/a <x> reviewer|lead|manager|controller ..." job title
      [/\bas (?:the |a |an |our |my )?(?:[\w-]+ ){0,2}(?:reviewer|lead|manager|analyst|preparer|owner|controller|auditor|consultant|partner)\b/, 0.9, 'as-job-title'],
      // a plural reader group after "for" ("for the control owners"), or "<reader> can follow/use"
      [/\bfor (?:the |our |my |all )?(?:[\w&\/-]+ ){0,2}(?:managers|owners|leads|leadership|staff|committee|analysts|accountants|reviewers|heads|executives|team members)\b|\b(?:team|member|managers?|staff|reader|analyst) can (?:follow|use|read|understand)\b/, 0.9, 'for-reader-group'],
      // "this feeds/goes into ...", "for our next <x> review|deck|close|filing"
      [/\b(?:this|it) (?:feeds|goes into|is going into|will go into|is for)\b|\bit's (?:going into|for)\b|\bfeeds (?:our|the|into)\b|\bfor (?:my|our) (?:first |next |new |upcoming )?(?:[\w&\/+-]+ ){0,3}(?:note|audit|review|deck|framework|assessment|refresh|walkthrough|tracker|close|filing)\b/, 0.9, 'feeds-into'],
      // "next week/quarter", "our <x> committee/team asked/wants/needs"
      [/\b(?:next|this coming|later this) (?:week|month|quarter|spring|summer|fall|autumn|winter|year)\b|\b(?:our|the) [\w-]+ (?:committee|team|lead|leads|leadership) (?:asked|wants|needs)\b/, 0.9, 'timing-or-ask'],
      // "for my director", "for the procurement team", "for our <city> office", "for a <kind> audience": a named reader after "for"
      [/\bfor (?:the |our |my |a |an )(?:[\w&-]+ ){0,2}(?:director|sponsor|vp|svp|cso|cfo|cao|cco|ac|team|office|colleagues|audience|auditor|analyst|investors|boss|chair|stakeholders)\b/, 0.9, 'for-named-reader'],
      // telegraphic audience: "investor audience", "board-ready", "investor-facing", or a bare audience word as its own fragment ("Board.", ",,, board")
      [/\b[\w-]+ audience\b|\b(?:board|executive|exec|investor|auditor|assurance|committee|regulator|management|leadership|client|customer)-(?:ready|facing|level|friendly|grade)\b|(?:^|[.,;:!]) *(?:the )?(?:board|executives?|execs|investors?|auditors?|leadership|management|cfo|ceo|regulators?)\s*(?=[.,;:!]|\s*$)/, 0.9, 'audience-shorthand'],
      // a stakeholder as subject with a state or want: "our VP hates ...", "my director wants ...", "the CFO is nervous", "<x> team uses this"
      [/\b(?:our|my|the) (?:[\w&-]+ ){0,3}(?:vp|svp|director|head of (?:[\w&-]+ ){1,3}|lead|team|cfo|ceo|cso|cro|manager|boss|committee|auditors?|sponsor|board|regulators?|investors?|chair)\s*(?:is|are|wants|want|needs|need|hates|likes|prefers|asked|asks|uses|use|will|meets|meet|starts?|keeps?|expects|cares|reads|hasn't|has not|does not)\b|\b[\w-]+ team (?:uses|use|relies on|will use|reads)\b/, 0.9, 'stakeholder-state'],
      // outside scrutiny as background: "regulators are watching", "assurance people will dig into this"
      [/\b(?:[\w-]+ )?(?:regulators?|auditors?|investors?|analysts?|reviewers?|examiners?|people|the sec)\s+(?:are|is|will|keep|have been)\s+(?:\w+ )?(?:watching|dig|digging|scrutiniz\w*|look(?:ing)? closely|focus\w*|pick(?:ing)? apart)\b/, 0.9, 'stakeholder-scrutiny'],
      // where the output lands: "this goes in our ...", "this goes to the sponsor", "it's feeding the ... table"
      [/\b(?:this|it|that|these|the output|the result)\s+(?:is |will |will be )?(?:goes|go|going|feeding|feeds|ends up|used)\s+(?:in|into|to|the|our)\b/, 0.9, 'goes-where'],
      // a destination workstream after "for": "for our SOX testing", "for the AC dashboard", "for our ... KPI", "for Thursday's standup", "for the ... memo"
      [/\bfor (?:the |our |my )(?:(?!in |on |of |to )[\w&\/+'-]+ ){0,4}(?:dashboard|kpi|kpis|testing|standup|stand-up|retro|commentary|statement|submission|memo|readiness|program|programme|walkthrough)\b|\bfor (?:the |our |a )?(?:10-?q|10-?k|8-?k|20-?f|mdna|md&a)\b/, 0.9, 'for-workstream'],
      // a destination section: "for the climate section of our CSRD report"
      [/\bfor (?:the |our |a )?(?:[\w&-]+ ){0,2}section of (?:the |our |this )?(?:[\w&-]+ ){0,3}(?:report|statement|filing|10-k|10-q|response|submission|disclosure)\b/, 0.9, 'section-of-deliverable'],
      // an event on a named day: "auditors start Monday", "committee meets Thursday", "deadline is Friday", "Friday's retro", "here mon", "tomorrow"
      [/\b(?:starts?|begins?|meets?|is|are|here|arrives?|lands?|due|kicks? off)\s+(?:[\w-]+ )?(?:on |this |next )?(?:monday|tuesday|wednesday|thursday|friday|mon|tue|tues|wed|thu|thurs|fri)\b|\b(?:monday|tuesday|wednesday|thursday|friday|tomorrow)'s [\w-]+|\b(?:tomorrow|tmrw)\b/, 0.9, 'event-day'],
      // an upcoming review as background: "assurance coming up", "regulator visit coming"
      [/\b(?:audit|assurance|visit|inspection|fieldwork|review|exam|examination|walkthrough|filing|deadline)\s+(?:is )?coming(?: up)?\b/, 0.9, 'review-coming'],
      // reader or asker expertise: "I'm not an auditor", "new to sheets", "with no ESG background", "hasn't done CSRD before", "that's never received one"
      [/\bi am not (?:an?|the) (?:[\w-]+ )?(?:auditor|accountant|expert|specialist|lawyer|engineer|person|analyst)\b|\bnew to [\w-]+\b|\b(?:with|has|have|having) (?:no|little|zero|limited) [\w&-]+ (?:background|experience|knowledge)\b|\b(?:has|have|is|are|hasn't|haven't)\s+(?:not |never )?(?:never )?(?:done|used|seen|received|worked|filed|been through|dealt with)\b(?= (?:\w+ ){0,3}before\b| one\b)|\b(?:is|are|has|have) never (?:done|used|seen|received|worked|filed|been through|dealt with)\b/, 0.9, 'reader-expertise'],
      // role variants: "act like ...", "be a <x> expert", "as a <x>er would", "as a facilitator"
      [/\b(?:act|behave) like\b|\bbe (?:an?|the|my) (?:[\w-]+ ){0,2}(?:expert|specialist|auditor|reviewer|consultant|advisor|analyst|lawyer|accountant|coach)\b|\bas (?:an?|the) (?:[\w-]+ ){0,2}\w+(?:er|or|ist|ant|ent)\s+would\b|\bas (?:an?|the) (?:facilitator|moderator|trainer|mentor|scorer|rater|grader|interviewer|presenter|host)\b/, 0.9, 'role-variant'],
      // who would ask: "questions the audit committee might ask", "an external auditor might raise", "should management ask", "disclosure committee questions"
      [/\b(?:committee|auditors?|management|board|regulators?|reviewers?|investors?|analysts?|examiners?|cfo|ceo|scorer|lenders?)\s+(?:might|would|will|could|should|may|is likely to|are likely to)\s+(?:ask|raise|challenge|question|push back|probe|flag|focus on|dig into)\b|\b(?:should|would|might|could) (?:the |our )?(?:management|board|committee|auditors?|investors?|regulators?|reviewers?) (?:ask|raise|challenge|probe)\b|\b(?:committee|auditor|regulator|board|investor|analyst|examiner) questions\b/, 0.9, 'asker-would-ask'],
      // a message to named outside recipients: "email to the vendors", "to our top 5 suppliers", "asking suppliers for ..."
      [/\b(?:email|e-mail|message|letter|announcement|invite|reminder)s? (?:to|for) (?:the |our |all |each )?(?:[\w-]+ ){0,2}(?:vendors|suppliers|customers|clients|employees|stakeholders|partners|attendees)\b|\bto (?:our|the|my|all) (?:top \d+ |key |main )?(?:[\w-]+ ){0,2}(?:suppliers|vendors|customers|clients|employees|colleagues)\b|\b(?:asking|remind|reminding|thanking|inviting) (?:the |our |my |all )?(?:[\w-]+ ){0,2}(?:suppliers|vendors|customers|clients|staff|employees|colleagues)\b/, 0.9, 'message-recipients'],
      // organization profile or change underway: "a 300-person company", "we sell ...", "we're moving from X to Y", "for the first time"
      [/\b(?:an?|our) \d[\d,]*[- ](?:person|employee|people|staff|site|entity)\b|\bwe (?:sell|make|manufacture|operate|serve|distribute)\b|\bwe are (?:moving|transitioning|switching|mapping|migrating|rolling out|expanding|consolidating|launching|sending)\b|\bfor the first time\b/, 0.9, 'org-situation'],
      [/\b(?:context|background|situation|audience|reader|readers|role|persona|for|purpose|goal|who)\s*[:=]\s*\S|\bfor context\b|\bsome context\b/, 1.1, 'context-label']
    ],
    E: [
      [/\b(?:do not|never|please do not|without|avoid|no)\s+(?:any\s+)?(?:speculat\w*|guess\w*|invent\w*|mak(?:e|ing) (?:anything|things|stuff|it|numbers|facts)? ?up|fabricat\w*|embellish\w*|extrapolat\w*|hallucinat\w*|assum\w*|add(?:ing)? (?:any )?(?:new )?(?:facts|information|numbers|figures|data|claims|content)|introduc\w* (?:any )?(?:new )?(?:facts|information|numbers|figures|claims)|chang\w* (?:any |the )?(?:numbers|figures|values|amounts|dates|data))\b/, 1.3, 'no-invent'],
      [/\b(?:preserve|keep|retain|leave|maintain)\s+(?:every|all|all of the|each|the|any)?\s*(?:numbers?|figures?|values?|amounts?|dates?|facts?|metrics?|targets?|percentages?|data points?)(?:\s+\w+){0,3}?\s*(?:exactly|as is|as-is|unchanged|intact|the same|as they are|verbatim)?/, 1.1, 'preserve'],
      [/\bnothing (?:that is not|that isn't|not|beyond what is|outside(?: of)?) (?:in|from|supported by)\b|\bonly (?:say|state|include|report) what (?:is|the)\b|\bstick (?:strictly )?to (?:what is in|the facts|what the)\b/, 1.0, 'nothing-beyond'],
      [/\b(?:cite|citing|citation|citations|footnote each|with sources|source each|sources for each|reference (?:the |each )?(?:cell|page|row|section|paragraph|line|note|slide|source|location|tab|column)|show (?:me )?where|point (?:me )?to (?:the |where)|link (?:back )?to (?:the )?(?:source|cell|row)|(?:page|cell|row|slide|section|line) references?|tell me where (?:each|it|you found|that)|where (?:each|it) (?:comes|came) from|which (?:cell|page|row|section|tab|line) (?:it|each|they) (?:came|comes|come) from)\b/, 1.2, 'cite'],
      [/\b(?:hypothes[ie]s|hypothesi[sz]e|possible (?:explanations?|causes?|drivers?) to (?:test|confirm|check|verify)|label (?:them |each |it )?as (?:assumptions?|inferences?|hypothes[ie]s)|mark (?:anything|what|any|where) (?:you )?(?:inferred|assumed|guessed|estimated)|clearly (?:label|mark|flag) (?:any |all )?(?:assumptions?|inferences?|estimates?))\b/, 1.1, 'hypothesis'],
      [/\b(?:open questions|follow-?up questions for|questions for (?:the )?(?:data owner|preparer|control owner|process owner|owner)|list (?:any |your |the )?(?:assumptions|gaps|unknowns|open items)|what (?:else )?(?:you would|you'd|i would|i'd|we would|we'd) need to (?:confirm|verify|know|check))\b/, 1.0, 'open-questions'],
      [/\b(?:flag|mark|highlight|call out|note|tell me|let me know|say so|say that)\b[^.;\n]{0,50}\b(?:unsure|uncertain|not sure|unclear|ambiguous|missing|not supported|unsupported|cannot (?:find|confirm|verify|tell)|could not (?:find|confirm|verify)|low confidence|confidence|guess(?:ed|ing)?|estimat(?:e|ed)|inferr?(?:ed)?|assum(?:e|ed|ption))/, 1.1, 'flag-uncertain'],
      [/\bif (?:you are|you're|you aren't|you are not) (?:not )?(?:sure|certain|confident|unsure|uncertain)\b|\bif (?:the |it |this |that )?(?:data|numbers|source|document|file|table|evidence|it) (?:does not|doesn't|cannot|can't|do not|don't|isn't|is not) (?:support|back|show|say|cover|contain|answer)|\bif (?:something|anything|it|a value|a number) is (?:missing|unclear|not there|not in)|\bif you cannot (?:find|tell|confirm|verify)\b/, 1.2, 'if-unsure'],
      [/\b(?:do not|don't|without|not to) (?:decide|determine|pick|choose|judge|conclude) which\b|\bdo not (?:resolve|fix|correct) (?:them|it|the conflicts?|the differences?)\b|\bdo not (?:form|give|reach) (?:an? )?(?:opinion|conclusion)\b/, 1.1, 'no-decide'],
      [/\b(?:separate|separately|distinguish(?: between)?|keep (?:the )?(?:facts|observations) (?:separate|apart)|split) (?:the )?(?:observed|observations?|facts?|data|what (?:the|is)|confirmed|evidence-?based)\b|\bfacts? (?:vs\.?|versus|from) (?:interpretation|opinion|explanation|speculation|assumptions?|inference)\b/, 1.0, 'separate-facts'],
      [/\b(?:i|we) (?:will|'ll|am going to|are going to|plan to|need to) (?:verify|check|review|validate|confirm|make the (?:final )?call|sign off|decide)\b|\bfor (?:my|our|human|manual) review\b|\bbefore (?:i|we) (?:sign|file|submit|send|use it)\b|\b(?:the )?auditor (?:makes|will make) the (?:final )?(?:call|conclusion|judgment)\b/, 0.9, 'human-verifies'],
      [/\b(?:only (?:use|rely on|draw on|draw from|base it on) (?:information|facts|data|what|figures) (?:that is |that's )?(?:in|from|on))\b/, 0.4, 'only-use-info'],
      [/\b(?:verbatim|word-for-word|exact (?:quote|quotes|wording))\b/, 0.7, 'verbatim'],
      [/\b(?:double-?check|cross-?check|sanity-?check|validate|reconcile) (?:your|the|each|all)? ?(?:answer|output|results?|work|totals?|figures|numbers) (?:against|to|with)\b/, 0.9, 'self-check'],
      [/\bconfidence (?:level|score|rating)\b|\bhow confident\b|\brate your confidence\b/, 1.0, 'confidence'],
      [/\b(?:gap|blank|question mark) than a guess\b|\b(?:introduc\w*|add\w*|includ\w*|us\w*) (?:any |a )?(?:new )?(?:numbers?|figures?|dates?|claims?|facts?|amounts?) (?:that is not|that are not|not) (?:already )?(?:there|in|on)\b|\bsay (?:if|whether|when)\b|\b(?:do not|never) (?:dress up|sugar-?coat|oversell|pad|chase|spin|round)\b|\bkeep (?:the|every|all|each) (?:\w+ )?(?:exact|visible|accurate|unchanged|as is)\b|\bso i know you (?:did not|didn't|are not|aren't|have not)\b|\bnothing that is not (?:on|in|from) (?:that|the|this)\b/, 1.1, 'misc-eval2'],
      [/\b(?:do not|never|without|no need to|please do not)\s+(?:try to |attempt to )?(?:add anything|add any|adjust|classify|re-?rate|re-?score|concede|paraphrase|overstate|understate|promise|stretch|force|estimate|reconcile|soften|exaggerate|editoriali[sz]e|interpret|infer|conclude|make the (?:call|decision|determination)|make (?:it|them|anything) sound|ask about anything|include anything|fill (?:it|them|gaps|blanks)|guess|round|merge|drop|delete|omit|reorder|resolve)\b/, 1.1, 'do-not-judge'],
      [/\b(?:call (?:that|it|them|those) out|warn me|tell me if|let me know if|tell me what (?:information|info|data|else)|tell me why you|explain any assumptions?)\b/, 1.0, 'call-out'],
      [/\bleave (?:that|it|those|the \w+(?: \w+)?|final \w+) (?:to|for) (?:me|us|the auditor|the team|the reviewer)\b|\bfinal (?:call|determination|decision|say|judg(?:e)?ment)\b|\bdouble[- ]?check\b|\bi will (?:double|make|decide|confirm|check|review|validate|verify|sign)\b|\bnot asking you to (?:decide|make|determine|conclude)\b/, 1.0, 'leave-to-me'],
      [/\bword[- ]for[- ]word\b|\b(?:keep|leave|preserve|retain|maintain)\b[^.;\n]{0,40}?\b(?:unchanged|intact|word for word|verbatim|exactly as (?:written|is|stated|they appear)|as written|identical)\b|\bno additions\b|\bexactly as written\b/, 1.1, 'keep-unchanged'],
      [/\b(?:with|give|show|note|include|add|cite|list)\b[^.;\n]{0,30}?\b(?:page numbers?|row numbers?|line numbers?|paragraph numbers?|cell refs?|cell references?|control ids? you|ids you based|source (?:row|line|page|cell))\b|\byou based (?:each|it|your|the)\b|\bfor every (?:finding|row|item|number|figure|value|claim|statement|change)\b[^.;\n]{0,20}?\b(?:source|row|page|cell|reference|line)/, 1.1, 'refs'],
      [/\b(?:rather than|instead of)\s+(?:\w+\s+)?(?:\w+ing)\b|\[[A-Z][A-Z \/]{1,20}(?:TBD|\?|NEEDED|MISSING|TO CONFIRM)\]/, 1.0, 'rather-than2'],
      [/\b(?:note|mark|flag|say|tell me|list|show|identify|highlight|call out)\s+(?:any|which|where|the|each|those|every|all)?\s*(?:\w+\s+){0,6}?(?:where|that|which|when|if|whose|because|you)\s+(?:\w+\s+){0,5}?(?:does not|doesn't|isn't|is not|not enough|too vague|incomplete|silent|missing|needs? more|unclear|contradicts?|contradictory|can't|cannot|do not|don't|uncertain|ambiguous|insufficient|lacks?|conflict)\b/, 1.0, 'note-gaps'],
      [/\bbase (?:every|each|all|your) (?:\w+ )?on\b|\bonly (?:quote|include|use|cite|list)\s+(?:\w+\s+){0,3}(?:from|that|the \w+ actually|what)\b|\bactually (?:requires|says|states|supports|shows)\b/, 1.0, 'base-on'],
      [/\b(?:overstate|exaggerate|embellish|spin)\b|\bbetter or worse than\b/, 0.9, 'no-spin'],
      [/\b(?:list|bullet|note|show|mark|flag) (?:any |the |all )?(?:changes|edits|ones|items|lines|steps|words) (?:you|that you) (?:made|had to|changed|reworded|removed|added|assumed)\b|\b(?:you are|you're) assuming\b|\byou assumed\b|\bany assumptions\b/, 1.0, 'show-changes'],
      [/\bsay ['"][^'"]{2,30}['"]|\bmark (?:it|them) (?:as )?['"][^'"]{2,30}['"]|\bwrite ['"]n\/?a['"]/, 1.0, 'say-literal'],
      [/\b(?:keep|preserve|retain|copy|quote|reproduce|use|leave)\s+(?:every|all|each|the|any)?\s*(?:[\w$-]+\s+){0,2}(?:numbers?|figures?|values?|amounts?|text|wording|language|dates?)\s+(?:\w+\s+){0,2}(?:exactly|unchanged|verbatim|intact|as (?:written|is|they are|stated))\b/, 1.1, 'preserve2'],
      [/\b(?:quote|quoting)\s+(?:the |them|it|each|every|exact|exactly|directly|where|relevant|the rule|the letter|the source|the text)/, 1.0, 'quote'],
      [/\bif\b[^.;\n]{0,60}?\b(?:cannot|can't|does not|doesn't|do not|isn't|is not|are not|aren't|has no|have no|lacks?|missing|not (?:there|available|disclosed|clear|present|in|found|shown|listed|stated)|ambiguous|unclear|no (?:good )?match|nothing)\b[^.;\n]{0,60}?\b(?:say so|say that|say ['"]|say it|tell me|leave (?:it |them |that )?blank|mark (?:it|them|that)|flag (?:it|them|that)|note (?:it|that|this)|write ['"]|return ['"]|put ['"]|list (?:it|them)|skip it)/, 1.2, 'if-then-say'],
      [/\b(?:say|tell me|note|mark|flag|list|state|indicate)\s+(?:which|whether|if|any|anything|where)\b[^.;\n]{0,50}?\b(?:unsure|not sure|uncertain|not certain|could not|couldn't|can't|cannot|weren't sure|were not sure|unclear|guessed|missing|not (?:find|found|match|supported|answer)|unmatched|would break|might need|low confidence)/, 1.1, 'say-which-unsure'],
      [/\b(?:flag|mark|list|note|call out)\s+(?:any |the |all )?(?:rows?|items?|cells?|entries|ones|those|anything|any)\b[^.;\n]{0,40}?\b(?:would break|could not|couldn't|can't|cannot|not sure|unsure|uncertain|weren't|were not)/, 1.0, 'flag-rows'],
      [/\b(?:which|the|each|a|every)\s+(?:cells?|pages?|slides?|rows?|lines?|sentences?|sections?|tabs?|paragraphs?|sources?|source pages?|locations?|page numbers?|slide numbers?|cell references?)\b(?:\s+numbers?)?[^.;\n]{0,40}?\b(?:for each|each|used|it is in|is in|they are in|appear|appears|came from|comes from|prompted|supports?|you (?:used|relied on|pulled))/, 1.1, 'which-location'],
      [/\b(?:show|give|note|include|tell me|list|cite|with|add)\b[^.;\n]{0,25}?\b(?:cells?|pages?|slides?|rows?|line numbers?|sentences?|sources?|source pages?|locations?|references?|page refs?)\b[^.;\n]{0,25}?\b(?:for each|each|used|it is in|is in|appears|came from|you used|per (?:row|item|line))/, 1.1, 'show-location'],
      [/\bnote where (?:each|it|they)\b|\bwhere (?:each|it) (?:appears|is|was found)\b/, 1.0, 'note-where'],
      [/\bso (?:that )?(?:i|we|the reviewer|reviewers|they) can (?:verify|check|confirm|validate|review|test|trace|audit|follow)\b|\bhow to (?:test|check|verify|validate) it\b|\bwalk me through how to (?:test|check|verify)\b/, 1.0, 'so-i-can-verify'],
      [/\b(?:do not|never|without)\s+(?:fix|fill|correct|edit|touch|alter|resolve|mark|comment on|judge|rate|add or remove|remove or add|reword|rewrite|change)\s+(?:anything|any|it|them|the meaning|its meaning|something|whether|cells?|values?|numbers?|facts?|steps?|topics?|items?|in)\b/, 1.0, 'do-not-touch'],
      [/\bwithout (?:changing|altering) (?:its|the|their|any) (?:meaning|substance|facts?|numbers?|figures?)\b|\bnothing (?:new|beyond|added|invented)\b|\b(?:every|all|each) (?:number|figure|value|amount)s? (?:unchanged|intact|exact)\b|\bunless (?:the|it|they|the table|the data|the source|the doc)\b[^.;\n]{0,30}\b(?:actually|clearly|explicitly)?\s*(?:shows?|says?|supports?|states?|contains?)\b/, 1.0, 'nothing-new'],
      [/\b(?:do not|don't|never) add (?:\w+ ){0,2}(?:that|which) (?:are not|aren't|is not|isn't|the \w+ (?:does not|doesn't))\b|\bthat (?:the|it|this) (?:\w+ )?(?:does not|doesn't) support\b/, 1.0, 'no-add-unsupported'],
      [/\bseparat(?:e|ely|ing)\b[^.;\n]{0,40}?\b(?:grounded|based|supported|backed|sourced) (?:in|on|by)\b|\bopen[- ]questions?\b|\bopen items section\b/, 1.0, 'separate-grounded'],
      [/\b(?:that|which) (?:you|you are|you're) (?:not )?(?:unsure|not sure|not certain|uncertain)\b|\bnot certain (?:applies|apply|about)\b|\bunsure about\b/, 1.0, 'unsure-about'],
      [/\b(?:rather than|instead of) (?:guessing|rewording|assuming|inventing|filling (?:it|them) in|making (?:it|something) up|fixing)\b/, 1.1, 'rather-than-guess']
    ],
    P: [
      [/\b(?:worst|best|oldest|newest|biggest|largest|smallest|highest|lowest|sharpest|latest|earliest|most \w+) first\b|\b\w+ tops\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+) of them\b|\bkeep it (?:short|brief|tight|simple|high-level|punchy|crisp)\b|\bjust the (?:\w+ ){0,3}(?:ids?|ones|items|names|numbers|totals|top|big|high|key|headline)\b|\b(?:one|two|three|four|\d)[- ](?:columns?|lists?|lines?|liners?|slides?|pagers?)\b|\bcheat sheet\b|\b(?:single|one)[- ]slide\b|\blinkedin[- ]length\b|\btweet[- ]length\b|\bfits on a slide\b/, 1.0, 'misc-params2'],
      [/\b(?:(?:fy|cy)\s?'?\d{2,4}|q[1-4](?:\s?(?:fy)?\s?'?\d{2,4})?|h[12]|(?:19|20)\d{2}|ytd|qtd|prior (?:year|quarter|period)|current (?:year|quarter|period)|last (?:year|quarter|month)|this (?:year|quarter)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*)\s*(?:vs\.?|versus|to|and|through|thru|-|–|compared (?:to|with)|against)\s*(?:(?:fy|cy)\s?'?\d{2,4}|q[1-4](?:\s?(?:fy)?\s?'?\d{2,4})?|h[12]|(?:19|20)\d{2}|ytd|qtd|prior (?:year|quarter|period)|current (?:year|quarter|period)|last (?:year|quarter|month)|this (?:year|quarter)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*)\b|\b(?:between|from|for|in|during|across|since|over|covering|as of|through)\s+(?:the\s+)?(?:(?:fy|cy)\s?'?\d{2,4}|q[1-4](?:\s?(?:fy)?\s?'?\d{2,4})?|h[12]|(?:19|20)\d{2}|ytd|qtd|prior (?:year|quarter|period)|current (?:year|quarter|period)|last (?:year|quarter|month)|this (?:year|quarter)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*)\b|\byear[- ]over[- ]year\b|\byoy\b|\bquarter[- ]over[- ]quarter\b|\bqoq\b|\b(?:monthly|quarterly|annual) (?:trend|change|movement)\b/, 1.0, 'period-scope'],
      [/\b\d+\s+(?:[\w-]+\s+){0,2}(?:talking points|bullets?|bullet points|questions|sentences|items|rows|risks|points|steps|examples|options|takeaways|recommendations|findings|issues|metrics|lines|slides|paragraphs|minutes|words)\b/, 1.0, 'n-adj-unit'],
      [/\bby\s+\d+\s?%|\b\d+\s?%\s+(?:of the |shorter|length)/, 1.0, 'by-pct'],
      [/\bsound(?:s|ing)? (?:less|more|like|warmer|friendlier|crisper|clearer)\b|\b(?:less|more) (?:formal|corporate|defensive|technical|salesy|casual|direct|concise|confident|cautious)\b|\bno (?:fluff|jargon|legalese)\b/, 1.0, 'tone2'],
      [/\b(?:fy|cy)?\s?'?\d{2,4}\s+only\b|\bq[1-4]\s+only\b|\b(?!using\b|use\b|rely\b|based\b|work\b|working\b|go\b|going\b|draw\b|stick\b|if\b|not\b)\w+ only\b(?=[\s,.;]|$)|\bonly (?:check|include|cover|ask about|look at|use|flag|list|consider|keep|show|report|review|pull|count)\b/, 0.9, 'only-limit'],
      [/\b(?:in|to|into) (?:thousands|millions|billions|\$k|\$m)\b|\b(?:one|two|three|four|\d) decimals?\b|\bdecimal places?\b|\bround(?:ing|ed)? (?:to|up|down)\b|\bnearest (?:thousand|million|dollar|whole)\b/, 1.0, 'precision'],
      [/\b(?:bar|line|pie|stacked|waterfall|bridge|column|scatter) (?:chart|graph)\b|\bgantt\b|\bheat ?map\b|\bswimlanes?\b/, 1.0, 'chart'],
      [/\bmatch(?:ing)? the (?:style|format|formatting|tone|structure|layout) of\b|\bin the (?:same )?(?:style|format|voice) (?:of|as)\b|\bmodel(?:ed)? on\b/, 1.0, 'match-style'],
      [/\bone (?:row|line|bullet|sentence|paragraph|slide|column) (?:per|for each)\b|\bper (?:row|item|line|segment|entity|control|peer|comment|account)\b|\btime per item\b|\bgrouped by\b|\bgroup(?:ed)? (?:them )?by\b|\bbroken (?:out|down) by\b|\bby (?:segment|region|entity|quarter|month|account|category|owner|severity|risk|tier|framework|scope)\b/, 0.9, 'granularity'],
      [/\b(?:short|brief|concise|crisp|quick|tight)\s+(?:bullet list|bullets|list|summary|paragraph|memo|email|note|answer|overview|version)\b/, 1.0, 'short-format'],
      [/\b(?:in|as|into|use|using|return|give me|provide|output|format(?:ted)? as|formatted in|in the form of|lay (?:it )?out (?:as|in))\s+(?:a |an |the )?(?:simple |short |two-column |three-column |\d+-column |numbered |bulleted |markdown |clean |summary )?(?:table|tables|bullets?|bullet points?|bulleted list|numbered list|list|columns?|json|csv|memo|email|paragraphs?|matrix|chart|outline|one-pager|slide|checklist|scorecard|heat ?map|template|grid|narrative)\b/, 1.2, 'format'],
      [/\b(?:table|columns?|headers?|fields?)\s*(?:with|of|:|showing|containing|including)\s*[\w&/ -]{2,40},\s*[\w&/ -]{2,40}/, 1.2, 'columns-list'],
      [/\b(?:bullet(?:ed)?|numbered)\b|\btwo-column\b|\bthree-column\b|\b\d+-column\b/, 1.0, 'format-word'],
      [/\b(?:table|tabular|bullet|list|json|csv|memo|email|paragraph|outline|matrix|checklist|q&a|faq) (?:format|form|layout|style)\b/, 1.1, 'x-format'],
      [/\b\d+\s*(?:-|to)?\s*\d*\s*(?:words?|sentences?|bullets?|bullet points?|paragraphs?|pages?|lines?|characters?|slides?|points?|items?|rows?|questions?|examples?|options?|recommendations?|risks?|findings?|steps?)\b/, 1.1, 'count-unit'],
      [/\b(?:one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|a few|a couple of|single)\s+(?:largest|biggest|key|main|most|top|major|highest|lowest|smallest|primary|short|brief|concise)?\s*(?:words?|sentences?|bullets?|bullet points?|paragraphs?|pages?|lines?|slides?|points?|items?|questions?|examples?|options?|variances?|drivers?|risks?|controls?|findings?|recommendations?|takeaways?|themes?|issues?|gaps?|changes?|steps?|categories|bullets)\b/, 1.0, 'count-word'],
      [/\btop\s*(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/, 1.1, 'top-n'],
      [/\b(?:under|no more than|max(?:imum)?|at most|up to|less than|fewer than|not more than|within|limit(?:ed)? to|cap(?:ped)? at|keep it (?:to|under)|around|about|roughly|approximately)\s+(?:\d+|one|two|three|four|five|ten|half a)\s*(?:words?|sentences?|bullets?|paragraphs?|pages?|lines?|characters?|slides?|minutes?|points?|page)?\b/, 1.1, 'max-length'],
      [/\b\d+\s*%\s*(?:shorter|longer|shorter|reduction|less|fewer)\b|\b(?:half|a third|a quarter) (?:the|as) (?:length|long)\b|\b(?:one|1|a single|half a)[- ]page\b|\ba slide'?s? worth\b|\bone[- ]pager\b|\bone[- ]liner\b|\bshort paragraph\b|\bsingle paragraph\b/, 1.0, 'relative-length'],
      [/\b(?:fy|cy)\s?'?\d{2,4}\b|\bq[1-4]\b|\bh[12]\b|\b(?:19|20)\d{2}\b|\bytd\b|\bqtd\b|\bmtd\b|\byear[- ]over[- ]year\b|\byoy\b|\bquarter[- ]over[- ]quarter\b|\bqoq\b|\bprior (?:year|quarter|period)\b|\bcurrent (?:year|quarter|period)\b|\blast (?:year|quarter|month|\d+ (?:years|quarters|months))\b|\bthis (?:year|quarter)\b|\bmonth[- ]end\b|\bquarter[- ]end\b|\byear[- ]end\b|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/, 0.5, 'period'],
      [/\bscopes? (?:1|2|3|one|two|three)\b(?:\s*(?:,|and|&|-)\s*(?:1|2|3))*|\bcategor(?:y|ies) \d+\b/, 1.0, 'scope-n'],
      [/(?:[<>]=?|≥|≤)\s*\$?\d|\b(?:greater|more|higher|larger|bigger|less|lower|smaller) than\s+(?:\+|-|±)?\$?\d|\b(?:above|below|over|exceeding|exceeds|under|beyond|outside(?: of)?)\s+(?:\+|-|±)?\$?\d[\d,.]*\s*(?:%|percent|k|m|mm|million|bn|billion|thousand)?|\b±\s?\d+|\+\/-\s?\d+|\bthreshold\b|\bmateriality\b/, 1.1, 'threshold'],
      [/\b\d+(?:\.\d+)?\s?(?:%|percent)\b|\$\s?\d[\d,.]*\s?(?:k|m|mm|million|bn|billion|thousand)?\b/, 0.6, 'number'],
      [/\b(?:rank(?:ed)?|sort(?:ed)?|order(?:ed)?|organi[sz]e(?:d)?|group(?:ed)?|prioriti[sz]e(?:d)?|arrange(?:d)?)\s+(?:them |it |the \w+ |each \w+ |results )?(?:by|from|in order of|according to)\b|\bby magnitude\b|\blargest (?:to|first)\b|\bhighest (?:to|first)\b|\bmost (?:to least|important first|severe first)\b/, 1.0, 'ordering'],
      [/\b(?:plain english|plain language|plain-language|non-?technical|layman'?s? terms|jargon|executive (?:tone|level|style|summary|audience)|board-?level|formal tone|informal tone|conversational tone|neutral tone|professional tone|tone|reading level|grade level|active voice|third person|first person|sec style|investor-?friendly)\b/, 1.0, 'tone'],
      [/\b(?:only|just|limit (?:it|this|the \w+) to|focus(?:ing)? (?:only )?on|restrict(?:ed)? to|excluding|exclude|except|ignore)\s+(?:the )?(?:[\w&-]+ ){0,3}(?:region|segment|entity|entities|subsidiar(?:y|ies)|facilit(?:y|ies)|site|sites|business unit|bu|division|country|countries|accounts?|line items?|categor(?:y|ies)|controls?|key controls|processes|risks?|suppliers?|vendors?|period|quarter|year|scope)\b/, 0.9, 'scope-limit'],
      [/\b(?:north america|emea|apac|latam|europe|us|u\.s\.|uk|germany|domestic|international)\b(?: only)?/, 0.4, 'region'],
      [/\b(?:headings?|subheadings?|sections? for|a summary line|title|executive summary at the top|start with|end with|include (?:a|an) (?:column|row|section|summary|total))\b/, 0.6, 'structure'],
      [/\b(?:absolute and percentage|in (?:absolute|percentage|dollar|\$) terms|both values|show the (?:change|difference|delta)|percent(?:age)? change|dollar change|\$ change|basis points|bps)\b/, 0.9, 'measures']
    ]
  };

  // Objective: concrete verbs vs vague verbs. Verb must have an object after it.
  const CONCRETE = 'spell out|lay out|word an?|spit out|line (?:each|them|it|\\w+) (?:\\w+ )?up|roll up|boil (?:it |this |them )?down|run through|tease out|walk (?:her|him|them|me|us) through|need to know (?:which|what|whether|why|how)|recalc(?:ulate)?|make sure|ensure|confirm that|boil down|walk me through|do an? (?:\\w+ )?(?:analysis|review|check|tie-?out|recon|reconciliation|comparison|breakdown)|get me|i need (?:the|a|an|all|every)|help me understand|make (?:it|this|the \\w+(?: \\w+)?) (?:more|less|shorter|longer|clearer)|break (?:out|down)|broken (?:out|down)|identify|list|find|flag|compare|explain|summari[sz]e|draft|write|rewrite|re-write|shorten|tighten|condense|trim|simplify|translate|map|extract|pull(?: out| together)?|calculate|compute|reconcile|tie(?: out)?|tie-out|build|create|generate|outline|rank|classify|categori[sz]e|highlight|convert|propose|recommend|suggest|describe|prepare|produce|quantify|cross-?reference|fix|update|roll(?: forward)?|roll-forward|tag|edit|proofread|reword|rephrase|paraphrase|benchmark|score|grade|assess|evaluate|test|design|document|define|detail|break down|breakdown|enumerate|itemi[sz]e|tabulate|chart|plot|forecast|estimate|project|spot|detect|pinpoint|surface|call out|point out|show|tell me|give me|provide|turn|transform|restate|align|match|link|validate|verify|confirm|check (?:whether|if|that|for|each|every|all)|review (?:for|whether|if|each|every|against)|look (?:for|at whether)|scan (?:for|the)|search (?:for|the)|go through .{0,40}? (?:and|to) (?:find|flag|list|identify|pull)|determine|decide|answer|count|total|sum|average|split|merge|consolidate|format|reformat|restructure|reorgani[sz]e|sort|group|filter|segment|draft up|write up|put together|come up with|brainstorm|name|label|mark|annotate|comment on|critique|challenge|stress-?test|poke holes|red-?team|interpret|clarify|expand|elaborate|add|insert|remove|delete|replace|correct|standardi[sz]e|normali[sz]e|populate|fill in|complete|respond to|reply to'.split('|');
  const VAGUE = /\b(?:analy[sz]e|look at|look over|go over|review|check|help(?: me)?(?: with)?|assist(?: with)?|work on|handle|deal with|thoughts on|improve|clean up|do something with|take a look|have a look|figure out|sort out|process|investigate|examine|study|evaluate|assess|tell me about|what do you think)\b/;
  const QUESTION = /(?:(?:^\s*|[.!?]\s+)(?:what|whats|why|which|how|where|when|who|is|are|does|do(?! not)|did|can you tell|could you tell|would)|(?:[:;,]\s+|\s-\s+)(?:what|whats|why|which|how|where|when|who))\b[^?.!\n]{6,}\??/;
  const STOP = new Set('the a an this that these those it them me us my our your of to for and or in on with at by from is are be please can could would you i we just some any all also then so very really quickly out up down off over key main attached selected stuff things something everything anything whatever etc pls'.split(' '));
  const CASUAL_ASK = /\bwhy (?:is|are|did|does|do|has|have|was|were)\s+(?:\w+\s+){0,4}(?:up|down|higher|lower|so (?:high|low|big)|different|off|negative|zero)\b|\bwhich (?:one |number |figure |value )?is (?:right|correct|wrong)\b|\bwhat does (?:this|that|the) (?:\w+\s+){0,3}(?:do|mean|require)\b|\b(?:need|want|give me|get me)\s+(?:a|an|the|some)\s+(?:[\w&-]+\s+){0,4}(?:checklist|list|summary|table|memo|template|outline|plan|questions|test steps)\b|(?:^|[.!?]\s+)(?:[\w&-]+\s+){0,3}(?:questions|checklist|test steps)\s+(?:for|on|about)\s+\w+|\bmake (?:this|it) (?:sound|read|look)\s+(?:more|less|better|clearer|\w+er)\b/;
  const OFFTASK = /^\s*(?:hi|hello|hey|thanks|thank you|thx|ok|okay|cool|great|test|testing|yo|good morning|good afternoon|\?+|lol)\b[\s!.?]*$/;

  function objective(t) {
    const hits = [];
    let score = 0, vagueOnly = false;
    if (OFFTASK.test(t)) return { score: 0, hits, vagueOnly: false, verbs: [] };
    const verbs = [];
    const reC = new RegExp('\\b(' + CONCRETE.join('|') + ')\\b((?:\\s+[\\w&$%./:-]+){1,10})', 'g');
    let m;
    while ((m = reC.exec(t))) {
      const verb = m[1];
      if (/\b(?:not|never|without|no need to|avoid)\s+(?:\w+\s+)?$/.test(t.slice(Math.max(0, m.index - 20), m.index))) continue;
      const objWords = m[2].trim().split(/\s+/).filter((w) => !STOP.has(w.replace(/[^\w&$%-]/g, '')));
      // "summarize" or "tell me" with nothing meaningful after it does not count
      if (objWords.length >= 1) {
        verbs.push({ verb, index: m.index });
        hits.push({ start: m.index, end: m.index + m[0].length, tag: 'verb:' + verb });
      }
    }
    if (verbs.length) score = 1.2;
    if (!verbs.length) {
      const q = t.match(QUESTION);
      if (q) {
        const content = q[0].split(/\s+/).filter((w) => !STOP.has(w) && w.length > 3);
        if (content.length >= 3) { score = 1.0; hits.push({ start: q.index, end: q.index + q[0].length, tag: 'question' }); }
      }
    }
    // vague verb followed by a purpose clause that names a result
    const vm = t.match(new RegExp(VAGUE.source + '[^.;\\n]{0,80}?\\b(?:for (?:any |all |possible |potential |obvious |the )?(?:errors?|mistakes?|issues?|problems?|gaps?|inconsistenc\\w*|discrepanc\\w*|anomal\\w*|outliers?|duplicates?|missing|typos?|variances?|changes|risks?|red flags?|deficienc\\w*|weakness\\w*|completeness|accuracy|compliance|consistency|conflicts?|mismatch\\w*)|to (?:find|see|identify|spot|flag|determine|confirm|check)|and (?:identify|flag|list|find|explain|tell|show|summari[sz]e)|whether|if there|against)\\b\\s*\\w*'));
    if (!score) {
      const ca = t.match(CASUAL_ASK);
      if (ca) { score = 1.0; hits.push({ start: ca.index, end: ca.index + ca[0].length, tag: 'question' }); }
    }
    if (!score && vm) { score = 1.0; hits.push({ start: vm.index, end: vm.index + vm[0].length, tag: 'vague+purpose' }); }
    if (!score && VAGUE.test(t)) vagueOnly = true;
    return { score, hits, vagueOnly, verbs };
  }

  // Two or more unrelated jobs: a connector followed closely by a second task verb.
  const JOB_VERBS = 'summari[sz]e|draft|write|rewrite|translate|fix|build|create|make|map|tie(?: out)?|compare|explain|extract|pull|redo|update|email|send|remind|tell me (?:how|what|why)|check|review|format|reformat|convert|prepare|put together|design|update|schedule|set up|calculate|reconcile|draft up|write up|generate|look (?:for|at|into)|find|analy[sz]e|do(?! not)(?! the same)';
  const CONNECT = new RegExp('(?:\\b(?:and also|also|and then|then also|plus|additionally|as well as|separately|on top of that|while you are at it|and after that|after that|oh and|next)\\b|,\\s*then\\b|;\\s*|\\.\\s+(?=(?:also|and|then|plus|separately)\\b))[,:]?\\s*(?:can you |could you |please |pls |i need you to |you can |also |then |go ahead and )?(?:' + JOB_VERBS + ')\\b', 'g');
  const TOO = new RegExp('\\band (?:' + JOB_VERBS + ')\\b[^.;\\n]{3,60}\\b(?:too|as well)\\b');
  function stacked(t, verbs) {
    let n = 0, m;
    const re = new RegExp(CONNECT.source, 'g');
    while ((m = re.exec(t))) {
      const before = t.slice(Math.max(0, m.index - 30), m.index);
      if (/\b(?:questions|items|them|it|those|assumptions)\s*$/.test(before) && /separately/.test(m[0])) continue; // "list open questions separately"
      n++;
    }
    if (TOO.test(t)) n++;
    const listOfDeliverables = /\b(?:a|an) [\w-]+ (?:policy|memo|email|report|checklist|deck|plan),\s*(?:a|an) [\w-]+ (?:policy|memo|email|report|checklist|deck|plan),?\s*and (?:a|an) /.test(t);
    return n >= 1 || listOfDeliverables;
  }

  function detect(prompt, opts) {
    const files = (opts && opts.files) || [];
    const nm = normalizeWithMap(prompt);
    const t = nm.text;
    const el = {};
    for (const k of ['S', 'C', 'P', 'E']) {
      let score = 0; const hits = [];
      for (const [re, w, tag] of RULES[k]) {
        const g = new RegExp(re.source, 'g');
        let m, best = 0;
        while ((m = g.exec(t))) { if (!m[0]) { g.lastIndex++; continue; } hits.push({ start: m.index, end: m.index + m[0].length, tag }); best = w; }
        score += best; // each rule counts once
      }
      el[k] = { score, hits };
    }
    // attached file names mentioned in the prompt count as a source
    for (const f of files) {
      const base = String(f).toLowerCase().replace(/\.[a-z0-9]+$/, '');
      const words = base.split(/[\s_\-.]+/).filter((w) => w.length > 3);
      if (base && (t.includes(base) || (words.length && words.every((w) => t.includes(w))))) { el.S.score += 1.3; el.S.hits.push({ start: 0, end: 0, tag: 'attached-name' }); }
    }
    const o = objective(t);
    el.O = { score: o.score, hits: o.hits };
    for (const k of ['S', 'C', 'O', 'P', 'E']) el[k].on = el[k].score >= 1;
    const words = t.trim().split(/\s+/).filter(Boolean).length;
    const vague = [];
    if (o.vagueOnly) vague.push('vague-verb');
    if (/\b(?:stuff|things|etc|whatever|something|somehow|some kind of)\b/.test(t)) vague.push('filler');
    if (words < 6) vague.push('too-short');
    for (const k of ['S', 'C', 'O', 'P', 'E']) for (const h of el[k].hits) h.orig = toOriginal(nm.map, h.start, h.end);
    return { text: t, el, stacked: stacked(t, o.verbs), vague, words, verbs: o.verbs.map((v) => v.verb) };
  }

  function grade(on) {
    if (!on.S || !on.O) return 'weak';
    return on.C && on.P && on.E ? 'strong' : 'better';
  }

  const api = { normalize, normalizeWithMap, detect, grade, RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ScopeRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
