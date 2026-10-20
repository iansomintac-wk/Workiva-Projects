import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { judgeImportDrive } from '../tools/csat-import-drive.mjs';

const good = {
  summary: '4 rows: 3 match, 2 dates change, 1 not in Runway, 1 skipped', sections: 6, settingsControls: true, settingsWired: true, bigRejected: true,
  cancelChanged: 0, order: ['exportData', 'saveData', 'markUndoable', 'apply', 'saveData'], datesAfter: 3,
  backupHasPreImportDate: true, backupHasNewDate: false, datesAfterSecond: 0, secondApplyDisabled: true,
  reloadKeepsDates: true, reloadKeepsImportRecord: true, accountsBefore: 40, accountsAfter: 40,
  lineForNewer: true, reviewOpensModal: true, lineForSame: false, handleRoundTrip: true, handleDeleted: true
};
test('CSAT drive judge: a clean run passes', () => { assert.equal(judgeImportDrive(good).passed, true); });
test('CSAT drive judge: each wrong value fails it (backup after the write, a second run that still changes dates, a created account, a lost reload, a missing Settings control, a stale watch line, an unopened Review, a kept handle)', () => {
  const bads = [{ order: ['markUndoable', 'exportData', 'saveData', 'apply', 'saveData'] }, { order: ['exportData', 'markUndoable', 'apply', 'saveData'] }, { datesAfterSecond: 1 }, { secondApplyDisabled: false },
    { accountsAfter: 41 }, { cancelChanged: 1 }, { lineForSame: true }, { lineForNewer: false }, { reviewOpensModal: false }, { backupHasPreImportDate: false }, { backupHasNewDate: true },
    { reloadKeepsDates: false }, { reloadKeepsImportRecord: false }, { bigRejected: false }, { settingsWired: false }, { settingsControls: false }, { handleRoundTrip: false }, { handleDeleted: false }, { sections: 5 }, { summary: 'nope' }];
  for (const bad of bads) assert.equal(judgeImportDrive({ ...good, ...bad }).passed, false, JSON.stringify(bad));
});
test('CSAT drive tool: never names a Downloads path, and has a --control mode', () => {
  const s = readFileSync('tools/csat-import-drive.mjs', 'utf8');
  assert.doesNotMatch(s, /Downloads/); assert.match(s, /--control/);
});
