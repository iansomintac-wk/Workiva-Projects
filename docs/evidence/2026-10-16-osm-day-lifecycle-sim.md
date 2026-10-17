# Day and lifecycle simulation: evidence

Date: 2026-10-17. Branch `runway-day-sim`. Trackers 1.0 and 1.1 were not edited (C8).

**Labels.** measured = run by me in this task, numbers from the files named. read = taken from a ledger or resume-prompt row written earlier, not re-run now. pending = a later fix round may change it.

Everything below that says "measured" comes from one run of `node tools/sim/osm-day/verify.mjs` (started 03:37, ended about 04:02 local time, about 25 minutes). It ran the whole sim twice (both versions, both parts, with breaks), then the field test on both versions. Raw output: `sim-runs/verify/` (run1, run2, ft) and `sim-runs/verify.txt`. These folders are git-ignored. Per-version wall time: 1.0 about 6 minutes, 1.1 about 7 minutes per full run (`times.txt` in run1 and run2).

## What Ian needs to know first

### Findings in the tracker (each is a step that FAILED on the screen)

The same five failed on 1.0 and on 1.1. All are measured, run 1 and run 2 agreed (except where marked). None was fixed; a FAIL is a finding, not a repair.

| Step | Versions | What the screen showed | Day in the sim |
|---|---|---|---|
| D2 call prep | 1.0, 1.1 | The prep panel for a call does not show the previous call's transcript line (`SIM-TRANSCRIPT-LINE` absent from the panel). | Wed 2026-10-21 |
| D3 open items | 1.0, 1.1 | The panel shows the open checklist item and the last-meeting question, but not the "you owe" or "they owe" commitments (`SIM-OWE you owe`, `SIM-OWE they owe` absent). The meeting agenda is a listed GAP. | Wed 2026-10-21 |
| D8 risk case actioned | 1.0, 1.1 | After a risk case is confirmed, it stays in the open risk list ("unreviewed -> confirmed (still listed)"; `lastActioned` is set to 2026-10-21 but the case does not leave). | Wed 2026-10-21 |
| L8 same, in the customer's life | 1.0, 1.1 | The 12-02 note raised a Product signal (0 to 1) and made a risk case; confirming it set `lastActioned 2026-12-02`, but the case card is still on the open list. Same behaviour as D8. | 2026-12-02 |
| L11 graduation | 1.0, 1.1 | With no CSAT contact (read back `done:false, contactName:""`) the graduation confirm box has its OK button **enabled**; there is no refusal. With a contact added it graduates and queues 1 "Success Plan objective" item. So nothing stops graduation without the CSAT contact. | 2027-01-25 (T) |

L12 is a GAP, not a fail: nothing in the tracker tracks a CSAT survey being sent, answered or followed up.

**On 1.1 there is a sixth FAIL, D4 ("transcript.text missing"). That is the sim's defect, not a tracker finding.** 1.1 keeps call transcripts by reference (read: `submitLoggedActivity` 1.1:16690, `stageTranscript` 1.1:3088, `tsGet` 1.1:3012), and the D4 check only looks for an inline `transcript.text`. The activity itself saved correctly on 1.1 (session 8/8, type Call, in history). Fix round FR8 will make D4 resolve the stored transcript per version; until it lands, D4 on 1.1 shows FAIL and its break shows NOT-TESTED. Pending: both change after FR8. Fixed in the sim (X4): D4 now reads the transcript through the activity ref and passes on 1.1 with the break FLIPPED; the figures below were measured before that fix.

### L6 first days: two readings, and a question for Ian

Spec line: "Within a week of the hand-off call". Hand-off call 2026-10-05, then 21 days of silence from the customer team. Measured on both versions (C3):

