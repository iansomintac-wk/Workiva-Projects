# Rewrite-reach two-strikes round (2026-10-17, Fit Finder v4.20)

Source: the round report `LED/round/report.md` (an Opus helper, 129,116 tokens, 32 tool uses; the lead
re-ran `bash run.sh`, exit 0, score.txt byte-identical, and scored the held-out). Figures here are
copied from that report; the suite and eval figures were re-measured on the committed tree (see the
commit). Repo at a313d12 (V2); live rule 383afd3. The pool in `fit-finder/tests/rewrite-pool.jsonl`
is the round's pool of 87 sentences minus one row that matches a real comment (86 rows).

Verdict: rule C. 0 of 42 pool false positives get gen-rewrite, and no set gains a wrong first card.

| rule | pool FP with card /42 | asks RW+card /45 | fresh right/23, wrong | G10 G12 G13 G17 | A | B | real | eval A/B | 139 changed | suite FAIL |
|---|---|---|---|---|---|---|---|---|---|---|
| 383afd3 (U) | 0 | 0 | 8, 6 | none x4 | 12/29 w0 | 13/30 w3 | 15/19 w2 | 52/45 | 0/0 | 18 (14 V2-only, 4 V1) |
| HEAD a313d12 (V2) | 19 | 32 | 12, 6 | right x4 | same | same | same | 52/45 | 0/0 | 0 |
| C | 0 | 6 | 10, 6 | none none right right | same | same | same | 52/45 | 0/0 | 13 (10 V2-only, 3 V1) |

Wrong first cards are the same on every rule: fresh G2, G14, G15, G22, G26, X1; B 67, 74, 91; real W1, S1.
(The "asks" column counts the 45 pool asks with the row "Write it in a more professional manner."
included; that row is not read by C, so the count of 6 is the same on the 44 kept.)

## Held-out (lead; `2026-10-17-rewrite-heldout.jsonl`, 40 blind sentences, labels by the model, scored once per rule)

| rule | asks: rewrite card /20 (first) | not-rewrite: rewrite card /20 |
|---|---|---|
| 383afd3 (U) | 3 (3) | 1 (H32 "tone at the top") |
| C | 7 (7) | 1 (same H32) |
| V2 | 13 (12) | 1 (same H32) |

V2 and U were scored before C existed; C once, after. The round helper never opened the file.

## Causes (each shown by an experiment)
1. "revise + writing noun" fires on 8 false positives and 8 asks; its nouns are also finance objects
   (FP / ask / 168-row corpus: draft 6/1/13, memo 4/3/7, note 5/1/6, letter 2/2/0, revis 18/14/1).
2. The tone alternatives: "noun ... more/less tone" 7 FPs, 16 asks; "more/less tone manner/way/register"
   4 and 2 (formal 12/2/0, professional 8/10/4 as in "professional fees").
3. The card words decide what is shown: all 19 FPs with the card hit an added card word (revis 8, formal 6,
   professional 3, concise 1, friendly 1). Swap: V2 engine + 383afd3 card = 0 FPs; 383afd3 engine + V2 card = 1.
4. Guards do not converge: dropping any single added alternative or card word leaves 12 or more FPs.
   Only reword, rephras, wording (0 FPs) and worded (1, read by nothing) sit on the asks side alone.

## Rule C, exact
`engine/fit.js` line 16: 383afd3's REWRITE line plus `word(?:ed|ing) (?:[\w'-]+ ){0,2}better` before `keep(?:ing)`.
gen-rewrite `match`: `rewrit\w*|shorten\w*|tighten\w*|plain english|board|executives?|audience|tone|too long|re-?word\w*|rephras\w*|worded|wording`

## Limits
- C was chosen on the pool it is scored on (in-sample); the held-out 40 is the out-of-sample check.
- C reaches fewer asks than V2 (held-out 7 vs 13; fresh 10 vs 12): "make this memo more concise", "more
  diplomatic", "revise this slide text" get no card.
- One pool label is the helper's: "Accrue more professional fees." = none.
