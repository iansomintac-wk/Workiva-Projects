# Guarded throwaway copy of prompt-coach. The fresh set is never copied.
# usage: bash mkcopy.sh <src prompt-coach dir> <dest dir> <r1|train-only>
#   r1:         r1 file renamed into the fresh slot (data/done_when_strong.jsonl) in the copy only
#   train-only: also deletes data/test*.jsonl, data/sim_customers.jsonl, data/done_when_strong_r1.jsonl
# exit 9 + "FRESH SET LEAKED" if the fresh file is in the copy before the rename, or a held-out file survives in train-only mode.
SRC="${1:?src}"; D="${2:?dest}"; MODE="${3:?r1|train-only}"
case $MODE in r1|train-only) ;; *) echo "mkcopy: mode must be r1 or train-only" >&2; exit 2;; esac
rm -rf "$D"; mkdir -p "$D" || exit 2
(cd "$SRC" && tar --exclude=./data/done_when_strong.jsonl --exclude=./dist --exclude=./real-eval -cf - .) | (cd "$D" && tar -xf -) || exit 2
test ! -e "$D/data/done_when_strong.jsonl" || { echo "FRESH SET LEAKED"; exit 9; }
if [ "$MODE" = r1 ]; then
  mv "$D/data/done_when_strong_r1.jsonl" "$D/data/done_when_strong.jsonl" || exit 2
else
  rm -f "$D"/data/test*.jsonl "$D/data/sim_customers.jsonl" "$D/data/done_when_strong_r1.jsonl"
  ls "$D"/data | grep -q -E 'test|sim_customers|done_when_strong' && { echo "FRESH SET LEAKED (held-out file survived)"; exit 9; }
fi
exit 0
