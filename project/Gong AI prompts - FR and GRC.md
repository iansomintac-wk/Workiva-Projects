# Gong AI prompts — Workiva AI opportunity mining

Two prompts, same skeleton as the Sustainability version. Paste one at a time into Gong AI, scoped to the relevant account list.

---

## Prompt 1 — Financial Reporting accounts

Analyze customer calls for Financial Reporting accounts (SEC reporting, annual/quarterly close, management reporting, statutory reporting) and identify repetitive cognitive tasks within the customer's current workflow that may be good candidates for improvement using Workiva AI.

### Objective

Do not focus primarily on whether the customer explicitly mentioned AI.

Instead, analyze how the customer describes their existing close, consolidation, drafting, review, tie-out, disclosure, and filing workflows.

Look for tasks where people repeatedly have to:

* read prior-period filings, peer filings, or accounting guidance
* search for a number, disclosure, or footnote across documents
* summarize a table, schedule, or variance into narrative
* compare current vs prior period, budget vs actual, or their disclosure vs peers
* review MD&A, footnotes, or press releases manually
* check that a figure agrees across the report, the schedules, and the XBRL
* validate that narrative matches the numbers
* interpret an ASC / IFRS / SEC requirement or a new rule
* identify gaps in disclosures against peers or requirements
* explain variance drivers to reviewers or executives
* draft or rewrite footnotes, MD&A, earnings-release language, or board commentary
* consolidate commentary from multiple contributors (segments, entities, FP&A)
* prepare executive or audit committee summaries
* turn quantitative data into explanations
* create reviewer comments or follow-up questions for preparers
* perform similar work every close

Prioritize tasks that are:

1. Repetitive
2. Time-consuming
3. Primarily cognitive rather than transactional (excluding data loads, roll-forwards, formatting, XBRL tagging mechanics)
4. Currently performed manually
5. Based on information the customer already has in Workiva or can attach
6. Easy for a human to verify afterward, ideally against a number already on screen

### What to listen for

* "manual" / "manually"
* "we have to go through"
* "we read through the whole document"
* "we compare to last year"
* "we tie out"
* "we tick and tie"
* "we foot"
* "we reconcile"
* "we check the numbers against"
* "we make sure the narrative matches"
* "we look at what peers disclosed"
* "we benchmark"
* "we research the guidance"
* "we pull together commentary from"
* "we consolidate the inputs"
* "we draft" / "we rewrite" / "we wordsmith"
* "we explain the variance"
* "legal / audit / the controller reviews everything"
* "someone has to"
* "every quarter" / "every close" / "every 10-K"
* "it takes days"
* "we're always behind on"
* "we don't know what we're missing"

Also identify workflows even when the customer does not describe them as painful.

### Financial Reporting workflows to pay particular attention to

* 10-K / 10-Q / 8-K drafting and review
* MD&A and results-of-operations narrative
* footnote drafting and prior-year roll-forward of disclosure language
* variance and flux analysis (period-over-period, actual vs budget)
* tie-out of figures across schedules, the document, and XBRL
* narrative-to-number consistency review
* peer disclosure benchmarking and gap analysis
* new accounting standard or SEC rule interpretation
* earnings release and investor Q&A preparation
* board / audit committee reporting
* management reporting packages and executive summaries
* statutory / multi-entity reporting with repeated narrative
* contributor collection and review across segments or entities
* external auditor request preparation
* proxy and ESG-in-10-K cross-referencing

### Analysis requirements

For every meaningful opportunity, provide:

