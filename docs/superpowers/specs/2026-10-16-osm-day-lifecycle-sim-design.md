# OSM day and customer lifecycle: an end-to-end simulation. Design

Status: design sections 1 and 2 approved by Ian, 2026-10-16. The written spec awaits his review.
Targets: `osm-book-of-business-tracker-1.0.html` AND `osm-book-of-business-tracker-1.1.html`, same script. Neither file is ever edited.
Base: master f2ff9f8. Branch: `runway-day-sim` (worktree `.claude/worktrees/runway-day-sim`).
Roadmap gate: not applicable (`brain gate ... --project runway`: "NO ROADMAP for runway: proceed as before", exit 0).
Ledger: `.ledger/2026-10-16-runway-day-sim/progress.md` in this worktree (git-ignored).

Evidence labels: **measured** (run in this talk, 2026-10-16), **read** (from code or docs, not run; "checked" when I opened the source myself), **assumed** (reasoning only; each carries the check that settles it).

## 1. Why

Ian, 2026-10-16, asked "Have you simulated runs through all the aspects of the OSM day and a customer lifecycle end to end?" The answer was no. He wants to rely on the tracker daily. Its purpose, in his words: "a team moving off scattered spreadsheets, a delayed dashboard within Quicksight, having to click through Gainsight and find the right fields to update into one shared tool". The in-page self-checks (475/475) call app functions, mostly not the UI. No test walks a whole day or a whole customer life.

## 2. Ian's rulings (verbatim)

| Question | Ian's words | Effect |
|---|---|---|
| Q1 A real day: "what did you open first, and what were you trying to find out?" | "A full workday would start with me first finding out what calls I have today and to prepare for them. I would read where we are currently in the post-implementation phase and summary/notes/transcript from the last meeting with the customer. I would ensure that the agenda for the upcoming meeting is update with and status updates for deliverables and questions raised from last meeting. Then I would continue with the rest of the call either by enablement from the curriculum or assisting them with their reporting process which in doing so would cover the various  aspects of the curriculum sessions. Once the call is complete, then I would compile the recap email from the call that just finished and send that to the customer. Once all my calls are done for the day, I would as much as possible get to any and all deliverable and/or questions that have not been actioned or completed yet. Once that is complete then I would ensure that all my Gainsight Admin items are complete and populated. Next I would focus on risks and ensure all risks are actioned on and updated. After that is complete, then I would check-in with customers that are still in implementation ensuring that we receive the Sentiment Check in a timely manner. If there is anytime left after that I would work on my special projects such as this tracker and other assets for the Workiva AI initiative. Once a customer is about to be graduated, I would submit a google form internally to have a CSM assigned. Once the CSM assigned, I would schedule an internal sync with them to  provide details about the customer, implementation, and provide a hand-off document that the CSM can use for reference when it comes to those details previously mentioneed but also regarding the post-implementation activities we completed along with passing along a hand-over activity so that the CSM can show value immediately. Once that is done, then the graduation success plan in gainsight should be marked completed by hand which then triggers a CSAT survey to the customer as long as the CSAT Contact is populated correctly in Gainsight under Associated People within the Kick-off section of the onboarding success plan. Once the csat survey is sent then I would follow up with the customer to ensure they are able to provide feedback." | Part A steps D1-D10; Part B steps L10-L12. |
| Q2 Start of a customer's life | "Answer for about the start of a customer's life: I get an email that I've been assigned to a customer. It has now become our responsibility to setup an internal sync with the Account Executive that got the customer. Once we've had the sync, then I would sync up with the partner or implementation team to either do a joint Welcome/Kick-off call or I do the Welcome Call separately where I go over high-level the implementation, where I come in, the difference between CSM and OSM, that I will be mostly a fly on the wall with the implementation team managing the project at this point, and providing the training resources from our Learning Hub for them to take. We have begun "digitizing" this experience by creating a welcome call video that mentions the same while saving us time instead of us saying the same thing for every customer and wasting 30 mins-45 mins. We would however offer a "Getting Started" call to do a high-level walkthrough of the workspace. Once that is done, then I would join the implementation team's meeting with the customer as need or as much as possible to understand what is happening. Around the mid way point or when it gets closer to the end I would setup a sync with the customer to get the sentiment on the implementation. Once the implementation is done, then the partner does the hand-off call with the customer to hand them over to me where we would begin the post-implementation activities." | Part B steps L1-L5. |
| Q3 Is the Sentiment Check the same as Gainsight's Readiness Assessment? | "It is the same. The feedback from OSMs have been that doing the sentiment check or readiness assessment around the midway point doesn't hold up since some customers are not ready to give that feedback until towards the end of the implementation. Transparently most OSMs collect this information during post-implementation even though intially we were requested to get this during implementation." | 1.0's gate opening at Go-Live matches practice: D9 and L4 expect no ask during implementation. Not a defect. |
| Q4 How a risk appears | "Most of the risks I personally deal with are Low Engagement. After implementation I sometimes never hear back from customers. Since I don't have a good way to track this, transparently I have to play catch up and try to find accounts that have drifted because I haven't followed up with them enough. Since I am supporting sustainability, I have customers that report to CSRD. With the Omnibus ruling, some customers have paused their implementation or have not reached back out. I need a way to catch customers before they drift from me not reaching out in a timely manner. There are other risks but I would have to find out what they are. The only other ones I know if is if the product doesn't behave as expected from what was scoped and no partner/no service." | L6 (drift), L7 (CSRD pause), L8 (scope risk). |
| Q5 Hand-off call Mon 5 Oct, then silence: latest day for a tap on the shoulder? | "Within a week of the hand-off call" | L6 pass line: on Today by day 7 after the hand-off. |
| Q6 CSAT contact: Kick-off section or Graduation (Handoff to CSM Call)? | "it looks like both but prioritize the Graduation Success Plan > Graduation (Handoff to CSM Call) > Associated People" | 1.0:13547 already names that place. Not a defect. |
| Q7 Other Gainsight admin | "Timeline entry after the call, closing a CTA, updating a success plan task, and now Renewal Forecast Scorecard." | D7 checks the timeline entry; three GAPs (section 5). |
| Q8 Which version? (recommended both) | "yes, both with the same script" | Both versions, one script. |
| Q9 AI handling (recommended fake network) | "yes, fake the network in every run" | Fake AI network every run; a real-provider check only on Ian's say-so. |
| Design section 1 (steps D1-D10, L1-L12, PASS/FAIL/GAP) | "yes, that covers my day and the lifecycle" | Section 4. |
| Design section 2 (how it runs, breaks, fixes, scope) | "yes" | Sections 3, 6, 7, 9. |

