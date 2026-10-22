/* node tools/selftest.js   runs every tool on fixtures with known answers; prints "selftest ok" or the first failure. Reads no real data. */
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { spawnSync } = require('child_process');
const here = __dirname, fx = path.join(here, 'fixtures');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-selftest-'));
const T = (n) => path.join(tmp, n);
const wr = (n, s) => { fs.writeFileSync(T(n), s); return T(n); };
const jl = (rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
const run = (script, args, env) => {
  const r = spawnSync(process.execPath, [path.join(here, script), ...args], { encoding: 'utf8', env: Object.assign({}, process.env, { FF_LEDGER: T('ledger') }, env || {}) });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const fail = (m) => { console.log('selftest FAIL: ' + m); process.exit(1); };
const expect = (label, r, code, text) => {
  if (r.code !== code) fail(label + ': exit ' + r.code + ', wanted ' + code + ' | ' + r.out.trim());
  if (text && !r.out.includes(text)) fail(label + ': output lacks "' + text + '" | ' + r.out.trim());
};
fs.mkdirSync(T('ledger'));
const cat = path.join(fx, 'cat.json'), prompts = path.join(fx, 'prompts.jsonl'), gold = path.join(fx, 'gold.jsonl');

// check-set
expect('check-set good', run('check-set.js', [prompts, gold, cat]), 0, 'rows 4, per area FR 1 GRC 1 SUS 1 GEN 1, gold 4, not 2, unknown cards 0');
expect('check-set no gold', run('check-set.js', [prompts, '-', cat]), 0, 'rows 4');
expect('check-set range ok', run('check-set.js', [prompts, gold, cat, '--not-range', '2', '3']), 0);
expect('check-set range bad', run('check-set.js', [prompts, gold, cat, '--not-range', '3', '5']), 1);
expect('check-set bad row', run('check-set.js', [wr('p1.jsonl', jl([{ id: 'F1', area: 'GEN' }])), '-', cat]), 1);
expect('check-set bad area', run('check-set.js', [wr('p2.jsonl', jl([{ id: 'F1', task: 't', area: 'XX' }])), '-', cat]), 1);
expect('check-set dup id', run('check-set.js', [wr('p3.jsonl', jl([{ id: 'F1', task: 't', area: 'GEN' }, { id: 'F1', task: 'u', area: 'GEN' }])), '-', cat]), 1);
expect('check-set empty', run('check-set.js', [wr('p4.jsonl', ''), '-', cat]), 1);
expect('check-set unknown card', run('check-set.js', [prompts, wr('g1.jsonl', jl([{ id: 'F1', fit: 'good', cards: ['nope'] }, { id: 'F2', fit: 'good', cards: ['fr-narr'] }, { id: 'F3', fit: 'not', cards: [] }, { id: 'F4', fit: 'not', cards: [] }])), cat]), 1, 'unknown cards 1');
expect('check-set not with cards', run('check-set.js', [prompts, wr('g2.jsonl', jl([{ id: 'F1', fit: 'good', cards: ['gen-translate'] }, { id: 'F2', fit: 'good', cards: ['fr-narr'] }, { id: 'F3', fit: 'not', cards: ['fr-narr'] }, { id: 'F4', fit: 'not', cards: [] }])), cat]), 1);
expect('check-set missing gold id', run('check-set.js', [prompts, wr('g3.jsonl', jl([{ id: 'F1', fit: 'good', cards: [] }])), cat]), 1);
expect('check-set bad fit', run('check-set.js', [prompts, wr('g4.jsonl', jl([{ id: 'F1', fit: 'great', cards: [] }, { id: 'F2', fit: 'good', cards: [] }, { id: 'F3', fit: 'not', cards: [] }, { id: 'F4', fit: 'not', cards: [] }])), cat]), 1);

// agree
const base = [];
for (let i = 1; i <= 40; i++) base.push({ id: 'G' + i, fit: 'good', cards: ['fr-narr', 'gen-translate'], by: 'pm' });
const frozen = wr('fz.jsonl', jl(base));
const frozenRows = base.map((r) => ({ id: r.id, fit: r.fit, cards: r.cards, by: 'pm' }));
expect('agree none', run('agree.js', [frozen, wr('fin0.jsonl', jl(base))]), 0, 'N 40 D 0 agreement 100.0% PASS');
const flip = (n, by) => base.map((r, i) => i < n ? { id: r.id, fit: 'not', cards: [], by } : r);
expect('agree 6', run('agree.js', [frozen, wr('fin6.jsonl', jl(flip(6, 'ian')))]), 0, 'N 40 D 6 agreement 85.0% PASS');
expect('agree 7', run('agree.js', [frozen, wr('fin7.jsonl', jl(flip(7, 'ian')))]), 1, 'FAIL');
expect('agree missed tag', run('agree.js', [frozen, wr('fin-m.jsonl', jl(flip(1, 'pm')))]), 1);
expect('agree stray tag', run('agree.js', [frozen, wr('fin-s.jsonl', jl(base.map((r, i) => i === 0 ? Object.assign({}, r, { by: 'ian' }) : r)))]), 1);
expect('agree card order only', run('agree.js', [frozen, wr('fin-o.jsonl', jl(base.map((r) => Object.assign({}, r, { cards: ['gen-translate', 'fr-narr'] }))))]), 0, 'D 0');
expect('agree id set', run('agree.js', [frozen, wr('fin-i.jsonl', jl(base.slice(1)))]), 1);
void frozenRows;

// nearcopy
const realDir = path.join(fx, 'real');
expect('nearcopy clean', run('nearcopy.js', [prompts, realDir]), 0, 'hits: none');
const planted = wr('np.jsonl', jl([{ id: 'P1', area: 'GEN', task: 'Say beta gamma delta epsilon zeta now' }, { id: 'P2', area: 'GEN', task: 'nothing alike here at all friend' }]));
const nc = run('nearcopy.js', [planted, realDir]);
expect('nearcopy planted', nc, 1, 'hits: P1');
if (!nc.out.includes('control: hit') || nc.out.includes('P2') || /beta/.test(nc.out)) fail('nearcopy output wrong: ' + nc.out);
const emptyDir = T('emptyreal'); fs.mkdirSync(emptyDir);
expect('nearcopy zero files', run('nearcopy.js', [prompts, emptyDir]), 1);
expect('nearcopy catalogue leak', run('nearcopy.js', [wr('nl.jsonl', jl([{ id: 'L1', area: 'GEN', task: 'we translate the board memo every quarter ok' }])), realDir, '--catalogue', cat]), 1, 'hits: L1');
expect('nearcopy catalogue clean', run('nearcopy.js', [prompts, realDir, '--catalogue', cat]), 0, 'hits: none');

// card-view
const cv = T('cv.json');
expect('card-view', run('card-view.js', [cat, cv]), 0, 'cards 2');
const cvj = JSON.parse(fs.readFileSync(cv, 'utf8'));
const cards = Array.isArray(cvj) ? cvj : cvj.useCases;
if (cards.length !== 2 || 'match' in cards[0] || 'ops' in cards[0] || !cards[0].try) fail('card-view content');

// label-sheet + label-handoff
const draft = wr('draft.jsonl', jl([{ id: 'F1', area: 'GEN', task: 'Translate the memo.' }, { id: 'F2', area: 'FR', task: 'Write the narrative.' }, { id: 'F3', area: 'SUS', task: 'Book a flight.' }]));
const sheet = T('sheet.md');
expect('label-sheet', run('label-sheet.js', [draft, cv, sheet]), 0);
expect('label-sheet verify', run('label-sheet.js', ['--verify', sheet, draft, cat]), 0, 'label-sheet ok');
fs.writeFileSync(T('sheet-bad.md'), fs.readFileSync(sheet, 'utf8').replace('Write the narrative.', 'Something else.'));
expect('label-sheet verify bad', run('label-sheet.js', ['--verify', T('sheet-bad.md'), draft, cat]), 1);
const sha = crypto.createHash('sha256').update(fs.readFileSync(sheet)).digest('hex');
const looks = wr('looks.md', 'notes\nPICK\nF1=gen-translate F2=none F3=not\nCHECKED: sheet\n');
const batch = (o) => wr('batch.json', JSON.stringify(Object.assign({ sheetSha256: sha, words: 'ok', accepted: true, changes: [] }, o)));
const fz = T('hz.frozen.jsonl'), gd = T('hz.gold.jsonl');
const ho = (looksF, batchF) => run('label-handoff.js', [looksF || looks, sheet, batchF || batch(), cat, fz, gd]);
expect('handoff accepted', ho(), 0, 'label-handoff ok rows 3 changed 0');
const fzRows = fs.readFileSync(fz, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
if (JSON.stringify(fzRows[2]) !== JSON.stringify({ id: 'F3', fit: 'not', cards: [], by: 'pm' }) || JSON.stringify(fzRows[1]) !== JSON.stringify({ id: 'F2', fit: 'good', cards: [], by: 'pm' })) fail('frozen rows');
expect('handoff check', run('label-handoff.js', ['--check', looks, sheet, batch(), cat, fz, gd]), 0);
expect('handoff changes', ho(null, batch({ accepted: false, changes: [{ id: 'F1', label: 'not' }, { id: 'F2', label: 'none' }] })), 0, 'changed 1');
const gRows = fs.readFileSync(gd, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
if (gRows[0].by !== 'ian' || gRows[0].fit !== 'not' || gRows[1].by !== 'pm') fail('gold rows after changes');
expect('handoff check2', run('label-handoff.js', ['--check', looks, sheet, T('batch.json'), cat, fz, gd]), 0);
fs.appendFileSync(gd, ' ');
expect('handoff check edited', run('label-handoff.js', ['--check', looks, sheet, T('batch.json'), cat, fz, gd]), 1);
expect('handoff missing batch', ho(null, T('nope.json')), 3, 'STOP');
expect('handoff empty words', ho(null, batch({ words: '' })), 3, 'STOP');
expect('handoff wrong sha', ho(null, batch({ sheetSha256: 'ab'.repeat(32) })), 3, 'STOP');
expect('handoff accepted with changes', ho(null, batch({ changes: [{ id: 'F1', label: 'not' }] })), 3, 'STOP');
expect('handoff bad change id', ho(null, batch({ accepted: false, changes: [{ id: 'F9', label: 'not' }] })), 3, 'STOP');
expect('handoff missing looks', ho(T('nolooks.md')), 3, 'STOP');
expect('handoff missing id', ho(wr('l2.md', 'PICK\nF1=gen-translate F2=none\n')), 3, 'STOP');
expect('handoff duplicate id', ho(wr('l3.md', 'PICK\nF1=gen-translate F2=none F3=not F1=not\n')), 3, 'STOP');
expect('handoff unknown label', ho(wr('l4.md', 'PICK\nF1=gen-translate F2=bogus F3=not\n')), 3, 'STOP');
fs.writeFileSync(T('ledger/label-sheet.sha256'), 'cd'.repeat(32) + '\n');
expect('handoff ledger sha', ho(), 3, 'STOP');
fs.unlinkSync(T('ledger/label-sheet.sha256'));

// score-once
const counter = T('counter.txt'), scorer = path.join(fx, 'scorer.js');
const so = (name, env) => run('score-once.js', [name, prompts, gold, '--scorer', scorer], Object.assign({ SCORER_COUNTER: counter }, env));
expect('score-once first', so('st1'), 0, 'fixture line right 1 score 2');
expect('score-once second', so('st1'), 0, 'fixture line right 1 score 2');
if (fs.readFileSync(counter, 'utf8').trim().split('\n').length !== 1) fail('score-once ran the scorer twice');
fs.writeFileSync(T('ledger/score-st2.started'), 'x');
expect('score-once started only', so('st2'), 3, 'STOP: unknown outcome');
expect('score-once status kept', so('st3', { SCORER_STATUS: '4' }), 4);
expect('score-once status replay', so('st3'), 4, 'fixture line');

// keep-check rule
const kc = require('./keep-check.js');
const dec = (r0, s0, r1, s1) => kc.decide({ R: r0, S: s0 }, { R: r1, S: s1 });
if (dec(5, 10, 6, 10).outcome !== 'kept' || dec(5, 10, 6, 10).reason !== 'none') fail('keep-check kept');
if (dec(5, 10, 5, 10).outcome !== 'reverted' || dec(5, 10, 5, 10).reason !== 'R gain < 1 (5 to 5)') fail('keep-check R+0');
if (dec(5, 10, 7, 11).outcome !== 'reverted' || dec(5, 10, 7, 11).reason !== 'S rose (10 to 11)') fail('keep-check S rise');
if (dec(5, 10, 5, 11).reason !== 'R gain < 1 and S rose (5 to 5; 10 to 11)') fail('keep-check both');
expect('keep-check no file', run('keep-check.js', [T('none.md')]), 1);

// ops-check
const oc = require('./ops-check.js');
const mk = (ops) => ({ useCases: [{ id: 'a', area: 'FR', match: 'm', task: 't', ops }, { id: 'b', area: 'GEN', match: 'm', task: 't', ops: ['DRAFT'] }] });
const AI = ['DRAFT', 'COMPARE', 'SUMMARISE'];
if (oc.compare(mk(['DRAFT']), mk(['COMPARE', 'DRAFT']), AI).ok) fail('ops-check accepted a prepended step');
const ok = oc.compare(mk(['DRAFT']), mk(['DRAFT', 'COMPARE']), AI);
if (!ok.ok || ok.changed !== 1) fail('ops-check rejected an appended step: ' + ok.reason);
if (oc.compare(mk(['DRAFT']), mk(['DRAFT']), AI).ok) fail('ops-check accepted no change');
if (oc.compare(mk(['DRAFT']), mk(['DRAFT', 'BOGUS']), AI).ok) fail('ops-check accepted a non-AI op');
const mc = mk(['DRAFT', 'COMPARE']); mc.useCases[1].match = 'z';
if (oc.compare(mk(['DRAFT']), mc, AI).ok) fail('ops-check accepted a match change');

fs.rmSync(tmp, { recursive: true, force: true });
console.log('selftest ok');
