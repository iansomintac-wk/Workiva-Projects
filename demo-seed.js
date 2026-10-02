/* Builds a "best state" book IN MEMORY and commits it to THIS origin only.
   Run on 127.0.0.1:8801 — a different origin from the real book on :8800, so
   localStorage cannot collide. Nothing here touches the real data. */
(function(){
  const D = isoAddDays;
  const T = todayISO();
  const mod = DATA.config.modules[0];
  const domains = DATA.config.domains;

  const NAMES = [
    ['Aldridge Energy','Carbon',['sec','risk']],
    ['Brightwater Foods','Sustainability',['sec']],
    ['Corvus Logistics','Carbon',['sec','controls','risk']],
    ['Delta Fields Mining','Sustainability',['risk']],
    ['Eastmark Pharma','Carbon',['sec','audit']],
    ['Fernbrook Retail','Sustainability',['policies']],
    ['Granite Peak Utilities','Carbon',['sec','controls']],
    ['Harborline Shipping','Sustainability',['risk','audit']],
    ['Ironvale Manufacturing','Carbon',['controls']],
    ['Juniper Health','Sustainability',['sec','policies','risk']],
    ['Kestrel Aviation','Carbon',['sec']],
    ['Lumen Financial','Sustainability',['audit','controls']]
  ];
  const BUILDS = [
    ['Meridian Chemicals','build', 40, 25],
    ['Northgate Insurance','uat', 70, 12],
    ['Orchard Grove Agri','kickoff', 15, 9],
    ['Pinecrest Media','build', 55, 41]
  ];

  const customers = [], activities = {};
  const uidn = (p,i)=> p + i;

  NAMES.forEach((row, i) => {
    const [name, module, comps] = row;
    const id = uidn('best', i);
    const startedAgo = 120 + i * 9;
    const totalSessions = 8;
    const done = [6,7,5,4,8,3,6,5,7,4,6,5][i];
    const c = {
      id, name, module, stage: done >= 7 ? 'ttfv2' : done >= 4 ? 'ttfv1' : 'kickoff',
      implementationDate: D(T, -startedAgo),
      totalSessions,
      components: comps,
      cadence: 'biweekly',
      targetGraduationDate: D(T, 20 + i * 7),
      nextSessionScheduledOn: i < 5 ? D(T, i + 1) : (i < 8 ? D(T, 9 + i) : null),
      nextSessionTime: i < 5 ? ['09:00','11:30','14:00','15:30','10:00'][i] : undefined,
      tier: ['Enterprise','Mid-Market','Enterprise','SMB','Enterprise','Mid-Market','Enterprise','Mid-Market','SMB','Enterprise','Mid-Market','Enterprise'][i],
      arr: [2400000,450000,1800000,120000,3100000,620000,1950000,540000,95000,2750000,680000,1450000][i],
      renewalDate: D(T, 60 + i * 21),
      domainScores: {},
      sessionNotes: {},
      stageHistory: [{stage:'kickoff', date: D(T, -startedAgo)}],
      compliance: {
        sentiment: {done:true, date: D(T,-10), answerA:'The close checklist landed — their controller now runs it unaided.', answerB:'They want deeper variance commentary before the next filing.'},
        outcomePlan: {done:true, date: D(T,-30), outcomeNumber: (i % 18) + 1, planText:'Agreed at kickoff and reconfirmed at TTFV-1.'},
        associatedPeopleCSAT: {done:true, date: D(T,-20), contactName: ['Dana Whitfield','Marcus Lee','Priya Raman','Tom Okafor','Elena Sokolov','Ben Carter','Aisha Noor','Greg Halvorsen','Mei Tanaka','Rafael Duarte','Nina Petrova','Sam Ellison'][i]}
      },
      /* Shape per getFirstValue(): a definition, an evidence ARRAY, and the date
         it was achieved. The book's own validator rejected the first draft of
         this fixture, which is the loader doing exactly its job. */
      firstValue: {definition:'A full filing produced end-to-end in Workiva without OSM hands on the keyboard.',
        evidence:[{date: D(T,-46), note:'Q2 filing assembled and reviewed in-platform'},
                  {date: D(T,-45), note:'Controller ran the close checklist unaided'}],
        achievedOn: D(T,-45)}
    };
    domains.forEach((d, di) => { c.domainScores[d] = [4,3,4,2,3,4,3,2,4,3][(i+di) % 10]; });

    const acts = [];
    for(let sN = 1; sN <= done; sN++){
      acts.push({id: uidn('a'+i+'s', sN), date: D(T, -(startedAgo - sN * 12)), type:'Other',
        summary:`Session ${sN} completed. Walked the workflow end to end; they drove the second half.`,
        sessionNumber: sN, checklist: [], flagged: false});
    }
    acts.push({id: uidn('a'+i+'c', 1), date: D(T, -(4 + i)), type:'Call',
      summary:'Check-in ahead of the next session. They are on track and asked two follow-ups.',
      sessionNumber: null, checklist: [], flagged: false});
    activities[id] = acts;
    customers.push(c);
  });

  // --- the accounts that make the AI lens worth reading ---
  // 1. a carbon-methodology question -> Climate Consultant
  setOpenThreadsFromText(activities['best0'][activities['best0'].length-1],
    'Can we change our Scope 3 emission factor source mid-year without restating?\nDoes the consolidation approach need to match our financial consolidation?');
  // 2. a product gap -> Product Success Manager
  setOpenThreadsFromText(activities['best2'][activities['best2'].length-1],
    'Is the bulk roll-forward on the roadmap, or is the manual workaround the answer for now?');
  // 3. an integration question -> Solution Architect
  setOpenThreadsFromText(activities['best4'][activities['best4'].length-1],
    'Can the ERP connector push actuals nightly, or do we need an API pipeline?');
  // 4. a build question -> Partner implementation team
  setOpenThreadsFromText(activities['best6'][activities['best6'].length-1],
    'How was the workspace originally configured for our two reporting entities?');

  // 5. GHOSTED + a re-engagement play already run and closed as no effect
  const ghost = customers[3];
  ghost.nextSessionScheduledOn = undefined;
  activities[ghost.id] = activities[ghost.id].filter(a => a.sessionNumber).map(a =>
    Object.assign({}, a, {date: D(T, -70)}));
  ghost.playbooks = [{id:'pb-ghost', key:'reengage', startedOn: D(T,-45),
    done:{ping: D(T,-45), alt: D(T,-42), sponsor: D(T,-38), decide: D(T,-33)},
    closedOn: D(T,-33), outcome:'no_effect'}];

  // 6. escalating risk language -> Account Executive
  const risky = customers[7];
  activities[risky.id].push({id:'risk-note-1', date: D(T,-9), type:'Call',
    summary:'Sponsor sounded frustrated about the timeline and mentioned they are reviewing the contract scope.',
    sessionNumber:null, checklist:[], flagged:true});
  activities[risky.id].push({id:'risk-note-2', date: D(T,-3), type:'Call',
    summary:'Escalated again — they are concerned this will not be delivered before their audit window.',
    sessionNumber:null, checklist:[], flagged:false});

  // 7. a running play on a healthy account, so the Plays tab has something live
  customers[9].playbooks = [{id:'pb-live', key:'grad_ready', startedOn: D(T,-4),
    done:{evidence: D(T,-3)}, closedOn:null, outcome:null}];

  // 8. a graduated account with an answered check-back (the grad-review state the check-back checks read)
  const grad = {
    id:'best-grad', name:'Summit Grain Co', module: mod, stage:'graduated',
    implementationDate: D(T,-260), totalSessions:8, components:['sec'], cadence:'biweekly',
    targetGraduationDate: D(T,-50), domainScores:{}, sessionNotes:{},
    stageHistory:[{stage:'kickoff',date:D(T,-260)},{stage:'graduated',date:D(T,-50)}],
    compliance:{sentiment:{done:true,date:D(T,-55),answerA:'Fully self-sufficient.',answerB:'None raised.'},
      outcomePlan:{done:true,date:D(T,-200),outcomeNumber:4,planText:''},
      associatedPeopleCSAT:{done:true,date:D(T,-60),contactName:'Laura Benn'}},
    tier:'Mid-Market', arr:390000, renewalDate: D(T,120),
    gradReview:{dueOn: D(T,-20), doneOn: D(T,-18), verdict:'held', note:'Still filing in Workiva each quarter.'}
  };
  domains.forEach(d => { grad.domainScores[d] = 4; });
  customers.push(grad);
  activities['best-grad'] = [{id:'g1', date:D(T,-55), type:'Other', summary:'Session 8 completed.',
    sessionNumber:8, checklist:[], flagged:false}];

  // 9. implementations, all with go-live dates and phase history
  BUILDS.forEach((b, i) => {
    const [name, phase, startedAgo, phaseAgo] = b;
    const id = 'bld' + i;
    customers.push({
      id, name, module: mod, stage:'kickoff',
      implementationDate: D(T,-startedAgo), totalSessions:8, domainScores:{}, sessionNotes:{},
      stageHistory:[{stage:'kickoff', date: D(T,-startedAgo)}],
      compliance:{sentiment:{done:false,date:null,answerA:'',answerB:''},
        outcomePlan:{done:false,date:null,outcomeNumber:null,planText:''},
        associatedPeopleCSAT:{done:false,date:null,contactName:''}},
      tier:'Mid-Market', arr: 300000 + i*90000, renewalDate: D(T, 200 + i*30),
      implementation:{phase, partner:'Deloitte', partnerContact:'A. Partner',
        startedOn: D(T,-startedAgo), targetGoLive: D(T, 20 + i*15),
        phaseHistory:[{phase:'kickoff', date:D(T,-startedAgo)},{phase, date:D(T,-phaseAgo)}],
        risks: i === 1 ? [{id:'ir1', text:'Data migration slipped a week; UAT window is tight.',
          severity:'high', date:D(T,-6), resolved:false}] : []}
    });
    activities[id] = [{id:'b'+i+'a', date: D(T,-(i===3?30:5)), type:'Partner Sync',
      summary:'Partner status sync — build tracking to plan.', sessionNumber:null, checklist:[], flagged:false}];
  });

  const book = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    config: JSON.parse(JSON.stringify(DATA.config)),
    customers, activities,
    healthHistory: {}, riskLog: {}, pauseReturns: [],
    weeklySnapshot: {ids: [customers[3].id, customers[7].id], date: D(T,-7)},
    lastExportedAt: D(T,-2)
  };
  const candidate = prepareBookData(book, 'best-state demo');
  commitDataCandidate(candidate);
  ui.deckState = {}; ui.copilotOpen = true; ui.aiChapters = null;
  render();
  return {
    customers: DATA.customers.length,
    live: DATA.customers.filter(c=>c.stage!=='graduated' && !inImplementation(c)).length,
    builds: implementationHubList().length,
    calls7: callsToPrepare(7).length,
    questions: openQuestionCount(),
    nextActions: nextActionList().length,
    routed: nextActionList().filter(x=>x.route).map(x=>x.c.name+' -> '+x.route.role),
    transitions: nextActionList().filter(x=>x.transition).map(x=>x.c.name+' ('+x.transition.kind+')'),
    adminGaps: adminGapCount()
  };
})()
