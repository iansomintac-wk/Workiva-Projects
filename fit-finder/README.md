# Workiva AI Fit Finder (offline)

Shows a customer where Workiva AI fits in their own work. Describe a task (or attach a close
checklist, test plan or calendar) and every step is marked "Workiva AI" or "stays with you", with
an overall fit, the closest sourced Workiva AI use case (which feature, whether it is included or
needs an entitlement, what stays with you, and links to the Workiva support pages), and a starter
prompt to paste into the Prompt Coach or Workiva AI. No AI service, no uploads; file readers are
shared with the Prompt Coach.

The rule comes from the Workiva AI explainer: quick wins are tasks that are repetitive and
text-heavy (reading, comparing, checking, summarizing, drafting, rewriting). Judgment and
sign-off, exact calculation, work in other systems and chasing people stay with a person.

```sh
node tests/build.js                                               # -> dist/fit-finder.html (81,454 bytes)
node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B      # held-out accuracy
node tests/catalogue.test.js                                      # every use case sourced; matching
node tests/pagetest.js [capture-folder]                            # real Chrome at 1280 and 375 px; needs Chrome, no npm deps
```

| File | What it is |
|---|---|
| `engine/fit.js` | Rates a task: fit, recurring or not, steps (who keeps each), starter prompt; `scan()` rates every line of a checklist; `match()` finds the closest catalogue use cases; `lead()` names the first step the AI can take; `patternPrompt()` offers a use case's fuller prompt only when it starts with that same step |
| `data/catalogue.json` | The only source of Workiva AI claims on the page: 23 support pages, 22 features, 26 use cases, 5 roles, 4 left out and why |
| `data/capabilities-confirmed.md` | The catalogue's 22 features in one readable table (availability, source pages), with what was left out, what is not confirmed, and conflicts with earlier notes |
| `web/template.html` | The page; `tests/build.js` inlines the catalogue, the engine and `../prompt-coach/engine/files.js` |
| `data/LABELING.md` | The rubric: good / partial / not a fit, operations, blockers |
| `data/tasks.jsonl` | 120 AI-written task descriptions, blind-labeled by an AI |

## How good it is (2026-10-15)
Half A (60 tasks) tuned the rules; half B is held out. Fit agreement: A 86.7%, **B 75.0%**
(the draft written before seeing data: 61.7% / 66.7%). Good-vs-not mix-ups on B: 2 of 60. It
misses that a task recurs about a third of the time, so the page asks "Does it come back every
period?" instead of only guessing. Unchanged after adding "rationalize", "translate" and
"review the evidence", and no longer reading "owners upload" as the person uploading.

## Workiva AI claims (2026-10-15)
Every feature and use case on the page comes from `data/catalogue.json`, which cites 23 Workiva
support pages: 22 read from the public Support Center (each with Workiva's own last-updated
date) and one, "Where AI is used in Workiva", from a copy Ian saved because it needs a sign-in.
Each use case says whether Workiva names a feature for that job ("named", 22) or it is the
general chat-with-files ability applied to it ("assumed", 4, shown as "try it on one file
first"), and whether the feature is included with Workiva AI (9), depends on the Workiva
solutions an organization has (11) or is a preview offered to selected customers (2). Left out,
with reasons in the catalogue: agent names from the 29 July 2026 press release, the Roll forward
workflow, Suggestions, and the Workiva MCP connection to Claude. The sustainability anomaly check
was left out until S16 was found to name the job ("identify anomalies, outliers, and other
inconsistencies", with a prompt to run on the sustainability report or Factbook spreadsheet).

Of the 30 held-out tasks that fit, 14 (47%) reach a specific use case; the rest get "ask Workiva
AI chat about your file". That count includes any suggestion, right or wrong. Before 2026-10-15 it
was 15, but some of those sent financial drafting tasks to the Sustainability disclosure agent
(it matched the bare word "draft") and peer benchmarking to the Tie-out assistant (any "10-Q").
Both were found by rating 19 prompts and comments from two Workiva Community posts. So the page
stays "describe your task" rather than "pick from a feature list".

Fit on real tasks (2026-10-15): Ian marked the engine's fit on the 19 Community prompts and
comments and agreed with 16. The three he marked are Workiva sustainability prompts (rank
emission sources, check a target trajectory, draft a reduction roadmap) that the engine rated
"not" and he rated partial. The engine now reads ranking, estimating what it takes to reach a
target and drafting a roadmap or plan as a first pass for the AI (not a plan kept in another
system, a plan to chase people or an exact accounting estimate), so all 19 agree; that is the same tasks it was fixed on, not a
held-out score. None of the 120 labelled tasks uses those words (0 of 120 changed fit, steps or
use case; A and B unchanged), so the held-out figures cannot show the fix is right, only that
nothing else moved. Not yet measured: whether real tasks get the right use case.

Use cases on real tasks (2026-10-16): four of the Community sustainability prompts got a wrong use
case or none. A bare "year-over-year" sent an emissions analysis (S1), a data check (S2) and a
Wdata query (S10) to the financial year-over-year narrative; "duplicate records" sent S2 to finding
duplicate controls; a "Wdata table" sent S10 to the narrative-and-tables check; and S3 ("generate
potential explanations ... from the prior reporting period") read as reading only. Now a bare
"year-over-year" points to the financial narrative only when its sentence (looking at most 300
characters either side, so a long paste with no full stops stays fast; a decimal point, as in
"3.5% in Scope 2 emissions", does not end the sentence) names no sustainability data and no
outliers, anomalies or unusual items; a Wdata table and duplicate records, rows or
entries no longer match;
writing, giving or generating explanations is explaining (not explanations other people owe you);
the prior reporting period is a comparison; and creating a query is drafting. S1 now leads with
the sustainability executive narrative, S2 gets "ask Workiva AI chat about your file", S3 the
sustainability anomaly check and S10 the Wdata card (S21: create, improve, explain or fix SQL).
No fit changed on the 139 tasks; A and B are unchanged. Of the 120 labelled tasks only task 92
(writing variance explanations for the year-over-year change in emissions) changed: it gains an
"Explain it" step and its first use case is now the sustainability anomaly check instead of the
financial narrative. S9 (an executive summary of a query's results) keeps "summarize a file": the
Wdata card is for writing or fixing a query. Still open: S7 and "review <data> for unusual changes"
read as reading only, so they reach no use case.
