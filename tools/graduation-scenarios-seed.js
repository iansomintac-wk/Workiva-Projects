/* Graduation Plan scenario seed (task 7). Runs AFTER demo-seed.js:
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html \
       --seed demo-seed.js,tools/graduation-scenarios-seed.js --fn runGraduationScenarios --verbose --expect 6
   Defines window.runGraduationScenarios() -> {passed, failed, results:[{name, ok, detail}]}.
   Every result's detail is the MEASURED value, not a restatement of the expectation.
   Throwaway browser profile only. Each scenario swaps DATA.customers / DATA.activities for its own
   accounts and restores them in a finally block; the real calls (createGoal, confirmGraduation, ...)
   are the ones the UI uses. Dev tooling, not part of the distributable bundle. */
window.runGraduationScenarios = function(){
  const results = [];
  const gsAcct = (id, o) => Object.assign({id, name: 'Scenario ' + id, module: 'Sustainability', stage: 'ttfv1',
    totalSessions: 8, implementationDate: isoAddDays(todayISO(), -30), stageHistory: [], domainScores: {},
    notes: '', sessionNotes: {}, riskOverride: null, compliance: defaultCompliance(), goals: [], exit: null,
    targetGraduationDate: null}, o || {});
  const gsHeld = (c, nums, startOffset) => (DATA.activities[c.id] = nums.map(n => ({id: 'gs_' + c.id + '_' + n, type: 'call',
    sessionNumber: n, date: isoAddDays(todayISO(), (startOffset || -nums.length * 7) + n * 7), notes: '', outcome: '', customerId: c.id})));
  const goalsLine = (c, startsWith) => {
    const prevLog = DATA.riskLog; DATA.riskLog = {};       // the packet build prunes riskLog: swap and restore
    try{
      const lines = buildKnowledgeTransferText(c).split('\n');
      const a = lines.indexOf('— GOALS —');
      let b = lines.findIndex((x, i) => i > a && /^— .* —$/.test(x));
      if(b < 0) b = lines.length;
      const sec = lines.slice(a, b);
      return startsWith ? (sec.find(l => l.startsWith(startsWith)) || null) : sec;
    } finally { DATA.riskLog = prevLog; }
  };
  const run = (name, fn) => {
    const prevC = DATA.customers, prevA = DATA.activities;
    try{
      DATA.activities = Object.assign({}, prevA);
      const r = fn();
      results.push({name, ok: !!r.ok, detail: r.detail});
    }catch(e){
      results.push({name, ok: false, detail: 'threw: ' + (e && e.message || e)});
    } finally {
      DATA.customers = prevC; DATA.activities = prevA;
      if(typeof _renderMemoResets !== 'undefined') _renderMemoResets.forEach(r => r());
    }
  };

  run('A3 migrated demo book: no goal_changed / ready_to_graduate rows', () => {
    const raw = cloneData(DATA);
    raw.schemaVersion = 13;
    delete raw.config.goalGates;
    raw.customers.forEach(c => { delete c.goals; delete c.exit; delete c.graduation; });
    const migrated = prepareBookData(raw, 'Scenario-A3');
    const live = DATA;
    let detectHits = 0, rows = 0, allRows = 0, goalsEmpty = 0, exitNull = 0;
    try{
      DATA = migrated;
      _renderMemoResets.forEach(r => r());
      const defs = ['goal_changed', 'ready_to_graduate'].map(k => SIGNAL_DEFS.find(d => d.key === k));
      migrated.customers.forEach(c => {
        if(Array.isArray(c.goals) && !c.goals.length) goalsEmpty++;
        if(c.exit === null) exitNull++;
        defs.forEach(d => { if(d.detect(c)) detectHits++; });
        const cands = todayAccountCandidates(c, {gainsightByCustomer: {}});
        allRows += cands.length;
        rows += cands.filter(x => x.source === 'signal:goal_changed' || x.source === 'signal:ready_to_graduate').length;
      });
    } finally { DATA = live; _renderMemoResets.forEach(r => r()); }
    const n = migrated.customers.length;
    return {ok: rows === 0 && detectHits === 0 && n > 0 && goalsEmpty === n && exitNull === n && migrated.schemaVersion === CURRENT_SCHEMA_VERSION,
      detail: `measured rows=${rows} detect=${detectHits} accounts=${n} (of ${allRows} Today rows in all) goals:[]=${goalsEmpty}/${n} exit:null=${exitNull}/${n} schema=${migrated.schemaVersion}`};
  });

  run('A4 Scenario A (on plan): ready_to_graduate fires', () => {
    const c = gsAcct('gsA', {totalSessions: 8, targetGraduationDate: isoAddDays(todayISO(), 14)});
    DATA.customers = [c]; gsHeld(c, [1,2,3,4,5,6,7,8], -60);
    const g = createGoal(c, {type: 'publish', text: 'Publish FY2026 report'});
    g.gates.forEach(x => setGoalGateDone(c, g.id, x.id, true));
    _renderMemoResets.forEach(r => r());
    const sig = customerReadyToGraduateSignal(c);
    const def = SIGNAL_DEFS.find(d => d.key === 'ready_to_graduate');
    const det = def.detect(c);
    const rec = getRecommendedAction(c);
    const rows = todayAccountCandidates(c, {gainsightByCustomer: {}});
    const row = rows.find(x => x.source === 'signal:ready_to_graduate');
    const done = g.gates.filter(x => x.done).length;
    const bare = {headline: rec.key, rows: rows.map(x => x.source).join(',') || 'none', missing: missingGates(c, {excludePaceOutcomes: true}).map(x => x.label).join('; ') || 'none'};
    /* Same account with its Gainsight compliance gates closed: late_gate (severity 2) sits ahead of
       ready_to_graduate (severity 1) in the registry, so the headline only reaches it once those are done. */
    ['sentiment', 'outcomePlan', 'associatedPeopleCSAT'].forEach(k => { c.compliance[k].done = true; c.compliance[k].date = todayISO(); });
    _renderMemoResets.forEach(r => r());
    const rec2 = getRecommendedAction(c);
    const row2 = todayAccountCandidates(c, {gainsightByCustomer: {}}).find(x => x.source === 'signal:ready_to_graduate');
    return {ok: !!sig && !!det && done === g.gates.length && g.gates.length > 0 && sessionsCompletedCount(c) === 8
        && rec2.key === 'ready_to_graduate' && !!row2,
      detail: `ready_to_graduate fired=${!!sig} detect=${JSON.stringify(det)} gates=${done}/${g.gates.length} sessions=${sessionsCompletedCount(c)}/${plannedSessionTotal(c)}; headline with Gainsight gates open=${bare.headline} (missing: ${bare.missing}; Today rows: ${bare.rows}); headline with them closed=${rec2.key} todayRow=${row2 ? JSON.stringify(row2.headline) : 'none'}`};
  });

  run('A5 Scenario B (early exit, week 7): exit reason, held of held, packet reason', () => {
    const c = gsAcct('gsB', {totalSessions: 6, implementationDate: isoAddDays(todayISO(), -49)});
    DATA.customers = [c]; gsHeld(c, [1,2,3,4,5], -49);
    const g = createGoal(c, {type: 'program', text: 'Data program live'});
    g.gates.forEach(x => setGoalGateDone(c, g.id, x.id, true));
    const draft = {verdict: 'met', note: 'Customer runs data collection on their own', exitReason: 'goal_met_early'};
    const pre = validateGraduationDraft(c, draft);
    const done = confirmGraduation(c, draft);
    const ex = getExit(c);
    const tally = `${sessionsCompletedCount(c)}/${plannedSessionTotal(c)}`;
    const line = goalsLine(c, 'Early exit:');
    return {ok: done === true && c.stage === 'graduated' && !!ex && ex.reason === 'goal_met_early' && tally === '5/5'
        && !!line && line.includes('Early exit: Goal met early'),
      detail: `confirmGraduation=${done} validate.ok=${pre.ok} unheld=${pre.unheld.length} exit.reason=${ex && ex.reason} week=${Math.round(daysSince(c.implementationDate) / 7)} tally=${tally} packetLine=${JSON.stringify(line)}`};
  });

  run('A6 Scenario C (goal change): packet line, goal_changed until acknowledged, headlines on Today', () => {
    const c = gsAcct('gsC', {totalSessions: 8});
    DATA.customers = [c]; gsHeld(c, [1,2,3], -40);
    createGoal(c, {type: 'publish', text: 'Publish FY2026 report'});
    const fresh = changePrimaryGoal(c, {type: 'setup_next', text: "Ready for next year's reporting cycle",
      changeReason: 'Report moved to consultants; customer owns next cycle'});
    _renderMemoResets.forEach(r => r());
    const want = `Changed ${fmtDate(todayISO())}: Publish FY2026 report → Ready for next year's reporting cycle, because Report moved to consultants; customer owns next cycle.`;
    const line = goalsLine(c, 'Changed ');
    const def = SIGNAL_DEFS.find(d => d.key === 'goal_changed');
    const before = !!def.detect(c);
    const recBefore = getRecommendedAction(c);
    const rowBefore = todayAccountCandidates(c, {gainsightByCustomer: {}}).find(x => x.source === 'signal:goal_changed');
    const acked = ackGoalChange(c);
    _renderMemoResets.forEach(r => r());
    const after = !!def.detect(c);
    const recAfter = getRecommendedAction(c);
    const rowAfter = todayAccountCandidates(c, {gainsightByCustomer: {}}).find(x => x.source === 'signal:goal_changed');
    return {ok: !!fresh && line === want && before === true && after === false && acked === true
        && recBefore.key === 'goal_changed' && !!rowBefore && recAfter.key !== 'goal_changed' && !rowAfter,
      detail: `packetLine=${JSON.stringify(line)} firedBeforeAck=${before} firedAfterAck=${after} headlineBefore=${recBefore.key} (${JSON.stringify(recBefore.action)}) todayRowBefore=${!!rowBefore} headlineAfter=${recAfter.key} todayRowAfter=${!!rowAfter}`};
  });

  run('A7 FR account (empty gates): goal, verdict, graduate; packet "0 gates"', () => {
    const c = gsAcct('gsFR', {module: 'Financial Reporting', totalSessions: 6});
    DATA.customers = [c]; gsHeld(c, [1,2,3,4,5,6], -45);
    const g = createGoal(c, {type: 'publish', text: 'File the 10-K'});
    const gates = g.gates.length;
    const done = confirmGraduation(c, {verdict: 'partly', note: 'Filing done, review cycle still manual'});
    const p = primaryGoal(c);
    const line = goalsLine(c, 'Gates:');
    return {ok: gates === 0 && done === true && c.stage === 'graduated' && !!p && p.verdict === 'partly' && line === 'Gates: 0 gates',
      detail: `gates=${gates} confirmGraduation=${done} stage=${c.stage} verdict=${p && p.verdict} exit=${JSON.stringify(c.exit)} packetLine=${JSON.stringify(line)}`};
  });

  run('A8 met verdict with open gates: asks for a note, does not block', () => {
    const c = gsAcct('gsOpen', {totalSessions: 8});
    DATA.customers = [c]; gsHeld(c, [1,2,3,4,5,6,7,8], -60);
    const g = createGoal(c, {type: 'publish', text: 'Publish FY2026 report'});
    g.gates.slice(0, g.gates.length - 2).forEach(x => setGoalGateDone(c, g.id, x.id, true));
    const open = g.gates.filter(x => !x.done).length;
    const noNote = validateGraduationDraft(c, {verdict: 'met', note: ''});
    const withNote = validateGraduationDraft(c, {verdict: 'met', note: 'Customer will file next week'});
    const applied = confirmGraduation(c, {verdict: 'met', note: 'Customer will file next week'});
    const asked = noNote.missing.includes('note') && !!noNote.notePrompt;
    return {ok: open === 2 && asked && withNote.ok === true && applied === true && c.stage === 'graduated',
      detail: `asked=${asked} blocked=${withNote.ok === false} promptLen=${(noNote.notePrompt || '').length} openGates=${open} validateNoNote=${JSON.stringify({ok: noNote.ok, missing: noNote.missing, notePrompt: noNote.notePrompt})} validateWithNote.ok=${withNote.ok} confirmGraduation=${applied}`};
  });

  const failed = results.filter(r => !r.ok).length;
  return {passed: results.length - failed, failed, results};
};
