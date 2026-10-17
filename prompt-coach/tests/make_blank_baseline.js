/* Writes tests/fixtures/rewrites/blank_baseline.json: blank count in the Strong rewrite for every non-strong run
   (each prompt alone and with the matching file), keyed "<file>|<row>|<0/1>".
   Run ONLY while engine/ equals commit 73be350:  node tests/make_blank_baseline.js data/sim_customers.jsonl data/test.jsonl */
const fs = require('fs'), path = require('path');
const M = require('../engine/model.js'), W = require('../engine/rewrite.js'), C = require('../engine/classify.js');
const weights = JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/cls-weights.json'))));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
// same FILES table as customer_check.js (the probes read it the same way)
const src = fs.readFileSync(path.join(__dirname, 'customer_check.js'), 'utf8');
const FILES = eval('(' + src.match(/const FILES = (\{[\s\S]*?\n\});/)[1] + ')');
const out = {};
for (const f of process.argv.slice(2)) {
  fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).forEach((l, i) => {
    const r = JSON.parse(l);
    for (const withFile of [false, true]) {
      const file = withFile ? FILES[r.domain] : null; if (withFile && !file) continue;
      const o = W.coach(r.prompt, { files: file ? [file] : [], detect, ...C.pick(r.prompt, CLS) });
      if (o.grade === 'strong') continue;
      out[path.basename(f) + '|' + i + '|' + (withFile ? 1 : 0)] = (o.stages.strong.prompt.match(/\[[^\]]*\]/g) || []).length;
    }
  });
}
fs.writeFileSync(path.join(__dirname, 'fixtures/rewrites/blank_baseline.json'), JSON.stringify(out));
console.log('wrote', Object.keys(out).length, 'entries');
