import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, htmlLF } from '../tools/lib/csat-fixture.mjs';

function env(win) {
  const h = {}; const els = {}; const log = [];
  const mk = sel => (els[sel] = { style: {}, addEventListener: (ev, fn) => { h[sel + ':' + ev] = fn; } });
  const backdrop = { querySelector: mk, remove: () => log.push('removed') };
  const c = loadCsat(['bindCsatSettings'], [], { window: win, document: { getElementById: () => ({ click() {} }) },
    csatWatchUse: async d => log.push(['use', d]), csatWatchRefresh: async r => log.push(['refresh', r]), csatWatchStop: async () => log.push('stop'),
    showToast: m => log.push(['toast', m]) });
  c.bindCsatSettings(backdrop);
  return { h, els, log };
}
test('CSAT settings: Watch a folder asks for read access to a directory and hands the chosen folder to csatWatchUse', async () => {
  let opts; const dir = { fake: 'dir' };
  const { h, log } = env({ showDirectoryPicker: async o => { opts = o; return dir; } });
  await h['#btn-csat-watch:click']();
  assert.deepEqual(JSON.parse(JSON.stringify(opts)), { mode: 'read' }); assert.equal(log[0][0], 'use'); assert.equal(log[0][1], dir);
});
test('CSAT settings: cancelling the folder picker (AbortError) is silent, a different error shows a toast', async () => {
  const a = env({ showDirectoryPicker: async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; } });
  await a.h['#btn-csat-watch:click']();
  assert.deepEqual(a.log, []);
  const b = env({ showDirectoryPicker: async () => { throw new Error('boom'); } });
  await b.h['#btn-csat-watch:click']();
  assert.equal(b.log.length, 1); assert.equal(b.log[0][0], 'toast');
});
test('CSAT settings: Check now refreshes with a click (request permission) and Stop watching stops the watch', async () => {
  const { h, log } = env({ showDirectoryPicker() {} });
  await h['#btn-csat-check:click'](); await h['#btn-csat-unwatch:click']();
  assert.deepEqual(log, [['refresh', true], 'stop']);
});
test('CSAT settings: without showDirectoryPicker the watch button is hidden and Check now and Stop watching stay bound', () => {
  const { els, h } = env({});
  assert.equal(els['#btn-csat-watch'].style.display, 'none');
  assert.ok(h['#btn-csat-check:click'] && h['#btn-csat-unwatch:click']);
});
test('CSAT settings (markup presence; the headless drive finds them in the real Settings modal): the three controls and their labels exist', () => {
  const src = htmlLF();
  for (const [id, label] of [['btn-csat-watch', 'Watch a folder for CSAT exports'], ['btn-csat-check', 'Check now'], ['btn-csat-unwatch', 'Stop watching']]) assert.ok(src.includes(`id="${id}"`) && src.includes(`>${label}<`), id);
});
