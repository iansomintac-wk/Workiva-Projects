OSM Runway 1.0 — Book of Business Tracker + Onboarding Guide
============================================================

A working prototype. Two single-file HTML apps that run from your own machine
with no build step, no account, and no server required (an optional local
connector can be run; see connector/CONTRACT.md).

  osm-book-of-business-tracker-1.0.html   the tracker
  osm-runway-onboarding-1.0.html          the onboarding guide
  CHANGELOG.txt                            what 1.0 is
  VALIDATION.txt                           what was verified, and what was not
  guide-manifest.json                      machine-readable bundle record
  gainsight-import-template.csv            column template for Gainsight import
  demo-seed.js                             optional demo book, for evaluation


Running it
----------
1. Keep the files above in one folder.
2. Open osm-runway-onboarding-1.0.html in a modern browser (Chrome or Edge
   recommended — automatic backup needs the File System Access API).
3. Use "Open tracker" to launch the tracker in a new tab.

Both files also open directly from file:// with no internet connection. The AI
Copilot features are the exception: they send a prompt to an AI provider
(Anthropic, OpenAI or Gemini) either from the browser with a key entered in
Settings or through the optional local connector, and need a network
connection. Everything else works offline.

Hosted: the 1.1 tracker can also be served from a company-sign-in site. Running
node tools/build-site.mjs makes site/ (two files); docs/HOSTING.md says what a
host must provide. Nothing here publishes anything.

Day and lifecycle sim (dev tooling, not part of the bundle): node
tools/sim/osm-day/run.mjs [--version 1.0|1.1] [--part A|B] [--only D5,L7]
[--no-breaks] [--out <dir>] drives a headless Chrome through one OSM workday
(D1-D10) and one account's lifecycle (L1-L12) on a fake clock with fake AI
replies, then breaks each checked step on purpose to prove the check can fail.
Each run writes sim-runs/<stamp>/ (git-ignored): report-<v>.md, results-<v>.json,
diff.md, run.log and times.txt. Exit 0 = every step passes (or is a listed
gap) and every break flips it; 1 = a finding (FAIL, VACUOUS or NOT-TESTED);
2 = the harness failed (missing step, a guard tripped, an AI request escaped
the fake). A line marked PARTIAL comes from a run with --part, --only or
--no-breaks, so it does not cover the whole inventory. It never edits a tracker.


What the tracker does
---------------------
Keeps an OSM's book of business in one place and turns it into a day's work.

  Today       One timeline whose axis is the workday. Calls are the day's fixed
              points; ranked work fills the gaps between them; admin collects
              into a close that pushes to Gainsight in one go. One account gets
              exactly one beat, carrying every reason it surfaced.
  Accounts    List, table, kanban and gantt views over the same book, with a
              per-account runway strip, health and risk scoring, domain
              assessment, session logging, and a graduation model.
  Risk        Open risks with executive summaries and inline next steps.
  Copilot     The read on the whole book: what moved this week, what lands
              this month, patterns across accounts, plus an optional AI read
              of the same. Per-account AI next actions live on Today (Brief my
              day). AI needs a key or the connector.
  Handoff     Sales intake and the CSM knowledge-transfer packet.
              The field set here is PROVISIONAL — a product open question.
  Settings    Thresholds, Gainsight CSV import, export/import, and automatic
              backup to a file you choose.
              In 1.1, Today also shows a "gone quiet" row at the top band: 7 days after the hand-off
              call with nothing logged since, or on the day a customer returns from a pause with
              nothing logged since. Any logged activity stops it.
              In 1.1, Today also shows a "CSAT follow-up" row when a CSAT survey was sent 7 or more days
              ago (assumed; constant CSAT_FOLLOWUP_DAYS) and no answer date is recorded.
              Record the two dates in the CSAT block of the call panel ("Survey sent", "Answered").
              In 1.1, Call prep also shows the closing 30 speech lines of the newest transcript on the
              account, in a scrolling box with a Read the full transcript link; hidden when there is none.
              It also shows a Promises section: the account's open commitments, up to 5, most urgent
              first, grouped You owe then They owe you, with a link to the Coordination tab for more.


Where your data lives
---------------------
In your browser's localStorage, under the key obm-data-v1. Not in a cloud, not
on a server, not in anyone else's account.

