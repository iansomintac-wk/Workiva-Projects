# D3 prep probe (code reading only) - 2026-10-19

T = osm-book-of-business-tracker-1.1.html. All items "read" (from code) unless marked assumed.

## 1. renderBeatPrep (T:12653-12683)
Called at T:12557 inside renderBeatPanel: `${beat.call ? renderBeatPrep(beat) : ''}` (read). renderBeatPanel starts T:12536.
Output is one `<div class="focus-act">` (T:12659). Order:
1. h5 "[time . ]Call prep[ . Session N]" + badge "prep notes logged"/"no prep notes" (T:12660). Always shown.
2. beatTranscriptSection(c) (T:12661). Hidden (returns '') when no logged past activity has transcript text (T:12640).
3. `bp-sec` "Pending deliverables" (T:12663-12669). Section itself always shown; inside: list of up to 5 unchecked checklist items from all activities (T:12655-6, 12665); "N more outstanding" link if >5 (T:12666); "This session should produce: ..." from next.template.deliverables (T:12667); fallback "Nothing outstanding." when both empty (T:12668).
4. `bp-sec bp-time` "Time on your calendar" time input (T:12671-12675). Always shown.
5. Buttons: Log this call / Session plan / Account brief (T:12677-12681).
No commitment content anywhere in it.

Pending deliverables, quoted (T:12663-12669):
```
<div class="bp-sec">
  <div class="lbl">Pending deliverables</div>
  ${pendingItems.length ? `<ul ...>${pendingItems.slice(0,5).map(i=>`<li>${escapeHtml(i.label)} <span ...>(${fmtDate(i.date)})</span></li>`).join('')}</ul>
  ${pendingItems.length > 5 ? `<p class="bp-basis">${pendingItems.length - 5} more outstanding - <button class="link-btn" ...>see them all</button></p>` : ''}` : ''}
  ${deliverables.length ? `<div class="bp-basis" ...>This session should produce: ${escapeHtml(deliverables.join('; '))}</div>` : ''}
  ${(!pendingItems.length && !deliverables.length) ? `<div class="bp-body" ...>Nothing outstanding.</div>` : ''}
</div>
```
beatTranscriptSection (T:12635-12648): picks newest logged past activity with transcript; label `Last transcript . Session N|type . date`; `<div class="bp-sec" data-beat-transcript-sec>`, `<div class="lbl">label</div>`, `<pre class="bp-transcript" data-beat-transcript>closingStretch(text,30)</pre>`, link "Read the full transcript". Returns '' otherwise.
renderBeatPrep's local scope has `c` (x.c) and `x` (beat.call), so a commitments section can call openCommitments(c) (T:12654).

