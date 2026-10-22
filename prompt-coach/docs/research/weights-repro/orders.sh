# Robustness: every order of the 4 train files at the cue-free code -> thr, sure, rewrite_unit, eval. Copies only.
T=/c/Users/teasp/.claude/jobs/73f0cb40/tmp
R=$T/out/orders.txt; : > $R
for p in $(node -e 'const f=["fr","grc","hard","sus"];const P=a=>a.length<2?[a]:a.flatMap((x,i)=>P([...a.slice(0,i),...a.slice(i+1)]).map(p=>[x,...p]));console.log(P(f).map(p=>p.join(",")).join(" "))'); do
  D=$T/s/o-$p; rm -rf $D; cp -r $T/c/cuefree $D; cd $D
  F=$(echo $p | sed 's/\([a-z][a-z]*\)/data\/train_\1.jsonl/g; s/,/ /g')
  thr=$(node tests/train.js rulefeat --tune $F | grep -o 'tuned thresholds [^ ]*' | cut -d' ' -f3)
  sure=$(node tests/train.js rulefeat --tune-sure $F | grep -o 'sure cut-offs [^ ]*' | cut -d' ' -f3)
  node --test --test-reporter=tap tests/rewrite_unit.test.js > ru.tap 2>&1
  ev=$(node tests/eval.js rulefeat data/test.jsonl 2>&1 | grep -o 'GRADE acc=[0-9.]*')
  echo "$p | thr $thr | sure $sure | ru $(grep -c '^ok ' ru.tap)/$(grep -c '^not ok ' ru.tap) $(grep '^not ok ' ru.tap | cut -d' ' -f3 | tr '\n' ',') | $ev" >> $R
  cd $T; rm -rf $D
done
echo DONE >> $R
