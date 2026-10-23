# Prompt Coach C3: sandbox test of the Strong prompts

Date: 2026-10-23. Spec: `docs/superpowers/specs/2026-10-22-prompt-coach-c3-sandbox-design.md`.
Run ledger: `.ledger/2026-10-22-prompt-coach-c3-sandbox/` (LEDGER below).

How numbers are tagged:
- **Measured**: copied as written from a run output file, named in brackets (all under LEDGER/logs/ unless a path is given).
- **Read**: taken from a ledger row or the spec, written by another session. Not re-run for this doc.

## 1. Result

| Bar | Pass mark | Result | Verdict |
|---|---|---|---|
| C3a: improved sends that are an intended answer in the requested format | >= 22 of 24 | 13 of 24 | FAIL |
| C3b: improved sends with an invented fact | 0 of 24 | 0 of 24 | PASS |
| C3c: keyed findings found, improved vs original, over 24 (id, run) pairs | improved >= original | 58 vs 63 | FAIL |

All three: Measured [tally.txt, adjudicated rows]. Coverage was 24 of 24 for each bar, 0 parked (Measured [tally.txt]).
0 retries and 0 technical failures over 48 sends (Read: LEDGER/progress.md, T8 row).

The prediction, quoted exactly from the spec:

> **Prediction (assumed, from the done-when spec, no prior measurement on weak prompts):** C3a >= 22 of 24 and C3b 0 of
> 24. Disproved by 21 or fewer, or by any invented fact. Risk measured above: 7 of 12 improved prompts swap the asked job
> for "list the key points", which a key built on issues may not credit; if 3 or more of those 14 sends fail, C3a fails.

Prediction: disproved (C3a 13 of 24)

Reported beside the bars, not gating (all Measured [tally.txt] unless noted):
- Original prompts: 13 of 24 intended; 4 of 24 with an invented fact.
- Each scorer alone gives the same three verdicts. S1 (Opus): 13 / 0 / 58 vs 63. S2 (Codex): 8 / 0 / 59 vs 65.
  S2 alone also reads originals as 14 of 24 intended.
- Per-send result agreed between the two scorers on 42 of 48 sends. Where both agree, improved is intended on 8 of 19.
- Per-field agreement (Measured [agreement.txt]):

| Pass | Field | Agree |
|---|---|---|
| A | found | 43 of 48 |
| A | false | 41 of 48 |
| A | extra | 14 of 48 |
| A | invented | 48 of 48 |
| A | clarify | 48 of 48 |
| A | source | 44 of 48 |
| B | table | 48 of 48 |
| B | job | 44 of 48 |
| B | format | 44 of 48 |

Pass A had 50 differing fields over 41 sends. Pass B had 8 differing fields over 8 sends (Measured [agreement.txt]).

## 2. Per id

Measured [tally.txt, "per id (adjudicated)"]. "no(x)" names the part that failed. "found" is run 1 + run 2 for
improved / original, with the key's item count in brackets. "hard" is the scorers' hard field per run, improved / original.

| id | improved r1, r2 | original r1, r2 | found imp / orig (key n) | hard imp / orig |
|---|---|---|---|---|
| FR-W1 | yes, yes | no(answer), no(answer) | 4+4 / 3+3 (4) | YY / NN |
| FR-W2 | yes, yes | yes, yes | 2+2 / 2+2 (2) | YY / YY |
| FR-W3 | no(answer), no(answer) | no(answer), no(answer) | 1+1 / 1+1 (3) | NN / NN |
| FR-W4 | no(answer), no(answer) | no(answer), no(answer) | 2+2 / 2+2 (4) | NN / NN |
| GRC-W1 | no(answer), yes | yes, yes | 4+4 / 4+3 (4) | YY / YY |
| GRC-W2 | no(answer+table+job+format), no(answer+table+job+format) | yes, yes | 0+0 / 4+4 (4) | NN / YY |
| GRC-W3 | no(answer), no(answer) | yes, yes | 2+2 / 3+3 (4) | NN / YY |
| GRC-W4 | yes, no(answer) | no(answer), no(answer) | 3+2 / 2+2 (3) | YY / YY |
| SUS-W1 | yes, yes | yes, yes | 3+3 / 3+3 (4) | YY / YY |
| SUS-W2 | yes, yes | yes, yes | 3+3 / 3+3 (3) | YY / YY |
| SUS-W3 | no(answer), yes | no(answer), no(answer) | 2+3 / 2+2 (3) | NY / NN |
| SUS-W4 | yes, yes | yes, no(answer) | 3+3 / 3+3 (3) | YY / YY |

