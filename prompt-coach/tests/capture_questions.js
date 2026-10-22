/* node tests/capture_questions.js : writes research/captures/done-when-questions.md (made-up prompts; Strong prompt + questions as the page shows them). */
const fs = require('fs'), path = require('path');
const M = require('../engine/model.js'), W = require('../engine/rewrite.js'), C = require('../engine/classify.js');
const weights = JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/weights.json')));
const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(__dirname, '../engine/cls-weights.json'))));
const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };
const SAMPLES = [
  ['FR', 'Check the Example Co revenue numbers'],
  ['GRC', 'Review the access controls for Example Co'],
  ['SUS', 'Look at the Example Co emissions data']
];
let out = '# Questions list capture\n\nMade-up prompts. Each shows the Strong prompt, then the block under it on the page.\n';
for (const [area, prompt] of SAMPLES) {
  const o = W.coach(prompt, { files: [], detect, ...C.pick(prompt, CLS) });
  out += `\n## ${area}\n\n**Prompt:** ${prompt}\n\n**Strong prompt:** “${o.stages.strong.prompt}”\n\n`;
  out += o.questions.length ? 'To make it even better, tell Workiva AI:\n\n' + o.questions.map((q) => `- ${q.text}`).join('\n') + '\n' : '(no questions shown)\n';
}
const file = path.join(__dirname, '../research/captures/done-when-questions.md');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, out);
console.log('wrote ' + path.relative(process.cwd(), file));
