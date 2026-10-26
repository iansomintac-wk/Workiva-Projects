// Look call 6 capture seed (fake data, runs after demo-seed.js): two accounts with confirmed risks.
(function(){
  const mk = (id, name) => { const c = {id, name, module: DATA.config.modules[0], stage: DATA.config.stages[1].key,
    implementationDate: isoAddDays(todayISO(), -200), totalSessions: 8, domainScores: {}, sessionNotes: {}, stageHistory: [], riskOverride: 'risk'};
    backfillCustomerRecord(c); return c; };
  const a = mk('lc6-halvorsen', 'Halvorsen Freight'), b = mk('lc6-kestrel', 'Kestrel Biologics');
  const note = (id, d, s) => ({id, date: isoAddDays(todayISO(), d), type: 'Call', summary: s, checklist: [], sessionNumber: null, flagged: true});
  DATA.customers.push(a, b);
  DATA.activities[a.id] = [note('lc6a1', -2, 'Sponsor hinted the renewal is not a given'), note('lc6a2', -3, 'Usage report shows two teams stopped logging in')];
  DATA.activities[b.id] = [note('lc6b1', -2, 'Budget owner left the company in September')];
  _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
  const on = isoAddDays(todayISO(), -5), on2 = isoAddDays(todayISO(), -4);
  DATA.riskLog = DATA.riskLog || {};
  buildRiskHubList().filter(r => r.c.id === a.id).forEach(it => { DATA.riskLog[it.logKey] = {firstSeen: on, lastActioned: on, verdict: 'confirmed', verdictOn: on, verdictSev: 3, verdictReason: 'the sponsor said they may not renew'}; });
  buildRiskHubList().filter(r => r.c.id === b.id).forEach((it, i) => { DATA.riskLog[it.logKey] = {firstSeen: on, lastActioned: on, verdict: 'confirmed', verdictOn: i ? on2 : on, verdictSev: 3, verdictReason: i ? 'the rollout is paused until Q1' : 'the budget owner left and nobody owns the renewal'}; });
  _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
})();
