# Prompt coach: done when (design)

Talk 2026-10-22, session "NEW - Prompt Coach done-when talk" (job af8d6241), from
`studio-harness/.claude/worktrees/pm-upgrade/docs/PROMPT_COACH_DONE_WHEN_TALK_PROMPT.txt`. Launched by
5996f223 after Ian chose "Start it now" at 06:13:55Z. Base: `origin/prompt-coach` at 902fbff.

## Rulings (verbatim)

- Ian, 2026-10-22, card '[Ian] Coach' (ruling 2026-10-22-prompt-coach-done-when): "Prompt Coach is done when
  the output provided for the improved prompts follow prompting best practices i.e if I were to use the provided
  improved prompt in Workiva AI that it would give me the intended output without mistakes or issues. Also if the
  user that provided the prompt already gave a strong prompt, that the prompt coach would be able to agree and let
  the user know that no improvements needed to their prompt. Right now I've been using Workiva AI to improve
  whatever prompt I provide, so the idea is that you would be able to do it as if AI did it."
- Ian, 2026-10-22 ~06:23Z, this talk, card '[Ian] Coach' (keep AI-free / hand off to Workiva AI / add an AI model /
  fill the blanks first): "Keep it AI-free (Recommended)". The card said: if rules can't reach the bars after one
  build round, come back to Ian with the numbers. Hook row `left: ian-kind`, so Ian answered.
- Ian, 2026-10-22 ~06:27Z, card '[Ian] Blanks': "Ready to paste + questions (Recommended)": the improved prompt has
  no blanks and is pasted as-is; a short "answer these to make it even better" list sits below it. `left: ian-kind`.
- Ian, 2026-10-22 ~06:28Z, card '[Ian] Done-when': "Approve these five (Recommended)" (C1-C5 below; we draft
  both prompt sets and he confirms them in one batch; a browser-driven session runs the sandbox tests).
  `left: ian-kind`.
- PM (studio-harness:pm, this talk), answers to talk questions 1-4, assumed and reversible: yardstick = Workiva's
  "Tips for getting useful responses from Workiva AI" page first, SCOPE second, vendor guides background; we
  draft the sets, Ian confirms; the reference is the 2026-10-18 live test. Its Q5 went to Ian (ruling 2 above).

## Evidence

Measured this talk (read-only probes at 902fbff, no files attached; scripts in the job's tmp folder, re-runnable
as `tests/done_when.js` once built):

| Fact | Test set (320) | Customer sim (121) |
|---|---|---|
| Strong-labeled prompts the coach grades strong and leaves untouched | 51 of 73 (70%) | 8 of 10 |
| Strong-labeled prompts it rewrites (graded better 19, weak 3) | 22 of 73 (30%) | 2 of 10 |
| Non-strong prompts it grades strong (would get "no changes needed") | 15 of 247 (6%) | 17 of 111 (15%) |
| Coach-not-strong prompts whose Strong output has a [blank] | 234 of 254 (92%), 2.13 each | 93 of 96, 2.39 each |
| Same for the Better output | 169 of 254 | 81 of 96 |

- No "no changes needed" message exists: grep of `web/template.html` and `engine/rewrite.js` for "no change",
  "already strong", "no improvement" finds nothing; a strong prompt still shows Better and Strong tabs.
- All 13 live-test originals (`research/live-tests/cases.json`) grade "better"; none is weak.

Read, not measured this talk:
- 2026-10-18 live test (`research/live-tests/results/2026-10-18-live-test-results.md`): originals did as well as
  or better than the coach's Strong prompts; Strong prompts missed the requested table 1-3 times in 24.
- 2026-10-19 tricky batch: the coach's unfilled "[number] bullets" blank was pasted into Workiva AI and left the
  format score undecidable.
- Workiva support pages (`research/2026-10-16-prompting-evidence.md`): unconfirmed; the fetcher got 403.

## Design

Three changes to the coach, and a test harness that measures C1-C5.

### 1. "No changes needed"

When the coach is sure a prompt is strong, "Your prompt" says so ("No changes needed: ..." with a one-line
reason naming what the prompt already has) and the Better and Strong tabs show the user's prompt unchanged, with
nothing to copy beyond the original. "Sure" is a confidence rule on the per-letter model (for example every letter
above a tuned probability and no stacked ask), tuned only on training data out of fold. The held-out sets
(test.jsonl, sim_customers.jsonl, the new strong-30) are never used to tune. A prompt that grades strong but not
surely keeps today's behaviour. Detector fixes for strong prompts graded better (22 of 73) go in as new training
prompts and retraining, as the README already describes.

### 2. Ready to paste, no blanks

