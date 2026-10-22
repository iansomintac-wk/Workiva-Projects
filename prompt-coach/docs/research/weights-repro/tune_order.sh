# --tune with the README file order (fr grc sus hard) per copy
T=/c/Users/teasp/.claude/jobs/73f0cb40/tmp
for n in ${@:-dfe a46 cuefree head}; do
  ( cd $T/c/$n && node tests/train.js rulefeat --tune --out $T/out/ord-$n.json data/train_fr.jsonl data/train_grc.jsonl data/train_sus.jsonl data/train_hard.jsonl | grep tuned | sed "s/^/$n: /" )
done
