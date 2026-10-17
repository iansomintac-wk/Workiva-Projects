# Evidence: Prompt Coach Better / Strong rewrites (2026-10-16 run)

Branch `worktree-prompt-coach-rewrites`, from `prompt-coach` at `73be350`. Code last changed at `a7d0501`
(Task 11); no code has changed since. Spec: `docs/superpowers/specs/2026-10-16-prompt-coach-rewrites-design.md`.
Plan: `docs/superpowers/plans/2026-10-16-prompt-coach-rewrites.md`.

Labels used in every row: **measured** = a command was run and its output read, command and commit named;
**read** = taken from a document, ledger line or another agent's report, source named. Figures labelled
measured were taken by the run lead's re-run at `a7d0501` (log `.ledger/2026-10-16-prompt-coach-rewrites/logs/t11r6_lead_rerun.txt`,
11:53Z on 2026-10-17) unless another command or commit is named.

## 1. What changed

Spec design rules (read: spec "Design" section, lines 103-134), all in `prompt-coach/engine/rewrite.js`:

1. Splitting: a `;` and anything inside `( )` or `[ ]` never ends a sentence.
2. Order: kept user sentences stay in their original order; generated Source and Context go after the user's
   opening Source sentences, a generated Objective goes where the vague sentence was, Parameters and Evaluate
   go last; every piece keeps its letter so the SCOPE toggles still work.
3. Direct voice (next to `tidyChat()`, applied to Better and Strong): sentence-initial please / kindly /
   can, could, would you / would you mind / I was wondering if you could / I'd like you to / I need you to
   become an imperative; "please" inside a sentence is dropped; "pls" and "plz" are removed, not expanded;
   "Additionally, ensure that if" becomes "If"; "word(s)" becomes "words"; other questions stay questions.
4. Typos: a list of about 20 common misspellings ("seperately", "recieve", "occured" ...) fixed, whole words only.
5. Context fits the task: extract says "This table feeds [what it is for, such as ...]"; other data intents say
   "This is for [what it feeds, such as ...]"; the wording registers as C under the current rules.
6. Blank rule: a prompt whose only missing letter is Context gets exactly one blank; no other prompt gets more
   blanks than the `73be350` baseline.
7. Tip: when the prompt says "attached" or "uploaded" and also "knowledge base", add a tip to use one and, in
   chat, type @ and pick each file.

Also changed (read: spec "Departures", lines 136-142, and plan):

- Better stage: a prompt already graded Better now shows its cleaned text as the Better stage text (engine
  side; see section 5 for why the page does not show it), falling back to the raw prompt if the cleaned text
  grades weak.
- Declared `tidy()` change: the `tidy()` mirror in `customer_check.js` also feeds `subjectLost` and applies the
  typo fixes (typo mirror).
- Mid-sentence "can / could you", "if possible" and "if you can" are also removed (read: spec line 141).
- General-area data intents say "This is for [what it feeds]." with no example (read: spec line 142).

Ian's decisions (read: spec "Ian's rulings", verbatim there):

- (A) the one-blank rule for only-Context-missing prompts: Ian answered **"Yes, always one (Recommended)"**
  (2026-10-17 plan stop).
- (B) the token cap: Ian answered **"Raise to 1.8M (Recommended)"**; later raised on his word to 2.2M
  (**"Raise to 2.2M (Recommended)"**, 2026-10-17 about 01:12, read: ledger progress.md line 27). The 2.6M and
  2.8M raises were made by program leads 13 and 14 under Ian's standing yes; they are not his words.

Plan departures (read: resume prompt "CARRY INTO THE TASK 12 EVIDENCE DOC"): Node `make_live_fixtures.js`
replaces the `.py`; `.gitattributes` keeps fixtures byte-exact; the README live-test line names the Node
command; build runs before filetest; filetest runs through the npx-cache alias; Task 7 fix 4 (`f95ab85`) came
after the Task 11 blocker, and its README rule line went into the Task 11 commit (lead call, to save a fix
round under the cap); the browser test was to be done by the Claude browser extension (not yet run, section 3).

## 2. Success table (read: copied from the spec Result column; each figure measured 2026-10-17 at `a7d0501`)

