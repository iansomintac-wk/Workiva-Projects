OSM Runway 1.0 — Book of Business Tracker + Onboarding Guide
============================================================

A working prototype. Two single-file HTML apps that run from your own machine
with no build step, no server, and no account.

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
Copilot features are the exception: they call the Anthropic API and need a key
entered in Settings plus a network connection. Everything else works offline.


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
  Copilot     An AI layer over the book: four-lens account reads, call prep,
              routing, and suggested next actions. Requires an API key.
  Handoff     Sales intake and the CSM knowledge-transfer packet.
              The field set here is PROVISIONAL — a product open question.
  Settings    Thresholds, Gainsight CSV import, export/import, and automatic
              backup to a file you choose.


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

Opening an older book migrates it to schema 15 in place (no goals, no exits, no
invented verdicts). Export JSON first: schema 15 is not readable by an older
build.

Default gates for Financial Reporting and GRC (ruling M3, schema 15): Financial
Reporting ships 5/5/3/3 gates and GRC 5/5/3/0 (publish / set up next cycle /
program / disclosure), the lists in docs/superpowers/drafts/2026-10-01-fr-grc-gates-DRAFT.md.
They are defaults only: edit them per book in Settings -> Graduation gates.
Opening a schema 14 book fills only the lists that are empty; a list someone has
typed, other modules, and the gates already copied into an existing goal are
never touched. GRC disclosure submission stays empty.

Running the graduation checks headlessly (needs Chrome or Edge):

  node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 437
  node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html \
       --seed demo-seed.js,tools/graduation-scenarios-seed.js \
       --fn runGraduationScenarios --verbose --expect 6

The second runs six end-to-end scenarios (A3-A8) and prints the measured value
for each. --seed takes a comma-separated list, run in order; --verbose also
prints the passing checks with their detail. Migration dry runs:
node tools/migration-dryrun.mjs osm-book-of-business-tracker-1.0.html --from 13
(and --from 14, --from 12).


Verifying a change
------------------
Both halves carry console-callable self-check suites. After any edit:

  tracker:  window.runSelfChecks()        must be 437/437 (seed demo-seed.js first)
  guide:    window.runGuideSelfChecks()   must be 18/18

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
