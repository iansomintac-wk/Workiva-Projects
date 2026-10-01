# FR/GRC default gates (ruling M3), evidence

Branch `fr-grc-default-gates`. Baseline measured first: `runSelfChecks: 436/436 passed, 0 failed`.

- Red: after editing c1d/c1e/c1f/c6c and adding c1h (expect 437), 5 FAIL (c1d, c1e, c1f, c1h, c6c).
- Green after code: c2d, c4a, c5c failed because they used an FR goal as the 0-gate case; retargeted to a GRC
  `disclosure` goal (assertions unchanged). Then `runSelfChecks: 437/437 passed, 0 failed`; guide 18/18.
- Scenarios (`--fn runGraduationScenarios --expect 6`): `6/6 passed`. A7 line: `PASS A7 GRC disclosure goal (empty default
  list): goal, verdict, graduate; packet "0 gates" - gates=0 confirmGraduation=true stage=graduated verdict=partly
  exit=null packetLine="Gates: 0 gates"`.
- Dry run `--from 13` (exit 0): `Schema 13 -> 15 ... Sustainability 5/5/3/3  Financial Reporting 5/5/3/3  GRC 5/5/3/0
  Custom Module 0/0/0/0`, second pass idempotent.
- Dry run `--from 14` (new, `tools/legacy-seed-v14.js`, exit 0): `Schema 14 -> 15 ... Financial Reporting 1/5/3/3
  GRC 5/5/3/0  Custom Module 1/0/0/0`, existing goals unchanged 7/7, FR publish[0] "Typed by an OSM" kept.
- `--from 11` and `--from 12` still exit 0.

Deviations: (1) c2d/c4a/c5c retargeted (needed 0-gate case). (2) Goal panel text "this book ships no default gates"
changed to "no default gates for this module and goal type". (3) VALIDATION.txt line 402 had `--expect 436` beside a
369/369 result (stale from an earlier count sweep); set back to 369. (4) The Edit tool normalised the tracker's working
copy to LF; the git index is LF (autocrlf), so the diff is unaffected.
