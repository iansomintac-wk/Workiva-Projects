# Workiva AI claims re-check against the live Support Center

Checked 2026-10-18 (file dated 2026-10-19 as asked). Method: each public article read through support.workiva.com/api/v2/help_center/en-us/articles/<id>.json via WebFetch, which returns a model summary of the page, not the raw page. Tag `fetched` = article read that way. Tag `snippet` = seen only in a search-result listing. S1 returned HTTP 403 on the web page and 401 on the API: sign-in needed, not re-checkable.

Totals (54 claim rows): hold 38, changed 5, not found 3, not re-checkable 8.

## Live dates (all 22 public sources match catalogue.json `updated`)
S2 09-16, S3 09-16, S4 05-06, S5 06-05, S6 10-07, S7 10-13, S8 09-16, S9 10-15, S10 09-28, S11 09-30, S12 06-23, S13 09-20, S14 09-16, S15 10-12, S16 10-01, S17 09-24, S18 09-16, S19 09-16, S20 09-22, S21 09-16, S22 09-16, S23 09-16 (all 2026; `fetched`). S1: not re-checkable (401/403). No page changed since the 15 Oct read, but note S9 was updated 15 Oct, the same day.
Duplicate article IDs exist for S21 (39987167733652, 2026-09-16) and S22 (39741623316756, 2026-09-22); same content (`snippet`).

## Table
Status: H = holds, C = changed, NF = not found, NRC = not re-checkable. "cat." = fit-finder/data/catalogue.json.

