# Team-demo captures on the v13 look (Task 7, steps 1-4)

Retaken 2026-10-23T00:01Z, then again in Fix A (1143cba, ~01:04Z) through the walkthrough's /practice path; sha256 below are the Fix A files (lead 0c86c843 re-hashed and opened all six). First retake with tools/team-demo-capture.mjs (1440x900, temp profile, 127.0.0.1:8801). v13 fingerprint per shot is printed by the tool: `#app [data-osm]` present (osm:true) plus visible headings. Look call is Ian's; not self-approved.

| Shot | Subject | v13 fingerprint | sha256 |
|---|---|---|---|
| 01-check-for-calls.png | Calls preview: 5 matched, 1 no account | osm:true, headings Today / Matched to an account (5) | d1b2efffd73ea70add75c95a2f4019e334ede7ba800bcdbe5f0a69f339bb3992 |
| 02-read-accounts.png | Refresh from Gainsight differences list (17 accounts) | osm:true, Differences (17 accounts) | 2c290339723084fab548fe9bb5fec115d9b49d730095907ce4fcfeb808ab4c73 |
| 03-check-csat-dry-run.png | Import CSAT dates dry run before Apply | osm:true, Today desk behind the modal | badab5819b7bfcb41e0b3ebecec67e308d74b4ef84ca4f03bc79f0314fae18e7 |
| 04-send-to-gainsight.png | v13 Risk screen scrolled to the Gainsight queue: 2 sent, 1 failed, toast | osm:true, Signals ask. You confirm. / Gainsight queue 3 | dcf5b043a44fbfa044c485c9d994fe570a3f0410dfef360b6843e2c354900c16 |
| 05-health.png | v13 desk with the More menu open, status row "Connector: FAKE DATA" | osm:true, Today | dda34b139d131b8abac168e51c9a30a537ea7547a43fc73d75f687e8c3059df3 |
| 06-how-its-built.png | tools/team-demo/built.html (not the tracker, so osm:false is correct) | osm:false, How it's built, whole page (taller than 900 px) with the full Evidence counts table | bdfe03783cc665428e5acaabe30950b573c484114ee28b31f7594e30d0c63f96 |

## Ian's 3 issues, measured on the new run (CDP)

1. Shot 01 Session column clipped behind a horizontal scrollbar: GONE. Both tables scrollWidth 948 = clientWidth 948 (scroll box 948/948); Session column fully visible in the PNG.
2. Shot 02 right column ("never edits or removes one") clipped: GONE. All 17 tables scrollWidth 933 = clientWidth 933; the text wraps inside the card in the PNG.
3. Shot 05 floating "1 OF 12" counter over "Ranked by severity": GONE / not present on v13. The v13 desk has no .day-marker element and no "Ranked by severity" text (counter:false, ranked:false), so nothing can overlap. No layout fix needed, no red test written (nothing failed).

## Observations for the look call (not defects fixed)

- 05: the open More menu covers part of the Wrap up / Day-Week controls by design; the health line is only visible inside that menu on v13.
- 02: column headings of the stacked per-account tables do not line up with each other (auto table layout); no clipping.
- 04 changed from the first reshoot: the queue is scrolled into view because the top of the Risk screen did not show the queue.
- 06: reshot in Task 9 as a whole-page capture; the Evidence counts table now reads 564 / 72 / 475 / 18 / 450 at 2128b04.
