/* Builds a schemaVersion-11 "legacy" book IN MEMORY and commits it to whatever
   origin the harness gives it — commitDataCandidate() only persists; unlike
   demo-seed.js it deliberately does NOT run the book through prepareBookData()
   first, because the whole point is to hand migration-dryrun.mjs a book that
   still has last year's shape: booleans on sessionNotes[n].deliverables, no
   outcomeCriteria, no outcomeEvidence. migrateData() (v11 -> v12) is what turns
   each `true` tick into an evidence record; this file's job is only to build
   the "before" picture, as realistically as demo-seed.js's account generation
   does, then poke at the seven shapes that stress that migration.

   The raw, un-migrated book is stashed on window.__LEGACY_BOOK__ so the dry-run
   harness can snapshot it before mutating it (prepareBookData migrates its
   argument IN PLACE) and feed the SAME object through the real import path. */
(function(){
  const D = isoAddDays;
  const T = todayISO();
  const cfg = JSON.parse(JSON.stringify(DATA.config)); // today's shipped curriculum — legacy books carry it too, only schemaVersion differs
  const domains = cfg.domains;
  const uidn = (p,i)=> p + i;

  const templatesFor = (mod, csrd) => {
    const key = csrd ? (mod + ' (CSRD)') : mod;
    return (cfg.sessionTemplates[key] && cfg.sessionTemplates[key].length) ? cfg.sessionTemplates[key] : cfg.sessionTemplates[mod];
  };

  const customers = [], activities = {};

  // ---- 1. Several NORMAL accounts, every ticked deliverable matching its
  //         current curriculum — the shape almost every real book is made of.
  //         Same generation pattern as demo-seed.js's NAMES loop. ----
  const NAMES = [
    ['Aldridge Energy','Carbon', 6],
    ['Brightwater Foods','Sustainability', 4],
    ['Corvus Logistics','Carbon', 7],
    ['Fernbrook Retail','Sustainability', 8],
    ['Ironvale Manufacturing','Sustainability + Carbon', 5],
    ['Kestrel Aviation','Carbon', 3]
  ];
  NAMES.forEach((row, i) => {
    const [name, module, done] = row;
    const id = uidn('legacy', i);
    const totalSessions = 8;
    const templates = templatesFor(module, false);
    const sessionNotes = {};
    for(let sN = 1; sN <= done; sN++){
      const tpl = templates[sN - 1];
      const deliverables = {};
      (tpl && tpl.deliverables || []).forEach(label => { deliverables[label] = true; });
      sessionNotes[String(sN)] = {deliverables, prep: ''};
    }
    const startedAgo = 130 + i * 11;
    const c = {
      id, name, module, stage: done >= 7 ? 'ttfv2' : done >= 4 ? 'ttfv1' : 'kickoff',
      implementationDate: D(T, -startedAgo), totalSessions,
      domainScores: {}, sessionNotes,
      stageHistory: [{stage: 'kickoff', date: D(T, -startedAgo)}],
      compliance: defaultCompliance(),
      tier: ['Enterprise','Mid-Market','Enterprise','SMB','Mid-Market','Enterprise'][i],
      arr: [1800000,420000,2100000,110000,560000,1950000][i],
      renewalDate: D(T, 90 + i * 15)
    };
    domains.forEach((d, di) => { c.domainScores[d] = [3,4,2,3][(i + di) % 4]; });
    customers.push(c);
    activities[id] = [{id: uidn('a', i), date: D(T, -(3 + i)), type: 'Other',
      summary: `Session ${done} completed. Standard cadence, no flags.`,
      sessionNumber: done, checklist: [], flagged: false}];
  });

  // ---- 2. A ticked label NO template carries any more. Plausible-but-absent:
  //         the kind of thing a CSM typed into a since-retired custom step. ----
  {
    const module = 'Carbon';
    const templates = templatesFor(module, false);
    const realLabel = templates[2].deliverables[0]; // 'Initial Scope 3 categories mapped'
    const id = 'legacy-orphanlabel';
    customers.push({
      id, name: 'Orphanlabel Metals', module, stage: 'ttfv1',
      implementationDate: D(T, -150), totalSessions: 8, domainScores: {},
      sessionNotes: {
        '3': {deliverables: {
          [realLabel]: true,
          'Legacy vendor risk questionnaire completed': true // no template carries this string
        }, prep: ''}
      },
      stageHistory: [{stage: 'kickoff', date: D(T, -150)}],
      compliance: defaultCompliance(), tier: 'SMB', arr: 160000, renewalDate: D(T, 120)
    });
    activities[id] = [];
  }

  // ---- 3. reportsCSRD:true on a module with a "<module> (CSRD)" template
  //         set, ticked from the CSRD curriculum SPECIFICALLY (session 8's
  //         double-materiality deliverable reads differently under CSRD than
  //         under the plain Sustainability curriculum at the same slot). ----
  {
    const module = 'Sustainability';
    const csrdTemplates = templatesFor(module, true);
    const csrdLabel = csrdTemplates[7].deliverables[0]; // 'Double materiality assessment documented and linked to material topic selection'
    const id = 'legacy-csrd';
    customers.push({
      id, name: 'CSRD Compliance Corp', module, reportsCSRD: true, stage: 'ttfv2',
      implementationDate: D(T, -240), totalSessions: 8, domainScores: {},
      sessionNotes: { '8': {deliverables: {[csrdLabel]: true}, prep: ''} },
      stageHistory: [{stage: 'kickoff', date: D(T, -240)}],
      compliance: defaultCompliance(), tier: 'Enterprise', arr: 2400000, renewalDate: D(T, 300)
    });
    activities[id] = [];
  }

  // ---- 4. A sessionNotes key that is not a positive integer ('3 ', trailing
  //         space). Unusable as a session reference — backfillCustomerRecord
  //         deletes the whole note a moment after migrateData runs — so its
  //         tick must migrate as a custom criterion, not vanish. Uses a label
  //         that DOES exist in the real curriculum, to prove the bad key alone
  //         (not the label) is what forces the orphan path. ----
  {
    const module = 'Carbon';
    const templates = templatesFor(module, false);
    const realLabel = templates[2].deliverables[1]; // 'Bulk upload template configured for recurring data loads'
    const id = 'legacy-badkey';
    customers.push({
      id, name: 'Badkey Industries', module, stage: 'ttfv1',
      implementationDate: D(T, -110), totalSessions: 8, domainScores: {},
      sessionNotes: { '3 ': {deliverables: {[realLabel]: true}, prep: ''} },
      stageHistory: [{stage: 'kickoff', date: D(T, -110)}],
      compliance: defaultCompliance(), tier: 'Mid-Market', arr: 300000, renewalDate: D(T, 150)
    });
    activities[id] = [];
  }

  // ---- 5. totalSessions ABSENT entirely, carrying ticks. The migration reads
  //         it defensively (planLength falls back to 8) because it runs before
  //         applyDataBackfills would normalize it. ----
  {
    const module = 'Sustainability';
    const templates = templatesFor(module, false);
    const id = 'legacy-nototal';
    const sessionNotes = {};
    [1, 2].forEach(sN => {
      const deliverables = {};
      templates[sN - 1].deliverables.forEach(label => { deliverables[label] = true; });
      sessionNotes[String(sN)] = {deliverables, prep: ''};
    });
    customers.push({
      id, name: 'Notally Reporting LLC', module, stage: 'kickoff',
      implementationDate: D(T, -70), domainScores: {}, // totalSessions intentionally omitted
      sessionNotes,
      stageHistory: [{stage: 'kickoff', date: D(T, -70)}],
      compliance: defaultCompliance(), tier: 'SMB', arr: 95000, renewalDate: D(T, 200)
    });
    activities[id] = [];
  }

  // ---- 6. A tick set to false (unticked) — must NOT migrate into anything. ----
  {
    const module = 'Carbon';
    const templates = templatesFor(module, false);
    const label = templates[0].deliverables[0]; // 'Team members assigned correct Carbon roles'
    const id = 'legacy-unticked';
    customers.push({
      id, name: 'Notyet Partners', module, stage: 'kickoff',
      implementationDate: D(T, -20), totalSessions: 8, domainScores: {},
      sessionNotes: { '1': {deliverables: {[label]: false}, prep: ''} },
      stageHistory: [{stage: 'kickoff', date: D(T, -20)}],
      compliance: defaultCompliance(), tier: 'SMB', arr: 80000, renewalDate: D(T, 220)
    });
    activities[id] = [];
  }

  // ---- 7. The SAME label ticked in two different sessions. It matches no
  //         real curriculum slot in either session, so both ticks resolve to
  //         the orphan (sourceSession:null) path and MUST dedupe onto the same
  //         custom criterion rather than minting two, or splitting evidence. ----
  {
    const module = 'Sustainability + Carbon';
    const id = 'legacy-duplabel';
    const label = 'Regulatory update briefing shared with steering committee'; // not in any template
    customers.push({
      id, name: 'Repeatco Advisory', module, stage: 'ttfv1',
      implementationDate: D(T, -160), totalSessions: 8, domainScores: {},
      sessionNotes: {
        '2': {deliverables: {[label]: true}, prep: ''},
        '5': {deliverables: {[label]: true}, prep: ''}
      },
      stageHistory: [{stage: 'kickoff', date: D(T, -160)}],
      compliance: defaultCompliance(), tier: 'Mid-Market', arr: 340000, renewalDate: D(T, 170)
    });
    activities[id] = [];
  }

  const book = {
    schemaVersion: 11,
    config: cfg,
    customers, activities,
    todayLastSeenIds: null,
    weeklySnapshot: null,
    healthHistory: {},
    pauseReturns: [],
    lastExportedAt: D(T, -1)
  };

  // Commit the RAW v11 book, deliberately bypassing prepareBookData/migrateData
  // — commitDataCandidate() only persists (saveData()), it runs no migration.
  commitDataCandidate(book);
  window.__LEGACY_BOOK__ = book;
  ui.deckState = {}; ui.copilotOpen = false; ui.aiChapters = null;
  render();
  return {
    customers: DATA.customers.length,
    schemaVersion: DATA.schemaVersion
  };
})()
