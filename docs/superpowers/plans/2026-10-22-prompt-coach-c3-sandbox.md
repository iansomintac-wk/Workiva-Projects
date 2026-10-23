# Prompt Coach C3 Sandbox Test of the Weak-12 Implementation Plan (rev 3, review fixes applied)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Suite: bash -c 'set -o pipefail; cd prompt-coach && node tests/c5_gate.js | tail -3' AND bash -c 'set -o pipefail; cd prompt-coach && node tests/done_when.js --only C2,C4 | tail -3' (both must exit 0)
Data: (none)

**Goal:** Measure whether the coach's Strong prompt for each of the weak-12 prompts, pasted as-is into the Workiva AI sandbox, gives the intended answer: 48 sends (12 ids x {original, improved} x 2 runs), two blind scorers, two adjudicators, one evidence doc.

**Architecture:** A measurement run, no coach code change. One bg browser driver session (`claude --bg --chrome`) captures the Strong prompts from the built page and does every sandbox action, briefed by a file. All other work is Node scripts, Opus helpers and Codex run by the lead. The qid -> (id, version, run) map lives only in the ledger.

**Tech Stack:** Node (no installs), python stdlib (fixture text), Claude in Chrome (driver only), Codex CLI (read-only), TSV, JSON, Markdown.

**Spec:** `docs/superpowers/specs/2026-10-22-prompt-coach-c3-sandbox-design.md` (the authority; read it with this plan). Run order: `docs/PROMPT_COACH_C3_SANDBOX_RUN_PROMPT.txt`. Reviews applied: `.ledger/2026-10-22-prompt-coach-c3-sandbox/reviews/plan-review-opus.md` and `plan-review-codex.md`, plus the lead's overrides.

## Paths used below