## 2. Commitments
Record (normalizeCommitment T:3520-3528): {id, text (<=240 chars), direction 'i_owe'|'they_owe' (default i_owe), due ISO|null, doneOn ISO|null}. No other fields.
COMMITMENT_DIRECTIONS (T:3469-3472): i_owe label "I owe them"; they_owe label "They owe me". MAX_COMMITMENTS=30 (T:3473), COMMITMENT_SOON_DAYS=3 (T:3475).
Helpers: getCommitments T:3482; openCommitments = !doneOn T:3484; commitmentIsOverdue = open, real due, due < todayISO() T:3488; commitmentDueSoon = open, due 0..3 days ahead T:3489-3493. Import normalise T:5285, T:18727.
Readers: todayCoordinationCandidates T:11846-11864 (below); handoff text T:13089-13092 ("WE OWE"/"THEY OWE", "by <date>"); Coordination tab T:13694,13743-13765; tab count T:13830.
"Todos ~13751" is actually the Coordination tab (renderCoordinationTab T:13690). Sort (T:13694): open first, then due ascending, no-date last ('9999'); done ones kept, shown at opacity .55. Label line (T:13751): `You owe them` / `They owe you`, then ` . due <date>` or ` . no date`, then ` . done <date>` or ` . <N>d overdue` (red) or ` . due soon` (amber). Buttons Done/Reopen, Remove. No display cap beyond MAX 30 (add form hides at 30, T:13758). Empty text: "Nothing outstanding either way." (T:13757).
Already on Today/beat panel? Only indirectly: todayCoordinationCandidates (T:11846-11864) makes a Today row when overdue (severity top band) or due soon, with headline `Overdue: you owe - text` / `Due soon: text` and reasons `You owe: text (due date)` / `They owe you: text (due date)` (first 3). Reasons beyond the first 4 show in the beat panel "The other N drivers" (T:12563-12569); the evidence block uses beat.reasons. Open commitments with no/future-far date never appear. The beat panel has no commitment section of its own. (Whether Orion's SIM-OWE reasons render on the panel today is assumed no: D3 currently lists them absent in the evidence doc line 18.)

## 3. Sim
- D3 step: tools/sim/osm-day/steps-a.mjs:60-64. Wanted texts: 'SIM-OWE checklist', 'SIM-OWE you owe', 'SIM-OWE they owe', 'SIM-QUESTION' via checkTexts (steps-a.mjs:25, plain substring, case sensitive).
- orionPanel (steps-a.mjs:27-32): openOn(DAY='2026-10-21', steps-a.mjs:14), then panelText (steps-a.mjs:19-23): sets ui.todayFocusId, render(), reads `.day-pane[data-day-holds=<id>]` .textContent, whitespace collapsed. So any text inside the beat panel counts.
- Orion seeds, lib/setup.mjs:58-62: 'SIM-OWE you owe the sandbox walkthrough' i_owe due 2026-10-23; 'SIM-OWE they owe the data file' they_owe no date; 'SIM-D6 you owe the recap deck' i_owe no date; 'SIM-D6 they owe the access list' they_owe no date. All doneOn null. Plus a SIM-OWE checklist item on the 10-20 activity (setup.mjs:53-55).
- On Wed 2026-10-21 at D3: all 4 open; i_owe 2 (one due 10-23 = +2 days, so "due soon"; one undated), they_owe 2 (undated). None overdue. D6 (steps-a.mjs:115-134) runs after D3 and only closes the 'SIM-D6 you owe' one, so SIM-OWE items are untouched by D6. Order D1..D10 (PART_A) read.
- Field-test seed (tools/sim/steps/06-history.js:33-35): Orion o1 'Send deficiency-field mapping doc' i_owe due T-1 (overdue); o2 'Priya to confirm Q3 walkthrough owners' they_owe due T+2. 07-log-orion.js:11 marks the mapping-doc one done on logging. This is a different seed (field test), not used by the osm-day sim; it uses real wording, no SIM- prefixes.
- Break D3 (lib/breaks.mjs:9): wraps renderBeatPanel and does `.replace(/SIM-OWE[^<]*/g,'')`, i.e. removes "SIM-OWE" plus following text up to the next `<`. A new section inside renderBeatPrep is part of renderBeatPanel output so it would be stripped, PROVIDED the commitment text sits in a text node that starts with the commitment text (e.g. `<li>SIM-OWE you owe ...</li>`). Caveat: if the section prefixes the text on the same text node (e.g. `You owe them: SIM-OWE ...`) only from "SIM-OWE" onward is removed, which still removes the match; but if text is split by a tag between "SIM-OWE" and the rest (e.g. `<b>SIM-OWE</b>` fine) the remainder survives, harmless. Also the break strips SIM-OWE checklist and any SIM-OWE in the reasons list. SIM-QUESTION is not stripped by it (checked by test/osm-day-steps.test.mjs:135-141 shape).
- Other readers of commitments in the sim: D6 (steps-a.mjs:119-133, break breaks.mjs:12), run.mjs:85-86,110 (commitment-survival and doneOn invariant check, SIM-D6 exempt). No L-step in steps-b.mjs reads commitments (grep only hit is a GAP note at steps-b.mjs:465 about CSAT, not commitments).

## 4. "Meeting agenda" GAP
lib/results.mjs:9 `D3: 'meeting agenda'`; docs/evidence/2026-10-16-osm-day-lifecycle-sim.md:18 ("The meeting agenda is a listed GAP") and :95 ("D3: meeting agenda", under "GAP list (fixed list, no tracker feature exists)"). It asks only that a meeting agenda feature be noted as missing; no definition of what it should contain. A GAP does not change PASS/FAIL (results.mjs:19-20). Grep 'agenda' in tools/sim/osm-day finds only results.mjs:9. (Tracker T:4495 has copy telling the user to state the agenda out loud; not a feature.)

## 5. Tests
- test/d2-prep-transcript.test.mjs:75-145 pins renderBeatPrep (extracts renderBeatPrep and beatTranscriptSection with a vm context at line 78; assertions at 92, 125 on html around the transcript section). A new section must not break those; the test's vm context only grabs the listed functions, so a new helper called from renderBeatPrep (e.g. openCommitments, fmtDate) must be added to its grab list or stubbed, or the call will throw (assumed from line 78; check before editing).
- test/osm-day-steps.test.mjs:135-154 pins the D3 guard (SIM-OWE strip regex) and the D6 guard, using SIM-OWE strings only; no test pins the "You owe them"/"They owe you" wording (grep over test/ found none).
