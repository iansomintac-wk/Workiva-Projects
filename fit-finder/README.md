# Workiva AI Fit Finder (offline)

Shows a customer where Workiva AI fits in their own work. Describe a task (or attach a close
checklist, test plan or calendar) and every step is marked "Workiva AI" or "stays with you", with
an overall fit, the closest sourced Workiva AI use case (which feature, whether it is included or
needs an entitlement, what stays with you, and links to the Workiva support pages), and a starter
prompt to paste into the Prompt Coach or Workiva AI. No AI service, no uploads; file readers are
shared with the Prompt Coach.

The rule comes from the Workiva AI explainer: quick wins are tasks that are repetitive and
text-heavy (reading, comparing, checking, summarizing, drafting, rewriting). Judgment and
sign-off, exact calculation, work in other systems and chasing people stay with a person.

```sh
node tests/build.js                                               # -> dist/fit-finder.html (~40 KB)
node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B      # held-out accuracy
node tests/catalogue.test.js                                      # every use case sourced; matching
```

| File | What it is |
|---|---|
| `engine/fit.js` | Rates a task: fit, recurring or not, steps (who keeps each), starter prompt; `scan()` rates every line of a checklist; `match()` finds the closest catalogue use cases |
| `data/catalogue.json` | The only source of Workiva AI claims on the page: 6 support pages, 16 features, 18 use cases, 2 left out and why |
| `web/template.html` | The page; `tests/build.js` inlines the catalogue, the engine and `../prompt-coach/engine/files.js` |
| `data/LABELING.md` | The rubric: good / partial / not a fit, operations, blockers |
| `data/tasks.jsonl` | 120 AI-written task descriptions, blind-labeled by an AI |

## How good it is (2026-10-15)
Half A (60 tasks) tuned the rules; half B is held out. Fit agreement: A 86.7%, **B 75.0%**
(the draft written before seeing data: 61.7% / 66.7%). Good-vs-not mix-ups on B: 2 of 60. It
misses that a task recurs about a third of the time, so the page asks "Does it come back every
period?" instead of only guessing. Unchanged after adding "rationalize", "translate" and
"review the evidence", and no longer reading "owners upload" as the person uploading.

## Workiva AI claims (2026-10-15)
Every feature and use case on the page comes from `data/catalogue.json`, which cites six Workiva
support pages Ian saved from his browser (the build environment cannot reach workiva.com). Each
use case says whether Workiva names a feature for that job ("named") or it is the general
chat-with-files ability applied to it ("assumed", shown as "try it on one file first"), and
whether the feature is included with Workiva AI or belongs to a named solution ("check your
entitlement"). Left out: pre-assurance anomaly review of sustainability figures (no feature
named) and named AI agents (press release and release notes not seen).

Of the 30 held-out tasks that fit, 14 (47%) reach a specific use case; the rest get "ask Workiva
AI chat about your file". So the page stays "describe your task" rather than "pick from a
feature list". Not yet measured: real customers' tasks and real checklists.
