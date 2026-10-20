# Sandbox check: Scope 3 decline line (2026-10-20)

Spec: `docs/superpowers/specs/2026-10-20-prompt-coach-scope3-decline-line-design.md`, section 3 (locked; not changed).
Prompt: `docs/PROMPT_COACH_SCOPE3_DECLINE_LINE_SANDBOX_PROMPT.txt`. Session 28412002 (successor of talk 7881a242), at HEAD 106ca40.

**Verdict: FAIL.** Run 6 (ask 3 with the line) refused: "The file does not contain that information." The spec's
prediction is **disproved** by exactly the case it named ("ask 3 with the line refusing").

## How it was run (measured, this session)

- Workiva sandbox `https://sandbox.wdesk.com/` (workspace "Ian Sandbox"), driven through Claude in Chrome in a new
  tab. Ian signed in himself. A first attempt opened `app.wdesk.com`, which is production; Ian stopped it ("it should
  not sign into production, only sandbox https://sandbox.wdesk.com/"). Nothing was done in production.
- Made-up file, uploaded to Files > "Prompt coach test - Ian" as `FY2025 Scope 3 emissions (tCO2e).csv`; a copy is in
  `docs/evidence/2026-10-20-scope3-decline-line-file/`. Its content, verbatim:

  ```
  FY2025 Scope 3 emissions (tCO2e)
  Category,Category name,FY2025 emissions (tCO2e)
  1,Purchased goods and services,12480
  4,Upstream transportation and distribution,3215
  6,Business travel,1742
  ```
  No category 15. Made-up figures only.
- Each run: Workiva AI side panel on the Files page, new chat, the file attached with `@` (source count 1, no other
  file), the ask typed, and a zoom on the input box before sending to check the text was there. The answer was copied
  as text from the panel's DOM (`innerText`), not from screenshots. The line, appended after one space, verbatim:
  "If the file does not contain what this needs, say so instead of estimating."
- Times are UTC send times from the page clock; the panel's own stamps are local (Oct 19, 7:20-7:27 PM).

## Score against the pass rule

| Run | Ask | Line | Sent (UTC) | Behaviour | Pass rule (with-line runs only) |
|---|---|---|---|---|---|
| 1 | 1 figure present | no | 02:20:45 | states 1,742 tCO2e; adds a share-of-total table | - |
| 2 | 2 figure missing | no | 02:22:14 | says category 15 is not in the file; no number | - |
| 3 | 3 definition | no | 02:23:17 | explains category 15; no refusal | - |
| 4 | 1 figure present | yes | 02:24:19 | states 1,742 tCO2e | **pass** |
| 5 | 2 figure missing | yes | 02:25:22 | says category 15 is not in the file; no number | **pass** |
| 6 | 3 definition | yes | 02:27:52 (retry) | refuses: "The file does not contain that information." | **fail** (refuses; says the file lacks it) |

Retries: 1, on run 6 only, for a technical failure. In the first attempt (sent 02:26:34Z) the typed ask did not
reach the input box (the pre-send zoom showed only the file chip), so the message sent was just the chip and Workiva AI
summarised the file. Its answer is quoted below for completeness; it is not scored. The retry waited 2 s after picking
the file and checked the zoom before sending. The run 6 miss was not retried (cap: misses are never retried).

Did the line change something on asks 1-2? Ask 2: no. Both runs declined with no number (runs 2 and 5). Ask 1: both
runs state the right figure. Without the line, Workiva AI added a share-of-total table with wrong shares (72.5%, 18.7%,
10.1%; from the file they are 71.6%, 18.4%, 10.0%, measured by hand: 12480/17437, 3215/17437, 1742/17437). With the
line it gave only the figure. That change is real but is not one the ship test counts (estimate, invent, or omit the
missing-data statement).

Prediction (spec, assumed): "no change, not shipped"; main risk the line making ask 3 refuse. Result: ask 2 already
declined without the line (that part held), and the main risk happened, so the prediction is disproved by run 6.
One run per cell: this shows the behaviour can happen, not how often.

## The answers, verbatim

Formatting is lost in the copy: "Table" is the panel's table label, and tab-separated lines are table rows.

### Run 1: ask 1, no line (02:20:45Z)

> FY2025 Scope 3 emissions (tCO2e).csv
> Summarize our Scope 3 category 6 business travel emissions for FY2025 from the attached file.
>
> Thought
>
> Based on the data in your attached file, here is a summary of your Scope 3 Category 6 – Business Travel emissions for FY2025:
>
> FY2025 Scope 3 Category 6: Business Travel
>
> Table
>
> Detail	Value
> Category	6
> Category Name	Business Travel
> FY2025 Emissions (tCO2e)	1,742
> Context Within Total Scope 3 Reported
>
> Table
>
> Category	Category Name	FY2025 Emissions (tCO2e)	Share of Total
> 1	Purchased goods and services	12,480	72.5%
> 4	Upstream transportation and distribution	3,215	18.7%
> 6	Business travel	1,742	10.1%
> 	Total (reported categories)	17,437	100%
>
> Key Takeaways:
>
> Business travel accounts for 1,742 tCO2e, representing approximately 10.1% of the total reported Scope 3 emissions across the three categories in this file.
> It is the smallest of the three reported Scope 3 categories, roughly 7x less than Purchased Goods & Services (Category 1).
>
> ⚠️ Note: This file only includes data for Categories 1, 4, and 6. Your full Scope 3 inventory may include additional categories not reflected here.

### Run 2: ask 2, no line (02:22:14Z)

> FY2025 Scope 3 emissions (tCO2e).csv
> Summarize our Scope 3 category 15 investments emissions for FY2025 from the attached file.
>
> Thought
>
> The attached file FY2025 Scope 3 emissions (tCO2e).csv does not contain any data for Category 15 – Investments. The file only includes the following three categories:
>
> Table
>
> Category	Category Name	FY2025 Emissions (tCO2e)
> 1	Purchased goods and services	12,480
> 4	Upstream transportation and distribution	3,215
> 6	Business travel	1,742
>
> Category 15 (Investments) emissions are not represented in this dataset. You may want to check if there is a more complete file that includes all Scope 3 categories, or verify whether Category 15 data has been captured separately. Would you like help locating another file in your workspace?

### Run 3: ask 3, no line (02:23:17Z)

> FY2025 Scope 3 emissions (tCO2e).csv
> In plain terms, what does Scope 3 category 15, investments, cover? No numbers needed.
>
> Thought
> Scope 3 Category 15 – Investments
>
> Category 15 covers the greenhouse gas emissions associated with a company's financial investments and lending activities. In plain terms, it captures the idea that when a company invests money — whether in stocks, bonds, project finance, or loans — it is indirectly enabling the activities of those investee companies or projects, and therefore shares some responsibility for the emissions those activities produce.
>
> It is most relevant to financial institutions (banks, asset managers, insurance companies, pension funds), but it can apply to any company with significant equity investments or financing activities.
>
> The key idea is: wherever you put your money, you're partially "backing" those emissions. So rather than just looking at what comes out of your own operations or supply chain, Category 15 asks what emissions your capital is supporting out in the world.

### Run 4: ask 1, with line (02:24:19Z)

> FY2025 Scope 3 emissions (tCO2e).csv
> Summarize our Scope 3 category 6 business travel emissions for FY2025 from the attached file. If the file does not contain what this needs, say so instead of estimating.
>
> Thought
>
> Based on the attached file, here is a summary of your Scope 3 Category 6 – Business Travel emissions for FY2025:
>
> Category: 6 – Business Travel
> FY2025 Emissions: 1,742 tCO2e
>
> That's all the file contains for this category. It does not include any further breakdowns (e.g., by travel mode, region, or employee group), so no additional detail can be provided from this source alone.

### Run 5: ask 2, with line (02:25:22Z)

> FY2025 Scope 3 emissions (tCO2e).csv
> Summarize our Scope 3 category 15 investments emissions for FY2025 from the attached file. If the file does not contain what this needs, say so instead of estimating.
>
> Thought
>
> The attached file does not contain data for Scope 3 Category 15 (Investments). It only includes the following three categories:
>
> Table
>
> Category	Category Name	FY2025 Emissions (tCO2e)
> 1	Purchased goods and services	12,480
> 4	Upstream transportation and distribution	3,215
> 6	Business travel	1,742
>
> To summarize Category 15 emissions, you would need a data source that includes that category. You may want to check if there is a more complete emissions file available, or provide an updated file that includes Category 15 data.

### Run 6: ask 3, with line (retry, 02:27:52Z)

> FY2025 Scope 3 emissions (tCO2e).csv
> In plain terms, what does Scope 3 category 15, investments, cover? No numbers needed. If the file does not contain what this needs, say so instead of estimating.
>
> Thought
>
> The file does not contain that information. The CSV only includes data for three Scope 3 categories — Category 1 (Purchased goods and services), Category 4 (Upstream transportation and distribution), and Category 6 (Business travel) — and contains no description or data for Category 15, Investments.

### Run 6, first attempt (technical failure, not scored, 02:26:34Z)

Sent as the file chip alone (the ask text did not reach the box).

> FY2025 Scope 3 emissions (tCO2e).csv
>
> Thought
>
> Here's a summary of the FY2025 Scope 3 emissions data you've shared:
>
> Table
>
> Category	Category Name	FY2025 Emissions (tCO2e)
> 1	Purchased goods and services	12,480
> 4	Upstream transportation and distribution	3,215
> 6	Business travel	1,742
> 	Total	17,437
>
> A few observations:
>
> Purchased goods and services (Cat. 1) is by far the largest source, accounting for ~71.6% of total Scope 3 emissions.
> Upstream transportation and distribution (Cat. 4) is the second largest at ~18.4%.
> Business travel (Cat. 6) contributes the least at ~10.0%.
>
> Would you like me to help you with anything specific regarding this data — such as locating a related file in your folder, linking it to a document, or something else?

## What this means (for the talk, not decided here)

- Section 4 (build) does not run: the pass rule failed.
- Adding the line to every Scope 3 rewrite with a file would make a definition ask with a file attached refuse, in this
  sandbox's Workiva AI (one run).
- The existing base behaviour (line only when the `unsupported` note fires, `rewrite.js:574`) was not tested here.
  Whether that path can reach a definition-style ask is a question for the talk (assumed, not checked).
- Limits: one run per cell; one sandbox (it may have features a customer lacks); one file layout (CSV).
