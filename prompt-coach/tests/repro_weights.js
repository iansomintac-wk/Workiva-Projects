// Retrains weights into a temp file with the two README commands and byte-compares
// engine/weights.json. Never writes under engine/.
//   exit 0: REPRO OK <sha256-prefix>     exit 1: REPRO FAIL first difference: <where>
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const committedPath = path.join(root, 'engine', 'weights.json');
const LETTERS = ['S', 'C', 'O', 'P', 'E'];

function firstDifference(a, b) {
  for (const k of LETTERS) if (a.thr[k] !== b.thr[k]) return `${k} thr committed=${a.thr[k]} retrained=${b.thr[k]}`;
  for (const k of LETTERS) if (a.sure[k] !== b.sure[k]) return `${k} sure committed=${a.sure[k]} retrained=${b.sure[k]}`;
  for (const k of LETTERS) if (a.w[k].b !== b.w[k].b) return `${k} b committed=${a.w[k].b} retrained=${b.w[k].b}`;
  for (const k of LETTERS) {
    const av = a.w[k].v, bv = b.w[k].v;
    const keys = [...new Set([...Object.keys(av), ...Object.keys(bv)])].sort((x, y) => x - y);
    for (const i of keys) if (av[i] !== bv[i]) return `${k} v[${i}] committed=${av[i]} retrained=${bv[i]}`;
  }
  return 'byte order/format only';
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'repro-'));
let code = 1;
try {
  const out = path.join(tmp, 'weights.json');
  // plain readdir order stands in for the shell glob: order must not matter
  const files = fs.readdirSync(path.join(root, 'data'))
    .filter(f => /^train_.*\.jsonl$/.test(f)).map(f => 'data/' + f);
  for (const mode of ['--tune', '--tune-sure']) {
    execFileSync(process.execPath, ['tests/train.js', 'rulefeat', mode, '--out', out, ...files],
      { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
  }
  const a = fs.readFileSync(committedPath);
  const b = fs.readFileSync(out);
  if (a.equals(b)) {
    console.log('REPRO OK ' + crypto.createHash('sha256').update(b).digest('hex').slice(0, 12));
    code = 0;
  } else {
    console.log('REPRO FAIL first difference: ' + firstDifference(JSON.parse(a), JSON.parse(b)));
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
process.exit(code);
