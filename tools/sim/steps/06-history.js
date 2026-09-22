(() => {
  // History an OSM would have accumulated over ~3 months of using the tool.
  const T = todayISO(), D = isoAddDays;
  const book = cloneData(DATA);
  const by = n => book.customers.find(c => c.name === n);
  const acts = c => (book.activities[c.id] = book.activities[c.id] || []);
  let k = 0;
  const note = (n, ago, type, summary, flagged) => acts(by(n)).push({ id: 'sim' + (k++), date: D(T, -ago), type,
    summary, sessionNumber: null, checklist: [], flagged: !!flagged });
  const domains = book.config.domains;
  const people = {};

  // ---- today's three calls get clock times (Outlook would have these) ----
  by('Orion Semiconductor').nextSessionTime = '10:00';
  by('Keystone Medical Devices').nextSessionTime = '13:30';
  by('Sable Creek Energy').nextSessionTime = '15:00';

  // ---- every live account: compliance, domain scores, contacts ----
  book.customers.forEach((c, i) => {
    const done = (book.activities[c.id] || []).filter(a => a.sessionNumber).length;
    c.cadence = c.tier === 'SMB' ? 'weekly' : 'biweekly';
    if (done >= 2) domains.forEach((d, di) => { c.domainScores[d] = Math.max(1, Math.min(5, 1 + Math.round(done / 2) + ((i + di) % 3) - 1)); });
    c.compliance = c.compliance || defaultCompliance();
    if (done >= 1) c.compliance.outcomePlan = { done: true, date: D(T, -Math.min(60, 10 + done * 10)), outcomeNumber: (i % 18) + 1, planText: 'Agreed at kickoff with the sponsor.' };
    if (done >= 4) c.compliance.associatedPeopleCSAT = { done: true, date: D(T, -20), contactName: c.primaryContact || '' };
    if (done >= 5 && i % 2) c.compliance.sentiment = { done: true, date: D(T, -12), answerA: 'Team is running first workflows unaided.', answerB: 'Wants more help on review cycles.' };
  });

  // ---- stories (each exercises a different signal) ----
  // 1. Orion (call today 10:00): SOX migration, audit-committee pressure, a promise I owe
  note('Orion Semiconductor', 19, 'Session', 'Session 6: walked control owners through testing workflow. Their IA director is excited — first time testing evidence lives in one place.');
  note('Orion Semiconductor', 5, 'Session', 'Session 7: RCM import done for 212 controls. Concern: deficiency tracking fields do not match their legacy tool; they need a mapping before Q3 walkthroughs.', true);
  by('Orion Semiconductor').commitments = [
    { id: 'o1', text: 'Send deficiency-field mapping doc (legacy → Workiva)', direction: 'i_owe', due: D(T, -1), doneOn: null },
    { id: 'o2', text: 'Priya to confirm Q3 walkthrough owners', direction: 'they_owe', due: D(T, 2), doneOn: null }];
  by('Orion Semiconductor').stakeholders = [
    { id: 's1', name: 'Priya Natarajan', role: 'champion', note: 'IA director, drives adoption' },
    { id: 's2', name: 'Tom Reyes', role: 'sponsor', note: 'CAO — cares about audit committee optics' }];
  // 2. Keystone (13:30): 10-K build, tie-out question outstanding, no prep
  note('Keystone Medical Devices', 4, 'Session', 'Session 4: built the 10-K shell and linked the trial balance. Alicia asked whether XBRL tagging can be rolled forward from last year\'s filing.');
  note('Keystone Medical Devices', 2, 'Email', 'Alicia: our auditors want read-only access before we start tie-out. Who sets that up?');
  // 3. Sable Creek (15:00): kickoff-stage, Carbon, first data collection
  note('Sable Creek Energy', 15, 'Session', 'Kickoff done. Scope 1/2 inventory lives in 14 spreadsheets across 3 sites. Megan is the only person who knows the formulas — key person risk.');
  // 4. Pinnacle: CSRD wave 1, deadline pressure, escalation language, sponsor change
  note('Pinnacle Foods International', 21, 'Call', 'Elise flagged that the new CFO wants the CSRD timeline re-baselined. Frustrated that DMA is still in spreadsheets.', true);
  note('Pinnacle Foods International', 9, 'Session', 'Session 6: DMA documented for 7 of 10 topics. Escalation risk — CFO asked for a weekly status to the steering committee.', true);
  by('Pinnacle Foods International').blockers = [{ id: 'pb1', text: 'Waiting on CFO sign-off for re-baselined CSRD plan', owner: 'customer', since: D(T, -12), resolvedOn: null }];
  by('Pinnacle Foods International').stakeholders = [
    { id: 's3', name: 'Elise Fournier', role: 'champion', note: 'Sustainability lead' },
    { id: 's4', name: 'Marc Delacroix', role: 'sponsor', note: 'NEW CFO (Aug) — not yet met' }];
  // 5. Coastal Water: ghosting — 38 days, no booking
  note('Coastal Water Authority', 38, 'Session', 'Session 3: framework mapping to GRI. Nadia mentioned budget cut conversations for next fiscal year.');
  note('Coastal Water Authority', 24, 'Email', 'Sent follow-up with two times for session 4. No reply.');
  note('Coastal Water Authority', 14, 'Email', 'Second follow-up. No reply.');
  // 6. Brightline: SMB GRC, stalled on customer
  by('Brightline Staffing').blockers = [{ id: 'bb1', text: 'Customer IT has not provisioned SSO — users cannot log in', owner: 'customer', since: D(T, -26), resolvedOn: null }];
  // 7. Solaris: internal blocker (product) + commitment
  note('Solaris Chemicals', 18, 'Session', 'Session 5: risk heat map works but they need custom scoring scales per business unit. Stuck until we know if that is supported.', true);
  by('Solaris Chemicals').blockers = [{ id: 'sb1', text: 'Product: per-BU custom risk scoring scales — waiting on PSM answer', owner: 'internal', since: D(T, -16), resolvedOn: null }];
  by('Solaris Chemicals').commitments = [{ id: 'so1', text: 'Get PSM answer on per-BU scoring', direction: 'i_owe', due: D(T, -4), doneOn: null }];
  // 8. Aurora + Summit: ready to graduate, first value achieved
  ['Aurora Renewables', 'Summit Health Partners'].forEach(n => {
    by(n).firstValue = { definition: n.startsWith('Aurora') ? 'Annual sustainability report drafted fully in Workiva' : '10-Q filed from Workiva with no OSM help',
      evidence: [{ date: D(T, -25), note: 'Customer ran full review cycle without us' }], achievedOn: D(T, -25) };
    domains.forEach(d => { by(n).domainScores[d] = 4; });
    by(n).compliance.sentiment = { done: true, date: D(T, -14), answerA: 'Fully self-sufficient on core workflow.', answerB: 'Wants an advanced XBRL session later.' };
  });
  note('Aurora Renewables', 12, 'Session', 'Session 8: final session. Great call — Yusuf\'s team ran the whole report cycle. Ready for CSM handoff.');
  // 9. Evergreen: positive momentum
  note('Evergreen Packaging Co', 14, 'Session', 'Session 6: EPR data collection live across 4 plants. Champion is expanding usage to procurement team.');
  // 10. Lakeshore: SB 253 question → routes to climate consultant
  note('Lakeshore Consumer Brands', 13, 'Session', 'Session 3: CSRD topic mapping.');
  setOpenThreadsFromText(acts(by('Lakeshore Consumer Brands')).slice(-1)[0], 'Does SB 253 limited assurance change how we should structure Scope 3 evidence?\nCan one Factbook serve both CSRD and SB 253?');
  // 11. Atlas: two entities config question → partner/SA
  note('Atlas Mining Group', 16, 'Session', 'Session 4: two reporting entities need separate consolidation. Delay — their data team is behind on site-level submissions.');
  setOpenThreadsFromText(acts(by('Atlas Mining Group')).slice(-1)[0], 'Can we run two consolidation approaches (equity share vs operational control) in the same workspace?');
  // 12. Quantum Payments: IPO readiness, happy
  note('Quantum Payments', 5, 'Session', 'Session 3: S-1 drafting workflow. On track, CFO engaged and positive.');
  // 13. Ironclad: quiet, no booking, 22 days
  note('Ironclad Logistics', 22, 'Session', 'Session 4: supplier engagement survey set up. Victor out on paternity leave next month.');
  // 14. Tidewater: pause for audit season
  const tw = by('Tidewater Hospitality Group');
  tw.pause = { setOn: D(T, -6), until: D(T, 10), reason: 'Customer in year-end audit fieldwork' };
  // 15. Granite State CU: SMB, nearly done
  note('Granite State Credit Union', 13, 'Session', 'Session 7: call report roll-forward done by Paula alone. Quick win.');
  // 16. Halcyon: hot renewal / expansion signal
  note('Halcyon Biotherapeutics', 8, 'Session', 'Session 3: Renee wants to add ESG reporting next year — expansion signal, loop in AE.');
  by('Halcyon Biotherapeutics').commitments = [{ id: 'h1', text: 'Intro Renee to AE about ESG add-on', direction: 'i_owe', due: D(T, 3), doneOn: null }];

  // ---- partner-led implementations ----
  [['Nexus Data Centers', 'build', 'Deloitte', 'Anika Shah', 30, 14, 25],
   ['Riverside Pharma', 'uat', 'KPMG', 'James Porter', 40, 6, 12],
   ['Titan Industrial REIT', 'kickoff', 'EY', 'Sofia Grant', 22, 20, 45],
   ['Oakmont University Health', 'build', 'PwC', 'Leo Martins', 35, 40, 20]].forEach(([n, phase, partner, pc, started, phaseAgo, golive], i) => {
    const c = by(n);
    c.implementation = { phase, partner, partnerContact: pc, startedOn: D(T, -started), targetGoLive: D(T, golive),
      phaseHistory: [{ phase: 'kickoff', date: D(T, -started) }, { phase, date: D(T, -phaseAgo) }],
      risks: n === 'Riverside Pharma' ? [{ id: 'rr1', text: 'Trial balance mapping slipped — UAT compressed to 5 days', severity: 'high', date: D(T, -6), resolved: false }] : [] };
    acts(c).push({ id: 'imp' + i, date: D(T, -(n === 'Oakmont University Health' ? 40 : 7)), type: 'Partner Sync',
      summary: `${partner} status sync — ${phase} phase.`, sessionNumber: null, checklist: [], flagged: false });
  });

  // ---- graduated: a due check-back, and one with a CSM handoff ----
  by('Willow Creek Senior Living').gradReview = { dueOn: D(T, 0), doneOn: null, verdict: null, note: '' };
  by('Fjord Seafood ASA').gradReview = { dueOn: D(T, 10), doneOn: null, verdict: null, note: '' };
  by('Beacon Telecom').gradReview = { dueOn: D(T, -15), doneOn: D(T, -14), verdict: 'held', note: 'Filing Qs in Workiva unaided.' };

  // (impact store intentionally left as the imports credited it)
  const cand = prepareBookData(book, 'sim history');
  commitDataCandidate(cand);
  render();
  const c = DATA.customers;
  return { status: ['risk', 'watch', 'ontrack'].map(s => s + ':' + c.filter(x => computeRisk(x) === s).length).join(' '),
    impl: implementationHubList().length, callsToday: callsScheduledToday().map(x => x.at + ' ' + x.c.name),
    questions: openQuestionCount() };
})()
