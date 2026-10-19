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
node tests/build.js                                               # -> dist/fit-finder.html (92152 bytes, LF)
# Offline Coach link: ship both html files (fit-finder.html and prompt-coach.html) in one folder; opened from a file, the link uses prompt-coach.html, online it uses the artifact URL.
node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B      # held-out accuracy
node tests/catalogue.test.js                                      # every use case sourced; matching
node tests/prompts-strong.test.js                                # every prompt the page can show grades strong in the Prompt Coach
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
| `data/card-gold-a.jsonl` | For the 29 half-A tasks that fit: every card right to show, each row labelled by Ian (15) or a blind top-model labeler (14) (2026-10-16) |
| `data/card-gold-real.jsonl` | For the 19 real prompts in `data/real/2026-10-15-community.jsonl`: every card right to show, each row labelled by Ian (3) or a blind top-model labeler (16) (2026-10-17) |
| `data/card-gold-fresh.jsonl` | For the 29 fresh real prompts in `data/real/2026-10-17-fresh.jsonl`: fit and every card right to show, each row labelled by Ian (0) or a blind top-model labeler (29) (2026-10-17) |
| `data/top3/` | The 43-sentence set written 2026-10-19 (`2026-10-19-top3.jsonl`), its gold (`card-gold-top3.jsonl`) and sha256 file; scored once, never tuned on |
| `sandbox/` | Eight made-up files and prompts run in a Workiva AI sandbox: `scoring-sheet.md`, `key.json`, saved `replies/`, rebuilt prompt cards (`built*`) |

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
potential explanations ... from the prior ... period") read as reading only. Now a bare
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
(writing variance explanations for the year-over-year ... in emissions) changed: it gains an
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
These are AI-written tasks; for real prompts see "Right card on real prompts" below. Whether a
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

Right card on real prompts (2026-10-17): `data/card-gold-real.jsonl` holds the same kind of labels
for the 19 real prompts (Workiva and community posts, `data/real/2026-10-15-community.jsonl`; all
19 fit, Ian 2026-10-15). A top-model labeler, blind to the engine (prompt text and card
descriptions only, no match words), labelled all 19; Ian then checked the 3 calls that decided the
wrong-card count, each a card the page shows that the labeler rejected: he agreed on W1 (a
month-on-month variance write-up for the CFO is not "pull the key points") and S1 (emissions drivers
for executives is not the executive-narrative rewrite card), and overruled it on W3 (the summarize
card fits drafting a goodwill footnote from the valuation file). As the suite prints it:
`real prompts first card right: 15 of 19; wrong card 2 (W1,S1); no card where one fits 2 (W5,S2); labelled by Ian 3, by the model 16`.
Of the 15, 10 get a right card and 5 rightly get none (W2, S4 to S7: the labeler found no card for
intercompany work, target trajectories, ranking or roadmapping reductions, or assurance questions;
those 5 calls are the model's alone, unlike B, where Ian marked no task "no card fits"). Not a
held-out score: rules were tuned on these same prompts on 2026-10-15 and 2026-10-16 (S1, S2, S3,
S10 and the draft and 10-Q fixes above), so it says the page holds on real wording it was partly fitted
to, not how it does on new real prompts. 19 prompts, one labeler.

Right card on fresh real prompts (2026-10-17): `data/card-gold-fresh.jsonl` labels 29 real prompts
that no rule had been tuned on: 26 customer comments on the Community post "Amplify giveaway #3:
AI FTW!" (2026-07-06; 11 personal or advice-only comments dropped), 2 from "Quarterly Financial
Statement Roll Forwards Very Time Consuming" (2026-09-25) and 1 from "Workiva AI - XBRL"
(2026-04-02). The prompts stay out of git (`data/real/2026-10-17-fresh.jsonl`, like the 19
earlier ones). A top-model labeler, blind to the engine (the labelling guide, the 26 card
descriptions and the prompt text; no match words), gave each a fit and every card right to show.
All 29 rows are the model's until Ian checks the few calls that decide the score. The
prediction, written before the engine ran on them: fit agreement 65-85%, first card right on
50-75% of the prompts that fit, wrong card at most 4; disproved if first card right is under 40%
or wrong card over 6. Scored once, before any rule change, as the suite prints it:
`fresh prompts first card right: 8 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1); no card where one fits 9 (G4,G10,G12,G13,G16,G17,G19,G20,G21); card on a not-a-fit prompt 1 (G5); fit agreement 12 of 29; labelled by Ian 0, by the model 29`.
So the prediction is disproved: first card right 35%, fit agreement 41%. These prompts are
mostly general work, unlike the reporting tasks the rules were tuned on: of the 15 the labeler
gave a card, 12 get a general card (rewrite 7, summarize 3, formula 2). 7 of the 9 misses are
rewording text or writing an email, memo or passage (the rewrite card) and 2 are writing a
spreadsheet formula;
the engine rates 3 of them "not a fit" because it reads no step in a request for memos or emails,
a bare "wording" label, or a request for an INDEX MATCH formula (G4, G13, G19). 12 of the 17 fit
differences are good against partial, mostly whether the job recurs, which the page asks. The
comments are short, and the labeler marked 18 of 29 calls low confidence. One labeler, one run.

Rewrite-reach rule C (2026-10-17). It replaces rule V1 (0dd05ca) and rule V2 (6f7090e); both were
reviewed and withdrawn. The live page runs rule C since version 14 (2026-10-17, version id
1792251986-190c); version 13 ran the 383afd3 rule. Rule C is the 383afd3 engine plus one alternative: "worded ... better"
(word-ed or word-ing, up to two words, then better: "get the note worded better") reads as REWRITE.
The rewrite card matches rewrit, shorten, tighten, plain english, board, executives, audience, tone,
too long, plus four new words: re-word, rephras, worded and wording. "Revise" and the tone words
(professional, formal, polite, diplomatic, concise, friendly) are not read as REWRITE and are not
on the card.

An earlier version of this section said V2 kept "all the V1 gains" and read a tone word "only when it
describes a piece of writing". Neither held. On the round's pool of 42 sentences that are not
rewrites ("Revise the budget draft before close.", "Make the notes payable schedule more formal."),
V2 gave 19 the rewrite card; every one of the 19 hit a card word V1 and V2 had added (revis 8,
formal 6, professional 3, concise 1, friendly 1), and dropping any single added engine alternative
still left 12 or more. So the guards did not converge and rule C removes the alternatives instead.

Numbers (the suite prints the fresh line first on its line:
`fresh prompts first card right: 15 of 23 that fit; wrong card 5 (G2,G14,G15,G22,X1); no card where one fits 3 (G10,G12,G20)`; first
scored 8 of 23 before any rule, V2 12):
- Fresh 29 prompts: first card right 15 of 23, wrong card 5 (was 10 and 6 before the item-71 labels below).
  The rule was chosen after seeing which of these missed, so this is a tuned-on figure.
  Ian's 5 item-71 checks were answered by the program lead, a model (lead 17, 2026-10-17), on Ian's words "You were supposed to provide the answers" (15:30:18Z). The rows stay `by: model` and Ian can overturn any of them (1 no, 2 no, 3 yes, 4 yes, 5 no).
  Done-when (proposal A, accepted the same way): first card right on at least 12 of 23 and wrong on at most 3 on this set, then the same bar scored once on a second untouched real set; now right is met (15), wrong is not (5).
- Blind held-out, 40 sentences (`docs/evidence/2026-10-17-rewrite-heldout.jsonl`, 20 rewrite asks and
  20 that are not; labels by the model; each rule scored once): rewrite card on 7 of 20 asks for
  rule C, 13 for V2, 3 for the v13 rule (383afd3); on the 20 that are not rewrites 1 of 20 for every
  rule, the same row (H32, "tone at the top"). So on blind sentences rule C is no cleaner than V2
  and reaches fewer asks. Its precision edge shows only on the reviewers' pool (in-sample, written
  while reviewing V2): `tests/rewrite-pool.jsonl` holds 86 sentences, 0 of 42 non-rewrites get the
  card (V2 19), and 6 of 44 asks reach it.
