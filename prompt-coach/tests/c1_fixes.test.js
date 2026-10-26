const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

test('train.js sure splice survives a trailing newline', () => {
  const src = fs.readFileSync(path.join(__dirname, 'train.js'), 'utf8').split('\n');
  const line = src.find((l) => /fs\.writeFileSync\(out, txt\.replace\(/.test(l));
  const m = line.match(/txt\.replace\((.*)\)\);\s*$/);
  assert.ok(m, 'replacement expression not found');
  const base = fs.readFileSync(path.join(ROOT, 'engine/weights.json'), 'utf8').replace(/,"sure":{[^}]*}/, '').replace(/\s+$/, '');
  const cut = { S: 0.99, C: 0.65, O: 0.55, P: 0.2, E: 0.95 };
  for (const tail of ['\n', '  \n']) {
    const txt = base + tail;
    const res = new Function('txt', 'cut', 'return txt.replace(' + m[1] + ');')(txt, cut);
    const parsed = JSON.parse(res);
    assert.deepStrictEqual(parsed.sure, cut);
  }
});

test('judgeTap rejects pass 0', () => {
  const { judgeTap } = require('./c5_gate.js');
  assert.strictEqual(judgeTap('# pass 0\n# fail 0\n')[0], false);
  assert.strictEqual(judgeTap('# pass 3\n# fail 0\n')[0], true);
});

test('live rewrite_unit gate rejects pass 0 and accepts pass 77', () => {
  const { gates } = require('./c5_gate.js');
  const g = gates.find((x) => x[0] === 'rewrite_unit');
  assert.ok(g, 'rewrite_unit gate is exported');
  assert.strictEqual(g[2]({ out: '# pass 0\n# fail 0\n' })[0], false);
  assert.strictEqual(g[2]({ out: '# pass 77\n# fail 0\n' })[0], true);
});

test('done_when --only rejects unknown or empty set', () => {
  for (const v of ['ZZ', '']) {
    const r = spawnSync(process.execPath, ['tests/done_when.js', '--only', v], { cwd: ROOT, encoding: 'utf8' });
    assert.strictEqual(r.status, 2);
    assert.match(r.stderr, /needs a known set/);
  }
});

test('evidence line names FR3 and GEN29 as not sure misses', () => {
  const t = fs.readFileSync(path.join(ROOT, '../docs/evidence/2026-10-22-prompt-coach-done-when.md'), 'utf8');
  assert.ok(!/had their text changed by the Better step/.test(t));
  assert.match(t, /FR3 and GEN29[^\n]*not sure/);
});

test('c5_gate eval is a floor at 0.856, not an exact match', () => {
  const { gates } = require('./c5_gate.js');
  const judge = gates.find((g) => g[0] === 'eval')[2];
  assert.strictEqual(judge({ out: 'GRADE acc=0.866\n' })[0], true);
  assert.strictEqual(judge({ out: 'GRADE acc=0.856\n' })[0], true);
  assert.strictEqual(judge({ out: 'GRADE acc=0.855\n' })[0], false);
  assert.strictEqual(judge({ out: 'no grade here\n' })[0], false);
});

// SoD-conflict fix (spec 2026-10-23): "conflict" inside these nouns is not a compare-two-sources cue.
{
  const R = require('../engine/rules.js'), M = require('../engine/model.js'), W = require('../engine/rewrite.js'), C = require('../engine/classify.js');
  const weights = JSON.parse(fs.readFileSync(path.join(ROOT, 'engine/weights.json')));
  const CLS = C.unpack(JSON.parse(fs.readFileSync(path.join(ROOT, 'engine/cls-weights.json'))));
  const detect = (p) => { const r = M.predict(p, weights, { mode: weights.mode }); return { on: r.on, d: r.rules }; };

  test('SoD conflicts report does not get the compare-two-sources job', () => {
    const p = 'Please review the attached SoD conflicts report.';
    const o = W.coach(p, { files: [], detect, ...C.pick(p, CLS) });
    const s = o.stages.strong.prompt;
    assert.ok(!/does not match/.test(s), s);
    assert.ok(!/both locations and both values/.test(s), s);
  });

  test('hyphenated SoD-conflicts is not consistency in pick()', () => {
    assert.notStrictEqual(C.pick('Review the SoD-conflicts report.', CLS).intent, 'consistency');
    assert.strictEqual(W.intentOf(R.normalize('review the segregation-of-duties-conflict listing'), false, true), null);
  });

  test('conflict of interest is not consistency in pick()', () => {
    assert.notStrictEqual(C.pick('Flag any conflict of interest in the vendor list.', CLS).intent, 'consistency');
  });

  test('other conflict cues stay consistency', () => {
    assert.strictEqual(C.pick('Check the attached report for conflicts between the totals and the detail.', CLS).intent, 'consistency');
    assert.strictEqual(W.intentOf(R.normalize('the figures conflict with the summary'), false, true), 'consistency');
  });

  test('SoD and segregation of duties conflicts give no intent when strict', () => {
    assert.strictEqual(W.intentOf(R.normalize('review the sod conflicts report'), false, true), null);
    assert.strictEqual(W.intentOf(R.normalize('segregation of duties conflicts'), false, true), null);
  });
}
