// Dev tooling (not part of the bundle): capture guard shared by every capture tool (Task 9, 1.1).
// A shot must (a) show the intended account (checked on the containing pane), (b) have nothing on top of the target,
// (c) have no blank band. A failing shot THROWS: a bad capture is never written as good. Imports node: modules only.
import { inflateSync } from 'node:zlib';
import { appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Longest run of identical pixel rows allowed. Whitespace between panel sections is well below this; a blank band is hundreds of px.
export const MAX_BLANK_PX = 120;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Decode an 8-bit RGB/RGBA non-interlaced PNG; return the longest run of consecutive identical rows.
export function pngBlankRun(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png');
  let pos = 8, width = 0, height = 0, depth = 0, ctype = 0, interlace = 0; const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('latin1', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const bpp = ctype === 2 ? 3 : ctype === 6 ? 4 : 0;
  if (depth !== 8 || !bpp || interlace) throw new Error(`unsupported png (depth ${depth}, colour type ${ctype}, interlace ${interlace})`);
  const raw = inflateSync(Buffer.concat(idat)), stride = width * bpp;
  if (raw.length < height * (stride + 1)) throw new Error('png data truncated');
  let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride), run = 1, maxRun = height ? 1 : 0;
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0; let p = 0;
      if (f === 1) p = a; else if (f === 2) p = b; else if (f === 3) p = (a + b) >> 1;
      else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      else if (f !== 0) throw new Error('bad png filter ' + f);
      cur[i] = (src[i] + p) & 255;
    }
    if (y) { if (cur.equals(prev)) { run++; if (run > maxRun) maxRun = run; } else run = 1; }
    [prev, cur] = [cur, prev];
  }
  return { width, height, maxRun };
}

// JS for ctx.ev. targetExpr evaluates to the target element. nameIn is checked on the target's CONTAINING pane, never its own text.
export function guardJs(targetExpr, accountName, accountId) {
  return `(() => {
  const target = ${targetExpr};
  if (!target) return JSON.stringify({found: false});
  // no scrollIntoView: the viewport was sized to hold the whole target, and a scroll makes the Today scroll handler swap the pane's account
  const scope = target.closest('.day-pane, .day-step, .modal, .todo-item, [data-v13-desk-body]') || target;
  const kind = scope.hasAttribute('data-v13-desk-body') ? 'desk' : scope.classList.contains('day-pane') ? 'day-pane' : scope.classList.contains('day-step') ? 'day-step' : scope.classList.contains('modal') ? 'modal' : scope.classList.contains('todo-item') ? 'todo-item' : 'target';
  let nameIn = scope.textContent.includes(${JSON.stringify(accountName)});
  if (kind === 'day-pane') nameIn = nameIn && scope.dataset.dayHolds === ${JSON.stringify(accountId || '')};
  if (kind === 'desk') { const pn = scope.querySelector('[data-v13-desk-panel]'); nameIn = nameIn && !!pn && pn.dataset.v13DeskCust === ${JSON.stringify(accountId || '')}; }
  if (kind === 'day-step') nameIn = nameIn && scope.dataset.dayStep === ${JSON.stringify(accountId || '')};
  const r = target.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, innerHeight / 2));
  const topOk = !!hit && (hit === target || target.contains(hit));
  const backdrops = Array.from(document.querySelectorAll('.modal-backdrop')).filter(b => !b.contains(target) && b.getClientRects().length > 0 && getComputedStyle(b).visibility !== 'hidden').length;
  return JSON.stringify({found: true, scope: kind, nameIn, topOk, backdrops});
})()`;
}

export function evaluateGuard(info, png, { maxBlank = MAX_BLANK_PX, account = 'the intended account' } = {}) {
  const fails = [];
  if (info.found === false) fails.push('target not found');
  if (!info.nameIn) fails.push(`wrong account: the containing pane (${info.scope || 'pane'}) does not show ${account}`);
  if (!info.topOk) fails.push('something is on top of the target (topOk false: elementFromPoint is not the target)');
  if (info.backdrops > 0) fails.push(`${info.backdrops} other modal-backdrop visible`);
  const run = pngBlankRun(png);
  if (run.maxRun > maxBlank) fails.push(`blank band: ${run.maxRun} identical rows > ${maxBlank}`);
  return fails;
}

export const seedExported = (ctx, iso) => ctx.ev("DATA.lastExportedAt='" + iso + "'; saveData(); true");

const RECT = targetExpr => `(() => { const t = ${targetExpr}; if (!t) return null; const r = t.getBoundingClientRect(); return JSON.stringify({x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, sh: t.scrollHeight}); })()`;

// Size the viewport to the target's full height so nothing is left to paint beyond the viewport; returns the target rect.
// Today's scroll handler re-points the one shared working pane at whichever beat is in the window; on load, resize and scroll it can
// drop the account we opened. Re-point it at the account (a no-op elsewhere), then let it settle.
const refocus = async (ctx, accountId) => { if (!accountId) return; await ctx.ev(`typeof setTodayFocus === 'function' && setTodayFocus(${JSON.stringify(accountId)}); true`); await sleep(300); };

export async function expandForCapture(ctx, targetExpr, margin = 80, accountId = '') {
  await refocus(ctx, accountId);
  const j = JSON.parse((await ctx.ev(RECT(targetExpr))) || 'null');
  if (!j) throw new Error('expandForCapture: target not found: ' + targetExpr.slice(0, 160));
  const width = Math.max(1440, Math.ceil(j.x + j.w + 40));
  const height = Math.max(900, Math.ceil(j.y + Math.max(j.h, j.sh) + margin));
  await ctx.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await sleep(400);
  await ctx.ev('window.scrollTo(0, 0); true');
  await sleep(300);
  await refocus(ctx, accountId);
  const r = JSON.parse(await ctx.ev(RECT(targetExpr)));
  return { x: r.x, y: r.y, w: r.w, h: r.h };
}
// The page re-renders on the resize this causes; wait it out so the next open() is not undone by a late resize handler.
export const resetCapture = async ctx => { await ctx.send('Emulation.clearDeviceMetricsOverride', {}); await sleep(800); };

// Guard + screenshot. png = output path. Appends one CAPTURE-GUARD line to logFile; throws on any failure (after logging it).
export async function guardShot(ctx, { name, account, accountId, targetExpr, png, logFile }) {
  const rect = await expandForCapture(ctx, targetExpr, 80, accountId);
  const info = JSON.parse(await ctx.ev(guardJs(targetExpr, account, accountId)));
  const fresh = JSON.parse((await ctx.ev(RECT(targetExpr))) || 'null');   // guardJs scrolled the target; clip uses document coordinates
  const r = fresh ? { x: fresh.x, y: fresh.y, w: fresh.w, h: fresh.h } : rect;
  const s = await ctx.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  const buf = Buffer.from(s.data, 'base64');
  const run = pngBlankRun(buf);
  const fails = evaluateGuard(info, buf, { account });
  const line = { name, account, scope: info.scope, nameIn: info.nameIn, topOk: info.topOk, backdrops: info.backdrops, maxRun: run.maxRun, height: run.height, ok: fails.length === 0 };
  mkdirSync(dirname(logFile), { recursive: true });
  appendFileSync(logFile, 'CAPTURE-GUARD ' + JSON.stringify(line) + (fails.length ? ' FAIL ' + fails.join('; ') : '') + '\n');
  if (fails.length) throw new Error(`capture guard failed for ${name}: ${fails.join('; ')}`);
  mkdirSync(dirname(png), { recursive: true });
  writeFileSync(png, buf);
  return r;
}
