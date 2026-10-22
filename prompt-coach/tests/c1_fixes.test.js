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
