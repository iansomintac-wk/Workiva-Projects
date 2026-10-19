# Sandbox pilot: chat with workspace files compares two versions (2026-10-16)

Prompt, planted changes and pass bar: `docs/FIT_FINDER_SANDBOX_PILOT_PROMPT.txt` (pass bar written
before the run). Run by Ian's Claude browser extension in his Workiva sandbox, made-up data only, in
the folder "Fit Finder test (delete ok)"; Ian pasted its report into session d2e2611b. The AI's
answer below is as the extension copied it (read, not seen first-hand by this session).

## Score (by session d2e2611b, from the verbatim table below)

| Planted | In the AI's answer | Result |
|---|---|---|
| (1) years rolled forward | rows 1, 3, 6 | listed |
| (2) revenue $4.2bn to $4.5bn | row 2 | listed |
| (3) Austin plant added | row 4 ("Review") | listed |
| (4) currency-risk sentence removed | row 5 | listed |
| changes not planted | none (all 6 rows map to (1)-(4)) | 0 invented |
| flag (a) "up 6%" no longer matches $4.2bn to $4.5bn (about 7.1%) | row 3: "Expected year-roll" | missed |
| flag (b) removed currency-risk sentence | "Potentially unintentional" with a reason | flagged |

Pass bar (all 4 listed, 0 invented): met. Prediction (at least 3 of 4 listed, flag (a) missed more
often than not): this one run listed 4 of 4 and missed (a); one run cannot give a rate. The miss fits
the page's rule that exact calculation stays with a person. For task 115 (Ian's gold:
gen-summarize-file), the feature the page names, chat with workspace files, did the job.

## Part 1: where Workiva AI is offered (the extension's report, verbatim in substance)

- Top bar on every page: a sparkle button "Workiva AI" next to "Intelligent Search", opening a right
  panel "Workiva AI" ("How can I help you with these files?" on Files; "How can I help you with this
  document?" in a document). Suggested prompts: "Start a workflow", "Analyze recent expense trends",
  "Expand outline point", "List SOC 2 controls". Input: "Type @ to reference a file". "+" / "Add
  sources" menu: "Add Knowledge bases", "Add workspace files", "View prompt advisor". Panel menu:
  "Workflows", "Chat history".
- Blank document body: inline stars button, "Click the stars icon to start drafting with Workiva AI".
- Document Tools menu: "AI suggestions", "Tie-out assistant".
- Document right panel: "Intelligent Finance" ("Use this mode to research and compare filings between
  industry peers."): "Compare the content, language, and structure of my disclosure to my peers",
  "Draft a disclosure for me based on my peers", "Define my own goal".
- Left nav: "Agent Studio" (not opened).

Checklist: Workiva AI in a document: seen. Chat with workspace files: seen ("Add workspace files", @).
Prompt advisor: seen. Tie-out assistant: seen (not opened). Benchmarking: not seen under that name;
nearest is the "Intelligent Finance" peer comparison.

Claims to re-check, not fixes: the catalogue's Benchmarking wording (an open item); "AI suggestions"
and "Agent Studio" exist in this sandbox while the catalogue leaves out Suggestions and agent names.
A sandbox may have features a customer lacks.

## Part 2: the AI's answer, verbatim as copied by the extension

@ referencing worked (Doc A picked as a chip). The Sources list still showed Doc B as "Untitled
Document (19642)" after it was renamed; the chat was auto-titled "MD&A 2025 Draft Comparison".

> Thought
>
> I'll read the content of both documents simultaneously to compare them.
>
> Actions completed
>
> Here is a full side-by-side comparison of every change between the MD&A 2025 (test) and this 2026 draft, with flags where appropriate.
>
> | # | Location | MD&A 2025 (test) | MD&A 2026 Draft | Flag |
> |---|---|---|---|---|
> | 1 | Revenue year | "Revenue for 2025" | "Revenue for 2026" | ✅ Expected year-roll |
> | 2 | Revenue amount | "$4.2 billion" | "$4.5 billion" | ✅ Expected update |
> | 3 | Prior-year comparison | "up 6% from 2024" | "up 6% from 2025" | ✅ Expected year-roll |
> | 4 | New plant disclosure | (not present) | "and opened a plant in Austin in March" | ⚠️ Review — see note below |
> | 5 | FX risk disclosure | "Foreign currency movements could reduce reported revenue, because about 20% of sales are in euros." | (removed entirely) | ⚠️ Potentially unintentional — see note below |
> | 6 | CapEx forward year | "capital spending of $150 million in 2026" | "capital spending of $150 million in 2027" | ✅ Expected year-roll |
>
> ⚠️ Items to review
>
> - **Austin plant (Change #4):** The new plant disclosure is a meaningful addition. Confirm the March opening date is accurate and that the disclosure has been reviewed for completeness (e.g., cost, capacity, segment impact).
> - **FX risk disclosure removed (Change #5):** The entire sentence about foreign currency exposure and euro-denominated sales has been deleted. This looks like it could be **unintentional** — if the company still has ~20% of sales in euros, this is a material risk disclosure that should be retained or updated. If the exposure has changed materially, the sentence should be revised rather than dropped. Please verify this was a deliberate editorial decision.
