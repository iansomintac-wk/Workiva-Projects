/* A book built to show the Today tab on a day WITH CALLS ON IT.

   demo-seed.js schedules its earliest call at T+1, so the day always renders as
   an uninterrupted run of ranked work — the timeline's whole point (calls as the
   day's fixed points, work fitted into the gaps between them) never appears.
   This variant puts three calls on today at real clock times, so the day is
   measured in minutes rather than staying ordinal, and gives each of the three
   a DIFFERENT reason the OSM needs to read something before dialling.

   Run it on its own origin. localStorage is keyed by scheme://host:port, so a
   port nothing else uses cannot collide with a real book. */
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

  /* THE THREE CALLS ON TODAY. Spaced so the gaps between them are real working
     room the timeline can fit ranked work into: 09:30, 13:00, 15:30. */
  const TODAY_CALLS = {0: '09:30', 2: '13:00', 7: '15:30'};

  const customers = [], activities = {};
  const uidn = (p,i)=> p + i;

  NAMES.forEach((row, i) => {
    const [name, module, comps] = row;
    const id = uidn('best', i);
    const startedAgo = 120 + i * 9;
    const totalSessions = 8;
    const done = [6,7,5,4,8,3,6,5,7,4,6,5][i];
    const callAt = TODAY_CALLS[i];
    const c = {
      id, name, module, stage: done >= 7 ? 'ttfv2' : done >= 4 ? 'ttfv1' : 'kickoff',
      implementationDate: D(T, -startedAgo),
      totalSessions,
      components: comps,
      cadence: 'biweekly',
      targetGraduationDate: D(T, 20 + i * 7),
      // today's three first, then the rest of the week, then the far ones
      nextSessionScheduledOn: callAt ? T : (i < 6 ? D(T, i + 1) : (i < 9 ? D(T, 9 + i) : null)),
      nextSessionTime: callAt || (i < 6 ? ['09:00','11:30','14:00','15:30','10:00','13:00'][i] : undefined),
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

  /* ---- the three accounts with a call today, each prepped differently ---- */

  // 09:30 — ALDRIDGE ENERGY. Prep is WRITTEN, and the account is carrying two
  // unanswered methodology questions from the last session. This is the good
  // case: you walk in knowing what you owe them.
  const a = customers[0];
  a.sessionNotes[7] = {prep:'Bring the Scope 3 factor-source answer in writing — they will not move off the current methodology until it is settled. Second half is theirs: they drive the consolidation mapping while I watch.'};
  activities['best0'].push({id:'ald-1', date: D(T,-6), type:'Session', sessionNumber:null, checklist:[], flagged:false,
    summary:'Session 6 recap. Their controller ran the whole roll-forward unaided for the first time — no OSM hands on the keyboard. Sponsor watched and said so on the call.'});
  activities['best0'].push({id:'ald-2', date: D(T,-2), type:'Email', sessionNumber:null, checklist:[], flagged:false,
    summary:'Dana sent the draft Scope 3 boundary doc ahead of session 7 and asked us to review before we meet. Reviewed — the consolidation approach is the open item.'});
  setOpenThreadsFromText(activities['best0'][activities['best0'].length-1],
    'Can we change our Scope 3 emission factor source mid-year without restating?\nDoes the consolidation approach need to match our financial consolidation?');

  // 13:00 — CORVUS LOGISTICS. Prep NOT written, and there is a product gap they
  // are waiting on. This is the case the day is supposed to catch before 13:00.
  const b = customers[2];
  activities['best2'].push({id:'cor-1', date: D(T,-8), type:'Call', sessionNumber:null, checklist:[], flagged:true,
    summary:'They hit the bulk roll-forward limit again during month-end close. Third time. The manual workaround costs their team about a day and a half each cycle.'});
  activities['best2'].push({id:'cor-2', date: D(T,-1), type:'Email', sessionNumber:null, checklist:[], flagged:false,
    summary:'Priya asked directly whether the roadmap item has a date yet. I have not answered — need a position before session 6.'});
  setOpenThreadsFromText(activities['best2'][activities['best2'].length-1],
    'Is the bulk roll-forward on the roadmap, or is the manual workaround the answer for now?\nIf it is not committed, what do we tell their close team to plan around?');

  // 15:30 — HARBORLINE SHIPPING. Escalating risk language, an audit window
  // closing, and no prep note. The one on the day you cannot walk into cold.
  const r = customers[7];
  r.renewalDate = D(T, 47);
  activities['best7'].push({id:'har-1', date: D(T,-9), type:'Call', sessionNumber:null, checklist:[], flagged:true,
    summary:'Sponsor sounded frustrated about the timeline and mentioned they are reviewing the contract scope with procurement.'});
  activities['best7'].push({id:'har-2', date: D(T,-3), type:'Call', sessionNumber:null, checklist:[], flagged:true,
    summary:'Escalated again — they are concerned this will not be delivered before their audit window closes. Asked for a written plan with dates.'});
  setOpenThreadsFromText(activities['best7'][activities['best7'].length-1],
    'What is the committed date for controls testing to be live?\nWho signs off if the audit window closes first?');

  // --- the accounts that make the AI lens worth reading ---
  setOpenThreadsFromText(activities['best4'][activities['best4'].length-1],
    'Can the ERP connector push actuals nightly, or do we need an API pipeline?');
  setOpenThreadsFromText(activities['best6'][activities['best6'].length-1],
    'How was the workspace originally configured for our two reporting entities?');

  // GHOSTED + a re-engagement play already run and closed as no effect
  const ghost = customers[3];
  ghost.nextSessionScheduledOn = undefined;
  delete ghost.nextSessionTime;
  activities[ghost.id] = activities[ghost.id].filter(a2 => a2.sessionNumber).map(a2 =>
    Object.assign({}, a2, {date: D(T, -70)}));
  ghost.playbooks = [{id:'pb-ghost', key:'reengage', startedOn: D(T,-45),
    done:{ping: D(T,-45), alt: D(T,-42), sponsor: D(T,-38), decide: D(T,-33)},
    closedOn: D(T,-33), outcome:'no_effect'}];

  // a running play on a healthy account, so the Plays tab has something live
  customers[9].playbooks = [{id:'pb-live', key:'grad_ready', startedOn: D(T,-4),
    done:{evidence: D(T,-3)}, closedOn:null, outcome:null}];

  // a graduated account with an answered check-back, so durability has a value
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

  // implementations, all with go-live dates and phase history
  BUILDS.forEach((bd, i) => {
    const [name, phase, startedAgo, phaseAgo] = bd;
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
    impact: {events:{activity_logged: 64, gainsight_batch: 9}, since: D(T,-90)},
    lastExportedAt: D(T,-2)
  };
  const candidate = prepareBookData(book, 'calls-today demo');
  commitDataCandidate(candidate);
  ui.deckState = {}; ui.aiChapters = null;
  render();
  const day = buildDayTimeline();
  return {
    customers: DATA.customers.length,
    callsToday: callsScheduledToday().map(x => x.at + ' ' + x.c.name + (x.prepped ? ' [prepped]' : ' [NOT prepped]')),
    dayTimed: day.timed,
    dayTotalMin: day.totalMin,
    movements: day.movements.map(m => m.mkey + ' (' + m.beats.length + ')'),
    callBeatReasons: day.beats.filter(b => b.kind === 'call')
      .map(b => b.customerName + ': ' + (b.reasons.length ? b.reasons.join(' | ') : '(no merged signals)')),
    questions: openQuestionCount()
  };
})()