## 3. Evidence

| Fact | Label | Value / source |
|---|---|---|
| Tracker fingerprints | measured | 1.0: 1,256,628 bytes, sha256 begins `a21ca8c34c9c0859`; 1.1: 1,281,558 bytes, `b247a93cd5044165` (re-measure at plan time) |
| Field-test steps 01-07 run unchanged on both versions | measured | Identical on 1.0 and 1.1: 34 accounts, 34 with ARR, 74 fields backfilled, Off Track 2 / Watch 14 / On Track 18, 4 in implementation, session 8 logged + promise closed. Scratch copy of `tools/sim/run-field-test.mjs` with the target as a variable |
| A fake clock moves the tracker's "today" | measured | Date replaced by `Page.addScriptToEvaluateOnNewDocument` before load: `todayISO()` matched 3 of 3 dates (2026-10-05, 10-12, 11-20) on both versions; a saved setting survived each day reload; control without the shim gave the real date 2026-10-16 on both; 0 page errors |
| A fake AI network runs the tracker's real AI code | measured | CDP `Fetch` interception of the three provider hosts, answered in each provider's wire format: 3 of 3 (Anthropic, OpenAI, Gemini) parsed by `callAiAPI` on both versions, after the browser's CORS preflight; control (interception off, offline) gave "Network error reaching generativelanguage.googleapis.com" |
| Profile leak in the field-test runner | measured | Deleting the profile straight after `taskkill` (pattern of `tools/sim/run-field-test.mjs:36-37`) left 2 of 2 spike profiles behind; wait-and-retry left 0 in 2 runs. One `fieldtest-*` folder from an earlier run remains in Temp (not this talk's; left alone) |
| Step 99 is stale | measured | `tools/sim/steps/99-measure.js:38` calls `getImpactLog()` and `impactMinutesFor`; 0 hits for `getImpactLog` in 1.0 and 1.1; retired in commit c9208d6 "A5: retire time-saved (R6)" |
| The tracker has no clock seam | read, checked | `todayISO()` returns `localDateISO(new Date())` (1.0:5740) |
| Drift rules | read, checked | Watch at 10 days since last touch, Off Track at 21 (1.0:5386-5387, :6394-6403); "due soon" when the next session is due within 7 days by pace and nothing is booked, "neglected" at 21 days (1.0:6630-6646); default pace 14 days with no sessions logged (:5388, :7266-7269) |
| Paused accounts are never flagged for silence | read, checked | 1.0:6388-6391; pause holds through its `until` day (:5840) |
| No risk or coverage signals during implementation | read, checked | `computeRisk` returns on track (1.0:6383); `computeCoverage` returns null (:6631); outcome plan, CSAT and sentiment gates open at Go-Live (comment :6100-6103) |
| Gainsight checklist after an activity | read, checked | Call: "Log call summary in Gainsight timeline", "Update Last Touchpoint field", "Adjust health score if sentiment changed"; CTA items only on EBR, Milestone Review, Risk / Escalation; Partner Sync and Implementation Note carry none (1.0:3154-3166) |
| Recap email exists only through the AI | read, checked | "Draft email recap" and "Copy email" under the call review (1.0:14542, :14546) |
| CSAT contact place | read, checked | 1.0:13547 "Associated People added for CSAT survey — Graduation Success Plan > Graduation (Handoff to CSM Call) > Associated People"; gate key `associatedPeopleCSAT` (:6144) |
| AI provider follows the chosen model; key in the browser | read, checked | `aiProviderFor(settings.model)` (1.0:2109), key in localStorage `obm-ai-settings-v1` (:1711-1717); endpoints :2125, :2160, :2200 |
| Screen and function per job, 1.0 | read (helper, 2 spot-checked) | `.ledger/2026-10-16-runway-day-sim/probe-1.0-map.md`, `probe-2-gaps.md`. The helper missed `showWrapUpModal` (defined at 1.0:17325) |
| 1.1 is 1.0 shifted, same function names, for the probed items | read (helper) | `probe-2-gaps.md`. Check: the first run on both versions |
| Every model name in the tracker's list is still accepted | assumed | e.g. `claude-sonnet-5` (1.0:1706) unconfirmed. Settles only with a real call: out of scope (section 9) |

## 4. The steps

The book is 35 accounts like Ian's: the field test's 34 synthetic accounts plus one new synthetic CSRD sustainability customer, "Fernhollow Renewables" (contacts on `example.com` only), added through "Add customer". Part A and Part B each run in their own fresh throwaway profile, so a failure in one never blocks the other.

Each step names its PASS condition and its **break**: one tracker behaviour switched off inside the throwaway browser (a runtime override of one named function, or a changed fake AI reply). With the break on, the step must FAIL. The plan names the exact override for each step after a read-only probe; this table names the behaviour the break must remove.

### Part A: one full day (fake date Wednesday 2026-10-21; 35 accounts)

| # | Ian's step | PASS when (seen on screen; saved data may be a second assertion) | Break must remove |
|---|---|---|---|
| D1 | Find today's calls | Today lists exactly the calls the setup booked for that date | the calls-today list (`callsScheduledToday`) |
| D2 | Prep for the 10:00 call | The Prep panel shows the session position, last meeting's notes and transcript, and the open deliverables and questions | the prep panel content (`renderBeatPrep` / `callsToPrepare`) |
| D3 | Update the agenda | GAP (no agenda). Still checks the Prep panel lists the open deliverables and last meeting's questions an agenda needs | the open-commitments list on the Prep panel |
| D4 | The call | The call is logged from the account's Log tab ("Log activity"), with a pasted Gong transcript and a linked curriculum session, and appears in the account's history | the transcript on save (the activity keeps no transcript) |
| D5 | Recap email | After the AI call review (fake network), "Draft email recap" shows, and after "Copy email" the clipboard (read back through CDP with clipboard permission granted to the throwaway profile) holds that recap text | the email part of the fake AI reply |
| D6 | Open deliverables | Marking a "You owe" item Done closes it; a "They owe" item stays open | the close action on a commitment |
| D7 | Gainsight admin | The call's "Log call summary in Gainsight timeline" item is in the Gainsight queue, and sending the queue marks it sent | queueing (`queueGainsightItem`) |
| D8 | Risks | A Risk tab case marked actioned leaves the open list | `markRiskActioned` |
| D9 | Sentiment | An account in implementation is not asked for the Readiness Assessment; a post-Go-Live account is, and recording it ("Mark logged") clears the ask | the implementation check (`inImplementation` forced false, so implementation accounts get asked) |
| D10 | Wrap-up | Closing the day records the day as closed, and Back up produces a download holding 35 accounts | the export (`exportData`) |

### Part B: one customer's life (the fake clock jumps)

Calendar (2026 unless marked): L1 Mon 08-03; L2 Wed 08-05; L3 Wed 08-12; L4 Build Mon 08-24, UAT Mon 09-21; L5 hand-off call Mon 10-05 (Ian's Q5 example; logged as a Call activity that day, not linked to a curriculum session); L6 checked every day 10-06 to 10-26 (days 1-21); L7 an Email logged 10-26 records the customer's CSRD Omnibus pause until Mon 11-30, checked every day 10-27 to 12-01; L8 Wed 12-02; L9 weekly sessions from Mon 12-07 to the end of the plan, graduation date committed at the first of them; L10 and L11 on the days the plan derives from the committed date (the plan probes the graduating-soon window first).

| # | Ian's step | PASS when | Break must remove |
|---|---|---|---|
| L1 | Assignment email | "Add customer" creates the account, in implementation (phase Align) | the add-customer save |
| L2 | AE sync | Handoff tab fields saved and shown after a reload | `setHandoffField` |
| L3 | Welcome / Kick-off | Phase moves to Kick-Off; a Partner Sync activity is logged with no Gainsight checklist | the empty checklist for Partner Sync (given a checklist item) |
| L4 | Implementation meetings | Phases Build then UAT; on each of those days the account is On Track and no Readiness Assessment is asked | the implementation check (`inImplementation` forced false) |
| L5 | Partner hand-off call | Go-Live is recorded; the session plan appears and the account counts as onboarding | the Go-Live phase change |
| L6 | Silence after the hand-off | With no contact and nothing booked, the account first appears on Today on day 7 or earlier after the hand-off. The run also records the first day it shows Watch and Off Track | the coverage rule (`computeCoverage` returns null) |
| L7 | CSRD Omnibus pause | Paused with an end date: not on Today for silence on any day of the pause; on Today again on the first day after it | the pause check (`isPaused` forced false) |
| L8 | A risk appears | A logged note saying the product does not behave as scoped creates a Risk tab case; actioning it clears it from the open list | risk-text detection (`classifyRiskText`) |
| L9 | Sessions through the curriculum | Sessions logged at pace; Readiness Assessment, CSAT contact, Success Outcome Plan and graduation date all recorded as done | the compliance gate toggle |
| L10 | About to graduate | The account shows as graduating soon; the Handoff tab's "Copy packet" and "Download .txt" both produce the packet. GAP: the CSM request (Google form) | `isGraduatingSoon` |
| L11 | Graduation | Graduation is refused without a CSAT contact; with one it confirms, the account becomes Graduated, and the graduation event is in the Gainsight queue | the CSAT requirement in graduation validation |
| L12 | CSAT follow-up | GAP: nothing tracks survey sent or answered | none (GAP only) |

## 5. Results and the fixed GAP list

Each step ends PASS, FAIL or GAP. The GAP list below is fixed by this spec; a step not on it cannot report GAP at run time, so a broken step cannot hide as a gap:

- D3: meeting agenda.
- D7: closing a CTA after an ordinary call; success plan task updates; Renewal Forecast Scorecard.
- L10: the CSM request (Google form).
- L12: CSAT survey sent / answered tracking and follow-up.

A step that carries a GAP and also a check (D3, D7, L10) reports its check's PASS or FAIL, with the GAP noted beside it.

Break pass: every step with a check (21 of 22; L12 has none) runs again with its break on and must report FAIL. A step that still passes is VACUOUS.

Exit: 0 when every step is PASS or a listed GAP and every break flipped; 1 on any FAIL or VACUOUS; 2 on a harness failure (browser, page, setup).

## 6. How it runs

- One command: `node tools/sim/osm-day/run.mjs` runs Part A and Part B on 1.0, then on 1.1 (flags to pick a version, a part, or skip the break pass). Same step code for both versions; where a version needs a different path, the step branches on version and the report says so.
- Each part: a fresh throwaway headless Chrome profile (`--user-data-dir`), the fake clock installed before load, the fake AI network for the three provider hosts only (the XLSX library still loads from cdnjs, as today). Browser stopped by its own PID; profile deleted only after the browser has exited (wait and retry).
- Setup builds the book the way the field test does (Excel import, value import and backfill through the UI; history written directly, labelled setup). Steps then click and type by visible labels, as Ian would.
- Output to a run folder (git-ignored): a report per version (each step: PASS/FAIL/GAP/VACUOUS, the on-screen evidence, the day it ran), a 1.0-vs-1.1 view listing steps whose result or evidence differs, a JSON copy, and logs. Nothing is printed beyond a summary line per step.
- The harness's pure parts (result rules, the GAP rule, exit code, report and version diff, the fake-clock and fake-reply builders) get `node --test` unit tests in `test/`.

## 7. Fixes that come with it

- F1: `tools/sim/run-field-test.mjs` deletes its profile only after the browser has exited (wait and retry). Check: a field-test run leaves 0 new `fieldtest-*` folders in Temp.
- F2: `tools/sim/steps/99-measure.js` drops its time-saved lines (the retired `getImpactLog` / `impactMinutesFor`), so the field test runs to the end again. Check: the field test exits 0 and prints its metrics on both versions.

## 8. Checks (each with its prediction and what disproves it)

| Check | Prediction | Disproved by |
|---|---|---|
| C1 Part A on both versions | D1-D10 PASS on 1.0 and 1.1 (D3, D7 with their GAP notes) | any FAIL. A FAIL is a finding about the tracker, reported to Ian, not fixed in this run |
| C2 Part B on both versions | L1-L11 PASS, L12 GAP | any FAIL, as above |
| C3 L6 drift line | (assumed, from 1.0:6630-6646 with a 14-day default pace) "a session coming due with nothing scheduled" appears on Today on exactly day 7 (hand-off 10-05 + 14-day default pace = due 10-19; 7 days before = 10-12), the edge of Ian's line; Watch no later than day 10; Off Track on day 21 | first appearance on day 8 or later: L6 FAILs on Ian's ruling. Also disproved if "due soon" does not show on Today at all |
| C4 Every break flips | 21 of 21 checked steps FAIL with their break on, on both versions | any VACUOUS step |
| C5 Same result twice | Two runs in a row give identical reports apart from timings | any other difference (a flaky step) |
| C6 No leftovers | 0 new profile folders in Temp, 0 browsers left running (by the PIDs the run started) | any leftover |
| C7 F1 and F2 | Field test exits 0 with metrics on both versions; 0 new `fieldtest-*` folders | exit 2, or a leftover folder |
| C8 Trackers untouched | sha256 of both tracker files equals the plan-time values after the run | any change |
| C9 Unit tests | `node --test test/` passes; each new unit test failed before its code existed | a failing or never-red test |

## 9. Scope

In: the simulation (Parts A and B, both versions, break pass, report), its unit tests, F1, F2, an evidence doc with numbers (`docs/evidence/2026-10-16-osm-day-lifecycle-sim.md`), README lines saying how to run it.

Out: building any GAP feature; any change to 1.0 or 1.1; real AI provider calls (a model-name check is a later step, only on Ian's say-so); Ian's real book, restore points, exports or zips; the onboarding guide; moving a book from 1.0 to 1.1; time-saved or click-count measurement; recording sentiment during UAT (noted from Q3, not built).

Safety: never edit `osm-book-of-business-tracker-1.0.html`; headless Chrome with a throwaway profile only, never Ian's Chrome profile; synthetic data only (field-test book, `demo-seed.js`, `tools/step1-fixture.js`), test emails on `example.com` or `.invalid`; never read or copy `book-of-business-RESTORE-POINT-*.json`, exports or zips; stop browsers and servers by their own PID; logs to files.