| # | Claim | Where | Source | Live date | Status | Live wording when not H |
|---|---|---|---|---|---|---|
| 1 | Sparkles icon; one conversation follows you; Sources under answer | cat. surfaces.chat | S6, S8, S4 | 10-07 | H | S6: "follows you between files and screens"; "Sources section at the bottom of a chat response" |
| 2 | Included once org signs Workiva AI Terms of Use; admin can limit | cat. availability.workiva-ai | S2, S6, S9, S19-S23 | 09-16 | H | S2: "available to any customer who has signed the Workiva AI Terms of Use"; Org Admins can restrict or disable |
| 3 | Add workspace files or @, max 10 files | cat. surfaces.files | S3 | 09-16 | H | "You can add a maximum of 10 files to a prompt." (S6 repeats 10 but never mentions @) |
| 4 | Right-click file, Ask Workiva AI | cat. surfaces.files | S3 | 09-16 | H | |
| 5 | Chat takes no uploads; files must be in workspace | cat. surfaces.files | S3 | 09-16 | H | "Not at this time." |
| 6 | Reads text, numbers, charts, scanned PDFs, images | cat. surfaces.files | S3 | 09-16 | H | |
| 7 | Excel needs the org's AWS model provider | cat. fr-gaap-stat.stays; capabilities-confirmed "Not confirmed" | S3 | 09-16 | H (firmer than before) | Live S3 lists Word and Excel under AWS only; Google and Microsoft list PDF, images, CSV, Workiva Documents. "You don't need to switch providers. Workiva selects a recommended model from your organization's approved providers." The "Not confirmed" note can be narrowed. |
| 8 | Open Workiva AI from document; quick edit | cat. surfaces.doc | S2, S22 | 09-16 | H | S22: "floating sparkles icon in blue on the left side of your selection" |
| 9 | Quick edit "shorten, rephrase or change the tone" | cat. surfaces.doc.how | S22 | 09-16 | C | S22 does not name the menu options: "refine your current text ... such as, shortening, changing the tone, or elaborating." "Rephrase" is not on the page. |
| 10 | Insert at cursor, copy, Refine | cat. surfaces.doc.how | S2, S22 | 09-16 | H | S2 Insert/Copy; S22 "copy, insert, or refine the generated content". S6 mentions no Insert. |
| 11 | Prompt advisor: View prompt advisor, search/filter, Use prompt, by industry | cat. surfaces.advisor | S23 | 09-16 | H | "search by keyword or filter by category"; "organized by industry" |
| 12 | Sheet: Fix/Explain this formula, Summarize data, Find trends, ask about cells | cat. surfaces.sheet | S20 | 09-22 | H | S20 lists the five options. S19 does not name them. |
| 13 | Sheet returns formulas, not calculated values | cat. surfaces.sheet; use cases gen-formula | S19 | 09-16 | H | "returns a formula instead of a calculated value" |
| 14 | Wdata: sparkles in query, create/improve/explain/fix SQL, no SQL needed | cat. surfaces.wdata | S21 | 09-16 | H | "no SQL knowledge required" |
| 15 | Support Intelligence KB; answers link articles and videos | cat. surfaces.support-kb | S9 | 10-15 | H | UI is `+ Add` then `Knowledge bases` |
| 16 | AI Error Validation: Help me fix this; US-GAAP only; "included" | cat. surfaces.xbrl-help | S14 | 09-16 | H (note) | "currently available for US-GAAP filings only"; also needs "a Workiva account with XBRL enabled". Not labelled preview. Opens "the Global Companion". |
| 17 | Tie-out assistant is preview; start from chat workflow or Markup toolbar | cat. surfaces.tie-out | S7, S10 | 10-13 / 09-28 | H | S7 labels "Tie-out assistant (Preview)"; S10: "Markup toolbar", then Analyze report |
| 18 | Tie-out covers 10-K and 10-Q only | cat. surfaces.tie-out; fr-tie-out.stays | S11 | 09-30 | H | S11 "Only 10-Ks and 10-Qs". S10 does not mention filing types. |
| 19 | Open question: tie-out after 14 Sep 2026 | capabilities-confirmed "Not confirmed" | S10, S7 | 09-28 / 10-13 | H (still open) | S10 still says "until September 14th, 2026"; S7 (13 Oct) still lists Preview. S11 still says EAP "July 2nd". No change. |
| 20 | Benchmarking: workflow, "entitlement" | cat. surfaces.benchmarking | S7, S12, S8 | 10-13 | H (note) | S7 shows no preview label; S12 is titled Preview, pre-release, Feature Preview Terms, EAP from July 2, Advanced tier needed after GA. Catalogue's "entitlement" badge omits that S12 calls it a preview. |
| 21 | SEC Filing Intelligence: Intelligent Finance icon, filters, 10-K and 10-Q | cat. surfaces.sec-intel | S13 | 09-20 | H | needs "SEC Advanced, A&I Advanced, Investments, or Funds"; "Click the Intelligent Finance icon at the bottom of the right panel" |
| 22 | 8-K: preview; Workflows > Report generation or Create > Agentic report | cat. surfaces.report-8k | S15 | 10-12 | H | "Automated 8-K setup preview"; "starting point, not a final filing" |
| 23 | Risk & Control Intelligence KB can be added in chat | cat. surfaces.grc-chat | S9 | 10-15 | H | Listed only by title and link; no description |
| 24 | ESRS, Revised ESRS, ISSB KBs; Sustainability Reporting Advanced; CSRD add-on for ESRS | cat. surfaces.esrs-issb | S16, S17, S18 | 10-01 | H | S16 "ESRS Intelligence ... requires the CSRD add-on"; "ISSB Intelligence". S9 shows the KB as "Sustainability". |
| 25 | Disclosure agent: workflow or Quick edits > Draft disclosure; scorecard, action items, narrative | cat. surfaces.disclosure | S7, S17, S18 | 09-24 | H | S17 "In Quick edits, select Draft disclosure"; Compliance scorecard, Action items, Disclosure narrative. S16 does not mention Quick edits. |
| 26 | Anomaly prompt (+/-20% variance); Factbook; Advanced workspaces | cat. sus-anomalies | S16 | 10-01 | H | "Identify anomalies or outliers that exceed a +/-20% variance"; page is "for Sustainability Reporting Advanced workspaces with Workiva AI enabled" |
| 27 | entitlement and preview badge text | cat. availability | S7, S9, S12 | 10-13 | H | S7 "Available workflows vary depending on which solutions are enabled"; S9 "depending on the solutions enabled" |
| 28 | Long filings: one section at a time | cat. fr-narrative-tables.stays | S5 | 06-05 | H | "Break a large request into smaller steps"; focus on a specific section |
| 29 | Year-over-year narrative is a Workiva example | cat. fr-yoy-narrative (refs S2, S23) | S2 | 09-16 | H | S2 names "Year over Year Financial Change Narrative". S23 does not. |
| 30 | Translations (document content) | cat. surfaces.translate, gen-translate | S1 | n/a | NRC | S1 needs sign-in. No public page found on translation in the Workiva AI Intro, FAQ or search (`snippet`). |
| 31 | Control creator | cat. surfaces.control-creator | S1 | n/a | NRC | |
| 32 | Test step and attribute generation | cat. surfaces.test-steps | S1 | n/a | NRC | |
| 33 | Evidence analyzer | cat. surfaces.evidence | S1 | n/a | NRC | Public search for "evidence analyzer" returned only Evidence Viewer pages (`snippet`). |
| 34 | Issue generation | cat. surfaces.issues | S1 | n/a | NRC | |
| 35 | Flowchart visualizer | cat. surfaces.flowchart | S1 | n/a | NRC | |
| 36 | Risk interview and activity summaries | cat. surfaces.risk-summary | S1 | n/a | NRC | |
| 37 | Chat assistant inside GRC workflows | cat. surfaces.grc-chat.how | S1 | n/a | NRC | |
| 38 | 22 public source titles and URLs | cat. sources | S2-S23 | see above | H | all resolved; dates unchanged |
| 39 | leftOut: Roll forward workflow only in S8 | cat. leftOut | S8 | 09-16 | H | S8 "Moves data and project artifacts into the next reporting period"; no AI how-to page found (search returned only ordinary roll-forward pages, `snippet`) |
| 40 | leftOut: Suggestions still early-access preview | cat. leftOut | search listing | 09-14 | H (`snippet`) | "Use and create suggestion types" (id 46356859919252), updated 2026-09-14, described as early access preview. Not opened in full. |
| 41 | leftOut: Workiva MCP to Claude is a limited-availability preview with no support page | cat. leftOut | Connecting the Workiva MCP to Claude (id 51809460331540) | 10-16 | C | Now documented (`fetched`): "currently available to select customers as part of the Limited Availability preview"; testing "to July 1, 2027"; "At launch, the Workiva MCP is read-only"; "MCP is off by default for every Workiva organization"; needs Claude Owner plus Workiva Org Security Admin; ask Customer Success Manager. A separate page (Set access restrictions) says the MCP option is available only in AI-powered GRC solutions (`snippet`). The catalogue still says preview, which holds; "no official page" no longer does. Leave out of the page: still a preview and not a Workiva AI feature. |
| 42 | leftOut: Agent Studio has no Support Center page | cat. leftOut | search | n/a | NF | Searched support.workiva.com (API search, 58 hits for the term, first page only, `snippet`) and the web: no Workiva Agent Studio article. Only trade-press copy. Still undocumented. |
| 43 | Coach: type @ and pick files, up to 10 per prompt | rewrite.js tips (line 341) | S3 | 09-16 | H | |
| 44 | Coach: "The document companion does not read your open file unless you reference it" | rewrite.js line 342 | S2, S6 | 10-07 | NF | S2: Workiva AI "works alongside your Workiva files". Neither page says it ignores the open file. |
| 45 | Coach: quick edits "Shorten, Elaborate, Rephrase, or Change tone" | rewrite.js line 345 | S22 | 09-16 | C | Live: "shortening, changing the tone, or elaborating"; no menu labels given, "Rephrase" absent. |
| 46 | Coach: Fix this formula / Explain this formula | rewrite.js line 346 | S20 | 09-22 | H | |
| 47 | Coach: "the companion works on the current sheet. Select the rows first" | rewrite.js lines 347-348 | S20 | 09-22 | NF | S20: "Select a single cell or a cell range"; your selection is the input. "Current sheet" is not stated. |
| 48 | Coach: Find trends, Summarize data | rewrite.js lines 347, 349 | S20 | 09-22 | H | |
| 49 | Coach: "the Tie-Out Agent ... Ask your account team" | rewrite.js line 350 | S7, S8, S11 | 10-13 | C | Support pages call it "Tie-out assistant" (S7 "(Preview)"), 10-K and 10-Q only (S11). "Tie-Out Agent" is the press-release name; the catalogue already avoids it. |
| 50 | Coach: "the Benchmarking Agent compares your SEC filings with peers" | rewrite.js line 351 | S7, S12 | 10-13 | C | Live name "Benchmarking": "Compare the disclosures in your financial report against those of peer companies." S12: preview, Intelligent Finance, Advanced tier after GA. |
| 51 | Coach: Sustainability Disclosure Agent scores a disclosure / gap assessment vs ESRS or ISSB | rewrite.js lines 352-353 | S16, S17, S18 | 10-01 | H | "Compliance scorecard"; "Action items to help resolve any gaps" |
| 52 | Coach: switch KB to ESRS or ISSB; check cited sources | rewrite.js line 354, 91 | S16, S17, S6 | 10-01 | H | KB names are "ESRS Intelligence" and "ISSB Intelligence"; Sources section in S6 |
| 53 | Page: "Features come from 23 Workiva support pages read on 15 Oct 2026" | fit-finder/web/template.html (howRates) | all | n/a | H | True as history. S1 could not be re-read on 18 Oct. |
| 54 | Page badges: included / check your entitlement / preview | template.html BADGE | see 27 | n/a | H | |

## Other observations
- New pages that were not in the 23: "Intro to Workiva AI" (19163862687764, 2026-10-15) and "Workiva AI FAQ" (28814781172116, 2026-10-12). Neither mentions translation, GRC features, Agent Studio, roll forward or uploads (`fetched`). FAQ names extensions for Intelligent Finance, Risk and Controls Intelligence (GRC) and Intelligent Sustainability.
- S14 and S15 call the chat "Global Companion" / "Workiva AI companion"; S8 title uses "global companion". The Coach's word "companion" is consistent with the live pages.
- Leaving "Press-release agent names" unchecked: the release is not a Support Center page.
- Limits: the fetch tool summarises each page, so exact wording is as returned by that summary; the search-API checks for leftOut cover only the first page of hits.
