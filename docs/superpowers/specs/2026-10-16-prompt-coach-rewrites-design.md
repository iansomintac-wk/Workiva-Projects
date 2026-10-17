# Prompt Coach: Better / Strong rewrites read like an expert typed them

Date: 2026-10-16. Branch: `worktree-prompt-coach-rewrites` (from `prompt-coach` at `73be350`).
Source brief: Ian's session prompt `prompt-coach-improve-prompt.md` (Downloads, not in repo).

## Ian's rulings (verbatim)

- To "is this the target?" (the invoice rewrite below; A = keep words and order, drop filler, fix
  typo, one purpose blank; B = no blank, Context optional; C = restructure into bullets): **"A"**
- To "is option 2 (fix in place) the approach to spec?": **"option 2"**
- To "when should the live test happen?" (A = separate session after the fix): **"A, i also have
  access to Workiva AI in sandbox so you can run as many simulations as possible"**
- To the five-section design: **"yes"**
- To "please review the spec (including whether paragraph breaks should be in scope)": **"Yes"**
  (paragraph breaks stay out of scope)

## Problem

Ian tested a utility-invoice extraction prompt (sustainability). The Strong rewrite kept "please",
cut a sentence in half, reordered it, and added an audience blank. Reproduced with the engine
(`coach()` with the same detect/classify calls as `tests/customer_check.js`), with and without an
attached PDF; identical output both ways. Grade `better` (Context missing), intent `extract`,
area SUS.

| Fault (measured) | Where |
|---|---|
| A sentence is split at the `;` inside "(please use ... entry; for example ...)": one piece ends `entry;.`, the rest becomes a separate piece | `userSegments()`, sentence regex splits on `;` |
| Kept sentences are emitted grouped by SCOPE letter (all S, then C, O, P, E), not in the user's order; "Before finalizing..." jumped to the front, the orphan half went to the end | `coach()` > `build()`, `for (const k of K)` loop |
| Context missing adds "The audience is [...]" (the `ALT.C` fallback after "This is for [...]" did not register as C); useless for a table extraction | `contextFragment()`, `ALT.C` |
| "please" (twice), "Additionally, ensure that if", "seperately" kept as typed; `tidyChat()` even expands "pls" to "please" | `tidyChat()` |

Not reproduced: Ian's Better showed only the two Source sentences, and his Strong repeated three
sentences and contained "Additionally, please include the total spend associated with each
entry." The local build (`dist/`, 2026-10-15) is newer than `rewrite.js` (2026-10-14); the
published artifact is probably an older build or had a different input. Republishing is Ian's call.

## Probe on the real prompt sets (measured 2026-10-16)

Each prompt run alone and with a matching file, strong-graded originals skipped (shown as-is).

| | sim_customers | test.jsonl |
|---|---|---|
| Non-strong runs | 180 | 477 |
| Strong rewrite with filler (please, kindly, thanks, can/could/would you, I was wondering, if possible) | 32 | 34 |
| ...of which "can you" / "please" | 28 / 4 | 21 / 11 |
| Originals with filler | 32 | 39 |
| Strong rewrite containing "?" | 30 | 59 |
| Strong blanks: median, max | 2, 4 | 2, 4 |
| Strong with 3-4 blanks | 57 | 150 |
| Blanks by letter (S / C / O / P / E) | 83 / 148 / 29 / 87 / 16 | 167 / 340 / 130 / 237 / 25 |

Prediction before the run: filler in 15-25% (sim) and 10-20% (test) of Strong rewrites. Result
17.8% and 7.1%: sim right, test wrong (fewer originals carry filler than assumed). A hard cap of
2 blanks would need undoing the earlier "blanks instead of guesses when the task is unclear" rule
(commit `a46f7bb`), so the blank rule below is narrower.

## Evidence on wording (see `prompt-coach/research/2026-10-16-prompting-evidence.md`)

- "Can you X?" -> "X.": weak vendor support, not measured. Anthropic's best-practices page says
  "can you suggest some changes" sometimes gets suggestions rather than action (checked verbatim
  2026-10-16; the line sits in the tool-use section).
- "please": mixed evidence, no reliable effect either way; removing it is style, not a quality
  claim.