- Unchanged: half A 12 of 29 wrong card 0, held-out B 13 of 30 wrong card 3, real prompts 15 of 19
  wrong card 2, eval A 52/60 and B 45/60, and the 139 older texts rate and match the same as at
  383afd3.

Known limits: asks such as "make this memo more concise", "make this more diplomatic" and "revise
this slide text" get no rewrite card. An explain request that says "wording ... better" ("Help me
understand the wording better.") gets the rewrite card first (V2 too; the v13 rule gives no card).
Rule C was chosen on the pool it is scored on; on the blind held-out 40 it is no cleaner than V2 and
reaches fewer asks, so choosing C trades reach for fewer wrong cards on the kind of finance wording
reviewers found. One pool label is the model's call ("Accrue more professional fees." = not a
rewrite). Details: `docs/evidence/2026-10-17-rewrite-reach-round.md`.
The prediction above stays disproved as scored once, before the rule.

## 2026-10-18 fair test (kept rules)

A new set of 104 model-written, model-labelled prompts was written; 4 were dropped by the dedupe
check, and the 100 kept were split with seed 20261018: 50 tuning, 50 untouched. Two tune attempts
were kept, both on the tuning half only. Net change from the base commit (read from
`git diff aea7461 HEAD -- fit-finder/engine fit-finder/data/catalogue.json`):

- `engine/fit.js`: the rewrite word list gained capitalise/capitalize, synonym(s),
  better/different/another/simpler word|phrase|term, and "turn ... into
  paragraphs/bullets/table/list/summary/prose/sentences"; an ask whose only job is drafting
  (the DRAFT operation alone) and that mentions e-mail now gets no card.
- `data/catalogue.json`: the `gen-rewrite` match gained proofread, bullet, capitalise/capitalize,
  synonym(s) and "better word". ("paragraph" was added by the first kept commit and removed by
  the second; the base never had it, so the net diff has no "paragraph".)

