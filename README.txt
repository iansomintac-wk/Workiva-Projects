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


Verifying a change
------------------
Both halves carry console-callable self-check suites. After any edit:

  tracker:  window.runSelfChecks()        must be 415/415 (seed demo-seed.js first)
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
