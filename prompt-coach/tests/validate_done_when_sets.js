/* Validate the done-when test sets: strong-30 (data/done_when_strong.jsonl) and weak-12 (research/live-tests/weak12).
   node tests/validate_done_when_sets.js  -> one line per failed rule, then VALID or INVALID (exit 1 when invalid). */
const fs = require('fs'), path = require('path');
const M = require('../engine/model.js'), W = require('../engine/rewrite.js'), C = require('../engine/classify.js');
const D = path.join(__dirname, '../data'), WK = path.join(__dirname, '../research/live-tests/weak12');
const weights = JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/cls-weights.json'))));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
const readJsonl = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const fails = [];
const fail = (m) => fails.push(m);

let strong = [];
try { strong = readJsonl(path.join(D, 'done_when_strong.jsonl')); } catch (e) { fail('strong-30: cannot read done_when_strong.jsonl'); }
if (strong.length !== 30) fail(`strong-30: ${strong.length} rows, want 30`);
for (const d of ['FR', 'GRC', 'SUS', 'GEN']) { const n = strong.filter((r) => r.domain === d).length; if (n < 5) fail(`strong-30: domain ${d} has ${n} rows, want >= 5`); }
const badDom = strong.filter((r) => !['FR', 'GRC', 'SUS', 'GEN'].includes(r.domain)).length;
if (badDom) fail(`strong-30: ${badDom} rows with a domain outside FR/GRC/SUS/GEN`);
strong.forEach((r, i) => {
  const bad = ['S', 'C', 'O', 'P', 'E'].filter((k) => r[k] !== 1);
  if (bad.length) fail(`strong-30 row ${i + 1}: letters not 1: ${bad.join('')}`);
  if (r.stacked !== 0) fail(`strong-30 row ${i + 1}: stacked is not 0`);
});

let prompts = [], key = {};
try { prompts = readJson(path.join(WK, 'prompts.json')); } catch (e) { fail('weak-12: prompts.json missing or unreadable'); }
try { key = readJson(path.join(WK, 'answer_key.json')); } catch (e) { fail('weak-12: answer_key.json missing or unreadable'); }
if (prompts.length !== 12) fail(`weak-12: ${prompts.length} prompts, want 12`);
for (const d of ['FR', 'GRC', 'SUS']) { const n = prompts.filter((p) => p.domain === d).length; if (n !== 4) fail(`weak-12: domain ${d} has ${n} prompts, want 4`); }
for (const p of prompts) {
  let g = null;
  try { g = W.coach(p.prompt, { files: [], detect, ...C.pick(p.prompt, CLS) }).grade; } catch (e) { g = 'error: ' + e.message; }
  if (g !== 'weak') fail(`weak-12 ${p.id}: grades ${g}, want weak`);
  const k = key[p.id];
  if (!k) fail(`weak-12 ${p.id}: no answer_key entry`);
  else for (const f of ['found', 'mustNotClaim', 'job']) if (!k[f] || (Array.isArray(k[f]) && !k[f].length)) fail(`weak-12 ${p.id}: key missing ${f}`);
  if (!p.file || !fs.existsSync(path.join(WK, 'fixtures', p.file))) fail(`weak-12 ${p.id}: fixture ${p.file} missing`);
}

// near-copy check against train and test
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const tri = (x) => { const w = x.toLowerCase().match(/[a-z0-9]+/g) || []; const s = new Set(); for (let i = 0; i + 3 <= w.length; i++) s.add(w.slice(i, i + 3).join(' ')); return s; };
const jac = (a, b) => { if (!a.size || !b.size) return 0; let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n); };
const ref = [];
for (const f of fs.readdirSync(D).filter((f) => /^train_.*\.jsonl$/.test(f)).concat('test.jsonl')) for (const r of readJsonl(path.join(D, f))) ref.push({ f, n: norm(r.prompt).replace(/ /g, ''), t: tri(r.prompt) });
const mine = strong.map((r, i) => ({ id: `strong-30 row ${i + 1}`, p: r.prompt })).concat(prompts.map((p) => ({ id: `weak-12 ${p.id}`, p: p.prompt })));
for (const m of mine) {
  const n = norm(m.p).replace(/ /g, ''), t = tri(m.p);
  const hit = ref.find((r) => r.n === n || jac(t, r.t) >= 0.6);
  if (hit) fail(`${m.id}: copy of a row in ${hit.f}`);
}

for (const f of fails) console.log(f);
console.log(fails.length ? 'INVALID' : 'VALID');
process.exit(fails.length ? 1 : 0);
