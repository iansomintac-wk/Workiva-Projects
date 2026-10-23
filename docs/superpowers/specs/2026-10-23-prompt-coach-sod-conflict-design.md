# Prompt coach: park C3, fix the "SoD conflicts" job bug (bounded)

Talk session 8a5e5fec, 2026-10-23, branch `prompt-coach-sod-conflict` from `prompt-coach-c3-sandbox` @ 156034f.
Classified **bounded**: a small change to existing code, built test-first in this session by helpers.

"Measured" = run in this session. "Read" = from a doc or helper report. "Assumed" = reasoning only, with the check
that would settle it.

## Rulings (verbatim)

- Ian, 2026-10-23 04:03Z, card '[Ian] Coach' (hook row `left: "ian-kind"`, so Ian's own answer): "Reopen, GRC-W2 first
  (Recommended)". The card's pick text set the stop rule: "If the misses turn out to have 3 or more separate causes, I
  stop and we park it."
- Ian, 2026-10-23 04:13Z, card '[Ian] C3 park' (hook row `left: "ian-kind"`): "Park C3, fix the bug (Recommended)".
  Option text: record C3 as missed; fix test-first so a 'conflict' that is part of 'SoD conflict' or 'conflict of
  interest' no longer means compare-two-sources, in the keyword list and the classifier pick; judge on existing suites
  and labelled sets; genuine comparison prompts unchanged.
- PM first pass (studio-harness:pm, 21.7k tokens, 1 tool call): option 2, park plus the bounded bug fix; no ESCALATE.

## Why C3 is parked (the $0 read)

Note: `docs/research/2026-10-23-prompt-coach-after-c3-read.md` (researcher, Sonnet, 59k tokens, 36 tool calls). Lead
spot-checked 2 figures, both held (Measured): FR-W4 answer Q41 states "EMEA ... 12.0%" where the key says 8.0%; both
FR-W3 Strong answers print the 6,200 total where the year rows sum to 6,100.

The 11 Strong-prompt misses split into 5 causes (Read, from the note): A planted wrong figure copied, not recomputed (5;
the originals miss FR-W3/FR-W4 the same way); B two-source job with one file (GRC-W2, 2); C "keep every figure exactly
as written" gave a verbatim copy without the flags (GRC-W3, 2); D1/D2 one-offs (2). The generic job line never changed
the job (job/table/format passed on its 5 misses). The PM's prediction (one cause behind GRC-W2 and >= 3 generic-line
misses) is **disproved**: GRC-W2 shares no send with the generic-line misses. The stop rule fired; C3 is recorded as
missed. Assumed, untested (needs sandbox sends): A and C share one cause, the E lines in `engine/rewrite.js:166-185`
guard against adding facts but never ask the AI to check figures. Left for a later reshape, not this change.

## The bug (Measured)

- `engine/rewrite.js:25` `INTENTS` maps any word starting "conflict" to `consistency`, so `intentOf("please review the
  attached sod conflicts report.", true)` returns `consistency`.
- The trained classifier (`engine/cls-weights.json`, unpacked as in `tests/customer_check.js`) also says `consistency`
  for "Please review the attached SoD conflicts report." at p = 0.72, so `classify.js pick()` is sure and uses it.
- Result: GRC-W2's Strong prompt (C3 `improved.json`) asked "list every number or statement that does not match ...
  give both locations and both values"; both sandbox answers asked for a second source and found 0 of 8 key items.

"SoD conflict" (segregation of duties) and "conflict of interest" are things a report lists, not a request to compare
two sources.

## Change

1. `INTENTS` consistency pattern: "conflict" does not count when it is part of "SoD conflict(s)", "segregation of
   duties conflict(s)" or "conflict(s) of interest". Every other consistency cue stays.
2. `classify.js pick()`: when the classifier says `consistency` and the prompt's only consistency cue is one of those
   nouns (the pattern above gives no consistency), treat the task as not sure and do not use `consistency` as the
   intent. The coach then writes its existing fill-in job, which keeps the user's ask and adds no two-source wording.
3. Rebuild `dist/prompt-coach.html`; update README figures it changes (byte count) in the same commit.

Out of scope: retraining the classifier, new labels, E-line wording, any other intent, any C3 re-scoring, sandbox sends.

## Probe (Measured, before the change)

- 5 of the labelled rows contain "conflict" (all sets except the fresh strong-30); `pick()` matches the label on all 5;
  1 uses the noun form ("Look for segregation of duties conflicts ...", label and pick `anomaly`).
