# C3 weak-12 answer keys: confirm batch (2026-10-22)

Drafted on the top model in the done-when run (plan Task 2); never confirmed by Ian (grep of docs, research, README, answered-for-ian.jsonl and the done-when ledger: 0 records). PM first pass by studio-harness:pm in talk 055a0f72 (ruling 2026-10-19-pm-first-pass-taste-calls): keep 9, change 3. The lead checked the three reasons against the fixture rows. Made-up data only.

The improved prompt each case is run with is the coach's Strong stage, captured from the built page in the run (not shown here).

## FR-W1 (FR)

- Prompt: "what drove the jump in freight costs this quarter?"
- File: fr_w1_freight_q3.xlsx
- Intended answer: Short ranked explanation of the Q2 to Q3 FY26 freight increase from the attached file: total +95, air freight +58 (45 one-time expedite), ground +22 (no reason given in the file), fuel surcharge +14 (rate rise), warehousing flat.
- Wanted format (reported, not gating): Table: cost line, Q2, Q3, change, driver per the file's note; ranked by change; under 120 words of commentary
- Found items (a good answer states at least 75%):
  - Total freight +95 (628 to 723)
  - Air freight +58, 45 of it a one-time expedited charge
  - Ground freight +22 with no explanation in the file
  - Fuel surcharge +14 from the 9% to 12% rate rise on Aug 1
- Hard item: Ground freight +22 has no stated cause
- Must not claim: a cause for the ground freight rise (volume, new lanes, carrier rate) stated as fact; carrier or customer names; fuel prices or diesel index levels; any Q4 outlook
- pm-decision: keep

## FR-W2 (FR)

- Prompt: "Can you look at the attached accruals rollforward?"
- File: fr_w2_accruals_rollforward.xlsx
- Intended answer: A check that each line foots (opening + additions - releases - utilised = closing) and a short list of lines that fail or look unusual, with the arithmetic shown.
- Wanted format (reported, not gating): Table: account, expected closing, file closing, difference, issue; only lines with an issue; one sentence each
- Found items (a good answer states at least 75%):
  - Accrued audit fees: computed 90 vs stated 95, off by 5
  - Accrued utilities closes at -4 (debit balance in an accrual)
  - Accrued bonus: 30 released, no additions
- Hard item: Accrued audit fees footing error of 5
- Must not claim: a reason for the bonus true-up beyond the note; journal entry numbers; who approved any entry; prior-quarter balances
- pm-decision: change: move "Accrued bonus: 30 released, no additions" from found to optional. The line adds up (300+0-30-0=270) and its note says "Q3 true-up", so a correct check can skip it.

## FR-W3 (FR)

- Prompt: "write up the lease maturity disclosure for the 10-K"
- File: fr_w3_lease_maturity.xlsx
- Intended answer: A draft operating lease maturity table and one short lead-in sentence in 10-K style, using the file's figures, with the footing difference flagged instead of silently corrected.
- Wanted format (reported, not gating): Maturity table (year, amount) plus one or two sentences with the weighted-average term and rate; a note listing the footing issue
- Found items (a good answer states at least 75%):
  - Year rows sum to 6,100, total line shows 6,200
  - Present value 5,380 is consistent with the stated total, not with the year rows (5,280)
  - Weighted-average remaining term 6.2 years and rate 4.9% carried exactly
- Hard item: Total undiscounted payments do not foot (6,100 vs 6,200)
- Must not claim: finance lease amounts; lessor names or lease locations; short-term or variable lease cost; the company's ASC 842 policy elections
- pm-decision: keep

## FR-W4 (FR)

- Prompt: "Can you help with the revenue numbers for the board deck?"
- File: fr_w4_revenue_by_region.xlsx
- Intended answer: A short board-ready summary of Q3 FY26 revenue by region with YoY growth, flagging the wrong EMEA percentage and the missing APAC figure rather than filling them in.
- Wanted format (reported, not gating): Table: region, Q3 FY25, Q3 FY26, YoY % (recomputed), plus up to three bullets for the board; issues listed separately
- Found items (a good answer states at least 75%):
  - EMEA YoY should be 8.0%, not 12.0%
  - APAC Q3 FY26 missing
  - Total Q3 FY26 cannot be stated because APAC is missing
  - North America +10.0% and LATAM +9.5% check out
