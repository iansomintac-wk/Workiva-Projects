# Prompt Coach C3: sandbox test of the weak-12, design

Talk session 055a0f72, 2026-10-22 from 23:41Z. Branch `prompt-coach-c3-sandbox` from `prompt-coach-c1-next` @ 2b2f1ba.
That base is NOT merged into `prompt-coach` (measured: origin/prompt-coach is ae60341, and c1-next is not on origin).
The PM ruled branching off it reversible and not Ian's (PM, this talk); the merge of c1-next and of this branch is the
run's last step and needs Ian's yes by hand (memory `merge-gate-no-npm-test`: `merge-gate.mjs` always refuses here).
Classification: a measurement run. No coach code changes. The fresh strong-30 (`data/done_when_strong.jsonl`) stays
UNREAD.

"Measured" = run in this talk. "Read" = from a doc or a helper's report. "Assumed" = reasoning only, with its check.

## Rulings (verbatim)

- Ian, 2026-10-22 (ruling 2026-10-22-prompt-coach-done-when, read): "Prompt Coach is done when the output provided for
  the improved prompts follow prompting best practices i.e if I were to use the provided improved prompt in Workiva AI
  that it would give me the intended output without mistakes or issues. [...]"
- Ian, 2026-10-22 ~06:27Z, card '[Ian] Blanks' (read): "Ready to paste + questions (Recommended)": the improved prompt
  has no blanks and is pasted as-is; the questions list below it is not part of the copied prompt.
- Ian, 2026-10-22 ~23:37Z, card '[Ian] C1' (read): "Close C1, go to sandbox (Recommended)".
- Ian, 2026-10-22 23:51Z, card '[Ian] C3 keys' (this talk; `answered-for-ian.jsonl` row `left: "ian-kind"`, so the
  answer is Ian's): "Approve with PM edits (Recommended)". The weak-12 keys are confirmed with three edits (FR-W2 bonus
  line moved to optional; GRC-W1 hard item is the AP-02/AP-04 duplicate; SUS-W1 Scope 1 totals credited on either
  labelled basis). Applied to `prompt-coach/research/live-tests/weak12/answer_key.json`. Batch and reasons:
  `prompt-coach/research/captures/2026-10-22-c3-weak12-keys-batch.md`.