- Snapshot of `pick()` for 1,883 rows (1,871 labelled + 12 weak12 originals): `$CLAUDE_JOB_DIR/tmp/picks_before.json`.
- Baseline: `node tests/c5_gate.js` exit 0 (eval acc 0.866; customer_check 229 runs; rewrite_unit 77/0; pagetest
  22/0); `node tests/done_when.js --only C2,C4` exit 0 (C2 8/247 test, 3/111 sim; C4 0 blanks); `c1_fixes` +
  `train_order` tests 8/0.

## Success criteria

- New tests fail on 156034f and pass after: the GRC-W2 original's Strong text has no "does not match" / "both
  locations and both values"; "conflict(s) of interest" is not `consistency`; "conflicts between the totals and the
  detail" and "the figures conflict with the summary" stay `consistency`.
- 0 of the 1,871 labelled rows change `pick()` intent or sureness; among weak12 originals only GRC-W2 changes.
- c5 gate, done_when C2/C4 and the unit tests at or better than the baseline above.

**Prediction (assumed):** exactly 1 of 1,883 snapshot rows changes (weak12 GRC-W2). Disproved if any labelled row
changes, or any gate number gets worse.

Not measurable here: whether the new GRC-W2 prompt gets the intended answer. That needs a sandbox send on a fresh set.

## Result (Measured by the lead after febed14, implementer Sonnet via studio-harness:implementer)

- Red before green: the new tests run on the parent's engine (4edd07d export) fail 3 targeted tests (SoD report,
  conflict of interest, strict intentOf null); the two "stays consistency" tests pass both ways, as designed. (A 4th
  fail there, "evidence line names FR3 and GEN29", is an artifact of exporting only `prompt-coach/`; it passes on HEAD.)
  On HEAD: c1_fixes + train_order 12 pass / 0 fail.
- Gates on HEAD, same as the baseline: c5 exit 0 (eval acc 0.866; customer_check 229 runs; rewrite_unit 77/0; pagetest
  22/0); done_when `--only C2,C4` C2 8/247 and 3/111, C4 0. Rebuild leaves the tree clean; committed dist 345,899 bytes.
- Snapshot diff: 2 of 1,883 keys differ. weak12 GRC-W2 `consistency`/sure -> no intent/unsure. train_grc row 44
  ("Look for segregation of duties conflicts ...") changed only in the snapshot's keyword-pattern field; its `pick()`
  stays `anomaly`/sure. **Correction:** the prediction "exactly 1 of 1,883 snapshot rows changes" was wrong as worded,
  because the lead put the keyword-pattern result into the snapshot key. On `pick()` intent and sureness, which is what
  the prediction was about, exactly 1 row changed and 0 labelled rows did.
- The GRC-W2 original with an Excel file attached (seam check, `$CLAUDE_JOB_DIR/tmp/grcw2.js`): the parent reproduces
  C3's Strong text exactly ("... list every number or statement that does not match. For each mismatch, give both
  locations and both values in a table. Do not decide which value is correct."); HEAD gives "... For the attached SoD
  conflicts report: identify and list the key points and where each one appears. Format it as a short table. Do not
  add facts that are not in the source, and list any open questions separately."
- Assumed, untested: that the new prompt gets GRC-W2's intended answer (needs a sandbox send on a fresh set).

### Review round (`/code-review low 4edd07d..febed14`, 3 findings, each tested by the lead)

- Hyphen: "Review the SoD-conflicts report." still picked `consistency` (model 0.94, pattern matched; `R.normalize`
  lowercases and collapses spaces but keeps hyphens). Reproduced, fixed test-first (new test red, then green): both
  guards take `[- ]`. After: c1_fixes + train_order 13/0; gates unchanged from the baseline; snapshot diff the same 2
  keys; dist 345,908 bytes (+9 characters).
- Guard skipped when another pattern matches ("list the gaps in our SoD conflicts"): not reproduced, the model says
  `anomaly` (0.69). Known limit, no code: a prompt where the model says `consistency`, another pattern matches and the
  only consistency cue is the noun would still get `consistency`. None found.
- "sod conflicting": not reproduced, the model says `other` (0.39), already unsure.

## Disclosures

- Fresh strong-30 (`data/done_when_strong.jsonl`): 1 row (line 11) was shown to the lead by an unscoped grep at 04:0xZ.
  Not used for anything; later searches exclude the file. `done_when.js` is run with `--only C2,C4` so C1 (which reads
  that file) is not run.
- No sandbox sends; C3 answers read for diagnosis only, not used to tune.
