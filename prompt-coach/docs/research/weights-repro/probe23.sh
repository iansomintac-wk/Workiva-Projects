# Probes 2+3: retrain with --tune twice per copy; compare runs to each other and to the shipped weights.
T=/c/Users/teasp/.claude/jobs/73f0cb40/tmp
mkdir -p $T/out
for n in ${@:-dfe a46p a46 cuefree head}; do
  ( cd $T/c/$n && for r in 1 2; do
      s=$(date +%s); node tests/train.js rulefeat --tune --out $T/out/$n.$r.json data/train_*.jsonl > $T/out/$n.$r.log 2>&1; echo "$n run$r exit $? $(( $(date +%s) - s ))s"
    done )
done