1. **Customer** — account name.
2. **Call** — title and date if available.
3. **Customer quote or evidence** — most relevant statement or close paraphrase. Do not invent pain points not supported by the conversation.
4. **Current workflow** — what the customer does today.
5. **Repetitive cognitive task** — the specific thinking task. Be specific. Examples: manually explaining revenue variance drivers for the MD&A; reading five peer 10-Ks for supply-chain risk language; checking that every footnote figure agrees to the face financials; rewriting last year's lease footnote for this year's numbers. Avoid "the close is manual."
6. **Frequency** — monthly / quarterly / annual / every close / ad hoc / unknown.
7. **Pain signal** — Explicit pain / Implied pain / Weak signal.
8. **Potential AI task pattern** — ANALYZE, COMPARE, SUMMARIZE, CHECK, DRAFT, EXTRACT, CLASSIFY, RESEARCH, EXPLAIN.
9. **Possible Workiva AI opportunity** — how AI could do the **first pass** while a person still reviews and signs. Plausible patterns only: table-to-narrative drafting, variance explanation, footnote drafting from prior-year structure, narrative-vs-number consistency check, figure tie-out across referenced schedules, peer disclosure comparison (SEC Filing Intelligence), standards Q&A (Workiva Support Intelligence knowledge base), reviewer question generation, tone/length rewriting of executive commentary. Do not claim a capability is available to the customer unless the call confirms it. Label agents (Benchmarking, Tie-Out) as "requires entitlement/enablement validation."
10. **Suggested discovery question** — one natural follow-up for the next call. Example: "When the segment leads send their commentary, what does the controller have to check by hand before it goes into the MD&A?"
11. **Suggested AI bridge** — a short, conversational way in, not a pitch. Example: "You mentioned someone re-ties the footnote totals to the schedules every quarter. That might be a good place to try Workiva AI as a first-pass checker while your team still confirms the result."
12. **Opportunity score** — 1–5 each for Frequency, Manual effort, AI suitability, Ease of human validation, Likely customer value; then overall HIGH / MEDIUM / LOW. Weight "ease of validation" heavily: the best FR use cases put the source number on screen next to the AI output.

### Final output

**A. Top customer-specific AI opportunities** — rank the 10 strongest across the calls:

| Rank | Customer | Current workflow | Repetitive cognitive task | Evidence | AI task pattern | Potential Workiva AI first pass | Priority | Suggested next-call question |

**B. Cross-customer patterns** — recurring cognitive tasks across multiple FR customers. For each: task, number of customers, example customer language, typical workflow, why strong/weak AI candidate, potential Workiva AI use case, recommended discovery question.

Finally: **What are the 5 most common Financial Reporting workflow problems we should train OSMs / CSMs to listen for because they naturally create a Workiva AI conversation?**

Be skeptical. Exclude tasks that are transactional (data loads, formatting, tagging mechanics, roll-forwards of numbers), tasks where the customer needs a system of record change rather than cognitive help, and tasks where AI output would be hard to verify against the customer's own numbers.

---

## Prompt 2 — GRC accounts

Analyze customer calls for GRC accounts (SOX, internal audit, enterprise risk, compliance, controls management, policy management) and identify repetitive cognitive tasks within the customer's current workflow that may be good candidates for improvement using Workiva AI.

### Objective

Do not focus primarily on whether the customer explicitly mentioned AI.

Instead, analyze how the customer describes their existing scoping, risk assessment, control documentation, testing, evidence review, issue management, and reporting workflows.

Look for tasks where people repeatedly have to:

* read policies, procedures, process narratives, regulations, or frameworks
* search for a control, requirement, or piece of evidence
* summarize test results, issues, or risk registers for management
* compare controls against a framework (SOX, COSO, NIST, ISO, SOC 2, COBIT), against each other, or across entities
* review control descriptions, narratives, or test workpapers manually
* check evidence to confirm it actually supports the control as designed
* validate that narratives, flowcharts, and control matrices agree
* interpret a regulatory or framework requirement
* identify duplicate, overlapping, or missing controls
* identify coverage gaps against a framework or new regulation
* analyze trends in deficiencies, issues, or risk ratings
* draft or rewrite control language, test procedures, remediation plans, or audit findings
* synthesize input from control owners across business units
* prepare audit committee or executive risk summaries
* research peers or industry practice
* create follow-up or walkthrough questions for control owners
* perform similar work every testing cycle or audit

Prioritize tasks that are:

