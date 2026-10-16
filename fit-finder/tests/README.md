`node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A|B [--show N]`
`node tests/pagetest.js [capture-folder]`: drives dist/fit-finder.html in headless Chrome at 1280 and 375 px (role chips, badges, first try, fuller prompt, How it rates, Coach link, no console errors or sideways scroll) and saves a full-page PNG per width.
data/tasks.jsonl: 120 AI-written task descriptions, blind-labeled by an AI against data/LABELING.md.
Half A was used to tune engine/fit.js; half B is held out. 2026-10-15: A 86.7%, B 75.0% (draft before tuning: 61.7% / 66.7%).
