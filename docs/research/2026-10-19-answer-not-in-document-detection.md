# Answer-not-in-document detection and abstention (read 2026-10-19)

Brain entries: none supplied in the packet. Tags: fetched = page text read via fetch tool; snippet = search-result summary only (not a fact until opened).

## Q1 Literature
- SQuAD 2.0 (https://arxiv.org/abs/1806.03822) [snippet x2]: 50k+ crowd-written unanswerable questions; a system at ~86% F1 on SQuAD 1.1 gets ~66% F1 on 2.0 (66.3 vs human 89.5 per secondary paper arXiv:2102.06793, snippet). Unanswerables were written to look relevant, so lexical overlap is a poor signal. (inference, assumed)
- AbstentionBench, Meta 2025 (https://arxiv.org/html/2506.09038) [fetched, first 100k of 157k chars]: 20 datasets, 20 LLMs; abstention unsolved; reasoning fine-tuning cut abstention ~24% avg; reasoning models hallucinate missing context. A system prompt encouraging abstention helped "without significant degradation in abstention precision" but "unlikely to fundamentally address" the gap. Numbers (Fig 8b, Appendix C) not read.
- UAEval4RAG (https://arxiv.org/html/2412.12300v3) [fetched]: acceptable-rejection ratio across categories 49-62% by default; underspecified requests hardest (TriviaQA 24%). Differs by LLM: TriviaQA overall acceptable GPT-4o 52.5%, Claude 3.5 Sonnet 77.0%, Gemini Pro 51.0%.
- Survey "Know Your Limits" (https://arxiv.org/abs/2407.18418) [snippet]: abstention taxonomy only; no effect size seen.
- Tomani et al. uncertainty-based abstention [snippet]: dropping a few most-uncertain samples gives +2-8% correctness; "avoid 50% hallucinations". Not an instruction method.
- Lexical/keyword pre-check reliability: NO source found measuring keyword pre-checks for unanswerability. Could not confirm.

## Q2 Does an instruction reduce fabrication?
Measured (UAEval4RAG Table 3, fetched), TriviaQA: default acceptable 53.2% -> prompt#1 (explicit rejection instruction) 84.3%, correctness 88.0 -> 88.4. Prompt#2 (stricter) acceptable 83.0, unanswered 88.0, but correctness 74.8. MuSiQue: acceptable 61.7 -> 85.8 (#1) / 88.0 (#2); correctness 49.0 -> 44.0 / 16.0. So: an instruction gives roughly +22-30 points on acceptable handling; a strict one costs answerable correctness (49 -> 16 on MuSiQue). Authors' "minimal impact" claim does not hold for the strict prompt.
Failure modes: reasoning models hallucinate missing context (AbstentionBench); instruction "unlikely to fix" underlying weakness; model-dependent (52 vs 77%); Saadat et al. "When Not to Answer" (GPT, unanswerable math) reportedly still answered despite IDK option [snippet via secondary review, unverified]. Evidence-calibrated RAG on SQuAD 2.0 (JTIE 2025, snippet): forced-answer hallucination proxy 77.8% vs 37.5% with calibrated abstention; unverified.
Not found: a study of numeric figures from tables/documents specifically (the GHG case).

## Q3 No-model precision-first patterns
Only generic sources: conjunctive rules / PRISM build for 100% precision at the cost of coverage; abstaining classifiers trade coverage for fewer costly errors (search snippets, arXiv:2106.07296 and abstaining-classifier papers). Nothing found on alert fatigue or ask-vs-warn UX; the points below are my opinion/assumed, untested:
- Require all of: figure-request intent (verbs/units like "how many tCO2e", "total", "report the") AND a named category AND absence of definitional cues ("what does", "define", "cover") — blocks the category-15 false positive.
- Apply a deny-list of definition/explain intents first, before any warn rule.
- Prefer a soft prompt ("Check the file includes category N figures") over an assertive warning; low-cost if wrong.
- Test every rule against a held-out definition-question set before shipping.

## Bottom line (confidence)
Instruction line in rewritten prompt: measured gain, no detection false-positive risk; medium confidence (not tested on numeric figures; strong wording can hurt answerable questions, so keep it narrow: "if a requested figure is not in the file, say so; do not estimate"). Keyword detection: no evidence of reliability; low confidence.
