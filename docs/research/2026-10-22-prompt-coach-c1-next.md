# Prompt coach C1, after the reshape: research (a)-(d)

Talk session 7bc2a80f, 2026-10-22 from 23:09Z, branch `prompt-coach-c1-next` from `prompt-coach` @ ae60341 (the reshape
merge). Research only: no cue writing, no engine or rules.js edits. The fresh 30 (`data/done_when_strong.jsonl`) was not
opened; the probes read r1, test and sim only, and `tierprobe.js` throws if pointed at the fresh file.

"Measured" = run this session (`node prompt-coach/docs/research/c1-probes/tierprobe.js <abs prompt-coach dir>`, and
`tierprobe2.js` the same way, on this tree). "Read" = from a doc.
Control: the probe reproduces the measured fallback, r1 21/30 noChanges, test 8/247, sim 3/111 (evidence doc 2026-10-22).

## (a) C1 and C2 definitions, today's tiers (read from code)

- C1 (`tests/done_when.js:39-49`): a strong-30 row passes only if `noChanges === true` AND the Better and Strong stage text
  both equal the input. Bar 27 of 30. Spec words: "'No changes needed' shown and the prompt untouched".
- C2 (`done_when.js:52-58`): share of non-strong rows (any label 0, or stacked) in test and sim with `noChanges`. Bar <= 5%.
- `noChanges` (`engine/rewrite.js:633-634`): grade strong, not stacked, not off-topic, and every letter's probability at or
  above its sure cut-off.
- What the user sees (`web/template.html:344-346`, `rewrite.js:624-627`): off-topic line; else "No changes needed: it already
  names its source, who it is for, one clear job, its constraints, and a check on what is true." with the prompt unchanged;
  else the grade headline ("It names a source, context, one job, constraints, and a check." / "It has a source and a job; it
  is missing ..." / "The AI would have to guess ...") with rewritten Better and Strong versions.
- So a middle-tier landing is NOT a C1 pass under the current definition; it only moves the bar if Ian redefines C1.

## (b) Silent Context (zero Context hits), measured

| Set | strong rows, silent C | non-strong rows, silent C | silent C shown "No changes needed" |
|---|---|---|---|
| r1 (30, all strong, seen) | 5 of 30 | - | 0 |
| test (73 strong / 247 non) | 6 of 73 | 172 of 247 | 0 |
| sim (10 strong / 111 non) | 3 of 10 | 89 of 111 | 0 |

Silent Context is mostly a weak-prompt trait (261 of 358 non-strong rows vs 14 of 113 strong rows across the three sets).

## Middle tier, measured on fixed definitions (not tuned)

| Tier | r1 misses landing (of 9) | r1 if tier counted as C1 | non-strong landing test / sim | tier advice wrong* test / sim |
|---|---|---|---|---|
| T3: only Context below its sure cut-off | 5 | 26/30 (bar 27) | 2/247 / 15/111 | 1 / 8 (7.2% of sim) |
| T2: any one letter below its sure cut-off | 8 (5 C, 3 S) | 29/30 | 29/247 / 19/111 | 10 / 9 (8.1% of sim) |

*wrong = the row's labels miss a letter other than the one the tier names.
C2 if the tier counts as "ready": sim (3+15)/111 = 16.2% (T3), (3+19)/111 = 19.8% (T2). Counting only wrong tier advice:
sim (3+8)/111 = 9.9% (T3). Every reading is over the 5% bar on sim. The PM's prediction (>= 5 land, C2 <= 5%) holds on
the first half at exactly 5 and is disproved on the second. Picking between T2 and T3 by these numbers would be choosing on
sim, which the reshape spec ruled out.

## (c) A non-model source of strong prompts

- Ian's real prompts: the kit exists (`prompt-coach/real-eval/README.md`, `prompts-template.csv`, `tests/eval_real.js`);
  `real-eval/prompts.csv` is absent (measured: never filled).
- Public Workiva prompts: none found (research helper, Haiku, default effort, 22.5k tokens, 9 tool calls). One Workiva-staff
  article (3blmedia.com, "Unlocking Efficiency: How AI Shaped Workiva's Sustainability Management") mentions an internal
  "Workiva AI prompt library" but shows 0 prompts; workiva.com/products/workiva-ai returned 403; support and community pages
  were not indexed. Absence beyond the opened page is assumed (search results only).
- Sandbox (memory `workiva-sandbox`): measures outcomes (does a prompt get the intended answer), not a source of prompts.
  It is C3's tool; C3 has never run (read: `docs/evidence/2026-10-22-prompt-coach-done-when.md:13`), and needs a session
  launched with `--chrome` (memory).

## (d) Power of the C1 set, measured (exact binomial)

| Set, bar (90%) | P(pass) if true rate .80 | .85 | .90 | .93 | .95 |
|---|---|---|---|---|---|
| 30, >= 27 | .12 | .32 | .65 | .85 | .94 |
| 60, >= 54 | .03 | .18 | .61 | .88 | .97 |
| 100, >= 90 | .01 | .10 | .58 | .91 | .99 |

95% Wilson intervals: 21/30 = 52-83%; 27/30 = 74-97%; 90/100 = 83-95%. A bigger set makes the result more honest (a
truly 80% coach passes 1 time in 100 instead of 12), it does not make the bar easier. On r1 the coach is likely well under
90%, so a bigger set would most likely confirm the miss.

## PM (studio-harness:pm, 21.7k tokens, 1 tool call; proxy view, Ian decides)

Recommends recording C1 as missed at 21/30 (seen), keeping the fallback, and moving to C3 in the sandbox. Redefining C1 or
accepting a miss is Ian's (his '[Ian] C1 way' card raised the middle tier and a larger set). Assumed by the PM, untested:
C3 can run without a filled `prompts.csv` (it uses `research/live-tests/weak12/`, which exists: measured `ls`).

## Ruling (verbatim)

- Ian, 2026-10-22, card '[Ian] C1' (asked 23:16:57Z, `~/.claude/answered-for-ian.jsonl` row `left: "ian-kind"`, so the hook
  left it and the answer is Ian's; answered by 23:37Z): "Close C1, go to sandbox (Recommended)". Option text: record C1 as
  missed at 21/30 on the practice set, keep today's coach, the fresh 30 stays unread; the next talk specs the C3 sandbox test
  of the 12 weak prompts. No middle tier, no larger set, no coach change.
