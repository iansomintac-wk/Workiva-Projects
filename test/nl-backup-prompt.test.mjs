import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat, htmlLF } from '../tools/lib/csat-fixture.mjs';

const src = htmlLF();
function modal(args) {
  let backdrop;
  const doc = { createElement: () => (backdrop = { className: '', innerHTML: '', querySelector: () => ({ addEventListener() {} }), addEventListener() {}, remove() {} }), body: { appendChild() {} } };
  const c = loadCsat(['escapeHtml', 'showConfirmModal'], [], { document: doc });
  c.showConfirmModal(...args);
  return backdrop.innerHTML;
}
// Top-level argument count of the call whose "(" is at index `open` (-1 if the parentheses never balance).
function callArgs(text, open) {
  let depth = 0, n = 1, quote = null;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (quote) { if (ch === '\\') { i++; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) { depth--; if (depth === 0) return n; }
    else if (ch === ',' && depth === 1) n++;
  }
  return -1;
}
test('preserved: without options the confirm modal still says "Are you sure?" with a red button (passes on the parent)', () => {
  const h = modal(['msg', () => {}, 'Delete']);
  assert.ok(h.includes('<h3>Are you sure?</h3>') && h.includes('btn btn-danger'));
});
test('NL-2 confirm modal: with the backup options the title is "Back up your book first?" and the button is the primary style, not red', () => {
  const h = modal(['msg', () => {}, 'Download backup', { title: 'Back up your book first?', primary: true }]);
  assert.ok(h.includes('<h3>Back up your book first?</h3>') && h.includes('btn btn-primary') && !h.includes('btn-danger') && h.includes('>Download backup<'), h);
});
test('NL-2 maybePromptBackup passes the label "Download backup" and the backup options', () => {
  let args;
  const c = loadCsat(['maybePromptBackup'], [], {
    DATA: { customers: [{}], lastExportedAt: null },
    daysSince: () => 0, BACKUP_PROMPT_DAYS: 90,
    exportData() {},
    showConfirmModal: (...a) => { args = a; }
  });
  c.maybePromptBackup();
  assert.equal(args[2], 'Download backup');
  assert.deepEqual(JSON.parse(JSON.stringify(args[3])), { title: 'Back up your book first?', primary: true });
});
test('preserved: the primary button class exists in the 1.1 CSS (passes on the parent)', () => {
  assert.match(src, /\.btn-primary\s*\{/);
});
test('NL-2 every other showConfirmModal call site keeps the default: exactly one call passes a fourth argument (the backup prompt); at least 15 calls exist', () => {
  const opens = [...src.matchAll(/(?<!function )showConfirmModal\(/g)].map(m => m.index + m[0].length - 1);
  assert.ok(opens.length >= 15, 'call sites: ' + opens.length);
  const counts = opens.map(o => callArgs(src, o));
  assert.ok(counts.every(n => n >= 2 && n <= 4), counts.join(','));
  assert.equal(counts.filter(n => n === 4).length, 1, counts.join(','));
});
