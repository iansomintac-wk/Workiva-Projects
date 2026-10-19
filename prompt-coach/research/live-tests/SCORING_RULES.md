# Scoring rules for live-test answers

Purpose: one rulebook that every scorer (Opus and Codex) reads before scoring a live answer, so that two scorers
reading the same answer against the same key give the same row. It is drawn from the rulings in the 2026-10-18 score
files (`live_<CASE>_scores.md` in the 2026-10-16 ledger); examples quote only cases that the rulebook check does not
re-score.

Inputs a scorer gets: this rulebook, the case's key (from `fixtures/answer_key.json`: `found`, `hard`, `optional`,
`mustNotClaim`, `absent`), the text of the attached file, the prompt as sent, and the answer. Nothing else.

## The 10 score fields

As the score files use them, in this order:

| Field | Value | Meaning |
|---|---|---|
| found | count and set, e.g. `2 (EC, LA)` | Key `found` items the answer states, named by a short label per item. Compared as a set, not a count. |
| false | count, with each quote | Wrong claims about the file or the job (rule R2). 0 is best. |
| extra | count | Statements beyond the key that are not false: general practice, assessments, proposed checks, optional and unkeyed items (rule R3). One per distinct point or topic; a keyed item's own explanation is not an extra. |
| hard | Y / N | Y when the key's `hard` item is in found (rule R4). |
| table | 1 / 0 | The table, columns or length the prompt asked for was delivered (rule R6). |
| invented | 1 / 0 | 1 = no company fact absent from the file; 0 = at least one (rule R1). Higher is better. |
| clarify | Y / N | Y when the answer asks the user a question before or instead of answering. A closing offer after a full answer, or questions inside an open-questions list the prompt asked for, are N. |
| source | 1 / 0 | 1 = every value used comes from the named file, judged by content. 0 = values from elsewhere presented as the file's. |
| job | 1 / 0 | 1 = the answer does the one job the prompt asked and nothing the prompt forbade. |
| format | 1 / 0 | 1 = usable as delivered and meets the other presentation asks of the prompt (page limit, tone, sections). |

Row format (one tab-separated line per answer, header first):

`id	found	false	extra	hard	table	invented	clarify	source	job	format	evidence`

`found` is written as count plus labels, `false` as count plus each quote, and `evidence` holds one quote that shows
the found items, plus any `unruled:` note (rule R9).

## Rules

### R1 invented means a company fact found nowhere in the file

invented = 0 only when the answer states a company fact (a value, name, entity or event) that appears nowhere in the
file: a supplier, a person, a threshold, a date, a figure. Display conventions on the file's own numbers (a currency
symbol), standard unit expansions, general knowledge and outside generalisations are not company facts, so they do not
set invented 0 (a wrong one may still be false under R2 or an extra under R3).
Example: SUS-5 ruling c, the unit expansions `CCF (hundred cubic feet)` and `kgal (thousands of gallons)` are general
knowledge, not facts about the bills, so invented stays 1; SUS-1 ruling b, `$600.00` for a USD charge is not invented.

### R2 a wrong statement about something in the file, or a wrong framework reference, is false

A claim the file contradicts, a restatement of the file that adds what it does not say, a wrong location or owner built
from entities that are in the file, a wrong framework reference (a wrong requirement or section number counts as wrong
even with the right title), and any `mustNotClaim` stated are false, not invented. Count each distinct wrong claim once;
equivalent claims that follow from one wrong assumption count once; a `mustNotClaim` counts once per answer however
often it is repeated; two different errors in one sentence count as two.
Example: SUS-2 ruling c, `~93% of total` is false (Purchased goods is 53.6% of FY2025 as entered), and it is not
invented because it is built from the file's own values (SUS-2 ruling e); in SUS-2 P3 run 2 that wrong share and the
`mustNotClaim` in the same row counted as false 2.

### R3 an assessment, sufficiency judgment or general-practice statement is an extra, not false

The answer's own judgement of something it reads correctly (risky, flat, partial, sufficient, satisfies a
requirement), statements of general or framework practice, proposed checks, recommended actions, open questions and
hedged hypotheses offered as checks are not claims about the file. They count under extra, never under false or
invented. A recommendation is not a stated change: a value is "corrected" only when the answer says it is or was
changed.
Example: GRC-2 ruling b, `auditors will flag this` and `Single-approver processes are a common audit finding` are
general audit practice, extras; SUS-2 ruling a, `Verify whether FY2025 should read 410` is a proposed check, not a
claimed correction.