- Inside the same card, PM proxy decided, Ian did not overturn: (1) the improved prompt is the coach's **Strong**
  stage (the page's stages are Weak / Better / Strong, `web/template.html:269-271`); (2) "in the requested format" is
  judged against the prompt as sent (SCORING_RULES R6); the key's own `format` field is reported, not gating.

## Probes (measured in this talk)

- Coach output for weak-12 with each fixture attached, built offline from the drafts' fixture specs
  (`prompt-coach/docs/research/c3-probes/c3probe.js`, counts in `c3probe_counts.txt`): 12 of 12 grade weak; Strong
  30-57 words; 0 blanks; 7 of 12 Strong prompts carry the coach's generic job line "Identify and list the key points
  and where each one appears" (FR-W2, FR-W4, GRC-W1, GRC-W4, SUS-W2, SUS-W3, SUS-W4); 3 of 12 keep "the attached ..."
  and name no `@file` (FR-W2, GRC-W4, SUS-W4). This is an approximation: the page reads files in the browser
  (`engine/files.js`, parsers from cdnjs), so the run captures the real text from the built page (step 2 below).
- Keys (`prompt-coach/docs/research/c3-probes/keycheck.js`): 42 key items before the edits; 40 have every figure literally in the fixture spec;
  the 2 others (SUS-W1 totals) are sums, checked by hand as right. Every hard item matches a found item.
- (e) Labels: before this talk, 0 records of Ian confirming the weak-12 keys (grep of `docs/`, `prompt-coach/research`,
  README, `~/.claude/answered-for-ian.jsonl` and the done-when ledger; plan Task 8's look batch was never written). Now
  confirmed (ruling above). The spec line "C1 and C3 do [wait]" (done-when design :107) is satisfied.

## Read (not re-run here)

- Earlier sandbox method (`docs/evidence/2026-10-20-prompt-coach-scope3-decline-line-sandbox.md:11-45`, spot-checked
  by the lead): sandbox.wdesk.com, private folder "Prompt coach test - Ian", Files upload; new chat per run; file
  attached with `@` (source count 1); a zoom on the input before send; answer copied from the panel's `innerText`;
  6 runs sent 02:20:45 to 02:27:52Z, about 1 minute apart (send times, not answer-complete times); one retry for a
  technical miss, misses never retried.
- Codex scoring method and gotchas (`docs/superpowers/plans/2026-10-18-prompt-coach-tricky-batch.md:119,169,228,246`;
  `docs/PROMPT_COACH_DONE_WHEN_RUN_PROMPT.txt:51-53`; `docs/evidence/2026-10-20-prompt-coach-quote-line.md:50`;
  `docs/evidence/2026-10-19-share-ready.md:72-73`): `codex exec` read-only, from an empty temp folder, inputs on stdin
  and stdin closed; `-c windows.sandbox=unelevated`; a scratch `CODEX_HOME` in a background job (error 1223).

## (a) Run protocol

1. **Pre-flight, no browser.** `node tests/validate_done_when_sets.js` prints VALID; sha256 of the 12 fixtures and of
   `dist/prompt-coach.html` written to the ledger. One browser driver at a time: `claude agents --json --all` shows no
   other live session driving Chrome; if one does, stop for Ian.
2. **Capture the improved prompts from the built page.** The driver serves `prompt-coach/dist/` on 127.0.0.1 with a
   one-line `node` static server (no install), opens it in a new Chrome tab, and for each id types the original prompt,
   attaches the fixture through the page's file input, selects Strong, and reads `state.result.stages.strong.prompt`
   (the text the copy button copies) into `research/live-tests/weak12/c3/improved.json` {id, original, strong,
   distSha}. Count how many differ from the offline probe; report it, it does not gate. The questions list is not
   captured into the prompt.
3. **Ian signs in** to https://sandbox.wdesk.com/ (a run stop for Ian, notified). The driver uploads the 12 fixtures to
   Files > "Prompt coach test - Ian" (Upload, not Import; skip a name already there), and writes a text report of the
   12 names it sees. If uploads are refused, Ian runs `/add-dir` for the fixtures folder.
4. **Order.** 48 sends: 12 ids x {original, improved} x 2 runs. A fixed-seed shuffle (seed in the ledger) with no two
   sends of the same id adjacent and versions alternating where possible; written to `c3/run_order.tsv` and committed
   before the first send. Each send gets a qid (Q01-Q48); the id map (qid -> id, version, run) lives only in the
   ledger.
5. **Each send.** Workiva AI panel, new chat; attach the file with `@` and pick its chip (source count 1); wait 2 s;
   paste the prompt text exactly (the improved text keeps its own literal `@name` text); read the input box text back
   and compare to the prompt (must be equal apart from the chip); send; wait for the answer to finish; copy the answer
   from the panel's `innerText` to `c3/answers/<qid>.md` (answer text only, no version); log UTC send and finish times
   and the source count in the ledger run sheet. Text reports only, no screenshots.
6. **Pilot.** The first 2 sends of the order are the pilot. Measure per-send time (start to answer saved) and
   send-to-finish; set the per-send timeout to max(3 min, 3x the pilot median). Pilot sends count if clean. Report the
   projected total (48 x median) before going on; read prior figure: about 1 minute between sends.
7. **Driver context.** The driver stops at 200k; each saved answer has its ledger row first, so a successor resumes at
   the next qid.

## (b) Scorers

- **Primary:** a fresh Opus helper (quality decides the result), per `research/live-tests/SCORING_RULES.md`, rows in
  its TSV format. **Second provider:** Codex, run by the lead per the method above. Neither sees the other's rows.
- **Blind to the version.** Pass A (no prompt shown): inputs are the rulebook, the key (`answer_key.json`), the fixture
  text and the answer, under its qid, in qid order. It scores found, false, extra, hard, invented, source, clarify.
  These decide the good-answer test and "invented", so the version cannot reach them. Pass B (the prompt as sent is
  shown, as R6 and R14 need it): table, job, format, plus the secondary "key format" (1/0: does the answer meet the
  key's `format` field, judged as R6). Pass B can infer the version from the prompt; that is disclosed, not hidden.
- **Disagreements.** Every field where the two scorers differ goes to a fresh Opus adjudicator with both rows, the
  rulebook and the same inputs; it writes one ruling per field (as in the 2026-10-18 score files). The bar is read on
  the adjudicated rows; the "both scorers agree" reading is reported beside it. Agreement per field is reported.
- **Per-send result.** Intended answer in the requested format = good answer (found share >= .75, false 0, invented 1)
  AND table 1 AND format 1 AND job 1.

## (c) Data and site

- Fixtures are made-up (plan Task 2, `make_weak12_fixtures.js`; Example Co style). No customer-specific or real data
  in any prompt, fixture or answer file. If any sandbox page shows customer-looking data, stop.
- https://sandbox.wdesk.com/ only. Before every action the driver reads the tab URL; any host other than
  `sandbox.wdesk.com` (or the 127.0.0.1 coach page) stops the drive. Never app.wdesk.com.

## (d) Stop rules

- Technical failure (input text not equal to the prompt, chip missing, source count not 1, answer cut off, timeout,
  error banner): one retry, logged. A second technical failure on the same send parks that send and the drive goes on.
  Three parked sends in a row stop the drive for Ian.
- A miss (a wrong or poor answer) is never retried.
- Stop the drive at once for: a host other than the sandbox; a sign-in, Okta or MFA page; a billing or upgrade prompt;
  customer-looking data; Workiva AI unavailable on 2 sends in a row.
- Time per send: from the pilot (step 6), not set here.

## Success criteria

| Bar | Measure | Pass |
|---|---|---|
| C3a | improved sends that are intended answer in the requested format (adjudicated) | >= 22 of 24 |
| C3b | improved sends with invented = 0 (any invented company fact) | 0 of 24 |
| C3c | keyed findings: sum of found over the 24 improved sends vs over the 24 original sends | improved >= original |

Reported beside it, not gating: the same three for the originals; per-id table; key-format match; scorer agreement;
the "both agree" reading; captured-vs-probe differences; per-send times.

**Prediction (assumed, from the done-when spec, no prior measurement on weak prompts):** C3a >= 22 of 24 and C3b 0 of
24. Disproved by 21 or fewer, or by any invented fact. Risk measured above: 7 of 12 improved prompts swap the asked job
for "list the key points", which a key built on issues may not credit; if 3 or more of those 14 sends fail, C3a fails.

## Scope

- In: the capture, the 48 sends, two scorers and the adjudicator, the evidence doc
  (`docs/evidence/YYYY-MM-DD-prompt-coach-c3-sandbox.md`), the C3 row of
  `docs/evidence/2026-10-22-prompt-coach-done-when.md` and the README status line, all in the same commit as the
  numbers.
- Out: any engine or `rules.js` edit (held follow-ups rules.js:158 "we make", :140 "this is used to", :136 `\s*`);
  the Better stage; the yardstick tips page step; C1; the fresh 30. A C3 miss is reported, never tuned on in this run.

## Cost

No money. Usage only (Estimate, assumed, from the 2026-10-18 tricky-batch plan's figures of ~300k driver and ~100k
Codex for 24 sends): driver ~400k over 2 sessions, Opus scorer ~200k, Codex ~150k, adjudicator ~50k, plan writer,
checkers and final review ~350k: about 1.15M. Cap 1.2M tokens. Check: the run ledger's helper rows.
