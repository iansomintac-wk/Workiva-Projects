# Prompt Coach labeling guide

Each example is one prompt a Workiva customer might type into Workiva AI (an assistant inside
the Workiva reporting platform: Documents, Spreadsheets, Presentations, Wdata; it can read the
open file, a selection, attached files, and knowledge bases such as "ESRS / ISSB Intelligence").
Users are financial reporting (SEC, 10-K/10-Q, MD&A, footnotes, tie-out, XBRL, earnings
releases, board decks), GRC (SOX controls, RCMs, test steps, evidence, COSO/NIST/ISO 27001
mapping, audit findings, risk registers, policies) and sustainability (CSRD/ESRS, ISSB, GHG
Scope 1/2/3, CDP, TCFD, assurance, supplier data) teams.

## Output format: JSONL, one object per line

{"prompt": "...", "S": 0|1, "C": 0|1, "O": 0|1, "P": 0|1, "E": 0|1, "stacked": 0|1,
 "intent": "...", "domain": "FR|GRC|SUS|GEN", "tags": ["..."]}

## SCOPE element labels (1 = clearly present)

S  Source: the prompt tells the AI exactly what to read, so it could locate it.
   1: "the selected table/cells/rows/paragraph", "this document/report/sheet/deck",
      "the attached ...", a named file ("Q3_RCM.xlsx"), a specific sheet/section/slide/tab/
      note/column, a named Wdata query, a knowledge base ("using ESRS / ISSB Intelligence").
   0: vague possessives with no locator: "our emissions data", "the numbers", "our controls",
      "our revenue", "my report" (no way to know which), or no source at all.
C  Context: purpose, audience, or situation the output serves.
   1: a role ("You are a SOX auditor", "Act as an assurance reviewer"), an audience
      ("for the audit committee", "for executives", "for a new analyst"), a destination
      ("for the climate section of our CSRD report", "for the 10-Q MD&A"), or background
      that changes the answer ("we're going through assurance next month", "first-year filer").
   0: none of these. "our company" alone is not context.
O  Objective: one concrete job with a recognizable finish line.
   1: specific verb + object + what to produce/find: "identify the three largest variances",
      "draft a footnote paragraph", "map each control to COSO principles", "list missing
      evidence", "rewrite for executives", "explain what ESRS E1-6 requires".
   0: vague verbs with no defined result: "analyze our data", "look at this", "review the
      controls", "help with the report", "thoughts?", "check this" (check for WHAT?),
      "summarize" IS concrete enough only when the object is named ("summarize this table" = 1,
      "summarize" alone = 0).
P  Parameters: constraints that shape a useful result.
   1: format (table, bullets, columns, JSON, memo), length (150 words, two sentences, 30%
      shorter), count (top three, ten questions), scope/period (FY2025 vs FY2026, Q3, Scope 1-3,
      North America only), thresholds (> 15%, over $1M), ordering ("rank by magnitude"),
      tone/reading level ("plain English", "board-level").
   0: none.
E  Evaluate: an explicit rule for checking or trusting the output.
   1: "don't speculate / don't make anything up / don't add facts", "preserve every number",
      "cite the source / show where each comes from / reference cell or page", "phrase causes as
      hypotheses", "list open questions / assumptions", "flag anything you're unsure of",
      "say if the data doesn't support it", "do not decide which value is correct",
      "separate facts from explanations", "I'll verify against the source".
   0: none. A source restriction by itself ("using only the selected data") is S, not E.

stacked: 1 if the prompt asks for two or more unrelated jobs at once (e.g. "summarize this,
then draft an email to the CFO and also fix the formatting").

intent (pick one): summarize | variance | anomaly | consistency | draft | rewrite | extract |
compare | explain | questions | map | checklist | formula | other
  variance = explain/identify changes between periods; anomaly = find unusual/missing/duplicate
  values; consistency = cross-check numbers or claims within/between documents (incl. tie-out);
  draft = write new content; rewrite = edit existing text (shorten, tone, clarity);
  extract = pull specific items into a list/table; compare = against peers/prior/benchmark/
  framework gap; explain = explain a requirement/standard/concept; questions = generate review
  or audit questions; map = map items to a framework (controls to COSO, data to ESRS);
  checklist = produce steps/test procedures/to-do list; formula = spreadsheet formula/query help.

Grade is NOT labeled; it is derived: weak if S=0 or O=0; strong if all five = 1; else better.

## Writing realistic prompts
- Vary length (3 to 150 words), register (terse, polite, question form "can you...", lowercase,
  typos, bullet lists, run-ons), and phrasing. Do NOT reuse stock phrases; paraphrase cues
  ("stick to the spreadsheet", "nothing that isn't in the doc", "if you're not sure say so",
  "point me to the cell", "keep all figures exactly as they are").
- Use realistic artifact names, metrics, periods, frameworks.
- Aim for a mix: ~40% weak, ~35% better, ~25% strong.
