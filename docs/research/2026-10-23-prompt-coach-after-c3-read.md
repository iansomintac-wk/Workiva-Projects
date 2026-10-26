# Prompt Coach after C3: why each Strong miss failed

Date: 2026-10-23. Source: reading only. Files read: weak12/answer_key.json, c3/improved.json, c3/answers/ (Q01,05,07,09,11,12,13,14,15,16,17,19,21,22,24,28,29,31,33,34,35,41,43,44,47), adjudicated_A.tsv, adjudicated_B.tsv, docs/evidence/2026-10-23-prompt-coach-c3-sandbox.md (sections 1-3).
Not read: Q03, Q23, Q25 (hits, contrast only). done_when_strong.jsonl not opened.
Labels: Measured = read in the named file just now. Assumed = my inference.

## Short verdict
11 improved misses, 5 distinct causes (4 if the two single-send generic-line causes are merged). The PM prediction does not hold.

## Q1. The 5 generic-line misses (one cause label per send)
All five have job=1, table=1, format=1 in adjudicated_B.tsv (Measured), so none failed on the job line steering.

| Send | Id/run | Found vs key | Miss | Cause label |
|---|---|---|---|---|
| Q41 | FR-W4 r1 | F2,F3 of 4; false=2 | Copied "EMEA was the fastest-growing region at 12.0% YoY" instead of 8.0%. | COPIED-PLANTED-ERROR |
| Q35 | FR-W4 r2 | F2,F3 of 4; false=0 | Lists "EMEA ... +12.0% YoY"; no check. APAC/total gaps found only. | COPIED-PLANTED-ERROR |
| Q11 | SUS-W3 r1 | F2,F3 of 3 | "78 suppliers responded, a response rate of 70%". Hard item (65%) missed. | COPIED-PLANTED-ERROR |
| Q17 | GRC-W1 r1 | all 4 found; false=1 | Found AP-02/04, AP-03, AP-05, AP-06 but also "Three key controls are automated or per-transaction ... AP-01, AP-03"; AP-03 is the no-owner invoice approval. | FALSE-ITEM-STRICT (one loose claim) |
| Q15 | GRC-W4 r2 | F1,F2 of 3; false=0 | Threshold overlap and "periodically" found; no bank-detail-change verification point. Hit Q31 has "No approval or verification step is described for vendor-initiated changes". | KEY-ITEM-OMITTED |

Measured: found/false from adjudicated_A.tsv rows Q41, Q35, Q11, Q17, Q15; quotes from the answer files. Assumed: that Q17's false item is the "automated" claim for AP-03; the tsv gives only false=1 and does not say which item.

## Q2. Does the key credit "key points" answers?
Yes in the sense that matters (Measured: job=1 in all ten generic-line sends and in all 5 misses). Key jobs vs what a key-points list naturally gives:
- Hits where the anomaly is a visible row oddity: SUS-W2 Q13 lists the duplicate May rows, the 845,000 outlier and "no June 2025 entry"; SUS-W4 Q19 lists V-103 EV with diesel, V-105 ICE with 2,100 kWh, V-102 twice; GRC-W4 Q31 lists the 25,000/50,000 overlap, "periodically", and bank-detail verification. A key-points list contains the keyed items by default.
- Hits that needed arithmetic: SUS-W3 Q33 ("78/120 = 65%. This appears to be an error") and FR-W2 Q21 ("120 + 60 - 0 - 90 = 90; expected 90, reported 95"). These recompute on their own.
- Misses on the same prompt line: FR-W4 Q41/Q35 and SUS-W3 Q11 copy the wrong percentage and do not recompute.
Nameable difference (Measured on the answers read, Assumed that it generalises): hits either show an item that is visible without calculation, or recompute spontaneously. 3 of the 5 misses did not recompute. The same split exists inside SUS-W3: Q33 hit, Q11 miss, same prompt (Measured: improved.json; adjudicated_A.tsv Q33 found 3, Q11 found 2). So it is run-to-run variation, not a wording difference. The generic line does not ask for a check, so a key whose hard item is a recompute is credited only when the answer happens to recompute.

