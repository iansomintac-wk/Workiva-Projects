# Workiva AI sandbox check: 8 prompts

For each card below, open a new Workiva AI chat. If your sandbox lets you add the made-up file to a workspace (two files where the file has a CURRENT YEAR and a PRIOR YEAR part), add it and select it with @ as the prompt says; otherwise paste the file text under the prompt and tell me you did. Copy each reply back as text, not a screenshot. For each card also tell me whether you found the feature the card names where the card says (yes, no, or where it actually is). Every file is made up.

==========
## Card 1 of 8: fr-yoy-narrative (FR)
Feature the card names: Prompt advisor. Where the card says to find it: Ready-made prompts by industry. In Workiva AI chat, choose View prompt advisor, search or filter, then Use prompt.

### Prompt
Use only the current-year file and the prior-year file I selected with @. Context: this narrative goes to the audit committee in the Management discussion of our report. Draft the year-over-year change narrative for Management discussion, explaining each change of more than 3% in one or two sentences, as a short list. Use only figures in the files, and mark anything I need to confirm as TO CONFIRM.

### File: fr-yoy-narrative.txt
----- file starts -----
MADE-UP TEST DATA
CURRENT YEAR - Management discussion, Tarnwick Works

Net sales were 468 million, led by higher volume at the Harrow plant. Gross margin was 31.4 percent. Operating expenses were 96 million. We ended the year with 1,240 employees. Capital spending was 38 million, mostly for the Harrow packing line. Net debt stood at 140 million at year end. The dividend was 0.42 per share.

PRIOR YEAR - Management discussion, Tarnwick Works

Net sales were 412 million, led by new contracts at the Harrow plant. Gross margin was 33.0 percent. Operating expenses were 96 million. We ended the year with 1,180 employees. Capital spending was 38 million, mostly for the Harrow packing line. Net debt stood at 175 million at year end. The dividend was 0.40 per share.
----- file ends -----

==========
## Card 2 of 8: fr-narrative-tables (FR)
Feature the card names: Workiva AI chat with workspace files. Where the card says to find it: In chat, click Add workspace files or type @ (up to 10 files), or right-click a file and choose Ask Workiva AI. Files must be in your workspace first; chat takes no uploads. It reads text, numbers and charts, including scanned PDFs and images.

### Prompt
Use only the draft and the other document I selected with @. Context: the draft goes to review soon, so I need to catch mismatches first. Check them against each other and list every place where a number or statement does not match, as a table with the section and both values. Do not fix anything or guess; I will check each one.

### File: fr-narrative-tables.txt
----- file starts -----
MADE-UP TEST DATA
DRAFT NARRATIVE - Annual summary, Quellmoor Foods (made-up)

Revenue for the year was 52.0 million. Cost of sales was 31.5 million. Net income was 6.2 million. Cash at year end was 9.8 million. Total assets were 88.4 million. Headcount stood at 310 and we opened 4 new sites during the year.

OTHER DOCUMENT - Summary table

Item | Value
Revenue (million) | 52.6
Cost of sales (million) | 31.5
Net income (million) | 6.4
Cash at year end (million) | 8.9
Total assets (million) | 88.4
Headcount | 301
New sites opened | 3
----- file ends -----

==========
## Card 3 of 8: grc-evidence (GRC)
Feature the card names: Evidence analyzer (AI-Powered GRC). Where the card says to find it: Analyzes evidence for controls.

### Prompt
Use only the evidence file I selected with @. Context: I am testing this control and need to know whether the evidence is enough: every manual journal entry for the month is listed, a manager who did not prepare the entries reviews them, entries above 10,000 are approved by a named person, reviewer queries are resolved, and the review checklist is signed and dated. List as a table which attributes it shows, which it does not, and anything unclear, with where you found each. If the file does not show it, say so rather than guess.

### File: grc-evidence.txt
----- file starts -----
MADE-UP TEST DATA
EVIDENCE FILE - March journal entry review, Quellmoor Foods (made-up)

E1. Ledger export of manual journal entries. The export covers 1 to 28 March and holds 214 entries.

E2. Preparer breakdown from the export: R. Delgado (180 entries), M. Okoro (34 entries).

E3. March review checklist. Every line is ticked and the page carries the initials MO.

E4. Email from the reviewer on 12 March raising 3 queries on individual entries.

E5. Approval log for entries above 10,000. It lists 9 entries and the approver column shows system.

E6. Close calendar showing the March close on 4 April.
----- file ends -----

==========
## Card 4 of 8: grc-rationalize (GRC)
Feature the card names: Risk and Controls Intelligence (AI-Powered GRC). Where the card says to find it: A chat assistant inside GRC workflows, and a Risk & Control intelligence knowledge base you can add in Workiva AI chat.

### Prompt
You are an internal controls analyst. Use only the control list I selected with @. Context: we are looking for overlapping controls to simplify our testing. Group controls whose descriptions cover the same risk or activity, as a table with the control IDs and one line on why they look alike. Do not recommend removing any; I will decide.

### File: grc-rationalize.txt
----- file starts -----
MADE-UP TEST DATA
CONTROL LIST - Quellmoor Foods (made-up)

C01 Bank accounts are reconciled to the ledger every month by the accounts team.
C02 Warehouse stock is counted every quarter and compared with the stock records.
C03 Who can use the payroll system is reviewed every quarter by IT.
C04 Expense claims are approved by the claimant's line manager before payment.
C05 Changes to supplier payment details are confirmed with the supplier by phone.
C06 Backups of the finance database are test-restored every quarter.
C07 A physical inventory count is done each quarter and differences are posted after approval.
C08 Staff expense reports need line manager sign-off before reimbursement.
C09 Payroll system user access rights are checked each quarter by the IT team.
C10 Restore tests of the finance database backups run once a quarter.
C11 Before a supplier's bank details are updated, finance calls the supplier to verify them.
C12 New suppliers are approved by procurement before the first order.
----- file ends -----

