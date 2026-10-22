# Throwaway probe: control retrain vs spike cues. Fresh set excluded; r1 renamed into C1's slot in the copy only.
# usage: bash probe.sh <prompt-coach dir> [variants...]
# Copies and logs go to $PROBE_TMP (set it to your job's tmp folder); never inside the repo.
J="${PROBE_TMP:?set PROBE_TMP to a scratch folder}"; SRC="$1"; shift
for v in "${@:-control spike}"; do for v in $v; do
  D="$J/$v"; rm -rf "$D"; mkdir -p "$D"
  (cd "$SRC" && tar --exclude=./data/done_when_strong.jsonl --exclude=./dist --exclude=./real-eval -cf - .) | (cd "$D" && tar -xf -)
  test ! -e "$D/data/done_when_strong.jsonl" || { echo "FRESH SET LEAKED"; exit 9; }
  mv "$D/data/done_when_strong_r1.jsonl" "$D/data/done_when_strong.jsonl"
  case $v in spike*) node "$SRC/docs/research/c1-probes/addcues.js" "$D/engine/rules.js";; esac
  s=$(date +%s)
  (cd "$D" && node tests/train.js rulefeat --tune data/train_*.jsonl > "$J/$v.train.log" 2>&1 && node tests/train.js rulefeat --tune-sure data/train_*.jsonl >> "$J/$v.train.log" 2>&1; echo "train exit $? $(( $(date +%s)-s ))s" >> "$J/$v.train.log")
  (cd "$D" && node tests/done_when.js --only C1,C2,C4 > "$J/$v.dw.log" 2>&1; echo "dw exit $?" >> "$J/$v.dw.log")
  (cd "$D" && node "$SRC/docs/research/c1-probes/c1probe3.js" "$D" > "$J/$v.p3.log" 2>&1)
  echo "== $v"; grep -E "tuned thresholds|sure cut-offs|exit" "$J/$v.train.log" | cut -c1-200
  grep -E "^C[124]|exit" "$J/$v.dw.log" | cut -c1-200; cut -c1-220 "$J/$v.p3.log"
  grep -o '"sure":{[^}]*}' "$D/engine/weights.json" || echo "NO SURE IN WEIGHTS"
done; done
