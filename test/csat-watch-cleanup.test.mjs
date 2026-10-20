import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadCsat, makeFixture, J, PLAN_FNS, PLAN_CONSTS, HEADER, sf, gs, htmlLF } from '../tools/lib/csat-fixture.mjs';

const WATCH = ['escapeHtml', 'escapeAttr', 'csatNewestFile', 'csatFolderCheck', 'csatWatchRefresh', 'csatWatchUse', 'csatWatchStop', 'csatWatchInit', 'csatWatchClick', 'renderCsatWatchLine'];
const L = new Date(2026, 9, 19, 10).getTime();   // 19 Oct 2026 local
const csv = `${HEADER.join(',')}\n${sf(1)},${gs(1)},Fake Co,2026-09-01,\n`;
const dirWith = (lm, perm = 'granted') => ({ queryPermission: async () => perm, requestPermission: async () => 'granted',
  values: async function* () { yield { kind: 'file', name: 'csat_runway_export_x.csv', getFile: async () => ({ name: 'csat_runway_export_x.csv', lastModified: lm, text: async () => csv }) }; } });
function env(csatImport, over = {}) {
  const calls = [];
  const DATA = { customers: [{ id: 'a', name: 'Fake Co', salesforceId: sf(1), gainsightId: '', compliance: { associatedPeopleCSAT: { surveySentOn: null, surveyAnsweredOn: null } } }], csatImport };
  const c = loadCsat([...PLAN_FNS, ...WATCH], [...PLAN_CONSTS, 'CSAT_FILE_RE'], { DATA, window: { showDirectoryPicker() {} },
    _csatWatch: { state: 'off', dir: null, fileName: '', fileModified: 0, plan: null, text: '' },
    render: () => calls.push('render'), exportData: () => calls.push('exportData'), saveData: () => calls.push('saveData'), markUndoable: () => calls.push('markUndoable'),
    csatFolderStore: async () => { calls.push('store'); return true; }, csatFolderClear: async () => { calls.push('clear'); return true; }, csatFolderLoad: async () => undefined,
    openCsatImportModal: (plan, meta) => calls.push(['modal', J(plan).changes.length, J(meta)]), ...over });
  return { c, calls, DATA };
}
const raw = c => vm.runInContext('renderCsatWatchLine()', c);
const line = c => raw(c).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const mkDir = (file, perm = 'granted') => ({ queryPermission: async () => perm, requestPermission: async () => 'granted',
  values: async function* () { yield { kind: 'file', name: 'csat_runway_export_x.csv', getFile: async () => file }; } });
const allMatchCsv = `${HEADER.join(',')}
${sf(1)},${gs(1)},Fake Co,2026-09-01,
`;
const setDir = (c, dir) => vm.runInContext('(d) => { _csatWatch.dir = d; }', c)(dir);

