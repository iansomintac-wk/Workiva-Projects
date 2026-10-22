# Probe 4: sure reproducibility, then rewrite_unit + eval per weights state. Copies only.
T=/c/Users/teasp/.claude/jobs/73f0cb40/tmp
GLOB="data/train_fr.jsonl data/train_grc.jsonl data/train_hard.jsonl data/train_sus.jsonl"
READ="data/train_fr.jsonl data/train_grc.jsonl data/train_sus.jsonl data/train_hard.jsonl"
cd $T/c/cuefree
for o in GLOB READ; do cp engine/weights.json $T/out/sure-$o.json; node tests/train.js rulefeat --tune-sure --out $T/out/sure-$o.json ${!o} | grep 'sure cut' | sed "s/^/shipped w, $o order: /"; done
# states: name copy weights-source(empty = as shipped)
state() { n=$1; src=$2; w=$3
  rm -rf $T/s/$n; mkdir -p $T/s; cp -r $T/c/$src $T/s/$n; cd $T/s/$n
  if [ -n "$w" ]; then cp $T/out/$w engine/weights.json; node tests/train.js rulefeat --tune-sure $READ | grep 'sure cut' | sed "s/^/$n /"; fi
  node --test --test-reporter=tap tests/rewrite_unit.test.js > $T/out/ru-$n.tap 2>&1
  echo "$n: rewrite_unit $(grep -c '^ok ' $T/out/ru-$n.tap) ok, $(grep -c '^not ok ' $T/out/ru-$n.tap) not ok: $(grep '^not ok ' $T/out/ru-$n.tap | cut -c1-90 | tr '\n' '|')"
  echo "$n: $(node tests/eval.js rulefeat data/test.jsonl 2>&1 | grep -o 'GRADE acc=[0-9.]*')"
}
state ship-cuefree cuefree ""
state ship-head head ""
state ord-cuefree cuefree ord-cuefree.json
state ord-head head ord-head.json