There is no automatic cloud backup. What there is:

  - Export JSON, any time, to a file you keep.
  - Automatic backup (Settings): pick a file once and the tracker writes the
    book to it whenever the book changes, debounced to four seconds. The payload
    is identical to Export JSON and restores through Import JSON.

Be clear about the limit of that second one: browsers will not let a page hold
write permission to disk across sessions without a user gesture, so in practice
it is ONE CLICK PER SESSION, not one click per backup. The header tells you
which state you are in and says so loudly when the backup is paused.

The guide keeps its own progress — chosen path, checklist, challenge answers,
reading mode — in separate osm-guide-* keys. It never reads or writes the
tracker's data.


Graduation plan
---------------
Graduating an account now rests on a goal the OSM wrote down, not on a session
count alone.

  Goal        Each account has a primary goal on the Overview tab: what the
              customer is trying to get done (publish a report, stand up a
              program, set up for the next cycle). The hand-off and first-value
              notes are offered as a hint to copy from, never auto-filled.
  Gates       A goal carries readiness gates, copied in when it is created and
              editable per account (tick, note, rename, add, remove). The
              defaults for each module live in Settings -> Graduation gates.
              Financial Reporting (5/5/3/3) and GRC (5/5/3/0) ship default
              gates too (schema 15, see below); where a list is empty (GRC
              disclosure submission, or one you emptied), a goal there is
              judged by the OSM's verdict and the packet says "0 gates"
              rather than inventing a checklist.
  Change goal Changing the primary goal closes the old one as replaced, keeps
              the reason, and carries over only gates that were already done
              with identical wording. The signal "goal_changed" then asks you
              to confirm the target graduation date against the new goal, and
              clears when you mark it checked.
  Graduating  The stage change to Graduated opens a confirm: a verdict (met,
              partly, not met) and a note. "Met" with open gates asks for a
              note saying why that is acceptable; it never blocks. A
              graduation with no goal needs an explicit "no goal recorded"
              choice or a new goal written there and then. The signal
              "ready_to_graduate" fires when a target date is set and every
              gate of the primary goal is done (or the verdict is already met).
              With no CSAT contact marked added, the confirm box also says so;
              it never blocks.
  Early exit  If planned sessions were never held, the confirm asks for an exit
              reason (Goal met early, No more enablement needed, Paused or at
              risk, Other) and records those sessions as not needed. Every
              tally and bar then reads held of held (5/5, not 5/6). The exit
              applies only while the account is graduated: re-open it and the
              stored exit is kept but ignored, so it reads held of planned
              again (5/8) until it graduates again.
  One Document The knowledge-transfer packet now opens with a GOALS section: the
              goal, verdict, gates (done of total, and which are open),
              criteria, any goal change ("Changed <date>: old -> new, because
              <reason>."), the early exit with its reason, and the graduation
              check-back. A graduation with no goal reads "No goal recorded.";
              one from before goal tracking reads "Graduated before goal
              tracking."
              The log form's "Session # (of N planned)" deliberately shows the
              raw curriculum total, not the early-exit planned total.
              The Excel import bypasses the graduation confirm (approved plan
              choice P1): an account imported as Graduated has no verdict or
              graduation marker, and with no goal its packet reads "Graduated
              before goal tracking."
  Gainsight   Goal created, changed and verdict events queue "Success Plan
              objective" items in the local Gainsight queue. Nothing is sent.

Opening an older book migrates it to schema 16 in place (no goals, no exits, no
invented verdicts). Export JSON first: schema 16 is not readable by an older
build.

Schema 16 (connector groundwork): a queued Gainsight item now carries status
(queued / sent / failed), fields, externalId, sentAt and error, and an old
prose-only item opens as queued; an activity may carry a Gong call link (gong)
and an account a Gainsight pull (gainsight) once something writes them, and
neither is added to existing records; a stakeholder may carry an optional email
(Coordination tab). Nothing sends yet.

Default gates for Financial Reporting and GRC (ruling M3, schema 15): Financial
Reporting ships 5/5/3/3 gates and GRC 5/5/3/0 (publish / set up next cycle /
program / disclosure), the lists in docs/superpowers/drafts/2026-10-01-fr-grc-gates-DRAFT.md.
They are defaults only: edit them per book in Settings -> Graduation gates.
Opening a schema 14 book fills only the lists that are empty; a list someone has
typed, other modules, and the gates already copied into an existing goal are
never touched. GRC disclosure submission stays empty.

Running the graduation checks headlessly (needs Chrome or Edge):

  node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475
  node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html \
       --seed demo-seed.js,tools/graduation-scenarios-seed.js \
       --fn runGraduationScenarios --verbose --expect 6
  tracker 1.1:  node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 483
  step 0 probe: node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step0-probe.js --fn step0Probe --expect 34
  step 1 probe: node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step1-fixture.js,tools/step1-probe.js --fn step1Probe --expect 65
  step 1 cold start (C8): node tools/step1-coldstart.mjs
  tools/selfchecks-1.1.js is the 1.1 copy of the suite (475 checks plus 5 gone-quiet checks; three edited, see CHANGELOG).

The second runs six end-to-end scenarios (A3-A8) and prints the measured value
for each. --seed takes a comma-separated list, run in order; --verbose also
prints the passing checks with their detail. Migration dry runs:
node tools/migration-dryrun.mjs osm-book-of-business-tracker-1.0.html --from 13
(and --from 14, --from 12).


Connector (Stage B)
-------------------
connector/CONTRACT.md defines the HTTP+JSON contract v1 the tracker will use for Gong, Gainsight and
AI (schemas in connector/schemas/). Only FAKE fixtures exist (connector/fixtures/, and gainsightIds
GS-DEMO-001..017 in demo-seed.js); no real adapter is built and nothing is sent anywhere. Contract
tests: node --test --test-reporter=tap "connector/test/*.test.mjs"

Run it (task B2): node connector/server.mjs starts it on 127.0.0.1:8787 (127.0.0.1 only), creates
connector/token.txt on first start and prints the token; paste the token into the tracker once. Delete
the file to rotate. connector/config.json and token.txt are git-ignored. Gong and Gainsight adapters are FAKE.

"Check for calls" (task C-3): with a connector set up, the header has a Check for calls button. It asks the
connector for calls since the last time you added some (30 days back on first use; kept for the session only) and
opens a review: calls matched to an account (by Gainsight id, then exact account name, then a stakeholder email; a
match that fits two accounts is skipped, never guessed), calls with no account (pick one yourself), and calls already
in the tracker. Every confirm box starts unticked; "Add N confirmed" writes one activity per ticked call (your title
as the summary, the transcript stored, a link to the Gong call). An email-kind call is logged as an Email and, like
any Email, Partner Sync or Implementation Note, never takes a session number, in this review or in the log form (the
log form now clears and locks Session # when you pick such a type). With no connector the button is not shown; with a
connector that is not running it says so in a message and changes nothing.

"Refresh from Gainsight" (task C-4): next to Check for calls, the header has Refresh from Gainsight (also only with a
connector set up). It reads the Gainsight accounts through the connector and opens a review of the accounts that
carry a Gainsight id the tracker knows (no id, no match, nothing pulled; those accounts are listed as not linked). For
each difference it shows "Gainsight says X" beside "tracker has Y" for tier, ARR, renewal date, CSM owner and contacts,
and offers to mark a gate done when Gainsight shows it done and the tracker's gate is still open. Every box starts
unticked and "Update N ticked" writes only the ticked rows: tier, ARR and renewal date overwrite that field; ticked
contacts only add people the account does not have (never edit or remove one); a ticked gate is marked done today. The
CSM owner is shown only (the tracker has no such field). A blank in Gainsight never erases your value. Stage, goals,
verdicts, notes and scores are never written. The Gainsight values from the last update are kept on the account. The
spreadsheet value import in Settings is unchanged.
"Send to Gainsight" (task C-5): with a connector set up, the Gainsight queue on the Risk tab has a Send to Gainsight
button. It sends only the items that are not yet sent, in one request, and marks each item by the connector's answer:
sent shows "sent" and the id Gainsight returned; failed shows the error and a Retry button (Retry sends just that
item). Some can succeed while others fail. An item is never marked sent without an id from the connector, a sent item
is never sent again, and a failed or offline push leaves the item in the queue. If the connector does not answer within
15 seconds, the tracker says the items may have been sent (check Gainsight before sending again), leaves them queued and
does not retry; the connector treats a repeated item id as the same item, so a second Send does not create a duplicate. Every queued item now also carries
structured fields for its kind (the gates for a Pending items batch, the objective for a Success Plan objective, the CTA
name, reason and severity for an At-Risk CTA, the outcome for a Success Outcome Plan). Without a connector nothing
changes: the button is not shown and Copy all & queue, the paste text and Export queue (JSON) work as before. The day
close shows "Sent to Gainsight today", counted from items marked sent today. Items already queued before this change
carry no fields and are sent with empty ones.
"Brief my day" (task C-6, ruling R4 "Today per-account, Copilot = book read"): with an AI key or a connector set up,
Today has a Brief my day button. One request (task brief_my_day) sends one line per open account, its real name and
the tracker's own signal reasons, and asks for one next action plus any drift or risk flags, each with a reason. An
action or flag without a reason, or for an account not in the book, is dropped and counted. The result shows on each
account's line on Today, in its beat panel and in its Overview, marked AI; it is advisory and kept for the session only
(nothing is written to the book). The ranked day is unchanged and needs no AI. A truncated answer shows the usual
length-cap note. With no key and no connector the bar is not shown. Copilot no longer keeps its own copy of the Needs
Attention list, and its AI read now asks for patterns across accounts and what moved this week, not per-account to-dos.
One-off async proof: node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed
demo-seed.js,docs/superpowers/evidence/trim-and-integration/c6-async-probe.js --fn c6ProbeResults --expect 11.
AI (task B3): POST /v1/ai; ai.adapter is fake (default), claude, openai or gemini, with the key only in the
git-ignored connector/config.json or env CONNECTOR_AI_KEY. The real AI adapters are tested against a stubbed
fetch only; no real call has been made.
Demo (task B4): node tools/connector-demo.mjs runs the connector with fake adapters on a free 127.0.0.1
port, calls health, accounts, calls, push and ai with the token, prints a short transcript, stops it and
deletes its temp config, token and log; exit 0. The access request for admins is a draft at
docs/superpowers/drafts/connector-admin-ask.md (not sent).

End-to-end check (task C-7): node tools/connector-e2e.mjs starts the connector with fake adapters, opens the tracker
in headless Chrome (a fresh temp profile, no --allow-file-access-from-files, so the page sends Origin: null like a real
browser) and walks the whole flow with the real buttons: health shows FAKE DATA, Check for calls, Refresh from
Gainsight, Send to Gainsight with one forced failure, Brief my day, then stops the connector and runs the full suite.
Prints "connector-e2e: 7/7 passed, 0 failed" and exits 0. Everything stays on 127.0.0.1; temp files are removed.

Connect the tracker (task C-2): start the connector (node connector/server.mjs), open Settings, find
"Connector (optional)", enter the address it prints (http://127.0.0.1:8787) and paste its token, then press Check.
The header then shows Connector: FAKE DATA while any adapter is fake. With a connector set up, every AI feature
goes through it; if it is not running the tracker falls back to a browser AI key if you saved one, and otherwise
works as before. The connector token is stored in this browser under obm-connector-settings-v1; it is not a
third-party key. The only third-party key the tracker can hold is the AI key in obm-ai-settings-v1.
Both sit in file:// localStorage, which Chrome lets every local HTML file on this computer read, so open only
HTML files you trust in the browser profile that holds the tracker. The connector rejects any request without
the token (a sandboxed web page also sends Origin: null, so the token, not CORS, is the guard).

Verifying a change
------------------
Both halves carry self-check suites: the tracker's is injected by tools/selfcheck.mjs from
tools/selfchecks.js (it is not in the shipped file); the guide's is in the page. After any edit:

  tracker:  node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475
            must be 475/475 (the suite lives in tools/selfchecks.js and is not shipped)
  tracker 1.1:  node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 483
  step 0 probe: node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step0-probe.js --fn step0Probe --expect 34
  step 1 probe: node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/step1-fixture.js,tools/step1-probe.js --fn step1Probe --expect 65
  step 1 cold start (C8): node tools/step1-coldstart.mjs
  tools/selfchecks-1.1.js is the 1.1 copy of the suite (475 checks plus 5 gone-quiet checks; three edited, see CHANGELOG).
  guide:    node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18
            must be 18/18 (window.runGuideSelfChecks() also works in the console)

See VALIDATION.txt for the last run and for what it did and did not cover.


Notes for anyone editing these files
------------------------------------
The tracker's HTML header carries the editing rules — motion budget, token
discipline, the signal registry, schema migration. Read them before changing
anything; each one exists because something broke.

Comment markers like "v72" or "v91" appear throughout the source. They are
provenance pointing into docs/history/, not a version scheme. This is 1.0.

The docs/ folder is development documentation and is not part of the
distributable bundle — it can be omitted when sharing.
