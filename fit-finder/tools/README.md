# fit-finder/tools

Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative to where you run them). Every script exits non-zero on a problem. `node tools/selftest.js` exercises all of them on `tools/fixtures/` and prints `selftest ok`.

`L` below is the run ledger `<repo root>/.ledger/2026-10-22-fit-finder-bca` (git-ignored; the env var `FF_LEDGER` overrides it, used by the self-test only).

| Script | Arguments | Prints | Exit |
|---|---|---|---|
| `check-set.js` | `<prompts> <gold\|-> <catalogue> [--not-range LO HI]` | `rows N, per area FR a GRC b SUS c GEN d, gold M, not K, unknown cards U` | 1 on 0 rows, a row lacking string `id`/`task`, a repeated id, an `area` not in FR/GRC/SUS/GEN. With gold: a missing or extra gold id, `fit` not good/partial/not, `cards` not an array, a `not` row with cards, a card id not in the catalogue; with `--not-range`, K outside LO..HI |
| `nearcopy.js` | `<fresh> <real dir> [--catalogue <catalogue>]` | `files read F, rows read R, windows W`, `control: hit`, then `hits: none` or `hits: <fresh ids>`. Never prints text | 1 if F, R or W is 0, the positive control misses, or any hit. 5-word windows over every string value of every real row; with `--catalogue` a fresh row also hits on a window shared with any card's `try` |
| `agree.js` | `<frozen> <final>` | `N <n> D <d> agreement <pct> PASS\|FAIL` | 1 if an id set differs, a differing row (fit or sorted cards) lacks `"by":"ian"`, an unchanged row has it, or (N-D)/N < 0.845 (N=40: D <= 6) |
| `card-view.js` | `<catalogue> <out>` | `cards N` | writes `{"useCases":[...]}` with every card minus `match` and `ops` (`try` kept) |
| `label-sheet.js` | `<draft> <card-view> <out>`; or `--verify <sheet> <draft> <catalogue>` | `label-sheet rows N`; or `label-sheet ok` | 1 on bad input; `--verify` rebuilds the sheet from the draft and catalogue and needs a byte-for-byte match |
| `label-handoff.js` | `[--check] <looks file> <sheet> <ian batch json> <catalogue> <out frozen> <out gold>` | `label-handoff ok rows N changed D`, or `STOP: <reason>` | 3 on any `STOP`. `--check` recomputes both outputs in memory and exits 1 unless they equal the files byte for byte |
| `score-once.js` | `<name> <prompts> <gold> [--scorer <path>]` | the scorer's stdout (from `L/score-<name>.out` on a repeat) | the scorer's status. 3 with `STOP: unknown outcome` if `L/score-<name>.started` exists without `.out` |
| `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
| `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
| `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |

## Details

**label-handoff.** The PICK is ONE line of space-separated `<id>=<label>` tokens after a `PICK` marker (on the same line, or the next non-empty line). Labels: a catalogue card id, `none`, `not`. Every sheet id (`### <id> | <area>` headings) appears exactly once. The batch needs a non-empty `words`, a boolean `accepted`, `sheetSha256` equal to the sheet's sha256 (and the sheet must match `L/label-sheet.sha256` if that exists), `changes[].id` in the sheet with a legal `label`, and empty `changes` when `accepted` is true. Frozen rows: `{"id","fit","cards","by":"pm"}` (card id: `good` + `[id]`; `none`: `good` + `[]`; `not`: `not` + `[]`). Gold = frozen with the changes applied and `"by":"ian"` on exactly the changed rows (a change equal to the PM label is ignored).

**score-once.** Runs `node tests/synth-score.js <prompts> <gold>` from `fit-finder/` (or `--scorer`, self-test only) at most once per `<name>`. First call: writes `.started`, runs, writes `.out` atomically (first line `STATUS <n>`, then stdout), prints stdout, exits with the scorer's status. Later calls print the saved stdout and exit with the saved status without running anything. Fresh/holdout/blind lines are copied only from `L/score-<name>.out`.

**keep-check.** Reads `BEFORE-LINE`, `AFTER-LINE`, `OUTCOME`, `REASON` from the evidence doc; R = number after `right feature first `, S = number after `score `. Kept iff R1 >= R0 + 1 and S1 <= S0. REASON must be `none` (kept) or `R gain < 1 (R0 to R1)` / `S rose (S0 to S1)` / `R gain < 1 and S rose (R0 to R1; S0 to S1)`. Git check against the commit whose subject starts `task 11:`: reverted needs `node tests/match-frozen.js --base <sha>` to pass; kept needs it to pass with `--allow ops` and fail without.

**ops-check.** Compares `data/catalogue.json` at `<base sha>` with the working tree: same cards in the same order, every field except `ops` equal, each `ops` starts with the old `ops` (append only), every added value is in `AI_OPS` (`engine/fit.js`, the list `tests/catalogue.test.js` checks), and at least one card changed.
