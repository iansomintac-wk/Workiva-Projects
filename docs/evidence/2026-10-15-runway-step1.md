# Runway 1.1 Step 1 (transcripts out of the book): evidence

Branch `runway-step1`, final commit `0b06e3a`. Spec: `docs/superpowers/specs/2026-10-15-runway-1.1-step1-transcripts-design.md` (section 4 = C1-C9). Ledger (git-ignored): `.ledger/2026-10-15-runway-step1/progress.md`; reviews in `reviews/final-opus.md` and `reviews/final-codex.md`.
Label: **measured** = run by the lead (this run's coordinator session) on 2026-10-15, final re-run at 22:27 PDT on 0b06e3a, headless harness, throwaway profiles, synthetic books. Every number below is copied from the ledger, none estimated. Helper numbers are marked as helper numbers.

## For Ian, plainly

- All nine checks passed on the final commit, and each of the ones we tried to break turned red when broken (the controls below).
- The cost: opening the app got slower. The spec's reference for the load step was about 157 ms; it now measures medians of 271 to 427 ms (one single start took 504 ms). Medians stay under the 500 ms target.
- Before you first open 1.1 on your real book, Export in your current tracker. 1.0 cannot read the new format, so the export is the only way back.
- Your optional 2-minute check of the backup-file write in a throwaway Chrome window has NOT been run.
- Waiting for a later step: five deferred review findings, one unguarded import path, and the load-step slowdown.

## Final end checks (lead, fresh, 22:27 PDT, 0b06e3a)

- step1Probe 72/72; 1.1 suite 475/475; Step 0 probe 34/34; 1.0 suite 475/475; 1.0 file IDENTICAL (byte-identical to master).
- C7 after 7.5 / 7.5 / 7.3 ms, median 7.5 ms; before 146.6 / 131.6 / 127.9 ms, median 131.6 ms.
- C8 422.5 / 415.4 / 435.9 ms, median 422.5 ms, spread 5%, exit 0, PASS.

## C1-C9: what proves each

Probe line numbers are from the final Opus review (read, not re-run by it); pass/fail counts are lead-measured.

| # | Proof (check) | Before | After | Showed it can fail |
|---|---|---|---|---|
| C1 50 x 160K transcripts: load, export, re-import identical | T8 probe check through the real exportData + handleImportFile + confirm callback, SHA-1 compared (step1-probe.js:413). Spec prediction 50/50 | T8 red 48/52 (4 failed, threw) | same=50/50 by SHA-1 through the real Export and Import handler, stored book 100185 chars with no transcripts object (measured, lead, 2026-10-15 22:27); T8 58/58; final 72/72 | T8 checker: refusal before staging, 0 IDB records; spec threshold "any mismatch" |
| C2 localStorage after the move holds only refs | step1-probe.js:326; all-refs check at T6 | T6 red 37/44 (7 failed) | stored=100035 base=93895, 123 chars per transcript above the no-transcript book (limit 200), kept=50/50 refs and texts (measured, lead, 2026-10-15 22:27); 72/72 | T6 checker #2: proven by a falsifiable probe check (not separately mutated) |
| C3 157,060-character call stored whole; debrief sends at most 120,000 with marker | step1-probe.js:140, 186, 194 (T3, T4); T4 fixture 272,567 bytes, call 1 asserted at 157,060 chars | T4 red 22/25 (3 failed) | T4 25/25; final 72/72 | T4 parent red, 3 FAIL |
| C4 record deleted behind the app shows "missing", sends no text, book loads | step1-probe.js:172 (+ T3 notice check) | T3 red 8/10 (2 failed) | T3 19/19; final 72/72 | T3 checker: red control "expected 19 defines 10" |
| C5 IndexedDB unavailable: loads, inline readable, nothing moved | step1-probe.js:305 (guard) | n/a (guard, green before the change at T6) | green; final 72/72 | T6 lead mutant (`if(copied)` to `if(true)`): 43/44, only FAIL "if the pre-move copy cannot be saved, nothing moves" |
| C6 pre-move copy identical to original string | step1-probe.js:266, 278, 286, 294; same-day key collision check | T6 red 37/44 (7 failed) | T6 44/44; final 72/72 | T6 mutant above, 43/44; checker #2 PASS. Gap: 294 did not check what the load then saves (S1, fixed) |
| C7 backup preparation, 500 x 40K | step1-probe.js:561 (T10) | spec: 167 ms today; measured before-series in Timing | final median 7.5 ms (limit 30) | T10 lead mutant `_tsVersion++` at top of serializeBackup: 63/65, FAIL T10 C7 (after median 151.9 ms); implementer control median 262.9 ms |
| C8 startup, 500 x 40K, 3 starts, median under 500 ms | `tools/step1-coldstart.mjs` (T11) | spec reference 155 / 237 / 157 ms, median 157 ms | final median 422.5 ms (all series in Timing) | T11 control threshold median < 1: C8 FAIL, exit 1 |
| C9 nothing old breaks | selfcheck 1.1 475, step0 probe 34, selfcheck 1.0 475, 1.0 file identical | 475/475, 34/34, 475/475, identical (lead baseline 15:05 PDT) | 475/475, 34/34, 475/475, IDENTICAL (22:27 PDT) | every task re-run by the lead stayed at these counts |

Suite edits: three 1.1 suite checks were edited (v51 normalization, c1e schema 17, gong c3c), each title plus one assertion line, measured with `git diff -U0` of selfchecks.js against selfchecks-1.1.js; the 1.1 suite count stayed 475.

Probe growth by task (lead re-run): T1 1, T2 9, T3 19, T4 25, T5 34, T6 44, T7 49, T8 58, T9 64, T10 65, fix round 72.

## Mutants and controls

| Control | Result |
|---|---|
| T6 copy guard (`if(copied)` to `if(true)`) | step1Probe 43/44; only FAIL is the "nothing moves" check |
| T10 C7 (`_tsVersion++` in serializeBackup) | 63/65: FAIL T10 C7 (after median 151.9 ms) and FAIL T8 cache-count |
| FX Replace undo (clearUndoSlot removed, html:3117) | 71/72; only FAIL is "T5 Replace ... clears the undo slot" |
| T11 C8 (threshold median < 1) | C8 FAIL, exit 1 |

Two control slips, both the lead's: a T6 mutant with a syntax error (dangling else) printed nothing, so the first T6 checker could not conclude (lesson: run a mutant once before handing it over). T10's red control was vacuous because the prep copied the new probe into the parent export; the lead then ran the mutant itself.

## Timing (C7 and C8), all series

C7, backup preparation, 500 x 40K, ms:

| Run | After | Before |
|---|---|---|
| T10 implementer (helper) | 10.0 / 10.4 / 9.7, med 10.0 | 200.6 / 186.4 / 181.8, med 186.4, spread 10% |
| T10 lead, 3 runs | 6.6 / 9.1 / 6.5 (all under 30) | 199.1 / 111.3 / 110.3, med 111.3, spread 80%; 110.4 / 119.4 / 162.2, med 119.4, spread 43%; 261.0 / 145.7 / 127.8, med 145.7, spread 91% |
| Final lead, 22:27 PDT | 7.5 / 7.5 / 7.3, med 7.5 | 146.6 / 131.6 / 127.9, med 131.6 |

The before series spread more than 15% at a median of 30 ms or more, so the lead's stop rule fired and Ian was asked (ruling "Yes to both", below). The after and before ranges do not overlap in any run.

C8, startup, 3 starts on one profile, whole loadData interval, ms:

| Run | Starts | Median | Spread |
|---|---|---|---|
| T11 implementer (helper) | 272.3 / 314.7 / 333.1 | 314.7 | 19% |
| T11 checker (helper) | 396.5 / 479.8 / 345.5 | 396.5 | 34% |
| T11 lead (then failed at cleanup, EPERM, a test-tool bug, since fixed) | 291.9 / 260.2 / 271.5 | 271.5 | 12% |
| T11 fix implementer, run 1 (helper) | 328.8 / 427.1 / 447.6 | 427.1 | 28% |
| T11 fix implementer, run 2 (helper) | 380.8 / 381.4 / 428.6 | 381.4 | 13% |
| T11 lead re-run | 504 / 311.3 / 274 | 311.3 | 74% |
| Final lead, 22:27 PDT | 422.5 / 415.4 / 435.9 | 422.5 | 5% |

Plainly: the load step was about 157 ms in the spec's measurement (155 / 237 / 157). With transcripts in IndexedDB it measures medians of 271 to 427 ms. One single start took 504 ms, over the 500 ms line, though that run's median was 311.3 ms. The spec's C8 pass rule is the median, so it passes, but the slowdown is real and is on the later list. The lead checked for orphan browsers (0 chrome.exe on Temp profiles), so the run-to-run drift is machine load.

## Ian's rulings (verbatim, 2026-10-15)

- "For gong yes" (Gong import saves inline uncut; the load-time move makes it a checked stored copy).
- "Yes" (spread recorded, never asserted; stop rule only when the median is 30 ms or more, SPREAD_FLOOR_MS 30).
- "Yes should any of this be done at a higher effort?" (Clear all data wipes transcripts and the pre-move copy).
- "yes, approve as is" (plan approved).
- "Yes to both" (C7 and C8 accepted as passing despite spread over 15%; the evidence states the load-step slowdown and the 504 ms start, above).
- "Raise the cap to 2 million" (runTokenCap 1,500,000 to 2,000,000).
- "fix the four now" (S1-S4 fix round).
- "yes, pause it" (I1: automatic backup-file write skips, with a visible reason, while a referenced transcript is missing; manual Export unchanged).

## Fix round after final review (0b06e3a)

Codex final review: 8 MUST / 4 SHOULD (unverified). Opus final review: 0 MUST, 4 SHOULD, 1 needs Ian, 8 NIT; merge blockers 0. Fixed: S1 warning toast when the pre-move copy fails, S2 undo slot cleared after Clear all, S3 restore staging error handling plus toast, S4 truncated-label wording, I1 backup skip, and the vacuous T5 Replace undo check made falsifiable. Probe 65 to 72; red per item S1 1, S2 1, S3 1, S4 1/2 (the second is a guard), I1 2/2. Side effect to know: the I1 block also stops "Back up now" while a transcript is missing; Export is unchanged.

## Export before the first open

1.1 moves a book to schema 17 on first open, and 1.0 refuses a schema 17 book. A code revert does not undo the move. The way back is an Export made in the current tracker before the first open of 1.1 (spec section 3.2, item 15; the CHANGELOG says the same).

## Section 4 optional Ian check: NOT YET RUN

About 2 minutes, in a throwaway Chrome window (never the normal profile): set up the backup file on a 500 x 40K synthetic book and note whether the page stutters after a save. It is the only check of the disk write, which could not be measured. Until it runs, the disk write is unmeasured.

## Not covered

- Ian's real Chrome profile and real book were never used; everything is synthetic.
- The disk write of the backup file (above).
- Review findings were read from code; not all were reproduced.

## Later list (not this step)

- Codex #2, #3, #4, #6, #10 (Opus N1-N5): two-tab race, unchecked sha1, over-long note, ignored save results in applyCallImport, mid-move commit.
- Full-book import (html:18952) `stageImportedTranscripts` has no catch.
- C8 load-step slowdown against the spec's ~157 ms reference.
- Other Opus nits N6-N8 are in `reviews/final-opus.md`.
