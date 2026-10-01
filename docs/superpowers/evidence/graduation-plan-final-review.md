# Final whole-branch review: graduation-plan (e780666..cb6cf8d)

Reviewer: top model, read-only. Working tree, index and HEAD were not touched. All outputs are under `C:\Users\teasp\.claude\jobs\c810ab0e\tmp\`.

## Verdict

**Ready to merge: With fixes.** Two Important seam bugs (below) concern what happens to an account *after* the graduation confirm. Neither breaks a measured acceptance check, and both are small, local fixes. Everything else is Minor.

## What I measured just now

| Run | Result | Output |
|---|---|---|
| `selfcheck.mjs --seed demo-seed.js --expect 427` | **427/427**, exit 0 | `suite.txt` |
| scenario run (`--fn runGraduationScenarios --verbose --expect 6`) | **6/6**, exit 0. A3 rows=0, detect=0; A4 fired=true; A5 tally 5/5; A6 fires before ack and not after; A7 "Gates: 0 gates"; A8 asked=true, blocked=false | `scen.txt` |
| `migration-dryrun.mjs --from 13 --out <tmp>` | exit 0. 7 accounts: goals [] 7/7, exit null 7/7, graduation null 7/7; default modules 5/5 (+2 CSRD, +1 other); Sustainability 5/5/3/3; FR, GRC and Custom 0/0/0/0; invented exits 0; idempotent; 0 console errors | `dryrun13.txt`, `dryrun13.md` |
| My own probe seed, 9 edge probes (P1-P9) | values quoted per finding below | `probe-seed.js`, `probe.txt` |
| Network grep over added tracker lines and the new tools (`fetch(`, XHR, sendBeacon, http URLs) | 0 hits | — |
| Changed paths under `docs/research/internal` | none | — |

Figures I only read and did not re-run: A2 on `f99a948` and the packet lengths (691 / 1,281 / 1,529 → 730 / 1,320 / 1,568).

## Strengths

- The domain functions (`createGoal`, `changePrimaryGoal`, `applyGraduation`, ...) are pure and kept apart from the UI layer that saves and queues. c6b enforces plan P5.
- `applyGraduation` validates before it mutates. `confirmGraduation` is one action with one save, so Undo restores the pre-graduation book. c6d models the snapshot rule instead of asserting it.
- The normalisers clamp every length, null unknown enums and repair multiple primaries. `repairAuxiliaryCollections` runs them on schema-14 loads too, so a backup or import round-trips. P3 confirmed the goals, exit and graduation fields come back byte-identical.
- `plannedSessionTotal` gives the tally surfaces one consolidation point, and it filters by *still unheld*: a session logged after an exit counts again instead of being double-subtracted.
- The migration infers nothing, is idempotent and has a dry-run harness. The `--verbose` scenario run prints measured values rather than restating the expectations.

## Important

### I1. Moving an account out of Graduated leaves `c.exit` in place, and re-graduating never clears it
`osm-book-of-business-tracker-1.0.html:4601` (`if(v.unheld.length) c.exit = …`) and `:4629-4632` (`requestStageChange`; non-graduated targets go straight to `changeStage`).

Probe P1 (8 planned, 5 held, early exit, then stage → ttfv2):
- `planned=5`, `nextOpen=null`.
- So a live account reads "Complete · All 5 sessions logged" while 3 sessions are unheld, and it gets no next session.
- After holding all 8 sessions and re-graduating, `regradUnheld=0`, but the old exit survives: `sessionsNotNeeded:[…06,…07,…08]`.
- The GOALS section still prints "Early exit: Goal met early … Sessions marked not needed: Session 6 …; Session 7 …; Session 8 …", even though SESSION HISTORY shows those sessions as held.

Probe P2 (no-goal graduation, then revert) returned `panelEmpty=true`. `renderGoalPanel` (`:22044`) hides the "No goal yet" banner whenever `getExit(c)` is set, so a live account can't get a goal.

Why it matters: the One Document states a false early exit, and a re-opened account loses its next-session prompt. This is a seam between task 4 (exit) and the existing stage paths. Each task was checked only on the forward path.

Fix:
- In `applyGraduation`, write `c.exit = v.unheld.length ? normalizeExit(...) : null`.
- In `requestStageChange`, when `c.stage === 'graduated' && stageKey !== 'graduated'`, clear `c.exit`, or ask Ian whether a re-opened account keeps its exit record. That is a product call. The stale-exit-on-re-graduation half is a plain bug.
- Add a self-check covering graduate (early exit) → revert → hold all → re-graduate.

### I2. "Change goal" on a graduated account strands the verdict with no UI path back
`:22060`: the panel renders `data-goal-change` for every account that has a primary goal, graduated ones included.

Probe P4 (graduate with verdict met, then change goal):
- `primaryVerdict=null`; the packet prints "Verdict: not recorded yet".
- The real verdict now sits on the replaced goal.
- `goal_changed` fires on the graduated account (`customerGoalChangedSignal`, `:4537`, has no stage check). Today hides it because graduated accounts are out of triage, but it is live in the signal set.
- Only the graduation confirm sets a primary verdict, and it opens only on a stage change *into* Graduated. So the OSM has no way to give the new primary a verdict.

Why it matters: the CSM packet for a graduated account loses its verdict line, and the account can't be repaired from the UI.

Fix: hide "Change goal" (and probably gate editing) when `c.stage === 'graduated'`, or have `customerGoalChangedSignal` and the packet handle the case. Hiding the button is the smaller change. Add a check that the panel for a graduated account has no `data-goal-change`.

## Minor (13)

1. **Double period in the packet** (`:20983`): `because ${g.changeReason}.` gives "because Scope.." when the reason ends in a full stop (P3 measured exactly that). Strip trailing `[.!?]` before appending.
2. **Incomplete draft validation and stale undo label.**
   - `validateGraduationDraft` (`:4579`) checks only `newGoal.text`, not `newGoal.type`. P5: `valid=true`, then `confirmed=false`, leaving `_undoLabel="graduate"`.
   - The UI can't reach this today, because the select always sends a valid type.
   - The same pattern leaves a stale label in several panel handlers that call `markUndoable` before a no-op: ack when nothing to ack, add-gate with empty text. The next unrelated save inherits it.
3. **Schema-14 shape gap.** A schema-14 book (import, backup or Excel-created account) whose customer lacks `goals`/`exit`/`graduation` keeps them `undefined` (P6 returned `{}`). Repair deliberately "never creates them". The getters tolerate it, but spec §3.4 says every customer has the fields. Either backfill in `repairAuxiliaryCollections` or note the deliberate choice.
4. **Ledger open item, confirmed.** `late_gate` (`:7419`), `ready_to_set_date` (`:7425`) and `no_value_evidence` (`:7591`) still use the raw `c.totalSessions`. An early-exit account would read "5/8" if one of these is rendered in the panel. Today excludes graduated accounts, so this only shows in the panel. It overlaps I1 for a re-opened account.
5. **Ledger open item, confirmed.** The c4f check is labelled `// c4i` (`:16243`); the real c4i is at `:16171`.
6. **Ledger open item, confirmed.** The log form's "Session # (of ${c.totalSessions} planned)" (`:23006`) uses the raw total. This is defensible, because the curriculum keeps the raw plan; say so or switch to the planned total.
7. **README:98 lists an exit reason that doesn't exist.** It says "customer self-sufficient"; the real labels are Goal met early / No more enablement needed / Paused or at risk / Other.
8. **README overclaims the confirm.** It says "The stage change to Graduated opens a confirm" without mentioning that the Excel import bypasses it (approved P1), so an imported graduation has no marker. Add one line.
9. **Stale SHA-256 block.** VALIDATION.txt:30-32 says tracker `87151c04…`, 1,642,357 bytes. HEAD's blob is `dba4cefa…`, 1,739,634 bytes. The block was already stale at base (`bbace191…`), so this branch didn't cause it. The block itself says to re-measure whenever the HTML changes.
10. **Spec §5 and §8 still quote "691-1,714".** See spec lines 207 and 291. The correction is in VALIDATION:1355 and the ledger, but not in the spec itself.
11. **Graduating straight out of implementation leaves `inImplementation(c)` true.** Probe P9: the packet prints both the early-exit line (Sessions 1-8 not needed) and "(curriculum not started … not needed: No more enablement needed)", and `plannedSessionTotal` is 0. This is mostly pre-existing, but the duplicate line is new.
12. **Two checks only count source text.** c4e counts `requestStageChange(` occurrences and c6b counts `commitGoalEvent(`. Both are true by construction for refactors that keep the call count; behavioural coverage comes from c6d and A5. The ledger acknowledges this.
13. **Settings textareas have no labels attached.** The Graduation gates `<label>`s have no `for`/`id` pairing (accessibility).

## Ledger "Open for the final fix round", item by item

- `late_gate`/`no_value_evidence` raw N/8: **confirmed present** (Minor 4).
- Duplicate `// c4i`: **confirmed present** (Minor 5).
- "(of N planned)" raw: **confirmed present** (Minor 6).
- VALIDATION should name the seed for the packet range: **done**. VALIDATION:1353-1356 names `demo-seed.js` and derives 1,714 from `demo-seed-today.js`. The spec text itself is unchanged (Minor 10).
- Task 6 docs (README:74, VALIDATION:47 still saying 425): **fixed**. README:117/133 and VALIDATION:47/158/398 all read 427, matching the suite I ran.

## Plan alignment

- Every deviation in the ledger has a stated reason:
  - plan-time exemption removed to match spec §4.4;
  - `nextOpenSessionNumber` skip;
  - one-save confirm;
  - goalGates normalised on load;
  - the exit date added to the packet.
- Excel import bypassing the confirm was approved (P1).
- Ruling M1 is implemented, and checks c1g, c4h, c5d and c5e cover it.
- No network calls were added, and nothing changed under `docs/research/internal`.
