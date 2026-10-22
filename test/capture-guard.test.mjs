// Capture guard (Task 9): right account (containing pane), nothing on top, no blank band; tools seed lastExportedAt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
const G = await import('../tools/lib/capture-guard.mjs');

const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
// rows: array of {filter, bytes:Buffer} (bytes already filtered); 8-bit RGB
const makePngRaw = (w, rows) => {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(rows.length, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.concat(rows.map(r => Buffer.concat([Buffer.from([r.filter]), r.bytes])));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
};
const W = 8;
const makePng = pix => makePngRaw(W, pix.map(p => ({ filter: 0, bytes: p })));
const rowOf = seed => Buffer.from(Array.from({ length: W * 3 }, (_, i) => (seed * 37 + i * 11) & 255));
const blank = Buffer.alloc(W * 3, 255);
const OK = { nameIn: true, topOk: true, backdrops: 0 };

test('a png with a 1150-row blank band reports it and fails as blank (the control: current tools never checked)', () => {
  const rows = [...Array.from({ length: 300 }, (_, i) => rowOf(i + 1)), ...Array.from({ length: 1150 }, () => blank)];
  const png = makePng(rows);
  assert.ok(G.pngBlankRun(png).maxRun >= 1150);
  assert.match(G.evaluateGuard(OK, png).join(' '), /blank/);
  assert.equal(G.MAX_BLANK_PX, 120);
});

test('a varied png has maxRun <= 2 and passes', () => {
  const png = makePng(Array.from({ length: 400 }, (_, i) => rowOf(i + 1)));
  const r = G.pngBlankRun(png);
  assert.ok(r.maxRun <= 2); assert.equal(r.height, 400); assert.equal(r.width, W);
  assert.deepEqual(G.evaluateGuard(OK, png), []);
});

test('wrong account, covered target and a second backdrop each fail', () => {
  const png = makePng(Array.from({ length: 50 }, (_, i) => rowOf(i + 1)));
  assert.match(G.evaluateGuard({ ...OK, nameIn: false }, png, { account: 'Orion' }).join(' '), /account|Orion/);
  assert.match(G.evaluateGuard({ ...OK, topOk: false }, png).join(' '), /on top|covered|topOk/);
  assert.match(G.evaluateGuard({ ...OK, backdrops: 1 }, png).join(' '), /backdrop/);
});

test('a Paeth (filter 4) row decodes the same as the same pixels with filter 0', () => {
  const rows = Array.from({ length: 6 }, (_, i) => rowOf(i + 1));
  rows[3] = rows[2];                                   // two identical rows so maxRun is a real number
  const bpp = 3;
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  const filtered = rows.map((cur, y) => {
    const prev = y ? rows[y - 1] : Buffer.alloc(cur.length);
    return { filter: 4, bytes: Buffer.from(cur.map((v, i) => (v - paeth(i >= bpp ? cur[i - bpp] : 0, prev[i], i >= bpp ? prev[i - bpp] : 0)) & 255)) };
  });
  const a = G.pngBlankRun(makePngRaw(W, filtered)), b = G.pngBlankRun(makePng(rows));
  assert.deepEqual(a, b); assert.equal(a.maxRun, 2);
});

test('sub, up and average filters decode too', () => {
  const rows = Array.from({ length: 5 }, (_, i) => rowOf(i + 3)); rows[4] = rows[3];
  const bpp = 3;
  const enc = (f, cur, prev) => Buffer.from(cur.map((v, i) => { const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i];
    return (v - (f === 1 ? a : f === 2 ? b : Math.floor((a + b) / 2))) & 255; }));
  const filtered = rows.map((cur, y) => { const f = [1, 2, 3][y % 3]; return { filter: f, bytes: enc(f, cur, y ? rows[y - 1] : Buffer.alloc(cur.length)) }; });
  assert.deepEqual(G.pngBlankRun(makePngRaw(W, filtered)), G.pngBlankRun(makePng(rows)));
});

test('the three capture tools use the guard, seed lastExportedAt and never click the backup nag cancel', () => {
  for (const f of ['tools/l11-csat-panel.mjs', 'tools/d2-prep-panel.mjs', 'tools/d3-prep-panel.mjs']) {
    const s = read(f);
    assert.ok(s.includes('guardShot('), f + ' guardShot(');
    assert.ok(s.includes('seedExported('), f + ' seedExported(');
    assert.ok(/from '\.\/lib\/capture-guard\.mjs'/.test(s), f + ' import');
    assert.ok(!s.includes('#confirm-cancel'), f + ' #confirm-cancel');
    assert.ok(!s.includes("Page.captureScreenshot"), f + ' takes its own screenshot');
  }
});

test('the guard module imports only node: modules and never names port 8790', () => {
  const s = read('tools/lib/capture-guard.mjs');
  for (const m of s.matchAll(/^\s*import[^;]*?from\s+'([^']+)'/gm)) assert.ok(m[1].startsWith('node:'), m[1]);
  assert.ok(!s.includes('8790'));
});

test('guardJs checks the containing pane, not the target own text', () => {
  const js = G.guardJs('document.body', 'Orion Semiconductor', 'c_1');
  assert.ok(js.includes("closest('.day-pane, .day-step, .modal, .todo-item, [data-v13-desk-body]')"));
  assert.ok(js.includes('dayHolds') && js.includes('dayStep'));
  assert.ok(!js.includes('target.textContent.includes('));
  assert.ok(js.includes('scope.textContent.includes('));
  assert.ok(js.includes('elementFromPoint') && js.includes('.modal-backdrop'));
});

test('seedExported sets DATA.lastExportedAt and saves', async () => {
  let src = '';
  await G.seedExported({ ev: async s => { src = s; return true; } }, '2026-10-21');
  assert.equal(src, "DATA.lastExportedAt='2026-10-21'; saveData(); true");
});
