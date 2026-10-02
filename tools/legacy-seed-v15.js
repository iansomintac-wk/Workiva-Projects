/* Builds a schemaVersion-15 "legacy" book IN MEMORY for `migration-dryrun.mjs
   --from 15` (C-1, schema 16). The book has last release's shape: queue items are
   the old prose-only kind ({id, date, customerId, customerName, kind, payload}, plus
   the forced status 'queued' that 15 wrote), no activity has a `gong` field, no
   customer has a `gainsight` field, and stakeholders have no `email`. One activity
   carries a transcript, which the migration must leave exactly as it is.

   The 15 -> 16 step must give every queue item status 'queued', fields {},
   externalId null, sentAt null and error null; add NO gong to any activity and NO
   gainsight to any customer; add no email to any stakeholder; keep the transcript;
   and change nothing on a second pass.

   Like legacy-seed-v14.js it does NOT run the book through prepareBookData; the
   harness does that. The raw book is stashed on window.__LEGACY_BOOK__. */
(function(){
  const D = isoAddDays;
  const T = todayISO();
  const cfg = JSON.parse(JSON.stringify(DATA.config));
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
  make('v15-verdant', 'Verdant Sustainability', {module: 'Sustainability',
    stakeholders: [{id: 'sh-15-1', name: 'Alex Old', role: 'champion', note: 'no email field'}]});
  make('v15-ember', 'Emberline Carbon', {module: 'Carbon',
    stakeholders: [{id: 'sh-15-2', name: 'Sam Spaced', role: 'sponsor', note: '', email: '  sam@ember.invalid '}]});
  make('v15-northbank', 'Northbank CSRD', {module: 'Sustainability + Carbon', reportsCSRD: true, tier: 'Enterprise'});

  activities['v15-verdant'].push({id: 'a-15-1', date: D(T, -10), type: 'Session', summary: 'Session held.',
    sessionNumber: 1, checklist: [], flagged: false,
    transcript: {text: 'Speaker 1: welcome.\nSpeaker 2: thanks, shall we start with the data load?', truncated: false}});

  const q = (id, c, kind, payload, extra) => Object.assign({id, date: D(T, -3), customerId: c.id, customerName: c.name, kind, payload}, extra || {});
  const book = {
    schemaVersion: 15, config: cfg, customers, activities,
    todayLastSeenIds: null, weeklySnapshot: null, healthHistory: {}, pauseReturns: [],
    gainsightQueue: [
      q('q-15-1', customers[0], 'timeline', 'Session 1 held; next on the 14th.'),
      q('q-15-2', customers[1], 'cta', 'Open a CTA for the data-load slip.', {status: 'queued'}),
      q('q-15-3', customers[2], 'note', 'Kickoff recap.', {status: 'queued'})
    ],
    lastExportedAt: D(T, -1)
  };
  window.__LEGACY_BOOK__ = book;
  return {customers: customers.length, schemaVersion: book.schemaVersion, queue: book.gainsightQueue.length};
})()
