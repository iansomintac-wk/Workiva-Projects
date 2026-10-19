# Share-ready run, 2026-10-19 (Fit Finder + Prompt Coach)

Branch `share-ready`, 2993c5e..fde835b (17 commits). Run lead: session 8ee22fc0. Ledger:
`.ledger/2026-10-19-share-ready/progress.md` (git-ignored; every dispatch, measurement and fix round).

Ian's goal (verbatim, 2026-10-19): "I want this fully working so that come monday, I can share this with
internal teammembers and customers for them to try this out". Failure means (verbatim): "wrong feature
suggestions and false claims about Workiva AI and a prompt that does not adhere to prompting best practices".

Every figure below was measured in this run by the lead re-running the command, unless marked "read".

## Results against Ian's three failure points

### 1. Prompts that do not follow prompting best practice
- Every prompt Fit Finder can show grades **strong** in the Coach, graded the way the Coach page grades
  (new `fit-finder/tests/prompts-strong.test.js`, using the Coach's own `displayGrade`). Before: 82 not
  strong (starters 13 of 89, 15 of 39, 6 of 38; fuller prompts 16 of 17, 8 of 8, 9 of 9; catalogue 14 of
  15; the COLLECT starter). After: 0 not strong in all 8 sets, plus the new blind set.
- Starters keep the person's own task: no mid-phrase cut, and constraints ("do not reveal employee
  names"), conditions ("if ... then"), list items and the thing "it" refers to are never dropped
  (shape check: 0 problems; control: the T1 engine at ce93f31 is flagged 48 mid-phrase cuts).
  Translation tasks get a translation starter that names the language.
- Fuller prompts no longer say "the attached file" (Workiva AI chat takes no uploads); they say
  "the file I selected with @". Both pages tell people to replace each [bracket] before pasting.
- Coach: new notes, shown on the page (new `prompt-coach/tests/pagetest.js`, real Chrome, 12 checks):
  personal or account data, calculations ("check every figure it calculates"), three or more jobs in
  one comma list, and clearly off-topic prompts. Coach grades are unchanged: GRADE acc 0.856, 8
  weak/strong flips, customer check PASS 229, before and after; the Coach's rewrite text is unchanged
  (edge batch at 2993c5e and fde835b: 0 differing lines). The off-topic note fires on 1 of 2,020
  ordinary prompts (and 1 of 20 tagged off-task ones: it is deliberately narrow).

### 2. False claims about Workiva AI
- Re-check of 54 claims against the live Support Center (`docs/research/2026-10-19-workiva-ai-claims-recheck.md`,
  read; checked 18 Oct): 38 hold, 5 changed, 3 not found, 8 not re-checkable. All changed and not-found
  claims were fixed: quick-edit names, "Tie-out assistant (a preview, 10-K and 10-Q only)",
  "Benchmarking (a preview)" on both pages, the Workiva MCP entry, two Coach tips that claimed behaviour no
  page states.
- The Translations card no longer claims "included with Workiva AI" (its only source needs sign-in);
  it says it is not on a public support page yet.
- The "How it rates" note now gives the honest numbers, including the untouched blind result below,
  and says the 29-prompt figure was tuned on.

### 3. Wrong feature suggestions
| Set | First card right | Wrong card | No card where one fits | Card on a not-a-fit task |
|---|---|---|---|---|
| Real prompts, 19 (labels Ian 3 / model 16) | 15 | 2 | 2 | - |
| Fresh real prompts, 29 (tuned on, model labels) | 15 of 23 | 5 | 3 | 1 |
| Held-out AI tasks, fit agreement | 45 of 60 (75.0%) | | | |
| **Blind set, 40 new sentences aimed at weak spots, before the fixes** | 11 of 29 | 9 | 9 | 4 |
| **Same blind set after the fixes (scored once)** | 11 of 29 | 9 | 9 | 4 |

The targeted fixes repaired every known failure they aimed at (lease standard no longer gets the
sustainability card; translate leads with Translations; "Do not summarize..." is not a fit; SOC 1 / SOC 2
report reviews get the file-summary card; 29 edge cases pinned in `fit-finder/tests/edge-cards.test.js`,
8 of 19 failing on the parent), but **they did not improve the blind set**. On sentences written to probe
weak spots, about 1 card in 3 is wrong. The page says so and tells people to treat the card as a first
guess and check the linked support page.

Not changed, and why: tone-only edits ("make this memo more concise / more professional") still get no
card. The locked rule C (2026-10-17) keeps tone words off the rewrite card because adding them gave false
rewrite cards on 19 of 42 non-rewrite sentences; changing it is Ian's call. The page now says "Couldn't tell
which step of your work this is" (with an example) instead of "not a fit", and "Fit Finder reads English
only for now" for non-English text.

## Reviews
- Final review by Opus (3 must-fix, 11 should-fix, 6 nits) and by Codex read-only (6 must-fix, 2 later;
  its log shows no read of `fit-finder/data/real/`). Merged; no must-fix disagreement. Codex alone found
  that the Coach's new notes never reached the page; a real-browser page test now covers it.
- Re-review after fix rounds A-D: 16 of 18 findings fixed, 2 partly; both closed in fix D.
- Defects caught in-run (recorded in the ledger): a first-job cut that split "the bank and subledger
  balances"; an off-topic note that marked 156 ordinary prompts weak on the page; a shape check that
  could never fire on a tail cut; a Codex run that hung for about 3 h 20 min waiting on stdin (caught by
  Ian; re-run with stdin closed).

## Suites at fde835b (each run by the lead)
fit-finder: catalogue "all catalogue checks pass"; prompts-strong "all prompts strong"; edge cards pass
(29); synth-score tests pass 14; eval B 45/60 75.0%; pagetest 98 checks, 0 failed. prompt-coach: pagetest
12 checks, 0 failed; unit 29 pass, 0 fail; customer check PASS 229; GRADE acc 0.856, flips 8. No new
5-word overlap with the real prompts (15 lines at base and at HEAD, identical). Dist sizes (LF, as
committed): fit-finder 91,503 bytes; prompt-coach 326,963 bytes.

## Sharing note for Ian
- **Links** (support.claude.com article 9547008, spot-checked 2026-10-19, read): "Everyone needs a Claude
  account." "People without one can't open a shared artifact, even with the link." On Team or Enterprise,
  "Anyone with the link" works only when an Owner has turned on External sharing. Whether the pages' code
  runs for viewers outside your organisation was not confirmed.
- **Offline**: `fit-finder/dist/fit-finder.html` and `prompt-coach/dist/prompt-coach.html` are single
  files that work with no network. Put both in one folder so Fit Finder's "improve it in the Prompt Coach"
  link opens the local Coach; a lone Fit Finder file falls back to the online Coach link.
- **Public hosting** (a website anyone can open) is your call; nothing was published outside claude.ai.
- Suggested framing for customers: a first guess at where Workiva AI fits, with the measured accuracy on
  the page; about 1 suggested feature in 3 was wrong on the hardest test set.