- Role lines: do not add (Zheng et al. abstract, checked verbatim: personas "do not improve model
  performance").
- Format line: well supported (Anthropic, Microsoft docs).
- Workiva support pages returned 403 to the fetcher; @-file limits are unconfirmed snippets until
  opened in the live session.

## Target for Ian's case (approved as "A")

Strong, compared with whitespace collapsed:

> I have attached the following utility bill invoices. This table feeds [what it is for, such as
> our Scope 2 inventory]. Input the applicable dates (use the first day of the month for each
> entry; for example, if the transaction was 9/18/2018, put 9/1/2018), location, emissions source,
> amount and amount unit in table format from each invoice. If there are multiple addresses on an
> invoice, break those out separately. The column headers should read as follows: Date, Location,
> Emissions Source, Amount, Amount Unit, Total Spend, Currency. Before finalizing your response,
> explicitly state how many documents/invoices you found in the knowledge base, then confirm that
> every single one is represented in the table. Do not stop at the first set of results — ensure
> all records are accounted for. For every row in the output table, include an inline citation
> indicating which invoice or document the data came from.

Better: the same text without the "This table feeds [...]" sentence. Tips include one that the
prompt says both "attached" and "knowledge base" (use one; type @ and pick each invoice).

## Design (approved "yes")

All changes in `prompt-coach/engine/rewrite.js` unless noted. Grading (`rules.js`, `model.js`,
weights) is not changed, except as allowed under Context wording below.

1. **Splitting.** A `;` and anything inside `( )` or `[ ]` never ends a sentence.
2. **Order.** Kept user sentences appear in their original order. Generated Source and Context
   pieces go right after the user's opening Source sentences (first, if there are none); a
   generated Objective goes where the replaced vague sentence was, else after Context; generated
   Parameters and Evaluate go at the end. Every piece keeps its letter, so the SCOPE toggles work
   as before.
3. **Direct voice** (a new function next to `tidyChat()`, applied to Better and Strong):
   - sentence-initial "please", "kindly", "can / could / would you (please)", "would you mind",
     "I was wondering if you could", "I'd like you to", "I need you to" become an imperative with
     a capital letter; that sentence's "?" becomes "." only when it was converted;
   - a "please" inside a sentence is removed ("(please use" -> "(use"); "pls" / "plz" are removed,
     not expanded;
   - sentence-initial "Additionally, / Also, (please) ensure / make sure (that) if" -> "If";
   - "word(s)" -> "words";
   - questions that are not "can/could/would you + verb" stay questions ("What drove the change in
     SG&A?").
4. **Typos.** A list of about 20 common misspellings ("seperately" -> "separately", "recieve",
   "occured", ...), whole words only, applied to the user's text in rewrites.
5. **Context fits the task.** For `extract`: "This table feeds [what it is for, such as <area
   example>]." For the other data intents (`variance`, `anomaly`, `consistency`, `compare`, `map`,
   `formula`): "This is for [what it feeds, such as <area example>]." Other intents keep the
   current destination/audience wording. Area examples follow the existing `audDomain` rule
   (FR: "the quarterly flux review"; GRC: "our SOX control testing"; SUS: "our Scope 2
   inventory"; GEN: "[what it is for]" with no example). The chosen
   wording must register as C with the current rules: probe candidate wordings first; a new
   Context cue in `rules.js` is allowed only if `eval.js rulefeat data/test.jsonl` stays at
   85.6% or better.
6. **Blank rule.** A prompt whose only missing letter is Context gets exactly one blank. No
   prompt gets more blanks than it does today.
7. **Tip.** When the prompt says "attached" (or "uploaded") and also "knowledge base", add a tip:
   use one; in chat, type @ and pick each file.

## Checks (fail first, then pass), in `prompt-coach/tests/customer_check.js`

- No filler in Better or Strong (the probe's list); today 32 (sim) and 34 (test) fail.
- Kept user sentences appear in Strong in their original relative order.
- No broken pieces in Strong: no ";." and balanced `( )` / `[ ]`.
- Blank rule (6): only-Context-missing prompts have exactly one blank; no prompt has more blanks
  than the 73be350 baseline (store per-prompt baseline counts in a fixture file).
- Ian's invoice case (input in a fixture) produces the target Strong and Better above.
- Declared change to an existing check: the "ask kept" comparison (`askLost`, 80% word overlap)
  applies the same filler removal to the user's sentence before comparing, as its `tidy()`
  already mirrors `tidyChat()`. Without this, "Can you please summarize X?" -> "Summarize X."
  would fail for the wrong reason. No other existing check or threshold changes.

## Must stay green

- `node prompt-coach/tests/eval.js rulefeat prompt-coach/data/test.jsonl` >= 85.6%.
- `node prompt-coach/tests/simulate.js prompt-coach/data/train_*.jsonl prompt-coach/data/test.jsonl`
  no worse than 8 strong-not-strong, 5 better-weak.
- `node prompt-coach/tests/customer_check.js` and `... data/test.jsonl` pass.
- `tests/filetest.js` passes (`VENDOR=` an npm dir with mammoth, xlsx, jszip, pdfjs-dist).
- Built page (`node prompt-coach/tests/build.js`) checked in a browser on desktop and phone: no
  console errors, no sideways scroll.
- `prompt-coach/README.md` updated in the same commit as the code it describes.

## Success criteria and predictions

| Measure | Now | Predicted | Disproved if |
|---|---|---|---|
| Better or Strong with filler (both sets) | 66 Strong | 0 | any remain |
| Strong containing "?" (both sets) | 89 | <= 40 (assumed) | > 40 |
| Strong blanks, median | 2 | <= 2 | > 2 |
| Only-Context-missing prompts with exactly 1 blank | not measured | all | any with 0 or 2+ |
| Grade accuracy, test.jsonl | 85.6% | 85.6% | lower |

## Scope

In: the rewrite changes above, checks, README, research note, synthetic files for the live test
(12 or more, financial reporting, GRC and sustainability, prepared offline in the run under
`prompt-coach/research/live-tests/fixtures/`).

Out (this round): paragraph breaks in rewrites (today all whitespace collapses; the golden check
compares collapsed text); restructuring into bullets (Ian chose A over C); changing what "strong"
means (Ian chose A over B); the tracked-changes view; republishing the page (Ian's call); the live
test itself (next session).

## Next session: the live test (separate, Ian present)

Sandbox only, Ian logs in, synthetic files only, no settings/sharing/deleting/publishing. For each
case, three prompts in fresh chats with the same file: the user's original, the 73be350 Strong,
the new Strong. 12 cases minimum, more as time allows (Ian: "as many simulations as possible").
Rubric per answer, 0/1 each: right source; did the one job; usable format; invented facts (1 =
none); asked for clarification (recorded, not scored as good or bad). Ian spot-checks; his call
breaks ties. Also open Workiva's support articles in the browser to confirm the @-file limits.
Results dated in `prompt-coach/research/live-tests/`.