- ROOT = `C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next`. **Every check line starts with `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next" &&`** and then uses these ROOT-relative names, written in full: C3 = `prompt-coach/research/live-tests/weak12/c3`; KEY = `prompt-coach/research/live-tests/weak12/answer_key.json`; FIX = `prompt-coach/research/live-tests/weak12/fixtures`; LEDGER = `.ledger/2026-10-22-prompt-coach-c3-sandbox`; LOGS = LEDGER/logs; SCORE_IN = LEDGER/score_in (A packets in `SCORE_IN/A/`, B packets in `SCORE_IN/B/`).
- Lead copies every check line verbatim into `LEDGER/role-checks.txt` before dispatching a checker.
- The 12 ids: FR-W1 FR-W2 FR-W3 FR-W4 GRC-W1 GRC-W2 GRC-W3 GRC-W4 SUS-W1 SUS-W2 SUS-W3 SUS-W4 (measured in KEY).
- BASE = commit `4ce7ac3` (branch tip when the plan was written, measured).
- EVID = the evidence doc path `docs/evidence/<FINISH_DATE>-prompt-coach-c3-sandbox.md`, resolved once in Task 13 Step 1 into `LEDGER/evid_path.txt` and read from there by every later step.
- Zero-line checks are written `{ grep -v '<pat>' <file> || true; } | wc -l` -> `0` inside `bash -c 'set -o pipefail; ...'` (grep's exit 1 on no match is absorbed; wc exits 0).

## Global Constraints

- No money. Usage cap 1.2M tokens (budget.json). Paid calls: none (list at the end). After this plan is approved the lead sets budget.json `tasksLeft` to 14 and `helperToolCallCap` to 40.
- No coach change: nothing under `prompt-coach/engine/`, `web/`, `dist/`, `tests/`, `data/`. The run writes only under `prompt-coach/research/live-tests/weak12/c3/` and `docs/evidence/`, plus, in the evidence commit, the README status line and the C3 row of `docs/evidence/2026-10-22-prompt-coach-done-when.md`.
- `prompt-coach/data/done_when_strong.jsonl` is never read. `answer_key.json` and `SCORING_RULES.md` are locked (no edit without Ian's ruling). Held follow-ups (rules.js:158, :140, :136) stay held. A C3 miss is reported, never tuned on.
- Made-up data only. Sandbox host `sandbox.wdesk.com` only (plus the 127.0.0.1 coach page); the driver reads the tab URL before every action; any other host stops the drive. Never app.wdesk.com. In the sandbox the driver works only in Files > "Prompt coach test - Ian" and the Workiva AI panel; it never deletes, renames, moves, shares or edits any file or folder, never opens another workspace, never changes a setting.
- One browser driver at a time. Text reports only from the driver, no screenshots.
- Stop at once: sign-in/Okta/MFA page, billing or upgrade prompt, customer-looking data, Workiva AI unavailable on 2 sends in a row, three parked sends in a row.
- Sandbox technical failure (input text not equal to prompt, chip missing, source count not 1, answer cut off, timeout, error banner): one retry, logged; a second on the same send parks it and the drive goes on. A miss is never retried. This is distinct from an auto-mode refusal of a step (see Stops).
- Codex: `codex exec --sandbox read-only -c windows.sandbox=unelevated`, from an empty temp folder outside the repo, input on stdin and stdin closed, scratch `CODEX_HOME`, in a background job (error 1223). Read the studio-harness gotchas `2026-10-14-codex-shell-blocked-on-windows` and `2026-10-17-codex-unelevated-sandbox-runs-on-windows` first.
- Checks keep exit status: pipes go in `bash -c 'set -o pipefail; ...'`; VALID is matched as `^VALID$`; JSON and line counts of JSON-encoded lists are checked by `node`, not `grep -c`. Test commands name files, never folders. No helper edits the worktree while a check runs.
- Blindness: the id map (`LEDGER/id_map.tsv`) never enters a file a scorer reads. Each Claude scorer and adjudicator prompt says: read only the files named here; never open id_map.tsv, run_order.tsv, run_sheet.tsv, improved.json, the repo, or another scorer's rows.
- Workiva repo: nothing written to the brain or studio-harness.
- Per-send result ("intended answer in the requested format") = good answer (found share >= .75 of the key's `found` list, false 0, invented 1) AND table 1 AND format 1 AND job 1.
- Bars: C3a = improved sends that are intended answers, of 24 (>= 22 passes; a parked improved send is a failure). C3b = improved scored sends with invented = 0 (at least one invented company fact), pass = 0 of the scored sends. C3c = sum of found over scored improved sends >= sum over scored original sends (over (id, run) pairs where both versions were scored). Coverage "n of 24" is printed for each bar. If any send is parked, the evidence doc marks the affected bars "partial coverage" and certifying them is Ian's call (a stop).
- Key format: the key has no `format` field. The evidence doc says "key format: not available (key has no format field)". No column for it.

## Stops

1. STOP-A plan approval (PM proxy; Codex review beside the Opus one).
2. STOP-B Task 4: Ian signs in to the sandbox (`[IAN: sign-in]`), notified first.
3. STOP-C after Task 7 pilot: lead reports per-send times and projected total; fewer than 2 clean pilot sends = stop for the lead (protocol question to the PM), no blind carry-on.
4. STOP-D spend past the cap (Ian approved 1.2M; a raise is the lead's up to +600k per the standing rule, logged), any Ian decision, two strikes on a failing check, any parked send before certifying bars (Task 14), the merge (run prompt step 10, not a task here).
5. Auto-mode refusal: a step auto mode refuses is parked once with `gates.mjs park` and never retried. Not the same as a sandbox technical failure (one retry).

## Task kinds, groups, helpers, cost

Groups: A = Task 1 (lead); B = driver Tasks 2, 3, 5, 7, 8 (one driver session and its successor), Task 4 Ian, Task 6 script; C = scoring Tasks 9-12; D = Tasks 13-14. No tune tasks.

| Task | Kind | Who | Est. helper tokens (assumed) |
|---|---|---|---|
| 1 Pre-flight | script + lead | lead | 0 |
| 2 Driver brief, launch | lead | lead | 0 |
| 3 Capture of 12 Strong prompts | DRIVER | bg browser driver (`--chrome`) | driver ~60k |
| 4 Sign-in | `[IAN: sign-in]` | Ian | 0 |
| 5 Uploads, dry paste | DRIVER | same driver | driver ~35k |
| 6 Order file | script | helper H1 (Sonnet) | 8k |
| 7 Pilot (2 sends) | DRIVER | same driver | driver ~40k |
| 8 Remaining 46 sends | DRIVER | driver, successors as needed | driver ~270k |
| 9 Pass A packets + fixture text | script | helper H2 (Sonnet) | 25k |
| 10 Pass A: Opus and Codex, freeze | Opus + Codex | H3 (Opus scorer A) + lead (Codex) | 70k + Codex ~75k |
| 11 Pass B packets, Opus and Codex | Opus + Codex | H4 (Sonnet packets) 8k, H5 (Opus scorer B) 50k + lead (Codex) | Codex ~75k |
| 12 Adjudication A then B | Opus x2 | H6 (adjudicator A) 30k, H7 (adjudicator B) 20k | 50k |
| 13 Tally and evidence doc | script + doc | H8 (Opus) | 45k |
| 14 README, C3 row, commit | lead | lead | 0 |

Helpers: 8 Claude dispatches (H1 order, H2 packets A, H3 Opus A, H4 packets B, H5 Opus B, H6 adjudicator A, H7 adjudicator B, H8 evidence); the Opus/Codex row comparison is a script, `LEDGER/diff.js`, not a helper. Non-driver helper total about 330k (assumed). Driver about 405k in its own session(s) (assumed). Codex about 150k (assumed). Plan writer, checkers and final review about 350k (assumed). Run total about 1.23M if all are at the estimate (assumed), over the 1.2M cap by 30k: the lead reads the ledger helper rows before Task 9 and before Task 12, and if the projection passes 1.2M stops (STOP-D) before the next helper.

helperToolCallCap: **40** per helper (largest non-driver task: an Opus scorer reading rulebook plus a packet file and writing one TSV; 48 packets are in one file, not 48 reads). The driver is a separate bg session, not counted.

Paid calls: none. Metered use only: Claude usage, Codex CLI, Workiva AI in Ian's sandbox. Anything else = STOP-D.

Locked files: `prompt-coach/engine/`, `web/`, `dist/`, `tests/`, `data/` (incl. `done_when_strong.jsonl`, unread), `LT/SCORING_RULES.md`, `weak12/answer_key.json`, `weak12/fixtures/`, `weak12/drafts.json`, `weak12/prompts.json`, `weak12/make_weak12_fixtures.js`, `cases.json`, `cases.md`, `make_cases.js`, `make_live_fixtures.js` (all `LT` = `prompt-coach/research/live-tests`).

LOCK CHECK (end of Tasks 8 and 14; expected: no output from either):
`cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next" && git diff --name-only 4ce7ac3 -- prompt-coach/engine prompt-coach/web prompt-coach/dist prompt-coach/tests prompt-coach/data prompt-coach/research/live-tests/SCORING_RULES.md prompt-coach/research/live-tests/cases.json prompt-coach/research/live-tests/cases.md prompt-coach/research/live-tests/make_cases.js prompt-coach/research/live-tests/make_live_fixtures.js prompt-coach/research/live-tests/weak12/answer_key.json prompt-coach/research/live-tests/weak12/fixtures prompt-coach/research/live-tests/weak12/drafts.json prompt-coach/research/live-tests/weak12/prompts.json prompt-coach/research/live-tests/weak12/make_weak12_fixtures.js`
`cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next" && git status --porcelain -- prompt-coach/engine prompt-coach/web prompt-coach/dist prompt-coach/tests prompt-coach/data prompt-coach/research/live-tests/SCORING_RULES.md prompt-coach/research/live-tests/cases.json prompt-coach/research/live-tests/cases.md prompt-coach/research/live-tests/make_cases.js prompt-coach/research/live-tests/make_live_fixtures.js prompt-coach/research/live-tests/weak12/answer_key.json prompt-coach/research/live-tests/weak12/fixtures prompt-coach/research/live-tests/weak12/drafts.json prompt-coach/research/live-tests/weak12/prompts.json prompt-coach/research/live-tests/weak12/make_weak12_fixtures.js`

## Expected breaks

(none) | no test reads `weak12/c3/`, the evidence doc or the new README line; the Suite runs at the end of Task 14.

---

### Task 1: Pre-flight (no browser)   [script + lead]

**Files:**
- Create: `LEDGER/logs/preflight.txt`, `prompt-coach/research/live-tests/weak12/c3/.gitkeep`
- Read: `prompt-coach/tests/validate_done_when_sets.js`, `FIX/*`, `prompt-coach/dist/prompt-coach.html`, `LEDGER/preflight_sha256.txt`

**Interfaces:**
- Produces: `LOGS/preflight.txt` with a `VALID` line, 12 fixture hashes and one dist hash (the driver brief quotes the dist hash; capture records it as `distSha`).

- [ ] **Step 1:** Lead checks `STUDIO_RUN_LEDGER` is set and `LEDGER/budget.json` and `LEDGER/slip.json` exist (else stop for Ian).
- [ ] **Step 2:** `cd "ROOT/prompt-coach" && node tests/validate_done_when_sets.js` must print a line that is exactly `VALID`; write it to the preflight file by Write.
- [ ] **Step 3:** `mkdir -p LOGS` and the `c3` folder; write the 13 hashes of `sha256sum FIX/* prompt-coach/dist/prompt-coach.html` to `LOGS/preflight.txt`, and diff them against `LEDGER/preflight_sha256.txt` (expected equal).
- [ ] **Step 4:** Lead runs `claude agents --json --all` and confirms no other live session drives Chrome (if one does, stop for Ian).
- [ ] **Step 5:** Check: `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next" && grep -c -E "^[0-9a-f]{64}" .ledger/2026-10-22-prompt-coach-c3-sandbox/logs/preflight.txt'` -> `13`; `... && grep -c -x VALID .ledger/2026-10-22-prompt-coach-c3-sandbox/logs/preflight.txt` -> `1`. On the parent the file is absent (exit 2).
- [ ] **Step 6:** Commit only the `.gitkeep` (the ledger is git-ignored): `git add prompt-coach/research/live-tests/weak12/c3/.gitkeep && git commit -m "Prompt coach C3: c3 folder"`.

---

### Task 2: Driver brief and launch   [lead]

Depends: 1

**Files:**
- Create: `LEDGER/driver_brief.md`

- [ ] **Step 1:** Write the brief: the sandbox-only rule, URL guard and sandbox-actions limit from Global Constraints; the stop rules; the retry/park rules; "text reports only, no screenshots"; the 200k hand-off rule (write the last run-sheet row, stop; the lead launches a successor).
- [ ] **Step 2:** The run-sheet format in the brief: `LEDGER/run_sheet.tsv` columns `qid	attempt	t_start	t_send	t_finish	t_saved	source_count	status`, times UTC, status one of `ok | tech-fail | parked | miss-not-retried`. The row is written first, the answer file second, and an answer file is written only for an `ok` row (on a technical failure no file is kept). Resume = the next qid with no `ok` or `parked` row.
- [ ] **Step 3:** Brief also says: write no id, version or run next to a qid in any file under `C3/`; the driver may read `LEDGER/id_map.tsv` only to pick the prompt for the next qid.
- [ ] **Step 4:** Check: the brief names exactly four required markers, each present: `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next" && grep -o -E "t_saved|sandbox.wdesk.com|--chrome|tech-fail" .ledger/2026-10-22-prompt-coach-c3-sandbox/driver_brief.md | sort -u | wc -l'` -> `4` (file absent on the parent, exit 2).
- [ ] **Step 5:** Launch, as the whole Bash command: `claude --bg --chrome -n "NEW - C3 sandbox driver" "read C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next/.ledger/2026-10-22-prompt-coach-c3-sandbox/driver_brief.md and do it"` (without `--chrome` a bg session has no browser tools). Only after the Task 1 Step 4 check.

---

### Task 3: Capture of the 12 Strong prompts   [DRIVER]

Depends: 2

**Files:**
- Create: `prompt-coach/research/live-tests/weak12/c3/improved.json`, `LEDGER/logs/capture_vs_probe.txt`, `LEDGER/page_text/<id>.txt` (12 files), `LEDGER/prompt_heads.txt`, `LEDGER/prompt_heads.json`
- Read: `prompt-coach/dist/prompt-coach.html`, `FIX/*`, `prompt-coach/research/live-tests/weak12/prompts.json`, `prompt-coach/docs/research/c3-probes/c3probe.js`

**Interfaces:**
- Produces: `improved.json` = array of 12 `{id, original, strong, distSha}`. `strong` is exactly the text the copy button passes to `navigator.clipboard.writeText` (the page's `copyFrom` calls it with `state.result.stages[stage].prompt`; `state` is closure-scoped and unreachable, so it is captured through the clipboard call). `LEDGER/prompt_heads.json` = JSON array of 24 strings, the first 40 characters of each of the 12 originals and 12 `strong` texts; `LEDGER/prompt_heads.txt` = the same 24 strings with newlines turned to spaces, one per line, for `grep -F -f`.

- [ ] **Step 1:** Driver serves `prompt-coach/dist/` on 127.0.0.1 (one-line `node` static server, no install, not port 8790), opens it in a new Chrome tab.
- [ ] **Step 2:** For each id, **reload the page** (files do not carry over), type the original, attach the fixture through `#fileInput`, and assert exactly the one intended file chip. If the file input cannot be set, stop and report (lead has Ian run `/add-dir` for FIX).
- [ ] **Step 3:** In the page set `navigator.clipboard.writeText = async t => { window.__c3copy = t; }`, select Strong, click `#copyStage`, read `window.__c3copy` into `strong`. Also save the text the page shows as read from the file to `LEDGER/page_text/<id>.txt`; record `#stagePrompt` text (outer curly quotes removed) and log if it differs from `strong` in `capture_vs_probe.txt`.
- [ ] **Step 4:** Write `improved.json`. Write to `capture_vs_probe.txt` the count of ids whose `strong` differs from the offline probe (reported, not gating).
- [ ] **Step 5:** Lead writes `LEDGER/prompt_heads.json` and `LEDGER/prompt_heads.txt` (24 entries each) from `improved.json`.
- [ ] **Step 6:** Check (JSON and heads count by node): `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next" && node -e "const a=require('./prompt-coach/research/live-tests/weak12/c3/improved.json');const h=require('./.ledger/2026-10-22-prompt-coach-c3-sandbox/prompt_heads.json');const s=new Set(a.map(x=>x.distSha));const ids=new Set(a.map(x=>x.id));console.log(a.length,ids.size,a.filter(x=>x.strong&&x.strong.length>20&&x.original).length,s.size,h.length)"` -> `12 12 12 1 24`. On the parent `require` throws (exit 1).
- [ ] **Step 7:** Commit: `git add prompt-coach/research/live-tests/weak12/c3/improved.json && git commit -m "Prompt coach C3: captured Strong prompts"`.

---

### Task 4: Sandbox sign-in   [IAN: sign-in]

Depends: 3

**Files:** none.

- [ ] **Step 1:** Lead pushes PushNotification and `notify.mjs`, then asks under "[Ian] Sandbox sign-in": sign in to https://sandbox.wdesk.com/ in Chrome and confirm. Never app.wdesk.com.
- [ ] **Step 2:** On Ian's confirmation, lead messages the driver (SendMessage) to go on.
- [ ] **Step 3:** Check: the driver reports the tab host as `sandbox.wdesk.com` and a signed-in page (no Okta/MFA). Expected: one host line, nothing else.

---

### Task 5: Uploads and dry paste   [DRIVER]

Depends: 4

**Files:**
- Create: `LEDGER/logs/uploads_report.txt`, `LEDGER/logs/dry_paste.txt`

- [ ] **Step 1:** Driver opens Files > "Prompt coach test - Ian" and uses Upload (not Import) for each of the 12 fixtures. A name already in the folder that this run did not upload is reported to the lead, not silently skipped.
- [ ] **Step 2:** Driver writes the 12 names it sees to `uploads_report.txt`, sorted, one per line.
- [ ] **Step 3:** If uploads are refused, the lead has Ian run `/add-dir` for the fixtures folder (no retry loop).
- [ ] **Step 4:** Check: `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next" && ls prompt-coach/research/live-tests/weak12/fixtures | sort | diff - .ledger/2026-10-22-prompt-coach-c3-sandbox/logs/uploads_report.txt'` -> no output.
- [ ] **Step 5:** Dry paste: in a new chat attach one fixture, paste one `strong` that contains a literal `@`, read the input back, clear it without sending. `dry_paste.txt` has two lines: `equal_apart_from_chip=yes|no` and `chip_count=<n>`. If not `yes` and `1`, stop for the lead (a protocol question for the PM, not a retry).
- [ ] **Step 6:** Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next" && grep -c -x -E "equal_apart_from_chip=yes|chip_count=1" .ledger/2026-10-22-prompt-coach-c3-sandbox/logs/dry_paste.txt` -> `2`.

---

### Task 6: Fixed-seed order file   [script, committed before the first send]

Depends: 3

**Files:**
- Create: `prompt-coach/research/live-tests/weak12/c3/run_order.tsv`, `LEDGER/id_map.tsv`, `LEDGER/order_seed.txt`, `LEDGER/make_order.js`

**Interfaces:**
- Produces: `run_order.tsv`: header `pos	qid`, then 48 rows `1	Q01` ... `48	Q48`, then one closing line `# id_map sha256 <hash of LEDGER/id_map.tsv>; seed in ledger`. `LEDGER/id_map.tsv`: header `qid	id	version	run`, 48 rows in qid order (ledger only). No file under `C3/` joins a qid to an id, version or run.

- [ ] **Step 1:** Write `LEDGER/make_order.js`: mulberry32 seeded 20261022 (written to `order_seed.txt`) picks which version takes odd positions; per attempt Fisher-Yates shuffle the 24 original (id, run) items and the 24 improved items separately and interleave them, so versions strictly alternate; accept the first attempt with no two adjacent items sharing an id (up to 2000 attempts; exit 1 with a message if none accepted); assign Q01-Q48 in send order; write both files, appending the id_map hash line to `run_order.tsv`.
- [ ] **Step 2:** Run `node .ledger/2026-10-22-prompt-coach-c3-sandbox/make_order.js`; exit status must be 0.
- [ ] **Step 3:** Checks (each from ROOT): `grep -c -P '^\d+\tQ\d\d$' prompt-coach/research/live-tests/weak12/c3/run_order.tsv` -> `48`; `grep -c -E 'W[1-4]|original|improved' prompt-coach/research/live-tests/weak12/c3/run_order.tsv` -> `0`; `bash -c 'set -o pipefail; tail -n +2 .ledger/2026-10-22-prompt-coach-c3-sandbox/id_map.tsv | cut -f2 | uniq -d | wc -l'` -> `0`; same with `cut -f3` -> `0` (versions alternate); `bash -c 'set -o pipefail; tail -n +2 .ledger/2026-10-22-prompt-coach-c3-sandbox/id_map.tsv | cut -f2,3 | sort | uniq -c | { grep -v "^ *2 " || true; } | wc -l'` -> `0` (each id x version exactly twice). Files are absent on the parent.
- [ ] **Step 4:** Commit before any send: `git add prompt-coach/research/live-tests/weak12/c3/run_order.tsv && git commit -m "Prompt coach C3: run order (seeded), before first send"`.
- [ ] **Step 5:** Lead tells the driver by SendMessage that the order is committed and that `id_map.tsv` is for choosing prompts only.

---

### Task 7: Pilot, the first 2 sends   [DRIVER]

Depends: 5, 6

**Files:**
- Create: `C3/answers/<qid>.md` (at most 2), rows in `LEDGER/run_sheet.tsv`, `LEDGER/logs/pilot.txt`, an empty `LEDGER/logs/parked.txt`

- [ ] **Step 1:** For each of the first 2 qids in `run_order.tsv`: Workiva AI panel, new chat; attach the fixture with `@` and pick its chip (source count 1); wait 2 s; paste the prompt text exactly (improved keeps its literal `@name`); read the input box back and compare (equal apart from the chip); send. Pilot sends use a provisional timeout of 10 minutes.
- [ ] **Step 2:** Wait for the answer to finish; write the run-sheet row (`t_start`, `t_send`, `t_finish`, `t_saved`, source count, status) first, then copy the answer from the panel's `innerText` (answer text only) to `C3/answers/<qid>.md` only if status is `ok`.
- [ ] **Step 3:** Driver writes `pilot.txt`: per-send start-to-saved time, send-to-finish, median, then one line `timeout_s=<max(180, 3 x median start-to-saved in seconds)>`, then `projected_total_min=<48 x median>`.
- [ ] **Step 4:** If fewer than 2 pilot sends are clean (`ok`), stop (STOP-C): no timeout is derived from a failed pilot and the drive does not continue without the lead. Else the lead reports the projection (prior figure: about 1 minute between sends).
- [ ] **Step 5:** Check: `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next" && ls prompt-coach/research/live-tests/weak12/c3/answers | grep -c -E "^Q[0-9]{2}\.md$"'` equals `grep -c -P '\tok$' .ledger/2026-10-22-prompt-coach-c3-sandbox/run_sheet.tsv` and is `<= 2`; `grep -c '^timeout_s=[0-9]' .ledger/2026-10-22-prompt-coach-c3-sandbox/logs/pilot.txt` -> `1`. On the parent the folder is absent.
- [ ] **Step 6:** Echo check: `grep -l -F -f .ledger/2026-10-22-prompt-coach-c3-sandbox/prompt_heads.txt prompt-coach/research/live-tests/weak12/c3/answers/*.md | wc -l` -> `0` (no answer carries a prompt echo); a matching file is cut back to the answer text by the driver before the next send.

---

### Task 8: The remaining 46 sends   [DRIVER]

Depends: 7

**Files:**
- Create: `C3/answers/<qid>.md` (up to 46 more), rows in `LEDGER/run_sheet.tsv`, lines in `LEDGER/logs/parked.txt`

- [ ] **Step 1:** Driver repeats Task 7 Steps 1-2 for the remaining qids in order, with the pilot's `timeout_s`. The row is written before the answer file.
- [ ] **Step 2:** Technical failure: one retry (a new row with `attempt` 2, the first row `tech-fail`, no answer file kept); second failure on the same send: status `parked`, qid appended to `parked.txt`, drive goes on. Three parked in a row stops the drive for Ian. A miss is never retried.
- [ ] **Step 3:** At 200k context the driver writes its last row and stops. The lead confirms with `claude agents --json --all` that it is no longer live, then launches the successor with the Task 2 Step 5 command (`--chrome` included, as the whole Bash command), naming the next qid with no `ok` or `parked` row.
- [ ] **Step 4:** On any stop condition in Global Constraints the driver stops and the lead notifies Ian.
- [ ] **Step 5:** Checks (from ROOT): `bash -c 'set -o pipefail; tail -n +2 .ledger/2026-10-22-prompt-coach-c3-sandbox/run_sheet.tsv | cut -f1 | sort -u | grep -c "^Q"'` -> `48`; answer-file count equals `grep -c -P '\tok$' .ledger/2026-10-22-prompt-coach-c3-sandbox/run_sheet.tsv`; `grep -c -P '\tparked$' .ledger/2026-10-22-prompt-coach-c3-sandbox/run_sheet.tsv` equals `grep -c . .ledger/2026-10-22-prompt-coach-c3-sandbox/logs/parked.txt`.
- [ ] **Step 6:** Echo and data checks: `grep -l -F -f .ledger/2026-10-22-prompt-coach-c3-sandbox/prompt_heads.txt prompt-coach/research/live-tests/weak12/c3/answers/*.md | wc -l` -> `0`; `grep -l -i -E '[a-z0-9._-]+@[a-z0-9-]+\.(com|net|org)|wdesk\.com' prompt-coach/research/live-tests/weak12/c3/answers/*.md | wc -l` -> `0` (a hit is cut by the driver and reported; customer-looking data stops the drive).
- [ ] **Step 7:** Run the LOCK CHECK (no output). Commit: `git add prompt-coach/research/live-tests/weak12/c3/answers && git commit -m "Prompt coach C3: sandbox answers"`.

---

### Task 9: Pass A packets and real fixture text   [script, Sonnet H2]

Depends: 8

**Files:**
- Create: `SCORE_IN/A/rulebook.md`, `SCORE_IN/A/packets_A.md`, `LEDGER/fixtext/<id>.txt` (12), `LEDGER/logs/fixtext_check.txt`
- Read: `prompt-coach/research/live-tests/SCORING_RULES.md`, KEY, `LEDGER/id_map.tsv`, `C3/answers/*`, `FIX/*`, `LEDGER/scripts/fixtext.py`, `LEDGER/page_text/*`

**Interfaces:**
- Produces: `SCORE_IN/A/packets_A.md`, in qid order, one packet per answer file: `## Qnn`, the key entry for that send's id with found items numbered F1..Fn and optional items O1..On (`job`, `found`, `hard`, `optional`, `mustNotClaim`, `absent`), the fixture text for that id, the answer. No id, version, run or prompt. Scorers write `found` as `<count> (F1, F3)` using those labels only.

- [ ] **Step 1:** For each fixture run `python -I .ledger/2026-10-22-prompt-coach-c3-sandbox/scripts/fixtext.py <file>` (python stdlib; lead-tested on fr_w1 and grc_w3) into `LEDGER/fixtext/<id>.txt`; all 12 from the real hashed files, not rebuilt from drafts. Write a completeness line per id to `fixtext_check.txt` (non-empty, and every figure of the key's `found` items appears literally, except the two SUS-W1 sums).
- [ ] **Step 2:** Diff `LEDGER/fixtext/<id>.txt` against `LEDGER/page_text/<id>.txt` for all 12 ids and report the count that differ in `fixtext_check.txt` (disclosed in the evidence doc, not gating).
- [ ] **Step 3:** Copy `SCORING_RULES.md` to `SCORE_IN/A/rulebook.md`. Build `packets_A.md` from `id_map.tsv`, with the key's answer-bearing fields only (no `format`; the key has none).
- [ ] **Step 4:** Checks (from ROOT): `grep -c -E 'FR-W|GRC-W|SUS-W|fr_w|grc_w|sus_w' .ledger/2026-10-22-prompt-coach-c3-sandbox/score_in/A/packets_A.md` -> `0`; `grep -c -F -f .ledger/2026-10-22-prompt-coach-c3-sandbox/prompt_heads.txt .ledger/2026-10-22-prompt-coach-c3-sandbox/score_in/A/packets_A.md` -> `0`; `grep -c '^## Q' .ledger/2026-10-22-prompt-coach-c3-sandbox/score_in/A/packets_A.md` equals the answer-file count; any hit on `\b(original|improved)\b` is listed and read by the lead, not failed automatically.
- [ ] **Step 5:** `ls .ledger/2026-10-22-prompt-coach-c3-sandbox/fixtext | grep -c '\.txt$'` -> `12`.

---

### Task 10: Pass A scoring, Opus and Codex, then freeze   [Opus H3 + Codex run by the lead]

Depends: 9

**Files:**
- Create: `LEDGER/logs/opus_passA.tsv`, `LEDGER/logs/codex_passA.tsv`, `LEDGER/logs/codex_passA_raw.txt`, `LEDGER/logs/codex_run.txt`, `LEDGER/logs/frozen.txt`
- Read (scorers): only `SCORE_IN/A/rulebook.md` and `SCORE_IN/A/packets_A.md`

**Interfaces:**
- Pass A TSV columns: `id	found	false	extra	hard	invented	clarify	source	evidence`, where `id` is the qid; `hard` = Y exactly when the key's `hard` item is in the found set (R4, R15).

- [ ] **Step 1:** H3 (fresh Opus, quality decides) gets the prompt "read only SCORE_IN/A/rulebook.md and SCORE_IN/A/packets_A.md; write LOGS/opus_passA.tsv; never open id_map.tsv, run_order.tsv, run_sheet.tsv, improved.json, the repo or any codex_pass file". It scores all packets under R1-R15.
- [ ] **Step 2:** Lead greps H3's transcript: `grep -c -E 'id_map|run_order|run_sheet|improved\.json|codex_pass' <transcript>` -> `0`.
- [ ] **Step 3:** Lead reads the two Codex gotchas, makes an empty temp folder outside the repo (`ls -A` prints nothing) and a scratch `CODEX_HOME`. In a background job: `codex exec --sandbox read-only -c windows.sandbox=unelevated --output-last-message <LOGS>/codex_passA_raw.txt -` with stdin = rulebook plus `packets_A.md` (chunks of 12 qids if long), stdin closed; append `exit=<code> pass=A chunk=<n>` to `codex_run.txt` after each call. Codex does not write the TSV; the lead copies its TSV lines from the raw file to `codex_passA.tsv`.
- [ ] **Step 4:** Lead greps Codex's log: `grep -c -E 'id_map|run_order|run_sheet|improved\.json|opus_pass' <codex log>` -> `0`; `bash -c 'set -o pipefail; { grep -v "^exit=0 " .ledger/2026-10-22-prompt-coach-c3-sandbox/logs/codex_run.txt || true; } | wc -l'` -> `0`; `grep -c -P '^Q\d\d\t' .ledger/2026-10-22-prompt-coach-c3-sandbox/score_in/A/packets_A.md` -> `0` (no score row in any input).
- [ ] **Step 5:** Row-count checks (from ROOT): `grep -c '^Q'` on each of `opus_passA.tsv`, `codex_passA.tsv` equals the answer-file count; `bash -c 'set -o pipefail; tail -n +2 .ledger/2026-10-22-prompt-coach-c3-sandbox/logs/opus_passA.tsv | { grep -v -P "^Q\d\d\t([^\t]*\t){3}[YN]\t" || true; } | wc -l'` -> `0`.
- [ ] **Step 6:** Freeze: `sha256sum opus_passA.tsv codex_passA.tsv` written to `LOGS/frozen.txt`; Pass B packets are not built until this file exists.

---

### Task 11: Pass B packets and scoring, Opus and Codex   [Sonnet H4, Opus H5, Codex by the lead]

Depends: 10

**Files:**
- Create: `SCORE_IN/B/rulebook.md`, `SCORE_IN/B/packets_B.md`, `LEDGER/logs/opus_passB.tsv`, `LEDGER/logs/codex_passB.tsv`, `LEDGER/logs/codex_passB_raw.txt`
- Read (scorers): only `SCORE_IN/B/rulebook.md` and `SCORE_IN/B/packets_B.md`

**Interfaces:**
- Pass B packet = qid, the prompt as sent (original or `strong` from `improved.json`), and the answer. No key, no Pass A row. Pass B TSV columns: `id	table	job	format	evidence` (table and format by R6, job by R14). Pass B can show the version through the prompt; that is disclosed in the evidence doc.

- [ ] **Step 1:** Lead checks `sha256sum -c LOGS/frozen.txt` -> both `OK`; only then H4 (Sonnet) builds B from `id_map.tsv` and `improved.json`/`prompts.json`.
- [ ] **Step 2:** Check: `grep -c '^## Q' .ledger/2026-10-22-prompt-coach-c3-sandbox/score_in/B/packets_B.md` equals the answer-file count; `grep -c -E 'opus_pass|codex_pass|id_map' .ledger/2026-10-22-prompt-coach-c3-sandbox/score_in/B/packets_B.md` -> `0`.
- [ ] **Step 3:** H5 (a second fresh Opus, not H3) is given only the two B files, writes `opus_passB.tsv`; lead greps its transcript for `id_map|run_order|run_sheet|improved\.json|codex_pass` -> `0`.
- [ ] **Step 4:** Lead runs Codex on B as in Task 10 Step 3, then greps its log for `id_map|run_order|run_sheet|improved\.json|opus_pass` -> `0`.
- [ ] **Step 5:** Checks: `grep -c '^Q'` on each of `opus_passB.tsv`, `codex_passB.tsv` equals the answer-file count; `sha256sum -c LOGS/frozen.txt` -> `OK` for both A files (neither A file changed).

---

### Task 12: Adjudication, A fields then B fields   [two fresh Opus adjudicators H6, H7]

Depends: 11

**Files:**
- Create: `LEDGER/diff.js`, `LEDGER/logs/diff_A.tsv`, `LEDGER/logs/diff_B.tsv`, `LEDGER/logs/adjudicated_A.tsv`, `LEDGER/logs/adjudicated_B.tsv`, `LEDGER/logs/agreement.txt`

**Interfaces:**
- Produces: `diff_A.tsv` / `diff_B.tsv` = (qid, field, opus value, codex value) where the two scorers differ (`found` compared as the F-label set; `hard` differences are reported as `found` differences, R15). `adjudicated_A.tsv` has final found, false, extra, invented, clarify, source per qid; hard re-derived from adjudicated found, never adjudicated. `adjudicated_B.tsv` has final table, job, format per qid. `agreement.txt` = per-field agreement counts.

- [ ] **Step 1:** Write and run `LEDGER/diff.js` (a script, not a helper) over the four TSVs; write both diff files and `agreement.txt`.
- [ ] **Step 2:** H6 (adjudicator A, fresh Opus, neither a scorer) gets the rulebook, `packets_A.md` and the diff_A rows only; never `packets_B.md`; writes one ruling per differing field with the rule number into `adjudicated_A.tsv` (agreed fields carried over by the script).
- [ ] **Step 3:** Lead greps H6's transcript: `grep -c -E 'id_map|run_order|run_sheet|improved\.json|packets_B' <transcript>` -> `0`.
- [ ] **Step 4:** Only after `adjudicated_A.tsv` exists, H7 (adjudicator B, fresh Opus) gets the rulebook, `packets_B.md` and the diff_B rows; writes `adjudicated_B.tsv`; lead greps as in Step 3.
- [ ] **Step 5:** Keep an "agree only" reading: per field, the value is kept only where both scorers agreed (columns `agree_only_*` in the joined file made by Task 13's tally).
- [ ] **Step 6:** Check: `grep -c '^Q'` on `adjudicated_A.tsv` and `adjudicated_B.tsv` each equal the answer-file count; `grep -c -E 'FR-W|GRC-W|SUS-W' diff_A.tsv diff_B.tsv adjudicated_A.tsv` -> `0` for each (still blind); `sha256sum -c LOGS/frozen.txt` -> `OK`. On the parent the files are absent.

---

### Task 13: Tally and evidence doc   [script + Opus H8]

Depends: 12

**Files:**
- Create: `LEDGER/tally.js`, `LEDGER/evid_path.txt`, the evidence doc at EVID
- Read: `LOGS/adjudicated_A.tsv`, `LOGS/adjudicated_B.tsv`, `LEDGER/id_map.tsv`, `LOGS/agreement.txt`, `LOGS/capture_vs_probe.txt`, `LOGS/fixtext_check.txt`, `LEDGER/run_sheet.tsv`, `LOGS/parked.txt`, KEY

- [ ] **Step 1:** Resolve EVID once: `docs/evidence/<UTC date of the finish>-prompt-coach-c3-sandbox.md`, written to `LEDGER/evid_path.txt`. Every later step reads this file.
- [ ] **Step 2:** Write `LEDGER/tally.js`: join the two adjudicated files to `id_map.tsv`; per-send result = found/keycount >= .75 AND false 0 AND invented 1 AND table 1 AND format 1 AND job 1 (key counts read from KEY); print C3a (improved intended of 24, parked = failure), C3b over scored improved sends ("0 of <n> scored, <p> parked"), C3c over scored sends and over (id, run) pairs where both versions were scored, coverage "n of 24" per bar, the same three for originals, per-id table, scorer agreement, the "both agree" reading, per-send times from the run sheet (t_start to t_saved).
- [ ] **Step 3:** Run `node .ledger/2026-10-22-prompt-coach-c3-sandbox/tally.js | tail -40`; exit status 0.
- [ ] **Step 4:** H8 (Opus) writes the evidence doc: method (made-up fixtures, own sandbox, driver via Claude in Chrome, capture through the clipboard call, scorers' real-file text from `fixtext.py` and the page-text diff count, Pass B disclosure that the prompt shows the version, id map ledger-only and the order file in the repo holding qids only with its id-map hash), the three bars, the prediction line quoted exactly (assumed C3a >= 22 of 24 and C3b 0 of 24; disproved by 21 or fewer or any invented fact) and the result, "key format: not available (key has no format field)", any "partial coverage" marks, parked sends and retries, measured vs read labels. A miss is reported, not tuned.
- [ ] **Step 5:** The risk check: count the generic job line ("Identify and list the key points and where each one appears", case-insensitive) in the captured `improved.json`; report that count, its 2x sends and how many failed, with the probe's 7 of 12 beside it.
- [ ] **Step 6:** Check: `cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next" && grep -c -E 'C3a|C3b|C3c' $(cat .ledger/2026-10-22-prompt-coach-c3-sandbox/evid_path.txt)` -> `>= 3`; `grep -c 'key format: not available' $(cat .ledger/2026-10-22-prompt-coach-c3-sandbox/evid_path.txt)` -> `1`; the order file's last line hash equals `sha256sum` of `id_map.tsv` (equal). On the parent the doc is absent.

---

### Task 14: README, C3 row, certification, commit   [lead]

Depends: 13

**Files:**
- Modify: `prompt-coach/README.md` (status line), `docs/evidence/2026-10-22-prompt-coach-done-when.md` (the C3 row, line 13 on BASE, currently "PENDING, never run")
- Create: (already) the evidence doc at EVID

- [ ] **Step 1:** If `LOGS/parked.txt` is non-empty, stop (STOP-D): the affected bars are marked "partial coverage" and certifying them is Ian's call. Notify, ask, wait.
- [ ] **Step 2:** Replace the C3 row and the README status line with the numbers, and fix any nearby count they make wrong, in the same commit as the evidence doc.
- [ ] **Step 3:** Checks (from ROOT): `grep -c 'PENDING, never run' docs/evidence/2026-10-22-prompt-coach-done-when.md` -> `0` (on the parent it is 1: the test fails there); the LOCK CHECK prints nothing.
- [ ] **Step 4:** Suite, as two commands each of which must exit 0: `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next/prompt-coach" && node tests/c5_gate.js | tail -3'` and `bash -c 'set -o pipefail; cd "C:/Users/teasp/Documents/workiva/.claude/worktrees/prompt-coach-c1-next/prompt-coach" && node tests/done_when.js --only C2,C4 | tail -3'`.
- [ ] **Step 5:** Commit: `git add <EVID from evid_path.txt> docs/evidence/2026-10-22-prompt-coach-done-when.md prompt-coach/README.md && git commit -m "Prompt coach C3 sandbox: results (C3a/C3b/C3c)"` with the attribution lines from the session reminder.

---

## Self-review (spec coverage)

- (a) protocol 1 -> Task 1; 2 -> Tasks 2-3; 3 -> Tasks 4-5; 4 -> Task 6; 5 -> Tasks 7-8; 6 -> Task 7 and STOP-C; 7 -> Task 8 Step 3.
- (b) scorers: Pass A -> Tasks 9-10; Pass B -> Task 11; adjudication and agreement -> Task 12; per-send result -> Task 13.
- (c) data and site -> Global Constraints and Task 8 Step 6; (d) stop rules -> Global Constraints, Stops, Task 8.
- Success criteria, prediction, scope (evidence doc, C3 row, README in one commit) -> Tasks 13-14. Cost -> table above.
- Run-prompt steps 9-11 (final review, merge stop, hand-off) belong to the lead.

## Spec ambiguities resolved

- Capture: `state` is closure-scoped, so the Strong text is read from the page's `navigator.clipboard.writeText` call on `#copyStage` (lead decision 1).
- Scorer fixture text comes from the real hashed files via `fixtext.py`, all 12 (lead decision 2).
- The key has no `format` field: no "key format" column; the evidence doc says not available (lead decision 3).
- `run_order.tsv` carries pos and qid only plus the id-map hash line; the map stays in the ledger.
- Parked sends: C3a counts a parked improved send as a failure; C3b and C3c over scored sends with coverage printed; certifying partial-coverage bars is Ian's (lead decision 4).
- Blindness: Pass A and B packets are separate, B built only after A is frozen; two adjudicators (lead decision 5). Pass A has no prompt; Pass B shows it.
- C3b = count of improved sends with at least one invented fact, pass = 0.
- Run total estimate is about 1.23M, 30k over the cap: flagged in the cost section for the lead's STOP-D check.
