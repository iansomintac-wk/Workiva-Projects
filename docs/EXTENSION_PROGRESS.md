# Runway day and lifecycle sim: extension progress

Scout: 2026-10-17 ~09:00 PDT (16:00Z), extension to 2026-10-18T03:00Z. Worktree `C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim`, branch `runway-day-sim` (HEAD 3cda006 when scouted). Plan: `docs/superpowers/plans/2026-10-16-osm-day-lifecycle-sim.md` (approved, do not edit; sha256 starts 7e79e015438380fc). All 12 plan tasks (T1-T12) are built. What is left is the run's FIX ROUND, merged in `.ledger/2026-10-16-runway-day-sim/reviews/final-merged.md` (Fix A, Fix B, evidence text), plus FR11. Tasks below are named X1-X10 to keep them apart from plan tasks T1-T12.

## Measured by the scout just now (not read from a ledger)

- Suite: `node --test --test-reporter=spec test/*.test.mjs` gives tests 112, pass 110, fail 0, skipped 2 (exit 0).
- `run.mjs --version 1.1 --part A --only D4,D7`: D4 FAIL "transcript.text missing"; D4 break NOT-TESTED (base FAIL). D7 evidence carries the random `SIM-EXT-pms3...` id.
- `verify.mjs --score-only` on the existing state dir `sim-runs/verify`: C1 FAIL (1.0 [D2,D3,D8], 1.1 [D2,D3,D4,D8]); C2 FAIL both [L8,L11]; C3 PASS; C4 FAIL (1.0 FLIPPED 16 NOT-TESTED 5; 1.1 FLIPPED 15 NOT-TESTED 6); C5 FAIL (D7 only); C6 PASS; C7 PASS; C8 PASS. This reproduces the resume prompt.
- `run.mjs --version 1.1 --part B --only L7,L11`: L7 PASS break FLIPPED (leaks counted from `paused=false` alone); L11 FAIL, evidence "graduation modal OK ENABLED without a CSAT contact", break NOT-TESTED, and it never clicks OK in the no-contact case.
- Not run by the scout: the full verify (about 20 min, 4 browser runs). Last full figure is the lead's 1214 s at 04:54 PDT. The spend ceiling file has `seven_day: null` (no figure to compare with 25); five_hour was 7.

Rules for every task (from the run prompt): never edit a tracker (`osm-book-of-business-tracker-1.0.html`, `osm-book-of-business-tracker-1.1.html`, `osm-runway-onboarding-1.0.html`); the plan is locked; tests are add-only and written first; `sim-runs/` is git-ignored; write outputs only under `sim-runs/`; the count of our temp folders must not grow (one old `fieldtest-XciUO4` is not ours, leave it); no Chrome of ours alive afterwards; no paid AI host reached (escaped must stay 0).

Helpers for the checks (committed with this file): `node docs/extension-checks/show.mjs <results.json> [id]` prints `ID STATUS | break VERDICT | evidence`; `node docs/extension-checks/left.mjs` prints `left N` (our temp folders; baseline 1). `W` below means `cd "C:/Users/teasp/Documents/Runway Tracker/.claude/worktrees/runway-day-sim"`.

## Tasks (build order, all status todo)

### X1 Browser safety: own debugging port, bounded failures, no proxy (Fix B2, B3, B6)
- Outcome: `lib/browser.mjs` starts Chrome with `--remote-debugging-port=0` and reads the port from `DevToolsActivePort` in the throwaway profile (no random 9400-9899 port, so no foreign page can be driven); child `error` event, per-call CDP `send` timeout, socket-close rejection and JavaScript-dialog auto-dismiss all route to the normal cleanup; SIGINT/SIGTERM call `stop()`; `verify.mjs` spawnSync gets a timeout; Chrome gets `--no-proxy-server`, and any AI-host request that Fetch did not fulfil counts as escaped.
- Files: tools/sim/osm-day/lib/browser.mjs, verify.mjs, probe.mjs, test/osm-day-safety.test.mjs (add-only).
- Check: `W && node --test --test-reporter=spec test/osm-day-safety.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"; grep -c "remote-debugging-port=0" tools/sim/osm-day/lib/browser.mjs; grep -c "9400" tools/sim/osm-day/lib/browser.mjs; grep -c "no-proxy-server" tools/sim/osm-day/lib/browser.mjs; node tools/sim/osm-day/run.mjs --version 1.0 --part A --only D1 --no-breaks --out sim-runs/ext/x1 > sim-runs/ext/x1.log 2>&1; echo exit $?; grep -c "fake 0, escaped 0" sim-runs/ext/x1.log; node docs/extension-checks/left.mjs`. Also add a test (name contains "spawn error") that launches with an invalid Chrome path and sees exit 2 and its profile folder removed.
- Expected: `ℹ fail 0` with a pass count above the current file's; greps print `1` or more, `0`, `1` or more; real run `exit 0` (or 1 if D1 is a finding, never 2); `1` for the escaped line; `left 1`.
- Status: todo

