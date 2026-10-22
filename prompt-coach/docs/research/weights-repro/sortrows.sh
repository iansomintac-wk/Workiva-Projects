# Breaker trial: train.js sorts rows by prompt (order-independent). Two file orders must give identical bytes.
T=/c/Users/teasp/.claude/jobs/73f0cb40/tmp
for o in a b; do D=$T/s/sort-$o; rm -rf $D; cp -r $T/c/${1:-cuefree} $D
  sed -i '18s#$# rows.sort((x, y) => (x.prompt < y.prompt ? -1 : x.prompt > y.prompt ? 1 : 0)); // order-independent#' $D/tests/train.js; done
sed -n 18p $T/s/sort-a/tests/train.js | cut -c100-260
cd $T/s/sort-a && node tests/train.js rulefeat --tune data/train_fr.jsonl data/train_grc.jsonl data/train_hard.jsonl data/train_sus.jsonl | grep -o 'tuned.*'
cd $T/s/sort-b && node tests/train.js rulefeat --tune data/train_sus.jsonl data/train_hard.jsonl data/train_grc.jsonl data/train_fr.jsonl | grep -o 'tuned.*'
cmp $T/s/sort-a/engine/weights.json $T/s/sort-b/engine/weights.json && echo "SORTED: two orders byte-identical"
cd $T/s/sort-a && node tests/train.js rulefeat --tune-sure data/train_fr.jsonl data/train_grc.jsonl data/train_hard.jsonl data/train_sus.jsonl | grep -o 'sure cut.*'
cd $T/s/sort-b && node tests/train.js rulefeat --tune-sure data/train_sus.jsonl data/train_hard.jsonl data/train_grc.jsonl data/train_fr.jsonl | grep -o 'sure cut.*'
cmp $T/s/sort-a/engine/weights.json $T/s/sort-b/engine/weights.json && echo "SORTED+sure: two orders byte-identical"
cd $T/s/sort-a && node --test --test-reporter=tap tests/rewrite_unit.test.js > ru.tap 2>&1
echo "sorted: ru $(grep -c '^ok ' ru.tap)/$(grep -c '^not ok ' ru.tap) $(grep '^not ok ' ru.tap | cut -c1-70 | tr '\n' '|') $(node tests/eval.js rulefeat data/test.jsonl 2>&1 | grep -o 'GRADE acc=[0-9.]*')"
