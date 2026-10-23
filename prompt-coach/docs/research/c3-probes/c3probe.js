// C3 probe: coach output for weak-12 with each fixture attached. Counts only to stdout; full text to a file.
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2];
const M = require(ROOT + '/engine/model.js'), W = require(ROOT + '/engine/rewrite.js'), C = require(ROOT + '/engine/classify.js');
const weights = JSON.parse(fs.readFileSync(ROOT + '/engine/weights.json'));
const CLS = C.unpack(JSON.parse(fs.readFileSync(ROOT + '/engine/cls-weights.json')));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, prob: r.prob, sure: r.sure, d: r.rules }; };
const drafts = require(ROOT + '/research/live-tests/weak12/drafts.json');
const out = [];
const words = (s) => (s.match(/\S+/g) || []).length;
for (const d of drafts) {
  const fx = d.fixture;
  const file = fx.type === 'xlsx'
    ? { name: fx.file, kind: 'Excel', sheets: [{ name: fx.sheet || 'Sheet1', headers: (fx.rows || [[]])[0].map(String) }], headings: [], slides: [], periods: [], text: (fx.rows || []).map((r) => r.join(' ')).join('\n') }
    : { name: fx.file, kind: 'Word', sheets: [], headings: (fx.headings || (fx.sections || []).map((s) => s.heading || s.title || '')).filter(Boolean), slides: [], periods: [], text: JSON.stringify(fx).slice(0, 4000) };
  const o = W.coach(d.prompt, { files: [file], detect, ...C.pick(d.prompt, CLS) });
  const b = o.stages.better.prompt, s = o.stages.strong.prompt;
  const blanks = (t) => (t.match(/\[[^\]]*\]/g) || []).length;
  console.log([d.id, 'grade=' + o.grade, 'better.w=' + words(b), 'strong.w=' + words(s), 'blanks=' + (blanks(b) + blanks(s)), 'fileInStrong=' + s.includes(fx.file.replace(/\.[^.]+$/, '')), 'questions=' + ((o.questions || []).length)].join(' '));
  out.push({ id: d.id, original: d.prompt, grade: o.grade, better: b, strong: s, questions: o.questions || null, keys: Object.keys(o) });
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
