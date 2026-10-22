# C1: how tools handle already-good input and uncertain detection (2026-10-22)

Tags: fetched = page read; snippet = search result only; vendor = seller claim.

## Found
- Anthropic prompt improver: fetch redirected to the general best-practices page; no statement on already-good prompts found. NOT CONFIRMED. [fetched, negative]
- OpenAI prompt optimizer (developers.openai.com/api/docs/guides/prompt-optimizer): rewrites a prompt to best practices; docs do not say whether good prompts are left unchanged; advise manual review since optimized prompt can do worse on specific inputs. Dataset-backed optimizer being deprecated (Evals read-only 2026-10-31). [fetched, vendor]
- Google prompt guidance tools: not checked (budget). NOT CONFIRMED.
- Vale: three levels suggestion/warning/error; only error gives non-zero exit; MinAlertLevel default "suggestion"; editor shows all, CI only errors; per-rule level override. https://docs.vale.sh/keys/minalertlevel.md [fetched]
- ESLint: off/warn/error; warn does not affect exit code; inline eslint-disable-next-line with named rules; docs prefer config over disable comments. https://eslint.org/docs/latest/use/configure/rules [fetched]
- Hemingway: zero counts produce praise text ("0 adverbs, well done"), Grade 6 "Good"; rule-based; thresholds community-reported. [snippet, secondary press/blogs]
- Grammarly: could not find official docs on a "no suggestions"/"looks good" state or low-confidence handling. NOT CONFIRMED. Reviews mention scores and Premium-locked suggestions only. [snippet]
- write-good, alex: not checked. NOT CONFIRMED.
- Alert fatigue: survey says >2/3 of SAST papers cite false positives as pain point, linked to lost trust; 56% of SAST warnings never addressed in 30 Java projects; actionability correlates with fix rate. Search found no quantified FP vs FN cost comparison. The 91% noise figure is unverified. [snippet, arxiv 2609.01669 and web results]

## Patterns
1. Tiered severity: separate "must fix" from "suggestion"; only top tier fails the gate (Vale, ESLint).
2. Display threshold (MinAlertLevel): show more in the editor, gate on less in CI.
3. Explicit positive state on zero hits (Hemingway "well done"), but it is heuristic, not proof.
4. Per-rule suppression / opt-in (ESLint disable comments with named rule).
5. Optimizers rewrite always; no documented no-change state (OpenAI, Anthropic) so the "No changes needed" state is ours to design. Advice: human review.
6. Actionability reduces ignored warnings (SAST study).

## Fit
Undetected-but-present element: pattern 1+2. Treat "cannot confirm" as a lower tier (suggestion, "check this") not a failure, and say "No changes needed" only when no element is missing and none is merely unconfirmed, or word it as "no changes needed that we could detect".
