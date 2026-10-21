# Contradicting training labels: probe (label-fix talk 2026-10-20)

Question (talk prompt `docs/PROMPT_COACH_LABEL_FIX_TALK_PROMPT.txt`): how often do near-identical training prompts
carry opposite S or O labels, and how many of the 46 out-of-fold false letters in the weak headline
(`research/2026-10-20-sure-letters-probe.tsv`, oof rows) sit in such a group?

Probe: `research/2026-10-20-label-contradiction-probe.js` (run time 1.3 s). Read-only; reads `data/train_*.jsonl`
and the sure-letters TSV only; no held-out or sealed file, no `data/test.jsonl`. Outputs:
`research/2026-10-20-label-contradiction-groups.tsv` (strict groups that disagree),
`research/2026-10-20-label-contradiction-false-letters.tsv` (the 46 with their twin),
`research/2026-10-20-label-contradiction-bare-this.tsv` (bare "this/these/it" rows).

Bar stated before measuring: fewer than 10 of the 46 false letters in a contradicting group (confirmed by eye)
means this is not worth a run. Guess before measuring (assumed): 15-25 automatic, 8-14 by eye.

Method. Words lowercased; leading filler ("can you", "pls", "help me") dropped; verb = first word left.
Strict group = verb + first content word after it. Loose twin of a row on letter k = another row with the same
verb, content-word Jaccard >= 1/3, word counts within x2, and the opposite label on k. Bare-this row = has
"this/these/it" and no source word anywhere (list in the script).

## Counts (measured 2026-10-20 by this probe)

| | count |
|---|---|
| Training rows | 1,080 |
| Strict groups of 2+ | 132 |
| of them disagreeing on S / O / either | 34 / 26 / 49 (181 rows) |
| Loose contradicting pairs, S / O | 23 / 32 |
| Out-of-fold false letters (S / O) | 46 (14 / 32), matches the sure-letters probe |
| with a strict-group contradiction | 4 |
| with a loose twin | 12 |
| with either (automatic upper bound) | 14 |
| **confirmed by eye (Opus, this session)** | **9 firm, 1 borderline** |
| Bare "this/these/it" rows, S=1 / S=0 | 13 / 17 |
| of the 13 S=1, only a bare demonstrative (break the owner's rule) | 6, all among the 46 |

## The 46 by eye

- **Bare "this" labelled as a source (6, S):** `grc:64` "chekc this pls", `grc:96` "make this better" (twin `fr:96`
  "make it better" S=0), `grc:184` "What do I need to ask about this?", `grc:195` "please map these" (twin `fr:188`
  "map these to the taxonomy" S=0), `grc:204` "map this to the framework", `grc:244` "is this a material
  weakness?". The owner's rule (README, simulated-customer review): a bare "this" does not name a source; "this
  para", "this journal entry", "the doc" do. The detector is right on all six; the label is wrong. The other 7
  S=1 bare-this rows name a thing ("this trial balance", "this matrix", "the calc workbook") and are right.
- **Same ask, opposite O (3):** `fr:171` "what should the auditors ask" and `fr:176` "what wuld you ask the CFO"
  (O=1) vs `grc:171` "what should i ask IT" (O=0); no topic in any of them, so by LABELING.md ("check this (check
  for WHAT?)" = 0) the two O=1 rows are wrong. `sus:189` "Find duplicates" (O=1) vs `grc:49` "Find outliers."
  (O=0): same shape, but LABELING.md does not settle which side is right ("list missing evidence" = 1 suggests
  both are 1, which would not fix this false letter and would add one on `grc:49`).
- **Borderline (1):** `fr:188` "map these to the taxonomy" (O=1) vs `grc:188` "map to COSO" (O=0).
- **Label right, detector wrong (36):** the automatic twins for `fr:152`, `grc:151`, `sus:149` ("what can you do")
  and `fr:77` ("write up the attached.") are not real contradictions. By eye the largest kind is a short explain
  or how-to question the rules call a concrete ask ("what is XBRL", "how do I do a vlookup", "xlookup vs index
  match?", "What does ISSB require?"), then clear rewrite asks with a format ("more concise — two sentences").
  Not counted by a probe (assumed).

20 strict groups read by eye: nearly every disagreement is a real difference under the rules (a named source vs
"our controls"; a finish line vs "do the needful"). Real contradiction: `what|should` (above). Borderline:
`map|controls` ("Map controls to frameworks" O=0 vs "Map our controls to NIST." O=1).

## What a relabel would move (out of fold, before retraining)

Headline lines that turn right because the label moves to the detector's side, read from the sure-letters TSV:
the six bare-this rows fix 4 lines (`grc:184` stays silent on a missing O, `grc:244` keeps a false O); the two
"what should" rows fix 2. So 105 -> 101 (bare-this only) or 105 -> 99 (both), before any retrain effect.

## Verdict

9 firm of 46, under the bar of 10 set before measuring. Contradicting labels explain a small share of the false
letters; most of them (36) are the detector missing asks the labels get right.

## Limits

- The grouping is a word heuristic; the 14 automatic matches were all read, the other 32 were read for label
  errors without a twin, not searched for twins by a second method.
- "these" in `grc:195` is read as a bare demonstrative by analogy with the owner's "this" rule (assumed).
- Relabelling moves the measurement (the 6 lines stop counting as wrong) as well as the detector; the retrain
  effect on new prompts is not measured here.
