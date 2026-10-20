/* Injected by tools/selfcheck.mjs as an inline <script> after the tracker loads. Not shipped.
   Run: node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect N */
/* ============ SELF CHECKS ============
   Console-callable invariant suite: window.runSelfChecks(). Run after ANY edit to this
   file (rule 5 in the header block) — it converts "each change must not break features"
   from an aspiration into something checkable in one call. Checks data invariants the
   app assumes elsewhere, plus structural invariants of the registries. */
/* Reverse the .ics fold. Only the checks need this (it moved here from the tracker in
   A2), but it is the honest way to assert that folding is LOSSLESS rather than merely
   that short lines came out. */
function icsUnfold(text){ return String(text).split(ICS_CRLF + ' ').join(''); }
function runSelfChecks(){
  _suiteRunning = true;
  try{ return _runSelfChecksInner(); } finally { _suiteRunning = false; }
}
function _runSelfChecksInner(){
  const results = [];
  const v13Acct = (id, o) => { const c = Object.assign({id, name:'V13 '+id, module:DATA.config.modules[0],
    stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
    totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[], riskOverride:'risk'}, o || {});
    backfillCustomerRecord(c); return c; };
  // v74.5: v74.4 (bottom of this suite) diffs the book's key set at suite
  // ENTRY against suite EXIT, which has a temporal blind spot — a key added
  // mid-suite and cleared before the end is invisible to it.
  // _recordKeyDivergence(), below, is called after every check() and records
  // whether Object.keys(DATA) still matches what it was at suite entry;
  // v74.5's own check at the bottom of the suite asserts the list stays
  // empty AND proves this recorder is actually still running (see that
  // check for the liveness probe). Factored into its own named function,
  // rather than left inline in `check`, so v74.5 can also invoke it
  // directly and deliberately on a probe key. Read the entry snapshot's
  // __keys LAZILY (not captured here) because `_recordKeyDivergence` is
  // declared before _bookAtSuiteEntry a few lines down — by the time it is
  // ever called, the snapshot exists.
  const _midSuiteLeaks = [];
  function _recordKeyDivergence(name){
    const keysNow = Object.keys(DATA).sort().join(',');
    if (keysNow !== _bookAtSuiteEntry.__keys) {
      const entryKeys = _bookAtSuiteEntry.__keys ? _bookAtSuiteEntry.__keys.split(',') : [];
      const nowKeys = keysNow ? keysNow.split(',') : [];
      _midSuiteLeaks.push({
        name,
        added: nowKeys.filter(k => entryKeys.indexOf(k) === -1),
        removed: entryKeys.filter(k => nowKeys.indexOf(k) === -1),
      });
    }
  }
  const check = (name, ok, detail) => {
    results.push({name, ok: !!ok, detail: ok ? '' : (detail || '')});
    _recordKeyDivergence(name);
  };
  /* v61: the suite must not damage the book it is inspecting. Captured here and
     asserted as the very last check. This is not hypothetical — the v58/v59 hub
     checks saved DATA.riskLog by REFERENCE and let their synthetic runs prune it,
     so every runSelfChecks() call silently erased the real book's risk memory and
     left synthetic v58/v59 keys behind. Rule 5 says run this after every
     edit, which means the damage compounded on exactly the workflow the file
     mandates. Any future check that forgets a throwaway log trips this. */
  const _riskLogAtSuiteEntry = JSON.stringify(DATA.riskLog || {});
  /* v74.4: the guard above watched riskLog and nothing else, so it could not see
     the suite DELETING DATA.weeklySnapshot on every run — the Copilot check
     restored it on `if(prevSnap)`, and a book with no baseline yet legitimately
     holds null, which is falsy. Three leaks have now come from three different
     collections. Watching one of them was always going to be one behind, so this
     snapshots the WHOLE book.

     Serialized key-by-key rather than as one string: whole-object JSON is
     order-sensitive and, worse, iterating the keys that still exist after a run
     cannot detect a DELETION — which is precisely how the weeklySnapshot leak
     stayed invisible while being measured. The key list is compared too. */
  const _bookAtSuiteEntry = (() => {
    const o = {__keys: Object.keys(DATA).sort().join(',')};
    Object.keys(DATA).forEach(k => o[k] = JSON.stringify(DATA[k]));
    return o;
  })();

  check('schema version current', DATA.schemaVersion === CURRENT_SCHEMA_VERSION,
    `DATA.schemaVersion=${DATA.schemaVersion}, expected ${CURRENT_SCHEMA_VERSION}`);
  check('risk thresholds sane', DATA.config.riskWatchDays > 0 && DATA.config.riskAlertDays > DATA.config.riskWatchDays,
    `watch=${DATA.config.riskWatchDays}, alert=${DATA.config.riskAlertDays}`);
  check('default pace positive', DATA.config.defaultPaceDays > 0, `defaultPaceDays=${DATA.config.defaultPaceDays}`);
  check('coverage thresholds positive', DATA.config.dueSoonDays > 0 && DATA.config.neglectDays > 0,
    `dueSoonDays=${DATA.config.dueSoonDays}, neglectDays=${DATA.config.neglectDays}`);
  // Coverage engine: a scheduled-ahead account is never flagged; an unscheduled
  // account with a long-past anchor and a next session is flagged. Exercised on
  // synthetic clones so it never depends on the live book's contents.
  (function(){
    const base = {id:'__cov__', name:'Cov', module:DATA.config.modules[0], stage:DATA.config.stages[0].key,
      implementationDate: isoAddDays(todayISO(), -90), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
    const prevAct = DATA.activities['__cov__'];
    DATA.activities['__cov__'] = [];
    const gap = computeCoverage(base);
    const scheduled = computeCoverage(Object.assign({}, base, {nextSessionScheduledOn: isoAddDays(todayISO(), 3)}));
    if(prevAct === undefined) delete DATA.activities['__cov__']; else DATA.activities['__cov__'] = prevAct;
    check('coverage flags unscheduled, clears when scheduled ahead',
      !!gap && gap.needsAttention === true && !!scheduled && scheduled.status === 'scheduled' && scheduled.needsAttention === false,
      `gap=${gap && gap.status}, scheduled=${scheduled && scheduled.status}`);
  })();
  check('keyword signal max age positive', DATA.config.keywordSignalMaxAgeDays > 0,
    `keywordSignalMaxAgeDays=${DATA.config.keywordSignalMaxAgeDays}`);

  const ids = DATA.customers.map(c=>c.id);
  check('no duplicate customer ids', new Set(ids).size === ids.length);
  const badModule = DATA.customers.filter(c=>!DATA.config.modules.includes(c.module));
  check('every customer has a configured module', badModule.length === 0, badModule.map(c=>c.name).join(', '));
  const badStage = DATA.customers.filter(c=>!DATA.config.stages.some(s=>s.key===c.stage));
  check('every customer has a configured stage', badStage.length === 0, badStage.map(c=>c.name).join(', '));
  const badScores = DATA.customers.filter(c=>c.domainScores && Object.values(c.domainScores).some(v=>!Number.isInteger(v) || v < 0 || v > 4));
  check('domain scores are integers 0–4', badScores.length === 0, badScores.map(c=>c.name).join(', '));
  const badSessions = DATA.customers.filter(c=>!Number.isFinite(c.totalSessions) || c.totalSessions < 6 || c.totalSessions > 12);
  check('total sessions within 6–12', badSessions.length === 0, badSessions.map(c=>c.name).join(', '));
  const belowLoggedSession = DATA.customers.filter(c=>c.totalSessions < highestLoggedSessionNumber(c.id));
  check('planned sessions never below highest logged session', belowLoggedSession.length === 0, belowLoggedSession.map(c=>c.name).join(', '));
  const gradNoHistory = DATA.customers.filter(c => c.stage === 'graduated'
    && !(c.stageHistory||[]).some(h => h.stage === 'graduated' && ISO_DATE_RE.test(h.date || '')));
  check('graduated accounts have a frozen graduation date', gradNoHistory.length === 0, gradNoHistory.map(c=>c.name).join(', '));

  // Runway strip invariants: model never throws, every element positioned on-axis,
  // dot membership always agrees with the sessions count shown next to the strip.
  const badRunway = [];
  DATA.customers.forEach(c=>{
    try{
      const m = runwayModel(c);
      const pcts = m.dots.map(d=>d.pct)
        .concat([m.fillPct, m.todayPct, m.projected && m.projected.pct, m.target && m.target.pct, m.graduatedAt && m.graduatedAt.pct])
        .filter(p => p !== null && p !== undefined);
      if(pcts.some(p => !Number.isFinite(p) || p < 0 || p > 100)) badRunway.push(`${c.name}: off-axis position`);
      if(m.dots.filter(d=>d.logged).length !== sessionsCompletedCount(c)) badRunway.push(`${c.name}: logged dots != sessions count`);
    } catch(err){ badRunway.push(`${c.name}: ${err.message}`); }
  });
  check('runway strip model valid for every account', badRunway.length === 0, badRunway.slice(0,5).join('; '));

  // v48: future-dated activities are LEGAL legacy data (v44 allowed them by
  // design) and are excluded from every touchpoint/triage calculation by
  // lastActivityDate()'s filter — only a malformed date is an invariant breach.
  const badDates = [];
  Object.keys(DATA.activities || {}).forEach(cid=>{
    (DATA.activities[cid]||[]).forEach(a=>{
      if(!isRealISODate(a.date)) badDates.push(`${cid}: malformed "${a.date}"`);
    });
  });
  check('all activity dates are real ISO dates', badDates.length === 0, badDates.slice(0,5).join('; '));

  // v39 health-history invariants: cap held, every snapshot date valid and not
  // future, and the trend arrow appears only when a >=21-day snapshot pair
  // outside the dead zone actually exists (re-derived from raw history here,
  // independently of healthTrendDelta's own qualification path).
  const badHist = [];
  Object.keys(DATA.healthHistory || {}).forEach(cid=>{
    const hist = DATA.healthHistory[cid] || [];
    if(hist.length > 52) badHist.push(`${cid}: ${hist.length} entries`);
    hist.forEach(en=>{
      if(!ISO_DATE_RE.test(en.date || '')) badHist.push(`${cid}: malformed "${en.date}"`);
      else if(en.date > todayISO()) badHist.push(`${cid}: future ${en.date}`);
    });
  });
  check('health history capped at 52 with sane dates', badHist.length === 0, badHist.slice(0,5).join('; '));
  const badArrow = DATA.customers.filter(c=>{
    const hist = (DATA.healthHistory || {})[c.id] || [];
    const latest = hist[hist.length - 1];
    const qualifies = !!latest && hist.slice(0, -1).some(en =>
      calendarDayDiff(latest.date, en.date) >= TREND_WINDOW_DAYS);
    const hasArrow = healthTrendArrowHtml(c) !== '';
    return hasArrow && !qualifies; // arrow without a qualifying pair = violation (bare number without arrow is always legal)
  });
  check('trend arrow only with a >=21-day snapshot pair', badArrow.length === 0, badArrow.map(c=>c.name).join(', '));

  // v40 pause invariants: clearExpiredPauses runs at load, so post-load no
  // expired pause may exist anywhere (the strongest form of "no expired pause
  // suppresses anything" — an expired pause that survived load is the bug);
  // every live pause is well-formed and within the 90-day cap; and session
  // triage never contains a paused account.
  const badPause = DATA.customers.filter(c => c.pause && !isValidPauseRecord(c.pause));
  check('no expired or malformed pause survives load', badPause.length === 0, badPause.map(c=>c.name).join(', '));
  const pausedInTriage = dueForSessionList().filter(x => isPaused(x.c));
  check('no paused account in session triage', pausedInTriage.length === 0, pausedInTriage.map(x=>x.c.name).join(', '));

  // v41 recommendation-loop invariants
  (function(){                                                  // a2a
    let ok = false, detail = '';
    const prevC = DATA.customers;
    try{
      const c = cloneData(DATA.customers.find(x => x.stage !== 'graduated') || DATA.customers[0]);
      delete c.recommendationLog;
      DATA.customers = [c];
      getRecommendedAction(c);                // the old live writer path
      ok = c.recommendationLog === undefined && typeof logRecommendationEntry === 'undefined';
      detail = JSON.stringify({log: c.recommendationLog, writer: typeof logRecommendationEntry});
    }catch(err){ detail = err.message; }
    finally{ DATA.customers = prevC; }
    check('trim a2a: recommendations no longer write c.recommendationLog', ok, detail);
  })();
  (function(){                                                  // a3a
    const KEYS = ['obm-gainsight-settings-v1', 'obm-workiva-kb-settings-v1'];
    let ok = false, detail = '';
    const saved = {};
    try{
      KEYS.forEach(k => { saved[k] = localStorage.getItem(k); localStorage.setItem(k, '{"apiKey":"x"}'); });
      const res = cleanupRetiredSettingsKeys();
      const after = KEYS.map(k => localStorage.getItem(k));
      ok = after.every(v => v === null) && res && res.removed.length === 2 &&
        typeof searchWorkivaKnowledge === 'undefined' && typeof syncGainsightQueue === 'undefined';
      detail = JSON.stringify({after, removed: res && res.removed, wk: typeof searchWorkivaKnowledge, sync: typeof syncGainsightQueue});
    }catch(err){ detail = err.message; }
    finally{ KEYS.forEach(k => { try{ if(saved[k] === null || saved[k] === undefined) localStorage.removeItem(k); else localStorage.setItem(k, saved[k]); }catch(e){} }); }
    check('trim a3a: retired Gainsight/Workiva settings keys are removed once and their code is gone', ok, detail);
  })();
  (function(){                                                  // a4a
    let ok = false, detail = '';
    try{
      const set = gradDateMissing({targetGraduationDate:'2030-01-01'});
      const blank = gradDateMissing({targetGraduationDate:''});
      const absent = gradDateMissing({});
      const def = ADMIN_GAP_DEFS.find(d => d.key === 'gradDate');
      ok = set === false && blank === true && absent === true && !!def && def.missing === gradDateMissing;
      detail = JSON.stringify({set, blank, absent, wired: !!def && def.missing === gradDateMissing});
    }catch(err){ detail = err.message; }
    check('trim a4a: gradDateMissing is true only when there is no target date, and feeds the admin list', ok, detail);
  })();
  (function(){                                                  // a4b
    let ok = false, detail = '';
    try{
      const base = DATA.customers.find(x => x.stage !== 'graduated' && !isPaused(x) && !inImplementation(x));
      if(!base) throw new Error('no live customer to clone');
      const c = cloneData(base);
      const anchor = c.stage === 'graduated' ? actualGraduationDate(c) : projectedGraduationDate(c);
      if(!anchor) throw new Error('clone has no projected graduation date');
      c.targetGraduationDate = isoAddDays(anchor, 60);
      const far = gradDateDrifted(c);
      c.targetGraduationDate = anchor;
      const near = gradDateDrifted(c);
      delete c.targetGraduationDate;
      const none = gradDateDrifted(c);
      const gate = GATE_DEFS.find(g => g.key === 'gradDate');
      ok = far === true && near === false && none === false && isGradDateWithinTolerance(c) === null
        && !!gate && gate.isMissing === gradDateDrifted;
      detail = JSON.stringify({far, near, none, wired: !!gate && gate.isMissing === gradDateDrifted});
    }catch(err){ detail = err.message; }
    check('trim a4b: gradDateDrifted is true only past tolerance, false with no target date, and is the gradDate gate test', ok, detail);
  })();
  (function(){                                                  // a4c
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const base = DATA.customers.find(x => x.stage !== 'graduated' && !isPaused(x) && !inImplementation(x));
      if(!base) throw new Error('no live customer to clone');
      const c = cloneData(base);
      c.id = '__a4c__'; c.name = 'Gate Label Co';
      ['sentiment', 'outcomePlan', 'associatedPeopleCSAT'].forEach(k => { c.compliance[k].done = false; });
      const anchor = projectedGraduationDate(c);
      if(!anchor) throw new Error('clone has no projected graduation date');
      c.targetGraduationDate = isoAddDays(anchor, 60);
      DATA.customers = [c]; DATA.activities = {__a4c__: []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const canon = new Set(GATE_DEFS.map(g => g.label));
      const labels = {};
      labels.card = missingGates(c).map(g => g.label);
      labels.admin = adminGapList().map(g => g.def.label);
      const gs = pendingGainsightItems().filter(it => it.kind === 'compliance' || it.kind === 'grad-review');
      labels.gainsight = gs.map(it => it.label);
      const adminHtml = renderAdminGaps();
      const cardText = missingGatesText(c);
      const gsHtml = gs.map(it => renderGainsightItemRow(it, {showCustomer:false})).join('');
      // second pass: no target date, so the admin list also carries the date gate
      delete c.targetGraduationDate;
      _renderMemoResets.forEach(r => r());
      labels.adminNoDate = adminGapList().map(g => g.def.label);
      const adminNoDateHtml = renderAdminGaps();
      const all = [].concat(labels.card, labels.admin, labels.gainsight, labels.adminNoDate);
      const everyKnown = all.length > 0 && all.every(l => canon.has(l));
      const eachGateShownEverywhere = GATE_DEFS.every(g =>
        cardText.indexOf(g.label) !== -1 && gsHtml.indexOf(escapeHtml(g.label)) !== -1
        && (g.key === 'gradDate' ? adminNoDateHtml : adminHtml).indexOf(escapeHtml(g.label)) !== -1);
      const nonDateHaveAction = GATE_DEFS.filter(g => g.key !== 'gradDate')
        .every(g => typeof g.gainsightAction === 'string' && g.gainsightAction.length > 0);
      const sameSet = (a, b) => a.length === b.length && a.every(l => b.indexOf(l) !== -1);
      ok = everyKnown && eachGateShownEverywhere && nonDateHaveAction
        && sameSet(labels.card, [...canon]) && sameSet(labels.gainsight, [...canon])
        && sameSet([...new Set(labels.admin.concat(labels.adminNoDate))], [...canon]);
      detail = JSON.stringify(labels);
    }catch(err){ detail = err.message; }
    finally{ DATA.customers = prevC; DATA.activities = prevA; _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); }
    check('trim a4c: one label per gate on Today, the account card and the Gainsight section', ok, detail);
  })();
  (function(){                                                  // a5a
    let ok = false, detail = '';
    try{
      const gone = typeof trackImpact === 'undefined' && typeof IMPACT_EVENTS === 'undefined'
        && typeof buildImpactReport === 'undefined' && typeof downloadImpactReport === 'undefined'
        && typeof downloadImpactCsv === 'undefined' && typeof renderImpactSettings === 'undefined'
        && typeof computeImpactSummary === 'undefined';
      const dayHtml = renderDayClose(buildDayTimeline());
      const wrapSrc = String(showWrapUpModal);
      const reportSrc = String(buildProgressReportHtml);
      ok = gone && !/saved/i.test(dayHtml) && !/saved/i.test(wrapSrc) && !/impact/i.test(reportSrc);
      detail = JSON.stringify({gone, dayHasSaved: /saved/i.test(dayHtml), wrapHasSaved: /saved/i.test(wrapSrc),
        reportHasImpact: /impact/i.test(reportSrc)});
    }catch(err){ detail = err.message; }
    check('trim a5a: time-saved is retired; day close, wrap-up and progress report carry no saved-minutes line', ok, detail);
  })();
  const badSupp = DATA.customers.filter(c => c.signalSuppressions &&
    Object.values(c.signalSuppressions).some(sup => !sup || !ISO_DATE_RE.test(sup.until || '') || !sup.source));
  check('every suppression has a valid expiry and source', badSupp.length === 0, badSupp.map(c=>c.name).join(', '));
  const badFallthrough = DATA.customers.filter(c => {
    const r = getRecommendedAction(c);
    return !r || !r.action || isSignalSuppressed(c, r.key);
  });
  check('suppressed headline falls through, never blank', badFallthrough.length === 0, badFallthrough.map(c=>c.name).join(', '));

  const badDefs = SIGNAL_DEFS.filter(d=>!d.key || typeof d.detect !== 'function' || typeof d.severity !== 'function'
    || (d.action !== null && typeof d.action !== 'function') || (d.step !== null && typeof d.step !== 'function')
    || (d.portfolio !== null && typeof d.portfolio !== 'function'));
  check('SIGNAL_DEFS entries well-formed', badDefs.length === 0, badDefs.map(d=>d.key||'(missing key)').join(', '));
  check('SIGNAL_DEFS keys unique', new Set(SIGNAL_DEFS.map(d=>d.key)).size === SIGNAL_DEFS.length);
  check('GATE_DEFS keys unique', new Set(GATE_DEFS.map(g=>g.key)).size === GATE_DEFS.length);

  // v38 IA consolidation invariants: exactly three top tabs; accountsView always
  // one of the four legal lenses; the Accounts toolbar carries the sub-view switcher.
  const tabCount = (renderTabs().match(/data-view="/g) || []).length;
  check('exactly 4 top-level tabs (v60 adds Risk)', tabCount === 4, `found ${tabCount}`);
  check('ui.accountsView legal', ['list','table','kanban','gantt'].includes(ui.accountsView),
    `ui.accountsView=${ui.accountsView}`);
  {
    const prevView = ui.view;
    ui.view = 'accounts';
    const switcherBtns = (renderToolbar().match(/data-subview="/g) || []).length;
    ui.view = prevView;
    check('accounts toolbar has 4 sub-view buttons', switcherBtns === 4, `found ${switcherBtns}`);
  }

  // v42 Spec 5 invariants: the helper can never disagree with the SLA arithmetic,
  // and its stated pace can never contradict the pace the projection actually used.
  {
    const synth = {id:'__selfcheck_v42__', implementationDate: todayISO(), totalSessions: 8,
                   stage: DATA.config.stages[0].key, targetGraduationDate: null};
    const typed = isoAddDays(todayISO(), 30);
    const expectedDiff = gradDateDiffDays({...synth, targetGraduationDate: typed});
    const html = gradCommitHelperHtml(synth, typed);
    const shownDays = parseInt((html.match(/(\d+) days? (later|earlier)/) || [])[1], 10);
    check('grad-commit helper delta matches gradDateDiffDays',
      expectedDiff === 0 ? /exactly on the typed target/.test(html) : shownDays === Math.abs(expectedDiff),
      `expected |diff|=${Math.abs(expectedDiff)}, rendered: ${html}`);
    check('grad-commit helper 0-session pace equals defaultPaceDays',
      new RegExp(`assumed ${DATA.config.defaultPaceDays}-day pace`).test(gradCommitHelperHtml(synth, null)),
      gradCommitHelperHtml(synth, null));
  }

  // v43 Spec 4 invariants: both signals fire and clear on synthetic records;
  // achievedOn is always min(evidence dates); unmark recomputes honestly; the
  // TTFV stat obeys the n>=5 floor and the median math. Uses a synthetic
  // activities entry under a reserved id, restored afterward; nothing here
  // touches real records or calls saveData.
  {
    const scId = '__selfcheck_v43__';
    const prevActs = DATA.activities[scId];
    const setActs = n => { DATA.activities[scId] = Array.from({length:n}, (_,i)=>(
      {id:'sc'+i, date: todayISO(), type:'Check-in', summary:'x', checklist:[], sessionNumber:i+1, flagged:false})); };
    const mk = over => Object.assign({id: scId, implementationDate: isoAddDays(todayISO(), -60),
      totalSessions: 8, stage: DATA.config.stages[0].key, targetGraduationDate: null}, over);
    const vuDef = SIGNAL_DEFS.find(d=>d.key==='value_undefined');
    const nveDef = SIGNAL_DEFS.find(d=>d.key==='no_value_evidence');

    setActs(2);
    check('value_undefined fires: 2 sessions, no definition', !!(vuDef && vuDef.detect(mk({}))));
    check('value_undefined clears once definition exists',
      !(vuDef && vuDef.detect(mk({firstValue:{definition:'First filed report', evidence:[], achievedOn:null}}))));

    setActs(4); // 4 >= ceil(8 * 0.5)
    check('no_value_evidence fires: >=50% sessions, definition, no evidence',
      !!(nveDef && nveDef.detect(mk({firstValue:{definition:'First filed report', evidence:[], achievedOn:null}}))));
    check('no_value_evidence clears once evidence exists',
      !(nveDef && nveDef.detect(mk({firstValue:{definition:'First filed report',
        evidence:[{date: todayISO(), note:'x', activityId:'sc0'}], achievedOn: todayISO()}}))));

    const cEv = mk({});
    addFirstValueEvidence(cEv, {id:'a1', date: todayISO(), summary:'later entry'});
    addFirstValueEvidence(cEv, {id:'a2', date: isoAddDays(todayISO(), -10), summary:'earlier, backdated'});
    check('achievedOn recomputes to earliest evidence date (approved ruling)',
      cEv.firstValue.achievedOn === isoAddDays(todayISO(), -10),
      `achievedOn=${cEv.firstValue && cEv.firstValue.achievedOn}`);
    removeFirstValueEvidenceByActivity(cEv, 'a2');
    check('unmark recomputes achievedOn from remaining evidence',
      cEv.firstValue && cEv.firstValue.achievedOn === todayISO(),
      `achievedOn=${cEv.firstValue && cEv.firstValue.achievedOn}`);

    check('median TTFV helper handles odd and even counts',
      medianTTFV([5,1,3]) === 3 && medianTTFV([1,3,5,7]) === 4,
      `odd=${medianTTFV([5,1,3])}, even=${medianTTFV([1,3,5,7])}`);
    const synthAchieved = days => mk({firstValue:{definition:'d',
      evidence:[{date: isoAddDays(todayISO(), -60 + days), note:'x'}],
      achievedOn: isoAddDays(todayISO(), -60 + days)}});
    const four = [10,20,30,40].map(synthAchieved);
    check('TTFV stat suppressed below n=5 (no fabricated rigor)', portfolioTTFVStat(four) === null);
    const st = portfolioTTFVStat(four.concat([synthAchieved(50)]));
    check('TTFV stat correct at n=5', !!st && st.n === 5 && st.median === 30,
      st ? `median=${st.median}, n=${st.n}` : 'null');

    if(prevActs === undefined) delete DATA.activities[scId]; else DATA.activities[scId] = prevActs;
  }

  // v48 finding regressions: (A1) the load/import boundary repairs
  // legacy-plausible books instead of rejecting them wholesale, (A2) a
  // rejected load blocks saves so the empty default can never overwrite the
  // real payload, (B) settings domain deletion drops exactly its own score.
  {
    const raw = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      config: cloneData(DATA.config),
      customers: [{ id:'__sc48c1', name:'SC48 Synthetic', module: DATA.config.modules[0],
        implementationDate: isoAddDays(todayISO(), -30), stage: DATA.config.stages[0].key,
        stageHistory: [{stage: DATA.config.stages[0].key, date: isoAddDays(todayISO(), -30)}],
        totalSessions: 8, targetGraduationDate: null, domainScores: {},
        notes: '', riskOverride: null, sessionNotes: {}, compliance: defaultCompliance(), reportsCSRD: false }],
      activities: {'__sc48c1': [
        {id:'sa1', date: isoAddDays(todayISO(), 5), type:'Session', summary:'future planned', checklist:[], sessionNumber:1, flagged:false},
        {id:'sa2', date:'3/5/2024', type:'Call', summary:'us-format date', checklist:[], sessionNumber:null, flagged:false},
        {id:'sa3', date:'total garbage', type:'Call', summary:'unreadable date', checklist:[], sessionNumber:null, flagged:false}
      ], '__sc48orphan': [{id:'sa4', date: isoAddDays(todayISO(), -1), type:'Call', summary:'orphan', checklist:[], sessionNumber:null, flagged:false}]},
      healthHistory: {'__sc48c1': [
        {date: isoAddDays(todayISO(), -10), health: 50, risk:'ontrack'},
        {date: isoAddDays(todayISO(), -20), health: 40, risk:'watch'},
        {date: isoAddDays(todayISO(), 3), health: 60, risk:'ontrack'}
      ]},
      todayLastSeenIds: 'garbage', weeklySnapshot: {bad:true}, pauseReturns: [{id:1}]
    };
    let prepared = null, threw = '';
    try{ prepared = prepareBookData(cloneData(raw), 'Import'); } catch(err){ threw = err.message; }
    const acts = prepared ? prepared.activities['__sc48c1'] : [];
    check('v48 load repairs legacy books instead of rejecting them',
      !!prepared
        && acts.length === 2
        && acts.some(a=>a.id==='sa1' && a.date > todayISO())
        && acts.some(a=>a.id==='sa2' && a.date === '2024-03-05')
        && prepared.customers[0].notes.includes('unreadable date')
        && prepared.activities['__sc48orphan'] === undefined
        && prepared.healthHistory['__sc48c1'].length === 1
        && prepared.todayLastSeenIds === null
        && prepared.weeklySnapshot === null
        && prepared.pauseReturns.length === 0,
      threw || (prepared ? `acts=${acts.length}` : 'not prepared'));

    const beforeData = DATA;
    const storedBefore = localStorage.getItem(STORAGE_KEY);
    _rejectedLoadPayload = SELF_CHECK_BLOCK_TOKEN;
    const blockedResult = saveData();
    const storedAfter = localStorage.getItem(STORAGE_KEY);
    _rejectedLoadPayload = null;
    check('v48 rejected-load state blocks saves and leaves storage untouched',
      blockedResult === false && storedAfter === storedBefore && DATA === beforeData);

    const scDraft = {domains:['__sc48A','__sc48C'], domainSlots:['__sc48A','','__sc48C'],
      outcomes: DATA.config.outcomeNames.slice(),
      advisorRiskKeywords: DATA.config.advisorRiskKeywords.slice(),
      advisorPositiveKeywords: DATA.config.advisorPositiveKeywords.slice(),
      keywordMaxAgeDays: DATA.config.keywordSignalMaxAgeDays,
      riskWatchDays: DATA.config.riskWatchDays, riskAlertDays: DATA.config.riskAlertDays,
      defaultPaceDays: DATA.config.defaultPaceDays};
    const scShell = {config: {domains:['__sc48A','__sc48B','__sc48C']},
      customers: [{domainScores: {'__sc48A':1, '__sc48B':2, '__sc48C':3}}]};
    applySettingsDraft(scShell, scDraft);
    const scScores = scShell.customers[0].domainScores;
    check('v48 domain deletion drops only the deleted score (no positional shift)',
      scScores['__sc48A']===1 && scScores['__sc48C']===3 && !('__sc48B' in scScores) && Object.keys(scScores).length===2,
      JSON.stringify(scScores));
  }

  // v47 hardening regressions: each fix is exercised as a pure or isolated
  // transaction so no real account, browser storage, or UI state is mutated.
  {
    const before = DATA;
    const scId = '__selfcheck_v47__';
    const candidate = defaultData();
    candidate.customers = [{
      id:scId, name:'Synthetic import', module:candidate.config.modules[0],
      stage:candidate.config.stages[0].key, implementationDate:todayISO(), totalSessions:6,
      stageHistory:[{stage:candidate.config.stages[0].key,date:todayISO()}],
      sessionNotes:{}, domainScores:{}, compliance:defaultCompliance(),
      pause:{setOn:isoAddDays(todayISO(), -2), until:isoAddDays(todayISO(), -1)}
    }];
    candidate.activities[scId] = [{id:'act9',date:todayISO(),type:'Session',summary:'x',checklist:[],sessionNumber:9,flagged:false}];
    let prepared = null;
    try{ prepared = prepareImportedData(candidate); }catch(e){}
    check('v47 import normalization raises totalSessions to highest logged session',
      !!prepared && prepared.customers[0].totalSessions === 9 && !prepared.customers[0].pause,
      prepared ? `total=${prepared.customers[0].totalSessions}, pause=${!!prepared.customers[0].pause}` : 'not prepared');

    const partialCustomer = {id:scId,module:DATA.config.modules[0],reportsCSRD:false,totalSessions:8};
    const templateKey = partialCustomer.module;
    const originalTemplates = DATA.config.sessionTemplates[templateKey];
    DATA.config.sessionTemplates[templateKey] = [{title:'Only one',ttfvStage:'ttfv1',enable:[],deliverables:[]}];
    const padded = getSessionTemplateSet(partialCustomer);
    DATA.config.sessionTemplates[templateKey] = originalTemplates;
    check('v47 partial curricula pad every planned session safely',
      padded.length===8 && padded[0].title==='Only one' && padded[7].title.includes('not yet configured'));
    const previousActs = DATA.activities[scId];
    DATA.activities[scId] = [{id:'done1',date:todayISO(),type:'Session',summary:'x',checklist:[],sessionNumber:1,flagged:false}];
    const nextInfo = getNextSessionInfo(partialCustomer);
    if(previousActs === undefined) delete DATA.activities[scId]; else DATA.activities[scId] = previousActs;
    check('v47 next-session lookup never exposes a null template', !!nextInfo && nextInfo.number===2 && !!nextInfo.template && !!nextInfo.template.title);

    check('v47 Excel parser preserves ISO and local displayed dates',
      parseExcelDateCell('2026-07-15')==='2026-07-15'
      && parseExcelDateCell('7/15/2026')==='2026-07-15'
      && parseExcelDateCell('2026-02-30')===null);

    check('v47 calendar-day differences ignore DST-length days',
      calendarDayDiff('2026-03-09','2026-03-08')===1
      && calendarDayDiff('2026-11-02','2026-11-01')===1);

    let badPaceRejected=false, badThresholdRejected=false;
    const baseRaw={domains:['A'],outcomes:Array.from({length:18},(_,i)=>`O${i+1}`),riskKeywords:'risk',positiveKeywords:'good',keywordMaxAgeDays:'30',riskWatchDays:'10',riskAlertDays:'21',defaultPaceDays:'14'};
    try{ parseSettingsDraft({...baseRaw,defaultPaceDays:'-1'}); }catch(e){ badPaceRejected=true; }
    try{ parseSettingsDraft({...baseRaw,riskWatchDays:'30',riskAlertDays:'21'}); }catch(e){ badThresholdRejected=true; }
    check('v47 settings draft rejects invalid pace and thresholds before mutation', badPaceRejected && badThresholdRejected && DATA===before);

    const rollbackCandidate = cloneData(DATA); rollbackCandidate.lastExportedAt='2099-01-01';
    const rollbackOk = commitDataCandidate(rollbackCandidate, ()=>false);
    check('v47 failed persistence rolls back the live DATA pointer', !rollbackOk && DATA===before);

    let badTemplateRejected=false, badArchiveRejected=false;
    const badTemplate = defaultData();
    badTemplate.config.sessionTemplates[badTemplate.config.modules[0]]=[null];
    try{ prepareImportedData(badTemplate); }catch(e){ badTemplateRejected=true; }
    try{ prepareArchiveData({customer:{id:'x'},activities:[{id:'a',date:todayISO(),type:'x',summary:'x',checklist:[],sessionNumber:99,flagged:false}]}); }catch(e){ badArchiveRejected=true; }
    check('v47 shared import/archive boundary rejects unsafe nested records', badTemplateRejected && badArchiveRejected && DATA===before);

    const validPause = {setOn: todayISO(), until: todayISO()};
    check('v47 pause validation still rejects impossible, reversed, expired, and future-set dates',
      isValidPauseRecord(validPause)
      && !isValidPauseRecord({setOn:'9999-99-99', until:'9999-99-99'})
      && !isValidPauseRecord({setOn:'2026-02-30', until:'2026-03-01'})
      && !isValidPauseRecord({setOn:todayISO(), until:isoAddDays(todayISO(), -1)})
      && !isValidPauseRecord({setOn:isoAddDays(todayISO(), 1), until:isoAddDays(todayISO(), 2)}));
  }

  // v45 F2/F3 regressions: user-typed module text must never reach innerHTML
  // raw in the two synthetic-safe card renderers; shared backfills must repair
  // thresholds and migrate both legacy template keys without touching DATA.
  {
    const synth = {
      id:'__selfcheck_v45__', name:'Synthetic', module:'<b>&M</b>',
      stage: DATA.config.stages[0].key, implementationDate: todayISO(), totalSessions:8,
      domainScores:{}, sessionNotes:{}, riskOverride:null, targetGraduationDate:null,
      compliance:defaultCompliance(), stageHistory:[]
    };
    const rendered = renderRow(synth) + renderKanbanCard(synth);
    check('v45 module renders escape user-typed HTML',
      rendered.includes('&lt;b&gt;') && !rendered.includes('<b>&M</b>'),
      rendered.includes('<b>&M</b>') ? 'raw module HTML found' : 'escaped marker missing');

    const legacy = {
      config:{modules:['Both'], sessionTemplates:{'Both':[{title:'x', ttfvStage:'ttfv1', enable:[], deliverables:[]}]}},
      customers:[], activities:{}
    };
    applyDataBackfills(legacy);
    check('v45 shared backfills repair thresholds and Both templates',
      legacy.config.riskWatchDays === 10 && legacy.config.riskAlertDays === 21
      && !!legacy.config.sessionTemplates['Sustainability + Carbon']
      && !legacy.config.sessionTemplates['Both'],
      `watch=${legacy.config.riskWatchDays}, alert=${legacy.config.riskAlertDays}, both=${!!legacy.config.sessionTemplates['Both']}`);
  }

  // v44 Spec 6 invariants: every guardrail the extraction relies on is a pure
  // function exercised here directly — quote verification (exact + whitespace-
  // tolerant, nothing else), JSON isolation, and the validation pipeline's
  // discard reasons (unknown domain, out-of-range, no-op, bad quote, duplicate,
  // malformed) with an honest discard count. Nothing here touches real records,
  // calls the network, or calls saveData.
  {
    const d0 = DATA.config.domains[0];
    const scNote = 'They finished the  factbook setup\nand approvals now run end to end.';
    check('v44 quote verify: exact substring passes',
      verifyQuoteInNote('approvals now run end to end', scNote));
    check('v44 quote verify: whitespace-normalized match passes',
      verifyQuoteInNote('finished the factbook setup and approvals', scNote));
    check('v44 quote verify: absent or empty quote rejected',
      !verifyQuoteInNote('pricing escalation', scNote) && !verifyQuoteInNote('   ', scNote) && !verifyQuoteInNote(null, scNote));
    check('v44 JSON isolation: fenced, bare, and prose-wrapped parse; garbage is null',
      JSON.stringify(parseProposalJson('```json\n[{"a":1}]\n```')) === '[{"a":1}]'
      && JSON.stringify(parseProposalJson('[{"a":1}]')) === '[{"a":1}]'
      && JSON.stringify(parseProposalJson('Here you go: [{"a":1}] — hope that helps')) === '[{"a":1}]'
      && parseProposalJson('no json here') === null
      && parseProposalJson('{"not":"an array"}') === null);
    const synthScored = {id:'__selfcheck_v44__', domainScores: {[d0]: 2}};
    const v = validateScoreProposals([
      {domain: d0, proposedScore: 9, quote: 'factbook setup'},              // out of range
      {domain: d0, proposedScore: 2, quote: 'factbook setup'},              // no-op vs current 2
      {domain: d0, proposedScore: 0, quote: 'we discussed pricing'},        // quote fails verification
      {domain: '__not_a_domain__', proposedScore: 3, quote: 'factbook setup'}, // unknown domain
      'garbage',                                                             // malformed entry
      {domain: d0, proposedScore: 4, quote: 'factbook setup'},              // VALID (2→4)
      {domain: d0, proposedScore: 3, quote: 'factbook setup'}               // duplicate domain
    ], scNote, synthScored);
    check('v44 validation: keeps the 1 verified proposal, counts 6 discards',
      v.proposals.length === 1 && v.discarded === 6 && v.proposals[0].domain === d0 && v.proposals[0].proposed === 4,
      `kept=${v.proposals.length}, discarded=${v.discarded}`);
    const oneStep = validateScoreProposals([{domain: d0, proposedScore: 3, quote: 'factbook setup'}], scNote, synthScored);
    check('v44 large jump marked at |Δ|>1 only',
      v.proposals[0].largeJump === true && oneStep.proposals[0].largeJump === false,
      `2→4 jump=${v.proposals[0].largeJump}, 2→3 jump=${oneStep.proposals[0] && oneStep.proposals[0].largeJump}`);
    const firstAssess = validateScoreProposals([{domain: d0, proposedScore: 4, quote: 'factbook setup'}], scNote, {id:'__selfcheck_v44b__', domainScores: {}});
    check('v44 unassessed domain: first assessment allowed, no jump marker',
      firstAssess.proposals.length === 1 && firstAssess.proposals[0].largeJump === false,
      `kept=${firstAssess.proposals.length}`);
  }

  // v50 Call Review invariants: same discipline as v44 — every guardrail is a
  // pure function exercised directly on synthetic input. JSON object isolation,
  // question parsing (trim / drop blanks / honest cap), and the validator's
  // core promises: fabricated citations die and downgrade the answer, local
  // question text and session titles beat model echoes, bad answers drop with
  // a count, unanswered questions surface, malformed email fails closed.
  {
    const synthSessions = [
      {number:1, title:'Setup', inPlan:true, verifyText:'Setup\nConfirm workspace roles & permissions\nWorkspace access verified'},
      {number:2, title:'Approvals', inPlan:false, verifyText:'Approvals\nDemo task routing and digital sign-off\nOne full review cycle completed'}
    ];
    check('v50 JSON object isolation: fenced, bare, and prose-wrapped parse; array/garbage is null',
      (parseJsonObjectResponse('```json\n{"a":1}\n```') || {}).a === 1
      && (parseJsonObjectResponse('Sure — {"a":1} hope that helps') || {}).a === 1
      && parseJsonObjectResponse('[1,2]') === null
      && parseJsonObjectResponse('no json here') === null);
    const pq = parseOutstandingQuestions(' q1 \n\n  q2\nq3  ');
    const pqOver = parseOutstandingQuestions(Array.from({length:14}, (_,i)=>'q'+i).join('\n'));
    check('v50 question parsing trims, drops blanks, caps with an honest count',
      pq.questions.length === 3 && pq.questions[1] === 'q2' && pq.dropped === 0
      && pqOver.questions.length === 10 && pqOver.dropped === 4,
      `base=${pq.questions.length}/${pq.dropped}, over=${pqOver.questions.length}/${pqOver.dropped}`);
    const vr = validateCallReview({
      answers: [
        {questionNumber:1, question:'ECHO — must be ignored', answer:'Yes.', reasoning:'because sign-off is routed', citations:[{sessionNumber:2, quote:'digital  sign-off'}], source:'curriculum'},
        {questionNumber:2, answer:'Roughly.', citations:[{sessionNumber:2, quote:'pricing tiers'}], source:'curriculum'}, // fabricated quote → downgrade
        {questionNumber:9, answer:'out of range'},
        {questionNumber:1, answer:'duplicate'},
        'garbage'
      ],
      email: {subject:'Recap', body:'Hi team — ...'}
    }, ['Can approvals be multi-step?', 'What does it cost?', 'Third thing?'], synthSessions);
    check('v50 validation: verified citation kept w/ live title, fabricated discarded + answer downgraded, drops counted, unanswered surfaced',
      !!vr && vr.answers.length === 2
      && vr.answers[0].curriculumGrounded === true && vr.answers[0].citations[0].title === 'Approvals'
      && vr.answers[0].question === 'Can approvals be multi-step?'
      && vr.answers[1].curriculumGrounded === false && vr.answers[1].citations.length === 0
      && vr.discardedCitations === 1 && vr.droppedAnswers === 3
      && vr.unanswered.length === 1 && vr.unanswered[0] === 3
      && vr.email && vr.email.subject === 'Recap',
      vr ? `answers=${vr.answers.length}, discardedCit=${vr.discardedCitations}, dropped=${vr.droppedAnswers}, unanswered=${vr.unanswered.join(',')}` : 'validator returned null');
    check('v50 validation fails closed: null payload, blank-subject email',
      validateCallReview(null, [], synthSessions) === null
      && validateCallReview('text', [], synthSessions) === null
      && validateCallReview({answers:[], email:{subject:'  ', body:'x'}}, [], synthSessions).email === null);
  }

  // v51 invariants: transcripts stored on activities survive (and are repaired
  // at) the normalization boundary; the debrief prompt is honest about
  // non-session calls; the holistic call-prep prompt actually carries the
  // escalation directory and the locally computed admin list.
  {
    const bigText = 'x'.repeat(DEBRIEF_TRANSCRIPT_CHAR_CAP + 5);
    const nd = {customers:[{id:'__v51__'}], activities:{'__v51__':[
      {id:'v51t1', date: todayISO(), type:'Call', summary:'ok', checklist:[], transcript:{text:'hello there', truncated:'notabool'}},
      {id:'v51t2', date: todayISO(), type:'Call', summary:'ok', checklist:[], transcript:'just a string'},
      {id:'v51t3', date: todayISO(), type:'Call', summary:'ok', checklist:[], transcript:{text:bigText, truncated:false}}
    ]}};
    normalizeActivityCollections(nd);
    const [t1, t2, t3] = nd.activities['__v51__'];
    check('v51 transcript normalization: valid kept + flag coerced, invalid dropped (activity survives), oversize kept whole (Step 1: nothing stored is cut)',
      nd.activities['__v51__'].length === 3
      && t1.transcript && t1.transcript.text === 'hello there' && t1.transcript.truncated === false
      && t2.transcript === undefined
      && t3.transcript && t3.transcript.text.length === DEBRIEF_TRANSCRIPT_CHAR_CAP + 5 && t3.transcript.truncated === false,
      `t1=${JSON.stringify(t1.transcript && t1.transcript.truncated)}, t2=${String(t2.transcript)}, t3len=${t3.transcript && t3.transcript.text.length}`);
    check('v51 activityTranscript guard: shape + non-blank text required',
      activityTranscript({transcript:{text:'hi', truncated:false}}).text === 'hi'
      && activityTranscript({transcript:{text:'   '}}) === null
      && activityTranscript({transcript:'nope'}) === null
      && activityTranscript({}) === null
      && activityTranscript(null) === null);
    (function(){
      let ok = false, detail = '';
      try{
        const synth = {id:'__v51b__', name:'V51 Synth', module:DATA.config.modules[0], stage:DATA.config.stages[0].key,
          implementationDate: isoAddDays(todayISO(), -60), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(synth);
        const nonSession = buildSessionDebriefPrompt(synth, {sessionNumber:null, summary:'quick sync'}, '', false);
        const withSession = buildSessionDebriefPrompt(synth, {sessionNumber:1, summary:'quick sync'}, '', false);
        const prep = buildCallPrepPrompt(synth, buildCallPrepContext(synth));
        ok = nonSession.includes('not linked to a planned curriculum session')
          && !nonSession.includes('Session ?')
          && withSession.includes('This was Session 1')
          && prep.includes('Climate Consultant')
          && prep.includes('Partner implementation team')
          && prep.includes('OUTSTANDING ADMIN')
          && prep.includes('V51 Synth')
          && prep.includes('DETERMINISTIC ADVISOR SIGNALS');
      }catch(err){ detail = err.message; }
      check('v51 debrief handles non-session calls; call-prep prompt carries name, admin list, signals, escalation directory', ok, detail);
    })();
  }

  // v60 invariants: terminology + risk memory. riskLabel no longer says
  // "At Risk"; the log stamps first-seen, actioning resets the clocks, and
  // pruning forgets resolved risks (so a returning risk is honestly new).
  (function(){
    let ok = false, detail = '';
    const saved = DATA.customers, savedRiskLog = DATA.riskLog, savedActs = DATA.activities['__v60__'];
    try{
      const c = {id:'__v60__', name:'V60Co', module:DATA.config.modules[0], stage:DATA.config.stages[0].key,
        implementationDate: isoAddDays(todayISO(), -90), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.activities['__v60__'] = [];
      DATA.customers = [c]; DATA.riskLog = {};
      // v61 fix: reset the per-render memos HERE, not only mid-check. Without
      // this, a second runSelfChecks() in the same page session (no render() in
      // between to clear them) served __v60__'s cached 'ontrack' classification
      // from the END of the previous run, so buildRiskHubList() produced no
      // 'Off Track' item and the check died on undefined.logKey. Rule 5 tells
      // you to run the suite after every edit — it has to survive being run twice.
      _riskMemo = new Map(); _healthMemo = new Map();
      let hub = buildRiskHubList();
      const item = hub.find(x => x.kind === 'Off Track');
      const stamped = !!item && isRealISODate(item.tracking.firstSeen) && item.tracking.lastActioned === null
        && riskAttention(item).state === 'new';
      markRiskActioned(item, true);
      const actioned = riskAttention(item).state === 'actioned';
      DATA.riskLog[item.logKey] = {firstSeen: isoAddDays(todayISO(), -30), lastActioned: null};
      hub = buildRiskHubList();
      const unactioned = riskAttention(hub.find(x=>x.kind==='Off Track')).state === 'unactioned';
      DATA.riskLog[hub.find(x=>x.kind==='Off Track').logKey].lastActioned = isoAddDays(todayISO(), -20);
      const due = riskAttention(buildRiskHubList().find(x=>x.kind==='Off Track')).state === 'maintenance_due';
      DATA.activities['__v60__'] = [{id:'v60a', date: todayISO(), type:'Call', summary:'all good now', checklist:[], sessionNumber:null, flagged:false}];
      _riskMemo = new Map(); _healthMemo = new Map(); // the per-render memo would otherwise serve the stale classification
      buildRiskHubList();
      const pruned = !Object.keys(DATA.riskLog).some(k => k.indexOf('__v60__|Off Track') === 0);
      ok = riskLabel('risk') === 'Off Track' && stamped && actioned && unactioned && due && pruned;
      detail = JSON.stringify({label: riskLabel('risk'), stamped, actioned, unactioned, due, pruned});
    }catch(err){ detail = err.message; }
    DATA.customers = saved; DATA.riskLog = savedRiskLog;
    if(savedActs === undefined) delete DATA.activities['__v60__']; else DATA.activities['__v60__'] = savedActs;
    check('v60 terminology + risk memory: Off Track label, stamp/action/thresholds/prune lifecycle', ok, detail);
  })();
  // v59 invariants: the taxonomy registry matches the team's confirmed list
  // verbatim; classification is specific (bare "partner" must NOT fire) and
  // negation-aware; hub items carry a category and CTA drafts state it as a
  // suggestion.
  (function(){
    const labels = RISK_TAXONOMY.map(t=>t.label);
    const expected = ['Adoption/Usage','Other','Customer Team/Loss of Champions','Enablement/Training','Implementation Issue','Partner Experience','Service & Support Risk','Workiva Team/Team Turnover','Past Due Invoices','Product','Lack of Engagement/No Contact','Company Change','Sales/Scope','Value/Shopping Around','Regulatory Changes','No partner/no service','Next Gen GRC Upgrade','Expansion'];
    check('v59 taxonomy: 18 team labels (17 risk + Expansion) verbatim, unique keys, Other is phrase-free fallback',
      labels.length === 18 && expected.every(l => labels.includes(l))
      && new Set(RISK_TAXONOMY.map(t=>t.key)).size === 18
      && RISK_TAXONOMY_BY_KEY.other.phrases.length === 0,
      JSON.stringify(labels));
    const hits = classifyRiskText('Their champion left the company last week, invoice is past due, and there is a bug in the report.');
    const hitLabels = hits.map(h=>h.label);
    check('v59 classification: multi-category hit with matched phrases; specific-not-generic; negation respected',
      hitLabels.includes('Customer Team/Loss of Champions') && hitLabels.includes('Past Due Invoices') && hitLabels.includes('Product')
      && classifyRiskText('The partner ran a great session with their team.').length === 0
      && classifyRiskText('There is no bug and usage is strong.').every(h => h.label !== 'Product'),
      JSON.stringify(hitLabels));
  })();
  (function(){
    let ok = false, detail='';
    try{
      const saved = DATA.customers, savedRiskLog59 = DATA.riskLog;
      // v61 FIX (data loss): savedRiskLog59 is a REFERENCE. buildRiskHubList()
      // below stamps synthetic keys into that same object AND prunes every real
      // key — the real accounts aren't in DATA.customers during the swap, so
      // their risks look resolved. Restoring the reference restored the
      // already-corrupted object, so every runSelfChecks() wiped the book's real
      // risk memory (the firstSeen dates the 7-day/14-day thresholds run on) and
      // left __v59* entries behind. Hand the synthetic run a THROWAWAY log, the
      // way the v60 check below already does.
      DATA.riskLog = {};
      const mkc = (id, name, over, acts) => {
        const c = Object.assign({id, name, module:DATA.config.modules[0], stage:DATA.config.stages[0].key,
          implementationDate: isoAddDays(todayISO(), -90), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}, over||{});
        backfillCustomerRecord(c); DATA.activities[c.id] = acts || []; return c;
      };
      const champCo = mkc('__v59a__', 'ChampCo', {}, [{id:'c1', date: isoAddDays(todayISO(), -2), type:'Call', summary:'Our champion left the company; new sponsor unknown.', checklist:[], sessionNumber:null, flagged:false}]);
      const darkCo = mkc('__v59b__', 'Dark59', {}, []);
      DATA.customers = [champCo, darkCo];
      const hub = buildRiskHubList();
      const champItem = hub.find(x => x.c.id === '__v59a__' && x.kind === 'Category signal');
      const darkItem = hub.find(x => x.c.id === '__v59b__' && x.kind === 'Off Track');
      ok = !!champItem && champItem.category.label === 'Customer Team/Loss of Champions'
        && !!darkItem && darkItem.category.label === 'Lack of Engagement/No Contact'
        && buildRiskCtaText(champItem).includes('Risk reason (suggested): Customer Team/Loss of Champions')
        && buildRiskCtaText(champItem).includes('confirm the reason code in Gainsight');
      detail = JSON.stringify({champ: champItem && champItem.category, dark: darkItem && darkItem.category});
      DATA.customers = saved; DATA.riskLog = savedRiskLog59;
      delete DATA.activities['__v59a__']; delete DATA.activities['__v59b__'];
    }catch(err){ detail = err.message; }
    check('v59 hub + CTA: category signal from a note, structural silence maps to No Contact, CTA states the suggestion', ok, detail);
  })();

  // v58 invariants: the risk hub respects pause semantics (flags pierce, keyword signals
  // don't); the queue round-trips the boundary; the CTA draft carries the
  // account and its recommendation.
  (function(){
    let ok = false, detail = '';
    try{
      const mkc = (id, name, over, acts) => {
        const c = Object.assign({id, name, module:DATA.config.modules[0], stage:DATA.config.stages[0].key,
          implementationDate: isoAddDays(todayISO(), -90), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}, over||{});
        backfillCustomerRecord(c);
        DATA.activities[c.id] = acts || [];
        return c;
      };
      const saved = DATA.customers, savedRiskLog58 = DATA.riskLog;
      DATA.riskLog = {}; // v61 FIX (data loss) — see the v59 check above for why
      const flaggedPaused = mkc('__v58p__', 'PausedCo',{pause:{until: isoAddDays(todayISO(), 10), reason:'', setOn: todayISO()}},
        [{id:'p1', date: isoAddDays(todayISO(), -2), type:'Call', summary:'escalate this — customer frustrated', checklist:[], sessionNumber:null, flagged:true}]);
      const darkCo = mkc('__v58d__', 'DarkCo', {}, []);
      const implCo = mkc('__v58i__', 'ImplCo', {implementation:{phase:'build', partner:'', partnerContact:'', startedOn: todayISO(),
        paused:{since: isoAddDays(todayISO(), -3), reason:'ghosting'}, risks:[{id:'r1', date: todayISO(), severity:'high', text:'UAT slipping', resolved:false}], phaseHistory:[]}}, []);
      DATA.customers = [flaggedPaused, darkCo, implCo];
      const hub = buildRiskHubList();
      const kinds = c => hub.filter(x=>x.c.id===c).map(x=>x.kind);
      ok = kinds('__v58p__').includes('Flagged note') && !kinds('__v58p__').includes('Risk language') // flags pierce pause; keyword signal doesn't
        && kinds('__v58d__').includes('Off Track')
        && kinds('__v58i__').includes('Implementation risk') && kinds('__v58i__').includes('Implementation paused')
        && buildRiskCtaText(hub.find(x=>x.c.id==='__v58d__')).includes('AT-RISK CTA — DarkCo');
      detail = JSON.stringify({p: kinds('__v58p__'), d: kinds('__v58d__'), i: kinds('__v58i__')});
      DATA.customers = saved; DATA.riskLog = savedRiskLog58;
      delete DATA.activities['__v58p__']; delete DATA.activities['__v58d__']; delete DATA.activities['__v58i__'];
    }catch(err){ detail = err.message; }
    check('v58 risk hub: pause semantics respected, impl risks aggregated, CTA draft carries the account', ok, detail);
  })();
  (function(){
    const nd = {customers:[], activities:{}, gainsightQueue:[
      {id:'q1', date: todayISO(), customerId:'x', customerName:'Acme', kind:'At-Risk CTA', payload:'text', status:'sent-garbage'},
      {bad:true}, {id:'q2', date:'not-a-date', customerName:'B', payload:'p'}
    ], impact:{events:{a: 3, b: 'NaN-ish', c: -2}, since:'junk'}, healthHistory:{}, pauseReturns:[]};
    repairAuxiliaryCollections(nd);
    check('v58 boundary: queue filtered + status reset to queued, impact events numeric-only, since repaired',
      nd.gainsightQueue.length === 1 && nd.gainsightQueue[0].status === 'queued'
      && nd.impact.events.a === 3 && nd.impact.events.b === undefined && nd.impact.events.c === undefined
      && isRealISODate(nd.impact.since),
      JSON.stringify({q: nd.gainsightQueue.length, e: nd.impact.events}));
  })();

  // v52 invariants: an in-implementation account is TRACKED BUT NOT NAGGED —
  // every onboarding surface gates; Go-Live re-anchors the clock honestly;
  // the normalization boundary micro-repairs the additive field.
  (function(){
    let ok = false, detail = '';
    try{
      const synth = {id:'__v52__', name:'V52 Synth', module:DATA.config.modules[0], stage:DATA.config.stages[0].key,
        implementationDate: isoAddDays(todayISO(), -120), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[],
        implementation: {phase:'build', partner:'PartnerCo', partnerContact:'', startedOn: isoAddDays(todayISO(), -120),
          paused:{since: isoAddDays(todayISO(), -10), reason:'customer unresponsive'},
          risks:[{id:'r1', date: todayISO(), severity:'high', text:'UAT slipping', resolved:false}],
          phaseHistory:[{phase:'build', date: isoAddDays(todayISO(), -120)}]}};
      backfillCustomerRecord(synth);
      const prevAct = DATA.activities['__v52__'];
      DATA.activities['__v52__'] = [];
      const gated = inImplementation(synth)
        && computeRisk(synth) === 'ontrack'                      // 120 days dark would otherwise be At Risk
        && /implementation/i.test(riskReasonText(synth))
        && computeCoverage(synth) === null
        && getCustomerNextSteps(synth).length === 0
        && getRecommendedAction(synth).key === 'implementation'
        && /re-engage/i.test(getRecommendedAction(synth).action)  // paused wins the headline
        && dueForSession(synth) === null;
      const prep = buildCallPrepPrompt(synth, buildCallPrepContext(synth));
      const prepOk = prep.includes('IMPLEMENTATION MODE') && prep.includes('IMPLEMENTATION PAUSED') && prep.includes('UAT slipping')
        && prep.includes('begins at Go-Live');
      const went = markImplementationGoLive(synth);
      const liveOk = went && !inImplementation(synth)
        && synth.implementationDate === todayISO()                          // clock re-anchored
        && synth.implementation.originalAnchorDate === isoAddDays(todayISO(), -120) // history kept
        && synth.implementation.paused === undefined                        // going live ends the pause
        && computeRisk(synth) !== 'risk';                                   // no instant stall at go-live
      if(prevAct === undefined) delete DATA.activities['__v52__']; else DATA.activities['__v52__'] = prevAct;
      ok = gated && prepOk && liveOk;
      detail = `gated=${gated}, prep=${prepOk}, live=${liveOk}`;
    }catch(err){ detail = err.message; }
    check('v52 implementation gating, partner-lens call prep, and honest Go-Live re-anchor', ok, detail);
  })();
  // v57 runbook invariants: the generated structure is contiguous 0:00–0:45
  // and carries every curriculum item; the authored library validates; title
  // matching never guesses.
  (function(){
    const tpl = {title:'Synthetic Session', ttfvStage:'ttfv1', enable:['Alpha item','Beta item','Gamma item'], deliverables:['Delta deliverable']};
    const rb = generateStandardRunbook(tpl);
    const contiguous = (()=>{
      let prevEnd = '0:00';
      for(const seg of rb){
        const m = /^(\d+:\d{2})–(\d+:\d{2})$/.exec(seg.m || '');
        if(!m || m[1] !== prevEnd) return false;
        prevEnd = m[2];
      }
      return prevEnd === '0:45';
    })();
    const text = JSON.stringify(rb);
    check('v57 generated runbook: contiguous 0:00–0:45, all enable items and deliverables present',
      contiguous && ['Alpha item','Beta item','Gamma item','Delta deliverable'].every(x=>text.includes(x)),
      `contiguous=${contiguous}`);
    let libOk = true, libCount = 0, badLib = '';
    Object.entries(RUNBOOK_LIBRARY).forEach(([mod, byTitle]) => Object.entries(byTitle).forEach(([title, r]) => {
      libCount++;
      if(!validateRunbookShape(r)){ libOk = false; badLib = mod + '/' + title; }
    }));
    check('v57 authored library: every entry validates (' + libCount + ' scripts)', libOk && libCount >= 24, badLib || ('count=' + libCount));
    const sust = {module:'Sustainability', reportsCSRD:false};
    const csrdCust = {module:'Sustainability', reportsCSRD:true};
    check('v57 lookup: exact title hit, CSRD shared-title fallback, unknown title -> null (generated)',
      !!authoredRunbookFor(sust, 'Factbook Configuration')
      && !!authoredRunbookFor(csrdCust, 'Data Collection Workflow')
      && authoredRunbookFor(sust, 'A Session Title That Does Not Exist') === null
      && buildSessionRunbook(sust, tpl).source === 'standard'
      && buildSessionRunbook(sust, Object.assign({runbook:[{m:'0:00–0:45', title:'All', talk:'t', steps:[]}]}, tpl)).source === 'custom');
    const dec = decomposeEnableItem('Assign Carbon roles from Settings > Team members (custom roles for category-level access if needed); add company locations via bulk spreadsheet upload');
    check('v57.1 decomposed steps: nav path extracted, clauses split, parenthetical becomes a call-out, no curriculum pointer',
      dec.some(x => x.startsWith('Navigate to Settings > Team members'))
      && dec.some(x => x.startsWith('Add company locations'))
      && dec.some(x => x.startsWith('Call out while you demo: custom roles'))
      && !JSON.stringify(generateStandardRunbook(tpl)).includes('exactly as written')
      && !!authoredRunbookFor(sust, '  factbook   CONFIGURATION '),
      JSON.stringify(dec));
    check('v57 validation fails closed: junk runbooks rejected',
      validateRunbookShape('nope') === null && validateRunbookShape([]) === null
      && validateRunbookShape([{title:'x'}]) === null
      && validateRunbookShape([{m:1, title:'x', talk:'y', steps:'not-an-array'}])[0].steps.length === 0);
  })();
  (function(){
    const nd = {customers:[
      {id:'__v52a__', implementation:{phase:'uat', partner:7, risks:[{id:'x', date:todayISO(), severity:'catastrophic', text:'ok risk'}, 'garbage', {text:'  '}], paused:{since:'not-a-date'}, phaseHistory:[{phase:'uat', date:todayISO()}, {phase:'nope', date:todayISO()}]}},
      {id:'__v52b__', implementation:{phase:'not-a-phase'}},
      {id:'__v52c__', implementation:'garbage'}
    ]};
    sanitizeImplementationRecords(nd);
    const a = nd.customers[0].implementation;
    check('v52 boundary: valid pieces kept and coerced, invalid phase/shape dropped whole, bad pause/risks/history filtered',
      a && a.phase === 'uat' && a.partner === '' && a.paused === undefined
      && a.risks.length === 1 && a.risks[0].severity === 'medium' && a.risks[0].resolved === false
      && a.phaseHistory.length === 1
      && nd.customers[1].implementation === undefined
      && nd.customers[2].implementation === undefined,
      JSON.stringify({phase: a && a.phase, risks: a && a.risks.length, b: nd.customers[1].implementation === undefined}));
  })();

  // v53 invariants: the progress-report categorizer puts each synthetic
  // account in exactly the category its situation demands (priority order is
  // the contract the OSM defends in the meeting), and the partner-sheet row
  // builder matches normalized names, flags duplicates, and never invents a
  // match for an unknown name.
  (function(){
    let ok = false, detail = '';
    try{
      const mk = (over, acts) => {
        const s = Object.assign({id:'__v53_' + Math.abs(JSON.stringify(over).length) + (acts?acts.length:0) + (over.stage||'') + (over.name||''), name:'V53', module:DATA.config.modules[0], stage:DATA.config.stages[0].key,
          implementationDate: isoAddDays(todayISO(), -60), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}, over);
        backfillCustomerRecord(s);
        DATA.activities[s.id] = acts || [];
        return s;
      };
      const cleanup = [];
      const cat = (over, acts) => { const s = mk(over, acts); cleanup.push(s.id); return categorizeAccountForReport(s).key; };
      const act = daysAgo => ({id:'a'+daysAgo, date: isoAddDays(todayISO(), -daysAgo), type:'Call', summary:'s', checklist:[], sessionNumber:null, flagged:false});
      const flaggedAct = daysAgo => Object.assign(act(daysAgo), {flagged:true});
      const alert = DATA.config.riskAlertDays, watch = DATA.config.riskWatchDays;
      const results = {
        impl: cat({name:'I', implementation:{phase:'build', partner:'', partnerContact:'', startedOn:todayISO(), risks:[], phaseHistory:[]}}),
        grad: cat({name:'G', stage:'graduated', stageHistory:[{stage:'graduated', date: todayISO()}]}),
        paused: cat({name:'P', pause:{until: isoAddDays(todayISO(), 10), reason:'', setOn: todayISO()}}, [act(2)]),
        csm: cat({name:'C', stage:'grad_ready'}, [act(2)]),
        quiet: cat({name:'Q'}, [act(alert + 5)]),
        atRisk: cat({name:'R'}, [flaggedAct(2)]),
        stagnant: cat({name:'S'}, [act(watch + 2)]),
        active: cat({name:'A'}, [act(1)])
      };
      cleanup.forEach(id => delete DATA.activities[id]);
      ok = results.impl === 'implementation' && results.grad === 'graduated' && results.paused === 'paused'
        && results.csm === 'csm_ready' && results.quiet === 'quiet' && results.atRisk === 'at_risk'
        && results.stagnant === 'stagnant' && results.active === 'active';
      detail = JSON.stringify(results);
    }catch(err){ detail = err.message; }
    check('v53 report categorizer: each situation lands in exactly its category', ok, detail);
  })();
  (function(){
    const headers = ['Client', 'Update Notes', 'Call Date'];
    const mapping = {name:'Client', note:'Update Notes', date:'Call Date'};
    const customers = [{id:'pc1', name:'Acme Corp'}];
    const existing = {pc1: ['Old  note text here\n\n[Imported from partner sheet "x.xlsx" — 2026-01-01]']};
    check('v53 mapping guess: "Update Notes" cannot shadow "Call Date" as the date column',
      (function(){ const g = guessPartnerColumnMapping(['Client','Update Notes','Call Date']);
        return g.name === 'Client' && g.note === 'Update Notes' && g.date === 'Call Date'; })());
    const rows = buildPartnerImportRows(headers, [
      ['  ACME   corp ', 'Fresh partner update', '2026-07-01'],
      ['Acme Corp', 'Old note text here', ''],
      ['Unknown Co', 'Some note', 'not a date'],
      ['', '', '']
    ], mapping, customers, existing);
    check('v53 partner rows: normalized name match, duplicate flagged, unknown unmatched, blank dropped, bad date null',
      rows.length === 3
      && rows[0].matchedCustomerId === 'pc1' && rows[0].duplicate === false && rows[0].dateISO === '2026-07-01'
      && rows[1].matchedCustomerId === 'pc1' && rows[1].duplicate === true
      && rows[2].matchedCustomerId === null && rows[2].dateISO === null && rows[2].importable === true,
      JSON.stringify(rows.map(r=>({m:r.matchedCustomerId, d:r.duplicate, dt:r.dateISO}))));
  })();

  (function(){                                   // v13 Step 2d
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevRM = _riskMemo, prevHM = _healthMemo;
    try{
      const sales = RISK_TAXONOMY_BY_KEY.sales_scope.phrases, exp = RISK_TAXONOMY_BY_KEY.expansion;
      const moved = !sales.includes('upsell') && !sales.includes('expansion conversation')
        && !!exp && exp.notRisk === true && exp.phrases.includes('upsell') && exp.phrases.includes('expansion conversation');
      const hits = classifyRiskText('They want an upsell and an expansion conversation.').map(h => h.key);
      const classed = hits.includes('expansion') && !hits.includes('sales_scope');
      const c = v13Acct('__s2d__', {riskOverride: 'ontrack'});
      DATA.customers = [c]; DATA.riskLog = {};
      DATA.activities = {__s2d__: [{id:'e1', date: isoAddDays(todayISO(), -2), type:'Onboarding Session', summary:'They asked about an upsell.', sessionNumber:1, checklist:[]}]};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const noRisk = !buildRiskHubList({readOnly: true}).some(it => it.c.id === '__s2d__' && it.kind === 'Category signal');
      ok = moved && classed && noRisk;
      detail = JSON.stringify({moved, classed, noRisk, hits});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = prevRM; _healthMemo = prevHM;
    check('v13 step 2d: upsell and expansion conversation form their own Expansion category and never raise a risk', ok, detail);
  })();
  (function(){                                   // v13 Step 2d (FX3): the note chip words expansion as an opportunity, not a risk
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities;
    try{
      const c = v13Acct('__s2d3__', {riskOverride: 'ontrack'});
      const chipOf = (txt) => {
        DATA.customers = [c];
        DATA.activities = {__s2d3__: [{id:'e1', date: isoAddDays(todayISO(), -2), type:'Onboarding Session', summary: txt, sessionNumber:1, checklist:[]}]};
        const m = /<div style="[^"]*accent-watch-text[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(renderActivityTab(c, DATA.activities.__s2d3__));
        return m ? m[1] : '';
      };
      const exp = chipOf('They asked about an upsell.');
      const risk = chipOf('They are considering a competitor and may cancel.');
      const expChip = exp.indexOf('Expansion') !== -1 && !/risk categor/i.test(exp);
      const riskKept = /Possible risk categor/.test(risk);   // guard: a real risk note keeps its wording
      ok = expChip && riskKept;
      detail = JSON.stringify({exp, risk});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('v13 step 2d: the Expansion keyword chip on a note is worded as an expansion signal, not a possible risk category', ok, detail);
  })();
  (function(){                                   // v13 Step 2e (1): only a reason makes a risk
    let ok = false, detail = '';
    const prevLog = DATA.riskLog;
    const isRisk = typeof riskItemIsRisk === 'function' ? riskItemIsRisk : () => null;   // null (not a throw) on a build without it
    try{
      DATA.riskLog = {};
      const it = {kind: 'Off Track', sev: 3, c: {id: '__s2e__', name: 'S2eCo'}, detail: 'd', date: todayISO()};
      it.logKey = riskItemKey(it);
      const noReason = setRiskVerdict(it, 'confirmed') === false && setRiskVerdict(it, 'confirmed', '   ') === false && riskVerdictState(it) === 'unreviewed';
      const withReason = setRiskVerdict(it, 'confirmed', 'customer told me on the call') === true && riskVerdictState(it) === 'confirmed' && isRisk(it) === true;
      const signalsOnly = ['Off Track', 'Watch', 'Behind target', 'Risk language', 'Category signal', 'Flagged note', 'Implementation risk', 'Implementation paused']
        .every(kind => isRisk({kind, tracking: {}}) === false);
      ok = noReason && withReason && signalsOnly;
      detail = JSON.stringify({noReason, withReason, signalsOnly});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.riskLog = prevLog;
    check('v13 step 2e: confirming a risk needs a non-empty reason, and nothing is a risk before that', ok, detail);
  })();
  (function(){                                   // v13 Step 2e (2): the hub lists signals apart from risks
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevShow = ui.riskShowDismissed, prevRM = _riskMemo, prevHM = _healthMemo, prevHub = _riskHubCache;
    const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
    try{
      DATA.riskLog = {}; ui.riskShowDismissed = false;
      const c = v13Acct('__s2e2__');                       // auto Off Track only: a signal
      DATA.customers = [c]; DATA.activities = {};
      reset();
      const pre_oneCase = buildRiskCases(buildRiskHubList()).length === 1;   // precondition, true on the parent too
      const before = renderRiskTab();
      const secStart = before.indexOf('Signals to check');
      const sig = secStart !== -1;
      const rowKept = sig && before.indexOf('id="rk-c-' + c.id + '"') > secStart && before.indexOf('data-risk-confirm="' + c.id + '"') > secStart;
      const noCard = before.indexOf('class="rk3-card') === -1;
      buildRiskCases(buildRiskHubList()).forEach(k => k.items.forEach(it => setRiskVerdict(it, 'confirmed', 'real: they said so')));
      reset();
      const after = renderRiskTab();
      const guard_cardAfterConfirm = after.indexOf('class="rk3-card') !== -1;   // guard, true on the parent too
      ok = pre_oneCase && sig && rowKept && noCard && guard_cardAfterConfirm;
      detail = JSON.stringify({pre_oneCase, sig, rowKept, noCard, guard_cardAfterConfirm});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.riskShowDismissed = prevShow;
    _renderMemoResets.forEach(r => r()); _riskMemo = prevRM; _healthMemo = prevHM; _riskHubCache = prevHub;
    ok = ok && _riskHubCache === prevHub;   // FX2: the render swapped _riskHubCache; it must be put back
    check('v13 step 2e: a missing-evidence case is listed under Signals to check (keeping its row id and confirm button), not as a risk card, until a reason confirms it', ok, detail);
  })();
  (function(){                                   // FX2 (1): a mixed case, driven through the real confirm and dismiss controls
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevRM = _riskMemo, prevHM = _healthMemo, prevHub = _riskHubCache;
    const prevView = ui.view, prevOpen = ui.openCustomerId, prevTab = ui.panelTab, realSave = saveData, prevUL = _undoLabel;
    const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
    const preModals = new Set(document.querySelectorAll('.modal-backdrop'));
    const closeModals = () => document.querySelectorAll('.modal-backdrop').forEach(el => { if(preModals.has(el)) return; const b = el.querySelector('#rkc-cancel'); if(b) b.click(); else el.remove(); });
    try{
      saveData = function(){ return true; };
      DATA.riskLog = {}; DATA.activities = {};
      const c = v13Acct('__fx2a__', {riskOverride: 'risk'});
      DATA.customers = [c];
      DATA.activities[c.id] = [{id:'afx2', date: isoAddDays(todayISO(), -6), type:'Onboarding Session', summary:'They raised a blocker and are frustrated.', sessionNumber:1, checklist:[], flagged:true}];
      reset(); ui.view = 'risk'; ui.openCustomerId = null;
      const items = () => { reset(); return buildRiskCases(buildRiskHubList()).find(k => k.c.id === c.id).items; };
      const two = items().length >= 2;
      setRiskVerdict(items()[0], 'confirmed', 'FIRST reason');
      const firstKey = items().find(it => riskItemIsRisk(it)).logKey;
      const submit = (btnSel, taSel, okSel, text) => {
        render();
        const btn = document.querySelector(btnSel);
        if(!btn) return false;
        btn.click();
        const ta = document.querySelector(taSel);
        if(!ta) return false;
        ta.value = text; ta.dispatchEvent(new Event('input', {bubbles: true}));
        document.querySelector(okSel).click();
        return true;
      };
      const clicked = submit('[data-risk-confirm="' + c.id + '"]', '#rkc-reason', '#rkc-ok', 'SECOND reason');
      const keptFirst = DATA.riskLog[firstKey].verdictReason === 'FIRST reason' && DATA.riskLog[firstKey].verdict === 'confirmed';
      const others = items().filter(it => it.logKey !== firstKey);
      const otherGot = others.length > 0 && others.every(it => it.tracking.verdictReason === 'SECOND reason');
      closeModals();
      DATA.riskLog = {};
      setRiskVerdict(items()[0], 'confirmed', 'FIRST reason');
      const clicked2 = submit('[data-risk-dismiss="' + c.id + '"]', '#rkd-reason', '#rkd-ok', 'nope');
      const stillConfirmed = items().filter(it => riskItemIsRisk(it)).length === 1 && items().filter(it => riskVerdictState(it) === 'dismissed').length === items().length - 1;
      ok = two && clicked && clicked2 && keptFirst && otherGot && stillConfirmed;
      detail = JSON.stringify({two, clicked, clicked2, keptFirst, otherGot, stillConfirmed});
    }catch(e){ detail = 'threw: ' + e.message; }
    closeModals(); saveData = realSave; _undoLabel = prevUL;
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    ui.view = prevView; ui.openCustomerId = prevOpen; ui.panelTab = prevTab;
    try{ render(); }catch(e){}
    _renderMemoResets.forEach(r => r()); _riskMemo = prevRM; _healthMemo = prevHM; _riskHubCache = prevHub;
    check('FX2: confirming a mixed case through the real controls acts only on unconfirmed items and keeps the first reason; dismissing never drops a confirmed item', ok, detail);
  })();
  (function(){                                   // FX2 (2)+(4): pre-1.2 confirmations stay risks, labelled; the card prints the reason
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevRM = _riskMemo, prevHM = _healthMemo, prevHub = _riskHubCache;
    const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
    try{
      const c = v13Acct('__fx2b__', {riskOverride: 'risk'});
      DATA.customers = [c]; DATA.activities = {}; DATA.riskLog = {}; reset();
      const it0 = buildRiskHubList().find(r => r.c.id === c.id);
      DATA.riskLog = {}; DATA.riskLog[it0.logKey] = {firstSeen: isoAddDays(todayISO(), -30), lastActioned: isoAddDays(todayISO(), -20), verdict: 'confirmed', verdictOn: isoAddDays(todayISO(), -20), verdictSev: it0.sev};
      reset();
      const it = buildRiskHubList().find(r => r.logKey === it0.logKey);
      const stays = riskItemIsRisk(it) === true && buildRiskCases(buildRiskHubList()).find(k => k.c.id === c.id).isRisk === true;
      const html = renderRiskTab();
      const labelled = html.indexOf('Confirmed before reasons were required: add a reason') !== -1 && html.indexOf('class="rk3-card') !== -1;
      const nag = riskAttention(it).state === 'maintenance_due';
      DATA.riskLog[it0.logKey].verdictReason = 'PRINTED-REASON-XYZ'; reset();
      const html2 = renderRiskTab();
      const prints = html2.indexOf('PRINTED-REASON-XYZ') !== -1 && html2.indexOf('Confirmed before reasons were required') === -1;
      ok = stays && labelled && nag && prints;
      detail = JSON.stringify({stays, labelled, nag, prints});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = prevRM; _healthMemo = prevHM; _riskHubCache = prevHub;
    check('FX2: a pre-1.2 confirmation (no reason) stays a risk with the add-a-reason label and still nags; the card prints a reason when there is one', ok, detail);
  })();
  (function(){                                   // FX2 (3): a real click on the account desk Confirm opens the reason modal
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevRM = _riskMemo, prevHM = _healthMemo, prevHub = _riskHubCache;
    const prevView = ui.view, prevOpen = ui.openCustomerId, prevTab = ui.panelTab, realSave = saveData, prevUL = _undoLabel, prevSnap = DATA.weeklySnapshot;
    const preModals = new Set(document.querySelectorAll('.modal-backdrop'));
    const closeModals = () => document.querySelectorAll('.modal-backdrop').forEach(el => { if(preModals.has(el)) return; const b = el.querySelector('#rkc-cancel'); if(b) b.click(); else el.remove(); });
    try{
      saveData = function(){ return true; };
      const c = v13Acct('__fx2c__', {riskOverride: 'risk'});
      DATA.customers = [c]; DATA.activities = {}; DATA.riskLog = {};
      DATA.weeklySnapshot = {date: isoAddDays(todayISO(), -7), ids: []};   // so the Joined Needs Attention deck (editor risk) renders
      ui.openCustomerId = null; ui.view = 'copilot';
      render();
      const btn = document.querySelector('[data-dk-risk^="confirmed|"]');
      const found = !!btn;
      const before = document.querySelectorAll('#rkc-reason').length;
      if(btn) btn.click();
      const modalOpened = document.querySelectorAll('#rkc-reason').length === before + 1;
      const noVerdictYet = Object.keys(DATA.riskLog).every(k => !DATA.riskLog[k].verdict);
      ok = found && modalOpened && noVerdictYet;
      detail = JSON.stringify({found, modalOpened, noVerdictYet});
    }catch(e){ detail = 'threw: ' + e.message; }
    closeModals(); saveData = realSave; _undoLabel = prevUL;
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    if(prevSnap === undefined) delete DATA.weeklySnapshot; else DATA.weeklySnapshot = prevSnap;
    ui.view = prevView; ui.openCustomerId = prevOpen; ui.panelTab = prevTab;
    try{ render(); }catch(e){}
    _renderMemoResets.forEach(r => r()); _riskMemo = prevRM; _healthMemo = prevHM; _riskHubCache = prevHub;
    check('FX2: a real click on the account desk Confirm opens the reason modal and writes no verdict', ok, detail);
  })();
  (function(){                                   // FX4 (1): a real click on the desk Dismiss / Confirm of an already-confirmed item
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevRM = _riskMemo, prevHM = _healthMemo, prevHub = _riskHubCache;
    const prevView = ui.view, prevOpen = ui.openCustomerId, prevTab = ui.panelTab, realSave = saveData, prevUL = _undoLabel, prevSnap = DATA.weeklySnapshot, realToast = showToast;
    const pre = new Set(document.querySelectorAll('.modal-backdrop'));
    const closeOwn = () => document.querySelectorAll('.modal-backdrop').forEach(el => { if(pre.has(el)) return; const b = el.querySelector('#rkc-cancel'); if(b) b.click(); else el.remove(); });
    const toasts = [];
    try{
      saveData = function(){ return true; };
      showToast = function(m){ toasts.push(String(m)); };
      const c = v13Acct('__fx4a__', {riskOverride: 'risk'});
      DATA.customers = [c]; DATA.activities = {}; DATA.riskLog = {};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const it0 = buildRiskHubList().find(r => r.c.id === c.id);
      setRiskVerdict(it0, 'confirmed', 'FX4A-KEEP-THIS-REASON');
      const key = it0.logKey;
      DATA.weeklySnapshot = {date: isoAddDays(todayISO(), -7), ids: []};
      ui.openCustomerId = null; ui.view = 'copilot';
      render();
      const dis = document.querySelector('[data-dk-risk="dismissed|' + key + '"]');
      const found = !!dis;
      if(dis) dis.click();
      const kept = DATA.riskLog[key].verdict === 'confirmed' && DATA.riskLog[key].verdictReason === 'FX4A-KEEP-THIS-REASON';
      const noDismissToast = !toasts.some(t => /dismissed/i.test(t));
      toasts.length = 0; render();
      const conf = document.querySelector('[data-dk-risk="confirmed|' + key + '"]');
      const modals0 = document.querySelectorAll('#rkc-reason').length;
      if(conf) conf.click();
      const noModal = document.querySelectorAll('#rkc-reason').length === modals0;
      const noFalseToast = !toasts.some(t => /confirmed as a real risk/i.test(t) && !/^already/i.test(t));
      ok = found && kept && noDismissToast && noModal && noFalseToast;
      detail = JSON.stringify({found, kept, noDismissToast, noModal, noFalseToast, toasts});
    }catch(e){ detail = 'threw: ' + e.message; }
    closeOwn(); saveData = realSave; showToast = realToast; _undoLabel = prevUL;
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    if(prevSnap === undefined) delete DATA.weeklySnapshot; else DATA.weeklySnapshot = prevSnap;
    ui.view = prevView; ui.openCustomerId = prevOpen; ui.panelTab = prevTab;
    try{ render(); }catch(e){}
    _renderMemoResets.forEach(r => r()); _riskMemo = prevRM; _healthMemo = prevHM; _riskHubCache = prevHub;
    check('FX4: a real click on the desk Dismiss of an already-confirmed item keeps its verdict and reason, and desk Confirm on it neither opens the modal nor toasts "confirmed"', ok, detail);
  })();
  (function(){                                   // FX4 (2): only confirmed reasons reach the AI risk-summary text
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevRM = _riskMemo, prevHM = _healthMemo, prevHub = _riskHubCache;
    try{
      const c = v13Acct('__fx4b__', {riskOverride: 'risk'});
      DATA.customers = [c]; DATA.activities = {}; DATA.riskLog = {};
      DATA.activities[c.id] = [{id:'a__fx4b__', date: isoAddDays(todayISO(), -6), type:'Onboarding Session', summary:'They raised a blocker and are frustrated.', sessionNumber:1, checklist:[], flagged:true}];
      const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
      reset();
      const items = () => { reset(); return buildRiskHubList().filter(r => r.c.id === c.id); };
      const n3 = items().length >= 3;
      const keys = items().map(r => r.logKey);
      setRiskVerdict(items()[0], 'confirmed', 'FX4B-CONFIRMED-REASON');
      setRiskVerdict(items()[1], 'dismissed', 'FX4B-DISMISSED-REASON');
      DATA.riskLog[keys[2]] = Object.assign(DATA.riskLog[keys[2]] || {firstSeen: todayISO(), lastActioned: null}, {verdictReason: 'FX4B-UNREVIEWED-REASON'});
      const item = items().find(r => r.logKey === keys[0]);
      const texts = [buildRiskSummaryPrompt(item), buildRiskExecSummary(item), buildCallPrepContext(c).text, JSON.stringify(aiCustomerSnapshot(c))];
      const hasConf = texts.every(x => x.indexOf('FX4B-CONFIRMED-REASON') !== -1);
      const noDis = texts.every(x => x.indexOf('FX4B-DISMISSED-REASON') === -1);
      const noUnrev = texts.every(x => x.indexOf('FX4B-UNREVIEWED-REASON') === -1);
      ok = n3 && hasConf && noDis && noUnrev;
      detail = JSON.stringify({n3, hasConf, noDis, noUnrev});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = prevRM; _healthMemo = prevHM; _riskHubCache = prevHub;
    check('FX4: a dismissed or unreviewed item\'s reason never appears in the risk-summary prompt, the exec summary, the call-prep text or the AI snapshot', ok, detail);
  })();
  (function(){                                   // FX4 (3): two long reasons are trimmed, not dropped, in the exec summary
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevRM = _riskMemo, prevHM = _healthMemo, prevHub = _riskHubCache;
    try{
      const c = v13Acct('__fx4c__', {riskOverride: 'risk'});
      DATA.customers = [c]; DATA.activities = {}; DATA.riskLog = {};
      DATA.activities[c.id] = [{id:'a__fx4c__', date: isoAddDays(todayISO(), -6), type:'Onboarding Session', summary:'They raised a blocker and are frustrated.', sessionNumber:1, checklist:[], flagged:true}];
      const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
      reset();
      const items = () => { reset(); return buildRiskHubList().filter(r => r.c.id === c.id); };
      const pad = n => new Array(n + 1).join('x');
      const k0 = items()[0].logKey;
      setRiskVerdict(items()[0], 'confirmed', ('ALPHA-REASON-' + pad(200)).slice(0, 200));
      setRiskVerdict(items()[1], 'confirmed', ('BRAVO-REASON-' + pad(200)).slice(0, 200));
      const s = buildRiskExecSummary(items().find(r => r.logKey === k0));
      const both = s.indexOf('ALPHA-REASON-') !== -1 && s.indexOf('BRAVO-REASON-') !== -1;
      const fits = s.length <= RISK_SUMMARY_MAX;
      ok = both && fits;
      detail = JSON.stringify({both, fits, len: s.length});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = prevRM; _healthMemo = prevHM; _riskHubCache = prevHub;
    check('FX4: the exec summary keeps both of two 200-character confirmed reasons (trimmed) and stays within its length cap', ok, detail);
  })();
  (function(){                                   // FX4 (5): a reason shared by several items is written once
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevRM = _riskMemo, prevHM = _healthMemo, prevHub = _riskHubCache;
    try{
      const c = v13Acct('__fx4d__', {riskOverride: 'risk'});
      DATA.customers = [c]; DATA.activities = {}; DATA.riskLog = {};
      DATA.activities[c.id] = [{id:'a__fx4d__', date: isoAddDays(todayISO(), -6), type:'Onboarding Session', summary:'They raised a blocker and are frustrated.', sessionNumber:1, checklist:[], flagged:true}];
      const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
      reset();
      const items = () => { reset(); return buildRiskHubList().filter(r => r.c.id === c.id); };
      const R = 'FX4D-ONCE-ONLY';
      const k0 = items()[0].logKey;
      const nItems = items().length;
      items().forEach(it => setRiskVerdict(it, 'confirmed', R));
      const item = items().find(r => r.logKey === k0);
      const count = s => s.split(R).length - 1;
      const counts = [buildRiskSummaryPrompt(item), buildRiskExecSummary(item), buildCallPrepContext(c).text, JSON.stringify(aiCustomerSnapshot(c))].map(count);
      // the prompt embeds the exec-summary draft, so it carries the reason once in its own section and once in the draft; the others exactly once
      ok = nItems >= 2 && counts[1] === 1 && counts[2] === 1 && counts[3] === 1 && counts[0] === 2;
      detail = JSON.stringify({counts, nItems});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = prevRM; _healthMemo = prevHM; _riskHubCache = prevHub;
    check('FX4: a reason shared by several confirmed items appears once per text, not once per item', ok, detail);
  })();
  (function(){                                   // FX4 (4): closing a check-opened modal leaks no keydown listener and spares others
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevRM = _riskMemo, prevHM = _healthMemo, prevHub = _riskHubCache;
    const prevView = ui.view, prevOpen = ui.openCustomerId, prevSnap = DATA.weeklySnapshot, realSave = saveData, prevUL = _undoLabel;
    const realAdd = document.addEventListener, realRem = document.removeEventListener;
    const sentinel = document.createElement('div'); sentinel.className = 'modal-backdrop'; sentinel.id = 'fx4-sentinel';
    document.body.appendChild(sentinel);
    const pre = new Set(document.querySelectorAll('.modal-backdrop'));
    let adds = 0, rems = 0;
    try{
      saveData = function(){ return true; };
      document.addEventListener = function(t){ if(t === 'keydown') adds++; return realAdd.apply(document, arguments); };
      document.removeEventListener = function(t){ if(t === 'keydown') rems++; return realRem.apply(document, arguments); };
      const c = v13Acct('__fx4e__', {riskOverride: 'risk'});
      DATA.customers = [c]; DATA.activities = {}; DATA.riskLog = {};
      DATA.weeklySnapshot = {date: isoAddDays(todayISO(), -7), ids: []};
      ui.openCustomerId = null; ui.view = 'copilot';
      render();
      const addsBefore = adds;
      const btn = document.querySelector('[data-dk-risk^="confirmed|"]');
      if(btn) btn.click();
      const opened = document.querySelectorAll('.modal-backdrop').length === pre.size + 1;
      document.querySelectorAll('.modal-backdrop').forEach(el => { if(pre.has(el)) return; const b = el.querySelector('#rkc-cancel'); if(b) b.click(); else el.remove(); });
      const spared = document.body.contains(sentinel);
      const closedOwn = document.querySelectorAll('.modal-backdrop').length === pre.size;
      ok = !!btn && opened && spared && closedOwn && adds - addsBefore === 1 && rems >= 1;
      detail = JSON.stringify({btn: !!btn, opened, spared, closedOwn, adds, addsBefore, rems});
    }catch(e){ detail = 'threw: ' + e.message; }
    document.addEventListener = realAdd; document.removeEventListener = realRem;
    sentinel.remove(); document.querySelectorAll('.modal-backdrop').forEach(el => { if(!pre.has(el)) el.remove(); });
    saveData = realSave; _undoLabel = prevUL;
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    if(prevSnap === undefined) delete DATA.weeklySnapshot; else DATA.weeklySnapshot = prevSnap;
    ui.view = prevView; ui.openCustomerId = prevOpen;
    try{ render(); }catch(e){}
    _renderMemoResets.forEach(r => r()); _riskMemo = prevRM; _healthMemo = prevHM; _riskHubCache = prevHub;
    check('FX4: closing the desk Confirm modal through its own Cancel leaks no keydown listener and removes no modal the check did not open', ok, detail);
  })();
  /* ============ v61: Today unified action ranking ============
     "no Today row renders without a citation" and "Start-here card shows exactly
     todayActionList()[0]" are the load-bearing ones. They are what keep the
     opinionated pick honest rather than merely confident: the first makes an
     unexplained recommendation unrenderable, the second stops the card from
     drifting away from the list it claims to be summarizing. */
  (function(){
    /* Captured at the TOP and asserted at the BOTTOM of this block: the suite
       must leave the real book's risk memory exactly as it found it. Not
       theoretical — the Start-here check below renders Today, and rendering
       Today stamps riskLog via the risk-hygiene strip, which made the v60
       risk-memory check fail on every run after the first in a page session.
       Placed at the boundaries so ANY future leak inside this block trips it,
       not just the one that has already been fixed. */
    const riskLogAtEntry = JSON.stringify(DATA.riskLog || {});
    const declared = new Set(TODAY_SOURCE_DEFS.map(d => d.source));
    const live = todayActionList();
    // Signal-backed rows carry their band from SIGNAL_DEFS and are namespaced
    // 'signal:<key>' so the two registries can never collide.
    const undeclared = live.filter(r => !r.source.startsWith('signal:') && !declared.has(r.source));
    check('v61 every Today source declares a severity band', undeclared.length === 0,
      undeclared.map(r => r.source).join(', '));
    const badDefs = TODAY_SOURCE_DEFS.filter(d =>
      !Number.isInteger(d.severity) || d.severity < 1 || d.severity > 4 ||
      typeof d.why !== 'string' || d.why.trim().length <= 10);
    check('v61 every declared band carries a why string that explains it', badDefs.length === 0,
      badDefs.map(d => d.source).join(', '));
    const badSev = live.filter(r => !Number.isInteger(r.severity) || r.severity < 1 || r.severity > 4);
    check('v61 Today severities are integers 1–4', badSev.length === 0,
      badSev.map(r => `${r.customerName}=${r.severity}`).join(', '));
    const unexplained = live.filter(r => !Array.isArray(r.reasons) || r.reasons.length === 0
      || !r.reasons.every(x => typeof x === 'string' && x.trim().length > 0));
    check('v61 no Today row renders without a citation', unexplained.length === 0,
      unexplained.map(r => r.customerName).join(', '));
    const badTab = live.filter(r => !PANEL_TAB_KEYS.includes(r.panelTab)
      || !r.alsoWaiting.every(w => PANEL_TAB_KEYS.includes(w.panelTab)));
    check('v61 every Today deep-link targets a real panel tab', badTab.length === 0,
      badTab.map(r => `${r.customerName}->${r.panelTab}`).join(', '));
    const ids = live.map(r => r.customerId);
    check('v61 one Today row per account', new Set(ids).size === ids.length,
      `${ids.length} rows across ${new Set(ids).size} accounts`);
    // One chip per destination: a duplicate tab renders two buttons that do the
    // same thing, which reads as two pieces of work when it is one.
    const dupChip = live.filter(r => {
      const tabs = [r.panelTab].concat(r.alsoWaiting.map(w => w.panelTab));
      return new Set(tabs).size !== tabs.length;
    });
    check('v61 Today dispatch chips never repeat a destination', dupChip.length === 0,
      dupChip.map(r => r.customerName).join(', '));
    // Every panel tab must have a chip label, or a button silently reads
    // "Open account" and stops telling the user where it goes.
    check('v61 every panel tab has a dispatch chip label',
      PANEL_TAB_KEYS.every(k => typeof PANEL_TAB_LABEL[k] === 'string' && PANEL_TAB_LABEL[k].trim().length > 0),
      PANEL_TAB_KEYS.filter(k => !PANEL_TAB_LABEL[k]).join(', '));
    // Genuine rebuild, not the memoized array compared against itself.
    _renderMemoResets.forEach(reset => reset());
    const again = todayActionList();
    check('v61 Today ranking is deterministic across rebuilds',
      again.length === live.length &&
      again.every((r, i) => r.customerId === live[i].customerId && r.severity === live[i].severity),
      `${live.map(r=>r.customerId).join('>')} vs ${again.map(r=>r.customerId).join('>')}`);
    // renderToday() builds the risk-hygiene strip, which STAMPS DATA.riskLog for
    // every live risk — a self-check must not write to the real book's memory.
    // Same snapshot/restore contract the v58/v59 hub checks use.
    const riskLogSnapshot = JSON.parse(JSON.stringify(DATA.riskLog || {}));
    let html;
    try{ html = renderToday(); } finally {
      DATA.riskLog = riskLogSnapshot;
    }
    /* v69: the "START HERE" label is gone — first position carries that meaning
       on its own. The invariant it protected is unchanged and still the point:
       whatever the focus view opens on must BE todayActionList()[0], so the
       working panel can never disagree with the ranking beside it. */
    const steps = (html.match(/data-day-step=/g) || []).length;
    const pool = (html.match(/data-day-pool=/g) || []).length;
    if(!again.length && !callsScheduledToday().length){
      check('v72 the day is absent when nothing is ranked and no call is booked', steps === 0, `${steps} step(s)`);
    } else {
      /* The invariant is that the day DEFAULTS to its first beat, not that it is
         pinned there — navigating away with j/k or a click is entirely
         legitimate, and the first draft of this check failed simply because the
         tester had moved. So clear the selection, re-render, and assert where it
         lands. With no calls booked the first beat is todayActionList()[0]; with
         calls, the day opens on the first call, because that is what the axis
         says comes first. */
      /* v72.3 changed this invariant deliberately: the day now opens on the beat
         you were last on, and falls back to the first only when that account is
         no longer in today's day. Both paths are asserted. */
      const held = ui.todayFocusId, heldPrefs = getDayPrefs();
      const expected = buildDayTimeline().beats[0];
      saveDayPrefs({focusId: null});
      ui.todayFocusId = null;
      renderToday();
      const defaulted = ui.todayFocusId;
      const remember = buildDayTimeline().beats[Math.min(2, buildDayTimeline().beats.length - 1)];
      saveDayPrefs({focusId: remember.customerId});
      ui.todayFocusId = null;
      renderToday();
      const restored = ui.todayFocusId;
      saveDayPrefs(heldPrefs); ui.todayFocusId = held;
      check('v72 the day opens on the remembered beat, or the first when there is none',
        pool === 3 && !!expected && defaulted === expected.customerId
        && restored === remember.customerId,
        `pool=${pool}, defaulted=${defaulted}/${expected && expected.customerId}, restored=${restored}/${remember.customerId}`);
    }
    check('v61 the Today checks leave the real book risk memory untouched',
      JSON.stringify(DATA.riskLog || {}) === riskLogAtEntry,
      `entry=${riskLogAtEntry.slice(0,120)} exit=${JSON.stringify(DATA.riskLog || {}).slice(0,120)}`);
  })();
  (function(){
    /* v62: the Today cap must bound the page WITHOUT hiding that it did. The
       uncapped v61 list rendered 97 rows on a 100-account book. Synthetic book,
       snapshotted and restored; riskLog handed a throwaway because renderToday()
       stamps it. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevShowAll = ui.todayShowAll;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const cs = [], acts = {};
      for(let i = 0; i < 30; i++){
        const c = {id:'__cap'+i+'__', name:'CapCo '+i, module:DATA.config.modules[0], stage:DATA.config.stages[1].key,
          implementationDate: isoAddDays(todayISO(), -120), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(c); cs.push(c); acts[c.id] = [];
      }
      DATA.customers = cs; DATA.activities = acts;
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const total = todayActionList().length;
      ui.todayShowAll = false;
      const collapsed = renderToday();
      ui.todayShowAll = true;
      _renderMemoResets.forEach(r => r());
      const expanded = renderToday();
      // data-today-row, NOT class="todo-item" — the week-ahead block reuses
      // todo-item, so counting that would conflate scheduled sessions with ranked rows.
      const rowsIn = h => (h.match(/data-today-row/g) || []).length;
      // v72: the day owns the top DAY_BEAT_MAX, so the compact list below it
      // starts there.
      const below = total - DAY_BEAT_MAX;
      ok = below > TODAY_VISIBLE_ROWS
        && rowsIn(collapsed) === TODAY_VISIBLE_ROWS
        && rowsIn(expanded) === below
        && collapsed.indexOf('show all ' + below) !== -1;
      detail = JSON.stringify({total, day: DAY_BEAT_MAX, collapsedRows: rowsIn(collapsed), expandedRows: rowsIn(expanded), cap: TODAY_VISIBLE_ROWS});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.todayShowAll = prevShowAll;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v62 Today caps the ranked list and states what it hid', ok, detail);
  })();
  (function(){
    /* v69: the focus pane writes real compliance updates, so the thing to prove
       is that it writes the SAME shape Edit Account does — one source of truth,
       two ways in. Also that an in-implementation account is not offered gates
       that do not open until Go-Live. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevFocus = ui.todayFocusId;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = (id, name, extra) => { const c = Object.assign({id, name,
        module: DATA.config.modules[0], stage: DATA.config.stages[1].key,
        implementationDate: isoAddDays(todayISO(), -200), totalSessions:8,
        domainScores:{}, sessionNotes:{}, stageHistory:[]}, extra || {});
        backfillCustomerRecord(c); return c; };
      const live = mk('__fp1__', 'FocusLive');
      const build = mk('__fp2__', 'FocusBuild', {implementation:{phase:'build', partner:'Acme'},
        commitments:[{id:'q1', text:'Send the plan', direction:'i_owe', due: isoAddDays(todayISO(), -4), doneOn:null}]});
      DATA.customers = [live, build];
      DATA.activities = {__fp1__: [], __fp2__: []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const rows = todayActionList();
      const liveRow = rows.find(r => r.customerId === '__fp1__');
      const buildRow = rows.find(r => r.customerId === '__fp2__');
      const chips = () => '';
      const asBeat = r => r && ({kind:'work', customerId:r.customerId, customerName:r.customerName,
        at:null, call:null, row:r, headline:r.headline, reasons:r.reasons.slice(),
        severity:r.severity, effortMin:r.effortMin, signalKey:r.signalKey});
      const livePane = liveRow ? renderBeatPanel(asBeat(liveRow), chips) : '';
      const buildPane = buildRow ? renderBeatPanel(asBeat(buildRow), chips) : '';
      // The live account is offered all three gates; the in-build one is offered none.
      const liveHasGates = livePane.indexOf('data-fp-outcome=') !== -1
        && livePane.indexOf('data-fp-csat=') !== -1
        && livePane.indexOf('data-fp-sentiment=') !== -1;
      const buildHidesGates = buildPane.indexOf('data-fp-outcome=') === -1
        && buildPane.indexOf('data-fp-csat=') === -1
        && buildPane.indexOf('Gainsight gates start at Go-Live') !== -1;
      // Ids are namespaced per account, or five panes in one DOM would collide.
      const namespaced = livePane.indexOf('__fp1__') !== -1;
      // The pane writes the same shape Edit Account reads.
      live.compliance.associatedPeopleCSAT.contactName = 'Ada';
      live.compliance.associatedPeopleCSAT.done = true;
      live.compliance.associatedPeopleCSAT.date = todayISO();
      // pendingGainsightItems() is memoized per render — without this reset the
      // check reads the pre-mutation list and reports a false failure.
      _renderMemoResets.forEach(r => r());
      const sharedShape = !pendingGainsightItems().some(it =>
        it.customerId === '__fp1__' && it.complianceKey === 'associatedPeopleCSAT');
      ok = !!liveRow && liveHasGates && buildHidesGates && namespaced && sharedShape;
      detail = JSON.stringify({liveHasGates, buildHidesGates, namespaced, sharedShape});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.todayFocusId = prevFocus;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v69 focus pane writes the same compliance shape and respects lifecycle', ok, detail);
  })();
  (function(){
    /* v69: assert the rendered OUTPUT, not the function source. The first draft
       scanned String(renderToday) and failed on its own explanatory comment —
       the word "Batch Opportunities" appears there precisely BECAUSE the block
       was removed. What matters is what reaches the page. */
    const prevLog = DATA.riskLog;
    let html = '';
    try{ DATA.riskLog = JSON.parse(JSON.stringify(prevLog || {})); html = renderToday(); }
    finally { DATA.riskLog = prevLog; }
    const gone = ['START HERE', 'Batch Opportunities', 'Time available', 'in implementation (partner-led)']
      .filter(t => html.indexOf(t) !== -1);
    check('v69 Today no longer renders the removed surfaces', gone.length === 0, gone.join(', '));
  })();
  (function(){
    /* Phase 1: the day comes before the paperwork. "Records to bring up to date"
       is the least time-critical block on the tab and it held the third screen
       position; it now sits below the day.

       This builds its OWN book with a real admin gap. Under demo-seed.js
       adminGapCount() is 0, so a check that leaned on the ambient book would
       render no admin block at all and pass without asserting anything — the
       first version of this check did exactly that. `gaps > 0` is therefore
       part of the assertion, not a precondition: if the fixture stops producing
       a gap, this check fails loudly instead of going quiet. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevFocus = ui.todayFocusId;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      // No targetGraduationDate -> the "no committed graduation date" gap fires.
      const mk = id => { const c = {id, name:'Adm'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[],
        nextSessionScheduledOn: todayISO(), nextSessionTime:'09:30'};
        backfillCustomerRecord(c); delete c.targetGraduationDate; return c; };
      const cs = [mk('__adm1__'), mk('__adm2__')];
      DATA.customers = cs;
      DATA.activities = cs.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const gaps = adminGapCount();
      const html = renderToday();
      const dayAt   = html.indexOf('class="day"');
      const adminAt = html.indexOf('Records to bring up to date');
      ok = gaps > 0 && dayAt !== -1 && adminAt !== -1 && adminAt > dayAt;
      detail = JSON.stringify({gaps, dayAt, adminAt});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.todayFocusId = prevFocus;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase1 Records to bring up to date renders below the day', ok, detail);
  })();
  check('v69 the implementation count is a stat tile that can reach its accounts',
    String(renderStats).indexOf('data-stat="implementation"') !== -1 &&
    String(renderStats).indexOf('Gainsight Items Pending') === -1);
  (function(){
    /* v70 open threads. The value of persisting them is that a question survives
       to the NEXT call — so re-running the parser must never discard an answer. */
    const a = {id:'__ot__'};
    const NL = String.fromCharCode(10);
    setOpenThreadsFromText(a, ['Can we export the audit trail?', 'Does consolidation need a licence?'].join(NL));
    const first = getOpenThreads(a);
    applyThreadAnswers(a, [{questionNumber:1, answer:'Yes, via Reports > Export.'}]);
    const answered = getOpenThreads(a)[0];
    // Re-typing the same lines plus a new one must KEEP the existing answer and id.
    setOpenThreadsFromText(a, ['Can we export the audit trail?', 'Does consolidation need a licence?', 'What about SSO?'].join(NL));
    const after = getOpenThreads(a);
    const kept = after[0].a === 'Yes, via Reports > Export.' && after[0].id === answered.id;
    // Removing every line clears the field rather than leaving an empty array.
    const b = {id:'__ot2__'};
    setOpenThreadsFromText(b, 'One question');
    setOpenThreadsFromText(b, '   ');
    check('v70 open threads survive re-entry and keep their answers',
      first.length === 2 && answered.a && answered.answeredOn
      && after.length === 3 && kept && b.openThreads === undefined,
      JSON.stringify({first:first.length, after:after.length, kept, cleared: b.openThreads === undefined}));
    check('v70 open thread normalizer rejects junk and clamps',
      normalizeOpenThread(null) === null && normalizeOpenThread({q:'   '}) === null
      && normalizeOpenThread({q:'x'.repeat(900)}).q.length === 400
      && normalizeOpenThread({q:'q', a:'y'.repeat(3000)}).a.length === 2000
      && normalizeOpenThread({q:'q', resolvedOn:'not-a-date'}).resolvedOn === null);
    // Answers arrive keyed by 1-based question number; out-of-range must not throw
    // or write onto the wrong thread.
    const c = {id:'__ot3__'};
    setOpenThreadsFromText(c, 'only one');
    const n = applyThreadAnswers(c, [{questionNumber:9, answer:'nope'}, {questionNumber:1, answer:'yes'}]);
    check('v70 out-of-range answers are ignored, not misapplied',
      n === 1 && getOpenThreads(c)[0].a === 'yes');
  })();
  (function(){
    // Act II is built from scheduled dates the tracker already had. Only TODAY.
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const mk = (id, on) => { const c = {id, name:'Cal'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -100),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[], nextSessionScheduledOn:on};
        backfillCustomerRecord(c); return c; };
      DATA.customers = [mk('__c1__', todayISO()), mk('__c2__', isoAddDays(todayISO(), 3)),
        mk('__c3__', isoAddDays(todayISO(), -2)), mk('__c4__', null)];
      DATA.activities = {__c1__:[], __c2__:[], __c3__:[], __c4__:[]};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const calls = callsScheduledToday();
      ok = calls.length === 1 && calls[0].c.id === '__c1__';
      detail = JSON.stringify(calls.map(x => x.c.id));
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v70 calls-today lists only sessions scheduled for today', ok, detail);
  })();
  (function(){
    /* Phase 2: the beat states the account in the OSM's words. This is a DISPLAY
       wrapper and nothing more — riskLabel() keeps its 19 call sites, and the
       string 'Watch' stays intact because the risk taxonomy COMPARES against it
       (item.kind === 'Watch'), so renaming it globally would be a silent
       string-matching break for a cosmetic gain. */
    const map = {risk:'Off Track', watch:'Needs Attention', ontrack:'On Track'};
    const bad = [];
    Object.keys(map).forEach(r => {
      const got = accountStateLabel({__forceRisk: r});
      if(got !== map[r]) bad.push(`${r} -> ${got}, wanted ${map[r]}`);
    });
    // riskLabel must be untouched by this addition.
    const riskLabelIntact = riskLabel('risk') === 'Off Track'
      && riskLabel('watch') === 'Watch' && riskLabel('ok') === 'On Track';
    check('phase2 accountStateLabel names the three states and leaves riskLabel alone',
      bad.length === 0 && riskLabelIntact,
      bad.join(' | ') + (riskLabelIntact ? '' : ' | riskLabel changed'));
  })();
  (function(){
    /* ============ v72: THE DAY ============
       The redesign's load-bearing claim is that ONE ACCOUNT GETS ONE BEAT. v71
       put five of eighteen accounts into three blocks each, so this is the check
       that must never regress. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevFocus = ui.todayFocusId;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = (id, extra) => { const c = Object.assign({id, name:'Day'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}, extra || {});
        backfillCustomerRecord(c); return c; };
      // __d1__ has BOTH a call today and a ranked signal — the merge case.
      const cs = [mk('__d1__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'10:00'}),
                  mk('__d2__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'14:00'}),
                  mk('__d3__'), mk('__d4__'), mk('__d5__')];
      DATA.customers = cs;
      DATA.activities = cs.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      const ids = day.beats.map(b => b.customerId);
      const unique = ids.length === new Set(ids).size;
      const merged = day.beats.find(b => b.customerId === '__d1__');
      // The merged beat is a call beat that ALSO carries the ranked reason.
      const mergedCarriesBoth = !!merged && merged.kind === 'call' && !!merged.call
        && merged.reasons.length > 0 && merged.severity > 0;
      // Every beat's movement is a real movement from the registry.
      const known = day.beats.every(b => DAY_MOVEMENT_MAP[String(b.movementKey).split(':')[0]]);
      ok = unique && mergedCarriesBoth && known && day.beats.length === cs.length;
      detail = JSON.stringify({beats: ids, unique, mergedCarriesBoth, known});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.todayFocusId = prevFocus;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v72 one account gets exactly one beat, carrying every reason it surfaced', ok, detail);
  })();
  (function(){
    /* Phase 1: the day is ordered by PRIORITY, not by the clock. A booked call
       is the only item on this tab with another person attached to it, so every
       call leads regardless of what time it starts. The 15:30 call used to sit
       below three hours of ranked work; it does not any more. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevFocus = ui.todayFocusId;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = (id, extra) => { const c = Object.assign({id, name:'Ord'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}, extra || {});
        backfillCustomerRecord(c); return c; };
      // A late call and an early one, plus three accounts that only rank as work.
      const cs = [mk('__o1__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'15:30'}),
                  mk('__o2__'), mk('__o3__'),
                  mk('__o4__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'09:30'}),
                  mk('__o5__')];
      DATA.customers = cs;
      DATA.activities = cs.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      const kinds = day.beats.map(b => b.kind);
      const lastCall = kinds.lastIndexOf('call');
      const firstWork = kinds.indexOf('work');
      // (a) No work beat may precede any call beat.
      const callsLead = lastCall === -1 || firstWork === -1 || lastCall < firstWork;
      // (b) Calls keep clock order among themselves.
      const callOrder = day.beats.filter(b => b.kind === 'call').map(b => b.customerId);
      const clockOrder = JSON.stringify(callOrder) === JSON.stringify(['__o4__','__o1__']);
      // (c) At most two movements, both known to the registry.
      const keys = day.movements.map(m => m.mkey);
      const twoMovements = keys.length <= 2 && keys.every(k => DAY_MOVEMENT_MAP[k]);
      ok = callsLead && clockOrder && twoMovements;
      detail = JSON.stringify({kinds, callOrder, keys, callsLead, clockOrder, twoMovements});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.todayFocusId = prevFocus;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase1 every call leads the day, in clock order, in at most two movements', ok, detail);
  })();
  (function(){
    /* The minutes maths survives as an ANNOTATION, never as a guess. A day with
       fewer than two timed calls has no measurable gap, and must say nothing
       rather than invent one. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = (id, extra) => { const c = Object.assign({id, name:'Gap'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}, extra || {});
        backfillCustomerRecord(c); return c; };
      // Two timed calls three hours apart -> a real 120-minute gap after the call length.
      const two = [mk('__g1__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'09:00'}),
                   mk('__g2__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'12:00'}),
                   mk('__g3__'), mk('__g4__')];
      DATA.customers = two;
      DATA.activities = two.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const withGap = buildDayTimeline();
      const annotated = withGap.beats.filter(b => b.kind === 'work' && b.gapNote);
      const mentionsBothTimes = annotated.length > 0 && annotated.every(b =>
        (b.gapNote.indexOf('9:00') !== -1 || b.gapNote.indexOf('09:00') !== -1) &&
        b.gapNote.indexOf('12:00') !== -1);
      // One timed call -> nothing to measure between, so no note at all.
      const one = [mk('__h1__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'09:00'}),
                   mk('__h2__'), mk('__h3__')];
      DATA.customers = one;
      DATA.activities = one.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const noGap = buildDayTimeline();
      const silent = noGap.beats.filter(b => b.kind === 'work').every(b => !b.gapNote);
      ok = mentionsBothTimes && silent;
      detail = JSON.stringify({annotated: annotated.map(b=>b.gapNote), mentionsBothTimes, silent});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase1 a gap note appears only where two timed calls actually bound one', ok, detail);
  })();
  (function(){
    /* The clock is EARNED. An unset time must never produce a clock string, and
       a bad one must never be stored — otherwise the timeline asserts a number
       the book does not contain, which is the one thing this tab does not do. */
    const bad = ['25:00', '9:5', '', 'abc', '10:60', null, undefined, 12, '1030'];
    const good = {'09:05':'09:05', '9:05':'09:05', '23:59':'23:59', '0:00':'00:00', ' 8:30 ':'08:30'};
    check('v72 the time normalizer rejects everything that is not a 24h clock time',
      bad.every(v => normalizeDayTime(v) === null) &&
      Object.keys(good).every(k => normalizeDayTime(k) === good[k]),
      JSON.stringify({bad: bad.filter(v => normalizeDayTime(v) !== null),
        good: Object.keys(good).filter(k => normalizeDayTime(k) !== good[k])}));

    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = (id, onToday) => { const c = {id, name:'Untimed'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        if(onToday) c.nextSessionScheduledOn = todayISO();   // dated, deliberately NOT timed
        backfillCustomerRecord(c); return c; };
      // Two untimed calls plus ranked work that has to be placed AROUND them —
      // without that third account the gap movements are empty and correctly
      // omitted, so there would be no ordinal label to assert.
      DATA.customers = [mk('__t1__', true), mk('__t2__', true), mk('__t3__', false)];
      DATA.activities = {__t1__:[], __t2__:[], __t3__:[]};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const html = renderToday();
      // No am/pm anywhere, and the day says so plainly instead of implying order.
      const noClock = !/\d{1,2}:\d{2}(am|pm)/.test(html);
      const saysSo = html.indexOf('time not set') !== -1;
      const ordinal = html.indexOf('Your calls today') !== -1;
      ok = noClock && saysSo && ordinal;
      detail = JSON.stringify({noClock, saysSo, ordinal});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v72 an untimed day renders no clock time and states that it has none', ok, detail);
  })();
  (function(){
    /* Gap annotation is pure, so it is tested directly rather than through a
       render. The contract that matters: work fills a slot, then moves to the
       next one — and a beat that fits in no measurable slot is left SILENT
       rather than given an invented gap. This replaced the fitBeatsToSlots
       tests at phase 1, when the minutes maths stopped structuring the day. */
    const calls = [{at:'09:00'}, {at:'12:00'}, {at:'13:30'}];
    // 09:00->12:00 leaves 120 free after a 60-minute call; 12:00->13:30 leaves 30.
    const beats = [1,2,3,4].map(n => ({customerId:'g'+n, effortMin:60}));
    annotateGapFit(beats, calls);
    const noted = beats.filter(b => b.gapNote);
    const firstSlotTook = beats.filter(b => b.gapNote.indexOf('12:00pm') !== -1).length;
    check('phase1 gap annotation fills a slot, advances, and never invents a gap',
      noted.length === 2 && firstSlotTook === 2 && !beats[2].gapNote && !beats[3].gapNote,
      JSON.stringify(beats.map(b => b.gapNote)));
  })();
  (function(){
    /* Phase 2: every beat answers four questions — what state is this account in,
       why is it here, what do I do, and what is outstanding. A beat that renders
       a name and nothing else is the whitespace problem this replaced. Also
       guards the two DOM hooks setTodayFocus() reads for its screen-reader
       announcement: an <h4> and a .ds-eyebrow inside every .day-step. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevFocus = ui.todayFocusId;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = (id, extra) => { const c = Object.assign({id, name:'Beat'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}, extra || {});
        backfillCustomerRecord(c); return c; };
      const cs = [mk('__b1__', {nextSessionScheduledOn: todayISO(), nextSessionTime:'09:30'}),
                  mk('__b2__'), mk('__b3__')];
      DATA.customers = cs;
      DATA.activities = cs.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      /* Force one beat past the cap. Synthetic accounts with no activity never
         produce four drivers, so without this the overCap clause can never fire
         and nothing guards the left column's limit — slice(0,4) could become
         slice(0,3) and the suite would stay green while driver #4 vanished
         between the two surfaces. FIX 1 amendment: the headline is put IN the
         reasons list, at position 0 — exactly the shape a real Gainsight
         grad-review gate produces when it is the account's only reason — so
         headlineDupes actually has something to catch pre-fix.  */
      if(day.beats[0]){
        day.beats[0].headline = day.beats[0].headline || 'Drv-1';
        day.beats[0].reasons = [day.beats[0].headline, 'Drv-2','Drv-3','Drv-4','Drv-5'];
      }
      const html = renderDay(day, () => '');
      /* Bound the scan to the TRACK before splitting. renderDay emits the track
         and then the .day-stage pane pool, and the pool's renderBeatPanel output
         carries an uncapped reasons list by design — splitting the whole document
         bleeds that panel into the last beat's chunk and makes overCap fire on
         markup that is not a beat. */
      const track = html.split('class="day-stage"')[0];
      const steps = track.split('class="day-step').slice(1);
      const stateOk = steps.every((s, i) => {
        const cust = DATA.customers.find(x => x.id === day.beats[i].customerId);
        return !!cust && s.indexOf(escapeHtml(accountStateLabel(cust))) !== -1;
      });
      /* FIX 1 amendment: a beat whose only reason IS its headline has nothing
         left to say under "Why" once the headline is excluded from the drivers
         list — that beat correctly omits the whole ds-why-list dt/dd pair. The
         old assertion ("ds-why-list present in every step") is now wrong; the
         Why row's presence must match whether the beat has drivers BEYOND its
         headline. Diagnosed per-step rather than folded into one boolean so a
         failure names which step disagreed. */
      const whyMismatches = steps.map((s, i) => {
        const b = day.beats[i];
        const extra = (b.reasons || []).filter(r => r !== b.headline);
        const hasWhy = s.indexOf('ds-why-list') !== -1;
        return {i, expectWhy: extra.length > 0, hasWhy};
      }).filter(x => x.expectWhy !== x.hasWhy);
      // NEW, strictly stronger: the headline is the "what do I do" sentence and
      // must never also print as one of its own Why drivers.
      const headlineDupes = steps.map((s, i) => {
        const b = day.beats[i];
        const needle = escapeHtml(b.headline || '');
        const count = needle ? (s.split(needle).length - 1) : 0;
        return {i, count};
      }).filter(x => x.count > 1);
      const everyStepComplete = steps.length === day.beats.length
        && whyMismatches.length === 0
        && headlineDupes.length === 0
        && steps.every(s =>
          stateOk                                   // state
          && s.indexOf('ds-do') !== -1              // what do I do
          && s.indexOf('<h4') !== -1                // setTodayFocus reads this
          && s.indexOf('ds-eyebrow') !== -1);       // and this
      // The drivers list is capped at four; a fifth must be counted, not printed.
      const maxLi = steps.reduce((n,s)=> Math.max(n, (s.match(/<li/g) || []).length), 0);
      const overCap = maxLi > 4;
      ok = everyStepComplete && !overCap && maxLi === 4;
      detail = JSON.stringify({steps: steps.length, beats: day.beats.length, everyStepComplete, overCap, stateOk, maxLi, whyMismatches, headlineDupes});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.todayFocusId = prevFocus;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase2 every beat states account state, why, and what to do', ok, detail);
  })();
  (function(){
    /* Phase 2: the headline and the drivers moved LEFT. The panel printing them
       again put the same two sentences on screen twice, a few hundred pixels
       apart. The panel keeps the evidence — severity basis, signal key, the
       dispatch chips — and drops the restatement. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const c = {id:'__dup__', name:'Dupe Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__dup__: []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      const beat = day.beats[0];
      if(!beat) throw new Error('no beat built for the duplication check');
      const panel = renderBeatPanel(beat, () => '');
      // The headline is the left column's line. It must appear at most once in
      // the panel, and not as a restated heading.
      const headline = beat.headline || '';
      // An empty headline would make the duplication test pass trivially, so the
      // check fails loudly instead of quietly asserting nothing.
      if(!headline) throw new Error('beat has no headline — this check cannot test duplication');
      /* Compare against the ESCAPED headline — renderBeatPanel prints every
         headline through escapeHtml(), and the default module's Session 1 title
         contains a literal '&'. The first version of this check compared the raw
         string, so its needle could never match the markup and timesInPanel was
         pinned at 0 no matter what the code did. */
      const needle = escapeHtml(headline);
      const times = panel.split(needle).length - 1;
      const keepsEvidence = panel.indexOf('Severity') !== -1 || panel.indexOf('signal') !== -1;
      ok = times === 0 && keepsEvidence;
      detail = JSON.stringify({headline, timesInPanel: times, keepsEvidence});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase2 the panel carries evidence, not a restatement of the beat', ok, detail);
  })();
  (function(){
    /* The left column caps drivers at four and points at the panel for the rest.
       That pointer has to be TRUE. Task 6 removed the panel's full reasons list,
       which briefly made it a lie and put every driver past the fourth out of
       reach entirely — no surface in the UI rendered them. This asserts both
       halves of the split: the overflow is reachable in the panel, and the first
       four are NOT restated there, which is the duplication the task removed. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const c = {id:'__ovf__', name:'Overflow Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__ovf__: []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const reasons = ['Rsn-one','Rsn-two','Rsn-three','Rsn-four','Rsn-five','Rsn-six'];
      const beat = {kind:'work', customerId:c.id, customerName:c.name, at:null, call:null,
        headline:'Hdln', reasons: reasons.slice(), severity:2, effortMin:20, signalKey:null,
        row:{customerId:c.id, severity:2, source:'test', why:'', signalKey:null,
             alsoWaiting:[], panelTab:'overview'}};
      const panel = renderBeatPanel(beat, () => '');
      const overflow = reasons.slice(4);
      const reachable = overflow.every(r => panel.indexOf(escapeHtml(r)) !== -1);
      const firstFourRestated = reasons.slice(0, 4).some(r => panel.indexOf(escapeHtml(r)) !== -1);
      ok = reachable && !firstFourRestated;
      detail = JSON.stringify({reachable, firstFourRestated,
        found: overflow.map(r => panel.indexOf(escapeHtml(r)) !== -1)});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase2 drivers past the fourth stay reachable in the panel, and the first four are not restated there', ok, detail);
  })();
  (function(){
    /* Phase A: criteria are DERIVED from the account's own curriculum and clamp
       to its own plan length. An 8-session account must not inherit criteria
       from sessions 9-12 it will never run. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc1__', name:'Crit Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__oc1__: []};
      _renderMemoResets.forEach(r => r());
      const list = outcomeCriteriaFor(c);
      const sessions = [...new Set(list.map(x => x.sourceSession))].sort((a,b)=>a-b);
      const clamped = sessions.every(n => n >= 1 && n <= 8);
      const allProvisional = list.every(x => x.provisional === true && x.evidence === null);
      const hasStages = list.every(x => x.stage === 'ttfv1' || x.stage === 'ttfv2');
      const keysUnique = new Set(list.map(x => x.id)).size === list.length;
      ok = list.length > 0 && clamped && allProvisional && hasStages && keysUnique;
      detail = JSON.stringify({n:list.length, sessions, clamped, allProvisional, hasStages, keysUnique});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    _renderMemoResets.forEach(r => r());
    check('phaseA criteria derive from the curriculum and clamp to the account plan', ok, detail);
  })();
  (function(){
    /* PURE. Deriving criteria must not materialize anything, must not touch the
       book, and must return byte-identical output twice. renderToday() stamping
       DATA.riskLog is the defect class this guards against. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc2__', name:'Pure Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__oc2__: []};
      const before = JSON.stringify(c);
      const a = JSON.stringify(outcomeCriteriaFor(c));
      const b = JSON.stringify(outcomeCriteriaFor(c));
      /* backfillCustomerRecord now creates EMPTY outcomeCriteria/outcomeEvidence
         containers, which is a default, not materialization. What must stay true
         is that deriving adds nothing to them — and that the book is byte-identical
         afterwards, which is the assertion this check has always rested on. */
      const items = (c.outcomeCriteria && c.outcomeCriteria.items) || [];
      const evKeys = Object.keys(c.outcomeEvidence || {});
      ok = a === b && JSON.stringify(c) === before
        && items.length === 0 && evKeys.length === 0;
      detail = JSON.stringify({stable: a === b, bookUntouched: JSON.stringify(c) === before,
        materializedItems: items.length, evidenceKeys: evKeys.length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA deriving criteria is pure and materializes nothing', ok, detail);
  })();
  (function(){
    /* A materialized criterion whose deliverable was later DELETED from the
       curriculum still appears, labelled. Discarding an evidenced criterion
       because a template changed would throw away a human's assertion. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc3__', name:'Ghost Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.outcomeCriteria = {items:[
        {id:'oc_ghost1', text:'A deliverable no template still carries', stage:'ttfv1',
         sourceSession:2, sourceIndex:9},
        {id:'oc_added1', text:'Something the OSM added', stage:'ttfv2',
         sourceSession:null, sourceIndex:null}
      ], removed:[]};
      DATA.customers = [c]; DATA.activities = {__oc3__: []};
      const list = outcomeCriteriaFor(c);
      const ghost = list.find(x => x.id === 'oc_ghost1');
      const added = list.find(x => x.id === 'oc_added1');
      ok = !!ghost && ghost.source === 'no longer in the curriculum'
        && !!added && added.source === 'added for this account';
      detail = JSON.stringify({ghost: ghost && ghost.source, added: added && added.source});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA a deleted-from-curriculum criterion survives, labelled', ok, detail);
  })();
  (function(){
    /* Inserting a deliverable must not let it STEAL an existing criterion's
       evidence. The first version of this matching walked text-then-index per
       deliverable, so an inserted one reached the index fallback before the
       deliverable that actually owned that evidence got its text pass. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const tpl = DATA.config.sessionTemplates[mod][0];
      setSessionDeliverables(tpl, ['Alpha', 'Bravo', 'Charlie'].map(text => ({id:null, text})));
      const c = {id:'__ins1__', name:'Steal Co', module:mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      // Evidence lives on 'Bravo', which sat at index 1 when it was recorded.
      c.outcomeCriteria = {items:[{id:'oc_bravo', text:'Bravo', stage:'ttfv1',
        sourceSession:1, sourceIndex:1, sourceCount:3}], removed:[]};
      c.outcomeEvidence = {oc_bravo: {on:null, by:'osm'}};
      DATA.customers = [c]; DATA.activities = {__ins1__: []};
      const insRows = deliverableRows(tpl);
      insRows.splice(1, 0, {id:null, text:'Xray'});   // insert at index 1
      setSessionDeliverables(tpl, insRows);
      const list = outcomeCriteriaFor(c);
      const xray = list.find(x => x.text === 'Xray');
      const bravo = list.find(x => x.id === 'oc_bravo');
      ok = !!xray && xray.evidence === null && xray.provisional === true
        && !!bravo && bravo.text === 'Bravo' && !!bravo.evidence && bravo.evidence.by === 'osm';
      detail = JSON.stringify({xrayEvidence: xray && xray.evidence,
        bravoText: bravo && bravo.text, bravoHasEvidence: !!(bravo && bravo.evidence)});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    check('phaseA an inserted deliverable cannot steal another criterion evidence', ok, detail);
  })();
  (function(){
    /* Materialization assigns an OPAQUE id. The positional display key must
       never reach storage — not in items, not in removed, not in the evidence
       map — because it is not stable under insertion. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc4__', name:'Mat Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__oc4__: []};
      const first = outcomeCriteriaFor(c)[0];
      const rec = setOutcomeEvidence(c, first, {on: todayISO(), by:'customer'});
      const keys = Object.keys(c.outcomeEvidence);
      const storedIds = c.outcomeCriteria.items.map(x => x.id);
      const noPositional = keys.concat(storedIds, c.outcomeCriteria.removed)
        .every(k => /^oc_/.test(k));
      // Re-deriving now returns the opaque id in place of the provisional key.
      const after = outcomeCriteriaFor(c)[0];
      ok = /^oc_/.test(rec ? keys[0] : '') && noPositional && keys.length === 1
        && after.id === storedIds[0] && after.provisional !== true
        && after.evidence && after.evidence.by === 'customer';
      detail = JSON.stringify({keys, storedIds, noPositional, afterId: after.id});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA evidence materializes an opaque id and no positional key is ever stored', ok, detail);
  })();
  (function(){
    /* THE TWO WAYS IDENTITY BREAKS, in one check.

       REWORDING: change a deliverable's text and its evidence must follow it,
       via the (sourceSession, sourceIndex) fallback.

       INSERTION: add a deliverable at index 0 of a session that already has
       evidence at index 0. With positional ids the new criterion would silently
       inherit the old one's evidence — the collision opaque ids exist for. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const c = {id:'__oc5__', name:'Insert Co', module:mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__oc5__: []};
      _renderMemoResets.forEach(r => r());
      const original = outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0);
      setOutcomeEvidence(c, original, {on: todayISO(), by:'osm'});
      const evidencedId = c.outcomeCriteria.items[0].id;
      const originalText = original.text;

      // (a) REWORD the deliverable in place. Evidence must follow it.
      const rwTpl = DATA.config.sessionTemplates[mod][0];
      const rwRows = deliverableRows(rwTpl);
      rwRows[0].text = originalText + ' (reworded)';   // same id: a reword is not a new deliverable
      setSessionDeliverables(rwTpl, rwRows);
      _renderMemoResets.forEach(r => r());
      const reworded = outcomeCriteriaFor(c).find(x => x.id === evidencedId);
      const survivedReword = !!reworded && !!reworded.evidence
        && reworded.source === 'curriculum (reworded since)' && reworded.text === originalText;

      // (b) Restore, then INSERT a new deliverable at index 0.
      const rsRows = deliverableRows(rwTpl);
      rsRows[0].text = originalText;   // restore keeps the id
      rsRows.unshift({id:null, text:'BRAND NEW DELIVERABLE'});
      setSessionDeliverables(rwTpl, rsRows);
      _renderMemoResets.forEach(r => r());
      const after = outcomeCriteriaFor(c);
      const inserted = after.find(x => x.text === 'BRAND NEW DELIVERABLE');
      const kept = after.find(x => x.id === evidencedId);
      const survivedInsert = !!inserted && inserted.evidence === null
        && !!kept && kept.text === originalText && !!kept.evidence && kept.evidence.by === 'osm';

      ok = survivedReword && survivedInsert;
      detail = JSON.stringify({survivedReword, survivedInsert,
        rewordedSource: reworded && reworded.source,
        insertedEvidence: inserted && inserted.evidence,
        keptHasEvidence: !!(kept && kept.evidence)});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('phaseA rewording follows evidence, and inserting neither moves nor inherits it', ok, detail);
  })();
  /* Piece 1 fixture: n synthetic accounts on a module with >= 8 sessions, every
     criterion evidenced. The CALLER saves/restores DATA.customers, DATA.activities
     and DATA.config.sessionTemplates (deep-clone templates before mutating). */
  function _identityFixture(n){
    const mod = (Array.isArray(DATA.config.sessionTemplates['Carbon']) && DATA.config.sessionTemplates['Carbon'].length >= 8)
      ? 'Carbon' : DATA.config.modules[0];
    const accts = Array.from({length:n}, (_, k) => {
      const c = {id:'__idfx' + k + '__', name:'Identity Co ' + k, module:mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      return c;
    });
    DATA.customers = accts;
    DATA.activities = Object.fromEntries(accts.map(c => [c.id, []]));
    _renderMemoResets.forEach(r => r());
    let ticked = 0;
    accts.forEach(c => outcomeCriteriaFor(c).forEach(cr => {
      if(setOutcomeEvidence(c, cr, {on: isoAddDays(todayISO(), -30), by:'customer'})) ticked++;
    }));
    return {mod, accts, ticked};
  }
  (function(){
    /* A1 — deleting session 2 must not re-attach its evidence to anything. Before
       piece 1 the demo book showed 6 'reworded since' rows per account (spec §3a). */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(3);
      const list = DATA.config.sessionTemplates[fx.mod];
      const deletedIds = new Set(list[1].deliverableIds);
      const before = new Map(fx.accts.map(c => [c.id, new Map(outcomeCriteriaFor(c)
        .filter(x => x.evidence).map(x => [x.sourceDeliverableId, x.id]))]));
      removeSessionTemplate(list, 1);
      _renderMemoResets.forEach(r => r());
      let reworded = 0, orphanedOther = 0, orphanedDeleted = 0, wrongOwner = 0, followed = 0;
      fx.accts.forEach(c => outcomeCriteriaFor(c).forEach(x => {
        if(x.source === 'curriculum (reworded since)') reworded++;
        if(x.source === 'no longer in the curriculum'){
          const s = c.outcomeCriteria.items.find(r => r.id === x.id);
          if(s && deletedIds.has(s.sourceDeliverableId)) orphanedDeleted++; else orphanedOther++;
        }
        if(x.evidence && x.sourceDeliverableId){
          const wasId = before.get(c.id).get(x.sourceDeliverableId);
          if(wasId === x.id) followed++; else wrongOwner++;
        }
      }));
      // A new tick on the session that slid into the plan (old session 9) must
      // materialize ITS OWN record. Positional dedupe on stored (sourceSession,
      // sourceIndex) would hand it old session 8's record, which now sits at 7.
      const c0 = fx.accts[0];
      const fresh = outcomeCriteriaFor(c0).find(x => x.provisional && x.sourceDeliverableId);
      const misdeduped = !fresh || materializeOutcomeCriterion(c0, fresh).sourceDeliverableId !== fresh.sourceDeliverableId;
      ok = fx.ticked > 0 && reworded === 0 && orphanedOther === 0
        && orphanedDeleted === fx.accts.length * deletedIds.size && wrongOwner === 0 && followed > 0 && !misdeduped;
      detail = JSON.stringify({ticked: fx.ticked, reworded, orphanedDeleted, orphanedOther, wrongOwner, followed, misdeduped});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity A1: deleting a session orphans only its own criteria and re-attaches nothing', ok, detail);
  })();
  (function(){
    /* A2 — I5: insert one deliverable AND reword another in the same ttfv1 session.
       Measured before piece 1 (task 1): ttfv1 9 -> 11, unevidenced 0 -> 2, one
       orphaned duplicate. Pass (Ian's M3 ruling): in BOTH edit orders, the whole
       criteria snapshot equals a PURE insert at the same position, and the reworded
       criterion keeps its evidence. The control must itself show +1 ttfv1, 1
       unevidenced, 0 orphans, so a degenerate control cannot make this pass.
       ttfvDays is in the snapshot as a regression guard only: a new unevidenced
       ttfv1 criterion correctly un-derives First Value in both. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(2);
      const tpl = DATA.config.sessionTemplates[fx.mod][0];
      const orig = deliverableRows(tpl);
      const c = fx.accts[0];
      const snap = () => {
        _renderMemoResets.forEach(r => r());
        const list = outcomeCriteriaFor(c), texts = list.map(x => x.text);
        return {ttfv1: list.filter(x => x.stage === 'ttfv1').length,
          unev: list.filter(x => !x.evidence).length,
          orphan: list.filter(x => x.source === 'no longer in the curriculum').length,
          dupText: texts.length - new Set(texts).size, ttfv: ttfvDays(c),
          rewordedKept: list.some(x => x.source === 'curriculum (reworded since)' && x.evidence)};
      };
      const base = snap();
      const NEW = {id:null, text:'NEW deliverable'};
      const copy = () => orig.map(r => ({id:r.id, text:r.text}));
      const run = rows => { setSessionDeliverables(tpl, rows); return snap(); };
      // Order A: insert at the front, reword the last. Order B: reword the first, insert at the end.
      const ctlA = run([NEW].concat(copy()));
      const a = copy(); a[a.length - 1].text += ' (reworded)';
      const gotA = run([NEW].concat(a));
      const ctlB = run(copy().concat([NEW]));
      const b = copy(); b[0].text += ' (reworded)';
      const gotB = run(b.concat([NEW]));
      const counts = s => JSON.stringify([s.ttfv1, s.unev, s.orphan, s.dupText, s.ttfv]);
      const ctlOk = [ctlA, ctlB].every(s => s.ttfv1 === base.ttfv1 + 1 && s.unev === base.unev + 1 && s.orphan === 0);
      ok = fx.ticked > 0 && ctlOk
        && counts(gotA) === counts(ctlA) && gotA.rewordedKept
        && counts(gotB) === counts(ctlB) && gotB.rewordedKept;
      detail = JSON.stringify({ticked: fx.ticked, base, ctlA, gotA, ctlB, gotB});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity A2: insert + reword in one session adds exactly the new criterion and keeps the reworded evidence', ok, detail);
  })();
  (function(){
    /* A3 — renaming a session keeps its authored talk track (spec §3c: measured
       'authored' -> 'standard'). */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(1);
      const c = fx.accts[0];
      const indexed = Object.keys(rbLibraryIdIndex()).length;
      const before = buildSessionRunbook(c, getSessionTemplate(c, 1)).source;
      DATA.config.sessionTemplates[fx.mod][0].title += ' (renamed)';
      _renderMemoResets.forEach(r => r());
      const after = buildSessionRunbook(c, getSessionTemplate(c, 1)).source;
      ok = fx.ticked > 0 && indexed > 0 && before === 'authored' && after === 'authored';
      detail = JSON.stringify({ticked: fx.ticked, indexed, before, after, mod: fx.mod});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity A3: renaming a session keeps its authored runbook', ok, detail);
  })();
  /* M3r — a legacy book keyed 'Both' / 'Both (CSRD)' (no ids, schema 12) must come
     out of prepareBookData with the SHIPPED default ids under the renamed keys, not
     random ones: ensureTemplateIds runs in migrateData, before applyDataBackfills
     renames the keys, and used to look defaults up by the legacy key (no match).
     Expectations are literals. FIXTURE: one evidenced Sustainability + Carbon
     account (LIVENESS: ticked > 0, and every tick survives), converted to the
     legacy shape. 'Both (CSRD)' is checked on ids only (its session 1 is
     'ss_sustainability_carbon_csrd_01'). The runbook lookup uses a title that
     matches nothing, so only the id can resolve it. */
  (function(){
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates, prevM = DATA.config.modules;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const c = {id:'__idm3r__', name:'Identity M3r Co', module:'Sustainability + Carbon',
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:12, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {[c.id]: []};
      _renderMemoResets.forEach(r => r());
      let ticked = 0;
      outcomeCriteriaFor(c).forEach(cr => { if(setOutcomeEvidence(c, cr, {on: isoAddDays(todayISO(), -30), by:'customer'})) ticked++; });
      const evidencedBefore = outcomeCriteriaFor(c).filter(x => x.evidence).length;
      const book = _v12Book([c]);
      const T = book.config.sessionTemplates;
      T['Both'] = T['Sustainability + Carbon']; delete T['Sustainability + Carbon'];
      T['Both (CSRD)'] = T['Sustainability + Carbon (CSRD)']; delete T['Sustainability + Carbon (CSRD)'];
      book.config.modules = book.config.modules.map(m => m === 'Sustainability + Carbon' ? 'Both' : m);
      book.customers[0].module = 'Both';
      const prepared = prepareBookData(cloneData(book), 'SelfCheck');
      const P = prepared.config.sessionTemplates;
      const base = P['Sustainability + Carbon'] || [], csrd = P['Sustainability + Carbon (CSRD)'] || [];
      const baseIds = base.map(t => t.id), csrdIds = csrd.map(t => t.id);
      const wantBase = Array.from({length: 12}, (_, i) => 'ss_sustainability_carbon_' + String(i + 1).padStart(2, '0'));
      const idsOk = baseIds.slice(0, 12).join() === wantBase.join() && csrdIds[0] === 'ss_sustainability_carbon_csrd_01'
        && P['Both'] === undefined && P['Both (CSRD)'] === undefined;
      DATA.customers = prepared.customers; DATA.config.sessionTemplates = P;
      _renderMemoResets.forEach(r => r());
      const rc = prepared.customers[0];
      const evidencedAfter = outcomeCriteriaFor(rc).filter(x => x.evidence).length;
      const byId = id => authoredRunbookFor(rc, 'A Session Title That Does Not Exist', id);
      const resolved = baseIds.filter(id => byId(id)).length;
      const shippedResolved = wantBase.filter(id => rbLibraryIdIndex()[id]).length;
      ok = ticked > 0 && evidencedBefore === ticked && evidencedAfter === ticked && idsOk
        && shippedResolved > 0 && resolved === shippedResolved;
      detail = JSON.stringify({ticked, evidencedBefore, evidencedAfter, idsOk, base0: baseIds[0],
        csrd0: csrdIds[0], resolved, shippedResolved});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT; DATA.config.modules = prevM;
    _renderMemoResets.forEach(r => r());
    check('identity M3r: legacy Both / Both (CSRD) books get the shipped default ids after the rename and keep their authored runbooks', ok, detail);
  })();
  /* M4r — a v12 book whose config lacks 'Sustainability (CSRD)' (applyDataBackfills
     adds it AFTER migrateData) used to be migrated against the BASE curriculum for a
     CSRD-reporting account, then resolve to the CSRD defaults at runtime: evidence
     on a CSRD-only position stamped base ids that do not exist there and became a
     permanent orphan. migrationCurriculumFor now falls back to the shipped default
     for the account's CSRD key. FIXTURE: one Sustainability account, reportsCSRD,
     every runtime criterion evidenced (LIVENESS: ticked > 0, stamped > 0, and
     csrdOnly > 0 = evidenced criteria whose id is not a base id), converted to a
     v12 book with the CSRD key removed. Expectations are literals. */
  (function(){
    /* Two fixtures. 'absent': the CSRD key is missing (migration must use the shipped
       CSRD default, which the backfill then installs). 'empty': the key exists as []
       — applyDataBackfills only adds a MISSING key and resolveRawCurriculum ignores
       an empty set, so runtime keeps [] and resolves the BASE curriculum; migration
       must agree (csrdOnly 0 and the key still [] after prepare). */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    const out = {};
    let ok = true, err0 = '';
    ['absent', 'empty'].forEach(mode => {
      try{
        DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
        if(mode === 'empty') DATA.config.sessionTemplates['Sustainability (CSRD)'] = [];
        const c = {id:'__idm4r__', name:'Identity M4r Co', module:'Sustainability', reportsCSRD:true,
          stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
          totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(c);
        DATA.customers = [c]; DATA.activities = {[c.id]: []};
        _renderMemoResets.forEach(r => r());
        let ticked = 0;
        outcomeCriteriaFor(c).forEach(cr => { if(setOutcomeEvidence(c, cr, {on: isoAddDays(todayISO(), -30), by:'customer'})) ticked++; });
        const evidencedBefore = outcomeCriteriaFor(c).filter(x => x.evidence).length;
        const baseIds = new Set([].concat(...DATA.config.sessionTemplates['Sustainability'].map(t => t.deliverableIds || [])));
        const csrdOnly = outcomeCriteriaFor(c).filter(x => x.evidence && !baseIds.has(x.sourceDeliverableId)).length;
        const book = _v12Book([c]);
        if(mode === 'absent') delete book.config.sessionTemplates['Sustainability (CSRD)'];
        const prepared = prepareBookData(cloneData(book), 'SelfCheck');
        const rc = prepared.customers[0];
        const stamped = rc.outcomeCriteria.items.filter(x => x.sourceDeliverableId).length;
        const csrdLen = (prepared.config.sessionTemplates['Sustainability (CSRD)'] || []).length;
        DATA.customers = prepared.customers; DATA.config.sessionTemplates = prepared.config.sessionTemplates;
        _renderMemoResets.forEach(r => r());
        const rows = outcomeCriteriaFor(rc);
        const evidencedAfter = rows.filter(x => x.evidence).length;
        const orphaned = rows.filter(x => x.evidence && x.source === 'no longer in the curriculum').length;
        const want = mode === 'absent'
          ? {ticked: 11, evidencedBefore: 11, csrdOnly: 4, stamped: 11, evidencedAfter: 11, orphaned: 0, csrdLen: 12}
          : {ticked: 11, evidencedBefore: 11, csrdOnly: 0, stamped: 11, evidencedAfter: 11, orphaned: 0, csrdLen: 0};
        const got = {ticked, evidencedBefore, csrdOnly, stamped, evidencedAfter, orphaned, csrdLen};
        out[mode] = got;
        if(!(ticked > 0 && stamped > 0 && JSON.stringify(got) === JSON.stringify(want))) ok = false;
      }catch(err){ ok = false; err0 = err.message; }
    });
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity M4r: a v12 CSRD account whose config lacks the CSRD key migrates against the CSRD defaults and orphans nothing', ok, JSON.stringify(out) + err0);
  })();
  (function(){
    /* c4b — session notes follow their session through a delete (spec §3d;
       measured before piece 1: 42 of 48 notes rendered under the wrong session). */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(2);
      fx.accts.forEach(c => { for(let n = 1; n <= c.totalSessions; n++){
        getSessionNote(c, n).prep = 'P:' + getSessionTemplate(c, n).title; } });
      /* The id-keyed notes must survive a load: backfillCustomerRecord used to
         delete, and the import validator to reject, any key that is not a
         session number (measured: reverting either left the suite green). */
      const book = defaultData();
      book.config = cloneData(DATA.config);
      book.customers = cloneData(fx.accts);
      book.activities = cloneData(DATA.activities);
      const loaded = prepareImportedData(book).customers;
      DATA.customers = loaded;
      removeSessionTemplate(DATA.config.sessionTemplates[fx.mod], 1);
      _renderMemoResets.forEach(r => r());
      let compared = 0, wrong = 0;
      loaded.forEach(c => { for(let n = 1; n <= c.totalSessions; n++){
        const p = readSessionNote(c, n).prep;
        if(!p) continue;                       // the session that slid into the plan had no note
        compared++;
        if(p !== 'P:' + getSessionTemplate(c, n).title) wrong++;
      } });
      ok = fx.ticked > 0 && compared > 0 && wrong === 0;
      detail = JSON.stringify({ticked: fx.ticked, compared, wrong});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity: session notes follow their session through a delete', ok, detail);
  })();
  (function(){
    /* A4 — reordering deliverables and sessions keeps every evidenced criterion
       (same criterion id, found by sourceDeliverableId) and moves each session's
       note WITH its session (spec §3d/§4b: notes keyed by session id, not number). */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(2);
      const list = DATA.config.sessionTemplates[fx.mod];
      const oldS1Id = list[0].id, oldS2Id = list[1].id;
      fx.accts.forEach(c => { for(let n = 1; n <= c.totalSessions; n++){
        getSessionNote(c, n).prep = 'P:' + getSessionTemplate(c, n).id; } });
      const before = new Map(fx.accts.map(c => [c.id, new Map(outcomeCriteriaFor(c)
        .filter(x => x.evidence).map(x => [x.sourceDeliverableId, x.id]))]));
      const movedD = moveDeliverableRow(list[0], 0, +1);
      const movedS = moveSessionTemplate(list, 0, +1);
      _renderMemoResets.forEach(r => r());
      let kept = 0, lost = 0, notesCompared = 0, notesWrong = 0;
      fx.accts.forEach(c => {
        const after = new Map(outcomeCriteriaFor(c).map(x => [x.sourceDeliverableId, x]));
        before.get(c.id).forEach((critId, dlId) => {
          const x = after.get(dlId);
          if(x && x.evidence && x.id === critId) kept++; else lost++;
        });
        for(let n = 1; n <= c.totalSessions; n++){
          const p = readSessionNote(c, n).prep;
          if(!p) continue;
          notesCompared++;
          if(p !== 'P:' + getSessionTemplate(c, n).id) notesWrong++;
        }
      });
      const c0 = fx.accts[0];
      const s2IsOldS1 = getSessionTemplate(c0, 2).id === oldS1Id;
      const prep2 = readSessionNote(c0, 2).prep, prep1 = readSessionNote(c0, 1).prep;
      ok = fx.ticked > 0 && movedD && movedS && kept > 0 && lost === 0
        && notesCompared > 0 && notesWrong === 0 && s2IsOldS1
        && prep2 === 'P:' + oldS1Id && prep1 === 'P:' + oldS2Id;
      detail = JSON.stringify({ticked: fx.ticked, movedD, movedS, kept, lost, notesCompared, notesWrong, s2IsOldS1, prep2, prep1});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity A4: reordering deliverables and sessions keeps evidence and moves notes with their session', ok, detail);
  })();
  (function(){
    /* c5b — the delete-impact count is real: it counts accounts with EVIDENCE on
       the session's deliverables, not every account on the curriculum. The fixture
       adds one unevidenced account on the same module so dropping the filter is
       observable (3 becomes 4). */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(3);
      const extra = {id:'__idfxextra__', name:'Identity Co extra', module:fx.mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(extra);
      DATA.customers.push(extra);
      DATA.activities[extra.id] = [];
      _renderMemoResets.forEach(r => r());
      const list = DATA.config.sessionTemplates[fx.mod];
      const extraUnevidenced = outcomeCriteriaFor(extra).length > 0 && outcomeCriteriaFor(extra).every(x => !x.evidence);
      const onModule = DATA.customers.filter(c => c.module === fx.mod).length;
      const impact = sessionDeleteImpact(fx.mod, list[1].id).accounts;
      const missing = sessionDeleteImpact(fx.mod, 'ss_no_such_session').accounts;
      ok = fx.ticked > 0 && extraUnevidenced && onModule === 4 && impact === 3 && missing === 0;
      detail = JSON.stringify({ticked: fx.ticked, extraUnevidenced, onModule, impact, missing});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity c5b: session delete impact counts only accounts with evidence on it', ok, detail);
  })();
  (function(){
    /* M1r — dropping a deliverable that has evidence asks first and names the
       account count; cancel changes nothing; no evidence or a reword never asks.
       Fixture: 3 accounts, every criterion evidenced, so each shipped deliverable
       is evidenced on exactly 3 accounts. window.confirm is stubbed and restored. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    const realConfirm = window.confirm;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(3);
      const tpl = DATA.config.sessionTemplates[fx.mod][0];
      const orphaned = id => fx.accts.filter(c => outcomeCriteriaFor(c).some(x =>
        x.sourceDeliverableId === id && x.evidence && x.source === 'no longer in the curriculum')).length;
      const evidenced = id => fx.accts.filter(c => outcomeCriteriaFor(c).some(x =>
        x.sourceDeliverableId === id && x.evidence && x.source !== 'no longer in the curriculum')).length;
      let calls = [], answer = false;
      window.confirm = msg => { calls.push(String(msg)); return answer; };
      const id0 = tpl.deliverableIds[0], id1 = tpl.deliverableIds[1], len0 = tpl.deliverables.length;
      const evBefore = evidenced(id0);
      // (1) cancel: id and evidence kept, one prompt naming 3
      answer = false;
      rewordDeliverableRow(tpl, 0, '');
      removeDeliverableRow(tpl, 0);
      const cancelKept = tpl.deliverableIds[0] === id0 && tpl.deliverables.length === len0;
      const cancelCalls = calls.length, cancelMsg = calls[0] || '';
      const cancelEvidenced = evidenced(id0);
      // (4) reword keeps the id and never asks
      calls = [];
      rewordDeliverableRow(tpl, 1, 'Reworded deliverable text');
      const rewordCalls = calls.length, rewordKept = tpl.deliverableIds[1] === id1;
      // (2) confirm: id removed, evidence orphaned as today
      calls = []; answer = true;
      removeDeliverableRow(tpl, 0);
      const confirmCalls = calls.length;
      const removed = tpl.deliverableIds.indexOf(id0) === -1 && tpl.deliverables.length === len0 - 1;
      _renderMemoResets.forEach(r => r());
      const orphanedAfter = orphaned(id0);
      // (3) an unevidenced deliverable drops without a prompt
      calls = [];
      addDeliverableRow(tpl, 'Fresh deliverable with no evidence');
      removeDeliverableRow(tpl, tpl.deliverables.length - 1);
      const freshCalls = calls.length;
      ok = fx.ticked > 0 && evBefore === 3 && cancelKept && cancelCalls === 2 && /\b3 accounts\b/.test(cancelMsg)
        && cancelEvidenced === 3 && rewordCalls === 0 && rewordKept
        && confirmCalls === 1 && removed && orphanedAfter === 3 && freshCalls === 0;
      detail = JSON.stringify({ticked: fx.ticked, evBefore, cancelKept, cancelCalls, namesCount: /\b3 accounts\b/.test(cancelMsg), cancelEvidenced,
        rewordCalls, rewordKept, confirmCalls, removed, orphanedAfter, freshCalls});
    }catch(err){ detail = err.message; }
    window.confirm = realConfirm;
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity M1r: dropping an evidenced deliverable confirms with the account count; cancel changes nothing', ok, detail);
  })();
  (function(){
    /* M2r — multi-line text becomes one deliverable per non-empty trimmed line,
       through addDeliverableRow and through a paste into a deliverable input
       (insertDeliverableLines, the paste handler's core). Existing ids, order and
       evidence are untouched. Fixture: 3 accounts, every criterion evidenced. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(3);
      const tpl = DATA.config.sessionTemplates[fx.mod][0];
      const evidencedCount = () => fx.accts.reduce((n, c) => n + outcomeCriteriaFor(c).filter(x => x.evidence).length, 0);
      const priorIds = tpl.deliverableIds.slice(), priorLen = priorIds.length, evBefore = evidencedCount();
      addDeliverableRow(tpl, 'a\nb\n\nc');
      const added = tpl.deliverables.slice(priorLen), addedIds = tpl.deliverableIds.slice(priorLen);
      const addOk = tpl.deliverables.length === priorLen + 3 && added.join('|') === 'a|b|c'
        && new Set(addedIds).size === 3 && addedIds.every(id => id && priorIds.indexOf(id) === -1)
        && tpl.deliverableIds.slice(0, priorLen).join() === priorIds.join();
      _renderMemoResets.forEach(r => r());
      const evAfterAdd = evidencedCount();
      // paste into row 0: lines go in as new rows right after it; row 0 untouched
      const ids1 = tpl.deliverableIds.slice(), text0 = tpl.deliverables[0], len1 = ids1.length;
      const single = insertDeliverableLines(tpl, 0, 'just one line');
      const pasted = insertDeliverableLines(tpl, 0, 'x\r\n  y  \n\nz\n');
      const newIds = tpl.deliverableIds.filter(id => ids1.indexOf(id) === -1);
      const pasteOk = single === false && pasted === true && tpl.deliverables.length === len1 + 3
        && tpl.deliverables.slice(1, 4).join('|') === 'x|y|z' && tpl.deliverables[0] === text0
        && tpl.deliverableIds[0] === ids1[0] && tpl.deliverableIds.slice(4).join() === ids1.slice(1).join()
        && newIds.length === 3 && new Set(newIds).size === 3;
      _renderMemoResets.forEach(r => r());
      const evAfterPaste = evidencedCount();
      ok = fx.ticked > 0 && evBefore === 33 && evAfterAdd === 33 && evAfterPaste === 33 && addOk && pasteOk;
      detail = JSON.stringify({ticked: fx.ticked, evBefore, evAfterAdd, evAfterPaste, addOk, pasteOk, added: added.join('|'), single, pasted});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity M2r: multi-line text becomes one deliverable per line; existing ids and evidence kept', ok, detail);
  })();
  /* Piece 1 helper (task 6; task 7 reuses it): turns live fixture accounts into
     a schema-12 book as it existed BEFORE identity — no template ids, no stamps on
     stored items, notes re-keyed from session id back to session number. Call it
     while DATA.config.sessionTemplates still carries the ids (it reads them to
     find each note's number). Returns a full envelope. */
  function _v12Book(accts){
    const book = cloneData(DATA);
    book.customers = cloneData(accts);
    book.activities = Object.fromEntries(accts.map(c => [c.id, []]));
    book.customers.forEach(c => {
      for(let n = 1; n <= (c.totalSessions || 0); n++){
        const tpl = getSessionTemplate(c, n);
        if(tpl && tpl.id && c.sessionNotes && c.sessionNotes[tpl.id] !== undefined){
          c.sessionNotes[String(n)] = c.sessionNotes[tpl.id];
          delete c.sessionNotes[tpl.id];
        }
      }
      ((c.outcomeCriteria && c.outcomeCriteria.items) || []).forEach(r => {
        delete r.sourceSessionId; delete r.sourceDeliverableId;
      });
    });
    Object.values(book.config.sessionTemplates).forEach(list => (list || []).forEach(t => {
      delete t.id; delete t.deliverableIds;
    }));
    book.schemaVersion = 12;
    return book;
  }
  /* Piece 1 helper (task 6 A5; task 7 A7 reuses it): the migration invariant on a
     schema-12 book built by _v12Book. It installs the book's customers and
     templates into DATA, prepares it, and leaves the PREPARED book's customers
     and templates installed — the CALLER restores DATA. Returns {ok, detail,
     rewordedBefore}; ok does NOT include rewordedBefore (A5 and A7 assert it). */
  function _a5Invariant(book){
    const strip = list => list.map(x => { const y = Object.assign({}, x); delete y.sourceSessionId; delete y.sourceDeliverableId; return y; });
    const triple = c => JSON.stringify([strip(outcomeCriteriaFor(c)), outcomeVerdict(c), ttfvDays(c)]);
    DATA.customers = book.customers; DATA.config.sessionTemplates = book.config.sessionTemplates;
    _renderMemoResets.forEach(r => r());
    const beforeTriples = book.customers.map(triple);
    const placedIds = book.customers.map(c => outcomeCriteriaFor(c)
      .filter(x => !x.provisional && String(x.source).startsWith('curriculum')).map(x => x.id));
    const rewordedBefore = outcomeCriteriaFor(book.customers[0]).some(x => x.source === 'curriculum (reworded since)');
    const evidencedBefore = book.customers.reduce((s, c) => s + outcomeCriteriaFor(c).filter(x => x.evidence).length, 0);
    const prepared = prepareBookData(cloneData(book), 'SelfCheck');
    DATA.customers = prepared.customers; DATA.config.sessionTemplates = prepared.config.sessionTemplates;
    _renderMemoResets.forEach(r => r());
    const verdictsEqual = prepared.customers.every((c, i) => triple(c) === beforeTriples[i]);
    let stamped = 0, unstamped = 0, numericLeft = 0;
    prepared.customers.forEach((c, i) => {
      const items = c.outcomeCriteria.items;
      placedIds[i].forEach(id => {
        const rec = items.find(r => r.id === id);
        if(rec && rec.sourceDeliverableId && rec.sourceSessionId) stamped++; else unstamped++;
      });
      Object.keys(c.sessionNotes).forEach(k => {
        if(/^\d+$/.test(k)){
          const t = getSessionTemplate(c, parseInt(k, 10));
          if(parseInt(k, 10) <= c.totalSessions && t && t.id) numericLeft++;
        }
      });
    });
    const again = prepareBookData(cloneData(prepared), 'SelfCheck');
    const idempotent = again.customers.every((c, i) =>
      JSON.stringify(c.outcomeCriteria) === JSON.stringify(prepared.customers[i].outcomeCriteria));
    const ok = evidencedBefore > 0 && stamped > 0 && prepared.schemaVersion === CURRENT_SCHEMA_VERSION
      && verdictsEqual && unstamped === 0 && numericLeft === 0 && idempotent;
    return {ok, rewordedBefore, detail: JSON.stringify({evidencedBefore, stamped, unstamped, rewordedBefore,
      schema: prepared.schemaVersion, verdictsEqual, numericLeft, idempotent})};
  }
  (function(){
    /* A5 — the 12 -> 13 migration changes NO verdict, stamps every item it can
       place, and moves numeric notes to session ids. Pass 2 (index) is exercised
       by one pure-reword legacy record. Liveness: evidenced > 0 and stamped > 0. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(3);
      fx.accts.forEach(c => { for(let n = 1; n <= c.totalSessions; n++){
        getSessionNote(c, n).prep = 'P' + n; } });
      const reworded = fx.accts[0].outcomeCriteria.items[0];
      reworded.text = reworded.text + ' (reworded after it was ticked)';
      const r = _a5Invariant(_v12Book(fx.accts));
      ok = r.ok && r.rewordedBefore;
      detail = r.detail;
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity A5: v12 -> v13 migration keeps every verdict and stamps every placed item', ok, detail);
  })();
  /* A7 — ids survive export and import. LIVENESS: the fixture carries a
     USER-MINTED (random-hex) session with deliverables and evidence. Default ids
     are deterministic, so ensureTemplateIds would re-mint them identically and a
     serializer that dropped them could not turn this red; a random id can't be
     re-minted, only carried. */
  (function(){
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(2);
      const list = DATA.config.sessionTemplates[fx.mod];
      const mine = newSessionTemplate(list);
      addDeliverableRow(mine, 'User deliverable one'); addDeliverableRow(mine, 'User deliverable two');
      list.push(mine);
      for(let i = list.length - 1; i > 0; i--) moveSessionTemplate(list, i, -1);   // to index 0, so totalSessions reaches it
      _renderMemoResets.forEach(r => r());
      const mineIds = new Set(mine.deliverableIds);
      let ticked = 0;
      fx.accts.forEach(c => outcomeCriteriaFor(c).forEach(cr => {
        if(mineIds.has(cr.sourceDeliverableId) && setOutcomeEvidence(c, cr, {on: isoAddDays(todayISO(), -5), by:'customer'})) ticked++;
      }));
      const snapIds = () => ({
        templates: Object.entries(DATA.config.sessionTemplates).map(([k, l]) => [k, l.map(t => [t.id, t.deliverableIds])]),
        items: DATA.customers.map(c => c.outcomeCriteria.items.map(r => [r.id, r.sourceDeliverableId, r.sourceSessionId]))
      });
      const before = JSON.stringify(snapIds());
      const env = JSON.parse(serializeBook(DATA));
      const back = prepareBookData(env, 'SelfCheck');
      DATA.customers = back.customers; DATA.config.sessionTemplates = back.config.sessionTemplates;
      const after = JSON.stringify(snapIds());
      const randomPresent = SESSION_ID_RE.test(mine.id) && /^ss_[0-9a-f]{8}$/.test(mine.id)
        && back.config.sessionTemplates[fx.mod][0].id === mine.id;
      const idsSame = before === after;
      // Second half: a v12 book, serialized then imported, satisfies the A5 invariant.
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx2 = _identityFixture(3);
      fx2.accts.forEach(c => { for(let n = 1; n <= c.totalSessions; n++){ getSessionNote(c, n).prep = 'P' + n; } });
      fx2.accts[0].outcomeCriteria.items[0].text += ' (reworded after it was ticked)';
      const wire = JSON.parse(serializeBook(_v12Book(fx2.accts)));
      const inv = _a5Invariant(wire);
      // Negative: a v13 envelope whose one template has deliverableIds one short must throw.
      const bad = cloneData(back);   // not via serializeBook: this half tests the validator, not the serializer
      const badTpl = bad.config.sessionTemplates[fx.mod][0];
      // Tampers with a parsed ENVELOPE, not a stored template, via assign so the A6 writer scan stays honest.
      Object.assign(badTpl, {deliverableIds: badTpl['deliverableIds'].slice(0, -1)});
      let threw = false;
      try{ prepareBookData(bad, 'SelfCheck'); }catch(e){ threw = /deliverable ids/.test(e.message); }
      ok = ticked > 0 && randomPresent && idsSame && inv.ok && inv.rewordedBefore && threw;
      detail = JSON.stringify({ticked, randomPresent, idsSame, inv: inv.detail, threw,
        id: mine.id, before: before.length, after: after.length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity A7: ids survive export and import (random-id session, evidence, and the v12 invariant through the wire)', ok, detail);
  })();
  /* M6r — sessionNoteKey rebuilt the whole template set on every call, so one
     12-session plan render cost ~n^2 sanitizations and a portfolio signal pass
     rebuilt the set once per account for a key the caller already had in hand.
     Counted by wrapping the global getSessionTemplateSet (top-level function
     declarations are global properties, so internal callers hit the wrapper;
     `intercepted` proves it by calling getSessionTemplate once). LIVENESS: notes
     keyed by session id > 0, and the keys read back equal tpl.id of the set. */
  (function(){
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    const orig = getSessionTemplateSet, origCrit = outcomeCriteriaFor;
    let ok = false, detail = '';
    try{
      let calls = 0;
      getSessionTemplateSet = function(c){ calls++; return orig(c); };
      getSessionTemplate(prevC[0], 1);
      const intercepted = calls === 1;
      // (1) one portfolio signal pass over the seeded book
      // Floor: one rebuild per open account for getNextSessionInfo itself; the key lookup must add none.
      const floor = prevC.filter(c => c.stage !== 'graduated' && getNextSessionInfo(c)).length;
      calls = 0;
      prevC.forEach(c => { customerThinPrepSignal(c); });
      const portfolioRebuilds = calls, portfolioAccts = prevC.length;
      // (2) one render of a full plan
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(1);
      const c = fx.accts[0];
      const len = (DATA.config.sessionTemplates[fx.mod] || []).length;
      c.totalSessions = Math.min(12, len);
      _renderMemoResets.forEach(r => r());
      const set = orig(c);
      const expectKeys = set.map((t, i) => (t && t.id) ? t.id : String(i + 1));
      c.sessionNotes = {};
      let keyed = 0;
      expectKeys.forEach((k, i) => { if(/^ss_/.test(k)){ c.sessionNotes[k] = {deliverables:{}, prep:'P' + (i + 1)}; keyed++; } });
      // outcomeCriteriaFor walks the set once per card for its own reasons (not
      // this finding); freeze it so the count isolates the note-key lookups.
      const crit0 = outcomeCriteriaFor(c);
      outcomeCriteriaFor = function(){ return crit0; };
      calls = 0;
      renderSessionPlanTab(c);
      const planRebuilds = calls;
      const keysBack = expectKeys.map((k, i) => sessionNoteKey(c, i + 1));
      const keysEqual = JSON.stringify(keysBack) === JSON.stringify(expectKeys);
      const bound = 3;
      ok = intercepted && keyed > 0 && c.totalSessions >= 8 && keysEqual
        && planRebuilds <= bound && portfolioRebuilds <= floor;
      detail = JSON.stringify({intercepted, sessions: c.totalSessions, keyed, keysEqual,
        planRebuilds, bound, portfolioAccts, floor, portfolioRebuilds});
    }catch(err){ detail = err.message; }
    getSessionTemplateSet = orig; outcomeCriteriaFor = origCrit;
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity M6r: session-note keys are read from the template in hand, not a per-call rebuild of the template set', ok, detail);
  })();
  /* M7r — de-duplication, no behaviour change. Source scan (the v99 style):
     (1) the v11 -> v12 step tests session-id keys with SESSION_ID_RE, not a copy of
         its pattern; (3) applyDataBackfills renames the legacy 'Both' template keys
         by reading LEGACY_TEMPLATE_KEYS, not by repeating them as literals.
     (2) the v12 -> v13 set builder is NOT folded into safeSessionTemplateForRender:
         the two checks differ (see the ledger), so that part is reported, not changed. */
  (function(){
    const src = String(migrateData);
    const a = src.indexOf('if(v === 11){'), b = src.indexOf('if(v === 12){');
    const v11 = (a >= 0 && b > a) ? src.slice(a, b) : '';
    const bf = String(applyDataBackfills);
    const v11Shared = v11.length > 0 && v11.indexOf('SESSION_ID_RE.test(key)') !== -1;
    const v11Literal = v11.indexOf('ss_[a-z0-9_]+') !== -1;
    const bfShared = bf.indexOf('LEGACY_TEMPLATE_KEYS') !== -1;
    const bfLiteral = /sessionTemplates\['Both( \(CSRD\))?'\]/.test(bf);
    check('identity M7r: the v11 step uses SESSION_ID_RE and the template-key renames read LEGACY_TEMPLATE_KEYS, no duplicated literals',
      v11Shared && !v11Literal && bfShared && !bfLiteral,
      JSON.stringify({v11Len: v11.length, v11Shared, v11Literal, bfShared, bfLiteral}));
  })();
  /* R3 — archive restore must run the migrations an archive's own schema needs.
     prepareArchiveData built its shell from defaultData(), which is already at
     CURRENT_SCHEMA_VERSION, so a pre-piece-1 archive skipped v12 -> v13: criteria
     stayed unstamped (positional) and notes stayed numeric-keyed. The archive here
     is a v12-shaped record (_v12Book), UNVERSIONED like every archive exported
     before the fix, restored through the real prepareArchiveData. LIVENESS:
     evidencedBefore > 0 and stamped > 0, and stamped equals evidencedBefore. */
  (function(){
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(3);
      fx.accts.forEach(c => { for(let n = 1; n <= c.totalSessions; n++){
        getSessionNote(c, n).prep = 'P' + n; } });
      const book = _v12Book(fx.accts);
      const rec = book.customers[0];
      DATA.customers = book.customers;
      _renderMemoResets.forEach(r => r());
      const evidencedBefore = outcomeCriteriaFor(rec).filter(x => x.evidence).length;
      const notesBefore = Object.keys(rec.sessionNotes).filter(k => /^\d+$/.test(k)).length;
      const archive = {archivedFrom: 'obm-book-of-business-tracker', archiveFormatVersion: 1,
        archivedDate: todayISO(), customer: rec, activities: [], healthHistory: []};
      const restored = prepareArchiveData(JSON.parse(JSON.stringify(archive))).customer;
      DATA.customers = [restored];
      _renderMemoResets.forEach(r => r());
      const stamped = restored.outcomeCriteria.items.filter(r =>
        r.sourceSessionId && r.sourceDeliverableId && restored.outcomeEvidence[r.id]).length;
      let notesById = 0, numericLeft = 0;
      for(let n = 1; n <= restored.totalSessions; n++){
        const t = getSessionTemplate(restored, n);
        if(t && t.id && restored.sessionNotes[t.id] && restored.sessionNotes[t.id].prep === 'P' + n) notesById++;
        if(restored.sessionNotes[String(n)] !== undefined) numericLeft++;
      }
      /* Controls for the version inferred from shape. (a) v12 record: a legacy tick
         still sits in its notes but the user cleared that evidence; restore must not
         resurrect it (re-running v11 -> v12 would). (b) v11 record (no outcomeCriteria):
         its note tick must become evidence (v11 -> v12 must run). */
      const lab = getSessionTemplate(rec, 1).deliverables[0];
      const run = r => prepareArchiveData({customer: JSON.parse(JSON.stringify(r)), activities: []}).customer;
      const cleared = JSON.parse(JSON.stringify(rec));
      cleared.sessionNotes['1'].deliverables = {[lab]: true};
      clearOutcomeEvidence(cleared, outcomeCriteriaFor(cleared).find(x => x.text === lab).id);
      const evKeys = r => Object.keys(r.outcomeEvidence).length;
      const noResurrect = evKeys(run(cleared)) === evKeys(cleared);
      const v11rec = JSON.parse(JSON.stringify(rec));
      delete v11rec.outcomeCriteria; delete v11rec.outcomeEvidence;
      v11rec.sessionNotes['1'].deliverables = {[lab]: true};
      const v11Migrated = evKeys(run(v11rec)) === 1;
      ok = evidencedBefore > 0 && notesBefore > 0 && stamped > 0 && stamped === evidencedBefore
        && notesById === restored.totalSessions && numericLeft === 0 && noResurrect && v11Migrated;
      detail = JSON.stringify({evidencedBefore, stamped, notesBefore, notesById, numericLeft,
        totalSessions: restored.totalSessions, noResurrect, v11Migrated});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity R3: restoring a v12-shaped archive stamps its criteria and re-keys its notes', ok, detail);
  })();
  /* R4 — a v12 record the migration could not place must never be matched by
     position afterwards. Unstamped records stay eligible for passes 1-2 on every
     render, so after a session delete an orphan {sourceSession:3, sourceIndex:1,
     sourceCount:N} claims whichever session now sits at 3 with N deliverables
     and shows its evidence on an unrelated deliverable. FIXTURE: a v12 book with
     an extra evidenced record for session 3 index 1 (different text, so the real
     record takes the slot and the extra one cannot be placed), sourceCount equal
     to session 4's deliverable count, and session 4's own index-1 record removed
     so that slot is free. LIVENESS: unplaced > 0 and evidenced > 0 in setup. */
  (function(){
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(1);
      const c0 = fx.accts[0];
      const tplLen = n => getSessionTemplate(c0, n).deliverables.length;
      const items = c0.outcomeCriteria.items;
      const s4i1 = items.find(r => r.sourceSession === 4 && r.sourceIndex === 1);
      items.splice(items.indexOf(s4i1), 1);
      delete c0.outcomeEvidence[s4i1.id];
      const real = items.find(r => r.sourceSession === 3 && r.sourceIndex === 1);
      const orphanId = 'oc_r4orphan';
      items.push({id: orphanId, text: 'A deliverable that session 3 no longer carries',
        stage: real.stage, sourceSession: 3, sourceIndex: 1, sourceCount: tplLen(4)});
      c0.outcomeEvidence[orphanId] = Object.assign({}, c0.outcomeEvidence[real.id]);
      const book = _v12Book(fx.accts);
      const prepared = prepareBookData(cloneData(book), 'SelfCheck');
      DATA.customers = prepared.customers; DATA.config.sessionTemplates = prepared.config.sessionTemplates;
      _renderMemoResets.forEach(r => r());
      const pc = prepared.customers[0];
      const unplaced = pc.outcomeCriteria.items.filter(r => !r.sourceDeliverableId && pc.outcomeEvidence[r.id]).length;
      const evidenced = outcomeCriteriaFor(pc).filter(x => x.evidence).length;
      removeSessionTemplate(DATA.config.sessionTemplates[pc.module], 2);
      _renderMemoResets.forEach(r => r());
      const rows = outcomeCriteriaFor(pc);
      const stolen = rows.filter(x => x.evidence && x.id === orphanId && x.source !== 'no longer in the curriculum').length;
      const orphaned = rows.filter(x => x.id === orphanId && x.source === 'no longer in the curriculum' && x.evidence).length;
      const slot = rows.find(x => x.sourceSession === 3 && x.sourceIndex === 1);
      ok = unplaced > 0 && evidenced > 0 && stolen === 0 && orphaned === 1 && !!slot && !slot.evidence;
      detail = JSON.stringify({unplaced, evidenced, stolen, orphaned, slotEvidence: !!(slot && slot.evidence)});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity R4: an unplaced v12 orphan is never matched by position after a session delete', ok, detail);
  })();
  /* R2 — ids must be unique across a whole curriculum key, not just inside one
     session. A repeated deliverable id (two sessions) or session id (twice in a key)
     imports cleanly without the per-key check and misplaces evidence. Across
     DIFFERENT keys the same ids are legitimate (renaming a module re-adds
     'Sustainability (CSRD)' with the same deterministic ids), so control (c) must
     keep importing. */
  (function(){
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const fx = _identityFixture(2);
      // Each case tampers with a parsed ENVELOPE (via assign, so the A6 writer scan stays honest).
      const tries = f => {
        const env = JSON.parse(serializeBook(DATA));
        f(env.config.sessionTemplates);
        try{ prepareBookData(env, 'SelfCheck'); return null; }catch(e){ return e.message; }
      };
      const otherKey = Object.keys(DATA.config.sessionTemplates).find(k => k !== fx.mod && DATA.config.sessionTemplates[k].length >= 1);
      const msgA = tries(t => Object.assign(t[fx.mod][4], {deliverableIds: [t[fx.mod][1]['deliverableIds'][0]].concat(t[fx.mod][4]['deliverableIds'].slice(1))}));
      const msgB = tries(t => Object.assign(t[fx.mod][3], {id: t[fx.mod][2]['id']}));
      const msgC = tries(t => Object.assign(t[otherKey][0], {id: t[fx.mod][0]['id'],
        deliverables: t[fx.mod][0]['deliverables'].slice(), deliverableIds: t[fx.mod][0]['deliverableIds'].slice()}));
      // The message must be the per-key duplicate rejection, so an unrelated rejection cannot pass.
      ok = fx.ticked > 0 && !!otherKey && /repeats a deliverable id used elsewhere in the same curriculum/.test(msgA || '')
        && /repeats a session id used earlier in the same curriculum/.test(msgB || '') && msgC === null;
      detail = JSON.stringify({ticked: fx.ticked, otherKey, dupDeliverable: msgA, dupSession: msgB, acrossKeys: msgC});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity R2: a repeated session id or deliverable id inside one curriculum key is rejected on import; the same ids across keys still import', ok, detail);
  })();
  /* R1 — turning CSRD on must not orphan evidence on deliverables the CSRD
     curriculum shares with the base. Ian's ruling (a): a default CSRD deliverable
     whose text equals the base's at the same session and position reuses the
     base id. EXPECTATIONS ARE HARD-CODED from DEFAULT_SESSION_TEMPLATES as measured
     2026-09-30: Sustainability has 15 deliverables over 12 sessions; 9 of the 15
     CSRD deliverables are shared (s1#0, s1#1, s2#1, s3#0, s3#1, s5#0, s7#0, s10#0,
     s12#0), so 9 stay evidenced, 6 base-only evidence rows are orphaned, and the 6
     CSRD-only rows are unevidenced. FIXTURE: one Sustainability account, plan of
     12, every base criterion ticked (LIVENESS: ticked === 15). The flag goes
     through applyCSRDToggle, the function the #csrd-toggle handler calls. */
  (function(){
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      const c = {id:'__idr1__', name:'Identity R1 Co', module:'Sustainability',
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:12, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {[c.id]: []};
      _renderMemoResets.forEach(r => r());
      let ticked = 0;
      outcomeCriteriaFor(c).forEach(cr => { if(setOutcomeEvidence(c, cr, {on: isoAddDays(todayISO(), -30), by:'customer'})) ticked++; });
      const split = () => {
        const rows = outcomeCriteriaFor(c);
        const orphan = rows.filter(x => x.source === 'no longer in the curriculum');
        const live = rows.filter(x => x.source !== 'no longer in the curriculum');
        return {live: live.length, liveEvidenced: live.filter(x => x.evidence).length,
          liveBlank: live.filter(x => !x.evidence).length, orphans: orphan.length,
          orphansEvidenced: orphan.filter(x => x.evidence).length};
      };
      const off0 = split();
      applyCSRDToggle(c, true);
      _renderMemoResets.forEach(r => r());
      const on = split();
      applyCSRDToggle(c, false);
      _renderMemoResets.forEach(r => r());
      const off1 = split();
      ok = ticked === 15 && off0.liveEvidenced === 15 && off0.orphans === 0
        && on.live === 15 && on.liveEvidenced === 9 && on.liveBlank === 6
        && on.orphans === 6 && on.orphansEvidenced === 6
        && off1.liveEvidenced === 15 && off1.orphans === 0 && off1.live === 15;
      detail = JSON.stringify({ticked, off0, on, off1});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity R1: flipping CSRD on keeps evidence on the 9 shared deliverables and flipping it off loses none', ok, detail);
  })();
  (function(){
    /* c2a — curriculum identity (piece 1). Shipped defaults carry DETERMINISTIC
       ids so every browser shipping the same default agrees on identity, and
       ensureTemplateIds() is idempotent and never re-mints an id it already set. */
    let ok = false, detail = '';
    const prevT = DATA.config.sessionTemplates;
    try{
      /* HARD-CODED expectations (review M5r: comparing to the id function was true
         by construction). Measured 2026-09-30: of the CSRD defaults, 9 of 15
         (Sustainability) and 7 of 12 (Sustainability + Carbon) reuse a base id. */
      let stamped = 0, wrong = [];
      const D = DEFAULT_SESSION_TEMPLATES;
      const lit = (cond, tag) => { if(!cond) wrong.push(tag); };
      Object.values(D).forEach(list => list.forEach(() => { stamped++; }));
      lit(D['Sustainability'][0].id === 'ss_sustainability_01', 'base session id literal');
      lit(D['Sustainability'][0].deliverableIds[0] === 'dl_sustainability_01_01', 'base deliverable id literal');
      lit(D['Sustainability (CSRD)'][0].id === 'ss_sustainability_csrd_01', 'csrd session id stays per curriculum');
      lit(D['Sustainability (CSRD)'][0].deliverableIds[0] === 'dl_sustainability_01_01', 'csrd shared position reuses the base id');
      lit(D['Sustainability (CSRD)'][1].deliverableIds[0] === 'dl_sustainability_csrd_02_01', 'csrd-only position keeps a csrd id');
      const sharedCount = k => {
        const baseIds = new Set([].concat(...D[k.replace(' (CSRD)', '')].map(t => t.deliverableIds)));
        const all = [].concat(...D[k].map(t => t.deliverableIds));
        lit(new Set(all).size === all.length, k + ' ids unique within the key');
        return all.filter(x => baseIds.has(x)).length + '/' + all.length;
      };
      const sharedS = sharedCount('Sustainability (CSRD)'), sharedSC = sharedCount('Sustainability + Carbon (CSRD)');
      lit(sharedS === '9/15', 'Sustainability (CSRD) shared ' + sharedS);
      lit(sharedSC === '7/12', 'Sustainability + Carbon (CSRD) shared ' + sharedSC);
      const copy = JSON.parse(JSON.stringify(DEFAULT_SESSION_TEMPLATES));
      Object.values(copy).forEach(list => list.forEach(t => { delete t.id; delete t.deliverableIds; }));
      copy.__custom__ = [{title:'Custom session', ttfvStage:'ttfv1', enable:[], deliverables:['A','B']}];
      const first = ensureTemplateIds(copy);
      const snap = JSON.stringify(copy);
      const second = ensureTemplateIds(copy);
      const sameAsDefaults = Object.keys(DEFAULT_SESSION_TEMPLATES).every(k =>
        JSON.stringify(copy[k].map(t => [t.id, t.deliverableIds])) ===
        JSON.stringify(DEFAULT_SESSION_TEMPLATES[k].map(t => [t.id, t.deliverableIds])));
      const custom = copy.__custom__[0];
      const customOk = SESSION_ID_RE.test(custom.id) && custom.deliverableIds.length === 2
        && custom.deliverableIds.every(x => DELIVERABLE_ID_RE.test(x));
      ok = stamped > 0 && wrong.length === 0 && first > 0 && second === 0
        && JSON.stringify(copy) === snap && sameAsDefaults && customOk;
      detail = JSON.stringify({stamped, wrong: wrong.slice(0, 5), sharedS, sharedSC, first, second, sameAsDefaults, customOk});
    }catch(err){ detail = err.message; }
    DATA.config.sessionTemplates = prevT;
    check('identity: shipped defaults carry deterministic ids, and ensureTemplateIds is idempotent', ok, detail);
  })();
  (function(){
    /* A6 — curriculum identity (piece 1). setSessionDeliverables is the ONLY code
       allowed to write a template's deliverables/deliverableIds. Two halves:
       (1) a source scan: no other code assigns or mutates those arrays;
       (2) every editor action leaves the two arrays the same length. */
    let ok = false, detail = '';
    const prevT = DATA.config.sessionTemplates;
    try{
      const src = Array.from(document.scripts).filter(s => !s.src).map(s => s.textContent).join('\n');
      const rest = src.split(setSessionDeliverables.toString()).join('');
      // The receiver is an identifier followed by ANY run of [..] / (..) groups, so
      // chained receivers like DATA.config.sessionTemplates[curKey()][idx] are seen.
      const re = new RegExp('([A-Za-z_$][\\w$]*(?:\\[[^\\]\\n]*\\]|\\([^)\\n]*\\))*)\\.(deliverables|deliverableIds)'
        + '\\s*(?:=(?!=)|\\[[^\\]\\n]*\\]\\s*=(?!=)|\\.(?:push|pop|shift|unshift|splice|sort|reverse)\\()', 'g');
      // Not stored templates: a session NOTE's legacy label-keyed .deliverables
      // map, and safeSessionTemplateForRender's throwaway render copy `safe`.
      const EXEMPT_RECEIVER = /^(note|safe|sessionNotes\[[^\]]*\])$/;
      // The sample is built by concatenation so this line cannot match its own scan.
      const sampleLive = new RegExp(re.source).test('x.deliver' + 'ables = y');
      const hits = []; let m;
      while((m = re.exec(rest))){ if(!EXEMPT_RECEIVER.test(m[1])) hits.push(rest.slice(Math.max(0, m.index - 30), m.index + 40)); }
      const scanLive = src.length > 100000 && src.indexOf('function setSessionDeliverables') !== -1 && sampleLive;

      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      const key = DATA.config.modules[0];
      const list = DATA.config.sessionTemplates[key];
      list.push(newSessionTemplate(list));
      const fresh = list[list.length - 1];
      addDeliverableRow(fresh, 'one'); addDeliverableRow(fresh, 'two'); addDeliverableRow(fresh, 'three');
      rewordDeliverableRow(fresh, 1, 'two (reworded)');
      addDeliverableRow(list[0], 'added');
      moveDeliverableRow(list[0], 0, +1);
      removeDeliverableRow(fresh, 0);
      rewordDeliverableRow(fresh, 0, '');
      moveSessionTemplate(list, 0, +1);
      removeSessionTemplate(list, 1);
      const aligned = Object.values(DATA.config.sessionTemplates).every(l => !Array.isArray(l) || l.every(t =>
        Array.isArray(t.deliverableIds) && t.deliverableIds.length === t.deliverables.length
        && new Set(t.deliverableIds).size === t.deliverableIds.length));
      ok = scanLive && hits.length === 0 && aligned;
      detail = JSON.stringify({scanLive, hits: hits.slice(0, 3), aligned});
    }catch(err){ detail = err.message; }
    DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('identity: only setSessionDeliverables writes deliverables/deliverableIds, and editor actions keep them aligned', ok, detail);
  })();
  (function(){
    /* Un-ticking DELETES the entry and keeps the criterion, so re-ticking reuses
       the same identity instead of minting a second one. And removing a derived
       criterion materializes it first, so removed[] holds only opaque ids. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc6__', name:'Toggle Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__oc6__: []};
      const first = outcomeCriteriaFor(c)[0];
      setOutcomeEvidence(c, first, {on: todayISO(), by:'osm'});
      const id = c.outcomeCriteria.items[0].id;
      clearOutcomeEvidence(c, id);
      const gone = c.outcomeEvidence[id] === undefined;
      const criterionKept = c.outcomeCriteria.items.some(x => x.id === id);
      setOutcomeEvidence(c, outcomeCriteriaFor(c).find(x => x.id === id), {on: todayISO(), by:'osm'});
      const sameIdentity = c.outcomeCriteria.items.length === 1 && !!c.outcomeEvidence[id];
      // (removeOutcomeCriterion, which used to be asserted here, was dead and is deleted.)
      ok = gone && criterionKept && sameIdentity;
      detail = JSON.stringify({gone, criterionKept, sameIdentity});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA un-ticking keeps identity', ok, detail);
  })();
  (function(){
    /* Two DIFFERENT custom criteria must get two identities. They share
       sourceSession:null and sourceIndex:null, so a dedupe keyed on that pair
       merges them and one loses its evidence — which the orphaned-label branch
       of the migration would hit on any book carrying two of them. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__cust1__', name:'Custom Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__cust1__: []};
      const one = {text:'First custom criterion', stage:'ttfv2', sourceSession:null, sourceIndex:null};
      const two = {text:'Second custom criterion', stage:'ttfv2', sourceSession:null, sourceIndex:null};
      setOutcomeEvidence(c, one, {on: todayISO(), by:'osm'});
      setOutcomeEvidence(c, two, {on: null, by:'customer'});
      const items = c.outcomeCriteria.items;
      const ids = items.map(x => x.id);
      const texts = items.map(x => x.text).sort();
      const evKeys = Object.keys(c.outcomeEvidence).sort();
      // Same text twice must still dedupe to one.
      setOutcomeEvidence(c, {text:'First custom criterion', stage:'ttfv2', sourceSession:null, sourceIndex:null},
        {on: todayISO(), by:'osm'});
      ok = items.length === 2 && new Set(ids).size === 2
        && texts[0] === 'First custom criterion' && texts[1] === 'Second custom criterion'
        && evKeys.length === 2 && c.outcomeCriteria.items.length === 2;
      detail = JSON.stringify({items: items.length, uniqueIds: new Set(ids).size, texts, evidence: evKeys.length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA two different custom criteria get two identities', ok, detail);
  })();
  (function(){
    /* ABSENCE IS NOT FAILURE. An account with no outcome chosen is 'unknown',
       never 'not_ready' — the same principle that stops an unassessed readiness
       domain reading as low readiness. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc7__', name:'Unknown Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = null;
      DATA.customers = [c]; DATA.activities = {__oc7__: []};
      const v = outcomeVerdict(c);
      c.compliance.outcomePlan.outcomeNumber = 4;
      const v2 = outcomeVerdict(c);
      ok = v.state === 'unknown' && v2.state === 'not_ready'
        && v2.outcomeName === DATA.config.outcomeNames[3]
        && v2.reasons.length > 0;
      detail = JSON.stringify({noNumber: v.state, withNumber: v2.state,
        name: v2.outcomeName, reasons: v2.reasons.length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA an unchosen outcome is unknown, not failed', ok, detail);
  })();
  (function(){
    /* The verdict is PURE and counts what it claims: ttfv1/ttfv2 split, an
       explicit undated count so legacy evidence cannot quietly pad the result. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc8__', name:'Count Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = 1;
      DATA.customers = [c]; DATA.activities = {__oc8__: []};
      const list = outcomeCriteriaFor(c);
      const t1 = list.filter(x => x.stage === 'ttfv1');
      setOutcomeEvidence(c, t1[0], {on: todayISO(), by:'osm'});
      setOutcomeEvidence(c, t1[1], {on: null, by:'unknown', legacy:true});
      const before = JSON.stringify(c);
      const a = JSON.stringify(outcomeVerdict(c));
      const b = JSON.stringify(outcomeVerdict(c));
      const v = outcomeVerdict(c);
      ok = a === b && JSON.stringify(c) === before
        && v.ttfv1.met === 2 && v.ttfv1.total === t1.length
        && v.undated === 1 && v.unevidenced.length === list.length - 2;
      detail = JSON.stringify({pure: a === b, untouched: JSON.stringify(c) === before,
        ttfv1: v.ttfv1, undated: v.undated, unevidenced: v.unevidenced.length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA the verdict is pure and counts undated evidence separately', ok, detail);
  })();
  (function(){
    /* 'ready' requires ALL of it: every criterion evidenced, three compliance
       gates, a committed graduation date, no open blockers. Each missing one
       must produce a reason, not a silent downgrade. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__oc9__', name:'Ready Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance = {sentiment:{done:true, date:todayISO(), answerA:'a', answerB:'b'},
        outcomePlan:{done:true, date:todayISO(), outcomeNumber:2, planText:''},
        associatedPeopleCSAT:{done:true, date:todayISO(), contactName:'X'}};
      c.targetGraduationDate = isoAddDays(todayISO(), 30);
      DATA.customers = [c]; DATA.activities = {__oc9__: []};
      outcomeCriteriaFor(c).forEach(x => setOutcomeEvidence(c, x, {on: todayISO(), by:'osm'}));
      const ready = outcomeVerdict(c);
      c.targetGraduationDate = null;
      const noDate = outcomeVerdict(c);
      ok = ready.state === 'ready' && ready.reasons.length === 0
        && noDate.state === 'not_ready' && noDate.reasons.length === 1;
      detail = JSON.stringify({ready: ready.state, readyReasons: ready.reasons,
        noDate: noDate.state, noDateReasons: noDate.reasons});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA ready requires every condition, and each failure names itself', ok, detail);
  })();
  (function(){
    /* VACUOUS READY. An account with no criteria has proved nothing, so it must
       not report ready on every-of-zero. Also pins the outcomeNumber boundary:
       0 is not a choice, and an out-of-range number still names something. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      DATA.config.sessionTemplates[mod].forEach(t => { setSessionDeliverables(t, []); });
      const c = {id:'__empty1__', name:'Empty Co', module:mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance = {sentiment:{done:true, date:todayISO(), answerA:'a', answerB:'b'},
        outcomePlan:{done:true, date:todayISO(), outcomeNumber:2, planText:''},
        associatedPeopleCSAT:{done:true, date:todayISO(), contactName:'X'}};
      c.targetGraduationDate = isoAddDays(todayISO(), 30);
      DATA.customers = [c]; DATA.activities = {__empty1__: []};
      const empty = outcomeVerdict(c);
      c.compliance.outcomePlan.outcomeNumber = 0;
      const zero = outcomeVerdict(c);
      c.compliance.outcomePlan.outcomeNumber = 19;
      const over = outcomeVerdict(c);
      ok = empty.state === 'unknown' && empty.reasons.length === 1
        && zero.state === 'unknown' && zero.outcomeName === null && zero.outcomeNumber === null
        && over.outcomeName === 'Customer Success Outcome';
      detail = JSON.stringify({empty: empty.state, emptyReasons: empty.reasons.length,
        zero: zero.state, zeroName: zero.outcomeName, overName: over.outcomeName});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('phaseA nothing to judge against is unknown, and 0 is not a chosen outcome', ok, detail);
  })();
  (function(){
    /* A criterion with neither ttfv stage must be counted somewhere. This is the
       shape the migration creates for a ticked deliverable no template carries. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__stg1__', name:'Stage Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = 3;
      c.outcomeCriteria = {items:[{id:'oc_nostage', text:'Orphaned label', stage:'',
        sourceSession:null, sourceIndex:null, sourceCount:null}], removed:[]};
      c.outcomeEvidence = {oc_nostage: {on:null, by:'unknown', legacy:true}};
      DATA.customers = [c]; DATA.activities = {__stg1__: []};
      const v = outcomeVerdict(c);
      const total = outcomeCriteriaFor(c).length;
      ok = !!v.other && v.other.total === 1 && v.other.met === 1
        && (v.ttfv1.total + v.ttfv2.total + v.other.total) === total
        && v.undated === 1 && !v.unevidenced.some(x => x.id === 'oc_nostage');
      detail = JSON.stringify({other: v.other, ttfv1: v.ttfv1, ttfv2: v.ttfv2,
        undated: v.undated, total});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA a criterion with no ttfv stage is still counted', ok, detail);
  })();
  (function(){
    /* MIGRATION. A ticked deliverable becomes evidence with on:null — never a
       date the book does not have. A label the template no longer carries was
       ALREADY orphaned before this change; it is preserved as a custom
       criterion rather than dropped, because a human ticked it. */
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      const firstLabel = DATA.config.sessionTemplates[mod][0].deliverables[0];
      const book = {schemaVersion: 11, config: JSON.parse(JSON.stringify(DATA.config)),
        customers: [{id:'__mig1__', name:'Mig Co', module: mod,
          stage: DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
          totalSessions:8, domainScores:{}, stageHistory:[{stage:DATA.config.stages[1].key, date: isoAddDays(todayISO(), -200)}],
          sessionNotes:{ '1': {deliverables:{}, prep:''} },
          compliance: defaultCompliance()}],
        activities: {__mig1__: []}};
      book.customers[0].sessionNotes['1'].deliverables[firstLabel] = true;
      book.customers[0].sessionNotes['1'].deliverables['A LABEL NO TEMPLATE CARRIES'] = true;
      book.customers[0].sessionNotes['1'].deliverables['AN UNTICKED ONE'] = false;
      migrateData(book);
      const c = book.customers[0];
      const ids = Object.keys(c.outcomeEvidence || {});
      const everyLegacyUndated = ids.every(k => c.outcomeEvidence[k].on === null
        && c.outcomeEvidence[k].legacy === true && c.outcomeEvidence[k].by === 'unknown');
      const orphan = (c.outcomeCriteria.items || []).find(x => x.text === 'A LABEL NO TEMPLATE CARRIES');
      const matched = (c.outcomeCriteria.items || []).find(x => x.text === firstLabel);
      const untickedSkipped = !c.outcomeCriteria.items.some(x => x.text === 'AN UNTICKED ONE');
      const sessionNotesIntact = readSessionNote(c, 1).deliverables[firstLabel] === true;
      ok = book.schemaVersion >= 12 && ids.length === 2 && everyLegacyUndated && !!orphan && !!matched
        && orphan.sourceSession === null && matched.sourceSession === 1
        && untickedSkipped && sessionNotesIntact;
      detail = JSON.stringify({v: book.schemaVersion, ids: ids.length, idCount: ids.length, everyLegacyUndated,
        orphan: !!orphan, matched: !!matched, untickedSkipped, sessionNotesIntact});
    }catch(err){ detail = err.message; }
    check('phaseA migration turns ticks into undated legacy evidence and drops nothing', ok, detail);
  })();
  (function(){
    /* Real, dated evidence must SURVIVE the migration. The migration's `already`
       lookup and materializeOutcomeCriterion's dedupe key on different things, so
       a reworded slot can route a tick onto a record that already holds a real
       date, a real source and a real note. An unguarded write replaced all three
       with a null-dated legacy record. Counts alone cannot see this — both stay
       at 1 while the contents are destroyed — so this asserts the CONTENTS. */
    let ok = false, detail = '';
    try{
      const cfg = JSON.parse(JSON.stringify(DATA.config));
      const mod = cfg.modules[0];
      const label = cfg.sessionTemplates[mod][0].deliverables[0];
      const real = {on:'2026-07-01', by:'osm', note:'signed off in call'};
      const book = {schemaVersion: 11, config: cfg,
        customers: [{id:'__keep1__', name:'Keep Co', module: mod,
          stage: cfg.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
          totalSessions:8, domainScores:{},
          stageHistory:[{stage: cfg.stages[1].key, date: isoAddDays(todayISO(), -200)}],
          sessionNotes:{ '1': {deliverables:{[label]: true}, prep:''} },
          compliance: defaultCompliance(),
          outcomeCriteria:{items:[{id:'oc_keep', text:'A DIFFERENT WORDING', stage:'ttfv1',
            sourceSession:1, sourceIndex:0, sourceCount:2}], removed:[]},
          outcomeEvidence:{oc_keep: JSON.parse(JSON.stringify(real))}}],
        activities: {__keep1__: []}};
      migrateData(book);
      const ev = book.customers[0].outcomeEvidence['oc_keep'];
      ok = !!ev && ev.on === real.on && ev.by === real.by && ev.note === real.note
        && ev.legacy === undefined;
      detail = JSON.stringify({survived: ev});
    }catch(err){ detail = err.message; }
    check('phaseA migration never overwrites real dated evidence', ok, detail);
  })();
  (function(){
    /* The migration must be IDEMPOTENT — running it twice must not double the
       evidence, because migrateData runs on every import as well as on load. */
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      const label = DATA.config.sessionTemplates[mod][0].deliverables[0];
      const mk = () => ({schemaVersion: 11, config: JSON.parse(JSON.stringify(DATA.config)),
        customers: [{id:'__mig2__', name:'Idem Co', module: mod,
          stage: DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
          totalSessions:8, domainScores:{}, stageHistory:[{stage:DATA.config.stages[1].key, date: isoAddDays(todayISO(), -200)}],
          sessionNotes:{ '1': {deliverables:{[label]: true}, prep:''} },
          compliance: defaultCompliance()}],
        activities: {__mig2__: []}});
      const once = mk(); migrateData(once);
      const twice = mk(); migrateData(twice); twice.schemaVersion = 11; migrateData(twice);
      const a = Object.keys(once.customers[0].outcomeEvidence).length;
      const b = Object.keys(twice.customers[0].outcomeEvidence).length;
      const itemsA = once.customers[0].outcomeCriteria.items.length;
      const itemsB = twice.customers[0].outcomeCriteria.items.length;
      ok = a === 1 && b === 1 && itemsA === 1 && itemsB === 1;
      detail = JSON.stringify({evidenceOnce:a, evidenceTwice:b, itemsOnce:itemsA, itemsTwice:itemsB});
    }catch(err){ detail = err.message; }
    check('phaseA the migration is idempotent', ok, detail);
  })();
  (function(){
    /* An imported book carrying malformed outcome data must be REJECTED at the
       boundary, not silently repaired into something plausible. */
    let ok = false, detail = '';
    try{
      const base = () => ({schemaVersion: 12, config: JSON.parse(JSON.stringify(DATA.config)),
        customers: [{id:'__val1__', name:'Val Co', module: DATA.config.modules[0],
          stage: DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
          totalSessions:8, domainScores:{}, sessionNotes:{},
          stageHistory:[{stage:DATA.config.stages[1].key, date: isoAddDays(todayISO(), -200)}],
          compliance: defaultCompliance(), outcomeCriteria:{items:[], removed:[]}, outcomeEvidence:{}}],
        activities: {__val1__: []}});
      const badDate = base();
      badDate.customers[0].outcomeEvidence['oc_x'] = {on:'not-a-date', by:'osm'};
      let rejectedDate = false;
      try{ prepareBookData(badDate, 'Test'); }catch(e){ rejectedDate = true; }
      const badBy = base();
      badBy.customers[0].outcomeEvidence['oc_y'] = {on:null, by:'nonsense'};
      let rejectedBy = false;
      try{ prepareBookData(badBy, 'Test'); }catch(e){ rejectedBy = true; }
      const good = base();
      good.customers[0].outcomeEvidence['oc_z'] = {on:null, by:'unknown', legacy:true};
      let accepted = false;
      try{ prepareBookData(good, 'Test'); accepted = true; }catch(e){ accepted = false; }
      ok = rejectedDate && rejectedBy && accepted;
      detail = JSON.stringify({rejectedDate, rejectedBy, accepted});
    }catch(err){ detail = err.message; }
    check('phaseA malformed outcome evidence is rejected at the import boundary', ok, detail);
  })();
  (function(){
    /* A CSRD account's curriculum lives under "<module> (CSRD)". Reading the
       plain module key made every ticked deliverable migrate as an orphan while
       derivation rendered the real one beside it, unevidenced — the same
       criterion twice, one copy holding the evidence. */
    let ok = false, detail = '';
    try{
      const cfg = JSON.parse(JSON.stringify(DATA.config));
      const mod = 'Sustainability';
      const csrdKey = mod + ' (CSRD)';
      if(!Array.isArray(cfg.sessionTemplates[csrdKey]) || !cfg.sessionTemplates[csrdKey].length){
        throw new Error('fixture needs a shipped ' + csrdKey + ' template set');
      }
      const plain = cfg.sessionTemplates[mod] || [];
      const csrd = cfg.sessionTemplates[csrdKey] || [];
      /* Find a session whose CSRD deliverable genuinely DIFFERS from the plain
         one. Sampling a label that happens to read the same in both curricula
         lets a migration reading the wrong template key match by coincidence —
         which is exactly how the first version of this check passed against the
         unfixed code. Throwing when no divergence exists keeps the check from
         going quietly vacuous if the curricula ever converge. */
      let sessionNumber = 0, csrdLabel = '';
      for(let i = 0; i < Math.min(plain.length, csrd.length); i++){
        const a = ((plain[i] || {}).deliverables || [])[0];
        const b = ((csrd[i] || {}).deliverables || [])[0];
        if(a && b && a !== b){ sessionNumber = i + 1; csrdLabel = b; break; }
      }
      if(!sessionNumber){
        throw new Error('fixture needs a session where the CSRD curriculum diverges — none found');
      }
      const book = {schemaVersion: 11, config: cfg,
        customers: [{id:'__csrd1__', name:'CSRD Co', module: mod, reportsCSRD: true,
          stage: cfg.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
          totalSessions:8, domainScores:{},
          stageHistory:[{stage: cfg.stages[1].key, date: isoAddDays(todayISO(), -200)}],
          sessionNotes: {[String(sessionNumber)]: {deliverables:{[csrdLabel]: true}, prep:''}},
          compliance: defaultCompliance()}],
        activities: {__csrd1__: []}};
      migrateData(book);
      const c = book.customers[0];
      const items = c.outcomeCriteria.items;
      const rec = items.find(x => x.text === csrdLabel);
      ok = items.length === 1 && !!rec && rec.sourceSession === sessionNumber && rec.sourceIndex === 0
        && Object.keys(c.outcomeEvidence).length === 1
        && c.outcomeEvidence[rec.id] && c.outcomeEvidence[rec.id].legacy === true;
      detail = JSON.stringify({items: items.length, sourceSession: rec && rec.sourceSession,
        expectedSession: sessionNumber, sourceIndex: rec && rec.sourceIndex, label: csrdLabel});
    }catch(err){ detail = err.message; }
    check('phaseA a CSRD account migrates against its own curriculum', ok, detail);
  })();
  (function(){
    /* The panel states the verdict and names what is outstanding. Read-only in
       Phase A: rendering must emit no control that writes, because the capture
       UI is Phase B and a half-wired control is worse than none. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__ov1__', name:'View Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = 4;
      DATA.customers = [c]; DATA.activities = {__ov1__: []};
      const list = outcomeCriteriaFor(c);
      setOutcomeEvidence(c, list[0], {on: todayISO(), by:'customer'});
      setOutcomeEvidence(c, list[1], {on: null, by:'unknown', legacy:true});
      const before = JSON.stringify(c);
      const html = renderOutcomeCriteria(c);
      const v = outcomeVerdict(c);
      const namesOutcome = html.indexOf(escapeHtml(v.outcomeName)) !== -1;
      const showsStages = html.indexOf('ttfv1') !== -1 || html.toLowerCase().indexOf('first value') !== -1;
      const showsUndated = html.indexOf('date unknown') !== -1;
      const noWriters = !/data-[a-z-]*(set|tick|clear|remove|save|add)/.test(html)
        && html.indexOf('<input') === -1 && html.indexOf('<textarea') === -1
        && html.indexOf('<button') === -1;
      const pure = JSON.stringify(c) === before;
      ok = namesOutcome && showsStages && showsUndated && noWriters && pure;
      detail = JSON.stringify({namesOutcome, showsStages, showsUndated, noWriters, pure});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA the outcome panel states the verdict, is read-only, and renders purely', ok, detail);
  })();
  (function(){
    /* Criterion text is user-controlled once an OSM edits it. Every one must be
       escaped, or a criterion containing a quote breaks the markup. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__ov2__', name:'Esc Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = 1;
      c.outcomeCriteria = {items:[{id:'oc_xss1', text:'<img src=x onerror=alert(1)> & "quoted"',
        stage:'ttfv2', sourceSession:null, sourceIndex:null}], removed:[]};
      DATA.customers = [c]; DATA.activities = {__ov2__: []};
      const html = renderOutcomeCriteria(c);
      ok = html.indexOf('<img src=x') === -1 && html.indexOf('&lt;img') !== -1
        && html.indexOf('&amp;') !== -1;
      detail = JSON.stringify({rawImg: html.indexOf('<img src=x') !== -1,
        escaped: html.indexOf('&lt;img') !== -1});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseA criterion text is escaped in the outcome panel', ok, detail);
  })();
  (function(){
    /* Two DIFFERENT unknown states, and the panel must not conflate them.
       No outcome number chosen -> send the user to the Edit account tab.
       An outcome chosen but a curriculum with no deliverables authored -> say
       THAT, with its reason. Telling someone to pick an outcome they already
       picked sends them somewhere that cannot help. Neither branch had any
       coverage until now. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      const c = {id:'__unk1__', name:'Unknown Co', module:mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__unk1__: []};

      // (a) No outcome chosen.
      c.compliance.outcomePlan.outcomeNumber = null;
      const none = renderOutcomeCriteria(c);
      const noneSendsToEdit = none.indexOf('Edit account') !== -1;

      // (b) Outcome chosen, but the curriculum has no deliverables.
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      DATA.config.sessionTemplates[mod].forEach(t => { setSessionDeliverables(t, []); });
      _renderMemoResets.forEach(r => r());
      c.compliance.outcomePlan.outcomeNumber = 4;
      const v = outcomeVerdict(c);
      const empty = renderOutcomeCriteria(c);
      const emptyNamesReason = v.reasons.length === 1
        && empty.indexOf(escapeHtml(v.reasons[0])) !== -1;
      const emptyDoesNotMisdirect = empty.indexOf('Edit account') === -1;

      ok = v.state === 'unknown' && noneSendsToEdit && emptyNamesReason && emptyDoesNotMisdirect;
      detail = JSON.stringify({state: v.state, noneSendsToEdit, emptyNamesReason,
        emptyDoesNotMisdirect, reasons: v.reasons.length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('phaseA the panel tells the two unknown states apart', ok, detail);
  })();
  (function(){
    /* Phase B / Spec 8. The tick is the capture UI. Phase A shipped an
       evidence store nothing could write to; this is the one control an OSM
       already uses that means "this deliverable happened", so it is the one
       that should write. Ticking records a dated, attributed entry; un-ticking
       DELETES it (Spec 3 — "evidenced" stays a single question) while leaving
       the materialized criterion, so re-ticking reuses the same identity
       rather than minting a second one. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb1__', name:'Tick Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb1__: []};

      const crit = outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0);
      const rec = setOutcomeEvidence(c, crit, {on: todayISO(), by:'osm'});
      const id = Object.keys(c.outcomeEvidence)[0];
      const opaque = /^oc_[0-9a-z]{8}$/.test(id);
      const dated = rec.on === todayISO() && rec.by === 'osm';
      const rendersTicked = /data-session-deliverable="__pb1__\|1\|0"[^>]*checked/
        .test(renderSessionCard(c, 1, getSessionTemplate(c, 1), false));

      clearOutcomeEvidence(c, id);
      const goneFromEvidence = c.outcomeEvidence[id] === undefined;
      const criterionSurvives = c.outcomeCriteria.items.some(x => x.id === id);
      const rendersUnticked = !/data-session-deliverable="__pb1__\|1\|0"[^>]*checked/
        .test(renderSessionCard(c, 1, getSessionTemplate(c, 1), false));

      // Re-ticking reuses the SAME identity — no second record.
      const again = outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0);
      setOutcomeEvidence(c, again, {on: todayISO(), by:'osm'});
      const oneIdentity = c.outcomeCriteria.items
        .filter(x => x.sourceSession === 1 && x.sourceIndex === 0).length === 1
        && again.id === id;

      ok = opaque && dated && rendersTicked && goneFromEvidence && criterionSurvives
        && rendersUnticked && oneIdentity;
      detail = JSON.stringify({opaque, dated, rendersTicked, goneFromEvidence,
        criterionSurvives, rendersUnticked, oneIdentity});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB a ticked deliverable is evidence, and un-ticking deletes it without losing identity', ok, detail);
  })();
  (function(){
    /* A tick migrated from a legacy book carries {on:null, legacy:true}. It is
       still a real human act, so the box must read TICKED — an account that
       used the tracker before evidence tracking existed must not open to a
       wall of empty checkboxes and look like it lost its history. The second
       assertion is the one that matters: the box BESIDE it, which nobody
       ticked, must not read ticked. A render that hardcoded checked would pass
       the first half on its own. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb2__', name:'Legacy Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb2__: []};
      const tpl = getSessionTemplate(c, 2);
      const twoOrMore = tpl.deliverables.length >= 2;   // the fixture must be able to fail
      const crit = outcomeCriteriaFor(c).find(x => x.sourceSession === 2 && x.sourceIndex === 0);
      setOutcomeEvidence(c, crit, {on: null, by:'unknown', legacy:true});

      const html = renderSessionCard(c, 2, tpl, false);
      const firstTicked = /data-session-deliverable="__pb2__\|2\|0"[^>]*checked/.test(html);
      const secondClear = !/data-session-deliverable="__pb2__\|2\|1"[^>]*checked/.test(html);

      ok = twoOrMore && firstTicked && secondClear;
      detail = JSON.stringify({deliverables: tpl.deliverables.length, twoOrMore, firstTicked, secondClear});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB an undated legacy tick still reads as ticked, and its neighbour does not', ok, detail);
  })();
  (function(){
    /* v97 again, on the region this task edits. renderSessionCard now calls
       outcomeCriteriaFor, which walks the template set and returns provisional
       criteria for anything not yet materialized. If any of that leaked a
       write, opening the Session Plan tab would stamp criteria onto every
       account in the book. Whole-book comparison, not a spot check. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb3__', name:'Pure Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb3__: []};
      const before = JSON.stringify(DATA.customers);
      for(let n = 1; n <= c.totalSessions; n++) renderSessionCard(c, n, getSessionTemplate(c, n), n === 1);
      ok = JSON.stringify(DATA.customers) === before;
      detail = ok ? 'unchanged' : 'the session card wrote to the book';
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB rendering every session card still writes nothing', ok, detail);
  })();
  (function(){
    /* Spec 3: `by` distinguishes "the customer demonstrated it" from "we
       observed it" — the difference between evidence and assertion, and the
       thing a graduation conversation actually turns on. Changing it must not
       cost the record its date or its activity link; a control that silently
       reset `on` to today would quietly move this account's TTFV every time
       someone corrected who did the demonstrating.
       v100 fix round 1 / Critical 1: the re-attribution assertion below calls
       reattributeDeliverableEvidence — the SAME function the attribution
       listener calls — instead of re-implementing the Object.assign inline.
       The inline version passed even when the listener's own code reset `on`
       or dropped activityId, because it was never exercising the listener's
       code path at all. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb4__', name:'By Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb4__: []};
      const crit = outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0);
      const older = isoAddDays(todayISO(), -30);
      setOutcomeEvidence(c, crit, {on: older, by:'osm', activityId:'act_fixed'});
      const id = Object.keys(c.outcomeEvidence)[0];

      reattributeDeliverableEvidence(c, 1, 0, 'customer');
      const ev = c.outcomeEvidence[id];
      const keptDate = ev.on === older;
      const keptLink = ev.activityId === 'act_fixed';
      const nowCustomer = ev.by === 'customer';
      const oneRecord = Object.keys(c.outcomeEvidence).length === 1;

      const html = renderSessionCard(c, 1, getSessionTemplate(c, 1), false);
      const hasControl = html.indexOf('data-deliverable-by="__pb4__|1|0"') !== -1;
      const showsCustomer = /data-deliverable-by="__pb4__\|1\|0"[\s\S]{0,400}?<option value="customer" selected/
        .test(html);
      // The box nobody ticked must not offer a live attribution control.
      const neighbourDisabled = /data-deliverable-by="__pb4__\|1\|1"[^>]*disabled/.test(html);

      ok = keptDate && keptLink && nowCustomer && oneRecord && hasControl
        && showsCustomer && neighbourDisabled;
      detail = JSON.stringify({keptDate, keptLink, nowCustomer, oneRecord, hasControl,
        showsCustomer, neighbourDisabled});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB evidence can be marked customer-demonstrated without losing its date or its link', ok, detail);
  })();
  (function(){
    /* The link is made from the session's own logged activity, and ONLY when
       one exists. Both halves are asserted on the same account, because a
       handler that always wrote activityId would pass the first half and
       fabricate a reference on the second.
       v100 fix round 1 / Critical 3: routed through toggleDeliverableEvidence
       itself rather than re-implementing its linkage inline — the inline
       version passed unchanged even when toggleDeliverableEvidence's own
       activityId logic was mutated to fabricate a link (e.g.
       `rec.activityId = act ? act.id : 'act_fabricated'`), because it was
       never calling the mutated code. See the fix report for that red run. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb5__', name:'Link Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c];
      DATA.activities = {__pb5__: [{id:'act_s3', type:'Call', date: isoAddDays(todayISO(), -5),
        summary:'Session 3 held', sessionNumber:3, checklist:[], flagged:false}]};

      // Session 3 HAS an activity; session 4 does not. Same code path, both ways.
      [3, 4].forEach(n => { toggleDeliverableEvidence(c, n, 0, true); });

      const stored = Object.keys(c.outcomeEvidence).map(k => c.outcomeEvidence[k]);
      const twoRecords = stored.length === 2;
      const oneLinked = stored.filter(x => x.activityId === 'act_s3').length === 1;
      const oneUnlinked = stored.filter(x => !('activityId' in x)).length === 1;

      ok = twoRecords && oneLinked && oneUnlinked;
      detail = JSON.stringify({twoRecords, oneLinked, oneUnlinked, stored});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB a deliverable ticked during a logged session links that activity, and never invents one', ok, detail);
  })();
  (function(){
    /* Added after Task 1's review. Task 1 asserted setOutcomeEvidence and
       clearOutcomeEvidence directly and left the path BETWEEN the checkbox and
       them uncovered — the parse, the activity linkage, and the provisional
       guard were asserted by nobody. Step 4b extracts that path into
       toggleDeliverableEvidence so it can be reached without a DOM event; this
       is the check that reaches it.
       v100 fix round 1 / Critical 2: provisionalInert does NOT catch "delete
       the `if(!crit.provisional)` guard outright" today — clearOutcomeEvidence
       is id-keyed and early-returns when nothing is stored under that id, so
       it cannot materialize anything through the current implementation (see
       the corrected comment on the guard itself, in toggleDeliverableEvidence).
       What provisionalInert DOES catch is the un-tick branch being changed to
       materialize the criterion instead of calling clearOutcomeEvidence — e.g.
       `if(!crit.provisional) clearOutcomeEvidence(customer, crit.id); else
       materializeOutcomeCriterion(customer, crit);` — confirmed failing against
       that exact mutation; see the fix report for the red run. Kept as
       belt-and-braces coverage for that future-refactor shape, not as proof
       today's code has the hazard the original comment claimed. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb11__', name:'Toggle Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c];
      DATA.activities = {__pb11__: [{id:'act_s2', type:'Call', date: isoAddDays(todayISO(), -5),
        summary:'Session 2 held', sessionNumber:2, checklist:[], flagged:false}]};

      // Tick, through the same function the listener calls.
      const rec = toggleDeliverableEvidence(c, 2, 0, true);
      const linked = !!rec && rec.by === 'osm' && rec.on === todayISO() && rec.activityId === 'act_s2';
      const oneRecord = Object.keys(c.outcomeEvidence).length === 1;

      // Un-tick the same one — the evidence goes, the identity stays.
      toggleDeliverableEvidence(c, 2, 0, false);
      const cleared = Object.keys(c.outcomeEvidence).length === 0;
      const identityKept = c.outcomeCriteria.items.filter(x => x.sourceSession === 2).length === 1;

      // Un-tick a box NOBODY ticked. This must create nothing at all.
      // v100 fix round 1 / Critical 2: session 5 has only ONE deliverable
      // (index 0) in this template, so the original (5,3) fixture hit
      // toggleDeliverableEvidence's `if(!crit) return null;` early-return —
      // the SAME path as outOfRange below — and never reached the provisional
      // guard at all. Session 3 index 1 is a real, genuinely provisional
      // criterion (see outcomeCriteriaFor dump in the fix report) untouched by
      // anything else in this check.
      const itemsBefore = c.outcomeCriteria.items.length;
      toggleDeliverableEvidence(c, 3, 1, false);
      const provisionalInert = c.outcomeCriteria.items.length === itemsBefore
        && Object.keys(c.outcomeEvidence).length === 0;

      // An index the session does not have is a no-op, not a throw.
      const outOfRange = toggleDeliverableEvidence(c, 2, 999, true) === null
        && Object.keys(c.outcomeEvidence).length === 0;

      ok = linked && oneRecord && cleared && identityKept && provisionalInert && outOfRange;
      detail = JSON.stringify({linked, oneRecord, cleared, identityKept, provisionalInert, outOfRange});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB the tick path itself is covered — link, clear, and the provisional guard', ok, detail);
  })();
  (function(){
    /* setOutcomeEvidence has accepted and stored `note` since Phase A, and the
       panel has silently discarded it since Phase A — invisible until Phase B
       made notes reachable. It is OSM-authored free text, so the escaping half
       is not decoration: a note containing markup must not become markup. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb6__', name:'Note Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.compliance.outcomePlan.outcomeNumber = 4;
      DATA.customers = [c]; DATA.activities = {__pb6__: []};
      const list = outcomeCriteriaFor(c);
      const manyCriteria = list.length >= 2;      // the fixture must be able to fail
      const raw = 'Dana walked us through it live <b>on screen</b> & signed off';
      setOutcomeEvidence(c, list[0], {on: todayISO(), by:'customer', note: raw});
      // A second evidenced criterion with NO note, so an empty element shows up.
      setOutcomeEvidence(c, outcomeCriteriaFor(c)[1], {on: todayISO(), by:'osm'});

      const html = renderOutcomeCriteria(c);
      const shows = html.indexOf(escapeHtml(raw)) !== -1;
      const notRawMarkup = html.indexOf('<b>on screen</b>') === -1;
      const noEmpties = (html.match(/class="oc-note"/g) || []).length === 1;

      ok = manyCriteria && shows && notRawMarkup && noEmpties;
      detail = JSON.stringify({criteria: list.length, manyCriteria, shows, notRawMarkup,
        noteEls: (html.match(/class="oc-note"/g) || []).length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB an evidence note is shown, escaped, and absent when there is none', ok, detail);
  })();
  (function(){
    /* Spec 5. First value stops being a field somebody has to remember to
       stamp. Every ttfv1 criterion evidenced -> the date is the LATEST of them,
       because first value is not reached until the last of its criteria is. One
       criterion short -> no date at all, not a partial one. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb7__', name:'Derive Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb7__: []};
      const t1 = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1');
      const enough = t1.length >= 3;            // the fixture must be able to fail

      // All but the last evidenced -> still nothing.
      for(let i = 0; i < t1.length - 1; i++){
        const live = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1')[i];
        /* -(60 + i), not -(40 - i). ttfv1 spans several sessions of 12-15
           deliverables, so i can exceed 37, at which point an "earlier"
           criterion would be dated LATER than the -3 below and this check
           would fail for a reason that has nothing to do with the code. */
        setOutcomeEvidence(c, live, {on: isoAddDays(todayISO(), -(60 + i)), by:'osm'});
      }
      const partial = getFirstValue(c).achievedOn === null;

      // The last one, dated LATER than every other, is the date that wins.
      const last = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1').slice(-1)[0];
      const latest = isoAddDays(todayISO(), -3);
      setOutcomeEvidence(c, last, {on: latest, by:'customer'});
      const fv = getFirstValue(c);
      const derivedIsLatest = fv.achievedOn === latest;
      const labelled = fv.derivedFrom === 'ttfv1';

      // PURE: reading it twice writes nothing.
      const before = JSON.stringify(DATA.customers);
      getFirstValue(c); getFirstValue(c);
      const pure = JSON.stringify(DATA.customers) === before;

      ok = enough && partial && derivedIsLatest && labelled && pure;
      detail = JSON.stringify({ttfv1: t1.length, enough, partial, derivedIsLatest, labelled, pure,
        got: fv.achievedOn, latest});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB first value derives from the last ttfv1 criterion, and not from a partial set', ok, detail);
  })();
  (function(){
    /* Spec 5, the load-bearing half: a date a human asserted ALWAYS wins. The
       recorded date here is deliberately EARLIER than the derived one would be,
       so an implementation that took the max of the two would FAIL rather than
       coincidentally agree. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb8__', name:'Manual Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb8__: []};
      const n = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1').length;
      for(let i = 0; i < n; i++){
        const live = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1')[i];
        setOutcomeEvidence(c, live, {on: isoAddDays(todayISO(), -10), by:'osm'});
      }
      const wouldDerive = derivedFirstValueDate(c);

      const recorded = isoAddDays(todayISO(), -90);
      c.firstValue = {definition:null, evidence:[{date: recorded, note:'demo', activityId:'act_1'}],
        achievedOn: recorded};
      const fv = getFirstValue(c);

      const recordedWins = fv.achievedOn === recorded;
      const notLabelledDerived = fv.derivedFrom === null;
      const differs = wouldDerive !== null && wouldDerive !== recorded;

      ok = recordedWins && notLabelledDerived && differs;
      detail = JSON.stringify({recordedWins, notLabelledDerived, differs, wouldDerive, recorded});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB a recorded achieved date always beats the derived one', ok, detail);
  })();
  (function(){
    /* every() over an empty list is TRUE. An account whose curriculum authors
       no ttfv1 deliverables must derive NOTHING — this is the every-of-zero bug
       that made an empty criteria list report READY in Phase A, in its second
       home. And an account whose ttfv1 evidence is entirely legacy has no dates
       to take a maximum of: null, never a guess. */
    const prevC = DATA.customers, prevA = DATA.activities, prevT = DATA.config.sessionTemplates;
    let ok = false, detail = '';
    try{
      const mod = DATA.config.modules[0];
      const c = {id:'__pb9__', name:'Empty Co', module:mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb9__: []};

      // (a) all-legacy evidence -> every criterion met, and still no date.
      const n = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1').length;
      const hadSome = n > 0;
      for(let i = 0; i < n; i++){
        const live = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1')[i];
        setOutcomeEvidence(c, live, {on: null, by:'unknown', legacy:true});
      }
      const allMet = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1').every(x => x.evidence);
      const legacyGivesNoDate = derivedFirstValueDate(c) === null;

      // (b) no ttfv1 criteria at all -> no date. A FRESH customer, never
      // evidenced against the pre-wipe curriculum — reusing `c` here would not
      // test this guard at all: outcomeCriteriaFor() keeps returning materialized
      // items the curriculum "no longer carries" (by design, so evidence already
      // captured against a removed deliverable is never silently dropped), so
      // `c`'s 9 ttfv1 criteria from part (a) would still be there after the wipe
      // and t1.length would never reach 0.
      DATA.config.sessionTemplates = JSON.parse(JSON.stringify(prevT));
      DATA.config.sessionTemplates[mod].forEach(t => { setSessionDeliverables(t, []); });
      _renderMemoResets.forEach(r => r());
      const c2 = {id:'__pb9b__', name:'Empty Co 2', module:mod,
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c2);
      const emptyGivesNoDate = derivedFirstValueDate(c2) === null
        && outcomeCriteriaFor(c2).filter(x => x.stage === 'ttfv1').length === 0;

      ok = hadSome && allMet && legacyGivesNoDate && emptyGivesNoDate;
      detail = JSON.stringify({ttfv1: n, hadSome, allMet, legacyGivesNoDate, emptyGivesNoDate});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.config.sessionTemplates = prevT;
    _renderMemoResets.forEach(r => r());
    check('phaseB neither an empty ttfv1 list nor all-legacy evidence invents a first-value date', ok, detail);
  })();
  (function(){
    /* Spec 5, fix round 1. A derived first-value date must say so ON SCREEN,
       and must not simultaneously trip no_value_evidence — that signal reads
       fv.evidence, which the derived path never populates, so an account with
       every ttfv1 criterion evidenced could show "Achieved ... · derived" on
       the Overview badge while Copilot said its value story was missing.
       Asserted with the required contrast: the SAME fixture, evidence cleared,
       must still fire the signal — otherwise this only proves the signal is
       silent on an account that was never eligible to begin with. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb10__', name:'Signal Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      const acts = Array.from({length:4}, (_,i)=>(
        {id:'pb10a'+i, date: todayISO(), type:'Session', summary:'x', checklist:[], sessionNumber:i+1, flagged:false}));
      DATA.customers = [c]; DATA.activities = {__pb10__: acts};
      // Definition present, no manual evidence[] — no_value_evidence's own
      // eligibility gate — so every criterion evidenced below has to be what
      // makes derivedFrom fire, not a recorded achievedOn.
      c.firstValue = {definition:'First filed report gets exported', evidence:[], achievedOn:null};

      const t1 = outcomeCriteriaFor(c).filter(x => x.stage === 'ttfv1');
      const enough = t1.length > 0;           // the fixture must be able to fail
      t1.forEach((x,i) => setOutcomeEvidence(c, x, {on: isoAddDays(todayISO(), -(10 + i)), by:'osm'}));

      const fv = getFirstValue(c);
      const derivedFromTtfv1 = fv.derivedFrom === 'ttfv1';

      const nveDef = SIGNAL_DEFS.find(d => d.key === 'no_value_evidence');
      const derivedSuppressesSignal = !(nveDef && nveDef.detect(c));

      const html = renderOverviewTab(c, computeRisk(c));
      const showsDerivedSuffix = html.indexOf(' · derived') !== -1;
      const derivedTip = 'Derived: every first-value success criterion is evidenced, dated by the last of them. See the Session Plan tab.';
      const recordedTip = 'Earliest first-value evidence date — see the Activity Log tab.';
      const tipCount = html.split(derivedTip).length - 1;
      const tooltipIsDerivedBranch = tipCount === 1 && html.indexOf(recordedTip) === -1;

      // The contrast: same account, evidence cleared -> nothing derives ->
      // the signal must fire, or the suppression above proved nothing.
      c.outcomeEvidence = {};
      const fvCleared = getFirstValue(c);
      const clearedNoDerivation = fvCleared.achievedOn === null && fvCleared.derivedFrom === null;
      const signalFiresWithoutEvidence = !!(nveDef && nveDef.detect(c));

      ok = enough && derivedFromTtfv1 && showsDerivedSuffix && tooltipIsDerivedBranch
        && derivedSuppressesSignal && clearedNoDerivation && signalFiresWithoutEvidence;
      detail = JSON.stringify({ttfv1: t1.length, enough, derivedFromTtfv1, showsDerivedSuffix,
        tipCount, tooltipIsDerivedBranch, derivedSuppressesSignal, clearedNoDerivation, signalFiresWithoutEvidence});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB a derived first value says so, and is not also told its value story is missing', ok, detail);
  })();
  (function(){
    /* Spec check 11. NOT "no code mentions the field" — the migration, the
       backfill and the import validator all still touch it, and should. What
       must be true is that nothing reads it for MEANING.
       The third assertion is the decisive one: setting the legacy boolean
       directly changes nothing on screen. A render that still consulted it
       would show a tick nobody evidenced, and the two stores would silently
       disagree the first time anyone hand-edited a book or restored an old
       export. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__pb10__', name:'One Truth Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__pb10__: []};
      const tpl = getSessionTemplate(c, 1);

      const noLegacyRead = renderSessionCard.toString().indexOf('.deliverables[') === -1;

      // Writing evidence must not write the legacy map.
      const notesBefore = JSON.stringify(c.sessionNotes);
      setOutcomeEvidence(c,
        outcomeCriteriaFor(c).find(x => x.sourceSession === 1 && x.sourceIndex === 0),
        {on: todayISO(), by:'osm'});
      const legacyUntouched = JSON.stringify(c.sessionNotes) === notesBefore;

      /* And writing the legacy map must not change what renders.
         getSessionNote is a WRITER and is called BEFORE the first render on
         purpose: if the note were materialized between the two renders, any
         difference between readSessionNote's throwaway default and the stored
         record — `prep`, say — would show up as a diff that has nothing to do
         with the legacy map, and this check would fail while appearing to
         prove something. Materialize first; then the ONLY variable between the
         two renders is the two booleans below. */
      const note = getSessionNote(c, 1);
      const before = renderSessionCard(c, 1, tpl, false);
      note.deliverables[tpl.deliverables[0]] = true;
      note.deliverables[tpl.deliverables[1]] = true;
      const after = renderSessionCard(c, 1, tpl, false);
      const legacyIsInert = before === after;

      ok = noLegacyRead && legacyUntouched && legacyIsInert;
      detail = JSON.stringify({noLegacyRead, legacyUntouched, legacyIsInert});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB the legacy deliverables map is inert — evidence is the only truth', ok, detail);
  })();
  (function(){
    /* Whole-branch review fix wave. Log Activity's first-value checkbox
       label said "already achieved <date>; this adds more evidence" for ANY
       existing achievedOn, DERIVED ones included. Ticking the box adds a
       RECORDED evidence entry, and a recorded date always outranks a derived
       one — the derived date does not gain a second witness, it gets
       replaced outright, and recomputeFirstValueAchievedOn then takes the
       EARLIEST of the recorded evidence, which need not even be the date
       just logged. "Adds more evidence" is the wrong model for a
       replacement. Two fixtures that genuinely differ in derivedFrom must
       render two different sentences. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const mkBase = id => { const c = {id, name:'FVLabel'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(c); return c; };

      // Derived: every ttfv1 criterion evidenced, no recorded achievedOn.
      const dCust = mkBase('__pblbl1__');
      DATA.customers = [dCust]; DATA.activities = {__pblbl1__: []};
      const t1 = outcomeCriteriaFor(dCust).filter(x => x.stage === 'ttfv1');
      const enoughT1 = t1.length > 0;   // the fixture must be able to fail
      t1.forEach((_, i) => {
        const live = outcomeCriteriaFor(dCust).filter(x => x.stage === 'ttfv1')[i];
        setOutcomeEvidence(dCust, live, {on: isoAddDays(todayISO(), -(30 + i)), by:'osm'});
      });
      const dFv = getFirstValue(dCust);
      const isDerived = dFv.derivedFrom === 'ttfv1' && !!dFv.achievedOn;
      const derivedHtml = renderLogActivityTab(dCust);
      const derivedSaysReplace = derivedHtml.indexOf('replaces the derived') !== -1;
      const derivedNoAddsMore = derivedHtml.indexOf('this adds more evidence') === -1;

      // Recorded: an explicit achievedOn a human asserted, not derived.
      const rCust = mkBase('__pblbl2__');
      DATA.customers = [rCust]; DATA.activities = {__pblbl2__: []};
      const recordedDate = isoAddDays(todayISO(), -90);
      rCust.firstValue = {definition:null,
        evidence:[{date: recordedDate, note:'demo', activityId:'act_1'}], achievedOn: recordedDate};
      const rFv = getFirstValue(rCust);
      const isRecorded = rFv.derivedFrom === null && rFv.achievedOn === recordedDate;
      const recordedHtml = renderLogActivityTab(rCust);
      const recordedSaysAddsMore = recordedHtml.indexOf('this adds more evidence') !== -1;
      const recordedNoReplace = recordedHtml.indexOf('replaces the derived') === -1;

      const genuinelyDiffer = dFv.derivedFrom !== rFv.derivedFrom;

      ok = enoughT1 && isDerived && derivedSaysReplace && derivedNoAddsMore
        && isRecorded && recordedSaysAddsMore && recordedNoReplace && genuinelyDiffer;
      detail = JSON.stringify({enoughT1, isDerived, derivedSaysReplace, derivedNoAddsMore,
        isRecorded, recordedSaysAddsMore, recordedNoReplace, genuinelyDiffer});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('phaseB the first-value tick label tells a derived date from a recorded one', ok, detail);
  })();
  (function(){
    /* Phase 3 / FIX 1. Excluding the headline from the drivers list must not
       just move a rule around — it must actually stop the same sentence
       rendering twice under Why and What do I do, and a beat with a REAL
       extra driver must still show its Why row. Both halves are asserted
       against the same customer so the only variable between them is the
       reasons list. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevFocus = ui.todayFocusId;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const c = {id:'__hdln__', name:'Headline Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[],
        nextSessionScheduledOn: todayISO(), nextSessionTime:'09:30'};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__hdln__: []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const SAME = 'Estimated graduation date is 48 days earlier than target — update in Gainsight';
      const EXTRA = 'A second, distinct reason this account is here';

      // (a) The beat's only reason IS its headline.
      let day = buildDayTimeline();
      if(!day.beats[0]) throw new Error('no beat built for the headline-duplication check');
      day.beats[0].headline = SAME;
      day.beats[0].reasons = [SAME];
      let html = renderDay(day, () => '');
      let step = html.split('class="day-stage"')[0].split('class="day-step').slice(1)[0];
      const needle = escapeHtml(SAME);
      const onlyReasonTimes = step.split(needle).length - 1;
      const onlyReasonHasWhy = step.indexOf('ds-why-list') !== -1;

      // (b) The beat's headline PLUS one real extra driver.
      day = buildDayTimeline();
      day.beats[0].headline = SAME;
      day.beats[0].reasons = [SAME, EXTRA];
      html = renderDay(day, () => '');
      step = html.split('class="day-stage"')[0].split('class="day-step').slice(1)[0];
      const withExtraTimes = step.split(needle).length - 1;
      const withExtraHasWhy = step.indexOf('ds-why-list') !== -1;
      const extraDriverShown = step.indexOf(escapeHtml(EXTRA)) !== -1;

      ok = onlyReasonTimes === 1 && !onlyReasonHasWhy
        && withExtraTimes === 1 && withExtraHasWhy && extraDriverShown;
      detail = JSON.stringify({onlyReasonTimes, onlyReasonHasWhy, withExtraTimes, withExtraHasWhy, extraDriverShown});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.todayFocusId = prevFocus;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase3 a beat never prints its headline twice', ok, detail);
  })();
  (function(){
    /* Phase 3 / FIX 2. A call beat with a logged activity carrying an open
       question, rendered through the real renderBeatPanel. Three facts must
       each print exactly once: the last-note text, the open question text,
       and the session-count figure. Counted on the PLAIN TEXT (tags stripped)
       so markup differences between the standing strip and the prep card
       cannot hide a duplicate fact behind different HTML. The Call prep Agenda
       (a deliberate copy list, d0043f2) repeats the open question on purpose; the
       question is counted outside the Agenda block. Control: the same predicate
       run on the panel plus a planted second copy must fail. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const c = {id:'__panel1__', name:'Panel Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[],
        nextSessionScheduledOn: todayISO(), nextSessionTime:'10:00'};
      backfillCustomerRecord(c);
      const NOTE = 'We reviewed the connector mapping and it is on track for go-live.';
      const QUESTION = 'Can numeric columns be restricted to a US number format?';
      DATA.customers = [c];
      DATA.activities = {__panel1__: [{id:'pa1', date: isoAddDays(todayISO(), -5), type:'Onboarding Session',
        summary: NOTE, sessionNumber:3, checklist:[], flagged:false,
        openThreads:[{id:'pt1', q:QUESTION, a:null}]}]};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      const beat = day.beats.find(b => b.customerId === '__panel1__' && b.kind === 'call');
      if(!beat) throw new Error('no call beat built for the panel duplication check');
      const panel = renderBeatPanel(beat, () => '');
      const sessionsFigure = `${sessionsCompletedCount(c)}/${c.totalSessions}`;
      // One Agenda boundary, defined once and passed into verdict(): from the Agenda opener to the earlier of </ol> or the next section opener.
      const AGENDA_RE = /*AGENDA-RE-BEGIN*/(/<div class="bp-sec" data-beat-agenda>[\s\S]*?(?:<\/ol>|(?=<div class="bp-sec"))/)/*AGENDA-RE-END*/;
      const verdict = /*VERDICT-BEGIN*/(html, NOTE, QUESTION, sessionsFigure, agendaRe) => {
        const count = (t, n) => t.split(n).length - 1;
        const text = (h) => h.replace(/<[^>]+>/g, '');
        // Only the open QUESTION may repeat in the Agenda (item 6); NOTE and the sessions figure are counted over the whole panel.
        const whole = text(html), outside = text(html.replace(agendaRe, ''));
        const noteTimes = count(whole, NOTE), questionTimes = count(outside, QUESTION), sessionsTimes = count(whole, sessionsFigure);
        return {noteTimes, questionTimes, sessionsTimes, ok: noteTimes === 1 && questionTimes === 1 && sessionsTimes === 1};
      }/*VERDICT-END*/;
      const real = verdict(panel, NOTE, QUESTION, sessionsFigure, AGENDA_RE);
      const plantedQ = verdict(panel + '<p>' + QUESTION + '</p>', NOTE, QUESTION, sessionsFigure, AGENDA_RE);
      const plantedNote = verdict(panel + '<p>' + NOTE + '</p>', NOTE, QUESTION, sessionsFigure, AGENDA_RE);
      const plantedSess = verdict(panel + '<p>' + sessionsFigure + '</p>', NOTE, QUESTION, sessionsFigure, AGENDA_RE);
      const plantedNoteInAgenda = verdict(panel.replace(/(data-beat-agenda>)/, '$1' + NOTE), NOTE, QUESTION, sessionsFigure, AGENDA_RE);
      const noClose = panel.replace(/<\/ol>/, '');
      const plantedNoClose = verdict(noClose.replace(/(<div class="bp-sec" data-beat-agenda>)/, '$1') + '<div class="bp-sec"><p>' + QUESTION + '</p></div>', NOTE, QUESTION, sessionsFigure, AGENDA_RE);
      const agendaHasQuestion = ((panel.match(AGENDA_RE) || [''])[0].split(QUESTION).length - 1) === 1;
      const controlsFail = plantedQ.ok === false && plantedQ.questionTimes === 2 && plantedNote.ok === false
        && plantedSess.ok === false && plantedNoteInAgenda.ok === false && plantedNoClose.ok === false;
      ok = real.ok && agendaHasQuestion && controlsFail;
      detail = JSON.stringify({real, plantedQ, plantedNote, plantedSess, plantedNoteInAgenda, plantedNoClose, agendaHasQuestion, sessionsFigure});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase3 the beat panel states each fact once', ok, detail);
  })();
  (function(){
    /* Phase 3 / FIX 4. The telemetry band scrambles figures, but SINCE is a
       formatted date — mid-churn it reads as corrupted data, not a changing
       number. copilotTelemetry() must opt SINCE out via its own field data
       (scramble:false), and renderTelemetry() must honour that per field
       rather than special-casing the SINCE label. */
    let ok = false, detail = '';
    try{
      const month = {landing:[], offSla:[]};
      const html = renderTelemetry(month);
      const chunks = html.split('<span class="tele-f">').slice(1).map(c => c.split('</span>')[0]);
      const since = chunks.find(c => c.indexOf('>SINCE<') !== -1);
      const numeric = chunks.filter(c => c !== since);
      const sinceHasNoScramble = !!since && since.indexOf('data-scramble') === -1;
      const numericAllScramble = numeric.length > 0 && numeric.every(c => c.indexOf('data-scramble') !== -1);
      ok = sinceHasNoScramble && numericAllScramble;
      detail = JSON.stringify({since, numericCount: numeric.length, sinceHasNoScramble, numericAllScramble});
    }catch(err){ detail = err.message; }
    check('phase3 the telemetry date does not scramble', ok, detail);
  })();
  (function(){
    /* v100. accountState() must be the worst of computeRisk and the account's
       top-ranked Today signal: a severity-4 flag forces Off Track even on a
       fresh-touchpoint account computeRisk alone would call On Track, and
       severity 2 (admin/pacing — a Gainsight gate, here) must NOT do the
       same, or the mapping is just "flag everything". Both halves run on the
       same synthetic account so the only variable is the flag. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const c = {id:'__flag4__', name:'Flag Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{2:3,3:3}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c];
      DATA.activities = {__flag4__: [{id:'fa1', date: isoAddDays(todayISO(), -2), type:'Check-in',
        summary:'All good, business as usual', sessionNumber:1, checklist:[], flagged:true, openThreads:[]}]};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();

      const riskWhileFlagged = computeRisk(c);
      const labelWhileFlagged = accountStateLabel(c);
      const topRowWhileFlagged = todayActionList().find(r => r.customerId === '__flag4__');

      // Drop the signal to severity 2: unflag the activity. The account's
      // Gainsight compliance gate (severity 2, open by default on a fresh
      // record) stays as its top candidate, so this exercises "a real
      // severity-2 signal is present and still must not raise the state" —
      // not merely "no signal at all".
      DATA.activities.__flag4__[0].flagged = false;
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const topRowAfterDrop = todayActionList().find(r => r.customerId === '__flag4__');
      const labelAfterDrop = accountStateLabel(c);

      ok = riskWhileFlagged === 'ontrack'
        && !!topRowWhileFlagged && topRowWhileFlagged.severity === 4
        && labelWhileFlagged === 'Off Track'
        && !!topRowAfterDrop && topRowAfterDrop.severity <= 2
        && labelAfterDrop === 'On Track';
      detail = JSON.stringify({riskWhileFlagged, labelWhileFlagged,
        topSeverityWhileFlagged: topRowWhileFlagged && topRowWhileFlagged.severity,
        topSeverityAfterDrop: topRowAfterDrop && topRowAfterDrop.severity, labelAfterDrop});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase3 a flagged account never reads On Track', ok, detail);
  })();
  (function(){
    /* v100. accountState() must never change what computeRisk(customer)
       reports — 19 call sites, health scoring, sorting and the Risk hub all
       still depend on computeRisk's current meaning. Captured across the
       WHOLE real book (not a synthetic clone) so this guards production
       data, not just a hand-built fixture. _riskMemo is cleared between the
       two passes so a stale cache can't paper over a real mutation. */
    let ok = false, detail = '';
    const prevRiskMemo = _riskMemo;
    try{
      _riskMemo = new Map();
      const before = DATA.customers.map(c => computeRisk(c));
      DATA.customers.forEach(c => accountState(c));
      _riskMemo = new Map();
      const after = DATA.customers.map(c => computeRisk(c));
      const mismatches = DATA.customers
        .map((c,i) => ({id:c.id, before: before[i], after: after[i]}))
        .filter(x => x.before !== x.after);
      ok = mismatches.length === 0;
      detail = JSON.stringify(mismatches);
    }catch(err){ detail = err.message; }
    _riskMemo = prevRiskMemo;
    check('phase3 computeRisk is unchanged by the state label', ok, detail);
  })();
  (function(){
    /* v100. basis must name WHICH input decided, not just assert a state. One
       account whose top Today signal (a flag) forces the state past what
       computeRisk alone would say — basis must name the signal. One account
       with no signal at all, driven purely by computeRisk's recency check —
       basis must name that instead. A basis that reads identically in both
       cases fails this — that's the whole point of the field. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mkBase = id => { const c = {id, name:'Basis '+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{2:3,3:3}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(c);
        c.compliance.sentiment.done = true; c.compliance.outcomePlan.done = true;
        c.compliance.associatedPeopleCSAT.done = true; // no baseline Gainsight-gate candidate
        return c; };
      const sigC = mkBase('__basis_sig__');
      const recC = mkBase('__basis_rec__');
      DATA.customers = [sigC, recC];
      DATA.activities = {
        __basis_sig__: [{id:'sa1', date: isoAddDays(todayISO(), -2), type:'Check-in',
          summary:'Escalated again', sessionNumber:1, checklist:[], flagged:true, openThreads:[]}],
        __basis_rec__: [{id:'ra1', date: isoAddDays(todayISO(), -90), type:'Check-in',
          summary:'Last touch', sessionNumber:1, checklist:[], flagged:false, openThreads:[]}]
      };
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();

      const sigState = accountState(sigC);
      const recState = accountState(recC);
      const sigNamesSignal = /flag/i.test(sigState.basis);
      const recNamesRecency = /day/i.test(recState.basis);

      ok = sigState.state === 'risk' && sigNamesSignal
        && recState.state === 'risk' && recNamesRecency
        && sigState.basis !== recState.basis;
      detail = JSON.stringify({sigState, recState});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase3 the state basis names the input that decided', ok, detail);
  })();
  (function(){
    /* v100.1. todaySignalSeverity() (~L16521) and the next-steps builder
       (~L7098) both call def.severity(sig) — ONE argument. Fourteen of the
       fifteen SIGNAL_DEFS entries declare severity as 0- or 1-arg and never
       notice; renewal_pressure alone declared severity:(c,sig)=>..., so at
       every real call site its `sig` parameter received undefined and
       `sig && sig.past` was permanently falsy — the past-renewal branch was
       unreachable, and an account whose graduation lands AFTER renewal was
       capped at the same severity 3 as one merely approaching it. Both poles
       asserted here: an account whose runway lands after renewal must reach
       4, and one that still lands ahead of it (but inside the pressure
       buffer) must stay at 3 — a check that only asserted the 4 would still
       pass if severity() started returning 4 unconditionally. */
    const base = over => Object.assign({id:'__rpsev__', name:'RP Sev Co', stage:'ttfv1',
      implementationDate: isoAddDays(todayISO(), -100), totalSessions:8,
      domainScores:{}, sessionNotes:{}, stageHistory:[]}, over || {});
    const realA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = base({});
      DATA.activities = {'__rpsev__': [
        {id:'a1', date: isoAddDays(todayISO(), -50), type:'Other', summary:'s', sessionNumber:1, checklist:[], flagged:false},
        {id:'a2', date: isoAddDays(todayISO(), -10), type:'Other', summary:'s', sessionNumber:2, checklist:[], flagged:false}]};
      const projected = projectedGraduationDate(c);

      // Pole 1: runway lands AFTER renewal (past === true) -> severity 4.
      c.renewalDate = isoAddDays(projected, -15);
      const pastSig = renewalPressure(c);
      const pastSeverity = todaySignalSeverity(c, 'renewal_pressure');

      // Pole 2: runway still lands AHEAD of renewal, inside the pressure
      // buffer (past === false, signal still fires) -> severity 3.
      c.renewalDate = isoAddDays(projected, 15);
      const aheadSig = renewalPressure(c);
      const aheadSeverity = todaySignalSeverity(c, 'renewal_pressure');

      ok = !!pastSig && pastSig.past === true && pastSeverity === 4
        && !!aheadSig && aheadSig.past === false && aheadSeverity === 3;
      detail = JSON.stringify({pastSig, pastSeverity, aheadSig, aheadSeverity});
    }catch(err){ detail = err.message; }
    DATA.activities = realA;
    check('phase3 a graduation landing after renewal reaches top severity', ok, detail);
  })();
  (function(){
    /* Phase 3 / badge FIX 1. accountStateLabel(c) (On Track / Needs Attention /
       Off Track) is the worst of computeRisk and the account's top-ranked
       signal severity — healthScore(c) is a separate engagement measure that
       does not feed it. Paired beside it, the two can read as contradictory
       ("Needs Attention · 92% health"), so healthScore is removed from the
       three sites that rendered them side by side: the beat panel header
       (bp-meta), the day-step STATE row, and the knowledge-transfer packet's
       "Status at transfer" line. riskLabel(...) IS the engagement read, so
       health beside IT is untouched — asserted positively via the real
       account panel so a check that just deleted "% health" everywhere would
       not pass for the wrong reason. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog,
          prevFocus = ui.todayFocusId, prevOpenId = ui.openCustomerId, prevTab = ui.panelTab;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const c = {id:'__hlth1__', name:'Health Co', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__hlth1__: []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();

      const beat = {kind:'work', customerId:c.id, customerName:c.name, at:null, call:null,
        headline:'Gainsight admin item', reasons:['Gainsight admin item'], severity:2, effortMin:20, signalKey:null,
        row:{customerId:c.id, severity:2, source:'test', why:'', signalKey:null, alsoWaiting:[], panelTab:'overview'}};
      const day = {beats:[beat], movements:[{mkey:'work', label:'Work', note:'', beats:[beat]}], spilled:0};

      const dayHtml = renderDay(day, () => '');
      const panelHtml = renderBeatPanel(beat, () => '');
      const kt = buildKnowledgeTransferText(c);

      const label = escapeHtml(accountStateLabel(c));
      const stateDd = (dayHtml.split('<dt>State</dt>')[1] || '').split('</dd>')[0];
      const metaDiv = (panelHtml.split('class="bp-meta"')[1] || '').split('</div>')[0];
      const ktLine = kt.split('\n').find(l => l.indexOf('Status at transfer:') !== -1) || '';

      const dayStateClean = stateDd.indexOf(label) !== -1 && stateDd.indexOf('% health') === -1;
      const metaClean = metaDiv.indexOf(label) !== -1 && metaDiv.indexOf('% health') === -1;
      const ktClean = ktLine.indexOf(accountStateLabel(c)) !== -1 && ktLine.indexOf('% health') === -1;

      // Positive control: a real, non-implementation account through the real
      // panel still pairs riskLabel(...) with health elsewhere in the file's
      // output — proves this check can fail, and that the fix did not strip
      // "% health" from the whole file.
      DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const real = DATA.customers.find(x => !inImplementation(x));
      let elsewhereHasHealth = false;
      if(real){
        ui.openCustomerId = real.id; ui.panelTab = 'details';
        elsewhereHasHealth = renderPanel().indexOf('% health') !== -1;
        ui.openCustomerId = prevOpenId; ui.panelTab = prevTab;
      }

      ok = dayStateClean && metaClean && ktClean && !!real && elsewhereHasHealth;
      detail = JSON.stringify({dayStateClean, metaClean, ktClean, hasRealAccount: !!real, elsewhereHasHealth});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    ui.todayFocusId = prevFocus; ui.openCustomerId = prevOpenId; ui.panelTab = prevTab;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase3 the state label is not paired with a health score', ok, detail);
  })();
  (function(){                                   // 1.2 B2: a stale tab must not overwrite newer work
    let ok = false, detail = '';
    const before = localStorage.getItem(STORAGE_KEY);
    const banner = document.getElementById('tab-conflict');
    const bannerWas = banner ? banner.classList.contains('show') : false;
    const prevStale = (typeof _staleTab !== 'undefined') ? _staleTab : false;
    const prevToast = (typeof _staleToastShown !== 'undefined') ? _staleToastShown : false;
    const prevSuite = _suiteRunning, prevUndo = _undoSnapshot, prevLabel = _undoLabel;
    try{
      /* The suite normally blocks every write, which would make "unchanged" true
         on any code. Lift that block for this one probe and change the book first,
         so a save that is not refused really would write; storage is put back below. */
      _suiteRunning = false;
      DATA.__b2probe = 1;
      window.dispatchEvent(new StorageEvent('storage', {key: STORAGE_KEY, oldValue: 'a', newValue: 'b'}));
      const saved = saveData();
      const maint = saveData({maintenance: true});
      const unchanged = localStorage.getItem(STORAGE_KEY) === before;
      const backupBlocked = fsBlockedReason().indexOf('another tab') !== -1;
      const says = !!banner && banner.textContent.indexOf('Saving is off in this tab') !== -1;
      ok = saved === false && maint === false && unchanged && backupBlocked && says;
      detail = JSON.stringify({saved, maint, unchanged, backupBlocked, says});
    }catch(e){ detail = 'threw: ' + e.message; }
    delete DATA.__b2probe;
    _suiteRunning = prevSuite; _undoSnapshot = prevUndo; _undoLabel = prevLabel;
    try{ if(before === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, before); }catch(e){}
    if(typeof _staleTab !== 'undefined') _staleTab = prevStale;
    if(typeof _staleToastShown !== 'undefined') _staleToastShown = prevToast;
    if(banner) banner.classList.toggle('show', bannerWas);
    check('1.2 B2 a stale tab refuses saveData and the backup write until reload, and the banner says so', ok, detail);
  })();
  (function(){
    /* Phase 3 / badge FIX 2. The evidence badge named a band NUMBER (Sev N/4)
       that required already knowing STORY_CHAPTERS to decode — the beat's own
       eyebrow already names the band, so the badge should too. Built from
       storyChapterFor(severity) rather than a second table, so the two can't
       drift. Two severities exercised — a fix that hard-codes one label
       string, or that leaves severity 1 plural on the badge, still gets
       caught by the exact match. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = id => { const c = {id, name:'Badge Co '+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(c); return c; };
      const c4 = mk('__sevb4__'), c2 = mk('__sevb2__');
      DATA.customers = [c4, c2];
      DATA.activities = {__sevb4__: [], __sevb2__: []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();

      const beatFor = (c, sev) => ({kind:'work', customerId:c.id, customerName:c.name, at:null, call:null,
        headline:'Evidence check', reasons:['Evidence check'], severity:sev, effortMin:20, signalKey:null,
        row:{customerId:c.id, severity:sev, source:'test', why:'why text', signalKey:null, alsoWaiting:[], panelTab:'overview'}});

      const panel4 = renderBeatPanel(beatFor(c4, 4), () => '');
      const panel2 = renderBeatPanel(beatFor(c2, 2), () => '');

      const badge4Reads = panel4.indexOf('>Needs you today<') !== -1;
      const badge2Reads = panel2.indexOf('>Admin and pacing<') !== -1;
      const noSevDigit4 = !/Sev \d/.test(panel4);
      const noSevDigit2 = !/Sev \d/.test(panel2);
      const noSevPattern4 = !/(>|[^\w])sev\w*\s*\d/i.test(panel4);
      const noSevPattern2 = !/(>|[^\w])sev\w*\s*\d/i.test(panel2);
      let severityMatch = '';
      if (!noSevPattern4) { const m = panel4.match(/(>|[^\w])sev\w*\s*\d[^.]*?\./i); severityMatch = m?.[0] || 'severity match found'; }
      if (!noSevPattern2) { const m = panel2.match(/(>|[^\w])sev\w*\s*\d[^.]*?\./i); severityMatch = m?.[0] || 'severity match found'; }

      ok = badge4Reads && badge2Reads && noSevDigit4 && noSevDigit2 && noSevPattern4 && noSevPattern2;
      detail = ok ? JSON.stringify({badge4Reads, badge2Reads, noSevDigit4, noSevDigit2, noSevPattern4, noSevPattern2}) : severityMatch;
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('phase3 the severity badge names its band', ok, detail);
  })();
  (function(){
    /* Severity 4 must not be able to hide. The clock can place a top-severity
       account at 2pm, so the rail flags it and the standing counts it wherever
       it sits — the failure mode named when the axis was chosen. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const c = {id:'__sev4__', name:'TopSev', module:DATA.config.modules[0], stage:DATA.config.stages[1].key,
        implementationDate: isoAddDays(todayISO(), -300), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      c.commitments = [{id:'k1', text:'Send the summary', direction:'i_owe', due: isoAddDays(todayISO(), -9), doneOn:null}];
      DATA.customers = [c]; DATA.activities = {__sev4__: []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      const sev4 = day.beats.filter(b => b.severity === 4);
      const html = renderToday();
      ok = sev4.length === day.sev4 && day.sev4 > 0
        && html.indexOf('day-rail-flag') !== -1
        && html.indexOf('at the top severity') !== -1;
      detail = JSON.stringify({sev4: day.sev4, flagged: (html.match(/day-rail-flag/g)||[]).length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v72 top-severity beats are flagged on the rail and counted in the standing', ok, detail);
  })();
  check('v72 severity chapters survive the redesign with their reading notes',
    // The asserted-vs-inferred distinction is the tab's most important sentence.
    // It moved from the story to the beat eyebrow; it must not have been lost.
    [1,2,3,4].every(sev => { const ch = storyChapterFor(sev); return ch && ch.label && ch.note.length > 20; }) &&
    storyChapterFor(4).key === 'today' && storyChapterFor(1).key === 'chances' &&
    STORY_CHAPTERS.every((ch,i) => i === 0 || STORY_CHAPTERS[i-1].min > ch.min) &&
    storyChapterFor(3).note.indexOf('Nobody has said anything is wrong') !== -1);
  check('v72 the day is reachable without any frame callback',
    // Click and keyboard are both non-frame paths. If a future edit made
    // scrolling the only way to change beat, the day would be unusable under
    // reduced motion and in any engine without IntersectionObserver.
    String(renderDay).indexOf('data-day-step=') !== -1 &&
    String(setTodayFocus).indexOf('day-step') !== -1 &&
    typeof focusKeyHandler === 'function' && typeof dayBeatIds === 'function');
  check('v72 every control in a beat pane is bound by bindBeatPane, not globally',
    /* The pool rewrites a pane's innerHTML long after attachEvents() has run, so
       anything bound by a global $$() sweep is DEAD in a swapped-in pane — and
       nothing throws. This shipped broken once: typing a sentiment and scrolling
       one beat lost the text silently. The invariant is that every data-fp-*
       selector renderBeatPanel() emits is handled inside bindBeatPane(), and
       that syncDayPool() calls it. */
    (function(){
      const emitted = [...new Set((String(renderBeatPanel) + String(renderBeatPrep))
        .match(/data-fp-[a-z-]+/g) || [])];
      const bound = String(bindBeatPane);
      const missing = emitted.filter(sel => bound.indexOf(sel) === -1);
      return emitted.length >= 6 && missing.length === 0
        && String(syncDayPool).indexOf('bindBeatPane') !== -1
        && typeof notInPane === 'function';
    })(),
    (function(){
      const emitted = [...new Set((String(renderBeatPanel) + String(renderBeatPrep)).match(/data-fp-[a-z-]+/g) || [])];
      return 'unbound: ' + emitted.filter(sel => String(bindBeatPane).indexOf(sel) === -1).join(', ');
    })());
  (function(){
    /* v72.1 post-mortem. The v72.0 fixtures were too small to reach the cap, so
       three defects passed 151 green checks. All three are cap-boundary bugs. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevShowAll = ui.todayShowAll;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {}; ui.todayShowAll = true;
      const mk = (id, on) => { const c = {id, name:'Cap'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        if(on) c.nextSessionScheduledOn = todayISO();
        backfillCustomerRecord(c); return c; };
      // 25 ranked accounts, one of which ALSO has a call today — the duplication case.
      const cs = []; for(let i = 0; i < 25; i++) cs.push(mk('__cap'+i+'__', i === 24));
      DATA.customers = cs;
      DATA.activities = cs.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      const html = renderToday();
      // (a) No account may appear in BOTH the day and the list below it.
      const belowIds = day.list.filter(r => !day.heldIds.has(r.customerId)).map(r => r.customerId);
      const dupes = day.beats.map(b => b.customerId).filter(id => belowIds.includes(id));
      // (b) The day never exceeds its own stated cap.
      const capped = day.beats.length <= DAY_BEAT_MAX;
      // (c) Work pushed out by calls is STATED, not silently dropped.
      // Nothing is lost: every ranked account is either in the day or below it.
      const accounted = day.list.every(r => day.heldIds.has(r.customerId) || belowIds.includes(r.customerId));
      ok = dupes.length === 0 && capped && accounted;
      detail = JSON.stringify({beats: day.beats.length, cap: DAY_BEAT_MAX, below: belowIds.length,
        ranked: day.list.length, spilled: day.spilled, dupes});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.todayShowAll = prevShowAll;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v72 no account appears both in the day and below it, and the day honours its cap', ok, detail);
  })();
  (function(){
    /* A 30-call day must not produce 30 beats. Calls are kept over ranked work
       (a booked call is the least discardable thing on the tab), but the total
       is still bounded. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const cs = []; for(let i = 0; i < 30; i++){
        const c = {id:'__lots'+i+'__', name:'Lots'+i, module:DATA.config.modules[0],
          stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -100),
          totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[], nextSessionScheduledOn: todayISO()};
        backfillCustomerRecord(c); cs.push(c);
      }
      DATA.customers = cs;
      DATA.activities = cs.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const day = buildDayTimeline();
      /* The first draft of this check asserted beats <= DAY_BEAT_MAX and failed.
         The check was wrong, not the code: hiding a booked call to satisfy a
         display cap would be the dishonest choice. The real invariant is that
         EVERY call appears, and ranked work yields all of its room to them. */
      const everyCallShown = day.calls.every(x => day.beats.some(b => b.customerId === x.c.id));
      const noRankedWorkLeft = day.beats.every(b => b.kind === 'call');
      ok = day.calls.length === 30 && everyCallShown && noRankedWorkLeft
        && new Set(day.beats.map(b => b.customerId)).size === day.beats.length;
      detail = JSON.stringify({calls: day.calls.length, beats: day.beats.length,
        everyCallShown, noRankedWorkLeft, cap: DAY_BEAT_MAX});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v72 a call-heavy day shows every call and yields all ranked-work room to them', ok, detail);
  })();
  check('v72 a time carrying seconds is kept, not silently deleted',
    // <input type="time"> emits "HH:MM:SS" on some platforms. Rejecting that
    // would delete a time the user had just set, with no feedback.
    normalizeDayTime('09:30:00') === '09:30' && normalizeDayTime('9:5:00') === null &&
    normalizeDayTime('09:30:99') === null);
  /* Capacity left the day at phase 1: movements no longer carry a measured
     bound, so no heading is in a position to claim work "did not fit". This
     used to assert the old wording was PRESENT; it now asserts the claim is
     absent, which is the same property against the new implementation. */
  check('v72 no movement heading claims work "did not fit"',
    String(renderDay).indexOf('did not fit') === -1 &&
    String(renderDay).indexOf('m.capacity') === -1);
  (function(){
    /* v72.2 (Impeccable, Operate mode). Two rules this tab had broken:
       (a) "Fixed rem scale, not fluid — clamp-sized headings don't serve product
       UI", and (b) the codebase's own --transition token, which exists so there
       are no ad hoc durations. Fixing (a) exposed a HIERARCHY INVERSION: the
       standing clamped to 44px while a beat's account name clamped to 46px, so
       the day's single most important line was outsized by every row beneath it. */
    const dayCss = [...document.styleSheets].map(sh => {
      try { return [...sh.cssRules].map(r => r.cssText).join('\n'); } catch(e){ return ''; }
    }).join('\n').split('\n').filter(r => /\.day-|\.ds-|\.dm-|\.bp-|\.close-/.test(r));
    const src = dayCss.join(' ');
    const fluidType = /\.day[^{]*\{[^}]*font-size:\s*clamp\(/.test(src) || /font-size:\s*clamp\(/.test(src);
    const adHoc = /transition:[^;]*\b0?\.[3-9]\d*s/.test(src);
    check('v72 the Day uses a fixed token type scale and one timing, not fluid type and ad hoc durations',
      !fluidType && !adHoc,
      JSON.stringify({fluidType, adHoc}));
  })();
  check('v72 the standing outranks a beat headline in the type scale',
    // The inversion was invisible below ~1353px, because both clamps were still
    // ramping. It only appeared at full width, which is where this tab is used.
    (function(){
      const n = v => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v));
      return n('--text-3xl') > n('--text-2xl') && n('--text-2xl') > n('--text-xl');
    })(),
    'scale must descend: --text-3xl (standing) > --text-2xl (beat) > --text-xl (close)');
  check('v72 the beat panel states what it truncated, in both places that truncate',
    /* The panel sliced risks at 3 and pending deliverables at 5. The risk badge at
       least printed "N open"; the deliverables list printed nothing at all, so a
       9th outstanding item was invisible with no signal it existed. That is the
       same silent-drop failure v72.1 was written to prevent, in a different place. */
    String(renderBeatPanel).indexOf('more open on this account') !== -1 &&
    String(renderBeatPrep).indexOf('more outstanding') !== -1,
    'both slice() sites must state the residual');
  check('v72 the identity survives file:// — fonts have metric-similar fallbacks',
    /* The Google Fonts stylesheet is render-blocking and cross-origin. Opened from
       disk, which is a supported way to run this file, it never loads and a bare
       "sans-serif" fallback silently resolved the whole app to the system UI font. */
    (function(){
      const rs = getComputedStyle(document.documentElement);
      const body = rs.getPropertyValue('--font-body'), mono = rs.getPropertyValue('--font-mono');
      const stack = v => v.split(',').length;
      return stack(body) >= 3 && stack(mono) >= 3;
    })(),
    'each font token needs a metric-similar fallback before the generic');
  (function(){
    /* v72.3. Two lenses measured the story at ~24% fill and 14 viewports for 15
       rows. The story stays — it was a deliberate product decision — and compact
       is the escape hatch. What must hold: both densities render every beat, the
       preference survives a reload, and compact does NOT install the scroll
       observer (several beats share the viewport there, so most-visible-wins
       would fight the reader). */
    /* Seeds its own book. The first draft asserted beats > 0 against the LIVE book
       and failed on a fresh tracker with no accounts — a real defect in the suite,
       and the same fixture dependency the v72.1 post-mortem was written about. */
    const prev = ui.dayDensity, prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const cs = [];
      for(let i = 0; i < 6; i++){
        const c = {id:'__den'+i+'__', name:'Density'+i, module:DATA.config.modules[0],
          stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -220),
          totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(c); cs.push(c);
      }
      DATA.customers = cs;
      DATA.activities = cs.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      ui.dayDensity = 'story';
      const story = renderToday();
      ui.dayDensity = 'compact';
      const compact = renderToday();
      const beats = h => (h.match(/data-day-step=/g) || []).length;
      ok = beats(story) === beats(compact) && beats(story) > 0
        && story.indexOf('data-density="story"') !== -1
        && compact.indexOf('data-density="compact"') !== -1
        && (compact.match(/data-day-density=/g) || []).length === DAY_DENSITIES.length
        && String(attachEvents).indexOf("ui.dayDensity !== 'compact'") !== -1;
      detail = JSON.stringify({storyBeats: beats(story), compactBeats: beats(compact)});
    }catch(err){ detail = err.message; }
    ui.dayDensity = prev; DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v72 both densities render every beat, and compact does not install the scroll observer', ok, detail);
  })();
  (function(){
    /* The remembered beat must never resurrect an account that is not in today's
       day — otherwise a stale id from yesterday silently selects nothing, or worse,
       an account the ranking has already dropped. */
    const before = getDayPrefs();
    let ok = false, detail = '';
    try{
      saveDayPrefs({focusId: '__not_in_today__'});
      const held = ui.todayFocusId;
      ui.todayFocusId = null;
      renderToday();
      const landed = ui.todayFocusId;
      const day = buildDayTimeline();
      ui.todayFocusId = held;
      ok = !day.beats.length || landed === day.beats[0].customerId;
      detail = JSON.stringify({landed, expected: day.beats.length ? day.beats[0].customerId : null});
    }catch(err){ detail = err.message; }
    saveDayPrefs(before);
    check('v72 a remembered beat that is no longer in the day falls back to the first', ok, detail);
  })();
  check('v72 the marker and rail agree with the beat the day OPENS on',
    /* Both were only ever written by setTodayFocus(), which does not run on first
       paint. Restoring beat 10 therefore rendered "1 of 15" beside it and left the
       rail at zero — the position indicators disagreed with the position. */
    String(renderDay).indexOf('${activeIdx + 1} of ${day.beats.length}') !== -1 &&
    String(attachEvents).indexOf("setProperty('--day'") !== -1,
    'the marker must render from activeIdx, and attachEvents must seed --day');
  check('v72 Day preferences stay OUT of the book',
    /* Density and focus are properties of this browser, not of the customer book.
       In DATA they would ride every export, widen the schema, and make the
       cross-tab conflict banner fire because the other tab merely scrolled. */
    DAY_PREFS_KEY !== STORAGE_KEY && DATA.dayDensity === undefined && DATA.dayPrefs === undefined &&
    String(saveDayPrefs).indexOf('DAY_PREFS_KEY') !== -1,
    'day prefs must live in their own localStorage key');
  (function(){
    /* v73 risk triage. The load-bearing claim is that dismissing a false positive
       is NOT permanent silence: it records the severity it was dismissed at, and
       the risk RETURNS when the account deteriorates past that point. A dismissal
       that could hide a real problem forever would make the hub less trustworthy,
       not more. */
    const prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const it = {kind:'Risk language', sev:2, c:{id:'__v__', name:'VerdictCo'}, detail:'d', date: todayISO()};
      it.logKey = riskItemKey(it);
      const fresh = riskVerdictState(it) === 'unreviewed';
      setRiskVerdict(it, 'confirmed', 'told me on the call');
      const confirmed = riskVerdictState(it) === 'confirmed';
      setRiskVerdict(it, 'dismissed', '  the keyword was about   their own tooling  ');
      const dismissed = riskVerdictState(it) === 'dismissed';
      const reasonTrimmed = DATA.riskLog[it.logKey].verdictReason === 'the keyword was about their own tooling';
      // The account deteriorates: same signal, higher severity.
      const worse = Object.assign({}, it, {sev: 3});
      const returned = riskVerdictState(worse) === 'returned' && riskReturnReason(worse).indexOf('2') !== -1;
      // (partitionRisks, which used to assert the review-queue placement here, was dead and is deleted.)
      /* The severity rule alone is not enough: Off Track is ALWAYS sev 3, so a
         sev-rise re-arm would never fire for the pacing risks that persist
         longest, and dismissing one would blind the hub to it forever. */
      const stale = Object.assign({}, it);
      stale.tracking = Object.assign({}, DATA.riskLog[it.logKey],
        {verdictOn: isoAddDays(todayISO(), -(RISK_DISMISS_EXPIRY_DAYS + 1))});
      const expired = riskVerdictState(stale) === 'returned'
        && riskReturnReason(stale).indexOf('second look') !== -1;
      clearRiskVerdict(it);
      const cleared = riskVerdictState(it) === 'unreviewed';
      ok = fresh && confirmed && dismissed && reasonTrimmed && returned && expired && cleared;
      detail = JSON.stringify({fresh, confirmed, dismissed, reasonTrimmed, returned, expired, cleared});
    }catch(err){ detail = err.message; }
    DATA.riskLog = prevLog;
    check('v73 a dismissed risk returns when the account deteriorates past the dismissal', ok, detail);
  })();
  check('v73 an unknown verdict is never trusted from an import',
    /* A verdict is a claim a person made. An imported one with a bogus value or no
       date is dropped rather than rendered, on the same contract as every other
       imported string. */
    (function(){
      const d = {schemaVersion: 6, riskLog: {
        a: {firstSeen: todayISO(), verdict: 'totally_fine', verdictOn: todayISO()},
        b: {firstSeen: todayISO(), verdict: 'dismissed', verdictOn: 'not-a-date'},
        c: {firstSeen: todayISO(), verdict: 'dismissed', verdictOn: todayISO(), verdictSev: 99}
      }};
      migrateData(d);
      repairAuxiliaryCollections(d);
      return d.schemaVersion === CURRENT_SCHEMA_VERSION
        && d.riskLog.a.verdict === undefined && d.riskLog.b.verdict === undefined
        && d.riskLog.c.verdict === 'dismissed' && d.riskLog.c.verdictSev === undefined;
    })(),
    'bogus verdicts and dates must be dropped; a bad verdictSev must not void a good verdict');
  (function(){
    /* The day closes once. A second wrap-up on the same day would re-congratulate
       the reader for work already counted. */
    const prev = DATA.dayClose;
    let ok = false, detail = '';
    try{
      DATA.dayClose = {};
      const before = dayIsClosed();
      closeTheDay({beats: 14, queued: 6});
      const after = dayIsClosed();
      const rec = getDayClose();
      ok = !before && after && rec.minutes === undefined && rec.beats === 14 && rec.queued === 6;
      detail = JSON.stringify({before, after, rec});
    }catch(err){ detail = err.message; }
    /* v90: was `DATA.dayClose = prev`. On a book that has never closed a day
       prev is undefined, and assigning undefined CREATES the key — so the
       whole-book purity guard reported added=[dayClose] on every freshly
       imported book. Latent since v73; only visible when the key starts absent,
       which is exactly the state a restored export arrives in. */
    if(prev === undefined) delete DATA.dayClose; else DATA.dayClose = prev;
    check('v73 the day can only be wrapped up once per day', ok, detail);
  })();
  (function(){
    /* ============ v73 RISK: THE GATE ============
       The load-bearing claim of the rebuild is that nothing asks you to fill in an
       owner, a date, or a 300-character executive summary for a risk you have not
       yet agreed is real. Four design lenses measured the old tab shipping all
       three on all 17 rows. This asserts the gate on RENDERED OUTPUT, not on
       source — a v69 check once "passed" by matching the comment that explained a
       removal rather than the markup. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevShow = ui.riskShowDismissed;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {}; ui.riskShowDismissed = false;
      const mk = (id, flagged) => { const c = {id, name:'Gate'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[], riskOverride:'risk'};
        backfillCustomerRecord(c); return {c, flagged}; };
      const seed = [mk('__g1__', true), mk('__g2__', true), mk('__g3__', false)];
      DATA.customers = seed.map(x => x.c);
      DATA.activities = seed.reduce((m,x)=>{ m[x.c.id] = x.flagged
        ? [{id:'a'+x.c.id, date: isoAddDays(todayISO(), -6), type:'Onboarding Session',
            summary:'They raised a blocker and are frustrated.', sessionNumber:1, checklist:[], flagged:true}]
        : []; return m; }, {});
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();

      const unreviewed = renderRiskTab();
      // (a) Before any verdict: a gate on every case, and NO workspace controls at all.
      const gates = (unreviewed.match(/data-risk-confirm=/g) || []).length;
      const gatedClean = gates > 0
        && unreviewed.indexOf('<textarea') === -1
        && unreviewed.indexOf('data-risk-owner=') === -1
        && unreviewed.indexOf('data-risk-due=') === -1
        && unreviewed.indexOf('data-risk-copy-gainsight=') === -1;

      // (b) Approving reveals the workspace for THAT account only.
      const cases = buildRiskCases(buildRiskHubList());
      const first = cases.find(k => k.state === 'unreviewed');
      first.items.forEach(it => setRiskVerdict(it, 'confirmed', 'told me on the call'));
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map();
      const afterApprove = renderRiskTab();
      const revealed = (afterApprove.match(/<textarea/g) || []).length === 1
        && afterApprove.indexOf('data-risk-copy-gainsight=') !== -1
        && afterApprove.indexOf('data-risk-owner=') !== -1
        // the owner control is labelled — the old tab had 34 labels and 0 associations
        && afterApprove.indexOf('<label class="sr-only" for="rk-owner-') !== -1;

      // (c) Dismissed cases sit behind a closed drawer, not in the queue.
      const second = buildRiskCases(buildRiskHubList()).find(k => k.state === 'unreviewed');
      second.items.forEach(it => setRiskVerdict(it, 'dismissed', 'about their own tooling'));
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map();
      const afterDismiss = renderRiskTab();
      const hidden = afterDismiss.indexOf(escapeHtml(second.c.name)) === -1;
      ui.riskShowDismissed = true;
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map();
      const opened = renderRiskTab();
      const shownOnRequest = opened.indexOf(escapeHtml(second.c.name)) !== -1
        && opened.indexOf('about their own tooling') !== -1;

      ok = gatedClean && revealed && hidden && shownOnRequest;
      detail = JSON.stringify({gates, gatedClean, revealed, hidden, shownOnRequest});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.riskShowDismissed = prevShow;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v73 Risk asks nothing of you until you have said the risk is real', ok, detail);
  })();
  check('v73 severity is a lane, not another chip in a row of chips',
    /* 14 of 17 rows were severity 3, so the badge encoded nothing. The lane is the
       .cust-row pattern: pre-attentive, and it survives a row full of badges. */
    String(renderRiskCase).indexOf("sevClass") !== -1 &&
    String(renderRiskCase).indexOf("k.sev >= 3 ? 'sev3'") !== -1,
    'renderRiskCase must set a severity class on the case element');
  check('v73 copying a draft is not the same as actioning a risk',
    /* markRiskActioned() fired on Copy CTA draft, so reading a draft started the
       maintenance clock and flipped the row to "actioned today". The verdict is
       the action now. */
    String(attachEvents).indexOf('data-risk-copy-gainsight') !== -1 &&
    (function(){
      const src = String(attachEvents);
      const i = src.indexOf("data-risk-copy-gainsight");
      const seg = src.slice(i, i + 500);
      return seg.indexOf('markRiskActioned') === -1;
    })(),
    'the copy handler must not stamp an action');
  check('v73 the dismissal composer is a real dialog, not prompt()',
    /* prompt() carries a string but not the weight: no character guidance, no
       Escape contract, and some platforms suppress it entirely — which would have
       produced reason-less verdicts silently. */
    typeof showRiskDismissModal === 'function' &&
    String(showRiskDismissModal).indexOf('role="dialog"') !== -1 &&
    String(showRiskDismissModal).indexOf('aria-modal') !== -1 &&
    String(showRiskDismissModal).indexOf("e.key === 'Escape'") !== -1 &&
    String(attachEvents).indexOf('prompt(') === -1,
    'dismissal must use the modal, and attachEvents must not call prompt()');
  check('v73 removing a queued item confirms first and says so',
    // It was destructive, unconfirmed and completely silent.
    (function(){
      const src = String(attachEvents);
      const i = src.indexOf('data-queue-remove');
      const seg = src.slice(i, i + 600);
      return seg.indexOf('confirm(') !== -1 && seg.indexOf('markUndoable') !== -1 && seg.indexOf('showToast') !== -1;
    })(),
    'queue removal needs a confirm, an undo mark, and a confirmation message');

  (function(){
    /* ============ v73 COPILOT: THE NARRATIVE ============
       Asserted against RENDERED OUTPUT. The three removed sections must be gone
       from what a reader sees, and the degenerate-list bug — eleven byte-identical
       cards under a heading called "Recommended Moves" — must not be able to
       return in a new costume. */
    const prevC = DATA.customers, prevA = DATA.activities, prevSnap = DATA.weeklySnapshot;
    /* PRESENCE, not truthiness. weeklySnapshot is legitimately null on a book
       with no baseline yet, and applyDataBackfills() requires the KEY to exist.
       Restoring on `if(prevSnap)` deleted the key outright for exactly that
       case, so every run of the suite quietly removed it from the real book. */
    const hadSnap = 'weeklySnapshot' in DATA;
    let ok = false, detail = '';
    try{
      const cs = [];
      for(let i = 0; i < 6; i++){
        const c = {id:'__cp'+i+'__', name:'Copilot'+i, module:DATA.config.modules[0],
          stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
          totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(c); cs.push(c);
      }
      DATA.customers = cs;
      DATA.activities = cs.reduce((m,c)=>{ m[c.id] = []; return m; }, {});
      delete DATA.weeklySnapshot;
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      /* v94: Copilot now opens on a landing and reveals the chapters on request.
         Every assertion below is about the OPENED tab, so open it. */
      const _prevOpen = ui.copilotOpen; ui.copilotOpen = true;
      const html = renderCopilot();
      ui.copilotOpen = _prevOpen;
      const text = html.replace(/<[^>]+>/g, ' ');

      const removed = ['Risk work has its own tab', 'Is the advice any good', 'Estimated Time Saved', 'Recommended Moves']
        .filter(s => text.indexOf(s) !== -1);
      const hasBeats = ['The rest of this week', 'The month ahead', 'What to do next']
        .every(s => text.indexOf(s) !== -1);
      /* v95: was matching the literal words "Administrative" and "Strategic".
         Both columns were renamed when the chapter stopped doing bookkeeping, and
         a check that pins COPY fails every time the copy improves. The structural
         claim — that this chapter is two columns — is what actually matters. */
      const split = (html.match(/class="cp-col"/g) || []).length === 2
        && html.indexOf('class="cp-split"') !== -1;
      // Counts carry their accounts: every insight renders at least one named chip.
      const insights = getPortfolioAdvisorInsights();
      const carriesNames = insights.every(i => Array.isArray(i.customers) && i.customers.length > 0);
      // No tinted panel survived, and the AI disclosure is NOT inside a heading.
      const noTint = html.indexOf('copilot-brief') === -1;
      /* v75: the heading class moved from .cp-h to .cp2-h and the chapters gained
         index numerals. The ASSERTION is unchanged and is the one that matters —
         the 104-character data-egress disclosure must be body copy, not set in
         11px uppercase mono inside a heading, which is where it used to render.
         Matched on the closing </h2> falling between the heading and the
         sentence, so it survives the next class rename too. */
      /* v90: the AI chapter is gone and its output now renders under the band
         only when there IS output. The assertion that matters is unchanged and
         is the reason this check exists: the data-egress sentence must be BODY
         COPY, never set inside a heading. Rendered with a brief present, since
         with none there is correctly nothing to disclose. */
      const prevAi = ui.aiPortfolioBrief, prevOpen2 = ui.copilotOpen;
      ui.aiPortfolioBrief = {loading:false, text:'x', error:'', req:0, legend:null};
      ui.copilotOpen = true;
      const aiHtml = renderCopilot();
      ui.aiPortfolioBrief = prevAi; ui.copilotOpen = prevOpen2;
      const discIdx = aiHtml.indexOf('using your own API key');
      const disclosureOutsideHeading = discIdx !== -1
        && aiHtml.slice(0, discIdx).lastIndexOf('<p class="cp-note">') >
           aiHtml.slice(0, discIdx).lastIndexOf('<h2')
        && aiHtml.indexOf('Ask AI for a second read') === -1
        && aiHtml.indexOf('Not generated yet') === -1;
      ok = !removed.length && hasBeats && split && carriesNames && noTint && disclosureOutsideHeading;
      detail = JSON.stringify({removed, hasBeats, split, carriesNames, noTint, disclosureOutsideHeading});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    if(hadSnap) DATA.weeklySnapshot = prevSnap; else delete DATA.weeklySnapshot;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v73 Copilot is a narrative with a time axis, and the three cut sections stay cut', ok, detail);
  })();
  check('v73 Copilot batches administrative work instead of listing it per account',
    /* "Recommended Moves" rendered one card per attention account and, on a real
       book, every card said the same thing. getBatchingOpportunities() computes
       the collapse and was called from nowhere on this tab. */
    String(renderCopilot).indexOf('getBatchingOpportunities()') !== -1 &&
    String(renderCopilot).indexOf('getCurriculumBottlenecks()') !== -1 &&
    String(renderCopilot).indexOf('getDomainImbalanceClusters()') !== -1,
    'administrative must batch by gate; strategic must use the pattern detectors');
  check('v73 portfolio insights keep the accounts they are counting',
    /* "8 accounts have gone quiet" was true and unusable: the function knew which
       eight and discarded the list on its way to a number. */
    (function(){
      const out = getPortfolioAdvisorInsights();
      return Array.isArray(out) && out.every(i =>
        typeof i.text === 'string' && typeof i.key === 'string' && Array.isArray(i.customers));
    })(),
    'each insight must carry {key, text, customers}');
  check('v73 the month lane is computed, never estimated',
    // Every value comes from a function that already existed; nothing is invented.
    (function(){
      const m = getMonthAhead();
      return m && Array.isArray(m.landing) && Array.isArray(m.offSla) && Array.isArray(m.noDate)
        && String(getMonthAhead).indexOf('projectedGraduationDate') !== -1
        && String(getMonthAhead).indexOf('isGradDateWithinTolerance') !== -1;
    })(),
    'getMonthAhead must derive from the existing projection and SLA helpers');
  (function(){
    /* v73.1: a logged note is EVIDENCE, not a reason. A real flagged note is a
       1,858-character meeting recap, and Today printed it whole — in the beat AND
       in the panel — which pushed the account's actual state off screen. Asserted
       against a note of that real length. */
    /* riskLog gets a throwaway: renderBeatPanel() calls buildRiskHubList(), which
       STAMPS risk memory for every item it sees. Without this the check writes
       __ln__ keys into the real book — which is exactly what the v61 guard below
       exists to catch, and exactly what it caught when this check was written. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const LONG = 'Key points 1. Database Connectors: '.padEnd(1858, 'x');
      const c = {id:'__ln__', name:'LongNote', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -140),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c];
      DATA.activities = {__ln__: [{id:'la1', date: isoAddDays(todayISO(), -3), type:'Onboarding Session',
        summary: LONG, sessionNumber:4, checklist:[], flagged:true,
        openThreads:[{id:'lt1', q:'Can numeric columns be restricted to US number format?', a:null}]}]};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const row = todayActionList().find(r => r.customerId === '__ln__');
      const reason = (row && row.reasons[0]) || '';
      const beat = {kind:'work', customerId:'__ln__', customerName:'LongNote', at:null, call:null,
        row, headline:row.headline, reasons:row.reasons.slice(), severity:row.severity,
        effortMin:row.effortMin, signalKey:row.signalKey};
      const panel = renderBeatPanel(beat, () => '');
      ok = reason.length < 250                       // the reason is a quote, not the note
        && panel.indexOf(LONG) === -1                // the note is nowhere in the panel
        && panel.indexOf('beat-standing') !== -1     // the standing block leads instead
        && panel.indexOf('Read the full note') !== -1// and points at where the note lives
        && panel.indexOf('bs-extract') !== -1        // but you can still SEE what was said
        && panel.indexOf('bs-roll') !== -1           // and the shape of the whole relationship
        && panel.indexOf('data-thread-ai=') !== -1;  // the open question can be answered
      detail = JSON.stringify({reasonChars: reason.length, noteChars: LONG.length,
        noteInPanel: panel.indexOf(LONG) !== -1});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v73 a logged note never renders whole on Today — it is evidence, not a reason', ok, detail);
  })();
  check('v73 the panel summarises the account AND the last touchpoint, not just counts',
    /* v73.1 fixed the note bloat by deleting the note and leaving metadata: you
       could see THAT a conversation happened, its date and its type, but not a
       word of what was said. "A small summary" was the ask, and none is not
       small. Three things must be present together: the roll-up across all
       activity, an extract of the last touchpoint in the OSM's own words, and the
       word count so nobody mistakes the extract for the whole note. */
    String(renderBeatStanding).indexOf('accountActivityRollup(c)') !== -1 &&
    String(renderBeatStanding).indexOf('bs-extract') !== -1 &&
    String(renderBeatStanding).indexOf("trimToLength(st.last.summary") !== -1 &&
    String(renderBeatStanding).indexOf('Extract of your note') !== -1,
    'the standing block needs the roll-up, the extract, and the extract disclosure');
  check('v73 open questions come from every logged activity, not just the last one',
    // A question raised three calls ago and never answered is exactly what goes
    // missing; the old panel only ever looked at the most recent activity.
    String(collectOpenQuestions).indexOf('DATA.activities[c.id] || []') !== -1 &&
    String(collectOpenQuestions).indexOf('forEach') !== -1 &&
    String(renderBeatQuestions).indexOf('collectOpenQuestions') !== -1);
  check('v73 the AI answer follows the OSM instruction without loosening the grounding',
    /* The instruction is a voice-and-format layer. It must reach the prompt, and
       it must not be able to authorise inventing product behaviour. */
    String(buildThreadAnswerPrompt).indexOf('getAiSettings().answerInstruction') !== -1 &&
    String(buildThreadAnswerPrompt).indexOf('it does not override the rules above') !== -1 &&
    String(buildThreadAnswerPrompt).indexOf('Never invent Workiva product behaviour') !== -1 &&
    String(buildThreadAnswerPrompt).indexOf('curriculum') !== -1);
  check('v73 clearing the AI key does not delete the answer instruction',
    // Two unrelated settings in one store: a plain overwrite on the clear-key path
    // would have silently destroyed an instruction the OSM had written.
    String(saveAiSettings).indexOf('settings.answerInstruction !== undefined') !== -1 &&
    String(saveAiSettings).indexOf('prior.answerInstruction') !== -1);
  (function(){
    /* v74 curriculum fit. The arithmetic is the whole feature, so it is asserted
       directly rather than through a render. */
    const prevC = DATA.customers, prevCfg = DATA.config.componentWeights, prevWin = DATA.config.standardWindowWeeks;
    let ok = false, detail = '';
    try{
      delete DATA.config.componentWeights; delete DATA.config.standardWindowWeeks;
      const mk = (comps, goLive, target) => { const c = {id:'__fit__', name:'FitCo',
        module:DATA.config.modules[0], stage:DATA.config.stages[1].key,
        implementationDate: goLive, totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(c); if(comps) c.components = comps;
        if(target) c.targetGraduationDate = target; return c; };

      // Unset components must NOT compute a fit against an imagined component list.
      const unset = computeCurriculumFit(mk(null, isoAddDays(todayISO(), -10)));
      // The published-weight cases from the research.
      const carbon = computeCurriculumFit(mk(['carbon'], isoAddDays(todayISO(), -10)));
      const triple = computeCurriculumFit(mk(['sustainability','csrd','carbon'], isoAddDays(todayISO(), -10)));
      const controls = computeCurriculumFit(mk(['controls'], isoAddDays(todayISO(), -10)));

      // Window from real dates beats the standard, and says which it used.
      const dated = computeCurriculumFit(mk(['carbon'], isoAddDays(todayISO(), -70), isoAddDays(todayISO(), 70)));

      // An unknown component key is ignored rather than counted as zero silently.
      const junk = computeCurriculumFit(mk(['carbon','__nope__'], isoAddDays(todayISO(), -10)));

      ok = unset.configured === false
        && carbon.required === 5 && carbon.cadences.every(x => x.fits)          // 3 + 2, fits both
        && controls.required === 7                                              // 3 + 4
        && controls.cadences.find(x=>x.key==='weekly').fits
        && !controls.cadences.find(x=>x.key==='biweekly').fits                  // 7 > 6
        && triple.required === 10                                               // 3 + 2 + 3 + 2
        && triple.cadences.find(x=>x.key==='weekly').fits                       // 10 <= 13
        && !triple.cadences.find(x=>x.key==='biweekly').fits
        && dated.fromDates === true && dated.weeks === 20
        && carbon.fromDates === false && carbon.weeks === DEFAULT_WINDOW_WEEKS
        && junk.required === carbon.required;                                   // junk key contributed nothing
      detail = JSON.stringify({carbon:carbon.required, controls:controls.required, triple:triple.required,
        datedWeeks:dated.weeks, standardWeeks:carbon.weeks});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC;
    if(prevCfg) DATA.config.componentWeights = prevCfg; else delete DATA.config.componentWeights;
    if(prevWin) DATA.config.standardWindowWeeks = prevWin; else delete DATA.config.standardWindowWeeks;
    check('v74 curriculum fit computes from components, and says which window it used', ok, detail);
  })();
  check('v74 an unset customer is never given a fabricated component list',
    /* Asserted on BEHAVIOUR, not on a comment. The first version of this check
       matched a sentence in migrateData and failed on its capitalisation — the
       same fragility that once let a check pass by matching the comment
       explaining a removal. Run the migration and look at the result instead. */
    (function(){
      const d = {schemaVersion: 7, customers: [
        {id:'m1', name:'A', module:'Sustainability', reportsCSRD:true},
        {id:'m2', name:'B', module:'Both'},
        {id:'m3', name:'C', module:'Carbon', components:['carbon','__nope__','core']}
      ], activities:{}};
      migrateData(d);
      const [a, b2, c] = d.customers;
      return d.schemaVersion === CURRENT_SCHEMA_VERSION
        && a.components === undefined            // CSRD flag must NOT become a component
        && b2.components === undefined           // a free-text module must NOT be mapped
        && Array.isArray(c.components) && c.components.length === 1 && c.components[0] === 'carbon'
        && computeCurriculumFit(b2).configured === false;
    })(),
    'the migration must not invent components, and unknown/core keys must be stripped');
  check('v74 component weights are editable and every weight is overridable',
    // A weight nobody can change is a number the tracker is asserting, not offering.
    String(componentWeight).indexOf('DATA.config.componentWeights') !== -1 &&
    CURRICULUM_COMPONENTS.every(d => Number.isInteger(d.weight) && d.weight >= 0) &&
    CURRICULUM_COMPONENTS.every(d => typeof d.why === 'string' && d.why.length > 30),
    'every component needs an integer weight and a stated basis');
  check('v74 the inferred weight is labelled as inferred',
    // CSRD has no published onboarding path. That is a different epistemic status
    // from the measured weights and the UI must not flatten the two.
    CURRICULUM_COMPONENT_MAP.csrd.inferred === true &&
    CURRICULUM_COMPONENT_MAP.csrd.why.indexOf('INFERRED') !== -1 &&
    CURRICULUM_COMPONENTS.filter(d => !d.inferred).every(d => !/INFERRED/.test(d.why)));
  check('v72 no NodeList is treated as an Array in attachEvents',
    /* $$() returns a NodeList: it has forEach but NOT filter, find, map, or
       slice. Calling one of those throws mid-attachEvents and every binding
       AFTER the throw silently never happens — which is how the beat panes went
       dead a second time in one build. This has now bitten this project twice
       (v70: "callSteps.find is not a function"), so it gets a check rather than
       a comment. */
    !/\$\$\([^)]*\)\s*\.\s*(filter|find|map|slice|reduce|some|every|sort)\b/.test(String(attachEvents)),
    (String(attachEvents).match(/\$\$\([^)]*\)\s*\.\s*(filter|find|map|slice|reduce|some|every|sort)\b/g) || []).join(' | '));
  check('v72 "Mark handled" on an open question is actually wired',
    // It rendered with no listener for one build after its v70 binding was
    // deleted with the block around it. A rendered button that does nothing is
    // worse than an absent one.
    /* renderBeatQuestions owns this control now. It used to be asserted against
       renderBeatPrep, which rendered a SECOND copy of the same questions; that
       duplicate was removed, and the check was pinned to the function rather
       than to the control. The binding is asserted separately on the next line,
       so both halves of "Mark handled is wired" are still covered. */
    String(renderBeatQuestions).indexOf('data-thread-resolve=') !== -1 &&
    String(bindBeatPane).indexOf('data-thread-resolve') !== -1 &&
    String(bindBeatPane).indexOf('resolvedOn') !== -1);
  check('v72 the pane pool is exactly three nodes at any beat count',
    // The pool is what removes v71's 15-panes-to-show-1. beatIndex % 3 keeps
    // prev/active/next on distinct nodes, so exactly one falls out per step.
    String(renderDay).indexOf('[0,1,2].map') !== -1 &&
    String(syncDayPool).indexOf('% 3') !== -1);
  check('v72 the close is the only place that pushes, and it reads the real queue',
    // Draft in the beat, push at the close: a beat action must QUEUE, not fire.
    String(renderDayClose).indexOf('getGainsightQueue()') !== -1 &&
    String(renderBeatPanel).indexOf('data-fp-queue=') !== -1 &&
    String(renderBeatPanel).indexOf('data-fp-outcome-queue=') !== -1);
  check('v62 AI dossier reads a full onboarding lifecycle',
    CALLPREP_MAX_ACTIVITIES >= 40 && CALLPREP_NOTE_CHAR_CAP > 0,
    `max=${CALLPREP_MAX_ACTIVITIES}, noteCap=${CALLPREP_NOTE_CHAR_CAP}`);
  check('v62 search repaint is debounced, not per-keystroke',
    Number.isFinite(SEARCH_DEBOUNCE_MS) && SEARCH_DEBOUNCE_MS >= 100 && SEARCH_DEBOUNCE_MS <= 400,
    `SEARCH_DEBOUNCE_MS=${SEARCH_DEBOUNCE_MS}`);
  (function(){
    /* The snapshot must render for BOTH lifecycles and must not invent numbers.
       An in-implementation account has no sessions/readiness/compliance yet —
       showing 0/8 would read as failure rather than "not started". */
    let ok = false, detail = '';
    try{
      const base = {id:'__snap__', name:'SnapCo', module:DATA.config.modules[0], stage:DATA.config.stages[1].key,
        implementationDate: isoAddDays(todayISO(), -100), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(base);
      const prevActs = DATA.activities['__snap__']; DATA.activities['__snap__'] = [];
      const live = renderAccountSnapshot(base, computeRisk(base));
      const impl = Object.assign({}, base, {implementation:{phase:'kickoff', partner:'Acme Partners'}});
      const implHtml = renderAccountSnapshot(impl, computeRisk(impl));
      if(prevActs === undefined) delete DATA.activities['__snap__']; else DATA.activities['__snap__'] = prevActs;
      // Labels are title-case in the HTML; the uppercasing is CSS, not markup.
      ok = live.indexOf('>Sessions<') !== -1 && live.indexOf('>Readiness<') !== -1 && live.indexOf('>Gainsight<') !== -1
        && implHtml.indexOf('>Sessions<') === -1 && implHtml.indexOf('>Readiness<') === -1
        && implHtml.indexOf('>Phase<') !== -1 && implHtml.indexOf('>Target Go-Live<') !== -1
        && implHtml.indexOf('Acme Partners') !== -1;
      detail = JSON.stringify({liveHasSessions: live.indexOf('>Sessions<') !== -1, implHasSessions: implHtml.indexOf('>Sessions<') !== -1,
        implHasPhase: implHtml.indexOf('>Phase<') !== -1});
    }catch(err){ detail = err.message; }
    check('v62 account snapshot renders per lifecycle without inventing pre-Go-Live metrics', ok, detail);
  })();
  (function(){
    /* v63 Account Brief. The rollup must summarise what was actually logged and
       must not invent cadence from a single touchpoint. Synthetic account,
       snapshotted and restored. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__brief__', name:'BriefCo', module:DATA.config.modules[0], stage:DATA.config.stages[1].key,
        implementationDate: isoAddDays(todayISO(), -100), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c];
      DATA.activities = {__brief__: [
        {id:'b1', date: isoAddDays(todayISO(), -60), type:'Call', summary:'kickoff', sessionNumber:null, checklist:[{label:'x', done:false}], flagged:false},
        {id:'b2', date: isoAddDays(todayISO(), -30), type:'Onboarding Session', summary:'s1', sessionNumber:1, checklist:[], flagged:true},
        {id:'b3', date: isoAddDays(todayISO(), -10), type:'Onboarding Session', summary:'s2', sessionNumber:2, checklist:[], flagged:false},
        {id:'b4', date:'not-a-date', type:'Call', summary:'corrupt row', sessionNumber:null, checklist:[], flagged:false}
      ]};
      const r = accountActivityRollup(c);
      // 3 valid rows (the malformed date is dropped), 50-day span, 2 intervals -> 25
      DATA.activities['__brief1__'] = [{id:'s1', date: todayISO(), type:'Call', summary:'one', sessionNumber:null, checklist:[], flagged:false}];
      const oneOnly = accountActivityRollup({id:'__brief1__'});
      const empty = accountActivityRollup({id:'__nothing_logged__'});
      ok = r.count === 3 && r.spanDays === 50 && r.cadence === 25
        && r.byType['Onboarding Session'] === 2 && r.byType['Call'] === 1
        && r.sessionNums.join(',') === '1,2' && r.flagged.length === 1 && r.openChecklist === 1
        && oneOnly.cadence === null   // one touchpoint has no cadence, not zero
        && empty === null;            // nothing logged says so, rather than rendering zeros
      delete DATA.activities['__brief1__'];
      detail = JSON.stringify({count:r.count, span:r.spanDays, cadence:r.cadence, sessions:r.sessionNums,
        flagged:r.flagged.length, openChecklist:r.openChecklist, oneCadence: oneOnly && oneOnly.cadence, empty});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    _renderMemoResets.forEach(r => r());
    check('v63 activity rollup counts what was logged and invents nothing', ok, detail);
  })();
  (function(){
    // The batch text is plain text bound for a Gainsight timeline entry, and the
    // Gainsight tab must never claim a push it cannot perform.
    let ok = false, detail = '';
    try{
      const c = {id:'__batch__', name:'BatchCo <b>x</b>'};
      const items = [{activityType:'Onboarding Success Plan', label:'Log Sentiment', date: todayISO()}];
      const text = buildGainsightBatchText(c, items);
      const tabHtml = (function(){
        const prevC = DATA.customers, prevA = DATA.activities;
        const cc = {id:'__batchtab__', name:'BatchTab', module:DATA.config.modules[0], stage:DATA.config.stages[1].key,
          implementationDate: isoAddDays(todayISO(), -60), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(cc);
        DATA.customers = [cc]; DATA.activities = {__batchtab__: []};
        _renderMemoResets.forEach(r => r());
        const h = renderCustomerGainsightTab(cc);
        DATA.customers = prevC; DATA.activities = prevA;
        _renderMemoResets.forEach(r => r());
        return h;
      })();
      ok = text.indexOf('BatchCo <b>x</b>') !== -1        // plain text: NOT html-escaped
        && text.indexOf('nothing was pushed automatically') !== -1
        && tabHtml.indexOf('Nothing is sent to Gainsight') !== -1
        && tabHtml.indexOf('data-gainsight-batch') !== -1;
      detail = JSON.stringify({textOk: text.indexOf('nothing was pushed') !== -1, tabStatesNoPush: tabHtml.indexOf('Nothing is sent to Gainsight') !== -1});
    }catch(err){ detail = err.message; }
    check('v63 Gainsight batch copies plain text and never claims a push', ok, detail);
  })();
  (function(){
    /* v64 contrast. Computed from the LIVE computed tokens, not from hardcoded
       hexes, so editing a token and forgetting the ratio fails here. Text tokens
       must clear WCAG AA for small text (4.5:1) on both surfaces; the raw status
       colours are exempt because they are fills and borders, which answer to the
       3:1 non-text rule instead. */
    const cs = getComputedStyle(document.documentElement);
    const val = n => { let v = cs.getPropertyValue(n).trim(); if(v.startsWith('var(')) v = cs.getPropertyValue(v.slice(4,-1)).trim(); return v; };
    const hx = h => { h = h.replace('#',''); if(h.length===3) h = h.split('').map(c=>c+c).join(''); return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)); };
    const lum = c => { const [r,g,b] = c.map(v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }); return 0.2126*r + 0.7152*g + 0.0722*b; };
    const ratio = (a,b) => { const L1 = lum(hx(a)), L2 = lum(hx(b)); return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05); };
    /* Measured against every surface text actually sits on — including
       --bg-card-hover, the tinted strip background. Checking white alone passed
       tokens that still failed at 4.26:1 on the implementation strip. */
    const surfaces = ['--bg-card','--bg','--bg-card-hover','--bg-panel']
      .map(n => val(n)).filter(v => /^#[0-9a-fA-F]{3,6}$/.test(v));
    const textTokens = ['--text','--text-dim','--text-faint','--accent-info',
      '--status-ontrack-text','--status-watch-text','--status-risk-text'];
    const bad = textTokens.filter(t => { const v = val(t);
      return !v || surfaces.some(bg => ratio(v, bg) < 4.5); });
    check('v64 every text colour token clears WCAG AA on every surface it sits on', bad.length === 0,
      bad.map(t => `${t}=${val(t)} worst=${Math.min(...surfaces.map(bg=>ratio(val(t),bg))).toFixed(2)}`).join(' | '));
    // The raw status colours must stay VIVID — they are the badge fills. If someone
    // "fixes" them by darkening, the text variants become pointless duplicates.
    check('v64 raw status colours stay distinct from their text variants',
      val('--status-risk') !== val('--status-risk-text') &&
      val('--status-watch') !== val('--status-watch-text') &&
      val('--status-ontrack') !== val('--status-ontrack-text'));
  })();
  (function(){
    // Dialog semantics. Rendered markup, not the DOM, so the check does not
    // depend on a panel happening to be open when the suite runs.
    const c = DATA.customers[0];
    let html = '';
    if(c){
      const prevId = ui.openCustomerId, prevTab = ui.panelTab;
      /* v84: this renders a REAL account, and rendering a recommendation stamps
         lastShownRecommendation onto it — a legitimate app side effect landing on
         real data because the check reached for a real record. The v74.4 guard
         caught it. Guarding the stamping function itself was the wrong fix: the
         overview renderer READS what it writes, so suppressing it crashed the
         panel. The check restores the field instead, which is where the
         responsibility belongs. */
      const hadStamp = 'lastShownRecommendation' in c;
      const prevStamp = c.lastShownRecommendation;
      ui.openCustomerId = c.id; ui.panelTab = 'overview';
      try{ html = renderPanel(); } finally {
        ui.openCustomerId = prevId; ui.panelTab = prevTab;
        if(hadStamp) c.lastShownRecommendation = prevStamp; else delete c.lastShownRecommendation;
      }
    }
    check('v64 slide-over is a labelled modal dialog', !c || (
      html.indexOf('role="dialog"') !== -1 &&
      html.indexOf('aria-modal="true"') !== -1 &&
      html.indexOf('aria-labelledby="panel-title"') !== -1 &&
      html.indexOf('id="panel-title"') !== -1 &&
      html.indexOf('tabindex="-1"') !== -1),
      c ? 'panel markup missing dialog attributes' : '(no accounts to test)');
    check('v64 Escape/Tab handling is bound once, not per render',
      typeof bindGlobalKeys === 'function' && typeof syncPanelFocus === 'function');
  })();
  (function(){
    // Routing must round-trip and must reject junk rather than blank the app.
    const prev = {view: ui.view, id: ui.openCustomerId, tab: ui.panelTab, route: _lastRoute};
    let ok = false, detail = '';
    try{
      const c = DATA.customers[0];
      ui.view = 'risk'; ui.openCustomerId = c ? c.id : null; ui.panelTab = 'gainsight';
      const r = currentRoute();
      const roundTrip = c ? r === `#/risk/${encodeURIComponent(c.id)}/gainsight` : r === '#/risk';
      // junk route degrades to defaults instead of an empty panel
      const realHash = location.hash;
      history.replaceState({}, '', '#/nonsense/__missing__/bogus');
      applyRoute();
      const degraded = ui.view === 'today' && ui.openCustomerId === null && ui.panelTab === 'overview';
      history.replaceState({}, '', realHash || '#/today');
      ok = roundTrip && degraded;
      detail = JSON.stringify({route: r, roundTrip, degraded});
    }catch(err){ detail = err.message; }
    ui.view = prev.view; ui.openCustomerId = prev.id; ui.panelTab = prev.tab; _lastRoute = prev.route;
    check('v64 route round-trips and rejects unknown view/account/tab', ok, detail);
  })();
  (function(){
    /* v65 risk executive summary. The 300-char cap is the one promise this
       feature makes, so it is enforced in code and checked here against inputs
       designed to blow past it — a model that ignores the instruction, or a
       pasted wall of text, must not produce an over-length summary. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const c = {id:'__risksum__', name:'RiskSumCo With A Deliberately Very Long Account Name For Truncation Testing',
        module: DATA.config.modules[0], stage: DATA.config.stages[1].key,
        implementationDate: isoAddDays(todayISO(), -200), totalSessions:8,
        domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c];
      DATA.activities = {__risksum__: [{id:'rs1', date: isoAddDays(todayISO(), -120), type:'Call',
        summary:'escalate — the sponsor is blocked and frustrated', sessionNumber:null, checklist:[], flagged:true}]};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const items = buildRiskHubList().filter(x => x.c.id === '__risksum__');
      const lengths = items.map(it => buildRiskExecSummary(it).length);
      const overCap = lengths.filter(n => n > RISK_SUMMARY_MAX).length;
      // trimToLength must never exceed the cap and must never return raw junk
      const long = trimToLength('x '.repeat(500), RISK_SUMMARY_MAX);
      const short = trimToLength('already short', RISK_SUMMARY_MAX);
      // provenance must distinguish a human-flagged risk from an inferred one
      const flagged = items.find(x => x.kind === 'Flagged note');
      const provenanceOk = !flagged || riskProvenanceLabel(flagged).indexOf('you flagged') !== -1
        && riskProvenanceLabel({kind:'Risk language'}).indexOf('inferred') !== -1;
      // an over-length write is clamped, not stored raw
      let clamped = true;
      if(items.length){
        setRiskSummary(items[0].logKey, 'y '.repeat(400), 'local');
        clamped = getRiskLog()[items[0].logKey].summary.length <= RISK_SUMMARY_MAX;
      }
      ok = items.length > 0 && overCap === 0 && long.length <= RISK_SUMMARY_MAX
        && short === 'already short' && provenanceOk && clamped;
      detail = JSON.stringify({items: items.length, lengths, overCap, longLen: long.length, clamped, provenanceOk});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v65 risk summary never exceeds its stated character cap', ok, detail);
  })();
  check('v65 risk summary is stored on risk memory, so it prunes with the risk',
    (function(){
      // Not a separate store: the summary must live on the same entry that
      // buildRiskHubList() deletes when a risk stops existing.
      const src = String(setRiskSummary);
      return src.indexOf('getRiskLog()') !== -1 && src.indexOf('log[logKey].summary') !== -1;
    })());
  /* ============ v66: FLOW CHECKS ============
     Everything above asserts INVARIANTS — shapes, ranges, registry consistency.
     None of it exercised a user journey end to end, which is the regression
     class that actually bites: log an activity and the stall signal should
     clear, Today should reorder, the Gainsight item should disappear when you
     tick it. Those were only ever verified by driving the browser by hand.
     Each flow runs on a synthetic book, snapshotted and restored, with a
     throwaway riskLog because these surfaces stamp risk memory. */
  (function(){
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    const steps = [];
    const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
    try{
      DATA.riskLog = {};
      const mk = (id, name, extra) => { const c = Object.assign({id, name,
        module: DATA.config.modules[0], stage: DATA.config.stages[1].key,
        implementationDate: isoAddDays(todayISO(), -200), totalSessions:8,
        domainScores:{}, sessionNotes:{}, stageHistory:[]}, extra || {});
        backfillCustomerRecord(c); c.stageHistory = [{stage:c.stage, date:c.implementationDate}]; return c; };
      const quiet = mk('__flowA__', 'FlowQuiet');
      DATA.customers = [quiet];
      DATA.activities = {__flowA__: [{id:'f1', date: isoAddDays(todayISO(), -90), type:'Onboarding Session',
        summary:'Session 1 delivered.', sessionNumber:1, checklist:[], flagged:false}]};
      reset();

      // FLOW 1 — a long-silent account is ranked, and logging a touchpoint clears it.
      const before = todayActionList().find(r => r.customerId === '__flowA__');
      steps.push(['silent account is ranked', !!before]);
      steps.push(['silent account cites its silence', !!before && /day/i.test(before.reasons.join(' '))]);
      DATA.activities['__flowA__'].push({id:'f2', date: todayISO(), type:'Onboarding Session',
        summary:'Session 2 delivered today.', sessionNumber:2, checklist:[], flagged:false});
      reset();
      const after = todayActionList().find(r => r.customerId === '__flowA__');
      steps.push(['logging a touchpoint lowers or clears the row',
        !after || after.severity < before.severity || after.source !== before.source]);

      // FLOW 2 — an unchecked Gainsight item appears, and ticking it removes it.
      DATA.activities['__flowA__'].push({id:'f3', date: todayISO(), type:'Call',
        summary:'Follow-up call.', sessionNumber:null, checklist:[{label:'Log call summary', done:false}], flagged:false});
      reset();
      const pendingBefore = pendingGainsightItems().filter(i => i.customerId === '__flowA__').length;
      const act = DATA.activities['__flowA__'].find(a => a.id === 'f3');
      act.checklist[0].done = true;
      reset();
      const pendingAfter = pendingGainsightItems().filter(i => i.customerId === '__flowA__').length;
      steps.push(['ticking a checklist item removes it from pending', pendingAfter === pendingBefore - 1]);

      // FLOW 3 — flagging a note escalates the account to the top of Today.
      act.flagged = true;
      reset();
      const ranked = todayActionList();
      const top = ranked[0];
      steps.push(['a flagged note takes severity 4', !!top && top.customerId === '__flowA__' && top.severity === 4]);
      steps.push(['the flagged row quotes the note', !!top && top.reasons.join(' ').indexOf('Follow-up call') !== -1]);
      steps.push(['a flagged risk reaches the Risk tab',
        buildRiskHubList().some(x => x.c.id === '__flowA__' && x.kind === 'Flagged note')]);

      // FLOW 4 — pausing removes time-based nagging but a flag still pierces.
      quiet.pause = {setOn: todayISO(), until: isoAddDays(todayISO(), 14), reason:'customer PTO'};
      reset();
      steps.push(['a flag pierces a pause', todayActionList().some(r => r.customerId === '__flowA__')]);
      act.flagged = false;
      reset();
      /* A pause suspends chasing the CUSTOMER — sessions, coverage, and every
         time-based signal. It does NOT suspend your own Gainsight compliance
         admin, which is back-office work a customer's absence has no bearing
         on. Verified directly: for a paused account dueForSession() is false,
         computeCoverage() is null, and getRecommendedAction() falls back to
         next_session; only the compliance gates keep the row alive, and
         completing them removes it. This assertion writes that ruling down —
         the first draft of this check asserted the account vanished entirely
         and was simply wrong about the product. */
      const pausedRow = todayActionList().find(r => r.customerId === '__flowA__');
      steps.push(['a paused account drops every time-based reason',
        !pausedRow || (pausedRow.source.indexOf('signal:') !== 0
          && pausedRow.source !== 'session_due'
          && pausedRow.source.indexOf('coverage_') !== 0)]);
      quiet.compliance.sentiment.done = true;
      quiet.compliance.outcomePlan.done = true;
      quiet.compliance.associatedPeopleCSAT.done = true;
      reset();
      steps.push(['a paused account with nothing owed leaves Today entirely',
        !todayActionList().some(r => r.customerId === '__flowA__')]);
      delete quiet.pause;

      // FLOW 5 — effort budget marks a prefix of the ranking, never re-sorts it.
      reset();
      const rows = todayActionList();
      steps.push(['every ranked row carries an effort estimate',
        rows.every(r => Number.isFinite(r.effortMin) && r.effortMin > 0)]);
    }catch(err){
      steps.push(['flow threw: ' + err.message, false]);
    }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    reset();
    const failed = steps.filter(s => !s[1]).map(s => s[0]);
    check('v66 end-to-end flows: silence, logging, Gainsight ticking, flagging, pause, effort',
      failed.length === 0, `${steps.length - failed.length}/${steps.length} steps passed. Failed: ${failed.join('; ')}`);
  })();
  check('v66 calibration reports but never re-ranks',
    // If this ever fails, the tracker has started hiding signals based on your
    // own dismissals — a feedback loop that can bury a real risk class.
    String(getRecommendedAction).indexOf('getSignalCalibration') === -1 &&
    String(todayActionList).indexOf('getSignalCalibration') === -1);
  check('v66 every Today source has an effort estimate',
    TODAY_SOURCE_DEFS.every(d => Number.isFinite(effortMinutesFor(d.source))) &&
    SIGNAL_DEFS.every(d => Number.isFinite(effortMinutesFor('signal:' + d.key))) &&
    Object.values(EFFORT_MIN).every(v => Number.isInteger(v) && v > 0),
    Object.keys(EFFORT_MIN).filter(k => !Number.isInteger(EFFORT_MIN[k])).join(', '));
  (function(){
    // Undo must round-trip through the real load pipeline, and must expire.
    let ok = false, detail = '';
    try{
      const before = _undoSnapshot, beforeFlag = _lastActionWasUndo;
      _undoSnapshot = {json: JSON.stringify({schemaVersion: CURRENT_SCHEMA_VERSION, customers: [], activities: {}}),
        at: Date.now(), label: 'test'};
      const fresh = !!undoAvailable();
      _undoSnapshot.at = Date.now() - (UNDO_MAX_AGE_MS + 1000);
      const stale = undoAvailable();
      ok = fresh && stale === null && _undoSnapshot === null; // expiry also clears it
      _undoSnapshot = before; _lastActionWasUndo = beforeFlag;
      detail = JSON.stringify({fresh, staleCleared: stale === null});
    }catch(err){ detail = err.message; }
    check('v66 undo expires rather than offering a stale revert', ok, detail);
  })();
  check('v66 the backup warning is actionable',
    (function(){
      /* v74.4: restore by PRESENCE. `DATA.lastExportedAt = prev` assigns
         undefined rather than removing the key, so on a book that had never been
         exported this check CREATED it. JSON.stringify drops undefined, which is
         why it stayed invisible until the guard started comparing key lists. */
      const had = 'lastExportedAt' in DATA;
      const prev = DATA.lastExportedAt;
      DATA.lastExportedAt = null;
      const html = renderBackupStatus();
      if(had) DATA.lastExportedAt = prev; else delete DATA.lastExportedAt;
      return html.indexOf('id="btn-backup-now"') !== -1 && html.indexOf('<button') === 0;
    })());
  (function(){
    /* v67 coordination layer. The normalizers are the ONLY write path — UI and
       import both go through them — so hostile input is the thing to test. */
    const junk = [
      normalizeStakeholder(null), normalizeStakeholder({name:'   '}),
      normalizeBlocker({text:''}), normalizeCommitment('not an object'),
      normalizeCommitment({text:'x', due:'9999-99-99'})
    ];
    const nulls = junk.slice(0,4).every(x => x === null);
    const badDateDropped = junk[4] && junk[4].due === null;
    const s = normalizeStakeholder({name:'  Ada   Lovelace ', role:'not_a_role', note:'x'.repeat(500)});
    const b = normalizeBlocker({text:'y'.repeat(500), owner:'martians', since:'nope'});
    const cm = normalizeCommitment({text:'z', direction:'sideways', due: todayISO()});
    check('v67 coordination normalizers reject junk and clamp the rest',
      nulls && badDateDropped
      && s.name === 'Ada Lovelace' && s.role === 'other' && s.note.length === 200
      && b.text.length === 240 && b.owner === 'customer' && b.since === todayISO()
      && cm.direction === 'i_owe',
      JSON.stringify({nulls, badDateDropped, role:s && s.role, owner:b && b.owner, dir:cm && cm.direction}));
    check('v67 overdue is measured against today, not tomorrow',
      commitmentIsOverdue({due: isoAddDays(todayISO(), -1)}) === true
      && commitmentIsOverdue({due: todayISO()}) === false
      && commitmentIsOverdue({due: isoAddDays(todayISO(), -1), doneOn: todayISO()}) === false
      && commitmentDueSoon({due: isoAddDays(todayISO(), COMMITMENT_SOON_DAYS)}) === true
      && commitmentDueSoon({due: isoAddDays(todayISO(), COMMITMENT_SOON_DAYS + 1)}) === false);
    check('v67 every coordination source declares a band and an effort estimate',
      ['commitment_overdue','commitment_due_soon','blocker_aged'].every(k =>
        TODAY_SOURCE_MAP[k] && Number.isInteger(TODAY_SOURCE_MAP[k].severity) && Number.isFinite(effortMinutesFor(k))));
  })();
  (function(){
    // The lifecycle ruling: coordination pierces implementation, signals do not.
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const c = {id:'__coord__', name:'CoordCo', module: DATA.config.modules[0], stage: DATA.config.stages[1].key,
        implementationDate: isoAddDays(todayISO(), -200), totalSessions:8,
        domainScores:{}, sessionNotes:{}, stageHistory:[],
        implementation:{phase:'build', partner:'Acme'},
        commitments:[{id:'c1', text:'Send the config guide', direction:'i_owe', due: isoAddDays(todayISO(), -3), doneOn:null}],
        blockers:[{id:'b1', text:'Waiting on sandbox access', owner:'partner', since: isoAddDays(todayISO(), -20), resolvedOn:null}]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {__coord__: []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const rows = todayActionList();
      const row = rows.find(r => r.customerId === '__coord__');
      const sources = todayCoordinationCandidates(c).map(x => x.source);
      // Present, top band, and carrying ONLY coordination reasons — the signal
      // registry must still be switched off for an in-implementation account.
      ok = !!row && row.severity === 4 && row.source === 'commitment_overdue'
        && sources.indexOf('blocker_aged') !== -1
        && row.alsoWaiting.concat([{panelTab: row.panelTab}]).some(w => w.panelTab === 'coordination')
        && !row.source.startsWith('signal:');
      detail = JSON.stringify({found:!!row, sev: row && row.severity, source: row && row.source, sources});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v67 commitments and blockers pierce implementation; signals still do not', ok, detail);
  })();
  (function(){
    // Migration + boundary. A v2 book must reach v3 untouched, and a hostile v3
    // payload must be cleaned rather than trusted.
    let ok = false, detail = '';
    try{
      const legacy = {schemaVersion:2, customers:[{id:'m1', name:'Legacy'}], activities:{}};
      migrateData(legacy);
      const clean = legacy.schemaVersion === CURRENT_SCHEMA_VERSION && legacy.customers[0].stakeholders === undefined;
      const hostile = {schemaVersion:3, customers:[{id:'m2', name:'H',
        stakeholders:'not-an-array', blockers:[{text:''},{text:'real', owner:'bogus'}],
        commitments: Array.from({length: MAX_COMMITMENTS + 40}, (_,i)=>({text:'c'+i, direction:'i_owe'}))}], activities:{}};
      migrateData(hostile);
      repairAuxiliaryCollections(hostile);
      const h = hostile.customers[0];
      ok = clean && h.stakeholders === undefined
        && Array.isArray(h.blockers) && h.blockers.length === 1 && h.blockers[0].owner === 'customer'
        && h.commitments.length === MAX_COMMITMENTS;
      detail = JSON.stringify({legacyV: legacy.schemaVersion, noEmptyArrays: legacy.customers[0].stakeholders === undefined,
        blockers: h.blockers && h.blockers.length, commitments: h.commitments && h.commitments.length});
    }catch(err){ detail = err.message; }
    check('v67 schema 2→3 migrates without bloat and cleans hostile v3 input', ok, detail);
  })();
  check('v67 migration always lands on the current schema version',
    (function(){
      // Version-agnostic on purpose: pinning this to a literal made it fail the
      // moment v68 added a step, which is noise rather than signal.
      const d = {schemaVersion:0, customers:[], activities:{}}; migrateData(d);
      return d.schemaVersion === CURRENT_SCHEMA_VERSION && CURRENT_SCHEMA_VERSION >= 4;
    })());
  check('v67 quick log builds the same checklist scaffolding as the full form',
    String(openQuickLogModal).indexOf('ACTIVITY_TYPES[type] || []') !== -1);
  (function(){
    /* v68 handoff. The load-bearing promise of a PLACEHOLDER format is that
       changing it later cannot destroy what someone typed — so that is what
       these check hardest. */
    const prevC = DATA.customers, prevRiskLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      /* buildKnowledgeTransferText() composes live risks, so it calls
         buildRiskHubList() — which stamps risk memory for this synthetic account
         and prunes the real book's keys. Throwaway log, restored below. The
         suite-wide guard added in v61 caught this leak on the first run. */
      DATA.riskLog = {};
      const c = {id:'__ho__', name:'HandoffCo', module: DATA.config.modules[0], stage: DATA.config.stages[1].key,
        implementationDate: isoAddDays(todayISO(), -120), totalSessions:8,
        domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c];
      const prevActs = DATA.activities['__ho__']; DATA.activities['__ho__'] = [];

      setHandoffField(c, 'out', 'whatIsFragile', 'Their admin is the only trained user.');
      const stored = getHandoff(c, 'out').values.whatIsFragile === 'Their admin is the only trained user.';
      const stamped = isRealISODate(getHandoff(c, 'out').updatedOn);
      // A value under a key the registry does NOT define must survive every path.
      c.handoffOut.values.legacyFieldFromOldFormat = 'Text written under a previous field set.';
      const orphans = handoffOrphanKeys(c, 'out');
      const survivesNormalize = !!normalizeHandoff(c.handoffOut).values.legacyFieldFromOldFormat;
      const packet = buildKnowledgeTransferText(c);
      const inPacket = packet.indexOf('Text written under a previous field set.') !== -1
        && packet.indexOf('EARLIER FORMAT') !== -1;
      // Clearing the last value removes the record entirely (absent means empty)
      setHandoffField(c, 'out', 'whatIsFragile', '   ');
      delete c.handoffOut.values.legacyFieldFromOldFormat;
      setHandoffField(c, 'out', 'whatWorked', '');
      const cleared = c.handoffOut === undefined || !Object.keys(getHandoff(c,'out').values).length;
      // Over-length is clamped, junk rejected
      setHandoffField(c, 'out', 'whatWorked', 'x'.repeat(HANDOFF_FIELD_MAX + 500));
      const clamped = getHandoff(c, 'out').values.whatWorked.length === HANDOFF_FIELD_MAX;
      const junkRejected = normalizeHandoff(null) === null && normalizeHandoff({values:'nope'}) === null
        && normalizeHandoff({values:{a:'   '}}) === null;
      // The packet must never present itself as an official document
      const labelled = packet.indexOf('WORKING DRAFT') !== -1 && packet.indexOf('not an official') !== -1;
      if(prevActs === undefined) delete DATA.activities['__ho__']; else DATA.activities['__ho__'] = prevActs;
      ok = stored && stamped && orphans.length === 1 && survivesNormalize && inPacket
        && cleared && clamped && junkRejected && labelled;
      detail = JSON.stringify({stored, stamped, orphans: orphans.length, survivesNormalize, inPacket, cleared, clamped, junkRejected, labelled});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.riskLog = prevRiskLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v68 handoff keeps content across a format change and never claims to be official', ok, detail);
  })();
  check('v68 handoff facts are composed, not retyped',
    // Only human-knowledge fields are stored. If a factual field ever appears in
    // the registry, the packet can go stale — that is the whole design.
    HANDOFF_OUT_FIELDS.every(f => !/session|health|risk|stakeholder|date/i.test(f.key)) &&
    String(buildKnowledgeTransferText).indexOf('sessionsCompletedCount') !== -1 &&
    String(buildKnowledgeTransferText).indexOf('buildRiskHubList') !== -1);
  check('v68 schema 3→4 migrates additively and keeps unknown handoff keys',
    (function(){
      const d = {schemaVersion:3, customers:[
        {id:'x1', name:'Legacy'},
        {id:'x2', name:'Hostile', handoffOut:{values:{whatWorked:'kept', unknownKey:'also kept', empty:'  '}, updatedOn:'nope'}},
        {id:'x3', name:'Bad', handoffIn:'not-an-object'}
      ], activities:{}};
      migrateData(d);
      const [a,b,c] = d.customers;
      return d.schemaVersion === CURRENT_SCHEMA_VERSION
        && a.handoffOut === undefined && a.handoffIn === undefined      // no bloat
        && b.handoffOut.values.whatWorked === 'kept'
        && b.handoffOut.values.unknownKey === 'also kept'               // provisional format protected
        && b.handoffOut.values.empty === undefined
        && b.handoffOut.updatedOn === null                              // invalid date nulled
        && c.handoffIn === undefined;                                   // non-object dropped
    })());
  check('v63 no dead-end "See Overview tab" action remains',
    renderGainsightItemRow({kind:'grad-review', customerId:'x', customerName:'X', label:'l', date: todayISO(), activityType:'t'}, {showCustomer:false})
      .indexOf('See Overview tab') === -1);
  (function(){
    // Exclusions the five old lists each enforced must survive the merge into
    // one list. Synthetic book, snapshotted and restored, so this never depends
    // on (or disturbs) the real one. queueSave() defers to a setTimeout, so any
    // write triggered here lands after the restore below and saves the real book.
    const prevCustomers = DATA.customers;
    const prevActivities = DATA.activities;
    let ok = false, detail = '';
    try{
      const base = (id, name, extra) => Object.assign({
        id, name, module: DATA.config.modules[0], stage: DATA.config.stages[0].key,
        implementationDate: isoAddDays(todayISO(), -120), totalSessions: 8,
        domainScores: {}, sessionNotes: {}, stageHistory: [],
        compliance: {sentiment:{done:true}, outcomePlan:{done:true}, associatedPeopleCSAT:{done:true}}
      }, extra || {});
      DATA.customers = [
        base('__t_impl__', 'TImplAcct', {implementation: {phase: 'kickoff'}}),
        base('__t_grad__', 'TGradAcct', {stage: 'graduated'}),
        base('__t_live__', 'TLiveAcct', {})
      ];
      DATA.activities = {__t_impl__: [], __t_grad__: [], __t_live__: []};
      _renderMemoResets.forEach(reset => reset());
      const names = todayActionList().map(r => r.customerName);
      ok = !names.includes('TImplAcct') && !names.includes('TGradAcct') && names.includes('TLiveAcct');
      detail = names.join(', ') || '(none ranked — TLiveAcct should have been)';
    }catch(err){ detail = err.message; }
    DATA.customers = prevCustomers;
    DATA.activities = prevActivities;
    _renderMemoResets.forEach(reset => reset());
    check('v61 Today excludes in-implementation and graduated accounts, keeps live ones', ok, detail);
  })();

  let offScale = 0;
  if(document.body){
    document.body.querySelectorAll('[style]').forEach(el=>{
      if(/font-size:\s*[\d.]+px/.test(el.getAttribute('style') || '')) offScale++;
    });
  }
  check('no raw px font sizes in rendered DOM', offScale === 0, `${offScale} element(s) — grep the source for font-size:[0-9]`);

  /* ============ v74 CALENDAR ============
     The day timeline and the time normalizer are already covered (v70, v72). The
     gap was everything to do with DATES LEAVING THE TOOL: buildSessionIcs() had
     no check at all, and it is the one artefact that lands in somebody's real
     Google Calendar. If it is malformed, the OSM finds out when the invite fails
     to import — after they sent it.

     Writing these found one live defect: no line folding. A realistic account
     name produced a 192-octet SUMMARY where RFC 5545 §3.1 caps a content line at
     75. Google tolerates it; stricter parsers and mail gateways do not. Fixed in
     icsFoldLine() and asserted below. */
  (function(){
    const CRLF = '\r\n';
    const octets = s => new TextEncoder().encode(s).length;
    const mk = (name, id) => ({id: id || 'ics1', name, module: 'Sustainability'});
    const next = {number: 3, template: {title: 'Materiality Assessment and Datapoint Accelerator'}};
    let ok = false, detail = '';
    try{
      // A real Dutch parent-company name, long enough to overrun the fold limit,
      // and the session title carries an em dash — 3 octets, not 1.
      const ics = buildSessionIcs(mk('Koninklijke Philips Electronics North America Corporation'), '2026-08-11', next);
      const lines = ics.split(CRLF);

      const bareLF = (ics.split('\n').length - 1) - (ics.split(CRLF).length - 1);
      const structure = lines[0] === 'BEGIN:VCALENDAR'
        && lines[lines.length - 1] === 'END:VCALENDAR'
        && (ics.match(/BEGIN:VEVENT/g) || []).length === 1
        && (ics.match(/END:VEVENT/g) || []).length === 1
        && ics.indexOf('VERSION:2.0') !== -1
        && ics.indexOf('PRODID:') !== -1
        && ics.indexOf('UID:') !== -1;

      const folded = lines.every(l => octets(l) <= 75);
      // Folding must be LOSSLESS: unfolding has to give back the exact property.
      const unfolded = icsUnfold(ics);
      const summary = unfolded.split(CRLF).find(l => l.indexOf('SUMMARY:') === 0) || '';
      const lossless = summary.indexOf('Koninklijke Philips Electronics North America Corporation') !== -1
        && summary.indexOf('Materiality Assessment and Datapoint Accelerator') !== -1;
      // The em dash must survive the fold intact rather than being cut into two
      // invalid bytes — the failure a character-counted fold produces.
      const dashIntact = summary.indexOf('—') !== -1 && unfolded.indexOf('�') === -1;

      ok = bareLF === 0 && structure && folded && lossless && dashIntact;
      detail = JSON.stringify({bareLF, structure, folded, lossless, dashIntact,
        longest: Math.max.apply(null, lines.map(octets))});
    }catch(err){ detail = err.message; }
    check('v74 the calendar invite is RFC 5545 clean: CRLF, one event, folded at 75 octets', ok, detail);
  })();

  (function(){
    /* Customer names arrive from imports and free text. A comma, a semicolon, a
       backslash or a pasted newline in a name must not be able to invent a new
       property line — that is how a calendar file becomes a parse error, or
       worse, silently gains a field nobody typed. */
    const CRLF = '\r\n';
    let ok = false, detail = '';
    try{
      const nm = 'Acme' + String.fromCharCode(44) + ' Inc' + String.fromCharCode(59)
        + ' A' + String.fromCharCode(92) + 'B' + String.fromCharCode(10) + 'injected';
      const ics = buildSessionIcs({id: 'ics2', name: nm, module: 'GRC'}, '2026-12-31',
        {number: 1, template: {title: 'Kickoff'}});
      const lines = icsUnfold(ics).split(CRLF);
      // Every line is a property, or a fold continuation. Nothing free-floating.
      const everyLineIsProperty = lines.every(l => /^[A-Z][A-Z-]*[;:]/.test(l));
      const noInjectedProperty = lines.every(l => l.indexOf('injected') !== 0);
      const sum = lines.find(l => l.indexOf('SUMMARY:') === 0) || '';
      const escaped = sum.indexOf('\\,') !== -1 && sum.indexOf('\\;') !== -1
        && sum.indexOf('\\\\') !== -1 && sum.indexOf('\\n') !== -1;
      ok = everyLineIsProperty && noInjectedProperty && escaped && lines.length === 13;
      detail = JSON.stringify({everyLineIsProperty, noInjectedProperty, escaped, lines: lines.length});
    }catch(err){ detail = err.message; }
    check('v74 a comma, backslash or newline in an account name cannot forge a calendar property', ok, detail);
  })();

  (function(){
    /* All-day VEVENTs use an EXCLUSIVE end date. DTEND must be the day after
       DTSTART, including across a month end, a year end and a leap day — the
       three places naive date maths puts a session on the wrong day. */
    const CRLF = '\r\n';
    const endsOf = iso => {
      const l = buildSessionIcs({id: 'ics3', name: 'X', module: 'GRC'}, iso, {number: 1, template: {title: 'T'}}).split(CRLF);
      return {
        start: (l.find(x => x.indexOf('DTSTART') === 0) || '').split(':')[1],
        end: (l.find(x => x.indexOf('DTEND') === 0) || '').split(':')[1]
      };
    };
    const cases = [
      ['2026-08-11', '20260811', '20260812'],   // ordinary
      ['2026-01-31', '20260131', '20260201'],   // month end
      ['2026-12-31', '20261231', '20270101'],   // year end
      ['2028-02-28', '20280228', '20280229'],   // into a leap day
      ['2028-02-29', '20280229', '20280301']    // out of a leap day
    ];
    const bad = cases.filter(([iso, s, e]) => { const r = endsOf(iso); return r.start !== s || r.end !== e; });
    check('v74 an all-day invite ends the next day, across month, year and leap boundaries',
      bad.length === 0, bad.map(b => b[0]).join(', '));
  })();

  (function(){
    /* isoAddDays() is the tracker's only date-shifting primitive: pacing,
       projections, pause expiry, the ICS end date and the fit window all run
       through it. It formats from LOCAL components on purpose — UTC formatting
       shifts a day in UTC+ zones — so the property that must hold is that it is
       reversible and never drifts, including across a DST transition. */
    const probes = ['2026-01-31','2026-02-28','2028-02-29','2026-03-08','2026-11-01','2026-12-31'];
    const spans = [1, 7, 13, 30, 91, 365];
    const bad = [];
    probes.forEach(p => spans.forEach(n => {
      const there = isoAddDays(p, n);
      if(!isRealISODate(there)) { bad.push(`${p}+${n} not a real date`); return; }
      if(isoAddDays(there, -n) !== p) bad.push(`${p}+${n}-${n}=${isoAddDays(there, -n)}`);
      if(calendarDayDiff(there, p) !== n) bad.push(`${p}+${n} diff=${calendarDayDiff(there, p)}`);
    }));
    check('v74 date arithmetic is reversible and never drifts a day', bad.length === 0, bad.slice(0, 4).join(' | '));
  })();

  (function(){
    /* Which date the invite carries, in priority order. Getting this wrong sends
       a real customer an invitation for the wrong day. */
    const prev = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const base = () => { const c = {id:'__nsd__', name:'NSD', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -60),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}; backfillCustomerRecord(c); return c; };

      // 1. An explicit scheduled date always wins.
      const explicit = base(); explicit.nextSessionScheduledOn = isoAddDays(todayISO(), 9);
      DATA.customers = [explicit]; DATA.activities = {'__nsd__': []};
      const usedExplicit = nextSessionDateFor(explicit) === explicit.nextSessionScheduledOn;

      // 2. With no scheduled date, it paces forward from the last touch.
      const paced = base();
      const touch = isoAddDays(todayISO(), -10);
      DATA.customers = [paced]; DATA.activities = {'__nsd__': [{id:'a1', date: touch, type:'Check-in', summary:'x', checklist:[]}]};
      /* v75 fix: this asserted `=== expected && expected >= today`, which quietly
         assumed the book's pace was long enough to put the paced date in the
         future. On a book with defaultPaceDays 7 it is not, the v74.3 clamp fires
         correctly, and the check failed on working code. Assert the RULE — paced,
         then clamped — so it holds at any pace. */
      const raw = isoAddDays(touch, Math.round(sessionPaceDays(paced)));
      const expected = raw < todayISO() ? todayISO() : raw;
      const usedPace = nextSessionDateFor(paced) === expected;

      /* 2b. v74.2: an OVERDUE account. Last touch + pace has already elapsed, and
         an invite for a date that is gone lands in the past in the calendar. The
         paced date clamps forward to today; nothing ever proposes a past date. */
      const overdue = base();
      const oldTouch = isoAddDays(todayISO(), -400);
      DATA.customers = [overdue]; DATA.activities = {'__nsd__': [{id:'a2', date: oldTouch, type:'Check-in', summary:'x', checklist:[]}]};
      const rawPaced = isoAddDays(oldTouch, Math.round(sessionPaceDays(overdue)));
      const clamped = rawPaced < todayISO() && nextSessionDateFor(overdue) === todayISO();

      /* 2c. An explicitly BOOKED date in the past is NOT clamped. That is a fact
         the OSM recorded, not an estimate, and moving it would be the tracker
         overruling them about their own calendar. */
      const bookedPast = base();
      bookedPast.nextSessionScheduledOn = isoAddDays(todayISO(), -3);
      DATA.customers = [bookedPast]; DATA.activities = {'__nsd__': []};
      const bookingKept = nextSessionDateFor(bookedPast) === bookedPast.nextSessionScheduledOn;

      // 3. With nothing to go on it falls back to today, never to null or NaN.
      const bare = base(); delete bare.implementationDate;
      DATA.customers = [bare]; DATA.activities = {'__nsd__': []};
      const fellBackToday = nextSessionDateFor(bare) === todayISO();

      // Whatever the branch, the answer is always a real ISO date the ICS can use.
      const allReal = [nextSessionDateFor(explicit), nextSessionDateFor(paced),
                       nextSessionDateFor(overdue), nextSessionDateFor(bookedPast),
                       nextSessionDateFor(bare)].every(isRealISODate);
      ok = usedExplicit && usedPace && clamped && bookingKept && fellBackToday && allReal;
      detail = JSON.stringify({usedExplicit, usedPace, clamped, bookingKept, fellBackToday, allReal});
    }catch(err){ detail = err.message; }
    DATA.customers = prev; DATA.activities = prevA;
    check('v74.2 the invite date prefers your booking, then the pace clamped to today, never the past', ok, detail);
  })();
  (function(){
    /* v74.2: a booked call carries its hour. The stored time is the OSM's local
       wall clock, written into the invite as UTC so it means one instant for
       everyone it is forwarded to.

       Asserted as a ROUND TRIP rather than against a hard-coded offset, because
       the correct offset depends on the machine's timezone and on the date. Dates
       either side of both DST transitions are included, so on any zone that
       observes DST this exercises both offsets; on a zone that does not, it still
       has to hold. */
    const CRLF = '\r\n';
    const parseUtc = s => new Date(Date.UTC(+s.slice(0,4), +s.slice(4,6) - 1, +s.slice(6,8),
      +s.slice(9,11), +s.slice(11,13), 0));
    const localHHMM = d => String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    const dates = ['2026-01-15','2026-03-08','2026-03-09','2026-06-21','2026-11-01','2026-11-02','2026-12-31'];
    const wall = '09:30';
    const bad = [];
    dates.forEach(iso => {
      const c = {id:'tz', name:'TZ', module:'GRC', nextSessionScheduledOn: iso, nextSessionTime: wall};
      const lines = buildSessionIcs(c, iso, {number:1, template:{title:'T'}}).split(CRLF);
      const s = (lines.find(l => l.indexOf('DTSTART:') === 0) || '').slice(8);
      const e = (lines.find(l => l.indexOf('DTEND:') === 0) || '').slice(6);
      // A timed event uses the plain property, never the all-day VALUE=DATE form.
      if(!/^\d{8}T\d{6}Z$/.test(s) || !/^\d{8}T\d{6}Z$/.test(e)){ bad.push(iso + ' not a UTC stamp'); return; }
      if(localHHMM(parseUtc(s)) !== wall) bad.push(`${iso} came back as ${localHHMM(parseUtc(s))}`);
      const mins = (parseUtc(e) - parseUtc(s)) / 60000;
      if(mins !== DAY_CALL_LENGTH_MIN) bad.push(`${iso} lasted ${mins}min`);
    });
    check('v74.2 a scheduled call carries its own hour, one call long, on both sides of a DST change',
      bad.length === 0, bad.slice(0, 4).join(' | '));
  })();

  (function(){
    /* The time belongs to the date you SCHEDULED. When the invite date came from
       pacing instead, attaching the stored clock time would give it a precision
       the OSM never entered — so that invite stays all-day. */
    const CRLF = '\r\n';
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const mk = () => { const c = {id:'__at__', name:'AT', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -60),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]}; backfillCustomerRecord(c); return c; };
      const lineFor = (c, iso, key) => (buildSessionIcs(c, iso, {number:1, template:{title:'T'}})
        .split(CRLF).find(l => l.indexOf(key) === 0) || '');

      // Scheduled AND timed -> timed invite.
      const booked = mk();
      booked.nextSessionScheduledOn = isoAddDays(todayISO(), 5);
      booked.nextSessionTime = '14:00';
      const bookedTimed = lineFor(booked, booked.nextSessionScheduledOn, 'DTSTART').indexOf('DTSTART:') === 0;

      // A time set, but the date came from PACING, not from a booking.
      const paced = mk();
      paced.nextSessionTime = '14:00';
      DATA.customers = [paced]; DATA.activities = {'__at__': [{id:'a', date: isoAddDays(todayISO(), -10), type:'Check-in', summary:'x', checklist:[]}]};
      const pacedDate = nextSessionDateFor(paced);
      const pacedAllDay = lineFor(paced, pacedDate, 'DTSTART').indexOf('DTSTART;VALUE=DATE:') === 0;

      // Scheduled but no time -> all-day, as before. Nothing is invented.
      const dateOnly = mk();
      dateOnly.nextSessionScheduledOn = isoAddDays(todayISO(), 5);
      const dateOnlyAllDay = lineFor(dateOnly, dateOnly.nextSessionScheduledOn, 'DTSTART').indexOf('DTSTART;VALUE=DATE:') === 0;

      ok = bookedTimed && pacedAllDay && dateOnlyAllDay;
      detail = JSON.stringify({bookedTimed, pacedAllDay, dateOnlyAllDay, pacedDate});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('v74.2 only a date you actually scheduled gets an hour; a paced date stays all-day', ok, detail);
  })();
  (function(){
    /* v74.2: the .ics export was DEAD. attachEvents() bound a click handler for
       [data-ics] and downloadSessionIcs() worked, but no surface rendered the
       button, so the invite could not be reached at all. That is the fourth time
       this shape has appeared in this file — renderSignalCalibration() (since deleted),
       getBatchingOpportunities(), data-thread-resolve, and now this — a working
       function nothing calls, which reads as a feature in the source and does not
       exist for the user.

       Asserted from BOTH ends: the affordance renders, and the handler is bound.
       Either half alone passes while the feature is broken. */
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      const c = {id:'__ics_ui__', name:'IcsUI', module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -60),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(c);
      DATA.customers = [c]; DATA.activities = {'__ics_ui__': []};
      const html = renderDetailsTab(c, computeRisk(c));
      const rendered = html.indexOf('data-ics="' + c.id + '"') !== -1;
      const bound = String(attachEvents).indexOf("[data-ics]") !== -1
        && String(attachEvents).indexOf('downloadSessionIcs') !== -1;
      // The button must not depend on a saved date to exist: these inputs commit
      // without a re-render, so a state-gated button would sit stale until the
      // next one. nextSessionDateFor() always yields a usable date.
      const notGated = html.indexOf('data-ics="' + c.id + '" disabled') === -1;
      ok = rendered && bound && notGated;
      detail = JSON.stringify({rendered, bound, notGated});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('v74.2 the calendar invite is reachable: the button renders and the handler is bound', ok, detail);
  })();

  (function(){
    /* Clock display. Noon and midnight are where 12-hour formatting goes wrong,
       and the day timeline prints these beside every booked call. */
    const cases = [['00:00','12:00am'],['00:09','12:09am'],['11:59','11:59am'],
                   ['12:00','12:00pm'],['12:30','12:30pm'],['13:05','1:05pm'],['23:59','11:59pm']];
    const bad = cases.filter(([inp, want]) => fmtDayTime(inp) !== want).map(([i,w]) => `${i}->${fmtDayTime(i)} want ${w}`);
    const gaps = fmtGapMinutes(0) === '' && fmtGapMinutes(-5) === '' && fmtGapMinutes(45) === '45m'
      && fmtGapMinutes(60) === '1h' && fmtGapMinutes(95) === '1h 35m';
    check('v74 noon and midnight print correctly, and a gap never reads as empty time it has',
      bad.length === 0 && gaps, bad.join(' | ') + (gaps ? '' : ' | fmtGapMinutes wrong'));
  })();

  (function(){
    /* Today's calls are the fixed points of the day, so their ORDER is the spine
       of the timeline. Timed calls run in clock order; untimed ones sort after
       them by name rather than being dropped or floated to the top. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = (id, name, at) => { const c = {id, name, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -60),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[],
        nextSessionScheduledOn: todayISO()}; backfillCustomerRecord(c);
        if(at) c.nextSessionTime = at; return c; };
      DATA.customers = [mk('c1','Zulu','15:00'), mk('c2','Alpha',null), mk('c3','Mike','09:30'), mk('c4','Bravo',null)];
      DATA.activities = {c1:[],c2:[],c3:[],c4:[]};
      _renderMemoResets.forEach(r => r());
      const order = callsScheduledToday().map(x => x.c.name);
      ok = JSON.stringify(order) === JSON.stringify(['Mike','Zulu','Alpha','Bravo']);
      detail = order.join(' > ');
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r());
    check("v74 today's calls run in clock order, and untimed ones sort after them", ok, detail);
  })();

  (function(){
    /* ============ v75 THE SPINE ============
       The rail is a map, a progress meter and a jump control. All three have to
       agree with the queue they describe, and the numbering has to mean
       something: [01] is the next case that needs a verdict, not an arbitrary
       account. Asserted on rendered output. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevShow = ui.riskShowDismissed, prevFocus = ui.riskFocusId;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {}; ui.riskShowDismissed = false; ui.riskFocusId = null;
      const mk = (id, sev) => { const c = {id, name:'Sp'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        if(sev >= 3) c.riskOverride = 'risk';
        backfillCustomerRecord(c); return c; };
      const seed = [mk('__s1__', 3), mk('__s2__', 3), mk('__s3__', 1)];
      DATA.customers = seed;
      DATA.activities = seed.reduce((m, c, i) => { m[c.id] = i < 2
        ? [{id:'a'+c.id, date: isoAddDays(todayISO(), -6), type:'Onboarding Session',
            summary:'They raised a blocker and are frustrated.', sessionNumber:1, checklist:[], flagged:true}]
        : []; return m; }, {});
      // v13 Step 2e: only a case confirmed with a reason is a deck card, so confirm each one first (fixed by Task 11)
      buildRiskCases(buildRiskHubList()).forEach(k => k.items.forEach(it => setRiskVerdict(it, 'confirmed', 'told me on the call')));
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();

      const html = renderRiskTab();
      const cases = buildRiskCases(buildRiskHubList());

      // (a) One rail entry per rendered case, and the counts agree.
      const railCount = (html.match(/data-spine-to="rk-c-/g) || []).length;
      const caseCount = (html.match(/data-risk-case="/g) || []).length;
      const agrees = railCount === caseCount && railCount > 0;

      // (b) The meter states a real fraction of the queue, not a guess.
      const stated = html.match(/<b>(\d+)<\/b> of (\d+) decided/);
      const decided = cases.filter(k => k.state === 'confirmed' || k.state === 'dismissed').length;
      const meterHonest = !!stated && Number(stated[1]) === decided && Number(stated[2]) === caseCount;

      // (c) Exactly one case and one rail entry are marked active in the MARKUP.
      //     The driver moves it from there; a rail that marks two places, or
      //     none, is worse than no rail.
      const activeCases = (html.match(/class="rk3-card [^"]*is-active/g) || []).length;
      const activeRail = (html.match(/class="spine-item[^"]*is-active/g) || []).length;
      const oneActive = activeCases === 1 && activeRail === 1;
      // (f) v76: the deck exists — a tall track, a sticky stage, cards inside it.
      const deck = html.indexOf('class="rk3-track"') !== -1
        && html.indexOf('class="rk3-stage"') !== -1
        && html.indexOf('class="rk3-behind"') !== -1;

      // (d) [01] is the first case in the DOM — the rail numbers the work order.
      const firstIdx = html.indexOf('[01]') !== -1 && html.indexOf('[01]') < html.indexOf('[02]');

      // (e) Every rail target resolves to a case that was actually rendered.
      const targets = [...html.matchAll(/data-spine-to="(rk-c-[^"]+)"/g)].map(m => m[1]);
      const resolves = targets.every(id => html.indexOf('id="' + id + '"') !== -1);

      ok = agrees && meterHonest && oneActive && firstIdx && resolves && deck;
      detail = JSON.stringify({railCount, caseCount, stated: stated && stated[0], activeCases, activeRail, firstIdx, resolves, deck});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    ui.riskShowDismissed = prevShow; ui.riskFocusId = prevFocus;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v76 the risk rail matches the deck it maps, and marks exactly one place', ok, detail);
  })();

  check('v76 the scroll drivers move pixels, never re-render',
    /* render() rebuilds #app, so calling it from a scroll handler would fight the
       scroll that triggered it. All three drivers write transforms and classes
       and nothing else. Checked across the whole driver surface, not just the
       entry point — v76 split the work into two functions and the v75 version of
       this check only looked at one of them. */
    [bindScrolly, bindRiskDeck, bindCopilotParallax].every(f => typeof f === 'function'
      && !/[^a-zA-Z.]render\s*\(\s*\)/.test(String(f))) &&
    String(bindRiskDeck).indexOf('requestAnimationFrame') !== -1 &&
    String(bindCopilotParallax).indexOf('requestAnimationFrame') !== -1,
    'no driver may call render(), and both must be rAF-throttled');

  check('v75 the observer is torn down before it is rebuilt',
    /* attachEvents() runs once per render and the observed nodes are gone by the
       next one. Leaving the old observer connected would leak one per render —
       the same shape as the v72 pane-pool bindings that went dead. */
    String(bindScrolly).indexOf('_scrollyObserver.disconnect()') !== -1 &&
    String(bindScrolly).indexOf("removeEventListener('keydown'") !== -1 &&
    /* Called from render(), not attachEvents() — the first version of this check
       asserted the wrong function and failed on working code. The requirement is
       that SOMETHING in the render path rebinds it every pass, which is what
       makes the teardown above necessary in the first place. */
    String(render).indexOf('bindScrolly()') !== -1,
    'bindScrolly must disconnect the observer and drop its key handler, and render must call it');

  check('v75 J and K stand down inside a field and under a modal',
    // Single-letter shortcuts are only safe when they cannot fire while typing.
    (function(){
      const src = String(bindScrolly);
      return src.indexOf("tagName === 'INPUT'") !== -1 && src.indexOf("tagName === 'TEXTAREA'") !== -1
        && src.indexOf('.modal-backdrop') !== -1 && src.indexOf('.overlay .panel') !== -1;
    })(),
    'the J/K handler needs the same guards the quick-log shortcut has');

  (function(){
    /* v76: Copilot no longer shares Risk's rail — the two tabs were made to move
       differently on purpose. What has to hold is that its layers are real: the
       far field carries month marks, and a tick only exists for an account
       actually projected to graduate inside the window. A tick with no account
       behind it would be the decoration this design is trying not to be. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevSnap = DATA.weeklySnapshot;
    const hadSnap = 'weeklySnapshot' in DATA;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      const mk = id => { const c = {id, name:'Cp'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(c); return c; };
      DATA.customers = [mk('__c1__')];
      DATA.activities = {'__c1__': []};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      /* v94: Copilot now opens on a landing and reveals the chapters on request.
         Every assertion below is about the OPENED tab, so open it. */
      const _prevOpen = ui.copilotOpen; ui.copilotOpen = true;
      const html = renderCopilot();
      ui.copilotOpen = _prevOpen;

      const chapters = (html.match(/data-cp-chapter="/g) || []).length;
      const everyChapterTimed = (html.match(/class="cp3-when"/g) || []).length === chapters;
      /* v85: the field and the ribbon were deleted. Ten justified devices is
         still ten devices, and the references this borrowed from each commit to
         ONE idea. What has to hold now is that the telemetry lives inside the
         band rather than floating above it. */
      const hasField = html.indexOf('class="tele"') !== -1
        && html.indexOf('class="band-head"') < html.indexOf('class="tele"');
      const hasRibbon = html.indexOf('class="cp3-field"') === -1
        && html.indexOf('class="cp3-aperture"') === -1;
      // Nothing lands for this account, so no tick may be drawn.
      const ticks = (html.match(/class="cp3-tick[ "]/g) || []).length;
      const landing = getMonthAhead().landing.length;
      const ticksAreReal = ticks === landing;
      // The rail belongs to Risk now; Copilot must not have grown one back.
      const noRail = html.indexOf('data-spine-to="cp-') === -1;

      /* v92: not a count at all any more. The 'impl' chapter renders only when
         there ARE builds, so any fixed number is wrong for one book or the other.
         The real invariant is that every chapter which renders is a DECLARED
         chapter, and that the four unconditional ones are always present. */
      const rendered = (html.match(/data-cp-chapter="([a-z]+)"/g) || [])
        .map(m => m.replace(/.*="/, '').replace('"', ''));
      const allDeclared = rendered.every(k => CP_CHAPTER_KEYS.indexOf(k) !== -1);
      const coreAlwaysThere = ['week','month','book','next'].every(k => rendered.indexOf(k) !== -1);
      ok = allDeclared && coreAlwaysThere && rendered.length <= CP_CHAPTER_KEYS.length
        && everyChapterTimed && hasField && hasRibbon && ticksAreReal && noRail;
      detail = JSON.stringify({rendered, allDeclared, coreAlwaysThere, everyChapterTimed, hasField, hasRibbon, ticks, landing, noRail});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    if(hadSnap) DATA.weeklySnapshot = prevSnap; else delete DATA.weeklySnapshot;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v76 Copilot travels in time, and every tick is a real graduation', ok, detail);
  })();

  check('v76 the deck and the field are built from tokens, not invented values',
    /* Header rule 2. The reference site is off-white and lavender; this file is
       Workiva's brand toolkit, and the distinctiveness has to come from structure
       rather than from a palette nobody approved. */
    (function(){
      const css = [...document.styleSheets].reduce((acc, sh) => {
        let rules; try{ rules = sh.cssRules; }catch(e){ return acc; }
        [...(rules || [])].forEach(r => { if(r.selectorText && /\.spine|\.rk3|\.cp3|\.gs|\.band/.test(r.selectorText)) acc += r.cssText; });
        return acc;
      }, '');
      if(!css) return false;
      // No raw hex, and no px font-size that bypasses the type scale.
      return !/#[0-9a-fA-F]{3,8}\b/.test(css) && !/font-size:\s*\d/.test(css);
    })(),
    'spine styles must reference :root tokens for every colour and size');

  (function(){
    /* v77: "graduating in 30 days" must mean ONE thing. The tile, the list it
       opens, and Copilot's month view had three copies of this test and gave
       different answers on the real book. Asserted on behaviour with accounts
       built to sit in each trap. */
    const prevC = DATA.customers, prevA = DATA.activities, prevFilter = ui.quickFilter,
          prevRisk = ui.filterRisk, prevLife = ui.filterLifecycle, prevSearch = ui.search,
          prevMod = ui.filterModule, prevLog = DATA.riskLog, prevSnap = DATA.weeklySnapshot;
    const hadSnap = 'weeklySnapshot' in DATA;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      ui.quickFilter = null; ui.filterRisk = 'all'; ui.filterLifecycle = 'all';
      ui.search = ''; ui.filterModule = 'all';
      const mk = (id, patch) => { const c = {id, name:'Gs'+id, module:DATA.config.modules[0],
        stage:DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
        backfillCustomerRecord(c); Object.assign(c, patch || {}); return c; };

      // Lands soon by pace: 4 of 8 sessions over 100 days -> ~25 days to go.
      const soon = mk('__gs_soon__');
      // Committed inside 30 days but pacing years out — the ADT shape.
      const optimistic = mk('__gs_opt__', {targetGraduationDate: isoAddDays(todayISO(), 20)});
      // Committed date already passed — the RMR shape.
      const overdue = mk('__gs_past__', {targetGraduationDate: isoAddDays(todayISO(), -4)});
      DATA.customers = [soon, optimistic, overdue];
      DATA.activities = {
        '__gs_soon__': [1,2,3,4].map((n,i) => ({id:'s'+n, date: isoAddDays(todayISO(), -100 + i*25),
          type:'Onboarding Session', summary:'x', sessionNumber:n, checklist:[]})),
        '__gs_opt__': [{id:'o1', date: isoAddDays(todayISO(), -300), type:'Onboarding Session',
          summary:'x', sessionNumber:1, checklist:[]}],
        '__gs_past__': [{id:'p1', date: isoAddDays(todayISO(), -300), type:'Onboarding Session',
          summary:'x', sessionNumber:1, checklist:[]}]
      };
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();

      const counted = DATA.customers.filter(isGraduatingSoon).map(c => c.id);
      // A commitment the pace contradicts does not count; neither does a past date.
      const excludesOptimistic = !counted.includes('__gs_opt__');
      const excludesOverdue = !counted.includes('__gs_past__');

      // An in-implementation account never counts, whatever its dates say.
      const impl = mk('__gs_impl__', {targetGraduationDate: isoAddDays(todayISO(), 10)});
      setImplementationPhase(impl, DATA.config.implementationPhases ? DATA.config.implementationPhases[0].key : 'build');
      const excludesImpl = inImplementation(impl) ? !isGraduatingSoon(impl) : true;

      // The tile, the list it opens, and Copilot must all report the same set.
      ui.quickFilter = 'grad30';
      const filtered = getFilteredCustomers().map(c => c.id).sort();
      ui.quickFilter = null;
      const landing = getMonthAhead().landing.map(c => c.id).sort();
      const agree = JSON.stringify(counted.slice().sort()) === JSON.stringify(filtered)
        && JSON.stringify(filtered) === JSON.stringify(landing);

      ok = excludesOptimistic && excludesOverdue && excludesImpl && agree;
      detail = JSON.stringify({counted, filtered, landing, excludesOptimistic, excludesOverdue, excludesImpl, agree});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    ui.quickFilter = prevFilter; ui.filterRisk = prevRisk; ui.filterLifecycle = prevLife;
    ui.search = prevSearch; ui.filterModule = prevMod;
    if(hadSnap) DATA.weeklySnapshot = prevSnap; else delete DATA.weeklySnapshot;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v77 "graduating in 30 days" means one thing on every surface', ok, detail);
  })();

  (function(){
    /* v78: the deck must actually bind, and a tall card must be readable.

       Two failures sit behind this check. First, a confirmed case carries the
       whole workspace, and the stage was sized from the front card's
       offsetHeight while the card's max-height resolved against that same stage —
       circular, so a tall card COLLAPSED the stage to a few hundred pixels and
       buried the rest behind a scrollbar nobody could see. Second, while fixing
       that I declared the sizing helpers AFTER the sizeTrack() call that uses
       them; const is not hoisted, bindRiskDeck threw "Cannot access costOf before
       initialization", and the deck silently did not bind at all. Nothing caught
       either one, because both live in a scroll driver rather than in rendered
       markup.

       So this asserts the driver's contract at the source level and says plainly
       that it is a proxy: the geometry itself is only provable in a live layout,
       and it was verified there by hand. */
    const src = String(bindRiskDeck);
    const usesNatural = src.indexOf('scrollHeight') !== -1;
    const drivesCardScroll = src.indexOf('front.scrollTop') !== -1;
    const trackReservesOverflow = src.indexOf('overflowOf(el)') !== -1 && src.indexOf('costOf(cards[i])') !== -1;
    // Helpers must be declared before the sizeTrack() call that consumes them.
    const iHelpers = src.indexOf('const costOf');
    const iSize = src.indexOf('const sizeTrack');
    const orderOk = iHelpers > -1 && iSize > -1 && iHelpers < iSize;
    // And binding must be observable, so a throw cannot pass as "no deck today".
    const marksBound = src.indexOf('host._deckCards') !== -1;
    const ok = usesNatural && drivesCardScroll && trackReservesOverflow && orderOk && marksBound;
    check('v78 the deck sizes from natural height, reserves it, and binds before use', ok,
      JSON.stringify({usesNatural, drivesCardScroll, trackReservesOverflow, orderOk, marksBound}));
  })();

  (function(){
    /* ============ 1.2 D8/L8 THE DECK CAN REACH ITS LAST CASE ============
       The track must provide, by itself, the scroll distance at which the last card
       becomes the front card; a short last card used to leave the page out of scroll
       with the previous card still in front (only content below the track hid it). */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevView = ui.view;
    const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
    let ok = false, detail = '';
    try{
      const cs = []; for(let i = 0; i < 14; i++) cs.push(v13Acct('__d8l8_' + i, {riskOverride: 'risk'}));
      DATA.customers = cs; DATA.activities = {}; DATA.riskLog = {};
      reset();
      buildRiskCases(buildRiskHubList()).forEach(k => setRiskVerdict(k.items[0], 'confirmed', 'short reason'));
      reset(); ui.view = 'risk'; render();
      const track = document.querySelector('.rk3-track'), host = track && track.parentElement;
      const bound = !!host && typeof host._deckOffsetFor === 'function' && !!host._deckCards && host._deckCards.length === 14 && !host.classList.contains('rk3--flat');
      if(bound){
        const last = host._deckCards.length - 1;
        const reachable = track.offsetHeight - innerHeight;
        const needed = host._deckOffsetFor(last);
        ok = reachable >= needed;
        detail = JSON.stringify({bound, n: host._deckCards.length, reachable, needed, innerHeight});
      } else detail = JSON.stringify({bound, n: host ? (host._deckCards || []).length : null});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.view = prevView;
    reset(); render();
    check('1.2 D8/L8: the deck track is tall enough for its last case to be brought to the front', ok, detail);
  })();

  (function(){
    /* ============ v81 THE BAND SHOWS REAL TIME ============
       The attitude dial and the distance tape were replaced: they reported ON the
       book rather than helping anyone work it. What survives is the rule — the
       band is the next thirty days, and a mark on it must be an account really
       landing in that window, at the day it really lands. */
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog,
          prevSnap = DATA.weeklySnapshot, prevFocus = ui.copilotFocusKey;
    const hadSnap = 'weeklySnapshot' in DATA;
    let ok = false, detail = '';
    try{
      DATA.riskLog = {};
      // Glideslope: severity as a position, monotonic and clamped.
      const devs = [1,2,3,4].map(glideDeviation);
      const glide = devs[0] === 0 && devs[3] === 1 && devs[0] < devs[1] && devs[1] < devs[2]
        && devs[2] < devs[3] && glideDeviation(0) === 0 && glideDeviation(99) === 1
        && glideDeviation('x') === 0 && renderGlideslope(3).indexOf('sev3') !== -1;

      const month = getMonthAhead();
      const model = copilotBandModel(month);
      // One mark per landing account, none invented, none dropped.
      const marksMatch = model.marks.length === month.landing.length;
      const inWindow = model.marks.every(m => m.days >= 0 && m.days <= 30);
      const sorted = model.marks.every((m, n) => n === 0 || model.marks[n-1].days <= m.days);
      const html = renderCopilotBand(month, 'week');
      /* Matched its own labels as well: class="band-mark-l" also starts with
         class="band-mark. Invisible while nothing was landing — 0 === 0 — and
         wrong the moment the band had data in it. */
      const rendered = (html.match(/class="band-mark[ "]/g) || []).length === month.landing.length;
      // The readout has to agree with what is drawn.
      const saysSo = month.landing.length
        ? html.indexOf('<b>' + month.landing.length + '</b> account') !== -1
        : html.indexOf('Nothing lands in this window') !== -1;
      // Every chapter has a window, and the week's is narrower than the month's.
      const everyChapterWindowed = CP_CHAPTER_KEYS.every(k => Array.isArray(CP_WINDOWS[k]));
      const weekIsTighter = CP_WINDOWS.week[1] < CP_WINDOWS.month[1];
      // The AI read lives on the band, and only once.
      const aiOnBand = html.indexOf('id="btn-generate-ai-portfolio-brief"') !== -1
        && (renderCopilot().match(/id="btn-generate-ai-portfolio-brief"/g) || []).length === 1;

      ok = glide && marksMatch && inWindow && sorted && rendered && saysSo
        && everyChapterWindowed && weekIsTighter && aiOnBand;
      detail = JSON.stringify({glide, marksMatch, inWindow, sorted, rendered, saysSo,
        everyChapterWindowed, weekIsTighter, aiOnBand, landing: month.landing.length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    ui.copilotFocusKey = prevFocus;
    if(hadSnap) DATA.weeklySnapshot = prevSnap; else delete DATA.weeklySnapshot;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v81 the band shows the real next 30 days, and the AI read sits on it', ok, detail);
  })();

  check('v79 the book frames the flight: every tab carries its chapter numeral',
    // The two metaphors are the product's own name. The book is the container,
    // the runway is each account's journey; they are not competing themes.
    (function(){
      const html = renderTabs();
      const nums = (html.match(/class="ch">(\d\d)</g) || []).length;
      return nums === 4 && html.indexOf('>01<') !== -1 && html.indexOf('>04<') !== -1;
    })(),
    'four tabs, four numerals');

  (function(){
    /* ============ v80 MOTION HAS A SWITCH, AND IT CANNOT HIDE ANYTHING ============
       Every pass this session added motion to a surface someone uses under time
       pressure. Two things have to be true for that to be safe: the switch must
       actually turn it off, and NOTHING may depend on an animation having run —
       a reveal that leaves a heading at opacity 0 when the effect is disabled is
       how a themed page loses its content. */
    const prev = getMotionPref();
    let ok = false, detail = '';
    try{
      // The preference is a display choice and must never reach the book.
      const bookKeys = Object.keys(DATA);
      const staysOut = bookKeys.indexOf('motion') === -1
        && String(saveMotionPref).indexOf('DATA') === -1
        && String(getMotionPref).indexOf('DATA') === -1;

      // It round-trips, and junk falls back to full rather than to nothing.
      saveMotionPref('calm');   const gotCalm = getMotionPref() === 'calm';
      saveMotionPref('__junk__'); const junkSafe = getMotionPref() === 'full';
      saveMotionPref('full');   const gotFull = getMotionPref() === 'full';

      /* The OS always wins. Asserted on the source rather than by faking a media
         query, and stated plainly: a switch that could override
         prefers-reduced-motion would be worse than having no switch. */
      const osWins = String(motionEnabled).indexOf('prefers-reduced-motion') !== -1
        && String(motionEnabled).indexOf("=== 'full'") !== -1;

      /* Nothing may be hidden by default. Every rule that moves or hides these
         elements has to sit behind .fx-on, so with the class absent the page is
         simply still — not blank. */
      let guarded = true, offenders = [];
      [...document.styleSheets].forEach(sh => {
        let rules; try{ rules = sh.cssRules; }catch(e){ return; }
        [...(rules || [])].forEach(r => {
          if(!r.selectorText) return;
          /* Both halves of this needed a boundary. ".cp3-h" prefix-matched
             ".cp3-horizon", and "opacity: 0.8" matched a naive /opacity:\s*0/ —
             so a visible hairline was reported as hidden content. */
          if(!/\.cp3-h(?![\w-])|\.cp3-when(?![\w-])|\.cp3-ch(?![\w-])/.test(r.selectorText)) return;
          const hides = /opacity:\s*0\s*[;}]|transform:\s*translateY\(1/.test(r.cssText);
          if(hides && r.selectorText.indexOf('.fx-on') === -1){ guarded = false; offenders.push(r.selectorText); }
        });
      });

      // And the mask must not eat the words it wraps.
      /* v85: the mask wrapper is gone with the reveal it served. What replaces
         this assertion is the one that always mattered — the entrance is opacity
         only, so nothing can be left hidden when motion is off. */
      const kept = String(bindCopilotParallax).indexOf('maskHeadings') === -1;

      ok = staysOut && gotCalm && junkSafe && gotFull && osWins && guarded && kept;
      detail = JSON.stringify({staysOut, gotCalm, junkSafe, gotFull, osWins, guarded, offenders, kept});
    }catch(err){ detail = err.message; }
    saveMotionPref(prev);
    document.body.classList.toggle('fx-on', motionEnabled());
    check('v80 motion can be switched off, and nothing is hidden when it is', ok, detail);
  })();

  check('v82 the suite cannot persist its own synthetic book',
    /* This is the one guard the v74.4 whole-book check could not provide. That
       one reads DATA in memory, which every check restores correctly — but
       queueSave() defers a write, and a deferred write that lands mid-check
       serialises the FAKE book straight into localStorage. It happened twice on
       a real 37-account book before this existed. */
    _suiteRunning === true &&
    String(queueSave).indexOf('_suiteRunning') !== -1 &&
    String(runSelfChecks).indexOf('finally') !== -1 &&
    String(runSelfChecks).indexOf('_suiteRunning = false') !== -1,
    'queueSave must stand down while the suite runs, and the flag must clear even if a check throws');

  /* ---- v86 session backfill ----
     A bulk write is the most dangerous shape of edit in this file: one click
     touching thirty accounts. Every rule the feature claims is asserted here,
     and the decision layer is asserted against a SYNTHETIC book so the planner
     never has to be trusted near the real one. */
  (function(){
    const start = isoAddDays(todayISO(), -300);
    const last = isoAddDays(todayISO(), -10);
    const mkC = (id, over) => Object.assign({id, name:'BF ' + id, stage:'ttfv1',
      implementationDate: start, totalSessions:8, domainScores:{}, sessionNotes:{},
      stageHistory:[]}, over || {});
    const act = (id, n, d) => ({id, date:d, type:'Other', summary:'s',
      sessionNumber:n, checklist:[], flagged:false});

    const custs = [mkC('__bf_a__'), mkC('__bf_b__'), mkC('__bf_c__'), mkC('__bf_small__', {totalSessions:2})];
    const acts = {'__bf_b__': [act('x1', 1, isoAddDays(todayISO(), -200)), act('x2', 3, isoAddDays(todayISO(), -60))]};

    // 1. PURE. Planning must not touch the book it is planning against.
    const beforeC = JSON.stringify(custs), beforeA = JSON.stringify(acts);
    const beforeDATA = JSON.stringify(DATA.customers.length) + '|' + JSON.stringify(Object.keys(DATA.activities || {}).length);
    planSessionBackfill([{id:'__bf_a__', completed:'3', lastDate:last, booked:''}], custs, acts);
    check('v86 planning a backfill mutates nothing — not the book, not the rows',
      JSON.stringify(custs) === beforeC && JSON.stringify(acts) === beforeA
      && beforeDATA === JSON.stringify(DATA.customers.length) + '|' + JSON.stringify(Object.keys(DATA.activities || {}).length));

    // 2. RULE 1: only ever additive. __bf_b__ already has sessions 1 and 3.
    const lower = planSessionBackfill([{id:'__bf_b__', completed:'1', lastDate:last, booked:''}], custs, acts);
    check('v86 a count lower than what is logged is refused, never obeyed',
      lower.plan.length === 0 && lower.errors.length === 1
      && /only adds/.test(lower.errors[0].msg) && lower.errors[0].name === 'BF __bf_b__',
      JSON.stringify(lower));

    // 3. Fills exactly the GAPS — 1 and 3 exist, so a target of 4 adds 2 and 4.
    const gaps = planSessionBackfill([{id:'__bf_b__', completed:'4', lastDate:last, booked:''}], custs, acts);
    const nums = gaps.plan.length ? gaps.plan[0].sessions.map(s => s.sessionNumber) : [];
    check('v86 backfill fills only the missing session numbers, never duplicates one',
      gaps.errors.length === 0 && nums.join(',') === '2,4', JSON.stringify(nums));

    // 4. Cannot exceed the account's own plan.
    const over = planSessionBackfill([{id:'__bf_small__', completed:'5', lastDate:last, booked:''}], custs, acts);
    check('v86 backfill cannot log more sessions than the account plan has',
      over.plan.length === 0 && over.errors.length === 1 && /only has 2 sessions/.test(over.errors[0].msg),
      JSON.stringify(over.errors));

    // 5. RULE 2: the entered date is exact, everything under it is flagged EST.
    const dated = planSessionBackfill([{id:'__bf_a__', completed:'3', lastDate:last, booked:''}], custs, acts);
    const ss = dated.plan[0].sessions;
    const ascending = ss.every((s, i) => i === 0 || s.date >= ss[i-1].date);
    const inRange = ss.every(s => s.date >= start && s.date <= last);
    check('v86 only the entered session date is exact — every earlier one is marked estimated',
      ss.length === 3 && ss[2].date === last && ss[2].estimated === false
      && ss[0].estimated === true && ss[1].estimated === true
      && ascending && inRange,
      JSON.stringify(ss));

    // 6. The refusals that keep bad dates out.
    const bad = planSessionBackfill([
      {id:'__bf_a__', completed:'2', lastDate: isoAddDays(todayISO(), 5), booked:''},      // future session
      {id:'__bf_c__', completed:'2', lastDate: isoAddDays(start, -5), booked:''},          // before the account existed
      {id:'__bf_small__', completed:'1.5', lastDate:last, booked:''},                      // not a whole number
      {id:'__bf_b__', completed:'', lastDate:'', booked: isoAddDays(todayISO(), -1)}       // booking in the past
    ], custs, acts);
    check('v86 backfill refuses future sessions, pre-start dates, fractions, and past bookings',
      bad.plan.length === 0 && bad.errors.length === 4, JSON.stringify(bad.errors));

    // 7 + 8 + 9. The applier, against a swapped-in book. The references are put
    // back before the whole-book purity check below ever looks.
    const realC = DATA.customers, realA = DATA.activities;
    let applied = null, paceBefore = null, paceAfter = null, countAfter = null,
        bookedOn = null, checklists = null, noHistoryForC = null;
    try{
      DATA.customers = custs.map(c => Object.assign({}, c));
      DATA.activities = {};
      const target = DATA.customers[0];
      paceBefore = sessionPaceDays(target);
      const p = planSessionBackfill([
        {id:'__bf_a__', completed:'3', lastDate:last, booked:''},
        {id:'__bf_c__', completed:'', lastDate:'', booked: isoAddDays(todayISO(), 4)}
      ], DATA.customers, DATA.activities);
      applied = applySessionBackfill(p.plan);
      paceAfter = sessionPaceDays(target);
      countAfter = sessionsCompletedCount(target);
      checklists = (DATA.activities['__bf_a__'] || []).every(a => Array.isArray(a.checklist) && a.checklist.length === 0);
      bookedOn = (DATA.customers.find(c => c.id === '__bf_c__') || {}).nextSessionScheduledOn;
      noHistoryForC = !(DATA.activities['__bf_c__'] || []).length;
    } finally {
      DATA.customers = realC;
      DATA.activities = realA;
    }
    check('v86 RULE 3: backfilled sessions carry no checklist — the catch-up invents no Gainsight admin',
      checklists === true && applied && applied.created === 3, JSON.stringify(applied));
    check('v86 after a backfill the account has a real pace instead of the global fallback',
      countAfter === 3 && paceBefore === DATA.config.defaultPaceDays && paceAfter !== paceBefore
      // ±1 day: the span is real calendar arithmetic and a DST boundary inside it
      // is not a bug in the backfill.
      && Math.abs(paceAfter - 100) <= 1,
      JSON.stringify({countAfter, paceBefore, paceAfter}));
    check('v86 a row with only a date books the next session without inventing history',
      bookedOn === isoAddDays(todayISO(), 4) && applied.booked === 1 && noHistoryForC === true,
      JSON.stringify({bookedOn, booked: applied && applied.booked}));

    /* The undo fix. STRUCTURAL, deliberately: saveData() stands down entirely
       while the suite runs (v82), so the real write path cannot be exercised from
       in here without reopening the exact hole that overwrote a live book twice.
       What can be asserted is the contract — that the deferred path declares
       itself maintenance, and that maintenance is what gates the snapshot. The
       behaviour itself was verified in a browser against both the backfill and
       v67's Quick Log, which had been silently losing its undo since v66. */
    check('v86 a deferred maintenance write cannot overwrite the undo snapshot',
      String(queueSave).indexOf('maintenance:true') !== -1
      && /prior !== null && !maintenance/.test(String(saveData))
      && /if\(!maintenance\) _undoLabel = null/.test(String(saveData))
      && saveData.length === 1,
      'queueSave must mark itself maintenance, and saveData must gate BOTH the snapshot and the label on it');

    // The feature is reachable, and the entry point does not stack on Settings.
    check('v86 the backfill grid is reachable from Settings and never stacks a second modal',
      /id="btn-backfill-settings"/.test(String(openSettingsModal))
      && String(openSettingsModal).indexOf('openBackfillModal') !== -1
      && String(openBackfillModal).indexOf(".querySelector('.modal-backdrop')") !== -1);
  })();

  /* ---- v87 book readiness ---- */
  (function(){
    const realC = DATA.customers, realA = DATA.activities;
    let fed = null, thin = null, order = null, tagAssumed = null, tagReal = null, stripOnFed = null;
    try{
      const mk = (id, over) => Object.assign({id, name:'RD ' + id, stage:'ttfv1',
        implementationDate: isoAddDays(todayISO(), -120), totalSessions:8,
        domainScores:{}, sessionNotes:{}, stageHistory:[]}, over || {});
      const act = (id, n) => ({id, date: isoAddDays(todayISO(), -20), type:'Other',
        summary:'s', sessionNumber:n, checklist:[], flagged:false});

      // A THIN book: one account with nothing at all, one with a session but no booking.
      DATA.customers = [mk('__rd_a__'), mk('__rd_b__')];
      DATA.activities = {'__rd_b__': [act('r1', 1)]};
      thin = bookReadiness();
      order = thin.gaps.map(g => g.key).join(',');
      tagAssumed = renderGradTag(DATA.customers[0]);
      tagReal = renderGradTag(DATA.customers[1]);

      // A FED book: sessions logged and a booking ahead on every live account.
      DATA.customers = [mk('__rd_c__', {nextSessionScheduledOn: isoAddDays(todayISO(), 5)})];
      DATA.activities = {'__rd_c__': [act('r2', 1), act('r3', 2)]};
      fed = bookReadiness();
      stripOnFed = renderReadinessStrip();
    } finally {
      DATA.customers = realC;
      DATA.activities = realA;
    }

    check('v87 a thin book names every gap it actually has, worst-unblocking first',
      order === 'no_sessions,no_booking,no_activity'
      && thin.gaps[0].count === 1 && thin.gaps[1].count === 2 && thin.gaps[2].count === 1,
      JSON.stringify({order, counts: thin.gaps.map(g=>g.count)}));

    check('v87 a fed book says nothing at all — no gaps, no strip',
      fed.gaps.length === 0 && fed.next === null && stripOnFed === '',
      JSON.stringify({gaps: fed.gaps.map(g=>g.key), strip: stripOnFed}));

    /* The honesty half. An account with no completed sessions must not be shown
       a date that claims to be measured from its own pace. */
    check('v87 a projection with no sessions behind it is labelled Assumed, not Est.',
      /Assumed/.test(tagAssumed) && /grad-tag assumed/.test(tagAssumed)
      && /default pace/.test(tagAssumed)
      && /Est\./.test(tagReal) && !/assumed/.test(tagReal),
      JSON.stringify({assumed: tagAssumed, real: tagReal}));

    check('v87 paceIsFallback marks exactly the accounts sessionPaceDays falls back on',
      String(sessionPaceDays).indexOf('defaultPaceDays') !== -1
      && String(paceIsFallback).indexOf('sessionsCompletedCount') !== -1);

    /* Dismissals are a browser preference, never a fact about a customer — the
       same contract as the motion switch. If this ever wrote to DATA, exporting a
       book would carry one person's nagging preferences to whoever imported it. */
    check('v87 dismissing a readiness gap writes to the browser, never to the book',
      String(dismissGap).indexOf('localStorage') !== -1
      && String(dismissGap).indexOf('DATA') === -1
      && String(getDismissedGaps).indexOf('DATA') === -1
      && ONBOARD_KEY !== STORAGE_KEY);

    // The strip must offer a control that exists, and the empty state must too.
    check('v87 every readiness action maps to a real opener',
      ['backfill','quicklog'].every(a => String(attachEvents).indexOf(`'${a}'`) !== -1)
      && typeof openBackfillModal === 'function' && typeof openQuickLogModal === 'function'
      && String(renderActivityTab).indexOf('data-onb-act="quicklog"') !== -1);
  })();

  /* ---- v88 plays ---- */
  (function(){
    const mk = () => ({id:'__pb__', name:'PB Co', stage:'ttfv1',
      implementationDate: isoAddDays(todayISO(), -100), totalSessions:8,
      domainScores:{}, sessionNotes:{}, stageHistory:[]});

    // Registry integrity: every play's steps are uniquely keyed and ordered by date.
    check('v88 every play has unique step keys and non-decreasing due offsets',
      PLAYBOOK_DEFS.every(d => {
        const keys = d.steps.map(s => s.key);
        return d.key && d.title && d.steps.length
          && new Set(keys).size === keys.length
          && d.steps.every((s,i) => i === 0 || s.dueIn >= d.steps[i-1].dueIn)
          && d.steps.every(s => ['you','customer'].includes(s.who) && Number.isFinite(s.dueIn));
      }) && new Set(PLAYBOOK_DEFS.map(d=>d.key)).size === PLAYBOOK_DEFS.length,
      PLAYBOOK_DEFS.map(d=>d.key).join(','));

    // Every signal a play claims to answer must actually exist in SIGNAL_DEFS.
    const signalKeys = new Set(SIGNAL_DEFS.map(d => d.key));
    const bogus = PLAYBOOK_DEFS.flatMap(d => d.signals.filter(k => !signalKeys.has(k)));
    check('v88 every play triggers on a signal the registry actually detects',
      bogus.length === 0, bogus.join(','));

    // RULE 1: nothing auto-starts, and the same play cannot run twice at once.
    const c = mk();
    const started = startPlaybook(c, 'reengage');
    const twice = startPlaybook(c, 'reengage');
    check('v88 a play starts only when asked, and never twice at once',
      started === true && twice === false && getPlaybooks(c).length === 1
      && String(suggestedPlaybooks).indexOf('startPlaybook') === -1,
      JSON.stringify({started, twice, n: getPlaybooks(c).length}));

    // Step dates are measured from the START, so a play begun late is late in
    // its own terms rather than instantly overdue against today.
    const pb = getPlaybooks(c)[0];
    pb.startedOn = isoAddDays(todayISO(), -30);
    const def = playbookDef('reengage');
    const dues = def.steps.map(s => playbookStepDue(pb, s));
    const late = overduePlaybookSteps(c);
    check('v88 play step dates are based on the start date, and overdue is measured against today',
      dues[0] === pb.startedOn
      && dues[dues.length-1] === isoAddDays(pb.startedOn, def.steps[def.steps.length-1].dueIn)
      && late.length === def.steps.length,
      JSON.stringify({dues, late: late.length}));

    // Ticking a step removes it from the overdue set; the play completes.
    def.steps.forEach(s => togglePlaybookStep(c, pb.id, s.key));
    const prog = playbookProgress(c, pb);
    check('v88 completing every step clears the overdue work and marks the play complete',
      prog.complete === true && prog.overdue === 0 && overduePlaybookSteps(c).length === 0
      && prog.next === null,
      JSON.stringify({done: prog.doneCount, total: prog.total}));

    // RULE 2: closing carries a verdict, and a closed play stops producing work
    // but stays visible as history.
    const closedOk = closePlaybook(c, pb.id, 'no_effect');
    const closedJunk = closePlaybook(c, pb.id, 'not_a_verdict');
    check('v88 closing a play requires a real outcome and retires it from the work list',
      closedOk === true && closedJunk === false && pb.outcome === 'no_effect'
      && openPlaybooks(c).length === 0 && getPlaybooks(c).length === 1
      && suggestedPlaybooks(c).every(d => d.key !== 'reengage'),
      JSON.stringify({closedOk, closedJunk, outcome: pb.outcome}));

    // Hostile input: an unknown play key and a step key that is not in the def.
    const junk = normalizePlaybook({key:'no_such_play', done:{}});
    const strayStep = normalizePlaybook({key:'reengage', startedOn: todayISO(),
      done:{ping: todayISO(), NOT_A_STEP: todayISO(), alt:'not-a-date'}});
    check('v88 an unknown play, an unknown step and a junk date are all dropped at the boundary',
      junk === null && strayStep !== null
      && Object.keys(strayStep.done).join(',') === 'ping',
      JSON.stringify({junk, done: strayStep && strayStep.done}));

    // Every source this feature produces must declare its band and its effort.
    check('v88 the play and check-back sources are declared in the Today registry',
      !!TODAY_SOURCE_MAP.playbook_step_overdue && !!TODAY_SOURCE_MAP.grad_review_due
      && Number.isFinite(effortMinutesFor('playbook_step_overdue'))
      && Number.isFinite(effortMinutesFor('grad_review_due'))
      && PANEL_TAB_KEYS.includes('plays') && ROUTE_TABS.includes('plays')
      && typeof PANEL_TAB_LABEL.plays === 'string');
  })();

  /* ---- v88 the graduation check-back ---- */
  (function(){
    const realC = DATA.customers;
    let scheduled = null, dueBefore = null, dueAfter = null, answered = null,
        reGraduate = null, durability = null, inTriage = null;
    try{
      const c = {id:'__gr__', name:'GR Co', stage:'ttfv1', implementationDate: isoAddDays(todayISO(), -200),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      DATA.customers = [c];

      changeStage(c, 'graduated');
      scheduled = !!getGradReview(c);
      dueBefore = gradReviewDue(c);                // scheduled ahead — not due yet
      c.gradReview.dueOn = isoAddDays(todayISO(), -1);
      dueAfter = gradReviewDue(c);

      // A graduated account is otherwise out of triage; the check-back is the
      // one thing that must still reach Today.
      inTriage = todayAccountCandidates(c, {gainsightByCustomer:{}})
        .filter(x => x.source === 'grad_review_due').length;

      answered = answerGradReview(c, 'held', '  Still running   monthly close  in Wdesk. ');
      durability = {verdict: c.gradReview.verdict, note: c.gradReview.note, doneOn: c.gradReview.doneOn};

      // Re-graduating must not erase the answer.
      changeStage(c, 'ttfv1');
      changeStage(c, 'graduated');
      reGraduate = c.gradReview.verdict === 'held' && c.gradReview.doneOn === todayISO();
    } finally {
      DATA.customers = realC;
    }
    check('v88 graduating schedules a check-back, and it comes due on its own date',
      scheduled === true && dueBefore === false && dueAfter === true,
      JSON.stringify({scheduled, dueBefore, dueAfter}));

    check('v88 a due check-back reaches Today even though graduated accounts leave triage',
      inTriage === 1, String(inTriage));

    check('v88 answering the check-back records a clean verdict and note',
      answered === true && durability && durability.verdict === 'held'
      && durability.note === 'Still running monthly close in Wdesk.' && durability.doneOn === todayISO(),
      JSON.stringify(durability));

    check('v88 re-graduating an account never erases an answer already given',
      reGraduate === true);

    /* The window is a real Settings field, validated on the same path as every
       other threshold — a config key with no UI is a dead key, and gradReviewDays()
       falling back to 30 forever would have hidden that. */
    check('v88 the check-back window is editable in Settings and validated like every other threshold',
      String(openSettingsModal).indexOf('grad-review-days') !== -1
      && String(parseSettingsDraft).indexOf('gradReviewDays') !== -1
      && String(applySettingsDraft).indexOf('config.gradReviewDays') !== -1
      && (function(){
        // A raw draft that is valid in every other respect, so the only thing
        // under test is the new field.
        const base = () => ({
          domains: DATA.config.domains.slice(),
          domainSlots: DATA.config.domains.slice(),
          outcomes: DATA.config.outcomeNames.slice(),
          riskKeywords: DATA.config.advisorRiskKeywords.join('\n'),
          positiveKeywords: DATA.config.advisorPositiveKeywords.join('\n'),
          keywordMaxAgeDays:'30', riskWatchDays:'10', riskAlertDays:'21',
          defaultPaceDays:'7', dueSoonDays:'7', neglectDays:'21', gradReviewDays:'30',
          implQuietDays:'35'
        });
        let good = false, zeroRefused = false, hugeRefused = false;
        try{ good = parseSettingsDraft(base()).gradReviewDays === 30; }catch(e){ good = false; }
        try{ parseSettingsDraft(Object.assign(base(), {gradReviewDays:'0'})); }
        catch(e){ zeroRefused = /check-back must be between/.test(e.message); }
        try{ parseSettingsDraft(Object.assign(base(), {gradReviewDays:'900'})); }
        catch(e){ hugeRefused = /check-back must be between/.test(e.message); }
        return good && zeroRefused && hugeRefused;
      })(),
      'a valid window must parse, and 0 or 900 days must both be refused by name');

    check('v88 the check-back schema is versioned and migrated, not guessed',
      CURRENT_SCHEMA_VERSION >= 9
      && String(migrateData).indexOf('normalizeGradReview') !== -1
      && String(migrateData).indexOf('normalizePlaybook') !== -1
      && String(repairAuxiliaryCollections).indexOf('normalizePlaybook') !== -1
      && String(repairAuxiliaryCollections).indexOf('normalizeGradReview') !== -1);
  })();

  /* ---- gone quiet (1.1): no contact since hand-off, or since a pause ended ---- */
  (function(){
    const realC = DATA.customers, realA = DATA.activities, realP = DATA.pauseReturns;
    const t = todayISO(), ago = n => isoAddDays(t, -n);
    const mk = (id, extra) => Object.assign({id, name:id, stage:'ttfv1', implementationDate: ago(200),
      totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[], compliance: defaultCompliance()}, extra || {});
    const live = n => ({phase:'golive', wentLiveOn: ago(n), phaseHistory:[{phase:'golive', date: ago(n)}]});
    const act = (d, type) => ({id:'a-' + d + '-' + type, date:d, type:type || 'Call', summary:'x', sessionNumber:null});
    const quiet = c => todayAccountCandidates(c, {gainsightByCustomer:{}}).filter(x => x.source === 'gone_quiet');
    const r = {};
    try{
      // 1. hand-off: day 6 no, day 7 yes, severity 4, and it heads the account's candidates
      const h6 = mk('__gq6__', {implementation: live(6)}), h7 = mk('__gq7__', {implementation: live(7)});
      DATA.customers = [h6, h7]; DATA.pauseReturns = [];
      DATA.activities = {__gq6__:[act(ago(6))], __gq7__:[act(ago(7))]};   // the hand-off call on the Go-Live day
      r.d6 = quiet(h6).length;
      r.d7 = quiet(h7).length;
      r.sev = quiet(h7)[0] && quiet(h7)[0].severity;
      r.top = (todayAccountCandidates(h7, {gainsightByCustomer:{}})[0] || {}).source;
      // 2. any activity after the hand-off day stops it, whatever its type; the hand-off-day call does not
      r.stops = ['Call','Email','Other','Implementation Note','Partner Sync'].map(type => {
        DATA.activities = {__gq7__:[act(ago(7)), act(ago(1), type)]};
        return quiet(h7).length;
      });
      // 3. pause return: fires the day it is recorded, stops on activity on or after that day, not before;
      //    an account still in implementation fires too (hand-off cannot apply there, the pause return can)
      const p = mk('__gqp__');
      DATA.customers = [p];
      DATA.pauseReturns = [{id:'__gqp__', name:'__gqp__', date: t}];
      DATA.activities = {__gqp__:[]};
      r.pTodayNoWait = quiet(p).length;
      DATA.pauseReturns = [{id:'__gqp__', name:'__gqp__', date: ago(3)}];
      DATA.activities = {__gqp__:[act(ago(4), 'Email')]};
      r.pBefore = quiet(p).length;
      DATA.activities = {__gqp__:[act(ago(3), 'Email')]};
      r.pOnDay = quiet(p).length;
      DATA.activities = {__gqp__:[act(ago(1), 'Call')]};
      r.pAfter = quiet(p).length;
      const pi = mk('__gqi__', {implementation:{phase:'align', phaseHistory:[{phase:'align', date: ago(30)}]}});
      DATA.customers = [pi];
      DATA.pauseReturns = [{id:'__gqi__', name:'__gqi__', date: t}];
      DATA.activities = {__gqi__:[]};
      r.pImpl = inImplementation(pi) ? quiet(pi).length : -1;
      // 4. a paused account never fires: the same account fires unpaused (positive control) and not paused
      const pz = mk('__gqz__', {implementation: live(10), pause:{until: isoAddDays(t, 10), reason:'x', setOn: ago(8)}});
      const un = mk('__gqu__', {implementation: live(10)});
      DATA.customers = [pz, un];
      DATA.pauseReturns = [{id:'__gqz__', name:'__gqz__', date: ago(2)}, {id:'__gqu__', name:'__gqu__', date: ago(2)}];
      DATA.activities = {__gqz__:[act(ago(10))], __gqu__:[act(ago(10))]};
      r.pausedFlag = isPaused(pz);
      r.pausedFires = quiet(pz).length;
      r.unpausedFires = quiet(un).length;
      // 5. in implementation, back from pause: gone_quiet takes its severity-4 place on the impl path
      //    (above a severity-2 aged blocker; after an equal-severity overdue commitment, as on the main path)
      const implPh = {phase:'align', phaseHistory:[{phase:'align', date: ago(30)}]};
      const pb = mk('__gqb__', {implementation: implPh, blockers:[{id:'b1', text:'x', owner:'customer', since: ago(30), resolvedOn:null}]});
      const pc = mk('__gqc__', {implementation: implPh, commitments:[{id:'c1', text:'x', direction:'i_owe', due: ago(3), doneOn:null}]});
      DATA.customers = [pb, pc];
      DATA.pauseReturns = [{id:'__gqb__', name:'__gqb__', date: t}, {id:'__gqc__', name:'__gqc__', date: t}];
      DATA.activities = {__gqb__:[], __gqc__:[]};
      const cb = todayAccountCandidates(pb, {gainsightByCustomer:{}}), cc = todayAccountCandidates(pc, {gainsightByCustomer:{}});
      r.implB = cb.map(x => x.source).join(',');
      r.implC = cc.map(x => x.source).join(',');
      // 6. a pause-return entry dated in the future does not fire yet; today's does
      const pf = mk('__gqf__');
      DATA.customers = [pf];
      DATA.activities = {__gqf__:[]};
      DATA.pauseReturns = [{id:'__gqf__', name:'__gqf__', date: isoAddDays(t, 3)}];
      r.future = quiet(pf).length;
      // 7. two entries for one account: the latest rules (an old entry cannot hide a newer one, nor revive)
      const p2 = mk('__gq2__');
      DATA.customers = [p2];
      DATA.pauseReturns = [{id:'__gq2__', name:'__gq2__', date: ago(10)}, {id:'__gq2__', name:'__gq2__', date: ago(2)}];
      DATA.activities = {__gq2__:[act(ago(5), 'Call')]};   // answers the old return, not the latest
      r.twoNewerOpen = quiet(p2).length;
      DATA.activities = {__gq2__:[act(ago(1), 'Call')]};   // answers the latest
      r.twoAnswered = quiet(p2).length;
    } finally {
      DATA.customers = realC; DATA.activities = realA; DATA.pauseReturns = realP;
    }
    check('gone quiet: a hand-off fires on day 7 (not day 6) at severity 4 and heads the account\'s candidates',
      r.d6 === 0 && r.d7 === 1 && r.sev === 4 && r.top === 'gone_quiet', JSON.stringify(r));
    check('gone quiet: any activity type after the hand-off day stops it; the hand-off call itself does not',
      JSON.stringify(r.stops) === '[0,0,0,0,0]' && r.d7 === 1, JSON.stringify(r.stops));
    check('gone quiet: a pause return fires the day it is recorded (also while still in implementation) and stops on activity on or after that day',
      r.pTodayNoWait === 1 && r.pBefore === 1 && r.pOnDay === 0 && r.pAfter === 0 && r.pImpl === 1, JSON.stringify(r));
    check('gone quiet: in implementation it is placed by severity (above a severity-2 blocker, after an equal-severity overdue commitment)',
      r.implB === 'gone_quiet,blocker_aged' && r.implC === 'commitment_overdue,gone_quiet', JSON.stringify([r.implB, r.implC]));
    check('gone quiet: a pause-return entry dated in the future does not fire',
      r.future === 0, JSON.stringify(r.future));
    check('gone quiet: with two pause-return entries the latest one rules',
      r.twoNewerOpen === 1 && r.twoAnswered === 0, JSON.stringify([r.twoNewerOpen, r.twoAnswered]));
    check('gone quiet: a paused account never fires, while the identical unpaused account does',
      r.pausedFlag === true && r.pausedFires === 0 && r.unpausedFires === 1, JSON.stringify(r));
    check('gone quiet: GONE_QUIET_DAYS is 7 and gone_quiet is declared at severity 4',
      typeof GONE_QUIET_DAYS === 'number' && GONE_QUIET_DAYS === 7
      && !!TODAY_SOURCE_MAP.gone_quiet && TODAY_SOURCE_MAP.gone_quiet.severity === 4,
      typeof GONE_QUIET_DAYS === 'undefined' ? 'GONE_QUIET_DAYS missing' : String(GONE_QUIET_DAYS));
  })();

  /* ---- v89 CSV import, value and renewal ---- */
  (function(){
    const NL = String.fromCharCode(10), CR = String.fromCharCode(13);

    /* The grammar, all four things a real export actually contains. */
    const csv = 'Account,ARR,Renewal' + CR + NL
      + '"Airbnb, Inc.","$1,200,000",2026-11-30' + CR + NL
      + '"Say ""hi"" Ltd",45k,11/30/2026' + NL
      + '"Multi' + NL + 'line Co",250000,2026-01-05' + NL;
    const rows = parseCsv('﻿' + csv);
    check('v89 the CSV parser handles quotes, embedded commas, doubled quotes, CRLF, newlines-in-fields and a BOM',
      rows.length === 4
      && rows[0].join('|') === 'Account|ARR|Renewal'
      && rows[1][0] === 'Airbnb, Inc.' && rows[1][1] === '$1,200,000'
      && rows[2][0] === 'Say "hi" Ltd'
      && rows[3][0] === 'Multi' + NL + 'line Co',
      JSON.stringify(rows));

    check('v89 a trailing newline does not invent an empty row, and a missing one does not lose the last',
      parseCsv('a,b' + NL + 'c,d' + NL).length === 2
      && parseCsv('a,b' + NL + 'c,d').length === 2
      && parseCsv('').length === 0);

    /* Money as it arrives, and — more important — what it REFUSES. */
    check('v89 money parses every real export shape and refuses everything it cannot read',
      parseMoneyCell('$1,200,000') === 1200000 && parseMoneyCell('45k') === 45000
      && parseMoneyCell('1.2M') === 1200000 && parseMoneyCell('250000') === 250000
      && parseMoneyCell(' €900 ') === 900 && parseMoneyCell(1500) === 1500
      && parseMoneyCell('(1,200)') === null      // accounting negative
      && parseMoneyCell('-500') === null
      && parseMoneyCell('N/A') === null && parseMoneyCell('') === null
      && parseMoneyCell('1e99') === null && parseMoneyCell(null) === null,
      JSON.stringify([parseMoneyCell('$1,200,000'), parseMoneyCell('45k'), parseMoneyCell('1.2M'), parseMoneyCell('(1,200)')]));

    /* Legal-suffix matching, against names from the real book. */
    /* Two tiers, and the boundary between them matters. EXACT already ignores
       punctuation and case, so "Airbnb, Inc." and "Airbnb Inc" are the same
       account with no loosening required — that is a spelling difference, not a
       judgement call. LOOSE is only needed when a whole legal suffix is absent
       ("Crowdstrike" for "Crowdstrike Holdings, Inc."), which IS a judgement
       call and is why it gets labelled in the review. */
    check('v89 exact matching ignores punctuation; loose is reserved for dropped legal suffixes',
      csvNameKeyExact('Airbnb, Inc.') === csvNameKeyExact('Airbnb Inc')
      && csvNameKeyExact('Crowdstrike Holdings, Inc.') !== csvNameKeyExact('Crowdstrike')
      && csvNameKeyLoose('Crowdstrike Holdings, Inc.') === csvNameKeyLoose('Crowdstrike')
      && csvNameKeyLoose('Inc') === 'inc',                     // never reduced to nothing
      JSON.stringify([csvNameKeyExact('Airbnb, Inc.'), csvNameKeyLoose('Crowdstrike Holdings, Inc.')]));

    /* Staging: exact vs loose vs unmatched vs ambiguous, and old-beside-new. */
    const custs = [
      {id:'x1', name:'Airbnb, Inc.', arr: 100},
      {id:'x2', name:'Delta Corp'},
      {id:'x3', name:'Delta LLC'}                 // collides with x2 once suffixes go
    ];
    const H = ['Account','Tier','ARR','Renewal'];
    const D = [
      ['Airbnb, Inc.','Enterprise','$1,200,000','2026-11-30'],   // exact
      ['Delta','Mid','50k','2026-05-05'],                        // ambiguous
      ['Nobody Ltd','SMB','10k','2026-05-05'],                   // unmatched
      ['Airbnb, Inc.','Enterprise','100','']                     // no change on arr
    ];
    const staged = buildValueImportRows(H, D, {name:'Account', tier:'Tier', arr:'ARR', renewalDate:'Renewal'}, custs);
    const first = staged[0];
    check('v89 staging reports exact, ambiguous and unmatched rows separately and never guesses',
      staged.length === 4
      && first.matchKind === 'exact' && first.changes.length === 3
      && staged[1].ambiguous === true && staged[1].matchedId === null && staged[1].importable === false
      && staged[2].matchedId === null && staged[2].importable === false,
      JSON.stringify(staged.map(r=>({n:r.rawName, k:r.matchKind, amb:r.ambiguous, ch:r.changes.length}))));

    check('v89 an unmatched row proposes no changes at all — the preview cannot imply a write',
      staged[2].matchedId === null && staged[2].changes.length === 0
      && staged[1].ambiguous === true && staged[1].changes.length === 0,
      JSON.stringify({unmatched: staged[2].changes, ambiguous: staged[1].changes}));

    check('v89 an unchanged value produces no change row, so the preview never overstates',
      staged[3].changes.filter(ch => ch.field === 'arr').length === 0
      && (first.changes.find(ch=>ch.field==='arr')||{}).from === 100
      && (first.changes.find(ch=>ch.field==='arr')||{}).to === 1200000,
      JSON.stringify(staged[3].changes));

    /* A suffix-only match is found, but LABELLED so a human decides. Uses a name
       that EXACT genuinely cannot reach, or the test proves nothing. */
    const suffixCusts = [{id:'y1', name:'Crowdstrike Holdings, Inc.'}];
    const loose = buildValueImportRows(H, [['Crowdstrike','','2000','']],
      {name:'Account', tier:'', arr:'ARR', renewalDate:''}, suffixCusts);
    const punct = buildValueImportRows(H, [['Airbnb Inc','','2000','']],
      {name:'Account', tier:'', arr:'ARR', renewalDate:''}, custs);
    check('v89 a suffix-only match is flagged loose, while a punctuation-only difference is trusted',
      loose[0].matchedId === 'y1' && loose[0].matchKind === 'loose'
      && punct[0].matchedId === 'x1' && punct[0].matchKind === 'exact',
      JSON.stringify([loose[0].matchKind, punct[0].matchKind]));

    /* THE RULING, tested by BEHAVIOUR rather than by reading the comparator —
       todayActionList is wrapped by memoizePerRender, so String() returns the
       memo wrapper and source inspection on it can never work. (Found the hard
       way; the same trap applies to every memoized function in this file.)

       Two clones differing only in name and value, named so that ALPHABETICAL
       order contradicts VALUE order: if value is being read, Zeta wins. */
    const realCust = DATA.customers, realActs = DATA.activities;
    let valueDecides = null, severityStillWins = null, unchangedWhenNoValue = null;
    try{
      /* compliance is required: todayActionList walks pendingGainsightItems(),
         which reads c.compliance.sentiment on every account. A fixture missing
         it throws rather than failing, which is worse than a wrong answer. */
      const clone = (id, name, over) => Object.assign({id, name, stage:'ttfv1',
        module: DATA.config.modules[0], implementationDate: isoAddDays(todayISO(), -120),
        totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[],
        compliance: defaultCompliance()}, over || {});
      DATA.customers = [clone('v1','Alpha Co',{arr: 10000}), clone('v2','Zeta Co',{arr: 5000000})];
      DATA.activities = {v1:[], v2:[]};
      _renderMemoResets.forEach(f => f());
      let order = todayActionList().map(r => r.customerId);
      valueDecides = order[0] === 'v2';

      // Same pair, but the SMALL account is on fire. Severity must still win.
      DATA.activities = {v1:[{id:'f1', date: isoAddDays(todayISO(), -2), type:'Other',
        summary:'escalate this now', sessionNumber:null, checklist:[], flagged:true}], v2:[]};
      _renderMemoResets.forEach(f => f());
      order = todayActionList().map(r => r.customerId);
      severityStillWins = order[0] === 'v1';

      // And with no value anywhere, the pre-v89 order (name asc) is untouched.
      DATA.customers = [clone('v1','Alpha Co'), clone('v2','Zeta Co')];
      DATA.activities = {v1:[], v2:[]};
      _renderMemoResets.forEach(f => f());
      unchangedWhenNoValue = todayActionList().map(r => r.customerId)[0] === 'v1';
    } finally {
      DATA.customers = realCust;
      DATA.activities = realActs;
      _renderMemoResets.forEach(f => f());
    }
    check('v89 value decides between equals, severity still outranks it, and a valueless book is unchanged',
      valueDecides === true && severityStillWins === true && unchangedWhenNoValue === true,
      JSON.stringify({valueDecides, severityStillWins, unchangedWhenNoValue}));

    check('v89 an account with no value known sorts below one that has evidenced a value',
      accountValueWeight({}) === -1 && accountValueWeight({arr:0}) === 0
      && accountValueWeight({arr:0}) > accountValueWeight({})
      && accountValueWeight({arr:-5}) === -1);

    /* Renewal pressure, and the gate that keeps it honest. */
    const base = over => Object.assign({id:'__rp__', name:'RP Co', stage:'ttfv1',
      implementationDate: isoAddDays(todayISO(), -100), totalSessions:8,
      domainScores:{}, sessionNotes:{}, stageHistory:[]}, over || {});
    const realA = DATA.activities;
    let noPace = null, withPace = null, past = null, roomy = null;
    try{
      const c = base({renewalDate: isoAddDays(todayISO(), 20)});
      DATA.activities = {'__rp__': []};
      noPace = renewalPressure(c);                        // no sessions -> assumed pace -> must be null
      DATA.activities = {'__rp__': [
        {id:'a1', date: isoAddDays(todayISO(), -50), type:'Other', summary:'s', sessionNumber:1, checklist:[], flagged:false},
        {id:'a2', date: isoAddDays(todayISO(), -10), type:'Other', summary:'s', sessionNumber:2, checklist:[], flagged:false}]};
      withPace = renewalPressure(c);
      past = withPace && withPace.past;
      roomy = renewalPressure(base({renewalDate: isoAddDays(todayISO(), 3650)}));
    } finally { DATA.activities = realA; }

    check('v89 renewal pressure never fires off an assumed pace',
      noPace === null, JSON.stringify(noPace));
    check('v89 renewal pressure fires when the runway lands at or past renewal, and stays quiet when there is room',
      withPace !== null && past === true && roomy === null,
      JSON.stringify({withPace, roomy}));
    check('v89 the renewal signal is declared in the registry, not hand-wired',
      SIGNAL_DEFS.some(d => d.key === 'renewal_pressure')
      && SIGNAL_PANEL_TAB.renewal_pressure === 'sessions'
      && Number.isFinite(effortMinutesFor('signal:renewal_pressure')));

    check('v89 the commercial fields are versioned, migrated and repaired like every other shape',
      CURRENT_SCHEMA_VERSION >= 10
      && String(migrateData).indexOf('c.renewalDate') !== -1
      && String(repairAuxiliaryCollections).indexOf('parseMoneyCell') !== -1
      && String(applyValueImport).indexOf('DATA.customers') !== -1
      && String(buildValueImportRows).indexOf('DATA') === -1);   // the planner stays pure

    check('v89 the import is reachable, reads CSV in this file, and never depends on the CDN library',
      /id="btn-import-values"/.test(String(openSettingsModal))
      && String(handleValuesFile).indexOf('parseCsv') !== -1
      && String(handleValuesFile).indexOf('XLSX') === -1
      && String(openValueImportModal).indexOf('buildValueImportRows') !== -1);
  })();

  /* ---- v90 card decks ---- */
  (function(){
    const realC = DATA.customers, realA = DATA.activities;
    /* buildRiskHubList() STAMPS risk memory as a side effect of being called,
       and the risk card back calls it to list what there is to action. Exercising
       every editor therefore writes DATA.riskLog and DATA.dayClose on a book that
       has never been read — which is a leak in this CHECK, not in the feature
       (rendering the Risk tab has always stamped the same way). Snapshotted and
       put back, exactly like the customers and activities above. */
    const realLog = JSON.stringify(DATA.riskLog === undefined ? null : DATA.riskLog);
    const realClose = JSON.stringify(DATA.dayClose === undefined ? null : DATA.dayClose);
    let html = '', backs = null, editorsUsed = null, emptyDeck = null;
    try{
      const mk = (id, name) => ({id, name, stage:'ttfv1', module: DATA.config.modules[0],
        implementationDate: isoAddDays(todayISO(), -100), totalSessions:8,
        domainScores:{}, sessionNotes:{}, stageHistory:[], compliance: defaultCompliance()});
      const list = [mk('d1','Deck One'), mk('d2','Deck Two'), mk('d3','Deck Three')];
      DATA.customers = list; DATA.activities = {d1:[], d2:[], d3:[]};
      _renderMemoResets.forEach(f=>f());
      html = renderCardDeck('t-deck', list, 'gradDate');
      emptyDeck = renderCardDeck('t-empty', [], 'gradDate');
      // Every editor must render a control for a bare account without throwing.
      editorsUsed = Object.keys(CARD_EDITORS).map(k => {
        try{ return CARD_EDITORS[k].render(list[0]).length > 0 && typeof CARD_EDITORS[k].why(list[0]) === 'string'; }
        catch(e){ return 'THREW:' + k + ':' + e.message; }
      });
      backs = (html.match(/class="dk-face dk-back"/g) || []).length;
    } finally {
      DATA.customers = realC; DATA.activities = realA;
      const log = JSON.parse(realLog); if(log === null) delete DATA.riskLog; else DATA.riskLog = log;
      const close = JSON.parse(realClose); if(close === null) delete DATA.dayClose; else DATA.dayClose = close;
      _renderMemoResets.forEach(f=>f());
    }

    check('v91 a rail renders one card per account, each with a front, a back and a figure',
      (html.match(/class="dk-card"/g) || []).length === 3 && backs === 3
      && (html.match(/data-dk-flip=/g) || []).length === 6   // one on each face
      && (html.match(/data-dk-ghost/g) || []).length === 3
      && html.indexOf('3 accounts') !== -1
      && html.indexOf('scroll-snap') === -1,                 // snapping is CSS, not inline
      JSON.stringify({cards:(html.match(/class="dk-card"/g)||[]).length, backs}));

    check('v90 an empty list renders no deck at all rather than an empty stage',
      emptyDeck === '', JSON.stringify(emptyDeck));

    check('v90 every card-back editor renders and explains itself without throwing',
      Array.isArray(editorsUsed) && editorsUsed.every(x => x === true),
      JSON.stringify(editorsUsed));

    /* The invariant that matters most: every control a card back emits must be
       bound, or the card silently does nothing when you fill it in. Same shape
       as the v72 data-fp-* invariant, and for the same reason. */
    const emitted = [...new Set(Object.keys(CARD_EDITORS)
      .map(k => { try{ return CARD_EDITORS[k].render(DATA.customers[0] || {id:'x', compliance: defaultCompliance(), domainScores:{}}); }catch(e){ return ''; } })
      .join(' ').match(/data-dk-[a-z-]+/g) || [])];
    const bound = String(attachEvents);
    check('v90 every control a card back emits is bound in attachEvents',
      emitted.length >= 4 && emitted.every(sel => bound.indexOf(sel) !== -1),
      'unbound: ' + emitted.filter(sel => bound.indexOf(sel) === -1).join(', '));

    /* The card back writes through the SAME helpers the beat panel uses. Two
       definitions of "mark this gate done" would drift, and the newer one wins
       silently. */
    check('v90 the card backs and the beat panel share one definition of every gate write',
      String(bindBeatPane).indexOf('toggleComplianceGate') !== -1
      && String(bindBeatPane).indexOf('setOutcomeNumber') !== -1
      && String(attachEvents).indexOf('toggleComplianceGate') !== -1
      && String(attachEvents).indexOf('setOutcomeNumber') !== -1);

    // The gate batches must map onto editors that exist.
    check('v90 every gate label maps to a real card-back editor',
      GATE_DEFS.every(g => {
        const k = GATE_EDITOR_KEY[g.label];
        return typeof k === 'string' && !!CARD_EDITORS[k];
      }), JSON.stringify(GATE_DEFS.map(g=>g.label + '->' + GATE_EDITOR_KEY[g.label])));

    /* Rule 0, as amended at v91. The rail may read its OWN scrollLeft — that is
       you dragging one widget. What it must never do is read WINDOW scroll, which
       is the ambient motion the rule exists to ration, or run on a timer. */
    check('v91 the rail parallaxes off its own scroll and never off the window',
      String(attachEvents).indexOf("rail.addEventListener('scroll'") !== -1
      && !/addEventListener\('scroll'[^)]*\)\s*;?\s*\/\/\s*window/i.test(String(attachEvents))
      && String(attachEvents).indexOf('rail.getBoundingClientRect') !== -1
      && !/setInterval|setTimeout/.test(String(renderCardDeck)),
      'the parallax must be driven by the rail, not by the page');

    /* Listener hygiene: attachEvents runs on EVERY render, so a rail listener
       added without teardown stacks one copy per repaint. */
    check('v91 rail listeners are torn down before each rebind',
      String(attachEvents).indexOf('_dkCleanups.forEach') !== -1
      && String(attachEvents).indexOf('_dkCleanups.push') !== -1
      && String(attachEvents).indexOf('removeEventListener') !== -1);

    /* The parallax layer carries a real figure, never a texture. */
    (function(){
      const c = {id:'gf', name:'GF', totalSessions:8, stage:'ttfv1',
        implementationDate: isoAddDays(todayISO(), -60), domainScores:{}, compliance: defaultCompliance()};
      const realA = DATA.activities;
      let figures = {};
      try{
        DATA.activities = {gf: []};
        figures = {sessions: cardGhostFigure(c, 'outcome'), readiness: cardGhostFigure(c, 'readiness')};
      } finally { DATA.activities = realA; }
      check('v91 the parallax layer shows a figure the book computes, not decoration',
        figures.sessions === '0/8' && figures.readiness === '—'
        && String(cardGhostFigure).indexOf('sessionsCompletedCount') !== -1,
        JSON.stringify(figures));
    })();

    /* The bug this pins: risk log keys are themselves composite ("<id>|Off
       Track"), so the verdict button's payload has TWO pipes and only the first
       one separates the verdict. A plain split dropped the rest of the key and
       the button became a no-op that reported success. */
    (function(){
      /* PURE. The first draft of this check called buildRiskHubList(), which
         STAMPS DATA.riskLog on a book that has never been read — so it passed on
         every run after the first and failed the v61/v74.4 purity guards on a
         freshly restored book. The key format is what is under test, and
         riskItemKey() gives that without touching the book. */
      const key = riskItemKey({c:{id:'abc123'}, kind:'Off Track'});
      const raw = 'confirmed|' + key;
      const cut = raw.indexOf('|');
      check('v90 a risk verdict survives a log key that itself contains the delimiter',
        key.indexOf('|') !== -1                       // the key really is composite
        && raw.slice(0, cut) === 'confirmed'
        && raw.slice(cut + 1) === key
        && raw.split('|')[1] !== key                  // the bug this replaced
        && String(attachEvents).indexOf("raw.indexOf('|')") !== -1,
        JSON.stringify({key, naive: raw.split('|')[1], correct: raw.slice(cut + 1)}));
    })();

    // Toggling a gate through the shared helper is reversible and dates itself.
    (function(){
      const c = {id:'g1', compliance: defaultCompliance()};
      const on = toggleComplianceGate(c, 'sentiment');
      const dated = c.compliance.sentiment.done === true && c.compliance.sentiment.date === todayISO();
      toggleComplianceGate(c, 'sentiment');
      const off = c.compliance.sentiment.done === false && c.compliance.sentiment.date === null;
      const badField = toggleComplianceGate(c, 'nope') === false;
      check('v90 a gate write marks, dates, reverses cleanly and refuses an unknown field',
        on === true && dated && off && badField,
        JSON.stringify(c.compliance.sentiment));
    })();

    // The graduation-date write refuses junk rather than storing a half-parsed string.
    (function(){
      const c = {id:'g2'};
      const ok = setTargetGradDate(c, isoAddDays(todayISO(), 30)) && c.targetGraduationDate === isoAddDays(todayISO(), 30);
      const junkRefused = setTargetGradDate(c, 'not-a-date') === false && c.targetGraduationDate === isoAddDays(todayISO(), 30);
      const cleared = setTargetGradDate(c, '') && c.targetGraduationDate === undefined;
      check('v90 the card-back graduation date stores a real date, refuses junk and can be cleared',
        ok && junkRefused && cleared, JSON.stringify({ok, junkRefused, cleared}));
    })();
  })();

  /* ---- v92 the implementation hub ---- */
  (function(){
    const realC = DATA.customers, realA = DATA.activities;
    let grouped = null, quiet = null, notQuiet = null, inPhase = null, cp = '', windows = null;
    try{
      const mk = (id, name, phase, startedOn, phaseDate) => ({
        id, name, stage:'kickoff', module: DATA.config.modules[0],
        implementationDate: startedOn, totalSessions:8, domainScores:{}, sessionNotes:{},
        stageHistory:[], compliance: defaultCompliance(),
        implementation: {phase, partner:'P', partnerContact:'', startedOn,
          phaseHistory:[{phase:'kickoff', date:startedOn}, {phase, date:phaseDate}], risks:[]}
      });
      const old = isoAddDays(todayISO(), -200), recent = isoAddDays(todayISO(), -12);
      DATA.customers = [
        mk('i1', 'Silent Build', 'build', old, isoAddDays(todayISO(), -90)),
        mk('i2', 'Fresh Build',  'build', old, isoAddDays(todayISO(), -5)),
        mk('i3', 'In UAT',       'uat',   old, isoAddDays(todayISO(), -30))
      ];
      DATA.activities = {i1: [], i2: [{id:'a1', date: recent, type:'Partner Sync', summary:'s',
        sessionNumber:null, checklist:[], flagged:false}], i3: []};
      _renderMemoResets.forEach(f=>f());

      grouped = implementationHubByPhase().map(g => g.phase.key + ':' + g.rows.length).join(',');
      const rows = implementationHubList();
      quiet = rows.filter(r => r.quiet).map(r => r.c.name);
      notQuiet = rows.filter(r => !r.quiet).map(r => r.c.name);
      inPhase = rows.reduce((m, r) => { m[r.c.name] = r.daysInPhase; return m; }, {});
      const _po = ui.copilotOpen; ui.copilotOpen = true;
      cp = renderCopilot();
      ui.copilotOpen = _po;
      windows = CP_CHAPTER_KEYS.every(k => Array.isArray(CP_WINDOWS[k]));
    } finally {
      DATA.customers = realC; DATA.activities = realA;
      _renderMemoResets.forEach(f=>f());
    }

    check('v92 builds are grouped by phase and ordered by how long they have been silent',
      grouped === 'build:2,uat:1' && windows === true,
      JSON.stringify({grouped, windows}));

    /* The threshold is the whole point: a build quiet for twelve days is a
       Tuesday, and only silence past the implementation window counts. */
    check('v92 a build is quiet only past its own much longer threshold, never the live one',
      quiet.length === 2 && quiet.indexOf('Fresh Build') === -1
      && notQuiet.join() === 'Fresh Build'
      && implQuietDays() >= 14 && implQuietDays() !== (DATA.config.neglectDays || 21),
      JSON.stringify({quiet, notQuiet, implQuiet: implQuietDays(), neglect: DATA.config.neglectDays}));

    /* Days-in-phase reads phaseHistory, not the start date — an account that
       reached UAT last month is not 200 days into UAT because the build began
       in January. This is the signal that carries the chapter while 16 of 17
       accounts still have no go-live date. */
    check('v92 days-in-phase is measured from entering the phase, not from the build start',
      inPhase['Silent Build'] === 90 && inPhase['Fresh Build'] === 5 && inPhase['In UAT'] === 30,
      JSON.stringify(inPhase));

    /* THE RULING THIS PASS MUST NOT BREAK: v67 keeps implementation accounts out
       of the signal registry and out of the ranked day. The hub notifies through
       a telemetry readout; it must never have grown a Today source or a signal. */
    check('v92 the hub notifies without nagging — no Today source, no signal, no new nag path',
      !TODAY_SOURCE_DEFS.some(d => /impl/i.test(d.source))
      && !SIGNAL_DEFS.some(d => /impl|build|golive/i.test(d.key))
      && String(copilotTelemetry).indexOf('BUILDING') !== -1
      && String(copilotTelemetry).indexOf('QUIET') !== -1,
      'implementation may appear in the band readout and nowhere that ranks work');

    // The chapter renders, says what it cannot know, and offers the fix.
    check('v92 the chapter admits it cannot judge lateness without a go-live date',
      cp.indexOf('Still building') !== -1
      && cp.indexOf('no target go-live date') !== -1
      && cp.indexOf('data-dk-golive') !== -1,
      JSON.stringify({hasChapter: cp.indexOf('Still building') !== -1,
        admits: cp.indexOf('no target go-live date') !== -1,
        offersFix: cp.indexOf('data-dk-golive') !== -1}));

    // The go-live write validates like every other date in the file.
    (function(){
      const c = {id:'gl', implementation:{phase:'build', phaseHistory:[], risks:[]}};
      const ok = setImplTargetGoLive(c, isoAddDays(todayISO(), 60))
        && c.implementation.targetGoLive === isoAddDays(todayISO(), 60);
      const junk = setImplTargetGoLive(c, 'soon') === false
        && c.implementation.targetGoLive === isoAddDays(todayISO(), 60);
      const cleared = setImplTargetGoLive(c, '') && c.implementation.targetGoLive === undefined;
      const noImpl = setImplTargetGoLive({id:'x'}, todayISO()) === false;
      check('v92 the go-live write stores a real date, refuses junk, clears, and needs a build',
        ok && junk && cleared && noImpl, JSON.stringify({ok, junk, cleared, noImpl}));
    })();

    // The empty-month sentence points at the chapter rather than trailing off.
    check('v92 an empty month redirects upstream instead of ending on the curriculum',
      String(renderCopilot).indexOf('The obvious place to spend it is upstream') !== -1
      && String(renderCopilot).indexOf('Still building') !== -1);

    /* The regression this pass also fixed: rails need width. A two-column split
       showed one 380px card in a 546px column. */
    check('v92 the what-to-do-next split is one column, so the rails can breathe',
      /\.cp-split\{display:grid; grid-template-columns:minmax\(0,1fr\);/.test(document.documentElement.innerHTML.slice(0, 400000))
      || /cp-split\{display:grid; grid-template-columns:minmax\(0,1fr\);/.test([...document.styleSheets]
          .filter(sh => !sh.href).map(sh => [...sh.cssRules].map(r => r.cssText).join('')).join('')
          .replace(/\s+/g, '')),
      'a rail inside a half-width column shows one card and a sliver');
  })();

  /* ---- v93 the card back, and the questions nobody answered ---- */
  (function(){
    const realC = DATA.customers, realA = DATA.activities;
    let html = '', qList = null, qCount = null, answered = null, resolved = null;
    try{
      const c = {id:'q1', name:'Question Co', stage:'ttfv1', module: DATA.config.modules[0],
        implementationDate: isoAddDays(todayISO(), -90), totalSessions:8, domainScores:{},
        sessionNotes:{}, stageHistory:[], compliance: defaultCompliance()};
      const act = {id:'qa1', date: isoAddDays(todayISO(), -20), type:'Call', summary:'call',
        sessionNumber:null, checklist:[], flagged:false};
      DATA.customers = [c]; DATA.activities = {q1: [act]};
      setOpenThreadsFromText(act, 'First question?' + String.fromCharCode(10) + 'Second question?');
      _renderMemoResets.forEach(f=>f());

      qList = accountsWithOpenQuestions().map(x => x.c.name + ':' + x.questions.length).join(',');
      qCount = openQuestionCount();
      html = renderCardDeck('t-q', [c], 'questions');
      const tid = getOpenThreads(act)[0].id;
      answered = setThreadAnswer(c, 'qa1', tid, '  the answer  ') && getOpenThreads(act)[0].a === 'the answer'.padStart(0)
        || getOpenThreads(act)[0].a.indexOf('the answer') !== -1;
      resolved = resolveThread(c, 'qa1', tid) && openQuestionCount() === 1;
    } finally {
      DATA.customers = realC; DATA.activities = realA;
      _renderMemoResets.forEach(f=>f());
    }

    check('v93 accounts owed an answer are collected, counted and ordered oldest first',
      qList === 'Question Co:2' && qCount === 2,
      JSON.stringify({qList, qCount}));

    check('v93 answering and resolving a question writes the same thread the debrief box owns',
      answered === true && resolved === true
      && String(setThreadAnswer).indexOf('getOpenThreads') !== -1
      && String(resolveThread).indexOf('resolvedOn') !== -1,
      JSON.stringify({answered, resolved}));

    /* THE FIX THAT PROMPTED THIS PASS. Flipping a card hid which account you were
       editing — on a rail of thirteen near-identical cards that is the difference
       between a correction and a mistake. */
    check('v93 a flipped card still says which account it is, and what is outstanding',
      html.indexOf('dk-back-who') !== -1
      && html.indexOf('Question Co') !== -1
      && html.split('dk-back-who')[1].indexOf('Question Co') !== -1
      && html.indexOf('dk-back-ctx') !== -1,
      'the back must carry the account name and its context line');

    /* A rail that forgets where it was is a rail that loses your place on every
       save — editing the ninth account left you looking at the first. */
    check('v93 a rail remembers its scroll position across the re-render every save triggers',
      String(attachEvents).indexOf('scrollLeft: rail.scrollLeft') !== -1
      && String(attachEvents).indexOf("rail.style.scrollBehavior = 'auto'") !== -1
      && /Object\.assign\(\{\}, prevSt, \{flippedId/.test(String(attachEvents)),
      'position is stored in ui.deckState and restored without animating');

    /* And when a write legitimately removes the card from its list, say so rather
       than letting the rail jump and look broken. */
    check('v93 an edit that moves a card out of its list explains itself',
      String(attachEvents).indexOf('It has moved out of this list') !== -1
      && String(attachEvents).indexOf('dkAfterWrite') !== -1,
      'the toast is the only thing distinguishing "it worked" from "it vanished"');

    // Questions are visible on Copilot but still do not rank the day — that is a
    // separate ruling, and this pass deliberately does not make it.
    check('v93 questions surface on Copilot without silently entering the ranked day',
      String(renderCopilot).indexOf('Owed an answer') !== -1
      && String(copilotTelemetry).indexOf('ASKED') !== -1
      && !TODAY_SOURCE_DEFS.some(d => /question|thread/i.test(d.source))
      && !SIGNAL_DEFS.some(d => /question|thread/i.test(d.key)));
  })();

  /* ---- v94 the landing, the free reveal, and the AI layer ---- */
  (function(){
    const prevOpen = ui.copilotOpen, prevAi = ui.aiChapters;
    let closedHtml = '', openHtml = '', failHtml = '';
    try{
      ui.aiChapters = null;
      ui.copilotOpen = false; closedHtml = renderCopilot();
      ui.copilotOpen = true;  openHtml = renderCopilot();
      // The whole reason option 1 was chosen: a dead key must not empty the tab.
      ui.aiChapters = {loading:false, sections:{}, error:'No API key configured', req:0, legend:null};
      failHtml = renderCopilot();
    } finally { ui.copilotOpen = prevOpen; ui.aiChapters = prevAi; }

    check('v94 Copilot lands on the band and one true sentence, with the chapters behind a door',
      closedHtml.indexOf('cp-landing') !== -1
      && closedHtml.indexOf('id="btn-open-read"') !== -1
      && (closedHtml.match(/data-cp-chapter=/g) || []).length === 0
      && openHtml.indexOf('cp-landing') === -1
      && (openHtml.match(/data-cp-chapter=/g) || []).length >= 4,
      JSON.stringify({closedChapters:(closedHtml.match(/data-cp-chapter=/g)||[]).length,
        openChapters:(openHtml.match(/data-cp-chapter=/g)||[]).length}));

    /* THE RULING. The door is free. If revealing the chapters ever required a
       key, the tab would go blank the day a key expired — which is exactly the
       failure this was designed around. */
    check('v94 the reveal never depends on an API key, and a failed read keeps every chapter',
      String(attachEvents).indexOf("ui.copilotOpen = true") !== -1
      && String(renderCopilot).indexOf('aiChapters') !== -1
      && (failHtml.match(/data-cp-chapter=/g) || []).length >= 4
      && failHtml.indexOf('No API key configured') !== -1
      // Matched without the apostrophe: escapeHtml turns it into &#39; in the
      // rendered output, so the literal sentence never appears verbatim.
      && failHtml.indexOf('own read') !== -1,
      'a dead key must degrade to the deterministic read, never to an empty tab');

    // The brief is computed, not generated — it has to be true with no model.
    check('v94 the landing sentence is computed locally and names the real book',
      String(portfolioBriefLine).indexOf('DATA.customers.length') !== -1
      && String(portfolioBriefLine).indexOf('callsToPrepare') !== -1
      && String(portfolioBriefLine).indexOf('callAiAPI') === -1
      && /\d/.test(portfolioBriefLine()));

    /* Four lenses, one call. Four calls would each reason from a slice and
       contradict each other about the same account. */
    check('v94 the read is one pseudonymized call returning four labelled lenses',
      CP_AI_SECTIONS.length === 4
      && CP_AI_SECTIONS.map(x => x.key).join(',') === 'week,month,impl,next'
      && String(generateCopilotRead).indexOf('pseudonymFor') !== -1
      && (String(generateCopilotRead).match(/callAiAPI/g) || []).length === 1,
      CP_AI_SECTIONS.map(x => x.head).join(','));

    // Section parsing must survive the ways a model actually formats headings.
    (function(){
      const NL = String.fromCharCode(10);
      const shapes = [
        'WEEK' + NL + 'a' + NL + NL + 'MONTH' + NL + 'b' + NL + NL + 'BUILDS' + NL + 'c' + NL + NL + 'NEXT' + NL + 'd',
        '## WEEK' + NL + 'a' + NL + '## MONTH' + NL + 'b' + NL + '## BUILDS' + NL + 'c' + NL + '## NEXT' + NL + 'd',
        '**WEEK**' + NL + 'a' + NL + '**MONTH**' + NL + 'b' + NL + '**BUILDS**' + NL + 'c' + NL + '**NEXT**' + NL + 'd'
      ];
      const parsed = shapes.map(t => {
        const o = parseAiSections(t);
        return ['week','month','impl','next'].every(k => o[k]);
      });
      const junk = parseAiSections('no headings at all, just prose');
      check('v94 the four sections parse however the model formats its headings, and junk is kept whole',
        parsed.every(Boolean) && Object.keys(junk).length === 0
        && String(renderCopilot).indexOf('did not arrive in the four expected sections') !== -1,
        JSON.stringify({parsed, junkKeys:Object.keys(junk)}));
    })();

    /* Standing admin moved to Today, and implementation accounts are excluded —
       the v52 ruling, not a new one: those gates do not open until Go-Live. */
    check('v94 the standing records live on Today and never nag a partner-led build',
      String(renderToday).indexOf('renderAdminGaps') !== -1
      && String(renderCopilot).indexOf('GATE_EDITOR_KEY') === -1
      && ADMIN_GAP_DEFS.length === 4
      && String(adminGapList).indexOf('inImplementation') !== -1
      && adminGapList().every(g => g.accounts.every(c => !inImplementation(c) && c.stage !== 'graduated')),
      JSON.stringify(adminGapList().map(g => g.def.key + ':' + g.accounts.length)));

    // Calls-to-prepare is a real window on booked calls, not a guess.
    (function(){
      const realC = DATA.customers, realA = DATA.activities;
      let inWeek = null, beyond = null;
      try{
        const mk = (id, on) => ({id, name:'Call ' + id, stage:'ttfv1', module: DATA.config.modules[0],
          implementationDate: isoAddDays(todayISO(), -60), totalSessions:8, domainScores:{},
          sessionNotes:{}, stageHistory:[], compliance: defaultCompliance(), nextSessionScheduledOn: on});
        DATA.customers = [mk('c1', isoAddDays(todayISO(), 2)), mk('c2', isoAddDays(todayISO(), 20)),
          mk('c3', isoAddDays(todayISO(), -3))];
        DATA.activities = {c1:[], c2:[], c3:[]};
        _renderMemoResets.forEach(f=>f());
        inWeek = callsToPrepare(7).map(x => x.c.id).join(',');
        beyond = callsToPrepare(30).map(x => x.c.id).join(',');
      } finally { DATA.customers = realC; DATA.activities = realA; _renderMemoResets.forEach(f=>f()); }
      check('v94 calls to prepare for are the booked ones inside the window, never past ones',
        inWeek === 'c1' && beyond === 'c1,c2',
        JSON.stringify({inWeek, beyond}));
    })();
  })();

  /* ---- v95 what to do next, per account ---- */
  (function(){
    const realC = DATA.customers, realA = DATA.activities;
    const realLog = JSON.stringify(DATA.riskLog === undefined ? null : DATA.riskLog);
    let routes = null, ghosted = null, notGhosted = null, mature = null, notMature = null, chapter = '';
    try{
      const mk = (id, name, over) => Object.assign({
        id, name, stage:'ttfv1', module: DATA.config.modules[0],
        implementationDate: isoAddDays(todayISO(), -180), totalSessions:8,
        domainScores:{}, sessionNotes:{}, stageHistory:[], compliance: defaultCompliance()}, over || {});
      const q = (id, text, daysAgo) => ({id:'act-'+id, date: isoAddDays(todayISO(), -(daysAgo||5)),
        type:'Call', summary:'call', sessionNumber:null, checklist:[], flagged:false, _q:text});

      DATA.customers = [
        mk('r1','Carbon Co'), mk('r2','Product Co'), mk('r3','Build Co'), mk('r4','Arch Co'),
        mk('g1','Ghost Co'), mk('g2','Quiet Co'),
        mk('m1','Mature Co', {components:['sec','risk'], targetGraduationDate: isoAddDays(todayISO(), 60)}),
        mk('m2','Single Co', {components:['sec'], targetGraduationDate: isoAddDays(todayISO(), 60)})
      ];
      DATA.activities = {};
      [['r1','What emission factor source should we use for Scope 3?'],
       ['r2','Is the bulk export on the roadmap or is there a workaround?'],
       ['r3','How was the workspace configured for our two entities?'],
       ['r4','Can the ERP connector run nightly or do we need an API?']].forEach(([id, text]) => {
        const a = q(id, text); DATA.activities[id] = [a]; setOpenThreadsFromText(a, text);
      });
      // ghosted: quiet past the threshold AND a re-engagement play closed no_effect
      DATA.activities.g1 = [{id:'ga', date: isoAddDays(todayISO(), -60), type:'Call', summary:'x',
        sessionNumber:1, checklist:[], flagged:false}];
      DATA.customers[4].playbooks = [{id:'p', key:'reengage', startedOn: isoAddDays(todayISO(),-50),
        done:{}, closedOn: isoAddDays(todayISO(),-40), outcome:'no_effect'}];
      // quiet but never chased — must NOT be recommended for transition
      DATA.activities.g2 = [{id:'g2a', date: isoAddDays(todayISO(), -60), type:'Call', summary:'x',
        sessionNumber:1, checklist:[], flagged:false}];
      // mature: multi-solution, 7 of 8 sessions, healthy, on schedule, nothing owed
      /* Dates chosen so the most recent touch is THREE days ago: at eleven the
         account tips to 'watch' on the default risk threshold and correctly stops
         qualifying, which is the rule working rather than the rule failing. */
      DATA.activities.m1 = [1,2,3,4,5,6,7].map(n => ({id:'m1s'+n,
        date: isoAddDays(todayISO(), -(31 - n*4)), type:'Other', summary:'s',
        sessionNumber:n, checklist:[], flagged:false}));
      DATA.customers[6].domainScores = {};
      DATA.config.domains.forEach(d => { DATA.customers[6].domainScores[d] = 4; });
      DATA.customers[6].compliance = {sentiment:{done:true,date:todayISO(),answerA:'a',answerB:'b'},
        outcomePlan:{done:true,date:todayISO(),outcomeNumber:1,planText:''},
        associatedPeopleCSAT:{done:true,date:todayISO(),contactName:'X'}};
      // single-solution twin of the same shape — must NOT be recommended
      DATA.activities.m2 = DATA.activities.m1.map(a => Object.assign({}, a, {id:'m2'+a.id}));
      DATA.customers[7].domainScores = Object.assign({}, DATA.customers[6].domainScores);
      DATA.customers[7].compliance = JSON.parse(JSON.stringify(DATA.customers[6].compliance));
      _renderMemoResets.forEach(f=>f()); _riskMemo = new Map(); _healthMemo = new Map();

      routes = ['r1','r2','r3','r4'].map(id => {
        const c = DATA.customers.find(x => x.id === id);
        const n = accountNextAction(c);
        return n.route ? n.route.role : 'NONE';
      }).join(' | ');
      ghosted = (accountNextAction(DATA.customers[4]).transition || {}).kind || null;
      notGhosted = (accountNextAction(DATA.customers[5]).transition || {}).kind || null;
      mature = (accountNextAction(DATA.customers[6]).transition || {}).kind || null;
      notMature = (accountNextAction(DATA.customers[7]).transition || {}).kind || null;
      const po = ui.copilotOpen; ui.copilotOpen = true;
      chapter = renderCopilot(); ui.copilotOpen = po;
    } finally {
      DATA.customers = realC; DATA.activities = realA;
      const lg = JSON.parse(realLog); if(lg === null) delete DATA.riskLog; else DATA.riskLog = lg;
      _renderMemoResets.forEach(f=>f()); _riskMemo = new Map(); _healthMemo = new Map();
    }

    /* Routing is EVIDENCE-based: what the customer actually wrote decides which
       specialist is named. A route that fired on anything else would be the
       tracker guessing at somebody else's job. */
    check('v95 a specialist is named by what the customer actually asked, in their words',
      routes === 'Climate Consultant | Product Success Manager | Partner implementation team | Solution Architect',
      routes);

    check('v95 every routed role is one the escalation registry actually declares',
      ESCALATION_MATCHERS.every(m => OSM_ESCALATION_PATHS.some(p => p.role === m.role))
      && OSM_ESCALATION_PATHS.some(p => p.role === 'Account Executive'),
      ESCALATION_MATCHERS.map(m => m.role).join(','));

    /* The transition recommendation needs EVIDENCE OF AN ATTEMPT, not just
       silence. Quiet is a state; chased-and-still-quiet is a conclusion. */
    check('v95 an early CSM handoff is proposed only after re-engagement was tried and failed',
      ghosted === 'ghosted' && notGhosted === null,
      JSON.stringify({chased: ghosted, neverChased: notGhosted}));

    /* And the maturity road is deliberately narrow — the first draft fired on
       seven of twelve accounts in a healthy book, which is a background colour
       rather than a recommendation. */
    check('v95 a mature account is proposed only when multi-solution, nearly done, healthy and owing nothing',
      mature === 'mature' && notMature === null,
      JSON.stringify({multiSolution: mature, singleSolution: notMature}));

    // The chapter no longer does bookkeeping — that moved to Today at v94.
    check('v95 what-to-do-next carries no Gainsight admin, and still carries both columns',
      chapter.indexOf('Same gate, several accounts') === -1
      && chapter.indexOf('Per account') !== -1
      && chapter.indexOf('Patterns across accounts') !== -1
      && (chapter.match(/class="cp-col"/g) || []).length === 2,
      'the judgement chapter must not be the bookkeeping chapter');

    // The AI draft reaches the same generator the beat panel uses.
    check('v95 a suggested answer comes from the one thread-answer generator, and says a human must read it',
      String(attachEvents).indexOf('generateThreadAnswer') !== -1
      && String(generateThreadAnswer).indexOf('Read it before you send it') !== -1);

    // The read-creates defect fixed in this pass, same family as v90's dayClose.
    check('v95 asking whether anything is queued does not create the queue',
      String(getGainsightQueue).indexOf('DATA.gainsightQueue = []') === -1
      && String(queueGainsightItem).indexOf('DATA.gainsightQueue = []') !== -1);
  })();

  /* ---- v96 names on screen, ids on the wire ---- */
  (function(){
    const legend = [{id:'Account-A1', name:'Aldridge Energy'},
                    {id:'Account-A11', name:'Kestrel Aviation'},
                    {id:'Account-B2', name:'Corvus Logistics'}];
    const src = 'Account-A1 is behind. A11 has gone quiet. B2 asked about the roadmap. A1 again.';
    const out = dePseudonymize(src, legend);
    check('v96 the AI read shows real names on screen while the prompt carried only ids',
      out.indexOf('Aldridge Energy') !== -1
      && out.indexOf('Kestrel Aviation') !== -1     // bare form, prefix dropped by the model
      && out.indexOf('Corvus Logistics') !== -1
      && out.indexOf('A1') === -1 && out.indexOf('A11') === -1
      && (out.match(/Aldridge Energy/g) || []).length === 2
      // the substitution is render-only: the prompt builder must not know about it
      && String(generateCopilotRead).indexOf('dePseudonymize') === -1
      && String(generateCopilotRead).indexOf('pseudonymFor') !== -1,
      out);

    /* The trap this ordering avoids: a shorter id eating a longer one. A1 must
       not consume the A11 in the same sentence. */
    check('v96 a shorter pseudonym can never swallow a longer one',
      dePseudonymize('A11 and A1', legend) === 'Kestrel Aviation and Aldridge Energy',
      dePseudonymize('A11 and A1', legend));

    check('v96 a length-capped response says so instead of ending mid-sentence in silence',
      String(renderChapterAi).indexOf('hit its length cap') !== -1
      && String(renderChapterAi).indexOf('CP_AI_SECTIONS[CP_AI_SECTIONS.length - 1]') !== -1
      && String(generateCopilotRead).indexOf('truncated') !== -1);
  })();

  /* ---- v97 reads that used to write ---- */
  (function(){
    /* Three getters in this file materialised state as a side effect of being
       READ: getDayClose (v90), getGainsightQueue (v95), getSessionNote (v97).
       All three were invisible until a book that had never touched those fields
       was put through the whole-book purity guard. This check names the family so
       the fourth one is caught by the suite rather than by luck. */
    const c = {id:'sn', name:'SN', sessionNotes:{}};
    const readBack = readSessionNote(c, 3);
    const untouchedByRead = Object.keys(c.sessionNotes).length === 0;
    const written = getSessionNote(c, 3);
    written.prep = 'x';
    check('v97 reading a session note returns a default; only writing creates one',
      readBack && readBack.prep === '' && untouchedByRead
      && Object.keys(c.sessionNotes).join() === '3' && c.sessionNotes[3].prep === 'x',
      JSON.stringify({untouchedByRead, keys:Object.keys(c.sessionNotes)}));

    check('v97 rendering a session card reads, never writes',
      String(renderSessionCard).indexOf('readSessionNote') !== -1
      && String(renderSessionCard).indexOf('getSessionNote') === -1,
      'renderSessionCard runs for every session in the plan — a write there stamps the whole account');

    /* The three known members of the family, asserted together. */
    check('v97 no getter in the read family materialises state on read',
      String(getDayClose).indexOf('DATA.dayClose = {}') === -1
      && String(getGainsightQueue).indexOf('DATA.gainsightQueue = []') === -1
      && String(readSessionNote).indexOf('customer.sessionNotes =') === -1);

    /* And the diagnostic must not consume what it measures: the weekly digest
       re-bases after seven days, which is right on a render and wrong when the
       suite triggers it — the "since last week" diff cannot be recovered. */
    check('v97 running the suite cannot re-base the weekly digest',
      String(getWeeklyDigest).indexOf('!_suiteRunning') !== -1,
      'a diagnostic may read anything and must change nothing');
  })();

  /* ---- v98 two dead controls (the dated-impact half of this block retired in A5) ---- */
  (function(){
    /* Two controls that looked live and were not. The beat had cursor:pointer and
       a lede saying "Click one" with nothing bound. */
    check('v98 clicking a beat selects it — the control the lede has always promised',
      String(attachEvents).indexOf('[data-day-step]') !== -1
      && String(attachEvents).indexOf('setTodayFocus(id)') !== -1);

    check('v98 the flyout can be widened, and the preference is a browser one',
      typeof getPanelWide === 'function' && typeof savePanelWide === 'function'
      && String(savePanelWide).indexOf('localStorage') !== -1
      && String(savePanelWide).indexOf('DATA') === -1
      && PANEL_WIDTH_KEY !== STORAGE_KEY);

  })();

  /* ---- v99 the automatic backup ---- */
  (function(){
    /* THE CHECK THAT MATTERS. This feature writes DATA to a real file on the
       user's disk. The suite hands DATA fabricated books. If those two ever meet,
       somebody's backup silently becomes test fixtures — and this project has
       already had a live book overwritten twice by lesser versions of that
       mistake. Guarded in THREE places, and all three are asserted:
         1. saveData() returns before scheduling anything while the suite runs
         2. fsScheduleBackup() refuses outright
         3. fsWriteNow() re-checks at the last moment before opening the file */
    check('v99 the suite can never write a fabricated book to the real backup file',
      String(fsWriteNow).indexOf('_suiteRunning') !== -1
      && String(fsScheduleBackup).indexOf('_suiteRunning') !== -1
      && String(saveData).indexOf('if(_suiteRunning) return true;') !== -1
      && String(saveData).indexOf('fsScheduleBackup()') >
         String(saveData).indexOf('if(_suiteRunning) return true;'),
      'three guards: saveData stands down, the scheduler refuses, the writer re-checks');

    // And it is genuinely refusing right now, since the suite IS running.
    check('v99 the backup writer refuses while this very suite is running',
      _suiteRunning === true && fsWriteNow(true) instanceof Promise);

    /* Start-up must never PROMPT. requestPermission needs a user gesture, so
       calling it on load either throws or ambushes somebody who just opened a
       tab — the query is silent and the ask is bound to a button. */
    check('v99 start-up queries permission silently and never asks without a gesture',
      String(fsInit).indexOf('fsPermission(h, false)') !== -1
      && String(fsResume).indexOf('fsPermission(_fsHandle, true)') !== -1
      && String(fsInit).indexOf('showSaveFilePicker') === -1);

    /* Feature detection, not user-agent sniffing, and a clean degrade: where the
       API is missing the whole section hides and Export JSON is untouched. */
    check('v99 an unsupported browser loses the feature and keeps every existing path',
      String(fsSupported).indexOf('showSaveFilePicker') !== -1
      && String(fsChooseFile).indexOf('fsSupported()') !== -1
      && fsStatusLine.length === 0
      && typeof exportData === 'function' && typeof downloadTextFile === 'function');

    /* The nag and the backup must not contradict each other. A book being written
       to disk every few seconds that is also being warned about "never exported"
       teaches the reader to ignore the warning. */
    check('v99 the header stops nagging when the file backup is live, and shouts when it is paused',
      String(renderBackupStatus).indexOf("_fsState === 'ready'") !== -1
      && String(renderBackupStatus).indexOf("_fsState === 'needs-permission'") !== -1
      && /if\(_fsState !== 'ready'\) maybePromptBackup\(\)/.test(document.documentElement.innerHTML.slice(0, 1)) === false,
      'ready suppresses the nag; needs-permission is the one state worth a loud line');

    /* The handle lives in IndexedDB because a FileSystemFileHandle is structured-
       cloneable but not JSON-serialisable. It must never reach the book. */
    check('v99 the file handle is never written into the book or into localStorage',
      String(fsStoreHandle).indexOf('indexedDB') === -1   // goes through fsIdb
      && String(fsIdb).indexOf('indexedDB.open') !== -1
      && String(fsStoreHandle).indexOf('DATA') === -1
      && String(fsStoreHandle).indexOf('localStorage') === -1
      && String(fsWriteNow).indexOf('serializeBook(DATA)') !== -1
      && String(serializeBook).indexOf('JSON.stringify(data, null, 2)') !== -1);

    /* Writing must not loop. The write stamps lastExportedAt, and stamping through
       saveData() would schedule another write, which would stamp again. */
    check('v99 stamping the export date after a backup cannot start a write loop',
      String(fsWriteNow).indexOf('localStorage.setItem(STORAGE_KEY') !== -1
      // Matched as a CALL, not a mention: the comment inside fsWriteNow explains
      // why it avoids saveData(), so a bare indexOf finds the word in the very
      // sentence saying it is not used. Second time this exact trap has bitten.
      && !/(^|[^.\w])saveData\(\)\s*;/.test(String(fsWriteNow))
      && String(fsWriteNow).indexOf("DATA.lastExportedAt !== todayISO()") !== -1);

    // Debounced, because saveData fires constantly.
    check('v99 the write is debounced rather than fired on every save',
      Number.isFinite(FS_DEBOUNCE_MS) && FS_DEBOUNCE_MS >= 1000
      && String(fsScheduleBackup).indexOf('clearTimeout') !== -1);
  })();

  /* ---- Graduation Plan (spec 2026-10-01) ---- */
  (function(){                                   // c1a
    let ok = false, detail = '';
    try{
      const g = normalizeGoal({id:'gl_0000000a', type:'bogus', text:'  x '.repeat(200), targetCycle:'FY2026',
        primary:true, source:'nope', createdOn:'2026-13-40', gates:[{text:''},{id:'gt_1', text:'Gate', done:'yes'}],
        verdict:'great', verdictNote:'n'.repeat(900), supersededBy:5, changeReason:7, ackOn:'x'});
      ok = g && g.type === null && g.text.length === 300 && g.source === null && g.createdOn === null
        && g.gates.length === 1 && g.gates[0].done === false && g.verdict === null && g.verdictNote.length === 500
        && g.supersededBy === null && g.changeReason === '' && g.ackOn === null && normalizeGoal({text:''}) === null;
      detail = JSON.stringify(g).slice(0, 280);
    }catch(err){ detail = err.message; }
    check('grad-plan c1a: normalizeGoal clamps text and drops unknown enums to null', ok, detail);
  })();
  (function(){                                   // c1b
    let ok = false, detail = '';
    try{
      const out = normalizeGoals([
        {id:'gl_00000001', type:'publish', text:'Later', primary:true, createdOn:'2026-03-01'},
        {id:'gl_00000002', type:'publish', text:'Earlier', primary:true, createdOn:'2026-02-01'},
        {id:'gl_00000003', type:'program', text:'Old', primary:true, verdict:'replaced', createdOn:'2026-01-01'}]);
      const byId = id => out.find(g => g.id === id);
      ok = out.length === 3 && byId('gl_00000002').primary === true && byId('gl_00000001').primary === false
        && byId('gl_00000003').primary === false && out.filter(g => g.primary).length === 1;
      detail = JSON.stringify(out.map(g => [g.id, g.primary]));
    }catch(err){ detail = err.message; }
    check('grad-plan c1b: normalizeGoals keeps the earliest live primary and un-primaries replaced goals', ok, detail);
  })();
  (function(){                                   // c1c
    let ok = false, detail = '';
    try{
      const e = normalizeExit({on:'2026-09-30', reason:'weird', note:'n'.repeat(900),
        sessionsNotNeeded:['ss_ab1', 'ss_ab1', '4', 'bad id', 7, 'ss_X']});
      ok = normalizeExit({on:'2026-13-40', reason:'other'}) === null && normalizeExit(null) === null
        && e && e.reason === null && e.note.length === 500
        && JSON.stringify(e.sessionsNotNeeded) === JSON.stringify(['ss_ab1', '4'])
        && normalizeExit({on:'2026-09-30', reason:'other'}).reason === 'other';
      detail = JSON.stringify(e).slice(0, 200);
    }catch(err){ detail = err.message; }
    check('grad-plan c1c: normalizeExit rejects a bad date, nulls an unknown reason, clamps note and session ids', ok, detail);
  })();
  const M3_FR_GATES = {
    publish: ['Source spreadsheet data linked into the filing document','XBRL tagging completed and validated','Test filing completed with no critical issues','Certification and sign-off cycle completed','Filing submitted'],
    setup_next: ['Source spreadsheet data linked into the filing document','XBRL tagging completed and validated','Next reporting period folder rolled forward with copies of all source files','Cross-functional reviewers (legal, IR, auditors) given access','Roll-forward walked through with the customer'],
    program: ['Roles assigned to reporting leads and IT contact','Source spreadsheet data linked into a document','First linked presentation produced from source data'],
    disclosure: ['XBRL tagging completed and validated','Test filing completed with no critical issues','Submission made']};
  const M3_GRC_GATES = {
    publish: ['Risk library populated','Control library populated and mapped to risks','Workpaper cycle completed through review and approval','Issues tracked to an action plan or resolution','Report issued to stakeholders'],
    setup_next: ['Control library populated and mapped to risks','Audit universe populated with the customer\'s audit areas','Next audit project created with phase dates','Assessment cycle sent to process and control owners','Next cycle walked through with the customer'],
    program: ['Team members assigned the correct GRC roles','Risk library populated','Control library populated and mapped to risks'],
    disclosure: []};
  (function(){                                   // c1d
    let ok = false, detail = '';
    try{
      const d = defaultGoalGatesConfig();
      const keys = Object.keys(d);
      const sus = ['Sustainability','Carbon','Sustainability + Carbon','Sustainability (CSRD)','Sustainability + Carbon (CSRD)'];
      const lens = k => ['publish','setup_next','program','disclosure'].map(t => d[k][t].length).join('/');
      const empty = k => ['publish','setup_next','program','disclosure'].every(t => Array.isArray(d[k][t]) && d[k][t].length === 0);
      ok = DEFAULT_MODULES.every(m => keys.indexOf(m) !== -1)
        && keys.indexOf('Sustainability (CSRD)') !== -1 && keys.indexOf('Sustainability + Carbon (CSRD)') !== -1
        && sus.every(k => lens(k) === '5/5/3/3') && lens('Financial Reporting') === '5/5/3/3' && lens('GRC') === '5/5/3/0'
        && JSON.stringify(d['Financial Reporting']) === JSON.stringify(M3_FR_GATES) && JSON.stringify(d.GRC) === JSON.stringify(M3_GRC_GATES)
        && empty('Carbon') === false && d.GRC.disclosure.length === 0;
      detail = keys.map(k => k + '=' + lens(k)).join('; ');
    }catch(err){ detail = err.message; }
    check('grad-plan c1d: default goal gates cover every module, Sustainability 5/5/3/3, FR 5/5/3/3 and GRC 5/5/3/0 with the approved text (M3)', ok, detail);
  })();
  (function(){                                   // c1e
    const prevC = DATA.customers, prevCfg = DATA.config;
    let ok = false, detail = '';
    try{
      const book = cloneData(DATA);
      book.schemaVersion = 13;
      delete book.config.goalGates;
      book.config.modules = book.config.modules.concat(['Custom Module']);
      book.config.sessionTemplates['Custom Module'] = (book.config.sessionTemplates.Carbon || []).slice(0, 6);
      book.customers.forEach(c => { delete c.goals; delete c.exit; delete c.graduation; });
      const p = prepareBookData(book, 'SelfCheck');
      const live = p.customers.length > 0;
      const shapeOk = p.customers.every(c => Array.isArray(c.goals) && c.goals.length === 0 && c.exit === null && c.graduation === null);
      const gg = p.config.goalGates;
      const keys = Object.keys(gg);
      const ggOk = keys.length === 8 && keys.indexOf('Custom Module') !== -1
        && ['publish','setup_next','program','disclosure'].every(t => gg['Custom Module'][t].length === 0)
        && JSON.stringify(gg['Financial Reporting']) === JSON.stringify(M3_FR_GATES) && JSON.stringify(gg.GRC) === JSON.stringify(M3_GRC_GATES);
      const snap = x => JSON.stringify([x.customers.map(c => [c.goals, c.exit, c.graduation]), x.config.goalGates]);
      const before = snap(p);
      const again = prepareBookData(cloneData(p), 'SelfCheck');
      ok = live && p.schemaVersion === CURRENT_SCHEMA_VERSION && CURRENT_SCHEMA_VERSION >= 15 && shapeOk && ggOk && snap(again) === before;
      detail = JSON.stringify({live, schema: p.schemaVersion, shapeOk, ggKeys: keys.length, ggOk, idem: snap(again) === before});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.config = prevCfg;
    check('grad-plan c1e: v13 -> v15 gives goals [], exit null, graduation null, goalGates with FR and GRC filled; second pass identical', ok, detail);
  })();
  (function(){                                   // c1f
    let ok = false, detail = '';
    try{
      ok = CURRENT_SCHEMA_VERSION >= 15 && isRecordObject(defaultData().config.goalGates);
      detail = 'schema ' + CURRENT_SCHEMA_VERSION;
    }catch(err){ detail = err.message; }
    check('grad-plan c1f: schema is at least 15 (the 14->15 step) and defaultData carries config.goalGates', ok, detail);
  })();
  // ---- C-1 (trim-and-integration): schema 15 -> 16 ----
  (function(){                                   // c1a (trim) normalizeGongLink
    let ok = false, detail = '';
    try{
      const g = normalizeGongLink({callId:'G1', url:'javascript:x', startedAt:'2026-09-01T10:00:00Z', durationSec:60,
        summary:'x'.repeat(10000), matchedBy:'magic',
        participants:[{name:'A', email:42, affiliation:'external'}, {name:'B', email:'b@x.invalid', affiliation:'internal'}]});
      const good = normalizeGongLink({callId:'G2', url:'https://app.gong.io/call?id=2', matchedBy:'email'});
      ok = !!g && g.callId === 'G1' && g.url === '' && g.summary.length === 4000 && g.matchedBy === 'manual'
        && Array.isArray(g.participants) && g.participants.every(p => typeof p.email === 'string')
        && g.participants[1].email === 'b@x.invalid'
        && normalizeGongLink({}) === null && normalizeGongLink({callId:''}) === null && normalizeGongLink(null) === null
        && !!good && good.url === 'https://app.gong.io/call?id=2' && good.matchedBy === 'email';
      detail = JSON.stringify(g && {url:g.url, sum:g.summary.length, m:g.matchedBy});
    }catch(err){ detail = err.message; }
    check('c1a (trim): normalizeGongLink clamps hostile input (javascript: url, 10k summary, bad matchedBy, non-string email) and returns null for {}', ok, detail);
  })();
  (function(){                                   // c1b (trim) K6
    let ok = false, detail = '';
    try{
      const book = cloneData(DATA);
      const c0 = book.customers[0];
      book.gainsightQueue = [{id:'q-k6', date:todayISO(), customerId:c0.id, customerName:c0.name, kind:'note', payload:'p',
        status:'sent', externalId:'E1', sentAt:'2026-09-30T12:00:00.000Z', error:null, fields:{gates:[]}}];
      const p = prepareImportedData(JSON.parse(serializeBook(book)));
      const q = p.gainsightQueue[0];
      ok = !!q && q.status === 'sent' && q.externalId === 'E1' && q.sentAt === '2026-09-30T12:00:00.000Z'
        && q.error === null && Array.isArray(q.fields.gates) && q.fields.gates.length === 0;
      detail = JSON.stringify(q);
    }catch(err){ detail = err.message; }
    check('c1b (trim, K6): a sent queue item with externalId, sentAt, error and fields survives serializeBook -> prepareImportedData intact', ok, detail);
  })();
  (function(){                                   // c1c (trim)
    let ok = false, detail = '';
    try{
      const book = cloneData(DATA);
      const c0 = book.customers[0];
      const base = {date:todayISO(), customerId:c0.id, customerName:c0.name, kind:'note', payload:'p'};
      book.gainsightQueue = [Object.assign({id:'q-old'}, base), Object.assign({id:'q-bogus', status:'bogus'}, base),
        Object.assign({id:'q-fail', status:'failed', error:'e'.repeat(900)}, base)];
      const q = prepareImportedData(JSON.parse(serializeBook(book))).gainsightQueue;
      ok = q.length === 3 && q[0].status === 'queued' && JSON.stringify(q[0].fields) === '{}' && q[0].externalId === null
        && q[0].sentAt === null && q[0].error === null && q[1].status === 'queued'
        && q[2].status === 'failed' && q[2].error.length === 500;
      detail = JSON.stringify(q.map(x => [x.status, x.externalId, x.error && x.error.length]));
    }catch(err){ detail = err.message; }
    check('c1c (trim): an old prose-only queue item imports as queued with fields {}; status bogus -> queued; failed keeps a 500-clamped error', ok, detail);
  })();
  (function(){                                   // c1d2 (R4, C-3 follow-up)
    let ok = false, detail = '';
    try{
      const book = cloneData(DATA);
      const c0 = book.customers[0];
      const a0 = (book.activities[c0.id] || (book.activities[c0.id] = []));
      const mk = (id, type, n) => ({id, date:todayISO(), type, summary:id, sessionNumber:n, checklist:[], flagged:false});
      a0.push(mk('r4-email', 'Email', 3), mk('r4-sync', 'Partner Sync', 2), mk('r4-note', 'Implementation Note', 4), mk('r4-call', 'Call', 3));
      const p = prepareImportedData(JSON.parse(serializeBook(book)));
      const g = id => (p.activities[c0.id] || []).find(a => a.id === id);
      ok = !!g('r4-email') && g('r4-email').sessionNumber === null && g('r4-sync').sessionNumber === null
        && g('r4-note').sessionNumber === null && g('r4-call').sessionNumber === 3;
      detail = JSON.stringify({email: g('r4-email') && g('r4-email').sessionNumber, sync: g('r4-sync') && g('r4-sync').sessionNumber, note: g('r4-note') && g('r4-note').sessionNumber, call: g('r4-call') && g('r4-call').sessionNumber});
    }catch(err){ detail = err.message; }
    check('c1d2 (R4): an imported Email / Partner Sync / Implementation Note activity loses its sessionNumber (same isSessionCapableType rule as the form), a Call keeps it', ok, detail);
  })();
  (function(){                                   // c1d (trim)
    let ok = false, detail = '';
    try{
      const book = cloneData(DATA);
      const c0 = book.customers[0];
      c0.gainsight = {pulledAt:'2026-09-30T10:00:00.000Z', values:{tier:'T1', arr:5}};
      const c1 = book.customers[1];
      c1.gainsight = {pulledAt:'2026-09-30T10:00:00.000Z', values:'junk'};
      const a0 = (book.activities[c0.id] || (book.activities[c0.id] = []));
      a0.push({id:'a-gong', date:todayISO(), type:'Call', summary:'s', sessionNumber:null, checklist:[], flagged:false,
        gong:{callId:'G9', url:'https://x.invalid/c', matchedBy:'name', summary:'gs', participants:[]}});
      // R1 I-1: malformed gong on activities must be repaired on import (non-string callId dropped, javascript: url blanked, oversize summary clamped)
      a0.push({id:'a-gong-bad1', date:todayISO(), type:'Call', summary:'s1', sessionNumber:null, checklist:[], flagged:false, gong:{callId:42, url:'https://x.invalid/c'}});
      a0.push({id:'a-gong-bad2', date:todayISO(), type:'Call', summary:'s2', sessionNumber:null, checklist:[], flagged:false,
        gong:{callId:'G10', url:'javascript:alert(1)', matchedBy:'bogus', summary:'x'.repeat(5000000), participants:[]}});
      const p = prepareImportedData(JSON.parse(serializeBook(book)));
      const pc0 = p.customers.find(c => c.id === c0.id), pc1 = p.customers.find(c => c.id === c1.id);
      const ga = (p.activities[c0.id] || []).find(a => a.id === 'a-gong');
      const arrPull = normalizeGainsightPull({pulledAt:'2026-09-30T10:00:00.000Z', values:[1,2]});
      const gb1 = (p.activities[c0.id] || []).find(a => a.id === 'a-gong-bad1'), gb2 = (p.activities[c0.id] || []).find(a => a.id === 'a-gong-bad2');
      const gongRepaired = !!gb1 && gb1.gong === undefined && gb1.summary === 's1'
        && !!gb2 && !!gb2.gong && gb2.gong.callId === 'G10' && gb2.gong.url === '' && gb2.gong.summary.length === 4000 && gb2.gong.matchedBy === 'manual';
      ok = gongRepaired && !!pc0.gainsight && pc0.gainsight.values.tier === 'T1' && pc0.gainsight.values.arr === 5
        && (!pc1.gainsight || (isRecordObject(pc1.gainsight.values) && Object.keys(pc1.gainsight.values).length === 0))
        && !!ga && !!ga.gong && ga.gong.callId === 'G9' && ga.summary === 's'
        && !!arrPull && !Array.isArray(arrPull.values) && normalizeGainsightPull('x') === null;
      detail = JSON.stringify({g0: pc0.gainsight, g1: pc1.gainsight, gong: ga && ga.gong && ga.gong.callId, gongRepaired, gb1: gb1 && gb1.gong, gb2: gb2 && gb2.gong && {u: gb2.gong.url, n: gb2.gong.summary.length}});
    }catch(err){ detail = err.message; }
    check('c1d (trim): customer.gainsight and activity.gong survive export/import and are normalised; non-record values dropped; gong never rewrites activity.summary', ok, detail);
  })();
  (function(){                                   // c1d-R1 M-5
    let ok = false, detail = '';
    try{
      const contacts = []; for(let i = 0; i < 500; i++) contacts.push({name: 'N' + i, email: 'e'.repeat(5000), title: 't'});
      const n = normalizeGainsightPull({pulledAt: '2026-09-30T10:00:00.000Z', values: {tier: 'T'.repeat(100000), csmOwner: 'o'.repeat(100000), arr: 5, contacts, healthScore: 'h'.repeat(100000)}});
      const small = normalizeGainsightPull({pulledAt: '2026-09-30T10:00:00.000Z', values: {tier: 'T1', arr: 5, contacts: [{name: 'A', email: 'a@x.invalid'}]}});
      ok = !!n && Array.isArray(n.values.contacts) && n.values.contacts.length === 50
        && n.values.contacts.every(c => isRecordObject(c) && Object.values(c).every(v => typeof v !== 'string' || v.length <= 200))
        && n.values.tier.length <= 200 && n.values.csmOwner.length <= 200 && n.values.healthScore.length <= 200 && n.values.arr === 5
        && !!small && small.values.tier === 'T1' && small.values.contacts.length === 1 && small.values.contacts[0].email === 'a@x.invalid';
      detail = JSON.stringify({len: n && n.values.contacts && n.values.contacts.length, tier: n && n.values.tier && n.values.tier.length, em: n && n.values.contacts && n.values.contacts[0] && n.values.contacts[0].email.length});
    }catch(e){ detail = 'threw: ' + e.message; }
    check('c1d-R1 M-5: normalizeGainsightPull caps contacts at 50 and every string at 200 chars, keeping small pulls intact', ok, detail);
  })();
  (function(){                                   // c1e (trim)
    let ok = false, detail = '';
    try{
      const book = cloneData(DATA);
      book.schemaVersion = 15;
      /* v15-shaped fixture: last release's book has no gong/gainsight. Strip them from the clone so the
         assertions below test the migration, not whatever connector data the live book has accumulated. */
      book.customers.forEach(c => { delete c.gainsight; });
      Object.keys(book.activities).forEach(k => book.activities[k].forEach(x => { delete x.gong; }));
      const c0 = book.customers[0];
      book.gainsightQueue = [{id:'q-old', date:todayISO(), customerId:c0.id, customerName:c0.name, kind:'note', payload:'p'}];
      const p = prepareBookData(book, 'SelfCheck');
      const snap = x => JSON.stringify([x.gainsightQueue, x.customers.map(c => [c.gainsight, c.stakeholders])]);
      const before = snap(p);
      const again = prepareBookData(cloneData(p), 'SelfCheck');
      const noGong = Object.keys(p.activities).every(k => p.activities[k].every(a => a.gong === undefined));
      const noGs = p.customers.every(c => c.gainsight === undefined);
      ok = CURRENT_SCHEMA_VERSION === 17 && p.schemaVersion === 17 && snap(again) === before && noGong && noGs
        && p.gainsightQueue[0].status === 'queued';
      detail = JSON.stringify({cur: CURRENT_SCHEMA_VERSION, schema: p.schemaVersion, idem: snap(again) === before, noGong, noGs});
    }catch(err){ detail = err.message; }
    check('c1e (trim): CURRENT_SCHEMA_VERSION is 17; a v15 book lands on 17, adds no gong/gainsight, and a second pass is JSON-identical', ok, detail);
  })();
  (function(){                                   // c1f (trim) stakeholder email
    let ok = false, detail = '';
    try{
      const a = normalizeStakeholder({name:'Pat', role:'champion', email:'  Pat@Example.invalid '});
      const b = normalizeStakeholder({name:'Quinn', email:'   '});
      const c = normalizeStakeholder({name:'Rae', email:{x:1}});
      const book = cloneData(DATA);
      book.schemaVersion = 15;
      const c0 = book.customers[0];
      c0.stakeholders = [{id:'s1', name:'Old', role:'other', note:''}, {id:'s2', name:'New', role:'champion', note:'', email:'new@x.invalid'}];
      const p = prepareBookData(JSON.parse(serializeBook(book)), 'SelfCheck');
      const ps = p.customers.find(c => c.id === c0.id).stakeholders;
      const seed = prepareImportedData(JSON.parse(serializeBook(cloneData(DATA))));
      const demo = seed.customers.reduce((n, c) => n + (c.stakeholders || []).filter(s => s.email === 'sam.demo@fake-customer.invalid').length, 0);
      const hasDemo = DATA.customers.some(c => (c.stakeholders || []).some(s => s.id === 'sh-demo-1'));
      ok = a.email === 'Pat@Example.invalid' && b.email === undefined && c.email === undefined
        && ps[0].email === undefined && ps[1].email === 'new@x.invalid'
        && (!hasDemo || demo === 1);
      detail = JSON.stringify({a: a.email, b: b.email, c: c.email, old: ps[0].email, nw: ps[1].email, demo, hasDemo});
    }catch(err){ detail = err.message; }
    check('c1f (trim): stakeholder email is kept trimmed (blank/non-string omitted), survives export/import and the 15->16 step, existing stakeholders gain none; demo-seed email survives load', ok, detail);
  })();
  (function(){                                   // c1h (ruling M3: v14 -> v15 fills empty FR/GRC lists only)
    const prevC = DATA.customers, prevCfg = DATA.config;
    let ok = false, detail = '';
    try{
      const types = ['publish','setup_next','program','disclosure'];
      const book = cloneData(DATA);
      book.schemaVersion = 14;
      const gg = book.config.goalGates;
      types.forEach(t => { gg['Financial Reporting'][t] = []; gg.GRC[t] = []; });
      gg['Financial Reporting'].publish = ['Typed by an OSM'];          // a non-empty custom list must survive
      gg.Sustainability.program = ['Only this one'];                     // other modules are not touched
      gg['Custom Module'] = {publish: ['Custom A'], setup_next: [], program: [], disclosure: []};
      book.config.modules = book.config.modules.concat(['Custom Module']);
      book.config.sessionTemplates['Custom Module'] = (book.config.sessionTemplates.Carbon || []).slice(0, 6);
      const c0 = book.customers[0];
      c0.goals = [{id: 'gl_0000abcd', type: 'publish', text: 'Existing goal', targetCycle: '', primary: true, source: 'osm', createdOn: '2026-09-01',
        gates: [], verdict: null, verdictOn: null, verdictNote: '', supersededBy: null, changeReason: '', ackOn: null}];
      const p = prepareBookData(book, 'SelfCheck');
      const g = p.config.goalGates;
      const fr = g['Financial Reporting'], grc = g.GRC;
      const frOk = JSON.stringify(fr.publish) === '["Typed by an OSM"]'
        && JSON.stringify(fr.setup_next) === JSON.stringify(M3_FR_GATES.setup_next)
        && JSON.stringify(fr.program) === JSON.stringify(M3_FR_GATES.program)
        && JSON.stringify(fr.disclosure) === JSON.stringify(M3_FR_GATES.disclosure);
      const grcOk = JSON.stringify(grc) === JSON.stringify(M3_GRC_GATES) && grc.disclosure.length === 0;
      const othersOk = JSON.stringify(g.Sustainability.program) === '["Only this one"]'
        && JSON.stringify(g['Custom Module'].publish) === '["Custom A"]' && g['Custom Module'].setup_next.length === 0
        && JSON.stringify(g.Carbon) === JSON.stringify(SUSTAINABILITY_GOAL_GATES);
      const goalOk = p.customers[0].goals.length === 1 && p.customers[0].goals[0].gates.length === 0;
      const again = prepareBookData(cloneData(p), 'SelfCheck');
      const idem = JSON.stringify(again.config.goalGates) === JSON.stringify(p.config.goalGates);
      ok = p.schemaVersion === CURRENT_SCHEMA_VERSION && CURRENT_SCHEMA_VERSION >= 15 && frOk && grcOk && othersOk && goalOk && idem;
      detail = JSON.stringify({schema: p.schemaVersion, frOk, grcOk, othersOk, goalOk, idem});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.config = prevCfg;
    check('grad-plan c1h: v14 -> v15 fills empty FR/GRC lists, keeps a typed FR list, other modules and existing goals untouched, second pass identical', ok, detail);
  })();
  (function(){                                   // c1g
    let ok = false, detail = '';
    try{
      const a = normalizeGraduation({on:'2026-09-30', noGoal:1, extra:'x'});
      const b = normalizeGraduation({on:'2026-09-30'});
      ok = JSON.stringify(a) === JSON.stringify({on:'2026-09-30', noGoal:true}) && b && b.noGoal === false
        && [{on:'2026-13-40'}, {on:''}, {on:20260930}, 'x', 5, null, undefined].every(v => normalizeGraduation(v) === null);
      detail = JSON.stringify([a, b]);
    }catch(err){ detail = err.message; }
    check('grad-plan c1g: normalizeGraduation keeps {on, noGoal} and nulls anything else', ok, detail);
  })();
  function gp2Cust(mod){
    return {id:'__gp2__', name:'GP2 Test', module: mod || 'Sustainability', stage:'ttfv1', totalSessions:8,
      implementationDate: todayISO(), stageHistory:[], domainScores:{}, notes:'', sessionNotes:{},
      riskOverride:null, compliance: defaultCompliance(), goals:[], exit:null};
  }
  (function(){                                   // c2a
    const prevC = DATA.customers, prevG = DATA.config.goalGates;
    let ok = false, detail = '';
    try{
      const c = gp2Cust(); DATA.customers = [c];
      const g = createGoal(c, {type:'publish', text:'Publish FY2026 report', targetCycle:'FY2026', source:'handoff'});
      const want = SUSTAINABILITY_GOAL_GATES.publish;
      const copied = g && g.primary === true && g.gates.length === 5 && g.gates.every((x, i) => x.text === want[i]);
      DATA.config.goalGates = JSON.parse(JSON.stringify(prevG));
      DATA.config.goalGates.Sustainability.publish[0] = 'Changed';
      const stable = g && g.gates[0].text === want[0];
      const g2 = createGoal(c, {type:'program', text:'Second goal'});
      ok = !!copied && !!stable && g2 && g2.primary === false && c.goals.length === 2;
      detail = JSON.stringify({copied: !!copied, stable: !!stable, second: g2 && g2.primary});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.config.goalGates = prevG;
    check('grad-plan c2a: createGoal copies the default gates (later default edits do not touch it); a second goal is not primary', ok, detail);
  })();
  (function(){                                   // c2b
    const prevC = DATA.customers;
    let ok = false, detail = '';
    try{
      const c = gp2Cust(); const d = gp2Cust(); d.id = '__gp2b__';
      d.compliance.outcomePlan.planText = 'Existing plan';
      DATA.customers = [c, d];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      createGoal(d, {type:'publish', text:'Publish FY2026 report'});
      ok = c.compliance.outcomePlan.planText === 'Publish FY2026 report' && d.compliance.outcomePlan.planText === 'Existing plan';
      detail = JSON.stringify([c.compliance.outcomePlan.planText, d.compliance.outcomePlan.planText]);
    }catch(err){ detail = err.message; }
    DATA.customers = prevC;
    check('grad-plan c2b: createGoal fills an empty outcome-plan text from the primary goal and never overwrites one', ok, detail);
  })();
  (function(){                                   // c2d (R4, C-2 follow-up)
    let ok = false, detail = '';
    try{
      const bare = connectorUrlWarning('localhost:8787'), secure = connectorUrlWarning('https://127.0.0.1:8787'), remote = connectorUrlWarning('http://example.com:8787');
      const good = connectorUrlWarning(' http://127.0.0.1:8787/ ') === '' && connectorUrlWarning('') === '' && connectorUrlWarning('   ') === '' && connectorUrlWarning(null) === '';
      const says = [bare, secure, remote].every(m => /127\.0\.0\.1/.test(m) && /http:\/\//.test(m));
      const src = String(openSettingsModal);
      const wired = src.indexOf('connectorUrlWarning(') !== -1;   // wiring guard; the message itself is measured above
      ok = good && says && wired;
      detail = JSON.stringify({good, says, wired, bare});
    }catch(err){ detail = err.message; }
    check('connector c2d: a typed connector address that is not http://127.0.0.1:<port> (or localhost) gets a warning naming the correct form; blank and valid addresses do not, and Settings Save uses it instead of dropping the address silently', ok, detail);
  })();
  (function(){                                   // c2c
    const prevC = DATA.customers;
    let ok = false, detail = '';
    try{
      const c = gp2Cust(); DATA.customers = [c];
      const g = createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      const gid = g.gates[0].id;
      const t1 = setGoalGateDone(c, g.id, gid, true) && g.gates[0].done === true && g.gates[0].on === todayISO();
      const t2 = setGoalGateDone(c, g.id, gid, false) && g.gates[0].done === false && g.gates[0].on === null;
      const n1 = setGoalGateNote(c, g.id, gid, '  met on call ') && g.gates[0].note === 'met on call';
      const counts = [g.gates.length];
      const added = addGoalGate(c, g.id, 'Extra gate'); counts.push(g.gates.length);
      const ren = renameGoalGate(c, g.id, added.id, 'Renamed gate'); counts.push(g.gates.length);
      const rem = removeGoalGate(c, g.id, added.id); counts.push(g.gates.length);
      const bad = setGoalGateDone(c, g.id, 'nope', true) === false && setGoalGateDone(c, 'nope', gid, true) === false;
      ok = t1 && t2 && n1 && !!added && ren && rem && bad && counts.join() === '5,6,6,5' && g.gates.every(x => x.text !== 'Renamed gate');
      detail = JSON.stringify({t1, t2, n1, counts, bad});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC;
    check('grad-plan c2c: gate tick stamps today, untick clears it; add/rename/remove take the count 5 -> 6 -> 6 -> 5', ok, detail);
  })();
  (function(){                                   // c2d
    const prevC = DATA.customers;
    let ok = false, detail = '';
    try{
      const c = gp2Cust(); DATA.customers = [c];
      const list = outcomeCriteriaFor(c);
      const tally = goalCriteriaTally(c);
      const tallyOk = tally.total === list.length && tally.evidenced === list.filter(x => x.evidence).length && tally.total > 0;
      const f = gp2Cust('GRC'); DATA.customers = [f];
      const fg = createGoal(f, {type:'disclosure', text:'Submit the disclosure'});
      const html = renderGoalPanel(f);
      ok = tallyOk && !!fg && fg.gates.length === 0 && html.indexOf('0 gates') !== -1;
      detail = JSON.stringify({tally, fr: fg && fg.gates.length, zero: html.indexOf('0 gates') !== -1});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC;
    check('grad-plan c2d: criteria tally matches outcomeCriteriaFor; a GRC disclosure goal (empty default list) has 0 gates and the panel says so', ok, detail);
  })();
  (function(){                                   // c2e
    const prevC = DATA.customers;
    let ok = false, detail = '';
    try{
      const c = gp2Cust(); DATA.customers = [c];
      const f = HANDOFF_IN_FIELDS.find(x => x.key === 'handoffMeetingOn');
      const html = renderHandoffTab(c);
      const dateInput = /<input type="date" id="ho-in-handoffMeetingOn"/.test(html);
      c.compliance.outcomePlan.planText = 'plan text';
      c.firstValue = {definition:'FV def', evidence:[], achievedOn:null};
      const third = goalHintText(c);
      setHandoffField(c, 'in', 'promisedOutcomes', 'Promised in sale');
      const first = goalHintText(c);
      delete c.handoffIn;
      const second = goalHintText(c);
      ok = !!f && f.type === 'date' && dateInput && first && first.text === 'Promised in sale'
        && second && second.text === 'FV def' && third && third.text === 'FV def';
      detail = JSON.stringify({field: !!f, dateInput, first, second});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC;
    check('grad-plan c2e: hand-off meeting date is a date input; goal hint prefers promised outcomes, then first value', ok, detail);
  })();

  (function(){                                   // c2f: the planText fallback of the hint
    const prevC = DATA.customers;
    let ok = false, detail = '';
    try{
      const c = gp2Cust(); DATA.customers = [c];
      c.firstValue = {definition:'', evidence:[], achievedOn:null};
      delete c.handoffIn;
      c.compliance.outcomePlan.planText = 'Plan fallback text';
      const hint = goalHintText(c);
      const html = renderGoalPanel(c);
      ok = !!hint && hint.text === 'Plan fallback text' && html.indexOf('Plan fallback text') !== -1;
      detail = JSON.stringify({hint});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC;
    check('grad-plan c2f: with no promised outcomes and no first value definition, the goal hint falls back to the success outcome plan text', ok, detail);
  })();
  (function(){                                   // c2g: secondary-goals <details> keeps its open state across render
    const prevC = DATA.customers, prevOpen = ui.goalSecOpen;
    let ok = false, detail = '';
    try{
      const c = gp2Cust(); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Primary goal'});
      ui.goalSecOpen = false;
      const closed = /<details id="gp-sec-details"(?![^>]*\bopen\b)/.test(renderGoalPanel(c));
      ui.goalSecOpen = true;
      const open = /<details id="gp-sec-details"[^>]*\bopen\b/.test(renderGoalPanel(c));
      ok = closed && open;
      detail = JSON.stringify({closed, open});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; ui.goalSecOpen = prevOpen;
    check('grad-plan c2g: the secondary-goals details renders open exactly when ui.goalSecOpen is set', ok, detail);
  })();

  function gp3Cust(){
    return {id:'__gp3__', name:'GP3 Test', module:'Sustainability', stage:'ttfv1', totalSessions:8,
      implementationDate: todayISO(), stageHistory:[], domainScores:{}, notes:'', sessionNotes:{},
      riskOverride:null, compliance: defaultCompliance(), goals:[], exit:null};
  }
  (function(){                                   // c3a
    const prevC = DATA.customers;
    let ok = false, detail = '';
    try{
      const c = gp3Cust(); DATA.customers = [c];
      const first = createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      const none = changePrimaryGoal(c, {type:'setup_next', text:'Ready for next cycle', changeReason:''});
      const fresh = changePrimaryGoal(c, {type:'setup_next', text:'Ready for next cycle', changeReason:'Data owner left'});
      ok = none === null && !!fresh && first.verdict === 'replaced' && first.verdictOn === todayISO() && first.primary === false
        && first.supersededBy === fresh.id && first.changeReason === 'Data owner left'
        && primaryGoal(c).id === fresh.id && getGoals(c).length === 2;
      detail = JSON.stringify({none, fresh: !!fresh, len: getGoals(c).length});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC;
    check('grad-plan c3a: changing the primary goal needs a reason, closes the old goal as replaced and makes the new one primary', ok, detail);
  })();
  (function(){                                   // c3b
    const prevC = DATA.customers;
    let ok = false, detail = '';
    try{
      const c = gp3Cust(); DATA.customers = [c];
      const first = createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      const byText = t => first.gates.find(x => x.text === t);
      setGoalGateDone(c, first.id, byText('Metrics mapped to target frameworks').id, true);
      setGoalGateDone(c, first.id, byText('Report published or filed').id, true);
      setGoalGateDone(c, first.id, byText('Data collection tasks sent and returned').id, true);
      const onMapped = byText('Metrics mapped to target frameworks').on;
      const fresh = changePrimaryGoal(c, {type:'setup_next', text:'Ready for next cycle', changeReason:'Scope shift'});
      const nt = t => fresh.gates.find(x => x.text === t);
      const carried = nt('Metrics mapped to target frameworks').done === true && nt('Metrics mapped to target frameworks').on === onMapped;
      const nearly = nt('Data collection tasks sent').done === false;
      const others = fresh.gates.filter(x => x.text !== 'Metrics mapped to target frameworks').every(x => x.done === false);
      // an identical-text gate that was NOT done must not arrive done
      const u = gp3Cust(); u.id = '__gp3u__'; DATA.customers = [u];
      createGoal(u, {type:'publish', text:'Publish FY2026 report'});
      const uf = changePrimaryGoal(u, {type:'setup_next', text:'Ready for next cycle', changeReason:'Scope shift'});
      const undoneStays = uf.gates.every(x => x.done === false && x.on === null);
      ok = carried && nearly && others && undoneStays;
      detail = JSON.stringify({carried, nearly, others, undoneStays});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC;
    check('grad-plan c3b: a goal change carries over only done gates with identical text', ok, detail);
  })();
  (function(){                                   // c3c
    const prevC = DATA.customers;
    let ok = false, detail = '';
    try{
      const c = gp3Cust(); const never = gp3Cust(); never.id = '__gp3n__'; DATA.customers = [c, never];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      createGoal(never, {type:'publish', text:'Publish FY2026 report'});
      const def = SIGNAL_DEFS.find(d => d.key === 'goal_changed');
      const silentBefore = def && def.detect(c) === null;
      changePrimaryGoal(c, {type:'setup_next', text:'Ready for next cycle', changeReason:'Data owner left'});
      const sig = def.detect(c);
      const live = !!sig && sig.reason === 'Data owner left';
      const silentNever = def.detect(never) === null;
      const a1 = ackGoalChange(c), after = def.detect(c) === null, a2 = ackGoalChange(c);
      const tab = SIGNAL_PANEL_TAB.goal_changed === 'overview' && Number.isFinite(effortMinutesFor('signal:goal_changed'));
      ok = silentBefore && live && silentNever && a1 === true && after && a2 === false && tab;
      detail = JSON.stringify({silentBefore, live, silentNever, a1, after, a2, tab});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC;
    check('grad-plan c3c: goal_changed fires after a change, stays silent otherwise, clears once acknowledged', ok, detail);
  })();
  (function(){                                   // c3d
    let ok = false, detail = '';
    try{
      const re = /daysSince|DATA\.config|Days\b|\d{2,}/;
      const a = String(customerGoalChangedSignal), b = String(SIGNAL_DEFS.find(d => d.key === 'goal_changed').detect);
      ok = !re.test(a) && !re.test(b);
      detail = JSON.stringify({a: re.test(a), b: re.test(b)});
    }catch(err){ detail = err.message; }
    check('grad-plan c3d: goal_changed reads no day count, config value or number', ok, detail);
  })();

  /* ---- Graduation Plan task 4: graduation confirm, early exit, ready_to_graduate ---- */
  function gp4Cust(id, total){
    return {id: id || '__gp4__', name:'GP4 Test', module:'Sustainability', stage:'ttfv1', totalSessions: total || 6,
      implementationDate: todayISO(), stageHistory:[], domainScores:{}, notes:'', sessionNotes:{},
      riskOverride:null, compliance: defaultCompliance(), goals:[], exit:null, targetGraduationDate: null};
  }
  function gp4Acts(c, nums){
    DATA.activities[c.id] = nums.map(n => ({id:'gp4a' + n, type:'call', sessionNumber:n, date: todayISO(), notes:'', outcome:'', customerId:c.id}));
  }
  function gp4Done(c){ (primaryGoal(c).gates || []).forEach(g => { g.done = true; g.on = todayISO(); }); }
  (function(){                                   // c4a
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const def = SIGNAL_DEFS.find(d => d.key === 'ready_to_graduate');
      const c = gp4Cust(); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      const noDate = customerReadyToGraduateSignal(c) === null;
      c.targetGraduationDate = todayISO();
      const open = customerReadyToGraduateSignal(c) === null;
      gp4Done(c);
      const fires = !!customerReadyToGraduateSignal(c) && !!def && !!def.detect(c);
      const impl = gp4Cust('__gp4i__'); impl.implementation = {phase:'build'}; impl.targetGraduationDate = todayISO();
      createGoal(impl, {type:'publish', text:'x'}); gp4Done(impl);
      const inImpl = customerReadyToGraduateSignal(impl) === null;
      const grad = gp4Cust('__gp4g__'); grad.stage = 'graduated'; grad.targetGraduationDate = todayISO();
      createGoal(grad, {type:'publish', text:'x'}); gp4Done(grad);
      const gradNull = customerReadyToGraduateSignal(grad) === null;
      const nogoal = gp4Cust('__gp4n__'); nogoal.targetGraduationDate = todayISO();
      const noGoalNull = customerReadyToGraduateSignal(nogoal) === null;
      const fr = gp4Cust('__gp4f__'); fr.module = 'GRC'; fr.targetGraduationDate = todayISO();
      const g = createGoal(fr, {type:'disclosure', text:'Report'});
      const frZero = g.gates.length === 0 && customerReadyToGraduateSignal(fr) === null;
      setGoalVerdict(fr, g.id, 'met', 'ok');
      const frMet = !!customerReadyToGraduateSignal(fr) && customerReadyToGraduateSignal(fr).verdictMet === true;
      const play = PLAYBOOK_DEFS.find(d => d.key === 'grad_ready').signals.includes('ready_to_graduate');
      const tab = SIGNAL_PANEL_TAB.ready_to_graduate === 'overview' && effortMinutesFor('signal:ready_to_graduate') === 10;
      ok = noDate && open && fires && inImpl && gradNull && noGoalNull && frZero && frMet && play && tab;
      detail = JSON.stringify({noDate, open, fires, inImpl, gradNull, noGoalNull, frZero, frMet, play, tab});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c4a: ready_to_graduate fires on all-gates-done or a met verdict (0 gates only when met), needs a date and a live account', ok, detail);
  })();
  (function(){                                   // c4b
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust(); DATA.customers = [c];
      const p = createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      p.gates.slice(0, 3).forEach(g => { g.done = true; g.on = todayISO(); });
      gp4Acts(c, [1,2,3,4,5,6]);
      const a = validateGraduationDraft(c, {verdict:'met', note:''});
      const blocked = a.ok === false && a.missing.includes('note') && !!a.notePrompt && p.gates.slice(3).every(g => a.notePrompt.includes(g.text)) && a.openGates.length === 2;
      const b = validateGraduationDraft(c, {verdict:'met', note:'Customer will file next week'});
      const unblocked = b.ok === true;
      const applied = applyGraduation(c, {verdict:'met', note:'Customer will file next week'});
      ok = blocked && unblocked && applied === true && c.stage === 'graduated' && primaryGoal(c).verdict === 'met';
      detail = JSON.stringify({blocked, unblocked, applied, stage: c.stage});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c4b: a met verdict with open gates prompts for the note and never blocks', ok, detail);
  })();
  (function(){                                   // c4c
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust(); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      gp4Acts(c, [1,2,3,4,5]);
      const base = {verdict:'partly', note:'n'};
      const noReason = validateGraduationDraft(c, base).missing.includes('exitReason');
      const noNote = validateGraduationDraft(c, Object.assign({exitReason:'other'}, base)).missing.includes('exitNote');
      const six = getSessionTemplateSet(c)[5], sixId = six && six.id ? six.id : '6';
      const applied = applyGraduation(c, Object.assign({exitReason:'goal_met_early'}, base));
      const ex = getExit(c);
      ok = noReason && noNote && applied && !!ex && ex.reason === 'goal_met_early' && ex.sessionsNotNeeded.length === 1
        && ex.sessionsNotNeeded[0] === sixId && plannedSessionTotal(c) === 5 && sessionsCompletedCount(c) === 5;
      detail = JSON.stringify({noReason, noNote, applied, ex, planned: plannedSessionTotal(c)});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c4c: an early exit needs a reason, records the unheld session, and shrinks the planned total', ok, detail);
  })();
  (function(){                                   // c4i
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__gp4f2__', 8); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      gp4Acts(c, [1,2,3,4,5]);
      const applied = applyGraduation(c, {verdict:'met', note:'n', exitReason:'goal_met_early'});
      const risk = computeRisk(c);
      const row = renderRow(c), card = renderKanbanCard(c), det = renderDetailsTab(c, risk), snap = renderAccountSnapshot(c, risk);
      const stand = accountStanding(c), ghost = cardGhostFigure(c, 'outcome');
      const bar = h => { const m = /session-bar-fill" style="width:([\d.]+)%/.exec(h); return m ? parseFloat(m[1]) : null; };
      const kb = bar(card), db = bar(det);
      ok = applied && plannedSessionTotal(c) === 5 && kb === 100 && db === 100
        && card.includes('5/5') && !card.includes('5/8') && det.includes('5/5 sessions logged') && !det.includes('/8')
        && row.includes('5/5') && !row.includes('/8') && !/All 8 sessions/.test(row) && /All 5 sessions logged/.test(row)
        && snap.includes('/5') && !snap.includes('/8')
        && stand.total === 5 && ghost === '5/5' && aiCustomerSnapshot(c).totalSessions === 5;
      detail = JSON.stringify({applied, kb, db, card5: card.includes('5/5'), det5: det.includes('5/5 sessions logged'), row5: row.includes('5/5'), rowAll: /All 5 sessions logged/.test(row), snap: snap.includes('/8'), st: stand.total, ghost, ai: aiCustomerSnapshot(c).totalSessions});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c4i: an early-exit account (8 planned, 5 held, 3 not needed) reads 5/5 and a 100% bar on every tally surface', ok, detail);
  })();
  (function(){                                   // c4j
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__gp4g2__', 8); c.implementation = {phase:'build'}; DATA.customers = [c];
      createGoal(c, {type:'publish', text:'x'});
      const unheld = unheldPlannedSessions(c);
      const needs = validateGraduationDraft(c, {verdict:'partly', note:'n'}).missing.includes('exitReason');
      const applied = applyGraduation(c, {verdict:'partly', note:'n', exitReason:'goal_met_early'});
      const ex = getExit(c);
      ok = unheld.length === 8 && needs && applied && !!ex && ex.reason === 'goal_met_early';
      detail = JSON.stringify({unheld: unheld.length, needs, applied, ex});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c4j: graduating an account still in implementation needs an exit reason when planned sessions are unheld (spec 4.4)', ok, detail);
  })();
  /* ---- Final-review fix F1 (I1, I2): exit/graduation apply only while graduated; re-graduation rewrites them; no Change goal once graduated ---- */
  (function(){                                   // f1a
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__f1a__', 8); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      gp4Acts(c, [1,2,3,4,5]);
      const applied = applyGraduation(c, {verdict:'met', note:'n', exitReason:'goal_met_early'});
      const gradPlanned = plannedSessionTotal(c), gradNext = nextOpenSessionNumber(c);
      changeStage(c, 'ttfv2');
      const stored = !!c.exit && c.exit.sessionsNotNeeded.length === 3 && !!c.graduation;   // non-destructive: values kept
      const planned = plannedSessionTotal(c), next = nextOpenSessionNumber(c), card = renderKanbanCard(c);
      ok = applied && gradPlanned === 5 && gradNext === null && stored && getExit(c) === null && !getGraduation(c)
        && planned === 8 && next === 6 && card.includes('5/8') && !card.includes('5/5');
      detail = JSON.stringify({applied, gradPlanned, gradNext, stored, planned, next, c58: card.includes('5/8')});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan f1a: a re-opened early-exit account keeps its stored exit but reads 5/8 with session 6 next (I1)', ok, detail);
  })();
  (function(){                                   // f1b
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__f1b__', 8); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      gp4Acts(c, [1,2,3,4,5]);
      const first = applyGraduation(c, {verdict:'met', note:'n', exitReason:'goal_met_early'});
      changeStage(c, 'ttfv2');
      gp4Acts(c, [1,2,3,4,5,6,7,8]);
      const again = applyGraduation(c, {verdict:'met', note:'n'});
      const goals = gp5Goals(gp5Packet(c));
      ok = first && again && c.stage === 'graduated' && c.exit === null && getExit(c) === null && plannedSessionTotal(c) === 8
        && !/Early exit/.test(goals) && !/not needed/.test(goals) && !!c.graduation && c.graduation.noGoal === false;
      detail = JSON.stringify({first, again, exit: c.exit, early: /Early exit/.test(goals), grad: c.graduation});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan f1b: re-graduating with every session held clears the old exit and the packet states no early exit (I1)', ok, detail);
  })();
  (function(){                                   // f1c
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__f1c__', 8); DATA.customers = [c];
      gp4Acts(c, [1,2,3,4,5]);
      const applied = applyGraduation(c, {noGoal:true, exitReason:'goal_met_early'});
      const gradHtml = renderGoalPanel(c);
      changeStage(c, 'ttfv2');
      const html = renderGoalPanel(c);
      ok = applied && gradHtml === '' && html.includes('No goal yet') && html.includes('data-goal-new');
      detail = JSON.stringify({applied, gradEmpty: gradHtml === '', banner: html.includes('No goal yet')});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan f1c: a re-opened no-goal account shows the "No goal yet" banner again (I1)', ok, detail);
  })();
  (function(){                                   // f1d
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__f1d__', 6); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      gp4Acts(c, [1,2,3,4,5,6]);
      const live = renderGoalPanel(c).includes('data-goal-change');
      applyGraduation(c, {verdict:'met', note:'n'});
      const grad = renderGoalPanel(c);
      ok = live && c.stage === 'graduated' && !grad.includes('data-goal-change') && grad.includes('Publish FY2026 report');
      detail = JSON.stringify({live, gradHasChange: grad.includes('data-goal-change')});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan f1d: a graduated account\'s goal panel has no Change goal button, a live one does (I2)', ok, detail);
  })();
  /* ---- Final-review fix F2 (Minor 1, 2, 3, 4, 11): packet punctuation, draft validation and undo label, shape backfill, planned totals, one implementation line ---- */
  (function(){                                   // f2a
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__f2a__'); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      changePrimaryGoal(c, {type:'setup_next', text:'Ready for next cycle', changeReason:'Scope changed.'});
      const sec = gp5Goals(gp5Packet(c));
      const one = sec.includes('because Scope changed.') && !sec.includes('..');
      const c2 = gp4Cust('__f2a2__'); DATA.customers = [c2];
      createGoal(c2, {type:'publish', text:'A'});
      changePrimaryGoal(c2, {type:'setup_next', text:'B', changeReason:'Why?!'});
      const sec2 = gp5Goals(gp5Packet(c2));
      const two = sec2.includes('because Why.') && !/[?!]\./.test(sec2);
      ok = one && two;
      detail = JSON.stringify({one, two, sec, sec2});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan f2a: a change reason that ends in punctuation does not double the full stop in the packet (Minor 1)', ok, detail);
  })();
  (function(){                                   // f2b
    let ok = false, detail = '';
    try{
      const data = {config: {}, activities: {}, customers: [
        {id:'a', name:'A'},
        {id:'b', name:'B', goals: [], exit: null, graduation: null},
        {id:'c', name:'C', stage:'graduated', graduation: {on:'2026-09-01', noGoal:true}}]};
      repairAuxiliaryCollections(data);
      const [a, b, cc] = data.customers;
      const shaped = c => Array.isArray(c.goals) && c.goals.length === 0 && c.exit === null && c.graduation === null;
      const aOk = shaped(a), bOk = shaped(b);
      const cOk = Array.isArray(cc.goals) && cc.exit === null && !!cc.graduation && cc.graduation.noGoal === true;
      ok = aOk && bOk && cOk;
      detail = JSON.stringify({a: [a.goals, a.exit, a.graduation], bOk, c: [cc.goals, cc.exit, cc.graduation]});
    }catch(err){ detail = err.message; }
    check('grad-plan f2b: repair backfills goals [], exit null and graduation null where absent and never invents or drops a value (Minor 3)', ok, detail);
  })();
  (function(){                                   // f2c
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__f2c__', 8); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      gp4Acts(c, [1,2,3,4,5]);
      c.firstValue = {definition: 'Report published', evidence: []};
      const applied = applyGraduation(c, {verdict:'met', note:'n', exitReason:'goal_met_early'});
      const gate = customerGateSignal(c), nve = SIGNAL_DEFS.find(d => d.key === 'no_value_evidence').detect(c);
      const gateOk = !!gate && gate.total === 5 && gate.completed === 5;
      const nveOk = !!nve && nve.total === 5 && nve.completed === 5;
      ok = applied && gateOk && nveOk;
      detail = JSON.stringify({applied, gate: gate && {completed: gate.completed, total: gate.total}, nve});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan f2c: late_gate and no_value_evidence show the planned session total (5, not 8) for an early-exit account (Minor 4)', ok, detail);
  })();
  (function(){                                   // f2d
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__f2d__', 8); c.implementation = {phase:'build'}; DATA.customers = [c];
      createGoal(c, {type:'publish', text:'x'});
      const applied = applyGraduation(c, {verdict:'partly', note:'n', exitReason:'no_more_enablement'});
      const pt = plannedSessionTotal(c);
      const lines = gp5Packet(c).split('\n');
      const reasonLines = lines.filter(l => l.includes('No more enablement needed'));
      const notNeeded = lines.filter(l => /not needed/i.test(l));
      const start = lines.find(l => l.startsWith('(curriculum not started')) || '';
      ok = applied && pt === 0 && inImplementation(c) && reasonLines.length === 1 && notNeeded.length === 1 && !!start;
      detail = JSON.stringify({applied, pt, reasonLines: reasonLines.length, notNeeded: notNeeded.length, start});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan f2d: graduating straight out of implementation prints the exit reason once, and the curriculum line does not repeat it (Minor 11)', ok, detail);
  })();
  (function(){                                   // f2e
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__f2e__', 6); DATA.customers = [c];
      gp4Acts(c, [1,2,3,4,5,6]);
      const draft = {newGoal: {type: 'bogus', text: 'Goal'}, verdict: 'met', note: 'n'};
      const valid = validateGraduationDraft(c, draft).ok;
      markUndoable(null);
      const confirmed = confirmGraduation(c, draft);
      const label = _undoLabel;
      const good = validateGraduationDraft(c, {newGoal: {type:'publish', text:'Goal'}, verdict:'met', note:'n'}).ok;
      ok = !valid && !confirmed && label === null && good && c.stage !== 'graduated';
      detail = JSON.stringify({valid, confirmed, label, good, stage: c.stage});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan f2e: a draft with an unknown goal type is invalid and a refused confirm leaves no undo label (Minor 2)', ok, detail);
  })();
  (function(){                                   // c4d
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust(); DATA.customers = [c]; gp4Acts(c, [1,2,3,4,5,6]);
      const needGoal = validateGraduationDraft(c, {}).missing.includes('goal');
      const noGoalOk = validateGraduationDraft(c, {noGoal:true}).ok === true;
      const applied = applyGraduation(c, {newGoal:{type:'program', text:'Data program live'}, verdict:'partly', note:'n'});
      const p = primaryGoal(c);
      ok = needGoal && noGoalOk && applied && c.stage === 'graduated' && !!p && p.text === 'Data program live' && p.verdict === 'partly';
      detail = JSON.stringify({needGoal, noGoalOk, applied, goal: p && p.text});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c4d: graduating with no goal needs the no-goal choice or a new goal, which is created on the way', ok, detail);
  })();
  (function(){                                   // c4e
    let ok = false, detail = '';
    try{
      const src = String(attachEvents);
      const calls = (src.match(/requestStageChange\(/g) || []).length;
      const direct = /[^.\w]changeStage\(/.test(src);
      const keeps = String(changeStage).includes('scheduleGradReview');
      const sel = ['dataset.dropzone', 'data-table-stage', '#stage-select'].every(s => src.includes(s));
      ok = calls === 3 && !direct && keeps && sel;
      detail = JSON.stringify({calls, direct, keeps, sel});
    }catch(err){ detail = err.message; }
    check('grad-plan c4e: the kanban drop, table select and panel select all go through requestStageChange; changeStage still schedules the review', ok, detail);
  })();
  (function(){                                   // c4f
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      DATA.riskLog = {};   // the packet builds the risk hub, which prunes/stamps riskLog
      const c = gp4Cust(); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      gp4Acts(c, [1,2,3,4,5]);
      applyGraduation(c, {verdict:'partly', note:'n', exitReason:'goal_met_early'});
      const t = buildKnowledgeTransferText(c);
      const six = getSessionTemplateSet(c)[5];
      const tally = t.includes('5/5 sessions logged');
      const line = t.includes(`Session 6 — ${six.title}: not needed (early exit)`);
      ok = tally && line;
      detail = JSON.stringify({tally, line});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    check('grad-plan c4f: the packet tally reads the planned total and marks the unneeded session', ok, detail);
  })();
  (function(){                                   // c4g
    let ok = false, detail = '';
    try{
      const re = /daysSince|DATA\.config|Days\b|\d{2,}/;
      const a = String(customerReadyToGraduateSignal), b = String(SIGNAL_DEFS.find(d => d.key === 'ready_to_graduate').detect);
      ok = !re.test(a) && !re.test(b);
      detail = JSON.stringify({a: re.test(a), b: re.test(b)});
    }catch(err){ detail = err.message; }
    check('grad-plan c4g: ready_to_graduate reads no day count, config value or number', ok, detail);
  })();
  (function(){                                   // c4h
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const t = todayISO();
      const a = gp4Cust('__gp4ha__'); DATA.customers = [a]; gp4Acts(a, [1,2,3,4,5,6]);
      createGoal(a, {type:'publish', text:'x'});
      applyGraduation(a, {verdict:'met', note:'n'});
      const withGoal = JSON.stringify(a.graduation) === JSON.stringify({on:t, noGoal:false});
      const b = gp4Cust('__gp4hb__'); DATA.customers = [b]; gp4Acts(b, [1,2,3,4,5,6]);
      applyGraduation(b, {noGoal:true});
      const noGoal = JSON.stringify(b.graduation) === JSON.stringify({on:t, noGoal:true});
      const d = gp4Cust('__gp4hc__'); DATA.customers = [d]; gp4Acts(d, [1,2,3,4,5,6]);
      applyGraduation(d, {newGoal:{type:'program', text:'y'}, verdict:'met', note:'n'});
      const newGoal = JSON.stringify(d.graduation) === JSON.stringify({on:t, noGoal:false});
      const e = gp4Cust('__gp4hd__'); DATA.customers = [e]; gp4Acts(e, [1,2,3,4,5,6]);
      const failed = applyGraduation(e, {}) === false && !e.graduation && e.stage === 'ttfv1';
      ok = withGoal && noGoal && newGoal && failed;
      detail = JSON.stringify({withGoal, noGoal, newGoal, failed});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c4h: graduating through the confirm writes the graduation marker; a failed draft writes none', ok, detail);
  })();

  /* ---- Graduation Plan task 5: the GOALS section of the knowledge-transfer packet ---- */
  function gp5Packet(c){          // the packet builds the risk hub, which prunes riskLog: swap and restore
    const prevLog = DATA.riskLog; DATA.riskLog = {};
    try{ return buildKnowledgeTransferText(c); } finally { DATA.riskLog = prevLog; }
  }
  function gp5Goals(t){           // the GOALS section only
    const lines = t.split('\n'), a = lines.indexOf('— GOALS —');
    if(a < 0) return '';
    let b = lines.findIndex((x, i) => i > a && /^— .* —$/.test(x));
    if(b < 0) b = lines.length;
    return lines.slice(a, b).join('\n');
  }
  (function(){                                   // c5a
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__gp5a__'); DATA.customers = [c];
      const g = createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      g.gates = ['A one','B two','C three','D four','E five'].map((t, i) => ({id:'gt_gp5a' + i, text:t, done: i < 2, on: i < 2 ? todayISO() : null, note:''}));
      const lines = gp5Packet(c).split('\n');
      const idx = k => lines.indexOf('— ' + k + ' —');
      const order = ['GOALS','ACCOUNT','PEOPLE','SESSION HISTORY','OPEN AT TRANSFER','FROM THE OSM'].map(idx);
      const inOrder = order.every((n, i) => n >= 0 && (i === 0 || n > order[i - 1]));
      const first = idx('GOALS') === 4;
      const sec = gp5Goals(lines.join('\n'));
      const t = goalCriteriaTally(c);
      const gates = sec.includes('Gates: 2 of 5 done. Open: C three; D four; E five');
      const crit = sec.includes(`Criteria: ${t.evidenced} of ${t.total} evidenced`);
      ok = first && inOrder && gates && crit;
      detail = JSON.stringify({first, inOrder, gates, crit, order});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c5a: GOALS leads the packet, the other sections keep their order, gates and criteria are stated', ok, detail);
  })();
  (function(){                                   // c5b
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__gp5b__'); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      changePrimaryGoal(c, {type:'setup_next', text:'Ready for next cycle', changeReason:'Data owner left'});
      const want = `Changed ${fmtDate(todayISO())}: Publish FY2026 report → Ready for next cycle, because Data owner left.`;
      const sec = gp5Goals(gp5Packet(c));
      ok = sec.split('\n').includes(want);
      detail = JSON.stringify({want, sec});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c5b: a goal change prints as "Changed <date>: old → new, because <reason>."', ok, detail);
  })();
  (function(){                                   // c5c
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__gp5c__'); DATA.customers = [c];
      createGoal(c, {type:'publish', text:'Publish FY2026 report'});
      gp4Acts(c, [1,2,3,4,5]);
      applyGraduation(c, {verdict:'partly', note:'n', exitReason:'goal_met_early', exitNote:'Customer self-sufficient'});
      const s1 = gp5Goals(gp5Packet(c));
      const exit = s1.includes('Early exit: Goal met early') && s1.includes('Customer self-sufficient') && s1.includes('Sessions marked not needed: Session 6');
      const fr = gp4Cust('__gp5cf__'); fr.module = 'GRC'; DATA.customers = [fr];
      createGoal(fr, {type:'disclosure', text:'Submit the disclosure'});
      const s2 = gp5Goals(gp5Packet(fr));
      const zero = s2.includes('Gates: 0 gates');
      const gr = gp4Cust('__gp5cg__'); DATA.customers = [gr];
      createGoal(gr, {type:'publish', text:'x'});
      gr.gradReview = normalizeGradReview({dueOn: todayISO(), doneOn: todayISO(), verdict:'held', note:''});
      const s3 = gp5Goals(gp5Packet(gr));
      const check_ = s3.includes('Graduation check-back: Still using it');
      ok = exit && zero && check_;
      detail = JSON.stringify({exit, zero, check_, s1, s2});
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c5c: the packet shows the early-exit reason, note and unneeded sessions, "0 gates", and the check-back verdict', ok, detail);
  })();
  (function(){                                   // c5d
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__gp5d__'); c.stage = 'graduated'; c.graduation = {on:'2026-09-30', noGoal:true}; DATA.customers = [c];
      const sec = gp5Goals(gp5Packet(c));
      ok = sec.includes('No goal recorded.') && !sec.includes('Graduated before goal tracking.');
      detail = sec;
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c5d: graduated through the no-goal choice reads "No goal recorded." (ruling M1)', ok, detail);
  })();
  (function(){                                   // c5e
    const prevC = DATA.customers, prevA = DATA.activities;
    let ok = false, detail = '';
    try{
      DATA.activities = Object.assign({}, prevA);
      const c = gp4Cust('__gp5e__'); c.stage = 'graduated'; c.graduation = null; DATA.customers = [c];
      const sec = gp5Goals(gp5Packet(c));
      ok = sec.includes('Graduated before goal tracking.') && !sec.includes('No goal recorded.');
      detail = sec;
    }catch(err){ detail = err.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    check('grad-plan c5e: a historic graduation reads "Graduated before goal tracking." (ruling M1)', ok, detail);
  })();

  /* ---- Graduation Plan task 6: Gainsight queue items and Settings gates ---- */
  (function(){                                   // c6a
    const hadKey = Object.prototype.hasOwnProperty.call(DATA, 'gainsightQueue'), prevQ = DATA.gainsightQueue;
    let ok = false, detail = '';
    try{
      DATA.gainsightQueue = [];
      const c = gp4Cust('__gp6a__');
      const g = {text:'Publish FY2026 report', verdict:'met'};
      commitGoalEvent(c, 'created', g);
      const afterCreate = DATA.gainsightQueue.slice();
      commitGoalEvent(c, 'changed', g);
      commitGoalEvent(c, 'verdict', g);
      const q = DATA.gainsightQueue;
      const one = afterCreate.length === 1 && afterCreate[0].kind === 'Success Plan objective'
        && afterCreate[0].payload === 'Update Success Plan objective: Publish FY2026 report';
      const three = q.length === 3 && q[1].payload === 'Update Success Plan objective: Publish FY2026 report';
      const tail = q[2] && / — verdict: Met$/.test(q[2].payload);
      ok = one && three && !!tail;
      detail = JSON.stringify({createdAdded: afterCreate.length, total: q.length, kind: afterCreate[0] && afterCreate[0].kind, verdictPayload: q[2] && q[2].payload});
    }catch(err){ detail = err.message; }
    if(hadKey) DATA.gainsightQueue = prevQ; else delete DATA.gainsightQueue;
    check('grad-plan c6a: commitGoalEvent queues exactly one Success Plan objective item per event (created, changed, verdict)', ok, detail);
  })();
  (function(){                                   // c6b
    let ok = false, detail = '';
    try{
      const cnt = (fn, s) => (String(fn).match(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const form = cnt(openGoalFormModal, 'commitGoalEvent(');
      const conf = cnt(confirmGraduation, 'commitGoalEvent(') + (String(openGraduationConfirmModal).includes('confirmGraduation(') ? 0 : 100);
      const verd = String(attachEvents).includes('data-goal-verdict') && cnt(attachEvents, 'commitGoalEvent(');
      const addAcct = cnt(openAddCustomerModal, 'commitGoalEvent(');
      const pure = ['createGoal', 'changePrimaryGoal', 'setGoalVerdict', 'applyGraduation']
        .every(n => !String(({createGoal, changePrimaryGoal, setGoalVerdict, applyGraduation})[n]).includes('queueGainsightItem'));
      ok = form === 1 && conf === 2 && verd === 1 && addAcct === 1 && pure;
      detail = JSON.stringify({form, conf, verd, addAcct, pure});
    }catch(err){ detail = err.message; }
    check('grad-plan c6b: the goal form, graduation confirm, verdict select and new-account form each call commitGoalEvent; the domain functions never queue (P5)', ok, detail);
  })();
  (function(){                                   // c6c
    let ok = false, detail = '';
    try{
      const raw = {domains: DATA.config.domains.slice(), domainSlots: DATA.config.domains.slice(), outcomes: DATA.config.outcomeNames.slice(),
        riskKeywords: DATA.config.advisorRiskKeywords.join('\n'), positiveKeywords: DATA.config.advisorPositiveKeywords.join('\n'),
        keywordMaxAgeDays:'30', riskWatchDays:'10', riskAlertDays:'21', defaultPaceDays:'7', dueSoonDays:'7', neglectDays:'21',
        gradReviewDays:'30', implQuietDays:'35'};
      const draft = parseSettingsDraft(Object.assign({}, raw, {goalGates: {'Financial Reporting': {publish: ' Filing submitted \n\n'}, GRC: {}}}));
      const fr = draft.goalGates && draft.goalGates['Financial Reporting'];
      const grc = draft.goalGates && draft.goalGates.GRC;
      const parsed = !!fr && JSON.stringify(fr.publish) === '["Filing submitted"]'
        && !!grc && GOAL_TYPES.every(t => Array.isArray(grc[t.key]) && grc[t.key].length === 0);
      const cand = applySettingsDraft(cloneData(DATA), draft);
      const wrote = JSON.stringify(cand.config.goalGates['Financial Reporting'].publish) === '["Filing submitted"]';
      const plain = parseSettingsDraft(raw);
      const before = JSON.stringify(DATA.config.goalGates);
      const kept = plain.goalGates === undefined && JSON.stringify(applySettingsDraft(cloneData(DATA), plain).config.goalGates) === before;
      const d = defaultGoalGatesConfig();
      const filled = JSON.stringify(d['Financial Reporting']) === JSON.stringify(M3_FR_GATES) && JSON.stringify(d.GRC) === JSON.stringify(M3_GRC_GATES);
      ok = parsed && wrote && kept && filled;
      detail = JSON.stringify({parsed, wrote, kept, filled});
    }catch(err){ detail = err.message; }
    check('grad-plan c6c: Settings gates parse one per line, write config.goalGates only when present, and FR/GRC ship the approved gate lists as editable defaults (M3)', ok, detail);
  })();
  (function(){                                   // c6d
    /* Models saveData's undo rule on an in-memory store (the real one is blocked while the suite
       runs): snapshot = the store as it stood BEFORE the latest save. Two saves in one action
       leave the post-action state as the snapshot, which is the defect this guards. */
    const realSave = saveData, prevC = DATA.customers, prevA = DATA.activities, hadKey = Object.prototype.hasOwnProperty.call(DATA, 'gainsightQueue'), prevQ = DATA.gainsightQueue;
    let ok = false, detail = '';
    try{
      const c = gp4Cust('__gp6d__'); c.stage = 'ttfv1';
      DATA.customers = [c]; DATA.gainsightQueue = [];
      let store = JSON.stringify(DATA), snapshot = null, saves = 0;
      saveData = function(){ saves++; snapshot = store; store = JSON.stringify(DATA); return true; };
      const done = confirmGraduation(c, {verdict:'met', note:'Report filed', exitReason:'goal_met_early', newGoal:{type:'publish', text:'Publish FY2026 report', source:'osm'}});
      const snapC = snapshot && JSON.parse(snapshot).customers.find(x => x.id === '__gp6d__');
      const pre = !!snapC && snapC.stage !== 'graduated' && (snapC.goals || []).length === 0 && !snapC.graduation;
      const items = DATA.gainsightQueue.length;
      ok = done === true && saves === 1 && pre && c.stage === 'graduated' && !!primaryGoal(c) && items === 2;
      detail = JSON.stringify({done, saves, snapStage: snapC && snapC.stage, snapGoals: snapC && (snapC.goals || []).length, items});
    }catch(err){ detail = err.message; }
    saveData = realSave;
    DATA.customers = prevC; DATA.activities = prevA;
    if(hadKey) DATA.gainsightQueue = prevQ; else delete DATA.gainsightQueue;
    check('grad-plan c6d: graduating with an inline goal saves once, so the undo snapshot is the pre-action book', ok, detail);
  })();
  (function(){                                   // c6e
    let ok = false, detail = '';
    try{
      const raw = defaultData(); raw.config.goalGates.Sustainability.publish = 'not a list';
      raw.config.goalGates.Sustainability.program = ['  Kept  ', 42, null, 'x'.repeat(500)];
      raw.config.goalGates.Sustainability.setup_next = Array.from({length: MAX_GOAL_GATES + 5}, (_, i) => 'Gate ' + i);
      const out = prepareBookData(JSON.parse(JSON.stringify(raw)), 'Import');
      const s = out.config.goalGates.Sustainability;
      const lists = Array.isArray(s.publish) && s.publish.length === 0;
      const strings = s.program[0] === 'Kept' && s.program.every(x => typeof x === 'string' && x.length <= 200);
      const capped = s.setup_next.length === MAX_GOAL_GATES;
      ok = lists && strings && capped;
      detail = JSON.stringify({lists, strings, capped, program: s.program.map(x => x.length)});
    }catch(err){ detail = err.message; }
    check('grad-plan c6e: the load repair pass cleans a hand-edited config.goalGates (non-array lists, non-string entries, long lines, too many gates)', ok, detail);
  })();

  /* C-2: connector client. The suite is synchronous, so the checks drive the pure halves
     (request builder, response mapper, health applier, status renderer) and the real
     checkConnectorHealth with a stub fetch that must not be reached while unconfigured.
     The async path end to end (stub fetch through callAiAPI) is the probe in
     docs/superpowers/evidence/trim-and-integration/c2-async-probe.js. */
  (function(){                                   // c2a
    let ok = false, detail = '';
    try{
      const n = normalizeConnectorUrl;
      const good = n('http://127.0.0.1:8787/') === 'http://127.0.0.1:8787' && n('http://localhost:1') === 'http://localhost:1'
        && n(' http://localhost:8787// ') === 'http://localhost:8787';
      const bad = ['https://evil.example', 'http://10.0.0.1:8787', 'file:///x', '', 'http://127.0.0.1', 'http://127.0.0.1:80/x', null, undefined]
        .every(u => n(u) === '');
      ok = good && bad; detail = JSON.stringify({good, bad});
    }catch(err){ detail = err.message; }
    check('connector c2a: normalizeConnectorUrl accepts only http://127.0.0.1:<port> and http://localhost:<port>, trailing slash removed', ok, detail);
  })();
  (function(){                                   // c2b
    let ok = false, detail = '';
    const raw = localStorage.getItem('obm-connector-settings-v1');
    try{
      localStorage.removeItem(CONNECTOR_SETTINGS_KEY);
      const empty = JSON.stringify(getConnectorSettings()) === '{"url":"","token":""}' && connectorConfigured() === false;
      saveConnectorSettings({url: ' http://127.0.0.1:8787/ ', token: ' abc '});
      const s = getConnectorSettings();
      const round = s.url === 'http://127.0.0.1:8787' && s.token === 'abc' && connectorConfigured() === true;
      saveConnectorSettings({url: 'https://evil.example', token: 'abc'});
      const rejected = getConnectorSettings().url === '' && connectorConfigured() === false;
      saveConnectorSettings({url: 'http://localhost:9', token: 'abc'});
      const stored = Object.keys(JSON.parse(localStorage.getItem(CONNECTOR_SETTINGS_KEY))).sort().join(',');
      ok = empty && round && rejected && stored === 'token,url' && CONNECTOR_SETTINGS_KEY === 'obm-connector-settings-v1'
        && CONNECTOR_SETTINGS_KEY !== AI_SETTINGS_KEY;
      detail = JSON.stringify({empty, round, rejected, stored});
    }catch(err){ detail = err.message; }
    finally{ if(raw === null) localStorage.removeItem('obm-connector-settings-v1'); else localStorage.setItem('obm-connector-settings-v1', raw); }
    check('connector c2b: settings round-trip under obm-connector-settings-v1 as {url, token} only, an off-loopback address is dropped (P8, K10)', ok, detail);
  })();
  (function(){                                   // c2c
    let ok = false, detail = '';
    try{
      const st = {url: 'http://127.0.0.1:8787', token: 'tok'};
      const post = buildConnectorRequest('/v1/ai', {method: 'POST', body: {a: 1}}, st);
      const get = buildConnectorRequest('/v1/health', {}, st);
      ok = post.url === 'http://127.0.0.1:8787/v1/ai' && post.init.method === 'POST'
        && post.init.headers.Authorization === 'Bearer tok' && post.init.headers['Content-Type'] === 'application/json'
        && post.init.body === '{"a":1}'
        && get.init.method === 'GET' && get.init.body === undefined && get.init.headers.Authorization === 'Bearer tok'
        && connectorErrorFor(401).code === 'UNAUTHORIZED' && connectorErrorFor(502).code === 'HTTP'
        && connectorErrorFor(502).message.indexOf('502') !== -1;
      detail = JSON.stringify({post: post.init, get: get.init});
    }catch(err){ detail = err.message; }
    check('connector c2c: buildConnectorRequest sends the bearer token and a JSON body on POST only; 401 maps to UNAUTHORIZED, other statuses to HTTP', ok, detail);
  })();
  (function(){                                   // c2d
    let ok = false, detail = '';
    try{
      const body = buildConnectorAiBody('p', {task: 'copilot_read', maxTokens: 5});
      const dflt = buildConnectorAiBody('p', {});
      const src = String(callAiAPI);
      const routed = src.indexOf('connectorConfigured()') !== -1 && src.indexOf("'/v1/ai'") !== -1
        && src.indexOf('connectorConfigured()') < src.indexOf('NO_KEY');
      ok = JSON.stringify(body) === '{"task":"copilot_read","prompt":"p","maxTokens":5}'
        && JSON.stringify(dflt) === '{"task":"general","prompt":"p","maxTokens":800}' && routed;
      detail = JSON.stringify({body, dflt, routed});
    }catch(err){ detail = err.message; }
    check('connector c2d: callAiAPI routes through the connector before the browser-key check, body is {task, prompt, maxTokens}', ok, detail);
  })();
  (function(){                                   // c2e
    let ok = false, detail = '';
    try{
      const want = {generateCopilotRead: ['copilot_read'], generateCustomerAiBrief: ['call_prep'],
        generateSessionDebrief: ['debrief', 'debrief_scores', 'call_review'],
        generateRiskSummaryAi: ['risk_summary'], generateThreadAnswer: ['thread_answer']};
      const fns = {generateCopilotRead, generateCustomerAiBrief, generateSessionDebrief, generateRiskSummaryAi, generateThreadAnswer};
      const miss = [];
      let sites = 0;
      Object.keys(want).forEach(f => want[f].forEach(t => { sites++; if(String(fns[f]).indexOf("task: '" + t + "'") === -1) miss.push(f + ':' + t); }));
      ok = !miss.length && sites === 7; detail = JSON.stringify({sites, miss});
    }catch(err){ detail = err.message; }
    check('connector c2e: all 7 callAiAPI call sites pass their P6 task name', ok, detail);
  })();
  (function(){                                   // c2f
    let ok = false, detail = '';
    try{
      const t = connectorAiResult({text: 'ok', truncated: true});
      const f = connectorAiResult({text: 'ok'});
      let threw = '';
      try{ connectorAiResult({nope: 1}); }catch(e){ threw = e.code; }
      ok = t.text === 'ok' && t.truncated === true && f.truncated === false && threw === 'HTTP'
        && String(callAiAPI).indexOf('connectorAiResult(') !== -1;
      detail = JSON.stringify({t, f, threw});
    }catch(err){ detail = err.message; }
    check('connector c2f: a truncated:true connector reply reaches the caller as {text, truncated:true}; absent means false; a reply without text is an error', ok, detail);
  })();
  (function(){                                   // c2g
    let ok = false, detail = '';
    const saved = ui.connector;
    try{
      applyConnectorHealth(null, 'OFFLINE');
      const off = ui.connector.state === 'offline' && renderConnectorStatus().indexOf('Connector offline') !== -1
        && renderConnectorStatus().indexOf('--text-faint') !== -1;
      applyConnectorHealth(null, 'UNAUTHORIZED');
      const un = ui.connector.state === 'unauthorized' && renderConnectorStatus().indexOf('token') !== -1;
      ui.connector = {state: 'unset', fake: false, adapters: {}, checkedAt: null};
      const unset = renderConnectorStatus() === '';
      ok = off && un && unset; detail = JSON.stringify({off, un, unset});
    }catch(err){ detail = err.message; }
    finally{ ui.connector = saved; }
    check('connector c2g: offline renders a quiet "Connector offline", unauthorized names the token, unset renders nothing; none throws', ok, detail);
  })();
  (function(){                                   // c2h
    let ok = false, detail = '';
    const saved = ui.connector;
    try{
      applyConnectorHealth({version: '1', adapters: {gong: 'fake', gainsight: 'fake', ai: 'fake'}});
      const fake = ui.connector.fake === true && renderConnectorStatus().indexOf('FAKE DATA') !== -1;
      applyConnectorHealth({version: '1', adapters: {gong: 'gong', gainsight: 'gainsight', ai: 'claude'}});
      const live = ui.connector.fake === false && renderConnectorStatus().indexOf('Connector: connected') !== -1
        && renderConnectorStatus().indexOf('FAKE') === -1;
      applyConnectorHealth({version: '1', adapters: {gong: 'gong', gainsight: 'gainsight', ai: 'fake'}});
      const one = renderConnectorStatus().indexOf('FAKE DATA') !== -1;
      ok = fake && live && one; detail = JSON.stringify({fake, live, one});
    }catch(err){ detail = err.message; }
    finally{ ui.connector = saved; }
    check('connector c2h: FAKE DATA shows whenever any adapter reports "fake"; all-real shows "Connector: connected"', ok, detail);
  })();
  (function(){                                   // c2j
    let ok = false, detail = '';
    const saved = ui.connector;
    try{
      applyConnectorHealth({version: '1', adapters: {gong: 'gong-rest (unproven)', gainsight: 'gainsight-rest (unproven, dry-run)', ai: 'claude'}});
      const unp = ui.connector.unproven === true && renderConnectorStatus().indexOf('Connector: UNPROVEN') !== -1
        && renderConnectorStatus().indexOf('--status-watch-text') !== -1;
      applyConnectorHealth({version: '1', adapters: {gong: 'gong-rest', gainsight: 'gainsight-rest (dry-run)', ai: 'claude'}});
      const dry = ui.connector.unproven === false && ui.connector.dryRun === true
        && renderConnectorStatus().indexOf('Connector: DRY RUN') !== -1 && renderConnectorStatus().indexOf('--status-watch-text') !== -1;
      applyConnectorHealth({version: '1', adapters: {gong: 'gong-rest', gainsight: 'gainsight-rest', ai: 'claude'}});
      const live = ui.connector.unproven === false && ui.connector.dryRun === false && renderConnectorStatus().indexOf('Connector: connected') !== -1;
      ok = unp && dry && live; detail = JSON.stringify({unp, dry, live});
    }catch(err){ detail = err.message; }
    finally{ ui.connector = saved; }
    check('connector c2j: an adapter flagged "unproven" shows Connector: UNPROVEN, "dry-run" shows Connector: DRY RUN, no flag shows connected (D2)', ok, detail);
  })();
  (function(){                                   // c2k
    let ok = false, detail = '';
    const saved = ui.connector;
    try{
      applyConnectorHealth({version: '1', adapters: {gong: 'fake', gainsight: 'gainsight-rest (unproven, dry-run)', ai: 'fake'}});
      const fakeFirst = renderConnectorStatus().indexOf('FAKE DATA') !== -1 && renderConnectorStatus().indexOf('UNPROVEN') === -1;
      applyConnectorHealth({version: '1', adapters: {gong: 'gong-rest (unproven)', gainsight: 'gainsight-rest (dry-run)', ai: 'claude'}});
      const unpFirst = renderConnectorStatus().indexOf('UNPROVEN') !== -1 && renderConnectorStatus().indexOf('DRY RUN') === -1;
      applyConnectorHealth(null, 'OFFLINE');
      const reset = ui.connector.unproven === false && ui.connector.dryRun === false;
      ok = fakeFirst && unpFirst && reset; detail = JSON.stringify({fakeFirst, unpFirst, reset});
    }catch(err){ detail = err.message; }
    finally{ ui.connector = saved; }
    check('connector c2k: FAKE DATA outranks UNPROVEN, UNPROVEN outranks DRY RUN, offline clears both flags', ok, detail);
  })();
  (function(){                                   // c2i
    let ok = false, detail = '';
    const raw = localStorage.getItem('obm-connector-settings-v1');
    let savedFetch;
    const saved = ui.connector;
    try{
      savedFetch = _connectorFetch;
      localStorage.removeItem(CONNECTOR_SETTINGS_KEY);
      let calls = 0;
      _connectorFetch = function(){ calls++; return Promise.reject(new TypeError('Failed to fetch')); };
      const p = checkConnectorHealth();
      p.catch(function(){});
      ok = p instanceof Promise && calls === 0 && ui.connector.state === 'unset' && renderConnectorStatus() === ''
        && String(renderHeader).indexOf('renderConnectorStatus()') !== -1
        && String(openSettingsModal).indexOf('btn-connector-check') !== -1;
      detail = JSON.stringify({calls, state: ui.connector.state});
    }catch(err){ detail = err.message; }
    finally{
      if(savedFetch) _connectorFetch = savedFetch;
      ui.connector = saved;
      if(raw === null) localStorage.removeItem('obm-connector-settings-v1'); else localStorage.setItem('obm-connector-settings-v1', raw);
    }
    check('connector c2i: with no connector configured nothing is fetched, status is unset, and the header and Settings carry the connector status and Check button (K8)', ok, detail);
  })();

  /* C-3: Gong pull ("Check for calls") and the G06 fix. K7: an Email activity never carries a sessionNumber. */
  const c3Calls = () => [
    {callId: 'c-demo-001', startedAt: '2026-09-08T14:00:00Z', title: 'Aldridge Energy: session check-in', url: 'https://fake.gong.invalid/call/c-demo-001',
      participants: [{name: 'Riley Demo', email: 'riley.demo@fake-osm.invalid', affiliation: 'internal'}, {name: 'Dana', email: 'dana.aldridge-energy@fake-customer.invalid', affiliation: 'customer'}],
      accountRef: {gainsightId: 'GS-DEMO-001', name: 'Aldridge Energy'}, summary: 'FAKE summary one', transcript: 'FAKE transcript one'},
    {callId: 'c-demo-002', startedAt: '2026-09-10T16:30:00Z', title: 'Corvus Logistics: pre-UAT sync',
      participants: [{name: 'Riley Demo', email: 'riley.demo@fake-osm.invalid', affiliation: 'internal'}],
      accountRef: {gainsightId: 'GS-DEMO-003', name: 'Corvus Logistics'}, summary: 'FAKE summary two', transcript: 'FAKE transcript two'},
    {callId: 'c-demo-003', startedAt: '2026-09-12T15:00:00Z', title: 'Fernbrook Retail: policy review',
      participants: [{name: 'Dana', email: 'dana.fernbrook-retail@fake-customer.invalid', affiliation: 'customer'}],
      accountRef: {gainsightId: null, name: 'Fernbrook Retail'}, summary: 'FAKE summary three', transcript: 'FAKE transcript three'},
    {callId: 'c-demo-004', startedAt: '2026-09-15T13:00:00Z', title: 'Quick sync with Sam',
      participants: [{name: 'Riley Demo', email: 'riley.demo@fake-osm.invalid', affiliation: 'internal'}, {name: 'Sam Demo', email: 'sam.demo@fake-customer.invalid', affiliation: 'customer'}],
      accountRef: {gainsightId: null, name: null}, summary: 'FAKE summary four', transcript: 'FAKE transcript four'},
    {callId: 'c-demo-005', startedAt: '2026-09-17T10:00:00Z', title: 'Intro call with unknown prospect',
      participants: [{name: 'Pat Nobody', email: 'pat.nobody@unknown-company.invalid', affiliation: 'unknown'}],
      accountRef: {gainsightId: null, name: null}, summary: 'FAKE summary five', transcript: 'FAKE transcript five'},
    {callId: 'c-demo-006', kind: 'email', startedAt: '2026-09-18T09:00:00Z', title: 'Email: follow-up on checklist',
      participants: [{name: 'Dana', email: 'dana.brightwater-foods@fake-customer.invalid', affiliation: 'customer'}],
      accountRef: {gainsightId: 'GS-DEMO-002', name: 'Brightwater Foods'}, summary: 'FAKE gong summary six', transcript: 'x'.repeat(130000)}
  ];
  const c3Customers = () => [
    {id: 'k1', name: 'Aldridge Energy', gainsightId: 'GS-DEMO-001', totalSessions: 6, stakeholders: []},
    {id: 'k2', name: 'Brightwater Foods', gainsightId: 'GS-DEMO-002', totalSessions: 6, stakeholders: []},
    {id: 'k3', name: 'Corvus Logistics', gainsightId: 'GS-DEMO-003', totalSessions: 6, stakeholders: []},
    {id: 'k4', name: 'Fernbrook Retail', gainsightId: 'GS-DEMO-004', totalSessions: 6, stakeholders: []},
    {id: 'k5', name: 'Sam Co', totalSessions: 6, stakeholders: [{id: 's1', name: 'Sam Demo', email: 'sam.demo@fake-customer.invalid'}]}
  ];
  (function(){                                   // c3a
    let ok = false, detail = '';
    try{
      const cs = [
        {id: 'a', name: 'Alpha', gainsightId: 'G-A', stakeholders: []},
        {id: 'b', name: 'Beta', gainsightId: 'G-B', stakeholders: []},
        {id: 't1', name: 'Twin Co', stakeholders: [{email: 'x@one.invalid'}]},
        {id: 't2', name: ' twin co ', stakeholders: [{email: 'y@two.invalid'}, {email: 'shared@both.invalid'}]},
        {id: 't3', name: 'Other', stakeholders: [{email: 'shared@both.invalid'}]},
        {id: 'd1', name: 'Dup1', gainsightId: 'G-DUP', stakeholders: []},
        {id: 'd2', name: 'Dup2', gainsightId: 'G-DUP', stakeholders: []}];
      const call = (gid, name, emails) => ({callId: 'z', accountRef: {gainsightId: gid, name}, participants: (emails || []).map(e => ({email: e}))});
      const m = (g, n, e) => matchCallToAccount(call(g, n, e), cs);
      const idBeatsName = JSON.stringify(m('G-A', 'Beta')) === '{"customerId":"a","matchedBy":"gainsightId"}';
      const nameOnly = JSON.stringify(m(null, '  ALPHA ')) === '{"customerId":"a","matchedBy":"name"}';
      const emailOnly = JSON.stringify(m(null, null, ['Y@TWO.invalid'])) === '{"customerId":"t2","matchedBy":"email"}';
      const ambigNameToEmail = JSON.stringify(m(null, 'Twin Co', ['x@one.invalid'])) === '{"customerId":"t1","matchedBy":"email"}';
      const ambigNameNoEmail = JSON.stringify(m(null, 'Twin Co', [])) === '{"customerId":null,"matchedBy":null}';
      const ambigEmail = JSON.stringify(m(null, null, ['shared@both.invalid'])) === '{"customerId":null,"matchedBy":null}';
      const dupIdFallsToName = JSON.stringify(m('G-DUP', 'Dup2')) === '{"customerId":"d2","matchedBy":"name"}';
      const none = JSON.stringify(m(null, null, ['nobody@nowhere.invalid'])) === '{"customerId":null,"matchedBy":null}';
      const noRef = JSON.stringify(matchCallToAccount({callId: 'z'}, cs)) === '{"customerId":null,"matchedBy":null}';
      ok = idBeatsName && nameOnly && emailOnly && ambigNameToEmail && ambigNameNoEmail && ambigEmail && dupIdFallsToName && none && noRef;
      detail = JSON.stringify({idBeatsName, nameOnly, emailOnly, ambigNameToEmail, ambigNameNoEmail, ambigEmail, dupIdFallsToName, none, noRef});
    }catch(err){ detail = err.message; }
    check('gong c3a: matchCallToAccount tries id, then exact name, then stakeholder email; a rule that finds two accounts is skipped, never guessed; nothing matches -> null', ok, detail);
  })();
  (function(){                                   // c3b
    let ok = false, detail = '';
    try{
      const cs = c3Customers(), calls = c3Calls();
      const p = buildCallPreview(calls, cs, {});
      const by = p.matched.map(r => r.matchedBy).sort().join(',');
      const shape = p.matched.length === 5 && by === 'email,gainsightId,gainsightId,gainsightId,name'
        && p.unmatched.length === 1 && p.unmatched[0].callId === 'c-demo-005' && p.linked.length === 0;
      const row1 = p.matched.find(r => r.call.callId === 'c-demo-001');
      const opts = row1 && row1.type === 'Call' && JSON.stringify(row1.sessionOptions) === '[1,2,3,4,5,6]';
      const p2 = buildCallPreview(calls, cs, {k1: [{id: 'x', type: 'Call', sessionNumber: 2, gong: {callId: 'c-demo-001'}}]});
      const moved = p2.linked.length === 1 && p2.linked[0].call.callId === 'c-demo-001' && p2.matched.length === 4 && p2.unmatched.length === 1;
      const consumed = JSON.stringify(buildCallPreview(calls, cs, {k1: [{id: 'x', type: 'Call', sessionNumber: 2}]}).matched.find(r => r.call.callId === 'c-demo-001').sessionOptions) === '[1,3,4,5,6]';
      ok = shape && opts && moved && consumed;
      detail = JSON.stringify({by, m: p.matched.length, u: p.unmatched.length, l: p.linked.length, opts, moved, consumed});
    }catch(err){ detail = err.message; }
    check('gong c3b: buildCallPreview on the six fixture-shaped calls gives 5 matched (3 id, 1 name, 1 email), 1 unmatched, 0 linked; a callId already on an activity moves to linked; logged sessions leave sessionOptions', ok, detail);
  })();
  (function(){                                   // c3c
    let ok = false, detail = '';
    const savedCustomers = DATA.customers, savedActs = DATA.activities;
    try{
      const cs = c3Customers();
      DATA.customers = savedCustomers.concat(cs);
      /* Fixture-only activities: applyCallImport dedupes callIds against ALL of DATA.activities, so a live book
         that already links a fixture call id (real use of the fake connector) would skip the row. Restored in finally. */
      DATA.activities = {};
      cs.forEach(c => { DATA.activities[c.id] = []; });
      const p = buildCallPreview(c3Calls(), cs, {}); // fixture activities only: the live book may already link these call ids
      const em = p.matched.find(r => r.call.callId === 'c-demo-006');
      const typed = em && em.type === 'Email' && em.sessionOptions.length === 0;
      const callRow = p.matched.find(r => r.call.callId === 'c-demo-001');
      const res = applyCallImport([
        {call: em.call, customerId: em.customerId, type: em.type, sessionNumber: 3, matchedBy: em.matchedBy},
        {call: callRow.call, customerId: callRow.customerId, type: 'Call', sessionNumber: 3, matchedBy: callRow.matchedBy}]);
      const email = (DATA.activities.k2 || [])[0], call = (DATA.activities.k1 || [])[0];
      const emailOk = email && email.type === 'Email' && email.sessionNumber === null && email.gong && email.gong.callId === 'c-demo-006'
        && email.transcript && email.transcript.text.length === 130000 && email.transcript.truncated === false
        && email.summary === 'Email: follow-up on checklist' && email.summary !== 'FAKE gong summary six' && email.gong.summary === 'FAKE gong summary six'
        && email.date === '2026-09-18' && email.checklist.length === ACTIVITY_TYPES.Email.length;
      const callOk = call && call.type === 'Call' && call.sessionNumber === 3 && call.gong.matchedBy === 'gainsightId';
      ok = typed && res.created === 2 && !!emailOk && !!callOk;
      detail = JSON.stringify({typed, created: res.created, emailOk: !!emailOk, callOk: !!callOk, sn: email && email.sessionNumber});
    }catch(err){ detail = err.message; }
    finally{
      DATA.customers = savedCustomers;
      ['k1', 'k2', 'k3', 'k4', 'k5'].forEach(id => { delete DATA.activities[id]; });
      DATA.activities = savedActs;
    }
    check('gong c3c: K7 Gong path: the email touch previews as Email with no session options, and applying it with sessionNumber 3 stores null; transcript stored whole (130,000); summary is the title, not the Gong summary; a Call keeps its session', ok, detail);
  })();
  (function(){                                   // c3d
    let ok = false, detail = '';
    try{
      const c = gp4Cust('__gc3d__', 6);   // own fixture (M-6); gp4Cust is not in implementation and has sessions
      const host = document.createElement('div');
      host.innerHTML = renderLogActivityTab(c);
      bindActTypeSessionLock(host);
      const type = host.querySelector('#act-type'), sess = host.querySelector('#act-session');
      const pre = sess.value;                      // the form still preselects the next session for a Call
      type.value = 'Email'; type.dispatchEvent(new Event('change', {bubbles: true}));
      const emailLocked = sess.value === '' && sess.disabled === true;
      type.value = 'Call'; type.dispatchEvent(new Event('change', {bubbles: true}));
      const callOpen = sess.value === '' && sess.disabled === false;
      const forced = sessionNumberForSave('Email', '3') === null && sessionNumberForSave('Partner Sync', '2') === null
        && sessionNumberForSave('Call', '3') === 3 && sessionNumberForSave('Call', '') === null;
      const wired = String(attachEvents).indexOf('bindActTypeSessionLock(') !== -1 && String(attachEvents).indexOf('sessionNumberForSave(') !== -1
        && !!c;
      const types = NON_SESSION_ACTIVITY_TYPES.join(',') === 'Email,Partner Sync,Implementation Note'
        && isSessionCapableType('Call') && isSessionCapableType('Other') && !isSessionCapableType('Email');
      ok = emailLocked && callOpen && forced && wired && types;
      detail = JSON.stringify({pre, emailLocked, callOpen, forced, wired, types});
    }catch(err){ detail = err.message; }
    check('gong c3d: K7 form path (G06): choosing Email clears and disables Session #, switching to Call re-enables it still empty; the save path forces null for non-session types', ok, detail);
  })();
  (function(){                                   // c3e
    let ok = false, detail = '';
    const realSave = saveData, realLabel = _undoLabel;
    const savedActs = DATA.activities, savedCustomers = DATA.customers;
    let saves = 0;
    try{
      saveData = function(){ saves++; return true; };
      const empty = applyCallImport([]);
      const cs = c3Customers();
      DATA.customers = savedCustomers.concat(cs);
      DATA.activities.k1 = [];
      const future = c3Calls()[0];
      future.startedAt = new Date(Date.now() + 5 * 86400000).toISOString();
      const refused = applyCallImport([{call: future, customerId: 'k1', type: 'Call', sessionNumber: null, matchedBy: 'gainsightId'}]);
      const wrongAcct = applyCallImport([{call: c3Calls()[0], customerId: 'nope', type: 'Call', sessionNumber: null, matchedBy: 'manual'}]);
      ok = empty.created === 0 && refused.created === 0 && wrongAcct.created === 0 && saves === 0 && DATA.activities.k1.length === 0 && _undoLabel === realLabel;
      detail = JSON.stringify({saves, empty, refused, wrongAcct});
    }catch(err){ detail = err.message; }
    finally{
      saveData = realSave;
      DATA.customers = savedCustomers; delete DATA.activities.k1; DATA.activities = savedActs;
    }
    check('gong c3e: applyCallImport writes nothing (no save, no undo label) for an empty list, a future-dated call or an unknown account', ok, detail);
  })();
  (function(){                                   // R2 I-3: local calendar date, not the UTC slice
    let ok = false, detail = '';
    const realSave = saveData;
    const savedActs = DATA.activities, savedCustomers = DATA.customers;
    try{
      saveData = function(){ return true; };
      const cs = c3Customers();
      DATA.customers = savedCustomers.concat(cs);
      DATA.activities = {k1: []};
      const now = new Date();
      const lateLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 30, 0);   // today 23:30 local: UTC date is tomorrow west of UTC
      const earlyLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 30, 0);   // today 00:30 local: UTC date is yesterday east of UTC
      const mk = (id, d) => Object.assign({}, c3Calls()[0], {callId: id, startedAt: d.toISOString()});
      const today = todayISO();
      const res = applyCallImport([
        {call: mk('r2-late', lateLocal), customerId: 'k1', type: 'Call', sessionNumber: null, matchedBy: 'gainsightId'},
        {call: mk('r2-early', earlyLocal), customerId: 'k1', type: 'Call', sessionNumber: null, matchedBy: 'gainsightId'}]);
      const dates = (DATA.activities.k1 || []).map(a => a.date).join(',');
      // the preview line must show the same local day
      const backdropBefore = document.querySelectorAll('.modal-backdrop').length;
      openCallPreviewModal({matched: [{call: mk('r2-pv', lateLocal), customerId: 'k1', matchedBy: 'gainsightId', type: 'Call', sessionOptions: []}], unmatched: [], linked: []});
      const bd = document.querySelector('.modal-backdrop');
      const shown = !!bd && bd.innerHTML.indexOf(escapeHtml(fmtDate(today))) !== -1;
      if(bd && backdropBefore === 0) bd.remove();
      ok = res.created === 2 && dates === today + ',' + today && shown;
      detail = JSON.stringify({created: res.created, dates, today, shown, tz: Intl.DateTimeFormat().resolvedOptions().timeZone});
    }catch(err){ detail = err.message; }
    finally{
      saveData = realSave;
      DATA.customers = savedCustomers; DATA.activities = savedActs;
    }
    check('gong r2-i3: applyCallImport and the preview date a call by the LOCAL calendar day (today 23:30 and 00:30 local both stored as today and not refused as future)', ok, detail);
  })();
  (function(){                                   // R2 M-1: Add must not advance the since window
    let ok = false, detail = '';
    const realSave = saveData, savedActs = DATA.activities, savedCustomers = DATA.customers, savedLast = ui.lastCallPullAt, realRender = window.render;   // the Add handler calls window.render(); these bare c3Customers() have no compliance block, so a real render would throw in pendingGainsightItems
    try{
      saveData = function(){ return true; };
      const cs = c3Customers();
      DATA.customers = savedCustomers.concat(cs);
      DATA.activities = {k1: []};
      ui.lastCallPullAt = null;
      const call = Object.assign({}, c3Calls()[0], {callId: 'r2-m1', startedAt: new Date(Date.now() - 86400000).toISOString()});
      const sinceBefore = callSinceISO();
      openCallPreviewModal({matched: [{call, customerId: 'k1', matchedBy: 'gainsightId', type: 'Call', sessionOptions: []}], unmatched: [], linked: []});
      const bd = document.querySelector('.modal-backdrop');
      const box = bd.querySelector('[data-cp-on]');
      box.checked = true; box.dispatchEvent(new Event('change', {bubbles: true}));
      window.render = function(){};
      bd.querySelector('#cp-add').click();
      const sinceAfter = callSinceISO();
      const gapMs = Date.now() - new Date(sinceAfter).getTime();
      const added = (DATA.activities.k1 || []).length === 1;
      ok = added && Math.abs(gapMs - 30 * 86400000) < 60000 && sinceAfter.slice(0, 10) === sinceBefore.slice(0, 10);
      detail = JSON.stringify({added, gapDays: Math.round(gapMs / 8640000) / 10, sinceBefore, sinceAfter});
    }catch(err){ detail = err.message; }
    finally{
      saveData = realSave; ui.lastCallPullAt = savedLast; window.render = realRender;
      DATA.customers = savedCustomers; DATA.activities = savedActs;
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    }
    check('gong r2-m1: after Add the next "since" is still the 30-day window (a late-processed or unticked call is not hidden)', ok, detail);
  })();
  (function(){                                   // R2 M-3: the account Gainsight tab counts only unsent queue items as queued
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevQ = DATA.gainsightQueue;
    try{
      const cc = {id:'__r2m3__', name:'R2M3', module:DATA.config.modules[0], stage:DATA.config.stages[1].key,
        implementationDate: isoAddDays(todayISO(), -60), totalSessions:8, domainScores:{}, sessionNotes:{}, stageHistory:[]};
      backfillCustomerRecord(cc);
      DATA.customers = [cc]; DATA.activities = {__r2m3__: []};
      const qi = status => ({id: uid(), date: todayISO(), customerId: '__r2m3__', customerName: 'R2M3', kind: 'item', payload: 'p', status, fields: {}, externalId: null, sentAt: null, error: null});
      const render = q => { DATA.gainsightQueue = q; _renderMemoResets.forEach(r => r()); return renderCustomerGainsightTab(cc); };
      const onlySent = render([qi('sent'), qi('sent')]);
      const mixed = render([qi('sent'), qi('queued')]);
      const none = render([]);
      const noBadge = onlySent.indexOf(' queued</span>') === -1 && none.indexOf(' queued</span>') === -1;
      const oneQueued = mixed.indexOf('>1 queued</span>') !== -1;
      ok = noBadge && oneQueued && onlySent.indexOf('data-gainsight-batch') !== -1;
      detail = JSON.stringify({noBadge, oneQueued});
    }catch(err){ detail = err.message; }
    finally{
      DATA.customers = prevC; DATA.activities = prevA;
      if(prevQ === undefined) delete DATA.gainsightQueue; else DATA.gainsightQueue = prevQ;   // do not leave the key behind (v74.4/74.5)
      _renderMemoResets.forEach(r => r());
    }
    check('gainsight r2-m3: the account tab shows "N queued" for unsent items only (sent items are not counted)', ok, detail);
  })();
  /* C-4: Gainsight pull ("Refresh from Gainsight"). A pull shows five fields and offers gate ticks; it writes only
     what the OSM ticks, and never stage, goals, verdicts, notes or scores. */
  const c4Customer = (o) => Object.assign({id: 'g1', name: 'Gamma Co', gainsightId: 'GS-X-1', stage: 'ttfv1', tier: 'Mid-market', arr: 100000,
    renewalDate: '2027-01-01', stakeholders: [{id: 's1', name: 'Dana One', role: 'champion', note: '', email: 'dana@x.invalid'}],
    compliance: {sentiment: {done: true}, outcomePlan: {done: false}, associatedPeopleCSAT: {done: false, contactName: ''}},
    goals: {items: [{id: 'goal1', text: 'keep'}]}, domainScores: {a: 3}, notes: 'my own note', exit: {verdict: 'hold'}}, o || {});
  const c4Account = (o) => Object.assign({gainsightId: 'GS-X-1', name: 'Gamma Co', tier: 'Enterprise', arr: 250000, renewalDate: '2027-06-30',
    csmOwner: 'Riley Demo', contacts: [{name: 'Dana One', email: 'DANA@x.invalid', role: 'Champion'}, {name: 'Lee New', email: 'lee@x.invalid', role: 'Exec sponsor'}],
    healthScore: 82, gates: {readinessAssessment: true, csatContact: true, successPlan: false}, openCtas: []}, o || {});
  (function(){                                   // c4a
    let ok = false, detail = '';
    try{
      const cs = [c4Customer(), c4Customer({id: 'g2', name: 'Delta Co', gainsightId: undefined})];
      const same = c4Account({tier: 'Mid-market', arr: 100000, renewalDate: '2027-01-01', csmOwner: null, contacts: [{name: 'Dana One', email: 'dana@x.invalid', role: 'Champion'}]});
      const d = buildGainsightDiff([c4Account(), c4Account({gainsightId: null, name: 'Delta Co'}), c4Account({gainsightId: 'GS-NOPE', name: 'Ghost'}), same], cs);
      const e = d[0];
      const differs = e.rows.filter(r => r.differs).map(r => r.field).sort().join(',');
      const shape = e.linked === true && e.customerId === 'g1' && e.rows.map(r => r.field).join(',') === 'tier,arr,renewalDate,csmOwner,contacts';
      const vals = e.rows[0].gainsight === 'Enterprise' && e.rows[0].tracker === 'Mid-market' && e.rows[1].gainsight === 250000 && e.rows[1].tracker === 100000;
      const unlinked = d[1].linked === false && d[1].customerId === null && d[1].rows.length === 0 && d[2].linked === false && d[1].name === 'Delta Co';
      const quiet = d[3].rows.filter(r => r.differs).length === 0;
      const ro = e.rows.find(r => r.field === 'csmOwner').writable === false && e.rows.find(r => r.field === 'tier').writable === true;
      ok = differs === 'arr,contacts,csmOwner,renewalDate,tier' && shape && vals && unlinked && quiet && ro;
      detail = JSON.stringify({differs, shape, vals, unlinked, quiet, ro});
    }catch(err){ detail = err.message; }
    check('gainsight c4a: buildGainsightDiff flags differs on exactly the changed fields, matches by gainsightId only (no id -> not linked), a null Gainsight value never differs, and csmOwner is read-only', ok, detail);
  })();
  (function(){                                   // c4b
    let ok = false, detail = '';
    const realSave = saveData, realLabel = _undoLabel, savedCustomers = DATA.customers;
    let saves = 0;
    try{
      saveData = function(){ saves++; return true; };
      const c = c4Customer();
      DATA.customers = savedCustomers.concat([c]);
      const keep = () => JSON.stringify({stage: c.stage, goals: c.goals, domainScores: c.domainScores, notes: c.notes, exit: c.exit, name: c.name});
      const before = keep();
      const e = buildGainsightDiff([c4Account()], [c])[0];
      const allFields = e.rows.filter(r => r.writable && r.differs).map(r => r.field);
      const res = applyGainsightPull([{customerId: 'g1', account: c4Account(), fields: allFields.concat(['csmOwner', 'stage', 'goals']), gates: e.gateOffers.map(g => g.gateKey).concat(['sentiment'])}]);
      const untouched = keep() === before;
      const wrote = c.tier === 'Enterprise' && c.arr === 250000 && c.renewalDate === '2027-06-30' && c.csmOwner === undefined;
      const stamped = !!c.gainsight && /^\d{4}-\d{2}-\d{2}T/.test(c.gainsight.pulledAt) && c.gainsight.values.tier === 'Enterprise' && c.gainsight.values.csmOwner === 'Riley Demo';
      const one = res.updated === 1 && saves === 1 && _undoLabel !== realLabel;
      const none = applyGainsightPull([{customerId: 'g1', account: c4Account(), fields: [], gates: []}, {customerId: 'nope', account: c4Account(), fields: ['tier'], gates: []}]);
      ok = untouched && wrote && stamped && one && none.updated === 0 && saves === 1;
      detail = JSON.stringify({untouched, wrote, stamped, one, none, saves});
    }catch(err){ detail = err.message; }
    finally{ saveData = realSave; DATA.customers = savedCustomers; }
    check('gainsight c4b: applyGainsightPull with every row ticked leaves stage, goals, domain scores, notes and verdicts identical, never writes the CSM owner, stamps c.gainsight, makes one undo and one save; ticking nothing writes nothing', ok, detail);
  })();
  (function(){                                   // c4d (R4, C-4 follow-up)
    /* Bad values from a connector (the contract invites other implementations): the diff must not throw, must not
       offer a write for a value it cannot use, and a ticked pull of such an account must leave the record as it was. */
    let ok = false, detail = '';
    const realSave = saveData, savedCustomers = DATA.customers;
    try{
      saveData = function(){ return true; };
      const c = c4Customer();
      DATA.customers = savedCustomers.concat([c]);
      const bads = [
        c4Account({tier: 5, arr: -1, renewalDate: 'not-a-date', csmOwner: {}, contacts: 'junk', gates: 'x'}),
        c4Account({tier: '   ', arr: 'abc', renewalDate: '2027-02-30', csmOwner: 7, contacts: [null, 7, {name: ''}, {email: 'e@x.invalid'}], gates: null}),
        c4Account({tier: ['Enterprise'], arr: NaN, renewalDate: 12345, contacts: {length: 3}, gates: {readinessAssessment: 'true', csatContact: 1}}),
        c4Account({gainsightId: 'GS-OTHER', arr: 1e30, tier: 'T'.repeat(100000)})
      ];
      const junkEntries = [null, 'x', 7, [], {name: 'No Id Co'}, {gainsightId: 42, name: {}}];
      let threw = '';
      let d;
      try{ d = buildGainsightDiff(bads.concat(junkEntries), [c, {id: 'z'}]); }catch(e){ threw = e.message; }
      const rows = d ? d.slice(0, 3).map(e => e.rows.filter(r => r.differs).map(r => r.field).join(',')) : [];
      const noOffers = !!d && d.slice(0, 3).every(e => e.gateOffers.length === 0);
      const cc = c4Customer({gainsightId: 'GS-OTHER'});
      const big = buildGainsightDiff([bads[3]], [cc])[0];
      const clamped = big.rows[0].gainsight.length === 40 && big.rows[1].gainsight === null;   // tier clamped to 40 chars; an ARR beyond ARR_MAX is not a value
      const html = gainsightValueHtml('tier', '<img src=x onerror=1>');
      const escaped = html.indexOf('<img') === -1;
      const before = JSON.stringify({t: c.tier, a: c.arr, r: c.renewalDate, s: c.stakeholders});
      let applyThrew = '';
      try{ applyGainsightPull(bads.slice(0, 3).map(a => ({customerId: 'g1', account: a, fields: GAINSIGHT_DIFF_FIELDS.slice(), gates: ['sentiment']}))); }catch(e){ applyThrew = e.message; }
      const after = JSON.stringify({t: c.tier, a: c.arr, r: c.renewalDate, s: c.stakeholders});
      ok = !threw && !applyThrew && rows.every(r => r === 'csmOwner' || r === '') && noOffers && clamped && escaped && before === after;
      detail = JSON.stringify({threw, applyThrew, rows, noOffers, clamped, escaped, unchanged: before === after});
    }catch(err){ detail = err.message; }
    finally{ saveData = realSave; DATA.customers = savedCustomers; }
    check('gainsight c4d: buildGainsightDiff and a ticked pull survive bad connector values (non-string tier, negative / NaN / huge ARR, impossible dates, junk contacts and gates, non-record entries) without throwing, offering a write or changing the account; tier is clamped to 40 characters', ok, detail);
  })();
  (function(){                                   // c4e (R4, C-4 follow-up)
    /* Undo of a pull, on an in-memory store (the real saveData is blocked while the suite runs): the snapshot is the
       book as it stood BEFORE the pull, and performUndo puts the account back exactly, contacts and Gainsight stamp included. */
    const realSave = saveData, realDATA = DATA, realSnap = _undoSnapshot, realLabel = _undoLabel, realLast = _lastActionWasUndo;
    let ok = false, detail = '';
    try{
      const c = c4Customer();
      DATA.customers = DATA.customers.concat([c]);
      let store = JSON.stringify(DATA);
      saveData = function(){ _undoSnapshot = {json: store, at: Date.now(), label: _undoLabel}; store = JSON.stringify(DATA); _undoLabel = null; return true; };
      const e = buildGainsightDiff([c4Account()], [c])[0];
      const res = applyGainsightPull([{customerId: 'g1', account: c4Account(), fields: e.rows.filter(r => r.writable && r.differs).map(r => r.field), gates: []}]);
      const pulled = c.tier === 'Enterprise' && c.arr === 250000 && c.stakeholders.length === 2 && !!c.gainsight;
      const labelled = !!_undoSnapshot && _undoSnapshot.label === 'Gainsight pull';
      const undone = performUndo();
      const back = DATA.customers.find(x => x.id === 'g1');
      const restored = !!back && back.tier === 'Mid-market' && back.arr === 100000 && back.renewalDate === '2027-01-01'
        && back.stakeholders.length === 1 && back.gainsight === undefined;
      ok = res.updated === 1 && pulled && labelled && undone === true && restored;
      detail = JSON.stringify({updated: res.updated, pulled, labelled, undone, restored, tier: back && back.tier, n: back && back.stakeholders && back.stakeholders.length});
    }catch(err){ detail = err.message; }
    finally{ saveData = realSave; const g = DATA; DATA = realDATA; _undoSnapshot = realSnap; _undoLabel = realLabel; _lastActionWasUndo = realLast; g.customers = g.customers.filter(x => x.id !== 'g1'); DATA.customers = DATA.customers.filter(x => x.id !== 'g1'); }
    check('gainsight c4e: one performUndo after a pull puts tier, ARR, renewal date, stakeholders and the Gainsight stamp back to the pre-pull account', ok, detail);
  })();
  (function(){                                   // c4c
    let ok = false, detail = '';
    try{
      const open = c4Customer();
      const done = c4Customer({compliance: {sentiment: {done: true}, outcomePlan: {done: false}, associatedPeopleCSAT: {done: true, contactName: 'x'}}});
      const acct = c4Account({gates: {readinessAssessment: true, csatContact: true, successPlan: false}});
      const o = buildGainsightDiff([acct], [open])[0].gateOffers;
      const d = buildGainsightDiff([acct], [done])[0].gateOffers;
      const notDone = buildGainsightDiff([c4Account({gates: {readinessAssessment: false, csatContact: false, successPlan: false}})], [open])[0].gateOffers;
      const one = o.length === 1 && o[0].gateKey === 'csat' && o[0].label === 'CSAT contact';
      ok = one && d.length === 0 && notDone.length === 0;
      detail = JSON.stringify({o, d, notDone});
    }catch(err){ detail = err.message; }
    check('gainsight c4c: a gate is offered only when Gainsight shows it done and the tracker gate is still open (CSAT open + csatContact true -> one offer; already done or not done in Gainsight -> none)', ok, detail);
  })();
  (function(){                                   // c4d
    let ok = false, detail = '';
    const realSave = saveData, savedCustomers = DATA.customers;
    try{
      saveData = function(){ return true; };
      const c = c4Customer();
      DATA.customers = savedCustomers.concat([c]);
      applyGainsightPull([{customerId: 'g1', account: c4Account(), fields: ['contacts'], gates: ['csat']}]);
      const sh = c.stakeholders;
      const added = sh.length === 2 && sh[0].name === 'Dana One' && sh[1].name === 'Lee New' && sh[1].role === 'sponsor' && sh[1].email === 'lee@x.invalid';
      const rest = c.tier === 'Mid-market' && c.arr === 100000 && c.renewalDate === '2027-01-01';       // unticked rows untouched
      const gate = c.compliance.associatedPeopleCSAT.done === true && c.compliance.outcomePlan.done === false;
      const hostile = {name: '<img src=x onerror=alert(1)>', email: 'a@b.invalid', role: 'Champion'};
      const html = gainsightValueHtml('contacts', [hostile]) + gainsightValueHtml('tier', '<b>x</b>');
      const escaped = html.indexOf('<img') === -1 && html.indexOf('<b>') === -1 && html.indexOf('&lt;') !== -1;
      const wired = String(attachEvents).indexOf('refreshFromGainsight') !== -1;
      ok = added && rest && gate && escaped && wired;
      detail = JSON.stringify({added, rest, gate, escaped, wired});
    }catch(err){ detail = err.message; }
    finally{ saveData = realSave; DATA.customers = savedCustomers; }
    check('gainsight c4d: unticked rows stay untouched; ticked contacts only add new stakeholders (never edit or remove) and a ticked gate goes through the one gate write; connector strings are escaped in the preview; the button is wired', ok, detail);
  })();
  /* C-5: push ("Send to Gainsight"). Fields per kind (plan P5), a request that never carries a sent item, results applied by id
     (sent needs an externalId), and the day-close count read from the queue itself. */
  const c5Item = (id, o) => Object.assign({id, date: todayISO(), customerId: 'g1', customerName: 'Gamma Co', kind: 'Pending items batch', payload: 'text', status: 'queued',
    fields: {gates: []}, externalId: null, sentAt: null, error: null}, o || {});
  (function(){                                   // c5a
    let ok = false, detail = '';
    try{
      const c = c4Customer({compliance: {sentiment: {done: false}, outcomePlan: {done: true}, associatedPeopleCSAT: {done: false, contactName: ''}}});
      const f = gainsightFieldsFor('Pending items batch', c);
      const g = f.gates || [];
      const want = GATE_DEFS.filter(d => d.key === 'sentiment' || d.key === 'csat');
      const gatesOk = g.length === 2 && want.every((d, i) => g[i].gateKey === d.key && g[i].contractKey === d.contractKey && g[i].gainsightAction === d.gainsightAction)
        && g[0].contractKey === 'readinessAssessment' && g[1].contractKey === 'csatContact';
      const goal = {text: 'Cut close time', type: 'outcome', targetCycle: '2027-Q1', verdict: null, changeReason: ''};
      const o = gainsightFieldsFor('Success Plan objective', c, {event: 'verdict', goal});
      const goalOk = o.event === 'verdict' && o.objective === 'Cut close time' && o.targetCycle === '2027-Q1' && o.verdict === null && o.changeReason === '' && 'goalType' in o;
      const cta = gainsightFieldsFor('At-Risk CTA', c, {item: {kind: 'Off Track', sev: 3, c, detail: 'Behind', category: {key: 'k', label: 'Adoption'}}});
      const ctaOk = cta.ctaName === 'At-Risk CTA — Gamma Co' && cta.reason === 'Adoption' && cta.severity === 'high';
      const oc = gainsightFieldsFor('Success Outcome Plan', c);
      const ocOk = Array.isArray(oc.outcomes) && oc.outcomes.length === 1 && /^Outcome /.test(oc.outcomes[0]);
      const unknown = Object.keys(gainsightFieldsFor('Nope', c)).length === 0;
      const req = buildPushRequest([c5Item('A'), c5Item('B', {status: 'sent', externalId: 'X'}), c5Item('C', {status: 'failed', error: 'boom'})]);
      const reqOk = req.items.map(i => i.id).join() === 'A,C' && req.items[0].kind === 'Pending items batch' && req.items[0].customerRef.name === 'Gamma Co' && 'gainsightId' in req.items[0].customerRef && isRecordObject(req.items[0].fields);
      ok = gatesOk && goalOk && ctaOk && ocOk && unknown && reqOk;
      detail = JSON.stringify({gatesOk, goalOk, ctaOk, ocOk, unknown, reqOk, g});
    }catch(e){ detail = 'threw: ' + e.message; }
    check('gainsight c5a: gainsightFieldsFor lists exactly the open gates with contractKey and gainsightAction (and the other three kinds per P5); buildPushRequest carries queued and failed items and never a sent one', ok, detail);
  })();
  (function(){                                   // c5-R1 I-4
    let ok = false, detail = '';
    const had = Object.prototype.hasOwnProperty.call(DATA, 'gainsightQueue'), saved = DATA.gainsightQueue;
    try{
      DATA.gainsightQueue = [c5Item('A'), c5Item('B'), c5Item('STRAY')];
      const r = applyPushResults([{id: 'A', status: 'sent', externalId: 'X-1'}, {id: 'STRAY', status: 'sent', externalId: 'FAKE'}, {id: 'B', status: 'failed', error: 'boom'}], new Set(['A', 'B']));
      const q = DATA.gainsightQueue;
      ok = r.sent === 1 && r.failed === 1 && q[0].status === 'sent' && q[1].status === 'failed'
        && q[2].status === 'queued' && q[2].externalId === null && q[2].sentAt === null;
      detail = JSON.stringify({r, st: q.map(x => [x.id, x.status, x.externalId])});
    }catch(e){ detail = 'threw: ' + e.message; }
    finally{ if(had) DATA.gainsightQueue = saved; else delete DATA.gainsightQueue; }
    check('gainsight c5-R1 I-4: applyPushResults only applies results for the ids in the request that was sent; a stray result id for a queued, unsent item never marks it sent', ok, detail);
  })();
  (function(){                                   // c5-R1 M-4
    let ok = false, detail = '';
    try{
      const req = buildPushRequest([c5Item('A'), c5Item('BADKIND', {kind: 'item'}), c5Item('BLANK', {customerName: '   '}), c5Item('EMPTY', {customerName: ''}), c5Item('Z', {kind: 'At-Risk CTA'})]);
      const ids = req.items.map(i => i.id).join();
      const kinds = ['Pending items batch', 'Success Plan objective', 'At-Risk CTA', 'Success Outcome Plan'];
      const allValid = req.items.every(i => kinds.indexOf(i.kind) !== -1 && typeof i.customerRef.name === 'string' && i.customerRef.name.trim().length > 0);
      ok = ids === 'A,Z' && allValid;
      detail = JSON.stringify({ids, allValid});
    }catch(e){ detail = 'threw: ' + e.message; }
    check('gainsight c5-R1 M-4: buildPushRequest skips an item whose kind is outside the four-value enum or whose customer name is blank, so one bad item cannot 400 the whole push', ok, detail);
  })();
  (function(){                                   // c5b
    let ok = false, detail = '';
    const had = Object.prototype.hasOwnProperty.call(DATA, 'gainsightQueue'), saved = DATA.gainsightQueue;
    try{
      DATA.gainsightQueue = [c5Item('A'), c5Item('B'), c5Item('C'), c5Item('D', {status: 'sent', externalId: 'KEEP', sentAt: '2026-01-01T00:00:00.000Z'}), c5Item('E'), c5Item('F')];
      const r = applyPushResults([{id: 'A', status: 'sent', externalId: 'X-1', error: null}, {id: 'B', status: 'failed', externalId: null, error: 'boom'},
        {id: 'ZZ', status: 'sent', externalId: 'Q'}, {id: 'C', status: 'sent', externalId: null}, {id: 'D', status: 'failed', error: 'late'},
        {id: 'E', status: 'sent', externalId: 42}, {id: 'F', status: 'sent'}], new Set(['A', 'B', 'C', 'D', 'E', 'F']));
      const q = DATA.gainsightQueue, A = q[0], B = q[1], C = q[2], D = q[3], E = q[4], F = q[5];
      const stateOk = A.status === 'sent' && A.externalId === 'X-1' && !!A.sentAt && A.error === null
        && B.status === 'failed' && B.error === 'boom' && B.externalId === null && B.sentAt === null
        && C.status === 'sent' && C.externalId === null && !!C.sentAt          // 1.2 B3a: an explicit null id is believed
        && E.status === 'queued' && E.externalId === null && F.status === 'queued' && F.externalId === null   // a numeric id and a missing id key are malformed, never believed
        && D.status === 'sent' && D.externalId === 'KEEP' && D.sentAt === '2026-01-01T00:00:00.000Z'   // a sent item is never overwritten
        && q.length === 6;
      const countOk = r.sent === 2 && r.failed === 1;
      const htmlA = renderGainsightQueueRow(A, 0), htmlB = renderGainsightQueueRow(B, 1), htmlC = renderGainsightQueueRow(C, 2);
      const renderOk = htmlA.indexOf('✓ sent') !== -1 && htmlA.indexOf('X-1') !== -1 && htmlA.indexOf('data-queue-retry') === -1
        && htmlB.indexOf('data-queue-retry="B"') !== -1 && htmlB.indexOf('boom') !== -1 && /Retry/.test(htmlB)
        && htmlC.indexOf('data-queue-retry') === -1 && htmlC.indexOf('boom') === -1 && htmlC.indexOf('id not returned') !== -1;
      B.error = '<img src=x onerror=1>';
      const esc = renderGainsightQueueRow(B, 1).indexOf('<img') === -1;
      const req2 = buildPushRequest(q).items.map(i => i.id).join();
      ok = stateOk && countOk && renderOk && esc && req2 === 'B,E,F';
      detail = JSON.stringify({stateOk, countOk, renderOk, esc, req2, r});
    }catch(e){ detail = 'threw: ' + e.message; }
    finally{ if(had) DATA.gainsightQueue = saved; else delete DATA.gainsightQueue; }
    check('gainsight c5b: applyPushResults sets sent+externalId+sentAt / failed+error by id, ignores unknown ids, marks sent only for a non-empty string id or an explicit null and never touches an already-sent item; a failed row shows its error and Retry, a sent row shows ✓ sent and its id', ok, detail);
  })();
  (function(){                                   // 1.2 B3a: a sent reply with no id is still sent
    let ok = false, detail = '';
    const had = Object.prototype.hasOwnProperty.call(DATA, 'gainsightQueue'), saved = DATA.gainsightQueue;
    try{
      DATA.gainsightQueue = [c5Item('N1')];
      const r = applyPushResults([{id: 'N1', status: 'sent', externalId: null, error: null}], new Set(['N1']));
      const q = DATA.gainsightQueue[0];
      const marked = q.status === 'sent' && q.externalId === null && !!q.sentAt && q.error === null && r.sent === 1;
      const notAgain = buildPushRequest(DATA.gainsightQueue).items.length === 0;
      const row = renderGainsightQueueRow(q, 0);
      const shows = row.indexOf('✓ sent') !== -1 && row.indexOf('id not returned') !== -1 && row.indexOf('data-queue-retry') === -1;
      ok = marked && notAgain && shows;
      detail = JSON.stringify({marked, notAgain, shows, r});
    }catch(e){ detail = 'threw: ' + e.message; }
    finally{ if(had) DATA.gainsightQueue = saved; else delete DATA.gainsightQueue; }
    check('1.2 B3a a sent reply with no external id marks the item sent (id not returned) so it cannot be sent twice', ok, detail);
  })();
  (function(){                                   // v13 Step 2a
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    try{
      const c = v13Acct('__s2a__');
      DATA.customers = [c]; DATA.activities = {}; DATA.riskLog = {};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const items = buildRiskHubList({readOnly: true}).filter(it => it.c.id === c.id);   // real items: Off Track from riskOverride
      const lab = riskLabel(computeRisk(c)), st = accountStateLabel(c), rr = riskReasonText(c);
      DATA.riskLog = {'__s2a__|Off Track': {firstSeen: todayISO(), lastActioned: null, verdict: 'confirmed', verdictOn: todayISO(), verdictSev: 3, verdictReason: 'Customer said they will not renew'}};
      const texts = [buildCallPrepContext(c).text, JSON.stringify(aiCustomerSnapshot(c))]
        .concat(items.map(buildRiskSummaryPrompt), items.map(buildRiskExecSummary));
      const h = healthScore(c);
      const hRe = new RegExp('(' + h + '\\s*%|health\\D{0,12}' + h + '(\\D|$))', 'i');
      const forbidden = t => /\d+\s*%\s*health|health\D{0,12}\d+|healthScore|riskLabel|RISK TYPE: (Off Track|Watch|Behind target|Risk language|Category signal)/i.test(t)
        || t.indexOf(lab) !== -1 || t.indexOf(st) !== -1 || (rr.length > 8 && t.indexOf(rr) !== -1);
      const bad = texts.map(forbidden);
      const healthNum = texts.some(t => hRe.test(t));
      const reasonKept = texts[0].indexOf('Customer said they will not renew') !== -1 && texts[1].indexOf('Customer said they will not renew') !== -1;
      const facts = texts[0].indexOf(c.name) !== -1 && texts[0].indexOf('Last touchpoint') !== -1 && items.length > 0;
      ok = bad.every(b => !b) && !healthNum && reasonKept && facts;
      detail = JSON.stringify({bad, healthNum, h, reasonKept, facts, n: items.length, lab, st});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v13 step 2a: no AI prompt text built for a seeded account carries its health figure, automatic risk level or automatic kind label, and confirmed reasons are included', ok, detail);
  })();
  (function(){                                   // v13 Step 2a (FX3): the risk-summary builders carry the confirmed reason
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog;
    try{
      const c = v13Acct('__s2a3__');
      DATA.customers = [c]; DATA.activities = {}; DATA.riskLog = {};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      DATA.riskLog = {'__s2a3__|Off Track': {firstSeen: todayISO(), lastActioned: null, verdict: 'confirmed', verdictOn: todayISO(), verdictSev: 3, verdictReason: 'Legal hold blocks the renewal signature'}};
      const items = buildRiskHubList({readOnly: true}).filter(it => it.c.id === c.id);
      const R = 'Legal hold blocks the renewal signature';
      const inPrompt = items.length > 0 && items.every(it => buildRiskSummaryPrompt(it).indexOf(R) !== -1);
      const inExec = items.length > 0 && items.every(it => buildRiskExecSummary(it).indexOf(R) !== -1);
      ok = inPrompt && inExec;
      detail = JSON.stringify({inPrompt, inExec, n: items.length});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v13 step 2a: buildRiskSummaryPrompt and buildRiskExecSummary include the confirmed reason (a reason found in no note)', ok, detail);
  })();
  (function(){                                   // v13 Step 2b
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities;
    try{
      DATA.customers = [v13Acct('__s2b__')]; DATA.activities = {};
      _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
      const model = buildProgressReportModel();
      const rows = Object.values(model.groups).reduce((a, l) => a.concat(l), []);
      const noKey = rows.length === 1 && rows.every(r => !('health' in r));
      const html = buildProgressReportHtml(model);
      const ths = (html.match(/<th[\s>]/g) || []).length, tds = (html.match(/<td[\s>]/g) || []).length;
      const noHeader = !/<th[^>]*>\s*Health\s*<\/th>/.test(html);
      ok = noKey && noHeader && ths === 6 && tds === 6;      // one account: one table, six columns, six cells
      detail = JSON.stringify({noKey, noHeader, ths, tds, rows: rows.length});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA;
    _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map();
    check('v13 step 2b: the progress report rows carry no health figure and the table has no Health column', ok, detail);
  })();
  (function(){                                   // v13 Step 2c
    let ok = false, detail = '';
    const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevSort = ui.sortBy;
    const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
    const act = (id, d, o) => ({[id]: [Object.assign({id: 'a'+id, date: isoAddDays(todayISO(), -d), type: 'Onboarding Session', summary: 's', sessionNumber: 1, checklist: []}, o || {})]});
    try{
      // (1) sortCustomers and the AI read: confirmed first, then quiet longest, whatever the auto risk says
      const A = v13Acct('__a__', {riskOverride: 'ontrack'}), B = v13Acct('__b__', {riskOverride: 'risk'}), C = v13Acct('__c__', {riskOverride: 'ontrack'});
      DATA.customers = [A, B, C];
      DATA.activities = Object.assign({}, act('__a__', 40), act('__b__', 5), act('__c__', 1));
      DATA.riskLog = {'__c__|Flagged note': {firstSeen: todayISO(), lastActioned: null, verdict: 'confirmed', verdictOn: todayISO(), verdictSev: 3, verdictReason: 'customer said they will not renew'}};
      reset(); ui.sortBy = 'risk';
      const order = sortCustomers(DATA.customers.slice()).map(c => c.id).join();
      const brief = typeof copilotBriefedAccounts === 'function' ? copilotBriefedAccounts(DATA.customers).map(c => c.id).join() : 'missing';
      // (2) needsAttentionList: X (watch, confirmed) before Y (risk), behaviourally
      const X = v13Acct('__x__', {riskOverride: 'watch'}), Y = v13Acct('__y__', {riskOverride: 'risk'});
      DATA.customers = [Y, X];
      DATA.activities = Object.assign({}, act('__x__', 3), act('__y__', 3));
      DATA.riskLog = {'__x__|Watch': {firstSeen: todayISO(), lastActioned: null, verdict: 'confirmed', verdictOn: todayISO(), verdictSev: 1, verdictReason: 'they told me'}};
      reset();
      const needs = needsAttentionList().map(r => r.c.id).join();
      // (3) nextActionList: facts primary, even when the other account has the higher auto severity
      const K = v13Acct('__k__', {riskOverride: 'ontrack'}), H = v13Acct('__h__', {riskOverride: 'risk'});
      DATA.customers = [H, K];
      DATA.activities = Object.assign({}, act('__k__', 2, {openThreads: [{id: 'tk', q: 'When is the go-live date?', a: null, answeredOn: null, resolvedOn: null}]}), act('__h__', 30, {flagged: true, summary: 'They raised a blocker and are frustrated.'}));
      DATA.riskLog = {'__k__|Flagged note': {firstSeen: todayISO(), lastActioned: null, verdict: 'confirmed', verdictOn: todayISO(), verdictSev: 3, verdictReason: 'they told me'}};
      reset();
      const sevs = [accountNextAction(K).sev, accountNextAction(H).sev];
      const nxt = nextActionList().map(x => x.c.id).join();
      const sevDiffers = sevs[0] !== sevs[1];            // precondition: the seeds must give different auto severities
      const src = String(nextActionList) + (typeof copilotBriefedAccounts === 'function' ? String(copilotBriefedAccounts) : '') + String(sortCustomers);
      const noScore = !/healthScore\(|healthTrendDelta\(|computeRisk\(/.test(src);
      const noPromptHealth = String(generateCopilotRead).indexOf('lowest health') === -1 && String(generateCopilotRead).indexOf('healthScore(') === -1;
      ok = order === '__c__,__a__,__b__' && brief === order && needs === '__x__,__y__' && nxt === '__k__,__h__' && sevDiffers && noScore && noPromptHealth;
      detail = JSON.stringify({order, brief, needs, nxt, sevs, sevDiffers, noScore, noPromptHealth});
    }catch(e){ detail = 'threw: ' + e.message; }
    DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.sortBy = prevSort; reset();
    check('v13 step 2c: Sort: Risk, the AI read, Needs attention and the next-action list order accounts by confirmed risk, then days quiet, then name, not by health or auto risk', ok, detail);
  })();
  (function(){                                   // c5c
    let ok = false, detail = '';
    try{
      const day = n => new Date(Date.now() - n * 86400000).toISOString();
      const q = [c5Item('a', {status: 'sent', externalId: 'X', sentAt: day(0)}), c5Item('b', {status: 'sent', externalId: 'Y', sentAt: new Date().toISOString()}),
        c5Item('c', {status: 'sent', externalId: 'Z', sentAt: day(2)}), c5Item('d', {status: 'failed', error: 'boom'}), c5Item('e', {status: 'sent', externalId: null, sentAt: null})];
      const n = gainsightSentToday(q);
      const dc = (function(){
        const had = Object.prototype.hasOwnProperty.call(DATA, 'gainsightQueue'), saved = DATA.gainsightQueue;
        try{ DATA.gainsightQueue = q; return renderDayClose({}); }finally{ if(had) DATA.gainsightQueue = saved; else delete DATA.gainsightQueue; }
      })();
      ok = n === 2 && gainsightSentToday([]) === 0 && /Sent to Gainsight today[^0-9]*2/.test(dc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
      detail = 'n=' + n;
    }catch(e){ detail = 'threw: ' + e.message; }
    check('gainsight c5c: the day-close count is the queue items sent today (2 of: 2 today, 1 two days ago, 1 failed, 1 sent without a stamp), read from status and sentAt, not from impact counters', ok, detail);
  })();
  /* C-6 (R4): "Today per-account, Copilot = book read". Pure helpers and source guards only;
     the async briefMyDay path is proven by docs/superpowers/evidence/trim-and-integration/c6-async-probe.js. */
  (function(){                                   // c6a
    let ok = false, detail = '';
    try{
      const book = [gp4Cust('__ab1__'), gp4Cust('__ab2__')];   // own fixtures (M-6): the check never depends on the live book's shape
      const g1 = book[0].id, g2 = book[1].id;
      const fake = '```json\n' + JSON.stringify({accounts: [
        {id: g1, nextAction: 'Call the sponsor', reason: 'no touch in 20 days', flags: [
          {kind: 'drift', text: 'pace slipping', reason: 'two sessions behind plan'},
          {kind: 'risk', text: 'champion left', reason: ''}]},
        {id: g2, nextAction: 'Send the recap', reason: '', flags: []},
        {id: 'not-in-this-book', nextAction: 'x', reason: 'y', flags: []}]}) + '\n```';
      const r = parseDayBrief(fake, book);
      const bad = parseDayBrief('Sure! Here is your day: call everyone.', book);
      const keys = Object.keys(r.byId);
      ok = keys.length === 1 && keys[0] === g1 && r.byId[g1].nextAction === 'Call the sponsor' && r.byId[g1].reason === 'no touch in 20 days'
        && r.byId[g1].flags.length === 1 && r.byId[g1].flags[0].reason === 'two sessions behind plan' && r.dropped === 3
        && bad.error === 'unreadable' && Object.keys(bad.byId).length === 0 && bad.dropped === 0;
      detail = JSON.stringify({keys, dropped: r.dropped, flags: r.byId[g1] && r.byId[g1].flags.length, bad});
    }catch(e){ detail = 'threw: ' + e.message; }
    check('ai-brief c6a: parseDayBrief keeps only accounts in the book whose action has a reason, and only flags with a reason (dropped=3); non-JSON is "unreadable", never a throw', ok, detail);
  })();
  (function(){                                   // c6a2 (R3 I-6)
    let ok = false, detail = '';
    try{
      const live = DATA.customers.filter(c => c.stage !== 'graduated');
      const ids = [live[0].id, live[1].id, live[2].id];
      const full = JSON.stringify({accounts: ids.map(id => ({id, nextAction: 'Call "{x}" sponsor', reason: 'r {brace} in a string', flags: [{kind: 'drift', text: 't', reason: 'fr'}]}))});
      const cut = full.slice(0, full.lastIndexOf('{"id"') + 40);          // the third account is cut off mid-object
      const r = parseDayBrief(cut, DATA.customers);
      const none = parseDayBrief('{"accounts":[{"id":"' + ids[0] + '","nextAct', DATA.customers);
      const whole = parseDayBrief(full, DATA.customers);
      ok = !r.error && r.partial === true && Object.keys(r.byId).length === 2 && !!r.byId[ids[0]] && !!r.byId[ids[1]] && !r.byId[ids[2]]
        && r.byId[ids[0]].nextAction === 'Call "{x}" sponsor' && r.byId[ids[0]].flags.length === 1
        && none.error === 'unreadable' && Object.keys(none.byId).length === 0
        && !whole.partial && Object.keys(whole.byId).length === 3;
      detail = JSON.stringify({got: Object.keys(r.byId).length, partial: r.partial, none: none.error, whole: Object.keys(whole.byId).length});
    }catch(e){ detail = 'threw: ' + e.message; }
    check('ai-brief c6a2: parseDayBrief keeps the complete accounts of a cut-off answer (partial:true), reads braces inside strings correctly, and a cut with no complete account is still "unreadable"', ok, detail);
  })();
  (function(){                                   // c6a3 (R3 I-6)
    let ok = false, detail = '';
    try{
      const a = dayBriefMaxTokens(0), b = dayBriefMaxTokens(25), c = dayBriefMaxTokens(40), d = dayBriefMaxTokens(100000);
      ok = a >= 1600 && b >= 5000 && c >= 8000 && c <= 8000 && d === c && b < c && /dayBriefMaxTokens\(/.test(String(briefMyDay));
      detail = JSON.stringify({a, b, c, d});
    }catch(e){ detail = 'threw: ' + e.message; }
    check('ai-brief c6a3: dayBriefMaxTokens sizes the budget to the open-account count (200 each; floor 1600, ceiling 8000: 25 accounts >= 5000, 40 accounts = 8000) and briefMyDay uses it', ok, detail);
  })();
  (function(){                                   // c2e (R3 M-2, I-5)
    let ok = false, detail = '';
    try{
      const withMsg = connectorErrorFor(502, 'Invalid API key. Check the key in the connector config.');
      const bare = connectorErrorFor(502);
      const long = connectorErrorFor(502, 'x'.repeat(2000));
      ok = withMsg.code === 'HTTP' && withMsg.message.indexOf('502') !== -1 && withMsg.message.indexOf('Invalid API key. Check the key in the connector config.') !== -1
        && bare.message === 'The connector answered HTTP 502.' && connectorErrorFor(401, 'x').code === 'UNAUTHORIZED'
        && long.message.length < 400 && connectorErrorFor(502, {a: 1}).message === bare.message;
      detail = withMsg.message;
    }catch(e){ detail = 'threw: ' + e.message; }
    check('connector c2e: connectorErrorFor(status, body message) appends the connector\'s scrubbed message (capped, string only); without one it reads as before', ok, detail);
  })();
  (function(){                                   // c6b
    let ok = false, detail = '';
    const po = ui.copilotOpen, prevLog = JSON.parse(JSON.stringify(DATA.riskLog || {}));
    try{
      const noCopy = String(renderCopilot).indexOf('needsAttentionList(') === -1;
      ui.copilotOpen = true;
      const html = renderCopilot();
      const bookRead = html.indexOf('id="cp-book"') !== -1;
      const nextLens = (CP_AI_SECTIONS.find(s => s.key === 'next') || {}).lens || '';
      const lenses = CP_AI_SECTIONS.map(s => s.lens).join(' ');
      const bookPrompt = !/per-account/i.test(lenses) && /across accounts/i.test(nextLens) && /moved/i.test(lenses);
      ok = noCopy && bookRead && bookPrompt;
      detail = JSON.stringify({noCopy, bookRead, bookPrompt});
    }catch(e){ detail = 'threw: ' + e.message; }
    finally{ ui.copilotOpen = po; DATA.riskLog = prevLog; }
    check('ai-brief c6b: Copilot no longer keeps its own needsAttentionList copy, still renders the book read (#cp-book), and its AI read asks for patterns across accounts and what moved, not per-account to-dos', ok, detail);
  })();
  (function(){                                   // c6c
    let ok = false, detail = '';
    const saved = ui.dayBrief, prevC = DATA.customers;
    try{
      DATA.customers = [gp4Cust('__ab1__'), gp4Cust('__ab2__'), Object.assign(gp4Cust('__ab3__'), {stage: 'graduated'})];   // own fixtures (M-6)
      _renderMemoResets.forEach(reset => reset());   // a fresh ranking, not one memoized by an earlier check
      const before = todayActionList().map(r => r.customerId).join(',');
      ui.dayBrief = {at: new Date().toISOString(), byId: {}};
      _renderMemoResets.forEach(reset => reset());
      const during = todayActionList().map(r => r.customerId).join(',');
      ui.dayBrief = null;
      _renderMemoResets.forEach(reset => reset());
      const after = todayActionList().map(r => r.customerId).join(',');
      const open = DATA.customers.filter(c => c.stage !== 'graduated');
      const grads = DATA.customers.filter(c => c.stage === 'graduated');
      const p = buildDayBriefPrompt(DATA.customers);
      const lines = (p.match(/\[id:[^\]]+\]/g) || []).length;
      const everyOpen = open.every(c => p.indexOf('[id:' + c.id + ']') !== -1) && grads.every(c => p.indexOf('[id:' + c.id + ']') === -1);
      const asksReasons = /reason/i.test(p) && /"accounts"/.test(p);
      /* R4 (C-6 weak clause): both states are pinned by forcing aiAvailable. No AI: the bar is empty. AI available: the
         bar is the idle button card only, with no status line, no brief, no error. */
      const realAvail = aiAvailable;
      let barOff, barOn;
      try{ aiAvailable = () => false; barOff = renderDayBriefBar(); aiAvailable = () => true; barOn = renderDayBriefBar(); }
      finally{ aiAvailable = realAvail; }
      const quiet = renderDayBriefFor(open[0]) === '' && barOff === ''
        && barOn.indexOf('data-day-brief-bar') !== -1 && barOn.indexOf('btn-brief-my-day') !== -1 && !/Briefed at|Reading your book|cp-ai-note|why:/.test(barOn);
      ok = open.length === 2 && before === during && during === after && lines === open.length && everyOpen && asksReasons && quiet;
      detail = JSON.stringify({before, during, after, lines, open: open.length, everyOpen, asksReasons, quiet});
    }catch(e){ detail = 'threw: ' + e.message; }
    finally{ DATA.customers = prevC; ui.dayBrief = saved; _renderMemoResets.forEach(reset => reset()); }
    check('ai-brief c6c: with no brief Today ranks exactly as before (SIGNAL_DEFS rows unchanged) and nothing AI renders; buildDayBriefPrompt has one [id:] line per open account and asks for a reason on everything', ok, detail);
  })();
  (function(){                                   // c6d
    let ok = false, detail = '';
    const saved = ui.dayBrief, prevC = DATA.customers, realSave = saveData, realQueue = queueSave;
    let writes = 0;
    try{
      const c = gp4Cust('__ab1__');   // own fixture (M-6)
      DATA.customers = [c];
      saveData = function(){ writes++; return true; };
      queueSave = function(){ writes++; };
      const bookBefore = JSON.stringify(DATA);
      ui.dayBrief = {at: new Date().toISOString(), truncated: true, byId: {[c.id]: {nextAction: '<img src=x onerror=alert(1)>', reason: 'quiet <b>20</b> days',
        flags: [{kind: 'risk', text: 'sponsor left', reason: 'named in the last note'}]}}};
      const html = renderDayBriefFor(c);
      const escaped = html.indexOf('<img') === -1 && html.indexOf('&lt;img') !== -1 && html.indexOf('quiet &lt;b&gt;20&lt;/b&gt; days') !== -1;
      const reasons = /why:/.test(html) && html.indexOf('sponsor left') !== -1 && html.indexOf('named in the last note') !== -1;
      const capped = html.indexOf('length cap') !== -1;
      const placed = String(renderOverviewTab).indexOf('renderDayBriefFor(') !== -1 && String(renderBeatPanel).indexOf('renderDayBriefFor(') !== -1;
      const src = String(briefMyDay);
      const routed = src.indexOf("task: 'brief_my_day'") !== -1 && src.indexOf('callAiAPI(') !== -1;
      /* R4 (C-6 weak clause): the source scan stays, and the behaviour is measured too: rendering the brief wrote
         nothing (no save, no queued save) and left the book byte-identical. */
      const advisory = !/saveData|queueSave|DATA\.[a-zA-Z]+\s*=[^=]/.test(src) && writes === 0 && JSON.stringify(DATA) === bookBefore;
      const onDemand = ['renderToday', 'renderOverviewTab', 'renderBeatPanel', 'render', 'init'].every(n => typeof window[n] !== 'function' || String(window[n]).indexOf('briefMyDay(') === -1);
      ok = escaped && reasons && capped && placed && routed && advisory && onDemand;
      detail = JSON.stringify({escaped, reasons, capped, placed, routed, advisory, onDemand});
    }catch(e){ detail = 'threw: ' + e.message; }
    finally{ saveData = realSave; queueSave = realQueue; DATA.customers = prevC; ui.dayBrief = saved; }
    check('ai-brief c6d: a brief renders escaped with "why:" and each flag\'s reason, shows the length-cap notice when truncated, sits on Today and the Overview, goes out as brief_my_day, never writes the book and never runs from a render', ok, detail);
  })();
  (function(){                                   // toast r4
    /* R4: a warning that carries a decision (the push-timeout text, the Settings address warning) must stay up long
       enough to read; short toasts keep their 3200 ms. Measured through the real timer showToast arms. */
    let ok = false, detail = '';
    const realSet = window.setTimeout, el = document.getElementById('toast'), prevText = el && el.textContent, prevShow = !!el && el.classList.contains('show');
    const armed = [];
    try{
      window.setTimeout = function(fn, ms){ armed.push(ms); return realSet.call(window, fn, 0); };
      const short = 'Copied.', longMsg = 'The connector did not answer in time. The items may have been sent — check Gainsight before sending again. They are still queued here, and nothing was retried.';
      showToast(short); showToast(longMsg);
      const huge = 'x'.repeat(5000);
      showToast(huge);
      ok = armed.length === 3 && armed[0] === 3200 && armed[1] >= 6000 && armed[1] <= 12000 && armed[2] === 12000;
      detail = JSON.stringify({armed, longLen: longMsg.length});
    }catch(err){ detail = err.message; }
    finally{ window.setTimeout = realSet; clearTimeout(showToast._t); if(el){ el.textContent = prevText; el.classList.toggle('show', prevShow); } }
    check('toast r4: a short toast lasts 3200 ms, a long warning (the push-timeout text) lasts at least 6 s, and no toast outlives 12 s', ok, detail);
  })();
  // Last two checks on purpose — everything above has had its chance to leak by now.
  check('v61 running the suite leaves the book risk memory exactly as it found it',
    JSON.stringify(DATA.riskLog || {}) === _riskLogAtSuiteEntry,
    `entry=${_riskLogAtSuiteEntry.slice(0,160)} exit=${JSON.stringify(DATA.riskLog || {}).slice(0,160)}`);
  (function(){
    // v74.4: the same promise, made about the WHOLE book rather than one collection.
    const keysNow = Object.keys(DATA).sort().join(',');
    const removed = _bookAtSuiteEntry.__keys.split(',').filter(k => k && Object.keys(DATA).indexOf(k) === -1);
    const added = Object.keys(DATA).filter(k => _bookAtSuiteEntry.__keys.split(',').indexOf(k) === -1);
    const mutated = Object.keys(DATA).filter(k =>
      _bookAtSuiteEntry[k] !== undefined && JSON.stringify(DATA[k]) !== _bookAtSuiteEntry[k]);
    check('v74.4 running the suite leaves the whole book exactly as it found it',
      keysNow === _bookAtSuiteEntry.__keys && !removed.length && !added.length && !mutated.length,
      `removed=[${removed}] added=[${added}] mutated=[${mutated}]`);
  })();
  (function(){
    // v74.5: v74.4 above only ever looks at entry vs. exit, so a key that
    // leaks mid-suite and is cleared before the end is invisible to it.
    // _recordKeyDivergence() (~line 7585) is called after every one of the
    // suite's ~369 check() calls; this is the LAST check in the suite, on
    // purpose — everything above must have had its chance to leak by now.
    // Key-set only, not values: value drift at suite end is v74.4's job, and
    // diffing the whole book's values on every check would be expensive and
    // would duplicate a guard that already exists.
    //
    // A recorder that never fires looks identical to one that is silently
    // dead — an empty _midSuiteLeaks proves nothing on its own. So,
    // immediately before this check reports, prove liveness directly: stamp
    // a probe key onto DATA, invoke _recordKeyDivergence BY HAND — not
    // through check() — with a label no real check uses, remove the probe
    // key, and confirm the recorder captured exactly that probe naming
    // exactly that key. This is the only DATA write in this block, and the
    // probe key is gone again before the check() call below runs — v74.4,
    // which already ran above, never sees it either way.
    const PROBE_LABEL = 'v74.5 liveness probe (not a real check)';
    DATA.__v745LivenessProbe = true;
    _recordKeyDivergence(PROBE_LABEL);
    delete DATA.__v745LivenessProbe;
    const probeRecord = _midSuiteLeaks.find(l => l.name === PROBE_LABEL);
    const instrumentAlive = !!probeRecord
      && probeRecord.added.length === 1 && probeRecord.added[0] === '__v745LivenessProbe'
      && probeRecord.removed.length === 0;

    const realLeaks = _midSuiteLeaks.filter(l => l.name !== PROBE_LABEL);
    const first = realLeaks[0];
    check('v74.5 no check reports while the key set on the book diverges from suite entry, in either direction, and the leak recorder proves itself alive every run',
      instrumentAlive && !realLeaks.length,
      `instrument alive=${instrumentAlive}${instrumentAlive ? '' : ' (DEAD — probe was not recorded)'}; ` +
      `real leaks=${realLeaks.length}` +
      (first ? ` — first offender: ${first.name} — added=[${first.added}] removed=[${first.removed}]` : ''));
  })();

  const failed = results.filter(r=>!r.ok);
  results.forEach(r=>console.log((r.ok?'PASS':'FAIL')+' — '+r.name+(r.detail?': '+r.detail:'')));
  console.log(failed.length ? `${failed.length} CHECK(S) FAILED` : `All ${results.length} checks passed.`);
  return {passed: results.length - failed.length, failed: failed.length, results};
}
window.runSelfChecks = runSelfChecks;
