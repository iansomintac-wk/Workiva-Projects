# Sandbox scoring sheet

| card | area | planted | found of 5 | facts invented | feature where the card says | pass | fixed and re-run |
|---|---|---|---|---|---|---|---|
| fr-yoy-narrative | FR | 5 | 5 | 1 | yes: chat with files (@); card no longer names the Prompt advisor (Ian) | no ("$" added; Ian's in-chat run added "£") | prompt: keep amounts and units as written, no currency; mark unexplained changes TO CONFIRM. Re-run: 5 found, 0 invented, pass |
| fr-narrative-tables | FR | 5 | 5 | 0 | yes: chat with files (@) | yes | - |
| grc-evidence | GRC | 5 | 5 | 0 | no: Evidence analyzer not in this sandbox; plain @ chat answered | yes | - (feature reported to Ian, card kept) |
| grc-rationalize | GRC | 5 | 5 | 0 | no: no Risk & Control knowledge base in this sandbox; plain @ chat answered | yes | - (feature reported to Ian, card kept) |
| sus-anomalies | SUS | 5 | 5 | 0 | yes: in the spreadsheet (right-click > Workiva AI > Ask about selected cells); in-place run 5 found, 0 invented | yes | - |
| sus-exec-narrative | SUS | 5 | 5 | 0 | yes: in the document (select text > Quick edits + prompt box) | yes, but over the word limit (chat 85, in place 94 words, 92 without dashes; limit under 80); in place it also leads with the cause, not with what changed since last year | "stays" now says: count the words yourself (no re-run: the prompt is unchanged) |
| gen-summarize-file | GEN | 5 | 4 | 1 | yes: chat with files (@) | no ("£" added; decisions squeezed into "three points") | prompt: list every decision with who and when; keep amounts as written, no currency. Re-run 1: 4 strict, 0 invented (dropped amounts); re-run 2: 5 found, 0 invented, pass |
| gen-rewrite | GEN | 5 | 5 | 0 | yes: in the document (same route) | yes in chat (66 words); in place no: "close to the budget" became "within budget", 74 words, 72 without dashes (limit under 70) | "stays" now says: every number and fact, and count the words yourself (no re-run: the prompt is unchanged) |

## Rubric

- A planted item counts as found when the reply states what its `note` says (see `key.json`).
- An invented fact is an unsupported factual claim: a number, date, name, entity, amount or event that is not in the file and is not a correct calculation from it.
- Not invented: a correct deduction or sum from the file (for example, a total that adds up), a finding that something is absent from the file ("no owner is named"), a plainly marked hypothesis or question ("this may be because..."), and framing words.
- Invented: "revenue grew 12%" when the file shows no such figure; naming a person or system the file does not mention; quoting a standard section as if the file cited it.

## How this was run (2026-10-19)
- Runs: a Claude in Chrome driver session in Ian's own Workiva AI sandbox, his private folder only; made-up files uploaded as .docx/.xlsx and picked with @; one fresh chat per card (sent 14:50-15:01 UTC). Card 1 was also run by Ian with the file text in the chat. Re-runs at 15:10-15:12 and 15:23 UTC; in-place document and spreadsheet runs at 15:35-15:42 UTC.
- Scored twice (the lead and a Sonnet scorer, independently); found and invented agreed on all 8 first runs. Lead decisions: gen-summarize-file "pilot following the upgrade" not counted as invented; word counts are measured with wc -w, not taken from the answer (the answers' own counts were wrong 3 times out of 4).
- The sandbox may have features a customer lacks, and lacked the two GRC features here: it shows what Workiva AI can do, not what every customer has.
