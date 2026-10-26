# F3 (Fit Finder half): the done check fails when data/real is tracked

studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.

## What changed

- `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
- `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
- `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
- `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.

Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.

## Test run (commands from `fit-finder/`)

Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.

Red 2, guard written but not called by gate-check (the join):
```
data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
exit 1
```

Green, after the call in gate-check:
```
## data-real-guard-selftest
data-real-guard-selftest ok (7 checks)
exit 0
## gate-selftest
gate-selftest ok
exit 0
## data-real-guard on this checkout
data-real-guard ok
exit 0
```

The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.
