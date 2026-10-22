# Fit finder after park: evidence

DEVIATION: B2 control instead of red-on-parent, engine already cuts at 3

## Task 7: B gate and C re-score of the sealed sets

B-SHA: 3737a44
PRE-EXISTING: none
HOLDOUT-HASH: 6d722c0de4afd43f5a0de9a549baf93e334060010e74fb6fbcfef755e7290803 4fc2e86fd1060d67e8af9ea8914ef2e2601baf71cb037861194f9e9bd5b8feaf
BLIND-HASH: c559e3b7b3b8f9436f5d831b24bd328da2d79c14ccbb935d61706b5d1bc82225 27e74591087d4cabc34914fcf9beccf6bd02c92788e2a612e908017e369805bf
HOLDOUT-LINE: first card right: 26 of 42 that fit; wrong card 4 (N42,N48,N53,N91); no card where one fits 12 (N17,N18,N24,N52,N63,N77,N79,N88,N93,N99,N100,N102); card on a not-a-fit prompt 1 (N34); fit agreement 19 of 50; score 22; split: right feature first 16 of 32, rightly none 10 (N26,N45,N57,N58,N62,N76,N81,N84,N87,N96)
BLIND-LINE: first card right: 13 of 29 that fit; wrong card 7 (K8,K22,K24,K25,K31,K36,K40); no card where one fits 9 (K4,K5,K6,K15,K21,K23,K27,K32,K38); card on a not-a-fit prompt 4 (K3,K9,K12,K28); fit agreement 11 of 40; score 31; split: right feature first 5 of 17, rightly none 8 (K1,K10,K11,K13,K14,K30,K33,K39)

Notes:
- All eight Suite commands passed and `match-frozen --base 83d6e50` printed PASS. The baseline log lists no failures.
- Prediction (assumed): K near 10 on the holdout, reading K as the "rightly none" count. The holdout gave 10, so it matched. The blind set was predicted near 12 and gave 8, so it did not match.
- The Workiva AI sandbox copy that was already uploaded is unchanged.
- B2 control deviation: the control was used instead of a red-on-parent run, because the engine already cuts at 3 (see DEVIATION at the top).
