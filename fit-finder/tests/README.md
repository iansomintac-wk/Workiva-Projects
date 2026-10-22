`node tests/eval.js data/tasks.jsonl data/tasks.jsonl --ids A|B [--show N]`
`node tests/pagetest.js [capture-folder]`: drives dist/fit-finder.html in headless Chrome at 1280 and 375 px (role chips, badges, first try, fuller prompt, How it rates, Coach link, no console errors or sideways scroll) and saves a full-page PNG per width.
data/tasks.jsonl: 120 AI-written task descriptions, blind-labeled by an AI against data/LABELING.md.
Half A was used to tune engine/fit.js; half B is held out. 2026-10-15: A 86.7%, B 75.0% (draft before tuning: 61.7% / 66.7%).
`node tests/synth-score.js <set.jsonl> <gold.jsonl> --top3`: scores a new set and also the right card anywhere in a list of three. It also prints the split: right feature first and rightly none (no feature where none fits).
`node tests/match-frozen.js --base <sha>`: fails if the engine or any id/area/ops/match changed since that commit.
`node tests/sandbox-kit.js --build <dir>` builds the sandbox files and prompt cards; `node tests/sandbox-kit.test.js` tests it. pagetest stays at 98 checks.
`node tests/match-frozen.js --base <sha> --allow ops` (and `fair-guard.js ... --allow ops`) lets card `ops` differ; `node tests/match-frozen.test.js` tests both.