| Measure | Before | Predicted | Disproved if | Result | Disproved? |
|---|---|---|---|---|---|
| Better or Strong with filler, both sets | 66 Strong | 0 | any remain | 0 Better and 0 Strong in sim_customers and test (measured: lead filler probe, `filler_probe.js`, at `137a4d3`; engine unchanged to `a7d0501` for filler, and `customer_check` filler 0/609 at `a7d0501`) | No, held |
| Strong containing "?", both sets | 89 | at most 40 (assumed) | above 40 | 69 (24 + 45), measured by `customer_check.js` info line at `a7d0501` | Yes, disproved (above 40) |
| Strong blanks, median | 2 | at most 2 | above 2 | Median 2 in both sets (measured, same info line) | No, held |
| Only-Context-missing prompts with exactly 1 blank | not measured | all | any with 0 or 2+ | 7 of 7 (sim_customers) and 18 of 18 (test); blankOnlyC 0/609 in test (7 and 18 are the info line N; "all have exactly 1" is derived from N and blankOnlyC 0, not read from a k count) | No, held |
| Grade accuracy, test.jsonl | 85.6% | 85.6% | lower | acc=0.856 (measured: `node prompt-coach/tests/eval.js rulefeat prompt-coach/data/test.jsonl`) | No, held |

The "?" prediction was an assumption in the plan and is wrong: 89 became 69, not at most 40.

## 3. Must-stay-green

| Check | Required | Result | Label |
|---|---|---|---|
| Eval accuracy | at least 85.6% | acc=0.856, weak/strong flips 8 | measured: `node prompt-coach/tests/eval.js rulefeat prompt-coach/data/test.jsonl` at `a7d0501` |
| Unit tests | all pass | 18 pass, 0 fail | measured: lead re-run, section 1 of the log, at `a7d0501` |
| simulate, train only (2070 runs) | at most 8 strongNotStrong, at most 5 betterWeak | strongNotStrong 2, betterWeak 5, toggleNoEffect 0, dupSentence 0, badText 2, emptyFrag 0 | measured: `node prompt-coach/tests/simulate.js prompt-coach/data/train_*.jsonl` at `a7d0501` |
| simulate, train plus test (2679 runs) | at most 8 strongNotStrong, at most 5 betterWeak | strongNotStrong 4, betterWeak 5, toggleNoEffect 0, dupSentence 2, badText 4, emptyFrag 0 | measured: `node prompt-coach/tests/simulate.js prompt-coach/data/train_*.jsonl prompt-coach/data/test.jsonl` at `a7d0501` |
| customer_check, default | PASS | PASS 229 runs | measured: `node prompt-coach/tests/customer_check.js` at `a7d0501` |
| customer_check, `data/test.jsonl` | PASS | FAIL 609 runs: notStrong 2/609, filler, order, broken, blankMore, blankOnlyC, ianCase all 0/609. Still a FAIL, but better than the parent, which already failed with notStrong 4/609 (all from one only-Context prompt) | measured: `node prompt-coach/tests/customer_check.js prompt-coach/data/test.jsonl` at `a7d0501`; parent figure measured 2026-10-17 on `73be350` (read: spec line 162-164) |
| filetest | passes | 8 rows, errors [], exit 0 (via the npx-cache alias, VENDOR folder outside the repo) | measured: `node prompt-coach/tests/filetest.js` after the build, at `a7d0501` |
| Built page, rebuilt | build runs, dist unchanged on rebuild | build 314 KB (321,725 bytes); rebuild left dist unchanged | measured: `node prompt-coach/tests/build.js`, lead re-run at `a7d0501` |
| Built page in a browser, by the Claude browser extension | no console errors, no sideways scroll, desktop and phone | NOT YET CHECKED by the extension. The one-shot `claude -p --chrome` helper was denied by the Claude Code auto-mode classifier before it ran, so no Chrome action happened. Pending Ian, who asked for it (2026-10-17T08:02:54Z) | read: ledger t12_addendum.txt |
| Built page, Playwright extra (not the extension test) | same | Headless Chromium (Playwright 1.62.1, npx cache), page served at 127.0.0.1:8765; Ian's case typed in; console 0 errors, 0 warnings; desktop 1280x800 scrollWidth 1280 equals clientWidth 1280; phone 390x844 scrollWidth 390 equals clientWidth 390; Strong tab text equals `tests/fixtures/rewrites/ian_strong.txt` exactly inside the page's quote marks. Three controls each made a check fail (injected console.error gave 1 error; injected 2000px div gave 2008 wider than 390; one word changed in Strong gave not equal) | measured by the run lead (run 7) with `.ledger/.../browser_pw.js` and `browser_cmp.js`, 2026-10-17 12:01Z, at `a7d0501` |

Other measured probes (lead, at `f95ab85`, engine unchanged to `a7d0501`): ctx_probe 9 C turned ON; filler
0 / 0 (sim / test); median blanks 2 / 2; prompts with at least 3 blanks 55 (sim) and 143 (test), against
57 and 150 at `73be350`; blanks by letter in test C 342 against a baseline of 340 (ruling A explains the +2;
that explanation is assumed, the baseline file holds counts, not letters).

## 4. Ian's case

Approved target: spec "Target for Ian's case" (read: spec lines 80-96), stored as fixtures
`prompt-coach/tests/fixtures/rewrites/ian_strong.txt` and `ian_better.txt`, input `ian_case.txt`.