The hard field derived from the rows matched the scorers on every send where found was agreed: 0 mismatches
(Measured [tally.txt]).

What stands out:
- **GRC-W2 Strong failed both runs (sends Q07 and Q29).** The Strong prompt reads: "For the attached SoD conflicts
  report: list every number or statement that does not match. For each mismatch, give both locations and both values
  in a table. Do not decide which value is correct." That is a two-source comparison job, sent with one file. Both
  answers said they had only one source and asked for a second one ("a second version of the file, a separate report,
  or a reference dataset" in Q07; "a written SoD summary, a dashboard screenshot, or a prior report" in Q29). Neither
  gave a table or any keyed finding: found 0+0 against 4+4 for the original "Please review the attached SoD conflicts
  report.", which was intended both runs (Measured [tally.txt]; answer text from `prompt-coach/research/live-tests/weak12/c3/answers/Q07.md` and `Q29.md`).
- **FR-W3 and FR-W4 missed in both versions, both runs.** Found was the same for both versions: FR-W3 1 of 3 key items
  per send, FR-W4 2 of 4 (Measured [tally.txt]). The Strong prompt did not move either.
- **FR-W1 is where improved beat original.** Improved was intended both runs, found 4+4; original missed both, found
  3+3 (Measured [tally.txt]).
- **GRC-W3 and GRC-W2 are where improved lost.** GRC-W3 improved missed both runs (found 2+2) while the original was
  intended both runs (found 3+3). GRC-W2 is above. In found, GRC-W2 (0 vs 8) and GRC-W3 (4 vs 6) lose 10
  together; FR-W1, GRC-W1, GRC-W4 and SUS-W3 gain 5 back, which gives the 58 vs 63 (counted from the table).
- Of the 11 improved misses, 5 are in the generic-job group (section 3) and 6 are FR-W3, GRC-W2 and GRC-W3
  (counted from the table).

A C3 miss is reported, not tuned (spec).

## 3. Risk check: the generic job line

The line "Identify and list the key points and where each one appears" is in 7 of 12 Strong prompts: FR-W2, FR-W4,
GRC-W1, GRC-W4, SUS-W2, SUS-W3, SUS-W4. That is 14 sends; 5 were not intended. The offline probe predicted 7 of 12
(Measured [tally.txt]; the 7 ids also checked by reading `c3/improved.json`).

The spec said C3a fails if 3 or more of those 14 sends fail. 5 failed. All 5 failed on the answer part (found share or
a false item), not on the job, table or format fields (counted from the per-id table).

## 4. Method (brief)

- **Fixtures and site.** 12 made-up fixtures (Example Co style, no customer or real company data), uploaded to Ian's
  own Workiva sandbox (sandbox.wdesk.com). Read: spec (c), ledger T5.
- **Sends.** 48 sends = 12 ids x {original, improved} x 2 runs, in a seeded order (seed 20261022, Read: ledger T6).
  `c3/run_order.tsv` holds qids only plus one hash line of the id map (sha256 of LEDGER/id_map.tsv); the id map
  stays in the ledger. Each send: new chat, file attached by `@` chip (1 source), prompt pasted and read back before
  sending.
- **Driver.** A browser driver session drove the user's Chrome through Claude in Chrome.
- **Strong prompts.** Captured from the built page (`dist/prompt-coach.html`) through the page's own clipboard call.
  0 of 12 differ from the offline probe (Measured [capture_vs_probe.txt]).
- **Scorer inputs.** Scorers got the real file text from `scripts/fixtext.py`, plus the count of ids whose page text
  differs from it: 12 of 12 (Measured [fixtext_check.txt]; page text has header lines, Read: ledger T9). The same file
  flags 4 ids whose fixture text lacks a literal key value (FR-W3, FR-W4, SUS-W1, SUS-W3); the ledger reads these as
  planted errors the key credits, by design (Read: ledger T9).
- **Blind scoring.** Pass A shows no prompt and is blind to the version; it scores found, false, extra, hard,
  invented, source, clarify. Pass B shows the prompt as sent, so it can reveal the version (disclosed); it scores
  table, job, format.
- **Two scorers, then adjudication.** Opus and Codex scored separately. Fresh Opus adjudicators ruled on every field
  where they differed: 50 in Pass A, 8 in Pass B (Measured [agreement.txt]). Pass A rulings went S1 26, S2 10,
  neither 14; Pass B rulings all S1 (Read: ledger T12).
- **Per-send rule (spec).** Intended = found share >= .75, false 0, invented 1, table 1, format 1, job 1.
- **Times.** Over 48 ok sends: start to saved median 36.5 s (min 30, max 104); send to finish median 9 s (min 6,
  max 31) (Measured [tally.txt]). The pilot (Q01, Q02) gave a 97 s median start to saved, a 291 s per-send timeout and a
  projected 77.6 min for 48 (Measured [pilot.txt]); the drive itself ran 02:14Z to 02:58Z (Read: ledger T8).

## 5. Key-format check

key format: not available (key has no format field)

The answer key has 0 `"format"` fields (Read: ledger T-plan row), so the spec's secondary match was not scored.

## 6. Disclosures

- **Q01 re-extracted.** Q01's first saved answer had its table flattened (cells run together). It was re-extracted
  from the open chat without a resend; the old copy is `logs/Q01.flat.md` (Read: ledger T7).
- **3 driver sessions.** Two of them hit their 200k context stop; each successor resumed at the next qid (Read: ledger T7, T8).
- **Clipboard.** The driver sessions ran Windows clipboard PowerShell calls with the sandbox disabled. This overwrote
  Ian's clipboard while the drive ran. (Read: lead 1's hand-off, `docs/PROMPT_COACH_C3_SANDBOX_RUN_RESUME_PROMPT.txt`.)
