import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, J, htmlLF } from '../tools/lib/csat-fixture.mjs';

const file = (name, lastModified, kind = 'file') => ({ kind, name, getFile: async () => ({ name, lastModified, text: async () => 'x' }) });
const folder = (files, perm = 'granted', after = 'granted') => {
  const log = []; let p = perm;
  return { log, queryPermission: async o => { log.push('query:' + o.mode); return p; }, requestPermission: async o => { log.push('request:' + o.mode); p = after; return p; },
    values: async function* () { log.push('list'); for (const f of files) yield f; } };
};
const env = csatImport => loadCsat(['csatNewestFile', 'csatFolderCheck'], ['CSAT_FILE_RE'], { DATA: { csatImport } });

test('CSAT folder: the newest matching file by lastModified wins; other names, other extensions and subfolders are ignored', async () => {
  const best = await env().csatNewestFile(folder([file('csat_runway_export_a.csv', 100), file('CSAT_RUNWAY_EXPORT_b.CSV', 300), file('csat_runway_export_c.csv', 200), file('other.csv', 900), file('csat_runway_export_d.txt', 900), file('csat_runway_export_sub.csv', 999, 'directory')]));
  assert.equal(best.name, 'CSAT_RUNWAY_EXPORT_b.CSV');
});
test('CSAT folder: a granted folder with a file newer than the last import is new', async () => {
  const r = J(await env({ fileModified: 100 }).csatFolderCheck(folder([file('csat_runway_export_a.csv', 200)]), false));
  assert.deepEqual([r.state, r.isNew, r.newest.name], ['granted', true, 'csat_runway_export_a.csv']);
});
test('CSAT folder: the same file as the last import is not new', async () => {
  assert.equal(J(await env({ fileModified: 200 }).csatFolderCheck(folder([file('csat_runway_export_a.csv', 200)]), false)).isNew, false);
});
test('CSAT folder: an empty folder is granted with no newest file and nothing new', async () => {
  const r = J(await env().csatFolderCheck(folder([]), false));
  assert.deepEqual([r.state, r.newest, r.isNew], ['granted', null, false]);
});
test('CSAT folder: permission "prompt" without a click reports prompt and does not list or request', async () => {
  const f = folder([file('csat_runway_export_a.csv', 200)], 'prompt');
  assert.equal(J(await env().csatFolderCheck(f, false)).state, 'prompt'); assert.deepEqual(f.log, ['query:read']);
});
test('CSAT folder: permission "prompt" with a click calls requestPermission in read mode and then proceeds when granted', async () => {
  const f = folder([file('csat_runway_export_a.csv', 200)], 'prompt', 'granted');
  assert.equal(J(await env().csatFolderCheck(f, true)).state, 'granted'); assert.deepEqual(f.log, ['query:read', 'request:read', 'list']);
});
test('CSAT folder: denied lists nothing; a missing or non-handle value (browser without showDirectoryPicker) is none', async () => {
  const f = folder([file('csat_runway_export_a.csv', 200)], 'denied');
  assert.equal(J(await env().csatFolderCheck(f, false)).state, 'denied'); assert.ok(!f.log.includes('list'));
  assert.equal(J(await env().csatFolderCheck(null, false)).state, 'none');
  assert.equal(J(await env().csatFolderCheck({}, false)).state, 'none');
});
test('CSAT folder: store, load and clear act on the csat-folder key only (fake IndexedDB store), and clear really deletes the handle', async () => {
  const m = new Map([['book', 'BOOK-HANDLE']]); const modes = [];
  const fsIdb = async (mode, fn) => { modes.push(mode); return fn({ put: (v, k) => { m.set(k, v); }, get: k => m.get(k), delete: k => { m.delete(k); } }); };
  const c = loadCsat(['csatFolderStore', 'csatFolderLoad', 'csatFolderClear'], ['CSAT_FOLDER_KEY'], { fsIdb });
  assert.equal(await c.csatFolderStore('H1'), true);
  assert.equal(m.get('csat-folder'), 'H1');
  assert.equal(await c.csatFolderLoad(), 'H1');
  assert.equal(await c.csatFolderClear(), true);
  assert.equal(m.has('csat-folder'), false); assert.equal(await c.csatFolderLoad(), undefined);
  assert.equal(m.get('book'), 'BOOK-HANDLE');
  assert.deepEqual(modes, ['readwrite', 'readonly', 'readwrite', 'readonly']);
});
test('preserved: the existing backup-handle database name, store, key and version are unchanged (source check; passes on the parent)', () => {
  const src = htmlLF();
  assert.match(src, /indexedDB\.open\(FS_DB, 1\)/);
  assert.match(src, /const FS_DB = 'obm-backup-v1', FS_STORE = 'handles', FS_KEY = 'book';/);
});
