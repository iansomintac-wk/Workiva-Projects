# Fit Finder item-71 labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Apply the program lead's answers to Ian's five item-71 checks in the fresh gold set and the README.

**Architecture:** Five label edits in one JSONL file, then one README paragraph update with the suite's new printed line. No engine change; dist must stay byte-identical.

**Tech Stack:** Node test scripts, JSONL, Markdown.

**Spec:** Lead's task packet (2026-10-17); `fit-finder/README.md` lines 212-214.

Suite: cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder && node tests/catalogue.test.js
Data: fit-finder/data

## Global Constraints

- Keep `"by": "model"` on every row (the check accepts only `ian` or `model`).
- Do not open or quote anything from `fit-finder/data/real/`.
- Leave README line 185 (history) as is.
- Helper-token estimate: Task 1 about 15k; run total about 15k. Paid calls: none. Locked files: everything except the two files below. Group: none. Tune: no.

---

### Task 1: Apply the five answers (implementer: Sonnet)

**Files:**
- Modify: `fit-finder/data/card-gold-fresh.jsonl` (rows G4, G21, G16, G19, G26)
- Modify: `fit-finder/README.md` (around lines 212-214)

```rehearse
sed -i -E '/^\{"id":"(G4|G21|G16|G19)",/ s/"cards":\[[^]]*\]/"cards":[]/' fit-finder/data/card-gold-fresh.jsonl
sed -i -E '/^\{"id":"G26",/ s/"cards":\[[^]]*\]/"cards":["gen-summarize-file"]/' fit-finder/data/card-gold-fresh.jsonl
```

- [ ] **Step 1: Baseline.** Run the Suite. Expected: exit 0, prints `fresh prompts first card right: 10 of 23 that fit; wrong card 6 (G2,G14,G15,G22,G26,X1)`.
- [ ] **Step 2: Edit the data.** In `fit-finder/data/card-gold-fresh.jsonl` set `"cards":[]` on G4, G21, G16, G19 and `"cards":["gen-summarize-file"]` on G26 (the two sed lines in the rehearse block do exactly this). Check: `grep -c '"by":"model"' fit-finder/data/card-gold-fresh.jsonl` equals the file's line count, and `git diff --stat` shows exactly 5 changed rows.
- [ ] **Step 3: Run the Suite.** Expected: exit 0, `node tests/catalogue.test.js | grep -c FAIL` prints 0, and it prints `fresh prompts first card right: 15 of 23 that fit; wrong card 5 (G2,G14,G15,G22,X1); no card where one fits 3 (G10,G12,G20)`. Copy the line exactly as printed.
- [ ] **Step 4: Edit README.** In `fit-finder/README.md` (rule C, fresh set, around lines 212-214) replace the old fresh print line and the sentence "first card right 10 of 23, wrong card 6" with the new line and figures (15 of 23, wrong 5). Add three short sentences: (1) Ian's 5 checks were answered by the program lead, a model (lead 17, 2026-10-17), on Ian's words "You were supposed to provide the answers" (15:30:18Z). (2) The rows stay `by: model` and Ian can overturn any of them (1 no, 2 no, 3 yes, 4 yes, 5 no). (3) Done-when (proposal A, accepted the same way): first card right on at least 12 of 23 and wrong on at most 3 on this set, then the same bar scored once on a second untouched real set; now right is met (15), wrong is not (5).
- [ ] **Step 5: Dist unchanged.** Run `cd C:/Users/teasp/Documents/workiva/.claude/worktrees/fit-finder-v4/fit-finder && node tests/build.js && git status --short dist`. Expected: no output. Then `git show HEAD:fit-finder/dist/fit-finder.html | wc -c` prints 82673, matching the README dist byte count.
- [ ] **Step 6: Commit** only the two files: `git add fit-finder/data/card-gold-fresh.jsonl fit-finder/README.md` then commit "Fit Finder: item-71 labels answered by the program lead (fresh right 15 of 23, wrong 5)" ending with the attribution lines from the session reminder.
- [ ] **Step 7: Rehearse check.** Run `node C:/Users/teasp/Documents/studio-harness/bin/rehearse.mjs check-task docs/superpowers/plans/2026-10-17-fit-finder-item71-labels.md 1 <parent> <commit>`. Expected: exit 0.

## Expected breaks
