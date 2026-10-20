import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, makeFixture, J, PLAN_FNS, PLAN_CONSTS, HEADER, sf, gs, htmlLF } from '../tools/lib/csat-fixture.mjs';

const UI_FNS = ['escapeHtml', 'escapeAttr', 'csatPlanSummary', 'csatSectionHtml', 'openCsatImportModal'];
function open(plan, meta = { fileName: 'csat_runway_export_x.csv', fileModified: 1 }) {
  let backdrop; const listeners = {};
  const stub = sel => ({ value: '', checked: false, disabled: false, addEventListener: (ev, fn) => { listeners[sel + ':' + ev] = fn; }, remove() {} });
  const doc = { createElement: () => (backdrop = { className: '', innerHTML: '', querySelector: stub, querySelectorAll: () => [], addEventListener() {}, remove() {} }), body: { appendChild() {} } };
  const c = loadCsat([...PLAN_FNS, ...UI_FNS], PLAN_CONSTS, { document: doc, commitCsatImport() {}, showToast() {}, render() {} });
  c.openCsatImportModal(plan, meta);
  return { html: backdrop.innerHTML, c, listeners };
}
const fixturePlan = () => { const { table, customers } = makeFixture(); const c = loadCsat(PLAN_FNS, PLAN_CONSTS); return { plan: c.buildCsatImportPlan(table, customers, {}), c }; };

test('CSAT modal: the summary line is "211 rows: 136 match, 186 dates change, 73 not in Runway, 1 skipped, 1 ambiguous"', () => {
  const { html } = open(fixturePlan().plan);
  assert.ok(html.includes('211 rows: 136 match, 186 dates change, 73 not in Runway, 1 skipped, 1 ambiguous'), html.slice(0, 400));
});
test('CSAT modal: the six sections appear in the spec order, each a collapsible details element', () => {
  const { html } = open(fixturePlan().plan);
  const heads = ['Dates that would change', 'Runway is newer', 'Possible matches by name', 'Rows not in Runway', 'Runway accounts not in the file', 'Skipped'];
  const at = heads.map(h => html.indexOf(h));
  assert.ok(at.every(i => i >= 0) && at.every((v, i) => i === 0 || v > at[i - 1]), String(at));
  assert.ok((html.match(/<details/g) || []).length >= 6);
});
test('CSAT modal: each possible name match is an unticked checkbox keyed by its CSV row', () => {
  const { html } = open(fixturePlan().plan);
  const boxes = html.match(/<input type="checkbox" data-csat-sug="\d+"[^>]*>/g) || [];
  assert.equal(boxes.length, 2);
  assert.ok(boxes.every(b => !/checked/.test(b)));
});
test('CSAT modal: Apply and Cancel exist, and Skipped shows the reason text', () => {
  const { html } = open(fixturePlan().plan);
  assert.ok(html.includes('id="csat-apply"') && html.includes('id="csat-cancel"'));
  assert.ok(html.includes('Skipped: test account'));
});
test('CSAT modal: a header error shows the message and no Apply button', () => {
  const { c } = fixturePlan();
  const { html } = open(J(c.buildCsatImportPlan([['A', 'B']], [], {})));
  assert.ok(html.includes("This isn&#39;t a CSAT export") || html.includes("This isn't a CSAT export"));
  assert.ok(!html.includes('id="csat-apply"'));
});
test('CSAT modal: names from the file and from Runway are HTML-escaped', () => {
  const plan = { error: null, rowCount: 1, matched: [], changes: [{ customerId: 'a', name: '<b>x</b>', field: 'surveySentOn', from: '', to: '2026-09-01' }], unchanged: [], runwayNewer: [], unmatchedRows: [{ row: 2, name: '<i>y</i>', sf: '', gs: '', sent: '2026-09-01', answered: '' }], notInFile: [], ambiguous: [], conflicts: [], suggestions: [], skipped: [] };
  const { html } = open(plan);
  assert.ok(!html.includes('<b>x</b>') && !html.includes('<i>y</i>'));
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
});

const csvText = `${HEADER.join(',')}\n${sf(1)},${gs(1)},Fake Co,2026-09-01,\n`;
function fileEnv(customers) {
  const seen = { modal: null, toasts: [], readers: 0 };
  class FR { constructor() { seen.readers++; } readAsText(f) { this.onload({ target: { result: f.__text } }); } }
  const c = loadCsat([...PLAN_FNS, 'handleCsatFile'], PLAN_CONSTS, { DATA: { customers }, FileReader: FR, showToast: m => seen.toasts.push(m), openCsatImportModal: (plan, meta) => { seen.modal = { plan: J(plan), meta: J(meta) }; } });
  return { c, seen };
}
test('CSAT file: a file over 8 MB is refused with the same toast as the Gainsight import, no reader is started, and the input is reset', () => {
  const { c, seen } = fileEnv([]);
  const ev = { target: { files: [{ size: 8 * 1024 * 1024 + 1, name: 'big.csv' }], value: 'x' } };
  c.handleCsatFile(ev);
  assert.deepEqual(seen.toasts, ['That file is over 8 MB — export just the columns you need.']);
  assert.equal(seen.readers, 0); assert.equal(seen.modal, null); assert.equal(ev.target.value, '');
});
test('CSAT file: a small CSV opens the dry run with a plan built against the book and the file name and modified time', () => {
  const { c, seen } = fileEnv([{ id: 'a', name: 'Fake Co', salesforceId: sf(1), gainsightId: '', compliance: {} }]);
  c.handleCsatFile({ target: { files: [{ size: 120, name: 'csat_runway_export_t.csv', lastModified: 1234, __text: csvText }], value: 'x' } });
  assert.equal(seen.modal.plan.changes.length, 1);
  assert.deepEqual(seen.modal.meta, { fileName: 'csat_runway_export_t.csv', fileModified: 1234 });
});
test('CSAT file: choosing no file does nothing', () => {
  const { c, seen } = fileEnv([]);
  c.handleCsatFile({ target: { files: [], value: 'x' } });
  assert.equal(seen.readers, 0); assert.equal(seen.modal, null); assert.deepEqual(seen.toasts, []);
});
test('CSAT settings wiring: the Import CSAT button closes Settings and clicks the hidden file input; choosing a file calls handleCsatFile', () => {
  const log = []; const handlers = {};
  const mk = sel => ({ addEventListener: (ev, fn) => { handlers[sel + ':' + ev] = fn; } });
  const backdrop = { querySelector: mk, remove: () => log.push('removed') };
  const doc = { getElementById: id => ({ click: () => log.push('click:' + id) }) };
  const c = loadCsat(['bindCsatSettings', 'bindCsatFileInput', 'handleCsatFile'], [], { document: doc });
  c.bindCsatSettings(backdrop);
  handlers['#btn-import-csat:click']();
  assert.deepEqual(log, ['removed', 'click:import-csat-input']);
  const root = { querySelector: mk }; c.bindCsatFileInput(root);
  assert.equal(handlers['#import-csat-input:change'], c.handleCsatFile);
});
test('CSAT settings wiring (source presence; the headless drive clicks the real button): Settings calls bindCsatSettings, the page binds the file input, both controls exist in the markup', () => {
  const src = htmlLF();
  const i = src.indexOf('function openSettingsModal(');
  assert.ok(src.slice(i, src.indexOf('\n}\n', i)).includes('bindCsatSettings(backdrop)'));
  assert.ok(src.includes('bindCsatFileInput(document)'));
  assert.ok(src.includes('id="btn-import-csat"') && src.includes('id="import-csat-input"'));
});
