/* Builds a schemaVersion-14 "legacy" book IN MEMORY for `migration-dryrun.mjs
   --from 14` (ruling M3). The book has last release's shape: every account has
   goals [], exit null, graduation null, and config.goalGates exists but the
   Financial Reporting and GRC lists are EMPTY (the v14 default), except that one
   Financial Reporting list was typed by an OSM ("Typed by an OSM" under publish).
   The 14 -> 15 step must fill the empty FR and GRC lists from the new defaults,
   keep the typed list, leave Sustainability, Carbon and 'Custom Module' alone,
   leave every existing goal's copied gates alone, and change nothing on a second
   pass. GRC disclosure stays empty by design.

   Like legacy-seed-v13.js it does NOT run the book through prepareBookData; the
   harness does that. The raw book is stashed on window.__LEGACY_BOOK__.

   Seven accounts (same as the v13 seed). Ledgerwise Financial carries an
   existing publish goal with 0 gates; Controlpoint GRC an existing goal with one
   gate that was copied when the list was empty. One extra module, 'Custom Module',
   is added to config.modules with one typed gate. */
(function(){
  const D = isoAddDays;
  const T = todayISO();
  const cfg = JSON.parse(JSON.stringify(DATA.config));
  const emptySet = () => ({publish: [], setup_next: [], program: [], disclosure: []});
  cfg.goalGates = JSON.parse(JSON.stringify(cfg.goalGates || {}));
  cfg.goalGates['Financial Reporting'] = emptySet();
  cfg.goalGates['Financial Reporting'].publish = ['Typed by an OSM'];
  cfg.goalGates.GRC = emptySet();
  cfg.goalGates['Custom Module'] = emptySet();
  cfg.goalGates['Custom Module'].publish = ['Custom gate'];
  if(!cfg.modules.includes('Custom Module')) cfg.modules.push('Custom Module');
  cfg.sessionTemplates['Custom Module'] = cfg.sessionTemplates['Carbon'].slice(0, 6).map(t => JSON.parse(JSON.stringify(t)));

  const customers = [], activities = {};
  const make = (id, name, extra) => {
    const c = Object.assign({
      id, name, module: 'Carbon', stage: 'ttfv1',
      implementationDate: D(T, -150), totalSessions: 8, domainScores: {},
      sessionNotes: {}, goals: [], exit: null, graduation: null, stageHistory: [{stage: 'kickoff', date: D(T, -150)}],
      compliance: defaultCompliance(), tier: 'Mid-Market', arr: 300000, renewalDate: D(T, 120),
      outcomeCriteria: {items: [], removed: []}, outcomeEvidence: {}
    }, extra || {});
    customers.push(c); activities[id] = [];
    return c;
  };

  make('v14-verdant', 'Verdant Sustainability', {module: 'Sustainability'});
  make('v14-ember', 'Emberline Carbon', {module: 'Carbon'});
  make('v14-northbank', 'Northbank CSRD', {module: 'Sustainability + Carbon', reportsCSRD: true, tier: 'Enterprise'});
  const goal = (id, type, text, gates) => ({id, type, text, targetCycle: '', primary: true, source: 'osm', createdOn: D(T, -30),
    gates, verdict: null, verdictOn: null, verdictNote: '', supersededBy: null, changeReason: '', ackOn: null});
  make('v14-ledger', 'Ledgerwise Financial', {module: 'Financial Reporting',
    goals: [goal('gl_00000001', 'publish', 'File the 10-K', [])]});
  make('v14-grc', 'Controlpoint GRC', {module: 'GRC',
    goals: [goal('gl_00000002', 'program', 'Stand up the control library',
      [{id: 'gt_00000001', text: 'Hand-typed gate', done: false, on: null, note: ''}])]});
  make('v14-oldfield', 'Oldfield Graduated', {module: 'Sustainability', stage: 'graduated',
    stageHistory: [{stage: 'kickoff', date: D(T, -400)}, {stage: 'graduated', date: D(T, -120)}]});
  make('v14-partner', 'Partnerbuild Carbon', {module: 'Carbon',
    implementation: {phase: 'build', partner: 'Partner Co', startedOn: D(T, -60)}});

  const book = {
    schemaVersion: 14, config: cfg, customers, activities,
    todayLastSeenIds: null, weeklySnapshot: null, healthHistory: {}, pauseReturns: [],
    lastExportedAt: D(T, -1)
  };
  window.__LEGACY_BOOK__ = book;
  return {customers: customers.length, schemaVersion: book.schemaVersion};
})()
