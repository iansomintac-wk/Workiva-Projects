# Runway hosting: a site you can put behind company sign-in. Design

Status: approved by Ian, 2026-10-15: direction, part 1, part 2, and the written spec ("Approve as written").
Target file: `osm-book-of-business-tracker-1.1.html` (changes for D2 and D3 only). `osm-book-of-business-tracker-1.0.html` is never edited.
Base: master ac2dccb (Step 1 merged). Branch: `runway-hosting`.
Roadmap gate: not applicable (`brain gate ... --project runway`: "unknown project runway").

Evidence labels: **measured** (run in this talk, 2026-10-15), **read** (from code or docs, not run; "checked" when I opened the source myself), **assumed** (reasoning only; each carries the check that settles it).

## 1. Ian's rulings (verbatim)

| Question | Ian's words | Effect |
|---|---|---|
| The ask (Step 1 talk, 2026-10-15) | "I want to be able to host this somewhere. my company uses github so could i host this on github pages or docker?" then "yes, A now and queue hosting next" | This objective. |
| Who the hosted tracker is for | "Me now, team after approval" | Build for Ian; nothing that blocks the team later. Team rollout is out of scope. |
| May the file itself be on the open internet | "No, company sign-in only (Recommended)" | Public GitHub Pages on a personal account is ruled out. |
| Workiva GitHub plan (Enterprise Cloud?) and repo rights | "Not sure, I'll check" | The host is not chosen in this spec. Ian checks Settings -> Pages in a company repo for a Visibility choice. |
| Connector use | "Not yet / browser key only" | No connector change. |
| Direction: Option 1 (private Pages) if the Visibility choice exists, else Option 2 (IT-run site); build the host-independent pieces now; stop before any upload | "Yes, that plan (Recommended)" | Section 3. |
| Design part 1 (D1-D5 and their checks) | "Yes, looks right" | |
| Design part 2 (safety, publish stop, later list) | "Yes, write the spec" | |
| The written spec | "Approve as written" | |
| Slip: push | "Yes, its own branch" | `runway-hosting` to `origin` only; C9 changed to match. |
| Slip: merge | "Yes, same rules as Step 1 (Recommended)" | Local merge to master on the Step 1 conditions (slip.json). |
| Slip: spend | "$0, Codex on ChatGPT (Recommended)" | Codex second reviewer on Ian's ChatGPT plan. |

## 2. Evidence

| Fact | Label | Value / source |
|---|---|---|
| Step 1 is merged | measured | master `ac2dccb` "Merge runway-step1" |
| Tracker 1.1 size and fingerprint | measured | 1,279,237 bytes; sha256 begins `086a3a8c34a64127` (re-measure at plan time; any 1.1 edit changes it) |
| Email-shaped strings in tracker 1.1 | measured | 0 (regex `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`); "RESTORE-POINT" appears 0 times |
| Workiva content in tracker 1.1 | measured | "Workiva" appears 53 times, including onboarding curriculum steps and AI prompt text. This is why public hosting was put to Ian |
| Real customer data in the folder | measured | `book-of-business-RESTORE-POINT-2026-08-03.json` is untracked (git-ignored as customer data) and holds real company email domains (domains counted only; contents not read) |
| `persist()` calls in tracker 1.1 | measured | 0 |
| Onboarding guide's tracker links | measured | 5 links, all to `osm-book-of-business-tracker-1.0.html` |
| How selfcheck opens the app | read | `tools/selfcheck.mjs:57` `pathToFileURL(target)`, headless Chrome, temp `--user-data-dir` (line 65) |
| Connector already answers Chrome's local-network preflight | read | `connector/server.mjs:100` `Access-Control-Allow-Private-Network: true`; origin gate `allowedOrigin()` |
| Private Pages needs Enterprise Cloud | read, checked | docs.github.com changing-the-visibility-of-your-github-pages-site: "To publish a GitHub Pages site privately, your organization must use GitHub Enterprise Cloud." Team plan: not mentioned |
| Private Pages address | read, checked | same page: "Privately published sites are available at a different subdomain than publicly published sites." "You can see your site's unique subdomain in the "Pages" tab" |
| Pages size limit | read (helper) | 1 GB per site (github-pages-limits). Per-file limit not confirmed; the site is about 1.3 MB |
| Chrome prompts before a public site reaches 127.0.0.1 | read, checked | developer.chrome.com/blog/local-network-access: "launching in Chrome 142"; covers "a local network or loopback destination". Edge 143 same (helper read learn.microsoft.com, not checked). Not needed now: no connector |
| `persist()` grant rules | read (helper) | Chromium grants or refuses silently, no prompt, from engagement / bookmark / installed / notification signals (web.dev persistent-storage; MDN storage quotas). Secure contexts only. Non-persistent origins are evicted whole, least recently used first (MDN) |
| All file:// pages in one Chrome profile share one storage | read | `connector/CONTRACT.md` "Chrome gives every local HTML file the same origin" |
| Public project sites share `<owner>.github.io` as one origin | assumed | Project sites are served at `<owner>.github.io/<repo>/`. Check: none needed now (public is ruled out); recorded for the host rule in D-safety |
| A private Pages site's unique subdomain is its own origin | assumed | Check: after publishing, `location.origin` on the site is not `<org>.github.io` |
| The browser AI key (`obm-ai-settings-v1`) is not in Export | assumed | Check C7 |

