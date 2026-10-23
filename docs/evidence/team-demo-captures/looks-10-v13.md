# Team-demo captures on the v13 look (Task 7, steps 1-4)

Retaken 2026-10-23T00:01Z with tools/team-demo-capture.mjs (1440x900, temp profile, 127.0.0.1:8801). v13 fingerprint per shot is printed by the tool: `#app [data-osm]` present (osm:true) plus visible headings. Look call is Ian's; not self-approved.

| Shot | Subject | v13 fingerprint | sha256 |
|---|---|---|---|
| 01-check-for-calls.png | Calls preview: 5 matched, 1 no account | osm:true, headings Today / Matched to an account (5) | 78d87d49f0d244962417cc2cd75b24a0ba019ebfd211018b0ed031380e4c12ef |
| 02-read-accounts.png | Refresh from Gainsight differences list (17 accounts) | osm:true, Differences (17 accounts) | 70c921581430ad87e9bade823002b05d8f3227370d349a4d7f2f298ae1d43f37 |
| 03-check-csat-dry-run.png | Import CSAT dates dry run before Apply | osm:true, Today desk behind the modal | 1247f20f77d5d20bbb127e2386cd67e0a5d5f5a5d8ef941ffb1a107c4abb122f |
| 04-send-to-gainsight.png | v13 Risk screen scrolled to the Gainsight queue: 2 sent, 1 failed, toast | osm:true, Signals ask. You confirm. / Gainsight queue 3 | 4a9aa0c4010488bf0c09a13c07f89688aa263f5d7d0511594080b787bf130221 |
| 05-health.png | v13 desk with the More menu open, status row "Connector: FAKE DATA" | osm:true, Today | d40afe067b9240212ee1b85179c32775cef7edd48abd39c2e9f76c7eb566f578 |
| 06-how-its-built.png | tools/team-demo/built.html (not the tracker, so osm:false is correct) | osm:false, How it's built, whole page (taller than 900 px) with the full Evidence counts table | 43ab9ad8c35b5d696f21078a2e9b18b5fe3f27d28f39caeefec70452f95e29ee |

## Ian's 3 issues, measured on the new run (CDP)

1. Shot 01 Session column clipped behind a horizontal scrollbar: GONE. Both tables scrollWidth 948 = clientWidth 948 (scroll box 948/948); Session column fully visible in the PNG.
2. Shot 02 right column ("never edits or removes one") clipped: GONE. All 17 tables scrollWidth 933 = clientWidth 933; the text wraps inside the card in the PNG.
3. Shot 05 floating "1 OF 12" counter over "Ranked by severity": GONE / not present on v13. The v13 desk has no .day-marker element and no "Ranked by severity" text (counter:false, ranked:false), so nothing can overlap. No layout fix needed, no red test written (nothing failed).

## Observations for the look call (not defects fixed)

- 05: the open More menu covers part of the Wrap up / Day-Week controls by design; the health line is only visible inside that menu on v13.
- 02: column headings of the stacked per-account tables do not line up with each other (auto table layout); no clipping.
- 04 changed from the first reshoot: the queue is scrolled into view because the top of the Risk screen did not show the queue.
- 06: reshot in Task 9 as a whole-page capture; the Evidence counts table now reads 564 / 72 / 475 / 18 / 450 at 2128b04.
