/* node --test --test-reporter=tap tests/train_order.test.js : train.js gives the same bytes for any order of its data-file arguments. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const TRAIN = path.join(__dirname, 'train.js');
const WORDS = ['summarize', 'audit', 'report', 'for the committee', 'use only the attached file', 'five bullets', 'flag anything', 'revenue', 'controls', 'draft', 'table', 'tone', 'last year', 'policy memo', 'check'];
function rows(seed, n) {
  let s = seed; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  return Array.from({ length: n }, (_, i) => {
    const o = { prompt: Array.from({ length: 6 }, () => WORDS[(r() * WORDS.length) | 0]).join('. ') + '. ' + seed + '-' + i };
    for (const k of 'SCOPE'.split('')) o[k] = r() < 0.5 ? 1 : 0;
    return o;
  });
}
function fixture(names) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'train-order-'));
  names.forEach((n, i) => fs.writeFileSync(path.join(d, n + '.jsonl'), rows(i + 1, 30).map((x) => JSON.stringify(x)).join('\n') + '\n'));
  return d;
}
function trainBytes(dir, order, tag) {
  const out = path.join(dir, 'out-' + tag + '.json');
  cp.execFileSync(process.execPath, [TRAIN, 'rulefeat', '--tune', '--out', out, ...order.map((n) => path.join(dir, n + '.jsonl'))], { stdio: 'pipe' });
  return fs.readFileSync(out);
}
test('train.js: two data files in either order give identical weights bytes', () => {
  const d = fixture(['train_fr', 'train_grc']);
  assert.deepEqual(trainBytes(d, ['train_fr', 'train_grc'], 'a'), trainBytes(d, ['train_grc', 'train_fr'], 'b'));
});
test('train.js: four named files plus an extra, scrambled, give identical weights bytes', () => {
  const d = fixture(['train_fr', 'train_grc', 'train_sus', 'train_hard', 'train_zz']);
  assert.deepEqual(trainBytes(d, ['train_fr', 'train_grc', 'train_sus', 'train_hard', 'train_zz'], 'a'), trainBytes(d, ['train_zz', 'train_hard', 'train_sus', 'train_grc', 'train_fr'], 'b'));
});
