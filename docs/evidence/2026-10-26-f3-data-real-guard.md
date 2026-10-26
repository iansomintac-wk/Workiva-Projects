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

## Round 2: the two Codex must-fixes (2026-10-26 ~05:40Z, Ian's PC)

The Codex judge of d007e0b (`docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md`) failed it on two must-fixes: inherited `GIT_INDEX_FILE` / `GIT_WORK_TREE` (and similar) make `git ls-files` print nothing and exit 0, and the case-sensitive `data/real` pathspec lets `data/REAL/...` past on Windows.

Fix in `data-real-guard.js`: git runs as `git -C <fit-finder> ls-files -z` with `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` removed from its environment (any case of the name), and the output is filtered with `/(^|\/)data\/real(\/|$)/i`, so a `data/real` segment in any case, at any depth under `fit-finder/`, fails.

Tests added first to the selftest (13 new checks, 20 in all):
- checks 6-15: with the fake file tracked, each of the five env vars set to point at a second throwaway repo (or an empty index path), guard and gate must still fail naming `data/real/fake.jsonl`;
- checks 17-19: `fit-finder/data/REAL/x.jsonl` put straight into the index with `git update-index --cacheinfo` (so the test does not depend on the disk's case rules) must fail guard and gate, and pass again once removed.

Red against the old guard (each new check run alone in a scratch copy): `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE` and the `data/REAL` case each got `exit 0: data-real-guard ok`. `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` did not hide the file even before the fix; their checks stay as regression guards, not proof of the fix.

Green after the fix:
```
## data-real-guard-selftest
data-real-guard-selftest ok (20 checks)
## gate-selftest
gate-selftest ok
## data-real-guard on this checkout
data-real-guard ok
```

## Round 3: the two must-fixes from Codex judge round 2 (2026-10-26 ~05:50Z, Ian's PC)

`docs/evidence/2026-10-26-f3-fit-finder-codex-judge-r2.md` (judge of 3c059b4) found the round-1 fixes sound, and two new must-fixes:

1. An accidental `git init` inside `fit-finder/` makes `git -C fit-finder` read the new, empty index. Fix: after `ls-files`, the guard runs `git rev-parse --show-toplevel` (same cleaned env) and fails unless the real path of the root it found is fit-finder's parent (compared case-insensitively on Windows). A linked worktree still passes, because its root is the worktree folder. Running the guard CLI from anywhere but `fit-finder/` now fails closed.
2. The selftest's own setup git commands inherited GIT_* overrides and ignored exit codes. Fix: its `git()` helper drops every `GIT_*` variable and stops the test on any non-zero exit.

Tests first:
- New checks 16-17: with the fake file tracked, `git init` inside the fixture's `fit-finder/` must make the guard and the gate fail with `git found repo root ...`. Red before the guard fix: `nested repo guard: want exit 1 ..., got 0: data-real-guard ok`.
- Selftest leak, red before the helper fix: `GIT_INDEX_FILE=<scratch>/leak-index node tools/data-real-guard-selftest.js` gave `FAIL: tracked guard: ... got 0: data-real-guard ok` and created the scratch index (the fixture's `git add` went there). After: the same command and `GIT_WORK_TREE=<scratch> ...` both print `ok (22 checks)` and no scratch index is created.

Green after both fixes:
```
data-real-guard-selftest ok (22 checks)
gate-selftest ok
data-real-guard ok            (this worktree, run from fit-finder/)
trackedReal(<main checkout>/fit-finder): ok, tracked data/real count 0
```
No Codex judge has been run on this round yet.
