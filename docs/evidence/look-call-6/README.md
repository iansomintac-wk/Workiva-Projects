# Look call 6: the reason line once per signal

Ian, 2026-10-23 (AskUserQuestion): "Show once (Recommended)". The call's card (look-calls page v2, call 6) recommended: print the line once per case on the Risk card and the desk; signals confirmed with different reasons or on different dates each still show.

## What was found (measured on 1afcd96, demo book plus `lc6-seed.js`)

- v13 Risk screen (switch '1', the default): the reason line did **not** repeat. `v13RiskCard` printed only the first reason, so Kestrel's second reason ("the rollout is paused until Q1") was hidden.
- Old Risk deck (switch '0'): one line per confirmed signal. Halvorsen showed the same line 3 times, and Kestrel showed 3 lines for 2 reasons.
- Old desk card back (`CARD_EDITORS.risk`): one line per signal, so the same repeats. It has a self-check but no capture (it sits behind the old Co-pilot decks).

## Captures (1440x900, fake accounts Halvorsen Freight and Kestrel Biologics)

`node tools/v13-shots.mjs <html> --steps steps.json --out <dir> --seed demo-seed.js,lc6-seed.js`, then `steps-kestrel.json` (it scrolls the deck to Kestrel's slot). The before shots use the parent html (`git show 1afcd96:osm-book-of-business-tracker-1.1.html`).

| Shot | Before (1afcd96) | After | On screen after |
|---|---|---|---|
| v13 Risk, Halvorsen | 9b39af654d9b | 4ce755823368 | one "Your reason" line (unchanged) |
| v13 Risk, Kestrel | 021589cc8de0 | 352457fefbd8 | two dated reason lines (before: one) |
| old deck, Halvorsen | 27604f0a87e8 | 8acc25086d09 | 1 reason line (before: 3) |
| old deck, Kestrel | f0af83676cb1 | 492612a68add | 2 reason lines (before: 3) |

## Look call result

Look critic: pass-to-ian; PM first pass: keep (the dates are what tell two different reasons apart). Ian, 2026-10-26 (AskUserQuestion; the answer hook left it to him, `left: ian-kind`): "Looks right (Recommended)". Logged in the studio-harness taste log.

The hand-off prompt said the line repeats on the v13 Risk screen. Measured, it did not: v13 hid the second reason instead. Both are fixed by the same rule.

## Check

`node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js --expect 565`, check LC6v13 (it runs the v13 screen with the switch at '1'). Parent html: 564/565, LC6v13 FAIL `{"v13":{"A":1,"B1":1,"B2":0},"deck":{"A":3,...},"desk":{"A":3,...}}`. After: 565/565.
