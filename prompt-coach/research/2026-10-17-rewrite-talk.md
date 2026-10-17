# Better / Strong rewrites: talk notes and hand-off (2026-10-17)

Talk stage only. No engine code was changed. Stopped at the 200k context line; the next
session resumes from `research/REWRITE_TALK_RESUME_PROMPT.txt`.

## Ian's rulings (verbatim)

- After the six defects below were listed for his case: "yes, that matches, go ahead with the
  plan. Would further targeted research help with building this out better without needing AI
  to run it?" Read as: go ahead with the brief's order of work. No plan file exists yet, so
  code still waits for his yes on a written plan.
- After being asked to allow research sites in the environment: "I added it".
- Asked: "Can't you run simulations using the claude browser extension when im logged into
  sandbox with Workiva AI enabled ?" Answer given: not from a cloud session (no Claude in Chrome
  tools there); yes from a session on his own computer with the extension connected.

## Ian's case

A prompt someone else typed: extract dates, location, emissions source, amount and unit from
attached utility invoices into a table with fixed column headers, a bracketed date rule that
contains a semicolon, a check to count the invoices first, inline citations per row. The
prompt held two drafts of its first paragraph. The person's own words are not stored here.
`rewrite_case_invoices.txt` is a made-up prompt with the same shape; it reproduces the five
checkable defects (measured 2026-10-17): cut at the semicolon, 6 x "please", the audience blank,
4 repeated sentences, the count check moved ahead of the job. It grades "better" (C missing),
intent extract.

Defects Ian agreed, worst first:
1. The sentence splitter cuts at the semicolon inside the brackets, so the main instruction is
   halved and its second half (field list, date example) moves to the end.
2. Kept sentences are re-sorted by SCOPE letter, so the "count the invoices" check jumps ahead
   of the job.
3. Repeated sentences are not removed.
4. "Please" stays, in Better too (a prompt graded "better" is shown unchanged in Better).
5. A blank that is not worth filling is added: "The audience is [who will read it, such as our
   assurance provider]" on a data-extraction table.
6. With a file attached, "I have attached..." is kept and the file is not @-referenced.

## Draft spec for a good rewrite (to confirm with Ian before it is locked)

- Keep the user's sentence order; keep every sentence whole (never split inside brackets).
- Direct imperative, no filler: "Please input" -> "Input"; "Can you check X?" -> "Check X.";
  drop "kindly", "I'd like you to", "I was wondering if you could", thanks lines.
- Drop exact and near-exact repeated sentences.
- Add a missing piece only where it changes the answer; at most N blanks (N from a probe).
- With a file attached, name it with @.
- Limit stated to Ian: no AI at runtime, so it tidies and adds; it cannot restructure prose.

## Measured on 2026-10-17 (commit 73be350, this session)

| Check | Result |
|---|---|
| Uploaded page vs `node tests/build.js` | identical, sha256 prefix 0463237d216c9804 |
| `eval.js rulefeat data/test.jsonl` | 85.6%, weak<->strong flips 8 |
| `simulate.js data/train_*.jsonl data/test.jsonl` | 2,679 runs; strongNotStrong 8, betterWeak 5, dupSentence 2, badText 4, toggleNoEffect 0, emptyFrag 0; placeholders/run 1.38 |
| `customer_check.js` (default) | PASS, 229 runs |
| `customer_check.js data/test.jsonl` | **FAIL**, 609 runs: notStrong 4, all other checks 0. The brief said this passes; it does not today. |
| `research/rewrite_probe.js` filler kept in Strong (non-strong prompts with filler) | sim_customers 32/32, test 34/39; 66/71 = 93% (predicted >= 90% before running) |
| ...filler prompts graded strong, shown verbatim | 5 + 6 |
| ...Strong still contains "?" | 30/180 and 59/477 |
| ...blanks per Strong, sim_customers | 0:11, 1:48, 2:64, 3:41, 4:16 |
| ...blanks per Strong, test | 0:57, 1:151, 2:119, 3:90, 4:60 |
| Filler sentences over all 1,521 data prompts (Intl.Segmenter) | 162; a leading opener rule covers 107, "please" before a verb 8, a thanks sentence 3, not covered 44 (mostly ", can you ..." mid-sentence and trailing "pls") |
| Built-in `Intl.Segmenter` (sentence) | keeps Ian's bracketed sentence whole; keeps "14.2%" and "A.8.2"; wrongly splits after "e.g." (needs a guard) |
| `npm view compromise` | 14.18.0, MIT, 2.7 MB unpacked; not recommended (rules cover the cases above; assumed until measured) |

## Research status

- Read by a helper, not opened by the lead: Anthropic's prompting best-practices page says a soft
  "can you suggest some changes" can get suggestions instead of action; use a direct imperative
  when action is wanted. https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Network: support.workiva.com HTML pages return 403 from the site, but the public help-center
  API works: `https://support.workiva.com/api/v2/help_center/en-us/articles/<id>.json`.
  Allowed now: support.workiva.com, learn.microsoft.com, developers.google.com,
  www.plainlanguage.gov, digital.gov. Still blocked: arxiv.org, platform.openai.com (not needed).
- Workiva articles fetched but not yet summarised (ids): 19173586555412 Tips for getting useful
  responses; 28927643953172 Reference specific files in chat; 28927789354516 Prompt advisor;
  19165395779860 Chat with Workiva AI; 51755818511124 Workiva AI is now your global companion
  (2026-09-16; may make the coach's "document companion does not read your open file" tip out of
  date); 37495611606548 Workiva AI for documents; 20601839106452 Use Workiva AI with tables;
  29758424339476 Choose a knowledge base; 28814781172116 FAQ; 29758666795412 Troubleshooting.
- Not started: plain-language word lists (plainlanguage.gov, digital.gov, Microsoft and Google
  style guides), with the cheap check: a 20-entry list over the 657 rewrites; drop if under ~5%
  change.
- Skipped on purpose: more politeness studies (Ian has decided; they would not change the build).

## Live testing

Needs Ian's own computer: the Claude in Chrome extension is reachable only from a session
running there, not from a cloud session. Sandbox only, synthetic files and prompts only, results
to `research/live-tests/` with the date (rules in the original brief).

## Ledger

| task | role | model | status | tokens | tool uses | wall | $ |
|---|---|---|---|---|---|---|---|
| politeness research | research | haiku, low effort | done, only Anthropic reachable | 20,203 | 11 (notification) | 19.0 s | not measured |
| role/length/format research | research | haiku, low effort | done, only Anthropic reachable | 21,195 | 10 (notification) | 15.1 s | not measured |
| Workiva support research | research | haiku, low effort | blocked by network | 18,433 | 7 (notification) | 16.2 s | not measured |
| baseline checks, probes, repro | lead | - | done | - | - | 04:21-04:46 UTC | not measured |

Skipped at the stop: the hand-off PM step and `brain capture` (the stop rule allows only the
hand-off).
