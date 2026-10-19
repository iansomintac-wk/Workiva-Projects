/* node tests/synth-score.test.js
   synth-score must score a good pair and fail closed (exit 2, nothing on stdout) on every bad input. */
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const script = path.join(__dirname, 'synth-score.js');
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/catalogue.json'), 'utf8'));
const card = cat.useCases[0].id;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synth-score-'));
let n = 0, fails = 0;
const text = (rows) => rows.map((r) => (typeof r === 'string' ? r : JSON.stringify(r))).join('\n') + '\n';
const run = (prompts, gold) => {
  const p = path.join(dir, 'p' + n + '.jsonl'), g = path.join(dir, 'g' + n + '.jsonl');
  fs.writeFileSync(p, text(prompts)); fs.writeFileSync(g, text(gold));
  return spawnSync(process.execPath, [script, p, g], { encoding: 'utf8' });
};
const ok = (name, cond, detail) => { n++; if (!cond) { fails++; console.log('FAIL ' + name + (detail ? ': ' + detail : '')); } };
const closed = (name, r, why) => ok(name, r.status === 2 && r.stdout === '' && r.stderr.includes(why), `exit ${r.status} stdout "${r.stdout}" stderr "${r.stderr.trim()}"`);
const P = [{ id: 'T1', task: 'zzqx vvkw' }, { id: 'T2', task: 'zzqx vvkw jjrp' }];
const G = [{ id: 'T1', fit: 'good', cards: [card], by: 'model', conf: 'high' }, { id: 'T2', fit: 'not', cards: [], by: 'model', conf: 'low' }];

const r = run(P, G);
ok('scores a good pair', r.status === 0 && /^first card right: 0 of 1 that fit; wrong card 0 \(\); no card where one fits 1 \(T1\); card on a not-a-fit prompt 0 \(\); fit agreement \d+ of 2; score 1\n$/.test(r.stdout), `exit ${r.status} out "${r.stdout}" err "${r.stderr.trim()}"`);
const u = spawnSync(process.execPath, [script], { encoding: 'utf8' });
closed('usage error', u, 'usage');
closed('duplicate prompt id', run([P[0], P[0]], G), 'duplicate prompt id');
closed('duplicate gold id', run(P, [G[0], G[0], G[1]]), 'duplicate gold id');
closed('gold lacks a prompt id', run(P, [G[0]]), 'ids differ');
closed('gold has an extra id', run(P, [...G, { ...G[1], id: 'T3' }]), 'ids differ');
closed('same count, different ids', run(P, [G[0], { ...G[1], id: 'T9' }]), 'ids differ');
closed('malformed json line', run(P, [G[0], '{not json']), 'malformed gold row');
closed('prompt row without task', run([P[0], { id: 'T2' }], G), 'malformed prompt row');
closed('bad fit value', run(P, [G[0], { ...G[1], fit: 'maybe' }]), 'malformed gold row');
closed('cards not an array', run(P, [{ ...G[0], cards: card }, G[1]]), 'malformed gold row');
closed('unknown card id', run(P, [{ ...G[0], cards: ['NOPE'] }, G[1]]), 'unknown card');
closed('cards on a not-a-fit row', run(P, [G[0], { ...G[1], cards: [card] }]), 'not-a-fit');
closed('empty files', run([], []), 'no rows');
fs.rmSync(dir, { recursive: true, force: true });
console.log(fails ? `synth-score tests FAILED: ${fails} of ${n}` : `synth-score tests pass: ${n}`);
process.exit(fails ? 1 : 0);