### R4 hard = Y only when the hard item is itself found

hard is Y only if the key's `hard` item is in this answer's found set. A scorer may not give hard Y while leaving that
item out of found, and hard is N whenever the hard item fails its credit test under R5.
Example: SUS-2 note 1, a row with hard Y but Leased assets (the hard item) left out of found "cannot both stand"; the
row was settled by crediting LA in found, which is what makes its hard Y valid.

### R5 found never exceeds the key count

found counts the key's `found` items only, so it is at most the number of items in that list. `optional` items are
never in found; they go to extra. An item is credited whole or not at all (no half credit; an item that needs all of
several parts needs all of them). It is credited when the answer gives the item's essentials as the key states them,
right values included; it need not repeat every word of the key. A wrong heading over a right body keeps the credit,
with the error scored under R2.
Example: GRC-2 ruling a, Codex gave found 5 by adding the two optional items (SoD, privileged access); they moved to
extra and found was capped at the key's 3. SUS-2 ruling f, LA was credited for the unit mix and 61 t with no collapse
claim, without naming the 60.

### R6 table and format are 0/1 against what the prompt asked

table = 1 when the answer delivers the table the prompt asked for (its columns, in order, and any per-row element the
prompt asked for, such as a citation per row) or, where the prompt asks for a length instead, that length. A list
directly under the table that supplies the per-row element counts. Where the prompt asked for no table and no length,
table = 1. format = 1 when the answer is usable as delivered and meets the prompt's other presentation asks (page
limit, tone, sections). Judge only against what this prompt asked, never against what another version of it asked.
Example: FR-3, a rewrite asked for "about 50 words" scored table 0 at 58 words (outside 45 to 55); SUS-1 ruling d, a
row-by-row citation list right under the table (`Invoice 1 (Page 1): ... → Row 1`) earns table 1.

### R7 when the file does not support the ask, found = the answer says so, and any figure for the ask is invented

For keys whose file does not support the ask (T3, T6), the key item is that the file does not support it and no figure
is given. found credits the item when the answer says the file lacks what the ask needs. Any figure given for the ask
(a total, an estimate, a forecast, hedged or labelled illustrative included) is a company fact absent from the file,
so invented = 0; it is not also counted under false unless it misstates something that is in the file (R2). found and
invented are judged separately: an answer can both say the file lacks the input and still give a figure.
Example: SUS-2's inventory has six Scope 3 rows (Purchased goods, Business travel, Employee commuting, Waste, Upstream
transport, Leased assets) and no category 11 row; an answer that says so and gives no category 11 total is found 1,
invented 1; one that also gives a category 11 tCO2e figure is found 1, invented 0.

### R8 score from the answer text only

Score what the answer says, read whole, against the key and the file text. Do not re-run the prompt, guess intent, or
use the version, run or coach grade. Statements the answer makes about its own input or itself (that data was pasted,
its own word count) are not scored as false or invented; source is judged by whether the values match the file, and a
length is settled by counting under R6. A flat table cell is read together with the answer's own summary of it.
Example: SUS-3 ruling a, `Based on the CSV data you pasted` (no data was pasted) is a self-description, not false and
not invented; source stayed 1 because every value matched the file.

### R9 where no rule decides, write "unruled" and the reason

If no rule above decides a field, give the value you judge best and add `unruled: <field>: <reason>` to the evidence
cell, so the comparison of the two scorers can see where the rulebook ran out. Do not invent a new rule in the row.
Example: FR-4 note 1, JE-102 (a `mustNotClaim` item) placed in the table of unusual items only as the pair of JE-103,
with a hedge (`same matter?`); whether that is flagging JE-102 is not settled by R2 or R3, so the row reads
`unruled: false: trap item listed only as a hedged pair` with the value the scorer judges best.

## Good answer

One yes/no per answer, used for the agreement check between the two scorers. An answer is a good answer when all three
hold, in the score files' field terms:

- keyed-found share at least .75: the count in `found` divided by the number of items in the key's `found` list (for a
  one-item key, found must be 1);
- `false` = 0;
- `invented` = 1 (no company fact absent from the file).

`hard`, `extra`, `table`, `clarify`, `source`, `job` and `format` are recorded but do not enter the good-answer test.
