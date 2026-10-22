import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCsat } from '../tools/lib/csat-fixture.mjs';

const FNS = ['riskVerdictState', 'riskItemHasReason', 'riskItemIsRisk', 'setRiskVerdict', 'markRiskActioned', 'confirmRiskCase', 'buildRiskCases', 'openDeskRiskConfirm'];
const CONSTS = ['RISK_VERDICTS', 'RISK_DISMISS_EXPIRY_DAYS'];

function world(trackings) {
  const log = {};
  const c = { id: 'a', name: 'Acme' };
  const items = trackings.map((t, i) => {
    const logKey = 'a|sig' + i;
    log[logKey] = { firstSeen: '2026-09-01', lastActioned: null, ...t };
    return { c, kind: 'Off Track', sev: 3, detail: 'd', logKey, tracking: log[logKey] };
  });
  const ctx = loadCsat(FNS, CONSTS, {
    getRiskLog: () => log, todayISO: () => '2026-10-22', saveData() {}, render() {}, showToast() {}, markUndoable() {},
    isRecordObject: v => !!v && typeof v === 'object', isRealISODate: s => /^\d{4}-\d\d-\d\d$/.test(s || ''),
    daysSince: () => 1, riskItemKey: it => it.logKey, buildRiskHubList: () => items,
    showRiskConfirmModal: (k, cb) => cb('they said they will leave'),
  });
  return { ctx, log, items };
}

test('desk Add a reason on a legacy-confirmed signal leaves another unreviewed signal unreviewed', () => {
  const { ctx, log } = world([{ verdict: 'confirmed', verdictOn: '2026-09-02', verdictSev: 3 }, {}]);
  assert.equal(ctx.openDeskRiskConfirm('a|sig0'), true);
  assert.equal(log['a|sig0'].verdictReason, 'they said they will leave');
  assert.equal(log['a|sig1'].verdict, undefined);
  assert.equal(log['a|sig1'].verdictReason, undefined);
});
test('desk Confirm on an unreviewed signal still confirms the case with the reason', () => {
  const { ctx, log } = world([{}, {}]);
  ctx.openDeskRiskConfirm('a|sig0');
  assert.equal(log['a|sig0'].verdict, 'confirmed');
  assert.equal(log['a|sig1'].verdict, 'confirmed');
});