- Engine output against the approved target, compared with whitespace collapsed, for Strong and Better, with no
  file attached and with a PDF attached ("Utility invoices Sep 2018.pdf"): the `ianCase` line of
  `customer_check.js` reports 0 mismatches in 609 runs (measured: `node prompt-coach/tests/customer_check.js
  prompt-coach/data/test.jsonl` at `a7d0501`; the check loops over `files = []` and `files = [pdf]`,
  read: `customer_check.js` lines 85-87).
- The unit test also checks it (measured: 18 pass, 0 fail, at `a7d0501`).
- At `73be350` the same line showed ianCase 4 failures in 609 (measured at Task 2, `540118c`, log `logs/t2_cc_test.txt`).
- On the page, Strong shows the approved text exactly (measured, Playwright extra above). The Better text is
  not shown on the page; see section 5.

## 5. Not tested or open

- Claude browser extension test of the built page: not run (classifier denial, pending Ian); only the
  Playwright extra above.
- Open finding for Ian to decide (read: ledger progress.md, root cause 2026-10-17 12:00Z, measured by the lead):
  the page has no Better tab for Ian's case. `web/template.html` line 357 draws tabs only above the prompt's own
  grade; Ian's case grades Better, so the tabs are "Your prompt (BETTER)" and "Strong (suggested)". The engine's
  Better text (equal to `ian_better.txt`, checked by the unit test and by the `ianCase` line) is computed but
  never shown. Plan departure 2 (plan line 53, spec line 139: "shows its cleaned text in the Better tab")
  therefore does not reach the page. `template.html` is a locked file in the same plan (line 30), unchanged since
  `73be350`. Showing it needs a locked-file edit, which is Ian's ruling. Class: seam-untested (engine checked,
  page join not).
- Live test in Workiva AI not run (next session, Ian present).
- Workiva @-file limits unconfirmed.
- The artifact has not been republished; the published artifact is probably an older build (assumed).
- Codex review not available (it cannot start a shell on this PC), so `final-reviewer` alone.
- Known limits carried from earlier runs (read: resume prompt): CHANGE_ASK word list; the "Scope 2 inventory"
  example shows on Scope 1 and 3 prompts; "one per line" sits beside "Format it as [...]" in 20 of 24 list runs;
  "can you hear me" becomes "Hear me"; 2 assurance runs are not Strong on `test.jsonl`; SUS-5 "Identify and list
  [...]"; FR-3 generic Context; GRC-1 "If a frequency is missing you flag it."
- Known limits from Task 7 fix 4 (read: resume prompt): 4 of the 62 changed runs repeat the ask ("Summarize the key
  points of the content." after "a 100-word summary" three times; "Use numbered steps, each with the evidence to
  keep." on a checklist that already cites sections once); the 4 of 62 is a checker's reading of `cmp_listing.txt`,
  so it is read, not measured by the lead. 19 no-file runs get "Use only the selected content and nothing outside
  it."; "Do not correct any values; flag anything you are unsure of." appears on the badge-printing prompt. The
  final reviewer is asked whether the 4 repeated-ask texts are must-fix.
- Lesson (seam-untested): Task 7 to 10 check lines left out toggleNoEffect and emptyFrag, so a regression rode five
  commits; every check set since run 6 carries all seven simulate counters.

## 6. Measured vs read

Measured (a command was run and read; all at `a7d0501` unless stated): eval acc 0.856; unit tests 18/0; simulate
train-only 2070 and train plus test 2679 counters; customer_check default PASS 229; customer_check test FAIL 609
with notStrong 2 and every other counter 0; "?" 69 (24 + 45); median blanks 2/2; only-Context-missing runs 7 and
18; filetest 8 rows, errors []; build 314 KB, dist unchanged on rebuild; the Playwright extra figures (console,
widths, Strong text, three controls); ctx_probe, filler, blank probes at `f95ab85`; the parent's notStrong 4/609
(measured 2026-10-17 on `73be350`); ianCase 4 failures at Task 2.

Read (taken from a document, source named): spec rules, departures and the Ian rulings quotes (spec); the 2.2M
ruling (ledger progress.md line 27); the 2.6M and 2.8M raises (program leads 13 and 14, not Ian's words); the plan
departures and known limits (resume prompt); the 4 of 62 repeated-ask runs (a checker's reading of
`cmp_listing.txt`); the classifier denial and the open Better-tab finding (ledger `t12_addendum.txt` and
progress.md); the Result column of the success table (spec, which holds the figures measured above).

Assumed, not tested: the C +2 explanation by ruling (A); the published artifact being an older build; the 40 limit
for the "?" prediction (an assumption in the plan, now disproved).