### X2 Output folders: fresh per run, inside sim-runs, mtime downloads (FR11 and Fix B7)
- Outcome: `run.mjs --out` and `verify.mjs --dir` must resolve under `<repo>/sim-runs/` or exit 2 before creating anything; `verify.txt` is written inside `--dir`, not its parent; a download counts by file mtime after the click, so a re-run into the same folder, or a folder already holding a same-name file, still passes D10 and L10; verify makes fresh timestamped run folders each time. Write the pre-seeded same-name-file test first.
- Files: tools/sim/osm-day/run.mjs, verify.mjs, steps-a.mjs (D10, about lines 200-216), steps-b.mjs (L10 Download .txt), test/osm-day-steps.test.mjs (add-only).
- Check: `W && o=sim-runs/ext/x2-$(date +%s); for i in 1 2; do node tools/sim/osm-day/run.mjs --version 1.0 --part A --only D10 --no-breaks --out $o > /dev/null 2>&1; node docs/extension-checks/show.mjs $o/results-1.0.json | cut -c1-40; done; node tools/sim/osm-day/run.mjs --version 1.0 --part A --only D1 --out C:/Windows/Temp/ext-x2-nope > /dev/null 2>&1; echo outside-exit $?; test -e C:/Windows/Temp/ext-x2-nope && echo CREATED || echo not-created`
- Expected: two lines `D10 PASS | break - |` (the resume prompt measured the second as FAIL today), `outside-exit 2`, `not-created`.
- Status: todo

### X3 Clipboard, permissions and field-test crash paths (Fix B1, B4; FR5, FR6)
- Outcome: the clipboard steps (D5 recap, L10 packet, probe.mjs:133) put a known sentinel in the page first and judge what the click wrote, so stale OS-clipboard text cannot pass; a failed `Browser.grantPermissions` and a clipboard setup error are harness errors (exit 2), not swallowed and not counted as tracker FAILs; `run-field-test.mjs` crash paths call the same cleanup (wire to `fail()`); the stray blank line in `tools/sim/steps/99-measure.js` is gone.
- Files: tools/sim/osm-day/lib/browser.mjs, steps-a.mjs, steps-b.mjs, probe.mjs, tools/sim/run-field-test.mjs, tools/sim/steps/99-measure.js, test/osm-day-steps.test.mjs, test/selfcheck-exit.test.mjs.
- Check: `W && node --test --test-reporter=spec test/*.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"; node tools/sim/osm-day/run.mjs --version 1.1 --part A --only D5 --out sim-runs/ext/x3 > sim-runs/ext/x3.log 2>&1; echo exit $?; node docs/extension-checks/show.mjs sim-runs/ext/x3/results-1.1.json | cut -c1-200; node docs/extension-checks/left.mjs`. Negative control that must fail first: a new test that pre-seeds the clipboard with the recap text and makes the click a no-op must see D5 FAIL, not PASS.
- Expected: `ℹ fail 0`, pass above 110; `D5 PASS` on 1.1 with break FLIPPED or NOT-TESTED (not VACUOUS); exit 0 or 1, never 2; `left 1`.
- Status: todo

### X4 D4 resolves the stored transcript per version, and the 1.1 snapshot keeps it (FR8, Fix A4)
- Outcome: D4 reads the transcript from the activity's inline `.text` (1.0) or the 1.1 IndexedDB `transcripts` reference and checks `SIM-D4-TRANSCRIPT`; the browser snapshot and seed restore copy the 1.1 `transcripts` IndexedDB store along with localStorage, so a break browser still has the transcript.
- Files: tools/sim/osm-day/steps-a.mjs (D4, about lines 60-82), lib/browser.mjs (snapshot about 130, seed about 165), test/osm-day-steps.test.mjs.
- Check: `W && for v in 1.0 1.1; do node tools/sim/osm-day/run.mjs --version $v --part A --only D4 --out sim-runs/ext/x4-$v > /dev/null 2>&1; node docs/extension-checks/show.mjs sim-runs/ext/x4-$v/results-$v.json | cut -c1-120; done`
- Expected: `D4 PASS | break FLIPPED |` for both versions (today 1.1 prints `D4 FAIL | break NOT-TESTED`). FLIPPED on 1.1 proves the break still bites and the snapshot carries the transcript.
- Status: todo

