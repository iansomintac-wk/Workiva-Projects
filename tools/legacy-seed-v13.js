/* Builds a schemaVersion-13 "legacy" book IN MEMORY for `migration-dryrun.mjs
   --from 13` (graduation plan, task 1). The point is a book that has last
   release's shape: NO c.goals, NO c.exit, NO c.graduation on any account, and
   NO config.goalGates. The 13 -> 14 step must give every account goals [],
   exit null and graduation null (it infers nothing, so a historic graduation
   gets no invented exit record), and add goalGates for every module key.

   Like legacy-seed-v12.js it does NOT run the book through prepareBookData;
   the harness does that. The raw book is stashed on window.__LEGACY_BOOK__.

   Seven accounts:
     Verdant Sustainability   live, Sustainability
     Emberline Carbon         live, Carbon
     Northbank CSRD           Sustainability + Carbon, reportsCSRD:true
     Ledgerwise Financial     Financial Reporting
     Controlpoint GRC         GRC
     Oldfield Graduated       Sustainability, stage 'graduated', graduated 120 days ago
     Partnerbuild Carbon      Carbon, partner-led build (implementation.phase 'build')
   One extra module, 'Custom Module', is added to config.modules. */
(function(){
  const D = isoAddDays;
  const T = todayISO();
  const cfg = JSON.parse(JSON.stringify(DATA.config));
  delete cfg.goalGates;
  if(!cfg.modules.includes('Custom Module')) cfg.modules.push('Custom Module');
  cfg.sessionTemplates['Custom Module'] = cfg.sessionTemplates['Carbon'].slice(0, 6).map(t => JSON.parse(JSON.stringify(t)));

  const customers = [], activities = {};
  const make = (id, name, extra) => {
    const c = Object.assign({
      id, name, module: 'Carbon', stage: 'ttfv1',
      implementationDate: D(T, -150), totalSessions: 8, domainScores: {},
      sessionNotes: {}, stageHistory: [{stage: 'kickoff', date: D(T, -150)}],
      compliance: defaultCompliance(), tier: 'Mid-Market', arr: 300000, renewalDate: D(T, 120),
      outcomeCriteria: {items: [], removed: []}, outcomeEvidence: {}
    }, extra || {});
    customers.push(c); activities[id] = [];
    return c;
  };

  make('v13-verdant', 'Verdant Sustainability', {module: 'Sustainability'});
  make('v13-ember', 'Emberline Carbon', {module: 'Carbon'});
  make('v13-northbank', 'Northbank CSRD', {module: 'Sustainability + Carbon', reportsCSRD: true, tier: 'Enterprise'});
  make('v13-ledger', 'Ledgerwise Financial', {module: 'Financial Reporting'});
  make('v13-grc', 'Controlpoint GRC', {module: 'GRC'});
  make('v13-oldfield', 'Oldfield Graduated', {module: 'Sustainability', stage: 'graduated',
    stageHistory: [{stage: 'kickoff', date: D(T, -400)}, {stage: 'graduated', date: D(T, -120)}]});
  make('v13-partner', 'Partnerbuild Carbon', {module: 'Carbon',
    implementation: {phase: 'build', partner: 'Partner Co', startedOn: D(T, -60)}});

  const book = {
    schemaVersion: 13, config: cfg, customers, activities,
    todayLastSeenIds: null, weeklySnapshot: null, healthHistory: {}, pauseReturns: [],
    lastExportedAt: D(T, -1)
  };
  window.__LEGACY_BOOK__ = book;
  return {customers: customers.length, schemaVersion: book.schemaVersion};
})()