"First card right" in the line below counts a fit row as right when no wrong card and no missed
card was shown: right = fits - wrong - missed. A fit row whose gold names no card therefore counts
as right when no card is shown (the same definition as the suite's fresh line).

Dist size at the fair test (2026-10-18): 83016 bytes (LF, as committed); not the current size, see the build line above. Measured after these rules (suite): B first card right 13 of 30, wrong 3; A 12 of 29, wrong 0;
real 15 of 19, wrong 2; fresh 15 of 23, wrong 5, card on a not-a-fit prompt 1, fit agreement 12
of 29. Eval fit agreement: A 52/60, B 45/60. The live page is not republished.

Untouched half, scored once after the rules were locked (model-written, model-labelled; not real customer prompts): first card right: 25 of 42 that fit; wrong card 5 (N42,N48,N53,N56,N91); no card where one fits 12 (N17,N18,N24,N52,N63,N77,N79,N88,N93,N99,N100,N102); card on a not-a-fit prompt 1 (N34); fit agreement 19 of 50; score 24. Bar: wrong card <= 5; wrong card 5, so it passes (wrong_within_bar=yes).

Card-hit-only view (a card shown and in the gold; rows with no gold card excluded). Tuning half,
measured with an ad-hoc script on the tuning files only: 14 of 29 fit rows with a gold card before
the tune, 17 of 29 after (6 of the 35 tuning fit rows have no gold card). Untouched half: 32 of 42
fit rows have a gold card and 10 do not (counted from the gold files), so card hits are between 15
and 20; a read-only reviewer's re-run reports 15 (35.7% of 42; 15 of 32 card rows), read from the
reviewer, not measured here. Bar reading: by the spec's definition F is all fitting rows (42), so
the bar is 5 and 5 wrong passes at the bar. If F counted only fit rows with a gold card (32), the
bar would be 4 and 5 wrong would fail. The verdict stays the spec's: Ian ruled 2026-10-18 "All 42
count (Recommended)", with the 32-row fail reported beside it.

Share-ready T5b (targeted card fixes): the sustainability requirements card needs a sustainability cue; a translate ask
leads with the translate card; an op word after "do not / don't / no need to / never / without" does not count; "list the
exceptions/findings" reads as EXTRACT, so a SOC or assurance report review reaches the file-summary card. Tone and length
words ("more concise", "more professional") are left out of REWRITE on purpose: rule C (2026-10-17) and its tests say so.
Cases: tests/edge-cards.test.js. Dist size was 88205 bytes at that dated step (current size: see the build line above).

Share-ready fix A (final review): How it rates adds the untouched blind result (11 of 29 first feature right, 9 wrong, 4 shown on tasks that do not fit; the 29 newer prompts were tuned on and AI-labelled); "22 of 23 re-checked on 18 Oct 2026 (one needs sign-in)"; fuller prompts say "I selected with @" (chat takes no uploads); both prompt panels say to replace each [bracket]; the sustainability requirements cue also counts before the word, plus TCFD, SASB, CDP, EU taxonomy, double materiality, GRI; Benchmarking badge is preview; Translations badge is "not on a public support page yet: check in your workspace" (S1 only). Pagetest also checks the static https Coach href. Dist size 89183 bytes (LF, as committed).

## Top-3 and sandbox check (2026-10-19)

The page shows one card in full; cards 2 and 3 appear only as "Also close:" names, as before. Task 3 (a full three-card list) was skipped by the PM proxy; Ian may overturn that.

Parent score (before this branch) and end score (after; one measurement read twice, because the engine and every id/area/ops/match are frozen) are identical:

```
first card right: 9 of 32 that fit; wrong card 1 (X2); no card where one fits 22 (X4,X5,X6,X8,X10,X12,X13,X14,X16,X17,X18,X22,X25,X26,X28,X29,X30,X33,X34,X36,X39,X40); card on a not-a-fit prompt 0 (); fit agreement 18 of 43; score 24
top 3: right card anywhere in the 3 shown 9 of 32 that fit (first card right 9, gain 0); any wrong card shown 1 of 43 (X2); first card wrong or on a not-a-fit prompt 1; rise in wrong lists 0
```

- The scorer's "first card right 9" counts X41, a task that fits but has no matching feature, where the page rightly showed none; the right feature came first for 8 of the 31 that fit and have one.
- Gain from showing three cards: 0 (right card anywhere in 3 is 9 of 32, the same as the first card). Rise in wrong lists: 0.
- The spec prediction (gain of at least 3) is disproved.
- The main failure is no card at all: 22 of the 32 tasks that fit.
- Sandbox check (`sandbox/scoring-sheet.md`): eight prompt cards run in Ian's own Workiva AI sandbox on made-up files, each with 5 planted items. First run 6 pass on the sheet's rule (at least 4 of 5 planted items found, nothing invented), 2 fail (an added currency); sus-exec-narrative broke its "under 80 words" limit in chat (85) and in place (94), and in place opened with the cause, not the change; gen-summarize-file passed on its second re-run; the fixed prompts re-run and pass. In place, the gen-rewrite card fails (word and fact changes). The two GRC features (Evidence analyzer, Risk & Control knowledge base) are not in this sandbox, so those cards were answered by plain @ chat. The sandbox may have features a customer lacks.
- Tone-only edits stay without a card (rule C).
