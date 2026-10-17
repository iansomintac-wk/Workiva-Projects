# Prompt wording evidence (2026-10-16)

Gathered for the Better / Strong rewrite changes. Helpers: two Sonnet (low effort) and one Haiku
(low effort) research agents. Labels: **checked** = opened and quoted verbatim in this session;
**read** = a helper's report of a page or abstract, not re-opened; **unconfirmed** = search snippet
only.

## Politeness, "can you", question vs instruction

- "can you suggest some changes" gets suggestions instead of action. **Checked**, Anthropic
  prompting best practices
  (https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices):
  "If you say "can you suggest some changes," Claude will sometimes provide suggestions rather
  than implementing them". The line is in the tool-use section; it supports direct instructions
  for action requests, and is not a measured study of the words "can you".
- "please" / "thank you": mixed. **Read** (abstracts only): Yin et al. 2024 (arXiv 2402.14531):
  impolite prompts often hurt; extra courtesy does not reliably help; varies by language.
  Dobariya & Kumar 2025 (arXiv 2510.04950): GPT-4o, 50 questions in 5 tones, Very Rude 84.8% vs
  Very Polite 80.8%; small sample. Anthropic's and Microsoft's pages say nothing about "please".
- Microsoft (**read**,
  https://support.microsoft.com/en-us/topic/learn-about-copilot-prompts-f6c3b467-f07c-4db1-ae54-ffac96184dd5):
  prompts are "instructions or questions"; "all that's required is a clear goal".
- OpenAI's prompting guide: not opened.

Use: convert soft openers to instructions; drop "please" as style. Do not tell users that
"please" lowers answer quality.

## Roles, length, examples, format

- Role lines: **checked**, Zheng et al. (arXiv 2311.10054) abstract: "adding personas in system
  prompts does not improve model performance across a range of questions." Anthropic says a role
  in the system prompt focuses tone (**checked**, same best-practices page), unmeasured. The coach
  does not add roles.
- Length: no measured rule found (**read**). Microsoft: only a goal is required; Anthropic: enough
  context that a colleague would not be confused. Aim for complete, without filler.
- Examples: vendor-recommended (Anthropic 3-5, OpenAI few-shot), developer-oriented, unmeasured
  (**read**).
- Format: vendor-recommended by Anthropic ("Be specific about the desired output format and
  constraints") and Microsoft ("expectations") (**read**).

## Workiva support (all unconfirmed: support.workiva.com returned 403 to the fetcher)

- Tips for getting useful responses from Workiva AI
  (https://support.workiva.com/hc/en-us/articles/19173586555412): be specific, give context, one
  question at a time, iterate, reference files.
- Reference specific files in chat
  (https://support.workiva.com/hc/en-us/articles/28927643953172): type @ and pick a file, or "Add
  workspace files"; up to 10 files per prompt; Word, Excel, images, CSV, PDF; size limits conflict
  between snippets (1,000 PDF pages vs 4.5 MB and five PDFs per chat); renaming the file name in
  the prompt breaks the reference; files must be in the workspace.
- Workiva AI for documents (https://support.workiva.com/hc/en-us/articles/37495611606548): quick
  prompts ignore document context.

To confirm in the live session by opening these pages in Ian's browser.
