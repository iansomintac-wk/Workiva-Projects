# Graduation Plan, Task 1 evidence (schema 14 and data)

## Commands and measured output (this session)

- Red: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 396`
  -> `runSelfChecks: 389/396 passed, 7 failed` (c1a-c1g all FAIL, `... is not defined` / `schema 13`).
- Green, same command -> `runSelfChecks: 396/396 passed, 0 failed`.
- Guide: `node tools/selfcheck.mjs osm-runway-onboarding-1.0.html --fn runGuideSelfChecks --expect 18` -> `18/18 passed, 0 failed`.
- Mutation (a) v13 step leaves `c.exit` absent -> `395/396`, c1e FAIL `"shapeOk":false`. Restored.
- Mutation (b) v13 step leaves `c.graduation` absent (M1) -> `395/396`, c1e FAIL `"shapeOk":false`. Restored; `396/396` again.
- `--from 12` exit 0; `--from 11` (default) exit 0.

## A2: `node tools/migration-dryrun.mjs osm-book-of-business-tracker-1.0.html --from 13` (exit 0)

```
Schema 13 -> 14  Accounts: 7  goals:[] 7/7  exit:null 7/7  graduation:null 7/7
goalGates: default modules 5/5 (+2 CSRD, +1 other)  Sustainability 5/5/3/3  Financial Reporting 0/0/0/0  GRC 0/0/0/0  Custom Module 0/0/0/0
Historic graduated with an invented exit (must be 0): 0  Second-pass idempotent: true  Console errors: 0
```

## Deviations

- None from the plan's code. The plan table row for Task 1 now reads `396 (measured)`.
- CHANGELOG.txt:76 ("389 self-checks (was 369)") is a historic entry and was left alone.
- The VALIDATION.txt SHA-256 block was not re-measured (it belongs to a past release; Task 7 owns release prose).
- Suite check ids use the prefix `grad-plan c1x:` as in the plan.
