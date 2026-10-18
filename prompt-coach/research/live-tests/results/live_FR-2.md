# Live test FR-2 (Workiva AI, Ian's own sandbox)

- Workspace: Ian's own sandbox, Windows Chrome (Browser 2), driven via Claude in Chrome.
- Files: Files / Prompt coach test - Ian / fr_revenue_footnote.docx and fr_trial_balance.xlsx (stored with Upload, not Import; folder access: Ian only, Owner).
- Each prompt in a fresh chat: Workiva AI panel (top-bar "Workiva AI" button) > "New chat" button.
- Answers copied from the chat panel's page text (innerText); tables are tab-separated as the page renders them. The UI's collapsed "Thought" section was not expanded.

## P1 (original)

- Sent (UTC): 2026-10-18T06:00:14Z (clock read just before clicking Send)
- Files referenced: typed "@fr_revenue" in the message box, picked fr_revenue_footnote.docx from the @ dropdown; typed "@fr_trial", picked fr_trial_balance.xlsx. Both showed as chips above the text; the sources counter showed "2".
- Prompt as sent (input box text after chips): `pls check that the numbers in the attached revenue footnote tie to the attached trial balance, kindly list any that dont match`

Answer (verbatim):

```
Thought

Here's a comparison of the figures across both documents:

Table

Line Item	Revenue Footnote	Trial Balance	Match?	Variance
Product revenue	$790	$790	✅	—
Service revenue	$510	$520	❌	$10
Deferred revenue	$140	$145	❌	$5
Accounts receivable	$303	$330	❌	$27

3 items do not tie:

Service revenue — The footnote states $510, but the trial balance shows $520 (a $10 difference).
Deferred revenue — The footnote states $140, but the trial balance shows $145 (a $5 difference).
Accounts receivable — The footnote states $303, but the trial balance shows $330 (a $27 difference).

You'll want to investigate whether the footnote needs to be updated to reflect the trial balance figures, or vice versa.

11:00 PM • Oct 17, 2026
```

## P2 (Strong at 73be350, blank filled)

- Sent (UTC): 2026-10-18T06:02:08Z (clock read just before clicking Send)
- Files referenced: new chat (no sources carried over); same @ method as P1: "@fr_revenue" > fr_revenue_footnote.docx, "@fr_trial" > fr_trial_balance.xlsx. Both chips shown; sources counter "2".
- Prompt as sent: `This is for the quarterly close review. Please check that the numbers in the attached revenue footnote tie to the attached trial balance, kindly list any that dont match. For each mismatch, give both locations and both values in a table.`

Answer (verbatim):

```
Thought

Here are the items from the revenue footnote that do not tie to the trial balance:

Table

Line Item	Footnote Value	Trial Balance Value
Service revenue	$510	$520
Deferred revenue	$140	$145
Accounts receivable	$303	$330

Product revenue ($790) is the only item that matches between the two documents. The three mismatches above should be investigated and resolved before the quarterly close is finalized. Would you like help drafting a variance summary or taking any other action?

11:02 PM • Oct 17, 2026
```

## P3 (Strong now, blank filled)

- Sent (UTC): 2026-10-18T06:03:38Z (clock read just before clicking Send)
- Files referenced: new chat (no sources carried over); same @ method as P1: "@fr_revenue" > fr_revenue_footnote.docx, "@fr_trial" > fr_trial_balance.xlsx. Both chips shown; sources counter "2".
- Prompt as sent: `This is for the quarterly close review. Check that the numbers in the attached revenue footnote tie to the attached trial balance, list any that dont match. For each mismatch, give both locations and both values in a table.`
- Capture note: the tool truncated the first read; the tail was read in a second call from "Accounts receivable: The" on and joined here (overlap matched).

Answer (verbatim):

```
Thought

Here are the numbers that do not tie between the two documents:

Table

Line Item	Footnote Value	Trial Balance Value
Service revenue	$510	$520
Deferred revenue	$140	$145
Accounts receivable	$303	$330

Product revenue ($790) is the only item that matches across both documents.

The three mismatches above should be investigated and resolved before the quarterly close is finalized. A few next steps to consider:

Service revenue / Deferred revenue: The $10 and $5 differences could indicate a timing or allocation issue between recognized and deferred amounts.
Accounts receivable: The $27 gap is the largest variance and may warrant a reconciliation of the AR subledger.

Would you like help drafting a variance memo or opening either of the source files to investigate further?

11:03 PM • Oct 17, 2026
```
