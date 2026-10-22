# Rail reserve, zero-slack case (M0b S3)

Review item S3 (look-fixes-final.md): when `below < innerHeight - lastStage - 16` the Risk deck's reserve
`Math.max(lastStage + 16, innerHeight - below)` leaves zero slack, and "the last case still reaches the front" was assumed, not measured.

## Command

```
node tools/rail-reserve-measure.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --heights 900,1200,1600 [--dpr 1.25]
```

Headless Chrome on a fresh temp `--user-data-dir` (deleted at exit), CDP only, http and https blocked, so Google Fonts never load.
The demo seed has no confirmed risks, so the script confirms every case in memory first (saveData stubbed, as tools/d8l8-probe.js does): 11 cases.
It then clicks the rail button for the last case and reads the result. `slack` = max scroll minus the last case's offset; negative means short of it.

## Measured (width 1440, DPR 1)

```
{"viewport":"1440x900","bound":true,"cases":11,"innerHeight":900,"devicePixelRatio":1,"trackHeight":6315,"trackTop":474.13,"below":276.88,"need":5580,"maxScroll":6166,"slack":111.88,"reserveTail":735,"railClickScrollY":6054,"gapToSlot":0.125,"focusIsLast":true,"lastBehind":false,"lastOpacity":1,"hasRailButton":true}
{"viewport":"1440x1200","bound":true,"cases":11,"innerHeight":1200,"devicePixelRatio":1,"trackHeight":8363,"trackTop":474.13,"below":276.75,"need":7440,"maxScroll":7914,"slack":-0.13,"reserveTail":923,"railClickScrollY":7914,"gapToSlot":0.125,"focusIsLast":true,"lastBehind":false,"lastOpacity":1,"hasRailButton":true}
{"viewport":"1440x1600","bound":true,"cases":11,"innerHeight":1600,"devicePixelRatio":1,"trackHeight":11243,"trackTop":474.13,"below":276.75,"need":9920,"maxScroll":10394,"slack":-0.13,"reserveTail":1323,"railClickScrollY":10394,"gapToSlot":0.125,"focusIsLast":true,"lastBehind":false,"lastOpacity":1,"hasRailButton":true}
```

## Measured (width 1440, DPR 1.25)

```
{"viewport":"1440x1200","bound":true,"cases":11,"innerHeight":1200,"devicePixelRatio":1.25,"trackHeight":8363,"trackTop":474.13,"below":276.75,"need":7440,"maxScroll":7914,"slack":-0.13,"reserveTail":923,"railClickScrollY":7914,"gapToSlot":0.125,"focusIsLast":true,"lastBehind":false,"lastOpacity":1,"hasRailButton":true}
{"viewport":"1440x1600","bound":true,"cases":11,"innerHeight":1600,"devicePixelRatio":1.25,"trackHeight":11243,"trackTop":474.13,"below":276.75,"need":9920,"maxScroll":10394,"slack":-0.13,"reserveTail":1323,"railClickScrollY":10394,"gapToSlot":0.125,"focusIsLast":true,"lastBehind":false,"lastOpacity":1,"hasRailButton":true}
```

## Reading

- At 1440x900 the reserve has slack (111.88 px). At 1440x1200 and taller `slack` is -0.13 px: that is the zero-slack case (the whole sub-pixel gap is the fractional track top, 474.13).
- In every zero-slack run the rail click lands `gapToSlot` 0.125 px short of the last slot, `focusIsLast` is true, the last card is not behind and is at opacity 1. The assumption holds: the existing 1 px tolerance in paint() covers it. DPR 1.25 gives the same numbers as DPR 1.
- NOT measured: the web-font swap (scenario 1 in the review). Fonts are blocked here, so cards cannot grow after bind. The reserve is still not re-run on a font swap; this note does not claim it is.
- No behaviour was changed.