- Hard item: EMEA YoY misstated (8.0% vs 12.0%)
- Must not claim: an APAC Q3 FY26 value or a total; reasons for regional growth; full-year or guidance figures; currency effects
- pm-decision: keep

## GRC-W1 (GRC)

- Prompt: "anything wrong with our AP controls?"
- File: grc_w1_rcm_ap.xlsx
- Intended answer: A list of design gaps in the AP risk and control matrix: missing owner, undefined frequency on a key control, duplicate control, and the segregation-of-duties concern, each with the control ID.
- Wanted format (reported, not gating): Table: control ID, issue, why it matters (one sentence); no more than one row per issue
- Found items (a good answer states at least 75%):
  - AP-03 no owner
  - AP-05 key control with 'As needed' frequency
  - AP-02 and AP-04 duplicate descriptions
  - AP-06 approved by AP Clerk (SoD)
- Hard item: AP-06 segregation of duties concern
- Must not claim: test results or deficiencies not in the file; the name of any person; an approval limit other than USD 10,000; IT general control issues
- pm-decision: change: make "AP-02 and AP-04 duplicate descriptions" the hard item; AP-06 (payment run approved by the AP Clerk) stays a found item. The file never says who prepares the run, so the duties concern is a judgement.

## GRC-W2 (GRC)

- Prompt: "Please review the attached SoD conflicts report."
- File: grc_w2_sod_conflicts.xlsx
- Intended answer: The conflicts that remain unmitigated, with the terminated user called out first as an access removal issue.
- Wanted format (reported, not gating): Table: user ID, conflict rule, status, mitigating control (or 'none'), suggested next step; unmitigated rows only
- Found items (a good answer states at least 75%):
  - U1002 R-03 unmitigated
  - U1003 R-01 unmitigated
  - U1005 R-05 unmitigated
  - U1003 terminated with active conflicting roles
- Hard item: U1003 terminated user still holds roles
- Must not claim: last login dates; the system or ERP name; whether any mitigating control operated effectively; termination dates
- pm-decision: keep

## GRC-W3 (GRC)

- Prompt: "summarize the audit findings for the committee"
- File: grc_w3_ia_findings.docx
- Intended answer: A committee-ready summary: overall rating, findings by severity, each finding in one line with owner and due date, and the two issues called out (Finding 1 overdue, Finding 2 has no response or owner).
- Wanted format (reported, not gating): Five to seven bullets, under 150 words, for the audit committee
- Found items (a good answer states at least 75%):
  - Overall rating Needs improvement
  - 1 High, 1 Medium, 1 Low
  - Finding 1 overdue (due 31 Aug 2026, Open at 30 Sep 2026)
  - Finding 2 has no management response or owner
- Hard item: Finding 1 is overdue
- Must not claim: a management response for Finding 2; dollar amounts or losses from the bank detail changes; vendor names; prior audit ratings
- pm-decision: keep

## GRC-W4 (GRC)

- Prompt: "Could you go over the attached vendor onboarding policy?"
- File: grc_w4_vendor_policy.docx
- Intended answer: A list of gaps and inconsistencies in the policy with section references, ranked by risk.
- Wanted format (reported, not gating): Table: section, issue, risk (high/medium/low), suggested fix in one sentence
- Found items (a good answer states at least 75%):
  - Sections 2 and 4 conflict on the 25,000 / 50,000 thresholds
  - Section 5 has no review frequency
  - No verification for bank detail changes (section 6 allows changes by email)
- Hard item: Threshold conflict between sections 2 and 4
- Must not claim: the company's actual practice beyond the policy text; a regulation the policy is required to meet; past fraud or incidents; policy owner or effective date
- pm-decision: keep

## SUS-W1 (SUS)

