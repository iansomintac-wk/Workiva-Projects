# Runway v13 fixes - evidence (2026-10-22)

Branch `runway-v13-fixes` from `runway-v13-look` 8df9a0c. Plan: `docs/superpowers/plans/2026-10-22-runway-v13-fixes.md` (Tasks 1-6).
Ian, 2026-10-22, relayed verbatim: "THE POINT WAS TO CHANGE THE DESIGN AND THEN FIX WHATEVER NEEDED TO BE FIXED BECAUSE WITH A DESIGN THE PREVIOUS UX/UI WOULD MOST LIKELY CHANGE." / "JUST FINISH IT NOW".

## Numbers

| Check | Base 858aa9c (measured 16:13Z by 0e0cbb80) | After, on 29f66fa (measured by lead 2055468c, ~18:10Z) |
|---|---|---|
| Self-checks `node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 556` | 535/535, 0 console errors | 556/556, 0 console errors |
| Tests `node --test "test/*.test.mjs" "connector/test/*.test.mjs"` | 597 / 595 pass / 0 fail / 2 skipped | 597 / 595 pass / 0 fail / 2 skipped |
| Day sim `node tools/sim/osm-day/run.mjs` (default: 1.0 then 1.1) | 1.1 22/22 PASS only with the old-screen pin (`obm-next-screens-v1`='0'); unpinned on f61956b: Part A 6 PASS / 4 FAIL, Part B harness error at L9 | no pin. 1.1: steps 22 breaks 22, exit 0 (every step PASS, every break flips it). 1.0: steps 22 breaks 22, exit 1 with D2 D3 D8 L7 L8 L11 L12 FAIL, the same 7 as at 13e88af before the port (1.0 lacks those features). Run folder sim-runs/2026-10-22T18-03-11-367Z |
| `d2-prep-panel --check`, `d3-prep-panel --check`, `l11-csat-panel --check`, `l12-persist-check` | ran on old screens only | all exit 0 on v13 (measured on d3782c0; fix A/B did not touch them) |

21 new self-checks: 19 across Tasks 1, 3, 4, 5, 6, each run red before its code (T1 5/5, T3 2/2, T4 control 2 FAIL, T5 5/6, T6 4/4), plus 2 from the final review (red 2/2). The one T5 check that passes both ways is the initials check: 1.1 has no user name, so "Me" stays (kept, noted).

Measured just now by the lead: the "After" column and the 1.0 baseline (fix B helper's log at 13e88af, lead read the per-step lines). Read, not re-run: the base column and the per-task red counts (run ledger, predecessor lead 0e0cbb80).

## What changed

- T1: Desk tabs act on the Desk's account (shared `controlCustomer(el)`, no `inert`); Prepare in v13's Goal / Evidence / Uncertainty / Next review.
- T2: day sim and five tools drive v13; old-screen pin removed. 1.0 runs its pre-port steps (steps-a-1.0.mjs, steps-b-1.0.mjs, identical to 13e88af). L6/L7 "on Today" now means a Co-pilot queue card (a Desk row would always pass: the Desk lists every account). `d3-prep-panel --control` still exits 1 but only because c297df3 lacks the Desk selectors; the live control is the D3 break.
- T3: Accounts controls in the heading; Month calendar.
- T4: Co-pilot "Before today's calls" / "Overdue" proven by fixture.
- T5: overlay panel in v13 tokens; dark mode on every screen.
- T6: the Desk carries the old Today pane's features (Call prep / Agenda / Promises in Prepare, Go-Live CSAT gates in Evidence, Sentiment in Capture, Surveys to chase + Wrap up + Back up in the heading).

## Final review

Opus (final-reviewer) and Codex (codex-cli 0.163.0, read-only) each found one must-fix the other missed; no disagreement.
- Opus: beatGateBlocks' Sentiment block lost its `</div>`, nesting the old screens' day panes. Fixed 55fe4ce, 2 red-first checks.
- Codex: sim setup clicked a v13-only control, so the default run died at 1.0 (exit 2, reproduced by the lead). Fixed 6d97bb5.
- Should-fixes closed: the two Task 6 edits to locked v72 checks are recorded in README and CHANGELOG (intent unchanged, one tightened with `g.outcome`); D2/D3 read only the Prepare call-prep box; dead L6/L7 cap legs dropped (pass conditions unchanged); stale sim comments corrected.
- Left for Ian: the Desk Evidence tab shows 1.1's "Health NN%" tile (healthScore). It was already drawn there at the base commit; both reviewers call it a v13-rule breach the branch did not introduce. Ian ruled "Hide on Desk" (below).

## Ian's rulings, 2026-10-22 18:15Z (resume 2)

Ian answered four cards himself (answered-for-ian.jsonl: left=ian-kind).
- Look, "PM's picks": Desk Prepare step 04 reads "NEXT · curriculum" (v13's word, was "Next review"); the Go-Live gates box sits below the Evidence stat tiles; Task 6 placements, the dark raised Co-pilot summary, and Month without "Sentiment check-in" stay as they are. Built 99c76cb, merged 45661ed.
- Health, "Hide on Desk": the Desk Evidence tab draws no Health tile (a `noHealth` option on the overview tiles); the full-account overlay's Overview keeps it; healthScore unchanged.
- 4 new self-checks in `v13 fixes: look2`, red 3 of 4 on 02f460d (the 4th, overlay keeps Health, is a guard that passes both ways). One existing check's expected heading moved from 'Next review' to 'Next' with ruling (a).
- Left out, "None for now": deferred by Ian 2026-10-22, the v13 features 1.1 has no data for: signal ids (EV-27); co-pilot minutes saved and applied / edited / dismissed counts; "Applied for you"; "After your calls"; implementation %; check-ins due; sentiment and renewal pickers; Gainsight dry-run, JSON preview, field mapping and per-row company-ID boxes; renewal window; TTFV target; curriculum versions.
- v13-risk worktree, "Save then remove": its uncommitted diff (docs/HOSTING.md, the 1.1 html, tools/sim/osm-day/verify.mjs; 2,831 bytes) is saved as `v13-risk-uncommitted.patch` in the run ledger and committed on branch `v13-risk` (2ee32f1, pushed as its own branch, not merged); the worktree is removed, branch kept.

Measured by lead ef392aa7 on 45661ed plus the re-pin (1.1 a2e52373): self-checks 560/560, 0 console errors; tests 597 / 595 pass / 0 fail / 2 skipped; day sim `node tools/sim/osm-day/run.mjs` 1.1: steps 22 breaks 22, exit 0 (22 PASS, 0 FAIL); 1.0: exit 1 with the same 7 FAIL as before. Captures (headless throwaway profile, demo seed): Desk Prepare step 04 kicker "Next · curriculum · Carbon · S7" (was "Next review · ..."); Desk Evidence text has the tiles at char 143 and Go-Live gates at 4173 (was gates 93, tiles 1211), no "Health NN%" (was present); both opened and checked.
