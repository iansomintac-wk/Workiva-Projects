# Trial: test 13 pins Context off via the existing forced() helper; run rewrite_unit in each scratch copy
T=/c/Users/teasp/.claude/jobs/73f0cb40/tmp
for s in ship-head-f13 ord-head-f13 ship-cuefree-f13; do
  cd $T/s/$s
  sed -i '153s#const o = run(row.prompt);#const o = W.coach(row.prompt, { files: [], detect: forced({ C: false }), ...C.pick(row.prompt, CLS) });#' tests/rewrite_unit.test.js
  sed -n 153p tests/rewrite_unit.test.js | cut -c1-80
  node --test --test-reporter=tap tests/rewrite_unit.test.js > $T/out/ru-$s.tap 2>&1
  echo "$s: $(grep -c '^ok ' $T/out/ru-$s.tap) ok, $(grep -c '^not ok ' $T/out/ru-$s.tap) not ok $(grep '^not ok ' $T/out/ru-$s.tap | cut -c1-80)"
done
