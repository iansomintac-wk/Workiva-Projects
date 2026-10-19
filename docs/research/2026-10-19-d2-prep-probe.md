# D2 prep probe: can the call-prep panel show the last call's transcript?

Date: 2026-10-19. Branch `runway-d2-prep` (from master 1817d2c). Read-only: no tracker edits.

**Labels.** measured = run by me in this session, numbers from the command named. read = taken from the code or a file, not run. assumed = reasoning only, with the check that would settle it.

## 1. Where 1.1 builds the call-prep panel

- `renderBeatPrep(beat)` at `osm-book-of-business-tracker-1.1.html:12622` builds the "Call prep" block: heading (time, "Call prep", "Session n", prep-notes badge), pending deliverables, "Time on your calendar", three buttons. It shows no transcript and no note. (read)
- It is called from `renderBeatPanel` (1.1:12522), line 12543, after `renderBeatStanding(c)` (1.1:12406) and `renderDayBriefFor(c)`. (read)
- `renderBeatStanding` already shows the last note: "Last <type> · <date> · Session n", an extract of the note cut at 260 characters (`trimToLength(..., 260)`), and "Read the full note". This is where `SIM-LASTNOTE` comes from. (read)
- House rule in the same file, `beatOutstanding` comment: "Empty text when there is nothing outstanding, so the row hides rather than printing a zero." (read)

## 2. Is the transcript reachable there?

- Yes, synchronously. `activityTranscript(activity)` (1.1:2944) returns `{text, truncated}` from the in-memory `_transcriptMap` for a 1.1 `{ref}` record, or the inline `{text}` for an old record. (read)
- The map is filled by `loadTranscriptMap()` (1.1:2960), awaited at the end of the load (1.1:5791) before `__loadDataMs` is set. That the first Today render comes after it is assumed; check: a headless run of the fixed sim, D2 PASS on 1.1 on the first open of the day.
- The sim seeds the D2 transcript inline (`tools/sim/osm-day/lib/setup.mjs:55`, `{text: 'SIM-TRANSCRIPT-LINE Priya: ...', truncated:false}`); 1.1 moves inline transcripts to IndexedDB at load (`scheduleTranscriptMove`, 1.1:3078). Either form is read by `activityTranscript`. (read)
- AI session debriefs are not saved on the activity: `ui.sessionDebriefs` is transient (1.1:8690 comment, 1.1:14961). So "show the debrief's next steps" would need debriefs saved first. (read)

## 3. What a real-length transcript does

Source: the four realistic call transcripts in `tools/step1-fixture.js` (`window.STEP1_CALLS`), measured with `tmp/ts-probe.js` and `tmp/ts-probe2.js` in this session's job folder.

| # | chars | lines (non-empty) | speech lines | literal last line | first speech line |
|---|---|---|---|---|---|
| 0 | 157,060 | 2,030 | 1,014 | "Bye! Okay, stopping the recording." | "okay I think it's recording now..." |
| 1 | 30,906 | 314 | 156 | "Thanks, Owen. Bye, all." | "Okay, I think the recording's going..." |
| 2 | 41,160 | 518 | 258 | "Bye, everyone. Have a good rest of the week." | "Hi, hi, good morning..." |
| 3 | 38,155 | 452 | 225 | "Bye bye. That's the end of the recording." | "Okay, I think we're recording..." |

(measured)

- The literal last line is a goodbye in 4 of 4; the first speech line is recording chatter in 4 of 4. Neither is worth a line on the panel. (measured)
- The last "substantive" line (8+ words, no thanks/bye) is still small talk in 4 of 4 (e.g. "Have a lovely weekend, everybody..."). (measured)
- Lines with commitment words (we'll, I'll, send, next session, by Friday...) number 25 to 145 per call: too many to pick one. (measured)
- A wrap-up marker (round-up, before you go, from my side, next session, action items...) first appears 5, 7, 27 and 28 speech lines from the end; all 4 inside the last 30. Caveat: I wrote the marker list while looking at these same 4 transcripts, so it is fitted to them, not tested on new ones. (measured, fitted)
- Size of the closing stretch: the last 10 / 20 / 40 speech lines are 677-1,245 / 1,721-2,884 / 4,315-6,171 characters. (measured)
- The last 30 speech lines (window chosen in the talk, Q1): per call #0-#3: 4,032 / 4,442 / 3,114 / 2,841 chars; with the "Name  hh:mm:ss" speaker lines kept, 4,725 / 5,149 / 3,832 / 3,526 chars in 59 raw lines each. The wrap-up marker is inside the 30-line window on 4 of 4. A 20-line window would miss it on 2 of 4 (27 and 28 lines from the end); the proxy caught that. (measured, `tmp/ts-probe2.js`)
- The field-test book (`tools/sim/run-field-test.mjs`, 34 accounts) seeds no transcripts: `grep -c transcript` on the builder = 0. So on the field test the new section is hidden on every account. (measured)
- Showing the whole transcript on the panel would put up to 157,060 characters into the beat panel. That this is unusable is assumed; check: headless render with fixture #0 seeded, panel height in pixels.

## 4. Sim steps and breaks that touch D2

- Step D2, `tools/sim/osm-day/steps-a.mjs:53`: the Orion beat panel's text must contain `Call prep`, `Session`, `SIM-LASTNOTE`, `SIM-TRANSCRIPT-LINE`, `SIM-QUESTION` and `Sessions n / total`. Last measured result on 1.1 (`runway-gone-quiet/sim-runs/verify-2026-10-19T07-21-56-629Z/run1/results-1.1.json`, read just now): FAIL, "absent from panel: SIM-TRANSCRIPT-LINE"; only that one text is missing.
- Step D3 reads the same panel (`orionPanel`), so a change to the panel can move D3. (read)
- Break D2, `tools/sim/osm-day/lib/breaks.mjs:8`: `renderBeatPrep = () => ''`. Today C4 marks it NOT-TESTED because the base FAILs. Once D2 PASSes, the break removes "Call prep", so it should flip. If the transcript text is placed inside `renderBeatPrep`, the break also removes it. (read; assumed it flips, check: C4 after the fix)
- `OVERRIDE_NAMES` (`breaks.mjs:32`) needs `function renderBeatPrep(` to stay a plain function declaration in both trackers. (read)
- C8's 1.1 hash pin lives in `tools/sim/osm-day/verify.mjs` (now `ab3f2490...`); any 1.1 edit re-pins it. (read)
- 1.0 is never edited, so D2 stays FAIL on 1.0 and the 1.0 lines stay identical. (read)

## 5. What this means for the spec

A literal "last transcript line" would PASS the sim (its seed transcript is one line) and help nobody on a real call. Any real choice is between: a bounded closing stretch of the transcript, a heuristic pick of wrap-up lines, a link only (the sim check would change), or saving the AI debrief and showing its next steps (larger change). These are the options put to Ian.
