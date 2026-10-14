# GRC evidence audit — strict DIRECT test

Source: "GRC Workflow Archetypes: Repeatable AI Use Cases" (Gong output, 7 archetypes). Only quotes with a call citation were testable. Frequency claims such as "appeared in 5+ conversations (named accounts withheld…)" have no verbatim quote attached, so they are not counted as DIRECT evidence.

## Part 1 — quote-level audit

| # | Archetype | Cited quote | Was | Now | Justification | Operation | Pain / effort / repetition stated |
|---|---|---|---|---|---|---|---|
| 1 | Duplicate Hunter | "We manually review every control description to find duplicates and overlaps" (GRC contact A, 3:33:58) | DIRECT | **DIRECT** | First person, names the exact task (read every description, find overlaps) and says "manually". | READ · COMPARE · CLASSIFY | YES |
| 2 | Framework Mapper | "We need to map our controls to a new framework and identify gaps" (GRC contact B, 37:50) | DIRECT | **DIRECT** | Names the cognitive task (map, find gaps) in the customer's words; no effort or frequency stated. | MAP · CHECK | NO |
| 3 | Control Drafter | "We spend time making sure control descriptions are clear and not duplicative" (GRC contact C, 10:22) | DIRECT | **INFERRED** | Supports reviewing and tightening existing descriptions, not drafting new controls from narratives as the archetype claims. | REWRITE · CHECK | YES |
| 4 | Evidence Validator | "We have to validate the completeness and accuracy of evidence" (GRC contact D, 30:30) | DIRECT | **DIRECT** | First person, specific check task, "have to" signals obligation and effort. | CHECK · READ | YES |
| 5 | Issue Writer | "We want AI to provide testing summaries and conclusions" (GRC contact D, 1:02:33) | DIRECT | **INFERRED** | A feature request, not a description of current manual work; and "conclusions" is exactly what we exclude. | SUMMARIZE (implied) | NO |
| 6 | Flowchart Translator | "We struggle to keep process narratives and flowcharts in sync" / "using Visio because Workiva flowcharts are clunky" (GRC contact E, 7:58) | DIRECT | **INFERRED** | Describes a sync/maintenance pain and a nearby product complaint; translating narrative to diagram is interpreted, not stated. | — | YES |
| 7 | Test Step Builder | "We have to define detailed test steps and attributes for each control" (GRC contact F, 41:31) | DIRECT | **DIRECT** | First person, names the drafting task, "each control" signals repetition. | DRAFT | YES |

Alternate trigger phrases in each archetype (joined with "or") carry no citation and were treated as paraphrase, not evidence.

## Part 2 — recalculated strength

| Archetype | Old | New | Customers still counting |
|---|---|---|---|
| Duplicate Hunter | High (5+) | **CUSTOMER-SPECIFIC** | 1 (cited call, GRC contact A) |
| Framework Mapper | High (4+) | **CUSTOMER-SPECIFIC** | 1 (cited call, GRC contact B) |
| Evidence Validator | High (6+) | **CUSTOMER-SPECIFIC** | 1 (cited call, GRC contact D) |
| Test Step Builder | Medium (3+) | **CUSTOMER-SPECIFIC** | 1 (cited call, GRC contact F) |
| Control Drafter | High (4+) | **HYPOTHESIS** | 0 |
| Issue Writer | High (5+) | **HYPOTHESIS** | 0 |
| Flowchart Translator | Medium-High (6+) | **HYPOTHESIS** | 0 |

## To upgrade any of these

Re-run Gong on the named accounts for each archetype and ask for one verbatim, first-person customer quote per account that names the task. Two more quotes moves an archetype to STRONG. Paste them into `grc-patterns.json` under `quotes`.