Every `[bracketed placeholder]` in Better and Strong output is replaced by safe general wording that Workiva AI
can act on without a guess the user would object to ("the attached file", "a short table", "for the reader of this
report"), or dropped when no safe wording exists. File metadata still fills in specifics when a file is attached.
The SCOPE toggles keep working: each letter still has its piece.

### 3. Questions below the prompt

Under the improved prompt, a short list: "To make it even better, tell Workiva AI:" with one question per letter the
coach had to fill generically (Source: "Which file or section should it read?"; Context: "Who is it for?";
Parameters: "How long, and in what format?"; Evaluate: "What should it do if the data is missing?"). The list is
not part of the copied prompt. Wording of the page (look) is a taste call: PM first pass, Ian confirms in the
stage batch.

### 4. Yardstick

At the start of the run, a `--chrome` session opens Workiva's "Tips for getting useful responses from Workiva AI"
(https://support.workiva.com/hc/en-us/articles/19173586555412) in Ian's browser and saves the page text verbatim to
`prompt-coach/research/2026-10-22-workiva-tips.md`. Each rewrite rule in the README is mapped to a line of that page
or of SCOPE; a rule that conflicts with the page is listed for Ian, not changed silently.

### 5. Test sets (drafted by us, Ian confirms in one batch)

- strong-30 (`data/done_when_strong.jsonl`): 30 new strong prompts across FR, GRC, SUS and general, written fresh
  (not copied from training or test), labeled S/C/O/P/E = 1, not stacked. Drafted on the top model (labeled data).
- weak-12 (`research/live-tests/weak12/`): 12 new weak prompts (4 FR, 4 GRC, 4 SUS), each with a made-up fixture
  file, the output Ian would want, and an answer key (keyed findings, requested format, facts that must not be
  invented), built like the 2026-10-18 live test (`make_live_fixtures.js`, `SCORING_RULES.md`). Each must grade
  weak in the coach at the build commit.
- Ian's batch: one card listing the 42 prompts (and the 12 keys), PM first pass on each, Ian confirms or edits.
  Building parts 1-3 does not wait for it; C1 and C3 do.

## Success criteria (each with its prediction and the result that disproves it)

| # | Check | Today | Bar (predicted to pass) | Disproved by |
|---|---|---|---|---|
| C1 | strong-30: "No changes needed" shown and the prompt untouched | 70% on the test set's 73 | >= 27 of 30 | 26 or fewer |
| C2 | non-strong prompts in test.jsonl and sim_customers.jsonl: "No changes needed" shown | 6% and 15% | <= 5% on each set | more than 5% on either |
| C3 | weak-12 in the Workiva AI sandbox, improved prompt pasted as-is, 2 runs each (24), original prompt 2 runs each beside it | never run on weak prompts | >= 22 of 24 give the intended answer in the requested format; 0 of 24 invent a fact; keyed findings found >= the original's | 21 or fewer, any invented fact, or fewer findings than the original |
| C4 | [blanks] in Better or Strong output, test.jsonl + sim_customers.jsonl + weak-12, with and without files | 92% / 97% | 0 | any |
| C5 | every command in the README's test block | measured this talk at 902fbff: eval 85.6%, simulate 2 + 5 of 2,070 fails, customer_check PASS 229, rewrite_unit 67/67 | passes, apart from the expected test changes below | any other failure the base lacks |

C3 prediction is an estimate with no prior measurement on weak prompts. C3 scoring follows `SCORING_RULES.md`
(scorer plus a second-provider scorer, as on 2026-10-18); disagreements are reported, not hidden. Sandbox only:
https://sandbox.wdesk.com/, never app.wdesk.com. Made-up data only.

Note: `tests/eval.js` counts 55 of 79 strong labels graded strong, with its own label rule (stacked rows
included); the probe above counts 51 of 73 non-stacked. C1 uses the new strong-30, so neither is its baseline.

### Expected test changes (C4 versus today's blank rule)

Today's tests require blanks: `tests/customer_check.js` fails a run when only Context is missing and the Strong
output has other than exactly 1 blank (`blankOnlyC`), and caps blanks per prompt at
`tests/fixtures/rewrites/blank_baseline.json` (`blankMore`); `tests/rewrite_unit.test.js` has 6 blank or
placeholder lines. Ruling 3 replaces "adds blanks, not facts" with "adds safe general wording, not facts", so
these checks change to "0 blanks, and no new facts", in the same task as the rewrite change. Every other assertion in
these files is locked.

If a bar is missed after one build round and one two-strikes round, the run stops and brings Ian the numbers
(ruling 2). It does not add an AI model.

## Out of scope

- Any LLM or network call in the coach (ruling 2).
- The parked items: sure-letters, label fixes, bare-ask format (behind their own probes).
- The grade rule and SCOPE letters themselves.
- Production Workiva (app.wdesk.com); Google and Microsoft providers; more than 2 runs per prompt.

## Rules for the run

$0 (usage only). Workiva data stays in the workiva repo. Plain English to Ian. Feature branch from
`origin/prompt-coach`; merge and push under the merge rule (Ian 2026-10-21, Workiva repos clear), with the backup
branch, full suite and final review. The sandbox driver is launched with `--chrome`.
