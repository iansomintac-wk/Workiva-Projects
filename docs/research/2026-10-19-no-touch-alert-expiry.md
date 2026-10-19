# How "no contact" alerts end in customer-success tools

Date 2026-10-19. Asked by Ian in the gone-quiet talk ("would targeted deep research inform a better decision") before he ruled how long a gone-quiet row stays. Research helper (Haiku, 11 tool uses, 59 s). Tags: [checked] = the helper read the page and quotes it; [read] = summarised from a page, not re-checked; [unconfirmed] = could not reach.

## Findings

- Gainsight rule-based CTAs stay open until someone closes them. The Create CTA action "triggers a CTA only if the previously triggered CTA is closed"; "Create CTA once in X days" blocks new CTAs for X days. No auto-expiry is described. [checked] https://support.gainsight.com/gainsight_nxt/03Rules_Engine/Rules_Engine_(Horizon_Experience)/Set_Up_Rules_Action_Types/Create_CTA_Action_Type
- Closing is a separate rule matching fields or CTA ID on the rule's schedule; not timed. [checked] https://support.gainsight.com/gainsight_nxt/03Rules_Engine/Rules_Engine_(Horizon_Experience)/Set_Up_Rules_Action_Types/Close_CTA_Action_Type
- Deleted CTAs re-trigger on the next run. [read] https://communities.gainsight.com/ideas/how-do-you-make-a-rule-not-refire-if-a-cta-is-already-closed-but-still-meets-the-rule-criteria-4334
- Gainsight users added auto-close and a 90-day overdue report to fight CTA fatigue. [read] https://communities.gainsight.com/conversations/14047
- HubSpot re-enrols only when a contact leaves and re-meets criteria (a conflicting community report exists). [read] https://community.hubspot.com/t/re-enrollment-based-on-property-update/11062
- Opsgenie: when a snooze ends the alert reopens and notifies as new. [read] https://docs.opsgenie.com/docs/snooze
- Repeated alerts lower acceptance (Ancker 2017, clinical, not customer success). [read] https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5387195/
- ChurnZero, Totango, Vitally, Planhat: no readable doc on inactivity alert expiry or snooze return. [unconfirmed]

## What it settled

Nothing decisively. The industry default (Gainsight) is "open until acted on"; overload is handled by users adding auto-close. Snooze-end behaviour in a pager tool supports firing on the day a pause ends. Ian then picked: hand-off rows stay until contact; pause-return rows last the 14 days the tracker already keeps a pause return (no new stored field).
