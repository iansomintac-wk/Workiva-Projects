# Weights reproducibility probes (2026-10-22)

Read-only probes for the talk "make the weights reproducible". All runs were on throwaway copies made with
`git archive <commit> . ':!data/done_when_strong.jsonl' ':!dist' ':!real-eval'` (the fresh set is never in a copy;
`unpack.sh` checks). Scripts hard-code the talk job's temp folder (`C:/Users/teasp/.claude/jobs/73f0cb40/tmp`);
change `T` to rerun. Node v26.5.0, Git Bash on Windows 11.

Copies: `dfe` = dfe2c65 (shipped the weights), `a46p` = 16a49e2 (a46f7bb's parent), `a46` = a46f7bb (adds rt:S:the-document),
`cuefree` = c4175c8 (branch prompt-coach-c1-cues before the Context cues), `head` = 17d8b6e (with the cues).

| Script | Question | Result (measured 2026-10-22) |
|---|---|---|
| probe23.sh + cmp.js | Is `--tune` deterministic? Does a glob-order retrain match? | Deterministic: run 1 == run 2 byte for byte on all 5 copies. No copy matches the shipped file in glob order (dfe: 281/281 entries differ, max 0.076; thr S .4 C .3) |
| perm.js | Does file order explain it? | At dfe, order fr,grc,sus,hard gives 0 differing entries; the other 23 orders differ in 276-283 entries |
| tune_order.sh | Thresholds in that order | dfe: S .625 C .575 O .3 P .3 E .45 = shipped; file byte-identical (sha256 88d8fd50...). a46 / cuefree: S .5 C .575; head: S .5 C .3 |
| probe4.sh | Shipped `sure`; rewrite_unit and eval per state | Shipped sure S .99 C .7 is reproduced by `--tune-sure` in glob order (fr,grc,hard,sus); README order gives C .715. rewrite_unit / eval: shipped weights at cuefree 77/0, 0.856; at head 76/1 (#13), 0.869; README-order retrain at cuefree 77/0, 0.856; at head 76/1 (#13), 0.866 |
| f13.sh | #13 with Context pinned off via the test file's own `forced()` helper | 77/0 in ship-head, ord-head and ship-cuefree |
| orders.sh | All 24 orders at cuefree: thr, sure, rewrite_unit, eval | rewrite_unit 77/0 in 6 of 24 orders (fr,grc,sus,hard among them). #76/#77 fail in 15; #1,#9,#11,#13,#14 fail in the 9 where C thr lands at .3; one order fails #31,#35,#36. eval 0.856-0.863 in all 24. Thresholds by order alone: S .45-.7, C .3-.65. Full rows: orders.txt |
| sortrows.sh | Breaker: train.js sorts rows by prompt (order-independent) | Two file orders give byte-identical weights and sure. Those weights: rewrite_unit 72/5 (#1,#9,#11,#13,#14), eval 0.859 |

The tests that flip (#1, #9, #11, #13, #14, #76, #77) each run a fixed prompt through the real trained detector and need a set
grade (Ian's case, "only Context missing", STRONG_EDITED graded strong), so a retrain can fail them with no rewrite change.

Root cause: the shipped weights were trained with the four files listed as fr, grc, sus, hard (the order the README text
names them), while every later retrain used the shell glob `data/train_*.jsonl`, which sorts hard before sus. Row order
drives the seeded shuffle, so every weight moves a little and the tuned thresholds move a lot. The shipped `sure`
cut-offs were later tuned in glob order. The hand-off's cause for #76/#77 (the rt:S:the-document cue) is disproved:
a README-order retrain that includes that cue passes #76/#77.

#13's row (test.jsonl, "user-control assessment") is gold S1 C1 O1 P1 E1. Without the cues the detector misses its
Context (prob .502 < .575); with the new `feeds-into` cue it finds it (prob .882), so the test's "only Context missing"
premise is gone. Real rows that fit the premise with the cues on: 1 (train_hard, "so the SOC 1 thats attached ...").