- Fernhollow first appears on the Today screen on **day 1** (2026-10-06).
- Watch on **day 10** (2026-10-15).
- Off Track on **day 21** (2026-10-26).
- The reason shown on Today is not "a session coming due". It is the Gainsight gate cards ("Readiness Assessment: Log Sentiment via Readiness Assessment timeline activity; Success Outcome Plan: ...; CSAT contact: ..."). The coverage reason is false (`reasonIsCoverage=false`).
- Where it sits: only in the Gainsight gate-deck cards. In the day's ranked action list it is rank 30, past the 15-beat cap on 21 of 21 days. It never becomes one of the day's own steps, even at Off Track.

Reading 1, literal: "first appears on Today" is met by day 1, so L6 is PASS. That is what the sim reports.

Reading 2, practical: the point of the line is a tap on the shoulder, a customer you must act on within a week. Gate cards are present from day 1 for every customer going through onboarding and the account never reaches the day's own action list in 21 days. On this reading L6 would be FAIL.

Open question for Ian: is a gate-deck card the "tap on the shoulder" you meant, or should a silent account reach the day's own list within a week? The sim keeps reading 1 until you say. The L6 break is not vacuous (the lead's mutant `firstToday=never` made L6 FAIL; read from the ledger).

C3 as written in the plan predicted "session coming due" on exactly day 7. That did not happen (it was day 1, a different reason), so the plan's mechanism was wrong even though the day-7 line is met.

## Checks C1 to C9

| Check | Result | Status |
|---|---|---|
| C1 Part A | (before the fix round) 1.0: PASS 7, FAIL 3 [D2, D3, D8], GAP 0. 1.1: PASS 6, FAIL 4 [D2, D3, D4, D8], GAP 0. (D3 and D7 carry GAP notes; D7 passes with three GAP notes.) | measured |
| C2 Part B | Both versions: PASS 9, FAIL 2 [L8, L11], GAP 1 [L12]. L10 passes with its CSM-request GAP note. | measured |
| C3 L6 drift | Both: Today day 1 (by 7: true), Watch day 10 (by 10: true), Off Track day 21 (by 21: true). See the two readings above. (After X9, verify prints C3 FAIL "disproved": the prediction was a coverage row by day 7 and L6 saw none.) | measured |
| C4 breaks flip | 1.0: FLIPPED 16, VACUOUS 0, NOT-TESTED 5 of 21. 1.1: FLIPPED 15, VACUOUS 0, NOT-TESTED 6 of 21. No VACUOUS. | measured |
| C5 same twice | **FAIL**, but only D7 on each version differs, and only in the evidence text. See below. | measured |
| C6 no leftovers | PASS: 0 new profile folders, 0 new browser processes alive, before and after (the one `fieldtest-XciUO4` from 19:03 was there before and is not ours). Folder prefixes `fieldtest-`, `osmsim-`, `clockspike-`, `aispike-`. | measured |
| C7 F1 and F2 | PASS: field test exit 0 on 1.0 and on 1.1, 14 metric keys each, 0 new `fieldtest-*` folders. Both versions print `ctx_status "risk:2 watch:14 ontrack:18"`. | measured |
| C8 trackers untouched | PASS: sha256 1.0 `a21ca8c3...` and 1.1 `b247a93c...` equal the full hashes in the plan; `git diff --quiet master` on both files is clean. | measured |
| C9 unit tests | `node --test --test-reporter=spec "test/*.test.mjs"`: 112 tests, 110 pass, 0 fail, 2 skipped, exit 0. (44 baseline plus the new osm-day tests.) Log: `sim-runs/suite-c9.log`. | measured |

Both full runs exited 1 (findings), never 2. Every browser ended with 0 provider-host requests escaping the fake (92 `ai |` log lines over both runs, all `escaped 0`).

### C5: what differed