- **Task 9 check amended.** Answers name the attached file (Q01 line 1 shows `@grc_w1_rcm_ap.xlsx`), so a check for
  any id or file stem could not pass. The id check was narrowed to `FR-W[1-4]|GRC-W[1-4]|SUS-W[1-4]` -> 0. The file
  stem reveals the id, which the key entry already reveals; the version stays hidden (Read: ledger AMEND T9 S4).
- **False items both scorers missed.** Adjudicator A found a false item in Q08, an original send (an electricity
  figure of 20,200 that includes a duplicate), and one in Q41, an improved send (a subtotal sentence that leaves out
  North America). Both scorers had scored false 0 there; agreed fields are not adjudicated, so the rows stand
  (Read: LEDGER/logs/rulings_A.tsv). Counting them changes no bar: Q08 and Q41 were already not intended, C3a stays
  13 of 24 (FAIL), originals stay 13 of 24 (Measured [tally.txt, sensitivity lines]).
- **Closest calls.** Q37 job and Q07 format, both ruled for S1 by adjudicator B (Read: ledger T12).
- **A vacuous blind check, fixed.** The lead's first run of one blind check on adjudicator A's transcript counted 0
  tool calls because of an argument bug, so it could not fail. It was fixed and given a positive control (fires 6 on
  another transcript). Every scorer and adjudicator transcript then showed 0 forbidden reads (Read: ledger T10-T12).
- **Smaller items.** Q03 had a pre-send setup miss with nothing sent, redone as attempt 1. Q27's finish time is an upper
  bound. One "improved" word hit in the answers is Q48 prose ("Plant A improved modestly"), not a version leak
  (Read: ledger T8).

## 7. Usage

- Cap 1.2M tokens, raised to 1.8M by lead 1 under the standing +600k rule, then to 2.4M by Ian at 2026-10-23 03:25Z
  ("Raise to 2.4M (Recommended)") (Read: ledger CAP RAISE rows).
- Measured by lead 2 at Task 11: about 1.694M of 1.8M, a peak-context proxy, not billed tokens (Read: ledger STOP-D
  row).
- No money spent.