### X5 D7 reports the relation, not the random id (FR10, Fix A5)
- Outcome: D7 evidence says the externalId matches the sent row's own id and prints no `SIM-EXT-<random>`; verify's C5 compare stays unmasked (do not bend the check); remove the info-only mask line.
- Files: tools/sim/osm-day/steps-a.mjs (D7), verify.mjs (mask removal), test/osm-day-steps.test.mjs.
- Check: `W && for i in 1 2; do node tools/sim/osm-day/run.mjs --version 1.1 --part A --only D7 --no-breaks --out sim-runs/ext/x5-$i > /dev/null 2>&1; done; node -e "const e=i=>require('./sim-runs/ext/x5-'+i+'/results-1.1.json').steps[0].evidence;console.log('same',e(1)===e(2),'hasRandomId',/SIM-EXT-[a-z0-9]{6,}/.test(e(1)),'relation',/matches own row id/.test(e(1)))"; grep -c "SIM-EXT" tools/sim/osm-day/verify.mjs`
- Expected: `same true hasRandomId false relation true`; last grep prints `0` (today it is 2).
- Status: todo

### X6 L11 clicks OK with no contact; break targets the CSAT check (Fix A2)
- Outcome: in the no-contact case L11 clicks OK and judges refusal by stage and queue after the click; the break in `lib/breaks.mjs:27` removes the CSAT-contact requirement instead of disabling `confirmGraduation`. Report honestly: the scouted result is FAIL (no refusal), so the break may stay NOT-TESTED; that is a finding, not a defect.
- Files: tools/sim/osm-day/steps-b.mjs (about 398-410), lib/breaks.mjs, test/osm-day-steps.test.mjs.
- Check: `W && node tools/sim/osm-day/run.mjs --version 1.1 --part B --only L11 --out sim-runs/ext/x6 > /dev/null 2>&1; node docs/extension-checks/show.mjs sim-runs/ext/x6/results-1.1.json | cut -c1-420; grep -c "confirmGraduation" tools/sim/osm-day/lib/breaks.mjs`
- Expected: L11 evidence contains `clicked OK` and names the stage and queue count read after that click; status agrees with that evidence (FAIL while the tracker has no refusal); last grep prints `0`.
- Status: todo

### X7 L7 judged on the rendered Today screen; leaks on silence sources only (Fix A3)
- Outcome: on pause days and on 12-01 L7 records rank and rendered or cap-hidden from the rendered Today; leaks count silence sources only (not `!x.paused` read from the replaced `isPaused`), so the break is not true by construction.
- Files: tools/sim/osm-day/steps-b.mjs (about 316-335), lib/breaks.mjs, test/osm-day-steps.test.mjs.
- Check: `W && node tools/sim/osm-day/run.mjs --version 1.1 --part B --only L7 --out sim-runs/ext/x7 > /dev/null 2>&1; node docs/extension-checks/show.mjs sim-runs/ext/x7/results-1.1.json | cut -c1-420; node -e "const r=require('./sim-runs/ext/x7/results-1.1.json');console.log(/rank/.test(r.steps[0].evidence), /paused=false/.test(JSON.stringify(r.breaks)))"`
- Expected: evidence mentions rank and rendered or cap-hidden on 12-01 (`true` printed first); break evidence no longer reduces to `paused=false` (`false` printed second). The verdict is whatever is measured; if FLIPPED, the leak list names a silence source.
- Status: todo

### X8 L5 plan-shown judged on Fernhollow's Sessions panel (Fix A7, extends FR9)
- Outcome: `planShown` searches Fernhollow's Sessions panel, not the whole body, and is false in the break run. FR9's L1 `exampleOnly` on an empty contact and L5's Call date 10-05 were deferred in the merge: do them only if inside 8 steps, else record them in the evidence doc as known weak coverage.
- Files: tools/sim/osm-day/steps-b.mjs (about 263), test/osm-day-steps.test.mjs.
- Check: `W && node tools/sim/osm-day/run.mjs --version 1.1 --part B --only L5 --out sim-runs/ext/x8 > /dev/null 2>&1; node -e "const r=require('./sim-runs/ext/x8/results-1.1.json');const b=r.breaks[0]||{};console.log(r.steps[0].status, b.verdict, /session plan shown/.test(r.steps[0].evidence), /session plan shown/.test(b.evidence||''))"`
- Expected: `PASS FLIPPED true false` (today the break evidence also says "session plan shown", so the last value is `true`).
- Status: todo

