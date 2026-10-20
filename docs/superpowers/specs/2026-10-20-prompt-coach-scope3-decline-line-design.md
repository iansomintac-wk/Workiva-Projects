# Prompt coach: Scope 3 decline line in every Strong rewrite with a file (design)

Date: 2026-10-20. Talk session 7881a242 (predecessor run lead 0d1b55ae; talk prompt
`docs/PROMPT_COACH_SCOPE3_RESHAPE_NEXT_TALK_PROMPT.txt` on branch worktree-prompt-coach-scope3-reshape).
Branch: `worktree-prompt-coach-scope3-decline-line`, from `origin/prompt-coach` at 59b09c1 (base).
Status: closed, nothing shipped. The sandbox check failed (ask 3 refused with the line; evidence
`docs/evidence/2026-10-20-prompt-coach-scope3-decline-line-sandbox.md`), and Ian closed it on 2026-10-20 (rulings below).
Section 4 is not built.
Classification: bounded (one condition in existing code), customer-facing wording.

Marking: **measured** = run in this talk; **read** = from a document, log or helper report; **assumed** = reasoned only.
Ledger (git-ignored): `.ledger/2026-10-20-prompt-coach-scope3-decline-line/rulings.md`.

## Ian's rulings (verbatim, this talk, AskUserQuestion)

- 2026-10-19: record the run's rulings: "Yes, record and commit (Recommended)" (studio-harness commit 6f83760).
- 2026-10-20: the reshape branch: first "would deep targeted research help understand how we could do this best?",
  then "Drop branch, research next (Recommended)". The branch `worktree-prompt-coach-scope3-reshape` stays on origin,
  unmerged; base is kept.
- 2026-10-20: next attempt: "Prompt line, no detection (Recommended)".
- 2026-10-20: this design: "Approve, sandbox first (Recommended)".
- 2026-10-20, after the sandbox FAIL (talk after session 28412002): "Close, ship nothing (Recommended)".

## 1. Why (evidence)

- The reshape branch scored 2/12 should-warn (base 2/12) and 1/12 near-miss warnings (read, evidence doc
  `docs/evidence/2026-10-19-prompt-coach-scope3-reshape.md` on the reshape branch). Its gate (ask AND file say
  "Scope 3") passed 3 of 12 should-warn items, so detection could not reach the bar (read, same doc).
- Research, $0, two Sonnet helpers (notes in `docs/research/2026-10-19-answer-not-in-document-detection.md` and
  `docs/research/2026-10-19-scope3-ask-and-layout-wording.md`; confidence medium and medium-low):
  - UAEval4RAG (arXiv 2412.12300v3, Table 18, GPT-4, fetched by the lead 2026-10-20): an instruction to ask for
    clarification when information is missing raised acceptable handling of unanswerable requests on TriviaQA from
    49.0% to 84.7% with correctness 88.4% -> 87.2%; a stricter "reject to answer" prompt cut MuSiQue correctness
    from 49.0% to 16.0%. **measured** (lead spot-check; the helper had quoted Table 3, 53.2% -> 84.3%, same
    direction). No source tests numeric or GHG figures.
  - Real files often label category rows by name or number only, with "Scope 3" in a heading; category words
    (investments, franchises, leased assets, capital goods) collide with finance wording. **read** (helper;
    report PDFs did not load).
  - The 15 GHG Protocol category names: confirmed against Normative's page (fetched by the lead). **measured**
- Base already has the line: `DECLINE` in `prompt-coach/engine/rewrite.js:408`, "If the file does not contain what
  this needs, say so instead of estimating.", added only when the `unsupported` note fires, the prompt is not already
  strong, and Strong has a generated Evaluate sentence (`rewrite.js:574`, README line 86). **measured** (grep at 59b09c1)

## 2. Scope

In (only after the sandbox check passes): the same `DECLINE` line, same wording, is added when the prompt names
Scope 3 (the ask test `/scope\s*3/i` used at `rewrite.js:440`), a file is attached, the prompt is not already strong, and Strong has a
generated Evaluate sentence, whether or not the `unsupported` note fires. README known-limits line and dist byte
count (LF blob, `git cat-file -s`) in the same commit.

Out: any detection change (gate, categories, explain rule); the reshape branch's code; the `unsupported` note itself;
Strong prompts and prompts with no generated Evaluate sentence; non-Scope-3 asks; grades, weights, classifier.

## 3. The check first: Workiva AI sandbox, 6 runs, by hand

Made-up data only. One file (CSV or a small sheet) titled "FY2025 Scope 3 emissions (tCO2e)" listing category 1
Purchased goods and services, category 4 Upstream transportation and distribution and category 6 Business travel,
each with a made-up figure; no category 15.

Asks, each run twice, once without and once with the line appended exactly:
1. Figure present: "Summarize our Scope 3 category 6 business travel emissions for FY2025 from the attached file."
2. Figure missing: "Summarize our Scope 3 category 15 investments emissions for FY2025 from the attached file."
3. Definition: "In plain terms, what does Scope 3 category 15, investments, cover? No numbers needed."

Pass, all with the line: ask 1 states the file's category 6 figure; ask 2 says category 15 is not in the file and
gives no number; ask 3 explains category 15 and does not refuse or say the file lacks it.
Ship only if pass AND the line changed something: at least one of asks 1-2 without the line estimates, invents or
omits the missing-data statement that the with-line run makes. If the without-line runs already behave as the pass
asks, the line adds nothing and is not shipped (reported, not tuned).

Prediction (assumed): without the line Workiva AI already declines on ask 2 (an earlier tricky-batch test noted it
"declined well", read only), so the most likely result is "no change, not shipped"; the main risk is the line
making ask 3 refuse. Disproved by: ask 2 without the line giving a number, or ask 3 with the line refusing.

The sandbox shows what this sandbox's Workiva AI does, not what every customer has (read, memory workiva-sandbox).

## 4. Build (only on a pass, a separate run)

1. Unit test first (fails on base): a Scope 3 ask with a file where the `unsupported` note does not fire gets the
   line; a Strong prompt and a non-Scope-3 ask do not.
2. The condition change in `rewrite.js`; guards identical to base except the intended Strong text change, which is
   listed per item (fixtures 19, `simulate.js`, `customer_check.js`, `eval.js rulefeat`, train warnings 0).
3. README + dist; evidence doc with the sandbox answers quoted.
</content>
</invoke>
