const fs = require('fs'); const f = process.argv[2]; let s = fs.readFileSync(f, 'utf8');
const anchor = "(?:context|background|situation|audience"; const back = 12;
const i = s.indexOf(anchor) - (s.indexOf(anchor) >= 0 ? 10 : 0); if (i < 0) { console.log('anchor not found'); process.exit(1); }
const add = String.raw`      [/\b(?:you're|you are|i'm|i am) (?:preparing|coaching|helping|briefing|drafting|writing|building|putting together|interviewing|onboarding)\b/, 0.9, 'spike-role'],
      [/\bas (?:the |a |an |our |my )?(?:[\w-]+ ){0,2}(?:reviewer|lead|manager|analyst|preparer|owner|controller|auditor|consultant|partner)\b/, 0.9, 'spike-as-role'],
      [/\bfor (?:the |our |my |all )?(?:[\w&\/-]+ ){0,2}(?:managers|owners|leads|leadership|staff|committee|analysts|accountants|reviewers|heads|executives|team members)\b|\b(?:team|member|managers?|staff|reader|analyst) can (?:follow|use|read|understand)\b/, 0.9, 'spike-for-group'],
      [/\b(?:this|it) (?:feeds|goes into|is going into|will go into|is for)\b|\bit's (?:going into|for)\b|\bfeeds (?:our|the|into)\b|\bfor (?:my|our) (?:first |next |new |upcoming )?(?:[\w&\/+-]+ ){0,3}(?:note|audit|review|deck|framework|assessment|refresh|walkthrough|tracker|close|filing)\b/, 0.9, 'spike-purpose'],
      [/\b(?:next|this coming|later this) (?:week|month|quarter|spring|summer|fall|autumn|winter|year)\b|\b(?:our|the) [\w-]+ (?:committee|team|lead|leads|leadership) (?:asked|wants|needs)\b/, 0.9, 'spike-situation'],
`;
fs.writeFileSync(f, s.slice(0, i) + add + s.slice(i)); console.log('inserted 5 cues');