==========
## Card 5 of 8: sus-anomalies (SUS)
Feature the card names: Workiva AI in spreadsheets. Where the card says to find it: Select cells, then choose Fix this formula, Explain this formula, Summarize data, Find trends, or ask about the selected cells. It returns formulas, not calculated values.

### Prompt
Use only the data from the Apr-Jun column and the Jan-Mar column I selected with @ or in the sheet. Context: I am reviewing it before the report goes out. Check the current period against the previous and list as a table every anomaly or outlier that exceeds a +/-20% variance, with a brief rationale for each, such as a possible data entry error or operational shift. If you are unsure, say so rather than guess.

### File: sus-anomalies.txt
----- file starts -----
MADE-UP TEST DATA
EMISSIONS BY SOURCE, tonnes CO2e - Quellmoor Foods (made-up)

Source | Jan-Mar | Apr-Jun
Boiler gas | 410 | 425
Fleet diesel | 220 | 231
Site A electricity | 300 | 310
Site B electricity | 280 | 190
Business flights | 90 | 160
Refrigerant top-ups | 15 | 16
Waste to landfill | 60 | 58
Generator diesel | 40 | 95
Courier freight | 70 | 41
Staff car mileage | 55 | 80
----- file ends -----

==========
## Card 6 of 8: sus-exec-narrative (SUS)
Feature the card names: Workiva AI in a document. Where the card says to find it: Open Workiva AI from the document, or select text and use a quick edit to shorten it, change the tone or elaborate. Insert the answer at your cursor, copy it, or Refine it.

### Prompt
Use only the selected sustainability narrative. Context: it goes to the board of directors. Rewrite it in under 80 words, as a short paragraph that leads with what changed since last year. Keep every number and fact exactly as written, and do not add anything new.

### File: sus-exec-narrative.txt
----- file starts -----
MADE-UP TEST DATA
SUSTAINABILITY NARRATIVE - Quellmoor Foods (made-up)

This year our work on emissions, energy and safety moved forward on several fronts, and we want to set out clearly where we stand. Scope 1 and 2 emissions fell to 8,420 tonnes, helped by the new heat recovery unit at the main bakery. Renewable sources supplied 64 percent of our electricity, up from the contracts we signed with two regional wind farms. Water withdrawal came to 1.8 million cubic metres, and the team is still working on the cooling loop that drives most of that use. We recorded 7 lost-time injuries, and every one was reviewed with the site leads and the safety committee. The recycling rate reached 71 percent as the new sorting line came into service. Next year we plan to extend these programmes to the two smaller sites.
----- file ends -----

==========
## Card 7 of 8: gen-summarize-file (GEN)
Feature the card names: Workiva AI chat with workspace files. Where the card says to find it: In chat, click Add workspace files or type @ (up to 10 files), or right-click a file and choose Ask Workiva AI. Files must be in your workspace first; chat takes no uploads. It reads text, numbers and charts, including scanned PDFs and images.

### Prompt
Use only the document I selected with @. Context: the summary is for the operations leadership team, who will not read the full file. Summarize it in five bullets, then list the three points that need a decision. Do not add facts that are not in the document; I will review it.

### File: gen-summarize-file.txt
----- file starts -----
MADE-UP TEST DATA
MEMO - Packing line upgrade, Quellmoor Foods (made-up)
From: Priya. To: Operations leadership.

The packing line at the Harrow site is due for an upgrade, and the team has narrowed the work to a few options. Two suppliers have quoted. The Alder quote is 118,000 and the Birch quote is 104,000 with a longer delivery time. We need Dana to choose between the Alder and Birch quotes by 15 May so the order can be placed. The project budget currently holds 95,000, so we need Marcus to approve an extra 25,000 before any order goes out. The upgrade needs a pilot, and we need leadership to pick the pilot shift, either nights or weekends. Two analysts would be needed to track results, so we need Hana to confirm hiring 2 analysts on a six-month contract. Finally, we need Dana to set the review date for the pilot results, which we suggest in late September. Training for operators is planned and is not affected by these points. The current line has run for nine years and its output has slipped slowly.
----- file ends -----

==========
## Card 8 of 8: gen-rewrite (GEN)
Feature the card names: Workiva AI in a document. Where the card says to find it: Open Workiva AI from the document, or select text and use a quick edit to shorten it, change the tone or elaborate. Insert the answer at your cursor, copy it, or Refine it.

### Prompt
Use only the selected section. Context: it is going to the board. Rewrite it in under 70 words, as one short paragraph. Keep every number and fact exactly as written, and do not add anything new.

### File: gen-rewrite.txt
----- file starts -----
MADE-UP TEST DATA
BOARD COMMENTARY - Quellmoor Foods (made-up)

The year was a steady one for the company, with progress in most areas and a few lessons we intend to act on. Revenue reached 52.0 million, which gave us a good base for the plans ahead. Operating margin was 11.5 percent, a little lower than we hoped because of higher packaging costs. We opened 4 new sites, each of them on time and close to the budget we set, which the teams should be proud of. Customer complaints fell to 38 for the year, the lowest count since we began keeping this record. We also started a new supplier programme, and the first 15 suppliers have signed up to it. Looking forward, we will keep a close watch on costs and continue to invest in our people, our sites and our systems, while staying careful about risks that could affect delivery.
----- file ends -----

