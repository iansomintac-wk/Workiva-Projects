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
node tests/build.js                                               # -> dist/fit-finder.html (82,594 bytes)
node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B      # held-out accuracy
node tests/catalogue.test.js                                      # every use case sourced; matching
node tests/pagetest.js [capture-folder]                            # real Chrome at 1280 and 375 px; needs Chrome, no npm deps
```

| File | What it is |
|---|---|
| `engine/fit.js` | Rates a task: fit, recurring or not, steps (who keeps each), starter prompt; `scan()` rates every line of a checklist; `match()` finds the closest catalogue use cases; `lead()` names the first step the AI can take; `patternPrompt()` offers a use case's fuller prompt only when it starts with that same step |
| `data/catalogue.json` | The only source of Workiva AI claims on the page: 23 support pages, 22 features, 26 use cases, 5 roles, 5 left out and why |
| `data/capabilities-confirmed.md` | The catalogue's 22 features in one readable table (availability, source pages), with what was left out, what is not confirmed, and conflicts with earlier notes |
| `web/template.html` | The page; `tests/build.js` inlines the catalogue, the engine and `../prompt-coach/engine/files.js` |
| `data/LABELING.md` | The rubric: good / partial / not a fit, operations, blockers |
| `data/tasks.jsonl` | 120 AI-written task descriptions, blind-labeled by an AI |
| `data/card-gold.jsonl` | For the 30 held-out tasks that fit: every card Ian marked right to show (2026-10-16) |
| `data/card-gold-a.jsonl` | For the 29 half-A tasks that fit: every card right to show, each row labelled by Ian (11) or a blind top-model labeler (18) (2026-10-16) |

## How good it is (2026-10-15)
Half A (60 tasks) tuned the rules; half B is held out. Fit agreement: A 86.7%, **B 75.0%**
(the draft written before seeing data: 61.7% / 66.7%). Good-vs-not mix-ups on B: 1 of 60 (2 before
the past-tense fix of 2026-10-16 below, which changed one B task; B is not untouched for it). It
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
workflow, Suggestions, the Workiva MCP connection to Claude, and Agent Studio. The sustainability anomaly check
was left out until S16 was found to name the job ("identify anomalies, outliers, and other
inconsistencies", with a prompt to run on the sustainability report or Factbook spreadsheet).
Re-checked 2026-10-16 after the sandbox pilot (`docs/evidence/2026-10-16-catalogue-recheck.md`): Benchmarking still holds, Suggestions is still a preview with no later page, and Agent Studio is now listed as left out.

Of the 30 held-out tasks that fit, 16 (53%; 15 before the reading-only fix below, 14 before the
past-tense fix) reach a specific
use case; the rest get "ask Workiva
AI chat about your file". That count includes any suggestion, right or wrong (13 of 30 get the
right first card; see "Right card on the held-out half" below). Before 2026-10-15 it
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
The sustainability anomaly check and the sustainability disclosure card, which also look for two
words in one sentence, likewise step over a decimal point ("3.5 million tonnes ... anomalies") and
look at most 300 characters between the two words (uncapped, a pasted 5,000-row emissions table
took 9 to 15 s to rate; capped, about 0.1 s). Checks hold that limit at exactly 300 in both word
orders (300 characters apart gets the card, 301 does not); before them, a limit moved anywhere from
200 to 500 passed every check.
No fit changed on the 139 tasks; A and B are unchanged. Of the 120 labelled tasks only task 92
(writing variance explanations for the year-over-year change in emissions) changed: it gains an
"Explain it" step and its first use case is now the sustainability anomaly check instead of the
financial narrative. S9 (an executive summary of a query's results) keeps "summarize a file": the
Wdata card is for writing or fixing a query. S7 and task 42 read as reading only; see below.

Past tense that describes the data (2026-10-16): "uploaded", "submitted", "exported", "scheduled" and
the other work-in-another-system verbs count as you acting only after "I" or "we" ("I uploaded", "we
have already scheduled"); otherwise they describe the data ("the evidence uploaded", "the figures the
sites submitted", "the exported trial balance"). Of the 139 tasks, 2 hold such a word and 1 changed:
task 57 ("checking that the evidence uploaded actually covers the right period"), labelled good, was
rated "not a fit" and is now partial with the evidence card. It is in held-out half B and was found
by probing all 139 tasks. Fit agreement is unchanged (A 52/60, B 45/60).

Reading only (2026-10-16): of the 139 tasks, 2 read as reading only. Task 42 ("note exceptions" in
vendor SOC 2 reports, "whether our ... controls cover them") now pulls out the exceptions and checks
coverage (only controls, policies, procedures, evidence or tests "cover" in that sense: a vendor
covering the cost or a team covering a shift is not a check), and gets the control-mapping card; its fit stays partial (labelled good: the engine misses
that it comes back every year, which the page asks). S7 ("generate ten questions" as an assurance
provider) now drafts; no card covers writing assurance questions, so it keeps "ask Workiva AI chat
about your file". "Assurance provider" names who asks, not a recurring job, so S7 stays partial
(Ian's label) and task 75's recurring guess now matches its label (A recurring 77% -> 78%). Only
these 3 of 139 changed; fit agreement is unchanged (A 52/60, B 45/60). Task 42 is in held-out half B,
so B has now been used for two fixes. "Review <data> for unusual changes" appears in none of the 139.

Right card on the held-out half (2026-10-16): `data/card-gold.jsonl` holds, for each of the 30
held-out tasks that fit, every card Ian ticked as right to show (offered 1 to 3 cards and "no card
fits", or he could name another). The page shows only the first card, and `tests/catalogue.test.js`
now prints how often it is right: 13 of 30. Of the 16 tasks that get a card, 13 get a right one; the
3 wrong are task 67 (mapping disclosures to ESRS datapoints gets the controls-framework card), 74
(turning ISSB requirements into questions gets the sustainability executive narrative) and 91 (an
executive summary of the sustainability report gets the disclosure card). The other 14 get no card,
and Ian accepted a card for every one of them (he marked none of the 30 "no card fits"): for 7 of
them chat with your file is already the feature a card he accepted names first; for the other 7
(tasks 30, 45, 50, 59, 80, 111, 119) every card he accepted names another feature first. So the gap is reach more
than wrong cards. A top-model labeler, blind to the engine, matched Ian exactly on 11 of 30 and
accepted fewer cards on 18; Ian disagreed with it on 2 of the 8 he checked first (the agreed limit),
so he labelled all 30. Every question offered at least one card, which may lean toward picking one.
These are AI-written tasks: whether real tasks get the right card is not yet measured. Whether a
card's advice works in Workiva AI has one test so far (Ian's sandbox, 2026-10-16, made-up data,
`docs/evidence/2026-10-16-sandbox-pilot.md`): asked to compare two versions of an MD&A, chat with
workspace files listed all 4 planted changes, invented none and flagged the removed risk sentence,
but passed "up 6%" as a year roll although revenue went from $4.2bn to $4.5bn (about 7%). One run
of one task; it fits "exact calculation stays with you".

Right card on half A (2026-10-16): `data/card-gold-a.jsonl` holds the same kind of labels for the 29
half-A tasks that fit, so fixes can be found on A while B stays the score. A top-model labeler, blind to
the engine, labelled all 29. Ian labelled 8 of them himself (picked by seed 20261016: 81, 22, 103, 16,
94, 19, 58, 66) and matched it exactly on 5; each of the 3 differences was the model also accepting a
general card. He then checked the 3 tasks where the model's call decides the score and is weakest (23,
49, 65) and overruled it on 23. Each row says who labelled it: Ian 15, the model 14. Ian confirmed the 4 year-over-year labels
(tasks 8, 100, 108, 112) on 2026-10-16. The page's first card is right on 12 of 29 and wrong on none;
17 get no card. "commentary" now reaches the change narrative (first card right 10 -> 12 of 29, tasks 8
and 112). For 13 of those 17 a right card names chat with your file first, which is what the page
suggests; the real misses are now 100 and 108 (year-over-year narrative), 19 (peer benchmarking) and 29
(formula or query help, which the labeler called a weak fit). Half A's figure rests partly on the
model's labels, so it does not compare directly with B's 13 of 30. Held-out B, as the suite prints it:
`first card right: 13 of 30; wrong card 3 (67,74,91); no card where one fits 14 (6,26,30,45,50,59,80,86,95,99,106,111,115,119)`.
Tried and not shipped: "commentary" or a period phrase (last month's/quarter's/year's, budget vs
actual, latest results) got 13 of 29 on A but B's wrong cards went 3 -> 5 (80, 115, both from "last
year's"); letting the card also take REWRITE gained 100 but sent gen-rewrite's own example to this card.
