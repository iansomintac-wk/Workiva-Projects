# Bare "analyze/review X": how often does Strong get a wrong task format? (probe, 2026-10-20)

Talk: `docs/PROMPT_COACH_ANALYZE_FORMAT_TALK_PROMPT.txt`. Read-only probe, non-held-out data only.
Script: `research/2026-10-20-bare-analyze-format-probe.js` (16 s). Rows: `research/2026-10-20-bare-analyze-format-probe.tsv`.

## How the coach picks a format (read in code)

`engine/classify.js` `pick()`: the trained classifier names a task. When it is at least 50% sure (and not
"other"), Strong is built from that task's template (format included). Otherwise Strong gets blanks:
"Identify and list [what you want back ...]" and "Format it as [a table, bullets, or a short paragraph]".
So a wrong format needs a sure classifier on the wrong task.

## Bare ask (definition used)

The coach's own vague-verb list (look at, check, review, help with, ...), no task word its patterns know
(`intentOf` strict returns nothing), and in the training rows the label says no objective (O = 0).

## Counts (measured 2026-10-20)

| | Prompts |
|---|---|
| Training rows (`data/train_*.jsonl`) | 1,080 |
| Vague verb and no objective | 92 |
| Bare (also no known task word) | 67 (51 labelled "other", 16 with a task) |
| Shipped classifier: guesses a task | 16, all match the label |
| Shipped classifier: blank instead | 51 |
| 5-fold, each row scored by a model that never saw it: guesses a task | 1, wrong (train_hard:200, labelled "other", guessed consistency) |
| 5-fold: blank instead | 66 |
| Live-test cases (`research/live-tests/cases.json`) | 13; 1 passes the filter (FR-2), but it states its ask ("list any that dont match"), so 0 truly bare |

Wrong format: 1 of 67 on the fair (out-of-fold) test, 0 of 67 in-sample, 0 in the live tests.

## Limits

- The shipped classifier was trained on these rows, so its 16 "right" guesses are in-sample and optimistic.
  The 5-fold model is trained on 80% of the rows, so it is a little less sure than the shipped one.
- "Right" means "matches the labeller's pick". For "check this sheet" (labelled consistency) the labeller's pick
  is itself a guess; this probe cannot say what a real user meant.
- No real customer prompts were probed (held-out and sealed files not opened; `data/test.jsonl` not read).

## Research (Ian asked 2026-10-20: "Is there any research that would inform on how we can address that open item?")

Own notes: commit `a46f7bb` (2026-10-14) set "blanks instead of guesses when the task is unclear"; it cites no
outside study. `2026-10-16-prompting-evidence.md` has nothing on ambiguous asks.

Outside (research helper, Haiku, web; 2 sources spot-checked by the lead, the rest only read):
- No study compares guess / blank / clarifying question / pick-from-options head to head for a prompt-rewriting tool.
- CLAM (Kuhn, Gal, Farquhar, arXiv 2212.07769): asking only when the question is ambiguous "significantly improves"
  accuracy on mixed ambiguous and clear questions. Abstract gives no figures. [spot-checked]
- Qulac (Aliannejadi et al., SIGIR 2019, arXiv 1907.06554): one good clarifying question, offline with an oracle,
  "over 170%" better P@1. Not real users. [spot-checked]
- Bad clarifying questions hurt; clarify-first models over-ask, guess-first models drift (arXiv 2402.01934,
  NeurIPS 2026 poster). Multiple-choice cues preferred, 7 of 8 users, in a sketch-to-animation study (2601.20622).
  [read, not checked]
- Untested for us: whether a fill-in blank gets filled more often than a multiple-choice blank.

Reading: the evidence favours asking only when the task is truly unclear, ideally with 2-3 choices. The coach already
does that: unsure gets a blank, and the blank already names example choices. Only our own test (sandbox or users)
would settle blank vs choices.

## Side notes (not the question; not acted on)

- Two guessed Strongs read badly: train_fr:45 "help me find problems" -> "For find problems: list any values in
  the problems ..."; train_sus:184 "help w/ supplier data request email" -> "For w/ supplier data req...".
- The pattern list misses "tie to" (FR-2); the classifier still gets consistency there.
