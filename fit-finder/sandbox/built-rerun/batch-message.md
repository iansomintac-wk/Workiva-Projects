# Workiva AI sandbox check: 2 prompts

For each card below, open a new Workiva AI chat. If your sandbox lets you add the made-up file to a workspace (two files where the file has a CURRENT YEAR and a PRIOR YEAR part), add it and select it with @ as the prompt says; otherwise paste the file text under the prompt and tell me you did. Copy each reply back as text, not a screenshot. For each card also tell me whether you found the feature the card names where the card says (yes, no, or where it actually is). Every file is made up.

==========
## Card 1 of 2: fr-yoy-narrative (FR)
Feature the card names: Workiva AI in a document. Where the card says to find it: Open Workiva AI from the document, or select text and use a quick edit to shorten it, change the tone or elaborate. Insert the answer at your cursor, copy it, or Refine it.

### Prompt
Use only the current-year file and the prior-year file I selected with @. Context: this narrative goes to the audit committee in the Management discussion of our report. Draft the year-over-year change narrative for Management discussion, explaining each change of more than 3% in one or two sentences, as a short list. Use only figures in the files, keeping each amount and unit exactly as written with no currency added. Do not explain a change the files do not explain; mark it, and anything else I need to confirm, as TO CONFIRM.

### File: fr-yoy-narrative.txt
----- file starts -----
MADE-UP TEST DATA
CURRENT YEAR - Management discussion, Tarnwick Works

Net sales were 468 million, led by higher volume at the Harrow plant. Gross margin was 31.4 percent. Operating expenses were 96 million. We ended the year with 1,240 employees. Capital spending was 38 million, mostly for the Harrow packing line. Net debt stood at 140 million at year end. The dividend was 0.42 per share.

PRIOR YEAR - Management discussion, Tarnwick Works

Net sales were 412 million, led by new contracts at the Harrow plant. Gross margin was 33.0 percent. Operating expenses were 96 million. We ended the year with 1,180 employees. Capital spending was 38 million, mostly for the Harrow packing line. Net debt stood at 175 million at year end. The dividend was 0.40 per share.
----- file ends -----

==========
## Card 2 of 2: gen-summarize-file (GEN)
Feature the card names: Workiva AI chat with workspace files. Where the card says to find it: In chat, click Add workspace files or type @ (up to 10 files), or right-click a file and choose Ask Workiva AI. Files must be in your workspace first; chat takes no uploads. It reads text, numbers and charts, including scanned PDFs and images.

### Prompt
Use only the document I selected with @. Context: the summary is for the operations leadership team, who will not read the full file. Summarize it in five bullets, then list every point that needs a decision, with who decides and by when if the document says. Do not add facts, currencies or units that are not in the document; I will review it.

### File: gen-summarize-file.txt
----- file starts -----
MADE-UP TEST DATA
MEMO - Packing line upgrade, Quellmoor Foods (made-up)
From: Priya. To: Operations leadership.

The packing line at the Harrow site is due for an upgrade, and the team has narrowed the work to a few options. Two suppliers have quoted. The Alder quote is 118,000 and the Birch quote is 104,000 with a longer delivery time. We need Dana to choose between the Alder and Birch quotes by 15 May so the order can be placed. The project budget currently holds 95,000, so we need Marcus to approve an extra 25,000 before any order goes out. The upgrade needs a pilot, and we need leadership to pick the pilot shift, either nights or weekends. Two analysts would be needed to track results, so we need Hana to confirm hiring 2 analysts on a six-month contract. Finally, we need Dana to set the review date for the pilot results, which we suggest in late September. Training for operators is planned and is not affected by these points. The current line has run for nine years and its output has slipped slowly.
----- file ends -----