### X9 C3 reports a disproved coverage prediction (Fix A1)
- Outcome: verify's c3 prints FAIL with the word `disproved` when L6 shows no on-screen coverage row by day 7 (`reasonIsCoverage=false`, or beyond the beat cap), and still prints the Today, Watch and Off Track days. Spec section 8, C3: "disproved if 'due soon' does not show on Today at all". Also stop cutting L6 evidence at 600 chars (run.mjs:144) so `capHiddenDays` and `remainingThroughDay7` reach results (review N5) if it fits in 8 steps.
- Files: tools/sim/osm-day/verify.mjs, run.mjs, test/osm-day-results.test.mjs (add a doctored-state test).
- Check: `W && node tools/sim/osm-day/verify.mjs --score-only --dir sim-runs/verify 2>&1 | grep -E "^C3" | cut -c1-300`
- Expected: a line starting `C3 FAIL` that contains `disproved` (today `C3 PASS`); other C-lines unchanged apart from C5.
- Status: todo

### X10 Final: evidence doc, full verify on fresh folders, suite
- Outcome: `docs/evidence/2026-10-16-osm-day-lifecycle-sim.md` updated in the same commit as the last fixes: stability note (numbers reproduced on a second fresh run), outcomes of FR8/FR10/FR11 and Fix A/B, S11 wording (the card is still rendered; the tracker's spine counts a confirmed case as decided; Ian rules), S12 times quoted from times.txt (1.0 325 s and 295 s, 1.1 291 s and 279 s), N1 (the ai-negative control exits 0 when escaped=1), N2 (cite C4 L6 FLIPPED, and that the spec's own L6 break was VACUOUS), the deferred list as known weak coverage (FR1, FR2, FR3, FR7, L1/L5-date, S10 fail-open seed restore, step dates, N3, N4, N5, N7). Then one full verify on fresh folders.
- Files: docs/evidence/2026-10-16-osm-day-lifecycle-sim.md and any figure its prose repeats.
- Check: `W && node tools/sim/osm-day/verify.mjs > sim-runs/ext/x10.log 2>&1; echo exit $?; grep -E "^C[1-8] " sim-runs/ext/x10.log | cut -c1-110; node --test --test-reporter=spec test/*.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail|skipped)"; git status --short | head -5; git diff master --stat -- osm-book-of-business-tracker-1.0.html osm-book-of-business-tracker-1.1.html osm-runway-onboarding-1.0.html | wc -l`
- Expected: verify `exit 0`; eight lines C1..C8 with C5, C6, C7, C8 PASS, C3 FAIL disproved (X9), C1 and C2 still FAIL for tracker findings (D2, D3, D8, L8, L11; D4 no longer listed for 1.1), C4 with D4 FLIPPED on 1.1; suite `ℹ fail 0`; clean tree after commit; tracker diff line count `0`. Takes about 20 min; run it with the machine otherwise quiet.
- Status: todo

## Only Ian can do (never ask him; list these in the final report)

1. Raise the run's token cap. Run 5 (separate session) is stopped for it: budget.json runTokenCap 2,250,000, 2,090,354 used, 159,646 left; the merged fix round needs more than that. His words must be typed in run 5's own session. This extension session must not edit the ledger budget.
2. Merge of `runway-day-sim` to master (slip: push yes, merge no; he said "Show me the findings"). The branch is not yet pushed to origin.
3. Rulings on findings: is a Gainsight gate card his "tap on the shoulder" (L6: first Today on day 1 via the gate deck, rank 30, beyond the 15-beat cap on 21 of 21 days)? Is a confirmed risk case that stays in the open list (D8, L8) a tracker defect or by design (the spine counts it decided)? The slip field proposal "token raises on the program lead's word up to +600k".
4. Fixing the tracker findings (D2 prep panel lacks the transcript, D3 lacks you-owe/they-owe, D8/L8 confirmed case stays open, L11 graduation with no CSAT contact, the GAPs D7, L10, L12) means editing a tracker; the sim run never does that. Ian decides whether and when.
5. Whether to delete the old `fieldtest-XciUO4` temp folder (not ours) and the selfcheck-* profile `tools/selfcheck.mjs` leaves in %TEMP% each run (out of scope).
6. Banking the run's lessons (brain bank / ledger-add) where a ruling is involved.
