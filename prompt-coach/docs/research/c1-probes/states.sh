# Re-measure C1 states on the new baseline. r1 copies only (mkcopy.sh r1): the fresh set is never copied.
# usage: bash states.sh <prompt-coach dir> <cue commit> [states...]   states: ctl A B C
SRC="$1"; CUE="$2"; shift 2
J="$(cygpath -m "$CLAUDE_JOB_DIR")/tmp/states"; mkdir -p "$J"
REPO=$(cd "$SRC/.." && pwd)
for v in "${@:-ctl A B C}"; do for v in $v; do
  D="$J/$v"; L="$J/$v.log"; : > "$L"
  bash "$SRC/docs/research/c1-probes/mkcopy.sh" "$SRC" "$D" r1 || { echo "mkcopy exit $?" >> "$L"; continue; }
  case $v in A|B|C) git -C "$REPO" show "$CUE:prompt-coach/engine/rules.js" > "$D/engine/rules.js";; esac
  case $v in
    B) (cd "$D" && node tests/train.js rulefeat --tune data/train_*.jsonl && node tests/train.js rulefeat --tune-sure data/train_*.jsonl) >> "$L" 2>&1;;
    C) (cd "$D" && node tests/train.js rulefeat --tune-sure data/train_*.jsonl) >> "$L" 2>&1;;
  esac
  (cd "$D" && node tests/done_when.js --only C1,C2,C4) >> "$L" 2>&1
  (cd "$D" && node tests/eval.js rulefeat data/test.jsonl | grep GRADE) >> "$L" 2>&1
  (cd "$D" && node --test --test-reporter=tap tests/rewrite_unit.test.js 2>&1 | grep -E '^# (pass|fail)|^not ok') >> "$L"
  (cd "$D" && node "$SRC/docs/research/c1-probes/c1probe3.js" "$D") >> "$L" 2>&1
  node -e "const w=require('$D/engine/weights.json');console.log('thr',JSON.stringify(w.thr),'sure',JSON.stringify(w.sure))" >> "$L" 2>&1
  echo "== $v done" >> "$L"
done; done
