# v13 design vs build, side by side

Left = Ian's v13 design (OSM Workstation v13 standalone.html, opened as is, react bundled, no network needed). Right = the build (osm-book-of-business-tracker-1.1.html, demo-seed.js fake data, clock fixed to Mon 12 Oct 2026 08:40). Each PNG is 2880x960: two 1440x900 captures under a label bar. Made with tools/v13-shots.mjs; each step's heading fingerprint named the intended screen. Both sides use the design's default state per screen (no account selected on purpose; the design has no account overlay, and in v13 clicking an account only selects it on the Desk).

| PNG | Design shows | Build shows | sha256 | What differs |
|---|---|---|---|---|
| desk.png | Desk, Asteron Energy selected, 3 calls today | Desk, Aldridge Energy selected, 0 calls today | ceb149bfadc8631462ed1a45b8515e02cd3cd75d608822caa62c654cf490c40a | Build has "Wrap up the day / Back up the book" and a surveys banner and an empty day; design shows a busy day with a Co-pilot count badge. |
| copilot.png | Co-pilot with applied-updates strip and 3 call briefs | Co-pilot with 19 queued items, overdue cards | 6a21412970597fa203c6c98c7b1c4970618bdc5b58dc9e30ea7450fa153c153a | Design leads with pre-call briefs; build leads with a longer morning summary and "This week" cards. |
| accounts.png | Accounts Gantt, 24 accounts | Accounts Gantt, 17 accounts, plus search and filter row | 1b0a30dbbe8864bc3197d881fb1f32aef0ed04c096304caf8bdad52c8911c999 | Build adds search, filters and a sort control; design has a bare view switcher. |
| risk.png | Risk: 1 confirmed, 3 signals | Risk: 0 confirmed, 11 signals | 4b02141102da9932e4b0cea0bf530bc14d63303affaa4cf96c2a553b1b20979f | Build signals carry Confirm / Rule out buttons beside Review; design shows Review only. |
| system.png | System: Gainsight connection with 5 pending pushes, field mapping | System: Gainsight connection (nothing queued), Co-pilot rules, Gainsight admin rules | 28d7d4deaa046bd6f0e6cc0d8daf38a565c4900804c4efd82f8c72bd34c62245 | Build has no dry-run push list or field mapping near the top; it adds editable thresholds. |
| settings.png | System screen (design has no Settings modal) | Settings modal over Desk | 2461bf146a0e12b2135086f59fe001dba8c7672e03b8dff6c116d49e0b7b64f9 | Build modal is a long list of data, import and threshold controls with no design counterpart. |

Floating "Ask or jump" bar on the left side is part of the design, not an overlay fault. Content differences (names, counts) come from the demo seed vs the design's sample book.
