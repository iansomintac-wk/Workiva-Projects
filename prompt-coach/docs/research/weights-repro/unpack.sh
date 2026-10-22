T=/c/Users/teasp/.claude/jobs/73f0cb40/tmp
for n in dfe a46p a46 cuefree head; do
  rm -rf $T/c/$n; mkdir -p $T/c/$n && tar -xf $T/$n.tar -C $T/c/$n
  test -e $T/c/$n/data/done_when_strong.jsonl && echo "LEAK $n"
  echo "$n: $(ls $T/c/$n/data | tr '\n' ' ')"
done
