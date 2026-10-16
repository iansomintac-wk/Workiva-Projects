# Runway 1.1 hosting (a static `site/` build, nothing published): evidence

Branch `runway-hosting`, final commit `348e13a`. Spec: `docs/superpowers/specs/2026-10-15-runway-hosting-design.md` (C1-C9 table). Ledger (git-ignored): `.ledger/2026-10-15-runway-hosting/progress.md`; final review in `reviews/final-merged.md`; final lead figures in `fb-lead-rerun.log` and `c9-fix.txt`.
Label: **measured** = run by the lead (coordinator session) on 2026-10-16 at head 348e13a (lead re-run FBL; C9 at 16:42:44 PDT), headless harness, throwaway profiles, synthetic books. Every number below is copied from the ledger, none estimated. Helper numbers are marked as helper numbers.

## For Ian, plainly

- All nine checks hold at the final commit, and the checks we tried to break turned red when broken (red then green counts below).
- Nothing is published. The real host has not been touched.
- The 1.1 file changed once in the fix round (a Settings line now follows the browser's storage answer), so its fingerprint is now `b247a93c...`.
- Two things need you (see "For Ian" below): the xlsx script is not pinned, and the fingerprint depends on line endings.

## C1-C9: what proves each (all measured, head 348e13a)

| # | Prediction | Measured result at 348e13a | Measured by |
|---|---|---|---|
| C1 | `site/` has 2 files; `index.html` sha256 equals tracker 1.1's | measured: guard ok, 2 files (`index.html`, `.nojekyll`), sha256 b247a93cd504416518077088e5092bad234ec5eb5a51491bc24f87e08edd22d2 for both the 1.1 file and `site/index.html` | lead re-run FBL (fb-lead-rerun.log, line 4) |
| C2 | Guard controls exit 1 naming their rule | measured: the build-site tests inside node tests pass 42, fail 0, skipped 2 (both skips are symlink creation refused with EPERM on this PC) | lead re-run FBL (line 3) |
| C3 | Builder keeps foreign files (exit 2, file stays) | measured: same node test run, 42 / 0 / 2 skipped (EPERM) | lead re-run FBL (line 3) |
| C4 | Hint visible only on a served empty book | measured: hostingProbe 15/15 on file://, 15/15 served; move-book C4 PASS (hint visible on the empty served book, hidden after import) | lead re-run FBL (lines 5, 6, 12) |
| C5 | No storage calls on file://; served asks | measured: same hostingProbe runs, 15/15 file and 15/15 served | lead re-run FBL (lines 5, 6) |
| C6 | Counts and transcript sha256 equal after the move | measured: accounts 17/17, activities 87/87, transcripts 3/3, sha256 f624f01615fd3311593c5941c59f8b26260ebb22137a1b7152d954800234e31a, equal both sides; temp dir removed | lead re-run FBL (line 12) |
| C7 | AI key in Export assumed absent; measured either way | measured FINDING: the AI key is absent from Export (a stored fake key searched for in 362060 bytes of Export text) | lead re-run FBL (line 12) |
| C8 | Served selfcheck equals file:// pass count, 0 console errors | measured: served 475/475 = file 475/475, console errors 0 on both (favicon requests ignored: 1 served, 0 file) | lead re-run FBL (lines 7, 8) |
| C9 | Nothing published | measured 2026-10-16 16:42:44 PDT: remote unchanged from base; `.github` paths in ac2dccb..HEAD: 0; Pages API 404; visibility PRIVATE; origin/master present: 0 | lead, c9-fix.txt |

Other lead-measured lines at 348e13a: 1.1 suite 475/475 (three runs); step0Probe 34/34; step1Probe 72/72; 1.0 diff exit 0; locked-file diff exit 0.

## Fix round FX1-FX6 (after the final reviews at 5175f9a)

Codex said revise (2 MUST); Opus said approve (0 MUST). They disagreed on FX1 and FX2; the lead fixed both so no must-fix stays open.

| Fix | What it fixed | Commit | Red then green (measured) |
|---|---|---|---|
| FX1 | `tools/selfcheck.mjs` now exits 1 when console errors are above 0 (it only printed them before); HOSTING.md says "console errors: 0" | 9e2f5b1 | red export 10 pass / 3 fail / 1 skipped (FX1, FX2, FX3b fail); control: old code exit 0, new code exit 1, both print "console errors: 1" |
| FX2 | `tools/build-site.mjs` refuses (exit 2) when `site/` is a symlink or junction | 9e2f5b1 | in the same red run (fails), then green |
| FX3 | `--check` uses lstat (regular files only) and requires an empty `.nojekyll` | 9e2f5b1 | FX3b (non-empty `.nojekyll`) red then green; FX3a (linked `.nojekyll`) cannot be created here (EPERM), code-read only |
| FX4 | static server: stat inside the try; a read-stream error answers 500 or destroys the response | 9e2f5b1 | not testable here; code-read by the checker |
| FX5 | an open Settings "Kept by browser" line follows a changed storage answer | 348e13a | hostingProbe red 14/15 (FX5 FAIL: line stayed "no"), green 15/15 file and served |
| FX6 | HOSTING.md no longer says "works with no network"; it lists what the page loads | 348e13a | docs tests red pass 11 / fail 1, then green (inside the 42 / 0 / 2 run) |

Green for FX1-FX4 (9e2f5b1): node tests 41 pass, 0 fail, 2 skipped. Green at 348e13a: 42 / 0 / 2 skipped.

## Measured vs read

Measured this run:
- Everything in the C1-C9 table, the FX red/green counts, and the 475 / 34 / 72 baselines.
- fonts.gstatic.com: the lead fetched the page's own Google Fonts stylesheet (13,332 bytes, Chrome 142 user agent): 32 font sources, all https://fonts.gstatic.com.
- Four https hosts not listed in HOSTING.md (gemini.google.com, aistudio.google.com, console.anthropic.com, platform.openai.com) are all help links that open in a new tab; the lead grep shows none is loaded.

Only read, not measured:
- The CSP line in HOSTING.md (a `default-src 'self'` policy stops the tracker) is read from how CSP behaves; no host was tried.
- FX3a and FX4 are code-read (the link and stream-error cases cannot be built here).
- The FX5 check on file:// passes by construction (file:// makes no storage call); only the served run proves the fix.

## Not yet run (publish session)

- The real host's sign-in redirect, in a private window.
- The browser's persist answer on the real host.
- Ian moving his real book (use the move-book tool; export first).

## For Ian

- (a) The xlsx script from cdnjs (0.18.5) has no `integrity=`. Pin it with an integrity attribute, or vendor it into 1.1 (a 1.1 edit outside this run's scope). If not, an unpinned third-party script runs on the hosted origin and can read the book and the AI key.
- (b) Line endings: the HOSTING.md fingerprint (b247a93c...) is the sha256 of the CRLF working-tree copy (core.autocrlf=true, no .gitattributes). The committed LF blob hashes c650322b7931f7c6.... A GitHub download or a checkout without autocrlf builds a site that does not match HOSTING.md, and the fingerprint test fails there. Settle before or in the publish session (not a blocker now: nothing is published, and C1 holds on this PC).

## Later (nits, not fixed)

- N1: the port-8790 retry branch is dead code (its test cannot fail).
- N2: a missing API or a throw maps to "no" and is not probed.
- N3: C7 searches blobs[0] only (mitigated by C6).
- N4: the hint is probed on the default view only.
- N7: move-book resolves paths from the current directory.

## Cost

Helper tokens 1,165,229 of the 2,000,000 cap (sum of helper-rows.md at the end of the fix round). Paid tools: $0 (Codex on the ChatGPT plan).
