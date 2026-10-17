# Catalogue re-check after the sandbox pilot (2026-10-16)

The sandbox pilot's Part 1 (`2026-10-16-sandbox-pilot.md`) raised three claims to re-check: Benchmarking
was not seen under that name, and "AI suggestions" (document Tools menu) and "Agent Studio" (left nav)
exist while the catalogue leaves out Suggestions and press-release agent names. Ian picked "Check the AI
feature claims (Recommended)", then "Also update the catalogue" (option labels, question tool).

Method: three Haiku research helpers (low effort) searched the Support Center; the HTML pages return 403,
so every page below was read through the Zendesk API (`/api/v2/help_center/en-us/articles/<id>.json`).
I re-fetched each quoted page and matched the quotes against the raw body text; all quotes below are
from that re-fetch, not from the helpers' summaries.

## Result: no claim on the page changes

| Claim | Source (updated) | Verdict |
|---|---|---|
| Benchmarking is a Workiva AI workflow (entitlement) | S7 "Workiva AI workflows" (2026-10-13); S12 "Preview Benchmarking Insights for Intelligent Finance" (2026-06-23) | Holds |
| Suggestions stays left out | "Use and create suggestion types", article 46356859919252 (2026-09-14) | Holds; reason dated |
| Agent Studio is not a catalogue feature | No Support Center page; trade-press copy of the Amplify release (2026-09-15) | Left out, now with a reason |

**Benchmarking.** S7 lists it under "Available workflows": "Benchmarking Compare the disclosures in your
financial report against those of peer companies." and "Benchmarking helps you identify gaps, align your
language and structure with industry norms, and reduce risk during the drafting and review phases of your
reporting cycle." S7 tags the Tie-out assistant "(Preview)" and Benchmarking not. S12 (older): "We are
looking for a small group of users to provide feedback and test this feature." and, after the early access
programme, "you will need to subscribe to the Advanced tier of your solution". S12 says Benchmarking
Insights "upgrades Intelligent Finance with an agentic chat experience that compares your financial
disclosures to peer groups", which matches the sandbox's Intelligent Finance panel ("Compare the content,
language, and structure of my disclosure to my peers"). Not checked: whether the sandbox's Workflows menu
lists Benchmarking (the pilot did not open it; my guess, untested).

**Suggestions.** The only page: "This feature is currently available to select customers as part of the
Workiva AI suggestions early access preview." / "The preview feature is provided to you for technical
testing and evaluation only from now to September 14th, 2026." / "If your team is interested in using this
feature, please contact your Customer Success Manager." A search for "AI suggestions" found no page
updated after 14 September 2026 that says it ended, was extended or became generally available. The
sandbox showing it may mean previews are on there; not confirmed.

**Agent Studio.** Support Center search: no page. Trade press (cpapracticeadvisor.com, 2026-09-15,
fetched and matched): "Workiva introduced Agent Studio, a landmark platform capability that empowers users
to quickly build, customize, and deploy AI agents in Workiva's trusted platform." and "Agent Studio
enables users to automate sophisticated manual business processes without writing any code." It builds
agents rather than doing one of the jobs the page rates, so no use case points to it. Availability: not
found (the helper's "advanced solution tiers" came from press and is not confirmed).

## Helpers

| Helper | Model | Tokens | Tool uses | Wall time |
|---|---|---|---|---|
| Benchmarking | Haiku, low | 15,988 | 5 | 29 s |
| AI suggestions | Haiku, low | 17,259 | 6 | 63 s |
| Agent Studio | Haiku, low | 18,827 | 5 | 41 s |
