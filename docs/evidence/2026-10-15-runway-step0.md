# Runway 1.1 Step 0 (safety): evidence

Run: 2026-10-15, 09:51 to 10:35 PDT. Branch `worktree-runway-step0-plan`, commits b81e5f4..110fee8 (T1-T7).
Plan: `docs/superpowers/plans/2026-10-15-runway-1.1-step0-safety.md`. Spec: `design-work/DESIGN.md` section 4.
Ledger (git-ignored): `.ledger/2026-10-15-runway-step0/progress.md`; final review `.ledger/2026-10-15-runway-step0/reviews/final-opus.md`.

## Before and after (measured, headless harness, throwaway profile, demo seed)

Each "before" is the task's new check run against the previous commit's app; each "after" against the task's commit. All run by the lead, not only read from helper reports.

| Behaviour | Before | After | Task / commit |
|---|---|---|---|
| Back up after a failed load: file writes / stored-book writes | 1 / 1 | 0 / 0 (refused) | T2 d370a2c |
| Bookkeeping save of an unchanged book: stored-book writes | 1 | 0 | T3 856dcb5 |
| Second round of 5 tab clicks: stored-book writes | 6 (before T3), 1 (after T3) | 0 | T4 7047218 |
| Redraw of an unchanged book: stored-book writes | 1 (before T3) | 0 | T3 856dcb5 (see gaps) |
| Load of an up-to-date book: stored-book writes | 1 | 0 | T5 4d01900 |
| Test book saved / imported / backed up over a real book | all accepted (ok=true, backup writes=1) | all refused | T6 9427657 |

End checks (lead, fresh, 110fee8):

- `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 475` -> `475/475 passed`
- `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step0-probe.js --fn step0Probe --expect 20` -> `20/20 passed` (14 at T7; 6 added in T8)
- `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475` -> `475/475 passed` (baseline before the run: 475/475, 5.4 s)
- `git diff --stat master -- osm-book-of-business-tracker-1.0.html` -> empty (1.0 untouched)

Prediction in the plan (probe 14/14 at T7, 20/20 after T8; both suites 475/475, 1.0 untouched): held. Disproof conditions: none observed.

## What went off-plan

- T6: stamping the demo seed `synthetic: true` turned two T3 checks red (12/14). Cause shown by experiment, not argued: T2's control backup ran with the flag removed and stamped an unflagged book into storage (stored `synthetic` true before T2, undefined after), so T3's save was correctly refused. Fix: the T2 probe block now restores the stored book it stamps. No assertion changed. After: 14/14; the same probe on T5's app fails only the 3 T6 refusal checks.
- T1 checker: its check commands were refused because it appended `; echo exit=$?`; copied byte-for-byte they run. Packets after T1 said so.
- Codex second review: not run (slip spend $0; cost on this account not confirmed free).

## Not covered by these checks

- Ian's real Chrome profile is never used; behaviour on the real book after upgrade is shown only with the synthetic book.
- Risk-memory first-seen stamps still happen while drawing (by design); they now write once per real change.
- DESIGN.md 4.4 "check suites and harnesses use their own storage key" has no task and was not recorded as cut; the separate browser profile part is met. (S6)
- Behaviour gaps the review raised for a decision: refusal toast shows once per session (S3); refused backups say nothing (S4); nothing ever clears `synthetic`, so a demo book turned real work is never backed up (S5).

## T8 follow-up (final-review S1, S2, S7)

Six probe checks added (14 -> 20), each failing on a mutant copy (in `.claude/jobs/3b0b7d9b/tmp/t8mut/`, not in the repo) and passing on the real file. S1a: `readOnly` forced false -> "read-only risk list ... queues 0 saves" fails (queued=1, changed=true). S1b: `if(changed) queueSave()` -> `queueSave()` -> "normal risk list on a stable book queues 0 saves" fails (queued=1). S2: tab selector matching nothing -> "each round ... clicked all 5 tabs" fails (round1=0 round2=0). S7: catch -> `return false` fails the unreadable-book check; dropping `customers.length > 0` fails the no-accounts check; dropping the `synthetic` test fails the stored-synthetic check. The tab-badge call site itself (9203) is still not pinned, only the `readOnly` path it relies on.

## Cost

16 helper dispatches (7 implementers, T6's resumed once with the lead's fix; 8 checkers, T1's twice; 1 final reviewer); tokens per helper in the ledger, from the task notifications. Dollars: not measured.