1. Repetitive
2. Time-consuming
3. Primarily cognitive rather than transactional (excluding evidence collection, sign-off routing, certification chasing, status tracking)
4. Currently performed manually
5. Based on information the customer already has in Workiva or can attach
6. Easy for a human to review afterward, and clearly a **first-pass** where the auditor still concludes

### What to listen for

* "manual" / "manually"
* "we have to go through every control"
* "we read every narrative"
* "we walk through"
* "we map to the framework"
* "we cross-reference"
* "we compare to last year's RCM"
* "we check the evidence"
* "we make sure the evidence supports"
* "we look for duplicates / overlaps"
* "we rationalize"
* "we don't know what's missing"
* "we interpret the requirement"
* "we rewrite the control description"
* "we draft the finding" / "we draft remediation"
* "we summarize for the audit committee"
* "the control owners send us"
* "someone has to review all of it"
* "every quarter" / "every testing cycle" / "every year we re-scope"
* "it takes weeks"
* "new regulation" / "new framework" / "we just added"

Also identify workflows even when the customer does not describe them as painful.

### GRC workflows to pay particular attention to

* SOX scoping and risk assessment
* risk and control matrix (RCM) maintenance and rationalization
* control description and process narrative drafting or refresh
* process flowcharting from narratives
* framework mapping and multi-framework harmonization
* control design and operating effectiveness testing
* evidence review and sufficiency assessment
* deficiency evaluation and aggregation
* issue and remediation management
* internal audit planning, fieldwork, and report writing
* enterprise risk assessment and risk register review
* policy management and policy-to-control mapping
* regulatory change interpretation and impact assessment
* third-party / vendor risk review
* audit committee and board reporting
* external auditor reliance and PBC preparation

### Analysis requirements

For every meaningful opportunity, provide:

1. **Customer** — account name.
2. **Call** — title and date if available.
3. **Customer quote or evidence** — most relevant statement or close paraphrase. Do not invent pain points not supported by the conversation.
4. **Current workflow** — what the customer does today.
5. **Repetitive cognitive task** — the specific thinking task. Be specific. Examples: reading 300 control descriptions to find duplicates; mapping the existing RCM to a newly adopted framework; checking whether a screenshot actually shows the approval the control requires; rewriting control language each time a process owner changes. Avoid "compliance is manual."
6. **Frequency** — quarterly / annual / every testing cycle / ad hoc / unknown.
7. **Pain signal** — Explicit pain / Implied pain / Weak signal.
8. **Potential AI task pattern** — ANALYZE, COMPARE, SUMMARIZE, CHECK, DRAFT, EXTRACT, CLASSIFY, RESEARCH, EXPLAIN.
9. **Possible Workiva AI opportunity** — how AI could do the **first pass** while the auditor or risk owner still concludes. Plausible patterns only: control description rewriting in compliance-friendly language; test-step generation from a control; duplicate/overlap detection in the RCM; framework coverage gap review; remediation strategy drafting from a failure write-up; process-narrative-to-flowchart generation (GRC flowchart visualizer); "does this file contain evidence for control X" against an attached file; regulatory Q&A (Workiva Support Intelligence knowledge base); audit committee summary drafting; walkthrough question generation. Do not claim a capability is available to the customer unless the call confirms it. Label the Evidence Analyzer and any agent as "requires entitlement/enablement validation" or "planned — do not promise."
10. **Suggested discovery question** — one natural follow-up for the next call. Example: "When the control owners upload evidence, what does your team have to read to decide whether it actually supports the control?"
11. **Suggested AI bridge** — a short, conversational way in, not a pitch. Example: "You mentioned you go through the whole RCM each year looking for overlaps. That could be a good place to try Workiva AI as a first-pass reviewer while your team still decides what to consolidate."
12. **Opportunity score** — 1–5 each for Frequency, Manual effort, AI suitability, Ease of human validation, Likely customer value; then overall HIGH / MEDIUM / LOW. Weight "keeps the auditor as the decision-maker" heavily: the best GRC use cases produce review lists, drafts, or diagrams from the customer's own controls, never conclusions.

