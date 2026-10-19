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
| false | count, with each quote | Wrong claims about the file or the job (rules R2, R10, R11). One per distinct wrong fact. 0 is best. |
| extra | count | Statements beyond the key that are not false: general practice, assessments, proposed checks, optional and unkeyed items (rules R3, R12). One per distinct point; a keyed item's own explanation is not an extra. |
| hard | Y / N | Y when the key's `hard` item is in found (rules R4, R15). |
| table | 1 / 0 | The table, columns or length the prompt asked for was delivered (rule R6). |
| invented | 1 / 0 | 1 = no company fact absent from the file; 0 = at least one (rule R1). Higher is better. |
| clarify | Y / N | Y when the answer asks the user a question before or instead of answering. A closing offer after a full answer, or questions inside an open-questions list the prompt asked for, are N. |
| source | 1 / 0 | 1 = every value used comes from the named file, judged by content. 0 = values from elsewhere presented as the file's. |
| job | 1 / 0 | 1 = the answer does the one job the prompt asked and nothing the prompt forbade (rule R14). |
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

### R10 one false item is one distinct wrong fact

Count false by distinct wrong facts, not by sentences or mentions. The same wrong value, owner or reference repeated
(in the table, the text and the summary) is one false item. A wrong framework reference counts once per distinct wrong
reference: the same wrong number cited three times is one; two different wrong numbers are two, even in one sentence.
Words that only name or describe the wrongly cited section (its title, what that section covers) belong to that same
false item and are not counted again. A reference is wrong only when the scorer can name the right reference for that
point and it differs; a reference the scorer cannot show to be wrong is not false and is not counted as an extra on
its own.
Made-up example: an answer cites "section 7.2" for a point the key places in section 7.4, cites it again in its
summary, and adds "7.2 sets out the disclosure of targets": false 1. If it also cites "section 9.1" for a second point
whose right section is 9.3, false 2.

### R11 one statement is scored in one field: invented, false or extra

A statement that adds a new company fact (a value, person, supplier, document, system, step or control the file does
not contain, stated as part of this company's data or process) is invented under R1 and is not also false. A
statement that misstates the file (a wrong value, or a wrong relationship among things that are in the file, such as
who does what, who can act, or what follows what) is false under R2, whatever its verb: "X can do Y" and "X could do
Y" are claims about the file's process. A risk stated as a consequence of a gap the file does show ("with no second
reading, a meter error may go unnoticed") is an assessment, an extra under R3. The same thing named only as general
practice ("utilities usually estimate a reading when access fails") is an extra.
Made-up example: a file of water bills lists each bill's date and meter reading. "Readings are checked against the
site's smart-meter log" (no such log in the file) is invented 0, false unchanged; "the March reading was taken after
the March bill was issued" when the file dates the bill after the reading is false 1.

### R12 one extra is one distinct point beyond the key

extra is judged against the key, not against the prompt: a statement is an extra when it is not false, not invented,
and does not deliver a key `found` item, even when the prompt asked for that kind of content. So each proposed check,
next step, recommended action, open question and hypothesis counts as one extra, including under a heading the prompt
asked for, unless it is itself the text of a key `found` item. Count one per distinct point: a bullet or sentence
with two different checks counts two; the same point repeated (in a list and again in a summary) counts once; a
heading with three distinct points under it counts three. Optional items count one each. Not extras: a keyed item's
own explanation, the file's values restated in the table the prompt asked for, headings, an opening line that
restates the task, a closing offer, statements about the answer itself (R8) and false or invented statements (scored
in their own field).
Made-up example: a "Next steps" list with "Confirm the March rate with the supplier", "Re-run the totals after the
fix" and "Confirm the March rate before closing" is extra 2 (the third repeats the first).

### R13 a key item with right values and a wrong or missing caveat

Credit a key `found` item when the answer gives its values (figures, entities, direction of change) as the key states
them. A caveat or qualifier attached to those values in the key (a timing, a one-off cause, a condition) does not
decide the credit: a missing caveat is scored nowhere, and a wrong caveat keeps the credit and is one false item under
R2 and R10. The one exception is a key item whose point is the caveat itself (the key item is "the rise is a one-off,
not a trend"): then the caveat is the item's essential, and an answer that gives the values without it, or with a
wrong one, does not earn the item.
Made-up example: key item "Travel cost rose 30%, mostly from one conference in May". An answer giving the 30% rise
with no cause earns the item; one giving the 30% rise "from higher airfares all year" earns the item and is false 1.

### R14 job = 0 only for the wrong job, a forbidden act, or no job done

job = 0 only when the answer (a) does a different job from the one asked (asked to list issues, it rewrites the file;
asked for one deliverable, it gives another), (b) does something the prompt forbade in words (the prompt says "do not
speculate" and the answer speculates), or (c) does not do the job at all (only asks questions, or refuses, except when the answer key says the file cannot support the ask: a clear decline that says what the file lacks is job 1, the R7 case). Everything
else is scored in its own field and leaves job 1: extras, hypotheses and speculation the prompt did not forbid, added
sections, a wrong or loose heading, false or invented statements, missed items and table or format misses.
Made-up example: asked for a reconciliation table, an answer that gives the table plus a "possible causes" section
with guesses is job 1 (the guesses are extras); if the prompt said "facts only, no guesses" it is job 0.

### R15 hard and the good-answer test are derived last, from the scored fields

Score found first, applying R5 and R13 to each key item, then set hard from it under R4: hard = Y exactly when the
key's `hard` item is in the found set, N otherwise. Never judge hard on its own, and never change found to match a
hard value. A difference between two scorers on hard is a difference on found, and is reported as that. The
good-answer test is then read off found, false and invented as written, with no further judgement.
Made-up example: a key with four items whose hard item is "the duplicate payment"; a scorer who credits three items
but not the duplicate payment writes found 3 and hard N, never hard Y.

## Good answer

One yes/no per answer, used for the agreement check between the two scorers. An answer is a good answer when all three
hold, in the score files' field terms:

- keyed-found share at least .75: the count in `found` divided by the number of items in the key's `found` list (for a
  one-item key, found must be 1);
- `false` = 0;
- `invented` = 1 (no company fact absent from the file).

`hard`, `extra`, `table`, `clarify`, `source`, `job` and `format` are recorded but do not enter the good-answer test.

## Corrections after scoring (2026-10-19)

Written after the tricky-batch final review. The 24 scores are unchanged; nothing above is rewritten.

- **R7 example.** The example says "found 1" for an answer that says the file has no category 11 row. The T3 and T6
  keys have 2 items each, and both scorers gave found 2 for a correct refusal. Read "found 1" there as one key item
  credited, not the found total.
- **R2 versus R7/R11 (precedence).** A figure given for an ask the file cannot support is invented under R7/R11, even
  when the key lists it under `mustNotClaim`. R2's "any `mustNotClaim` stated is false" applies to a wrong statement
  about something in the file, not to a new company figure. `mustNotClaim` names the prohibited content; it does not
  decide the field. In this batch the conflict did not arise: all 4 T6 answers declined, and both scorers gave
  false 0 and invented 1 in all 8 T6 rows (measured 2026-10-19 from the mapped score files).
- **R14(c) versus R7.** Ruling: when the answer key says the file cannot support the ask (T3, T6), a clear decline
  that says what the file lacks scores job 1; R14(c) does not score it job 0. Decided by proxy, i.e. proxy decided 2026-10-19 08:12Z (PM proxy
  for Ian; Ian may overturn). Scores already given are not re-scored in this run, so the T3 x2 and T6 x4 refusals stay
  as scored; the change applies to the next batch.