## 3. Design

The host is open (Ian's check decides between private Pages and an IT-run site). Everything below works for either, and the run uploads nothing.

**D1. Site builder** (`tools/build-site.mjs`, Node, no dependencies).
- Its source list is written in the file: `osm-book-of-business-tracker-1.1.html` -> `site/index.html`, plus an empty `site/.nojekyll` (GitHub Pages serves files as-is with it).
- It rebuilds `site/` only if `site/` holds nothing but names from its own list. Any other file there: exit 2 naming it, nothing deleted.
- After copying, it runs the guard. `node tools/build-site.mjs --check <dir>` runs the guard alone. Guard failures exit 1 and name the rule:
  (a) the file set is exactly `{index.html, .nojekyll}`;
  (b) `index.html` has the source's sha256;
  (c) no email-shaped string (regex above) unless it ends `.invalid`. Threshold 0, because the measured count is 0.
- `site/` is added to `.gitignore`; it is build output.

**D2. Empty-book hint** (tracker 1.1).
- Shown only when `location.protocol !== 'file:'` and the book has no accounts. The plan writer finds the existing empty-book test and reuses it.
- Text: "New address, no book here yet. Export from your old copy, then Import here (Settings)."
- Hidden as soon as the book has an account, and so after an import.

**D3. Ask the browser to keep storage** (tracker 1.1).
- At start, only when `location.protocol !== 'file:'` and `navigator.storage?.persist` exists: call `persisted()`, and if false call `persist()` once.
- Settings shows one line: "Kept by browser: yes", "Kept by browser: no (export regularly)", or "Kept by browser: not available when opened as a file". On file:// no storage call is made.

**D4. Moving a book.** No new tracker code: Step 1's Export carries transcripts and Import takes them. The run proves the move in a throwaway profile with the test book (`tools/step1-fixture.js` or the demo seed, never Ian's book):
- export from the file:// copy;
- import into the served copy;
- compare account, activity and transcript counts and a sha256 over the transcripts.

**D5. Selfcheck from a served address** (`tools/selfcheck.mjs --serve <dir>`).
- A Node static server bound to `127.0.0.1` on a free port. It serves GET only, with no directory listing, the right content types, and only files inside `<dir>`.
- It opens `http://127.0.0.1:<port>/` and runs the same in-page checks as the file:// run. It stops the server and the browser on exit, by its own PIDs.
- 127.0.0.1 counts as a secure context, so D3's code path runs there.