The two runs differ only in D7's evidence on each version: the text carries the connector id the tracker makes at random for the queued row (`SIM-EXT-...`, e.g. `SIM-EXT-rfq3ezfwmviasymn` in one run, another value in the other). With that id masked, the two runs are identical on both versions (verify prints this). So no step flipped between runs; the sim's D7 evidence line prints a random value. Under the plan's rule (any difference fails) C5 is FAIL. The fix is to leave the id out of D7's evidence in `steps-a.mjs`, outside this task's files; I did not change it. Pending: a later fix round may remove the id and turn C5 to PASS. Earlier runs I read before this task show the same single difference (1.0 at 10-09 against 10-25). Fixed in the sim (X5): D7 evidence now says the externalId matches the sent row's own id and prints no random id, and verify no longer masks it; two D4+D7 runs gave identical D7 evidence. The measurements above predate that fix.

## 1.0 against 1.1

From `diff.md` of the run (measured):

- D4 differs: 1.0 PASS (transcript text stored), 1.1 FAIL with the break NOT-TESTED. This is the sim's defect described above, not a tracker difference. Superseded by X4: D4 is now PASS with the break FLIPPED on both versions.
- D7 differs only by the random connector id above. (Superseded by X5: the id is no longer printed.)
- Every other step has the same result and the same evidence on both versions.

## NOT-TESTED breaks (the step failed first, so the break could not be judged)

A NOT-TESTED break is never a pass: it sits beside a failed step.

