OSM Runway Guide v4.4 + Book of Business Tracker v73
=====================================================

1. Keep all six bundle files in this folder.
2. Open osm-runway-onboarding-v4.4.html in a modern browser.
3. Use "Open tracker" to launch the bundled v72 tracker in a new tab.
4. CHANGELOG.txt holds the tracker's full version notes (v37 -> v72), extracted
   verbatim from the tracker file's own header — the header inside the HTML
   remains the canonical record; this file is a readable mirror of it.

(The docs/ folder is design documentation, not part of the distributable
bundle. It can be omitted when sharing the six files.)

Compatibility
-------------
Guide: v4.4 (v3.0 content, with mockups and terminology matched to the
       tracker, plus a "Newer workflows" chapter teaching Quick log, the
       week-ahead and time budget, Coordination, risk summaries and ownership,
       the Handoff tab, and Undo/backup)
Tracker: v73 (Today rebuilt as ONE timeline whose axis is the workday: calls are
       the day's fixed points, ranked work fills the gaps between them, and admin
       collects into a close that pushes to Gainsight in one go. One account gets
       exactly ONE beat, carrying every reason it surfaced. An OPTIONAL per-call
       clock time (schema 6) turns the day into real minutes; without it the
       movements stay ordinal and claim no time the book does not have. Plus:
       deep-linking into the right account tab; an always-visible account
       snapshot on each account's Overview; a 300-character executive summary and
       inline next steps on every open risk; single-level Undo; Quick log
       (press L); a Coordination tab for stakeholders, blockers, and commitments;
       a Handoff tab (PROVISIONAL field set) for sales intake and the CSM
       knowledge transfer packet; signal calibration on Copilot; an Account Brief
       that summarises all logged activity and lets you clear Gainsight items
       without leaving it; plus everything in CHANGELOG.txt)
Bundled: August 4, 2026

Unlike previous bundles, the tracker in this one is NOT byte-identical to an
earlier delivered build — it was edited in place through v72. Self-checks pass
208/208 from the bundle location, and window.runGuideSelfChecks() must return 18/18 on the guide; see VALIDATION.txt for what was and was not
verified.

Guide coverage: the v3.0 Advanced Workflows chapter (implementation phase,
partner sheet import, Session Debrief) still matches tracker behavior. Not yet
taught step-by-step: the AI Call Prep synopsis, the Progress Report export, and
the Accounts lifecycle filter (self-explanatory dropdown on the toolbar).

Guide gap status: at 4.2 there are NO known coverage gaps. The last six
untaught features are now chapters: the Impact meter, the Gainsight sync queue,
signal calibration, the Account Brief inline actions, the AI Call Prep synopsis,
and the Progress Report export. Each is taught with its limits, not just its
benefit — the queue has no transport, the impact minutes are an editable
assumption, calibration needs four resolutions, the report is a snapshot. The
Handoff field set stays PROVISIONAL: a product open question, not a doc gap.

The guide stores mode, practice, challenge, and self-verified checklist
progress in its own browser-storage keys. It never reads or writes the
tracker's obm-data-v1 key. If browser storage is unavailable, the guide
continues for the current visit and labels that limitation honestly.