## Q3. FR-W3 and FR-W4: key vs answers by hand
FR-W3 key: years sum to 6,100 but total shows 6,200 (hard); PV 5,380 matches the total, not 5,280; 6.2 years and 4.9% carried exactly.
- Derivable from the file: 1,240+1,180+950+720+410+1,600 = 6,100 (Assumed: my sum of the rows printed in Q43). So the key item is derivable from the file.
- Both versions miss it. Strong Q43 and Q09 print "Total undiscounted lease payments $6,200" with no flag. Original Q16 and Q12 do the same (both also write "as of December 31, 2024", a date Q43 says the source lacks).
- The Strong prompt asks: "Use only facts from the source, and mark anything I need to confirm" (improved.json). It asks for a confirm list, not a footing check, so the answers genuinely miss it. Found 1 of 3 per send (adjudicated_A.tsv Q43, Q09: "1 (F3)"), the 6.2 / 4.9% item.
FR-W4 key: EMEA should be 8.0% (443/410 = 8.05%, Assumed arithmetic), APAC missing, total not stateable, NA +10.0 / LATAM +9.5 check out.
- Derivable from the file. Every FR-W4 answer read (Q41, Q35, Q28, Q14) repeats "12.0%". Originals Q28 and Q14 find APAC and total missing; Q14 also shows a partial total "902 + 443 + 104 = 1,449M" (not adjudicated here).
- So the answers genuinely miss the hard item. The key is fair; no prompt asks for a check.
Both ids: found is the same in original and Strong (FR-W3 1+1 vs 1+1; FR-W4 2+2 vs 2+2, Measured in the evidence doc section 2). The Strong prompt neither helped nor hurt.

## Q4. Strong prompts naming or implying a second source or comparison (Measured, improved.json)
- GRC-W2: "list every number or statement that does not match. For each mismatch, give both locations and both values in a table. Do not decide which value is correct."
- SUS-W1: "Return a table: item, both values, change in amount and percent" (FY2024 and FY2025 are both in the one file; not a second source).
- FR-W1: "Q2 FY26, Q3 FY26, Change" columns (both quarters in the one file; not a second source).
- No other id (FR-W2, FR-W3, FR-W4, GRC-W1, GRC-W3, GRC-W4, SUS-W2, SUS-W3, SUS-W4) has such a phrase.
Only GRC-W2 sets up an impossible comparison. SUS-W1 and FR-W1 passed both runs (evidence doc section 2).

## Q5. GRC-W3 improved missed both runs, original hit: cause
"Do not add anything that is not in the source, and keep every figure exactly as written" produced near-verbatim copies of the file (Q47 opens "Internal Audit Report: Vendor Management ... Finding 1 - High"; Q05 is the same text trimmed), with no overdue flag and no "no owner" flag. Found F1,F2 only (adjudicated_A.tsv Q47, Q05). Original Q44 adds a table, "(not assigned)", and "its remediation due date of 31 August 2026 has already passed" (Q34 the same). Cause: the added "do not add anything" limit, with no verb asking for flags, suppressed the judgment the key wants. Cause is Assumed from two paired answers; the quotes are Measured.

## Q6. Cause count over the 11 improved misses
| Cause | Sends | Count |
|---|---|---|
| A. Planted error copied, not recomputed (prompt never asks for a check) | FR-W4 Q41, Q35; SUS-W3 Q11; FR-W3 Q43, Q09 | 5 |
| B. Two-source job sent with one file | GRC-W2 Q07, Q29 | 2 |
| C. "Do not add anything" gave a verbatim copy, no flags | GRC-W3 Q47, Q05 | 2 |
| D1. One loose/false item among 4 found | GRC-W1 Q17 | 1 |
| D2. One key item omitted | GRC-W4 Q15 | 1 |
Total 11. Distinct causes: 5 (4 if D1 and D2 are merged as "key-points list slip"). Miss counts Measured from the evidence doc section 2 (5 generic-line, plus FR-W3 x2, GRC-W2 x2, GRC-W3 x2); causes assigned by my reading.

Prediction check: "one fixable cause behind GRC-W2 plus at least 3 of the 5 generic-line misses; disproved if the misses split across 3+ causes". Cause B (GRC-W2) shares no send with the generic-line group. The generic-line group splits into A (3), D1 (1), D2 (1). The 11 misses split across 4 to 5 causes. The prediction does not hold. Cause A is the largest (5 of 11) and also appears in the originals (FR-W3 and FR-W4 missed in both versions), so it is not a Strong-prompt regression. Whether a coach line such as "check each stated percent and total against its parts" would fix A is untested (Assumed).
