# Prompt coach: the weak-prompt reason line quotes the user's ask (design)

Talk 2026-10-20, session "NEW - Prompt Coach quote line talk" (job 04bbd630), from
`docs/PROMPT_COACH_REASON_LINE_QUOTE_TALK_PROMPT.txt`. Ian was away; questions went to the PM proxy.

## Rulings (verbatim)

- Ian, 2026-10-20, reason-line talk card: "Quote the prompt (Recommended)" (recorded in
  `.ledger/2026-10-20-prompt-coach-reason-line/rulings.md`).
- PM proxy for Ian, this talk, 2026-10-20T05:40Z, on the card (A ask and source / B ask only (Recommended) /
  C park / D name only the letters the detector is sure of): "B, proxy decided: spec + run prompt + budget.json,
  run via town-launch with the slip ledger, merge into prompt-coach and push under the merge rule; D to Ian's
  morning list". Proxy decided; Ian may overturn. Recorded in the run ledger's rulings.md.

## Evidence

Measured this session (2026-10-20), one probe pass: `prompt-coach/research/2026-10-20-quote-line-probe.md`
(script `.js`, rows `.tsv`). Out of fold means the detector retrained by `tests/train.js` on 4 of 5 folds;
checked to be real (29 rows change letters; grade accuracy 0.902 out of fold, 0.905 in-sample).

| Out of fold, 432 weak prompts | count |
|---|---|
| Ask quote found (sentence-opening vague verb, detector sure the ask is missing, p < 0.2) | 55 |
| ... wrong by label (the label says the prompt has an ask) | 0 |
| ... wrong words by eye (all 55 read) | 4 (7%), all an "Evaluate:" field label; the colon skip (rule step 2) removes exactly these 4 and changes no other quote (checked) |
| Source quotes, wrong words by eye (17 in a 20-line sample) | 12 (71%) |
| Weak prompts with no reliable span (ask only) | 377 |
| Stacked weak prompts / splittable / of those missing a third ask | 41 / 13 / 6 |

Read, not measured here: a duplicate talk session (job 92f303c6, stopped in favor of this one) ran a looser ask
rule (any sentence with a vague verb, up to 10 words) and reported 172 quotes with 22 wrong by label (12.8%), over
the 10% drop line. That is why the rule below keeps to a sentence-opening verb.

Read, not re-measured: the reason-line probe (`research/2026-10-20-reason-line-probe.md`) found the line wrong
for 147 of 430 weak prompts in-sample. The ask quote fires only where the detector already says the ask is
missing, so it fixes none of those 147; they are detector errors on which letter is missing.

Published work (read in the reason-line talk, not re-read): high-information feedback helps in tutoring
(Wisniewski, Zierer & Hattie 2020, d = 0.99, k = 42). Counter-evidence: Hoang & Storch (2024), EFL learners took up
generic feedback more than specific (search snippet only, not confirmed); Chen et al. (2024), a prompt coach got
users to add detail with no better user experience (whether its feedback was generic or specific is not stated).
Nothing found on a prompt-writing coach quoting the user's own words, so the benefit here is assumed.

## Design

Only the reason line under the Weak stage, only when the user's own prompt grades weak. Better, Strong, and the
example Weak stage shown for a prompt that grades better or strong are unchanged.

### The span rule (exact)

1. The coach has the detector's probability for the ask (O). If it is missing (a caller that passes no
   probability) or 0.2 or higher, no quote.
2. Take the first match of the coach's own `VAGUE_VERB` list in the prompt as typed that opens a sentence: at the
   start, or after `. ! ?`, a line break or `:`, with only lead words between (hey, hi, ok, so, just, quick(ly),
   please, pls, plz, can/could you/u, would you, I need (you) to, I want (you) to, need (you) to, want (you) to,
   I'd like (you) to). Skip a match followed directly by `:` (a field label such as "Evaluate:").
3. The span runs from the verb to the first `. ; ? !` or line break; trailing spaces, commas, colons and dashes
   are trimmed. Over 8 words: the first 8, then `...`.
4. No match: no quote.

### The line, by case

| Case | Line |
|---|---|
| Span found | `The AI has to guess <core>. The coach read your ask as "<span>": that says what to look at, not what a finished answer looks like. It is also missing <rest>.` The quote replaces today's `A verb like "<verb>" does not say what a finished answer looks like.` sentence; `<core>` and `<rest>` are as today. |
| No span | Today's line, byte for byte. |
| Several asks | No change from the two rows above; the existing stacked note ("You are asking for several things at once...") stays the only place that says so. Why: a split rule reaches 13 of 41 stacked prompts and misses a third ask in 6 of those 13. |
| Source missing | Never quoted; today's wording. Why: 12 of 17 source quotes were the wrong words. |

Example: "help with the 10-K" -> `The AI has to guess what to read and the one thing you want back. The coach read
your ask as "help with the 10-K": that says what to look at, not what a finished answer looks like. It is also
missing who it is for, a format or scope and a rule about invented facts.` Checked 2026-10-20 with the shipped
detector: this prompt grades weak with an ask probability of 0.000, and today's line for it is the same with
`A verb like "help with" does not say what a finished answer looks like.` in the middle.

### No-go

- Never quote a span when the detector is not sure the ask is missing (step 1).
- Never quote for the source.
- The wording says what the coach read ("The coach read your ask as"), never that it is sure ("Your ask is").
- Never change which letters the line names; that is the detector's job and out of scope here.

## Success criteria (each with the result that disproves it)

1. Unit tests in `tests/rewrite_unit.test.js`, each failing on the parent commit: "help with the 10-K" gives the
   quoted line; a template prompt with "Evaluate: carefully" gives no quote; the same prompt with the ask
   probability at 0.2 gives no quote; a prompt with no sentence-opening vague verb gives today's line byte for
   byte; a prompt that grades better is unchanged.
2. Drop check (the check that proves it wrong). On the run branch, rerun the probe out of fold with the shipped
   line and read every quoted line by eye. Prediction: about 51 quoted lines (55 less the 4 "Evaluate:"), 0 wrong
   by label, at most 2 wrong words by eye. Stated before measuring: if more than 10% of quoted lines quote the
   wrong words (by label or by eye), the change is dropped (reverted) and the item parked.
3. Only the quoted lines change: dump every train row's three stage prompts and verdicts before and after; the
   changed rows are exactly the rows with a quote, and only their Weak verdict changes.
4. Must stay green: the suite values the plan writer measures on the parent commit (unit tests, `simulate.js`,
   `customer_check.js`, `eval.js`) are unchanged.
5. `dist/prompt-coach.html` rebuilt; README "Still open" and any byte count it states updated in the same commit.

## Out of scope

Quoting the source; quoting stacked asks in the line; naming only the letters the detector is sure of (option D
on the card, its own talk if wanted); any detector or classifier retraining; held-out, sealed or `data/test.jsonl`
reads; the live sandbox (0 of 13 live prompts grade weak, so it would show nothing).