- Prompt: "how did our emissions change last year"
- File: sus_w1_scope12_by_site.xlsx
- Intended answer: FY2024 to FY2025 change by scope from the attached file, the main drivers named from the notes, and the Warehouse D gap flagged instead of estimated.
- Wanted format (reported, not gating): Table: scope, FY2024, FY2025 (sites with data), change; then three bullets on drivers; gap note
- Found items (a good answer states at least 75%):
  - Plant B Scope 1 +1,260 (refrigerant leak per note)
  - Office C Scope 2 -315 (renewable tariff per note)
  - Warehouse D FY2025 missing
  - Scope 1 total like-for-like (excluding D) 2,470 to 3,670; Scope 2 total 4,310 to 3,865
- Hard item: Warehouse D FY2025 is missing, so totals are partial
- Must not claim: a FY2025 value for Warehouse D; Scope 3 figures; a reduction target or baseline year; the refrigerant type or leak quantity
- pm-decision: change: credit the Scope 1 totals on either basis when the basis is labelled: excluding Warehouse D 2,470 to 3,670, or FY2024 with D 2,770 against a partial FY2025 3,670. The wanted format ("sites with data") invites the second basis.

## SUS-W2 (SUS)

- Prompt: "check the attached water data"
- File: sus_w2_water_withdrawal.xlsx
- Intended answer: A data quality check of the withdrawal sheet: unit outlier, duplicate row and missing month, each with the site and month.
- Wanted format (reported, not gating): Table: site, month, issue, value as entered; no corrected values
- Found items (a good answer states at least 75%):
  - Site 2 2025-05 value 845,000 looks like a unit error
  - Site 2 2025-05 duplicated
  - Site 2 2025-06 missing
- Hard item: Site 2 June missing
- Must not claim: a corrected value for Site 2 May; water stress or basin information; discharge or consumption figures; site locations
- pm-decision: keep

## SUS-W3 (SUS)

- Prompt: "write something on supplier engagement for the report"
- File: sus_w3_supplier_engagement.docx
- Intended answer: A 150 to 200 word report paragraph on supplier engagement using only the stated figures, with the response rate corrected to 65% or flagged.
- Wanted format (reported, not gating): One or two paragraphs, 150 to 200 words, report tone; any figure issue listed after the text
- Found items (a good answer states at least 75%):
  - Response rate 78/120 = 65%, not 70%
  - 31 with targets, 12 SBTi-validated
  - Respondents cover 58% of purchased goods spend
- Hard item: Response rate misstated (65% vs 70%)
- Must not claim: supplier names; a Scope 3 emissions total; a future supplier engagement target; prior-year survey results
- pm-decision: keep

## SUS-W4 (SUS)

- Prompt: "Can you take a look at the attached fleet sheet?"
- File: sus_w4_fleet_energy.xlsx
- Intended answer: A data quality list for the fleet energy sheet before it goes into Scope 1 and 2: type/fuel mismatches and the duplicate vehicle.
- Wanted format (reported, not gating): Table: vehicle ID, issue, value as entered; no corrected values
- Found items (a good answer states at least 75%):
  - V-103 EV with diesel
  - V-105 ICE with electricity only
  - V-102 duplicated
- Hard item: V-105 ICE with no diesel
- Must not claim: emission factors or tCO2e totals; vehicle makes or models; corrected fuel values; reasons for the mismatches stated as fact
- pm-decision: keep

## Ruling (verbatim)

- Ian, 2026-10-22, card '[Ian] C3 keys' (asked 23:51:15Z; `~/.claude/answered-for-ian.jsonl` row `left: "ian-kind"`,
  so the hook left it and the answer is Ian's): "Approve with PM edits (Recommended)". The three changes above are
  applied to `research/live-tests/weak12/answer_key.json` (6 insertions, 5 deletions; `validate_done_when_sets.js`
  prints VALID). `drafts.json` keeps the original drafts; `answer_key.json` is the confirmed key.
- Inside the same card, PM proxy decided and not overturned: the improved prompt is the coach's Strong stage; "in the
  requested format" is judged against the prompt as sent (SCORING_RULES R6), and the key's wanted format is reported
  beside it, not gating.