test('watch 1a: a newer export whose rows all already match leaves no Today line (state off, not new)', async () => {
  const { c, DATA } = env({ fileModified: 1 });
  DATA.customers[0].compliance.associatedPeopleCSAT.surveySentOn = '2026-09-01';   // the CSV row says the same
  await c.csatWatchUse(dirWith(L));
  assert.equal(vm.runInContext('_csatWatch.state', c), 'off');
  assert.equal(raw(c), '');
});
test('watch 1b: a file over 8 MB is not read (text() never called) and the watch is off with a note', async () => {
  let reads = 0;
  const big = { name: 'csat_runway_export_x.csv', size: 9 * 1024 * 1024, lastModified: L, text: async () => { reads++; return allMatchCsv; } };
  const { c } = env(); await c.csatWatchUse(mkDir(big)); await c.csatWatchRefresh(true);
  assert.equal(reads, 0); assert.equal(vm.runInContext('_csatWatch.state', c), 'off');
  assert.match(line(c), /over 8 MB/);
});
test('watch 1c: a folder that throws shows its reason after Check now, and nothing after a quiet refresh', async () => {
  const dir = { queryPermission: async () => 'granted', requestPermission: async () => 'granted', values: () => { throw new Error('NotFoundError'); } };
  const { c } = env(); setDir(c, dir);
  await c.csatWatchRefresh(false); assert.equal(raw(c), '');
  await c.csatWatchRefresh(true);  assert.match(line(c), /^CSAT folder: could not read that folder/);
});
test('watch 1c: Check now with a newest file that is not a CSAT export says so', async () => {
  const bad = { name: 'csat_runway_export_x.csv', size: 10, lastModified: L, text: async () => 'Name,Notes\nFake Co,hello\n' };
  const { c } = env(); await c.csatWatchUse(mkDir(bad)); await c.csatWatchRefresh(true);
  assert.match(line(c), /not a CSAT export/);
});
test('watch 1c: Check now with nothing new says so; a plain refresh stays silent', async () => {
  const { c } = env({ fileModified: L });
  await c.csatWatchUse(dirWith(L)); assert.equal(raw(c), '');
  await c.csatWatchRefresh(true); assert.match(line(c), /nothing new/);
});
test('watch 1e: Stop watching while a scan is reading the file drops that scan (state stays off, no plan)', async () => {
  let release; const gate = new Promise(r => { release = r; });
  const slow = { name: 'csat_runway_export_x.csv', size: 10, lastModified: L, text: async () => { await gate; return csv; } };
  const { c } = env(); setDir(c, mkDir(slow));
  const scan = c.csatWatchRefresh(false);
  await new Promise(r => setTimeout(r, 20));
  await c.csatWatchStop(); release(); await scan;
  assert.equal(vm.runInContext('_csatWatch.state', c), 'off'); assert.equal(vm.runInContext('_csatWatch.plan', c), null);
});
test('watch 1c: the Check now button also toasts the note (source check on bindCsatSettings)', () => {
  const lf = htmlLF();
  const body = lf.slice(lf.indexOf('function bindCsatSettings('), lf.indexOf('function bindCsatFileInput('));
  assert.match(body, /_csatWatch\.note[\s\S]*showToast|showToast[\s\S]*_csatWatch\.note/);
});

test('FX2 S1: picking a new folder starts a fresh watch record, so an old folder\'s slow scan cannot put its plan back', async () => {
  let release; const gate = new Promise(r => { release = r; });
  const slow = { name: 'csat_runway_export_x.csv', size: 10, lastModified: L, text: async () => { await gate; return csv; } };
  const { c } = env({ fileModified: L });
  setDir(c, mkDir(slow));
  const oldScan = c.csatWatchRefresh(false);
  await new Promise(r => setTimeout(r, 20));
  const before = vm.runInContext('_csatWatch', c);
  await c.csatWatchUse(dirWith(L));                 // new folder: nothing newer than the last import
  assert.notEqual(vm.runInContext('_csatWatch', c), before);
  release(); await oldScan;
  assert.equal(vm.runInContext('_csatWatch.state', c), 'off');
  assert.equal(vm.runInContext('_csatWatch.plan', c), null);
  assert.equal(raw(c), '');
});
test('FX2 S2: permission denied gives a note after Check now, and stays silent on a quiet refresh', async () => {
  const dir = { queryPermission: async () => 'denied', requestPermission: async () => 'denied', values: async function* () {} };
  const { c } = env(); setDir(c, dir);
  await c.csatWatchRefresh(false); assert.equal(raw(c), '');
  await c.csatWatchRefresh(true);
  assert.equal(line(c), 'CSAT folder: the browser did not allow access to that folder. Pick it again in Settings.');
  assert.equal(vm.runInContext('_csatWatch.note', c), 'the browser did not allow access to that folder. Pick it again in Settings.');
});
test('FX2 N1: the next automatic refresh clears a manual note', async () => {
  const { c } = env({ fileModified: L });
  await c.csatWatchUse(dirWith(L));
  await c.csatWatchRefresh(true); assert.match(line(c), /nothing new/);
  await c.csatWatchRefresh(false);
  assert.equal(vm.runInContext('_csatWatch.note', c), '');
  assert.equal(raw(c), '');
});
test('FX3 init: a folder picked while startup is still loading the saved one wins (the record is not overwritten)', async () => {
  let release; const gate = new Promise(r => { release = r; });
  const saved = dirWith(L), picked = dirWith(L);
  const { c } = env({ fileModified: L }, { csatFolderLoad: async () => { await gate; return saved; } });
  const init = c.csatWatchInit();
  await new Promise(r => setTimeout(r, 20));
  await c.csatWatchUse(picked);
  release(); await init;
  assert.equal(vm.runInContext('_csatWatch.dir', c), picked);
});
