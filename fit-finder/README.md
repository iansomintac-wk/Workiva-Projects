# Workiva AI Fit Finder (offline)

Shows a customer where Workiva AI fits in their own work. Describe a task (or attach a close
checklist, test plan or calendar) and every step is marked "Workiva AI" or "stays with you", with
an overall fit and a starter prompt to paste into the Prompt Coach or Workiva AI. No AI service,
no uploads; file readers are shared with the Prompt Coach.

The rule comes from the Workiva AI explainer: quick wins are tasks that are repetitive and
text-heavy (reading, comparing, checking, summarizing, drafting, rewriting). Judgment and
sign-off, exact calculation, work in other systems and chasing people stay with a person.

```sh
node tests/build.js                                               # -> dist/fit-finder.html (~40 KB)
node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids B      # held-out accuracy
```

| File | What it is |
|---|---|
| `engine/fit.js` | Rates a task: fit, recurring or not, steps (who keeps each), starter prompt; `scan()` rates every line of a checklist |
| `web/template.html` | The page; `tests/build.js` inlines the engine and `../prompt-coach/engine/files.js` |
| `data/LABELING.md` | The rubric: good / partial / not a fit, operations, blockers |
| `data/tasks.jsonl` | 120 AI-written task descriptions, blind-labeled by an AI |

## How good it is (2026-10-15)
Half A (60 tasks) tuned the rules; half B is held out. Fit agreement: A 86.7%, **B 75.0%**
(the draft written before seeing data: 61.7% / 66.7%). Good-vs-not mix-ups on B: 2 of 60. It
misses that a task recurs about a third of the time, so the page asks "Does it come back every
period?" instead of only guessing.

Not yet measured: real customers' tasks and real checklists. Workiva capability claims are left
out on purpose until they are confirmed (support.workiva.com was not reachable from the build
environment); the page describes what the AI does in plain words.
