/* Builds a schemaVersion-12 "legacy" book IN MEMORY for `migration-dryrun.mjs
   --from 12` (curriculum piece 1, plan task 6). The point is a book that has
   last release's shape: shipped curriculum with NO template ids, outcome
   records with NO sourceSessionId / sourceDeliverableId, and session notes keyed
   by session NUMBER. The 12 -> 13 step must stamp every record today's matching
   can place, re-key the notes, and change no verdict.

   Evidence is written straight onto the records (the way materialize +
   setOutcomeEvidence would have, before ids existed) while the templates carry
   no ids, so the records are legacy by construction. Like legacy-seed.js, it
   does NOT run the book through prepareBookData; the harness does that. The raw
   book is stashed on window.__LEGACY_BOOK__.

   Six shapes, each one account:
     Aldridge Energy       normal Carbon account, sessions 1-3 evidenced
     CSRD Compliance Corp  reportsCSRD:true, evidenced from the CSRD curriculum
     Rewordco Metals       one evidenced deliverable reworded since (pass-2 index match)
     Orphan Partners       one evidenced deliverable the curriculum no longer carries
     Stringtotal Ltd       totalSessions: "8" as a STRING (migration must read it defensively)
     Shortplan Group       a module with 5 templates but totalSessions 8 (placeholder tail)
   Every account carries a numeric note on every session 1..8. */
(function(){
  const D = isoAddDays;
  const T = todayISO();
  const cfg = JSON.parse(JSON.stringify(DATA.config));
  // The legacy picture: no ids anywhere in the curriculum.
  Object.values(cfg.sessionTemplates).forEach(list => (list || []).forEach(t => {
    delete t.id; delete t.deliverableIds;
  }));
  // A module whose curriculum is shorter than the plan (5 sessions, plan of 8).
  const base = cfg.sessionTemplates['Carbon'];
  cfg.sessionTemplates['Short Plan Module'] = base.slice(0, 5).map(t => JSON.parse(JSON.stringify(t)));
  if(!cfg.modules.includes('Short Plan Module')) cfg.modules.push('Short Plan Module');

  const tplsFor = (mod, csrd) => {
    const key = csrd ? (mod + ' (CSRD)') : mod;
    return (cfg.sessionTemplates[key] && cfg.sessionTemplates[key].length) ? cfg.sessionTemplates[key] : cfg.sessionTemplates[mod];
  };
  let rid = 0;
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
  // Evidence on a curriculum slot, as written before ids existed.
  const evidence = (c, tpls, session, idx, textOverride, by) => {
    const tpl = tpls[session - 1];
    const rec = {id: 'oc_seed' + (rid++), text: textOverride || tpl.deliverables[idx],
      stage: tpl.ttfvStage || '', sourceSession: session, sourceIndex: idx, sourceCount: tpl.deliverables.length};
    c.outcomeCriteria.items.push(rec);
    c.outcomeEvidence[rec.id] = {on: D(T, -20 - rid), by: by || 'osm'};
    return rec;
  };
  const evidenceSessions = (c, tpls, upTo) => {
    for(let s = 1; s <= upTo; s++) tpls[s - 1].deliverables.forEach((_, i) => evidence(c, tpls, s, i));
  };
  const notes = (c, tpls) => {
    for(let s = 1; s <= 8; s++){
      const deliverables = {};
      ((tpls[s - 1] && tpls[s - 1].deliverables) || []).forEach(l => { deliverables[l] = true; });
      c.sessionNotes[String(s)] = {deliverables, prep: 'seed prep ' + c.id + ' s' + s};
    }
  };

  { const c = make('v12-normal', 'Aldridge Energy'); const t = tplsFor('Carbon', false);
    evidenceSessions(c, t, 3); notes(c, t); }
  { const t = tplsFor('Sustainability', true);
    const c = make('v12-csrd', 'CSRD Compliance Corp', {module: 'Sustainability', reportsCSRD: true, tier: 'Enterprise'});
    evidenceSessions(c, t, 2); evidence(c, t, 8, 0); notes(c, t); }
  { const t = tplsFor('Carbon', false);
    const c = make('v12-reword', 'Rewordco Metals');
    evidence(c, t, 1, 0); evidence(c, t, 1, 1);
    // ticked under older wording: stored text no longer equals the template's
    evidence(c, t, 2, 0, 'Older wording of: ' + t[1].deliverables[0]);
    notes(c, t); }
  { const t = tplsFor('Carbon', false);
    const c = make('v12-orphan', 'Orphan Partners');
    evidence(c, t, 1, 0);
    // a deliverable no template carries any more, ticked while it existed
    const rec = {id: 'oc_seed' + (rid++), text: 'Retired vendor questionnaire completed',
      stage: 'ttfv1', sourceSession: 2, sourceIndex: 40, sourceCount: t[1].deliverables.length};
    c.outcomeCriteria.items.push(rec); c.outcomeEvidence[rec.id] = {on: D(T, -33), by: 'customer'};
    notes(c, t); }
  { const t = tplsFor('Sustainability', false);
    const c = make('v12-string', 'Stringtotal Ltd', {module: 'Sustainability', totalSessions: '8'});
    evidenceSessions(c, t, 2); notes(c, t); }
  { const t = tplsFor('Short Plan Module', false);
    const c = make('v12-short', 'Shortplan Group', {module: 'Short Plan Module'});
    evidenceSessions(c, t, 2); notes(c, t); }

  const book = {
    schemaVersion: 12, config: cfg, customers, activities,
    todayLastSeenIds: null, weeklySnapshot: null, healthHistory: {}, pauseReturns: [],
    lastExportedAt: D(T, -1)
  };
  window.__LEGACY_BOOK__ = book;
  return {customers: customers.length, schemaVersion: book.schemaVersion,
    evidenceRecords: customers.reduce((s, c) => s + Object.keys(c.outcomeEvidence).length, 0)};
})()
