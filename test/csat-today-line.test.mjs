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

test('CSAT today line: a newer export shows "New CSAT export (19 Oct): 1 date would change · Review" with a Review button', async () => {
  const { c } = env();
  await c.csatWatchUse(dirWith(L));
  assert.equal(line(c), 'New CSAT export (19 Oct): 1 date would change · Review');
  assert.ok(raw(c).includes('data-csat-review'));
});
test('CSAT today line: nothing is applied by looking: no export, save or undo call, and DATA is unchanged', async () => {
  const { c, calls, DATA } = env(); const before = JSON.stringify(DATA.customers);
  await c.csatWatchUse(dirWith(L));
  assert.deepEqual(calls.filter(x => x !== 'render' && x !== 'store'), []); assert.equal(JSON.stringify(DATA.customers), before);
});
test('CSAT today line: after the same file was imported there is no line', async () => {
  const { c } = env({ fileModified: L });
  await c.csatWatchUse(dirWith(L));
  assert.equal(line(c), '');
});
test('CSAT today line: permission "prompt" reads "CSAT folder: click to allow"; a click-triggered refresh then shows the export', async () => {
  const { c } = env();
  await c.csatWatchUse(dirWith(L, 'prompt'));
  assert.equal(line(c), 'CSAT folder: click to allow'); assert.ok(raw(c).includes('data-csat-allow'));
  await c.csatWatchRefresh(true);
  assert.match(line(c), /^New CSAT export \(19 Oct\)/);
});
test('CSAT today line: denied, or no folder at all, shows no line', async () => {
  const a = env(); await a.c.csatWatchUse(dirWith(L, 'denied')); assert.equal(line(a.c), '');
  const b = env(); await b.c.csatWatchRefresh(false); assert.equal(line(b.c), '');
});
test('CSAT today line: a newest file that is not a CSAT export (header missing columns) leaves the watch off and shows no line', async () => {
  const bad = 'Name,Notes\nFake Co,hello\n';
  const dir = { queryPermission: async () => 'granted', requestPermission: async () => 'granted',
    values: async function* () { yield { kind: 'file', name: 'csat_runway_export_bad.csv', getFile: async () => ({ name: 'csat_runway_export_bad.csv', lastModified: L, text: async () => bad }) }; } };
  const { c } = env();
  await c.csatWatchUse(dir);
  assert.equal(vm.runInContext('_csatWatch.state', c), 'off');
  assert.equal(raw(c), '');
});
test('CSAT today line: Stop watching deletes the stored handle (csatFolderClear called once) and clears the line', async () => {
  const { c, calls } = env();
  await c.csatWatchUse(dirWith(L));
  await c.csatWatchStop();
  assert.equal(line(c), ''); assert.equal(calls.filter(x => x === 'clear').length, 1);
});
test('CSAT startup: a stored folder handle is reloaded and the export line appears without any click', async () => {
  const { c } = env(undefined, { csatFolderLoad: async () => dirWith(L) });
  await c.csatWatchInit();
  assert.match(line(c), /^New CSAT export \(19 Oct\)/);
});
test('CSAT startup: with no stored handle nothing is shown and nothing is requested', async () => {
  const { c, calls } = env();
  await c.csatWatchInit();
  assert.equal(line(c), ''); assert.deepEqual(calls, []);
});
test('CSAT startup: a browser without showDirectoryPicker never even reads the stored handle', async () => {
  let loads = 0;
  const { c } = env(undefined, { window: {}, csatFolderLoad: async () => { loads++; return dirWith(L); } });
  await c.csatWatchInit();
  assert.equal(loads, 0); assert.equal(line(c), '');
});
test('CSAT click: Review opens the shared dry-run modal with the watched plan and the file name and modified time', async () => {
  const { c, calls } = env();
  await c.csatWatchUse(dirWith(L));
  const t = { hasAttribute: a => a === 'data-csat-review' };
  await c.csatWatchClick({ target: { closest: () => t } });
  assert.deepEqual(calls.filter(x => Array.isArray(x)), [['modal', 1, { fileName: 'csat_runway_export_x.csv', fileModified: L }]]);
});
test('CSAT click: "click to allow" asks for read permission; an unrelated click does nothing', async () => {
  const { c } = env(); let asked = 0;
  const d = dirWith(L, 'prompt'); d.requestPermission = async () => { asked++; return 'granted'; };
  await c.csatWatchUse(d);
  await c.csatWatchClick({ target: { closest: () => null } });
  assert.equal(asked, 0);
  await c.csatWatchClick({ target: { closest: () => ({ hasAttribute: a => a === 'data-csat-allow' }) } });
  assert.equal(asked, 1); assert.match(line(c), /^New CSAT export/);
});
test('CSAT apply click: after the report opens the Apply handler refreshes the watch so the line clears', () => {
  const calls = []; let applyFn;
  const backdrop = { className: '', innerHTML: '', querySelector: sel => ({ addEventListener: (ev, fn) => { if (sel === '#csat-apply' && ev === 'click') applyFn = fn; }, remove() {} }),
    querySelectorAll: () => [], addEventListener() {}, remove() {} };
  const c = loadCsat([...PLAN_FNS, 'escapeHtml', 'escapeAttr', 'csatPlanSummary', 'csatSectionHtml', 'openCsatImportModal'], PLAN_CONSTS,
    { document: { createElement: () => backdrop, body: { appendChild() {} } }, commitCsatImport: () => { calls.push('commit'); return {}; }, openCsatReportModal: () => calls.push('report'), csatWatchRefresh: a => calls.push('refresh:' + a), showToast() {} });
  const { table, customers } = makeFixture();
  c.openCsatImportModal(c.buildCsatImportPlan(table, customers, {}), { fileName: 'f.csv', fileModified: 7 });
  applyFn();
  assert.deepEqual(calls, ['commit', 'report', 'refresh:false']);
});
test('CSAT today line (source presence; the headless drive proves it in the page): renderToday prints the line next to Surveys to chase, and the page binds the click and the startup load', () => {
  const src = htmlLF(); const i = src.indexOf('function renderToday(');
  const body = src.slice(i, src.indexOf('\n}\n', i));
  assert.ok(body.includes('renderCsatWatchLine()') && body.includes('renderSurveysToChase('));
  assert.ok(src.includes("document.addEventListener('click', csatWatchClick)") && src.includes('csatWatchInit()'));
});