### Final output

**A. Top customer-specific AI opportunities** — rank the 10 strongest across the calls:

| Rank | Customer | Current workflow | Repetitive cognitive task | Evidence | AI task pattern | Potential Workiva AI first pass | Priority | Suggested next-call question |

**B. Cross-customer patterns** — recurring cognitive tasks across multiple GRC customers. For each: task, number of customers, example customer language, typical workflow, why strong/weak AI candidate, potential Workiva AI use case, recommended discovery question.

Finally: **What are the 5 most common GRC workflow problems we should train OSMs / CSMs to listen for because they naturally create a Workiva AI conversation?**

Be skeptical. Exclude tasks that are transactional (evidence collection, certification chasing, sign-off routing, status tracking), tasks where the real need is a workflow or system-of-record change, and anything where AI would be forming an audit opinion or deciding control effectiveness rather than preparing a first pass for a human.

---

## Follow-up prompt — workflow archetypes (run after Prompt 1 or 2, in the same thread)

**FR version**

Across these findings, cluster similar cognitive tasks into 5 to 8 repeatable Financial Reporting workflow archetypes. For each archetype, show: the customer trigger phrase (verbatim language from the calls), the underlying job-to-be-done, the safest Workiva AI first-pass use case (one where the source number or table is on screen next to the AI output and a preparer can verify in under a minute), a discovery question, a demo idea that runs inside the customer's own 10-K, 10-Q, or close package, and a recommended OSM talk track in two or three sentences. Flag any archetype that depends on an agent (Benchmarking, Tie-Out) as "requires entitlement / enablement validation." Rank the archetypes by how often they appeared and how easy they are to demo without changing the customer's process.

**GRC version**