- 1.0 (5): D2 (base FAIL: transcript line absent), D3 (base FAIL: you-owe and they-owe absent), D8 (base FAIL: case stays listed), L8 (base FAIL: case stays listed), L11 (base FAIL: OK enabled without a CSAT contact).
- 1.1 (6): the same five, plus D4 (base FAIL: "transcript.text missing", the sim's defect; pending FR8). After X4, D4 is no longer in this list.

The mechanism for D3 is proven separately by `probe --control d3` (see Task 5 controls). After FR8 the D4 break must flip on both versions (pending).

## Task 5 negative controls (read from the ledger, not re-run in this task)

- Parent commit, before the code existed: red with `ERR_MODULE_NOT_FOUND` x3.
- `mutKeys` (L11 override dropped from the break table): 2 pass, 3 fail.
- `mutD3` (D3 break body replaced by `void 0`): control exit 1, "control d3: FAIL SIM-OWE remains; rest of panel differs".
- `mutL6` (the plan's original, weaker L6 break): exit 1, "L6 break VACUOUS: 2026-10-06 in rendered Today only". The plan's L6 break was too weak because Fernhollow also shows in the "Records to bring up to date" list (`adminGapList`); `breaks.mjs` now filters that too.
- AI negative control: one provider request let through gives `escaped=1` and exit 2, so the guard can fail.
- Probes on both versions: 41 lines, 0 mismatches, exit 0.

## GAP list (fixed list, no tracker feature exists)

- D3: meeting agenda.
- D7: close a CTA after an ordinary call; success plan task update; Renewal Forecast Scorecard.
- L10: CSM request (Google form).
- L12: CSAT survey sent, answered or follow-up tracking.

## Other things seen

- The tracker raises a start-up "Download backup" confirm on each day's first load. The sim cancels it; it swallowed the Go-Live click on both versions otherwise (read, T9). A finding for Ian.
- `tools/selfcheck.mjs` leaves a `selfcheck-*` profile in Temp on every run (read; out of scope, not fixed).
- Our headless Chrome sometimes took 28 to 45 seconds to exit after the kill on a busy PC; cleanup now waits up to 60 seconds for exit and 30 seconds to delete, per Ian's ruling (read; why Chrome is that slow is unconfirmed).
- Graduation has no CSAT check in `validateGraduationDraft` (read, now also measured as L11).

## What a later fix round may change (pending)

- FR8: D4 on 1.1 stops failing; the D4 1.1 break becomes testable; C1 1.1 changes to PASS 7 FAIL 3 and C4 1.1 to FLIPPED 16, NOT-TESTED 5.
- D7 evidence without the random id: C5 turns PASS. (Done in X5.)
- FR9: L1 exampleOnly on an empty contact, L5 not checking the Call date 10-05, L6 never printing VACUOUS itself.
- FR7: D5 stops clearing the connector.
- L6: Ian's answer on the two readings.

## How each C line can print FAIL (verify.mjs)

Proved by running `verify.mjs --score-only` against doctored copies of the state folder (outside the repo), not only by reading the code:

- C1, C2: FAIL when any step of that part is FAIL (real data prints FAIL now).
- C3: L6 Today day set to 8 gave `C3 FAIL ... Today d8<=7 false`.
- C4: one verdict set to VACUOUS gave `C4 FAIL ... VACUOUS 1`; any shortfall from 21 FLIPPED also fails (real data prints FAIL now).
- C5: one evidence string changed in run 2 gave `C5 FAIL differs: 1.0 D1`.
- C6: an extra `osmsim-` folder and a new PID gave `C6 FAIL 1 new folders, 1 pids alive`.
- C7: a field-test exit of 1 gave `C7 FAIL exit NOT 0 x2 (0 1)`; a new `fieldtest-` folder also fails it.
- C8: a copy of verify.mjs with a tiny stand-in tracker file (not the real one) gave `C8 FAIL ... diff DIRTY ... HASH CHANGED`.
- Exit: a run exit of 2 gave verify exit 1 (and a harness error gives 2). verify exits 0 only if C5 to C8 are PASS and no run exited 2.

verify exited **1** in the real run because C5 FAILED on the random id.

## X10: fix round outcome (measured now: one fresh verify run, log `sim-runs/g2-verify.log`, exit 0)

Stability: the pre-fix numbers above reproduced on two fresh runs (latest 04:54 PDT). The post-fix numbers below come from this one run (10:17 to 10:54 PDT, about 37 minutes, longer than the 20 expected on a busy PC); the lead re-runs it.

- C1 1.0 PASS 7 FAIL 3 [D2,D3,D8]; 1.1 PASS 7 FAIL 3 [D2,D3,D8] (D4 no longer fails on 1.1, X4).
- C2 both PASS 9 FAIL 2 [L8,L11] GAP 1.
- C3 FAIL, both versions "disproved (no on-screen coverage row by day 7)": Today d1, Watch d10, OffTrack d21 (X9). The prediction of a coverage row is disproved; the Today day-1 gate cards are what shows.
- C4 both FLIPPED 16, VACUOUS 0, NOT-TESTED 5 of 21 (D2, D3, D8, L8, L11). L6 is FLIPPED (the spec's own L6 break was VACUOUS, N2). L5 (X8) and L7 (X7) are FLIPPED on their stricter checks.
- C5 PASS identical (X5, the random id is gone). C6 PASS. C7 PASS (exit 0 x2, 14/14 keys). C8 PASS (trackers untouched).
- times.txt (seconds, steps + breaks): run1 1.0 A 148.6, 1.0 B 244.2, 1.1 A 272.4, 1.1 B 440.8; run2 1.0 A 266.1, 1.0 B 439.0, 1.1 A 132.8, 1.1 B 204.3. These differ from the earlier 325/295/291/279 s per version because the machine load differed; they are single measurements, not a benchmark (S12).
- L11 (X6): the sim now clicks OK with no contact. Measured: the click graduates the account (stage graduated, 1 "Success Plan objective" queue item). The tracker has no CSAT check, so the break (a CSAT filter on `validateGraduationDraft`) is NOT-TESTED, not invented. Ian rules whether that is a defect.
- S11: the card is still rendered; the tracker's spine counts a confirmed case as decided (D8, L8). Ian rules.
- N1: the ai-negative control exits 0 when escaped=1 in the selfcheck path (read, not re-run).

Known weak coverage (deferred, not built): FR1, FR2, FR3, FR7, FR9 (L1 exampleOnly on an empty contact, L5 Call date 10-05), S10 fail-open seed restore, step dates, N3, N4, N5, N7.
