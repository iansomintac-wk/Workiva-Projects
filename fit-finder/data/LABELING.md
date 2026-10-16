# Fit Finder labeling guide

Each example is one task a Workiva customer describes in their own words: something they do in
financial reporting, GRC/audit or sustainability work. Label whether Workiva AI (a generative AI
assistant inside Workiva documents, spreadsheets and presentations that reads the open file, a
selection, @-referenced files and knowledge bases, and writes text back to the person) is a
good place to hand part of that task.

The rule, from the Workiva AI explainer: quick wins are tasks that are **repetitive and
text-heavy: reading, drafting, explaining and checking**. A person stays in charge of
judgment, sign-off and anything that must be exactly right.

## Output: JSONL, one object per line

{"id": 0, "fit": "good|partial|not", "repeats": 0|1, "ops": ["READ", ...],
 "blockers": ["judgment", ...], "area": "FR|GRC|SUS|GEN"}

## fit

good     The core of the task is reading, comparing, checking, summarizing, drafting or rewriting
         text or tables a person can put in front of the AI, AND it recurs (each period, each
         control, each section, each supplier). The AI can do a first pass that a person reviews.
partial  The AI can do a useful first pass on part of it, but a big share needs one of the
         blockers below, or it happens once / rarely, or the input lives outside Workiva.
not      The core of the task is a blocker: deciding, approving or signing off; exact arithmetic
         that a formula or system should do; doing things in other systems (sending, booking,
         scheduling, updating an ERP); chasing people for information; or there is no text or
         table to work from.

When torn between two levels, pick the lower one.

Ranking items, estimating progress against a target and drafting a plan or roadmap from the
person's own data are partial, not "not": the AI does a first pass, and checking the numbers and
deciding stay with the person (Ian, 2026-10-15, on three Workiva sustainability prompts: "s4, s5,
s6 should be partial"). None of the 120 tasks in tasks.jsonl uses these words, so their labels
are unchanged.

## repeats
1 = the description says or clearly implies it recurs (every close, each quarter, every control,
for each supplier, all 40 entities). 0 = one-off or unclear.

## ops (all that apply, in the order the task needs them)
READ       take in a document, table or policy
SUMMARIZE  condense for a reader
COMPARE    two versions, periods, sources or a peer
CHECK      look for errors, gaps, mismatches, missing evidence
EXTRACT    pull specific items into a list or table
DRAFT      write new text (narrative, finding, footnote, email body)
REWRITE    change tone, length or clarity of existing text
EXPLAIN    explain a requirement, a change or a formula
MAP        link items to a framework or standard
CLASSIFY   sort, rank or tag items into groups
ESTIMATE   a first-pass projection from data (a trajectory, the yearly cut needed to reach a target)
CALCULATE  compute numbers (a blocker when it must be exact)
DECIDE     judgment, approval, sign-off, materiality call
ACT        do something in another system or in the world (send, book, update, upload, schedule)
COLLECT    get information from other people

## blockers (only for partial / not)
judgment, approval, exact-calc, cross-system, collect-from-people, one-off, no-source
