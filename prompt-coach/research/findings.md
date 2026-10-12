# Research findings: grading prompts without an LLM

## Rubric sources (SCOPE alignment)
- Microsoft 365 Copilot: Goal / Context / Source / Expectations. https://learn.microsoft.com/en-in/training/modules/write-effective-prompts-do-more-prompting/2-write-effective-prompt
- Microsoft Prompt Coach agent (LLM-based). https://learn.microsoft.com/en-in/training/modules/explore-prebuilt-microsoft-365-copilot-agents/7-examine-prompt-coach-agent
- Google Gemini for Workspace: Persona / Task / Context / Format. https://services.google.com/fh/files/misc/workspace_with_gemini_prompting_guide.pdf
- Anthropic, "Be clear, direct, and detailed". https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/be-clear-and-direct
- OpenAI prompt engineering guide. https://platform.openai.com/docs/guides/prompt-engineering
- Workiva AI tips (role, reference files, length/format, one question at a time, review for accuracy; companion does not use the open document unless referenced; Prompt advisor uses [placeholders]).
  https://support.workiva.com/hc/en-us/articles/19173586555412-Tips-for-getting-useful-responses-from-Workiva-AI
  https://support.workiva.com/hc/en-us/articles/28927789354516-Use-the-Workiva-AI-prompt-advisor
  https://support.workiva.com/hc/en-us/articles/28927643953172-Reference-specific-files-in-chat-with-Workiva-AI
Mapping: Source = Source + file references; Context = Context + persona; Objective = Goal/Task;
Parameters = Expectations/Format; Evaluate = review for accuracy / success criteria.

## Prior work on automatic prompt-quality scoring
All published approaches and tools (Prompt Coach, PromptPerfect, vendor prompt improvers,
arXiv 2602.11938, 2602.04297, PromptPex 2503.05070) are LLM-based. No offline classifier exists,
so a transparent rule-based rubric with a small learned layer is a defensible design.

## In-browser options under the artifact sandbox
- compromise 14.18.0 (POS, #Imperative, lemmas, numbers): 142 KB gzip, UMD on jsDelivr. Optional.
- wink-nlp: ~1 MB gzip model, no UMD. Skip. natural: Node-only. Skip.
- onnxruntime-web: wasm never embedded; simd-threaded wasm 14.24 MB (fits 15 MB file cap) but CSP may
  need 'wasm-unsafe-eval'. transformers.js needs a 26.8 MB wasm: not viable.
- Sentence-embedding models: MiniLM-L6 int8 ~23 MB, L3/bge-micro ~17 MB: over the per-file cap.
  Model2Vec potion-base-2M (~2 MB, pure JS) is the only realistic semantic option; useful for
  "similar examples", not needed for grading.
- Verdict: rules + a tiny logistic regression (rule features, optionally hashed n-grams) shipped as JSON.

## UX recommendations adopted
Inline per-element highlights with click-to-fix; live debounced scoring; missing elements asked as
questions with chips from file/sheet/heading names; weak -> better -> strong ladder with labelled
inserted assumptions; domain example gallery; "runs in your browser, nothing uploaded" badge backed
by zero network calls after load; PII warning; "How we grade" panel citing the sources above;
WCAG 2.2 AA (icons + text, aria-live, keyboard, reduced motion).