Across these findings, cluster similar cognitive tasks into 5 to 8 repeatable GRC workflow archetypes. For each archetype, show: the customer trigger phrase (verbatim language from the calls), the underlying job-to-be-done, the safest Workiva AI first-pass use case (one that produces a review list, draft, or diagram from the customer's own controls, narratives, or evidence, and leaves the conclusion to the auditor or risk owner), a discovery question, a demo idea that runs inside the customer's own RCM, process narrative, or evidence set, and a recommended OSM talk track in two or three sentences. Flag any archetype that depends on the Evidence Analyzer or an agent as "planned / requires entitlement validation — do not promise." Exclude archetypes where AI would be deciding control effectiveness. Rank the archetypes by how often they appeared and how easy they are to demo without changing the customer's process.

---

## Follow-up prompt — evidence audit (run after the archetype prompt)

Solution-agnostic; swap the bracketed name. If Gong stalls ("Let me first examine…") it is trying to fetch calls instead of using the thread. Paste the archetype output directly into the prompt where marked so it has nothing to look up.

Below is the [Financial Reporting | GRC] workflow archetype analysis you produced earlier, pasted in full. Work ONLY from this text. Do not open, search, or re-read any calls or documents. Do not create new archetypes. Answer in this message, in full, as a table followed by a summary.

=== BEGIN ARCHETYPE ANALYSIS ===
[paste the full archetype output here]
=== END ARCHETYPE ANALYSIS ===

Task: audit every quote currently treated as DIRECT evidence for false positives.

A quote may stay DIRECT only if the customer's own words clearly demonstrate the specific cognitive task assigned to that archetype.

It is NOT enough that:
- the conversation occurred within a related workflow,
- the customer discussed a nearby product problem,
- Workiva personnel described the workflow,
- the quote implies a possible AI use case,
- or the quote requires substantial interpretation to fit the archetype.

Output part 1, a table with one row per DIRECT quote, columns:
Archetype | Customer | Exact quote | Current classification | Revised classification (DIRECT / INFERRED / UNRELATED-REMOVE) | One-sentence justification | Cognitive operation explicitly supported (READ / SEARCH / EXTRACT / COMPARE / CHECK / TIE-OUT / MAP / ANALYZE / SUMMARIZE / CLASSIFY / DRAFT / REWRITE / EXPLAIN) | Pain, effort, repetition, or frequency explicitly stated (YES / NO)

Output part 2, recalculated strength per archetype using ONLY revised DIRECT rows:
STRONG PATTERN = 3+ unique customers, EMERGING PATTERN = 2, CUSTOMER-SPECIFIC = 1, HYPOTHESIS = 0.
List each archetype with its old strength, new strength, and the unique customers that still count.

Be skeptical. Downgrade aggressively when the quote does not directly support the assigned cognitive workflow. Do not discuss whether Workiva AI can perform the task. This pass is evidence hygiene only.

---

## Final prompt — export for the explainer webapp (same thread)

Using only the revised DIRECT evidence from the audit, produce ONE JSON object for the [Financial Reporting | GRC] enablement explainer, in exactly this shape:

```
{
  "placeholder": false,
  "keptCount": "<number of non-HYPOTHESIS archetypes, written as a word, e.g. \"three\">",
  "patterns": [
    {
      "archetype": "short lowercase name",
      "strength": "STRONG PATTERN | EMERGING PATTERN | CUSTOMER-SPECIFIC",
      "customers": <number of unique customers with DIRECT evidence>,
      "operation": "up to three cognitive operations, separated by ' · ', e.g. CHECK · COMPARE · CLASSIFY",
      "quotes": [ { "text": "verbatim customer phrase, under 25 words", "who": "anonymized customer, e.g. mid-cap industrials" } ],
      "listenFor": [ "three short phrases an OSM would hear on a call, in quotes" ],
      "askLabel": "ask · proactively discover | ask · discover and probe | ask · listen, then probe",
      "discovery": "the discovery question",
      "talkTrack": "the OSM bridge, two sentences max",
      "availability": "included | requires entitlement validation | planned"
    }
  ],
  "gaps": [ { "archetype": "HYPOTHESIS archetype name", "operation": "e.g. RESEARCH · COMPARE" } ]
}
```

Rules: one quote per unique customer with DIRECT evidence (max 3 per archetype). Order patterns by strength, then customer count. Put every HYPOTHESIS archetype in `gaps`, not `patterns`. Use askLabel "proactively discover" for STRONG, "discover and probe" for EMERGING, "listen, then probe" for CUSTOMER-SPECIFIC. Anonymize customer names to industry plus size. Output JSON only.

Save the result as `fr-patterns.json` or `grc-patterns.json` in the project (overwrite the placeholder file). The explainer reads it on load.

---

## What changed vs the Sustainability prompt, and why

* **Same lens**: repetitive cognitive tasks (read, search, compare, check, draft, summarize) on information the customer already has. That is exactly the "find the read, draft, or check inside the cycle" idea from the explainers, so the prompts and the webapps reinforce each other.
* **Vocabulary swapped**: trigger phrases, workflow list, and frameworks are FR- and GRC-specific. Gong matches on the customer's words, so this matters more than the structure.
* **Validation posture differs**:
  * FR — number-anchored. Best use cases put the source table next to the AI output. Score "ease of validation" high.
  * GRC — judgment-anchored. Best use cases produce review lists, drafts, and diagrams; the auditor concludes. Add an explicit exclusion for AI forming an opinion on control effectiveness.
* **Exclusions sharpened**: FR excludes data loads, formatting, tagging mechanics, number roll-forwards. GRC excludes evidence collection, certification chasing, sign-off routing.
* **Capability labels**: FR flags Benchmarking and Tie-Out agents; GRC flags the Evidence Analyzer as planned. Keeps Gong output aligned with what the roadmap chapter in each webapp says is safe to promise.


---

## Sustainability

The Sustainability explainer reads `sus-patterns.json` (currently placeholders). Run the archetype → audit → export chain from the original Sustainability Gong thread with `[Sustainability]` in the brackets, then paste the JSON over the placeholder file and set `"placeholder": false`.
