# D3 prep probe: the numbers (2026-10-19, talk 1c93fa0b)

Read-only. No tracker edits. Code reading by a researcher helper: `docs/research/2026-10-19-d3-prep-probe-code.md` (two of its figures spot-checked by the lead: the direction labels at 1.1:3469-3471, and the Today candidates at 1.1:11846-11864; both match). One of its claims is corrected below.

Labels: **measured** = the lead ran it and read the output; **read** = from code or a document; **assumed** = reasoning only, with the check that settles it.

## Baseline: full verify of master c297df3, run alone (measured)

`node tools/sim/osm-day/verify.mjs`, 09:08:02Z to 09:28:13Z (20m11s), state dir `sim-runs/verify-2026-10-19T09-08-01-319Z` (git-ignored), exit 0, watched by a memory Monitor (no low-memory event).

```
C1 FAIL 1.0 PASS 7 FAIL 3 [D2,D3,D8] GAP 0 | 1.1 PASS 8 FAIL 2 [D3,D8] GAP 0
C2 FAIL 1.0 PASS 8 FAIL 3 [L7,L8,L11] GAP 1 | 1.1 PASS 9 FAIL 2 [L8,L11] GAP 1
C3 PASS (1.1 rank 1 on 2026-10-12)
C4 FAIL 1.0 FLIPPED 15 VACUOUS 0 NOT-TESTED 6 of 21 | 1.1 FLIPPED 17 VACUOUS 0 NOT-TESTED 4 of 21
C5 PASS identical; C6 PASS 0 new folders, 0 pids alive; C7 PASS exit 0 x2, metrics keys 14/14
C8 PASS 1.0 a21ca8c3... 1.1 b1f6f99a... 1.0 diff clean vs master
```

Identical to the D2 run's final verify (`docs/evidence/2026-10-19-runway-1.1-d2-prep.md`). D3's line on 1.1 (run1 report): `D3 FAIL | GAP: meeting agenda | break NOT-TESTED | absent from panel: SIM-OWE you owe, SIM-OWE they owe`. The checklist item and the question are already on the panel.

GAP counts: C2's one GAP is L12 (CSAT tracking). "Meeting agenda" is a note on the D3 line, not a GAP step; C1's GAP count is 0 and stays 0 either way (measured from the report). (The talk's Q2 message said "the C2 GAP count stays 1" as if it were about the agenda; that was wrong, and does not change the answer.)

## Where things are (read)

- `renderBeatPrep` 1.1:12653-12683, called from `renderBeatPanel` 1.1:12557. Sections: Call prep heading, D2 transcript (hidden when none), Pending deliverables (5 shown, then "N more outstanding — see them all", 1.1:12666; "Nothing outstanding." when empty), Time on your calendar, buttons. No commitments.
- Commitment record `{id, text, direction: 'i_owe'|'they_owe', due|null, doneOn|null}`. `COMMITMENT_DIRECTIONS` 1.1:3469 ("I owe them" / "They owe me"); `openCommitments` 1.1:3485; `commitmentIsOverdue` 1.1:3489; `commitmentDueSoon` (within 3 days) 1.1:3490; `MAX_COMMITMENTS = 30` 1.1:3473.
- Coordination tab list 1.1:13743-13751: open first, then by due date; labels "You owe them" / "They owe you"; "Nd overdue" in red, "due soon".
- Today: `todayCoordinationCandidates` 1.1:11846-11864 makes a driver only for overdue or due-within-3-days commitments ("You owe: ..." / "They owe you: ..."). Undated ones never reach Today.
- Sim: D3 `steps-a.mjs:60-64` reads the Orion `.day-pane` text. Break D3 `lib/breaks.mjs:9` strips `SIM-OWE[^<]*` from `renderBeatPanel`'s output, so a new section inside `renderBeatPrep` is stripped if each commitment's text starts its own text node. D6 (after D3) closes only the "SIM-D6 you owe" one. No L-step reads commitments.
- `test/d2-prep-transcript.test.mjs:78` loads `renderBeatPrep` into a vm with a fixed function list: a new helper must join that list.

## Counts (measured, headless Chrome, throwaway profile, sim setup A on 2026-10-21)

Scratch probe in the job's tmp folder (not committed); it mocks a section in the throwaway page only.

- 35 accounts; open commitments per account: 0 on 32, 1 on 2 (Halcyon, Solaris), 6 on 1 (Orion).
- **Correction:** the code note says the field-test seed is "not used by the osm-day sim". It is: the sim builds on the field-test book, so Orion carries the field-test pair plus the sim's 4. Orion's 6 open on 10-21:
  1. you owe "Send deficiency-field mapping doc", due 10-20, **overdue**
  2. they owe "Priya to confirm Q3 walkthrough owners", due 10-23
  3. you owe "SIM-OWE you owe the sandbox walkthrough", due 10-23
  4. they owe "SIM-OWE they owe the data file", no date
  5. you owe "SIM-D6 you owe the recap deck", no date
  6. they owe "SIM-D6 they owe the access list", no date
- With the agreed rule (rank overdue, then by due date, then undated in stored order; keep 5) rows 1-5 show and "1 more" links to Coordination. Both SIM-OWE rows are kept, so D3 is predicted to pass (assumed until the run).
- Real book: not on this PC; counts per real account are **assumed** (nothing measured says a real account carries more than 5).

## Panel height (measured)

- Orion's prep pane today: 1,645 px and 1,670 px on two runs (25 px apart), against a 748 px viewport. The pane already scrolls.
- Pending deliverables section: 84-85 px.
- A mocked promises section after Pending deliverables adds 134-137 px with 4 rows in 2 groups, and 175-178 px with 5 rows plus the "more" line: about 8 to 11% of the pane.

## Scope question (ruled in the talk)

The meeting agenda is only a label on the D3 line (`lib/results.mjs:9`), with no spec and no pass rule. Ruled out of scope (Q2).
