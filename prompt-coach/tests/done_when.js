/* Done-when measurement for the prompt coach (C1, C2, C4 of the done-when spec). Measures only; never tunes.
   node tests/done_when.js [--only C1,C2,C4]
   One line per check ending PASS or MISS. Exit 0 all bars met, 1 a bar missed, 2 script error (thrown error,
   missing engine file, zero rows or zero runs read). Same detect/CLS/FILES setup as make_blank_baseline.js. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const K = ['S', 'C', 'O', 'P', 'E'];

// "Shown no changes needed": the coach sets noChanges (strong, one ask, every letter above its sure cut-off).
const noChangesNeeded = (o) => o.noChanges === true;

function main() {
  const args = process.argv.slice(2);
  const oi = args.indexOf('--only');
  const only = oi >= 0 ? new Set((args[oi + 1] || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)) : null;
  if (only && (!only.size || [...only].some((s) => !['C1', 'C2', 'C4'].includes(s)))) {
    console.error('done_when: --only needs a known set'); process.exit(2);
  }
  const want = (c) => !only || only.has(c);

  const M = require('../engine/model.js'), W = require('../engine/rewrite.js'), C = require('../engine/classify.js');
  const weights = JSON.parse(fs.readFileSync(path.join(ROOT, 'engine/weights.json')));
  const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(ROOT, 'engine/cls-weights.json'))));
  const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, prob: r.prob, sure: r.sure, d: r.rules }; };
  // same FILES table as customer_check.js
  const src = fs.readFileSync(path.join(__dirname, 'customer_check.js'), 'utf8');
  const FILES = eval('(' + src.match(/const FILES = (\{[\s\S]*?\n\});/)[1] + ')');
  const coach = (prompt, file) => W.coach(prompt, { files: file ? [file] : [], detect, ...C.pick(prompt, CLS) });
  const readRows = (rel) => {
    const rows = fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
    if (!rows.length) throw new Error(`zero rows read from ${rel}`);
    return rows;
  };
  const pct = (a, b) => (100 * a / b).toFixed(1);

  let missed = 0;
  const report = (line, ok) => { if (!ok) missed++; console.log(`${line} ${ok ? 'PASS' : 'MISS'}`); };

  if (want('C1')) {
    const rel = 'data/done_when_strong.jsonl';
    if (!fs.existsSync(path.join(ROOT, rel))) console.log(`C1 SKIP ${rel} not present`);
    else {
      const rows = readRows(rel);
      const n = rows.filter((r) => {
        const o = coach(r.prompt), t = r.prompt.trim();
        return noChangesNeeded(o) && o.stages.strong.prompt === t && o.stages.better.prompt === t;
      }).length;
      report(`C1 ${n} of ${rows.length} (bar 27 of 30)`, n >= 27);
    }
  }

  if (want('C2')) {
    for (const [set, rel] of [['test', 'data/test.jsonl'], ['sim', 'data/sim_customers.jsonl']]) {
      const non = readRows(rel).filter((r) => !K.every((k) => r[k] === 1) || r.stacked === 1);
      if (!non.length) throw new Error(`zero non-strong rows in ${rel}`);
      const n = non.filter((r) => noChangesNeeded(coach(r.prompt))).length;
      report(`C2 set=${set} no-changes ${n} of ${non.length} non-strong = ${pct(n, non.length)}% (bar <= 5%)`, n / non.length <= 0.05);
    }
  }

  if (want('C4')) {
    const prompts = [...readRows('data/test.jsonl'), ...readRows('data/sim_customers.jsonl')];
    const w12 = path.join(ROOT, 'research/live-tests/weak12/prompts.json');
    let w12note = 'weak12 not present';
    if (fs.existsSync(w12)) {
      const w = JSON.parse(fs.readFileSync(w12, 'utf8'));
      if (!w.length) throw new Error('zero prompts in weak12/prompts.json');
      prompts.push(...w); w12note = `weak12 ${w.length}`;
    }
    const blanks = (s) => (s.match(/\[[^\]]*\]/g) || []).length;
    let m = 0, b = 0, s = 0, withBlank = 0;
    for (const r of prompts) {
      for (const file of [null, FILES[r.domain]]) {
        if (file === undefined) continue;
        const o = coach(r.prompt, file);
        const nb = blanks(o.stages.better.prompt), ns = blanks(o.stages.strong.prompt);
        m++; b += nb; s += ns; if (nb + ns) withBlank++;
      }
    }
    if (!m) throw new Error('zero runs in C4');
    report(`C4 blanks=${b + s} (better=${b}, strong=${s}) across ${m} outputs (${prompts.length} prompts, ${w12note}), runs with a blank ${pct(withBlank, m)}% (bar 0)`, b + s === 0);
  }

  return missed ? 1 : 0;
}

let code;
try { code = main(); } catch (e) { console.log(`ERROR ${e.message}`); code = 2; }
process.exit(code);