**D6. Documents** (same commit as the code they describe).
- New `docs/HOSTING.md`, written to work for either host. It covers:
  - what to upload: the two files in `site/`;
  - what any host must give: its own hostname (not a folder on a shared site, because everything on one host can read the book and the AI key), https, and company sign-in;
  - how to move a book: export, import, then re-enter the AI key if C7 says so;
  - how to publish a new version: rebuild, check, upload on Ian's yes.
- It can go to IT unchanged.
- A "Hosted" paragraph in `README.txt` and a CHANGELOG line.

**Safety (all tasks).**
- Nothing is uploaded or published, no remote is added, Pages is not turned on, and no `.github/` workflow is written. The one push allowed is the run's own branch `runway-hosting` to `origin` (Ian's slip; `iansomintac/Workiva`, measured private with no Pages site, 2026-10-15). Master is never pushed. Merge into master is local only, on the Step 1 rules (slip.json).
- The builder copies only its list, so the restore-point file, recordings, screenshots and the design zip can never be included.
- The app runs only through `tools/selfcheck.mjs` (and D4's tool) in a throwaway profile, never Ian's normal Chrome, and with the test book only.

## 4. Checks (each with its prediction and what disproves it)

| # | Check | Prediction | Disproved by |
|---|---|---|---|
| C1 | Builder on the real source | `site/` has 2 files; `index.html` sha256 equals tracker 1.1's | Any other count or hash |
| C2 | Guard controls (tests, red before D1 exists) | Each exits 1 naming its rule: a stray `RESTORE-POINT.json` in the output dir; `x@example.com` inside `index.html` (never a real customer domain in a test); one byte changed in `index.html`. `a@b.invalid` passes | Any control exits 0 |
| C3 | Builder keeps foreign files | With `site/keep.txt` present: exit 2, `keep.txt` still there | Exit 0, or the file gone |
| C4 | Hint | Served + empty: visible. Served + test book: hidden. file:// + empty: hidden. Served, after import: hidden | Any other state |
| C5 | Storage request | file://: `persist` and `persisted` called 0 times (spied), Settings says "not available when opened as a file". Served: called (persisted once, persist at most once), Settings says yes or no | A call on file://, or the line missing |
| C6 | Move a book (D4) | Counts and transcript sha256 equal on both sides | Any difference |
| C7 | AI key in Export | Assumed absent. Measured either way; HOSTING.md states the result | (a finding, not a pass/fail) |
| C8 | Served selfcheck (D5) | Same pass count as the file:// run of the same build (the run measures the baseline first), 0 console errors | Fewer passes or any console error |
| C9 | Nothing published | `git remote -v` unchanged from the base; `git diff --name-only ac2dccb..runway-hosting` has no `.github/` path; `gh api repos/iansomintac/Workiva/pages` still 404; `gh repo view iansomintac/Workiva --json visibility` still PRIVATE; `git branch -r` shows no `origin/master` | Any of these |

The real host's own facts (sign-in redirect in a private window, the browser's persist answer, Ian moving his real book) are measured in the publish session, not here.

## 5. Scope

In: D1-D6, C1-C9, on branch `runway-hosting`.

Out (later list):
- The publish session (after Ian's Settings -> Pages check). Its first step (raised by the hand-off PM check, not yet put to Ian): confirm that hosting this Workiva content on an internal site is fine with whoever owns the pending internal approval. Its real-host checks include `location.origin` (not `<org>.github.io`). Option 1: create the private repo in the Workiva org, set Pages to private, push `site/`, each step on Ian's yes; then measure the real host. Option 2: send `docs/HOSTING.md` to IT.
- Connector access from a hosted page (add its exact origin; Chrome 142 prompt).
- Putting the onboarding guide on the site (its links point at 1.0).
- Team rollout.
- Docker or IT setup details.
- The synced-folder option (Option 4).
- Automatic publishing (Actions).
